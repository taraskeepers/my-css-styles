// Main Buckets Switcher functionality for Google Ads

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
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (!contentWrapper) return;
  
  // Check if container already exists
  let bucketedProductsContainer = document.getElementById('bucketed_products_container');
  if (!bucketedProductsContainer) {
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
    `;
    
// Insert after buckets_products container
const buckets_products = document.getElementById('buckets_products');
if (buckets_products && buckets_products.nextSibling) {
  contentWrapper.insertBefore(bucketedProductsContainer, buckets_products.nextSibling);
} else {
  contentWrapper.appendChild(bucketedProductsContainer);
}
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
  if (buckets_products) buckets_products.style.display = 'block';  // FIXED: use buckets_products
  if (bucketedProducts) bucketedProducts.style.display = 'none';
}

// Show bucketed products view
function showBucketedProducts() {
  // Hide overview containers
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  const bucketedProducts = document.getElementById('bucketed_products_container');
  
  if (roasCharts) roasCharts.style.display = 'none';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  if (buckets_products) buckets_products.style.display = 'none';  // FIXED: use buckets_products
  if (bucketedProducts) bucketedProducts.style.display = 'block';
  
  // Load bucketed products
  loadBucketedProducts();
}

// Load and display bucketed products
async function loadBucketedProducts() {
  const container = document.getElementById('bucketed_products_container');
  if (!container) return;
  
  // Show loading state
  container.innerHTML = '<div style="text-align: center; padding: 50px;"><div class="spinner"></div></div>';
  
  try {
    // Get current bucket type
    const bucketType = window.selectedBucketType || 'PROFITABILITY_BUCKET';
    
    // Get all products with their bucket assignments
    const bucketedProducts = await getBucketedProductsData(bucketType);
    
    // Render the products
    renderBucketedProducts(container, bucketedProducts, bucketType);
  } catch (error) {
    console.error('Error loading bucketed products:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Error loading products</div>';
  }
}

// Get bucketed products data
async function getBucketedProductsData(bucketType) {
  const bucketedProducts = {};
  const productMap = new Map();
  
  // Get all company products from window.allRows
  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
        const productKey = product.title || '';
        
        if (!productMap.has(productKey)) {
          productMap.set(productKey, product);
          
          // Get bucket value for this product
          const bucketValue = getBucketValueForProduct(product, bucketType);
          
          if (bucketValue && bucketValue !== 'Insufficient Data') {
            if (!bucketedProducts[bucketValue]) {
              bucketedProducts[bucketValue] = [];
            }
            
            // Calculate metrics for the product
            const metrics = calculateGoogleAdsProductMetrics(product);
            
            bucketedProducts[bucketValue].push({
              product: product,
              metrics: metrics
            });
          }
        }
      }
    });
  }
  
  // Sort products within each bucket by average rating
  Object.keys(bucketedProducts).forEach(bucket => {
    bucketedProducts[bucket].sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
  });
  
  return bucketedProducts;
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
    height: 80px;
    background-color: white;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    padding: 10px 15px;
    cursor: pointer;
    transition: all 0.2s;
  `;
  
  const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
  const imageUrl = product.thumbnail || 'https://via.placeholder.com/60?text=No+Image';
  const title = product.title || 'No title';
  
  productDiv.innerHTML = `
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor}; width: 60px; height: 60px; margin-right: 15px;">
      <div class="small-ad-pos-value" style="font-size: 22px;">${metrics.avgRating}</div>
      <div class="small-ad-pos-trend"></div>
    </div>
    <div class="small-ad-vis-status" style="margin-right: 15px;">
      <div class="vis-status-left">
        <div class="vis-water-container" style="--fill-height: ${metrics.avgVisibility}%;">
          <span class="vis-percentage">${metrics.avgVisibility.toFixed(1)}%</span>
        </div>
      </div>
    </div>
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         style="width: 60px; height: 60px; margin-right: 15px;"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';">
    <div class="small-ad-title" style="flex: 1; font-size: 14px;">${title}</div>
    <div style="display: flex; align-items: center; gap: 20px; margin-left: auto;">
      <div style="text-align: center;">
        <div style="font-size: 12px; color: #666;">Active</div>
        <div style="font-size: 16px; font-weight: 600; color: #4CAF50;">${metrics.activeLocations}</div>
      </div>
      <div style="text-align: center;">
        <div style="font-size: 12px; color: #666;">Inactive</div>
        <div style="font-size: 16px; font-weight: 600; color: #F44336;">${metrics.inactiveLocations}</div>
      </div>
    </div>
  `;
  
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
    // Find the corresponding nav item and trigger click
    const navItems = document.querySelectorAll('.nav-google-ads-item');
    navItems.forEach(navItem => {
      const navTitle = navItem.querySelector('.small-ad-title')?.textContent;
      if (navTitle === title) {
        navItem.click();
        // Switch to overview view
        document.getElementById('viewOverviewGoogleAds')?.click();
      }
    });
  });
  
  // Set water fill animation
  setTimeout(() => {
    const waterContainer = productDiv.querySelector('.vis-water-container');
    if (waterContainer) {
      const fillHeight = metrics.avgVisibility;
      waterContainer.style.setProperty('--fill-height', `${fillHeight}%`);
    }
  }, 100);
  
  return productDiv;
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
