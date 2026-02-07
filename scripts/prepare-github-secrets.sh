#!/bin/bash

# Encode keystore for GitHub Actions secret
# Usage: ./scripts/prepare-github-secrets.sh

KEYSTORE_FILE="master-gym.keystore"

echo "🔐 Preparing GitHub Secrets"
echo "============================"
echo ""

if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "❌ Keystore not found: $KEYSTORE_FILE"
    echo "   Run: ./scripts/generate-keystore.sh first"
    exit 1
fi

echo "1. Keystore Base64 (copy this entire output):"
echo "----------------------------------------------"
base64 -i "$KEYSTORE_FILE"
echo ""
echo "----------------------------------------------"
echo ""

echo "2. Required GitHub Secrets:"
echo "   Go to: GitHub Repo → Settings → Secrets and variables → Actions"
echo ""
echo "   Add these secrets:"
echo ""
echo "   Name: KEYSTORE_BASE64"
echo "   Value: <paste the base64 output above>"
echo ""
echo "   Name: KEYSTORE_PASSWORD"
echo "   Value: mastergym123 (or your custom password)"
echo ""
echo "   Name: KEY_ALIAS"
echo "   Value: mastergym"
echo ""
echo "   Name: VITE_CONVEX_URL"
echo "   Value: <your convex URL from .env.local>"
echo ""

echo "3. Next push to 'release' branch will trigger signed build!"
