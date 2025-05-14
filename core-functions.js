/* core functions */

    // The core rendering logic
function renderData(skipCompanyStats) {
      // Save the currently selected index before re-rendering
  const selectedIndex = currentlySelectedIndex;
  
  // Clear panels (existing code)
  document.querySelectorAll(".pla-details-panel:not(#companyStats):not(#serpContainer):not(#companyStatsSerp)").forEach(panel => panel.remove());
  currentlyOpenPanel = null;
  currentlySelectedIndex = null;
    // --- DEBUG WRAPPER ---
  const now = new Date().toISOString();
  const stack = new Error().stack;
  console.log(`[TRACE] renderData() call @ ${now}\n`, stack);

  console.log("[DEBUG] ▶ renderData() called — prefix:", window.dataPrefix);
  console.group("[📊 renderData() – Confirming Data Source]");
  console.log("dataPrefix in use:", window.dataPrefix);
  console.log("companyStatsData.length =", window.companyStatsData?.length || 0);
  console.log("marketTrendsData.length =", window.marketTrendsData?.length || 0);
  console.groupEnd();

        document.querySelectorAll(".pla-details-panel:not(#companyStats):not(#serpContainer):not(#companyStatsSerp)").forEach(panel => panel.remove());
        currentlyOpenPanel = null;
        currentlySelectedIndex = null;

        const globalLastDate = getGlobalMaxDate(window.allRows); 
        const fullDataset = window.allRows;
        if (!fullDataset || !Array.isArray(fullDataset)) {
          console.warn("renderData was called without a valid full dataset.");
          return;
        }
        // (Optionally) save fullDataset into cachedRows if needed
        cachedRows = fullDataset.slice();
      
        // ----------------------------------------------------------------------
        // A) RECOMPUTE PERIOD-BASED FIELDS (finalPosition, slope, ratingTrend,
        //    row.visibilityBarValue, etc.) FOR *EVERY* ROW in fullDataset
        // ----------------------------------------------------------------------
        fullDataset.forEach((row) => {
          // Default rating & reviews if missing
          if (row.rating == null) row.rating = 4.5;
          if (row.reviews == null) row.reviews = 99;
      
          // Clean up short-term trend fields (trend, week_trend, month_trend)
          ["trend", "week_trend", "month_trend"].forEach(field => {
            if (row[field] && typeof row[field] === "string") {
              const parts = row[field].trim().split(" ");
              if (parts.length >= 2) {
                const arrowPart = parts[0];
                const numPart   = parseFloat(parts[1]);
                if (!isNaN(numPart)) {
                  // Round the numeric portion
                  row[field] = arrowPart + " " + Math.round(numPart);
                }
              }
            }
          });
      
          // Build a stars array for rating rendering
          row.stars = [];
          for (let n = 0; n < 5; n++) {
            let fill = Math.min(100, Math.max(0, (row.rating - n) * 100));
            row.stars.push({ fill });
          }
      
          // Derive finalPosition + finalSlope from selectedPeriod
          let posValue, slopeValue;
          if (selectedPeriod === "3d") {
            posValue   = row.avg_3days_position;
            slopeValue = row.slope_3d;
          } else if (selectedPeriod === "7d") {
            posValue   = row.avg_week_position;
            slopeValue = row.slope_7d;
          } else if (selectedPeriod === "custom") {
            // If you prefer a custom calculation, do that here;
            // otherwise treat it like 30d (as an example fallback):
            posValue   = row.avg_month_position;
            slopeValue = row.slope_30d;
          } else {
            // By default (30d)
            posValue   = row.avg_month_position;
            slopeValue = row.slope_30d;
          }
      
          // Format numeric positions (posValue, slopeValue)
          if (posValue != null) {
            let tmp = parseFloat(posValue).toFixed(1);
            posValue = tmp.endsWith(".0") ? parseFloat(tmp).toFixed(0) : tmp;
          }
          if (slopeValue != null) {
            let tmp = parseFloat(slopeValue).toFixed(1);
            slopeValue = tmp.endsWith(".0") ? parseFloat(tmp).toFixed(0) : tmp;
          }
      
          // Determine arrow & background color from slope
          let arrow = "", bgColor = "gray";
          if (slopeValue != null) {
            const origSlope = parseFloat(slopeValue);
            if (origSlope > 0) {
              arrow  = "▼"; // position got worse
              bgColor= "red";
            } else if (origSlope < 0) {
              arrow  = "▲"; // position improved
              bgColor= "green";
            }
            // Remove negative sign if arrow is ▲
            if (origSlope < 0) {
              slopeValue = slopeValue.replace(/^-/, "");
            } else if (origSlope > 0) {
              slopeValue = "-" + slopeValue;
            }
          }
          row.finalPosition      = posValue || null;
          row.finalSlope         = slopeValue || null;
          row.arrow              = arrow;
          row.posBadgeBackground = bgColor;
      
          // Compute rating trend from historical_data
          if (row.historical_data && row.historical_data.length > 1) {
            let days;
            if (selectedPeriod === "3d") {
              days = 3;
            } else if (selectedPeriod === "7d") {
              days = 7;
            } else if (selectedPeriod === "custom") {
              // E.g. treat as 30 if you want, or do your own logic
              days = 30;
            } else {
              days = 30;
            }
      
            const dates = row.historical_data.map(item => moment(item.date.value, "YYYY-MM-DD"));
            const periodEnd   = moment.max(dates);
            const periodStart = periodEnd.clone().subtract(days - 1, "days");
            const periodData  = row.historical_data.filter(item => {
              const itemDate = moment(item.date.value, "YYYY-MM-DD");
              return itemDate.isSameOrAfter(periodStart, "day") && itemDate.isSameOrBefore(periodEnd, "day");
            });
      
            if (periodData.length > 1) {
              const sorted = periodData.slice().sort((a, b) => new Date(a.date.value) - new Date(b.date.value));
              const firstTime = new Date(sorted[0].date.value).getTime();
              let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
              const n = sorted.length;
              for (let i2 = 0; i2 < n; i2++) {
                const t = new Date(sorted[i2].date.value).getTime();
                const x = (t - firstTime) / (1000 * 3600 * 24);
                const y = parseFloat(sorted[i2].rating) || 0;
                sumX += x;
                sumY += y;
                sumXY += x * y;
                sumX2 += x * x;
              }
              const denominator = n * sumX2 - sumX * sumX;
              const slope = (denominator !== 0) ? (n * sumXY - sumX * sumY) / denominator : 0;
              const arrowTrend = slope > 0 ? "▲" : slope < 0 ? "▼" : "±";
              row.ratingTrendArrow = arrowTrend;
              row.ratingTrendValue = Math.abs(slope).toFixed(2);
              row.ratingTrendClass = slope > 0 ? "trend-up" : (slope < 0 ? "trend-down" : "trend-neutral");
            } else {
              row.ratingTrendArrow = "";
              row.ratingTrendValue = "0";
              row.ratingTrendClass = "trend-neutral";
            }
          } else {
            row.ratingTrendArrow = "";
            row.ratingTrendValue = "0";
            row.ratingTrendClass = "trend-neutral";
          }
      
          // Compute row.visibilityBarValue
          row.visibilityBarValue = 0;
          if (row.historical_data && row.historical_data.length > 0) {
            // Sort once by date ascending
            const sortedHist = row.historical_data
              .slice()
              .sort((a, b) => new Date(a.date.value) - new Date(b.date.value));
        
            // 1) Determine how many days we are dealing with
            let periodDays;
            if (selectedPeriod === "custom") {
              // e.g. difference in your custom dateRange
              periodDays = mainDateRange.end.diff(mainDateRange.start, "days") + 1;
            } else {
              // For 3d, 7d or 30d
              if (selectedPeriod === "3d") periodDays = 3;
              else if (selectedPeriod === "7d") periodDays = 7;
              else periodDays = 30; // default
            }
        
            // 2) Define the date window [windowStart ... windowEnd]
            //    - For custom, we use mainDateRange.end
            //    - For standard, we use the globalLastDate
            let windowEnd  = (selectedPeriod === "custom")
              ? mainDateRange.end.clone()
              : globalLastDate.clone();
        
            let windowStart = windowEnd.clone().subtract(periodDays - 1, "days");
        
            // 3) Sum up visibility for those days that actually have a record
            //    (All missing days are effectively zero.)
            let sum = 0;
            sortedHist.forEach((item) => {
              let d = moment(item.date.value, "YYYY-MM-DD");
              if (d.isBetween(windowStart, windowEnd, null, "[]")) {
                if (item.visibility != null) {
                  sum += parseFloat(item.visibility);
                }
              }
            });
        
            // 4) The average is (sum of vis) / (number of days) rather than / (count of records).
            let avgDailyVis = sum / periodDays;
        
            // 5) Convert to a 0-100 integer
            row.visibilityBarValue = Math.round(avgDailyVis * 100);
        
          } else {
            // If no historical_data, visibility is 0
            row.visibilityBarValue = 0;
          }
        }); // end forEach fullDataset
      
        // -------------------------------------------------------------------------
        // B) APPLY ALL FILTERS to a fresh copy of fullDataset
        // -------------------------------------------------------------------------
        let filtered = fullDataset.slice();
      
        // 1) Column text filters (title/source)
        if (window.columnFilters) {
          if (window.columnFilters.title) {
            const txt = window.columnFilters.title.toLowerCase();
            filtered = filtered.filter(r => (r.title || "").toLowerCase().includes(txt));
          }
          if (window.columnFilters.source) {
            const txt = window.columnFilters.source.toLowerCase();
            filtered = filtered.filter(r => (r.source || "").toLowerCase().includes(txt));
          }
        }
      
        // 2) Apply the "first-group" filters (searchTerm, engine, device, location, company)
        filtered = applyAllFilters(filtered);
      
        // 3) If user selected custom, do an explicit dateRangeFilter
        //    (makes sure the row *exists* in that date range at least once)
        if (selectedPeriod === "custom") {
          filtered = applyDateRangeFilter(filtered, mainDateRange.start, mainDateRange.end);
        }
      
        // 4) Apply the slider filters for visibility and avgPos
        const st = window.filterState;
        filtered = applyVisibilityFilter(filtered, st.visibilityRange.min, st.visibilityRange.max);
        filtered = applyAvgPosFilter(filtered, st.avgPosRange.min, st.avgPosRange.max);
      
        // 5) Sort them by finalPosition (or by numeric key)
        filtered.sort((a, b) => {
          const aPos = parseFloat(a.finalPosition) || 999999;
          const bPos = parseFloat(b.finalPosition) || 999999;
          return aPos - bPos;
        });

        const subset = filtered.slice(0, visibleCount);
const currentSubset = subset;

// 2) Build a “previous subset” with the same filters but using applyAvgPosFilterPreviousPeriod
let previousFiltered = fullDataset.slice();
// use the same column filters:
if (window.columnFilters) {
    if (window.columnFilters.title) {
      const txt = window.columnFilters.title.toLowerCase();
      filtered = filtered.filter(r => (r.title || "").toLowerCase().includes(txt));
    }
    if (window.columnFilters.source) {
      const txt = window.columnFilters.source.toLowerCase();
      filtered = filtered.filter(r => (r.source || "").toLowerCase().includes(txt));
    }
  }

previousFiltered = applyAllFilters(previousFiltered);
previousFiltered = applyVisibilityFilter(previousFiltered, st.visibilityRange.min, st.visibilityRange.max);
previousFiltered = applyAvgPosFilterPreviousPeriod(previousFiltered, st.avgPosRange.min, st.avgPosRange.max);

const currentKeys = new Set(
  currentSubset.map(r => `${r.source}||${r.title}`)
);

// Define the current period window:
let currentWindow = {};
if (selectedPeriod === "custom") {
  currentWindow.start = mainDateRange.start.clone();
  currentWindow.end = mainDateRange.end.clone();
} else {
  let days = 7; // default
  if (selectedPeriod === "3d") days = 3;
  else if (selectedPeriod === "7d") days = 7;
  else if (selectedPeriod === "30d") days = 30;
  currentWindow.end = globalLastDate.clone();
  currentWindow.start = globalLastDate.clone().subtract(days - 1, "days");
}

// Filter previousFiltered to get declined products.
// A product is “declined” if:
// 1. It was within the selected segment in the previous period (already ensured by previousFiltered),
// 2. It is NOT present in the current period (currentKeys),
// 3. And, for the selected segment, its current period records do NOT include any day with an average position that is “better” than the segment’s threshold.
const declined = previousFiltered.filter(r => {
  // Exclude if product appears in current period.
  if (currentKeys.has(`${r.source}||${r.title}`)) return false;

  // Determine threshold based on current serpSegment.
  // (The thresholds come from your slider settings: see the switch below.)
  let threshold = null;
  switch (window.filterState.serpSegments) {
    case "top4-8":
      threshold = 4; // For "top4-8", if any day has pos < 4, exclude.
      break;
    case "top9-14":
      threshold = 8; // For "top9-14", if any day has pos <= 8, exclude.
      break;
    case "below14":
      threshold = 14; // For "below14", if any day has pos <= 14, exclude.
      break;
    case "below8":
      threshold = 8; // For "below8", if any day has pos <= 8, exclude.
      break;
    default:
      threshold = null;
  }
  if (threshold !== null) {
    const hasBetter = (r.historical_data || []).some(item => {
      const d = moment(item.date.value, "YYYY-MM-DD");
      if (!d.isBetween(currentWindow.start, currentWindow.end, "day", "[]")) return false;
      const pos = parseFloat(item.avg_position);
      if (isNaN(pos)) return false;
      if (window.filterState.serpSegments === "top4-8") {
        return pos < threshold; // Exclude if any day with pos < 4.
      } else if (window.filterState.serpSegments === "top9-14" || window.filterState.serpSegments === "below8") {
        return pos <= threshold; // Exclude if any day with pos <= 8.
      } else if (window.filterState.serpSegments === "below14") {
        return pos <= threshold; // Exclude if any day with pos <= 14.
      }
      return false;
    });
    if (hasBetter) return false;
  }
  return true;
});

// 1) Build a set of previous keys
const previousKeys = new Set(
  previousFiltered.map(r => `${r.source}||${r.title}`)
);

// 2) “Improved” = in current subset but not in previous subset
const improved = currentSubset.filter(
  r => !previousKeys.has(`${r.source}||${r.title}`)
);
      
        // 6) Now reassign _plaIndex after sorting
        window.globalRows = {};
        filtered.forEach((row, i) => {
          row._plaIndex = i;
          window.globalRows[i] = row;
        });
        // Give the declined items their own unique indexes as well:
        const mainSubsetCount = filtered.length;
        declined.forEach((row, i) => {
          const idx = mainSubsetCount + i;
          row._plaIndex = idx;
          window.globalRows[idx] = row;
        });

        window.filteredData = filtered;

const improvedCount = improved.length;
const declinedCount = declined.length;

// For the label e.g. "▲ 5", "▼ 2", or "±0"
const diff = currentSubset.length - previousFiltered.length;
let productTrendValue = '±0';
if (diff > 0)  productTrendValue = `▲ ${diff}`;
if (diff < 0)  productTrendValue = `▼ ${Math.abs(diff)}`;

      
        // -------------------------------------------------------------------------
        // C) If you want to re-check min/max visibility from the current subset:
        //    (like your "Process Visibility values from your filtered data" step)
        // -------------------------------------------------------------------------
        const processedVisibility = subset.map(r => r.visibilityBarValue).filter(val => val !== null);
        if (processedVisibility.length > 0) {
          const visMin = Math.min(...processedVisibility);
          const visMax = Math.max(...processedVisibility);
          // Always update global filter range from current slider
          const currentVisibility = document.querySelector('#visibilityRange').value;
          visibilityFilterRange = { min: currentVisibility.lower, max: currentVisibility.upper };
        }
      
        // -------------------------------------------------------------------------
        // D) RENDER THE RESULTS
        // -------------------------------------------------------------------------
        const outputDiv = document.getElementById("filteredResults");
        const source = document.getElementById("shopping-ad-template").innerHTML;
        const template = Handlebars.compile(source);
      
        const tableSource = document.getElementById("shopping-ad-table-template").innerHTML;
        const tableTemplate = Handlebars.compile(tableSource);
      
        // If nothing matched
        if (!subset.length) {
          // Build an empty table so the header filters remain, or just show a message
          let context = {
            dateColumns: (function() {
              // This logic is from your previous code to compute dateColumns
              if (cachedRows && cachedRows.length > 0) {
                const hist = cachedRows[0].historical_data || [];
                if (hist.length > 0) {
                  const latestDate = moment.max(hist.map(item => moment(item.date.value, "YYYY-MM-DD")));
                  let dateCols = [];
                  for (let i = 0; i < 30; i++) {
                    dateCols.push(latestDate.clone().subtract(i, 'days').format("YYYY-MM-DD"));
                  }
                  return dateCols;
                }
              }
              return [];
            })(),
            data: []
          };
          outputDiv.innerHTML = tableTemplate(context);
          updateColumnFilterTags(); 
          return;
        }
      
        // Build dateColumns for the final subset (like your original logic)
        // Build dateColumns for the final subset (table mode)
        let dateColumns = [];
        
        if (selectedPeriod === "custom") {
          // Just list all days from mainDateRange.start to mainDateRange.end
          let dt = mainDateRange.start.clone();
          while (dt.isSameOrBefore(mainDateRange.end, "day")) {
            dateColumns.push(dt.format("YYYY-MM-DD"));
            dt.add(1, "days");
          }
        } else {
          // e.g. 3d/7d/30d => anchor to the *global* last date
          let overallMaxDate = globalLastDate.clone();  // (already computed above)
          for (let i = 0; i < 30; i++) {
            dateColumns.push(
              overallMaxDate.clone().subtract(i, "days").format("YYYY-MM-DD")
            );
          }
        }        
      
        // Prepare the context for table vs. grid
        let context = {
          data: subset,
          dateColumns: dateColumns,
          titleColumnWidth: titleColumnWidth,
          showImage: window.tableShowImage || false,
          imageColumnWidth: 150,
          trendColumnWidth: 50,
          dateColumnWidth: 65,
          tableRowHeight: 40,
          tableRowHeightWithImage: 150,
          showHeader: true
        };
      
        // Turn the subset into HTML
        const adsHtml   = subset.map(row => template(row)).join("");
        const tableHtml = tableTemplate(context);
        const resultsEl = document.getElementById("filteredResults");

        let declinedContext = {
            data: declined,
            dateColumns,
            titleColumnWidth: titleColumnWidth,
            showImage: window.tableShowImage || false,
            tableRowHeight: 40,
            tableRowHeightWithImage: 150,
            showHeader: false  // if you don’t want the header repeated
          };          
             const declinedTableHtml = tableTemplate(declinedContext);
             

             if (outputDiv.classList.contains("table-mode")) {
                // Build the HTML for table mode with new stat containers.
                // Build strings for tableStats1 and tableStats2 conditionally
                let tableStats1HTML = '';
                let tableStats2HTML = '';
                  
                // Condition for showing tableStats1: “one company” + “one serpSegments” 
                if (
                  window.filterState.company.trim() !== '' &&
                  window.filterState.serpSegments.trim() !== ''
                ) {
                  tableStats1HTML = `
                  <div id="tableStats1" class="table-stats" 
                  style="background: green;">
                      RANKED PRODUCTS: ${currentSubset.length}
                      &nbsp;&nbsp;${productTrendValue}
                      &nbsp;&nbsp;Improved: ${improvedCount}
                      &nbsp;&nbsp;Declined: ${declinedCount}
                    </div>
                  `;
                }
                
                // Condition for showing the second table (tableStats2 + secondTableWrapper) 
                if (
                  window.filterState.company.trim() !== '' &&
                  window.filterState.serpSegments.trim() !== '' &&
                  window.filterState.serpSegments.trim() !== 'top40'
                ) {
                  tableStats2HTML = `
                  <div id="tableStats2" class="table-stats" 
                  style="background: red;">
                  DECLINED PRODUCTS: ${declined.length}
                    </div>
                    <div id="secondTableWrapper">${declinedTableHtml}</div>
                  `;
                }
                
                // Now build the final “table‐mode” HTML by inserting those strings
                let tableModeHTML = `
                  ${tableStats1HTML}
                  <div id="firstTableWrapper">${tableHtml}</div>
                  ${tableStats2HTML}
                `;
                
                outputDiv.innerHTML = tableModeHTML;                
              
                attachResizeHandle();
                attachRowClickHandlers();
                attachTitleCopyHandlers();
            } else if (outputDiv.classList.contains("list-mode")) {
                // 1) Build “listStats1” if user has a single company + single SERP segment
                let listStats1HTML = "";
                let listStats2HTML = "";
              
                let showFirstContainer = false;
                let showSecondContainer = false;
              
                // Condition: same as tableStats1 in table-mode
                if (
                  window.filterState.company.trim() !== "" &&
                  window.filterState.serpSegments.trim() !== ""
                ) {
                  showFirstContainer = true;
                  listStats1HTML = `
                    <div id="tableStats1" class="table-stats" style="background: green;">
                      RANKED PRODUCTS: ${currentSubset.length}
                      &nbsp;&nbsp;${productTrendValue}
                      &nbsp;&nbsp;Improved: ${improvedCount}
                      &nbsp;&nbsp;Declined: ${declinedCount}
                    </div>
                  `;
                }
              
                // Condition: same as tableStats2 in table-mode
                if (
                  window.filterState.company.trim() !== "" &&
                  window.filterState.serpSegments.trim() !== "" &&
                  window.filterState.serpSegments.trim() !== "top40"
                ) {
                  showSecondContainer = true;
                  listStats2HTML = `
                    <div id="tableStats2" class="table-stats" style="background: red;">
                      DECLINED PRODUCTS: ${declined.length}
                    </div>
                  `;
                }
              
                // 2) Convert the declined array into “list‐mode” ads as well:
                const declinedHtml = declined.map(row => template(row)).join("");
              
                // 3) Combine them into finalListHTML
                let finalListHTML = "";
                if (showFirstContainer) {
                  // add the top stats + the main subset
                  finalListHTML += listStats1HTML;
                }
                // always show the main subset
                finalListHTML += adsHtml;
              
                if (showSecondContainer && declined.length > 0) {
                  finalListHTML += listStats2HTML;
                  finalListHTML += declinedHtml;
                }
              
                // 4) Now set the output
                outputDiv.innerHTML = finalListHTML;
                // Within your existing "renderData()" after you create the list-mode HTML:
if (resultsEl.classList.contains("list-mode")) {

  // Render mini-charts for each .mini-chart-container
  document.querySelectorAll(".mini-chart-container").forEach(function(el) {
    const index = el.id.split("-").pop();
    const row = window.globalRows[index];
    if (!row) return;
  
    // 1) Build an array of daily data
    const chartData = buildMiniChartData(row);
  
    // Create a canvas element.
    // (Naming it "canvas" helps clarify that it is the canvas element, not its drawing context.)
    const canvas = document.createElement('canvas');
    // Set the internal resolution
    canvas.width = 210;
    canvas.height = 100;
    // And set the CSS display size so they match exactly.
    canvas.style.width = '210px';
    canvas.style.height = '100px';
  
    // Clear any previous content and append the new canvas.
    el.innerHTML = '';
    el.appendChild(canvas);
    
    const selectedPeriod = window.filterState.period || '7d';
    const showDataLabels = (selectedPeriod !== '30d');
  
    // 2) Build your chart using the canvas.
    new Chart(canvas, {
        type: 'line',
        data: {
          labels: chartData.map(d => d.date),
          datasets: [
            {
              label: 'Avg Pos',
              data: chartData.map(d => d.position),
              borderColor: '#007aff',
              backgroundColor: 'transparent',
              borderWidth: 2,
              pointRadius: 3,
              yAxisID: 'posAxis',
              tension: 0.4
            },
            {
              label: 'Visibility',
              data: chartData.map(d => d.visibility),
              borderColor: '#A3D5FF',
              backgroundColor: 'rgba(163,213,255,0.4)',
              borderWidth: 2,
              fill: true,
              pointRadius: 3,
              yAxisID: 'visAxis'
            }
          ]
        },
        options: {
          responsive: false,
          maintainAspectRatio: false,
          layout: { padding: { top: 5, bottom: 5 } },
          plugins: {
            // Disable datalabels for this chart
            datalabels: {
              display: false
            },
            annotation: {
              annotations: {
                top8Range: {
                  type: 'box',
                  yScaleID: 'posAxis',
                  yMin: 8,
                  yMax: 0,
                  backgroundColor: 'rgba(0, 255, 0, 0.1)',
                  borderWidth: 0
                }
              }
            },
            legend: { display: false },
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
                  if (context.dataset.label === 'Avg Pos') {
                    return context.dataset.label + ": " + context.parsed.y.toFixed(2);
                  } else {
                    return context.dataset.label + ": " + context.parsed.y.toFixed(2) + '%';
                  }
                }
              }
            }
          },
          scales: {
            x: { display: false, grid: { display: false } },
            posAxis: {
              display: false,
              type: 'linear',
              position: 'left',
              min: 0,
              max: 40,
              reverse: true,
              grid: { display: false },
              ticks: { display: false }
            },
            visAxis: {
              display: false,
              type: 'linear',
              position: 'right',
              min: 0,
              max: 100,
              grid: { display: false },
              ticks: {
                display: false,
                callback: val => val + '%'
              }
            }
          }
        }
      });      
  });
 

  // Helper to build last X days of position & visibility:
  function buildMiniChartData(row) {
    let periodDays = 7;
    if (selectedPeriod === '3d') periodDays = 3;
    if (selectedPeriod === '30d') periodDays = 30;

    const globalLastDate = getGlobalMaxDate([row]);
    const end   = (selectedPeriod === 'custom') ? mainDateRange.end
                : globalLastDate.clone();
    const start = (selectedPeriod === 'custom') ? mainDateRange.start
                : end.clone().subtract(periodDays - 1, 'days');

    let dataMap = {};
    (row.historical_data || []).forEach(h => {
      const d = moment(h.date.value, 'YYYY-MM-DD');
      if (d.isBetween(start, end, 'day', '[]')) {
        dataMap[d.format('YYYY-MM-DD')] = {
          pos: parseFloat(h.avg_position) || 40,
          vis: parseFloat(h.visibility || 0) * 100
        };
      }
    });

    let results = [];
    let dt = start.clone();
    while (dt.isSameOrBefore(end)) {
      const dStr = dt.format('YYYY-MM-DD');
      let pos = 40, vis = 0;
      if (dataMap[dStr]) {
        pos = dataMap[dStr].pos;
        vis = dataMap[dStr].vis;
      }
      results.push({ date: dStr, position: pos, visibility: vis });
      dt.add(1, 'days');
    }
    return results;
  }  
}
                 } else {
                   // GRID mode => just “adsHtml”
                   outputDiv.innerHTML = adsHtml;
                 }

               // 1) Grab references to each table’s scrolling container
               const firstTableContainer  = document.querySelector("#firstTableWrapper .table-container");
               const secondTableContainer = document.querySelector("#secondTableWrapper .table-container");
               if (firstTableContainer && secondTableContainer) {
                 let isSyncingScroll = false; // to prevent infinite scroll loops
              
                 firstTableContainer.addEventListener("scroll", () => {
                   if (isSyncingScroll) return;
                   isSyncingScroll = true;
                   secondTableContainer.scrollLeft = firstTableContainer.scrollLeft;
                   isSyncingScroll = false;
                 });
              
                 secondTableContainer.addEventListener("scroll", () => {
                   if (isSyncingScroll) return;
                   isSyncingScroll = true;
                   firstTableContainer.scrollLeft = secondTableContainer.scrollLeft;
                   isSyncingScroll = false;
                 });
               }
      
        // Copy-trigger for titles
        document.querySelectorAll('.copy-trigger').forEach(titleEl => {
          titleEl.addEventListener('click', function(e) {
            e.stopPropagation();
            copyElementText(this);
            // ephemeral tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'copied-tooltip';
            tooltip.textContent = 'copied';
            this.appendChild(tooltip);
            setTimeout(() => { tooltip.style.opacity = '0'; }, 1000);
            setTimeout(() => {
              if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
              }
            }, 2300);
          });
        });
      
        // Optionally highlight the clicked row in table mode
        document.querySelectorAll('.apple-table tbody tr').forEach(row => {
          row.addEventListener('click', function() {
            document.querySelectorAll('.apple-table tbody tr').forEach(r => r.classList.remove('selected'));
            this.classList.add('selected');
          });
        });
      
        // Re-run your “click -> open panel” logic
        setupPLAInteractions();
      // Restore the selection if there was one
  if (selectedIndex !== null) {
    const selectedEl = document.querySelector(`.ad-details[data-pla-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.classList.add("selected");
      currentlySelectedIndex = selectedIndex; // Restore this as well
    }
  }
      
        // Render mini-gauges for list-mode
        document.querySelectorAll('.vis-gauge').forEach(function(el) {
          const index = el.id.split('-').pop();
          const row = window.globalRows[index];
          if (!row) return;
          let visValue = row.visibilityBarValue;
          visValue = parseFloat(visValue) || 0;
      
          var options = {
            series: [visValue],
            chart: {
              height: 100,
              width: 100,
              type: 'radialBar',
              offsetY: -5,
              sparkline: { enabled: false },
              toolbar: { show: false }
            },
            plotOptions: {
              radialBar: {
                startAngle: -135,
                endAngle: 135,
                hollow: { size: '50%' },
                track: { strokeDashArray: 6, margin: 2 },
                dataLabels: {
                  name: { show: false },
                  value: {
                    show: true,
                    offsetY: 5,
                    fontSize: '20px',
                    formatter: function(val) {
                      return Math.round(val) + "%";
                    }
                  }
                }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0, 50, 65, 91]
              }
            },
            stroke: { lineCap: 'butt', dashArray: 4 },
            labels: []
          };
          var chart = new ApexCharts(el, options);
          chart.render();
        });
      
        // Render apex radial badges for grid-mode
        document.querySelectorAll('.vis-badge').forEach(function(el) {
          const parts = el.id.split('-');
          const index = parts[2];
          const row = window.globalRows[index];
          if (!row) return;
          let visValue = parseFloat(row.visibilityBarValue) || 0;
          if (visValue === 0) {
            visValue = 0.1;
          }
      
          var options = {
            series: [visValue],
            chart: {
              height: 80,
              width: 80,
              type: 'radialBar',
              sparkline: { enabled: false },
              offsetY: 0
            },
            plotOptions: {
              radialBar: {
                startAngle: -90,
                endAngle: 90,
                hollow: { size: '50%' },
                track: { strokeDashArray: 8, margin:2 },
                dataLabels: {
                  name: { show: false },
                  value: {
                    show: true,
                    offsetY: 0,
                    fontSize: '14px',
                    formatter: function(val){
                      return Math.round(val) + "%";
                    }
                  }
                }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0,50,100]
              }
            },
            stroke: { lineCap:'butt', dashArray:4 },
            labels: []
          };
          var chart = new ApexCharts(el, options);
          chart.render();
        });
      
        // Finally update column filter tags and companyStats only if not skipping them
        if (!skipCompanyStats) {
          updateColumnFilterTags();
          setTimeout(() => {
            updateMarketShareCharts();
          }, 100);          
          if (window.marketTrendsData) {
            updateMarketTrendsUI();
          }
        }
        if (document.getElementById("companiesContainer").style.display !== "none") {
            renderCompaniesTab();
          }
          if (document.getElementById("serpContainer").style.display !== "none") {
            renderSerpMarketShareBigChart(window.companyStatsData);
            renderSerpCompaniesTable(window.companyStatsData);
            fixSerpCompaniesTable();
          }                    
      } 


      function renderCompaniesTab() {
        // 1) Check if company_serp_stats data is available
        if (!window.companyStatsData || !Array.isArray(window.companyStatsData)) {
          console.warn("No company_serp_stats data to render companies tab.");
          document.getElementById("companyResults").innerHTML = "<p>No company data</p>";
          return;
        }
      
        // 2) Figure out the user’s selected date range or period
        //    We’ll do the same logic used for your “products”:
        let periodDays = 7;
        if (window.filterState.period === "3d")   periodDays = 3;
        if (window.filterState.period === "30d")  periodDays = 30;
        // If “custom,” use mainDateRange. Otherwise, define start/end from the global max date:
        let startMoment, endMoment;
        if (window.filterState.period === "custom") {
          startMoment = window.filterState.dateRange.start.clone();
          endMoment   = window.filterState.dateRange.end.clone();
        } else {
          // find the overall max date among companyStatsData
          const maxDate = findOverallMaxDate(window.companyStatsData);
          if (!maxDate) {
            document.getElementById("companyResults").innerHTML = "<p>No company data in range</p>";
            return;
          }
          endMoment = maxDate.clone();
          startMoment = maxDate.clone().subtract(periodDays - 1, "days");
        }
      
        // 3) Filter companyStatsData by (q, engine, device, location) if you need:
        const fs = window.filterState;
        let filteredRecs = window.companyStatsData.filter(r => {
          // if your data has r.q, r.engine, etc.
          if (fs.searchTerm && r.q.toLowerCase() !== fs.searchTerm.toLowerCase()) return false;
          if (fs.engine     && r.engine.toLowerCase()   !== fs.engine.toLowerCase()) return false;
          if (fs.device     && r.device.toLowerCase()   !== fs.device.toLowerCase()) return false;
          if (fs.location   && r.location_requested.toLowerCase() !== fs.location.toLowerCase()) return false;
          return true;
        });
      
        if (!filteredRecs.length) {
          document.getElementById("companyResults").innerHTML = "<p>No company data matches current filters</p>";
          return;
        }
      
        // 4) Build an object grouping by companyName
        //    The structure of company_serp_stats might be: 
        //    each row => { source, logo, avg_rating, historical_data: [ { date:{value}, unique_products, un_products_on_sale, ...} ] }
        //    So we group by row.source. (assuming source = “company name”)
        const grouped = {};
        filteredRecs.forEach(row => {
          const cName = row.source || "unknown";
          if (!grouped[cName]) {
            grouped[cName] = {
              logo: row.logo || "",
              avg_rating: row.avg_rating || 0,  // or parseFloat
              historical_data: [],
              extensions: []
            };
          }
          // Merge or push historical_data from each row
          if (Array.isArray(row.historical_data)) {
            grouped[cName].historical_data.push(...row.historical_data);
          }
          if (Array.isArray(row.extensions)) {
            grouped[cName].extensions.push(...row.extensions);
            grouped[cName].extensions = Array.from(new Set(grouped[cName].extensions));
          }
        });
      
        // 5) For each company, we want to:
        //    - calculate the average # of products in the chosen date range
        //    - calculate the % on sale
        //    - get the rating from avg_rating (or if rating changes by day, compute the average)
        //    - etc.
        const companyDataArray = [];
      
        Object.keys(grouped).forEach(cName => {
          const obj = grouped[cName];
          const { logo, avg_rating } = obj;
      
          // “(3) rating_reviews” => “rating” from avg_rating
          const ratingVal = parseFloat(avg_rating) || 0;
      
          // Build star array
          const stars = [];
          let starFloat = ratingVal;
          for (let i=0; i<5; i++){
            const fillPct = Math.min(100, Math.max(0, (starFloat)*100));
            starFloat -= 1;
            stars.push({ fill: fillPct });
          }
      
          // (4) products => average of dayObj.unique_products in [startMoment..endMoment]
          const filteredDays = (obj.historical_data || []).filter(d => {
            const dd = moment(d.date.value, "YYYY-MM-DD");
            return dd.isBetween(startMoment, endMoment, "day", "[]");
          });
          let sumProducts = 0, countDays = 0;
          let sumOnSale = 0;
          filteredDays.forEach(dayObj => {
            if (dayObj.unique_products != null) {
              sumProducts += parseFloat(dayObj.unique_products);
              countDays++;
            }
            if (dayObj.un_products_on_sale != null) {
              sumOnSale += parseFloat(dayObj.un_products_on_sale);
            }
          });
          let avgProducts = 0, avgOnSale = 0, onSalePct = 0;
          if (countDays > 0) {
            avgProducts = sumProducts / countDays;
            avgOnSale   = sumOnSale   / countDays;
            onSalePct   = (avgOnSale && avgProducts) ? (avgOnSale / avgProducts) * 100 : 0;
          }
      
          // (7) “SERP” row => we want market share stats for Top40, Top3, etc. 
          //    Typically read from dayObj.market_share, dayObj.top3_market_share, etc.
          //    We can compute an average for top40, top3, top4_8, top9_14, below14 in the same manner:
          let sumTop40=0, sumTop3=0, sumTop4_8=0, sumTop9_14=0, sumBelow14=0;
          let msCount = 0;
          filteredDays.forEach(dayObj => {
            if (dayObj.market_share != null) sumTop40 += parseFloat(dayObj.market_share)*100;
            if (dayObj.top3_market_share != null) sumTop3 += parseFloat(dayObj.top3_market_share)*100;
            if (dayObj.top4_8_market_share != null) sumTop4_8 += parseFloat(dayObj.top4_8_market_share)*100;
            if (dayObj.top9_14_market_share != null) sumTop9_14 += parseFloat(dayObj.top9_14_market_share)*100;
            if (dayObj.below14_market_share != null) sumBelow14 += parseFloat(dayObj.below14_market_share)*100;
            msCount++;
          });
          let msTop40   = (msCount>0) ? (sumTop40    / msCount) : 0;
          let msTop3    = (msCount>0) ? (sumTop3     / msCount) : 0;
          let msTop4_8  = (msCount>0) ? (sumTop4_8   / msCount) : 0;
          let msTop9_14 = (msCount>0) ? (sumTop9_14  / msCount) : 0;
          let msBelow14 = (msCount>0) ? (sumBelow14  / msCount) : 0;
      
          // 6) “Market Share” placeholder => maybe the average “market_share” for the period
          const marketShareAvg = msTop40.toFixed(1);  // for example
          const companyHistData = grouped[cName].historical_data || [];

          let currentAvg = msTop40; // already in percentage (e.g. 12.3)

          // --- Now compute the previous window’s average ---
          let prevEnd = startMoment.clone().subtract(1, 'days');
          let prevStart = prevEnd.clone().subtract(periodDays - 1, 'days');
          
          // Filter all historical data for this company in the previous window:
          let prevFiltered = companyHistData.filter(dayObj => {
            if (!dayObj.date || !dayObj.date.value) return false;
            let d = moment(dayObj.date.value, "YYYY-MM-DD");
            return d.isBetween(prevStart, prevEnd, "day", "[]");
          });
          
          // For Top40:
          let sumPrevTop40 = 0, countPrevTop40 = 0;
          // For Top3:
          let sumPrevTop3 = 0, countPrevTop3 = 0;
          // For Top4-8:
          let sumPrevTop4_8 = 0, countPrevTop4_8 = 0;
          // For Top9-14:
          let sumPrevTop9_14 = 0, countPrevTop9_14 = 0;
          // For Below14:
          let sumPrevBelow14 = 0, countPrevBelow14 = 0;
          prevFiltered.forEach(dayObj => {
            if (dayObj.market_share != null) {
              sumPrevTop40 += parseFloat(dayObj.market_share) * 100;
              countPrevTop40++;
            }
            if (dayObj.top3_market_share != null) {
              sumPrevTop3 += parseFloat(dayObj.top3_market_share) * 100;
              countPrevTop3++;
            }
            if (dayObj.top4_8_market_share != null) {
              sumPrevTop4_8 += parseFloat(dayObj.top4_8_market_share) * 100;
              countPrevTop4_8++;
            }
            if (dayObj.top9_14_market_share != null) {
              sumPrevTop9_14 += parseFloat(dayObj.top9_14_market_share) * 100;
              countPrevTop9_14++;
            }
            if (dayObj.below14_market_share != null) {
              sumPrevBelow14 += parseFloat(dayObj.below14_market_share) * 100;
              countPrevBelow14++;
            }
          });
          let prevAvgTop40   = (countPrevTop40 > 0) ? (sumPrevTop40 / countPrevTop40) : 0;
          let prevAvgTop3    = (countPrevTop3 > 0) ? (sumPrevTop3 / countPrevTop3) : 0;
          let prevAvgTop4_8  = (countPrevTop4_8 > 0) ? (sumPrevTop4_8 / countPrevTop4_8) : 0;
          let prevAvgTop9_14 = (countPrevTop9_14 > 0) ? (sumPrevTop9_14 / countPrevTop9_14) : 0;
          let prevAvgBelow14 = (countPrevBelow14 > 0) ? (sumPrevBelow14 / countPrevBelow14) : 0;
          
          // Compute differences for each segment:
          let diffTop40   = msTop40 - prevAvgTop40;
          let diffTop3    = msTop3 - prevAvgTop3;
          let diffTop4_8  = msTop4_8 - prevAvgTop4_8;
          let diffTop9_14 = msTop9_14 - prevAvgTop9_14;
          let diffBelow14 = msBelow14 - prevAvgBelow14;
          
          // Define a helper to get trend arrow and color:
          function getTrendProps(diff) {
            if (diff > 0) {
              return { arrow: "▲", color: "green" };
            } else if (diff < 0) {
              return { arrow: "▼", color: "red" };
            } else {
              return { arrow: "±", color: "#444" };
            }
          }
          let trendTop40   = getTrendProps(diffTop40);
          let trendTop3    = getTrendProps(diffTop3);
          let trendTop4_8  = getTrendProps(diffTop4_8);
          let trendTop9_14 = getTrendProps(diffTop9_14);
          let trendBelow14 = getTrendProps(diffBelow14);
          
          let sumCheapest = 0, sumMedian = 0, sumExpensive = 0, priceCount = 0;

          filteredDays.forEach(dayObj => {
            if (dayObj.cheapest_product != null) {
              sumCheapest += parseFloat(dayObj.cheapest_product);
            }
            if (dayObj.median_price != null) {
              sumMedian += parseFloat(dayObj.median_price);
            }
            if (dayObj.most_expensive_product != null) {
              sumExpensive += parseFloat(dayObj.most_expensive_product);
            }
            // Increase only if at least one of them is valid 
            // (or you can require that day has all 3 to count — up to you)
            priceCount++;
          });
          
          let avgCheapest  = 0;
          let avgMedian    = 0;
          let avgExpensive = 0;
          if (priceCount > 0) {
            avgCheapest  = sumCheapest / priceCount;
            avgMedian    = sumMedian / priceCount;
            avgExpensive = sumExpensive / priceCount;
          }

          // Decide which trend column to use:
          let trendColumn = "trend"; // default 3d
          if (window.filterState.period === "7d") {
            trendColumn = "week_trend";
          } else if (window.filterState.period === "30d") {
            trendColumn = "month_trend";
          }
          
          // 'allRows' is your original products array from "products_w5"
          // Filter those rows that match this company's source, plus the same q/engine/device/location
          const matchingProducts = window.allRows.filter(prod => {
            return (
              prod.source?.toLowerCase() === cName.toLowerCase() &&
              prod.q?.toLowerCase() === fs.searchTerm.toLowerCase() &&
              prod.engine?.toLowerCase() === fs.engine.toLowerCase() &&
              prod.device?.toLowerCase() === fs.device.toLowerCase() &&
              prod.location_requested?.toLowerCase() === fs.location.toLowerCase()
            );
          });
          
          const improvedCount = matchingProducts.filter(
            p => p[trendColumn] && p[trendColumn].includes("⬆")
          ).length;
          const newCount = matchingProducts.filter(
            p => p[trendColumn] && p[trendColumn].includes("NEW")
          ).length;
          const declinedCount = matchingProducts.filter(
            p => p[trendColumn] && p[trendColumn].includes("⬇")
          ).length;


      
          // 7) Put it all together in the object
          companyDataArray.push({
            companyName: cName,
            companyId: cName,
            logoUrl: logo || "",
            avg_rating: ratingVal,
            stars,
            totalReviews: 0,  // your note: # of reviews is “temp removed”
            numProducts: avgProducts.toFixed(1),
            // “% of products on sale” you can store as 
            //   or do “onSalePct.toFixed(1)” if you prefer
            numOnSale: onSalePct.toFixed(1),  
      
            top40:    msTop40.toFixed(1),
            top3:     msTop3.toFixed(1),
            top4_8:   msTop4_8.toFixed(1),
            top9_14:  msTop9_14.toFixed(1),
            below14:  msBelow14.toFixed(1),
            cheapestProduct: avgCheapest.toFixed(2),
            medianPrice: avgMedian.toFixed(2),
            mostExpensiveProduct: avgExpensive.toFixed(2),
            improvedCount,
            newCount,
            declinedCount,
      
            marketShare: marketShareAvg,
            extensions: grouped[cName].extensions,
            historical_data: companyHistData,

         // Trend properties for each segment:
         top40TrendArrow: trendTop40.arrow,
         top40TrendValue: Math.abs(diffTop40).toFixed(1),
         top40TrendColor: trendTop40.color,
   
         top3TrendArrow: trendTop3.arrow,
         top3TrendValue: Math.abs(diffTop3).toFixed(1),
         top3TrendColor: trendTop3.color,
   
         top4_8TrendArrow: trendTop4_8.arrow,
         top4_8TrendValue: Math.abs(diffTop4_8).toFixed(1),
         top4_8TrendColor: trendTop4_8.color,
   
         top9_14TrendArrow: trendTop9_14.arrow,
         top9_14TrendValue: Math.abs(diffTop9_14).toFixed(1),
         top9_14TrendColor: trendTop9_14.color,
   
         below14TrendArrow: trendBelow14.arrow,
         below14TrendValue: Math.abs(diffBelow14).toFixed(1),
         below14TrendColor: trendBelow14.color
          });
        });

        // (1) find the global average across all companies:
        let sumCheapest = 0, sumMedian = 0, sumExpensive = 0, count = 0;
        companyDataArray.forEach(c => {
          // Convert c.marketShare to a float:
          const ms = parseFloat(c.marketShare) || 0;
          // Only proceed if >= 3%
          if (ms >= 3) {
            const cheapestVal  = parseFloat(c.cheapestProduct)  || 0;
            const medianVal    = parseFloat(c.medianPrice)      || 0;
            const expensiveVal = parseFloat(c.mostExpensiveProduct) || 0;
            
            sumCheapest  += cheapestVal;
            sumMedian    += medianVal;
            sumExpensive += expensiveVal;
            count++;
          }
        });
        
        const avgCheapest  = (count > 0) ? (sumCheapest  / count) : 0;
        const avgMedian    = (count > 0) ? (sumMedian    / count) : 0;
        const avgExpensive = (count > 0) ? (sumExpensive / count) : 0;
        
        // (2) For each company, compare and store a difference & arrow
        companyDataArray.forEach(c => {
          const cheapestVal  = parseFloat(c.cheapestProduct);
          const medianVal    = parseFloat(c.medianPrice);
          const expensiveVal = parseFloat(c.mostExpensiveProduct);
        
          // We'll define a small helper:
          function getDiffColorArrow(companyVal, globalAvg) {
            const diff = companyVal - globalAvg;
            const absDiff = Math.abs(diff).toFixed(2);
            // Decide arrow direction
            let arrow = "▼"; // if cheaper is “down” => might be “good”
            let color = "green";
            if (diff > 0) {
              arrow = "▲"; // more expensive => red
              color = "red";
            }
            return { arrow, absDiff, color };
          }
        
          // cheapest
          const cheapestObj = getDiffColorArrow(cheapestVal, avgCheapest);
          c.cheapestArrow   = cheapestObj.arrow;
          c.cheapestColor   = cheapestObj.color;
          c.cheapestDiff    = cheapestObj.absDiff;
        
          // median
          const medianObj   = getDiffColorArrow(medianVal, avgMedian);
          c.medianArrow     = medianObj.arrow;
          c.medianColor     = medianObj.color;
          c.medianDiff      = medianObj.absDiff;
        
          // expensive
          const expObj      = getDiffColorArrow(expensiveVal, avgExpensive);
          c.expensiveArrow  = expObj.arrow;
          c.expensiveColor  = expObj.color;
          c.expensiveDiff   = expObj.absDiff;
        });

        companyDataArray.sort((a, b) => parseFloat(b.top40) - parseFloat(a.top40));
        companyDataArray.forEach((company, idx) => {
            company.rank = idx + 1;  // Rank 1 for highest market share, etc.
          });
      
        // 8) Now we actually compile & insert
        const templateSrc = document.getElementById("company-details-template").innerHTML;
        const template    = Handlebars.compile(templateSrc);
      
        const container   = document.getElementById("companyResults");
        container.innerHTML = ""; // clear old
      
        // Global variable to hold the companies array and current index
        window.allCompanyData = companyDataArray; // already sorted descending by market share
        window.companyRenderIndex = 0; // start at 0

        renderNextCompanies(10);

        // *** PASTE THIS CODE RIGHT HERE: ***
        const companyResultsContainer = document.getElementById("companyResults");
        companyResultsContainer.addEventListener("scroll", function() {
          // If scrolled near the right end, load next batch
          if (this.scrollLeft + this.offsetWidth >= this.scrollWidth - 50) {
            renderNextCompanies(10);
          }
        });
        
        function renderNextCompanies(count = 10) {
          const container = document.getElementById("companyResults");
          const end = Math.min(window.companyRenderIndex + count, window.allCompanyData.length);
          for (let i = window.companyRenderIndex; i < end; i++) {
            const company = window.allCompanyData[i];
            // Attach a new property or copy the object so it includes { index: i }
            const contextForTemplate = {
              ...company,
              thisIndex: i
            };
            const html = template(contextForTemplate);
            container.insertAdjacentHTML("beforeend", html);

            // Paste the snippet immediately after the insertion:
            const newCompany = container.lastElementChild;
            const moreBtn = newCompany.querySelector('.more-tab-button');
            const rankBtn = newCompany.querySelector('.rank-button');
            
            moreBtn.addEventListener('click', () => {
              moreBtn.classList.add('selected');
              rankBtn.classList.remove('selected');
              // your existing click logic for moreBtn will still run (if any)
            });
            
            rankBtn.addEventListener('click', () => {
              rankBtn.classList.add('selected');
              moreBtn.classList.remove('selected');
              // your existing click logic for rankBtn will still run (if any)
            });
          
            // (Optional) render a separate chart
            renderCompanyMarketShareChart(company);
            renderMarketSharePieChartInDetails(company);
          }          
          window.companyRenderIndex = end;
        }
        
        // Render the first batch of 10
        renderNextCompanies(10);        
      
        // 9) If you need mini-charts in the product_trend row,
        companyDataArray.forEach(company => {
          // Use a unique identifier that matches your template’s canvas id
          // (For example, if your template uses "mini-chart-{{companyId}}", then ensure your company object has companyId)
          const canvasId = "mini-chart-" + company.companyId; // or company.companyName if you prefer
          const el = document.getElementById(canvasId);
          if (!el) return;
          
          // Build chartData from the company’s historical_data:
          let chartData = buildCompanyMiniChartData(company.historical_data);
          
          // Initialize the mini-chart (example using Chart.js)
          const ctx = el.getContext("2d");
          new Chart(ctx, {
            type: 'line',
            data: {
              labels: chartData.map(d => d.date),
              datasets: [
                {
                  label: 'Unique Products',
                  data: chartData.map(d => d.unp),
                  borderColor: '#007aff',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  pointRadius: 3,
                  tension: 0.4
                },
                {
                  label: 'On Sale',
                  data: chartData.map(d => d.sale),
                  borderColor: 'red',
                  backgroundColor: 'transparent',
                  borderWidth: 2,
                  pointRadius: 3,
                  tension: 0.4
                }
              ]
            },
            options: {
              responsive: false,
              maintainAspectRatio: false,
              // Add left/right padding of 5px (see bug 3)
              layout: { padding: { left: 5, right: 5 } },
              interaction: { mode: 'index', intersect: false },
              plugins: {
                datalabels: {
                    display: false
                  },
                tooltip: {
                  enabled: true,
                  callbacks: {
                    label: function(context) {
                      // Customize as needed; for example, add a "%" for On Sale values:
                      return context.dataset.label + ": " + context.parsed.y.toFixed(2) +
                        (context.dataset.label === 'On Sale' ? "%" : "");
                    }
                  }
                },
                legend: { display: false }
              },
              scales: {
                x: { display: false },
                y: { display: false }
              }
            }
          });                 
      });
        
        function buildMiniChartData(hd) {
            let arr = [];
            const periodStart = mainDateRange.start; // assumed to be a moment object
            const periodEnd   = mainDateRange.end;
            hd.forEach(dayObj => {
              if (!dayObj.date || !dayObj.date.value) return;
              const d = moment(dayObj.date.value, "YYYY-MM-DD");
              if (!d.isBetween(periodStart, periodEnd, "day", "[]")) return;
              arr.push({
                date: dayObj.date.value,
                position: dayObj.avg_position ? parseFloat(dayObj.avg_position) : 40,
                visibility: dayObj.visibility ? parseFloat(dayObj.visibility) * 100 : 0
              });
            });
            arr.sort((a, b) => a.date.localeCompare(b.date));
            return arr;
          }                           
      }


    function renderSerpMarketShareBigChart(marketData) {
        const chartEl = document.getElementById("marketShareBigChart");
        if (!chartEl) return;
      
        // Clear any previous instance
        if (window.marketShareBigChartInstance) {
          window.marketShareBigChartInstance.destroy();
        }

        const days = 30;
      
        const fs = window.filterState; // your global filter state
        // filter top-level records
        const filtered = (marketData || []).filter(r =>
          (r.q?.toLowerCase() === fs.searchTerm.toLowerCase()) &&
          (r.engine?.toLowerCase() === fs.engine.toLowerCase()) &&
          (r.device?.toLowerCase() === fs.device.toLowerCase()) &&
          (r.location_requested?.toLowerCase() === fs.location.toLowerCase())
        );

        if (!filtered.length) {
          chartEl.innerHTML = "<p>No SERP data found</p>";
          return;
        }
      
        let maxDate = null;
        filtered.forEach(r => {
          (r.historical_data||[]).forEach(d => {
            const m = moment(d.date.value,"YYYY-MM-DD");
            if (!maxDate || m.isAfter(maxDate)) maxDate=m.clone();
          });
        });
        if (!maxDate) {
          chartEl.innerHTML = "<p>No date data for SERP</p>";
          return;
        }
        const periodEnd   = maxDate.clone();
        const periodStart = maxDate.clone().subtract(days-1,"days");

        let shareField = 'market_share'; // default for Top 40
        if (window.filterState && window.filterState.serpSegments) {
          switch (window.filterState.serpSegments) {
            case 'top3':
              shareField = 'top3_market_share';
              break;
            case 'top4-8':
              shareField = 'top4_8_market_share';
              break;
            case 'top9-14':
              shareField = 'top9_14_market_share';
              break;
            case 'below14':
              shareField = 'below14_market_share';
              break;
            case 'top8':
              shareField = 'top8_market_share';
              break;
            case 'below8':
              shareField = 'below8_market_share';
              break;
            default:
              shareField = 'market_share';
          }
        }
      
        // Build dailyMap[dateStr][companyName] = sumOfShare
        const dailyMap = {};
        filtered.forEach(rec => {
          (rec.historical_data || []).forEach(d => {
            const dd = moment(d.date.value, "YYYY-MM-DD");
            if (!dd.isBetween(periodStart, periodEnd, "day", "[]")) return;
            // Multiply by 100 to get percentage.
            const val = parseFloat(d[shareField]) * 100 || 0;
            const dateStr = dd.format("YYYY-MM-DD");
            if (!dailyMap[dateStr]) dailyMap[dateStr] = {};
            const cName = (rec.source && rec.source.trim()) || "Unknown";
            if (!dailyMap[dateStr][cName]) dailyMap[dateStr][cName] = 0;
            dailyMap[dateStr][cName] += val;
          });
        });
      
        // all unique dates in ascending order
        let allDates = Object.keys(dailyMap).sort();
        if (!allDates.length) {
          chartEl.innerHTML = "<p>No market share found in this date range</p>";
          return;
        }
      
        // Sum total share by company across this window => pick top 10
        const companyTotals = {};
        allDates.forEach(dateStr => {
          Object.entries(dailyMap[dateStr]).forEach(([cName, val]) => {
            if (!companyTotals[cName]) companyTotals[cName]=0;
            companyTotals[cName]+= val;
          });
        });
        const sortedByTotal = Object.entries(companyTotals).sort((a,b)=> b[1]-a[1]);
        const top10 = sortedByTotal.slice(0,10).map(x=>x[0]); // top 10
        const isTop10 = cName => top10.includes(cName);

        const selectedCoRaw = (window.filterState.company || "").trim();
        const selectedCo = selectedCoRaw.toLowerCase();
        if (selectedCo) {
          const lowerTop10 = top10.map(c => c.toLowerCase());
          if (!lowerTop10.includes(selectedCo)) {
            // push it in
            top10.push(selectedCoRaw);
            // optional: to keep strictly 10, do => top10.pop();
          }
        }
      
        // Build final seriesMap. We'll have "Other" for companies not in top10
        const seriesMap = {};
        top10.forEach(c => { seriesMap[c] = []; });
        seriesMap["Others"] = [];
      
        allDates.forEach(dateStr => {
          const dayObj = dailyMap[dateStr];
          let sumOthers=0;
          top10.forEach(c => {
            const val = dayObj[c]||0;
            seriesMap[c].push({ x: dateStr, y: val });
          });
          Object.keys(dayObj).forEach(c => {
            if (!isTop10(c)) sumOthers+= dayObj[c];
          });
          seriesMap["Others"].push({ x: dateStr, y: sumOthers });
        });
      
        // Convert seriesMap => array
        let finalSeries = [];
        for (let cName in seriesMap) {
          finalSeries.push({ name:cName, data: seriesMap[cName] });
        }
      
        // ---------------------------------------------
        // NEW LOGIC: If user has selected a company, 
        // move that company’s area to the BOTTOM 
        // (index 0) and color everyone else grey.
        // ---------------------------------------------
        if (window.filterState.company && window.filterState.company.trim() !== "") {
          const selCompany = window.filterState.company.trim().toLowerCase();
        
          // Find the index of that series in finalSeries:
          let selIndex = finalSeries.findIndex(s => s.name.toLowerCase() === selCompany);
          if (selIndex >= 0) {
            // 1) Splice it out
            const [selectedObj] = finalSeries.splice(selIndex, 1);
        
            // 2) Put it at the front so it’s the *bottom* stacked area
            finalSeries.unshift(selectedObj);
        
            // 3) Now color the selected company normally, 
            //    and color all the rest in light grey variants.
            //    (Below is just an example approach.)
            finalSeries.forEach((seriesObj, i) => {
              if (i === 0) {
                // The selected company (index 0 => bottom of the stack)
                // Keep or set your normal color(s) as you wish:
                // Option A: Let Apex assign a default color => do nothing
                // Option B: Force a color & fill, e.g.:
                seriesObj.color = "#007aff";
                // or a custom property if you handle it in `colors: ...`
              } else {
                // All other companies
                // Let’s assign a slightly different grey for each
                // so they’re all visible but subdued:
                // e.g. “lighter” grey for i=1, a bit darker for i=2, etc.
                const greyLevel = 180 + i*8;  // tweak as you like
                const capped    = Math.min(greyLevel, 230);
                const greyHex   = `rgb(${capped},${capped},${capped})`;
        
                // We can store a property that you’ll use in apex "colors" or "fill"
                seriesObj.color = greyHex;
              }
            });
          }
        
        } else {
          // NO company selected => keep the original top10 + Others logic
          // (Do nothing special or re-implement the old “Others on the bottom” if you like.)
        }        
      
        // 2) Construct the ApexCharts config
        const options = {
          series: finalSeries,
          chart: {
            type: "area",
            height: "100%",
            width: "100%",
            stacked: true,
            toolbar: { show:true },
            zoom: { enabled:true },
            animations: {
                enabled: true,
                speed: 500, // set base animation duration to 1sec
                animateGradually: {
                  enabled: true,
                  delay: 50     // remove any delay between elements
                },
                dynamicAnimation: {
                  enabled: true,
                  speed: 500  // also update dynamic animation speed to 1sec
                }
              }              
          },
          dataLabels: (window.filterState.company && window.filterState.company.trim() !== "")
          ? {
               enabled: true,
               formatter: function(val, opts) {
                 if (opts.seriesIndex === 0) {
                   return val.toFixed(2) + "%";
                 }
                 return "";
               },
               offsetY: -5,
               style: { fontSize: '12px', colors: ['#000'] }
            }
          : { enabled: false },        
        // Conditionally show markers: only for the selected series (index 0)
        markers: (window.filterState.company && window.filterState.company.trim() !== "")
          ? { size: finalSeries.map((s, i) => (i === 0 ? 6 : 0)) }
          : { size: 0 },
          stroke: {
            curve: "smooth",
            width: 2
          },
          xaxis: {
            type: "datetime",
            labels: { show:true }
          },
          yaxis: {
            labels: { show:true,
            formatter: function(val) { return val.toFixed(2); }
            },
            title: { text: "Market Share (%)" },
            max: 100
          },
          legend: {
            show: true,
            position: "top",
            horizontalAlign: "left"
          },
          tooltip: {
            custom: function({ series, dataPointIndex, w }) {
              // Use the x-axis label directly as the date.
              let formattedDate = w.globals.labels[dataPointIndex] || "";
          
              // Build an array of tooltip items – one per series.
              let tooltipItems = [];
              for (let i = 0; i < series.length; i++) {
                // Get the company name from the series config.
                let companyName = w.config.series[i].name;
                // Get the series color from the global colors array.
                let seriesColor = (w.globals.colors && w.globals.colors[i]) || "#007aff";
                // Get the current value.
                let currentValue = series[i][dataPointIndex];
                // Get the previous value (if available).
                let previousValue = dataPointIndex > 0 ? series[i][dataPointIndex - 1] : null;
                let trendStr = "";
                if (previousValue !== null) {
                  let diff = currentValue - previousValue;
                  if (diff > 0) {
                    trendStr = "▲ " + diff.toFixed(2) + "%";
                  } else if (diff < 0) {
                    trendStr = "▼ " + Math.abs(diff).toFixed(2) + "%";
                  } else {
                    trendStr = "±0.00%";
                  }
                }
                tooltipItems.push({
                  companyName,
                  currentValue,
                  trendStr,
                  seriesColor
                });
              }
          
              // Sort items by currentValue in descending order.
              let sortedItems = tooltipItems.slice().sort((a, b) => b.currentValue - a.currentValue);
          
              // Separate out the "Others" group (case-insensitive).
              let othersItems = sortedItems.filter(item => item.companyName.trim().toLowerCase() === "others");
              let nonOthersItems = sortedItems.filter(item => item.companyName.trim().toLowerCase() !== "others");
          
              // Assign rank numbers only to non-"Others" items.
              for (let i = 0; i < nonOthersItems.length; i++) {
                nonOthersItems[i].rank = i + 1;
              }
              // "Others" items will be appended at the bottom.
              let finalItems = nonOthersItems.concat(othersItems);
          
              // Build HTML with a table (invisible grid, no headers) styled in an Apple‑corp way.
              let html = `
                <div style="
                    padding: 10px;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.08);
                ">
                  <div style="margin-bottom: 8px; font-size: 14px; color: #333;">
                    ${formattedDate}
                  </div>
                  <table style="
                      width: 100%;
                      border-collapse: collapse;
                      font-size: 14px;
                      color: #333;
                  ">
              `;
          
              finalItems.forEach(item => {
                // Only non-"Others" get a rank circle.
                let rankHtml = "";
                if (item.companyName.trim().toLowerCase() !== "others") {
                  rankHtml = `<span style="
                          display: inline-block;
                          width: 24px;
                          height: 24px;
                          line-height: 24px;
                          border-radius: 12px;
                          background: ${item.seriesColor};
                          color: #fff;
                          text-align: center;
                          margin-right: 8px;
                          font-weight: bold;
                        ">
                          ${item.rank}
                        </span>`;
                }
                
                // Color the trend string based on the arrow.
                let trendColored = item.trendStr;
                if (item.trendStr.startsWith("▲")) {
                  trendColored = `<span style="color: green;">${item.trendStr}</span>`;
                } else if (item.trendStr.startsWith("▼")) {
                  trendColored = `<span style="color: red;">${item.trendStr}</span>`;
                }
                
                html += `
                  <tr>
                    <td style="padding: 4px 8px; vertical-align: middle;">
                      ${rankHtml}<strong>${item.companyName}</strong>
                    </td>
                    <td style="padding: 4px 8px; text-align: right; vertical-align: middle;">
                      ${item.currentValue.toFixed(2)}% ${trendColored}
                    </td>
                  </tr>
                `;
              });
          
              html += `</table></div>`;
              return html;
            }
          }
          ,
          fill: {
            type: "gradient",
            gradient: { opacityFrom:0.75, opacityTo:0.95 }
          }
        };
      
        // 3) Make or re‑make the chart
        window.marketShareBigChartInstance = new ApexCharts(chartEl, options);
        window.marketShareBigChartInstance.render();
        renderSerpCompaniesTable(marketData);
        fixSerpCompaniesTable();
      }

      function saveToggleSettingToWix(toggleId, isChecked) {
        // 1) Build the message object
        const msgPayload = {
          command: "saveUserSettings",   // or "saveToggleSetting" – your choice
          token: embedToken,             // embedToken was set via parent => embed
          data: JSON.stringify({
            toggleId,
            isChecked
          })
        };
      
        window.parent.postMessage(JSON.stringify(msgPayload), "*");
    }

