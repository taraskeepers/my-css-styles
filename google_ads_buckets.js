// Initialize bucket-related global variables
window.selectedBucketType = window.selectedBucketType || 'PROFITABILITY_BUCKET';
window.bucketDistributionPreferences = window.bucketDistributionPreferences || {
  'PROFITABILITY_BUCKET': true,
  'FUNNEL_STAGE_BUCKET': true,
  'INVESTMENT_BUCKET': true,
  'CUSTOM_TIER_BUCKET': true,
  'SUGGESTIONS_BUCKET': false
};
window.selectedBucketDateRangeDays = 30;

// Comprehensive bucket configuration with colors and order
window.bucketConfig = {
  'PROFITABILITY_BUCKET': {
    order: ['Profit Stars', 'Strong Performers', 'Steady Contributors', 'Break-Even Products', 'Strategic Loss Leaders', 'True Losses', 'Insufficient Data'],
    colors: {
      'Profit Stars': '#4CAF50',
      'Strong Performers': '#66BB6A',
      'Steady Contributors': '#81C784',
      'Break-Even Products': '#FFA726',
      'Strategic Loss Leaders': '#AB47BC',
      'True Losses': '#F44336',
      'Insufficient Data': '#9E9E9E'
    }
  },
  'FUNNEL_STAGE_BUCKET': {
    order: ['Full Funnel Excellence', 'Ad Engagement Issue', 'Product Page Dropoff', 'Cart Abandonment Problem', 
            'Checkout Friction', 'Price Discovery Shock', 'Cross-Stage Issues', 'Normal Performance', 'Insufficient Data'],
    colors: {
      'Full Funnel Excellence': '#4CAF50',
      'Ad Engagement Issue': '#FF5252',
      'Product Page Dropoff': '#FF9800',
      'Cart Abandonment Problem': '#FFA726',
      'Checkout Friction': '#FFCA28',
      'Price Discovery Shock': '#AB47BC',
      'Cross-Stage Issues': '#EF5350',
      'Normal Performance': '#42A5F5',
      'Insufficient Data': '#9E9E9E'
    }
  },
  'INVESTMENT_BUCKET': {
    order: ['Maximum Priority', 'High Priority', 'Growth Priority', 'Maintain Priority', 'Reduce Priority', 'Pause Priority'],
    colors: {
      'Maximum Priority': '#4CAF50',
      'High Priority': '#66BB6A',
      'Growth Priority': '#81C784',
      'Maintain Priority': '#42A5F5',
      'Reduce Priority': '#FFA726',
      'Pause Priority': '#F44336'
    }
  },
  'CUSTOM_TIER_BUCKET': {
    order: ['Hero Products', 'Rising Stars', 'Steady Performers', 'Mobile Champions', 'Desktop Dependent', 
            'Test & Learn', 'Strategic Holdings', 'Watch List'],
    colors: {
      'Hero Products': '#FFD700',
      'Rising Stars': '#4CAF50',
      'Steady Performers': '#66BB6A',
      'Mobile Champions': '#2196F3',
      'Desktop Dependent': '#7B68EE',
      'Test & Learn': '#9E9E9E',
      'Strategic Holdings': '#AB47BC',
      'Watch List': '#FF9800'
    }
  },
  'SUGGESTIONS_BUCKET': {
    order: ['Pause Immediately', 'Scale Maximum Budget', 'Fix Creative Urgently', 'Fix Cart Abandonment',
            'Address Checkout Friction', 'Test Price Reduction', 'Optimize Mobile Experience', 
            'Refresh Tired Creative', 'Broaden Targeting', 'Add Trust Signals'],
    colors: {
      'Pause Immediately': '#F44336',
      'Scale Maximum Budget': '#4CAF50',
      'Fix Creative Urgently': '#FF5252',
      'Fix Cart Abandonment': '#FF9800',
      'Address Checkout Friction': '#FFA726',
      'Test Price Reduction': '#E91E63',
      'Optimize Mobile Experience': '#2196F3',
      'Refresh Tired Creative': '#FFB74D',
      'Broaden Targeting': '#7986CB',
      'Add Trust Signals': '#FFAB91'
    }
  }
};

// Helper function to extract bucket value from JSON
function getBucketValue(bucketData) {
  if (typeof bucketData === 'string') {
    try {
      const parsed = JSON.parse(bucketData);
      return parsed.value || bucketData;
    } catch (e) {
      return bucketData;
    }
  }
  return bucketData?.value || bucketData;
}

// Helper function to extract bucket explanation from JSON
function getBucketExplanation(bucketData) {
  if (typeof bucketData === 'string') {
    try {
      const parsed = JSON.parse(bucketData);
      return parsed.explanation || '';
    } catch (e) {
      return '';
    }
  }
  return bucketData?.explanation || '';
}

// Function to initialize bucket switcher buttons
function initializeBucketSwitcher() {
const bucketButtons = {
  'bucketProfitability': 'PROFITABILITY_BUCKET',
  'bucketFunnel': 'FUNNEL_STAGE_BUCKET',
  'bucketInvestment': 'INVESTMENT_BUCKET',
  'bucketCustom': 'CUSTOM_TIER_BUCKET',
  'bucketSuggestions': 'SUGGESTIONS_BUCKET'
};

  Object.keys(bucketButtons).forEach(buttonId => {
    const button = document.getElementById(buttonId);
    if (button) {
      button.addEventListener('click', function() {
        // Clear all active states
        Object.keys(bucketButtons).forEach(id => {
          const btn = document.getElementById(id);
          if (btn) btn.classList.remove('active');
        });
        
// Set this button as active
this.classList.add('active');

// Store selected bucket type globally
window.selectedBucketType = bucketButtons[buttonId];

// Check if we're in Products by Bucket view
if (window.currentMainBucketView === 'products') {
  // Apply filter to products view
  window.currentBucketFilter = bucketButtons[buttonId];
  console.log('[Bucket Filter] Applying filter:', window.currentBucketFilter);
  
  // Reload the products with filter
  if (window.loadBucketedProducts) {
    window.loadBucketedProducts();
  }
} else {
  // Normal buckets overview behavior
  loadAndRenderROASBuckets();
}
      });
    }
  });
}

// Export the initialization function
if (typeof window !== 'undefined') {
  window.initializeBucketSwitcher = initializeBucketSwitcher;
}

window.selectedBucketType = 'PROFITABILITY_BUCKET';
window.bucketDescriptions = {
  'PROFITABILITY_BUCKET': {
    'Profit Stars': 'Exceptional performers. Core profit drivers deserving maximum visibility.',
    'Strong Performers': 'Reliable profit generators. Consistent returns with good margins.',
    'Steady Contributors': 'Positive returns but not exceptional. Important for portfolio balance.',
    'Break-Even Products': 'Marginal profitability. Evaluate strategic value beyond direct returns.',
    'Strategic Loss Leaders': 'Intentional losses for market position or customer acquisition.',
    'True Losses': 'Genuine underperformers. Candidates for pause or major overhaul.',
    'Insufficient Data': 'Too early to classify. Continue controlled testing.'
  },
  
  'FUNNEL_STAGE_BUCKET': {
    'Full Funnel Excellence': 'Exceptional at every stage. Model for optimization.',
    'Ad Engagement Issue': 'Poor ad relevance or creative. Immediate creative refresh needed.',
    'Product Page Dropoff': 'Interest exists but page doesn\'t convert. Fix imagery, copy, reviews.',
    'Cart Abandonment Problem': 'Major friction at cart. Address shipping visibility, trust signals.',
    'Checkout Friction': 'Payment or final step issues. Simplify process, add payment options.',
    'Price Discovery Shock': 'Price resistance after click. Test clearer pricing or lower entry point.',
    'Cross-Stage Issues': 'Systematic problems. Requires full funnel audit.',
    'Normal Performance': 'Performing within expected ranges. Monitor for changes.',
    'Insufficient Data': 'Not enough data to identify specific funnel issues.'
  },
  
  'INVESTMENT_BUCKET': {
    'Maximum Priority': 'Underfunded winners. Maximize budget allocation immediately.',
    'High Priority': 'Proven performers. Significant budget increase warranted.',
    'Growth Priority': 'Positive trajectory. Steady budget increases while monitoring.',
    'Maintain Priority': 'Solid but not spectacular. Maintain current levels.',
    'Reduce Priority': 'Weakening performance. Gradual budget reduction.',
    'Pause Priority': 'Clear failures. Pause immediately and reallocate.'
  },
  
  'CUSTOM_TIER_BUCKET': {
    'Hero Products': 'Cornerstone items. Protect and maximize across all channels.',
    'Rising Stars': 'Momentum products. Capitalize on trend quickly.',
    'Steady Performers': 'Reliable workhorses. Maintain and optimize gradually.',
    'Mobile Champions': 'Mobile-first winners. Prioritize mobile experience.',
    'Desktop Dependent': 'Desktop reliant. Needs mobile optimization or acceptance.',
    'Test & Learn': 'Ready for experimentation. Safe testing ground.',
    'Strategic Holdings': 'Important beyond ROAS. Maintain for market position.',
    'Watch List': 'Requires close monitoring. Unstable but potential.'
  },
  
  'SUGGESTIONS_BUCKET': {
    'Pause Immediately': 'ROAS below 0.8, zero conversions despite significant spend. Immediate action required.',
    'Scale Maximum Budget': 'ROAS above 3x with high confidence. Ready for aggressive growth.',
    'Fix Creative Urgently': 'CTR below 0.2% with high impressions. Ad creative failing to engage.',
    'Fix Cart Abandonment': 'Over 70% cart abandonment rate. Major checkout flow issues.',
    'Address Checkout Friction': 'Over 50% checkout failure rate. Payment or trust issues.',
    'Test Price Reduction': 'High clicks but CVR below 0.2%. Price resistance indicated.',
    'Optimize Mobile Experience': 'Mobile performance significantly below desktop. UX improvements needed.',
    'Refresh Tired Creative': 'CTR declined 40%+ over 30 days. Creative fatigue evident.',
    'Broaden Targeting': 'High CVR but low impression share. Expand reach opportunity.',
    'Add Trust Signals': 'New product with high checkout abandonment. Build credibility.'
  }
};

// Add this new function after initializeBucketSwitcher (around line 85)
function setupBucketDateRangeSelector() {
  const chartsContainer = document.getElementById('roas_charts');
  if (!chartsContainer || !chartsContainer.parentElement) return;
  
  // Check if selector already exists
  let dateRangeContainer = document.getElementById('bucketDateRange');
  if (!dateRangeContainer) {
    // Create the container
    dateRangeContainer = document.createElement('div');
    dateRangeContainer.id = 'bucketDateRange';
    dateRangeContainer.className = 'bucket-date-selector-top';
dateRangeContainer.style.cssText = `
  position: absolute;
  top: -45px;
  right: 0;
  z-index: 100;
  display: block;
`;

// Add this after creating the container to ensure proper alignment
setTimeout(() => {
  const chartsRect = chartsContainer.getBoundingClientRect();
  const containerRect = dateRangeContainer.getBoundingClientRect();
  const parentRect = chartsContainer.parentElement.getBoundingClientRect();
  
  // Calculate the right offset to align with charts container
  const rightOffset = parentRect.right - chartsRect.right;
  dateRangeContainer.style.right = rightOffset + 'px';
}, 100);
    
    // Insert before charts container
    chartsContainer.parentElement.style.position = 'relative';
    chartsContainer.parentElement.insertBefore(dateRangeContainer, chartsContainer);
  }
  
  // Create the selector HTML
  dateRangeContainer.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span id="bucketDateText" style="color: #3c4043; font-size: 14px; font-weight: 500;">Last 30 days</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div id="bucketDateDropdown" style="
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: none;
      z-index: 1000;
      min-width: 150px;
    ">
      <div class="bucket-date-option" data-days="30" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 30 days</div>
      <div class="bucket-date-option" data-days="60" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 60 days</div>
      <div class="bucket-date-option" data-days="90" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 90 days</div>
    </div>
  `;
  
  // Get elements
  const dateRange = dateRangeContainer.querySelector('div');
  const dropdown = document.getElementById('bucketDateDropdown');
  const dateText = document.getElementById('bucketDateText');
  
  if (!dateRange || !dropdown || !dateText) return;
  
  // Check if listeners are already attached
  if (dateRange.hasAttribute('data-listeners-attached')) {
    return;
  }
  
  // Mark that listeners are attached
  dateRange.setAttribute('data-listeners-attached', 'true');
  
  // Sync with global date range
  const days = window.selectedBucketDateRangeDays || 30;
  dateText.textContent = `Last ${days} days`;
  
  // Toggle dropdown
  dateRange.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  // Handle option selection
  dropdown.addEventListener('click', async function(e) {
    const option = e.target.closest('.bucket-date-option');
    if (option) {
      const days = parseInt(option.getAttribute('data-days'));
      window.selectedBucketDateRangeDays = days;
      
      // Update display text
      dateText.textContent = option.textContent;
      
      // Hide dropdown
      dropdown.style.display = 'none';
      
// Show loading state
const bucketsContainer = document.getElementById('buckets_products');
const chartsContainer = document.getElementById('roas_charts');
const originalBucketsHTML = bucketsContainer ? bucketsContainer.innerHTML : '';
const originalChartsHTML = chartsContainer ? chartsContainer.innerHTML : '';

if (bucketsContainer) {
  bucketsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Loading data...</p></div>';
}
if (chartsContainer) {
  chartsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Loading charts...</p></div>';
}

try {
  // Refresh the buckets view with new date range
  console.log('[Bucket Date Range] Changed to:', days, 'days');
  await loadAndRenderROASBuckets();
} catch (error) {
  console.error('[Bucket Date Range] Error refreshing:', error);
  // Restore original content on error
  if (bucketsContainer) bucketsContainer.innerHTML = originalBucketsHTML;
  if (chartsContainer) chartsContainer.innerHTML = originalChartsHTML;
}
    }
  });
  
  // Close dropdown when clicking outside
  if (!window.bucketDateClickHandler) {
    window.bucketDateClickHandler = function(e) {
      if (!dateRangeContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    document.addEventListener('click', window.bucketDateClickHandler);
  }
  
  // Add hover effects
  dropdown.querySelectorAll('.bucket-date-option').forEach(option => {
    option.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f1f3f4';
    });
    option.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });
  });
}

async function loadAndRenderROASBuckets() {
  const bucketsContainer = document.getElementById('buckets_products');
  const chartsContainer = document.getElementById('roas_charts');
  if (chartsContainer) {
    chartsContainer.style.height = '600px';
    // Add the date selector setup here:
    setupBucketDateRangeSelector();
  }
  const metricsTableContainer = document.getElementById('roas_metrics_table');
  
  if (!bucketsContainer) return;
  
  // Clear existing content
  bucketsContainer.innerHTML = '';
  if (chartsContainer) {
    chartsContainer.innerHTML = '';
  }
  if (metricsTableContainer) {
    metricsTableContainer.innerHTML = '';
  }
  
  // Create wrapper for buckets container
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; gap: 15px; min-height: 450px; padding: 10px;';

  // Left container for funnel (increased width for three columns + funnel + descriptions)
  const leftContainer = document.createElement('div');
  leftContainer.style.cssText = 'width: 520px; min-height: 100%; position: relative;';
  
  // Add device switcher to left container
  const deviceSwitcherContainer = document.createElement('div');
  deviceSwitcherContainer.style.cssText = 'margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px;';
  
  deviceSwitcherContainer.innerHTML = `
    <div style="display: flex; align-items: center; gap: 10px;">
      <span style="font-weight: 600; font-size: 12px; color: #333;">Device Filter:</span>
      <div class="device-filter-group">
        <input type="radio" id="device_all_buckets" name="device_filter_buckets" value="all" checked>
        <label for="device_all_buckets" style="margin-right: 15px; font-size: 12px;">All Devices</label>
        
        <input type="radio" id="device_desktop_buckets" name="device_filter_buckets" value="DESKTOP">
        <label for="device_desktop_buckets" style="margin-right: 15px; font-size: 12px;">💻 Desktop</label>
        
        <input type="radio" id="device_mobile_buckets" name="device_filter_buckets" value="MOBILE">
        <label for="device_mobile_buckets" style="margin-right: 15px; font-size: 12px;">📱 Mobile</label>
        
        <input type="radio" id="device_tablet_buckets" name="device_filter_buckets" value="TABLET">
        <label for="device_tablet_buckets" style="font-size: 12px;">📋 Tablet</label>
      </div>
    </div>
  `;
  
  leftContainer.appendChild(deviceSwitcherContainer);
  
  // Right container for metrics
  const rightContainer = document.createElement('div');
  rightContainer.className = 'right-container';
  rightContainer.style.cssText = 'flex: 1; min-height: 500px; max-height: 800px; background: #f8f9fa; border-radius: 8px; padding: 20px; overflow-y: auto;';
  rightContainer.innerHTML = '<div style="color: #999; text-align: center; margin-top: 40px;">Select a bucket to view metrics</div>';
  
  wrapper.appendChild(leftContainer);
  wrapper.appendChild(rightContainer);
  bucketsContainer.appendChild(wrapper);
  
  try {
    // Get the bucket data using the same pattern as other data access
const accountPrefix = window.currentAccount || 'acc1';
const days = window.selectedBucketDateRangeDays || 30;
const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
const tableName = `${accountPrefix}_googleSheets_productBuckets_${suffix}`;
console.log(`[loadAndRenderROASBuckets] Loading data for ${days} days from ${tableName}`);
    
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
    
    if (!result || !result.data) {
      throw new Error('No data found');
    }
    
    // Store data globally for device filtering
    window.roasBucketsData = result.data;
    
    // Initial render with all devices
    renderROASBucketsWithDeviceFilter(leftContainer, rightContainer, result.data, 'all');
    
    // Add device filter event listeners
    const deviceRadios = deviceSwitcherContainer.querySelectorAll('input[name="device_filter_buckets"]');
    deviceRadios.forEach(radio => {
      radio.addEventListener('change', function() {
        if (this.checked) {
          renderROASBucketsWithDeviceFilter(leftContainer, rightContainer, result.data, this.value);
        }
      });
    });
    
    // *** PRESERVE ORIGINAL LOGIC FOR CHARTS AND TABLES ***
    const filteredData = result.data;
    
    // Get bucket type to determine what to show/hide
    const bucketType = window.selectedBucketType || 'ROAS_Bucket';
    
// Process historic data for area charts (hide for Suggestions)
    if (chartsContainer) {
      if (bucketType === 'SUGGESTIONS_BUCKET') {
        chartsContainer.style.display = 'none';
      } else {
        chartsContainer.style.display = '';
        await renderROASHistoricCharts(chartsContainer, filteredData);
      }
    }
    
    // Render metrics table
    if (metricsTableContainer) {
      // Apply margin-top only for Suggestions bucket type
      if (bucketType === 'Suggestions') {
        metricsTableContainer.style.marginTop = '100px';
        renderSuggestionsMetricsTable(metricsTableContainer, filteredData);
      } else {
        metricsTableContainer.style.marginTop = '';
        renderROASMetricsTable(metricsTableContainer, filteredData);
      }
    }
    
    // Render channels container with device aggregation - KEEP ORIGINAL LOGIC
    const channelsContainer = document.getElementById('roas_channels');
    if (channelsContainer) {
      if (bucketType === 'Suggestions') {
        channelsContainer.style.display = 'none';
      } else {
        channelsContainer.style.display = '';
        renderROASChannelsContainer(channelsContainer, result.data, null);
      }
    }
    
    // Initialize bucket distribution with ALL PRODUCTS data - KEEP ORIGINAL
    setTimeout(() => {
      if (!window.bucketDistributionPreferences) {
window.bucketDistributionPreferences = {
  'PROFITABILITY_BUCKET': true,
  'FUNNEL_STAGE_BUCKET': true,
  'INVESTMENT_BUCKET': true,
  'CUSTOM_TIER_BUCKET': true,
  'SUGGESTIONS_BUCKET': false
};
      }
      
      const rightContainer = document.querySelector('#buckets_products .right-container');
      if (rightContainer && window.roasBucketsData) {
        rightContainer.innerHTML = '';
        
        const titleDiv = document.createElement('div');
        titleDiv.style.cssText = 'text-align: center; margin-bottom: 15px; color: #333; font-weight: 600;';
        titleDiv.textContent = 'Overall Portfolio Distribution';
        rightContainer.appendChild(titleDiv);
        
        const scrollableContent = document.createElement('div');
        scrollableContent.id = 'bucketDistributionContent';
        scrollableContent.style.cssText = `
          height: 420px;
          overflow-y: auto;
          padding-right: 5px;
        `;
        
        renderBucketDistribution(scrollableContent, window.roasBucketsData);
        rightContainer.appendChild(scrollableContent);
      }
      
      updateChannelsAndCampaignsForBucket(null);
    }, 300);
        // Store refresh function globally
    window.refreshROASBucketsView = async () => {
      await loadAndRenderROASBuckets();
    };
  } catch (error) {
    console.error('[loadAndRenderROASBuckets] Error:', error);
    leftContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 40px;">Unable to load bucket data. Please ensure data is loaded.</div>';
  }
}

// Add this new function to handle device filtering for buckets
function renderROASBucketsWithDeviceFilter(leftContainer, rightContainer, data, deviceFilter) {
  // Clear the funnel area (preserve device switcher)
  const deviceSwitcher = leftContainer.querySelector('div');
  leftContainer.innerHTML = '';
  leftContainer.appendChild(deviceSwitcher);
  
  let filteredData = data;
  
// Apply device filter using Campaign="All" records only
if (deviceFilter !== 'all') {
  // Filter for specific device type with Campaign="All"
  filteredData = data.filter(row => 
    row['Campaign Name'] === 'All' && 
    row.Device === deviceFilter
  );
} else {
  // For 'all', use records where Campaign="All" AND Device="All"
  filteredData = data.filter(row => 
    row['Campaign Name'] === 'All' && 
    row.Device === 'All'
  );
}
  
  const bucketType = window.selectedBucketType || 'PROFITABILITY_BUCKET';
  
  // Group products by bucket type
  const bucketGroups = {};
  
if (bucketType === 'SUGGESTIONS_BUCKET') {
  // Parse the JSON string for suggestions
  filteredData.forEach(row => {
    if (row['SUGGESTIONS_BUCKET']) {
      try {
        const suggestions = JSON.parse(row['SUGGESTIONS_BUCKET']);
        suggestions.forEach(suggestionObj => {
          if (!bucketGroups[suggestionObj.suggestion]) {
            bucketGroups[suggestionObj.suggestion] = [];
          }
          bucketGroups[suggestionObj.suggestion].push(row);
        });
      } catch (e) {
        console.error('Error parsing suggestions:', e);
      }
    }
  });
} else {
  const allBuckets = new Set(filteredData.map(row => getBucketValue(row[bucketType])).filter(Boolean));
  allBuckets.forEach(bucket => {
    bucketGroups[bucket] = [];
  });
  
  filteredData.forEach(product => {
    const bucketValue = getBucketValue(product[bucketType]);
    if (bucketValue && bucketGroups[bucketValue]) {
      bucketGroups[bucketValue].push(product);
    }
  });
}
  
  // Calculate bucket data
  const totalProductCount = Object.values(bucketGroups).reduce((sum, products) => sum + products.length, 0);
  
  const bucketData = Object.entries(bucketGroups).map(([bucketName, products]) => ({
    name: bucketName,
    count: products.length,
    percentage: totalProductCount > 0 ? (products.length / totalProductCount * 100).toFixed(1) : 0
  }));
  
  // Render the funnel with filtered data
  renderROASFunnel(leftContainer, bucketData);
}

function renderROASFunnel(container, bucketData) {
  const bucketType = window.selectedBucketType || 'ROAS_Bucket';

  // Default bucket descriptions for ROAS_Bucket
  const defaultBucketDescriptions = {
    'Top Performers': 'Products that generate high revenue from advertising while also converting at a high rate. These are your most profitable products and should be prioritized for increased ad spend, new creative testing, and expansion into additional audiences or platforms.',
    'Efficient Low Volume': 'These products deliver a strong return on ad spend but with a low number of conversions. It suggests the product is well-targeted but not reaching enough people. Consider testing broader or new audiences and increasing impressions while maintaining efficiency.',
    'Volume Driver, Low ROI': 'Products that drive a high number of conversions, but at the cost of low profitability (low ROAS). These can be important for customer acquisition but may not be sustainable unless their margin improves or lifetime value justifies continued spend.',
    'Underperformers': 'Products that have both low ROAS and low conversion volume. These require immediate action - either optimize campaigns (ad creative, targeting, bidding), adjust pricing, or pause to reallocate budget to better-performing products.'
  };

    // Ensure all bucket names are represented in bucketData (including those with 0 products)
  if (window.allBucketNames) {
    const bucketDataMap = new Map(bucketData.map(item => [item.name, item]));
    
    // Add missing buckets with 0 count
    window.allBucketNames.forEach(bucketName => {
      if (!bucketDataMap.has(bucketName)) {
        bucketData.push({
          name: bucketName,
          count: 0,
          percentage: 0
        });
      }
    });
  }

  // Get bucket descriptions based on selected type
  let bucketDescriptions = defaultBucketDescriptions;
  if (window.bucketDescriptions && window.bucketDescriptions[bucketType]) {
    bucketDescriptions = window.bucketDescriptions[bucketType];
  }

// Calculate additional metrics for each bucket
  const enhancedBucketData = bucketData.map(bucket => {
    let bucketProducts;
    
    // Handle Suggestions differently (products can have multiple suggestions)
    if (bucketType === 'Suggestions') {
      bucketProducts = window.roasBucketsData.filter(row => {
        const suggestions = row[bucketType] ? row[bucketType].split(';').map(s => s.trim()) : [];
        return suggestions.includes(bucket.name);
      });
    } else {
      bucketProducts = window.roasBucketsData.filter(row => getBucketValue(row[bucketType]) === bucket.name);
    }
    
    const totalCost = bucketProducts.reduce((sum, product) => sum + (parseFloat(product.Cost) || 0), 0);
    const totalRevenue = bucketProducts.reduce((sum, product) => sum + (parseFloat(product.ConvValue) || 0), 0);
    const avgROAS = totalCost > 0 ? totalRevenue / totalCost : 0;
    
    return {
      ...bucket,
      totalCost,
      totalRevenue,
      avgROAS,
      description: bucketDescriptions[bucket.name] || `${bucket.name} bucket - Performance analysis and optimization recommendations for products in this category.`
    };
  });

  // Calculate totals for percentage calculations
  const grandTotalCost = enhancedBucketData.reduce((sum, bucket) => sum + bucket.totalCost, 0);
  const grandTotalRevenue = enhancedBucketData.reduce((sum, bucket) => sum + bucket.totalRevenue, 0);
  const totalProducts = enhancedBucketData.reduce((sum, bucket) => sum + bucket.count, 0);

  // Add percentage calculations
  enhancedBucketData.forEach(bucket => {
    bucket.costPercentage = grandTotalCost > 0 ? (bucket.totalCost / grandTotalCost * 100) : 0;
    bucket.revenuePercentage = grandTotalRevenue > 0 ? (bucket.totalRevenue / grandTotalRevenue * 100) : 0;
    bucket.productPercentage = totalProducts > 0 ? (bucket.count / totalProducts * 100) : 0;
  });

// Use configuration-based ordering
const orderedBuckets = [];

if (bucketConfig) {
  if (bucketType === 'Suggestions') {
    // For Suggestions, order by the configuration but only include buckets that exist in the data
    const orderToUse = [...bucketConfig.order].reverse();
    orderToUse.forEach(bucketName => {
      const foundBucket = enhancedBucketData.find(b => b.name === bucketName);
      if (foundBucket) {
        orderedBuckets.push(foundBucket);
      }
    });
    // Add any suggestions not in the predefined order
    enhancedBucketData.forEach(bucket => {
      if (!orderedBuckets.find(b => b.name === bucket.name)) {
        orderedBuckets.push(bucket);
      }
    });
  } else {
    // Order buckets based on configuration (reversed for funnel display - best at bottom)
    const orderToUse = [...bucketConfig.order].reverse();

    orderToUse.forEach(bucketName => {
      const foundBucket = enhancedBucketData.find(b => b.name === bucketName);
      if (foundBucket) {
        orderedBuckets.push(foundBucket);
      } else {
        // Create placeholder for missing buckets
        orderedBuckets.push({
          name: bucketName,
          count: 0,
          avgROAS: 0,
          totalCost: 0,
          totalRevenue: 0,
          costPercentage: 0,
          revenuePercentage: 0,
          productPercentage: 0,
          description: bucketDescriptions[bucketName] || `${bucketName} bucket - Performance analysis and optimization recommendations for products in this category.`
        });
      }
    });
  }
} else {
  // Fallback - use all buckets from enhancedBucketData if no config
  enhancedBucketData.forEach(bucket => {
    orderedBuckets.push(bucket);
  });
}
// Store reference for click handling
container.bucketData = orderedBuckets;

// Calculate aggregated totals for all products
const allProducts = window.roasBucketsData;
const totalProductCount = allProducts.length;
const totalCostAll = allProducts.reduce((sum, product) => sum + (parseFloat(product.Cost) || 0), 0);
const totalRevenueAll = allProducts.reduce((sum, product) => sum + (parseFloat(product.ConvValue) || 0), 0);
const avgROASAll = totalCostAll > 0 ? totalRevenueAll / totalCostAll : 0;

// Create main container with columns and funnel (no title, full height)
const mainContainer = document.createElement('div');
mainContainer.style.cssText = 'width: 100%; max-width: 520px; height: 100%; display: flex; align-items: flex-start; gap: 10px; margin: 0 auto;';
  
  container.appendChild(mainContainer);
  
// Create ROAS column
const roasColumn = document.createElement('div');
roasColumn.style.cssText = 'width: 80px; display: flex; flex-direction: column; padding: 20px 0;';

// Create Cost/Revenue column
const metricsColumn = document.createElement('div');
metricsColumn.style.cssText = 'width: 140px; display: flex; flex-direction: column; padding: 20px 0;';
  
// SVG container for funnel  
const svgContainer = document.createElement('div');
svgContainer.style.cssText = 'width: 280px; display: flex; justify-content: flex-start; align-items: flex-start; position: relative; padding-top: 20px;';
  
  mainContainer.appendChild(roasColumn);
  mainContainer.appendChild(metricsColumn);
  mainContainer.appendChild(svgContainer);

// Calculate dynamic height based on number of buckets
const sectionHeight = 90;  // Height per bucket
const gap = 5;
const aggregatedRowHeight = 70;
const separatorGap = 15;
const numBuckets = orderedBuckets.length;
const calculatedHeight = aggregatedRowHeight + separatorGap + (numBuckets * (sectionHeight + gap)) + 40; // 40 for padding

// SVG dimensions - match the actual content size
const width = 280;
const height = Math.max(520, calculatedHeight); // Ensure minimum height

// Create SVG
const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
svg.setAttribute('width', width);
svg.setAttribute('height', height);
svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
svg.style.marginLeft = '0';
  
  // Define gradients and filters
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  
  const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
  filter.setAttribute('id', 'dropshadow');
  filter.innerHTML = `
    <feGaussianBlur in="SourceAlpha" stdDeviation="3"/>
    <feOffset dx="2" dy="2" result="offsetblur"/>
    <feComponentTransfer>
      <feFuncA type="linear" slope="0.3"/>
    </feComponentTransfer>
    <feMerge>
      <feMergeNode/>
      <feMergeNode in="SourceGraphic"/>
    </feMerge>
  `;
  defs.appendChild(filter);
  
// Get bucket configuration
const bucketConfig = window.bucketConfig[bucketType];
if (!bucketConfig) {
  console.error(`[renderROASFunnel] No configuration found for bucket type: ${bucketType}`);
  return;
}

// Create color gradients based on bucket configuration
const colors = [];
const colorIdMap = {};

// For Suggestions, we need to handle dynamic bucket names
if (bucketType === 'Suggestions') {
  // Use the actual unique bucket values found in data
  window.allBucketNames.forEach((bucketName, index) => {
    const baseColor = bucketConfig.colors[bucketName] || '#999999';
    const colorId = `bucket-${index}`;
    colorIdMap[bucketName] = colorId;
    
    // Create a slightly lighter version for gradient end
    const lighterColor = adjustColorBrightness(baseColor, 20);
    
    colors.push({
      id: colorId,
      start: baseColor,
      end: lighterColor,
      bucketName: bucketName
    });
  });
} else {
  bucketConfig.order.forEach((bucketName, index) => {
    const baseColor = bucketConfig.colors[bucketName];
    const colorId = `bucket-${index}`;
    colorIdMap[bucketName] = colorId;
    
    // Create a slightly lighter version for gradient end
    const lighterColor = adjustColorBrightness(baseColor, 20);
    
    colors.push({
      id: colorId,
      start: baseColor,
      end: lighterColor,
      bucketName: bucketName
    });
  });
}

// Helper function to lighten colors
function adjustColorBrightness(hex, percent) {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}

  // Add gradient for "ALL PRODUCTS" row
const allGradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
allGradient.setAttribute('id', 'gradient-all');
allGradient.setAttribute('x1', '0%');
allGradient.setAttribute('y1', '0%');
allGradient.setAttribute('x2', '100%');
allGradient.setAttribute('y2', '0%');

const allStop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
allStop1.setAttribute('offset', '0%');
allStop1.setAttribute('style', 'stop-color:#424242;stop-opacity:1');

const allStop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
allStop2.setAttribute('offset', '100%');
allStop2.setAttribute('style', 'stop-color:#616161;stop-opacity:1');

allGradient.appendChild(allStop1);
allGradient.appendChild(allStop2);
defs.appendChild(allGradient);
  
  colors.forEach(color => {
    const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
    gradient.setAttribute('id', color.id);
    gradient.setAttribute('x1', '0%');
    gradient.setAttribute('y1', '0%');
    gradient.setAttribute('x2', '100%');
    gradient.setAttribute('y2', '0%');
    
    const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop1.setAttribute('offset', '0%');
    stop1.setAttribute('style', `stop-color:${color.start};stop-opacity:1`);
    
    const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
    stop2.setAttribute('offset', '100%');
    stop2.setAttribute('style', `stop-color:${color.end};stop-opacity:1`);
    
    gradient.appendChild(stop1);
    gradient.appendChild(stop2);
    defs.appendChild(gradient);
  });
  
  svg.appendChild(defs);
  
  // Calculate max percentage for width scaling
const fixedTrapezoidWidth = 350;
  
// Set startY (other dimensions already defined above)
const startY = 0;

// First, create the aggregated row
const aggregatedY = startY;

// Aggregated row trapezoid
const aggTrapezoid = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
const aggTopWidth = 280;
const aggBottomWidth = 250;
const aggPoints = `0,${aggregatedY} ${aggTopWidth},${aggregatedY} ${aggBottomWidth},${aggregatedY + aggregatedRowHeight} 0,${aggregatedY + aggregatedRowHeight}`;

aggTrapezoid.setAttribute('points', aggPoints);
aggTrapezoid.setAttribute('fill', 'url(#gradient-all)');
aggTrapezoid.setAttribute('filter', 'url(#dropshadow)');
aggTrapezoid.style.cursor = 'default';
aggTrapezoid.style.stroke = '#333';
aggTrapezoid.style.strokeWidth = '2';
aggTrapezoid.style.strokeDasharray = '5,5';

svg.appendChild(aggTrapezoid);

// Add "ALL PRODUCTS" text in aggregated trapezoid
const aggTextGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
aggTextGroup.style.pointerEvents = 'none';

const allProductsLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
allProductsLabel.setAttribute('x', 140);
allProductsLabel.setAttribute('y', aggregatedY + 30);
allProductsLabel.setAttribute('text-anchor', 'middle');
allProductsLabel.setAttribute('fill', 'white');
allProductsLabel.setAttribute('font-weight', '700');
allProductsLabel.setAttribute('font-size', '16px');
allProductsLabel.textContent = 'ALL PRODUCTS';

const allProductsCount = document.createElementNS('http://www.w3.org/2000/svg', 'text');
allProductsCount.setAttribute('x', 140);
allProductsCount.setAttribute('y', aggregatedY + 50);
allProductsCount.setAttribute('text-anchor', 'middle');
allProductsCount.setAttribute('fill', 'white');
allProductsCount.setAttribute('font-weight', '700');
allProductsCount.setAttribute('font-size', '24px');
allProductsCount.textContent = totalProductCount;

aggTextGroup.appendChild(allProductsLabel);
aggTextGroup.appendChild(allProductsCount);
svg.appendChild(aggTextGroup);

// Make aggregated trapezoid clickable
aggTrapezoid.style.cursor = 'pointer';
aggTrapezoid.addEventListener('click', function() {
  // Remove previous selection from all trapezoids
  svg.querySelectorAll('polygon').forEach(p => p.style.stroke = 'none');
  
  // Highlight selected (use different style for aggregated)
  this.style.stroke = '#333';
  this.style.strokeWidth = '3';
  this.style.strokeDasharray = 'none';
  
  // Update channels and campaigns with no filter (show all)
  updateChannelsAndCampaignsForBucket(null);
  
  // Update right container to show overall distribution
  const rightContainer = document.querySelector('#buckets_products .right-container');
  if (rightContainer) {
    rightContainer.innerHTML = '<div style="text-align: center; margin-top: 40px; color: #333; font-weight: 600;">Overall Portfolio Distribution</div>';
    renderBucketDistribution(rightContainer, window.roasBucketsData);
  }
});

// Create aggregated row indicators in columns
const aggRoasIndicator = document.createElement('div');
aggRoasIndicator.style.cssText = `
  height: ${aggregatedRowHeight}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #424242, #616161);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  margin-bottom: ${separatorGap}px;
  border: 2px dashed #999;
`;

aggRoasIndicator.innerHTML = `
  <div style="font-size: 10px; opacity: 0.9; margin-bottom: 2px;">AVG ROAS</div>
  <div style="font-size: 18px; font-weight: 700;">${avgROASAll.toFixed(1)}x</div>
`;

roasColumn.appendChild(aggRoasIndicator);

const aggMetricsIndicator = document.createElement('div');
aggMetricsIndicator.style.cssText = `
  height: ${aggregatedRowHeight}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  margin-bottom: ${separatorGap}px;
  padding: 4px;
  border: 2px dashed #999;
`;

// For aggregated row, show 100% bars
const aggBarHeight = 20;
const aggBarWidth = 132;

// Products bar (100%)
const aggProductsBarContainer = document.createElement('div');
aggProductsBarContainer.style.cssText = `
  width: ${aggBarWidth}px;
  height: ${aggBarHeight}px;
  position: relative;
  margin-bottom: 1px;
  background: #2196F3;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const aggProductsLabel = document.createElement('div');
aggProductsLabel.style.cssText = `
  position: absolute;
  left: 2px;
  top: 1px;
  font-size: 7px;
  font-weight: 500;
  color: white;
`;
aggProductsLabel.textContent = '# Products';

const aggProductsValue = document.createElement('div');
aggProductsValue.style.cssText = `
  font-size: 10px;
  font-weight: 700;
  color: white;
`;
aggProductsValue.textContent = '100%';

aggProductsBarContainer.appendChild(aggProductsLabel);
aggProductsBarContainer.appendChild(aggProductsValue);

// Cost bar (100%)
const aggCostBarContainer = document.createElement('div');
aggCostBarContainer.style.cssText = `
  width: ${aggBarWidth}px;
  height: ${aggBarHeight}px;
  position: relative;
  margin-bottom: 1px;
  background: #FF9800;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const aggCostLabel = document.createElement('div');
aggCostLabel.style.cssText = `
  position: absolute;
  left: 2px;
  top: 1px;
  font-size: 7px;
  font-weight: 500;
  color: white;
`;
aggCostLabel.textContent = 'Cost';

const aggCostValue = document.createElement('div');
aggCostValue.style.cssText = `
  font-size: 10px;
  font-weight: 700;
  color: white;
`;
aggCostValue.textContent = '100%';

aggCostBarContainer.appendChild(aggCostLabel);
aggCostBarContainer.appendChild(aggCostValue);

// Revenue bar (100%)
const aggRevenueBarContainer = document.createElement('div');
aggRevenueBarContainer.style.cssText = `
  width: ${aggBarWidth}px;
  height: ${aggBarHeight}px;
  position: relative;
  background: #4CAF50;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const aggRevenueLabel = document.createElement('div');
aggRevenueLabel.style.cssText = `
  position: absolute;
  left: 2px;
  top: 1px;
  font-size: 7px;
  font-weight: 500;
  color: white;
`;
aggRevenueLabel.textContent = 'Revenue';

const aggRevenueValue = document.createElement('div');
aggRevenueValue.style.cssText = `
  font-size: 10px;
  font-weight: 700;
  color: white;
`;
aggRevenueValue.textContent = '100%';

aggRevenueBarContainer.appendChild(aggRevenueLabel);
aggRevenueBarContainer.appendChild(aggRevenueValue);

aggMetricsIndicator.appendChild(aggProductsBarContainer);
aggMetricsIndicator.appendChild(aggCostBarContainer);
aggMetricsIndicator.appendChild(aggRevenueBarContainer);

metricsColumn.appendChild(aggMetricsIndicator);

// Now create bucket sections with adjusted Y position
const bucketStartY = aggregatedY + aggregatedRowHeight + separatorGap;

orderedBuckets.forEach((bucket, index) => {
  const y = bucketStartY + index * (sectionHeight + gap);
    
// Fixed dimensions for all trapezoids
const trapezoidTopWidth = 280;
const trapezoidBottomWidth = 250;
const leftEdge = 0; // Start from left edge

// Calculate trapezoid points - same for all
const topLeft = 0;
const topRight = trapezoidTopWidth;
const bottomLeft = 0;
const bottomRight = trapezoidBottomWidth;

// Create inverted trapezoid
const trapezoid = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
const points = `${topLeft},${y} ${topRight},${y} ${bottomRight},${y + sectionHeight} ${bottomLeft},${y + sectionHeight}`;
    
trapezoid.setAttribute('points', points);
const colorConfig = colors.find(c => c.bucketName === bucket.name);
if (!colorConfig && bucketType === 'Suggestions') {
  // For suggestions without predefined colors, use a default
  trapezoid.setAttribute('fill', '#999999');
} else {
  trapezoid.setAttribute('fill', `url(#${colorConfig ? colorConfig.id : colors[0]?.id || 'gradient-all'})`);
}
    trapezoid.setAttribute('filter', 'url(#dropshadow)');
    trapezoid.style.cursor = 'pointer';
    trapezoid.style.transition = 'all 0.3s ease';
    
// Add click handler
trapezoid.addEventListener('click', function() {
  // Remove previous selection
  svg.querySelectorAll('polygon').forEach(p => p.style.stroke = 'none');
  
  // Highlight selected
  this.style.stroke = '#333';
  this.style.strokeWidth = '3';
  
  // Update right container
  updateBucketMetrics(bucket.name);
  
  // Update channels and campaigns tables with bucket filter
  updateChannelsAndCampaignsForBucket(bucket.name);
});
    
    // Add hover effect
    trapezoid.addEventListener('mouseenter', function() {
      if (!this.style.stroke) {
        this.style.transform = 'scale(1.02)';
        this.style.filter = 'url(#dropshadow) brightness(1.1)';
      }
    });
    
    trapezoid.addEventListener('mouseleave', function() {
      if (!this.style.stroke) {
        this.style.transform = 'scale(1)';
        this.style.filter = 'url(#dropshadow) brightness(1)';
      }
    });
    
    svg.appendChild(trapezoid);
    
    // Create ROAS indicator in left column (aligned with trapezoid)
    const roasIndicator = document.createElement('div');
    roasIndicator.style.cssText = `
      height: ${sectionHeight}px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background: ${bucketConfig.colors[bucket.name] || '#999'};
      color: white;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      margin-bottom: ${gap}px;
    `;
    
    roasIndicator.innerHTML = `
      <div style="font-size: 11px; opacity: 0.9; margin-bottom: 4px;">ROAS</div>
      <div style="font-size: 20px; font-weight: 700;">${bucket.avgROAS.toFixed(1)}x</div>
    `;
    
    roasColumn.appendChild(roasIndicator);
    
// Create Cost/Revenue indicator with horizontal bars
const metricsIndicator = document.createElement('div');
metricsIndicator.style.cssText = `
  height: ${sectionHeight}px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  margin-bottom: ${gap}px;
  padding: 4px;
  border: 1px solid #ddd;
  position: relative;
`;

// Create three horizontal bar sections
const barHeight = 26;
const barWidth = 132;

// Products bar
const productsBarContainer = document.createElement('div');
productsBarContainer.style.cssText = `
  width: ${barWidth}px;
  height: ${barHeight}px;
  position: relative;
  margin-bottom: 2px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
`;

const productsBar = document.createElement('div');
productsBar.style.cssText = `
  height: 100%;
  width: ${Math.min(100, bucket.productPercentage)}%;
  background: #2196F3;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
`;

const productsValue = document.createElement('div');
productsValue.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  color: ${bucket.productPercentage > 50 ? 'white' : '#333'};
`;
productsValue.textContent = `${bucket.productPercentage.toFixed(1)}%`;

productsBar.appendChild(productsValue);
productsBarContainer.appendChild(productsBar);

// Cost bar
const costBarContainer = document.createElement('div');
costBarContainer.style.cssText = `
  width: ${barWidth}px;
  height: ${barHeight}px;
  position: relative;
  margin-bottom: 2px;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
`;

const costBar = document.createElement('div');
costBar.style.cssText = `
  height: 100%;
  width: ${Math.min(100, bucket.costPercentage)}%;
  background: #FF9800;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
`;

const costValue = document.createElement('div');
costValue.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  color: ${bucket.costPercentage > 50 ? 'white' : '#333'};
`;
costValue.textContent = `${bucket.costPercentage.toFixed(1)}%`;

costBar.appendChild(costValue);
costBarContainer.appendChild(costBar);

// Revenue bar
const revenueBarContainer = document.createElement('div');
revenueBarContainer.style.cssText = `
  width: ${barWidth}px;
  height: ${barHeight}px;
  position: relative;
  background: #f0f0f0;
  border-radius: 3px;
  overflow: hidden;
  cursor: pointer;
`;

const revenueBar = document.createElement('div');
revenueBar.style.cssText = `
  height: 100%;
  width: ${Math.min(100, bucket.revenuePercentage)}%;
  background: #4CAF50;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
`;

const revenueValue = document.createElement('div');
revenueValue.style.cssText = `
  font-size: 11px;
  font-weight: 700;
  color: ${bucket.revenuePercentage > 50 ? 'white' : '#333'};
`;
revenueValue.textContent = `${bucket.revenuePercentage.toFixed(1)}%`;

revenueBar.appendChild(revenueValue);
revenueBarContainer.appendChild(revenueBar);

// Create hover tooltip
const metricsHoverTooltip = document.createElement('div');
metricsHoverTooltip.style.cssText = `
  position: absolute;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 1000;
  white-space: nowrap;
`;

metricsIndicator.appendChild(metricsHoverTooltip);

// Create combined hover event for the entire metrics indicator
metricsIndicator.addEventListener('mouseenter', function(e) {
  metricsHoverTooltip.innerHTML = `
    <div style="margin-bottom: 6px;"><strong># Products:</strong> ${bucket.count} (${bucket.productPercentage.toFixed(1)}%)</div>
    <div style="margin-bottom: 6px;"><strong>Cost:</strong> $${bucket.totalCost.toLocaleString()} (${bucket.costPercentage.toFixed(1)}%)</div>
    <div><strong>Revenue:</strong> $${bucket.totalRevenue.toLocaleString()} (${bucket.revenuePercentage.toFixed(1)}%)</div>
  `;
  metricsHoverTooltip.style.opacity = '1';
});

metricsIndicator.addEventListener('mousemove', function(e) {
  const rect = metricsIndicator.getBoundingClientRect();
  metricsHoverTooltip.style.top = (e.clientY - rect.top - 80) + 'px';
  metricsHoverTooltip.style.left = (e.clientX - rect.left - metricsHoverTooltip.offsetWidth/2) + 'px';
});

metricsIndicator.addEventListener('mouseleave', function() {
  metricsHoverTooltip.style.opacity = '0';
});

metricsIndicator.appendChild(productsBarContainer);
metricsIndicator.appendChild(costBarContainer);
metricsIndicator.appendChild(revenueBarContainer);
    
    metricsColumn.appendChild(metricsIndicator);
    
    // Determine if description should be inside trapezoid or overflow
    const canFitDescription = trapezoidTopWidth > 280;
    
  // Calculate metrics for the bucket
const bucketProducts = window.roasBucketsData.filter(row => row['ROAS_Bucket'] === bucket.name);
const totalImpressions = bucketProducts.reduce((sum, product) => sum + (parseInt(product.Impressions) || 0), 0);
const totalClicks = bucketProducts.reduce((sum, product) => sum + (parseInt(product.Clicks) || 0), 0);
const totalConversions = bucketProducts.reduce((sum, product) => sum + (parseFloat(product.Conversions) || 0), 0);

// Calculate totals across all buckets for percentage calculations
const grandTotalImpressions = window.roasBucketsData.reduce((sum, product) => sum + (parseInt(product.Impressions) || 0), 0);
const grandTotalClicks = window.roasBucketsData.reduce((sum, product) => sum + (parseInt(product.Clicks) || 0), 0);
const grandTotalConversions = window.roasBucketsData.reduce((sum, product) => sum + (parseFloat(product.Conversions) || 0), 0);

// Calculate percentages
const impressionsPercentage = grandTotalImpressions > 0 ? (totalImpressions / grandTotalImpressions * 100) : 0;
const clicksPercentage = grandTotalClicks > 0 ? (totalClicks / grandTotalClicks * 100) : 0;
const conversionsPercentage = grandTotalConversions > 0 ? (totalConversions / grandTotalConversions * 100) : 0;

// Add content inside trapezoid
const textGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
textGroup.style.pointerEvents = 'none';

// Left side: Product count (large) and percentage with visualization
const productCount = document.createElementNS('http://www.w3.org/2000/svg', 'text');
productCount.setAttribute('x', 45);
productCount.setAttribute('y', y + 45);
productCount.setAttribute('text-anchor', 'middle');
productCount.setAttribute('fill', 'white');
productCount.setAttribute('font-weight', '700');
productCount.setAttribute('font-size', '36px');
productCount.textContent = bucket.count;

// Percentage bar visualization
const percentageBarBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
percentageBarBg.setAttribute('x', 25);
percentageBarBg.setAttribute('y', y + 60);
percentageBarBg.setAttribute('width', '40');
percentageBarBg.setAttribute('height', '6');
percentageBarBg.setAttribute('fill', 'rgba(255,255,255,0.3)');
percentageBarBg.setAttribute('rx', '3');

const percentageBar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
percentageBar.setAttribute('x', 25);
percentageBar.setAttribute('y', y + 60);
percentageBar.setAttribute('width', Math.max(1, (bucket.productPercentage / 100) * 40));
percentageBar.setAttribute('height', '6');
percentageBar.setAttribute('fill', 'white');
percentageBar.setAttribute('rx', '3');

const percentageText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
percentageText.setAttribute('x', 45);
percentageText.setAttribute('y', y + 80);
percentageText.setAttribute('text-anchor', 'middle');
percentageText.setAttribute('fill', 'white');
percentageText.setAttribute('font-size', '14px');
percentageText.setAttribute('font-weight', '600');
percentageText.textContent = `${bucket.productPercentage.toFixed(1)}%`;

// Right side: Bucket name
const bucketName = document.createElementNS('http://www.w3.org/2000/svg', 'text');
bucketName.setAttribute('x', 80);
bucketName.setAttribute('y', y + 25);
bucketName.setAttribute('fill', 'white');
bucketName.setAttribute('font-weight', '700');
bucketName.setAttribute('font-size', '18px');
bucketName.textContent = bucket.name;

// Metrics in three vertical columns - positioned in bottom right
const metricsData = [
  { label: 'Impr:', percentage: impressionsPercentage },
  { label: 'Clicks:', percentage: clicksPercentage },
  { label: 'Conv:', percentage: conversionsPercentage }
];

const metricsStartX = 120;
const metricsSpacing = 50;

metricsData.forEach((metric, metricIndex) => {
  const metricX = metricsStartX + (metricIndex * metricsSpacing);
  
  // Metric label at top
  const metricLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  metricLabel.setAttribute('x', metricX);
  metricLabel.setAttribute('y', y + 60);
  metricLabel.setAttribute('text-anchor', 'middle');
  metricLabel.setAttribute('fill', 'white');
  metricLabel.setAttribute('font-size', '11px');
  metricLabel.setAttribute('font-weight', '500');
  metricLabel.setAttribute('opacity', '0.9');
  metricLabel.textContent = metric.label;
  
  // Small bar directly under label
  const barWidth = 30;
  const barHeight = 4;
  const barY = y + 65;
  
  const barBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  barBg.setAttribute('x', metricX - barWidth/2);
  barBg.setAttribute('y', barY);
  barBg.setAttribute('width', barWidth);
  barBg.setAttribute('height', barHeight);
  barBg.setAttribute('fill', 'rgba(255,255,255,0.3)');
  barBg.setAttribute('rx', '2');
  
  const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
  bar.setAttribute('x', metricX - barWidth/2);
  bar.setAttribute('y', barY);
  bar.setAttribute('width', Math.max(1, (metric.percentage / 100) * barWidth));
  bar.setAttribute('height', barHeight);
  bar.setAttribute('fill', 'white');
  bar.setAttribute('rx', '2');
  
  // Percentage value at bottom
  const metricValue = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  metricValue.setAttribute('x', metricX);
  metricValue.setAttribute('y', y + 82);
  metricValue.setAttribute('text-anchor', 'middle');
  metricValue.setAttribute('fill', 'white');
  metricValue.setAttribute('font-size', '12px');
  metricValue.setAttribute('font-weight', '700');
  metricValue.textContent = `${metric.percentage.toFixed(1)}%`;
  
  textGroup.appendChild(metricLabel);
  textGroup.appendChild(barBg);
  textGroup.appendChild(bar);
  textGroup.appendChild(metricValue);
});
    
textGroup.appendChild(productCount);
textGroup.appendChild(percentageBarBg);
textGroup.appendChild(percentageBar);
textGroup.appendChild(percentageText);
textGroup.appendChild(bucketName);

// Add hover tooltip for description
const hoverTooltip = document.createElement('div');
hoverTooltip.style.cssText = `
  position: absolute;
  background: ${colors[index].start};
  color: white;
  padding: 12px 15px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  font-size: 12px;
  line-height: 1.4;
  width: 280px;
  z-index: 1000;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  border: 2px solid white;
`;

hoverTooltip.innerHTML = `
  <div style="font-weight: 700; font-size: 14px; margin-bottom: 8px;">${bucket.name}</div>
  <div>${bucket.description}</div>
`;

container.appendChild(hoverTooltip);

// Add hover events to trapezoid
trapezoid.addEventListener('mouseenter', function(e) {
  if (!this.style.stroke) {
    this.style.transform = 'scale(1.02)';
    this.style.filter = 'url(#dropshadow) brightness(1.1)';
  }
  
  // Show tooltip
  const rect = container.getBoundingClientRect();
  hoverTooltip.style.opacity = '1';
  hoverTooltip.style.left = (e.clientX - rect.left + 20) + 'px';
  hoverTooltip.style.top = (e.clientY - rect.top) + 'px';
});

trapezoid.addEventListener('mouseleave', function() {
  if (!this.style.stroke) {
    this.style.transform = 'scale(1)';
    this.style.filter = 'url(#dropshadow) brightness(1)';
  }
  
  // Hide tooltip
  hoverTooltip.style.opacity = '0';
});

trapezoid.addEventListener('mousemove', function(e) {
  if (hoverTooltip.style.opacity === '1') {
    const rect = container.getBoundingClientRect();
    hoverTooltip.style.left = (e.clientX - rect.left + 20) + 'px';
    hoverTooltip.style.top = (e.clientY - rect.top) + 'px';
  }
});

svg.appendChild(textGroup);
  });
  
  svgContainer.appendChild(svg);
  
  // Auto-select Top Performers by default
  setTimeout(() => {
    const topPerformersPolygon = svg.querySelectorAll('polygon')[3]; // Last polygon is Top Performers
    if (topPerformersPolygon) {
      topPerformersPolygon.click();
    }
  }, 100);
}

async function updateBucketMetrics(selectedBucket) {
  const rightContainer = document.querySelector('#buckets_products .right-container');
  if (!rightContainer) return;
  
  // Show loading
  rightContainer.innerHTML = '<div style="text-align: center; margin-top: 40px;"><div class="spinner"></div><p>Loading metrics...</p></div>';
  
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
    
    if (!result || !result.data) {
      throw new Error('No data found');
    }
    
    // Filter data for selected bucket AND Campaign Name === 'All'
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
const bucketProducts = result.data.filter(row => 
  getBucketValue(row[bucketType]) === selectedBucket && row['Campaign Name'] === 'All'
);
    
    if (bucketProducts.length === 0) {
      rightContainer.innerHTML = `<div style="text-align: center; margin-top: 40px; color: #666;">No products found in ${selectedBucket} bucket</div>`;
      return;
    }
    
    renderBucketMetrics(rightContainer, selectedBucket, bucketProducts);
    
  } catch (error) {
    console.error('[updateBucketMetrics] Error:', error);
    rightContainer.innerHTML = '<div style="text-align: center; color: #f44336; margin-top: 40px;">Error loading bucket metrics</div>';
  }
}

async function updateChannelsAndCampaignsForBucket(selectedBucket) {
  const channelsContainer = document.getElementById('roas_channels');
  if (!channelsContainer) return;
  
  try {
    // Get the same data as used in loadAndRenderROASBuckets
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
    
    if (!result || !result.data) {
      console.error('[updateChannelsAndCampaignsForBucket] No data found');
      return;
    }
    
    // Re-render the channels container with the bucket filter
    renderROASChannelsContainer(channelsContainer, result.data, selectedBucket);
    
  } catch (error) {
    console.error('[updateChannelsAndCampaignsForBucket] Error:', error);
  }
}

function renderBucketMetrics(container, bucketName, products) {
  container.innerHTML = '';
  
  // Add settings button
  const headerContainer = document.createElement('div');
  headerContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; position: relative;';
  
  const title = document.createElement('h4');
  title.style.cssText = 'margin: 0; color: #333;';
  title.textContent = 'Bucket Distribution';
  
  const settingsBtn = document.createElement('button');
  settingsBtn.id = 'bucketDistributionSettingsBtn';
  settingsBtn.className = 'trends-settings-btn';
  settingsBtn.style.cssText = `
    width: 24px;
    height: 24px;
    background: #f5f5f5;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    position: absolute;
    top: 0;
    right: 0;
  `;
  settingsBtn.innerHTML = `
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6m0 6v6m4.22-10.22l4.24 4.24M6.34 6.34l4.24 4.24m4.88 0l4.24 4.24M6.34 17.66l4.24-4.24"></path>
    </svg>
  `;
  
  headerContainer.appendChild(title);
  headerContainer.appendChild(settingsBtn);
  container.appendChild(headerContainer);
  
  // Create scrollable content area
const scrollableContent = document.createElement('div');
scrollableContent.id = 'bucketDistributionContent';
scrollableContent.style.cssText = `
  height: 450px;
  overflow-y: auto;
  padding-right: 5px;
`;
  
  // Initialize bucket preferences if not exists
if (!window.bucketDistributionPreferences) {
window.bucketDistributionPreferences = {
  'PROFITABILITY_BUCKET': true,
  'FUNNEL_STAGE_BUCKET': true,
  'INVESTMENT_BUCKET': true,
  'CUSTOM_TIER_BUCKET': true,
  'SUGGESTIONS_BUCKET': false
};
}
  
  renderBucketDistribution(scrollableContent, products);
  container.appendChild(scrollableContent);
  
  // Create settings popup
  const settingsPopup = document.createElement('div');
  settingsPopup.id = 'bucketDistributionSettingsPopup';
  settingsPopup.className = 'metrics-selector-popup';
  settingsPopup.innerHTML = `
    <div class="metrics-selector-title">Select Bucket Types to Display</div>
    <div id="bucketDistributionListContainer"></div>
  `;
  container.appendChild(settingsPopup);
  
  // Setup settings functionality
  setupBucketDistributionSettings(settingsBtn, settingsPopup, scrollableContent, products);
}

function renderBucketDistribution(container, products) {
  container.innerHTML = '';
  
const bucketConfigs = [
  { key: 'PROFITABILITY_BUCKET', title: 'Profitability Buckets' },
  { key: 'FUNNEL_STAGE_BUCKET', title: 'Funnel Stage Analysis' },
  { key: 'INVESTMENT_BUCKET', title: 'Investment Priority' },
  { key: 'CUSTOM_TIER_BUCKET', title: 'Custom Tier Classification' },
  { key: 'SUGGESTIONS_BUCKET', title: 'Action Suggestions' }
];
  
  const distributionGrid = document.createElement('div');
  distributionGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  `;
  
  bucketConfigs.forEach(config => {
    if (window.bucketDistributionPreferences && window.bucketDistributionPreferences[config.key]) {
      const distributionChart = createDistributionChart(products, config.key, config.title);
      distributionGrid.appendChild(distributionChart);
    }
  });
  
  container.appendChild(distributionGrid);
}

function setupBucketDistributionSettings(settingsBtn, settingsPopup, contentContainer, products) {
  settingsBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    
    // Position popup
    const containerRect = contentContainer.getBoundingClientRect();
    settingsPopup.style.position = 'fixed';
    settingsPopup.style.top = containerRect.top + 'px';
    settingsPopup.style.left = (containerRect.left - 280) + 'px';
    
    if (containerRect.left < 300) {
      settingsPopup.style.left = containerRect.left + 'px';
      settingsPopup.style.top = (containerRect.top - 420) + 'px';
    }
    
    settingsPopup.classList.toggle('visible');
    
    // Update popup content
    updateBucketDistributionPopup(products);
  });
  
  // Close popup when clicking outside
  document.addEventListener('click', function(e) {
    if (!settingsPopup.contains(e.target) && !settingsBtn.contains(e.target)) {
      settingsPopup.classList.remove('visible');
    }
  });
}

function updateBucketDistributionPopup(products) {
  const container = document.getElementById('bucketDistributionListContainer');
  if (!container) return;
  
  const bucketConfigs = [
    { key: 'ROAS_Bucket', label: 'ROAS Buckets' },
    { key: 'ROI_Bucket', label: 'ROI Buckets' },
    { key: 'Funnel_Bucket', label: 'Funnel Performance' },
    { key: 'Spend_Bucket', label: 'Spend Buckets' },
    { key: 'Pricing_Bucket', label: 'Pricing Buckets' },
    { key: 'Custom_Tier', label: 'Custom Tiers' },
    { key: 'ML_Cluster', label: 'ML Clusters' }
  ];
  
  let html = '';
  bucketConfigs.forEach(config => {
    const isChecked = window.bucketDistributionPreferences[config.key] || false;
    html += `
      <div class="metric-selector-item">
        <label class="metric-toggle-switch">
          <input type="checkbox" data-bucket="${config.key}" ${isChecked ? 'checked' : ''}>
          <span class="metric-toggle-slider"></span>
        </label>
        <span>${config.label}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Add event listeners
  container.querySelectorAll('input[data-bucket]').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const bucketKey = this.getAttribute('data-bucket');
      window.bucketDistributionPreferences[bucketKey] = this.checked;
      
      // Re-render distribution
      const contentContainer = document.getElementById('bucketDistributionContent');
      if (contentContainer) {
        renderBucketDistribution(contentContainer, products);
      }
    });
  });
}

function renderROASChannelsContainer(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
  // Apply bucket filter if provided
  let filteredData = data;
  const bucketType = window.selectedBucketType || 'ROAS_Bucket';
  if (bucketFilter) {
if (bucketType === 'SUGGESTIONS_BUCKET') {
  filteredData = data.filter(row => {
    if (row[bucketType]) {
      try {
        const suggestions = JSON.parse(row[bucketType]);
        return suggestions.some(s => s.suggestion === bucketFilter);
      } catch (e) {
        return false;
      }
    }
    return false;
  });
} else {
  filteredData = data.filter(row => getBucketValue(row[bucketType]) === bucketFilter);
}
  }
  
  // Create channels table
  const channelsTitle = document.createElement('h3');
  channelsTitle.style.cssText = 'margin: 0 0 15px 0; color: #333; text-align: center;';
  channelsTitle.textContent = bucketFilter ? 
    `Performance by Channel Type (${bucketFilter})` : 
    'Performance by Channel Type';
  container.appendChild(channelsTitle);
  
  const channelsTableContainer = document.createElement('div');
  channelsTableContainer.style.cssText = 'margin-bottom: 30px;';
  container.appendChild(channelsTableContainer);
  
  // *** USE ORIGINAL FUNCTION - JUST CHANGE CALL ***
  renderROASChannelsTable(channelsTableContainer, filteredData, bucketFilter);
  
  // Create campaigns table
  const campaignsTitle = document.createElement('h3');
  campaignsTitle.style.cssText = 'margin: 0 0 15px 0; color: #333; text-align: center;';
  campaignsTitle.textContent = bucketFilter ? 
    `Performance by Campaign (${bucketFilter})` : 
    'Performance by Campaign';
  container.appendChild(campaignsTitle);
  
  const campaignsTableContainer = document.createElement('div');
  container.appendChild(campaignsTableContainer);
  
  // *** USE ORIGINAL FUNCTION - JUST CHANGE CALL ***
  renderROASCampaignsTable(campaignsTableContainer, filteredData, bucketFilter);
}

function renderROASChannelsTableWithDevices(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
  // Get 'All' campaign records for main aggregation
  const allCampaignRecords = data.filter(row => 
  row['Campaign Name'] === 'All' && 
  row['Channel Type'] === 'All' && 
  row.Device === 'All'
);
  
  // Get all records for device segmentation
  const allRecords = data;
  
  // Group by Channel Type for main aggregation
  const channelGroups = {
    'PERFORMANCE_MAX': [],
    'SHOPPING': []
  };
  
  allCampaignRecords.forEach(product => {
    const channel = product['Channel Type'];
    if (channel && channelGroups[channel]) {
      channelGroups[channel].push(product);
    }
  });
  
  // Group by Channel Type and Device for segmentation
  const deviceChannelGroups = {
    'PERFORMANCE_MAX': {},
    'SHOPPING': {}
  };
  
  allRecords.forEach(product => {
    const channel = product['Channel Type'];
    const device = product.Device || 'Unknown';
    
    if (channel && deviceChannelGroups[channel]) {
      if (!deviceChannelGroups[channel][device]) {
        deviceChannelGroups[channel][device] = [];
      }
      deviceChannelGroups[channel][device].push(product);
    }
  });
  
  // Calculate aggregated metrics for each channel (main rows)
  const channelMetrics = Object.entries(channelGroups).map(([channelName, products]) => {
    if (products.length === 0) {
      return {
        channel: channelName,
        count: 0,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        convValue: 0,
        avgCPC: 0,
        cpm: 0,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        aov: 0
      };
    }
    
    const totals = products.reduce((acc, product) => {
      acc.impressions += parseInt(product.Impressions) || 0;
      acc.clicks += parseInt(product.Clicks) || 0;
      acc.cost += parseFloat(product.Cost) || 0;
      acc.conversions += parseFloat(product.Conversions) || 0;
      acc.convValue += parseFloat(product.ConvValue) || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
    
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
    const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
    
    return {
      channel: channelName,
      count: products.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      convValue: totals.convValue,
      avgCPC,
      cpm,
      ctr,
      cvr,
      cpa,
      roas,
      aov
    };
  });
  
  // Calculate device-specific metrics for each channel
  const deviceMetrics = {};
  Object.entries(deviceChannelGroups).forEach(([channelName, devices]) => {
    deviceMetrics[channelName] = {};
    Object.entries(devices).forEach(([device, products]) => {
      const totals = products.reduce((acc, product) => {
        acc.impressions += parseInt(product.Impressions) || 0;
        acc.clicks += parseInt(product.Clicks) || 0;
        acc.cost += parseFloat(product.Cost) || 0;
        acc.conversions += parseFloat(product.Conversions) || 0;
        acc.convValue += parseFloat(product.ConvValue) || 0;
        return acc;
      }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
      
      const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
      const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
      const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
      const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
      
      deviceMetrics[channelName][device] = {
        count: products.length,
        impressions: totals.impressions,
        clicks: totals.clicks,
        cost: totals.cost,
        conversions: totals.conversions,
        convValue: totals.convValue,
        avgCPC,
        cpm,
        ctr,
        cvr,
        cpa,
        roas,
        aov
      };
    });
  });
  
  // Helper function to create regular cell content
  const createRegularCell = (value, isCenter = true) => {
    return `
      <div style="display: flex; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
        <span style="font-weight: 600; font-size: 12px;">${value}</span>
      </div>
    `;
  };

  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    table-layout: fixed;
  `;
  
  // Create header (same as bucket table but with Channel Type)
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">Channel Type</th>
      <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
      <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
      <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
    </tr>
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  
  // Add channel rows with device segmentation
  channelMetrics.forEach(channel => {
    // Main channel row
    const row = document.createElement('tr');
    row.className = 'main-row';
    row.style.cssText = 'cursor: pointer; border-bottom: 1px solid #e0e0e0;';
    
    const roasStyle = channel.roas >= 2 ? 'color: #4CAF50; font-weight: 700;' : 
                      channel.roas >= 1 ? 'color: #FF9800; font-weight: 600;' : 
                      'color: #F44336; font-weight: 600;';
    
    row.innerHTML = `
      <td style="padding: 12px 8px; font-weight: 600; color: #333; vertical-align: middle; background: #ffffff;">${channel.channel}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9; ${roasStyle}">${createRegularCell(channel.roas.toFixed(2) + 'x')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + channel.aov.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + channel.cpa.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + channel.avgCPC.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + channel.cpm.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(channel.ctr.toFixed(2) + '%')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(channel.cvr.toFixed(2) + '%')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(channel.impressions.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(channel.clicks.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(channel.conversions.toFixed(1))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + channel.cost.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + channel.convValue.toLocaleString())}</td>
    `;
    
    tbody.appendChild(row);
    
    // Device rows
    if (deviceMetrics[channel.channel]) {
      const deviceOrder = ['DESKTOP', 'MOBILE', 'TABLET'];
      deviceOrder.forEach(device => {
        if (deviceMetrics[channel.channel][device]) {
          const deviceData = deviceMetrics[channel.channel][device];
          const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
          
          const deviceRow = document.createElement('tr');
          deviceRow.className = 'device-row';
          deviceRow.style.cssText = 'background-color: #f8f9fa; border-left: 3px solid #007aff; font-size: 12px;';
          
          const deviceRoasStyle = deviceData.roas >= 2 ? 'color: #4CAF50; font-weight: 700;' : 
                                  deviceData.roas >= 1 ? 'color: #FF9800; font-weight: 600;' : 
                                  'color: #F44336; font-weight: 600;';
          
          deviceRow.innerHTML = `
            <td style="padding: 8px 8px 8px 40px; font-size: 11px; color: #666; vertical-align: middle;">
              ${deviceIcon} ${device}
            </td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px; ${deviceRoasStyle}">${deviceData.roas.toFixed(2)}x</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.aov.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpa.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.avgCPC.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpm.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.ctr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.cvr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.impressions.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.clicks.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.conversions.toFixed(1)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cost.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.convValue.toLocaleString()}</td>
          `;
          
          tbody.appendChild(deviceRow);
        }
      });
    }
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

// Add this new function for campaigns table with device segmentation
function renderROASCampaignsTableWithDevices(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
// Use device-specific records but exclude Campaign Name = "All"
let validRecords = data.filter(row => 
  row['Campaign Name'] && 
  row['Campaign Name'] !== 'All'
);
  const bucketType = window.selectedBucketType || 'ROAS_Bucket';
  if (bucketFilter) {
    if (bucketType === 'Suggestions') {
      validRecords = validRecords.filter(row => {
        const suggestions = row[bucketType] ? row[bucketType].split(';').map(s => s.trim()) : [];
        return suggestions.includes(bucketFilter);
      });
    } else {
      validRecords = validRecords.filter(row => row[bucketType] === bucketFilter);
    }
  }
  
  // Get unique campaign names
  const uniqueCampaigns = [...new Set(validRecords.map(row => row['Campaign Name']))].filter(Boolean);
  
  // Group by Campaign Name for main aggregation (use only 'All' campaign equivalents or aggregate manually)
  const campaignGroups = {};
  uniqueCampaigns.forEach(campaignName => {
    campaignGroups[campaignName] = validRecords.filter(row => row['Campaign Name'] === campaignName);
  });
  
  // Group by Campaign Name and Device for segmentation
  const deviceCampaignGroups = {};
  uniqueCampaigns.forEach(campaignName => {
    deviceCampaignGroups[campaignName] = {};
    const campaignRecords = validRecords.filter(row => row['Campaign Name'] === campaignName);
    
    campaignRecords.forEach(product => {
      const device = product.Device || 'Unknown';
      if (!deviceCampaignGroups[campaignName][device]) {
        deviceCampaignGroups[campaignName][device] = [];
      }
      deviceCampaignGroups[campaignName][device].push(product);
    });
  });
  
  // Calculate aggregated metrics for each campaign (need to aggregate across devices)
  const campaignMetrics = Object.entries(campaignGroups).map(([campaignName, allRecords]) => {
    // Aggregate across all device records for this campaign
    const totals = allRecords.reduce((acc, product) => {
      acc.impressions += parseInt(product.Impressions) || 0;
      acc.clicks += parseInt(product.Clicks) || 0;
      acc.cost += parseFloat(product.Cost) || 0;
      acc.conversions += parseFloat(product.Conversions) || 0;
      acc.convValue += parseFloat(product.ConvValue) || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
    
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
    const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
    
    return {
      campaign: campaignName,
      count: allRecords.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      convValue: totals.convValue,
      avgCPC,
      cpm,
      ctr,
      cvr,
      cpa,
      roas,
      aov
    };
  });
  
  // Calculate device-specific metrics for each campaign
  const deviceMetrics = {};
  Object.entries(deviceCampaignGroups).forEach(([campaignName, devices]) => {
    deviceMetrics[campaignName] = {};
    Object.entries(devices).forEach(([device, products]) => {
      const totals = products.reduce((acc, product) => {
        acc.impressions += parseInt(product.Impressions) || 0;
        acc.clicks += parseInt(product.Clicks) || 0;
        acc.cost += parseFloat(product.Cost) || 0;
        acc.conversions += parseFloat(product.Conversions) || 0;
        acc.convValue += parseFloat(product.ConvValue) || 0;
        return acc;
      }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
      
      const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
      const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
      const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
      const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
      
      deviceMetrics[campaignName][device] = {
        count: products.length,
        impressions: totals.impressions,
        clicks: totals.clicks,
        cost: totals.cost,
        conversions: totals.conversions,
        convValue: totals.convValue,
        avgCPC,
        cpm,
        ctr,
        cvr,
        cpa,
        roas,
        aov
      };
    });
  });
  
  // Helper function to create regular cell content
  const createRegularCell = (value, isCenter = true) => {
    return `
      <div style="display: flex; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
        <span style="font-weight: 600; font-size: 12px;">${value}</span>
      </div>
    `;
  };

  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    table-layout: fixed;
  `;
  
  // Create header (same as other tables but with Campaign Name)
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">Campaign Name</th>
      <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
      <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
      <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
    </tr>
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  
  // Add campaign rows with device segmentation
  campaignMetrics.forEach(campaign => {
    // Main campaign row
    const row = document.createElement('tr');
    row.className = 'main-row';
    row.style.cssText = 'cursor: pointer; border-bottom: 1px solid #e0e0e0;';
    
    const roasStyle = campaign.roas >= 2 ? 'color: #4CAF50; font-weight: 700;' : 
                      campaign.roas >= 1 ? 'color: #FF9800; font-weight: 600;' : 
                      'color: #F44336; font-weight: 600;';
    
    row.innerHTML = `
      <td style="padding: 12px 8px; font-weight: 600; color: #333; vertical-align: middle; background: #ffffff;">${campaign.campaign}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9; ${roasStyle}">${createRegularCell(campaign.roas.toFixed(2) + 'x')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + campaign.aov.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + campaign.cpa.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + campaign.avgCPC.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + campaign.cpm.toFixed(2))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(campaign.ctr.toFixed(2) + '%')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(campaign.cvr.toFixed(2) + '%')}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(campaign.impressions.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(campaign.clicks.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(campaign.conversions.toFixed(1))}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + campaign.cost.toLocaleString())}</td>
      <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + campaign.convValue.toLocaleString())}</td>
    `;
    
    tbody.appendChild(row);
    
    // Device rows
    if (deviceMetrics[campaign.campaign]) {
      const deviceOrder = ['DESKTOP', 'MOBILE', 'TABLET'];
      deviceOrder.forEach(device => {
        if (deviceMetrics[campaign.campaign][device]) {
          const deviceData = deviceMetrics[campaign.campaign][device];
          const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
          
          const deviceRow = document.createElement('tr');
          deviceRow.className = 'device-row';
          deviceRow.style.cssText = 'background-color: #f8f9fa; border-left: 3px solid #007aff; font-size: 12px;';
          
          const deviceRoasStyle = deviceData.roas >= 2 ? 'color: #4CAF50; font-weight: 700;' : 
                                  deviceData.roas >= 1 ? 'color: #FF9800; font-weight: 600;' : 
                                  'color: #F44336; font-weight: 600;';
          
          deviceRow.innerHTML = `
            <td style="padding: 8px 8px 8px 40px; font-size: 11px; color: #666; vertical-align: middle;">
              ${deviceIcon} ${device}
            </td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px; ${deviceRoasStyle}">${deviceData.roas.toFixed(2)}x</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.aov.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpa.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.avgCPC.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpm.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.ctr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.cvr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.impressions.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.clicks.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.conversions.toFixed(1)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cost.toLocaleString()}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.convValue.toLocaleString()}</td>
          `;
          
          tbody.appendChild(deviceRow);
        }
      });
    }
  });
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderROASCampaignsTable(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
// Exclude records where Campaign Name = "All", include all others
// Apply bucket filter if provided
let validRecords = data.filter(row => row['Campaign Name'] && row['Campaign Name'] !== 'All');
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
if (bucketFilter) {
  if (bucketType === 'Suggestions') {
    filteredData = filteredData.filter(row => {
      const suggestions = row[bucketType] ? row[bucketType].split(';').map(s => s.trim()) : [];
      return suggestions.includes(bucketFilter);
    });
  } else {
    filteredData = filteredData.filter(row => row[bucketType] === bucketFilter);
  }
}
  
  // Get all unique campaign names
  const uniqueCampaigns = [...new Set(validRecords.map(row => row['Campaign Name']))].filter(Boolean);
  
  // Group by Campaign Name
  const campaignGroups = {};
  uniqueCampaigns.forEach(campaignName => {
    campaignGroups[campaignName] = [];
  });
  
  validRecords.forEach(product => {
    const campaign = product['Campaign Name'];
    if (campaign && campaignGroups[campaign]) {
      campaignGroups[campaign].push(product);
    }
  });
  
  // Temporary debug logging
  console.log('[DEBUG CAMPAIGNS] Total unique campaigns:', uniqueCampaigns.length);
  console.log('[DEBUG CAMPAIGNS] Campaign names:', uniqueCampaigns);
  console.log('[DEBUG CAMPAIGNS] Total valid records:', validRecords.length);
  
  // Calculate aggregated metrics for each campaign
  const campaignMetrics = Object.entries(campaignGroups).map(([campaignName, products]) => {
    if (products.length === 0) {
      return {
        campaign: campaignName,
        count: 0,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        convValue: 0,
        avgCPC: 0,
        cpm: 0,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        aov: 0
      };
    }
    
    const totals = products.reduce((acc, product) => {
      acc.impressions += parseInt(product.Impressions) || 0;
      acc.clicks += parseInt(product.Clicks) || 0;
      acc.cost += parseFloat(product.Cost) || 0;
      acc.conversions += parseFloat(product.Conversions) || 0;
      acc.convValue += parseFloat(product.ConvValue) || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
    
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
    const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
    
    return {
      campaign: campaignName,
      count: products.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      convValue: totals.convValue,
      avgCPC,
      cpm,
      ctr,
      cvr,
      cpa,
      roas,
      aov
    };
  });
  
  // Sort by cost descending to show highest spending campaigns first
  campaignMetrics.sort((a, b) => b.cost - a.cost);
  
  // Calculate totals for percentage bars
  const grandTotals = campaignMetrics.reduce((acc, campaign) => {
    acc.impressions += campaign.impressions;
    acc.clicks += campaign.clicks;
    acc.cost += campaign.cost;
    acc.conversions += campaign.conversions;
    acc.convValue += campaign.convValue;
    return acc;
  }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
  
  // Helper function to create bar cell (stacked vertically)
  const createBarCell = (value, total, formatValue, campaignColor) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;">
        <span style="font-weight: 600; font-size: 12px; text-align: center;">${formatValue(value)}</span>
        <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
          <div style="flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; min-width: 30px;">
            <div style="height: 100%; background: ${campaignColor}; width: ${percentage}%; border-radius: 4px;"></div>
          </div>
          <span style="font-size: 9px; color: #666; min-width: 28px; text-align: right;">${percentage.toFixed(1)}%</span>
        </div>
      </div>
    `;
  };
  
  // Helper function for regular cells (with proper alignment)
  const createRegularCell = (value, isCenter = true) => {
    return `
      <div style="display: flex; align-items: center; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
        <span style="font-weight: 600; font-size: 12px;">${value}</span>
      </div>
    `;
  };

  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    table-layout: fixed;
  `;
  
  // Create header (same as other tables but with Campaign Name)
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">Campaign Name</th>
      <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
      <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
      <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
    </tr>
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
    </tr>
  `;
  
  // Create body
  const tbody = document.createElement('tbody');
  
  // Generate colors for campaigns (cycling through a palette)
  const campaignColors = [
    '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', 
    '#00BCD4', '#8BC34A', '#FFC107', '#795548', '#607D8B'
  ];
  
  campaignMetrics.forEach((campaign, index) => {
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid #f0f0f0; height: 60px;';
    
    const campaignColor = campaignColors[index % campaignColors.length];
    
    row.innerHTML = `
      <td style="padding: 8px; font-weight: 600; color: ${campaignColor}; vertical-align: middle; background: #ffffff; font-size: 11px;">${campaign.campaign}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(campaign.roas.toFixed(2) + 'x')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + campaign.aov.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + campaign.cpa.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(campaign.ctr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(campaign.cvr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + campaign.avgCPC.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + campaign.cpm.toFixed(2))}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(campaign.impressions, grandTotals.impressions, (v) => v.toLocaleString(), campaignColor)}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(campaign.clicks, grandTotals.clicks, (v) => v.toLocaleString(), campaignColor)}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(campaign.conversions, grandTotals.conversions, (v) => v.toFixed(1), campaignColor)}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(campaign.cost, grandTotals.cost, (v) => '$' + v.toLocaleString(), campaignColor)}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(campaign.convValue, grandTotals.convValue, (v) => '$' + v.toLocaleString(), campaignColor)}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add summary row
  const summaryRow = document.createElement('tr');
  summaryRow.style.cssText = 'border-top: 2px solid #dee2e6; background: #f8f9fa; font-weight: 600;';
  
  // Calculate summary metrics
  const summary = {
    totalProducts: campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0),
    avgROAS: grandTotals.cost > 0 ? grandTotals.convValue / grandTotals.cost : 0,
    avgAOV: campaignMetrics.reduce((sum, campaign) => sum + (campaign.aov * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    avgCPA: campaignMetrics.reduce((sum, campaign) => sum + (campaign.cpa * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    avgCTR: campaignMetrics.reduce((sum, campaign) => sum + (campaign.ctr * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    avgCVR: campaignMetrics.reduce((sum, campaign) => sum + (campaign.cvr * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    avgCPC: campaignMetrics.reduce((sum, campaign) => sum + (campaign.avgCPC * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    avgCPM: campaignMetrics.reduce((sum, campaign) => sum + (campaign.cpm * campaign.count), 0) / campaignMetrics.reduce((sum, campaign) => sum + campaign.count, 0) || 0,
    totalImpressions: grandTotals.impressions,
    totalClicks: grandTotals.clicks,
    totalConversions: grandTotals.conversions,
    totalCost: grandTotals.cost,
    totalConvValue: grandTotals.convValue
  };
  
  summaryRow.innerHTML = `
    <td style="padding: 12px 8px; font-weight: 700; color: #333; vertical-align: middle; background: #ffffff;">TOTAL / AVERAGE</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgROAS.toFixed(2) + 'x')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgAOV.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPA.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(summary.avgCTR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgCVR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgCPC.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPM.toFixed(2))}</td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalImpressions.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalClicks.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalConversions.toFixed(1)}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalCost.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalConvValue.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
  `;
  
  tbody.appendChild(summaryRow);
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderROASChannelsTable(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
// Use Campaign="All" records and exclude Channel Type = "All"
let validRecords = data.filter(row => 
  row['Campaign Name'] === 'All' &&
  row['Channel Type'] && 
  row['Channel Type'] !== 'All'
);
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
if (bucketFilter) {
  if (bucketType === 'Suggestions') {
    filteredData = filteredData.filter(row => {
      const suggestions = row[bucketType] ? row[bucketType].split(';').map(s => s.trim()) : [];
      return suggestions.includes(bucketFilter);
    });
  } else {
    filteredData = filteredData.filter(row => row[bucketType] === bucketFilter);
  }
}
  
  // Group by Channel Type
  const channelGroups = {
    'PERFORMANCE_MAX': [],
    'SHOPPING': []
  };
  
  validRecords.forEach(product => {
    const channel = product['Channel Type'];
    if (channel && channelGroups[channel]) {
      channelGroups[channel].push(product);
    }
  });

    // Temporary debug logging
  console.log('[DEBUG] Total valid records:', validRecords.length);
  console.log('[DEBUG] PERFORMANCE_MAX products:', channelGroups['PERFORMANCE_MAX'].length);
  console.log('[DEBUG] SHOPPING products:', channelGroups['SHOPPING'].length);
  console.log('[DEBUG] Sample PERFORMANCE_MAX record:', channelGroups['PERFORMANCE_MAX'][0]);
  console.log('[DEBUG] Sample SHOPPING record:', channelGroups['SHOPPING'][0]);
  
  // Calculate aggregated metrics for each channel
  const channelMetrics = Object.entries(channelGroups).map(([channelName, products]) => {
    if (products.length === 0) {
      return {
        channel: channelName,
        count: 0,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        convValue: 0,
        avgCPC: 0,
        cpm: 0,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        aov: 0
      };
    }
    
    const totals = products.reduce((acc, product) => {
      acc.impressions += parseInt(product.Impressions) || 0;
      acc.clicks += parseInt(product.Clicks) || 0;
      acc.cost += parseFloat(product.Cost) || 0;
      acc.conversions += parseFloat(product.Conversions) || 0;
      acc.convValue += parseFloat(product.ConvValue) || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
    
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
    const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
    
    return {
      channel: channelName,
      count: products.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      convValue: totals.convValue,
      avgCPC,
      cpm,
      ctr,
      cvr,
      cpa,
      roas,
      aov
    };
  });
  
  // Calculate totals for percentage bars
  const grandTotals = channelMetrics.reduce((acc, channel) => {
    acc.impressions += channel.impressions;
    acc.clicks += channel.clicks;
    acc.cost += channel.cost;
    acc.conversions += channel.conversions;
    acc.convValue += channel.convValue;
    return acc;
  }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
  
  // Helper function to create bar cell (stacked vertically)
  const createBarCell = (value, total, formatValue, channelColor) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;">
        <span style="font-weight: 600; font-size: 12px; text-align: center;">${formatValue(value)}</span>
        <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
          <div style="flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; min-width: 30px;">
            <div style="height: 100%; background: ${channelColor}; width: ${percentage}%; border-radius: 4px;"></div>
          </div>
          <span style="font-size: 9px; color: #666; min-width: 28px; text-align: right;">${percentage.toFixed(1)}%</span>
        </div>
      </div>
    `;
  };
  
  // Helper function for regular cells (with proper alignment)
  const createRegularCell = (value, isCenter = true) => {
    return `
      <div style="display: flex; align-items: center; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
        <span style="font-weight: 600; font-size: 12px;">${value}</span>
      </div>
    `;
  };

  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    table-layout: fixed;
  `;
  
  // Create header (same as bucket table but with Channel Type)
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">Channel Type</th>
      <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
      <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
      <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
    </tr>
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
    </tr>
  `;
  
  // Create body
  const tbody = document.createElement('tbody');
  
  const channelColors = {
    'PERFORMANCE_MAX': '#4CAF50',
    'SHOPPING': '#2196F3'
  };
  
  channelMetrics.forEach(channel => {
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid #f0f0f0; height: 60px;';
    
    row.innerHTML = `
      <td style="padding: 8px; font-weight: 600; color: ${channelColors[channel.channel]}; vertical-align: middle; background: #ffffff;">${channel.channel}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(channel.roas.toFixed(2) + 'x')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + channel.aov.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + channel.cpa.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(channel.ctr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(channel.cvr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + channel.avgCPC.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + channel.cpm.toFixed(2))}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(channel.impressions, grandTotals.impressions, (v) => v.toLocaleString(), channelColors[channel.channel])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(channel.clicks, grandTotals.clicks, (v) => v.toLocaleString(), channelColors[channel.channel])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(channel.conversions, grandTotals.conversions, (v) => v.toFixed(1), channelColors[channel.channel])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(channel.cost, grandTotals.cost, (v) => '$' + v.toLocaleString(), channelColors[channel.channel])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(channel.convValue, grandTotals.convValue, (v) => '$' + v.toLocaleString(), channelColors[channel.channel])}</td>
    `;
    
    tbody.appendChild(row);
  });
  
  // Add summary row
  const summaryRow = document.createElement('tr');
  summaryRow.style.cssText = 'border-top: 2px solid #dee2e6; background: #f8f9fa; font-weight: 600;';
  
  // Calculate summary metrics
  const summary = {
    totalProducts: channelMetrics.reduce((sum, channel) => sum + channel.count, 0),
    avgROAS: grandTotals.cost > 0 ? grandTotals.convValue / grandTotals.cost : 0,
    avgAOV: channelMetrics.reduce((sum, channel) => sum + (channel.aov * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    avgCPA: channelMetrics.reduce((sum, channel) => sum + (channel.cpa * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    avgCTR: channelMetrics.reduce((sum, channel) => sum + (channel.ctr * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    avgCVR: channelMetrics.reduce((sum, channel) => sum + (channel.cvr * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    avgCPC: channelMetrics.reduce((sum, channel) => sum + (channel.avgCPC * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    avgCPM: channelMetrics.reduce((sum, channel) => sum + (channel.cpm * channel.count), 0) / channelMetrics.reduce((sum, channel) => sum + channel.count, 0) || 0,
    totalImpressions: grandTotals.impressions,
    totalClicks: grandTotals.clicks,
    totalConversions: grandTotals.conversions,
    totalCost: grandTotals.cost,
    totalConvValue: grandTotals.convValue
  };
  
  summaryRow.innerHTML = `
    <td style="padding: 12px 8px; font-weight: 700; color: #333; vertical-align: middle; background: #ffffff;">TOTAL / AVERAGE</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgROAS.toFixed(2) + 'x')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgAOV.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPA.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(summary.avgCTR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgCVR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgCPC.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPM.toFixed(2))}</td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalImpressions.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalClicks.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalConversions.toFixed(1)}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalCost.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalConvValue.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
  `;
  
  tbody.appendChild(summaryRow);
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
}

function calculateAggregatedMetrics(products) {
  const totals = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    convValue: 0
  };
  
  const averages = {
    roas: 0,
    aov: 0,
    ctr: 0,
    cvr: 0,
    cpa: 0
  };
  
  let validCount = 0;
  
  products.forEach(product => {
    totals.impressions += parseInt(product.Impressions) || 0;
    totals.clicks += parseInt(product.Clicks) || 0;
    totals.cost += parseFloat(product.Cost) || 0;
    totals.conversions += parseFloat(product.Conversions) || 0;
    totals.convValue += parseFloat(product.ConvValue) || 0;
    
    averages.roas += parseFloat(product.ROAS) || 0;
    averages.aov += parseFloat(product.AOV) || 0;
    averages.ctr += parseFloat(product.CTR) || 0;
    averages.cvr += parseFloat(product.CVR) || 0;
    averages.cpa += parseFloat(product.CPA) || 0;
    
    validCount++;
  });
  
  return {
    totalImpressions: totals.impressions,
    totalClicks: totals.clicks,
    totalCost: totals.cost,
    totalConversions: totals.conversions,
    totalConvValue: totals.convValue,
    avgROAS: validCount > 0 ? averages.roas / validCount : 0,
    avgAOV: validCount > 0 ? averages.aov / validCount : 0,
    avgCTR: validCount > 0 ? averages.ctr / validCount : 0,
    avgCVR: validCount > 0 ? averages.cvr / validCount : 0,
    avgCPA: validCount > 0 ? averages.cpa / validCount : 0
  };
}

function createDistributionChart(products, field, title) {
  const container = document.createElement('div');
  container.style.cssText = `
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: relative;
  `;
  
  const titleEl = document.createElement('h5');
  titleEl.style.cssText = 'margin: 0 0 15px 0; color: #333; font-size: 14px; text-align: center;';
  titleEl.textContent = title;
  container.appendChild(titleEl);
  
  // Count occurrences with proper error handling
  const counts = {};
  products.forEach(product => {
    const value = (product && product[field]) ? product[field] : 'Unknown';
    counts[value] = (counts[value] || 0) + 1;
  });
  
  const total = products.length;
  const chartContainer = document.createElement('div');
  
  // Check if we have any data
  if (Object.keys(counts).length === 0) {
    chartContainer.innerHTML = '<div style="text-align: center; color: #999; padding: 20px;">No data available</div>';
    container.appendChild(chartContainer);
    return container;
  }
  
// Create tooltip element - append to body for proper positioning
const tooltip = document.createElement('div');
tooltip.style.cssText = `
  position: fixed;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 12px 15px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.4;
  max-width: 300px;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 10000;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.2);
`;
document.body.appendChild(tooltip);
  
  // Create simple bar chart with hover functionality
  Object.entries(counts).forEach(([label, count]) => {
    const percentage = total > 0 ? (count / total * 100).toFixed(1) : 0;
    
    const barContainer = document.createElement('div');
    barContainer.style.cssText = `
      margin-bottom: 8px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: background-color 0.2s ease;
    `;
    
    // Add hover effects
    barContainer.addEventListener('mouseenter', function() {
      this.style.backgroundColor = 'rgba(0, 122, 255, 0.05)';
    });
    
    barContainer.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });
    
    const labelEl = document.createElement('div');
    labelEl.style.cssText = 'font-size: 11px; color: #666; margin-bottom: 2px;';
    labelEl.textContent = `${label} (${count})`;
    
    const barWrapper = document.createElement('div');
    barWrapper.style.cssText = `
      background: #f0f0f0;
      border-radius: 3px;
      height: 12px;
      position: relative;
    `;
    
    const bar = document.createElement('div');
    bar.style.cssText = `
      background: #007aff;
      height: 100%;
      width: ${percentage}%;
      border-radius: 3px;
      position: relative;
    `;
    
    const percentLabel = document.createElement('span');
    percentLabel.style.cssText = `
      position: absolute;
      right: 4px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 10px;
      color: white;
      font-weight: 600;
    `;
    percentLabel.textContent = `${percentage}%`;
    
    bar.appendChild(percentLabel);
    barWrapper.appendChild(bar);
    barContainer.appendChild(labelEl);
    barContainer.appendChild(barWrapper);
    
    // Add tooltip functionality
    barContainer.addEventListener('mouseenter', function(e) {
      const description = getBucketDescription(field, label);
      if (description) {
        tooltip.innerHTML = `<strong>${label}</strong><br><br>${description}`;
        tooltip.style.opacity = '1';
      }
    });
    
barContainer.addEventListener('mousemove', function(e) {
  // Use viewport coordinates for fixed positioning
  let left = e.clientX + 15;
  let top = e.clientY - 10;
  
  // Get viewport dimensions
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  
  // Get tooltip dimensions (estimate if not visible)
  const tooltipWidth = tooltip.offsetWidth || 300; // fallback to max-width
  const tooltipHeight = tooltip.offsetHeight || 100; // estimated height
  
  // Adjust horizontal position if tooltip would go outside viewport
  if (left + tooltipWidth > viewportWidth) {
    left = e.clientX - tooltipWidth - 15;
  }
  
  // Adjust vertical position if tooltip would go outside viewport
  if (top + tooltipHeight > viewportHeight) {
    top = e.clientY - tooltipHeight - 10;
  }
  
  // Ensure tooltip doesn't go above or left of viewport
  if (left < 10) left = 10;
  if (top < 10) top = 10;
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
});
    
    barContainer.addEventListener('mouseleave', function() {
      tooltip.style.opacity = '0';
    });
    
chartContainer.appendChild(barContainer);
  });
  
  container.appendChild(chartContainer);
  
  // Store tooltip reference for cleanup
  container.tooltip = tooltip;
  
  // Add cleanup when container is removed
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.removedNodes.forEach(function(node) {
        if (node === container && tooltip.parentNode) {
          document.body.removeChild(tooltip);
          observer.disconnect();
        }
      });
    });
  });
  
  observer.observe(document.body, { childList: true, subtree: true });
  
  return container;
}

function getBucketDescription(bucketType, bucketValue) {
  if (window.bucketDescriptions && window.bucketDescriptions[bucketType]) {
    return window.bucketDescriptions[bucketType][bucketValue] || null;
  }
  return null;
}

async function renderROASHistoricCharts(container, data) {
  // Clear container
  container.innerHTML = '';
  
  // Create main wrapper that contains everything
  const mainWrapper = document.createElement('div');
  mainWrapper.style.cssText = 'display: flex; flex-direction: column; height: 100%; gap: 15px;';
  
  // Load product performance data instead of bucket data
  const accountPrefix = window.currentAccount || 'acc1';
  const performanceTableName = `${accountPrefix}_googleSheets_productPerformance`;
  
  let performanceData;
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(performanceTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.error('[renderROASHistoricCharts] No performance data found');
      return;
    }
    
    performanceData = result.data;
  } catch (error) {
    console.error('[renderROASHistoricCharts] Error loading performance data:', error);
    return;
  }
  
// Use bucket date range selector value
const today = new Date();
const daysBack = window.selectedBucketDateRangeDays || 30;
console.log(`[renderROASHistoricCharts] Using ${daysBack} days for charts`);
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (daysBack - 1));
  const prevStartDate = new Date(today);
  prevStartDate.setDate(prevStartDate.getDate() - (daysBack * 2 - 1));
  const prevEndDate = new Date(today);
  prevEndDate.setDate(prevEndDate.getDate() - daysBack);
  
  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,%]/g, '')) || 0;
  };

  // Filter data for current and previous periods
  const currentPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= startDate && rowDate <= today;
  });
  
  const previousPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= prevStartDate && rowDate <= prevEndDate;
  });
  
  // Calculate current totals from all devices
  const currentTotals = currentPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  // Calculate previous totals
  const prevTotals = previousPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  // Calculate metrics
  const currentROAS = currentTotals.cost > 0 ? currentTotals.convValue / currentTotals.cost : 0;
  const prevROAS = prevTotals.cost > 0 ? prevTotals.convValue / prevTotals.cost : 0;
  
  const currentAOV = currentTotals.conversions > 0 ? currentTotals.convValue / currentTotals.conversions : 0;
  const prevAOV = prevTotals.conversions > 0 ? prevTotals.convValue / prevTotals.conversions : 0;
  
  const currentCPA = currentTotals.conversions > 0 ? currentTotals.cost / currentTotals.conversions : 0;
  const prevCPA = prevTotals.conversions > 0 ? prevTotals.cost / prevTotals.conversions : 0;

  // Calculate device-specific metrics
  const deviceMetrics = {
    DESKTOP: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    MOBILE: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    TABLET: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 }
  };

  const devicePrevMetrics = {
    DESKTOP: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    MOBILE: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    TABLET: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 }
  };

  // Aggregate current period by device
  currentPeriodData.forEach(row => {
    const device = row.Device;
    if (device && deviceMetrics[device]) {
      deviceMetrics[device].cost += parseNumber(row.Cost);
      deviceMetrics[device].convValue += parseNumber(row['Conversion Value']);
      deviceMetrics[device].impressions += parseInt(row.Impressions) || 0;
      deviceMetrics[device].conversions += parseNumber(row.Conversions);
      deviceMetrics[device].clicks += parseInt(row.Clicks) || 0;
    }
  });
  
  // Aggregate previous period by device
  previousPeriodData.forEach(row => {
    const device = row.Device;
    if (device && devicePrevMetrics[device]) {
      devicePrevMetrics[device].cost += parseNumber(row.Cost);
      devicePrevMetrics[device].convValue += parseNumber(row['Conversion Value']);
      devicePrevMetrics[device].impressions += parseInt(row.Impressions) || 0;
      devicePrevMetrics[device].conversions += parseNumber(row.Conversions);
      devicePrevMetrics[device].clicks += parseInt(row.Clicks) || 0;
    }
  });

  // Calculate device-specific derived metrics
  Object.keys(deviceMetrics).forEach(device => {
    const current = deviceMetrics[device];
    const prev = devicePrevMetrics[device];
    
    current.roas = current.cost > 0 ? current.convValue / current.cost : 0;
    current.aov = current.conversions > 0 ? current.convValue / current.conversions : 0;
    current.cpa = current.conversions > 0 ? current.cost / current.conversions : 0;
    
    prev.roas = prev.cost > 0 ? prev.convValue / prev.cost : 0;
    prev.aov = prev.conversions > 0 ? prev.convValue / prev.conversions : 0;
    prev.cpa = prev.conversions > 0 ? prev.cost / prev.conversions : 0;
  });
  
  // Helper function to create metric item
  const createMetricItem = (label, current, previous, format) => {
    const change = current - previous;
    const trendClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
    const trendArrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';
    
    let formattedCurrent, formattedChange;
    switch (format) {
      case 'currency':
        formattedCurrent = '$' + current.toLocaleString();
        formattedChange = '$' + Math.abs(change).toLocaleString();
        break;
      case 'number':
        formattedCurrent = current.toLocaleString();
        formattedChange = Math.abs(change).toLocaleString();
        break;
      case 'decimal':
        formattedCurrent = current.toFixed(2) + 'x';
        formattedChange = Math.abs(change).toFixed(2) + 'x';
        break;
      default:
        formattedCurrent = current.toFixed(2);
        formattedChange = Math.abs(change).toFixed(2);
    }
    
    return `
      <div style="text-align: center; flex: 1;">
        <div style="font-size: 11px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase;">${label}</div>
        <div style="font-size: 20px; font-weight: 700; color: #333; margin-bottom: 2px;">${formattedCurrent}</div>
        <div class="${trendClass}" style="font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 3px;">
          <span>${trendArrow}</span>
          <span>${formattedChange}</span>
        </div>
      </div>
    `;
  };
  
  // Create metrics container with main and device rows
  const metricsContainer = document.createElement('div');
  metricsContainer.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 15px;
  `;

  // Main metrics row
  const metricsRow = document.createElement('div');
  metricsRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #dee2e6;
    margin-bottom: 12px;
  `;
  
  metricsRow.innerHTML = `
    ${createMetricItem('ROAS', currentROAS, prevROAS, 'decimal')}
    ${createMetricItem('AOV', currentAOV, prevAOV, 'currency')}
    ${createMetricItem('CPA', currentCPA, prevCPA, 'currency')}
    ${createMetricItem('Impressions', currentTotals.impressions, prevTotals.impressions, 'number')}
    ${createMetricItem('Cost', currentTotals.cost, prevTotals.cost, 'currency')}
    ${createMetricItem('Revenue', currentTotals.convValue, prevTotals.convValue, 'currency')}
  `;

  metricsContainer.appendChild(metricsRow);

  // Add device rows
  const deviceRows = document.createElement('div');
  deviceRows.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  ['DESKTOP', 'MOBILE', 'TABLET'].forEach(device => {
    const deviceRow = document.createElement('div');
    deviceRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      padding: 8px 15px;
    `;
    
    const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
    const current = deviceMetrics[device];
    const prev = devicePrevMetrics[device];
    
    // Create smaller metric items
    const createSmallMetricItem = (value, prevValue, format) => {
      const change = value - prevValue;
      const trendClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
      const trendArrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';
      
      let formattedValue;
      switch (format) {
        case 'currency':
          formattedValue = '$' + value.toLocaleString();
          break;
        case 'number':
          formattedValue = value.toLocaleString();
          break;
        case 'decimal':
          formattedValue = value.toFixed(2) + 'x';
          break;
        default:
          formattedValue = value.toFixed(2);
      }
      
      return `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: #333;">${formattedValue}</div>
          <div class="${trendClass}" style="font-size: 9px; font-weight: 500; margin-top: 2px;">
            ${trendArrow} ${Math.abs(change).toFixed(format === 'currency' ? 0 : format === 'decimal' ? 2 : 0)}
          </div>
        </div>
      `;
    };
    
    deviceRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; min-width: 100px;">
        <span style="font-size: 16px;">${deviceIcon}</span>
        <span style="font-size: 11px; font-weight: 600; color: #666;">${device}</span>
      </div>
      ${createSmallMetricItem(current.roas, prev.roas, 'decimal')}
      ${createSmallMetricItem(current.aov, prev.aov, 'currency')}
      ${createSmallMetricItem(current.cpa, prev.cpa, 'currency')}
      ${createSmallMetricItem(current.impressions, prev.impressions, 'number')}
      ${createSmallMetricItem(current.cost, prev.cost, 'currency')}
      ${createSmallMetricItem(current.convValue, prev.convValue, 'currency')}
    `;
    
    deviceRows.appendChild(deviceRow);
  });

  metricsContainer.appendChild(deviceRows);
  
  // Create chart wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: relative;
  `;
  
  // Create right side toggle panel
  const togglePanel = document.createElement('div');
  togglePanel.style.cssText = `
    width: 140px;
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  togglePanel.innerHTML = `
    <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #333;">Chart Metrics</h4>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="roas" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #4CAF50;">ROAS</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="aov" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #2196F3;">AOV</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="cpa" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #FF9800;">CPA</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="ctr" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #9C27B0;">CTR %</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="cvr" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #00BCD4;">CVR %</span>
      </label>
    </div>
  `;
  
  // Create a horizontal wrapper for chart and toggle panel
  const chartAndToggleWrapper = document.createElement('div');
  chartAndToggleWrapper.style.cssText = 'display: flex; gap: 15px; flex: 1;';
  
  // Now append elements in the correct order
  chartAndToggleWrapper.appendChild(wrapper);
  chartAndToggleWrapper.appendChild(togglePanel);
  
  // Store active metrics
  window.activeChartMetrics = {
    roas: true,
    aov: true,
    cpa: true,
    ctr: true,
    cvr: true
  };
  
  // Process daily metrics data from performance data
  const dailyMetrics = {};
  
  // Initialize date map for selected period
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMetrics[dateStr] = {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      convValue: 0,
      roas: 0,
      aov: 0,
      cpa: 0,
      ctr: 0,
      cvr: 0
    };
  }
  
  // Aggregate metrics by date
  currentPeriodData.forEach(row => {
    const dateStr = row.Date;
    if (dateStr && dailyMetrics[dateStr]) {
      dailyMetrics[dateStr].impressions += parseInt(row.Impressions) || 0;
      dailyMetrics[dateStr].clicks += parseInt(row.Clicks) || 0;
      dailyMetrics[dateStr].cost += parseNumber(row.Cost);
      dailyMetrics[dateStr].conversions += parseNumber(row.Conversions);
      dailyMetrics[dateStr].convValue += parseNumber(row['Conversion Value']);
    }
  });
  
  // Calculate derived metrics for each day
  Object.keys(dailyMetrics).forEach(date => {
    const day = dailyMetrics[date];
    day.roas = day.cost > 0 ? day.convValue / day.cost : 0;
    day.aov = day.conversions > 0 ? day.convValue / day.conversions : 0;
    day.cpa = day.conversions > 0 ? day.cost / day.conversions : 0;
    day.ctr = day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0;
    day.cvr = day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0;
  });
  
  // Convert to arrays for Chart.js
  const dates = Object.keys(dailyMetrics).sort();
  
  // Create datasets for each metric
  const allDatasets = {
    roas: {
      label: 'ROAS',
      data: dates.map(date => dailyMetrics[date].roas),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      yAxisID: 'y-roas',
      tension: 0.4
    },
    aov: {
      label: 'AOV',
      data: dates.map(date => dailyMetrics[date].aov),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      yAxisID: 'y-currency',
      tension: 0.4
    },
    cpa: {
      label: 'CPA',
      data: dates.map(date => dailyMetrics[date].cpa),
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      yAxisID: 'y-currency',
      tension: 0.4
    },
    ctr: {
      label: 'CTR %',
      data: dates.map(date => dailyMetrics[date].ctr),
      borderColor: '#9C27B0',
      backgroundColor: 'rgba(156, 39, 176, 0.1)',
      yAxisID: 'y-percentage',
      tension: 0.4
    },
    cvr: {
      label: 'CVR %',
      data: dates.map(date => dailyMetrics[date].cvr),
      borderColor: '#00BCD4',
      backgroundColor: 'rgba(0, 188, 212, 0.1)',
      yAxisID: 'y-percentage',
      tension: 0.4
    }
  };

  // Filter datasets based on active metrics
  const datasets = Object.entries(window.activeChartMetrics || {})
    .filter(([key, active]) => active)
    .map(([key]) => allDatasets[key])
    .filter(Boolean);

  // Create chart
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width: 100%; height: 100%;';
  wrapper.appendChild(canvas);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      }),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          }
        },
        'y-roas': {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'ROAS'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        'y-currency': {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Currency ($)'
          },
          grid: {
            drawOnChartArea: true
          }
        },
        'y-percentage': {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `Key Metrics Trend - Last ${daysBack} Days`
        },
        legend: {
          display: false  // Remove legend as requested
        },
        datalabels: {
          display: false
        }
      }
    }
  });
  
  // Append elements to main wrapper in correct order
  mainWrapper.appendChild(metricsContainer);
  mainWrapper.appendChild(chartAndToggleWrapper);
  
  // Finally append main wrapper to container
  container.appendChild(mainWrapper);
  
  // Add toggle event listeners
  togglePanel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const metric = this.getAttribute('data-metric');
      window.activeChartMetrics[metric] = this.checked;
      
      // Update chart with new dataset visibility
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        const datasetIndex = ['roas', 'aov', 'cpa', 'ctr', 'cvr'].indexOf(metric);
        if (datasetIndex !== -1 && chartInstance.data.datasets[datasetIndex]) {
          chartInstance.data.datasets[datasetIndex].hidden = !this.checked;
          chartInstance.update();
        }
      }
    });
  });
  
  // Store reference to refresh the chart
  window.refreshROASChart = async () => {
    await renderROASHistoricCharts(container, data);
  };
}

function renderROASMetricsTable(container, data) {
  container.innerHTML = '';
  
  // Filter for "All" campaign records only to get the main aggregated data
  const allCampaignRecords = data.filter(row => 
  row['Campaign Name'] === 'All' && 
  row['Channel Type'] === 'All' && 
  row.Device === 'All'
);
  
// Get Campaign="All" records only for device segmentation
const allRecords = data.filter(row => row['Campaign Name'] === 'All');
  
  const bucketType = window.selectedBucketType || 'ROAS_Bucket';
  
  // Group products by bucket for main aggregation (using 'All' campaign records)
  const bucketGroups = {};
  
// Initialize bucket groups based on bucket type using direct fields
if (bucketType === 'SUGGESTIONS_BUCKET') {
  const allSuggestions = new Set();
  allCampaignRecords.forEach(row => {
    if (row.SUGGESTIONS_BUCKET) {
      try {
        const suggestions = JSON.parse(row.SUGGESTIONS_BUCKET);
        suggestions.forEach(suggestionObj => {
          allSuggestions.add(suggestionObj.suggestion);
        });
      } catch (e) {
        console.error('Error parsing suggestions:', e);
      }
    }
  });
  allSuggestions.forEach(suggestion => {
    bucketGroups[suggestion] = [];
  });
} else {
  const allBuckets = new Set();
  allCampaignRecords.forEach(row => {
    const bucketValue = getBucketValue(row[bucketType]);
    if (bucketValue) {
      allBuckets.add(bucketValue);
    }
  });
  allBuckets.forEach(bucket => {
    bucketGroups[bucket] = [];
  });
}
  
// Group allCampaignRecords by bucket using direct fields
allCampaignRecords.forEach(product => {
  if (bucketType === 'SUGGESTIONS_BUCKET') {
    if (product.SUGGESTIONS_BUCKET) {
      try {
        const suggestions = JSON.parse(product.SUGGESTIONS_BUCKET);
        suggestions.forEach(suggestionObj => {
          if (bucketGroups[suggestionObj.suggestion]) {
            bucketGroups[suggestionObj.suggestion].push(product);
          }
        });
      } catch (e) {
        console.error('Error parsing suggestions:', e);
      }
    }
} else {
  const bucketValue = getBucketValue(product[bucketType]);
  if (bucketValue && bucketGroups[bucketValue]) {
    bucketGroups[bucketValue].push(product);
  }
}
});
  
  // Create device aggregation data for segmentation
  const deviceBucketGroups = {};
  
  // Group Campaign="All" records by bucket and device
  allRecords.forEach(product => {
    const device = product.Device || 'Unknown';
    
    if (bucketType === 'Suggestions') {
      const suggestions = product[bucketType] ? product[bucketType].split(';').map(s => s.trim()) : [];
      suggestions.forEach(suggestion => {
        if (!deviceBucketGroups[suggestion]) {
          deviceBucketGroups[suggestion] = {};
        }
        if (!deviceBucketGroups[suggestion][device]) {
          deviceBucketGroups[suggestion][device] = [];
        }
        deviceBucketGroups[suggestion][device].push(product);
      });
    } else {
      const bucket = getBucketValue(product[bucketType]);
      if (bucket) {
        if (!deviceBucketGroups[bucket]) {
          deviceBucketGroups[bucket] = {};
        }
        if (!deviceBucketGroups[bucket][device]) {
          deviceBucketGroups[bucket][device] = [];
        }
        deviceBucketGroups[bucket][device].push(product);
      }
    }
  });
  
  // Calculate aggregated metrics for each bucket (main rows)
  const bucketMetrics = Object.entries(bucketGroups).map(([bucketName, products]) => {
    if (products.length === 0) {
      return {
        bucket: bucketName,
        count: 0,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        convValue: 0,
        avgCPC: 0,
        cpm: 0,
        ctr: 0,
        cvr: 0,
        cpa: 0,
        roas: 0,
        aov: 0
      };
    }
    
    const totals = products.reduce((acc, product) => {
      acc.impressions += parseInt(product.Impressions) || 0;
      acc.clicks += parseInt(product.Clicks) || 0;
      acc.cost += parseFloat(product.Cost) || 0;
      acc.conversions += parseFloat(product.Conversions) || 0;
      acc.convValue += parseFloat(product.ConvValue) || 0;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
    
    const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
    const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
    const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
    const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
    const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
    const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
    
    return {
      bucket: bucketName,
      count: products.length,
      impressions: totals.impressions,
      clicks: totals.clicks,
      cost: totals.cost,
      conversions: totals.conversions,
      convValue: totals.convValue,
      avgCPC,
      cpm,
      ctr,
      cvr,
      cpa,
      roas,
      aov
    };
  });
  
  // Calculate device-specific metrics for each bucket
  const deviceMetrics = {};
  Object.entries(deviceBucketGroups).forEach(([bucketName, devices]) => {
    deviceMetrics[bucketName] = {};
    Object.entries(devices).forEach(([device, products]) => {
      const totals = products.reduce((acc, product) => {
        acc.impressions += parseInt(product.Impressions) || 0;
        acc.clicks += parseInt(product.Clicks) || 0;
        acc.cost += parseFloat(product.Cost) || 0;
        acc.conversions += parseFloat(product.Conversions) || 0;
        acc.convValue += parseFloat(product.ConvValue) || 0;
        return acc;
      }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
      
      const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
      const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
      const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
      const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;
      
      deviceMetrics[bucketName][device] = {
        count: products.length,
        impressions: totals.impressions,
        clicks: totals.clicks,
        cost: totals.cost,
        conversions: totals.conversions,
        convValue: totals.convValue,
        avgCPC,
        cpm,
        ctr,
        cvr,
        cpa,
        roas,
        aov
      };
    });
  });
  
  // Calculate totals for percentage bars
  const grandTotals = bucketMetrics.reduce((acc, bucket) => {
    acc.impressions += bucket.impressions;
    acc.clicks += bucket.clicks;
    acc.cost += bucket.cost;
    acc.conversions += bucket.conversions;
    acc.convValue += bucket.convValue;
    return acc;
  }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });
  
  // Create table
  const table = document.createElement('table');
  table.style.cssText = `
    width: 100%;
    border-collapse: collapse;
    font-size: 12px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    table-layout: fixed;
  `;
  
  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr style="background: #f8f9fa;">
      <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">ROAS Bucket</th>
      <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
      <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
      <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
    </tr>
    <tr style="background: #f8f9fa;">
      <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
      <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
    </tr>
  `;
  
  const tbody = document.createElement('tbody');
  
  // Use configuration colors
  const bucketConfig = window.bucketConfig[bucketType];
  const bucketColors = {};

  // Sort buckets by configuration order (best first)
  if (bucketType === 'Suggestions') {
    // For Suggestions, sort by predefined order but allow for dynamic buckets
    bucketMetrics.sort((a, b) => {
      const orderA = bucketConfig.order.indexOf(a.bucket);
      const orderB = bucketConfig.order.indexOf(b.bucket);
      // If both are in order, use that
      if (orderA !== -1 && orderB !== -1) return orderA - orderB;
      // If only one is in order, it comes first
      if (orderA !== -1) return -1;
      if (orderB !== -1) return 1;
      // Otherwise, alphabetical
      return a.bucket.localeCompare(b.bucket);
    });
  } else {
    bucketMetrics.sort((a, b) => {
      const orderA = bucketConfig.order.indexOf(a.bucket);
      const orderB = bucketConfig.order.indexOf(b.bucket);
      return orderA - orderB;
    });
  }

  bucketMetrics.forEach(bucket => {
    bucketColors[bucket.bucket] = bucketConfig.colors[bucket.bucket] || '#999';
  });
  
  // Helper function to create bar cell (stacked vertically)
  const createBarCell = (value, total, formatValue, bucketColor) => {
    const percentage = total > 0 ? (value / total) * 100 : 0;
    return `
      <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;">
        <span style="font-weight: 600; font-size: 12px; text-align: center;">${formatValue(value)}</span>
        <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
          <div style="flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; min-width: 30px;">
            <div style="height: 100%; background: ${bucketColor}; width: ${percentage}%; border-radius: 4px;"></div>
          </div>
          <span style="font-size: 9px; color: #666; min-width: 28px; text-align: right;">${percentage.toFixed(1)}%</span>
        </div>
      </div>
    `;
  };
  
  // Helper function for regular cells (with proper alignment)
  const createRegularCell = (value, isCenter = true) => {
    return `
      <div style="display: flex; align-items: center; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
        <span style="font-weight: 600; font-size: 12px;">${value}</span>
      </div>
    `;
  };

bucketMetrics.forEach(bucket => {
  // Main bucket row
  const row = document.createElement('tr');
  row.className = 'main-row';
  row.style.cssText = 'border-bottom: 1px solid #f0f0f0; height: 60px; cursor: pointer;';
  
  // Get the explanation for this bucket
  const bucketExplanation = (() => {
    // Find the original bucket data with explanation
    const sampleProduct = bucketGroups[bucket.bucket]?.[0];
    if (sampleProduct) {
      return getBucketExplanation(sampleProduct[bucketType]);
    }
    return '';
  })();
  
  // Create cell content with tooltip
  let bucketCellContent = bucket.bucket;
  if (bucketExplanation) {
    const escapedExplanation = bucketExplanation.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    bucketCellContent = `${bucket.bucket} <span title="${escapedExplanation}" style="cursor: help; opacity: 0.7; font-size: 12px;">ℹ️</span>`;
  }
    
    row.innerHTML = `
      <td style="padding: 8px; font-weight: 600; color: ${bucketColors[bucket.bucket]}; vertical-align: middle; background: #ffffff;">${bucket.bucket}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(bucket.roas.toFixed(2) + 'x')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + bucket.aov.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + bucket.cpa.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(bucket.ctr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(bucket.cvr.toFixed(2) + '%')}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + bucket.avgCPC.toFixed(2))}</td>
      <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + bucket.cpm.toFixed(2))}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(bucket.impressions, grandTotals.impressions, (v) => v.toLocaleString(), bucketColors[bucket.bucket])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(bucket.clicks, grandTotals.clicks, (v) => v.toLocaleString(), bucketColors[bucket.bucket])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(bucket.conversions, grandTotals.conversions, (v) => v.toFixed(1), bucketColors[bucket.bucket])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(bucket.cost, grandTotals.cost, (v) => '$' + v.toLocaleString(), bucketColors[bucket.bucket])}</td>
      <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(bucket.convValue, grandTotals.convValue, (v) => '$' + v.toLocaleString(), bucketColors[bucket.bucket])}</td>
    `;
    
    tbody.appendChild(row);
    
    // Device rows
    if (deviceMetrics[bucket.bucket]) {
      const deviceOrder = ['DESKTOP', 'MOBILE', 'TABLET'];
      deviceOrder.forEach(device => {
        if (deviceMetrics[bucket.bucket][device]) {
          const deviceData = deviceMetrics[bucket.bucket][device];
          const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
          
          const deviceRow = document.createElement('tr');
          deviceRow.className = 'device-row';
          deviceRow.style.cssText = 'background-color: #f8f9fa; border-left: 3px solid #007aff; font-size: 12px; height: 50px;';
          
          deviceRow.innerHTML = `
            <td style="padding: 8px 8px 8px 40px; font-size: 11px; color: #666; vertical-align: middle;">
              ${deviceIcon} ${device}
            </td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.roas.toFixed(2)}x</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.aov.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpa.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.ctr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.cvr.toFixed(2)}%</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.avgCPC.toFixed(2)}</td>
            <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cpm.toFixed(2)}</td>
            <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.impressions.toLocaleString()}</td>
            <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">${deviceData.clicks.toLocaleString()}</td>
            <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">${deviceData.conversions.toFixed(1)}</td>
            <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9; font-size: 11px;">$${deviceData.cost.toLocaleString()}</td>
            <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff; font-size: 11px;">$${deviceData.convValue.toLocaleString()}</td>
          `;
          
          tbody.appendChild(deviceRow);
        }
      });
    }
  });
  
  // Add summary row
  const summaryRow = document.createElement('tr');
  summaryRow.style.cssText = 'border-top: 2px solid #dee2e6; background: #f8f9fa; font-weight: 600;';
  
  // Calculate summary metrics
  const summary = {
    totalProducts: bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0),
    avgROAS: grandTotals.cost > 0 ? grandTotals.convValue / grandTotals.cost : 0,  // Use aggregate ROAS calculation
    avgAOV: bucketMetrics.reduce((sum, bucket) => sum + (bucket.aov * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    avgCPA: bucketMetrics.reduce((sum, bucket) => sum + (bucket.cpa * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    avgCTR: bucketMetrics.reduce((sum, bucket) => sum + (bucket.ctr * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    avgCVR: bucketMetrics.reduce((sum, bucket) => sum + (bucket.cvr * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    avgCPC: bucketMetrics.reduce((sum, bucket) => sum + (bucket.avgCPC * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    avgCPM: bucketMetrics.reduce((sum, bucket) => sum + (bucket.cpm * bucket.count), 0) / bucketMetrics.reduce((sum, bucket) => sum + bucket.count, 0) || 0,
    totalImpressions: grandTotals.impressions,
    totalClicks: grandTotals.clicks,
    totalConversions: grandTotals.conversions,
    totalCost: grandTotals.cost,
    totalConvValue: grandTotals.convValue
  };
  
  summaryRow.innerHTML = `
    <td style="padding: 12px 8px; font-weight: 700; color: #333; vertical-align: middle; background: #ffffff;">TOTAL / AVERAGE</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgROAS.toFixed(2) + 'x')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgAOV.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPA.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(summary.avgCTR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(summary.avgCVR.toFixed(2) + '%')}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + summary.avgCPC.toFixed(2))}</td>
    <td style="padding: 12px 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + summary.avgCPM.toFixed(2))}</td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalImpressions.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalClicks.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalConversions.toFixed(1)}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalCost.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #ffffff;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalConvValue.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
  `;
  
  tbody.appendChild(summaryRow);
  
  table.appendChild(thead);
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Add device row styling if not already added
  if (!document.getElementById('roas-device-row-styles')) {
    const style = document.createElement('style');
    style.id = 'roas-device-row-styles';
    style.textContent = `
      .device-row:hover {
        background-color: #e9ecef !important;
      }
      .main-row:hover {
        background-color: #f0f0f0;
      }
    `;
    document.head.appendChild(style);
  }
}

function renderSuggestionsMetricsTable(container, data) {
  container.innerHTML = '';
  
// Define suggestion categories
  const suggestionCategories = {
    'Budget & Scaling': [
      'Pause & Reallocate Budget',
      'Scale Aggressively', 
      'Scale Moderately',
      'Scale Cautiously',
      'Test Budget Increase',
      'Reduce Budget'
    ],
    'Trend Analysis': [
      'Monitor Declining ROAS',
      'Address CTR Decline',
      'Investigate Traffic Drop',
      'Capitalize on Momentum',
      'Stabilize Volatility'
    ],
    'Bidding & Ranking': [
      'Increase Visibility First',
      'Increase Bids for Ranking',
      'Test Higher Positions', 
      'Optimize Bid Strategy'
    ],
    'Creative & Messaging': [
      'Fix Ad Creative (Low CTR)',
      'Test New Title',
      'Refresh Creative Assets',
      'Highlight Value Proposition'
    ],
    'Landing & Conversion': [
      'Optimize Landing/Offer (Low CVR)',
      'Improve Product Page',
      'Add Trust Signals',
      'Simplify Checkout'
    ],
    'Targeting & Efficiency': [
      'Refine Targeting & Efficiency',
      'Broaden Audience',
      'Narrow Targeting',
      'Test New Segments'
    ],
    'Product & Pricing': [
      'Test Price Reduction',
      'Consider Bundling',
      'Add Promotions'
    ]
  };

  // Filter for "All" campaign records only
 const allCampaignRecords = data.filter(row => 
  row['Campaign Name'] === 'All' && 
  row['Channel Type'] === 'All' && 
  row.Device === 'All'
);
  
// Get all unique suggestions from the data using direct field
const allSuggestions = new Set();
allCampaignRecords.forEach(row => {
  if (row.SUGGESTIONS_BUCKET) {
    try {
      const suggestions = JSON.parse(row.SUGGESTIONS_BUCKET);
      suggestions.forEach(suggestionObj => {
        allSuggestions.add(suggestionObj.suggestion);
      });
    } catch (e) {
      console.error('Error parsing suggestions:', e);
    }
  }
});

  // Group suggestions by category
  const groupedSuggestions = {};
  const uncategorizedSuggestions = [];

  Object.entries(suggestionCategories).forEach(([categoryName, suggestions]) => {
    groupedSuggestions[categoryName] = [];
    suggestions.forEach(suggestion => {
      if (allSuggestions.has(suggestion)) {
        groupedSuggestions[categoryName].push(suggestion);
      }
    });
  });

  // Find uncategorized suggestions
  allSuggestions.forEach(suggestion => {
    let found = false;
    Object.values(suggestionCategories).forEach(categorySuggestions => {
      if (categorySuggestions.includes(suggestion)) {
        found = true;
      }
    });
    if (!found) {
      uncategorizedSuggestions.push(suggestion);
    }
  });

  // Create main table container
  const tableContainer = document.createElement('div');
  tableContainer.style.cssText = 'display: flex; flex-direction: column; gap: 30px;';

  // Process each category
  Object.entries(groupedSuggestions).forEach(([categoryName, suggestions]) => {
    if (suggestions.length === 0) return;

    // Calculate metrics for suggestions in this category
    const categoryMetrics = suggestions.map(suggestion => {
const bucketProducts = allCampaignRecords.filter(row => {
  if (row.SUGGESTIONS_BUCKET) {
    try {
      const suggestions = JSON.parse(row.SUGGESTIONS_BUCKET);
      return suggestions.some(suggestionObj => suggestionObj.suggestion === suggestion);
    } catch (e) {
      console.error('Error parsing suggestions:', e);
      return false;
    }
  }
  return false;
});

      if (bucketProducts.length === 0) {
        return {
          bucket: suggestion,
          count: 0,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          convValue: 0,
          avgCPC: 0,
          cpm: 0,
          ctr: 0,
          cvr: 0,
          cpa: 0,
          roas: 0,
          aov: 0
        };
      }

      const totals = bucketProducts.reduce((acc, product) => {
        acc.impressions += parseInt(product.Impressions) || 0;
        acc.clicks += parseInt(product.Clicks) || 0;
        acc.cost += parseFloat(product.Cost) || 0;
        acc.conversions += parseFloat(product.Conversions) || 0;
        acc.convValue += parseFloat(product.ConvValue) || 0;
        return acc;
      }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });

      const avgCPC = totals.clicks > 0 ? totals.cost / totals.clicks : 0;
      const cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
      const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
      const cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0;
      const cpa = totals.conversions > 0 ? totals.cost / totals.conversions : 0;
      const roas = totals.cost > 0 ? totals.convValue / totals.cost : 0;
      const aov = totals.conversions > 0 ? totals.convValue / totals.conversions : 0;

      return {
        bucket: suggestion,
        count: bucketProducts.length,
        impressions: totals.impressions,
        clicks: totals.clicks,
        cost: totals.cost,
        conversions: totals.conversions,
        convValue: totals.convValue,
        avgCPC,
        cpm,
        ctr,
        cvr,
        cpa,
        roas,
        aov
      };
    });

    // Calculate category totals for percentage bars
    const categoryTotals = categoryMetrics.reduce((acc, metric) => {
      acc.impressions += metric.impressions;
      acc.clicks += metric.clicks;
      acc.cost += metric.cost;
      acc.conversions += metric.conversions;
      acc.convValue += metric.convValue;
      return acc;
    }, { impressions: 0, clicks: 0, cost: 0, conversions: 0, convValue: 0 });

    // Create category section
    const categorySection = document.createElement('div');
    categorySection.style.cssText = 'background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);';

    // Category header
    const categoryHeader = document.createElement('div');
    categoryHeader.style.cssText = `
      background: linear-gradient(135deg, #f8f9fa, #e9ecef);
      padding: 15px 20px;
      border-bottom: 2px solid #dee2e6;
      font-weight: 700;
      font-size: 16px;
      color: #333;
      text-align: center;
    `;
    categoryHeader.textContent = categoryName;
    categorySection.appendChild(categoryHeader);

    // Create table for this category (same structure as original)
    const table = document.createElement('table');
    table.style.cssText = `
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
      table-layout: fixed;
    `;

    // Create header (same as original)
    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr style="background: #f8f9fa;">
        <th style="padding: 12px 8px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; width: 140px; background: #ffffff;">Suggestion</th>
        <th colspan="3" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e8f5e8; color: #2e7d32;">Performance Metrics</th>
        <th colspan="4" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #e3f2fd; color: #1565c0;">Engagement Metrics</th>
        <th colspan="5" style="padding: 12px 8px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6; background: #fff3e0; color: #ef6c00;">Volume Metrics</th>
      </tr>
      <tr style="background: #f8f9fa;">
        <th style="padding: 8px; text-align: left; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; background: #ffffff;"></th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">ROAS</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #ffffff;">AOV</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #2e7d32; background: #f9f9f9;">CPA</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">CTR</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CVR</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #ffffff;">Avg CPC</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #1565c0; background: #f9f9f9;">CPM</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Impressions</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Clicks</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conversions</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #f9f9f9;">Cost</th>
        <th style="padding: 8px; text-align: center; font-size: 10px; font-weight: 500; border-bottom: 1px solid #dee2e6; color: #ef6c00; background: #ffffff;">Conv Value</th>
      </tr>
    `;

    // Create body with suggestion rows
    const tbody = document.createElement('tbody');

    // Helper functions (same as original)
    const createBarCell = (value, total, formatValue, suggestionColor) => {
      const percentage = total > 0 ? (value / total) * 100 : 0;
      return `
        <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 4px 0;">
          <span style="font-weight: 600; font-size: 12px; text-align: center;">${formatValue(value)}</span>
          <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
            <div style="flex: 1; height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; min-width: 30px;">
              <div style="height: 100%; background: ${suggestionColor}; width: ${percentage}%; border-radius: 4px;"></div>
            </div>
            <span style="font-size: 9px; color: #666; min-width: 28px; text-align: right;">${percentage.toFixed(1)}%</span>
          </div>
        </div>
      `;
    };

    const createRegularCell = (value, isCenter = true) => {
      return `
        <div style="display: flex; align-items: center; justify-content: ${isCenter ? 'center' : 'flex-start'}; height: 100%; min-height: 40px;">
          <span style="font-weight: 600; font-size: 12px;">${value}</span>
        </div>
      `;
    };

    // Get suggestion colors from configuration
    const bucketConfig = window.bucketConfig['Suggestions'];

    categoryMetrics.forEach(metric => {
      const row = document.createElement('tr');
      row.style.cssText = 'border-bottom: 1px solid #f0f0f0; height: 60px;';

      const suggestionColor = bucketConfig.colors[metric.bucket] || '#999';

      row.innerHTML = `
        <td style="padding: 8px; font-weight: 600; color: ${suggestionColor}; vertical-align: middle; background: #ffffff; font-size: 11px;">${metric.bucket}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(metric.roas.toFixed(2) + 'x')}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + metric.aov.toFixed(2))}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + metric.cpa.toFixed(2))}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell(metric.ctr.toFixed(2) + '%')}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell(metric.cvr.toFixed(2) + '%')}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #ffffff;">${createRegularCell('$' + metric.avgCPC.toFixed(2))}</td>
        <td style="padding: 8px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createRegularCell('$' + metric.cpm.toFixed(2))}</td>
        <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(metric.impressions, categoryTotals.impressions, (v) => v.toLocaleString(), suggestionColor)}</td>
        <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(metric.clicks, categoryTotals.clicks, (v) => v.toLocaleString(), suggestionColor)}</td>
        <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(metric.conversions, categoryTotals.conversions, (v) => v.toFixed(1), suggestionColor)}</td>
        <td style="padding: 6px; text-align: center; vertical-align: middle; background: #f9f9f9;">${createBarCell(metric.cost, categoryTotals.cost, (v) => '$' + v.toLocaleString(), suggestionColor)}</td>
        <td style="padding: 6px; text-align: center; vertical-align: middle; background: #ffffff;">${createBarCell(metric.convValue, categoryTotals.convValue, (v) => '$' + v.toLocaleString(), suggestionColor)}</td>
      `;

      tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    categorySection.appendChild(table);
    tableContainer.appendChild(categorySection);
  });

  // Add uncategorized suggestions if any
  if (uncategorizedSuggestions.length > 0) {
    // Similar logic for uncategorized suggestions...
    console.log('Uncategorized suggestions found:', uncategorizedSuggestions);
  }

  container.appendChild(tableContainer);
}

function addBucketTooltip(element, bucketName, bucketType) {
  const tooltip = document.createElement('div');
  tooltip.style.cssText = `
    position: fixed;
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 12px 15px;
    border-radius: 6px;
    font-size: 12px;
    line-height: 1.4;
    max-width: 300px;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    border: 1px solid rgba(255,255,255,0.2);
  `;
  document.body.appendChild(tooltip);
  
  const description = getBucketDescription(bucketType, bucketName);
  
  if (description) {
    tooltip.innerHTML = `<strong>${bucketName}</strong><br><br>${description}`;
    
    element.addEventListener('mouseenter', function(e) {
      tooltip.style.opacity = '1';
    });
    
    element.addEventListener('mousemove', function(e) {
      let left = e.clientX + 15;
      let top = e.clientY - 10;
      
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const tooltipWidth = tooltip.offsetWidth || 300;
      const tooltipHeight = tooltip.offsetHeight || 100;
      
      if (left + tooltipWidth > viewportWidth) {
        left = e.clientX - tooltipWidth - 15;
      }
      
      if (top + tooltipHeight > viewportHeight) {
        top = e.clientY - tooltipHeight - 10;
      }
      
      if (left < 10) left = 10;
      if (top < 10) top = 10;
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
    });
    
    element.addEventListener('mouseleave', function() {
      tooltip.style.opacity = '0';
    });
  }
}

// Listen for date range changes
document.addEventListener('DOMContentLoaded', function() {
  const dateRangeSelector = document.getElementById('productInfoDateRange');
  if (dateRangeSelector) {
    dateRangeSelector.addEventListener('change', async function() {
      console.log('[ROAS Buckets] Date range changed, refreshing...');
      // Refresh the entire ROAS buckets view which includes the charts
      if (window.refreshROASBucketsView) {
        await window.refreshROASBucketsView();
      }
    });
  }
});

// Add this at the very end of the file
if (!document.getElementById('bucket-date-selector-styles')) {
  const style = document.createElement('style');
  style.id = 'bucket-date-selector-styles';
  style.textContent = `
    .bucket-date-option:hover {
      background-color: #f1f3f4 !important;
    }
    .bucket-date-selector-top > div:hover {
      box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
      border-color: #b8bcc0 !important;
    }
  `;
  document.head.appendChild(style);
}
