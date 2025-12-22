# Quick Installation Guide

## Step 1: Open Chrome Extensions Page

1. Open Google Chrome
2. Navigate to: `chrome://extensions/`
   - Or: Menu (⋮) → Extensions → Manage Extensions

## Step 2: Enable Developer Mode

1. Toggle "Developer mode" switch in the top-right corner
2. You should see new buttons appear: "Load unpacked", "Pack extension", etc.

## Step 3: Load the Extension

1. Click the **"Load unpacked"** button
2. Navigate to your project folder: `/Users/michaelryanwhitson/DragvertisingApp/`
3. Select the **`chrome-extension`** folder
4. Click "Select Folder" (or "Open" on Mac)

## Step 4: Pin the Extension

1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "Dragvertising Superadmin Debug"
3. Click the pin icon (📌) to keep it visible

## Step 5: Test It

1. Navigate to your Dragvertising app:
   - `http://localhost:8080` (development)
   - `https://dragvertising.com` (production)
2. Log in as a superadmin
3. Click the extension icon in your toolbar
4. You should see the debug panel controls

## Troubleshooting

### Extension Not Appearing
- Make sure you selected the `chrome-extension` folder, not the parent folder
- Check that all files are present (manifest.json, popup.html, popup.js, content.js)

### "This extension may have been corrupted"
- Make sure all files are present
- Try removing and reloading the extension

### Extension Not Working
- Make sure you're on an allowed domain (localhost:8080 or dragvertising.com)
- Verify you're logged in as superadmin
- Check the browser console for errors

## Updating the Extension

When you make changes to the extension:

1. Go to `chrome://extensions/`
2. Find "Dragvertising Superadmin Debug"
3. Click the refresh icon (🔄) on the extension card
4. Test your changes

## Uninstalling

1. Go to `chrome://extensions/`
2. Find "Dragvertising Superadmin Debug"
3. Click "Remove"
4. Confirm removal


