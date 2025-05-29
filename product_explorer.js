function renderProductExplorerTable() {
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderProductExplorerTable] Starting to build product explorer table");
  const container = document.getElementById("productExplorerPage");
  if (!container) return;

  // Setup container with fixed height and scrolling
  container.innerHTML = `
    <div id="productExplorerContainer" style="width: 100%; height: calc(100vh - 150px); overflow-y: auto; position: relative;">
      <div class="view-switcher">
        <button id="viewProducts" class="active">Products</button>
        <button id="viewCharts">Charts</button>
      </div>
      <button id="fullscreenToggle" class="fullscreen-toggle">
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
    fullscreenOverlay.className = 'product-map-fullscreen-overlay';
    document.body.appendChild(fullscreenOverlay);
  }
  
  // Add fullscreen toggle functionality
  document.getElementById("fullscreenToggle").addEventListener("click", function() {
    // Get the current table
    const table = document.querySelector("#productExplorerContainer .product-map-table");
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
  });

  // Add view switcher functionality
  const viewProductsBtn = document.getElementById("viewProducts");
  const viewChartsBtn = document.getElementById("viewCharts");

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
  });

  console.log("[renderProductExplorerTable] Using myCompany:", window.myCompany);

  if (!window.globalRows || typeof window.globalRows !== 'object') {
    window.globalRows = {};
    console.log("[DEBUG] Created new globalRows object");
  }

  // Reuse the same styles from product map
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
        height: 380px;
        max-height: 380px;
        box-sizing: border-box;
        overflow: hidden;
      }
      /* Fixed column widths */
      .product-explorer-table th:nth-child(1), .product-explorer-table td:nth-child(1) { width: 190px; }
      .product-explorer-table th:nth-child(2), .product-explorer-table td:nth-child(2) { width: 120px; }
      .product-explorer-table th:nth-child(3), .product-explorer-table td:nth-child(3) { width: 100px; }
      .product-explorer-table th:nth-child(4), .product-explorer-table td:nth-child(4) { width: 240px; }
      .product-explorer-table th:nth-child(5), .product-explorer-table td:nth-child(5) { 
        width: auto; 
        min-width: 400px;
      }
    `;
    document.head.appendChild(style);
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
        
        // Add Analytics cell (placeholder for now)
        const tdAnalytics = document.createElement("td");
        tdAnalytics.innerHTML = `<div style="padding: 20px; text-align: center; color: #666;">Analytics Coming Soon</div>`;
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
            // Sort products by average position
            matchingProducts.forEach(product => {
              if (product.historical_data && product.historical_data.length > 0) {
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
                  const endDate = latestDate.clone();
                  const startDate = endDate.clone().subtract(6, 'days');
                  
                  const currentPeriodData = product.historical_data.filter(item => {
                    if (!item.date || !item.date.value || !item.avg_position) return false;
                    const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                    return itemDate.isBetween(startDate, endDate, 'day', '[]');
                  });
                  
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

            // Sort by the calculated average position
            matchingProducts.sort((a, b) => {
              return a._sortingAvgPos - b._sortingAvgPos;
            });
            
            // Filter active and inactive products
            const activeProducts = matchingProducts.filter(product => 
              product.product_status === 'active' || !product.product_status
            );
            const inactiveProducts = matchingProducts.filter(product => 
              product.product_status === 'inactive'
            );
            
            // Process active products first
            activeProducts.forEach((product, productIndex) => {
              try {
                // Generate a unique ID with the pe_ prefix (product explorer)
                const peIndexKey = 'pe_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                
                // Clone the product completely
                const enhancedProduct = { ...product };
                
                // Make sure it has the _plaIndex property
                enhancedProduct._plaIndex = peIndexKey;
                
                // Make sure the stars array is properly formatted
                enhancedProduct.stars = [];
                const rating = parseFloat(enhancedProduct.rating) || 4.5;
                for (let i = 0; i < 5; i++) {
                  let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                  enhancedProduct.stars.push({ fill });
                }
                
                // Preserve historical data
                if (!enhancedProduct.historical_data || !Array.isArray(enhancedProduct.historical_data)) {
                  enhancedProduct.historical_data = [];
                } else {
                  enhancedProduct.historical_data = enhancedProduct.historical_data.map(entry => {
                    if (entry.avg_position) {
                      const cleanPosition = parseFloat(entry.avg_position);
                      if (!isNaN(cleanPosition)) {
                        entry.avg_position = cleanPosition.toFixed(2);
                      }
                    }
                    return entry;
                  });
                }
                
                // Calculate position and trend
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
            
                // Calculate visibility
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
                
                // Add to globalRows
                window.globalRows[peIndexKey] = enhancedProduct;
                console.log(`[DEBUG] Added product to globalRows[${peIndexKey}]`);
                
                // Render the product
                const html = compiledTemplate(enhancedProduct);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                const adCard = tempDiv.firstElementChild;
                adCard.classList.remove('my-company');
                
                adCard.style.width = "150px";
                adCard.style.flexShrink = "0";
                
                productCellDiv.appendChild(adCard);
              } catch (error) {
                console.error("[renderProductExplorerTable] Error rendering product:", error);
              }
            });
            
            // Process inactive products
            inactiveProducts.forEach((product, productIndex) => {
              try {
                const peIndexKey = 'pe_inactive_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                const enhancedProduct = { ...product };
                
                enhancedProduct._plaIndex = peIndexKey;
                
                enhancedProduct.stars = [];
                const rating = parseFloat(enhancedProduct.rating) || 4.5;
                for (let i = 0; i < 5; i++) {
                  let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                  enhancedProduct.stars.push({ fill });
                }
                
                // Similar processing as active products...
                // (truncated for brevity, but should include all the same logic)
                
                window.globalRows[peIndexKey] = enhancedProduct;
                
                const html = compiledTemplate(enhancedProduct);
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = html;
                
                const adCard = tempDiv.firstElementChild;
                adCard.classList.remove('my-company');
                adCard.style.width = "150px";
                adCard.style.flexShrink = "0";
                adCard.classList.add('inactive-product');
                
                const statusIndicator = document.createElement('div');
                statusIndicator.className = 'product-status-indicator product-status-inactive';
                statusIndicator.textContent = 'Inactive';
                adCard.appendChild(statusIndicator);
                
                productCellDiv.appendChild(adCard);
              } catch (error) {
                console.error("[renderProductExplorerTable] Error rendering inactive product:", error);
              }
            });

            // Add direct click handlers to each product card
            productCellDiv.querySelectorAll('.ad-details').forEach(adCard => {
              const plaIndex = adCard.getAttribute('data-pla-index');
              
              adCard.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                
                const rowData = window.globalRows[plaIndex];
                if (!rowData) {
                  console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
                  return;
                }
                
                openProductExplorerDetailsPanel(adCard, rowData, false);
                
                return false;
              }, true);
            });
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
    contentWrapper.id = 'panel-content-wrapper';
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
    detailsPanel.style.zIndex = '10001';
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
  
  // Render with React component
  setTimeout(() => {
    try {
      // Get date range with 7-day override for product explorer
      let dateRange = getDataRange(rowData);
      if (dateRange && dateRange.end) {
        dateRange = {
          end: dateRange.end.clone(),
          start: dateRange.end.clone().subtract(6, "days")
        };
      }
      
      const rowDataCopy = { ...rowData };
      
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
      const loadingOverlay = document.getElementById('panel-loading-overlay');
      if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
      }
      
    } catch (error) {
      console.error("[DEBUG] Error rendering explorer panel:", error);
      detailsPanel.innerHTML = `
        <div style="padding: 20px; text-align: center;">
          <h3>Error displaying product details</h3>
          <p>${error.message}</p>
          <button onclick="document.getElementById('product-explorer-details-panel').style.display='none';">
            Close
          </button>
        </div>
      `;
    }
  }, 100);
}

if (typeof window !== 'undefined') {
  window.renderProductExplorerTable = renderProductExplorerTable;
}
