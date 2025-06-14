// Initialize bucket-related global variables
window.selectedBucketType = window.selectedBucketType || 'ROAS_Bucket';
window.bucketDistributionPreferences = window.bucketDistributionPreferences || {
  'Funnel_Bucket': true,
  'ML_Cluster': true,
  'Spend_Bucket': true,
  'Custom_Tier': true,
  'ROAS_Bucket': false,
  'ROI_Bucket': false,
  'Pricing_Bucket': false
};

// Comprehensive bucket configuration with colors and order
window.bucketConfig = {
  'ROAS_Bucket': {
    order: ['Top Performers', 'Efficient Low Volume', 'Volume Driver, Low ROI', 'Underperformers'],
    colors: {
      'Top Performers': '#4CAF50',           // Green - Best
      'Efficient Low Volume': '#2196F3',     // Blue - Good but needs scale
      'Volume Driver, Low ROI': '#FF9800',   // Orange - Moderate
      'Underperformers': '#F44336'           // Red - Worst
    }
  },
  'ROI_Bucket': {
    order: ['Scalable Winners', 'Niche but Profitable', 'Price Issue', 'Waste of Spend'],
    colors: {
      'Scalable Winners': '#4CAF50',         // Green - Best
      'Niche but Profitable': '#2196F3',     // Blue - Good but limited
      'Price Issue': '#FF9800',              // Orange - Moderate issue
      'Waste of Spend': '#F44336'            // Red - Worst
    }
  },
  'Funnel_Bucket': {
    order: ['Funnel Champions', 'Most Efficient', 'UX Optimization Needed', 'Ad Creative Problem', 
            'Valuable but Costly', 'Weak Landing Page or Offer', 'Poor Targeting', 
            'Needs Better Ad Creative', 'Funnel Friction'],
    colors: {
      'Funnel Champions': '#4CAF50',              // Green - Best
      'Most Efficient': '#66BB6A',                // Light Green - Excellent
      'UX Optimization Needed': '#42A5F5',        // Light Blue - Moderate good
      'Ad Creative Problem': '#2196F3',           // Blue - Moderate good
      'Valuable but Costly': '#9C27B0',           // Purple - Moderate
      'Weak Landing Page or Offer': '#FF9800',   // Orange - Moderate bad
      'Poor Targeting': '#FF7043',                // Dark Orange - Bad
      'Needs Better Ad Creative': '#EF5350',      // Light Red - Bad
      'Funnel Friction': '#F44336'                // Red - Worst
    }
  },
  'Spend_Bucket': {
    order: ['Hidden Gems', 'Scalable with Caution', 'Low Priority', 'Unprofitable Spend', 'Zombies', 'Parasites'],
    colors: {
      'Hidden Gems': '#4CAF50',             // Green - Best
      'Scalable with Caution': '#66BB6A',   // Light Green - Good
      'Low Priority': '#9E9E9E',            // Gray - Neutral
      'Unprofitable Spend': '#FF9800',      // Orange - Bad
      'Zombies': '#D32F2F',                 // Dark Red - Very bad
      'Parasites': '#F44336'                // Red - Worst
    }
  },
  'Pricing_Bucket': {
    order: ['Premium Product with Strong Demand', 'Low-Ticket Impulse Buys', 'Price Resistance', 'Low Value No Interest'],
    colors: {
      'Premium Product with Strong Demand': '#4CAF50',  // Green - Best
      'Low-Ticket Impulse Buys': '#66BB6A',            // Light Green - Good
      'Price Resistance': '#FF9800',                    // Orange - Moderate
      'Low Value No Interest': '#F44336'                // Red - Worst
    }
  },
  'Custom_Tier': {
    order: ['Hero Product', 'Scale-Up', 'Budget Booster', 'Creative Review', 'Testing Product', 'Wasted Spend'],
    colors: {
      'Hero Product': '#FFD700',            // Gold - Best
      'Scale-Up': '#4CAF50',               // Green - Excellent
      'Budget Booster': '#66BB6A',         // Light Green - Good
      'Creative Review': '#2196F3',         // Blue - Moderate
      'Testing Product': '#9E9E9E',         // Gray - Neutral
      'Wasted Spend': '#F44336'            // Red - Worst
    }
  },
  'ML_Cluster': {
    order: ['Undervalued Winners', 'High ROAS Anomalies', 'Optimizable', 'Drop-Off Cluster', 'Expensive Waste'],
    colors: {
      'Undervalued Winners': '#4CAF50',     // Green - Best
      'High ROAS Anomalies': '#9C27B0',     // Purple - Special/Good
      'Optimizable': '#2196F3',             // Blue - Neutral
      'Drop-Off Cluster': '#FF9800',        // Orange - Moderate bad
      'Expensive Waste': '#F44336'          // Red - Worst
    }
  }
};

// Function to initialize bucket switcher buttons
function initializeBucketSwitcher() {
  const bucketButtons = {
    'bucketROAS': 'ROAS_Bucket',
    'bucketROI': 'ROI_Bucket', 
    'bucketFunnel': 'Funnel_Bucket',
    'bucketSpend': 'Spend_Bucket',
    'bucketPricing': 'Pricing_Bucket',
    'bucketCustom': 'Custom_Tier',
    'bucketML': 'ML_Cluster'
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
        
        // Re-render the buckets view with the new bucket type
        loadAndRenderROASBuckets();
      });
    }
  });
}

// Export the initialization function
if (typeof window !== 'undefined') {
  window.initializeBucketSwitcher = initializeBucketSwitcher;
}

window.selectedBucketType = 'ROAS_Bucket';
window.bucketDescriptions = {
  // ROAS Bucket descriptions
  'ROAS_Bucket': {
    'Top Performers': 'Products that generate high revenue from advertising while also converting at a high rate. These are your most profitable products and should be prioritized for increased ad spend, new creative testing, and expansion into additional audiences or platforms.',
    'Efficient Low Volume': 'These products deliver a strong return on ad spend but with a low number of conversions. It suggests the product is well-targeted but not reaching enough people. Consider testing broader or new audiences and increasing impressions while maintaining efficiency.',
    'Volume Driver, Low ROI': 'Products that drive a high number of conversions, but at the cost of low profitability (low ROAS). These can be important for customer acquisition but may not be sustainable unless their margin improves or lifetime value justifies continued spend.',
    'Underperformers': 'Low ROAS and low conversions — these products are likely not aligned with audience demand or are poorly positioned. Immediate action should be taken: pause, test new creative, adjust targeting, or rethink their presence in paid media.'
  },
  
  // ROI Bucket descriptions
  'ROI_Bucket': {
    'Scalable Winners': 'These products achieve both high return on ad spend and low acquisition costs. They are efficient and profitable — the ideal candidates for scaling aggressively, whether through higher budgets or replicating their strategy across other products.',
    'Niche but Profitable': 'High ROAS but also high CPA. These products may appeal to a smaller segment but generate strong returns when they convert. Scale cautiously, focusing on fine-tuned targeting and maintaining profitability.',
    'Price Issue': 'Products that are cheap to acquire (low CPA) but don\'t generate enough return (low ROAS). These may require price adjustments or better upselling to improve average order value and profitability.',
    'Waste of Spend': 'High CPA and low ROAS — you are spending a lot without seeing returns. These products may not be viable for paid advertising unless significant improvements are made in targeting, creative, or pricing.'
  },
  
  // Funnel Bucket descriptions
  'Funnel_Bucket': {
    'Needs Better Ad Creative': 'When impressions are high but clicks are low, your ads are being shown, but they\'re not compelling users to act. Focus on improving headlines, visuals, or offers to increase engagement.',
    'Poor Targeting': 'A high number of clicks but a low click-through rate suggests you\'re reaching too many users who aren\'t interested. Narrow or adjust your audience targeting to improve relevance.',
    'Weak Landing Page or Offer': 'If users are clicking but not converting, the issue is likely with your landing page experience, messaging, offer clarity, or purchase process. Rework your page structure and test new offers or CTAs.',
    'Most Efficient': 'High conversion rate and low cost per acquisition — this is the ideal outcome of a high-performing ad funnel. These products are great for scaling or using as a benchmark for other campaigns.',
    'Valuable but Costly': 'High conversions and high CPA mean the product is desirable, but expensive to sell. Consider increasing the product price, improving margins, or testing new audiences to reduce CPA.',
    'UX Optimization Needed': 'High CTR but low CVR indicates the ad is effective, but users don\'t complete the purchase. Likely caused by poor mobile experience, confusing navigation, or trust issues. Improve page usability and conversion flow.',
    'Ad Creative Problem': 'Low CTR but high CVR points to an ineffective ad creative. While the landing page works, not enough people are enticed to click. Refresh the creative and test different value propositions.',
    'Funnel Friction': 'Both CTR and CVR are low. This means the product, ad, and page are not aligned with audience needs or expectations. Comprehensive repositioning is recommended.',
    'Funnel Champions': 'Products that succeed at every stage: high CTR and high CVR. These should serve as templates for new products or campaigns. Expand budget and test additional variations to scale.'
  },
  
  // Spend Bucket descriptions
  'Spend_Bucket': {
    'Unprofitable Spend': 'Spending a lot but not generating enough return. These products are draining your budget and require immediate review or removal from active campaigns.',
    'Hidden Gems': 'Low spend but strong revenue — a high-efficiency, underutilized product. Increase budget and scale cautiously, ensuring efficiency is preserved as volume grows.',
    'Scalable with Caution': 'High cost matched by strong performance. These products can drive growth but require careful management to avoid inefficiencies at scale.',
    'Low Priority': 'Low investment and low return. These products are not significant contributors and should be deprioritized unless further testing reveals hidden potential.',
    'Zombies': 'These have almost no impressions — they\'re not receiving enough exposure. Either increase bids, check for disapprovals, or rework to improve eligibility and reach.',
    'Parasites': 'High ad spend with zero conversions. These are extremely inefficient and should be paused immediately or re-evaluated from a creative and targeting perspective.'
  },
  
  // Pricing Bucket descriptions
  'Pricing_Bucket': {
    'Premium Product with Strong Demand': 'These products command a high price yet convert efficiently. Strong market demand justifies their price point. Ideal for profit-focused growth strategies.',
    'Low-Ticket Impulse Buys': 'Low price and high conversion rate — perfect for volume strategies or entry-level products that feed a broader customer funnel or upsell flow.',
    'Price Resistance': 'High price but low conversions. The value isn\'t clear to customers at the listed price. Consider price testing, bundling, or improved value communication.',
    'Low Value No Interest': 'Low price and low conversion — customers still don\'t want it. Likely a product-market fit issue. Reconsider the product\'s positioning or remove it from active advertising.'
  },
  
  // Custom Tier descriptions
  'Custom_Tier': {
    'Hero Product': 'Top 10% of performers. They consistently deliver the best results and should be heavily promoted and protected. Anchor your campaigns around these.',
    'Scale-Up': 'Products with high conversion rates and low CPA — ideal for growth. Double down with additional creative, audience testing, and budget scaling.',
    'Wasted Spend': 'Underperforming products with significant investment but no returns. These should be paused or completely reworked.',
    'Testing Product': 'Products that haven\'t yet generated enough data to make a decision. Allow them to run with low spend until more conclusive performance data is available.',
    'Creative Review': 'CTR is strong, so the ad is engaging — but low CVR indicates the page or offer is underwhelming. The issue is after the click. Focus on improving post-click experience.',
    'Budget Booster': 'These convert well at very low cost. They are perfect to scale or use as fillers in campaigns with strict CPA goals.'
  },
  
  // ML Cluster descriptions
  'ML_Cluster': {
    'Undervalued Winners': 'Products with low cost per click and high conversion value — often overlooked due to low initial spend. Increase focus, as these may be hidden gems.',
    'Expensive Waste': 'High CPC and zero conversions — clear sign of inefficiency. Likely misaligned audience or poor ad creative. Should be paused or reworked.',
    'Optimizable': 'Products with average metrics — showing potential but not yet optimized. Consider A/B testing creatives or targeting to lift performance.',
    'High ROAS Anomalies': 'Very high ROAS with low click volume. These could be gold mines if volume can be increased — test higher bids, creatives, or broader targeting to grow reach.',
    'Drop-Off Cluster': 'Products that perform well at the awareness or interest stage (e.g., high CTR), but drop off before conversion. Investigate the mid-funnel: checkout flow, trust elements, mobile UX.'
  }
};

async function loadAndRenderROASBuckets() {
  const bucketsContainer = document.getElementById('roas_buckets');
  const chartsContainer = document.getElementById('roas_charts');
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
    const tableName = `${accountPrefix}_googleSheets_productBuckets_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    // Check if projectData store exists
    if (!db.objectStoreNames.contains('projectData')) {
      console.error('[loadAndRenderROASBuckets] projectData store not found');
      throw new Error('projectData store not found');
    }
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.error('[loadAndRenderROASBuckets] No data found for', tableName);
      leftContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 40px;">No bucket data available</div>';
      return;
    }
    
    // Filter for "All" campaign records only
    const filteredData = result.data.filter(row => row['Campaign Name'] === 'All');
    
    if (!filteredData || filteredData.length === 0) {
      leftContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 40px;">No bucket data available</div>';
      return;
    }
    
    // Store data globally for metrics updates
    window.roasBucketsData = filteredData;
    
    // Process historic data for area charts
    if (chartsContainer) {
      renderROASHistoricCharts(chartsContainer, filteredData);
    }
    
    // Render metrics table
    if (metricsTableContainer) {
      renderROASMetricsTable(metricsTableContainer, filteredData);
    }
    
// Get bucket values dynamically based on selected type
const bucketCounts = {};
const bucketType = window.selectedBucketType || 'ROAS_Bucket';

// Get ALL unique bucket values from the entire dataset (not just filtered data)
// This ensures we show all possible buckets, even if they have 0 products currently
const allData = result.data.filter(row => row['Campaign Name'] === 'All');
const allUniqueBucketValues = [...new Set(allData.map(row => row[bucketType]))].filter(Boolean);

// Initialize all possible buckets with 0 count
allUniqueBucketValues.forEach(bucketValue => {
  bucketCounts[bucketValue] = 0;
});

// Count products in each bucket from filtered data
filteredData.forEach(row => {
  const bucket = row[bucketType];
  if (bucket && bucketCounts.hasOwnProperty(bucket)) {
    bucketCounts[bucket]++;
  }
});

// Store all unique bucket values globally for use in renderROASFunnel
window.allBucketNames = allUniqueBucketValues;
    
    // Calculate grand totals from all products
    const grandTotalImpressions = filteredData.reduce((sum, row) => sum + (parseInt(row.Impressions) || 0), 0);
    const grandTotalClicks = filteredData.reduce((sum, row) => sum + (parseInt(row.Clicks) || 0), 0);
    const grandTotalConversions = filteredData.reduce((sum, row) => sum + (parseFloat(row.Conversions) || 0), 0);
    
    // Create bucket data array
    const total = Object.values(bucketCounts).reduce((sum, count) => sum + count, 0);
    const bucketData = Object.entries(bucketCounts).map(([name, count]) => ({
      name,
      count,
      percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
    }));
    
renderROASFunnel(leftContainer, bucketData);
    
// Render channels container (use original unfiltered data, not filteredData)
const channelsContainer = document.getElementById('roas_channels');
if (channelsContainer) {
  renderROASChannelsContainer(channelsContainer, result.data, null);
}
// Initialize bucket distribution with ALL PRODUCTS data
setTimeout(() => {
  // Initialize preferences if not set
  if (!window.bucketDistributionPreferences) {
    window.bucketDistributionPreferences = {
      'Funnel_Bucket': true,
      'ML_Cluster': true,
      'Spend_Bucket': true,
      'Custom_Tier': true,
      'ROAS_Bucket': false,
      'ROI_Bucket': false,
      'Pricing_Bucket': false
    };
  }
  
  // Update right container to show overall distribution immediately
  const rightContainer = document.querySelector('#roas_buckets .right-container');
  if (rightContainer && window.roasBucketsData) {
    // Clear the placeholder text and show actual content
    rightContainer.innerHTML = '';
    
    // Add title
    const titleDiv = document.createElement('div');
    titleDiv.style.cssText = 'text-align: center; margin-bottom: 15px; color: #333; font-weight: 600;';
    titleDiv.textContent = 'Overall Portfolio Distribution';
    rightContainer.appendChild(titleDiv);
    
    // Create scrollable content area
    const scrollableContent = document.createElement('div');
    scrollableContent.id = 'bucketDistributionContent';
    scrollableContent.style.cssText = `
      height: 420px;
      overflow-y: auto;
      padding-right: 5px;
    `;
    
    // Render bucket distribution
    renderBucketDistribution(scrollableContent, window.roasBucketsData);
    rightContainer.appendChild(scrollableContent);
  }
  
  // Update channels and campaigns with no filter (show all)
  updateChannelsAndCampaignsForBucket(null);
}, 300);
  } catch (error) {
    console.error('[loadAndRenderROASBuckets] Error:', error);
    leftContainer.innerHTML = '<div style="text-align: center; color: #666; margin-top: 40px;">Unable to load bucket data. Please ensure data is loaded.</div>';
  }
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
const bucketProducts = window.roasBucketsData.filter(row => row[bucketType] === bucket.name);
    
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
  const rightContainer = document.querySelector('#roas_buckets .right-container');
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
trapezoid.setAttribute('fill', `url(#${colorConfig ? colorConfig.id : colors[0].id})`);
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
  const rightContainer = document.querySelector('#roas_buckets .right-container');
  if (!rightContainer) return;
  
  // Show loading
  rightContainer.innerHTML = '<div style="text-align: center; margin-top: 40px;"><div class="spinner"></div><p>Loading metrics...</p></div>';
  
  try {
    const accountPrefix = window.currentAccount || 'acc1';
    const tableName = `${accountPrefix}_googleSheets_productBuckets_30d`;
    
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
  row[bucketType] === selectedBucket && row['Campaign Name'] === 'All'
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
    const tableName = `${accountPrefix}_googleSheets_productBuckets_30d`;
    
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
    'Funnel_Bucket': true,
    'ML_Cluster': true,
    'Spend_Bucket': true,
    'Custom_Tier': true,
    'ROAS_Bucket': false,
    'ROI_Bucket': false,
    'Pricing_Bucket': false
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
    { key: 'Funnel_Bucket', title: 'Funnel Performance' },
    { key: 'ML_Cluster', title: 'ML Clusters' },
    { key: 'Spend_Bucket', title: 'Spend Buckets' },
    { key: 'Custom_Tier', title: 'Custom Tiers' },
    { key: 'ROAS_Bucket', title: 'ROAS Buckets' },
    { key: 'ROI_Bucket', title: 'ROI Buckets' },
    { key: 'Pricing_Bucket', title: 'Pricing Buckets' }
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
  filteredData = data.filter(row => row[bucketType] === bucketFilter);
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
  
  renderROASCampaignsTable(campaignsTableContainer, filteredData, bucketFilter);
}

function renderROASCampaignsTable(container, data, bucketFilter = null) {
  container.innerHTML = '';
  
// Exclude records where Campaign Name = "All", include all others
// Apply bucket filter if provided
let validRecords = data.filter(row => row['Campaign Name'] && row['Campaign Name'] !== 'All');
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
if (bucketFilter) {
  validRecords = validRecords.filter(row => row[bucketType] === bucketFilter);
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
  
// Exclude records where Channel Type = "All", include all others
// Apply bucket filter if provided
let validRecords = data.filter(row => row['Channel Type'] && row['Channel Type'] !== 'All');
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
if (bucketFilter) {
  validRecords = validRecords.filter(row => row[bucketType] === bucketFilter);
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

function renderROASHistoricCharts(container, data) {
  // Create main wrapper
  const mainWrapper = document.createElement('div');
  mainWrapper.style.cssText = 'display: flex; flex-direction: column; height: 100%; gap: 15px;';
  
  // Create metrics summary row
  const metricsRow = document.createElement('div');
  metricsRow.style.cssText = `
    width: 100%;
    height: 80px;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 8px;
    padding: 15px 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  
  // Filter for "All" campaign records only
  const allCampaignRecords = data.filter(row => row['Campaign Name'] === 'All');
    // Define bucket type
  const bucketType = window.selectedBucketType || 'ROAS_Bucket';
  
  // Calculate current totals
  const currentTotals = allCampaignRecords.reduce((acc, product) => {
    acc.cost += parseFloat(product.Cost) || 0;
    acc.convValue += parseFloat(product.ConvValue) || 0;
    acc.impressions += parseInt(product.Impressions) || 0;
    acc.conversions += parseFloat(product.Conversions) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0 });
  
  // Calculate previous totals
  const prevTotals = allCampaignRecords.reduce((acc, product) => {
    acc.cost += parseFloat(product.prev_Cost) || 0;
    acc.convValue += parseFloat(product.prev_ConvValue) || 0;
    acc.impressions += parseInt(product.prev_Impressions) || 0;
    acc.conversions += parseFloat(product.prev_Conversions) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0 });
  
  // Calculate metrics
  const currentROAS = currentTotals.cost > 0 ? currentTotals.convValue / currentTotals.cost : 0;
  const prevROAS = prevTotals.cost > 0 ? prevTotals.convValue / prevTotals.cost : 0;
  
  const currentAOV = currentTotals.conversions > 0 ? currentTotals.convValue / currentTotals.conversions : 0;
  const prevAOV = prevTotals.conversions > 0 ? prevTotals.convValue / prevTotals.conversions : 0;
  
  const currentCPA = currentTotals.conversions > 0 ? currentTotals.cost / currentTotals.conversions : 0;
  const prevCPA = prevTotals.conversions > 0 ? prevTotals.cost / prevTotals.conversions : 0;
  
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
  
  metricsRow.innerHTML = `
    ${createMetricItem('ROAS', currentROAS, prevROAS, 'decimal')}
    ${createMetricItem('AOV', currentAOV, prevAOV, 'currency')}
    ${createMetricItem('CPA', currentCPA, prevCPA, 'currency')}
    ${createMetricItem('Impressions', currentTotals.impressions, prevTotals.impressions, 'number')}
    ${createMetricItem('Cost', currentTotals.cost, prevTotals.cost, 'currency')}
    ${createMetricItem('Revenue', currentTotals.convValue, prevTotals.convValue, 'currency')}
  `;
  
  mainWrapper.appendChild(metricsRow);
  
  // Create wrapper for chart and summary
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display: flex; gap: 20px; flex: 1;';
  
  // Left container for chart (75% width)
  const leftContainer = document.createElement('div');
  leftContainer.style.cssText = 'width: 75%; height: 100%; position: relative;';
  
  // Right container (25% width)
  const rightContainer = document.createElement('div');
  rightContainer.style.cssText = 'width: 25%; height: 100%; background: #f8f9fa; border-radius: 8px; padding: 15px;';
  
// Process historic data
  const dateMap = new Map();
  
  // Get unique bucket names from the data
  const bucketNames = [...new Set(allCampaignRecords.map(row => row[bucketType]))].filter(Boolean).sort();
  
  // Calculate date range based on available data
  let minDate = moment();
  let maxDate = moment().subtract(30, 'days');
  
  // Find actual date range from historic data
  allCampaignRecords.forEach(product => {
    if (product['historic_data.buckets'] && Array.isArray(product['historic_data.buckets'])) {
      product['historic_data.buckets'].forEach(histItem => {
        if (histItem.date) {
          const itemDate = moment(histItem.date, 'YYYY-MM-DD');
          if (itemDate.isValid()) {
            if (itemDate.isBefore(minDate)) minDate = itemDate.clone();
            if (itemDate.isAfter(maxDate)) maxDate = itemDate.clone();
          }
        }
      });
    }
  });
  
  // Use last 30 days or available data range
  const endDate = moment();
  const startDate = moment().subtract(29, 'days');
  
  // Adjust if we have less than 30 days of data
  if (minDate.isAfter(startDate)) {
    startDate.set(minDate.toObject());
  }
  
  // Initialize date map with dynamic bucket names
  for (let d = startDate.clone(); d.isSameOrBefore(endDate); d.add(1, 'day')) {
    const dateStr = d.format('YYYY-MM-DD');
    const bucketCounts = {};
    bucketNames.forEach(name => {
      bucketCounts[name] = 0;
    });
    dateMap.set(dateStr, bucketCounts);
  }
  
  // Count products per bucket per date (NO NEW bucketType declaration here)
  allCampaignRecords.forEach(product => {
    if (product['historic_data.buckets'] && Array.isArray(product['historic_data.buckets'])) {
      product['historic_data.buckets'].forEach(histItem => {
        const date = histItem.date;
        const bucketValue = histItem[bucketType];  // USE EXISTING bucketType
        
        if (date && bucketValue && dateMap.has(date)) {
          const dayData = dateMap.get(date);
          if (dayData[bucketValue] !== undefined) {
            dayData[bucketValue]++;
          }
        }
      });
    }
  });
  
  // Calculate current and previous bucket counts for trends
  const currentBucketCounts = {};
  const prevBucketCounts = {};
  
  // Initialize counts for all bucket names
  bucketNames.forEach(name => {
    currentBucketCounts[name] = 0;
    prevBucketCounts[name] = 0;
  });
  
  const prevBucketType = 'prev_' + bucketType;  // USE EXISTING bucketType
  
  // Count current and previous bucket assignments
  allCampaignRecords.forEach(product => {
    const currentBucket = product[bucketType];  // USE EXISTING bucketType
    const prevBucket = product[prevBucketType];
    
    if (currentBucket && currentBucketCounts.hasOwnProperty(currentBucket)) {
      currentBucketCounts[currentBucket]++;
    }
    
    if (prevBucket && prevBucketCounts.hasOwnProperty(prevBucket)) {
      prevBucketCounts[prevBucket]++;
    }
  });
  
  // Convert to arrays for Chart.js
  const dates = Array.from(dateMap.keys()).sort();
const datasets = bucketNames.map((bucketName, index) => {
  const colorPalette = [
    { bg: 'rgba(76, 175, 80, 0.3)', border: '#4CAF50' },
    { bg: 'rgba(33, 150, 243, 0.3)', border: '#2196F3' },
    { bg: 'rgba(255, 152, 0, 0.3)', border: '#FF9800' },
    { bg: 'rgba(244, 67, 54, 0.3)', border: '#F44336' },
    { bg: 'rgba(156, 39, 176, 0.3)', border: '#9C27B0' },
    { bg: 'rgba(0, 188, 212, 0.3)', border: '#00BCD4' },
    { bg: 'rgba(139, 195, 74, 0.3)', border: '#8BC34A' },
    { bg: 'rgba(255, 193, 7, 0.3)', border: '#FFC107' }
  ];
  
  const colorIndex = index % colorPalette.length;
  
  return {
    label: bucketName,
    data: dates.map(date => dateMap.get(date)[bucketName]),
    backgroundColor: colorPalette[colorIndex].bg,
    borderColor: colorPalette[colorIndex].border,
    borderWidth: 2,
    fill: true,
    tension: 0.4
  };
});
  
  // Create chart
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width: 100%; height: 100%;';
  leftContainer.appendChild(canvas);
  
new Chart(canvas, {
  type: 'line',
  data: {
    labels: dates.map(date => moment(date).format('DD/MM')),
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
        display: true
      },
      y: {
        display: true,
        title: {
          display: true,
          text: 'Number of Products'
        },
        beginAtZero: true
      }
    },
    plugins: {
      title: {
        display: true,
        text: 'Historic ROAS Bucket Distribution'
      },
      legend: {
        display: false
      },
      datalabels: {
        display: false
      }
    }
  }
});
  
// Use bucket configuration colors
const bucketConfig = window.bucketConfig[bucketType];
const colorPalette = bucketNames.map(name => bucketConfig.colors[name] || '#999');
  rightContainer.innerHTML = `
    <h4 style="margin: 0 0 20px 0; color: #333; text-align: center;">Current vs Previous</h4>
    <div style="display: flex; flex-direction: column; gap: 12px;">
      ${bucketNames.map((name, index) => {
        const currentCount = currentBucketCounts[name];
        const prevCount = prevBucketCounts[name];
        const change = currentCount - prevCount;
        const trendColor = change > 0 ? '#4CAF50' : change < 0 ? '#F44336' : '#666';
        const trendArrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';
        
        // Shorten bucket names for display
        const shortName = name === 'Volume Driver, Low ROI' ? 'Volume Driver' : 
                         name === 'Efficient Low Volume' ? 'Efficient Low' : name;
        
        return `
          <div style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
background: ${colorPalette[index % colorPalette.length]}08;
border-left: 3px solid ${colorPalette[index % colorPalette.length]};
            border-radius: 4px;
          ">
            <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
              <span style="font-size: 18px; color: #666; font-weight: 500;">${shortName}</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-size: 18px; font-weight: 700; color: ${colorPalette[index % colorPalette.length]};">${currentCount}</span>
              <div style="
                display: flex;
                align-items: center;
                gap: 2px;
                background: ${trendColor}15;
                padding: 2px 6px;
                border-radius: 3px;
                min-width: 35px;
                justify-content: center;
              ">
                <span style="color: ${trendColor}; font-size: 10px; font-weight: 600;">${trendArrow}</span>
                <span style="color: ${trendColor}; font-size: 10px; font-weight: 600;">${Math.abs(change)}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;
  
  wrapper.appendChild(leftContainer);
  wrapper.appendChild(rightContainer);
  mainWrapper.appendChild(wrapper);
  container.appendChild(mainWrapper);
}

function renderROASMetricsTable(container, data) {
  container.innerHTML = '';
  
  // Filter for "All" campaign records only
  const allCampaignRecords = data.filter(row => row['Campaign Name'] === 'All');
  
  // Group by ROAS Bucket
const bucketType = window.selectedBucketType || 'ROAS_Bucket';
// Get unique bucket values dynamically
const uniqueBuckets = [...new Set(allCampaignRecords.map(row => row[bucketType]))].filter(Boolean);
const bucketGroups = {};
uniqueBuckets.forEach(bucket => {
  bucketGroups[bucket] = [];
});
  
allCampaignRecords.forEach(product => {
  const bucket = product[bucketType];
  if (bucket && bucketGroups[bucket]) {
    bucketGroups[bucket].push(product);
  }
});
  
  // Calculate aggregated metrics for each bucket
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
  
  // Create body
  const tbody = document.createElement('tbody');
  
// Use configuration colors
const bucketConfig = window.bucketConfig[bucketType];
const bucketColors = {};

// Sort buckets by configuration order (best first)
bucketMetrics.sort((a, b) => {
  const orderA = bucketConfig.order.indexOf(a.bucket);
  const orderB = bucketConfig.order.indexOf(b.bucket);
  return orderA - orderB;
});

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
    const row = document.createElement('tr');
    row.style.cssText = 'border-bottom: 1px solid #f0f0f0; height: 60px;';
    
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
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #e8f5e8;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalImpressions.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #e8f5e8;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalClicks.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #e8f5e8;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">${summary.totalConversions.toFixed(1)}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #e8f5e8;">
      <div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
        <span style="font-weight: 700; font-size: 14px; color: #2e7d32;">$${summary.totalCost.toLocaleString()}</span>
        <span style="font-size: 10px; color: #666;">100%</span>
      </div>
    </td>
    <td style="padding: 10px 6px; text-align: center; vertical-align: middle; background: #e8f5e8;">
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
