/* app-logic.js */

// 1) Global variables
Chart.register(window["ChartDataLabels"]);

let projectData = [];
let loadingCount = 0;
  let panelAnimating = false;
  window.filterState = {
    searchTerm:     "",  // from searchTerm dropdown
    engine:         "",  // from engine dropdown
    device:         "",  // from device dropdown
    location:       "",  // from location dropdown
    company:        "",  // from company selector
    serpSegments:   "",  // from serpSegments dropdown
    period:         "7d", // from periodToggle
    dateRange: {
      start: moment().subtract(6, 'days'), 
      end:   moment(),
    },
    visibilityRange: { min: 0, max: 100 },  // from the slider
    avgPosRange:     { min: 1, max: 40 },   // from the slider
  };
  window.localEmbedToggles = {};
let db = null;
    const DB_NAME = "myReportsDB";
    const DB_VERSION = 1;
    const STORE_NAME = "projects";
    let dataLoaded = false;
    let embedToken = null;
    let savedActiveTab = 1;
    let companySearchInput;
    let companyLiAll;
    let mainDateRange = {
        start: moment().subtract(6, 'days'), // default to last 7 days
        end: moment()
      };  
  window.initialVisibilityRangeSet = false;
window.initialAvgPosRangeSet = false;
  let visibilityFilterRange = { min: 0, max: 1 };
  let avgPosFilterRange = { min: 1, max: 40 };  
    let titleColumnWidth = 200;
    let selectedPeriod = "7d";
    let currentlyOpenPanel = null;
    let currentlyRowEndIndex = null;
    let currentlySelectedIndex = null;
    let cachedRows = [];
  window.serpSegmentMapping = {
    "top3":     { share: "top3_market_share", prod: "top3_avg_products", showSale: false },
    "top4-8":   { share: "top4_8_market_share", prod: "top4_8_avg_products", showSale: false },
    "top9-14":  { share: "top9_14_market_share", prod: "top9_14_avg_products", showSale: false },
    "below14":  { share: "below14_market_share", prod: "below14_avg_products", showSale: false },
    "top8":     { share: "top8_market_share", prod: "top8_avg_products", showSale: false },
    "below8":   { share: "below8_market_share", prod: "below8_avg_products", showSale: false },
    "top40":    { share: "market_share", prod: "avg_products", showSale: false }
  }; 

/* IndexedDB Logic */

    (function initIndexedDB() {
      const openRequest = indexedDB.open(DB_NAME, DB_VERSION);
      openRequest.onerror = (event) => {
        console.error("IndexedDB open error:", event.target.error);
      };
      openRequest.onsuccess = (event) => {
        db = event.target.result;
      };
      openRequest.onupgradeneeded = (event) => {
        db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "key" });
        }
      };
    })();

    async function waitForDB() {
      return new Promise((resolve) => {
        if (db) {
          resolve();
        } else {
          const interval = setInterval(() => {
            if (db) {
              clearInterval(interval);
              resolve();
            }
          }, 100);
        }
      });
    }

    function getDataFromIDB(key) {
      return new Promise((resolve) => {
        if (!db) return resolve(null);
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      });
    }

    function setDataInIDB(key, data) {
      return new Promise((resolve) => {
        if (!db) return resolve(false);
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);
        const record = { key, data, savedAt: Date.now() };
        const req = store.put(record);
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    }

/* All the big logic that transforms or filters data, calculates metrics, etc */

      // Global helper to apply all active filters
      function applyAllFilters(rows) {
        const st = window.filterState;
        let filtered = rows.slice();     
        if (st.searchTerm) {
          filtered = filtered.filter(r => r.q === st.searchTerm);
        }
      
        if (st.engine) {
          filtered = filtered.filter(r => r.engine === st.engine);
        }
      
        if (st.device) {
          filtered = filtered.filter(r => r.device === st.device);
        }
      
        if (st.location) {
          filtered = filtered.filter(r => r.location_requested === st.location);
        }
        if (st.company) {
            filtered = filtered.filter(r => (r.source || '').toLowerCase() === st.company.toLowerCase());
          }                                       
        return filtered;
      }
      
      // 3A) Visibility Filter
function applyVisibilityFilter(baseData, minVal, maxVal) {
  return baseData.filter(r => {
    const visVal = r.visibilityBarValue || 0;
    return (visVal >= minVal && visVal <= maxVal);
  });
}

// 3B) Avg Pos Filter
function applyAvgPosFilter(baseData, minVal, maxVal) {
    // Compute the global last date for all products in the current filtered set.
    // (getGlobalMaxDate should return a moment() object representing the latest date.)
    const globalLastDate = getGlobalMaxDate(baseData);
    if (!globalLastDate) return [];
    
    // Determine the window length based on the selected period toggle.
    let periodDays = 30; // default if "30d" is selected
    if (selectedPeriod === "3d") {
      periodDays = 3;
    } else if (selectedPeriod === "7d") {
      periodDays = 7;
    }
    // Define the window start date using the global last date.
    const windowStart = globalLastDate.clone().subtract(periodDays - 1, "days");
  
    return baseData.filter(r => {
      // If there’s no historical data, filter out this product.
      if (!r.historical_data || !r.historical_data.length) return false;
      
      // Select only those historical records that fall between windowStart and globalLastDate.
      const windowRecords = r.historical_data.filter(item => {
        const d = moment(item.date.value, "YYYY-MM-DD");
        return d.isBetween(windowStart, globalLastDate, "day", "[]");
      });
      
      // If any of these records has an avg_position within the chosen range, keep the product.
      return windowRecords.some(item => {
        const pos = parseFloat(item.avg_position);
        return pos >= minVal && pos <= maxVal;
      });
    });
  }

  function applyAvgPosFilterPreviousPeriod(baseData, minVal, maxVal) {
    const globalLastDate = getGlobalMaxDate(baseData);
    if (!globalLastDate) return [];
  
    // Determine period length based on selectedPeriod
    let periodDays = 30; // default fallback
    if (selectedPeriod === "3d")  periodDays = 3;
    else if (selectedPeriod === "7d") periodDays = 7;
    else if (selectedPeriod === "30d") periodDays = 30;
  
    // For the current window, the start is:
    const currentStart = globalLastDate.clone().subtract(periodDays - 1, "days");
    // The previous window immediately precedes current window:
    const previousEnd = currentStart.clone().subtract(1, "days");
    const previousStart = previousEnd.clone().subtract(periodDays - 1, "days");
  
    return baseData.filter(r => {
      if (!r.historical_data || !r.historical_data.length) return false;
      // Get records from the previous period
      const prevRecords = r.historical_data.filter(item => {
        const d = moment(item.date.value, "YYYY-MM-DD");
        return d.isBetween(previousStart, previousEnd, "day", "[]");
      });
      // Check if any record meets the avg_position criteria for the segment
      return prevRecords.some(item => {
        const pos = parseFloat(item.avg_position);
        return pos >= minVal && pos <= maxVal;
      });
    });
  }  

// 3C) Company Filter
function applyCompanyFilter(baseData, companyName) {
  if (!companyName) return baseData;
  return baseData.filter(r => r.source === companyName);
}

// 3D) Date Range / Period Filter (example stub)
function applyDateRangeFilter(baseData, startDate, endDate) {
    const filtered = baseData.filter(r => {
      if (!r.historical_data) return false;
      return r.historical_data.some(h => {
        const d = moment(h.date.value, "YYYY-MM-DD");
        return d.isBetween(startDate, endDate, null, "[]");
      });
    });
    return filtered;
  }

function autoPickDefaultFirstGroup(allRows) {
    if (window.filterState.searchTerm) {
        return;
      }
      
    if (!allRows || !allRows.length) {
      return; // No data, do nothing
    }
  
    // 1) SEARCH TERM
    const searchCounts = {};
    allRows.forEach(r => {
      const val = r.q || "";
      if (!searchCounts[val]) searchCounts[val] = 0;
      searchCounts[val]++;
    });
    // Convert to array and sort by freq descending
    const searchArr = Object.keys(searchCounts).map(k=>({ name:k, count:searchCounts[k]}));
    searchArr.sort((a,b)=> b.count - a.count);
    if (searchArr.length>0) {
      // The top searchTerm
      window.filterState.searchTerm = searchArr[0].name;
      document.getElementById("searchTermValue").textContent = searchArr[0].name;
    } else {
      // no searchTerm found => bail
      return;
    }
  
    // applyAllFilters with that searchTerm
    let subset = applyAllFilters(allRows);
  
    // 2) ENGINE
    if (!subset.length) {
      // if nothing matched that top searchTerm, bail
      return;
    }
    const engineCounts = {};
    subset.forEach(r => {
      const val = r.engine || "";
      if (!engineCounts[val]) engineCounts[val] = 0;
      engineCounts[val]++;
    });
    const engineArr = Object.keys(engineCounts).map(k=>({ name:k, count:engineCounts[k]}));
    engineArr.sort((a,b)=> b.count - a.count);
    if (engineArr.length>0) {
      window.filterState.engine = engineArr[0].name;
      document.getElementById("engineOptionsRow").textContent = engineArr[0].name;
      subset = applyAllFilters(allRows); // re-filter with new engine
    }
  
    // 3) DEVICE
    if (!subset.length) return;
    const deviceCounts = {};
    subset.forEach(r => {
      const val = r.device || "";
      if (!deviceCounts[val]) deviceCounts[val] = 0;
      deviceCounts[val]++;
    });
    const deviceArr = Object.keys(deviceCounts).map(k=>({ name:k, count:deviceCounts[k]}));
    deviceArr.sort((a,b)=> b.count - a.count);
    if (deviceArr.length>0) {
      window.filterState.device = deviceArr[0].name;
        const deviceFilterContainer = document.getElementById("deviceFilter");
  if (deviceFilterContainer) {
    deviceFilterContainer.querySelectorAll(".toggle-option").forEach(option => {
      option.classList.remove("active");  // Clear any existing active classes
      if (option.getAttribute("data-device").toLowerCase() === deviceArr[0].name.toLowerCase()) {
        option.classList.add("active");  // Mark the matching toggle as active
      }
    });
  }
      /*document.getElementById("deviceOptionsRow").textContent = deviceArr[0].name;*/
      subset = applyAllFilters(allRows); // re-filter with new device
    }
  
    // 4) LOCATION
    if (!subset.length) return;
    const locationCounts = {};
    subset.forEach(r => {
      const val = r.location_requested || "";
      if (!locationCounts[val]) locationCounts[val] = 0;
      locationCounts[val]++;
    });
    const locationArr = Object.keys(locationCounts).map(k=>({ name:k, count:locationCounts[k]}));
    locationArr.sort((a,b)=> b.count - a.count);
    if (locationArr.length>0) {
      window.filterState.location = locationArr[0].name;
      document.getElementById("locationText").textContent = locationArr[0].name;
      subset = applyAllFilters(allRows); // re-filter with new location
    }
  
    // At this point, filterState.searchTerm, engine, device, location are set
    // and we've updated subset. That subset is your final "default" subset.
  } 

/* specialized helper logic */

    // Called once we receive rows from parent or IDB
    function onReceivedRows(rows) {
        // Process your data
        window.allRows = rows;
        updateSearchTermDropdown(rows);
        updateEngineDropdown(rows);
        /*updateDeviceDropdown(rows);*/
        updateLocationDropdown(rows);
        autoPickDefaultFirstGroup(rows);
        renderData();
        updateCompanyDropdown(window.filteredData);
      
        // Set home page visible and hide main content.
        document.getElementById("homePage").style.display = "block";
        document.getElementById("main").style.display = "none";
      
        // Now fire the home-button click event.
        document.getElementById("homeButton").click();
      } 

    function pickRandomValidTuple(rows) {
        if (!rows || !rows.length) return;
        // pick a random row from the entire dataset
        const randomRow = rows[Math.floor(Math.random() * rows.length)];
        // set filterState from that row
        window.filterState.searchTerm = randomRow.q || "";
        window.filterState.engine = randomRow.engine || "";
        window.filterState.device = randomRow.device || "";
        window.filterState.location = randomRow.location_requested || "";
        // optionally update your UI labels
        document.getElementById("searchTermValue").textContent = randomRow.q || "";
        document.getElementById("engineOptionsRow").textContent = randomRow.engine || "";
        document.getElementById("deviceOptionsRow").textContent = randomRow.device || "";
        document.getElementById("locationText").textContent = randomRow.location_requested || "";
      }; 

function populateHomePage() {
  // 1) Make sure the map helpers are loaded
  if (!window.mapHelpers || typeof window.mapHelpers.drawUsMapWithLocations !== 'function') {
    console.warn("mapsLib.js not loaded yet. Retrying in 500ms.");
    setTimeout(populateHomePage, 500);
    return;
  }

  // 2) Clear and prep the #locList container
  const locListContainer = document.getElementById("locList");
  locListContainer.innerHTML = "";
  locListContainer.style.maxHeight = "1000px";
  locListContainer.style.overflowY = "auto";

  // 3) Optionally add a heading if you want
  const heading = document.createElement("h2");
  heading.textContent = "All Locations (Single Table)";
  locListContainer.appendChild(heading);

  // 4) Figure out which company to show on the home page
  const st = window.filterState;
  const targetCompany = st.company && st.company.trim() 
    ? st.company.trim()
    : "Under Armour";  // fallback
  window.filterState.company = targetCompany;
  document.getElementById("companyText").textContent = targetCompany;

  // 5) Build the homeData array for that company
  window.homeData = buildHomeData(targetCompany);
  if (!homeData.length) {
    const noDataP = document.createElement("p");
    noDataP.textContent = "No data to display for Home container.";
    locListContainer.appendChild(noDataP);
    return;
  }

  // 6) Group homeData by location
  const locMap = {};
  homeData.forEach(item => {
    if (!locMap[item.location]) {
      locMap[item.location] = [];
    }
    locMap[item.location].push(item);
  });

  // 7) Create ONE wrapper and ONE table for all locations
  const allLocationsWrapper = document.createElement("div");
  allLocationsWrapper.style.width = "100%";
  allLocationsWrapper.style.background = "#fff";
  allLocationsWrapper.style.borderRadius = "8px";
  allLocationsWrapper.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)";
  allLocationsWrapper.style.padding = "10px";

  const bigTable = document.createElement("table");
  bigTable.classList.add("home-table");
  bigTable.style.borderCollapse = "collapse";
  bigTable.style.width = "100%";

  // Build the table header (6 columns total)
  bigTable.innerHTML = `
    <thead>
      <tr style="height: 30px;">
        <th style="width:220px;">Location</th>
        <th style="width:120px;">Device</th>
        <th style="width:120px;">Avg Rank</th>
        <th style="width:120px;">Market Share</th>
        <th style="width:120px;">Trend</th>
        <th style="width:480px;">Rank &amp; Market Share History</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const bigTbody = bigTable.querySelector("tbody");

  // 8) For each location -> for each device entry, build one row
  Object.keys(locMap).forEach(locName => {
    const rowArr = locMap[locName]; // all data objects for this location

    rowArr.forEach(data => {
      const tr = document.createElement("tr");
      tr.style.height = "50px";

      // (A) LOCATION cell
      const tdLoc = document.createElement("td");
      tdLoc.style.fontWeight = "bold";
      tdLoc.style.fontSize   = "16px";
      tdLoc.textContent      = locName;
      tr.appendChild(tdLoc);

      // (B) DEVICE cell
      const tdDevice = document.createElement("td");
      tdDevice.textContent = data.device;
      tr.appendChild(tdDevice);

      // (C) AVG RANK cell
      const tdRank = document.createElement("td");
      // (Same logic as you had before)
      // For example:
      const rankVal = data.avgRank.toFixed(2);
      let rankHTML = `<div style="font-size: 18px; font-weight: bold;">${rankVal}</div>`;
      if (data.rankChange != null) {
        let arrow = "±", color = "#444";
        if (data.rankChange < 0) {
          arrow = "▲"; color = "green";
        } else if (data.rankChange > 0) {
          arrow = "▼"; color = "red";
        }
        rankHTML += `<div style="font-size: 12px; color:${color};">${arrow} ${Math.abs(data.rankChange).toFixed(2)}</div>`;
      }
      tdRank.innerHTML = rankHTML;
      tr.appendChild(tdRank);

      // (D) MARKET SHARE cell
      const tdShare = document.createElement("td");
      const sharePct = data.avgShare.toFixed(1);
      let barColor = (data.trendVal < 0) ? "red" : "#007aff";
      tdShare.innerHTML = `
        <div class="ms-bar-container"
             style="position: relative; width: 100px; height: 25px; background: #eee; border-radius: 4px; overflow: hidden;">
          <div class="ms-bar-filled"
               style="position:absolute; top:0; left:0; bottom:0; width:${sharePct}%; background:${barColor};">
          </div>
          <div class="ms-bar-label"
               style="position:absolute; left:8px; top:0; bottom:0; display:flex; align-items:center; font-size:13px; color:#000;">
            ${sharePct}%
          </div>
        </div>
      `;
      tr.appendChild(tdShare);

      // (E) TREND cell
      const tdTrend = document.createElement("td");
      let arrow = "±", color = "#333";
      if (data.trendVal > 0) {
        arrow = "▲"; color = "green";
      } else if (data.trendVal < 0) {
        arrow = "▼"; color = "red";
      }
      tdTrend.innerHTML = `<span style="color:${color}; font-weight:bold;">${arrow} ${Math.abs(data.trendVal).toFixed(2)}%</span>`;
      tr.appendChild(tdTrend);

      // (F) RANK & SHARE HISTORY (the “boxes”)
      const tdHistory = document.createElement("td");
      const histContainer = document.createElement("div");
      histContainer.style.width = "480px";
      histContainer.style.overflowX = "auto";
      histContainer.style.display = "flex";
      histContainer.style.flexDirection = "column";

      // RANK row
      const rankRowDiv = document.createElement("div");
      rankRowDiv.style.display = "inline-flex";
      rankRowDiv.classList.add("history-rank-row");
      rankRowDiv.style.flexWrap = "nowrap";
      rankRowDiv.style.marginBottom = "4px";

      // Prepare date array for tooltips (30 days from data.endDate)
      const endDateMoment = moment(data.endDate, "YYYY-MM-DD");
      const dateArray = [];
      for (let i = 0; i < 30; i++) {
        dateArray.push(endDateMoment.clone().subtract(i, "days").format("YYYY-MM-DD"));
      }

      // Render rank boxes (in reverse order)
      data.last30ranks.slice().reverse().forEach((rVal, idx) => {
        const box = document.createElement("div");
        box.style.width = "38px";
        box.style.height = "38px";
        box.style.lineHeight = "38px";
        box.style.textAlign = "center";
        box.style.fontWeight = "bold";
        box.style.marginRight = "4px";
        box.style.borderRadius = "4px";

        // Color rank box
        let bgColor = "#ffcfcf"; // default "range-red"
        if (rVal <= 1) {
          bgColor = "#dfffd6";
        } else if (rVal <= 3) {
          bgColor = "#fffac2";
        } else if (rVal <= 5) {
          bgColor = "#ffe0bd";
        }
        box.style.backgroundColor = bgColor;
        box.style.color = "#000";
        box.textContent = (rVal === 40) ? "" : rVal;
        box.setAttribute("title", dateArray[idx]); // tooltip
        rankRowDiv.appendChild(box);
      });

      // SHARE row
      const shareRowDiv = document.createElement("div");
      shareRowDiv.style.display = "inline-flex";
      shareRowDiv.classList.add("history-share-row");
      shareRowDiv.style.flexWrap = "nowrap";

      data.last30shares.slice().reverse().forEach((sVal, idx) => {
        const fillPct = Math.min(100, Math.max(0, sVal));
        const shareBox = document.createElement("div");
        shareBox.style.position = "relative";
        shareBox.style.width = "38px";
        shareBox.style.height = "38px";
        shareBox.style.backgroundColor = "#ddd";
        shareBox.style.borderRadius = "4px";
        shareBox.style.marginRight = "4px";
        shareBox.style.overflow = "hidden";

        const fillDiv = document.createElement("div");
        fillDiv.style.position = "absolute";
        fillDiv.style.left = "0";
        fillDiv.style.bottom = "0";
        fillDiv.style.width = "100%";
        fillDiv.style.height = fillPct + "%";
        fillDiv.style.backgroundColor = "#007aff";

        const labelSpan = document.createElement("span");
        labelSpan.style.position = "relative";
        labelSpan.style.zIndex = "2";
        labelSpan.style.display = "inline-block";
        labelSpan.style.width = "100%";
        labelSpan.style.textAlign = "center";
        labelSpan.style.fontWeight = "bold";
        labelSpan.style.fontSize = "12px";
        labelSpan.style.lineHeight = "38px";
        labelSpan.style.color = "#333";
        labelSpan.textContent = sVal.toFixed(0) + "%";

        shareBox.appendChild(fillDiv);
        shareBox.appendChild(labelSpan);
        shareBox.setAttribute("title", dateArray[idx]);
        shareRowDiv.appendChild(shareBox);
      });

      histContainer.appendChild(rankRowDiv);
      histContainer.appendChild(shareRowDiv);
      tdHistory.appendChild(histContainer);
      tr.appendChild(tdHistory);

      bigTbody.appendChild(tr);
    });
  });

  // 9) Append the table into #locList
  allLocationsWrapper.appendChild(bigTable);
  locListContainer.appendChild(allLocationsWrapper);

  // 10) Call the existing “infoBlock” + “historyRows” logic
  updateInfoBlock();
  updateHistoryRows();

  // 11) Draw the map as before
  const mapData = buildHomeDataForMap();
  window.mapHelpers.drawUsMapWithLocations(mapData, "#locMap");
}

    function updateHomeMapMetrics() {
        const mapToggle = document.getElementById("toggleMap");
        const mapWrapper = document.getElementById("mapInfoWrapper");
        if (mapToggle && mapWrapper) {
          if (!mapToggle.checked) {
            mapWrapper.classList.add("hidden-map");
          } else {
            mapWrapper.classList.remove("hidden-map");
          }
        }

        // Get the original map data from your existing function.
        const originalMapData = buildHomeDataForMap();
        // Create a copy of the searches array.
        const newSearches = originalMapData.searches.map(item => Object.assign({}, item));
        
        // Read the current state of the home page toggles.
        const desktopShare = document.getElementById("toggleDesktopShare")?.checked;
        const desktopRank  = document.getElementById("toggleDesktopRank")?.checked;
        const mobileShare  = document.getElementById("toggleMobileShare")?.checked;
        const mobileRank   = document.getElementById("toggleMobileRank")?.checked;
        
        // For each search item, if it’s desktop or mobile, adjust its values based on toggles.
        newSearches.forEach(item => {
            if (item.device.toLowerCase().includes("desktop")) {
                item.hideShare = !desktopShare;  // mark that we want to hide the pie values
                item.hideRank  = !desktopRank;
              } else if (item.device.toLowerCase().includes("mobile")) {
                item.hideShare = !mobileShare;
                item.hideRank  = !mobileRank;
              }              
        });
        
        // Redraw the US map using the modified data.
        window.mapHelpers.drawUsMapWithLocations({ searches: newSearches }, "#locMap");     
        
        // After the map is drawn (allowing a short delay), remove the rank boxes
        // for any device that has hideRank set to true.
        // After a short delay to ensure the map is drawn…
        // Wait a moment after the map is drawn.
        setTimeout(() => {
            // If the desktop market share toggle is off, remove desktop share-pie groups:
            if (!desktopShare) {
              d3.selectAll("g.loc-group[data-device*='desktop'] .share-pie-group").remove();
            }
            // If the mobile market share toggle is off, remove mobile share-pie groups:
            if (!mobileShare) {
              d3.selectAll("g.loc-group[data-device*='mobile'] .share-pie-group").remove();
            }
            // If the desktop rank toggle is off, remove desktop rank box groups:
            if (!desktopRank) {
              d3.selectAll("g.loc-group[data-device*='desktop'] .rank-box-group").remove();
            }
            // If the mobile rank toggle is off, remove mobile rank box groups:
            if (!mobileRank) {
              d3.selectAll("g.loc-group[data-device*='mobile'] .rank-box-group").remove();
            }
          }, 100);
      }

  function buildHomeDataForMap() {
    const raw = buildHomeData("Under Armour");  // or from filterState.company, etc.
  
    const arr = raw.map(item => {
      return {
        status: "active",
        location: item.location,
        device: item.device,
        shareVal: item.avgShare,
        computedAvgRank: item.avgRank
      };
    });
  return { searches: arr };
  }

  function updateHistoryRows() {
    const rankHistoryToggle = document.getElementById("toggleRankHistory");
    const shareHistoryToggle = document.getElementById("toggleMarketShareHistory");
  
    const rankChecked =
      (rankHistoryToggle && typeof rankHistoryToggle.checked === "boolean")
        ? rankHistoryToggle.checked
        : (window.localEmbedToggles["toggleRankHistory"] !== undefined
              ? window.localEmbedToggles["toggleRankHistory"]
              : true);
    const shareChecked =
      (shareHistoryToggle && typeof shareHistoryToggle.checked === "boolean")
        ? shareHistoryToggle.checked
        : (window.localEmbedToggles["toggleMarketShareHistory"] !== undefined
              ? window.localEmbedToggles["toggleMarketShareHistory"]
              : true);
  
    const rankDisplay = rankChecked ? "inline-flex" : "none";
    const shareDisplay = shareChecked ? "inline-flex" : "none";
  
    document.querySelectorAll(".history-rank-row").forEach(el => {
      el.style.display = rankDisplay;
    });
    document.querySelectorAll(".history-share-row").forEach(el => {
      el.style.display = shareDisplay;
    });
  }

/* All functions that do real-time data gathering and populate the dropdown lists */

      function updateSearchTermDropdown(rows) {
        // 1. Gather distinct q values and counts
        const qCounts = {};
        rows.forEach(r => {
          const qVal = r.q || "";
          if (!qCounts[qVal]) { qCounts[qVal] = 0; }
          qCounts[qVal]++;
        });
        // 2. Convert to array and sort descending by count
        const allQ = Object.keys(qCounts).map(qVal => ({ name: qVal, count: qCounts[qVal] }));
        allQ.sort((a, b) => b.count - a.count);       
      
        // 4. Get the dropdown element and clear previous content
        const dropdown = document.getElementById("searchTermDropdown");
        dropdown.innerHTML = "";
        
        // 5. Insert a search input box
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search term...";
        input.style.cssText = `
          display: block;
          width: 90%;
          margin: 8px auto;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;
        dropdown.appendChild(input);
        
        // 7. Helper to render the list items
        function renderQList(arr) {
          // Remove list items beyond input and liAll
          while (dropdown.childNodes.length > 2) {
            dropdown.removeChild(dropdown.lastChild);
          }
          arr.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} (${item.count})`;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                window.filterState.searchTerm = item.name;
              document.getElementById("searchTermValue").textContent = item.name;
              dropdown.style.display = "none";
              window.filterState.visibilityRange = { min: 0, max: 100 };
              const visSlider = document.querySelector('#visibilityRange');
              visSlider.value = { lower: 0, upper: 100 };
              document.getElementById("visibilityValueDisplay").textContent = "0 - 100";
              
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(li);
          });
        }
        
        // 8. Render the list and attach search handler
        renderQList(allQ);
        input.addEventListener("input", () => {
          const typed = input.value.toLowerCase();
          if (typed.length < 2) {
            renderQList(allQ);
          } else {
            const filtered = allQ.filter(x => x.name.toLowerCase().includes(typed));
            renderQList(filtered);
          }
        });
      }

    function updateEngineDropdown(rows) {
        // 1. Gather distinct engine values
        const engineCounts = {};
        rows.forEach(r => {
          const engineVal = r.engine || "";
          if (!engineCounts[engineVal]) { engineCounts[engineVal] = 0; }
          engineCounts[engineVal]++;
        });
        // 2. Build array and sort descending by count
        const allEngine = Object.keys(engineCounts).map(val => ({ name: val, count: engineCounts[val] }));
        allEngine.sort((a, b) => b.count - a.count);         
        
        // 4. Get dropdown element and clear it
        const dropdown = document.getElementById("engineDropdown");
        dropdown.innerHTML = "";
        
        // 5. Insert search input
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search engine...";
        input.style.cssText = `
          display: block;
          width: 90%;
          margin: 8px auto;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;
        dropdown.appendChild(input);
        
        // 7. Render list helper
        function renderEngineList(arr) {
          while (dropdown.childNodes.length > 2) { dropdown.removeChild(dropdown.lastChild); }
          arr.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} (${item.count})`;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                window.filterState.engine = item.name;
              document.getElementById("engineOptionsRow").textContent = item.name;
              dropdown.style.display = "none";
              window.filterState.visibilityRange = { min: 0, max: 100 };
              const visSlider = document.querySelector('#visibilityRange');
              visSlider.value = { lower: 0, upper: 100 };
              document.getElementById("visibilityValueDisplay").textContent = "0 - 100";
              
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(li);
          });
        }
        
        // 8. Initially render full list and attach search handler
        renderEngineList(allEngine);
        input.addEventListener("input", () => {
          const typed = input.value.toLowerCase();
          if (typed.length < 2) { renderEngineList(allEngine); }
          else {
            const filtered = allEngine.filter(item => item.name.toLowerCase().includes(typed));
            renderEngineList(filtered);
          }
        });
      }


    /*  function updateDeviceDropdown(rows) {
        const deviceCounts = {};
        rows.forEach(r => {
          const deviceVal = r.device || "";
          if (!deviceCounts[deviceVal]) { deviceCounts[deviceVal] = 0; }
          deviceCounts[deviceVal]++;
        });
        const allDevice = Object.keys(deviceCounts).map(val => ({ name: val, count: deviceCounts[val] }));
        allDevice.sort((a, b) => b.count - a.count);        
        
        const dropdown = document.getElementById("deviceDropdown");
        dropdown.innerHTML = "";
        
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search device...";
        input.style.cssText = `
          display: block;
          width: 90%;
          margin: 8px auto;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;
        dropdown.appendChild(input);
        
        function renderDeviceList(arr) {
          while (dropdown.childNodes.length > 2) { dropdown.removeChild(dropdown.lastChild); }
          arr.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} (${item.count})`;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                window.filterState.device = item.name;
              document.getElementById("deviceOptionsRow").textContent = item.name;
              dropdown.style.display = "none";
              window.filterState.visibilityRange = { min: 0, max: 100 };
              const visSlider = document.querySelector('#visibilityRange');
              visSlider.value = { lower: 0, upper: 100 };
              document.getElementById("visibilityValueDisplay").textContent = "0 - 100";
              
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(li);
          });
        }
        
        renderDeviceList(allDevice);
        input.addEventListener("input", () => {
          const typed = input.value.toLowerCase();
          if (typed.length < 2) { renderDeviceList(allDevice); }
          else {
            const filtered = allDevice.filter(item => item.name.toLowerCase().includes(typed));
            renderDeviceList(filtered);
          }
        });
      } */

      function updateLocationDropdown(rows) {
        const filteredRows = applyAllFilters(rows);
        const locationCounts = {};
        filteredRows.forEach(r => {
            const locVal = r.location_requested || "";
            if (!locationCounts[locVal]) { locationCounts[locVal] = 0; }
            locationCounts[locVal]++;
          });
        const allLocations = Object.keys(locationCounts).map(val => ({ name: val, count: locationCounts[val] }));
        allLocations.sort((a, b) => b.count - a.count);        
        
        const dropdown = document.getElementById("locationDropdown");
        dropdown.innerHTML = "";
        
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search location...";
        input.style.cssText = `
          display: block;
          width: 90%;
          margin: 8px auto;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;
        dropdown.appendChild(input);
        
        function renderLocationList(arr) {
          while (dropdown.childNodes.length > 2) { dropdown.removeChild(dropdown.lastChild); }
          arr.forEach(item => {
            const li = document.createElement("li");
            li.textContent = `${item.name} (${item.count})`;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                window.filterState.location = item.name;
              document.getElementById("locationText").textContent = item.name;
              dropdown.style.display = "none";
              window.filterState.visibilityRange = { min: 0, max: 100 };
              const visSlider = document.querySelector('#visibilityRange');
              visSlider.value = { lower: 0, upper: 100 };
              document.getElementById("visibilityValueDisplay").textContent = "0 - 100";
              
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(li);
          });
        }
        
        renderLocationList(allLocations);
        input.addEventListener("input", () => {
          const typed = input.value.toLowerCase();
          if (typed.length < 2) { renderLocationList(allLocations); }
          else {
            const filtered = allLocations.filter(item => item.name.toLowerCase().includes(typed));
            renderLocationList(filtered);
          }
        });
      } 

      function updateCompanyDropdown(filteredRows) {
        // 1) Build how many rows per company from 'filteredRows'
        const companyCounts = {};
        filteredRows.forEach(r => {
          const c = r.source || "";
          if (!companyCounts[c]) {
            companyCounts[c] = 0;
          }
          companyCounts[c]++;
        });
      
        // 2) Convert to array and sort descending by count
        const allCompanies = Object.keys(companyCounts).map(name => ({ 
          name, 
          count: companyCounts[name] 
        }));
        allCompanies.sort((a, b) => b.count - a.count);
        allCompanies.forEach(item => {
            item.displayName = item.name;                 // preserve the original
            item.name = item.name.trim().toLowerCase();   // for matching
          });
      
        // ----------------------------------------------------------------
        // 3) [FIX 1] SHORT-CIRCUIT IF MARKET_SHARE DATA NOT READY
        // ----------------------------------------------------------------
        // If window.companyStatsData is missing or not an array,
        // skip computeMarketShareData(...) to avoid .filter(...) crash
        if (!window.companyStatsData || !Array.isArray(window.companyStatsData)) {
          // Just show "Companies: N" in the header
          document.getElementById("companyText").textContent = 
            "Companies: " + allCompanies.length;
      
          // Render the dropdown with Name + (Count) only, no share%
          const dropdown = document.getElementById("companyDropdown");
      
          // Clear old content fully (or at least remove old <li>):
          dropdown.innerHTML = "";
      
          // If we haven't created the global search input, do it once
          if (!companySearchInput) {
            companySearchInput = document.createElement("input");
            companySearchInput.type = "text";
            companySearchInput.placeholder = "Search companies...";
            companySearchInput.style.cssText = `
              display: block;
              width: 90%;
              margin: 8px auto;
              padding: 6px 8px;
              border-radius: 6px;
              border: 1px solid #ccc;
              font-size: 14px;
            `;
            // Prevent clicks on the input from closing the dropdown
            companySearchInput.addEventListener("click", function(e) {
              e.stopPropagation();
            });
            dropdown.appendChild(companySearchInput);
          }
      
          // If we haven't created the "All Companies" li, do so
          if (!companyLiAll) {
            companyLiAll = document.createElement("li");
            companyLiAll.style.cursor = "pointer";
            companyLiAll.addEventListener("click", function() {
              // Clear filter
              window.filterState.company = "";
              if (companySearchInput) companySearchInput.value = "";
              document.getElementById("companyText").textContent = "Companies:";
              dropdown.style.display = "none";
              // re-render
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(companyLiAll);
          }
          // Update "All Companies" label
          companyLiAll.innerHTML = `<strong>All Companies</strong> (${filteredRows.length})`;
      
          // A helper to render just name + (count), no share
          function renderNoShareList(companiesArray) {
            // Remove old <li> beyond the first 2 nodes (the input + "All Companies")
            while (dropdown.childNodes.length > 2) {
              dropdown.removeChild(dropdown.lastChild);
            }
            companiesArray.forEach(item => {
              const li = document.createElement("li");
              li.style.cursor = "pointer";
              // Just name + count, no share
              li.textContent = `${item.name} (${item.count})`;
              li.addEventListener("click", () => {
                window.filterState.company = item.name;
                document.getElementById("companyText").textContent = item.name;
                document.getElementById("companyClear").style.display = "inline-block";
                dropdown.style.display = "none";
                // Clear search
                if (companySearchInput) {
                  companySearchInput.value = "";
                }
                renderData();
                updateCompanyDropdown(window.filteredData);
              });
              dropdown.appendChild(li);
            });
          }
      
          // Attach search input for no-share scenario
          companySearchInput.removeEventListener("input", onCompanySearchNoShare);
          function onCompanySearchNoShare() {
            const typed = this.value.toLowerCase();
            if (typed.length < 2) {
              renderNoShareList(allCompanies);
            } else {
              const filtered = allCompanies.filter(c =>
                c.name.toLowerCase().includes(typed)
              );
              renderNoShareList(filtered);
            }
          }
          companySearchInput.addEventListener("input", onCompanySearchNoShare);
      
          // Finally, show the default full list
          renderNoShareList(allCompanies);
      
          // Return so we do NOT call computeMarketShareData
          return;
        }
        // ----------------------------------------------------------------
        // 4) If marketShareData exists, do normal share logic
        // ----------------------------------------------------------------
        const unified = computeMarketShareData(window.companyStatsData, false);
        let shareMap = {};
        if (unified) {
          unified.companies.forEach((compName, i) => {
            shareMap[compName] = unified.marketShares[i];
          });
        }
      
        // Grab or create the dropdown
        const dropdown = document.getElementById("companyDropdown");
        if (!companySearchInput) {
          companySearchInput = document.createElement("input");
          companySearchInput.type = "text";
          companySearchInput.placeholder = "Search companies...";
          companySearchInput.style.cssText = `
            display: block;
            width: 90%;
            margin: 8px auto;
            padding: 6px 8px;
            border-radius: 6px;
            border: 1px solid #ccc;
            font-size: 14px;
          `;
          companySearchInput.addEventListener("click", function(e) {
            e.stopPropagation();
          });
          dropdown.appendChild(companySearchInput);
        }
        if (!companyLiAll) {
          companyLiAll = document.createElement("li");
          companyLiAll.style.cursor = "pointer";
          companyLiAll.addEventListener("click", function() {
            window.filterState.company = "";
            if (companySearchInput) companySearchInput.value = "";
            document.getElementById("companyText").textContent = "Companies:";
            dropdown.style.display = "none";
            renderData();
            updateCompanyDropdown(cachedRows);
          });
          dropdown.appendChild(companyLiAll);
        }
        companyLiAll.innerHTML = `<strong>All Companies</strong> (${filteredRows.length})`;
      
        // Helper to clear old <li> items and render with share
        function renderCompanyListWithShare(companiesArray) {
          while (dropdown.childNodes.length > 2) {
            dropdown.removeChild(dropdown.lastChild);
          }

          // 1) Build an array that includes each item’s shareVal
          let withShare = companiesArray.map(item => {
            const shareVal = shareMap[item.name] || 0;
            return { ...item, shareVal };
          });
          
          // 2) Sort descending by shareVal
          withShare.sort((a, b) => b.shareVal - a.shareVal);
          
          // 3) Now render the sorted array
            withShare.forEach(item => {
              const li = document.createElement("li");
              li.style.cursor = "pointer";
              const shareVal = item.shareVal;
      
            li.innerHTML = `
              <div style="display: flex; justify-content: space-between; width: 100%;">
                <span>${item.displayName || item.name} (${item.count})</span>
                <span style="margin-left: auto; text-align: right; width: 50px;">
                  ${shareVal.toFixed(2)}%
                </span>
              </div>
            `;
            li.addEventListener("click", () => {
              window.filterState.company = item.name;
              document.getElementById("companyText").textContent = item.name;
              document.getElementById("companyClear").style.display = "inline-block";
              dropdown.style.display = "none";
              if (companySearchInput) {
                companySearchInput.value = "";
              }
              renderData();
              updateCompanyDropdown(window.filteredData);
            });
            dropdown.appendChild(li);
          });
        }
      
        companySearchInput.removeEventListener("input", onCompanySearchInput);
        function onCompanySearchInput() {
          const typed = this.value.toLowerCase();
          if (typed.length < 2) {
            renderCompanyListWithShare(allCompanies);
          } else {
            const filtered = allCompanies.filter(c =>
              c.name.toLowerCase().includes(typed)
            );
            renderCompanyListWithShare(filtered);
          }
        }
        companySearchInput.addEventListener("input", onCompanySearchInput);
      
        // Finally, show the default full list with share
        renderCompanyListWithShare(allCompanies);
      }

      function createDropdownFilter({
        elementId,
        triggerElementId,
        data,
        filterStateKey,
        displayLabel
      }) {
        const dropdownEl = document.getElementById(elementId);
        const triggerEl  = document.getElementById(triggerElementId);
        if (!dropdownEl || !triggerEl) {
          console.warn("createDropdownFilter: missing elements for", elementId, triggerElementId);
          return;
        }
      
        // Clear out existing content
        dropdownEl.innerHTML = "";
      
        // 1) Create a search input
        const input = document.createElement("input");
        input.type = "text";
        input.placeholder = "Search...";
        input.style.cssText = `
          display: block;
          width: 90%;
          margin: 8px auto;
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 14px;
        `;
        dropdownEl.appendChild(input);
      
        // 2) A helper function to render the list items from the current data
        function renderList(arr) {
          // Remove any old <li> (beyond the search input)
          while (dropdownEl.childNodes.length > 1) {
            dropdownEl.removeChild(dropdownEl.lastChild);
          }
          // For each item, build an <li>
          arr.forEach(item => {
            const li = document.createElement("li");
            li.textContent = displayLabel(item);  // e.g. "Laptop (123)"
            li.style.cursor = "pointer";
            li.style.padding = "8px 12px";
            li.addEventListener("click", () => {
              // Update filterState
              window.filterState[filterStateKey] = item.value;
              // Show the selected value in the triggerEl UI if desired
              // e.g. if triggerEl has a child span for display:
              const textEl = triggerEl.querySelector(".apple-options-row") 
                          || triggerEl.querySelector(".apple-options-row, .loc-count, #locationText") 
                          || triggerEl; 
              if (textEl) {
                textEl.textContent = item.value; 
              }
              // Hide dropdown
              dropdownEl.style.display = "none";
              // Re-render
              renderData(window.cachedRows);
            });
            dropdownEl.appendChild(li);
          });
        }
      
        // 3) Initially show the full list
        renderList(data);
      
        // 4) Filter as user types
        input.addEventListener("input", () => {
          const typed = input.value.toLowerCase();
          if (typed.length < 2) {
            renderList(data);
          } else {
            const filtered = data.filter(x => x.value.toLowerCase().includes(typed));
            renderList(filtered);
          }
        });
      
        // 5) Toggle the dropdown when the user clicks the trigger
        triggerEl.addEventListener("click", function(e) {
          e.stopPropagation();
          // Position the dropdown near the triggerEl (your existing logic)
          // For example:
          if (dropdownEl.parentNode !== document.body) {
            document.body.appendChild(dropdownEl);
          }
          const rect = triggerEl.getBoundingClientRect();
          dropdownEl.style.position = "fixed";
          dropdownEl.style.top  = rect.bottom + "px";
          dropdownEl.style.left = rect.left   + "px";
          dropdownEl.style.zIndex = "999999";
      
          dropdownEl.style.display = (dropdownEl.style.display === "block") ? "none" : "block";
      
          if (dropdownEl.style.display === "block") {
            // Outside-click listener
            window._dropdownCloseHandler = (ev) => {
              if (!dropdownEl.contains(ev.target) && !triggerEl.contains(ev.target)) {
                dropdownEl.style.display = "none";
                document.removeEventListener("click", window._dropdownCloseHandler);
                window._dropdownCloseHandler = null;
              }
            };
            document.addEventListener("click", window._dropdownCloseHandler);
          } else {
            if (window._dropdownCloseHandler) {
              document.removeEventListener("click", window._dropdownCloseHandler);
              window._dropdownCloseHandler = null;
            }
          }
        });
      }

