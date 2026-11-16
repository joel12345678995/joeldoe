# VendorGuard — Ugandan Market Vendor Fraud Protection

VendorGuard helps Ugandan market vendors detect counterfeit banknotes, verify MTN Mobile Money and Airtel Money payments, report fraud, review activity history, receive security alerts, and access fraud awareness education.

## Package Contents
- `VendorGuard.apk` — Signed Android release APK ready to install on an Android phone (works standalone offline with full local persistence and camera support).
- `src/` — React + TypeScript frontend application.
- `public/` — App icons and PWA assets.
- `server.ts` — Express + Vite full-stack server with persistent JSON database.
- `android/` — Capacitor native Android project configured with camera permissions and VendorGuard launcher icons.

## Installing `VendorGuard.apk` on Android
1. Transfer `VendorGuard.apk` to your Android phone.
2. Tap `VendorGuard.apk` in your phone's file manager.
3. If prompted, allow **Install unknown apps** for your file manager or browser.
4. Tap **Install** and open **VendorGuard**.

## Demonstration Accounts
- **Demo Vendor**: Phone `0772104582` · Password `vendor123`
- **Demo Administrator**: Phone `0700990100` · Password `admin123`

## Running the Web / Full-Stack App Locally
```bash
npm install
npm run dev
```
The app runs on `http://localhost:3000`.
