# Dragvertising Superadmin Debug Chrome Extension

A Chrome extension that provides quick access to the Dragvertising Superadmin Debug panel from the browser toolbar.

## Features

- **Quick Access**: Open/close/toggle the debug panel with one click
- **Tool Selection**: Switch between 8 different debug tools directly from the extension
- **Status Indicator**: See if the debug panel is open or closed
- **Connection Status**: Know when you're connected to the debug API
- **Error Handling**: Clear error messages when something goes wrong

## Installation

### Load Unpacked Extension (Development)

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `chrome-extension` folder from this repository
5. The extension should now appear in your extensions list

### Pin the Extension

1. Click the puzzle piece icon in Chrome's toolbar
2. Find "Dragvertising Superadmin Debug"
3. Click the pin icon to keep it visible in your toolbar

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

## Troubleshooting

### "Wrong site" Error
- Make sure you're on `localhost:8080`, `dragvertising.com`, or `www.dragvertising.com`
- Refresh the page and try again

### "Debug API not found" Error
- Make sure you're logged in as a superadmin
- The `SuperAdminDebug` component must be rendered in the app (it's in `AppLayout.tsx`)
- Refresh the page and try again

### Extension Not Working
1. Check that the extension is enabled in `chrome://extensions/`
2. Make sure you're on an allowed domain
3. Verify you're logged in as superadmin
4. Check the browser console for errors
5. Try reloading the extension in `chrome://extensions/`

## Development

### File Structure

```
chrome-extension/
├── manifest.json      # Extension configuration
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
3. Click the refresh icon on the extension card
4. Test your changes

### Version History

- **v1.0.0** (2024-12-02)
  - Modernized code with async/await
  - Added error handling and user feedback
  - Improved UI with better status indicators
  - Added connection status monitoring
  - Added heartbeat mechanism

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

## Support

If you encounter issues:
1. Check the error message in the extension popup
2. Check the browser console for errors
3. Verify you're logged in as superadmin
4. Make sure the `SuperAdminDebug` component is rendered in the app


