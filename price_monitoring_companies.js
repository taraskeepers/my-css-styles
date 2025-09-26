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
      /* Companies View - INDEPENDENT Styles */
      .pmc-dashboard {
        width: 100%;
        height: 100%;
      }
      
      /* Top Section - Companies specific */
      .pmc-top-section {
        display: grid;
        grid-template-columns: 420px 1fr 650px;
        gap: 15px;
        margin-bottom: 15px;
        width: 100%;
      }
      
      /* Company overview card - EXACT height of temperature card */
      .pmc-company-overview-card {
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
      }
      
      .pmc-company-overview-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      /* Company name styled EXACTLY like product_explorer.js */
      .company-name-header {
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
      
      .pm-rank-container,
      .pm-market-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      
      .section-label {
        font-size: 10px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      
      .big-rank-box {
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
      
      .big-market-circle {
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
      
      /* Company Price Range & Metrics Card */
      .pmc-company-performance-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        display: flex;
        flex-direction: column;
        gap: 15px;
        position: relative;
        overflow: hidden;
      }
      
      .pmc-company-performance-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      .pmc-price-range-values {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .pmc-range-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex: 1;
      }
      
      .pmc-range-item.median {
        transform: scale(1.15);
        padding: 0 10px;
      }
      
      .pmc-range-value {
        font-size: 14px;
        font-weight: 700;
        color: #2c2c2c;
      }
      
      .pmc-range-item.median .pmc-range-value {
        font-size: 18px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
      }
      
      .pmc-range-title {
        font-size: 9px;
        color: #999;
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      
      .pmc-metrics-row {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
      }
      
      .pmc-metric-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }
      
.pmc-metric-value {
  font-size: 20px;
  font-weight: 800;
  color: #2c2c2c;
  line-height: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.pmc-metric-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  margin-top: 6px;
}

.pmc-metric-trend {
  font-size: 10px;
  font-weight: 600;
  margin-top: 3px;
  display: inline-block;
  line-height: 1;
}

.pmc-metric-trend.positive {
  color: #4CAF50;
}

.pmc-metric-trend.negative {
  color: #f44336;
}
      
      /* Advanced Metrics Container */
      .pmc-advanced-metrics-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
      }
      
      .pmc-advanced-metrics-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      .pmc-advanced-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        gap: 10px;
        height: 100%;
      }
      
      .pmc-metrics-section {
        background: white;
        border-radius: 8px;
        padding: 12px;
        box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        border-left: 4px solid;
        min-height: 120px;
        display: flex;
        flex-direction: column;
      }
      
      .pmc-metrics-section.cpi-section {
        border-left-color: #2196F3;
      }
      
      .pmc-metrics-section.promo-section {
        border-left-color: #FF9800;
      }
      
      .pmc-metrics-section.performance-section {
        border-left-color: #4CAF50;
      }
      
      .pmc-section-title {
        font-size: 11px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 10px;
      }
      
      .pmc-metrics-grid {
        flex: 1;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }
      
      .pmc-metric-compact {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 6px;
        background: #fafafa;
        border-radius: 6px;
      }
      
      .pmc-metric-compact-value {
        font-size: 16px;
        font-weight: 700;
        color: #2c2c2c;
        line-height: 1;
      }
      
      .pmc-metric-compact-label {
        font-size: 9px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.2px;
        margin-top: 2px;
      }
      
.pmc-metric-compact-trend {
  font-size: 10px;
  font-weight: 600;
  margin-top: 2px;
}

.pmc-metric-compact-trend.positive {
  color: #4CAF50;
}

.pmc-metric-compact-trend.negative {
  color: #f44336;
}
      
      .pmc-promo-wave-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 10px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 600;
        text-align: center;
      }
      
      .pmc-promo-wave-status.active {
        background: linear-gradient(135deg, #FF9800, #F57C00);
        color: white;
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
      }
      
      .pmc-promo-wave-status.inactive {
        background: #f5f5f5;
        color: #888;
        border: 1px solid #e0e0e0;
      }
      
      /* Main grid */
      .pmc-main-grid {
        display: grid;
        grid-template-columns: 420px 1fr;
        gap: 15px;
        width: 100%;
        height: calc(100vh - 400px);
        max-height: 800px;
      }
      
      /* Company buckets card */
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
      
      /* Updated company buckets styles */
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
      
      .pm-company-buckets-header .pm-share-header {
        text-align: center;
        line-height: 1.2;
      }
      
      .pm-company-bucket-row.is-dominant {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border-left: 4px solid #667eea;
        font-weight: 600;
      }
      
      .pm-company-bucket-row.is-dominant .pm-bucket-name {
        color: #667eea;
        font-weight: 700;
      }
      
      /* Dual bar container */
.pm-dual-bars-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}
      
      .pm-bar-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pm-bar-label {
        font-size: 9px;
        color: #888;
        min-width: 40px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .pm-tree-bar-container.small {
        height: 30px;
        max-width: 150px;
      }
      
      .pm-bar-percent-outside.small {
        font-size: 10px;
      }
      
      .pm-company-buckets-body {
        max-height: 600px;
        overflow-y: auto;
      }
      
      /* Company buckets row */
      .pm-company-bucket-row {
        display: grid;
        grid-template-columns: 150px 1fr;
        min-height: 80px;
        align-items: center;
        border-bottom: 1px solid #f0f0f0;
        position: relative;
        transition: background 0.2s;
      }
      
      .pm-company-bucket-row:hover {
        background: #fafafa;
      }
      
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
      
      .pm-company-data {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
      }
      
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
        position: relative;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.85;
      }
      
      .pm-bar-percent-outside {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #444;
        z-index: 2;
      }
      
.pm-products-box {
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
      
.pm-discount-badge {
  display: inline-block;
  padding: 4px 8px;
  background: #ff4444;
  color: white;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
}

.pm-discount-badge-empty {
  display: inline-block;
  padding: 4px 8px;
  color: #ccc;
  font-size: 11px;
}
      
      .pm-tree-metrics {
        display: flex;
        align-items: center;
        gap: 5px;
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
      
      /* Chart sections */
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
      
      /* CPI Chart styles */
      .pm-cpi-chart-container {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        height: 310px;
      }
      
      .pm-cpi-chart {
        width: 100%;
        height: 260px;
      }
      
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
      
      /* Scrollbar styling */
      .pm-company-buckets-body::-webkit-scrollbar {
        width: 6px;
      }
      
      .pm-company-buckets-body::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      .pm-company-buckets-body::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .pm-company-buckets-body::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
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
    
let html = `
  <div class="pmc-dashboard">
    <!-- Top Section with Company Overview and Stats -->
    <div class="pmc-top-section">
      <!-- Company Overview Card -->
      <div class="pmc-company-overview-card">
        <div class="company-name-header">${companyName}</div>
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
      
      <!-- Company Price Range & Metrics Card -->
      <div class="pmc-company-performance-card">
        <h4>Company Performance</h4>
        
        <!-- Company Price Range -->
        <div class="pmc-price-range-values">
          <div class="pmc-range-item">
            <span class="pmc-range-value" id="pmCompanyMinPrice">$—</span>
            <span class="pmc-range-title">MIN</span>
          </div>
          <div class="pmc-range-item median">
            <span class="pmc-range-value" id="pmCompanyMedianPrice">$—</span>
            <span class="pmc-range-title">MEDIAN</span>
          </div>
          <div class="pmc-range-item">
            <span class="pmc-range-value" id="pmCompanyMaxPrice">$—</span>
            <span class="pmc-range-title">MAX</span>
          </div>
        </div>
        
        <!-- Company Metrics -->
        <div class="pmc-metrics-row">
          <div class="pmc-metric-item">
            <span class="pmc-metric-value" id="pmCompanyProducts">—</span>
            <span class="pmc-metric-label">Products</span>
            <span class="pmc-metric-trend" id="pmCompanyProductsTrend"></span>
          </div>
          <div class="pmc-metric-item">
            <span class="pmc-metric-value" id="pmCompanyDiscounted">—</span>
            <span class="pmc-metric-label">Discounted</span>
            <span class="pmc-metric-trend" id="pmCompanyDiscountedTrend"></span>
          </div>
          <div class="pmc-metric-item">
            <span class="pmc-metric-value" id="pmCompanyDiscountRate">—</span>
            <span class="pmc-metric-label">Discount Rate</span>
            <span class="pmc-metric-trend" id="pmCompanyDiscountRateTrend"></span>
          </div>
          <div class="pmc-metric-item">
            <span class="pmc-metric-value" id="pmCompanyAvgDiscount">—</span>
            <span class="pmc-metric-label">Avg Discount</span>
            <span class="pmc-metric-trend" id="pmCompanyAvgDiscountTrend"></span>
          </div>
        </div>
      </div>
      
      <!-- Advanced Metrics -->
      <div class="pmc-advanced-metrics-container">
        <div class="pmc-advanced-metrics">
          <!-- CPI Section -->
          <div class="pmc-metrics-section cpi-section">
            <div class="pmc-section-title">Market Position</div>
            <div class="pmc-metrics-grid">
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmCpiValue">—</span>
                <span class="pmc-metric-compact-label">CPI</span>
                <span class="pmc-metric-compact-trend" id="pmCpiTrend"></span>
              </div>
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmVolatilityValueNew">—</span>
                <span class="pmc-metric-compact-label">Volatility</span>
              </div>
            </div>
          </div>
          
          <!-- Promo Wave Section -->
          <div class="pmc-metrics-section promo-section">
            <div class="pmc-section-title">Promo Wave Status</div>
            <div class="pmc-promo-wave-status" id="pmPromoWaveStatus">
              <span id="pmPromoWaveText">—</span>
            </div>
            <div class="pmc-metrics-grid" style="margin-top: 8px;">
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmPromoLength">—</span>
                <span class="pmc-metric-compact-label">Length (days)</span>
              </div>
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmPromoDepth">—</span>
                <span class="pmc-metric-compact-label">Avg Depth</span>
              </div>
            </div>
          </div>
          
          <!-- Performance Section -->
          <div class="pmc-metrics-section performance-section">
            <div class="pmc-section-title">Performance</div>
            <div class="pmc-metrics-grid">
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmPromoProducts">—</span>
                <span class="pmc-metric-compact-label">Promo Products</span>
              </div>
              <div class="pmc-metric-compact">
                <span class="pmc-metric-compact-value" id="pmPriceVelocity">—</span>
                <span class="pmc-metric-compact-label">Price Velocity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main Content Grid -->
    <div class="pmc-main-grid">
      <!-- Left Column -->
      <div class="pm-left-column">
        <!-- Company Buckets Distribution -->
        <div class="pm-company-buckets-card">
          <h4>Company Price Buckets</h4>
          <div class="pm-company-buckets-table">
            <div class="pm-company-buckets-header">
              <span>Bucket</span>
              <span class="pm-share-header">Share /<br/>Exp Weighted Share</span>
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
      
      <!-- Right Column -->
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

  // 8. Update Advanced Metrics
updateAdvancedMetrics(myCompanyData);
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
  // Only update company prices (removed market prices)
  if (company) {
    document.getElementById('pmCompanyMinPrice').textContent = `$${window.pmUtils.formatNumber(company.cheapest_product, 0)}`;
    document.getElementById('pmCompanyMedianPrice').textContent = `$${window.pmUtils.formatNumber(company.median_price, 0)}`;
    document.getElementById('pmCompanyMaxPrice').textContent = `$${window.pmUtils.formatNumber(company.most_expensive_product, 0)}`;
  } else {
    document.getElementById('pmCompanyMinPrice').textContent = '$—';
    document.getElementById('pmCompanyMedianPrice').textContent = '$—';
    document.getElementById('pmCompanyMaxPrice').textContent = '$—';
  }
}

function updateCompanyKeyMetrics(companyData) {
  const totalProducts = parseInt(companyData.unique_total_products) || 0;
  const discountedProducts = parseInt(companyData.unique_discounted_products) || 0;
  const discountRate = parseFloat(companyData.unique_pr_discounted_products) || 0;
  const avgDiscount = parseFloat(companyData.unique_discount_depth) || 0;
  
  // Previous values for trends
  const prevTotalProducts = parseInt(companyData.prev_unique_total_products) || 0;
  const prevDiscountedProducts = parseInt(companyData.prev_unique_discounted_products) || 0;
  const prevDiscountRate = parseFloat(companyData.prev_unique_pr_discounted_products) || 0;
  const prevAvgDiscount = parseFloat(companyData.prev_unique_discount_depth) || 0;
  
  // Update values
  document.getElementById('pmCompanyProducts').textContent = totalProducts;
  document.getElementById('pmCompanyDiscounted').textContent = discountedProducts;
  document.getElementById('pmCompanyDiscountRate').textContent = `${(discountRate * 100).toFixed(1)}%`;
  document.getElementById('pmCompanyAvgDiscount').textContent = avgDiscount > 0 ? `${avgDiscount.toFixed(1)}%` : '—';
  
  // Update trends
  updateTrendIndicator('pmCompanyProductsTrend', totalProducts, prevTotalProducts);
  updateTrendIndicator('pmCompanyDiscountedTrend', discountedProducts, prevDiscountedProducts);
  updateTrendIndicator('pmCompanyDiscountRateTrend', discountRate, prevDiscountRate, true); // percentage
  updateTrendIndicator('pmCompanyAvgDiscountTrend', avgDiscount, prevAvgDiscount, true); // percentage
}

function updateTrendIndicator(elementId, current, previous, isPercentage = false) {
  const element = document.getElementById(elementId);
  if (!element || previous === null || previous === undefined) {
    element.textContent = '';
    return;
  }
  
  const diff = current - previous;
  const percentDiff = previous !== 0 ? ((diff / previous) * 100) : 0;
  
  if (Math.abs(percentDiff) < 0.1) {
    element.textContent = '';
    return;
  }
  
  const arrow = diff > 0 ? '↑' : '↓';
  const className = diff > 0 ? 'positive' : 'negative';
  const displayValue = isPercentage ? 
    `${Math.abs(diff).toFixed(1)}%` : 
    `${Math.abs(percentDiff).toFixed(1)}%`;
  
  element.textContent = `${arrow} ${displayValue}`;
  element.className = `pmc-metric-trend ${className}`;
}

function updateCompanyBuckets(companyData) {
  const bucketsBody = document.getElementById('pmCompanyBucketsBody');
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
  
  // Tier to bucket mapping (reversed for display)
  const tierToBucketMap = {
    6: 'ultra_premium', // Ultra Premium
    5: 'premium',       // Premium  
    4: 'upper_mid',     // Upper Mid
    3: 'mid',           // Mid Range
    2: 'budget',        // Budget
    1: 'ultra_cheap'    // Ultra Cheap
  };
  
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
      <div class="pm-company-bucket-row ${isDominant ? 'is-dominant' : ''}">
        <div class="pm-bucket-label">
          <div class="pm-bucket-name">
            <span class="pm-bucket-indicator" style="background: ${bucket.color}"></span>
            <span>${bucket.name}</span>
            ${isDominant ? '<span style="margin-left: 4px; font-size: 10px;">👑</span>' : ''}
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
          
          <div class="pm-dual-bars-container">
            <!-- Regular Share Bar -->
            <div class="pm-bar-row">
              <span class="pm-bar-label">Share</span>
              <div class="pm-tree-bar-container small">
                <div class="pm-tree-bar" style="width: ${Math.max(1, sharePercent)}%; background: ${bucket.color};"></div>
                <span class="pm-bar-percent-outside small">${sharePercent}%</span>
              </div>
            </div>
            
            <!-- Exposure Weighted Share Bar -->
            <div class="pm-bar-row">
              <span class="pm-bar-label">ExpW</span>
              <div class="pm-tree-bar-container small">
                <div class="pm-tree-bar" style="width: ${Math.max(1, expwSharePercent)}%; background: linear-gradient(90deg, ${bucket.color}, ${bucket.color}80);"></div>
                <span class="pm-bar-percent-outside small">${expwSharePercent}%</span>
              </div>
            </div>
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

function updateAdvancedMetrics(companyData) {
  // CPI and trends
  const cpi = parseFloat(companyData.cpi) || 1.0;
  const cpi7dDiff = parseFloat(companyData.cpi_7d_diff) || 0;
  const cpi30dDiff = parseFloat(companyData.cpi_30d_diff) || 0;
  
  document.getElementById('pmCpiValue').textContent = cpi.toFixed(2);
  
  // CPI trend indicator
  const cpiTrendEl = document.getElementById('pmCpiTrend');
  if (Math.abs(cpi7dDiff) > 0.01) {
    const arrow = cpi7dDiff > 0 ? '↑' : '↓';
    const className = cpi7dDiff > 0 ? 'positive' : 'negative';
    cpiTrendEl.textContent = `${arrow} ${Math.abs(cpi7dDiff).toFixed(2)}`;
    cpiTrendEl.className = `pmc-metric-compact-trend ${className}`;
  } else {
    cpiTrendEl.textContent = '';
  }
  
  // Volatility
  const volatility = parseFloat(companyData.volatility) || 0;
  document.getElementById('pmVolatilityValue').textContent = volatility.toFixed(2);
  
  // Promo Wave Status
  const promoWave = companyData.promo_wave === true || companyData.promo_wave === 'true';
  const promoLength = parseInt(companyData.promo_wave_length) || 0;
  const promoDepth = parseFloat(companyData.promo_wave_discount_depth) || 0;
  const promoProducts = parseFloat(companyData.promo_wave_pr_discounted_products) * 100 || 0;
  
  const promoStatusEl = document.getElementById('pmPromoWaveStatus');
  const promoTextEl = document.getElementById('pmPromoWaveText');
  
  if (promoWave) {
    promoStatusEl.className = 'pm-promo-wave-status active';
    promoTextEl.textContent = '🔥 ACTIVE PROMO WAVE';
  } else {
    promoStatusEl.className = 'pm-promo-wave-status inactive';
    promoTextEl.textContent = '⏸️ No Active Wave';
  }
  
  document.getElementById('pmPromoLength').textContent = promoLength > 0 ? promoLength : '—';
  document.getElementById('pmPromoDepth').textContent = promoDepth > 0 ? `${promoDepth.toFixed(1)}%` : '—';
  document.getElementById('pmPromoProducts').textContent = promoProducts > 0 ? `${promoProducts.toFixed(1)}%` : '—';
  
  // Price Velocity
  const priceVelocity = parseFloat(companyData.price_change_velocity) || 0;
  document.getElementById('pmPriceVelocity').textContent = priceVelocity.toFixed(2);
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
