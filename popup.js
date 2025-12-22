(function () {
  'use strict';

  const openBtn = document.getElementById('open');
  const closeBtn = document.getElementById('close');
  const toggleBtn = document.getElementById('toggle');
  const setToolBtn = document.getElementById('setTool');
  const toolSelect = document.getElementById('tool');
  const statusChip = document.getElementById('status');
  const errorMsg = document.getElementById('error');

  let currentTabId = null;
  let isConnected = false;

  // Update UI state
  function updateUI(connected, isOpen, tool, error = null) {
    isConnected = connected;
    
    if (error) {
      if (errorMsg) {
        errorMsg.textContent = error;
        errorMsg.style.display = 'block';
      }
      if (statusChip) {
        statusChip.textContent = 'Error';
        statusChip.style.background = '#fee';
        statusChip.style.borderColor = '#f00';
      }
      [openBtn, closeBtn, toggleBtn, setToolBtn, toolSelect].forEach(el => {
        if (el) el.disabled = true;
      });
      return;
    }

    if (errorMsg) {
      errorMsg.style.display = 'none';
    }

    if (statusChip) {
      statusChip.textContent = connected ? (isOpen ? 'Open' : 'Closed') : 'Disconnected';
      statusChip.style.background = connected 
        ? (isOpen ? '#e6ffed' : '#fff') 
        : '#fff3cd';
      statusChip.style.borderColor = connected
        ? (isOpen ? '#2ecc71' : '#d0d0d0')
        : '#ffc107';
    }

    const buttons = [openBtn, closeBtn, toggleBtn, setToolBtn];
    buttons.forEach(el => {
      if (el) el.disabled = !connected;
    });
    if (toolSelect) toolSelect.disabled = !connected;
    if (toolSelect && tool) toolSelect.value = tool;
  }

  // Get active tab
  async function getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }
      return tab;
    } catch (error) {
      console.error('Error getting active tab:', error);
      throw error;
    }
  }

  // Check if URL is allowed
  function isAllowedUrl(url) {
    if (!url) return false;
    return /^https?:\/\/(localhost:8080|(?:www\.)?dragvertising\.com)\//.test(url);
  }

  // Execute script in page context
  async function execScript(func, args = []) {
    if (!currentTabId) {
      throw new Error('No active tab');
    }

    const safeArgs = Array.isArray(args)
      ? args.map((v) => {
          if (v === undefined) return null;
          try {
            return JSON.parse(JSON.stringify(v));
          } catch (_) {
            return null;
          }
        })
      : [];

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: currentTabId },
        func,
        args: safeArgs,
        world: 'MAIN'
      });
      return results?.[0]?.result;
    } catch (error) {
      console.error('Error executing script:', error);
      throw new Error(`Failed to execute: ${error.message}`);
    }
  }

  // API functions to inject
  function apiToggle(desired) {
    if (!window.dvDebug) {
      throw new Error('Debug API not available. Make sure you are logged in as superadmin.');
    }
    if (desired === true) {
      window.dvDebug.open();
    } else if (desired === false) {
      window.dvDebug.close();
    } else {
      window.dvDebug.toggle();
    }
  }

  function apiSetTool(tool) {
    if (!window.dvDebug) {
      throw new Error('Debug API not available. Make sure you are logged in as superadmin.');
    }
    window.dvDebug.setTool(tool);
  }

  function getState() {
    const LS_KEY = 'dv_debug_visible';
    const TOOL_LS_KEY = 'dv_debug_active_tool';
    
    const isOpen = window.dvDebug 
      ? window.dvDebug.isOpen() 
      : localStorage.getItem(LS_KEY) === '1';
    const tool = localStorage.getItem(TOOL_LS_KEY) || 'role';
    const hasApi = !!window.dvDebug;
    
    return { isOpen, tool, hasApi };
  }

  // Load current state
  async function loadState() {
    try {
      const tab = await getActiveTab();
      currentTabId = tab.id;

      if (!isAllowedUrl(tab.url)) {
        updateUI(false, false, null, 'Please navigate to dragvertising.com or localhost:8080');
        return;
      }

      const state = await execScript(getState);
      
      if (!state) {
        updateUI(false, false, null, 'Unable to read debug state');
        return;
      }

      if (!state.hasApi) {
        updateUI(false, false, null, 'Debug API not found. Make sure you are logged in as superadmin.');
        return;
      }

      updateUI(true, state.isOpen, state.tool);
    } catch (error) {
      console.error('Error loading state:', error);
      updateUI(false, false, null, error.message || 'Connection error');
    }
  }

  // Event handlers
  openBtn.addEventListener('click', async () => {
    try {
      await execScript(apiToggle, [true]);
      await loadState(); // Refresh state
    } catch (error) {
      updateUI(false, false, null, error.message);
    }
  });

  closeBtn.addEventListener('click', async () => {
    try {
      await execScript(apiToggle, [false]);
      await loadState(); // Refresh state
    } catch (error) {
      updateUI(false, false, null, error.message);
    }
  });

  toggleBtn.addEventListener('click', async () => {
    try {
      await execScript(apiToggle, [null]);
      await loadState(); // Refresh state
    } catch (error) {
      updateUI(false, false, null, error.message);
    }
  });

  setToolBtn.addEventListener('click', async () => {
    const tool = toolSelect.value;
    if (!tool) return;
    try {
      await execScript(apiSetTool, [tool]);
      await loadState(); // Refresh state
    } catch (error) {
      updateUI(false, false, null, error.message);
    }
  });

  // Tool grid buttons
  document.querySelectorAll('.tool').forEach((el) => {
    el.addEventListener('click', async () => {
      const tool = el.getAttribute('data-tool');
      if (!tool) return;
      try {
        toolSelect.value = tool;
        await execScript(apiSetTool, [tool]);
        await execScript(apiToggle, [true]);
        await loadState(); // Refresh state
      } catch (error) {
        updateUI(false, false, null, error.message);
      }
    });
  });

  // Initialize on load
  loadState();

  // Refresh state every 2 seconds to keep UI in sync
  setInterval(() => {
    if (isConnected) {
      loadState();
    }
  }, 2000);
})();
