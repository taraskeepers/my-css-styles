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
        margin-top: 20px;
      }
      
      /* Left navigation panel - positioned relative inside container */
      #campaignsNavPanel {
        width: 320px;
        min-width: 320px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease-in-out, min-width 0.3s ease-in-out;
        position: relative;
      }
      
      #campaignsNavPanel.collapsed {
        width: 12px !important;
        min-width: 12px !important;
        overflow: hidden;
        cursor: pointer;
      }
      
      #campaignsNavPanel.collapsed > * {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
      }
      
      #campaignsNavPanel.collapsed::before {
        content: '';
        position: absolute;
        top: 0;
        left: 4px;
        width: 4px;
        height: 100%;
        background: linear-gradient(to bottom, #007aff, #0056b3);
        border-radius: 2px;
        opacity: 0.6;
        transition: opacity 0.3s ease-in-out;
      }
      
      #campaignsNavPanel.collapsed:hover::before {
        opacity: 1;
      }
      
      /* Campaign type filter */
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
      
      .campaign-filter-btn:hover:not(.active) {
        background-color: #f0f0f0;
        border-color: #007aff;
      }
      
      /* Campaigns list container */
      .campaigns-list-container {
        padding: 10px;
        overflow-y: auto;
        flex: 1;
      }
      
      /* Campaign group section */
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
      
      /* Campaign item card */
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
      
      /* Campaign type badge */
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
      
      /* Campaign info */
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
        width: 1200px;
        min-width: 1200px;
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
      
      /* Products grid */
      .campaigns-products-grid {
        flex: 1;
        padding: 20px;
        overflow-y: auto;
        display: grid;
        grid-template-columns: 1fr;
        gap: 10px;
        align-content: start;
      }
      
      /* Empty state */
      .campaigns-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
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
      }
      
      .campaigns-empty-text {
        font-size: 14px;
        line-height: 1.5;
      }
      
      /* Campaign product item */
      .campaign-product-item {
        width: 100%;
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        padding: 10px 15px;
        cursor: pointer;
        transition: all 0.2s;
        gap: 10px;
      }
      
      .campaign-product-item:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
      }
      
      /* Loading spinner */
      .campaigns-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
      }
      
      .campaigns-spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #007aff;
        animation: spin 1s ease infinite;
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
        <span>📊</span> All Campaigns
      </button>
      <button class="campaign-filter-btn" data-filter="PERFORMANCE_MAX">
        <span>🚀</span> Performance Max
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
      <h3 class="campaigns-products-title">Campaign Products</h3>
      <div class="selected-campaign-info">Select a campaign to view its products</div>
    </div>
    <div class="campaigns-products-grid">
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
  
  const productsGrid = document.querySelector('.campaigns-products-grid');
  const headerInfo = document.querySelector('.selected-campaign-info');
  
  if (!productsGrid) return;
  
  // Show loading state
  productsGrid.innerHTML = '<div class="campaigns-loading"><div class="campaigns-spinner"></div></div>';
  headerInfo.textContent = `Loading products for ${campaignName}...`;
  
  try {
    // Get product titles for this campaign
    const productTitles = window.campaignProducts.get(campaignKey) || [];
    
    console.log('[loadCampaignProducts] Found products:', productTitles.length);
    
    if (productTitles.length === 0) {
      productsGrid.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">📦</div>
          <div class="campaigns-empty-title">No Products Found</div>
          <div class="campaigns-empty-text">This campaign doesn't have any products</div>
        </div>
      `;
      headerInfo.textContent = `${campaignName} - No products`;
      return;
    }
    
    // Get all company products
    const allCompanyProducts = [];
    const productMap = new Map();
    
    if (window.allRows && Array.isArray(window.allRows)) {
      window.allRows.forEach(product => {
        if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
          const productKey = product.title || '';
          
          if (!productMap.has(productKey) && productTitles.includes(productKey)) {
            productMap.set(productKey, product);
            allCompanyProducts.push(product);
          }
        }
      });
    }
    
    console.log('[loadCampaignProducts] Matched products:', allCompanyProducts.length);
    
    // Clear grid and render products
    productsGrid.innerHTML = '';
    
    // Sort products by title
    allCompanyProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    
    // Render each product
    for (const product of allCompanyProducts) {
      const productItem = await createCampaignProductItem(product);
      productsGrid.appendChild(productItem);
    }
    
    // Update header info
    headerInfo.textContent = `${campaignName} - ${allCompanyProducts.length} products`;
    
  } catch (error) {
    console.error('[loadCampaignProducts] Error loading products:', error);
    productsGrid.innerHTML = `
      <div class="campaigns-empty-state">
        <div class="campaigns-empty-icon">⚠️</div>
        <div class="campaigns-empty-title">Error Loading Products</div>
        <div class="campaigns-empty-text">Failed to load products for this campaign</div>
      </div>
    `;
    headerInfo.textContent = `${campaignName} - Error loading products`;
  }
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
