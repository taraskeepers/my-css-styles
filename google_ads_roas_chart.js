// google_ads_roas_chart.js

// Initialize global variables for ROAS charts (moved from google_ads_buckets.js)
window.activeChartMetrics = {
  roas: true,
  aov: true,
  cpa: true,
  ctr: true,
  cvr: true
};
window.selectedBucketDateRangeDays = 30;

// Helper function to get the current project-specific table prefix (needed for renderROASHistoricCharts)
function getProjectTablePrefix() {
  const accountPrefix = window.currentAccount || 'acc1';
  const currentProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
  const prefix = `${accountPrefix}_pr${currentProjectNum}_`;
  console.log('[Buckets] Using table prefix:', prefix);
  return prefix;
}

// Add this new function after initializeBucketSwitcher (around line 85) - EXACT COPY
function setupBucketDateRangeSelector() {
  const chartsContainer = document.getElementById('roas_charts');
  if (!chartsContainer || !chartsContainer.parentElement) return;
  
  // Check if selector already exists
  let dateRangeContainer = document.getElementById('bucketDateRange');
  if (!dateRangeContainer) {
    // Create the container
    dateRangeContainer = document.createElement('div');
    dateRangeContainer.id = 'bucketDateRange';
    dateRangeContainer.className = 'bucket-date-selector-top';
    dateRangeContainer.style.cssText = `
      position: absolute;
      top: -45px;
      right: 0;
      z-index: 100;
      display: block;
    `;

    // Add this after creating the container to ensure proper alignment
    setTimeout(() => {
      const chartsRect = chartsContainer.getBoundingClientRect();
      const containerRect = dateRangeContainer.getBoundingClientRect();
      const parentRect = chartsContainer.parentElement.getBoundingClientRect();
      
      // Calculate the right offset to align with charts container
      const rightOffset = parentRect.right - chartsRect.right;
      dateRangeContainer.style.right = rightOffset + 'px';
    }, 100);
    
    // Insert before charts container
    chartsContainer.parentElement.style.position = 'relative';
    chartsContainer.parentElement.insertBefore(dateRangeContainer, chartsContainer);
  }
  
  // Create the selector HTML
  dateRangeContainer.innerHTML = `
    <div style="
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 14px;
      background: #fff;
      border: 1px solid #dadce0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 1px 2px 0 rgba(60,64,67,0.302);
    ">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
      </svg>
      <span id="bucketDateText" style="color: #3c4043; font-size: 14px; font-weight: 500;">Last 30 days</span>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </div>
    <div id="bucketDateDropdown" style="
      position: absolute;
      top: 100%;
      right: 0;
      margin-top: 8px;
      background: white;
      border: 1px solid #dadce0;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      display: none;
      z-index: 1000;
      min-width: 150px;
    ">
      <div class="bucket-date-option" data-days="30" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 30 days</div>
      <div class="bucket-date-option" data-days="60" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 60 days</div>
      <div class="bucket-date-option" data-days="90" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 90 days</div>
    </div>
  `;
  
  // Get elements
  const dateRange = dateRangeContainer.querySelector('div');
  const dropdown = document.getElementById('bucketDateDropdown');
  const dateText = document.getElementById('bucketDateText');
  
  if (!dateRange || !dropdown || !dateText) return;
  
  // Check if listeners are already attached
  if (dateRange.hasAttribute('data-listeners-attached')) {
    return;
  }
  
  // Mark that listeners are attached
  dateRange.setAttribute('data-listeners-attached', 'true');
  
  // Sync with global date range
  const days = window.selectedBucketDateRangeDays || 30;
  dateText.textContent = `Last ${days} days`;
  
  // Toggle dropdown
  dateRange.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  // Handle option selection
  dropdown.addEventListener('click', async function(e) {
    const option = e.target.closest('.bucket-date-option');
    if (option) {
      const days = parseInt(option.getAttribute('data-days'));
      window.selectedBucketDateRangeDays = days;
      
      // Update display text
      dateText.textContent = option.textContent;
      
      // Hide dropdown
      dropdown.style.display = 'none';
      
      // Show loading state
      const bucketsContainer = document.getElementById('buckets_products');
      const chartsContainer = document.getElementById('roas_charts');
      const originalBucketsHTML = bucketsContainer ? bucketsContainer.innerHTML : '';
      const originalChartsHTML = chartsContainer ? chartsContainer.innerHTML : '';

      if (bucketsContainer) {
        bucketsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Loading data...</p></div>';
      }
      if (chartsContainer) {
        chartsContainer.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Loading charts...</p></div>';
      }

      try {
        // Refresh the buckets view with new date range
        console.log('[Bucket Date Range] Changed to:', days, 'days');
        await loadAndRenderROASBuckets();
      } catch (error) {
        console.error('[Bucket Date Range] Error refreshing:', error);
        // Restore original content on error
        if (bucketsContainer) bucketsContainer.innerHTML = originalBucketsHTML;
        if (chartsContainer) chartsContainer.innerHTML = originalChartsHTML;
      }
    }
  });
  
  // Close dropdown when clicking outside
  if (!window.bucketDateClickHandler) {
    window.bucketDateClickHandler = function(e) {
      if (!dateRangeContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    document.addEventListener('click', window.bucketDateClickHandler);
  }
  
  // Add hover effects
  dropdown.querySelectorAll('.bucket-date-option').forEach(option => {
    option.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f1f3f4';
    });
    option.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });
  });
}

// EXACT COPY of renderROASHistoricCharts from google_ads_buckets.js
async function renderROASHistoricCharts(container, data) {
  // Clear container
  container.innerHTML = '';
  
  // Create main wrapper that contains everything
  const mainWrapper = document.createElement('div');
  mainWrapper.style.cssText = 'display: flex; flex-direction: column; height: 100%; gap: 15px;';
  
  // Load product performance data instead of bucket data
  const tablePrefix = getProjectTablePrefix();
  const performanceTableName = `${tablePrefix}googleSheets_productPerformance`;
  
  let performanceData;
  try {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(performanceTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.error('[renderROASHistoricCharts] No performance data found');
      return;
    }
    
    performanceData = result.data;
  } catch (error) {
    console.error('[renderROASHistoricCharts] Error loading performance data:', error);
    return;
  }
  
  // Use bucket date range selector value
  const today = new Date();
  const daysBack = window.selectedBucketDateRangeDays || 30;
  console.log(`[renderROASHistoricCharts] Using ${daysBack} days for charts`);
  
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - (daysBack - 1));
  const prevStartDate = new Date(today);
  prevStartDate.setDate(prevStartDate.getDate() - (daysBack * 2 - 1));
  const prevEndDate = new Date(today);
  prevEndDate.setDate(prevEndDate.getDate() - daysBack);
  
  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(String(value).replace(/[$,%]/g, '')) || 0;
  };

  // Filter data for current and previous periods
  const currentPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= startDate && rowDate <= today;
  });
  
  const previousPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= prevStartDate && rowDate <= prevEndDate;
  });
  
  // Calculate current totals from all devices
  const currentTotals = currentPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  // Calculate previous totals
  const prevTotals = previousPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  // Calculate metrics
  const currentROAS = currentTotals.cost > 0 ? currentTotals.convValue / currentTotals.cost : 0;
  const prevROAS = prevTotals.cost > 0 ? prevTotals.convValue / prevTotals.cost : 0;
  
  const currentAOV = currentTotals.conversions > 0 ? currentTotals.convValue / currentTotals.conversions : 0;
  const prevAOV = prevTotals.conversions > 0 ? prevTotals.convValue / prevTotals.conversions : 0;
  
  const currentCPA = currentTotals.conversions > 0 ? currentTotals.cost / currentTotals.conversions : 0;
  const prevCPA = prevTotals.conversions > 0 ? prevTotals.cost / prevTotals.conversions : 0;

  // Calculate device-specific metrics
  const deviceMetrics = {
    DESKTOP: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    MOBILE: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    TABLET: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 }
  };

  const devicePrevMetrics = {
    DESKTOP: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    MOBILE: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 },
    TABLET: { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 }
  };

  // Aggregate current period by device
  currentPeriodData.forEach(row => {
    const device = row.Device;
    if (device && deviceMetrics[device]) {
      deviceMetrics[device].cost += parseNumber(row.Cost);
      deviceMetrics[device].convValue += parseNumber(row['Conversion Value']);
      deviceMetrics[device].impressions += parseInt(row.Impressions) || 0;
      deviceMetrics[device].conversions += parseNumber(row.Conversions);
      deviceMetrics[device].clicks += parseInt(row.Clicks) || 0;
    }
  });
  
  // Aggregate previous period by device
  previousPeriodData.forEach(row => {
    const device = row.Device;
    if (device && devicePrevMetrics[device]) {
      devicePrevMetrics[device].cost += parseNumber(row.Cost);
      devicePrevMetrics[device].convValue += parseNumber(row['Conversion Value']);
      devicePrevMetrics[device].impressions += parseInt(row.Impressions) || 0;
      devicePrevMetrics[device].conversions += parseNumber(row.Conversions);
      devicePrevMetrics[device].clicks += parseInt(row.Clicks) || 0;
    }
  });

  // Calculate device-specific derived metrics
  Object.keys(deviceMetrics).forEach(device => {
    const current = deviceMetrics[device];
    const prev = devicePrevMetrics[device];
    
    current.roas = current.cost > 0 ? current.convValue / current.cost : 0;
    current.aov = current.conversions > 0 ? current.convValue / current.conversions : 0;
    current.cpa = current.conversions > 0 ? current.cost / current.conversions : 0;
    
    prev.roas = prev.cost > 0 ? prev.convValue / prev.cost : 0;
    prev.aov = prev.conversions > 0 ? prev.convValue / prev.conversions : 0;
    prev.cpa = prev.conversions > 0 ? prev.cost / prev.conversions : 0;
  });
  
  // Helper function to create metric item
  const createMetricItem = (label, current, previous, format) => {
    const change = current - previous;
    const trendClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
    const trendArrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';
    
    let formattedCurrent, formattedChange;
    switch (format) {
      case 'currency':
        formattedCurrent = '$' + current.toLocaleString();
        formattedChange = '$' + Math.abs(change).toLocaleString();
        break;
      case 'number':
        formattedCurrent = current.toLocaleString();
        formattedChange = Math.abs(change).toLocaleString();
        break;
      case 'decimal':
        formattedCurrent = current.toFixed(2) + 'x';
        formattedChange = Math.abs(change).toFixed(2) + 'x';
        break;
      default:
        formattedCurrent = current.toFixed(2);
        formattedChange = Math.abs(change).toFixed(2);
    }
    
    return `
      <div style="text-align: center; flex: 1;">
        <div style="font-size: 11px; color: #666; margin-bottom: 4px; font-weight: 500; text-transform: uppercase;">${label}</div>
        <div style="font-size: 20px; font-weight: 700; color: #333; margin-bottom: 2px;">${formattedCurrent}</div>
        <div class="${trendClass}" style="font-size: 11px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 3px;">
          <span>${trendArrow}</span>
          <span>${formattedChange}</span>
        </div>
      </div>
    `;
  };
  
  // Create metrics container with main and device rows
  const metricsContainer = document.createElement('div');
  metricsContainer.style.cssText = `
    width: 100%;
    background: linear-gradient(135deg, #f8f9fa, #e9ecef);
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    padding: 15px;
  `;

  // Main metrics row
  const metricsRow = document.createElement('div');
  metricsRow.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 12px;
    border-bottom: 1px solid #dee2e6;
    margin-bottom: 12px;
  `;
  
  metricsRow.innerHTML = `
    ${createMetricItem('ROAS', currentROAS, prevROAS, 'decimal')}
    ${createMetricItem('AOV', currentAOV, prevAOV, 'currency')}
    ${createMetricItem('CPA', currentCPA, prevCPA, 'currency')}
    ${createMetricItem('Impressions', currentTotals.impressions, prevTotals.impressions, 'number')}
    ${createMetricItem('Cost', currentTotals.cost, prevTotals.cost, 'currency')}
    ${createMetricItem('Revenue', currentTotals.convValue, prevTotals.convValue, 'currency')}
  `;

  metricsContainer.appendChild(metricsRow);

  // Add device rows
  const deviceRows = document.createElement('div');
  deviceRows.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  ['DESKTOP', 'MOBILE', 'TABLET'].forEach(device => {
    const deviceRow = document.createElement('div');
    deviceRow.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(255, 255, 255, 0.5);
      border-radius: 6px;
      padding: 8px 15px;
    `;
    
    const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
    const current = deviceMetrics[device];
    const prev = devicePrevMetrics[device];
    
    // Create smaller metric items
    const createSmallMetricItem = (value, prevValue, format) => {
      const change = value - prevValue;
      const trendClass = change > 0 ? 'trend-up' : change < 0 ? 'trend-down' : 'trend-neutral';
      const trendArrow = change > 0 ? '▲' : change < 0 ? '▼' : '—';
      
      let formattedValue;
      switch (format) {
        case 'currency':
          formattedValue = '$' + value.toLocaleString();
          break;
        case 'number':
          formattedValue = value.toLocaleString();
          break;
        case 'decimal':
          formattedValue = value.toFixed(2) + 'x';
          break;
        default:
          formattedValue = value.toFixed(2);
      }
      
      return `
        <div style="text-align: center; flex: 1;">
          <div style="font-size: 14px; font-weight: 600; color: #333;">${formattedValue}</div>
          <div class="${trendClass}" style="font-size: 9px; font-weight: 500; margin-top: 2px;">
            ${trendArrow} ${Math.abs(change).toFixed(format === 'currency' ? 0 : format === 'decimal' ? 2 : 0)}
          </div>
        </div>
      `;
    };
    
    deviceRow.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px; min-width: 100px;">
        <span style="font-size: 16px;">${deviceIcon}</span>
        <span style="font-size: 11px; font-weight: 600; color: #666;">${device}</span>
      </div>
      ${createSmallMetricItem(current.roas, prev.roas, 'decimal')}
      ${createSmallMetricItem(current.aov, prev.aov, 'currency')}
      ${createSmallMetricItem(current.cpa, prev.cpa, 'currency')}
      ${createSmallMetricItem(current.impressions, prev.impressions, 'number')}
      ${createSmallMetricItem(current.cost, prev.cost, 'currency')}
      ${createSmallMetricItem(current.convValue, prev.convValue, 'currency')}
    `;
    
    deviceRows.appendChild(deviceRow);
  });

  metricsContainer.appendChild(deviceRows);
  
  // Create chart wrapper
  const wrapper = document.createElement('div');
  wrapper.style.cssText = `
    flex: 1;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    position: relative;
  `;
  
  // Create right side toggle panel
  const togglePanel = document.createElement('div');
  togglePanel.style.cssText = `
    width: 140px;
    background: white;
    border-radius: 8px;
    padding: 15px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  togglePanel.innerHTML = `
    <h4 style="margin: 0 0 15px 0; font-size: 14px; color: #333;">Chart Metrics</h4>
    <div style="display: flex; flex-direction: column; gap: 10px;">
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="roas" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #4CAF50;">ROAS</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="aov" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #2196F3;">AOV</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="cpa" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #FF9800;">CPA</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="ctr" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #9C27B0;">CTR %</span>
      </label>
      <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
        <input type="checkbox" data-metric="cvr" checked style="cursor: pointer;">
        <span style="font-size: 12px; color: #00BCD4;">CVR %</span>
      </label>
    </div>
  `;
  
  // Create a horizontal wrapper for chart and toggle panel
  const chartAndToggleWrapper = document.createElement('div');
  chartAndToggleWrapper.style.cssText = 'display: flex; gap: 15px; flex: 1;';
  
  // Now append elements in the correct order
  chartAndToggleWrapper.appendChild(wrapper);
  chartAndToggleWrapper.appendChild(togglePanel);
  
  // Store active metrics
  window.activeChartMetrics = {
    roas: true,
    aov: true,
    cpa: true,
    ctr: true,
    cvr: true
  };
  
  // Process daily metrics data from performance data
  const dailyMetrics = {};
  
  // Initialize date map for selected period
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    dailyMetrics[dateStr] = {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      convValue: 0,
      roas: 0,
      aov: 0,
      cpa: 0,
      ctr: 0,
      cvr: 0
    };
  }
  
  // Aggregate metrics by date
  currentPeriodData.forEach(row => {
    const dateStr = row.Date;
    if (dateStr && dailyMetrics[dateStr]) {
      dailyMetrics[dateStr].impressions += parseInt(row.Impressions) || 0;
      dailyMetrics[dateStr].clicks += parseInt(row.Clicks) || 0;
      dailyMetrics[dateStr].cost += parseNumber(row.Cost);
      dailyMetrics[dateStr].conversions += parseNumber(row.Conversions);
      dailyMetrics[dateStr].convValue += parseNumber(row['Conversion Value']);
    }
  });
  
  // Calculate derived metrics for each day
  Object.keys(dailyMetrics).forEach(date => {
    const day = dailyMetrics[date];
    day.roas = day.cost > 0 ? day.convValue / day.cost : 0;
    day.aov = day.conversions > 0 ? day.convValue / day.conversions : 0;
    day.cpa = day.conversions > 0 ? day.cost / day.conversions : 0;
    day.ctr = day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0;
    day.cvr = day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0;
  });
  
  // Convert to arrays for Chart.js
  const dates = Object.keys(dailyMetrics).sort();
  
  // Create datasets for each metric
  const allDatasets = {
    roas: {
      label: 'ROAS',
      data: dates.map(date => dailyMetrics[date].roas),
      borderColor: '#4CAF50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      yAxisID: 'y-roas',
      tension: 0.4
    },
    aov: {
      label: 'AOV',
      data: dates.map(date => dailyMetrics[date].aov),
      borderColor: '#2196F3',
      backgroundColor: 'rgba(33, 150, 243, 0.1)',
      yAxisID: 'y-currency',
      tension: 0.4
    },
    cpa: {
      label: 'CPA',
      data: dates.map(date => dailyMetrics[date].cpa),
      borderColor: '#FF9800',
      backgroundColor: 'rgba(255, 152, 0, 0.1)',
      yAxisID: 'y-currency',
      tension: 0.4
    },
    ctr: {
      label: 'CTR %',
      data: dates.map(date => dailyMetrics[date].ctr),
      borderColor: '#9C27B0',
      backgroundColor: 'rgba(156, 39, 176, 0.1)',
      yAxisID: 'y-percentage',
      tension: 0.4
    },
    cvr: {
      label: 'CVR %',
      data: dates.map(date => dailyMetrics[date].cvr),
      borderColor: '#00BCD4',
      backgroundColor: 'rgba(0, 188, 212, 0.1)',
      yAxisID: 'y-percentage',
      tension: 0.4
    }
  };

  // Filter datasets based on active metrics
  const datasets = Object.entries(window.activeChartMetrics || {})
    .filter(([key, active]) => active)
    .map(([key]) => allDatasets[key])
    .filter(Boolean);

  // Create chart
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width: 100%; height: 100%;';
  wrapper.appendChild(canvas);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates.map(date => {
        const d = new Date(date);
        return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      }),
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          display: true,
          grid: {
            display: false
          }
        },
        'y-roas': {
          type: 'linear',
          display: true,
          position: 'left',
          title: {
            display: true,
            text: 'ROAS'
          },
          grid: {
            drawOnChartArea: false
          }
        },
        'y-currency': {
          type: 'linear',
          display: true,
          position: 'right',
          title: {
            display: true,
            text: 'Currency ($)'
          },
          grid: {
            drawOnChartArea: true
          }
        },
        'y-percentage': {
          type: 'linear',
          display: false,
          position: 'right',
          title: {
            display: true,
            text: 'Percentage (%)'
          }
        }
      },
      plugins: {
        title: {
          display: true,
          text: `Key Metrics Trend - Last ${daysBack} Days`
        },
        legend: {
          display: false  // Remove legend as requested
        },
        datalabels: {
          display: false
        }
      }
    }
  });
  
  // Append elements to main wrapper in correct order
  mainWrapper.appendChild(metricsContainer);
  mainWrapper.appendChild(chartAndToggleWrapper);
  
  // Finally append main wrapper to container
  container.appendChild(mainWrapper);
  
  // Add toggle event listeners
  togglePanel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const metric = this.getAttribute('data-metric');
      window.activeChartMetrics[metric] = this.checked;
      
      // Update chart with new dataset visibility
      const chartInstance = Chart.getChart(canvas);
      if (chartInstance) {
        const datasetIndex = ['roas', 'aov', 'cpa', 'ctr', 'cvr'].indexOf(metric);
        if (datasetIndex !== -1 && chartInstance.data.datasets[datasetIndex]) {
          chartInstance.data.datasets[datasetIndex].hidden = !this.checked;
          chartInstance.update();
        }
      }
    });
  });
  
  // Store reference to refresh the chart
  window.refreshROASChart = async () => {
    await renderROASHistoricCharts(container, data);
  };
}

// Function to create ROAS Charts container (moved from google_ads.js)
function createROASChartsContainer(parentElement) {
  const roasChartsContainer = document.createElement('div');
  roasChartsContainer.id = 'roas_charts';
  roasChartsContainer.className = 'google-ads-charts-container';
  roasChartsContainer.style.cssText = `
    width: 1195px;
    height: 400px;
    margin: 60px 0 20px 20px;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    border-radius: 12px;
    padding: 20px;
    display: none;
  `;
  parentElement.appendChild(roasChartsContainer);
}

// Export all functions globally
window.setupBucketDateRangeSelector = setupBucketDateRangeSelector;
window.renderROASHistoricCharts = renderROASHistoricCharts;
window.createROASChartsContainer = createROASChartsContainer;
window.getProjectTablePrefix = getProjectTablePrefix;
