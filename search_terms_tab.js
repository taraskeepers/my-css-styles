/**
 * Search Terms Tab - Moved from Google Ads functionality
 * This file contains all logic related to the Search Terms page
 */

// Global variables for Search Terms functionality
window.searchTermsData = [];
window.searchTermsDataWithRankings = [];
window.searchTermsData365d = [];
window.searchTermsData90d = [];
window.searchTermsCurrentPage = 1;
window.searchTermsPerPage = 50;
window.searchTermsSortColumn = 'Impressions';
window.searchTermsSortAscending = false;
window.searchTermsFilter = 'all'; // 'all', 'topbucket', 'negatives'
window.productRankingToggleState = false;

/**
 * Main function to render the Search Terms table
 */
async function renderSearchTermsTable() {
  console.log("[Search Terms] Starting to render Search Terms table");
  
  try {
    // Get the container
    const container = document.getElementById("searchTermsContainer");
    if (!container) {
      console.error("[Search Terms] Container not found");
      return;
    }
    
    // Load and render search terms data
    await loadAndRenderSearchTerms();
    
  } catch (error) {
    console.error("[Search Terms] Error in renderSearchTermsTable:", error);
    const container = document.getElementById("searchTermsContainer");
    if (container) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #ff3b30;">
          <div style="font-size: 18px; margin-bottom: 10px;">Error Loading Search Terms</div>
          <div>${error.message}</div>
        </div>
      `;
    }
  }
}

/**
 * Load and render search terms data (moved from google_ads_search_terms.js)
 */
async function loadAndRenderSearchTerms() {
  const container = document.getElementById('searchTermsContainer');
  if (!container) return;
  
  // Show loading state
  container.innerHTML = '<div style="text-align: center; padding: 50px;"><div class="spinner"></div></div>';
  
  try {
    // Get table name with current project prefix
    const tablePrefix = getProjectTablePrefix();
    const days = window.selectedDateRangeDays || 30;
    const suffix = days === 365 ? '365d' : days === 90 ? '90d' : days === 60 ? '60d' : '30d';
    const tableName = `${tablePrefix}googleSheets_searchTerms_${suffix}`;
    
    // Also get 365d table for Top_Bucket data
    const tableName365d = `${tablePrefix}googleSheets_searchTerms_365d`;
    
    // And get 90d table for trend comparison
    const tableName90d = `${tablePrefix}googleSheets_searchTerms_90d`;
    
    console.log('[loadAndRenderSearchTerms] Loading from tables:', tableName, tableName365d, tableName90d);
    
    // Load data from IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    
    // Load current data
    const getRequest = objectStore.get(tableName);
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    // Load 365d data for Top_Bucket
    const getRequest365d = objectStore.get(tableName365d);
    const result365d = await new Promise((resolve, reject) => {
      getRequest365d.onsuccess = () => resolve(getRequest365d.result);
      getRequest365d.onerror = () => reject(getRequest365d.error);
    });
    
    // Load 90d data for trends
    const getRequest90d = objectStore.get(tableName90d);
    const result90d = await new Promise((resolve, reject) => {
      getRequest90d.onsuccess = () => resolve(getRequest90d.result);
      getRequest90d.onerror = () => reject(getRequest90d.error);
    });
    
    db.close();
    
    if (!result || !result.data || result.data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">No search terms data available</div>';
      return;
    }
    
    // Filter out "blank" search terms
    const filteredData = result.data.filter(item => item.Query && item.Query.toLowerCase() !== 'blank');
    
    // Create a map of Top_Bucket values from 365d data
    const topBucketMap = {};
    if (result365d && result365d.data) {
      result365d.data.forEach(item => {
        if (item.Query && item['Top_Bucket']) {
          topBucketMap[item.Query.toLowerCase()] = item['Top_Bucket'];
        }
      });
    }
    
    // Create a map of 90d data for trends
    const trend90dMap = {};
    if (result90d && result90d.data) {
      result90d.data.forEach(item => {
        if (item.Query) {
          trend90dMap[item.Query.toLowerCase()] = {
            Impressions: (item.Impressions || 0) / 3,
            Clicks: (item.Clicks || 0) / 3,
            Conversions: (item.Conversions || 0) / 3,
            Value: (item.Value || 0) / 3
          };
        }
      });
    }
    
    // Add Top_Bucket and trend data to current data
    filteredData.forEach(item => {
      const queryLower = item.Query.toLowerCase();
      item['Top Bucket'] = topBucketMap[queryLower] || '';
      item['Trend Data'] = trend90dMap[queryLower] || null;
    });
    
    // Debug logging for Top Bucket assignment
    console.log('[Search Terms] 365d data entries:', result365d?.data?.length || 0);
    console.log('[Search Terms] Top bucket map entries:', Object.keys(topBucketMap).length);
    console.log('[Search Terms] Sample top bucket entries:', Object.entries(topBucketMap).slice(0, 5));
    
    const itemsWithTopBucket = filteredData.filter(item => item['Top Bucket'] && item['Top Bucket'] !== '');
    console.log('[Search Terms] Items with Top Bucket assigned:', itemsWithTopBucket.length);
    console.log('[Search Terms] Sample items with buckets:', itemsWithTopBucket.slice(0, 3).map(item => ({query: item.Query, bucket: item['Top Bucket']})));
    
    // Process the data
    window.searchTermsData = filteredData;
    window.searchTermsData365d = result365d?.data || [];
    window.searchTermsData90d = result90d?.data || [];
    
    // Initialize pagination and sorting
    window.searchTermsCurrentPage = 1;
    window.searchTermsPerPage = 50;
    window.searchTermsSortColumn = 'Clicks';
    window.searchTermsSortAscending = false;
    window.searchTermsFilter = 'all';
    
    // Apply initial sort
    sortSearchTermsData();
    
    // Render the search terms table
    renderSearchTermsTableInternal(container);
    
  } catch (error) {
    console.error('[loadAndRenderSearchTerms] Error:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Error loading search terms data</div>';
  }
}

/**
 * Function to get total unique products count
 */
async function getTotalProductsCount() {
  try {
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const uniqueProducts = new Set();
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data) {
          result.data.forEach(item => {
            if (item['Product Title']) {
              uniqueProducts.add(item['Product Title']);
            }
          });
        }
        resolve();
      };
      getRequest.onerror = () => resolve();
    });
    
    db.close();
    return uniqueProducts.size;
  } catch (error) {
    console.error('[Search Terms] Error getting total products:', error);
    return 0;
  }
}

/**
 * Calculate summary data for filtered results
 */
function calculateSummaryData(filteredData) {
  if (filteredData.length === 0) return null;
  
  const summary = {
    count: filteredData.length,
    impressions: filteredData.reduce((sum, d) => sum + (d.Impressions || 0), 0),
    clicks: filteredData.reduce((sum, d) => sum + (d.Clicks || 0), 0),
    conversions: filteredData.reduce((sum, d) => sum + (d.Conversions || 0), 0),
    value: filteredData.reduce((sum, d) => sum + (d.Value || 0), 0),
    revenue_pct: filteredData.reduce((sum, d) => sum + (d['% of all revenue'] || 0), 0)
  };
  
  // Calculate averages
  summary.ctr = summary.impressions > 0 ? (summary.clicks / summary.impressions * 100) : 0;
  summary.cvr = summary.clicks > 0 ? (summary.conversions / summary.clicks * 100) : 0;
  
  // Calculate trend data (sum of all trend data)
  const trendData = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    value: 0
  };
  
  filteredData.forEach(item => {
    if (item['Trend Data']) {
      trendData.impressions += item['Trend Data'].Impressions || 0;
      trendData.clicks += item['Trend Data'].Clicks || 0;
      trendData.conversions += item['Trend Data'].Conversions || 0;
      trendData.value += item['Trend Data'].Value || 0;
    }
  });
  
  summary.trendData = trendData;
  
  return summary;
}

/**
 * Render summary row
 */
function renderSummaryRow(summary) {
  if (!summary) return '';
  
  return `
    <tr style="background: linear-gradient(to bottom, #e3f2fd, #bbdefb); border-top: 2px solid #1976d2; border-bottom: 2px solid #1976d2; height: 60px;">
      <td style="padding: 12px; text-align: center; font-weight: 700;">
        <div style="font-size: 16px; color: #1976d2;">Σ</div>
      </td>
      <td style="padding: 12px;">
        <div style="font-weight: 700; color: #1976d2; font-size: 15px;">
          Summary (${summary.count} terms)
        </div>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${getMetricWithTrend(summary.impressions, summary.trendData.impressions, 'impressions', null, true)}
      </td>
      <td style="padding: 12px; text-align: center;">
        ${getMetricWithTrend(summary.clicks, summary.trendData.clicks, 'clicks', null, true)}
      </td>
      <td style="padding: 12px; text-align: center;">
        <div style="font-weight: 700; font-size: 15px; color: #1976d2;">${summary.ctr.toFixed(2)}%</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">Average</div>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${getMetricWithTrend(summary.conversions, summary.trendData.conversions, 'conversions', null, true)}
      </td>
      <td style="padding: 12px; text-align: center;">
        <div style="font-weight: 700; font-size: 15px; color: #1976d2;">${summary.cvr.toFixed(2)}%</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">Average</div>
      </td>
      <td style="padding: 12px; text-align: center;">
        ${getMetricWithTrend(summary.value, summary.trendData.value, 'value', null, true)}
      </td>
      <td style="padding: 12px; text-align: center;">
        <div style="font-weight: 700; font-size: 15px; color: #1976d2;">${(summary.revenue_pct * 100).toFixed(2)}%</div>
        <div style="font-size: 11px; color: #666; margin-top: 2px;">Total</div>
      </td>
    </tr>
  `;
}

/**
 * Render the search terms table (internal function)
 */
function renderSearchTermsTableInternal(container) {
  const allData = window.searchTermsData;
  const data = getFilteredSearchTermsData();
  const currentPage = window.searchTermsCurrentPage;
  const perPage = window.searchTermsPerPage;
  
  const totalPages = Math.ceil(data.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, data.length);
  const pageData = data.slice(startIndex, endIndex);
  
  // Find max values for bar scaling
  const maxImpressions = Math.max(...data.map(d => d.Impressions || 0));
  const maxClicks = Math.max(...data.map(d => d.Clicks || 0));
  
  // Calculate average CVR for items with conversions > 0
  const itemsWithConversions = allData.filter(d => d.Conversions > 0);
  const avgCVR = itemsWithConversions.length > 0
    ? itemsWithConversions.reduce((sum, d) => sum + (d.Clicks > 0 ? (d.Conversions / d.Clicks * 100) : 0), 0) / itemsWithConversions.length
    : 0;
  
  // Find top 10 by value
  const top10ByValue = [...allData]
    .sort((a, b) => (b.Value || 0) - (a.Value || 0))
    .slice(0, 10)
    .map(item => item.Query);

  // Render stats container
  const statsResult = renderSearchTermsStats(allData);
  
  let html = statsResult.html + `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Search Terms Performance</h3>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #666; font-size: 14px;">
          Showing ${data.length > 0 ? startIndex + 1 : 0}-${endIndex} of ${data.length} search terms
        </div>
        <div style="display: flex; align-items: center; gap: 16px;">
          <div class="product-ranking-toggle-container" style="display: flex; align-items: center; gap: 8px;">
            <label class="product-ranking-toggle-label" style="font-size: 13px; font-weight: 500; color: #333;">Product Ranking</label>
            <label class="product-ranking-toggle" style="position: relative; display: inline-block; width: 44px; height: 24px;">
              <input type="checkbox" id="productRankingToggle" style="opacity: 0; width: 0; height: 0;">
              <span class="product-ranking-slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px;">
                <span style="position: absolute; content: ''; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%;"></span>
              </span>
            </label>
          </div>
          <div class="search-terms-filter-switcher" style="display: flex; gap: 0; background: #f0f0f0; border-radius: 8px; padding: 2px;">
            <button class="filter-btn ${window.searchTermsFilter === 'all' ? 'active' : ''}" data-filter="all" 
                    style="padding: 8px 16px; border: none; background: ${window.searchTermsFilter === 'all' ? 'white' : 'transparent'}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              All Search Terms
            </button>
            <button class="filter-btn ${window.searchTermsFilter === 'topbucket' ? 'active' : ''}" data-filter="topbucket" 
                    style="padding: 8px 16px; border: none; background: ${window.searchTermsFilter === 'topbucket' ? 'white' : 'transparent'}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Top Bucket
            </button>
            <button class="filter-btn ${window.searchTermsFilter === 'negatives' ? 'active' : ''}" data-filter="negatives" 
                    style="padding: 8px 16px; border: none; background: ${window.searchTermsFilter === 'negatives' ? 'white' : 'transparent'}; border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 500; transition: all 0.2s;">
              Potential Negatives
            </button>
          </div>
        </div>
      </div>
    </div>
        
    <table class="search-terms-table" style="width: 100%; border-collapse: collapse; background: white;">
      <thead>
        <tr style="background: linear-gradient(to bottom, #ffffff, #f9f9f9); border-bottom: 2px solid #ddd;">
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; width: 60px; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">#</th>
          <th class="sortable" data-column="Query" style="padding: 12px 8px; text-align: left; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            Search Term ${getSortIndicator('Query')}
          </th>
          <th class="sortable" data-column="Impressions" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            Impressions ${getSortIndicator('Impressions')}
          </th>
          <th class="sortable" data-column="Clicks" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            Clicks ${getSortIndicator('Clicks')}
          </th>
          <th class="sortable" data-column="CTR" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            CTR ${getSortIndicator('CTR')}
          </th>
          <th class="sortable" data-column="Conversions" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            Conversions ${getSortIndicator('Conversions')}
          </th>
          <th class="sortable" data-column="CVR" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            CVR ${getSortIndicator('CVR')}
          </th>
          <th class="sortable" data-column="Value" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            Value ${getSortIndicator('Value')}
          </th>
          <th style="padding: 12px 8px; text-align: center; font-weight: 600; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            % Revenue
          </th>
        </tr>
      </thead>
      <tbody>
  `;

    // Add summary row if filter is active
  if (window.searchTermsFilter !== 'all') {
    const summaryData = calculateSummaryData(data);
    html += renderSummaryRow(summaryData);
  }
  
  // Render table rows
  pageData.forEach((row, index) => {
    const globalIndex = startIndex + index + 1;
    const ctr = row.Impressions > 0 ? (row.Clicks / row.Impressions * 100).toFixed(2) : 0;
    const cvr = row.Clicks > 0 ? (row.Conversions / row.Clicks * 100).toFixed(2) : 0;
    
    // Calculate bar widths (max 100px)
    const impressionBarWidth = maxImpressions > 0 ? (row.Impressions / maxImpressions * 100) : 0;
    const clickBarWidth = maxClicks > 0 ? (row.Clicks / maxClicks * 100) : 0;
    
    // Get top bucket for this search term
    const topBucket = row['Top Bucket'] || '';
    
    // Get trend data
    const trendData = row['Trend Data'];
    
    // Determine row background
    let rowBg = index % 2 === 1 ? '#f9f9f9' : 'white';
    if (row.Clicks >= 50 && row.Conversions === 0) {
      rowBg = '#ffebee'; // Light red
    } else if (top10ByValue.includes(row.Query)) {
      rowBg = '#e8f5e9'; // Light green
    }
    
    // Determine CVR color
    let cvrColor = '#666';
    if (parseFloat(cvr) === 0) {
      cvrColor = '#F44336'; // Red for 0%
    } else if (parseFloat(cvr) >= avgCVR) {
      cvrColor = '#4CAF50'; // Green for >= average
    } else {
      cvrColor = '#FF9800'; // Orange for < average
    }
    
    html += `
      <tr style="background-color: ${rowBg};" class="search-term-row" data-search-term="${row.Query}">
        <td style="padding: 8px; text-align: center;">
          ${getIndexWithTopBucket(globalIndex, topBucket)}
        </td>
        <td style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="font-weight: 500; color: #333; font-size: 14px;">${row.Query}</div>
            ${topBucket ? getTopBucketBadge(topBucket) : ''}
          </div>
        </td>
        <td style="padding: 8px; text-align: center;">
          ${getMetricWithTrend(row.Impressions, trendData?.Impressions, 'impressions', impressionBarWidth)}
        </td>
        <td style="padding: 8px; text-align: center;">
          ${getMetricWithTrend(row.Clicks, trendData?.Clicks, 'clicks', clickBarWidth)}
        </td>
        <td style="padding: 8px; text-align: center; font-weight: 500; color: ${ctr > 5 ? '#4CAF50' : ctr > 2 ? '#FF9800' : '#F44336'}; font-size: 14px;">${ctr}%</td>
        <td style="padding: 8px; text-align: center;">
          ${getMetricWithTrend(row.Conversions, trendData?.Conversions, 'conversions')}
        </td>
        <td style="padding: 8px; text-align: center; font-weight: 500; color: ${cvrColor}; font-size: 14px;">${cvr}%</td>
        <td style="padding: 8px; text-align: center;">
          ${getMetricWithTrend(row.Value, trendData?.Value, 'value')}
        </td>
        <td style="padding: 8px; text-align: center; font-weight: 500; color: ${row['% of all revenue'] > 0.05 ? '#4CAF50' : '#666'}; font-size: 14px;">
          ${(row['% of all revenue'] * 100).toFixed(2)}%
        </td>
      </tr>
    `;

    // Add sub-rows container (will remain empty if no data)
    html += `<tbody class="product-ranking-rows" data-search-term="${row.Query}" style="display: none;"></tbody>`;
  });
  
  html += `
        </tbody>
      </table>

      ${window.searchTermsFilter === 'topbucket' ? renderMissingTopBucketTerms() : ''}
      
      <div style="margin-top: 20px; display: flex; justify-content: flex-end;">
        <div class="pagination-controls" style="display: flex; gap: 10px; align-items: center;">
          <button id="searchTermsPrevBtn" ${currentPage === 1 ? 'disabled' : ''} 
                  style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
            Previous
          </button>
          <select id="searchTermsPageSelect" style="padding: 6px; border: 1px solid #ddd; background: white; border-radius: 4px; font-size: 14px;">
            ${Array.from({length: totalPages}, (_, i) => i + 1).map(page => 
              `<option value="${page}" ${page === currentPage ? 'selected' : ''}>Page ${page}</option>`
            ).join('')}
          </select>
          <span style="font-size: 14px; color: #333;">of ${totalPages}</span>
          <button id="searchTermsNextBtn" ${currentPage === totalPages ? 'disabled' : ''} 
                  style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
            Next
          </button>
        </div>
      </div>
    `;
  
  container.innerHTML = html;
  
  // Add event listeners
  setTimeout(() => {
    attachSearchTermsEventListeners();
  }, 100);
}

/**
 * Function to calculate product ranking metrics for a search term
 */
async function calculateProductRankingMetrics(searchTerm) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return [];
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Get total products count
  const totalProducts = await getTotalProductsCount();
  
  // Get company to filter
  const companyToFilter = window.myCompany || '';
  
  const results = [];
  
  // Check if projectTableData exists and has data
  if (window.projectTableData && Array.isArray(window.projectTableData)) {
    // Group by location/device from projectTableData
    const projectDataMap = {};
    
    window.projectTableData.forEach(item => {
      if (item.searchTerm && item.searchTerm.toLowerCase().trim() === normalizedTerm) {
        const key = `${item.location}|${item.device}`;
        projectDataMap[key] = item;
      }
    });
    
    // For each location/device combination found in projectTableData
    for (const [key, projectData] of Object.entries(projectDataMap)) {
      const [location, device] = key.split('|');
      
      // Count active/inactive products from allRows
      let activeCount = 0;
      let inactiveCount = 0;
      let prevActiveCount = 0;
      
      // Get products for this location/device
      const products = window.allRows.filter(product => 
        product.q && product.q.toLowerCase().trim() === normalizedTerm &&
        product.source && product.source.toLowerCase() === companyToFilter.toLowerCase() &&
        product.location_requested === location &&
        product.device === device
      );
      
      // Count active/inactive
      products.forEach(product => {
        if (product.product_status === 'inactive') {
          inactiveCount++;
        } else {
          activeCount++;
        }
        
        // Track previous period active products
        if (product.product_status !== 'inactive') {
          // For previous period, check if product had data
          if (product.historical_data && Array.isArray(product.historical_data)) {
            const days = 7;
            const endDate = moment().subtract(1, 'days');
            const startDate = endDate.clone().subtract(days - 1, 'days');
            const prevEndDate = startDate.clone().subtract(1, 'days');
            const prevStartDate = prevEndDate.clone().subtract(days - 1, 'days');
            
            const hasPrevData = product.historical_data.some(item => {
              if (!item.date || !item.date.value) return false;
              const itemDate = moment(item.date.value, 'YYYY-MM-DD');
              return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
            });
            if (hasPrevData) {
              prevActiveCount++;
            }
          }
        }
      });
      
      // Calculate percentage of all products
      const percentOfAllProducts = totalProducts > 0 ? ((activeCount / totalProducts) * 100) : 0;
      
      // Use pre-calculated values from projectTableData
      results.push({
        location: location,
        device: device,
        avgRank: projectData.avgRank || 0,
        rankTrend: projectData.rankChange || 0, // Note: rankChange is the trend
        marketShare: projectData.avgShare || 0,
        shareTrend: projectData.trendVal || 0,
        activeProducts: activeCount,
        inactiveProducts: inactiveCount,
        prevActiveProducts: prevActiveCount,
        productsTrend: activeCount - prevActiveCount,
        percentOfAllProducts: percentOfAllProducts,
        totalProducts: totalProducts
      });
    }
  }
  
  return results;
}

/**
 * Function to render product ranking sub-rows
 */
async function renderProductRankingSubRows(searchTerm) {
  const metrics = await calculateProductRankingMetrics(searchTerm);
  
  if (!metrics || metrics.length === 0) {
    return ''; // Don't add sub-row if no data
  }
  
  let html = '';
  
  metrics.forEach((metric, index) => {
    // Format location (shorter)
    const locationParts = metric.location.split(',');
    const city = locationParts[0] || metric.location;
    
    // Device icon - using Unicode symbols instead of images
    const deviceIcon = metric.device.toLowerCase().includes('mobile') ? '📱' : '💻';
    
    // Format trends
    const rankArrow = metric.rankTrend < 0 ? '↑' : metric.rankTrend > 0 ? '↓' : '';
    const rankColor = metric.rankTrend < 0 ? '#4CAF50' : metric.rankTrend > 0 ? '#F44336' : '#999';
    
    const shareArrow = metric.shareTrend > 0 ? '↑' : metric.shareTrend < 0 ? '↓' : '';
    const shareColor = metric.shareTrend > 0 ? '#4CAF50' : metric.shareTrend < 0 ? '#F44336' : '#999';
    
    html += `
      <tr class="product-ranking-subrow" style="background: ${index % 2 === 0 ? '#f9f9f9' : '#f5f5f5'};">
        <td colspan="9" style="padding: 0;">
          <div style="display: flex; align-items: center; padding: 10px 16px; gap: 20px;">
            <!-- Device (moved to first position) -->
            <div style="flex: 0 0 40px; font-size: 24px; text-align: center;">
              ${deviceIcon}
            </div>
            
            <!-- Active Products (Main metric) -->
            <div style="flex: 0 0 auto; text-align: center; background: #333; border-radius: 8px; padding: 8px 16px; min-width: 80px;">
              <div style="font-size: 20px; font-weight: 700; color: white; line-height: 1;">
                ${metric.activeProducts}
              </div>
              <div style="font-size: 10px; color: #ccc; margin-top: 2px; font-weight: 600;">
                PRODUCTS
              </div>
              ${metric.productsTrend !== 0 ? `
                <div style="font-size: 11px; color: ${metric.productsTrend > 0 ? '#4CAF50' : '#F44336'}; margin-top: 2px;">
                  ${metric.productsTrend > 0 ? '↑' : '↓'} ${Math.abs(metric.productsTrend)}
                </div>
              ` : ''}
            </div>
            
            <!-- % of All Products with pie chart -->
            <div style="flex: 0 0 140px; display: flex; align-items: center; gap: 8px;">
              <canvas id="pie-${searchTerm.replace(/\s+/g, '-')}-${index}" width="30" height="30" style="width: 30px; height: 30px;"></canvas>
              <div>
                <span style="font-size: 12px; color: #666; font-weight: 500;">% of catalog:</span>
                <span style="font-size: 14px; font-weight: 700; color: #1976d2; margin-left: 4px;">
                  ${metric.percentOfAllProducts.toFixed(1)}%
                </span>
                <div style="font-size: 11px; color: #999;">
                  (${metric.totalProducts} total)
                </div>
              </div>
            </div>
            
            <!-- Location -->
            <div style="flex: 0 0 140px;">
              <span style="font-size: 13px; font-weight: 600; color: #333;">${city}</span>
            </div>
            
            <!-- Avg Rank (square box) -->
            <div style="flex: 0 0 auto; text-align: center;">
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Avg Rank</div>
              <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; width: 50px; height: 50px; background: #f5f5f5; border-radius: 8px; border: 1px solid #e0e0e0; position: relative;">
                <span style="font-size: 18px; font-weight: 700; color: #333; line-height: 1;">
                  ${metric.avgRank > 0 ? metric.avgRank.toFixed(1) : '-'}
                </span>
                ${rankArrow ? `<span style="font-size: 11px; color: ${rankColor}; line-height: 1; margin-top: 2px;">
                  ${rankArrow} ${Math.abs(metric.rankTrend).toFixed(1)}
                </span>` : ''}
              </div>
            </div>
            
            <!-- Market Share (progress bar) -->
            <div style="flex: 1;">
              <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Market Share</div>
              <div style="position: relative; background: #e0e0e0; height: 24px; border-radius: 12px; overflow: hidden;">
                <div style="position: absolute; left: 0; top: 0; height: 100%; background: #1976d2; width: ${Math.min(metric.marketShare, 100)}%; transition: width 0.3s ease;"></div>
                <div style="position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: flex; align-items: center; padding: 0 12px; justify-content: space-between;">
                  <span style="font-size: 14px; font-weight: 700; color: ${metric.marketShare > 50 ? 'white' : '#333'}; z-index: 1;">
                    ${metric.marketShare.toFixed(1)}%
                  </span>
                  ${shareArrow ? `<span style="font-size: 12px; color: ${metric.marketShare > 50 ? 'white' : shareColor}; z-index: 1;">
                    ${shareArrow} ${Math.abs(metric.shareTrend).toFixed(1)}%
                  </span>` : ''}
                </div>
              </div>
            </div>
            
            <!-- Inactive count -->
            ${metric.inactiveProducts > 0 ? `
              <div style="flex: 0 0 auto; text-align: center; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; padding: 4px 8px;">
                <span style="font-size: 11px; color: #999;">Inactive:</span>
                <span style="font-size: 13px; font-weight: 600; color: #757575; margin-left: 4px;">
                  ${metric.inactiveProducts}
                </span>
              </div>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });
  
  // Store pie chart data for later rendering
  window.searchTermsPieChartData = window.searchTermsPieChartData || {};
  window.searchTermsPieChartData[searchTerm] = metrics;
  
  return html;
}

/**
 * Function to render pie charts for a specific search term
 */
function renderSearchTermPieCharts(searchTerm) {
  const metrics = window.searchTermsPieChartData[searchTerm];
  if (!metrics) return;
  
  metrics.forEach((metric, idx) => {
    const canvasId = `pie-${searchTerm.replace(/\s+/g, '-')}-${idx}`;
    const canvas = document.getElementById(canvasId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const percentage = metric.percentOfAllProducts;
      
      // Clear canvas
      ctx.clearRect(0, 0, 30, 30);
      
      // Draw filled portion
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.arc(15, 15, 12, -Math.PI/2, (-Math.PI/2) + (2 * Math.PI * percentage / 100));
      ctx.closePath();
      ctx.fillStyle = '#1976d2';
      ctx.fill();
      
      // Draw remaining portion
      ctx.beginPath();
      ctx.moveTo(15, 15);
      ctx.arc(15, 15, 12, (-Math.PI/2) + (2 * Math.PI * percentage / 100), Math.PI * 1.5);
      ctx.closePath();
      ctx.fillStyle = '#e0e0e0';
      ctx.fill();
      
      // Draw border
      ctx.beginPath();
      ctx.arc(15, 15, 12, 0, 2 * Math.PI);
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  });
}

/**
 * Helper functions for data filtering, sorting, and display
 */
function getFilteredSearchTermsData() {
  let data = [...window.searchTermsData];
  
  switch(window.searchTermsFilter) {
    case 'topbucket':
      // Filter for items that have Top Bucket data
      data = data.filter(item => item['Top Bucket'] && item['Top Bucket'] !== '');
      break;
case 'negatives':
      // Filter for potential negative terms (no conversions, sufficient clicks)
      data = data.filter(item => {
        return item.Conversions === 0 && item.Clicks >= 50;
      });
      break;
    default:
      // 'all' - no filtering
      break;
  }
  
  return data;
}

function sortSearchTermsData() {
  const column = window.searchTermsSortColumn;
  const ascending = window.searchTermsSortAscending;
  
  window.searchTermsData.sort((a, b) => {
    let aVal, bVal;
    
    switch(column) {
      case 'Query':
        aVal = a.Query || '';
        bVal = b.Query || '';
        break;
      case 'Impressions':
        aVal = a.Impressions || 0;
        bVal = b.Impressions || 0;
        break;
      case 'Clicks':
        aVal = a.Clicks || 0;
        bVal = b.Clicks || 0;
        break;
      case 'CTR':
        aVal = a.Impressions > 0 ? (a.Clicks / a.Impressions) : 0;
        bVal = b.Impressions > 0 ? (b.Clicks / b.Impressions) : 0;
        break;
      case 'Conversions':
        aVal = a.Conversions || 0;
        bVal = b.Conversions || 0;
        break;
      case 'CVR':
        aVal = a.Clicks > 0 ? (a.Conversions / a.Clicks) : 0;
        bVal = b.Clicks > 0 ? (b.Conversions / b.Clicks) : 0;
        break;
      case 'Value':
        aVal = a.Value || 0;
        bVal = b.Value || 0;
        break;
      default:
        aVal = a[column] || 0;
        bVal = b[column] || 0;
    }
    
    if (typeof aVal === 'string') {
      return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    } else {
      return ascending ? (aVal - bVal) : (bVal - aVal);
    }
  });
}

function getSortIndicator(column) {
  if (window.searchTermsSortColumn !== column) return '';
  return window.searchTermsSortAscending ? ' ↑' : ' ↓';
}

function getMetricWithTrend(current, previous, type, barWidth = null, isSummary = false) {
  const formattedCurrent = type === 'value' 
    ? `$${current.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
    : current.toLocaleString();
    
  let trendHtml = '';
  if (previous && previous !== current) {
    const change = ((current - previous) / previous * 100);
    const changeText = change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
    const changeColor = change > 0 ? '#4CAF50' : '#F44336';
    const arrow = change > 0 ? '↗' : '↘';
    
    trendHtml = `
      <div style="font-size: ${isSummary ? '12px' : '11px'}; color: ${changeColor}; margin-top: 2px;">
        ${arrow} ${changeText}
      </div>
    `;
  }
  
  let barHtml = '';
  if (barWidth !== null && barWidth > 0) {
    const barColor = type === 'impressions' ? '#4285f4' : '#34a853';
    barHtml = `
      <div style="width: 80px; height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden; margin: 4px auto 0;">
        <div style="width: ${barWidth}%; height: 100%; background: ${barColor};"></div>
      </div>
    `;
  }
  
  const fontSize = isSummary ? '15px' : '14px';
  const fontWeight = isSummary ? '700' : '600';
  const color = isSummary ? '#1976d2' : 'inherit';
  
  return `
    <div>
      <div style="font-weight: ${fontWeight}; font-size: ${fontSize}; color: ${color};">${formattedCurrent}</div>
      ${trendHtml}
      ${barHtml}
    </div>
  `;
}

function getTopBucketBadge(topBucket) {
  if (!topBucket) return '';
  
  const bucketConfig = {
    'Top1': { color: '#FFD700', bg: '#FFF9E6', label: 'Top 1' },
    'Top2': { color: '#C0C0C0', bg: '#F5F5F5', label: 'Top 2' },
    'Top3': { color: '#CD7F32', bg: '#FFF5F0', label: 'Top 3' },
    'Top4': { color: '#4CAF50', bg: '#E8F5E9', label: 'Top 4' },
    'Top5': { color: '#2196F3', bg: '#E3F2FD', label: 'Top 5' },
    'Top10': { color: '#9C27B0', bg: '#F3E5F5', label: 'Top 10' }
  };
  
  const config = bucketConfig[topBucket] || { color: '#666', bg: '#F5F5F5', label: topBucket };
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      background: ${config.bg};
      color: ${config.color};
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid ${config.color}40;
    ">
      ${config.label}
    </span>
  `;
}

function getIndexWithTopBucket(index, topBucket) {
  const bucketStyles = {
    'Top1': { bg: '#FFD700', color: '#000' },
    'Top2': { bg: '#C0C0C0', color: '#000' },
    'Top3': { bg: '#CD7F32', color: '#fff' },
    'Top4': { bg: '#4CAF50', color: '#fff' },
    'Top5': { bg: '#2196F3', color: '#fff' },
    'Top10': { bg: '#9C27B0', color: '#fff' }
  };
  
  const style = bucketStyles[topBucket];
  
  if (style) {
    return `
      <div style="
        background: ${style.bg};
        color: ${style.color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        margin: 0 auto;
      ">
        ${index}
      </div>
    `;
  }
  
  return `<div style="font-weight: 600; color: #666; font-size: 13px;">${index}</div>`;
}

/**
 * Find missing top bucket terms from 365d data
 */
function findMissingTopBucketTerms() {
  if (!window.searchTermsData365d || window.searchTermsData365d.length === 0) return [];
  
  // Get current search term queries
  const currentQueries = new Set(window.searchTermsData.map(d => d.Query.toLowerCase()));
  
  // Find terms with Top_Bucket in 365d that are not in current data
  const missingTerms = window.searchTermsData365d
    .filter(item => {
      return item['Top_Bucket'] && 
             item['Top_Bucket'] !== '' && 
             !currentQueries.has(item.Query.toLowerCase());
    })
    .map(item => ({
      Query: item.Query,
      'Top Bucket': item['Top_Bucket'],
      Impressions: Math.round(item.Impressions / 12), // Average monthly
      Clicks: Math.round(item.Clicks / 12),
      Conversions: (item.Conversions / 12).toFixed(2),
      Value: item.Value / 12,
      '% of all revenue': item['% of all revenue']
    }));
  
  return missingTerms;
}

/**
 * Render missing top bucket terms section
 */
function renderMissingTopBucketTerms() {
  const missingTerms = findMissingTopBucketTerms();
  
  if (missingTerms.length === 0) return '';
  
  let html = `
    <div style="margin-top: 30px; padding: 20px; background: #fff3e0; border-radius: 8px; border: 1px solid #ffb74d;">
      <h4 style="margin: 0 0 15px 0; color: #e65100; font-size: 16px;">
        📊 Historical Top Performers (Not Active in Current Period)
      </h4>
      <p style="margin: 0 0 15px 0; color: #666; font-size: 13px;">
        These search terms were top performers historically but show no activity in the current period. Values shown are monthly averages from the past year.
      </p>
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 4px; overflow: hidden;">
        <thead>
          <tr style="background: #ffecb3;">
            <th style="padding: 10px; text-align: left; font-size: 13px; color: #e65100;">Search Term</th>
            <th style="padding: 10px; text-align: center; font-size: 13px; color: #e65100;">Bucket</th>
            <th style="padding: 10px; text-align: center; font-size: 13px; color: #e65100;">Avg. Monthly Impressions</th>
            <th style="padding: 10px; text-align: center; font-size: 13px; color: #e65100;">Avg. Monthly Clicks</th>
            <th style="padding: 10px; text-align: center; font-size: 13px; color: #e65100;">Avg. Monthly Conversions</th>
            <th style="padding: 10px; text-align: center; font-size: 13px; color: #e65100;">Avg. Monthly Value</th>
          </tr>
        </thead>
        <tbody>
  `;
  
  missingTerms.forEach((term, index) => {
    const ctr = term.Impressions > 0 ? (term.Clicks / term.Impressions * 100).toFixed(2) : 0;
    const cvr = term.Clicks > 0 ? (term.Conversions / term.Clicks * 100).toFixed(2) : 0;
    
    html += `
      <tr style="background: ${index % 2 === 0 ? 'white' : '#fff8e1'}; border-bottom: 1px solid #ffe0b2;">
        <td style="padding: 10px; font-weight: 500; font-size: 13px;">${term.Query}</td>
        <td style="padding: 10px; text-align: center;">
          ${getTopBucketBadge(term['Top Bucket'])}
        </td>
        <td style="padding: 10px; text-align: center; font-size: 13px;">
          ${term.Impressions.toLocaleString()}
          <div style="font-size: 11px; color: #666;">CTR: ${ctr}%</div>
        </td>
        <td style="padding: 10px; text-align: center; font-size: 13px;">${term.Clicks.toLocaleString()}</td>
        <td style="padding: 10px; text-align: center; font-size: 13px;">
          ${term.Conversions}
          <div style="font-size: 11px; color: #666;">CVR: ${cvr}%</div>
        </td>
        <td style="padding: 10px; text-align: center; font-size: 13px; font-weight: 600;">
          $${term.Value.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
        </td>
      </tr>
    `;
  });
  
  html += `
        </tbody>
      </table>
    </div>
  `;
  
  return html;
}

/**
 * Classify search terms into buckets based on the framework
 */
function classifySearchTermsIntoBuckets(data) {
  // Calculate dynamic thresholds
  const totalConversions = data.reduce((sum, term) => sum + (term.Conversions || 0), 0);
  const totalClicks = data.reduce((sum, term) => sum + (term.Clicks || 0), 0);
  const totalValue = data.reduce((sum, term) => sum + (term.Value || 0), 0);
  const totalRevenue = data.reduce((sum, term) => sum + (term['% of all revenue'] || 0), 0);
  
  const avgCVR = totalClicks > 0 ? (totalConversions / totalClicks) : 0;
  const avgValuePerClick = totalClicks > 0 ? (totalValue / totalClicks) : 0;
  const revenueThreshold = data.length > 0 ? (totalRevenue / data.length) * 2 : 0;
  
  const buckets = {
    'Top Search Terms': { terms: [], color: '#FFD700', description: 'Historical top performers' },
    'Zero Converting Terms': { terms: [], color: '#FF4444', description: 'High clicks, no conversions' },
    'High Revenue Terms': { terms: [], color: '#00C851', description: 'Strong current performers' },
    'Hidden Gems': { terms: [], color: '#33B5E5', description: 'Low volume, converting' },
    'Low Performance': { terms: [], color: '#CCCCCC', description: 'Cleanup candidates' },
    'Mid-Performance': { terms: [], color: '#FF8800', description: 'Monitor and test' }
  };
  
  data.forEach(term => {
    const clicks = term.Clicks || 0;
    const conversions = term.Conversions || 0;
    const value = term.Value || 0;
    const cvr = clicks > 0 ? (conversions / clicks) : 0;
    const valuePerClick = clicks > 0 ? (value / clicks) : 0;
    const revenueShare = term['% of all revenue'] || 0;
    const topBucket = term['Top Bucket'];
    
    // Bucket 1: Top Search Terms
    if (topBucket && topBucket !== '') {
      buckets['Top Search Terms'].terms.push(term);
    }
    // Bucket 2: Zero Converting Terms
    else if (conversions === 0 && clicks >= 50) {
      buckets['Zero Converting Terms'].terms.push(term);
    }
    // Bucket 3: High Revenue Terms
    else if (conversions > 0 && (cvr >= avgCVR || valuePerClick >= avgValuePerClick || revenueShare >= revenueThreshold)) {
      buckets['High Revenue Terms'].terms.push(term);
    }
    // Bucket 4: Hidden Gems
    else if (clicks < 10 && (conversions > 0 || value > 0)) {
      buckets['Hidden Gems'].terms.push(term);
    }
    // Bucket 5: Low Performance
    else if (clicks < 10 && conversions === 0 && value === 0) {
      buckets['Low Performance'].terms.push(term);
    }
    // Bucket 6: Mid-Performance
    else {
      buckets['Mid-Performance'].terms.push(term);
    }
  });
  
  return buckets;
}

/**
 * Calculate aggregated metrics for each bucket
 */
function calculateBucketMetrics(buckets) {
  const bucketMetrics = {};
  
  Object.entries(buckets).forEach(([bucketName, bucketData]) => {
    const terms = bucketData.terms;
    const metrics = {
      count: terms.length,
      clicks: terms.reduce((sum, term) => sum + (term.Clicks || 0), 0),
      impressions: terms.reduce((sum, term) => sum + (term.Impressions || 0), 0),
      conversions: terms.reduce((sum, term) => sum + (term.Conversions || 0), 0),
      value: terms.reduce((sum, term) => sum + (term.Value || 0), 0),
      revenue: terms.reduce((sum, term) => sum + (term['% of all revenue'] || 0), 0)
    };
    
    // Calculate trend data
    const trendMetrics = {
      clicks: 0,
      impressions: 0,
      conversions: 0,
      value: 0
    };
    
    terms.forEach(term => {
      if (term['Trend Data']) {
        trendMetrics.clicks += term['Trend Data'].Clicks || 0;
        trendMetrics.impressions += term['Trend Data'].Impressions || 0;
        trendMetrics.conversions += term['Trend Data'].Conversions || 0;
        trendMetrics.value += term['Trend Data'].Value || 0;
      }
    });
    
    // Calculate percentage changes
    metrics.clicksTrend = trendMetrics.clicks > 0 ? ((metrics.clicks - trendMetrics.clicks) / trendMetrics.clicks * 100) : 0;
    metrics.conversionsTrend = trendMetrics.conversions > 0 ? ((metrics.conversions - trendMetrics.conversions) / trendMetrics.conversions * 100) : 0;
    metrics.valueTrend = trendMetrics.value > 0 ? ((metrics.value - trendMetrics.value) / trendMetrics.value * 100) : 0;
    
    // Calculate rates
    metrics.ctr = metrics.impressions > 0 ? (metrics.clicks / metrics.impressions * 100) : 0;
    metrics.cvr = metrics.clicks > 0 ? (metrics.conversions / metrics.clicks * 100) : 0;
    
    bucketMetrics[bucketName] = {
      ...metrics,
      color: bucketData.color,
      description: bucketData.description
    };
  });
  
  return bucketMetrics;
}

/**
 * Render the search terms stats container with proper modern design
 */
function renderSearchTermsStats(data) {
  const buckets = classifySearchTermsIntoBuckets(data);
  const bucketMetrics = calculateBucketMetrics(buckets);
  
  // Calculate total clicks and revenue for percentages
  const totalClicks = Object.values(bucketMetrics).reduce((sum, bucket) => sum + bucket.clicks, 0);
  const totalRevenue = Object.values(bucketMetrics).reduce((sum, bucket) => sum + (bucket.revenue || 0), 0);
  
  // Prepare chart data for pie chart
  const chartData = Object.entries(bucketMetrics)
    .filter(([_, metrics]) => metrics.clicks > 0)
    .map(([name, metrics]) => ({
      name,
      value: metrics.clicks,
      color: metrics.color,
      percentage: totalClicks > 0 ? (metrics.clicks / totalClicks * 100) : 0,
      metrics
    }));

  let html = `
    <div style="
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 24px;
      margin-bottom: 24px;
    ">
      <!-- Header Section -->
      <div style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 24px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f3f4f6;
      ">
        <h3 style="
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        ">Search Terms Analysis by Performance Bucket</h3>
        <div style="
          font-size: 14px;
          color: #6b7280;
        ">
          ${data.length} total search terms analyzed
        </div>
      </div>
      
      <div style="display: flex; gap: 32px;">
        
        <!-- Left side: Pie Chart -->
        <div style="
          flex: 0 0 240px;
          display: flex;
          flex-direction: column;
          align-items: center;
        ">
          <div style="
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 20px;
            width: 100%;
          ">
            <h4 style="
              margin: 0 0 16px 0;
              text-align: center;
              color: #374151;
              font-size: 14px;
              font-weight: 600;
            ">Click Distribution</h4>
            
            <div style="position: relative; display: flex; justify-content: center;">
              <canvas id="bucketPieChart" width="160" height="160" style="cursor: pointer; display: block;"></canvas>
            </div>
            
            <div style="
              margin-top: 16px;
              text-align: center;
              padding-top: 16px;
              border-top: 1px solid #e5e7eb;
            ">
              <div style="font-size: 20px; font-weight: 700; color: #1f2937;">
                ${totalClicks.toLocaleString()}
              </div>
              <div style="font-size: 13px; color: #6b7280; margin-top: 2px;">
                Total Clicks
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right side: Bucket Cards Grid -->
        <div style="
          flex: 1;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          grid-auto-rows: minmax(160px, auto);
        ">
  `;
  
  // Create stat cards for each bucket
  Object.entries(bucketMetrics).forEach(([bucketName, metrics]) => {
    const clicksPercent = totalClicks > 0 ? (metrics.clicks / totalClicks * 100) : 0;
    const revenuePercent = totalRevenue > 0 ? ((metrics.revenue || 0) / totalRevenue * 100) : 0;
    
    // Format trend indicators
    const getTrendIndicator = (trend) => {
      if (Math.abs(trend) < 0.1) return { arrow: '', color: '#9ca3af', text: '0%' };
      const arrow = trend > 0 ? '↑' : '↓';
      const color = trend > 0 ? '#10b981' : '#ef4444';
      return { arrow, color, text: `${Math.abs(trend).toFixed(1)}%` };
    };
    
    const clicksTrendInd = getTrendIndicator(metrics.clicksTrend || 0);
    const valueTrendInd = getTrendIndicator(metrics.valueTrend || 0);
    
    html += `
      <div class="bucket-stat-card" data-bucket="${bucketName}" style="
        background: #ffffff;
        border: 1px solid #e5e7eb;
        border-radius: 10px;
        padding: 20px;
        transition: all 0.3s ease;
        cursor: pointer;
        position: relative;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      ">
        <!-- Color accent bar -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: ${metrics.color};
        "></div>
        
        <!-- Header Section -->
        <div style="
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 10px;
            flex: 1;
          ">
            <div style="
              width: 12px;
              height: 12px;
              border-radius: 50%;
              background: ${metrics.color};
              flex-shrink: 0;
            "></div>
            <div style="
              font-size: 14px;
              font-weight: 600;
              color: #1f2937;
              line-height: 1.3;
            ">${bucketName}</div>
          </div>
          <div style="
            font-size: 12px;
            color: #6b7280;
            background: #f3f4f6;
            padding: 4px 8px;
            border-radius: 6px;
            white-space: nowrap;
          ">${metrics.count} terms</div>
        </div>
        
        <!-- Main Metrics -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
          flex: 1;
        ">
          <!-- Clicks -->
          <div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 6px;">Clicks</div>
            <div style="
              font-weight: 700;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: baseline;
              gap: 6px;
            ">
              ${metrics.clicks.toLocaleString()}
              ${clicksTrendInd.text !== '0%' ? `
                <span style="
                  color: ${clicksTrendInd.color};
                  font-size: 12px;
                  font-weight: 500;
                ">
                  ${clicksTrendInd.arrow}${clicksTrendInd.text}
                </span>
              ` : ''}
            </div>
          </div>
          
          <!-- Value -->
          <div>
            <div style="color: #6b7280; font-size: 12px; margin-bottom: 6px;">Value</div>
            <div style="
              font-weight: 700;
              color: #1f2937;
              font-size: 18px;
              display: flex;
              align-items: baseline;
              gap: 6px;
            ">
              $${(metrics.value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}
              ${valueTrendInd.text !== '0%' ? `
                <span style="
                  color: ${valueTrendInd.color};
                  font-size: 12px;
                  font-weight: 500;
                ">
                  ${valueTrendInd.arrow}${valueTrendInd.text}
                </span>
              ` : ''}
            </div>
          </div>
        </div>
        
        <!-- Secondary Metrics -->
        <div style="
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
        ">
          <!-- CVR -->
          <div style="
            background: #f9fafb;
            padding: 10px;
            border-radius: 6px;
          ">
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">Conv. Rate</div>
            <div style="
              font-weight: 600;
              color: ${metrics.cvr > 0 ? '#059669' : '#6b7280'};
              font-size: 16px;
            ">${(metrics.cvr || 0).toFixed(1)}%</div>
          </div>
          
          <!-- CTR -->
          <div style="
            background: #f9fafb;
            padding: 10px;
            border-radius: 6px;
          ">
            <div style="color: #6b7280; font-size: 11px; margin-bottom: 4px;">Click Rate</div>
            <div style="
              font-weight: 600;
              color: ${metrics.ctr > 3 ? '#059669' : metrics.ctr > 1 ? '#f59e0b' : '#6b7280'};
              font-size: 16px;
            ">${(metrics.ctr || 0).toFixed(1)}%</div>
          </div>
        </div>
        
        <!-- Percentage Bars -->
        <div style="
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid #f3f4f6;
          display: flex;
          flex-direction: column;
          gap: 10px;
        ">
          <!-- % of Clicks -->
          <div>
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            ">
              <span style="font-size: 11px; color: #6b7280;">% of all clicks</span>
              <span style="font-size: 13px; font-weight: 600; color: #1f2937;">${clicksPercent.toFixed(1)}%</span>
            </div>
            <div style="
              height: 6px;
              background: #f3f4f6;
              border-radius: 3px;
              overflow: hidden;
            ">
              <div style="
                height: 100%;
                background: ${metrics.color};
                width: ${Math.min(clicksPercent, 100)}%;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <!-- % of Revenue -->
          <div>
            <div style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 4px;
            ">
              <span style="font-size: 11px; color: #6b7280;">% of all revenue</span>
              <span style="font-size: 13px; font-weight: 600; color: #1f2937;">${revenuePercent.toFixed(1)}%</span>
            </div>
            <div style="
              height: 6px;
              background: #f3f4f6;
              border-radius: 3px;
              overflow: hidden;
            ">
              <div style="
                height: 100%;
                background: ${metrics.color}88;
                width: ${Math.min(revenuePercent, 100)}%;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += `
        </div>
      </div>
    </div>
    
    <!-- Tooltip -->
    <div id="bucketTooltip" style="
      position: absolute;
      background: rgba(15, 23, 42, 0.95);
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 13px;
      pointer-events: none;
      z-index: 1000;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      display: none;
      font-weight: 500;
      line-height: 1.5;
      max-width: 280px;
    "></div>
  `;
  
  return { html, bucketMetrics, totalClicks };
}

/**
 * Enhanced pie chart rendering with better visuals
 */
function renderBucketPieChart(bucketMetrics, totalClicks) {
  const canvas = document.getElementById('bucketPieChart');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 70;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Prepare data
  const chartData = Object.entries(bucketMetrics)
    .filter(([_, metrics]) => metrics.clicks > 0)
    .map(([name, metrics]) => ({
      name,
      value: metrics.clicks,
      color: metrics.color,
      percentage: totalClicks > 0 ? (metrics.clicks / totalClicks * 100) : 0
    }))
    .sort((a, b) => b.value - a.value); // Sort by value for better visual
  
  if (chartData.length === 0) {
    // Draw placeholder
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.fillStyle = '#64748b';
    ctx.font = '14px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('No data', centerX, centerY);
    return;
  }
  
  // Draw pie slices
  let currentAngle = -Math.PI / 2; // Start at top
  canvas.sliceData = [];
  
  chartData.forEach((slice, index) => {
    const sliceAngle = (slice.value / totalClicks) * 2 * Math.PI;
    
    // Draw slice with shadow
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.fill();
    
    ctx.restore();
    
    // Draw border
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Store slice data for interaction
    canvas.sliceData.push({
      startAngle: currentAngle,
      endAngle: currentAngle + sliceAngle,
      ...slice
    });
    
    currentAngle += sliceAngle;
  });
  
  // Store data for interactions
  canvas.totalClicks = totalClicks;
  canvas.bucketMetrics = bucketMetrics;
}

/**
 * Enhanced event listeners with better interactions
 */
function addBucketChartEventListeners() {
  const canvas = document.getElementById('bucketPieChart');
  const tooltip = document.getElementById('bucketTooltip');
  if (!canvas || !tooltip) return;
  
  let highlightedBucket = null;
  
  // Mouse move for hover effects
  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance <= 70 && canvas.sliceData && canvas.sliceData.length > 0) {
      const angle = Math.atan2(y - centerY, x - centerX);
      let normalizedAngle = angle;
      if (normalizedAngle < -Math.PI / 2) {
        normalizedAngle += 2 * Math.PI;
      }
      
      const hoveredSlice = canvas.sliceData.find(slice => {
        let startAngle = slice.startAngle;
        let endAngle = slice.endAngle;
        
        if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
        if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;
        
        return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      });
      
      if (hoveredSlice) {
        const bucketMetrics = canvas.bucketMetrics[hoveredSlice.name];
        const revenuePercent = ((bucketMetrics.revenue || 0) * 100).toFixed(1);
        
tooltip.innerHTML = `
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 14px;">
            ${hoveredSlice.name}
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #94a3b8;">Terms:</span> 
              <span style="font-weight: 600;">${bucketMetrics.count}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #94a3b8;">Clicks:</span> 
              <span style="font-weight: 600;">${hoveredSlice.value.toLocaleString()}</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #94a3b8;">% of Clicks:</span> 
              <span style="font-weight: 600;">${hoveredSlice.percentage.toFixed(1)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; gap: 20px;">
              <span style="color: #94a3b8;">% of Revenue:</span> 
              <span style="font-weight: 600;">${revenuePercent}%</span>
            </div>
          </div>
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY - 10) + 'px';
        
        canvas.style.cursor = 'pointer';
      } else {
        tooltip.style.display = 'none';
        canvas.style.cursor = 'default';
      }
    } else {
      tooltip.style.display = 'none';
      canvas.style.cursor = 'default';
    }
  });
  
  // Mouse leave
  canvas.addEventListener('mouseleave', () => {
    tooltip.style.display = 'none';
    canvas.style.cursor = 'default';
  });
  
  // Click to highlight
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
    
    if (distance <= 70 && canvas.sliceData && canvas.sliceData.length > 0) {
      const angle = Math.atan2(y - centerY, x - centerX);
      let normalizedAngle = angle;
      if (normalizedAngle < -Math.PI / 2) {
        normalizedAngle += 2 * Math.PI;
      }
      
      const clickedSlice = canvas.sliceData.find(slice => {
        let startAngle = slice.startAngle;
        let endAngle = slice.endAngle;
        
        if (startAngle < -Math.PI / 2) startAngle += 2 * Math.PI;
        if (endAngle < -Math.PI / 2) endAngle += 2 * Math.PI;
        
        return normalizedAngle >= startAngle && normalizedAngle <= endAngle;
      });
      
      if (clickedSlice) {
        // Remove previous highlights
        document.querySelectorAll('.bucket-stat-card').forEach(card => {
          card.style.transform = 'scale(1)';
          card.style.boxShadow = 'none';
          card.style.borderColor = '#e2e8f0';
        });
        
        // Add new highlight
        const card = document.querySelector(`[data-bucket="${clickedSlice.name}"]`);
        if (card) {
          card.style.transform = 'scale(1.02)';
          card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
          card.style.borderColor = clickedSlice.color;
          highlightedBucket = clickedSlice.name;
        }
      }
    }
  });
  
  // Card hover and click interactions
  document.querySelectorAll('.bucket-stat-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      if (highlightedBucket !== card.getAttribute('data-bucket')) {
        card.style.transform = 'translateY(-2px)';
        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
      }
    });
    
    card.addEventListener('mouseleave', () => {
      if (highlightedBucket !== card.getAttribute('data-bucket')) {
        card.style.transform = 'scale(1)';
        card.style.boxShadow = 'none';
      }
    });
    
    card.addEventListener('click', () => {
      // Remove previous highlights
      document.querySelectorAll('.bucket-stat-card').forEach(c => {
        c.style.transform = 'scale(1)';
        c.style.boxShadow = 'none';
        c.style.borderColor = '#e2e8f0';
      });
      
      // Add highlight
      card.style.transform = 'scale(1.02)';
      card.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      const bucketName = card.getAttribute('data-bucket');
      const bucketMetrics = canvas.bucketMetrics[bucketName];
      if (bucketMetrics) {
        card.style.borderColor = bucketMetrics.color;
      }
      highlightedBucket = bucketName;
    });
  });
}

/**
 * Event handlers
 */
function handleSearchTermsFilter(filter) {
  window.searchTermsFilter = filter;
  window.searchTermsCurrentPage = 1; // Reset to first page
  renderSearchTermsTableInternal(document.getElementById('searchTermsContainer'));
}

function handleSearchTermsSort(column) {
  if (window.searchTermsSortColumn === column) {
    window.searchTermsSortAscending = !window.searchTermsSortAscending;
  } else {
    window.searchTermsSortColumn = column;
    window.searchTermsSortAscending = false;
  }
  
  sortSearchTermsData();
  window.searchTermsCurrentPage = 1; // Reset to first page
  renderSearchTermsTableInternal(document.getElementById('searchTermsContainer'));
}

function changeSearchTermsPage(direction) {
  const currentPage = window.searchTermsCurrentPage;
  const totalPages = Math.ceil(getFilteredSearchTermsData().length / window.searchTermsPerPage);
  
  const newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    window.searchTermsCurrentPage = newPage;
    renderSearchTermsTableInternal(document.getElementById('searchTermsContainer'));
  }
}

/**
 * Load product ranking data for all visible search terms
 */
async function loadProductRankingDataForAllTerms() {
  console.log("[Search Terms] Loading product ranking data for all terms...");
  
  const subRows = document.querySelectorAll('.product-ranking-rows');
  const promises = [];
  
  subRows.forEach(subRow => {
    const searchTerm = subRow.getAttribute('data-search-term');
    if (searchTerm) {
      const promise = renderProductRankingSubRows(searchTerm).then(html => {
        if (html) {
          subRow.innerHTML = html;
          // Render pie charts for this search term
          setTimeout(() => {
            renderSearchTermPieCharts(searchTerm);
          }, 50);
          subRow.style.display = 'table-row-group';
        }
      });
      promises.push(promise);
    }
  });
  
  await Promise.all(promises);
  console.log("[Search Terms] Product ranking data loaded for all terms");
}

/**
 * Attach event listeners
 */
function attachSearchTermsEventListeners() {
  console.log("[Search Terms] Attaching event listeners");
  
  // Pagination
  const prevBtn = document.getElementById('searchTermsPrevBtn');
  const nextBtn = document.getElementById('searchTermsNextBtn');
  const pageSelect = document.getElementById('searchTermsPageSelect');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => changeSearchTermsPage(-1));
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => changeSearchTermsPage(1));
  }
  
  if (pageSelect) {
    pageSelect.addEventListener('change', (e) => {
      window.searchTermsCurrentPage = parseInt(e.target.value);
      renderSearchTermsTableInternal(document.getElementById('searchTermsContainer'));
    });
  }
  
  // Sorting
  const sortableHeaders = document.querySelectorAll('.sortable');
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const column = this.getAttribute('data-column');
      handleSearchTermsSort(column);
    });
  });
  
  // Filter buttons
  const filterBtns = document.querySelectorAll('.filter-btn');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      handleSearchTermsFilter(filter);
    });
  });

  // Product Ranking toggle functionality
  const productRankingToggle = document.getElementById('productRankingToggle');
  if (productRankingToggle) {
    // Restore saved state
    productRankingToggle.checked = window.productRankingToggleState || false;
    
    // Style the toggle based on state
    const toggleSlider = productRankingToggle.nextElementSibling;
    if (toggleSlider) {
      if (productRankingToggle.checked) {
        toggleSlider.style.backgroundColor = '#007aff';
      }
    }
    
    // Apply initial state
    if (productRankingToggle.checked) {
      const allSubRows = document.querySelectorAll('.product-ranking-rows');
      const promises = [];
      
      allSubRows.forEach(subRows => {
        const searchTerm = subRows.getAttribute('data-search-term');
        if (searchTerm) {
          const promise = renderProductRankingSubRows(searchTerm).then(html => {
            if (html) {
              subRows.innerHTML = html;
              // Render pie charts for this search term
              setTimeout(() => {
                renderSearchTermPieCharts(searchTerm);
              }, 50);
              subRows.style.display = 'table-row-group';
            }
          });
          promises.push(promise);
        }
      });
      
      Promise.all(promises);
    }
    
    productRankingToggle.addEventListener('change', function() {
      window.productRankingToggleState = this.checked;
      
      // Update toggle styling
      const toggleSlider = this.nextElementSibling;
      if (toggleSlider) {
        if (this.checked) {
          toggleSlider.style.backgroundColor = '#007aff';
        } else {
          toggleSlider.style.backgroundColor = '#ccc';
        }
      }
      
      const allSubRows = document.querySelectorAll('.product-ranking-rows');
      
      if (this.checked) {
        // Load and show product ranking data
        loadProductRankingDataForAllTerms();
      } else {
        // Hide all sub-rows
        allSubRows.forEach(subRows => {
          if (subRows.innerHTML) {
            const rows = subRows.querySelectorAll('.product-ranking-subrow');
            rows.forEach((row, i) => {
              row.style.transition = 'all 0.3s ease';
              row.style.opacity = '0';
              row.style.transform = 'translateY(-10px)';
            });
            setTimeout(() => {
              subRows.style.display = 'none';
              // Clear the HTML to force re-render next time
              subRows.innerHTML = '';
            }, 300);
          }
        });
}
    });
  }
  
  // Render bucket pie chart and add interactions
  setTimeout(() => {
    const canvas = document.getElementById('bucketPieChart');
    if (canvas && window.searchTermsData) {
      const buckets = classifySearchTermsIntoBuckets(window.searchTermsData);
      const bucketMetrics = calculateBucketMetrics(buckets);
      const totalClicks = Object.values(bucketMetrics).reduce((sum, bucket) => sum + bucket.clicks, 0);
      
      renderBucketPieChart(bucketMetrics, totalClicks);
      addBucketChartEventListeners();
    }
  }, 200);
}

/**
 * Add search terms styles
 */
function addSearchTermsStyles() {
  if (!document.getElementById("search-terms-styles")) {
    const style = document.createElement("style");
    style.id = "search-terms-styles";
    style.textContent = `
      .search-terms-table {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 8px;
        overflow: hidden;
      }
      
      .search-terms-table tr:hover {
        opacity: 0.95;
      }

      .pagination-controls button:not(:disabled):hover {
        background-color: #f0f0f0 !important;
        border-color: #999 !important;
      }

      .pagination-controls button:disabled {
        opacity: 0.5;
      }

      .search-terms-table th.sortable:hover {
        background: linear-gradient(to bottom, #f0f0f0, #e8e8e8) !important;
      }

      .search-terms-table tbody tr {
        transition: all 0.2s ease;
      }

      .pagination-controls button:not(:disabled):hover {
        transform: scale(1.05);
      }
      
      .search-terms-table td {
        vertical-align: middle;
      }
      
      .filter-btn:not(.active):hover {
        background: rgba(0, 0, 0, 0.05) !important;
      }
      
      .filter-btn {
        transition: all 0.2s ease;
      }
      
      .filter-btn.active {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .product-ranking-toggle input:checked + .product-ranking-slider {
        background-color: #007aff;
      }

      .product-ranking-toggle input:checked + .product-ranking-slider span {
        transform: translateX(20px);
      }

      .product-ranking-toggle {
        transition: box-shadow 0.3s ease;
      }

      .product-ranking-subrow {
        transition: all 0.3s ease;
      }

      .product-ranking-subrow:hover {
        background-color: #e8f0fe !important;
      }
      
      .search-term-tag {
        display: inline-block;
        background-color: #e8f0fe;
        color: #1a73e8;
        border-radius: 16px;
        padding: 6px 12px;
        font-weight: 500;
        font-size: 14px;
        border-left: none;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        max-width: 90%;
        overflow-wrap: break-word;
        word-wrap: break-word;
        hyphens: auto;
        white-space: normal;
        line-height: 1.4;
        text-align: center;
      }
      .bucket-stat-card {
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      }
      
      .bucket-stat-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
        border-color: #d1d5db !important;
      }
      
      .bucket-stat-card:active {
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
  }
}

// Make functions globally available
window.renderSearchTermsTable = renderSearchTermsTable;
window.loadAndRenderSearchTerms = loadAndRenderSearchTerms;
window.changeSearchTermsPage = changeSearchTermsPage;

// Add styles immediately
addSearchTermsStyles();

console.log("[Search Terms] search_terms_tab.js loaded successfully");
