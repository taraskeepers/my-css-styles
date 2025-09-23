// product_studio.js - Product Studio Implementation

// Global variables for product studio
window.productStudioInitialized = false;

// Initialize Product Studio functionality
async function initializeProductStudio() {
  console.log('[initializeProductStudio] Starting Product Studio initialization...');
  
  if (window.productStudioInitialized) {
    console.log('[initializeProductStudio] Already initialized, skipping...');
    return;
  }
  
  // Add debugging
  console.log('[initializeProductStudio] Looking for Product Studio container...');
  const container = document.getElementById('productStudioContent');
  console.log('[initializeProductStudio] Container found:', !!container);
  
  // Add product studio specific styles
  addProductStudioStyles();
  
  // Load and render product studio panels
  await loadAndRenderProductStudioPanels();
  
  // Wait a moment for DOM to update
  setTimeout(() => {
    console.log('[initializeProductStudio] Initializing toggle functionality...');
    // Initialize toggle functionality
    initializeProductStudioToggle();
  }, 100);
  
  window.productStudioInitialized = true;
  console.log('[initializeProductStudio] Product Studio initialization complete');
}

// Add product studio specific styles (reusing titles analyzer styles)
function addProductStudioStyles() {
  if (!document.getElementById('product-studio-styles')) {
    const style = document.createElement('style');
    style.id = 'product-studio-styles';
    style.textContent = `
      /* Main product studio container */
      .product-studio-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        padding-top: 80px;
      }
      
      /* Companies and Products panels - reuse titles styling */
      #titlesCompaniesPanel,
      #titlesGlobalProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Header section - same as titles */
      .product-studio-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .product-studio-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .product-studio-header-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .product-studio-version {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .product-studio-selected-info {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
      }
      
      /* Table container - same as titles */
      .product-studio-table-container {
        flex: 1;
        overflow: auto;
        background: #f5f7fa;
      }
      
      .product-studio-wrapper {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      /* Reuse all titles table styles */
      .titles-table-modern {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      /* Copy all the titles table styling here or reference it */
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
      
      .titles-table-modern tbody tr {
        height: 60px;
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.2s ease;
      }
      
      .titles-table-modern tbody tr:hover {
        background: rgba(102, 126, 234, 0.02);
        cursor: pointer;
      }
      
      .titles-table-modern td {
        padding: 8px;
        color: #333;
        font-size: 13px;
        vertical-align: middle;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .titles-table-modern td.center {
        text-align: center;
      }
      
      /* Column widths */
      .titles-table-modern th:nth-child(1),
      .titles-table-modern td:nth-child(1) { width: 70px; }
      
      .titles-table-modern th:nth-child(2),
      .titles-table-modern td:nth-child(2) { width: 80px; }
      
      .titles-table-modern th:nth-child(3),
      .titles-table-modern td:nth-child(3) { width: 70px; }
      
      .titles-table-modern th:nth-child(4),
      .titles-table-modern td:nth-child(4) { width: 70px; }
      
      .titles-table-modern th:nth-child(5),
      .titles-table-modern td:nth-child(5) { 
        max-width: 350px; 
        width: 350px;
      }
      
      .titles-table-modern th:nth-child(6),
      .titles-table-modern td:nth-child(6) { width: 65px; }
      
      .titles-table-modern th:nth-child(7),
      .titles-table-modern td:nth-child(7) { width: 50px; }
      
      .titles-table-modern th:nth-child(8),
      .titles-table-modern td:nth-child(8) { width: 50px; }
      
      .titles-table-modern th:nth-child(9),
      .titles-table-modern td:nth-child(9) { width: 60px; }
    `;
    document.head.appendChild(style);
  }
}

// Load data from product_titles_evaluated table
async function loadProductTitlesEvaluated() {
  return new Promise((resolve, reject) => {
    console.log('[loadProductTitlesEvaluated] Starting to load evaluated titles...');
    
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
    
    const tableName = `${tablePrefix}product_titles_evaluated`;
    
    console.log('[loadProductTitlesEvaluated] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadProductTitlesEvaluated] projectData object store not found');
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadProductTitlesEvaluated] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Filter by company source
        const myCompany = (window.myCompany || '').toLowerCase();
        const filteredData = result.data.filter(item => 
          item.source && item.source.toLowerCase() === myCompany
        );
        
        console.log('[loadProductTitlesEvaluated] Filtered products for company:', myCompany, 'Count:', filteredData.length);
        
        // Process data
        const processedData = filteredData.map(item => ({
          title: item.title || '',
          finalScore: parseFloat(item.final_score || 0),
          kos: parseFloat(item.kos || 0),
          gos: parseFloat(item.gos || 0),
          suggestions: item.improvement_suggestions || [],
          q: item.q || '',
          scoreBreakdown: item.score_breakdown ? JSON.parse(item.score_breakdown) : {},
          matchedTerms: item.matched_terms ? JSON.parse(item.matched_terms) : {},
          titleLength: parseInt(item.title_length || 0),
          wordCount: parseInt(item.word_count || 0),
          detectedBrand: item.detected_brand || '',
          detectedCategory: item.detected_category || ''
        }));
        
        db.close();
        resolve(processedData);
      };
      
      getRequest.onerror = function() {
        console.error('[loadProductTitlesEvaluated] Error getting data:', getRequest.error);
        db.close();
        resolve([]);
      };
    };
    
    request.onerror = function() {
      console.error('[loadProductTitlesEvaluated] Failed to open database:', request.error);
      resolve([]);
    };
  });
}

// Load processed data for POS and SHARE (reuse from titles analyzer)
async function loadProcessedDataForProducts(productTitles) {
  console.log('[loadProcessedDataForProducts] Loading processed data for titles:', productTitles.length);
  
  try {
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : (() => {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        return `${accountPrefix}_pr${currentProjectNum}_`;
      })();
    
    const processedTableName = `${tablePrefix}processed`;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(processedTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadProcessedDataForProducts] No processed data found');
      return new Map();
    }
    
    const productMetrics = new Map();
    
    result.data.forEach(row => {
      if (!row.source || row.source.toLowerCase() !== (window.myCompany || "").toLowerCase()) {
        return;
      }
      
      const title = row.title;
      const position = parseFloat(row.avg_week_position);
      const visibility = parseFloat(row.avg_visibility);
      const weekTrend = row.week_trend || null;
      
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
        processed.avgVisibility = avgVis * 100;
      }
      
      if (metrics.trends.length > 0) {
        processed.trend = calculateAverageTrendForProducts(metrics.trends);
      }
      
      processedMetrics.set(title, processed);
    }
    
    console.log('[loadProcessedDataForProducts] Processed metrics for products:', processedMetrics.size);
    return processedMetrics;
    
  } catch (error) {
    console.error('[loadProcessedDataForProducts] Error loading processed data:', error);
    return new Map();
  }
}

// Helper function for trend calculation
function calculateAverageTrendForProducts(trends) {
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
function matchProductsWithGlobalData(products) {
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

// Load and render both panels
async function loadAndRenderProductStudioPanels() {
  const container = document.getElementById('productStudioContent');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'product-studio-main-container';
  
  // Create Companies Panel
  const companiesPanel = await createCompaniesPanel();
  mainContainer.appendChild(companiesPanel);
  
  // Create Products Panel  
  const productsPanel = await createProductsPanel();
  mainContainer.appendChild(productsPanel);
  
  container.appendChild(mainContainer);
  
  // Initially show companies panel, hide products panel
  showCompaniesPanel();
}

// Create Companies Panel
async function createCompaniesPanel() {
  const companiesPanel = document.createElement('div');
  companiesPanel.id = 'titlesCompaniesPanel';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'product-studio-header';
  header.innerHTML = `
    <div class="product-studio-header-left">
      <h2 class="product-studio-header-title">
        Companies Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        Analyzing company performance across all metrics
      </div>
    </div>
  `;
  companiesPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  
  // Create placeholder table
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header row
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="rank" style="width: 70px;">
      Rank
    </th>
    <th class="center sortable" data-sort="share" style="width: 80px;">
      Share
    </th>
    <th class="center sortable" data-sort="growth" style="width: 70px;">
      Growth
    </th>
    <th class="center" style="width: 70px;">Logo</th>
    <th class="sortable" data-sort="company" style="max-width: 350px; width: 350px;">
      Company Name
    </th>
    <th class="center sortable" data-sort="products" style="width: 65px;">
      Products
    </th>
    <th class="center sortable" data-sort="revenue" style="width: 80px;">
      Revenue
    </th>
    <th class="center sortable" data-sort="trend" style="width: 60px;">
      Trend
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body with placeholder data
  const tbody = document.createElement('tbody');
  for (let i = 1; i <= 5; i++) {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="center">${i}</td>
      <td class="center">${(Math.random() * 25 + 5).toFixed(1)}%</td>
      <td class="center">+${(Math.random() * 15 + 2).toFixed(1)}%</td>
      <td class="center">🏢</td>
      <td>Company ${i} - Sample Data</td>
      <td class="center">${Math.floor(Math.random() * 50 + 10)}</td>
      <td class="center">$${(Math.random() * 500 + 100).toFixed(0)}K</td>
      <td class="center">📈</td>
    `;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  
  wrapper.appendChild(table);
  tableContainer.appendChild(wrapper);
  companiesPanel.appendChild(tableContainer);
  
  return companiesPanel;
}

// Create Products Panel with real data
async function createProductsPanel() {
  const productsPanel = document.createElement('div');
  productsPanel.id = 'titlesGlobalProductsPanel';
  productsPanel.style.flex = '0.8'; // Make it slightly narrower
  
  // Create header with averages section
  const header = document.createElement('div');
  header.className = 'product-studio-header';
  header.innerHTML = `
    <div class="product-studio-header-left">
      <h2 class="product-studio-header-title">
        Global Products Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        Analyzing product performance across all search terms
      </div>
    </div>
    <div class="titles-avg-scores" style="position: absolute; right: 20px; display: flex; gap: 20px;">
      <div class="titles-avg-item" id="globalAvgTScoreContainer">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG T-SCORE</span>
          <div class="titles-avg-score-display">
            <span class="titles-avg-value" id="globalAvgTScore">-</span>
            <span class="titles-avg-max">/100</span>
          </div>
        </div>
      </div>
      <div class="titles-avg-item" id="globalAvgKOSContainer">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG KOS</span>
          <div class="titles-avg-score-display">
            <span class="titles-avg-value" id="globalAvgKOS">-</span>
            <span class="titles-avg-max">/20</span>
          </div>
        </div>
      </div>
      <div class="titles-avg-item" id="globalAvgGOSContainer">
        <div style="display: flex; flex-direction: column; align-items: center;">
          <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG GOS</span>
          <div class="titles-avg-score-display">
            <span class="titles-avg-value" id="globalAvgGOS">-</span>
            <span class="titles-avg-max">/80</span>
          </div>
        </div>
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  tableContainer.id = 'globalProductsTableContainer';
  
  productsPanel.appendChild(tableContainer);
  
  // Load and render data
  try {
    const evaluatedProducts = await loadProductTitlesEvaluated();
    
    if (evaluatedProducts.length > 0) {
      const productTitles = evaluatedProducts.map(p => p.title);
      const processedMetrics = await loadProcessedDataForProducts(productTitles);
      
      await renderGlobalProductsTable(tableContainer, evaluatedProducts, processedMetrics);
      
      // Update averages
      updateGlobalAverages(evaluatedProducts);
    } else {
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          No product data found for ${window.myCompany || 'your company'}
        </div>
      `;
    }
  } catch (error) {
    console.error('[createProductsPanel] Error loading data:', error);
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        Error loading product data. Please refresh and try again.
      </div>
    `;
  }
  
  return productsPanel;
}

// Initialize toggle functionality
function initializeProductStudioToggle() {
  const companiesBtn = document.getElementById('studioCompaniesMode');
  const productsBtn = document.getElementById('studioProductsMode');
  
  console.log('[initializeProductStudioToggle] Found buttons:', {
    companiesBtn: !!companiesBtn,
    productsBtn: !!productsBtn
  });
  
  if (companiesBtn && productsBtn) {
    // Remove any existing event listeners
    companiesBtn.replaceWith(companiesBtn.cloneNode(true));
    productsBtn.replaceWith(productsBtn.cloneNode(true));
    
    // Get the new elements after cloning
    const newCompaniesBtn = document.getElementById('studioCompaniesMode');
    const newProductsBtn = document.getElementById('studioProductsMode');
    
    newCompaniesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[ProductStudio] Companies button clicked');
      
      newCompaniesBtn.classList.add('active');
      newProductsBtn.classList.remove('active');
      showCompaniesPanel();
      console.log('Companies mode selected in Product Studio');
    });
    
    newProductsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[ProductStudio] Products button clicked');
      
      newProductsBtn.classList.add('active');
      newCompaniesBtn.classList.remove('active');
      showProductsPanel();
      console.log('Products mode selected in Product Studio');
    });
    
    console.log('[initializeProductStudioToggle] Event listeners attached successfully');
  } else {
    console.error('[initializeProductStudioToggle] Could not find toggle buttons');
  }
}

// Show Companies Panel
function showCompaniesPanel() {
  const companiesPanel = document.getElementById('titlesCompaniesPanel');
  const productsPanel = document.getElementById('titlesGlobalProductsPanel');
  
  if (companiesPanel && productsPanel) {
    companiesPanel.style.display = 'flex';
    productsPanel.style.display = 'none';
  }
}

// Show Products Panel
function showProductsPanel() {
  const companiesPanel = document.getElementById('titlesCompaniesPanel');
  const productsPanel = document.getElementById('titlesGlobalProductsPanel');
  
  if (companiesPanel && productsPanel) {
    companiesPanel.style.display = 'none';
    productsPanel.style.display = 'flex';
  }
}

// Render global products table
async function renderGlobalProductsTable(container, products, processedMetrics) {
  const matchedProducts = matchProductsWithGlobalData(products);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position" style="width: 70px;">
      Pos
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share" style="width: 80px;">
      Share
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 70px;">
      ROAS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center" style="width: 70px;">Image</th>
    <th class="sortable" data-sort="title" style="max-width: 300px; width: 300px;">
      Product Title
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="score" style="width: 75px;">
      T-Score
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="kos" style="width: 60px;">
      KOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="gos" style="width: 60px;">
      GOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="suggestions" style="width: 60px;">
      Sugg
      <span class="titles-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    row.dataset.productTitle = product.title;
    row.dataset.productData = JSON.stringify(product);
    
    // Get processed metrics
    const productProcessedMetrics = processedMetrics.get(product.title);
    const adPosition = productProcessedMetrics?.avgPosition || null;
    const marketShare = productProcessedMetrics?.avgVisibility || null;
    const trend = productProcessedMetrics?.trend || null;
    
    // Get matched product for image
    const matchedProduct = matchedProducts.get(product.title);
    const imageUrl = matchedProduct?.thumbnail || '';
    
    // Position badge class
    let posClass = 'bottom';
    if (adPosition) {
      if (adPosition <= 3) posClass = 'top';
      else if (adPosition <= 8) posClass = 'mid';
      else if (adPosition <= 14) posClass = 'low';
    }
    
    // Score classes
    const roundedScore = Math.round(product.finalScore);
    let tscoreClass = 'titles-tscore-poor';
    if (roundedScore > 70) tscoreClass = 'titles-tscore-excellent';
    else if (roundedScore >= 55) tscoreClass = 'titles-tscore-good';
    else if (roundedScore >= 40) tscoreClass = 'titles-tscore-fair';
    
    let kosClass = 'titles-kos-poor';
    if (product.kos > 15) kosClass = 'titles-kos-excellent';
    else if (product.kos >= 10) kosClass = 'titles-kos-good';
    else if (product.kos > 5) kosClass = 'titles-kos-fair';
    
    let gosClass = 'titles-gos-poor';
    if (product.gos > 60) gosClass = 'titles-gos-excellent';
    else if (product.gos >= 40) gosClass = 'titles-gos-good';
    else if (product.gos >= 20) gosClass = 'titles-gos-fair';
    
    const suggestionsCount = product.suggestions?.length || 0;
    let suggClass = '';
    if (suggestionsCount >= 7) suggClass = 'critical';
    else if (suggestionsCount >= 4) suggClass = 'has-many';
    
    row.innerHTML = `
      <td class="center">
        ${adPosition !== null ? 
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
        <span style="color: #adb5bd;">-</span>
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
          <div class="titles-product-title" style="max-width: 280px;">
            ${product.title}
          </div>
        </div>
      </td>
      <td class="center">
        ${product.finalScore > 0 ? 
          `<span class="titles-score-fraction ${tscoreClass}">
            <span class="titles-score-value">${roundedScore}</span>
            <span class="titles-score-max">/100</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${product.kos > 0 ? 
          `<span class="titles-score-fraction ${kosClass}">
            <span class="titles-score-value">${product.kos.toFixed(1)}</span>
            <span class="titles-score-max">/20</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${product.gos > 0 ? 
          `<span class="titles-score-fraction ${gosClass}">
            <span class="titles-score-value">${product.gos}</span>
            <span class="titles-score-max">/80</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${suggestionsCount > 0 ? 
          `<span class="titles-suggestions-count ${suggClass}" title="${suggestionsCount} improvement suggestions">${suggestionsCount}</span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add click handlers for row expansion
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('.titles-product-img-container')) return;
      toggleGlobalRowExpansion(this);
    });
  });
  
  // Add image hover positioning
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
        
        if (left + 300 > viewportWidth) {
          left = rect.left - 310;
        }
        
        if (top < 10) {
          top = 10;
        }
        
        if (top + 300 > viewportHeight - 10) {
          top = viewportHeight - 310;
        }
        
        zoomImg.style.left = `${left}px`;
        zoomImg.style.top = `${top}px`;
      });
    }
  });
  
  // Add sorting functionality
  addGlobalSortingFunctionality(table, products, processedMetrics);
}

// Add sorting functionality for global products
function addGlobalSortingFunctionality(table, products, processedMetrics) {
  const headers = table.querySelectorAll('th.sortable');
  let currentSort = { column: 'score', direction: 'desc' };
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      
      if (currentSort.column === sortKey) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = sortKey;
        currentSort.direction = 'desc';
      }
      
      headers.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      this.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
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
          case 'score':
            aVal = a.finalScore || 0;
            bVal = b.finalScore || 0;
            break;
          case 'kos':
            aVal = a.kos || 0;
            bVal = b.kos || 0;
            break;
          case 'gos':
            aVal = a.gos || 0;
            bVal = b.gos || 0;
            break;
          case 'suggestions':
            aVal = a.suggestions?.length || 0;
            bVal = b.suggestions?.length || 0;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          default:
            aVal = 0;
            bVal = 0;
        }
        
        if (currentSort.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      const container = table.closest('.product-studio-table-container');
      container.innerHTML = '';
      renderGlobalProductsTable(container, sortedProducts, processedMetrics);
    });
  });
}

// Update averages for global products
function updateGlobalAverages(products) {
  let totalTScore = 0;
  let totalKOS = 0;
  let totalGOS = 0;
  let count = 0;
  
  products.forEach(product => {
    if (product.finalScore > 0) {
      totalTScore += product.finalScore;
      totalKOS += product.kos;
      totalGOS += product.gos;
      count++;
    }
  });
  
  const avgTScoreValue = count > 0 ? Math.round(totalTScore / count) : 0;
  const avgKOSValue = count > 0 ? (totalKOS / count) : 0;
  const avgGOSValue = count > 0 ? Math.round(totalGOS / count) : 0;
  
  setTimeout(() => {
    const avgTScoreEl = document.getElementById('globalAvgTScore');
    const avgKOSEl = document.getElementById('globalAvgKOS');
    const avgGOSEl = document.getElementById('globalAvgGOS');
    
    if (avgTScoreEl) {
      avgTScoreEl.textContent = count > 0 ? avgTScoreValue : '-';
      const container = document.getElementById('globalAvgTScoreContainer');
      if (container && count > 0) {
        container.className = 'titles-avg-item';
        if (avgTScoreValue > 70) container.classList.add('tscore-excellent');
        else if (avgTScoreValue >= 55) container.classList.add('tscore-good');
        else if (avgTScoreValue >= 40) container.classList.add('tscore-fair');
        else container.classList.add('tscore-poor');
      }
    }
    
    if (avgKOSEl) {
      avgKOSEl.textContent = count > 0 ? avgKOSValue.toFixed(1) : '-';
      const container = document.getElementById('globalAvgKOSContainer');
      if (container && count > 0) {
        container.className = 'titles-avg-item';
        if (avgKOSValue > 15) container.classList.add('kos-excellent');
        else if (avgKOSValue >= 10) container.classList.add('kos-good');
        else if (avgKOSValue > 5) container.classList.add('kos-fair');
        else container.classList.add('kos-poor');
      }
    }
    
    if (avgGOSEl) {
      avgGOSEl.textContent = count > 0 ? avgGOSValue : '-';
      const container = document.getElementById('globalAvgGOSContainer');
      if (container && count > 0) {
        container.className = 'titles-avg-item';
        if (avgGOSValue > 60) container.classList.add('gos-excellent');
        else if (avgGOSValue >= 40) container.classList.add('gos-good');
        else if (avgGOSValue >= 20) container.classList.add('gos-fair');
        else container.classList.add('gos-poor');
      }
    }
  }, 50);
}

// Make functions globally available
window.initializeProductStudio = initializeProductStudio;
window.showCompaniesPanel = showCompaniesPanel;
window.showProductsPanel = showProductsPanel;
