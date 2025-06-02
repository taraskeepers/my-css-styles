window.pendingExplorerCharts = [];
window.explorerApexCharts = [];

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
  
  const combinations = getProductCombinations(product);
  console.log(`[selectProduct] Found ${combinations.length} combinations for ${product.title}`);
  
  renderTableForSelectedProduct(combinations);
}

function renderTableForSelectedProduct(combinations) {
  console.log('[renderTableForSelectedProduct] Starting with', combinations.length, 'combinations');
  
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
  
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Search Term</th>
      <th>Location</th>
      <th>Device</th>
      <th>Top 40 Segmentation</th>
      <th>Position Chart</th>
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
        const chartContainerId = `explorer-segmentation-chart-${chartCounter++}`;
        tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container loading"></div>`;
        tr.appendChild(tdSegmentation);
        
        // NEW: Position Chart column - removed chart-products, only chart-avg-position
        const tdPositionChart = document.createElement("td");
        const positionChartId = `explorer-position-chart-${chartCounter}`;
        tdPositionChart.innerHTML = `<div id="${positionChartId}" class="chart-avg-position">Click "Charts" view to see position trends</div>`;
        tr.appendChild(tdPositionChart);
        
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
  
  const container = document.querySelector("#productExplorerTableContainer");
  container.appendChild(table);
  
  console.log('[renderTableForSelectedProduct] Table created, rendering charts...');
  
  renderPendingExplorerChartsForProduct();
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
    createMarketSharePieChartExplorer(visChartId, avgVisibility);
  }, 50);
  
  const lastTracked = getLastTrackedInfo(record);
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
    return { text: 'Not tracked', class: '' };
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
    return { text: 'Not tracked', class: '' };
  }
  
  const today = moment().startOf('day');
  const daysDiff = today.diff(latestDate, 'days');
  
  if (daysDiff === 0) {
    return { text: 'Today', class: 'recent-tracking' };
  } else if (daysDiff === 1) {
    return { text: 'Yesterday', class: 'recent-tracking' };
  } else if (daysDiff <= 7) {
    return { text: `${daysDiff} days ago`, class: 'moderate-tracking' };
  } else {
    return { text: `${daysDiff} days ago`, class: 'old-tracking' };
  }
}

function renderPendingExplorerChartsForProduct() {
  setTimeout(() => {
    const charts = window.pendingExplorerCharts;
    if (!charts || charts.length === 0) {
      console.log('[renderPendingExplorerChartsForProduct] No charts to render');
      return;
    }
    
    console.log(`[renderPendingExplorerChartsForProduct] Rendering ${charts.length} product-specific charts`);
    
    charts.forEach((chartInfo, index) => {
      const { containerId, positionChartId, combination, selectedProduct } = chartInfo;
      console.log(`[renderPendingExplorerChartsForProduct] Processing chart ${index + 1}/${charts.length}: ${containerId}`);
      
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
      
      // Store reference to the record for position chart rendering
      const positionChartContainer = document.getElementById(positionChartId);
      if (positionChartContainer) {
        positionChartContainer.combinationRecord = specificRecord;
        positionChartContainer.combinationInfo = combination;
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
  
  const isActive = record.product_status === 'active' || !record.product_status;
  const lastTracked = getLastTrackedInfo(record);
  
  infoContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Status:</div>
    <div style="font-weight: 700; color: ${isActive ? '#4CAF50' : '#9e9e9e'};">${isActive ? 'Active' : 'Inactive'}</div>
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
  
  // Determine date range from the product's historical data
  let allDates = new Set();
  let minDate = null;
  let maxDate = null;
  
  record.historical_data.forEach(item => {
    if (item.date && item.date.value && item.avg_position) {
      const dateStr = item.date.value;
      allDates.add(dateStr);
      const date = moment(dateStr, 'YYYY-MM-DD');
      if (!minDate || date.isBefore(minDate)) minDate = date.clone();
      if (!maxDate || date.isAfter(maxDate)) maxDate = date.clone();
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
  
  const dateArray = [];
  let currentDate = minDate.clone();
  while (currentDate.isSameOrBefore(maxDate)) {
    dateArray.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }
  
  if (dateArray.length > 30) {
    dateArray.splice(0, dateArray.length - 30);
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

// Main function definition
function renderProductExplorerTable() {
  const existingTable = document.querySelector("#productExplorerContainer .product-explorer-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderProductExplorerTable] Starting to build product map table");

  window.selectedExplorerProduct = null;
  
  const container = document.getElementById("productExplorerPage");
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
    <div id="productExplorerContainer" style="width: 100%; height: calc(100vh - 150px); position: relative; display: flex;">
      <div id="productsNavPanel" style="width: 300px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0;">
      </div>
      <div id="productExplorerTableContainer" style="flex: 1; height: 100%; overflow-y: auto; position: relative;">
<div class="view-switcher">
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
      </div>
    </div>
  `;
    
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

    const originalSwitcher = document.querySelector('.view-switcher');
    if (originalSwitcher) {
      const switcherClone = originalSwitcher.cloneNode(true);
      fullscreenOverlay.insertBefore(switcherClone, fullscreenOverlay.firstChild);
      
      const clonedProductsBtn = switcherClone.querySelector('#viewProductsExplorer');
      const clonedChartsBtn = switcherClone.querySelector('#viewChartsExplorer');
      
      clonedProductsBtn.addEventListener('click', function() {
        clonedProductsBtn.classList.add('active');
        clonedChartsBtn.classList.remove('active');
        
        fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
          container.style.display = 'block';
        });
        fullscreenOverlay.querySelectorAll('.chart-avg-position').forEach(container => {
          container.style.display = 'none';
        });
      });
      
      clonedChartsBtn.addEventListener('click', function() {
        clonedChartsBtn.classList.add('active');
        clonedProductsBtn.classList.remove('active');
        
        fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
          container.style.display = 'none';
        });
        fullscreenOverlay.querySelectorAll('.chart-avg-position').forEach(container => {
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
      
      const chartContainers = fullscreenOverlay.querySelectorAll('.segmentation-chart-container');
      console.log("[DEBUG-FULLSCREEN] Found chart containers:", chartContainers.length);
      
      const originalTable = document.querySelector('.product-explorer-table');
      const originalRows = originalTable.querySelectorAll('tbody tr');
      
      const chartDataMap = {};
      let chartIndex = 0;
      
      originalRows.forEach(row => {
        const originalChartContainer = row.querySelector('.segmentation-chart-container');
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
  const viewProductsExplorerBtn = document.getElementById("viewProductsExplorer");
  const viewChartsExplorerBtn = document.getElementById("viewChartsExplorer");

  viewProductsExplorerBtn.addEventListener("click", function() {
    viewProductsExplorerBtn.classList.add("active");
    viewChartsExplorerBtn.classList.remove("active");
    
    // Hide position charts, show segmentation charts
    document.querySelectorAll('.chart-avg-position').forEach(container => {
      container.style.display = 'none';
    });
    document.querySelectorAll('.segmentation-chart-container').forEach(container => {
      container.style.display = 'flex';
    });
  });

  viewChartsExplorerBtn.addEventListener("click", function() {
    viewChartsExplorerBtn.classList.add("active");
    viewProductsExplorerBtn.classList.remove("active");
    
    // Hide segmentation charts, show position charts
    document.querySelectorAll('.segmentation-chart-container').forEach(container => {
      container.style.display = 'none';
    });
    document.querySelectorAll('.chart-avg-position').forEach(container => {
      container.style.display = 'flex';
      
      // Render position chart if record data is available
      if (container.combinationRecord) {
        renderProductPositionChart(container, container.combinationRecord);
      }
    });
  });
  
  console.log("[renderProductExplorerTable] Using myCompany:", window.myCompany);
  
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
      .product-explorer-table td {
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
      .product-explorer-table { table-layout: fixed; }
      .product-explorer-table th:nth-child(1), .product-explorer-table td:nth-child(1) { width: 190px; }
      .product-explorer-table th:nth-child(2), .product-explorer-table td:nth-child(2) { width: 150px; }
      .product-explorer-table th:nth-child(3), .product-explorer-table td:nth-child(3) { width: 120px; }
      .product-explorer-table th:nth-child(4), .product-explorer-table td:nth-child(4) { width: 230px; }
      .product-explorer-table th:nth-child(5), .product-explorer-table td:nth-child(5) { width: auto; min-width: 400px; }
      
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
      
      .view-switcher {
        position: absolute;
        top: 10px;
        right: 140px;
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

      .chart-avg-position {
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
      
      .products-nav-cell {
        vertical-align: top;
        padding: 8px !important;
        background-color: #f9f9f9;
        border-right: 2px solid #dee2e6;
      }

      .products-nav-container {
        width: 280px;
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
        width: 270px;
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
      }

      .nav-product-item .small-ad-title {
        flex: 1;
        font-size: 13px;
        line-height: 1.4;
      }

      .nav-product-item .small-ad-pos-badge {
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

  console.log(`[renderProductExplorerTable] Found ${allCompanyProducts.length} unique products for ${window.myCompany}`);

  allCompanyProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  const productsNavPanel = document.getElementById('productsNavPanel');
  productsNavPanel.innerHTML = '<h3 style="padding: 15px; margin: 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid #dee2e6;">Products</h3>';

  const productsNavContainer = document.createElement('div');
  productsNavContainer.classList.add('products-nav-container');
  productsNavContainer.style.padding = '10px';

  allCompanyProducts.forEach((product, index) => {
    const navItem = document.createElement('div');
    navItem.classList.add('nav-product-item');
    navItem.setAttribute('data-product-index', index);
    
    const smallCard = document.createElement('div');
    smallCard.classList.add('small-ad-details');
    
    const posValue = Math.floor(Math.random() * 20) + 1;
    const badgeColor = '#007aff';
    
    const imageUrl = product.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
    const title = product.title || 'No title';
    
    smallCard.innerHTML = `
      <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
        <div class="small-ad-pos-value">${posValue}</div>
        <div class="small-ad-pos-trend"></div>
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
    
    productsNavContainer.appendChild(navItem);
  });

  productsNavPanel.appendChild(productsNavContainer);

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
  }, 500);
}

// Export the function
if (typeof window !== 'undefined') {
  window.renderProductExplorerTable = renderProductExplorerTable;
  window.renderAvgPositionChartExplorer = renderAvgPositionChartExplorer;
  window.updateChartLineVisibilityExplorer = updateChartLineVisibilityExplorer;
  window.renderProductPositionChart = renderProductPositionChart;
}
