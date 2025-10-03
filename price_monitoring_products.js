// price_monitoring_products.js
// Price Monitoring - Products View Module

// Global state for filtering
let selectedBucket = null;
let allProductsData = {
  myCompany: [],
  competitors: []
};

function initializePriceMonitoringProducts() {
  console.log('[PM Products] Initializing products view module');
  
  // Only initialize if we're on the products view
  const productsWrapper = document.getElementById('pmProductsWrapperContainer');
  if (!productsWrapper) return;
  
  // Add products-specific styles
  addProductsViewStyles();
  
  // Initialize the products dashboard
  renderProductsDashboard();
}

function addProductsViewStyles() {
  if (document.getElementById('pmProductsStyles')) return;
  
  const styles = `
    <style id="pmProductsStyles">
      /* Products View - INDEPENDENT Styles */
.pm-products-wrapper-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;  /* Add this to ensure horizontal layout */
  gap: 15px;
  padding: 0;
  box-sizing: border-box;
}
      
      /* Left column with overview and buckets */
      .pmp-left-column {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 420px;
        flex-shrink: 0;
      }
      
      /* Right column with product lists */
      .pmp-right-column {
        display: flex;
        gap: 15px;
        flex: 1;
        min-width: 0;
        height: 100%;
      }
      
      /* Products overview card - EXACT height of company overview card */
      .pmp-products-overview-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        gap: 20px;
        position: relative;
        overflow: hidden;
        width: 420px;
        height: 200px;
        box-sizing: border-box;
        flex-shrink: 0;
      }
      
      .pmp-products-overview-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      /* Products name styled EXACTLY like company name */
      .products-name-header {
        height: 80px;
        width: 140px;
        font-size: 14px;
        font-weight: 800;
        color: #ffffff;
        text-align: center;
        padding: 0 10px;
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
        border-radius: 12px;
        border: 1px solid #1a252f;
        text-transform: uppercase;
        letter-spacing: 1px;
        box-shadow: 
          0 4px 8px rgba(0,0,0,0.2),
          0 1px 3px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      
      .pmp-rank-container,
      .pmp-market-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .pmp-section-label {
        font-size: 10px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .pmp-big-rank-box {
        width: 80px;
        height: 80px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 36px;
        font-weight: 900;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
      }
      
      .pmp-big-market-circle {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: 900;
        color: #007aff;
        background: white;
        border: 3px solid #007aff;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
      }
      
      .pmp-market-water-fill {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%);
        transition: height 0.5s ease;
        z-index: 0;
        border-radius: 50%;
        opacity: 0.5;
      }
      
      .pmp-market-value-text {
        position: relative;
        z-index: 1;
      }
      
      /* Products buckets card */
      .pmp-products-buckets-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        width: 420px;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
      
      .pmp-products-buckets-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #4CAF50, #9C27B0);
      }
      
      /* Products buckets table */
      .pmp-products-buckets-table {
        margin-top: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      
      /* Updated products buckets styles */
      .pmp-products-buckets-header {
        display: grid;
        grid-template-columns: 150px 1fr;
        padding: 12px 16px;
        font-size: 10px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-bottom: 2px solid #f0f0f0;
        background: #fafafa;
        border-radius: 8px 8px 0 0;
      }
      
      .pmp-products-buckets-header .pmp-share-header {
        text-align: center;
        line-height: 1.2;
      }
      
      .pmp-products-bucket-row.is-dominant {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border-left: 4px solid #667eea;
        font-weight: 600;
      }
      
      .pmp-products-bucket-row.is-dominant .pmp-bucket-name {
        color: #667eea;
        font-weight: 700;
      }
      
      /* Dual bar container */
      .pmp-dual-bars-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      }
      
      .pmp-bar-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pmp-bar-label {
        font-size: 9px;
        color: #888;
        min-width: 40px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .pmp-tree-bar-container {
        flex: 1;
        height: 30px;
        position: relative;
        background: #f5f5f5;
        border-radius: 6px;
        overflow: hidden;
        max-width: 200px;
      }
      
      .pmp-tree-bar-container.small {
        height: 30px;
        max-width: 150px;
      }
      
      .pmp-bar-percent-outside {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #444;
        z-index: 2;
      }
      
      .pmp-bar-percent-outside.small {
        font-size: 10px;
      }
      
      .pmp-products-buckets-body {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }
      
      /* Products buckets row */
      .pmp-products-bucket-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        min-height: 80px;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
        position: relative;
        transition: background 0.2s;
      }
      
      .pmp-products-bucket-row:hover {
        background: #fafafa;
      }
      
      .pmp-bucket-label {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .pmp-bucket-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .pmp-bucket-indicator {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .pmp-bucket-range {
        font-size: 10px;
        color: #888;
        font-family: 'Monaco', 'Menlo', monospace;
        padding-left: 20px;
      }
      
      .pmp-products-data {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
      }
      
      .pmp-tree-bar {
        height: 100%;
        position: relative;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.85;
      }
      
      .pmp-products-box {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid;
        font-size: 12px;
        font-weight: 600;
        gap: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        transition: transform 0.2s;
      }
      
      .pmp-products-count {
        color: #2c2c2c;
        font-weight: 700;
      }
      
      .pmp-products-sep {
        color: #888;
        margin: 0 1px;
      }
      
      .pmp-discounted-count {
        color: #555;
        font-weight: 600;
      }
      
      .pmp-discount-badge {
        display: inline-block;
        padding: 4px 8px;
        background: #ff4444;
        color: white;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .pmp-discount-badge-empty {
        display: inline-block;
        padding: 4px 8px;
        color: #ccc;
        font-size: 11px;
      }
      
      .pmp-tree-metrics {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      /* Direct heading styles for products */
      .pmp-products-buckets-card h4 {
        margin: 0 0 12px 0;
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      /* Product list cards */
      .pmp-products-mycompany-card,
      .pmp-products-competitors-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        min-width: 0;
      }
      
      .pmp-products-mycompany-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      .pmp-products-competitors-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      }
      
      .pmp-products-list-header {
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #f0f0f0;
      }
      
      .pmp-products-list {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding-right: 4px;
      }
      
      /* Individual product card */
.pm-ad-details {
  display: flex;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  height: 100px;  /* Changed from 130px */
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
}
      
      .pm-ad-details:hover {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
.pm-ad-image {
  width: 100px;  /* Changed from 130px */
  height: 100px;  /* Changed from 130px */
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  background-color: #f5f5f5;
}

/* Add after .pm-ad-info styles */
.pm-ad-bucket-box {
  width: 30px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  flex-shrink: 0;
}

/* Bucket colors for price_bucket_box */
.pm-ad-bucket-ultra-cheap { background: #4CAF50; }
.pm-ad-bucket-budget { background: #66BB6A; }
.pm-ad-bucket-mid { background: #FF9800; }
.pm-ad-bucket-upper-mid { background: #FFC107; }
.pm-ad-bucket-premium { background: #7B1FA2; }
.pm-ad-bucket-ultra-premium { background: #9C27B0; }

/* Selected bucket styling */
.pmp-products-bucket-row.selected {
  background: rgba(102, 126, 234, 0.15);
  border-left: 4px solid #667eea;
}

.pmp-products-bucket-row {
  cursor: pointer;
  user-select: none;
}

/* Clear filter button */
.pmp-clear-filter {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;
}

.pmp-clear-filter:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.pmp-clear-filter.active {
  display: flex;
}

/* Animation for products list */
.pmp-products-list {
  transition: opacity 0.3s ease;
}

.pmp-products-list.filtering {
  opacity: 0.3;
}
      
      .pm-ad-discount-badge {
        position: absolute;
        top: 8px;
        left: 8px;
        background: #ff4444;
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: bold;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      }
      
      .pm-ad-info {
        flex: 1;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 0;
      }
      
      .pm-ad-title {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        text-overflow: ellipsis;
        margin-bottom: 8px;
      }
      
      .pm-ad-price-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pm-ad-current-price {
        font-size: 18px;
        font-weight: 700;
        color: #333;
      }
      
      .pm-ad-old-price {
        font-size: 14px;
        color: #999;
        text-decoration: line-through;
      }
      
      .pm-ad-price-discounted {
        color: #ff4444;
      }
      
      /* Loading states */
      .pmp-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        color: #999;
        font-size: 14px;
      }
      
      .pmp-no-products {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        color: #999;
        font-size: 14px;
        text-align: center;
      }
      
      /* Scrollbar styling */
      .pmp-products-buckets-body::-webkit-scrollbar,
      .pmp-products-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-track,
      .pmp-products-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-thumb,
      .pmp-products-list::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-thumb:hover,
      .pmp-products-list::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

async function renderProductsDashboard() {
  const container = document.getElementById('pmProductsWrapperContainer');
  if (!container) {
    console.log('[PM Products] Container not found');
    return;
  }
  
  try {
    // Use the exported loadCompanyPricingData function
    const data = await window.pmUtils.loadCompanyPricingData();
    if (!data || !data.allData) {
      console.error('[PM Products] No data available');
      container.innerHTML = '<div class="pmp-error">No data available</div>';
      return;
    }
    
    // Find market data (source='all' and q='all')
    const marketData = data.allData.find(row => 
      row.source === 'all' && row.q === 'all'
    );
    
    // Find company data
    const companyName = window.myCompany || 'East Perry';
    const myCompanyData = data.allData.find(row => 
      row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
    );
    
    if (!marketData || !myCompanyData) {
      console.error('[PM Products] Market or company data not found');
      container.innerHTML = '<div class="pmp-error">Data not found</div>';
      return;
    }
    
// Clear container and add the wrapper class
container.innerHTML = '';
container.className = 'pm-products-wrapper-container';

let html = `
  <div class="pmp-left-column">
    <!-- Products Overview Card -->
    <div class="pmp-products-overview-card">
      <div class="products-name-header">${companyName}</div>
      <div class="pmp-rank-container">
        <div class="pmp-section-label">COMPANY RANK</div>
        <div class="pmp-big-rank-box">
          <span id="pmpProductsRankValue">—</span>
        </div>
      </div>
      <div class="pmp-market-container">
        <div class="pmp-section-label">MARKET SHARE</div>
        <div class="pmp-big-market-circle">
          <div class="pmp-market-water-fill" id="pmpProductsMarketFill"></div>
          <span class="pmp-market-value-text" id="pmpProductsMarketValue">—</span>
        </div>
      </div>
    </div>
    
<!-- Products Buckets Distribution -->
<div class="pmp-products-buckets-card">
  <button class="pmp-clear-filter" id="pmpClearFilter" title="Clear filter">×</button>
  <h4>Product Price Buckets</h4>
  <div class="pmp-products-buckets-table">
        <div class="pmp-products-buckets-header">
          <span>Bucket</span>
          <span class="pmp-share-header">Share /<br/>Exp Weighted Share</span>
        </div>
        <div id="pmpProductsBucketsBody" class="pmp-products-buckets-body">
          <!-- Buckets will be populated here -->
        </div>
      </div>
    </div>
  </div>
  
  <div class="pmp-right-column">
    <!-- My Company Products -->
    <div class="pmp-products-mycompany-card">
      <div class="pmp-products-list-header">My Products</div>
      <div id="pmpMyCompanyProductsList" class="pmp-products-list">
        <div class="pmp-loading">Loading products...</div>
      </div>
    </div>
    
    <!-- Competitors Products -->
    <div class="pmp-products-competitors-card">
      <div class="pmp-products-list-header">Competitor Products</div>
      <div id="pmpCompetitorsProductsList" class="pmp-products-list">
        <div class="pmp-loading">Loading competitor products...</div>
      </div>
    </div>
  </div>
`;

container.innerHTML = html;
    
    // Populate the dashboard with data
    await populateProductsDashboard({
      myCompany: myCompanyData,
      market: marketData,
      allData: data.allData
    });
    
    // Load products for both containers
    await loadMyCompanyProducts(companyName);
    await loadCompetitorProducts(companyName);
    
  } catch (error) {
    console.error('[PM Products] Error rendering dashboard:', error);
    container.innerHTML = '<div class="pmp-error">Error loading products data</div>';
  }
}

async function populateProductsDashboard(data) {
  const myCompanyData = data.myCompany;
  const marketData = data.market;
  
  if (!myCompanyData) {
    console.error('[PM Products] No company data available');
    return;
  }
  
  // 1. Update Products Overview Card
  await updateProductsOverviewCard(myCompanyData);
  
  // 2. Update Products Buckets
  updateProductsBuckets(myCompanyData);
}

async function updateProductsOverviewCard(companyData) {
  // Get company rank from company_serp_stats
  try {
    // Get table prefix
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}company_serp_stats`;
    console.log('[PM Products] Looking for stats table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No stats data found');
          db.close();
          return;
        }
        
        // Find the company's overall rank (q=all, location_requested=all, device=all)
        const companyStats = result.data.find(row => 
          row.source === companyData.source &&
          row.q === 'all' &&
          row.location_requested === 'all' &&
          row.device === 'all'
        );
        
        if (companyStats) {
          // Update rank
          const rankValue = companyStats['7d_rank'];
          const rankElement = document.getElementById('pmpProductsRankValue');
          if (rankElement && rankValue) {
            rankElement.textContent = Math.round(parseFloat(rankValue));
          }
          
          // Update market share
          const marketShare = parseFloat(companyStats['7d_market_share']) * 100;
          const marketElement = document.getElementById('pmpProductsMarketValue');
          const marketFill = document.getElementById('pmpProductsMarketFill');
          
          if (marketElement) {
            marketElement.textContent = `${marketShare.toFixed(1)}%`;
          }
          
          if (marketFill) {
            marketFill.style.height = `${Math.min(100, Math.max(0, marketShare * 2))}%`;
          }
        }
        
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting stats data:', getRequest.error);
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
    };
  } catch (error) {
    console.error('[PM Products] Error fetching company stats:', error);
  }
}

function updateProductsBuckets(companyData) {
  const bucketsBody = document.getElementById('pmpProductsBucketsBody');
  if (!bucketsBody) return;
  
  // Check market dominant tier for this company
  let dominantTiers = [];
  if (companyData.market_dominant_tier) {
    let tiers = companyData.market_dominant_tier;
    if (typeof tiers === 'string') {
      dominantTiers = [parseInt(tiers)];
    } else if (!Array.isArray(tiers)) {
      dominantTiers = [tiers];
    } else {
      dominantTiers = tiers;
    }
  }
  
  // Define buckets based on company data
  const buckets = [
    {
      name: 'Ultra Premium',
      key: 'ultra_premium',
      tier: 6,
      range: companyData.price_range?.[5],
      count: companyData.ultra_premium_bucket,
      share: companyData.ultra_premium_bucket_share,
      expw_share: companyData.expw_ultra_premium_bucket_share,
      discounted: companyData.disc_ultra_premium_bucket,
      discount_depth: companyData.disc_depth_ultra_premium_bucket,
      color: '#9C27B0'
    },
    {
      name: 'Premium',
      key: 'premium',
      tier: 5,
      range: companyData.price_range?.[4],
      count: companyData.premium_bucket,
      share: companyData.premium_bucket_share,
      expw_share: companyData.expw_premium_bucket_share,
      discounted: companyData.disc_premium_bucket,
      discount_depth: companyData.disc_depth_premium_bucket,
      color: '#7B1FA2'
    },
    {
      name: 'Upper Mid',
      key: 'upper_mid',
      tier: 4,
      range: companyData.price_range?.[3],
      count: companyData.upper_mid_bucket,
      share: companyData.upper_mid_bucket_share,
      expw_share: companyData.expw_upper_mid_bucket_share,
      discounted: companyData.disc_upper_mid_bucket,
      discount_depth: companyData.disc_depth_upper_mid_bucket,
      color: '#FFC107'
    },
    {
      name: 'Mid Range',
      key: 'mid',
      tier: 3,
      range: companyData.price_range?.[2],
      count: companyData.mid_bucket,
      share: companyData.mid_bucket_share,
      expw_share: companyData.expw_mid_bucket_share,
      discounted: companyData.disc_mid_bucket,
      discount_depth: companyData.disc_depth_mid_bucket,
      color: '#FF9800'
    },
    {
      name: 'Budget',
      key: 'budget',
      tier: 2,
      range: companyData.price_range?.[1],
      count: companyData.budget_bucket,
      share: companyData.budget_bucket_share,
      expw_share: companyData.expw_budget_bucket_share,
      discounted: companyData.disc_budget_bucket,
      discount_depth: companyData.disc_depth_budget_bucket,
      color: '#66BB6A'
    },
    {
      name: 'Ultra Cheap',
      key: 'ultra_cheap',
      tier: 1,
      range: companyData.price_range?.[0],
      count: companyData.ultra_cheap_bucket,
      share: companyData.ultra_cheap_bucket_share,
      expw_share: companyData.expw_ultra_cheap_bucket_share,
      discounted: companyData.disc_ultra_cheap_bucket,
      discount_depth: companyData.disc_depth_ultra_cheap_bucket,
      color: '#4CAF50'
    }
  ];
  
  // Build buckets HTML
  let bucketsHTML = '';
  buckets.forEach(bucket => {
    const count = parseInt(bucket.count) || 0;
    const share = parseFloat(bucket.share) || 0;
    const expwShare = parseFloat(bucket.expw_share) || 0;
    const discounted = parseInt(bucket.discounted) || 0;
    const discountDepth = parseFloat(bucket.discount_depth) || 0;
    const range = bucket.range?.price_range || '—';
    const sharePercent = (share * 100).toFixed(1);
    const expwSharePercent = (expwShare * 100).toFixed(1);
    
    // Check if this company dominates this tier
    const isDominant = dominantTiers.includes(bucket.tier);
    
    bucketsHTML += `
      <div class="pmp-products-bucket-row ${isDominant ? 'is-dominant' : ''}">
        <div class="pmp-bucket-label">
          <div class="pmp-bucket-name">
            <span class="pmp-bucket-indicator" style="background: ${bucket.color}"></span>
            <span>${bucket.name}</span>
            ${isDominant ? '<span style="margin-left: 4px; font-size: 10px;">#1</span>' : ''}
          </div>
          <div class="pmp-bucket-range">${range}</div>
        </div>
        <div class="pmp-products-data">
          <div class="pmp-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
            <span class="pmp-products-count">${count}</span>
            ${discounted > 0 ? `
              <span class="pmp-products-sep">/</span>
              <span class="pmp-discounted-count">${discounted}</span>
            ` : ''}
          </div>
          ${discountDepth > 0 ? 
            `<span class="pmp-discount-badge">${discountDepth.toFixed(1)}%</span>` : 
            '<span class="pmp-discount-badge-empty">—</span>'}
          
          <div class="pmp-dual-bars-container">
            <!-- Regular Share Bar -->
            <div class="pmp-bar-row">
              <span class="pmp-bar-label">Share</span>
              <div class="pmp-tree-bar-container small">
                <div class="pmp-tree-bar" style="width: ${Math.max(1, sharePercent)}%; background: ${bucket.color};"></div>
                <span class="pmp-bar-percent-outside small">${sharePercent}%</span>
              </div>
            </div>
            
            <!-- Exposure Weighted Share Bar -->
            <div class="pmp-bar-row">
              <span class="pmp-bar-label">ExpW</span>
              <div class="pmp-tree-bar-container small">
                <div class="pmp-tree-bar" style="width: ${Math.max(1, expwSharePercent)}%; background: linear-gradient(90deg, ${bucket.color}, ${bucket.color}80);"></div>
                <span class="pmp-bar-percent-outside small">${expwSharePercent}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  bucketsBody.innerHTML = bucketsHTML;

// Add click handlers for bucket filtering
const bucketRows = bucketsBody.querySelectorAll('.pmp-products-bucket-row');
bucketRows.forEach((row, index) => {
row.addEventListener('click', () => {
  // Remove previous selection
  bucketRows.forEach(r => r.classList.remove('selected'));
  
  // Add selection to clicked row
  row.classList.add('selected');
  
  // Set selected bucket (6 - index because buckets are displayed in reverse order)
  selectedBucket = 6 - index;
  console.log('[PM Products] Selected bucket:', selectedBucket, 'Index:', index);
  
  // Show clear button
  const clearBtn = document.getElementById('pmpClearFilter');
  if (clearBtn) clearBtn.classList.add('active');
  
  // Filter products
  filterProducts();
});
});

// Add clear filter handler
const clearBtn = document.getElementById('pmpClearFilter');
if (clearBtn) {
  clearBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    selectedBucket = null;
    bucketRows.forEach(r => r.classList.remove('selected'));
    clearBtn.classList.remove('active');
    filterProducts();
  });
}
}

function filterProducts() {
  const myCompanyList = document.getElementById('pmpMyCompanyProductsList');
  const competitorsList = document.getElementById('pmpCompetitorsProductsList');
  
  // Add filtering animation
  if (myCompanyList) myCompanyList.classList.add('filtering');
  if (competitorsList) competitorsList.classList.add('filtering');
  
  setTimeout(() => {
    // Render filtered products
    renderFilteredProducts('myCompany', myCompanyList);
    renderFilteredProducts('competitors', competitorsList);
    
    // Remove filtering animation
    setTimeout(() => {
      if (myCompanyList) myCompanyList.classList.remove('filtering');
      if (competitorsList) competitorsList.classList.remove('filtering');
    }, 100);
  }, 300);
}

function renderFilteredProducts(type, container) {
  if (!container || !allProductsData[type]) return;
  
  let products = allProductsData[type];
  
// Filter by selected bucket if any
if (selectedBucket !== null) {
  products = products.filter(p => {
    // Convert price_bucket to number for comparison
    const bucketValue = parseInt(p.price_bucket) || 0;
    return bucketValue === selectedBucket;
  });
}
  
  if (products.length === 0) {
    container.innerHTML = `<div class="pmp-no-products">No products in this bucket</div>`;
  } else {
    let html = '';
    products.forEach(product => {
      const title = product.title || 'Untitled Product';
      const priceValue = typeof product.price === 'string' ? 
        parseFloat(product.price.replace(/[^0-9.-]/g, '')) : 
        parseFloat(product.price);
      const oldPriceValue = product.old_price ? 
        (typeof product.old_price === 'string' ? 
          parseFloat(product.old_price.replace(/[^0-9.-]/g, '')) : 
          parseFloat(product.old_price)) : null;
      
      const price = !isNaN(priceValue) ? `$${priceValue.toFixed(2)}` : '—';
      const oldPrice = oldPriceValue && !isNaN(oldPriceValue) ? `$${oldPriceValue.toFixed(2)}` : null;
      const thumbnail = product.thumbnail || '';
      const discountPercent = (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue)) ? 
        Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
      
      // Get bucket info
      const bucketNum = product.price_bucket || 1;
      const bucketNames = ['', 'CHEAP', 'BUDGET', 'MID', 'UPPER', 'PREMIUM', 'ULTRA'];
      const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
      
      html += `
        <div class="pm-ad-details">
          <div class="pm-ad-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
            ${discountPercent > 0 ? `<div class="pm-ad-discount-badge">-${discountPercent}%</div>` : ''}
          </div>
          <div class="pm-ad-info">
            <div class="pm-ad-title">${title}</div>
            <div class="pm-ad-price-container">
              <span class="pm-ad-current-price ${oldPrice ? 'pm-ad-price-discounted' : ''}">${price}</span>
              ${oldPrice ? `<span class="pm-ad-old-price">${oldPrice}</span>` : ''}
            </div>
          </div>
          <div class="pm-ad-bucket-box pm-ad-bucket-${bucketClasses[bucketNum]}">
            ${bucketNames[bucketNum]}
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html;
  }
}

async function loadMyCompanyProducts(companyName) {
  const container = document.getElementById('pmpMyCompanyProductsList');
  if (!container) return;
  
  try {
    // Get table prefix
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}processed`;
    console.log('[PM Products] Loading products from:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        container.innerHTML = '<div class="pmp-no-products">No products found</div>';
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No processed data found');
          container.innerHTML = '<div class="pmp-no-products">No products found</div>';
          db.close();
          return;
        }
        
        // Get unique products for myCompany
        const productMap = new Map();
        
        result.data.forEach(row => {
          if (row.source && row.source.toLowerCase() === companyName.toLowerCase()) {
            const key = `${row.title}_${row.source}`;
            
            // Check if we already have this product
            if (!productMap.has(key)) {
              productMap.set(key, row);
            } else {
              // Prioritize mobile over desktop
              const existing = productMap.get(key);
              if (row.device === 'mobile' && existing.device === 'desktop') {
                productMap.set(key, row);
              }
            }
          }
        });
        
// Convert map to array and sort by price
const products = Array.from(productMap.values()).sort((a, b) => {
  const priceA = parseFloat(a.price) || 0;
  const priceB = parseFloat(b.price) || 0;
  return priceB - priceA; // Sort high to low
});

// Store products data globally
allProductsData.myCompany = products;

if (products.length === 0) {
  container.innerHTML = '<div class="pmp-no-products">No products found</div>';
} else {
  // Render products
  let html = '';
  products.forEach(product => {
    const title = product.title || 'Untitled Product';
    // Handle price that might be a string with currency symbol
    const priceValue = typeof product.price === 'string' ? 
      parseFloat(product.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(product.price);
    const oldPriceValue = product.old_price ? 
      (typeof product.old_price === 'string' ? 
        parseFloat(product.old_price.replace(/[^0-9.-]/g, '')) : 
        parseFloat(product.old_price)) : null;
    
    const price = !isNaN(priceValue) ? `$${priceValue.toFixed(2)}` : '—';
    const oldPrice = oldPriceValue && !isNaN(oldPriceValue) ? `$${oldPriceValue.toFixed(2)}` : null;
    const thumbnail = product.thumbnail || '';
    const discountPercent = (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue)) ? 
      Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
    
    // Get bucket info
    const bucketNum = product.price_bucket || 1;
    const bucketNames = ['', 'CHEAP', 'BUDGET', 'MID', 'UPPER', 'PREMIUM', 'ULTRA'];
    const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
    
    html += `
      <div class="pm-ad-details">
        <div class="pm-ad-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
          ${discountPercent > 0 ? `<div class="pm-ad-discount-badge">-${discountPercent}%</div>` : ''}
        </div>
        <div class="pm-ad-info">
          <div class="pm-ad-title">${title}</div>
          <div class="pm-ad-price-container">
            <span class="pm-ad-current-price ${oldPrice ? 'pm-ad-price-discounted' : ''}">${price}</span>
            ${oldPrice ? `<span class="pm-ad-old-price">${oldPrice}</span>` : ''}
          </div>
        </div>
        <div class="pm-ad-bucket-box pm-ad-bucket-${bucketClasses[bucketNum]}">
          ${bucketNames[bucketNum]}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}       
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting processed data:', getRequest.error);
        container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
      container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
    };
  } catch (error) {
    console.error('[PM Products] Error loading products:', error);
    container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
  }
}

async function loadCompetitorProducts(companyName) {
  const container = document.getElementById('pmpCompetitorsProductsList');
  if (!container) return;
  
  try {
    // Get table prefix
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}processed`;
    console.log('[PM Products] Loading competitor products from:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No processed data found');
          container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
          db.close();
          return;
        }
        
        // Get unique products for competitors (excluding myCompany)
        const productMap = new Map();
        
        result.data.forEach(row => {
          if (row.source && row.source.toLowerCase() !== companyName.toLowerCase() && row.source !== 'all') {
            const key = `${row.title}_${row.source}`;
            
            // Check if we already have this product
            if (!productMap.has(key)) {
              productMap.set(key, row);
            } else {
              // Prioritize mobile over desktop
              const existing = productMap.get(key);
              if (row.device === 'mobile' && existing.device === 'desktop') {
                productMap.set(key, row);
              }
            }
          }
        });
        
// Convert map to array and sort by price (high to low), then limit to top 20
const products = Array.from(productMap.values())
  .sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    return priceB - priceA;
  })
  .slice(0, 20); // Show top 20 competitor products

// Store products data globally (keep all products, not just top 20, for filtering)
allProductsData.competitors = Array.from(productMap.values()).sort((a, b) => {
  const priceA = parseFloat(a.price) || 0;
  const priceB = parseFloat(b.price) || 0;
  return priceB - priceA;
});

if (products.length === 0) {
  container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
} else {
  // Render products
  let html = '';
  products.forEach(product => {
    const title = product.title || 'Untitled Product';
    // Handle price that might be a string with currency symbol
    const priceValue = typeof product.price === 'string' ? 
      parseFloat(product.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(product.price);
    const oldPriceValue = product.old_price ? 
      (typeof product.old_price === 'string' ? 
        parseFloat(product.old_price.replace(/[^0-9.-]/g, '')) : 
        parseFloat(product.old_price)) : null;
    
    const price = !isNaN(priceValue) ? `$${priceValue.toFixed(2)}` : '—';
    const oldPrice = oldPriceValue && !isNaN(oldPriceValue) ? `$${oldPriceValue.toFixed(2)}` : null;
    const thumbnail = product.thumbnail || '';
    const discountPercent = (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue)) ? 
      Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
    
    // Get bucket info
    const bucketNum = product.price_bucket || 1;
    const bucketNames = ['', 'CHEAP', 'BUDGET', 'MID', 'UPPER', 'PREMIUM', 'ULTRA'];
    const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
    
    html += `
      <div class="pm-ad-details">
        <div class="pm-ad-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
          ${discountPercent > 0 ? `<div class="pm-ad-discount-badge">-${discountPercent}%</div>` : ''}
        </div>
        <div class="pm-ad-info">
          <div class="pm-ad-title">${title}</div>
          <div class="pm-ad-price-container">
            <span class="pm-ad-current-price ${oldPrice ? 'pm-ad-price-discounted' : ''}">${price}</span>
            ${oldPrice ? `<span class="pm-ad-old-price">${oldPrice}</span>` : ''}
          </div>
        </div>
        <div class="pm-ad-bucket-box pm-ad-bucket-${bucketClasses[bucketNum]}">
          ${bucketNames[bucketNum]}
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}       
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting processed data:', getRequest.error);
        container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
      container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
    };
  } catch (error) {
    console.error('[PM Products] Error loading competitor products:', error);
    container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
  }
}

// Helper functions
function formatProductsNumber(value, decimals = 0) {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Export functions for use in main price_monitoring.js
window.pmProductsModule = {
  initialize: initializePriceMonitoringProducts,
  renderDashboard: renderProductsDashboard
};

// Auto-initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePriceMonitoringProducts);
} else {
  initializePriceMonitoringProducts();
}
