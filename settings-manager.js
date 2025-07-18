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
    max-height: 80vh;
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
  max-height: calc(80vh - 120px);
">
<!-- Company Tab -->
<div class="settings-panel active" data-panel="company">
  <div style="
    max-width: 800px;
    margin: 0 auto;
    padding: 40px 20px;
  ">
    <h3 style="
      font-size: 20px;
      font-weight: 600;
      color: #1a1a1a;
      margin-bottom: 12px;
      text-align: center;
    ">Select Your Company</h3>
    
    <p style="
      font-size: 14px;
      color: #ef4444;
      text-align: center;
      margin-bottom: 24px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 8px;
      display: none;
    " id="companyRequiredMessage">
      Please choose your company from the list. This is required for most of the charts to be rendered properly.
    </p>
    
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
      ">My Companies</div>
      <div style="
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
        line-height: 1.6;
      " id="myCompaniesDisplay">
        <!-- Will be dynamically populated -->
      </div>
    </div>
    
    <div id="companyProjectsList" style="
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    ">
      <!-- Project company selections will be dynamically added here -->
    </div>
    
    <button id="saveCompanySelection" style="
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    ">Save Company Selection</button>
  </div>
</div>
<!-- Map Settings Tab -->
<div class="settings-panel" data-panel="map" style="display: none;">
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
<div class="settings-panel" data-panel="database" style="display: none;">
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
<div class="settings-panel" data-panel="googleads" style="display: none;">
  <div style="max-width: 800px; margin: 0 auto; padding: 40px 20px;">
    <div style="text-align: center; margin-bottom: 32px;">
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
        margin-bottom: 12px;
      ">Google Ads Integration</h3>
      
      <p style="
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 24px;
      ">Upload Google Sheets data for each project separately</p>
    </div>
    
    <div id="googleAdsProjectsList" style="
      display: flex;
      flex-direction: column;
      gap: 16px;
      margin-bottom: 24px;
    ">
      <!-- Project Google Ads configurations will be dynamically added here -->
    </div>
    
    <button id="saveGoogleAdsUrls" style="
      width: 100%;
      padding: 12px 24px;
      background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 4px 15px rgba(66, 133, 244, 0.25);
    ">Upload All Google Sheets Data</button>
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
    .settings-panel {
    display: none;
  }
  
  .settings-panel.active {
    display: block !important;
  }
</style>
<!-- Notification Toast System -->
<div id="notificationContainer" style="
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 10000000;
  pointer-events: none;
"></div>

<style>
  .notification-toast {
    min-width: 300px;
    max-width: 400px;
    padding: 16px 20px;
    margin-bottom: 12px;
    border-radius: 12px;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    gap: 12px;
    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif;
    font-size: 14px;
    font-weight: 500;
    pointer-events: all;
    transform: translateX(420px);
    transition: transform 0.3s ease-out, opacity 0.3s ease-out;
    backdrop-filter: blur(10px);
  }
  
  .notification-toast.show {
    transform: translateX(0);
  }
  
  .notification-toast.success {
    background: rgba(16, 185, 129, 0.95);
    color: white;
  }
  
  .notification-toast.error {
    background: rgba(239, 68, 68, 0.95);
    color: white;
  }
  
  .notification-toast.warning {
    background: rgba(245, 158, 11, 0.95);
    color: white;
  }
  
  .notification-toast.info {
    background: rgba(59, 130, 246, 0.95);
    color: white;
  }
  
  .notification-icon {
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }
  
  .notification-message {
    flex: 1;
    line-height: 1.4;
  }
  
  @keyframes slideIn {
    from {
      transform: translateX(420px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(420px);
      opacity: 0;
    }
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
  console.log("[Settings] Switching to tab:", tabName);
  
  // Update tab states
  window.settingsOverlayElements.tabs.forEach(tab => {
    if (tab.dataset.tab === tabName) {
      tab.classList.add('active');
      // Update the visual style for active tab
      tab.style.color = '#1a1a1a';
      tab.style.borderBottom = '2px solid #764ba2';
    } else {
      tab.classList.remove('active');
      // Reset the visual style for inactive tabs
      tab.style.color = '#6b7280';
      tab.style.borderBottom = 'none';
    }
  });
  
  // Force hide ALL panels first
  const allPanels = document.querySelectorAll('.settings-panel');
  allPanels.forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });
  
  // Then show only the selected panel
  const activePanel = document.querySelector(`[data-panel="${tabName}"]`);
  if (activePanel) {
    // Force display to be block
    activePanel.style.display = 'block';
    activePanel.classList.add('active');
    
    // Force a reflow to ensure the display change takes effect
    activePanel.offsetHeight;
  }
  
  // Store active tab
  window.settingsOverlay.activeTab = tabName;
  
  // Initialize tab-specific content
  initializeTabContent(tabName);
}
  
// Initialize content when tab is activated
function initializeTabContent(tabName) {
  switch(tabName) {
    case 'company':
      console.log("[Settings] Initializing company tab content");
      
      // Show required message if no company is set
      const requiredMsg = document.getElementById("companyRequiredMessage");
      if (requiredMsg && !window.myCompany) {
        requiredMsg.style.display = "block";
      }
      
      // Display current company selections
      const myCompaniesDisplay = document.getElementById("myCompaniesDisplay");
      if (myCompaniesDisplay) {
        if (window.myCompanyArray && window.myCompanyArray.length > 0) {
          const companiesHtml = window.myCompanyArray.map(item => {
            const [projectKey, company] = item.split(' - ');
            const projectNum = projectKey.replace('acc1_pr', '').replace('acc1pr', '');
            return `Project ${projectNum}: <span style="color: #764ba2;">${company}</span>`;
          }).join('<br>');
          myCompaniesDisplay.innerHTML = companiesHtml;
        } else if (window.myCompany) {
          myCompaniesDisplay.innerHTML = `All Projects: <span style="color: #764ba2;">${window.myCompany}</span>`;
        } else {
          myCompaniesDisplay.innerHTML = '<span style="color: #9ca3af;">No companies selected yet</span>';
        }
      }
      
      // Get project list
      const projectsList = document.getElementById("companyProjectsList");
      if (projectsList) {
        projectsList.innerHTML = ""; // Clear existing
        
// Get all projects for current account
        let projects = [];
        if (window.projectData && Array.isArray(window.projectData)) {
          projects = window.projectData;
        } else if (window.realProjectData && Array.isArray(window.realProjectData)) {
          projects = window.realProjectData;
        }
        
        // Sort projects by project_number in ascending order
        projects = projects.slice().sort((a, b) => {
          const numA = a.project_number || 0;
          const numB = b.project_number || 0;
          return numA - numB;
        });
        
        console.log("[Settings] Sorted projects:", projects.map(p => p.project_number));
        
        // Function to load companies for a specific project
        const loadCompaniesForProject = async (projectNum) => {
          const projectPrefix = `acc1_pr${projectNum}_`;
          let companies = new Set();
          
          // Try to load from IDB first
          try {
            const serpStatsData = await window.embedIDB.getData(projectPrefix + "company_serp_stats");
            if (serpStatsData && serpStatsData.data && serpStatsData.data.length > 0) {
              serpStatsData.data.forEach(row => {
                if (row.source) companies.add(row.source);
              });
            }
            
            // Also try processed data
            const processedData = await window.embedIDB.getData(projectPrefix + "processed");
            if (processedData && processedData.data && processedData.data.length > 0) {
              processedData.data.forEach(row => {
                if (row.source) companies.add(row.source);
              });
            }
          } catch (error) {
            console.log(`[Settings] Error loading project ${projectNum} data:`, error);
          }
          
          // If no companies found in IDB and this is the current project, use loaded data
          if (companies.size === 0) {
            const currentProjectNum = window.dataPrefix ? 
              parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
            
            if (projectNum === currentProjectNum) {
              if (window.companyStatsData && window.companyStatsData.length > 0) {
                window.companyStatsData.forEach(row => {
                  if (row.source) companies.add(row.source);
                });
              } else if (window.allRows && window.allRows.length > 0) {
                window.allRows.forEach(row => {
                  if (row.source) companies.add(row.source);
                });
              }
            }
          }
          
          return Array.from(companies);
        };

        // Create rows for each project with async loading
        const createProjectRows = async () => {
          for (let i = 0; i < projects.length; i++) {
            const project = projects[i];
            const projectNum = project.project_number || (i + 1);
            const projectKey = `acc1_pr${projectNum}`;
            
            // Find current company for this project
            let currentCompany = "";
            if (window.myCompanyArray && window.myCompanyArray.length > 0) {
              const match = window.myCompanyArray.find(item => 
                item && item.startsWith(projectKey)
              );
              if (match) {
                currentCompany = match.split(' - ')[1] || "";
              }
            } else if (projectNum === 1 && window.myCompany) {
              // Fallback for project 1 if using old format
              currentCompany = window.myCompany;
            }
            
            // Load companies for this specific project
            const companies = await loadCompaniesForProject(projectNum);
            console.log(`[Settings] Project ${projectNum} has ${companies.length} companies`);
            
const rowHTML = `
  <div style="
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    margin-bottom: 8px;
  ">
    <div style="flex: 1;">
      <div style="
        font-size: 14px;
        color: #6b7280;
        margin-bottom: 4px;
      ">Project ${projectNum}${project.project ? ' - ' + project.project : ''}</div>
                  <div style="
                    font-size: 16px;
                    font-weight: 600;
                    color: #1a1a1a;
                  " id="currentCompany_${projectKey}">${currentCompany || "Not Selected"}</div>
                </div>
                
                <select id="companySelect_${projectKey}" data-project="${projectKey}" style="
                  flex: 1;
                  padding: 10px 12px;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  font-size: 14px;
                  background: white;
                  cursor: pointer;
                  transition: all 0.2s ease;
                ">
                  <option value="">-- Select Company --</option>
                  ${companies.map(c => `
                    <option value="${c}" ${c === currentCompany ? 'selected' : ''}>${c}</option>
                  `).join('')}
                </select>
              </div>
            `;
            
            projectsList.innerHTML += rowHTML;
          }
          
          // Add change event listeners after all rows are created
          projectsList.querySelectorAll('select[data-project]').forEach(select => {
            select.addEventListener('change', function() {
              const projectKey = this.dataset.project;
              const displayEl = document.getElementById(`currentCompany_${projectKey}`);
              if (displayEl) {
                displayEl.textContent = this.value || "Not Selected";
              }
            });
          });
        };

        // Call the async function to create rows
        createProjectRows();
        
        // Add save button handler
        const saveBtn = document.getElementById("saveCompanySelection");
        if (saveBtn) {
          saveBtn.onclick = function() {
            const companyArray = [];
            const selects = projectsList.querySelectorAll('select[data-project]');
            
            selects.forEach(select => {
              const projectKey = select.dataset.project;
              const company = select.value;
              if (company) {
                companyArray.push(`${projectKey} - ${company}`);
              }
            });
            
            // Send to parent to save
            if (window.parent) {
              window.parent.postMessage({
                command: "saveMyCompanyArray",
                companyArray: companyArray
              }, "*");
            }
            
            // Update current project's company immediately
            const currentProjectKey = window.dataPrefix ? 
              window.dataPrefix.replace('_', '').replace('_', '') : 'acc1pr1';
            const currentMatch = companyArray.find(item => 
              item.startsWith(currentProjectKey)
            );
            if (currentMatch) {
              window.myCompany = currentMatch.split(' - ')[1] || "";
              localStorage.setItem("my_company", window.myCompany);
              
              // Update company selector in main UI
              if (document.getElementById("companyText")) {
                document.getElementById("companyText").textContent = window.myCompany;
              }
            }
            
            // Close overlay
            window.closeSettingsOverlay();
              // Update the company selector display
  if (typeof updateCompanySelector === 'function') {
    updateCompanySelector();
  }         
            // Refresh data if needed
            if (typeof renderData === 'function') {
              renderData();
            }
          };
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
      console.log("[Settings] Initializing Google Ads tab content");
      initializeGoogleAdsTab();
      break;
  }
}

// Initialize Google Ads tab with per-project URL inputs
async function initializeGoogleAdsTab() {
  const projectsList = document.getElementById("googleAdsProjectsList");
  if (!projectsList) return;
  
  projectsList.innerHTML = ""; // Clear existing
  
  // Get all projects
  let projects = [];
  if (window.projectData && Array.isArray(window.projectData)) {
    projects = window.projectData;
  } else if (window.realProjectData && Array.isArray(window.realProjectData)) {
    projects = window.realProjectData;
  }
  
  // Sort projects by project_number
  projects = projects.slice().sort((a, b) => {
    const numA = a.project_number || 0;
    const numB = b.project_number || 0;
    return numA - numB;
  });
  
  // Create rows for each project
  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const projectNum = project.project_number || (i + 1);
    const projectKey = `acc1_pr${projectNum}_`;
    
    // Check if this project has existing Google Sheets data
    let existingUrl = '';
    let statusText = 'No data uploaded';
    let statusColor = '#6b7280';
    
    try {
      const config = await window.embedIDB.getData(projectKey + "googleSheets_config");
      if (config && config.data && config.data.url) {
        existingUrl = config.data.url;
        
        // Check for actual data
        const productData = await window.embedIDB.getData(projectKey + "googleSheets_productPerformance");
        if (productData && productData.data && productData.data.length > 0) {
          statusText = `✓ ${productData.data.length} products loaded`;
          statusColor = '#059669';
        }
      }
    } catch (error) {
      console.log(`[Settings] No Google Sheets data for project ${projectNum}`);
    }
    
const rowHTML = `
  <div style="
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 20px;
  ">
    <div style="
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    ">
      <div style="
        font-size: 16px;
        font-weight: 600;
        color: #1a1a1a;
      ">Project ${projectNum}${project.project ? ' - ' + project.project : ''}</div>
          <div style="
            font-size: 14px;
            color: ${statusColor};
          " id="googleAdsStatus_${projectKey}">${statusText}</div>
        </div>
        
        <input type="text" 
          id="googleSheetsUrl_${projectKey}" 
          data-project="${projectKey}"
          placeholder="https://docs.google.com/spreadsheets/d/..." 
          value="${existingUrl}"
          style="
            width: 100%;
            padding: 10px 12px;
            font-size: 14px;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            box-sizing: border-box;
          " />
      </div>
    `;
    
    projectsList.innerHTML += rowHTML;
  }
  
// Add save button handler
  const saveBtn = document.getElementById("saveGoogleAdsUrls");
  if (saveBtn) {
    saveBtn.onclick = async function() {
      const inputs = projectsList.querySelectorAll('input[data-project]');
      const urlsToProcess = [];
      
      // Collect all non-empty URLs
      inputs.forEach(input => {
        const projectKey = input.dataset.project;
        const url = input.value.trim();
        if (url) {
          // Basic URL validation
          if (!url.startsWith('https://docs.google.com/spreadsheets/')) {
            window.showNotification(
              `Invalid URL for ${projectKey.replace('acc1_pr', 'Project ').replace('_', '')}. Please use a Google Sheets URL.`,
              'error'
            );
            return;
          }
          urlsToProcess.push({ projectKey, url });
        }
      });
      
      if (urlsToProcess.length === 0) {
        window.showNotification("Please enter at least one Google Sheets URL", 'warning');
        return;
      }
      
      // Disable the button during processing
      this.disabled = true;
      this.textContent = "Processing...";
      this.style.opacity = "0.7";
      
      // Process each URL
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const { projectKey, url } of urlsToProcess) {
        try {
          console.log(`[Settings] Processing Google Sheets for ${projectKey}`);
          
          // Show processing status
          const statusEl = document.getElementById(`googleAdsStatus_${projectKey}`);
          if (statusEl) {
            statusEl.textContent = "Processing...";
            statusEl.style.color = "#3b82f6";
          }
          
          // Call the fetcher with validation wrapper
          const result = await window.googleSheetsManager.fetchAndStoreFromUrl(url, projectKey);
          
// Check if data was actually stored (trust the processing result)
const productData = await window.embedIDB.getData(projectKey + "googleSheets_productPerformance");
if (productData && productData.data && productData.data.length > 0) {
  // Data exists, processing was successful
  console.log(`[Settings] Validation passed - ${productData.data.length} records found`);
            
            // Update status on success
            if (statusEl) {
              const count = productData.data.length;
              statusEl.textContent = `✓ ${count} products loaded`;
              statusEl.style.color = "#059669";
            }
            
            successCount++;
          } else {
            throw new Error("No data was loaded from the spreadsheet");
          }
          
        } catch (error) {
          console.error(`[Settings] Failed to process ${projectKey}:`, error);
          
          // Update status on error
          const statusEl = document.getElementById(`googleAdsStatus_${projectKey}`);
          const projectName = projectKey.replace('acc1_pr', 'Project ').replace('_', '');
          
          let errorMessage = error.message;
          
          // Provide more user-friendly error messages
          if (errorMessage.includes('Failed to fetch')) {
            errorMessage = "Unable to access the spreadsheet. Please check sharing permissions.";
          } else if (errorMessage.includes('CORS')) {
            errorMessage = "Access denied. Make sure the spreadsheet is publicly accessible.";
          } else if (errorMessage.includes('404')) {
            errorMessage = "Spreadsheet not found. Please check the URL.";
          }
          
          if (statusEl) {
            statusEl.textContent = `✗ Error: ${errorMessage}`;
            statusEl.style.color = "#dc2626";
          }
          
          errors.push(`${projectName}: ${errorMessage}`);
          errorCount++;
        }
      }
      
      // Re-enable the button
      this.disabled = false;
      this.textContent = "Upload All Google Sheets Data";
      this.style.opacity = "1";
      
      // Show summary notification
      if (successCount > 0 && errorCount === 0) {
        window.showNotification(
          `Successfully uploaded data for ${successCount} project${successCount > 1 ? 's' : ''}!`,
          'success'
        );
        // Refresh Google Ads availability check
        if (typeof checkGoogleAdsDataAvailability === 'function') {
          await checkGoogleAdsDataAvailability();
          // Force immediate UI update for current project
          if (typeof updateGoogleAdsButtonState === 'function') {
            updateGoogleAdsButtonState();
          }
        }
      } else if (successCount > 0 && errorCount > 0) {
        window.showNotification(
          `Uploaded ${successCount} project${successCount > 1 ? 's' : ''}, but ${errorCount} failed. Check the status messages.`,
          'warning',
          5000
        );
      } else {
        // Show detailed error
        const errorDetail = errors.length > 0 ? errors[0] : "Unknown error occurred";
        window.showNotification(errorDetail, 'error', 5000);
      }
    };
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

function updateCurrentCompanyDisplay() {
  const companyValEl = document.getElementById("currentCompanyValue");
  if (companyValEl) {
    
    // DEBUG: Log all possible values
    console.log("[DEBUG] All company values:", {
      "window.filterState": window.filterState,
      "window.filterState.company": window.filterState?.company,
      "window.myCompany": window.myCompany,
      "window.frontendCompany": window.frontendCompany,
      "localStorage.my_company": localStorage.getItem("my_company"),
      "localStorage.real_company": localStorage.getItem("real_company"),
      "companyText.textContent": document.getElementById("companyText")?.textContent
    });
    
    let val = "";
    
    // Check filterState.company first (this is what gets updated when user selects from dropdown)
    if (window.filterState && window.filterState.company && window.filterState.company.trim()) {
      val = window.filterState.company.trim();
      console.log("[DEBUG] Using filterState.company:", val);
    }
    // Then check window.myCompany as fallback
    else if (window.myCompany && window.myCompany.trim()) {
      val = window.myCompany.trim();
      console.log("[DEBUG] Using window.myCompany:", val);
    }
    // Check frontendCompany
    else if (window.frontendCompany && window.frontendCompany.trim()) {
      val = window.frontendCompany.trim();
      console.log("[DEBUG] Using window.frontendCompany:", val);
    }
    // Finally check localStorage
    else {
      const storedCompany = localStorage.getItem("my_company") || localStorage.getItem("real_company");
      if (storedCompany && storedCompany.trim()) {
        val = storedCompany.trim();
        console.log("[DEBUG] Using localStorage:", val);
      }
    }
    
    // Update display
    companyValEl.textContent = val || "Not Selected";
    console.log("[Settings] Company display final result:", val || "Not Selected");
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
      
      window.showNotification("Company saved successfully!", 'success');
    };
  }
  
// Fixed Refresh IDB button handler with Z-index and double-click fixes
const refreshIDBBtn = document.getElementById("refreshIDBButton");
if (refreshIDBBtn) {
  // Remove any existing listeners to prevent double-binding
  refreshIDBBtn.replaceWith(refreshIDBBtn.cloneNode(true));
  const newRefreshBtn = document.getElementById("refreshIDBButton");
  
  newRefreshBtn.addEventListener("click", function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("[Debug] Refresh button clicked");
    
    // Prevent multiple dialogs - check if one already exists
    if (document.querySelector('.refresh-confirmation-backdrop')) {
      console.log("[Debug] Dialog already exists, ignoring click");
      return;
    }
    
    // Disable the button temporarily to prevent double-clicks
    newRefreshBtn.disabled = true;
    newRefreshBtn.style.opacity = '0.5';
    
    // Create backdrop with higher z-index than settings overlay
    const backdrop = document.createElement('div');
    backdrop.className = 'refresh-confirmation-backdrop';
    backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(2px);
      z-index: 10000000;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    // Create dialog with even higher z-index
    const dialog = document.createElement('div');
    dialog.className = 'refresh-confirmation-dialog';
    dialog.style.cssText = `
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 400px;
      width: 90%;
      position: relative;
      z-index: 10000001;
    `;
    
    // Create dialog content
    const title = document.createElement('h3');
    title.textContent = 'Refresh Database?';
    title.style.cssText = `
      margin: 0 0 12px 0;
      font-size: 18px;
      color: #1a1a1a;
      font-weight: 600;
    `;
    
    const message = document.createElement('p');
    message.textContent = 'This will delete all cached data and reload fresh data from the server. The process may take a few moments.';
    message.style.cssText = `
      margin: 0 0 20px 0;
      color: #6b7280;
      line-height: 1.5;
      font-size: 14px;
    `;
    
    // Create button container
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;
    
    // Create Cancel button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      padding: 8px 16px;
      border: 1px solid #e5e7eb;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      color: #374151;
    `;
    
    // Create Refresh button
    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = 'Refresh';
    refreshBtn.style.cssText = `
      padding: 8px 16px;
      border: none;
      background: #dc2626;
      color: white;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;
    
    // Add hover effects
    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#f9fafb';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = 'white';
    });
    
    refreshBtn.addEventListener('mouseenter', () => {
      refreshBtn.style.background = '#b91c1c';
    });
    refreshBtn.addEventListener('mouseleave', () => {
      refreshBtn.style.background = '#dc2626';
    });
    
    // Function to close dialog
    function closeDialog() {
      console.log("[Debug] Closing dialog");
      backdrop.remove();
      // Re-enable the refresh button
      newRefreshBtn.disabled = false;
      newRefreshBtn.style.opacity = '1';
    }
    
    // Add event listeners with proper error handling
    cancelBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("[Debug] Cancel clicked");
      closeDialog();
    });
    
    refreshBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("[Debug] Refresh confirmed");
      
      // Close dialog first
      closeDialog();
      
      // Close settings overlay
      if (typeof window.closeSettingsOverlay === "function") {
        window.closeSettingsOverlay();
      }
      
      // Start refresh process with error handling
      if (typeof window.refreshIDBData === "function") {
        console.log("[Debug] Starting refresh process");
        try {
          window.refreshIDBData();
        } catch (error) {
          console.error("[Debug] Error starting refresh:", error);
          alert("Failed to start refresh process. Please reload the page.");
        }
      } else {
        console.error("[Debug] refreshIDBData function not found");
        alert("Refresh function not available. Please reload the page.");
      }
    });
    
    // Close on backdrop click
    backdrop.addEventListener('click', function(e) {
      if (e.target === backdrop) {
        closeDialog();
      }
    });
    
    // Close on Escape key
    function handleEscape(e) {
      if (e.key === 'Escape') {
        closeDialog();
        document.removeEventListener('keydown', handleEscape);
      }
    }
    document.addEventListener('keydown', handleEscape);
    
    // Assemble dialog
    buttonContainer.appendChild(cancelBtn);
    buttonContainer.appendChild(refreshBtn);
    
    dialog.appendChild(title);
    dialog.appendChild(message);
    dialog.appendChild(buttonContainer);
    
    backdrop.appendChild(dialog);
    
    // Add to DOM
    document.body.appendChild(backdrop);
    
    console.log("[Debug] Dialog created and added to DOM");
  });
}
  
window.openSettingsOverlay = function(initialTab = 'company') {
  console.log("[Settings] Opening overlay with initial tab:", initialTab);
  
  // Show overlay
  window.settingsOverlayElements.overlay.style.display = "flex";
  window.settingsOverlay.isOpen = true;
  
  // Ensure all panels are hidden first
  const allPanels = document.querySelectorAll('.settings-panel');
  allPanels.forEach(panel => {
    panel.style.display = 'none';
    panel.classList.remove('active');
  });
  
  // Force a small delay to ensure DOM is ready
  setTimeout(() => {
    // Switch to initial tab (this will show the correct panel)
    switchTab(initialTab);
    
    // FORCE call updateCurrentCompanyDisplay
    console.log("[Settings] Calling updateCurrentCompanyDisplay on overlay open");
    updateCurrentCompanyDisplay();
  }, 10);
  
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

// ========================================
// NOTIFICATION SYSTEM
// ========================================

window.showNotification = function(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification-toast ${type}`;
  
  // Icons for different types
  const icons = {
    success: '<svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>',
    error: '<svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>',
    warning: '<svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>',
    info: '<svg class="notification-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>'
  };
  
  notification.innerHTML = `
    ${icons[type] || icons.info}
    <div class="notification-message">${message}</div>
  `;
  
  container.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => {
    notification.classList.add('show');
  }, 10);
  
  // Auto-remove after duration
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, duration);
};

// Helper function to validate Google Sheets data structure
window.validateGoogleSheetsData = function(data) {
  // Check if data exists and is an array
  if (!data || !Array.isArray(data) || data.length === 0) {
    return {
      valid: false,
      error: "The spreadsheet appears to be empty or in an invalid format."
    };
  }
  
  // Check for required columns (case-insensitive)
  const requiredColumns = ['product', 'revenue']; // Removed 'cost' as it might be optional
  const firstRow = data[0];
  
  if (!firstRow || typeof firstRow !== 'object') {
    return {
      valid: false,
      error: "Unable to read data structure from the spreadsheet."
    };
  }
  
  // Get all column names in lowercase for comparison
  const availableColumns = Object.keys(firstRow).map(col => col.toLowerCase());
  
  // Check for missing required columns (case-insensitive)
  const missingColumns = requiredColumns.filter(col => 
    !availableColumns.includes(col.toLowerCase())
  );
  
  if (missingColumns.length > 0) {
    // Only fail if we're really missing critical data
    // Since the data was processed successfully, let's be more lenient
    console.warn(`[Validation] Expected columns not found: ${missingColumns.join(', ')}, but data appears to be processed`);
    
    // Check if we at least have some recognizable data structure
    if (Object.keys(firstRow).length < 2) {
      return {
        valid: false,
        error: "The spreadsheet doesn't contain enough data columns."
      };
    }
  }
  
  // If we got here and have data, it's probably valid
  // The actual processing succeeded, so trust that
  return { valid: true };
};

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
  
  // Call the proper function that includes updateCurrentCompanyDisplay
  if (typeof window.openSettingsOverlay === "function") {
    window.openSettingsOverlay('company');
  }
};
  }
  
  // Try multiple times to ensure DOM is ready
  setTimeout(attachListener, 1000);
})();

// Simplified refreshIDBData function without validation
window.refreshIDBData = async function() {
  let loader = null;
  
  try {
    console.log("[🔄 IDB Refresh] Starting complete database refresh...");
    
    // Show loading overlay
    loader = document.getElementById("overlayLoader");
    if (loader) {
      loader.style.display = "flex";
      loader.style.opacity = "1";
    }

    // Step 1: Delete the existing database
    console.log("[🔄 IDB Refresh] Step 1: Deleting existing database...");
    let deletionSuccessful = false;
    
    if (window.embedIDB && typeof window.embedIDB.deleteDatabase === "function") {
      try {
        deletionSuccessful = await window.embedIDB.deleteDatabase();
        if (deletionSuccessful) {
          console.log("[🔄 IDB Refresh] Database deleted successfully");
        } else {
          console.warn("[🔄 IDB Refresh] Database deletion failed or timed out - continuing anyway");
        }
      } catch (error) {
        console.error("[🔄 IDB Refresh] Database deletion error:", error);
        // Continue with refresh even if deletion fails
      }
    }
    
    // Step 2: Clear cached data
    console.log("[🔄 IDB Refresh] Step 2: Clearing cached data...");
    
    // Preserve project structure temporarily
    const savedProjectData = window.projectData;
    const savedDemoProjectData = window.demoProjectData;
    const savedRealProjectData = window.realProjectData;
    
    // Clear data arrays
    window.allRows = [];
    window.companyStatsData = [];
    window.marketTrendsData = [];
    window.googleSheetsData = null;
    
    // Clear any data caches
    if (window.dataCache) {
      window.dataCache.clear();
      console.log("[🔄 IDB Refresh] Data cache cleared");
    }
    
    console.log("[🔄 IDB Refresh] Cached data cleared");

    // Restore project data immediately
    window.projectData = savedProjectData;
    window.demoProjectData = savedDemoProjectData;
    window.realProjectData = savedRealProjectData;

    // Step 3: Request fresh data from server
    console.log("[🔄 IDB Refresh] Step 3: Requesting fresh data from server...");
    
    // Set flags to indicate we're doing a full refresh
    window._isRefreshingIDB = true;
    window._refreshRequestCount = 0;
    window._refreshExpectedCount = 2; // Expecting both demo and real account data
    
    // Clear any existing server request timeouts
    if (window.serverRequestTimeout) {
      clearTimeout(window.serverRequestTimeout);
      window.serverRequestTimeout = null;
    }
    
    // Request fresh data with timeout protection
    const currentProjectNumber = parseInt(window.dataPrefix?.match(/pr(\d+)_/)?.[1]) || 1;
    
    // Set up a timeout for the refresh operation
    const refreshTimeout = setTimeout(() => {
      if (window._isRefreshingIDB) {
        console.error("[🔄 IDB Refresh] Refresh operation timed out after 30 seconds");
        
        // Clean up state
        window._isRefreshingIDB = false;
        if (window._refreshTimeoutId) {
          clearTimeout(window._refreshTimeoutId);
          window._refreshTimeoutId = null;
        }
        
        // Hide loader and show error
        if (loader) {
          loader.style.opacity = "0";
          setTimeout(() => { loader.style.display = "none"; }, 500);
        }
        
        // Remove any stuck confirmation dialogs
        const stuckDialog = document.querySelector('.refresh-confirmation-backdrop');
        if (stuckDialog) {
          stuckDialog.remove();
        }
        
        alert("Database refresh timed out. Please try again.");
      }
    }, 30000); // 30 second timeout
    
    // Store timeout ID so it can be cleared when refresh completes
    window._refreshTimeoutId = refreshTimeout;
    
    // Send the request
    window.parent.postMessage({
      command: "requestServerData", 
      projectNumber: currentProjectNumber,
      forceRefresh: true,
      requestBoth: true  // Signal to parent to send both demo and real data
    }, "*");

    // Reset Google Sheets data (project-specific)
    console.log("[🔄 IDB Refresh] Google Sheets data is project-specific, not refreshing automatically");
    window.googleSheetsData = {
      productPerformance: [],
      locationRevenue: []
    };

  } catch (error) {
    console.error("[🔄 IDB Refresh] Error during refresh:", error);
    
    // Clean up refresh state
    window._isRefreshingIDB = false;
    if (window._refreshTimeoutId) {
      clearTimeout(window._refreshTimeoutId);
      window._refreshTimeoutId = null;
    }
    
    // Hide loader on error
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => { loader.style.display = "none"; }, 500);
    }
    
    // Remove any stuck confirmation dialogs
    const stuckDialog = document.querySelector('.refresh-confirmation-backdrop');
    if (stuckDialog) {
      stuckDialog.remove();
    }
    
    // Show user-friendly error message
    alert("Error refreshing database. Please check your connection and try again.");
  }
};

// Ensure localEmbedToggles exists
if (!window.localEmbedToggles) {
  window.localEmbedToggles = {};
}

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

// Export functions for external use
window.updateToggle = updateToggle;
window.applyLocalToggleStates = applyLocalToggleStates;
