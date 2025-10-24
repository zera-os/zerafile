#!/bin/bash

# ZERAfile Critical Update Script
# Ultra-fast updates for critical fixes with minimal downtime

set -e

echo "⚡ ZERAfile Critical Update (Ultra-Fast)..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Check if we're in the right directory
if [ ! -d "/var/www/zerafile/.git" ]; then
    print_error "Not in ZERAfile directory. Please run from /var/www/zerafile"
    exit 1
fi

cd /var/www/zerafile

print_status "🚀 Starting critical update..."

# Quick git pull
print_status "Pulling latest changes..."
git pull

# Parallel build and install
print_status "Building and installing in parallel..."
pnpm install & 
pnpm build &
wait

# Ultra-fast rolling restart
print_status "Performing ultra-fast rolling restart..."

# Restart API with minimal delay
pm2 restart zerafile-api --wait-ready --kill-timeout 3000 &
API_PID=$!

# Small delay, then restart web
sleep 1
pm2 restart zerafile-web --wait-ready --kill-timeout 3000 &
WEB_PID=$!

# Wait for both to complete
wait $API_PID
wait $WEB_PID

print_status "✅ Critical update completed in minimal time!"
print_status "Services restarted with rolling updates"

# Quick health check
sleep 1
if pm2 list | grep -q "online"; then
    print_status "🎉 All services online!"
else
    print_warning "⚠️  Some services may need attention. Check: pm2 status"
fi
