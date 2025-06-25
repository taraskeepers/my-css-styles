// Simple function to check if a table exists
async function checkTableExists(tableName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Check if projectData store exists
      if (!db.objectStoreNames.contains('projectData')) {
        db.close();
        resolve(false);
        return;
      }
      
      // Check if the table exists in projectData
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = () => {
        const exists = getRequest.result !== undefined;
        db.close();
        resolve(exists);
      };
      
      getRequest.onerror = () => {
        db.close();
        resolve(false);
      };
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

// Function to normalize bucket value to CSS class
function normalizeBucketValue(bucketValue) {
  if (!bucketValue) return '';
  
  return bucketValue
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
}

// Function to get bucket badge HTML
function getBucketBadgeHTML(bucketData, bucketType = 'PROFITABILITY_BUCKET') {
  if (!bucketData) return '';
  
  let bucketValue = '';
  try {
    // Parse the JSON value
    const parsed = JSON.parse(bucketData[bucketType] || '{}');
    bucketValue = parsed.value || '';
  } catch (e) {
    // If not JSON, use raw value
    bucketValue = bucketData[bucketType] || '';
  }
  
  if (!bucketValue || bucketValue === '') return '';
  
  const normalizedClass = normalizeBucketValue(bucketValue);
  const displayText = bucketValue.substring(0, 20) + (bucketValue.length > 20 ? '...' : '');
  
  return `<div class="bucket-badge ${normalizedClass}" title="${bucketValue}">${displayText}</div>`;
}

// Function to create metrics popup
function createMetricsPopup(bucketData) {
  if (!bucketData) return null;
  
  const popup = document.createElement('div');
  popup.className = 'product-metrics-popup';
  
  // Store bucket data for tab switching
  popup.bucketData = bucketData;
  
  // Helper functions
  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    if (num === 0) return '0';
    if (decimals === 0) return num.toLocaleString();
    return num.toFixed(decimals);
  };
  
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  const getTrend = (current, previous) => {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    if (prev === 0) return { arrow: '', class: 'trend-neutral', value: '-' };
    
    const change = ((curr - prev) / prev) * 100;
    if (Math.abs(change) < 0.1) return { arrow: '±', class: 'trend-neutral', value: '0%' };
    
    return {
      arrow: change > 0 ? '▲' : '▼',
      class: change > 0 ? 'trend-up' : 'trend-down',
      value: Math.abs(change).toFixed(1) + '%'
    };
  };
  
  const getHealthScoreColor = (score) => {
    const s = parseInt(score) || 0;
    if (s >= 8) return '#28a745';
    if (s >= 6) return '#ffc107';
    if (s >= 4) return '#fd7e14';
    return '#dc3545';
  };
  
  const parseBucket = (bucketStr) => {
    try {
      return JSON.parse(bucketStr);
    } catch {
      return { value: bucketStr || 'N/A', explanation: '' };
    }
  };
  
  const parseSuggestions = (suggestionsStr) => {
    try {
      const parsed = JSON.parse(suggestionsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  
  // Create trend HTML helper
  const createTrendHTML = (current, previous) => {
    const trend = getTrend(current, previous);
    if (trend.value === '-') return '';
    return `<div class="metric-trend ${trend.class}">${trend.arrow} ${trend.value}</div>`;
  };
  
  const profitability = parseBucket(bucketData['PROFITABILITY_BUCKET']);
  const funnelStage = parseBucket(bucketData['FUNNEL_STAGE_BUCKET']);
  const investment = parseBucket(bucketData['INVESTMENT_BUCKET']);
  const customTier = parseBucket(bucketData['CUSTOM_TIER_BUCKET']);
  const suggestions = parseSuggestions(bucketData['SUGGESTIONS_BUCKET']);
  
  const fullTitle = bucketData['Product Title'] || 'Unknown Product';
  const sellers = bucketData['SELLERS'] || 'Standard';
  
  // Create header
  const headerHTML = `
    <div class="popup-header">
      <div class="header-title">${fullTitle}</div>
      ${sellers !== 'Standard' && sellers !== 'N/A' ? `<div class="sellers-badge sellers-${sellers.toLowerCase().replace(/\s+/g, '-')}">${sellers}</div>` : ''}
    </div>
  `;
  
  // Create tabs
  const tabsHTML = `
    <div class="popup-tabs">
      <button class="popup-tab active" data-tab="performance">PERFORMANCE</button>
      <button class="popup-tab" data-tab="campaigns">CAMPAIGNS</button>
      <button class="popup-tab" data-tab="ranking">RANKING MAP</button>
    </div>
  `;
  
  // Create performance content (current content)
  const performanceContent = `
    <div class="popup-tab-content active" data-content="performance">
      <!-- ROAS Hero Section -->
      <div class="roas-hero-section">
        <div class="roas-metrics">
          <div class="roas-main">
            <div class="roas-label">ROAS</div>
            <div class="roas-value ${bucketData['ROAS'] >= 2.5 ? 'roas-good' : bucketData['ROAS'] >= 1.5 ? 'roas-medium' : 'roas-poor'}">
              ${formatNumber(bucketData['ROAS'], 1)}x
            </div>
            ${createTrendHTML(bucketData['ROAS'], bucketData['prev_ROAS'])}
          </div>
          <div class="roas-supporting">
            <div class="supporting-metric">
              <div class="supporting-label">Revenue</div>
              <div class="supporting-value">${formatCurrency(bucketData['ConvValue'])}</div>
              ${createTrendHTML(bucketData['ConvValue'], bucketData['prev_ConvValue'])}
            </div>
            <div class="supporting-metric">
              <div class="supporting-label">Conversions</div>
              <div class="supporting-value">${formatNumber(bucketData['Conversions'], 0)}</div>
              ${createTrendHTML(bucketData['Conversions'], bucketData['prev_Conversions'])}
            </div>
          </div>
        </div>
        <div class="health-confidence-container">
          <div class="health-item">
            <div class="health-label">Health</div>
            <div class="health-value" style="color: ${getHealthScoreColor(bucketData['HEALTH_SCORE'])}">
              ${bucketData['HEALTH_SCORE'] || '-'}/10
            </div>
          </div>
          <div class="confidence-item">
            <div class="confidence-label">Confidence</div>
            <div class="confidence-value confidence-${(bucketData['Confidence_Level'] || 'Low').toLowerCase()}">
              ${bucketData['Confidence_Level'] || 'Low'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="metric-section">
        <div class="section-title">Performance Metrics</div>
        <div class="metrics-grid four-col">
          <div class="metric-item">
            <span class="metric-label">Impressions</span>
            <div class="metric-value">${formatNumber(bucketData['Impressions'], 0)}</div>
            ${createTrendHTML(bucketData['Impressions'], bucketData['prev_Impressions'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">Clicks</span>
            <div class="metric-value">${formatNumber(bucketData['Clicks'], 0)}</div>
            ${createTrendHTML(bucketData['Clicks'], bucketData['prev_Clicks'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CTR</span>
            <div class="metric-value">${formatNumber(bucketData['CTR'], 2)}%</div>
            ${createTrendHTML(bucketData['CTR'], bucketData['prev_CTR'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CVR</span>
            <div class="metric-value">${formatNumber(bucketData['CVR'], 2)}%</div>
            ${createTrendHTML(bucketData['CVR'], bucketData['prev_CVR'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">Cost</span>
            <div class="metric-value">${formatCurrency(bucketData['Cost'])}</div>
            ${createTrendHTML(bucketData['Cost'], bucketData['prev_Cost'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CPC</span>
            <div class="metric-value">${formatCurrency(bucketData['Avg CPC'])}</div>
            ${createTrendHTML(bucketData['Avg CPC'], bucketData['prev_Avg CPC'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CPA</span>
            <div class="metric-value">${formatCurrency(bucketData['CPA'])}</div>
            ${createTrendHTML(bucketData['CPA'], bucketData['prev_CPA'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">AOV</span>
            <div class="metric-value">${formatCurrency(bucketData['AOV'])}</div>
            ${createTrendHTML(bucketData['AOV'], bucketData['prev_AOV'])}
          </div>
        </div>
      </div>
      
      <!-- Funnel & Classifications -->
      <div class="metric-section">
        <div class="section-title">Funnel & Classifications</div>
        <div class="funnel-classifications-container">
          <div class="funnel-rates">
            <div class="funnel-item">
              <div class="funnel-icon">🛒</div>
              <div class="funnel-details">
                <div class="funnel-label">Cart</div>
                <div class="funnel-value">${formatNumber(bucketData['Cart Rate'], 1)}%</div>
              </div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-item">
              <div class="funnel-icon">💳</div>
              <div class="funnel-details">
                <div class="funnel-label">Checkout</div>
                <div class="funnel-value">${formatNumber(bucketData['Checkout Rate'], 1)}%</div>
              </div>
            </div>
            <div class="funnel-arrow">→</div>
            <div class="funnel-item">
              <div class="funnel-icon">✓</div>
              <div class="funnel-details">
                <div class="funnel-label">Purchase</div>
                <div class="funnel-value">${formatNumber(bucketData['Purchase Rate'], 1)}%</div>
              </div>
            </div>
          </div>
          
          <div class="classifications-grid">
            <div class="classification-item">
              <div class="classification-label">Profitability</div>
              <div class="classification-value">${profitability.value}</div>
              ${profitability.explanation ? `<div class="classification-explanation">${profitability.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Investment</div>
              <div class="classification-value">${investment.value}</div>
              ${investment.explanation ? `<div class="classification-explanation">${investment.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Funnel Stage</div>
              <div class="classification-value">${funnelStage.value}</div>
              ${funnelStage.explanation ? `<div class="classification-explanation">${funnelStage.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Custom Tier</div>
              <div class="classification-value">${customTier.value}</div>
              ${customTier.explanation ? `<div class="classification-explanation">${customTier.explanation}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
      
      ${suggestions.length > 0 ? `
      <!-- AI Recommendations -->
      <div class="metric-section recommendations-section">
        <div class="section-title">AI Recommendations (${suggestions.length})</div>
        <div class="recommendations-list">
          ${suggestions.map(suggestion => `
            <div class="recommendation-item priority-${suggestion.priority?.toLowerCase()}">
              <div class="recommendation-header">
                <div class="recommendation-priority">${suggestion.priority || 'Medium'}</div>
                <div class="recommendation-action">${suggestion.suggestion}</div>
              </div>
              ${suggestion.context ? `<div class="recommendation-context">${suggestion.context}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
  
  // Create campaigns content placeholder
  const campaignsContent = `
    <div class="popup-tab-content" data-content="campaigns">
      <div class="campaigns-loading">Loading campaign data...</div>
    </div>
  `;
  
  // Create ranking content placeholder
  const rankingContent = `
    <div class="popup-tab-content" data-content="ranking">
      <div class="ranking-loading">Loading ranking map...</div>
    </div>
  `;
  
  // Assemble popup
  popup.innerHTML = headerHTML + tabsHTML + '<div class="popup-content">' + 
    performanceContent + campaignsContent + rankingContent + '</div>';
  
  // Add tab switching functionality
  setTimeout(() => {
    const tabs = popup.querySelectorAll('.popup-tab');
    const contents = popup.querySelectorAll('.popup-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Update active states
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        const targetContent = popup.querySelector(`[data-content="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
          
          // Load content for campaigns and ranking tabs
          if (targetTab === 'campaigns' && !targetContent.hasAttribute('data-loaded')) {
            loadCampaignsTabContent(popup, bucketData);
            targetContent.setAttribute('data-loaded', 'true');
          } else if (targetTab === 'ranking' && !targetContent.hasAttribute('data-loaded')) {
            loadRankingTabContent(popup, bucketData);
            targetContent.setAttribute('data-loaded', 'true');
          }
        }
      });
    });
  }, 0);

    // Add hover handlers to the popup itself to keep it open
  popup.addEventListener('mouseenter', function() {
    // Keep popup visible
    this.classList.add('visible');
  });

  popup.addEventListener('mouseleave', function() {
    // Hide popup when mouse leaves
    const self = this;
    setTimeout(() => {
      if (!self.matches(':hover')) {
        self.classList.remove('visible');
        setTimeout(() => {
          // Clean up any charts before removing popup
          if (self.campaignCharts) {
            self.campaignCharts.forEach(chart => {
              try { chart.destroy(); } catch(e) {}
            });
            self.campaignCharts = [];
          }
          self.remove();
// Remove global reference if it exists
          if (window.currentMetricsPopup === self) {
            window.currentMetricsPopup = null;
          }
        }, 200);
      }
    }, 100);
  });
  
  return popup;
}

// Helper function to load product metrics data from IndexedDB
async function loadProductMetricsData(productTitle) {
  try {
    // Get current account prefix
    const accountPrefix = window.currentAccount || 'acc1';
    const tableName = `${accountPrefix}_googleSheets_productPerformance`;
    
    // Try to access through the parent database first
    const myAppDb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Check if projectData exists in myAppDB
    if (myAppDb.objectStoreNames.contains('projectData')) {
      try {
        const transaction = myAppDb.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        
        // Try to get the specific key
        const getRequest = objectStore.get(tableName);
        
        const data = await new Promise((resolve, reject) => {
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        if (data) {
          // Process the data
          let actualData;
          if (data.data && Array.isArray(data.data)) {
            actualData = data.data;
          } else if (Array.isArray(data)) {
            actualData = data;
          } else {
            myAppDb.close();
            return null;
          }
          
          // Filter for the product
          const productData = actualData.filter(row => 
            row['Product Title'] === productTitle
          );
          
          if (productData.length > 0) {
            const campaignNames = [...new Set(productData.map(row => row['Campaign Name']))].filter(Boolean);
            const channelTypes = [...new Set(productData.map(row => row['Channel Type']))].filter(Boolean);
            
            myAppDb.close();
            
            return {
              productData,
              campaignNames,
              channelTypes
            };
          }
        }
      } catch (e) {
        console.log('[loadProductMetricsData] Error accessing projectData:', e);
      }
    }
    
    myAppDb.close();
    return null;
    
  } catch (error) {
    console.error('[loadProductMetricsData] Error:', error);
    return null;
  }
}

// Function to load campaigns tab content
async function loadCampaignsTabContent(popup, bucketData) {
  const container = popup.querySelector('[data-content="campaigns"]');
  if (!container) return;
  
  try {
    // Get product title for data loading
    const productTitle = bucketData['Product Title'];
    
    // Load data using the helper function
    const result = await loadProductMetricsData(productTitle);
    
    if (!result || !result.productData || result.productData.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No campaign data available</div>';
      return;
    }
    
    const productData = result.productData;
    
// Get date range - use the same approach as google_ads.js
    const daysToShow = 30; // Default to 30 days for now
    const endDate = moment().startOf('day');
    const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
    
    console.log('[Tab] Using date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
    
    // Filter by date range
    const filteredData = productData.filter(row => {
      if (!row.Date) return false;
      const rowDate = moment(row.Date, 'YYYY-MM-DD');
      return rowDate.isBetween(startDate, endDate, 'day', '[]');
    });

        // Debug logging
    console.log('[Campaigns Tab] Product:', productTitle);
    console.log('[Campaigns Tab] Total product data:', productData.length);
    console.log('[Campaigns Tab] Filtered data:', filteredData.length);
    console.log('[Campaigns Tab] Date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
    
    if (filteredData.length === 0) {
      // Check if data exists outside the date range
      const allDates = productData.map(row => row.Date).filter(d => d);
      if (allDates.length > 0) {
        const minDate = moment.min(allDates.map(d => moment(d)));
        const maxDate = moment.max(allDates.map(d => moment(d)));
        console.log('[Campaigns Tab] Data date range in DB:', minDate.format('YYYY-MM-DD'), 'to', maxDate.format('YYYY-MM-DD'));
      }
    }
    
    // Aggregate by campaign
    const campaignData = {};
    filteredData.forEach(row => {
      const campaign = row['Campaign Name'] || 'Unknown';
      if (!campaignData[campaign]) {
        campaignData[campaign] = {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0
        };
      }
      
      campaignData[campaign].impressions += parseFloat(row.Impressions) || 0;
      campaignData[campaign].clicks += parseFloat(row.Clicks) || 0;
      campaignData[campaign].cost += parseFloat(row.Cost) || 0;
      campaignData[campaign].conversions += parseFloat(row.Conversions) || 0;
      campaignData[campaign].conversionValue += parseFloat(row['Conversion value']) || 0;
    });

        // Add debug logging here
    console.log('[Campaigns Tab] Campaign data:', campaignData);
    console.log('[Campaigns Tab] Number of campaigns:', Object.keys(campaignData).length);
    
    // Log the first few rows to see data structure
    if (filteredData.length > 0) {
      console.log('[Campaigns Tab] Sample data row:', filteredData[0]);
    }
    
    // Calculate totals
    const totals = {
      cost: 0,
      conversionValue: 0,
      roas: 0
    };
    
    Object.values(campaignData).forEach(data => {
      totals.cost += data.cost;
      totals.conversionValue += data.conversionValue;
    });
    
    totals.roas = totals.cost > 0 ? totals.conversionValue / totals.cost : 0;
    
    // Create HTML content
    let html = `
      <div class="campaigns-content">
        <!-- Pie Charts Section -->
        <div class="campaigns-charts-section">
          <div class="campaigns-charts-grid">
            <div class="campaign-chart-item">
              <div id="popup-cost-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">Cost</div>
              <div class="campaign-chart-value">$${totals.cost.toFixed(2)}</div>
            </div>
            <div class="campaign-chart-item">
              <div id="popup-revenue-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">Conv. Value</div>
              <div class="campaign-chart-value">$${totals.conversionValue.toFixed(2)}</div>
            </div>
            <div class="campaign-chart-item">
              <div id="popup-roas-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">ROAS</div>
              <div class="campaign-chart-value">${totals.roas.toFixed(2)}x</div>
            </div>
          </div>
        </div>
        
        <!-- Table Section -->
        <div class="campaigns-table-section">
          <table class="campaigns-metrics-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Cost</th>
                <th>Conv. Value</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // Sort campaigns by cost (descending)
    const sortedCampaigns = Object.entries(campaignData)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 10); // Top 10 campaigns
    
    sortedCampaigns.forEach(([campaign, data]) => {
      const roas = data.cost > 0 ? data.conversionValue / data.cost : 0;
      html += `
        <tr>
          <td class="campaign-name">${campaign}</td>
          <td>$${data.cost.toFixed(2)}</td>
          <td>$${data.conversionValue.toFixed(2)}</td>
          <td class="${roas >= 2.5 ? 'roas-good' : roas >= 1.5 ? 'roas-medium' : 'roas-poor'}">${roas.toFixed(2)}x</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;

    // Debug - verify HTML was set
    console.log('[Tab] Container HTML length:', container.innerHTML.length);
    console.log('[Tab] Container visible:', container.style.display !== 'none');
    
// Render pie charts
    setTimeout(() => {
      renderCampaignPieCharts(campaignData, popup);
    }, 100);
    
  } catch (error) {
    console.error('Error loading campaigns data:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Error loading campaign data</div>';
  }
}

// Function to render campaign pie charts
function renderCampaignPieCharts(campaignData, popupElement) {
  const metrics = [
    { id: 'popup-cost-chart', key: 'cost' },
    { id: 'popup-revenue-chart', key: 'conversionValue' },
    { id: 'popup-roas-chart', key: 'roas' }
  ];
  
  // Define colors for campaigns
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'];
  
  metrics.forEach(metric => {
    const container = document.getElementById(metric.id);
    if (!container) return;
    
    const series = [];
    const labels = [];
    
    // Sort campaigns and get top 5
    const sortedCampaigns = Object.entries(campaignData)
      .sort((a, b) => b[1][metric.key === 'roas' ? 'cost' : metric.key] - a[1][metric.key === 'roas' ? 'cost' : metric.key])
      .slice(0, 5);
    
    sortedCampaigns.forEach(([campaign, data]) => {
      if (metric.key === 'roas') {
        const roas = data.cost > 0 ? data.conversionValue / data.cost : 0;
        series.push(roas);
      } else {
        series.push(data[metric.key]);
      }
      labels.push(campaign.length > 20 ? campaign.substring(0, 20) + '...' : campaign);
    });
    
    // Create pie chart using ApexCharts
    const options = {
      series: series,
      chart: {
        type: 'pie',
        height: 120,
        width: 120
      },
      labels: labels,
      colors: colors,
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val > 5 ? Math.round(val) + '%' : '';
        }
      },
      tooltip: {
        y: {
          formatter: function(value) {
            if (metric.key === 'roas') {
              return value.toFixed(2) + 'x';
            }
            return '$' + value.toFixed(2);
          }
        }
      }
    };
    
    const chart = new ApexCharts(container, options);
    chart.render();
    
    // Store reference for cleanup
    if (!popupElement.campaignCharts) {
      popupElement.campaignCharts = [];
    }
    popupElement.campaignCharts.push(chart);
  });
}

// Function to load ranking tab content  
async function loadRankingTabContent(popup, bucketData) {
  const container = popup.querySelector('[data-content="ranking"]');
  if (!container) return;
  
  try {
    // Get product title
    const productTitle = bucketData['Product Title'];
    
    // Load data using the helper function
    const result = await loadProductMetricsData(productTitle);
    
    if (!result || !result.productData || result.productData.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No ranking data available</div>';
      return;
    }
    
    const productData = result.productData;
    
// Get date range - use the same approach as google_ads.js
    const daysToShow = 30; // Default to 30 days for now
    const endDate = moment().startOf('day');
    const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
    
    console.log('[Tab] Using date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
    
    // Filter by date range
    const filteredData = productData.filter(row => {
      if (!row.Date || !row['Search Impression Share Rank']) return false;
      const rowDate = moment(row.Date, 'YYYY-MM-DD');
      return rowDate.isBetween(startDate, endDate, 'day', '[]');
    });

        // Debug logging
    console.log('[Ranking Tab] Product:', productTitle);
    console.log('[Ranking Tab] Total product data:', productData.length);
    console.log('[Ranking Tab] Filtered data:', filteredData.length);
    
    // Log sample data to see structure
    if (filteredData.length > 0) {
      console.log('[Ranking Tab] Sample data row:', filteredData[0]);
      console.log('[Ranking Tab] Sample rank value:', filteredData[0]['Search Impression Share Rank']);
    }
    
    // Define segments
    const segments = {
      'Top 3': { range: [1, 3], data: null },
      'Top 4-8': { range: [4, 8], data: null },
      'Top 9-14': { range: [9, 14], data: null },
      'Below 14': { range: [15, 40], data: null }
    };
    
    // Initialize segment data
    Object.keys(segments).forEach(segmentName => {
      segments[segmentName].data = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        count: 0
      };
    });
    
    // Aggregate data by position and then into segments
    filteredData.forEach(row => {
      const position = parseInt(row['Search Impression Share Rank']) || 0;
      if (position < 1 || position > 40) return;
      
      // Find which segment this position belongs to
      let targetSegment = null;
      Object.entries(segments).forEach(([segmentName, segment]) => {
        if (position >= segment.range[0] && position <= segment.range[1]) {
          targetSegment = segment;
        }
      });
      
      if (targetSegment) {
        targetSegment.data.impressions += parseFloat(row.Impressions) || 0;
        targetSegment.data.clicks += parseFloat(row.Clicks) || 0;
        targetSegment.data.cost += parseFloat(row.Cost) || 0;
        targetSegment.data.conversions += parseFloat(row.Conversions) || 0;
        targetSegment.data.conversionValue += parseFloat(row['Conversion value']) || 0;
        targetSegment.data.count++;
      }
    });
    
    // Create HTML content
    let html = `
      <div class="ranking-content">
        <table class="ranking-map-table">
          <thead>
            <tr>
              <th>Segment</th>
              <th>Impressions</th>
              <th>Clicks</th>
              <th>Avg CPC</th>
              <th>Cost</th>
              <th>Conversions</th>
              <th>Conv. Value</th>
              <th>CTR</th>
              <th>CVR</th>
              <th>ROAS</th>
              <th>AOV</th>
              <th>CPA</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Create rows for each segment
    Object.entries(segments).forEach(([segmentName, segment]) => {
      const data = segment.data;
      const hasData = data.count > 0;
      
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      const cvr = data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0;
      const roas = data.cost > 0 ? data.conversionValue / data.cost : 0;
      const aov = data.conversions > 0 ? data.conversionValue / data.conversions : 0;
      const cpa = data.conversions > 0 ? data.cost / data.conversions : 0;
      const avgCpc = data.clicks > 0 ? data.cost / data.clicks : 0;
      
      const segmentClass = segmentName === 'Top 3' ? 'segment-top-3' : 
                          segmentName === 'Top 4-8' ? 'segment-top-4-8' :
                          segmentName === 'Top 9-14' ? 'segment-top-9-14' : 'segment-below-14';
      
      html += `
        <tr class="${segmentClass}">
          <td class="segment-name">${segmentName}</td>
          <td>${hasData ? Math.round(data.impressions).toLocaleString() : '-'}</td>
          <td>${hasData ? Math.round(data.clicks).toLocaleString() : '-'}</td>
          <td>${hasData ? '$' + avgCpc.toFixed(2) : '-'}</td>
          <td>${hasData ? '$' + data.cost.toFixed(2) : '-'}</td>
          <td>${hasData ? data.conversions.toFixed(1) : '-'}</td>
          <td>${hasData ? '$' + data.conversionValue.toFixed(2) : '-'}</td>
          <td>${hasData ? ctr.toFixed(2) + '%' : '-'}</td>
          <td>${hasData ? cvr.toFixed(2) + '%' : '-'}</td>
          <td class="${roas >= 2.5 ? 'roas-good' : roas >= 1.5 ? 'roas-medium' : 'roas-poor'}">${hasData ? roas.toFixed(2) + 'x' : '-'}</td>
          <td>${hasData ? '$' + aov.toFixed(2) : '-'}</td>
          <td>${hasData ? '$' + cpa.toFixed(2) : '-'}</td>
        </tr>
      `;
    });
    
    html += `
          </tbody>
        </table>
      </div>
    `;
    
    container.innerHTML = html;

    // Debug - verify HTML was set
    console.log('[Tab] Container HTML length:', container.innerHTML.length);
    console.log('[Tab] Container visible:', container.style.display !== 'none');
    
  } catch (error) {
    console.error('Error loading ranking data:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Error loading ranking data</div>';
  }
}

async function renderProductMapTable() {
   const useLatestRecordAsEndDate = false;
      let hoverTimeout = null;
    let currentPopup = null;
    console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
    console.log("[renderProductMapTable] Starting to build product map table");
    const container = document.getElementById("productMapPage");
    if (!container) return;
    
    // Simple check for Google Ads integration
    let googleAdsEnabled = false;
    let accountNumber = null;
    
    // Check for acc1, acc2, etc. (you can adjust the range as needed)
    for (let i = 1; i <= 10; i++) {
      const configExists = await checkTableExists(`acc${i}_googleSheets_config`);
      if (configExists) {
        googleAdsEnabled = true;
        accountNumber = i;
        break;
      }
    }
    
    console.log('[ProductMap] Google Ads enabled:', googleAdsEnabled, 'Account:', accountNumber);
    
// Load bucket data if enabled
let bucketDataMap = new Map();
if (googleAdsEnabled) {
  const bucketTableExists = await checkTableExists(`acc${accountNumber}_googleSheets_productBuckets_30d`);
  
  if (bucketTableExists) {
    // Get the bucket data from projectData store
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    // Get data from projectData store
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(`acc${accountNumber}_googleSheets_productBuckets_30d`);
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data) {
          console.log(`[ProductMap] Bucket data structure:`, result.data[0]); // Log first item to see structure
          
          result.data.forEach(product => {
            if (product['Product Title'] && product['Campaign Name'] === 'All') {
              // Normalize device value to uppercase for consistency
              const deviceNormalized = (product['Device'] || '').toUpperCase();
              const key = `${product['Product Title'].toLowerCase()}|${deviceNormalized}`;
              bucketDataMap.set(key, product);
              
              // Debug log for first few entries
              if (bucketDataMap.size <= 3) {
                console.log(`[ProductMap] Bucket entry: ${key}`, {
                  profitability: product['PROFITABILITY_BUCKET'],
                  device: product['Device'],
                  campaign: product['Campaign Name']
                });
              }
            }
          });
        }
        console.log(`[ProductMap] Loaded ${bucketDataMap.size} product bucket entries (filtered for Campaign='All')`);
        resolve();
      };
      
      getRequest.onerror = () => {
        console.error('[ProductMap] Error getting bucket data');
        resolve();
      };
    });
    
    db.close();
  }
}
  
    // Setup container with fixed height and scrolling
container.innerHTML = `
  <div id="productMapContainer" style="width: 100%; height: calc(100vh - 150px); overflow-y: auto; position: relative;">
    <div class="view-switcher">
      <button id="viewProducts" class="active">Products</button>
      <button id="viewCharts">Charts</button>
    </div>
    <select id="bucketTypeSelector" style="position: absolute; top: 10px; right: 320px; z-index: 100; padding: 6px 12px; border-radius: 4px; border: 1px solid #ddd;">
      <option value="PROFITABILITY_BUCKET">Profitability</option>
      <option value="FUNNEL_STAGE_BUCKET">Funnel Stage</option>
      <option value="INVESTMENT_BUCKET">Investment</option>
      <option value="CUSTOM_TIER_BUCKET">Custom Tier</option>
      <option value="SELLERS">Sellers</option>
    </select>
    <button id="fullscreenToggle" class="fullscreen-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
      Full Screen
    </button>
  </div>
`;
    
    // Create fullscreen overlay container (hidden initially)
    let fullscreenOverlay = document.getElementById('productMapFullscreenOverlay');
    if (!fullscreenOverlay) {
      fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'productMapFullscreenOverlay';
      fullscreenOverlay.className = 'product-map-fullscreen-overlay';
      document.body.appendChild(fullscreenOverlay);
    }
    
    // Add fullscreen toggle functionality
    document.getElementById("fullscreenToggle").addEventListener("click", function() {
      // Get the current table
      const table = document.querySelector("#productMapContainer .product-map-table");
      if (!table) {
        console.warn("No product map table found to display in fullscreen");
        return;
      }
      
      // Clone the table
      const tableClone = table.cloneNode(true);
      
      // Add close button to the overlay
      fullscreenOverlay.innerHTML = '';
      const closeBtn = document.createElement("button");
      closeBtn.className = "fullscreen-close";
      closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Exit Full Screen
      `;
      fullscreenOverlay.appendChild(closeBtn);
      
      // Add the cloned table to the overlay
      fullscreenOverlay.appendChild(tableClone);
      
      // Show the overlay
      fullscreenOverlay.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling on the main page
      
      // Add close button event listener
      closeBtn.addEventListener("click", function() {
        fullscreenOverlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Reposition any open details panel
        const detailsPanel = document.getElementById('product-map-details-panel');
        if (detailsPanel && detailsPanel.style.display !== 'none') {
          detailsPanel.style.position = 'fixed';
          detailsPanel.style.top = '40%';
          detailsPanel.style.left = 'auto';
          detailsPanel.style.right = '10px';
          detailsPanel.style.transform = 'translateY(-50%)';
        }
      });

      // Clone the view switcher and add it to the overlay
const originalSwitcher = document.querySelector('.view-switcher');
if (originalSwitcher) {
  const switcherClone = originalSwitcher.cloneNode(true);
  fullscreenOverlay.insertBefore(switcherClone, fullscreenOverlay.firstChild);
  
  // Re-attach event listeners to the cloned switcher
  const clonedProductsBtn = switcherClone.querySelector('#viewProducts');
  const clonedChartsBtn = switcherClone.querySelector('#viewCharts');
  
  clonedProductsBtn.addEventListener('click', function() {
    clonedProductsBtn.classList.add('active');
    clonedChartsBtn.classList.remove('active');
    
    fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
      container.style.display = 'block';
    });
    fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
      container.style.display = 'none';
    });
  });
  
clonedChartsBtn.addEventListener('click', function() {
  clonedChartsBtn.classList.add('active');
  clonedProductsBtn.classList.remove('active');
  
  fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'none';
  });
  fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  
  // Render charts for each row in fullscreen
  fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
    const chartAvgPosDiv = container.querySelector('.chart-avg-position');
    const chartProductsDiv = container.querySelector('.chart-products');
    
    // Get all products for this chart
    const smallCards = chartProductsDiv.querySelectorAll('.small-ad-details');
    const products = Array.from(smallCards).map(card => card.productData).filter(p => p);
    
    if (products.length > 0 && chartAvgPosDiv) {
      renderAvgPositionChart(chartAvgPosDiv, products);
      
      // Add click handlers to small cards for chart interaction
      smallCards.forEach((card, index) => {
        // Remove any existing click handler
        const oldHandler = card._chartClickHandler;
        if (oldHandler) {
          card.removeEventListener('click', oldHandler);
        }
        
        // Create new click handler
        const clickHandler = function() {
          // Toggle selection
          if (chartAvgPosDiv.selectedProductIndex === index) {
            // Deselect if clicking the same product
            chartAvgPosDiv.selectedProductIndex = null;
            card.classList.remove('active');
          } else {
            // Select this product
            chartAvgPosDiv.selectedProductIndex = index;
            // Remove active class from all cards
            smallCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
          }
          
          // Update chart visibility
          updateChartLineVisibility(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
        };
        
        // Store reference to handler for cleanup
        card._chartClickHandler = clickHandler;
        card.addEventListener('click', clickHandler);
      });
    }
  });
});
}
      
// Apply fullscreen styles to the cloned table cells
const productCells = fullscreenOverlay.querySelectorAll('.product-cell');
productCells.forEach(cell => {
  // Keep horizontal scrolling, don't wrap
  cell.style.flexWrap = "nowrap";
  cell.style.overflowX = "auto";
  cell.style.minWidth = "100%";
  
  // Adjust card widths to maintain consistent size
  const cards = cell.querySelectorAll('.ad-details');
  cards.forEach(card => {
    card.style.width = "150px";
    card.style.flexShrink = "0";
    card.style.margin = "0 6px 0 0"; // Keep original horizontal spacing
    
    // Reattach click handlers to the cloned cards
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const plaIndex = card.getAttribute('data-pla-index');
      const rowData = window.globalRows[plaIndex];
      if (!rowData) {
        console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
        return;
      }
      
      openProductMapDetailsPanel(card, rowData, true); // true indicates we're in fullscreen mode
    });
  });
});

// REPLACE your current segmentation chart recreation code with this final fix:

// Re-render segmentation charts in the cloned table
setTimeout(() => {
  console.log("[DEBUG-FULLSCREEN] Starting segmentation chart recreation...");
  
  // Get all chart containers in the fullscreen overlay
  const chartContainers = fullscreenOverlay.querySelectorAll('.segmentation-chart-container');
  console.log("[DEBUG-FULLSCREEN] Found chart containers:", chartContainers.length);
  
  // Build a map from the original table to get the correct data associations
  const originalTable = document.querySelector('.product-map-table');
  const originalRows = originalTable.querySelectorAll('tbody tr');
  
  // Create a mapping of chart container index to data
  const chartDataMap = {};
  let chartIndex = 0;
  
  originalRows.forEach(row => {
    const originalChartContainer = row.querySelector('.segmentation-chart-container');
    if (!originalChartContainer) return;
    
    // Extract data from the original table structure
    let term = '';
    let location = '';
    let device = '';
    
    // Find search term - it might be in this row or a previous row due to rowspan
    let currentRow = row;
    while (currentRow && !term) {
      const termElement = currentRow.querySelector('.search-term-tag');
      if (termElement) {
        term = termElement.textContent.trim();
      }
      currentRow = currentRow.previousElementSibling;
    }
    
    // Find location - similar logic for rowspan
    currentRow = row;
    while (currentRow && !location) {
      const locationElement = currentRow.querySelector('.city-line');
      if (locationElement) {
        location = locationElement.textContent.trim();
      }
      currentRow = currentRow.previousElementSibling;
    }
    
    // Device should be in the same row
    const deviceElement = row.querySelector('.device-icon');
    if (deviceElement) {
      device = deviceElement.alt || '';
    }
    
    // Store the mapping
    chartDataMap[chartIndex] = { term, location, device };
    chartIndex++;
  });
  
  // Helper function to match locations flexibly
  function locationMatches(mappedLocation, productLocation) {
    if (!mappedLocation || !productLocation) return false;
    
    // Direct match
    if (mappedLocation === productLocation) return true;
    
    // Check if the mapped location is the first part of the product location
    const productParts = productLocation.split(',');
    const firstPart = productParts[0] ? productParts[0].trim() : '';
    
    return mappedLocation.toLowerCase() === firstPart.toLowerCase();
  }
  
  // Now process the cloned chart containers using the mapped data
  chartContainers.forEach((container, index) => {
    console.log(`[DEBUG-FULLSCREEN] Processing container ${index}:`, container.id);
    
    // Get the mapped data
    const mappedData = chartDataMap[index];
    if (!mappedData) {
      console.log("[DEBUG-FULLSCREEN] No mapped data found for index", index);
      return;
    }
    
    const { term, location, device } = mappedData;
    console.log("[DEBUG-FULLSCREEN] Using mapped data - term:", term, "location:", location, "device:", device);
    
    if (!term || !location || !device) {
      console.log("[DEBUG-FULLSCREEN] Incomplete mapped data");
      return;
    }
    
    // Find matching products - EXACT term matching, no normalization
    const matchingProducts = window.allRows.filter(p => {
      const termMatch = p.q === term; // EXACT match only
      const locMatch = locationMatches(location, p.location_requested);
      const deviceMatch = p.device === device;
      const companyMatch = p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase();
      
      return termMatch && locMatch && deviceMatch && companyMatch;
    });
    
    console.log("[DEBUG-FULLSCREEN] Found matching products:", matchingProducts.length);
    
    if (matchingProducts.length === 0) {
      console.log("[DEBUG-FULLSCREEN] No matching products found");
      return;
    }
    
    // Filter active and inactive products
    const activeProducts = matchingProducts.filter(product => 
      product.product_status === 'active' || !product.product_status
    );
    
    const inactiveProducts = matchingProducts.filter(product => 
      product.product_status === 'inactive'
    );
    
    console.log("[DEBUG-FULLSCREEN] Active products:", activeProducts.length, "Inactive:", inactiveProducts.length);
    
    // Calculate chart data
    const chartData = calculateAggregateSegmentData(matchingProducts);
    console.log("[DEBUG-FULLSCREEN] Chart data generated:", !!chartData, "length:", chartData?.length || 0);
    
    if (!chartData || chartData.length === 0) {
      console.log("[DEBUG-FULLSCREEN] No valid chart data generated");
      return;
    }
    
    // *** FIX THE REAL ISSUE: Render chart directly to the cloned container ***
    // Instead of calling createSegmentationChart which uses document.getElementById
    
    console.log("[DEBUG-FULLSCREEN] Rendering chart directly to cloned container");
    
    // Clear and setup the container
    container.innerHTML = '';
    container.style.height = '380px';
    container.style.maxHeight = '380px';
    container.style.overflowY = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    
    // Create canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.width = '100%';
    canvasWrapper.style.height = '280px';
    canvasWrapper.style.maxHeight = '280px';
    canvasWrapper.style.position = 'relative';
    canvasWrapper.style.marginBottom = '10px';
    container.appendChild(canvasWrapper);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvasWrapper.appendChild(canvas);
    
    // Create count container
    const countContainer = document.createElement('div');
    countContainer.style.width = '250px';
    countContainer.style.height = '80px';
    countContainer.style.maxHeight = '80px';
    countContainer.style.display = 'grid';
    countContainer.style.gridTemplateColumns = '1fr 1fr';
    countContainer.style.gridTemplateRows = 'auto auto';
    countContainer.style.gap = '4px';
    countContainer.style.padding = '8px';
    countContainer.style.backgroundColor = '#f9f9f9';
    countContainer.style.borderRadius = '8px';
    countContainer.style.fontSize = '14px';
    countContainer.style.boxSizing = 'border-box';
    
    countContainer.innerHTML = `
      <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
      <div style="font-weight: 700; color: #4CAF50;">${activeProducts.length}</div>
      <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
      <div style="font-weight: 700; color: #9e9e9e;">${inactiveProducts.length}</div>
    `;
    
    container.appendChild(countContainer);
    
    // Create the chart directly
    try {
      new Chart(canvas, {
        type: "bar",
        data: {
          labels: chartData.map(d => d.label),
          datasets: [
            {
              label: "Current",
              data: chartData.map(d => d.current),
              backgroundColor: "#007aff",
              borderRadius: 4
            },
            {
              label: "Previous",
              type: "line",
              data: chartData.map(d => d.previous),
              borderColor: "rgba(255,0,0,1)",
              backgroundColor: "rgba(255,0,0,0.2)",
              fill: true,
              tension: 0.3,
              borderWidth: 2
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const val = ctx.parsed.x;
                  return `${ctx.dataset.label}: ${val.toFixed(2)}%`;
                }
              }
            },
            datalabels: {
              display: ctx => ctx.datasetIndex === 0,
              formatter: (value, context) => {
                const row = chartData[context.dataIndex];
                const mainLabel = `${row.current.toFixed(1)}%`;
                const diff = row.current - row.previous;
                const absDiff = Math.abs(diff).toFixed(1);
                const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "±";
                return [ mainLabel, `${arrow}${absDiff}%` ];
              },
              color: ctx => {
                const row = chartData[ctx.dataIndex];
                const diff = row.current - row.previous;
                if (diff > 0) return "green";
                if (diff < 0) return "red";
                return "#444";
              },
              anchor: "end",
              align: "end",
              offset: 8,
              font: { size: 10 }
            }
          },
          scales: {
            x: { display: false, min: 0, max: 100 },
            y: { display: true, grid: { display: false }, ticks: { font: { size: 11 } } }
          },
          animation: false
        }
      });
      
      console.log("[DEBUG-FULLSCREEN] Chart rendered successfully to cloned container");
    } catch (error) {
      console.error("[DEBUG-FULLSCREEN] Error rendering chart:", error);
    }
  });
}, 500);
      
      // Initialize visibility badges in the cloned table
      setTimeout(() => {
        fullscreenOverlay.querySelectorAll('.vis-badge').forEach(function(el) {
          const parts = el.id.split('-');
          const index = parts[2];
          const row = window.globalRows[index];
          if (!row) return;
          
          let visValue = parseFloat(row.visibilityBarValue) || 0;
          if (visValue === 0) {
            visValue = 0.1;
          }
      
          var options = {
            series: [visValue],
            chart: {
              height: 80,
              width: 80,
              type: 'radialBar',
              sparkline: { enabled: false },
              offsetY: 0
            },
            plotOptions: {
              radialBar: {
                startAngle: -90,
                endAngle: 90,
                hollow: { size: '50%' },
                track: { strokeDashArray: 8, margin:2 },
                dataLabels: {
                  name: { show: false },
                  value: {
                    show: true,
                    offsetY: 0,
                    fontSize: '14px',
                    formatter: function(val){
                      return Math.round(val) + "%";
                    }
                  }
                }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0,50,100]
              }
            },
            stroke: { lineCap:'butt', dashArray:4 },
            labels: []
          };
          
          // Check if ApexCharts is available
          if (typeof ApexCharts !== 'undefined') {
            var chart = new ApexCharts(el, options);
            chart.render();
          }
        });
      }, 100);
    });

    // Add view switcher functionality
const viewProductsBtn = document.getElementById("viewProducts");
const viewChartsBtn = document.getElementById("viewCharts");

viewProductsBtn.addEventListener("click", function() {
  // Switch to Products view
  viewProductsBtn.classList.add("active");
  viewChartsBtn.classList.remove("active");
  
  // Show all product cells, hide all chart containers
  document.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'block';
  });
  document.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'none';
  });
});

viewChartsBtn.addEventListener("click", function() {
  // Switch to Charts view
  viewChartsBtn.classList.add("active");
  viewProductsBtn.classList.remove("active");
  
  // Hide all product cells, show all chart containers
  document.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'none';
  });
  document.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  
  // Render charts for each row
  document.querySelectorAll('.products-chart-container').forEach(container => {
    const chartAvgPosDiv = container.querySelector('.chart-avg-position');
    const chartProductsDiv = container.querySelector('.chart-products');
    
    // Get all products for this chart
    const smallCards = chartProductsDiv.querySelectorAll('.small-ad-details');
    const products = Array.from(smallCards).map(card => card.productData).filter(p => p);
    
    if (products.length > 0 && chartAvgPosDiv) {
      renderAvgPositionChart(chartAvgPosDiv, products);
      
      // Add click handlers to small cards for chart interaction
      smallCards.forEach((card, index) => {
        // Remove any existing click handler
        const oldHandler = card._chartClickHandler;
        if (oldHandler) {
          card.removeEventListener('click', oldHandler);
        }
        
        // Create new click handler
        const clickHandler = function() {
          // Toggle selection
          if (chartAvgPosDiv.selectedProductIndex === index) {
            // Deselect if clicking the same product
            chartAvgPosDiv.selectedProductIndex = null;
            card.classList.remove('active');
          } else {
            // Select this product
            chartAvgPosDiv.selectedProductIndex = index;
            // Remove active class from all cards
            smallCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
          }
          
          // Update chart visibility
          updateChartLineVisibility(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
        };
        
        // Store reference to handler for cleanup
        card._chartClickHandler = clickHandler;
        card.addEventListener('click', clickHandler);
      });
    }
  });
});

// Add bucket type selector functionality
const bucketSelector = document.getElementById("bucketTypeSelector");
if (bucketSelector) {
  bucketSelector.addEventListener("change", function() {
    const selectedBucketType = this.value;
    console.log(`[ProductMap] Switching to bucket type: ${selectedBucketType}`);
    
    // Update all bucket badges
    document.querySelectorAll('.bucket-badge').forEach(badge => {
      const adCard = badge.parentElement;
      const plaIndex = adCard.getAttribute('data-pla-index');
      const product = window.globalRows[plaIndex];
      
      if (product && googleAdsEnabled && bucketDataMap.size > 0) {
        // Get device from the row, not from the product
        const row = adCard.closest('tr');
        const deviceCell = row.querySelector('.device-icon');
        const deviceValue = deviceCell ? (deviceCell.alt || '').toUpperCase() : 'DESKTOP';
        
        const plaIndex = adCard.getAttribute('data-pla-index');
const productData = window.globalRows[plaIndex];
if (!productData) return;
const lookupKey = `${productData.title.toLowerCase()}|${deviceValue}`;
        
        const productBucketData = bucketDataMap.get(lookupKey);
        
        if (productBucketData) {
          const newBadgeHTML = getBucketBadgeHTML(productBucketData, selectedBucketType);
          if (newBadgeHTML) {
            badge.outerHTML = newBadgeHTML;
          } else {
            badge.remove();
          }
        }
      }
    });
  });
}
  
    console.log("[renderProductMapTable] Using myCompany:", window.myCompany);

    if (!window.globalRows || typeof window.globalRows !== 'object') {
      window.globalRows = {};
      console.log("[DEBUG] Created new globalRows object");
    }
  
    if (!document.getElementById("product-map-table-style")) {
      const style = document.createElement("style");
      style.id = "product-map-table-style";
      style.textContent = `
        .product-map-table {
          width: calc(100% - 40px);
          margin-left: 20px;
          border-collapse: collapse;
          background-color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 12px;
          overflow: hidden;
          table-layout: fixed;
        }
        .product-map-table th {
          height: 50px;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
          border-bottom: 2px solid #ddd;
          background: linear-gradient(to bottom, #ffffff, #f9f9f9);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .product-map-table td {
          padding: 8px;
          font-size: 14px;
          color: #333;
          vertical-align: middle;
          border-bottom: 1px solid #eee;
          height: 380px; /* Fixed height */
          max-height: 380px;
          box-sizing: border-box;
          overflow: hidden;
        }
        /* Fixed column widths - MODIFIED */
        .product-map-table th:nth-child(1), .product-map-table td:nth-child(1) { width: 190px; }
        .product-map-table th:nth-child(2), .product-map-table td:nth-child(2) { width: 120px; }
        .product-map-table th:nth-child(3), .product-map-table td:nth-child(3) { width: 100px; }
        .product-map-table th:nth-child(4), .product-map-table td:nth-child(4) { width: 240px; }
        .product-map-table th:nth-child(5), .product-map-table td:nth-child(5) { 
          width: auto; 
          min-width: 400px; /* Ensure Products column has a reasonable minimum width */
        }
        
/* Search term tag styling - NEW */
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
        
        /* Different pastel backgrounds for locations */
        .location-bg-1 { background-color: #f0f8ff; } /* AliceBlue */
        .location-bg-2 { background-color: #f0fff0; } /* HoneyDew */
        .location-bg-3 { background-color: #fff0f5; } /* LavenderBlush */
        .location-bg-4 { background-color: #f5fffa; } /* MintCream */
        .location-bg-5 { background-color: #f8f8ff; } /* GhostWhite */
        .location-bg-6 { background-color: #f0ffff; } /* Azure */
        .location-bg-7 { background-color: #fffaf0; } /* FloralWhite */
        .location-bg-8 { background-color: #f5f5dc; } /* Beige */
        .location-bg-9 { background-color: #faf0e6; } /* Linen */
        .location-bg-10 { background-color: #fff5ee; } /* SeaShell */
        
        /* Device types */
        .device-desktop { background-color: #f5f5f5; }
        .device-mobile { background-color: #ffffff; }
        
        /* Location cell styling */
        .city-line { 
          font-weight: 600;
          font-size: 16px;
        }
        .state-line { 
          font-size: 13px; 
          color: #555;
          margin-top: 2px;
        }
        .country-line { 
          font-size: 12px; 
          color: #666;
          margin-top: 2px;
        }
        
        /* Device cell with three sections */
        .device-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        
        .device-type, .device-rank, .device-share {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex: 1;
          text-align: center;
          padding: 8px 0;
        }
        
        .device-type {
          font-weight: 500;
        }
        
        .section-header {
          font-size: 11px;
          color: #666;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .device-rank-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .device-trend {
          font-size: 12px;
          font-weight: 500;
          margin-top: 2px;
        }
        
        /* Market share pie chart container - NEW */
        .pie-chart-container {
          width: 75px;
          height: 75px;
          margin: 0 auto;
          position: relative;
        }
        
        .trend-up {
          color: green;
        }
        
        .trend-down {
          color: red;
        }
        
        .trend-neutral {
          color: #444;
        }
        
        /* Product cell with horizontal scrolling */
        .product-cell {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          overflow-x: auto;
          width: 100%;
          min-width: 100%;
          min-height: 280px;
          scrollbar-width: thin;
        }
        
/* Segment count circles */
.segment-count-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 2px auto;
}

.segment-count-top3 {
  background-color: #90EE90; /* Light green */
}

.segment-count-top4-8 {
  background-color: #FFFFE0; /* Light yellow */
}

.segment-count-top9-14 {
  background-color: #FFE4B5; /* Light orange */
}

.segment-count-below14 {
  background-color: #FFB6C1; /* Light red */
}
        
        .no-data-message {
          color: #999;
          font-style: italic;
          text-align: center;
        }
        
        /* Styling for ad cards to match main page */
        .product-cell .ad-details {
          flex: 0 0 auto;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          background-color: white;
          transition: transform 0.2s, box-shadow 0.2s;
          overflow: hidden;
        }
        
        .product-cell .ad-details:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .product-cell .ad-thumbnail-container {
          position: relative;
          width: 100%;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .product-cell .ad-thumbnail {
          max-width: 100%;
          height: auto;
          max-height: 170px;
          object-fit: contain;
          border-radius: 4px;
        }
        
        .product-cell .ad-info {
          padding: 0 4px;
        }
        
        .product-cell .ad-title {
          font-size: 13px;
          line-height: 1.3;
          font-weight: 500;
          margin-bottom: 4px;
          max-height: 2.6em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .product-cell .ad-price {
          font-weight: 600;
          color: #111;
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .product-cell .ad-merchant {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .product-cell .ad-rating {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #666;
        }
        
        .product-cell .star-container {
          display: inline-flex;
          margin: 0 4px;
        }
        
        .product-cell .review-count {
          color: #777;
          font-size: 11px;
        }
        
        .product-cell .ad-extensions {
          margin-top: 4px;
          font-size: 11px;
          color: #666;
        }
        
        .product-cell .ad-extension {
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .product-cell .trend-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 2px;
          font-size: 11px;
          margin-top: 6px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .product-cell .trend-header {
          text-align: center;
          font-weight: 500;
          color: #555;
        }
        
        .product-cell .trend-data {
          text-align: center;
        }
        
        .product-cell .trend-up {
          color: green;
        }
        
        .product-cell .trend-down {
          color: red;
        }
        
        .product-cell .sale-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          background-color: #e53935;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        
        .product-cell .pos-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #4CAF50;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        
        .product-cell .vis-badge {
          position: absolute;
          bottom: 5px;
          right: 5px;
          width: 60px;
          height: 60px;
        }
        
        .no-products {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: #999;
          font-style: italic;
        }

        .device-icon {
          max-height: 40px;
          max-width: 40px;
          object-fit: contain;
        }
.inactive-product {
  filter: grayscale(100%);
  opacity: 0.8;
}

.product-status-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #555;
  color: white;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  font-weight: bold;
  z-index: 10;
}

.product-status-active {
  background-color: #4CAF50;
}

.product-status-inactive {
  background-color: #9e9e9e;
}
.last-tracked-container {
  padding: 6px 0;
  text-align: center;
  border-top: 1px solid #eee;
  margin-top: 4px;
}

.last-tracked-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
  text-transform: uppercase;
}

.last-tracked-value {
  font-size: 14px;
  font-weight: 500;
}

.recent-tracking {
  color: #4CAF50;
}

.moderate-tracking {
  color: #FFA000;
}

.old-tracking {
  color: #F44336;
}
/* Full-screen mode styles */
.product-map-fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 9999;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
  display: none;
}

.product-map-fullscreen-overlay .product-map-table {
  width: 100%;
  margin-left: 0;
}

.product-map-fullscreen-overlay .product-map-table th:nth-child(5), 
.product-map-fullscreen-overlay .product-map-table td:nth-child(5) {
  width: auto;
  min-width: 600px;
}

.product-map-fullscreen-overlay .product-cell {
  width: 100%;
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: 100%;
}

.fullscreen-toggle {
  position: absolute;
  top: 10px;
  right: 20px;
  padding: 8px 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 100;
}

.fullscreen-toggle:hover {
  background-color: #0056b3;
}

.fullscreen-close {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fullscreen-close:hover {
  background-color: #d9342c;
}

.product-map-fullscreen-overlay .product-cell .ad-details {
  margin-bottom: 10px;
  margin-right: 10px;
}
/* View switcher styles */
.view-switcher {
  position: absolute;
  top: 10px;
  right: 140px; /* Positioned before the fullscreen button */
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  z-index: 100;
}

.view-switcher button {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 17px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.view-switcher button.active {
  background-color: #007aff;
  color: white;
}

.view-switcher button:hover:not(.active) {
  background-color: rgba(0, 122, 255, 0.1);
}

/* Products chart container styles */
.products-chart-container {
  display: none;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  flex-direction: row;
  gap: 10px;
}

.chart-products {
  width: 280px;
  height: 100%;
  max-height: 575px;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 5px;
  scrollbar-width: auto;
  scrollbar-color: #ccc #f9f9f9;
}

.chart-products::-webkit-scrollbar {
  width: 8px;  /* Increased from 6px */
}

.chart-products::-webkit-scrollbar-track {
  background: #e0e0e0;  /* Made darker than #f9f9f9 */
  border-radius: 4px;
}

.chart-products::-webkit-scrollbar-thumb {
  background: #888;  /* Made darker than #ccc */
  border-radius: 4px;
}

.chart-products::-webkit-scrollbar-thumb:hover {
  background: #666;  /* Made darker than #999 */
}

.chart-avg-position {
  flex: 1;
  min-width: 300px; /* Add minimum width */
  height: 100%;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
}

/* Small ad details for chart view */
.small-ad-details {
  width: 270px;
  height: 60px;
  margin-bottom: 5px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s;
}
/* Position badge for small cards */
.small-ad-pos-badge {
  width: 50px;
  min-width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-right: 8px;
  font-weight: bold;
}

.small-ad-pos-value {
  font-size: 18px;
  line-height: 1;
  color: white;
}

.small-ad-pos-trend {
  font-size: 11px;
  line-height: 1;
  margin-top: 2px;
  color: white;
}

.small-ad-details:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.small-ad-details.active {
  border: 2px solid #007aff;
  box-shadow: 0 2px 6px rgba(0,122,255,0.3);
}

.small-ad-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.small-ad-title {
  flex: 1;
  font-size: 12px;
  line-height: 1.3;
  color: #333;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.segmentation-chart-container.loading {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.segmentation-chart-container.loading::after {
  content: 'Loading chart...';
  font-size: 12px;
}
/* Add these styles to the existing style tag in renderProductMapTable function */

.bucket-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 22px;
  background-color: #007aff; /* Default color, will be overridden by bucket type */
  color: white;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  z-index: 10; /* Increased to be above image */
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* PROFITABILITY_BUCKET colors */
.bucket-badge.insufficient-data { background-color: #9E9E9E; }
.bucket-badge.profit-stars { background-color: #4CAF50; }
.bucket-badge.strong-performers { background-color: #8BC34A; }
.bucket-badge.steady-contributors { background-color: #2196F3; }
.bucket-badge.break-even-products { background-color: #FF9800; }
.bucket-badge.true-losses { background-color: #F44336; }

/* FUNNEL_STAGE_BUCKET colors */
.bucket-badge.full-funnel-excellence { background-color: #00BCD4; }
.bucket-badge.high-value-funnel-issues { background-color: #FFC107; }
.bucket-badge.critical-funnel-issues { background-color: #FF5722; }
.bucket-badge.ad-engagement-issue { background-color: #E91E63; }
.bucket-badge.product-page-dropoff { background-color: #9C27B0; }
.bucket-badge.cart-abandonment-problem { background-color: #673AB7; }
.bucket-badge.checkout-friction { background-color: #3F51B5; }
.bucket-badge.price-discovery-shock { background-color: #795548; }
.bucket-badge.cross-stage-issues { background-color: #607D8B; }
.bucket-badge.optimization-opportunities { background-color: #009688; }
.bucket-badge.normal-performance { background-color: #03A9F4; }

/* INVESTMENT_BUCKET colors */
.bucket-badge.pause-priority { background-color: #D32F2F; }
.bucket-badge.reduce-priority { background-color: #F57C00; }
.bucket-badge.maintain-priority { background-color: #FBC02D; }
.bucket-badge.growth-priority { background-color: #689F38; }
.bucket-badge.high-priority { background-color: #388E3C; }
.bucket-badge.maximum-priority { background-color: #1976D2; }

/* CUSTOM_TIER_BUCKET colors */
.bucket-badge.new-low-volume { background-color: #78909C; }
.bucket-badge.pause-candidates { background-color: #B71C1C; }
.bucket-badge.turnaround-required { background-color: #E65100; }
.bucket-badge.hero-products { background-color: #1B5E20; }
.bucket-badge.rising-stars { background-color: #00695C; }
.bucket-badge.steady-performers { background-color: #0277BD; }
.bucket-badge.mobile-champions { background-color: #4527A0; }
.bucket-badge.desktop-dependent { background-color: #6A1B9A; }
.bucket-badge.test-learn { background-color: #00838F; }
.bucket-badge.monitor-closely { background-color: #37474F; }

/* SELLERS colors */
.bucket-badge.revenue-stars { background-color: #FFD700; color: #333; }
.bucket-badge.best-sellers { background-color: #C0C0C0; color: #333; }
.bucket-badge.volume-leaders { background-color: #CD7F32; color: white; }
.bucket-badge.standard { background-color: #757575; }

/* Adjust existing badges positioning when bucket-badge is present */
.product-cell .ad-details.has-bucket .pos-badge {
  top: 27px; /* 22px bucket height + 5px gap */
}

.product-cell .ad-details.has-bucket .sale-badge {
  top: 27px; /* 22px bucket height + 5px gap */
}

.product-cell .ad-details.has-bucket .product-status-indicator {
  top: 27px; /* 22px bucket height + 5px gap */
}

/* Remove the margin-top for thumbnail container so bucket overlays the image */
.product-cell .ad-details.has-bucket .ad-thumbnail-container {
  margin-top: 0; /* No space needed - bucket will overlay */
}

/* Ensure the ad-details container has relative positioning for absolute children */
.product-cell .ad-details {
  position: relative; /* Add this if not already present */
}
      `;
      document.head.appendChild(style);
    }

// Add popup styles
const popupStyle = document.createElement("style");
popupStyle.id = "product-metrics-popup-style";
popupStyle.textContent = `
/* Replace the existing .product-metrics-popup styles with these: */
.product-metrics-popup {
  position: absolute;
  z-index: 10000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 0;
  width: 580px;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.product-metrics-popup::-webkit-scrollbar {
  width: 8px;
}

.product-metrics-popup::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.product-metrics-popup::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.product-metrics-popup.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.popup-header {
  background: linear-gradient(135deg, #0066cc, #004499);
  color: white;
  padding: 12px 16px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.3;
  flex: 1;
  margin-right: 10px;
}

.sellers-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.sellers-revenue-stars { background: #FFD700; color: #333; }
.sellers-best-sellers { background: #C0C0C0; color: #333; }
.sellers-volume-leaders { background: #CD7F32; color: white; }

.popup-content {
  padding: 16px;
}

/* ROAS Hero Section */
.roas-hero-section {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  border: 1px solid #dee2e6;
}

.roas-metrics {
  flex: 1;
  display: flex;
  gap: 24px;
}

.roas-main {
  text-align: center;
}

.roas-label {
  font-size: 12px;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.roas-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.roas-good { color: #28a745; }
.roas-medium { color: #ffc107; }
.roas-poor { color: #dc3545; }

.roas-supporting {
  display: flex;
  gap: 20px;
  align-items: center;
}

.supporting-metric {
  text-align: center;
}

.supporting-label {
  font-size: 10px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.supporting-value {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 2px;
}

.health-confidence-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-width: 120px;
}

.health-item, .confidence-item {
  text-align: center;
}

.health-label, .confidence-label {
  font-size: 10px;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.health-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.confidence-value {
  font-size: 14px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.confidence-high { background: #d4edda; color: #155724; }
.confidence-medium { background: #fff3cd; color: #856404; }
.confidence-low { background: #f8d7da; color: #721c24; }

/* Funnel & Classifications */
.funnel-classifications-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.funnel-rates {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.funnel-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.funnel-icon {
  font-size: 24px;
}

.funnel-details {
  text-align: left;
}

.funnel-label {
  font-size: 10px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.funnel-value {
  font-size: 16px;
  font-weight: 700;
  color: #212529;
}

.funnel-arrow {
  font-size: 20px;
  color: #6c757d;
}

.classifications-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.classification-item {
  padding: 10px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #0066cc;
  border-right: 1px solid #e9ecef;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.classification-label {
  font-size: 9px;
  font-weight: 700;
  color: #6c757d;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.classification-value {
  font-size: 13px;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
  margin-bottom: 2px;
}

.classification-explanation {
  font-size: 10px;
  color: #6c757d;
  line-height: 1.3;
  font-style: italic;
  margin-top: 4px;
}

/* AI Recommendations */
.recommendations-section {
  background: #f0f8ff;
  border: 1px solid #b8daff;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.recommendation-item.priority-critical {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.recommendation-item.priority-high {
  border-left-color: #fd7e14;
  background: #fff9f5;
}

.recommendation-item.priority-medium {
  border-left-color: #ffc107;
  background: #fffdf5;
}

.recommendation-item.priority-low {
  border-left-color: #6c757d;
  background: #f8f9fa;
}

.recommendation-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.recommendation-priority {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.priority-critical .recommendation-priority { background: #dc3545; color: white; }
.priority-high .recommendation-priority { background: #fd7e14; color: white; }
.priority-medium .recommendation-priority { background: #ffc107; color: #333; }
.priority-low .recommendation-priority { background: #6c757d; color: white; }

.recommendation-action {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
  line-height: 1.3;
}

.recommendation-context {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
  padding-left: 4px;
  font-weight: 500;
}

/* Keep existing styles below */
.metric-section {
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.metric-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 12px;
  background: #0066cc;
  border-radius: 2px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.metric-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.metric-label {
  font-size: 9px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  margin-bottom: 2px;
  display: block;
}

.metric-value {
  font-size: 15px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 2px;
}

.metric-trend {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  display: inline-block;
  padding: 2px 5px;
  border-radius: 3px;
  margin-top: 2px;
}

.trend-up { 
  color: #28a745; 
  background: #d4edda;
}

.trend-down { 
  color: #dc3545; 
  background: #f8d7da;
}

.trend-neutral { 
  color: #6c757d; 
  background: #e9ecef;
}
/* Popup Tabs */
.popup-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 48px; /* After header */
  z-index: 9;
}

.popup-tab {
  flex: 1;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
}

.popup-tab:hover {
  background: #ebebeb;
  color: #333;
}

.popup-tab.active {
  background: white;
  color: #0066cc;
  border-bottom: 2px solid #0066cc;
  margin-bottom: -2px;
}

.popup-tab-content {
  display: none;
  animation: fadeIn 0.3s ease;
}

.popup-tab-content.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Campaigns Tab Styles */
.campaigns-content {
  padding: 16px 0;
}

.campaigns-charts-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.campaigns-charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: center;
}

.campaign-chart-item {
  text-align: center;
}

.campaign-chart-container {
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.campaign-chart-label {
  font-size: 12px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 8px;
}

.campaign-chart-value {
  font-size: 16px;
  font-weight: 700;
  color: #212529;
  margin-top: 4px;
}

.campaigns-table-section {
  padding: 0 16px;
}

.campaigns-metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.campaigns-metrics-table th {
  background: #f8f9fa;
  padding: 8px;
  text-align: left;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 10px;
  border-bottom: 2px solid #dee2e6;
}

.campaigns-metrics-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.campaigns-metrics-table tr:hover {
  background-color: #f8f9fa;
}

.campaign-name {
  font-weight: 600;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Ranking Tab Styles */
.ranking-content {
  padding: 16px;
}

.ranking-map-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.ranking-map-table th {
  background: #f8f9fa;
  padding: 8px 6px;
  text-align: left;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 9px;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.ranking-map-table td {
  padding: 10px 6px;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.ranking-map-table tr:hover {
  background-color: #f8f9fa;
}

.segment-name {
  font-weight: 700;
  padding: 8px 12px !important;
  border-radius: 4px;
}

.segment-top-3 .segment-name {
  background-color: #d4f4d4;
  color: #2e7d32;
}

.segment-top-4-8 .segment-name {
  background-color: #ffffc2;
  color: #f57c00;
}

.segment-top-9-14 .segment-name {
  background-color: #ffe0bd;
  color: #ef6c00;
}

.segment-below-14 .segment-name {
  background-color: #ffcfcf;
  color: #c62828;
}

/* Loading states */
.campaigns-loading,
.ranking-loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 14px;
}

/* Ensure ROAS coloring works in all tabs */
.roas-good { color: #28a745 !important; }
.roas-medium { color: #ffc107 !important; }
.roas-poor { color: #dc3545 !important; }
`;
document.head.appendChild(popupStyle);
  
    // Add this at the beginning of renderProductMapTable after checking for existing product-map-table-style
if (!document.getElementById("centered-panel-spinner-style")) {
  const spinnerStyle = document.createElement("style");
  spinnerStyle.id = "centered-panel-spinner-style";
  spinnerStyle.textContent = `
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #007aff;
      display: inline-block;
      animation: spin 1s ease infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyle);
}

    // Add these functions at the beginning of productMap.js (after the style definitions)

// Function to check if Google Ads integration is enabled
async function checkGoogleAdsIntegration() {
  try {
    const db = await window.dbPromise;
    const tableNames = await db.getAllObjectStoreNames();
    
    // Look for a table matching the pattern acc[number]_googleSheets_config
    const configTable = tableNames.find(name => /^acc\d+_googleSheets_config$/.test(name));
    
    if (configTable) {
      // Extract account number from table name
      const accountNumber = configTable.match(/acc(\d+)_/)[1];
      return { enabled: true, accountNumber };
    }
    
    return { enabled: false };
  } catch (error) {
    console.error('[ProductMap] Error checking Google Ads integration:', error);
    return { enabled: false };
  }
}

// Function to fetch product bucket data
async function fetchProductBucketData(accountNumber, productTitle) {
  try {
    const db = await window.dbPromise;
    const tableName = `acc${accountNumber}_googleSheets_productBuckets_30d`;
    
    // Check if table exists
    const tableNames = await db.getAllObjectStoreNames();
    if (!tableNames.includes(tableName)) {
      console.warn(`[ProductMap] Bucket table ${tableName} not found`);
      return null;
    }
    
    // Fetch all data from the table
    const tx = db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const allData = await store.getAll();
    
    // Find matching product by title
    const bucketData = allData.find(item => {
      if (item.data && Array.isArray(item.data)) {
        return item.data.find(product => 
          product['Product Title'] && 
          product['Product Title'].toLowerCase() === productTitle.toLowerCase()
        );
      }
      return false;
    });
    
    if (bucketData && bucketData.data) {
      const productData = bucketData.data.find(product => 
        product['Product Title'] && 
        product['Product Title'].toLowerCase() === productTitle.toLowerCase()
      );
      return productData || null;
    }
    
    return null;
  } catch (error) {
    console.error('[ProductMap] Error fetching bucket data:', error);
    return null;
  }
}
  
    // Modified function to format location cell into three rows (city, state, country)
    function formatLocationCell(locationString) {
      if (!locationString) return locationString;
      const parts = locationString.split(",");
      const city = parts.shift() || locationString;
      
      // If we have more parts, separate state and country
      let state = "", country = "";
      if (parts.length === 1) {
        // Only one part left, assume it's the country
        country = parts[0].trim();
      } else if (parts.length >= 2) {
        // Multiple parts left, assume state and country
        state = parts.shift().trim();
        country = parts.join(",").trim();
      }
      
      return `
        <div class="city-line">${city}</div>
        ${state ? `<div class="state-line">${state}</div>` : ''}
        ${country ? `<div class="country-line">${country}</div>` : ''}
      `;
    }
  
    // Function to create market share pie chart
    function createMarketSharePieChart(containerId, shareValue) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Use ApexCharts to create a donut chart with improved styling
      const options = {
        series: [shareValue],
        chart: {
          height: 75,
          width: 75,
          type: 'radialBar',
          sparkline: {
            enabled: true
          }
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: {
              size: '65%',
              background: '#fff'
            },
            track: {
              background: '#e7e7e7',
              strokeWidth: '97%',
              margin: 5
            },
            dataLabels: {
              name: {
                show: false
              },
              value: {
                fontSize: '16px',
                fontWeight: 600,
                show: true,
                offsetY: 5,
                formatter: function(val) {
                  // Round to one decimal place
                  return parseFloat(val).toFixed(1) + '%';
                }
              }
            }
          }
        },
        fill: {
          type: 'solid',
          colors: ['#007aff']
        },
        stroke: {
          lineCap: 'round'
        }
      };
      
      // Create chart instance
      const chart = new ApexCharts(container, options);
      chart.render();
    }
  
    // Function to calculate aggregate segment data for a set of products
    function calculateAggregateSegmentData(products) {
      if (!products || products.length === 0) return null;
      
      // Define date ranges
      const globalLastDate = moment().subtract(1, "days"); // Use yesterday as the reference point
      const endDate = globalLastDate.clone();
      const startDate = endDate.clone().subtract(6, "days"); // Last 7 days
      
      // For previous period
      const prevEnd = startDate.clone().subtract(1, "days");
      const prevStart = prevEnd.clone().subtract(6, "days");
      
      let currTop3Sum = 0, currTop8Sum = 0, currTop14Sum = 0, currTop40Sum = 0;
      let prevTop3Sum = 0, prevTop8Sum = 0, prevTop14Sum = 0, prevTop40Sum = 0;
      let countCurrent = 0, countPrevious = 0;
      
      // Helper function to calculate average
      function avg(arr, field, multiplier = 1) {
        if (!arr.length) return 0;
        let sum = 0, c = 0;
        arr.forEach(x => {
          if (x[field] != null) {
            sum += parseFloat(x[field]) * multiplier;
            c++;
          }
        });
        return c > 0 ? sum / c : 0;
      }
      
      // Process each product
      products.forEach(product => {
        const histData = product.historical_data || [];
        
        // Filter for current and previous periods
        const currentFiltered = histData.filter(item => {
          if (!item.date || !item.date.value) return false;
          const d = moment(item.date.value, "YYYY-MM-DD");
          return d.isBetween(startDate, endDate, "day", "[]");
        });
        
        const prevFiltered = histData.filter(item => {
          if (!item.date || !item.date.value) return false;
          const d = moment(item.date.value, "YYYY-MM-DD");
          return d.isBetween(prevStart, prevEnd, "day", "[]");
        });
        
        // Add to sums if data exists
        if (currentFiltered.length > 0) {
          currTop3Sum += avg(currentFiltered, "top3_visibility", 100);
          currTop8Sum += avg(currentFiltered, "top8_visibility", 100);
          currTop14Sum += avg(currentFiltered, "top14_visibility", 100);
          currTop40Sum += avg(currentFiltered, "top40_visibility", 100) || avg(currentFiltered, "market_share", 100);
          countCurrent++;
        }
        
        if (prevFiltered.length > 0) {
          prevTop3Sum += avg(prevFiltered, "top3_visibility", 100);
          prevTop8Sum += avg(prevFiltered, "top8_visibility", 100);
          prevTop14Sum += avg(prevFiltered, "top14_visibility", 100);
          prevTop40Sum += avg(prevFiltered, "top40_visibility", 100) || avg(prevFiltered, "market_share", 100);
          countPrevious++;
        }
      });
      
      // Calculate averages
      const currTop3 = countCurrent > 0 ? currTop3Sum / countCurrent : 0;
      const currTop8 = countCurrent > 0 ? currTop8Sum / countCurrent : 0;
      const currTop14 = countCurrent > 0 ? currTop14Sum / countCurrent : 0;
      const currTop40 = countCurrent > 0 ? currTop40Sum / countCurrent : 0;
      
      const prevTop3 = countPrevious > 0 ? prevTop3Sum / countPrevious : 0;
      const prevTop8 = countPrevious > 0 ? prevTop8Sum / countPrevious : 0;
      const prevTop14 = countPrevious > 0 ? prevTop14Sum / countPrevious : 0;
      const prevTop40 = countPrevious > 0 ? prevTop40Sum / countPrevious : 0;
      
      // Format data for chart
      return [
        { label: "Top3", current: currTop3, previous: prevTop3 },
        { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
        { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
        { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
      ];
    }
    
// Function to create segment chart
function createSegmentationChart(containerId, chartData, termParam, locParam, deviceParam, myCompanyParam, activeCount, inactiveCount, segmentCounts) {
  // Create a unique ID for the chart
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) return;
  chartContainer.classList.remove('loading');
  
  if (!chartData || chartData.length === 0) {
    chartContainer.innerHTML = '<div class="no-data-message">No segment data</div>';
    return;
  }
  
  // Clear the container and set FIXED dimensions
  chartContainer.innerHTML = '';
  chartContainer.style.height = '380px'; // Fixed total height
  chartContainer.style.maxHeight = '380px';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.display = 'flex';
  chartContainer.style.flexDirection = 'column';
  chartContainer.style.alignItems = 'center';
  
  // Create a wrapper for chart and counts side by side
  const chartAndCountsWrapper = document.createElement('div');
  chartAndCountsWrapper.style.width = '100%';
  chartAndCountsWrapper.style.height = '280px';
  chartAndCountsWrapper.style.display = 'flex';
  chartAndCountsWrapper.style.alignItems = 'center';
  chartAndCountsWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(chartAndCountsWrapper);
  
  // Create canvas wrapper div
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.flex = '1';
  canvasWrapper.style.height = '100%';
  canvasWrapper.style.position = 'relative';
  chartAndCountsWrapper.appendChild(canvasWrapper);
  
  // Create product counts column
  const countsColumn = document.createElement('div');
  countsColumn.style.width = '40px';
  countsColumn.style.height = '100%';
  countsColumn.style.display = 'flex';
  countsColumn.style.flexDirection = 'column';
  countsColumn.style.justifyContent = 'center';
  countsColumn.style.paddingLeft = '5px';
  chartAndCountsWrapper.appendChild(countsColumn);
  
// Add product count labels for each segment
  const segmentLabels = ['Top3', 'Top4-8', 'Top9-14', 'Below14'];
  const segmentClasses = ['segment-count-top3', 'segment-count-top4-8', 'segment-count-top9-14', 'segment-count-below14'];
  
  segmentLabels.forEach((label, index) => {
    const countDiv = document.createElement('div');
    countDiv.style.height = '25%';
    countDiv.style.display = 'flex';
    countDiv.style.alignItems = 'center';
    countDiv.style.justifyContent = 'center';
    
    const count = segmentCounts ? segmentCounts[index] : 0;
    if (count > 0) {
      const circle = document.createElement('div');
      circle.className = 'segment-count-circle ' + segmentClasses[index];
      circle.textContent = count;
      countDiv.appendChild(circle);
    }
    
    countsColumn.appendChild(countDiv);
  });
  
  // Create canvas element inside the wrapper
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
  // Create the product count container with fixed height
  const countContainer = document.createElement('div');
  countContainer.style.width = '250px';
  countContainer.style.height = '80px'; // Fixed height
  countContainer.style.maxHeight = '80px';
  countContainer.style.display = 'grid';
  countContainer.style.gridTemplateColumns = '1fr 1fr';
  countContainer.style.gridTemplateRows = 'auto auto';
  countContainer.style.gap = '4px';
  countContainer.style.padding = '8px';
  countContainer.style.backgroundColor = '#f9f9f9';
  countContainer.style.borderRadius = '8px';
  countContainer.style.fontSize = '14px';
  countContainer.style.boxSizing = 'border-box';

  console.log(`[DEBUG] Using provided counts - Active: ${activeCount}, Inactive: ${inactiveCount}`);
  
  countContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
    <div style="font-weight: 700; color: #4CAF50;">${activeCount}</div>
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
    <div style="font-weight: 700; color: #9e9e9e;">${inactiveCount}</div>
  `;
  
  // Add the count container to the chart container
  chartContainer.appendChild(countContainer);
  
  // Create chart with original settings (no modifications for product counts)
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: chartData.map(d => d.label),
      datasets: [
        {
          label: "Current",
          data: chartData.map(d => d.current),
          backgroundColor: "#007aff",
          borderRadius: 4
        },
        {
          label: "Previous",
          type: "line",
          data: chartData.map(d => d.previous),
          borderColor: "rgba(255,0,0,1)",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      onResize: null,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.x;
              const productCount = segmentCounts ? segmentCounts[ctx.dataIndex] : 0;
              const productInfo = productCount > 0 ? ` (${productCount} products)` : '';
              return `${ctx.dataset.label}: ${val.toFixed(2)}%${productInfo}`;
            }
          }
        },
        datalabels: {
          display: ctx => ctx.datasetIndex === 0,
          formatter: (value, context) => {
            const row = chartData[context.dataIndex];
            const mainLabel = `${row.current.toFixed(1)}%`;
            const diff = row.current - row.previous;
            const absDiff = Math.abs(diff).toFixed(1);
            const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "±";
            return [ mainLabel, `${arrow}${absDiff}%` ];
          },
          color: ctx => {
            const row = chartData[ctx.dataIndex];
            const diff = row.current - row.previous;
            if (diff > 0) return "green";
            if (diff < 0) return "red";
            return "#444";
          },
          anchor: "end",
          align: "end",
          offset: 8,
          font: { size: 10 }
        }
      },
      scales: {
        x: { display: false, min: 0, max: 100 },
        y: { display: true, grid: { display: false }, ticks: { font: { size: 11 } } }
      },
      animation: false
    }
  });
}
  
    // Process the data into a hierarchical structure
    const nestedMap = {};
    window.projectTableData.forEach(item => {
      const term = item.searchTerm || "(no term)";
      const loc  = item.location   || "(no loc)";
      if (!nestedMap[term]) nestedMap[term] = {};
      if (!nestedMap[term][loc]) nestedMap[term][loc] = [];
      nestedMap[term][loc].push(item);
    });
  
    const table = document.createElement("table");
    table.classList.add("product-map-table");
  
    const thead = document.createElement("thead");
    thead.innerHTML = `
      <tr>
        <th>Search Term</th>
        <th>Location</th>
        <th>Device</th>
        <th>Top 40 Segmentation</th>
        <th>Products</th>
      </tr>
    `;
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    // Get the shopping ad template
    const adTemplate = document.getElementById("shopping-ad-template").innerHTML;
    const compiledTemplate = Handlebars.compile(adTemplate);
  
    console.log("[renderProductMapTable] Processing search terms");
    
    // Create a map of locations to color classes
    const locationColorMap = {};
    const allLocationsList = [];
    Object.values(nestedMap).forEach(locObj => {
      Object.keys(locObj).forEach(loc => {
        if (!allLocationsList.includes(loc)) {
          allLocationsList.push(loc);
        }
      });
    });
    
    // Assign color classes to locations
    allLocationsList.sort().forEach((loc, index) => {
      const colorIndex = (index % 10) + 1; // Use 10 different color classes
      locationColorMap[loc] = `location-bg-${colorIndex}`;
    });
    
    // Counter for unique chart IDs
    let chartCounter = 0;
    // Counter for unique pie chart IDs
    let pieChartCounter = 0;
    
    // Iterate through search terms
    const searchTerms = Object.keys(nestedMap).sort();
    searchTerms.forEach(term => {
      const locObj = nestedMap[term];
      const allLocs = Object.keys(locObj).sort();
  
      // Calculate total rows needed for this search term
      let totalRowsForTerm = 0;
      allLocs.forEach(loc => {
        totalRowsForTerm += locObj[loc].length;
      });
  
      let termCellUsed = false;
      
      // Iterate through locations for this search term
      allLocs.forEach(loc => {
        const deviceRows = locObj[loc];
        let locCellUsed = false;
        
        // Get the color class for this location
        const locationColorClass = locationColorMap[loc];
  
        // Iterate through devices for this location
        deviceRows.forEach(rowData => {
          const tr = document.createElement("tr");
  
          // Add search term cell (with rowspan for all rows in this term) - MODIFIED as tag
          if (!termCellUsed) {
            const tdTerm = document.createElement("td");
            tdTerm.rowSpan = totalRowsForTerm;
            tdTerm.innerHTML = `<div class="search-term-tag">${term}</div>`;
            tr.appendChild(tdTerm);
            termCellUsed = true;
          }
  
          // Add location cell (with rowspan for all device rows in this location)
          if (!locCellUsed) {
            const tdLoc = document.createElement("td");
            tdLoc.rowSpan = deviceRows.length;
            tdLoc.innerHTML = formatLocationCell(loc);
            tdLoc.classList.add(locationColorClass);
            tr.appendChild(tdLoc);
            locCellUsed = true;
          }
  
          // Add device cell with pie chart for market share
          const tdDev = document.createElement("td");
          
          // Find the corresponding data in projectTableData for this term, location, device
          const projectData = window.projectTableData.find(item => 
            item.searchTerm === term && 
            item.location === loc &&
            item.device === rowData.device
          );
          
          // Create device container with three sections
          let deviceHTML = `<div class="device-container">`;
          
          // 1. Device type
          deviceHTML += `<div class="device-type"><img src="${rowData.device.toLowerCase().includes('mobile') ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png'}" alt="${rowData.device}" class="device-icon" /></div>`;
          
          // 2. Avg Rank with header
          if (projectData && projectData.avgRank !== undefined) {
            const rankVal = projectData.avgRank.toFixed(2);
            let rankArrow = "±", rankColor = "#444";
            
            if (projectData.rankChange !== undefined) {
              if (projectData.rankChange < 0) {
                rankArrow = "▲"; 
                rankColor = "green";
              } else if (projectData.rankChange > 0) {
                rankArrow = "▼"; 
                rankColor = "red";
              }
            }
            
            deviceHTML += `
              <div class="device-rank">
                <div class="section-header">Avg Rank</div>
                <div class="device-rank-value">${rankVal}</div>
                <div class="device-trend" style="color:${rankColor};">
                  ${rankArrow} ${Math.abs(projectData.rankChange || 0).toFixed(2)}
                </div>
              </div>
            `;
          } else {
            deviceHTML += `
              <div class="device-rank">
                <div class="section-header">Avg Rank</div>
                <div class="device-rank-value">-</div>
              </div>
            `;
          }
          
          // 3. Market Share with pie chart - MODIFIED
          const pieChartId = `market-share-pie-${pieChartCounter++}`;
          
          deviceHTML += `
            <div class="device-share">
              <div class="section-header">Market Share</div>
              <div id="${pieChartId}" class="pie-chart-container"></div>
          `;
          
          // Add trend below pie chart
          if (projectData && projectData.trendVal !== undefined) {
            let shareArrow = "±", shareColor = "#333";
            
            if (projectData.trendVal > 0) {
              shareArrow = "▲";
              shareColor = "green";
            } else if (projectData.trendVal < 0) {
              shareArrow = "▼";
              shareColor = "red";
            }
            
            deviceHTML += `
              <div class="device-trend" style="color:${shareColor};">
                ${shareArrow} ${Math.abs(projectData.trendVal || 0).toFixed(1)}%
              </div>
            `;
          }
          
          deviceHTML += `</div>`; // Close device-share
// Find the latest tracking date from all active products
let latestDate = null;

if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in all historical data
  const allProductsForDevice = window.allRows.filter(p => 
    p.q === term &&
    p.location_requested === loc &&
    p.device === rowData.device &&
    p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase()
  );

  allProductsForDevice.forEach(product => {
    if (product.historical_data && Array.isArray(product.historical_data)) {
      product.historical_data.forEach(item => {
        if (item.date && item.date.value) {
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          if (latestDate === null || itemDate.isAfter(latestDate)) {
            latestDate = itemDate.clone();
          }
        }
      });
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}

// Add last tracked container
deviceHTML += `<div class="last-tracked-container">
  <div class="last-tracked-label">Last time tracked:</div>`;

if (latestDate) {
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'days').startOf('day');
  const daysDiff = today.diff(latestDate, 'days');
  
  let lastTrackedText = '';
  let trackingClass = '';
  
  if (daysDiff === 0) {
    lastTrackedText = 'Today';
    trackingClass = 'recent-tracking';
  } else if (daysDiff === 1) {
    lastTrackedText = 'Yesterday';
    trackingClass = 'recent-tracking';
  } else if (daysDiff <= 7) {
    lastTrackedText = `${daysDiff} days ago`;
    trackingClass = 'moderate-tracking';
  } else {
    lastTrackedText = `${daysDiff} days ago`;
    trackingClass = 'old-tracking';
  }
  
  deviceHTML += `<div class="last-tracked-value ${trackingClass}">${lastTrackedText}</div>`;
} else {
  deviceHTML += `<div class="last-tracked-value">Not tracked</div>`;
}

deviceHTML += `</div>`; // Close last-tracked-container
          deviceHTML += `</div>`; // Close device-container
          
          tdDev.innerHTML = deviceHTML;
          
          // Apply background based on device type
          const deviceLower = rowData.device.toLowerCase();
          if (deviceLower.includes('desktop')) {
            tdDev.classList.add('device-desktop');
          } else if (deviceLower.includes('mobile')) {
            tdDev.classList.add('device-mobile');
          }
          
          tr.appendChild(tdDev);
          
          // Add Top 40 Segmentation cell
          const tdSegmentation = document.createElement("td");
          const chartContainerId = `segmentation-chart-${chartCounter++}`;
          tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container loading"></div>`;
          tr.appendChild(tdSegmentation);
  
// Add products cell
const tdProducts = document.createElement("td");
tdProducts.style.width = "100%";
tdProducts.style.minWidth = "400px";

// Create product cell container (for Products view)
const productCellContainer = document.createElement("div");
productCellContainer.classList.add("product-cell-container");
productCellContainer.style.width = "100%";
productCellContainer.style.height = "100%";

// Create product container
const productCellDiv = document.createElement("div");
productCellDiv.classList.add("product-cell");
productCellContainer.appendChild(productCellDiv);
tdProducts.appendChild(productCellContainer);

// Create products chart container (for Charts view)
const productsChartContainer = document.createElement("div");
productsChartContainer.classList.add("products-chart-container");

// Create chart-products container
const chartProductsDiv = document.createElement("div");
chartProductsDiv.classList.add("chart-products");

// Create chart-avg-position container
const chartAvgPositionDiv = document.createElement("div");
chartAvgPositionDiv.classList.add("chart-avg-position");
chartAvgPositionDiv.innerHTML = '<div>Average Position Chart (Coming Soon)</div>';

productsChartContainer.appendChild(chartProductsDiv);
productsChartContainer.appendChild(chartAvgPositionDiv);
tdProducts.appendChild(productsChartContainer);
  
          // Find and display matching products
          if (window.allRows && Array.isArray(window.allRows)) {
            console.log(`[renderProductMapTable] Finding products for ${term}, ${loc}, ${rowData.device}`);
            
            const matchingProducts = window.allRows.filter(p => 
              p.q === term &&
              p.location_requested === loc &&
              p.device === rowData.device &&
              p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase()
            );
  
            console.log(`[renderProductMapTable] Found ${matchingProducts.length} matching products for ${window.myCompany}`);
  
// First, just calculate the aggregate data and store references
const chartData = calculateAggregateSegmentData(matchingProducts);

// Filter active and inactive products
const activeProducts = matchingProducts.filter(product => 
  product.product_status === 'active' || !product.product_status
);

const inactiveProducts = matchingProducts.filter(product => 
  product.product_status === 'inactive'
);

// Store the data we'll need later
const chartInfo = {
  containerId: chartContainerId,
  data: chartData,
  term: term,
  location: loc,
  device: rowData.device,
  company: window.myCompany,
  activeCount: activeProducts.length,
  inactiveCount: inactiveProducts.length,
  pieChartId: pieChartId,
  projectData: projectData,
  productCellDiv: productCellDiv // Add reference to the product cell
};

// Add to pending charts array instead of creating immediately
if (!window.pendingSegmentationCharts) {
  window.pendingSegmentationCharts = [];
}
window.pendingSegmentationCharts.push(chartInfo);
  
            if (matchingProducts.length === 0) {
              productCellDiv.innerHTML = '<div class="no-products">–</div>';
            } else {
              // Debug: Log product cell width
              console.log(`[renderProductMapTable] Product cell width for ${term}/${loc}/${rowData.device}: ${productCellDiv.offsetWidth}px`);
              console.log("[DEBUG] Product cell HTML structure:", productCellDiv.innerHTML.substring(0, 200) + "...");
             console.log("[DEBUG] Product cell has", productCellDiv.querySelectorAll('*').length, "elements,", 
             productCellDiv.querySelectorAll('.ad-details').length, "with class 'ad-details'");
  
// Sort products by average position for the 7-day period (best/lowest position first)
matchingProducts.forEach(product => {
  // Calculate the 7-day average position for sorting
  if (product.historical_data && product.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
    
    if (latestDate) {
      // Define the 7-day window
      const endDate = latestDate.clone();
      const startDate = endDate.clone().subtract(6, 'days');
      
      // Filter for current 7-day period
      const currentPeriodData = product.historical_data.filter(item => {
        if (!item.date || !item.date.value || !item.avg_position) return false;
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        return itemDate.isBetween(startDate, endDate, 'day', '[]');
      });
      
      // Calculate average position
      let sum = 0;
      let count = 0;
      currentPeriodData.forEach(item => {
        const pos = parseFloat(item.avg_position);
        if (!isNaN(pos)) {
          sum += pos;
          count++;
        }
      });
      
      product._sortingAvgPos = count > 0 ? sum / count : 999999;
    } else {
      product._sortingAvgPos = 999999;
    }
  } else {
    product._sortingAvgPos = 999999;
  }
});

// Now sort by the calculated average position
matchingProducts.sort((a, b) => {
  return a._sortingAvgPos - b._sortingAvgPos; // Sort by ascending position (lowest/best first)
});
              
              // Create a floating card for each product
              // In the matchingProducts.forEach loop in renderProductMapTable:

              // First sort products by status (active first, then inactive)
              const activeProducts = matchingProducts.filter(product => 
                product.product_status === 'active' || !product.product_status
              );
              const inactiveProducts = matchingProducts.filter(product => 
                product.product_status === 'inactive'
              );
              
              console.log(`[DEBUG] Products sorted: ${activeProducts.length} active, ${inactiveProducts.length} inactive`);
              
              // Process active products first
              activeProducts.forEach((product, productIndex) => {
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
                  // 2. Make sure the stars array is properly formatted
                  enhancedProduct.stars = [];
                  const rating = parseFloat(enhancedProduct.rating) || 4.5;
                  for (let i = 0; i < 5; i++) {
                    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                    enhancedProduct.stars.push({ fill });
                  }
                  
                  // 3. PRESERVE ONLY REAL HISTORICAL DATA - NO SYNTHETIC DATA
                  if (!enhancedProduct.historical_data || !Array.isArray(enhancedProduct.historical_data)) {
                    enhancedProduct.historical_data = [];
                  } else {
                    // Fix any data parsing issues in the original historical data
                    enhancedProduct.historical_data = enhancedProduct.historical_data.map(entry => {
                      if (entry.avg_position) {
                        // Ensure avg_position is a valid number by parsing and formatting
                        const cleanPosition = parseFloat(entry.avg_position);
                        if (!isNaN(cleanPosition)) {
                          entry.avg_position = cleanPosition.toFixed(2);
                        }
                      }
                      return entry;
                    });
                  }
                  
                  // 4. Ensure other required fields are present
                  // Calculate real position and trend using historical data
                  if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
                  
                    // If no valid dates found, we can't calculate anything
                    if (!latestDate) {
                      enhancedProduct.finalPosition = "-";
                      enhancedProduct.finalSlope = "";
                      enhancedProduct.arrow = "";
                      enhancedProduct.posBadgeBackground = "gray";
                    } else {
                      // Define the 7-day time windows based on the latest available date
                      const endDate = latestDate.clone();
                      const startDate = endDate.clone().subtract(6, 'days'); // Last 7 days including end date
                      
                      // Previous period
                      const prevEndDate = startDate.clone().subtract(1, 'days');
                      const prevStartDate = prevEndDate.clone().subtract(6, 'days');
                      
                      // Filter for current 7-day period
                      const currentPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(startDate, endDate, 'day', '[]');
                      });
                      
                      // Filter for previous 7-day period
                      const prevPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
                      });
                      
                      // Calculate average position for current period
                      let currentAvgPos = 0;
                      if (currentPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        currentPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        currentAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate average position for previous period
                      let prevAvgPos = 0;
                      if (prevPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        prevPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        prevAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate trend (change in position)
                      let slope = 0;
                      if (currentAvgPos > 0 && prevAvgPos > 0) {
                        slope = currentAvgPos - prevAvgPos;
                      }
                      
                      // Set the badge values
                      if (currentAvgPos > 0) {
                        // Format to 1 decimal place, avoid .0 suffix
                        const formattedPos = currentAvgPos.toFixed(1).replace(/\.0$/, '');
                        enhancedProduct.finalPosition = formattedPos;
                        
                        if (slope !== 0) {
                          // For position, DOWN (▼) is GOOD, UP (▲) is BAD
                          if (slope > 0) {
                            enhancedProduct.arrow = "▼"; // Position got worse
                            enhancedProduct.posBadgeBackground = "red";
                          } else {
                            enhancedProduct.arrow = "▲"; // Position improved
                            enhancedProduct.posBadgeBackground = "green";
                          }
                          
                          // Format slope to 1 decimal place, remove negative sign for improved, add for worsened
                          const slopeAbs = Math.abs(slope).toFixed(1).replace(/\.0$/, '');
                          enhancedProduct.finalSlope = slope < 0 ? slopeAbs : `-${slopeAbs}`;
                        } else {
                          enhancedProduct.arrow = "";
                          enhancedProduct.finalSlope = "";
                          enhancedProduct.posBadgeBackground = "gray";
                        }
                      } else {
                        // No valid position data
                        enhancedProduct.finalPosition = "-";
                        enhancedProduct.finalSlope = "";
                        enhancedProduct.arrow = "";
                        enhancedProduct.posBadgeBackground = "gray";
                      }
                    }
                  } else {
                    // No historical data available
                    enhancedProduct.finalPosition = "-";
                    enhancedProduct.finalSlope = "";
                    enhancedProduct.arrow = "";
                    enhancedProduct.posBadgeBackground = "gray";
                  }
              
// Calculate visibility for the 7-day period
let visibilityBarValue = 0;
if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0 && latestDate) {
  // Use the same date range as position calculation
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const periodDays = 7;
  
  // Sum visibility for the period
  let sum = 0;
  enhancedProduct.historical_data.forEach((item) => {
    if (item.date && item.date.value) {
      const d = moment(item.date.value, "YYYY-MM-DD");
      if (d.isBetween(startDate, endDate, "day", "[]")) {
        if (item.visibility != null) {
          sum += parseFloat(item.visibility);
        }
      }
    }
  });
  
  // Average is sum divided by number of days (not number of records)
  let avgDailyVis = sum / periodDays;
  
  // Convert to 0-100 integer
  visibilityBarValue = Math.round(avgDailyVis * 100);
}
enhancedProduct.visibilityBarValue = visibilityBarValue || 0;
                  
// 5. Most importantly: Add this FULLY enhanced product to globalRows
window.globalRows[pmIndexKey] = enhancedProduct;

// ADD BUCKET LOGIC HERE:
// Get bucket data for this product
let bucketBadgeHTML = '';
let hasBucketClass = '';

if (googleAdsEnabled && bucketDataMap.size > 0) {
  // Normalize device value from current row to uppercase
  const deviceValue = (rowData.device || '').toUpperCase();
  const lookupKey = `${enhancedProduct.title.toLowerCase()}|${deviceValue}`;
  
  console.log(`[ProductMap] Looking up bucket for: "${lookupKey}"`); // Debug log
  
  const productBucketData = bucketDataMap.get(lookupKey);
  
  if (productBucketData) {
    // Get PROFITABILITY_BUCKET value by default
    bucketBadgeHTML = getBucketBadgeHTML(productBucketData, 'PROFITABILITY_BUCKET');
    
    if (bucketBadgeHTML) {
      hasBucketClass = 'has-bucket';
      
      // Log for debugging
      console.log(`[ProductMap] Product "${enhancedProduct.title}" on ${deviceValue} has bucket:`, productBucketData['PROFITABILITY_BUCKET']);
    }
  } else {
    // Debug: log why no match
    if (bucketDataMap.size > 0) {
      console.log(`[ProductMap] No bucket match for: "${lookupKey}"`);
      // Log first few keys to see format
      const sampleKeys = Array.from(bucketDataMap.keys()).slice(0, 3);
      console.log(`[ProductMap] Sample bucket keys:`, sampleKeys);
    }
  }
}

// Add bucket info to enhancedProduct
enhancedProduct.bucketBadgeHTML = bucketBadgeHTML;
enhancedProduct.hasBucketClass = hasBucketClass;
                  
                  // Now render the product with the same enhanced data
                  const html = compiledTemplate(enhancedProduct);
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  
                  // Get just the first element (the ad-details div)
                  const adCard = tempDiv.firstElementChild;
                  adCard.classList.remove('my-company');

                  // Add has-bucket class if applicable
if (hasBucketClass) {
  adCard.classList.add(hasBucketClass);
}

// Insert bucket badge as the first child of ad-details
if (bucketBadgeHTML) {
  adCard.insertAdjacentHTML('afterbegin', bucketBadgeHTML);
}
                  
                  // Set explicit width as a safeguard
                  adCard.style.width = "150px";
                  adCard.style.flexShrink = "0";
                  
                  // Add to the products cell
                  productCellDiv.appendChild(adCard);
                } catch (error) {
                  console.error("[renderProductMapTable] Error rendering product:", error);
                  console.error("[renderProductMapTable] Problem product:", JSON.stringify(product));
                }
              });
              
              // Then process inactive products with the same detailed logic
              inactiveProducts.forEach((product, productIndex) => {
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_inactive_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
                  // 2. Make sure the stars array is properly formatted
                  enhancedProduct.stars = [];
                  const rating = parseFloat(enhancedProduct.rating) || 4.5;
                  for (let i = 0; i < 5; i++) {
                    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                    enhancedProduct.stars.push({ fill });
                  }
                  
                  // 3. PRESERVE ONLY REAL HISTORICAL DATA - NO SYNTHETIC DATA
                  if (!enhancedProduct.historical_data || !Array.isArray(enhancedProduct.historical_data)) {
                    enhancedProduct.historical_data = [];
                  } else {
                    // Fix any data parsing issues in the original historical data
                    enhancedProduct.historical_data = enhancedProduct.historical_data.map(entry => {
                      if (entry.avg_position) {
                        // Ensure avg_position is a valid number by parsing and formatting
                        const cleanPosition = parseFloat(entry.avg_position);
                        if (!isNaN(cleanPosition)) {
                          entry.avg_position = cleanPosition.toFixed(2);
                        }
                      }
                      return entry;
                    });
                  }
                  
                  // Log the actual historical data count
                  console.log(`[DEBUG] Inactive product '${enhancedProduct.title}' has ${enhancedProduct.historical_data.length} actual historical records`);
                  
                  // 4. Ensure other required fields are present
                  // Calculate real position and trend using historical data
                  if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
                  
                    // If no valid dates found, we can't calculate anything
                    if (!latestDate) {
                      enhancedProduct.finalPosition = "-";
                      enhancedProduct.finalSlope = "";
                      enhancedProduct.arrow = "";
                      enhancedProduct.posBadgeBackground = "gray";
                    } else {
                      // Define the 7-day time windows based on the latest available date
                      const endDate = latestDate.clone();
                      const startDate = endDate.clone().subtract(6, 'days'); // Last 7 days including end date
                      
                      // Previous period
                      const prevEndDate = startDate.clone().subtract(1, 'days');
                      const prevStartDate = prevEndDate.clone().subtract(6, 'days');
                      
                      // Filter for current 7-day period
                      const currentPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(startDate, endDate, 'day', '[]');
                      });
                      
                      // Filter for previous 7-day period
                      const prevPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
                      });
                      
                      // Calculate average position for current period
                      let currentAvgPos = 0;
                      if (currentPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        currentPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        currentAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate average position for previous period
                      let prevAvgPos = 0;
                      if (prevPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        prevPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        prevAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate trend (change in position)
                      let slope = 0;
                      if (currentAvgPos > 0 && prevAvgPos > 0) {
                        slope = currentAvgPos - prevAvgPos;
                      }
                      
                      // Set the badge values
                      if (currentAvgPos > 0) {
                        // Format to 1 decimal place, avoid .0 suffix
                        const formattedPos = currentAvgPos.toFixed(1).replace(/\.0$/, '');
                        enhancedProduct.finalPosition = formattedPos;
                        
                        if (slope !== 0) {
                          // For position, DOWN (▼) is GOOD, UP (▲) is BAD
                          if (slope > 0) {
                            enhancedProduct.arrow = "▼"; // Position got worse
                            enhancedProduct.posBadgeBackground = "red";
                          } else {
                            enhancedProduct.arrow = "▲"; // Position improved
                            enhancedProduct.posBadgeBackground = "green";
                          }
                          
                          // Format slope to 1 decimal place, remove negative sign for improved, add for worsened
                          const slopeAbs = Math.abs(slope).toFixed(1).replace(/\.0$/, '');
                          enhancedProduct.finalSlope = slope < 0 ? slopeAbs : `-${slopeAbs}`;
                        } else {
                          enhancedProduct.arrow = "";
                          enhancedProduct.finalSlope = "";
                          enhancedProduct.posBadgeBackground = "gray";
                        }
                      } else {
                        // No valid position data
                        enhancedProduct.finalPosition = "-";
                        enhancedProduct.finalSlope = "";
                        enhancedProduct.arrow = "";
                        enhancedProduct.posBadgeBackground = "gray";
                      }
                    }
                  } else {
                    // No historical data available
                    enhancedProduct.finalPosition = "-";
                    enhancedProduct.finalSlope = "";
                    enhancedProduct.arrow = "";
                    enhancedProduct.posBadgeBackground = "gray";
                  }
              
// Calculate visibility for the 7-day period
let visibilityBarValue = 0;
if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0 && latestDate) {
  // Use the same date range as position calculation
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const periodDays = 7;
  
  // Sum visibility for the period
  let sum = 0;
  enhancedProduct.historical_data.forEach((item) => {
    if (item.date && item.date.value) {
      const d = moment(item.date.value, "YYYY-MM-DD");
      if (d.isBetween(startDate, endDate, "day", "[]")) {
        if (item.visibility != null) {
          sum += parseFloat(item.visibility);
        }
      }
    }
  });
  
  // Average is sum divided by number of days (not number of records)
  let avgDailyVis = sum / periodDays;
  
  // Convert to 0-100 integer
  visibilityBarValue = Math.round(avgDailyVis * 100);
}
enhancedProduct.visibilityBarValue = visibilityBarValue || 0;
                  
                  // 5. Most importantly: Add this FULLY enhanced product to globalRows
                  window.globalRows[pmIndexKey] = enhancedProduct;
                  console.log(`[DEBUG] Added inactive product to globalRows[${pmIndexKey}] with ${enhancedProduct.historical_data.length} real historical records`);

// Get bucket data for this product
let bucketBadgeHTML = '';
let hasBucketClass = '';

if (googleAdsEnabled && bucketDataMap.size > 0) {
  const productBucketData = bucketDataMap.get(enhancedProduct.title.toLowerCase());
  
  if (productBucketData) {
    // Get ROAS_Bucket value by default
    const bucketValue = productBucketData.ROAS_Bucket;
    
    if (bucketValue && bucketValue !== '') {
      bucketBadgeHTML = getBucketBadgeHTML(bucketValue, 'ROAS');
      hasBucketClass = 'has-bucket';
      
      // Log for debugging
      console.log(`[ProductMap] Product "${enhancedProduct.title}" has ROAS_Bucket: ${bucketValue}`);
    }
  }
}

// Add bucket info to enhancedProduct
enhancedProduct.bucketBadgeHTML = bucketBadgeHTML;
enhancedProduct.hasBucketClass = hasBucketClass;
                  
                  // Now render the product with the same enhanced data
                  const html = compiledTemplate(enhancedProduct);
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  
                  // Get just the first element (the ad-details div)
                  const adCard = tempDiv.firstElementChild;
                  adCard.classList.remove('my-company');

                  // Add has-bucket class if applicable
if (hasBucketClass) {
  adCard.classList.add(hasBucketClass);
}

// Insert bucket badge as the first child of ad-details
if (bucketBadgeHTML) {
  adCard.insertAdjacentHTML('afterbegin', bucketBadgeHTML);
}
                  
                  // Set explicit width as a safeguard
                  adCard.style.width = "150px";
                  adCard.style.flexShrink = "0";
                  
                  // Add inactive class for styling
                  adCard.classList.add('inactive-product');
                  
                  // Add status indicator
                  const statusIndicator = document.createElement('div');
                  statusIndicator.className = 'product-status-indicator product-status-inactive';
                  statusIndicator.textContent = 'Inactive';
                  adCard.appendChild(statusIndicator);
                  
                  // Add to the products cell (after active products)
                  productCellDiv.appendChild(adCard);
                } catch (error) {
                  console.error("[renderProductMapTable] Error rendering inactive product:", error);
                  console.error("[renderProductMapTable] Problem product:", JSON.stringify(product));
                }
              })

// Sort products by position value (best to worst)
const sortByPosition = (a, b) => {
  const posA = parseFloat(a.finalPosition) || 999;
  const posB = parseFloat(b.finalPosition) || 999;
  return posA - posB;
};

// Sort active and inactive products separately
const sortedActiveProducts = [...activeProducts].sort(sortByPosition);
const sortedInactiveProducts = [...inactiveProducts].sort(sortByPosition);

// Clear the container first
chartProductsDiv.innerHTML = '';

// Add active products
sortedActiveProducts.forEach((product, index) => {
  // First, ensure this product has the enhanced data from globalRows
  let enhancedProduct = null;
  const globalRowsKeys = Object.keys(window.globalRows);
  for (const key of globalRowsKeys) {
    const globalProduct = window.globalRows[key];
    if (globalProduct && 
        globalProduct.title === product.title && 
        globalProduct.source === product.source &&
        globalProduct.q === product.q &&
        globalProduct.location_requested === product.location_requested &&
        globalProduct.device === product.device) {
      enhancedProduct = globalProduct;
      break;
    }
  }
  
  // Use enhanced product if found, otherwise use original
  const productToUse = enhancedProduct || product;
  
  const smallCard = document.createElement('div');
  smallCard.classList.add('small-ad-details');
  smallCard.setAttribute('data-product-index', index);
  
  // Get position and trend values from the enhanced product
  const posValue = productToUse.finalPosition || '-';
  const trendArrow = productToUse.arrow || '';
  const trendValue = productToUse.finalSlope || '';
  const badgeColor = productToUse.posBadgeBackground || 'gray';
  
  // Create the HTML for small card
  const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
  const title = productToUse.title || 'No title';
  
  smallCard.innerHTML = `
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
      <div class="small-ad-pos-value">${posValue}</div>
      <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
    </div>
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
    <div class="small-ad-title">${title}</div>
  `;
  
  // Store enhanced product reference for chart
  smallCard.productData = productToUse;
  smallCard.productArrayIndex = index; // Store the original index for chart reference
  
  chartProductsDiv.appendChild(smallCard);
});

// Add separator for inactive products if they exist
if (sortedInactiveProducts.length > 0) {
  const separator = document.createElement('div');
  separator.style.width = '100%';
  separator.style.padding = '8px';
  separator.style.textAlign = 'center';
  separator.style.fontSize = '12px';
  separator.style.color = '#666';
  separator.style.backgroundColor = '#f0f0f0';
  separator.style.borderTop = '1px solid #ddd';
  separator.style.borderBottom = '1px solid #ddd';
  separator.style.marginTop = '5px';
  separator.style.marginBottom = '5px';
  separator.innerHTML = '— Inactive Products —';
  chartProductsDiv.appendChild(separator);
  
  // Add inactive products
  sortedInactiveProducts.forEach((product, index) => {
    // Same enhanced product logic as above
    let enhancedProduct = null;
    const globalRowsKeys = Object.keys(window.globalRows);
    for (const key of globalRowsKeys) {
      const globalProduct = window.globalRows[key];
      if (globalProduct && 
          globalProduct.title === product.title && 
          globalProduct.source === product.source &&
          globalProduct.q === product.q &&
          globalProduct.location_requested === product.location_requested &&
          globalProduct.device === product.device) {
        enhancedProduct = globalProduct;
        break;
      }
    }
    
    const productToUse = enhancedProduct || product;
    
    const smallCard = document.createElement('div');
    smallCard.classList.add('small-ad-details');
    smallCard.classList.add('inactive');
    smallCard.setAttribute('data-product-index', sortedActiveProducts.length + index);
    
    const posValue = productToUse.finalPosition || '-';
    const trendArrow = productToUse.arrow || '';
    const trendValue = productToUse.finalSlope || '';
    const badgeColor = productToUse.posBadgeBackground || 'gray';
    
    const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
    const title = productToUse.title || 'No title';
    
    smallCard.innerHTML = `
      <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
        <div class="small-ad-pos-value">${posValue}</div>
        <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
      </div>
      <img class="small-ad-image" 
           src="${imageUrl}" 
           alt="${title}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
      <div class="small-ad-title">${title}</div>
    `;
    
    smallCard.productData = productToUse;
    smallCard.productArrayIndex = sortedActiveProducts.length + index;
    
    chartProductsDiv.appendChild(smallCard);
  });
}

// Now create the combined array for chart rendering
const allProductsForChart = [...sortedActiveProducts, ...sortedInactiveProducts];

              // Add direct click handlers to each product card
              productCellDiv.querySelectorAll('.ad-details').forEach(adCard => {
                const plaIndex = adCard.getAttribute('data-pla-index');
                
                adCard.addEventListener('click', function(e) {
                  // Prevent default and stop propagation
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  
                  console.log(`[DEBUG] Card clicked with plaIndex: ${plaIndex}`);
                  console.log(`[DEBUG] globalRows has this key?`, plaIndex in window.globalRows);
                  
                  // Get the product data
                  const rowData = window.globalRows[plaIndex];
                  if (!rowData) {
                    console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
                    return;
                  }
                  
                  console.log(`[DEBUG] Found data for product: ${rowData.title}`);
                  
                  // DEEP DEBUG OF HISTORICAL DATA
                  console.log(`[DEBUG] Historical data exists: ${Array.isArray(rowData.historical_data)}`);

                  console.log(`[DEBUG] Historical data length: ${rowData.historical_data?.length || 0}`);
                  
                  if (rowData.historical_data && rowData.historical_data.length > 0) {
                    // Log each historical entry in a structured way
                    console.log(`[DEBUG] === FULL HISTORICAL DATA (${rowData.historical_data.length} entries) ===`);
                    
                    // Sort by date first to ensure they're in chronological order
                    const sortedHistData = [...rowData.historical_data].sort((a, b) => {
                      if (!a.date || !a.date.value) return -1;
                      if (!b.date || !b.date.value) return 1;
                      return a.date.value.localeCompare(b.date.value);
                    });
                    
                    // Format the data as a table
                    console.table(sortedHistData.map(entry => ({
                      date: entry.date?.value || 'unknown',
                      avg_position: entry.avg_position,
                      visibility: entry.visibility,
                      top3: entry.top3_visibility,
                      top8: entry.top8_visibility,
                      top14: entry.top14_visibility,
                      top40: entry.top40_visibility
                    })));
                    
                    // Show date coverage
                    const dates = sortedHistData
                      .filter(entry => entry.date && entry.date.value)
                      .map(entry => entry.date.value);
                    
                    const uniqueDates = [...new Set(dates)];
                    console.log(`[DEBUG] Date coverage: ${uniqueDates.length} unique dates out of ${dates.length} entries`);
                    console.log(`[DEBUG] Date range: ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length-1]}`);
                    
                    // Check for any data anomalies
                    const missingPosition = sortedHistData.filter(entry => !entry.avg_position).length;
                    const missingVisibility = sortedHistData.filter(entry => !entry.visibility).length;
                    
                    console.log(`[DEBUG] Data quality check:
                      - Entries missing position: ${missingPosition}
                      - Entries missing visibility: ${missingVisibility}
                    `);
                  }
                  
                  // Create or get the panel container
                  let detailsPanel = document.getElementById('product-map-details-panel');
                  if (!detailsPanel) {
                    detailsPanel = document.createElement('div');
                    detailsPanel.id = 'product-map-details-panel';
                    detailsPanel.style.position = 'fixed';
                    detailsPanel.style.top = '40%';
                    detailsPanel.style.left = 'auto';
                    detailsPanel.style.right = '10px';
                    detailsPanel.style.transform = 'translateY(-50%)';
                    detailsPanel.style.zIndex = '1000';
                    detailsPanel.style.width = '1255px';
                    detailsPanel.style.maxWidth = '1255px';
                    detailsPanel.style.maxHeight = '80vh';
                    detailsPanel.style.overflow = 'auto';
                    detailsPanel.style.borderRadius = '8px';
                    detailsPanel.style.backgroundColor = '#fff';
                    detailsPanel.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.25)';
                    const contentWrapper = document.createElement('div');
                    contentWrapper.id = 'panel-content-wrapper';
                    contentWrapper.style.position = 'relative';
                    contentWrapper.style.width = '100%';
                    contentWrapper.style.height = '100%';
                    detailsPanel.appendChild(contentWrapper);
                    document.body.appendChild(detailsPanel);
                  }

                  // Adjust panel positioning based on fullscreen state
const isFullscreen = document.getElementById("productMapContainer").classList.contains("product-map-fullscreen");
if (isFullscreen) {
  detailsPanel.style.position = 'absolute';
  detailsPanel.style.top = '50%';
  detailsPanel.style.left = '50%';
  detailsPanel.style.transform = 'translate(-50%, -50%)';
  detailsPanel.style.right = 'auto';
  detailsPanel.style.zIndex = '10001'; // Ensure it's above the fullscreen container
} else {
  detailsPanel.style.position = 'fixed';
  detailsPanel.style.top = '40%';
  detailsPanel.style.left = 'auto';
  detailsPanel.style.right = '10px';
  detailsPanel.style.transform = 'translateY(-50%)';
}
                  
                  // Get the content wrapper
                  let contentWrapper = document.getElementById('panel-content-wrapper');
                  if (!contentWrapper) {
                    contentWrapper = document.createElement('div');
                    contentWrapper.id = 'panel-content-wrapper';
                    contentWrapper.style.position = 'relative';
                    contentWrapper.style.width = '100%';
                    contentWrapper.style.height = '100%';
                    detailsPanel.appendChild(contentWrapper);
                  }
                  
                  // Show the loading overlay
                  let loadingOverlay = document.getElementById('panel-loading-overlay');
                  if (!loadingOverlay) {
                    loadingOverlay = document.createElement('div');
                    loadingOverlay.id = 'panel-loading-overlay';
                    loadingOverlay.style.position = 'absolute';
                    loadingOverlay.style.top = '0';
                    loadingOverlay.style.left = '0';
                    loadingOverlay.style.width = '100%';
                    loadingOverlay.style.height = '100%';
                    loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    loadingOverlay.style.display = 'flex';
                    loadingOverlay.style.justifyContent = 'center';
                    loadingOverlay.style.alignItems = 'center';
                    loadingOverlay.style.zIndex = '2000';
                    loadingOverlay.innerHTML = '<div class="spinner"></div>';
                    detailsPanel.appendChild(loadingOverlay);
                  } else {
                    loadingOverlay.style.display = 'flex';
                  }
                  
                  // Make sure panel is visible
                  detailsPanel.style.display = 'block';
                  
                  // Important debug approach - make a copy of the DetailsPanel component
                  const originalDetailsPanel = window.DetailsPanel;
                  
                  // Create a debug version that tells us what's happening
                  window.DetailsPanel = function(props) {
                    // Log incoming props
                    console.log("[DEBUG-INJECTION] DetailsPanel received props:", {
                      has_rowData: !!props.rowData,
                      rowData_title: props.rowData?.title,
                      rowData_historical_length: props.rowData?.historical_data?.length,
                      start_date: props.start?.format('YYYY-MM-DD'),
                      end_date: props.end?.format('YYYY-MM-DD')
                    });
                    
                    // Check if the PLAChart component is available to debug
                    const originalPLAChart = window.PLAChart;
                    if (originalPLAChart) {
                      // Override PLAChart to debug what happens with the historical data
                      window.PLAChart = function(plaProps) {
                        console.log("[DEBUG-CHART] PLAChart received historical_data length:", 
                          plaProps.rowData?.historical_data?.length || 0);
                        
                        // Check prepareChartData function which might be generating synthetic data
                        const original_prepareChartData = originalPLAChart.prototype.prepareChartData;
                        if (typeof original_prepareChartData === 'function') {
                          originalPLAChart.prototype.prepareChartData = function(rowData, startDate, endDate) {
                            console.log("[DEBUG-CHART] prepareChartData called with:", {
                              has_rowData: !!rowData,
                              historical_length: rowData?.historical_data?.length || 0,
                              startDate: startDate?.format('YYYY-MM-DD'),
                              endDate: endDate?.format('YYYY-MM-DD')
                            });
                            
                            // Call original and log result
                            const result = original_prepareChartData.call(this, rowData, startDate, endDate);
                            console.log("[DEBUG-CHART] prepareChartData returned:", result.length, "data points");
                            return result;
                          };
                        }
                        
                        // Return the original component with our debug version
                        return originalPLAChart(plaProps);
                      };
                      
                      // Restore the original after a delay
                      setTimeout(() => {
                        window.PLAChart = originalPLAChart;
                      }, 2000);
                    }
                    
                    // Call the original component function (vanilla JS)
                    const element = originalDetailsPanel(props);
                    
                    // Log that we're returning a DOM element
                    console.log("[DEBUG-INJECTION] Returning DOM element:", element.tagName);
                    
                    return element;
                  };
                  
// Render with our debug version
                setTimeout(() => {
                  try {
                      // Get date range
                      // Get the original date range first
let dateRange = getDataRange(rowData);

// Override with a 7-day range specifically for product map page
if (dateRange && dateRange.end) {
  // Keep the same end date but set start to 7 days before
  dateRange = {
    end: dateRange.end.clone(),
    start: dateRange.end.clone().subtract(6, "days") // 7 days including end date
  };
}
                      console.log(`[DEBUG] Date range: start=${dateRange.start.format('YYYY-MM-DD')}, end=${dateRange.end.format('YYYY-MM-DD')}`);
                      
                      // Create a copy of rowData to pass to the component
                      // This ensures we're passing exactly what we have in window.globalRows
                      const rowDataCopy = { ...rowData };
                      
                      // Get the content wrapper again to ensure it exists
                      const contentWrapper = document.getElementById('panel-content-wrapper');
                      
                      // Render into the content wrapper instead of detailsPanel
                      contentWrapper.innerHTML = '';
                      
                      // Create the details panel using vanilla JS
                      const detailsPanelElement = window.DetailsPanel({
                        rowData: rowDataCopy,
                        start: dateRange.start,
                        end: dateRange.end,
                        activeTab: window.savedActiveTab || 1,
                        onClose: () => {
                          detailsPanel.style.display = 'none';
                          document.body.style.overflow = 'auto';
                        }
                      });
                      
                      // Append the DOM element directly
                      contentWrapper.appendChild(detailsPanelElement);
                      
                      // Hide the loading overlay
                      const loadingOverlay = document.getElementById('panel-loading-overlay');
                      if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                      }
                      
                      // Restore original component
                      window.DetailsPanel = originalDetailsPanel;
                    } catch (error) {
                      console.error("[DEBUG] Error rendering panel:", error);
                      detailsPanel.innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                          <h3>Error displaying product details</h3>
                          <p>${error.message}</p>
                          <pre style="text-align:left; max-height:200px; overflow:auto;">${error.stack}</pre>
                          <button onclick="document.getElementById('product-map-details-panel').style.display='none';">
                            Close
                          </button>
                        </div>
                      `;
                      
// Restore original component
                    window.DetailsPanel = originalDetailsPanel;
                  }
                }, 100);
                  
                  return false;
                }, true);

// Replace the broken mouseenter handler (starting around line 2026) with this:

adCard.addEventListener('mouseenter', function(e) {
  // Get the product data first
  const plaIndex = adCard.getAttribute('data-pla-index');
  const productData = window.globalRows[plaIndex];
  
  if (!productData) return; // Exit if no product data
  
  // Clear any existing timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
  
  // Add delay before showing popup
  hoverTimeout = setTimeout(() => {
    // Remove any existing popup
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
    
    // Get bucket data for this product
    if (googleAdsEnabled && bucketDataMap.size > 0) {
      const row = adCard.closest('tr');
      const deviceCell = row.querySelector('.device-icon');
      const deviceValue = deviceCell ? (deviceCell.alt || '').toUpperCase() : 'DESKTOP';
      
      // NOW we can use productData.title safely
      const lookupKey = `${productData.title.toLowerCase()}|${deviceValue}`;
      const productBucketData = bucketDataMap.get(lookupKey);
      
      if (productBucketData) {
        currentPopup = createMetricsPopup(productBucketData);
        if (currentPopup) {
          document.body.appendChild(currentPopup);
          
// Position popup near the product card
const rect = adCard.getBoundingClientRect();
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

// Popup dimensions
const popupWidth = 520;
const popupRect = currentPopup.getBoundingClientRect();
const popupHeight = popupRect.height || 600; // Fallback height

// Calculate center of the card
const cardCenterY = rect.top + (rect.height / 2);
const cardCenterX = rect.left + (rect.width / 2);

// Try to position popup to the right of the card, centered vertically
let left = rect.right + 10;
let top = cardCenterY + scrollTop - (popupHeight / 2);

// Check if popup would go off the right edge
if (left + popupWidth > window.innerWidth) {
  // Position to the left of the card instead
  left = rect.left - popupWidth - 10;
}

// Check if popup would go off the left edge
if (left < 10) {
  // Position above or below the card
  left = Math.max(10, cardCenterX + scrollLeft - (popupWidth / 2));
  if (cardCenterY < window.innerHeight / 2) {
    // Card is in top half, show popup below
    top = rect.bottom + scrollTop + 10;
  } else {
    // Card is in bottom half, show popup above
    top = rect.top + scrollTop - popupHeight - 10;
  }
}

// Ensure popup doesn't go off top or bottom
top = Math.max(10 + scrollTop, Math.min(top, window.innerHeight + scrollTop - popupHeight - 10));
          
          currentPopup.style.left = left + 'px';
          currentPopup.style.top = top + 'px';
          
          // Show popup with animation
          setTimeout(() => {
            currentPopup.classList.add('visible');
          }, 10);
        }
      }
    }
  }, 300); // 300ms delay
});

adCard.addEventListener('mouseleave', function(e) {
  // Clear timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  
  // Hide popup after a short delay
  setTimeout(() => {
    if (currentPopup && !currentPopup.matches(':hover') && !adCard.matches(':hover')) {
      currentPopup.classList.remove('visible');
      setTimeout(() => {
        if (currentPopup) {
          // Clean up any charts before removing popup
          if (currentPopup.campaignCharts) {
            currentPopup.campaignCharts.forEach(chart => {
              try { chart.destroy(); } catch(e) {}
            });
            currentPopup.campaignCharts = [];
          }
          currentPopup.remove();
          currentPopup = null;
        }
      }, 200);
    }
  }, 100);
});             
              });

// Add this right after adding products to window.globalRows 
// (after the matchingProducts.forEach loop)
console.log("[DEBUG] Product Map - globalRows keys:", Object.keys(window.globalRows || {}));
console.log("[DEBUG] Product Map - First few globalRows entries:", 
  Object.keys(window.globalRows || {}).slice(0, 3).map(key => ({
    key,
    title: window.globalRows[key]?.title,
    hasHistoricalData: Array.isArray(window.globalRows[key]?.historical_data)
  }))
);
              
              // After adding all products, add visibility badges
              setTimeout(() => {
                productCellDiv.querySelectorAll('.vis-badge').forEach(function(el) {
                  const parts = el.id.split('-');
                  const index = parts[2];
                  const row = window.globalRows[index];
                  if (!row) return;
                  
                  let visValue = parseFloat(row.visibilityBarValue) || 0;
                  if (visValue === 0) {
                    visValue = 0.1;
                  }
              
                  var options = {
                    series: [visValue],
                    chart: {
                      height: 80,
                      width: 80,
                      type: 'radialBar',
                      sparkline: { enabled: false },
                      offsetY: 0
                    },
                    plotOptions: {
                      radialBar: {
                        startAngle: -90,
                        endAngle: 90,
                        hollow: { size: '50%' },
                        track: { strokeDashArray: 8, margin:2 },
                        dataLabels: {
                          name: { show: false },
                          value: {
                            show: true,
                            offsetY: 0,
                            fontSize: '14px',
                            formatter: function(val){
                              return Math.round(val) + "%";
                            }
                          }
                        }
                      }
                    },
                    fill: {
                      type: 'gradient',
                      gradient: {
                        shade: 'dark',
                        shadeIntensity: 0.15,
                        inverseColors: false,
                        opacityFrom: 1,
                        opacityTo: 1,
                        stops: [0,50,100]
                      }
                    },
                    stroke: { lineCap:'butt', dashArray:4 },
                    labels: []
                  };
                  
                  // Check if ApexCharts is available
                  if (typeof ApexCharts !== 'undefined') {
                    var chart = new ApexCharts(el, options);
                    chart.render();
                  } else {
                    console.warn("[renderProductMapTable] ApexCharts not available for visibility badges");
                  }
                });
              }, 100);
            }
          } else {
            productCellDiv.textContent = "No product data available";
            console.warn("[renderProductMapTable] allRows data not available");
          }
          
          tr.appendChild(tdProducts);
          tbody.appendChild(tr);
        });
      });
    });
  
    container.querySelector("#productMapContainer").appendChild(table);
    console.log("[renderProductMapTable] Table rendering complete");
    
    // Add a resize observer to ensure product cells maintain proper width after DOM updates
    setTimeout(() => {
      const productCells = document.querySelectorAll('.product-cell');
      console.log(`[renderProductMapTable] Found ${productCells.length} product cells to observe`);
      
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            const width = entry.contentRect.width;
            console.log(`[renderProductMapTable] Product cell resized to ${width}px`);
            
            // If width is too small, force a minimum width
            if (width < 400) {
              entry.target.style.minWidth = "400px";
            }
          }
        });
        
        productCells.forEach(cell => {
          resizeObserver.observe(cell);
        });
      }
      
      // Setup click handlers for product cards (similar to main page)
      console.log("[DEBUG] Using custom click handlers for product map items");
    }, 200);

    // Add observer for full-screen mode changes
const productMapContainer = document.getElementById("productMapContainer");
if (productMapContainer) {
  // Create a mutation observer to monitor when the container enters or exits full-screen mode
  const observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isFullscreen = productMapContainer.classList.contains("product-map-fullscreen");
        
        // Adjust product cells in full-screen mode
        const productCells = document.querySelectorAll('.product-cell');
        productCells.forEach(cell => {
          if (isFullscreen) {
            // In full-screen mode, allow products to wrap and fill available space
            cell.style.flexWrap = "wrap";
            cell.style.justifyContent = "flex-start";
            
            // Adjust card widths to maintain consistent size
            const cards = cell.querySelectorAll('.ad-details');
            cards.forEach(card => {
              card.style.width = "150px";
              card.style.margin = "0 10px 10px 0";
            });
          } else {
            // In normal mode, revert to horizontal scrolling
            cell.style.flexWrap = "nowrap";
            cell.style.justifyContent = "";
            
            const cards = cell.querySelectorAll('.ad-details');
            cards.forEach(card => {
              card.style.width = "150px";
              card.style.margin = "";
            });
          }
        });
      }
    }
  });
  
  // Start observing the container for class changes
  observer.observe(productMapContainer, { attributes: true });
}
    // Add batch rendering function
    function renderPendingCharts() {
      const charts = window.pendingSegmentationCharts;
      if (!charts || charts.length === 0) return;
      
      console.log(`[ProductMap] Starting batch rendering of ${charts.length} charts`);
      
      let currentIndex = 0;
      const batchSize = 3; // Render 3 charts at a time
      
      function renderBatch() {
        const startTime = performance.now();
        const batch = charts.slice(currentIndex, currentIndex + batchSize);
        
        batch.forEach(chartInfo => {
          // Calculate segment counts from the rendered products
          const segmentCounts = [0, 0, 0, 0]; // [Top3, Top4-8, Top9-14, Below14]
          
          // Get the product elements that were rendered
          const productCards = chartInfo.productCellDiv.querySelectorAll('.ad-details');
          
          productCards.forEach(card => {
            // Skip inactive products
            if (card.classList.contains('inactive-product')) {
              return;
            }
            
            // Get the data-pla-index to look up the product data
            const plaIndex = card.getAttribute('data-pla-index');
            const product = window.globalRows[plaIndex];
            
            if (product) {
              const posValue = parseFloat(product.finalPosition);
              
              if (!isNaN(posValue) && posValue > 0) {
                if (posValue <= 3) {
                  segmentCounts[0]++; // Top3
                } else if (posValue <= 8) {
                  segmentCounts[1]++; // Top4-8
                } else if (posValue <= 14) {
                  segmentCounts[2]++; // Top9-14
                } else {
                  segmentCounts[3]++; // Below14
                }
              }
            }
          });
          
          // Create the segmentation chart
          requestAnimationFrame(() => {
            createSegmentationChart(
              chartInfo.containerId, 
              chartInfo.data, 
              chartInfo.term, 
              chartInfo.location, 
              chartInfo.device, 
              chartInfo.company, 
              chartInfo.activeCount, 
              chartInfo.inactiveCount, 
              segmentCounts
            );
            
            // Create pie chart for market share
            if (chartInfo.projectData && chartInfo.projectData.avgShare !== undefined) {
              createMarketSharePieChart(chartInfo.pieChartId, chartInfo.projectData.avgShare);
            }
          });
        });
        
        currentIndex += batchSize;
        console.log(`[ProductMap] Rendered batch ${Math.ceil(currentIndex/batchSize)} of ${Math.ceil(charts.length/batchSize)} in ${(performance.now() - startTime).toFixed(1)}ms`);
        
        // If more charts to render, continue after a short delay
        if (currentIndex < charts.length) {
          setTimeout(renderBatch, 50); // 50ms delay between batches
        } else {
          // Clear the pending charts array
          window.pendingSegmentationCharts = [];
          console.log(`[ProductMap] Finished rendering all charts`);
        }
      }
      
requestAnimationFrame(renderBatch);
    }

    // Call the batch renderer
    renderPendingCharts();
// Global cleanup for popups when scrolling or clicking elsewhere
document.addEventListener('scroll', function() {
  if (currentPopup) {
    currentPopup.classList.remove('visible');
    setTimeout(() => {
      if (currentPopup) {
        // Clean up any charts before removing popup
        if (currentPopup.campaignCharts) {
          currentPopup.campaignCharts.forEach(chart => {
            try { chart.destroy(); } catch(e) {}
          });
          currentPopup.campaignCharts = [];
        }
        currentPopup.remove();
        currentPopup = null;
      }
    }, 200);
  }
}, { passive: true });
  }

// Function to render average position chart using Chart.js instead of Recharts
function renderAvgPositionChart(container, products) {
  // Check if annotation plugin is available
  if (!Chart.defaults.plugins.annotation) {
    console.warn('Chart.js annotation plugin not loaded. Top8 area will not be displayed.');
  }
  
  // Clear previous content
  container.innerHTML = '';
  container.style.padding = '20px';
  
  // Store reference to track selected product
  container.selectedProductIndex = null;
  container.chartInstance = null;
  
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  
  // Determine date range from all products
  let allDates = new Set();
  let minDate = null;
  let maxDate = null;
  
  products.forEach(product => {
    if (product.historical_data && product.historical_data.length > 0) {
      product.historical_data.forEach(item => {
        if (item.date && item.date.value && item.avg_position) {
          const dateStr = item.date.value;
          allDates.add(dateStr);
          const date = moment(dateStr, 'YYYY-MM-DD');
          if (!minDate || date.isBefore(minDate)) minDate = date.clone();
          if (!maxDate || date.isAfter(maxDate)) maxDate = date.clone();
        }
      });
    }
  });
  
  if (!minDate || !maxDate) {
    container.innerHTML = '<div style="text-align: center; color: #999;">No position data available</div>';
    return;
  }
  
  // Create array of all dates in range
  const dateArray = [];
  let currentDate = minDate.clone();
  while (currentDate.isSameOrBefore(maxDate)) {
    dateArray.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }
  
  // Limit to last 30 days if range is too large
  if (dateArray.length > 30) {
    dateArray.splice(0, dateArray.length - 30);
  }
  
  // Create datasets for each product
  const datasets = [];
  
  products.forEach((product, index) => {
    // Position data
    const positionData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      return histItem?.avg_position ? parseFloat(histItem.avg_position) : null;
    });
    
    // Visibility data - use 0 for missing values instead of null
    const visibilityData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      // Return 0 if no visibility data exists, round to 1 decimal
      if (histItem?.visibility) {
        const visValue = parseFloat(histItem.visibility) * 100;
        return Math.round(visValue * 10) / 10; // Round to 1 decimal place
      }
      return 0;
    });
    
    // Generate a color for this product - grey for inactive
    let color;
    if (product.product_status === 'inactive') {
      color = '#999999'; // Grey for inactive products
    } else {
      const colors = [
        '#007aff', '#ff3b30', '#4cd964', '#ff9500', '#5856d6',
        '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6482', '#af52de'
      ];
      color = colors[index % colors.length];
    }
    
    // Add position line dataset
    datasets.push({
      label: product.title?.substring(0, 30) + (product.title?.length > 30 ? '...' : ''),
      data: positionData,
      borderColor: color,
      backgroundColor: color + '20',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      spanGaps: true,
      yAxisID: 'y',
      type: 'line',
      productIndex: index, // Store product index for reference
      dataType: 'position',
      segment: {
        borderDash: (ctx) => {
          const p0 = ctx.p0;
          const p1 = ctx.p1;
          if (p0.skip || p1.skip) {
            return [5, 5];
          }
          return undefined;
        }
      }
    });
    
    // Add visibility area dataset (initially hidden)
    datasets.push({
      label: product.title?.substring(0, 30) + ' (Visibility)',
      data: visibilityData,
      borderColor: color,
      backgroundColor: color + '30',
      borderWidth: 2,
      fill: true,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      spanGaps: false, // Don't span gaps for visibility
      yAxisID: 'y1',
      type: 'line',
      hidden: true, // Initially hidden
      productIndex: index, // Store product index for reference
      dataType: 'visibility'
    });
  });
  
  // Create the chart
  container.chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: dateArray,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        annotation: {
          annotations: {
            top8Area: {
              type: 'box',
              yScaleID: 'y',
              yMin: 1,
              yMax: 8,
              backgroundColor: 'rgba(144, 238, 144, 0.2)', // Light green with transparency
              borderColor: 'rgba(144, 238, 144, 0.4)',
              borderWidth: 1,
              borderDash: [5, 5],
              label: {
                content: 'TOP 8',
                enabled: true,
                position: 'start',
                color: '#4CAF50',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              if (context.parsed.y !== null) {
                if (context.dataset.dataType === 'visibility') {
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                } else {
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
                }
              }
              return context.dataset.label + ': No data';
            },
            filter: function(tooltipItem) {
              // Only show visible datasets in tooltip
              return !tooltipItem.dataset.hidden;
            }
          }
        }
      },
      scales: {
        x: {
          type: 'category',
          title: {
            display: true,
            text: 'Date',
            font: { size: 12 }
          },
          ticks: {
            maxRotation: 45,
            minRotation: 45,
            font: { size: 10 },
            autoSkip: true,
            maxTicksLimit: Math.max(5, Math.floor(container.offsetWidth / 50))
          },
          grid: {
            display: true,
            drawBorder: true,
            drawOnChartArea: true,
            drawTicks: true
          }
        },
        y: {
          type: 'linear',
          position: 'left',
          reverse: true,
          min: 1,
          max: 40,
          title: {
            display: true,
            text: 'Average Position',
            font: { size: 12 }
          },
          ticks: {
            font: { size: 10 },
            stepSize: 5
          }
        },
        y1: {
          type: 'linear',
          position: 'right',
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Visibility (%)',
            font: { size: 12 }
          },
          ticks: {
            font: { size: 10 },
            stepSize: 20,
            callback: function(value) {
              return value + '%';
            }
          },
          grid: {
            drawOnChartArea: false // Don't draw grid lines for right axis
          }
        }
      }
    }
  });
}

function closeDetailsPanel() {
  const panel = document.getElementById('product-map-details-panel');
  if (panel) {
    panel.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Remove selected class from all elements
  document.querySelectorAll('.ad-details.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Reset global variables if they exist
  if (typeof currentlyOpenPanel !== 'undefined') {
    currentlyOpenPanel = null;
  }
  if (typeof currentlySelectedIndex !== 'undefined') {
    currentlySelectedIndex = null;
  }
}

// Function to update chart line visibility when product is selected/deselected
function updateChartLineVisibility(chartContainer, selectedIndex) {
  const chart = chartContainer.chartInstance;
  if (!chart) return;
  
  // Update dataset visibility
  chart.data.datasets.forEach((dataset) => {
    if (dataset.dataType === 'position') {
      // Handle position line datasets
      if (selectedIndex === null) {
        // Show all position lines with normal styling
        dataset.borderWidth = 2;
        dataset.hidden = false;
      } else if (dataset.productIndex === selectedIndex) {
        // Make selected line bold and visible
        dataset.borderWidth = 4;
        dataset.hidden = false;
      } else {
        // Hide other position lines
        dataset.hidden = true;
      }
    } else if (dataset.dataType === 'visibility') {
      // Handle visibility area datasets
      if (selectedIndex === null) {
        // Hide all visibility areas when nothing is selected
        dataset.hidden = true;
      } else if (dataset.productIndex === selectedIndex) {
        // Show visibility area for selected product
        dataset.hidden = false;
      } else {
        // Hide other visibility areas
        dataset.hidden = true;
      }
    }
  });
  
  // Update the chart
  chart.update('none'); // 'none' for no animation
}

if (typeof window !== 'undefined') {
  window.renderProductMapTable = renderProductMapTable;
}
