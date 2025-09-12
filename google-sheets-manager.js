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
  this.fetchSheetByName(sheetId, 'Location Revenue').catch(() => null),
  this.fetchSheetByName(sheetId, 'Search Insights').catch(() => null),
  this.fetchSheetByName(sheetId, 'Search Terms').catch(() => null),
  // New 30-day sheets
  this.fetchSheetByName(sheetId, 'Search Insights 30').catch(() => null),
  this.fetchSheetByName(sheetId, 'Search Terms 30').catch(() => null),
  // New 90-day sheets
  this.fetchSheetByName(sheetId, 'Search Insights 90').catch(() => null),
  this.fetchSheetByName(sheetId, 'Search Terms 90').catch(() => null)
];
  
  // Update progress during fetch
  setTimeout(() => ProgressManager.updateProgress('fetch', 30), 1000);
  setTimeout(() => ProgressManager.updateProgress('fetch', 60), 3000);
  setTimeout(() => ProgressManager.updateProgress('fetch', 90), 6000);
  
  [productCSV, locationCSV, searchInsightsCSV, searchTermsCSV, 
 searchInsights30CSV, searchTerms30CSV, 
 searchInsights90CSV, searchTerms90CSV] = await Promise.all(fetchPromises);
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

// Parse 30-day search data if available
let searchInsights30Data = [];
if (searchInsights30CSV) {
  try {
    searchInsights30Data = await this.parseSheetData(searchInsights30CSV, 'Search Insights 30', this.SEARCH_INSIGHTS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Insights 30 data:', error);
    searchInsights30Data = [];
  }
}

let searchTerms30Data = [];
if (searchTerms30CSV) {
  try {
    searchTerms30Data = await this.parseSheetData(searchTerms30CSV, 'Search Terms 30', this.SEARCH_TERMS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Terms 30 data:', error);
    searchTerms30Data = [];
  }
}

// Parse 90-day search data if available
let searchInsights90Data = [];
if (searchInsights90CSV) {
  try {
    searchInsights90Data = await this.parseSheetData(searchInsights90CSV, 'Search Insights 90', this.SEARCH_INSIGHTS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Insights 90 data:', error);
    searchInsights90Data = [];
  }
}

let searchTerms90Data = [];
if (searchTerms90CSV) {
  try {
    searchTerms90Data = await this.parseSheetData(searchTerms90CSV, 'Search Terms 90', this.SEARCH_TERMS_COLUMNS);
  } catch (error) {
    console.warn('[Google Sheets] Failed to parse Search Terms 90 data:', error);
    searchTerms90Data = [];
  }
}
    
ProgressManager.completeStep('parse');

// STEP 5: Store basic data only (product buckets will be created and stored in STEP 6)
ProgressManager.startStep('store', 'Saving basic data to local storage...');

// Process search terms for all time periods
let processedSearchTerms = [];
let processedSearchTerms30d = [];
let processedSearchTerms90d = [];

// Process 365d (default) search terms
if (searchInsightsData.length > 0 || searchTermsData.length > 0) {
  processedSearchTerms = await this.processSearchTermsData(searchInsightsData, searchTermsData);
}

// Process 30d search terms
if (searchInsights30Data.length > 0 || searchTerms30Data.length > 0) {
  processedSearchTerms30d = await this.processSearchTermsData(searchInsights30Data, searchTerms30Data);
}

// Process 90d search terms
if (searchInsights90Data.length > 0 || searchTerms90Data.length > 0) {
  processedSearchTerms90d = await this.processSearchTermsData(searchInsights90Data, searchTerms90Data);
}

const basicSavePromises = [
  window.embedIDB.setData(prefix + "googleSheets_productPerformance", productData),
  window.embedIDB.setData(prefix + "googleSheets_locationRevenue", locationData),
  window.embedIDB.setData(prefix + "googleSheets_searchTerms_365d", processedSearchTerms),
  window.embedIDB.setData(prefix + "googleSheets_searchTerms_30d", processedSearchTerms30d),
  window.embedIDB.setData(prefix + "googleSheets_searchTerms_90d", processedSearchTerms90d),
  window.embedIDB.setData(prefix + "googleSheets_config", {
    url: url,
    sheetId: sheetId,
    lastUpdated: Date.now()
  })
];

await Promise.all(basicSavePromises);

// Calculate and store averages
if (productData.length > 0) {
  try {
    await this.calculateProductAverages(productData, prefix);
  } catch (avgError) {
    console.warn('[Product Averages] Failed to calculate averages:', avgError);
  }
}

ProgressManager.completeStep('store');

console.log('[Google Sheets] ✅ All data fetched and stored successfully');
    
// Store basic data in global variable (buckets will be added after STEP 6)
window.googleSheetsData = {
  productPerformance: productData,
  locationRevenue: locationData,
  searchTerms: processedSearchTerms,
  searchTerms30d: processedSearchTerms30d,
  searchTerms90d: processedSearchTerms90d,
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
${processedSearchTerms.length > 0 ? `Search Terms (365d): ${processedSearchTerms.length} queries<br>` : 'Search Terms (365d): Not available<br>'}
${processedSearchTerms30d.length > 0 ? `Search Terms (30d): ${processedSearchTerms30d.length} queries<br>` : 'Search Terms (30d): Not available<br>'}
${processedSearchTerms90d.length > 0 ? `Search Terms (90d): ${processedSearchTerms90d.length} queries<br>` : 'Search Terms (90d): Not available<br>'}
    ${finalBuckets.length > 0 ? `Product Buckets (30d): ${finalBuckets.length} analyzed<br>` : ''}
    <span style="font-size: 0.7rem;">Last updated: ${new Date().toLocaleString()}</span>
  </div>
`;
}

// Don't hide loader yet - just update text
if (loader) {
  const loaderText = loader.querySelector('.apple-loading-text');
  const subtitle = loader.querySelector('.loading-subtitle');
  if (loaderText) loaderText.textContent = 'Google Sheets Data Uploaded';
  if (subtitle) subtitle.textContent = `Processed ${productData.length + locationData.length + finalBuckets.length} records`;
  // DON'T HIDE - Title Analyzer will handle it if enabled
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

fetchAndStoreAll: async function(url, prefix = null) {
  // Use current project prefix if not provided
  if (!prefix) {
    prefix = window.dataPrefix || 'acc1_pr1_';
  }
  
  // Ensure prefix includes project number
  if (!prefix.includes('_pr')) {
    const currentProjectNum = window.filterState?.activeProjectNumber || 1;
    prefix = `${prefix}pr${currentProjectNum}_`;
  }
  
  console.log('[Google Sheets] fetchAndStoreAll called with URL for prefix:', prefix);
  
  // This should ONLY be called when user explicitly provides a URL
  if (!url) {
    throw new Error('No Google Sheets URL provided to fetchAndStoreAll');
  }
  
  return await this.fetchAndStoreFromUrl(url, prefix);
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
  
  // Create maps for different aggregation levels
  const allQueryMap = new Map();      // Combined all channels
  const shoppingQueryMap = new Map(); // Shopping only (all campaigns)
  const pmaxQueryMap = new Map();     // PMax only (all campaigns)
  
  // Maps for individual campaigns
  const campaignMaps = new Map();     // Map of campaign -> query data
  
  // Helper to parse numeric values
  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  };
  
  // Helper to update query map
  const updateQueryMap = (map, query, clicks, impressions, conversions, value) => {
    if (query && clicks > 1) { // Only process if clicks > 1
      if (!map.has(query)) {
        map.set(query, {
          query: query,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          value: 0
        });
      }
      
      const data = map.get(query);
      data.clicks += clicks;
      data.impressions += impressions;
      data.conversions += conversions;
      data.value += value;
    }
  };
  
  // Helper to get or create campaign map
  const getCampaignMap = (campaignName, channelType) => {
    const key = `${campaignName}|||${channelType}`;
    if (!campaignMaps.has(key)) {
      campaignMaps.set(key, {
        campaignName: campaignName,
        channelType: channelType,
        queryMap: new Map()
      });
    }
    return campaignMaps.get(key).queryMap;
  };
  
  // Process Search Insights data (PMax campaigns)
  searchInsightsData.forEach(row => {
    const query = (row['Category Label'] || '').trim();
    const campaignName = (row['Campaign Name'] || '').trim();
    const clicks = parseNumber(row['Clicks']);
    const impressions = parseNumber(row['Impr']);
    const conversions = parseNumber(row['Conv']);
    const value = parseNumber(row['Value']);
    
    // Add to PMax-specific map (all campaigns)
    updateQueryMap(pmaxQueryMap, query, clicks, impressions, conversions, value);
    // Add to combined map
    updateQueryMap(allQueryMap, query, clicks, impressions, conversions, value);
    
    // Add to individual campaign map if campaign name exists
    if (campaignName) {
      const campaignMap = getCampaignMap(campaignName, 'PMax');
      updateQueryMap(campaignMap, query, clicks, impressions, conversions, value);
    }
  });
  
  // Process Search Terms data (Shopping campaigns)
  searchTermsData.forEach(row => {
    const query = (row['Search Term'] || '').trim();
    const campaignName = (row['Campaign Name'] || '').trim();
    const clicks = parseNumber(row['Clicks']);
    const impressions = parseNumber(row['Impr']);
    const conversions = parseNumber(row['Conv']);
    const value = parseNumber(row['Value']);
    
    // Add to Shopping-specific map (all campaigns)
    updateQueryMap(shoppingQueryMap, query, clicks, impressions, conversions, value);
    // Add to combined map
    updateQueryMap(allQueryMap, query, clicks, impressions, conversions, value);
    
    // Add to individual campaign map if campaign name exists
    if (campaignName) {
      const campaignMap = getCampaignMap(campaignName, 'Shopping');
      updateQueryMap(campaignMap, query, clicks, impressions, conversions, value);
    }
  });
  
  // First, determine global Top_Bucket rankings based on "all/all" data
  const allQueryArray = Array.from(allQueryMap.values());
  allQueryArray.sort((a, b) => b.value - a.value);
  
  // Separate blank and non-blank queries for ranking
  const nonBlankQueries = allQueryArray.filter(item => 
    item.query.toLowerCase() !== 'blank'
  );
  
  // Create a map of query to Top_Bucket based on global ranking
  const globalTopBuckets = new Map();
  nonBlankQueries.forEach((data, index) => {
    let topBucket = '';
    
    if (index === 0) topBucket = 'Top1';
    else if (index === 1) topBucket = 'Top2';
    else if (index === 2) topBucket = 'Top3';
    else if (index === 3) topBucket = 'Top4';
    else if (index === 4) topBucket = 'Top5';
    else if (index >= 5 && index <= 9) topBucket = 'Top10';
    // Queries beyond top 10 don't get a Top_Bucket value
    
    globalTopBuckets.set(data.query, topBucket);
  });
  
  // Helper function to process a query map into final format with global Top_Bucket
  const processQueryMap = (queryMap, campaignName, channelType) => {
    // Calculate total value for percentage calculation within this scope (excluding "blank" queries)
    let totalValue = 0;
    queryMap.forEach((data, query) => {
      if (query.toLowerCase() !== 'blank') {
        totalValue += data.value;
      }
    });
    
    // Convert map to array
    const searchTermsArray = Array.from(queryMap.values());
    
    // Sort by value descending
    searchTermsArray.sort((a, b) => b.value - a.value);
    
    // Process all queries
    const processedArray = searchTermsArray.map((data) => {
      const isBlank = data.query.toLowerCase() === 'blank';
      
      return {
        Query: data.query,
        Campaign_Name: campaignName,
        Channel_Type: channelType,
        Clicks: Math.round(data.clicks),
        Impressions: Math.round(data.impressions),
        Conversions: this.round2(data.conversions),
        Value: this.round2(data.value),
        '% of all revenue': totalValue > 0 ? this.round2((data.value / totalValue) * 100) : 0,
        Top_Bucket: isBlank ? '' : (globalTopBuckets.get(data.query) || '')
      };
    });
    
    return processedArray;
  };
  
  // Process main aggregation levels
  const allResults = processQueryMap(allQueryMap, 'all', 'all');
  const shoppingResults = processQueryMap(shoppingQueryMap, 'all', 'Shopping');
  const pmaxResults = processQueryMap(pmaxQueryMap, 'all', 'PMax');
  
  // Process individual campaign aggregations
  const campaignResults = [];
  let campaignCount = 0;
  campaignMaps.forEach((campaignData, key) => {
    const results = processQueryMap(
      campaignData.queryMap, 
      campaignData.campaignName, 
      campaignData.channelType
    );
    campaignResults.push(...results);
    campaignCount++;
  });
  
  // Combine all results
  const finalArray = [
    ...allResults, 
    ...shoppingResults, 
    ...pmaxResults,
    ...campaignResults
  ];
  
  // Log summary
  console.log(`[Search Terms] Processed ${allQueryMap.size} unique search terms`);
  console.log(`[Search Terms] Aggregation levels: 3 main + ${campaignCount} individual campaigns`);
  console.log(`[Search Terms] Total records: ${finalArray.length}`);
  console.log(`[Search Terms] Breakdown: ${allResults.length} all/all + ${shoppingResults.length} all/Shopping + ${pmaxResults.length} all/PMax + ${campaignResults.length} campaign-specific`);
  
  if (nonBlankQueries.length > 0) {
    console.log(`[Search Terms] Global Top1 query: "${nonBlankQueries[0].query}" with value ${this.round2(nonBlankQueries[0].value)}`);
  }
  
  // Log sample of individual campaigns
  if (campaignMaps.size > 0) {
    const sampleCampaigns = Array.from(campaignMaps.keys()).slice(0, 3);
    console.log(`[Search Terms] Sample campaigns processed: ${sampleCampaigns.join(', ')}`);
  }
  
  return finalArray;
},

// Helper to round to 2 decimal places (if not already exists)
round2(value) {
  return Math.round(value * 100) / 100;
},

// Calculate averages for specific metrics
calculateProductAverages: async function(productData, prefix) {
  console.log('[Product Averages] Starting averages calculation...');
  
  const averagesData = [];
  
  // Helper to parse numbers
  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,]/g, '')) || 0;
  };
  
  // Get max date to calculate 90 days back
  const allDates = productData.map(r => new Date(r.Date)).filter(d => !isNaN(d));
  const maxDate = new Date(Math.max(...allDates));
  const startDate90 = new Date(maxDate);
  startDate90.setDate(startDate90.getDate() - 90);
  
  // Filter for last 90 days with clicks > 0 (ALL campaigns, not filtered by campaign name)
  const relevantData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = new Date(row.Date);
    const clicks = parseNumber(row.Clicks);
    return rowDate > startDate90 && rowDate <= maxDate && clicks > 0;
  });
  
  console.log(`[Product Averages] Processing ${relevantData.length} records from last 90 days`);
  
  // Group by device type
  const deviceGroups = {};
  const allDeviceData = []; // For "All" device calculation
  
  relevantData.forEach(row => {
    const device = row.Device || 'UNKNOWN';
    if (!deviceGroups[device]) {
      deviceGroups[device] = [];
    }
    deviceGroups[device].push(row);
    allDeviceData.push(row);
  });
  
  // Calculate metrics for each device type
  const calculateMetricsForGroup = (groupData, deviceType) => {
    let totalClicks = 0;
    let totalAddToCart = 0;
    let totalBeginCheckout = 0;
    let totalPurchase = 0;
    let recordCount = 0;
    
    groupData.forEach(row => {
      const clicks = parseNumber(row.Clicks);
      const addToCart = parseNumber(row['Add to Cart Conv']);
      const beginCheckout = parseNumber(row['Begin Checkout Conv']);
      const purchase = parseNumber(row['Purchase Conv']);
      
      totalClicks += clicks;
      totalAddToCart += addToCart;
      totalBeginCheckout += beginCheckout;
      totalPurchase += purchase;
      recordCount++;
    });
    
// Calculate funnel rates (each step as percentage of previous step)
const cartRate = totalClicks > 0 ? (totalAddToCart / totalClicks) * 100 : 0;
const checkoutRate = totalAddToCart > 0 ? (totalBeginCheckout / totalAddToCart) * 100 : 0;
const purchaseRate = totalBeginCheckout > 0 ? (totalPurchase / totalBeginCheckout) * 100 : 0;
    
    console.log(`[Product Averages] ${deviceType}: ${recordCount} records, ${totalClicks} clicks, Cart Rate: ${cartRate.toFixed(2)}% (of clicks), Checkout Rate: ${checkoutRate.toFixed(2)}% (of carts), Purchase Rate: ${purchaseRate.toFixed(2)}% (of checkouts)`);
    
    // Add records for this device
    averagesData.push({
      period: '90d',
      metric: 'Cart Rate',
      device: deviceType,
      value: this.round2(cartRate)
    });
    
    averagesData.push({
      period: '90d',
      metric: 'Checkout Rate',
      device: deviceType,
      value: this.round2(checkoutRate)
    });
    
    averagesData.push({
      period: '90d',
      metric: 'Purchase Rate',
      device: deviceType,
      value: this.round2(purchaseRate)
    });
  };
  
  // Calculate for each specific device type
  Object.entries(deviceGroups).forEach(([device, data]) => {
    if (device && device !== 'UNKNOWN') {
      calculateMetricsForGroup(data, device);
    }
  });
  
  // Calculate for "All" devices (aggregate of all device types)
  if (allDeviceData.length > 0) {
    calculateMetricsForGroup(allDeviceData, 'All');
  }
  
  // Save to IDB
  const tableName = prefix + "googleSheets_productBuckets_averages";
  await window.embedIDB.setData(tableName, averagesData);
  
  console.log(`[Product Averages] ✅ Saved ${averagesData.length} average metrics to ${tableName}`);
  
  return averagesData;
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
},

// NEW: Analyze titles using the external API
analyzeTitles: async function(projectKey) {
  console.log(`[Title Analyzer] Starting title analysis for ${projectKey}`);
  
// Initialize Progress Manager for Title Analysis
if (typeof ProgressManager !== 'undefined') {
  // Don't add a new step - reuse the existing 'store' step for Title Analysis
  // This prevents going over 100%
  ProgressManager.startStep('store', 'Analyzing title optimization...');
}
  
  try {
    // Get product data from IDB
    const productData = await window.embedIDB.getData(projectKey + "googleSheets_productPerformance");
    if (!productData || !productData.data || productData.data.length === 0) {
      console.log('[Title Analyzer] No product data found');
      return null;
    }
    
    // First, get the top 10 search terms
    console.log('[Title Analyzer] Getting top 10 search terms...');
    let top10SearchTerms = [];
    
    try {
      // Try to get 30-day search terms first, fallback to 365d
      let searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_30d");
      if (!searchTermsData || !searchTermsData.data || searchTermsData.data.length === 0) {
        console.log('[Title Analyzer] No 30d search terms found, trying 365d...');
        searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_365d");
      }
      
      if (searchTermsData && searchTermsData.data && searchTermsData.data.length > 0) {
        // Filter for all/all aggregation and sort by value
        const allAllTerms = searchTermsData.data
          .filter(row => row.Campaign_Name === 'all' && row.Channel_Type === 'all')
          .sort((a, b) => (b.Value || 0) - (a.Value || 0))
          .slice(0, 10)
          .map(row => row.Query);
        
        top10SearchTerms = allAllTerms;
        console.log('[Title Analyzer] Top 10 search terms:', top10SearchTerms);
      }
    } catch (error) {
      console.log('[Title Analyzer] Could not get search terms:', error);
    }
    
    // If no search terms found, use a default set
    if (top10SearchTerms.length === 0) {
      console.log('[Title Analyzer] No search terms found, using Campaign Names as fallback');
      // Extract unique campaign names as fallback
      const campaigns = new Set();
      productData.data.forEach(row => {
        if (row['Campaign Name']) {
          campaigns.add(row['Campaign Name']);
        }
      });
      top10SearchTerms = Array.from(campaigns).slice(0, 10);
    }
    
// Build sources array: company name + unique Product Brand values
const sources = new Set(); // Use Set to ensure uniqueness

// 1. Get company name for THIS SPECIFIC PROJECT
let companyName = '';
try {
  // Fix the projectKey format for matching
  const projectKeyForMatch = projectKey.replace(/_$/, ''); // Remove trailing underscore
  
  // Get company for THIS project specifically
  if (window.myCompanyArray && window.myCompanyArray.length > 0) {
    const match = window.myCompanyArray.find(item => 
      item && item.startsWith(projectKeyForMatch + ' - ')
    );
    if (match) {
      companyName = match.split(' - ')[1] || "";
      console.log(`[Title Analyzer] Found company for ${projectKey}: ${companyName}`);
    }
  }
  // Only use global myCompany as fallback if this is project 1
  if (!companyName && projectKey.includes('pr1_') && window.myCompany) {
    companyName = window.myCompany;
  }
  
  if (!companyName) {
    console.warn(`[Title Analyzer] No company found for ${projectKey}, myCompanyArray:`, window.myCompanyArray);
  }
} catch (error) {
  console.log('[Title Analyzer] Could not get company name:', error);
}

// Add company name to sources if found
if (companyName) {
  sources.add(companyName.toLowerCase().trim());
}

// 2. Extract unique Product Brand values from the data
const brandSet = new Set();
productData.data.forEach(row => {
  const brand = row['Product Brand'];
  if (brand && brand.trim()) {
    brandSet.add(brand.toLowerCase().trim());
  }
});

// Add all unique brands to sources
brandSet.forEach(brand => sources.add(brand));

// Convert Set to Array for the API
const sourcesArray = Array.from(sources);

console.log(`[Title Analyzer] Sources for ${projectKey}: ${sourcesArray.length} unique values`, sourcesArray);
    
    // Get the TOP 10 search terms that have Top_Bucket values assigned
    top10SearchTerms = [];
    
    try {
      // Try 30-day data first, then 365-day
      let searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_30d");
      if (!searchTermsData || !searchTermsData.data || searchTermsData.data.length === 0) {
        console.log('[Title Analyzer] No 30d search terms found, trying 365d...');
        searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_365d");
      }
      
      if (searchTermsData && searchTermsData.data && searchTermsData.data.length > 0) {
        // Get ONLY the terms that have Top_Bucket values assigned (all/all aggregation)
        const termsWithBuckets = searchTermsData.data
          .filter(row => 
            row.Campaign_Name === 'all' && 
            row.Channel_Type === 'all' && 
            row.Top_Bucket && 
            row.Top_Bucket !== '' &&
            row.Query && 
            row.Query.toLowerCase() !== 'blank'
          )
          .sort((a, b) => {
            // Sort by Top_Bucket order
            const order = {'Top1': 1, 'Top2': 2, 'Top3': 3, 'Top4': 4, 'Top5': 5, 'Top10': 6};
            return (order[a.Top_Bucket] || 999) - (order[b.Top_Bucket] || 999);
          })
          .map(row => row.Query);
        
        // Take up to 10 terms
        top10SearchTerms = termsWithBuckets.slice(0, 10);
        
        console.log(`[Title Analyzer] Found ${top10SearchTerms.length} search terms with Top_Bucket values:`, top10SearchTerms);
      }
    } catch (error) {
      console.log('[Title Analyzer] Could not get search terms:', error);
    }
    
    // If we have less than 10 terms, try to fill from general top terms
    if (top10SearchTerms.length < 10) {
      try {
        let searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_365d");
        if (!searchTermsData || !searchTermsData.data) {
          searchTermsData = await window.embedIDB.getData(projectKey + "googleSheets_searchTerms_30d");
        }
        
        if (searchTermsData && searchTermsData.data) {
          const additionalTerms = searchTermsData.data
            .filter(row => 
              row.Campaign_Name === 'all' && 
              row.Channel_Type === 'all' &&
              row.Query &&
              row.Query.toLowerCase() !== 'blank' &&
              !top10SearchTerms.includes(row.Query)
            )
            .sort((a, b) => (b.Value || 0) - (a.Value || 0))
            .slice(0, 10 - top10SearchTerms.length)
            .map(row => row.Query);
          
          top10SearchTerms = [...top10SearchTerms, ...additionalTerms];
        }
      } catch (error) {
        console.log('[Title Analyzer] Error getting additional terms:', error);
      }
    }
    
    // If still no search terms, use a default
    if (top10SearchTerms.length === 0) {
      console.log('[Title Analyzer] No search terms found, using default');
      top10SearchTerms = ['product'];
    }
    
// Extract unique titles with their metadata
    const titleMap = new Map();
    productData.data.forEach(row => {
      const title = row['Product Title'];
      if (title && title.trim()) {
        // Use title as key to ensure uniqueness
        if (!titleMap.has(title)) {
          titleMap.set(title, {
            title: title,
            source: sourcesArray,           // Array with just this project's company
            q: top10SearchTerms,        // Array of top 10 search terms with Top_Bucket values
            metadata: {
              product_id: row['Product ID'] || undefined,
              category_hint: row['Product Type L1'] || undefined,
              brand_hint: row['Product Brand'] || undefined
            }
          });
        }
      }
    });
    
    const uniqueTitles = Array.from(titleMap.values());
    console.log(`[Title Analyzer] Found ${uniqueTitles.length} unique titles`);
    
    if (uniqueTitles.length === 0) {
      console.log('[Title Analyzer] No valid titles to analyze');
      return null;
    }
    
    // Get owner_id
    console.log('[Title Analyzer] Getting owner_id...');
    let ownerId;
    try {
      ownerId = await getCurrentOwnerId();
      console.log('[Title Analyzer] Owner ID obtained:', ownerId);
    } catch (error) {
      console.error('[Title Analyzer] Failed to get owner_id:', error);
      throw new Error('Unable to authenticate. Please try again.');
    }
    
    // Process in batches of 100 to avoid overwhelming the API
    const batchSize = 100;
    const results = [];
    const totalBatches = Math.ceil(uniqueTitles.length / batchSize);
    
    for (let i = 0; i < uniqueTitles.length; i += batchSize) {
      const batchNum = Math.floor(i / batchSize) + 1;
      console.log(`[Title Analyzer] Processing batch ${batchNum}/${totalBatches}`);

// Update progress (using 'store' step which has 10% weight)
if (typeof ProgressManager !== 'undefined') {
  const progress = (batchNum / totalBatches) * 100;
  ProgressManager.updateProgress('store', progress);
  ProgressManager.updateUI(`Analyzing titles: Batch ${batchNum}/${totalBatches}`);
}
      
      const batch = uniqueTitles.slice(i, i + batchSize);
      
      // Prepare request payload
      const requestPayload = {
        owner_id: ownerId,
        batch_id: `${projectKey}_batch_${Date.now()}_${batchNum}`,
        titles: batch,
        options: {
          include_debug: false,
          return_matched_terms: true,
          scoring_version: "v2.3.0"
        }
      };
      
      console.log(`[Title Analyzer] Sending ${batch.length} titles to API...`);
      
      try {
        // Send request to API
        const response = await fetch('https://1u2htt30ib.execute-api.us-east-2.amazonaws.com/prod/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestPayload)
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Title Analyzer] API error response:', errorText);
          
          // Parse error if possible
          try {
            const errorData = JSON.parse(errorText);
            if (errorData.error === 'Rate limit exceeded') {
              throw new Error(`API rate limit exceeded. Try again later. ${errorData.message}`);
            }
            throw new Error(errorData.message || 'API request failed');
          } catch (e) {
            if (e.message.includes('API rate limit')) throw e;
            throw new Error(`API request failed with status ${response.status}`);
          }
        }
        
        const responseData = await response.json();
        console.log(`[Title Analyzer] Batch ${batchNum} processed successfully`);
        
        // Add batch results to overall results
        if (responseData.results && Array.isArray(responseData.results)) {
          results.push(...responseData.results);
        }
        
        // Show rate limit info if available
        if (responseData.rate_limit_info) {
          console.log('[Title Analyzer] Rate limit info:', responseData.rate_limit_info);
        }
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < uniqueTitles.length) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
        
      } catch (error) {
        console.error(`[Title Analyzer] Error processing batch ${batchNum}:`, error);
        // Continue with other batches even if one fails
        if (error.message.includes('rate limit')) {
          throw error; // Stop if rate limited
        }
      }
    }
    
    console.log(`[Title Analyzer] Analysis complete. ${results.length} titles analyzed`);
    
    // Save results to IDB with updated naming
// Remove keywords and sources from individual results to avoid redundancy
const cleanedResults = results.map(r => {
  const cleaned = {...r};
  delete cleaned.keywords;
  delete cleaned.sources;
  return cleaned;
});

const analyzerResults = {
  projectKey: projectKey,
  analyzedAt: new Date().toISOString(),
  totalTitles: uniqueTitles.length,
  resultsCount: cleanedResults.length,
  searchTermsUsed: top10SearchTerms,  // Saved once at top level
  brandsAnalyzed: sourcesArray,        // Saved once at top level
  results: cleanedResults,             // Individual results without redundant data
      summary: {
        averageScore: results.reduce((sum, r) => sum + (r.final_score || 0), 0) / results.length,
        averageKos: results.reduce((sum, r) => sum + (r.avg_kos || 0), 0) / results.length,
        highPerformers: results.filter(r => r.final_score >= 80).length,
        needsImprovement: results.filter(r => r.final_score < 50).length
      }
    };
    
// Save to IDB with updated key format
await window.embedIDB.setData(projectKey + "googleads_title_analyzer_results", analyzerResults);
console.log(`[Title Analyzer] Results saved to ${projectKey}googleads_title_analyzer_results`);

// Complete the store step in Progress Manager
if (typeof ProgressManager !== 'undefined') {
  ProgressManager.completeStep('store');
  ProgressManager.updateUI('Title analysis complete!');
}

// NOW hide the loader after everything is done
const loader = document.getElementById("overlayLoader");
if (loader) {
  setTimeout(() => {
    loader.style.opacity = "0";
    setTimeout(() => { 
      loader.style.display = "none";
      // Reset progress for next time
      if (typeof ProgressManager !== 'undefined') {
        const progressContainer = loader.querySelector('.progress-container');
        const progressText = loader.querySelector('.progress-text');
        const loadingSteps = loader.querySelector('.loading-steps');
        if (progressContainer) progressContainer.style.display = 'none';
        if (progressText) progressText.style.display = 'none';
        if (loadingSteps) loadingSteps.style.display = 'none';
      }
    }, 500);
  }, 1000); // Show complete message for 1 second
}

return analyzerResults;

} catch (error) {
    console.error('[Title Analyzer] Analysis failed:', error);
    throw error;
  }
}
  
};
