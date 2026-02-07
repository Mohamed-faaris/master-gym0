#!/bin/bash

# Master Gym - Build and Deploy Script
# Usage: ./scripts/build-and-deploy.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔨 Building Master Gym...${NC}"

# Build web
pnpm run build

# Sync Capacitor
npx cap sync

# Build APK
cd android
./gradlew assembleDebug
cd ..

# Install
echo -e "${YELLOW}📲 Installing...${NC}"
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Launch
echo -e "${YELLOW}🚀 Launching...${NC}"
adb shell monkey -p com.yourcompany.mastergym 1

echo -e "${GREEN}✅ Done!${NC}"
