window.pendingGoogleAdsCharts = [];
window.googleAdsApexCharts = [];
window.selectedGoogleAdsProduct = null;

// Helper functions defined at the top level
function getProductRecords(product) {
  if (!window.allRows || !product) return [];
  
  return window.allRows.filter(record => 
    record.title === product.title && 
    record.source === product.source
  );
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
  
  if (!window.explorerApexCharts) {
    window.explorerApexCharts = [];
  }
  window.explorerApexCharts.push(chart);
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
  console.log('[selectGoogleAdsProduct] Selecting product:', product.title);
  
  document.querySelectorAll('.nav-google-ads-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (navItemElement) {
    navItemElement.classList.add('selected');
  }
  
  window.selectedExplorerProduct = product;
  const currentViewMode = document.querySelector('.google-ads-view-switcher .active')?.id || 'viewRankingGoogleAds';
  
  const combinations = getProductCombinations(product);
  console.log(`[selectGoogleAdsProduct] Found ${combinations.length} combinations for ${product.title}`);
  
  renderTableForSelectedGoogleAdsProduct(combinations, currentViewMode);
  
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
        window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'explorer');
        
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
}

function renderTableForSelectedGoogleAdsProduct(combinations, initialViewMode = 'viewRankingGoogleAds') {
  console.log('[renderTableForSelectedGoogleAdsProduct] Starting with', combinations.length, 'combinations');
  
  const existingTable = document.querySelector("#googleAdsContainer .google-ads-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  window.pendingExplorerCharts = [];
  
  if (window.explorerApexCharts) {
    window.explorerApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.explorerApexCharts = [];
  
  const table = document.createElement("table");
  table.classList.add("product-explorer-table");
  
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
const chartContainerId = `explorer-segmentation-chart-${chartCounter++}`;
tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="explorer-segmentation-chart-container loading"></div>`;
tr.appendChild(tdSegmentation);

const tdRankMarketShare = document.createElement("td");
const positionChartId = `explorer-position-chart-${chartCounter}`;

// Create rank & market share history
const rankMarketShareHistory = createProductRankMarketShareHistory(combination.record);

tdRankMarketShare.innerHTML = `
  <div id="${positionChartId}" class="explorer-chart-avg-position" style="display: none;">Click "Charts" view to see position trends</div>
  <div class="rank-market-share-history">${rankMarketShareHistory}</div>
`;
tr.appendChild(tdRankMarketShare);
        
        const chartInfo = {
          containerId: chartContainerId,
          positionChartId: positionChartId,
          combination: combination,
          selectedProduct: window.selectedExplorerProduct
        };
        
        if (!window.pendingExplorerCharts) {
          window.pendingExplorerCharts = [];
        }
        window.pendingExplorerCharts.push(chartInfo);
        
        tbody.appendChild(tr);
      });
    });
  });
  
const container = document.querySelector("#googleAdsTableContainer");
container.appendChild(table);

console.log('[renderTableForSelectedGoogleAdsProduct] Table created, rendering charts...');

// Set visibility fill heights for water effect
setTimeout(() => {
  setVisibilityFillHeights();
}, 100);

renderPendingGoogleAdsChartsForProduct();
  
// Apply initial view mode immediately after table creation
if (initialViewMode === 'viewRankingGoogleAds') {
  // Apply ranking mode immediately without delay
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.classList.add('ranking-mode');
  }
  
  // Ensure the ranking button is active immediately
  const rankingBtn = document.getElementById('viewRankingGoogleAds');
  const chartsBtn = document.getElementById('viewChartsGoogleAds');
  const mapBtn = document.getElementById('viewMapGoogleAds');
  if (rankingBtn) rankingBtn.classList.add('active');
  if (chartsBtn) chartsBtn.classList.remove('active');
  if (mapBtn) mapBtn.classList.remove('active');
  
  // Apply to device containers and hide charts immediately
  setTimeout(() => {
    document.querySelectorAll('.device-container').forEach(container => {
      container.classList.add('ranking-mode');
    });
    
    document.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
      container.style.display = 'none';
    });
    document.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
      container.style.display = 'none';
    });
  }, 10); // Minimal delay just for DOM elements to be created
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
    const charts = window.pendingExplorerCharts;
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
    
    window.pendingExplorerCharts = [];
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
  if (!window.selectedExplorerProduct) {
    console.warn('[buildMapDataForSelectedGoogleAdsProduct] No product selected');
    return { searches: [] };
  }
  
  const productRecords = getProductRecords(window.selectedExplorerProduct);
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
function renderProductPositionChart(container, record) {
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

function calculateProductMetrics(product) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return { avgRating: 40, avgVisibility: 0, activeLocations: 0, inactiveLocations: 0, isFullyInactive: true };
  }
  
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
      const isActive = record.product_status === 'active' || !record.product_status;
      if (isActive) hasAnyActiveLocation = true;
      
      if (!locationStatusMap.has(location)) {
        locationStatusMap.set(location, { hasActive: false, hasInactive: false });
      }
      if (isActive) {
        locationStatusMap.get(location).hasActive = true;
      } else {
        locationStatusMap.get(location).hasInactive = true;
      }
    }
    
    // Process ALL records (both active and inactive) for metrics calculation
    if (!combinationMetrics.has(comboKey)) {
      combinationMetrics.set(comboKey, { 
        rankSum: 0, 
        rankCount: 0, 
        visibilitySum: 0, 
        visibilityCount: 0,
        record: record,
        isActive: record.product_status === 'active' || !record.product_status
      });
    }
    
    const combo = combinationMetrics.get(comboKey);
    
    // Calculate rank from historical data
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
        const endDate = latestDate.clone();
        const startDate = endDate.clone().subtract(6, 'days');
        
        const recentData = record.historical_data.filter(item => {
          if (!item.date || !item.date.value || item.avg_position == null) return false;
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          return itemDate.isBetween(startDate, endDate, 'day', '[]');
        });
        
        if (recentData.length > 0) {
          const avgRank = recentData.reduce((sum, item) => sum + parseFloat(item.avg_position), 0) / recentData.length;
          combo.rankSum += avgRank;
          combo.rankCount++;
        }
        
// Calculate visibility using the exact same logic as the table
        if (combo.isActive) {
          // Use the same calculation as in createDeviceCell function
          let avgVisibility = 0;
          if (record.avg_visibility) {
            avgVisibility = parseFloat(record.avg_visibility) * 100;
          }
          combo.visibilitySum += avgVisibility;
          combo.visibilityCount++;
        }
      }
    }
    
    // Fallback to direct values if no historical data
    if (combo.rankCount === 0) {
      const directRank = record.avg_position || record.finalPosition || 40;
      combo.rankSum += parseFloat(directRank);
      combo.rankCount++;
    }
  });
  
  // Calculate averages across all combinations
  let totalRankSum = 0;
  let totalRankCount = 0;
  let totalVisibilitySum = 0;
  let totalVisibilityCount = 0;
  
  combinationMetrics.forEach(combo => {
    if (combo.rankCount > 0) {
      totalRankSum += (combo.rankSum / combo.rankCount);
      totalRankCount++;
    }
    // Only count visibility for active combinations
    if (combo.visibilityCount > 0 && combo.isActive) {
      totalVisibilitySum += (combo.visibilitySum / combo.visibilityCount);
      totalVisibilityCount++;
    }
  });
  
  const avgRating = totalRankCount > 0 ? (totalRankSum / totalRankCount) : 40;
  const avgVisibility = totalVisibilityCount > 0 ? (totalVisibilitySum / totalVisibilityCount) : 0;
  
  // Count locations
  let activeLocations = 0;
  let inactiveLocations = 0;
  locationStatusMap.forEach(status => {
    if (status.hasActive) activeLocations++;
    if (status.hasInactive) inactiveLocations++;
  });
  
  return {
    avgRating: Math.round(avgRating),
    avgVisibility: Math.min(100, Math.max(0, avgVisibility)),
    activeLocations,
    inactiveLocations,
    isFullyInactive: !hasAnyActiveLocation
  };
}

function renderFilteredProducts(productsNavContainer, activeProducts, inactiveProducts, filter = 'all') {
  // Clear container
  productsNavContainer.innerHTML = '';
  
  // Function to create product item
  function createProductItem({ product, index, metrics }, isInactive = false) {
    const navItem = document.createElement('div');
    navItem.classList.add('nav-product-item');
    if (isInactive) {
      navItem.classList.add('inactive-product');
    }
    navItem.setAttribute('data-product-index', index);
    
    const smallCard = document.createElement('div');
    smallCard.classList.add('small-ad-details');
    
    const badgeColor = getRatingBadgeColor(metrics.avgRating);
    const imageUrl = product.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
    const title = product.title || 'No title';
    
    smallCard.innerHTML = `
      <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
        <div class="small-ad-pos-value">${metrics.avgRating}</div>
        <div class="small-ad-pos-trend"></div>
      </div>
      <div class="small-ad-vis-status">
        <div class="vis-status-left">
          <div class="vis-water-container" data-fill="${metrics.avgVisibility}">
            <span class="vis-percentage">${metrics.avgVisibility.toFixed(1)}%</span>
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
    `;
    
    navItem.appendChild(smallCard);
    
    navItem.addEventListener('click', function() {
      console.log('[ProductExplorer] Product clicked:', product.title);
      selectGoogleAdsProduct(product, navItem);
    });
    
    return navItem;
  }
  
  // Render based on filter
  if (filter === 'all') {
    // Render active products
    activeProducts.forEach(item => {
      productsNavContainer.appendChild(createProductItem(item, false));
    });
    
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
    inactiveProducts.forEach(item => {
      productsNavContainer.appendChild(createProductItem(item, true));
    });
  } else if (filter === 'active') {
    activeProducts.forEach(item => {
      productsNavContainer.appendChild(createProductItem(item, false));
    });
  } else if (filter === 'inactive') {
    inactiveProducts.forEach(item => {
      productsNavContainer.appendChild(createProductItem(item, true));
    });
  }
  
  // Update water fill heights
  setTimeout(() => {
    document.querySelectorAll('.vis-water-container[data-fill]').forEach(container => {
      const fillPercent = parseFloat(container.getAttribute('data-fill')) || 0;
      container.style.setProperty('--fill-height', fillPercent + '%');
    });
  }, 100);
}

function getRatingBadgeColor(rating) {
  if (rating >= 1 && rating <= 3) return '#4CAF50'; // Green
  if (rating >= 4 && rating <= 8) return '#FFC107'; // Yellow
  if (rating >= 9 && rating <= 14) return '#FF9800'; // Orange
  return '#F44336'; // Red (above 14)
}

// Main function definition
function renderGoogleAdsTable() {
  const existingTable = document.querySelector("#googleAdsContainer .google-ads-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderGoogleAdsTable] Starting to build product map table");
  
  const container = document.getElementById("googleAdsPage");
  if (!container) return;

  window.pendingExplorerCharts = [];

  if (window.explorerApexCharts) {
    window.explorerApexCharts.forEach(chart => {
      try {
        chart.destroy();
      } catch (e) {
        console.warn("Error destroying ApexChart:", e);
      }
    });
  }
  window.explorerApexCharts = [];
  
container.innerHTML = `
    <div id="googleAdsContainer" style="width: 100%; height: calc(100vh - 150px); position: relative; display: flex;">
      <div id="googleAdsNavPanel" style="width: 400px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0;">
      </div>
      <div id="googleAdsTableContainer" style="flex: 1; height: 100%; overflow-y: auto; position: relative;">
<div class="explorer-view-switcher">
  <button id="viewRankingGoogleAds" class="active">Ranking</button>
  <button id="viewChartsGoogleAds">Charts</button>
  <button id="viewMapGoogleAds">Map</button>
</div>
        <button id="fullscreenToggleGoogleAds" class="fullscreen-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          Full Screen
        </button>
        <div id="googleAdsMapContainer" style="display: none; width: 100%; height: calc(100% - 60px); padding: 20px; box-sizing: border-box;">
        </div>
      </div>
    </div>
  `;
    
  let fullscreenOverlay = document.getElementById('googleAdsFullscreenOverlay');
  if (!fullscreenOverlay) {
    fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.id = 'googleAdsFullscreenOverlay';
    fullscreenOverlay.className = 'product-explorer-fullscreen-overlay';
    document.body.appendChild(fullscreenOverlay);
  }
  
  // Add fullscreen toggle functionality
  document.getElementById("fullscreenToggleGoogleAds").addEventListener("click", function() {
    const table = document.querySelector("#googleAdsContainer .google-ads-table");
    if (!table) {
      console.warn("No product map table found to display in fullscreen");
      return;
    }
    
    const tableClone = table.cloneNode(true);
    
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
    
    fullscreenOverlay.appendChild(tableClone);
    
    fullscreenOverlay.style.display = 'block';
    document.body.style.overflow = 'hidden';

    // Preserve current view state in fullscreen
const currentActiveButton = document.querySelector('.google-ads-view-switcher .active');
if (currentActiveButton && switcherClone) {
  const activeId = currentActiveButton.id;
  const clonedActiveButton = switcherClone.querySelector(`#${activeId}`);
  if (clonedActiveButton) {
    setTimeout(() => {
      clonedActiveButton.click();
    }, 100);
  }
}
    
    closeBtn.addEventListener("click", function() {
      fullscreenOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
      
      const detailsPanel = document.getElementById('product-explorer-details-panel');
      if (detailsPanel && detailsPanel.style.display !== 'none') {
        detailsPanel.style.position = 'fixed';
        detailsPanel.style.top = '40%';
        detailsPanel.style.left = 'auto';
        detailsPanel.style.right = '10px';
        detailsPanel.style.transform = 'translateY(-50%)';
      }
    });

    const originalSwitcher = document.querySelector('.google-ads-view-switcher');
    if (originalSwitcher) {
      const switcherClone = originalSwitcher.cloneNode(true);
      fullscreenOverlay.insertBefore(switcherClone, fullscreenOverlay.firstChild);
      
const clonedRankingBtn = switcherClone.querySelector('#viewRankingGoogleAds');
const clonedChartsBtn = switcherClone.querySelector('#viewChartsGoogleAds');
const clonedMapBtn = switcherClone.querySelector('#viewMapGoogleAds');

clonedRankingBtn.addEventListener('click', function() {
  clonedRankingBtn.classList.add('active');
  clonedChartsBtn.classList.remove('active');
  clonedMapBtn.classList.remove('active');
  
  fullscreenOverlay.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  fullscreenOverlay.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
    container.style.display = 'none';
  });
});

clonedChartsBtn.addEventListener('click', function() {
  clonedChartsBtn.classList.add('active');
  clonedRankingBtn.classList.remove('active');
  clonedMapBtn.classList.remove('active');
  
  // Show BOTH segmentation charts AND position charts
  fullscreenOverlay.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  fullscreenOverlay.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
    container.style.display = 'flex';
    
    // Render position chart if record data is available
    if (container.combinationRecord) {
      renderProductPositionChart(container, container.combinationRecord);
    }
  });
});

clonedMapBtn.addEventListener('click', function() {
  clonedMapBtn.classList.add('active');
  clonedRankingBtn.classList.remove('active');
  clonedChartsBtn.classList.remove('active');
  
  // Hide segmentation charts, show only position charts
  fullscreenOverlay.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
    container.style.display = 'none';
  });
  fullscreenOverlay.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
    container.style.display = 'flex';
    
    // Render position chart if record data is available
    if (container.combinationRecord) {
      renderProductPositionChart(container, container.combinationRecord);
    }
  });
});
    }
    
    const productCells = fullscreenOverlay.querySelectorAll('.product-cell');
    productCells.forEach(cell => {
      cell.style.flexWrap = "nowrap";
      cell.style.overflowX = "auto";
      cell.style.minWidth = "100%";
      
      const cards = cell.querySelectorAll('.ad-details');
      cards.forEach(card => {
        card.style.width = "150px";
        card.style.flexShrink = "0";
        card.style.margin = "0 6px 0 0";
        
        card.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          const plaIndex = card.getAttribute('data-pla-index');
          const rowData = window.globalRows[plaIndex];
          if (!rowData) {
            console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
            return;
          }
          
          card.click();
        });
      });
    });

    setTimeout(() => {
      console.log("[DEBUG-FULLSCREEN] Starting segmentation chart recreation...");
      
      const chartContainers = fullscreenOverlay.querySelectorAll('.google-ads-segmentation-chart-container');
      console.log("[DEBUG-FULLSCREEN] Found chart containers:", chartContainers.length);
      
      const originalTable = document.querySelector('.google-ads-table');
      const originalRows = originalTable.querySelectorAll('tbody tr');
      
      const chartDataMap = {};
      let chartIndex = 0;
      
      originalRows.forEach(row => {
        const originalChartContainer = row.querySelector('.google-ads-segmentation-chart-container');
        if (!originalChartContainer) return;
        
        let term = '';
        let location = '';
        let device = '';
        
        let currentRow = row;
        while (currentRow && !term) {
          const termElement = currentRow.querySelector('.search-term-tag');
          if (termElement) {
            term = termElement.textContent.trim();
          }
          currentRow = currentRow.previousElementSibling;
        }
        
        currentRow = row;
        while (currentRow && !location) {
          const locationElement = currentRow.querySelector('.city-line');
          if (locationElement) {
            location = locationElement.textContent.trim();
          }
          currentRow = currentRow.previousElementSibling;
        }
        
        const deviceElement = row.querySelector('.device-icon');
        if (deviceElement) {
          device = deviceElement.alt || '';
        }
        
        chartDataMap[chartIndex] = { term, location, device };
        chartIndex++;
      });
      
      function locationMatches(mappedLocation, productLocation) {
        if (!mappedLocation || !productLocation) return false;
        
        if (mappedLocation === productLocation) return true;
        
        const productParts = productLocation.split(',');
        const firstPart = productParts[0] ? productParts[0].trim() : '';
        
        return mappedLocation.toLowerCase() === firstPart.toLowerCase();
      }
      
      chartContainers.forEach((container, index) => {
        console.log(`[DEBUG-FULLSCREEN] Processing container ${index}:`, container.id);
        
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
        
        const matchingProducts = window.allRows.filter(p => {
          const termMatch = p.q === term;
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
        
        const activeProducts = matchingProducts.filter(product => 
          product.product_status === 'active' || !product.product_status
        );
        
        const inactiveProducts = matchingProducts.filter(product => 
          product.product_status === 'inactive'
        );
        
        console.log("[DEBUG-FULLSCREEN] Active products:", activeProducts.length, "Inactive:", inactiveProducts.length);
        
        const chartData = calculateAggregateSegmentDataGoogleAds(matchingProducts);
        console.log("[DEBUG-FULLSCREEN] Chart data generated:", !!chartData, "length:", chartData?.length || 0);
        
        if (!chartData || chartData.length === 0) {
          console.log("[DEBUG-FULLSCREEN] No valid chart data generated");
          return;
        }
        
        console.log("[DEBUG-FULLSCREEN] Rendering chart directly to cloned container");
        
        container.innerHTML = '';
        container.style.height = '380px';
        container.style.maxHeight = '380px';
        container.style.overflowY = 'hidden';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.alignItems = 'center';
        
        const canvasWrapper = document.createElement('div');
        canvasWrapper.style.width = '100%';
        canvasWrapper.style.height = '280px';
        canvasWrapper.style.maxHeight = '280px';
        canvasWrapper.style.position = 'relative';
        canvasWrapper.style.marginBottom = '10px';
        container.appendChild(canvasWrapper);
        
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
        
        countContainer.innerHTML = `
          <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
          <div style="font-weight: 700; color: #4CAF50;">${activeProducts.length}</div>
          <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
          <div style="font-weight: 700; color: #9e9e9e;">${inactiveProducts.length}</div>
        `;
        
        container.appendChild(countContainer);
        
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
        
        if (typeof ApexCharts !== 'undefined') {
          var chart = new ApexCharts(el, options);
          chart.render();
        }
      });
    }, 100);
  });

// Add view switcher functionality - UPDATED to handle new structure
const viewRankingGoogleAdsBtn = document.getElementById("viewRankingGoogleAds");
const viewChartsGoogleAdsBtn = document.getElementById("viewChartsGoogleAds");
const viewMapGoogleAdsBtn = document.getElementById("viewMapGoogleAds");

viewRankingGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewRankingGoogleAdsBtn.classList.add("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  
  // Show the table and hide map  // ADD THIS
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'table';
    table.classList.add('ranking-mode');
  }
  const mapContainer = document.getElementById('googleAdsMapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
  // END ADD
  
  // Add ranking mode to table and device containers
  document.querySelectorAll('.device-container').forEach(container => {
    container.classList.add('ranking-mode');
  });
  
  // Hide position charts and segmentation column
document.querySelectorAll('.google-ads-chart-avg-position').forEach(container => {
    container.style.display = 'none';
});
document.querySelectorAll('.google-ads-segmentation-chart-container').forEach(container => {
    container.style.display = 'none';
});
  // Show rank-market-share history in ranking mode
  document.querySelectorAll('.rank-market-share-history').forEach(container => {
    container.style.display = 'block';
  });
});

viewChartsGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewChartsGoogleAdsBtn.classList.add("active");
  viewRankingGoogleAdsBtn.classList.remove("active");
  viewMapGoogleAdsBtn.classList.remove("active");
  
  // Show the table and hide map  // ADD THIS
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'table';
    table.classList.remove('ranking-mode');
  }
  const mapContainer = document.getElementById('googleAdsMapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
  // END ADD
  
  // Remove ranking mode from table and device containers
  document.querySelectorAll('.device-container').forEach(container => {
    container.classList.remove('ranking-mode');
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
      renderProductPositionChart(container, container.combinationRecord);
    }
  });
});

viewMapGoogleAdsBtn.addEventListener("click", function() {
  // Clear all active states
  viewMapGoogleAdsBtn.classList.add("active");
  viewRankingGoogleAdsBtn.classList.remove("active");
  viewChartsGoogleAdsBtn.classList.remove("active");
  
  // Hide the product table
  const table = document.querySelector('.google-ads-table');
  if (table) {
    table.style.display = 'none';
  }
  
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
      window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'explorer');
      
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
  
  console.log("[renderGoogleAdsTable] Using myCompany:", window.myCompany);
  
  window.pendingExplorerCharts = [];
  if (window.explorerApexCharts) {
    window.explorerApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.explorerApexCharts = [];

  if (!window.globalRows || typeof window.globalRows !== 'object') {
    window.globalRows = {};
    console.log("[DEBUG] Created new globalRows object");
  }

  if (!document.getElementById("product-explorer-table-style")) {
    const style = document.createElement("style");
    style.id = "product-explorer-table-style";
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
.google-ads-table:not(.ranking-mode) td {
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

.google-ads-table.ranking-mode td {
  padding: 8px;
  font-size: 14px;
  color: #333;
  vertical-align: middle;
  border-bottom: 1px solid #eee;
  height: 120px !important;
  max-height: 120px !important;
  min-height: 120px !important;
  box-sizing: border-box;
  overflow: hidden;
}
      .google-ads-table { table-layout: fixed; }
      .google-ads-table th:nth-child(1), .google-ads-table td:nth-child(1) { width: 190px; }
      .google-ads-table th:nth-child(2), .google-ads-table td:nth-child(2) { width: 150px; }
.google-ads-table th:nth-child(3), .google-ads-table td:nth-child(3) { width: 200px; }
.google-ads-table th:nth-child(4), .google-ads-table td:nth-child(4) { width: 230px; }
.google-ads-table th:nth-child(5), .google-ads-table td:nth-child(5) { width: auto; min-width: 400px; }

/* Hide segmentation column in ranking mode */
.ranking-mode .segmentation-column {
  display: none !important;
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
.device-container.ranking-mode {
  display: flex !important;
  flex-direction: row !important;
  height: 100% !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 8px !important;
  gap: 8px !important;
}

.device-container.ranking-mode .device-type, 
.device-container.ranking-mode .device-rank, 
.device-container.ranking-mode .device-share {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 4px !important;
  min-width: 60px !important;
  text-align: center !important;
}

.device-container.ranking-mode .device-rank-value {
  font-size: 24px !important;
  margin: 2px 0 !important;
  font-weight: bold !important;
}

.device-container.ranking-mode .device-trend {
  font-size: 14px !important;
  margin: 0 !important;
  font-weight: 600 !important;
}

.device-container.ranking-mode .pie-chart-container {
  width: 60px !important;
  height: 60px !important;
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.device-container.ranking-mode .section-header {
  font-size: 9px !important;
  margin-bottom: 2px !important;
}

.device-container.ranking-mode .last-tracked-container {
  display: none !important;
}

.device-container.ranking-mode .device-icon {
  width: 50px !important;
  height: 50px !important;
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
        color: green;
      }
      
      .trend-down {
        color: red;
      }
      
      .trend-neutral {
        color: #444;
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
      
      .google-ads-view-switcher {
        position: absolute;
        top: 10px;
        right: 140px;
        display: inline-flex;
        background-color: #f0f0f0;
        border-radius: 20px;
        padding: 3px;
        z-index: 100;
      }

      .google-ads-view-switcher button {
        padding: 6px 16px;
        border: none;
        background: transparent;
        border-radius: 17px;
        font-size: 13px;
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
  margin-left: 8px;
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
/* Fix row height in ranking mode */
.google-ads-table.ranking-mode td {
  height: 110px !important;
  max-height: 110px !important;
  min-height: 110px !important;
  padding: 8px !important;
  vertical-align: middle !important;
}

.google-ads-table.ranking-mode tbody td {
  height: 110px !important;
  max-height: 110px !important;
  min-height: 110px !important;
}

.google-ads-table.ranking-mode tr {
  height: 110px !important;
  max-height: 110px !important;
}
/* Ensure proper spacing and alignment in ranking mode */
.google-ads-table.ranking-mode .device-container .last-tracked-container {
  display: none !important;
}

.google-ads-table.ranking-mode .device-container {
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fafafa;
}
/* Increase Device column width in ranking mode */
.google-ads-table.ranking-mode th:nth-child(3), 
.google-ads-table.ranking-mode td:nth-child(3) { 
  width: 380px !important; 
}
.device-container.ranking-mode .device-type, 
.device-container.ranking-mode .device-rank, 
.device-container.ranking-mode .device-share,
.device-container.ranking-mode .device-status {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 4px !important;
  min-width: 60px !important;
  text-align: center !important;
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

.device-container.ranking-mode .device-status-value {
  margin-top: 2px !important;
}
.rank-history-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  box-sizing: border-box;
  min-width: 0;
  overflow: hidden;
}

/* Constrain rank history container height in ranking mode */
.google-ads-table.ranking-mode .rank-history-container {
  height: 104px !important;
  max-height: 104px !important;
  overflow: hidden !important;
  justify-content: flex-start !important;
}

.rank-history-row,
.visibility-history-row {
  display: flex;
  flex-wrap: nowrap;
  gap: 3px;
  margin-bottom: 10px;
  justify-content: flex-start;
  overflow-x: auto;
  overflow-y: hidden;
  min-height: 60px;
  padding-bottom: 5px;
  width: 100%;
  min-width: 0;
}

/* Reduce row heights in ranking mode */
.google-ads-table.ranking-mode .rank-history-row,
.google-ads-table.ranking-mode .visibility-history-row {
  min-height: 55px !important;
  height: 55px !important;
  margin-bottom: 4px !important;
  padding-bottom: 0px !important;
  align-items: center !important;
}

/* Custom scrollbar styling */
.rank-history-row::-webkit-scrollbar,
.visibility-history-row::-webkit-scrollbar {
  height: 6px;
}

.rank-history-row::-webkit-scrollbar-track,
.visibility-history-row::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.rank-history-row::-webkit-scrollbar-thumb,
.visibility-history-row::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.rank-history-row::-webkit-scrollbar-thumb:hover,
.visibility-history-row::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.rank-box,
.visibility-box {
  width: 50px;
  height: 50px;
  min-width: 50px; /* Prevent shrinking */
  min-height: 50px; /* Prevent shrinking */
  max-width: 50px; /* Prevent growing */
  max-height: 50px; /* Prevent growing */
  flex-shrink: 0; /* Prevent flex shrinking */
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  border-radius: 4px;
  color: #333;
  border: 1px solid #ddd;
  background-color: #fff;
  position: relative;
  overflow: hidden;
  box-sizing: border-box;
}

/* Color coding for ranks when data exists */
.rank-box.rank-green {
  background-color: #dfffd6 !important;
  color: #000000 !important;
}

.rank-box.rank-yellow {
  background-color: #ffffc2 !important;
  color: #000000 !important;
}

.rank-box.rank-orange {
  background-color: #ffe0bd !important;
  color: #000000 !important;
}

.rank-box.rank-red {
  background-color: #ffcfcf !important;
  color: #000000 !important;
}

.visibility-box {
  background-color: #e3f2fd;
  color: #1565c0;
  font-size: 10px;
}

/* Empty state for completely missing data (when no historical data at all) */
.history-empty-box,
.history-empty-share-box {
  height: 24px !important;
  min-height: 24px !important;
  width: 32px;
  background-color: #e0e0e0 !important;
  border-radius: 3px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  opacity: 0.5;
  border: 1px solid #ccc;
}

.rank-history-container .no-data-message {
  text-align: center;
  color: #999;
  font-style: italic;
  padding: 20px;
}

/* Hide rank history in Charts and Map modes, show position charts */
.google-ads-chart-avg-position {
  display: none;
}

.rank-market-share-history {
  display: block;
}

/* Show position charts and hide rank history in Charts/Map modes */
.google-ads-table:not(.ranking-mode) .google-ads-chart-avg-position {
  display: flex !important;
}

.google-ads-table:not(.ranking-mode) .rank-market-share-history {
  display: none !important;
}
/* Water-filling effect for visibility boxes */
.visibility-box::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, 
    #1e88e5 0%, 
    rgba(30, 136, 229, 0.7) 50%,
    rgba(30, 136, 229, 0.3) 100%);
  border-radius: 0 0 3px 3px;
  transition: height 0.5s ease-in-out;
  height: var(--fill-height, 0%);
  z-index: 1;
}

.visibility-box {
  z-index: 2;
  position: relative;
  color: #1565c0 !important;
  font-weight: 700 !important;
}

/* Ensure text is always visible above the fill */
.visibility-box span {
  position: relative;
  z-index: 3;
}

.visibility-box[data-fill="0"]::before { height: 0%; }
.visibility-box[data-fill*="1"]::before { height: calc(var(--fill-percent) * 1%); }

/* Dynamic fill heights based on data-fill attribute */
.visibility-box { --fill-percent: attr(data-fill number, 0); }

/* Alternative approach using specific ranges */
.visibility-box[data-fill="0"]::before { height: 0%; }
.visibility-box:not([data-fill="0"])::before { 
  height: calc(var(--fill-percent) * 1%); 
}

/* Text should be above the fill */
.visibility-box {
  z-index: 2;
  position: relative;
}

/* Water-filling effect for visibility boxes */
.visibility-box::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, 
    #1e88e5 0%, 
    rgba(30, 136, 229, 0.7) 50%,
    rgba(30, 136, 229, 0.3) 100%);
  border-radius: 0 0 3px 3px;
  transition: height 0.3s ease-in-out;
  z-index: 1;
  height: 0%; /* Default height */
}

/* Dynamic height setting for different percentage ranges */
.visibility-box[data-fill="0"]::before { height: 0% !important; }
.visibility-box[data-fill*="1"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="2"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="3"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="4"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="5"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="6"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="7"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="8"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }
.visibility-box[data-fill*="9"]:not([data-fill="0"])::before { height: calc(var(--fill-height, 0%) * 1) !important; }

.visibility-box {
  z-index: 2;
  position: relative;
  color: #1565c0 !important;
  font-weight: 700 !important;
}

.visibility-box span {
  position: relative;
  z-index: 3;
  color: #1565c0 !important;
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
    `;
    document.head.appendChild(style);
  }

  if (!document.getElementById("centered-explorer-panel-spinner-style")) {
    const spinnerStyle = document.createElement("style");
    spinnerStyle.id = "centered-explorer-panel-spinner-style";
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
      if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
        const productKey = product.title || '';
        
        if (!productMap.has(productKey)) {
          productMap.set(productKey, product);
          allCompanyProducts.push(product);
        }
      }
    });
  }

  console.log(`[renderGoogleAdsTable] Found ${allCompanyProducts.length} unique products for ${window.myCompany}`);

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
  metrics: calculateProductMetrics(product)
}));

// Separate active and inactive products
const activeProducts = productsWithMetrics.filter(item => !item.metrics.isFullyInactive);
const inactiveProducts = productsWithMetrics.filter(item => item.metrics.isFullyInactive);

// Sort both groups by rank (lower rank = better = higher in list)
activeProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);
inactiveProducts.sort((a, b) => a.metrics.avgRating - b.metrics.avgRating);

// Initial render with all products
renderFilteredProducts(productsNavContainer, activeProducts, inactiveProducts, 'all');

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
      
      // Re-render products with filter
      renderFilteredProducts(productsNavContainer, activeProducts, inactiveProducts, filter);
    });
  });
}

  googleAdsNavPanel.appendChild(productsNavContainer);

    // Set water fill heights for visibility indicators
  setTimeout(() => {
    document.querySelectorAll('.vis-water-container[data-fill]').forEach(container => {
      const fillPercent = parseFloat(container.getAttribute('data-fill')) || 0;
      container.style.setProperty('--fill-height', fillPercent + '%');
    });
  }, 100);

  setTimeout(() => {
    console.log('[renderGoogleAdsTable] Auto-selecting first product...');
    
    const firstNavItem = document.querySelector('.nav-google-ads-item');
    
    if (firstNavItem && allCompanyProducts.length > 0) {
      const firstProduct = allCompanyProducts[0];
      console.log('[renderGoogleAdsTable] Auto-selecting:', firstProduct.title);
      
      firstNavItem.click();
    } else {
      console.warn('[renderGoogleAdsTable] No products found for auto-selection');
      
      const container = document.querySelector("#googleAdsTableContainer");
      const emptyMessage = document.createElement('div');
      emptyMessage.style.padding = '40px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      emptyMessage.innerHTML = '<h3>No products found</h3><p>Please check if data is available for the selected company.</p>';
      container.appendChild(emptyMessage);
    }
  }, 100);
}

// Export the function
if (typeof window !== 'undefined') {
  window.renderGoogleAdsTable = renderGoogleAdsTable;
  window.renderAvgPositionChartGoogleAds = renderAvgPositionChartGoogleAds;
  window.updateChartLineVisibilityGoogleAds = updateChartLineVisibilityGoogleAds;
  window.renderProductPositionChart = renderProductPositionChart;
}
