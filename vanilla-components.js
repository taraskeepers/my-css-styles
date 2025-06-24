/**********************************************
 * vanilla-components.js
 * Vanilla JavaScript replacement for react-components.js
 * No React, No Recharts - pure JavaScript with Chart.js
 **********************************************/

// Inject styles for vanilla components
(function() {
  if (document.getElementById('vanilla-components-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'vanilla-components-styles';
  style.textContent = `
    /* Details Panel Styling */
    .pla-details-panel {
      background: white;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 20px;
    }

    .pla-details-topbar {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }

    .pla-details-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }

    .tab-buttons {
      display: inline-flex;
      gap: 10px;
    }

    .tab-btn {
      padding: 8px 16px;
      border: 1px solid #ddd;
      background: white;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 14px;
    }

    .tab-btn.active {
      background: #007aff;
      color: white;
      border-color: #007aff;
    }

    .tab-btn:hover:not(.active) {
      background: #f5f5f5;
    }

    .tab-content {
      display: flex;
      gap: 20px;
    }

.pla-details-column {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  min-height: 350px;  /* Add minimum height */
}

.pla-details-left {
  flex: 0 0 600px;
}

.pla-details-middle {
  flex: 0 0 250px;  /* Reduced from 300px */
}

.pla-details-main-metrics {
  min-width: 200px;  /* Reduced from 250px */
}

    .pla-details-settings {
      min-width: 200px;
    }

.metric-row {
  margin-bottom: 15px;  /* Reduced from 20px */
  padding-bottom: 12px;  /* Reduced from 15px */
  border-bottom: 1px solid #eee;
}

    .metric-row:last-child {
      border-bottom: none;
    }

.metric-title {
  font-size: 13px;  /* Reduced from 14px */
  color: #666;
  margin-bottom: 5px;  /* Reduced from 8px */
  font-weight: 500;
}

.metric-value {
  font-size: 24px;  /* Reduced from 28px */
  font-weight: 600;
  color: #333;
  display: block;  /* Changed from flex to block */
}

.metric-trend {
  font-size: 14px;  /* New style for trend values */
  font-weight: 500;
  margin-top: 3px;
  display: block;
}

    .metric-value span {
      font-size: 16px;
      font-weight: 500;
    }

.volatility-status {
  font-size: 13px;  /* Reduced from 14px */
  margin-top: 3px;  /* Reduced from 5px */
  font-weight: 500;
}

    /* Toggle Switch Styles */
    .toggle-switch-container {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
      justify-content: space-between;
      padding: 5px 0;
    }

    .toggle-label {
      font-size: 13px;
      color: #555;
      margin-right: 10px;
      flex: 1;
    }

    .toggle-switch {
      position: relative;
      width: 44px;
      height: 24px;
      flex-shrink: 0;
    }

    .toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .3s;
      border-radius: 24px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s;
      border-radius: 50%;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    }

    input:checked + .slider {
      background-color: #007aff;
    }

    input:checked + .slider:before {
      transform: translateX(20px);
    }

    /* Close button styling */
    .pla-details-close-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background-color 0.2s;
    }

    .pla-details-close-btn:hover {
      background-color: #f0f0f0;
    }

    /* Chart container styling */
    .pla-details-left canvas,
    .pla-details-middle canvas {
      background: white;
      border-radius: 4px;
      padding: 10px;
    }
    .tab-btn:active,
.tab-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(0, 122, 255, 0.3);
}

.tab-btn.active:active,
.tab-btn.active:focus {
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}
  `;
  document.head.appendChild(style);
})();

// Make sure Chart.js is globally available
if (window.Chart && window.ChartDataLabels) {
  Chart.register(window.ChartDataLabels);
}

/** 
 * Vanilla JavaScript replacement for ToggleSwitch
 */
function ToggleSwitch({ id, checked, onChange, label }) {
  const container = document.createElement('div');
  container.className = 'toggle-switch-container';
  container.innerHTML = `
    <span class="toggle-label">${label}</span>
    <div class="toggle-switch">
      <input type="checkbox" id="${id}" ${checked ? 'checked' : ''} />
      <label for="${id}" class="slider"></label>
    </div>
  `;
  
  const input = container.querySelector('input');
  input.addEventListener('change', onChange);
  
  return container;
}

/**
 * Vanilla JavaScript replacement for DetailsPanel
 */
function DetailsPanel(props) {
  const { rowData, start, end, activeTab = 1, onClose } = props;
  
  const container = document.createElement('div');
  container.className = 'pla-details-panel';
  container.innerHTML = `
    <div class="pla-details-topbar" style="position: relative; display: flex; align-items: center;">
      <div class="pla-details-title" style="margin-right: 20px;">Product Details</div>
      <div class="tab-buttons" style="flex: 1; text-align: left;">
        <button class="tab-btn ${activeTab === 1 ? 'active' : ''}" data-tab="1">Position & Visibility Trends</button>
        <button class="tab-btn ${activeTab === 2 ? 'active' : ''}" data-tab="2">Prices & Reviews</button>
      </div>
      <button class="pla-details-close-btn" style="position: absolute; right: 10px; top: 10px; background: none; border: none; font-size: 24px; cursor: pointer;">&times;</button>
    </div>
    <div class="tabs-container"></div>
  `;
  
  const tabsContainer = container.querySelector('.tabs-container');
  const closeBtn = container.querySelector('.pla-details-close-btn');
  
  // Close button handler
  closeBtn.addEventListener('click', () => {
    if (typeof onClose === 'function') {
      onClose();
    } else {
      const panel = document.getElementById('product-map-details-panel');
      if (panel) panel.style.display = 'none';
    }
  });
  
  // Tab switching
  const tabButtons = container.querySelectorAll('.tab-btn');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const tabNum = parseInt(btn.dataset.tab);
      window.savedActiveTab = tabNum;
      renderTab(tabNum);
    });
  });
  
  function renderTab(tabNum) {
    tabsContainer.innerHTML = '';
    
if (tabNum === 1) {
  // Position & Visibility Trends tab
  tabsContainer.innerHTML = `
    <div class="tab-content" style="display: flex; gap: 12px; min-height: 350px;">
      <div class="pla-details-column pla-details-left">
        <div id="pla-chart-${Date.now()}" style="width: 600px; height: 300px;"></div>
      </div>
      <div class="pla-details-column pla-details-middle">
        <div id="apple-chart-${Date.now()}" style="width: 100%; height: 300px;"></div>
      </div>
      <div class="pla-details-column pla-details-main-metrics">
        <div id="main-metrics-${Date.now()}"></div>
      </div>
      <div class="pla-details-column pla-details-settings">
        <h3 style="margin-top: 0; margin-bottom: 15px; font-size: 16px;">Settings</h3>
        <div id="toggles-${Date.now()}"></div>
      </div>
    </div>
  `;
  
  // Render charts and components
  setTimeout(() => {
    const plaChartEl = tabsContainer.querySelector('[id^="pla-chart-"]');
    const appleChartEl = tabsContainer.querySelector('[id^="apple-chart-"]');
    const metricsEl = tabsContainer.querySelector('[id^="main-metrics-"]');
    const togglesEl = tabsContainer.querySelector('[id^="toggles-"]');
    
    if (plaChartEl) {
      const plaChart = PLAChart({ rowData, start, end });
      plaChartEl.appendChild(plaChart);
    }
    
    if (appleChartEl) {
      const appleChart = AppleBarChart({ rowData, start, end });
      appleChartEl.appendChild(appleChart);
    }
    
    if (metricsEl) {
      const metrics = MainMetrics({ rowData, start, end });
      metricsEl.appendChild(metrics);
    }
    
    if (togglesEl) {
      // Create toggles
      const toggleConfigs = [
        { id: 'toggle-pos3', label: '3d pos trend', checked: false },
        { id: 'toggle-pos7', label: '7d pos trend', checked: false },
        { id: 'toggle-pos30', label: '30d pos trend', checked: false },
        { id: 'toggle-vis3', label: '3d visib trend', checked: false },
        { id: 'toggle-vis7', label: '7d visib trend', checked: false },
        { id: 'toggle-vis30', label: '30d visib trend', checked: false }
      ];
      
      toggleConfigs.forEach(config => {
        const toggle = ToggleSwitch({
          id: config.id,
          label: config.label,
          checked: config.checked,
          onChange: (e) => {
            console.log(`Toggle ${config.id} changed to:`, e.target.checked);
            // TODO: Implement toggle functionality
          }
        });
        togglesEl.appendChild(toggle);
      });
    }
  }, 0);
} else if (tabNum === 2) {
      // Prices & Reviews tab
      tabsContainer.innerHTML = `
        <div class="tab-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div class="price-chart-container">
            <h3>Price Chart</h3>
            <div id="price-chart-${Date.now()}" style="width: 100%; height: 300px;"></div>
          </div>
          <div class="rating-chart-container">
            <h3>Rating Chart</h3>
            <div id="rating-chart-${Date.now()}" style="width: 100%; height: 300px;"></div>
          </div>
          <div class="rating-metrics-container pla-details-main-metrics">
            <h3>Rating Metrics</h3>
            <div id="rating-metrics-${Date.now()}"></div>
          </div>
          <div class="active-extensions-container pla-details-main-metrics">
            <h3>Active Extensions</h3>
            <div id="extensions-${Date.now()}"></div>
          </div>
        </div>
      `;
      
      setTimeout(() => {
        const priceChartEl = tabsContainer.querySelector('[id^="price-chart-"]');
        const ratingChartEl = tabsContainer.querySelector('[id^="rating-chart-"]');
        const ratingMetricsEl = tabsContainer.querySelector('[id^="rating-metrics-"]');
        const extensionsEl = tabsContainer.querySelector('[id^="extensions-"]');
        
        if (priceChartEl) {
          const priceChart = PriceChart({ rowData, startDate: start, endDate: end });
          priceChartEl.appendChild(priceChart);
        }
        
        if (ratingChartEl) {
          const ratingChart = RatingChart({ rowData, startDate: start, endDate: end });
          ratingChartEl.appendChild(ratingChart);
        }
        
        if (ratingMetricsEl) {
          const ratingMetrics = RatingMetrics({ rowData, startDate: start, endDate: end });
          ratingMetricsEl.appendChild(ratingMetrics);
        }
        
        if (extensionsEl) {
          const extensions = ActiveExtensions({ rowData });
          extensionsEl.appendChild(extensions);
        }
      }, 0);
    }
  }
  
  // Initial render
  setTimeout(() => renderTab(activeTab), 0);
  
  return container;
}

/**
 * Vanilla JavaScript PLAChart using Chart.js
 */
function PLAChart(props) {
  const { rowData, start, end } = props;
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  setTimeout(() => {
    if (!rowData || !rowData.historical_data) return;
    
    // Prepare data
    const labels = [];
    const positionData = [];
    const visibilityData = [];
    
    let currentDate = moment(start);
    const endDate = moment(end);
    const histMap = {};
    
    // Create map of historical data
    rowData.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        histMap[item.date.value] = item;
      }
    });
    
    // Generate data points
    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      labels.push(currentDate.format('MM/DD'));
      
      const histItem = histMap[dateStr];
      if (histItem) {
        positionData.push(histItem.avg_position ? parseFloat(histItem.avg_position) : null);
        visibilityData.push(histItem.visibility ? parseFloat(histItem.visibility) * 100 : null);
      } else {
        positionData.push(null);
        visibilityData.push(null);
      }
      
      currentDate.add(1, 'day');
    }
    
    // Create Chart.js chart
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Position',
            data: positionData,
            borderColor: '#007aff',
            backgroundColor: 'transparent',
            yAxisID: 'y',
            tension: 0.3
          },
          {
            label: 'Visibility %',
            data: visibilityData,
            borderColor: '#4cd964',
            backgroundColor: 'rgba(76, 217, 100, 0.1)',
            yAxisID: 'y1',
            tension: 0.3,
            fill: true
          }
        ]
      },
      options: {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    annotation: {
      annotations: {
        topEight: {
          type: 'box',
          yScaleID: 'y',
          yMin: 1,
          yMax: 8,
          backgroundColor: 'rgba(144, 238, 144, 0.1)',
          borderColor: 'rgba(144, 238, 144, 0.3)',
          borderWidth: 1,
          label: {
            content: 'TOP 8',
            enabled: true,
            position: 'start'
          }
        }
      }
    },
    datalabels: {
      display: function(context) {
        // Only show labels for position dataset
        return context.datasetIndex === 0 && context.dataset.data[context.dataIndex] !== null;
      },
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#007aff',
      borderRadius: 4,
      borderWidth: 1,
      color: '#007aff',
      font: {
        size: 11,
        weight: 'bold'
      },
      padding: 4,
      anchor: 'end',
      align: 'top',
      offset: 5,
      formatter: function(value) {
        return value.toFixed(1);
      }
    }
  },
  scales: {
    x: {
      display: true,
      title: { display: true, text: 'Date' },
      ticks: {
        maxRotation: 45,
        minRotation: 45
      }
    },
    y: {
      type: 'linear',
      display: true,
      position: 'left',
      reverse: true,
      min: 1,
      max: 40,
      title: { display: true, text: 'Position' }
    },
    y1: {
      type: 'linear',
      display: true,
      position: 'right',
      min: 0,
      max: 100,
      title: { display: true, text: 'Visibility %' },
      grid: { drawOnChartArea: false }
    }
  }
}
    });
  }, 100);
  
  return container;
}

/**
 * Vanilla JavaScript AppleBarChart using Chart.js
 */
function AppleBarChart(props) {
  const { rowData, start, end } = props;
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  setTimeout(() => {
    if (!rowData || !rowData.historical_data) return;
    
    // Calculate date ranges
    const dayCount = end.diff(start, "days") + 1;
    const prevEnd = start.clone().subtract(1, "days");
    const prevStart = prevEnd.clone().subtract(dayCount - 1, "days");
    
    const allData = rowData.historical_data || [];
    
    // Filter current window
    const currentFiltered = allData.filter(item => {
      if (!item.date || !item.date.value) return false;
      const d = moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(start, end, "day", "[]");
    });
    
    // Filter previous window
    const prevFiltered = allData.filter(item => {
      if (!item.date || !item.date.value) return false;
      const d = moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(prevStart, prevEnd, "day", "[]");
    });
    
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
    
    // Calculate averages
    const currTop3 = avg(currentFiltered, "top3_visibility", 100);
    const currTop8 = avg(currentFiltered, "top8_visibility", 100);
    const currTop14 = avg(currentFiltered, "top14_visibility", 100);
    const currTop40 = avg(currentFiltered, "top40_visibility", 100) || avg(currentFiltered, "market_share", 100);
    
    const prevTop3 = avg(prevFiltered, "top3_visibility", 100);
    const prevTop8 = avg(prevFiltered, "top8_visibility", 100);
    const prevTop14 = avg(prevFiltered, "top14_visibility", 100);
    const prevTop40 = avg(prevFiltered, "top40_visibility", 100) || avg(prevFiltered, "market_share", 100);
    
    // Prepare data
    const chartData = [
      { label: "Top3", current: currTop3, previous: prevTop3 },
      { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
      { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
      { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
    ];
    
    // Create horizontal bar chart
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: chartData.map(d => d.label),
        datasets: [
          {
            label: 'Current',
            data: chartData.map(d => d.current),
            backgroundColor: '#007aff',
            borderRadius: 4
          },
          {
            label: 'Previous',
            type: 'line',
            data: chartData.map(d => d.previous),
            borderColor: 'rgba(255,0,0,1)',
            backgroundColor: 'rgba(255,0,0,0.2)',
            fill: true,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options: {
        indexAxis: 'y', // This makes it horizontal
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
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  borderColor: function(ctx) {
    const row = chartData[ctx.dataIndex];
    const diff = row.current - row.previous;
    if (diff > 0) return 'green';
    if (diff < 0) return 'red';
    return '#666';
  },
  borderRadius: 4,
  borderWidth: 1,
  padding: { top: 2, bottom: 2, left: 6, right: 6 },
  formatter: (value, context) => {
    const row = chartData[context.dataIndex];
    const mainLabel = `${row.current.toFixed(1)}%`;
    const diff = row.current - row.previous;
    const absDiff = Math.abs(diff).toFixed(1);
    const arrow = diff > 0 ? '▲' : diff < 0 ? '▼' : '±';
    return [mainLabel, `${arrow}${absDiff}%`];
  },
  color: ctx => {
    const row = chartData[ctx.dataIndex];
    const diff = row.current - row.previous;
    if (diff > 0) return 'green';
    if (diff < 0) return 'red';
    return '#444';
  },
  anchor: 'end',
  align: 'end',
  offset: 8,
  font: { size: 11 }
}
        },
        scales: {
          x: { 
            display: false, 
            min: 0, 
            max: Math.max(...chartData.map(d => Math.max(d.current, d.previous))) + 10
          },
          y: { 
            display: true, 
            grid: { display: false }, 
            ticks: { font: { size: 14 } }
          }
        }
      }
    });
  }, 100);
  
  return container;
}

/**
 * Vanilla JavaScript MainMetrics
 */
function MainMetrics(props) {
  const { rowData } = props;
  const container = document.createElement('div');
  
  if (!rowData || !rowData.historical_data) {
    container.innerHTML = '<div>No data available</div>';
    return container;
  }
  
  // Calculate metrics
  const historical = rowData.historical_data;
  const positions = historical.filter(h => h.avg_position).map(h => parseFloat(h.avg_position));
  const visibilities = historical.filter(h => h.visibility).map(h => parseFloat(h.visibility));
  
  const avgPosition = positions.length ? positions.reduce((a,b) => a+b) / positions.length : 0;
  const avgVisibility = visibilities.length ? visibilities.reduce((a,b) => a+b) / visibilities.length : 0;
  
  // Calculate position change
  const positionChange = positions.length >= 2 ? positions[positions.length-1] - positions[0] : 0;
  const visibilityChange = visibilities.length >= 2 ? visibilities[visibilities.length-1] - visibilities[0] : 0;
  
  // Calculate volatility
  let volatility = 0;
  if (positions.length > 1) {
    const mean = avgPosition;
    const variance = positions.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / positions.length;
    volatility = Math.sqrt(variance);
  }
  
  // Get volatility status
  let volatilityStatus = 'Very Stable';
  let volatilityColor = '#4cd964';
  if (volatility > 10) {
    volatilityStatus = 'Volatile';
    volatilityColor = '#ff3b30';
  } else if (volatility > 5) {
    volatilityStatus = 'Moderate';
    volatilityColor = '#ff9500';
  } else if (volatility > 2) {
    volatilityStatus = 'Stable';
    volatilityColor = '#007aff';
  }
  
  const posArrow = positionChange < 0 ? '▲' : positionChange > 0 ? '▼' : '';
  const visArrow = visibilityChange > 0 ? '▲' : visibilityChange < 0 ? '▼' : '';
  
container.innerHTML = `
  <div class="metric-row">
    <div class="metric-title">Average Position</div>
    <div class="metric-value">${avgPosition.toFixed(2)}</div>
    <div class="metric-trend" style="color: ${positionChange < 0 ? 'green' : positionChange > 0 ? 'red' : '#444'};">
      ${posArrow} ${Math.abs(positionChange).toFixed(2)}
    </div>
  </div>
  <div class="metric-row">
    <div class="metric-title">Average Visibility</div>
    <div class="metric-value">${(avgVisibility * 100).toFixed(2)}%</div>
    <div class="metric-trend" style="color: ${visibilityChange > 0 ? 'green' : visibilityChange < 0 ? 'red' : '#444'};">
      ${visArrow} ${Math.abs(visibilityChange * 100).toFixed(2)}%
    </div>
  </div>
  <div class="metric-row">
    <div class="metric-title">Ranking Volatility</div>
    <div class="metric-value" style="color: ${volatilityColor};">${volatility.toFixed(2)}</div>
    <div class="volatility-status" style="color: ${volatilityColor};">${volatilityStatus}</div>
  </div>
`;
  
  return container;
}

/**
 * Vanilla JavaScript PriceChart using Chart.js
 */
function PriceChart(props) {
  const { rowData, startDate, endDate } = props;
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  setTimeout(() => {
    if (!rowData || !rowData.historical_data) return;
    
    const labels = [];
    const priceData = [];
    
    let currentDate = moment(startDate);
    const end = moment(endDate);
    const histMap = {};
    
    rowData.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        histMap[item.date.value] = item;
      }
    });
    
    let lastPrice = null;
    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      labels.push(currentDate.format('MM/DD'));
      
      const histItem = histMap[dateStr];
      if (histItem && histItem.price) {
        lastPrice = parseFloat(histItem.price.replace(/[^0-9.-]+/g, ''));
        priceData.push(lastPrice);
      } else {
        priceData.push(lastPrice);
      }
      
      currentDate.add(1, 'day');
    }
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Price',
          data: priceData,
          borderColor: '#ff0000',
          backgroundColor: 'transparent',
          stepped: true,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: {
            title: { display: true, text: 'Price ($)' },
            ticks: {
              callback: function(value) {
                return '$' + value.toFixed(2);
              }
            }
          }
        }
      }
    });
  }, 100);
  
  return container;
}

/**
 * Vanilla JavaScript RatingChart using Chart.js
 */
function RatingChart(props) {
  const { rowData, startDate, endDate } = props;
  const container = document.createElement('div');
  container.style.width = '100%';
  container.style.height = '100%';
  
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);
  
  setTimeout(() => {
    if (!rowData || !rowData.historical_data) return;
    
    const labels = [];
    const ratingData = [];
    const reviewData = [];
    
    let currentDate = moment(startDate);
    const end = moment(endDate);
    const histMap = {};
    
    rowData.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        histMap[item.date.value] = item;
      }
    });
    
    while (currentDate.isSameOrBefore(end)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      labels.push(currentDate.format('MM/DD'));
      
      const histItem = histMap[dateStr];
      if (histItem) {
        ratingData.push(histItem.rating ? parseFloat(histItem.rating) : null);
        reviewData.push(histItem.review_count ? parseInt(histItem.review_count) : null);
      } else {
        ratingData.push(null);
        reviewData.push(null);
      }
      
      currentDate.add(1, 'day');
    }
    
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Rating',
            data: ratingData,
            borderColor: '#ffcc00',
            backgroundColor: 'rgba(255, 204, 0, 0.1)',
            yAxisID: 'y',
            tension: 0.3,
            fill: true
          },
          {
            label: 'Reviews',
            data: reviewData,
            borderColor: '#5856d6',
            backgroundColor: 'transparent',
            yAxisID: 'y1',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true }
        },
        scales: {
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            min: 0,
            max: 5,
            title: { display: true, text: 'Rating' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: 'Review Count' },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  }, 100);
  
  return container;
}

/**
 * Vanilla JavaScript RatingMetrics
 */
function RatingMetrics(props) {
  const { rowData } = props;
  const container = document.createElement('div');
  
  if (!rowData || !rowData.historical_data) {
    container.innerHTML = '<div>No rating data available</div>';
    return container;
  }
  
  const historical = rowData.historical_data;
  const ratings = historical.filter(h => h.rating).map(h => parseFloat(h.rating));
  const reviews = historical.filter(h => h.review_count).map(h => parseInt(h.review_count));
  
  const avgRating = ratings.length ? ratings.reduce((a,b) => a+b) / ratings.length : 0;
  const totalReviews = reviews.length ? reviews[reviews.length - 1] : 0;
  const ratingTrend = ratings.length >= 2 ? ratings[ratings.length-1] - ratings[0] : 0;
  const reviewGrowth = reviews.length >= 2 ? reviews[reviews.length-1] - reviews[0] : 0;
  
  container.innerHTML = `
    <div class="metric-row">
      <div class="metric-title">Average Rating</div>
      <div class="metric-value" style="font-size: 28px;">
        ${avgRating.toFixed(1)} ⭐
        <span style="color: ${ratingTrend > 0 ? 'green' : ratingTrend < 0 ? 'red' : '#444'}; font-size: 16px;">
          ${ratingTrend > 0 ? '▲' : ratingTrend < 0 ? '▼' : ''} ${Math.abs(ratingTrend).toFixed(1)}
        </span>
      </div>
    </div>
    <div class="metric-row">
      <div class="metric-title">Total Reviews</div>
      <div class="metric-value" style="font-size: 28px;">
        ${totalReviews}
        <span style="color: ${reviewGrowth > 0 ? 'green' : '#444'}; font-size: 16px;">
          ${reviewGrowth > 0 ? '+' + reviewGrowth : ''}
        </span>
      </div>
    </div>
  `;
  
  return container;
}

/**
 * Vanilla JavaScript ActiveExtensions
 */
function ActiveExtensions(props) {
  const { rowData } = props;
  const container = document.createElement('div');
  
  if (!rowData || !rowData.extensions || !rowData.extensions.length) {
    container.innerHTML = '<div>No active extensions.</div>';
  } else {
    container.innerHTML = rowData.extensions.map(ext => 
      `<div class="active-extension-tag">${ext}</div>`
    ).join('');
  }
  
  return container;
}

// Expose all components to window - same as in react-components.js
window.ToggleSwitch = ToggleSwitch;
window.DetailsPanel = DetailsPanel;
window.PLAChart = PLAChart;
window.AppleBarChart = AppleBarChart;
window.MainMetrics = MainMetrics;
window.PriceChart = PriceChart;
window.RatingChart = RatingChart;
window.RatingMetrics = RatingMetrics;
window.ActiveExtensions = ActiveExtensions;
