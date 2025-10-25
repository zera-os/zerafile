# ZERAfile Ubuntu Deployment Guide

## Prerequisites
- DigitalOcean Droplet (Ubuntu 24.04 LTS recommended)
- Domain: `zerafile.io` pointing to your droplet
- DigitalOcean Spaces bucket for file storage
- SSH access to your droplet

## 🚀 Quick Start (Fully Automated Deployment)

### One-Command Deployment (Recommended)
```bash
# Download and run the fully automated deployment script
wget https://raw.githubusercontent.com/zera-os/zerafile/main/deploy-ubuntu.sh
chmod +x deploy-ubuntu.sh
./deploy-ubuntu.sh
```
You must set env files along the lines of the below.

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

#### Web App Configuration ✅ **AUTOMATED**
The web app URLs are now **hardcoded for production** - no environment file needed!

- **Production**: Automatically uses `https://api.zerafile.io` and `https://cdn.zerafile.io`
- **Development**: Uses environment variables or defaults to `localhost:8080`

#### Alternative: Copy from Templates
```bash
# Copy API template file
cp /var/www/zerafile/env-api-template.txt /var/www/zerafile/apps/api/.env

# Edit with your actual values
sudo nano /var/www/zerafile/apps/api/.env
```

**Note**: The web app no longer requires a `.env.local` file as URLs are hardcoded for production.

## 🔄 Zero-Downtime Updates

### Update Scripts Available

**1. Zero-Downtime Update (Recommended):**
```bash
./update.sh
```
- ✅ Rolling restarts (services restart one at a time)
- ✅ Background builds (parallel processing)
- ✅ Graceful shutdowns (5-second kill timeout)
- ✅ Health checks and verification
- ✅ Typically < 2 seconds downtime per service

**2. Critical/Fast Update:**
```bash
./update-critical.sh
```
- ⚡ Ultra-fast updates for critical fixes
- ⚡ Parallel builds and installs
- ⚡ Minimal delays between restarts
- ⚡ Best for emergency patches

**3. Full Deployment Update:**
```bash
./deploy-ubuntu.sh
```
- 🔧 Complete deployment with SSL handling
- 🔧 Detects existing deployment automatically
- 🔧 Handles SSL certificate renewal
- 🔧 Skips already-configured steps

### Zero-Downtime Features

- **Rolling Restarts**: API restarts first, then web app
- **Graceful Shutdowns**: 5-second kill timeout for clean restarts
- **Health Checks**: Verifies services are ready before proceeding
- **Background Processing**: Builds and installs run in parallel
- **Process Management**: PM2 handles process lifecycle with zero-downtime settings

### Monitoring Updates

```bash
# Check service status
pm2 status

# View logs during update
pm2 logs zerafile-api
pm2 logs zerafile-web

# Monitor in real-time
pm2 monit
```
