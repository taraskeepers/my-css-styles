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

// Add this function after the 'use strict' declaration
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
        
        // Find the market row (source='all' and q='all')
        const marketData = result.data.find(row => 
          row.source === 'all' && row.q === 'all'
        );
        
        // Get company-specific data (q='all' but source != 'all')
        const companiesData = result.data.filter(row => 
          row.q === 'all' && row.source !== 'all'
        );
        
        console.log('[PriceMonitoring] Market data found:', !!marketData);
        console.log('[PriceMonitoring] Companies found:', companiesData.length);
        
        db.close();
        resolve({
          marketData,
          companiesData,
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
  
  if (decimals === 0) return num.toLocaleString();
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
        <button id="pmCompareMode" class="pm-switcher-btn" data-view="compare-mode">
          <span class="pm-btn-icon">⚖️</span>
          <span>Compare Mode</span>
        </button>
        <button id="pmPromos" class="pm-switcher-btn" data-view="promos">
          <span class="pm-btn-icon">🏷️</span>
          <span>PROMOs</span>
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
    { id: 'pmCompareModeWrapper', view: 'compare-mode', display: 'none' },
    { id: 'pmPromosWrapper', view: 'promos', display: 'none' }
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
      max-height: 80vh;
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
    <div class="pm-header-section">
      <div class="pm-title-row">
        <h2 class="pm-main-title">Price Monitoring Dashboard</h2>
        <div class="pm-last-updated">Last updated: <span id="pmLastUpdated">—</span></div>
      </div>
    </div>
    
    <!-- Market Temperature Container -->
    <div id="pmMarketTemperature" class="pm-temperature-container">
      <div class="pm-temp-header">
        <h3>Market Temperature</h3>
        <div class="pm-temp-value-display">
          <span id="pmTempValue">—</span>
          <span class="pm-temp-unit">°</span>
        </div>
      </div>
      <div class="pm-temp-gauge-wrapper">
        <div class="pm-temp-gauge">
          <div id="pmTempFill" class="pm-temp-fill"></div>
          <div class="pm-temp-scale">
            <span data-temp="0">0°</span>
            <span data-temp="25">25°</span>
            <span data-temp="50">50°</span>
            <span data-temp="75">75°</span>
            <span data-temp="100">100°</span>
          </div>
        </div>
        <div id="pmTempLabel" class="pm-temp-label">—</div>
        <div id="pmTempDescription" class="pm-temp-description">—</div>
      </div>
    </div>
    
    <!-- Price Range Container -->
    <div id="pmPriceRange" class="pm-stats-card">
      <h3>Price Range</h3>
      <div class="pm-price-range-grid">
        <div class="pm-price-stat">
          <label>Min</label>
          <div class="pm-price-value" id="pmMinPrice">$—</div>
        </div>
        <div class="pm-price-stat median">
          <label>Median</label>
          <div class="pm-price-value" id="pmMedianPrice">$—</div>
        </div>
        <div class="pm-price-stat">
          <label>Max</label>
          <div class="pm-price-value" id="pmMaxPrice">$—</div>
        </div>
      </div>
    </div>
    
    <!-- Price Buckets Container -->
    <div id="pmPriceBuckets" class="pm-buckets-container">
      <h3>Price Buckets Distribution</h3>
      <div class="pm-buckets-table">
        <div class="pm-bucket-header">
          <span>Bucket</span>
          <span>Range</span>
          <span>Products</span>
          <span>Market Share</span>
          <span></span>
        </div>
        <div id="pmBucketsBody" class="pm-buckets-body">
          <!-- Buckets will be populated here -->
        </div>
      </div>
    </div>
    
    <!-- Products Container -->
    <div id="pmProductsStats" class="pm-products-container">
      <h3>Products Overview</h3>
      <div class="pm-products-grid">
        <div class="pm-product-stat">
          <div class="pm-stat-icon">📦</div>
          <div class="pm-stat-content">
            <label>Total Products</label>
            <div class="pm-stat-main">
              <span id="pmTotalProducts">—</span>
              <span id="pmTotalProductsTrend" class="pm-trend-badge"></span>
            </div>
          </div>
        </div>
        <div class="pm-product-stat">
          <div class="pm-stat-icon">🏷️</div>
          <div class="pm-stat-content">
            <label>Discounted</label>
            <div class="pm-stat-main">
              <span id="pmDiscountedProducts">—</span>
              <span id="pmDiscountedProductsTrend" class="pm-trend-badge"></span>
            </div>
          </div>
        </div>
        <div class="pm-product-stat">
          <div class="pm-stat-icon">%</div>
          <div class="pm-stat-content">
            <label>Discount Rate</label>
            <div class="pm-stat-main">
              <span id="pmDiscountRate">—</span>
              <span id="pmDiscountRateTrend" class="pm-trend-badge"></span>
            </div>
          </div>
        </div>
        <div class="pm-product-stat">
          <div class="pm-stat-icon">💰</div>
          <div class="pm-stat-content">
            <label>Avg Discount</label>
            <div class="pm-stat-main">
              <span id="pmAvgDiscount">—</span>
              <span id="pmAvgDiscountTrend" class="pm-trend-badge"></span>
            </div>
          </div>
        </div>
      </div>
      <div id="pmProductsChart" class="pm-products-chart">
        <canvas id="pmProductsCanvas"></canvas>
      </div>
    </div>
    
    <!-- Volatility Container -->
    <div id="pmVolatility" class="pm-metric-card">
      <h3>Price Volatility</h3>
      <div class="pm-metric-value">
        <span id="pmVolatilityValue">—</span>
        <div id="pmVolatilityIndicator" class="pm-indicator"></div>
      </div>
      <div id="pmVolatilityLabel" class="pm-metric-label">—</div>
      <div class="pm-metric-scale">
        <span>Tight</span>
        <span>Moderate</span>
        <span>Extreme</span>
      </div>
    </div>
    
    <!-- Price Change Velocity Container -->
    <div id="pmVelocity" class="pm-metric-card">
      <h3>Price Change Velocity</h3>
      <div class="pm-metric-value">
        <span id="pmVelocityValue">—</span>
        <div id="pmVelocityIndicator" class="pm-indicator"></div>
      </div>
      <div id="pmVelocityLabel" class="pm-metric-label">—</div>
      <div class="pm-metric-scale">
        <span>Static</span>
        <span>Moderate</span>
        <span>Hyper-fluid</span>
      </div>
    </div>
    
    <!-- Promo Waves Container -->
    <div id="pmPromoWaves" class="pm-promo-container">
      <h3>Active Promotion Waves</h3>
      <div class="pm-promo-grid">
        <div class="pm-promo-stat">
          <div class="pm-promo-icon">🌊</div>
          <label>Active Waves</label>
          <div id="pmActiveWaves" class="pm-promo-value">—</div>
        </div>
        <div class="pm-promo-stat">
          <div class="pm-promo-icon">📉</div>
          <label>Avg Discount</label>
          <div id="pmWaveDiscount" class="pm-promo-value">—</div>
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
        <div class="pm-header-section">
          <div class="pm-title-row">
            <h2 class="pm-main-title">Products Analysis</h2>
            <div class="pm-last-updated">Last updated: <span>-</span></div>
          </div>
        </div>
        <div class="pm-placeholder-content">Products content will be loaded here</div>
      `;
    } else if (config.view === 'compare-mode') {
      container.innerHTML = `
        <div class="pm-header-section">
          <div class="pm-title-row">
            <h2 class="pm-main-title">Compare Companies</h2>
            <div class="pm-last-updated">Last updated: <span>-</span></div>
          </div>
        </div>
        <div class="pm-placeholder-content">Comparison content will be loaded here</div>
      `;
    } else if (config.view === 'promos') {
      container.innerHTML = `
        <div class="pm-header-section">
          <div class="pm-title-row">
            <h2 class="pm-main-title">Promotions Dashboard</h2>
            <div class="pm-last-updated">Last updated: <span>-</span></div>
          </div>
        </div>
        <div class="pm-placeholder-content">Promotions content will be loaded here</div>
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
  if (!data || !data.marketData) {
    console.error('[PriceMonitoring] No market data available');
    return;
  }
  
  const market = data.marketData;
  console.log('[PriceMonitoring] Populating with market data:', market);
  
  // Update last updated time
  document.getElementById('pmLastUpdated').textContent = new Date().toLocaleString();
  
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
    tempFill.style.background = `linear-gradient(90deg, ${tempColor}aa, ${tempColor})`;
  }
  if (tempLabel) tempLabel.textContent = tempCategory;
  if (tempDesc) tempDesc.textContent = tempDescription;
  
  // 2. Price Range
  document.getElementById('pmMinPrice').textContent = `$${formatNumber(market.cheapest_product, 2)}`;
  document.getElementById('pmMedianPrice').textContent = `$${formatNumber(market.median_price, 2)}`;
  document.getElementById('pmMaxPrice').textContent = `$${formatNumber(market.most_expensive_product, 2)}`;
  
  // 3. Price Buckets
  const buckets = [
    { 
      name: 'Ultra Cheap', 
      count: market.ultra_cheap_bucket,
      share: market.ultra_cheap_bucket_share,
      color: '#4CAF50'
    },
    { 
      name: 'Budget', 
      count: market.budget_bucket,
      share: market.budget_bucket_share,
      color: '#8BC34A'
    },
    { 
      name: 'Mid Range', 
      count: market.mid_bucket,
      share: market.mid_bucket_share,
      color: '#FFC107'
    },
    { 
      name: 'Upper Mid', 
      count: market.upper_mid_bucket,
      share: market.upper_mid_bucket_share,
      color: '#FF9800'
    },
    { 
      name: 'Premium', 
      count: market.premium_bucket,
      share: market.premium_bucket_share,
      color: '#FF5722'
    },
    { 
      name: 'Ultra Premium', 
      count: market.ultra_premium_bucket,
      share: market.ultra_premium_bucket_share,
      color: '#9C27B0'
    }
  ];
  
  const bucketsBody = document.getElementById('pmBucketsBody');
  if (bucketsBody) {
    bucketsBody.innerHTML = buckets.map((bucket, index) => {
      const priceRange = market.price_range?.[index];
      const range = priceRange ? `$${priceRange.min_price} - $${priceRange.max_price}` : '—';
      const sharePercent = parseFloat(bucket.share) * 100;
      
      return `
        <div class="pm-bucket-row">
          <div class="pm-bucket-name">
            <span class="pm-bucket-color" style="background: ${bucket.color}"></span>
            ${bucket.name}
          </div>
          <div class="pm-bucket-range">${range}</div>
          <div class="pm-bucket-count">${formatNumber(bucket.count)}</div>
          <div class="pm-bucket-share">${sharePercent.toFixed(1)}%</div>
          <div class="pm-bucket-bar">
            <div class="pm-bucket-fill" style="width: ${sharePercent}%; background: ${bucket.color}"></div>
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
  
  const volatilityIndicator = document.getElementById('pmVolatilityIndicator');
  if (volatilityIndicator) {
    const position = Math.min(100, volatility * 100);
    volatilityIndicator.style.left = `${position}%`;
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
  
  const velocityIndicator = document.getElementById('pmVelocityIndicator');
  if (velocityIndicator) {
    const position = Math.min(100, (velocity / 3) * 100);
    velocityIndicator.style.left = `${position}%`;
  }
  
  // 8. Promo Waves
  document.getElementById('pmActiveWaves').textContent = formatNumber(market.promo_wave_length) || '0';
  document.getElementById('pmWaveDiscount').textContent = formatPercent(market.promo_wave_discount_depth) || '—';
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

// Function to create products chart
function createProductsChart(historicalData) {
  const canvas = document.getElementById('pmProductsCanvas');
  if (!canvas || !historicalData || historicalData.length === 0) return;
  
  const ctx = canvas.getContext('2d');
  
  // Prepare data
  const labels = historicalData.slice(-30).map(d => {
    const date = new Date(d.date.value);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  
  const datasets = [
    {
      label: 'Total Products',
      data: historicalData.slice(-30).map(d => parseFloat(d.total_products)),
      borderColor: '#2196F3',
      backgroundColor: '#2196F333',
      yAxisID: 'y-products'
    },
    {
      label: 'Discounted Products',
      data: historicalData.slice(-30).map(d => parseFloat(d.discounted_products)),
      borderColor: '#FF9800',
      backgroundColor: '#FF980033',
      yAxisID: 'y-products'
    },
    {
      label: 'Discount %',
      data: historicalData.slice(-30).map(d => parseFloat(d.pr_discounted_products) * 100),
      borderColor: '#4CAF50',
      backgroundColor: '#4CAF5033',
      yAxisID: 'y-percentage'
    }
  ];
  
  new Chart(ctx, {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'index', intersect: false }
      },
      scales: {
        'y-products': {
          type: 'linear',
          display: true,
          position: 'left',
          title: { display: true, text: 'Product Count' }
        },
        'y-percentage': {
          type: 'linear',
          display: true,
          position: 'right',
          title: { display: true, text: 'Percentage' },
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

function addPriceMonitoringStyles() {
  if (document.getElementById('pmStyles')) return;
  
  const styles = `
    <style id="pmStyles">
      /* View Switcher Styles */
      .pm-view-switcher {
        display: inline-flex !important;
        flex-direction: row !important;
        background-color: #f5f5f5;
        border-radius: 30px;
        padding: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        gap: 2px;
      }

      .pm-switcher-btn {
        padding: 10px 20px;
        border: none;
        background: transparent;
        border-radius: 26px;
        font-size: 14px;
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
        background-color: rgba(0, 122, 255, 0.08);
        color: #333;
      }

      .pm-switcher-btn.active {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
      }

      .pm-btn-icon {
        font-size: 16px;
        display: inline-block;
      }

      /* Placeholder content style */
      .pm-placeholder-content {
        padding: 40px;
        text-align: center;
        color: #999;
        font-style: italic;
        background: #f9f9f9;
        border-radius: 8px;
        margin-top: 20px;
      }
      
      /* Price Monitoring Main Styles */
      .pm-header-section {
        margin-bottom: 25px;
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 20px;
      }

      .pm-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .pm-main-title {
        font-size: 24px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }

      .pm-last-updated {
        font-size: 12px;
        color: #888;
      }

      /* Content Containers */
      .pm-content-container {
        animation: pmFadeIn 0.3s ease-in-out;
      }

      @keyframes pmFadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* Market Overview Styles */
      .pm-market-stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 20px;
        margin-bottom: 30px;
      }

      .pm-stats-card, .pm-stat-card {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        transition: all 0.3s ease;
      }

      .pm-stat-card:hover {
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }

      .pm-stat-label {
        font-size: 12px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 8px;
      }

      .pm-stat-value {
        font-size: 28px;
        font-weight: 600;
        color: #333;
        margin-bottom: 6px;
      }

      .pm-stat-change {
        font-size: 13px;
        color: #666;
      }

      .pm-stat-change.positive {
        color: #4CAF50;
      }

      .pm-stat-change.negative {
        color: #F44336;
      }

      /* Charts Row */
      .pm-charts-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
        gap: 25px;
        margin-top: 30px;
      }

      .pm-chart-container {
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.05);
      }

      .pm-chart-container h3 {
        margin: 0 0 15px 0;
        font-size: 16px;
        color: #333;
      }

      .pm-chart-placeholder {
        height: 300px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f9f9f9;
        border-radius: 8px;
        color: #999;
        font-style: italic;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        .pm-view-switcher {
          flex-wrap: wrap;
        }
        
        .pm-switcher-btn {
          padding: 8px 15px;
          font-size: 12px;
        }
        
        .pm-charts-row {
          grid-template-columns: 1fr;
        }
      }

      /* Market Temperature Styles */
      .pm-temperature-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .pm-temp-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .pm-temp-value-display {
        font-size: 36px;
        font-weight: bold;
        color: #333;
      }

      .pm-temp-gauge {
        position: relative;
        height: 40px;
        background: linear-gradient(90deg, 
          #0066cc 0%, #3399ff 15%, #66ccff 30%, 
          #ffcc00 45%, #ff9900 60%, #ff6600 75%, #ff0000 100%);
        border-radius: 20px;
        overflow: hidden;
      }

      .pm-temp-fill {
        position: absolute;
        height: 100%;
        transition: width 0.5s ease;
      }

      .pm-temp-scale {
        display: flex;
        justify-content: space-between;
        margin-top: 10px;
        font-size: 12px;
        color: #666;
      }

      .pm-temp-label {
        font-size: 18px;
        font-weight: bold;
        text-align: center;
        margin-top: 15px;
      }

      .pm-temp-description {
        text-align: center;
        color: #666;
        margin-top: 5px;
      }

      /* Price Buckets Styles */
      .pm-buckets-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .pm-bucket-header {
        display: grid;
        grid-template-columns: 150px 150px 100px 100px 1fr;
        padding: 10px;
        font-weight: bold;
        border-bottom: 2px solid #e0e0e0;
      }

      .pm-bucket-row {
        display: grid;
        grid-template-columns: 150px 150px 100px 100px 1fr;
        padding: 10px;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
      }

      .pm-bucket-row:hover {
        background-color: #f9f9f9;
      }

      .pm-bucket-name {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .pm-bucket-color {
        width: 20px;
        height: 20px;
        border-radius: 4px;
      }

      .pm-bucket-bar {
        background: #f0f0f0;
        height: 20px;
        border-radius: 10px;
        overflow: hidden;
      }

      .pm-bucket-fill {
        height: 100%;
        transition: width 0.5s ease;
      }

      /* Products Stats Styles */
      .pm-products-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .pm-products-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin: 20px 0;
      }

      .pm-product-stat {
        display: flex;
        align-items: center;
        gap: 15px;
      }

      .pm-stat-icon {
        font-size: 32px;
      }

      .pm-stat-content {
        flex: 1;
      }

      .pm-stat-content label {
        display: block;
        color: #666;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .pm-stat-main {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 24px;
        font-weight: bold;
      }

      .pm-trend-badge {
        font-size: 14px;
        padding: 2px 6px;
        border-radius: 4px;
      }

      .pm-products-chart {
        height: 300px;
        margin-top: 20px;
      }

      /* Metric Cards Styles */
      .pm-metric-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .pm-metric-value {
        position: relative;
        font-size: 36px;
        font-weight: bold;
        text-align: center;
        margin: 20px 0;
      }

      .pm-indicator {
        position: absolute;
        width: 10px;
        height: 10px;
        background: #2196F3;
        border-radius: 50%;
        bottom: -20px;
        transition: left 0.5s ease;
      }

      .pm-metric-label {
        text-align: center;
        font-size: 18px;
        color: #666;
        margin: 10px 0;
      }

      .pm-metric-scale {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        font-size: 12px;
        color: #999;
      }

      /* Promo Waves Styles */
      .pm-promo-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        margin: 20px 0;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      }

      .pm-promo-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 30px;
        margin-top: 20px;
      }

      .pm-promo-stat {
        text-align: center;
      }

      .pm-promo-icon {
        font-size: 48px;
        margin-bottom: 10px;
      }

      .pm-promo-stat label {
        display: block;
        color: #666;
        font-size: 14px;
        margin-bottom: 10px;
      }

      .pm-promo-value {
        font-size: 32px;
        font-weight: bold;
        color: #2196F3;
      }

      /* Price Range Styles */
      .pm-price-range-grid {
        display: flex;
        justify-content: space-around;
        align-items: center;
        margin-top: 20px;
      }

      .pm-price-stat {
        text-align: center;
      }

      .pm-price-stat label {
        display: block;
        color: #666;
        font-size: 12px;
        margin-bottom: 5px;
      }

      .pm-price-value {
        font-size: 24px;
        font-weight: bold;
        color: #333;
      }

      .pm-price-stat.median .pm-price-value {
        font-size: 32px;
        color: #2196F3;
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
      populateMarketOverview(); // Call the new function
      break;
    case 'companies':
      loadCompaniesData();
      break;
    case 'products':
      loadProductsData();
      break;
    case 'compare-mode':
      loadCompareModeData();
      break;
    case 'promos':
      loadPromosData();
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
    console.log('[PriceMonitoring] Loading Companies data...');
    // TODO: Implement actual data loading
    populateCompanySelector();
  }

  function loadProductsData() {
    console.log('[PriceMonitoring] Loading Products data...');
    // TODO: Implement actual data loading
  }

  function loadCompareModeData() {
    console.log('[PriceMonitoring] Loading Compare Mode data...');
    // TODO: Implement actual data loading
    populateCompareSelectors();
  }

  function loadPromosData() {
    console.log('[PriceMonitoring] Loading Promos data...');
    // TODO: Implement actual data loading
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

  function setupPromosListeners() {
    // Add any promo-specific event listeners here
  }

  // Export for external use
  window.renderPriceMonitoringTable = function() {
    console.log('[PriceMonitoring] Rendering Price Monitoring table...');
    initializePriceMonitoring();
  };

  console.log('[PriceMonitoring] Module loaded successfully');
})();
