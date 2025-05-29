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
    'Campaign Name', 'Channel Type', 'Impressions', 'Clicks', 
    'Cost', 'Conversions', 'Conversion Value', 'CTR', 'CVR', 
    'ROAS', 'AOV', 'CPA'
  ],
  
  LOCATION_COLUMNS: [
    'Campaign Name', 'Campaign Type', 'Country', 'State', 
    'Region', 'City', 'Location Type', 'Impressions', 
    'Clicks', 'Cost', 'Conversions', 'Revenue', 
    'CTR', 'CVR', 'ROAS'
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
  fetchAndStoreFromUrl: async function(url) {
    const loader = document.getElementById("overlayLoader");
    try {
      // Show loader
      if (loader) {
        const loaderText = loader.querySelector('.apple-loading-text');
        if (loaderText) {
          loaderText.textContent = 'Processing Google Sheets...';
        }
        loader.style.display = "flex";
        loader.style.opacity = "1";
      }
      
      // Extract sheet ID
      const sheetId = this.extractSheetId(url);
      if (!sheetId) {
        throw new Error('Invalid Google Sheets URL');
      }
      
      this.currentSheetId = sheetId;
      this.currentSheetUrl = url;
      
      console.log('[Google Sheets] Sheet ID:', sheetId);
      
      // Fetch both sheets by name
      let productCSV, locationCSV;
      
      try {
        // Fetch sheets in parallel
        [productCSV, locationCSV] = await Promise.all([
          this.fetchSheetByName(sheetId, 'Product Performance'),
          this.fetchSheetByName(sheetId, 'Location Revenue')
        ]);
      } catch (fetchError) {
        // If fetching by name fails, try common variations
        console.log('[Google Sheets] Trying alternative sheet names...');
        
        try {
          productCSV = await this.fetchSheetByName(sheetId, 'ProductPerformance');
        } catch (e) {
          try {
            productCSV = await this.fetchSheetByName(sheetId, 'Product_Performance');
          } catch (e2) {
            throw new Error('Could not find "Product Performance" sheet');
          }
        }
        
        try {
          locationCSV = await this.fetchSheetByName(sheetId, 'LocationRevenue');
        } catch (e) {
          try {
            locationCSV = await this.fetchSheetByName(sheetId, 'Location_Revenue');
          } catch (e2) {
            throw new Error('Could not find "Location Revenue" sheet');
          }
        }
      }
      
      // Parse the CSV data
      const [productData, locationData] = await Promise.all([
        this.parseSheetData(productCSV, 'Product Performance', this.PRODUCT_COLUMNS),
        this.parseSheetData(locationCSV, 'Location Revenue', this.LOCATION_COLUMNS)
      ]);
      
      // Store in IDB
      await Promise.all([
        window.embedIDB.setData("googleSheets_productPerformance", productData),
        window.embedIDB.setData("googleSheets_locationRevenue", locationData),
        window.embedIDB.setData("googleSheets_config", {
          url: url,
          sheetId: sheetId,
          lastUpdated: Date.now()
        })
      ]);
      
      console.log('[Google Sheets] ✅ All data fetched and stored successfully');
      
      // Update status
      const statusEl = document.getElementById('googleAdsStatus');
      if (statusEl) {
        statusEl.innerHTML = `
          <div style="color: #4CAF50; font-weight: 500;">
            ✓ Google Ads Data Uploaded Successfully
          </div>
          <div style="font-size: 0.8rem; color: #666; margin-top: 4px;">
            Product Performance: ${productData.length} rows<br>
            Location Revenue: ${locationData.length} rows<br>
            <span style="font-size: 0.7rem;">Last updated: ${new Date().toLocaleString()}</span>
          </div>
        `;
      }
      
      // Store in global variable for easy access
      window.googleSheetsData = {
        productPerformance: productData,
        locationRevenue: locationData
      };
      
      // Hide loader
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { 
          loader.style.display = "none";
          const loaderText = loader.querySelector('.apple-loading-text');
          if (loaderText) {
            loaderText.textContent = 'Loading data…';
          }
        }, 500);
      }
      
      return { productData, locationData };
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
              <li>Sheet names are exactly "Product Performance" and "Location Revenue"</li>
            </ul>
          </div>
        `;
      }
      
      // Hide loader on error
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { 
          loader.style.display = "none";
          const loaderText = loader.querySelector('.apple-loading-text');
          if (loaderText) {
            loaderText.textContent = 'Loading data…';
          }
        }, 500);
      }
      
      throw error;
    }
  },
  
  // Optional: Method to check if data exists in IDB
  hasStoredData: async function() {
    try {
      const [products, locations] = await Promise.all([
        window.embedIDB.getData("googleSheets_productPerformance"),
        window.embedIDB.getData("googleSheets_locationRevenue")
      ]);
      
      return products?.data?.length > 0 && locations?.data?.length > 0;
    } catch (error) {
      return false;
    }
  },
  
  // Optional: Method to get stored configuration
  getStoredConfig: async function() {
    try {
      const config = await window.embedIDB.getData("googleSheets_config");
      return config?.data || null;
    } catch (error) {
      return null;
    }
  }
};
