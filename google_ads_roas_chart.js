// google_ads_roas_chart.js

// Initialize global variables for ROAS charts
window.activeChartMetrics = {
  roas: true,
  aov: true,
  cpa: true,
  ctr: true,
  cvr: true
};
window.selectedBucketDateRangeDays = 30;

// Function to setup the bucket date range selector
function setupBucketDateRangeSelector() {
  const chartsContainer = document.getElementById('roas_charts');
  if (!chartsContainer || !chartsContainer.parentElement) return;
  
  let dateRangeContainer = document.getElementById('bucketDateRange');
  if (!dateRangeContainer) {
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

    setTimeout(() => {
      const chartsRect = chartsContainer.getBoundingClientRect();
      const containerRect = dateRangeContainer.getBoundingClientRect();
      const parentRect = chartsContainer.parentElement.getBoundingClientRect();
      const rightOffset = parentRect.right - chartsRect.right;
      dateRangeContainer.style.right = rightOffset + 'px';
    }, 100);
    
    chartsContainer.parentElement.style.position = 'relative';
    chartsContainer.parentElement.insertBefore(dateRangeContainer, chartsContainer);
  }

  // Add the date range HTML and event handlers
  dateRangeContainer.innerHTML = `
    <div class="bucket-date-text">Last 30 days</div>
    <svg class="bucket-date-icon" width="16" height="16" viewBox="0 0 24 24" fill="#5f6368">
      <path d="M7 10l5 5 5-5z"/>
    </svg>
    <div class="bucket-date-dropdown" style="display: none;">
      <div class="bucket-date-option" data-days="30">Last 30 days</div>
      <div class="bucket-date-option" data-days="60">Last 60 days</div>
      <div class="bucket-date-option" data-days="90">Last 90 days</div>
    </div>
  `;

  const dateText = dateRangeContainer.querySelector('.bucket-date-text');
  const dropdown = dateRangeContainer.querySelector('.bucket-date-dropdown');
  
  dateRangeContainer.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  dropdown.addEventListener('click', async function(e) {
    const option = e.target.closest('.bucket-date-option');
    if (option) {
      const days = parseInt(option.getAttribute('data-days'));
      window.selectedBucketDateRangeDays = days;
      dateText.textContent = option.textContent;
      dropdown.style.display = 'none';

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
        console.log('[Bucket Date Range] Changed to:', days, 'days');
        await loadAndRenderROASBuckets();
      } catch (error) {
        console.error('[Bucket Date Range] Error refreshing:', error);
        if (bucketsContainer) bucketsContainer.innerHTML = originalBucketsHTML;
        if (chartsContainer) chartsContainer.innerHTML = originalChartsHTML;
      }
    }
  });
  
  if (!window.bucketDateClickHandler) {
    window.bucketDateClickHandler = function(e) {
      if (!dateRangeContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    document.addEventListener('click', window.bucketDateClickHandler);
  }
}

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

window.createROASChartsContainer = createROASChartsContainer;

// Main function to render ROAS historic charts
async function renderROASHistoricCharts(container, data) {
  container.innerHTML = '';
  
  const mainWrapper = document.createElement('div');
  mainWrapper.style.cssText = 'display: flex; flex-direction: column; height: 100%; gap: 15px;';
  
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

  const currentPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= startDate && rowDate <= today;
  });
  
  const previousPeriodData = performanceData.filter(row => {
    const rowDate = new Date(row.Date);
    return rowDate >= prevStartDate && rowDate <= prevEndDate;
  });
  
  const currentTotals = currentPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  const prevTotals = previousPeriodData.reduce((acc, row) => {
    acc.cost += parseNumber(row.Cost);
    acc.convValue += parseNumber(row['Conversion Value']);
    acc.impressions += parseInt(row.Impressions) || 0;
    acc.conversions += parseNumber(row.Conversions);
    acc.clicks += parseInt(row.Clicks) || 0;
    return acc;
  }, { cost: 0, convValue: 0, impressions: 0, conversions: 0, clicks: 0 });
  
  const currentROAS = currentTotals.cost > 0 ? currentTotals.convValue / currentTotals.cost : 0;
  const prevROAS = prevTotals.cost > 0 ? prevTotals.convValue / prevTotals.cost : 0;
  const currentAOV = currentTotals.conversions > 0 ? currentTotals.convValue / currentTotals.conversions : 0;
  const prevAOV = prevTotals.conversions > 0 ? prevTotals.convValue / prevTotals.conversions : 0;
  const currentCPA = currentTotals.conversions > 0 ? currentTotals.cost / currentTotals.conversions : 0;
  const prevCPA = prevTotals.conversions > 0 ? prevTotals.cost / prevTotals.conversions : 0;
  const currentCTR = currentTotals.impressions > 0 ? (currentTotals.clicks / currentTotals.impressions) * 100 : 0;
  const prevCTR = prevTotals.impressions > 0 ? (prevTotals.clicks / prevTotals.impressions) * 100 : 0;
  const currentCVR = currentTotals.clicks > 0 ? (currentTotals.conversions / currentTotals.clicks) * 100 : 0;
  const prevCVR = prevTotals.clicks > 0 ? (prevTotals.conversions / prevTotals.clicks) * 100 : 0;

  // Create metrics summary row
  const metricsRow = document.createElement('div');
  metricsRow.style.cssText = 'display: flex; justify-content: space-around; padding: 15px; background: #f8f9fa; border-radius: 8px;';
  metricsRow.innerHTML = `
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 700; color: #4CAF50;">${currentROAS.toFixed(2)}x</div>
      <div style="font-size: 11px; color: #666;">ROAS</div>
      <div style="font-size: 10px; color: ${currentROAS >= prevROAS ? '#4CAF50' : '#f44336'};">
        ${currentROAS >= prevROAS ? '↑' : '↓'} ${Math.abs(((currentROAS - prevROAS) / prevROAS * 100)).toFixed(1)}%
      </div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 700; color: #2196F3;">$${currentAOV.toFixed(0)}</div>
      <div style="font-size: 11px; color: #666;">AOV</div>
      <div style="font-size: 10px; color: ${currentAOV >= prevAOV ? '#4CAF50' : '#f44336'};">
        ${currentAOV >= prevAOV ? '↑' : '↓'} ${Math.abs(((currentAOV - prevAOV) / prevAOV * 100)).toFixed(1)}%
      </div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 700; color: #FF9800;">$${currentCPA.toFixed(0)}</div>
      <div style="font-size: 11px; color: #666;">CPA</div>
      <div style="font-size: 10px; color: ${currentCPA <= prevCPA ? '#4CAF50' : '#f44336'};">
        ${currentCPA <= prevCPA ? '↓' : '↑'} ${Math.abs(((currentCPA - prevCPA) / prevCPA * 100)).toFixed(1)}%
      </div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 700; color: #9C27B0;">${currentCTR.toFixed(2)}%</div>
      <div style="font-size: 11px; color: #666;">CTR</div>
      <div style="font-size: 10px; color: ${currentCTR >= prevCTR ? '#4CAF50' : '#f44336'};">
        ${currentCTR >= prevCTR ? '↑' : '↓'} ${Math.abs(((currentCTR - prevCTR) / prevCTR * 100)).toFixed(1)}%
      </div>
    </div>
    <div style="text-align: center;">
      <div style="font-size: 24px; font-weight: 700; color: #00BCD4;">${currentCVR.toFixed(2)}%</div>
      <div style="font-size: 11px; color: #666;">CVR</div>
      <div style="font-size: 10px; color: ${currentCVR >= prevCVR ? '#4CAF50' : '#f44336'};">
        ${currentCVR >= prevCVR ? '↑' : '↓'} ${Math.abs(((currentCVR - prevCVR) / prevCVR * 100)).toFixed(1)}%
      </div>
    </div>
  `;
  mainWrapper.appendChild(metricsRow);

  // Create chart wrapper and toggle panel
  const chartAndToggleWrapper = document.createElement('div');
  chartAndToggleWrapper.style.cssText = 'display: flex; gap: 15px; flex: 1;';
  
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'flex: 1; position: relative; min-height: 300px;';
  
  const togglePanel = document.createElement('div');
  togglePanel.style.cssText = 'width: 100px; padding: 10px; background: #f8f9fa; border-radius: 8px; align-self: flex-start;';
  togglePanel.innerHTML = `
    <div style="font-size: 12px; font-weight: 600; margin-bottom: 10px; color: #333;">Show/Hide</div>
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
  
  chartAndToggleWrapper.appendChild(wrapper);
  chartAndToggleWrapper.appendChild(togglePanel);
  
  // Process daily metrics data
  const dailyMetrics = {};
  
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
  
  // Calculate derived metrics
  Object.keys(dailyMetrics).forEach(date => {
    const day = dailyMetrics[date];
    day.roas = day.cost > 0 ? day.convValue / day.cost : 0;
    day.aov = day.conversions > 0 ? day.convValue / day.conversions : 0;
    day.cpa = day.conversions > 0 ? day.cost / day.conversions : 0;
    day.ctr = day.impressions > 0 ? (day.clicks / day.impressions) * 100 : 0;
    day.cvr = day.clicks > 0 ? (day.conversions / day.clicks) * 100 : 0;
  });
  
  const dates = Object.keys(dailyMetrics).sort();
  
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

  const datasets = Object.entries(window.activeChartMetrics || {})
    .filter(([key, active]) => active)
    .map(([key]) => allDatasets[key])
    .filter(Boolean);

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'width: 100%; height: 100%;';
  wrapper.appendChild(canvas);

  new Chart(canvas, {
    type: 'line',
    data: {
      labels: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
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
          display: true,
          position: 'top'
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              if (context.dataset.yAxisID === 'y-currency') {
                label += '$' + context.parsed.y.toFixed(2);
              } else if (context.dataset.yAxisID === 'y-percentage') {
                label += context.parsed.y.toFixed(2) + '%';
              } else {
                label += context.parsed.y.toFixed(2) + 'x';
              }
              return label;
            }
          }
        }
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
          ticks: {
            callback: function(value) {
              return value.toFixed(1) + 'x';
            }
          }
        },
        'y-currency': {
          type: 'linear',
          display: false,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value) {
              return '$' + value.toFixed(0);
            }
          }
        },
        'y-percentage': {
          type: 'linear',
          display: false,
          position: 'right',
          grid: {
            drawOnChartArea: false
          },
          ticks: {
            callback: function(value) {
              return value.toFixed(1) + '%';
            }
          }
        }
      }
    }
  });

  mainWrapper.appendChild(chartAndToggleWrapper);
  container.appendChild(mainWrapper);
  
  // Add toggle event listeners
  togglePanel.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', function() {
      const metric = this.getAttribute('data-metric');
      window.activeChartMetrics[metric] = this.checked;
      
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
  
  window.refreshROASChart = async () => {
    await renderROASHistoricCharts(container, data);
  };
}

// Export functions
window.setupBucketDateRangeSelector = setupBucketDateRangeSelector;
window.renderROASHistoricCharts = renderROASHistoricCharts;
