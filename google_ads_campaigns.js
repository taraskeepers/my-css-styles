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
  
  // Add click handler for collapsed campaigns nav panel
  document.addEventListener('click', function(e) {
    const campaignsNavPanel = document.getElementById('campaignsNavPanel');
    
    if (campaignsNavPanel && campaignsNavPanel.classList.contains('collapsed') && campaignsNavPanel.contains(e.target)) {
      // Expand the panel
      campaignsNavPanel.classList.remove('collapsed');
      const contentWrapper = document.querySelector('.campaigns-content-wrapper');
      if (contentWrapper) {
        contentWrapper.classList.remove('nav-collapsed');
      }
    }
  });
}

// Add campaigns-specific styles
function addCampaignsStyles() {
  if (!document.getElementById('campaigns-section-styles')) {
    const style = document.createElement('style');
    style.id = 'campaigns-section-styles';
    style.textContent = `
      /* Main campaigns container */
      #campaigns_overview_container {
        margin-top: 100px;
        width: 100%;
        height: calc(100vh - 100px);
        position: relative;
        background-color: transparent;
      }
      
      /* Campaigns nav panel collapsed state */
      #campaignsNavPanel.collapsed {
        width: 12px !important;
        min-width: 12px !important;
      }
      
      #campaignsNavPanel.collapsed > * {
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
      }
      
      /* Vertical indicator for collapsed state */
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
        cursor: pointer;
      }
      
      /* Content wrapper adjustment for collapsed nav */
      .campaigns-content-wrapper.nav-collapsed {
        margin-left: -308px !important;
      }
      
      /* Campaign item card - similar to product cards */
      .campaign-nav-item {
        margin-bottom: 5px;
        cursor: pointer;
      }
      
      .campaign-card-details {
        width: 290px;
        height: 60px;
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        padding: 5px;
        transition: all 0.2s;
        gap: 10px;
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
        width: 45px;
        height: 45px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 18px;
        margin-left: 5px;
      }
      
      .campaign-type-badge.pmax {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      .campaign-type-badge.shopping {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      /* Campaign info */
      .campaign-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      
      .campaign-name {
        font-size: 12px;
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
        gap: 8px;
        font-size: 10px;
        color: #999;
      }
      
      /* Campaign group section */
      .campaign-group-section {
        margin-bottom: 15px;
      }
      
      .campaign-group-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        background: #f8f9fa;
        border-radius: 6px;
        margin-bottom: 8px;
      }
      
      .campaign-group-title {
        font-size: 11px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
      }
      
      .campaign-group-count {
        background: #007aff;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
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
  
  // Clear existing content - we'll use campaigns_overview_container directly
  container.innerHTML = '';
  
  // Hide the products nav panel
  const googleAdsNavPanel = document.getElementById('googleAdsNavPanel');
  if (googleAdsNavPanel) {
    googleAdsNavPanel.style.display = 'none';
  }
  
  // Create campaigns navigation panel (similar to googleAdsNavPanel)
  const navPanel = document.createElement('div');
  navPanel.id = 'campaignsNavPanel';
  navPanel.style.cssText = `
    width: 320px;
    min-width: 320px;
    background-color: white;
    border-right: 1px solid #dee2e6;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    height: calc(100vh - 180px);
    position: fixed;
    left: 0;
    top: 100px;
    z-index: 99;
    transition: width 0.3s ease-in-out, min-width 0.3s ease-in-out;
  `;
  
  // Add header with filter
  const navHeader = document.createElement('div');
  navHeader.style.cssText = `
    padding: 15px;
    margin: 0;
    border-bottom: 1px solid #dee2e6;
    display: flex;
    flex-direction: column;
    gap: 10px;
    background: linear-gradient(to bottom, #ffffff, #f9f9f9);
    position: sticky;
    top: 0;
    z-index: 10;
  `;
  
  navHeader.innerHTML = `
    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Campaigns</h3>
    <div class="campaigns-type-filter" style="display: flex; gap: 6px; justify-content: center;">
      <button class="campaign-filter-btn active" data-filter="all" style="padding: 4px 10px; border: 1px solid #ddd; background: white; border-radius: 15px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #666; display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 12px;">📊</span> All
      </button>
      <button class="campaign-filter-btn" data-filter="PERFORMANCE_MAX" style="padding: 4px 10px; border: 1px solid #ddd; background: white; border-radius: 15px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #666; display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 12px;">🚀</span> PMax
      </button>
      <button class="campaign-filter-btn" data-filter="SHOPPING" style="padding: 4px 10px; border: 1px solid #ddd; background: white; border-radius: 15px; font-size: 11px; font-weight: 500; cursor: pointer; transition: all 0.2s; color: #666; display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 12px;">🛍️</span> Shopping
      </button>
    </div>
  `;
  navPanel.appendChild(navHeader);
  
  // Add campaigns list container
  const listContainer = document.createElement('div');
  listContainer.className = 'campaigns-list-container';
  listContainer.style.cssText = 'padding: 10px; overflow-y: auto; flex: 1;';
  navPanel.appendChild(listContainer);
  
  // Group campaigns by type
  const pmaxCampaigns = window.campaignsData.filter(c => c.channelType === 'PERFORMANCE_MAX');
  const shoppingCampaigns = window.campaignsData.filter(c => c.channelType === 'SHOPPING');
  
  // Render campaign groups
  renderCampaignGroup(listContainer, 'PERFORMANCE_MAX', pmaxCampaigns, '🚀');
  renderCampaignGroup(listContainer, 'SHOPPING', shoppingCampaigns, '🛍️');
  
  // Add click handlers for filters
  navHeader.querySelectorAll('.campaign-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active state
      navHeader.querySelectorAll('.campaign-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.style.backgroundColor = 'white';
        b.style.color = '#666';
        b.style.borderColor = '#ddd';
      });
      this.classList.add('active');
      this.style.backgroundColor = '#007aff';
      this.style.color = 'white';
      this.style.borderColor = '#007aff';
      
      // Filter campaigns
      const filterType = this.getAttribute('data-filter');
      filterCampaigns(filterType);
    });
  });
  
  // Set initial active button style
  const activeBtn = navHeader.querySelector('.campaign-filter-btn.active');
  if (activeBtn) {
    activeBtn.style.backgroundColor = '#007aff';
    activeBtn.style.color = 'white';
    activeBtn.style.borderColor = '#007aff';
  }
  
  // Create right products panel with content wrapper styling
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'campaigns-content-wrapper';
  contentWrapper.style.cssText = `
    margin-left: 320px;
    transition: margin-left 0.3s ease-in-out;
    width: calc(100% - 320px);
    padding: 20px;
  `;
  
  const productsPanel = document.createElement('div');
  productsPanel.id = 'campaignsProductsPanel';
  productsPanel.style.cssText = `
    width: 1200px;
    background-color: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 600px;
  `;
  
  productsPanel.innerHTML = `
    <div class="campaigns-products-header" style="padding: 15px 20px; border-bottom: 1px solid #dee2e6; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
      <h3 class="campaigns-products-title" style="font-size: 16px; font-weight: 600; color: #333; margin: 0;">Campaign Products</h3>
      <div class="selected-campaign-info" style="font-size: 13px; color: #666; margin-top: 4px;">Select a campaign to view its products</div>
    </div>
    <div class="campaigns-products-grid" style="flex: 1; padding: 20px; overflow-y: auto; display: grid; grid-template-columns: 1fr; gap: 10px; align-content: start;">
      <div class="campaigns-empty-state" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; color: #999; text-align: center; padding: 40px;">
        <div class="campaigns-empty-icon" style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">📦</div>
        <div class="campaigns-empty-title" style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">No Campaign Selected</div>
        <div class="campaigns-empty-text" style="font-size: 14px; line-height: 1.5;">Select a campaign from the left panel to view its products</div>
      </div>
    </div>
  `;
  
  contentWrapper.appendChild(productsPanel);
  
  // Add panels to container
  container.appendChild(navPanel);
  container.appendChild(contentWrapper);
  
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
  const container = document.getElementById('campaigns_overview_content');
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
