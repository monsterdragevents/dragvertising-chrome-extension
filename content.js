/**
 * Dragvertising Superadmin Debug Extension - Content Script
 * 
 * This script runs on Dragvertising pages and:
 * 1. Sets extension presence flags
 * 2. Injects the SuperAdminDebug component into the page
 * 3. Handles communication with the popup
 * 
 * @version 2.0.0
 */

(function() {
  'use strict';

  const EXTENSION_ID = 'dv-debug-extension';
  const PRESENCE_KEY = 'dv_ext_present';
  const TIMESTAMP_KEY = 'dv_ext_timestamp';
  const INJECTED_KEY = 'dvDebugInjected';
  const CONTAINER_ID = 'dv-debug-container';

  // ============================================================================
  // Extension Presence Detection
  // ============================================================================

  function setPresenceFlag() {
    try {
      localStorage.setItem(PRESENCE_KEY, '1');
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('[Dragvertising Debug Extension] Could not set presence flag:', error);
    }
  }

  function heartbeat() {
    try {
      localStorage.setItem(TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      // Ignore errors silently
    }
  }

  // Initialize presence
  setPresenceFlag();
  
  // Heartbeat every 5 seconds to keep presence fresh
  setInterval(heartbeat, 5000);

  // ============================================================================
  // Message Handling
  // ============================================================================

  if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.type === 'ping') {
        sendResponse({ success: true, timestamp: Date.now() });
        return true; // Keep channel open for async response
      }
      
      if (request.type === 'inject-debug') {
        injectDebugComponent().then(() => {
          sendResponse({ success: true });
        }).catch((error) => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
      }

      if (request.type === 'check-status') {
        const status = getDebugStatus();
        sendResponse({ success: true, status });
        return true;
      }
    });
  }

  // ============================================================================
  // Debug Status Checker
  // ============================================================================

  function getDebugStatus() {
    return {
      hasApi: !!window.dvDebug,
      isInjected: !!window[INJECTED_KEY],
      hasComponent: !!window.__DRAGVERTISING_DEBUG__?.SuperAdminDebug,
      hasReact: !!window.React,
      hasReactDOM: !!window.ReactDOM,
      isOpen: window.dvDebug?.isOpen() || false
    };
  }

  // ============================================================================
  // Component Injection
  // ============================================================================

  /**
   * Waits for the SuperAdminDebug component to be exposed by the app
   */
  function waitForComponent(timeout = 15000) {
    return new Promise((resolve, reject) => {
      if (window.__DRAGVERTISING_DEBUG__?.SuperAdminDebug) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.__DRAGVERTISING_DEBUG__?.SuperAdminDebug) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('SuperAdminDebug component not found after timeout'));
        }
      }, 100);
    });
  }

  /**
   * Waits for React and ReactDOM to be available
   */
  function waitForReact(timeout = 10000) {
    return new Promise((resolve, reject) => {
      if (window.React && window.ReactDOM) {
        resolve();
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.React && window.ReactDOM) {
          clearInterval(checkInterval);
          resolve();
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          reject(new Error('React/ReactDOM not found after timeout'));
        }
      }, 100);
    });
  }

  /**
   * Injects the SuperAdminDebug component into the page
   * The component will be rendered in a container that's part of the page DOM
   * but the component itself needs access to React context providers
   */
  async function injectDebugComponent() {
    // Check if already injected
    if (window[INJECTED_KEY]) {
      console.log('[Dragvertising Debug Extension] Component already injected');
      return;
    }

    try {
      // Wait for dependencies
      await Promise.all([
        waitForComponent(),
        waitForReact()
      ]);

      const { SuperAdminDebug } = window.__DRAGVERTISING_DEBUG__;
      
      if (!SuperAdminDebug) {
        throw new Error('SuperAdminDebug component not available');
      }

      // Remove existing container if present
      const existing = document.getElementById(CONTAINER_ID);
      if (existing) {
        existing.remove();
      }

      // Create container for the debug component
      const container = document.createElement('div');
      container.id = CONTAINER_ID;
      container.setAttribute('data-extension-id', EXTENSION_ID);
      container.style.cssText = `
        position: fixed;
        left: 12px;
        bottom: 12px;
        z-index: 999999;
        pointer-events: none;
      `;
      
      // Ensure body exists before appending
      if (!document.body) {
        await new Promise(resolve => {
          if (document.body) {
            resolve();
          } else {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
          }
        });
      }

      document.body.appendChild(container);

      // Render the component using React
      const root = window.ReactDOM.createRoot(container);
      root.render(window.React.createElement(SuperAdminDebug));
      
      // Mark as injected
      window[INJECTED_KEY] = true;
      
      console.log('[Dragvertising Debug Extension] Component injected successfully');
      
      // Dispatch custom event for other scripts
      window.dispatchEvent(new CustomEvent('dv-debug-injected', {
        detail: { container, root }
      }));

    } catch (error) {
      console.error('[Dragvertising Debug Extension] Error injecting component:', error);
      throw error;
    }
  }

  // ============================================================================
  // Auto-injection
  // ============================================================================

  /**
   * Attempts to inject the component when the page is ready
   */
  function attemptAutoInjection() {
    // Wait a bit for the app to initialize
    const delay = document.readyState === 'loading' ? 2000 : 1000;
    
    setTimeout(() => {
      injectDebugComponent().catch((error) => {
        // Silently fail - component will be injected when popup requests it
        console.debug('[Dragvertising Debug Extension] Auto-injection failed (will retry on demand):', error.message);
      });
    }, delay);
  }

  // Start auto-injection when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attemptAutoInjection, { once: true });
  } else {
    attemptAutoInjection();
  }

  // Also try injection on navigation (for SPAs)
  let lastUrl = location.href;
  new MutationObserver(() => {
    const url = location.href;
    if (url !== lastUrl) {
      lastUrl = url;
      // Reset injection flag on navigation
      window[INJECTED_KEY] = false;
      // Attempt injection again
      setTimeout(attemptAutoInjection, 500);
    }
  }).observe(document, { subtree: true, childList: true });

})();
