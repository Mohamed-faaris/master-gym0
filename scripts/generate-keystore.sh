#!/bin/bash

# Generate signing keystore for release builds (with auto-password)
# Usage: ./scripts/generate-keystore.sh

KEYSTORE_FILE="master-gym.keystore"
KEY_ALIAS="mastergym"
STOREPASS="mastergym123"

echo "🔐 Generating signing keystore..."
echo ""

if [ -f "$KEYSTORE_FILE" ]; then
    echo "⚠️  Keystore already exists: $KEYSTORE_FILE"
    echo "   Delete it first if you want to create a new one"
    exit 1
fi

# Generate with password
keytool -genkey -v \
    -keystore "$KEYSTORE_FILE" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity 10000 \
    -storepass "$STOREPASS" \
    -keypass "$STOREPASS" \
    -dname "CN=Master Gym, OU=Development, O=YourCompany, L=City, ST=State, C=US"

echo ""
echo "✅ Keystore created: $KEYSTORE_FILE"
echo ""
echo "📋 Store this information:"
echo "   Keystore: $KEYSTORE_FILE"
echo "   Alias: $KEY_ALIAS"
echo "   Password: $STOREPASS"
echo ""
echo "⚠️  IMPORTANT: Keep this file secure and backup!"
echo "   You'll need it for all future releases."
echo ""
echo "🔒 For production, use a strong password and keep it in a safe place!"
