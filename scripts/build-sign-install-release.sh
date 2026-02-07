#!/bin/bash

# Build, Sign and Install RELEASE APK
# Usage: ./scripts/build-sign-install-release.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KEYSTORE_FILE="master-gym.keystore"
KEY_ALIAS="mastergym"
STOREPASS="mastergym123"
UNSIGNED_APK="android/app/build/outputs/apk/release/app-release-unsigned.apk"
SIGNED_APK="android/app/build/outputs/apk/release/app-release-signed.apk"

echo -e "${BLUE}🔨 Building & Signing RELEASE APK...${NC}"
echo ""

# Check if keystore exists
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo -e "${RED}❌ Keystore not found!${NC}"
    echo -e "${YELLOW}   Run: ./scripts/generate-keystore.sh${NC}"
    exit 1
fi

echo -e "${YELLOW}Building web...${NC}"
pnpm run build

echo -e "${YELLOW}Syncing Capacitor...${NC}"
npx cap sync

echo -e "${YELLOW}Building release APK...${NC}"
cd android
./gradlew assembleRelease
cd ..

if [ ! -f "$UNSIGNED_APK" ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}Signing APK with apksigner...${NC}"
apksigner sign \
    --ks "$KEYSTORE_FILE" \
    --ks-key-alias "$KEY_ALIAS" \
    --ks-pass pass:$STOREPASS \
    --key-pass pass:$STOREPASS \
    --out "$SIGNED_APK" \
    "$UNSIGNED_APK"

echo -e "${GREEN}✅ APK signed!${NC}"
echo -e "${YELLOW}Installing...${NC}"
adb install -r "$SIGNED_APK"

echo -e "${YELLOW}Launching...${NC}"
adb shell monkey -p com.yourcompany.mastergym 1

echo ""
echo -e "${GREEN}✅ Signed release APK installed and running!${NC}"
echo -e "${BLUE}APK:${NC} $SIGNED_APK"
