#!/bin/bash

# Dairy Ledger - Build and Install Release APK
# Usage: ./scripts/build-and-install-release.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PROJECT="master-gym"
DATE=$(date +%Y%m%d)
BUILD_DIR="$HOME/Downloads/app-build"
APK_SOURCE="android/app/build/outputs/apk/release/app-release.apk"
APP_ID="com.yourcompany.mastergym"

echo -e "${BLUE}🔨 Building RELEASE APK...${NC}"
echo ""

echo -e "${YELLOW}Building web...${NC}"
npm run build

echo -e "${YELLOW}Syncing Capacitor...${NC}"
npx cap sync

echo -e "${YELLOW}Building release APK...${NC}"
cd android
./gradlew assembleRelease
cd ..

if [ ! -f "$APK_SOURCE" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

# Create build directory and determine count
mkdir -p "$BUILD_DIR"
COUNT=$(ls -1 "$BUILD_DIR"/${PROJECT}-${DATE}-*.apk 2>/dev/null | wc -l)
COUNT=$((COUNT + 1))
APK_DEST="$BUILD_DIR/${PROJECT}-${DATE}-${COUNT}.apk"

# Copy APK
echo -e "${YELLOW}📦 Copying APK to $APK_DEST...${NC}"
cp "$APK_SOURCE" "$APK_DEST"

echo -e "${YELLOW}Installing...${NC}"
adb install -r "$APK_SOURCE"

echo -e "${YELLOW}Launching...${NC}"
adb shell monkey -p "$APP_ID" 1

echo -e "${GREEN}✅ Release build installed!${NC}"
echo -e "${GREEN}📁 APK saved: $APK_DEST${NC}"
echo ""
