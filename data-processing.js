  function buildProjectData(projectNumber) {
      const projectNum = projectNumber || window.filterState.activeProjectNumber;
  
  // Check cache first
  const cacheKey = `project_${projectNum}_${window.filterState.engine}_${window.filterState.company}`;
  if (window.dataCache && window.dataCache.projectData[cacheKey]) {
    console.log("[buildProjectData] Using cached data for key:", cacheKey);
    return window.dataCache.projectData[cacheKey];
  }
  
  console.log("[buildProjectData] Building fresh data for project:", projectNum);
    // 1) Defensive check
    if (!Array.isArray(window.companyStatsData)) {
      console.warn("[buildProjectData] No companyStatsData or it’s not an array.");
      return [];
    }

    // Filter strictly by project number
  const filteredRows = window.companyStatsData.filter(row => {
    return row.project_number === projectNum;
  });
  
  console.log(`[buildProjectData] Found ${filteredRows.length} rows for project ${projectNum}`);
  
    // 2) We DO still rely on filterState for engine, device, location, etc. 
    //    BUT we IGNORE the single searchTerm filter – we want all search terms for this project
    const st = window.filterState;
  
// 3) Identify which project we are dealing with
    // projectNum already declared above, no need to redeclare
    if (!projectNum) {
      console.warn("[buildProjectData] missing projectNumber in filterState.");
      return [];
    }
  
// 4) Filter out rows that belong to this project
    const projectFilteredRows = window.companyStatsData.filter(row => {
      // Must match project_number
      if (row.project_number !== projectNum) return false;
  
      // Must match engine if st.engine is set
      if (st.engine && row.engine?.toLowerCase() !== st.engine.toLowerCase()) return false;
  
      // Must match company if we want a single “companyName” 
      //  (Up to you if the project page is company-specific or not. 
      //   If you want all companies, remove this. 
      //   If you only want the “myCompany,” keep it.)
      if (st.company && row.source?.toLowerCase() !== st.company.toLowerCase()) return false;
  
      // If your design requires location or device filters, check them here
      // e.g. if (st.location && row.location_requested!== st.location)...
  
      return true;
    });
  
    // 5) For each row in filteredRows, we have row.search. That’s the “Search Term” we want.
    //    We also have row.location_requested, row.device, plus row.historical_data
    //    We group them by (searchTerm, location, device).
    const groupingMap = {};
    projectFilteredRows.forEach(row => {
      const searchTerm = row.q || row.search;  // “q” or “search”
      const loc = row.location_requested || "Unknown";
      const dev = row.device || "Unknown";
  
      // The group key
      const key = `${searchTerm}||${loc}||${dev}`;
      if (!groupingMap[key]) {
        groupingMap[key] = [];
      }
      // push the entire row
      groupingMap[key].push(row);
    });
  
    // 6) Now for each group, we unify all historical_data to do the same 7d/30d averaging, etc.
    const results = [];
  
    function findMaxDate(hArray){
      let mD = null;
      hArray.forEach(d => {
        const mm = moment(d.date.value, "YYYY-MM-DD");
        if (!mD || mm.isAfter(mD)) {
          mD = mm.clone();
        }
      });
      return mD;
    }
  
    Object.keys(groupingMap).forEach(key => {
      const [sTerm, loc, dev] = key.split("||");
      const rowSet = groupingMap[key]; // all rows that share searchTerm+location+device
  
      // Merge all historical_data from these rows
      let mergedHist = [];
      rowSet.forEach(r => {
        if (Array.isArray(r.historical_data)) {
          mergedHist = mergedHist.concat(r.historical_data);
        }
      });
      if (!mergedHist.length) return;
  
      // Find overall max date
      const maxDate = findMaxDate(mergedHist);
      if (!maxDate) return;
  
      // Figure out how many days from filterState.period
      let periodDays = 7;
      if (st.period === "3d")  periodDays = 3;
      if (st.period === "30d") periodDays = 30;
  
      // Build start/end
      const end   = maxDate.clone();
      const start = end.clone().subtract(periodDays - 1, "days");
  
      // current data
      const currentArr = mergedHist.filter(d => {
        const dd = moment(d.date.value, "YYYY-MM-DD");
        return dd.isBetween(start, end, "day", "[]");
      });
      // previous data
      const prevEnd   = start.clone().subtract(1,"days");
      const prevStart = prevEnd.clone().subtract(periodDays - 1, "days");
      const prevArr   = mergedHist.filter(d => {
        const dd = moment(d.date.value, "YYYY-MM-DD");
        return dd.isBetween(prevStart, prevEnd, "day", "[]");
      });
  
      // compute avg rank, avg share
      let sumR=0, cR=0;
      currentArr.forEach(obj => {
        if (obj.rank!=null) {
          sumR+= parseFloat(obj.rank);
          cR++;
        }
      });
      const avgRank = cR>0 ? sumR/cR : 40;
  
      let sumS=0, cS=0;
      currentArr.forEach(obj => {
        if (obj.market_share!=null) {
          sumS+= parseFloat(obj.market_share)*100;
          cS++;
        }
      });
      const avgShare = cS>0 ? sumS/cS : 0;
  
      // previous average share => for trendVal
      let sumPrev=0, countPrev=0;
      prevArr.forEach(obj => {
        if (obj.market_share!=null) {
          sumPrev+= parseFloat(obj.market_share)*100;
          countPrev++;
        }
      });
      const prevShare = countPrev>0 ? sumPrev/countPrev : 0;
      const diff = avgShare- prevShare;
  
      // rank diff
      let sumPR=0, countPR=0;
      prevArr.forEach(obj => {
        if (obj.rank!=null) {
          sumPR+= parseFloat(obj.rank);
          countPR++;
        }
      });
      const prevRank = countPR>0 ? sumPR/countPR : 40;
      const rankDiff = avgRank- prevRank;
  
      // build dayMap => for last30
      let dayMap = {};
      mergedHist.forEach(obj => {
        if (obj.date?.value) {
          const ds = obj.date.value;
          dayMap[ds] = {
            r: obj.rank!=null ? parseFloat(obj.rank) : 40,
            s: obj.market_share!=null ? parseFloat(obj.market_share)*100 : 0
          };
        }
      });
      // build last30 arrays
      const last30r = [];
      const last30s = [];
      const start30 = end.clone().subtract(29, "days");
      let run = start30.clone();
      while (run.isSameOrBefore(end,"day")) {
        const ds = run.format("YYYY-MM-DD");
        if (dayMap[ds]) {
          last30r.push(dayMap[ds].r);
          last30s.push(dayMap[ds].s);
        } else {
          last30r.push(40);
          last30s.push(0);
        }
        run.add(1,"days");
      }
  
      // push final row
      results.push({
        searchTerm: sTerm,
        location: loc,
        device: dev,
        avgRank,
        avgShare,
        trendVal: diff,
        rankChange: rankDiff,
        last30ranks: last30r,
        last30shares: last30s,
        hasData: true,
        endDate: end.format("YYYY-MM-DD")
      });
    });

      if (window.dataCache) {
    window.dataCache.projectData[cacheKey] = results;
    console.log("[buildProjectData] Cached results for key:", cacheKey);
  }
  
    return results;
  } 

/**
 * Combined buildHomeData
 * 
 * 1) Uses your old aggregator logic exactly (mapLD => group by location+device => sum up),
 * 2) Also respects new filterState checks (searchTerm, engine, device, location, etc.),
 * 3) Allows a companyName param, but if not provided, falls back to st.company.
 */
 function buildHomeData(companyName) {
  // 0) Defensive checks
  if (!Array.isArray(window.companyStatsData)) {
    console.warn("companyStatsData missing or invalid. Aborting buildHomeData().");
    return [];
  }

  // 1) If no companyName param was passed in, default to filterState.company
  //    If both are missing, we skip the 'source' filter entirely (you can decide).
  const st = window.filterState || {};
  if (!companyName) {
    if (st.company) {
      companyName = st.company; 
    } else {
      // If you truly require a company filter, you could bail out:
      // console.warn("No companyName param or filterState.company provided.");
      // return [];
      // Otherwise, just skip the source filter. We'll decide below.
    }
  }

     // ====== ADD CACHE CHECK HERE ======
  // Check cache
  const cacheKey = `home_${companyName || 'all'}_${st.searchTerm}_${st.engine}_${st.period}`;
  if (window.dataCache && window.dataCache.homeData[cacheKey]) {
    console.log("[buildHomeData] Using cached data for key:", cacheKey);
    return window.dataCache.homeData[cacheKey];
  }
  
  console.log("[buildHomeData] Building fresh data for company:", companyName || 'all');
  // ====== END OF CACHE CHECK ======

  // 2) Build a subset filter that merges old & new checks
  //    (Remove or comment out any lines you do *not* want.)
  const homeSubset = window.companyStatsData.filter(row => {
    // (A) searchTerm check
    if (st.searchTerm) {
      const qLower = (row.q || "").toLowerCase();
      if (qLower !== st.searchTerm.toLowerCase()) return false;
    }
    // (B) engine check
    if (st.engine) {
      const engLower = (row.engine || "").toLowerCase();
      if (engLower !== st.engine.toLowerCase()) return false;
    }

    // (E) source/company check (from old code => row.source must match param,
    //     or skip it if neither param nor st.company is defined)
    if (companyName) {
      const rowCompany = (row.source || "").toLowerCase();
      if (rowCompany !== companyName.toLowerCase()) return false;
    }

    // If we pass all checks, keep row
    return true;
  });

  if (!homeSubset.length) {
    console.warn("[buildHomeData] No matching rows for home subset.");
    return [];
  }

  // 3) From here downward is exactly your *old aggregator* code:
  //    “mapLD => group by location+device => find globalMax => do period logic => sums.”

  // (A) Group by location+device
  const mapLD = {};
  homeSubset.forEach(row => {
    const loc = row.location_requested || "Unknown";
    const dev = row.device || "Unknown";
    if (!mapLD[loc]) mapLD[loc] = {};
    if (!mapLD[loc][dev]) {
      mapLD[loc][dev] = [];
    }
    if (Array.isArray(row.historical_data)) {
      mapLD[loc][dev].push(...row.historical_data);
    }
  });

  // 1) *** Use old findOverallMaxDate or your new approach
  const globalMax = findOverallMaxDate(window.companyStatsData);
  if (!globalMax) return [];

  // 2) Decide how many days from filterState.period
  let periodDays = 7; 
  if (st.period === "3d")  periodDays = 3;
  if (st.period === "30d") periodDays = 30;

  // 3) The final start/end
  const end   = globalMax.clone();
  const start = end.clone().subtract(periodDays - 1, "days");

  const results = [];

  Object.keys(mapLD).forEach(loc => {
    const devs = Object.keys(mapLD[loc]);
    devs.forEach(dev => {
      const allHist = mapLD[loc][dev];
      if (!allHist?.length) return;

      // (1) Build dayMap
      let dayMap = {};
      allHist.forEach(obj => {
        if (!obj.date || !obj.date.value) return;
        const ds = obj.date.value;
        const rankVal = (obj.rank != null) ? parseFloat(obj.rank) : 40;
        const shareVal = (obj.market_share != null) ? parseFloat(obj.market_share)*100 : 0;
        dayMap[ds] = { r: rankVal, s: shareVal };
      });

      // (2) Summation for current period
      let sumRank = 0, sumShare = 0;
      let rankCount = 0;
      let dayCursor = start.clone();
      while (dayCursor.isSameOrBefore(end, "day")) {
        const ds = dayCursor.format("YYYY-MM-DD");
        if (dayMap[ds]) {
          sumRank  += dayMap[ds].r;
          sumShare += dayMap[ds].s;
          rankCount++;
        } else {
          sumShare += 0; // no record => no rank increment, share = 0
        }
        dayCursor.add(1, "days");
      }

      let avgRank  = rankCount ? (sumRank / rankCount) : 40;
      let avgShare = periodDays ? (sumShare / periodDays) : 0;

      // (3) Summation for previous period
      const prevEnd = start.clone().subtract(1, "days");
      const prevStart = prevEnd.clone().subtract(periodDays - 1, "days");

      let sumPrevRank = 0, sumPrevShare = 0;
      let prevDay = prevStart.clone();
      while (prevDay.isSameOrBefore(prevEnd, "day")) {
        const ds = prevDay.format("YYYY-MM-DD");
        if (dayMap[ds]) {
          sumPrevRank += dayMap[ds].r;
          sumPrevShare += dayMap[ds].s;
        } else {
          sumPrevRank += 40;
          sumPrevShare += 0;
        }
        prevDay.add(1,"days");
      }

      let prevAvgRank  = periodDays ? (sumPrevRank / periodDays) : 40;
      let prevAvgShare = periodDays ? (sumPrevShare / periodDays) : 0;

      let rankDiff = avgRank - prevAvgRank;
      let diff     = avgShare - prevAvgShare;

      // (4) Build last30 arrays
      const last30r = [];
      const last30s = [];
      const start30 = end.clone().subtract(29,"days");
      let run = start30.clone();
      while (run.isSameOrBefore(end,"day")) {
        const ds = run.format("YYYY-MM-DD");
        if (dayMap[ds]) {
          last30r.push(dayMap[ds].r);
          last30s.push(dayMap[ds].s);
        } else {
          last30r.push(40);
          last30s.push(0);
        }
        run.add(1,"days");
      }

      // (5) push final row
      results.push({
        location: loc,
        device: dev,
        avgRank,
        avgShare,
        trendVal: diff,       // share difference
        rankChange: rankDiff, // rank difference
        last30ranks: last30r,
        last30shares: last30s,
        hasData: true,
        endDate: end.format("YYYY-MM-DD")
      });
    });
  });

     // ====== ADD CACHE SAVE HERE ======
  // Cache the results before returning
  if (window.dataCache) {
    window.dataCache.homeData[cacheKey] = results;
    console.log("[buildHomeData] Cached results for key:", cacheKey);
  }
  // ====== END OF CACHE SAVE ======

  return results;
} 

  function computeMarketShareData(fullData, groupSmallCompanies = true) {
      // Generate cache key
  const cacheKey = window.dataCache ? 
    window.dataCache.getCacheKey('marketShare', { group: groupSmallCompanies }) : null;
  
  // Check cache
  if (cacheKey && window.dataCache.marketShare[cacheKey]) {
    console.log("[computeMarketShareData] Using cached data");
    return window.dataCache.marketShare[cacheKey];
  }
    // 1) Filter the top-level records by Q, engine, device, location from filterState
    const fs = window.filterState;
    console.log("[computeMarketShareData] FilterState:", window.filterState);
  console.log("[computeMarketShareData] Input data length:", fullData?.length || 0);
  
    const filteredRecords = fullData.filter(r =>
      r.q?.toLowerCase() === fs.searchTerm.toLowerCase() &&
      r.engine?.toLowerCase() === fs.engine.toLowerCase() &&
      r.device?.toLowerCase() === fs.device.toLowerCase() &&
      r.location_requested?.toLowerCase() === fs.location.toLowerCase()
    );
    console.log("[computeMarketShareData] Filtered records:", filteredRecords.length);
  
    // If nothing matches those four filters, return null
    if (!filteredRecords.length) {
      return null;
    }
  
    // 2) For each filtered record, unfold its historical_data into dailyRows
    //    because each day is stored in record.historical_data array
    const dailyRows = [];
    filteredRecords.forEach(record => {
      if (!Array.isArray(record.historical_data)) return;
      record.historical_data.forEach(dayObj => {
        // dayObj typically looks like { date: {value:'YYYY-MM-DD'}, market_share:..., top3_market_share:..., etc. }
        const dateStr = (dayObj.date && dayObj.date.value) ? dayObj.date.value : null;
        if (!dateStr) return; // skip invalid or missing date
  
        // We push a daily object that has “source”, “date”, and whichever share fields we might need.
        dailyRows.push({
          source: record.source?.trim() || "Unknown",
          date: dateStr,
          // The basic "all positions" share:
          market_share: parseFloat(dayObj.market_share) || 0,
          // We can also store top3, below8, etc. if you need them:
          top3_market_share:    parseFloat(dayObj.top3_market_share)    || 0,
          top4_8_market_share:  parseFloat(dayObj.top4_8_market_share)  || 0,
          top9_14_market_share: parseFloat(dayObj.top9_14_market_share) || 0,
          below14_market_share: parseFloat(dayObj.below14_market_share) || 0,
          top8_market_share:    parseFloat(dayObj.top8_market_share)    || 0,
          below8_market_share:  parseFloat(dayObj.below8_market_share)  || 0,
          // ... and so on
        });
      });
    });
  
    // If still no dailyRows, return null
    if (!dailyRows.length) {
      return null;
    }
  
    // 3) Figure out which field to sum up: default is "market_share"
    //    but if filterState.serpSegments is “top3”, we might use “top3_market_share”, etc.
    const mapping = window.serpSegmentMapping || {};
    let shareField = "market_share"; // fallback
    if (fs.serpSegments && mapping[fs.serpSegments]) {
      shareField = mapping[fs.serpSegments].share; 
    }
  
    // 4) Find the overall max date among dailyRows
    let overallMaxDate = null;
    dailyRows.forEach(dr => {
      const d = moment(dr.date, "YYYY-MM-DD");
      if (!overallMaxDate || d.isAfter(overallMaxDate)) {
        overallMaxDate = d.clone();
      }
    });
    if (!overallMaxDate) {
      return null;
    }
  
    // 5) Based on selectedPeriod, define periodStart & periodEnd
    let periodStart, periodEnd;
    if (selectedPeriod === "custom") {
      // Use mainDateRange for custom
      periodStart = mainDateRange.start.clone();
      periodEnd   = mainDateRange.end.clone();
    } else {
      let days = 7; // default
      if (selectedPeriod === "3d")  days = 3;
      if (selectedPeriod === "7d")  days = 7;
      if (selectedPeriod === "30d") days = 30;
      // The current window is (maxDate - (days-1)) to maxDate
      periodEnd   = overallMaxDate.clone();
      periodStart = overallMaxDate.clone().subtract(days - 1, "days");
    }
  
    // Filter dailyRows to those within the final window
    const windowRows = dailyRows.filter(dr => {
      const d = moment(dr.date, "YYYY-MM-DD");
      return d.isBetween(periodStart, periodEnd, "day", "[]"); // inclusive range
    });
    if (!windowRows.length) {
      return null;
    }
  
    // Figure out how many days are in that period
    const dayCount = periodEnd.diff(periodStart, "days") + 1;
  
    // 6) Group by company => sum up share for each day => then average
    const grouped = {}; // { [companyName]: totalShareOverDays }
    windowRows.forEach(dr => {
      const c = dr.source.toLowerCase();
      const shareVal = parseFloat(dr[shareField]) || 0;
      if (!grouped[c]) {
        grouped[c] = 0;
      }
      grouped[c] += shareVal;
    });
  
    // Build a result array: { company, marketShare: X }
    const result = [];
    for (let c in grouped) {
      // Average share over dayCount, then *100 to get a percentage
      const avgShare = (grouped[c] / dayCount) * 100;
      result.push({
        company: c,
        marketShare: parseFloat(avgShare.toFixed(2))
      });
    }
  
// Sort descending by marketShare
    result.sort((a, b) => b.marketShare - a.marketShare);
  
    // 7) If groupSmallCompanies => keep top 5, the rest is "Other"
    if (groupSmallCompanies && result.length > 5) {
      const top5 = result.slice(0, 5);
      const sumTop5 = top5.reduce((sum, r) => sum + r.marketShare, 0);
      const fullSum = result.reduce((sum, r) => sum + r.marketShare, 0);
      const other = fullSum - sumTop5;
  
      const finalCompanies = top5.map(r => r.company);
      const finalShares = top5.map(r => r.marketShare);
  
      if (other > 0) {
        finalCompanies.push("Other");
        finalShares.push(parseFloat(other.toFixed(2)));
      }
      
      // Cache and return result
      const finalResult = {
        companies: finalCompanies,
        marketShares: finalShares,
        totalMarketShare: parseFloat(fullSum.toFixed(2))
      };
      if (cacheKey && window.dataCache) {
        window.dataCache.marketShare[cacheKey] = finalResult;
      }
      return finalResult;
    } else {
      // Return all companies without grouping
      const companies = result.map(item => item.company);
      const marketShares = result.map(item => item.marketShare);
      const total = result.reduce((sum, item) => sum + item.marketShare, 0);
      
      // Cache and return result
      const finalResult = {
        companies,
        marketShares,
        totalMarketShare: parseFloat(total.toFixed(2))
      };
      if (cacheKey && window.dataCache) {
        window.dataCache.marketShare[cacheKey] = finalResult;
      }
      return finalResult;
    }
  }

      function computeMarketShareStackedSeries(fullData, groupSmallCompanies = true) {
        const fs = window.filterState;
      
        // 1) Filter top-level by Q, engine, device, location:
        const filteredRecs = fullData.filter(r =>
          (r.q?.toLowerCase() === fs.searchTerm.toLowerCase()) &&
          (r.engine?.toLowerCase() === fs.engine.toLowerCase()) &&
          (r.device?.toLowerCase() === fs.device.toLowerCase()) &&
          (r.location_requested?.toLowerCase() === fs.location.toLowerCase()) &&
          // Only include records for the selected company if one is set.
          (!fs.company || (r.source && r.source.toLowerCase() === fs.company.toLowerCase()))
        );
        if (!filteredRecs.length) return [];
      
        // 2) Decide which market_share field to use (e.g. top3_market_share vs. market_share)
        let shareField = "market_share";
        if (
          fs.serpSegments &&
          window.serpSegmentMapping &&
          window.serpSegmentMapping[fs.serpSegments]
        ) {
          shareField = window.serpSegmentMapping[fs.serpSegments].share;
        }
      
        // 3) Figure out periodStart & periodEnd from user’s period toggle:
        let periodStart, periodEnd;
        if (selectedPeriod === "custom") {
          periodStart = mainDateRange.start.clone();
          periodEnd = mainDateRange.end.clone();
        } else {
          let days = 7;
          if (selectedPeriod === "3d") days = 3;
          if (selectedPeriod === "7d") days = 7;
          if (selectedPeriod === "30d") days = 30;
          let maxDate = null;
          filteredRecs.forEach(r => {
            if (!r.historical_data) return;
            r.historical_data.forEach(dayObj => {
              if (dayObj.date?.value) {
                const d = moment(dayObj.date.value, "YYYY-MM-DD");
                if (!maxDate || d.isAfter(maxDate)) {
                  maxDate = d.clone();
                }
              }
            });
          });
          if (!maxDate) return [];
          periodEnd = maxDate.clone();
          periodStart = maxDate.clone().subtract(days - 1, "days");
        }
      
        // 4) Build a daily map: dailyMap[date][company] = sumOfShares
        const dailyMap = {};
        filteredRecs.forEach(record => {
          if (!Array.isArray(record.historical_data)) return;
          const cName = (record.source || "Unknown").trim();
          record.historical_data.forEach(dayObj => {
            if (!dayObj.date?.value) return;
            const dateStr = dayObj.date.value;
            const val = parseFloat(dayObj[shareField]) || 0;
            if (!dailyMap[dateStr]) {
              dailyMap[dateStr] = {};
            }
            if (!dailyMap[dateStr][cName]) {
              dailyMap[dateStr][cName] = 0;
            }
            dailyMap[dateStr][cName] += val;
          });
        });
      
        // 5) Gather all dates in ascending order:
        let allDates = Object.keys(dailyMap).sort();
      
        // 6) Filter out dates that are outside [periodStart..periodEnd]
        allDates = allDates.filter(dateStr => {
          const d = moment(dateStr, "YYYY-MM-DD");
          return d.isBetween(periodStart, periodEnd, "day", "[]");
        });
        if (!allDates.length) return [];
      
        // 7) Determine each company’s total share over this date window
        const companyTotals = {};
        allDates.forEach(d => {
          const dailyObj = dailyMap[d];
          for (let comp in dailyObj) {
            if (!companyTotals[comp]) companyTotals[comp] = 0;
            companyTotals[comp] += dailyObj[comp];
          }
        });
        const sortedByTotal = Object.entries(companyTotals).sort((a, b) => b[1] - a[1]);
        const top5 = sortedByTotal.slice(0, 5).map(x => x[0]);
        const isTop5 = c => top5.includes(c);
      
        // 8) Build final series: one for each top-5 company, plus "Other" if grouping
        const seriesMap = {};
        top5.forEach(c => { seriesMap[c] = []; });
        if (groupSmallCompanies) {
          seriesMap["Other"] = [];
        }
      
        // 9) For each date, push the top5’s share and sum the rest into "Other"
        allDates.forEach(d => {
          const dayObj = dailyMap[d];
          let sumOthers = 0;
          top5.forEach(c => {
            const val = dayObj[c] || 0;
            seriesMap[c].push({ x: d, y: val });
          });
          if (groupSmallCompanies) {
            for (let comp in dayObj) {
              if (!isTop5(comp)) {
                sumOthers += dayObj[comp];
              }
            }
            seriesMap["Other"].push({ x: d, y: sumOthers });
          }
        });
      
        // 10) Convert seriesMap into an array for ApexCharts:
        let finalSeries = [];
        for (let compName in seriesMap) {
          finalSeries.push({
            name: compName,
            data: seriesMap[compName]
          });
        }
      
        // 11) Reorder the series so that "Other" is at the very bottom and
        // the companies are sorted in ascending order by their average share,
        // ensuring the highest average appears on top.
        if (finalSeries && finalSeries.length > 0) {
          finalSeries.forEach(series => {
            let total = 0, count = 0;
            series.data.forEach(point => {
              total += point.y;
              count++;
            });
            series.avg = count > 0 ? total / count : 0;
          });
          const otherSeries = finalSeries.find(s => s.name === "Other");
          let rest = finalSeries.filter(s => s.name !== "Other");
          rest.sort((a, b) => a.avg - b.avg);
          if (otherSeries) {
            finalSeries = [otherSeries, ...rest];
          } else {
            finalSeries = rest;
          }
        }
      
        return finalSeries;
      }

    function filterMarketTrends() {
        // Return an empty array if marketTrendsData is not loaded yet
        if (!window.marketTrendsData || !Array.isArray(window.marketTrendsData)) {
          return [];
        }
      
        const fs = window.filterState;
        return window.marketTrendsData.filter(record => {
          return (
            record.q.toLowerCase() === fs.searchTerm.toLowerCase() &&
            record.engine.toLowerCase() === fs.engine.toLowerCase() &&
            record.device.toLowerCase() === fs.device.toLowerCase() &&
            record.location_requested.toLowerCase() === fs.location.toLowerCase()
          );
        });
      } 

window.filterMarketTrends = filterMarketTrends;
window.computeMarketShareData = computeMarketShareData;
window.computeMarketShareStackedSeries = computeMarketShareStackedSeries;
window.buildProjectData = buildProjectData;
window.buildHomeData = buildHomeData;
