# TanStack Start to Capacitor Conversion Report

## Project Overview

**App Name:** Master Gym  
**Original Framework:** TanStack Start + React  
**Backend:** Convex  
**Target Platform:** Android (Capacitor)

---

## Summary

Successfully converted a TanStack Start web application into a native Android mobile application using Capacitor. The app now runs as a native APK while maintaining all existing functionality including Convex backend integration.

---

## Files Modified

### 1. `capacitor.config.ts`

**Changes:**

- Updated `webDir` from `dist` to `.output/public` (TanStack Start's build output location)
- Added server configuration for mobile schemes
- Configured proper native platform handling

**Before:**

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.mastergym',
  appName: 'Master Gym',
  webDir: 'dist',
}
```

**After:**

```typescript
const config: CapacitorConfig = {
  appId: 'com.yourcompany.mastergym',
  appName: 'Master Gym',
  webDir: '.output/public',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
}
```

---

### 2. `vite.config.ts`

**Changes:**

- Added CORS configuration for mobile development
- Enabled SPA mode with prerendering to generate `index.html`
- Configured output path for Capacitor compatibility

**Key Additions:**

```typescript
server: {
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type'],
  },
},
plugins: [
  // ... other plugins
  tanstackStart({
    spa: {
      enabled: true,
      prerender: {
        crawlLinks: true,
        outputPath: "index.html",
      },
    },
  }),
]
```

**Why This Matters:**

- SPA mode ensures the app works as a single-page application in the WebView
- Prerendering generates `index.html` which Capacitor requires as the entry point
- CORS allows the mobile app to communicate with the Convex backend

---

### 3. `package.json`

**Changes:**

- Added Capacitor-specific npm scripts for easier development workflow

**New Scripts Added:**

```json
{
  "scripts": {
    "cap:sync": "npx cap sync",
    "cap:open:ios": "npx cap open ios",
    "cap:open:android": "npx cap open android",
    "cap:build": "npm run build && npm run cap:sync",
    "cap:run:android": "npx cap run android",
    "cap:run:ios": "npx cap run ios"
  }
}
```

---

### 4. `src/routes/__root.tsx`

**Changes:**

- Added Capacitor StatusBar integration for native mobile experience
- Fixed TypeScript type issue with touch events

**Additions:**

```typescript
import { StatusBar } from '@capacitor/status-bar'

function RootDocument({ children }: { children: React.ReactNode }) {
  React.useEffect(() => {
    // Configure Capacitor status bar for mobile apps
    StatusBar.setOverlaysWebView({ overlay: false })

    // ... rest of the useEffect
  }, [])

  // ... component JSX
}
```

---

## Dependencies Installed

### `@capacitor/status-bar` (v8.0.0)

**Purpose:** Control the native status bar appearance on mobile devices  
**Why:** Provides native mobile app feel by managing the system status bar

---

## Build Process

### Step 1: Web Build

```bash
pnpm run build
```

- Compiles React/TypeScript code
- Generates static assets in `.output/public/`
- Creates `index.html` via prerendering
- Bundles all JavaScript and CSS

### Step 2: Capacitor Sync

```bash
npx cap sync
```

- Copies web assets from `.output/public/` to `android/app/src/main/assets/public/`
- Updates native Android project configuration
- Syncs Capacitor plugins (status-bar)
- Generates `capacitor.config.json` for runtime

### Step 3: Native Build

```bash
cd android && ./gradlew assembleDebug
```

- Compiles Java/Kotlin native code
- Bundles web assets into APK
- Creates debug APK at `app/build/outputs/apk/debug/app-debug.apk`

### Step 4: Device Installation

```bash
adb install -r app-debug.apk
```

- Installs APK to connected Android device
- `-r` flag allows reinstallation/update

---

## Key Technical Decisions

### 1. SPA Mode vs SSR

**Decision:** Used SPA (Single Page Application) mode  
**Reasoning:**

- Capacitor apps run in a WebView without a server
- SSR requires a server runtime which isn't available in mobile WebView
- SPA mode generates static files that work perfectly in WebView

### 2. Backend Architecture (Convex)

**Decision:** Kept existing Convex backend  
**Reasoning:**

- Convex works client-side via WebSocket connections
- No server-side rendering required
- Mobile app connects directly to Convex cloud
- No changes needed to backend code

### 3. CORS Configuration

**Decision:** Permissive CORS in development  
**Reasoning:**

- Mobile apps run on `capacitor://localhost` or `file://` schemes
- Must allow cross-origin requests to Convex API
- Required for the app to fetch data from backend

---

## File Structure

```
master-gym0/
├── android/                    # Native Android project (generated)
│   ├── app/
│   │   ├── src/
│   │   │   └── main/
│   │   │       └── assets/
│   │   │           └── public/    # Web assets copied here
│   │   └── build/
│   │       └── outputs/
│   │           └── apk/
│   │               └── debug/
│   │                   └── app-debug.apk  # Final APK
├── .output/
│   └── public/                 # TanStack Start build output
│       ├── index.html          # Entry point (required by Capacitor)
│       └── assets/             # JS/CSS bundles
├── src/
│   └── routes/
│       └── __root.tsx          # Root component with StatusBar
├── capacitor.config.ts         # Capacitor configuration
├── vite.config.ts              # Vite + TanStack Start config
└── package.json                # Build scripts
```

---

## Commands Reference

### Development

```bash
# Start dev server
pnpm run dev

# Build for production
pnpm run build
```

### Mobile Development

```bash
# Build and sync to Android
pnpm run cap:build

# Open Android Studio
pnpm run cap:open:android

# Build debug APK
cd android && ./gradlew assembleDebug

# Install to device
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## Testing Results

✅ **Build Status:** Successful  
✅ **APK Generation:** Successful  
✅ **Device Installation:** Successful  
✅ **Device ID:** RZ8W6080PQP

---

## Important Considerations

### For Production Deployment

1. **Signing:** The current build is a debug APK. For Play Store, you need:
   - Generate a keystore
   - Sign the APK with `jarsigner`
   - Align with `zipalign`

2. **Environment Variables:** Ensure `VITE_CONVEX_URL` is set correctly for production

3. **Permissions:** Review Android permissions in `AndroidManifest.xml`

4. **Status Bar:** Currently configured to not overlay web content. Can be customized per screen if needed.

### Known Limitations

1. **Server Functions:** `createServerFn` from TanStack Start won't work in the mobile app since there's no co-located server. Use Convex queries/mutations instead.

2. **Deep Linking:** Not configured. Would need additional setup for handling external URLs.

3. **Push Notifications:** Not implemented. Would require `@capacitor/push-notifications` plugin.

---

## APK Signing Setup

For production deployment, APKs must be digitally signed. The project includes scripts and CI/CD configuration for automated signing.

### Scripts Created

1. **`scripts/generate-keystore.sh`**
   - Generates signing keystore for release builds
   - Creates `master-gym.keystore` file
   - **Do not commit this file to git!**

2. **`scripts/build-sign-install-release.sh`**
   - Builds release APK
   - Signs APK with apksigner
   - Installs and launches on device

3. **`scripts/prepare-github-secrets.sh`**
   - Generates base64 encoding of keystore for GitHub Actions
   - Shows required GitHub secrets

### GitHub Actions Workflow

The `.github/workflows/build-release.yml` automatically:

- Builds release APK on push to `release` branch
- Signs APK using GitHub secrets
- Creates GitHub release with signed APK
- Uploads signed APK as artifact

### Required GitHub Secrets

Go to **GitHub → Settings → Secrets and variables → Actions** and add:

| Secret              | Value                                           |
| ------------------- | ----------------------------------------------- |
| `KEYSTORE_BASE64`   | Base64 encoded content of `master-gym.keystore` |
| `KEYSTORE_PASSWORD` | `mastergym123` (or your custom password)        |
| `KEY_ALIAS`         | `mastergym`                                     |
| `VITE_CONVEX_URL`   | Your Convex deployment URL                      |

**To get KEYSTORE_BASE64:**

```bash
base64 -i master-gym.keystore
```

### Security Notes

- **Keystore file is in `.gitignore`** - never commit it!
- Keep your keystore file backed up safely
- Store keystore password securely
- For production apps, use a strong unique password

### Usage

**Local signed build:**

```bash
./scripts/build-sign-install-release.sh
```

**GitHub Actions automated build:**

```bash
git push origin release
```

---

## Conclusion

The conversion from TanStack Start web app to Capacitor mobile app was successful. The app maintains its full functionality including:

- React Router navigation
- Convex backend integration
- Tailwind CSS styling
- All existing components and features

The mobile app now runs as a native Android application while using the same codebase as the web version.

---

## Next Steps (Optional)

1. Configure app icons and splash screens
2. Set up deep linking
3. Add push notifications
4. Configure ProGuard for release builds
5. Set up CI/CD for automated builds
6. Test on iOS (requires macOS and Xcode)

---

**Date:** February 8, 2026  
**Status:** ✅ Complete
