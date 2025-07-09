// Google Ads Search Terms Module
// This file contains all functionality related to the Search Terms section

async function loadAndRenderSearchTerms() {
  const container = document.getElementById('search_terms_container');
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
    
    // Create a map of Top_Bucket values from 365d data (first 10 records)
    const topBucketMap = {};
    if (result365d && result365d.data) {
      result365d.data.slice(0, 10).forEach(item => {
        if (item.Query && item.Top_Bucket) {
          topBucketMap[item.Query.toLowerCase()] = item.Top_Bucket;
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
    
    // Initialize pagination and sorting
    window.searchTermsCurrentPage = 1;
    window.searchTermsPerPage = 50; // Changed from 100 to 50
    window.searchTermsData = filteredData;
    window.searchTermsSortColumn = 'Clicks';
    window.searchTermsSortAscending = false;
    // Store 365d data for missing terms analysis
window.searchTerms365dData = result365d && result365d.data ? result365d.data : [];
    // Initialize filter state
window.searchTermsFilter = 'all'; // 'all', 'topbucket', 'negatives'
    
    // Apply initial sort
    sortSearchTermsData();
    
    // Render the search terms table
    renderSearchTermsTable(container);
    
  } catch (error) {
    console.error('[loadAndRenderSearchTerms] Error:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Error loading search terms data</div>';
  }
}

// Function to get total unique products count
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

// Sort search terms data
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
      case '% of Revenue':
        aVal = a['% of all revenue'] || 0;
        bVal = b['% of all revenue'] || 0;
        break;
      default:
        aVal = 0;
        bVal = 0;
    }
    
    if (ascending) {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
}

// Filter search terms data based on selected filter
function getFilteredSearchTermsData() {
  let filteredData = [...window.searchTermsData];
  
  switch(window.searchTermsFilter) {
    case 'topbucket':
      filteredData = filteredData.filter(item => item['Top Bucket'] && item['Top Bucket'] !== '');
      break;
    case 'negatives':
      filteredData = filteredData.filter(item => item.Clicks >= 50 && item.Conversions === 0);
      break;
    case 'all':
    default:
      // No filter needed
      break;
  }
  
  return filteredData;
}

// Calculate summary data for filtered results
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

// Find missing top bucket terms from 365d data
function findMissingTopBucketTerms() {
  if (!window.searchTerms365dData || window.searchTerms365dData.length === 0) return [];
  
  // Get current search term queries
  const currentQueries = new Set(window.searchTermsData.map(d => d.Query.toLowerCase()));
  
  // Find terms with Top_Bucket in 365d that are not in current data
  const missingTerms = window.searchTerms365dData
    .filter(item => {
      return item.Top_Bucket && 
             item.Top_Bucket !== '' && 
             !currentQueries.has(item.Query.toLowerCase());
    })
    .map(item => ({
      Query: item.Query,
      'Top Bucket': item.Top_Bucket,
      Impressions: Math.round(item.Impressions / 12), // Average monthly
      Clicks: Math.round(item.Clicks / 12),
      Conversions: (item.Conversions / 12).toFixed(2),
      Value: item.Value / 12,
      '% of all revenue': item['% of all revenue']
    }));
  
  return missingTerms;
}

// Render summary row
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

// Render missing top bucket terms section
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

// Handle filter change
function handleSearchTermsFilter(filter) {
  window.searchTermsFilter = filter;
  window.searchTermsCurrentPage = 1; // Reset to first page
  renderSearchTermsTable(document.getElementById('search_terms_container'));
}

// Handle column sort
function handleSearchTermsSort(column) {
  if (window.searchTermsSortColumn === column) {
    window.searchTermsSortAscending = !window.searchTermsSortAscending;
  } else {
    window.searchTermsSortColumn = column;
    window.searchTermsSortAscending = false;
  }
  
  sortSearchTermsData();
  window.searchTermsCurrentPage = 1; // Reset to first page
  renderSearchTermsTable(document.getElementById('search_terms_container'));
}

function renderSearchTermsTable(container) {
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
          <th class="sortable" data-column="% of Revenue" style="padding: 12px 8px; text-align: center; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9); font-size: 14px;">
            % of Revenue ${getSortIndicator('% of Revenue')}
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
        renderSearchTermsTable(container);
      });
    }
    
    // Sorting
    const sortableHeaders = container.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const column = this.getAttribute('data-column');
        handleSearchTermsSort(column);
      });
    });
    
    // Filter buttons
    const filterBtns = container.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const filter = this.getAttribute('data-filter');
        handleSearchTermsFilter(filter);
      });
    });

// Add Product Ranking toggle functionality
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
    const isChecked = this.checked;
    window.productRankingToggleState = isChecked;
    
    // Update toggle styling
const toggleSlider = this.nextElementSibling;
if (toggleSlider) {
  if (isChecked) {
    toggleSlider.style.backgroundColor = '#007aff';
  } else {
    toggleSlider.style.backgroundColor = '#ccc';
  }
}
    
    const allSubRows = document.querySelectorAll('.product-ranking-rows');
    
    if (isChecked) {
      const promises = [];
      
      allSubRows.forEach(subRows => {
        const searchTerm = subRows.getAttribute('data-search-term');
        if (searchTerm && !subRows.innerHTML) {
          const promise = renderProductRankingSubRows(searchTerm).then(html => {
            if (html) {
              subRows.innerHTML = html;
// Render pie charts for this search term
setTimeout(() => {
  renderSearchTermPieCharts(searchTerm);
}, 50);
              subRows.style.display = 'table-row-group';
              
              // Animate the appearance
              subRows.querySelectorAll('.product-ranking-subrow').forEach((row, i) => {
                row.style.opacity = '0';
                row.style.transform = 'translateY(-10px)';
                setTimeout(() => {
                  row.style.transition = 'all 0.3s ease';
                  row.style.opacity = '1';
                  row.style.transform = 'translateY(0)';
                }, i * 50);
              });
            }
          });
          promises.push(promise);
        } else if (subRows.innerHTML) {
          subRows.style.display = 'table-row-group';
        }
      });
      
      Promise.all(promises);
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
    
  }, 100);
}

// Function to calculate product ranking metrics for a search term
async function calculateProductRankingMetrics(searchTerm) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return [];
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Get total products count
  const totalProducts = await getTotalProductsCount();
  
  // Use the same date range as product map (30 days)
  //const days = window.selectedDateRangeDays || 30;
  const days = 7;
  const endDate = moment().subtract(1, 'days'); // Yesterday as end date
  const startDate = endDate.clone().subtract(days - 1, 'days');
  
  // For trend comparison, use previous period
  const prevEndDate = startDate.clone().subtract(1, 'days');
  const prevStartDate = prevEndDate.clone().subtract(days - 1, 'days');
  
  // Get company to filter
  const companyToFilter = window.myCompany || '';
  
  // Group products by location and device
  const groupedData = {};
  
  window.allRows.forEach(product => {
    if (product.q && product.q.toLowerCase().trim() === normalizedTerm &&
        product.source && product.source.toLowerCase() === companyToFilter.toLowerCase()) {
      
      const key = `${product.location_requested}|${product.device}`;
      if (!groupedData[key]) {
        groupedData[key] = {
          location: product.location_requested,
          device: product.device,
          products: []
        };
      }
      groupedData[key].products.push(product);
    }
  });
  
  // Calculate metrics for each location/device combination
  const results = [];
  
  for (const group of Object.values(groupedData)) {
    let totalRankSum = 0;
    let totalRankCount = 0;
    let totalShareSum = 0;
    let totalShareCount = 0;
    let prevRankSum = 0;
    let prevRankCount = 0;
    let prevShareSum = 0;
    let prevShareCount = 0;
    let activeCount = 0;
    let inactiveCount = 0;
    
    group.products.forEach(product => {
      // Check if product is active or inactive
      if (product.product_status === 'inactive') {
        inactiveCount++;
      } else {
        activeCount++;
      }
      
      if (product.historical_data && Array.isArray(product.historical_data)) {
        // Current period data
        product.historical_data.forEach(item => {
          if (!item.date || !item.date.value) return;
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          
          if (itemDate.isBetween(startDate, endDate, 'day', '[]')) {
            if (item.avg_position) {
              totalRankSum += parseFloat(item.avg_position);
              totalRankCount++;
            }
            if (item.market_share !== undefined) {
              totalShareSum += parseFloat(item.market_share) * 100;
              totalShareCount++;
            } else if (item.visibility !== undefined) {
              totalShareSum += parseFloat(item.visibility) * 100;
              totalShareCount++;
            }
          } else if (itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]')) {
            if (item.avg_position) {
              prevRankSum += parseFloat(item.avg_position);
              prevRankCount++;
            }
            if (item.market_share !== undefined) {
              prevShareSum += parseFloat(item.market_share) * 100;
              prevShareCount++;
            } else if (item.visibility !== undefined) {
              prevShareSum += parseFloat(item.visibility) * 100;
              prevShareCount++;
            }
          }
        });
      }
    });
    
    // Calculate averages
    const avgRank = totalRankCount > 0 ? totalRankSum / totalRankCount : 0;
    const prevAvgRank = prevRankCount > 0 ? prevRankSum / prevRankCount : 0;
    const marketShare = totalShareCount > 0 ? totalShareSum / totalShareCount : 0;
    const prevMarketShare = prevShareCount > 0 ? prevShareSum / prevShareCount : 0;
    
    // Calculate trends
    const rankTrend = avgRank > 0 && prevAvgRank > 0 ? avgRank - prevAvgRank : 0;
    const shareTrend = marketShare - prevMarketShare;
    
    // Calculate percentage of all products
    const percentOfAllProducts = totalProducts > 0 ? ((activeCount / totalProducts) * 100) : 0;
    
    results.push({
      location: group.location,
      device: group.device,
      avgRank: avgRank,
      rankTrend: rankTrend,
      marketShare: marketShare,
      shareTrend: shareTrend,
      activeProducts: activeCount,
      inactiveProducts: inactiveCount,
      percentOfAllProducts: percentOfAllProducts,
      totalProducts: totalProducts
    });
  }
  
  return results;
}

// Function to render product ranking sub-rows
function renderProductRankingSubRows(searchTerm) {
  const metricsPromise = calculateProductRankingMetrics(searchTerm);
  
  // Return a promise that resolves to the HTML
  return metricsPromise.then(metrics => {
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
              <!-- Active Products (Main metric) -->
              <div style="flex: 0 0 auto; text-align: center; background: #333; border-radius: 8px; padding: 8px 16px; min-width: 80px;">
                <div style="font-size: 20px; font-weight: 700; color: white; line-height: 1;">
                  ${metric.activeProducts}
                </div>
                <div style="font-size: 10px; color: #ccc; margin-top: 2px; font-weight: 600;">
                  PRODUCTS
                </div>
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
              
              <!-- Device -->
              <div style="flex: 0 0 30px; font-size: 20px; text-align: center;">
                ${deviceIcon}
              </div>
              
              <!-- Avg Rank (styled box) -->
              <div style="flex: 0 0 120px; text-align: center;">
                <div style="font-size: 11px; color: #666; margin-bottom: 4px;">Avg Rank</div>
                <div style="display: inline-flex; align-items: center; background: #f5f5f5; border-radius: 6px; padding: 6px 12px; border: 1px solid #e0e0e0;">
                  <span style="font-size: 18px; font-weight: 700; color: #333;">
                    ${metric.avgRank > 0 ? metric.avgRank.toFixed(1) : '-'}
                  </span>
                  ${rankArrow ? `<span style="font-size: 13px; color: ${rankColor}; margin-left: 8px;">
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
    
    // After building HTML, render pie charts when the HTML is inserted
    window.searchTermsPieChartData = window.searchTermsPieChartData || {};
    window.searchTermsPieChartData[searchTerm] = metrics;
    
    return html;
  });
}

// Function to render pie charts for a specific search term
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

// Get sort indicator
function getSortIndicator(column) {
  if (window.searchTermsSortColumn === column) {
    return window.searchTermsSortAscending ? ' ▲' : ' ▼';
  }
  return '';
}

// Get top bucket style for row number
function getTopBucketStyle(topBucket) {
  if (!topBucket || topBucket === '""' || topBucket === '') {
    return 'color: #666;';
  }
  
  const styles = {
    'Top1': 'color: #FFD700; background: #FFF9E6; padding: 4px 8px; border-radius: 6px;',
    'Top2': 'color: #C0C0C0; background: #F5F5F5; padding: 4px 8px; border-radius: 6px;',
    'Top3': 'color: #CD7F32; background: #FFF5F0; padding: 4px 8px; border-radius: 6px;',
    'Top4': 'color: #4CAF50; background: #E8F5E9; padding: 4px 8px; border-radius: 6px;',
    'Top5': 'color: #2196F3; background: #E3F2FD; padding: 4px 8px; border-radius: 6px;',
    'Top10': 'color: #9C27B0; background: #F3E5F5; padding: 4px 8px; border-radius: 6px;'
  };
  
  return styles[topBucket] || 'color: #666;';
}

// Get top bucket badge HTML
function getTopBucketBadge(topBucket) {
  if (!topBucket || topBucket === '""' || topBucket === '') {
    return '';
  }
  
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

// Get index cell with top bucket styling
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

// Get metric with trend and bar
function getMetricWithTrend(currentValue, previousValue, type, barWidth = null, isSummary = false) {
  const current = parseFloat(currentValue) || 0;
  const previous = parseFloat(previousValue) || 0;
  
  let formattedCurrent = '';
  let trendHtml = '';
  
  // Format current value based on type
  switch(type) {
    case 'impressions':
    case 'clicks':
    case 'conversions':
      formattedCurrent = current.toLocaleString();
      break;
    case 'value':
      formattedCurrent = '$' + current.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
      break;
  }
  
  // Calculate trend if previous data exists
  if (previous > 0) {
    const change = current - previous;
    const changePercent = ((change / previous) * 100).toFixed(1);
    const isPositive = change >= 0;
    const arrow = isPositive ? '↑' : '↓';
    const color = isPositive ? '#4CAF50' : '#F44336';
    
    trendHtml = `
      <div style="font-size: ${isSummary ? '12px' : '11px'}; color: ${color}; margin-top: 2px;">
        ${arrow} ${Math.abs(changePercent)}%
      </div>
    `;
  }
  
  // Add bar for impressions and clicks
  let barHtml = '';
  if (barWidth !== null && (type === 'impressions' || type === 'clicks')) {
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

// Change page function
function changeSearchTermsPage(direction) {
  const currentPage = window.searchTermsCurrentPage;
  const totalPages = Math.ceil(window.searchTermsData.length / window.searchTermsPerPage);
  
  const newPage = currentPage + direction;
  if (newPage >= 1 && newPage <= totalPages) {
    window.searchTermsCurrentPage = newPage;
    const container = document.getElementById('search_terms_container');
    renderSearchTermsTable(container);
  }
}

// Initialize search terms button event listener
function initializeSearchTermsButton() {
  const viewSearchTermsGoogleAdsBtn = document.getElementById("viewSearchTermsGoogleAds");
  
  if (viewSearchTermsGoogleAdsBtn) {
    viewSearchTermsGoogleAdsBtn.addEventListener("click", function() {
      console.log('[Search Terms] Button clicked');
      
      // Clear all active states
      viewSearchTermsGoogleAdsBtn.classList.add("active");
      document.getElementById("viewPerformanceOverviewGoogleAds")?.classList.remove("active");
      document.getElementById("viewOverviewGoogleAds")?.classList.remove("active");
      document.getElementById("viewChartsGoogleAds")?.classList.remove("active");
      document.getElementById("viewMapGoogleAds")?.classList.remove("active");
      document.getElementById("viewBucketsGoogleAds")?.classList.remove("active");

      // Collapse the navigation panel
      const navPanel = document.getElementById('googleAdsNavPanel');
      const contentWrapper = document.querySelector('.google-ads-content-wrapper');
      if (navPanel) {
        navPanel.classList.add('collapsed');
      }
      if (contentWrapper) {
        contentWrapper.classList.add('nav-collapsed');
      }

      // Hide all other containers
      const table = document.querySelector('.google-ads-table');
      if (table) table.style.display = 'none';
      
      const productInfo = document.getElementById('product_info');
      const productMetrics = document.getElementById('product_metrics');
      const productRankingMap = document.getElementById('google_ads_ranking_map');
      const productTables = document.getElementById('product_tables');
      const mapContainer = document.getElementById('googleAdsMapContainer');
      const roasCharts = document.getElementById('roas_charts');
      const roasMetricsTable = document.getElementById('roas_metrics_table');
      const roasChannels = document.getElementById('roas_channels');
      const buckets_products = document.getElementById('buckets_products');
      const bucketedProductsContainer = document.getElementById('bucketed_products_container');
      
      if (productInfo) productInfo.style.display = 'none';
      if (productMetrics) productMetrics.style.display = 'none';
      if (productRankingMap) productRankingMap.style.display = 'none';
      if (productTables) productTables.style.display = 'none';
      if (mapContainer) mapContainer.style.display = 'none';
      if (roasCharts) roasCharts.style.display = 'none';
      if (roasMetricsTable) roasMetricsTable.style.display = 'none';
      if (roasChannels) roasChannels.style.display = 'none';
      if (buckets_products) buckets_products.style.display = 'none';
      if (bucketedProductsContainer) bucketedProductsContainer.style.display = 'none';

      // Hide buckets switcher
      const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
      if (switcherWrapper) switcherWrapper.style.display = 'none';
      const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
      if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';

      // Show search terms container
      const searchTermsContainer = document.getElementById('search_terms_container');
      if (searchTermsContainer) searchTermsContainer.style.display = 'block';

      // Hide toggle controls
      const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
      const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
      if (chartModeToggle) chartModeToggle.style.display = 'none';
      if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';

      // Hide BOTH date range selectors
      const productInfoDateRange = document.getElementById('productInfoDateRange');
      if (productInfoDateRange) productInfoDateRange.style.display = 'none';
      
      const bucketDateRange = document.getElementById('bucketDateRange');
      if (bucketDateRange) bucketDateRange.style.display = 'none';

      // Load and render search terms data
      loadAndRenderSearchTerms();
    });
  }
}

function addSearchTermsStyles() {
  if (!document.getElementById("search-terms-styles")) {
    const style = document.createElement("style");
    style.id = "search-terms-styles";
    style.textContent = `
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
/* Add to existing styles */
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
    `;
    document.head.appendChild(style);
  }
}

// Export functions to window
window.changeSearchTermsPage = changeSearchTermsPage;
window.loadAndRenderSearchTerms = loadAndRenderSearchTerms;
window.initializeSearchTermsButton = initializeSearchTermsButton;

// Add styles immediately
addSearchTermsStyles();
