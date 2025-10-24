#!/bin/bash

# ZERAfile Ubuntu Deployment Script
# Run this script on your DigitalOcean Ubuntu droplet
# Supports both fresh deployments and updates

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

# Verify npm is available
if ! command -v npm &> /dev/null; then
    print_error "npm not found after Node.js installation. Please check Node.js installation."
    exit 1
fi

print_status "npm version: $(npm --version)"

# Install pnpm if not installed
if ! command -v pnpm &> /dev/null; then
    print_status "Installing pnpm..."
    npm install -g pnpm
else
    print_status "pnpm already installed: $(pnpm --version)"
fi

# Install Turbo if not installed
if ! command -v turbo &> /dev/null; then
    print_status "Installing Turbo..."
    npm install -g turbo
else
    print_status "Turbo already installed: $(turbo --version)"
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

# Detect if this is an update or fresh deployment
IS_UPDATE=false
if [ -d "/var/www/zerafile/.git" ]; then
    IS_UPDATE=true
    print_status "🔄 Detected existing deployment - running update mode"
else
    print_status "🆕 Fresh deployment detected"
fi

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
    # Force pull to avoid merge conflicts - always use remote version
    git fetch origin
    git reset --hard origin/main
    print_status "✅ Forced pull completed - using remote version"
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

print_step "Step 9: Setting up SSL certificates automatically..."

# Check if SSL certificates already exist
SSL_EXISTS=false
if [ -f "/etc/letsencrypt/live/$MAIN_DOMAIN/fullchain.pem" ]; then
    SSL_EXISTS=true
    print_status "🔒 SSL certificates already exist - checking if they need renewal..."
    sudo certbot renew --dry-run
    if [ $? -eq 0 ]; then
        print_status "✅ SSL certificates are valid and up to date"
    else
        print_status "🔄 Renewing SSL certificates..."
        sudo certbot renew
    fi
else
    print_status "🔒 No SSL certificates found - setting up new ones..."
    print_status "Waiting for DNS to propagate (this may take a few minutes)..."
    print_status "Checking if domains are accessible..."

    # Function to check if domain resolves
    check_domain() {
        local domain=$1
        local server_ip=$(curl -s ifconfig.me)
        
        # Use curl to test if domain resolves to our server
        local test_url="http://$domain"
        local resolved_ip=""
        
        # Try to get the IP using curl with timeout
        resolved_ip=$(curl -s --connect-timeout 5 --max-time 10 -I "$test_url" 2>/dev/null | grep -i "server:" | head -n1)
        
        # If that doesn't work, try a simple ping test
        if [ -z "$resolved_ip" ]; then
            # Use ping to get IP (this bypasses DNS resolver issues)
            resolved_ip=$(ping -c 1 -W 5 "$domain" 2>/dev/null | grep "PING" | sed 's/.*(\([0-9.]*\)).*/\1/')
        fi
        
        print_status "Checking $domain: server_ip=$server_ip, resolved_ip=$resolved_ip"
        
        # If we got an IP, check if it matches
        if [ -n "$resolved_ip" ] && [ "$resolved_ip" = "$server_ip" ]; then
            return 0
        else
            return 1
        fi
    }

    # Skip DNS check since it's causing issues with Ubuntu's systemd-resolved
    print_status "⏭️  Skipping DNS check due to Ubuntu DNS resolver issues..."
    print_status "Proceeding with SSL setup (DNS should be working based on your confirmation)..."
    
    # Set up SSL certificates automatically
    print_status "🔒 Setting up SSL certificates with Let's Encrypt..."
    print_status "Note: CDN domain ($CDN_DOMAIN) points to S3, so SSL is handled by DigitalOcean Spaces"
    sudo certbot --nginx -d $MAIN_DOMAIN -d www.$MAIN_DOMAIN -d $API_DOMAIN --non-interactive --agree-tos --email admin@$MAIN_DOMAIN --redirect
    
    if [ $? -eq 0 ]; then
        print_status "✅ SSL certificates installed successfully!"
    else
        print_warning "⚠️  SSL certificate setup failed. You can try manually:"
        print_warning "sudo certbot --nginx -d $MAIN_DOMAIN -d www.$MAIN_DOMAIN -d $API_DOMAIN"
    fi
fi

print_step "Step 10: DigitalOcean Spaces Setup Guide..."
if [ "$IS_UPDATE" = false ]; then
    print_status "📦 You need to set up a DigitalOcean Spaces bucket:"
    print_status ""
    print_status "1. Go to: https://cloud.digitalocean.com/spaces"
    print_status "2. Create a new Space named 'zerafile'"
    print_status "3. Choose a region (e.g., NYC3)"
    print_status "4. Set it to 'Public' access"
    print_status "5. Note down your Space details for the environment files"
    print_status ""
    print_status "🔧 CORS Configuration (run this after creating the Space):"
    print_status "   - Go to your Space settings"
    print_status "   - Add CORS rule with origins: https://zerafile.io, https://api.zerafile.io"
    print_status "   - Allow methods: GET, HEAD, POST, PUT"
    print_status "   - Allow headers: *"
    print_status ""
    print_warning "Press ENTER when you've created your DigitalOcean Space..."

    # Wait for user input
    read -r
else
    print_status "🔄 Update mode - skipping DigitalOcean Spaces setup"
fi

print_step "Step 11: Setting up environment file templates..."
# Copy environment templates
print_status "Creating environment file templates..."
cp env-api-template.txt /var/www/zerafile/apps/api/.env.example
cp env-web-template.txt /var/www/zerafile/apps/web/.env.local.example

# Check if environment files already exist
if [ -f "/var/www/zerafile/apps/api/.env" ] && [ -f "/var/www/zerafile/apps/web/.env.local" ]; then
    print_status "✅ Environment files already exist - skipping creation"
    print_status "📝 If you need to update them:"
    print_status "   nano /var/www/zerafile/apps/api/.env"
    print_status "   nano /var/www/zerafile/apps/web/.env.local"
else
    print_status "Environment templates created:"
    print_status "📝 API template: /var/www/zerafile/apps/api/.env.example"
    print_status "📝 Web template: /var/www/zerafile/apps/web/.env.local.example"
    print_status ""
    print_status "Please create your environment files now:"
    print_status ""
    print_status "📝 API Environment File:"
    print_status "   cp /var/www/zerafile/apps/api/.env.example /var/www/zerafile/apps/api/.env"
    print_status "   nano /var/www/zerafile/apps/api/.env"
    print_status ""
    print_status "📝 Web Environment File:"
    print_status "   cp /var/www/zerafile/apps/web/.env.local.example /var/www/zerafile/apps/web/.env.local"
    print_status "   nano /var/www/zerafile/apps/web/.env.local"
    print_status ""
    print_warning "Press ENTER when you've created both environment files..."

    # Wait for user input
    read -r
fi

print_step "Step 12: Managing applications with PM2..."
# Check if PM2 processes are already running
if pm2 list | grep -q "zerafile-api\|zerafile-web"; then
    print_status "🔄 PM2 processes already running - performing rolling restart..."
    
    # Rolling restart: API first, then web app
    print_status "Restarting API service..."
    pm2 restart zerafile-api --wait-ready --kill-timeout 5000
    
    print_status "Restarting Web service..."
    pm2 restart zerafile-web --wait-ready --kill-timeout 5000
    
    print_status "✅ Rolling restart completed"
else
    print_status "🆕 Starting applications with PM2..."
    pm2 start ecosystem.config.js
fi

# Save PM2 configuration
pm2 save

# Setup PM2 startup (only if not already set up)
if ! pm2 startup | grep -q "already"; then
    print_status "Setting up PM2 startup..."
    pm2 startup
fi

if [ "$IS_UPDATE" = true ]; then
    print_status "🎉 Update completed successfully!"
    echo ""
    print_status "✅ Your ZERAfile application has been updated!"
    print_status "🌐 Main site: https://$MAIN_DOMAIN"
    print_status "🔌 API: https://$API_DOMAIN"
    print_status "📁 CDN: https://$CDN_DOMAIN"
else
    print_status "🎉 Deployment completed successfully!"
    echo ""
    print_status "✅ Your ZERAfile application is now running!"
    print_status "🌐 Main site: https://$MAIN_DOMAIN"
    print_status "🔌 API: https://$API_DOMAIN"
    print_status "📁 CDN: https://$CDN_DOMAIN"
fi

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
