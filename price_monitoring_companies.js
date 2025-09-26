// price_monitoring_companies.js
// Price Monitoring - Companies View Module

function initializePriceMonitoringCompanies() {
  console.log('[PM Companies] Initializing companies view module');
  
  // Only initialize if we're on the companies view
  const companiesWrapper = document.getElementById('pmCompaniesWrapper');
  if (!companiesWrapper) return;
  
  // Add companies-specific styles
  addCompaniesViewStyles();
  
  // Initialize the companies dashboard
  renderCompaniesDashboard();
}

function addCompaniesViewStyles() {
  if (document.getElementById('pmCompaniesStyles')) return;
  
  const styles = `
    <style id="pmCompaniesStyles">
      /* Companies View Specific Styles */
      .pm-companies-dashboard {
        width: 100%;
        height: 100%;
      }
      
      /* Adjusted grid layout for 33:77 ratio */
      .pm-companies-main-grid {
        display: grid;
        grid-template-columns: 460px 1fr;
        gap: 10px;
        width: 100%;
        height: calc(100vh - 400px);
        max-height: 800px;
      }
      
/* Company overview card - EXACTLY matching temperature card dimensions */
      .pm-company-overview-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        width: 420px;
        /* Same structure as temperature card */
      }
      
      .pm-company-overview-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      /* Company header matching temperature card header */
      .pm-company-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      
      .pm-company-header h4 {
        margin: 0;
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      /* Stats row */
      .pm-company-stats-row {
        display: flex;
        justify-content: space-around;
        align-items: center;
        padding: 20px 0;
      }
      
      .pm-rank-container,
      .pm-market-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
      }
      
      .section-label {
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      .big-rank-box {
        width: 100px;
        height: 100px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 42px;
        font-weight: 900;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
      }
      
      .big-market-circle {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 900;
        color: #007aff;
        background: white;
        border: 3px solid #007aff;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
      }
      
      .market-water-fill {
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
      
      .market-value-text {
        position: relative;
        z-index: 1;
      }
      
      /* Company buckets card - renamed from pm-buckets-card */
      .pm-company-buckets-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        flex: 1;
        position: relative;
      }
      
      .pm-company-buckets-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #4CAF50, #9C27B0);
      }
      
      /* Company buckets table */
      .pm-company-buckets-table {
        margin-top: 12px;
      }
      
      .pm-company-buckets-header {
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
      
      .pm-company-buckets-body {
        max-height: 600px;
        overflow-y: auto;
      }
      
      .pm-company-bucket-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        min-height: 50px;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
        position: relative;
        transition: background 0.2s;
      }
      
      .pm-company-bucket-row:hover {
        background: #fafafa;
      }
      
/* CPI Chart styles */
      .pm-cpi-chart-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        height: 310px; /* Increased from 250px */
      }
      
      .pm-cpi-chart {
        width: 100%;
        height: 260px; /* Increased from 200px */
      }
      
      /* Adjusted chart card for companies view */
      .pm-companies-chart-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        gap: 15px;
      }
      
      .pm-companies-charts-row {
        display: grid;
        grid-template-rows: 1fr 1fr;
        gap: 15px;
        height: 100%;
      }

/* Company buckets data section */
      .pm-company-data {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
      }
      
      /* Copy exact styles from price_monitoring.js */
      .pm-tree-bar-container {
        flex: 1;
        height: 30px;
        position: relative;
        background: #f5f5f5;
        border-radius: 6px;
        overflow: hidden;
        max-width: 200px;
      }
      
      .pm-tree-bar {
        height: 100%;
        display: flex;
        align-items: center;
        position: relative;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.85;
      }
      
      /* Percentage text EXACTLY as in price_monitoring.js */
      .pm-bar-percent-outside {
        position: absolute;
        font-size: 11px;
        font-weight: 600;
        color: #444;
        line-height: 30px;
        z-index: 2;
        right: 8px;
      }
      
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
      
      .pm-discount-badge {
        display: inline-block;
        padding: 2px 6px;
        background: #ff4444;
        color: white;
        border-radius: 4px;
        font-size: 10px;
        font-weight: 600;
      }
      
      .pm-discount-badge-empty {
        display: inline-block;
        padding: 2px 6px;
        color: #ccc;
        font-size: 10px;
      }
      
      .pm-tree-metrics {
        display: flex;
        align-items: center;
        gap: 5px;
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
      
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

async function renderCompaniesDashboard() {
  const container = document.getElementById('pmCompaniesWrapperContainer');
  if (!container) return;
  
  try {
    // Use the exported loadCompanyPricingData function
    const data = await window.pmUtils.loadCompanyPricingData();
    if (!data || !data.allData) {
      console.error('[PM Companies] No data available');
      container.innerHTML = '<div class="pm-error">No data available</div>';
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
      console.error('[PM Companies] Market or company data not found');
      container.innerHTML = '<div class="pm-error">Data not found</div>';
      return;
    }
    
    // Build the dashboard HTML
    let html = `
      <div class="pm-companies-dashboard">
        <!-- Top Section with Company Overview and Stats -->
        <div class="pm-top-section">
<!-- Company Overview Card -->
          <div class="pm-company-overview-card">
            <div class="pm-company-header">
              <h4>${companyName}</h4>
            </div>
            <div class="pm-company-stats-row">
              <div class="pm-rank-container">
                <div class="section-label">COMPANY RANK</div>
                <div class="big-rank-box">
                  <span id="pmCompanyRankValue">—</span>
                </div>
              </div>
              <div class="pm-market-container">
                <div class="section-label">MARKET SHARE</div>
                <div class="big-market-circle">
                  <div class="market-water-fill" id="pmCompanyMarketFill"></div>
                  <span class="market-value-text" id="pmCompanyMarketValue">—</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Price Range Card (reuse from main) -->
          <div class="pm-price-range-card">
            <h4>Price Range</h4>
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
            <div class="pm-range-row company">
              <span class="pm-range-label" id="pmCompanyRangeLabel">${companyName}</span>
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
          
          <!-- Key Metrics Cards -->
          <div class="pm-quick-stats">
            <div class="pm-stat-item">
              <div class="pm-stat-info">
                <div class="pm-stat-grid">
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyProducts">—</span>
                    <span class="pm-stat-lbl">Products</span>
                  </div>
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyDiscounted">—</span>
                    <span class="pm-stat-lbl">Discounted</span>
                  </div>
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyDiscountRate">—</span>
                    <span class="pm-stat-lbl">Discount Rate</span>
                  </div>
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyAvgDiscount">—</span>
                    <span class="pm-stat-lbl">Avg Discount</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Main Content Grid with adjusted ratio -->
        <div class="pm-companies-main-grid">
          <!-- Left Column (33%) -->
          <div class="pm-left-column">
            <!-- Company Buckets Distribution -->
            <div class="pm-company-buckets-card">
              <h4>Company Price Buckets</h4>
              <div class="pm-company-buckets-table">
                <div class="pm-company-buckets-header">
                  <span>Bucket</span>
                  <span>${companyName}</span>
                </div>
                <div id="pmCompanyBucketsBody" class="pm-company-buckets-body">
                  <!-- Buckets will be populated here -->
                </div>
              </div>
            </div>
            
            <!-- Metrics Row -->
            <div class="pm-metrics-row">
              <div class="pm-metric-mini">
                <h5>Price Volatility</h5>
                <div class="pm-metric-display">
                  <span class="pm-metric-val" id="pmCompanyVolatility">—</span>
                  <span class="pm-metric-status" id="pmCompanyVolatilityLabel">—</span>
                </div>
                <div class="pm-metric-bar">
                  <div class="pm-metric-fill volatility" id="pmCompanyVolatilityBar"></div>
                </div>
              </div>
              
              <div class="pm-metric-mini">
                <h5>Price Leadership</h5>
                <div class="pm-metric-display">
                  <span class="pm-metric-val" id="pmCompanyLeadership">—</span>
                  <span class="pm-metric-status" id="pmCompanyLeadershipLabel">—</span>
                </div>
                <div class="pm-metric-bar">
                  <div class="pm-metric-fill leadership" id="pmCompanyLeadershipBar"></div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Right Column (77%) -->
          <div class="pm-right-column">
            <div class="pm-companies-chart-card">
              <div class="pm-companies-charts-row">
<!-- Products & Discounts Trend Chart -->
                <div class="pm-chart-section">
                  <div class="pm-chart-header">
                    <h4>Products & Discounts Trend</h4>
                    <div class="pm-chart-legend">
                      <span class="pm-legend-item" style="--color: #2196F3">Total Products</span>
                      <span class="pm-legend-item" style="--color: #FF9800">Discounted</span>
                      <span class="pm-legend-item" style="--color: #4CAF50">Discount Depth</span>
                    </div>
                  </div>
                  <div class="pm-chart-wrapper">
                    <div id="pmCompanyProductsChart"></div>
                  </div>
                </div>
                
                <!-- CPI Trend Chart -->
                <div class="pm-cpi-chart-container">
                  <h4>CPI Market Position</h4>
                  <div class="pm-cpi-chart">
                    <div id="pmCpiTrendChart"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    container.innerHTML = html;
    
    // Populate the dashboard with data
    await populateCompaniesDashboard({
      myCompany: myCompanyData,
      market: marketData,
      allData: data.allData
    });
    
  } catch (error) {
    console.error('[PM Companies] Error rendering dashboard:', error);
    container.innerHTML = '<div class="pm-error">Error loading companies data</div>';
  }
}

async function populateCompaniesDashboard(data) {
  const myCompanyData = data.myCompany;
  const marketData = data.market;
  
  if (!myCompanyData) {
    console.error('[PM Companies] No company data available');
    return;
  }
  
  // 1. Update Company Overview Card
  await updateCompanyOverviewCard(myCompanyData);
  
  // 2. Update Price Range
  updateCompanyPriceRange(marketData, myCompanyData);
  
  // 3. Update Key Metrics
  updateCompanyKeyMetrics(myCompanyData);
  
  // 4. Update Company Buckets
  updateCompanyBuckets(myCompanyData);
  
  // 5. Update Volatility and Leadership
  updateCompanyVolatilityLeadership(myCompanyData);
  
  // 6. Render Products & Discounts Chart
  renderCompanyProductsChart(myCompanyData);
  
  // 7. Render CPI Trend Chart
  await renderCpiTrendChart(myCompanyData, data.allData);
}

async function updateCompanyOverviewCard(companyData) {
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
    console.log('[PM Companies] Looking for stats table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Companies] projectData object store not found');
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Companies] No stats data found');
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
          const rankElement = document.getElementById('pmCompanyRankValue');
          if (rankElement && rankValue) {
            rankElement.textContent = Math.round(parseFloat(rankValue));
          }
          
          // Update market share
          const marketShare = parseFloat(companyStats['7d_market_share']) * 100;
          const marketElement = document.getElementById('pmCompanyMarketValue');
          const marketFill = document.getElementById('pmCompanyMarketFill');
          
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
        console.error('[PM Companies] Error getting stats data:', getRequest.error);
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Companies] Failed to open database:', request.error);
    };
  } catch (error) {
    console.error('[PM Companies] Error fetching company stats:', error);
  }
}

function updateCompanyPriceRange(market, company) {
  // Market prices
  document.getElementById('pmMarketMinPrice').textContent = `$${window.pmUtils.formatNumber(market.cheapest_product, 0)}`;
  document.getElementById('pmMarketMedianPrice').textContent = `$${window.pmUtils.formatNumber(market.median_price, 0)}`;
  document.getElementById('pmMarketMaxPrice').textContent = `$${window.pmUtils.formatNumber(market.most_expensive_product, 0)}`;
  
  // Company prices
  if (company) {
    document.getElementById('pmCompanyMinPrice').textContent = `$${window.pmUtils.formatNumber(company.cheapest_product, 0)}`;
    document.getElementById('pmCompanyMedianPrice').textContent = `$${window.pmUtils.formatNumber(company.median_price, 0)}`;
    document.getElementById('pmCompanyMaxPrice').textContent = `$${window.pmUtils.formatNumber(company.most_expensive_product, 0)}`;
  }
}

function updateCompanyKeyMetrics(companyData) {
  const totalProducts = parseInt(companyData.unique_total_products) || 0;
  const discountedProducts = parseInt(companyData.unique_discounted_products) || 0;
  const discountRate = parseFloat(companyData.unique_pr_discounted_products) || 0;
  const avgDiscount = parseFloat(companyData.unique_discount_depth) || 0;
  
  document.getElementById('pmCompanyProducts').textContent = totalProducts;
  document.getElementById('pmCompanyDiscounted').textContent = discountedProducts;
  document.getElementById('pmCompanyDiscountRate').textContent = `${(discountRate * 100).toFixed(1)}%`;
  document.getElementById('pmCompanyAvgDiscount').textContent = avgDiscount > 0 ? `${avgDiscount.toFixed(1)}%` : '—';
}

function updateCompanyBuckets(companyData) {
  const bucketsBody = document.getElementById('pmCompanyBucketsBody');
  if (!bucketsBody) return;
  
  // Define buckets based on company data
  const buckets = [
    {
      name: 'Ultra Premium',
      range: companyData.price_range?.[5],
      count: companyData.ultra_premium_bucket,
      share: companyData.ultra_premium_bucket_share,
      discounted: companyData.disc_ultra_premium_bucket,
      discount_depth: companyData.disc_depth_ultra_premium_bucket,
      color: '#9C27B0'
    },
    {
      name: 'Premium',
      range: companyData.price_range?.[4],
      count: companyData.premium_bucket,
      share: companyData.premium_bucket_share,
      discounted: companyData.disc_premium_bucket,
      discount_depth: companyData.disc_depth_premium_bucket,
      color: '#7B1FA2'
    },
    {
      name: 'Upper Mid',
      range: companyData.price_range?.[3],
      count: companyData.upper_mid_bucket,
      share: companyData.upper_mid_bucket_share,
      discounted: companyData.disc_upper_mid_bucket,
      discount_depth: companyData.disc_depth_upper_mid_bucket,
      color: '#FFC107'
    },
    {
      name: 'Mid Range',
      range: companyData.price_range?.[2],
      count: companyData.mid_bucket,
      share: companyData.mid_bucket_share,
      discounted: companyData.disc_mid_bucket,
      discount_depth: companyData.disc_depth_mid_bucket,
      color: '#FF9800'
    },
    {
      name: 'Budget',
      range: companyData.price_range?.[1],
      count: companyData.budget_bucket,
      share: companyData.budget_bucket_share,
      discounted: companyData.disc_budget_bucket,
      discount_depth: companyData.disc_depth_budget_bucket,
      color: '#66BB6A'
    },
    {
      name: 'Ultra Cheap',
      range: companyData.price_range?.[0],
      count: companyData.ultra_cheap_bucket,
      share: companyData.ultra_cheap_bucket_share,
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
    const discounted = parseInt(bucket.discounted) || 0;
    const discountDepth = parseFloat(bucket.discount_depth) || 0;
    const range = bucket.range?.price_range || '—';
    const sharePercent = (share * 100).toFixed(1);
    
bucketsHTML += `
      <div class="pm-company-bucket-row">
        <div class="pm-bucket-label">
          <div class="pm-bucket-name">
            <span class="pm-bucket-indicator" style="background: ${bucket.color}"></span>
            <span>${bucket.name}</span>
          </div>
          <div class="pm-bucket-range">${range}</div>
        </div>
        <div class="pm-company-data">
          <div class="pm-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
            <span class="pm-products-count">${count}</span>
            ${discounted > 0 ? `
              <span class="pm-products-sep">/</span>
              <span class="pm-discounted-count">${discounted}</span>
            ` : ''}
          </div>
          ${discountDepth > 0 ? 
            `<span class="pm-discount-badge">${discountDepth.toFixed(1)}%</span>` : 
            '<span class="pm-discount-badge-empty">—</span>'}
          <div class="pm-tree-bar-container">
            ${sharePercent > 0 ? 
              `<div class="pm-tree-bar" style="width: ${sharePercent}%; background: ${bucket.color};"></div>` : 
              ''}
            <span class="pm-bar-percent-outside">${sharePercent}%</span>
          </div>
        </div>
      </div>
    `;
  });
  
  bucketsBody.innerHTML = bucketsHTML;
}

function updateCompanyVolatilityLeadership(companyData) {
  // Update volatility
  const volatility = parseFloat(companyData.volatility) || 0;
  const volatilityBar = document.getElementById('pmCompanyVolatilityBar');
  const volatilityValue = document.getElementById('pmCompanyVolatility');
  const volatilityLabel = document.getElementById('pmCompanyVolatilityLabel');
  
  if (volatilityBar) volatilityBar.style.width = `${Math.min(100, volatility * 100)}%`;
  if (volatilityValue) volatilityValue.textContent = volatility.toFixed(2);
  if (volatilityLabel) {
    let label = 'Stable';
    if (volatility > 0.8) label = 'Very High';
    else if (volatility > 0.6) label = 'High';
    else if (volatility > 0.4) label = 'Moderate';
    else if (volatility > 0.2) label = 'Low';
    volatilityLabel.textContent = label;
  }
  
  // Update leadership
  const leadership = parseInt(companyData.price_leadership) || 0;
  const leadershipBar = document.getElementById('pmCompanyLeadershipBar');
  const leadershipValue = document.getElementById('pmCompanyLeadership');
  const leadershipLabel = document.getElementById('pmCompanyLeadershipLabel');
  
  if (leadershipBar) leadershipBar.style.width = `${leadership}%`;
  if (leadershipValue) leadershipValue.textContent = `${leadership}%`;
  if (leadershipLabel) {
    let label = 'Follower';
    if (leadership > 80) label = 'Leader';
    else if (leadership > 60) label = 'Strong';
    else if (leadership > 40) label = 'Moderate';
    else if (leadership > 20) label = 'Weak';
    leadershipLabel.textContent = label;
  }
}

function renderCompanyProductsChart(companyData) {
  const chartEl = document.getElementById('pmCompanyProductsChart');
  if (!chartEl || !companyData.historical_data) return;
  
  // Destroy existing chart if any
  if (window.pmCompanyProductsChartInstance) {
    window.pmCompanyProductsChartInstance.destroy();
    window.pmCompanyProductsChartInstance = null;
  }
  
  // Prepare data - exactly like in price_monitoring.js
  const chartData = companyData.historical_data.slice(-30).map(d => ({
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
      height: 240,
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
    colors: ['#2196F3', '#FF9800', '#4CAF50'], // Same colors as price_monitoring.js
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
      show: false  // Hide legend as it's shown in the header
    },
    tooltip: {
      shared: true,
      intersect: false,
      x: { format: 'dd MMM yyyy' }
    }
  };
  
  window.pmCompanyProductsChartInstance = new ApexCharts(chartEl, options);
  window.pmCompanyProductsChartInstance.render();
}

async function renderCpiTrendChart(myCompanyData, allData) {
  const ctx = document.getElementById('pmCpiTrendChart');
  if (!ctx) return;
  
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
    console.log('[PM Companies] Looking for stats table for CPI chart:', tableName);
    
    // Use Promise to handle IndexedDB async operation
    const statsData = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('projectData')) {
          console.error('[PM Companies] projectData object store not found');
          db.close();
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        const getRequest = objectStore.get(tableName);
        
        getRequest.onsuccess = function() {
          const result = getRequest.result;
          db.close();
          resolve(result);
        };
        
        getRequest.onerror = function() {
          console.error('[PM Companies] Error getting stats data:', getRequest.error);
          db.close();
          resolve(null);
        };
      };
      
      request.onerror = function() {
        console.error('[PM Companies] Failed to open database:', request.error);
        resolve(null);
      };
    });
    
    if (!statsData || !statsData.data) {
      console.error('[PM Companies] No stats data available for CPI chart');
      ctx.innerHTML = '<div class="pm-no-data">No data available for CPI chart</div>';
      return;
    }
    
    // Find top 5 companies (q=all, location_requested=all, device=all, source != all)
    const companyRecords = statsData.data
      .filter(row => 
        row.q === 'all' && 
        row.location_requested === 'all' && 
        row.device === 'all' && 
        row.source !== 'all'
      )
      .sort((a, b) => {
        const rankA = parseFloat(a['7d_rank']) || 999;
        const rankB = parseFloat(b['7d_rank']) || 999;
        return rankA - rankB;
      })
      .slice(0, 5);
    
    const top5Companies = companyRecords.map(r => r.source);
    console.log('[PM Companies] Top 5 companies:', top5Companies);
    
    // Prepare datasets for the chart
    const datasets = [];
    const colors = [
      'rgb(102, 126, 234)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)'
    ];
    
    // Get labels from myCompany data
    const myCompanyHistorical = myCompanyData.historical_data || [];
    const last30Days = myCompanyHistorical.slice(-30);
    const labels = last30Days.map(day => day.date?.value).filter(Boolean);
    
    // Add baseline (CPI = 1)
    const baselineData = new Array(labels.length).fill(1);
    datasets.push({
      name: 'Market Average',
      data: baselineData,
      type: 'line',
      color: 'rgb(200, 200, 200)'
    });
    
    // Add myCompany CPI data
    const myCompanyCpiData = last30Days.map(day => parseFloat(day.cpi) || 1);
    datasets.push({
      name: myCompanyData.source,
      data: myCompanyCpiData,
      type: 'line',
      color: 'rgb(102, 126, 234)'
    });
    
    // Add top 5 companies CPI data (excluding myCompany if it's in top 5)
    let colorIndex = 1;
    for (const companyName of top5Companies) {
      if (companyName === myCompanyData.source) continue; // Skip if it's myCompany
      
      // Find company pricing data
      const companyPricingData = allData.find(row => 
        row.source === companyName && row.q === 'all'
      );
      
      if (companyPricingData && companyPricingData.historical_data) {
        const companyLast30Days = companyPricingData.historical_data.slice(-30);
        const companyCpiData = companyLast30Days.map(day => parseFloat(day.cpi) || 1);
        
        datasets.push({
          name: companyName,
          data: companyCpiData,
          type: 'line',
          color: colors[colorIndex]
        });
        
        colorIndex++;
        if (colorIndex >= colors.length) break;
      }
    }
    
    // Create ApexCharts chart
    if (window.pmCpiChartInstance) {
      window.pmCpiChartInstance.destroy();
      window.pmCpiChartInstance = null;
    }

// After preparing all datasets, calculate the max CPI value
    let maxCpiValue = 1.0; // Start with baseline
    
    // Check all datasets for max value
    datasets.forEach(dataset => {
      if (dataset.data && Array.isArray(dataset.data)) {
        dataset.data.forEach(value => {
          if (value > maxCpiValue) {
            maxCpiValue = value;
          }
        });
      }
    });
    
    // Add 10% padding to the max value
    const yAxisMax = maxCpiValue * 1.1;
    
    // Update the chart options yaxis
    const options = {
      series: datasets,
      chart: {
        type: 'line',
        height: 260,
        toolbar: { show: false },
        zoom: { enabled: false }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: 'smooth',
        width: datasets.map((d, i) => {
          // Make myCompany line (index 1) bold
          return i === 1 ? 4 : 2;
        }),
        dashArray: datasets.map((d, i) => {
          // First series (baseline) is dashed
          return i === 0 ? 5 : 0;
        })
      },
      colors: datasets.map(d => d.color),
      xaxis: {
        categories: labels,
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
      yaxis: {
        min: 0.5,
        max: yAxisMax, // Use calculated max instead of fixed value
        title: {
          text: 'CPI (Market Avg = 1.0)',
          style: { fontSize: '11px' }
        },
        labels: {
          formatter: val => val.toFixed(1),
          style: { fontSize: '10px' }
        }
      },
      grid: {
        borderColor: '#e7e7e7',
        row: {
          colors: ['#f3f3f3', 'transparent'],
          opacity: 0.5
        },
        padding: {
          top: 10,
          right: 10,
          bottom: 0,
          left: 10
        }
      },
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '10px',
        offsetY: -5,
        markers: {
          width: 8,
          height: 8,
          strokeWidth: 0,
          radius: 12
        }
      },
      tooltip: {
        shared: true,
        intersect: false,
        x: { format: 'dd MMM' },
        y: {
          formatter: function(value) {
            return value ? value.toFixed(3) : '—';
          }
        }
      }
    };
    
    window.pmCpiChartInstance = new ApexCharts(ctx, options);
    window.pmCpiChartInstance.render();
    
  } catch (error) {
    console.error('[PM Companies] Error rendering CPI chart:', error);
    ctx.innerHTML = '<div class="pm-no-data">Error loading CPI chart</div>';
  }
}

// Helper functions
function formatNumber(value, decimals = 0) {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Export functions for use in main price_monitoring.js
window.pmCompaniesModule = {
  initialize: initializePriceMonitoringCompanies,
  renderDashboard: renderCompaniesDashboard
};
