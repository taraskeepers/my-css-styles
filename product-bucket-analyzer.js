// Product Bucket Analyzer
// Processes Google Sheets product performance data and creates bucketed analysis

window.productBucketAnalyzer = {
  // Default thresholds for metric evaluation
  DEFAULTS: {
    impressions: 100,
    clicks: 10,
    cost: 100,
    conversions: null, // Will be calculated as median
    convValue: null, // Will be calculated as median
    ctr: null, // Will be calculated as average
    cvr: null, // Will be calculated as median
    roas: 3,
    aov: null, // Will be calculated as median
    cpa: null, // Will be calculated as median
    avgCpc: null // Will be calculated as average
  },
  // Data collection thresholds
  DATA_COLLECTION_THRESHOLDS: {
    minImpressions: 100,
    minClicks: 10,
    minCost: 50,
    minConvValue: 100
  },

  // Helper to round to 2 decimal places
  round2(value) {
    return Math.round(value * 100) / 100;
  },

  // Process and create bucket analysis
  async processProductBuckets(prefix = 'acc1_') {
    const startTime = performance.now();
    try {
      console.log('[Product Buckets] Starting bucket analysis...');
      
      // Load product performance data from IDB
      const productRec = await window.embedIDB.getData(prefix + "googleSheets_productPerformance");
      if (!productRec?.data || !productRec.data.length) {
        console.error('[Product Buckets] No product performance data found');
        return;
      }

      const rawData = productRec.data;
      console.log(`[Product Buckets] Processing ${rawData.length} rows of data`);

      // Find the max date in the data
      const allDates = rawData.map(r => new Date(r.Date)).filter(d => !isNaN(d));
      const maxDataDate = new Date(Math.max(...allDates));
      
      // Calculate date ranges
      const endDate = maxDataDate;
      const startDate30 = new Date(maxDataDate);
      startDate30.setDate(startDate30.getDate() - 30);
      const startDate60 = new Date(maxDataDate);
      startDate60.setDate(startDate60.getDate() - 60);

      // Filter data for different periods
      const last30DaysData = rawData.filter(row => {
        if (!row.Date) return false;
        const rowDate = new Date(row.Date);
        return rowDate > startDate30 && rowDate <= endDate;
      });

      const prev30DaysData = rawData.filter(row => {
        if (!row.Date) return false;
        const rowDate = new Date(row.Date);
        return rowDate > startDate60 && rowDate <= startDate30;
      });

      const last60DaysData = rawData.filter(row => {
        if (!row.Date) return false;
        const rowDate = new Date(row.Date);
        return rowDate > startDate60 && rowDate <= endDate;
      });

      console.log(`[Product Buckets] Last 30 days: ${last30DaysData.length} rows`);
      console.log(`[Product Buckets] Previous 30 days: ${prev30DaysData.length} rows`);
      console.log(`[Product Buckets] Last 60 days: ${last60DaysData.length} rows`);

      // Calculate dynamic defaults based on last 30 days data
      this.calculateDynamicDefaults(last30DaysData);

      // Group data by product + campaign + channel for both periods
      const currentGrouped = this.groupByProductCampaignChannel(last30DaysData);
      const prevGrouped = this.groupByProductCampaignChannel(prev30DaysData);

      // Build a set of all unique keys from both periods
      const allKeys = new Set([...Object.keys(currentGrouped), ...Object.keys(prevGrouped)]);

      // Calculate aggregated metrics and buckets for each group
      const bucketData = [];
      
      for (const key of allKeys) {
        const currentRows = currentGrouped[key] || [];
        const prevRows = prevGrouped[key] || [];
        const isAllRow = key.endsWith('|All|All');
        
        // Skip if no data in current period
        if (currentRows.length === 0) continue;
        
        // Calculate current period metrics
        const currentMetrics = this.calculateAggregatedMetrics(currentRows, isAllRow);
        const currentBuckets = this.assignBuckets(currentMetrics);
        
        // Calculate previous period metrics (might be empty)
        let prevMetrics = null;
        let prevBuckets = null;
        if (prevRows.length > 0) {
          prevMetrics = this.calculateAggregatedMetrics(prevRows, isAllRow);
          prevBuckets = this.assignBuckets(prevMetrics);
        }
        
        // Calculate historic bucket data
        const historicBuckets = this.calculateHistoricBuckets(
          key, 
          last60DaysData, 
          startDate30, 
          endDate
        );
        
        // Build the row data
const rowData = {
          'Product Title': currentMetrics.productTitle,
          'Campaign Name': currentMetrics.campaignName,
          'Channel Type': currentMetrics.channelType,
          'Impressions': currentMetrics.impressions,
          'Clicks': currentMetrics.clicks,
          'Avg CPC': this.round2(currentMetrics.avgCpc),
          'Cost': this.round2(currentMetrics.cost),
          'Conversions': currentMetrics.conversions,
          'ConvValue': this.round2(currentMetrics.convValue),
          'CTR': this.round2(currentMetrics.ctr),
          'CVR': this.round2(currentMetrics.cvr),
          'ROAS': this.round2(currentMetrics.roas),
          'AOV': this.round2(currentMetrics.aov),
          'CPA': this.round2(currentMetrics.cpa),
          'CPM': this.round2(currentMetrics.cpm),
          'ROAS_Bucket': currentBuckets.roasBucket,
          'ROI_Bucket': currentBuckets.roiBucket,
          'Funnel_Bucket': currentBuckets.funnelBucket,
          'Spend_Bucket': currentBuckets.spendBucket,
          'Pricing_Bucket': currentBuckets.pricingBucket,
          'Custom_Tier': currentBuckets.customTier,
          'ML_Cluster': currentBuckets.mlCluster,
          'Suggestions': currentBuckets.suggestions.join('; '),
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
          'prev_ROAS_Bucket': prevBuckets ? prevBuckets.roasBucket : '',
          'prev_ROI_Bucket': prevBuckets ? prevBuckets.roiBucket : '',
          'prev_Funnel_Bucket': prevBuckets ? prevBuckets.funnelBucket : '',
          'prev_Spend_Bucket': prevBuckets ? prevBuckets.spendBucket : '',
          'prev_Pricing_Bucket': prevBuckets ? prevBuckets.pricingBucket : '',
          'prev_Custom_Tier': prevBuckets ? prevBuckets.customTier : '',
          'prev_ML_Cluster': prevBuckets ? prevBuckets.mlCluster : '',
          'prev_Suggestions': prevBuckets ? prevBuckets.suggestions.join('; ') : '',
          // Historic bucket data
          'historic_data.buckets': historicBuckets
        };
        
        bucketData.push(rowData);
      }

      // Save to IDB with new table name
      const tableName = prefix + "googleSheets_productBuckets_30d";
      await window.embedIDB.setData(tableName, bucketData);
      
      console.log(`[Product Buckets] ✅ Saved ${bucketData.length} product buckets to ${tableName}`);
      
      // Store in global variable for easy access
      if (!window.googleSheetsData) window.googleSheetsData = {};
      window.googleSheetsData.productBuckets = bucketData;

      // Add timing log
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(3);
      console.log(`[Product Buckets] ✅ Processing completed in ${processingTime} seconds`);

      return bucketData;
    } catch (error) {
      console.error('[Product Buckets] Error processing buckets:', error);
      throw error;
    }
  },

// Calculate historic bucket data for each day in the last 30 days
  calculateHistoricBuckets(key, allData, startDate30, endDate) {
    const [productTitle, campaignName, channelType] = key.split('|');
    const historicData = [];
    
    // Find the actual date range of available data
    const dataForKey = allData.filter(row => {
      if (campaignName === 'All' && channelType === 'All') {
        return row['Product Title'] === productTitle;
      }
      return row['Product Title'] === productTitle &&
             row['Campaign Name'] === campaignName &&
             row['Channel Type'] === channelType;
    });
    
    if (dataForKey.length === 0) return historicData;
    
    // Get min and max dates from actual data
    const dataDates = dataForKey.map(r => new Date(r.Date)).filter(d => !isNaN(d));
    const minDataDate = new Date(Math.min(...dataDates));
    const maxDataDate = new Date(Math.max(...dataDates));
    
    // For each day in the last 30 days (or from when data starts, whichever is later)
    const currentDate = new Date(startDate30);
    currentDate.setDate(currentDate.getDate() + 1); // Start from day 1 of last 30 days
    
    // Adjust start date if data doesn't go back that far
    if (currentDate < minDataDate) {
      currentDate.setTime(minDataDate.getTime());
    }
    
    while (currentDate <= endDate) {
      // Calculate date range for this specific day (up to 30 days back, but not before data starts)
      const histStartDate = new Date(currentDate);
      histStartDate.setDate(histStartDate.getDate() - 30);
      
      // Don't go before the earliest data point
      if (histStartDate < minDataDate) {
        histStartDate.setTime(minDataDate.getTime());
        histStartDate.setDate(histStartDate.getDate() - 1); // Adjust for > comparison in filter
      }
      
      // Filter data for this window
      const windowData = allData.filter(row => {
        if (!row.Date) return false;
        const rowDate = new Date(row.Date);
        return rowDate > histStartDate && rowDate <= currentDate;
      });
      
      // Filter for this specific product/campaign/channel combination
      let relevantData = [];
      if (campaignName === 'All' && channelType === 'All') {
        // "All" row - aggregate all data for this product
        relevantData = windowData.filter(row => row['Product Title'] === productTitle);
      } else {
        // Specific campaign/channel combination
        relevantData = windowData.filter(row => 
          row['Product Title'] === productTitle &&
          row['Campaign Name'] === campaignName &&
          row['Channel Type'] === channelType
        );
      }
      
      // If we have data, calculate metrics and buckets
      if (relevantData.length > 0) {
        const metrics = this.calculateAggregatedMetrics(relevantData, campaignName === 'All');
        const buckets = this.assignBuckets(metrics);
        
historicData.push({
  date: currentDate.toISOString().split('T')[0], // YYYY-MM-DD format
  Custom_Tier: buckets.customTier,
  Funnel_Bucket: buckets.funnelBucket,
  ML_Cluster: buckets.mlCluster,
  Pricing_Bucket: buckets.pricingBucket,
  ROAS_Bucket: buckets.roasBucket,
  ROI_Bucket: buckets.roiBucket,
  Spend_Bucket: buckets.spendBucket,
  Suggestions: buckets.suggestions.join('; '), // Add suggestions
  days_of_data: Math.floor((currentDate - Math.max(histStartDate, minDataDate - 86400000)) / 86400000) // Track how many days of data were used
});
      }
      
      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return historicData;
  },

  // Calculate dynamic defaults based on actual data
  calculateDynamicDefaults(data) {
    // Helper function to parse numbers with commas and dollar signs
    const parseNumber = (value) => {
      if (!value) return 0;
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    const validData = data.filter(row => parseNumber(row.Impressions) > 0);
    
    // Calculate average CPC
    const cpcValues = validData
      .filter(row => parseNumber(row.Clicks) > 0 && parseNumber(row.Cost) > 0)
      .map(row => parseNumber(row.Cost) / parseNumber(row.Clicks));
    this.DEFAULTS.avgCpc = cpcValues.length > 0 
      ? cpcValues.reduce((a, b) => a + b, 0) / cpcValues.length 
      : 5;

    // Calculate average CTR
    const ctrValues = validData.map(row => parseNumber(row.CTR));
    this.DEFAULTS.ctr = ctrValues.length > 0
      ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length
      : 2;

    // Calculate median conversions
    const conversionValues = validData
      .map(row => parseNumber(row.Conversions))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.conversions = conversionValues.length > 0
      ? conversionValues[Math.floor(conversionValues.length / 2)]
      : 1;

    // Calculate median conversion value
    const convValueValues = validData
      .map(row => parseNumber(row['Conversion Value']))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.convValue = convValueValues.length > 0
      ? convValueValues[Math.floor(convValueValues.length / 2)]
      : 100;

    // Calculate median CVR
    const cvrValues = validData
      .filter(row => parseNumber(row.Clicks) > 0)
      .map(row => parseNumber(row.CVR))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.cvr = cvrValues.length > 0
      ? cvrValues[Math.floor(cvrValues.length / 2)]
      : 2;

    // Calculate median AOV
    const aovValues = validData
      .map(row => parseNumber(row.AOV))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.aov = aovValues.length > 0
      ? aovValues[Math.floor(aovValues.length / 2)]
      : 50;

    // Calculate median CPA
    const cpaValues = validData
      .map(row => parseNumber(row.CPA))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.cpa = cpaValues.length > 0
      ? cpaValues[Math.floor(cpaValues.length / 2)]
      : 25;

    console.log('[Product Buckets] Calculated dynamic defaults:', this.DEFAULTS);
  },

  // Group data by product + campaign + channel AND by product only
  groupByProductCampaignChannel(data) {
    const grouped = {};
    const productOnly = {}; // For "All" aggregation
    
    data.forEach(row => {
      // Original grouping by product + campaign + channel
      const key = `${row['Product Title']}|${row['Campaign Name']}|${row['Channel Type']}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
      
      // Additional grouping by product only (for "All" row)
      const productKey = row['Product Title'];
      if (!productOnly[productKey]) {
        productOnly[productKey] = [];
      }
      productOnly[productKey].push(row);
    });
    
    // Add the "All" entries to the main grouped object
    for (const [productTitle, rows] of Object.entries(productOnly)) {
      const allKey = `${productTitle}|All|All`;
      grouped[allKey] = rows;
    }

    return grouped;
  },

  // Calculate aggregated metrics for a group of rows
  calculateAggregatedMetrics(rows, isAllRow = false) {
    const metrics = {
      productTitle: rows[0]['Product Title'] || '',
      campaignName: isAllRow ? 'All' : (rows[0]['Campaign Name'] || ''),
      channelType: isAllRow ? 'All' : (rows[0]['Channel Type'] || ''),
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      convValue: 0
    };

    // Helper function to parse numbers with commas and dollar signs
    const parseNumber = (value) => {
      if (!value) return 0;
      // Convert to string, remove commas and dollar signs, then parse
      return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
    };

    // Aggregate sum metrics
    rows.forEach(row => {
      metrics.impressions += parseNumber(row.Impressions);
      metrics.clicks += parseNumber(row.Clicks);
      metrics.cost += parseNumber(row.Cost);
      metrics.conversions += parseNumber(row.Conversions);
      metrics.convValue += parseNumber(row['Conversion Value']);
    });

    // Calculate derived metrics
    metrics.avgCpc = metrics.clicks > 0 ? metrics.cost / metrics.clicks : 0;
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
metrics.roas = metrics.cost > 0 ? metrics.convValue / metrics.cost : 0;
    metrics.aov = metrics.conversions > 0 ? metrics.convValue / metrics.conversions : 0;
    metrics.cpa = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;
    metrics.cpm = metrics.impressions > 0 ? (metrics.cost / metrics.impressions) * 1000 : 0;

    return metrics;
  },

  // Assign all bucket categories based on metrics
assignBuckets(metrics) {
    const buckets = {
      roasBucket: this.assignROASBucket(metrics),
      roiBucket: this.assignROIBucket(metrics),
      funnelBucket: this.assignFunnelBucket(metrics),
      spendBucket: this.assignSpendBucket(metrics),
      pricingBucket: this.assignPricingBucket(metrics),
      customTier: this.assignCustomTier(metrics),
      mlCluster: this.assignMLCluster(metrics)
    };
    
    // Assign suggestions based on cross-bucket analysis
    buckets.suggestions = this.assignSuggestions(metrics, buckets);
    
    return buckets;
  },

  // (1) ROAS Bucket
assignROASBucket(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const highROAS = metrics.roas >= this.DEFAULTS.roas;
    const highConversions = metrics.conversions >= this.DEFAULTS.conversions;

    if (highROAS && highConversions) return 'Top Performers';
    if (highROAS && !highConversions) return 'Efficient Low Volume';
    if (!highROAS && highConversions) return 'Volume Driver, Low ROI';
    return 'Underperformers';
  },

  // (2) ROI Bucket
assignROIBucket(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const lowCPA = metrics.cpa > 0 && metrics.cpa <= this.DEFAULTS.cpa;
    const highROAS = metrics.roas >= this.DEFAULTS.roas;

    if (lowCPA && highROAS) return 'Scalable Winners';
    if (!lowCPA && highROAS) return 'Niche but Profitable';
    if (lowCPA && !highROAS) return 'Price Issue';
    return 'Waste of Spend';
  },

  // (3) Funnel Bucket
assignFunnelBucket(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const highImpressions = metrics.impressions >= this.DEFAULTS.impressions;
    const highClicks = metrics.clicks >= this.DEFAULTS.clicks;
    const highCTR = metrics.ctr >= this.DEFAULTS.ctr;
    const highCVR = metrics.cvr >= this.DEFAULTS.cvr;
    const lowCPA = metrics.cpa > 0 && metrics.cpa <= this.DEFAULTS.cpa;
    const highConversions = metrics.conversions >= this.DEFAULTS.conversions;

    // Priority order checks
    if (highCTR && highCVR) return 'Funnel Champions';
    if (highCVR && lowCPA) return 'Most Efficient';
    if (highImpressions && !highClicks) return 'Needs Better Ad Creative';
    if (highClicks && !highCTR) return 'Poor Targeting';
    if (highCTR && !highCVR) return 'Weak Landing Page or Offer';
    if (highConversions && !lowCPA) return 'Valuable but Costly';
    if (highCTR && !highCVR) return 'UX Optimization Needed';
    if (!highCTR && highCVR) return 'Ad Creative Problem';
    if (!highCTR && !highCVR) return 'Funnel Friction';
    
    return 'Funnel Friction'; // Default
  },

  // (4) Spend Bucket
assignSpendBucket(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const highCost = metrics.cost >= this.DEFAULTS.cost;
    const highReturn = metrics.convValue >= (metrics.cost * this.DEFAULTS.roas);
    const lowImpressions = metrics.impressions < this.DEFAULTS.impressions;
    const zeroConversions = metrics.conversions === 0;

    if (lowImpressions) return 'Zombies';
    if (highCost && zeroConversions) return 'Parasites';
    if (highCost && !highReturn) return 'Unprofitable Spend';
    if (!highCost && highReturn) return 'Hidden Gems';
    if (highCost && highReturn) return 'Scalable with Caution';
    return 'Low Priority';
  },

  // (5) Pricing Bucket
assignPricingBucket(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const highAOV = metrics.aov >= this.DEFAULTS.aov;
    const highCVR = metrics.cvr >= this.DEFAULTS.cvr;

    if (highAOV && highCVR) return 'Premium Product with Strong Demand';
    if (!highAOV && highCVR) return 'Low-Ticket Impulse Buys';
    if (highAOV && !highCVR) return 'Price Resistance';
    return 'Low Value No Interest';
  },

  // (6) Custom Tier
assignCustomTier(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const lowCPA = metrics.cpa > 0 && metrics.cpa <= this.DEFAULTS.cpa;
    const highCVR = metrics.cvr >= this.DEFAULTS.cvr;
    const highSpend = metrics.cost >= this.DEFAULTS.cost * 2; // 2x default as "high"
    const lowROAS = metrics.roas < this.DEFAULTS.roas;
    const lowConversions = metrics.conversions < this.DEFAULTS.conversions;
    const lowData = metrics.clicks < this.DEFAULTS.clicks;
    const highCTR = metrics.ctr >= this.DEFAULTS.ctr;

    // Note: Top 10% calculation would require all products data
    // For now, using high ROAS and conversions as proxy
    if (metrics.roas >= this.DEFAULTS.roas * 2 && metrics.conversions >= this.DEFAULTS.conversions * 2) {
      return 'Hero Product';
    }
    if (lowCPA && highCVR) return 'Scale-Up';
    if (highSpend && lowROAS && lowConversions) return 'Wasted Spend';
    if (lowData) return 'Testing Product';
    if (highCTR && !highCVR) return 'Creative Review';
    if (highCVR && lowCPA) return 'Budget Booster';
    
    return 'Testing Product'; // Default
  },

  // (7) ML Cluster
assignMLCluster(metrics) {
    // Check for insufficient data
    if ((metrics.impressions < this.DATA_COLLECTION_THRESHOLDS.minImpressions || 
         metrics.clicks < this.DATA_COLLECTION_THRESHOLDS.minClicks || 
         metrics.cost < this.DATA_COLLECTION_THRESHOLDS.minCost) &&
        !(metrics.conversions > 0 && metrics.convValue > this.DATA_COLLECTION_THRESHOLDS.minConvValue)) {
      return 'Collecting Data';
    }

    const lowCPC = metrics.avgCpc < this.DEFAULTS.avgCpc;
    const highCPC = metrics.avgCpc > this.DEFAULTS.avgCpc * 1.5;
    const noConversions = metrics.conversions === 0;
    const highConvValue = metrics.convValue >= this.DEFAULTS.convValue * 2;
    const extremeROAS = metrics.roas > this.DEFAULTS.roas * 5;
    const fewClicks = metrics.clicks < this.DEFAULTS.clicks / 2;
    const goodCTR = metrics.ctr >= this.DEFAULTS.ctr;
    const poorCVR = metrics.cvr < this.DEFAULTS.cvr;

    if (lowCPC && highConvValue) return 'Undervalued Winners';
    if (highCPC && noConversions) return 'Expensive Waste';
    if (extremeROAS && fewClicks) return 'High ROAS Anomalies';
    if (goodCTR && poorCVR) return 'Drop-Off Cluster';
    
    return 'Optimizable'; // Default for medium performance
  },

// Assign suggestions based on cross-bucket analysis
  assignSuggestions(metrics, buckets) {
    const suggestions = [];
    
    // Get dynamic thresholds for comparison
    const avgCTR = this.DEFAULTS.ctr;
    const avgCVR = this.DEFAULTS.cvr;
    const avgCPC = this.DEFAULTS.avgCpc;
    
    // Priority 1: Pause & Reallocate Budget
    if (metrics.roas < 1 && 
        buckets.roasBucket === 'Underperformers' && 
        buckets.roiBucket === 'Waste of Spend' &&
        (buckets.spendBucket === 'Parasites' || (metrics.conversions === 0 && metrics.cost > 100))) {
      suggestions.push('Pause & Reallocate Budget');
    }
    
    // Priority 2: Scale Aggressively  
    if (metrics.roas > 3 &&
        (buckets.roasBucket === 'Top Performers' || buckets.roiBucket === 'Scalable Winners') &&
        metrics.cvr >= this.DEFAULTS.cvr) {
      suggestions.push('Scale Aggressively');
    }
    
    // Priority 3: Fix Ad Creative (Low CTR)
    if (metrics.ctr < avgCTR * 0.5 &&
        metrics.impressions > 1000 &&
        metrics.conversions > 0 &&
        (buckets.funnelBucket === 'Needs Better Ad Creative' || buckets.funnelBucket === 'Ad Creative Problem')) {
      suggestions.push('Fix Ad Creative (Low CTR)');
    }
    
    // Priority 4: Optimize Landing/Offer (Low CVR)
    if (metrics.ctr > avgCTR &&
        metrics.cvr < avgCVR * 0.5 &&
        metrics.clicks > 50 &&
        (buckets.funnelBucket === 'Weak Landing Page or Offer' || buckets.funnelBucket === 'UX Optimization Needed')) {
      suggestions.push('Optimize Landing/Offer (Low CVR)');
    }
    
    // Priority 5: Refine Targeting & Efficiency
    if (metrics.avgCpc > avgCPC * 1.5 &&
        (metrics.ctr < avgCTR || metrics.cvr < avgCVR) &&
        (buckets.funnelBucket === 'Poor Targeting' || buckets.mlCluster === 'Expensive Waste')) {
      const clickValueIndex = metrics.clicks > 0 ? (metrics.convValue / metrics.clicks) / metrics.avgCpc : 0;
      if (clickValueIndex < 1.5) {
        suggestions.push('Refine Targeting & Efficiency');
      }
    }
    
    // Priority 6: Increase Visibility First
    if (metrics.impressions < 500 ||
        metrics.cost < 50 ||
        (buckets.spendBucket === 'Zombies' || (buckets.customTier === 'Testing Product' && metrics.clicks < 10))) {
      suggestions.push('Increase Visibility First');
    }
    
    return suggestions;
  }
};

// Auto-initialize when Google Sheets data is loaded
(function() {
  // Check if data is already loaded
  if (window.googleSheetsData?.productPerformance?.length > 0) {
    const prefix = window.dataPrefix ? window.dataPrefix.split('_pr')[0] + '_' : 'acc1_';
    window.productBucketAnalyzer.processProductBuckets(prefix)
      .then(() => console.log('[Product Buckets] Auto-processing completed'))
      .catch(err => console.error('[Product Buckets] Auto-processing failed:', err));
  }
  
  // Listen for Google Sheets data updates
  const originalFetchAndStore = window.googleSheetsManager?.fetchAndStoreFromUrl;
  if (originalFetchAndStore) {
    window.googleSheetsManager.fetchAndStoreFromUrl = async function(url, prefix) {
      const result = await originalFetchAndStore.call(this, url, prefix);
      
      // Process buckets after data is loaded
      if (result?.productData?.length > 0) {
        setTimeout(() => {
          window.productBucketAnalyzer.processProductBuckets(prefix)
            .then(() => console.log('[Product Buckets] Processing completed after data load'))
            .catch(err => console.error('[Product Buckets] Processing failed:', err));
        }, 1000); // Small delay to ensure data is fully saved
      }
      
      return result;
    };
  }
})();
