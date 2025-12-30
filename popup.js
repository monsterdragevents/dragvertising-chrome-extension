/**
 * Dragvertising Superadmin Debug Extension - Popup Script
 * 
 * Handles the extension popup UI and communication with content script
 * 
 * @version 2.0.0
 */

(function() {
  'use strict';

  // ============================================================================
  // DOM Elements
  // ============================================================================

  const elements = {
    openBtn: document.getElementById('open'),
    closeBtn: document.getElementById('close'),
    toggleBtn: document.getElementById('toggle'),
    setToolBtn: document.getElementById('setTool'),
    toolSelect: document.getElementById('tool'),
    statusChip: document.getElementById('status'),
    errorMsg: document.getElementById('error')
  };

  // ============================================================================
  // State
  // ============================================================================

  let state = {
    currentTabId: null,
    isConnected: false,
    isOpen: false,
    currentTool: 'role',
    refreshInterval: null
  };

  // ============================================================================
  // UI Updates
  // ============================================================================

  /**
   * Updates the popup UI based on connection state
   */
  function updateUI(connected, isOpen, tool, error = null) {
    state.isConnected = connected;
    state.isOpen = isOpen;
    state.currentTool = tool || 'role';

    // Handle error state
    if (error) {
      showError(error);
      disableControls(true);
      return;
    }

    // Clear error
    hideError();

    // Update status chip
    updateStatusChip(connected, isOpen);

    // Enable/disable controls
    disableControls(!connected);

    // Update tool select
    if (elements.toolSelect && tool) {
      elements.toolSelect.value = tool;
    }
  }

  /**
   * Updates the status chip appearance
   */
  function updateStatusChip(connected, isOpen) {
    if (!elements.statusChip) return;

    if (!connected) {
      elements.statusChip.textContent = 'Disconnected';
      elements.statusChip.style.background = '#fff3cd';
      elements.statusChip.style.borderColor = '#ffc107';
    } else if (isOpen) {
      elements.statusChip.textContent = 'Open';
      elements.statusChip.style.background = '#e6ffed';
      elements.statusChip.style.borderColor = '#2ecc71';
    } else {
      elements.statusChip.textContent = 'Closed';
      elements.statusChip.style.background = '#fff';
      elements.statusChip.style.borderColor = '#d0d0d0';
    }
  }

  /**
   * Shows an error message
   */
  function showError(message) {
    if (elements.errorMsg) {
      elements.errorMsg.textContent = message;
      elements.errorMsg.style.display = 'block';
    }
    if (elements.statusChip) {
      elements.statusChip.textContent = 'Error';
      elements.statusChip.style.background = '#fee';
      elements.statusChip.style.borderColor = '#f00';
    }
  }

  /**
   * Hides the error message
   */
  function hideError() {
    if (elements.errorMsg) {
      elements.errorMsg.style.display = 'none';
    }
  }

  /**
   * Enables or disables all controls
   */
  function disableControls(disabled) {
    const controls = [
      elements.openBtn,
      elements.closeBtn,
      elements.toggleBtn,
      elements.setToolBtn,
      elements.toolSelect
    ];

    controls.forEach(el => {
      if (el) {
        el.disabled = disabled;
      }
    });
  }

  // ============================================================================
  // Tab Management
  // ============================================================================

  /**
   * Gets the currently active tab
   */
  async function getActiveTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) {
        throw new Error('No active tab found');
      }
      return tab;
    } catch (error) {
      console.error('[Popup] Error getting active tab:', error);
      throw error;
    }
  }

  /**
   * Checks if a URL is allowed for the extension
   */
  function isAllowedUrl(url) {
    if (!url) return false;
    const allowedPattern = /^https?:\/\/(localhost:8080|(?:www\.)?dragvertising\.com)/;
    return allowedPattern.test(url);
  }

  // ============================================================================
  // Script Execution
  // ============================================================================

  /**
   * Executes a function in the page context
   */
  async function execScript(func, args = []) {
    if (!state.currentTabId) {
      throw new Error('No active tab');
    }

    // Serialize arguments safely
    const safeArgs = Array.isArray(args)
      ? args.map((v) => {
          if (v === undefined || v === null) return null;
          try {
            return JSON.parse(JSON.stringify(v));
          } catch {
            return String(v);
          }
        })
      : [];

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: state.currentTabId },
        func,
        args: safeArgs,
        world: 'MAIN'
      });
      
      return results?.[0]?.result;
    } catch (error) {
      console.error('[Popup] Error executing script:', error);
      throw new Error(`Failed to execute: ${error.message}`);
    }
  }

  // ============================================================================
  // Debug API Functions
  // ============================================================================

  /**
   * Functions that will be injected into the page to interact with window.dvDebug
   */
  const apiFunctions = {
    toggle: function(desired) {
      if (!window.dvDebug) {
        throw new Error('Debug API not available. Make sure you are logged in as superadmin and the component is injected.');
      }
      if (desired === true) {
        window.dvDebug.open();
      } else if (desired === false) {
        window.dvDebug.close();
      } else {
        window.dvDebug.toggle();
      }
    },

    setTool: function(tool) {
      if (!window.dvDebug) {
        throw new Error('Debug API not available. Make sure you are logged in as superadmin and the component is injected.');
      }
      window.dvDebug.setTool(tool);
    },

    getState: function() {
      const LS_KEY = 'dv_debug_visible';
      const TOOL_LS_KEY = 'dv_debug_active_tool';
      
      const isOpen = window.dvDebug 
        ? window.dvDebug.isOpen() 
        : localStorage.getItem(LS_KEY) === '1';
      const tool = localStorage.getItem(TOOL_LS_KEY) || 'role';
      const hasApi = !!window.dvDebug;
      
      return { isOpen, tool, hasApi };
    }
  };

  // ============================================================================
  // State Management
  // ============================================================================

  /**
   * Loads the current debug panel state from the page
   */
  async function loadState() {
    try {
      const tab = await getActiveTab();
      state.currentTabId = tab.id;

      // Check if URL is allowed
      if (!isAllowedUrl(tab.url)) {
        updateUI(false, false, null, 'Please navigate to dragvertising.com or localhost:8080');
        return;
      }

      // First, try to inject the component if needed
      try {
        await chrome.scripting.executeScript({
          target: { tabId: state.currentTabId },
          func: () => {
            // Trigger injection if not already done
            if (!window.dvDebugInjected && window.__DRAGVERTISING_DEBUG__) {
              // Dispatch event to trigger injection
              window.dispatchEvent(new CustomEvent('dv-debug-request-injection'));
            }
          },
          world: 'MAIN'
        });
      } catch (error) {
        console.debug('[Popup] Injection trigger failed (may already be injected):', error);
      }

      // Wait a bit for injection
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get state
      const result = await execScript(apiFunctions.getState);
      
      if (!result) {
        updateUI(false, false, null, 'Unable to read debug state');
        return;
      }

      if (!result.hasApi) {
        updateUI(false, false, null, 'Debug API not found. Make sure you are logged in as superadmin.');
        return;
      }

      updateUI(true, result.isOpen, result.tool);
    } catch (error) {
      console.error('[Popup] Error loading state:', error);
      updateUI(false, false, null, error.message || 'Connection error');
    }
  }

  /**
   * Starts auto-refresh of state
   */
  function startAutoRefresh() {
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval);
    }
    
    state.refreshInterval = setInterval(() => {
      if (state.isConnected) {
        loadState().catch(console.error);
      }
    }, 2000);
  }

  /**
   * Stops auto-refresh
   */
  function stopAutoRefresh() {
    if (state.refreshInterval) {
      clearInterval(state.refreshInterval);
      state.refreshInterval = null;
    }
  }

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handles button clicks with error handling
   */
  async function handleAction(action, ...args) {
    try {
      await execScript(apiFunctions[action], args);
      await loadState(); // Refresh state after action
    } catch (error) {
      updateUI(false, false, null, error.message);
    }
  }

  // Open button
  if (elements.openBtn) {
    elements.openBtn.addEventListener('click', () => {
      handleAction('toggle', true);
    });
  }

  // Close button
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => {
      handleAction('toggle', false);
    });
  }

  // Toggle button
  if (elements.toggleBtn) {
    elements.toggleBtn.addEventListener('click', () => {
      handleAction('toggle', null);
    });
  }

  // Set tool button
  if (elements.setToolBtn && elements.toolSelect) {
    elements.setToolBtn.addEventListener('click', () => {
      const tool = elements.toolSelect.value;
      if (tool) {
        handleAction('setTool', tool);
      }
    });
  }

  // Tool grid buttons
  document.querySelectorAll('.tool').forEach((el) => {
    el.addEventListener('click', async () => {
      const tool = el.getAttribute('data-tool');
      if (!tool) return;
      
      try {
        if (elements.toolSelect) {
          elements.toolSelect.value = tool;
        }
        await execScript(apiFunctions.setTool, [tool]);
        await execScript(apiFunctions.toggle, [true]);
        await loadState();
      } catch (error) {
        updateUI(false, false, null, error.message);
      }
    });
  });

  // ============================================================================
  // Initialization
  // ============================================================================

  /**
   * Initializes the popup
   */
  async function init() {
    // Initial state load
    await loadState();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Clean up on popup close
    window.addEventListener('beforeunload', () => {
      stopAutoRefresh();
    });
  }

  // Start initialization when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
