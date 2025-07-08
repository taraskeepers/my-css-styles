// Google Ads Search Terms Module
// This file contains all functionality related to the Search Terms section

// Load and render search terms data
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
    
    console.log('[loadAndRenderSearchTerms] Loading from table:', tableName);
    
    // Load data from IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data || result.data.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">No search terms data available</div>';
      return;
    }
    
    // Initialize pagination and sorting
    window.searchTermsCurrentPage = 1;
    window.searchTermsPerPage = 100;
    window.searchTermsData = result.data;
    window.searchTermsSortColumn = 'Clicks';
    window.searchTermsSortAscending = false;
    
    // Apply initial sort
    sortSearchTermsData();
    
    // Render the search terms table
    renderSearchTermsTable(container);
    
  } catch (error) {
    console.error('[loadAndRenderSearchTerms] Error:', error);
    container.innerHTML = '<div style="text-align: center; padding: 50px; color: #666;">Error loading search terms data</div>';
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

// Render search terms table with pagination
function renderSearchTermsTable(container) {
  const data = window.searchTermsData;
  const currentPage = window.searchTermsCurrentPage;
  const perPage = window.searchTermsPerPage;
  
  const totalPages = Math.ceil(data.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = Math.min(startIndex + perPage, data.length);
  const pageData = data.slice(startIndex, endIndex);
  
  // Find max values for bar scaling
  const maxImpressions = Math.max(...data.map(d => d.Impressions || 0));
  const maxClicks = Math.max(...data.map(d => d.Clicks || 0));
  
  let html = `
    <div style="margin-bottom: 20px;">
      <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: 600;">Search Terms Performance</h3>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div style="color: #666; font-size: 14px;">
          Showing ${startIndex + 1}-${endIndex} of ${data.length} search terms
        </div>
        <div class="pagination-controls" style="display: flex; gap: 10px; align-items: center;">
          <button id="searchTermsPrevBtn" ${currentPage === 1 ? 'disabled' : ''} 
                  style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: ${currentPage === 1 ? 'not-allowed' : 'pointer'};">
            Previous
          </button>
          <span style="font-size: 14px; color: #333;">Page ${currentPage} of ${totalPages}</span>
          <button id="searchTermsNextBtn" ${currentPage === totalPages ? 'disabled' : ''} 
                  style="padding: 6px 12px; border: 1px solid #ddd; background: white; border-radius: 4px; cursor: ${currentPage === totalPages ? 'not-allowed' : 'pointer'};">
            Next
          </button>
        </div>
      </div>
    </div>
    
    <table class="search-terms-table" style="width: 100%; border-collapse: collapse; background: white;">
      <thead>
        <tr style="background: linear-gradient(to bottom, #ffffff, #f9f9f9); border-bottom: 2px solid #ddd;">
          <th style="padding: 12px; text-align: left; font-weight: 600; width: 60px; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">#</th>
          <th class="sortable" data-column="Query" style="padding: 12px; text-align: left; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            Search Term ${getSortIndicator('Query')}
          </th>
          <th class="sortable" data-column="Impressions" style="padding: 12px; text-align: left; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            Impressions ${getSortIndicator('Impressions')}
          </th>
          <th class="sortable" data-column="Clicks" style="padding: 12px; text-align: left; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            Clicks ${getSortIndicator('Clicks')}
          </th>
          <th class="sortable" data-column="CTR" style="padding: 12px; text-align: right; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            CTR ${getSortIndicator('CTR')}
          </th>
          <th class="sortable" data-column="Conversions" style="padding: 12px; text-align: right; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            Conversions ${getSortIndicator('Conversions')}
          </th>
          <th class="sortable" data-column="CVR" style="padding: 12px; text-align: right; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            CVR ${getSortIndicator('CVR')}
          </th>
          <th class="sortable" data-column="Value" style="padding: 12px; text-align: right; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            Value ${getSortIndicator('Value')}
          </th>
          <th class="sortable" data-column="% of Revenue" style="padding: 12px; text-align: right; font-weight: 600; cursor: pointer; position: sticky; top: 0; background: linear-gradient(to bottom, #ffffff, #f9f9f9);">
            % of Revenue ${getSortIndicator('% of Revenue')}
          </th>
        </tr>
      </thead>
      <tbody>
  `;
  
  pageData.forEach((row, index) => {
    const globalIndex = startIndex + index + 1;
    const ctr = row.Impressions > 0 ? (row.Clicks / row.Impressions * 100).toFixed(2) : 0;
    const cvr = row.Clicks > 0 ? (row.Conversions / row.Clicks * 100).toFixed(2) : 0;
    
    // Calculate bar widths (max 100px)
    const impressionBarWidth = maxImpressions > 0 ? (row.Impressions / maxImpressions * 100) : 0;
    const clickBarWidth = maxClicks > 0 ? (row.Clicks / maxClicks * 100) : 0;
    
    // Get top bucket for this search term
    const topBucket = row['Top Bucket'] || '';
    
    html += `
      <tr style="border-bottom: 1px solid #f0f0f0;">
        <td style="padding: 12px; text-align: center; font-weight: 600; ${getTopBucketStyle(topBucket)}">${globalIndex}</td>
        <td style="padding: 12px;">
          <div style="font-weight: 500; color: #333;">${row.Query}</div>
          ${topBucket && topBucket !== '""' ? getTopBucketBadge(topBucket) : ''}
        </td>
        <td style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="min-width: 60px; text-align: right; font-weight: 600;">${row.Impressions.toLocaleString()}</div>
            <div style="width: 100px; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
              <div style="width: ${impressionBarWidth}%; height: 100%; background: #4285f4;"></div>
            </div>
          </div>
        </td>
        <td style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div style="min-width: 50px; text-align: right; font-weight: 600;">${row.Clicks.toLocaleString()}</div>
            <div style="width: 100px; height: 20px; background: #f0f0f0; border-radius: 10px; overflow: hidden;">
              <div style="width: ${clickBarWidth}%; height: 100%; background: #34a853;"></div>
            </div>
          </div>
        </td>
        <td style="padding: 12px; text-align: right; font-weight: 600; color: ${ctr > 5 ? '#4CAF50' : ctr > 2 ? '#FF9800' : '#F44336'};">${ctr}%</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">${row.Conversions}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600; color: ${cvr > 5 ? '#4CAF50' : cvr > 2 ? '#FF9800' : '#F44336'};">${cvr}%</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">$${parseFloat(row.Value).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600; color: ${row['% of all revenue'] > 0.05 ? '#4CAF50' : '#666'};">
          ${(row['% of all revenue'] * 100).toFixed(2)}%
        </td>
      </tr>
    `;
  });
  
  html += `
      </tbody>
    </table>
  `;
  
  container.innerHTML = html;
  
  // Add event listeners for pagination
  setTimeout(() => {
    const prevBtn = document.getElementById('searchTermsPrevBtn');
    const nextBtn = document.getElementById('searchTermsNextBtn');
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => changeSearchTermsPage(-1));
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => changeSearchTermsPage(1));
    }
    
    // Add event listeners for sorting
    const sortableHeaders = container.querySelectorAll('.sortable');
    sortableHeaders.forEach(header => {
      header.addEventListener('click', function() {
        const column = this.getAttribute('data-column');
        handleSearchTermsSort(column);
      });
    });
  }, 100);
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
    return '<span style="color: #999; font-size: 12px;">—</span>';
  }
  
  const bucketConfig = {
    'Top1': { color: '#FFD700', bg: '#FFF9E6', label: '🏆 Top 1' },
    'Top2': { color: '#C0C0C0', bg: '#F5F5F5', label: '🥈 Top 2' },
    'Top3': { color: '#CD7F32', bg: '#FFF5F0', label: '🥉 Top 3' },
    'Top4': { color: '#4CAF50', bg: '#E8F5E9', label: 'Top 4' },
    'Top5': { color: '#2196F3', bg: '#E3F2FD', label: 'Top 5' },
    'Top10': { color: '#9C27B0', bg: '#F3E5F5', label: 'Top 10' }
  };
  
  const config = bucketConfig[topBucket] || { color: '#666', bg: '#F5F5F5', label: topBucket };
  
  return `
    <div style="
      display: inline-block;
      padding: 4px 12px;
      border-radius: 16px;
      background: ${config.bg};
      color: ${config.color};
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid ${config.color}30;
    ">
      ${config.label}
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

// Add CSS styles for search terms
function addSearchTermsStyles() {
  if (!document.getElementById("search-terms-styles")) {
    const style = document.createElement("style");
    style.id = "search-terms-styles";
    style.textContent = `
      .search-terms-table tr:hover {
        background-color: #e8f0fe !important;
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

      .search-terms-table tbody tr:hover {
        background-color: #f8f9fa !important;
        transform: translateX(2px);
      }

      .pagination-controls button:not(:disabled):hover {
        transform: scale(1.05);
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
