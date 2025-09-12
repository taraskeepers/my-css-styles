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
      
      /* Column widths - matching campaigns structure */
      .titles-table-modern th:nth-child(1),
      .titles-table-modern td:nth-child(1) { width: 60px; }
      
      .titles-table-modern th:nth-child(2),
      .titles-table-modern td:nth-child(2) { width: 90px; }
      
      .titles-table-modern th:nth-child(3),
      .titles-table-modern td:nth-child(3) { width: 70px; }
      
      .titles-table-modern th:nth-child(4),
      .titles-table-modern td:nth-child(4) { width: 80px; }
      
      .titles-table-modern th:nth-child(5),
      .titles-table-modern td:nth-child(5) { width: 300px; }
      
      .titles-table-modern th.metric-col,
      .titles-table-modern td.metric-col { 
        width: 90px;
        max-width: 90px;
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
    `;
    document.head.appendChild(style);
  }
}

// Add these new functions after the addTitlesAnalyzerStyles function:

// Load data from googleSheets_productPerformance_all
async function loadTitlesProductData() {
  return new Promise((resolve, reject) => {
    const dbName = 'ParentIDB';
    const request = indexedDB.open(dbName);
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      const transaction = db.transaction(['googleSheets_productPerformance_all'], 'readonly');
      const store = transaction.objectStore('googleSheets_productPerformance_all');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = function() {
        const allRecords = getAllRequest.result || [];
        
        // Process and aggregate data by product
        const productMap = new Map();
        
        allRecords.forEach(record => {
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
              records: []
            });
          }
          
          const product = productMap.get(key);
          product.impressions += parseFloat(record['Impressions'] || 0);
          product.clicks += parseFloat(record['Clicks'] || 0);
          product.cost += parseFloat(record['Cost'] || 0);
          product.conversions += parseFloat(record['Conversions'] || 0);
          product.convValue += parseFloat(record['Conversion Value'] || 0);
          product.records.push(record);
        });
        
        // Convert map to array and calculate derived metrics
        const products = Array.from(productMap.values()).map(p => {
          p.ctr = p.impressions > 0 ? (p.clicks / p.impressions * 100) : 0;
          p.avgCpc = p.clicks > 0 ? (p.cost / p.clicks) : 0;
          p.cpa = p.conversions > 0 ? (p.cost / p.conversions) : 0;
          p.cvr = p.clicks > 0 ? (p.conversions / p.clicks * 100) : 0;
          p.aov = p.conversions > 0 ? (p.convValue / p.conversions) : 0;
          p.roas = p.cost > 0 ? (p.convValue / p.cost) : 0;
          
          // Calculate average position if available
          let totalPosImpressions = 0;
          let weightedPosSum = 0;
          p.records.forEach(r => {
            const pos = parseFloat(r['Average Position'] || 0);
            const impr = parseFloat(r['Impressions'] || 0);
            if (pos > 0 && impr > 0) {
              weightedPosSum += pos * impr;
              totalPosImpressions += impr;
            }
          });
          p.avgPosition = totalPosImpressions > 0 ? (weightedPosSum / totalPosImpressions) : 0;
          
          return p;
        });
        
        // Sort by impressions by default
        products.sort((a, b) => b.impressions - a.impressions);
        
        resolve(products);
      };
      
      getAllRequest.onerror = function() {
        reject(new Error('Failed to load titles product data'));
      };
    };
    
    request.onerror = function() {
      reject(new Error('Failed to open database'));
    };
  });
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

// Update the renderTitlesProductsTable function to accept and render actual data:
async function renderTitlesProductsTable(container, products) {
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
    <th class="center sortable" data-sort="position" style="width: 60px;">
      Pos
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share" style="width: 90px;">
      Share
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 70px;">
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
    
    // Calculate market share
    const marketShare = totals.impressions > 0 ? 
      (product.impressions / totals.impressions * 100) : 0;
    
    // Determine ROAS class
    let roasClass = 'titles-roas-low';
    if (product.roas >= 3) roasClass = 'titles-roas-high';
    else if (product.roas >= 1.5) roasClass = 'titles-roas-medium';
    
    // Determine if this is a top performer
    const isTopPerformer = index < 5 && product.roas > 2;
    
    row.innerHTML = `
      <td class="center">${product.avgPosition > 0 ? product.avgPosition.toFixed(1) : '-'}</td>
      <td class="center">
        <div class="titles-metric-cell">
          <div class="titles-metric-bar" style="width: ${marketShare}%;"></div>
          <span class="titles-metric-value">${marketShare.toFixed(1)}%</span>
        </div>
      </td>
      <td class="center">
        <span class="titles-roas-indicator ${roasClass}">
          ${product.roas.toFixed(2)}x
        </span>
      </td>
      <td class="center">
        ${product.image ? 
          `<img src="${product.image}" alt="${product.title}" class="titles-product-img" />` : 
          '<div class="titles-product-img" style="background: #f0f0f0;"></div>'
        }
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
  
  // Add sorting functionality
  addTitlesSortingFunctionality(table, products);
}

// Update the sorting functionality to work with actual data:
function addTitlesSortingFunctionality(table, products) {
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
      
      // Sort products
      const sortedProducts = [...products].sort((a, b) => {
        let aVal, bVal;
        
        switch(sortKey) {
          case 'position':
            aVal = a.avgPosition || 999;
            bVal = b.avgPosition || 999;
            break;
          case 'share':
            const totals = products.reduce((sum, p) => sum + p.impressions, 0);
            aVal = a.impressions / totals;
            bVal = b.impressions / totals;
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
