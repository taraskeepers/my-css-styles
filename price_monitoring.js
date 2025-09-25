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
    const container = document.getElementById('priceMonitoringContainer');
    if (!container) {
      console.error('[PriceMonitoring] Container not found!');
      return;
    }

    container.innerHTML = `
      <!-- Price Monitoring Header -->
      <div class="pm-header-section">
        <div class="pm-title-row">
          <h2 class="pm-main-title">Price Monitoring Dashboard</h2>
          <div class="pm-last-updated">Last updated: <span id="pmLastUpdated">-</span></div>
        </div>
        
        <!-- Price Monitoring View Switcher -->
        <div class="pm-view-switcher-wrapper">
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
        </div>
      </div>

      <!-- Market Overview Container -->
      <div id="pmMarketOverviewContainer" class="pm-content-container pm-market-overview-container">
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
      </div>

      <!-- Companies Container -->
      <div id="pmCompaniesContainer" class="pm-content-container pm-companies-container" style="display: none;">
        <div class="pm-company-selector-row">
          <div class="pm-company-dropdown-wrapper">
            <label>Select Company:</label>
            <select id="pmCompanySelect" class="pm-select">
              <option value="">Choose a company...</option>
            </select>
          </div>
          <div class="pm-date-range-selector">
            <button class="pm-date-btn active" data-days="7">7 Days</button>
            <button class="pm-date-btn" data-days="30">30 Days</button>
            <button class="pm-date-btn" data-days="90">90 Days</button>
          </div>
        </div>
        
        <div class="pm-company-metrics-grid">
          <div class="pm-metric-card">
            <h4>Company Price Index (CPI)</h4>
            <div class="pm-metric-main">0.00</div>
            <div class="pm-metric-sub">vs Market</div>
          </div>
          <div class="pm-metric-card">
            <h4>Coverage Score</h4>
            <div class="pm-metric-main">0%</div>
            <div class="pm-metric-sub">of buckets covered</div>
          </div>
          <div class="pm-metric-card">
            <h4>Promo Intensity</h4>
            <div class="pm-metric-main">0%</div>
            <div class="pm-metric-sub">products on sale</div>
          </div>
          <div class="pm-metric-card">
            <h4>Price Stability</h4>
            <div class="pm-metric-main">0.0</div>
            <div class="pm-metric-sub">volatility score</div>
          </div>
        </div>
        
        <div class="pm-company-details-section">
          <div id="pmCompanyTable" class="pm-table-container">
            <!-- Company products table will be inserted here -->
          </div>
        </div>
      </div>

      <!-- Products Container -->
      <div id="pmProductsContainer" class="pm-content-container pm-products-container" style="display: none;">
        <div class="pm-products-filters">
          <input type="text" id="pmProductSearch" class="pm-search-input" placeholder="Search products...">
          <select id="pmBucketFilter" class="pm-select">
            <option value="">All Price Buckets</option>
            <option value="ultra-cheap">Ultra-cheap (≤P10)</option>
            <option value="budget">Budget (P10-P25)</option>
            <option value="mid">Mid (P25-P50)</option>
            <option value="upper-mid">Upper-mid (P50-P75)</option>
            <option value="premium">Premium (P75-P90)</option>
            <option value="ultra-premium">Ultra-premium (>P90)</option>
          </select>
          <select id="pmPromoFilter" class="pm-select">
            <option value="">All Products</option>
            <option value="on-sale">On Sale</option>
            <option value="regular">Regular Price</option>
          </select>
        </div>
        
        <div id="pmProductsGrid" class="pm-products-grid">
          <!-- Product cards will be inserted here -->
        </div>
      </div>

      <!-- Compare Mode Container -->
      <div id="pmCompareModeContainer" class="pm-content-container pm-compare-container" style="display: none;">
        <div class="pm-compare-header">
          <div class="pm-compare-selectors">
            <div class="pm-compare-item">
              <label>Company A:</label>
              <select id="pmCompareA" class="pm-select">
                <option value="">Select company...</option>
              </select>
            </div>
            <div class="pm-vs-divider">VS</div>
            <div class="pm-compare-item">
              <label>Company B:</label>
              <select id="pmCompareB" class="pm-select">
                <option value="">Select company...</option>
              </select>
            </div>
            <button id="pmCompareBtn" class="pm-primary-btn">Compare</button>
          </div>
        </div>
        
        <div id="pmComparisonResults" class="pm-comparison-results">
          <!-- Comparison results will be displayed here -->
        </div>
      </div>

      <!-- PROMOs Container -->
      <div id="pmPromosContainer" class="pm-content-container pm-promos-container" style="display: none;">
        <div class="pm-promos-summary">
          <div class="pm-promo-stat">
            <div class="pm-promo-number">0</div>
            <div class="pm-promo-label">Active Promotions</div>
          </div>
          <div class="pm-promo-stat">
            <div class="pm-promo-number">0%</div>
            <div class="pm-promo-label">Avg Discount</div>
          </div>
          <div class="pm-promo-stat">
            <div class="pm-promo-number">0</div>
            <div class="pm-promo-label">New Today</div>
          </div>
          <div class="pm-promo-stat">
            <div class="pm-promo-number">0</div>
            <div class="pm-promo-label">Ending Soon</div>
          </div>
        </div>
        
        <div class="pm-promos-timeline">
          <h3>Promotion Timeline</h3>
          <div id="pmPromosTimeline" class="pm-timeline-container">
            <!-- Timeline visualization will be here -->
          </div>
        </div>
        
        <div class="pm-promos-list">
          <h3>Active Promotions</h3>
          <div id="pmPromosList" class="pm-list-container">
            <!-- Promotions list will be here -->
          </div>
        </div>
      </div>
    `;

    // Add CSS styles
    addPriceMonitoringStyles();
  }

  // Add CSS styles for Price Monitoring
  function addPriceMonitoringStyles() {
    if (document.getElementById('pmStyles')) return;
    
    const styles = `
      <style id="pmStyles">
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

        /* View Switcher Styles */
        .pm-view-switcher-wrapper {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .pm-view-switcher {
          display: inline-flex;
          background-color: #f5f5f5;
          border-radius: 30px;
          padding: 4px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
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
          display: flex;
          align-items: center;
          gap: 6px;
          position: relative;
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

        /* Companies Container Styles */
        .pm-company-selector-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 25px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 10px;
        }

        .pm-company-dropdown-wrapper {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .pm-company-dropdown-wrapper label {
          font-weight: 500;
          color: #333;
        }

        .pm-select {
          padding: 8px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: white;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pm-select:hover {
          border-color: #667eea;
        }

        .pm-select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .pm-date-range-selector {
          display: flex;
          gap: 5px;
        }

        .pm-date-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: white;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .pm-date-btn:hover {
          background: #f5f5f5;
        }

        .pm-date-btn.active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        /* Company Metrics Grid */
        .pm-company-metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .pm-metric-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .pm-metric-card h4 {
          margin: 0 0 10px 0;
          font-size: 14px;
          opacity: 0.9;
        }

        .pm-metric-main {
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 5px;
        }

        .pm-metric-sub {
          font-size: 12px;
          opacity: 0.8;
        }

        /* Products Grid */
        .pm-products-filters {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 10px;
        }

        .pm-search-input {
          flex: 1;
          padding: 10px 15px;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 14px;
        }

        .pm-search-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .pm-products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }

        /* Compare Mode Styles */
        .pm-compare-header {
          background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
        }

        .pm-compare-selectors {
          display: flex;
          align-items: center;
          gap: 20px;
          justify-content: center;
        }

        .pm-compare-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .pm-compare-item label {
          font-weight: 600;
          color: #333;
          font-size: 14px;
        }

        .pm-vs-divider {
          font-size: 24px;
          font-weight: 700;
          color: #667eea;
          margin: 20px 10px 0;
        }

        .pm-primary-btn {
          padding: 12px 30px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 20px;
        }

        .pm-primary-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        /* Promos Container Styles */
        .pm-promos-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .pm-promo-stat {
          text-align: center;
          padding: 25px;
          background: white;
          border-radius: 12px;
          border: 2px solid #f0f0f0;
          transition: all 0.3s ease;
        }

        .pm-promo-stat:hover {
          border-color: #667eea;
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(0,0,0,0.1);
        }

        .pm-promo-number {
          font-size: 36px;
          font-weight: 700;
          color: #667eea;
          margin-bottom: 8px;
        }

        .pm-promo-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .pm-timeline-container,
        .pm-list-container {
          background: white;
          border: 1px solid #e0e0e0;
          border-radius: 12px;
          padding: 20px;
          min-height: 200px;
          margin-top: 15px;
        }

        .pm-promos-timeline h3,
        .pm-promos-list h3 {
          font-size: 18px;
          color: #333;
          margin-bottom: 15px;
        }

        /* Table Container */
        .pm-table-container {
          background: white;
          border-radius: 12px;
          padding: 20px;
          overflow-x: auto;
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

    // Hide all containers
    const containers = [
      'pmMarketOverviewContainer',
      'pmCompaniesContainer',
      'pmProductsContainer',
      'pmCompareModeContainer',
      'pmPromosContainer'
    ];

    containers.forEach(id => {
      const container = document.getElementById(id);
      if (container) {
        container.style.display = 'none';
      }
    });

    // Show selected container
    let targetContainer;
    switch(view) {
      case 'market-overview':
        targetContainer = document.getElementById('pmMarketOverviewContainer');
        if (targetContainer) {
          targetContainer.style.display = 'block';
          loadMarketOverviewData();
        }
        break;
      case 'companies':
        targetContainer = document.getElementById('pmCompaniesContainer');
        if (targetContainer) {
          targetContainer.style.display = 'block';
          loadCompaniesData();
        }
        break;
      case 'products':
        targetContainer = document.getElementById('pmProductsContainer');
        if (targetContainer) {
          targetContainer.style.display = 'block';
          loadProductsData();
        }
        break;
      case 'compare-mode':
        targetContainer = document.getElementById('pmCompareModeContainer');
        if (targetContainer) {
          targetContainer.style.display = 'block';
          loadCompareModeData();
        }
        break;
      case 'promos':
        targetContainer = document.getElementById('pmPromosContainer');
        if (targetContainer) {
          targetContainer.style.display = 'block';
          loadPromosData();
        }
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
