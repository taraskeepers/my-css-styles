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
            <div class="pm-last-updated">Last updated: <span id="pmLastUpdated">-</span></div>
          </div>
        </div>
        <div class="pm-market-stats-grid">
          <div class="pm-stat-card">
            <div class="pm-stat-label">Market Median Price</div>
            <div class="pm-stat-value">$0.00</div>
            <div class="pm-stat-change positive">+0%</div>
          </div>
          <div class="pm-stat-card">
            <div class="pm-stat-label">Active Products</div>
            <div class="pm-stat-value">0</div>
            <div class="pm-stat-change">0 new today</div>
          </div>
          <div class="pm-stat-card">
            <div class="pm-stat-label">Price Volatility</div>
            <div class="pm-stat-value">0%</div>
            <div class="pm-stat-change negative">-0%</div>
          </div>
          <div class="pm-stat-card">
            <div class="pm-stat-label">Avg Discount</div>
            <div class="pm-stat-value">0%</div>
            <div class="pm-stat-change">0 promos active</div>
          </div>
        </div>
        <div class="pm-charts-row">
          <div class="pm-chart-container">
            <h3>Price Distribution by Bucket</h3>
            <div id="pmBucketChart" class="pm-chart-placeholder">Chart will load here</div>
          </div>
          <div class="pm-chart-container">
            <h3>Price Trends (30 Days)</h3>
            <div id="pmTrendsChart" class="pm-chart-placeholder">Chart will load here</div>
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

      /* Rest of your existing styles... */
      
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

      .pm-stat-card {
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

// Show specific view
function showPriceMonitoringView(view) {
  console.log('[PriceMonitoring] Switching to view:', view);

  // Hide all wrapper containers
  const wrappers = document.querySelectorAll('.price-monitoring-wrapper');
  wrappers.forEach(wrapper => {
    wrapper.style.display = 'none';
  });

  // Show selected wrapper
  let targetWrapper;
  switch(view) {
    case 'market-overview':
      targetWrapper = document.getElementById('pmMarketOverviewWrapper');
      break;
    case 'companies':
      targetWrapper = document.getElementById('pmCompaniesWrapper');
      break;
    case 'products':
      targetWrapper = document.getElementById('pmProductsWrapper');
      break;
    case 'compare-mode':
      targetWrapper = document.getElementById('pmCompareModeWrapper');
      break;
    case 'promos':
      targetWrapper = document.getElementById('pmPromosWrapper');
      break;
  }

  if (targetWrapper) {
    targetWrapper.style.display = 'block';
    
    // Load data for the specific view
    switch(view) {
      case 'market-overview':
        loadMarketOverviewData();
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
