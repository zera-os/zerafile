#!/bin/bash

# ZERAfile Quick Update Script
# Use this for quick updates when you just want to pull latest code and restart

set -e

echo "🔄 ZERAfile Quick Update..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "/var/www/zerafile/.git" ]; then
    print_warning "Not in ZERAfile directory. Please run from /var/www/zerafile"
    exit 1
fi

cd /var/www/zerafile

print_status "Pulling latest changes..."
git pull

print_status "Installing dependencies..."
pnpm install

print_status "Building applications..."
pnpm build

print_status "Restarting PM2 processes..."
pm2 restart all

print_status "✅ Update completed successfully!"
print_status "Check status with: pm2 status"
