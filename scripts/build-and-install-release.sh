#!/bin/bash

# Build and Install RELEASE APK
# Usage: ./scripts/build-and-install-release.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APK_PATH="android/app/build/outputs/apk/release/app-release-unsigned.apk"

echo -e "${BLUE}🔨 Building RELEASE APK...${NC}"
echo ""

echo -e "${YELLOW}Building web...${NC}"
pnpm run build

echo -e "${YELLOW}Syncing Capacitor...${NC}"
npx cap sync

echo -e "${YELLOW}Building release APK...${NC}"
cd android
./gradlew assembleRelease
cd ..

if [ ! -f "$APK_PATH" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Installing...${NC}"
adb install -r "$APK_PATH"

echo -e "${YELLOW}Launching...${NC}"
adb shell monkey -p com.yourcompany.mastergym 1

echo -e "${GREEN}✅ Release build installed!${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: This is an unsigned release APK.${NC}"
echo -e "${YELLOW}   For Play Store, you need to sign it first.${NC}"
