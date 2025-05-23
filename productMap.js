  function renderProductMapTable() {
    console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
    console.log("[renderProductMapTable] Starting to build product map table");
    const container = document.getElementById("productMapPage");
    if (!container) return;
  
    // Setup container with fixed height and scrolling
    container.innerHTML = `
    <div id="productMapContainer" style="width: 100%; height: calc(100vh - 150px); overflow-y: auto; position: relative;">
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
    countContainer.style.width = '180px';
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
        
        /* Segmentation chart container */
        .segmentation-chart-container {
          width: 100%;
          height: 380px !important; /* Fixed height with !important to override inline styles */
          max-height: 380px !important;
          display: flex;
          flex-direction: column;
          align-items: center;
          overflow: hidden;
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
      `;
      document.head.appendChild(style);
    }
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
  
  // Create canvas wrapper div with fixed height
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.width = '100%';
  canvasWrapper.style.height = '280px'; // Fixed height for chart area
  canvasWrapper.style.maxHeight = '280px';
  canvasWrapper.style.position = 'relative';
  canvasWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(canvasWrapper);
  
  // Create canvas element inside the wrapper
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
  // Create the product count container with fixed height
  const countContainer = document.createElement('div');
  countContainer.style.width = '180px';
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
  console.log(`[DEBUG] Segment counts:`, segmentCounts);
  
  countContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
    <div style="font-weight: 700; color: #4CAF50;">${activeCount}</div>
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
    <div style="font-weight: 700; color: #9e9e9e;">${inactiveCount}</div>
  `;
  
  // Add the count container to the chart container
  chartContainer.appendChild(countContainer);
  
  // Add a dummy dataset for product counts (invisible but allows us to use datalabels)
  const dummyData = chartData.map((d, i) => {
    // Position the dummy data at 95% of the scale to place labels at the right edge
    return segmentCounts && segmentCounts[i] > 0 ? 95 : null;
  });
  
  // Create chart with correct responsiveness settings
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
        },
        {
          label: "Product Count",
          data: dummyData,
          backgroundColor: "transparent",
          borderColor: "transparent",
          barThickness: 1,
          categoryPercentage: 1,
          barPercentage: 1
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false, // Important
      onResize: null, // Prevent resize loops
      layout: {
        padding: {
          right: 30 // Add padding to make room for product counts
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          filter: function(tooltipItem) {
            // Hide tooltip for the dummy dataset
            return tooltipItem.datasetIndex !== 2;
          },
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
          display: function(context) {
            if (context.datasetIndex === 0) {
              // Display percentage labels for the main dataset
              return true;
            } else if (context.datasetIndex === 2) {
              // Display product counts for the dummy dataset
              return segmentCounts && segmentCounts[context.dataIndex] > 0;
            }
            return false;
          },
          formatter: (value, context) => {
            if (context.datasetIndex === 0) {
              // Format percentage labels
              const row = chartData[context.dataIndex];
              const mainLabel = `${row.current.toFixed(1)}%`;
              const diff = row.current - row.previous;
              const absDiff = Math.abs(diff).toFixed(1);
              const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "±";
              return [ mainLabel, `${arrow}${absDiff}%` ];
            } else if (context.datasetIndex === 2) {
              // Format product count labels
              return segmentCounts[context.dataIndex];
            }
            return '';
          },
          color: function(context) {
            if (context.datasetIndex === 0) {
              const row = chartData[context.dataIndex];
              const diff = row.current - row.previous;
              if (diff > 0) return "green";
              if (diff < 0) return "red";
              return "#444";
            } else if (context.datasetIndex === 2) {
              return "#333";
            }
            return "transparent";
          },
          anchor: function(context) {
            if (context.datasetIndex === 0) {
              return "end";
            } else if (context.datasetIndex === 2) {
              return "start";
            }
            return "center";
          },
          align: function(context) {
            if (context.datasetIndex === 0) {
              return "end";
            } else if (context.datasetIndex === 2) {
              return "right";
            }
            return "center";
          },
          offset: function(context) {
            if (context.datasetIndex === 0) {
              return 8;
            } else if (context.datasetIndex === 2) {
              return -5;
            }
            return 0;
          },
          font: function(context) {
            if (context.datasetIndex === 2) {
              return { size: 14, weight: 'bold' };
            }
            return { size: 10 };
          },
          backgroundColor: function(context) {
            if (context.datasetIndex === 2) {
              return "rgba(255, 255, 255, 0.8)";
            }
            return null;
          },
          borderColor: function(context) {
            if (context.datasetIndex === 2) {
              return "#ddd";
            }
            return null;
          },
          borderWidth: function(context) {
            if (context.datasetIndex === 2) {
              return 1;
            }
            return 0;
          },
          borderRadius: function(context) {
            if (context.datasetIndex === 2) {
              return 4;
            }
            return 0;
          },
          padding: function(context) {
            if (context.datasetIndex === 2) {
              return { top: 2, bottom: 2, left: 4, right: 4 };
            }
            return 0;
          }
        }
      },
      scales: {
        x: { display: false, min: 0, max: 100 },
        y: { display: true, grid: { display: false }, ticks: { font: { size: 11 } } }
      },
      animation: false // Disable animations to reduce layout recalculations
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
          const chartContainerId = `segmentation-chart-${chartCounter++}`;
          tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container"></div>`;
          tr.appendChild(tdSegmentation);
  
          // Add products cell
          const tdProducts = document.createElement("td");
          tdProducts.classList.add("product-cell-container");
          tdProducts.style.width = "100%";
          tdProducts.style.minWidth = "400px";
  
          // Create product container
          const productCellDiv = document.createElement("div");
          productCellDiv.classList.add("product-cell");
          tdProducts.appendChild(productCellDiv);
  
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
  projectData: projectData
};

// Delay chart creation until after products are rendered
setTimeout(() => {
  // Now calculate segment counts AFTER products have been processed
  const segmentCounts = [0, 0, 0, 0]; // [Top3, Top4-8, Top9-14, Below14]
  
  // Get the product elements that were just rendered
  const productCards = productCellDiv.querySelectorAll('.ad-details');
  console.log(`[DEBUG-SEGMENTS] Found ${productCards.length} product cards`);
  
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
      console.log(`[DEBUG-SEGMENTS] Product ${product.title}: finalPosition = ${product.finalPosition}, parsed = ${posValue}`);
      
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
  
  console.log(`[DEBUG-SEGMENTS] Final segment counts:`, segmentCounts);
  
  // Create the segmentation chart with the correct counts
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
}, 200); // Increased delay to ensure products are fully rendered
  
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
    // Find the latest date in the historical data
    let latestDate = null;
    product.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        if (latestDate === null || itemDate.isAfter(latestDate)) {
          latestDate = itemDate.clone();
        }
      }
    });
    
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
                  
                  // Log the actual historical data count
                  console.log(`[DEBUG] Product '${enhancedProduct.title}' has ${enhancedProduct.historical_data.length} actual historical records`);
                  
                  // 4. Ensure other required fields are present
                  // Calculate real position and trend using historical data
                  if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
                    // Find the latest date in the historical data
                    let latestDate = null;
                    enhancedProduct.historical_data.forEach(item => {
                      if (item.date && item.date.value) {
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        if (latestDate === null || itemDate.isAfter(latestDate)) {
                          latestDate = itemDate.clone();
                        }
                      }
                    });
                  
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
                  console.log(`[DEBUG] Added product to globalRows[${pmIndexKey}] with ${enhancedProduct.historical_data.length} real historical records`);
                  
                  // Now render the product with the same enhanced data
                  const html = compiledTemplate(enhancedProduct);
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  
                  // Get just the first element (the ad-details div)
                  const adCard = tempDiv.firstElementChild;
                  adCard.classList.remove('my-company');
                  
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
                    // Find the latest date in the historical data
                    let latestDate = null;
                    enhancedProduct.historical_data.forEach(item => {
                      if (item.date && item.date.value) {
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        if (latestDate === null || itemDate.isAfter(latestDate)) {
                          latestDate = itemDate.clone();
                        }
                      }
                    });
                  
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
                  
                  // Now render the product with the same enhanced data
                  const html = compiledTemplate(enhancedProduct);
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  
                  // Get just the first element (the ad-details div)
                  const adCard = tempDiv.firstElementChild;
                  adCard.classList.remove('my-company');
                  
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

              // Add direct click handlers to each product card
              productCellDiv.querySelectorAll('.ad-details').forEach(adCard => {
                const plaIndex = adCard.getAttribute('data-pla-index');
                console.log(`[DEBUG] Attaching click handler to card: ${plaIndex}`);
                
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
                    
                    // Call the original component
                    return originalDetailsPanel(props);
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
                      ReactDOM.render(
                        React.createElement(window.DetailsPanel, {
                          key: plaIndex,
                          rowData: rowDataCopy,
                          start: dateRange.start,
                          end: dateRange.end,
                          activeTab: window.savedActiveTab || 1,
                          onClose: () => {
                            detailsPanel.style.display = 'none';
                            document.body.style.overflow = 'auto';
                          }
                        }),
                        contentWrapper
                      );
                      
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
  }
