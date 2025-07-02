// Global flags to prevent infinite loops
window._isLoadingProjectData = false;
window._projectLoadAttempts = {}; // Track attempts per project

function populateProjectPage() {
    // Prevent multiple simultaneous executions
    if (window._projectPageProcessing) {
        console.log("[populateProjectPage] Already processing, skipping duplicate call");
        return;
    }
    window._projectPageProcessing = true;
    
    try {
        logAvailableCompanies();
        // Log when the function is called
        console.log("[📊 POPULATEPROJECTPAGE] Called at:", new Date().toISOString());
        console.log("[📊 POPULATEPROJECTPAGE] Data state:", {
          companyStatsData: window.companyStatsData?.length || 0,
          projectData: window.projectData?.length || 0,
          myCompany: window.myCompany,
          frontendCompany: window.frontendCompany,
          dataPrefix: window.dataPrefix,
          activeProjectNumber: window.filterState?.activeProjectNumber
        });
  
// Check if data is available and load it if needed
  if (!window.companyStatsData || !Array.isArray(window.companyStatsData) || window.companyStatsData.length === 0) {
    console.warn("[populateProjectPage] No companyStatsData available, attempting to load data...");
    
    // Get the current project number
    const projectNumber = window.filterState?.activeProjectNumber || 1;
    const projectKey = `pr${projectNumber}`;
    
    // Initialize attempt counter for this project if not exists
    if (!window._projectLoadAttempts[projectKey]) {
      window._projectLoadAttempts[projectKey] = 0;
    }
    
    // Check if we've already tried too many times for this project
    if (window._projectLoadAttempts[projectKey] >= 3) {
      console.warn(`[populateProjectPage] Max attempts (3) reached for project ${projectNumber}. Stopping.`);
      
      // Hide loader
      const loader = document.getElementById("overlayLoader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { loader.style.display = "none"; }, 500);
      }
      
      // Show the "data not available" popup
      if (typeof showDatasetNotAvailablePopup === 'function') {
        showDatasetNotAvailablePopup();
      } else {
        // Fallback alert if the popup function isn't available
        alert("We collect the requested Data. The Data will be available during the next 24 hours.");
      }
      
      // Reset the counter after showing the message
      window._projectLoadAttempts[projectKey] = 0;
      return;
    }
    
    // Check if we're already loading data
    if (window._isLoadingProjectData) {
      console.warn("[populateProjectPage] Already loading project data, skipping duplicate call");
      return;
    }
    
    // Increment attempt counter
    window._projectLoadAttempts[projectKey]++;
    console.log(`[populateProjectPage] Load attempt ${window._projectLoadAttempts[projectKey]} for project ${projectNumber}`);
    
    // Set loading flag
    window._isLoadingProjectData = true;
    
    const prefix = window.dataPrefix || "acc1_pr1_";
    
    // Show loading indicator
    const loader = document.getElementById("overlayLoader");
    if (loader) {
      loader.style.display = "flex";
      loader.style.opacity = "1";
    }
    
// Call switchAccountAndReload to properly load the data
    switchAccountAndReload(prefix, projectNumber)
      .then(() => {
        console.log("[populateProjectPage] Successfully loaded data, now continuing with page population");
        
        // Reset flags
        window._isLoadingProjectData = false;
        
        // Hide loader
        if (loader) {
          loader.style.opacity = "0";
          setTimeout(() => { loader.style.display = "none"; }, 500);
        }
        
        // Check if data is now available
        if (window.companyStatsData && window.companyStatsData.length > 0) {
          // Reset attempt counter on success
          window._projectLoadAttempts[projectKey] = 0;
          
          // IMPORTANT: Ensure myCompany is set before continuing
          const isDemo = window.dataPrefix?.startsWith("demo_") || window._isDemoMode === true;
          if (!isDemo && !window.myCompany) {
            console.log("[populateProjectPage] Setting myCompany after data load");
            window.myCompany = window.frontendCompany || 
                               localStorage.getItem("my_company") || 
                               (window.companyStatsData?.[0]?.source) || 
                               "";
          }
          // Allow re-initialization with fresh data
window._projectPageInitialized = false;
          // Call populateProjectPage again now that data is loaded
          console.log("[populateProjectPage] Data loaded, calling populateProjectPage again");
          populateProjectPage();
        } else {
          console.error("[populateProjectPage] Data still not available after switchAccountAndReload");
          // The next call to populateProjectPage will increment the counter
          window._isLoadingProjectData = false;
          // Try again (this will be caught by the attempt counter)
          populateProjectPage();
        }
      })
      .catch(err => {
        console.error("[populateProjectPage] Failed to load data:", err);
        
        // Reset loading flag
        window._isLoadingProjectData = false;
        
        // Hide loader
        if (loader) {
          loader.style.opacity = "0";
          setTimeout(() => { loader.style.display = "none"; }, 500);
        }
        
        // Try again (this will be caught by the attempt counter)
        populateProjectPage();
      });
    
    return; // Exit early - we'll be called again after data loads or max attempts reached
  }
  
  // If we get here, data is available - reset attempt counter
  const projectNumber = window.filterState?.activeProjectNumber || 1;
  const projectKey = `pr${projectNumber}`;
  window._projectLoadAttempts[projectKey] = 0;

    // Main logic for handling the project page population
    console.log("[📊 POPULATEPROJECTPAGE] myCompany used:", window.myCompany);
    console.log("[POPULATEPROJECTPAGE] window.projectData =", window.projectData);
    console.log(
      "[POPULATEPROJECTPAGE] ▶ populateProjectPage() called with:",
      "\n   myCompany =", window.myCompany,
      "\n   companyStatsData.length =", window.companyStatsData?.length,
      "\n   marketTrendsData.length =", window.marketTrendsData?.length
    );

    console.group("[🧪 projectPage population diagnostics]");
    console.log("🚩 dataPrefix =", window.dataPrefix);
    console.log("🚩 activeProjectNumber =", window.filterState?.activeProjectNumber);
    console.log("🚩 projectTableData =", window.projectTableData);
    console.log("🚩 companyStatsData sample =", window.companyStatsData?.[0]);
    console.groupEnd();
  
    const activeProjectNumber = window.filterState?.activeProjectNumber || 1;
    const activeProject = (window.projectData || []).find(p => p.project_number === activeProjectNumber);
  
    if (!activeProject || !Array.isArray(activeProject.searches) || activeProject.searches.length === 0) {
      console.warn("[populateProjectPage] No searches for project:", activeProjectNumber);
  
      const infoBlock = document.querySelector("#projectPage #infoBlock");
      const locMap = document.querySelector("#projectPage #locMap");
      const locList = document.querySelector("#projectPage #locList");
  
      if (infoBlock) infoBlock.style.display = "none";
      if (locMap) locMap.style.display = "none";
      if (locList) {
        locList.innerHTML = `<p style="padding:20px; text-align:center; font-size:16px;">⚠️ No searches available for this project.</p>`;
        locList.style.display = "block";
      }
      return;
    } else {
      const infoBlock = document.querySelector("#projectPage #infoBlock");
      const locMap = document.querySelector("#projectPage #locMap");
      const locList = document.querySelector("#projectPage #locList");
  
      if (infoBlock) infoBlock.style.display = "block";
      if (locMap) locMap.style.display = "block";
      if (locList) locList.style.display = "block";
    }
  
    const st = window.filterState;
    let targetCompany = "";
    const isDemo = window.dataPrefix?.startsWith("demo_") || window._isDemoMode === true;
    if (isDemo) {
      // For DEMO account, use the hardcoded "Nike"
      targetCompany = "Nike";
    } else {
      // For Account 1, prioritize frontendCompany
      if (window.frontendCompany && window.frontendCompany.trim()) {
        targetCompany = window.frontendCompany.trim();
      } else if (window.myCompany && window.myCompany.trim()) {
        targetCompany = window.myCompany.trim();
      } else if (st.company && st.company.trim()) {
        targetCompany = st.company.trim();
      } else {
        // If all else fails, use a default value that exists in your data
        // Perhaps one of your most common companies from the logs
        targetCompany = "REI"; // Pick a company that actually exists in your data
        console.warn(`[populateProjectPage] No company specified. Defaulting to "${targetCompany}"`);
      }
    }

    window.filterState.company = targetCompany;
    document.getElementById("companyText").textContent = targetCompany;
  
    if (!window.mapHelpers || typeof window.mapHelpers.drawUsMapWithLocations !== "function") {
      /*console.warn("[populateProjectPage] mapsLib.js not loaded yet. Retrying in 500ms.");
      setTimeout(populateProjectPage, 500);
      return;*/
      console.log("[POPULATEPROJECTPAGE] Calling populateProjectPage in mapHelpers:", new Date().toISOString());
      populateProjectPage();
      return;
    }
  
    const locListContainer = document.querySelector("#projectPage #locList");
    locListContainer.innerHTML = "";
    locListContainer.style.maxHeight = "1000px";
    locListContainer.style.overflowY = "auto";
  
    // -----------------------------------------------
    // 1) Build project data
    function buildProjectData() {
      console.group("[🧪 buildProjectData]");
      console.log("→ window.companyStatsData.length =", window.companyStatsData?.length || 0);
      console.log("→ window.filterState.activeProjectNumber =", window.filterState?.activeProjectNumber);
      console.log("→ window.myCompany =", window.myCompany);
      console.log("→ window.frontendCompany =", window.frontendCompany);
    
      let run;
      if (!Array.isArray(window.companyStatsData)) {
        console.warn("[buildProjectData] No companyStatsData array found.");
        return [];
      }
    
      window.companyStatsData.forEach(row => {
        if (row.source == null) {
          row.source = window.myCompany || "Unknown";
        }
      });
    
      const activeProjectNumber = parseInt(window.filterState?.activeProjectNumber, 10);
      const isDemo = window.dataPrefix?.startsWith("demo_") || window._isDemoMode === true;
      let targetCompany;
      
      if (isDemo) {
        targetCompany = "nike"; // lowercase for comparison
        console.log("[buildProjectData] Using DEMO company: Nike");
      } else {
        // For Account 1, prioritize frontendCompany
        targetCompany = (window.frontendCompany || window.myCompany || "").trim().toLowerCase();
        console.log("[buildProjectData] Using real account company:", targetCompany);
      }
    
      const uniqueProjects = new Set(window.companyStatsData.map(r => r.project_number));
      console.log("[🧪 buildProjectData] Unique project_numbers found in companyStatsData:", [...uniqueProjects]);
      if (uniqueProjects.size > 1) {
        console.warn("[🚨] More than 1 project_number detected in companyStatsData. This may cause cross-project contamination.");
      }
    
      // Log project_number and company source for debugging
      window.companyStatsData.forEach(row => {
        console.log("→ row.project_number:", row.project_number);
      });
    
      // Log all available companies for debugging
      const availableCompanies = [...new Set(window.companyStatsData.map(r => r.source?.toLowerCase()))];
      console.log("[buildProjectData] Available companies:", availableCompanies);
    
      // Apply filter based on active project number and company with more flexible matching
      let filtered = window.companyStatsData.filter(row => {
        const rowProjNum = parseInt(row.project_number, 10);
        const rowCompany = (row.source || "").trim().toLowerCase();
        
        // More flexible matching options:
        return rowProjNum === activeProjectNumber && (
          rowCompany === targetCompany || 
          rowCompany.includes(targetCompany) || 
          targetCompany.includes(rowCompany)
        );
      });
    
      // If no matches found, fall back to showing all companies for this project
      if (!filtered.length) {
        console.warn(`[buildProjectData] No matches for company "${targetCompany}". Showing all companies for project ${activeProjectNumber}.`);
        filtered = window.companyStatsData.filter(row => 
          parseInt(row.project_number, 10) === activeProjectNumber
        );
        
        // Still no matches? Try a fallback company from your data
        if (!filtered.length && availableCompanies.length > 0) {
          const fallbackCompany = availableCompanies[0];
          console.warn(`[buildProjectData] No data for project ${activeProjectNumber}. Using fallback company: ${fallbackCompany}`);
          filtered = window.companyStatsData.filter(row => 
            (row.source || "").trim().toLowerCase() === fallbackCompany
          );
        }
      }
    
      console.log("→ Filtered rows:", filtered.length);
      console.log("→ First filtered row (if any):", filtered[0]);
    
      if (!filtered.length) return [];
    
      const globalMaxDate = findOverallMaxDateInCompanyStats(filtered);
      if (!globalMaxDate) {
        console.warn("[buildProjectData] No valid max date found.");
        return [];
      }
    
      const periodDays = (st.period === "3d") ? 3 : (st.period === "30d") ? 30 : 7;
      const end = globalMaxDate.clone();
      const start = end.clone().subtract(periodDays - 1, "days");
      const prevEnd = start.clone().subtract(1, "days");
      const prevStart = prevEnd.clone().subtract(periodDays - 1, "days");
    
      const groupingMap = {};
      filtered.forEach(row => {
        const sTerm = row.q || row.search || "(no term)";
        const loc = row.location_requested || "Unknown";
        const dev = row.device || "Unknown";
        const key = `${sTerm}||${loc}||${dev}`;
        if (!groupingMap[key]) groupingMap[key] = [];
        groupingMap[key].push(row);
      });
    
      const results = [];
      Object.keys(groupingMap).forEach(key => {
        const [theTerm, theLoc, theDev] = key.split("||");
        let mergedHist = [];
        groupingMap[key].forEach(r => {
          if (Array.isArray(r.historical_data)) {
            mergedHist = mergedHist.concat(r.historical_data);
          }
        });
        if (!mergedHist.length) return;
    
        const dayMap = {};
        mergedHist.forEach(obj => {
          if (obj.date?.value) {
            dayMap[obj.date.value] = {
              r: obj.rank != null ? parseFloat(obj.rank) : 40,
              s: obj.market_share != null ? parseFloat(obj.market_share) * 100 : 0
            };
          }
        });
    
        let sumRank = 0, countRank = 0;
        let run = start.clone();
        while (run.isSameOrBefore(end, "day")) {
          const ds = run.format("YYYY-MM-DD");
          if (dayMap[ds] && dayMap[ds].r != null) {
            sumRank += dayMap[ds].r;
            countRank++;
          }
          run.add(1, "days");
        }
        const avgRank = countRank ? (sumRank / countRank) : 40;
    
        let prevSumRank = 0, prevCountRank = 0;
        run = prevStart.clone();
        while (run.isSameOrBefore(prevEnd, "day")) {
          const ds = run.format("YYYY-MM-DD");
          if (dayMap[ds] && dayMap[ds].r != null) {
            prevSumRank += dayMap[ds].r;
            prevCountRank++;
          }
          run.add(1, "days");
        }
        const prevAvgRank = prevCountRank ? (prevSumRank / prevCountRank) : 40;
        const rankChange = avgRank - prevAvgRank;
    
        let sumShare = 0;
        run = start.clone();
        while (run.isSameOrBefore(end, "day")) {
          const ds = run.format("YYYY-MM-DD");
          sumShare += (dayMap[ds]?.s || 0);
          run.add(1, "days");
        }
        const avgShare = sumShare / periodDays;
    
        let prevSumShare = 0;
        run = prevStart.clone();
        while (run.isSameOrBefore(prevEnd, "day")) {
          const ds = run.format("YYYY-MM-DD");
          prevSumShare += (dayMap[ds]?.s || 0);
          run.add(1, "days");
        }
        const prevAvgShare = prevSumShare / periodDays;
        const trendVal = avgShare - prevAvgShare;
    
        const last30ranks = [];
        const last30shares = [];
        const start30 = end.clone().subtract(29, "days");
        run = start30.clone();
        while (run.isSameOrBefore(end, "day")) {
          const ds = run.format("YYYY-MM-DD");
          last30ranks.push(dayMap[ds]?.r ?? 40);
          last30shares.push(dayMap[ds]?.s ?? 0);
          run.add(1, "days");
        }
    
        results.push({
          searchTerm: theTerm,
          location: theLoc,
          device: theDev,
          avgRank,
          rankChange,
          avgShare,
          trendVal,
          last30ranks,
          last30shares,
          endDate: end.format("YYYY-MM-DD")
        });
    
        console.log("→ Final projectData row:", results[results.length - 1]);
        window.projectTableData = results;
        updateProjectInfoBlock();
        updateProjectMarketShareChart();
      });
    
      console.log("→ Returning", results.length, "project data rows.");
      console.groupEnd();
      return results;
    }    // end buildProjectData
  
    // ─────────────────────────────────────────────────────────────────────────
    // 2) Build the aggregated array
    // ─────────────────────────────────────────────────────────────────────────
    const projectData = buildProjectData(false);
    if (!projectData.length) {
      const noDataP = document.createElement("p");
      noDataP.textContent = "No data to display for Project container.";
      locListContainer.appendChild(noDataP);
      return;
    }
  
    // ─────────────────────────────────────────────────────────────────────────
    // 3) Convert projectData => nested structure: (searchTerm -> location -> [deviceRows])
    //    Then we’ll build the table with rowSpans for searchTerm & location
    // ─────────────────────────────────────────────────────────────────────────
    const nestedMap = {};
    projectData.forEach(item => {
      const t = item.searchTerm;
      const l = item.location;
      if (!nestedMap[t]) {
        nestedMap[t] = {};
      }
      if (!nestedMap[t][l]) {
        nestedMap[t][l] = [];
      }
      nestedMap[t][l].push(item);
    });
    // Sort each device array so that desktop is first
    Object.keys(nestedMap).forEach(term => {
      Object.keys(nestedMap[term]).forEach(loc => {
        nestedMap[term][loc].sort((a,b) => {
          const ad = a.device.toLowerCase();
          const bd = b.device.toLowerCase();
          if (ad==="desktop" && bd!=="desktop") return -1;
          if (bd==="desktop" && ad!=="desktop") return 1;
          return 0;
        });
      });
    });
  
    // ─────────────────────────────────────────────────────────────────────────
    // 4) Build the table
    //    Columns: [Search Term] [Location] [Device] [Avg Rank] [Market Share+Trend] [Rank & Share History]
    // ─────────────────────────────────────────────────────────────────────────
    const wrapper = document.createElement("div");
    wrapper.style.maxWidth = "1250px";
    wrapper.style.marginLeft = "20px";
    wrapper.style.backgroundColor = "#fff";
    wrapper.style.borderRadius = "8px";
    wrapper.style.boxShadow = "0 4px 8px rgba(0,0,0,0.08)";
    wrapper.style.marginBottom = "10px";
    wrapper.style.padding = "10px";
  
    const table = document.createElement("table");
    // style it similarly to your “home-table”
    table.classList.add("home-table", "project-table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
  
    // We add a toggle in the 6th column header to switch rank vs share
    table.innerHTML = `
      <thead>
        <tr style="height:30px;">
          <th style="width:180px;">Search Term</th>
          <th style="width:220px;">Location</th>
          <th style="width:100px;">Device</th>
          <th style="width:120px;">Avg Rank</th>
          <th style="width:140px;">Market Share &amp; Trend</th>
          <th style="width:400px; position:relative;">
            Rank &amp; Market Share History
            <!-- The small switch on the right side -->
            <label style="position:absolute; right:8px; top:3px; font-size:12px; user-select:none; cursor:pointer;">
              <input type="checkbox" id="historyToggle" style="vertical-align:middle; margin-right:4px;" />
              <span>Share</span>
            </label>
          </th>
        </tr>
      </thead>
      <tbody></tbody>
    `;
    const tbody = table.querySelector("tbody");
  
    // Collect all searchTerms sorted
    const searchTerms = Object.keys(nestedMap).sort();
    searchTerms.forEach(term => {
      const locObj = nestedMap[term];
      const allLocs = Object.keys(locObj).sort();
  
      // Count total device rows across all locations => rowSpan for the Search Term cell
      let totalRowsForTerm = 0;
      allLocs.forEach(loc => {
        totalRowsForTerm += locObj[loc].length; // number of device rows
      });
  
      let termCellUsed = false; // to ensure we only place the searchTerm cell once
      allLocs.forEach(loc => {
        const deviceRows = locObj[loc];
        const deviceCount = deviceRows.length; // rowSpan for location cell
        let locCellUsed = false;
  
        deviceRows.forEach((data, idx) => {
          const tr = document.createElement("tr");
          tr.style.height = "50px";
  
          // shading if device = mobile
          if ((data.device || "").toLowerCase() === "mobile") {
            tr.style.backgroundColor = "#f8f8f8";
          }
  
          // (1) SearchTerm cell
          if (!termCellUsed) {
            const tdTerm = document.createElement("td");
            tdTerm.style.verticalAlign = "middle";
            tdTerm.style.fontWeight = "bold";
            tdTerm.rowSpan = totalRowsForTerm;
            tdTerm.textContent = term;
            tr.appendChild(tdTerm);
            termCellUsed = true;
          }
  
          // (2) Location cell
          if (!locCellUsed) {
            const tdLoc = document.createElement("td");
            tdLoc.style.verticalAlign = "middle";
            tdLoc.rowSpan = deviceCount;
            // same 2-line approach from your home table:
            const parts = loc.split(",");
            const line1 = parts[0] ? parts[0].trim() : "";
            const line2 = parts.slice(1).map(x => x.trim()).join(", ");
            tdLoc.innerHTML = `
              <div style="font-size:20px; font-weight:bold; margin-bottom:4px;">${line1}</div>
              <div style="font-size:14px;">${line2}</div>
            `;
            tr.appendChild(tdLoc);
            locCellUsed = true;
          }
  
          // (3) Device
          const tdDev = document.createElement("td");
          tdDev.textContent = data.device;
          tr.appendChild(tdDev);
  
          // (4) Avg Rank
          const tdRank = document.createElement("td");
          tdRank.style.textAlign = "center";
          const rankVal = data.avgRank.toFixed(2);
          let rankHTML = `<div style="font-size:18px; font-weight:bold;">${rankVal}</div>`;
          if (data.rankChange !== undefined) {
            let arrow = "±", color = "#444";
            if (data.rankChange < 0) {
              arrow = "▲"; color = "green";
            } else if (data.rankChange > 0) {
              arrow = "▼"; color = "red";
            }
            rankHTML += `
              <div style="font-size:12px; color:${color};">
                ${arrow} ${Math.abs(data.rankChange).toFixed(2)}
              </div>
            `;
          }
          tdRank.innerHTML = rankHTML;
          tr.appendChild(tdRank);
  
          // (5) Market Share & Trend (merged into one cell)
          const tdShareTrend = document.createElement("td");
          tdShareTrend.style.textAlign = "center";
  
          const sharePct  = data.avgShare.toFixed(1);
          let arrow       = "±";
          let arrowColor  = "#333";
          if (data.trendVal > 0) {
            arrow      = "▲";
            arrowColor = "green";
          } else if (data.trendVal < 0) {
            arrow      = "▼";
            arrowColor = "red";
          }
  
          tdShareTrend.innerHTML = `
            <div class="ms-bar-container"
                 style="position:relative; width:100px; height:25px; background:#eee; border-radius:4px; margin:0 auto;">
              <div class="ms-bar-filled"
                   style="position:absolute; top:0; left:0; bottom:0; width:${sharePct}%; background:#007aff;">
              </div>
              <div class="ms-bar-label"
                   style="position:absolute; left:8px; top:0; bottom:0; display:flex; align-items:center; font-size:13px;">
                ${sharePct}%
              </div>
            </div>
            <div style="margin-top:4px; text-align:center; color:${arrowColor}; font-weight:bold;">
              ${arrow} ${Math.abs(data.trendVal).toFixed(2)}%
            </div>
          `;
          tr.appendChild(tdShareTrend);
  
          // (6) Rank & Market Share History => single column with 2 sub-rows
          const tdHist = document.createElement("td");
          tdHist.style.width = "400px";
  
          const histContainer = document.createElement("div");
          histContainer.style.width = "380px";
          histContainer.style.overflowX = "auto";
          histContainer.style.whiteSpace = "nowrap";
          histContainer.style.display = "flex";
          histContainer.style.flexDirection = "column";
          histContainer.style.gap = "4px";
  
          // We store rankRowDiv & shareRowDiv, but show rank by default
          const rankRowDiv = document.createElement("div");
          rankRowDiv.classList.add("rank-row-div");  // for toggling
          rankRowDiv.style.display = "inline-block";
  
          const shareRowDiv = document.createElement("div");
          shareRowDiv.classList.add("share-row-div"); // for toggling
          shareRowDiv.style.display = "none";         // hide by default
  
          const endDateMoment = moment(data.endDate, "YYYY-MM-DD");
          const dateArray = [];
          for (let i = 0; i < 30; i++) {
            dateArray.push(endDateMoment.clone().subtract(i, "days").format("YYYY-MM-DD"));
          }                  
  
          // RANK row
          data.last30ranks.slice().reverse().forEach((rVal, idx2) => {
            const box = document.createElement("div");
            box.style.display = "inline-flex";
            box.style.alignItems = "center";
            box.style.justifyContent = "center";
            box.style.width = "38px";
            box.style.height = "38px";
            box.style.marginRight = "4px";
            box.style.borderRadius = "4px";
            box.title = dateArray[idx2];
          
            const span = document.createElement("span");
            span.style.fontWeight = "bold";
            span.style.fontSize = "14px";
            span.style.color = "#333";
          
            if (rVal === 40) {
              box.style.backgroundColor = "#ddd";
              span.textContent = "";
            } else {
              if (rVal <= 1) box.style.backgroundColor = "#dfffd6";
              else if (rVal <= 3) box.style.backgroundColor = "#fffac2";
              else if (rVal <= 5) box.style.backgroundColor = "#ffe0bd";
              else box.style.backgroundColor = "#ffcfcf";
              span.textContent = rVal;
            }
          
            box.appendChild(span);
            rankRowDiv.appendChild(box);
          });          
  
          // SHARE row
          data.last30shares.slice().reverse().forEach((sVal, i2) => {
            const fillPct = Math.min(100, Math.max(0, sVal));
            const sBox = document.createElement("div");
            sBox.style.display     = "inline-block";
            sBox.style.position    = "relative";
            sBox.style.width       = "38px";
            sBox.style.height      = "38px";
            sBox.style.background  = "#ddd";
            sBox.style.borderRadius= "4px";
            sBox.style.marginRight = "4px";
            sBox.style.overflow    = "hidden";
  
            const fillDiv = document.createElement("div");
            fillDiv.style.position = "absolute";
            fillDiv.style.left     = "0";
            fillDiv.style.bottom   = "0";
            fillDiv.style.width    = "100%";
            fillDiv.style.height   = fillPct + "%";
            fillDiv.style.background = "#007aff";
  
            const labelSpan = document.createElement("span");
            labelSpan.style.position    = "relative";
            labelSpan.style.zIndex      = "2";
            labelSpan.style.display     = "inline-block";
            labelSpan.style.width       = "100%";
            labelSpan.style.textAlign   = "center";
            labelSpan.style.fontWeight  = "bold";
            labelSpan.style.fontSize    = "12px";
            labelSpan.style.lineHeight  = "38px";
            labelSpan.style.color       = "#333";
            labelSpan.textContent       = sVal.toFixed(0) + "%";
  
            sBox.appendChild(fillDiv);
            sBox.appendChild(labelSpan);
            sBox.title = dateArray[i2];
            shareRowDiv.appendChild(sBox);
          });
  
          // By default rankRowDiv is visible, shareRowDiv is hidden
          histContainer.appendChild(rankRowDiv);
          histContainer.appendChild(shareRowDiv);
          tdHist.appendChild(histContainer);
          tr.appendChild(tdHist);
  
          // Finally add row
          tbody.appendChild(tr);
        });
      });
    });
  
    wrapper.appendChild(table);
    locListContainer.appendChild(wrapper);

    // Reduce the height of empty history boxes
document.querySelectorAll('.project-table .rank-row-div div').forEach(box => {
  const text = box.textContent.trim();
  if (!text || text === "—" || text === "") {
    box.classList.add("history-empty-box");
  }
});

// Reduce height and hide label of 0% market share boxes
document.querySelectorAll('.project-table .share-row-div > div').forEach(box => {
  const label = box.querySelector('span');
  const value = label?.textContent?.trim();

  if (value === "0%" || value === "0.0%") {
    box.classList.add("history-empty-share-box");
    if (label) label.textContent = "";
  }
});
  
    // ─────────────────────────────────────────────────────────────────────────
    // 5) Implement the toggle => if #historyToggle is checked => show “share” hide “rank”, else opposite
    // ─────────────────────────────────────────────────────────────────────────
    const historyToggle = table.querySelector("#historyToggle");
    if (historyToggle) {
      historyToggle.addEventListener("change", function() {
        const showShare = this.checked;
        const allRank  = table.querySelectorAll(".rank-row-div");
        const allShare = table.querySelectorAll(".share-row-div");
        if (showShare) {
          allRank.forEach(el => { el.style.display = "none"; });
          allShare.forEach(el => { el.style.display= "inline-block"; });
        } else {
          allRank.forEach(el => { el.style.display = "inline-block"; });
          allShare.forEach(el => { el.style.display= "none"; });
        }
      });
    }
  
    // ─────────────────────────────────────────────────────────────────────────
    // 6) Optionally, let this table’s data also update the info block by reusing homeData
    // ─────────────────────────────────────────────────────────────────────────
    window.homeData = projectData;
    updateInfoBlock();
    updateHistoryRows();
  
    // ─────────────────────────────────────────────────────────────────────────
    // 7) Finally, draw the map in #projectPage #locMap
    // ─────────────────────────────────────────────────────────────────────────
    const mapData = buildProjectDataForMap();
    const safeCopy = mapData.searches.map(row => ({ ...row }));
    // Only render map if projectPage is visible
const projectPageEl = document.getElementById("projectPage");
if (projectPageEl && projectPageEl.style.display !== "none") {
  console.log("[SKIP CHECK] ✅ projectPage is visible — drawing map...");
  const safeCopy = mapData.searches.map(row => ({ ...row }));
  window.mapHelpers.drawUsMapWithLocations({ searches: safeCopy }, "#projectPage #locMap");
} else {
  console.log("[SKIP CHECK] ⛔ projectPage not visible — skipping map render.");
}  
hideFiltersOnProjectAndHome();
    } finally {
        window._projectPageProcessing = false;
    }
}
  
  function buildProjectDataForMap() {
    console.log("[buildProjectDataForMap()] Debug");
  
    const rows = Array.isArray(window.projectTableData) ? window.projectTableData : [];
    console.log("Total search rows:", rows.length);
  
    const locationsSet = new Set();
    const matched = [];
    const unmatched = [];
  
    rows.forEach(r => {
      const loc = (r.location || "").trim().toLowerCase();
      const device = r.device || "";
      locationsSet.add(loc);
      if (window.cityLookup && window.cityLookup.has(loc)) {
        matched.push({ location: loc, device, shareVal: r.avgShare, computedAvgRank: r.avgRank });
      } else {
        unmatched.push(loc);
      }
    });
  
    console.log("Unique locations:", locationsSet.size);
    console.log("Locations found in cityLookup:", matched.length);
    console.log("Locations NOT found in cityLookup:", unmatched.length);
    console.log("Examples of unmatched:", unmatched.slice(0, 5));
  
    return { searches: matched };
  } 
  
  function updateProjectInfoBlock() {
    const data = window.projectTableData || [];
    if (!data.length) return;
    console.log("[updateProjectInfoBlock] called with", data.length, "rows");
  
    const container = document.getElementById("projectPage");
  
    const desktopData = data.filter(item => item.device.toLowerCase() === 'desktop');
    const mobileData  = data.filter(item => item.device.toLowerCase() === 'mobile');
    const countDesktop = desktopData.length;
    const countMobile  = mobileData.length;
  
    // Locations
    const locDesk = container.querySelector("#locationsDesktop");
    const locMob  = container.querySelector("#locationsMobile");
    if (locDesk) locDesk.textContent = countDesktop;
    if (locMob)  locMob.textContent  = countMobile;
  
    // Avg Rank
    const avgRankDesktop = desktopData.reduce((sum, item) => sum + item.avgRank, 0) / (countDesktop || 1);
    const avgRankMobile  = mobileData.reduce((sum, item) => sum + item.avgRank, 0) / (countMobile  || 1);
  
    const rankDeskBox = container.querySelector("#avgRankDesktop");
    if (rankDeskBox) {
      rankDeskBox.textContent = avgRankDesktop.toFixed(2);
      rankDeskBox.classList.remove("range-green","range-yellow","range-orange","range-red");
      if (avgRankDesktop <= 1)      rankDeskBox.classList.add("range-green");
      else if (avgRankDesktop <= 3) rankDeskBox.classList.add("range-yellow");
      else if (avgRankDesktop <= 5) rankDeskBox.classList.add("range-orange");
      else                          rankDeskBox.classList.add("range-red");
    }
  
    const rankMobBox = container.querySelector("#avgRankMobile");
    if (rankMobBox) {
      rankMobBox.textContent = avgRankMobile.toFixed(2);
      rankMobBox.classList.remove("range-green","range-yellow","range-orange","range-red");
      if (avgRankMobile <= 1)      rankMobBox.classList.add("range-green");
      else if (avgRankMobile <= 3) rankMobBox.classList.add("range-yellow");
      else if (avgRankMobile <= 5) rankMobBox.classList.add("range-orange");
      else                         rankMobBox.classList.add("range-red");
    }
  
    // Trend Rank
    const trendRankDesktop = desktopData.reduce((sum, item) => sum + item.rankChange, 0) / (countDesktop || 1);
    const trendRankMobile  = mobileData.reduce((sum, item) => sum + item.rankChange, 0) / (countMobile  || 1);
  
    const rankDeskEl = container.querySelector("#trendRankDesktop");
    if (rankDeskEl) {
      rankDeskEl.classList.remove("trend-up","trend-down","trend-neutral");
      if (trendRankDesktop > 0) {
        rankDeskEl.textContent = `▼ ${trendRankDesktop.toFixed(2)}`;
        rankDeskEl.classList.add("trend-down");
      } else if (trendRankDesktop < 0) {
        rankDeskEl.textContent = `▲ ${Math.abs(trendRankDesktop).toFixed(2)}`;
        rankDeskEl.classList.add("trend-up");
      } else {
        rankDeskEl.textContent = `±0.00`;
        rankDeskEl.classList.add("trend-neutral");
      }
    }
  
    const rankMobEl = container.querySelector("#trendRankMobile");
    if (rankMobEl) {
      rankMobEl.classList.remove("trend-up","trend-down","trend-neutral");
      if (trendRankMobile > 0) {
        rankMobEl.textContent = `▼ ${trendRankMobile.toFixed(2)}`;
        rankMobEl.classList.add("trend-down");
      } else if (trendRankMobile < 0) {
        rankMobEl.textContent = `▲ ${Math.abs(trendRankMobile).toFixed(2)}`;
        rankMobEl.classList.add("trend-up");
      } else {
        rankMobEl.textContent = `±0.00`;
        rankMobEl.classList.add("trend-neutral");
      }
    }
  
    // Market Share (desktop + mobile)
    const marketShareDesktop = desktopData.reduce((sum, item) => sum + item.avgShare, 0) / (countDesktop || 1);
    const marketShareMobile  = mobileData.reduce((sum, item) => sum + item.avgShare, 0) / (countMobile  || 1);
  
    // ✅ Mini Chart rendering
    renderMiniMarketShareBar("marketShareDesktopMiniChart", marketShareDesktop);
    renderMiniMarketShareBar("marketShareMobileMiniChart", marketShareMobile);
  
    // Market Share Trends
    const trendMarketShareDesktop = desktopData.reduce((sum, item) => sum + item.trendVal, 0) / (countDesktop || 1);
    const trendMarketShareMobile  = mobileData.reduce((sum, item) => sum + item.trendVal, 0) / (countMobile  || 1);
  
    const shareDeskEl = container.querySelector("#trendMarketShareDesktop");
    if (shareDeskEl) {
      shareDeskEl.classList.remove("trend-up","trend-down","trend-neutral");
      if (trendMarketShareDesktop > 0) {
        shareDeskEl.textContent = `▲ ${trendMarketShareDesktop.toFixed(1)}%`;
        shareDeskEl.classList.add("trend-up");
      } else if (trendMarketShareDesktop < 0) {
        shareDeskEl.textContent = `▼ ${Math.abs(trendMarketShareDesktop).toFixed(1)}%`;
        shareDeskEl.classList.add("trend-down");
      } else {
        shareDeskEl.textContent = `±0.0%`;
        shareDeskEl.classList.add("trend-neutral");
      }
    }
  
    const shareMobEl = container.querySelector("#trendMarketShareMobile");
    if (shareMobEl) {
      shareMobEl.classList.remove("trend-up","trend-down","trend-neutral");
      if (trendMarketShareMobile > 0) {
        shareMobEl.textContent = `▲ ${trendMarketShareMobile.toFixed(1)}%`;
        shareMobEl.classList.add("trend-up");
      } else if (trendMarketShareMobile < 0) {
        shareMobEl.textContent = `▼ ${Math.abs(trendMarketShareMobile).toFixed(1)}%`;
        shareMobEl.classList.add("trend-down");
      } else {
        shareMobEl.textContent = `±0.0%`;
        shareMobEl.classList.add("trend-neutral");
      }
    }
  }

function renderProjectMarketShareChart(projectData) {
  const chartEl = document.getElementById("projectMarketShareChart");
  if (!chartEl) return;

  // Destroy any old instance
  if (window.projectMarketShareChartInstance) {
    window.projectMarketShareChartInstance.destroy();
    window.projectMarketShareChartInstance = null;
  }

  // 1) Build daily data => .deskAvg, .mobAvg, .totalAvg
  const dailyArr = buildProjectDailyAverages(projectData);
  if (!Array.isArray(dailyArr) || !dailyArr.length) {
    chartEl.innerHTML = "<p>No valid daily data for projectMarketShareChart</p>";
    return;
  }

  // 2) Create 3 stacked series:
  //    (index 0) => All Devices, (index 1) => Desktop Only, (index 2) => Mobile Only
  const allDevices = dailyArr.map(d => ({ x: d.date, y: d.totalAvg }));
  const deskSeries = dailyArr.map(d => ({ x: d.date, y: d.deskAvg  }));
  const mobSeries  = dailyArr.map(d => ({ x: d.date, y: d.mobAvg   }));

  const finalSeries = [
    { name: "All Devices",   data: allDevices },
    { name: "Desktop Only",  data: deskSeries },
    { name: "Mobile Only",   data: mobSeries  }
  ];

  // 3) The same custom tooltip logic
  function customTooltip({ series, dataPointIndex, w }) {
    const formattedDate = w.globals.labels[dataPointIndex] || "";
    let items = [];
    for (let i = 0; i < series.length; i++) {
      const label       = w.config.series[i].name;
      const color       = w.globals.colors?.[i] || "#007aff";
      const currentVal  = series[i][dataPointIndex];
      const prevVal     = dataPointIndex > 0 ? series[i][dataPointIndex - 1] : null;
      let diffStr = "";
      if (prevVal !== null) {
        const diff = currentVal - prevVal;
        if (diff > 0) {
          diffStr = `▲ ${diff.toFixed(2)}%`;
        } else if (diff < 0) {
          diffStr = `▼ ${Math.abs(diff).toFixed(2)}%`;
        } else {
          diffStr = "±0.00%";
        }
      }
      items.push({ label, color, currentVal, diffStr });
    }

    // Sort descending by currentVal
    items.sort((a, b) => b.currentVal - a.currentVal);

    // Build HTML
    let html = `
      <div style="
        padding: 8px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background: #f9f9f9;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.08);
      ">
      <div style="margin-bottom:4px; font-size:12px; color:#333;">
        ${formattedDate}
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:12px; color:#333;">
    `;
    items.forEach(item => {
      let diffColor = "#666";
      if (item.diffStr.startsWith("▲")) diffColor = "green";
      else if (item.diffStr.startsWith("▼")) diffColor = "red";

      html += `
        <tr>
          <td style="padding:2px 4px; vertical-align:middle;">
            <span style="display:inline-block;width:10px;height:10px;border-radius:5px;background:${item.color};margin-right:6px;"></span>
            <strong>${item.label}</strong>
          </td>
          <td style="padding:2px 4px;text-align:right;vertical-align:middle;">
            ${item.currentVal.toFixed(2)}%
            <span style="color:${diffColor}; margin-left:6px;">
              ${item.diffStr}
            </span>
          </td>
        </tr>
      `;
    });
    html += "</table></div>";
    return html;
  }

  // 4) ApexCharts config: 
  const options = {
    series: finalSeries,
    chart: {
      type: "area",
      stacked: true,
      width: 920,         // << increased width
      height: "100%",
      toolbar: { show: false },
      zoom: { enabled: true },
      animations: {
        enabled: true,
        speed: 500,
        animateGradually: { enabled: true, delay: 50 },
        dynamicAnimation: { enabled: true, speed: 500 }
      }
    },
    title: {
      text: "Market Share",
      align: "left",
      offsetY: 10,
      margin: 0,
      style: {
        fontSize: "14px",
        color: "#333"
      }
    },
    // -- dataLabels: point labels on seriesIndex=0 only
    dataLabels: {
      enabled: true,
      enabledOnSeries: [0], // only totalAvg line
      formatter: (val) => val.toFixed(2) + "%",
      offsetY: -5,
      style: {
        fontSize: "12px",
        colors: ["#000"]
      }
    },
    stroke: {
      curve: "smooth",
      width: 2
    },
    // -- Markers: bigger marker for totalAvg only
    markers: {
      size: [5, 0, 0]
    },
    // -- Fill gradient for all, but we override color with array
    fill: {
      type: "gradient",
      gradient: { opacityFrom: 0.75, opacityTo: 0.95 }
    },
    // -- Colors: first line is #007aff (blue),
    //    next two are greys
    colors: [
      "#007aff",
      "rgb(180,180,180)",
      "rgb(210,210,210)"
    ],
    xaxis: {
      type: "datetime",
      labels: { show: true }
    },
    yaxis: {
      labels: {
        show: true,
        formatter: val => val.toFixed(2)
      },
      title: { text: "Market Share (%)" },
      max: 100
    },
    legend: {
      show: false // no legend on the chart
    },
    tooltip: {
      custom: customTooltip
    }
  };

  chartEl.innerHTML = "";
  window.projectMarketShareChartInstance = new ApexCharts(chartEl, options);
  window.projectMarketShareChartInstance.render();
}

/**
 * renderProjectPieChart
 * ---------------------
 * Renders a single-slice “highlight” pie chart showing the
 * company’s average total share vs the rest of the pie.
 */
 function renderProjectPieChart(projectData) {
  // 1) Grab the <canvas> element
  const canvasEl = document.getElementById("projectPieChart");
  if (!canvasEl) {
    console.warn("[renderProjectPieChart] #projectPieChart not found in DOM.");
    return;
  }

  // 1A) Also grab the container, so we can align/center or place the trend below
  const containerDiv = document.getElementById("project-pie-chart");
  if (!containerDiv) {
    console.warn("[renderProjectPieChart] #project-pie-chart container not found.");
    return;
  }

  // Make the container use flex column so the chart is at center, 
  // and we can place the trend below it
  containerDiv.style.height = "220px";
  containerDiv.style.display        = "flex";
  containerDiv.style.flexDirection  = "column";
  containerDiv.style.alignItems     = "center";
  containerDiv.style.justifyContent = "center";

  // 2) If there's an old chart instance, destroy it
  if (canvasEl._chartInstance) {
    canvasEl._chartInstance.destroy();
  }

  // 3) Compute the average share from your aggregator
  //    and round it to two digits
  const companyAvgShare = parseFloat(
    computeProjectTotalAvgShare(projectData).toFixed(2)
  );
  const restOfPie = parseFloat((100 - companyAvgShare).toFixed(2));

  // 4) Build the dataset for Chart.js
  const data = {
    labels: [ "My Company", "Others" ],
    datasets: [
      {
        data: [ companyAvgShare, restOfPie ],
        backgroundColor: [ "#007aff", "#ddd" ],
        borderColor: [ "#fff", "#fff" ],
        borderWidth: 1,
        // “offset” pulls out the first slice
        offset: [ 15, 0 ],
        // Chart.js DataLabels plugin: show the label only on the first slice
        datalabels: {
          color: "#333",
          font: {
            size: 18,
            weight: "bold"
          },
          formatter: function(value, ctx) {
            // Only show text on the first slice (dataIndex===0 => "My Company")
            if (ctx.dataIndex === 0) {
              return value.toFixed(2) + "%";
            }
            return "";
          }
        }
      }
    ]
  };

  // 5) Chart.js config object
  const config = {
    type: "pie",
    data: data,
    options: {
      responsive: false,   // because you have a fixed size or parent
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false }
        // no custom centerText if you're using datalabels
      },
      cutout: 0,   // 0 => standard pie, you can adjust
      animation: {
        animateScale: true
      }
    },
    // Ensure we load the DataLabels plugin
    plugins: [ChartDataLabels]
  };

  // 6) Build the new Chart instance
  const ctx = canvasEl.getContext("2d");
  const myPie = new Chart(ctx, config);
  // Store reference for cleanup later
  canvasEl._chartInstance = myPie;

  // 7) Compute the “trend arrow + difference” for the last 7 days
  //    (Assuming you have a function that returns e.g. +2.5 or -1.2)
  const shareTrendVal = computeProjectShareTrendVal(projectData);
  let arrow = "", arrowColor="#666";
  if (shareTrendVal > 0) {
    arrow = "▲";
    arrowColor = "green";
  } else if (shareTrendVal < 0) {
    arrow = "▼";
    arrowColor = "red";
  }
  const diffVal = Math.abs(shareTrendVal).toFixed(2) + "%";

  // 8) Remove any old trend element
  const oldTrend = document.getElementById("pieTrendDiv");
  if (oldTrend) {
    oldTrend.remove();
  }

  // 9) Build a new <div> under the chart for arrow + difference
  const trendDiv = document.createElement("div");
  trendDiv.id = "pieTrendDiv";
  trendDiv.style.fontSize  = "14px";
  trendDiv.style.fontWeight= "bold";
  trendDiv.style.marginTop = "6px";
  trendDiv.style.textAlign = "center";

  if (!arrow) {
    // If shareTrendVal===0
    trendDiv.textContent = "±0.00%";
  } else {
    trendDiv.innerHTML = `<span style="color:${arrowColor};">${arrow} ${diffVal}</span>`;
  }

  containerDiv.appendChild(trendDiv);
}

function renderProjectDailyRankBoxes(projectData) {
  // 1) Grab the container
  const container = document.getElementById("projectDailyRankContainer");
  if (!container) return;

  // Clear any old content
  container.innerHTML = "";

  // 2) Build the dailyRank array
  const dailyArr = buildProjectDailyRankAverages(projectData);
  if (!Array.isArray(dailyArr) || !dailyArr.length) {
    container.textContent = "No rank data available.";
    return;
  }

  // 3) Loop oldest → newest (or reverse if needed)
  dailyArr.forEach(dayObj => {
    const rankVal = dayObj.avgRank; 
    // Round to 1 digit
    const labelVal = rankVal.toFixed(0);

    // 4) Build a small <div> “box”
    const box = document.createElement("div");
    box.style.width        = "28px";
    box.style.height       = "28px";
    box.style.display      = "inline-flex";
    box.style.alignItems   = "center";
    box.style.justifyContent = "center";
    box.style.fontSize     = "12px";    // smaller font
    box.style.borderRadius = "4px";
    box.style.marginRight  = "3px";
    
    // If rankVal===40 => no rank => grey box, empty
    if (rankVal === 40.0) {
      box.style.background = "#ddd";
      box.textContent = "";
    } else {
      // else apply color logic based on rankVal
      if (rankVal <= 1) {
        box.style.background = "#dfffd6";  // greenish
      } else if (rankVal <= 3) {
        box.style.background = "#ffffc2";  // yellowish
      } else if (rankVal <= 5) {
        box.style.background = "#ffe0bd";  // orangeish
      } else {
        box.style.background = "#ffcfcf";  // redish
      }
      // Show the numeric rank
      box.textContent = labelVal;
    }

    // optional: set a tooltip
    box.title = dayObj.date;

    container.appendChild(box);
  });
}

// Helper function to reset all loading states (useful for debugging)
window.resetProjectLoadingStates = function() {
  window._isLoadingProjectData = false;
  window._projectLoadAttempts = {};
  console.log("[resetProjectLoadingStates] All loading states have been reset");
};
