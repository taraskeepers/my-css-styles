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

// Load and render titles analyzer
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
  
  // Load and render products data (reuse the same data structure)
  await renderTitlesProductsTable(tableContainer);
  
  mainContainer.appendChild(productsPanel);
  container.appendChild(mainContainer);
}

// Render products table for titles analyzer
async function renderTitlesProductsTable(container) {
  // This would load the same data as campaigns but with title-specific analysis
  // For now, creating sample structure
  
  const wrapper = document.createElement('div');
  wrapper.className = 'titles-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position">
      Pos
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share">
      Share
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas">
      ROAS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center">Image</th>
    <th class="sortable" data-sort="title">
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
  
  // Create tbody (would be populated with actual data)
  const tbody = document.createElement('tbody');
  tbody.innerHTML = `
    <tr>
      <td colspan="11" style="text-align: center; padding: 40px; color: #999;">
        Loading title performance data...
      </td>
    </tr>
  `;
  table.appendChild(tbody);
  
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add sorting functionality
  addTitlesSortingFunctionality(table);
}

// Add sorting functionality
function addTitlesSortingFunctionality(table) {
  const headers = table.querySelectorAll('th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      // Implement sorting logic here
      console.log('Sorting by:', sortKey);
    });
  });
}

// Export initialization function
window.initializeTitlesAnalyzer = initializeTitlesAnalyzer;
