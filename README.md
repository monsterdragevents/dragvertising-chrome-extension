# Dragvertising Superadmin Debug Chrome Extension

A Chrome extension that provides quick access to the Dragvertising Superadmin Debug panel from the browser toolbar. The extension automatically injects the debug component into Dragvertising pages and provides a convenient popup interface to control it.

## Features

- **Automatic Injection**: Automatically injects the SuperAdminDebug component when you visit Dragvertising pages
- **Quick Access**: Open/close/toggle the debug panel with one click
- **Tool Selection**: Switch between 8 different debug tools directly from the extension
- **Status Indicator**: See if the debug panel is open or closed in real-time
- **Connection Status**: Know when you're connected to the debug API
- **Error Handling**: Clear error messages when something goes wrong
- **Auto-refresh**: Automatically syncs state every 2 seconds

## Installation

### Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `dragvertising-chrome-extension` folder
5. The extension should now appear in your extensions list

### Pin the Extension

1. Click the puzzle piece icon (🧩) in Chrome's toolbar
2. Find "Dragvertising Superadmin Debug"
3. Click the pin icon (📌) to keep it visible in your toolbar

## Usage

1. **Navigate to Dragvertising**: Open your Dragvertising app at:
   - `http://localhost:8080` (development)
   - `https://dragvertising.com` (production)
   - `https://www.dragvertising.com` (production)

2. **Login as Superadmin**: Make sure you're logged in with a superadmin universe

3. **Use the Extension**:
   - Click the extension icon in your toolbar
   - Use "Open", "Close", or "Toggle" buttons to control the debug panel
   - Select a tool from the dropdown and click "Set" to switch tools
   - Click any tool icon in the grid to quickly switch to that tool and open the panel

## Debug Tools

1. **🔧 Role System** - View current universe, roles, and debug info
2. **👥 Talent Checker** - Check for missing talent profiles
3. **🛡️ Profile Creator** - Create test profiles for any role
4. **🏥 Database Health** - Check table row counts
5. **📊 System Stats** - View system statistics
6. **🔍 User Search** - Search users by handle or name
7. **🧹 Cache Control** - Clear localStorage/sessionStorage
8. **🎭 User Impersonation** - Impersonate other users

## Status Indicators

- **Open** (green) - Debug panel is open
- **Closed** (white) - Debug panel is closed
- **Disconnected** (yellow) - Extension can't connect to debug API
- **Error** (red) - An error occurred (see error message)

## Architecture

The extension works by:

1. **Content Script** (`content.js`): Runs on Dragvertising pages and:
   - Sets extension presence flags in localStorage
   - Automatically injects the SuperAdminDebug component when the page loads
   - Handles communication with the popup

2. **Popup Script** (`popup.js`): Handles the extension popup UI and:
   - Communicates with the content script to control the debug panel
   - Executes functions in the page context to interact with `window.dvDebug`
   - Auto-refreshes state every 2 seconds

3. **App Integration**: The Dragvertising app exposes:
   - `window.React` and `window.ReactDOM` - React instances
   - `window.__DRAGVERTISING_DEBUG__.SuperAdminDebug` - The debug component
   - `window.dvDebug` - The debug API (created by the component)

## Troubleshooting

### "Wrong site" Error
- Make sure you're on `localhost:8080`, `dragvertising.com`, or `www.dragvertising.com`
- Refresh the page and try again

### "Debug API not found" Error
- Make sure you're logged in as a superadmin
- The SuperAdminDebug component should be automatically injected by the extension
- Check the browser console for injection errors
- Try refreshing the page

### Extension Not Working
1. Check that the extension is enabled in `chrome://extensions/`
2. Make sure you're on an allowed domain
3. Verify you're logged in as superadmin
4. Check the browser console for errors
5. Try reloading the extension in `chrome://extensions/`
6. Check that the app is exposing the required globals (`window.React`, `window.ReactDOM`, `window.__DRAGVERTISING_DEBUG__`)

### Component Not Injecting
- Check browser console for injection errors
- Verify the app has loaded and exposed the component
- Try manually triggering injection by opening the popup
- Check that React and ReactDOM are available on the page

## Development

### File Structure

```
dragvertising-chrome-extension/
├── manifest.json      # Extension configuration (Manifest V3)
├── popup.html         # Extension popup UI
├── popup.js           # Extension popup logic
├── content.js         # Content script (runs on page)
├── icons/            # Extension icons
│   ├── icon.png      # 16x16, 32x32, 48x48
│   └── icon128.png   # 128x128
└── README.md         # This file
```

### Updating the Extension

1. Make your changes to the extension files
2. Go to `chrome://extensions/`
3. Click the refresh icon (🔄) on the extension card
4. Test your changes

### Version History

- **v2.0.0** (2024-12-XX)
  - Complete rewrite with modern patterns
  - Improved error handling and user feedback
  - Better component injection logic
  - Auto-injection on page load
  - SPA navigation support
  - Enhanced status monitoring

- **v1.0.0** (2024-12-02)
  - Initial release
  - Basic debug panel control
  - Tool selection

## Permissions

The extension requires:
- `scripting` - To inject scripts into the page
- `activeTab` - To access the current tab
- `storage` - For future features (optional)

Host permissions are limited to:
- `http://localhost:8080/*` (development)
- `https://dragvertising.com/*` (production)
- `https://www.dragvertising.com/*` (production)

## Security

- The extension only works on allowed domains
- It only injects scripts into pages you explicitly visit
- No data is collected or sent to external servers
- All communication is local between the extension and the page
- The extension uses Manifest V3 for enhanced security

## Support

If you encounter issues:
1. Check the error message in the extension popup
2. Check the browser console for errors (both popup and page context)
3. Verify you're logged in as superadmin
4. Make sure the app is exposing the required globals
5. Try reloading the extension in `chrome://extensions/`

## Technical Notes

- The extension uses Chrome's `chrome.scripting.executeScript` API to inject functions into the page context
- The SuperAdminDebug component is rendered using React's `createRoot` API
- The component needs access to React context providers, so it must be rendered within the app's React tree
- The extension automatically detects SPA navigation and re-injects the component when needed