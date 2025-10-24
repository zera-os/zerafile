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
