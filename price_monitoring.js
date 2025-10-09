// price_monitoring.js - Price Monitoring Module
(function() {
  'use strict';
  
  console.log('[PriceMonitoring] Module loading...');

  // Initialize the Price Monitoring module
  window.initializePriceMonitoring = function() {
    console.log('[PriceMonitoring] Initializing...');
    
    // Create the main structure
    createPriceMonitoringStructure();
    
    // Set up event listeners
    setupPriceMonitoringSwitcher();
    
    // Load initial view (Market Overview)
    showPriceMonitoringView('market-overview');
  };

async function loadCompanyPricingData() {
  return new Promise((resolve) => {
    console.log('[PriceMonitoring] Loading company pricing data...');
    
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
    
    const tableName = `${tablePrefix}company_pricing`;
    console.log('[PriceMonitoring] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PriceMonitoring] projectData object store not found');
        db.close();
        resolve(null);
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PriceMonitoring] No data found for table:', tableName);
          db.close();
          resolve(null);
          return;
        }
        
        // Return ALL data, we'll filter when displaying
        console.log('[PriceMonitoring] Total records found:', result.data.length);
        
        db.close();
        resolve({
          allData: result.data
        });
      };
      
      getRequest.onerror = function() {
        console.error('[PriceMonitoring] Error getting data:', getRequest.error);
        db.close();
        resolve(null);
      };
    };
    
    request.onerror = function() {
      console.error('[PriceMonitoring] Failed to open database:', request.error);
      resolve(null);
    };
  });
}

// Helper function to format numbers
function formatNumber(value, decimals = 0) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  
  if (decimals === 0) return Math.round(num).toLocaleString();
  return num.toFixed(decimals);
}

// Helper function to format percentage
function formatPercent(value, includeSign = false) {
  if (value === null || value === undefined || value === '') return '—';
  const num = parseFloat(value);
  if (isNaN(num)) return '—';
  
  const percent = num < 1 ? num * 100 : num;
  const formatted = percent.toFixed(1);
  return includeSign && percent > 0 ? `+${formatted}%` : `${formatted}%`;
}

// Helper function to calculate trend
function calculateTrend(current, previous) {
  if (!current || !previous) return null;
  const curr = parseFloat(current);
  const prev = parseFloat(previous);
  if (isNaN(curr) || isNaN(prev) || prev === 0) return null;
  
  return ((curr - prev) / prev) * 100;
}

// Create the main structure with switcher and containers
function createPriceMonitoringStructure() {
  const priceMonitoringPage = document.getElementById('priceMonitoringPage');
  if (!priceMonitoringPage) {
    console.error('[PriceMonitoring] Price Monitoring Page not found!');
    return;
  }

  // First, create and insert the switcher OUTSIDE and BEFORE the containers
  let switcherWrapper = document.getElementById('pmViewSwitcherWrapper');
  if (!switcherWrapper) {
    // Create the switcher wrapper element
    switcherWrapper = document.createElement('div');
    switcherWrapper.id = 'pmViewSwitcherWrapper';
    switcherWrapper.className = 'pm-view-switcher-wrapper';
    switcherWrapper.style.cssText = `
      margin: 0 0 0 20px;
      display: flex;
      align-items: center;
      gap: 20px;
    `;
    
switcherWrapper.innerHTML = `
  <div id="pmViewSwitcher" class="pm-view-switcher">
    <button id="pmMarketOverview" class="pm-switcher-btn active" data-view="market-overview">
      <span class="pm-btn-icon">📊</span>
      <span>Market Overview</span>
    </button>
    <button id="pmCompanies" class="pm-switcher-btn" data-view="companies">
      <span class="pm-btn-icon">🏢</span>
      <span>Companies</span>
    </button>
    <button id="pmProducts" class="pm-switcher-btn" data-view="products">
      <span class="pm-btn-icon">📦</span>
      <span>Products</span>
    </button>
    <button id="pmPromos" class="pm-switcher-btn" data-view="promos">
      <span class="pm-btn-icon">🏷️</span>
      <span>PROMOs</span>
    </button>
    <button id="pmAlerts" class="pm-switcher-btn" data-view="alerts">
      <span class="pm-btn-icon">🔔</span>
      <span>Alerts & Notifications</span>
    </button>
  </div>
`;
    
    // Insert the switcher at the beginning of priceMonitoringPage
    priceMonitoringPage.insertBefore(switcherWrapper, priceMonitoringPage.firstChild);
  }

  // Remove any existing wrapper divs
  const existingWrappers = priceMonitoringPage.querySelectorAll('.price-monitoring-wrapper');
  existingWrappers.forEach(wrapper => wrapper.remove());

  // Create separate wrapper containers for each view
const wrapperConfigs = [
  { id: 'pmMarketOverviewWrapper', view: 'market-overview', display: 'block' },
  { id: 'pmCompaniesWrapper', view: 'companies', display: 'none' },
  { id: 'pmProductsWrapper', view: 'products', display: 'none' },
  { id: 'pmPromosWrapper', view: 'promos', display: 'none' },
  { id: 'pmAlertsWrapper', view: 'alerts', display: 'none' }
];

  wrapperConfigs.forEach(config => {
    const wrapper = document.createElement('div');
    wrapper.id = config.id;
    wrapper.className = 'price-monitoring-wrapper';
    wrapper.setAttribute('data-view', config.view);
    wrapper.style.cssText = `
      width: 1490px;
      margin: 20px 0 20px 20px;
      background-color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 12px;
      padding: 20px;
      height: 1110px;
      overflow-y: auto;
      display: ${config.display};
    `;
    
    // Add container div inside each wrapper
    const container = document.createElement('div');
    container.id = `${config.id}Container`;
    container.className = 'pm-content-container';
    
    // Add initial content based on view type
if (config.view === 'market-overview') {
  container.innerHTML = `
    <!-- Header Row with Temperature and Key Metrics -->
    <div class="pm-top-section">
      <!-- Market Temperature Card -->
      <div class="pm-temperature-card">
        <div class="pm-card-header">
          <h4>Market Temperature</h4>
          <div class="pm-temp-value-container">
            <span class="pm-temp-value" id="pmTempValue">—</span>
            <span class="pm-temp-max">/100</span>
          </div>
        </div>
        <div class="pm-temp-gauge-container">
          <div class="pm-temp-gauge">
            <div class="pm-temp-fill" id="pmTempFill"></div>
            <div class="pm-temp-marker" id="pmTempMarker"></div>
          </div>
          <div class="pm-temp-labels">
            <span>Frozen</span>
            <span>Cool</span>
            <span>Stable</span>
            <span>Hot</span>
            <span>Flashpoint</span>
          </div>
        </div>
        <div class="pm-temp-status">
          <span class="pm-temp-category" id="pmTempLabel">—</span>
          <span class="pm-temp-desc" id="pmTempDescription">—</span>
        </div>
      </div>
      
      <!-- Price Range Card -->
      <div class="pm-price-range-card">
        <h4>Price Range</h4>
        
        <!-- Market Prices -->
        <div class="pm-range-row market">
          <span class="pm-range-label">Market</span>
          <div class="pm-range-values">
            <div class="pm-range-item">
              <span class="pm-range-value" id="pmMarketMinPrice">$—</span>
              <span class="pm-range-title">MIN</span>
            </div>
            <div class="pm-range-item median">
              <span class="pm-range-value" id="pmMarketMedianPrice">$—</span>
              <span class="pm-range-title">MEDIAN</span>
            </div>
            <div class="pm-range-item">
              <span class="pm-range-value" id="pmMarketMaxPrice">$—</span>
              <span class="pm-range-title">MAX</span>
            </div>
          </div>
        </div>
        
        <!-- Company Prices -->
        <div class="pm-range-row company">
          <span class="pm-range-label" id="pmCompanyRangeLabel">Company</span>
          <div class="pm-range-values">
            <div class="pm-range-item">
              <span class="pm-range-value" id="pmCompanyMinPrice">$—</span>
              <span class="pm-range-title">MIN</span>
            </div>
            <div class="pm-range-item median">
              <span class="pm-range-value" id="pmCompanyMedianPrice">$—</span>
              <span class="pm-range-title">MEDIAN</span>
            </div>
            <div class="pm-range-item">
              <span class="pm-range-value" id="pmCompanyMaxPrice">$—</span>
              <span class="pm-range-title">MAX</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="pm-quick-stats">
        <div class="pm-stat-item">
          <div class="pm-stat-info">
            <div class="pm-stat-grid">
              <div class="pm-stat-cell">
                <span class="pm-stat-val" id="pmTotalProducts">—</span>
                <span class="pm-stat-lbl">Products</span>
              </div>
              <div class="pm-stat-cell">
                <span class="pm-stat-val" id="pmDiscountedProducts">—</span>
                <span class="pm-stat-lbl">Discounted</span>
              </div>
              <div class="pm-stat-cell">
                <span class="pm-stat-val" id="pmDiscountRate">—</span>
                <span class="pm-stat-lbl">Discount Rate</span>
              </div>
              <div class="pm-stat-cell">
                <span class="pm-stat-val" id="pmAvgDiscount">—</span>
                <span class="pm-stat-lbl">Avg Discount</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pm-stat-item">
          <div class="pm-stat-info">
            <div class="pm-stat-main">
              <span class="pm-stat-val" id="pmActiveWaves">—</span>
              <span class="pm-stat-lbl">Active Promo Waves</span>
            </div>
            <div class="pm-stat-secondary">
              <span class="pm-stat-subtitle" id="pmWaveDiscount">—</span>
              <span class="pm-stat-extra" id="pmWaveCompanies">—</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="pm-main-grid">
      <!-- Left Column -->
      <div class="pm-left-column">
        <!-- Price Buckets Distribution -->
        <div class="pm-buckets-card">
          <h4>Price Buckets Distribution</h4>
          <div class="pm-buckets-table">
            <div class="pm-buckets-header">
              <span>Bucket</span>
              <span>Dominant</span>
              <span style="text-align: right">Market</span>
              <span></span>
              <span id="pmCompanyHeaderName">Company</span>
            </div>
            <div id="pmBucketsBody" class="pm-buckets-body">
              <!-- Buckets will be populated here -->
            </div>
          </div>
        </div>

        <!-- Metrics Row -->
        <div class="pm-metrics-row">
          <!-- Volatility Card -->
          <div class="pm-metric-mini">
            <h5>Price Volatility</h5>
            <div class="pm-metric-display">
              <span class="pm-metric-val" id="pmVolatilityValue">—</span>
              <span class="pm-metric-status" id="pmVolatilityLabel">—</span>
            </div>
            <div class="pm-metric-bar">
              <div class="pm-metric-fill" id="pmVolatilityBar"></div>
            </div>
          </div>

          <!-- Velocity Card -->
          <div class="pm-metric-mini">
            <h5>Price Change Velocity</h5>
            <div class="pm-metric-display">
              <span class="pm-metric-val" id="pmVelocityValue">—</span>
              <span class="pm-metric-status" id="pmVelocityLabel">—</span>
            </div>
            <div class="pm-metric-bar">
              <div class="pm-metric-fill" id="pmVelocityBar"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right Column -->
      <div class="pm-right-column">
        <!-- Products Trend Chart -->
        <div class="pm-chart-card">
          <div class="pm-chart-header">
            <h4>Products & Discounts Trend</h4>
            <div class="pm-chart-legend">
              <span class="pm-legend-item" style="--color: #2196F3">Total Products</span>
              <span class="pm-legend-item" style="--color: #FF9800">Discounted</span>
              <span class="pm-legend-item" style="--color: #4CAF50">Discount Depth</span>
            </div>
          </div>
          <div class="pm-chart-container">
            <canvas id="pmProductsCanvas"></canvas>
          </div>
          
          <!-- Promo Waves Timeline -->
          <div class="pm-promowaves-container">
            <div class="pm-promowaves-header">
              <h5>Active Promo Waves</h5>
              <span class="pm-promowaves-count" id="pmPromoWavesCount">0 Active</span>
            </div>
            <div class="pm-promowaves-chart" id="pmPromoWavesChart">
              <!-- Timeline will be rendered here -->
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
} else if (config.view === 'companies') {
      container.innerHTML = `
        <div class="pm-header-section">
          <div class="pm-title-row">
            <h2 class="pm-main-title">Companies Analysis</h2>
            <div class="pm-last-updated">Last updated: <span>-</span></div>
          </div>
        </div>
        <div class="pm-placeholder-content">Companies content will be loaded here</div>
      `;
} else if (config.view === 'products') {
  container.innerHTML = `
    <div id="pmProductsWrapperContainer" class="pm-products-wrapper-container">
      <!-- Products content will be loaded here -->
    </div>
  `;
} else if (config.view === 'alerts') {
  container.innerHTML = `
    <div id="pmAlertsWrapperContainer" class="pm-alerts-wrapper-container">
      <!-- Alerts content will be loaded by external module -->
    </div>
  `;
} else if (config.view === 'promos') {
  container.innerHTML = `
    <div id="pmPromosContainer" class="pm-promos-container">
      <!-- Promos content will be loaded by external module -->
    </div>
  `;
}
    
    wrapper.appendChild(container);
    priceMonitoringPage.appendChild(wrapper);
  });

  // Add CSS styles
  addPriceMonitoringStyles();
}

async function populateMarketOverview() {
  const data = await loadCompanyPricingData();
  if (!data || !data.allData) {
    console.error('[PriceMonitoring] No data available');
    return;
  }
  
  // Filter for market data (source='all' and q='all')
  const market = data.allData.find(row => 
    row.source === 'all' && row.q === 'all'
  );
  
  // Find company data
  const companyName = window.myCompany || 'East Perry'; // Use your company name
  const companyData = data.allData.find(row => 
    row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
  );
  
  if (!market) {
    console.error('[PriceMonitoring] No market data found');
    return;
  }
  
  console.log('[PriceMonitoring] Market data found:', market);
  console.log('[PriceMonitoring] Company data found:', !!companyData);
  
// Update last updated time (if element exists)
const lastUpdatedEl = document.getElementById('pmLastUpdated');
if (lastUpdatedEl) {
  lastUpdatedEl.textContent = new Date().toLocaleString();
}
  
  // 1. Market Temperature
  const temp = parseFloat(market.avg_rating) || 0;
  const tempValue = document.getElementById('pmTempValue');
  const tempFill = document.getElementById('pmTempFill');
  const tempLabel = document.getElementById('pmTempLabel');
  const tempDesc = document.getElementById('pmTempDescription');
  
  if (tempValue) tempValue.textContent = temp.toFixed(1);
  
  let tempCategory, tempColor, tempDescription;
  if (temp <= 15) {
    tempCategory = 'Frozen';
    tempColor = '#0066cc';
    tempDescription = 'Promos rare, prices static';
  } else if (temp <= 30) {
    tempCategory = 'Cool';
    tempColor = '#3399ff';
    tempDescription = 'Low price activity';
  } else if (temp <= 45) {
    tempCategory = 'Stable-Cool';
    tempColor = '#66ccff';
    tempDescription = 'Balanced market conditions';
  } else if (temp <= 60) {
    tempCategory = 'Stable-Warm';
    tempColor = '#ffcc00';
    tempDescription = 'Normal market activity';
  } else if (temp <= 75) {
    tempCategory = 'Hot';
    tempColor = '#ff9900';
    tempDescription = 'Elevated price changes';
  } else if (temp <= 90) {
    tempCategory = 'Boiling';
    tempColor = '#ff6600';
    tempDescription = 'High volatility';
  } else {
    tempCategory = 'Flashpoint';
    tempColor = '#ff0000';
    tempDescription = 'Extreme market dynamics';
  }
  
if (tempFill) {
  tempFill.style.width = `${temp}%`;
}

const tempMarker = document.getElementById('pmTempMarker');
if (tempMarker) {
  tempMarker.style.left = `calc(${temp}% - 4px)`;
}
const tempGauge = document.querySelector('.pm-temp-gauge');
if (tempGauge) {
  const unreachedWidth = 100 - temp;
  tempGauge.style.setProperty('--unreached-width', `${unreachedWidth}%`);
}
  if (tempLabel) tempLabel.textContent = tempCategory;
  if (tempDesc) tempDesc.textContent = tempDescription;
  
// 2. Price Range - Updated to show both Market and Company
// Market prices
document.getElementById('pmMarketMinPrice').textContent = `$${formatNumber(market.cheapest_product, 0)}`;
document.getElementById('pmMarketMedianPrice').textContent = `$${formatNumber(market.median_price, 0)}`;
document.getElementById('pmMarketMaxPrice').textContent = `$${formatNumber(market.most_expensive_product, 0)}`;

// Update company label with actual company name
const companyRangeLabel = document.getElementById('pmCompanyRangeLabel');
if (companyRangeLabel) {
  companyRangeLabel.textContent = companyName || 'Company';
}

// Company prices
if (companyData) {
  document.getElementById('pmCompanyMinPrice').textContent = `$${formatNumber(companyData.cheapest_product, 0)}`;
  document.getElementById('pmCompanyMedianPrice').textContent = `$${formatNumber(companyData.median_price, 0)}`;
  document.getElementById('pmCompanyMaxPrice').textContent = `$${formatNumber(companyData.most_expensive_product, 0)}`;
} else {
  document.getElementById('pmCompanyMinPrice').textContent = '$—';
  document.getElementById('pmCompanyMedianPrice').textContent = '$—';
  document.getElementById('pmCompanyMaxPrice').textContent = '$—';
}
  
// 3. Price Buckets with Market and Company comparison
// First, extract dominant companies data
const dominantCompanies = {};
data.allData.forEach(row => {
  if (row.market_dominant_tier && row.q === 'all' && row.source !== 'all') {
    // Parse market_dominant_tier - it could be an array or a single value
    let tiers = row.market_dominant_tier;
    if (typeof tiers === 'string') {
      tiers = [parseInt(tiers)];
    } else if (!Array.isArray(tiers)) {
      tiers = [tiers];
    }
    
    tiers.forEach(tier => {
      if (tier >= 1 && tier <= 6) {
        if (!dominantCompanies[tier]) {
          dominantCompanies[tier] = [];
        }
        dominantCompanies[tier].push(row.source);
      }
    });
  }
});

// Map tier numbers to bucket indices (reversed because display is reversed)
const tierToBucketMap = {
  6: 0, // Ultra Premium
  5: 1, // Premium  
  4: 2, // Upper Mid
  3: 3, // Mid Range
  2: 4, // Budget
  1: 5  // Ultra Cheap
};

const buckets = [
  { 
    name: 'Ultra Cheap',
    tier: 1,
    range: market.price_range?.[0],
    market: {
      count: market.ultra_cheap_bucket,
      share: market.ultra_cheap_bucket_share,
      discounted: market.disc_ultra_cheap_bucket,
      discount_depth: market.disc_depth_ultra_cheap_bucket
    },
    company: companyData ? {
      count: companyData.ultra_cheap_bucket,
      share: companyData.ultra_cheap_bucket_share,
      discounted: companyData.disc_ultra_cheap_bucket,
      discount_depth: companyData.disc_depth_ultra_cheap_bucket
    } : null,
    color: '#4CAF50'
  },
  { 
    name: 'Budget',
    tier: 2,
    range: market.price_range?.[1],
    market: {
      count: market.budget_bucket,
      share: market.budget_bucket_share,
      discounted: market.disc_budget_bucket,
      discount_depth: market.disc_depth_budget_bucket
    },
    company: companyData ? {
      count: companyData.budget_bucket,
      share: companyData.budget_bucket_share,
      discounted: companyData.disc_budget_bucket,
      discount_depth: companyData.disc_depth_budget_bucket
    } : null,
    color: '#8BC34A'
  },
  { 
    name: 'Mid Range',
    tier: 3,
    range: market.price_range?.[2],
    market: {
      count: market.mid_bucket,
      share: market.mid_bucket_share,
      discounted: market.disc_mid_bucket,
      discount_depth: market.disc_depth_mid_bucket
    },
    company: companyData ? {
      count: companyData.mid_bucket,
      share: companyData.mid_bucket_share,
      discounted: companyData.disc_mid_bucket,
      discount_depth: companyData.disc_depth_mid_bucket
    } : null,
    color: '#FFC107'
  },
  { 
    name: 'Upper Mid',
    tier: 4,
    range: market.price_range?.[3],
    market: {
      count: market.upper_mid_bucket,
      share: market.upper_mid_bucket_share,
      discounted: market.disc_upper_mid_bucket,
      discount_depth: market.disc_depth_upper_mid_bucket
    },
    company: companyData ? {
      count: companyData.upper_mid_bucket,
      share: companyData.upper_mid_bucket_share,
      discounted: companyData.disc_upper_mid_bucket,
      discount_depth: companyData.disc_depth_upper_mid_bucket
    } : null,
    color: '#FF9800'
  },
  { 
    name: 'Premium',
    tier: 5,
    range: market.price_range?.[4],
    market: {
      count: market.premium_bucket,
      share: market.premium_bucket_share,
      discounted: market.disc_premium_bucket,
      discount_depth: market.disc_depth_premium_bucket
    },
    company: companyData ? {
      count: companyData.premium_bucket,
      share: companyData.premium_bucket_share,
      discounted: companyData.disc_premium_bucket,
      discount_depth: companyData.disc_depth_premium_bucket
    } : null,
    color: '#FF5722'
  },
  { 
    name: 'Ultra Premium',
    tier: 6,
    range: market.price_range?.[5],
    market: {
      count: market.ultra_premium_bucket,
      share: market.ultra_premium_bucket_share,
      discounted: market.disc_ultra_premium_bucket,
      discount_depth: market.disc_depth_ultra_premium_bucket
    },
    company: companyData ? {
      count: companyData.ultra_premium_bucket,
      share: companyData.ultra_premium_bucket_share,
      discounted: companyData.disc_ultra_premium_bucket,
      discount_depth: companyData.disc_depth_ultra_premium_bucket
    } : null,
    color: '#9C27B0'
  }
];

// Replace the existing bucket table structure
const bucketsBody = document.getElementById('pmBucketsBody');
if (bucketsBody) {
  // Update the header with dynamic company name
  const companyHeader = document.getElementById('pmCompanyHeaderName');
  if (companyHeader) {
    companyHeader.textContent = companyName || 'Company';
  }
  
  // REVERSE the buckets array to show Ultra Premium first
  bucketsBody.innerHTML = buckets.slice().reverse().map(bucket => {
    let range = '—';
    if (bucket.range && bucket.range.price_range) {
      range = bucket.range.price_range;
    }
    
    // Get dominant company for this tier
    const dominantList = dominantCompanies[bucket.tier] || [];
    let dominantDisplay = '—';
    let isDominantMyCompany = false;
    
    if (dominantList.length > 0) {
      // Check if myCompany is in the list
      isDominantMyCompany = dominantList.some(company => 
        company.toLowerCase() === companyName.toLowerCase()
      );
      
      // If multiple companies, show first with count
      if (dominantList.length > 1) {
        dominantDisplay = `${dominantList[0].substring(0, 12)}... +${dominantList.length - 1}`;
      } else {
        // Truncate long names
        dominantDisplay = dominantList[0].length > 15 ? 
          dominantList[0].substring(0, 12) + '...' : 
          dominantList[0];
      }
    }
    
    // Market data
    const marketSharePercent = parseFloat(bucket.market.share || 0) * 100;
    const marketDiscounted = parseInt(bucket.market.discounted) || 0;
    const marketDiscountDepth = parseFloat(bucket.market.discount_depth) || 0;
    const marketProducts = parseInt(bucket.market.count) || 0;
    
    // Company data
    const companySharePercent = bucket.company ? parseFloat(bucket.company.share || 0) * 100 : 0;
    const companyDiscounted = bucket.company ? parseInt(bucket.company.discounted) || 0 : 0;
    const companyDiscountDepth = bucket.company ? parseFloat(bucket.company.discount_depth) || 0 : 0;
    const companyProducts = bucket.company ? parseInt(bucket.company.count) || 0 : 0;
    
    return `
      <div class="pm-bucket-row-tree">
        <!-- Bucket Name & Range -->
        <div class="pm-bucket-label">
          <div class="pm-bucket-name">
            <span class="pm-bucket-indicator" style="background: ${bucket.color}"></span>
            <span>${bucket.name}</span>
          </div>
          <div class="pm-bucket-range">${range}</div>
        </div>
        
        <!-- Dominant Company Column -->
        <div class="pm-bucket-dominant ${isDominantMyCompany ? 'is-my-company' : ''}" 
             title="${dominantList.join(', ')}">
          ${isDominantMyCompany ? 
            `<span class="pm-dominant-badge">${dominantDisplay}</span>` : 
            dominantDisplay}
        </div>
        
        <!-- Market Side (LEFT) -->
        <div class="pm-tree-market">
          <div class="pm-tree-metrics">
            <div class="pm-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
              <span class="pm-products-count">${marketProducts}</span>
              <span class="pm-products-sep">/</span>
              <span class="pm-discounted-count">${marketDiscounted}</span>
            </div>
            ${marketDiscountDepth > 0 ? 
              `<span class="pm-discount-badge">${marketDiscountDepth.toFixed(1)}%</span>` : 
              '<span class="pm-discount-badge-empty">—</span>'}
          </div>
          <div class="pm-tree-bar-container left">
            ${marketSharePercent > 0 ? 
              `<div class="pm-tree-bar" style="width: ${marketSharePercent}%; background: ${bucket.color};"></div>` : 
              ''}
            <span class="pm-bar-percent-outside left">${marketSharePercent.toFixed(1)}%</span>
          </div>
        </div>
        
        <!-- Center Divider -->
        <div class="pm-tree-center"></div>
        
        <!-- Company Side (RIGHT) -->
        <div class="pm-tree-company">
          <div class="pm-tree-bar-container right">
            ${companySharePercent > 0 ? 
              `<div class="pm-tree-bar" style="width: ${companySharePercent}%; background: ${bucket.color};"></div>` : 
              ''}
            <span class="pm-bar-percent-outside right">${companySharePercent.toFixed(1)}%</span>
          </div>
          <div class="pm-tree-metrics">
            <div class="pm-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
              <span class="pm-products-count">${companyProducts}</span>
              <span class="pm-products-sep">/</span>
              <span class="pm-discounted-count">${companyDiscounted}</span>
            </div>
            ${companyDiscountDepth > 0 ? 
              `<span class="pm-discount-badge">${companyDiscountDepth.toFixed(1)}%</span>` : 
              '<span class="pm-discount-badge-empty">—</span>'}
          </div>
        </div>
      </div>
    `;
  }).join('');
}
  
  // 4. Products Stats
  const totalProducts = market.unique_total_products;
  const discountedProducts = market.unique_discounted_products;
  const discountRate = market.unique_pr_discounted_products;
  const avgDiscount = market.unique_discount_depth;
  
  const prevTotal = market.prev_unique_total_products;
  const prevDiscounted = market.prev_unique_discounted_products;
  const prevRate = market.prev_unique_pr_discounted_products;
  const prevAvgDiscount = market.prev_unique_discount_depth;
  
// Populate the combined stats container
document.getElementById('pmTotalProducts').textContent = formatNumber(totalProducts);
document.getElementById('pmDiscountedProducts').textContent = formatNumber(discountedProducts);
document.getElementById('pmDiscountRate').textContent = formatPercent(discountRate);
document.getElementById('pmAvgDiscount').textContent = formatPercent(avgDiscount);
  
  // Add trend badges
  updateTrendBadge('pmTotalProductsTrend', totalProducts, prevTotal);
  updateTrendBadge('pmDiscountedProductsTrend', discountedProducts, prevDiscounted);
  updateTrendBadge('pmDiscountRateTrend', discountRate, prevRate);
  updateTrendBadge('pmAvgDiscountTrend', avgDiscount, prevAvgDiscount);
  
  // 5. Create Chart
  if (market.historical_data && window.Chart) {
    createProductsChart(market.historical_data);
  }
  
  // 6. Volatility
  const volatility = parseFloat(market.volatility) || 0;
  document.getElementById('pmVolatilityValue').textContent = volatility.toFixed(3);
  
  let volatilityLabel;
  if (volatility < 0.10) volatilityLabel = 'Very Tight';
  else if (volatility < 0.25) volatilityLabel = 'Tight';
  else if (volatility < 0.50) volatilityLabel = 'Moderate';
  else if (volatility < 1.00) volatilityLabel = 'High';
  else volatilityLabel = 'Extreme';
  
  document.getElementById('pmVolatilityLabel').textContent = volatilityLabel;
  
const volatilityBar = document.getElementById('pmVolatilityBar');
if (volatilityBar) {
  const position = Math.min(100, volatility * 100);
  volatilityBar.style.width = `${position}%`;
}
  
  // 7. Price Change Velocity
  const velocity = parseFloat(market.price_change_velocity) || 0;
  document.getElementById('pmVelocityValue').textContent = velocity.toFixed(2);
  
  let velocityLabel;
  if (velocity < 0.20) velocityLabel = 'Static';
  else if (velocity < 0.50) velocityLabel = 'Low Churn';
  else if (velocity < 0.90) velocityLabel = 'Moderate';
  else if (velocity < 1.40) velocityLabel = 'High';
  else if (velocity < 2.50) velocityLabel = 'Very High';
  else velocityLabel = 'Hyper-fluid';
  
  document.getElementById('pmVelocityLabel').textContent = velocityLabel;
  
const velocityBar = document.getElementById('pmVelocityBar');
if (velocityBar) {
  const position = Math.min(100, (velocity / 3) * 100);
  velocityBar.style.width = `${position}%`;
}
  
const activeWavesCount = parseInt(market.promo_wave_length) || 0;
const avgWaveDiscount = parseFloat(market.promo_wave_discount_depth) || 0;

document.getElementById('pmActiveWaves').textContent = formatNumber(activeWavesCount);
document.getElementById('pmWaveDiscount').textContent = 
  avgWaveDiscount > 0 ? `Avg depth: ${avgWaveDiscount.toFixed(1)}%` : 'No active waves';

// Count companies with active waves
const companiesWithWaves = data.allData.filter(row => 
  row.source !== 'all' && 
  row.q === 'all' && 
  (row.promo_wave === true || row.promo_wave === 'true')
).length;

document.getElementById('pmWaveCompanies').textContent = 
  companiesWithWaves > 0 ? `${companiesWithWaves} companies active` : '';

// 9. Create Promo Waves Chart
createPromoWavesChart();
  
}

// Helper function to update trend badges
function updateTrendBadge(elementId, current, previous) {
  const badge = document.getElementById(elementId);
  if (!badge) return;
  
  const trend = calculateTrend(current, previous);
  if (trend === null) {
    badge.style.display = 'none';
    return;
  }
  
  const isPositive = trend > 0;
  const arrow = isPositive ? '↑' : trend < 0 ? '↓' : '—';
  const color = isPositive ? '#4CAF50' : trend < 0 ? '#f44336' : '#999';
  
  badge.innerHTML = `<span style="color: ${color}">${arrow} ${Math.abs(trend).toFixed(1)}%</span>`;
  badge.style.display = 'inline-block';
}

// Function to create products area chart (like selectedCompanyMarketShareChart)
function createProductsChart(historicalData) {
  const chartEl = document.getElementById('pmProductsCanvas');
  if (!chartEl || !historicalData || historicalData.length === 0) return;
  
  // Destroy existing chart if any
  if (window.pmProductsChartInstance) {
    window.pmProductsChartInstance.destroy();
    window.pmProductsChartInstance = null;
  }
  
  // Convert canvas to div for ApexCharts
  const container = chartEl.parentElement;
  container.innerHTML = '<div id="pmProductsChart"></div>';
  
  // Force layout recalculation before creating chart
  setTimeout(() => {
    // Prepare data
    const chartData = historicalData.slice(-30).map(d => ({
      x: d.date.value,
      total: parseFloat(d.total_products) || 0,
      discounted: parseFloat(d.discounted_products) || 0,
      rate: parseFloat(d.pr_discounted_products) * 100 || 0
    }));
    
    const series = [
      {
        name: 'Total Products',
        data: chartData.map(d => ({ x: d.x, y: d.total }))
      },
      {
        name: 'Discounted Products',
        data: chartData.map(d => ({ x: d.x, y: d.discounted }))
      },
      {
        name: 'Discount Rate %',
        data: chartData.map(d => ({ x: d.x, y: d.rate }))
      }
    ];
    
    const options = {
      series: series,
      chart: {
        type: 'area',
        stacked: false,
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
    dataLabels: {
      enabled: false
    },
    stroke: {
      curve: 'smooth',
      width: 2
    },
    fill: {
      type: 'gradient',
      gradient: { 
        shadeIntensity: 1,
        opacityFrom: 0.75, 
        opacityTo: 0.1,
        stops: [0, 90, 100]
      }
    },
    colors: ['#2196F3', '#FF9800', '#4CAF50'],
    xaxis: {
      type: 'datetime',
      labels: { 
        datetimeFormatter: {
          year: 'yyyy',
          month: 'MMM',
          day: 'dd'
        },
        style: {
          fontSize: '10px'
        }
      }
    },
    yaxis: [
      {
        title: { text: 'Product Count', style: { fontSize: '11px' } },
        labels: { 
          formatter: val => Math.round(val),
          style: { fontSize: '10px' }
        }
      },
      {
        opposite: true,
        title: { text: 'Discount %', style: { fontSize: '11px' } },
        labels: { 
          formatter: val => val.toFixed(1) + '%',
          style: { fontSize: '10px' }
        },
        max: 100
      }
    ],
    grid: { 
      borderColor: '#e7e7e7',
      row: {
        colors: ['#f3f3f3', 'transparent'],
        opacity: 0.5
      }
    },
    legend: { 
show: false
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: { format: 'dd MMM yyyy' }
    }
  };
  
    window.pmProductsChartInstance = new ApexCharts(
      document.getElementById('pmProductsChart'), 
      options
    );
    window.pmProductsChartInstance.render();
  }, 100); // Small delay to ensure layout is calculated
}

// Function to create promo waves timeline chart
async function createPromoWavesChart() {
  const data = await loadCompanyPricingData();
  if (!data || !data.allData) return;
  
  // Filter for active promo waves
  const promoWaves = data.allData.filter(row => 
    row.source !== 'all' && 
    row.q === 'all' && 
    (row.promo_wave === true || row.promo_wave === 'true')
  );
  
  console.log('[PriceMonitoring] Active promo waves:', promoWaves.length);
  
  // Update count
  const countEl = document.getElementById('pmPromoWavesCount');
  if (countEl) {
    countEl.textContent = `${promoWaves.length} Active`;
  }
  
  const container = document.getElementById('pmPromoWavesChart');
  if (!container || promoWaves.length === 0) {
    if (container) {
      container.innerHTML = '<div class="pm-no-promowaves">No active promo waves</div>';
    }
    return;
  }
  
// Prepare and sort data by discount depth (highest first)
const waveData = promoWaves.map(wave => {
  const currentDiscount = parseFloat(wave.promo_wave_discount_depth) || 0;
  
  // Calculate 7-day average discount depth from historical data
  let trend = null;
  let trendValue = 0;
  
  if (wave.historical_data && wave.historical_data.length > 0) {
    // Get last 7 days of data
    const last7Days = wave.historical_data.slice(-7);
    
    // Calculate average, excluding null values
    const validDiscounts = last7Days
      .map(d => parseFloat(d.discount_depth))
      .filter(d => !isNaN(d) && d !== null && d !== 0);
    
    if (validDiscounts.length > 0) {
      const avg7Days = validDiscounts.reduce((sum, val) => sum + val, 0) / validDiscounts.length;
      trendValue = currentDiscount - avg7Days;
      
      if (Math.abs(trendValue) > 0.1) { // Only show trend if difference > 0.1%
        trend = trendValue > 0 ? 'up' : 'down';
      }
    }
  }
  
  return {
    company: wave.source,
    waveLength: parseInt(wave.promo_wave_length) || 0,
    discountDepth: currentDiscount,
    discountedPercent: parseFloat(wave.promo_wave_pr_discounted_products) * 100 || 0,
    trend: trend,
    trendValue: Math.abs(trendValue)
  };
}).sort((a, b) => b.discountDepth - a.discountDepth);
  
  // Calculate the maximum discount depth for scaling
  const maxDiscount = Math.max(...waveData.map(d => d.discountDepth));
  
  // Store data for expand/collapse functionality
  window.pmPromoWavesData = waveData;
  window.pmPromoWavesExpanded = false;
  
  // Initial render with limited data
  renderPromoWavesList(waveData.slice(0, 10), maxDiscount, waveData.length > 10);
}

// New function to render the promo waves list
function renderPromoWavesList(displayData, hasMore) {
  const container = document.getElementById('pmPromoWavesChart');
  if (!container) return;
  
  // Fixed x-axis scale at 100%
  const fixedMax = 100;
  const scaleSteps = [0, 25, 50, 75, 100];
  
  let xAxisHtml = '<div class="pm-waves-xaxis">';
  scaleSteps.forEach(step => {
    const position = (step / fixedMax) * 100;
    xAxisHtml += `<span class="pm-xaxis-tick" style="left: ${position}%">${step.toFixed(0)}%</span>`;
  });
  xAxisHtml += '</div>';
  
  // Create the list with x-axis
  let html = `
    <div class="pm-waves-wrapper">
      <div class="pm-waves-xaxis-label">Discount Depth</div>
      ${xAxisHtml}
      <div class="pm-waves-list">
  `;
  
  displayData.forEach((wave) => {
    // Scale bars to the rounded max for better visual alignment
    const barWidth = Math.max((wave.discountDepth / fixedMax) * 100, 1); // Ensure minimum visibility
    
html += `
  <div class="pm-wave-item">
    <div class="pm-wave-company" title="${wave.company}">${wave.company}</div>
    <div class="pm-wave-bar-container">
      <div class="pm-wave-bar-fill" style="width: ${barWidth}%">
        <span class="pm-wave-discount">${wave.discountDepth.toFixed(1)}%</span>
      </div>
      ${wave.trend ? `
        <div class="pm-wave-trend ${wave.trend}">
          <span class="pm-trend-arrow">${wave.trend === 'up' ? '↑' : '↓'}</span>
          <span class="pm-trend-value">${wave.trendValue.toFixed(1)}%</span>
        </div>
      ` : ''}
    </div>
    <div class="pm-wave-metrics-outside">
      <span class="pm-wave-products">${wave.discountedPercent.toFixed(1)}% products</span>
      <span class="pm-wave-separator">|</span>
      <span class="pm-wave-duration">${wave.waveLength}d</span>
    </div>
  </div>
`;
  });
  
  html += '</div>'; // Close pm-waves-list
  
  // Add expand/collapse button if there are more items
  if (hasMore) {
    const totalWaves = window.pmPromoWavesData ? window.pmPromoWavesData.length : 0;
    const isExpanded = window.pmPromoWavesExpanded;
    const buttonText = isExpanded ? 
      `Show less ↑` : 
      `+${totalWaves - 10} more waves ↓`;
    
    html += `
      <div class="pm-waves-more" onclick="togglePromoWaves()">
        ${buttonText}
      </div>
    `;
  }
  
  html += '</div>'; // Close pm-waves-wrapper
  
  container.innerHTML = html;
}

// New function to toggle expand/collapse
window.togglePromoWaves = function() {
  if (!window.pmPromoWavesData) return;
  
  window.pmPromoWavesExpanded = !window.pmPromoWavesExpanded;
  
  const displayData = window.pmPromoWavesExpanded ? 
    window.pmPromoWavesData : 
    window.pmPromoWavesData.slice(0, 10);
  
  renderPromoWavesList(displayData, window.pmPromoWavesData.length > 10);
}

function addPriceMonitoringStyles() {
  if (document.getElementById('pmStyles')) return;
  
  const styles = `
    <style id="pmStyles">
    /* Direct heading styles for price monitoring */
.price-monitoring-wrapper h4 {
  margin: 0 0 12px 0;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.price-monitoring-wrapper h5 {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  color: #4a4a4a;
}

      /* Section Labels matching selectedCompanyStats */
      .section-label {
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 10px;
      }

/* Top Section - Add proper sizing */
.pm-top-section {
  display: grid;
  grid-template-columns: 420px 320px 1fr;
  gap: 10px;
  margin-bottom: 10px;
  width: 100%;
}

      /* Temperature Card - Enhanced styling */
      .pm-temperature-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
      }

      .pm-temperature-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #0066cc, #ff0000);
      }

      .pm-card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .pm-temp-value {
        font-size: 32px;
        font-weight: bold;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }

      .pm-temp-value-container {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.pm-temp-max {
  font-size: 16px;
  color: #999;
  font-weight: normal;
}

.pm-temp-gauge::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  height: 100%;
  width: var(--unreached-width, 50%);
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0 12px 12px 0;
  pointer-events: none;
  transition: width 0.5s ease;
}

      .pm-temp-gauge-container {
        position: relative;
        margin: 20px 0;
      }

      .pm-temp-gauge {
        height: 32px;
        background: linear-gradient(90deg, 
          #0066cc 0%, #3399ff 20%, #66ccff 35%, 
          #ffcc00 50%, #ff9900 65%, #ff6600 80%, #ff0000 100%);
        border-radius: 16px;
        position: relative;
        overflow: visible;
        box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
      }

      .pm-temp-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        background: rgba(0,0,0,0.15);
        border-radius: 16px;
        pointer-events: none;
      }

      .pm-temp-marker {
        position: absolute;
        top: -6px;
        width: 6px;
        height: 44px;
        background: white;
        border: 3px solid #333;
        border-radius: 6px;
        transition: left 0.5s ease;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
      }

      .pm-temp-labels {
        display: flex;
        justify-content: space-between;
        font-size: 9px;
        color: #888;
        margin-top: 4px;
      }

      .pm-temp-status {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
      }

      .pm-temp-category {
        font-weight: 600;
        font-size: 13px;
        color: #1a1a1a;
      }

      .pm-temp-desc {
        font-size: 11px;
        color: #666;
      }

/* Price Range Card - Enhanced */
.pm-price-range-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  gap: 15px;
}

.pm-price-range-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

/* Range Rows */
.pm-range-row {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pm-range-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 70px;
}

.pm-range-values {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
}

.pm-range-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  flex: 1;
}

.pm-range-item.median {
  transform: scale(1.15);
  padding: 0 10px;
}

.pm-range-value {
  font-size: 14px;
  font-weight: 700;
  color: #2c2c2c;
}

.pm-range-item.median .pm-range-value {
  font-size: 18px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pm-range-title {
  font-size: 9px;
  color: #999;
  font-weight: 500;
  letter-spacing: 0.5px;
}

/* Different styling for market vs company */
.pm-range-row.market .pm-range-label {
  color: #667eea;
}

.pm-range-row.company .pm-range-label {
  color: #764ba2;
}

/* Quick Stats - Enhanced */
.pm-quick-stats {
  display: flex;
  gap: 10px;
}

.pm-stat-item {
  background: white;
  border-radius: 12px;
  padding: 16px;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
  min-height: 120px;
}

.pm-stat-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.pm-stat-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.pm-stat-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
  flex-shrink: 0;
}

.pm-stat-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Grid layout for 4 metrics */
.pm-stat-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto auto;
  gap: 12px 20px;
}

.pm-stat-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pm-stat-cell .pm-stat-val {
  font-size: 18px;
  font-weight: 700;
  color: #2c2c2c;
  line-height: 1;
}

.pm-stat-cell .pm-stat-lbl {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 500;
}

/* Main/Secondary layout for promo waves */
.pm-stat-main {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-stat-main .pm-stat-val {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.pm-stat-main .pm-stat-lbl {
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.pm-stat-secondary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #f0f0f0;
}

.pm-stat-subtitle {
  font-size: 13px;
  color: #666;
  font-weight: 600;
}

.pm-stat-extra {
  font-size: 11px;
  color: #999;
}

/* Remove trend badges from grid cells */
.pm-stat-trend {
  display: none;
}

/* Main Grid - Add proper sizing */
.pm-main-grid {
  display: grid;
  grid-template-columns: 700px 1fr;
  gap: 10px;
  width: 100%;
  max-height: 800px;
}

      /* Left Column */
      .pm-left-column {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      /* Buckets Card - Enhanced */
      .pm-buckets-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        flex: 1;
        position: relative;
      }

      .pm-buckets-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #4CAF50, #9C27B0);
      }

      .pm-buckets-table {
        margin-top: 12px;
      }

/* Bucket Table Styles */
.pm-buckets-header {
  display: grid;
  grid-template-columns: 130px 80px 1fr 2px 1fr;
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

.pm-buckets-body {
  max-height: 600px;
  overflow-y: auto;
}

/* Tree/Butterfly Chart Styles */
.pm-bucket-row-tree {
  display: grid;
  grid-template-columns: 130px 80px 1fr 2px 1fr;
  min-height: 60px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  transition: background 0.2s;
}

.pm-bucket-row-tree:hover {
  background: #fafafa;
}

/* Bucket Label */
.pm-bucket-label {
  padding: 8px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pm-bucket-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
}

.pm-bucket-indicator {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.pm-bucket-range {
  font-size: 10px;
  color: #888;
  font-family: 'Monaco', 'Menlo', monospace;
  padding-left: 20px;
}

/* Dominant Company Column */
.pm-bucket-dominant {
  padding: 0 8px;
  font-size: 11px;
  color: #666;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: center;
}

.pm-bucket-dominant.is-my-company {
  font-weight: 700;
  color: #1976d2;
}

.pm-dominant-badge {
  display: inline-block;
  padding: 3px 8px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  animation: pulseGlow 2s ease-in-out infinite;
}

@keyframes pulseGlow {
  0%, 100% { 
    transform: scale(1); 
    box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
  }
  50% { 
    transform: scale(1.02); 
    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
  }
}

/* Market Side (LEFT) */
.pm-tree-market {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  gap: 8px;
}

/* Company Side (RIGHT) */
.pm-tree-company {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
}

/* Center Divider */
.pm-tree-center {
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, #e8e8e8, #f5f5f5, #e8e8e8);
  position: relative;
}

/* Metrics Container */
.pm-tree-metrics {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 70px;
  gap: 4px;
}

/* Products Box Styling */
.pm-products-box {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 600;
  gap: 2px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: transform 0.2s;
}

.pm-products-box:hover {
  transform: scale(1.05);
}

.pm-products-count {
  color: #2c2c2c;
  font-weight: 700;
}

.pm-products-sep {
  color: #888;
  margin: 0 1px;
}

.pm-discounted-count {
  color: #555;
  font-weight: 600;
}

/* Discount Badge */
.pm-discount-badge {
  display: inline-block;
  padding: 2px 6px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}

.pm-discount-badge-empty {
  display: inline-block;
  padding: 2px 6px;
  color: #ccc;
  font-size: 10px;
  margin-top: 2px;
}

/* Bar Containers */
.pm-tree-bar-container {
  flex: 1;
  height: 30px;
  position: relative;
  background: #f5f5f5;
  border-radius: 6px;
  overflow: hidden;
  max-width: 200px;
}

.pm-tree-bar-container.left {
  display: flex;
  justify-content: flex-end;
}

.pm-tree-bar-container.right {
  display: flex;
  justify-content: flex-start;
}

/* Bars */
.pm-tree-bar {
  height: 100%;
  display: flex;
  align-items: center;
  position: relative;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.85;
}

.pm-tree-bar:hover {
  opacity: 1;
}

/* Percentage OUTSIDE bars (in grey area) */
.pm-bar-percent-outside {
  position: absolute;
  font-size: 11px;
  font-weight: 600;
  color: #444;  /* Dark color */
  line-height: 32px;
  z-index: 2;
}

.pm-bar-percent-outside.left {
  left: 8px;
}

.pm-bar-percent-outside.right {
  right: 8px;
}

/* New bucket structure styles */
.pm-bucket-wrapper {
  display: flex;
  border-bottom: 1px solid #e8e8e8;
  min-height: 60px;
}

.pm-bucket-wrapper.single-row {
  min-height: 40px;
}

.pm-bucket-info {
  display: flex;
  align-items: center;
  width: 210px;
  padding: 0 16px;
  border-right: 1px solid #f0f0f0;
}

.pm-bucket-name {
  width: 100px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
}

.pm-bucket-indicator {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.pm-bucket-range {
  width: 110px;
  font-size: 11px;
  color: #666;
  font-family: 'Monaco', 'Menlo', monospace;
  padding-left: 10px;
}

.pm-bucket-data {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.pm-data-row {
  display: grid;
  grid-template-columns: 50px 80px 100px 80px;
  padding: 10px 16px;
  align-items: center;
  min-height: 30px;
}

.pm-data-row.market-row {
  background: white;
}

.pm-data-row.company-row {
  background: #f9f9f9;
}

.pm-bucket-products {
  font-size: 12px;
  font-weight: 600;
  text-align: center;
}

.pm-bucket-discounted {
  text-align: center;
}

.pm-discount-badge {
  display: inline-block;
  padding: 2px 8px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.pm-discount-badge.company {
  background: linear-gradient(135deg, #e8f5e9, #f3e5f5);
  color: #5e35b1;
}

.pm-discount-depth {
  text-align: center;
  color: #ff6b6b;
  font-weight: 600;
  font-size: 11px;
}

.pm-bucket-share {
  display: flex;
  align-items: center;
}

.pm-bucket-share-bar {
  flex: 1;
  height: 18px;
  background: #f0f0f0;
  border-radius: 9px;
  overflow: hidden;
}

.pm-bucket-share-fill {
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.pm-source {
  font-size: 11px;
  color: #666;
}

.pm-bucket-share {
  position: relative;
  display: flex;
  align-items: center;
}

.pm-bucket-share-bar {
  flex: 1;
  height: 18px;
  background: #f0f0f0;
  border-radius: 9px;
  overflow: hidden;
  position: relative;
}

.pm-bucket-share-fill {
  height: 100%;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.pm-share-text {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  font-weight: 600;
  color: #333;
  z-index: 2;
}

.pm-depth-badge {
  display: inline-block;
  padding: 3px 8px;
  background: #ff4444;
  color: white;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

/* Metrics Row */
.pm-metrics-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.pm-metric-mini {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  position: relative;
  transition: transform 0.2s;
}

.pm-metric-mini:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
}

.pm-metric-mini::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
}

.pm-metric-display {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin: 12px 0 8px;
}

.pm-metric-val {
  font-size: 24px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pm-metric-status {
  font-size: 11px;
  padding: 4px 8px;
  background: #f0f0f0;
  border-radius: 4px;
  font-weight: 500;
}

.pm-metric-bar {
  height: 6px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
}

.pm-metric-fill {
  height: 100%;
  background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
  transition: width 0.5s ease;
}

/* Right Column */
.pm-right-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Chart Card - Enhanced */
.pm-chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  flex: 1;
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  min-height: 0;
}

.pm-chart-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, #2196F3, #4CAF50);
}

.pm-chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.pm-chart-legend {
  display: flex;
  gap: 12px;
}

.pm-legend-item {
  font-size: 11px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 4px;
}

.pm-legend-item::before {
  content: '';
  width: 12px;
  height: 3px;
  background: var(--color);
  border-radius: 2px;
}

.pm-chart-container {
  height: 240px;  /* Reduced from 320px */
  position: relative;
}

.pm-stat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.pm-stat-emoji {
  font-size: 20px;
}

.pm-stat-title {
  font-size: 11px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pm-stat-body {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.pm-stat-number {
  font-size: 32px;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pm-stat-change {
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 500;
}

.pm-stat-subtitle {
  font-size: 11px;
  color: #888;
  display: block;
  margin-top: 4px;
}

/* View Switcher Styles - Enhanced */
.pm-view-switcher-wrapper {
  margin: 0 0 0 20px;
  display: flex;
  align-items: center;
  gap: 20px;
}

.pm-view-switcher {
  display: inline-flex !important;
  flex-direction: row !important;
  background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
  border-radius: 30px;
  padding: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  gap: 2px;
}

.pm-switcher-btn {
  padding: 10px 20px;
  border: none;
  background: transparent;
  border-radius: 26px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #666;
  display: inline-flex !important;
  align-items: center;
  gap: 6px;
  position: relative;
  white-space: nowrap;
  flex-shrink: 0;
}

.pm-switcher-btn:hover {
  background-color: rgba(102, 126, 234, 0.08);
  color: #333;
  transform: scale(1.02);
}

.pm-switcher-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
  transform: scale(1.02);
}

.pm-switcher-btn.active:hover {
  transform: scale(1.05);
}

.pm-btn-icon {
  font-size: 16px;
  display: inline-block;
}

/* Wrapper styles */
.price-monitoring-wrapper {
  width: 1490px;
  margin: 20px 0 20px 20px;
  background-color: #f9f9f9 !important;  /* Changed from #fff to light grey */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  max-height: 80vh;
  overflow-y: auto;
  display: block;
}

/* Header styles for other views */
.pm-header-section {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.pm-title-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pm-main-title {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0;
}

.pm-last-updated {
  font-size: 12px;
  color: #888;
}

.pm-placeholder-content {
  padding: 40px;
  text-align: center;
  color: #666;
  font-size: 14px;
}

/* Scrollbar Styling */
.pm-buckets-body::-webkit-scrollbar,
.price-monitoring-wrapper::-webkit-scrollbar {
  width: 8px;
}

.pm-buckets-body::-webkit-scrollbar-track,
.price-monitoring-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.pm-buckets-body::-webkit-scrollbar-thumb,
.price-monitoring-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.pm-buckets-body::-webkit-scrollbar-thumb:hover,
.price-monitoring-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Animation effects */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.pm-dashboard-container > * {
  animation: fadeIn 0.5s ease-out;
}

/* Responsive adjustments for chart */
#pmProductsChart {
  width: 100%;
  height: 100%;
}

/* Loading states */
.pm-loading {
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* Promo Waves Container - Compact Professional Design */
.pm-promowaves-container {
  margin-top: 12px;
  padding-top: 40px;
  border-top: 1px solid #f0f0f0;
  flex: 1;
  min-height: 200px;
  max-height: 475px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pm-promowaves-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.pm-promowaves-header h5 {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #4a4a4a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pm-promowaves-count {
  font-size: 10px;
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 10px;
  font-weight: 600;
}

.pm-promowaves-chart {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  min-height: 0;
}

.pm-no-promowaves {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  color: #999;
  font-size: 12px;
  background: #fafafa;
  border-radius: 8px;
}

/* Waves Wrapper */
.pm-waves-wrapper {
  position: relative;
  padding-top: 35px;
}

/* X-Axis Label */
.pm-waves-xaxis-label {
  position: absolute;
  top: 0;
  left: 210px;
  width: 300px;
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 2px;
}

/* X-Axis Scale */
.pm-waves-xaxis {
  position: absolute;
  top: 15px;
  left: 160px;
  width: 400px;
  height: 20px;
  border-bottom: 1px solid #e8e8e8;
}

.pm-xaxis-tick {
  position: absolute;
  font-size: 9px;
  color: #999;
  transform: translateX(-50%);
  padding-top: 2px;
}

.pm-xaxis-tick::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 1px;
  height: 4px;
  background: #d8d8d8;
}

/* Waves List - Compact Bar Design */
.pm-waves-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pm-wave-item {
  display: grid;
  grid-template-columns: 150px 400px 1fr;
  align-items: center;
  height: 22px;
  font-size: 11px;
  position: relative;
  gap: 10px;
}

/* Add subtle grid lines - adjusted for dynamic scale */
.pm-wave-item::before {
  content: '';
  position: absolute;
  left: 210px;
  width: 300px;
  height: 100%;
  background: repeating-linear-gradient(
    90deg,
    transparent,
    transparent calc(25% - 0.5px),
    rgba(0, 0, 0, 0.03) calc(25% - 0.5px),
    rgba(0, 0, 0, 0.03) calc(25% + 0.5px)
  );
  pointer-events: none;
}

.pm-wave-company {
  padding-right: 10px;
  color: #333;
  font-weight: 600;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: right;
  font-size: 11px;
}

.pm-wave-bar-container {
  position: relative;
  height: 18px;
  background: #f5f8fa;
  border-radius: 4px;
  overflow: visible;
  width: 100%;
}

.pm-wave-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.5), rgba(33, 150, 243, 0.7));
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
}

.pm-wave-bar-fill:hover {
  background: linear-gradient(90deg, rgba(33, 150, 243, 0.5), rgba(33, 150, 243, 0.7));
}

.pm-wave-metrics {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 8px;
  white-space: nowrap;
  font-size: 10px;
  color: #1565c0;
  font-weight: 500;
}

.pm-wave-metrics-outside {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 10px;
  color: #666;
  font-weight: 500;
  justify-self: end;
}

.pm-wave-discount {
  font-weight: 700;
  color: white;
  font-size: 10px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.pm-wave-separator {
  color: rgba(13, 71, 161, 0.3);
  font-weight: 300;
}

.pm-wave-products {
  color: #1565c0;
}

.pm-wave-duration {
  color: #1976d2;
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 3px;
  font-weight: 600;
}

/* Trend Indicator Styles */
.pm-wave-trend {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 9px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.pm-wave-trend.up {
  color: #2e7d32;
  border: 1px solid #4caf50;
}

.pm-wave-trend.down {
  color: #c62828;
  border: 1px solid #f44336;
}

.pm-trend-arrow {
  font-size: 11px;
  line-height: 1;
}

.pm-trend-value {
  font-size: 9px;
  font-weight: 700;
}

.pm-wave-bar-container {
  position: relative;
  height: 18px;
  background: #f5f8fa;
  border-radius: 4px;
  overflow: visible; /* Changed from overflow: visible to allow trend to show */
  width: 100%;
}

.pm-waves-more {
  margin-top: 8px;
  padding: 8px;
  text-align: center;
  font-size: 11px;
  color: #1976d2;
  background: #e3f2fd;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 600;
  border: 1px solid transparent;
}

.pm-waves-more:hover {
  background: #bbdefb;
  border-color: #90caf9;
}

.pm-waves-more:active {
  transform: scale(0.98);
}

/* Scrollbar styling for promo waves */
.pm-promowaves-chart::-webkit-scrollbar {
  width: 6px;
}

.pm-promowaves-chart::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.pm-promowaves-chart::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.pm-promowaves-chart::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

  // Setup event listeners for the switcher
  function setupPriceMonitoringSwitcher() {
    const switcher = document.getElementById('pmViewSwitcher');
    if (!switcher) return;

    switcher.addEventListener('click', function(e) {
      const btn = e.target.closest('.pm-switcher-btn');
      if (!btn) return;

      // Remove active class from all buttons
      document.querySelectorAll('.pm-switcher-btn').forEach(b => {
        b.classList.remove('active');
      });

      // Add active class to clicked button
      btn.classList.add('active');

      // Show corresponding view
      const view = btn.getAttribute('data-view');
      showPriceMonitoringView(view);
    });

    // Setup additional event listeners for interactive elements
    setupCompaniesListeners();
    setupProductsListeners();
    setupCompareModeListeners();
    setupPromosListeners();
  }

function showPriceMonitoringView(view) {
  console.log('[PriceMonitoring] Switching to view:', view);
  
  // Hide all wrappers
  const allWrappers = document.querySelectorAll('.price-monitoring-wrapper');
  allWrappers.forEach(wrapper => {
    wrapper.style.display = 'none';
  });
  
  // Show selected wrapper
  const selectedWrapper = document.querySelector(`.price-monitoring-wrapper[data-view="${view}"]`);
  if (selectedWrapper) {
    selectedWrapper.style.display = 'block';
  }
  
  // Update switcher buttons
  document.querySelectorAll('.pm-switcher-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeBtn = document.querySelector(`.pm-switcher-btn[data-view="${view}"]`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Load data based on view
switch(view) {
  case 'market-overview':
    populateMarketOverview();
    break;
  case 'companies':
    loadCompaniesData();
    break;
  case 'products':
    loadProductsData();
    break;
  case 'promos':
    loadPromosData();
    break;
  case 'alerts':
    loadAlertsData();
    break;
}
}

  // Data loading functions (placeholders - implement with your actual data)
  function loadMarketOverviewData() {
    console.log('[PriceMonitoring] Loading Market Overview data...');
    // TODO: Implement actual data loading
    updateLastUpdated();
  }

function loadCompaniesData() {
  console.log('[PM] Loading companies data');
  
  // Check if the companies module is loaded
  if (window.pmCompaniesModule) {
    window.pmCompaniesModule.initialize();
  } else {
    // Wait for the module to load (since it's loaded via embed element)
    const checkInterval = setInterval(() => {
      if (window.pmCompaniesModule) {
        clearInterval(checkInterval);
        window.pmCompaniesModule.initialize();
      }
    }, 100);
    
    // Clear interval after 5 seconds to prevent infinite checking
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
}

function loadProductsData() {
  console.log('[PM] Loading products data');
  
  // Check if the products module is loaded
  if (window.pmProductsModule) {
    window.pmProductsModule.initialize();
  } else {
    // Wait for the module to load (since it's loaded via embed element)
    const checkInterval = setInterval(() => {
      if (window.pmProductsModule) {
        clearInterval(checkInterval);
        window.pmProductsModule.initialize();
      }
    }, 100);
    
    // Clear interval after 5 seconds to prevent infinite checking
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
}

function loadPromosData() {
  console.log('[PM] Loading promos data');
  
  // Check if the promos module is loaded
  if (window.pmPromosModule) {
    window.pmPromosModule.initialize();
  } else {
    // Wait for the module to load
    const checkInterval = setInterval(() => {
      if (window.pmPromosModule) {
        clearInterval(checkInterval);
        window.pmPromosModule.initialize();
      }
    }, 100);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
}

function loadAlertsData() {
  console.log('[PM] Loading alerts data');
  
  // Check if the alerts module is loaded
  if (window.pmAlertsModule) {
    window.pmAlertsModule.initialize();
  } else {
    // Wait for the module to load
    const checkInterval = setInterval(() => {
      if (window.pmAlertsModule) {
        clearInterval(checkInterval);
        window.pmAlertsModule.initialize();
      }
    }, 100);
    
    setTimeout(() => clearInterval(checkInterval), 5000);
  }
}

  // Helper functions
  function updateLastUpdated() {
    const element = document.getElementById('pmLastUpdated');
    if (element) {
      const now = new Date();
      element.textContent = now.toLocaleString();
    }
  }

  function populateCompanySelector() {
    const select = document.getElementById('pmCompanySelect');
    if (select) {
      // TODO: Populate with actual company data
      select.innerHTML = `
        <option value="">Choose a company...</option>
        <option value="company1">Company 1</option>
        <option value="company2">Company 2</option>
      `;
    }
  }

  function loadCompareModeData() {
  console.log('[PriceMonitoring] Loading Compare Mode data...');
  // TODO: Implement actual data loading
  populateCompareSelectors();
}

  function populateCompareSelectors() {
  const selectA = document.getElementById('pmCompareA');
  const selectB = document.getElementById('pmCompareB');
  
  const options = `
    <option value="">Select company...</option>
    <option value="company1">Company 1</option>
    <option value="company2">Company 2</option>
  `;
  
  if (selectA) selectA.innerHTML = options;
  if (selectB) selectB.innerHTML = options;
}

  function setupCompareModeListeners() {
  const compareBtn = document.getElementById('pmCompareBtn');
  if (compareBtn) {
    compareBtn.addEventListener('click', function() {
      const companyA = document.getElementById('pmCompareA').value;
      const companyB = document.getElementById('pmCompareB').value;
      
      if (!companyA || !companyB) {
        alert('Please select both companies to compare');
        return;
      }
      
      console.log('[PriceMonitoring] Comparing:', companyA, 'vs', companyB);
      // TODO: Perform comparison
    });
  }
}

  // Event listener setup functions
  function setupCompaniesListeners() {
    const companySelect = document.getElementById('pmCompanySelect');
    if (companySelect) {
      companySelect.addEventListener('change', function(e) {
        console.log('[PriceMonitoring] Company selected:', e.target.value);
        // TODO: Load company-specific data
      });
    }

    // Date range buttons
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('pm-date-btn')) {
        document.querySelectorAll('.pm-date-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
        const days = e.target.getAttribute('data-days');
        console.log('[PriceMonitoring] Date range selected:', days, 'days');
        // TODO: Reload data with new date range
      }
    });
  }

  function setupProductsListeners() {
    const searchInput = document.getElementById('pmProductSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        console.log('[PriceMonitoring] Product search:', e.target.value);
        // TODO: Filter products
      });
    }

    const bucketFilter = document.getElementById('pmBucketFilter');
    if (bucketFilter) {
      bucketFilter.addEventListener('change', function(e) {
        console.log('[PriceMonitoring] Bucket filter:', e.target.value);
        // TODO: Filter by bucket
      });
    }

    const promoFilter = document.getElementById('pmPromoFilter');
    if (promoFilter) {
      promoFilter.addEventListener('change', function(e) {
        console.log('[PriceMonitoring] Promo filter:', e.target.value);
        // TODO: Filter by promo status
      });
    }
  }

  function setupPromosListeners() {
    // Add any promo-specific event listeners here
  }

  // Export for external use
  window.renderPriceMonitoringTable = function() {
    console.log('[PriceMonitoring] Rendering Price Monitoring table...');
    initializePriceMonitoring();
  };

  // Export for external use
window.renderPriceMonitoringTable = function() {
  console.log('[PriceMonitoring] Rendering Price Monitoring table...');
  initializePriceMonitoring();
};

// Export functions for companies module
window.pmUtils = {
  loadCompanyPricingData: loadCompanyPricingData,
  formatNumber: formatNumber,
  formatPercent: formatPercent,
  calculateTrend: calculateTrend
};

  console.log('[PriceMonitoring] Module loaded successfully');
})();
