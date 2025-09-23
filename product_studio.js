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

// Create Products Panel
async function createProductsPanel() {
  const productsPanel = document.createElement('div');
  productsPanel.id = 'titlesGlobalProductsPanel';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'product-studio-header';
  header.innerHTML = `
    <div class="product-studio-header-left">
      <h2 class="product-studio-header-title">
        Global Products Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        Analyzing global product title performance from evaluated data
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  productsPanel.appendChild(tableContainer);
  
  // Load and render real data
  try {
    console.log('[createProductsPanel] Loading global products data...');
    const products = await loadGlobalProductTitlesData();
    const analyzerResults = createGlobalAnalyzerResults(products);
    
    if (products.length > 0) {
      await renderGlobalProductsTable(tableContainer, products, analyzerResults);
      console.log('[createProductsPanel] Successfully rendered global products table');
    } else {
      // Show no data message
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          <div style="font-size: 32px; margin-bottom: 10px;">📊</div>
          <div style="font-size: 18px; margin-bottom: 10px;">No evaluated products found</div>
          <div style="font-size: 14px;">
            Make sure product titles have been evaluated for your company: ${window.myCompany || 'Unknown'}
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('[createProductsPanel] Error loading global products data:', error);
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        <div style="font-size: 32px; margin-bottom: 10px;">⚠️</div>
        <div style="font-size: 18px; margin-bottom: 10px;">Error loading products data</div>
        <div style="font-size: 14px;">Please refresh and try again</div>
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

// Load data from product_titles_evaluated table for Global Products Panel
async function loadGlobalProductTitlesData() {
  return new Promise((resolve, reject) => {
    console.log('[loadGlobalProductTitlesData] Starting to load global titles data...');
    
    // Use the existing global getProjectTablePrefix function
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
    
    const tableName = `${tablePrefix}product_titles_evaluated`;
    
    console.log('[loadGlobalProductTitlesData] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Check if projectData object store exists
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadGlobalProductTitlesData] projectData object store not found');
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
          console.warn('[loadGlobalProductTitlesData] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Extract the actual data array
        const allRecords = Array.isArray(result.data) ? result.data : [result.data];
        console.log('[loadGlobalProductTitlesData] Total records found:', allRecords.length);
        
        // Filter by company (source should match window.myCompany lowercased)
        const myCompany = (window.myCompany || '').toLowerCase();
        console.log('[loadGlobalProductTitlesData] Filtering by company:', myCompany);
        
        const filteredRecords = allRecords.filter(record => {
          const recordSource = (record.source || '').toLowerCase();
          return recordSource === myCompany;
        });
        
        console.log('[loadGlobalProductTitlesData] Records after company filter:', filteredRecords.length);
        
        // Map the data structure to match expected format
        const products = filteredRecords.map(record => {
          // Parse score_breakdown if it's a string
          let scoreBreakdown = {};
          if (record.score_breakdown) {
            try {
              scoreBreakdown = typeof record.score_breakdown === 'string' ? 
                JSON.parse(record.score_breakdown) : record.score_breakdown;
            } catch (e) {
              console.warn('[loadGlobalProductTitlesData] Error parsing score_breakdown:', e);
            }
          }
          
          // Parse matched_terms if it's a string
          let matchedTerms = {};
          if (record.matched_terms) {
            try {
              matchedTerms = typeof record.matched_terms === 'string' ? 
                JSON.parse(record.matched_terms) : record.matched_terms;
            } catch (e) {
              console.warn('[loadGlobalProductTitlesData] Error parsing matched_terms:', e);
            }
          }
          
          return {
            title: record.title || '',
            searchTerm: record.q || '',
            source: record.source || '',
            detectedBrand: record.detected_brand || '',
            detectedCategory: record.detected_category || '',
            finalScore: parseFloat(record.final_score) || 0,
            kos: parseFloat(record.kos) || 0,
            gos: parseFloat(record.gos) || 0,
            titleLength: parseInt(record.title_length) || 0,
            wordCount: parseInt(record.word_count) || 0,
            improvementSuggestions: record.improvement_suggestions || [],
            suggestionsCount: (record.improvement_suggestions || []).length,
            evaluatedAt: record.evaluated_at || '',
            dateSeen: record.date_seen?.value || record.date_seen || '',
            scoreBreakdown: scoreBreakdown,
            matchedTerms: matchedTerms,
            // Add some dummy values for compatibility (won't be displayed)
            impressions: 0,
            clicks: 0,
            cost: 0,
            conversions: 0,
            convValue: 0,
            roas: 0
          };
        });
        
        // Sort by final score (highest first)
        products.sort((a, b) => b.finalScore - a.finalScore);
        
        console.log('[loadGlobalProductTitlesData] Processed global products:', products.length);
        db.close();
        resolve(products);
      };
      
      getRequest.onerror = function() {
        console.error('[loadGlobalProductTitlesData] Error getting data:', getRequest.error);
        db.close();
        reject(new Error('Failed to load global titles data'));
      };
    };
    
    request.onerror = function() {
      console.error('[loadGlobalProductTitlesData] Failed to open database:', request.error);
      reject(new Error('Failed to open database'));
    };
  });
}

// Create analyzer results map from global products data
function createGlobalAnalyzerResults(products) {
  const analyzerMap = new Map();
  
  products.forEach(product => {
    if (product.title) {
      analyzerMap.set(product.title, {
        finalScore: product.finalScore,
        avgKos: product.kos,
        gos: product.gos,
        kos: product.kos,
        scoreBreakdown: product.scoreBreakdown,
        improvementSuggestions: product.improvementSuggestions,
        titleLength: product.titleLength,
        wordCount: product.wordCount,
        searchTerm: product.searchTerm,
        detectedBrand: product.detectedBrand,
        detectedCategory: product.detectedCategory
      });
    }
  });
  
  console.log('[createGlobalAnalyzerResults] Created analyzer results for:', analyzerMap.size, 'products');
  return analyzerMap;
}

// Render Global Products Table (simplified without metric columns)
async function renderGlobalProductsTable(container, products, analyzerResults = new Map()) {
  console.log('[renderGlobalProductsTable] Rendering table with', products.length, 'products');
  
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header (simplified - no POS, SHARE, ROAS, IMPR, CLICKS columns)
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center" style="width: 70px;">Image</th>
    <th class="sortable" data-sort="title" style="max-width: 400px; width: 400px;">
      Product Title
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="searchTerm" style="width: 150px;">
      Search Term
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="score" style="width: 65px;">
      Score
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="kos" style="width: 50px;">
      KOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="gos" style="width: 50px;">
      GOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="suggestions" style="width: 60px;">
      Sugg
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="category" style="width: 100px;">
      Category
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="brand" style="width: 100px;">
      Brand
      <span class="titles-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    row.dataset.productTitle = product.title;
    row.style.cursor = 'pointer';
    
    // Get analyzer data
    const analyzerData = analyzerResults.get(product.title);
    
    // Score styling
    const score = analyzerData?.finalScore || product.finalScore || 0;
    const scoreClass = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
    const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#86efac' : score >= 40 ? '#fbbf24' : '#ef4444';
    
    // KOS styling
    const kos = analyzerData?.kos || product.kos || 0;
    const kosClass = kos >= 16 ? 'excellent' : kos >= 12 ? 'good' : kos >= 8 ? 'fair' : 'poor';
    const kosColor = kos >= 16 ? '#22c55e' : kos >= 12 ? '#86efac' : kos >= 8 ? '#fbbf24' : '#ef4444';
    
    // GOS styling
    const gos = analyzerData?.gos || product.gos || 0;
    const gosClass = gos >= 64 ? 'excellent' : gos >= 48 ? 'good' : gos >= 32 ? 'fair' : 'poor';
    const gosColor = gos >= 64 ? '#22c55e' : gos >= 48 ? '#86efac' : gos >= 32 ? '#fbbf24' : '#ef4444';
    
    row.innerHTML = `
      <td class="center">
        <div style="width: 50px; height: 50px; background: #f5f5f5; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
          📱
        </div>
      </td>
      <td style="max-width: 400px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${product.title}">
        ${product.title}
      </td>
      <td class="center" style="font-size: 12px; color: #666;">
        ${product.searchTerm}
      </td>
      <td class="center">
        <div style="background: ${scoreColor}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">
          ${Math.round(score)}
        </div>
      </td>
      <td class="center">
        <div style="background: ${kosColor}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">
          ${Math.round(kos)}
        </div>
      </td>
      <td class="center">
        <div style="background: ${gosColor}; color: white; padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">
          ${Math.round(gos)}
        </div>
      </td>
      <td class="center">
        <div style="background: #667eea; color: white; padding: 4px 8px; border-radius: 12px; font-weight: 600; font-size: 12px;">
          ${product.suggestionsCount}
        </div>
      </td>
      <td class="center" style="font-size: 12px; color: #666;">
        ${product.detectedCategory}
      </td>
      <td class="center" style="font-size: 12px; color: #666;">
        ${product.detectedBrand}
      </td>
    `;
    
    // Add click handler for row expansion
    row.addEventListener('click', function(e) {
      e.preventDefault();
      toggleGlobalRowExpansion(row, analyzerResults);
    });
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add sorting functionality
  addGlobalProductsSortingFunctionality(table, products, analyzerResults);
}

// Toggle row expansion for global products (simplified version)
function toggleGlobalRowExpansion(row, analyzerResults) {
  const nextRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');
  
  if (isExpanded && nextRow && nextRow.classList.contains('titles-expanded-row')) {
    row.classList.remove('expanded');
    nextRow.remove();
    return;
  }
  
  // Close other expanded rows
  const tbody = row.parentElement;
  tbody.querySelectorAll('.expanded').forEach(r => r.classList.remove('expanded'));
  tbody.querySelectorAll('.titles-expanded-row').forEach(r => r.remove());
  
  row.classList.add('expanded');
  
  const productTitle = row.dataset.productTitle;
  const analyzerData = analyzerResults.get(productTitle);
  
  if (!analyzerData) {
    console.warn('[toggleGlobalRowExpansion] No analyzer data found for:', productTitle);
    return;
  }
  
  // Create expanded row with simplified content
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'titles-expanded-row';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = 9; // Match the number of columns
  expandedCell.style.padding = '0';
  expandedCell.style.background = '#f8f9fa';
  
  let expandedHTML = `
    <div class="titles-expanded-container" style="padding: 16px;">
      <div class="titles-compact-grid" style="display: flex; gap: 16px; align-items: flex-start;">
  `;
  
  // Score breakdown section
  expandedHTML += `
    <div class="titles-compact-section" style="width: 300px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span>📊</span>
        <h4 class="titles-compact-title">Score Breakdown</h4>
      </div>
      <div class="titles-compact-body">
        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
          <span style="color: #6a737d;">Final Score:</span>
          <strong style="color: ${analyzerData.finalScore > 60 ? '#22c55e' : analyzerData.finalScore > 40 ? '#f59e0b' : '#ef4444'}">
            ${Math.round(analyzerData.finalScore)}/100
          </strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
          <span style="color: #6a737d;">KOS:</span>
          <strong>${analyzerData.kos}/20</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
          <span style="color: #6a737d;">GOS:</span>
          <strong>${analyzerData.gos}/80</strong>
        </div>
        <div style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span style="color: #6a737d;">Search Term:</span>
          <strong>${analyzerData.searchTerm}</strong>
        </div>
      </div>
    </div>
  `;
  
  // Improvements section
  expandedHTML += `
    <div class="titles-compact-section" style="width: 420px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span>💡</span>
        <h4 class="titles-compact-title">Improvements (${analyzerData.improvementSuggestions?.length || 0})</h4>
      </div>
      <div class="titles-compact-body" style="height: 200px; overflow-y: auto;">
        <div class="titles-suggestions-list">
  `;
  
  if (analyzerData.improvementSuggestions && analyzerData.improvementSuggestions.length > 0) {
    analyzerData.improvementSuggestions.forEach((suggestion, index) => {
      expandedHTML += `
        <div class="titles-suggestion-item">
          <span class="titles-suggestion-icon">${index + 1}</span>
          <span>${suggestion}</span>
        </div>
      `;
    });
  } else {
    expandedHTML += `
      <div style="color: #6a737d; font-size: 12px; text-align: center; padding: 40px;">
        <div style="font-size: 32px; margin-bottom: 10px;">✨</div>
        <div>No improvements needed!</div>
        <div style="font-size: 11px; margin-top: 4px;">This title is well optimized.</div>
      </div>
    `;
  }
  
  expandedHTML += `
        </div>
      </div>
    </div>
  `;
  
  expandedHTML += '</div></div>';
  
  expandedCell.innerHTML = expandedHTML;
  expandedRow.appendChild(expandedCell);
  row.parentNode.insertBefore(expandedRow, row.nextSibling);
}

// Add sorting functionality for global products
function addGlobalProductsSortingFunctionality(table, products, analyzerResults) {
  const headers = table.querySelectorAll('th.sortable');
  let currentSort = { column: 'score', direction: 'desc' };
  
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
        
        switch (sortKey) {
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'searchTerm':
            aVal = a.searchTerm.toLowerCase();
            bVal = b.searchTerm.toLowerCase();
            break;
          case 'score':
            aVal = a.finalScore;
            bVal = b.finalScore;
            break;
          case 'kos':
            aVal = a.kos;
            bVal = b.kos;
            break;
          case 'gos':
            aVal = a.gos;
            bVal = b.gos;
            break;
          case 'suggestions':
            aVal = a.suggestionsCount;
            bVal = b.suggestionsCount;
            break;
          case 'category':
            aVal = a.detectedCategory.toLowerCase();
            bVal = b.detectedCategory.toLowerCase();
            break;
          case 'brand':
            aVal = a.detectedBrand.toLowerCase();
            bVal = b.detectedBrand.toLowerCase();
            break;
          default:
            aVal = a.finalScore;
            bVal = b.finalScore;
        }
        
        if (typeof aVal === 'string') {
          return currentSort.direction === 'asc' ? 
            aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        } else {
          return currentSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
      });
      
      // Re-render table with sorted data
      const container = table.closest('.product-studio-table-container');
      container.innerHTML = '';
      renderGlobalProductsTable(container, sortedProducts, analyzerResults);
    });
  });
}

// Make functions globally available
window.initializeProductStudio = initializeProductStudio;
window.showCompaniesPanel = showCompaniesPanel;
window.showProductsPanel = showProductsPanel;
// Make the new functions globally available
window.loadGlobalProductTitlesData = loadGlobalProductTitlesData;
window.createGlobalAnalyzerResults = createGlobalAnalyzerResults;
window.renderGlobalProductsTable = renderGlobalProductsTable;
