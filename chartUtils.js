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

/* ================================
   2) buildHomeDailyAverages()
   ================================ */
   function buildHomeDailyAverages(homeData) {
    // 1) Find maxDate from .endDate
    let maxDate = null;
    homeData.forEach(row => {
      if (row.endDate) {
        const d = moment(row.endDate, "YYYY-MM-DD");
        if (!maxDate || d.isAfter(maxDate)) {
          maxDate = d.clone();
        }
      }
    });
    if (!maxDate) return [];
  
    // 2) Build [periodStart..periodEnd] as last 30 days
    const periodEnd   = maxDate.clone();
    const periodStart = maxDate.clone().subtract(29, "days");
  
    // 3) dailyMap => date => { sumDesk, countDesk, sumMob, countMob } (example for desktop/mobile)
    const dailyMap = {};
    let cursor = periodStart.clone();
    const allDates = [];
    while (cursor.isSameOrBefore(periodEnd, "day")) {
      const ds = cursor.format("YYYY-MM-DD");
      dailyMap[ds] = { sumDesk:0, countDesk:0, sumMob:0, countMob:0 };
      allDates.push(ds);
      cursor.add(1,"days");
    }
  
    // 4) For each row => row.last30shares
    homeData.forEach(row => {
      const dev = row.device.toLowerCase();
      if (!row.last30shares || row.last30shares.length !== 30) return;
  
      // index 0 => earliest of the 30, index 29 => latest
      for (let i=0; i<30; i++) {
        const dayStr = periodStart.clone().add(i, "days").format("YYYY-MM-DD");
        const shareVal = row.last30shares[i] || 0;
        if (dev === "desktop" && shareVal>0) {
          dailyMap[dayStr].sumDesk += shareVal;
          dailyMap[dayStr].countDesk++;
        } else if (dev === "mobile" && shareVal>0) {
          dailyMap[dayStr].sumMob += shareVal;
          dailyMap[dayStr].countMob++;
        }
      }
    });
  
    // 5) Convert dailyMap => array: { date, deskAvg, mobAvg, totalAvg }
    const results = [];
    allDates.forEach(ds => {
      const obj = dailyMap[ds];
      const deskAvg = obj.countDesk? (obj.sumDesk / obj.countDesk) : 0;
      const mobAvg  = obj.countMob?  (obj.sumMob  / obj.countMob)  : 0;
      const totalCount = obj.countDesk + obj.countMob;
      const totalSum   = obj.sumDesk   + obj.sumMob;
      const totalAvg   = totalCount ? (totalSum / totalCount) : 0;
      results.push({ date: ds, deskAvg, mobAvg, totalAvg });
    });
  
    return results;
  }
  
  
  /* ================================
     3) buildHomeDailyRankAverages()
     ================================ */
  function buildHomeDailyRankAverages(homeData) {
    let maxDate = null;
    homeData.forEach(row => {
      if (row.endDate) {
        const d = moment(row.endDate, "YYYY-MM-DD");
        if (!maxDate || d.isAfter(maxDate)) {
          maxDate = d.clone();
        }
      }
    });
    if (!maxDate) return [];
  
    const periodEnd = maxDate.clone();
    const periodStart = maxDate.clone().subtract(29,"days");
  
    const dailyMap = {};
    let run = periodStart.clone();
    const allDates = [];
    while (run.isSameOrBefore(periodEnd,"day")) {
      const ds = run.format("YYYY-MM-DD");
      dailyMap[ds] = { sumDesk:0, countDesk:0, sumMob:0, countMob:0 };
      allDates.push(ds);
      run.add(1,"days");
    }
  
    homeData.forEach(row => {
      const dev = row.device.toLowerCase();
      if (!row.last30ranks || row.last30ranks.length !== 30) return;
      for (let i=0; i<30; i++) {
        const ds = periodStart.clone().add(i,"days").format("YYYY-MM-DD");
        const rVal = row.last30ranks[i];
        if (!rVal || rVal<=0) continue;
        if (dev==="desktop") {
          dailyMap[ds].sumDesk  += rVal;
          dailyMap[ds].countDesk++;
        } else if (dev==="mobile") {
          dailyMap[ds].sumMob   += rVal;
          dailyMap[ds].countMob++;
        }
      }
    });
  
    const output = [];
    allDates.forEach(ds => {
      const o = dailyMap[ds];
      const deskRank = o.countDesk? (o.sumDesk / o.countDesk) : 40;
      const mobRank  = o.countMob?  (o.sumMob  / o.countMob ) : 40;
      const totalCount = o.countDesk + o.countMob;
      const totalSum   = o.sumDesk   + o.sumMob;
      const overall    = totalCount? (totalSum / totalCount) : 40;
      output.push({ date: ds, deskRank, mobRank, avgRank: overall });
    });
    return output;
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

  function findOverallMaxDateInCompanyStats(companyStats) {
    let maxD = null;
    companyStats.forEach(row => {
      if (!row.historical_data) return;
      row.historical_data.forEach(d => {
        const mm = moment(d.date.value, "YYYY-MM-DD");
        if (!maxD || mm.isAfter(maxD)) {
          maxD = mm.clone();
        }
      });
    });
    return maxD;
  } 

/* ================================
   8) computeHomeTotalAvgShare()
   ================================ */
   function computeHomeTotalAvgShare(homeData) {
    if (!homeData.length) return 0;
    let sum=0, count=0;
    homeData.forEach(r => {
      sum += r.avgShare;
      count++;
    });
    return count ? (sum/count) : 0;
  }
  
  /* ================================
     9) computeHomeShareTrendVal()
     ================================ */
  function computeHomeShareTrendVal(homeData) {
    // For a 14-day window, compare last7 vs prev7
    // Or do more advanced logic
    const daily = buildHomeDailyAverages(homeData);
    if (daily.length<14) return 0;
    const last7 = daily.slice(-7);
    const prev7 = daily.slice(-14, -7);
    const curSum = last7.reduce((acc,d)=> acc+d.totalAvg, 0);
    const prvSum = prev7.reduce((acc,d)=> acc+d.totalAvg, 0);
    const curAvg = curSum/7, prvAvg= prvSum/7;
    return curAvg - prvAvg;
  }  
