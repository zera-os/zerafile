#!/bin/bash

# ZERAfile Zero-Downtime Update Script
# Minimizes downtime by using rolling updates and graceful restarts

set -e

echo "🔄 ZERAfile Zero-Downtime Update..."

# Colors for output
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

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Check if we're in the right directory
if [ ! -d "/var/www/zerafile/.git" ]; then
    print_warning "Not in ZERAfile directory. Please run from /var/www/zerafile"
    exit 1
fi

cd /var/www/zerafile

print_step "Step 1: Pre-update health check..."
# Check if services are running
if ! pm2 list | grep -q "zerafile-api\|zerafile-web"; then
    print_warning "Services not running. Starting them first..."
    pm2 start ecosystem.config.js
    exit 0
fi

print_step "Step 2: Pulling latest changes..."
git pull

print_step "Step 3: Installing dependencies (in background)..."
# Install dependencies in background to reduce downtime
pnpm install &
INSTALL_PID=$!

print_step "Step 4: Building applications (in background)..."
# Wait for install to complete, then build
wait $INSTALL_PID
pnpm build &
BUILD_PID=$!

print_step "Step 5: Rolling restart - API first..."
# Restart API first (less critical for user experience)
pm2 restart zerafile-api --wait-ready --kill-timeout 5000
print_status "API restarted successfully"

print_step "Step 6: Rolling restart - Web app..."
# Wait for build to complete, then restart web app
wait $BUILD_PID
pm2 restart zerafile-web --wait-ready --kill-timeout 5000
print_status "Web app restarted successfully"

print_step "Step 7: Final health check..."
sleep 2
pm2 status

print_status "✅ Zero-downtime update completed successfully!"
print_status "Services should be running with minimal interruption"
print_status "Check detailed status with: pm2 status"
