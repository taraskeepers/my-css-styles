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

  /* ================================
   5) renderHomePieChart()
   ================================ */
function renderHomePieChart(homeData, canvasSelector) {
  const canvasEl = document.querySelector(canvasSelector);
  if (!canvasEl) {
    console.warn("[renderHomePieChart] Canvas element not found:", canvasSelector);
    return;
  }

  // If an old chart instance exists, destroy:
  if (canvasEl._chartInstance) {
    canvasEl._chartInstance.destroy();
  }

  // Summarize average share => e.g. compute totalAvg
  const companyAvg = computeHomeTotalAvgShare(homeData);
  const remainder  = 100 - companyAvg;

  const data = {
    labels: ["My Company", "Others"],
    datasets: [{
      data: [companyAvg, remainder],
      backgroundColor: ["#007aff", "#dddddd"],
      borderWidth: 1,
      offset: [15, 0] // pop out the first slice
    }]
  };

  const config = {
    type: "pie",
    data,
    options: {
      plugins: {
        legend: { display: false },
        tooltip: { enabled: false },
        datalabels: {
          formatter: (val, ctx) => {
            if (ctx.dataIndex === 0) { 
              return val.toFixed(1) + "%";
            }
            return "";
          },
          color: "#000",
          font: { size: 16, weight: "bold" }
        }
      }
    },
    plugins: [ChartDataLabels]
  };

  const ctx = canvasEl.getContext("2d");
  canvasEl._chartInstance = new Chart(ctx, config);

  // Optionally, show the “trend arrow” below the pie
  const parentDiv = canvasEl.parentElement;
  const oldTrendDiv = parentDiv.querySelector(".home-pie-trend");
  if (oldTrendDiv) oldTrendDiv.remove();

  const trendVal = computeHomeShareTrendVal(homeData);
  let arrow="", color="#666";
  if (trendVal>0) { arrow="▲"; color="green"; }
  else if (trendVal<0) { arrow="▼"; color="red"; }

  const diffVal = Math.abs(trendVal).toFixed(2) + "%";
  const div = document.createElement("div");
  div.className = "home-pie-trend";
  div.style.textAlign = "center";
  div.style.fontWeight = "bold";
  div.style.marginTop = "6px";

  if (!arrow) {
    div.textContent = "±0.00%";
  } else {
    div.innerHTML = `<span style="color:${color};">${arrow} ${diffVal}</span>`;
  }
  parentDiv.appendChild(div);
}

/* ================================
   6) renderHomeMarketShareChart()
   ================================ */
   function renderHomeMarketShareChart(homeData, containerSelector) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
  
    // Destroy old instance
    if (container._chartInstance) {
      container._chartInstance.destroy();
    }
  
    // Build daily array
    const dailyArr = buildHomeDailyAverages(homeData);
    if (!Array.isArray(dailyArr) || !dailyArr.length) {
      container.innerHTML = "<p>No daily data for home market share</p>";
      return;
    }
  
    const allDevices = dailyArr.map(d => ({ x: d.date, y: d.totalAvg }));
    const deskSeries = dailyArr.map(d => ({ x: d.date, y: d.deskAvg  }));
    const mobSeries  = dailyArr.map(d => ({ x: d.date, y: d.mobAvg   }));
  
    const finalSeries = [
      { name: "All Devices", data: allDevices },
      { name: "Desktop Only", data: deskSeries },
      { name: "Mobile Only", data: mobSeries }
    ];
  
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
  
      items.sort((a, b) => b.currentVal - a.currentVal);
  
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
  
    const options = {
      series: finalSeries,
      chart: {
        type: "area",
        stacked: true,
        width: 920,
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
      dataLabels: {
        enabled: true,
        enabledOnSeries: [0],
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
      markers: {
        size: [5, 0, 0]
      },
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.75, opacityTo: 0.95 }
      },
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
        show: false
      },
      tooltip: {
        custom: customTooltip
      }
    };
  
    container.innerHTML = "";
    const chart = new ApexCharts(container, options);
    chart.render();
    container._chartInstance = chart;
  }

      function renderMarketShareStackedArea(marketData) {
        // 1) Grab the chart container
        const chartEl = document.getElementById("marketShareChart");
        if (!chartEl) return;
      
        // 2) Destroy any old chart instance
        if (window.marketShareChartInstance) {
          window.marketShareChartInstance.destroy();
          window.marketShareChartInstance = null;
        }
      
        // We'll do a 30-day window (same as big chart)
        const days = 30;
      
        // 3) Filter by current filterState (searchTerm, engine, device, location)
        const fs = window.filterState || {};
        const filtered = (marketData || []).filter(r =>
          (r.q?.toLowerCase() === fs.searchTerm?.toLowerCase()) &&
          (r.engine?.toLowerCase() === fs.engine?.toLowerCase()) &&
          (r.device?.toLowerCase() === fs.device?.toLowerCase()) &&
          (r.location_requested?.toLowerCase() === fs.location?.toLowerCase())
        );
        if (!filtered.length) {
          chartEl.innerHTML = "<p>No data found for marketShareChart</p>";
          return;
        }
      
        // 4) Find the max date => define [periodStart..periodEnd]
        let maxDate = null;
        filtered.forEach(rec => {
          (rec.historical_data || []).forEach(d => {
            const m = moment(d.date.value, "YYYY-MM-DD");
            if (!maxDate || m.isAfter(maxDate)) {
              maxDate = m.clone();
            }
          });
        });
        if (!maxDate) {
          chartEl.innerHTML = "<p>No valid dates for marketShareChart</p>";
          return;
        }
        const periodEnd   = maxDate.clone();
        const periodStart = maxDate.clone().subtract(days - 1, "days");
      
        // 5) Decide which shareField to use based on serpSegments
        let shareField = "market_share"; // default for top40
        if (fs.serpSegments) {
          switch (fs.serpSegments) {
            case "top3":
              shareField = "top3_market_share";
              break;
            case "top4-8":
              shareField = "top4_8_market_share";
              break;
            case "top9-14":
              shareField = "top9_14_market_share";
              break;
            case "below14":
              shareField = "below14_market_share";
              break;
            case "top8":
              shareField = "top8_market_share";
              break;
            case "below8":
              shareField = "below8_market_share";
              break;
            default:
              shareField = "market_share";
          }
        }
      
        // 6) Build dailyMap[date][companyName] = sumOfShare (in %)
        const dailyMap = {};
        filtered.forEach(rec => {
          (rec.historical_data || []).forEach(d => {
            const dd = moment(d.date.value, "YYYY-MM-DD");
            if (!dd.isBetween(periodStart, periodEnd, "day", "[]")) return;
            const val = (parseFloat(d[shareField]) || 0) * 100; // convert to percentage
            const dateStr = dd.format("YYYY-MM-DD");
            if (!dailyMap[dateStr]) dailyMap[dateStr] = {};
            const cName = (rec.source || "Unknown").trim();
            if (!dailyMap[dateStr][cName]) dailyMap[dateStr][cName] = 0;
            dailyMap[dateStr][cName] += val;
          });
        });
      
        // 7) Gather all unique dates in ascending order
        let allDates = Object.keys(dailyMap).sort();
        if (!allDates.length) {
          chartEl.innerHTML = "<p>No market share in this date range</p>";
          return;
        }
      
        // 8) Sum total share by company => pick top 5
        const companyTotals = {};
        allDates.forEach(dateStr => {
          const dayObj = dailyMap[dateStr];
          Object.entries(dayObj).forEach(([cName, val]) => {
            if (!companyTotals[cName]) companyTotals[cName] = 0;
            companyTotals[cName] += val;
          });
        });
        // Sort descending => top 5
        const sortedByTotal = Object.entries(companyTotals).sort((a,b) => b[1] - a[1]);
        const top5 = sortedByTotal.slice(0, 5).map(x => x[0]);
        const isTop5 = c => top5.includes(c);
      
        // If user selected a specific company not in top5, push it in
        const selectedCoRaw = (fs.company || "").trim();
        const selectedCo = selectedCoRaw.toLowerCase();
        if (
          selectedCo &&
          !top5.map(c => c.toLowerCase()).includes(selectedCo)
        ) {
          top5.push(selectedCoRaw);
        }
      
        // 9) Build final seriesMap => group everything else into "Others"
        const seriesMap = {};
        top5.forEach(c => { seriesMap[c] = []; });
        seriesMap["Others"] = [];
      
        allDates.forEach(dateStr => {
          const dayObj = dailyMap[dateStr];
          let sumOthers = 0;
      
          // add top5 + selected to their series
          top5.forEach(c => {
            const val = dayObj[c] || 0;
            if (!seriesMap[c]) seriesMap[c] = []; // just in case
            seriesMap[c].push({ x: dateStr, y: val });
          });
      
          // for all leftover companies not in top5 & not the selectedCo
          Object.keys(dayObj).forEach(cName => {
            if (!top5.includes(cName) && cName.toLowerCase() !== selectedCo) {
              sumOthers += dayObj[cName];
            }
          });
          seriesMap["Others"].push({ x: dateStr, y: sumOthers });
        });
      
        // 10) Convert seriesMap => finalSeries array
        let finalSeries = [];
        for (let cName in seriesMap) {
          finalSeries.push({
            name: cName,
            data: seriesMap[cName]
          });
        }
      
        // 11) If user selected a company => move that series to bottom + color it
        if (selectedCo) {
          const selIndex = finalSeries.findIndex(s => s.name.toLowerCase() === selectedCo);
          if (selIndex >= 0) {
            // 1) Splice out the selected series
            const [ selectedObj ] = finalSeries.splice(selIndex, 1);
            // 2) Insert at front => bottom of the stacked area
            finalSeries.unshift(selectedObj);
            // 3) Color the selected vs. grey for others
            finalSeries.forEach((seriesObj, i) => {
              if (i === 0) {
                // the selected co => color standard
                seriesObj.color = "#007aff";
              } else {
                // lighter grey
                const greyLevel = 180 + i * 8;
                const capped    = Math.min(greyLevel, 230);
                seriesObj.color = `rgb(${capped},${capped},${capped})`;
              }
            });
          }
        }
      
        // 12) We keep the advanced custom tooltip styling, but reduce spacing + font
        function customTooltip({ series, dataPointIndex, w }) {
          const formattedDate = w.globals.labels[dataPointIndex] || "";
      
          let tooltipItems = [];
          for (let i = 0; i < series.length; i++) {
            const companyName = w.config.series[i].name;
            const seriesColor = w.globals.colors?.[i] || "#007aff";
            const currentValue= series[i][dataPointIndex];
            const prevVal     = dataPointIndex > 0 ? series[i][dataPointIndex - 1] : null;
            let trendStr      = "";
            if (prevVal !== null) {
              let diff = currentValue - prevVal;
              if (diff > 0) {
                trendStr = "▲ " + diff.toFixed(2) + "%";
              } else if (diff < 0) {
                trendStr = "▼ " + Math.abs(diff).toFixed(2) + "%";
              } else {
                trendStr = "±0.00%";
              }
            }
            tooltipItems.push({ companyName, currentValue, trendStr, seriesColor });
          }
      
          // sort descending
          let sortedItems = tooltipItems.slice().sort((a, b) => b.currentValue - a.currentValue);
          // separate "Others"
          let othersItems = sortedItems.filter(x => x.companyName.toLowerCase() === "others");
          let nonOthers   = sortedItems.filter(x => x.companyName.toLowerCase() !== "others");
      
          // assign rank to non-others
          nonOthers.forEach((item, idx) => {
            item.rank = idx + 1;
          });
          let finalItems = nonOthers.concat(othersItems);
      
          // smaller spacing, smaller font
          let html = `
            <div style="
              padding: 8px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f9f9f9;
              border: 1px solid #ddd;
              border-radius: 8px;
              box-shadow: 0 4px 8px rgba(0,0,0,0.08);
            ">
              <div style="margin-bottom: 4px; font-size: 12px; color: #333;">
                ${formattedDate}
              </div>
              <table style="
                width: 100%;
                border-collapse: collapse;
                font-size: 12px;
                color: #333;
              ">
          `;
      
          finalItems.forEach(item => {
            let rankHtml = "";
            if (item.companyName.toLowerCase() !== "others") {
              rankHtml = `
                <span style="
                  display:inline-block;
                  width:20px; height:20px; line-height:20px;
                  border-radius:10px;
                  background:${item.seriesColor};
                  color:#fff;
                  text-align:center;
                  margin-right:6px;
                  font-weight:bold;
                  font-size:12px;
                ">
                  ${item.rank}
                </span>
              `;
            }
            let trendColored = item.trendStr;
            if (trendColored.startsWith("▲")) {
              trendColored = `<span style="color:green;">${trendColored}</span>`;
            } else if (trendColored.startsWith("▼")) {
              trendColored = `<span style="color:red;">${trendColored}</span>`;
            }
      
            html += `
              <tr>
                <td style="padding:2px 4px; vertical-align:middle;">
                  ${rankHtml}<strong>${item.companyName}</strong>
                </td>
                <td style="padding:2px 4px; text-align:right; vertical-align:middle;">
                  ${item.currentValue.toFixed(2)}% ${trendColored}
                </td>
              </tr>
            `;
          });
      
          html += `</table></div>`;
          return html;
        }
      
        // 13) Build the ApexCharts config
        // If the user selected a single company => show point labels like big chart
        const userSelectedCompany = (fs.company && fs.company.trim() !== "");
      
        const options = {
          series: finalSeries,
          chart: {
            type: "area",
            stacked: true,
            width: "100%",
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
          dataLabels: userSelectedCompany
            ? {
                enabled: true,
                formatter: function(val, opts) {
                  // Only label the BOTTOM series (seriesIndex=0) if you want that
                  if (opts.seriesIndex === 0) {
                    return val.toFixed(2) + "%";
                  }
                  return "";
                },
                offsetY: -5,
                style: {
                  fontSize: "12px",
                  colors: ["#000"]
                }
              }
            : { enabled: false },
          // Markers logic like big chart => bigger markers if user selected
          markers: userSelectedCompany
            ? {
                size: finalSeries.map((s, i) => (i === 0 ? 6 : 0))
              }
            : { size: 0 },
          stroke: {
            curve: "smooth",
            width: 2
          },
          fill: {
            type: "gradient",
            gradient: { opacityFrom: 0.75, opacityTo: 0.95 }
          },
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
            show: false
          },
          tooltip: {
            custom: customTooltip
          }
        };
      
        // 14) Clear the container + build the chart
        chartEl.innerHTML = "";
        window.marketShareChartInstance = new ApexCharts(chartEl, options);
        window.marketShareChartInstance.render();
      } 

      function renderCompanyChart() {
        let marketData = window.companyStatsData;
        if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
          return;
        }
        
        const unified = computeMarketShareData(marketData, false);
        if (!unified) {
          return;
        }
      
        // Now build the bar chart options.
        const options = {
            series: [{ data: unified.marketShares }],
            chart: {
              type: 'bar',
              // Use the full list – you might want to adjust the height
              height: unified.companies.length * 25,
              width: '100%',
              toolbar: { show: false }
            },
            grid: { show: false },
            plotOptions: {
              bar: {
                horizontal: true,
                barHeight: '70%',
                borderRadius: 4
              }
            },
            dataLabels: {
              enabled: true,
              formatter: function(val) {
                return val.toFixed(2) + '%';
              },
              offsetX: 5,
              style: { fontSize: '12px', colors: ['#000'] }
            },
            xaxis: {
              categories: unified.companies,
              labels: { show: false },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            tooltip: {
              y: {
                formatter: function(val) {
                  return val + '%';
                }
              }
            }
          };
      
        const chartEl = document.querySelector("#marketShareChart");
        if (window.companyChartInstance) {
          window.companyChartInstance.destroy();
        }
        window.companyChartInstance = new ApexCharts(chartEl, options);
        window.companyChartInstance.render();
      }
