function renderProductExplorerTable() {
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderProductExplorerTable] Starting to build product explorer table");
  const container = document.getElementById("productExplorerPage");
  if (!container) return;

  // Setup container with fixed height and scrolling
  container.innerHTML = `
    <div id="productExplorerContainer" style="width: 100%; height: calc(100vh - 150px); overflow-y: auto; position: relative;">
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
      console.warn("No product explorer table found to display in fullscreen");
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
                updateChartLineVisibilityExplorer(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
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
          
          openProductExplorerDetailsPanel(card, rowData, true); // true indicates we're in fullscreen mode
        });
      });
    });
    
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
  const viewProductsBtn = document.getElementById("viewProductsExplorer");
  const viewChartsBtn = document.getElementById("viewChartsExplorer");

  viewProductsBtn.addEventListener("click", function() {
    // Switch to Products view
    viewProductsBtn.classList.add("active");
    viewChartsBtn.classList.remove("active");
    
    // Show all product cells, hide all chart containers
    document.querySelectorAll('.product-cell-container').forEach(container => {
      container.style.display = 'block';
    });
    document.querySelectorAll('.products-chart-container').forEach(container => {
      container.style.display = 'none';
    });
  });

  viewChartsBtn.addEventListener("click", function() {
    // Switch to Charts view
    viewChartsBtn.classList.add("active");
    viewProductsBtn.classList.remove("active");
    
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
            updateChartLineVisibilityExplorer(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
          };
          
          // Store reference to handler for cleanup
          card._chartClickHandler = clickHandler;
          card.addEventListener('click', clickHandler);
        });
      }
    });
  });

  console.log("[renderProductExplorerTable] Using myCompany:", window.myCompany);

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
        height: 380px; /* Fixed height */
        max-height: 380px;
        box-sizing: border-box;
        overflow: hidden;
      }
      /* Fixed column widths - MODIFIED */
      .product-explorer-table th:nth-child(1), .product-explorer-table td:nth-child(1) { width: 190px; }
      .product-explorer-table th:nth-child(2), .product-explorer-table td:nth-child(2) { width: 120px; }
      .product-explorer-table th:nth-child(3), .product-explorer-table td:nth-child(3) { width: 100px; }
      .product-explorer-table th:nth-child(4), .product-explorer-table td:nth-child(4) { width: 240px; }
      .product-explorer-table th:nth-child(5), .product-explorer-table td:nth-child(5) { 
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
      
      .analytics-chart-container.loading {
        background: #f5f5f5;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
      }

      .analytics-chart-container.loading::after {
        content: 'Loading analytics...';
        font-size: 12px;
      }
    `;
    document.head.appendChild(style);
  }
  
  // Add spinner style if not already added
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
  function createMarketSharePieChartExplorer(containerId, shareValue) {
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
  table.classList.add("product-explorer-table");

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>Search Term</th>
      <th>Location</th>
      <th>Device</th>
      <th>Analytics</th>
      <th>Products</th>
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

        // Add device cell
        const tdDev = document.createElement("td");
        
        // Find the corresponding data in projectTableData for this term, location, device
        const projectData = window.projectTableData.find(item => 
          item.searchTerm === term && 
          item.location === loc &&
          item.device === rowData.device
        );
        
        // Create device container with device info
        let deviceHTML = `<div class="device-container">`;
        
        // Device type
        deviceHTML += `<div class="device-type"><img src="${rowData.device.toLowerCase().includes('mobile') ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png'}" alt="${rowData.device}" class="device-icon" /></div>`;
        
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
        
        // Add Analytics cell (placeholder for now but with proper structure)
        const tdAnalytics = document.createElement("td");
        const analyticsContainerId = `analytics-chart-${chartCounter++}`;
        tdAnalytics.innerHTML = `<div id="${analyticsContainerId}" class="analytics-chart-container loading"></div>`;
        tr.appendChild(tdAnalytics);

        // Add products cell
        const tdProducts = document.createElement("td");
        tdProducts.style.width = "100%";
        tdProducts.style.minWidth = "400px";

        // Create product cell container (for Products view)
        const productCellContainer = document.createElement("div");
        productCellContainer.classList.add("product-cell-container");
        productCellContainer.style.width = "100%";
        productCellContainer.style.height = "100%";

        // Create product container
        const productCellDiv = document.createElement("div");
        productCellDiv.classList.add("product-cell");
        productCellContainer.appendChild(productCellDiv);
        tdProducts.appendChild(productCellContainer);

        // Create products chart container (for Charts view)
        const productsChartContainer = document.createElement("div");
        productsChartContainer.classList.add("products-chart-container");

        // Create chart-products container
        const chartProductsDiv = document.createElement("div");
        chartProductsDiv.classList.add("chart-products");

        // Create chart-avg-position container
        const chartAvgPositionDiv = document.createElement("div");
        chartAvgPositionDiv.classList.add("chart-avg-position");
        chartAvgPositionDiv.innerHTML = '<div>Average Position Chart</div>';

        productsChartContainer.appendChild(chartProductsDiv);
        productsChartContainer.appendChild(chartAvgPositionDiv);
        tdProducts.appendChild(productsChartContainer);

        // Find and display matching products
        if (window.allRows && Array.isArray(window.allRows)) {
          console.log(`[renderProductExplorerTable] Finding products for ${term}, ${loc}, ${rowData.device}`);
          
          const matchingProducts = window.allRows.filter(p => 
            p.q === term &&
            p.location_requested === loc &&
            p.device === rowData.device &&
            p.source && p.source.toLowerCase() === (window.myCompany || "").toLowerCase()
          );

          console.log(`[renderProductExplorerTable] Found ${matchingProducts.length} matching products for ${window.myCompany}`);

          if (matchingProducts.length === 0) {
            productCellDiv.innerHTML = '<div class="no-products">–</div>';
          } else {
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
                // Generate a unique ID with the pe_ prefix (product explorer)
                const peIndexKey = 'pe_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                
                // IMPORTANT: Clone the product completely
                const enhancedProduct = { ...product };
                
                // 1. Make sure it has the _plaIndex property
                enhancedProduct._plaIndex = peIndexKey;
                
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
                window.globalRows[peIndexKey] = enhancedProduct;
                console.log(`[DEBUG] Added product to globalRows[${peIndexKey}] with ${enhancedProduct.historical_data.length} real historical records`);
                
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
                console.error("[renderProductExplorerTable] Error rendering product:", error);
                console.error("[renderProductExplorerTable] Problem product:", JSON.stringify(product));
              }
            });
            
            // Then process inactive products with the same detailed logic
            inactiveProducts.forEach((product, productIndex) => {
              try {
                // Generate a unique ID with the pe_ prefix (product explorer)
                const peIndexKey = 'pe_inactive_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                
                // IMPORTANT: Clone the product completely
                const enhancedProduct = { ...product };
                
                // 1. Make sure it has the _plaIndex property
                enhancedProduct._plaIndex = peIndexKey;
                
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
                
                // Calculate position and trend (same logic as active products)
                if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
                  let latestDate = null;
                  enhancedProduct.historical_data.forEach(item => {
                    if (item.date && item.date.value) {
                      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                      if (latestDate === null || itemDate.isAfter(latestDate)) {
                        latestDate = itemDate.clone();
                      }
                    }
                  });
                
                  if (!latestDate) {
                    enhancedProduct.finalPosition = "-";
                    enhancedProduct.finalSlope = "";
                    enhancedProduct.arrow = "";
                    enhancedProduct.posBadgeBackground = "gray";
                  } else {
                    const endDate = latestDate.clone();
                    const startDate = endDate.clone().subtract(6, 'days');
                    
                    const prevEndDate = startDate.clone().subtract(1, 'days');
                    const prevStartDate = prevEndDate.clone().subtract(6, 'days');
                    
                    const currentPeriodData = enhancedProduct.historical_data.filter(item => {
                      if (!item.date || !item.date.value || !item.avg_position) return false;
                      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                      return itemDate.isBetween(startDate, endDate, 'day', '[]');
                    });
                    
                    const prevPeriodData = enhancedProduct.historical_data.filter(item => {
                      if (!item.date || !item.date.value || !item.avg_position) return false;
                      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                      return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
                    });
                    
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
                    
                    let slope = 0;
                    if (currentAvgPos > 0 && prevAvgPos > 0) {
                      slope = currentAvgPos - prevAvgPos;
                    }
                    
                    if (currentAvgPos > 0) {
                      const formattedPos = currentAvgPos.toFixed(1).replace(/\.0$/, '');
                      enhancedProduct.finalPosition = formattedPos;
                      
                      if (slope !== 0) {
                        if (slope > 0) {
                          enhancedProduct.arrow = "▼";
                          enhancedProduct.posBadgeBackground = "red";
                        } else {
                          enhancedProduct.arrow = "▲";
                          enhancedProduct.posBadgeBackground = "green";
                        }
                        
                        const slopeAbs = Math.abs(slope).toFixed(1).replace(/\.0$/, '');
                        enhancedProduct.finalSlope = slope < 0 ? slopeAbs : `-${slopeAbs}`;
                      } else {
                        enhancedProduct.arrow = "";
                        enhancedProduct.finalSlope = "";
                        enhancedProduct.posBadgeBackground = "gray";
                      }
                    } else {
                      enhancedProduct.finalPosition = "-";
                      enhancedProduct.finalSlope = "";
                      enhancedProduct.arrow = "";
                      enhancedProduct.posBadgeBackground = "gray";
                    }
                  }
                } else {
                  enhancedProduct.finalPosition = "-";
                  enhancedProduct.finalSlope = "";
                  enhancedProduct.arrow = "";
                  enhancedProduct.posBadgeBackground = "gray";
                }
            
                // Calculate visibility for the 7-day period
                let visibilityBarValue = 0;
                if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0 && latestDate) {
                  const endDate = latestDate.clone();
                  const startDate = endDate.clone().subtract(6, 'days');
                  const periodDays = 7;
                  
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
                  
                  let avgDailyVis = sum / periodDays;
                  visibilityBarValue = Math.round(avgDailyVis * 100);
                }
                enhancedProduct.visibilityBarValue = visibilityBarValue || 0;
                
                // 5. Most importantly: Add this FULLY enhanced product to globalRows
                window.globalRows[peIndexKey] = enhancedProduct;
                console.log(`[DEBUG] Added inactive product to globalRows[${peIndexKey}] with ${enhancedProduct.historical_data.length} real historical records`);
                
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
                console.error("[renderProductExplorerTable] Error rendering inactive product:", error);
                console.error("[renderProductExplorerTable] Problem product:", JSON.stringify(product));
              }
            });

            // Sort products by position value (best to worst)
            const sortByPosition = (a, b) => {
              const posA = parseFloat(a.finalPosition) || 999;
              const posB = parseFloat(b.finalPosition) || 999;
              return posA - posB;
            };

            // Sort active and inactive products separately
            const sortedActiveProducts = [...activeProducts].sort(sortByPosition);
            const sortedInactiveProducts = [...inactiveProducts].sort(sortByPosition);

            // Clear the container first
            chartProductsDiv.innerHTML = '';

            // Add active products
            sortedActiveProducts.forEach((product, index) => {
              // First, ensure this product has the enhanced data from globalRows
              let enhancedProduct = null;
              const globalRowsKeys = Object.keys(window.globalRows);
              for (const key of globalRowsKeys) {
                const globalProduct = window.globalRows[key];
                if (globalProduct && 
                    globalProduct.title === product.title && 
                    globalProduct.source === product.source &&
                    globalProduct.q === product.q &&
                    globalProduct.location_requested === product.location_requested &&
                    globalProduct.device === product.device) {
                  enhancedProduct = globalProduct;
                  break;
                }
              }
              
              // Use enhanced product if found, otherwise use original
              const productToUse = enhancedProduct || product;
              
              const smallCard = document.createElement('div');
              smallCard.classList.add('small-ad-details');
              smallCard.setAttribute('data-product-index', index);
              
              // Get position and trend values from the enhanced product
              const posValue = productToUse.finalPosition || '-';
              const trendArrow = productToUse.arrow || '';
              const trendValue = productToUse.finalSlope || '';
              const badgeColor = productToUse.posBadgeBackground || 'gray';
              
              // Create the HTML for small card
              const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
              const title = productToUse.title || 'No title';
              
              smallCard.innerHTML = `
                <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
                  <div class="small-ad-pos-value">${posValue}</div>
                  <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
                </div>
                <img class="small-ad-image" 
                     src="${imageUrl}" 
                     alt="${title}"
                     onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
                <div class="small-ad-title">${title}</div>
              `;
              
              // Store enhanced product reference for chart
              smallCard.productData = productToUse;
              smallCard.productArrayIndex = index; // Store the original index for chart reference
              
              chartProductsDiv.appendChild(smallCard);
            });

            // Add separator for inactive products if they exist
            if (sortedInactiveProducts.length > 0) {
              const separator = document.createElement('div');
              separator.style.width = '100%';
              separator.style.padding = '8px';
              separator.style.textAlign = 'center';
              separator.style.fontSize = '12px';
              separator.style.color = '#666';
              separator.style.backgroundColor = '#f0f0f0';
              separator.style.borderTop = '1px solid #ddd';
              separator.style.borderBottom = '1px solid #ddd';
              separator.style.marginTop = '5px';
              separator.style.marginBottom = '5px';
              separator.innerHTML = '— Inactive Products —';
              chartProductsDiv.appendChild(separator);
              
              // Add inactive products
              sortedInactiveProducts.forEach((product, index) => {
                // Same enhanced product logic as above
                let enhancedProduct = null;
                const globalRowsKeys = Object.keys(window.globalRows);
                for (const key of globalRowsKeys) {
                  const globalProduct = window.globalRows[key];
                  if (globalProduct && 
                      globalProduct.title === product.title && 
                      globalProduct.source === product.source &&
                      globalProduct.q === product.q &&
                      globalProduct.location_requested === product.location_requested &&
                      globalProduct.device === product.device) {
                    enhancedProduct = globalProduct;
                    break;
                  }
                }
                
                const productToUse = enhancedProduct || product;
                
                const smallCard = document.createElement('div');
                smallCard.classList.add('small-ad-details');
                smallCard.classList.add('inactive');
                smallCard.setAttribute('data-product-index', sortedActiveProducts.length + index);
                
                const posValue = productToUse.finalPosition || '-';
                const trendArrow = productToUse.arrow || '';
                const trendValue = productToUse.finalSlope || '';
                const badgeColor = productToUse.posBadgeBackground || 'gray';
                
                const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
                const title = productToUse.title || 'No title';
                
                smallCard.innerHTML = `
                  <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
                    <div class="small-ad-pos-value">${posValue}</div>
                    <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
                  </div>
                  <img class="small-ad-image" 
                       src="${imageUrl}" 
                       alt="${title}"
                       onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
                  <div class="small-ad-title">${title}</div>
                `;
                
                smallCard.productData = productToUse;
                smallCard.productArrayIndex = sortedActiveProducts.length + index;
                
                chartProductsDiv.appendChild(smallCard);
              });
            }

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
                
                // Open product explorer details panel
                openProductExplorerDetailsPanel(adCard, rowData, false);
                
                return false;
              }, true);
            });

            // Add this right after adding products to window.globalRows 
            console.log("[DEBUG] Product Explorer - globalRows keys:", Object.keys(window.globalRows || {}));
            console.log("[DEBUG] Product Explorer - First few globalRows entries:", 
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
                  console.warn("[renderProductExplorerTable] ApexCharts not available for visibility badges");
                }
              });
            }, 100);
          }
        } else {
          productCellDiv.textContent = "No product data available";
          console.warn("[renderProductExplorerTable] allRows data not available");
        }
        
        tr.appendChild(tdProducts);
        tbody.appendChild(tr);
      });
    });
  });

  container.querySelector("#productExplorerContainer").appendChild(table);
  console.log("[renderProductExplorerTable] Table rendering complete");
  
  // Add a resize observer to ensure product cells maintain proper width after DOM updates
  setTimeout(() => {
    const productCells = document.querySelectorAll('.product-cell');
    console.log(`[renderProductExplorerTable] Found ${productCells.length} product cells to observe`);
    
    if (window.ResizeObserver) {
      const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          console.log(`[renderProductExplorerTable] Product cell resized to ${width}px`);
          
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
    
    // Setup click handlers for product cards
    console.log("[DEBUG] Using custom click handlers for product explorer items");
  }, 200);
}

// Function to open details panel for product explorer
function openProductExplorerDetailsPanel(clickedEl, rowData, isFullscreen) {
  // Create or get the panel container
  let detailsPanel = document.getElementById('product-explorer-details-panel');
  if (!detailsPanel) {
    detailsPanel = document.createElement('div');
    detailsPanel.id = 'product-explorer-details-panel';
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
    contentWrapper.id = 'explorer-panel-content-wrapper';
    contentWrapper.style.position = 'relative';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    detailsPanel.appendChild(contentWrapper);
    document.body.appendChild(detailsPanel);
  }

  // Adjust panel positioning based on fullscreen state
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
  let contentWrapper = document.getElementById('explorer-panel-content-wrapper');
  if (!contentWrapper) {
    contentWrapper = document.createElement('div');
    contentWrapper.id = 'explorer-panel-content-wrapper';
    contentWrapper.style.position = 'relative';
    contentWrapper.style.width = '100%';
    contentWrapper.style.height = '100%';
    detailsPanel.appendChild(contentWrapper);
  }
  
  // Show the loading overlay
  let loadingOverlay = document.getElementById('explorer-panel-loading-overlay');
  if (!loadingOverlay) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'explorer-panel-loading-overlay';
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
  
  // Render with React component
  setTimeout(() => {
    try {
      // Get date range with 7-day override for product explorer
      let dateRange = getDataRange(rowData);
      if (dateRange && dateRange.end) {
        dateRange = {
          end: dateRange.end.clone(),
          start: dateRange.end.clone().subtract(6, "days") // 7 days including end date
        };
      }
      console.log(`[DEBUG] Date range: start=${dateRange.start.format('YYYY-MM-DD')}, end=${dateRange.end.format('YYYY-MM-DD')}`);
      
      // Create a copy of rowData to pass to the component
      const rowDataCopy = { ...rowData };
      
      // Get the content wrapper again to ensure it exists
      const contentWrapper = document.getElementById('explorer-panel-content-wrapper');
      
      // Render into the content wrapper
      ReactDOM.render(
        React.createElement(window.DetailsPanel, {
          key: rowData._plaIndex,
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
      const loadingOverlay = document.getElementById('explorer-panel-loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
      
    } catch (error) {
      console.error("[DEBUG] Error rendering explorer panel:", error);
      detailsPanel.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3>Error displaying product details</h3>
          <p>${error.message}</p>
          <pre style="text-align:left; max-height:200px; overflow:auto;">${error.stack}</pre>
          <button onclick="document.getElementById('product-explorer-details-panel').style.display='none';">
            Close
          </button>
        </div>
      `;
    }
  }, 100);
}

// Function to render average position chart for product explorer
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
  window.openProductExplorerDetailsPanel = openProductExplorerDetailsPanel;
  window.renderAvgPositionChartExplorer = renderAvgPositionChartExplorer;
  window.updateChartLineVisibilityExplorer = updateChartLineVisibilityExplorer;
}
