  function populateProjectPage() {
    logAvailableCompanies();
    // Log when the function is called
    console.log("[📊 POPULATEPROJECTPAGE] Called at:", new Date().toISOString());
  
    // ADD THIS BLOCK - Check if data is available and load it if needed
    if (!window.companyStatsData || !Array.isArray(window.companyStatsData) || window.companyStatsData.length === 0) {
      console.warn("[populateProjectPage] No companyStatsData available, attempting to load data...");
      
      // Get the current project number or default to 1
      const projectNumber = window.filterState?.activeProjectNumber || 1;
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
          // Hide loader
          if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => { loader.style.display = "none"; }, 500);
          }
          // Call populateProjectPage again now that data is loaded
          populateProjectPage();
        })
        .catch(err => {
          console.error("[populateProjectPage] Failed to load data:", err);
          // Hide loader
          if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => { loader.style.display = "none"; }, 500);
          }
        });
      return; // Exit early - we'll be called again after data loads
    }

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
