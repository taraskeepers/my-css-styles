// google_ads_campaigns.js - Campaigns Section Implementation

// Global variables for campaigns section
window.selectedCampaign = null;
window.campaignsData = [];
window.campaignProducts = new Map();

// Initialize campaigns section
async function initializeCampaignsSection() {
  console.log('[initializeCampaignsSection] Starting campaigns initialization...');
  
  // Add campaigns-specific styles
  addCampaignsStyles();
  
  // Load and render campaigns
  await loadAndRenderCampaigns();
}

// Add campaigns-specific styles
function addCampaignsStyles() {
  if (!document.getElementById('campaigns-section-styles')) {
    const style = document.createElement('style');
    style.id = 'campaigns-section-styles';
    style.textContent = `
      /* Main campaigns container */
      .campaigns-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        margin-top: 60px;
      }
      
      /* Left navigation panel */
      #campaignsNavPanel {
        width: 320px;
        min-width: 320px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease-in-out;
      }
      
      /* Campaign filter and list styles */
      .campaigns-filter-container {
        padding: 15px;
        border-bottom: 1px solid #dee2e6;
        background: linear-gradient(to bottom, #ffffff, #f9f9f9);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .campaigns-type-filter {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      
      .campaign-filter-btn {
        padding: 6px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .campaign-filter-btn.active {
        background-color: #007aff;
        color: white;
        border-color: #007aff;
        box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
      }
      
      .campaigns-list-container {
        padding: 10px;
        overflow-y: auto;
        flex: 1;
      }
      
      .campaign-group-section {
        margin-bottom: 20px;
      }
      
      .campaign-group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      
      .campaign-type-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .campaign-group-title {
        font-size: 13px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
      }
      
      .campaign-group-count {
        background: #007aff;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .campaign-nav-item {
        margin-bottom: 8px;
        cursor: pointer;
      }
      
      .campaign-card-details {
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        padding: 12px;
        transition: all 0.2s;
        gap: 12px;
        min-height: 70px;
      }
      
      .campaign-nav-item:hover .campaign-card-details {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
      }
      
      .campaign-nav-item.selected .campaign-card-details {
        border: 2px solid #007aff;
        box-shadow: 0 2px 6px rgba(0,122,255,0.3);
      }
      
      .campaign-type-badge {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .campaign-type-badge.pmax {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .campaign-type-badge.shopping {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }
      
      .campaign-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .campaign-name {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        line-height: 1.3;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .campaign-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: #999;
      }
      
      .campaign-products-count {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      /* Right panel - Products container */
      #campaignsProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Products panel header */
      .campaigns-products-header {
        padding: 15px 20px;
        border-bottom: 1px solid #dee2e6;
        background: linear-gradient(to bottom, #ffffff, #f9f9f9);
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .campaigns-products-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }
      
      .selected-campaign-info {
        font-size: 13px;
        color: #666;
        margin-top: 4px;
      }
      
      .column-selector-btn {
        padding: 6px 12px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
      }
      
      .column-selector-btn:hover {
        background: #f0f0f0;
        border-color: #007aff;
      }
      
      /* NEW MODERN TABLE DESIGN */
      .camp-products-wrapper {
        flex: 1;
        padding: 20px;
        overflow: auto;
        background: #f8f9fa;
      }
      
      .camp-table-modern {
        width: 100%;
        background: white;
        border-radius: 12px;
        overflow: hidden;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      }
      
      .camp-table-header {
        display: grid;
        grid-template-columns: 40px 60px 80px minmax(280px, 1fr) repeat(7, minmax(90px, 120px));
        background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
        border-bottom: 2px solid #e9ecef;
        padding: 0;
        position: sticky;
        top: 0;
        z-index: 100;
      }
      
      .camp-th-cell {
        padding: 14px 12px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6c757d;
        display: flex;
        align-items: center;
        justify-content: flex-start;
        border-right: 1px solid #e9ecef;
        background: inherit;
      }
      
      .camp-th-cell:last-child {
        border-right: none;
      }
      
      .camp-th-cell.sortable {
        cursor: pointer;
        user-select: none;
        position: relative;
        padding-right: 24px;
      }
      
      .camp-th-cell.sortable:hover {
        background: rgba(0, 122, 255, 0.04);
        color: #495057;
      }
      
      .camp-sort-icon {
        position: absolute;
        right: 8px;
        font-size: 10px;
        color: #adb5bd;
      }
      
      .camp-th-cell.sorted-asc .camp-sort-icon,
      .camp-th-cell.sorted-desc .camp-sort-icon {
        color: #007aff;
      }
      
      .camp-th-cell.center {
        justify-content: center;
      }
      
      .camp-th-cell.right {
        justify-content: flex-end;
      }
      
      /* Table body */
      .camp-table-body {
        background: white;
      }
      
      .camp-row-main {
        display: grid;
        grid-template-columns: 40px 60px 80px minmax(280px, 1fr) repeat(7, minmax(90px, 120px));
        border-bottom: 1px solid #f0f2f5;
        transition: all 0.2s ease;
        background: white;
        position: relative;
      }
      
      .camp-row-main:hover {
        background: linear-gradient(90deg, rgba(0, 122, 255, 0.02) 0%, rgba(0, 122, 255, 0.04) 100%);
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .camp-row-main.has-children {
        cursor: pointer;
      }
      
      .camp-td-cell {
        padding: 12px;
        font-size: 13px;
        color: #495057;
        display: flex;
        align-items: center;
        border-right: 1px solid #f0f2f5;
        min-height: 64px;
      }
      
      .camp-td-cell:last-child {
        border-right: none;
      }
      
      /* Expand arrow */
      .camp-expand-arrow {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        background: #e9ecef;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 12px;
        color: #6c757d;
        margin: 0 auto;
      }
      
      .camp-expand-arrow:hover {
        background: #dee2e6;
        transform: scale(1.1);
      }
      
      .camp-expand-arrow.expanded {
        transform: rotate(90deg);
        background: #007aff;
        color: white;
      }
      
      /* Position indicator */
      .camp-position-indicator {
        width: 44px;
        height: 44px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        margin: 0 auto;
        position: relative;
        overflow: hidden;
      }
      
      .camp-position-indicator.top {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);
      }
      
      .camp-position-indicator.mid {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
      }
      
      .camp-position-indicator.low {
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(249, 115, 22, 0.3);
      }
      
      .camp-position-indicator.bottom {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
        box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
      }
      
      /* Market share */
      .camp-share-bar {
        width: 56px;
        height: 40px;
        background: #f0f2f5;
        border-radius: 8px;
        position: relative;
        overflow: hidden;
        margin: 0 auto;
      }
      
      .camp-share-fill {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(180deg, #60a5fa 0%, #3b82f6 100%);
        transition: height 0.3s ease;
      }
      
      .camp-share-text {
        position: relative;
        z-index: 2;
        font-size: 11px;
        font-weight: 600;
        color: #1e40af;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Product info */
      .camp-product-info {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
      }
      
      .camp-product-img {
        width: 44px;
        height: 44px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid #e9ecef;
        flex-shrink: 0;
        background: white;
      }
      
      .camp-product-name {
        flex: 1;
        font-size: 13px;
        font-weight: 500;
        color: #212529;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      /* Metrics */
      .camp-metric {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-size: 13px;
        font-weight: 500;
        color: #495057;
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: flex-end;
      }
      
      .camp-metric.large {
        font-size: 14px;
        font-weight: 600;
        color: #212529;
      }
      
      .camp-metric.positive {
        color: #22c55e;
      }
      
      .camp-metric.negative {
        color: #ef4444;
      }
      
      .camp-metric.highlight {
        padding: 4px 8px;
        background: rgba(0, 122, 255, 0.08);
        border-radius: 6px;
        color: #007aff;
        font-weight: 600;
      }
      
      /* Device rows */
      .camp-row-device {
        display: none;
        grid-template-columns: 40px 60px 80px minmax(280px, 1fr) repeat(7, minmax(90px, 120px));
        background: #fafbfc;
        border-bottom: 1px solid #f0f2f5;
        opacity: 0;
        animation: slideDown 0.2s ease forwards;
      }
      
      .camp-row-device.visible {
        display: grid;
        opacity: 1;
      }
      
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .camp-device-tag {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 56px;
      }
      
      .camp-device-tag.mobile {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
        color: #14532d;
      }
      
      .camp-device-tag.tablet {
        background: linear-gradient(135deg, #93c5fd 0%, #60a5fa 100%);
        color: #1e3a8a;
      }
      
      .camp-device-tag.desktop {
        background: linear-gradient(135deg, #fde68a 0%, #fbbf24 100%);
        color: #713f12;
      }
      
      /* Empty state */
      .campaigns-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #999;
        text-align: center;
        padding: 40px;
      }
      
      .campaigns-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .campaigns-empty-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #666;
      }
      
      .campaigns-empty-text {
        font-size: 14px;
        line-height: 1.5;
        color: #999;
      }
      
      /* Loading spinner */
      .campaigns-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        height: 400px;
      }
      
      .campaigns-spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #007aff;
        animation: spin 1s ease infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// Load and render campaigns
async function loadAndRenderCampaigns() {
  console.log('[loadAndRenderCampaigns] Loading campaigns data...');
  
  try {
    // Get the table prefix for the current project
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    console.log('[loadAndRenderCampaigns] Loading from table:', tableName);
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadAndRenderCampaigns] No bucket data found');
      renderEmptyCampaignsState();
      return;
    }
    
    // Extract unique campaigns from the data
    const campaignsMap = new Map();
    
    result.data.forEach(row => {
      const channelType = row['Channel Type'];
      const campaignName = row['Campaign Name'];
      const productTitle = row['Product Title'];
      
      // Skip rows without proper campaign data
      if (!channelType || !campaignName || channelType === 'All' || campaignName === 'All') {
        return;
      }
      
      const campaignKey = `${channelType}::${campaignName}`;
      
      if (!campaignsMap.has(campaignKey)) {
        campaignsMap.set(campaignKey, {
          channelType: channelType,
          campaignName: campaignName,
          products: new Set()
        });
      }
      
      // Add product to campaign
      if (productTitle) {
        campaignsMap.get(campaignKey).products.add(productTitle);
      }
    });
    
    // Convert map to array and sort
    window.campaignsData = Array.from(campaignsMap.values()).sort((a, b) => {
      // First sort by channel type
      if (a.channelType !== b.channelType) {
        return a.channelType.localeCompare(b.channelType);
      }
      // Then by campaign name
      return a.campaignName.localeCompare(b.campaignName);
    });
    
    console.log('[loadAndRenderCampaigns] Found campaigns:', window.campaignsData.length);
    
    // Store products mapping for quick access
    window.campaignProducts.clear();
    window.campaignsData.forEach(campaign => {
      const key = `${campaign.channelType}::${campaign.campaignName}`;
      window.campaignProducts.set(key, Array.from(campaign.products));
    });
    
    // Render campaigns in the navigation panel
    renderCampaignsNavPanel();
    
  } catch (error) {
    console.error('[loadAndRenderCampaigns] Error loading campaigns:', error);
    renderEmptyCampaignsState();
  }
}

// Render campaigns navigation panel
function renderCampaignsNavPanel() {
  const container = document.getElementById('campaigns_overview_container');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'campaigns-main-container';
  
  // Create left navigation panel
  const navPanel = document.createElement('div');
  navPanel.id = 'campaignsNavPanel';
  
  // Add filter container
  const filterContainer = document.createElement('div');
  filterContainer.className = 'campaigns-filter-container';
  filterContainer.innerHTML = `
    <div class="campaigns-type-filter">
      <button class="campaign-filter-btn active" data-filter="all">
        <span>📊</span> All
      </button>
      <button class="campaign-filter-btn" data-filter="PERFORMANCE_MAX">
        <span>🚀</span> PMax
      </button>
      <button class="campaign-filter-btn" data-filter="SHOPPING">
        <span>🛍️</span> Shopping
      </button>
    </div>
  `;
  navPanel.appendChild(filterContainer);
  
  // Add campaigns list container
  const listContainer = document.createElement('div');
  listContainer.className = 'campaigns-list-container';
  navPanel.appendChild(listContainer);
  
  // Group campaigns by type
  const pmaxCampaigns = window.campaignsData.filter(c => c.channelType === 'PERFORMANCE_MAX');
  const shoppingCampaigns = window.campaignsData.filter(c => c.channelType === 'SHOPPING');
  
  // Render campaign groups
  renderCampaignGroup(listContainer, 'PERFORMANCE_MAX', pmaxCampaigns, '🚀');
  renderCampaignGroup(listContainer, 'SHOPPING', shoppingCampaigns, '🛍️');
  
  // Add click handlers for filters
  filterContainer.querySelectorAll('.campaign-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active state
      filterContainer.querySelectorAll('.campaign-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filter campaigns
      const filterType = this.getAttribute('data-filter');
      filterCampaigns(filterType);
    });
  });
  
  // Create right products panel
const productsPanel = document.createElement('div');
productsPanel.id = 'campaignsProductsPanel';
productsPanel.innerHTML = `
  <div class="campaigns-products-header">
    <div>
      <h3 class="campaigns-products-title">Campaign Products</h3>
      <div class="selected-campaign-info">Select a campaign to view its products</div>
    </div>
    <button class="column-selector-btn" onclick="toggleColumnSelector()">
      <span>⚙️</span> Columns
    </button>
  </div>
  <div class="campaigns-products-table-container">
    <div class="campaigns-empty-state">
      <div class="campaigns-empty-icon">📦</div>
      <div class="campaigns-empty-title">No Campaign Selected</div>
      <div class="campaigns-empty-text">Select a campaign from the left panel to view its products</div>
    </div>
  </div>
`;
  
  // Add panels to main container
  mainContainer.appendChild(navPanel);
  mainContainer.appendChild(productsPanel);
  
  // Add main container to page
  container.appendChild(mainContainer);
  
  // Add click handlers for campaign items
  addCampaignClickHandlers();
}

// Render a campaign group
function renderCampaignGroup(container, type, campaigns, icon) {
  if (campaigns.length === 0) return;
  
  const groupSection = document.createElement('div');
  groupSection.className = 'campaign-group-section';
  groupSection.setAttribute('data-channel-type', type);
  
  // Add group header
  const groupHeader = document.createElement('div');
  groupHeader.className = 'campaign-group-header';
  groupHeader.innerHTML = `
    <div class="campaign-type-icon">${icon}</div>
    <div class="campaign-group-title">${type.replace('_', ' ')}</div>
    <div class="campaign-group-count">${campaigns.length}</div>
  `;
  groupSection.appendChild(groupHeader);
  
  // Add campaign items
  campaigns.forEach(campaign => {
    const campaignItem = createCampaignItem(campaign, icon);
    groupSection.appendChild(campaignItem);
  });
  
  container.appendChild(groupSection);
}

// Create a campaign item
function createCampaignItem(campaign, icon) {
  const item = document.createElement('div');
  item.className = 'campaign-nav-item';
  item.setAttribute('data-campaign-key', `${campaign.channelType}::${campaign.campaignName}`);
  
  const badgeClass = campaign.channelType === 'PERFORMANCE_MAX' ? 'pmax' : 'shopping';
  
  item.innerHTML = `
    <div class="campaign-card-details">
      <div class="campaign-type-badge ${badgeClass}">
        ${icon}
      </div>
      <div class="campaign-info">
        <div class="campaign-name">${campaign.campaignName}</div>
        <div class="campaign-meta">
          <div class="campaign-products-count">
            <span>📦</span>
            <span>${campaign.products.size} products</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return item;
}

// Filter campaigns by type
function filterCampaigns(filterType) {
  const groups = document.querySelectorAll('.campaign-group-section');
  
  groups.forEach(group => {
    const channelType = group.getAttribute('data-channel-type');
    
    if (filterType === 'all') {
      group.style.display = 'block';
    } else if (channelType === filterType) {
      group.style.display = 'block';
    } else {
      group.style.display = 'none';
    }
  });
}

// Add click handlers for campaign items
function addCampaignClickHandlers() {
  document.querySelectorAll('.campaign-nav-item').forEach(item => {
    item.addEventListener('click', async function() {
      // Update selection state
      document.querySelectorAll('.campaign-nav-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      
      // Get campaign data
      const campaignKey = this.getAttribute('data-campaign-key');
      const [channelType, ...campaignNameParts] = campaignKey.split('::');
      const campaignName = campaignNameParts.join('::'); // Handle campaign names with ::
      
      // Update selected campaign
      window.selectedCampaign = {
        channelType: channelType,
        campaignName: campaignName,
        key: campaignKey
      };
      
      // Load and display products for this campaign
      await loadCampaignProducts(campaignKey, channelType, campaignName);
    });
  });
}

// Load products for selected campaign
async function loadCampaignProducts(campaignKey, channelType, campaignName) {
  console.log('[loadCampaignProducts] Loading products for campaign:', campaignName);
  
  const productsPanel = document.getElementById('campaignsProductsPanel');
  const headerInfo = document.querySelector('.selected-campaign-info');
  
  if (!productsPanel) return;
  
  // Show loading state
  const tableContainer = productsPanel.querySelector('.campaigns-products-table-container') || 
                         document.createElement('div');
  tableContainer.className = 'campaigns-products-table-container';
  tableContainer.innerHTML = '<div class="campaigns-loading"><div class="campaigns-spinner"></div></div>';
  
  if (!productsPanel.querySelector('.campaigns-products-table-container')) {
    productsPanel.appendChild(tableContainer);
  }
  
  headerInfo.textContent = `Loading products for ${campaignName}...`;
  
  try {
    // Get product titles for this campaign from campaign mapping
    const productTitles = window.campaignProducts.get(campaignKey) || [];
    
    console.log('[loadCampaignProducts] Found products:', productTitles.length);
    
    if (productTitles.length === 0) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">📦</div>
          <div class="campaigns-empty-title">No Products Found</div>
          <div class="campaigns-empty-text">This campaign doesn't have any products</div>
        </div>
      `;
      headerInfo.textContent = `${campaignName} - No products`;
      return;
    }
    
    // Get bucket data for these products
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadCampaignProducts] No bucket data found');
      return;
    }
    
    // Filter data for this campaign and organize by product and device
    const productsData = new Map();
    
    result.data.forEach(row => {
      if (row['Campaign Name'] === campaignName && 
          row['Channel Type'] === channelType &&
          productTitles.includes(row['Product Title'])) {
        
        const productTitle = row['Product Title'];
        const device = row['Device'] || 'Unknown';
        
        if (!productsData.has(productTitle)) {
          productsData.set(productTitle, {
            title: productTitle,
            devices: new Map(),
            aggregated: {}
          });
        }
        
        productsData.get(productTitle).devices.set(device, row);
      }
    });
    
    // Match with company products for additional data
    const matchedProducts = new Map();
    if (window.allRows && Array.isArray(window.allRows)) {
      window.allRows.forEach(product => {
        if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
          const productKey = product.title || '';
          if (productsData.has(productKey)) {
            matchedProducts.set(productKey, product);
          }
        }
      });
    }
    
    console.log('[loadCampaignProducts] Matched products:', matchedProducts.size);
    
    // Calculate aggregated metrics for each product
    const tableData = [];
    
    for (const [productTitle, productData] of productsData) {
      const devices = Array.from(productData.devices.values());
      const matchedProduct = matchedProducts.get(productTitle);
      
      // Aggregate metrics across all devices
      const aggregated = {
        title: productTitle,
        image: matchedProduct?.thumbnail || '',
        adPosition: calculateAdPosition(matchedProduct),
        marketShare: calculateMarketShare(matchedProduct),
        devices: productData.devices,
        // Aggregate numeric metrics
        impressions: devices.reduce((sum, d) => sum + (parseFloat(d.Impressions) || 0), 0),
        clicks: devices.reduce((sum, d) => sum + (parseFloat(d.Clicks) || 0), 0),
        cost: devices.reduce((sum, d) => sum + (parseFloat(d.Cost) || 0), 0),
        conversions: devices.reduce((sum, d) => sum + (parseFloat(d.Conversions) || 0), 0),
        convValue: devices.reduce((sum, d) => sum + (parseFloat(d.ConvValue) || 0), 0),
        cartCount: devices.reduce((sum, d) => sum + ((parseFloat(d['Cart Rate']) || 0) * (parseFloat(d.Clicks) || 0) / 100), 0),
        checkoutCount: devices.reduce((sum, d) => sum + ((parseFloat(d['Checkout Rate']) || 0) * (parseFloat(d.Clicks) || 0) / 100), 0),
      };
      
      // Calculate derived metrics
      aggregated.ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions * 100) : 0;
      aggregated.avgCpc = aggregated.clicks > 0 ? (aggregated.cost / aggregated.clicks) : 0;
      aggregated.cpa = aggregated.conversions > 0 ? (aggregated.cost / aggregated.conversions) : 0;
      aggregated.cvr = aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks * 100) : 0;
      aggregated.aov = aggregated.conversions > 0 ? (aggregated.convValue / aggregated.conversions) : 0;
      aggregated.cpm = aggregated.impressions > 0 ? (aggregated.cost / aggregated.impressions * 1000) : 0;
      aggregated.roas = aggregated.cost > 0 ? (aggregated.convValue / aggregated.cost) : 0;
      aggregated.cartRate = aggregated.clicks > 0 ? (aggregated.cartCount / aggregated.clicks * 100) : 0;
      aggregated.checkoutRate = aggregated.cartCount > 0 ? (aggregated.checkoutCount / aggregated.cartCount * 100) : 0;
      aggregated.purchaseRate = aggregated.checkoutCount > 0 ? (aggregated.conversions / aggregated.checkoutCount * 100) : 0;
      
      tableData.push(aggregated);
    }
    
    // Sort by impressions by default
    tableData.sort((a, b) => b.impressions - a.impressions);
    
    // Render the table
    renderProductsTable(tableContainer, tableData, campaignName);
    
    // Update header info
    headerInfo.textContent = `${campaignName} - ${tableData.length} products`;
    
  } catch (error) {
    console.error('[loadCampaignProducts] Error loading products:', error);
    const tableContainer = productsPanel.querySelector('.campaigns-products-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">⚠️</div>
          <div class="campaigns-empty-title">Error Loading Products</div>
          <div class="campaigns-empty-text">Failed to load products for this campaign</div>
        </div>
      `;
    }
    headerInfo.textContent = `${campaignName} - Error loading products`;
  }
}

// Calculate ad position from matched product
function calculateAdPosition(matchedProduct) {
  if (!matchedProduct) return null;
  
  // Calculate average rating from market data
  const metrics = calculateGoogleAdsProductMetrics(matchedProduct);
  return metrics?.avgRating || null;
}

// Calculate market share from matched product
function calculateMarketShare(matchedProduct) {
  if (!matchedProduct) return null;
  
  // Calculate visibility/market share
  const metrics = calculateGoogleAdsProductMetrics(matchedProduct);
  return metrics?.avgVisibility || null;
}

// Render products table with modern design
function renderProductsTable(container, tableData, campaignName) {
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'camp-products-wrapper';
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'camp-table-modern';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'camp-table-header';
  header.innerHTML = `
    <div class="camp-th-cell center"></div>
    <div class="camp-th-cell center sortable" data-sort="adPosition">
      Pos
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell center sortable" data-sort="marketShare">
      Share
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell sortable" data-sort="title">
      Product
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="impressions">
      Impressions
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="clicks">
      Clicks
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="ctr">
      CTR %
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="cost">
      Cost
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="conversions">
      Conv.
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="roas">
      ROAS
      <span class="camp-sort-icon">⇅</span>
    </div>
    <div class="camp-th-cell right sortable" data-sort="convValue">
      Revenue
      <span class="camp-sort-icon">⇅</span>
    </div>
  `;
  
  // Create body
  const body = document.createElement('div');
  body.className = 'camp-table-body';
  
  // Render rows
  tableData.forEach((product, index) => {
    // Main product row
    const mainRow = document.createElement('div');
    mainRow.className = 'camp-row-main';
    mainRow.dataset.index = index;
    
    const hasDevices = product.devices && product.devices.size > 1;
    if (hasDevices) {
      mainRow.classList.add('has-children');
    }
    
    // Position badge class
    let posClass = 'bottom';
    if (product.adPosition) {
      if (product.adPosition <= 3) posClass = 'top';
      else if (product.adPosition <= 8) posClass = 'mid';
      else if (product.adPosition <= 14) posClass = 'low';
    }
    
    mainRow.innerHTML = `
      <div class="camp-td-cell">
        ${hasDevices ? `<div class="camp-expand-arrow" data-index="${index}">▶</div>` : ''}
      </div>
      <div class="camp-td-cell">
        ${product.adPosition ? 
          `<div class="camp-position-indicator ${posClass}">${product.adPosition}</div>` : 
          '<div style="text-align: center; width: 100%; color: #adb5bd;">-</div>'}
      </div>
      <div class="camp-td-cell">
        ${product.marketShare ? 
          `<div class="camp-share-bar">
            <div class="camp-share-fill" style="height: ${product.marketShare}%"></div>
            <div class="camp-share-text">${product.marketShare.toFixed(1)}%</div>
          </div>` : 
          '<div style="text-align: center; width: 100%; color: #adb5bd;">-</div>'}
      </div>
      <div class="camp-td-cell">
        <div class="camp-product-info">
          ${product.image ? 
            `<img class="camp-product-img" src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">` : ''}
          <div class="camp-product-name">${product.title}</div>
        </div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric large">${formatMetricValue(product.impressions, 'number')}</div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric">${formatMetricValue(product.clicks, 'number')}</div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric ${product.ctr > 2 ? 'positive' : product.ctr < 0.5 ? 'negative' : ''}">
          ${formatMetricValue(product.ctr, 'percent')}
        </div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric">${formatMetricValue(product.cost, 'currency')}</div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric">${formatMetricValue(product.conversions, 'number')}</div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric highlight">${formatMetricValue(product.roas, 'roas')}</div>
      </div>
      <div class="camp-td-cell">
        <div class="camp-metric large">${formatMetricValue(product.convValue, 'currency')}</div>
      </div>
    `;
    
    body.appendChild(mainRow);
    
    // Device rows (initially hidden)
    if (hasDevices) {
      product.devices.forEach((deviceData, deviceType) => {
        const deviceRow = document.createElement('div');
        deviceRow.className = 'camp-row-device';
        deviceRow.dataset.parentIndex = index;
        
        const deviceClass = deviceType.toLowerCase();
        const deviceIcon = deviceType === 'MOBILE' ? '📱' : 
                          deviceType === 'TABLET' ? '📱' : '💻';
        
        deviceRow.innerHTML = `
          <div class="camp-td-cell"></div>
          <div class="camp-td-cell"></div>
          <div class="camp-td-cell"></div>
          <div class="camp-td-cell">
            <div class="camp-device-tag ${deviceClass}">
              ${deviceIcon} ${deviceType}
            </div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.Impressions), 'number')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.Clicks), 'number')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.CTR), 'percent')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.Cost), 'currency')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.Conversions), 'number')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.ROAS), 'roas')}</div>
          </div>
          <div class="camp-td-cell">
            <div class="camp-metric">${formatMetricValue(parseFloat(deviceData.ConvValue), 'currency')}</div>
          </div>
        `;
        
        body.appendChild(deviceRow);
      });
    }
  });
  
  // Assemble table
  tableContainer.appendChild(header);
  tableContainer.appendChild(body);
  wrapper.appendChild(tableContainer);
  
  // Clear container and add new table
  container.innerHTML = '';
  container.appendChild(wrapper);
  
  // Add event listeners
  addModernTableEventListeners(wrapper, tableData);
}

// Add event listeners for modern table
function addModernTableEventListeners(wrapper, tableData) {
  // Expand/collapse functionality
  wrapper.querySelectorAll('.camp-expand-arrow').forEach(arrow => {
    arrow.addEventListener('click', function(e) {
      e.stopPropagation();
      const index = this.dataset.index;
      const deviceRows = wrapper.querySelectorAll(`.camp-row-device[data-parent-index="${index}"]`);
      
      this.classList.toggle('expanded');
      deviceRows.forEach(row => {
        row.classList.toggle('visible');
      });
    });
  });
  
  // Sorting functionality
  let currentSort = { column: null, direction: null };
  
  wrapper.querySelectorAll('.camp-th-cell.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const column = this.dataset.sort;
      
      // Remove previous sort classes
      wrapper.querySelectorAll('.camp-th-cell').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Determine sort direction
      let direction = 'asc';
      if (currentSort.column === column && currentSort.direction === 'asc') {
        direction = 'desc';
      }
      
      // Apply sort class
      this.classList.add(`sorted-${direction}`);
      
      // Update sort icon
      this.querySelector('.camp-sort-icon').textContent = direction === 'asc' ? '↑' : '↓';
      
      // Sort data
      const sortedData = [...tableData].sort((a, b) => {
        let aVal = column === 'title' ? a.title : a[column];
        let bVal = column === 'title' ? b.title : b[column];
        
        // Handle null/undefined values
        if (aVal == null) aVal = 0;
        if (bVal == null) bVal = 0;
        
        if (typeof aVal === 'string') {
          return direction === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
        } else {
          return direction === 'asc' ? 
            (aVal - bVal) : 
            (bVal - aVal);
        }
      });
      
      // Update current sort
      currentSort = { column, direction };
      
      // Re-render table with sorted data
      const container = wrapper.parentElement;
      renderProductsTable(container, sortedData, window.selectedCampaign?.campaignName || '');
    });
  });
}

// Format metric value based on type
function formatMetricValue(value, format) {
  if (value === null || value === undefined || value === '') return '-';
  
  switch (format) {
    case 'number':
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'currency':
      return '$' + value.toFixed(2);
    case 'percent':
      return value.toFixed(1) + '%';
    case 'roas':
      return value.toFixed(2) + 'x';
    default:
      return value;
  }
}

// Get device-specific metric value
function getDeviceMetricValue(deviceData, metric) {
  const metricMap = {
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    avgCpc: 'Avg CPC',
    cost: 'Cost',
    conversions: 'Conversions',
    cpa: 'CPA',
    convValue: 'ConvValue',
    cvr: 'CVR',
    aov: 'AOV',
    cpm: 'CPM',
    roas: 'ROAS',
    cartRate: 'Cart Rate',
    checkoutRate: 'Checkout Rate',
    purchaseRate: 'Purchase Rate'
  };
  
  return parseFloat(deviceData[metricMap[metric]] || 0);
}

// Add table event listeners
function addTableEventListeners(container, tableData, columns, visibleColumns) {
  // Expand/collapse device rows
  container.querySelectorAll('.expand-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const row = this.closest('tr');
      const productIndex = row.getAttribute('data-product-index');
      const deviceRows = container.querySelectorAll(`tr.device-row[data-parent-index="${productIndex}"]`);
      
      this.classList.toggle('expanded');
      deviceRows.forEach(deviceRow => {
        deviceRow.classList.toggle('expanded');
      });
    });
  });
  
  // Sorting
  container.querySelectorAll('th.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const column = this.getAttribute('data-column');
      const currentSort = this.classList.contains('sorted-asc') ? 'asc' : 
                         this.classList.contains('sorted-desc') ? 'desc' : null;
      
      // Clear all sort classes
      container.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Apply new sort
      let newSort = currentSort === 'asc' ? 'desc' : 'asc';
      this.classList.add(`sorted-${newSort}`);
      
      // Sort data
      const sortedData = [...tableData].sort((a, b) => {
        let aVal = column === 'product' ? a.title : a[column];
        let bVal = column === 'product' ? b.title : b[column];
        
        if (typeof aVal === 'string') {
          return newSort === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
        } else {
          return newSort === 'asc' ? 
            (aVal || 0) - (bVal || 0) : 
            (bVal || 0) - (aVal || 0);
        }
      });
      
      // Re-render table
      renderProductsTable(container, sortedData, window.selectedCampaign?.campaignName || '');
    });
  });
}

// Create a campaign product item (similar to google-ads-small-ad-details)
async function createCampaignProductItem(product) {
  const productDiv = document.createElement('div');
  productDiv.className = 'campaign-product-item';
  
  // Calculate metrics (reuse existing function if available)
  const metrics = typeof calculateGoogleAdsProductMetrics === 'function' 
    ? calculateGoogleAdsProductMetrics(product) 
    : { avgRating: 0, avgVisibility: 0, activeLocations: 0, inactiveLocations: 0, rankTrend: {}, visibilityTrend: {} };
  
  const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
  const imageUrl = product.thumbnail || 'https://via.placeholder.com/60?text=No+Image';
  const title = product.title || 'No title';
  
  productDiv.innerHTML = `
    <!-- Position Badge -->
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor}; width: 60px; height: 60px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
      <div style="font-size: 22px; line-height: 1; color: white; font-weight: 700;">${metrics.avgRating}</div>
      ${metrics.rankTrend && metrics.rankTrend.arrow ? `
        <div style="position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);">
          <span style="background-color: ${metrics.rankTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600;">
            ${metrics.rankTrend.arrow} ${Math.abs(metrics.rankTrend.change)}
          </span>
        </div>
      ` : ''}
    </div>
    
    <!-- Visibility Status -->
    <div class="small-ad-vis-status" style="width: 60px; flex-shrink: 0;">
      <div style="width: 60px; height: 60px; background: #e3f2fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${metrics.avgVisibility}%; background: linear-gradient(to top, #1e88e5, rgba(30, 136, 229, 0.3)); transition: height 0.3s;"></div>
        <span style="position: relative; z-index: 2; font-size: 11px; font-weight: bold; color: #1565c0;">${metrics.avgVisibility.toFixed(1)}%</span>
        ${metrics.visibilityTrend && metrics.visibilityTrend.arrow ? `
          <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);">
            <span style="background-color: ${metrics.visibilityTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600;">
              ${metrics.visibilityTrend.arrow} ${Math.abs(metrics.visibilityTrend.change).toFixed(0)}%
            </span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- ROAS Badge -->
    <div class="roas-badge" style="width: 60px; height: 60px; background-color: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
      <div style="font-size: 11px; color: #999;">-</div>
    </div>
    
    <!-- Product Image -->
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px; flex-shrink: 0;"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';">
    
    <!-- Product Title -->
    <div class="small-ad-title" style="flex: 1; font-size: 14px; line-height: 1.4; word-wrap: break-word;">${title}</div>
    
    <!-- Metrics placeholder -->
    <div style="width: 200px; display: flex; gap: 15px; padding: 8px 15px; background: #f8f9fa; border-radius: 8px; align-items: center; justify-content: center;">
      <span style="font-size: 11px; color: #999;">Metrics loading...</span>
    </div>
  `;
  
  // Add click handler (no functionality for now)
  productDiv.addEventListener('click', function() {
    console.log('[Campaign Product] Clicked:', product.title);
    // Functionality to be added later
  });
  
  return productDiv;
}

// Helper function to get rating badge color
function getGoogleAdsRatingBadgeColor(rating) {
  if (rating >= 1 && rating <= 3) return '#4CAF50'; // Green
  if (rating >= 4 && rating <= 8) return '#FFC107'; // Yellow
  if (rating >= 9 && rating <= 14) return '#FF9800'; // Orange
  return '#F44336'; // Red
}

// Helper function to get project table prefix
function getProjectTablePrefix() {
  const accountPrefix = window.currentAccount || 'acc1';
  const currentProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
  return `${accountPrefix}_pr${currentProjectNum}_`;
}

// Render empty state
function renderEmptyCampaignsState() {
  const container = document.getElementById('campaigns_overview_container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="campaigns-empty-state" style="height: 100%; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center;">
        <div class="campaigns-empty-icon" style="font-size: 64px; margin-bottom: 20px;">📊</div>
        <div class="campaigns-empty-title" style="font-size: 24px; font-weight: 600; margin-bottom: 10px;">No Campaigns Data Available</div>
        <div class="campaigns-empty-text" style="font-size: 16px; color: #666;">Campaign data will appear here once it's available in the system</div>
      </div>
    </div>
  `;
}

// Export initialization function
window.initializeCampaignsSection = initializeCampaignsSection;
