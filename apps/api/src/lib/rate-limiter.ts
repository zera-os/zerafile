import { FastifyRequest, FastifyReply } from 'fastify';

interface RateLimitEntry {
  timestamp: number;
  size: number;
}

interface RateLimitStore {
  [ip: string]: {
    files: RateLimitEntry[];
    data: RateLimitEntry[];
  };
}

class CustomRateLimiter {
  private store: RateLimitStore = {};
  private readonly FILE_LIMIT = 10; // 10 files
  private readonly FILE_WINDOW = 30 * 60 * 1000; // 30 minutes
  private readonly DATA_LIMIT = 20 * 1024 * 1024; // 20MB
  private readonly DATA_WINDOW = 10 * 60 * 1000; // 10 minutes

  private cleanup() {
    const now = Date.now();
    
    for (const ip in this.store) {
      const userData = this.store[ip];
      
      // Clean up old file entries (older than 30 minutes)
      userData.files = userData.files.filter(
        entry => now - entry.timestamp < this.FILE_WINDOW
      );
      
      // Clean up old data entries (older than 10 minutes)
      userData.data = userData.data.filter(
        entry => now - entry.timestamp < this.DATA_WINDOW
      );
      
      // Remove IP if no entries left
      if (userData.files.length === 0 && userData.data.length === 0) {
        delete this.store[ip];
      }
    }
  }

  private getClientIP(request: FastifyRequest): string {
    return request.ip || 
           request.headers['x-forwarded-for'] as string || 
           request.headers['x-real-ip'] as string || 
           'unknown';
  }

  checkFileLimit(request: FastifyRequest): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    const ip = this.getClientIP(request);
    const now = Date.now();
    
    if (!this.store[ip]) {
      this.store[ip] = { files: [], data: [] };
    }
    
    const userData = this.store[ip];
    const recentFiles = userData.files.filter(
      entry => now - entry.timestamp < this.FILE_WINDOW
    );
    
    const remaining = Math.max(0, this.FILE_LIMIT - recentFiles.length);
    const resetTime = recentFiles.length > 0 
      ? recentFiles[0].timestamp + this.FILE_WINDOW 
      : now + this.FILE_WINDOW;
    
    return {
      allowed: recentFiles.length < this.FILE_LIMIT,
      remaining,
      resetTime
    };
  }

  checkDataLimit(request: FastifyRequest, fileSize: number): { allowed: boolean; remaining: number; resetTime: number } {
    this.cleanup();
    const ip = this.getClientIP(request);
    const now = Date.now();
    
    if (!this.store[ip]) {
      this.store[ip] = { files: [], data: [] };
    }
    
    const userData = this.store[ip];
    const recentData = userData.data.filter(
      entry => now - entry.timestamp < this.DATA_WINDOW
    );
    
    const totalData = recentData.reduce((sum, entry) => sum + entry.size, 0);
    const remaining = Math.max(0, this.DATA_LIMIT - totalData);
    const resetTime = recentData.length > 0 
      ? recentData[0].timestamp + this.DATA_WINDOW 
      : now + this.DATA_WINDOW;
    
    return {
      allowed: totalData + fileSize <= this.DATA_LIMIT,
      remaining,
      resetTime
    };
  }

  recordUpload(request: FastifyRequest, fileSize: number) {
    this.cleanup();
    const ip = this.getClientIP(request);
    const now = Date.now();
    
    if (!this.store[ip]) {
      this.store[ip] = { files: [], data: [] };
    }
    
    const entry: RateLimitEntry = { timestamp: now, size: fileSize };
    this.store[ip].files.push(entry);
    this.store[ip].data.push(entry);
  }

  getStatus(request: FastifyRequest): {
    files: { used: number; limit: number; remaining: number; resetTime: number };
    data: { used: number; limit: number; remaining: number; resetTime: number };
  } {
    this.cleanup();
    const ip = this.getClientIP(request);
    const now = Date.now();
    
    if (!this.store[ip]) {
      this.store[ip] = { files: [], data: [] };
    }
    
    const userData = this.store[ip];
    const recentFiles = userData.files.filter(
      entry => now - entry.timestamp < this.FILE_WINDOW
    );
    const recentData = userData.data.filter(
      entry => now - entry.timestamp < this.DATA_WINDOW
    );
    
    const totalData = recentData.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      files: {
        used: recentFiles.length,
        limit: this.FILE_LIMIT,
        remaining: Math.max(0, this.FILE_LIMIT - recentFiles.length),
        resetTime: recentFiles.length > 0 ? recentFiles[0].timestamp + this.FILE_WINDOW : now + this.FILE_WINDOW
      },
      data: {
        used: totalData,
        limit: this.DATA_LIMIT,
        remaining: Math.max(0, this.DATA_LIMIT - totalData),
        resetTime: recentData.length > 0 ? recentData[0].timestamp + this.DATA_WINDOW : now + this.DATA_WINDOW
      }
    };
  }
}

export const rateLimiter = new CustomRateLimiter();

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatTimeUntilReset(resetTime: number): string {
  const now = Date.now();
  const diff = resetTime - now;
  
  if (diff <= 0) return 'now';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}
