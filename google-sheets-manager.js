// Progress Management System
const ProgressManager = {
steps: [
  { key: 'extract', label: 'Extracting Sheet ID', weight: 5 },
  { key: 'fetch', label: 'Downloading sheet data', weight: 15 },
  { key: 'parse', label: 'Processing data rows', weight: 15 },
  { key: 'analyze', label: 'Analyzing product buckets', weight: 20 },
  { key: 'store', label: 'Saving to local storage', weight: 10 },
  { key: 'buckets', label: 'Creating product bucket analysis', weight: 35 }
],
  
  currentProgress: 0,
  currentStep: null,
  
  init() {
    this.currentProgress = 0;
    this.currentStep = null;
    this.updateUI();
  },
  
  startStep(stepKey, customMessage = null) {
    const step = this.steps.find(s => s.key === stepKey);
    if (!step) return;
    
    this.currentStep = stepKey;
    
    // Calculate progress up to this step
    const stepIndex = this.steps.findIndex(s => s.key === stepKey);
    this.currentProgress = this.steps.slice(0, stepIndex).reduce((sum, s) => sum + s.weight, 0);
    
    this.updateUI(customMessage || step.label);
    this.updateStepStatus(stepKey, 'active');
  },
  
  completeStep(stepKey) {
    const step = this.steps.find(s => s.key === stepKey);
    if (!step) return;
    
    const stepIndex = this.steps.findIndex(s => s.key === stepKey);
    this.currentProgress = this.steps.slice(0, stepIndex + 1).reduce((sum, s) => sum + s.weight, 0);
    
    this.updateUI();
    this.updateStepStatus(stepKey, 'completed');
  },
  
  updateProgress(stepKey, progressWithinStep) {
    const step = this.steps.find(s => s.key === stepKey);
    if (!step) return;
    
    const stepIndex = this.steps.findIndex(s => s.key === stepKey);
    const baseProgress = this.steps.slice(0, stepIndex).reduce((sum, s) => sum + s.weight, 0);
    
    this.currentProgress = baseProgress + (step.weight * progressWithinStep / 100);
    this.updateUI();
  },
  
  updateUI(customMessage = null) {
    const loader = document.getElementById("overlayLoader");
    if (!loader) return;
    
    // Show progress elements
    const progressContainer = loader.querySelector('.progress-container');
    const progressText = loader.querySelector('.progress-text');
    const loadingSteps = loader.querySelector('.loading-steps');
    const subtitle = loader.querySelector('.loading-subtitle');
    
    if (progressContainer) {
      progressContainer.style.display = 'block';
      const progressBar = progressContainer.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.width = `${Math.min(this.currentProgress, 100)}%`;
      }
    }
    
    if (progressText) {
      progressText.style.display = 'block';
      progressText.textContent = `${Math.round(this.currentProgress)}% complete`;
    }
    
    if (loadingSteps) {
      loadingSteps.style.display = 'block';
    }
    
    if (customMessage && subtitle) {
      subtitle.textContent = customMessage;
    }
    
    // Estimate time remaining
    if (this.currentProgress > 5) {
      const estimated = this.estimateTimeRemaining();
      if (estimated && subtitle) {
        subtitle.textContent = `${customMessage || 'Processing...'} • ${estimated}`;
      }
    }
  },
  
  updateStepStatus(stepKey, status) {
    const stepEl = document.querySelector(`[data-step="${stepKey}"]`);
    if (stepEl) {
      stepEl.className = `loading-step ${status}`;
    }
  },
  
  estimateTimeRemaining() {
    if (!this.startTime || this.currentProgress <= 5) return null;
    
    const elapsed = Date.now() - this.startTime;
    const rate = this.currentProgress / elapsed;
    const remaining = (100 - this.currentProgress) / rate;
    
    if (remaining < 5000) return "Almost done";
    if (remaining < 30000) return `~${Math.round(remaining / 1000)}s remaining`;
    if (remaining < 60000) return "~1 min remaining";
    return `~${Math.round(remaining / 60000)} min remaining`;
  },
  
  setStartTime() {
    this.startTime = Date.now();
  },

  processInChunks: async function(data, processor, options = {}) {
    const {
      chunkSize = 100,           // Process 100 items at a time
      stepKey = 'analyze',       // Which step this belongs to
      stepLabel = 'Processing',  // Custom label for this step
      yieldInterval = 10         // Yield every 10ms
    } = options;
    
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }
    
    this.startStep(stepKey, `${stepLabel} ${data.length} items...`);
    
    const results = [];
    const totalChunks = Math.ceil(data.length / chunkSize);
    let processedChunks = 0;
    
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      
      // Process this chunk
      const chunkResults = await processor(chunk, i);
      if (Array.isArray(chunkResults)) {
        results.push(...chunkResults);
      } else if (chunkResults) {
        results.push(chunkResults);
      }
      
      // Update progress
      processedChunks++;
      const progressPercent = (processedChunks / totalChunks) * 100;
      this.updateProgress(stepKey, progressPercent);
      
      // Update UI with current status
      const processed = Math.min(i + chunkSize, data.length);
      this.updateUI(`${stepLabel} ${processed}/${data.length} items...`);
      
      // Yield control back to browser every few chunks
      if (processedChunks % 3 === 0 || processedChunks === totalChunks) {
        await this.yield(yieldInterval);
      }
    }
    
    this.completeStep(stepKey);
    return results;
  },

  // Yield control back to the browser
  yield: function(ms = 10) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};


// Google Sheets Data Fetching Functions
window.googleSheetsManager = {
  // Dynamic configuration
  currentSheetId: null,
  currentSheetUrl: null,
  
  // Column mappings (same as before)
PRODUCT_COLUMNS: [
  'Product Title', 'Date', 'Product ID', 'Product Brand', 
  'Product Type L1', 'Product Type L2', 'Product Type L3', 
  'Product Type L4', 'Product Type L5', 'Product Channel', 
  'Product Channel Exclusivity', 'Product Condition', 'Product Country', 
  'Campaign Name', 'Channel Type', 'Device',
  'Impressions', 'Clicks', 
  'Cost', 'Conversions', 'Conversion Value', 'CTR', 'CVR', 
  'ROAS', 'AOV', 'CPA',
  // New columns for cart and checkout tracking
  'Add to Cart Conv', 'Add to Cart Conv Value',
  'Begin Checkout Conv', 'Begin Checkout Conv Value', 
  'Purchase Conv', 'Purchase Conv Value',
  // Add Custom Attributes
  'Custom Attribute 0', 'Custom Attribute 1', 'Custom Attribute 2', 
  'Custom Attribute 3', 'Custom Attribute 4'
],
  
  LOCATION_COLUMNS: [
    'Campaign Name', 'Campaign Type', 'Country', 'State', 
    'Region', 'City', 'Location Type', 'Impressions', 
    'Clicks', 'Cost', 'Conversions', 'Revenue', 
    'CTR', 'CVR', 'ROAS'
  ],

  SEARCH_INSIGHTS_COLUMNS: [
  'Campaign Name', 'Campaign ID', 'Category Label', 
  'Clicks', 'Impr', 'Conv', 'Value', 'Bucket', 'Distance'
],

SEARCH_TERMS_COLUMNS: [
  'Campaign Name', 'Campaign ID', 'Search Term',
  'Clicks', 'Impr', 'Conv', 'Value'
],
  
  // Extract sheet ID from URL
  extractSheetId: function(url) {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  },
  
  // Fetch sheet using Google Visualization API (no CORS issues!)
  fetchSheetByName: async function(sheetId, sheetName) {
    try {
      console.log(`[Google Sheets] Fetching "${sheetName}" sheet...`);
      
      // Use Google Visualization API which supports sheet names and has CORS enabled
      const query = encodeURIComponent('SELECT *');
      const url = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}&tq=${query}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        // Try alternative format
        const altUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const altResponse = await fetch(altUrl);
        if (!altResponse.ok) {
          throw new Error(`Failed to fetch ${sheetName} sheet. Make sure the sheet name is correct and the document is shared.`);
        }
        return await altResponse.text();
      }
      
      return await response.text();
    } catch (error) {
      console.error(`[Google Sheets] Error fetching ${sheetName}:`, error);
      throw error;
    }
  },
  
  // Parse CSV for specific columns
  parseSheetData: function(csvText, sheetName, columns) {
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (!results.data || results.data.length === 0) {
            reject(new Error(`No data found in ${sheetName} sheet`));
            return;
          }
          
          // Log headers for debugging
          const headers = Object.keys(results.data[0] || {});
          console.log(`[Google Sheets] ${sheetName} headers:`, headers);
          
          // Check if we have the expected columns
          const missingColumns = columns.filter(col => 
            !headers.some(h => h.toLowerCase() === col.toLowerCase())
          );
          
          if (missingColumns.length > 0) {
            console.warn(`[Google Sheets] Missing columns in ${sheetName}:`, missingColumns);
          }
          
          // Filter and map data
          const filteredData = results.data.map(row => {
            const filteredRow = {};
            columns.forEach(col => {
              // Case-insensitive column matching
              const matchingKey = Object.keys(row).find(key => 
                key.toLowerCase() === col.toLowerCase()
              );
              filteredRow[col] = matchingKey ? row[matchingKey] : '';
            });
            return filteredRow;
          });
          
          // Remove empty rows
          const nonEmptyData = filteredData.filter(row => 
            Object.values(row).some(val => val !== '' && val !== null && val !== undefined)
          );
          
          console.log(`[Google Sheets] ✓ Parsed ${nonEmptyData.length} rows from ${sheetName}`);
          resolve(nonEmptyData);
        },
        error: (error) => {
          console.error(`[Google Sheets] Parse error for ${sheetName}:`, error);
          reject(error);
        }
      });
    });
  },
  
// Main function to fetch and store data from URL
fetchAndStoreFromUrl: async function(url, prefix = 'acc1_') {
  const loader = document.getElementById("overlayLoader");
  try {
    // Initialize progress tracking
    ProgressManager.init();
    ProgressManager.setStartTime();
    
    // Show loader with enhanced UI
    if (loader) {
      const loaderText = loader.querySelector('.apple-loading-text');
      if (loaderText) {
        loaderText.textContent = 'Processing Google Sheets';
      }
      loader.style.display = "flex";
      loader.style.opacity = "1";
    }
    
    // STEP 1: Extract sheet ID
    ProgressManager.startStep('extract', 'Validating Google Sheets URL...');
    const sheetId = this.extractSheetId(url);
    if (!sheetId) {
      throw new Error('Invalid Google Sheets URL');
    }
    
    this.currentSheetId = sheetId;
    this.currentSheetUrl = url;
    console.log('[Google Sheets] Sheet ID:', sheetId);
    ProgressManager.completeStep('extract');
    
// STEP 2: Fetch sheets data
ProgressManager.startStep('fetch', 'Downloading sheet data from Google...');
let productCSV, locationCSV, searchInsightsCSV, searchTermsCSV;

try {
  // Try to fetch all sheets
  const fetchPromises = [
    this.fetchSheetByName(sheetId, 'Enhanced Product Performance'),
    this.fetchSheetByName(sheetId, 'Location Revenue').catch(() => null), // Don't fail if missing
    this.fetchSheetByName(sheetId, 'Search Insights').catch(() => null), // Don't fail if missing
    this.fetchSheetByName(sheetId, 'Search Terms').catch(() => null) // Don't fail if missing
  ];
  
  // Update progress during fetch
  setTimeout(() => ProgressManager.updateProgress('fetch', 30), 1000);
  setTimeout(() => ProgressManager.updateProgress('fetch', 60), 3000);
  setTimeout(() => ProgressManager.updateProgress('fetch', 90), 6000);
  
  [productCSV, locationCSV, searchInsightsCSV, searchTermsCSV] = await Promise.all(fetchPromises);
} catch (fetchError) {
  // Try alternative sheet names for product sheet
  ProgressManager.updateUI('Trying alternative sheet names...');
  
  try {
    productCSV = await this.fetchSheetByName(sheetId, 'EnhancedProductPerformance');
  } catch (e) {
    try {
      productCSV = await this.fetchSheetByName(sheetId, 'Enhanced_Product_Performance');
    } catch (e2) {
      try {
        productCSV = await this.fetchSheetByName(sheetId, 'Product Performance');
      } catch (e3) {
        throw new Error('Could not find "Enhanced Product Performance" sheet');
      }
    }
  }
  
  // Try to get Location Revenue if we haven't already
  if (!locationCSV) {
    try {
      locationCSV = await this.fetchSheetByName(sheetId, 'LocationRevenue');
    } catch (e) {
      try {
        locationCSV = await this.fetchSheetByName(sheetId, 'Location_Revenue');
      } catch (e2) {
        console.warn('[Google Sheets] Location Revenue sheet not found - continuing without it');
        locationCSV = null;
      }
    }
  }
}

// Check if at least product data was fetched
if (!productCSV) {
  throw new Error('Could not find required product performance sheet');
}

ProgressManager.completeStep('fetch');
    
    // STEP 3: Parse the CSV data
    ProgressManager.startStep('parse', 'Processing and validating data rows...');
    
    // Parse with progress updates
    setTimeout(() => ProgressManager.updateProgress('parse', 50), 500);
    
// Parse product data (required)
const productData = await this.parseSheetData(productCSV, 'Enhanced Product Performance', this.PRODUCT_COLUMNS);

// Parse location data if available (optional)
let locationData = [];
if (locationCSV) {
  try {
    locationData = await this.parseSheetData(locationCSV, 'Location Revenue', this.LOCATION_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Location Revenue data:', error);
    locationData = [];
  }
}

// Parse search insights data if available (optional)
let searchInsightsData = [];
if (searchInsightsCSV) {
  try {
    searchInsightsData = await this.parseSheetData(searchInsightsCSV, 'Search Insights', this.SEARCH_INSIGHTS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Insights data:', error);
    searchInsightsData = [];
  }
}

// Parse search terms data if available (optional)
let searchTermsData = [];
if (searchTermsCSV) {
  try {
    searchTermsData = await this.parseSheetData(searchTermsCSV, 'Search Terms', this.SEARCH_TERMS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Terms data:', error);
    searchTermsData = [];
  }
}
    
ProgressManager.completeStep('parse');

// STEP 5: Store basic data only (product buckets will be created and stored in STEP 6)
ProgressManager.startStep('store', 'Saving basic data to local storage...');

// Process search terms if we have data from either sheet
let processedSearchTerms = [];
if (searchInsightsData.length > 0 || searchTermsData.length > 0) {
  processedSearchTerms = await this.processSearchTermsData(searchInsightsData, searchTermsData);
}

const basicSavePromises = [
  window.embedIDB.setData(prefix + "googleSheets_productPerformance", productData),
  window.embedIDB.setData(prefix + "googleSheets_locationRevenue", locationData),
  window.embedIDB.setData(prefix + "googleSheets_searchTerms_365d", processedSearchTerms),
  window.embedIDB.setData(prefix + "googleSheets_config", {
    url: url,
    sheetId: sheetId,
    lastUpdated: Date.now()
  })
];

await Promise.all(basicSavePromises);
ProgressManager.completeStep('store');
    
    console.log('[Google Sheets] ✅ All data fetched and stored successfully');
    
// Store basic data in global variable (buckets will be added after STEP 6)
window.googleSheetsData = {
  productPerformance: productData,
  locationRevenue: locationData,
  searchTerms: processedSearchTerms,
  productBuckets: [] // Will be populated in STEP 6
};
    
// STEP 6: Advanced Product Bucket Analysis (the heavy 76-second process)
ProgressManager.startStep('buckets', 'Starting advanced product bucket analysis...');

let finalBuckets = [];
if (productData.length > 0) {
  try {
    // Disable auto-processing to prevent conflicts
    window._skipProductBucketAutoProcessing = true;
    
    // Call the original product bucket analyzer but with progress tracking
    finalBuckets = await this.runIntegratedBucketAnalysis(prefix);
    console.log(`[Integrated Process] ✅ Advanced analysis completed: ${finalBuckets.length} final buckets`);
    
    // Update global storage with final buckets
    window.googleSheetsData.productBuckets = finalBuckets;
    
  } catch (analysisError) {
    console.warn('[Integrated Process] Advanced analysis failed:', analysisError);
  }
}

ProgressManager.completeStep('buckets');

// Update final status with bucket count
const statusEl = document.getElementById('googleAdsStatus');
if (statusEl) {
statusEl.innerHTML = `
  <div style="color: #4CAF50; font-weight: 500;">
    ✓ Google Ads Data Uploaded Successfully
  </div>
  <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
Product Performance: ${productData.length} rows<br>
${locationData.length > 0 ? `Location Revenue: ${locationData.length} rows<br>` : 'Location Revenue: Not available<br>'}
${processedSearchTerms.length > 0 ? `Search Terms (365d): ${processedSearchTerms.length} queries<br>` : 'Search Terms: Not available<br>'}
    ${finalBuckets.length > 0 ? `Product Buckets (30d): ${finalBuckets.length} analyzed<br>` : ''}
    <span style="font-size: 0.7rem;">Last updated: ${new Date().toLocaleString()}</span>
  </div>
`;
}

// NOW show completion
if (loader) {
  const loaderText = loader.querySelector('.apple-loading-text');
  const subtitle = loader.querySelector('.loading-subtitle');
  if (loaderText) loaderText.textContent = 'Upload Complete!';
  if (subtitle) subtitle.textContent = `Successfully processed ${productData.length + locationData.length + finalBuckets.length} records`;
  
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => { 
      loader.style.display = "none";
      // Reset UI for next time
      const progressContainer = loader.querySelector('.progress-container');
      const progressText = loader.querySelector('.progress-text');
      const loadingSteps = loader.querySelector('.loading-steps');
      if (progressContainer) progressContainer.style.display = 'none';
      if (progressText) progressText.style.display = 'none';
      if (loadingSteps) loadingSteps.style.display = 'none';
      if (loaderText) loaderText.textContent = 'Loading data…';
      if (subtitle) subtitle.textContent = '';
    }, 500);
  }, 2000);
}

return { productData, locationData, productBuckets: finalBuckets };
  } catch (error) {
    console.error('[Google Sheets] ❌ Failed to fetch data:', error);
    
    // Update status with error
    const statusEl = document.getElementById('googleAdsStatus');
    if (statusEl) {
      statusEl.innerHTML = `
        <div style="color: #f44336;">
          ✗ Error: ${error.message}
        </div>
        <div style="margin-top: 8px; font-size: 0.8rem; color: #666;">
          Make sure:
          <ul style="margin: 4px 0; padding-left: 20px;">
            <li>The sheet is shared with "Anyone with the link"</li>
            <li>Sheet names are exactly "Enhanced Product Performance" and "Location Revenue"</li>
          </ul>
        </div>
      `;
    }
    
    // Hide loader on error
    if (loader) {
      const loaderText = loader.querySelector('.apple-loading-text');
      const subtitle = loader.querySelector('.loading-subtitle');
      if (loaderText) loaderText.textContent = 'Upload Failed';
      if (subtitle) subtitle.textContent = error.message;
      
      setTimeout(() => {
        loader.style.opacity = "0";
        setTimeout(() => { 
          loader.style.display = "none";
          if (loaderText) loaderText.textContent = 'Loading data…';
          if (subtitle) subtitle.textContent = '';
        }, 500);
      }, 3000); // Show error for 3 seconds
    }
    
    throw error;
  }
},
  
  // Optional: Method to check if data exists in IDB
hasStoredData: async function(prefix = 'acc1_') {
  try {
    const [products, locations] = await Promise.all([
      window.embedIDB.getData(prefix + "googleSheets_productPerformance"),
      window.embedIDB.getData(prefix + "googleSheets_locationRevenue")
    ]);
    
    return products?.data?.length > 0 && locations?.data?.length > 0;
  } catch (error) {
    return false;
  }
},
  
  // Optional: Method to get stored configuration
getStoredConfig: async function(prefix = 'acc1_') {
  try {
    const config = await window.embedIDB.getData(prefix + "googleSheets_config");
    return config?.data || null;
  } catch (error) {
    return null;
  }
},
  // Add a fetchAndStoreAll method that was referenced in the embed code
fetchAndStoreAll: async function(prefix = 'acc1_') {
  try {
    // Check if we have stored config to get the URL
    const config = await this.getStoredConfig(prefix);
    if (config && config.url) {
      console.log('[Google Sheets] Refreshing existing data from stored config');
      return await this.fetchAndStoreFromUrl(config.url, prefix);
    } else {
      console.log('[Google Sheets] No stored configuration found - user has not uploaded sheets yet');
      // Return empty data structure instead of throwing error
      return { 
        productData: [], 
        locationData: [] 
      };
    }
  } catch (error) {
    console.log('[Google Sheets] No Google Sheets data available:', error.message);
    // Return empty data structure on any error
    return { 
      productData: [], 
      locationData: [] 
    };
  }
},

// NEW: Process product buckets in chunks to prevent browser freeze
processProductBucketsChunk: async function(chunk, startIndex) {
  const buckets = [];
  
  for (let i = 0; i < chunk.length; i++) {
    const product = chunk[i];
    
    try {
      // Create product bucket with comprehensive analysis
      const bucket = {
        id: startIndex + i,
        productTitle: product['Product Title'] || '',
        productId: product['Product ID'] || '',
        brand: product['Product Brand'] || '',
        type1: product['Product Type L1'] || '',
        type2: product['Product Type L2'] || '',
        type3: product['Product Type L3'] || '',
        campaign: product['Campaign Name'] || '',
        channel: product['Product Channel'] || '',
        country: product['Product Country'] || '',
        
        // Performance metrics
        impressions: parseFloat(product['Impressions']) || 0,
        clicks: parseFloat(product['Clicks']) || 0,
        cost: parseFloat(product['Cost']) || 0,
        conversions: parseFloat(product['Conversions']) || 0,
        conversionValue: parseFloat(product['Conversion Value']) || 0,
        ctr: parseFloat(product['CTR']) || 0,
        cvr: parseFloat(product['CVR']) || 0,
        roas: parseFloat(product['ROAS']) || 0,
        aov: parseFloat(product['AOV']) || 0,
        cpa: parseFloat(product['CPA']) || 0,
        
        // Analysis fields
        category: this.categorizeProduct(product),
        performance: this.calculatePerformance(product),
        efficiency: this.calculateEfficiency(product),
        
        // Date processing
        date: product['Date'] || '',
        processedAt: new Date().toISOString()
      };
      
      buckets.push(bucket);
    } catch (error) {
      console.warn(`[Product Buckets] Error processing product at index ${startIndex + i}:`, error);
    }
  }
  
  return buckets;
},

// Process and merge search terms data
processSearchTermsData: async function(searchInsightsData, searchTermsData) {
  console.log('[Search Terms] Processing search terms data...');
  
  // Create a map to aggregate data by query
  const queryMap = new Map();
  
  // Helper to parse numeric values
  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  };
  
  // Process Search Insights data
  searchInsightsData.forEach(row => {
    const query = (row['Category Label'] || '').trim();
    const clicks = parseNumber(row['Clicks']);
    
    if (query && clicks > 1) { // Only process if clicks > 1
      if (!queryMap.has(query)) {
        queryMap.set(query, {
          query: query,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          value: 0
        });
      }
      
      const data = queryMap.get(query);
      data.clicks += clicks;
      data.impressions += parseNumber(row['Impr']);
      data.conversions += parseNumber(row['Conv']);
      data.value += parseNumber(row['Value']);
    }
  });
  
  // Process Search Terms data
  searchTermsData.forEach(row => {
    const query = (row['Search Term'] || '').trim();
    const clicks = parseNumber(row['Clicks']);
    
    if (query && clicks > 1) { // Only process if clicks > 1
      if (!queryMap.has(query)) {
        queryMap.set(query, {
          query: query,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          value: 0
        });
      }
      
      const data = queryMap.get(query);
      data.clicks += clicks;
      data.impressions += parseNumber(row['Impr']);
      data.conversions += parseNumber(row['Conv']);
      data.value += parseNumber(row['Value']);
    }
  });
  
  // Calculate total value for percentage calculation
  let totalValue = 0;
  queryMap.forEach(data => {
    totalValue += data.value;
  });
  
  // Convert map to array
  const searchTermsArray = Array.from(queryMap.values());
  
  // Sort by value descending
  searchTermsArray.sort((a, b) => b.value - a.value);
  
  // Separate blank and non-blank queries for ranking
  const nonBlankQueries = searchTermsArray.filter(item => 
    item.query.toLowerCase() !== 'blank'
  );
  const blankQueries = searchTermsArray.filter(item => 
    item.query.toLowerCase() === 'blank'
  );
  
  // Assign Top_Bucket values to non-blank queries
  const processedArray = nonBlankQueries.map((data, index) => {
    let topBucket = '';
    
    if (index === 0) topBucket = 'Top1';
    else if (index === 1) topBucket = 'Top2';
    else if (index === 2) topBucket = 'Top3';
    else if (index === 3) topBucket = 'Top4';
    else if (index === 4) topBucket = 'Top5';
    else if (index >= 5 && index <= 9) topBucket = 'Top10';
    // Queries beyond top 10 don't get a Top_Bucket value
    
    return {
      Query: data.query,
      Clicks: Math.round(data.clicks),
      Impressions: Math.round(data.impressions),
      Conversions: this.round2(data.conversions),
      Value: this.round2(data.value),
      '% of all revenue': totalValue > 0 ? this.round2(data.value / totalValue) : 0,
      Top_Bucket: topBucket
    };
  });
  
  // Add blank queries back without Top_Bucket
  const blankProcessed = blankQueries.map(data => ({
    Query: data.query,
    Clicks: Math.round(data.clicks),
    Impressions: Math.round(data.impressions),
    Conversions: this.round2(data.conversions),
    Value: this.round2(data.value),
    '% of all revenue': totalValue > 0 ? this.round2(data.value / totalValue) : 0,
    Top_Bucket: '' // No top bucket for blank queries
  }));
  
  // Combine all queries (non-blank first, then blank)
  const finalArray = [...processedArray, ...blankProcessed];
  
  console.log(`[Search Terms] Processed ${finalArray.length} unique search terms`);
  console.log(`[Search Terms] Total value: ${this.round2(totalValue)}`);
  if (nonBlankQueries.length > 0) {
    console.log(`[Search Terms] Top query: "${nonBlankQueries[0].query}" with value ${this.round2(nonBlankQueries[0].value)}`);
  }
  
  return finalArray;
},

// Helper to round to 2 decimal places (if not already exists)
round2(value) {
  return Math.round(value * 100) / 100;
},

// Helper: Categorize products
categorizeProduct: function(product) {
  const brand = (product['Product Brand'] || '').toLowerCase();
  const type1 = (product['Product Type L1'] || '').toLowerCase();
  const type2 = (product['Product Type L2'] || '').toLowerCase();
  
  // Brand-based categorization
  if (brand.includes('premium') || brand.includes('luxury')) return 'Premium';
  if (brand.includes('budget') || brand.includes('value')) return 'Budget';
  
  // Type-based categorization
  if (type1.includes('electronic') || type1.includes('tech')) return 'Electronics';
  if (type1.includes('clothing') || type1.includes('apparel')) return 'Fashion';
  if (type1.includes('home') || type1.includes('furniture')) return 'Home & Garden';
  if (type1.includes('beauty') || type1.includes('cosmetic')) return 'Beauty';
  if (type1.includes('sport') || type1.includes('fitness')) return 'Sports';
  
  return 'General';
},

// Helper: Calculate performance tier
calculatePerformance: function(product) {
  const roas = parseFloat(product['ROAS']) || 0;
  const ctr = parseFloat(product['CTR']) || 0;
  const cvr = parseFloat(product['CVR']) || 0;
  
  // High performance: Good ROAS + good engagement
  if (roas >= 4 && ctr >= 2 && cvr >= 2) return 'High';
  if (roas >= 2.5 && ctr >= 1.5 && cvr >= 1) return 'Medium-High';
  if (roas >= 1.5 && ctr >= 1 && cvr >= 0.5) return 'Medium';
  if (roas >= 1 && ctr >= 0.5) return 'Low-Medium';
  
  return 'Low';
},

calculateEfficiency: function(product) {
  const cost = parseFloat(product['Cost']) || 0;
  const conversions = parseFloat(product['Conversions']) || 0;
  const clicks = parseFloat(product['Clicks']) || 0;
  const impressions = parseFloat(product['Impressions']) || 0;
  
  if (cost === 0 || impressions === 0) return 'Unknown';
  
  const cpc = cost / Math.max(clicks, 1);
  const ctr = (clicks / impressions) * 100;
  const conversionRate = conversions / Math.max(clicks, 1) * 100;
  
  // Efficiency based on cost effectiveness and conversion performance
  if (cpc < 0.5 && ctr > 3 && conversionRate > 2) return 'Very Efficient';
  if (cpc < 1 && ctr > 2 && conversionRate > 1) return 'Efficient';
  if (cpc < 2 && ctr > 1 && conversionRate > 0.5) return 'Moderate';
  if (cpc < 5 && ctr > 0.5) return 'Low Efficiency';
  
  return 'Poor';
},

// NEW: Save all product buckets to ONE table with progressive updates
saveProductBucketsToSingleTable: async function(productBuckets, prefix) {
  if (!productBuckets || productBuckets.length === 0) {
    return;
  }

  console.log(`[Single Table Storage] Starting progressive save of ${productBuckets.length} product buckets...`);
  
  const batchSize = 200; // Process in larger batches since we're appending
  const totalBatches = Math.ceil(productBuckets.length / batchSize);
  const finalTableKey = prefix + "googleSheets_productBuckets_30d";
  
  // Clear any existing data first
  try {
    await window.embedIDB.deleteData(finalTableKey);
  } catch (e) {
    // Table might not exist yet, that's fine
  }
  
  let accumulatedBuckets = [];
  
  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const startIdx = batchIndex * batchSize;
    const endIdx = Math.min(startIdx + batchSize, productBuckets.length);
    const batch = productBuckets.slice(startIdx, endIdx);
    
    // Add current batch to accumulated data
    accumulatedBuckets.push(...batch);
    
    try {
      // Save all accumulated data so far to the single table
      await window.embedIDB.setData(finalTableKey, accumulatedBuckets);
      
      // Update progress (30% base + 70% for this operation)
      const progress = ((batchIndex + 1) / totalBatches) * 100;
      ProgressManager.updateProgress('store', 30 + (progress * 0.7));
      ProgressManager.updateUI(`Saving product buckets: ${endIdx}/${productBuckets.length} records saved`);
      
      console.log(`[Single Table Storage] Saved batch ${batchIndex + 1}/${totalBatches}: ${accumulatedBuckets.length} total records in table`);
      
      // Yield control every few batches
      if (batchIndex % 2 === 0) {
        await ProgressManager.yield(15);
      }
      
    } catch (error) {
      console.error(`[Single Table Storage] Error saving batch ${batchIndex}:`, error);
      throw error;
    }
  }
  
  console.log(`[Single Table Storage] ✅ Successfully saved ${productBuckets.length} product buckets to single table: ${finalTableKey}`);
},

// NEW: Run integrated bucket analysis with progress tracking
runIntegratedBucketAnalysis: async function(prefix) {
  try {
    console.log('[Integrated Analysis] Starting product bucket analysis...');
    
    if (!window.productBucketAnalyzer) {
      console.warn('[Integrated Analysis] Product bucket analyzer not available');
      return [];
    }
    
    // Temporarily override console.log to capture progress from the original analyzer
    const originalLog = console.log;
    let lastProgress = 0;
    
    console.log = function(...args) {
      const message = args.join(' ');
      
      // Look for progress indicators in the logs
      if (message.includes('Processing') && message.includes('rows')) {
        const match = message.match(/(\d+)\s*rows/);
        if (match) {
          const rows = parseInt(match[1]);
          const progress = Math.min((rows / 50000) * 100, 90); // Estimate progress
          if (progress > lastProgress) {
            ProgressManager.updateProgress('buckets', progress);
            ProgressManager.updateUI(`Advanced analysis: processing ${rows} records...`);
            lastProgress = progress;
          }
        }
      }
      
      // Call original console.log
      originalLog.apply(console, args);
    };
    
    // Run the original product bucket analyzer
    const result = await window.productBucketAnalyzer.processProductBuckets(prefix);
    
    // Restore original console.log
    console.log = originalLog;
    
    console.log(`[Integrated Analysis] ✅ Analysis completed successfully`);
    return result || [];
    
  } catch (error) {
    console.error('[Integrated Analysis] Error:', error);
    return [];
  }
}
  
};
