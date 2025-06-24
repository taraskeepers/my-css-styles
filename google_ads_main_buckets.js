// Global settings for product metrics calculation
window.productMetricsSettings = {
  useLatestDataDate: false, // true = use latest data date, false = use today's date
  // Future settings can be added here
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
      margin: 100px 0 20px 20px;
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
  const bucketedProducts = document.getElementById('bucketed_products_container');
  
  if (roasCharts) roasCharts.style.display = 'block';
  if (roasMetricsTable) roasMetricsTable.style.display = 'block';
  if (roasChannels) roasChannels.style.display = 'block';
  if (buckets_products) buckets_products.style.display = 'block';
  if (bucketedProducts) bucketedProducts.style.display = 'none';
}

// Show bucketed products view
function showBucketedProducts() {
  console.log('[showBucketedProducts] Starting...');
  
  // First ensure the container exists
  createBucketedProductsContainer();
  
  // Hide overview containers
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  const bucketedProducts = document.getElementById('bucketed_products_container');
  
  console.log('[showBucketedProducts] Container statuses:', {
    roasCharts: !!roasCharts,
    roasMetricsTable: !!roasMetricsTable,
    roasChannels: !!roasChannels,
    buckets_products: !!buckets_products,
    bucketedProducts: !!bucketedProducts
  });
  
  if (roasCharts) roasCharts.style.display = 'none';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  if (buckets_products) buckets_products.style.display = 'none';
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

// Load and display bucketed products
async function loadBucketedProducts() {
  console.log('[loadBucketedProducts] Starting...');
  console.log('[loadBucketedProducts] Current filter:', window.currentBucketFilter);
  
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
    
    // Calculate metrics and sort
    const productsWithMetrics = allCompanyProducts.map(product => ({
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
  
// Header
const header = document.createElement('div');
header.style.cssText = 'padding-bottom: 20px; border-bottom: 1px solid #eee; margin-bottom: 20px;';
const filterText = window.currentBucketFilter ? ` - Filtered by ${window.currentBucketFilter.replace(/_/g, ' ')}` : '';
header.innerHTML = `<h3 style="margin: 0; font-size: 18px; font-weight: 600;">All Products${filterText}</h3>`;
container.appendChild(header);
  
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

// Add this function after the getBucketedProductsData function (around line 270)
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
      // Find the record for this product where Campaign="All" and Device="All"
      const productRecord = result.data.find(record => 
        record['Product Title'] === productTitle &&
        record['Campaign Name'] === 'All' &&
        record['Device'] === 'All'
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
    min-height: 100px;
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
    gap: 15px;
  `;
  
  const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
  const imageUrl = product.thumbnail || 'https://via.placeholder.com/60?text=No+Image';
  const title = product.title || 'No title';
  
  // Create the main structure
  productDiv.innerHTML = `
    <!-- Position Badge with Trend -->
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor}; width: 60px; height: 60px; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center;">
      <div class="small-ad-pos-value" style="font-size: 22px; line-height: 1;">${metrics.avgRating}</div>
      ${metrics.rankTrend && metrics.rankTrend.arrow ? `
        <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);">
          <span style="background-color: ${metrics.rankTrend.color}; font-size: 8px; padding: 1px 4px; border-radius: 3px; color: white; display: flex; align-items: center; gap: 2px;">
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
          ${metrics.visibilityTrend && metrics.visibilityTrend.arrow ? `
            <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);">
              <span style="background-color: ${metrics.visibilityTrend.color}; font-size: 8px; padding: 1px 4px; border-radius: 3px; color: white; display: flex; align-items: center; gap: 2px;">
                ${metrics.visibilityTrend.arrow} ${Math.abs(metrics.visibilityTrend.change)}
              </span>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
    
    <!-- Product Image -->
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px;"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';">
    
    <!-- Product Title -->
    <div class="small-ad-title" style="font-size: 14px; line-height: 1.4; max-width: 250px; min-width: 200px; word-wrap: break-word;">${title}</div>
    
    <!-- Metrics Box -->
    <div class="product-metrics-box" style="width: 300px; display: flex; flex-wrap: wrap; gap: 10px; padding: 5px; background: #f8f9fa; border-radius: 6px; font-size: 11px;">
      <div class="metric-loading" style="width: 100%; text-align: center; color: #999;">Loading metrics...</div>
    </div>
    
    <!-- Bucket Values -->
    <div class="bucket-values-container" style="width: 150px; display: flex; flex-direction: column; gap: 4px;">
      <div class="bucket-loading" style="text-align: center; color: #999; font-size: 11px;">Loading...</div>
    </div>
    
    <!-- Suggestions -->
    <div class="suggestions-container" style="width: 150px; display: flex; flex-direction: column; gap: 4px; max-height: 80px; overflow-y: auto;">
      <div class="suggestions-loading" style="text-align: center; color: #999; font-size: 11px;">Loading...</div>
    </div>
    
    <!-- Health Score & Confidence -->
    <div class="health-confidence-container" style="width: 100px; display: flex; flex-direction: column; gap: 8px; text-align: center;">
      <div class="health-loading" style="color: #999; font-size: 11px;">Loading...</div>
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
  
  // Add click handler to select product
  productDiv.addEventListener('click', function() {
    const navItems = document.querySelectorAll('.nav-google-ads-item');
    navItems.forEach(navItem => {
      const navTitle = navItem.querySelector('.small-ad-title')?.textContent;
      if (navTitle === title) {
        navItem.click();
        document.getElementById('viewOverviewGoogleAds')?.click();
      }
    });
  });
  
  return productDiv;
}

// Add this function after createBucketedProductItem (around line 550)
async function loadProductBucketDataAsync(productDiv, productTitle) {
  const bucketData = await getProductBucketData(productTitle);
  
  if (!bucketData) {
    // Update containers with "No data" message
    productDiv.querySelector('.metric-loading').innerHTML = '<span style="color: #999;">No data</span>';
    productDiv.querySelector('.bucket-loading').innerHTML = '<span style="color: #999;">No data</span>';
    productDiv.querySelector('.suggestions-loading').innerHTML = '<span style="color: #999;">No data</span>';
    productDiv.querySelector('.health-loading').innerHTML = '<span style="color: #999;">No data</span>';
    return;
  }
  
  // Update metrics box
  const metricsBox = productDiv.querySelector('.product-metrics-box');
  const metricsHTML = `
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">Impr:</span>
      <span>${(parseInt(bucketData.Impressions) || 0).toLocaleString()}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">Clicks:</span>
      <span>${(parseInt(bucketData.Clicks) || 0).toLocaleString()}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">CTR:</span>
      <span>${(parseFloat(bucketData.CTR) || 0).toFixed(2)}%</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">Conv:</span>
      <span>${(parseFloat(bucketData.Conversions) || 0).toFixed(1)}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">Value:</span>
      <span>$${(parseFloat(bucketData.ConvValue) || 0).toLocaleString()}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 45%;">
      <span style="color: #666; font-weight: 600;">Cost:</span>
      <span>$${(parseFloat(bucketData.Cost) || 0).toLocaleString()}</span>
    </div>
    <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
      <span style="color: #666; font-weight: 600;">ROAS:</span>
      <span style="font-weight: 700; color: ${(parseFloat(bucketData.ROAS) || 0) >= 2 ? '#4CAF50' : '#F44336'};">
        ${(parseFloat(bucketData.ROAS) || 0).toFixed(2)}x
      </span>
    </div>
  `;
  metricsBox.innerHTML = metricsHTML;
  
  // Update bucket values
  const bucketContainer = productDiv.querySelector('.bucket-values-container');
  const bucketTypes = ['CUSTOM_TIER_BUCKET', 'FUNNEL_STAGE_BUCKET', 'INVESTMENT_BUCKET', 'PROFITABILITY_BUCKET'];
  const bucketColors = {
    'CUSTOM_TIER_BUCKET': '#9C27B0',
    'FUNNEL_STAGE_BUCKET': '#2196F3',
    'INVESTMENT_BUCKET': '#FF9800',
    'PROFITABILITY_BUCKET': '#4CAF50'
  };
  
  let bucketHTML = '';
  bucketTypes.forEach(bucketType => {
    const value = bucketData[bucketType] || 'N/A';
    const color = bucketColors[bucketType] || '#666';
    bucketHTML += `
      <div style="background: ${color}15; color: ${color}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
        ${value}
      </div>
    `;
  });
  bucketContainer.innerHTML = bucketHTML;
  
  // Update suggestions
  const suggestionsContainer = productDiv.querySelector('.suggestions-container');
  let suggestionsHTML = '';
  
  if (bucketData.SUGGESTIONS_BUCKET) {
    try {
      const suggestions = JSON.parse(bucketData.SUGGESTIONS_BUCKET);
      suggestions.forEach(suggestionObj => {
        const priorityColor = suggestionObj.priority === 'Critical' ? '#F44336' : 
                            suggestionObj.priority === 'High' ? '#FF9800' : 
                            suggestionObj.priority === 'Medium' ? '#FFC107' : '#9E9E9E';
        suggestionsHTML += `
          <div style="background: ${priorityColor}15; color: ${priorityColor}; padding: 2px 8px; border-radius: 4px; font-size: 10px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${suggestionObj.suggestion}">
            ${suggestionObj.suggestion}
          </div>
        `;
      });
    } catch (e) {
      suggestionsHTML = '<span style="color: #999; font-size: 10px;">No suggestions</span>';
    }
  } else {
    suggestionsHTML = '<span style="color: #999; font-size: 10px;">No suggestions</span>';
  }
  suggestionsContainer.innerHTML = suggestionsHTML;
  
  // Update health score and confidence
  const healthContainer = productDiv.querySelector('.health-confidence-container');
  const healthScore = bucketData.HEALTH_SCORE || 0;
  const confidence = bucketData.Confidence_Level || 'N/A';
  const healthColor = healthScore >= 7 ? '#4CAF50' : healthScore >= 4 ? '#FF9800' : '#F44336';
  
  const healthHTML = `
    <div style="background: #f0f0f0; padding: 8px; border-radius: 6px;">
      <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Health</div>
      <div style="font-size: 18px; font-weight: 700; color: ${healthColor};">${healthScore}/10</div>
    </div>
    <div style="background: #f0f0f0; padding: 8px; border-radius: 6px;">
      <div style="font-size: 10px; color: #666; margin-bottom: 2px;">Confidence</div>
      <div style="font-size: 12px; font-weight: 600; color: #333;">${confidence}</div>
    </div>
  `;
  healthContainer.innerHTML = healthHTML;
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
