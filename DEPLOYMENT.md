# ZERAfile Ubuntu Deployment Guide

## Prerequisites
- DigitalOcean Droplet (Ubuntu 24.04 LTS recommended)
- Domain: `zerafile.io` pointing to your droplet
- DigitalOcean Spaces bucket for file storage
- SSH access to your droplet

## 🚀 Quick Start (Automated Deployment)

### Option 1: Automated Script (Recommended)
```bash
# Download and run the automated deployment script
wget https://raw.githubusercontent.com/zera-os/zerafile/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```

**What the automated script does:**
- ✅ Installs all dependencies (Node.js, pnpm, PM2, Nginx, Certbot, Git, UFW)
- ✅ Sets up application directory and clones repository
- ✅ Installs dependencies and builds all applications
- ✅ Configures PM2 for process management
- ✅ Sets up Nginx reverse proxy configurations
- ✅ Configures UFW firewall
- ✅ Starts all services

**What you still need to do manually:**
- ❌ Create environment files (see Step 3 below)
- ❌ Set up SSL certificates (see Step 4 below)
- ❌ Configure DigitalOcean Spaces (see Step 5 below)

---

## 📋 Manual Deployment Steps

### Step 1: Initial Server Setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx web server
sudo apt install nginx -y

# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y

# Install UFW firewall
sudo apt install ufw -y
```

### Step 2: Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/zerafile
sudo chown $USER:$USER /var/www/zerafile

# Clone your repository
cd /var/www/zerafile
git clone https://github.com/zera-os/zerafile.git .

# Install dependencies
pnpm install

# Build all applications (shared package builds first, then API and web)
pnpm build
```

### Step 3: Environment Configuration ⚠️ **REQUIRED**

#### API Environment File
```bash
# Create API environment file
sudo nano /var/www/zerafile/apps/api/.env
```

**Content for `/var/www/zerafile/apps/api/.env`:**
```bash
# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_REGION=us-east-1
SPACES_BUCKET=zerafile
SPACES_KEY=your_actual_spaces_access_key_here
SPACES_SECRET=your_actual_spaces_secret_key_here

# CDN URL
CDN_BASE_URL=https://cdn.zerafile.io

# Server Configuration
PORT=8080
NODE_ENV=production
```

#### Web App Environment File
```bash
# Create web app environment file
sudo nano /var/www/zerafile/apps/web/.env.local
```

**Content for `/var/www/zerafile/apps/web/.env.local`:**
```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://api.zerafile.io
NEXT_PUBLIC_CDN_BASE=https://cdn.zerafile.io

# Next.js Configuration
NODE_ENV=production
```

#### Alternative: Copy from Templates
```bash
# Copy template files
cp /var/www/zerafile/env-api-template.txt /var/www/zerafile/apps/api/.env
cp /var/www/zerafile/env-web-template.txt /var/www/zerafile/apps/web/.env.local

# Edit with your actual values
sudo nano /var/www/zerafile/apps/api/.env
sudo nano /var/www/zerafile/apps/web/.env.local
```

### Step 4: PM2 Configuration

The `ecosystem.config.js` file should already exist in the repository root. If not, create it:

```bash
# Check if ecosystem.config.js exists
ls -la /var/www/zerafile/ecosystem.config.js

# If it doesn't exist, create it
sudo nano /var/www/zerafile/ecosystem.config.js
```

**Content for `ecosystem.config.js`:**
```javascript
module.exports = {
  apps: [
    {
      name: 'zerafile-api',
      cwd: '/var/www/zerafile/apps/api',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 8080
      },
      error_file: '/var/log/pm2/zerafile-api-error.log',
      out_file: '/var/log/pm2/zerafile-api-out.log',
      log_file: '/var/log/pm2/zerafile-api.log',
      time: true
    },
    {
      name: 'zerafile-web',
      cwd: '/var/www/zerafile/apps/web',
      script: 'npm',
      args: 'start',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/var/log/pm2/zerafile-web-error.log',
      out_file: '/var/log/pm2/zerafile-web-out.log',
      log_file: '/var/log/pm2/zerafile-web.log',
      time: true
    }
  ]
};
```

```bash
# Create PM2 log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### Step 5: Nginx Configuration

#### Main Site Configuration
```bash
sudo nano /etc/nginx/sites-available/zerafile.io
```

**Content:**
```nginx
server {
    listen 80;
    server_name zerafile.io www.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zerafile.io www.zerafile.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### API Configuration
```bash
sudo nano /etc/nginx/sites-available/api.zerafile.io
```

**Content:**
```nginx
server {
    listen 80;
    server_name api.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zerafile.io;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### CDN Configuration
```bash
sudo nano /etc/nginx/sites-available/cdn.zerafile.io
```

**Content:**
```nginx
server {
    listen 80;
    server_name cdn.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cdn.zerafile.io;

    location / {
        proxy_pass https://zerafile.nyc3.digitaloceanspaces.com;
        proxy_set_header Host zerafile.nyc3.digitaloceanspaces.com;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header ETag $upstream_http_etag;
    }
}
```

#### Enable Nginx Sites
```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/zerafile.io /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api.zerafile.io /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/cdn.zerafile.io /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 6: SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d zerafile.io -d www.zerafile.io -d api.zerafile.io -d cdn.zerafile.io

# Test certificate renewal
sudo certbot renew --dry-run
```

### Step 7: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check firewall status
sudo ufw status
```

### Step 8: DigitalOcean Spaces Setup

1. **Create Spaces Bucket:**
   - Go to DigitalOcean Control Panel
   - Create a new Space named `zerafile`
   - Choose region (recommend `nyc3`)

2. **Set CORS Policy:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedOrigins": ["https://zerafile.io", "https://api.zerafile.io"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. **Set Bucket Policy (Make Files Public):**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::zerafile/*"
    }
  ]
}
```

---

## 🔄 Application Updates

### Pull Latest Changes and Update
```bash
# Navigate to application directory
cd /var/www/zerafile

# Pull latest changes from repository
git pull

# Install any new dependencies
pnpm install

# Rebuild all applications
pnpm build

# Restart PM2 processes
pm2 restart all
```

### Update Individual Services
```bash
# Update only API
cd /var/www/zerafile/apps/api
git pull
pnpm install
pnpm build
pm2 restart zerafile-api

# Update only Web app
cd /var/www/zerafile/apps/web
git pull
pnpm install
pnpm build
pm2 restart zerafile-web
```

### Update Environment Variables
```bash
# Edit environment files
sudo nano /var/www/zerafile/apps/api/.env
sudo nano /var/www/zerafile/apps/web/.env.local

# Restart services to pick up new environment variables
pm2 restart all
```

---

## 🛠️ Useful Commands

### Application Management
```bash
# Check application status
pm2 status

# View logs
pm2 logs zerafile-api
pm2 logs zerafile-web
pm2 logs --lines 100

# Restart applications
pm2 restart all
pm2 restart zerafile-api
pm2 restart zerafile-web

# Stop applications
pm2 stop all
pm2 stop zerafile-api

# Start applications
pm2 start all
pm2 start zerafile-api

# Reload applications (zero-downtime)
pm2 reload all
```

### System Management
```bash
# Check Nginx status
sudo systemctl status nginx
sudo nginx -t
sudo systemctl restart nginx

# Check firewall status
sudo ufw status

# Check disk usage
df -h
du -sh /var/www/zerafile

# Check memory usage
free -h
htop
```

### Logs and Debugging
```bash
# View PM2 logs
pm2 logs --lines 50

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View system logs
sudo journalctl -u nginx -f
sudo journalctl -u pm2-$USER -f
```

### Testing Endpoints
```bash
# Test API health
curl https://api.zerafile.io/health

# Test main site
curl https://zerafile.io

# Test CDN
curl https://cdn.zerafile.io

# Test with verbose output
curl -v https://api.zerafile.io/health
```

---

## 🔧 Troubleshooting

### Common Issues

#### Applications Not Starting
```bash
# Check PM2 status
pm2 status

# Check logs for errors
pm2 logs zerafile-api
pm2 logs zerafile-web

# Check if ports are in use
sudo netstat -tlnp | grep :3000
sudo netstat -tlnp | grep :8080
```

#### Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Restart Nginx
sudo systemctl restart nginx
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Test renewal
sudo certbot renew --dry-run
```

#### Environment Variable Issues
```bash
# Check if environment files exist
ls -la /var/www/zerafile/apps/api/.env
ls -la /var/www/zerafile/apps/web/.env.local

# Check file permissions
ls -la /var/www/zerafile/apps/api/.env
```

### Performance Monitoring
```bash
# Monitor system resources
htop
iotop
nethogs

# Monitor PM2 processes
pm2 monit

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s https://api.zerafile.io/health
```

---

## 📊 Verification Checklist

After deployment, verify everything is working:

- [ ] **Main Site**: `https://zerafile.io` loads correctly
- [ ] **API Health**: `https://api.zerafile.io/health` returns `{"status":"ok"}`
- [ ] **CDN**: `https://cdn.zerafile.io` proxies to DigitalOcean Spaces
- [ ] **SSL**: All sites have valid SSL certificates
- [ ] **PM2**: Both applications are running (`pm2 status`)
- [ ] **Nginx**: All sites are enabled and working
- [ ] **Firewall**: UFW is active and configured
- [ ] **Logs**: No critical errors in PM2 or Nginx logs

---

## 🆘 Support

If you encounter issues:

1. **Check Logs**: `pm2 logs` and `sudo journalctl -u nginx`
2. **Verify Configuration**: `sudo nginx -t` and `pm2 status`
3. **Test Endpoints**: Use `curl` commands above
4. **Check Environment**: Ensure `.env` files are properly configured
5. **Restart Services**: `pm2 restart all` and `sudo systemctl restart nginx`

For additional help, check the repository issues or create a new one with:
- Your Ubuntu version
- Error logs
- Steps to reproduce the issue