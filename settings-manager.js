// ========================================
// SETTINGS OVERLAY HTML INJECTION
// ========================================

(function createSettingsOverlay() {
  // Create the settings overlay HTML
  const settingsHTML = `
<div id="settingsOverlay" style="
  display: none;
  position: fixed;
  top: 0; left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  z-index: 9999999;
  align-items: flex-start;
  justify-content: center;
  padding-top: 250px;
">
  <div id="settingsContainer" style="
    width: 900px;
    height: 600px;
    background: #ffffff;
    border-radius: 20px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    position: relative;
    overflow: hidden;
    animation: settingsSlideIn 0.3s ease-out forwards;
  ">
    <!-- Header -->
    <div style="
      padding: 24px 32px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #fafbfc;
    ">
      <h2 style="
        margin: 0;
        font-size: 24px;
        font-weight: 600;
        color: #1a1a1a;
        letter-spacing: -0.5px;
      ">Settings</h2>
      
      <!-- Close button -->
      <button id="closeSettingsPopup" style="
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #f3f4f6;
        color: #6b7280;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">&times;</button>
    </div>

    <!-- Tab Navigation -->
    <div class="settings-tabs" style="
      display: flex;
      padding: 0 32px;
      background: #fafbfc;
      border-bottom: 1px solid #e5e7eb;
    ">
      <button class="settings-tab active" data-tab="company" style="
        padding: 16px 24px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      ">Company</button>
      
      <button class="settings-tab" data-tab="map" style="
        padding: 16px 24px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      ">Map Settings</button>
      
      <button class="settings-tab" data-tab="database" style="
        padding: 16px 24px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      ">Database</button>
      
      <button class="settings-tab" data-tab="googleads" style="
        padding: 16px 24px;
        border: none;
        background: none;
        font-size: 14px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        position: relative;
        transition: all 0.2s ease;
      ">Google Ads</button>
    </div>

    <!-- Tab Content Container -->
    <div class="settings-content" style="
      flex: 1;
      padding: 32px;
      overflow-y: auto;
      background: #ffffff;
    ">
<!-- Company Tab -->
      <div class="settings-panel active" data-panel="company">
        <div style="
          max-width: 600px;
          margin: 0 auto;
          padding: 40px 20px;
        ">
          <h3 style="
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 24px;
            text-align: center;
          ">Select Your Company</h3>
          
          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          ">
            <div style="
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 8px;
            ">Current Company</div>
            <div style="
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
            " id="currentCompanyValue">Not Selected</div>
          </div>
          
          <div style="
            margin-bottom: 20px;
          ">
            <label style="
              display: block;
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 8px;
            ">Choose your company:</label>
            <select id="companySelectDropdown" style="
              width: 100%;
              padding: 10px 12px;
              font-size: 15px;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              background: white;
              cursor: pointer;
            ">
              <option value="">-- Select Company --</option>
            </select>
          </div>
          
          <button id="saveCompanyButton" style="
            width: 100%;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.25);
          ">Save Company Selection</button>
        </div>
      </div>
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </div>
          
          <h3 style="
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
          ">Select Your Company</h3>
          
          <p style="
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 24px;
            line-height: 1.6;
          ">Choose your company to personalize reports and analytics</p>
          
          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          ">
            <div style="
              font-size: 14px;
              color: #6b7280;
              margin-bottom: 8px;
            ">Current Company</div>
            <div style="
              font-size: 18px;
              font-weight: 600;
              color: #1a1a1a;
            " id="currentCompanyValue">---</div>
          </div>
          
          <button id="changeCompanyButton" style="
            width: 100%;
            padding: 12px 24px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.25);
          ">Change Company</button>
        </div>
      </div>

      <!-- Map Settings Tab -->
      <div class="settings-panel" data-panel="map">
        <div style="max-width: 600px; margin: 0 auto;">
          <h3 style="
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 24px;
          ">Map Display Options</h3>
          
          <div class="settings-group" style="
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 20px;
          ">
            <div class="toggle-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a;">Show Map</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Display geographical data visualization</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleMap" checked>
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="toggle-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a;">Desktop Market Share</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Show market share for desktop devices</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleDesktopShare">
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="toggle-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a;">Desktop Average Rank</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Display ranking data for desktop</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleDesktopRank">
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="toggle-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
              margin-bottom: 20px;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a;">Mobile Market Share</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Show market share for mobile devices</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleMobileShare">
                <span class="toggle-slider"></span>
              </label>
            </div>
            
            <div class="toggle-item" style="
              display: flex;
              align-items: center;
              justify-content: space-between;
            ">
              <div>
                <div style="font-size: 14px; font-weight: 500; color: #1a1a1a;">Mobile Average Rank</div>
                <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Display ranking data for mobile</div>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="toggleMobileRank">
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Database Tab -->
      <div class="settings-panel" data-panel="database">
        <div style="max-width: 600px; margin: 0 auto;">
          <h3 style="
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 24px;
          ">Database Management</h3>
          
          <div style="
            background: #f9fafb;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
          ">
            <h4 style="
              font-size: 14px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 16px;
            ">Storage Usage</h4>
            <div id="databaseUsageBars">
              <!-- Storage bars will be populated by JavaScript -->
            </div>
          </div>
          
          <div style="
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
          ">
            <h4 style="
              font-size: 14px;
              font-weight: 600;
              color: #dc2626;
              margin-bottom: 8px;
            ">Clear Cache</h4>
            <p style="
              font-size: 13px;
              color: #7f1d1d;
              margin-bottom: 16px;
              line-height: 1.5;
            ">This will delete all cached data and reload fresh data from the server. The process may take a few moments.</p>
            <button id="refreshIDBButton" style="
              padding: 10px 20px;
              background: #dc2626;
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: all 0.2s ease;
            ">Refresh Database</button>
          </div>
        </div>
      </div>

      <!-- Google Ads Tab -->
      <div class="settings-panel" data-panel="googleads">
        <div style="max-width: 500px; margin: 0 auto; text-align: center; padding: 40px 0;">
          <div style="
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
            border-radius: 20px;
            margin: 0 auto 24px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
            </svg>
          </div>
          
          <h3 style="
            font-size: 20px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 16px;
          ">Google Ads Integration</h3>
          
          <div id="googleAdsStatus" style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            margin-bottom: 24px;
            font-size: 14px;
            color: #6b7280;
          ">No data uploaded yet</div>
          
          <button id="provideFeedFileBtn" style="
            width: 100%;
            padding: 12px 24px;
            background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
            color: white;
            border: none;
            border-radius: 10px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 4px 15px rgba(66, 133, 244, 0.25);
          ">Provide Feed File</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  @keyframes settingsSlideIn {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Tab styles */
  .settings-tab {
    position: relative;
  }
  
  .settings-tab::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: transparent;
    transition: background 0.3s ease;
  }
  
  .settings-tab:hover {
    color: #4b5563 !important;
  }
  
  .settings-tab.active {
    color: #667eea !important;
  }
  
  .settings-tab.active::after {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
  
/* Panel transitions */
.settings-panel {
  display: none !important;
  opacity: 0;
  animation: panelFadeIn 0.3s ease-out forwards;
}

.settings-panel.active {
  display: block !important;
  opacity: 1;
}
  
  @keyframes panelFadeIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  /* Toggle switch styles */
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #e5e7eb;
    transition: .3s;
    border-radius: 26px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: .3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  }
  
  .toggle-switch input:checked + .toggle-slider {
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  }
  
  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }
  
  /* Button hover effects */
  #changeCompanyButton:hover,
  #provideFeedFileBtn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
  }
  
  #refreshIDBButton:hover {
    background: #b91c1c;
    transform: scale(1.05);
  }
  
  #closeSettingsPopup:hover {
    background: #e5e7eb;
    color: #1a1a1a;
  }
  
  /* Storage usage bars */
  .storage-bar-item {
    margin-bottom: 16px;
  }
  
  .storage-bar-label {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: #6b7280;
    margin-bottom: 6px;
  }
  
  .storage-bar-container {
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .storage-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    border-radius: 4px;
    transition: width 0.3s ease;
  }
</style>
`;

  // Inject the HTML into the body
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = settingsHTML;
  document.body.appendChild(tempDiv.firstElementChild);
  
  console.log("[Settings Manager] Settings overlay HTML injected");
})();

// ========================================
// SETTINGS OVERLAY MANAGEMENT
// ========================================

// Initialize global settings overlay object
window.settingsOverlay = {
  isOpen: false,
  activeTab: 'company'
};

function initSettingsOverlayHandlers() {
  // Initialize DOM elements storage inside the function
  window.settingsOverlayElements = {};
  console.log("[Settings Manager] Initializing settings overlay handlers");
  
  // Cache DOM elements globally
  window.settingsOverlayElements.overlay = document.getElementById("settingsOverlay");
  window.settingsOverlayElements.container = document.getElementById("settingsContainer");
  window.settingsOverlayElements.closeBtn = document.getElementById("closeSettingsPopup");
  window.settingsOverlayElements.tabs = document.querySelectorAll(".settings-tab");
  window.settingsOverlayElements.panels = document.querySelectorAll(".settings-panel");
  
  if (!window.settingsOverlayElements.overlay || !window.settingsOverlayElements.container) {
    console.error("[Settings Manager] Settings overlay elements not found!");
    return;
  }
  
  // Tab switching functionality
  function switchTab(tabName) {
    // Update tab states
    window.settingsOverlayElements.tabs.forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
// Update panel visibility
window.settingsOverlayElements.panels.forEach(panel => {
  if (panel.dataset.panel === tabName) {
    panel.classList.add('active');
    panel.style.display = 'block';
  } else {
    panel.classList.remove('active');
    panel.style.display = 'none';
  }
});
    
    // Store active tab
    window.settingsOverlay.activeTab = tabName;
    
    // Initialize tab-specific content
    initializeTabContent(tabName);
  }
  
// Initialize content when tab is activated
  function initializeTabContent(tabName) {
    switch(tabName) {
case 'company':
  updateCurrentCompanyDisplay();
  
  // Populate company dropdown when company tab is shown
  const dropdown = document.getElementById("companySelectDropdown");
  if (dropdown) {
    // Try multiple data sources
    let companies = [];
    
    if (window.companyStatsData && window.companyStatsData.length > 0) {
      companies = [...new Set(window.companyStatsData.map(r => r.source).filter(Boolean))];
    } else if (window.allRows && window.allRows.length > 0) {
      companies = [...new Set(window.allRows.map(r => r.source).filter(Boolean))];
    }
    
    console.log("[Settings] Found companies:", companies);
    
    dropdown.innerHTML = '<option value="">-- Select Company --</option>';
    companies.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c;
      opt.textContent = c;
      if (c === window.myCompany) {
        opt.selected = true;
      }
      dropdown.appendChild(opt);
    });
    
    // If no companies found, show a message
    if (companies.length === 0) {
      dropdown.innerHTML = '<option value="">No companies found - data may still be loading</option>';
    }
  }
  break;
        
      case 'map':
        initializeMapToggles();
        break;
      case 'database':
        updateDatabaseUsageBars();
        break;
      case 'googleads':
        updateGoogleAdsStatus();
        break;
    }
  }
  
  // Handle escape key
  function handleEscapeKey(e) {
    if (e.key === 'Escape' && window.settingsOverlay.isOpen) {
      window.closeSettingsOverlay();
    }
  }
  
  // Event listeners
  if (window.settingsOverlayElements.closeBtn) {
    window.settingsOverlayElements.closeBtn.addEventListener("click", window.closeSettingsOverlay);
  }
  
  // Click outside to close
  window.settingsOverlayElements.overlay.addEventListener("click", function(e) {
    if (e.target === window.settingsOverlayElements.overlay) {
      window.closeSettingsOverlay();
    }
  });
  
// Tab click handlers
  window.settingsOverlayElements.tabs.forEach(tab => {
    // Use direct onclick instead of addEventListener
    tab.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("[Settings] Tab clicked:", this.dataset.tab);
      switchTab(this.dataset.tab);
    };
  });
  
// Update company display
function updateCurrentCompanyDisplay() {
  const companyValEl = document.getElementById("currentCompanyValue");
  if (companyValEl) {
    let val = window.myCompany || "";
    
    if (!val) {
      const cTextEl = document.getElementById("companyText");
      if (cTextEl && cTextEl.textContent && cTextEl.textContent !== "Not Selected") {
        val = cTextEl.textContent.trim();
      }
    }
    
    // Also check filterState
    if (!val && window.filterState && window.filterState.company) {
      val = window.filterState.company;
    }
    
    companyValEl.textContent = val || "Not Selected";
    console.log("[Settings] Updated company display to:", val || "Not Selected");
  }
}
  
  // Initialize map toggles
  function initializeMapToggles() {
    const mapToggles = {
      toggleMap: document.getElementById("toggleMap"),
      toggleDesktopShare: document.getElementById("toggleDesktopShare"),
      toggleDesktopRank: document.getElementById("toggleDesktopRank"),
      toggleMobileShare: document.getElementById("toggleMobileShare"),
      toggleMobileRank: document.getElementById("toggleMobileRank")
    };
    
    Object.entries(mapToggles).forEach(([key, toggle]) => {
      if (toggle) {
        // Set initial state
        const savedValue = window.localEmbedToggles?.[key];
        if (typeof savedValue === "boolean") {
          toggle.checked = savedValue;
        }
        
        // Add change listener
        toggle.addEventListener("change", function() {
          if (typeof updateToggle === "function") {
            updateToggle(key, this.checked);
          }
          if (typeof updateHomeMapMetrics === "function") {
            updateHomeMapMetrics();
          }
        });
      }
    });
  }
  
  // Update Google Ads status
  function updateGoogleAdsStatus() {
    const statusEl = document.getElementById("googleAdsStatus");
    if (statusEl && window.googleSheetsData) {
      const hasData = window.googleSheetsData.productPerformance?.length > 0 || 
                     window.googleSheetsData.locationRevenue?.length > 0;
      
      if (hasData) {
        statusEl.innerHTML = `
          <div style="color: #059669; font-weight: 500;">✓ Google Sheets data loaded</div>
          <div style="font-size: 12px; margin-top: 4px;">
            ${window.googleSheetsData.productPerformance?.length || 0} products, 
            ${window.googleSheetsData.locationRevenue?.length || 0} locations
          </div>
        `;
      }
    }
  }
  
// Company save button handler
  const saveCompanyBtn = document.getElementById("saveCompanyButton");
  if (saveCompanyBtn) {
    saveCompanyBtn.onclick = function() {
      const dropdown = document.getElementById("companySelectDropdown");
      const selectedVal = dropdown.value.trim();
      
      if (!selectedVal) {
        alert("Please select a company first");
        return;
      }
      
      // Update myCompany
      window.myCompany = selectedVal;
      window.filterState.company = selectedVal;
      
      // Tell parent to save
      if (window.parent && window.embedToken) {
        window.parent.postMessage({
          command: "saveMyCompany",
          newValue: selectedVal
        }, "*");
      }
      
      // Update display
      updateCurrentCompanyDisplay();
      
      // Update the company text in main UI
      const companyText = document.getElementById("companyText");
      if (companyText) {
        companyText.textContent = selectedVal;
      }
      
      alert("Company saved successfully!");
    };
  }
  
  // Google Ads button handler
  const provideFeedBtn = document.getElementById("provideFeedFileBtn");
  if (provideFeedBtn) {
    provideFeedBtn.addEventListener("click", function() {
      window.closeSettingsOverlay();
      const urlOverlay = document.getElementById("googleSheetsUrlOverlay");
      if (urlOverlay) {
        urlOverlay.style.display = "flex";
      }
    });
  }
  
  // Refresh IDB button handler
  const refreshIDBBtn = document.getElementById("refreshIDBButton");
  if (refreshIDBBtn) {
    refreshIDBBtn.addEventListener("click", function() {
      const confirmRefresh = confirm(
        "This will delete all cached data and reload fresh data from the server. " +
        "The process may take a few moments. Continue?"
      );
      
      if (confirmRefresh) {
        window.closeSettingsOverlay();
        if (typeof window.refreshIDBData === "function") {
          window.refreshIDBData();
        }
      }
    });
  }
  
  // Create the global functions
window.openSettingsOverlay = function(initialTab = 'company') {
  window.settingsOverlayElements.overlay.style.display = "flex";
  window.settingsOverlay.isOpen = true;
  
  // Add a small delay to ensure data is available
  setTimeout(() => {
    switchTab(initialTab);
  }, 100);
  
  // Add escape key listener
  document.addEventListener('keydown', handleEscapeKey);
};
  
  // Close settings overlay
  window.closeSettingsOverlay = function() {
    window.settingsOverlayElements.overlay.style.display = "none";
    window.settingsOverlay.isOpen = false;
    
    // Remove escape key listener
    document.removeEventListener('keydown', handleEscapeKey);
  };
}

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSettingsOverlayHandlers);
} else {
  initSettingsOverlayHandlers();
}

// Update database usage bars
window.updateDatabaseUsageBars = function() {
  const container = document.getElementById("databaseUsageBars");
  if (!container) return;
  
  // Get all IDB tables and calculate sizes
  if (window.embedIDB && typeof window.embedIDB.open === "function") {
    window.embedIDB.open().then(db => {
      if (!db) return;
      
      const tx = db.transaction("projectData", "readonly");
      const store = tx.objectStore("projectData");
      const req = store.getAll();
      
      req.onsuccess = (event) => {
        const allData = event.target.result || [];
        const sizes = {};
        let totalSize = 0;
        
        allData.forEach(record => {
          const size = new Blob([JSON.stringify(record.data)]).size;
          sizes[record.tableName] = size;
          totalSize += size;
        });
        
        // Render the bars
        container.innerHTML = `
          <div class="storage-bar-item">
            <div class="storage-bar-label">
              <span>Total Storage</span>
              <span>${formatBytes(totalSize)}</span>
            </div>
            <div class="storage-bar-container">
              <div class="storage-bar-fill" style="width: 100%;"></div>
            </div>
          </div>
          ${Object.entries(sizes).map(([name, size]) => `
            <div class="storage-bar-item">
              <div class="storage-bar-label">
                <span style="font-size: 12px; color: #9ca3af;">${name}</span>
                <span style="font-size: 12px;">${formatBytes(size)}</span>
              </div>
              <div class="storage-bar-container">
                <div class="storage-bar-fill" style="width: ${(size/totalSize*100).toFixed(1)}%; opacity: 0.7;"></div>
              </div>
            </div>
          `).join('')}
        `;
      };
    });
  }
};

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Update existing settings button to use new overlay
(function updateSettingsButton() {
  // Ensure DOM is ready
  function attachListener() {
    const settingsButton = document.getElementById("openSettingsPopup");
    if (!settingsButton) {
      console.error("[Settings] Button #openSettingsPopup not found!");
      return;
    }
    
    console.log("[Settings] Found button, attaching listener");
    
    settingsButton.onclick = function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      console.log("[Settings] Button clicked!");
      
      const isDemo = window.dataPrefix?.startsWith("demo_") || window._isDemoMode === true;
      
      if (isDemo) {
        console.log("[Settings] Skipping settings overlay for DEMO account");
        return;
      }
      
      const overlay = document.getElementById("settingsOverlay");
      if (overlay) {
        console.log("[Settings] Showing overlay directly");
        overlay.style.display = "flex";
        window.settingsOverlay.isOpen = true;
      } else {
        console.error("[Settings] Overlay element not found!");
      }
    };
  }
  
  // Try multiple times to ensure DOM is ready
  setTimeout(attachListener, 1000);
})();

// Function to handle the complete IDB refresh process
window.refreshIDBData = async function() {
  try {
    console.log("[🔄 IDB Refresh] Starting complete database refresh...");
    
    // Show loading overlay
    const loader = document.getElementById("overlayLoader");
    if (loader) {
      loader.style.display = "flex";
      loader.style.opacity = "1";
    }

    // Step 1: Delete the existing database
    console.log("[🔄 IDB Refresh] Step 1: Deleting existing database...");
    if (window.embedIDB && typeof window.embedIDB.deleteDatabase === "function") {
      await window.embedIDB.deleteDatabase();
    }
    
    // Step 2: Clear only table data, preserve project structure temporarily
    const savedProjectData = window.projectData;
    const savedDemoProjectData = window.demoProjectData;
    const savedRealProjectData = window.realProjectData;
    
    window.allRows = [];
    window.companyStatsData = [];
    window.marketTrendsData = [];
    window.googleSheetsData = null;
    
    console.log("[🔄 IDB Refresh] Step 2: Cleared cached data");

    // Restore project data immediately
    window.projectData = savedProjectData;
    window.demoProjectData = savedDemoProjectData;
    window.realProjectData = savedRealProjectData;

    // Step 3: Request fresh data from server
    console.log("[🔄 IDB Refresh] Step 3: Requesting fresh data from server...");
    
    // Set a flag to indicate we're doing a full refresh
    window._isRefreshingIDB = true;
    window._refreshRequestCount = 0;
    window._refreshExpectedCount = 2; // Expecting both demo and real account data
    
    // Request both demo and real account data
    window.parent.postMessage({
      command: "requestServerData", 
      projectNumber: 1,
      forceRefresh: true,
      requestBoth: true  // Signal to parent to send both demo and real data
    }, "*");

    // Also fetch fresh Google Sheets data if available
    const currentPrefix = window.dataPrefix ? window.dataPrefix.split('_pr')[0] + '_' : 'acc1_';
    if (window.googleSheetsManager && typeof window.googleSheetsManager.fetchAndStoreAll === "function") {
      window.googleSheetsManager.fetchAndStoreAll(currentPrefix)
        .then(({ productData, locationData }) => {
          window.googleSheetsData = {
            productPerformance: productData,
            locationRevenue: locationData
          };
          console.log("[IDB Refresh] Google Sheets data refreshed");
        })
        .catch(err => {
          console.log("[IDB Refresh] Google Sheets not available (user hasn't uploaded)");
          window.googleSheetsData = {
            productPerformance: [],
            locationRevenue: []
          };
        });
    }

  } catch (error) {
    console.error("[🔄 IDB Refresh] Error during refresh:", error);
    
    // Hide loader on error
    const loader = document.getElementById("overlayLoader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; }, 500);
    }
    
    alert("Error refreshing database. Please try again or refresh the page.");
  }
};

// Ensure localEmbedToggles exists
if (!window.localEmbedToggles) {
  window.localEmbedToggles = {};
}

// Google Sheets URL popup handlers
document.addEventListener('DOMContentLoaded', function() {
  const provideFeedBtn = document.getElementById("provideFeedFileBtn");
  const urlOverlay = document.getElementById("googleSheetsUrlOverlay");
  const urlInput = document.getElementById("googleSheetsUrlInput");
  const cancelBtn = document.getElementById("googleSheetsUrlCancel");
  const uploadBtn = document.getElementById("googleSheetsUrlUpload");

  if (provideFeedBtn && urlOverlay) {
    // Show popup when Provide Feed File is clicked
    provideFeedBtn.addEventListener("click", () => {
      urlOverlay.style.display = "flex";
      urlInput.value = ""; // Clear previous input
      urlInput.focus();
    });
    
    // Hide popup on cancel
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        urlOverlay.style.display = "none";
      });
    }
    
    // Process URL on upload
    if (uploadBtn) {
      uploadBtn.addEventListener("click", async () => {
        const url = urlInput.value.trim();
        
        if (!url) {
          alert("Please enter a Google Sheets URL");
          return;
        }
        
        if (!url.includes("docs.google.com/spreadsheets")) {
          alert("Please enter a valid Google Sheets URL");
          return;
        }
        
        // Hide the URL popup
        urlOverlay.style.display = "none";
        
        try {
          // Determine current account prefix
          const currentPrefix = window.dataPrefix ? window.dataPrefix.split('_pr')[0] + '_' : 'acc1_';
          if (window.googleSheetsManager && typeof window.googleSheetsManager.fetchAndStoreFromUrl === "function") {
            await window.googleSheetsManager.fetchAndStoreFromUrl(url, currentPrefix);
          }
          
          // Optionally close the settings overlay too
          const settingsOverlay = document.getElementById("settingsOverlay");
          if (settingsOverlay) {
            settingsOverlay.style.display = "none";
          }
        } catch (error) {
          alert(`Failed to process Google Sheets: ${error.message}`);
        }
      });
    }
    
    // Allow Enter key to submit
    if (urlInput) {
      urlInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          uploadBtn.click();
        }
      });
    }
  }
});

// Helper function to update toggle state
function updateToggle(toggleId, newValue) {
  if (!window.localEmbedToggles) {
    window.localEmbedToggles = {};
  }
  window.localEmbedToggles[toggleId] = newValue;

  // Post message to the parent page
  if (window.parent && window.embedToken) {
    window.parent.postMessage({
      command: "saveUserSettings",
      token: window.embedToken,
      data: JSON.stringify({ 
        toggleId, 
        isChecked: newValue 
      })
    }, "*");
  }
}

// Helper function to apply local toggle states
function applyLocalToggleStates() {
  if (!window.localEmbedToggles) return;
  
  // Map Settings toggles
  const mapToggles = ["toggleMap", "toggleDesktopShare", "toggleDesktopRank", "toggleMobileShare", "toggleMobileRank"];
  mapToggles.forEach(toggleId => {
    const checkbox = document.getElementById(toggleId);
    if (checkbox && typeof window.localEmbedToggles[toggleId] === "boolean") {
      checkbox.checked = window.localEmbedToggles[toggleId];
    }
  });
  
  // You can add other toggle states here as needed
}

// =====================================
// 2. TABS FUNCTIONALITY 
// =====================================
(function initTabsSystem() {
  console.log("[INIT] Setting up tabs system");
  
  const tabs = document.querySelectorAll("#tabsContainer .my-tab");

  // Get references to your containers
  const productsContainer  = document.getElementById("productsContainer");
  const companiesContainer = document.getElementById("companiesContainer");
  const explorerContainer  = document.getElementById("explorerContainer");
  const serpContainer      = document.getElementById("serpContainer");
  const pricesContainer    = document.getElementById("pricesContainer");

  function showTab(tabName) {
    // 1) Hide all main content containers
    productsContainer.style.display  = "none";
    companiesContainer.style.display = "none";
    explorerContainer.style.display  = "none";
    serpContainer.style.display      = "none";
    pricesContainer.style.display    = "none";
  
    // 2) Hide layout toggle containers by default
    document.getElementById("layoutToggleContainer").style.display     = "none";
    document.getElementById("layoutCompToggleContainer").style.display = "none";
  
    // 3) Show/Hide top bar elements depending on tab
    if (tabName === "companies") {
      document.getElementById("filterSliders").style.display    = "none";
      document.getElementById("companySelector").style.display  = "none";
    } else if (tabName === "products") {
      document.getElementById("filterSliders").style.display    = "flex";
      document.getElementById("companySelector").style.display  = "block";
    } else if (tabName === "serp") {
      // For SERP Analysis, hide only the filter sliders but show the companySelector
      document.getElementById("filterSliders").style.display   = "none";
      document.getElementById("companySelector").style.display = "block";
    } else {
      // For explorer and prices, hide both elements
      document.getElementById("filterSliders").style.display   = "none";
      document.getElementById("companySelector").style.display = "none";
    }
  
    // 4) Show the chosen tab + the correct layout toggle (if any)
    if (tabName === "products") {
      productsContainer.style.display = "block";
      document.getElementById("layoutToggleContainer").style.display = "block";
    } else if (tabName === "companies") {
      companiesContainer.style.display = "block";
      if (typeof renderCompaniesTab === "function") {
        renderCompaniesTab();  // your existing function to load company data
      }
      document.getElementById("layoutCompToggleContainer").style.display = "block";
    } else if (tabName === "explorer") {
      explorerContainer.style.display = "block";
    } else if (tabName === "serp") {
      serpContainer.style.display = "block";
      if (typeof renderSerpMarketShareBigChart === "function" && window.companyStatsData) {
        renderSerpMarketShareBigChart(window.companyStatsData);
      }
    } else if (tabName === "prices") {
      pricesContainer.style.display = "block";
    }
  
    // 5) Reset/close the Settings panel if it exists
    const settingsDropdown = document.getElementById("settingsDropdown");
    if (settingsDropdown) {
      settingsDropdown.classList.remove("show");
    }
  
    // 6) Update the Settings panel's HTML + attach toggles
    if (tabName === "products") {
      // A) PRODUCTS TAB => set the products settings HTML
      if (settingsDropdown && window.productsSettingsHTML) {
        settingsDropdown.innerHTML = window.productsSettingsHTML;
  
        // Then re-attach any event listeners for the product toggles
        const toggleTrendBox      = document.getElementById("toggleTrendBox");
        const togglePosBadge      = document.getElementById("togglePosBadge");
        const toggleVisBadge      = document.getElementById("toggleVisBadge");
        const toggleCompanyStats  = document.getElementById("toggleCompanyStats");
        
        // Example: if you have a function "updateAdCards()" that re-checks these toggles
        if (toggleTrendBox && typeof updateAdCards === "function") {
          toggleTrendBox.addEventListener("change", updateAdCards);
        }
        if (togglePosBadge && typeof updateAdCards === "function") {
          togglePosBadge.addEventListener("change", updateAdCards);
        }
        if (toggleVisBadge && typeof updateAdCards === "function") {
          toggleVisBadge.addEventListener("change", updateAdCards);
        }
        if (toggleCompanyStats) {
          toggleCompanyStats.addEventListener("change", function() {
            updateToggle("toggleCompanyStats", this.checked);
            const statsEl = document.getElementById("companyStats");
            if (!statsEl) return;
            statsEl.style.display = this.checked ? "flex" : "none";
          });
        }
        applyLocalToggleStates();
      }
    } else if (tabName === "companies") {
      // B) COMPANIES TAB => set the companies settings HTML
      if (settingsDropdown && window.companiesSettingsHTML) {
        settingsDropdown.innerHTML = window.companiesSettingsHTML;
  
        // ----- Company Settings Toggles (affecting .company-details) -----
        const toggleProdTrends   = document.getElementById("toggleProdTrends");
        const toggleProdChart    = document.getElementById("toggleProdChart");
        const toggleRanking      = document.getElementById("toggleRanking");
        const togglePricingTrends= document.getElementById("togglePricingTrends");
        const toggleExtensions   = document.getElementById("toggleExtensions");
        
        if (toggleProdTrends) {
          toggleProdTrends.addEventListener("change", function() {
            updateToggle("toggleProdTrends", this.checked);
            document.querySelectorAll(".company-details .trend-table-row").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
        if (toggleProdChart) {
          toggleProdChart.addEventListener("change", function() {
            updateToggle("toggleProdChart", this.checked);
            document.querySelectorAll(
              ".company-details .product-trend-row canvas[id^='mini-chart-']:not([id^='mini-chart-rank-'])"
            ).forEach(el => {
              el.style.display = this.checked ? "block" : "none";
            });
          });
        }
        if (toggleRanking) {
          toggleRanking.addEventListener("change", function() {
            updateToggle("toggleRanking", this.checked);
            document.querySelectorAll(".company-details .product-trend-row .rank-history").forEach(el => {
              el.style.display = this.checked ? "flex" : "none";
            });
          });
        }          
        if (togglePricingTrends) {
          togglePricingTrends.addEventListener("change", function() {
            updateToggle("togglePricingTrends", this.checked);
            document.querySelectorAll(".company-details .pricing-row").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
        if (toggleExtensions) {
          toggleExtensions.addEventListener("change", function() {
            updateToggle("toggleExtensions", this.checked);
            document.querySelectorAll(".company-details .extensions-content").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
  
        // ----- Segment Settings Toggles (affecting .company-insights .mini-market-chart) -----
        const toggleMarketShare   = document.getElementById("toggleMarketShare");
        const toggleRank          = document.getElementById("toggleRank");
        const toggleAvgProducts   = document.getElementById("toggleAvgProducts");
  
        if (toggleMarketShare) {
          toggleMarketShare.addEventListener("change", function() {
            updateToggle("toggleMarketShare", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Market share");
              }
            });
          });
        }
        if (toggleRank) {
          toggleRank.addEventListener("change", function() {
            updateToggle("toggleRank", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Rank");
              }
            });
          });
        }
        if (toggleAvgProducts) {
          toggleAvgProducts.addEventListener("change", function() {
            updateToggle("toggleAvgProducts", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Avg Products");
              }
            });
          });
        }
        applyLocalToggleStates();
      }
    } else {
      // C) Other tabs (explorer, serp, prices): no toggles or empty out
      if (settingsDropdown) {
        settingsDropdown.innerHTML = "";
      }
    }
  }      
  
  // Attach click handlers on each .my-tab
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("selected"));
      tab.classList.add("selected");
      showTab(tab.dataset.tab);
    });
  });
  
  // By default, show the PRODUCTS tab
  showTab("products");
})();

// Add references to external functions that might not be defined yet
if (typeof updateHomeMapMetrics === 'undefined') {
  window.updateHomeMapMetrics = function() {
    console.log("[Settings] updateHomeMapMetrics called but not yet defined");
  };
}

if (typeof updateHistoryRows === 'undefined') {
  window.updateHistoryRows = function() {
    console.log("[Settings] updateHistoryRows called but not yet defined");
  };
}

if (typeof updateAdCards === 'undefined') {
  window.updateAdCards = function() {
    console.log("[Settings] updateAdCards called but not yet defined");
  };
}

if (typeof renderCompaniesTab === 'undefined') {
  window.renderCompaniesTab = function() {
    console.log("[Settings] renderCompaniesTab called but not yet defined");
  };
}

if (typeof renderSerpMarketShareBigChart === 'undefined') {
  window.renderSerpMarketShareBigChart = function() {
    console.log("[Settings] renderSerpMarketShareBigChart called but not yet defined");
  };
}

if (typeof openSelectCompanyPopup === 'undefined') {
  window.openSelectCompanyPopup = function() {
    console.log("[Settings] openSelectCompanyPopup called but not yet defined");
  };
}

// Export functions for external use
window.updateToggle = updateToggle;
window.applyLocalToggleStates = applyLocalToggleStates;
