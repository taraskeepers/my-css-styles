// product_studio.js - Product Studio Implementation

// Global variables for product studio
window.productStudioInitialized = false;

// Initialize Product Studio functionality
async function initializeProductStudio() {
  console.log('[initializeProductStudio] Starting Product Studio initialization...');
  
  if (window.productStudioInitialized) {
    return;
  }
  
  // Add product studio specific styles
  addProductStudioStyles();
  
  // Load and render product studio panels
  await loadAndRenderProductStudioPanels();
  
  // Initialize toggle functionality
  initializeProductStudioToggle();
  
  window.productStudioInitialized = true;
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
        Products Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        Analyzing product performance across all campaigns
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  
  // Create placeholder table
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header row (same as titles analyzer)
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position" style="width: 70px;">
      Pos
    </th>
    <th class="center sortable" data-sort="share" style="width: 80px;">
      Share
    </th>
    <th class="center sortable" data-sort="roas" style="width: 70px;">
      ROAS
    </th>
    <th class="center" style="width: 70px;">Image</th>
    <th class="sortable" data-sort="title" style="max-width: 350px; width: 350px;">
      Product Title
    </th>
    <th class="center sortable" data-sort="score" style="width: 65px;">
      Score
    </th>
    <th class="center sortable" data-sort="kos" style="width: 50px;">
      KOS
    </th>
    <th class="center sortable" data-sort="gos" style="width: 50px;">
      GOS
    </th>
    <th class="center sortable" data-sort="suggestions" style="width: 60px;">
      Sugg
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
      <td class="center">${(Math.random() * 3 + 1).toFixed(1)}x</td>
      <td class="center">📱</td>
      <td>Sample Product ${i} - Global Analysis</td>
      <td class="center">${Math.floor(Math.random() * 40 + 60)}</td>
      <td class="center">${Math.floor(Math.random() * 8 + 12)}</td>
      <td class="center">${Math.floor(Math.random() * 30 + 50)}</td>
      <td class="center">${Math.floor(Math.random() * 5 + 1)}</td>
    `;
    tbody.appendChild(row);
  }
  table.appendChild(tbody);
  
  wrapper.appendChild(table);
  tableContainer.appendChild(wrapper);
  productsPanel.appendChild(tableContainer);
  
  return productsPanel;
}

// Initialize toggle functionality
function initializeProductStudioToggle() {
  const companiesBtn = document.getElementById('companiesMode');
  const productsBtn = document.getElementById('productsMode');
  
  if (companiesBtn && productsBtn) {
    // Remove any existing event listeners
    companiesBtn.replaceWith(companiesBtn.cloneNode(true));
    productsBtn.replaceWith(productsBtn.cloneNode(true));
    
    // Get the new elements after cloning
    const newCompaniesBtn = document.getElementById('companiesMode');
    const newProductsBtn = document.getElementById('productsMode');
    
    newCompaniesBtn.addEventListener('click', function() {
      newCompaniesBtn.classList.add('active');
      newProductsBtn.classList.remove('active');
      showCompaniesPanel();
      console.log('Companies mode selected in Product Studio');
    });
    
    newProductsBtn.addEventListener('click', function() {
      newProductsBtn.classList.add('active');
      newCompaniesBtn.classList.remove('active');
      showProductsPanel();
      console.log('Products mode selected in Product Studio');
    });
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

// Make functions globally available
window.initializeProductStudio = initializeProductStudio;
window.showCompaniesPanel = showCompaniesPanel;
window.showProductsPanel = showProductsPanel;
