#!/bin/bash

# ZERAfile Ubuntu Deployment Script
# Run this script on your DigitalOcean Ubuntu droplet

set -e

echo "🚀 Starting ZERAfile deployment on Ubuntu..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_step "Step 1: Updating system packages..."
sudo apt update && sudo apt upgrade -y

print_step "Step 2: Installing required packages..."

# Install Node.js 20 if not installed
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    print_status "Node.js already installed: $(node --version)"
fi

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    print_status "Installing pnpm..."
    npm install -g pnpm
else
    print_status "pnpm already installed: $(pnpm --version)"
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2..."
    npm install -g pm2
else
    print_status "PM2 already installed: $(pm2 --version)"
fi

# Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    print_status "Installing Nginx..."
    sudo apt install nginx -y
else
    print_status "Nginx already installed"
fi

# Install Certbot if not installed
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt install certbot python3-certbot-nginx -y
else
    print_status "Certbot already installed"
fi

# Install Git if not installed
if ! command -v git &> /dev/null; then
    print_status "Installing Git..."
    sudo apt install git -y
else
    print_status "Git already installed: $(git --version)"
fi

# Install UFW if not installed
if ! command -v ufw &> /dev/null; then
    print_status "Installing UFW firewall..."
    sudo apt install ufw -y
else
    print_status "UFW already installed"
fi

print_step "Step 3: Setting up application directory..."
sudo mkdir -p /var/www/zerafile
sudo chown $USER:$USER /var/www/zerafile

# Check if repository is already cloned
if [ ! -d "/var/www/zerafile/.git" ]; then
    print_warning "Repository not found in /var/www/zerafile"
    print_status "Cloning repository..."
    cd /var/www/zerafile
    git clone https://github.com/zera-os/zerafile.git .
    print_status "Repository cloned successfully"
else
    print_status "Repository already exists, pulling latest changes..."
    cd /var/www/zerafile
    git pull
fi

print_step "Step 4: Installing dependencies and building applications..."
cd /var/www/zerafile

# Install dependencies
print_status "Installing dependencies..."
pnpm install

# Build applications
print_status "Building all applications..."
pnpm build

print_step "Step 5: Setting up PM2 configuration..."
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Copy ecosystem config if it exists
if [ -f "ecosystem.config.js" ]; then
    print_status "Using existing ecosystem.config.js"
else
    print_warning "ecosystem.config.js not found. Please ensure it exists in the repository root."
fi

print_step "Step 6: Setting up Nginx configurations..."

# Set domain variables
MAIN_DOMAIN="zerafile.io"
API_DOMAIN="api.zerafile.io"
CDN_DOMAIN="cdn.zerafile.io"

print_status "Configuring Nginx for domains:"
print_status "  Main: $MAIN_DOMAIN"
print_status "  API: $API_DOMAIN"
print_status "  CDN: $CDN_DOMAIN"

# Main site configuration (HTTP only - SSL will be added by Certbot)
sudo tee /etc/nginx/sites-available/$MAIN_DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $MAIN_DOMAIN www.$MAIN_DOMAIN;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# API configuration (HTTP only - SSL will be added by Certbot)
sudo tee /etc/nginx/sites-available/$API_DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $API_DOMAIN;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# CDN configuration (HTTP only - SSL will be added by Certbot)
sudo tee /etc/nginx/sites-available/$CDN_DOMAIN > /dev/null <<EOF
server {
    listen 80;
    server_name $CDN_DOMAIN;

    location / {
        proxy_pass https://zerafile.nyc3.digitaloceanspaces.com;
        proxy_set_header Host zerafile.nyc3.digitaloceanspaces.com;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header ETag \$upstream_http_etag;
    }
}
EOF

print_step "Step 7: Enabling Nginx sites..."
# Enable sites
sudo ln -sf /etc/nginx/sites-available/$MAIN_DOMAIN /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/$API_DOMAIN /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/$CDN_DOMAIN /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
print_status "Testing Nginx configuration..."
sudo nginx -t

# Restart Nginx
print_status "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

print_step "Step 8: Configuring firewall..."
# Configure UFW firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

print_step "Step 9: Starting applications with PM2..."
# Start applications with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
print_status "Setting up PM2 startup..."
pm2 startup

print_status "Deployment completed successfully!"
echo ""
print_warning "Next steps:"
print_warning "1. Configure your environment variables:"
print_warning "   - Edit /var/www/zerafile/apps/api/.env"
print_warning "   - Edit /var/www/zerafile/apps/web/.env.local"
print_warning ""
print_warning "2. Set up SSL certificates:"
print_warning "   sudo certbot --nginx -d $MAIN_DOMAIN -d www.$MAIN_DOMAIN -d $API_DOMAIN -d $CDN_DOMAIN"
print_warning ""
print_warning "3. Configure your DNS records to point to this server:"
print_warning "   A     $MAIN_DOMAIN        → $(curl -s ifconfig.me)"
print_warning "   A     www.$MAIN_DOMAIN    → $(curl -s ifconfig.me)"
print_warning "   A     $API_DOMAIN         → $(curl -s ifconfig.me)"
print_warning "   A     $CDN_DOMAIN         → $(curl -s ifconfig.me)"
print_warning ""
print_warning "4. Set up DigitalOcean Spaces bucket and configure CORS"

echo ""
print_status "Useful commands:"
echo "  pm2 status                    # Check application status"
echo "  pm2 logs zerafile-api         # View API logs"
echo "  pm2 logs zerafile-web         # View web app logs"
echo "  pm2 restart all              # Restart all applications (after adding env files)"
echo "  sudo nginx -t                 # Test Nginx configuration"
echo "  sudo systemctl status nginx   # Check Nginx status"
echo "  sudo ufw status               # Check firewall status"
echo ""
print_status "After adding environment files, restart services:"
echo "  pm2 restart all              # Restart applications with new env vars"
echo ""
print_status "Test your sites (after DNS propagation):"
echo "  curl http://$MAIN_DOMAIN"
echo "  curl http://$API_DOMAIN/health"
echo "  curl http://$CDN_DOMAIN"
