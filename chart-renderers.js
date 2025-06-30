  function renderCompanyMarketShareChart(company) {
    // 1) Get the container where the chart will be rendered
    const container = document.getElementById("company-market-share-" + company.companyId);
    if (!container) return;
  
    // 2) Determine the user’s currently selected period
    //    (Assuming you track this in window.filterState.period, e.g. "3d", "7d", "30d".)
    const period = window.filterState.period || "7d";
    let days = 7;
    if (period === "3d")   days = 3;
    if (period === "30d")  days = 30;
  
    // 3) Find the latest date in this company’s historical_data
    //    (If none found, we can’t build a daily timeseries.)
    let maxDate = null;
    (company.historical_data || []).forEach(dayObj => {
      if (dayObj.date && dayObj.date.value) {
        const d = moment(dayObj.date.value, "YYYY-MM-DD");
        if (!maxDate || d.isAfter(maxDate)) {
          maxDate = d.clone();
        }
      }
    });
    if (!maxDate) return;  // no valid dates => nothing to plot
  
    // 4) Define the date window based on the selected period
    const periodEnd   = maxDate.clone();
    const periodStart = maxDate.clone().subtract(days - 1, "days");
  
    // 5) Gather daily data for each day in [periodStart..periodEnd].
    //    We want values for top3_market_share, top4_8_market_share, top9_14_market_share,
    //    below14_market_share, and market_share (i.e. “Top 40”).
    //    Each is multiplied by 100 to turn it into a percentage.
    const dailyMap = {};
    (company.historical_data || []).forEach(dayObj => {
      if (!dayObj.date || !dayObj.date.value) return;
      const d = moment(dayObj.date.value, "YYYY-MM-DD");
      if (d.isBetween(periodStart, periodEnd, "day", "[]")) {
        dailyMap[dayObj.date.value] = {
          top3:     parseFloat(dayObj.top3_market_share)    * 100 || 0,
          top4_8:   parseFloat(dayObj.top4_8_market_share)  * 100 || 0,
          top9_14:  parseFloat(dayObj.top9_14_market_share) * 100 || 0,
          below14:  parseFloat(dayObj.below14_market_share) * 100 || 0,
          top40:    parseFloat(dayObj.market_share)         * 100 || 0
        };
      }
    });
  
    // 6) Build an array of every date within that window
    const allDates = [];
    let curr = periodStart.clone();
    while (curr.isSameOrBefore(periodEnd, "day")) {
      allDates.push(curr.format("YYYY-MM-DD"));
      curr.add(1, "days");
    }
  
    // 7) Build 5 separate series for the stacked area
    const top3Series     = [];
    const top4_8Series   = [];
    const top9_14Series  = [];
    const below14Series  = [];
    const top40Series    = [];
  
    allDates.forEach(dateStr => {
      const entry = dailyMap[dateStr] || {};
      top3Series.push({
        x: dateStr,
        y: entry.top3 || 0
      });
      top4_8Series.push({
        x: dateStr,
        y: entry.top4_8 || 0
      });
      top9_14Series.push({
        x: dateStr,
        y: entry.top9_14 || 0
      });
      below14Series.push({
        x: dateStr,
        y: entry.below14 || 0
      });
      top40Series.push({
        x: dateStr,
        y: entry.top40 || 0
      });
    });
  
    // 8) Construct the ApexCharts configuration for a stacked area chart
    const options = {
      series: [
        { name: "Top 40",    data: top40Series }
      ],
      chart: {
        type: "area",
        stacked: true,
        width: "100%",         // Fill the entire container width
        height: 140,        // If your container has a set height
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: false }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        curve: "smooth",
        width: 2
      },
      fill: {
        type: 'solid',
        opacity: 0.5
      },
      xaxis: {
        type: "datetime",
        labels: { show: false } // Hide x-axis labels
      },
      yaxis: {
        labels: { show: false }, // Hide y-axis labels
        show: false              // In some versions, must set `show:false` also
      },
      grid: {
        show: false             // No grid lines
      },
      legend: {
        show: false             // Hide the legend if desired
      },
      tooltip: {
        shared: true,
        x: { format: "yyyy-MM-dd" },
        y: {
          formatter: function (val) {
            return val.toFixed(2) + "%";
          }
        }
      }
    };
  
    // 9) If there's a previous chart instance in this container, destroy it first
    if (container._chartInstance) {
      container._chartInstance.destroy();
    }
  
    // 10) Create and render the new ApexCharts instance
    const chart = new ApexCharts(container, options);
    chart.render();
    container._chartInstance = chart;
  } 

/**
 * Revised renderSegmentMarketShareChart function.
 * 
 * Changes:
 * - Only market share is an area chart (blue gradient) with point labels
 * - Products is a bold line (no point labels)
 * - Rank is a step-style line (bold, each rank value rounded)
 * - X-axis has date labels styled like renderMarketShareStackedArea
 */
 function renderSegmentMarketShareChart(company, segmentName, container) {
    // 1) Determine fields to use for share, products, rank, based on segment
    let shareField = "market_share";
    let productsField = "avg_products";
    let rankField = "rank";
  
    switch (segmentName) {
      case "top3":
        shareField = "top3_market_share";
        productsField = "top3_avg_products";
        rankField = "top3_rank";
        break;
      case "top4_8":
      case "top4-8":
        shareField = "top4_8_market_share";
        productsField = "top4_8_avg_products";
        rankField = "top4_8_rank";
        break;
      case "top9_14":
        shareField = "top9_14_market_share";
        productsField = "top9_14_avg_products";
        rankField = "top9_14_rank";
        break;
      case "below14":
        shareField = "below14_market_share";
        productsField = "below14_avg_products";
        rankField = "below14_rank";
        break;
      case "top8":
        shareField = "top8_market_share";
        productsField = "top8_avg_products";
        rankField = "top8_rank";
        break;
      case "below8":
        shareField = "below8_market_share";
        productsField = "below8_avg_products";
        rankField = "below8_rank";
        break;
      default:
        // default -> top40
        shareField = "market_share";
        productsField = "avg_products";
        rankField = "rank";
    }
  
    // 2) Make sure we have some historical data
    const hist = Array.isArray(company.historical_data) ? company.historical_data : [];
    if (!hist.length) {
      container.innerHTML = "<p>No historical data for this company/segment.</p>";
      return;
    }
  
    // 3) Decide the time window from filterState (3d, 7d, 30d, etc.)
    let days = 7; // default to 7d
    if (window.filterState && window.filterState.period) {
      if (window.filterState.period === "3d") days = 3;
      if (window.filterState.period === "30d") days = 30;
    }
  
    // 4) Find the latest date => define [start..end]
    let maxDate = null;
    hist.forEach((d) => {
      if (d.date && d.date.value) {
        const dt = moment(d.date.value, "YYYY-MM-DD");
        if (!maxDate || dt.isAfter(maxDate)) {
          maxDate = dt.clone();
        }
      }
    });
    if (!maxDate) {
      container.innerHTML = "<p>No valid dates found.</p>";
      return;
    }
    const periodEnd = maxDate.clone();
    const periodStart = maxDate.clone().subtract(days - 1, "days");
  
    // 5) Build dailyMap => for each date in [start..end], gather share/products/rank
    const dailyMap = {};
    hist.forEach((dayObj) => {
      if (!dayObj.date || !dayObj.date.value) return;
      const d = moment(dayObj.date.value, "YYYY-MM-DD");
      if (d.isBetween(periodStart, periodEnd, "day", "[]")) {
        const dateStr = d.format("YYYY-MM-DD");
        if (!dailyMap[dateStr]) {
          dailyMap[dateStr] = { share: 0, prod: 0, rank: 40 };
        }
        dailyMap[dateStr].share =
          (parseFloat(dayObj[shareField]) || 0) * 100; // convert to %
        dailyMap[dateStr].prod = parseFloat(dayObj[productsField]) || 0;
  
        // round rank
        let rawRank = dayObj[rankField];
        if (rawRank == null) rawRank = 40;
        dailyMap[dateStr].rank = Math.round(rawRank);
      }
    });
  
    // 6) Build a sorted array of dates
    const allDates = [];
    let curr = periodStart.clone();
    while (curr.isSameOrBefore(periodEnd, "day")) {
      allDates.push(curr.format("YYYY-MM-DD"));
      curr.add(1, "days");
    }
  
    // 7) Build final series arrays
    const shareSeries = [];
    const prodSeries = [];
    const rankSeries = [];
  
    allDates.forEach((dateStr) => {
      const entry = dailyMap[dateStr] || { share: 0, prod: 0, rank: 40 };
      shareSeries.push({ x: dateStr, y: entry.share });
      prodSeries.push({ x: dateStr, y: entry.prod });
      rankSeries.push({ x: dateStr, y: entry.rank });
    });
  
    // 8) Destroy old chart if any
    if (container._chartInstance) {
      container._chartInstance.destroy();
    }
  
    // 9) Build the ApexCharts config, mimicking renderMarketShareStackedArea
    const options = {
      series: [
        {
          name: "Market Share",
          type: "area",
          data: shareSeries,
          // We'll style the area in "stroke" & "fill" below
        },
        {
          name: "Products",
          type: "line",
          data: prodSeries,
        },
        {
          name: "Rank",
          type: "line",
          data: rankSeries,
        },
      ],
      chart: {
        height: 150,
        width: "100%",
        type: "line",
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      // Lines: 1st = area => smooth, 2nd = bold line => smooth, 3rd = step => bold
      stroke: {
        curve: ["smooth", "smooth", "stepline"], // rank is step
        width: [3, 4, 4], // area stroke=3, products=4, rank=4
      },
      // Let the area series have a gradient fill
      fill: {
        type: ["gradient", "solid", "solid"], // 1st is gradient, others solid
        gradient: {
          shadeIntensity: 0.4,
          opacityFrom: 0.9,
          opacityTo: 0.2,
          colorStops: [
            {
              offset: 0,
              color: "#007aff",
              opacity: 0.9,
            },
            {
              offset: 100,
              color: "#007aff",
              opacity: 0.2,
            },
          ],
        },
      },
      colors: ["#007aff", "#333", "#d9534f"], // 1) market share blue, 2) products dark, 3) rank redish?
      markers: {
        // We'll show marker points on the area so that dataLabels appear near them
        size: [4, 0, 0], // only for market share, none for products or rank
      },
      dataLabels: {
        enabled: true,
        // Only show labels on the first (area) series
        enabledOnSeries: [0],
        formatter: function (val) {
          return val.toFixed(2) + "%";
        },
        offsetY: -5,
        style: {
          fontSize: "12px",
          colors: ["#000"],
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          show: true,
          style: {
            fontSize: "12px",
            colors: ["#666"],
          },
        },
        axisTicks: { show: false },
        axisBorder: { show: false },
      },
      yaxis: [
        {
          show: false,
          min: 0,
        },
        {
          show: false,
        },
        {
          show: false,
          opposite: true,
          reversed: true,
          min: 0,
          max: 40, // or 50 if you have higher ranks
        },
      ],
      grid: {
        show: false,
      },
      legend: {
        show: false,
      },
      tooltip: {
        shared: true,
        x: { format: "yyyy-MM-dd" },
        y: [
          {
            // Market share
            formatter: function (val) {
              return val.toFixed(1) + "%";
            },
          },
          {
            // Products
            formatter: function (val) {
              return val.toFixed(1) + " prod";
            },
          },
          {
            // Rank
            formatter: function (val) {
              return "Rank: " + val.toFixed(0);
            },
          },
        ],
      },
    };
  
    // 10) Create + render the new chart
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

 function renderMarketSharePieChartInDetails(company) {
    // 1) Find the <canvas> with ID "pieChart-<companyId>"
    const canvas = document.getElementById("pieChart-" + company.companyId);
    if (!canvas) {
      // If no canvas found, just skip
      return;
    }
  
    // 2) If there's an old chart instance here, destroy it first
    if (canvas._chartInstance) {
      canvas._chartInstance.destroy();
    }
  
    // 3) Convert company.marketShare to a numeric value
    //    If your data is e.g. "35.2", parse it; fallback to 0 if missing
    const mainPct = parseFloat(company.marketShare) || 0;
    const otherPct = 100 - mainPct;
  
    // 4) Prepare the Chart.js data config
    const data = {
      labels: [
        `Main (${mainPct.toFixed(1)}%)`,
        `Remaining (${otherPct.toFixed(1)}%)`
      ],
      datasets: [{
        data: [ mainPct, otherPct ],
        backgroundColor: [ 'rgb(2,122,255)', '#FFFFFF' ],
        borderColor: [ 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.2)' ],
        borderWidth: 1,
        offset: [20, 0] // optional pop-out effect for the first slice
      }]
    };
  
    // 5) Build the Chart.js config object
    const config = {
        type: "pie",
        data: data,
        options: {
          // remove the tooltip entirely
          plugins: {
            tooltip: {
              enabled: false
            },
            legend: {
              display: false
            },
            // We'll show a single datalabel on the main slice only
            datalabels: {
              formatter: (value, ctx) => {
                // If slice #0 => show numeric, else hide
                if (ctx.dataIndex === 0) {
                  return value.toFixed(1) + "%";
                }
                return "";
              },
              color: "#000", // black text on the main slice
              font: {
                weight: "bold",
                size: 16
              }
            }
          },
          animation: {
            animateRotate: true,
            duration: 800
          }
        },
        plugins: [ChartDataLabels]
      };
  
    // 6) Create the chart
    const ctx = canvas.getContext("2d");
    const pieChart = new Chart(ctx, config);
  
    // 7) Store reference so we can destroy it next time
    canvas._chartInstance = pieChart;
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

      function renderCompaniesTrendChart(latestDate) {
        // 1) If an existing chart instance exists, destroy it first.
        if (window.companiesTrendChartInstance) {
          window.companiesTrendChartInstance.destroy();
        }
      
        const ctx = document.getElementById('companiesTrendChart').getContext('2d');
        const trendData = buildCompaniesTrendData(14, latestDate);
        const labels = trendData.map(d => d.date);
        const dataValues = trendData.map(d => d.count);
      
        // 2) Create a new chart and store it in the global var so 
        //    we can destroy it next time.
        window.companiesTrendChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: labels,
            datasets: [
              {
                data: dataValues,
                borderColor: '#007aff',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHitRadius: 10
              }
            ]
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            layout: {
                padding: 0  // remove extra padding around the chart
              },
            scales: {
                x: {
                    display: false,
                    offset: false // <— Turn off “offset” so there’s no gap at the edges
                  },
              y: { display: false, beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: { display: false },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.7)',
                displayColors: false,
                titleColor: '#fff',
                bodyColor: '#fff',
                bodyFont: { size: 11 },
                titleFont: { size: 11 },
                borderRadius: 6,
              }
            }
          }
        });
      }                        

      function renderProductsTrendChart(latestDate) {
        if (window.productsTrendChartInstance) {
            window.productsTrendChartInstance.destroy();
          }
        const ctx = document.getElementById('productsTrendChart').getContext('2d');
        const trend = buildProductsTrendData(14, latestDate);
        
        window.productsTrendChartInstance = new Chart(ctx, {
          type: 'line',
          data: {
            labels: trend.dates,
            datasets: [
              {
                label: 'Un Products',
                data: trend.unProducts,
                borderColor: '#007aff',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0,
                pointHitRadius: 10
              },
              {
                label: 'On Sale',
                data: trend.unProductsOnSale,
                borderColor: 'red',
                borderWidth: 2,
                fill: false,
                tension: 0.3,
                pointRadius: 0
              }
            ]
          },
          options: {
            responsive: false,
            maintainAspectRatio: false,
            layout: {
                padding: 0  // remove extra padding around the chart
              },
              scales: {
                x: {
                  display: false,
                  offset: false // <— Turn off “offset” so there’s no gap at the edges
                },
              y: { display: false, beginAtZero: true }
            },
            plugins: {
              legend: { display: false },
              datalabels: {
                display: false
              },
              tooltip: {
                enabled: true,
                mode: 'index',
                intersect: false,
                backgroundColor: 'rgba(0,0,0,0.7)',
                displayColors: false,
                titleColor: '#fff',
                bodyColor: '#fff',
                bodyFont: { size: 11 },
                titleFont: { size: 11 },
                borderRadius: 6,
                callbacks: {
                    label: function(context) {
                      return context.dataset.label + ": " + context.parsed.y.toFixed(2) + "%";
                    }
                }
              }
            }
          }
        });
      }

