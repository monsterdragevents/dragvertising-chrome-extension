(function () {
  'use strict';

  // Set extension presence flag
  try {
    localStorage.setItem('dv_ext_present', '1');
    localStorage.setItem('dv_ext_timestamp', Date.now().toString());
  } catch (error) {
    console.warn('Dragvertising Debug Extension: Could not set presence flag', error);
  }

  // Heartbeat to keep extension presence fresh
  function heartbeat() {
    try {
      localStorage.setItem('dv_ext_timestamp', Date.now().toString());
    } catch (error) {
      // Ignore errors
    }
  }

  // Update heartbeat every 5 seconds
  setInterval(heartbeat, 5000);

  // Initial heartbeat
  heartbeat();

  // Listen for messages from popup (if needed in future)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'ping') {
        sendResponse({ success: true, timestamp: Date.now() });
        return true;
      }
    });
  }
})();
