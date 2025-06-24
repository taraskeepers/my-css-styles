/**********************************************
 * vanilla-components.js
 * Vanilla JavaScript replacement for react-components.js
 * No React, No Recharts - pure JavaScript with Chart.js
 **********************************************/

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
        <div class="tab-content" style="display: flex; gap: 12px;">
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
            <h3>Settings</h3>
            <div id="toggles-${Date.now()}"></div>
          </div>
        </div>
      `;
      
      // Render charts
      setTimeout(() => {
        const plaChartEl = tabsContainer.querySelector('[id^="pla-chart-"]');
        const appleChartEl = tabsContainer.querySelector('[id^="apple-chart-"]');
        const metricsEl = tabsContainer.querySelector('[id^="main-metrics-"]');
        
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
    
    // Prepare visibility breakdown data
    const labels = [];
    const top3Data = [];
    const top8Data = [];
    const top14Data = [];
    const below14Data = [];
    
    let currentDate = moment(start);
    const endDate = moment(end);
    const histMap = {};
    
    rowData.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        histMap[item.date.value] = item;
      }
    });
    
    while (currentDate.isSameOrBefore(endDate)) {
      const dateStr = currentDate.format('YYYY-MM-DD');
      labels.push(currentDate.format('MM/DD'));
      
      const histItem = histMap[dateStr];
      if (histItem) {
        const top3 = parseFloat(histItem.top3_visibility || 0) * 100;
        const top8 = parseFloat(histItem.top8_visibility || 0) * 100;
        const top14 = parseFloat(histItem.top14_visibility || 0) * 100;
        const top40 = parseFloat(histItem.top40_visibility || 0) * 100;
        
        top3Data.push(top3);
        top8Data.push(Math.max(0, top8 - top3));
        top14Data.push(Math.max(0, top14 - top8));
        below14Data.push(Math.max(0, top40 - top14));
      } else {
        top3Data.push(0);
        top8Data.push(0);
        top14Data.push(0);
        below14Data.push(0);
      }
      
      currentDate.add(1, 'day');
    }
    
    new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Top 3',
            data: top3Data,
            backgroundColor: '#4cd964'
          },
          {
            label: 'Top 4-8',
            data: top8Data,
            backgroundColor: '#007aff'
          },
          {
            label: 'Top 9-14',
            data: top14Data,
            backgroundColor: '#ff9500'
          },
          {
            label: 'Below 14',
            data: below14Data,
            backgroundColor: '#ff3b30'
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
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            max: 100,
            title: { display: true, text: 'Visibility %' }
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
      <div class="metric-value" style="font-size: 32px; color: #333;">
        ${avgPosition.toFixed(2)}
        <span style="color: ${positionChange < 0 ? 'green' : positionChange > 0 ? 'red' : '#444'}; font-size: 18px;">
          ${posArrow} ${Math.abs(positionChange).toFixed(2)}
        </span>
      </div>
    </div>
    <div class="metric-row">
      <div class="metric-title">Average Visibility</div>
      <div class="metric-value" style="font-size: 32px; color: #333;">
        ${(avgVisibility * 100).toFixed(2)}%
        <span style="color: ${visibilityChange > 0 ? 'green' : visibilityChange < 0 ? 'red' : '#444'}; font-size: 18px;">
          ${visArrow} ${Math.abs(visibilityChange * 100).toFixed(2)}%
        </span>
      </div>
    </div>
    <div class="metric-row">
      <div class="metric-title">Ranking Volatility</div>
      <div class="metric-value" style="font-size: 32px; color: ${volatilityColor};">${volatility.toFixed(2)}</div>
      <div class="volatility-status" style="font-size: 16px; color: ${volatilityColor};">${volatilityStatus}</div>
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
