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
      console.log("Received", rows.length, "rows");
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
  console.log(
    "[DEBUG] ▶ populateHomePage() called with:",
    "\n   myCompany =", window.myCompany,
    "\n   companyStatsData.length =", window.companyStatsData?.length,
    "\n   marketTrendsData.length =", window.marketTrendsData?.length
  );

  // 1) Figure out which “company” we want to see on the Home Page
  const st = window.filterState;
  let targetCompany = "";
  if (window.myCompany && window.myCompany.trim()) {
    targetCompany = window.myCompany.trim();
  } else if (st.company && st.company.trim()) {
    targetCompany = st.company.trim();
  } else {
    targetCompany = "Under Armour"; // fallback name if no global “myCompany”
  }
  window.filterState.company = targetCompany;
  document.getElementById("companyText").textContent = targetCompany;

  // 2) Ensure mapHelpers is loaded
  if (!window.mapHelpers || typeof window.mapHelpers.drawUsMapWithLocations !== "function") {
    console.warn("mapsLib.js not loaded yet. Retrying in 500ms.");
    setTimeout(populateHomePage, 500);
    return;
  }

  // 3) Clear out the #locList container
  const locListContainer = document.getElementById("locList");
  locListContainer.innerHTML = "";
  locListContainer.style.maxHeight = "1000px";
  locListContainer.style.overflowY = "auto";

  // 4) Build the “homeData” array for this company
  //    (Your “buildHomeData” presumably returns an array with .location, .device,
  //     .avgRank, .avgShare, .trendVal, plus dayMap or last30 arrays.)
  window.homeData = buildHomeData(targetCompany);
  if (!homeData.length) {
    const noDataP = document.createElement("p");
    noDataP.textContent = "No data to display on the Home container.";
    locListContainer.appendChild(noDataP);
    return;
  }

  // 5) Find the single global max date among all homeData
  //    (Requires you have a helper, e.g. findGlobalMaxDate(homeData).)
  const globalMaxDate = findGlobalMaxDate(homeData);
  if (!globalMaxDate) {
    const noDatesP = document.createElement("p");
    noDatesP.textContent = "No valid dates in homeData.";
    locListContainer.appendChild(noDatesP);
    return;
  }

  // 6) Build an array of the past 30 days from that global max date (newest first).
  const dateArray = [];
  for (let i = 0; i < 30; i++) {
    dateArray.push(
      globalMaxDate.clone().subtract(i, "days").format("YYYY-MM-DD")
    );
  }
  // dateArray[0] = newest date, dateArray[29] = oldest in that 30-day window

  // 7) Group homeData by location
  const locMap = {};
  homeData.forEach(item => {
    if (!locMap[item.location]) {
      locMap[item.location] = [];
    }
    locMap[item.location].push(item);
  });

  // 8) Create a single table with columns:
  //    [Location | Device | AvgRank | Mkt Share | Trend | Rank & Share History]
  const wrapper = document.createElement("div");
  wrapper.style.maxWidth = "1250px";
  wrapper.style.marginLeft = "20px";
  wrapper.style.backgroundColor = "#fff";
  wrapper.style.borderRadius = "8px";
  wrapper.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)";
  wrapper.style.marginBottom = "10px";
  wrapper.style.padding = "10px";

  const bigTable = document.createElement("table");
  bigTable.classList.add("home-table");
  bigTable.style.borderCollapse = "collapse";
  bigTable.style.width = "100%";

  bigTable.innerHTML = `
    <thead>
      <tr style="height: 30px;">
        <th style="width:220px;">Location</th>
        <th style="width:120px;">Device</th>
        <th style="width:120px;">Avg Rank</th>
        <th style="width:120px;">Market Share</th>
        <th style="width:120px;">Trend</th>
        <th style="width:500px;">Rank &amp; Market Share History</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const bigTbody = bigTable.querySelector("tbody");

  // 9) For each location => sort the device rows so that “desktop” is first, then “mobile”
  Object.keys(locMap).forEach(locName => {
    const rowArr = locMap[locName];

    // Sort: desktop first
    rowArr.sort((a, b) => {
      const ad = a.device.toLowerCase();
      const bd = b.device.toLowerCase();
      if (ad === "desktop" && bd !== "desktop") return -1;
      if (bd === "desktop" && ad !== "desktop") return 1;
      return 0;
    });

    // Then build one table row per device
    const rowSpanCount = rowArr.length;

    // Split the location name into two lines
    const parts = locName.split(",");
    const line1 = parts[0] ? parts[0].trim() : "";
    const line2 = parts.slice(1).map(x => x.trim()).join(", ");

    rowArr.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.style.height = "50px";

      // Light gray background for mobile rows
      if (item.device.toLowerCase() === "mobile") {
        tr.style.backgroundColor = "#f8f8f8";
      }

      // (A) The first row => show the big “Location” cell with rowSpan
      if (idx === 0) {
        const tdLoc = document.createElement("td");
        tdLoc.rowSpan = rowSpanCount;
        tdLoc.style.verticalAlign = "middle";
        tdLoc.style.paddingLeft = "20px";
        tdLoc.innerHTML = `
          <div style="font-size:28px; font-weight:bold; margin-bottom:4px;">${line1}</div>
          <div style="font-size:14px;">${line2}</div>
        `;
        tr.appendChild(tdLoc);
      }

      // (B) Device cell
      const tdDevice = document.createElement("td");
      tdDevice.style.verticalAlign = "middle";
      tdDevice.textContent = item.device;
      tr.appendChild(tdDevice);

      // (C) Avg Rank cell
      const tdRank = document.createElement("td");
      tdRank.style.verticalAlign = "middle";
      {
        const rankVal = item.avgRank.toFixed(2);
        let rankHTML = `<div style="font-size: 18px; font-weight: bold;">${rankVal}</div>`;
        if (item.rankChange != null) {
          let arrow = "±", color = "#444";
          if (item.rankChange < 0) {
            arrow = "▲"; color = "green";
          } else if (item.rankChange > 0) {
            arrow = "▼"; color = "red";
          }
          rankHTML += `
            <div style="font-size: 12px; color:${color};">
              ${arrow} ${Math.abs(item.rankChange).toFixed(2)}
            </div>
          `;
        }
        tdRank.innerHTML = rankHTML;
      }
      tr.appendChild(tdRank);

      // (D) Market Share cell (bar)
      const tdShare = document.createElement("td");
      tdShare.style.verticalAlign = "middle";
      {
        const sharePct = item.avgShare.toFixed(1);
        // color the bar if share is negative or positive
        let barColor = (item.trendVal < 0) ? "red" : "#007aff";
        tdShare.innerHTML = `
          <div class="ms-bar-container"
               style="position: relative; width: 100px; height: 25px; background: #eee;
                      border-radius: 4px; overflow: hidden;">
            <div class="ms-bar-filled"
                 style="position: absolute; top: 0; left: 0; bottom: 0;
                        width: ${sharePct}%; background: ${barColor};">
            </div>
            <div class="ms-bar-label"
                 style="position: absolute; left: 8px; top: 0; bottom: 0;
                        display: flex; align-items: center; font-size: 13px; color: #000;">
              ${sharePct}%
            </div>
          </div>
        `;
      }
      tr.appendChild(tdShare);

      // (E) Trend cell
      const tdTrend = document.createElement("td");
      tdTrend.style.verticalAlign = "middle";
      {
        let arrow = "±", color = "#333";
        if (item.trendVal > 0) {
          arrow = "▲"; color = "green";
        } else if (item.trendVal < 0) {
          arrow = "▼"; color = "red";
        }
        tdTrend.innerHTML = `
          <span style="color:${color}; font-weight:bold;">
            ${arrow} ${Math.abs(item.trendVal).toFixed(2)}%
          </span>
        `;
      }
      tr.appendChild(tdTrend);

      // (F) Rank & Market Share History => we loop over dateArray
      const tdHistory = document.createElement("td");
      tdHistory.style.verticalAlign = "middle";
      tdHistory.style.width = "480px";

      // Create a scrollable container for the 2 rows (rank + share)
      const histContainer = document.createElement("div");
      histContainer.style.width = "480px";
      histContainer.style.overflowX = "auto";
      histContainer.style.whiteSpace = "nowrap";
      histContainer.style.display = "flex";
      histContainer.style.flexDirection = "column";
      histContainer.style.gap = "4px";

      // Two sub-rows
      const rankRowDiv  = document.createElement("div");
      rankRowDiv.style.display = "inline-block";
      rankRowDiv.style.whiteSpace = "nowrap";

      const shareRowDiv = document.createElement("div");
      shareRowDiv.style.display = "inline-block";
      shareRowDiv.style.whiteSpace = "nowrap";

      // IMPORTANT: we rely on “item.dayMap[dateStr] = { r:..., s:... }” from part (b)
      // If you named them differently, adjust below.
      dateArray.forEach((ds) => {
        // 1) rank
        let rVal = 40; // missing => 40 => means “no data”
        if (item.dayMap && item.dayMap[ds] && item.dayMap[ds].r != null) {
          rVal = item.dayMap[ds].r;
        }

        // Create a rank box
        const rankBox = document.createElement("div");
        rankBox.style.display      = "inline-block";
        rankBox.style.width        = "38px";
        rankBox.style.height       = "38px";
        rankBox.style.lineHeight   = "38px";
        rankBox.style.textAlign    = "center";
        rankBox.style.fontWeight   = "bold";
        rankBox.style.marginRight  = "4px";
        rankBox.style.borderRadius = "4px";
        rankBox.style.color        = "#000";

        if (rVal === 40) {
          // empty => grey box
          rankBox.style.backgroundColor = "#ccc";
          rankBox.textContent = "";
        } else if (rVal <= 1) {
          rankBox.style.backgroundColor = "#dfffd6"; // greenish
          rankBox.textContent = rVal;
        } else if (rVal <= 3) {
          rankBox.style.backgroundColor = "#fffac2"; // yellowish
          rankBox.textContent = rVal;
        } else if (rVal <= 5) {
          rankBox.style.backgroundColor = "#ffe0bd"; // orangeish
          rankBox.textContent = rVal;
        } else {
          // rank>5 => mild pink
          rankBox.style.backgroundColor = "#ffcfcf";
          rankBox.textContent = rVal;
        }
        rankRowDiv.appendChild(rankBox);

        // 2) market share
        let sVal = 0;
        if (item.dayMap && item.dayMap[ds] && item.dayMap[ds].s != null) {
          sVal = item.dayMap[ds].s;
        }
        const fillPct = Math.min(100, Math.max(0, sVal));
        const shareBox = document.createElement("div");
        shareBox.style.display      = "inline-block";
        shareBox.style.position     = "relative";
        shareBox.style.width        = "38px";
        shareBox.style.height       = "38px";
        shareBox.style.background   = "#ddd";
        shareBox.style.borderRadius = "4px";
        shareBox.style.marginRight  = "4px";
        shareBox.style.overflow     = "hidden";

        const fillDiv = document.createElement("div");
        fillDiv.style.position       = "absolute";
        fillDiv.style.left           = "0";
        fillDiv.style.bottom         = "0";
        fillDiv.style.width          = "100%";
        fillDiv.style.height         = fillPct + "%";
        fillDiv.style.backgroundColor= "#007aff";

        const labelSpan = document.createElement("span");
        labelSpan.style.position     = "relative";
        labelSpan.style.zIndex       = "2";
        labelSpan.style.display      = "inline-block";
        labelSpan.style.width        = "100%";
        labelSpan.style.textAlign    = "center";
        labelSpan.style.fontWeight   = "bold";
        labelSpan.style.fontSize     = "12px";
        labelSpan.style.lineHeight   = "38px";
        labelSpan.style.color        = "#333";
        labelSpan.textContent        = sVal.toFixed(0) + "%";

        shareBox.appendChild(fillDiv);
        shareBox.appendChild(labelSpan);
        shareRowDiv.appendChild(shareBox);
      });

      // Append sub-rows
      histContainer.appendChild(rankRowDiv);
      histContainer.appendChild(shareRowDiv);

      tdHistory.appendChild(histContainer);
      tr.appendChild(tdHistory);

      bigTbody.appendChild(tr);
    });
  });

  wrapper.appendChild(bigTable);
  locListContainer.appendChild(wrapper);

  // 10) Now update the info block (avg rank, location counts, etc.)
  updateInfoBlock();

  // 11) Show/hide rank or share rows if toggles are used
  updateHistoryRows();

  // 12) Finally, re-draw the map with up-to-date data
  const mapData = buildHomeDataForMap(); // your function that returns { searches: [...] }
  window.mapHelpers.drawUsMapWithLocations(mapData, "#locMap");
}

function findGlobalMaxDate(homeDataArray) {
  let maxD = null;
  homeDataArray.forEach(item => {
    // item.endDate was previously set to each row’s last date
    // Instead, loop over item.historical_data to find the true max date
    if (Array.isArray(item.historical_data)) {
      item.historical_data.forEach(dayObj => {
        if (dayObj.date && dayObj.date.value) {
          const d = moment(dayObj.date.value, "YYYY-MM-DD");
          if (!maxD || d.isAfter(maxD)) {
            maxD = d.clone();
          }
        }
      });
    }
  });
  return maxD;
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

function buildHomeData(targetCompany) {
  const allRows = buildProjectData(); // Get all rows
  const filtered = allRows.filter(row => {
    return row.source && row.source.toLowerCase() === targetCompany.toLowerCase();
  });

  const homeData = [];

  filtered.forEach(row => {
    if (!row.historical_data || !row.historical_data.length) {
      return; // Skip if no historical data
    }

    const dayMap = {};  // date => { r: rank, s: share }
    let rankSum = 0;
    let shareSum = 0;
    let count = 0;

    row.historical_data.forEach(hd => {
      if (!hd.date || !hd.date.value) return;
      const d = hd.date.value;
      const r = hd.rank != null ? hd.rank : 40;
      const s = hd.market_share != null ? (hd.market_share * 100) : 0;

      dayMap[d] = { r, s };

      if (r !== 40) {
        rankSum += r;
        count++;
      }
      shareSum += s;
    });

    if (count === 0) count = 1; // Avoid division by 0

    // Calculate average rank and share
    const avgRank = rankSum / count;
    const avgShare = shareSum / row.historical_data.length;
    
    homeData.push({
      location: row.location_requested || row.location_used || "Unknown",
      device: row.device || "desktop",
      avgRank: avgRank,
      avgShare: avgShare,
      trendVal: 0,  // Will calculate later if needed
      dayMap: dayMap,
      historical_data: row.historical_data,  // needed for findGlobalMaxDate
    });
  });

  return homeData;
}

  function buildHomeDataForMap() {
    const fallbackCo = (window.filterState.company || "Under Armour").trim();
const raw = buildHomeData(fallbackCo);
  
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
