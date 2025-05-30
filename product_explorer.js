window.pendingExplorerCharts = [];
window.explorerApexCharts = [];

function renderProductExplorerTable() {
    const existingTable = document.querySelector("#productExplorerContainer .product-explorer-table");
if (existingTable) {
  existingTable.remove();
}
    console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
    console.log("[renderProductExplorerTable] Starting to build product map table");

    window.selectedExplorerProduct = null;

// Function to get all records for a specific product
function getProductRecords(product) {
  if (!window.allRows || !product) return [];
  
  return window.allRows.filter(record => 
    record.title === product.title && 
    record.source === product.source
  );
}

// Function to get unique combinations for a product
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
        record: record // Keep reference to original record
      });
    }
  });
  
  console.log(`[getProductCombinations] Found ${combinations.length} combinations for product: ${product.title}`);
  return combinations;
}
    
    const container = document.getElementById("productExplorerPage");
    if (!container) return;

    // Clear any existing segmentation charts and reset the array
window.pendingExplorerCharts = [];

// Destroy any existing ApexCharts instances
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
  
// Setup container with fixed height and scrolling
container.innerHTML = `
  <div id="productExplorerContainer" style="width: 100%; height: calc(100vh - 150px); position: relative; display: flex;">
    <div id="productsNavPanel" style="width: 300px; height: 100%; overflow-y: auto; background-color: #f9f9f9; border-right: 2px solid #dee2e6; flex-shrink: 0;">
      <!-- Products navigation will be inserted here -->
    </div>
    <div id="productExplorerTableContainer" style="flex: 1; height: 100%; overflow-y: auto; position: relative;">
      <div class="view-switcher">
        <button id="viewProductsExplorer" class="active">Products</button>
        <button id="viewChartsExplorer">Charts</button>
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
    
    // Create fullscreen overlay container (hidden initially)
    let fullscreenOverlay = document.getElementById('productExplorerFullscreenOverlay');
    if (!fullscreenOverlay) {
      fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'productExplorerFullscreenOverlay';
      fullscreenOverlay.className = 'product-explorer-fullscreen-overlay';
      document.body.appendChild(fullscreenOverlay);
    }
    
    // Add fullscreen toggle functionality
    document.getElementById("fullscreenToggleExplorer").addEventListener("click", function() {
      // Get the current table
      const table = document.querySelector("#productExplorerContainer .product-explorer-table");
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
        const detailsPanel = document.getElementById('product-explorer-details-panel');
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
  const clonedProductsBtn = switcherClone.querySelector('#viewProductsExplorer');
  const clonedChartsBtn = switcherClone.querySelector('#viewChartsExplorer');
  
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
      renderAvgPositionChartExplorer(chartAvgPosDiv, products);
      
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
          updateChartLineVisibilityExplorer(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);;
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
      
      card.click(); // true indicates we're in fullscreen mode
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
  const originalTable = document.querySelector('.product-explorer-table');
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
const viewProductsExplorerBtn = document.getElementById("viewProductsExplorer");
const viewChartsExplorerBtn = document.getElementById("viewChartsExplorer");

viewProductsExplorerBtn.addEventListener("click", function() {
  // Switch to Products view
  viewProductsExplorerBtn.classList.add("active");
  viewChartsExplorerBtn.classList.remove("active");
  
  // Show all product cells, hide all chart containers
  document.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'block';
  });
  document.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'none';
  });
});

viewChartsExplorerBtn.addEventListener("click", function() {
  // Switch to Charts view
  viewChartsExplorerBtn.classList.add("active");
  viewProductsExplorerBtn.classList.remove("active");
  
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
      renderAvgPositionChartExplorer(chartAvgPosDiv, products);
      
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
          updateChartLineVisibilityExplorer(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);;
        };
        
        // Store reference to handler for cleanup
        card._chartClickHandler = clickHandler;
        card.addEventListener('click', clickHandler);
      });
    }
  });
});
  
    console.log("[renderProductExplorerTable] Using myCompany:", window.myCompany);
    // CRITICAL: Clear and reset chart arrays to prevent conflicts with productMap
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
          height: 400px; /* Fixed height */
          max-height: 400px;
          box-sizing: border-box;
          overflow: hidden;
        }
/* Fixed column widths - MODIFIED */
.product-explorer-table { table-layout: fixed; }
.product-explorer-table th:nth-child(1), .product-explorer-table td:nth-child(1) { width: 190px; }
.product-explorer-table th:nth-child(2), .product-explorer-table td:nth-child(2) { width: 150px; }
.product-explorer-table th:nth-child(3), .product-explorer-table td:nth-child(3) { width: 120px; }
.product-explorer-table th:nth-child(4), .product-explorer-table td:nth-child(4) { width: 300px; }
.product-explorer-table th:nth-child(5), .product-explorer-table td:nth-child(5) { width: auto; }
        
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

.product-explorer-fullscreen-overlay .product-cell {
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

.product-explorer-fullscreen-overlay .product-cell .ad-details {
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
/* Products navigation column styles */
/* Products navigation column styles */
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

/* Use exact same styles as chart products */
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
      `;
      document.head.appendChild(style);
    }
    // Add this at the beginning of renderProductExplorerTable after checking for existing product-explorer-table-style
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
    function createMarketSharePieChartExplorer(containerId, shareValue) {
      const container = document.getElementById(containerId);
      if (!container) return;

      container.innerHTML = '';
      
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
        if (!window.explorerApexCharts) {
    window.explorerApexCharts = [];
  }
  window.explorerApexCharts.push(chart);
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
function createSegmentationChartExplorer(containerId, chartData, termParam, locParam, deviceParam, myCompanyParam, activeCount, inactiveCount, segmentCounts) {
  // Create a unique ID for the chart
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) return;
  chartContainer.classList.remove('loading');

    console.log(`[DEBUG-CHART] Creating chart for container: ${containerId}`);
  console.log(`[DEBUG-CHART] segmentCounts parameter:`, segmentCounts);
  console.log(`[DEBUG-CHART] segmentCounts type:`, typeof segmentCounts);
  console.log(`[DEBUG-CHART] segmentCounts is array:`, Array.isArray(segmentCounts));
  console.log(`[DEBUG-CHART] Chart container found:`, !!chartContainer);
  
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
  
// Create new table with proper structure
const table = document.createElement("table");
table.classList.add("product-explorer-table");
table.style.tableLayout = "fixed"; // Ensure fixed layout

// Create header
const thead = document.createElement("thead");
thead.innerHTML = `
  <tr>
    <th style="width: 190px;">Search Term</th>
    <th style="width: 150px;">Location</th>
    <th style="width: 120px;">Device</th>
    <th style="width: 300px;">Top 40 Segmentation</th>
    <th style="width: auto;">Charts</th>
  </tr>
`;
table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    // Get the shopping ad template
    const adTemplate = document.getElementById("shopping-ad-template").innerHTML;
    const compiledTemplate = Handlebars.compile(adTemplate);
  
    console.log("[renderProductExplorerTable] Processing search terms");
    
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

    // First, collect all unique products for this company
const allCompanyProducts = [];
const productMap = new Map(); // To track unique products

if (window.allRows && Array.isArray(window.allRows)) {
  window.allRows.forEach(product => {
    if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
      // Use only title for uniqueness
const productKey = product.title || '';
      
      if (!productMap.has(productKey)) {
        productMap.set(productKey, product);
        allCompanyProducts.push(product);
      }
    }
  });
}

console.log(`[renderProductExplorerTable] Found ${allCompanyProducts.length} unique products for ${window.myCompany}`);

// Sort products alphabetically by title
allCompanyProducts.sort((a, b) => (a.title || '').localeCompare(b.title || ''));

// Calculate total rows needed for the table
let totalRows = 0;
Object.values(nestedMap).forEach(locObj => {
  Object.values(locObj).forEach(deviceRows => {
    totalRows += deviceRows.length;
  });
});

// Create the Products navigation cell (spans all rows)
let productsNavRendered = false;
    
    // Iterate through search terms
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
    deviceRows.forEach((rowData, deviceIndex) => {
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
          
// 3. Visibility metric
const matchingProducts = window.allRows.filter(p => 
  p.q === term &&
  p.location_requested === loc &&
  p.device === rowData.device &&
  p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase()
);

let avgVisibility = 0;
if (matchingProducts.length > 0) {
  const visSum = matchingProducts.reduce((sum, product) => {
    const vis = parseFloat(product.avg_visibility) || 0;
    return sum + vis;
  }, 0);
  avgVisibility = visSum / matchingProducts.length;
}

deviceHTML += `
  <div class="device-share">
    <div class="section-header">Visibility</div>
    <div class="visibility-display" style="text-align: center; padding: 10px;">
      <div style="font-size: 24px; font-weight: bold; color: #007aff;">
        ${(avgVisibility * 100).toFixed(1)}%
      </div>
    </div>
  </div>
`;
          // Find the latest tracking date from all active products
let latestDate = null;

// Find ALL products for this term/location/device combination, regardless of status
const allProductsForDevice = window.allRows.filter(p => 
  p.q === term &&
  p.location_requested === loc &&
  p.device === rowData.device &&
  p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase()
);

// Find the latest date in all historical data
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
const chartContainerId = `explorer-segmentation-chart-${chartCounter++}`;
tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container loading"></div>`;
tr.appendChild(tdSegmentation);

// Add Charts cell
const tdCharts = document.createElement("td");
tdCharts.innerHTML = `<div class="products-chart-container" style="display: none;">
  <div class="chart-products"></div>
  <div class="chart-avg-position">Click "Charts" view to see position trends</div>
</div>`;
tr.appendChild(tdCharts);

tbody.appendChild(tr);
        });
      });
    });

    // Create products navigation panel
const productsNavPanel = document.getElementById('productsNavPanel');
productsNavPanel.innerHTML = '<h3 style="padding: 15px; margin: 0; font-size: 16px; font-weight: 600; border-bottom: 1px solid #dee2e6;">Products</h3>';

const productsNavContainer = document.createElement('div');
productsNavContainer.classList.add('products-nav-container');
productsNavContainer.style.padding = '10px';

// Add all unique products
allCompanyProducts.forEach((product, index) => {
  const navItem = document.createElement('div');
  navItem.classList.add('nav-product-item');
  navItem.setAttribute('data-product-index', index);
  
  // Create small ad details container
  const smallCard = document.createElement('div');
  smallCard.classList.add('small-ad-details');
  
  // Use placeholder values for now
  const posValue = Math.floor(Math.random() * 20) + 1; // Placeholder: random 1-20
  const badgeColor = '#007aff'; // Placeholder color
  
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

    function selectProduct(product, navItemElement) {
  console.log('[selectProduct] Selecting product:', product.title);
  
  // Update visual selection
  document.querySelectorAll('.nav-product-item').forEach(item => {
    item.classList.remove('selected');
  });
  
  if (navItemElement) {
    navItemElement.classList.add('selected');
  }
  
  // Update global state
  window.selectedExplorerProduct = product;
  
  // Get combinations for this product
  const combinations = getProductCombinations(product);
  console.log(`[selectProduct] Found ${combinations.length} combinations for ${product.title}`);
  
  // Rebuild table with filtered data
  renderTableForSelectedProduct(combinations);
}

// ADD this function right after selectProduct function:

function renderTableForSelectedProduct(combinations) {
  console.log('[renderTableForSelectedProduct] Starting with', combinations.length, 'combinations');
  
  // Clear existing table content
  const existingTable = document.querySelector("#productExplorerContainer .product-explorer-table");
  if (existingTable) {
    existingTable.remove();
  }
  
  // Clear pending charts
  window.pendingExplorerCharts = [];
  
  // Destroy existing ApexCharts
  if (window.explorerApexCharts) {
    window.explorerApexCharts.forEach(chart => {
      try { chart.destroy(); } catch (e) {}
    });
  }
  window.explorerApexCharts = [];
  
  // Create new table
  const table = document.createElement("table");
  table.classList.add("product-explorer-table");
  
  // Create header
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Search Term</th>
      <th>Location</th>
      <th>Device</th>
      <th>Top 40 Segmentation</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement("tbody");
  table.appendChild(tbody);
  
  // Counter for unique chart IDs
  let chartCounter = 0;
  let pieChartCounter = 0;
  
  // Create location color mapping
  const locationColorMap = {};
  const allLocationsList = [...new Set(combinations.map(c => c.location))];
  allLocationsList.sort().forEach((loc, index) => {
    const colorIndex = (index % 10) + 1;
    locationColorMap[loc] = `location-bg-${colorIndex}`;
  });
  
  // Group combinations by search term for rowspan logic
  const termGroups = {};
  combinations.forEach(combo => {
    if (!termGroups[combo.searchTerm]) {
      termGroups[combo.searchTerm] = [];
    }
    termGroups[combo.searchTerm].push(combo);
  });
  
  // Render each combination as a table row
  Object.keys(termGroups).sort().forEach(searchTerm => {
    const termCombinations = termGroups[searchTerm];
    let termCellUsed = false;
    
    termCombinations.forEach(combination => {
      const tr = document.createElement("tr");
      
      // Search term cell (with rowspan)
      if (!termCellUsed) {
        const tdTerm = document.createElement("td");
        tdTerm.rowSpan = termCombinations.length;
        tdTerm.innerHTML = `<div class="search-term-tag">${searchTerm}</div>`;
        tr.appendChild(tdTerm);
        termCellUsed = true;
      }
      
      // Location cell
      const tdLoc = document.createElement("td");
      tdLoc.innerHTML = formatLocationCell(combination.location);
      tdLoc.classList.add(locationColorMap[combination.location]);
      tr.appendChild(tdLoc);
      
      // Device cell
      const tdDev = document.createElement("td");
      tdDev.innerHTML = createDeviceCell(combination);
      tr.appendChild(tdDev);
      
// Segmentation cell
      const tdSegmentation = document.createElement("td");
      const chartContainerId = `explorer-segmentation-chart-${chartCounter++}`;
      tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container loading"></div>`;
      tr.appendChild(tdSegmentation);
      
      // Add Charts cell - NEW
      const tdCharts = document.createElement("td");
      tdCharts.innerHTML = `<div class="products-chart-container" style="display: none;">
        <div class="chart-products"></div>
        <div class="chart-avg-position">Click "Charts" view to see position trends</div>
      </div>`;
      tr.appendChild(tdCharts);
      
      // Add to pending charts with product-specific data
      const chartInfo = {
        containerId: chartContainerId,
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
  
  // Add table to container
  const container = document.querySelector("#productExplorerTableContainer");
  container.appendChild(table);
  
  console.log('[renderTableForSelectedProduct] Table created, rendering charts...');
  
  // Render pending charts
  renderPendingExplorerChartsForProduct();
}

    // ADD these helper functions right after renderTableForSelectedProduct:

function createDeviceCell(combination) {
  const record = combination.record;
  
  // Create device container with three sections
  let deviceHTML = `<div class="device-container">`;
  
  // 1. Device type with icon
  const deviceIcon = record.device.toLowerCase().includes('mobile') 
    ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' 
    : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png';
  
  deviceHTML += `<div class="device-type">
    <img src="${deviceIcon}" alt="${record.device}" class="device-icon" />
  </div>`;
  
  // 2. Calculate average rank from historical data
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
  
// 3. Visibility with round chart
const record = combination.record;
let avgVisibility = 0;
if (record.avg_visibility) {
  avgVisibility = parseFloat(record.avg_visibility) * 100;
}

const visChartId = `vis-chart-${Date.now()}-${Math.random()}`;
deviceHTML += `
  <div class="device-share">
    <div class="section-header">Visibility</div>
    <div id="${visChartId}" class="pie-chart-container"></div>
  </div>
`;

// Create the visibility chart after HTML is added
setTimeout(() => {
  createMarketSharePieChartExplorer(visChartId, avgVisibility);
}, 50);
  
  // 4. Last tracked info
  const lastTracked = getLastTrackedInfo(record);
  deviceHTML += `
    <div class="last-tracked-container">
      <div class="last-tracked-label">Last time tracked:</div>
      <div class="last-tracked-value ${lastTracked.class}">${lastTracked.text}</div>
    </div>
  `;
  
  deviceHTML += `</div>`; // Close device-container
  
  return deviceHTML;
}

function calculateAvgRankFromHistorical(record) {
  if (!record.historical_data || record.historical_data.length === 0) {
    return { value: '-', arrow: '', change: '', color: '#444' };
  }
  
  // Find latest date and calculate 7-day window
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
  
  // Current and previous 7-day periods
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const prevEndDate = startDate.clone().subtract(1, 'days');
  const prevStartDate = prevEndDate.clone().subtract(6, 'days');
  
  // Calculate current period average
  const currentData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value || !item.avg_position) return false;
    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
    return itemDate.isBetween(startDate, endDate, 'day', '[]');
  });
  
  // Calculate previous period average
  const prevData = record.historical_data.filter(item => {
    if (!item.date || !item.date.value || !item.avg_position) return false;
    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
    return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
  });
  
  if (currentData.length === 0) {
    return { value: '-', arrow: '', change: '', color: '#444' };
  }
  
  // Calculate averages
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
  
  // For position: lower is better, so negative change is good (▲), positive change is bad (▼)
  let arrow, color;
  if (change < 0) {
    arrow = '▲'; // Position improved
    color = 'green';
  } else if (change > 0) {
    arrow = '▼'; // Position worsened
    color = 'red';
  } else {
    arrow = '±'; // No change
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
  
  // Find latest date
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
  // Add a small delay to ensure DOM elements are ready
  setTimeout(() => {
    const charts = window.pendingExplorerCharts;
    if (!charts || charts.length === 0) {
      console.log('[renderPendingExplorerChartsForProduct] No charts to render');
      return;
    }
    
    console.log(`[renderPendingExplorerChartsForProduct] Rendering ${charts.length} product-specific charts`);
    
    charts.forEach((chartInfo, index) => {
      const { containerId, combination, selectedProduct } = chartInfo;
      console.log(`[renderPendingExplorerChartsForProduct] Processing chart ${index + 1}/${charts.length}: ${containerId}`);
      
      // Get the specific record for this combination and product
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
      
      // Calculate segmentation data for this specific product
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
      
      // Create the chart with product-specific data
      createProductSegmentationChart(
        containerId,
        chartData,
        combination.searchTerm,
        combination.location,
        combination.device,
        selectedProduct.source,
        specificRecord
      );
    });
    
    // Clear pending charts
    window.pendingExplorerCharts = [];
    console.log('[renderPendingExplorerChartsForProduct] All charts rendered');
  }, 100);
}

function calculateProductSegmentData(record) {
  if (!record.historical_data || record.historical_data.length === 0) {
    return null;
  }
  
  // Find latest date and calculate periods
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
  
  // Define periods
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const prevEnd = startDate.clone().subtract(1, 'days');
  const prevStart = prevEnd.clone().subtract(6, 'days');
  
  // Filter data for periods
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
  
  // Calculate averages
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
  
  // Current period averages
  const currTop3 = avg(currentData, "top3_visibility", 100);
  const currTop8 = avg(currentData, "top8_visibility", 100);
  const currTop14 = avg(currentData, "top14_visibility", 100);
  const currTop40 = avg(currentData, "top40_visibility", 100) || avg(currentData, "market_share", 100);
  
  // Previous period averages
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
  
  // Clear and setup container
  chartContainer.innerHTML = '';
  chartContainer.style.height = '380px';
  chartContainer.style.maxHeight = '380px';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.display = 'flex';
  chartContainer.style.flexDirection = 'column';
  chartContainer.style.alignItems = 'center';
  
  // Create canvas wrapper
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.width = '100%';
  canvasWrapper.style.height = '280px';
  canvasWrapper.style.maxHeight = '280px';
  canvasWrapper.style.position = 'relative';
  canvasWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(canvasWrapper);
  
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
  // Create product info container
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
  
  // Show product status and tracking info
  const isActive = record.product_status === 'active' || !record.product_status;
  const lastTracked = getLastTrackedInfo(record);
  
  infoContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Status:</div>
    <div style="font-weight: 700; color: ${isActive ? '#4CAF50' : '#9e9e9e'};">${isActive ? 'Active' : 'Inactive'}</div>
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Last Tracked:</div>
    <div style="font-weight: 700;" class="${lastTracked.class}">${lastTracked.text}</div>
  `;
  
  chartContainer.appendChild(infoContainer);
  
  // Create the chart
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

    
  
  productsNavContainer.appendChild(navItem);
});

productsNavPanel.appendChild(productsNavContainer);
  
    container.querySelector("#productExplorerTableContainer").appendChild(table);
    console.log("[renderProductExplorerTable] Table rendering complete");

setTimeout(() => {
  console.log('[renderProductExplorerTable] Auto-selecting first product...');
  
  // Find first navigation item
  const firstNavItem = document.querySelector('.nav-product-item');
  
  if (firstNavItem && allCompanyProducts.length > 0) {
    const firstProduct = allCompanyProducts[0];
    console.log('[renderProductExplorerTable] Auto-selecting:', firstProduct.title);
    
    // Trigger click event to ensure proper selection
    firstNavItem.click();
  } else {
    console.warn('[renderProductExplorerTable] No products found for auto-selection');
    
    // Show empty state in table
    const container = document.querySelector("#productExplorerTableContainer");
    const emptyMessage = document.createElement('div');
    emptyMessage.style.padding = '40px';
    emptyMessage.style.textAlign = 'center';
    emptyMessage.style.color = '#666';
    emptyMessage.innerHTML = '<h3>No products found</h3><p>Please check if data is available for the selected company.</p>';
    container.appendChild(emptyMessage);
  }
}, 500); // Increased timeout to ensure DOM is ready
  }

// Function to render average position chart
function renderAvgPositionChartExplorer(container, products) {
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

function updateChartLineVisibilityExplorer(chartContainer, selectedIndex) {
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
  window.renderProductExplorerTable = renderProductExplorerTable;
}
