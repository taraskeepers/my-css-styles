// Add device filter variable
window.selectedDeviceFilter = 'all'; // 'all', 'DESKTOP', 'MOBILE', 'TABLET'
// Add these global variables for bucket filtering
window.selectedBucketFilter = null; // {bucketType: 'PROFITABILITY_BUCKET', bucketValue: 'Strong Performers'}
// Global settings for product metrics calculation
window.productMetricsSettings = {
  useLatestDataDate: false, // true = use latest data date, false = use today's date
  // Future settings can be added here
};
window.bucketedProductsMetricsSettings = {
  selectedMetrics: ['ConvValue', 'Cost', 'Impressions', 'Clicks', 'CTR'], // Default 5 metrics
  availableMetrics: {
    'Impressions': { label: 'Impr', key: 'Impressions' },
    'Clicks': { label: 'Clicks', key: 'Clicks' },
    'CTR': { label: 'CTR', key: 'CTR', suffix: '%' },
    'Conversions': { label: 'Conv', key: 'Conversions' },
    'ConvValue': { label: 'Value', key: 'ConvValue', prefix: '$' },
    'Cost': { label: 'Cost', key: 'Cost', prefix: '$' }
  }
};
// Main Buckets Switcher functionality for Google Ads

// Import needed functions from global scope
const getProductCombinations = window.getProductCombinations || function() { return []; };
const getBucketValue = window.getBucketValue || function(bucketData) {
  if (typeof bucketData === 'string') {
    try {
      const parsed = JSON.parse(bucketData);
      return parsed.value || bucketData;
    } catch (e) {
      return bucketData;
    }
  }
  return bucketData?.value || bucketData;
};
const calculateGoogleAdsProductMetrics = window.calculateGoogleAdsProductMetrics || function() { 
  return { avgRating: 40, avgVisibility: 0, activeLocations: 0, inactiveLocations: 0 }; 
};
const getGoogleAdsRatingBadgeColor = window.getGoogleAdsRatingBadgeColor || function(rating) {
  if (rating <= 3) return '#4CAF50';
  if (rating <= 10) return '#66BB6A';
  if (rating <= 20) return '#FFA726';
  return '#F44336';
};

// Initialize main buckets switcher
function initializeMainBucketsSwitcher() {
  // Set default view
  window.currentMainBucketView = 'overview';
  
  // Create bucketed products container if it doesn't exist
  createBucketedProductsContainer();
  
  // Set up event listeners
  setupMainBucketsSwitcherEvents();
}

// Create the bucketed products container
function createBucketedProductsContainer() {
  console.log('[createBucketedProductsContainer] Starting...');
  
  // Try multiple selectors to find the content wrapper
  let contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (!contentWrapper) {
    // Try to find the main Google Ads container
    const googleAdsContainer = document.getElementById('googleAdsContainer');
    if (googleAdsContainer) {
      contentWrapper = googleAdsContainer.querySelector('.content-wrapper');
    }
  }
  
  console.log('[createBucketedProductsContainer] Content wrapper found:', contentWrapper);
  
  if (!contentWrapper) {
    console.error('[createBucketedProductsContainer] Content wrapper not found! Trying alternative approach...');
    // As a fallback, try to append to the main container
    const mainContainer = document.getElementById('googleAdsContainer');
    if (mainContainer) {
      contentWrapper = mainContainer;
    } else {
      return;
    }
  }
  
  // Check if container already exists
  let bucketedProductsContainer = document.getElementById('bucketed_products_container');
  if (!bucketedProductsContainer) {
    console.log('[createBucketedProductsContainer] Creating new container...');
    bucketedProductsContainer = document.createElement('div');
    bucketedProductsContainer.id = 'bucketed_products_container';
    bucketedProductsContainer.className = 'google-ads-bucketed-products-container';
    bucketedProductsContainer.style.cssText = `
      width: 1195px;
      min-height: 600px;
      margin: 20px 0 20px 20px;
      background-color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 12px;
      padding: 20px;
      display: none;
      overflow-y: auto;
      max-height: 80vh;
      position: relative;
      z-index: 100;
    `;
    
    // Insert after buckets_products container
    const buckets_products = document.getElementById('buckets_products');
    console.log('[createBucketedProductsContainer] buckets_products found:', buckets_products);
    
    if (buckets_products && buckets_products.parentNode) {
      // Insert after buckets_products
      buckets_products.parentNode.insertBefore(bucketedProductsContainer, buckets_products.nextSibling);
      console.log('[createBucketedProductsContainer] Container inserted after buckets_products');
    } else {
      // Just append to content wrapper
      contentWrapper.appendChild(bucketedProductsContainer);
      console.log('[createBucketedProductsContainer] Container appended to content wrapper');
    }
  } else {
    console.log('[createBucketedProductsContainer] Container already exists');
  }
}

// Create products buckets filter container
function createProductsBucketsFilterContainer() {
  let contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (!contentWrapper) {
    const googleAdsContainer = document.getElementById('googleAdsContainer');
    if (googleAdsContainer) {
      contentWrapper = googleAdsContainer.querySelector('.content-wrapper');
    }
  }
  
  if (!contentWrapper) {
    contentWrapper = document.getElementById('googleAdsContainer');
    if (!contentWrapper) return;
  }
  
  // Check if container already exists
  let filterContainer = document.getElementById('products-buckets-filter-container');
  if (!filterContainer) {
    filterContainer = document.createElement('div');
    filterContainer.id = 'products-buckets-filter-container';
    filterContainer.style.cssText = `
      width: 1195px;
      height: 200px;
      margin: 110px 0 0 20px;
      background-color: #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      border-radius: 12px;
      padding: 20px;
      display: none;
      position: relative;
      z-index: 100;
    `;
    
    // Insert before bucketed_products_container
    const bucketedProducts = document.getElementById('bucketed_products_container');
    if (bucketedProducts && bucketedProducts.parentNode) {
      bucketedProducts.parentNode.insertBefore(filterContainer, bucketedProducts);
    } else {
      contentWrapper.appendChild(filterContainer);
    }
  }
  
  return filterContainer;
}

// Render bucket funnels
async function renderBucketFunnels() {
  const filterContainer = document.getElementById('products-buckets-filter-container');
  if (!filterContainer) return;
  
  // Clear existing content
  filterContainer.innerHTML = '';
  
  // Get bucket data
  const accountPrefix = window.currentAccount || 'acc1';
  const days = window.selectedBucketDateRangeDays || 30;
  const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
  const tableName = `${accountPrefix}_googleSheets_productBuckets_${suffix}`;
  
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
if (!result || !result.data) return;
    
    // Filter for Campaign="All" and device filter
    const deviceFilter = window.selectedDeviceFilter || 'all';
    const filteredData = result.data.filter(row => 
      row['Campaign Name'] === 'All' && 
      (deviceFilter === 'all' ? row['Device'] === 'All' : row['Device'] === deviceFilter)
    );
    
    // Create funnel container
    const funnelContainer = document.createElement('div');
    funnelContainer.style.cssText = 'display: flex; gap: 15px; height: 100%;';
    
    // Define bucket types
    const bucketTypes = [
      { key: 'PROFITABILITY_BUCKET', title: 'Profitability', color: '#4CAF50' },
      { key: 'FUNNEL_STAGE_BUCKET', title: 'Funnel Stage', color: '#2196F3' },
      { key: 'INVESTMENT_BUCKET', title: 'Investment', color: '#FF9800' },
      { key: 'CUSTOM_TIER_BUCKET', title: 'Custom Tier', color: '#9C27B0' },
      { key: 'SUGGESTIONS_BUCKET', title: 'Suggestions', color: '#F44336' }
    ];
    
    bucketTypes.forEach(bucketType => {
      const funnelDiv = createBucketFunnel(filteredData, bucketType);
      funnelContainer.appendChild(funnelDiv);
    });
    
    filterContainer.appendChild(funnelContainer);
    
  } catch (error) {
    console.error('[renderBucketFunnels] Error:', error);
    filterContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 50px;">Unable to load bucket data</div>';
  }
}

// Create individual bucket funnel
function createBucketFunnel(data, bucketType) {
  const funnelDiv = document.createElement('div');
  funnelDiv.style.cssText = 'flex: 1; display: flex; flex-direction: column; gap: 10px;';
  
  // Title
  const title = document.createElement('div');
  title.style.cssText = `
    text-align: center;
    font-size: 13px;
    font-weight: 700;
    color: ${bucketType.color};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  `;
  title.textContent = bucketType.title;
  funnelDiv.appendChild(title);
  
  // Count products by bucket value
  const bucketCounts = {};
  let totalProducts = 0;
  
  data.forEach(row => {
    if (bucketType.key === 'SUGGESTIONS_BUCKET' && row[bucketType.key]) {
      try {
        const suggestions = JSON.parse(row[bucketType.key]);
        if (suggestions.length > 0) {
          totalProducts++;
          suggestions.forEach(suggestionObj => {
            const value = suggestionObj.suggestion;
            bucketCounts[value] = (bucketCounts[value] || 0) + 1;
          });
        }
      } catch (e) {
        console.error('Error parsing suggestions:', e);
      }
    } else if (row[bucketType.key]) {
      totalProducts++;
      let value = row[bucketType.key];
      try {
        const parsed = JSON.parse(row[bucketType.key]);
        value = parsed.value || value;
      } catch (e) {
        // Use raw value if not JSON
      }
      bucketCounts[value] = (bucketCounts[value] || 0) + 1;
    }
  });
  
  // Custom sorting function - worst to best
  const bucketConfig = window.bucketConfig && window.bucketConfig[bucketType.key];
  let sortedBuckets = Object.entries(bucketCounts);
  
  sortedBuckets.sort((a, b) => {
    // Always put "Insufficient Data" first
    if (a[0] === 'Insufficient Data') return -1;
    if (b[0] === 'Insufficient Data') return 1;
    
    if (bucketConfig && bucketConfig.order) {
      // Reverse the order (worst to best, top to bottom)
      const reversedOrder = [...bucketConfig.order].reverse();
      const indexA = reversedOrder.indexOf(a[0]);
      const indexB = reversedOrder.indexOf(b[0]);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
    } else {
      // Sort by count ascending (smallest at top)
      return a[1] - b[1];
    }
  });
  
  // Create SVG funnel
  const svgHeight = 140;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', svgHeight);
  svg.style.cssText = 'border-radius: 8px; background: #fafafa; overflow: visible;';
  
  // Store bucket type on SVG for reference
  svg.bucketType = bucketType;
  
  // Calculate funnel dimensions
  const padding = 10;
  const funnelHeight = svgHeight - padding * 2;
  const maxWidth = 200;
  const minWidth = 80;
  
  let currentY = padding;
  const sectionHeight = funnelHeight / Math.max(sortedBuckets.length, 1);
  
  sortedBuckets.forEach(([bucketName, count], index) => {
    const percentage = totalProducts > 0 ? (count / totalProducts * 100) : 0;
    const widthRatio = (sortedBuckets.length - index) / sortedBuckets.length;
    const sectionWidth = minWidth + (maxWidth - minWidth) * widthRatio;
    const x = (maxWidth - sectionWidth) / 2 + 10;
    
    // Get color from config or use default
    const sectionColor = bucketConfig && bucketConfig.colors && bucketConfig.colors[bucketName] 
      ? bucketConfig.colors[bucketName] 
      : bucketType.color;
    
    // Create group for section
    const sectionGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    sectionGroup.style.cssText = 'cursor: pointer; transition: transform 0.3s ease;';
    
    // Create trapezoid path
    const trapezoid = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const nextWidth = index < sortedBuckets.length - 1 
      ? minWidth + (maxWidth - minWidth) * ((sortedBuckets.length - index - 1) / sortedBuckets.length)
      : sectionWidth - 20;
    const nextX = (maxWidth - nextWidth) / 2 + 10;
    
    const path = `
      M ${x} ${currentY}
      L ${x + sectionWidth} ${currentY}
      L ${nextX + nextWidth} ${currentY + sectionHeight}
      L ${nextX} ${currentY + sectionHeight}
      Z
    `;
    
    trapezoid.setAttribute('d', path);
    trapezoid.setAttribute('fill', sectionColor);
    trapezoid.setAttribute('stroke', 'white');
    trapezoid.setAttribute('stroke-width', '2');
    trapezoid.setAttribute('data-original-color', sectionColor);
    trapezoid.setAttribute('data-bucket-name', bucketName);
    trapezoid.setAttribute('data-bucket-type', bucketType.key);
    trapezoid.style.cssText = 'opacity: 0.9; transition: all 0.3s ease;';
    
    // Check if this section is currently selected
    const isSelected = window.selectedBucketFilter && 
                      window.selectedBucketFilter.bucketType === bucketType.key && 
                      window.selectedBucketFilter.bucketValue === bucketName;
    
if (window.selectedBucketFilter && !isSelected) {
      // Gray out non-selected sections
      trapezoid.style.filter = 'grayscale(1) opacity(0.5)';
    } else if (isSelected) {
      // Highlight selected section
      sectionGroup.style.transform = 'scale(1.05)'; // Reduced from 1.1
      trapezoid.style.opacity = '1';
      trapezoid.style.stroke = '#333'; // Add dark contour
      trapezoid.style.strokeWidth = '3'; // Thicker stroke for selected
    }
    
    // Add hover effect
    sectionGroup.addEventListener('mouseenter', function(e) {
      if (!window.selectedBucketFilter || isSelected) {
        this.style.transform = 'scale(1.05)';
        trapezoid.style.opacity = '1';
      }
      showFunnelTooltip(e, bucketName, count, percentage, totalProducts);
    });
    
    sectionGroup.addEventListener('mouseleave', function() {
      if (!window.selectedBucketFilter || !isSelected) {
        this.style.transform = 'scale(1)';
        trapezoid.style.opacity = '0.9';
      }
      hideFunnelTooltip();
    });
    
    // Add click handler
    sectionGroup.addEventListener('click', function() {
      handleBucketFilterClick(bucketType.key, bucketName);
    });
    
    sectionGroup.appendChild(trapezoid);
    
    // Add text with reduced font size
    if (sectionHeight > 15) {
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', x + sectionWidth / 2);
      text.setAttribute('y', currentY + sectionHeight / 2 + 4);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', 'white');
      text.setAttribute('font-size', '9px'); // Reduced from 11px
      text.setAttribute('font-weight', '600');
      text.style.pointerEvents = 'none';
      text.textContent = `${count} (${percentage.toFixed(0)}%)`;
      sectionGroup.appendChild(text);
    }
    
    svg.appendChild(sectionGroup);
    currentY += sectionHeight;
  });
  
  funnelDiv.appendChild(svg);
  return funnelDiv;
}

// Handle bucket filter click
function handleBucketFilterClick(bucketType, bucketValue) {
  // Check if clicking the same bucket (deselect)
  if (window.selectedBucketFilter && 
      window.selectedBucketFilter.bucketType === bucketType && 
      window.selectedBucketFilter.bucketValue === bucketValue) {
    // Deselect
    window.selectedBucketFilter = null;
  } else {
    // Select new bucket
    window.selectedBucketFilter = {
      bucketType: bucketType,
      bucketValue: bucketValue
    };
  }
  
  // Re-render funnels to update visual state
  renderBucketFunnels();
  
  // Reload products with filter
  loadBucketedProducts();
}

// Tooltip functions
let funnelTooltip = null;

function showFunnelTooltip(event, bucketName, count, percentage, total) {
  if (!funnelTooltip) {
    funnelTooltip = document.createElement('div');
    funnelTooltip.style.cssText = `
      position: fixed;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 12px 15px;
      border-radius: 6px;
      font-size: 12px;
      pointer-events: none;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;
    document.body.appendChild(funnelTooltip);
  }
  
  funnelTooltip.innerHTML = `
    <div style="font-weight: 700; margin-bottom: 5px;">${bucketName}</div>
    <div>Products: ${count} / ${total}</div>
    <div>Percentage: ${percentage.toFixed(1)}%</div>
  `;
  
  const x = event.clientX + 10;
  const y = event.clientY - 10;
  funnelTooltip.style.left = x + 'px';
  funnelTooltip.style.top = y + 'px';
  funnelTooltip.style.opacity = '1';
}

function hideFunnelTooltip() {
  if (funnelTooltip) {
    funnelTooltip.style.opacity = '0';
  }
}

// Set up event listeners for the main buckets switcher
function setupMainBucketsSwitcherEvents() {
  document.addEventListener('click', function(e) {
    if (e.target.id === 'mainBucketsOverview' || e.target.id === 'mainBucketedProducts') {
      handleMainBucketSwitch(e.target.id);
    }
  });
}

// Handle switching between main bucket views
function handleMainBucketSwitch(buttonId) {
  // Update active states
  const overviewBtn = document.getElementById('mainBucketsOverview');
  const productsBtn = document.getElementById('mainBucketedProducts');
  
  if (overviewBtn) overviewBtn.classList.remove('active');
  if (productsBtn) productsBtn.classList.remove('active');
  
  if (buttonId === 'mainBucketsOverview') {
    if (overviewBtn) overviewBtn.classList.add('active');
    window.currentMainBucketView = 'overview';
    showBucketsOverview();
  } else if (buttonId === 'mainBucketedProducts') {
    if (productsBtn) productsBtn.classList.add('active');
    window.currentMainBucketView = 'products';
    showBucketedProducts();
  }
}

// Show buckets overview (default view)
function showBucketsOverview() {
  // Show original buckets containers
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  const filterContainer = document.getElementById('products-buckets-filter-container');
  const bucketedProducts = document.getElementById('bucketed_products_container');
  
  if (roasCharts) roasCharts.style.display = 'block';
  if (roasMetricsTable) roasMetricsTable.style.display = 'block';
  if (roasChannels) roasChannels.style.display = 'block';
  if (buckets_products) buckets_products.style.display = 'block';
  if (filterContainer) filterContainer.style.display = 'none';
  if (bucketedProducts) bucketedProducts.style.display = 'none';
}

// Show bucketed products view
function showBucketedProducts() {
  console.log('[showBucketedProducts] Starting...');
  
  // First ensure the containers exist
  createProductsBucketsFilterContainer();
  createBucketedProductsContainer();
  
  // Hide overview containers
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  const filterContainer = document.getElementById('products-buckets-filter-container');
  const bucketedProducts = document.getElementById('bucketed_products_container');
  
  console.log('[showBucketedProducts] Container statuses:', {
    roasCharts: !!roasCharts,
    roasMetricsTable: !!roasMetricsTable,
    roasChannels: !!roasChannels,
    buckets_products: !!buckets_products,
    filterContainer: !!filterContainer,
    bucketedProducts: !!bucketedProducts
  });
  
  if (roasCharts) roasCharts.style.display = 'none';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  if (buckets_products) buckets_products.style.display = 'none';
  if (filterContainer) {
    filterContainer.style.display = 'block';
    renderBucketFunnels(); // Render the funnels
  }
  if (bucketedProducts) {
    bucketedProducts.style.display = 'block';
    console.log('[showBucketedProducts] Set container to display: block');
  }
  
  // Clear any active selection in google-ads-buckets-switcher
  const bucketButtons = document.querySelectorAll('#googleAdsBucketsSwitcher button');
  bucketButtons.forEach(btn => btn.classList.remove('active'));
  
  // Store that we're in products view with no filter
  window.currentBucketFilter = null;
  
  // Load bucketed products
  loadBucketedProducts();
}

async function loadBucketedProducts() {
  console.log('[loadBucketedProducts] Starting...');
  console.log('[loadBucketedProducts] Current filter:', window.currentBucketFilter);
  console.log('[loadBucketedProducts] Bucket filter:', window.selectedBucketFilter);
  
  const container = document.getElementById('bucketed_products_container');
  if (!container) {
    console.error('[loadBucketedProducts] Container not found!');
    return;
  }
  
  // Clear and show loading
  container.innerHTML = '<div style="text-align: center; padding: 50px;"><div class="spinner"></div></div>';
  
  try {
    // Get all company products - EXACTLY like the left navigation
    const allCompanyProducts = [];
    const productMap = new Map();
    
    if (window.allRows && Array.isArray(window.allRows)) {
      window.allRows.forEach(product => {
        if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
          const productKey = product.title || '';
          
          if (!productMap.has(productKey)) {
            productMap.set(productKey, product);
            allCompanyProducts.push(product);
          }
        }
      });
    }
    
    console.log(`[loadBucketedProducts] Found ${allCompanyProducts.length} products`);
    
    // Apply bucket filter if selected
    let filteredProducts = allCompanyProducts;
    if (window.selectedBucketFilter) {
      console.log('[loadBucketedProducts] Applying bucket filter:', window.selectedBucketFilter);
      
      // Load bucket data to filter products
      const accountPrefix = window.currentAccount || 'acc1';
      const days = window.selectedBucketDateRangeDays || 30;
      const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
      const tableName = `${accountPrefix}_googleSheets_productBuckets_${suffix}`;
      
      const db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('myAppDB');
        request.onsuccess = (event) => resolve(event.target.result);
        request.onerror = () => reject(new Error('Failed to open myAppDB'));
      });
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      const result = await new Promise((resolve, reject) => {
        getRequest.onsuccess = () => resolve(getRequest.result);
        getRequest.onerror = () => reject(getRequest.error);
      });
      
      db.close();
      
      if (result && result.data) {
        // Create a set of product titles that match the filter
        const matchingProductTitles = new Set();
        
result.data.forEach(row => {
          const deviceFilter = window.selectedDeviceFilter || 'all';
          const deviceMatch = deviceFilter === 'all' 
            ? row['Device'] === 'All' 
            : row['Device'] === deviceFilter;
            
          if (row['Campaign Name'] === 'All' && deviceMatch) {
            let matches = false;
            
            if (window.selectedBucketFilter.bucketType === 'SUGGESTIONS_BUCKET' && row[window.selectedBucketFilter.bucketType]) {
              try {
                const suggestions = JSON.parse(row[window.selectedBucketFilter.bucketType]);
                matches = suggestions.some(s => s.suggestion === window.selectedBucketFilter.bucketValue);
              } catch (e) {
                console.error('Error parsing suggestions:', e);
              }
            } else if (row[window.selectedBucketFilter.bucketType]) {
              let value = row[window.selectedBucketFilter.bucketType];
              try {
                const parsed = JSON.parse(value);
                value = parsed.value || value;
              } catch (e) {
                // Use raw value if not JSON
              }
              matches = value === window.selectedBucketFilter.bucketValue;
            }
            
            if (matches) {
              matchingProductTitles.add(row['Product Title']);
            }
          }
        });
        
        // Filter products based on matching titles
        filteredProducts = allCompanyProducts.filter(product => 
          matchingProductTitles.has(product.title)
        );
        
        console.log(`[loadBucketedProducts] Filtered to ${filteredProducts.length} products`);
      }
    }
    
    // Calculate metrics and sort
    const productsWithMetrics = filteredProducts.map(product => ({
      product: product,
      metrics: calculateGoogleAdsProductMetrics(product)
    }));
    
    // Separate active and inactive
    const activeProducts = productsWithMetrics.filter(item => !item.metrics.isFullyInactive);
    const inactiveProducts = productsWithMetrics.filter(item => item.metrics.isFullyInactive);
    
    // Sort by rank
    activeProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
    inactiveProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
    
    // Render products
    renderProductsList(container, activeProducts, inactiveProducts);
    
  } catch (error) {
    console.error('[loadBucketedProducts] Error:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Error loading products</div>';
  }
}

// Simple render function - just like left nav but full width
function renderProductsList(container, activeProducts, inactiveProducts) {
  container.innerHTML = '';
  
// Replace the header section in renderProductsList function
// Header with device filter and settings button
const header = document.createElement('div');
header.style.cssText = 'padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px;';

// Create title row
const titleRow = document.createElement('div');
titleRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;';

const filterText = window.currentBucketFilter ? ` - Filtered by ${window.currentBucketFilter.replace(/_/g, ' ')}` : '';
const bucketFilterText = window.selectedBucketFilter ? ` - ${window.selectedBucketFilter.bucketValue}` : '';
titleRow.innerHTML = `
  <h3 style="margin: 0; font-size: 18px; font-weight: 600;">All Products${filterText}${bucketFilterText}</h3>
  <div style="display: flex; gap: 15px; align-items: center;">
    <div id="products-device-filter" style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 600; font-size: 12px; color: #333;">Device:</span>
      <select id="productDeviceSelect" style="
        padding: 6px 10px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        background: white;
        min-width: 120px;
      ">
        <option value="all" ${window.selectedDeviceFilter === 'all' ? 'selected' : ''}>All Devices</option>
        <option value="DESKTOP" ${window.selectedDeviceFilter === 'DESKTOP' ? 'selected' : ''}>💻 Desktop</option>
        <option value="MOBILE" ${window.selectedDeviceFilter === 'MOBILE' ? 'selected' : ''}>📱 Mobile</option>
        <option value="TABLET" ${window.selectedDeviceFilter === 'TABLET' ? 'selected' : ''}>📋 Tablet</option>
      </select>
    </div>
    <button id="productsMetricsSettingsBtn" style="
      background: #f5f5f5;
      border: 1px solid #ddd;
      border-radius: 6px;
      padding: 6px 12px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #666;
      transition: all 0.2s;
    " onmouseover="this.style.background='#e9e9e9'" onmouseout="this.style.background='#f5f5f5'">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m4.22-10.22l4.24 4.24M6.34 6.34l4.24 4.24m4.88 0l4.24 4.24M6.34 17.66l4.24-4.24"></path>
      </svg>
      Metrics Settings
    </button>
  </div>
`;

header.appendChild(titleRow);
container.appendChild(header);

// Add settings popup
createMetricsSettingsPopup(container);

// Add event listeners
setTimeout(() => {
  const settingsBtn = document.getElementById('productsMetricsSettingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMetricsSettingsPopup();
    });
  }
  
  const deviceSelect = document.getElementById('productDeviceSelect');
  if (deviceSelect) {
    deviceSelect.addEventListener('change', (e) => {
      window.selectedDeviceFilter = e.target.value;
      loadBucketedProducts(); // Reload with new device filter
    });
  }
}, 100);
  
  // Products container
  const productsContainer = document.createElement('div');
  productsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 2px;';
  
  // Add active products
  activeProducts.forEach(({ product, metrics }) => {
    const productItem = createBucketedProductItem(product, metrics);
    productsContainer.appendChild(productItem);
  });
  
  // Add separator if both exist
  if (activeProducts.length > 0 && inactiveProducts.length > 0) {
    const separator = document.createElement('div');
    separator.className = 'google-ads-separator';
    separator.innerHTML = `
      <div class="separator-line"></div>
      <div class="separator-text">Inactive Products</div>
      <div class="separator-line"></div>
    `;
    productsContainer.appendChild(separator);
  }
  
  // Add inactive products
  inactiveProducts.forEach(({ product, metrics }) => {
    const productItem = createBucketedProductItem(product, metrics);
    productItem.classList.add('inactive-product');
    productsContainer.appendChild(productItem);
  });
  
  container.appendChild(productsContainer);
}

// Create metrics settings popup
function createMetricsSettingsPopup(container) {
  const popup = document.createElement('div');
  popup.id = 'metricsSettingsPopup';
  popup.style.cssText = `
    position: absolute;
    top: 60px;
    right: 20px;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    padding: 15px;
    display: none;
    z-index: 1000;
    width: 250px;
  `;
  
  const title = document.createElement('div');
  title.style.cssText = 'font-weight: 600; font-size: 14px; margin-bottom: 12px; color: #333;';
  title.textContent = 'Select up to 5 Metrics to Display';
  popup.appendChild(title);
  
  const metricsContainer = document.createElement('div');
  metricsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';
  
  Object.entries(window.bucketedProductsMetricsSettings.availableMetrics).forEach(([key, metric]) => {
    const label = document.createElement('label');
    label.style.cssText = 'display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 4px; border-radius: 4px; transition: background 0.2s;';
    label.onmouseover = () => label.style.background = '#f5f5f5';
    label.onmouseout = () => label.style.background = 'transparent';
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.value = key;
    checkbox.checked = window.bucketedProductsMetricsSettings.selectedMetrics.includes(key);
    checkbox.style.cursor = 'pointer';
    
    checkbox.addEventListener('change', () => {
      updateSelectedMetrics();
    });
    
    const text = document.createElement('span');
    text.style.cssText = 'font-size: 13px; color: #555;';
    text.textContent = metric.label + (metric.prefix || '') + (metric.suffix || '');
    
    label.appendChild(checkbox);
    label.appendChild(text);
    metricsContainer.appendChild(label);
  });
  
  popup.appendChild(metricsContainer);
  container.appendChild(popup);
  
  // Close popup when clicking outside
  document.addEventListener('click', (e) => {
    if (!popup.contains(e.target) && e.target.id !== 'productsMetricsSettingsBtn') {
      popup.style.display = 'none';
    }
  });
}

// Toggle metrics settings popup
function toggleMetricsSettingsPopup() {
  const popup = document.getElementById('metricsSettingsPopup');
  if (popup) {
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
  }
}

// Replace the entire updateSelectedMetrics function
function updateSelectedMetrics() {
  const checkboxes = document.querySelectorAll('#metricsSettingsPopup input[type="checkbox"]');
  const selected = Array.from(checkboxes)
    .filter(cb => cb.checked)
    .map(cb => cb.value);
  
  if (selected.length > 5) {
    // Uncheck the last checked item
    const lastChecked = Array.from(checkboxes).find(cb => 
      cb.checked && !window.bucketedProductsMetricsSettings.selectedMetrics.includes(cb.value)
    );
    if (lastChecked) {
      lastChecked.checked = false;
      return;
    }
  }
  
  // Update the selected metrics and refresh display
  window.bucketedProductsMetricsSettings.selectedMetrics = selected;
  refreshAllProductMetrics();
}

// Replace the refreshAllProductMetrics function
function refreshAllProductMetrics() {
  const productItems = document.querySelectorAll('.bucketed-product-item');
  productItems.forEach(item => {
    const metricsBox = item.querySelector('.product-metrics-box');
    const bucketData = item.bucketData;
    if (metricsBox && bucketData) {
      updateMetricsDisplay(metricsBox, bucketData);
    }
  });
}

// Get bucketed products data
async function getBucketedProductsData(bucketType) {
  console.log('[getBucketedProductsData] Starting with bucket type:', bucketType);
  const bucketedProducts = {};
  const productMap = new Map();
  
  // First, get all company products (same as left navigation)
  const allCompanyProducts = [];
  
  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
        const productKey = product.title || '';
        
        if (!productMap.has(productKey)) {
          productMap.set(productKey, product);
          allCompanyProducts.push(product);
        }
      }
    });
  }
  
  console.log('[getBucketedProductsData] Found company products:', allCompanyProducts.length);
  
  // Now load bucket assignments from IndexedDB
  try {
    const accountPrefix = window.currentAccount || 'acc1';
    const days = window.selectedBucketDateRangeDays || 30;
    const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
    const tableName = `${accountPrefix}_googleSheets_productBuckets_${suffix}`;
    
    console.log('[getBucketedProductsData] Loading bucket data from:', tableName);
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (result && result.data) {
      console.log('[getBucketedProductsData] Bucket data records:', result.data.length);
      
      // Create a map of product titles to bucket values
      const productBucketMap = new Map();
      
      result.data.forEach(record => {
        if (record['Campaign Name'] === 'All' && 
            record['Channel Type'] === 'All' && 
            record['Device'] === 'All') {
          const productTitle = record['Product Title'];
          const bucketValue = getBucketValue(record[bucketType]);
          
          if (bucketValue && bucketValue !== 'Insufficient Data') {
            productBucketMap.set(productTitle, bucketValue);
          }
        }
      });
      
      console.log('[getBucketedProductsData] Products with bucket assignments:', productBucketMap.size);
      
      // Now assign products to buckets
      allCompanyProducts.forEach(product => {
        const productTitle = product.title;
        const bucketValue = productBucketMap.get(productTitle);
        
        if (bucketValue) {
          if (!bucketedProducts[bucketValue]) {
            bucketedProducts[bucketValue] = [];
          }
          
          const metrics = calculateGoogleAdsProductMetrics(product);
          bucketedProducts[bucketValue].push({
            product: product,
            metrics: metrics
          });
          
          console.log('[getBucketedProductsData] Assigned product to bucket:', productTitle, '->', bucketValue);
        } else {
          // Product doesn't have a bucket assignment yet
          console.log('[getBucketedProductsData] No bucket for product:', productTitle);
        }
      });
    }
  } catch (error) {
    console.error('[getBucketedProductsData] Error loading bucket data:', error);
    
    // Fallback: Show all products in an "Unassigned" bucket
    if (allCompanyProducts.length > 0) {
      bucketedProducts['Unassigned'] = allCompanyProducts.map(product => ({
        product: product,
        metrics: calculateGoogleAdsProductMetrics(product)
      }));
    }
  }
  
  console.log('[getBucketedProductsData] Final bucketed products:', Object.keys(bucketedProducts).map(k => `${k}: ${bucketedProducts[k].length} products`));
  
  // Sort products within each bucket by average rating
  Object.keys(bucketedProducts).forEach(bucket => {
    bucketedProducts[bucket].sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
  });
  
  return bucketedProducts;
}

// Replace the getProductBucketData function
async function getProductBucketData(productTitle) {
  try {
    const accountPrefix = window.currentAccount || 'acc1';
    const days = window.selectedBucketDateRangeDays || 30;
    const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
    const tableName = `${accountPrefix}_googleSheets_productBuckets_${suffix}`;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (result && result.data) {
      // Find the record for this product where Campaign="All" and Device matches filter
      const deviceFilter = window.selectedDeviceFilter || 'all';
      const productRecord = result.data.find(record => 
        record['Product Title'] === productTitle &&
        record['Campaign Name'] === 'All' &&
        (deviceFilter === 'all' ? record['Device'] === 'All' : record['Device'] === deviceFilter)
      );
      
      return productRecord || null;
    }
  } catch (error) {
    console.error('[getProductBucketData] Error:', error);
  }
  return null;
}

// Get bucket value for a specific product
function getBucketValueForProduct(product, bucketType) {
  const combinations = getProductCombinations(product);
  
  if (combinations.length === 0) return null;
  
  // Find the most recent bucket assignment
  let mostRecentBucket = null;
  let mostRecentDate = null;
  
  combinations.forEach(combo => {
    const record = combo.record;
    const bucketData = record[bucketType];
    
    if (bucketData) {
      const bucketValue = getBucketValue(bucketData);
      const date = new Date(record.Date);
      
      if (!mostRecentDate || date > mostRecentDate) {
        mostRecentDate = date;
        mostRecentBucket = bucketValue;
      }
    }
  });
  
  return mostRecentBucket;
}

// Render bucketed products
function renderBucketedProducts(container, bucketedProducts, bucketType) {
  console.log('[renderBucketedProducts] Starting with products:', bucketedProducts);
  container.innerHTML = '';
  
  // Create header
  const header = document.createElement('div');
  header.style.cssText = `
    padding-bottom: 20px;
    border-bottom: 1px solid #eee;
    margin-bottom: 20px;
  `;
  header.innerHTML = `
    <h3 style="margin: 0; font-size: 18px; font-weight: 600;">Products by ${bucketType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</h3>
  `;
  container.appendChild(header);
  
  // Get bucket configuration
  const bucketConfig = window.bucketConfig[bucketType] || {};
  const bucketOrder = bucketConfig.order || Object.keys(bucketedProducts);
  const bucketColors = bucketConfig.colors || {};
  
  // Create sections for each bucket
  bucketOrder.forEach(bucketName => {
    const products = bucketedProducts[bucketName];
    if (!products || products.length === 0) return;
    
    const bucketSection = document.createElement('div');
    bucketSection.style.cssText = 'margin-bottom: 30px;';
    
    // Bucket header
    const bucketHeader = document.createElement('div');
    bucketHeader.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f8f9fa;
      border-radius: 8px;
    `;
    
    const bucketColor = bucketColors[bucketName] || '#666';
    bucketHeader.innerHTML = `
      <div style="width: 12px; height: 12px; background-color: ${bucketColor}; border-radius: 50%; margin-right: 10px;"></div>
      <h4 style="margin: 0; font-size: 16px; font-weight: 600; flex: 1;">${bucketName}</h4>
      <span style="font-size: 14px; color: #666;">${products.length} products</span>
    `;
    
    bucketSection.appendChild(bucketHeader);
    
    // Products grid
    const productsGrid = document.createElement('div');
    productsGrid.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    
    // Render each product
    products.forEach(({ product, metrics }) => {
      const productItem = createBucketedProductItem(product, metrics);
      productsGrid.appendChild(productItem);
    });
    
    bucketSection.appendChild(productsGrid);
    container.appendChild(bucketSection);
  });
}

// Create a bucketed product item (full width)
function createBucketedProductItem(product, metrics) {
  const productDiv = document.createElement('div');
  productDiv.classList.add('small-ad-details', 'bucketed-product-item');
  productDiv.style.cssText = `
    width: 100%;
    min-height: 80px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    padding: 10px 15px;
    cursor: pointer;
    transition: all 0.2s;
    box-sizing: border-box;
    gap: 10px;
  `;
  
  const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
  const imageUrl = product.thumbnail || 'https://via.placeholder.com/60?text=No+Image';
  const title = product.title || 'No title';
  
  // Create the main structure
  productDiv.innerHTML = `
    <!-- Position Badge with Trend -->
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor}; width: 60px; height: 60px; border-radius: 8px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div class="small-ad-pos-value" style="font-size: 22px; line-height: 1; color: white; font-weight: 700;">${metrics.avgRating}</div>
${metrics.rankTrend && metrics.rankTrend.arrow && !isNaN(metrics.rankTrend.change) ? `
        <div style="position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);">
          <span style="background-color: ${metrics.rankTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600; white-space: nowrap;">
            ${metrics.rankTrend.arrow} ${Math.abs(metrics.rankTrend.change)}
          </span>
        </div>
      ` : ''}
    </div>
    
<!-- Visibility Status with Trend -->
    <div class="small-ad-vis-status" style="width: 60px;">
      <div class="vis-status-left">
        <div class="vis-water-container" style="--fill-height: ${metrics.avgVisibility}%; position: relative;">
          <span class="vis-percentage">${metrics.avgVisibility.toFixed(1)}%</span>
          ${metrics.visibilityTrend && metrics.visibilityTrend.arrow && !isNaN(metrics.visibilityTrend.change) ? `
            <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);">
              <span style="background-color: ${metrics.visibilityTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600; white-space: nowrap;">
                ${metrics.visibilityTrend.arrow} ${Math.abs(metrics.visibilityTrend.change).toFixed(0)}%
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <!-- ROAS Badge -->
    <div class="roas-badge" style="width: 60px; height: 60px; background-color: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div class="roas-loading" style="font-size: 11px; color: #999;">-</div>
    </div>
    
    <!-- Product Image -->
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px;"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';">
    
    <!-- Product Title -->
    <div class="small-ad-title" style="font-size: 14px; line-height: 1.4; width: 200px; min-width: 180px; word-wrap: break-word;">${title}</div>
    
    <!-- Metrics Box -->
    <div class="product-metrics-box" style="width: 350px; display: flex; gap: 15px; padding: 8px 15px; background: #f8f9fa; border-radius: 8px; align-items: center;">
      <div class="metric-loading" style="width: 100%; text-align: center; color: #999; font-size: 11px;">Loading metrics...</div>
    </div>
    
    <!-- Suggestions -->
    <div class="suggestions-container" style="width: 150px; display: flex; flex-direction: column; gap: 4px; max-height: 60px; overflow-y: auto;">
      <div class="suggestions-loading" style="text-align: center; color: #999; font-size: 11px;">Loading...</div>
    </div>
    
    <!-- Health Score & Confidence (in same row) -->
    <div class="health-confidence-container" style="width: 140px; display: flex; gap: 8px; align-items: center;">
      <div class="health-loading" style="color: #999; font-size: 11px; width: 100%; text-align: center;">Loading...</div>
    </div>
  `;
  
  // Load bucket data asynchronously
  loadProductBucketDataAsync(productDiv, title);
  
  // Add hover effect
  productDiv.addEventListener('mouseenter', function() {
    this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    this.style.transform = 'translateY(-2px)';
  });
  
  productDiv.addEventListener('mouseleave', function() {
    this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    this.style.transform = 'translateY(0)';
  });

// Store product reference on the element
  productDiv.productData = product;
  
  // Add click handler (will use stored data later)
  productDiv.addEventListener('click', function(e) {
    e.stopPropagation();
    // Use stored data from the element
    toggleDetailedProductView(this, this.productData, this.bucketData);
  });
  
  return productDiv;
}

// Toggle detailed product view
function toggleDetailedProductView(productDiv, product, bucketData) {
  // Check if detail view already exists
  let detailView = productDiv.nextElementSibling;
  if (detailView && detailView.classList.contains('detailed-bucketed-product-overview')) {
    // Animate close
    detailView.style.maxHeight = '0px';
    detailView.style.opacity = '0';
    setTimeout(() => {
      detailView.remove();
    }, 300);
    return;
  }
  
  // Close any other open detail views
  const openDetails = document.querySelectorAll('.detailed-bucketed-product-overview');
  openDetails.forEach(detail => {
    detail.style.maxHeight = '0px';
    detail.style.opacity = '0';
    setTimeout(() => {
      detail.remove();
    }, 300);
  });
  
  // Create and show new detail view
  const detailContainer = createDetailedProductOverview(bucketData);
  productDiv.parentNode.insertBefore(detailContainer, productDiv.nextSibling);
  
  // Animate open
  setTimeout(() => {
    detailContainer.style.maxHeight = '550px';
    detailContainer.style.opacity = '1';
  }, 50);
}

// Create detailed product overview container
function createDetailedProductOverview(bucketData) {
  const container = document.createElement('div');
  container.className = 'detailed-bucketed-product-overview';
  container.style.cssText = `
    width: 1155px;
    height: 500px;
    max-height: 0;
    opacity: 0;
    overflow: hidden;
    background-color: #fff;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    margin: 10px 0;
    padding: 20px;
    transition: all 0.3s ease;
    display: flex;
    flex-direction: column;
    gap: 20px;
  `;
  
  if (!bucketData) {
    container.innerHTML = '<div style="text-align: center; color: #999; padding: 50px;">No detailed data available</div>';
    return container;
  }
  
  // Create metrics section
  const metricsSection = createDetailedMetricsSection(bucketData);
  container.appendChild(metricsSection);
  
  // Create buckets section
  const bucketsSection = createBucketsExplanationSection(bucketData);
  container.appendChild(bucketsSection);
  
  return container;
}

// Create detailed metrics section with all available metrics
function createDetailedMetricsSection(bucketData) {
  const section = document.createElement('div');
  section.className = 'detailed-product-metrics-box';
  section.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #f8f9fa, #f0f1f3);
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    padding: 20px;
    display: flex;
    gap: 25px;
    justify-content: space-between;
  `;
  
  // Define metric groups
  const metricGroups = [
    {
      title: 'Volume & Engagement',
      metrics: [
        { key: 'Impressions', label: 'Impressions', format: 'number' },
        { key: 'Clicks', label: 'Clicks', format: 'number' },
        { key: 'CTR', label: 'CTR', format: 'percent' }
      ]
    },
    {
      title: 'Conversion Performance',
      metrics: [
        { key: 'CVR', label: 'CVR', format: 'percent' },
        { key: 'Conversions', label: 'Conversions', format: 'decimal' },
        { key: 'ConvValue', label: 'Revenue', format: 'currency' },
        { key: 'AOV', label: 'AOV', format: 'currency' }
      ]
    },
    {
      title: 'Cost Efficiency',
      metrics: [
        { key: 'Cost', label: 'Cost', format: 'currency' },
        { key: 'CPA', label: 'CPA', format: 'currency' },
        { key: 'CPM', label: 'CPM', format: 'currency' },
        { key: 'ROAS', label: 'ROAS', format: 'roas', highlight: true }
      ]
    },
    {
      title: 'Funnel Analysis',
      metrics: [
        { key: 'Cart Rate', label: 'Cart Rate', format: 'percent' },
        { key: 'Checkout Rate', label: 'Checkout', format: 'percent' },
        { key: 'Purchase Rate', label: 'Purchase', format: 'percent' }
      ]
    }
  ];
  
  metricGroups.forEach(group => {
    const groupDiv = document.createElement('div');
    groupDiv.style.cssText = `
      flex: 1;
      background: rgba(255, 255, 255, 0.7);
      border-radius: 6px;
      padding: 15px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    `;
    
    // Group title
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = `
      font-size: 11px;
      font-weight: 700;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e0e0e0;
    `;
    titleDiv.textContent = group.title;
    groupDiv.appendChild(titleDiv);
    
    // Metrics container
    const metricsContainer = document.createElement('div');
    metricsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';
    
    group.metrics.forEach(metric => {
      const metricDiv = createGroupedMetricWithTrend(bucketData, metric);
      metricsContainer.appendChild(metricDiv);
    });
    
    groupDiv.appendChild(metricsContainer);
    section.appendChild(groupDiv);
  });
  
  return section;
}

// Create individual metric with trend for grouped layout
function createGroupedMetricWithTrend(bucketData, metric) {
  const value = bucketData[metric.key] || 0;
  const prevValue = bucketData[`prev_${metric.key}`] || 0;
  
  // Calculate trend
  let trend = 0;
  let trendArrow = '';
  let trendColor = '#666';
  
  if (prevValue > 0 && value > 0) {
    trend = ((value - prevValue) / prevValue) * 100;
    if (trend > 0) {
      trendArrow = '▲';
      trendColor = (metric.key === 'Cost' || metric.key === 'CPA' || metric.key === 'CPM') ? '#F44336' : '#4CAF50';
    } else if (trend < 0) {
      trendArrow = '▼';
      trendColor = (metric.key === 'Cost' || metric.key === 'CPA' || metric.key === 'CPM') ? '#4CAF50' : '#F44336';
    } else {
      trendArrow = '—';
    }
  } else if (value > 0 && prevValue === 0) {
    trendArrow = '▲';
    trendColor = (metric.key === 'Cost' || metric.key === 'CPA' || metric.key === 'CPM') ? '#F44336' : '#4CAF50';
    trend = 100;
  }
  
  // Format value
  let formattedValue = '';
  switch (metric.format) {
    case 'currency':
      formattedValue = '$' + parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      break;
    case 'percent':
      formattedValue = parseFloat(value).toFixed(1) + '%';
      break;
    case 'decimal':
      formattedValue = parseFloat(value).toFixed(1);
      break;
    case 'roas':
      formattedValue = parseFloat(value).toFixed(2) + 'x';
      break;
    default:
      formattedValue = parseInt(value).toLocaleString();
  }
  
  const metricDiv = document.createElement('div');
  metricDiv.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: ${metric.highlight ? '8px' : '4px'} 0;
    ${metric.highlight ? 'background: rgba(76, 175, 80, 0.1); padding: 8px; border-radius: 4px; margin: 4px 0;' : ''}
  `;
  
  metricDiv.innerHTML = `
    <div style="font-size: ${metric.highlight ? '13px' : '12px'}; color: #555; font-weight: 500;">${metric.label}</div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="font-size: ${metric.highlight ? '18px' : '16px'}; font-weight: 700; color: ${metric.highlight && metric.key === 'ROAS' ? (parseFloat(value) >= 2 ? '#4CAF50' : '#F44336') : '#333'};">
        ${formattedValue}
      </div>
      ${trend !== 0 ? `
        <div style="font-size: 11px; color: ${trendColor}; font-weight: 600; white-space: nowrap;">
          ${trendArrow} ${Math.abs(trend).toFixed(0)}%
        </div>
      ` : ''}
    </div>
  `;
  
  return metricDiv;
}

// Create buckets explanation section
function createBucketsExplanationSection(bucketData) {
  const section = document.createElement('div');
  section.style.cssText = `
    width: 100%;
    display: flex;
    gap: 20px;  // Increased from 15px
    justify-content: space-between;
    margin-top: 10px;  // Add some top margin
  `;
  
  const bucketTypes = [
    { key: 'PROFITABILITY_BUCKET', title: 'Profitability', color: '#4CAF50' },
    { key: 'FUNNEL_STAGE_BUCKET', title: 'Funnel Stage', color: '#2196F3' },
    { key: 'INVESTMENT_BUCKET', title: 'Investment', color: '#FF9800' },
    { key: 'CUSTOM_TIER_BUCKET', title: 'Custom Tier', color: '#9C27B0' },
    { key: 'SUGGESTIONS_BUCKET', title: 'Suggestions', color: '#F44336' }
  ];
  
  bucketTypes.forEach(bucket => {
    const bucketDiv = createBucketExplanation(bucketData, bucket);
    section.appendChild(bucketDiv);
  });
  
  return section;
}

// Create individual bucket explanation
function createBucketExplanation(bucketData, bucketConfig) {
  const bucketDiv = document.createElement('div');
  bucketDiv.style.cssText = `
    flex: 1;
    background: ${bucketConfig.color}08;
    border: 1px solid ${bucketConfig.color}30;
    border-radius: 8px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  `;
  
  let value = 'N/A';
  let explanation = '';
  
  if (bucketConfig.key === 'SUGGESTIONS_BUCKET' && bucketData[bucketConfig.key]) {
    // Handle suggestions differently
    try {
      const suggestions = JSON.parse(bucketData[bucketConfig.key]);
      if (suggestions.length > 0) {
        value = suggestions.map(s => s.suggestion).join(', ');
        explanation = suggestions.map(s => s.context || '').join('; ');
      }
    } catch (e) {
      value = 'Parse error';
    }
  } else if (bucketData[bucketConfig.key]) {
    // Handle regular buckets
    try {
      const parsed = JSON.parse(bucketData[bucketConfig.key]);
      value = parsed.value || bucketData[bucketConfig.key];
      explanation = parsed.explanation || '';
    } catch (e) {
      value = bucketData[bucketConfig.key];
    }
  }
  
  bucketDiv.innerHTML = `
    <div style="font-size: 13px; font-weight: 700; color: ${bucketConfig.color}; text-transform: uppercase; letter-spacing: 0.5px;">${bucketConfig.title}</div>
    <div style="font-size: 16px; font-weight: 700; color: #333; margin: 6px 0; line-height: 1.3;">${value}</div>
    <div style="font-size: 13px; color: #555; line-height: 1.5; max-height: 80px; overflow-y: auto; padding-right: 5px;">${explanation || 'No explanation available'}</div>
  `;
  
  return bucketDiv;
}

async function loadProductBucketDataAsync(productDiv, productTitle) {
  const bucketData = await getProductBucketData(productTitle);
  
  // Store bucket data on the element for later use
  productDiv.bucketData = bucketData;
  
  productDiv.addEventListener('click', function(e) {
    e.stopPropagation();
    toggleDetailedProductView(productDiv, product, productDiv.bucketData);
  });
  
  if (!bucketData) {
    // Update containers with "No data" message
    productDiv.querySelector('.metric-loading').innerHTML = '<span style="color: #999;">No data</span>';
    productDiv.querySelector('.roas-loading').innerHTML = '<span style="color: #999; font-size: 16px;">N/A</span>';
    productDiv.querySelector('.suggestions-loading').innerHTML = '<span style="color: #999;">No data</span>';
    productDiv.querySelector('.health-loading').innerHTML = '<span style="color: #999;">No data</span>';
    return;
  }
  
  // Update ROAS Badge
  const roasBadge = productDiv.querySelector('.roas-badge');
  const roasValue = parseFloat(bucketData.ROAS) || 0;
  const roasColor = roasValue >= 3 ? '#4CAF50' : roasValue >= 1.5 ? '#FF9800' : '#F44336';
  roasBadge.style.backgroundColor = roasColor;
  roasBadge.style.borderColor = roasColor;
  roasBadge.innerHTML = `
    <div style="font-size: 10px; color: white; opacity: 0.9; text-transform: uppercase;">ROAS</div>
    <div style="font-size: 20px; font-weight: 700; color: white; line-height: 1;">${roasValue.toFixed(1)}x</div>
  `;
  
  // Update metrics box with selected metrics
  const metricsBox = productDiv.querySelector('.product-metrics-box');
  updateMetricsDisplay(metricsBox, bucketData);
  
  // Update suggestions
  const suggestionsContainer = productDiv.querySelector('.suggestions-container');
  suggestionsContainer.innerHTML = '';
  
  if (bucketData.SUGGESTIONS_BUCKET) {
    try {
      const suggestions = JSON.parse(bucketData.SUGGESTIONS_BUCKET);
      suggestions.forEach(suggestionObj => {
        const priorityColor = suggestionObj.priority === 'Critical' ? '#F44336' : 
                            suggestionObj.priority === 'High' ? '#FF9800' : 
                            suggestionObj.priority === 'Medium' ? '#FFC107' : '#9E9E9E';
        const suggDiv = document.createElement('div');
        suggDiv.style.cssText = `
          background: ${priorityColor}15; 
          color: ${priorityColor}; 
          padding: 3px 10px; 
          border-radius: 12px; 
          font-size: 10px; 
          font-weight: 600; 
          white-space: nowrap; 
          overflow: hidden; 
          text-overflow: ellipsis;
          border: 1px solid ${priorityColor}30;
        `;
        suggDiv.title = suggestionObj.suggestion;
        suggDiv.textContent = suggestionObj.suggestion;
        suggestionsContainer.appendChild(suggDiv);
      });
    } catch (e) {
      suggestionsContainer.innerHTML = '<span style="color: #999; font-size: 10px;">No suggestions</span>';
    }
  } else {
    suggestionsContainer.innerHTML = '<span style="color: #999; font-size: 10px;">No suggestions</span>';
  }
  
  // Update health score and confidence (side by side)
  const healthContainer = productDiv.querySelector('.health-confidence-container');
  const healthScore = bucketData.HEALTH_SCORE || 0;
  const confidence = bucketData.Confidence_Level || 'N/A';
  const healthColor = healthScore >= 7 ? '#4CAF50' : healthScore >= 4 ? '#FF9800' : '#F44336';
  const confidenceColor = confidence === 'High' ? '#4CAF50' : confidence === 'Medium' ? '#FF9800' : '#F44336';
  
  healthContainer.innerHTML = `
    <div style="background: #f0f0f0; padding: 6px 10px; border-radius: 6px; text-align: center; flex: 1;">
      <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Health</div>
      <div style="font-size: 16px; font-weight: 700; color: ${healthColor};">${healthScore}/10</div>
    </div>
    <div style="background: ${confidenceColor}15; padding: 6px 10px; border-radius: 6px; border: 1px solid ${confidenceColor}30; text-align: center; flex: 1;">
      <div style="font-size: 9px; color: #666; margin-bottom: 2px;">Confidence</div>
      <div style="font-size: 11px; font-weight: 600; color: ${confidenceColor};">${confidence}</div>
    </div>
  `;
}

// Helper function to update metrics display
function updateMetricsDisplay(metricsBox, bucketData) {
  const selectedMetrics = window.bucketedProductsMetricsSettings.selectedMetrics;
  const metricConfigs = window.bucketedProductsMetricsSettings.availableMetrics;
  
  let metricsHTML = '';
  selectedMetrics.forEach(metricKey => {
    const config = metricConfigs[metricKey];
    if (!config) return;
    
    let value = bucketData[config.key] || 0;
    let prevValue = bucketData[`prev_${config.key}`] || 0;
    let formattedValue = '';
    let formattedPrevValue = '';
    let valueColor = '#333';
    
    // Calculate trend
    let trend = 0;
    let trendArrow = '';
    let trendColor = '#666';
    
    if (prevValue > 0 && value > 0) {
      trend = ((value - prevValue) / prevValue) * 100;
      if (trend > 0) {
        trendArrow = '▲';
        // For cost, up is bad; for others, up is good
        trendColor = config.key === 'Cost' ? '#F44336' : '#4CAF50';
      } else if (trend < 0) {
        trendArrow = '▼';
        // For cost, down is good; for others, down is bad
        trendColor = config.key === 'Cost' ? '#4CAF50' : '#F44336';
      } else {
        trendArrow = '—';
        trendColor = '#666';
      }
    } else if (value > 0 && prevValue === 0) {
      trendArrow = '▲';
      trendColor = config.key === 'Cost' ? '#F44336' : '#4CAF50';
      trend = 100; // New metric
    } else {
      trendArrow = '—';
      trendColor = '#666';
    }
    
    // Format based on metric type
    if (config.prefix === '$') {
      formattedValue = parseFloat(value).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      metricsHTML += `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 9px; color: #666; margin-bottom: 3px; text-transform: uppercase; font-weight: 600;">${config.label}</div>
          <div style="font-size: 14px; font-weight: 700; color: ${valueColor};">${config.prefix}${formattedValue}</div>
          <div style="font-size: 9px; color: ${trendColor}; font-weight: 600; margin-top: 2px;">
            ${trendArrow} ${Math.abs(trend).toFixed(0)}%
          </div>
        </div>
      `;
    } else if (config.suffix === '%') {
      formattedValue = parseFloat(value).toFixed(1);
      metricsHTML += `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 9px; color: #666; margin-bottom: 3px; text-transform: uppercase; font-weight: 600;">${config.label}</div>
          <div style="font-size: 14px; font-weight: 700; color: ${valueColor};">${formattedValue}${config.suffix}</div>
          <div style="font-size: 9px; color: ${trendColor}; font-weight: 600; margin-top: 2px;">
            ${trendArrow} ${Math.abs(trend).toFixed(0)}%
          </div>
        </div>
      `;
    } else if (metricKey === 'Conversions') {
      formattedValue = parseFloat(value).toFixed(1);
      metricsHTML += `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 9px; color: #666; margin-bottom: 3px; text-transform: uppercase; font-weight: 600;">${config.label}</div>
          <div style="font-size: 14px; font-weight: 700; color: ${valueColor};">${formattedValue}</div>
          <div style="font-size: 9px; color: ${trendColor}; font-weight: 600; margin-top: 2px;">
            ${trendArrow} ${Math.abs(trend).toFixed(0)}%
          </div>
        </div>
      `;
    } else {
      formattedValue = parseInt(value).toLocaleString();
      metricsHTML += `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 9px; color: #666; margin-bottom: 3px; text-transform: uppercase; font-weight: 600;">${config.label}</div>
          <div style="font-size: 14px; font-weight: 700; color: ${valueColor};">${formattedValue}</div>
          <div style="font-size: 9px; color: ${trendColor}; font-weight: 600; margin-top: 2px;">
            ${trendArrow} ${Math.abs(trend).toFixed(0)}%
          </div>
        </div>
      `;
    }
  });
  
  metricsBox.innerHTML = metricsHTML;
  metricsBox.style.cssText = `
    width: 350px; 
    display: flex; 
    gap: 15px; 
    padding: 8px 15px; 
    background: linear-gradient(135deg, #f8f9fa, #f0f1f3);
    border: 1px solid #e0e0e0;
    border-radius: 8px; 
    align-items: center;
  `;
}

// Export functions to window
window.initializeMainBucketsSwitcher = initializeMainBucketsSwitcher;
window.refreshBucketedProductsView = loadBucketedProducts;

// Initialize when bucket type changes
if (typeof window !== 'undefined') {
  const originalLoadAndRender = window.loadAndRenderROASBuckets;
  window.loadAndRenderROASBuckets = async function() {
    if (originalLoadAndRender) {
      await originalLoadAndRender();
    }
    // Refresh bucketed products if that view is active
    if (window.currentMainBucketView === 'products') {
      await loadBucketedProducts();
    }
  };
}
