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
      
      /* Company overview card - replacing temperature card */
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
        height: 100%;
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
      
      /* Company name header */
      .company-name-header {
        height: 80px;
        width: 100%;
        font-size: 18px;
        font-weight: 800;
        color: #ffffff;
        text-align: center;
        margin-bottom: 15px;
        padding: 0 16px;
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
        position: relative;
        overflow: hidden;
      }
      
      /* Rank and market share containers */
      .pm-company-stats-row {
        display: flex;
        gap: 20px;
        margin-top: 20px;
        flex: 1;
        align-items: flex-start;
      }
      
      .pm-rank-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .pm-market-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
      }
      
      .big-rank-box {
        width: 120px;
        height: 120px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        font-weight: 900;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
        position: relative;
        margin-top: 10px;
      }
      
      .big-market-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: 900;
        color: #007aff;
        background: white;
        border: 3px solid #007aff;
        position: relative;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
        margin-top: 10px;
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
        height: 250px;
      }
      
      .pm-cpi-chart {
        width: 100%;
        height: 200px;
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
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

async function renderCompaniesDashboard() {
  const container = document.getElementById('pmCompaniesWrapperContainer');
  if (!container) return;
  
  try {
    // Fetch the pricing data
    const data = await fetchPriceMonitoringData();
    if (!data) return;
    
    const myCompanyData = data.myCompany;
    const marketData = data.market;
    const companyName = myCompanyData?.source || 'Company';
    
    // Build the dashboard HTML
    let html = `
      <div class="pm-companies-dashboard">
        <!-- Top Section with Company Overview and Stats -->
        <div class="pm-top-section">
          <!-- Company Overview Card -->
          <div class="pm-company-overview-card">
            <div class="company-name-header">${companyName}</div>
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
            <div class="pm-price-range-content">
              <div class="pm-price-range-row">
                <span class="pm-range-label">Market</span>
                <div class="pm-range-values">
                  <span class="pm-price-point">
                    <span class="pm-price-label">Min</span>
                    <span class="pm-price-value" id="pmMarketMinPrice">$—</span>
                  </span>
                  <span class="pm-price-point">
                    <span class="pm-price-label">Median</span>
                    <span class="pm-price-value median" id="pmMarketMedianPrice">$—</span>
                  </span>
                  <span class="pm-price-point">
                    <span class="pm-price-label">Max</span>
                    <span class="pm-price-value" id="pmMarketMaxPrice">$—</span>
                  </span>
                </div>
              </div>
              <div class="pm-price-range-row">
                <span class="pm-range-label" id="pmCompanyRangeLabel">${companyName}</span>
                <div class="pm-range-values">
                  <span class="pm-price-point">
                    <span class="pm-price-label">Min</span>
                    <span class="pm-price-value" id="pmCompanyMinPrice">$—</span>
                  </span>
                  <span class="pm-price-point">
                    <span class="pm-price-label">Median</span>
                    <span class="pm-price-value median" id="pmCompanyMedianPrice">$—</span>
                  </span>
                  <span class="pm-price-point">
                    <span class="pm-price-label">Max</span>
                    <span class="pm-price-value" id="pmCompanyMaxPrice">$—</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Key Metrics Cards (reuse from main) -->
          <div class="pm-quick-stats">
            <div class="pm-stat-item">
              <div class="pm-stat-icon">📦</div>
              <div class="pm-stat-info">
                <div class="pm-stat-grid">
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyProducts">—</span>
                    <span class="pm-stat-lbl">Total Products</span>
                  </div>
                  <div class="pm-stat-cell">
                    <span class="pm-stat-val" id="pmCompanyDiscounted">—</span>
                    <span class="pm-stat-lbl">On Discount</span>
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
            
            <!-- Metrics Row (reuse from main) -->
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
                  <h4>Products & Discounts Trend</h4>
                  <div class="pm-chart-wrapper">
                    <canvas id="pmCompanyProductsChart"></canvas>
                  </div>
                </div>
                
                <!-- CPI Trend Chart -->
                <div class="pm-cpi-chart-container">
                  <h4>CPI Market Position</h4>
                  <div class="pm-cpi-chart">
                    <canvas id="pmCpiTrendChart"></canvas>
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
    await populateCompaniesDashboard(data);
    
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
    await openDatabase();
    const statsData = await fetchFromIDB(`acc${accountNumber}_pr${window.filterState?.activeProjectNumber || 2}_company_serp_stats`);
    
    if (statsData && statsData.data) {
      // Find the company's overall rank (q=all, location=all, device=all)
      const companyStats = statsData.data.find(row => 
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
    }
  } catch (error) {
    console.error('[PM Companies] Error fetching company stats:', error);
  }
}

function updateCompanyPriceRange(market, company) {
  // Market prices
  document.getElementById('pmMarketMinPrice').textContent = `$${formatNumber(market.cheapest_product, 0)}`;
  document.getElementById('pmMarketMedianPrice').textContent = `$${formatNumber(market.median_price, 0)}`;
  document.getElementById('pmMarketMaxPrice').textContent = `$${formatNumber(market.most_expensive_product, 0)}`;
  
  // Company prices
  if (company) {
    document.getElementById('pmCompanyMinPrice').textContent = `$${formatNumber(company.cheapest_product, 0)}`;
    document.getElementById('pmCompanyMedianPrice').textContent = `$${formatNumber(company.median_price, 0)}`;
    document.getElementById('pmCompanyMaxPrice').textContent = `$${formatNumber(company.most_expensive_product, 0)}`;
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
          <div class="pm-tree-metrics">
            <div class="pm-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
              <span class="pm-products-count">${count}</span>
              ${discounted > 0 ? `
                <span class="pm-products-sep">/</span>
                <span class="pm-discounted-count">${discounted}</span>
              ` : ''}
            </div>
            ${discountDepth > 0 ? 
              `<span class="pm-discount-badge">${discountDepth.toFixed(1)}%</span>` : 
              ''}
            <span class="pm-share-text">${sharePercent}%</span>
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
  const ctx = document.getElementById('pmCompanyProductsChart');
  if (!ctx) return;
  
  // Extract historical data
  const historicalData = companyData.historical_data || [];
  const last30Days = historicalData.slice(-30);
  
  // Prepare chart data
  const labels = [];
  const productsData = [];
  const discountedData = [];
  
  last30Days.forEach(day => {
    if (day.date && day.date.value) {
      labels.push(day.date.value);
      productsData.push(parseInt(day.total_products) || 0);
      discountedData.push(parseInt(day.discounted_products) || 0);
    }
  });
  
  // Create chart
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Total Products',
          data: productsData,
          borderColor: 'rgb(102, 126, 234)',
          backgroundColor: 'rgba(102, 126, 234, 0.1)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Discounted Products',
          data: discountedData,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top'
        },
        tooltip: {
          mode: 'index',
          intersect: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            maxTicksLimit: 10,
            callback: function(value, index) {
              // Show every 3rd label
              return index % 3 === 0 ? this.getLabelForValue(value) : '';
            }
          }
        }
      }
    }
  });
}

async function renderCpiTrendChart(myCompanyData, allData) {
  const ctx = document.getElementById('pmCpiTrendChart');
  if (!ctx) return;
  
  try {
    // Get top 5 companies from company_serp_stats
    await openDatabase();
    const statsData = await fetchFromIDB(`acc${accountNumber}_pr${window.filterState?.activeProjectNumber || 2}_company_serp_stats`);
    
    if (!statsData || !statsData.data) {
      console.error('[PM Companies] No stats data available');
      return;
    }
    
    // Find top 5 companies (q=all, location=all, device=all, source != all)
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
    
    // Prepare datasets for the chart
    const datasets = [];
    const colors = [
      'rgb(102, 126, 234)',
      'rgb(255, 99, 132)',
      'rgb(54, 162, 235)',
      'rgb(255, 206, 86)',
      'rgb(75, 192, 192)'
    ];
    
    // Add baseline (CPI = 1)
    const baselineData = new Array(30).fill(1);
    datasets.push({
      label: 'Market Average',
      data: baselineData,
      borderColor: 'rgb(200, 200, 200)',
      borderWidth: 2,
      borderDash: [5, 5],
      fill: false,
      tension: 0
    });
    
    // Add myCompany CPI data
    const myCompanyCpiData = [];
    const myCompanyHistorical = myCompanyData.historical_data || [];
    const last30Days = myCompanyHistorical.slice(-30);
    const labels = [];
    
    last30Days.forEach(day => {
      if (day.date && day.date.value) {
        labels.push(day.date.value);
        myCompanyCpiData.push(parseFloat(day.cpi) || 1);
      }
    });
    
    // Add myCompany dataset
    datasets.push({
      label: myCompanyData.source,
      data: myCompanyCpiData,
      borderColor: 'rgb(102, 126, 234)',
      backgroundColor: 'rgba(102, 126, 234, 0.1)',
      borderWidth: 3,
      fill: true,
      tension: 0.4
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
        const companyCpiData = [];
        const companyLast30Days = companyPricingData.historical_data.slice(-30);
        
        companyLast30Days.forEach(day => {
          companyCpiData.push(parseFloat(day.cpi) || 1);
        });
        
        datasets.push({
          label: companyName,
          data: companyCpiData,
          borderColor: colors[colorIndex],
          borderWidth: 1,
          fill: false,
          tension: 0.4,
          borderDash: [2, 2]
        });
        
        colorIndex++;
        if (colorIndex >= colors.length) break;
      }
    }
    
    // Create the chart
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              boxWidth: 12,
              padding: 10,
              font: {
                size: 10
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                label += context.parsed.y.toFixed(3);
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            min: 0.5,
            max: 3,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.05)'
            },
            ticks: {
              callback: function(value) {
                return value.toFixed(1);
              }
            },
            title: {
              display: true,
              text: 'CPI (Market Avg = 1.0)'
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              maxTicksLimit: 10,
              callback: function(value, index) {
                return index % 3 === 0 ? this.getLabelForValue(value) : '';
              }
            }
          }
        }
      }
    });
    
  } catch (error) {
    console.error('[PM Companies] Error rendering CPI chart:', error);
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
