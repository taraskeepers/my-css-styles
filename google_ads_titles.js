// google_ads_titles.js - Title Analyzer Section Implementation

// Global variables for titles analyzer section
window.selectedTitleCampaign = null;
window.titlesData = [];
window.titleProducts = new Map();

// Initialize titles analyzer section
async function initializeTitlesAnalyzer() {
  console.log('[initializeTitlesAnalyzer] Starting titles analyzer initialization...');
  
  // Add titles-specific styles
  addTitlesAnalyzerStyles();
  
  // Load and render titles analyzer
  await loadAndRenderTitlesAnalyzer();
}

// Add titles-specific styles
function addTitlesAnalyzerStyles() {
  if (!document.getElementById('titles-analyzer-styles')) {
    const style = document.createElement('style');
    style.id = 'titles-analyzer-styles';
    style.textContent = `
      /* Main titles analyzer container */
      .titles-analyzer-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        padding-top: 50px;
      }
      
      /* Products panel for titles */
      #titlesProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Header section */
      .titles-products-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .titles-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .titles-header-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .titles-analyzer-version {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .titles-selected-info {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
      }
      
      /* TABLE STYLES - Renamed from campaigns */
      .titles-products-table-container {
        flex: 1;
        overflow: auto;
        background: #f5f7fa;
      }
      
      .titles-products-wrapper {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      .titles-table-modern {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      /* Table header */
      .titles-table-modern thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .titles-table-modern thead tr {
        border-bottom: 2px solid #e9ecef;
      }
      
      .titles-table-modern th {
        padding: 10px 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6c757d;
        text-align: left;
        background: white;
        position: relative;
        white-space: nowrap;
        user-select: none;
      }
      
      .titles-table-modern th.sortable {
        cursor: pointer;
        padding-right: 20px;
      }
      
      .titles-table-modern th.sortable:hover {
        background: rgba(102, 126, 234, 0.04);
        color: #495057;
      }
      
      .titles-table-modern th.center {
        text-align: center;
      }
      
      .titles-table-modern th.right {
        text-align: right;
      }
      
/* Column widths - optimized */
.titles-table-modern th:nth-child(1),
.titles-table-modern td:nth-child(1) { width: 50px; } /* POS */

.titles-table-modern th:nth-child(2),
.titles-table-modern td:nth-child(2) { width: 70px; } /* SHARE */

.titles-table-modern th:nth-child(3),
.titles-table-modern td:nth-child(3) { width: 60px; } /* ROAS */
      
      .titles-table-modern th:nth-child(4),
      .titles-table-modern td:nth-child(4) { width: 80px; }
      
      .titles-table-modern th:nth-child(5),
      .titles-table-modern td:nth-child(5) { width: 300px; }
      
      .titles-table-modern th.metric-col,
      .titles-table-modern td.metric-col { 
        width: 80px;
        max-width: 80px;
      }
      
      /* Sort icon */
      .titles-sort-icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #adb5bd;
      }
      
      .titles-table-modern th.sorted-asc .titles-sort-icon,
      .titles-table-modern th.sorted-desc .titles-sort-icon {
        color: #667eea;
      }
      
      /* Table body */
      .titles-table-modern tbody tr {
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.15s ease;
        height: 70px;
      }
      
      .titles-table-modern tbody tr:hover {
        background: rgba(102, 126, 234, 0.02);
      }
      
      .titles-table-modern td {
        padding: 8px;
        font-size: 13px;
        color: #495057;
        vertical-align: middle;
      }
      
      .titles-table-modern td.center {
        text-align: center;
      }
      
      .titles-table-modern td.right {
        text-align: right;
      }
      
      /* Product image in table */
      .titles-product-img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      /* Product title cell */
      .titles-product-title-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .titles-product-title {
        font-weight: 600;
        color: #333;
        font-size: 13px;
        line-height: 1.3;
        max-height: 2.6em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .titles-product-sku {
        font-size: 11px;
        color: #999;
      }
      
      /* Metric cells with bars */
      .titles-metric-cell {
        position: relative;
        padding: 4px 8px !important;
      }
      
      .titles-metric-bar {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 24px;
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.15), rgba(102, 126, 234, 0.05));
        border-radius: 4px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
      }
      
      .titles-metric-value {
        position: relative;
        z-index: 1;
        font-weight: 600;
        font-size: 12px;
      }
      
      .titles-metric-percent {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #999;
        z-index: 1;
      }
      
      /* Special badges for top performers */
      .titles-performance-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-left: 8px;
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
      }
      
      /* ROAS indicator */
      .titles-roas-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .titles-roas-high {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
      }
      
      .titles-roas-medium {
        background: rgba(251, 191, 36, 0.1);
        color: #f59e0b;
      }
      
      .titles-roas-low {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }
      /* Image zoom on hover */
.titles-product-img-container {
  position: relative;
  display: inline-block;
}

.titles-product-img-zoom {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 12px;
  object-fit: contain;
  background: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  border: 2px solid #667eea;
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
}

.titles-product-img-container:hover .titles-product-img-zoom {
  opacity: 1;
}

/* Position indicator styles */
.titles-position-indicator {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.titles-position-indicator.top {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.titles-position-indicator.mid {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.titles-position-indicator.low {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  color: white;
}

.titles-position-indicator.bottom {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* Market share bar */
.titles-share-bar {
  width: 60px;
  height: 32px;
  background: #e9ecef;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.titles-share-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  transition: width 0.3s ease;
}

.titles-share-text {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 0 2px rgba(255,255,255,0.8);
}

    `;
    document.head.appendChild(style);
  }
}

// Load data from googleSheets_productPerformance_all
async function loadTitlesProductData() {
  return new Promise((resolve, reject) => {
    console.log('[loadTitlesProductData] Starting to load data...');
    
    // Use the existing global getProjectTablePrefix function from google_ads_campaigns.js
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      // Fallback - try to determine the prefix manually
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}googleSheets_productPerformance_all`;
    
    console.log('[loadTitlesProductData] Looking for table:', tableName);
    
    // Rest of the function remains the same...
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Check if projectData object store exists
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadTitlesProductData] projectData object store not found');
        db.close();
        reject(new Error('projectData object store not found'));
        return;
      }
      
      // Create transaction and get the projectData object store
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      
      // Get the data using the table name as the key
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadTitlesProductData] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Extract the actual data array
        const allRecords = Array.isArray(result.data) ? result.data : [];
        console.log('[loadTitlesProductData] Found records:', allRecords.length);
        
        // Process and aggregate data by product
        const productMap = new Map();
        
        allRecords.forEach(record => {
          // Skip records that don't have "all" as campaign name
          if (record['Campaign Name'] !== 'all') {
            return;
          }
          
          const key = record['Product Title'] || 'Unknown Product';
          
          if (!productMap.has(key)) {
            productMap.set(key, {
              title: key,
              sku: record['Product ID'] || '',
              image: record['Product Image URL'] || '',
              impressions: 0,
              clicks: 0,
              cost: 0,
              conversions: 0,
              convValue: 0,
              weightedPositionSum: 0,
              positionImpressions: 0,
              records: []
            });
          }
          
          const product = productMap.get(key);
          
          // Parse and aggregate metrics
          const impressions = parseFloat(record['Impressions'] || 0);
          const clicks = parseFloat(record['Clicks'] || 0);
          const cost = parseFloat(record['Cost'] || 0);
          const conversions = parseFloat(record['Conversions'] || 0);
          const convValue = parseFloat(record['Conversion Value'] || 0);
          const avgPosition = parseFloat(record['Average Position'] || 0);
          
          product.impressions += impressions;
          product.clicks += clicks;
          product.cost += cost;
          product.conversions += conversions;
          product.convValue += convValue;
          
          // Calculate weighted average position
          if (avgPosition > 0 && impressions > 0) {
            product.weightedPositionSum += avgPosition * impressions;
            product.positionImpressions += impressions;
          }
          
          product.records.push(record);
        });
        
        // Convert map to array and calculate derived metrics
        const products = Array.from(productMap.values()).map(p => {
          // Calculate metrics
          p.ctr = p.impressions > 0 ? (p.clicks / p.impressions * 100) : 0;
          p.avgCpc = p.clicks > 0 ? (p.cost / p.clicks) : 0;
          p.cpa = p.conversions > 0 ? (p.cost / p.conversions) : 0;
          p.cvr = p.clicks > 0 ? (p.conversions / p.clicks * 100) : 0;
          p.aov = p.conversions > 0 ? (p.convValue / p.conversions) : 0;
          p.roas = p.cost > 0 ? (p.convValue / p.cost) : 0;
          p.avgPosition = p.positionImpressions > 0 ? 
            (p.weightedPositionSum / p.positionImpressions) : 0;
          
          // Clean up temporary calculation fields
          delete p.weightedPositionSum;
          delete p.positionImpressions;
          
          return p;
        });
        
        // Sort by impressions by default (highest first)
        products.sort((a, b) => b.impressions - a.impressions);
        
        console.log('[loadTitlesProductData] Processed products:', products.length);
        db.close();
        resolve(products);
      };
      
      getRequest.onerror = function() {
        console.error('[loadTitlesProductData] Error getting data:', getRequest.error);
        db.close();
        reject(new Error('Failed to load titles product data'));
      };
    };
    
    request.onerror = function() {
      console.error('[loadTitlesProductData] Failed to open database:', request.error);
      reject(new Error('Failed to open database'));
    };
  });
}

// Load processed data for POS and SHARE
async function loadProcessedDataForTitles(productTitles) {
  console.log('[loadProcessedDataForTitles] Loading processed data for titles:', productTitles.length);
  
  try {
    // Get the processed table name
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : 
      (() => {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        return `${accountPrefix}_pr${currentProjectNum}_`;
      })();
    
    const processedTableName = `${tablePrefix}processed`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(processedTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadProcessedDataForTitles] No processed data found');
      return new Map();
    }
    
    // Process data: aggregate by product title
    const productMetrics = new Map();
    
    result.data.forEach(row => {
      // Filter by company source
      if (!row.source || row.source.toLowerCase() !== (window.myCompany || "").toLowerCase()) {
        return;
      }
      
      const title = row.title;
      const position = parseFloat(row.avg_week_position);
      const visibility = parseFloat(row.avg_visibility);
      const weekTrend = row.week_trend || null;
      
      // Skip if title doesn't match any of our products
      if (!productTitles.includes(title)) {
        return;
      }
      
      if (!productMetrics.has(title)) {
        productMetrics.set(title, {
          positions: [],
          visibilities: [],
          trends: []
        });
      }
      
      const metrics = productMetrics.get(title);
      
      if (!isNaN(position) && position > 0) {
        metrics.positions.push(position);
      }
      if (!isNaN(visibility)) {
        metrics.visibilities.push(visibility);
      }
      if (weekTrend && weekTrend !== 'N/A') {
        metrics.trends.push(weekTrend);
      }
    });
    
    // Calculate averages
    const processedMetrics = new Map();
    
    for (const [title, metrics] of productMetrics) {
      const processed = {
        avgPosition: null,
        avgVisibility: null,
        trend: null
      };
      
      if (metrics.positions.length > 0) {
        const avgPos = metrics.positions.reduce((a, b) => a + b, 0) / metrics.positions.length;
        processed.avgPosition = Math.round(avgPos);
      }
      
      if (metrics.visibilities.length > 0) {
        const avgVis = metrics.visibilities.reduce((a, b) => a + b, 0) / metrics.visibilities.length;
        processed.avgVisibility = avgVis * 100; // Convert to percentage
      }
      
      // Calculate average trend
      if (metrics.trends.length > 0) {
        processed.trend = calculateAverageTrend(metrics.trends);
      }
      
      processedMetrics.set(title, processed);
    }
    
    console.log('[loadProcessedDataForTitles] Processed metrics for products:', processedMetrics.size);
    return processedMetrics;
    
  } catch (error) {
    console.error('[loadProcessedDataForTitles] Error loading processed data:', error);
    return new Map();
  }
}

// Helper function to calculate average trend
function calculateAverageTrend(trends) {
  if (!trends || trends.length === 0) return null;
  
  const validTrends = [];
  trends.forEach(trend => {
    if (trend && trend !== 'N/A') {
      const match = trend.match(/([⬆⬇])\s*([+-]?\d+\.?\d*)/);
      if (match) {
        const arrow = match[1];
        const value = parseFloat(match[2]);
        validTrends.push({ arrow, value });
      }
    }
  });
  
  if (validTrends.length === 0) return null;
  
  const avgValue = validTrends.reduce((sum, t) => sum + Math.abs(t.value), 0) / validTrends.length;
  const upCount = validTrends.filter(t => t.arrow === '⬆').length;
  const downCount = validTrends.filter(t => t.arrow === '⬇').length;
  const arrow = upCount >= downCount ? '⬆' : '⬇';
  const formattedValue = avgValue.toFixed(2);
  const isPositive = arrow === '⬆';
  
  return {
    text: `${arrow} ${formattedValue}`,
    color: isPositive ? '#22c55e' : '#ef4444',
    isPositive
  };
}

// Match products with company data for images
function matchProductsWithCompanyData(products) {
  const matchedProducts = new Map();
  
  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
        const productKey = product.title || '';
        matchedProducts.set(productKey, product);
      }
    });
  }
  
  return matchedProducts;
}

// Replace the loadAndRenderTitlesAnalyzer function:
async function loadAndRenderTitlesAnalyzer() {
  const container = document.getElementById('titles_analyzer_container');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'titles-analyzer-main-container';
  
  // Create products panel
  const productsPanel = document.createElement('div');
  productsPanel.id = 'titlesProductsPanel';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'titles-products-header';
  header.innerHTML = `
    <div class="titles-header-left">
      <h2 class="titles-header-title">
        Title Performance Analyzer
        <span class="titles-analyzer-version">v2.3.0 BETA</span>
      </h2>
      <div class="titles-selected-info">
        Analyzing title effectiveness across all campaigns
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'titles-products-table-container';
  productsPanel.appendChild(tableContainer);
  
  // Load and render products data
  try {
    const products = await loadTitlesProductData();
    await renderTitlesProductsTable(tableContainer, products);
  } catch (error) {
    console.error('[TitlesAnalyzer] Error loading data:', error);
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        Error loading title performance data. Please refresh and try again.
      </div>
    `;
  }
  
  mainContainer.appendChild(productsPanel);
  container.appendChild(mainContainer);
}

async function renderTitlesProductsTable(container, products) {
  // Get product titles for matching
  const productTitles = products.map(p => p.title);
  
  // Load processed data for POS and SHARE
  const processedMetrics = await loadProcessedDataForTitles(productTitles);
  
  // Match products with company data for images
  const matchedProducts = matchProductsWithCompanyData(products);
  
  // Calculate totals for percentage calculations
  const totals = {
    impressions: products.reduce((sum, p) => sum + p.impressions, 0),
    clicks: products.reduce((sum, p) => sum + p.clicks, 0),
    cost: products.reduce((sum, p) => sum + p.cost, 0),
    conversions: products.reduce((sum, p) => sum + p.conversions, 0),
    convValue: products.reduce((sum, p) => sum + p.convValue, 0)
  };
  
  const wrapper = document.createElement('div');
  wrapper.className = 'titles-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position" style="width: 50px;">
      Pos
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share" style="width: 70px;">
      Share
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 60px;">
      ROAS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center" style="width: 80px;">Image</th>
    <th class="sortable" data-sort="title" style="width: 300px;">
      Product Title
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="impressions">
      Impr
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="clicks">
      Clicks
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="ctr">
      CTR %
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="cost">
      Cost
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="conversions">
      Conv
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="revenue">
      Revenue
      <span class="titles-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody with actual data
  const tbody = document.createElement('tbody');
  
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    
    // Get processed metrics for this product
    const productProcessedMetrics = processedMetrics.get(product.title);
    const adPosition = productProcessedMetrics?.avgPosition || null;
    const marketShare = productProcessedMetrics?.avgVisibility || null;
    const trend = productProcessedMetrics?.trend || null;
    
    // Get matched product for image
    const matchedProduct = matchedProducts.get(product.title);
    const imageUrl = matchedProduct?.thumbnail || product.image || '';
    
    // Position badge class
    let posClass = 'bottom';
    if (adPosition) {
      if (adPosition <= 3) posClass = 'top';
      else if (adPosition <= 8) posClass = 'mid';
      else if (adPosition <= 14) posClass = 'low';
    }
    
    // Determine ROAS class
    let roasClass = 'titles-roas-low';
    if (product.roas >= 3) roasClass = 'titles-roas-high';
    else if (product.roas >= 1.5) roasClass = 'titles-roas-medium';
    
    // Determine if this is a top performer
    const isTopPerformer = index < 5 && product.roas > 2;
    
    row.innerHTML = `
      <td class="center">
        ${adPosition !== null && adPosition !== undefined ? 
          `<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <div class="titles-position-indicator ${posClass}">${adPosition}</div>
            ${trend ? 
              `<div style="font-size: 9px; color: ${trend.color}; font-weight: 600; background: ${trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 1px 4px; border-radius: 4px;">${trend.text}</div>` : 
              ''}
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${marketShare ? 
          `<div class="titles-share-bar">
            <div class="titles-share-fill" style="width: ${Math.min(marketShare, 100)}%"></div>
            <div class="titles-share-text">${marketShare.toFixed(1)}%</div>
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        <span class="titles-roas-indicator ${roasClass}">
          ${product.roas.toFixed(2)}x
        </span>
      </td>
      <td class="center">
        ${imageUrl ? 
          `<div class="titles-product-img-container">
            <img class="titles-product-img" src="${imageUrl}" alt="${product.title}" onerror="this.style.display='none'">
            <img class="titles-product-img-zoom" src="${imageUrl}" alt="${product.title}">
          </div>` : 
          '<div style="width: 48px; height: 48px; background: #f0f2f5; border-radius: 8px; margin: 0 auto;"></div>'}
      </td>
      <td>
        <div class="titles-product-title-cell">
          <div class="titles-product-title">
            ${product.title}
            ${isTopPerformer ? '<span class="titles-performance-badge">TOP</span>' : ''}
          </div>
          ${product.sku ? `<div class="titles-product-sku">SKU: ${product.sku}</div>` : ''}
        </div>
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          <div class="titles-metric-bar" style="width: ${(product.impressions / Math.max(...products.map(p => p.impressions)) * 100)}%;"></div>
          <span class="titles-metric-value">${product.impressions.toLocaleString()}</span>
        </div>
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          <div class="titles-metric-bar" style="width: ${(product.clicks / Math.max(...products.map(p => p.clicks)) * 100)}%;"></div>
          <span class="titles-metric-value">${product.clicks.toLocaleString()}</span>
        </div>
      </td>
      <td class="right">${product.ctr.toFixed(2)}%</td>
      <td class="right">$${product.cost.toFixed(2)}</td>
      <td class="right">${product.conversions.toFixed(1)}</td>
      <td class="right">$${product.convValue.toFixed(2)}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add image hover positioning event listeners
  wrapper.querySelectorAll('.titles-product-img-container').forEach(container => {
    const img = container.querySelector('.titles-product-img');
    const zoomImg = container.querySelector('.titles-product-img-zoom');
    
    if (img && zoomImg) {
      container.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = rect.right + 10;
        let top = rect.top - 100;
        
        // Adjust if would go off right edge
        if (left + 300 > viewportWidth) {
          left = rect.left - 310;
        }
        
        // Adjust if would go off top
        if (top < 10) {
          top = 10;
        }
        
        // Adjust if would go off bottom
        if (top + 300 > viewportHeight - 10) {
          top = viewportHeight - 310;
        }
        
        zoomImg.style.left = `${left}px`;
        zoomImg.style.top = `${top}px`;
      });
    }
  });
  
  // Add sorting functionality with updated data
  addTitlesSortingFunctionality(table, products, processedMetrics);
}

function addTitlesSortingFunctionality(table, products, processedMetrics) {
  const headers = table.querySelectorAll('th.sortable');
  let currentSort = { column: 'impressions', direction: 'desc' };
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      
      // Toggle direction if same column
      if (currentSort.column === sortKey) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = sortKey;
        currentSort.direction = 'desc';
      }
      
      // Remove all sort indicators
      headers.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Add current sort indicator
      this.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
      // Sort products with enhanced data
      const sortedProducts = [...products].sort((a, b) => {
        let aVal, bVal;
        
        switch(sortKey) {
          case 'position':
            const aMetrics = processedMetrics.get(a.title);
            const bMetrics = processedMetrics.get(b.title);
            aVal = aMetrics?.avgPosition || 999;
            bVal = bMetrics?.avgPosition || 999;
            break;
          case 'share':
            const aShare = processedMetrics.get(a.title);
            const bShare = processedMetrics.get(b.title);
            aVal = aShare?.avgVisibility || 0;
            bVal = bShare?.avgVisibility || 0;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'revenue':
            aVal = a.convValue;
            bVal = b.convValue;
            break;
          default:
            aVal = a[sortKey] || 0;
            bVal = b[sortKey] || 0;
        }
        
        if (currentSort.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      // Re-render table with sorted data
      const container = table.closest('.titles-products-table-container');
      container.innerHTML = '';
      renderTitlesProductsTable(container, sortedProducts);
    });
  });
}

// Export initialization function
window.initializeTitlesAnalyzer = initializeTitlesAnalyzer;
