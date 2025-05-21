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
 * Builds daily averages for Desktop / Mobile / All for each day in the last30 range.
 */
function buildProjectDailyAverages(projectData) {
  // 1) Identify the max date from projectData
  let maxDate = null;
  projectData.forEach(row => {
    if (!row.endDate) return;
    const d = moment(row.endDate, "YYYY-MM-DD");
    if (!maxDate || d.isAfter(maxDate)) {
      maxDate = d.clone();
    }
  });
  if (!maxDate) {
    return []; // no valid endDate
  }
  
  // We'll consider the 30 days up to maxDate
  const periodEnd   = maxDate.clone();
  const periodStart = maxDate.clone().subtract(29, "days");

  // 2) We’ll store each day’s data in a map: dailyMap[YYYY-MM-DD] = { sumDesk, countDesk, sumMob, countMob }
  const dailyMap = {};
  // Make a date array for the entire 30-day window
  let dayCursor = periodStart.clone();
  const allDates = [];
  while (dayCursor.isSameOrBefore(periodEnd, "day")) {
    const dStr = dayCursor.format("YYYY-MM-DD");
    dailyMap[dStr] = { sumDesk:0, countDesk:0, sumMob:0, countMob:0 };
    allDates.push(dStr);
    dayCursor.add(1, "days");
  }

  // 3) For each row => use row.last30shares[] + row.device
  //    We know row.last30shares has 30 data points from oldest to newest or newest to oldest.
  //    If your code uses the newest as the last array item, we’ll match it carefully:
  projectData.forEach(row => {
    const dev = (row.device || "").toLowerCase();
    if (!row.last30shares || row.last30shares.length !== 30) return;

    // We assume row.endDate is the same maxDate or close. We line up each index with day X in [periodStart..periodEnd].
    // index 0 => periodStart, index 29 => periodEnd, for example. 
    // If your code’s indexing is reversed, adjust accordingly.
    for (let i=0; i<30; i++) {
      const dayStr = periodStart.clone().add(i, "days").format("YYYY-MM-DD");
      const shareVal = row.last30shares[i] || 0; // e.g. 14.2 => 14.2% 
      if (!dailyMap[dayStr]) continue; // safety check

      // Only add if shareVal > 0
      if (dev === "desktop" && shareVal > 0) {
        dailyMap[dayStr].sumDesk += shareVal;
        dailyMap[dayStr].countDesk++;
      } else if (dev === "mobile" && shareVal > 0) {
        dailyMap[dayStr].sumMob += shareVal;
        dailyMap[dayStr].countMob++;
      }       
      // else ignore for other devices
    }
  });

  // 4) Build a final array with { date, deskAvg, mobAvg, totalAvg }
  const results = allDates.map(dStr => {
    const obj = dailyMap[dStr];
    const deskAvg = obj.countDesk > 0 ? obj.sumDesk / obj.countDesk : 0;
    const mobAvg  = obj.countMob  > 0 ? obj.sumMob  / obj.countMob  : 0;

    // The “All” average can be the weighted average across (sumDesk+sumMob) / (countDesk+countMob)
    const totalCount = obj.countDesk + obj.countMob;
    const totalSum   = obj.sumDesk + obj.sumMob;
    const totalAvg   = totalCount > 0 ? totalSum / totalCount : 0;

    return {
      date: dStr,
      deskAvg,
      mobAvg,
      totalAvg
    };
  });

  return results;
}

/**
 * Builds daily average rank for Desktop / Mobile / All for each day in the last30 range.
 * This parallels buildProjectDailyAverages, but uses row.last30ranks instead of row.last30shares.
 */
 function buildProjectDailyRankAverages(projectData) {
  // 1) Find the maxDate from .endDate
  let maxDate = null;
  projectData.forEach(row => {
    if (!row.endDate) return;
    const d = moment(row.endDate, "YYYY-MM-DD");
    if (!maxDate || d.isAfter(maxDate)) {
      maxDate = d.clone();
    }
  });
  if (!maxDate) return [];

  // 2) The [periodStart .. periodEnd] = last 30 days
  const periodEnd   = maxDate.clone();
  const periodStart = maxDate.clone().subtract(29, "days");

  // 3) Make a map of day => { sumDesk, countDesk, sumMob, countMob }
  const dailyMap = {};
  let dayCursor = periodStart.clone();
  const allDates = [];
  while (dayCursor.isSameOrBefore(periodEnd, "day")) {
    const dStr = dayCursor.format("YYYY-MM-DD");
    dailyMap[dStr] = { sumDesk:0, countDesk:0, sumMob:0, countMob:0 };
    allDates.push(dStr);
    dayCursor.add(1, "days");
  }

  // 4) For each row => look at row.last30ranks[] (30 items),
  //    line them up to the day range, just like buildProjectDailyAverages does.
  projectData.forEach(row => {
    const dev = (row.device||"").toLowerCase();
    if (!row.last30ranks || row.last30ranks.length!==30) return;

    for (let i=0; i<30; i++){
      const dayStr = periodStart.clone().add(i,"days").format("YYYY-MM-DD");
      const rankVal = row.last30ranks[i] || 0; 
      if (!dailyMap[dayStr]) continue;

      // Only add if rankVal>0 (some aggregator uses 40 if missing)
      if (rankVal>0) {
        if (dev==="desktop") {
          dailyMap[dayStr].sumDesk += rankVal;
          dailyMap[dayStr].countDesk++;
        } else if (dev==="mobile") {
          dailyMap[dayStr].sumMob += rankVal;
          dailyMap[dayStr].countMob++;
        }
      }
    }
  });

  // 5) Convert dailyMap => an array of { date, deskRank, mobRank, avgRank }
  return allDates.map(dStr => {
    const o = dailyMap[dStr];
    const deskRank = o.countDesk>0 ? (o.sumDesk/o.countDesk) : 40;
    const mobRank  = o.countMob>0 ? (o.sumMob/o.countMob) : 40;
    const totalCount = o.countDesk + o.countMob;
    const totalSum   = o.sumDesk   + o.sumMob;
    const overall    = totalCount>0 ? (totalSum/totalCount) : 40;
    return {
      date:     dStr,
      deskRank: deskRank,
      mobRank:  mobRank,
      avgRank:  overall
    };
  });
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
    
function updateProjectMarketShareChart() {
  renderProjectMarketShareChart(window.projectTableData);
  renderProjectPieChart(window.projectTableData);
  renderProjectDailyRankBoxes(window.projectTableData);
}

 function computeProjectTotalAvgShare(projectData) {
  // 1) Defensive check
  if (!Array.isArray(projectData) || !projectData.length) {
    return 0; // no data
  }

  // 2) Sum up the .avgShare from your aggregator logic
  //    The aggregator already gave each row => row.avgShare for the last N days
  //    If you want “strictly 7 days,” ensure projectData was built for 7 days
  //    or rely on the standard “buildProjectData()” with filterState.period=7d.
  let sum = 0, count = 0;
  projectData.forEach(row => {
    // row.avgShare is a number
    sum += row.avgShare;
    count++;
  });
  // 3) average
  const overallAvg = count > 0 ? (sum / count) : 0;
  return overallAvg;
}

function computeProjectShareTrendVal(projectData) {
  // 1) Build the daily array for up to 30 days
  const dailyArr = buildProjectDailyAverages(projectData);
  if (!Array.isArray(dailyArr) || dailyArr.length < 14) {
    // Not enough data to do a 7-day vs. 7-day comparison
    return 0;
  }

  // 2) The last 7 days are dailyArr.slice(-7),
  //    The previous 7 days are dailyArr.slice(-14, -7).
  const last7  = dailyArr.slice(-7);
  const prev7  = dailyArr.slice(-14, -7);

  // 3) Compute averages of .totalAvg
  const currentAvg = last7.reduce((sum, d) => sum + d.totalAvg, 0) / last7.length;
  const prevAvg    = prev7.reduce((sum, d) => sum + d.totalAvg, 0) / prev7.length;

  // 4) Return the difference
  return currentAvg - prevAvg;
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

function renderMiniMarketShareBar(containerId, shareValue) {
  const container = document.getElementById(containerId);
  if (!container) return;

  // destroy prior instance
  if (container._chartInstance) {
    container._chartInstance.destroy();
  }

  // clear out previous content
  container.innerHTML = "";

  // 1) Determine label based on containerId
  const isDesktop = containerId.toLowerCase().includes("desktop");
  const labelText = isDesktop
    ? "Desktop Market Share (%)"
    : "Mobile Market Share (%)";

  // 2) Create chart wrapper with minimal dimensions
  const MIN_WIDTH  = 200;
  const MIN_HEIGHT = 80;
  const BAR_HEIGHT = 30;

  const wrapper = document.createElement("div");
  wrapper.style.width  = MIN_WIDTH + "px";
  wrapper.style.height = MIN_HEIGHT + "px";
  wrapper.style.margin = "0 auto";
  container.appendChild(wrapper);

  // 3) Append the text label *below* the chart
  const labelDiv = document.createElement("div");
  labelDiv.textContent     = labelText;
  labelDiv.style.textAlign = "center";
  labelDiv.style.fontSize  = "11px";
  labelDiv.style.fontWeight= "600";
  labelDiv.style.color     = "#333";
  labelDiv.style.marginTop = "4px";
  container.appendChild(labelDiv);

  console.log(`[renderMiniMarketShareBar] ${containerId} → ${shareValue}%`);

  // 4) Build the Apex chart with fixed barHeight & forced category
  const options = {
    chart: {
      type: "bar",
      width: MIN_WIDTH,
      height: MIN_HEIGHT,
      toolbar: { show: false }
    },
    series: [{
      name: "Market Share",
      data: [ shareValue ]      // single numeric value
    }],
    plotOptions: {
      bar: {
        horizontal: true,
        barHeight: `${BAR_HEIGHT}px`,
        borderRadius: 4
      }
    },
    dataLabels: {
      enabled: true,
      formatter: v => v.toFixed(2) + "%",
      offsetX: 6,
      style: { fontSize: "12px", colors: ["#000"] }
    },
    xaxis: {
      max: 100,
      labels: { style: { fontSize: "10px", colors: "#666" } },
      axisTicks: { show: true },
      axisBorder:{ show: true }
    },
    yaxis: {
      categories: [""],   // ensures the single bar actually renders
      labels: { show: false }
    },
    grid: {
      xaxis: { lines:{ show: true } },
      yaxis: { lines:{ show: false } }
    },
    tooltip: { enabled: false }
  };

  const chart = new ApexCharts(wrapper, options);
  chart.render();
  container._chartInstance = chart;
}
