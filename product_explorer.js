window.pendingExplorerCharts = [];
window.explorerApexCharts = [];
// Global settings for product metrics calculation
window.productMetricsSettings = {
  useLatestDataDate: false, // true = use latest data date, false = use today's date
  // Future settings can be added here
};

// Function to get current mode from modeSelector
function getCurrentMode() {
  return document.querySelector('#modeSelector .mode-option.active')?.getAttribute('data-mode') || 'products';
}

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

function createMarketSharePieChartExplorer(containerId, shareValue) {
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

function calculateAggregateSegmentData(products) {
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

function createSegmentationChartExplorer(containerId, chartData, termParam, locParam, deviceParam, myCompanyParam, activeCount, inactiveCount, segmentCounts) {
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

function selectProduct(product, navItemElement) {
  console.log('[selectProduct] Selecting product:', product.title);
  
  document.querySelectorAll('.nav-product-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (navItemElement) {
    navItemElement.classList.add('selected');
  }
  
  window.selectedExplorerProduct = product;
  const currentViewMode = document.querySelector('.explorer-view-switcher .active')?.id || 'viewRankingExplorer';
  
  const combinations = getProductCombinations(product);
  console.log(`[selectProduct] Found ${combinations.length} combinations for ${product.title}`);
  
  renderTableForSelectedProduct(combinations, currentViewMode);
  
  // Rebuild map if currently in map view
  if (currentViewMode === 'viewMapExplorer') {
    const mapContainer = document.getElementById('productExplorerMapContainer');
    if (mapContainer && mapContainer.style.display !== 'none') {
      console.log('[selectProduct] Rebuilding map for new product');
      
      // Clear existing map and blocks
      const mapWrapper = document.getElementById('mapWrapper');
      if (mapWrapper) {
        mapWrapper.innerHTML = '';
      }
      
      const mapProject = buildMapDataForSelectedProduct();
      if (window.mapHelpers && window.mapHelpers.drawUsMapWithLocations) {
        window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'explorer');
        
        // Add location blocks after map is drawn
        setTimeout(() => {
          addLocationBlocksToMap(mapProject, '#mapWrapper');
          
          // Maintain toggle state
          const toggleButton = document.getElementById('toggleLocationBlocks');
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

function renderTableForSelectedProduct(combinations, initialViewMode = 'viewRankingExplorer') {
  console.log('[renderTableForSelectedProduct] Starting with', combinations.length, 'combinations');
    console.log('[DEBUG] First combination structure:', combinations[0]);
  console.log('[DEBUG] All combinations:', combinations);
  
  const existingTable = document.querySelector("#productExplorerContainer .product-explorer-table");
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
  table.style.display = ''; 
  
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

  console.log('[DEBUG] After sorting, combinations:', combinations);

  const termGroups = {};
  combinations.forEach(combo => {
    console.log('[DEBUG] Processing combination:', combo);
    if (!termGroups[combo.searchTerm]) {
      termGroups[combo.searchTerm] = {};
    }
    if (!termGroups[combo.searchTerm][combo.location]) {
      termGroups[combo.searchTerm][combo.location] = [];
    }
    termGroups[combo.searchTerm][combo.location].push(combo);
  });

  console.log('[DEBUG] Term groups:', termGroups);
  
  Object.keys(termGroups).sort().forEach(searchTerm => {
    console.log('[DEBUG] Processing searchTerm:', searchTerm);
    const locationGroups = termGroups[searchTerm];
    let termCellUsed = false;
    
    let totalRowsForTerm = 0;
    Object.values(locationGroups).forEach(devices => {
      totalRowsForTerm += devices.length;
    });
    console.log('[DEBUG] Total rows for term:', totalRowsForTerm);
    
    Object.keys(locationGroups).sort().forEach(location => {
      console.log('[DEBUG] Processing location:', location);
      const deviceCombinations = locationGroups[location];
      let locCellUsed = false;
      
deviceCombinations.forEach(combination => {
  console.log('[DEBUG] Creating row for combination:', combination);
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
  
  // THIS IS THE CRITICAL LINE - MAKE SURE IT EXISTS:
  tbody.appendChild(tr);
  console.log('[DEBUG] Row appended to tbody');
});
    });
  });
  
const container = document.querySelector("#productExplorerTableContainer");
if (!container) {
  console.error('[ERROR] productExplorerTableContainer not found!');
  // Try alternative container
  const altContainer = document.querySelector("#productExplorerContainer");
  if (altContainer) {
    console.log('[DEBUG] Using alternative container #productExplorerContainer');
    altContainer.appendChild(table);
  }
} else {
  console.log('[DEBUG] Appending table to #productExplorerTableContainer');
  container.appendChild(table);
}

console.log('[DEBUG] Table tbody child count:', tbody.children.length);
console.log('[renderTableForSelectedProduct] Table created, rendering charts...');

// Set visibility fill heights for water effect
setTimeout(() => {
  setVisibilityFillHeights();
}, 100);

renderPendingExplorerChartsForProduct();
  
// Apply initial view mode immediately after table creation
if (initialViewMode === 'viewRankingExplorer') {
  // Apply ranking mode immediately without delay
  const table = document.querySelector('.product-explorer-table');
  if (table) {
    table.classList.add('ranking-mode');
  }
  
  // Ensure the ranking button is active immediately
  const rankingBtn = document.getElementById('viewRankingExplorer');
  const chartsBtn = document.getElementById('viewChartsExplorer');
  const mapBtn = document.getElementById('viewMapExplorer');
  if (rankingBtn) rankingBtn.classList.add('active');
  if (chartsBtn) chartsBtn.classList.remove('active');
  if (mapBtn) mapBtn.classList.remove('active');
  
  // Apply to device containers and hide charts immediately
  setTimeout(() => {
    document.querySelectorAll('.device-container').forEach(container => {
      container.classList.add('ranking-mode');
    });
    
    document.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
      container.style.display = 'none';
    });
    document.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
      container.style.display = 'none';
    });
  }, 10); // Minimal delay just for DOM elements to be created
} else {
  setTimeout(() => {
    const targetButton = document.getElementById(initialViewMode);
    if (targetButton) {
      if (!targetButton.classList.contains('active')) {
        targetButton.click();
      } else {
        // Button is already active, but we need to apply the view mode for the new product
        if (initialViewMode === 'viewChartsExplorer') {
          // Apply Charts mode logic directly
          const table = document.querySelector('.product-explorer-table');
          if (table) {
            table.style.display = 'table';
            table.classList.remove('ranking-mode');
          }
          const mapContainer = document.getElementById('productExplorerMapContainer');
          if (mapContainer) {
            mapContainer.style.display = 'none';
          }
          
          // Remove ranking mode from device containers
          document.querySelectorAll('.device-container').forEach(container => {
            container.classList.remove('ranking-mode');
          });
          
          // Show segmentation charts and hide rank history
          document.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
            container.style.display = 'flex';
          });
          document.querySelectorAll('.rank-market-share-history').forEach(container => {
            container.style.display = 'none';
          });
          
          // Show and render position charts
          document.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
            container.style.display = 'flex';
            
            // Render position chart if record data is available
            if (container.combinationRecord) {
              renderProductPositionChart(container, container.combinationRecord);
            }
          });
        } else if (initialViewMode === 'viewMapExplorer') {
          // Apply Map mode logic directly
          const table = document.querySelector('.product-explorer-table');
          if (table) {
            table.style.display = 'none';
          }
          
          const mapContainer = document.getElementById('productExplorerMapContainer');
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
              <button id="toggleLocationBlocks" class="active">
                Hide Location Details
              </button>
            `;
            mapContainer.appendChild(toggleContainer);
            
            // Build map data for the selected product
            const mapProject = buildMapDataForSelectedProduct();
            
            // Draw the US map using the mapsLib function
            if (window.mapHelpers && window.mapHelpers.drawUsMapWithLocations) {
              window.mapHelpers.drawUsMapWithLocations(mapProject, '#mapWrapper', 'explorer');
              
              // Add location blocks after map is drawn
              setTimeout(() => {
                addLocationBlocksToMap(mapProject, '#mapWrapper');
              }, 500);
            }
            
            // Add toggle functionality
            document.getElementById('toggleLocationBlocks').addEventListener('click', function() {
              const blocks = document.querySelectorAll('.location-block');
              const button = this;
              
              if (button.classList.contains('active')) {
                blocks.forEach(block => block.style.display = 'none');
                button.textContent = 'Show Location Details';
                button.classList.remove('active');
                button.classList.add('inactive');
              } else {
                blocks.forEach(block => block.style.display = 'block');
                button.textContent = 'Hide Location Details';
                button.classList.add('active');
                button.classList.remove('inactive');
              }
            });
          }
        }
      }
    }
  }, 150); // Increased timeout to ensure chart data is attached
}
}

// Function to render company explorer table
function renderCompanyExplorerTable(combinations, initialViewMode = 'viewRankingExplorer') {
  console.log('[renderCompanyExplorerTable] Starting with', combinations.length, 'combinations');
  
  // Remove existing company explorer table if it exists
  const existingTable = document.querySelector(".company-explorer-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  // Clear pending charts
  window.pendingExplorerCharts = [];
  
  if (window.explorerApexCharts) {
    window.explorerApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.explorerApexCharts = [];
  
  // Create new table
  const table = document.createElement("table");
  table.classList.add("company-explorer-table");
  if (initialViewMode === 'viewRankingExplorer') {
    table.classList.add("ranking-mode");
  }
  table.style.display = ''; 
  
  // Create table header
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
  
  // Create location color map
  const locationColorMap = {};
  const allLocationsList = [...new Set(combinations.map(c => c.location))];
  allLocationsList.sort().forEach((loc, index) => {
    const colorIndex = (index % 10) + 1;
    locationColorMap[loc] = `location-bg-${colorIndex}`;
  });
  
  // Sort combinations
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

  // Group by term and location
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
  
  // Create rows
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
        
        // Search term cell
        if (!termCellUsed) {
          const tdTerm = document.createElement("td");
          tdTerm.rowSpan = totalRowsForTerm;
          tdTerm.innerHTML = `<div class="search-term-tag">${searchTerm}</div>`;
          tr.appendChild(tdTerm);
          termCellUsed = true;
        }
        
        // Location cell
        if (!locCellUsed) {
          const tdLoc = document.createElement("td");
          tdLoc.rowSpan = deviceCombinations.length;
          tdLoc.innerHTML = formatLocationCell(combination.location);
          tdLoc.classList.add(locationColorMap[combination.location]);
          tr.appendChild(tdLoc);
          locCellUsed = true;
        }
        
        // Device cell
        const tdDev = document.createElement("td");
        tdDev.innerHTML = createCompanyDeviceCell(combination);
        tr.appendChild(tdDev);
        
        // Segmentation cell
        const tdSegmentation = document.createElement("td");
        tdSegmentation.classList.add("segmentation-column");
        const chartContainerId = `company-segmentation-chart-${chartCounter++}`;
        tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="explorer-segmentation-chart-container loading"></div>`;
        tr.appendChild(tdSegmentation);
        
        // Rank & Market Share cell
        const tdRankMarketShare = document.createElement("td");
        const positionChartId = `company-position-chart-${chartCounter}`;
        
        // Create rank & market share history for company
        const rankMarketShareHistory = createCompanyRankMarketShareHistory(combination.record);
        
        tdRankMarketShare.innerHTML = `
          <div id="${positionChartId}" class="explorer-chart-avg-position" style="display: none;">Click "Charts" view to see position trends</div>
          <div class="rank-market-share-history">${rankMarketShareHistory}</div>
        `;
        tr.appendChild(tdRankMarketShare);
        
        // Store chart info for later rendering
        const chartInfo = {
          containerId: chartContainerId,
          positionChartId: positionChartId,
          combination: combination,
          isCompanyMode: true
        };
        
        if (!window.pendingExplorerCharts) {
          window.pendingExplorerCharts = [];
        }
        window.pendingExplorerCharts.push(chartInfo);
        
        tbody.appendChild(tr);
      });
    });
  });
  
  // Append table to container
  const container = document.querySelector("#productExplorerTableContainer");
  if (container) {
    container.appendChild(table);
  }
  
  console.log('[renderCompanyExplorerTable] Table created with', tbody.children.length, 'rows');
  
  // Set visibility fill heights for water effect
  setTimeout(() => {
    setVisibilityFillHeights();
  }, 100);
  
  // Render charts
  renderPendingExplorerChartsForProduct();
}

function createDeviceCell(combination) {
  const record = combination.record;
  const isCompaniesMode = getCurrentMode() === 'companies';
  
  let deviceHTML = `<div class="device-container">`;
  
  const deviceIcon = record.device.toLowerCase().includes('mobile') 
    ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' 
    : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png';
  
  deviceHTML += `<div class="device-type">
    <img src="${deviceIcon}" alt="${record.device}" class="device-icon" />
  </div>`;
  
  // For companies mode, use rank and market share from the company stats
  if (isCompaniesMode && record.rank !== undefined) {
    // Company rank
    const companyRank = record.rank || 999;
    const rankTrend = record.rankTrend || 0;
    
    let arrow = '', change = '', color = '#444';
    if (rankTrend < 0) {
      arrow = '▲';
      color = 'green';
      change = Math.abs(rankTrend).toFixed(1);
    } else if (rankTrend > 0) {
      arrow = '▼';
      color = 'red';
      change = rankTrend.toFixed(1);
    } else {
      arrow = '±';
      change = '0.0';
    }
    
// Determine rank box color
let rankBoxColor;
if (companyRank === 1) {
  rankBoxColor = '#4CAF50';
} else if (companyRank <= 3) {
  rankBoxColor = '#FFC107';
} else if (companyRank <= 5) {
  rankBoxColor = '#FF9800';
} else {
  rankBoxColor = '#F44336';
}

deviceHTML += `
  <div class="device-rank">
    <div class="section-header">Company Rank</div>
    <div class="company-rank-box" style="background-color: ${rankBoxColor}; color: white; width: 45px; height: 45px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin: 0 auto;">${companyRank}</div>
    <div class="device-trend" style="color:${color}; margin-top: 4px;">
      ${arrow} ${change}
    </div>
  </div>
`;
    
// Market share (check if already in percentage)
const marketShare = (record.top40 || 0);
const marketSharePercentage = marketShare > 1 ? marketShare : marketShare * 100;

deviceHTML += `
  <div class="device-share">
    <div class="section-header">Market Share<br><span style="font-size: 9px;">(last 7 days)</span></div>
    <div class="company-market-badge" style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: #007aff; background: white; border: 2px solid #007aff; margin: 0 auto; position: relative; overflow: hidden;">
      <div class="market-badge-water" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%); transition: height 0.5s ease; z-index: 0; border-radius: 50%; opacity: 0.5; height: ${Math.min(100, Math.max(0, marketSharePercentage * 2))}%;"></div>
      <span style="position: relative; z-index: 1;">${Math.round(marketSharePercentage)}%</span>
    </div>
  </div>
`;
    
    // Status is always active for companies in the results
    deviceHTML += `
      <div class="device-status">
        <div class="section-header">Status</div>
        <div class="device-status-value">
          <span class="status-active">Active</span>
        </div>
      </div>
    `;
    
    deviceHTML += `
      <div class="last-tracked-container">
        <div class="last-tracked-label">Company Presence:</div>
        <div class="last-tracked-value recent-tracking">Tracked</div>
      </div>
    `;
  } else {
    // Original product mode code - keep as is
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
      createMarketSharePieChartExplorer(visChartId, avgVisibility);
    }, 50);

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
  }
  
  deviceHTML += `</div>`;
  
  return deviceHTML;
}

function createCompanyDeviceCell(combination) {
  const record = combination.record;
  
  let deviceHTML = `<div class="device-container">`;
  
  const deviceIcon = record.device.toLowerCase().includes('mobile') 
    ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' 
    : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png';
  
  deviceHTML += `<div class="device-type">
    <img src="${deviceIcon}" alt="${record.device}" class="device-icon" />
  </div>`;
  
  // Company rank
  const companyRank = record.rank || 999;
  const rankTrend = record.rankTrend || 0;
  
  let arrow = '', change = '', color = '#444';
  if (rankTrend < 0) {
    arrow = '▲';
    color = 'green';
    change = Math.abs(rankTrend).toFixed(1);
  } else if (rankTrend > 0) {
    arrow = '▼';
    color = 'red';
    change = rankTrend.toFixed(1);
  } else {
    arrow = '±';
    change = '0.0';
  }
  
// Determine rank box color
let rankBoxColor;
if (companyRank === 1) {
  rankBoxColor = '#4CAF50';
} else if (companyRank <= 3) {
  rankBoxColor = '#FFC107';
} else if (companyRank <= 5) {
  rankBoxColor = '#FF9800';
} else {
  rankBoxColor = '#F44336';
}

deviceHTML += `
  <div class="device-rank">
    <div class="section-header">Company Rank</div>
    <div class="company-rank-box" style="background-color: ${rankBoxColor}; color: white; width: 45px; height: 45px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px; font-weight: bold; margin: 0 auto;">${companyRank}</div>
    <div class="device-trend" style="color:${color}; margin-top: 4px;">
      ${arrow} ${change}
    </div>
  </div>
`;
  
// Market share (check if already in percentage)
const marketShare = (record.top40 || 0);
const marketSharePercentage = marketShare > 1 ? marketShare : marketShare * 100;
  
  deviceHTML += `
    <div class="device-share">
      <div class="section-header">Market Share<br><span style="font-size: 9px;">(last 7 days)</span></div>
      <div class="company-market-badge" style="width: 50px; height: 50px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 900; color: #007aff; background: white; border: 2px solid #007aff; margin: 0 auto; position: relative; overflow: hidden;">
        <div class="market-badge-water" style="position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%); transition: height 0.5s ease; z-index: 0; border-radius: 50%; opacity: 0.5; height: ${Math.min(100, Math.max(0, marketSharePercentage * 2))}%;"></div>
        <span style="position: relative; z-index: 1;">${Math.round(marketSharePercentage)}%</span>
      </div>
    </div>
  `;
  
  // Status
  deviceHTML += `
    <div class="device-status">
      <div class="section-header">Status</div>
      <div class="device-status-value">
        <span class="status-active">Active</span>
      </div>
    </div>
  `;
  
  deviceHTML += `
    <div class="last-tracked-container">
      <div class="last-tracked-label">Company Presence:</div>
      <div class="last-tracked-value recent-tracking">Tracked</div>
    </div>
  `;
  
  deviceHTML += `</div>`;
  
  return deviceHTML;
}

function createCompanyRankMarketShareHistory(record) {
  // For companies mode, use the historical_data from company stats
  if (!record.historical_data || record.historical_data.length === 0) {
    return '<div class="rank-history-container"><div class="no-data-message">No historical data available</div></div>';
  }
  
// Create a proper 30-day date range (latest to earliest for display)
const maxDate = moment().startOf('day');
const minDate = maxDate.clone().subtract(29, 'days');

const dateArray = [];
let currentDate = maxDate.clone(); // Start from latest
while (currentDate.isSameOrAfter(minDate)) {
  dateArray.push(currentDate.format('YYYY-MM-DD'));
  currentDate.subtract(1, 'day'); // Go backwards
}
  
  let html = '<div class="rank-history-container">';
  
  // First row: Company ranks
  html += '<div class="rank-history-row">';
  dateArray.forEach(dateStr => {
    const histItem = record.historical_data.find(item => 
      item.date === dateStr || (item.date && item.date.value === dateStr)
    );
    
    if (histItem && histItem.rank !== undefined && histItem.rank !== null) {
      const rank = Math.round(histItem.rank);
      const colorClass = getRankColorClass(rank);
      html += `<div class="rank-box ${colorClass}">${rank}</div>`;
    } else {
      // Empty day - light grey box with 50% height
      html += '<div class="rank-box" style="background-color: #e0e0e0 !important; height: 25px !important; opacity: 0.5;"></div>';
    }
  });
  html += '</div>';
  
  // Second row: Market share percentages
  html += '<div class="visibility-history-row">';
  dateArray.forEach(dateStr => {
    const histItem = record.historical_data.find(item => 
      item.date === dateStr || (item.date && item.date.value === dateStr)
    );
    
    if (histItem && histItem.market_share !== undefined && histItem.market_share !== null) {
      let marketShare = histItem.market_share;
      // Check if already in percentage
      if (marketShare <= 1) {
        marketShare = marketShare * 100;
      }
      const marketShareRounded = Math.round(marketShare * 10) / 10;
      html += `<div class="visibility-box" data-fill="${marketShareRounded}"><span>${marketShareRounded}%</span></div>`;
    } else {
      // Empty day - light grey box with 50% height
      html += '<div class="visibility-box" style="background-color: #e0e0e0 !important; height: 25px !important; opacity: 0.5;"><span>-</span></div>';
    }
  });
  html += '</div>';
  
  html += '</div>';
  return html;
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

function renderPendingExplorerChartsForProduct() {
  setTimeout(() => {
    const charts = window.pendingExplorerCharts;
    if (!charts || charts.length === 0) {
      console.log('[renderPendingExplorerChartsForProduct] No charts to render');
      return;
    }
    
    const isCompaniesMode = getCurrentMode() === 'companies';
    console.log(`[renderPendingExplorerChartsForProduct] Rendering ${charts.length} charts in ${isCompaniesMode ? 'companies' : 'products'} mode`);
    
    charts.forEach((chartInfo, index) => {
// Inside the charts.forEach loop, replace the existing logic with:

const { containerId, positionChartId, combination, selectedProduct } = chartInfo;

if (isCompaniesMode) {
  // For companies mode, use the record directly from combination
  const companyRecord = combination.record;
  
  if (!companyRecord) {
    console.log(`[renderPendingExplorerChartsForProduct] No company record found`);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="no-data-message">No data for this company</div>';
      container.classList.remove('loading');
    }
    return;
  }
  
  // Use company's segment data
  const chartData = calculateCompanySegmentData(companyRecord);
  
  if (!chartData || chartData.length === 0) {
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
    combination.company,
    companyRecord
  );
  
  // Store reference for position chart
  const positionChartContainer = document.getElementById(positionChartId);
  if (positionChartContainer) {
    positionChartContainer.combinationRecord = companyRecord;
    positionChartContainer.combinationInfo = combination;
  }
} else {
  // Original product mode code - keep as is
  const productRecords = getProductRecords(selectedProduct);
  const specificRecord = productRecords.find(record => 
    record.q === combination.searchTerm &&
    record.location_requested === combination.location &&
    record.device === combination.device
  );
  
  if (!specificRecord) {
    console.log(`[renderPendingExplorerChartsForProduct] No record found for combination:`, combination);
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = '<div class="no-data-message">No data for this product</div>';
      container.classList.remove('loading');
    }
    return;
  }
  
  const chartData = calculateProductSegmentData(specificRecord);
  
  if (!chartData || chartData.length === 0) {
    console.log(`[renderPendingExplorerChartsForProduct] No chart data for ${containerId}`);
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
  
  const positionChartContainer = document.getElementById(positionChartId);
  if (positionChartContainer) {
    positionChartContainer.combinationRecord = specificRecord;
    positionChartContainer.combinationInfo = combination;
  }
}
    });
    
    window.pendingExplorerCharts = [];
    console.log('[renderPendingExplorerChartsForProduct] All charts rendered');
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

function calculateCompanySegmentData(record) {
  // For companies, we use the segment data directly from the record
  if (!record) return null;
  
  const top3 = (record.top3 || 0) * 100;
  const top8 = (record.top8 || 0) * 100;
  const top14 = (record.top14 || 0) * 100;
  const top40 = (record.top40 || 0) * 100;
  
  // Calculate the segments
  const top4_8 = top8 - top3;
  const top9_14 = top14 - top8;
  const below14 = top40 - top14;
  
  // Calculate previous values using trends
  const top3Prev = top3 - ((record.top3Trend || 0) * 100);
  const top8Prev = top8 - ((record.top8Trend || 0) * 100);
  const top14Prev = top14 - ((record.top14Trend || 0) * 100);
  const top40Prev = top40 - ((record.top40Trend || 0) * 100);
  
  const top4_8Prev = top8Prev - top3Prev;
  const top9_14Prev = top14Prev - top8Prev;
  const below14Prev = top40Prev - top14Prev;
  
  return [
    { label: "Top3", current: top3, previous: top3Prev },
    { label: "Top4-8", current: top4_8, previous: top4_8Prev },
    { label: "Top9-14", current: top9_14, previous: top9_14Prev },
    { label: "Below14", current: below14, previous: below14Prev }
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

function createProductRankMarketShareHistory(record) {
  const isCompaniesMode = getCurrentMode() === 'companies';
  
  if (isCompaniesMode) {
    // For companies mode, use the historical_data from company stats
    if (!record.historical_data || record.historical_data.length === 0) {
      return '<div class="rank-history-container"><div class="no-data-message">No historical data available</div></div>';
    }
    
    // Get last 30 days of data
    const dataPoints = record.historical_data.slice(-30);
    
    let html = '<div class="rank-history-container">';
    
    // First row: Company ranks
    html += '<div class="rank-history-row">';
    dataPoints.forEach(point => {
      if (point && point.rank !== undefined && point.rank !== null) {
        const rank = Math.round(point.rank);
        const colorClass = getRankColorClass(rank);
        html += `<div class="rank-box ${colorClass}">${rank}</div>`;
      } else {
        html += '<div class="rank-box"></div>';
      }
    });
    html += '</div>';
    
    // Second row: Market share percentages
    html += '<div class="visibility-history-row">';
    dataPoints.forEach(point => {
      if (point && point.market_share !== undefined && point.market_share !== null) {
        const marketShare = Math.round(point.market_share * 100 * 10) / 10;
        html += `<div class="visibility-box" data-fill="${marketShare}"><span>${marketShare}%</span></div>`;
      } else {
        html += '<div class="visibility-box" data-fill="0"><span>0%</span></div>';
      }
    });
    html += '</div>';
    
    html += '</div>';
    return html;
  } else {
    // Original product mode code - keep exactly as is
    const maxDate = moment().startOf('day');
    const minDate = maxDate.clone().subtract(29, 'days');
    
    const dateArray = [];
    let currentDate = maxDate.clone();
    while (currentDate.isSameOrAfter(minDate)) {
      dateArray.push(currentDate.format('YYYY-MM-DD'));
      currentDate.subtract(1, 'day');
    }
    
    const hasHistoricalData = record.historical_data && record.historical_data.length > 0;
    
    let html = '<div class="rank-history-container">';
    
    if (!hasHistoricalData) {
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
      html += '<div class="rank-history-row">';
dateArray.forEach(dateStr => {
  const histItem = record.historical_data.find(item => 
    item.date?.value === dateStr
  );
  
  if (histItem?.avg_position != null) {
    const rank = Math.round(parseFloat(histItem.avg_position));
    const colorClass = getRankColorClass(rank);
    html += `<div class="rank-box ${colorClass}">${rank}</div>`;
  } else {
    html += '<div class="rank-box" style="background-color: #e0e0e0 !important; height: 25px !important; opacity: 0.5;"></div>';
  }
});
html += '</div>';

html += '<div class="visibility-history-row">';
dateArray.forEach(dateStr => {
  const histItem = record.historical_data.find(item => 
    item.date?.value === dateStr
  );
  
  if (histItem?.visibility != null) {
    const visibility = Math.round(parseFloat(histItem.visibility) * 100 * 10) / 10;
    html += `<div class="visibility-box" data-fill="${visibility}"><span>${visibility}%</span></div>`;
  } else {
    html += '<div class="visibility-box" style="background-color: #e0e0e0 !important; height: 25px !important; opacity: 0.5;"><span>-</span></div>';
  }
});
html += '</div>';
    }
    
    html += '</div>';
    return html;
  }
}

function buildMapDataForSelectedProduct() {
  if (!window.selectedExplorerProduct) {
    console.warn('[buildMapDataForSelectedProduct] No product selected');
    return { searches: [] };
  }
  
  const productRecords = getProductRecords(window.selectedExplorerProduct);
  console.log('[buildMapDataForSelectedProduct] Found', productRecords.length, 'records for product');
  
  const searches = [];
  
  // Group by location first, then by search term, then by device
  const locationGroups = new Map();
  
  productRecords.forEach(record => {
    const location = record.location_requested;
    const searchTerm = record.q;
    const device = record.device;
    
    if (!location || !searchTerm || !device) {
      console.warn('[buildMapDataForSelectedProduct] Skipping record with missing data:', record);
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
  
  console.log('[buildMapDataForSelectedProduct] Built', searches.length, 'search entries for map');
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

function renderAvgPositionChartExplorer(container, products) {
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

function updateChartLineVisibilityExplorer(chartContainer, selectedIndex) {
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

// Enhanced calculateProductMetrics function with trend calculation
function calculateProductMetrics(product) {
  // Configuration: Set to true to use today's date, false to use latest data date
  const useLatestDataDate = window.productMetricsSettings?.useLatestDataDate ?? true;
  
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return { 
      avgRating: 40, 
      avgVisibility: 0, 
      activeLocations: 0, 
      inactiveLocations: 0, 
      isFullyInactive: true,
      rankTrend: { arrow: '', change: '', color: '#444' },
      visibilityTrend: { arrow: '', change: '', color: '#444' }
    };
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
      
      if (isRecordActive) hasAnyActiveLocation = true;
      
      if (!locationStatusMap.has(location)) {
        locationStatusMap.set(location, { hasActive: false, hasInactive: false });
      }
      if (isRecordActive) {
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
    // Method 1: Use latest available data date (current default)
    currentEndDate = latestDate.clone();
  } else {
    // Method 2: Use today's date
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
        
        // Filter current period data
        const currentData = record.historical_data.filter(item => {
          if (!item.date || !item.date.value || item.avg_position == null) return false;
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          return itemDate.isBetween(currentStartDate, currentEndDate, 'day', '[]');
        });
        
        // Filter previous period data
        const prevData = record.historical_data.filter(item => {
          if (!item.date || !item.date.value || item.avg_position == null) return false;
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
        });
        
        // Calculate current period rank
        if (currentData.length > 0) {
          const avgRank = currentData.reduce((sum, item) => sum + parseFloat(item.avg_position), 0) / currentData.length;
          combo.currentRankSum += avgRank;
          combo.currentRankCount++;
          
          // Calculate current period visibility (only for active combinations)
          if (combo.isActive) {
            // Use avg_visibility from record or calculate from historical visibility
            let avgVisibility = 0;
            const visibilityData = currentData.filter(item => item.visibility != null);
            if (visibilityData.length > 0) {
              avgVisibility = (visibilityData.reduce((sum, item) => sum + parseFloat(item.visibility), 0) / visibilityData.length) * 100;
            } else if (record.avg_visibility) {
              avgVisibility = parseFloat(record.avg_visibility) * 100;
            }
            combo.currentVisibilitySum += avgVisibility;
            combo.currentVisibilityCount++;
          }
        }
        
        // Calculate previous period rank
        if (prevData.length > 0) {
          const avgRank = prevData.reduce((sum, item) => sum + parseFloat(item.avg_position), 0) / prevData.length;
          combo.prevRankSum += avgRank;
          combo.prevRankCount++;
          
          // Calculate previous period visibility
          const visibilityData = prevData.filter(item => item.visibility != null);
          if (visibilityData.length > 0) {
            const avgVisibility = (visibilityData.reduce((sum, item) => sum + parseFloat(item.visibility), 0) / visibilityData.length) * 100;
            combo.prevVisibilitySum += avgVisibility;
            combo.prevVisibilityCount++;
          }
        }
      }
    }
    
    // Fallback to direct values if no historical data
    if (combo.currentRankCount === 0) {
      const directRank = record.avg_position || record.finalPosition || 40;
      combo.currentRankSum += parseFloat(directRank);
      combo.currentRankCount++;
    }
  });
  
  // Calculate averages across all combinations
  let totalCurrentRankSum = 0;
  let totalCurrentRankCount = 0;
  let totalCurrentVisibilitySum = 0;
  let totalCurrentVisibilityCount = 0;
  let totalPrevRankSum = 0;
  let totalPrevRankCount = 0;
  let totalPrevVisibilitySum = 0;
  let totalPrevVisibilityCount = 0;
  
  combinationMetrics.forEach(combo => {
    if (combo.currentRankCount > 0) {
      totalCurrentRankSum += (combo.currentRankSum / combo.currentRankCount);
      totalCurrentRankCount++;
    }
    if (combo.currentVisibilityCount > 0 && combo.isActive) {
      totalCurrentVisibilitySum += (combo.currentVisibilitySum / combo.currentVisibilityCount);
      totalCurrentVisibilityCount++;
    }
    if (combo.prevRankCount > 0) {
      totalPrevRankSum += (combo.prevRankSum / combo.prevRankCount);
      totalPrevRankCount++;
    }
    if (combo.prevVisibilityCount > 0) {
      totalPrevVisibilitySum += (combo.prevVisibilitySum / combo.prevVisibilityCount);
      totalPrevVisibilityCount++;
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
    // Rank improved (decreased)
    rankTrend = {
      arrow: '▲',
      change: Math.abs(rankChange).toFixed(1),
      color: '#4CAF50' // Green for improvement
    };
  } else if (rankChange > 0) {
    // Rank worsened (increased)
    rankTrend = {
      arrow: '▼',
      change: rankChange.toFixed(1),
      color: '#F44336' // Red for decline
    };
  } else {
    // No change
    rankTrend = {
      arrow: '—',
      change: '0.0',
      color: '#999' // Gray for no change
    };
  }
}
  
// Calculate visibility trend (higher visibility is better)
let visibilityTrend = { arrow: '', change: '', color: '#999' };
if (totalPrevVisibilityCount > 0) {
  const visibilityChange = currentAvgVisibility - prevAvgVisibility;
  if (visibilityChange > 0) {
    // Visibility improved (increased)
    visibilityTrend = {
      arrow: '▲',
      change: visibilityChange.toFixed(1) + '%',
      color: '#4CAF50' // Green for improvement
    };
  } else if (visibilityChange < 0) {
    // Visibility decreased
    visibilityTrend = {
      arrow: '▼',
      change: Math.abs(visibilityChange).toFixed(1) + '%',
      color: '#F44336' // Red for decline
    };
  } else {
    // No change
    visibilityTrend = {
      arrow: '—',
      change: '0.0%',
      color: '#999' // Gray for no change
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
    `;
    
    navItem.appendChild(smallCard);
    
    navItem.addEventListener('click', function() {
      console.log('[ProductExplorer] Product clicked:', product.title);
      selectProduct(product, navItem);
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
function renderProductExplorerTable() {
  // Ensure body class matches current mode
const currentMode = getCurrentMode();
document.body.classList.remove('mode-products', 'mode-companies');
document.body.classList.add(`mode-${currentMode}`);
  
  const existingTable = document.querySelector("#productExplorerContainer .product-explorer-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderProductExplorerTable] Starting to build product map table");

  window.selectedExplorerProduct = null;
  
  const container = document.getElementById("productExplorerPage");
  if (!container) return;
  
// Check if Product Explorer page is actually visible before proceeding
if (container.style.display === "none") {
  console.log("[renderProductExplorerTable] Product Explorer page is hidden, skipping render");
  return;
}

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
  <div id="productExplorerContainer" style="width: 100%; height: calc(100vh - 150px); position: relative; display: flex;">
    <div id="productsNavPanel" style="width: 400px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0; display: ${currentMode === 'products' ? 'block' : 'none'};">
    </div>
    <div id="compNavPanel" style="width: 400px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0; display: ${currentMode === 'companies' ? 'block' : 'none'};">
    </div>
      <div id="productExplorerTableContainer" style="flex: 1; height: 100%; overflow-y: auto; position: relative;">
        <div class="explorer-view-switcher">
          <button id="viewRankingExplorer" class="active">Ranking</button>
          <button id="viewChartsExplorer">Charts</button>
          <button id="viewMapExplorer">Map</button>
        </div>
        <button id="fullscreenToggleExplorer" class="fullscreen-toggle">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          Full Screen
        </button>
        <div id="productExplorerMapContainer" style="display: none; width: 100%; height: calc(100% - 60px); padding: 20px; box-sizing: border-box;">
        </div>
      </div>
    </div>
  `;
  
  // IMPORTANT: After creating the structure, ensure all containers are visible
  const newProductExplorerContainer = document.getElementById('productExplorerContainer');
  if (newProductExplorerContainer) {
    newProductExplorerContainer.style.display = 'flex';  // Explicitly set display
  }
  
  const tableContainer = document.getElementById('productExplorerTableContainer');
  if (tableContainer) {
    tableContainer.style.display = '';  // Reset display
  }
    
  let fullscreenOverlay = document.getElementById('productExplorerFullscreenOverlay');
  if (!fullscreenOverlay) {
    fullscreenOverlay = document.createElement('div');
    fullscreenOverlay.id = 'productExplorerFullscreenOverlay';
    fullscreenOverlay.className = 'product-explorer-fullscreen-overlay';
    document.body.appendChild(fullscreenOverlay);
  }
  
  // Add fullscreen toggle functionality
  document.getElementById("fullscreenToggleExplorer").addEventListener("click", function() {
    const table = document.querySelector("#productExplorerContainer .product-explorer-table");
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
const currentActiveButton = document.querySelector('.explorer-view-switcher .active');
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

    const originalSwitcher = document.querySelector('.explorer-view-switcher');
    if (originalSwitcher) {
      const switcherClone = originalSwitcher.cloneNode(true);
      fullscreenOverlay.insertBefore(switcherClone, fullscreenOverlay.firstChild);
      
const clonedRankingBtn = switcherClone.querySelector('#viewRankingExplorer');
const clonedChartsBtn = switcherClone.querySelector('#viewChartsExplorer');
const clonedMapBtn = switcherClone.querySelector('#viewMapExplorer');

clonedRankingBtn.addEventListener('click', function() {
  clonedRankingBtn.classList.add('active');
  clonedChartsBtn.classList.remove('active');
  clonedMapBtn.classList.remove('active');
  
  fullscreenOverlay.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  fullscreenOverlay.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
    container.style.display = 'none';
  });
});

clonedChartsBtn.addEventListener('click', function() {
  clonedChartsBtn.classList.add('active');
  clonedRankingBtn.classList.remove('active');
  clonedMapBtn.classList.remove('active');
  
  // Show BOTH segmentation charts AND position charts
  fullscreenOverlay.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  fullscreenOverlay.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
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
  fullscreenOverlay.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
    container.style.display = 'none';
  });
  fullscreenOverlay.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
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
      
      const chartContainers = fullscreenOverlay.querySelectorAll('.explorer-segmentation-chart-container');
      console.log("[DEBUG-FULLSCREEN] Found chart containers:", chartContainers.length);
      
      const originalTable = document.querySelector('.product-explorer-table');
      const originalRows = originalTable.querySelectorAll('tbody tr');
      
      const chartDataMap = {};
      let chartIndex = 0;
      
      originalRows.forEach(row => {
        const originalChartContainer = row.querySelector('.explorer-segmentation-chart-container');
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
          const companyMatch = p.source && p.source.toLowerCase() === (companyToFilter || "").toLowerCase();
          
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
        
        const chartData = calculateAggregateSegmentData(matchingProducts);
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
const viewRankingExplorerBtn = document.getElementById("viewRankingExplorer");
const viewChartsExplorerBtn = document.getElementById("viewChartsExplorer");
const viewMapExplorerBtn = document.getElementById("viewMapExplorer");

viewRankingExplorerBtn.addEventListener("click", function() {
  // Clear all active states
  viewRankingExplorerBtn.classList.add("active");
  viewChartsExplorerBtn.classList.remove("active");
  viewMapExplorerBtn.classList.remove("active");
  
  // Check which mode we're in
  const isCompaniesMode = getCurrentMode() === 'companies';
  const tableSelector = isCompaniesMode ? '.company-explorer-table' : '.product-explorer-table';
  const table = document.querySelector(tableSelector);
  
  if (table) {
    table.style.display = 'table';
    table.classList.add('ranking-mode');
  }
  
  const mapContainer = document.getElementById('productExplorerMapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
  
  // Add ranking mode to device containers
  document.querySelectorAll('.device-container').forEach(container => {
    container.classList.add('ranking-mode');
  });
  
  // Hide position charts and segmentation column
  document.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
    container.style.display = 'none';
  });
  document.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
    container.style.display = 'none';
  });
  // Show rank-market-share history in ranking mode
  document.querySelectorAll('.rank-market-share-history').forEach(container => {
    container.style.display = 'block';
  });
});

viewChartsExplorerBtn.addEventListener("click", function() {
  // Clear all active states
  viewChartsExplorerBtn.classList.add("active");
  viewRankingExplorerBtn.classList.remove("active");
  viewMapExplorerBtn.classList.remove("active");
  
  // Check which mode we're in
  const isCompaniesMode = getCurrentMode() === 'companies';
  const tableSelector = isCompaniesMode ? '.company-explorer-table' : '.product-explorer-table';
  const table = document.querySelector(tableSelector);
  
  if (table) {
    table.style.display = 'table';
    table.classList.remove('ranking-mode');
  }
  
  const mapContainer = document.getElementById('productExplorerMapContainer');
  if (mapContainer) {
    mapContainer.style.display = 'none';
  }
  
  // Remove ranking mode from device containers
  document.querySelectorAll('.device-container').forEach(container => {
    container.classList.remove('ranking-mode');
  });
  
  // Show BOTH segmentation charts AND position charts
  document.querySelectorAll('.explorer-segmentation-chart-container').forEach(container => {
    container.style.display = 'flex';
  });

  document.querySelectorAll('.rank-market-share-history').forEach(container => {
    container.style.display = 'none';
  });
  
  document.querySelectorAll('.explorer-chart-avg-position').forEach(container => {
    container.style.display = 'flex';
    
    // Render position chart if record data is available
    if (container.combinationRecord) {
      renderProductPositionChart(container, container.combinationRecord);
    }
  });
});

viewMapExplorerBtn.addEventListener("click", function() {
  // Clear all active states
  viewMapExplorerBtn.classList.add("active");
  viewRankingExplorerBtn.classList.remove("active");
  viewChartsExplorerBtn.classList.remove("active");
  
  // Hide the product table
  const table = document.querySelector('.product-explorer-table');
  if (table) {
    table.style.display = 'none';
  }
  
  // Show the map container
  const mapContainer = document.getElementById('productExplorerMapContainer');
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
      <button id="toggleLocationBlocks" class="active">
        Hide Location Details
      </button>
    `;
    mapContainer.appendChild(toggleContainer);
    
    // Build map data for the selected product
    const mapProject = buildMapDataForSelectedProduct();
    
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
    document.getElementById('toggleLocationBlocks').addEventListener('click', function() {
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

// Listen for mode changes from modeSelector
document.querySelectorAll('#modeSelector .mode-option').forEach(option => {
  option.addEventListener('click', function() {
    const selectedMode = this.getAttribute('data-mode');
    
    // Update body class
    document.body.classList.remove('mode-products', 'mode-companies');
    document.body.classList.add(`mode-${selectedMode}`);
    
    console.log(`[ProductExplorer] Mode changed to: ${selectedMode}`);
    
    // Hide/show appropriate tables
    if (selectedMode === 'companies') {
      // Hide product table, show company table
      const productTable = document.querySelector('.product-explorer-table');
      if (productTable) productTable.style.display = 'none';
      
      const companyTable = document.querySelector('.company-explorer-table');
      if (companyTable) companyTable.style.display = '';
    } else {
      // Hide company table, show product table
      const companyTable = document.querySelector('.company-explorer-table');
      if (companyTable) companyTable.style.display = 'none';
      
      const productTable = document.querySelector('.product-explorer-table');
      if (productTable) productTable.style.display = '';
    }
    
    // Re-render the entire explorer
    renderProductExplorerTable();
  });
});
  
console.log("[renderProductExplorerTable] Using myCompany:", window.myCompany);

console.log(`[ProductExplorer] Current mode: ${currentMode}`);

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

console.log(`[renderProductExplorerTable] Using company for project ${currentProjectNum}: ${companyToFilter}`);

  if (!document.getElementById("product-explorer-table-style")) {
    const style = document.createElement("style");
    style.id = "product-explorer-table-style";
    style.textContent = `
      .product-explorer-table {
        width: calc(100% - 40px);
        margin-left: 20px;
        border-collapse: collapse;
        background-color: #fff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        border-radius: 12px;
        overflow: hidden;
        table-layout: fixed;
      }
      .product-explorer-table th {
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
.product-explorer-table:not(.ranking-mode) td {
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

.product-explorer-table.ranking-mode td {
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
      .product-explorer-table { table-layout: fixed; }
      .product-explorer-table th:nth-child(1), .product-explorer-table td:nth-child(1) { width: 190px; }
      .product-explorer-table th:nth-child(2), .product-explorer-table td:nth-child(2) { width: 150px; }
.product-explorer-table th:nth-child(3), .product-explorer-table td:nth-child(3) { width: 200px; }
.product-explorer-table th:nth-child(4), .product-explorer-table td:nth-child(4) { width: 230px; }
.product-explorer-table th:nth-child(5), .product-explorer-table td:nth-child(5) { width: auto; min-width: 400px; }

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
      
      .product-explorer-fullscreen-overlay {
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

      .product-explorer-fullscreen-overlay .product-explorer-table {
        width: 100%;
        margin-left: 0;
      }

      .product-explorer-fullscreen-overlay .product-explorer-table th:nth-child(5), 
      .product-explorer-fullscreen-overlay .product-explorer-table td:nth-child(5) {
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
      
      .explorer-view-switcher {
        position: absolute;
        top: 10px;
        right: 140px;
        display: inline-flex;
        background-color: #f0f0f0;
        border-radius: 20px;
        padding: 3px;
        z-index: 100;
      }

      .explorer-view-switcher button {
        padding: 6px 16px;
        border: none;
        background: transparent;
        border-radius: 17px;
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
      }

      .explorer-view-switcher button.active {
        background-color: #007aff;
        color: white;
      }

      .explorer-view-switcher button:hover:not(.active) {
        background-color: rgba(0, 122, 255, 0.1);
      }

      .explorer-chart-avg-position {
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
      
      .explorer-segmentation-chart-container.loading {
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }

      .explorer-segmentation-chart-container.loading::after {
        content: 'Loading chart...';
        font-size: 12px;
      }
      
      .products-nav-cell {
        vertical-align: top;
        padding: 8px !important;
        background-color: #f9f9f9;
        border-right: 2px solid #dee2e6;
      }

      .products-nav-container {
        max-height: calc(100vh - 200px);
        overflow-y: auto;
        overflow-x: hidden;
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 5px;
      }

      .products-nav-container::-webkit-scrollbar {
        width: 8px;
      }

      .products-nav-container::-webkit-scrollbar-track {
        background: #e0e0e0;
        border-radius: 4px;
      }

      .products-nav-container::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 4px;
      }

      .products-nav-container::-webkit-scrollbar-thumb:hover {
        background: #666;
      }

      .nav-product-item {
        margin-bottom: 5px;
      }

.nav-product-item .small-ad-details {
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
      .nav-product-item .small-ad-details:hover {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
      }

      .nav-product-item.selected .small-ad-details {
        border: 2px solid #007aff;
        box-shadow: 0 2px 6px rgba(0,122,255,0.3);
      }

      .nav-product-item .small-ad-image {
        width: 50px;
        height: 50px;
        margin-right: 10px;
        margin-left: 10px;
      }

      .nav-product-item .small-ad-title {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .nav-product-item .small-ad-pos-badge {
        margin-left: auto;
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
      .explorer-view-switcher button {
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
.product-explorer-table.ranking-mode td {
  height: 110px !important;
  max-height: 110px !important;
  min-height: 110px !important;
  padding: 8px !important;
  vertical-align: middle !important;
}

.product-explorer-table.ranking-mode tbody td {
  height: 110px !important;
  max-height: 110px !important;
  min-height: 110px !important;
}

.product-explorer-table.ranking-mode tr {
  height: 110px !important;
  max-height: 110px !important;
}
/* Ensure proper spacing and alignment in ranking mode */
.product-explorer-table.ranking-mode .device-container .last-tracked-container {
  display: none !important;
}

.product-explorer-table.ranking-mode .device-container {
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fafafa;
}
/* Increase Device column width in ranking mode */
.product-explorer-table.ranking-mode th:nth-child(3), 
.product-explorer-table.ranking-mode td:nth-child(3) { 
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
.product-explorer-table.ranking-mode .rank-history-container {
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
.product-explorer-table.ranking-mode .rank-history-row,
.product-explorer-table.ranking-mode .visibility-history-row {
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
.explorer-chart-avg-position {
  display: none;
}

.rank-market-share-history {
  display: block;
}

/* Show position charts and hide rank history in Charts/Map modes */
.product-explorer-table:not(.ranking-mode) .explorer-chart-avg-position {
  display: flex !important;
}

.product-explorer-table:not(.ranking-mode) .rank-market-share-history {
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
#productExplorerMapContainer {
  padding-left: 40px !important;
  text-align: left !important;
}

#productExplorerMapContainer svg {
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
.products-separator {
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

.nav-product-item.inactive-product {
  filter: grayscale(100%) brightness(0.8);
  opacity: 0.7;
}

.nav-product-item.inactive-product:hover {
  filter: grayscale(70%) brightness(0.9);
  opacity: 0.9;
}

.nav-product-item.inactive-product .small-ad-details {
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

/* Adjust vis-water-container to accommodate trend */
.vis-water-container {
  position: relative;
  padding-bottom: 12px; /* Make room for trend text */
}

/* Adjust vis-percentage positioning */
.vis-percentage {
  position: relative;
  z-index: 3;
  font-size: 11px;
  font-weight: bold;
  color: #1565c0;
  text-align: center;
  margin-bottom: 2px; /* Space for trend below */
}

/* Position trend styling - small pill container */
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
  background-color: #4CAF50;
  padding: 2px 4px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  text-shadow: none;
}

/* Visibility trend styling - small pill under percentage */
.vis-trend {
  display: block;
  font-size: 8px;
  font-weight: 700;
  color: white !important;
  background-color: #4CAF50;
  padding: 2px 4px;
  border-radius: 8px;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
  margin-top: 2px;
  text-align: center;
}

.vis-percentage {
  position: relative;
  z-index: 3;
  font-size: 11px;
  font-weight: bold;
  color: #1565c0;
  text-align: center;
}

/* Adjust containers to accommodate trends */
.small-ad-pos-trend-container {
  margin-top: 2px;
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
  padding: 4px 2px;
  box-sizing: border-box;
}

.vis-water-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* Adjust vis-percentage positioning */
.vis-percentage {
  position: relative;
  z-index: 3;
  font-size: 11px;
  font-weight: bold;
  color: #1565c0;
  text-align: center;
  margin-top: -8px; /* Move up slightly to make room for trend */
}

.small-ad-pos-value {
  font-size: 18px;
  line-height: 1;
  color: white;
}
.companies-nav-container {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 5px;
}

.companies-nav-container::-webkit-scrollbar {
  width: 8px;
}

.companies-nav-container::-webkit-scrollbar-track {
  background: #e0e0e0;
  border-radius: 4px;
}

.companies-nav-container::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 4px;
}

.companies-nav-container::-webkit-scrollbar-thumb:hover {
  background: #666;
}

.nav-company-item {
  margin-bottom: 5px;
}

.company-counter-badge {
  background-color: #007aff;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.company-counter-badge:hover {
  background-color: #0056b3;
}
.comp-market-badge {
  position: relative;
  overflow: hidden;
}

.market-badge-value {
  position: relative;
  z-index: 1;
  font-size: 16px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.market-badge-water {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%);
  transition: height 0.5s ease;
  z-index: 0;
  animation: wave 3s ease-in-out infinite;
  border-radius: 50%;
  opacity: 0.5;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

.trend-indicator {
  font-size: 11px;
  font-weight: 700;
  margin-left: 6px;
  display: inline-flex;
  align-items: center;
  padding: 2px 4px;
  border-radius: 3px;
}

.trend-up {
  color: #2E7D32;
  background-color: rgba(76, 175, 80, 0.15);
}

.trend-down {
  color: #C62828;
  background-color: rgba(244, 67, 54, 0.15);
}

.trend-neutral {
  color: #666;
}
// Add this to the existing style block in renderProductExplorerTable
.company-explorer-table {
  width: calc(100% - 40px);
  margin-left: 20px;
  border-collapse: collapse;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 12px;
  overflow: hidden;
  table-layout: fixed;
}
.company-explorer-table th {
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
.company-explorer-table:not(.ranking-mode) td {
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
.company-explorer-table.ranking-mode td {
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
/* Company Explorer Table Ranking Mode Styles */
.company-explorer-table.ranking-mode .device-container {
  display: flex !important;
  flex-direction: row !important;
  height: 100% !important;
  justify-content: space-between !important;
  align-items: center !important;
  padding: 8px !important;
  gap: 8px !important;
  border: 1px solid #eee;
  border-radius: 4px;
  background-color: #fafafa;
}

.company-explorer-table.ranking-mode .device-container .device-type, 
.company-explorer-table.ranking-mode .device-container .device-rank, 
.company-explorer-table.ranking-mode .device-container .device-share,
.company-explorer-table.ranking-mode .device-container .device-status {
  flex: 1 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  align-items: center !important;
  padding: 4px !important;
  min-width: 60px !important;
  text-align: center !important;
}

.company-explorer-table.ranking-mode .device-container .last-tracked-container {
  display: none !important;
}

.company-explorer-table.ranking-mode .device-container .device-rank-value {
  font-size: 24px !important;
  margin: 2px 0 !important;
  font-weight: bold !important;
}

.company-explorer-table.ranking-mode .device-container .device-trend {
  font-size: 14px !important;
  margin: 0 !important;
  font-weight: 600 !important;
}

.company-explorer-table.ranking-mode .device-container .pie-chart-container {
  width: 60px !important;
  height: 60px !important;
  margin: 0 auto !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}

.company-explorer-table.ranking-mode .device-container .section-header {
  font-size: 9px !important;
  margin-bottom: 2px !important;
}

.company-explorer-table.ranking-mode .device-container .device-icon {
  width: 50px !important;
  height: 50px !important;
}
/* Company Explorer Table column widths to match product table */
.company-explorer-table { table-layout: fixed; }
.company-explorer-table th:nth-child(1), .company-explorer-table td:nth-child(1) { width: 190px; min-width: 190px; }
.company-explorer-table th:nth-child(2), .company-explorer-table td:nth-child(2) { width: 150px; min-width: 150px; }
.company-explorer-table th:nth-child(3), .company-explorer-table td:nth-child(3) { width: 300px; min-width: 300px; }
.company-explorer-table th:nth-child(4), .company-explorer-table td:nth-child(4) { width: 230px; min-width: 230px; }
.company-explorer-table th:nth-child(5), .company-explorer-table td:nth-child(5) { width: auto; min-width: 400px; }

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

// Apply mode-specific filtering
if (getCurrentMode() === 'companies') {
  // Company mode specific logic
  console.log(`[ProductExplorer] Processing in COMPANIES mode`);
  
  // Hide products nav panel, show companies nav panel
  const productsNav = document.getElementById('productsNavPanel');
  if (productsNav) productsNav.style.display = 'none';
  
  const compNav = document.getElementById('compNavPanel');
  if (compNav) compNav.style.display = 'block';
  
  renderCompaniesNavPanel();
  return; // Exit early for companies mode - DO NOT process products
}

// Products mode (default)
console.log(`[ProductExplorer] Processing in PRODUCTS mode`);

// Show products nav panel, hide companies nav panel
const productsNav = document.getElementById('productsNavPanel');
if (productsNav) productsNav.style.display = 'block';

const compNav = document.getElementById('compNavPanel');
if (compNav) compNav.style.display = 'none';
  
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

  console.log(`[renderProductExplorerTable] Found ${allCompanyProducts.length} unique products for ${companyToFilter}`);

  allCompanyProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const productsNavPanel = document.getElementById('productsNavPanel');
productsNavPanel.innerHTML = `
  <div style="padding: 15px; margin: 0; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
    <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Products</h3>
    <div id="productsCounter" style="display: flex; gap: 8px;">
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

  productsNavPanel.appendChild(productsNavContainer);

    // Set water fill heights for visibility indicators
  setTimeout(() => {
    document.querySelectorAll('.vis-water-container[data-fill]').forEach(container => {
      const fillPercent = parseFloat(container.getAttribute('data-fill')) || 0;
      container.style.setProperty('--fill-height', fillPercent + '%');
    });
  }, 100);

  setTimeout(() => {
    console.log('[renderProductExplorerTable] Auto-selecting first product...');
    
    const firstNavItem = document.querySelector('.nav-product-item');
    
    if (firstNavItem && allCompanyProducts.length > 0) {
      const firstProduct = allCompanyProducts[0];
      console.log('[renderProductExplorerTable] Auto-selecting:', firstProduct.title);
      
      firstNavItem.click();
    } else {
      console.warn('[renderProductExplorerTable] No products found for auto-selection');
      
      const container = document.querySelector("#productExplorerTableContainer");
      const emptyMessage = document.createElement('div');
      emptyMessage.style.padding = '40px';
      emptyMessage.style.textAlign = 'center';
      emptyMessage.style.color = '#666';
      emptyMessage.innerHTML = '<h3>No products found</h3><p>Please check if data is available for the selected company.</p>';
      container.appendChild(emptyMessage);
    }
  }, 100);
}

// Function to render companies in the navigation panel
function renderCompaniesNavPanel() {
  const compNavPanel = document.getElementById('compNavPanel');
  if (!compNavPanel) return;

// Use the same data source as projectPage.js
if (!window.companyStatsData || window.companyStatsData.length === 0) {
  compNavPanel.innerHTML = `
    <div style="padding: 15px; text-align: center; color: #666;">
      <h3>No company data available</h3>
      <p>Please ensure data is loaded for the current project.</p>
    </div>
  `;
  return;
}

const activeProjectNumber = parseInt(window.filterState?.activeProjectNumber, 10);

// Use pre-calculated data from companyStatsData where q="all" and device="all"
const allCompanyRecords = window.companyStatsData.filter(row => {
  const rowProjNum = parseInt(row.project_number, 10);
  return rowProjNum === activeProjectNumber && row.q === "all" && row.device === "all";
});

console.log(`[renderCompaniesNavPanel] Found ${allCompanyRecords.length} companies with q="all" and device="all"`);

// Transform to the expected format and sort by rank (lowest rank = best = top of list)
const companiesWithAverage = allCompanyRecords
  .filter(record => record.source && record.source !== "Unknown" && record.source !== "null")
  .map(record => ({
    company: record.source,
    currentRank: parseFloat(record["7d_rank"] || 999),
    previousRank: parseFloat(record["7d_prev_rank"] || 999),
    avgMarketShare: parseFloat(record["7d_market_share"] || 0) * 100, // Convert to percentage
    previousMarketShare: parseFloat(record["7d_prev_market_share"] || 0) * 100,
    rankTrend: (parseFloat(record["7d_prev_rank"] || 999)) - (parseFloat(record["7d_rank"] || 999)), // Positive = improvement
    marketShareTrend: (parseFloat(record["7d_market_share"] || 0) * 100) - (parseFloat(record["7d_prev_market_share"] || 0) * 100),
    occurrences: 1,
    historicalData: record.historical_data || []
  }))
  .sort((a, b) => a.currentRank - b.currentRank); // Sort by rank (lowest first)

// Assign project ranks based on sorted order
companiesWithAverage.forEach((company, index) => {
  company.projectRank = index + 1;
});

console.log(`[renderCompaniesNavPanel] Sorted ${companiesWithAverage.length} companies by rank`);
if (companiesWithAverage.length > 0) {
  console.log("[renderCompaniesNavPanel] Top company:", companiesWithAverage[0]);
}

  // Create navigation panel header
  compNavPanel.innerHTML = `
    <div style="padding: 15px; margin: 0; border-bottom: 1px solid #dee2e6; display: flex; justify-content: space-between; align-items: center;">
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Companies</h3>
      <div id="companiesCounter" style="display: flex; gap: 8px;">
        <span class="company-counter-badge all-badge" data-filter="all">${companiesWithAverage.length} Companies</span>
      </div>
    </div>
  `;

  const companiesNavContainer = document.createElement('div');
  companiesNavContainer.classList.add('companies-nav-container');
  companiesNavContainer.style.padding = '10px';

  // Render each company
  companiesWithAverage.forEach((companyData, index) => {
    const navItem = document.createElement('div');
    navItem.classList.add('nav-company-item');
    navItem.style.marginBottom = '8px';
    navItem.style.cursor = 'pointer';

    const smallCompDetails = createSmallCompDetails(companyData);
    navItem.appendChild(smallCompDetails);

    // Add click handler
    navItem.addEventListener('click', function() {
      selectCompany(companyData, navItem);
    });

    companiesNavContainer.appendChild(navItem);
  });

  compNavPanel.appendChild(companiesNavContainer);

  // Auto-select first company
  setTimeout(() => {
    const firstCompanyItem = document.querySelector('.nav-company-item');
    if (firstCompanyItem) {
      firstCompanyItem.click();
    }
  }, 100);
}

// Function to create small company details container
function createSmallCompDetails(companyData) {
  const container = document.createElement('div');
  container.classList.add('small-comp-details');
  
  // Apply similar styling to small-ad-details
  container.style.cssText = `
    width: 370px;
    height: 60px;
    background-color: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    display: flex;
    align-items: center;
    padding: 5px;
    transition: all 0.2s;
    position: relative;
  `;

// Rank badge (left side) - now using actual rank instead of project rank
const rankBadge = document.createElement('div');
rankBadge.style.cssText = `
  width: 50px;
  min-width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  border-radius: 4px;
  margin-right: 10px;
  color: white;
`;

// Color based on position in list (projectRank = order in the sorted list)
const orderRank = companyData.projectRank; // This is the position in the sorted list (1, 2, 3, etc.)
if (orderRank === 1) {
  rankBadge.style.backgroundColor = '#4CAF50';
} else if (orderRank <= 3) {
  rankBadge.style.backgroundColor = '#FFC107';
} else if (orderRank <= 5) {
  rankBadge.style.backgroundColor = '#FF9800';
} else {
  rankBadge.style.backgroundColor = '#F44336';
}

rankBadge.textContent = orderRank; // Show position in list, not actual rank
  
  container.appendChild(rankBadge);

  // Company info
  const infoDiv = document.createElement('div');
  infoDiv.style.cssText = `
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    overflow: hidden;
  `;

  // Company name with rank trend
  const nameDiv = document.createElement('div');
  nameDiv.style.cssText = `
    font-size: 14px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: flex;
    align-items: center;
  `;
  
  const nameText = document.createElement('span');
  nameText.textContent = companyData.company;
  nameDiv.appendChild(nameText);
  
// Add rank trend indicator
if (companyData.rankTrend !== undefined && companyData.rankTrend !== 0) {
  const rankTrendSpan = document.createElement('span');
  rankTrendSpan.className = 'trend-indicator';
  
if (companyData.rankTrend > 0) {
  rankTrendSpan.className += ' trend-up';
  rankTrendSpan.textContent = `▲${Math.abs(companyData.rankTrend).toFixed(2)}`;
  rankTrendSpan.title = `Improved ${Math.abs(companyData.rankTrend).toFixed(2)} positions vs 7 days ago`;
} else {
  rankTrendSpan.className += ' trend-down';
  rankTrendSpan.textContent = `▼${Math.abs(companyData.rankTrend).toFixed(2)}`;
  rankTrendSpan.title = `Declined ${Math.abs(companyData.rankTrend).toFixed(2)} positions vs 7 days ago`;
}
  nameDiv.appendChild(rankTrendSpan);
}
  
  infoDiv.appendChild(nameDiv);

// Last 7 days rank info (no trend)
const rankInfoDiv = document.createElement('div');
rankInfoDiv.style.cssText = `
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

const rankInfoText = document.createElement('span');
rankInfoText.textContent = `Last 7 days rank: ${companyData.currentRank.toFixed(1)}`;
rankInfoDiv.appendChild(rankInfoText);

infoDiv.appendChild(rankInfoDiv);
  container.appendChild(infoDiv);

// Market share badge with trend on the right side
const marketShareContainer = document.createElement('div');
marketShareContainer.style.cssText = `
  display: flex;
  flex-direction: row;
  align-items: center;
  margin-left: 10px;
  gap: 6px;
`;

const marketBadge = document.createElement('div');
marketBadge.className = 'comp-market-badge';
marketBadge.style.cssText = `
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  color: #007aff;
  background: white;
  border: 2px solid #007aff;
  position: relative;
  overflow: hidden;
`;

// Water fill effect
const waterFill = document.createElement('div');
waterFill.className = 'market-badge-water';
const fillPercentage = Math.min(100, Math.max(0, companyData.avgMarketShare * 2)); // Scale for visibility
waterFill.style.height = `${fillPercentage}%`;
marketBadge.appendChild(waterFill);

// Value text
const valueSpan = document.createElement('span');
valueSpan.className = 'market-badge-value';
valueSpan.textContent = `${Math.round(companyData.avgMarketShare)}%`;
marketBadge.appendChild(valueSpan);

marketShareContainer.appendChild(marketBadge);

// Add market share trend to the right of the badge
if (companyData.marketShareTrend !== undefined && Math.abs(companyData.marketShareTrend) >= 0.1) {
  const trendSpan = document.createElement('span');
  trendSpan.style.cssText = `
    font-size: 10px;
    font-weight: 700;
    padding: 2px 4px;
    border-radius: 3px;
    display: inline-block;
    white-space: nowrap;
  `;
  
  if (companyData.marketShareTrend > 0) {
    trendSpan.style.color = '#2E7D32';
    trendSpan.style.backgroundColor = 'rgba(76, 175, 80, 0.15)';
    trendSpan.textContent = `▲${companyData.marketShareTrend.toFixed(2)}%`;
    trendSpan.title = `Increased ${companyData.marketShareTrend.toFixed(2)}% vs 7 days ago`;
  } else {
    trendSpan.style.color = '#C62828';
    trendSpan.style.backgroundColor = 'rgba(244, 67, 54, 0.15)';
    trendSpan.textContent = `▼${Math.abs(companyData.marketShareTrend).toFixed(2)}%`;
    trendSpan.title = `Decreased ${Math.abs(companyData.marketShareTrend).toFixed(2)}% vs 7 days ago`;
  }
  marketShareContainer.appendChild(trendSpan);
}

container.appendChild(marketShareContainer);

  // Hover effect
  container.addEventListener('mouseenter', function() {
    this.style.transform = 'translateX(3px)';
    this.style.boxShadow = '0 2px 6px rgba(0,0,0,0.15)';
  });

  container.addEventListener('mouseleave', function() {
    this.style.transform = 'translateX(0)';
    this.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
  });

  return container;
}

// Function to handle company selection
function selectCompany(companyData, navItemElement) {
  console.log('[selectCompany] Selecting company:', companyData.company);
  
  // Remove previous selection
  document.querySelectorAll('.nav-company-item').forEach(item => {
    item.querySelector('.small-comp-details').style.border = 'none';
  });
  
  // Highlight selected
  if (navItemElement) {
    navItemElement.querySelector('.small-comp-details').style.border = '2px solid #007aff';
  }
  
  window.selectedExplorerCompany = companyData;
  
// Make sure we have the original company_serp_stats data for the table
if (!window.company_serp_stats || window.company_serp_stats.length === 0) {
  if (typeof prepareCompanySerpsStatsData === 'function') {
    prepareCompanySerpsStatsData();
  }
}

// Get all combinations for this company, excluding "all" values
const companyCombinations = window.company_serp_stats
  .filter(stat => {
    return stat.company === companyData.company && 
           stat.searchTerm !== "all" && 
           stat.location !== "all";
  })
  .map(stat => ({
    searchTerm: stat.searchTerm,
    location: stat.location,
    device: stat.device,
    company: stat.company,
    record: stat
  }));
  
  console.log(`[selectCompany] Found ${companyCombinations.length} combinations for ${companyData.company}`);
  
  // Hide product explorer table and show company explorer table
  const productTable = document.querySelector('.product-explorer-table');
  if (productTable) {
    productTable.style.display = 'none';
  }
  
  // Render company table
  const currentViewMode = document.querySelector('.explorer-view-switcher .active')?.id || 'viewRankingExplorer';
  renderCompanyExplorerTable(companyCombinations, currentViewMode);
}

// Debug tracker - add at the END of product_explorer.js
window.trackProductExplorerTable = function() {
  console.log('[TRACKER] Starting to track product-explorer-table changes...');
  
  // Watch for style changes on any product-explorer-table
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
        const element = mutation.target;
        if (element.classList && element.classList.contains('product-explorer-table')) {
          const display = element.style.display;
          if (display === 'none') {
            console.error('[TRACKER] product-explorer-table was hidden!', {
              element: element,
              parent: element.parentElement?.id,
              inProductExplorer: !!element.closest('#productExplorerPage'),
              timestamp: new Date().toISOString()
            });
            
            // Try to find what function called this
            try {
              throw new Error('Tracking stack');
            } catch (e) {
              console.error('[TRACKER] Stack trace:', e.stack);
            }
          }
        }
      }
    });
  });
  
  // Start observing the entire document for attribute changes
  observer.observe(document.body, {
    attributes: true,
    subtree: true,
    attributeFilter: ['style']
  });
  
  console.log('[TRACKER] Tracking active. Will log when product-explorer-table is hidden.');
};

// Auto-start tracking
window.trackProductExplorerTable();

// DEBUG CODE - ADD AT THE VERY END OF product_explorer.js
window.debugProductExplorer = function() {
  console.log('=== PRODUCT EXPLORER DEBUG ===');
  
  const page = document.getElementById('productExplorerPage');
  console.log('1. productExplorerPage:', {
    exists: !!page,
    display: page?.style.display,
    computedDisplay: page ? getComputedStyle(page).display : 'N/A'
  });
  
  const container = document.getElementById('productExplorerTableContainer');
  console.log('2. productExplorerTableContainer:', {
    exists: !!container,
    display: container?.style.display,
    computedDisplay: container ? getComputedStyle(container).display : 'N/A',
    innerHTML: container?.innerHTML.substring(0, 100) + '...'
  });
  
  const tables = document.querySelectorAll('.product-explorer-table');
  console.log('3. product-explorer-tables found:', tables.length);
  
  tables.forEach((table, i) => {
    const computed = getComputedStyle(table);
    console.log(`   Table ${i}:`, {
      parent: table.parentElement?.id,
      display: computed.display,
      visibility: computed.visibility,
      opacity: computed.opacity,
      height: computed.height,
      position: computed.position,
      classList: table.classList.toString()
    });
  });
  
  console.log('4. renderProductExplorerTable exists:', typeof window.renderProductExplorerTable);
  console.log('5. selectedExplorerProduct:', window.selectedExplorerProduct);
}

// AUTO-RUN AFTER 2 SECONDS WHEN ON PRODUCT EXPLORER
setTimeout(() => {
  if (document.getElementById('productExplorerPage')?.style.display === 'block') {
    window.debugProductExplorer();
  }
}, 2000);

// Export the function
if (typeof window !== 'undefined') {
  window.renderProductExplorerTable = renderProductExplorerTable;
  window.renderAvgPositionChartExplorer = renderAvgPositionChartExplorer;
  window.updateChartLineVisibilityExplorer = updateChartLineVisibilityExplorer;
  window.renderProductPositionChart = renderProductPositionChart;
}
