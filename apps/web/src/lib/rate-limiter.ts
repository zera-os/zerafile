// Client-side rate limiting utilities
interface RateLimitEntry {
  timestamp: number;
  size: number;
}

interface RateLimitStore {
  files: RateLimitEntry[];
  data: RateLimitEntry[];
}

class ClientRateLimiter {
  private readonly FILE_LIMIT = 10; // 10 files
  private readonly FILE_WINDOW = 30 * 60 * 1000; // 30 minutes
  private readonly DATA_LIMIT = 20 * 1024 * 1024; // 20MB
  private readonly DATA_WINDOW = 10 * 60 * 1000; // 10 minutes
  private readonly STORAGE_KEY = 'zerafile_rate_limit';

  private getStore(): RateLimitStore {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      // Silently fail to load rate limit data
    }
    return { files: [], data: [] };
  }

  private setStore(store: RateLimitStore): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      // Silently fail to save rate limit data
    }
  }

  private cleanup(store: RateLimitStore): RateLimitStore {
    const now = Date.now();
    
    return {
      files: store.files.filter(entry => now - entry.timestamp < this.FILE_WINDOW),
      data: store.data.filter(entry => now - entry.timestamp < this.DATA_WINDOW)
    };
  }

  checkFileLimit(): { allowed: boolean; remaining: number; resetTime: number } {
    const store = this.cleanup(this.getStore());
    const now = Date.now();
    
    const recentFiles = store.files.filter(
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

  checkDataLimit(fileSize: number): { allowed: boolean; remaining: number; resetTime: number } {
    const store = this.cleanup(this.getStore());
    const now = Date.now();
    
    const recentData = store.data.filter(
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

  recordUpload(fileSize: number): void {
    const store = this.cleanup(this.getStore());
    const now = Date.now();
    
    const entry: RateLimitEntry = { timestamp: now, size: fileSize };
    store.files.push(entry);
    store.data.push(entry);
    
    this.setStore(store);
  }

  getStatus(): {
    files: { used: number; limit: number; remaining: number; resetTime: number };
    data: { used: number; limit: number; remaining: number; resetTime: number };
  } {
    const store = this.cleanup(this.getStore());
    const now = Date.now();
    
    const recentFiles = store.files.filter(
      entry => now - entry.timestamp < this.FILE_WINDOW
    );
    const recentData = store.data.filter(
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

export const clientRateLimiter = new ClientRateLimiter();

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
