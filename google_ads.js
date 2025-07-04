window.pendingGoogleAdsCharts = [];
window.googleAdsApexCharts = [];
window.selectedGoogleAdsProduct = null;
window.userMetricPreferences = null;
window.userTrendPreferences = null;
// Global settings for product metrics calculation
window.productMetricsSettings = {
  useLatestDataDate: false, // true = use latest data date, false = use today's date
  // Future settings can be added here
};

// Helper functions defined at the top level
function getProductRecords(product) {
  if (!window.allRows || !product) return [];
  
  const records = window.allRows.filter(record => 
    record.title === product.title && 
    record.source === product.source
  );
  
  console.log('[DEBUG getProductRecords] Filtering for:', {
    title: product.title,
    source: product.source
  });
  console.log('[DEBUG getProductRecords] Found records:', records.length);
  
  // Log unique combinations of search terms, locations, and devices
  if (records.length > 0) {
    const combinations = records.map(r => ({
      searchTerm: r.q,
      location: r.location_requested,
      device: r.device
    }));
    console.log('[DEBUG getProductRecords] Unique combinations:', combinations);
  }
  
  return records;
}

function getProductCombinations(product) {
  const records = getProductRecords(product);
  const combinations = [];
  const seen = new Set();
  
  records.forEach(record => {
    const key = `${record.q}|${record.location_requested}|${record.device}`;
    if (!seen.has(key)) {
      seen.add(key);
      combinations.push({
        searchTerm: record.q,
        location: record.location_requested,
        device: record.device,
        record: record
      });
    }
  });
  
  console.log(`[getProductCombinations] Found ${combinations.length} combinations for product: ${product.title}`);
  return combinations;
}

function formatLocationCell(locationString) {
  if (!locationString) return locationString;
  const parts = locationString.split(",");
  const city = parts.shift() || locationString;
  
  let state = "", country = "";
  if (parts.length === 1) {
    country = parts[0].trim();
  } else if (parts.length >= 2) {
    state = parts.shift().trim();
    country = parts.join(",").trim();
  }
  
  return `
    <div class="city-line">${city}</div>
    ${state ? `<div class="state-line">${state}</div>` : ''}
    ${country ? `<div class="country-line">${country}</div>` : ''}
  `;
}

function createMarketSharePieChartGoogleAds(containerId, shareValue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  
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
  
  const chart = new ApexCharts(container, options);
  chart.render();
  
if (!window.googleAdsApexCharts) {
  window.googleAdsApexCharts = [];
}
window.googleAdsApexCharts.push(chart);
}

function calculateAggregateSegmentDataGoogleAds(products) {
  if (!products || products.length === 0) return null;
  
  const globalLastDate = moment().subtract(1, "days");
  const endDate = globalLastDate.clone();
  const startDate = endDate.clone().subtract(6, "days");
  
  const prevEnd = startDate.clone().subtract(1, "days");
  const prevStart = prevEnd.clone().subtract(6, "days");
  
  let currTop3Sum = 0, currTop8Sum = 0, currTop14Sum = 0, currTop40Sum = 0;
  let prevTop3Sum = 0, prevTop8Sum = 0, prevTop14Sum = 0, prevTop40Sum = 0;
  let countCurrent = 0, countPrevious = 0;
  
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
  
  products.forEach(product => {
    const histData = product.historical_data || [];
    
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
  
  const currTop3 = countCurrent > 0 ? currTop3Sum / countCurrent : 0;
  const currTop8 = countCurrent > 0 ? currTop8Sum / countCurrent : 0;
  const currTop14 = countCurrent > 0 ? currTop14Sum / countCurrent : 0;
  const currTop40 = countCurrent > 0 ? currTop40Sum / countCurrent : 0;
  
  const prevTop3 = countPrevious > 0 ? prevTop3Sum / countPrevious : 0;
  const prevTop8 = countPrevious > 0 ? prevTop8Sum / countPrevious : 0;
  const prevTop14 = countPrevious > 0 ? prevTop14Sum / countPrevious : 0;
  const prevTop40 = countPrevious > 0 ? prevTop40Sum / countPrevious : 0;
  
  return [
    { label: "Top3", current: currTop3, previous: prevTop3 },
    { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
    { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
    { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
  ];
}

function createSegmentationChartGoogleAds(containerId, chartData, termParam, locParam, deviceParam, myCompanyParam, activeCount, inactiveCount, segmentCounts) {
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) return;
  chartContainer.classList.remove('loading');

  console.log(`[DEBUG-CHART] Creating chart for container: ${containerId}`);
  console.log(`[DEBUG-CHART] segmentCounts parameter:`, segmentCounts);
  
  if (!chartData || chartData.length === 0) {
    chartContainer.innerHTML = '<div class="no-data-message">No segment data</div>';
    return;
  }
  
  chartContainer.innerHTML = '';
  chartContainer.style.height = '380px';
  chartContainer.style.maxHeight = '380px';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.display = 'flex';
  chartContainer.style.flexDirection = 'column';
  chartContainer.style.alignItems = 'center';
  
  const chartAndCountsWrapper = document.createElement('div');
  chartAndCountsWrapper.style.width = '100%';
  chartAndCountsWrapper.style.height = '280px';
  chartAndCountsWrapper.style.display = 'flex';
  chartAndCountsWrapper.style.alignItems = 'center';
  chartAndCountsWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(chartAndCountsWrapper);
  
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.flex = '1';
  canvasWrapper.style.height = '100%';
  canvasWrapper.style.position = 'relative';
  chartAndCountsWrapper.appendChild(canvasWrapper);
  
  const countsColumn = document.createElement('div');
  countsColumn.style.width = '40px';
  countsColumn.style.height = '100%';
  countsColumn.style.display = 'flex';
  countsColumn.style.flexDirection = 'column';
  countsColumn.style.justifyContent = 'center';
  countsColumn.style.paddingLeft = '5px';
  chartAndCountsWrapper.appendChild(countsColumn);
  
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
  
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
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

  console.log(`[DEBUG] Using provided counts - Active: ${activeCount}, Inactive: ${inactiveCount}`);
  
  countContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
    <div style="font-weight: 700; color: #4CAF50;">${activeCount}</div>
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
    <div style="font-weight: 700; color: #9e9e9e;">${inactiveCount}</div>
  `;
  
  chartContainer.appendChild(countContainer);
  
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

function selectGoogleAdsProduct(product, navItemElement) {
  return new Promise((resolve) => {
    console.log('[selectGoogleAdsProduct] Selecting product:', product.title);

  // Clean up previous product info charts
  if (window.productInfoCharts) {
    window.productInfoCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
    window.productInfoCharts = [];
  }
  
  document.querySelectorAll('.nav-google-ads-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (navItemElement) {
    navItemElement.classList.add('selected');
  }
  
  window.selectedGoogleAdsProduct = product;
  
  const currentViewMode = document.querySelector('.google-ads-view-switcher .active')?.id || 'viewOverviewGoogleAds';
  
  const combinations = getProductCombinations(product);
  console.log(`[selectGoogleAdsProduct] Found ${combinations.length} combinations for ${product.title}`);
  
  // First render the table which creates the containers
  renderTableForSelectedGoogleAdsProduct(combinations, currentViewMode);
  
  // Now wait a bit for DOM to be ready, then populate the containers
  setTimeout(() => {
    // Ensure containers are visible
    const productInfoContainer = document.getElementById('product_info');
    const productRankingMapContainer = document.getElementById('product_ranking_map');
    const productTablesContainer = document.getElementById('product_tables');
    const productMetricsContainer = document.getElementById('product_metrics');
    
// Handle container visibility based on current view mode
if (currentViewMode === 'viewOverviewGoogleAds') {
  // Product Overview mode
  if (productInfoContainer) productInfoContainer.style.display = 'block';
  if (productRankingMapContainer) productRankingMapContainer.style.display = 'none';
  if (productTablesContainer) productTablesContainer.style.display = 'block';
  if (productMetricsContainer) productMetricsContainer.style.display = 'block';
} else if (currentViewMode === 'viewChartsGoogleAds') {
  // Rank Map mode
  if (productInfoContainer) productInfoContainer.style.display = 'none';
  if (productRankingMapContainer) productRankingMapContainer.style.display = 'block';
  if (productTablesContainer) productTablesContainer.style.display = 'none';
  if (productMetricsContainer) productMetricsContainer.style.display = 'none';
} else if (currentViewMode === 'viewMapGoogleAds') {
  // Map mode
  if (productInfoContainer) productInfoContainer.style.display = 'none';
  if (productRankingMapContainer) productRankingMapContainer.style.display = 'none';
  if (productTablesContainer) productTablesContainer.style.display = 'none';
  if (productMetricsContainer) productMetricsContainer.style.display = 'none';
} else if (currentViewMode === 'viewPerformanceOverviewGoogleAds') {
  // Performance Overview mode
  if (productInfoContainer) productInfoContainer.style.display = 'none';
  if (productRankingMapContainer) productRankingMapContainer.style.display = 'none';
  if (productTablesContainer) productTablesContainer.style.display = 'none';
  if (productMetricsContainer) productMetricsContainer.style.display = 'none';
} else if (currentViewMode === 'viewBucketsGoogleAds') {
  // Buckets mode
  if (productInfoContainer) productInfoContainer.style.display = 'none';
  if (productRankingMapContainer) productRankingMapContainer.style.display = 'none';
  if (productTablesContainer) productTablesContainer.style.display = 'none';
  if (productMetricsContainer) productMetricsContainer.style.display = 'none';
}
    
// Only populate product info if in Overview mode
if (currentViewMode === 'viewOverviewGoogleAds') {
  populateProductInfo(product);
  // Ensure date selector is properly set up
  setTimeout(() => {
    setupProductInfoDateSelector();
  }, 100);
}
    
// Apply current filters to ranking map
const campaignFilter = document.getElementById('campaignNameFilter')?.value || 'all';
const channelFilter = document.getElementById('channelTypeFilter')?.value || 'all';
const deviceFilter = document.getElementById('deviceTypeFilter')?.value || 'all';

// Only populate ranking map if we're in Rank Map view
if (currentViewMode === 'viewChartsGoogleAds') {
  populateProductRankingMap(product, campaignFilter, channelFilter, deviceFilter);
}
    
    // Load and display product metrics if in overview mode
    if (currentViewMode === 'viewOverviewGoogleAds') {
      loadProductMetricsData(product.title).then(result => {
        if (result && result.productData.length > 0) {
          // Show the container
          if (productMetricsContainer) {
            productMetricsContainer.style.display = 'block';
          }
          
          // Store data globally
          window.currentProductMetricsData = result.productData;
          
          // Get initial campaigns and channels
          const campaigns = [...new Set(result.productData.map(d => d['Campaign Name']))].filter(c => c);
          const channels = [...new Set(result.productData.map(d => d['Channel Type']))].filter(c => c);
          
          // Populate filter dropdowns
          const campaignFilter = document.getElementById('campaignNameFilter');
          const channelFilter = document.getElementById('channelTypeFilter');
          
          if (campaignFilter) {
            campaignFilter.innerHTML = '<option value="all">All Campaigns</option>';
            campaigns.forEach(campaign => {
              campaignFilter.innerHTML += `<option value="${campaign}">${campaign}</option>`;
            });
          }
          
          if (channelFilter) {
            channelFilter.innerHTML = '<option value="all">All Channels</option>';
            channels.forEach(channel => {
              channelFilter.innerHTML += `<option value="${channel}">${channel}</option>`;
            });
          }
          
          // Process and render initial chart
          const chartData = processMetricsData(result.productData, 'all', 'all');
          renderProductMetricsChart('productMetricsChart', chartData);
          
          // Setup metrics selector
          setTimeout(() => {
            const metricsContainer = document.getElementById('metricsListContainer');
            const newSettingsBtn = document.getElementById('trendsSettingsBtn');
            const selectorPopup = document.getElementById('metricsSelectorPopup');
            
            if (metricsContainer && window.availableMetrics) {
              metricsContainer.innerHTML = '';
              window.availableMetrics.forEach(metric => {
                const item = document.createElement('div');
                item.className = 'metric-selector-item';
                const isChecked = window.selectedMetrics.includes(metric.key) ? 'checked' : '';
                item.innerHTML = `
                  <label class="metric-toggle-switch">
                    <input type="checkbox" class="metric-selector-toggle" 
                           data-metric="${metric.key}" ${isChecked}>
                    <span class="metric-toggle-slider"></span>
                  </label>
                  <span>${metric.label}</span>
                `;
                metricsContainer.appendChild(item);
              });
              
              // Add toggle listeners
              document.querySelectorAll('.metric-selector-toggle').forEach(toggle => {
                toggle.addEventListener('change', function() {
                  const metric = this.dataset.metric;
                  if (this.checked) {
                    if (!window.selectedMetrics.includes(metric)) {
                      window.selectedMetrics.push(metric);
                    }
                  } else {
                    window.selectedMetrics = window.selectedMetrics.filter(m => m !== metric);
                  }
                  updateTrendsData();
                });
              });
            }
            
            if (newSettingsBtn && selectorPopup) {
              newSettingsBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                const containerRect = document.getElementById('google-ads-trends-container').getBoundingClientRect();
                selectorPopup.style.position = 'fixed';
                selectorPopup.style.top = containerRect.top + 'px';
                selectorPopup.style.left = (containerRect.left - 280) + 'px';
                
                if (containerRect.left < 300) {
                  selectorPopup.style.left = containerRect.left + 'px';
                  selectorPopup.style.top = (containerRect.top - 420) + 'px';
                }
                
                selectorPopup.classList.toggle('visible');
              });
              
              document.addEventListener('click', function(e) {
                if (!selectorPopup.contains(e.target) && !newSettingsBtn.contains(e.target)) {
                  selectorPopup.classList.remove('visible');
                }
              });
            }
          }, 150);
          
          // Update date range text
          const dateRangeText = document.getElementById('dateRangeText');
          if (dateRangeText) {
            const days = window.selectedDateRangeDays || 7;
            const rangeLabels = {
              3: 'Last 3 days',
              7: 'Last 7 days',
              14: 'Last 14 days',
              30: 'Last 30 days',
              90: 'Last 90 days'
            };
            dateRangeText.textContent = rangeLabels[days] || `Last ${days} days`;
          }
          updateTrendsData();
          
          // Add event listeners for filters
          const campaignFilterElement = document.getElementById('campaignNameFilter');
          const channelFilterElement = document.getElementById('channelTypeFilter');
          
          if (campaignFilterElement && !campaignFilterElement.hasAttribute('data-listener-attached')) {
            campaignFilterElement.setAttribute('data-listener-attached', 'true');
            campaignFilterElement.addEventListener('change', function() {
              updateProductMetricsChart();
              if (window.selectedGoogleAdsProduct) {
                const campaignValue = this.value;
                const channelValue = document.getElementById('channelTypeFilter').value;
                populateProductRankingMap(window.selectedGoogleAdsProduct, campaignValue, channelValue, 'all');
              }
            });
          }
          
          if (channelFilterElement && !channelFilterElement.hasAttribute('data-listener-attached')) {
            channelFilterElement.setAttribute('data-listener-attached', 'true');
            channelFilterElement.addEventListener('change', function() {
              updateProductMetricsChart();
              if (window.selectedGoogleAdsProduct) {
                const campaignValue = document.getElementById('campaignNameFilter').value;
                const channelValue = this.value;
                populateProductRankingMap(window.selectedGoogleAdsProduct, campaignValue, channelValue, 'all');
              }
            });
          }
// Add event listener for device filter
const deviceFilterElement = document.getElementById('deviceTypeFilter');
if (deviceFilterElement && !deviceFilterElement.hasAttribute('data-listener-attached')) {
  deviceFilterElement.setAttribute('data-listener-attached', 'true');
  deviceFilterElement.addEventListener('change', function() {
    updateProductMetricsChart();
    
    if (window.selectedGoogleAdsProduct) {
      const campaignValue = document.getElementById('campaignNameFilter').value;
      const channelValue = document.getElementById('channelTypeFilter').value;
      // Note: ranking map doesn't use device filter as it shows all devices
      populateProductRankingMap(window.selectedGoogleAdsProduct, campaignValue, channelValue, 'all');
    }
    
    // Update chart ranking data based on device filter
    const chartContainer = document.getElementById('productMetricsChart');
    if (chartContainer && chartContainer.chartInstance) {
      const chart = chartContainer.chartInstance;
      
      // Re-populate ranking data based on new filter
      chart.data.datasets = chart.data.datasets.map(dataset => {
        if (dataset.isRanking) {
          const rankingData = getRankingDataByDevice(chart.data.labels);
          if (dataset.label.includes('Desktop')) {
            dataset.data = rankingData.desktop;
          } else if (dataset.label.includes('Mobile')) {
            dataset.data = rankingData.mobile;
          }
        }
        return dataset;
      });
      
      // Force chart update
      chart.update('none');
    }
  });
}
        } else {
          // No data available
          if (productMetricsContainer) {
            productMetricsContainer.style.display = 'block';
            const chartContainer = document.getElementById('productMetricsChart');
            if (chartContainer) {
              chartContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><h3>No performance data available for this product</h3><p>Performance metrics will appear here once data is available in the Google Sheets integration.</p></div>';
            }
          }
        }
      }).catch(error => {
        console.error('[selectGoogleAdsProduct] Failed to load product metrics:', error);
        const productMetricsContainer = document.getElementById('product_metrics');
        if (productMetricsContainer) {
          productMetricsContainer.style.display = 'block';
          const chartContainer = document.getElementById('productMetricsChart');
          if (chartContainer) {
            chartContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;"><h3>Unable to load performance data</h3><p>Please check if the Google Sheets integration is properly configured.</p></div>';
          }
        }
      });
    }
}, 100); // Small delay to ensure DOM is ready
  
  // Resolve the promise after a bit more delay to ensure everything is loaded
  setTimeout(() => {
    resolve();
  }, 200);
  });
}
  
function updateProductMetricsChart() {
  const campaignFilter = document.getElementById('campaignNameFilter').value;
  const channelFilter = document.getElementById('channelTypeFilter').value;
  const deviceFilter = document.getElementById('deviceTypeFilter').value;
  
  if (window.currentProductMetricsData) {
    const chartData = processMetricsData(
      window.currentProductMetricsData,
      campaignFilter,
      channelFilter,
      deviceFilter
    );
    renderProductMetricsChart('productMetricsChart', chartData);
    // Update trends if visible
    updateTrendsData();
  }
}
  
  // Rebuild map if currently in map view
  if (currentViewMode === 'viewMapGoogleAds') {
    const mapContainer = document.getElementById('googleAdsMapContainer');
    if (mapContainer && mapContainer.style.display !== 'none') {
      console.log('[selectGoogleAdsProduct] Rebuilding map for new product');
      
      // Clear existing map and blocks
      const mapWrapper = document.getElementById('mapWrapper');
      if (mapWrapper) {
        mapWrapper.innerHTML = '';
      }
      
      const mapProject = buildMapDataForSelectedGoogleAdsProduct();
      if (window.mapHelpers && window.mapHelpers.drawUsMapWithLocations) {
        window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'google-ads');
        
        // Add location blocks after map is drawn
        setTimeout(() => {
          addLocationBlocksToMap(mapProject, '#mapWrapper');
          
          // Maintain toggle state
          const toggleButton = document.getElementById('toggleLocationBlocksGoogleAds');
          if (toggleButton && toggleButton.classList.contains('inactive')) {
            document.querySelectorAll('.location-block').forEach(block => {
              block.style.display = 'none';
            });
          }
        }, 500);
      }
    }
  }

async function checkProductHasData(productTitle) {
  try {
    const accountPrefix = window.currentAccount || 'acc1';
    const tableName = `${accountPrefix}_googleSheets_productPerformance`;
    
    // Try to open the database
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    // Check if the table exists
    if (!db.objectStoreNames.contains('projectData')) {
      db.close();
      return false;
    }
    
    // Try to get data from projectData store
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const data = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!data || !data.data) return false;
    
    // Check if this specific product has any data
    const actualData = Array.isArray(data.data) ? data.data : [];
    const productData = actualData.filter(row => row['Product Title'] === productTitle);
    
    return productData.length > 0;
    
  } catch (error) {
    console.warn('[checkProductHasData] Error checking product data:', error);
    return false;
  }
}

async function loadProductMetricsData(productTitle) {
  try {
    console.log('[loadProductMetricsData] Starting...');
    
    // Get current account prefix
    const accountPrefix = window.currentAccount || 'acc1';
    const tableName = `${accountPrefix}_googleSheets_productPerformance`;
    
    console.log(`[loadProductMetricsData] Looking for table: ${tableName}`);
    
    // First, close any existing connections to force a fresh connection
    const existingDb = await new Promise((resolve) => {
      const request = indexedDB.open('myAppDB - projectData');
      request.onsuccess = (event) => {
        const db = event.target.result;
        db.close();
        resolve();
      };
      request.onerror = () => resolve();
    });
    
    // Wait a bit to ensure the database is fully closed
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Now try to delete and recreate the database connection
    console.log('[loadProductMetricsData] Attempting to refresh database connection...');
    
    // Try to access through the parent database first
    const myAppDb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => {
        console.log('[loadProductMetricsData] Opened myAppDB');
        resolve(event.target.result);
      };
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Check if projectData exists in myAppDB
    if (myAppDb.objectStoreNames.contains('projectData')) {
      console.log('[loadProductMetricsData] Found projectData in myAppDB');
      
      try {
        const transaction = myAppDb.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        
        // Try to get the specific key
        const getRequest = objectStore.get(tableName);
        
        const data = await new Promise((resolve, reject) => {
          getRequest.onsuccess = () => {
            console.log('[loadProductMetricsData] Data retrieved from projectData store');
            resolve(getRequest.result);
          };
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        if (data) {
          console.log('[loadProductMetricsData] Found data in projectData store:', data);
          
          // Process the data
          let actualData;
          if (data.data && Array.isArray(data.data)) {
            actualData = data.data;
          } else if (Array.isArray(data)) {
            actualData = data;
          } else {
            console.error('[loadProductMetricsData] Unexpected data format in projectData');
            myAppDb.close();
            return null;
          }
          
          // Filter for the product
          const productData = actualData.filter(row => 
            row['Product Title'] === productTitle
          );
          
          console.log(`[loadProductMetricsData] Found ${productData.length} records for product`);
          
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
    
    // Alternative approach: Try to force database refresh
    console.log('[loadProductMetricsData] Trying to force database refresh...');
    
    // Delete the database and let it recreate
    try {
      await new Promise((resolve, reject) => {
        const deleteReq = indexedDB.deleteDatabase('myAppDB - projectData');
        deleteReq.onsuccess = () => {
          console.log('[loadProductMetricsData] Database deleted successfully');
          resolve();
        };
        deleteReq.onerror = () => {
          console.log('[loadProductMetricsData] Could not delete database');
          resolve(); // Continue anyway
        };
      });
    } catch (e) {
      console.log('[loadProductMetricsData] Error deleting database:', e);
    }
    
    // Wait for any background processes
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Try opening again
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB - projectData', 2); // Try with version 2
      
      request.onupgradeneeded = (event) => {
        console.log('[loadProductMetricsData] Database upgrade needed');
        const database = event.target.result;
        
        // Check if the object store exists, if not, we can't create it here
        if (!database.objectStoreNames.contains(tableName)) {
          console.log('[loadProductMetricsData] Object store does not exist and cannot be created here');
        }
      };
      
      request.onsuccess = (event) => {
        const database = event.target.result;
        console.log('[loadProductMetricsData] Database reopened, version:', database.version);
        console.log('[loadProductMetricsData] Object stores after refresh:', Array.from(database.objectStoreNames));
        resolve(database);
      };
      
      request.onerror = () => reject(new Error('Failed to reopen database'));
    });
    
    // Final check
    if (!db.objectStoreNames.contains(tableName)) {
      console.error('[loadProductMetricsData] Table still not found after refresh');
      
      // As a last resort, check if the data might be stored differently
      console.log('[loadProductMetricsData] Checking all available object stores...');
      const allStores = Array.from(db.objectStoreNames);
      console.log('[loadProductMetricsData] All stores:', allStores);
      
      db.close();
      return null;
    }
    
    // Get data from the table
    const transaction = db.transaction([tableName], 'readonly');
    const objectStore = transaction.objectStore(tableName);
    const getAllRequest = objectStore.getAll();
    
    const data = await new Promise((resolve, reject) => {
      getAllRequest.onsuccess = () => resolve(getAllRequest.result);
      getAllRequest.onerror = () => reject(getAllRequest.error);
    });
    
    // Process data as before...
    if (!data || data.length === 0) {
      console.warn('[loadProductMetricsData] No data found');
      db.close();
      return null;
    }
    
    let actualData;
    if (data[0] && data[0].data && Array.isArray(data[0].data)) {
      actualData = data[0].data;
    } else if (Array.isArray(data)) {
      actualData = data;
    } else {
      console.error('[loadProductMetricsData] Unexpected data structure');
      db.close();
      return null;
    }
    
    const productData = actualData.filter(row => 
      row['Product Title'] === productTitle
    );
    
    if (productData.length === 0) {
      console.warn('[loadProductMetricsData] No data for product');
      db.close();
      return null;
    }
    
    const campaignNames = [...new Set(productData.map(row => row['Campaign Name']))].filter(Boolean);
    const channelTypes = [...new Set(productData.map(row => row['Channel Type']))].filter(Boolean);
    
    db.close();
    
    return {
      productData,
      campaignNames,
      channelTypes
    };
    
  } catch (error) {
    console.error('[loadProductMetricsData] Error:', error);
    return null;
  }
}

function populateProductInfo(product) {
  const productInfoContainer = document.getElementById('product_info');
  if (!productInfoContainer) return;
  
  // Clear existing content
  productInfoContainer.innerHTML = '';
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'product-info-wrapper';
  
// Left container for funnel
const leftContainer = document.createElement('div');
leftContainer.style.cssText = 'width: 520px; height: 100%; position: relative;';
  
  const productImage = product.thumbnail || 'https://via.placeholder.com/100?text=No+Image';
  const productTitle = product.title || 'No title';
  const productPrice = product.price || 'N/A';
  
  // Generate review data (since it's not in the data model, we'll simulate it)
  const reviewRating = (Math.random() * 2 + 3).toFixed(1); // Random between 3.0-5.0
  const reviewCount = Math.floor(Math.random() * 500 + 50); // Random between 50-550
  
  leftContainer.innerHTML = `
    <div class="product-info-title">${productTitle}</div>
    <div class="product-info-bottom-section">
      <img class="product-info-image" 
           src="${productImage}" 
           alt="${productTitle}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/100?text=No+Image';">
      <div class="product-info-details">
        <div class="product-info-price">${productPrice !== 'N/A' && !isNaN(productPrice) ? '$' + productPrice : productPrice}</div>
        <div class="product-info-reviews">
          <div class="product-stars">${'★'.repeat(Math.round(reviewRating))} ${reviewRating}</div>
          <div class="product-review-count">(${reviewCount} reviews)</div>
        </div>
      </div>
    </div>
  `;
  
  // Right container with radial charts
  const rightContainer = document.createElement('div');
  rightContainer.className = 'product-info-right';
  
  // Add legends container
  const legendsContainer = document.createElement('div');
  legendsContainer.className = 'chart-legends';
  legendsContainer.id = 'chartLegends';
  legendsContainer.style.marginBottom = '10px';
  
  // Add charts grid
  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'radial-charts-grid';
  chartsGrid.id = 'productInfoChartsGrid';
  
  rightContainer.appendChild(legendsContainer);
  rightContainer.appendChild(chartsGrid);
  
  wrapper.appendChild(leftContainer);
  wrapper.appendChild(rightContainer);
  
  productInfoContainer.appendChild(wrapper);
  
    // Show date range selector in top controls
  const topDateSelector = document.getElementById('productInfoDateRange');
  if (topDateSelector) {
    topDateSelector.style.display = 'block';
  }
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Setup date range selector functionality
  setupProductInfoDateSelector();
  
  // Load data and render charts
  loadProductMetricsData(product.title).then(result => {
    if (result && result.productData.length > 0) {
      // Store data globally for date range changes
      window.currentProductInfoData = result.productData;
      
      // Get current mode from toggle
      const isChannelMode = !document.getElementById('chartModeToggle')?.checked;
      renderProductInfoCharts(result.productData, isChannelMode ? 'channel' : 'campaign');
      
      // Also populate the tables
      populateProductTables(result.productData, isChannelMode ? 'channel' : 'campaign');
    } else {
      chartsGrid.innerHTML = '<div style="text-align: center; color: #999; width: 100%;">No performance data available</div>';
    }
  });
}

function populateProductRankingMap(product, campaignFilter = 'all', channelFilter = 'all', deviceFilter = 'all') {
  const container = document.getElementById('product_ranking_map');
  if (!container) return;

    // Check if we're in Overview mode and hide if so
  const overviewBtn = document.getElementById('viewOverviewGoogleAds');
  if (overviewBtn && overviewBtn.classList.contains('active')) {
    container.style.display = 'none';
    container.style.visibility = 'hidden';
    return;
  }
  
  // Show the container
  container.style.display = 'block';
  container.style.visibility = 'visible';
  
  // Get date range
  const daysToShow = window.selectedDateRangeDays || 7;
  const endDate = moment().startOf('day');
  const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
  
  // Load data from googleSheets_productPerformance
  loadProductMetricsData(product.title).then(result => {
    if (!result || !result.productData || result.productData.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No performance data available for ranking map</div>';
      return;
    }
    
    // Apply filters
    let filteredData = result.productData.filter(row => {
      if (!row.Date) return false;
      const rowDate = moment(row.Date, 'YYYY-MM-DD');
      return rowDate.isBetween(startDate, endDate, 'day', '[]');
    });
    
    if (campaignFilter !== 'all') {
      filteredData = filteredData.filter(row => row['Campaign Name'] === campaignFilter);
    }
    if (channelFilter !== 'all') {
      filteredData = filteredData.filter(row => row['Channel Type'] === channelFilter);
    }
    // Add device filter
if (deviceFilter !== 'all') {
  const deviceMap = {
    'desk': 'DESKTOP',
    'mob': 'MOBILE'
  };
  const deviceValue = deviceMap[deviceFilter];
  if (deviceValue) {
    filteredData = filteredData.filter(row => row.Device === deviceValue);
  }
}
    
    // Get ranking data from product records
    const productRecords = getProductRecords(product);
let filteredProductRecords = productRecords;

// Filter product records by device if needed
if (deviceFilter !== 'all') {
  const deviceMap = {
    'desk': 'desktop',
    'mob': 'mobile'
  };
  const filterDevice = deviceMap[deviceFilter];
  filteredProductRecords = productRecords.filter(record => {
    return record.device && record.device.toLowerCase() === filterDevice;
  });
}
    
const rankingsByDate = new Map();

// Collect rankings by date within the date range
filteredProductRecords.forEach(record => {
  if (record.historical_data && Array.isArray(record.historical_data)) {
    record.historical_data.forEach(item => {
      if (item.date?.value && item.avg_position != null) {
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        if (itemDate.isBetween(startDate, endDate, 'day', '[]')) {
          const date = item.date.value;
          const ranking = parseFloat(item.avg_position);
          
          if (!rankingsByDate.has(date)) {
            rankingsByDate.set(date, []);
          }
          rankingsByDate.get(date).push(ranking);
        }
      }
    });
  }
});
    
    // Calculate average ranking per date
    const avgRankingByDate = new Map();
    rankingsByDate.forEach((rankings, date) => {
      const avgRanking = rankings.reduce((sum, r) => sum + r, 0) / rankings.length;
      avgRankingByDate.set(date, avgRanking);
    });
    
    // Initialize data structure
    const positionData = {};
    for (let i = 1; i <= 40; i++) {
      positionData[i] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        ctrSum: 0,
        cvrSum: 0,
        roasSum: 0,
        aovSum: 0,
        cpaSum: 0,
        count: 0
      };
    }
    
    // Group data by date and aggregate
    const dataByDate = new Map();
    filteredData.forEach(row => {
      const date = row.Date;
      if (!date) return;
      
      if (!dataByDate.has(date)) {
        dataByDate.set(date, {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0
        });
      }
      
      const dayData = dataByDate.get(date);
      dayData.impressions += parseInt(String(row.Impressions || '0').replace(/,/g, '')) || 0;
      dayData.clicks += parseInt(row.Clicks) || 0;
      dayData.cost += parseFloat(String(row.Cost || '0').replace(/[$,]/g, '')) || 0;
      dayData.conversions += parseFloat(row.Conversions) || 0;
      dayData.conversionValue += parseFloat(String(row['Conversion Value'] || '0').replace(/[$,]/g, '')) || 0;
    });
    
    // Process aggregated data by ranking position
    dataByDate.forEach((dayData, date) => {
      const avgRanking = avgRankingByDate.get(date);
      if (!avgRanking) return;
      
      // Round ranking to nearest integer
      const roundedRanking = Math.round(avgRanking);
      const position = Math.max(1, Math.min(40, roundedRanking));
      
      const posData = positionData[position];
      posData.impressions += dayData.impressions;
      posData.clicks += dayData.clicks;
      posData.cost += dayData.cost;
      posData.conversions += dayData.conversions;
      posData.conversionValue += dayData.conversionValue;
      
      // Calculate metrics for averaging
      const ctr = dayData.impressions > 0 ? (dayData.clicks / dayData.impressions) * 100 : 0;
      const cvr = dayData.clicks > 0 ? (dayData.conversions / dayData.clicks) * 100 : 0;
      const roas = dayData.cost > 0 ? dayData.conversionValue / dayData.cost : 0;
      const aov = dayData.conversions > 0 ? dayData.conversionValue / dayData.conversions : 0;
      const cpa = dayData.conversions > 0 ? dayData.cost / dayData.conversions : 0;
      
      posData.ctrSum += ctr;
      posData.cvrSum += cvr;
      posData.roasSum += roas;
      posData.aovSum += aov;
      posData.cpaSum += cpa;
      posData.count++;
    });
    
    // Check if segmented mode is on
    const isSegmented = document.getElementById('rankingMapSegmentedToggle')?.checked || false;
    
// Create toggle HTML
let containerHTML = `
  <div style="display: flex; align-items: center; gap: 20px; margin-bottom: 15px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
    <div style="display: flex; align-items: center; gap: 10px;">
      <label style="font-weight: 600; font-size: 13px;">Device:</label>
      <select id="rankingMapDeviceFilter" style="padding: 4px 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 12px;">
        <option value="all" ${deviceFilter === 'all' ? 'selected' : ''}>All dev</option>
        <option value="desk" ${deviceFilter === 'desk' ? 'selected' : ''}>Desk</option>
        <option value="mob" ${deviceFilter === 'mob' ? 'selected' : ''}>Mob</option>
      </select>
    </div>
    <div class="ranking-map-segmented-toggle">
      <label>Detailed Mode</label>
      <label class="chart-mode-switch">
        <input type="checkbox" id="rankingMapSegmentedToggle" ${isSegmented ? 'checked' : ''}>
        <span class="chart-mode-slider"></span>
      </label>
      <label>Segmented Mode</label>
    </div>
  </div>
`;
    
    if (isSegmented) {
      // Segmented mode - aggregate into 4 segments
      const segments = {
        'Top 3': { range: [1, 3], data: null },
        'Top 4-8': { range: [4, 8], data: null },
        'Top 9-14': { range: [9, 14], data: null },
        'Below 14': { range: [15, 40], data: null }
      };
      
      // Aggregate data for each segment
      Object.keys(segments).forEach(segmentName => {
        const segment = segments[segmentName];
        const segmentData = {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0,
          ctrSum: 0,
          cvrSum: 0,
          roasSum: 0,
          aovSum: 0,
          cpaSum: 0,
          count: 0
        };
        
        for (let pos = segment.range[0]; pos <= segment.range[1]; pos++) {
          const data = positionData[pos];
          segmentData.impressions += data.impressions;
          segmentData.clicks += data.clicks;
          segmentData.cost += data.cost;
          segmentData.conversions += data.conversions;
          segmentData.conversionValue += data.conversionValue;
          segmentData.ctrSum += data.ctrSum;
          segmentData.cvrSum += data.cvrSum;
          segmentData.roasSum += data.roasSum;
          segmentData.aovSum += data.aovSum;
          segmentData.cpaSum += data.cpaSum;
          segmentData.count += data.count;
        }
        
        segment.data = segmentData;
      });
      
      // Create segmented table
      containerHTML += `
        <table class="ranking-map-table segmented-mode">
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
      
      // Collect all values for heat map calculation
      const allValues = {
        impressions: [], clicks: [], avgCpc: [], cost: [], conversions: [],
        conversionValue: [], ctr: [], cvr: [], roas: [], aov: [], cpa: []
      };
      
      Object.keys(segments).forEach(segmentName => {
        const data = segments[segmentName].data;
        if (data.count > 0) {
          allValues.impressions.push(data.impressions);
          allValues.clicks.push(data.clicks);
          allValues.avgCpc.push(data.clicks > 0 ? data.cost / data.clicks : 0);
          allValues.cost.push(data.cost);
          allValues.conversions.push(data.conversions);
          allValues.conversionValue.push(data.conversionValue);
          allValues.ctr.push(data.ctrSum / data.count);
          allValues.cvr.push(data.cvrSum / data.count);
          allValues.roas.push(data.roasSum / data.count);
          allValues.aov.push(data.aovSum / data.count);
          allValues.cpa.push(data.cpaSum / data.count);
        }
      });
      
      Object.keys(segments).forEach((segmentName, index) => {
        const data = segments[segmentName].data;
        const hasData = data.count > 0;
        
        const avgCtr = hasData ? (data.ctrSum / data.count).toFixed(2) : '0.00';
        const avgCvr = hasData ? (data.cvrSum / data.count).toFixed(2) : '0.00';
        const avgRoas = hasData ? (data.roasSum / data.count).toFixed(2) : '0.00';
        const avgAov = hasData ? (data.aovSum / data.count).toFixed(2) : '0.00';
        const avgCpa = hasData ? (data.cpaSum / data.count).toFixed(2) : '0.00';
        const avgCpc = hasData && data.clicks > 0 ? (data.cost / data.clicks).toFixed(2) : '0.00';
        
        const rowClass = index === 0 ? 'ranking-position-1' :
                        index === 1 ? 'ranking-position-4' :
                        index === 2 ? 'ranking-position-9' : 'ranking-position-below-14';
        
        containerHTML += `
          <tr class="${rowClass}">
            <td>${segmentName}</td>
            <td class="${getHeatMapClass(data.impressions, allValues.impressions, false)}">${hasData ? data.impressions.toLocaleString() : '-'}</td>
            <td class="${getHeatMapClass(data.clicks, allValues.clicks, false)}">${hasData ? data.clicks.toLocaleString() : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCpc), allValues.avgCpc, true)}">${hasData ? '$' + avgCpc : '-'}</td>
            <td class="${getHeatMapClass(data.cost, allValues.cost, true)}">${hasData ? '$' + data.cost.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(data.conversions, allValues.conversions, false)}">${hasData ? data.conversions.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(data.conversionValue, allValues.conversionValue, false)}">${hasData ? '$' + data.conversionValue.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCtr), allValues.ctr, false)}">${hasData ? avgCtr + '%' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCvr), allValues.cvr, false)}">${hasData ? avgCvr + '%' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgRoas), allValues.roas, false)}">${hasData ? avgRoas + 'x' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgAov), allValues.aov, false)}">${hasData ? '$' + avgAov : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCpa), allValues.cpa, true)}">${hasData ? '$' + avgCpa : '-'}</td>
          </tr>
        `;
      });
      
    } else {
      // Detailed mode - show all 40 rows
      containerHTML += `
        <table class="ranking-map-table">
          <thead>
            <tr>
              <th>Avg Ranking</th>
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
      
      // Collect all values for heat map calculation
      const allValues = {
        impressions: [], clicks: [], avgCpc: [], cost: [], conversions: [],
        conversionValue: [], ctr: [], cvr: [], roas: [], aov: [], cpa: []
      };
      
      // First pass to collect values
      for (let position = 1; position <= 40; position++) {
        const data = positionData[position];
        if (data.count > 0) {
          allValues.impressions.push(data.impressions);
          allValues.clicks.push(data.clicks);
          allValues.avgCpc.push(data.clicks > 0 ? data.cost / data.clicks : 0);
          allValues.cost.push(data.cost);
          allValues.conversions.push(data.conversions);
          allValues.conversionValue.push(data.conversionValue);
          allValues.ctr.push(data.ctrSum / data.count);
          allValues.cvr.push(data.cvrSum / data.count);
          allValues.roas.push(data.roasSum / data.count);
          allValues.aov.push(data.aovSum / data.count);
          allValues.cpa.push(data.cpaSum / data.count);
        }
      }
      
      // Generate rows
      for (let position = 1; position <= 40; position++) {
        const data = positionData[position];
        const hasData = data.count > 0;
        
        const avgCtr = hasData ? (data.ctrSum / data.count).toFixed(2) : '0.00';
        const avgCvr = hasData ? (data.cvrSum / data.count).toFixed(2) : '0.00';
        const avgRoas = hasData ? (data.roasSum / data.count).toFixed(2) : '0.00';
        const avgAov = hasData ? (data.aovSum / data.count).toFixed(2) : '0.00';
        const avgCpa = hasData ? (data.cpaSum / data.count).toFixed(2) : '0.00';
        const avgCpc = hasData && data.clicks > 0 ? (data.cost / data.clicks).toFixed(2) : '0.00';
        
        const rowClass = position <= 3 ? 'ranking-position-' + position : 
                        position <= 8 ? 'ranking-position-4' :
                        position <= 14 ? 'ranking-position-9' : 'ranking-position-below-14';
        
        containerHTML += `
          <tr class="${rowClass}">
            <td>${position}</td>
            <td class="${getHeatMapClass(data.impressions, allValues.impressions, false)}">${hasData ? data.impressions.toLocaleString() : '-'}</td>
            <td class="${getHeatMapClass(data.clicks, allValues.clicks, false)}">${hasData ? data.clicks.toLocaleString() : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCpc), allValues.avgCpc, true)}">${hasData ? '$' + avgCpc : '-'}</td>
            <td class="${getHeatMapClass(data.cost, allValues.cost, true)}">${hasData ? '$' + data.cost.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(data.conversions, allValues.conversions, false)}">${hasData ? data.conversions.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(data.conversionValue, allValues.conversionValue, false)}">${hasData ? '$' + data.conversionValue.toFixed(2) : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCtr), allValues.ctr, false)}">${hasData ? avgCtr + '%' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCvr), allValues.cvr, false)}">${hasData ? avgCvr + '%' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgRoas), allValues.roas, false)}">${hasData ? avgRoas + 'x' : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgAov), allValues.aov, false)}">${hasData ? '$' + avgAov : '-'}</td>
            <td class="${getHeatMapClass(parseFloat(avgCpa), allValues.cpa, true)}">${hasData ? '$' + avgCpa : '-'}</td>
          </tr>
        `;
      }
    }
    
    containerHTML += `
          </tbody>
        </table>
    `;
    
    container.innerHTML = containerHTML;
    
// Add event listener for toggle
document.getElementById('rankingMapSegmentedToggle').addEventListener('change', function() {
  populateProductRankingMap(product, campaignFilter, channelFilter, deviceFilter);
});

// Add event listener for device filter
document.getElementById('rankingMapDeviceFilter').addEventListener('change', function() {
  const newDeviceFilter = this.value;
  populateProductRankingMap(product, campaignFilter, channelFilter, newDeviceFilter);
});
    
  }).catch(error => {
    console.error('[populateProductRankingMap] Error:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Error loading ranking map data</div>';
  });
}

// Helper function for heat map coloring
function getHeatMapClass(value, allValues, isReverse = false) {
  if (!value || allValues.length === 0 || allValues.every(v => !v)) return '';
  
  const validValues = allValues.filter(v => v > 0);
  if (validValues.length < 2) return '';
  
  const min = Math.min(...validValues);
  const max = Math.max(...validValues);
  
  if (min === max) return '';
  
  const percentile = (value - min) / (max - min);
  
  if (isReverse) {
    // For metrics where lower is better (CPC, CPA, Cost)
    if (percentile <= 0.25) return 'heat-map-best';
    if (percentile <= 0.5) return 'heat-map-good';
    if (percentile <= 0.75) return 'heat-map-poor';
    return 'heat-map-worst';
  } else {
    // For metrics where higher is better
    if (percentile >= 0.75) return 'heat-map-best';
    if (percentile >= 0.5) return 'heat-map-good';
    if (percentile >= 0.25) return 'heat-map-poor';
    return 'heat-map-worst';
  }
}

function setupProductInfoDateSelector() {
  const dateRangeContainer = document.getElementById('productInfoDateRange');
  if (!dateRangeContainer) return;
  
  const dateRange = dateRangeContainer.querySelector('div');
  const dropdown = document.getElementById('productInfoDateDropdown');
  const dateText = document.getElementById('productInfoDateText');
  
  if (!dateRange || !dropdown || !dateText) return;
  
  // Check if listeners are already attached
  if (dateRange.hasAttribute('data-listeners-attached')) {
    // Just update the text and return
    const days = window.selectedDateRangeDays || 7;
    const rangeLabels = {
      3: 'Last 3 days',
      7: 'Last 7 days',
      14: 'Last 14 days',
      30: 'Last 30 days',
      90: 'Last 90 days'
    };
    dateText.textContent = rangeLabels[days] || `Last ${days} days`;
    return;
  }
  
  // Mark that listeners are attached
  dateRange.setAttribute('data-listeners-attached', 'true');
  
  // Sync with global date range
  const days = window.selectedDateRangeDays || 7;
  const rangeLabels = {
    3: 'Last 3 days',
    7: 'Last 7 days',
    14: 'Last 14 days',
    30: 'Last 30 days',
    90: 'Last 90 days'
  };
  dateText.textContent = rangeLabels[days] || `Last ${days} days`;
  
  dateRange.addEventListener('click', function(e) {
    e.stopPropagation();
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  });
  
  dropdown.addEventListener('click', function(e) {
    const option = e.target.closest('.date-range-option');
    if (option) {
      const days = parseInt(option.getAttribute('data-days'));
      window.selectedDateRangeDays = days;
      
      // Update all date range displays
      dateText.textContent = option.textContent;
      const mainDateText = document.getElementById('dateRangeText');
      if (mainDateText) {
        mainDateText.textContent = option.textContent;
      }
      
      // Hide dropdown
      dropdown.style.display = 'none';
      
      // Update both containers
      if (window.currentProductInfoData) {
        const isChannelMode = !document.getElementById('chartModeToggle')?.checked;
        renderProductInfoCharts(window.currentProductInfoData, isChannelMode ? 'channel' : 'campaign');
        populateProductTables(window.currentProductInfoData, isChannelMode ? 'channel' : 'campaign');
      }
      
      // Update ranking map with new date range
      if (window.selectedGoogleAdsProduct) {
        const campaignFilter = document.getElementById('campaignNameFilter')?.value || 'all';
        const channelFilter = document.getElementById('channelTypeFilter')?.value || 'all';
        populateProductRankingMap(window.selectedGoogleAdsProduct, campaignFilter, channelFilter);
      }
      
      if (window.currentProductMetricsData) {
        const chartData = processMetricsData(
          window.currentProductMetricsData,
          document.getElementById('campaignNameFilter').value,
          document.getElementById('channelTypeFilter').value
        );
        renderProductMetricsChart('productMetricsChart', chartData);
        updateTrendsData();
      }
    }
  });
  
  // Close dropdown when clicking outside - use a named function to avoid duplicates
  if (!window.productInfoDateClickHandler) {
    window.productInfoDateClickHandler = function(e) {
      if (!dateRangeContainer.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    };
    document.addEventListener('click', window.productInfoDateClickHandler);
  }
  
  // Add hover effects
  dropdown.querySelectorAll('.date-range-option').forEach(option => {
    option.addEventListener('mouseenter', function() {
      this.style.backgroundColor = '#f1f3f4';
    });
    option.addEventListener('mouseleave', function() {
      this.style.backgroundColor = 'transparent';
    });
  });
}

function renderProductInfoCharts(productData, mode = 'channel') {
  const chartsGrid = document.getElementById('productInfoChartsGrid');
  const legendsContainer = document.getElementById('chartLegends');
  if (!chartsGrid) return;
  
  // Clear existing charts
  chartsGrid.innerHTML = '';
  legendsContainer.innerHTML = '';
  
  // Clean up previous charts
  if (window.productInfoCharts) {
    window.productInfoCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
    window.productInfoCharts = [];
  }
  
  // Filter by date range
  const daysToShow = window.selectedDateRangeDays || 7;
  const endDate = moment().startOf('day');
  const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
  
  const filteredData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = moment(row.Date, 'YYYY-MM-DD');
    return rowDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  // Aggregate data by mode
  const aggregatedData = {};
  
  filteredData.forEach(row => {
    const key = mode === 'channel' ? (row['Channel Type'] || 'Unknown') : (row['Campaign Name'] || 'Unknown');
    
    if (!aggregatedData[key]) {
      aggregatedData[key] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0
      };
    }
    
    aggregatedData[key].impressions += parseInt(String(row.Impressions || '0').replace(/,/g, '')) || 0;
    aggregatedData[key].clicks += parseInt(row.Clicks) || 0;
    aggregatedData[key].cost += parseFloat(String(row.Cost || '0').replace(/[$,]/g, '')) || 0;
    aggregatedData[key].conversions += parseFloat(row.Conversions) || 0;
    aggregatedData[key].conversionValue += parseFloat(String(row['Conversion Value'] || '0').replace(/[$,]/g, '')) || 0;
  });
  
  // Calculate totals
  const totals = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    conversionValue: 0
  };
  
  Object.values(aggregatedData).forEach(data => {
    totals.impressions += data.impressions;
    totals.clicks += data.clicks;
    totals.cost += data.cost;
    totals.conversions += data.conversions;
    totals.conversionValue += data.conversionValue;
  });
  
  // Calculate ROAS
  Object.keys(aggregatedData).forEach(key => {
    aggregatedData[key].roas = aggregatedData[key].cost > 0 ? 
      aggregatedData[key].conversionValue / aggregatedData[key].cost : 0;
  });
  totals.roas = totals.cost > 0 ? totals.conversionValue / totals.cost : 0;
  
  // Define consistent colors for each key
  const colorPalette = ['#007aff', '#34c759', '#ff3b30', '#af52de', '#ff9500', '#5ac8fa', '#ffcc00', '#ff2d55'];
  const keyColors = {};
  const sortedKeys = Object.keys(aggregatedData).sort();
  sortedKeys.forEach((key, index) => {
    keyColors[key] = colorPalette[index % colorPalette.length];
  });
  
  // Create legends
  sortedKeys.forEach(key => {
    const legendItem = document.createElement('div');
    legendItem.className = 'legend-item';
    legendItem.innerHTML = `
      <div class="legend-color" style="background-color: ${keyColors[key]};"></div>
      <span>${key}</span>
    `;
    legendsContainer.appendChild(legendItem);
  });
  
  // Define metrics
  const metrics = [
    { 
      key: 'impressions', 
      label: 'Impressions', 
      formatter: (val) => val.toLocaleString()
    },
    { 
      key: 'clicks', 
      label: 'Clicks', 
      formatter: (val) => val.toLocaleString()
    },
    { 
      key: 'cost', 
      label: 'Cost', 
      formatter: (val) => '$' + val.toFixed(2)
    },
    { 
      key: 'conversionValue', 
      label: 'Conv. Value', 
      formatter: (val) => '$' + val.toFixed(2)
    },
    { 
      key: 'roas', 
      label: 'ROAS', 
      formatter: (val) => val.toFixed(2) + 'x'
    }
  ];
  
  // Create charts for each metric
  metrics.forEach((metric, index) => {
    const chartItem = document.createElement('div');
    chartItem.className = 'radial-chart-item';
    
    const chartContainer = document.createElement('div');
    chartContainer.className = 'radial-chart-container';
    chartContainer.id = `productInfoChart${index}`;
    
    const chartLabel = document.createElement('div');
    chartLabel.className = 'radial-chart-label';
    chartLabel.textContent = metric.label;
    
    const chartSublabel = document.createElement('div');
    chartSublabel.className = 'radial-chart-sublabel';
    chartSublabel.textContent = metric.formatter(totals[metric.key]);
    
    chartItem.appendChild(chartContainer);
    chartItem.appendChild(chartLabel);
    chartItem.appendChild(chartSublabel);
    chartsGrid.appendChild(chartItem);
    
    // Create radial chart
    const series = [];
    const labels = [];
    const colors = [];
    
    sortedKeys.forEach(key => {
      const value = aggregatedData[key][metric.key];
      const percentage = totals[metric.key] > 0 ? (value / totals[metric.key]) * 100 : 0;
      series.push(percentage);
      labels.push(key);
      colors.push(keyColors[key]);
    });
    
    // Create pie chart
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
          return val > 5 ? val.toFixed(0) + '%' : '';
        },
        style: {
          fontSize: '12px',
          fontWeight: 600,
          colors: ['#fff']
        },
        dropShadow: {
          enabled: true,
          blur: 3,
          opacity: 0.8
        }
      },
      plotOptions: {
        pie: {
          dataLabels: {
            offset: -8,
            minAngleToShowLabel: 15
          }
        }
      },
      tooltip: {
        custom: function({ series, seriesIndex, dataPointIndex, w }) {
          let tooltipHtml = '<div style="padding: 10px; background: #fff; border: 1px solid #ddd; border-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">';
          tooltipHtml += `<div style="font-weight: 600; margin-bottom: 8px; color: #333;">${metric.label}</div>`;
          
          sortedKeys.forEach((key, idx) => {
            const value = aggregatedData[key][metric.key];
            const percentage = series[idx];
            const color = keyColors[key];
            
            tooltipHtml += `
              <div style="display: flex; align-items: center; margin-bottom: 4px;">
                <div style="width: 10px; height: 10px; background: ${color}; border-radius: 2px; margin-right: 8px;"></div>
                <div style="flex: 1; font-size: 12px;">
                  <span style="color: #666;">${key}:</span>
                  <span style="font-weight: 500; color: #333;"> ${metric.formatter(value)}</span>
                  <span style="color: #999;"> (${percentage.toFixed(1)}%)</span>
                </div>
              </div>
            `;
          });
          
          tooltipHtml += '</div>';
          return tooltipHtml;
        }
      }
    };
    
    const chart = new ApexCharts(chartContainer, options);
    chart.render();
    
    // Store chart reference for cleanup
    if (!window.productInfoCharts) {
      window.productInfoCharts = [];
    }
    window.productInfoCharts.push(chart);
  });
}

function populateProductTables(productData, mode = 'channel') {
  const tablesContainer = document.getElementById('product_tables');
  if (!tablesContainer) return;
  
  // Check if previous period is enabled
  const showPreviousPeriod = document.getElementById('previousPeriodToggle')?.checked || false;
  
  // Filter by date range
  const daysToShow = window.selectedDateRangeDays || 7;
  const endDate = moment().startOf('day');
  const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
  
  // Calculate previous period dates
  const prevEndDate = startDate.clone().subtract(1, 'days');
  const prevStartDate = prevEndDate.clone().subtract(daysToShow - 1, 'days');
  
  const filteredData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = moment(row.Date, 'YYYY-MM-DD');
    return rowDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  const prevFilteredData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = moment(row.Date, 'YYYY-MM-DD');
    return rowDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
  });
  
  // Aggregate data by mode and device
  const aggregatedData = {};
  const prevAggregatedData = {};
  const deviceData = {}; // Store device-specific data
  const prevDeviceData = {}; // Store previous period device-specific data
  
  // Helper function to process row data
  const processRow = (targetObj, row) => {
    targetObj.impressions += parseInt(String(row.Impressions || '0').replace(/,/g, '')) || 0;
    targetObj.clicks += parseInt(row.Clicks) || 0;
    targetObj.cost += parseFloat(String(row.Cost || '0').replace(/[$,]/g, '')) || 0;
    targetObj.conversions += parseFloat(row.Conversions) || 0;
    targetObj.conversionValue += parseFloat(String(row['Conversion Value'] || '0').replace(/[$,]/g, '')) || 0;
    targetObj.addToCartConv += parseFloat(row['Add to Cart Conv'] || 0);
    targetObj.addToCartValue += parseFloat(String(row['Add to Cart Conv Value'] || '0').replace(/[$,]/g, '')) || 0;
    targetObj.beginCheckoutConv += parseFloat(row['Begin Checkout Conv'] || 0);
    targetObj.beginCheckoutValue += parseFloat(String(row['Begin Checkout Conv Value'] || '0').replace(/[$,]/g, '')) || 0;
    targetObj.purchaseConv += parseFloat(row['Purchase Conv'] || 0);
    targetObj.purchaseValue += parseFloat(String(row['Purchase Conv Value'] || '0').replace(/[$,]/g, '')) || 0;
  };
  
  // Process current period data
  filteredData.forEach(row => {
    const key = mode === 'channel' ? (row['Channel Type'] || 'Unknown') : (row['Campaign Name'] || 'Unknown');
    const device = row.Device || 'Unknown';
    
    // Main aggregation (all devices)
    if (!aggregatedData[key]) {
      aggregatedData[key] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        addToCartConv: 0,
        addToCartValue: 0,
        beginCheckoutConv: 0,
        beginCheckoutValue: 0,
        purchaseConv: 0,
        purchaseValue: 0
      };
    }
    
    // Device-specific aggregation
    if (!deviceData[key]) {
      deviceData[key] = {};
    }
    if (!deviceData[key][device]) {
      deviceData[key][device] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        addToCartConv: 0,
        addToCartValue: 0,
        beginCheckoutConv: 0,
        beginCheckoutValue: 0,
        purchaseConv: 0,
        purchaseValue: 0
      };
    }
    
    processRow(aggregatedData[key], row);
    processRow(deviceData[key][device], row);
  });
  
  // Process previous period data
  prevFilteredData.forEach(row => {
    const key = mode === 'channel' ? (row['Channel Type'] || 'Unknown') : (row['Campaign Name'] || 'Unknown');
    const device = row.Device || 'Unknown';
    
    // Main aggregation (all devices)
    if (!prevAggregatedData[key]) {
      prevAggregatedData[key] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        addToCartConv: 0,
        addToCartValue: 0,
        beginCheckoutConv: 0,
        beginCheckoutValue: 0,
        purchaseConv: 0,
        purchaseValue: 0
      };
    }
    
    // Device-specific aggregation for previous period
    if (!prevDeviceData[key]) {
      prevDeviceData[key] = {};
    }
    if (!prevDeviceData[key][device]) {
      prevDeviceData[key][device] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        addToCartConv: 0,
        addToCartValue: 0,
        beginCheckoutConv: 0,
        beginCheckoutValue: 0,
        purchaseConv: 0,
        purchaseValue: 0
      };
    }
    
    processRow(prevAggregatedData[key], row);
    processRow(prevDeviceData[key][device], row);
  });
  
  // Calculate derived metrics
  const calculateMetrics = (data) => {
    Object.keys(data).forEach(key => {
      const item = data[key];
      item.ctr = item.impressions > 0 ? (item.clicks / item.impressions) * 100 : 0;
      item.cvr = item.clicks > 0 ? (item.conversions / item.clicks) * 100 : 0;
      item.roas = item.cost > 0 ? item.conversionValue / item.cost : 0;
      item.aov = item.conversions > 0 ? item.conversionValue / item.conversions : 0;
      item.cpa = item.conversions > 0 ? item.cost / item.conversions : 0;
    });
  };
  
  calculateMetrics(aggregatedData);
  calculateMetrics(prevAggregatedData);
  
  Object.keys(deviceData).forEach(key => {
    calculateMetrics(deviceData[key]);
  });
  
  Object.keys(prevDeviceData).forEach(key => {
    calculateMetrics(prevDeviceData[key]);
  });
  
  // Store current sort state
  if (!window.productTableSort) {
    window.productTableSort = { column: 'impressions', ascending: false };
  }
  
  // Sort data
  const sortedKeys = Object.keys(aggregatedData).sort((a, b) => {
    const aData = aggregatedData[a];
    const bData = aggregatedData[b];
    let aVal, bVal;
    
    switch(window.productTableSort.column) {
      case 'key': aVal = a; bVal = b; break;
      default: aVal = aData[window.productTableSort.column]; bVal = bData[window.productTableSort.column];
    }
    
    if (window.productTableSort.ascending) {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Find max impressions for bar scaling
  const maxImpressions = Math.max(...Object.values(aggregatedData).map(d => d.impressions));
  
  // Find ROAS range for coloring
  const roasValues = Object.values(aggregatedData).map(d => d.roas).filter(r => r > 0);
  const maxRoas = Math.max(...roasValues);
  const minRoas = Math.min(...roasValues);
  const midRoas = (maxRoas + minRoas) / 2;
  
  // Helper function to format value with trend
  function formatValueWithTrend(current, previous, format = 'number', isReverse = false) {
    let formattedCurrent = '';
    let trendHtml = '';
    
    // Format current value
    switch (format) {
      case 'currency':
        formattedCurrent = '$' + current.toFixed(2);
        break;
      case 'percentage':
        formattedCurrent = current.toFixed(2) + '%';
        break;
      case 'number':
        formattedCurrent = current.toLocaleString();
        break;
      case 'decimal':
        formattedCurrent = current.toFixed(2);
        break;
      case 'roas':
        formattedCurrent = current.toFixed(2) + 'x';
        break;
    }
    
    // Calculate trend if showing previous period
    if (showPreviousPeriod) {
      const change = current - previous;
      let trendClass = 'table-trend-neutral';
      let arrow = '—';
      
      // For CPA, lower is better (reverse logic)
      if (isReverse) {
        if (change < 0) {
          trendClass = 'table-trend-up';
          arrow = '▲';
        } else if (change > 0) {
          trendClass = 'table-trend-down';
          arrow = '▼';
        }
      } else {
        if (change > 0) {
          trendClass = 'table-trend-up';
          arrow = '▲';
        } else if (change < 0) {
          trendClass = 'table-trend-down';
          arrow = '▼';
        }
      }
      
      let formattedChange = '';
      switch (format) {
        case 'currency':
          formattedChange = '$' + Math.abs(change).toFixed(2);
          break;
        case 'percentage':
          formattedChange = Math.abs(change).toFixed(2) + '%';
          break;
        case 'number':
          formattedChange = Math.abs(change).toLocaleString();
          break;
        case 'decimal':
          formattedChange = Math.abs(change).toFixed(2);
          break;
        case 'roas':
          formattedChange = Math.abs(change).toFixed(2) + 'x';
          break;
      }
      
      trendHtml = `<div class="table-trend-value ${trendClass}">
        <span class="table-trend-arrow">${arrow}</span>
        <span>${formattedChange}</span>
      </div>`;
    }
    
    return showPreviousPeriod ? 
      `<div class="table-value-wrapper">
        <div class="table-current-value">${formattedCurrent}</div>
        ${trendHtml}
      </div>` : formattedCurrent;
  }
  
  // Create table HTML with device rows
  let tableHTML = `
    <div class="product-tables-content">
      <table class="product-metrics-table" id="productMetricsTableElement">
        <thead>
          <tr>
            <th data-sort="key" class="sortable">${mode === 'channel' ? 'Channel Type' : 'Campaign'} <span class="sort-indicator"></span></th>
            <th data-sort="impressions" class="sortable">Impressions <span class="sort-indicator"></span></th>
            <th data-sort="clicks" class="sortable">Clicks <span class="sort-indicator"></span></th>
            <th data-sort="cost" class="sortable">Cost <span class="sort-indicator"></span></th>
            <th data-sort="conversions" class="sortable">Conversions <span class="sort-indicator"></span></th>
            <th data-sort="conversionValue" class="sortable">Conv. Value <span class="sort-indicator"></span></th>
            <th data-sort="ctr" class="sortable">CTR <span class="sort-indicator"></span></th>
            <th data-sort="cvr" class="sortable">CVR <span class="sort-indicator"></span></th>
            <th data-sort="roas" class="sortable">ROAS <span class="sort-indicator"></span></th>
            <th data-sort="aov" class="sortable">AOV <span class="sort-indicator"></span></th>
            <th data-sort="cpa" class="sortable">CPA <span class="sort-indicator"></span></th>
          </tr>
        </thead>
        <tbody>
  `;
  
  sortedKeys.forEach(key => {
    const data = aggregatedData[key];
    const prevData = prevAggregatedData[key] || {
      impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0,
      ctr: 0, cvr: 0, roas: 0, aov: 0, cpa: 0
    };
    
    const impressionBarWidth = maxImpressions > 0 ? (data.impressions / maxImpressions) * 100 : 0;
    
    // Calculate ROAS background color
    let roasStyle = '';
    if (data.roas > 0) {
      if (data.roas >= midRoas) {
        const intensity = Math.min((data.roas - midRoas) / (maxRoas - midRoas) * 0.4, 0.4);
        roasStyle = `background-color: rgba(76, 175, 80, ${intensity});`;
      } else {
        const intensity = Math.min((midRoas - data.roas) / (midRoas - minRoas) * 0.4, 0.4);
        roasStyle = `background-color: rgba(244, 67, 54, ${intensity});`;
      }
    }
    
    // Main row
    tableHTML += `
      <tr class="main-row" data-key="${key}">
<td class="clickable-campaign" data-value="${key}" data-mode="${mode}">
  ${key}
</td>
        <td>
          <div class="impression-bar-container">
            <div class="impression-bar" style="width: ${impressionBarWidth}%">
              <span class="impression-value">${data.impressions.toLocaleString()}</span>
            </div>
          </div>
          ${showPreviousPeriod ? formatValueWithTrend(data.impressions, prevData.impressions, 'number').split('</div>')[1] : ''}
        </td>
        <td>${formatValueWithTrend(data.clicks, prevData.clicks, 'number')}</td>
        <td>${formatValueWithTrend(data.cost, prevData.cost, 'currency')}</td>
        <td>${formatValueWithTrend(data.conversions, prevData.conversions, 'decimal')}</td>
        <td>${formatValueWithTrend(data.conversionValue, prevData.conversionValue, 'currency')}</td>
        <td>${formatValueWithTrend(data.ctr, prevData.ctr, 'percentage')}</td>
        <td>${formatValueWithTrend(data.cvr, prevData.cvr, 'percentage')}</td>
        <td style="${roasStyle}">${formatValueWithTrend(data.roas, prevData.roas, 'roas')}</td>
        <td>${formatValueWithTrend(data.aov, prevData.aov, 'currency')}</td>
        <td>${formatValueWithTrend(data.cpa, prevData.cpa, 'currency', true)}</td>
      </tr>
    `;
    
    // Device rows
    if (deviceData[key]) {
      const deviceOrder = ['DESKTOP', 'MOBILE', 'TABLET'];
      deviceOrder.forEach(device => {
        if (deviceData[key][device]) {
          const deviceInfo = deviceData[key][device];
          const prevDeviceInfo = prevDeviceData[key] && prevDeviceData[key][device] ? prevDeviceData[key][device] : {
            impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0,
            ctr: 0, cvr: 0, roas: 0, aov: 0, cpa: 0
          };
          
          const deviceIcon = device === 'DESKTOP' ? '💻' : device === 'MOBILE' ? '📱' : '📋';
          
          tableHTML += `
            <tr class="device-row" data-parent="${key}">
              <td style="padding-left: 40px; font-size: 12px; color: #666;">
                ${deviceIcon} ${device}
              </td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.impressions, prevDeviceInfo.impressions, 'number')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.clicks, prevDeviceInfo.clicks, 'number')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.cost, prevDeviceInfo.cost, 'currency')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.conversions, prevDeviceInfo.conversions, 'decimal')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.conversionValue, prevDeviceInfo.conversionValue, 'currency')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.ctr, prevDeviceInfo.ctr, 'percentage')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.cvr, prevDeviceInfo.cvr, 'percentage')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.roas, prevDeviceInfo.roas, 'roas')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.aov, prevDeviceInfo.aov, 'currency')}</td>
              <td style="font-size: 12px;">${formatValueWithTrend(deviceInfo.cpa, prevDeviceInfo.cpa, 'currency', true)}</td>
            </tr>
          `;
        }
      });
    }
  });
  
  tableHTML += `
        </tbody>
      </table>
    </div>
  `;
  
  tablesContainer.innerHTML = tableHTML;
/*  
  // Add expand/collapse functionality
  tablesContainer.querySelectorAll('.main-row').forEach(row => {
    row.addEventListener('click', function(e) {
      if (!e.target.classList.contains('clickable-campaign')) {
        const key = this.getAttribute('data-key');
        const deviceRows = tablesContainer.querySelectorAll(`tr[data-parent="${key}"]`);
        const expandToggle = this.querySelector('.expand-toggle');
        
        deviceRows.forEach(deviceRow => {
          if (deviceRow.style.display === 'none') {
            deviceRow.style.display = 'table-row';
            expandToggle.textContent = '▼';
          } else {
            deviceRow.style.display = 'none';
            expandToggle.textContent = '▶';
          }
        });
      }
    });
  });
  */
  // Add event listeners for sorting
  const headers = tablesContainer.querySelectorAll('th.sortable');
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortColumn = this.getAttribute('data-sort');
      if (window.productTableSort.column === sortColumn) {
        window.productTableSort.ascending = !window.productTableSort.ascending;
      } else {
        window.productTableSort.column = sortColumn;
        window.productTableSort.ascending = false;
      }
      populateProductTables(productData, mode);
    });
  });
  
  // Show sort indicator
  const currentHeader = tablesContainer.querySelector(`th[data-sort="${window.productTableSort.column}"]`);
  if (currentHeader) {
    const indicator = currentHeader.querySelector('.sort-indicator');
    indicator.textContent = window.productTableSort.ascending ? ' ▲' : ' ▼';
  }
  
  // Add event listeners for clickable campaigns
  const clickableCells = tablesContainer.querySelectorAll('.clickable-campaign');
  clickableCells.forEach(cell => {
    cell.addEventListener('click', function() {
      const value = this.getAttribute('data-value');
      const cellMode = this.getAttribute('data-mode');
      
      // Update the appropriate filter in product_metrics
      if (cellMode === 'campaign') {
        const campaignFilter = document.getElementById('campaignNameFilter');
        if (campaignFilter) {
          campaignFilter.value = value;
          // Trigger change event to update the chart
          campaignFilter.dispatchEvent(new Event('change'));
        }
      } else {
        const channelFilter = document.getElementById('channelTypeFilter');
        if (channelFilter) {
          channelFilter.value = value;
          // Trigger change event to update the chart
          channelFilter.dispatchEvent(new Event('change'));
        }
      }
    });
  });
  
  // Add styling for device rows if not already added
  if (!document.getElementById('device-row-styles')) {
    const style = document.createElement('style');
    style.id = 'device-row-styles';
    style.textContent = `
      .device-row {
        background-color: #f8f9fa;
        border-left: 3px solid #007aff;
      }
      .device-row:hover {
        background-color: #e9ecef;
      }
      .main-row {
        cursor: pointer;
      }
      .main-row:hover {
        background-color: #f0f0f0;
      }
    `;
    document.head.appendChild(style);
  }
}

function processMetricsData(productData, campaignFilter = 'all', channelFilter = 'all', deviceFilter = 'all') {
  // Get selected date range
  const daysToShow = window.selectedDateRangeDays || 7;
  const endDate = moment().startOf('day');
  const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
  
  // Calculate previous period dates
  const prevEndDate = startDate.clone().subtract(1, 'days');
  const prevStartDate = prevEndDate.clone().subtract(daysToShow - 1, 'days');
  
  // Filter data based on selections and date range
  let filteredData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = moment(row.Date, 'YYYY-MM-DD');
    return rowDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  // Get previous period data
  let prevFilteredData = productData.filter(row => {
    if (!row.Date) return false;
    const rowDate = moment(row.Date, 'YYYY-MM-DD');
    return rowDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
  });
  
  // Apply filters
  if (campaignFilter !== 'all') {
    filteredData = filteredData.filter(row => row['Campaign Name'] === campaignFilter);
    prevFilteredData = prevFilteredData.filter(row => row['Campaign Name'] === campaignFilter);
  }
  if (channelFilter !== 'all') {
    filteredData = filteredData.filter(row => row['Channel Type'] === channelFilter);
    prevFilteredData = prevFilteredData.filter(row => row['Channel Type'] === channelFilter);
  }
  
  // Apply device filter
  if (deviceFilter !== 'all') {
    const deviceMap = {
      'desk': 'DESKTOP',
      'mob': 'MOBILE',
      'tab': 'TABLET'
    };
    const deviceValue = deviceMap[deviceFilter];
    if (deviceValue) {
      filteredData = filteredData.filter(row => row.Device === deviceValue);
      prevFilteredData = prevFilteredData.filter(row => row.Device === deviceValue);
    }
  }
  
  // Group by date and sum metrics
  const groupedData = {};
  const prevGroupedData = {};
  
  // Process current period
  filteredData.forEach(row => {
    const date = row.Date;
    if (!date) return;
    
    if (!groupedData[date]) {
      groupedData[date] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        ctr: 0,
        cvr: 0,
        roas: 0,
        aov: 0,
        cpa: 0,
        ranking: null,
        visibility: 0,
        count: 0
      };
    }
    
    const group = groupedData[date];
    
    // Parse and sum numeric values
    group.impressions += parseInt(String(row.Impressions || '0').replace(/,/g, '')) || 0;
    group.clicks += parseInt(row.Clicks) || 0;
    group.cost += parseFloat(String(row.Cost || '0').replace(/[$,]/g, '')) || 0;
    group.conversions += parseFloat(row.Conversions) || 0;
    group.conversionValue += parseFloat(String(row['Conversion Value'] || '0').replace(/[$,]/g, '')) || 0;
    group.count++;
  });
  
  // Process previous period
  prevFilteredData.forEach(row => {
    const date = row.Date;
    if (!date) return;
    
    if (!prevGroupedData[date]) {
      prevGroupedData[date] = {
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        conversionValue: 0,
        count: 0
      };
    }
    
    const group = prevGroupedData[date];
    
    group.impressions += parseInt(String(row.Impressions || '0').replace(/,/g, '')) || 0;
    group.clicks += parseInt(row.Clicks) || 0;
    group.cost += parseFloat(String(row.Cost || '0').replace(/[$,]/g, '')) || 0;
    group.conversions += parseFloat(row.Conversions) || 0;
    group.conversionValue += parseFloat(String(row['Conversion Value'] || '0').replace(/[$,]/g, '')) || 0;
    group.count++;
  });
  
  // Calculate totals for trend comparison
  const currentTotals = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    conversionValue: 0,
    ranking: 0,
    visibility: 0,
    rankCount: 0,
    visCount: 0
  };
  
  const prevTotals = {
    impressions: 0,
    clicks: 0,
    cost: 0,
    conversions: 0,
    conversionValue: 0,
    ranking: 0,
    visibility: 0,
    rankCount: 0,
    visCount: 0
  };
  
  // Get ranking and visibility data from the same source as overview mode
  if (window.selectedGoogleAdsProduct) {
    console.log('[DEBUG] Selected Product:', window.selectedGoogleAdsProduct);
    
    const productRecords = getProductRecords(window.selectedGoogleAdsProduct);
    console.log('[DEBUG] Total Product Records:', productRecords.length);
    
    // Log first few records to see structure
    if (productRecords.length > 0) {
      console.log('[DEBUG] Sample Product Record Structure:', productRecords[0]);
      console.log('[DEBUG] Record has device field?', 'device' in productRecords[0]);
      
      // Check what device values exist
      const deviceValues = [...new Set(productRecords.map(r => r.device))];
      console.log('[DEBUG] Unique device values in records:', deviceValues);
      
      // Check historical data structure
      if (productRecords[0].historical_data && productRecords[0].historical_data.length > 0) {
        console.log('[DEBUG] Sample Historical Data Item:', productRecords[0].historical_data[0]);
      }
    }
    
    // Log the device filter being applied
    console.log('[DEBUG] Current device filter:', deviceFilter);
    
    Object.keys(groupedData).forEach(date => {
      const group = groupedData[date];
      
      // Calculate derived metrics and round to 2 decimal places
      group.ctr = group.impressions > 0 ? Math.round((group.clicks / group.impressions) * 100 * 100) / 100 : 0;
      group.cvr = group.clicks > 0 ? Math.round((group.conversions / group.clicks) * 100 * 100) / 100 : 0;
      group.roas = group.cost > 0 ? Math.round((group.conversionValue / group.cost) * 100) / 100 : 0;
      group.aov = group.conversions > 0 ? Math.round((group.conversionValue / group.conversions) * 100) / 100 : 0;
      group.cpa = group.conversions > 0 ? Math.round((group.cost / group.conversions) * 100) / 100 : 0;
      
      // Round cost and conversion values to 2 decimal places
      group.cost = Math.round(group.cost * 100) / 100;
      group.conversionValue = Math.round(group.conversionValue * 100) / 100;
      
      // Get ranking and visibility from product records for this specific date
      let totalRank = 0, totalVis = 0, rankCount = 0, visCount = 0;
      
      // First, let's see what records we're working with for this date
      const recordsWithDataForDate = [];
      
      productRecords.forEach(record => {
        if (record.historical_data && Array.isArray(record.historical_data)) {
          const histItem = record.historical_data.find(item => item.date?.value === date);
          
          if (histItem) {
            recordsWithDataForDate.push({
              device: record.device,
              searchTerm: record.q,
              location: record.location_requested,
              avgPosition: histItem.avg_position,
              visibility: histItem.visibility
            });
          }
          
          // Get ranking data
          if (histItem?.avg_position != null) {
            // Apply device filter if needed
            if (deviceFilter === 'all' || !record.device) {
              totalRank += parseFloat(histItem.avg_position);
              rankCount++;
            } else {
              const deviceMap = {
                'desk': 'desktop',
                'mob': 'mobile',
                'tab': 'tablet'
              };
              const filterDevice = deviceMap[deviceFilter];
              
              // Check if record device matches filter (case-insensitive)
              if (record.device && record.device.toLowerCase().includes(filterDevice)) {
                totalRank += parseFloat(histItem.avg_position);
                rankCount++;
                console.log(`[DEBUG] Matched device ${record.device} with filter ${filterDevice}`);
              }
            }
          }
          
          // Similar logic for visibility...
          if (histItem?.visibility != null) {
            if (deviceFilter === 'all' || !record.device) {
              const dailyVisibility = parseFloat(histItem.visibility);
              totalVis += dailyVisibility;
              visCount++;
            } else {
              const deviceMap = {
                'desk': 'desktop',
                'mob': 'mobile',
                'tab': 'tablet'
              };
              const filterDevice = deviceMap[deviceFilter];
              
              if (record.device && record.device.toLowerCase().includes(filterDevice)) {
                const dailyVisibility = parseFloat(histItem.visibility);
                totalVis += dailyVisibility;
                visCount++;
              }
            }
          }
        }
      });
      
      // Log what we found for this date
      if (recordsWithDataForDate.length > 0 && date === Object.keys(groupedData)[0]) { // Log only for first date
        console.log(`[DEBUG] Records with data for ${date}:`, recordsWithDataForDate);
        console.log(`[DEBUG] Ranking counts - Total: ${rankCount}, Visibility counts - Total: ${visCount}`);
      }
      
      // Set ranking (null if no data available)
      group.ranking = rankCount > 0 ? Math.round((totalRank / rankCount) * 100) / 100 : null;
      
      // Set visibility (0 if no data available)
      group.visibility = visCount > 0 ? Math.round((totalVis / visCount) * 100 * 10) / 10 : 0;
      
      // Add to current totals
      currentTotals.impressions += group.impressions;
      currentTotals.clicks += group.clicks;
      currentTotals.cost += group.cost;
      currentTotals.conversions += group.conversions;
      currentTotals.conversionValue += group.conversionValue;
      if (group.ranking !== null) {
        currentTotals.ranking += group.ranking;
        currentTotals.rankCount++;
      }
      currentTotals.visibility += group.visibility;
      currentTotals.visCount++;
    });
    
    // Calculate previous period ranking and visibility
    productRecords.forEach(record => {
      if (record.historical_data && Array.isArray(record.historical_data)) {
        record.historical_data.forEach(item => {
          if (item.date?.value) {
            const itemDate = moment(item.date.value, 'YYYY-MM-DD');
            if (itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]')) {
              if (item.avg_position != null) {
                prevTotals.ranking += parseFloat(item.avg_position);
                prevTotals.rankCount++;
              }
              if (item.visibility != null) {
                prevTotals.visibility += parseFloat(item.visibility) * 100;
                prevTotals.visCount++;
              }
            }
          }
        });
      }
    });
  }
  
  // Sum previous period metrics
  Object.values(prevGroupedData).forEach(group => {
    prevTotals.impressions += group.impressions;
    prevTotals.clicks += group.clicks;
    prevTotals.cost += group.cost;
    prevTotals.conversions += group.conversions;
    prevTotals.conversionValue += group.conversionValue;
  });
  
  // Store totals for trends calculation
  window.currentPeriodTotals = currentTotals;
  window.previousPeriodTotals = prevTotals;
  
  // Convert to sorted array
  const sortedDates = Object.keys(groupedData).sort();
  // If no data, return empty structure
if (sortedDates.length === 0) {
  return {
    dates: [],
    impressions: [],
    clicks: [],
    cost: [],
    conversions: [],
    conversionValue: [],
    ctr: [],
    cvr: [],
    roas: [],
    aov: [],
    cpa: [],
    ranking: [],
    visibility: []
  };
}
  const chartData = {
    dates: sortedDates,
    impressions: [],
    clicks: [],
    cost: [],
    conversions: [],
    conversionValue: [],
    ctr: [],
    cvr: [],
    roas: [],
    aov: [],
    cpa: [],
    ranking: [],
    visibility: []
  };
  
  sortedDates.forEach(date => {
    const group = groupedData[date];
    chartData.impressions.push(group.impressions);
    chartData.clicks.push(group.clicks);
    chartData.cost.push(group.cost);
    chartData.conversions.push(group.conversions);
    chartData.conversionValue.push(group.conversionValue);
    chartData.ctr.push(group.ctr);
    chartData.cvr.push(group.cvr);
    chartData.roas.push(group.roas);
    chartData.aov.push(group.aov);
    chartData.cpa.push(group.cpa);
    chartData.ranking.push(group.ranking);
    chartData.visibility.push(group.visibility);
  });
  
  return chartData;
}

function updateTrendsData() {
  const trendsContent = document.getElementById('trends-content');
  if (!trendsContent || !window.currentPeriodTotals || !window.previousPeriodTotals) return;
  
  const current = window.currentPeriodTotals;
  const prev = window.previousPeriodTotals;
  
  // Define all metrics
  const allMetrics = [
    { 
      key: 'impressions', 
      label: 'Impressions', 
      value: current.impressions,
      prevValue: prev.impressions,
      format: 'number'
    },
    { 
      key: 'clicks', 
      label: 'Clicks', 
      value: current.clicks,
      prevValue: prev.clicks,
      format: 'number'
    },
    { 
      key: 'cost', 
      label: 'Cost', 
      value: current.cost,
      prevValue: prev.cost,
      format: 'currency'
    },
    { 
      key: 'conversions', 
      label: 'Conversions', 
      value: current.conversions,
      prevValue: prev.conversions,
      format: 'decimal'
    },
    { 
      key: 'conversionValue', 
      label: 'Conversion Value', 
      value: current.conversionValue,
      prevValue: prev.conversionValue,
      format: 'currency'
    },
    { 
      key: 'ctr', 
      label: 'CTR', 
      value: current.clicks > 0 ? (current.clicks / current.impressions) * 100 : 0,
      prevValue: prev.clicks > 0 ? (prev.clicks / prev.impressions) * 100 : 0,
      format: 'percentage'
    },
    { 
      key: 'cvr', 
      label: 'CVR', 
      value: current.clicks > 0 ? (current.conversions / current.clicks) * 100 : 0,
      prevValue: prev.clicks > 0 ? (prev.conversions / prev.clicks) * 100 : 0,
      format: 'percentage'
    },
    { 
      key: 'roas', 
      label: 'ROAS', 
      value: current.cost > 0 ? current.conversionValue / current.cost : 0,
      prevValue: prev.cost > 0 ? prev.conversionValue / prev.cost : 0,
      format: 'decimal'
    },
    { 
      key: 'aov', 
      label: 'AOV', 
      value: current.conversions > 0 ? current.conversionValue / current.conversions : 0,
      prevValue: prev.conversions > 0 ? prev.conversionValue / prev.conversions : 0,
      format: 'currency'
    },
    { 
      key: 'cpa', 
      label: 'CPA', 
      value: current.conversions > 0 ? current.cost / current.conversions : 0,
      prevValue: prev.conversions > 0 ? prev.cost / prev.conversions : 0,
      format: 'currency'
    },
    { 
      key: 'ranking', 
      label: 'Avg Ranking', 
      value: current.rankCount > 0 ? current.ranking / current.rankCount : 0,
      prevValue: prev.rankCount > 0 ? prev.ranking / prev.rankCount : 0,
      format: 'ranking'
    },
    { 
      key: 'visibility', 
      label: 'Visibility', 
      value: current.visCount > 0 ? current.visibility / current.visCount : 0,
      prevValue: prev.visCount > 0 ? prev.visibility / prev.visCount : 0,
      format: 'percentage'
    }
  ];
  
  // Initialize default preferences if not set
  if (!window.userTrendPreferences) {
    window.userTrendPreferences = {};
    // Default to first 8 metrics
    allMetrics.slice(0, 8).forEach(metric => {
      window.userTrendPreferences[metric.key] = true;
    });
  }
  
  // Filter metrics based on user preferences
  const selectedMetrics = allMetrics.filter(metric => window.userTrendPreferences[metric.key]);
  
  // Update container height if more than 8 metrics
  const trendsContainer = document.getElementById('google-ads-trends-container');
  if (trendsContainer) {
    if (selectedMetrics.length > 8) {
      trendsContainer.classList.add('expanded');
    } else {
      trendsContainer.classList.remove('expanded');
    }
  }
  
  // Generate HTML for selected metrics
  let html = '';
  
  selectedMetrics.forEach(metric => {
    const change = metric.value - metric.prevValue;
    const percentChange = metric.prevValue > 0 ? (change / metric.prevValue) * 100 : 0;
    
    let formattedValue = '';
    let formattedChange = '';
    let trendClass = 'trend-neutral';
    let arrow = '—';
    
    // Format current value
    switch (metric.format) {
      case 'currency':
        formattedValue = '$' + metric.value.toFixed(2);
        formattedChange = '$' + Math.abs(change).toFixed(2);
        break;
      case 'percentage':
        formattedValue = metric.value.toFixed(2) + '%';
        formattedChange = Math.abs(change).toFixed(2) + '%';
        break;
      case 'number':
        formattedValue = metric.value.toLocaleString();
        formattedChange = Math.abs(change).toLocaleString();
        break;
      case 'decimal':
        formattedValue = metric.value.toFixed(2);
        formattedChange = Math.abs(change).toFixed(2);
        break;
      case 'ranking':
        formattedValue = metric.value.toFixed(1);
        formattedChange = Math.abs(change).toFixed(1);
        break;
    }
    
    // Determine trend direction (reverse for ranking - lower is better)
    if (metric.key === 'ranking' || metric.key === 'cpa') {
      if (change < 0) {
        trendClass = 'trend-up';
        arrow = '▲';
      } else if (change > 0) {
        trendClass = 'trend-down';
        arrow = '▼';
      }
    } else {
      if (change > 0) {
        trendClass = 'trend-up';
        arrow = '▲';
      } else if (change < 0) {
        trendClass = 'trend-down';
        arrow = '▼';
      }
    }
    
    html += `
      <div class="trend-item">
        <div class="trend-metric-name">${metric.label}</div>
        <div class="trend-values">
          <span class="trend-current-value">${formattedValue}</span>
          <span class="trend-change ${trendClass}">
            <span class="trend-arrow">${arrow}</span>
            <span>${formattedChange}</span>
          </span>
        </div>
      </div>
    `;
  });
  
  trendsContent.innerHTML = html;
  
  // Update metrics selector popup
  updateMetricsSelectorPopup(allMetrics);
}

function updateMetricsSelectorPopup(allMetrics) {
  const container = document.getElementById('metricsListContainer');
  if (!container) return;
  
  let html = '';
  allMetrics.forEach(metric => {
    const isChecked = window.userTrendPreferences[metric.key] || false;
    html += `
      <div class="metric-selector-item">
        <label class="metric-toggle-switch">
          <input type="checkbox" data-metric="${metric.key}" ${isChecked ? 'checked' : ''}>
          <span class="metric-toggle-slider"></span>
        </label>
        <span>${metric.label}</span>
      </div>
    `;
  });
  
  container.innerHTML = html;
  
  // Add event listeners to toggles
  container.querySelectorAll('input[data-metric]').forEach(toggle => {
    toggle.addEventListener('change', function() {
      const metricKey = this.getAttribute('data-metric');
      window.userTrendPreferences[metricKey] = this.checked;
      updateTrendsData();
    });
  });
}

function renderProductMetricsChart(containerId, chartData) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  container.innerHTML = '';
  
  // Create metric toggle buttons
  const toggleContainer = document.createElement('div');
  toggleContainer.style.cssText = `
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
    padding: 15px;
    background-color: #f8f9fa;
    border-radius: 8px;
    border: 1px solid #dee2e6;
  `;

  // Define metrics configuration with individual y-axes
  const metricsConfig = [
    { key: 'impressions', label: 'Impressions', color: '#007aff', yAxisID: 'y1', active: false, type: 'bar' },
    { key: 'clicks', label: 'Clicks', color: '#34c759', yAxisID: 'y2', active: false, type: 'bar' },
    { key: 'cost', label: 'Cost ($)', color: '#ff3b30', yAxisID: 'y3', active: false, type: 'line' },
    { key: 'conversions', label: 'Conversions', color: '#ff9500', yAxisID: 'y4', active: true, type: 'line' },
    { key: 'conversionValue', label: 'Conversion Value ($)', color: '#af52de', yAxisID: 'y5', active: false, type: 'line' },
    { key: 'ctr', label: 'CTR (%)', color: '#5ac8fa', yAxisID: 'y6', active: false, type: 'line' },
    { key: 'cvr', label: 'CVR (%)', color: '#ffcc00', yAxisID: 'y7', active: false, type: 'line' },
    { key: 'roas', label: 'ROAS', color: '#ff2d55', yAxisID: 'y8', active: false, type: 'line' },
    { key: 'aov', label: 'AOV ($)', color: '#00c7be', yAxisID: 'y9', active: false, type: 'line' },
    { key: 'cpa', label: 'CPA ($)', color: '#30b0c7', yAxisID: 'y10', active: false, type: 'line' },
    { key: 'ranking', label: 'Avg Ranking', color: '#8e44ad', yAxisID: 'y11', active: true, type: 'line' },
    { key: 'visibility', label: 'Visibility (%)', color: '#87CEEB', yAxisID: 'y12', active: true, type: 'line', fill: true }
  ];

  // Apply user preferences if they exist
  if (window.userMetricPreferences) {
    metricsConfig.forEach(metric => {
      metric.active = window.userMetricPreferences[metric.key] || false;
    });
  }
  
  // Create toggle buttons
  metricsConfig.forEach(metric => {
    const button = document.createElement('button');
    button.className = `metric-toggle-btn ${metric.active ? 'active' : 'inactive'}`;
    button.textContent = metric.label;
    button.style.cssText = `
      padding: 6px 12px;
      border-radius: 12px;
      border: 2px solid ${metric.color};
      background-color: ${metric.active ? metric.color : 'white'};
      color: ${metric.active ? 'white' : metric.color};
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      user-select: none;
    `;
    
    button.addEventListener('click', () => {
      metric.active = !metric.active;
      button.className = `metric-toggle-btn ${metric.active ? 'active' : 'inactive'}`;
      button.style.backgroundColor = metric.active ? metric.color : 'white';
      button.style.color = metric.active ? 'white' : metric.color;
      
      // Save user preferences
      if (!window.userMetricPreferences) {
        window.userMetricPreferences = {};
      }
      window.userMetricPreferences[metric.key] = metric.active;
      
      // Update chart
      updateChartVisibility();
    });
    
    toggleContainer.appendChild(button);
  });
  
  container.appendChild(toggleContainer);
  
  // Create canvas for chart
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '450px';
  canvas.style.maxHeight = '450px';
  container.appendChild(canvas);
  
  // Create datasets
  const datasets = [];
  
  // Special handling for ranking - create separate lines for mobile and desktop
  const rankingMetric = metricsConfig.find(m => m.key === 'ranking');
  if (rankingMetric) {
    // Get ranking data from product records separated by device
    const rankingDataByDevice = getRankingDataByDevice(chartData.dates);
    
    // Desktop ranking line
    datasets.push({
      label: 'Desktop Ranking',
      data: rankingDataByDevice.desktop,
      borderColor: '#6B46C1', // Purple for desktop
      backgroundColor: '#6B46C1' + '20',
      borderWidth: 4,
      borderDash: [0, 0], // Solid line
      pointRadius: 4,
      pointHoverRadius: 6,
      pointStyle: 'rect', // Square points for desktop
      tension: 0.3,
      yAxisID: rankingMetric.yAxisID,
      type: 'line',
      fill: false,
      hidden: !rankingMetric.active,
      metricKey: 'ranking_desktop',
      isRanking: true
    });
    
    // Mobile ranking line
    datasets.push({
      label: 'Mobile Ranking',
      data: rankingDataByDevice.mobile,
      borderColor: '#E11D48', // Red for mobile
      backgroundColor: '#E11D48' + '20',
      borderWidth: 4,
      borderDash: [8, 4], // Dashed line for mobile
      pointRadius: 4,
      pointHoverRadius: 6,
      pointStyle: 'circle', // Circle points for mobile
      tension: 0.3,
      yAxisID: rankingMetric.yAxisID,
      type: 'line',
      fill: false,
      hidden: !rankingMetric.active,
      metricKey: 'ranking_mobile',
      isRanking: true
    });
  }
  
  // Add all other metrics
  metricsConfig.forEach(metric => {
    if (metric.key === 'ranking') return; // Skip ranking as we handled it above
    
    datasets.push({
      label: metric.label,
      data: chartData[metric.key],
      borderColor: metric.color,
      backgroundColor: metric.fill ? metric.color + '40' : metric.color + '20',
      borderWidth: 2,
      pointRadius: 3,
      pointHoverRadius: 5,
      tension: 0.3,
      yAxisID: metric.yAxisID,
      type: metric.type,
      fill: metric.fill || false,
      hidden: !metric.active,
      metricKey: metric.key
    });
  });
  
  // Create scales object for all y-axes
  const scales = {
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
        callback: function(value, index) {
          const dateStr = this.getLabelForValue(value);
          if (dateStr) {
            const dateParts = dateStr.split('-');
            if (dateParts.length === 3) {
              return `${dateParts[2]}/${dateParts[1]}`;
            }
          }
          return dateStr;
        }
      }
    }
  };
  
  // Add y-axes for each metric
  metricsConfig.forEach((metric, index) => {
    let minValue, maxValue;
    
    if (metric.key === 'ranking') {
      minValue = 1;
      maxValue = 40;
    } else if (metric.key === 'visibility') {
      minValue = 0;
      maxValue = 100;
    }
    
    scales[metric.yAxisID] = {
      type: 'linear',
      display: false,
      position: index % 2 === 0 ? 'left' : 'right',
      reverse: metric.key === 'ranking',
      min: minValue,
      max: maxValue,
      title: {
        display: false,
        text: metric.label,
        font: { size: 10 }
      },
      grid: {
        drawOnChartArea: false
      },
      ticks: {
        display: false,
        font: { size: 10 }
      }
    };
  });
  
  // Create chart instance
  const chartInstance = new Chart(canvas, {
    type: 'line',
    data: {
      labels: chartData.dates,
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
          position: 'top',
          labels: {
            filter: function(item, chart) {
              // Only show legend for ranking lines
              return item.text.includes('Ranking');
            },
            usePointStyle: true,
            padding: 15,
            font: {
              size: 12,
              weight: 'bold'
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              let label = context.dataset.label || '';
              if (label) {
                label += ': ';
              }
              const value = context.parsed.y;
              
              if (context.dataset.isRanking && (value === null || value === 40)) {
                return label + 'no rank';
              }
              
              if (label.includes('$')) {
                label += '$' + (value ? value.toFixed(2) : '0.00');
              } else if (label.includes('%') && !label.includes('Ranking')) {
                label += (value ? value.toFixed(2) : '0.00') + '%';
              } else if (label === 'ROAS: ') {
                label += value ? value.toFixed(2) : '0.00';
              } else if (label.includes('Ranking')) {
                label += value ? value.toFixed(2) : 'no rank';
              } else if (label.includes('Visibility')) {
                label += (value ? value.toFixed(1) : '0.0') + '%';
              } else {
                if (context.dataset.metricKey === 'impressions' || 
                    context.dataset.metricKey === 'clicks' || 
                    context.dataset.metricKey === 'conversions') {
                  label += value ? value.toLocaleString() : '0';
                } else {
                  label += value ? value.toFixed(2) : '0.00';
                }
              }
              
              return label;
            }
          }
        },
        datalabels: {
          display: function(context) {
            return !context.dataset.hidden && context.dataset.isRanking;
          },
          align: 'top',
          anchor: 'end',
          offset: 10,
          backgroundColor: function(context) {
            return context.dataset.borderColor + '30';
          },
          borderColor: function(context) {
            return context.dataset.borderColor;
          },
          borderRadius: 4,
          borderWidth: 2,
          color: function(context) {
            return context.dataset.borderColor;
          },
          font: {
            size: 11,
            weight: 'bold'
          },
          padding: {
            top: 4,
            bottom: 4,
            left: 6,
            right: 6
          },
          formatter: function(value, context) {
            if (value === null || value === undefined) return '';
            return value.toFixed(1);
          }
        }
      },
      scales: scales
    }
  });
  
  // Function to update chart visibility
  function updateChartVisibility() {
    const rankingActive = metricsConfig.find(m => m.key === 'ranking').active;
    
    chartInstance.data.datasets.forEach((dataset, index) => {
      if (dataset.isRanking) {
        dataset.hidden = !rankingActive;
      } else {
        const metric = metricsConfig.find(m => m.key === dataset.metricKey);
        if (metric) {
          dataset.hidden = !metric.active;
        }
      }
    });
    
    chartInstance.update('none');
  }
  
  // Initial update
  updateChartVisibility();
  
  // Store chart instance
  container.chartInstance = chartInstance;
}

// Replace the existing getRankingDataByDevice function with this:
function getRankingDataByDevice(dates) {
  const desktopData = [];
  const mobileData = [];
  
  if (!window.selectedGoogleAdsProduct || !window.allRows) {
    return {
      desktop: dates.map(() => null),
      mobile: dates.map(() => null)
    };
  }
  
  const productRecords = getProductRecords(window.selectedGoogleAdsProduct);
  
  // Get current device filter
  const deviceFilter = document.getElementById('deviceTypeFilter')?.value || 'all';
  
  // Separate records by device
  const desktopRecords = productRecords.filter(r => r.device && r.device.toLowerCase().includes('desktop'));
  const mobileRecords = productRecords.filter(r => r.device && r.device.toLowerCase().includes('mobile'));
  
  // Process each date
  dates.forEach(date => {
    // Desktop ranking - only populate if device filter allows
    let desktopRank = null;
    if (deviceFilter === 'all' || deviceFilter === 'desk') {
      desktopRecords.forEach(record => {
        if (record.historical_data && Array.isArray(record.historical_data)) {
          const histItem = record.historical_data.find(item => item.date?.value === date);
          if (histItem?.avg_position != null) {
            desktopRank = parseFloat(histItem.avg_position);
          }
        }
      });
    }
    desktopData.push(desktopRank);
    
    // Mobile ranking - only populate if device filter allows
    let mobileRank = null;
    if (deviceFilter === 'all' || deviceFilter === 'mob') {
      mobileRecords.forEach(record => {
        if (record.historical_data && Array.isArray(record.historical_data)) {
          const histItem = record.historical_data.find(item => item.date?.value === date);
          if (histItem?.avg_position != null) {
            mobileRank = parseFloat(histItem.avg_position);
          }
        }
      });
    }
    mobileData.push(mobileRank);
  });
  
  return {
    desktop: desktopData,
    mobile: mobileData
  };
}

function renderTableForSelectedGoogleAdsProduct(combinations, initialViewMode = 'viewOverviewGoogleAds') {
  console.log('[renderTableForSelectedGoogleAdsProduct] Starting with', combinations.length, 'combinations');
  
  const existingTable = document.querySelector("#googleAdsContainer .google-ads-table");
  if (existingTable) {
    existingTable.remove();
  }

  // Remove the "No products found" message if it exists
  const emptyMessage = document.getElementById('googleAdsEmptyMessage');
  if (emptyMessage) {
    emptyMessage.remove();
  }
  
  window.pendingGoogleAdsCharts = [];
  
if (window.googleAdsApexCharts) {
    window.googleAdsApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.googleAdsApexCharts = [];
  
  const table = document.createElement("table");
  table.classList.add("google-ads-table");
  
  const thead = document.createElement("thead");
thead.innerHTML = `
  <tr>
    <th>Search Term</th>
    <th>Location</th>
    <th>Device</th>
    <th class="segmentation-column">Top 40 Segmentation</th>
    <th>Rank & Market Share</th>
  </tr>
`;
  table.appendChild(thead);
  
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  
  let chartCounter = 0;
  let pieChartCounter = 0;
  
  const locationColorMap = {};
  const allLocationsList = [...new Set(combinations.map(c => c.location))];
  allLocationsList.sort().forEach((loc, index) => {
    const colorIndex = (index % 10) + 1;
    locationColorMap[loc] = `location-bg-${colorIndex}`;
  });
  
  combinations.sort((a, b) => {
    const termCompare = (a.searchTerm || "").localeCompare(b.searchTerm || "");
    if (termCompare !== 0) return termCompare;
    
    const locCompare = (a.location || "").localeCompare(b.location || "");
    if (locCompare !== 0) return locCompare;
    
    const aDevice = (a.device || "").toLowerCase();
    const bDevice = (b.device || "").toLowerCase();
    if (aDevice.includes('desktop') && bDevice.includes('mobile')) return -1;
    if (aDevice.includes('mobile') && bDevice.includes('desktop')) return 1;
    return aDevice.localeCompare(bDevice);
  });

  const termGroups = {};
  combinations.forEach(combo => {
    if (!termGroups[combo.searchTerm]) {
      termGroups[combo.searchTerm] = {};
    }
    if (!termGroups[combo.searchTerm][combo.location]) {
      termGroups[combo.searchTerm][combo.location] = [];
    }
    termGroups[combo.searchTerm][combo.location].push(combo);
  });
  
  Object.keys(termGroups).sort().forEach(searchTerm => {
    const locationGroups = termGroups[searchTerm];
    let termCellUsed = false;
    
    let totalRowsForTerm = 0;
    Object.values(locationGroups).forEach(devices => {
      totalRowsForTerm += devices.length;
    });
    
    Object.keys(locationGroups).sort().forEach(location => {
      const deviceCombinations = locationGroups[location];
      let locCellUsed = false;
      
      deviceCombinations.forEach(combination => {
        const tr = document.createElement("tr");
        
        if (!termCellUsed) {
          const tdTerm = document.createElement("td");
          tdTerm.rowSpan = totalRowsForTerm;
          tdTerm.innerHTML = `<div class="search-term-tag">${searchTerm}</div>`;
          tr.appendChild(tdTerm);
          termCellUsed = true;
        }
        
        if (!locCellUsed) {
          const tdLoc = document.createElement("td");
          tdLoc.rowSpan = deviceCombinations.length;
          tdLoc.innerHTML = formatLocationCell(combination.location);
          tdLoc.classList.add(locationColorMap[combination.location]);
          tr.appendChild(tdLoc);
          locCellUsed = true;
        }
        
        const tdDev = document.createElement("td");
        tdDev.innerHTML = createDeviceCell(combination);
        tr.appendChild(tdDev);
        
const tdSegmentation = document.createElement("td");
tdSegmentation.classList.add("segmentation-column");
const chartContainerId = `google-ads-segmentation-chart-${chartCounter++}`;
tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="google-ads-segmentation-chart-container loading"></div>`;
tr.appendChild(tdSegmentation);

const tdRankMarketShare = document.createElement("td");
const positionChartId = `google-ads-position-chart-${chartCounter}`;

// Create rank & market share history
const rankMarketShareHistory = createProductRankMarketShareHistory(combination.record);

tdRankMarketShare.innerHTML = `
  <div id="${positionChartId}" class="google-ads-chart-avg-position" style="display: none;">Click "Charts" view to see position trends</div>
  <div class="rank-market-share-history">${rankMarketShareHistory}</div>
`;
tr.appendChild(tdRankMarketShare);
        
        const chartInfo = {
          containerId: chartContainerId,
          positionChartId: positionChartId,
          combination: combination,
          selectedProduct: window.selectedGoogleAdsProduct
        };
        
        if (!window.pendingGoogleAdsCharts) {
          window.pendingGoogleAdsCharts = [];
        }
        window.pendingGoogleAdsCharts.push(chartInfo);
        
        tbody.appendChild(tr);
      });
    });
  });
  
const container = document.querySelector("#googleAdsTableContainer");

// Create wrapper for table and additional containers
const contentWrapper = document.createElement('div');
contentWrapper.id = 'googleAdsContentWrapper';
contentWrapper.style.width = '100%';

// Add the table to wrapper
contentWrapper.appendChild(table);

// Create product_info container
const productInfoContainer = document.createElement('div');
productInfoContainer.id = 'product_info';
productInfoContainer.className = 'google-ads-info-container';
productInfoContainer.style.cssText = `
  width: 1195px;
  height: 250px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

// Create product_metrics container
const productMetricsContainer = document.createElement('div');
productMetricsContainer.id = 'product_metrics';
productMetricsContainer.className = 'google-ads-metrics-container';
productMetricsContainer.style.cssText = `
  width: 1195px;
  height: 650px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

// Create product_tables container
const productTablesContainer = document.createElement('div');
productTablesContainer.id = 'product_tables';
productTablesContainer.className = 'google-ads-tables-container';
productTablesContainer.style.cssText = `
  width: 1195px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

// Add filter controls to metrics container
const filterControls = document.createElement('div');
filterControls.style.cssText = `
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
  justify-content: space-between;
  align-items: center;
`;

const leftFilters = document.createElement('div');
leftFilters.style.cssText = `
  display: flex;
  gap: 20px;
  align-items: center;
`;

leftFilters.innerHTML = `
  <div style="display: flex; align-items: center; gap: 10px;">
    <label style="font-weight: 600; font-size: 14px;">Device:</label>
    <select id="deviceTypeFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <option value="all">All Dev</option>
      <option value="desk">Desk</option>
      <option value="mob">Mob</option>
      <option value="tab">Tab</option>
    </select>
  </div>
  <div style="display: flex; align-items: center; gap: 10px;">
    <label style="font-weight: 600; font-size: 14px;">Campaign:</label>
    <select id="campaignNameFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <option value="all">All</option>
    </select>
  </div>
  <div style="display: flex; align-items: center; gap: 10px;">
    <label style="font-weight: 600; font-size: 14px;">Channel Type:</label>
    <select id="channelTypeFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;">
      <option value="all">All</option>
    </select>
  </div>
`;

filterControls.appendChild(leftFilters);

// Trends settings functionality
setTimeout(() => {
  const settingsBtn = document.getElementById('trendsSettingsBtn');
  const selectorPopup = document.getElementById('metricsSelectorPopup');
  
  if (settingsBtn && selectorPopup) {
    settingsBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      selectorPopup.classList.toggle('visible');
    });
    
    // Close popup when clicking outside
    document.addEventListener('click', function(e) {
      if (!selectorPopup.contains(e.target) && e.target !== settingsBtn) {
        selectorPopup.classList.remove('visible');
      }
    });
  }
}, 100);

productMetricsContainer.appendChild(filterControls);

// Create wrapper for chart and trends
const chartWrapper = document.createElement('div');
chartWrapper.style.cssText = `
  width: 100%;
  height: calc(100% - 80px);
  position: relative;
  display: flex;
  gap: 15px;
`;

// Add chart container
const chartContainer = document.createElement('div');
chartContainer.id = 'productMetricsChart';
chartContainer.style.cssText = `
  flex: 1;
  height: 100%;
  position: relative;
  transition: width 0.3s ease-out;
  width: 100%;
`;

// Add trends container
const trendsContainer = document.createElement('div');
trendsContainer.id = 'google-ads-trends-container';
trendsContainer.className = 'google-ads-trends-container visible';
trendsContainer.innerHTML = `
  <div class="trends-container-title">Metric Trends</div>
  <button class="trends-settings-btn" id="trendsSettingsBtn">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="3"></circle>
      <path d="M12 1v6m0 6v6m4.22-10.22l4.24 4.24M6.34 6.34l4.24 4.24m4.88 0l4.24 4.24M6.34 17.66l4.24-4.24"></path>
    </svg>
  </button>
  <div id="trends-content"></div>
  <div class="metrics-selector-popup" id="metricsSelectorPopup">
    <div class="metrics-selector-title">Select Metrics to Display</div>
    <div id="metricsListContainer"></div>
  </div>
`;

chartWrapper.appendChild(chartContainer);
chartWrapper.appendChild(trendsContainer);
productMetricsContainer.appendChild(chartWrapper);

contentWrapper.appendChild(productInfoContainer);
contentWrapper.appendChild(productTablesContainer);
contentWrapper.appendChild(productMetricsContainer);

// Create product-ranking-map container
const productRankingMapContainer = document.createElement('div');
productRankingMapContainer.id = 'product_ranking_map';
productRankingMapContainer.className = 'google-ads-ranking-map-container';
productRankingMapContainer.style.cssText = `
  width: 1195px;
  margin: 20px 0 20px 20px;
  margin-top: 60px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
  max-height: auto;
  overflow-y: auto;
`;

contentWrapper.appendChild(productRankingMapContainer);

// Create ROAS Charts container
const roasChartsContainer = document.createElement('div');
roasChartsContainer.id = 'roas_charts';
roasChartsContainer.className = 'google-ads-charts-container';
roasChartsContainer.style.cssText = `
  width: 1195px;
  height: 400px;
  margin: 100px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

contentWrapper.appendChild(roasChartsContainer);

// Create ROAS Metrics Table container
const roasMetricsTableContainer = document.createElement('div');
roasMetricsTableContainer.id = 'roas_metrics_table';
roasMetricsTableContainer.className = 'google-ads-metrics-table-container';
roasMetricsTableContainer.style.cssText = `
  width: 1195px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

contentWrapper.appendChild(roasMetricsTableContainer);

// Create ROAS Buckets container
const buckets_productsContainer = document.createElement('div');
buckets_productsContainer.id = 'buckets_products';
buckets_productsContainer.className = 'google-ads-buckets-container';
buckets_productsContainer.style.cssText = `
  width: 1195px;
  height: auto;
  margin: 0 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

contentWrapper.appendChild(buckets_productsContainer);

// Create ROAS Channels container
const roasChannelsContainer = document.createElement('div');
roasChannelsContainer.id = 'roas_channels';
roasChannelsContainer.className = 'google-ads-channels-container';
roasChannelsContainer.style.cssText = `
  width: 1195px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
`;

contentWrapper.appendChild(roasChannelsContainer);

// Replace the original append - table should be INSIDE contentWrapper
contentWrapper.insertBefore(table, contentWrapper.firstChild); // Insert table at the beginning
container.appendChild(contentWrapper);

console.log('[renderTableForSelectedGoogleAdsProduct] Table created, rendering charts...');

// Set visibility fill heights for water effect
setTimeout(() => {
  setVisibilityFillHeights();
}, 100);

renderPendingGoogleAdsChartsForProduct();
  
// Apply initial view mode immediately after table creation
if (initialViewMode === 'viewOverviewGoogleAds') {
  // Hide table in overview mode
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'none';
  }
  
  // Ensure the ranking button is active immediately
  const rankingBtn = document.getElementById('viewOverviewGoogleAds');
  const chartsBtn = document.getElementById('viewChartsGoogleAds');
  const mapBtn = document.getElementById('viewMapGoogleAds');
  if (rankingBtn) rankingBtn.classList.add('active');
  if (chartsBtn) chartsBtn.classList.remove('active');
  if (mapBtn) mapBtn.classList.remove('active');
} else {
  setTimeout(() => {
    const targetButton = document.getElementById(initialViewMode);
    if (targetButton && !targetButton.classList.contains('active')) {
      targetButton.click();
    }
  }, 100);
}
}

function createDeviceCell(combination) {
  const record = combination.record;
  
  let deviceHTML = `<div class="device-container">`;
  
  const deviceIcon = record.device.toLowerCase().includes('mobile') 
    ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' 
    : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png';
  
  deviceHTML += `<div class="device-type">
    <img src="${deviceIcon}" alt="${record.device}" class="device-icon" />
  </div>`;
  
  const avgRank = calculateAvgRankFromHistorical(record);
  deviceHTML += `
    <div class="device-rank">
      <div class="section-header">Avg Rank</div>
      <div class="device-rank-value">${avgRank.value}</div>
      <div class="device-trend" style="color:${avgRank.color};">
        ${avgRank.arrow} ${avgRank.change}
      </div>
    </div>
  `;
  
  let avgVisibility = 0;
  if (record.avg_visibility) {
    avgVisibility = parseFloat(record.avg_visibility) * 100;
  }

const visChartId = `vis-chart-${Date.now()}-${Math.random()}`;
deviceHTML += `
  <div class="device-share">
    <div class="section-header">Visibility<br><span style="font-size: 9px;">(last 7 days)</span></div>
    <div id="${visChartId}" class="pie-chart-container"></div>
  </div>
`;

setTimeout(() => {
  createMarketSharePieChartGoogleAds(visChartId, avgVisibility);
}, 50);

// Add status section for ranking mode
const lastTracked = getLastTrackedInfo(record);
const isActive = lastTracked.isActive;
deviceHTML += `
  <div class="device-status">
    <div class="section-header">Status</div>
    <div class="device-status-value">
      <span class="${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span>
    </div>
  </div>
`;

deviceHTML += `
  <div class="last-tracked-container">
    <div class="last-tracked-label">Last time tracked:</div>
    <div class="last-tracked-value ${lastTracked.class}">${lastTracked.text}</div>
  </div>
`;
  
  deviceHTML += `</div>`;
  
  return deviceHTML;
}

function calculateAvgRankFromHistorical(record) {
  if (!record.historical_data || record.historical_data.length === 0) {
    return { value: '-', arrow: '', change: '', color: '#444' };
  }
  
  let latestDate = null;
  record.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (!latestDate || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
  
  if (!latestDate) {
    return { value: '-', arrow: '', change: '', color: '#444' };
  }
  
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const prevEndDate = startDate.clone().subtract(1, 'days');
  const prevStartDate = prevEndDate.clone().subtract(6, 'days');
  
  const currentData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value || !item.avg_position) return false;
    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
    return itemDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  const prevData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value || !item.avg_position) return false;
    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
    return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
  });
  
  if (currentData.length === 0) {
    return { value: '-', arrow: '', change: '', color: '#444' };
  }
  
  const currentAvg = currentData.reduce((sum, item) => sum + parseFloat(item.avg_position), 0) / currentData.length;
  
  if (prevData.length === 0) {
    return { 
      value: currentAvg.toFixed(1), 
      arrow: '', 
      change: '', 
      color: '#444' 
    };
  }
  
  const prevAvg = prevData.reduce((sum, item) => sum + parseFloat(item.avg_position), 0) / prevData.length;
  const change = currentAvg - prevAvg;
  
  let arrow, color;
  if (change < 0) {
    arrow = '▲';
    color = 'green';
  } else if (change > 0) {
    arrow = '▼';
    color = 'red';
  } else {
    arrow = '±';
    color = '#444';
  }
  
  return {
    value: currentAvg.toFixed(1),
    arrow: arrow,
    change: Math.abs(change).toFixed(1),
    color: color
  };
}

function getLastTrackedInfo(record) {
  if (!record.historical_data || record.historical_data.length === 0) {
    return { text: 'Not tracked', class: '', isActive: false };
  }
  
  let latestDate = null;
  record.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (!latestDate || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
  
  if (!latestDate) {
    return { text: 'Not tracked', class: '', isActive: false };
  }
  
  const today = moment().startOf('day');
  const daysDiff = today.diff(latestDate, 'days');
  
  // Determine if active (last appeared within 7 days from today)
  const isActive = daysDiff <= 7;
  
  if (daysDiff === 0) {
    return { text: 'Today', class: 'recent-tracking', isActive: true };
  } else if (daysDiff === 1) {
    return { text: 'Yesterday', class: 'recent-tracking', isActive: true };
  } else if (daysDiff <= 7) {
    return { text: `${daysDiff} days ago`, class: 'moderate-tracking', isActive: true };
  } else {
    return { text: `${daysDiff} days ago`, class: 'old-tracking', isActive: false };
  }
}

function renderPendingGoogleAdsChartsForProduct() {
  setTimeout(() => {
    const charts = window.pendingGoogleAdsCharts;
    if (!charts || charts.length === 0) {
      console.log('[renderPendingGoogleAdsChartsForProduct] No charts to render');
      return;
    }
    
    console.log(`[renderPendingGoogleAdsChartsForProduct] Rendering ${charts.length} product-specific charts`);
    
    charts.forEach((chartInfo, index) => {
      const { containerId, positionChartId, combination, selectedProduct } = chartInfo;
      console.log(`[renderPendingGoogleAdsChartsForProduct] Processing chart ${index + 1}/${charts.length}: ${containerId}`);
      
      const productRecords = getProductRecords(selectedProduct);
      const specificRecord = productRecords.find(record => 
        record.q === combination.searchTerm &&
        record.location_requested === combination.location &&
        record.device === combination.device
      );
      
      if (!specificRecord) {
        console.log(`[renderPendingGoogleAdsChartsForProduct] No record found for combination:`, combination);
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = '<div class="no-data-message">No data for this product</div>';
          container.classList.remove('loading');
        }
        return;
      }
      
      const chartData = calculateProductSegmentData(specificRecord);
      
      if (!chartData || chartData.length === 0) {
        console.log(`[renderPendingGoogleAdsChartsForProduct] No chart data for ${containerId}`);
        const container = document.getElementById(containerId);
        if (container) {
          container.innerHTML = '<div class="no-data-message">No segment data</div>';
          container.classList.remove('loading');
        }
        return;
      }
      
      createProductSegmentationChart(
        containerId,
        chartData,
        combination.searchTerm,
        combination.location,
        combination.device,
        selectedProduct.source,
        specificRecord
      );
      
      // Store reference to the record for position chart rendering
      const positionChartContainer = document.getElementById(positionChartId);
      if (positionChartContainer) {
        positionChartContainer.combinationRecord = specificRecord;
        positionChartContainer.combinationInfo = combination;
      }
    });
    
    window.pendingGoogleAdsCharts = [];
    console.log('[renderPendingGoogleAdsChartsForProduct] All charts rendered');
  }, 100);
}

function calculateProductSegmentData(record) {
  if (!record.historical_data || record.historical_data.length === 0) {
    return null;
  }
  
  let latestDate = null;
  record.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (!latestDate || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
  
  if (!latestDate) return null;
  
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const prevEnd = startDate.clone().subtract(1, 'days');
  const prevStart = prevEnd.clone().subtract(6, 'days');
  
  const currentData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value) return false;
    const d = moment(item.date.value, "YYYY-MM-DD");
    return d.isBetween(startDate, endDate, "day", "[]");
  });
  
  const prevData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value) return false;
    const d = moment(item.date.value, "YYYY-MM-DD");
    return d.isBetween(prevStart, prevEnd, "day", "[]");
  });
  
  function avg(arr, field, multiplier = 1) {
    if (!arr.length) return 0;
    let sum = 0, count = 0;
    arr.forEach(x => {
      if (x[field] != null) {
        sum += parseFloat(x[field]) * multiplier;
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  }
  
  const currTop3 = avg(currentData, "top3_visibility", 100);
  const currTop8 = avg(currentData, "top8_visibility", 100);
  const currTop14 = avg(currentData, "top14_visibility", 100);
  const currTop40 = avg(currentData, "top40_visibility", 100) || avg(currentData, "market_share", 100);
  
  const prevTop3 = avg(prevData, "top3_visibility", 100);
  const prevTop8 = avg(prevData, "top8_visibility", 100);
  const prevTop14 = avg(prevData, "top14_visibility", 100);
  const prevTop40 = avg(prevData, "top40_visibility", 100) || avg(prevData, "market_share", 100);
  
  return [
    { label: "Top3", current: currTop3, previous: prevTop3 },
    { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
    { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
    { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
  ];
}

function createProductSegmentationChart(containerId, chartData, term, location, device, company, record) {
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) return;
  
  chartContainer.classList.remove('loading');
  console.log(`[createProductSegmentationChart] Creating chart for ${term} - ${location} - ${device}`);
  
  chartContainer.innerHTML = '';
  chartContainer.style.height = '380px';
  chartContainer.style.maxHeight = '380px';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.display = 'flex';
  chartContainer.style.flexDirection = 'column';
  chartContainer.style.alignItems = 'center';
  
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.width = '100%';
  canvasWrapper.style.height = '280px';
  canvasWrapper.style.maxHeight = '280px';
  canvasWrapper.style.position = 'relative';
  canvasWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(canvasWrapper);
  
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
  const infoContainer = document.createElement('div');
  infoContainer.style.width = '300px';
  infoContainer.style.height = '80px';
  infoContainer.style.maxHeight = '80px';
  infoContainer.style.display = 'grid';
  infoContainer.style.gridTemplateColumns = '1fr 1fr';
  infoContainer.style.gridTemplateRows = 'auto auto';
  infoContainer.style.gap = '8px';
  infoContainer.style.padding = '8px';
  infoContainer.style.backgroundColor = '#f9f9f9';
  infoContainer.style.borderRadius = '8px';
  infoContainer.style.fontSize = '14px';
  infoContainer.style.boxSizing = 'border-box';
  
const lastTracked = getLastTrackedInfo(record);
const isActive = lastTracked.isActive;
  
infoContainer.innerHTML = `
  <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Status:</div>
  <div><span class="${isActive ? 'status-active' : 'status-inactive'}">${isActive ? 'Active' : 'Inactive'}</span></div>
  <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Last Tracked:</div>
  <div style="font-weight: 700;" class="${lastTracked.class}">${lastTracked.text}</div>
`;
  
  chartContainer.appendChild(infoContainer);
  
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
}

// Add this function after createProductSegmentationChart (around line 850)
function createProductRankMarketShareHistory(record) {
  // Use last 30 days like in position charts
  const maxDate = moment().startOf('day');
  const minDate = maxDate.clone().subtract(29, 'days');
  
// Create array of exactly 30 dates (newest first, oldest last)
const dateArray = [];
let currentDate = maxDate.clone(); // Start from newest date
while (currentDate.isSameOrAfter(minDate)) {
  dateArray.push(currentDate.format('YYYY-MM-DD'));
  currentDate.subtract(1, 'day'); // Go backwards
}
  
  // Check if there's any historical data at all
  const hasHistoricalData = record.historical_data && record.historical_data.length > 0;
  
  let html = '<div class="rank-history-container">';
  
  if (!hasHistoricalData) {
    // Completely missing data - show gray empty boxes
    html += '<div class="rank-history-row">';
    dateArray.forEach(() => {
      html += '<div class="history-empty-box"></div>';
    });
    html += '</div>';
    
    html += '<div class="visibility-history-row">';
    dateArray.forEach(() => {
      html += '<div class="history-empty-box"></div>';
    });
    html += '</div>';
  } else {
    // Has some historical data - process normally
    
    // First row: Rank positions
    html += '<div class="rank-history-row">';
    dateArray.forEach(dateStr => {
      const histItem = record.historical_data.find(item => 
        item.date?.value === dateStr
      );
      
      if (histItem?.avg_position != null) {
        // Data exists - show actual rank with color coding
        const rank = Math.round(parseFloat(histItem.avg_position));
        const colorClass = getRankColorClass(rank);
        html += `<div class="rank-box ${colorClass}">${rank}</div>`;
      } else {
        // Missing data for this date - empty box with no background color
        html += '<div class="rank-box"></div>';
      }
    });
    html += '</div>';
    
    // Second row: Visibility percentages
    html += '<div class="visibility-history-row">';
    dateArray.forEach(dateStr => {
      const histItem = record.historical_data.find(item => 
        item.date?.value === dateStr
      );
      
if (histItem?.visibility != null) {
  const visibility = Math.round(parseFloat(histItem.visibility) * 100 * 10) / 10;
  html += `<div class="visibility-box" data-fill="${visibility}"><span>${visibility}%</span></div>`;
} else {
  html += '<div class="visibility-box" data-fill="0"><span>0%</span></div>';
}
    });
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

function buildMapDataForSelectedGoogleAdsProduct() {
  if (!window.selectedGoogleAdsProduct) {
    console.warn('[buildMapDataForSelectedGoogleAdsProduct] No product selected');
    return { searches: [] };
  }
  
  const productRecords = getProductRecords(window.selectedGoogleAdsProduct);
  console.log('[buildMapDataForSelectedGoogleAdsProduct] Found', productRecords.length, 'records for product');
  
  const searches = [];
  
  // Group by location first, then by search term, then by device
  const locationGroups = new Map();
  
  productRecords.forEach(record => {
    const location = record.location_requested;
    const searchTerm = record.q;
    const device = record.device;
    
    if (!location || !searchTerm || !device) {
      console.warn('[buildMapDataForSelectedGoogleAdsProduct] Skipping record with missing data:', record);
      return;
    }
    
    if (!locationGroups.has(location)) {
      locationGroups.set(location, new Map());
    }
    
    const searchTerms = locationGroups.get(location);
    if (!searchTerms.has(searchTerm)) {
      searchTerms.set(searchTerm, new Map());
    }
    
    const devices = searchTerms.get(searchTerm);
    
    // Calculate metrics for this specific record with defaults
    const shareVal = record.avg_visibility ? parseFloat(record.avg_visibility) * 100 : 0;
    
    let avgRank = 40;
    let rankChange = 0;
    let isActive = false;
    
    if (record.historical_data && Array.isArray(record.historical_data) && record.historical_data.length > 0) {
      // Get last 7 days for current average
      const endDate = moment().startOf('day');
      const startDate = endDate.clone().subtract(6, 'days');
      
      const recentData = record.historical_data.filter(item => {
        if (!item.date || !item.date.value || item.avg_position == null) return false;
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        return itemDate.isBetween(startDate, endDate, 'day', '[]');
      });
      
      if (recentData.length > 0) {
        const sum = recentData.reduce((acc, item) => acc + parseFloat(item.avg_position || 40), 0);
        avgRank = sum / recentData.length;
        
        // Check if active (data within last 7 days)
        const today = moment().startOf('day');
        const lastDataDate = moment(recentData[recentData.length - 1].date.value, 'YYYY-MM-DD');
        isActive = today.diff(lastDataDate, 'days') <= 7;
      }
      
      // Calculate rank change (current vs previous week)
      const prevEndDate = startDate.clone().subtract(1, 'days');
      const prevStartDate = prevEndDate.clone().subtract(6, 'days');
      
      const prevData = record.historical_data.filter(item => {
        if (!item.date || !item.date.value || item.avg_position == null) return false;
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
      });
      
      if (prevData.length > 0) {
        const prevSum = prevData.reduce((acc, item) => acc + parseFloat(item.avg_position || 40), 0);
        const prevAvgRank = prevSum / prevData.length;
        rankChange = avgRank - prevAvgRank; // Negative = improvement
      }
    }
    
    devices.set(device, {
      location: location,
      device: device,
      searchTerm: searchTerm,
      shareVal: shareVal,
      avgRank: avgRank,
      computedAvgRank: avgRank,
      rankChange: rankChange,
      hideRank: false,
      hideShare: false,
      status: 'active',
      isActive: isActive,
      visibility: shareVal
    });
  });
  
  // Convert to flat array for map consumption and assign search term indices
  locationGroups.forEach((searchTermsMap, location) => {
    const searchTermsArray = Array.from(searchTermsMap.keys()).sort();
    
    searchTermsArray.forEach((searchTerm, termIndex) => {
      const devicesMap = searchTermsMap.get(searchTerm);
      devicesMap.forEach((deviceData) => {
        // Add search term index for the circle number
        deviceData.searchTermIndex = termIndex + 1;
        deviceData.totalSearchTerms = searchTermsArray.length;
        searches.push(deviceData);
      });
    });
  });
  
  console.log('[buildMapDataForSelectedGoogleAdsProduct] Built', searches.length, 'search entries for map');
  return { searches: searches, locationGroups: locationGroups };
}

function addLocationBlocksToMap(mapProject, containerSelector) {
  const svg = d3.select(containerSelector + ' svg');
  if (!svg.node()) return;
  
  if (!window.cityLookup) {
    console.warn('cityLookup not available for location blocks');
    return;
  }
  
  // Group data by location
  const locationGroups = new Map();
  
  mapProject.searches.forEach(search => {
    const location = search.location.toLowerCase();
    if (!locationGroups.has(location)) {
      locationGroups.set(location, []);
    }
    locationGroups.get(location).push(search);
  });
  
  console.log('[addLocationBlocksToMap] Processing', locationGroups.size, 'locations');
  
  // Use AlbersUSA projection (same as in mapsLib)
  const projection = d3.geoAlbersUsa()
    .scale(1300)
    .translate([487.5, 305]);
  
  locationGroups.forEach((searches, location) => {
    const cityObj = window.cityLookup.get(location);
    if (!cityObj) {
      console.warn('[addLocationBlocksToMap] City not found:', location);
      return;
    }
    
    const coords = projection([cityObj.lng, cityObj.lat]);
    if (!coords) {
      console.warn('[addLocationBlocksToMap] Invalid coordinates for:', location);
      return;
    }
    
    // Group by search term, then by device
    const searchTermGroups = new Map();
    searches.forEach(search => {
      const termIndex = search.searchTermIndex || 1;
      if (!searchTermGroups.has(termIndex)) {
        searchTermGroups.set(termIndex, { desktop: null, mobile: null });
      }
      
      const deviceType = search.device.toLowerCase().includes('mobile') ? 'mobile' : 'desktop';
      searchTermGroups.get(termIndex)[deviceType] = search;
    });
    
    // Calculate compact block dimensions
    const searchTermCount = searchTermGroups.size;
    const blockWidth = 250;
    const rowHeight = 36; // Reduced from 56
    const headerHeight = 26; // Reduced from 36
    const padding = 12; // Reduced from 24
    const blockHeight = headerHeight + (searchTermCount * rowHeight * 2) + padding;
    
    // Position block
    const offsetX = coords[0] < 487.5 ? 40 : -blockWidth - 40;
    const offsetY = -blockHeight / 2;
    
    // Create block container
    const blockGroup = svg.append('g')
      .attr('class', 'location-block')
      .attr('transform', `translate(${coords[0] + offsetX}, ${coords[1] + offsetY})`);
    
    // Add foreignObject for HTML content
    const foreignObject = blockGroup.append('foreignObject')
      .attr('width', blockWidth)
      .attr('height', blockHeight);
    
    const blockDiv = foreignObject.append('xhtml:div')
      .attr('class', 'location-block-content')
      .style('width', '100%')
      .style('height', '100%');
    
    // Header
    const cityName = cityObj.city || location.split(',')[0] || 'Unknown';
    blockDiv.append('xhtml:div')
      .attr('class', 'location-block-header')
      .text(cityName);
    
    // Body
    const bodyDiv = blockDiv.append('xhtml:div')
      .attr('class', 'location-block-body');
    
    // Create rows for each search term
    Array.from(searchTermGroups.keys()).sort().forEach(termIndex => {
      const devices = searchTermGroups.get(termIndex);
      
      // Desktop row
      if (devices.desktop) {
        createCompactDeviceRow(bodyDiv, devices.desktop, termIndex, 'desktop');
      }
      
      // Mobile row
      if (devices.mobile) {
        createCompactDeviceRow(bodyDiv, devices.mobile, termIndex, 'mobile');
      }
    });
  });
}

function createCompactDeviceRow(parentDiv, deviceData, termIndex, deviceType) {
  const safeDeviceData = {
    avgRank: deviceData.avgRank != null ? deviceData.avgRank : 40,
    rankChange: deviceData.rankChange != null ? deviceData.rankChange : 0,
    visibility: deviceData.visibility != null ? deviceData.visibility : 0,
    isActive: deviceData.isActive != null ? deviceData.isActive : false
  };
  
  const rowDiv = parentDiv.append('xhtml:div')
    .attr('class', `location-device-row device-row-${deviceType}`);
  
  // Search term circle (only for desktop rows)
  if (deviceType === 'desktop') {
    rowDiv.append('xhtml:div')
      .attr('class', 'search-term-circle')
      .text(termIndex);
  } else {
    // Empty space for mobile rows to align
    rowDiv.append('xhtml:div')
      .style('width', '26px'); // 20px circle + 6px margin
  }
  
  // Device icon
  const iconWrapper = rowDiv.append('xhtml:div')
    .attr('class', 'device-icon-wrapper');
  
  const deviceIcon = deviceType === 'mobile' 
    ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' 
    : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png';
  
  iconWrapper.append('xhtml:img')
    .attr('class', 'map-device-icon')
    .attr('src', deviceIcon)
    .attr('alt', deviceType);
  
  // Metrics container
  const metricsDiv = rowDiv.append('xhtml:div')
    .attr('class', 'device-metrics');
  
  // Rank value and trend
  const rankMetric = metricsDiv.append('xhtml:div')
    .attr('class', 'metric-item');
  
  rankMetric.append('xhtml:span')
    .attr('class', 'metric-value')
    .text(safeDeviceData.avgRank.toFixed(1));
  
  // Trend arrow
  const trendValue = Math.abs(safeDeviceData.rankChange).toFixed(1);
  const trendClass = safeDeviceData.rankChange < 0 ? 'trend-positive' : 
                     safeDeviceData.rankChange > 0 ? 'trend-negative' : 'trend-neutral';
  const trendSymbol = safeDeviceData.rankChange < 0 ? '▲' : 
                      safeDeviceData.rankChange > 0 ? '▼' : '—';
  
  rankMetric.append('xhtml:span')
    .attr('class', `metric-trend ${trendClass}`)
    .text(`${trendSymbol}${trendValue}`);
  
  // Divider
  metricsDiv.append('xhtml:div')
    .attr('class', 'metric-divider');
  
  // Visibility percentage
  const visMetric = metricsDiv.append('xhtml:div')
    .attr('class', 'metric-item');
  
  visMetric.append('xhtml:span')
    .attr('class', 'metric-value')
    .text(`${safeDeviceData.visibility.toFixed(1)}%`);
  
  // Status dot
  rowDiv.append('xhtml:div')
    .attr('class', `device-status-dot ${safeDeviceData.isActive ? 'status-active' : 'status-inactive'}`);
}

function setVisibilityFillHeights() {
  document.querySelectorAll('.visibility-box[data-fill]').forEach(box => {
    const fillPercent = parseFloat(box.getAttribute('data-fill')) || 0;
    
    // Remove existing ::before if any and create a new one
    const existingFill = box.querySelector('.water-fill');
    if (existingFill) {
      existingFill.remove();
    }
    
    // Create water fill element
    const waterFill = document.createElement('div');
    waterFill.className = 'water-fill';
    waterFill.style.cssText = `
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: ${fillPercent}%;
      background: linear-gradient(to top, #1e88e5 0%, rgba(30, 136, 229, 0.7) 50%, rgba(30, 136, 229, 0.3) 100%);
      border-radius: 0 0 3px 3px;
      transition: height 0.3s ease-in-out;
      z-index: 1;
      pointer-events: none;
    `;
    
    box.appendChild(waterFill);
  });
}

// Helper function for rank color coding (same logic as company version)
function getRankColorClass(rank) {
  if (rank === 1) return "rank-green";
  if (rank <= 3) return "rank-yellow";
  if (rank <= 5) return "rank-orange";
  return "rank-red";
}

// NEW: Position chart function adapted from productMap.js
function renderGoogleAdsPositionChart(container, record) {
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
  
  // Check if record has historical data
  if (!record || !record.historical_data || record.historical_data.length === 0) {
    container.innerHTML = '<div style="text-align: center; color: #999;">No position data available</div>';
    return;
  }
  
// Use today's date as the latest date, always show last 30 days
const maxDate = moment().startOf('day');
const minDate = maxDate.clone().subtract(29, 'days'); // 30 days total including today
  
  // Create array of exactly 30 dates
const dateArray = [];
let currentDate = minDate.clone();
while (currentDate.isSameOrBefore(maxDate)) {
  dateArray.push(currentDate.format('YYYY-MM-DD'));
  currentDate.add(1, 'day');
}
  
  // Create datasets for the single product
  const datasets = [];
  
  // Position data
  const positionData = dateArray.map(dateStr => {
    const histItem = record.historical_data?.find(item => 
      item.date?.value === dateStr
    );
    return histItem?.avg_position ? parseFloat(histItem.avg_position) : null;
  });
  
  // Visibility data - use 0 for missing values instead of null
  const visibilityData = dateArray.map(dateStr => {
    const histItem = record.historical_data?.find(item => 
      item.date?.value === dateStr
    );
    // Return 0 if no visibility data exists, round to 1 decimal
    if (histItem?.visibility) {
      const visValue = parseFloat(histItem.visibility) * 100;
      return Math.round(visValue * 10) / 10; // Round to 1 decimal place
    }
    return 0;
  });
  
  // Generate color for this product - grey for inactive
  let color;
  if (record.product_status === 'inactive') {
    color = '#999999'; // Grey for inactive products
  } else {
    color = '#007aff'; // Blue for active products
  }
  
  // Add position line dataset
  datasets.push({
    label: record.title?.substring(0, 30) + (record.title?.length > 30 ? '...' : ''),
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
    productIndex: 0, // Store product index for reference
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
    label: record.title?.substring(0, 30) + ' (Visibility)',
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
    productIndex: 0, // Store product index for reference
    dataType: 'visibility'
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

function renderAvgPositionChartGoogleAds(container, products) {
  if (!Chart.defaults.plugins.annotation) {
    console.warn('Chart.js annotation plugin not loaded. Top8 area will not be displayed.');
  }
  
  container.innerHTML = '';
  container.style.padding = '20px';
  
  container.selectedProductIndex = null;
  container.chartInstance = null;
  
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  
// Use today's date as the latest date, always show last 30 days
const maxDate = moment().startOf('day');
const minDate = maxDate.clone().subtract(29, 'days'); // 30 days total including today

// Create array of exactly 30 dates
const dateArray = [];
let currentDate = minDate.clone();
while (currentDate.isSameOrBefore(maxDate)) {
  dateArray.push(currentDate.format('YYYY-MM-DD'));
  currentDate.add(1, 'day');
}
  
  const datasets = [];

  products.forEach((product, index) => {
    const positionData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      return histItem?.avg_position ? parseFloat(histItem.avg_position) : null;
    });
    
    const visibilityData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      if (histItem?.visibility) {
        const visValue = parseFloat(histItem.visibility) * 100;
        return Math.round(visValue * 10) / 10;
      }
      return 0;
    });
      
    let color;
    if (product.product_status === 'inactive') {
      color = '#999999';
    } else {
      const colors = [
        '#007aff', '#ff3b30', '#4cd964', '#ff9500', '#5856d6',
        '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6482', '#af52de'
      ];
      color = colors[index % colors.length];
    }
    
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
      productIndex: index,
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
      spanGaps: false,
      yAxisID: 'y1',
      type: 'line',
      hidden: true,
      productIndex: index,
      dataType: 'visibility'
    });
  });
  
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
              backgroundColor: 'rgba(144, 238, 144, 0.2)',
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
            drawOnChartArea: false
          }
        }
      }
    }
  });
}

function updateChartLineVisibilityGoogleAds(chartContainer, selectedIndex) {
  const chart = chartContainer.chartInstance;
  if (!chart) return;
  
  chart.data.datasets.forEach((dataset) => {
    if (dataset.dataType === 'position') {
      if (selectedIndex === null) {
        dataset.borderWidth = 2;
        dataset.hidden = false;
      } else if (dataset.productIndex === selectedIndex) {
        dataset.borderWidth = 4;
        dataset.hidden = false;
      } else {
        dataset.hidden = true;
      }
    } else if (dataset.dataType === 'visibility') {
      if (selectedIndex === null) {
        dataset.hidden = true;
      } else if (dataset.productIndex === selectedIndex) {
        dataset.hidden = false;
      } else {
        dataset.hidden = true;
      }
    }
  });
  
  chart.update('none');
}

function calculateGoogleAdsProductMetrics(product) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return { 
      avgRating: 40, 
      avgVisibility: 0, 
      activeLocations: 0, 
      inactiveLocations: 0, 
      isFullyInactive: true,
      rankTrend: { arrow: '', change: '', color: '#999' },
      visibilityTrend: { arrow: '', change: '', color: '#999' }
    };
  }
  
  // Configuration setting
  const useLatestDataDate = window.productMetricsSettings?.useLatestDataDate ?? false;
  
  // Get all records for this product
  const productRecords = window.allRows.filter(record => 
    record.title === product.title && 
    record.source === product.source
  );
  
  // Group by unique combinations of search term + location + device
  const combinationMetrics = new Map();
  const locationStatusMap = new Map();
  let hasAnyActiveLocation = false;
  
  productRecords.forEach(record => {
    const searchTerm = record.q || '';
    const location = record.location_requested || '';
    const device = record.device || '';
    const comboKey = `${searchTerm}|${location}|${device}`;
    
    // Track location status
    if (location) {
      if (!locationStatusMap.has(location)) {
        locationStatusMap.set(location, { hasActive: false, hasInactive: false });
      }
      
      // Check if this record has been active in the last 7 days
      let isRecordActive = false;
      
      if (record.historical_data && record.historical_data.length > 0) {
        let latestDate = null;
        record.historical_data.forEach(item => {
          if (item.date && item.date.value) {
            const itemDate = moment(item.date.value, 'YYYY-MM-DD');
            if (!latestDate || itemDate.isAfter(latestDate)) {
              latestDate = itemDate.clone();
            }
          }
        });
        
        if (latestDate) {
          const today = moment().startOf('day');
          const daysDiff = today.diff(latestDate, 'days');
          isRecordActive = daysDiff <= 7;
        }
      }
      
      if (isRecordActive) {
        hasAnyActiveLocation = true;
        locationStatusMap.get(location).hasActive = true;
      } else {
        locationStatusMap.get(location).hasInactive = true;
      }
    }
    
    // Process records for metrics calculation
    if (!combinationMetrics.has(comboKey)) {
      combinationMetrics.set(comboKey, { 
        currentRankSum: 0, 
        currentRankCount: 0, 
        currentVisibilitySum: 0, 
        currentVisibilityCount: 0,
        prevRankSum: 0, 
        prevRankCount: 0, 
        prevVisibilitySum: 0, 
        prevVisibilityCount: 0,
        record: record,
        isActive: false
      });
    }
    
    const combo = combinationMetrics.get(comboKey);
    
    // Calculate current and previous period metrics from historical data
    if (record.historical_data && Array.isArray(record.historical_data)) {
      let latestDate = null;
      record.historical_data.forEach(item => {
        if (item.date && item.date.value) {
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          if (!latestDate || itemDate.isAfter(latestDate)) {
            latestDate = itemDate.clone();
          }
        }
      });
      
      if (latestDate) {
        // Determine end date based on configuration
        let currentEndDate;
        if (useLatestDataDate) {
          currentEndDate = latestDate.clone();
        } else {
          currentEndDate = moment().startOf('day');
        }
        
        // Current period: last 7 days from determined end date
        const currentStartDate = currentEndDate.clone().subtract(6, 'days');
        
        // Previous period: 7 days before current period
        const prevEndDate = currentStartDate.clone().subtract(1, 'days');
        const prevStartDate = prevEndDate.clone().subtract(6, 'days');
        
        // Update combo active status
        const today = moment().startOf('day');
        const daysDiff = today.diff(latestDate, 'days');
        combo.isActive = daysDiff <= 7;
        
record.historical_data.forEach(item => {
  if (item.date && item.date.value && item.avg_position != null) {
    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
    const position = parseFloat(item.avg_position);
    const visibility = (parseFloat(item.visibility) || 0) * 100; // CHANGED: multiply by 100
    
    if (itemDate.isBetween(currentStartDate, currentEndDate, 'day', '[]')) {
      combo.currentRankSum += position;
      combo.currentRankCount++;
      combo.currentVisibilitySum += visibility;
      combo.currentVisibilityCount++;
    } else if (itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]')) {
      combo.prevRankSum += position;
      combo.prevRankCount++;
      combo.prevVisibilitySum += visibility;
      combo.prevVisibilityCount++;
    }
  }
});
      }
    }
  });
  
  // Aggregate metrics across all combinations
  let totalCurrentRankSum = 0, totalCurrentRankCount = 0;
  let totalCurrentVisibilitySum = 0, totalCurrentVisibilityCount = 0;
  let totalPrevRankSum = 0, totalPrevRankCount = 0;
  let totalPrevVisibilitySum = 0, totalPrevVisibilityCount = 0;
  
  combinationMetrics.forEach(combo => {
    if (combo.currentRankCount > 0) {
      totalCurrentRankSum += combo.currentRankSum;
      totalCurrentRankCount += combo.currentRankCount;
    }
    if (combo.currentVisibilityCount > 0) {
      totalCurrentVisibilitySum += combo.currentVisibilitySum;
      totalCurrentVisibilityCount += combo.currentVisibilityCount;
    }
    if (combo.prevRankCount > 0) {
      totalPrevRankSum += combo.prevRankSum;
      totalPrevRankCount += combo.prevRankCount;
    }
    if (combo.prevVisibilityCount > 0) {
      totalPrevVisibilitySum += combo.prevVisibilitySum;
      totalPrevVisibilityCount += combo.prevVisibilityCount;
    }
  });
  
  const currentAvgRating = totalCurrentRankCount > 0 ? (totalCurrentRankSum / totalCurrentRankCount) : 40;
  const currentAvgVisibility = totalCurrentVisibilityCount > 0 ? (totalCurrentVisibilitySum / totalCurrentVisibilityCount) : 0;
  const prevAvgRating = totalPrevRankCount > 0 ? (totalPrevRankSum / totalPrevRankCount) : 40;
  const prevAvgVisibility = totalPrevVisibilityCount > 0 ? (totalPrevVisibilitySum / totalPrevVisibilityCount) : 0;
  
  // Calculate rank trend (lower rank is better, so improvement is negative change)
  let rankTrend = { arrow: '', change: '', color: '#999' };
  if (totalPrevRankCount > 0) {
    const rankChange = currentAvgRating - prevAvgRating;
    if (rankChange < 0) {
      rankTrend = {
        arrow: '▲',
        change: Math.abs(rankChange).toFixed(1),
        color: '#4CAF50'
      };
    } else if (rankChange > 0) {
      rankTrend = {
        arrow: '▼',
        change: rankChange.toFixed(1),
        color: '#F44336'
      };
    } else {
      rankTrend = {
        arrow: '—',
        change: '0.0',
        color: '#999'
      };
    }
  }
  
  // Calculate visibility trend (higher visibility is better)
  let visibilityTrend = { arrow: '', change: '', color: '#999' };
  if (totalPrevVisibilityCount > 0) {
    const visibilityChange = currentAvgVisibility - prevAvgVisibility;
    if (visibilityChange > 0) {
      visibilityTrend = {
        arrow: '▲',
        change: visibilityChange.toFixed(1) + '%',
        color: '#4CAF50'
      };
    } else if (visibilityChange < 0) {
      visibilityTrend = {
        arrow: '▼',
        change: Math.abs(visibilityChange).toFixed(1) + '%',
        color: '#F44336'
      };
    } else {
      visibilityTrend = {
        arrow: '—',
        change: '0.0%',
        color: '#999'
      };
    }
  }
  
  // Count locations
  let activeLocations = 0;
  let inactiveLocations = 0;
  locationStatusMap.forEach(status => {
    if (status.hasActive) activeLocations++;
    if (status.hasInactive) inactiveLocations++;
  });
  
  return {
    avgRating: Math.round(currentAvgRating),
    avgVisibility: Math.min(100, Math.max(0, currentAvgVisibility)),
    activeLocations,
    inactiveLocations,
    isFullyInactive: !hasAnyActiveLocation,
    rankTrend,
    visibilityTrend
  };
}

async function renderFilteredGoogleAdsProducts(productsNavContainer, activeProducts, inactiveProducts, filter = 'all') {
  // Clear container
  productsNavContainer.innerHTML = '';
  
  // Show loading state
  productsNavContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">Loading products...</div>';
  
  // Function to create product item
  async function createProductItem({ product, index, metrics }, isInactive = false) {
    // Check if product has data
    const hasData = await checkProductHasData(product.title);
    
    const navItem = document.createElement('div');
    navItem.classList.add('nav-google-ads-item');
    if (isInactive) {
      navItem.classList.add('inactive-product');
    }
    if (!hasData) {
      navItem.classList.add('no-data-product');
    }
    navItem.setAttribute('data-google-ads-index', index);
    
    const smallCard = document.createElement('div');
    smallCard.classList.add('small-ad-details');
    
    const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
    const imageUrl = product.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
    const title = product.title || 'No title';
    
    smallCard.innerHTML = `
      <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
        <div class="small-ad-pos-value">${metrics.avgRating}</div>
        ${metrics.rankTrend.arrow ? `
          <div class="small-ad-pos-trend-container">
            <span class="small-ad-pos-trend" style="background-color: ${metrics.rankTrend.color};">
              ${metrics.rankTrend.arrow} ${metrics.rankTrend.change}
            </span>
          </div>
        ` : ''}
      </div>
      <div class="small-ad-vis-status">
        <div class="vis-status-left">
          <div class="vis-water-container" data-fill="${metrics.avgVisibility}">
            <span class="vis-percentage">${metrics.avgVisibility.toFixed(1)}%</span>
            ${metrics.visibilityTrend.arrow ? `
              <span class="vis-trend" style="background-color: ${metrics.visibilityTrend.color};">
                ${metrics.visibilityTrend.arrow} ${metrics.visibilityTrend.change}
              </span>
            ` : ''}
          </div>
        </div>
        <div class="vis-status-right">
          <div class="active-locations-count">${metrics.activeLocations}</div>
          <div class="inactive-locations-count">${metrics.inactiveLocations}</div>
        </div>
      </div>
      <img class="small-ad-image" 
           src="${imageUrl}" 
           alt="${title}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
      <div class="small-ad-title">${title}</div>
      ${!hasData ? '<div class="no-data-overlay">No performance data</div>' : ''}
    `;
    
    navItem.appendChild(smallCard);
    
    // Only add click handler if product has data
    if (hasData) {
      navItem.addEventListener('click', function() {
        selectGoogleAdsProduct(product, navItem);
      });
    }
    
    return navItem;
  }
  
  // Clear loading state
  productsNavContainer.innerHTML = '';
  
  // Render based on filter
  if (filter === 'all') {
    // Render active products
    for (const item of activeProducts) {
      const navItem = await createProductItem(item, false);
      productsNavContainer.appendChild(navItem);
    }
    
    // Add separator if there are inactive products
    if (inactiveProducts.length > 0) {
      const separator = document.createElement('div');
      separator.classList.add('products-separator');
      separator.innerHTML = `
        <div class="separator-line"></div>
        <div class="separator-text">Inactive Products</div>
        <div class="separator-line"></div>
      `;
      productsNavContainer.appendChild(separator);
    }
    
    // Render inactive products
    for (const item of inactiveProducts) {
      const navItem = await createProductItem(item, true);
      productsNavContainer.appendChild(navItem);
    }
  } else if (filter === 'active') {
    for (const item of activeProducts) {
      const navItem = await createProductItem(item, false);
      productsNavContainer.appendChild(navItem);
    }
  } else if (filter === 'inactive') {
    for (const item of inactiveProducts) {
      const navItem = await createProductItem(item, true);
      productsNavContainer.appendChild(navItem);
    }
  }
  
  // Update water fill heights
  setTimeout(() => {
    document.querySelectorAll('.vis-water-container[data-fill]').forEach(container => {
      const fillPercent = parseFloat(container.getAttribute('data-fill')) || 0;
      container.style.setProperty('--fill-height', fillPercent + '%');
    });
  }, 100);
}

function getGoogleAdsRatingBadgeColor(rating) {
  if (rating >= 1 && rating <= 3) return '#4CAF50'; // Green
  if (rating >= 4 && rating <= 8) return '#FFC107'; // Yellow
  if (rating >= 9 && rating <= 14) return '#FF9800'; // Orange
  return '#F44336'; // Red (above 14)
}

// Main function definition
function renderGoogleAdsTable() {
// Hide any product explorer elements that might be visible
const productExplorerTable = document.querySelector('.product-explorer-table');
if (productExplorerTable) {
  productExplorerTable.style.display = 'none';
}

// Also hide the explorer container if it exists
const explorerContainer = document.getElementById('productExplorerContainer');
if (explorerContainer) {
  explorerContainer.style.display = 'none';
}
  
  const existingTable = document.querySelector("#googleAdsContainer .google-ads-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderGoogleAdsTable] Starting to build product map table");
  
  const container = document.getElementById("googleAdsPage");
  if (!container) return;

  window.pendingGoogleAdsCharts = [];

if (window.googleAdsApexCharts) {
    window.googleAdsApexCharts.forEach(chart => {
      try {
        chart.destroy();
      } catch (e) {
        console.warn("Error destroying ApexChart:", e);
      }
    });
  }
  window.googleAdsApexCharts = [];
  
container.innerHTML = `
    <div id="googleAdsContainer" class="nav-collapsed" style="width: 100%; height: calc(100vh - 150px); position: relative; display: flex;">
      <div id="googleAdsNavPanel" class="collapsed" style="width: 400px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0;">
      </div>
      <div id="googleAdsTableContainer" style="flex: 1; height: 100%; overflow-y: auto; position: relative;">
        <div class="google-ads-top-controls">
          <div class="controls-left-group">
            <div class="first-row-controls">
<div class="google-ads-view-switcher">
  <button id="viewPerformanceOverviewGoogleAds" class="active">Performance Overview</button>
  <button id="viewOverviewGoogleAds">Product Overview</button>
  <button id="viewBucketsGoogleAds">Buckets & Funnels</button>
  <button id="viewChartsGoogleAds">Rank Map</button>
  <button id="viewMapGoogleAds">Map</button>
</div>
              <div class="chart-mode-toggle-top">
                <label>Channel Type</label>
                <label class="chart-mode-switch">
                  <input type="checkbox" id="chartModeToggle">
                  <span class="chart-mode-slider"></span>
                </label>
                <label>Campaigns</label>
              </div>
              <div class="previous-period-toggle-top">
                <label>Previous Period</label>
                <label class="chart-mode-switch">
                  <input type="checkbox" id="previousPeriodToggle">
                  <span class="chart-mode-slider"></span>
                </label>
              </div>
            </div>
            <div class="google-ads-buckets-switcher" id="googleAdsBucketsSwitcher" style="display: block;">
    <button id="bucketProfitability" class="bucket-btn active">Profitability</button>
    <button id="bucketFunnel" class="bucket-btn">Funnel</button>
    <button id="bucketInvestment" class="bucket-btn">Investment</button>
    <button id="bucketCustom" class="bucket-btn">Custom Tier</button>
    <button id="bucketSuggestions" class="bucket-btn">Suggestions</button>
            </div>
          </div>
          <div id="productInfoDateRange" class="product-info-date-selector-top" style="display: none;">
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
              <span id="productInfoDateText" style="color: #3c4043; font-size: 14px; font-weight: 500;">Last 7 days</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#5f6368" stroke-width="2">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
            <div id="productInfoDateDropdown" style="
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
              min-width: 200px;
            ">
              <div class="date-range-option" data-days="3" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 3 days</div>
              <div class="date-range-option" data-days="7" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 7 days</div>
              <div class="date-range-option" data-days="14" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 14 days</div>
              <div class="date-range-option" data-days="30" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 30 days</div>
              <div class="date-range-option" data-days="90" style="padding: 10px 16px; cursor: pointer; font-size: 14px; color: #3c4043;">Last 90 days</div>
            </div>
          </div>
        </div>
        <div id="googleAdsMapContainer" style="display: none; width: 100%; height: calc(100% - 60px); padding: 20px; box-sizing: border-box;">
        </div>
      </div>
    </div>
  `;

// Add view switcher functionality - UPDATED to handle new structure
const viewOverviewGoogleAdsBtn = document.getElementById("viewOverviewGoogleAds");
const viewChartsGoogleAdsBtn = document.getElementById("viewChartsGoogleAds");
const viewMapGoogleAdsBtn = document.getElementById("viewMapGoogleAds");

viewOverviewGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewOverviewGoogleAdsBtn.classList.add("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  if (viewBucketsGoogleAdsBtn) viewBucketsGoogleAdsBtn.classList.remove("active");
  if (viewPerformanceOverviewGoogleAdsBtn) viewPerformanceOverviewGoogleAdsBtn.classList.remove("active");

  // Expand the navigation panel
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.remove('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.remove('nav-collapsed');
  }
  
  // Hide the table
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'none';
  }

// Hide buckets switcher AND wrapper
  const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
  if (switcherWrapper) switcherWrapper.style.display = 'none';
  const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
  if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';

  // Show date range selector
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'block';
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Show overview containers, hide ranking map
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  
  if (productInfo) productInfo.style.display = 'block';
  if (productMetrics) productMetrics.style.display = 'block';
  if (productRankingMap) productRankingMap.style.display = 'none'; // ADD THIS LINE
  if (productTables) productTables.style.display = 'block';

  // Hide buckets-related containers
  const buckets_products = document.getElementById('buckets_products');
  const roasChannels = document.getElementById('roas_channels');
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  
  if (buckets_products) buckets_products.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  if (roasCharts) roasCharts.style.display = 'none';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  
  // Show and enable toggle controls
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) {
    chartModeToggle.style.display = 'inline-flex';
    // Set toggle to ON (checked) by default
    const toggleInput = chartModeToggle.querySelector('input[type="checkbox"]');
    if (toggleInput && !toggleInput.checked) {
      toggleInput.checked = true;
      toggleInput.dispatchEvent(new Event('change'));
    }
  }
  if (previousPeriodToggle) {
    previousPeriodToggle.style.display = 'inline-flex';
    // Set toggle to ON (checked) by default
    const toggleInput = previousPeriodToggle.querySelector('input[type="checkbox"]');
    if (toggleInput && !toggleInput.checked) {
      toggleInput.checked = true;
      toggleInput.dispatchEvent(new Event('change'));
    }
  }

    // Add delayed hide to ensure it stays hidden
  setTimeout(() => {
    const rankingMap = document.getElementById('product_ranking_map');
    if (rankingMap) {
      rankingMap.style.display = 'none';
      rankingMap.style.visibility = 'hidden'; // Extra measure
    }
  }, 100);
  
// Hide map and ROAS Buckets
  const mapContainer = document.getElementById('googleAdsMapContainer');
  if (mapContainer) mapContainer.style.display = 'none';
  // buckets_products already declared above, just reuse it
  if (buckets_products) buckets_products.style.display = 'none';
  // roasCharts already declared above, just reuse it
  if (roasCharts) roasCharts.style.display = 'none';
  const bucketedProductsContainer = document.getElementById('bucketed_products_container');
  if (bucketedProductsContainer) bucketedProductsContainer.style.display = 'none';
  
// Force re-selection of current product or select first one
const selectedNavItem = document.querySelector('.nav-google-ads-item.selected');
const firstNavItem = document.querySelector('.nav-google-ads-item');

if (selectedNavItem) {
  // Re-trigger selection of current product to reload data
  console.log('[Performance Overview] Re-triggering current product selection');
  selectedNavItem.click();
} else if (firstNavItem) {
  // No product selected, select first one
  console.log('[Performance Overview] Auto-selecting first product');
  firstNavItem.click();
} else {
  console.warn('[Performance Overview] No products available');
}
});

viewChartsGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewChartsGoogleAdsBtn.classList.add("active");
  viewOverviewGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  if (viewPerformanceOverviewGoogleAdsBtn) viewPerformanceOverviewGoogleAdsBtn.classList.remove("active");
  if (viewBucketsGoogleAdsBtn) viewBucketsGoogleAdsBtn.classList.remove("active");

  // Expand the navigation panel
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.remove('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.remove('nav-collapsed');
  }

// Hide buckets switcher AND wrapper
  const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
  if (switcherWrapper) switcherWrapper.style.display = 'none';
  const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
  if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';

  // Show date range selector
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'block';
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Hide overview containers, show ranking map
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  
  if (productInfo) productInfo.style.display = 'none';
  if (productMetrics) productMetrics.style.display = 'none';
  if (productRankingMap) productRankingMap.style.display = 'block'; // Show in performance
  if (productTables) productTables.style.display = 'none';

// Keep the table hidden
const table = document.querySelector('.google-ads-table');
if (table) {
  table.style.display = 'none';
}

// Hide map container
const mapContainer = document.getElementById('googleAdsMapContainer');
if (mapContainer) {
  mapContainer.style.display = 'none';
}
  
  // Hide ROAS Buckets
  const buckets_products = document.getElementById('buckets_products');
  if (buckets_products) buckets_products.style.display = 'none';
  const roasCharts = document.getElementById('roas_charts');
  if (roasCharts) roasCharts.style.display = 'none';
  const bucketedProductsContainer = document.getElementById('bucketed_products_container');
  if (bucketedProductsContainer) bucketedProductsContainer.style.display = 'none';

  // Also hide roas_metrics_table and roas_channels
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  
  // Hide toggle controls
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) chartModeToggle.style.display = 'none';
  if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';
  
  // Remove ranking mode from table and device containers
  document.querySelectorAll('.device-container').forEach(container => {
    container.classList.remove('overview-mode');
  });
  
  // Show BOTH segmentation charts AND position charts
  document.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });

  document.querySelectorAll('.rank-market-share-history').forEach(container => {
    container.style.display = 'none';
  });
  
  document.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
    container.style.display = 'flex';
    
    // Render position chart if record data is available
    if (container.combinationRecord) {
      renderGoogleAdsPositionChart(container, container.combinationRecord);
    }
  });
  // Populate ranking map for selected product
if (window.selectedGoogleAdsProduct) {
  const campaignFilter = document.getElementById('campaignNameFilter')?.value || 'all';
  const channelFilter = document.getElementById('channelTypeFilter')?.value || 'all';
  populateProductRankingMap(window.selectedGoogleAdsProduct, campaignFilter, channelFilter);
}
});

viewMapGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewMapGoogleAdsBtn.classList.add("active");
  viewOverviewGoogleAdsBtn.classList.remove("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  if (viewPerformanceOverviewGoogleAdsBtn) viewPerformanceOverviewGoogleAdsBtn.classList.remove("active");

  // Expand the navigation panel
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.remove('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.remove('nav-collapsed');
  }

// Hide buckets switcher AND wrapper
  const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
  if (switcherWrapper) switcherWrapper.style.display = 'none';
  const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
  if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';

  // Show date range selector
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'block';
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Hide the product table
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'none';
  }
  // Hide other containers
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  const buckets_products = document.getElementById('buckets_products');
  
if (productInfo) productInfo.style.display = 'none';
  if (productMetrics) productMetrics.style.display = 'none';
  if (productRankingMap) productRankingMap.style.display = 'none';
  if (productTables) productTables.style.display = 'none';
  if (buckets_products) buckets_products.style.display = 'none';
  const roasCharts = document.getElementById('roas_charts');
  if (roasCharts) roasCharts.style.display = 'none';
  const bucketedProductsContainer = document.getElementById('bucketed_products_container');
  if (bucketedProductsContainer) bucketedProductsContainer.style.display = 'none';

  // Also hide roas_metrics_table and roas_channels
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'none';
  
  // Hide toggle controls
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) chartModeToggle.style.display = 'none';
  if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';
  
  // Show the map container
  const mapContainer = document.getElementById('googleAdsMapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'block';
    
    // Clear existing content
    mapContainer.innerHTML = '';
    
    // Create map wrapper
    const mapWrapper = document.createElement('div');
    mapWrapper.id = 'mapWrapper';
    mapWrapper.style.width = '100%';
    mapWrapper.style.height = 'calc(100% - 60px)';
    mapContainer.appendChild(mapWrapper);
    
    // Create toggle button
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'location-blocks-toggle';
    toggleContainer.innerHTML = `
      <button id="toggleLocationBlocksGoogleAds" class="active">
        Hide Location Details
      </button>
    `;
    mapContainer.appendChild(toggleContainer);
    
    // Build map data for the selected product
    const mapProject = buildMapDataForSelectedGoogleAdsProduct();
    
    // Draw the US map using the mapsLib function
    if (window.mapHelpers && window.mapHelpers.drawUsMapWithLocations) {
      console.log('[Map View] Drawing map with project data:', mapProject);
      window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'google-ads');
      
      // Add location blocks after map is drawn
      setTimeout(() => {
        addLocationBlocksToMap(mapProject, '#mapWrapper');
      }, 500);
    } else {
      console.error('[Map View] mapHelpers not available');
      mapContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Map functionality not available</div>';
    }
    
    // Add toggle functionality
    document.getElementById('toggleLocationBlocksGoogleAds').addEventListener('click', function() {
      const blocks = document.querySelectorAll('.location-block');
      const button = this;
      
      if (button.classList.contains('active')) {
        // Hide blocks
        blocks.forEach(block => block.style.display = 'none');
        button.textContent = 'Show Location Details';
        button.classList.remove('active');
        button.classList.add('inactive');
      } else {
        // Show blocks
        blocks.forEach(block => block.style.display = 'block');
        button.textContent = 'Hide Location Details';
        button.classList.add('active');
        button.classList.remove('inactive');
      }
    });
  }
});

// Add Performance Overview button functionality
const viewPerformanceOverviewGoogleAdsBtn = document.getElementById("viewPerformanceOverviewGoogleAds");

viewPerformanceOverviewGoogleAdsBtn.addEventListener("click", function() {
  console.log('[Performance Overview] Button clicked');
  // Clear all active states
  viewPerformanceOverviewGoogleAdsBtn.classList.add("active");
  viewOverviewGoogleAdsBtn.classList.remove("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  if (viewBucketsGoogleAdsBtn) viewBucketsGoogleAdsBtn.classList.remove("active");

  // Collapse the navigation panel
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.add('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.add('nav-collapsed');
  }

  // Hide buckets switcher AND wrapper
  const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
  if (switcherWrapper) switcherWrapper.style.display = 'none';
  const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
  if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';

  // Hide date range selector
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'none';
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';

  // Hide the table
  const table = document.querySelector('.google-ads-table');
  if (table) table.style.display = 'none';

  // Hide other containers
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  const mapContainer = document.getElementById('googleAdsMapContainer');
  const bucketedProductsContainer = document.getElementById('bucketed_products_container');
  
  if (productInfo) productInfo.style.display = 'none';
  if (productMetrics) productMetrics.style.display = 'none';
  if (productRankingMap) productRankingMap.style.display = 'none';
  if (productTables) productTables.style.display = 'none';
  if (mapContainer) mapContainer.style.display = 'none';
  if (bucketedProductsContainer) bucketedProductsContainer.style.display = 'none';

// Show ONLY ROAS Charts container
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  
  if (roasCharts) roasCharts.style.display = 'block';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'block';
  if (buckets_products) buckets_products.style.display = 'none';
  
  // Hide toggle controls
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) chartModeToggle.style.display = 'none';
  if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';

    // Reset any filters on roas_channels
  const channelFilters = document.querySelectorAll('#roas_channels select');
  channelFilters.forEach(filter => {
    if (filter) filter.value = 'all';
  });

  // Reset device filter to 'all' for Performance Overview
  window.selectedDeviceFilter = 'all';

  // Load and render ROAS data
  loadAndRenderROASBuckets();
});

const viewBucketsGoogleAdsBtn = document.getElementById("viewBucketsGoogleAds");

viewBucketsGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewBucketsGoogleAdsBtn.classList.add("active");
  viewOverviewGoogleAdsBtn.classList.remove("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  if (viewPerformanceOverviewGoogleAdsBtn) viewPerformanceOverviewGoogleAdsBtn.classList.remove("active");

// Show buckets switcher with main switcher wrapper
const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
let switcherWrapper = document.getElementById('bucketsSwitcherWrapper');

if (bucketsSwitcher) {
  // Create wrapper if it doesn't exist
  if (!switcherWrapper) {
    switcherWrapper = document.createElement('div');
    switcherWrapper.id = 'bucketsSwitcherWrapper';
    switcherWrapper.className = 'buckets-switcher-wrapper';
    switcherWrapper.style.cssText = 'display: flex; gap: 15px; align-items: center; margin-bottom: 20px;';
    
    // Create main buckets switcher
    const mainBucketsSwitcher = document.createElement('div');
    mainBucketsSwitcher.id = 'mainBucketsSwitcher';
    mainBucketsSwitcher.className = 'google-ads-buckets-switcher main-buckets-switcher';
    mainBucketsSwitcher.innerHTML = `
      <button id="mainBucketsOverview" class="active">Buckets Overview</button>
      <button id="mainBucketedProducts">Products by Bucket</button>
    `;
    
    // Insert the wrapper where bucketsSwitcher currently is
    bucketsSwitcher.parentNode.insertBefore(switcherWrapper, bucketsSwitcher);
    
    // Move both switchers into the wrapper
    switcherWrapper.appendChild(mainBucketsSwitcher);
    switcherWrapper.appendChild(bucketsSwitcher);
  }
  
  // Show both wrapper and child elements
  switcherWrapper.style.display = 'flex';
  bucketsSwitcher.style.display = 'block';
}

// Initialize main buckets switcher with a small delay to ensure DOM is ready
setTimeout(() => {
  if (window.initializeMainBucketsSwitcher) {
    window.initializeMainBucketsSwitcher();
  }
}, 100);

  // Hide date range selector
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'none';
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Hide other views
  const table = document.querySelector('.google-ads-table');
  if (table) table.style.display = 'none';
  
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  const mapContainer = document.getElementById('googleAdsMapContainer');
  
  if (productInfo) productInfo.style.display = 'none';
  if (productMetrics) productMetrics.style.display = 'none';
  if (productRankingMap) productRankingMap.style.display = 'none';
  if (productTables) productTables.style.display = 'none';
  if (mapContainer) mapContainer.style.display = 'none';
  
// Show Metrics Table and Buckets containers (NOT roas_charts or roas_channels)
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  if (roasCharts) roasCharts.style.display = 'none';
  if (roasMetricsTable) {
    roasMetricsTable.style.display = 'block';
    roasMetricsTable.style.marginTop = '100px';  // Add margin-top
  }
  if (roasChannels) roasChannels.style.display = 'none';  // CHANGED from 'block' to 'none'
  if (buckets_products) buckets_products.style.display = 'block';
  
  // Show bucket date range for Buckets & Funnels
  if (bucketDateRange) bucketDateRange.style.display = 'block';
  
  // Hide toggle controls
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) chartModeToggle.style.display = 'none';
  if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';
  
// Collapse the navigation panel
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.add('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.add('nav-collapsed');
  }
  
  // Load and render both containers
  loadAndRenderROASBuckets();
});

// Add click handler for collapsed nav panel
document.addEventListener('click', function(e) {
  const navPanel = document.getElementById('googleAdsNavPanel');
  // Skip if we're in initial setup mode
  if (window._googleAdsInitializing) return;
  
  if (navPanel && navPanel.classList.contains('collapsed') && navPanel.contains(e.target)) {
    // Expand the panel and switch to Overview
    navPanel.classList.remove('collapsed');
    const contentWrapper = document.querySelector('.google-ads-content-wrapper');
    if (contentWrapper) {
      contentWrapper.classList.remove('nav-collapsed');
    }
    // Switch to Overview view
    document.getElementById('viewOverviewGoogleAds')?.click();
  }
});

// Initialize bucket switcher (from google_ads_buckets.js)
if (window.initializeBucketSwitcher) {
  window.initializeBucketSwitcher();
}

  // Add event listener for chart mode toggle
document.getElementById('chartModeToggle').addEventListener('change', function(e) {
  const mode = this.checked ? 'campaign' : 'channel';
  
  // Update product info charts
  if (window.currentProductInfoData) {
    renderProductInfoCharts(window.currentProductInfoData, mode);
    populateProductTables(window.currentProductInfoData, mode);
  }
});

// Add event listener for previous period toggle
document.getElementById('previousPeriodToggle').addEventListener('change', function(e) {
  // Update product tables if visible
  if (window.currentProductInfoData) {
    const isChannelMode = !document.getElementById('chartModeToggle')?.checked;
    populateProductTables(window.currentProductInfoData, isChannelMode ? 'channel' : 'campaign');
  }
});
  
  console.log("[renderGoogleAdsTable] Using myCompany:", window.myCompany);

  // Get the correct company for the current project
let companyToFilter = window.myCompany; // Default fallback

// Extract current project number from dataPrefix
const currentProjectNum = window.dataPrefix ? 
  parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
const projectKey = `acc1_pr${currentProjectNum}`;

// Find the company for this specific project from myCompanyArray
if (window.myCompanyArray && window.myCompanyArray.length > 0) {
  const match = window.myCompanyArray.find(item => 
    item && item.startsWith(projectKey)
  );
  if (match) {
    companyToFilter = match.split(' - ')[1] || window.myCompany;
  }
}

console.log(`[renderGoogleAdsTable] Using company for project ${currentProjectNum}: ${companyToFilter}`);
  
  window.pendingGoogleAdsCharts = [];
if (window.googleAdsApexCharts) {
    window.googleAdsApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.googleAdsApexCharts = [];

  if (!window.globalRows || typeof window.globalRows !== 'object') {
    window.globalRows = {};
    console.log("[DEBUG] Created new globalRows object");
  }

  if (!document.getElementById("google-ads-table-style")) {
    const style = document.createElement("style");
    style.id = "google-ads-table-style";
    style.textContent = `
      .google-ads-table {
        width: calc(100% - 40px);
        margin-left: 20px;
        border-collapse: collapse;
        background-color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 12px;
        overflow: hidden;
        table-layout: fixed;
      }
      .google-ads-table th {
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
.google-ads-table:not(.overview-mode) td {
  padding: 8px;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
  height: 400px;
  max-height: 400px;
  box-sizing: border-box;
  overflow: hidden;
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
      
      .location-bg-1 { background-color: #f0f8ff; }
      .location-bg-2 { background-color: #f0fff0; }
      .location-bg-3 { background-color: #fff0f5; }
      .location-bg-4 { background-color: #f5fffa; }
      .location-bg-5 { background-color: #f8f8ff; }
      .location-bg-6 { background-color: #f0ffff; }
      .location-bg-7 { background-color: #fffaf0; }
      .location-bg-8 { background-color: #f5f5dc; }
      .location-bg-9 { background-color: #faf0e6; }
      .location-bg-10 { background-color: #fff5ee; }
      
      .device-desktop { background-color: #f5f5f5; }
      .device-mobile { background-color: #ffffff; }
      
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
      
      .pie-chart-container {
        width: 75px;
        height: 75px;
        margin: 0 auto;
        position: relative;
      }
.trend-up {
  color: #4CAF50 !important;
  background: none !important;
}

.trend-down {
  color: #F44336 !important;
  background: none !important;
}

.trend-neutral {
  color: #999 !important;
  background: none !important;
}

.trend-change {
  background: none !important;
  padding: 0 !important;
}
/* Ensure no backgrounds on trend spans */
.trend-change span {
  background: none !important;
  color: inherit;
}

.trend-arrow {
  background: none !important;
}

/* Remove any potential inherited backgrounds */
.trend-values span {
  background: none !important;
}     
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
        background-color: #90EE90;
      }

      .segment-count-top4-8 {
        background-color: #FFFFE0;
      }

      .segment-count-top9-14 {
        background-color: #FFE4B5;
      }

      .segment-count-below14 {
        background-color: #FFB6C1;
      }
      
      .no-data-message {
        color: #999;
        font-style: italic;
        text-align: center;
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
      
      .google-ads-fullscreen-overlay {
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

      .google-ads-fullscreen-overlay .google-ads-table {
        width: 100%;
        margin-left: 0;
      }

      .google-ads-fullscreen-overlay .google-ads-table th:nth-child(5), 
      .google-ads-fullscreen-overlay .google-ads-table td:nth-child(5) {
        width: auto;
        min-width: 600px;
      }
      
.google-ads-view-switcher {
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 24px;
  padding: 4px;
  height: 36px;
}

.google-ads-view-switcher button {
  padding: 8px 20px;
  border: none;
  background: transparent;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

      .google-ads-view-switcher button.active {
        background-color: #007aff;
        color: white;
      }

      .google-ads-view-switcher button:hover:not(.active) {
        background-color: rgba(0, 122, 255, 0.1);
      }

      .google-ads-chart-avg-position {
        width: 100%;
        height: 100%;
        min-height: 380px;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 10px;
        display: none;
        align-items: center;
        justify-content: center;
        color: #999;
        font-style: italic;
      }
      
      .google-ads-segmentation-chart-container.loading {
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }

      .google-ads-segmentation-chart-container.loading::after {
        content: 'Loading chart...';
        font-size: 12px;
      }
      
      .google-ads-nav-cell {
        vertical-align: top;
        padding: 8px !important;
        background-color: #f9f9f9;
        border-right: 2px solid #dee2e6;
      }

      .google-ads-nav-container {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        overflow-x: hidden;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 5px;
      }

      .google-ads-nav-container::-webkit-scrollbar {
        width: 8px;
      }

      .google-ads-nav-container::-webkit-scrollbar-track {
        background: #e0e0e0;
        border-radius: 4px;
      }

      .google-ads-nav-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .google-ads-nav-container::-webkit-scrollbar-thumb:hover {
        background: #666;
      }

      .nav-google-ads-item {
        margin-bottom: 5px;
      }

.nav-google-ads-item .small-ad-details {
  width: 370px;
  height: 60px;
  margin-bottom: 0;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s;
}
.small-ad-vis-status {
  width: 50px;
  min-width: 50px;
  height: 50px;
  display: flex;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #ddd;
}

.vis-status-left {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #e3f2fd;
  position: relative;
}

.vis-status-right {
  display: none !important;
}

.vis-water-container {
  width: 100%;
  height: 100%;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.vis-water-container::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #1e88e5 0%, rgba(30, 136, 229, 0.7) 50%, rgba(30, 136, 229, 0.3) 100%);
  transition: height 0.3s ease-in-out;
  z-index: 1;
  height: var(--fill-height, 0%);
}

.vis-percentage {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: bold;
  color: #1565c0;
  text-align: center;
  opacity: 1;
}

.active-locations-count {
  height: 50%;
  background-color: #4CAF50;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.inactive-locations-count {
  height: 50%;
  background-color: #F44336;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: white;
  border-top: 1px solid #ddd;
}
      .nav-google-ads-item .small-ad-details:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
      }

      .nav-google-ads-item.selected .small-ad-details {
        border: 2px solid #007aff;
        box-shadow: 0 2px 6px rgba(0,122,255,0.3);
      }

      .nav-google-ads-item .small-ad-image {
        width: 50px;
        height: 50px;
        margin-right: 10px;
        margin-left: 10px;
      }

      .nav-google-ads-item .small-ad-title {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .nav-google-ads-item .small-ad-pos-badge {
        margin-left: auto;
      }
      
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
      .google-ads-view-switcher button {
  padding: 6px 12px;  /* Reduce padding for 3 buttons */
  border: none;
  background: transparent;
  border-radius: 17px;
  font-size: 12px;  /* Slightly smaller font */
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}
.status-active {
  background-color: #4CAF50;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}

.status-inactive {
  background-color: #FF9800;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  display: inline-block;
}
.device-icon {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.device-status {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
  text-align: center;
  padding: 8px 0;
}

.device-status-value {
  margin-top: 4px;
}

/* Hide rank history in Charts and Map modes, show position charts */
.google-ads-chart-avg-position {
  display: none;
}

#googleAdsMapContainer {
  padding-left: 40px !important;
  text-align: left !important;
}

#googleAdsMapContainer svg {
  margin-left: 0 !important;
}

.location-blocks-toggle {
  margin-top: 15px;
  text-align: center;
  padding: 10px;
}

.location-blocks-toggle button {
  background-color: #007aff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.location-blocks-toggle button:hover {
  background-color: #0056b3;
}

.location-blocks-toggle button.inactive {
  background-color: #ccc;
  color: #666;
}
/* Compact location blocks */
.location-block {
  pointer-events: all;
  cursor: default;
}

.location-block-content {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  border: 1px solid rgba(0, 122, 255, 0.2);
}

.location-block-header {
  background: #007aff;
  padding: 4px 12px;
  color: white;
  font-weight: 600;
  font-size: 13px;
  text-align: center;
}

.location-block-body {
  padding: 6px;
  background: white;
}

.location-device-row {
  display: flex;
  align-items: center;
  padding: 4px 8px;
  margin-bottom: 4px;
  background: #f8f9fa;
  border-radius: 4px;
  height: 32px;
}

.location-device-row:last-child {
  margin-bottom: 0;
}

.device-row-desktop {
  background: #f0f8ff;
}

.device-row-mobile {
  background: #fff5f5;
}

.search-term-circle {
  width: 20px;
  height: 20px;
  background: #007aff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 11px;
  margin-right: 6px;
  flex-shrink: 0;
}

.device-icon-wrapper {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
  flex-shrink: 0;
}

.map-device-icon {
  width: 20px;
  height: 20px;
  object-fit: contain;
}

.device-metrics {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.metric-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 700;
  color: #333;
}

.metric-trend {
  font-size: 11px;
  font-weight: 600;
}

.trend-positive {
  color: #4CAF50;
}

.trend-negative {
  color: #F44336;
}

.trend-neutral {
  color: #999;
}

.metric-divider {
  width: 1px;
  height: 16px;
  background: #ddd;
  margin: 0 4px;
}

.device-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-left: auto;
  flex-shrink: 0;
}

.status-active {
  background: #4CAF50;
}

.status-inactive {
  background: #F44336;
}
.google-ads-separator {
  display: flex;
  align-items: center;
  margin: 20px 10px;
  opacity: 0.6;
}

.separator-line {
  flex: 1;
  height: 1px;
  background-color: #ccc;
}

.separator-text {
  padding: 0 15px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  text-transform: uppercase;
}

.nav-google-ads-item.inactive-product {
  filter: grayscale(100%) brightness(0.8);
  opacity: 0.7;
}

.nav-google-ads-item.inactive-product:hover {
  filter: grayscale(70%) brightness(0.9);
  opacity: 0.9;
}

.nav-google-ads-item.inactive-product .small-ad-details {
  background-color: #f5f5f5;
  border: 1px solid #ddd;
}
.product-counter-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: white;
  text-align: center;
  min-width: 45px;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
}

.product-counter-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.all-badge {
  background-color: #2196F3;
}

.active-badge {
  background-color: #4CAF50;
}

.inactive-badge {
  background-color: #F44336;
}

.product-counter-badge.disabled {
  filter: grayscale(100%);
  opacity: 0.6;
}

.product-counter-badge.disabled:hover {
  transform: none;
  box-shadow: none;
}
.metric-toggle-btn {
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  border: 2px solid;
}

.metric-toggle-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.metric-toggle-btn.active {
  transform: scale(1.02);
}
/* Trends toggle switch styles */
.trends-toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.trends-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.trends-toggle-slider {
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

.trends-toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.trends-toggle-switch input:checked + .trends-toggle-slider {
  background-color: #007aff;
}

.trends-toggle-switch input:checked + .trends-toggle-slider:before {
  transform: translateX(20px);
}

/* Trends container styles */
.google-ads-trends-container {
  width: 180px;
  min-width: 180px;
  height: 540px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  padding: 15px;
  overflow-y: auto;
  overflow-x: hidden;
  position: relative;
  display: block;
  flex-shrink: 0;
}

/* When more than 8 metrics are selected */
.google-ads-trends-container.expanded {
  height: auto;
  max-height: 600px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.trends-container-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.trend-item {
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  transition: all 0.2s;
}

.trend-item:last-child {
  border-bottom: none;
}

.trend-item:hover {
  background: rgba(232, 240, 254, 0.3);
  padding-left: 4px;
  padding-right: 4px;
  border-radius: 4px;
}

.trend-metric-name {
  font-size: 11px;
  color: #666;
  margin-bottom: 4px;
  font-weight: 500;
}

.trend-values {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.trend-current-value {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.trend-change {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  font-weight: 500;
}

.trend-up {
  color: #4CAF50;
}

.trend-down {
  color: #F44336;
}

.trend-neutral {
  color: #999;
}

.trend-arrow {
  font-size: 10px;
}

/* Chart container transition */
#productMetricsChart {
  transition: width 0.3s ease-out;
}
/* Trends settings button */
.trends-settings-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 24px;
  height: 24px;
  background: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}

.trends-settings-btn:hover {
  background: #e8e8e8;
  border-color: #999;
}

.trends-settings-btn svg {
  width: 14px;
  height: 14px;
  stroke: #666;
}

/* Metrics selector popup */
.metrics-selector-popup {
  position: fixed;
  width: 260px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  padding: 15px;
  display: none;
  z-index: 10000;
  max-height: 400px;
  overflow-y: auto;
}

.metrics-selector-popup.visible {
  display: block;
}

.metrics-selector-popup {
  opacity: 0;
  transform: scale(0.95);
  transition: opacity 0.2s, transform 0.2s;
}

.metrics-selector-popup.visible {
  display: block;
  opacity: 1;
  transform: scale(1);
}

.metrics-selector-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.metric-selector-item {
  display: flex;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.metric-selector-toggle {
  margin-right: 10px;
}

/* Custom toggle switch for metrics */
.metric-toggle-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.metric-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.metric-toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 20px;
}

.metric-toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.metric-toggle-switch input:checked + .metric-toggle-slider {
  background-color: #007aff;
}

.metric-toggle-switch input:checked + .metric-toggle-slider:before {
  transform: translateX(16px);
}
/* Product Info Container Styles */
.product-info-wrapper {
  display: flex;
  gap: 20px;
  height: 100%;
  align-items: stretch;
  position: relative;
}

.product-info-left {
  width: 280px;
  height: 210px;
  background: #f8f9fa;
  border-radius: 12px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.product-info-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  line-height: 1.4;
  min-height: 40px;
}

.product-info-bottom-section {
  flex: 1;
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.product-info-image {
  width: 100px;
  height: 100px;
  object-fit: contain;
  border-radius: 8px;
  background: white;
  padding: 4px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.product-info-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 8px;
}

.product-info-price {
  font-size: 24px;
  font-weight: 700;
  color: #007aff;
  margin-bottom: 8px;
}

.product-info-reviews {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  font-size: 13px;
  color: #666;
}

.product-stars {
  color: #ffa500;
  font-size: 14px;
}

.product-review-count {
  color: #999;
  font-size: 12px;
}

.product-info-right {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chart-controls-row {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 4px 0;
}

.chart-mode-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart-mode-toggle label {
  font-size: 11px;
  font-weight: 500;
  color: #666;
}

.chart-mode-switch {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
}

.chart-mode-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.chart-mode-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 20px;
}

.chart-mode-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.chart-mode-switch input:checked + .chart-mode-slider {
  background-color: #007aff;
}

.chart-mode-switch input:checked + .chart-mode-slider:before {
  transform: translateX(16px);
}

.chart-legends {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #666;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
  flex-shrink: 0;
}

.radial-charts-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 15px;
  flex: 1;
  align-items: center;
}

.radial-chart-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.radial-chart-container {
  width: 120px;
  height: 120px;
}

.radial-chart-label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-top: 8px;
  text-align: center;
}

.radial-chart-sublabel {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
  font-weight: 500;
}

/* Date range selector in product info */
.product-info-date-selector {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 100;
}

/* Adjust product_info container top margin */
#product_info {
  margin-top: 60px !important;
}
/* Product Tables Container */
#product_tables {
  width: 1195px;
  margin: 20px 0 20px 20px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  padding: 20px;
  display: none;
}

.product-tables-content {
  width: 100%;
  overflow-x: auto;
}

.product-metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.product-metrics-table th {
  background: #f8f9fa;
  padding: 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.product-metrics-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #eee;
}

.product-metrics-table tr:hover {
  background-color: #f8f9fa;
}

.product-metrics-table td:first-child {
  font-weight: 500;
  color: #333;
}

/* Update top controls to handle the new layout */
.google-ads-top-controls {
  position: absolute;
  top: 10px;
  left: 20px;
  width: 1195px;
  max-width: 1195px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  z-index: 100;
  margin-bottom: 15px;
}

.controls-left-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-start;
}

.first-row-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* Update chart-mode-toggle for top placement */
.chart-mode-toggle-top {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 20px;
  height: 36px;
}

.chart-mode-toggle-top label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}
.product-info-date-selector-top {
  margin-left: auto;
  position: relative;
}

/* Update top controls to handle the new layout */
.google-ads-top-controls {
  position: absolute;
  top: 10px;
  left: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 20px;
  z-index: 100;
  margin-bottom: 15px;
}
/* Product table enhancements */
.product-metrics-table th.sortable {
  cursor: pointer;
  user-select: none;
  position: relative;
  padding-right: 20px;
}

.product-metrics-table th.sortable:hover {
  background-color: #e8e8e8;
}

.sort-indicator {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
  font-size: 10px;
}

.clickable-campaign {
  cursor: pointer;
  color: #007aff;
  text-decoration: none;
}

.clickable-campaign:hover {
  color: #0056b3;
  background-color: rgba(0, 122, 255, 0.05);
}

.impression-bar-container {
  position: relative;
  width: 100%;
  height: 24px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
}

.impression-bar {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  background-color: #007aff;
  display: flex;
  align-items: center;
  padding: 0 8px;
  min-width: fit-content;
  transition: width 0.3s ease;
}

.impression-value {
  color: white;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.previous-period-toggle-top {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  background: #f0f0f0;
  padding: 6px 12px;
  border-radius: 20px;
  height: 36px;
}

.previous-period-toggle-top label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

/* Table trend styles */
.table-value-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.table-current-value {
  font-size: 14px;
  color: #333;
}

.table-trend-value {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 2px;
}

.table-trend-up {
  color: #4CAF50;
}

.table-trend-down {
  color: #F44336;
}

.table-trend-neutral {
  color: #999;
}

.table-trend-arrow {
  font-size: 9px;
}
/* Product Ranking Map Styles */
.ranking-map-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.ranking-map-table th {
  background: #f8f9fa;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  border-bottom: 2px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;
}

.ranking-map-table td {
  padding: 4px 8px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 11px;
  height: 24px;
  line-height: 16px;
}

.ranking-map-table tr:hover {
  background-color: #f8f9fa;
}

.ranking-map-table td:first-child {
  font-weight: 600;
  color: #333;
  text-align: center;
  width: 60px;
}

.ranking-position-1 td:first-child,
.ranking-position-2 td:first-child,
.ranking-position-3 td:first-child { background-color: #dfffd6; }

.ranking-position-4 td:first-child,
.ranking-position-5 td:first-child,
.ranking-position-6 td:first-child,
.ranking-position-7 td:first-child,
.ranking-position-8 td:first-child { background-color: #ffffc2; }

.ranking-position-9 td:first-child,
.ranking-position-10 td:first-child,
.ranking-position-11 td:first-child,
.ranking-position-12 td:first-child,
.ranking-position-13 td:first-child,
.ranking-position-14 td:first-child { background-color: #ffe0bd; }

/* Add this for rows below 14 */
.ranking-position-below-14 td:first-child { background-color: #ffcfcf; }

/* Heat map cell coloring */
.heat-map-best {
  background-color: rgba(76, 175, 80, 0.15) !important;
}

.heat-map-good {
  background-color: rgba(76, 175, 80, 0.08) !important;
}

.heat-map-poor {
  background-color: rgba(244, 67, 54, 0.08) !important;
}

.heat-map-worst {
  background-color: rgba(244, 67, 54, 0.15) !important;
}

/* Segmented mode styles */
.ranking-map-segmented-toggle {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.ranking-map-segmented-toggle label {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}
/* Double row height in segmented mode */
.ranking-map-table.segmented-mode td {
  height: 48px !important;
  line-height: 32px !important;
  padding: 8px 8px !important;
}
/* Enhanced funnel styles */
.funnel-overflow-text {
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.roas-column-indicator {
  transition: all 0.3s ease;
}

.roas-column-indicator:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3) !important;
}

/* Funnel section hover effects */
.funnel-section:hover .roas-indicator {
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

/* Responsive overflow text */
@media (max-width: 1400px) {
  .funnel-overflow-text {
    font-size: 10px;
    min-width: 200px;
  }
}
/* Enhanced funnel columns */
.funnel-metrics-column {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  padding: 15px 5px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.funnel-metrics-indicator {
  transition: all 0.3s ease;
  cursor: default;
}

.funnel-metrics-indicator:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3) !important;
}

/* Trapezoid content styling */
.trapezoid-content {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Description overflow styling */
.bucket-description-overflow {
  backdrop-filter: blur(5px);
  border: 1px solid rgba(255,255,255,0.2);
}

.bucket-description-overflow::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 20px;
  width: 0;
  height: 0;
  border-top: 8px solid transparent;
  border-bottom: 8px solid transparent;
  border-right: 8px solid;
  border-right-color: inherit;
}

/* Percentage visualization */
.percentage-bar-bg {
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.2));
}

.percentage-bar-fill {
  filter: drop-shadow(0 1px 3px rgba(0,0,0,0.3));
}
/* Enhanced tooltip styling */
.chartjs-tooltip {
  opacity: 1 !important;
  position: absolute;
  background: rgba(255, 255, 255, 0.95) !important;
  border-radius: 8px !important;
  color: #333 !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  pointer-events: none !important;
  transform: translate(-50%, 0) !important;
  transition: all 0.1s ease !important;
  padding: 12px !important;
  min-width: 200px !important;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
}
.google-ads-buckets-switcher {
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 24px;
  padding: 4px;
  height: 36px;
}

.google-ads-buckets-switcher button {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.google-ads-buckets-switcher button.active {
  background-color: #007aff;
  color: white;
}

.google-ads-buckets-switcher button:hover:not(.active) {
  background-color: rgba(0, 122, 255, 0.1);
}
.first-row-controls {
  display: flex;
  align-items: center;
  gap: 20px;
}

.controls-left-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.buckets-switcher-wrapper {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 20px;
}

.main-buckets-switcher {
  background-color: #e8f0fe !important;
  border: 1px solid #dadce0;
}

.main-buckets-switcher button {
  color: #1a73e8 !important;
  font-weight: 500;
}

.main-buckets-switcher button.active {
  background-color: #1a73e8 !important;
  color: white !important;
}

.main-buckets-switcher button:hover:not(.active) {
  background-color: rgba(26, 115, 232, 0.1);
}

.bucketed-product-item:hover {
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
  transform: translateY(-2px);
}

.bucketed-product-item .vis-water-container::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, #1e88e5 0%, rgba(30, 136, 229, 0.7) 50%, rgba(30, 136, 229, 0.3) 100%);
  transition: height 0.3s ease-in-out;
  z-index: 1;
  height: var(--fill-height, 0%);
}
/* Position trend styling */
.small-ad-pos-trend-container {
  margin-top: 2px;
  display: flex;
  justify-content: center;
}
.small-ad-pos-trend {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  color: white !important;
  padding: 2px 4px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

/* Visibility trend styling */
.vis-trend {
  display: block;
  font-size: 8px;
  font-weight: 700;
  color: white !important;
  padding: 2px 4px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  margin-top: 2px;
  text-align: center;
}

/* Adjust water container for trends */
.vis-water-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
/* Navigation panel animation styles */
#googleAdsNavPanel {
  transition: width 0.3s ease-in-out, min-width 0.3s ease-in-out;
  overflow: hidden;
  position: relative;
}

#googleAdsNavPanel.collapsed {
  width: 12px !important;
  min-width: 12px !important;
}

#googleAdsNavPanel.collapsed > * {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.2s ease-in-out, visibility 0.2s ease-in-out;
}

/* Vertical indicator for collapsed state */
#googleAdsNavPanel.collapsed::before {
  content: '';
  position: absolute;
  top: 0;
  left: 4px;
  width: 4px;
  height: 100%;
  background: linear-gradient(to bottom, #007aff, #0056b3);
  border-radius: 2px;
  opacity: 0.6;
  transition: opacity 0.3s ease-in-out;
}

#googleAdsNavPanel.collapsed:hover::before {
  opacity: 1;
  cursor: pointer;
}

/* Adjust content wrapper when nav is collapsed */
.google-ads-content-wrapper {
  transition: margin-left 0.3s ease-in-out;
}

.google-ads-content-wrapper.nav-collapsed {
  margin-left: -388px; /* Negative margin to shift content left */
}
.nav-google-ads-item.no-data-product {
  position: relative;
}

.nav-google-ads-item.no-data-product .small-ad-details {
  filter: grayscale(100%) opacity(0.6);
  cursor: not-allowed;
  position: relative;
}

.nav-google-ads-item.no-data-product .small-ad-details:hover {
  transform: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.no-data-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: #666;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  white-space: nowrap;
  z-index: 10;
}
#googleAdsTableContainer {
  background: transparent !important;
}

#googleAdsContentWrapper {
  background: transparent !important;
}

/* Ensure ranking map container has proper background */
#product_ranking_map {
  background-color: #fff !important;
}
/* Ensure Google Ads content is above product explorer */
#googleAdsTableContainer {
  position: relative;
  z-index: 100;
  background-color: #fff !important;
}

#product_ranking_map {
  position: relative;
  z-index: 101;
  background-color: #fff !important;
}

.google-ads-content-wrapper {
  position: relative;
  z-index: 100;
  background-color: #fff !important;
}

/* Hide product explorer when Google Ads is active */
.google-ads-active .product-explorer-table {
  display: none !important;
}
    `;
    document.head.appendChild(style);
  }

  if (!document.getElementById("centered-google-ads-panel-spinner-style")) {
    const spinnerStyle = document.createElement("style");
    spinnerStyle.id = "centered-google-ads-panel-spinner-style";
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

  const allCompanyProducts = [];
  const productMap = new Map();

  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === (companyToFilter || "").toLowerCase()) {
        const productKey = product.title || '';
        
        if (!productMap.has(productKey)) {
          productMap.set(productKey, product);
          allCompanyProducts.push(product);
        }
      }
    });
  }

  console.log(`[renderGoogleAdsTable] Found ${allCompanyProducts.length} unique products for ${companyToFilter}`);

  allCompanyProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const googleAdsNavPanel = document.getElementById('googleAdsNavPanel');
googleAdsNavPanel.innerHTML = `
  <div style="padding: 15px; margin: 0; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Products</h3>
    <div id="googleAdsCounter" style="display: flex; gap: 8px;">
      <span class="product-counter-badge all-badge" data-filter="all">0 All</span>
      <span class="product-counter-badge active-badge disabled" data-filter="active">0 Active</span>
      <span class="product-counter-badge inactive-badge disabled" data-filter="inactive">0 Inactive</span>
    </div>
  </div>
`;
  
  const productsNavContainer = document.createElement('div');
  productsNavContainer.classList.add('products-nav-container');
  productsNavContainer.style.padding = '10px';

// Calculate metrics for all products and separate active/inactive
const productsWithMetrics = allCompanyProducts.map((product, index) => ({
  product,
  index,
  metrics: calculateGoogleAdsProductMetrics(product)
}));

// Separate active and inactive products
const activeProducts = productsWithMetrics.filter(item => !item.metrics.isFullyInactive);
const inactiveProducts = productsWithMetrics.filter(item => item.metrics.isFullyInactive);

// Sort both groups by rank (lower rank = better = higher in list)
activeProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
inactiveProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);

// Initial render with all products
renderFilteredGoogleAdsProducts(productsNavContainer, activeProducts, inactiveProducts, 'all').then(() => {
  console.log('[renderGoogleAdsTable] Products rendered with data availability check');
});

// Update the counter display
const allCountBadge = document.querySelector('.all-badge');
const activeCountBadge = document.querySelector('.active-badge');
const inactiveCountBadge = document.querySelector('.inactive-badge');

if (allCountBadge && activeCountBadge && inactiveCountBadge) {
  const totalCount = activeProducts.length + inactiveProducts.length;
  allCountBadge.textContent = `${totalCount} All`;
  activeCountBadge.textContent = `${activeProducts.length} Active`;
  inactiveCountBadge.textContent = `${inactiveProducts.length} Inactive`;
  
  // Add click handlers
  [allCountBadge, activeCountBadge, inactiveCountBadge].forEach(badge => {
    badge.addEventListener('click', function() {
      const filter = this.getAttribute('data-filter');
      
      // Update badge styles
      document.querySelectorAll('.product-counter-badge').forEach(b => {
        if (b === this) {
          b.classList.remove('disabled');
        } else {
          b.classList.add('disabled');
        }
      });
      
// Re-render products with filter (async now)
renderFilteredGoogleAdsProducts(productsNavContainer, activeProducts, inactiveProducts, filter);
    });
  });
}

  googleAdsNavPanel.appendChild(productsNavContainer);
  
// Auto-select first product and properly populate all containers
setTimeout(async () => {
  console.log('[renderGoogleAdsTable] Auto-selecting first product and populating containers...');
  
  // Set initialization flag to prevent nav panel expansion
  window._googleAdsInitializing = true;
  
  // Find the first product WITH data
  let firstProductWithData = null;
  let firstNavItemWithData = null;
  
  const allNavItems = document.querySelectorAll('.nav-google-ads-item:not(.no-data-product)');
  
  for (const navItem of allNavItems) {
    const index = parseInt(navItem.getAttribute('data-google-ads-index'));
    if (!isNaN(index) && allCompanyProducts[index]) {
      const product = allCompanyProducts[index];
      const hasData = await checkProductHasData(product.title);
      if (hasData) {
        firstProductWithData = product;
        firstNavItemWithData = navItem;
        break;
      }
    }
  }
  
  if (!firstProductWithData || !firstNavItemWithData) {
    console.warn('[renderGoogleAdsTable] No products with data found');
    window._googleAdsInitializing = false;
    
    const tableContainer = document.querySelector("#googleAdsTableContainer");
    const emptyMessage = document.createElement('div');
    emptyMessage.id = 'googleAdsEmptyMessage';
    emptyMessage.style.padding = '40px';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#666';
    emptyMessage.innerHTML = '<h3>No products with performance data found</h3><p>Please check if data is available in the Google Sheets integration.</p>';
    tableContainer.appendChild(emptyMessage);
    return;
  }
  
  console.log('[renderGoogleAdsTable] Auto-selecting product with data:', firstProductWithData.title);
  
  // FIRST: Select the product and wait for it to complete
  await selectGoogleAdsProduct(firstProductWithData, firstNavItemWithData);
  
  // Wait a bit more to ensure all data is loaded
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // NOW collapse the nav panel and set up Performance Overview
  const navPanel = document.getElementById('googleAdsNavPanel');
  const contentWrapper = document.querySelector('.google-ads-content-wrapper');
  if (navPanel) {
    navPanel.classList.add('collapsed');
  }
  if (contentWrapper) {
    contentWrapper.classList.add('nav-collapsed');
  }
  
  // Set Performance Overview as active
  const performanceOverviewBtn = document.getElementById('viewPerformanceOverviewGoogleAds');
  const overviewBtn = document.getElementById('viewOverviewGoogleAds');
  const bucketsBtn = document.getElementById('viewBucketsGoogleAds');
  const chartsBtn = document.getElementById('viewChartsGoogleAds');
  const mapBtn = document.getElementById('viewMapGoogleAds');

  // Set button states
  if (performanceOverviewBtn) performanceOverviewBtn.classList.add('active');
  if (overviewBtn) overviewBtn.classList.remove('active');
  if (bucketsBtn) bucketsBtn.classList.remove('active');
  if (chartsBtn) chartsBtn.classList.remove('active');
  if (mapBtn) mapBtn.classList.remove('active');
  
  // Set up Performance Overview state
  const table = document.querySelector('.google-ads-table');
  if (table) table.style.display = 'none';
  
  const productInfo = document.getElementById('product_info');
  const productMetrics = document.getElementById('product_metrics');
  const productRankingMap = document.getElementById('product_ranking_map');
  const productTables = document.getElementById('product_tables');
  const mapContainer = document.getElementById('googleAdsMapContainer');
  
  if (productInfo) productInfo.style.display = 'none';
  if (productMetrics) productMetrics.style.display = 'none';
  if (productRankingMap) productRankingMap.style.display = 'none';
  if (productTables) productTables.style.display = 'none';
  if (mapContainer) mapContainer.style.display = 'none';

  // Hide productInfoDateRange for Performance Overview
  const productInfoDateRange = document.getElementById('productInfoDateRange');
  if (productInfoDateRange) productInfoDateRange.style.display = 'none';
  
  // Hide bucket date range
  const bucketDateRange = document.getElementById('bucketDateRange');
  if (bucketDateRange) bucketDateRange.style.display = 'none';
  
  // Hide buckets switcher for Performance Overview
  const bucketsSwitcher = document.getElementById('googleAdsBucketsSwitcher');
  if (bucketsSwitcher) bucketsSwitcher.style.display = 'none';
  const switcherWrapper = document.getElementById('bucketsSwitcherWrapper');
  if (switcherWrapper) switcherWrapper.style.display = 'none';
  
  const roasCharts = document.getElementById('roas_charts');
  const roasMetricsTable = document.getElementById('roas_metrics_table');
  const roasChannels = document.getElementById('roas_channels');
  const buckets_products = document.getElementById('buckets_products');
  
  // Only show roas_charts for Performance Overview
  if (roasCharts) roasCharts.style.display = 'block';
  if (roasMetricsTable) roasMetricsTable.style.display = 'none';
  if (roasChannels) roasChannels.style.display = 'block';
  if (buckets_products) buckets_products.style.display = 'none';
  
  // Set device filter to 'all' for initial load
  window.selectedDeviceFilter = 'all';
  
  // Hide toggle controls for Performance Overview
  const chartModeToggle = document.querySelector('.chart-mode-toggle-top');
  const previousPeriodToggle = document.querySelector('.previous-period-toggle-top');
  if (chartModeToggle) chartModeToggle.style.display = 'none';
  if (previousPeriodToggle) previousPeriodToggle.style.display = 'none';
  
  // NOW load the ROAS data after product is fully selected
  if (window.loadAndRenderROASBuckets) {
    console.log('[renderGoogleAdsTable] Loading ROAS data for Performance Overview');
    window.loadAndRenderROASBuckets();
  }
  
  // Clear initialization flag
  window._googleAdsInitializing = false;
  
}, 500); // Initial timeout
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Export the function
if (typeof window !== 'undefined') {
window.renderGoogleAdsTable = renderGoogleAdsTable;
window.renderAvgPositionChartGoogleAds = renderAvgPositionChartGoogleAds;
window.updateChartLineVisibilityGoogleAds = updateChartLineVisibilityGoogleAds;
window.renderGoogleAdsPositionChart = renderGoogleAdsPositionChart;
}
