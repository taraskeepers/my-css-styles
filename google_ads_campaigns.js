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
      
/* COMPLETELY REDESIGNED TABLE STYLES */
.camp-products-wrapper {
  flex: 1;
  padding: 0;
  overflow: auto;
  background: #ffffff;
}

.camp-table-modern {
  width: 100%;
  background: white;
  min-width: 100%;
}

/* Table Header */
.camp-table-header {
  display: flex;
  background: #f8fafb;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
  min-width: fit-content;
}

.camp-th-cell {
  padding: 10px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  color: #6b7280;
  display: flex;
  align-items: center;
  white-space: nowrap;
  border-right: 1px solid #f3f4f6;
}

.camp-th-cell:last-child {
  border-right: none;
}

.camp-th-cell.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.15s ease;
}

.camp-th-cell.sortable:hover {
  background: #eff6ff;
  color: #2563eb;
}

.camp-sort-icon {
  margin-left: 4px;
  font-size: 10px;
  color: #9ca3af;
  transition: transform 0.2s;
}

.camp-th-cell.sorted-asc .camp-sort-icon {
  color: #2563eb;
  transform: rotate(180deg);
}

.camp-th-cell.sorted-desc .camp-sort-icon {
  color: #2563eb;
}

/* Column widths */
.expand-col { width: 32px; min-width: 32px; justify-content: center; }
.pos-col { width: 48px; min-width: 48px; justify-content: center; }
.share-col { width: 80px; min-width: 80px; }
.product-col { flex: 1; min-width: 250px; }
.metric-col { width: 90px; min-width: 90px; justify-content: flex-end; }
.revenue-col { width: 100px; min-width: 100px; justify-content: flex-end; }

/* Table Body */
.camp-table-body {
  background: white;
  min-width: fit-content;
}

/* Main Row */
.camp-row-main {
  display: flex;
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.15s ease;
  min-height: 40px;
  align-items: center;
}

.camp-row-main:hover {
  background-color: #fafbfc;
}

/* Table Cells */
.camp-td-cell {
  padding: 8px 12px;
  font-size: 13px;
  color: #374151;
  display: flex;
  align-items: center;
  border-right: 1px solid #f9fafb;
  height: 40px;
}

.camp-td-cell:last-child {
  border-right: none;
}

/* Expand Button */
.camp-expand-btn {
  width: 20px;
  height: 20px;
  border: none;
  background: #f3f4f6;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  color: #6b7280;
  transition: all 0.15s ease;
  padding: 0;
}

.camp-expand-btn:hover {
  background: #e5e7eb;
  transform: scale(1.1);
}

.camp-expand-btn.expanded {
  transform: rotate(90deg);
  background: #dbeafe;
  color: #2563eb;
}

/* Position Value */
.camp-pos-value {
  font-size: 14px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Market Share */
.camp-share-container {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.camp-share-bar-bg {
  flex: 1;
  height: 16px;
  background: #f3f4f6;
  border-radius: 8px;
  overflow: hidden;
  min-width: 35px;
}

.camp-share-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 8px;
}

.camp-share-value {
  font-size: 11px;
  font-weight: 600;
  color: #6b7280;
  min-width: 35px;
  text-align: right;
}

/* Product Info */
.camp-product-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  min-width: 0;
}

.camp-product-thumb {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  object-fit: cover;
  border: 1px solid #e5e7eb;
  flex-shrink: 0;
  background: white;
}

.camp-product-title {
  font-size: 13px;
  color: #111827;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}

/* Metrics */
.camp-metric-value {
  font-variant-numeric: tabular-nums;
  font-size: 13px;
  color: #374151;
  white-space: nowrap;
}

.camp-metric-value.positive {
  color: #059669;
  font-weight: 500;
}

.camp-metric-value.negative {
  color: #dc2626;
  font-weight: 500;
}

.camp-metric-value.highlight {
  color: #2563eb;
  font-weight: 600;
  background: #eff6ff;
  padding: 2px 6px;
  border-radius: 4px;
}

.camp-metric-value.revenue {
  font-weight: 600;
  color: #111827;
}

.camp-metric-value.sub {
  font-size: 12px;
  color: #6b7280;
}

.camp-null-value {
  color: #d1d5db;
  font-size: 12px;
}

/* Device Rows */
.camp-row-device {
  display: none;
  border-bottom: 1px solid #f3f4f6;
  background: #fafbfc;
  min-height: 36px;
  align-items: center;
}

.camp-row-device.visible {
  display: flex;
  animation: slideIn 0.15s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.camp-device-label {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-left: 24px;
  font-size: 12px;
  color: #6b7280;
}

.camp-device-icon {
  font-size: 14px;
}

.camp-device-name {
  font-weight: 500;
  text-transform: capitalize;
}

/* Scrollbar styling */
.camp-products-wrapper::-webkit-scrollbar {
  height: 8px;
  width: 8px;
}

.camp-products-wrapper::-webkit-scrollbar-track {
  background: #f9fafb;
}

.camp-products-wrapper::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.camp-products-wrapper::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}

/* Responsive adjustments */
@media (max-width: 1400px) {
  .metric-col {
    width: 80px;
    min-width: 80px;
  }
  
  .revenue-col {
    width: 90px;
    min-width: 90px;
  }
}

@media (max-width: 1200px) {
  .camp-th-cell,
  .camp-td-cell {
    padding: 6px 8px;
  }
  
  .metric-col {
    width: 75px;
    min-width: 75px;
  }
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

// Render products table with modern design - COMPLETELY REDESIGNED
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
    <div class="camp-th-cell expand-col"></div>
    <div class="camp-th-cell pos-col sortable" data-sort="adPosition">
      POS <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell share-col sortable" data-sort="marketShare">
      SHARE <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell product-col sortable" data-sort="title">
      PRODUCT <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="impressions">
      IMPRESSIONS <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="clicks">
      CLICKS <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="ctr">
      CTR % <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="cost">
      COST <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="conversions">
      CONV. <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell metric-col sortable" data-sort="roas">
      ROAS <span class="camp-sort-icon">↕</span>
    </div>
    <div class="camp-th-cell revenue-col sortable" data-sort="convValue">
      REVENUE <span class="camp-sort-icon">↕</span>
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
    
    // Position value and color
    let posValue = product.adPosition || '-';
    let posColor = '#94a3b8'; // Default gray
    if (product.adPosition) {
      if (product.adPosition <= 3) posColor = '#22c55e';
      else if (product.adPosition <= 8) posColor = '#f59e0b';
      else if (product.adPosition <= 14) posColor = '#fb923c';
      else posColor = '#ef4444';
    }
    
    // Market share bar width and color
    const sharePercent = product.marketShare || 0;
    const shareColor = sharePercent > 30 ? '#3b82f6' : sharePercent > 15 ? '#60a5fa' : '#93c5fd';
    
    mainRow.innerHTML = `
      <div class="camp-td-cell expand-col">
        ${hasDevices ? `<button class="camp-expand-btn" data-index="${index}">▶</button>` : ''}
      </div>
      <div class="camp-td-cell pos-col">
        <span class="camp-pos-value" style="color: ${posColor}; font-weight: 600;">
          ${posValue}
        </span>
      </div>
      <div class="camp-td-cell share-col">
        ${product.marketShare ? 
          `<div class="camp-share-container">
            <div class="camp-share-bar-bg">
              <div class="camp-share-bar-fill" style="width: ${sharePercent}%; background: ${shareColor};"></div>
            </div>
            <span class="camp-share-value">${sharePercent.toFixed(1)}%</span>
          </div>` : 
          '<span class="camp-null-value">-</span>'}
      </div>
      <div class="camp-td-cell product-col">
        <div class="camp-product-wrapper">
          ${product.image ? 
            `<img class="camp-product-thumb" src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">` : ''}
          <span class="camp-product-title" title="${product.title}">${product.title}</span>
        </div>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value">${formatCompactNumber(product.impressions)}</span>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value">${formatCompactNumber(product.clicks)}</span>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value ${product.ctr > 2 ? 'positive' : product.ctr < 0.5 ? 'negative' : ''}">
          ${product.ctr.toFixed(1)}%
        </span>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value">$${formatCompactNumber(product.cost)}</span>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value">${formatCompactNumber(product.conversions)}</span>
      </div>
      <div class="camp-td-cell metric-col">
        <span class="camp-metric-value highlight">${product.roas.toFixed(2)}x</span>
      </div>
      <div class="camp-td-cell revenue-col">
        <span class="camp-metric-value revenue">$${formatCompactNumber(product.convValue)}</span>
      </div>
    `;
    
    body.appendChild(mainRow);
    
    // Device rows (initially hidden)
    if (hasDevices) {
      product.devices.forEach((deviceData, deviceType) => {
        const deviceRow = document.createElement('div');
        deviceRow.className = 'camp-row-device';
        deviceRow.dataset.parentIndex = index;
        
        const deviceIcon = deviceType === 'MOBILE' ? '📱' : 
                          deviceType === 'TABLET' ? '📱' : '💻';
        
        const deviceCtr = parseFloat(deviceData.CTR) || 0;
        const deviceRoas = parseFloat(deviceData.ROAS) || 0;
        
        deviceRow.innerHTML = `
          <div class="camp-td-cell expand-col"></div>
          <div class="camp-td-cell pos-col"></div>
          <div class="camp-td-cell share-col"></div>
          <div class="camp-td-cell product-col">
            <div class="camp-device-label">
              <span class="camp-device-icon">${deviceIcon}</span>
              <span class="camp-device-name">${deviceType}</span>
            </div>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub">${formatCompactNumber(parseFloat(deviceData.Impressions))}</span>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub">${formatCompactNumber(parseFloat(deviceData.Clicks))}</span>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub ${deviceCtr > 2 ? 'positive' : deviceCtr < 0.5 ? 'negative' : ''}">
              ${deviceCtr.toFixed(1)}%
            </span>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub">$${formatCompactNumber(parseFloat(deviceData.Cost))}</span>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub">${formatCompactNumber(parseFloat(deviceData.Conversions))}</span>
          </div>
          <div class="camp-td-cell metric-col">
            <span class="camp-metric-value sub">${deviceRoas.toFixed(2)}x</span>
          </div>
          <div class="camp-td-cell revenue-col">
            <span class="camp-metric-value sub">$${formatCompactNumber(parseFloat(deviceData.ConvValue))}</span>
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

// Add new helper function for compact number formatting
function formatCompactNumber(value) {
  if (value === null || value === undefined || value === '') return '-';
  
  const num = parseFloat(value);
  if (isNaN(num)) return '-';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  } else if (num < 1 && num > 0) {
    return num.toFixed(2);
  } else {
    return num.toFixed(0);
  }
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
