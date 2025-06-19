// Product Bucket Analyzer V2
// Implements new 5-bucket system with device segmentation

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

  // Helper to round to 2 decimal places
  round2(value) {
    return Math.round(value * 100) / 100;
  },

  // Process and create bucket analysis
  async processProductBuckets(prefix = 'acc1_') {
    const startTime = performance.now();
    try {
      console.log('[Product Buckets V2] Starting bucket analysis...');
      
      // Load product performance data from IDB
      const productRec = await window.embedIDB.getData(prefix + "googleSheets_productPerformance");
      if (!productRec?.data || !productRec.data.length) {
        console.error('[Product Buckets V2] No product performance data found');
        return;
      }

      const rawData = productRec.data;
      console.log(`[Product Buckets V2] Processing ${rawData.length} rows of data`);

      // DEBUG: Check sample of raw data
      console.log(`[DEBUG] Sample raw data rows:`, rawData.slice(0, 3).map(row => ({
        Product: row['Product Title']?.substring(0, 30) + '...',
        Campaign: row['Campaign Name'],
        Channel: row['Channel Type'],
        Device: row.Device
      })));

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

      console.log(`[Product Buckets V2] Last 30 days: ${last30DaysData.length} rows`);
      console.log(`[Product Buckets V2] Previous 30 days: ${prev30DaysData.length} rows`);

      // Calculate dynamic defaults based on last 30 days data
      this.calculateDynamicDefaults(last30DaysData);
      
      // Calculate account metrics for benchmarking
      this.accountMetrics = this.calculateAccountMetrics(last30DaysData);
      console.log(`[Product Buckets V2] Account Average ROAS: ${this.accountMetrics.avgROAS.toFixed(2)}x`);

      // Group data by product + campaign + channel + device
      const currentGrouped = this.groupByProductCampaignChannelDevice(last30DaysData);
      const prevGrouped = this.groupByProductCampaignChannelDevice(prev30DaysData);

      // DEBUG: Log sample of grouped keys
      const groupedKeys = Object.keys(currentGrouped);
      console.log(`[DEBUG] Total grouped keys: ${groupedKeys.length}`);
      console.log(`[DEBUG] Sample grouped keys:`, groupedKeys.slice(0, 10));

      // Get unique product+campaign+channel combinations (without device)
      const uniqueCombinations = new Set();
      const uniqueProducts = new Set();
      
      Object.keys(currentGrouped).forEach(key => {
        const parts = key.split('|');
        if (parts.length === 4) {
          const [product, campaign, channel, device] = parts;
          
          // Only add non-All combinations to uniqueCombinations
          if (campaign !== 'All' || channel !== 'All') {
            const combination = parts.slice(0, 3).join('|');
            uniqueCombinations.add(combination);
          }
          
          // Add all products for All/All processing
          uniqueProducts.add(product);
        }
      });

      // DEBUG: Log combinations found
      console.log(`[DEBUG] Unique combinations found:`, Array.from(uniqueCombinations).slice(0, 10));
      console.log(`[DEBUG] Total unique combinations (non-All): ${uniqueCombinations.size}`);
      console.log(`[DEBUG] Total unique products: ${uniqueProducts.size}`);

      // Process all combinations
      const bucketData = [];
      const allCombinations = Array.from(uniqueCombinations);
      const allProducts = Array.from(uniqueProducts);
      
      console.log(`[Product Buckets V2] Processing ${allCombinations.length} campaign combinations + ${allProducts.length} product aggregates...`);

      // Process each specific campaign/channel combination
      for (let i = 0; i < allCombinations.length; i++) {
        const baseCombination = allCombinations[i];
        const [productTitle, campaignName, channelType] = baseCombination.split('|');
        
        // DEBUG
        if (i < 5) {
          console.log(`[DEBUG] Processing combination: ${baseCombination}`);
        }
        
        const rowData = this.processProductCombination(
          baseCombination,
          productTitle,
          campaignName,
          channelType,
          currentGrouped,
          prevGrouped
        );
        
        if (rowData) {
          bucketData.push(rowData);
          if (i < 5) {
            console.log(`[DEBUG] Successfully created record for: ${baseCombination}`);
          }
        } else {
          if (i < 5) {
            console.log(`[DEBUG] No data returned for: ${baseCombination}`);
          }
        }
      }

      // Process "All/All" combinations for each product
      for (let i = 0; i < allProducts.length; i++) {
        const productTitle = allProducts[i];
        const allCombination = `${productTitle}|All|All`;
        
        const rowData = this.processProductCombination(
          allCombination,
          productTitle,
          'All',
          'All',
          currentGrouped,
          prevGrouped
        );
        
        if (rowData) {
          bucketData.push(rowData);
        }
        
        // Update progress
        const totalProcessed = bucketData.length;
        if (totalProcessed % 50 === 0 || i === allProducts.length - 1) {
          const progress = (totalProcessed / (allCombinations.length + allProducts.length) * 100).toFixed(1);
          console.log(`[Product Buckets V2] Progress: ${totalProcessed} records processed (${progress}%)`);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }

      console.log(`[Product Buckets V2] ✅ Completed processing ${bucketData.length} product bucket entries`);

      // DEBUG: Analyze the output
      const recordTypes = {
        allRecords: bucketData.filter(r => r['Campaign Name'] === 'All' && r['Channel Type'] === 'All').length,
        campaignRecords: bucketData.filter(r => r['Campaign Name'] !== 'All' || r['Channel Type'] !== 'All').length
      };
      console.log(`[DEBUG] Record breakdown:`, recordTypes);
      console.log(`[DEBUG] Sample campaign records:`, 
        bucketData
          .filter(r => r['Campaign Name'] !== 'All')
          .slice(0, 5)
          .map(r => `${r['Product Title'].substring(0, 30)}... | ${r['Campaign Name']} | ${r['Channel Type']}`)
      );

      // Save to IDB
      const tableName = prefix + "googleSheets_productBuckets_30d";
      await window.embedIDB.setData(tableName, bucketData);
      
      console.log(`[Product Buckets V2] ✅ Saved ${bucketData.length} product buckets to ${tableName}`);
      
      // Store in global variable for easy access
      if (!window.googleSheetsData) window.googleSheetsData = {};
      window.googleSheetsData.productBuckets = bucketData;

      // Add timing log
      const endTime = performance.now();
      const processingTime = ((endTime - startTime) / 1000).toFixed(3);
      console.log(`[Product Buckets V2] ✅ Processing completed in ${processingTime} seconds`);

      return bucketData;
    } catch (error) {
      console.error('[Product Buckets V2] Error processing buckets:', error);
      throw error;
    }
  },

  // Process a single product/campaign/channel combination
  processProductCombination(baseCombination, productTitle, campaignName, channelType, currentGrouped, prevGrouped) {
    // Calculate metrics for each device segment
    const deviceSegments = ['desktop', 'mobile', 'tablet', 'all_devices'];
    const deviceMetrics = {};
    const prevDeviceMetrics = {};
    
    // Calculate metrics for each actual device type
    ['DESKTOP', 'MOBILE', 'TABLET'].forEach(device => {
      const key = `${baseCombination}|${device}`;
      const currentRows = currentGrouped[key] || [];
      const prevRows = prevGrouped[key] || [];
      
      if (currentRows.length > 0) {
        deviceMetrics[device.toLowerCase()] = this.calculateAggregatedMetrics(currentRows);
      }
      if (prevRows.length > 0) {
        prevDeviceMetrics[device.toLowerCase()] = this.calculateAggregatedMetrics(prevRows);
      }
    });
    
    // Calculate all_devices aggregate
    const allCurrentRows = [];
    const allPrevRows = [];
    ['DESKTOP', 'MOBILE', 'TABLET'].forEach(device => {
      const key = `${baseCombination}|${device}`;
      if (currentGrouped[key]) allCurrentRows.push(...currentGrouped[key]);
      if (prevGrouped[key]) allPrevRows.push(...prevGrouped[key]);
    });
    
    if (allCurrentRows.length > 0) {
      deviceMetrics['all_devices'] = this.calculateAggregatedMetrics(allCurrentRows);
    } else {
      // Skip this combination if no data in current period
      return null;
    }
    
    if (allPrevRows.length > 0) {
      prevDeviceMetrics['all_devices'] = this.calculateAggregatedMetrics(allPrevRows);
    }
    
    // Build device segment buckets array
    const deviceBuckets = [];
    deviceSegments.forEach(segment => {
      const metrics = deviceMetrics[segment];
      const prevMetrics = prevDeviceMetrics[segment];
      
      if (metrics) {
        const buckets = this.assignAllBuckets(metrics, deviceMetrics);
        const prevBuckets = prevMetrics ? this.assignAllBuckets(prevMetrics, prevDeviceMetrics) : null;
        
        deviceBuckets.push({
          device_segment: segment,
          PROFITABILITY_BUCKET: buckets.profitability,
          FUNNEL_STAGE_BUCKET: buckets.funnelStage,
          INVESTMENT_BUCKET: buckets.investment,
          CUSTOM_TIER_BUCKET: buckets.customTier,
          SUGGESTIONS_BUCKET: JSON.stringify(buckets.suggestions), // Store as JSON string
          prev_PROFITABILITY_BUCKET: prevBuckets?.profitability || '',
          prev_FUNNEL_STAGE_BUCKET: prevBuckets?.funnelStage || '',
          prev_INVESTMENT_BUCKET: prevBuckets?.investment || '',
          prev_CUSTOM_TIER_BUCKET: prevBuckets?.customTier || '',
          prev_SUGGESTIONS_BUCKET: prevBuckets ? JSON.stringify(prevBuckets.suggestions) : '[]',
          HEALTH_SCORE: buckets.healthScore,
          Confidence_Level: buckets.confidenceLevel
        });
      }
    });
    
    // Use all_devices metrics for the main row
    const mainMetrics = deviceMetrics['all_devices'];
    const mainPrevMetrics = prevDeviceMetrics['all_devices'];
    
    // Build the row data
    return {
      'Product Title': productTitle,
      'Campaign Name': campaignName,
      'Channel Type': channelType,
      'Impressions': mainMetrics.impressions,
      'Clicks': mainMetrics.clicks,
      'Avg CPC': this.round2(mainMetrics.avgCpc),
      'Cost': this.round2(mainMetrics.cost),
      'Conversions': mainMetrics.conversions,
      'ConvValue': this.round2(mainMetrics.convValue),
      'CTR': this.round2(mainMetrics.ctr),
      'CVR': this.round2(mainMetrics.cvr),
      'ROAS': this.round2(mainMetrics.roas),
      'AOV': this.round2(mainMetrics.aov),
      'CPA': this.round2(mainMetrics.cpa),
      'CPM': this.round2(mainMetrics.cpm),
      // New funnel metrics
      'Cart Rate': this.round2(mainMetrics.cartRate),
      'Checkout Rate': this.round2(mainMetrics.checkoutRate),
      'Purchase Rate': this.round2(mainMetrics.purchaseRate),
      // Previous period metrics
      'prev_Impressions': mainPrevMetrics ? mainPrevMetrics.impressions : 0,
      'prev_Clicks': mainPrevMetrics ? mainPrevMetrics.clicks : 0,
      'prev_Avg CPC': mainPrevMetrics ? this.round2(mainPrevMetrics.avgCpc) : 0,
      'prev_Cost': mainPrevMetrics ? this.round2(mainPrevMetrics.cost) : 0,
      'prev_Conversions': mainPrevMetrics ? mainPrevMetrics.conversions : 0,
      'prev_ConvValue': mainPrevMetrics ? this.round2(mainPrevMetrics.convValue) : 0,
      'prev_CTR': mainPrevMetrics ? this.round2(mainPrevMetrics.ctr) : 0,
      'prev_CVR': mainPrevMetrics ? this.round2(mainPrevMetrics.cvr) : 0,
      'prev_ROAS': mainPrevMetrics ? this.round2(mainPrevMetrics.roas) : 0,
      'prev_AOV': mainPrevMetrics ? this.round2(mainPrevMetrics.aov) : 0,
      'prev_CPA': mainPrevMetrics ? this.round2(mainPrevMetrics.cpa) : 0,
      'prev_CPM': mainPrevMetrics ? this.round2(mainPrevMetrics.cpm) : 0,
      // Device segment buckets
      'buckets.device_segment': deviceBuckets
    };
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

    console.log('[Product Buckets V2] Calculated dynamic defaults:', this.DEFAULTS);
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
    
    // DEBUG: Track unique campaign/channel combinations
    const campaignChannelCombos = new Set();
    
    data.forEach(row => {
      const device = row.Device || 'UNKNOWN';
      const campaignName = row['Campaign Name'] || '';
      const channelType = row['Channel Type'] || '';
      const productTitle = row['Product Title'] || '';
      
      // Track non-All combinations
      if (campaignName !== 'All' && channelType !== 'All' && campaignName !== '' && channelType !== '') {
        campaignChannelCombos.add(`${campaignName}|${channelType}`);
      }
      
      const key = `${productTitle}|${campaignName}|${channelType}|${device}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(row);
    });

    // DEBUG: Log campaign/channel combinations found
    console.log(`[DEBUG] Raw data contains ${campaignChannelCombos.size} unique campaign/channel combos:`, 
      Array.from(campaignChannelCombos).slice(0, 10));

    // Also create "All" campaign/channel aggregates by device
    const productDeviceData = {};
    data.forEach(row => {
      const device = row.Device || 'UNKNOWN';
      const productKey = `${row['Product Title']}|${device}`;
      if (!productDeviceData[productKey]) {
        productDeviceData[productKey] = [];
      }
      productDeviceData[productKey].push(row);
    });

    // Add the "All" entries to grouped
    for (const [key, rows] of Object.entries(productDeviceData)) {
      const [productTitle, device] = key.split('|');
      const allKey = `${productTitle}|All|All|${device}`;
      grouped[allKey] = rows;
    }

    // DEBUG: Log final grouped keys
    const nonAllKeys = Object.keys(grouped).filter(k => !k.includes('|All|All|'));
    console.log(`[DEBUG] Grouped data contains ${nonAllKeys.length} non-All keys`);
    console.log(`[DEBUG] Sample non-All keys:`, nonAllKeys.slice(0, 10));

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
  assignAllBuckets(metrics, allDeviceMetrics) {
    const confidenceLevel = this.calculateConfidenceLevel(metrics);
    
    const buckets = {
      profitability: this.assignProfitabilityBucket(metrics, confidenceLevel),
      funnelStage: this.assignFunnelStageBucket(metrics),
      investment: this.assignInvestmentBucket(metrics),
      customTier: this.assignCustomTierBucket(metrics, allDeviceMetrics),
      confidenceLevel: confidenceLevel
    };
    
    // Calculate health score
    buckets.healthScore = this.calculateHealthScore(metrics, buckets);
    
    // Assign suggestions with mutex groups (returns array of objects)
    buckets.suggestions = this.assignSuggestions(metrics, buckets);
    
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

  // 1. PROFITABILITY_BUCKET
  assignProfitabilityBucket(metrics, confidenceLevel) {
    // Check for insufficient data
    if ((metrics.clicks < 10 && metrics.convValue < 500) || metrics.conversions < 3) {
      return 'Insufficient Data';
    }

    // Check for strategic flags (would need to be passed in or determined by rules)
    const isStrategic = false; // Placeholder - implement strategic detection logic

    if (metrics.roas >= 4 && (metrics.conversions >= 10 || metrics.convValue >= 5000)) {
      return 'Profit Stars';
    } else if (metrics.roas >= 2.5 && (metrics.conversions >= 5 || metrics.convValue >= 1000)) {
      return 'Strong Performers';
    } else if (metrics.roas >= 1.5 && metrics.conversions > 0) {
      return 'Steady Contributors';
    } else if (metrics.roas >= 0.8 && metrics.roas < 1.5) {
      return 'Break-Even Products';
    } else if (metrics.roas < 1 && isStrategic) {
      return 'Strategic Loss Leaders';
    } else if (metrics.roas < 0.8) {
      return 'True Losses';
    }
    
    return 'Insufficient Data';
  },

  // 2. FUNNEL_STAGE_BUCKET
  assignFunnelStageBucket(metrics) {
    const avgCTR = this.DEFAULTS.ctr;
    const avgCartRate = this.DEFAULTS.cartRate;
    const avgCheckoutRate = this.DEFAULTS.checkoutRate;
    const avgPurchaseRate = this.DEFAULTS.purchaseRate;
    
    // Check for insufficient data
    if (metrics.impressions < 5000 && metrics.clicks < 50) {
      return 'Insufficient Data';
    }

    // Full Funnel Excellence
    if (metrics.ctr >= avgCTR && 
        metrics.purchaseRate >= 60 &&
        metrics.cartRate >= avgCartRate &&
        metrics.checkoutRate >= avgCheckoutRate) {
      return 'Full Funnel Excellence';
    }

    // Ad Engagement Issue
    if (metrics.ctr < avgCTR * 0.5 && metrics.impressions >= 5000) {
      return 'Ad Engagement Issue';
    }

    // Product Page Dropoff
    if (metrics.ctr >= avgCTR && 
        metrics.cartRate < avgCartRate * 0.5 && 
        metrics.clicks >= 50) {
      return 'Product Page Dropoff';
    }

    // Cart Abandonment Problem
    if (metrics.checkoutRate < 40 && metrics.addToCartConv >= 20) {
      return 'Cart Abandonment Problem';
    }

    // Checkout Friction
    if (metrics.purchaseRate < 60 && metrics.beginCheckoutConv >= 10) {
      return 'Checkout Friction';
    }

    // Price Discovery Shock
    if (metrics.clicks >= 100 && 
        metrics.cartRate < 20 && 
        metrics.aov < this.DEFAULTS.aov * 0.7) {
      return 'Price Discovery Shock';
    }

    // Cross-Stage Issues
    const stageCount = [
      metrics.ctr < avgCTR * 0.7,
      metrics.cartRate < avgCartRate * 0.7,
      metrics.checkoutRate < avgCheckoutRate * 0.7,
      metrics.purchaseRate < avgPurchaseRate * 0.7
    ].filter(Boolean).length;
    
    if (stageCount >= 2) {
      return 'Cross-Stage Issues';
    }

    return 'Normal Performance';
  },

  // 3. INVESTMENT_BUCKET
  assignInvestmentBucket(metrics) {
    const revenueShare = metrics.cost > 0 ? metrics.convValue / metrics.cost : 0;
    const isGrowing = false; // Would need trend data
    const hasHeadroom = true; // Would need impression share data
    
    // Allocation scores based on conditions
    if (metrics.roas < 0.8 && metrics.conversions === 0 && metrics.cost > 200) {
      return 'Pause Priority'; // Score: 0
    } else if (metrics.roas < 1.2) {
      return 'Reduce Priority'; // Score: 1
    } else if (metrics.roas >= 1.2 && metrics.roas < 2) {
      return 'Maintain Priority'; // Score: 2
    } else if (metrics.roas >= 1.5 && metrics.conversions > 0 && metrics.cvr >= this.DEFAULTS.cvr) {
      return 'Growth Priority'; // Score: 3
    } else if (metrics.roas >= 2 && hasHeadroom) {
      return 'High Priority'; // Score: 4
    } else if (metrics.roas >= 3 && revenueShare < 5 && isGrowing) {
      return 'Maximum Priority'; // Score: 5
    }
    
    return 'Maintain Priority';
  },

  // 4. CUSTOM_TIER_BUCKET
  assignCustomTierBucket(metrics, allDeviceMetrics) {
    // Check device performance patterns
    const desktopMetrics = allDeviceMetrics['desktop'];
    const mobileMetrics = allDeviceMetrics['mobile'];
    
    let deviceFlag = 'Balanced devices';
    if (mobileMetrics && desktopMetrics) {
      if (mobileMetrics.roas > desktopMetrics.roas * 1.5 && mobileMetrics.impressions > metrics.impressions * 0.4) {
        deviceFlag = 'Mobile specialist';
      } else if (desktopMetrics.roas > mobileMetrics.roas * 2 && mobileMetrics.impressions > metrics.impressions * 0.3) {
        deviceFlag = 'Desktop only';
      }
    }

    // Calculate performance metrics
    const isTopPerformer = metrics.roas >= 3 && metrics.conversions >= 10; // Simplified top 5% logic
    const hasGrowth = false; // Would need trend data
    const isConsistent = true; // Would need variance calculation
    const isStrategic = false; // Would need strategic flag logic

    if (isTopPerformer && isConsistent) {
      return 'Hero Products';
    } else if (hasGrowth && metrics.conversions >= this.DEFAULTS.conversions) {
      return 'Rising Stars';
    } else if (metrics.roas >= 2 && metrics.roas <= 3 && isConsistent) {
      return 'Steady Performers';
    } else if (deviceFlag === 'Mobile specialist') {
      return 'Mobile Champions';
    } else if (deviceFlag === 'Desktop only') {
      return 'Desktop Dependent';
    } else if (metrics.clicks >= 30 && metrics.clicks <= 60) {
      return 'Test & Learn';
    } else if (isStrategic) {
      return 'Strategic Holdings';
    }
    
    return 'Watch List';
  },

  // 5. SUGGESTIONS_BUCKET with mutex groups (returns array of objects)
  assignSuggestions(metrics, buckets) {
    const suggestions = [];
    const appliedGroups = new Set();

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
    if (buckets.investment === 'Pause Priority') {
      addSuggestion(
        'Pause Immediately',
        'Critical',
        'A',
        `ROAS: ${metrics.roas.toFixed(1)}x, $${metrics.cost.toFixed(0)} spent, ${metrics.conversions} sales`
      );
    }

    // Critical: Scale Maximum Budget
    if (buckets.investment === 'Maximum Priority' && buckets.confidenceLevel === 'High') {
      const budgetUsage = 3; // Placeholder - would need actual budget data
      addSuggestion(
        'Scale Maximum Budget',
        'Critical',
        'A',
        `ROAS: ${metrics.roas.toFixed(1)}x, using ${budgetUsage}% of limit`
      );
    }

    // High: Fix Creative Urgently
    if (metrics.ctr < 0.2 && metrics.impressions > 10000) {
      addSuggestion(
        'Fix Creative Urgently',
        'High',
        'B',
        `CTR: ${metrics.ctr.toFixed(2)}% vs ${this.DEFAULTS.ctr.toFixed(2)}% avg`
      );
    }

    // High: Fix Cart Abandonment
    if (metrics.checkoutRate < 30 && metrics.addToCartConv > 30) {
      const abandonRate = 100 - metrics.checkoutRate;
      addSuggestion(
        'Fix Cart Abandonment',
        'High',
        'C',
        `${abandonRate.toFixed(0)}% abandon at cart (avg: 40%)`
      );
    }

    // High: Address Checkout Friction
    if (metrics.purchaseRate < 50 && metrics.beginCheckoutConv > 20) {
      const failRate = 100 - metrics.purchaseRate;
      addSuggestion(
        'Address Checkout Friction',
        'High',
        'C',
        `${failRate.toFixed(0)}% fail at payment (avg: 20%)`
      );
    }

    // Medium: Test Price Reduction
    if (metrics.clicks > 200 && metrics.cvr < 0.2) {
      addSuggestion(
        'Test Price Reduction',
        'Medium',
        'D',
        `${metrics.cvr.toFixed(1)}% CVR with $${metrics.aov.toFixed(0)} AOV`
      );
    }

    // Medium: Optimize Mobile Experience
    const mobileMetrics = buckets.customTier === 'Desktop Dependent' ? { cvr: 0.5 } : null; // Placeholder
    const desktopMetrics = { cvr: 2.1 }; // Placeholder
    if (mobileMetrics && metrics.impressions * 0.4 > 1000) {
      addSuggestion(
        'Optimize Mobile Experience',
        'Medium',
        'C',
        `Mobile: ${mobileMetrics.cvr.toFixed(1)}% vs Desktop: ${desktopMetrics.cvr.toFixed(1)}%`
      );
    }

    // Medium: Refresh Tired Creative
    const ctrDecline = 40; // Placeholder - would need trend data
    if (ctrDecline > 40) {
      addSuggestion(
        'Refresh Tired Creative',
        'Medium',
        'B',
        `CTR: ${(metrics.ctr * 1.67).toFixed(1)}%→${metrics.ctr.toFixed(1)}% last 30d`
      );
    }

    // Low: Broaden Targeting
    const impressionShare = 4; // Placeholder
    if (metrics.cvr > 3 && impressionShare < 5) {
      addSuggestion(
        'Broaden Targeting',
        'Low',
        'A',
        `${metrics.cvr.toFixed(1)}% CVR but <${impressionShare}% reach`
      );
    }

    // Low: Add Trust Signals
    const isNew = metrics.impressions < 10000; // Simplified new product check
    if (isNew && metrics.checkoutRate < this.DEFAULTS.checkoutRate) {
      addSuggestion(
        'Add Trust Signals',
        'Low',
        'C',
        `New + ${(100 - metrics.purchaseRate).toFixed(0)}% checkout drop`
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
    
    // Stability (10%) - simplified without variance data
    const hasData = metrics.impressions > 1000 && metrics.clicks > 10 ? 1 : 0.5;
    score += hasData;
    
    // Opportunity (10%)
    const hasOpportunity = buckets.investment === 'Maximum Priority' || buckets.investment === 'High Priority' ? 1 : 0.5;
    score += hasOpportunity;
    
    return Math.round(Math.max(1, Math.min(10, score)));
  }
};

// Log that V2 analyzer is loaded
console.log('[Product Buckets V2] Analyzer loaded and ready');
