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
    
    // Process the data
    window.searchTermsData = result?.data || [];
    window.searchTermsData365d = result365d?.data || [];
    window.searchTermsData90d = result90d?.data || [];
    
    // Initialize pagination and sorting
    window.searchTermsCurrentPage = 1;
    window.searchTermsPerPage = 50;
    window.searchTermsSortColumn = 'Impressions';
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
  
  let html = `
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
  
  // Render table rows
  pageData.forEach((row, index) => {
    const globalIndex = startIndex + index + 1;
    const ctr = row.Impressions > 0 ? (row.Clicks / row.Impressions * 100).toFixed(2) : 0;
    const cvr = row.Clicks > 0 ? (row.Conversions / row.Clicks * 100).toFixed(2) : 0;
    const cvrColor = cvr > avgCVR ? '#4CAF50' : cvr > avgCVR * 0.5 ? '#FF9800' : '#F44336';
    
    // Get bar widths for visualization
    const impressionBarWidth = maxImpressions > 0 ? (row.Impressions / maxImpressions * 100) : 0;
    const clickBarWidth = maxClicks > 0 ? (row.Clicks / maxClicks * 100) : 0;
    
    // Get trend data if available
    const trendData = window.searchTermsData90d.find(d => d.Query === row.Query);
    
    // Get top bucket from 365d data
    const bucketData365d = window.searchTermsData365d.find(d => d.Query === row.Query);
    const topBucket = bucketData365d ? bucketData365d['Top Bucket'] : null;
    
    html += `
      <tr style="border-bottom: 1px solid #eee;" data-search-term="${row.Query}">
        <td style="padding: 8px; text-align: center; font-weight: 600; color: #666;">${globalIndex}</td>
        <td style="padding: 8px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="search-term-tag">${row.Query}</span>
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
 * Helper functions for data filtering, sorting, and display
 */
function getFilteredSearchTermsData() {
  let data = [...window.searchTermsData];
  
  switch(window.searchTermsFilter) {
    case 'topbucket':
      // Filter for items that have Top Bucket data in 365d
      data = data.filter(item => {
        const bucketData = window.searchTermsData365d.find(d => d.Query === item.Query);
        return bucketData && bucketData['Top Bucket'];
      });
      break;
    case 'negatives':
      // Filter for potential negative terms (low CTR, no conversions)
      data = data.filter(item => {
        const ctr = item.Impressions > 0 ? (item.Clicks / item.Impressions * 100) : 0;
        return ctr < 1 && item.Conversions === 0 && item.Impressions > 100;
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

function getMetricWithTrend(current, previous, type, barWidth = null) {
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
      <div style="font-size: 11px; color: ${changeColor}; margin-top: 2px;">
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
  
  return `
    <div>
      <div style="font-weight: 600; font-size: 14px;">${formattedCurrent}</div>
      ${trendHtml}
      ${barHtml}
    </div>
  `;
}

function getTopBucketBadge(topBucket) {
  if (!topBucket) return '';
  
  return `
    <span style="
      background: linear-gradient(135deg, #ff6b6b, #feca57);
      color: white;
      padding: 2px 6px;
      border-radius: 10px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      margin-left: 8px;
      white-space: nowrap;
    ">${topBucket}</span>
  `;
}

function renderMissingTopBucketTerms() {
  // Find terms in 365d data that are not in current period
  const currentQueries = new Set(window.searchTermsData.map(d => d.Query));
  const missingTerms = window.searchTermsData365d.filter(d => 
    d['Top Bucket'] && !currentQueries.has(d.Query)
  ).slice(0, 10);
  
  if (missingTerms.length === 0) return '';
  
  let html = `
    <div style="margin-top: 30px; background: linear-gradient(135deg, #fff3e0, #fff8e1); border-radius: 10px; padding: 20px; border-left: 5px solid #ff9800;">
      <h4 style="margin: 0 0 15px 0; color: #e65100; font-size: 16px;">Missing Top Bucket Terms</h4>
      <p style="margin: 0 0 15px 0; color: #bf360c; font-size: 14px;">
        These terms had performance in your top buckets over the last 365 days but haven't appeared in the current period.
      </p>
      
      <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden;">
        <thead>
          <tr style="background: #f57c00; color: white;">
            <th style="padding: 10px; text-align: left; font-size: 13px;">Search Term</th>
            <th style="padding: 10px; text-align: center; font-size: 13px;">Top Bucket</th>
            <th style="padding: 10px; text-align: center; font-size: 13px;">Avg. Monthly Impressions</th>
            <th style="padding: 10px; text-align: center; font-size: 13px;">Avg. Monthly Clicks</th>
            <th style="padding: 10px; text-align: center; font-size: 13px;">Avg. Monthly Conversions</th>
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
      allSubRows.forEach(subRow => {
        subRow.style.display = 'table-row-group';
      });
    }
    
    productRankingToggle.addEventListener('change', function() {
      window.productRankingToggleState = this.checked;
      
      const allSubRows = document.querySelectorAll('.product-ranking-rows');
      if (this.checked) {
        // Show all sub-rows and load data if needed
        allSubRows.forEach(subRow => {
          subRow.style.display = 'table-row-group';
        });
        
        // Load product ranking data for all visible search terms
        loadProductRankingDataForAllTerms();
      } else {
        // Hide all sub-rows
        allSubRows.forEach(subRow => {
          subRow.style.display = 'none';
        });
      }
    });
  }
}

async function loadProductRankingDataForAllTerms() {
  // This would load product ranking data for each search term
  // For now, we'll just show placeholder data
  console.log("[Search Terms] Loading product ranking data...");
  
  const subRows = document.querySelectorAll('.product-ranking-rows');
  subRows.forEach(subRow => {
    const searchTerm = subRow.getAttribute('data-search-term');
    if (subRow.innerHTML.trim() === '') {
      // Add placeholder product ranking data
      subRow.innerHTML = `
        <tr style="background: #f8f9fa;">
          <td colspan="9" style="padding: 10px 20px;">
            <div style="font-size: 12px; color: #666;">
              Product ranking data for "${searchTerm}" - Loading...
            </div>
          </td>
        </tr>
      `;
    }
  });
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
