// Product Bucket Analyzer V3 - Updated Version
// Implements new 5-bucket system with improved logic

window.productBucketAnalyzer = {
  // Default thresholds for metric evaluation
  DEFAULTS: {
    impressions: 5000,
    clicks: 50,
    cost: 100,
    conversions: null, // Will be calculated dynamically
    convValue: null, // Will be calculated dynamically
    ctr: null, // Will be calculated as average
    cvr: null, // Will be calculated as median
    cartRate: null, // Will be calculated
    checkoutRate: null, // Will be calculated
    purchaseRate: null, // Will be calculated
    roas: 2.5,
    aov: null, // Will be calculated as median
    cpa: null, // Will be calculated as median
    avgCpc: null // Will be calculated as average
  },

  // Confidence thresholds for data quality
  CONFIDENCE_THRESHOLDS: {
    high: {
      impressions: 10000,
      clicks: 100,
      conversions: 10,
      revenue: 5000
    },
    medium: {
      impressions: 5000,
      clicks: 50,
      conversions: 5,
      revenue: 1000
    }
  },

  // Current time period being processed (used for bucket thresholds)
  currentTimePeriod: '30d',

  // Helper to round to 2 decimal places
  round2(value) {
    return Math.round(value * 100) / 100;
  },

  // Calculate trend from previous period
  calculateTrend(current, previous) {
    if (!previous || previous === 0) return 'new';
    const change = ((current - previous) / previous) * 100;
    if (change > 20) return 'growing';
    if (change < -20) return 'declining';
    return 'stable';
  },

  // Check if product is new (low previous period data)
  isNewProduct(prevMetrics) {
    if (!prevMetrics) return true;
    return prevMetrics.impressions < 1000 || 
           prevMetrics.clicks < 10 || 
           prevMetrics.cost < 50;
  },

  // Process and create bucket analysis for multiple time periods
  async processProductBuckets(prefix = 'acc1_') {
    const startTime = performance.now();
    try {
      console.log('[Product Buckets V3] Starting bucket analysis for 30d, 60d, and 90d...');
      
      // Load product performance data from IDB
      const productRec = await window.embedIDB.getData(prefix + "googleSheets_productPerformance");
      if (!productRec?.data || !productRec.data.length) {
        console.error('[Product Buckets V3] No product performance data found');
        return;
      }

      const rawData = productRec.data;
      console.log(`[Product Buckets V3] Processing ${rawData.length} rows of data`);

      // Find the max date in the data
      const allDates = rawData.map(r => new Date(r.Date)).filter(d => !isNaN(d));
      const maxDataDate = new Date(Math.max(...allDates));
      
      // Process each time period
      const periods = [
        { days: 30, suffix: '30d' },
        { days: 60, suffix: '60d' },
        { days: 90, suffix: '90d' }
      ];

      const results = {};
      
      for (const period of periods) {
        console.log(`[Product Buckets V3] Processing ${period.days}-day period...`);
        
        const bucketData = await this.processTimePeriod(rawData, maxDataDate, period.days, period.suffix);
        
        // Save to IDB
        const tableName = prefix + `googleSheets_productBuckets_${period.suffix}`;
        await window.embedIDB.setData(tableName, bucketData);
        
        console.log(`[Product Buckets V3] ✅ Saved ${bucketData.length} product buckets to ${tableName}`);
        results[period.suffix] = bucketData;
      }

      // Store in global variable for easy access (use 30d as default)
      if (!window.googleSheetsData) window.googleSheetsData = {};
      window.googleSheetsData.productBuckets = results['30d'];

      // Add timing log
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(3);
      console.log(`[Product Buckets V3] ✅ Processing completed in ${processingTime} seconds`);

      return results;
    } catch (error) {
      console.error('[Product Buckets V3] Error processing buckets:', error);
      throw error;
    }
  },

  // New method to process a specific time period
  async processTimePeriod(rawData, maxDataDate, days, suffix) {
    // Calculate date ranges
    const endDate = maxDataDate;
    const startDate = new Date(maxDataDate);
    startDate.setDate(startDate.getDate() - days);
    const prevStartDate = new Date(maxDataDate);
    prevStartDate.setDate(prevStartDate.getDate() - (days * 2));

    // Filter data for different periods
    const currentPeriodData = rawData.filter(row => {
      if (!row.Date) return false;
      const rowDate = new Date(row.Date);
      return rowDate > startDate && rowDate <= endDate;
    });

    const prevPeriodData = rawData.filter(row => {
      if (!row.Date) return false;
      const rowDate = new Date(row.Date);
      return rowDate > prevStartDate && rowDate <= startDate;
    });

    console.log(`[Product Buckets V3] ${suffix}: Current period: ${currentPeriodData.length} rows, Previous: ${prevPeriodData.length} rows`);

    // Set time period for bucket assignment logic
    this.currentTimePeriod = suffix;
    
    // Calculate dynamic defaults based on current period data
    this.calculateDynamicDefaults(currentPeriodData);
    
    // Calculate account metrics for benchmarking
    this.accountMetrics = this.calculateAccountMetrics(currentPeriodData);

    // Calculate revenue percentiles for seller classification
this.revenuePercentiles = this.calculateRevenuePercentiles(currentGrouped);

    // Group data by product + campaign + channel + device
    const currentGrouped = this.groupByProductCampaignChannelDevice(currentPeriodData);
    const prevGrouped = this.groupByProductCampaignChannelDevice(prevPeriodData);

    // Process all combinations
    const bucketData = [];
    const DELIMITER = '~~~';
    
    // Get unique products for tracking
    const uniqueProducts = new Set();
    Object.keys(currentGrouped).forEach(key => {
      const parts = key.split(DELIMITER);
      if (parts.length === 4) {
        uniqueProducts.add(parts[0]);
      }
    });

    // Process each specific campaign/channel/device combination
    let processedCount = 0;
    const specificCombinations = Object.keys(currentGrouped).filter(key => {
      const parts = key.split(DELIMITER);
      return parts.length === 4 && parts[1] !== 'All' && parts[2] !== 'All';
    });

    for (const key of specificCombinations) {
      const parts = key.split(DELIMITER);
      const [productTitle, campaignName, channelType, device] = parts;
      
      const rowData = this.processProductRecord(
        productTitle,
        campaignName,
        channelType,
        device,
        currentGrouped[key] || [],
        prevGrouped[key] || [],
        device === 'All'
      );
      
      if (rowData) {
        bucketData.push(rowData);
        processedCount++;
        
        if (processedCount % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    }

    // Process aggregated records
    for (const productTitle of uniqueProducts) {
      const devices = new Set();
      
      Object.keys(currentGrouped).forEach(key => {
        const parts = key.split(DELIMITER);
        if (parts[0] === productTitle && parts[3] && parts[3] !== 'All') {
          devices.add(parts[3]);
        }
      });
      
      for (const device of devices) {
        const currentRows = [];
        const prevRows = [];
        
        Object.keys(currentGrouped).forEach(key => {
          const parts = key.split(DELIMITER);
          if (parts[0] === productTitle && parts[3] === device && parts[1] !== 'All') {
            currentRows.push(...(currentGrouped[key] || []));
          }
        });
        
        Object.keys(prevGrouped).forEach(key => {
          const parts = key.split(DELIMITER);
          if (parts[0] === productTitle && parts[3] === device && parts[1] !== 'All') {
            prevRows.push(...(prevGrouped[key] || []));
          }
        });
        
        if (currentRows.length > 0) {
          const rowData = this.processProductRecord(
            productTitle,
            'All',
            'All',
            device,
            currentRows,
            prevRows,
            false
          );
          
          if (rowData) {
            bucketData.push(rowData);
          }
        }
      }
      
      // Create all devices record
      const allCurrentRows = [];
      const allPrevRows = [];
      
      Object.keys(currentGrouped).forEach(key => {
        const parts = key.split(DELIMITER);
        if (parts[0] === productTitle && parts[1] !== 'All') {
          allCurrentRows.push(...(currentGrouped[key] || []));
        }
      });
      
      Object.keys(prevGrouped).forEach(key => {
        const parts = key.split(DELIMITER);
        if (parts[0] === productTitle && parts[1] !== 'All') {
          allPrevRows.push(...(prevGrouped[key] || []));
        }
      });
      
      if (allCurrentRows.length > 0) {
        const rowData = this.processProductRecord(
          productTitle,
          'All',
          'All',
          'All',
          allCurrentRows,
          allPrevRows,
          true
        );
        
        if (rowData) {
          bucketData.push(rowData);
        }
      }
    }

    return bucketData;
  },

  // Process a single product record
  processProductRecord(productTitle, campaignName, channelType, device, currentRows, prevRows, isAllDevices) {
    if (currentRows.length === 0) {
      return null;
    }
    
    // Calculate metrics
    const metrics = this.calculateAggregatedMetrics(currentRows);
    const prevMetrics = prevRows.length > 0 ? this.calculateAggregatedMetrics(prevRows) : null;
    
    // Get device metrics for comparison (only needed for All devices record)
    let allDeviceMetrics = null;
    if (isAllDevices) {
      allDeviceMetrics = this.getDeviceMetricsForComparison(currentRows);
    }
    
    // Assign buckets
    const buckets = this.assignAllBuckets(metrics, prevMetrics, allDeviceMetrics, isAllDevices);
    const prevBuckets = prevMetrics ? this.assignAllBuckets(prevMetrics, null, null, false) : null;

    // Assign sellers category
const sellersCategory = this.assignSellersCategory(productTitle, metrics);
    
    // Build the row data
    return {
      'Product Title': productTitle,
      'Campaign Name': campaignName,
      'Channel Type': channelType,
      'Device': device,
      'Impressions': metrics.impressions,
      'Clicks': metrics.clicks,
      'Avg CPC': this.round2(metrics.avgCpc),
      'Cost': this.round2(metrics.cost),
      'Conversions': metrics.conversions,
      'ConvValue': this.round2(metrics.convValue),
      'CTR': this.round2(metrics.ctr),
      'CVR': this.round2(metrics.cvr),
      'ROAS': this.round2(metrics.roas),
      'AOV': this.round2(metrics.aov),
      'CPA': this.round2(metrics.cpa),
      'CPM': this.round2(metrics.cpm),
      // New funnel metrics
      'Cart Rate': this.round2(metrics.cartRate),
      'Checkout Rate': this.round2(metrics.checkoutRate),
      'Purchase Rate': this.round2(metrics.purchaseRate),
      // Previous period metrics
      'prev_Impressions': prevMetrics ? prevMetrics.impressions : 0,
      'prev_Clicks': prevMetrics ? prevMetrics.clicks : 0,
      'prev_Avg CPC': prevMetrics ? this.round2(prevMetrics.avgCpc) : 0,
      'prev_Cost': prevMetrics ? this.round2(prevMetrics.cost) : 0,
      'prev_Conversions': prevMetrics ? prevMetrics.conversions : 0,
      'prev_ConvValue': prevMetrics ? this.round2(prevMetrics.convValue) : 0,
      'prev_CTR': prevMetrics ? this.round2(prevMetrics.ctr) : 0,
      'prev_CVR': prevMetrics ? this.round2(prevMetrics.cvr) : 0,
      'prev_ROAS': prevMetrics ? this.round2(prevMetrics.roas) : 0,
      'prev_AOV': prevMetrics ? this.round2(prevMetrics.aov) : 0,
      'prev_CPA': prevMetrics ? this.round2(prevMetrics.cpa) : 0,
      'prev_CPM': prevMetrics ? this.round2(prevMetrics.cpm) : 0,
      // Bucket assignments
'PROFITABILITY_BUCKET': JSON.stringify(buckets.profitability),
'FUNNEL_STAGE_BUCKET': JSON.stringify(buckets.funnelStage),
'INVESTMENT_BUCKET': JSON.stringify(buckets.investment),
'CUSTOM_TIER_BUCKET': JSON.stringify(buckets.customTier),
      'SUGGESTIONS_BUCKET': JSON.stringify(buckets.suggestions),
      'SELLERS': sellersCategory,
      'HEALTH_SCORE': buckets.healthScore,
      'Confidence_Level': buckets.confidenceLevel,
      // Previous bucket assignments
'prev_PROFITABILITY_BUCKET': prevBuckets ? JSON.stringify(prevBuckets.profitability) : '{}',
'prev_FUNNEL_STAGE_BUCKET': prevBuckets ? JSON.stringify(prevBuckets.funnelStage) : '{}',
'prev_INVESTMENT_BUCKET': prevBuckets ? JSON.stringify(prevBuckets.investment) : '{}',
'prev_CUSTOM_TIER_BUCKET': prevBuckets ? JSON.stringify(prevBuckets.customTier) : '{}',
      'prev_SUGGESTIONS_BUCKET': prevBuckets ? JSON.stringify(prevBuckets.suggestions) : '[]'
    };
  },

  // Get device metrics for comparison (used only for All devices records)
  getDeviceMetricsForComparison(rows) {
    const deviceData = {
      'desktop': [],
      'mobile': [],
      'tablet': []
    };
    
    rows.forEach(row => {
      const device = (row.Device || '').toLowerCase();
      if (deviceData[device]) {
        deviceData[device].push(row);
      }
    });
    
    const deviceMetrics = {};
    Object.entries(deviceData).forEach(([device, deviceRows]) => {
      if (deviceRows.length > 0) {
        deviceMetrics[device] = this.calculateAggregatedMetrics(deviceRows);
      }
    });
    
    return deviceMetrics;
  },

  // Calculate dynamic defaults based on actual data
  calculateDynamicDefaults(data) {
    const parseNumber = (value) => {
      if (!value) return 0;
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    const validData = data.filter(row => parseNumber(row.Impressions) > 0);
    
    // CTR average
    const ctrValues = validData.map(row => parseNumber(row.CTR));
    this.DEFAULTS.ctr = ctrValues.length > 0
      ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length
      : 1.0;

    // CPC average
    const cpcValues = validData
      .filter(row => parseNumber(row.Clicks) > 0)
      .map(row => parseNumber(row['Avg CPC']) || (parseNumber(row.Cost) / parseNumber(row.Clicks)));
    this.DEFAULTS.avgCpc = cpcValues.length > 0
      ? cpcValues.reduce((a, b) => a + b, 0) / cpcValues.length
      : 2.0;

    // Conversion metrics (medians)
    const sortedMedian = (arr) => {
      const sorted = arr.filter(v => v > 0).sort((a, b) => a - b);
      return sorted.length > 0 ? sorted[Math.floor(sorted.length / 2)] : 0;
    };

    this.DEFAULTS.conversions = sortedMedian(validData.map(r => parseNumber(r.Conversions))) || 5;
    this.DEFAULTS.convValue = sortedMedian(validData.map(r => parseNumber(r['Conversion Value']))) || 1000;
    this.DEFAULTS.cvr = sortedMedian(validData.filter(r => parseNumber(r.Clicks) > 0).map(r => parseNumber(r.CVR))) || 2.0;
    this.DEFAULTS.aov = sortedMedian(validData.map(r => parseNumber(r.AOV))) || 100;
    this.DEFAULTS.cpa = sortedMedian(validData.map(r => parseNumber(r.CPA))) || 50;

    // Funnel rates
    const cartRates = validData
      .filter(r => parseNumber(r.Clicks) > 0 && parseNumber(r['Add to Cart Conv']) >= 0)
      .map(r => (parseNumber(r['Add to Cart Conv']) / parseNumber(r.Clicks)) * 100);
    this.DEFAULTS.cartRate = cartRates.length > 0
      ? cartRates.reduce((a, b) => a + b, 0) / cartRates.length
      : 10;

    const checkoutRates = validData
      .filter(r => parseNumber(r['Add to Cart Conv']) > 0 && parseNumber(r['Begin Checkout Conv']) >= 0)
      .map(r => (parseNumber(r['Begin Checkout Conv']) / parseNumber(r['Add to Cart Conv'])) * 100);
    this.DEFAULTS.checkoutRate = checkoutRates.length > 0
      ? checkoutRates.reduce((a, b) => a + b, 0) / checkoutRates.length
      : 60;

    const purchaseRates = validData
      .filter(r => parseNumber(r['Begin Checkout Conv']) > 0 && parseNumber(r['Purchase Conv']) >= 0)
      .map(r => (parseNumber(r['Purchase Conv']) / parseNumber(r['Begin Checkout Conv'])) * 100);
    this.DEFAULTS.purchaseRate = purchaseRates.length > 0
      ? purchaseRates.reduce((a, b) => a + b, 0) / purchaseRates.length
      : 80;

    console.log('[Product Buckets V3] Calculated dynamic defaults:', this.DEFAULTS);
  },

    // Calculate revenue percentiles for seller classification
  calculateRevenuePercentiles(currentGrouped) {
    // Collect all product revenues (aggregate by product title only)
    const productRevenues = {};
    const DELIMITER = '~~~';
    
    Object.entries(currentGrouped).forEach(([key, rows]) => {
      const parts = key.split(DELIMITER);
      const productTitle = parts[0];
      
      // Only count non-aggregated records (avoid double counting)
      if (parts[1] !== 'All' && parts[2] !== 'All' && parts[3] !== 'All') {
        if (!productRevenues[productTitle]) {
          productRevenues[productTitle] = 0;
        }
        const metrics = this.calculateAggregatedMetrics(rows);
        productRevenues[productTitle] += metrics.convValue;
      }
    });
    
    // Sort revenues and calculate percentiles
    const sortedRevenues = Object.values(productRevenues).sort((a, b) => b - a);
    const total = sortedRevenues.length;
    
    return {
      top10PercentThreshold: total > 0 ? sortedRevenues[Math.floor(total * 0.1)] : 0,
      top20PercentThreshold: total > 0 ? sortedRevenues[Math.floor(total * 0.2)] : 0,
      productRevenues: productRevenues
    };
  },

    // Assign sellers category based on revenue and ROAS
  assignSellersCategory(productTitle, metrics) {
    const productRevenue = this.revenuePercentiles.productRevenues[productTitle] || metrics.convValue;
    const avgROAS = this.accountMetrics.avgROAS;
    const isTop10Revenue = productRevenue >= this.revenuePercentiles.top10PercentThreshold;
    const isTop20Revenue = productRevenue >= this.revenuePercentiles.top20PercentThreshold;
    
    // Revenue Stars: Top 10% revenue + ROAS > (avg ROAS + 1.0)
    if (isTop10Revenue && metrics.roas > (avgROAS + 1.0)) {
      return 'Revenue Stars';
    }
    
    // Best Sellers: Top 20% revenue + ROAS > avg ROAS
    if (isTop20Revenue && metrics.roas > avgROAS) {
      return 'Best Sellers';
    }
    
    // Volume Leaders: Top 20% revenue regardless of ROAS
    if (isTop20Revenue) {
      return 'Volume Leaders';
    }
    
    return 'Standard';
  },

  // Calculate account-wide metrics
  calculateAccountMetrics(data) {
    const parseNumber = (value) => {
      if (!value) return 0;
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    const totals = data.reduce((acc, row) => {
      acc.cost += parseNumber(row.Cost);
      acc.convValue += parseNumber(row['Conversion Value']);
      acc.impressions += parseNumber(row.Impressions);
      acc.clicks += parseNumber(row.Clicks);
      acc.conversions += parseNumber(row.Conversions);
      return acc;
    }, { cost: 0, convValue: 0, impressions: 0, clicks: 0, conversions: 0 });

    return {
      avgROAS: totals.cost > 0 ? totals.convValue / totals.cost : 2.5,
      avgCTR: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 1.0,
      avgCVR: totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 2.0,
      totalRevenue: totals.convValue,
      totalCost: totals.cost
    };
  },

  // Group data by product + campaign + channel + device
  groupByProductCampaignChannelDevice(data) {
    const grouped = {};
    const DELIMITER = '~~~';
    
    data.forEach(row => {
      const device = row.Device || 'UNKNOWN';
      const campaignName = row['Campaign Name'] || '';
      const channelType = row['Channel Type'] || '';
      const productTitle = row['Product Title'] || '';
      
      const key = `${productTitle}${DELIMITER}${campaignName}${DELIMITER}${channelType}${DELIMITER}${device}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    return grouped;
  },

  // Calculate aggregated metrics for a group of rows
  calculateAggregatedMetrics(rows) {
    const parseNumber = (value) => {
      if (!value) return 0;
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    const metrics = {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      convValue: 0,
      addToCartConv: 0,
      addToCartValue: 0,
      beginCheckoutConv: 0,
      beginCheckoutValue: 0,
      purchaseConv: 0,
      purchaseValue: 0
    };

    // Aggregate metrics
    rows.forEach(row => {
      metrics.impressions += parseNumber(row.Impressions);
      metrics.clicks += parseNumber(row.Clicks);
      metrics.cost += parseNumber(row.Cost);
      metrics.conversions += parseNumber(row.Conversions);
      metrics.convValue += parseNumber(row['Conversion Value']);
      metrics.addToCartConv += parseNumber(row['Add to Cart Conv']);
      metrics.addToCartValue += parseNumber(row['Add to Cart Conv Value']);
      metrics.beginCheckoutConv += parseNumber(row['Begin Checkout Conv']);
      metrics.beginCheckoutValue += parseNumber(row['Begin Checkout Conv Value']);
      metrics.purchaseConv += parseNumber(row['Purchase Conv']);
      metrics.purchaseValue += parseNumber(row['Purchase Conv Value']);
    });

    // Calculate derived metrics
    metrics.avgCpc = metrics.clicks > 0 ? metrics.cost / metrics.clicks : 0;
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    metrics.roas = metrics.cost > 0 ? metrics.convValue / metrics.cost : 0;
    metrics.aov = metrics.conversions > 0 ? metrics.convValue / metrics.conversions : 0;
    metrics.cpa = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;
    metrics.cpm = metrics.impressions > 0 ? (metrics.cost / metrics.impressions) * 1000 : 0;
    
    // Funnel rates
    metrics.cartRate = metrics.clicks > 0 ? (metrics.addToCartConv / metrics.clicks) * 100 : 0;
    metrics.checkoutRate = metrics.addToCartConv > 0 ? (metrics.beginCheckoutConv / metrics.addToCartConv) * 100 : 0;
    metrics.purchaseRate = metrics.beginCheckoutConv > 0 ? (metrics.purchaseConv / metrics.beginCheckoutConv) * 100 : 0;

    return metrics;
  },

  // Assign all buckets based on new system
  assignAllBuckets(metrics, prevMetrics, allDeviceMetrics, isAllDevices) {
    const confidenceLevel = this.calculateConfidenceLevel(metrics);
    const isNew = this.isNewProduct(prevMetrics);
    
    const buckets = {
      profitability: this.assignProfitabilityBucket(metrics, confidenceLevel, isNew),
      funnelStage: this.assignFunnelStageBucket(metrics, isNew),
      investment: this.assignInvestmentBucket(metrics, prevMetrics),
      customTier: this.assignCustomTierBucket(metrics, prevMetrics, allDeviceMetrics, isAllDevices, isNew),
      confidenceLevel: confidenceLevel
    };
    
    // Calculate health score
    buckets.healthScore = this.calculateHealthScore(metrics, buckets);
    
    // Assign suggestions with mutex groups (returns array of objects)
    buckets.suggestions = this.assignSuggestions(metrics, buckets, isAllDevices);
    
    return buckets;
  },

  // Calculate confidence level based on data volume
  calculateConfidenceLevel(metrics) {
    const thresholds = this.CONFIDENCE_THRESHOLDS;
    
    if (metrics.impressions >= thresholds.high.impressions &&
        metrics.clicks >= thresholds.high.clicks &&
        (metrics.conversions >= thresholds.high.conversions || metrics.convValue >= thresholds.high.revenue)) {
      return 'High';
    } else if (metrics.impressions >= thresholds.medium.impressions &&
               metrics.clicks >= thresholds.medium.clicks &&
               (metrics.conversions >= thresholds.medium.conversions || metrics.convValue >= thresholds.medium.revenue)) {
      return 'Medium';
    }
    return 'Low';
  },

// 1. PROFITABILITY_BUCKET - Updated with explanations
assignProfitabilityBucket(metrics, confidenceLevel, isNew) {
  // Updated thresholds based on time period
  const insufficientDataThresholds = {
    '30d': { 
      minImpressions: 1000,  
      minClicks: 50,         
      minCost: 100,          
      OR_minConversions: 3   
    },
    '60d': { 
      minImpressions: 2000,
      minClicks: 100,        
      minCost: 200,          
      OR_minConversions: 5
    },
    '90d': { 
      minImpressions: 3000,
      minClicks: 150,        
      minCost: 300,          
      OR_minConversions: 7
    }
  };

  const threshold = insufficientDataThresholds[this.currentTimePeriod] || insufficientDataThresholds['30d'];

  // Check for insufficient data with updated logic
  if ((metrics.impressions < threshold.minImpressions && 
       metrics.clicks < threshold.minClicks && 
       metrics.cost < threshold.minCost) ||
      (metrics.conversions < threshold.OR_minConversions && metrics.cost < threshold.minCost)) {
    return {
      value: 'Insufficient Data',
      explanation: `Impressions: ${metrics.impressions} < ${threshold.minImpressions}, Clicks: ${metrics.clicks} < ${threshold.minClicks}, Cost: $${metrics.cost.toFixed(0)} < $${threshold.minCost}`
    };
  }

  if (metrics.roas >= 4 && (metrics.conversions >= 10 || metrics.convValue >= 5000)) {
    return {
      value: 'Profit Stars',
      explanation: `ROAS: ${metrics.roas.toFixed(1)}x ≥ 4, Conversions: ${metrics.conversions} ≥ 10 or Revenue: $${metrics.convValue.toFixed(0)} ≥ $5,000`
    };
  } else if (metrics.roas >= 2.5 && (metrics.conversions >= 5 || metrics.convValue >= 1000)) {
    return {
      value: 'Strong Performers',
      explanation: `ROAS: ${metrics.roas.toFixed(1)}x ≥ 2.5, Conversions: ${metrics.conversions} ≥ 5 or Revenue: $${metrics.convValue.toFixed(0)} ≥ $1,000`
    };
  } else if (metrics.roas >= 1.5 && metrics.conversions > 0) {
    return {
      value: 'Steady Contributors',
      explanation: `ROAS: ${metrics.roas.toFixed(1)}x ≥ 1.5, Conversions: ${metrics.conversions} > 0`
    };
  } else if (metrics.roas >= 0.8 && metrics.roas < 1.5) {
    return {
      value: 'Break-Even Products',
      explanation: `ROAS: ${metrics.roas.toFixed(1)}x between 0.8 and 1.5`
    };
  } else if (metrics.roas < 0.8) {
    return {
      value: 'True Losses',
      explanation: `ROAS: ${metrics.roas.toFixed(1)}x < 0.8`
    };
  }
  
  return {
    value: 'Insufficient Data',
    explanation: 'Unable to classify based on available metrics'
  };
},

// 2. FUNNEL_STAGE_BUCKET - Updated with explanations
assignFunnelStageBucket(metrics, isNew) {
  const avgCTR = this.DEFAULTS.ctr;
  const avgCartRate = this.DEFAULTS.cartRate;
  const avgCheckoutRate = this.DEFAULTS.checkoutRate;
  const avgPurchaseRate = this.DEFAULTS.purchaseRate;
  const avgROAS = this.accountMetrics.avgROAS;
  
  // Check for insufficient data
  if (metrics.impressions < 5000 && metrics.clicks < 50) {
    return {
      value: 'Insufficient Data',
      explanation: `Impressions: ${metrics.impressions} < 5,000 and Clicks: ${metrics.clicks} < 50`
    };
  }

  // Full Funnel Excellence
  if (metrics.ctr >= avgCTR && 
      metrics.purchaseRate >= 60 &&
      metrics.cartRate >= avgCartRate &&
      metrics.checkoutRate >= avgCheckoutRate) {
    return {
      value: 'Full Funnel Excellence',
      explanation: `CTR: ${metrics.ctr.toFixed(1)}% ≥ avg, Purchase Rate: ${metrics.purchaseRate.toFixed(0)}% ≥ 60%, all stages ≥ avg`
    };
  }

  // Determine if there are funnel issues
  const hasFunnelIssues = 
    metrics.ctr < avgCTR * 0.7 ||
    metrics.cartRate < avgCartRate * 0.7 ||
    metrics.checkoutRate < 40 ||
    metrics.purchaseRate < 60;

  // High-Value Funnel Issues - Good ROAS but funnel problems
  if (metrics.roas > avgROAS && hasFunnelIssues) {
    const issues = [];
    if (metrics.ctr < avgCTR * 0.5) issues.push(`CTR: ${metrics.ctr.toFixed(1)}% < ${(avgCTR * 0.5).toFixed(1)}%`);
    if (metrics.cartRate < avgCartRate * 0.5) issues.push(`Cart Rate: ${metrics.cartRate.toFixed(1)}% < ${(avgCartRate * 0.5).toFixed(1)}%`);
    if (metrics.checkoutRate < 40) issues.push(`Checkout Rate: ${metrics.checkoutRate.toFixed(0)}% < 40%`);
    if (metrics.purchaseRate < 60) issues.push(`Purchase Rate: ${metrics.purchaseRate.toFixed(0)}% < 60%`);
    
    return {
      value: 'High-Value Funnel Issues',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x > avg but ${issues.join(', ')}`
    };
  }

  // Critical Funnel Issues - Poor ROAS AND funnel problems
  if (metrics.roas < 1.5 && hasFunnelIssues) {
    const issues = [];
    if (metrics.ctr < avgCTR * 0.5) issues.push(`CTR: ${metrics.ctr.toFixed(1)}%`);
    if (metrics.cartRate < avgCartRate * 0.5) issues.push(`Cart Rate: ${metrics.cartRate.toFixed(1)}%`);
    if (metrics.checkoutRate < 30) issues.push(`Checkout Rate: ${metrics.checkoutRate.toFixed(0)}%`);
    if (metrics.purchaseRate < 50) issues.push(`Purchase Rate: ${metrics.purchaseRate.toFixed(0)}%`);
    
    return {
      value: 'Critical Funnel Issues',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x < 1.5 and ${issues.join(', ')}`
    };
  }

  // Specific funnel stage issues
  if (metrics.ctr < avgCTR * 0.5 && metrics.impressions >= 5000) {
    return {
      value: 'Ad Engagement Issue',
      explanation: `CTR: ${metrics.ctr.toFixed(1)}% < ${(avgCTR * 0.5).toFixed(1)}% avg with ${metrics.impressions.toLocaleString()} impressions`
    };
  }

  if (metrics.ctr >= avgCTR && metrics.cartRate < avgCartRate * 0.5 && metrics.clicks >= 50) {
    return {
      value: 'Product Page Dropoff',
      explanation: `CTR OK (${metrics.ctr.toFixed(1)}%) but Cart Rate: ${metrics.cartRate.toFixed(1)}% < ${(avgCartRate * 0.5).toFixed(1)}% avg`
    };
  }

  if (metrics.checkoutRate < 40 && metrics.addToCartConv >= 20) {
    return {
      value: 'Cart Abandonment Problem',
      explanation: `Checkout Rate: ${metrics.checkoutRate.toFixed(0)}% < 40% with ${metrics.addToCartConv} cart adds`
    };
  }

  if (metrics.purchaseRate < 60 && metrics.beginCheckoutConv >= 10) {
    return {
      value: 'Checkout Friction',
      explanation: `Purchase Rate: ${metrics.purchaseRate.toFixed(0)}% < 60% with ${metrics.beginCheckoutConv} checkouts`
    };
  }

  if (metrics.clicks >= 100 && metrics.cartRate < 20 && metrics.aov < this.DEFAULTS.aov * 0.7) {
    return {
      value: 'Price Discovery Shock',
      explanation: `${metrics.clicks} clicks but Cart Rate: ${metrics.cartRate.toFixed(1)}% < 20% and AOV: $${metrics.aov.toFixed(0)} < avg`
    };
  }

  // Cross-Stage Issues
  const stageCount = [
    metrics.ctr < avgCTR * 0.7,
    metrics.cartRate < avgCartRate * 0.7,
    metrics.checkoutRate < avgCheckoutRate * 0.7,
    metrics.purchaseRate < avgPurchaseRate * 0.7
  ].filter(Boolean).length;
  
  if (stageCount >= 2) {
    return {
      value: 'Cross-Stage Issues',
      explanation: `${stageCount} stages performing < 70% of average`
    };
  }

  // Optimization Opportunities
  if (metrics.roas >= avgROAS && 
      (metrics.ctr < avgCTR || 
       metrics.cartRate < avgCartRate || 
       metrics.checkoutRate < avgCheckoutRate || 
       metrics.purchaseRate < avgPurchaseRate)) {
    const opportunities = [];
    if (metrics.ctr < avgCTR) opportunities.push('CTR');
    if (metrics.cartRate < avgCartRate) opportunities.push('Cart Rate');
    if (metrics.checkoutRate < avgCheckoutRate) opportunities.push('Checkout Rate');
    if (metrics.purchaseRate < avgPurchaseRate) opportunities.push('Purchase Rate');
    
    return {
      value: 'Optimization Opportunities',
      explanation: `Good ROAS (${metrics.roas.toFixed(1)}x) but below avg in: ${opportunities.join(', ')}`
    };
  }

  return {
    value: 'Normal Performance',
    explanation: 'All metrics within expected ranges'
  };
},

// 3. INVESTMENT_BUCKET - Updated with explanations
assignInvestmentBucket(metrics, prevMetrics) {
  const roasTrend = prevMetrics ? this.calculateTrend(metrics.roas, prevMetrics.roas) : 'new';
  const conversionTrend = prevMetrics ? this.calculateTrend(metrics.conversions, prevMetrics.conversions) : 'new';
  const revenueShare = this.accountMetrics.totalCost > 0 ? metrics.cost / this.accountMetrics.totalCost : 0;
  
  // Updated priority levels
  if (metrics.roas < 1.0 && metrics.conversions === 0 && metrics.cost > 200) {
    return {
      value: 'Pause Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, no conversions, $${metrics.cost.toFixed(0)} spent`
    };
  } else if (metrics.roas < 1.0 || (metrics.roas < 1.5 && roasTrend === 'declining')) {
    return {
      value: 'Reduce Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x${roasTrend === 'declining' ? ', declining trend' : ''}`
    };
  } else if (metrics.roas >= 1.5 && metrics.roas < 2.0 && roasTrend === 'stable') {
    return {
      value: 'Maintain Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, stable performance`
    };
  } else if (metrics.roas >= 2.0 && (roasTrend === 'growing' || conversionTrend === 'growing')) {
    return {
      value: 'Growth Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, ${roasTrend === 'growing' ? 'ROAS' : 'conversions'} growing`
    };
  } else if (metrics.roas >= 3.0 && revenueShare < 0.1) {
    return {
      value: 'High Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, using only ${(revenueShare * 100).toFixed(1)}% of budget`
    };
  } else if (metrics.roas >= 4.0 && roasTrend !== 'declining' && revenueShare < 0.05) {
    return {
      value: 'Maximum Priority',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, using only ${(revenueShare * 100).toFixed(1)}% of budget`
    };
  }
  
  return {
    value: 'Maintain Priority',
    explanation: 'Standard performance and budget allocation'
  };
},

// 4. CUSTOM_TIER_BUCKET - Updated with explanations
assignCustomTierBucket(metrics, prevMetrics, allDeviceMetrics, isAllDevices, isNew) {
  let deviceFlag = 'Balanced devices';
  
  // Only check device performance patterns for "All" device records
  if (isAllDevices && allDeviceMetrics) {
    const desktopMetrics = allDeviceMetrics['desktop'];
    const mobileMetrics = allDeviceMetrics['mobile'];
    
    if (mobileMetrics && desktopMetrics) {
      if (mobileMetrics.roas > desktopMetrics.roas * 1.5 && mobileMetrics.impressions > metrics.impressions * 0.4) {
        deviceFlag = 'Mobile specialist';
      } else if (desktopMetrics.roas > mobileMetrics.roas * 2 && mobileMetrics.impressions > metrics.impressions * 0.3) {
        deviceFlag = 'Desktop only';
      }
    }
  }

  // Calculate performance trends
  const roasTrend = prevMetrics ? this.calculateTrend(metrics.roas, prevMetrics.roas) : 'new';
  const revenueTrend = prevMetrics ? this.calculateTrend(metrics.convValue, prevMetrics.convValue) : 'new';
  
  // New: Check if product is new
  if (isNew && metrics.impressions < 10000) {
    return {
      value: 'New/Low Volume',
      explanation: `New product with ${metrics.impressions} impressions`
    };
  }

  // Critical categories first
  if (metrics.roas < 0.5 && metrics.cost > 500) {
    return {
      value: 'Pause Candidates',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x with $${metrics.cost.toFixed(0)} spent`
    };
  } else if (metrics.roas >= 0.5 && metrics.roas < 1.0 && metrics.cost > 200) {
    return {
      value: 'Turnaround Required',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x - needs immediate optimization`
    };
  }

  // Performance-based categories
  const isTopPerformer = metrics.roas >= 3 && metrics.conversions >= 10 && roasTrend !== 'declining';
  const hasGrowth = revenueTrend === 'growing' && roasTrend === 'growing';
  const isConsistent = roasTrend === 'stable' || (metrics.roas >= 2 && metrics.conversions >= 5);

  if (isTopPerformer && isConsistent) {
    return {
      value: 'Hero Products',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x with ${metrics.conversions} conversions, consistent performance`
    };
  } else if (hasGrowth && metrics.conversions >= this.DEFAULTS.conversions) {
    return {
      value: 'Rising Stars',
      explanation: `${revenueTrend} revenue trend, ROAS ${metrics.roas.toFixed(1)}x`
    };
  } else if (metrics.roas >= 2 && metrics.roas <= 3 && isConsistent) {
    return {
      value: 'Steady Performers',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x, stable performance`
    };
  } else if (isAllDevices && deviceFlag === 'Mobile specialist') {
    return {
      value: 'Mobile Champions',
      explanation: `Mobile ROAS ${allDeviceMetrics.mobile?.roas?.toFixed(1) || 'N/A'}x vs Desktop ${allDeviceMetrics.desktop?.roas?.toFixed(1) || 'N/A'}x`
    };
  } else if (isAllDevices && deviceFlag === 'Desktop only') {
    return {
      value: 'Desktop Dependent',
      explanation: `Desktop ROAS ${allDeviceMetrics.desktop?.roas?.toFixed(1) || 'N/A'}x vs Mobile ${allDeviceMetrics.mobile?.roas?.toFixed(1) || 'N/A'}x`
    };
  } else if (metrics.clicks >= 30 && metrics.clicks <= 100 && metrics.roas >= 1) {
    return {
      value: 'Test & Learn',
      explanation: `${metrics.clicks} clicks, ROAS ${metrics.roas.toFixed(1)}x - ready for testing`
    };
  } else if (metrics.roas >= 1 && metrics.roas < 1.5) {
    return {
      value: 'Monitor Closely',
      explanation: `ROAS ${metrics.roas.toFixed(1)}x - requires monitoring`
    };
  }
  
  return {
    value: 'Monitor Closely',
    explanation: 'Standard monitoring required'
  };
},

  // 5. SUGGESTIONS_BUCKET - Updated with holistic performance consideration
  assignSuggestions(metrics, buckets, isAllDevices) {
    const suggestions = [];
    const appliedGroups = new Set();
    const avgROAS = this.accountMetrics.avgROAS;

    // Helper to add suggestion with mutex check
    const addSuggestion = (suggestion, priority, mutexGroup, context) => {
      if (!appliedGroups.has(mutexGroup)) {
        suggestions.push({
          suggestion: suggestion,
          priority: priority,
          context: context,
          mutexGroup: mutexGroup
        });
        appliedGroups.add(mutexGroup);
      }
    };

    // Critical: Pause Immediately
    if (buckets.investment === 'Pause Priority' || buckets.customTier === 'Pause Candidates') {
      addSuggestion(
        'Pause Immediately',
        'Critical',
        'A',
        `ROAS: ${metrics.roas.toFixed(1)}x, $${metrics.cost.toFixed(0)} spent, ${metrics.conversions} sales`
      );
    }

    // Critical: Scale Maximum Budget
    if (buckets.investment === 'Maximum Priority' && buckets.confidenceLevel === 'High') {
      const budgetUsage = ((metrics.cost / this.accountMetrics.totalCost) * 100).toFixed(0);
      addSuggestion(
        'Scale Maximum Budget',
        'Critical',
        'A',
        `ROAS: ${metrics.roas.toFixed(1)}x, using ${budgetUsage}% of total spend`
      );
    }

    // Only suggest funnel fixes if ROAS is below average OR significant untapped potential
    const hasFunnelPotential = 
      (metrics.ctr < this.DEFAULTS.ctr * 0.5) ||
      (metrics.cartRate < this.DEFAULTS.cartRate * 0.5) ||
      (metrics.checkoutRate < 30) ||
      (metrics.purchaseRate < 50);

    // High: Fix Creative Urgently (only if ROAS is suffering)
    if (metrics.roas < avgROAS && metrics.ctr < 0.2 && metrics.impressions > 10000) {
      addSuggestion(
        'Fix Creative Urgently',
        'High',
        'B',
        `CTR: ${metrics.ctr.toFixed(2)}% vs ${this.DEFAULTS.ctr.toFixed(2)}% avg, ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // High: Fix Cart Abandonment (only if ROAS is below average)
    if (metrics.roas < avgROAS && metrics.checkoutRate < 30 && metrics.addToCartConv > 30) {
      const abandonRate = 100 - metrics.checkoutRate;
      addSuggestion(
        'Fix Cart Abandonment',
        'High',
        'C',
        `${abandonRate.toFixed(0)}% abandon at cart, ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // High: Address Checkout Friction (only if impacting profitability)
    if (metrics.roas < avgROAS && metrics.purchaseRate < 50 && metrics.beginCheckoutConv > 20) {
      const failRate = 100 - metrics.purchaseRate;
      addSuggestion(
        'Address Checkout Friction',
        'High',
        'C',
        `${failRate.toFixed(0)}% fail at payment, ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // Medium: Test Price Reduction (only for truly poor converters)
    if (metrics.clicks > 200 && metrics.cvr < 0.5 && metrics.roas < 1.5) {
      addSuggestion(
        'Test Price Reduction',
        'Medium',
        'D',
        `${metrics.cvr.toFixed(1)}% CVR with $${metrics.aov.toFixed(0)} AOV, ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // Medium: Optimize Mobile Experience (only for All devices records with real issues)
    if (isAllDevices && buckets.customTier === 'Desktop Dependent' && metrics.roas < avgROAS) {
      addSuggestion(
        'Optimize Mobile Experience',
        'Medium',
        'C',
        `Mobile performance significantly lower, overall ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // Medium: Refresh Tired Creative (when CTR decline impacts performance)
    const ctrDecline = metrics.ctr < this.DEFAULTS.ctr * 0.6;
    if (ctrDecline && metrics.roas < avgROAS) {
      addSuggestion(
        'Refresh Tired Creative',
        'Medium',
        'B',
        `CTR below average, ROAS: ${metrics.roas.toFixed(1)}x`
      );
    }

    // Low: Broaden Targeting (for high performers with limited reach)
    if (metrics.cvr > 3 && metrics.roas > avgROAS && metrics.impressions < 50000) {
      addSuggestion(
        'Broaden Targeting',
        'Low',
        'A',
        `${metrics.cvr.toFixed(1)}% CVR, ROAS: ${metrics.roas.toFixed(1)}x, limited reach`
      );
    }

    // Low: Add Trust Signals (for new products with checkout issues)
    const isNew = buckets.customTier === 'New/Low Volume';
    if (isNew && metrics.checkoutRate < this.DEFAULTS.checkoutRate && metrics.roas < avgROAS) {
      addSuggestion(
        'Add Trust Signals',
        'Low',
        'C',
        `New product, ${(100 - metrics.purchaseRate).toFixed(0)}% checkout drop`
      );
    }

    // Sort by priority and return array
    return suggestions.sort((a, b) => {
      const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  },

  // Calculate Health Score (1-10)
  calculateHealthScore(metrics, buckets) {
    let score = 0;
    
    // ROAS Performance (40%)
    if (metrics.roas >= 5) score += 4;
    else if (metrics.roas >= 3) score += 2.8;
    else if (metrics.roas >= 1.5) score += 2;
    else if (metrics.roas >= 1) score += 1.2;
    else score += 0.4;
    
    // Efficiency (20%)
    const cvrScore = Math.min(1, metrics.cvr / this.DEFAULTS.cvr) * 1;
    const cpaScore = metrics.cpa > 0 ? Math.min(1, this.DEFAULTS.cpa / metrics.cpa) * 1 : 0;
    score += cvrScore + cpaScore;
    
    // Volume (20%)
    const revenueScore = Math.min(1, metrics.convValue / 10000) * 1;
    const conversionScore = Math.min(1, metrics.conversions / 50) * 1;
    score += revenueScore + conversionScore;
    
    // Stability (10%) - based on bucket confidence
    const hasData = buckets.confidenceLevel === 'High' ? 1 : buckets.confidenceLevel === 'Medium' ? 0.7 : 0.5;
    score += hasData;
    
    // Opportunity (10%)
    const hasOpportunity = buckets.investment === 'Maximum Priority' || buckets.investment === 'High Priority' ? 1 : 0.5;
    score += hasOpportunity;
    
    return Math.round(Math.max(1, Math.min(10, score)));
  }
};

// Log that V3 analyzer is loaded
console.log('[Product Buckets V3 Updated] Analyzer loaded and ready');
