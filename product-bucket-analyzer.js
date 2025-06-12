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

  // Process and create bucket analysis
  async processProductBuckets(prefix = 'acc1_') {
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

      // Get date range (last 30 days)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      // Filter data for last 30 days
      const filteredData = rawData.filter(row => {
        if (!row.Date) return false;
        const rowDate = new Date(row.Date);
        return rowDate >= startDate && rowDate <= endDate;
      });

      console.log(`[Product Buckets] Filtered to ${filteredData.length} rows for last 30 days`);

      // Calculate dynamic defaults based on data
      this.calculateDynamicDefaults(filteredData);

      // Group by product + campaign + channel
      const groupedData = this.groupByProductCampaignChannel(filteredData);

      // Calculate aggregated metrics for each group
      const bucketData = [];
      for (const [key, rows] of Object.entries(groupedData)) {
        const metrics = this.calculateAggregatedMetrics(rows);
        const buckets = this.assignBuckets(metrics);
        
        bucketData.push({
          'Product Title': metrics.productTitle,
          'Campaign Name': metrics.campaignName,
          'Channel Type': metrics.channelType,
          'Impressions': metrics.impressions,
          'Clicks': metrics.clicks,
          'Avg CPC': metrics.avgCpc,
          'Cost': metrics.cost,
          'Conversions': metrics.conversions,
          'ConvValue': metrics.convValue,
          'CTR': metrics.ctr,
          'CVR': metrics.cvr,
          'ROAS': metrics.roas,
          'AOV': metrics.aov,
          'CPA': metrics.cpa,
          'ROAS_Bucket': buckets.roasBucket,
          'ROI_Bucket': buckets.roiBucket,
          'Funnel_Bucket': buckets.funnelBucket,
          'Spend_Bucket': buckets.spendBucket,
          'Pricing_Bucket': buckets.pricingBucket,
          'Custom_Tier': buckets.customTier,
          'ML_Cluster': buckets.mlCluster
        });
      }

      // Save to IDB
      const tableName = prefix + "googleSheets_productBuckets";
      await window.embedIDB.setData(tableName, bucketData);
      
      console.log(`[Product Buckets] ✅ Saved ${bucketData.length} product buckets to ${tableName}`);
      
      // Store in global variable for easy access
      if (!window.googleSheetsData) window.googleSheetsData = {};
      window.googleSheetsData.productBuckets = bucketData;

      return bucketData;
    } catch (error) {
      console.error('[Product Buckets] Error processing buckets:', error);
      throw error;
    }
  },

  // Calculate dynamic defaults based on actual data
  calculateDynamicDefaults(data) {
    const validData = data.filter(row => row.Impressions > 0);
    
    // Calculate average CPC
    const cpcValues = validData
      .filter(row => row.Clicks > 0 && row.Cost > 0)
      .map(row => parseFloat(row.Cost) / parseFloat(row.Clicks));
    this.DEFAULTS.avgCpc = cpcValues.length > 0 
      ? cpcValues.reduce((a, b) => a + b, 0) / cpcValues.length 
      : 5;

    // Calculate average CTR
    const ctrValues = validData.map(row => parseFloat(row.CTR || 0));
    this.DEFAULTS.ctr = ctrValues.length > 0
      ? ctrValues.reduce((a, b) => a + b, 0) / ctrValues.length
      : 2;

    // Calculate median conversions
    const conversionValues = validData
      .map(row => parseFloat(row.Conversions || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.conversions = conversionValues.length > 0
      ? conversionValues[Math.floor(conversionValues.length / 2)]
      : 1;

    // Calculate median conversion value
    const convValueValues = validData
      .map(row => parseFloat(row['Conversion Value'] || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.convValue = convValueValues.length > 0
      ? convValueValues[Math.floor(convValueValues.length / 2)]
      : 100;

    // Calculate median CVR
    const cvrValues = validData
      .filter(row => parseFloat(row.Clicks) > 0)
      .map(row => parseFloat(row.CVR || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.cvr = cvrValues.length > 0
      ? cvrValues[Math.floor(cvrValues.length / 2)]
      : 2;

    // Calculate median AOV
    const aovValues = validData
      .map(row => parseFloat(row.AOV || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.aov = aovValues.length > 0
      ? aovValues[Math.floor(aovValues.length / 2)]
      : 50;

    // Calculate median CPA
    const cpaValues = validData
      .map(row => parseFloat(row.CPA || 0))
      .filter(v => v > 0)
      .sort((a, b) => a - b);
    this.DEFAULTS.cpa = cpaValues.length > 0
      ? cpaValues[Math.floor(cpaValues.length / 2)]
      : 25;

    console.log('[Product Buckets] Calculated dynamic defaults:', this.DEFAULTS);
  },

  // Group data by product + campaign + channel
  groupByProductCampaignChannel(data) {
    const grouped = {};
    
    data.forEach(row => {
      const key = `${row['Product Title']}|${row['Campaign Name']}|${row['Channel Type']}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    return grouped;
  },

  // Calculate aggregated metrics for a group of rows
  calculateAggregatedMetrics(rows) {
    const metrics = {
      productTitle: rows[0]['Product Title'] || '',
      campaignName: rows[0]['Campaign Name'] || '',
      channelType: rows[0]['Channel Type'] || '',
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      convValue: 0
    };

    // Aggregate sum metrics
    rows.forEach(row => {
      metrics.impressions += parseFloat(row.Impressions || 0);
      metrics.clicks += parseFloat(row.Clicks || 0);
      metrics.cost += parseFloat(row.Cost || 0);
      metrics.conversions += parseFloat(row.Conversions || 0);
      metrics.convValue += parseFloat(row['Conversion Value'] || 0);
    });

    // Calculate derived metrics
    metrics.avgCpc = metrics.clicks > 0 ? metrics.cost / metrics.clicks : 0;
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions) * 100 : 0;
    metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks) * 100 : 0;
    metrics.roas = metrics.cost > 0 ? metrics.convValue / metrics.cost : 0;
    metrics.aov = metrics.conversions > 0 ? metrics.convValue / metrics.conversions : 0;
    metrics.cpa = metrics.conversions > 0 ? metrics.cost / metrics.conversions : 0;

    return metrics;
  },

  // Assign all bucket categories based on metrics
  assignBuckets(metrics) {
    return {
      roasBucket: this.assignROASBucket(metrics),
      roiBucket: this.assignROIBucket(metrics),
      funnelBucket: this.assignFunnelBucket(metrics),
      spendBucket: this.assignSpendBucket(metrics),
      pricingBucket: this.assignPricingBucket(metrics),
      customTier: this.assignCustomTier(metrics),
      mlCluster: this.assignMLCluster(metrics)
    };
  },

  // (1) ROAS Bucket
  assignROASBucket(metrics) {
    const highROAS = metrics.roas >= this.DEFAULTS.roas;
    const highConversions = metrics.conversions >= this.DEFAULTS.conversions;

    if (highROAS && highConversions) return 'Top Performers';
    if (highROAS && !highConversions) return 'Efficient Low Volume';
    if (!highROAS && highConversions) return 'Volume Driver, Low ROI';
    return 'Underperformers';
  },

  // (2) ROI Bucket
  assignROIBucket(metrics) {
    const lowCPA = metrics.cpa > 0 && metrics.cpa <= this.DEFAULTS.cpa;
    const highROAS = metrics.roas >= this.DEFAULTS.roas;

    if (lowCPA && highROAS) return 'Scalable Winners';
    if (!lowCPA && highROAS) return 'Niche but Profitable';
    if (lowCPA && !highROAS) return 'Price Issue';
    return 'Waste of Spend';
  },

  // (3) Funnel Bucket
  assignFunnelBucket(metrics) {
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
    const highAOV = metrics.aov >= this.DEFAULTS.aov;
    const highCVR = metrics.cvr >= this.DEFAULTS.cvr;

    if (highAOV && highCVR) return 'Premium Product with Strong Demand';
    if (!highAOV && highCVR) return 'Low-Ticket Impulse Buys';
    if (highAOV && !highCVR) return 'Price Resistance';
    return 'Low Value No Interest';
  },

  // (6) Custom Tier
  assignCustomTier(metrics) {
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
