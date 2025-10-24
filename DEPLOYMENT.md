# ZERAfile Ubuntu Deployment Guide

## Prerequisites
- DigitalOcean Droplet (Ubuntu 24.04 LTS recommended)
- Domain: `zerafile.io` pointing to your droplet
- DigitalOcean Spaces bucket for file storage

## Step 1: Initial Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally
npm install -g pnpm

# Install PM2 for process management
npm install -g pm2

# Install Nginx
sudo apt install nginx -y

# Install Certbot for SSL certificates
sudo apt install certbot python3-certbot-nginx -y

# Install Git
sudo apt install git -y

# Install UFW firewall
sudo apt install ufw -y
```

## Step 2: Clone and Setup Application

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

## Step 3: Environment Configuration

### API Environment File
Create `/var/www/zerafile/apps/api/.env`:

```bash
# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_REGION=us-east-1
SPACES_BUCKET=zerafile
SPACES_KEY=your_spaces_access_key
SPACES_SECRET=your_spaces_secret_key

# CDN URL
CDN_BASE_URL=https://cdn.zerafile.io

# Server Configuration
PORT=8080
NODE_ENV=production
```

### Web App Environment File
Create `/var/www/zerafile/apps/web/.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://api.zerafile.io
NEXT_PUBLIC_CDN_BASE=https://cdn.zerafile.io

# Next.js Configuration
NODE_ENV=production
```

## Step 4: PM2 Configuration

Create `/var/www/zerafile/ecosystem.config.js`:

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

## Step 5: Nginx Configuration

### Main Site Configuration
Create `/etc/nginx/sites-available/zerafile.io`:

```nginx
server {
    listen 80;
    server_name zerafile.io www.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name zerafile.io www.zerafile.io;

    # SSL configuration will be added by Certbot
    
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

### API Configuration
Create `/etc/nginx/sites-available/api.zerafile.io`:

```nginx
server {
    listen 80;
    server_name api.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.zerafile.io;

    # SSL configuration will be added by Certbot
    
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

### CDN Configuration
Create `/etc/nginx/sites-available/cdn.zerafile.io`:

```nginx
server {
    listen 80;
    server_name cdn.zerafile.io;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cdn.zerafile.io;

    # SSL configuration will be added by Certbot
    
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

## Step 6: Enable Nginx Sites

```bash
# Enable sites
sudo ln -s /etc/nginx/sites-available/zerafile.io /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/api.zerafile.io /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/cdn.zerafile.io /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

## Step 7: Start Applications

```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Start applications with PM2
cd /var/www/zerafile
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 8: SSL Certificates

```bash
# Get SSL certificates for all domains
sudo certbot --nginx -d zerafile.io -d www.zerafile.io -d api.zerafile.io -d cdn.zerafile.io

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 9: Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Check status
sudo ufw status
```

## Step 10: DNS Configuration

Configure your DNS records to point to your droplet:

```
A     zerafile.io        → YOUR_DROPLET_IP
A     www.zerafile.io    → YOUR_DROPLET_IP
A     api.zerafile.io    → YOUR_DROPLET_IP
A     cdn.zerafile.io    → YOUR_DROPLET_IP
```

## Step 11: DigitalOcean Spaces Setup

1. **Create Spaces Bucket**:
   - Go to DigitalOcean Control Panel
   - Create a new Space named `zerafile`
   - Set it to public
   - Note the endpoint URL

2. **Configure CORS Policy**:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

3. **Configure Bucket Policy**:
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

## Monitoring and Maintenance

### Check Application Status
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs zerafile-api
pm2 logs zerafile-web

# Restart applications
pm2 restart all
```

### Update Application
```bash
# Pull latest changes
cd /var/www/zerafile
git pull

# Install dependencies
pnpm install

# Rebuild all applications
pnpm build

# Restart PM2 processes
pm2 restart all
```

### Useful Commands
```bash
# Check Nginx status
sudo systemctl status nginx

# Check PM2 status
pm2 status

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test API endpoint
curl https://api.zerafile.io/v1/uploads/rate-limit-status

# Check SSL certificate
sudo certbot certificates
```

## Troubleshooting

### Common Issues
1. **Port conflicts**: Ensure ports 3000 and 8080 are available
2. **Permission issues**: Check file ownership in `/var/www/zerafile`
3. **SSL issues**: Verify domain DNS is pointing to droplet
4. **API not accessible**: Check Nginx configuration and PM2 status

### Log Locations
- PM2 logs: `/var/log/pm2/`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check PM2 logs

This deployment setup provides a production-ready environment for ZERAfile with proper SSL, process management, and monitoring.
