      function renderCompanyTableMode(companyRows) {

        let dateColumns = [];
        if (selectedPeriod === "custom") {
          let dt = mainDateRange.start.clone();
          while (dt.isSameOrBefore(mainDateRange.end, "day")) {
            dateColumns.push(dt.format("YYYY-MM-DD"));
            dt.add(1, "days");
          }
        } else {
          // e.g. 3d/7d/30d logic
          let overallMax = getGlobalMaxDate(companyRows); // or your standard approach
          for (let i=0; i<30; i++){
            dateColumns.push(
              overallMax.clone().subtract(i, "days").format("YYYY-MM-DD")
            );
          }
        }

        // 2) Map companyRows into the fields your template expects:
        const mappedData = companyRows.map(c => ({
          source: c.companyName,            // used by {{source}}
          finalMarketShare: c.top40,        // used by {{finalMarketShare}}
          historical_data: c.historical_data
          // (You can add more if needed, e.g. c.rank, etc.)
        }));
        
        // 3) Build the Handlebars context:
        const context = {
          data: mappedData,
          dateColumns: dateColumns
        };
      
        // 3) Compile and place into #companyTable
        const source = document.getElementById("company-table-template").innerHTML;
        const template = Handlebars.compile(source);
        const html = template(context);
        const tableContainer = document.getElementById("companyTable");
        tableContainer.innerHTML = html;
      }      
      
      function renderCompaniesTable() {
        // 1) Pull the relevant marketShareData from the global variable
        const marketData = window.companyStatsData;
        if (!marketData || !Array.isArray(marketData) || marketData.length === 0) {
          const container = document.getElementById("companiesTableContainer");
          if (container) container.innerHTML = "<p>No data</p>";
          return;
        }

        const mapping = window.serpSegmentMapping;
        let prodField = "unique_products";   // default products field
        let saleField = "un_products_on_sale"; // default on-sale field
        let prodHeaderLabel = "Prod";          // default header label
        let showSaleColumns = true;            // default: show On Sale columns

        if (window.filterState.serpSegments && mapping[window.filterState.serpSegments]) {
        prodField = mapping[window.filterState.serpSegments].prod;
        prodHeaderLabel = "Avg Prod"; // as requested change the header label
        showSaleColumns = mapping[window.filterState.serpSegments].showSale;
        }
      
        // 2) Use computeMarketShareData for the *current* window
        //    (the same function used by the market share pie chart).
        const currentUnified = computeMarketShareData(marketData, false);
        if (!currentUnified) {
          const container = document.getElementById("companiesTableContainer");
          if (container) container.innerHTML = "<p>No data</p>";
          return;
        }
      
        // Build a map for the “current” market share: { companyName -> share }
        // Note: computeMarketShareData() returns { companies: [...], marketShares: [...], totalMarketShare }
        const currentShareMap = {};
        currentUnified.companies.forEach((comp, i) => {
          currentShareMap[comp] = currentUnified.marketShares[i]; // e.g. 12.34
        });
      
        ///////////////////////////////////////////////////////////////////////
        // 3) Use the same function for a *previous* window to get “diff” arrow
        ///////////////////////////////////////////////////////////////////////
      
        // Save our original selectedPeriod:
        const originalPeriod = selectedPeriod;
      
        // We’ll figure out how many days to shift based on selectedPeriod:
        let periodDays = 7; // default if “7d”
        if (originalPeriod === "3d")  periodDays = 3;
        if (originalPeriod === "30d") periodDays = 30;
      
        // We'll collect all filtered records (same filters as computeMarketShareData)
        // so we can find the overallMaxDate for the “current” window
        const fs = window.filterState;
        const filteredRecs = marketData.filter(record => {
          return (
            record.q?.toLowerCase() === fs.searchTerm.toLowerCase() &&
            record.engine?.toLowerCase() === fs.engine.toLowerCase() &&
            record.device?.toLowerCase() === fs.device.toLowerCase() &&
            record.location_requested?.toLowerCase() === fs.location.toLowerCase()
          );
        });
      
        let overallMaxDate = null;
        filteredRecs.forEach(record => {
          if (!record.historical_data) return;
          record.historical_data.forEach(dayObj => {
            if (!dayObj.date || !dayObj.date.value) return;
            const d = moment(dayObj.date.value, "YYYY-MM-DD");
            if (!overallMaxDate || d.isAfter(overallMaxDate)) {
              overallMaxDate = d.clone();
            }
          });
        });        
      
        // If still null => no data after filters
        if (!overallMaxDate) {
          const container = document.getElementById("companiesTableContainer");
          if (container) container.innerHTML = "<p>No data</p>";
          return;
        }
      
        // Current window is [ (overallMaxDate - (periodDays-1)), overallMaxDate ]
        const currentStart = overallMaxDate.clone().subtract(periodDays - 1, 'days');
        // The “previous” window is just the preceding block of days
        const prevEnd   = currentStart.clone().subtract(1, "days");
        const prevStart = prevEnd.clone().subtract(periodDays - 1, "days");
        // DEBUG: Log the date ranges
console.log("[TEST bug 1] DEBUG - Date Range Calculation:");
console.log("[TEST bug 1] Period setting:", originalPeriod, "=>", periodDays, "days");
console.log("[TEST bug 1] Overall max date:", overallMaxDate.format("YYYY-MM-DD"));
console.log("[TEST bug 1] CURRENT period: from", currentStart.format("YYYY-MM-DD"), "to", overallMaxDate.format("YYYY-MM-DD"));
console.log("[TEST bug 1] PREVIOUS period: from", prevStart.format("YYYY-MM-DD"), "to", prevEnd.format("YYYY-MM-DD"));
      
function computeMarketShareDataForCustomRange(marketData, start, end) {
  console.log("DEBUG - computeMarketShareDataForCustomRange called with:", {
    start: start.format("YYYY-MM-DD"),
    end: end.format("YYYY-MM-DD")
  });
  
  // Save current state
  const savedPeriod = window.selectedPeriod;
  const savedDateRange = window.mainDateRange;
  const savedCache = window.dataCache;
  
  try {
    // Set custom period and disable cache
    window.selectedPeriod = "custom";
    window.mainDateRange = {
      start: start.clone(),
      end: end.clone()
    };
    window.dataCache = null; // Disable cache
    
    // Call the function
    const result = computeMarketShareData(marketData, false);
    
    return result;
    
  } finally {
    // Always restore state
    window.selectedPeriod = savedPeriod;
    window.mainDateRange = savedDateRange;
    window.dataCache = savedCache;
  }
}
      
        // Now fetch the “previous” window data
        const prevUnified = computeMarketShareDataForCustomRange(marketData, prevStart, prevEnd) || null;
        console.log("[TEST bug 1] DEBUG - Market Share Results:");
console.log("[TEST bug 1] Current unified companies:", currentUnified.companies);
console.log("[TEST bug 1] Current unified shares:", currentUnified.marketShares);
console.log("[TEST bug 1] Previous unified companies:", prevUnified?.companies);
console.log("[TEST bug 1] Previous unified shares:", prevUnified?.marketShares);
      
        // Build a map of that previous share
        const prevShareMap = {};
        if (prevUnified && prevUnified.companies) {
          prevUnified.companies.forEach((comp, i) => {
            prevShareMap[comp] = prevUnified.marketShares[i];
          });
        }
      
        // Restore the user’s originalPeriod
        selectedPeriod = originalPeriod;
      
        /////////////////////////////////////////////////////////////////
        // 4) We also want “Prod” / “On Sale” / “% On Sale” columns.
        //    We can do the same aggregator approach for both “current” and “previous”
        /////////////////////////////////////////////////////////////////
        // REPLACEMENT aggregator that looks inside r.historical_data
        function aggregateProductsAndSales(records, startMoment, endMoment, prodField, saleField, showSaleColumns) {
          // 1) Unfold each record’s historical_data
          //    Only keep days within [startMoment..endMoment]
          const dailyRows = [];
          records.forEach(r => {
            const companyName = (r.source || "unknown").toLowerCase();
            if (!r.historical_data) return;
            r.historical_data.forEach(dayObj => {
              if (!dayObj.date || !dayObj.date.value) return;
              const d = moment(dayObj.date.value, "YYYY-MM-DD");
              if (!d.isBetween(startMoment, endMoment, "day", "[]")) return; 
              
              // read the daily product & sale from whichever fields 
              // top3_avg_products, un_products_on_sale, etc.
              const dayProdVal = parseFloat(dayObj[prodField]) || 0;
              const daySaleVal = showSaleColumns ? parseFloat(dayObj[saleField]) || 0 : 0;
        
              dailyRows.push({
                company: companyName,
                prod:    dayProdVal,
                sale:    daySaleVal
              });
            });
          });
        
          // 2) Group the dailyRows by company => sum up products/sales, count days
          const map = {};
          dailyRows.forEach(row => {
            const c = row.company;
            if (!map[c]) {
              map[c] = { totalProd: 0, totalSale: 0, dayCount: 0 };
            }
            map[c].totalProd += row.prod;
            map[c].totalSale += row.sale;
            map[c].dayCount += 1; 
          });
        
          // 3) For each company, compute the average
          const out = {};
          Object.keys(map).forEach(c => {
            const obj = map[c];
            const avgProd = (obj.dayCount > 0) ? (obj.totalProd / obj.dayCount) : 0;
            const avgSale = (obj.dayCount > 0) ? (obj.totalSale / obj.dayCount) : 0;
            out[c] = { avgProd, avgSale };
          });
          return out;
        }                 
      
        // current window records
        const currentRecs = filteredRecs.filter(r => {
            if (!r.historical_data) return false;
            // Keep this record if ANY day in r.historical_data is within [currentStart .. overallMaxDate]
            return r.historical_data.some(dayObj => {
              if (!dayObj.date || !dayObj.date.value) return false;
              const d = moment(dayObj.date.value, "YYYY-MM-DD");
              return d.isBetween(currentStart, overallMaxDate, "day", "[]");
            });
          });          
        // previous window records
        const prevRecs = filteredRecs.filter(r => {
            if (!r.historical_data) return false;
            return r.historical_data.some(dayObj => {
              if (!dayObj.date || !dayObj.date.value) return false;
              const d = moment(dayObj.date.value, "YYYY-MM-DD");
              return d.isBetween(prevStart, prevEnd, "day", "[]");
            });
          });          
      
         // NEW aggregator: we pass the date range & fields
         const currentProdMap = aggregateProductsAndSales(
           currentRecs,
           currentStart,         // from your existing code
           overallMaxDate,       // from your existing code
           prodField,
           saleField,
           showSaleColumns
         );
         
         const prevProdMap = aggregateProductsAndSales(
           prevRecs,
           prevStart,            // from your existing code
           prevEnd,              // from your existing code
           prodField,
           saleField,
           showSaleColumns
         );
      
        // 5) Build a combined list of companies from the “current share map”
        //    plus anything that shows up in prevShareMap or in the aggregator’s keys
        let companiesSet = new Set([...Object.keys(currentShareMap), ...Object.keys(prevShareMap), ...Object.keys(currentProdMap), ...Object.keys(prevProdMap)]);
        const companies = Array.from(companiesSet);
      
        // Sort them descending by current share
        companies.sort((a, b) => (currentShareMap[b] || 0) - (currentShareMap[a] || 0));
        console.log("[TEST bug 1] DEBUG - Company name check:");
        console.log("[TEST bug 1] First company in list:", companies[0]);
        console.log("[TEST bug 1] Its value in currentShareMap:", currentShareMap[companies[0]]);
        console.log("[TEST bug 1] Its value in prevShareMap:", prevShareMap[companies[0]]);
        //////////////////////////////////////////////////////////
        // 6) Build the HTML with 7 columns:
        //    [Name | Market Share bar | Share trend | Prod | Prod trend | On Sale | % On Sale]
        //////////////////////////////////////////////////////////
        let html = `
          <table class="company-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="width:140px;"></th>            <!-- Col 1: Company name -->
                <th style="width:120px; text-align: left;">Market Share</th><!-- Col 2: bars -->
                <th style="width:80px;">Trend</th>        <!-- Col 3: share trend arrow -->
                <th style="width:80px;">${prodHeaderLabel}</th>         
                ${ showSaleColumns ? '<th style="width:80px;">%  On Sale</th>' : '' }                
              </tr>
            </thead>
            <tbody>
        `;
      
        companies.forEach(c => {
          const isMyCompany = c.toLowerCase() === (window.myCompany || '').toLowerCase();
          const myCompanyStyle = isMyCompany ? 'background-color: #e6ffe6;' : '';
          // Current share vs previous
          const curShare = currentShareMap[c] || 0;
          const prevShare= prevShareMap[c]    || 0;
          const shareDiff= curShare - prevShare;
      
          let shareArrow= "±", shareColor="#444";
          if (shareDiff>0){ shareArrow="▲"; shareColor="green"; }
          else if (shareDiff<0){ shareArrow="▼"; shareColor="red"; }
      
          // Current product aggregator
          const curProdObj = currentProdMap[c] || { avgProd:0, avgSale:0 };
          const prevProdObj= prevProdMap[c]    || { avgProd:0, avgSale:0 };
      
          const prodDiff = curProdObj.avgProd - prevProdObj.avgProd;
          let prodArrow= "±", prodColor="#444";
          if (prodDiff>0){ prodArrow="▲"; prodColor="green"; }
          else if (prodDiff<0){ prodArrow="▼"; prodColor="red"; }
      
          // On sale ratio
          const onSalePct = (curProdObj.avgProd>0) ? (curProdObj.avgSale / curProdObj.avgProd *100) : 0;
      
          // Build each row:
          html += `
            <tr style="border-bottom:1px solid #ccc; ${myCompanyStyle}">
              <!-- Column 1: company name -->
              <td style="padding:6px;">
              <a href="#" class="company-name-link" data-company="${c}" style="cursor:pointer; text-decoration:none; color:inherit;">
              ${c}
            </a>
            </td>
              <!-- Column 2: Market share bar -->
              <td style="padding:6px;">
                <div class="ms-bar-container" style="margin-bottom:4px;">
                  <div class="ms-bar-filled" style="width:${curShare}%;"></div>
                  <span class="ms-bar-label" style="left:calc(${curShare}% + 4px);">
                    ${curShare.toFixed(2)}%
                  </span>
                </div>
              </td>
              <!-- Column 3: share trend arrow/diff -->
              <td style="text-align:center; color:${shareColor}; font-weight:bold;">
              ${shareArrow} ${Math.abs(shareDiff).toFixed(2)}%
            </td>
              <!-- Column 4: Products -->
              <td style="text-align:center;">
                ${curProdObj.avgProd.toFixed(2)}
              </td>
              ${ showSaleColumns ? `
                <td style="text-align:center;">
                  ${onSalePct.toFixed(2)}%
                </td>
              ` : '' }              
            </tr>
          `;          
        });
      
        html += "</tbody></table>";
      
        // 7) Insert final HTML into #companiesTableContainer
        const container = document.getElementById("companiesTableContainer");
        if (container) {
          container.innerHTML = html;
        }
        document.querySelectorAll('.company-name-link').forEach(link => {
            link.addEventListener('click', function(e) {
              e.preventDefault();
              const selectedCompany = this.getAttribute('data-company');
              window.filterState.company = selectedCompany;
              document.getElementById("companyText").textContent = selectedCompany;
              document.getElementById("companyClear").style.display = "inline-block";
              document.getElementById("companyDropdown").style.display = "none";
              if (typeof renderData === "function") {
                console.log("[TRACE] renderData() called from document.querySelectorAll.company-name-link");
                console.trace();
                renderData();
              } else {
                console.warn("renderData() not yet defined — skipping this trace");
              }              
              updateCompanyDropdown(window.filteredData);
            });
          });          
      } 

/********************************************************************
  4) The “populate” functions for each mode
********************************************************************/

function populateTableData(insightsEl, companyCard) {
  const indexStr = companyCard.getAttribute("data-company-index");
  const index = parseInt(indexStr, 10);
  const company = window.allCompanyData[index];
  if (!company) return;

  // (Example) If you have a “company-bar”:
  const companyBarDiv = insightsEl.querySelector('.company-bar div');
  if (companyBarDiv) {
    companyBarDiv.textContent = company.companyName;
  }

  // The main table
  const tableEl = insightsEl.querySelector(".company-insights-table");
  if (!tableEl) return;

  const tbody = tableEl.querySelector("tbody");
  const rows = tbody.querySelectorAll("tr");
  if (rows.length < 5) return; // sanity check

  // ----- ROW 0: TOP 40 -----
  {
    const row0Cells = rows[0].querySelectorAll("td");
    // Market-Share chart container
    row0Cells[1].innerHTML = `
      <div class="mini-market-chart" id="segmentChartTop40-${index}" style="width:500px; height:150px;"></div>
    `;
    const chartContainer0 = row0Cells[1].querySelector(`#segmentChartTop40-${index}`);
    if (chartContainer0) {
      renderSegmentMarketShareChart(company, "top40", chartContainer0);
    }
    const top40GainersLosersHtml = buildGainersLosersHtml(
      window.allCompanyData, company.companyId, "top40"
    );
    row0Cells[2].innerHTML = top40GainersLosersHtml;
  }

  // ----- ROW 1: TOP 3 -----
  {
    const row1Cells = rows[1].querySelectorAll("td");
    row1Cells[1].innerHTML = `
      <div class="mini-market-chart" id="segmentChartTop3-${index}" style="width:500px; height:150px;"></div>
    `;
    const chartContainer1 = row1Cells[1].querySelector(`#segmentChartTop3-${index}`);
    if (chartContainer1) {
      renderSegmentMarketShareChart(company, "top3", chartContainer1);
    }
    const top3GainersLosersHtml = buildGainersLosersHtml(
      window.allCompanyData, company.companyId, "top3"
    );
    row1Cells[2].innerHTML = `
      <span style="font-weight:bold; font-size:14px; color:${company.top3TrendColor};">
        ${company.companyName}: ${company.top3}%  ${company.top3TrendArrow} ${company.top3TrendValue}%
      </span>
      ${top3GainersLosersHtml}
    `;
  }

  // ----- ROW 2: TOP 4-8 -----
  {
    const row2Cells = rows[2].querySelectorAll("td");
    row2Cells[1].innerHTML = `
      <div class="mini-market-chart" id="segmentChartTop4_8-${index}" style="width:500px; height:150px;"></div>
    `;
    const chartContainer2 = row2Cells[1].querySelector(`#segmentChartTop4_8-${index}`);
    if (chartContainer2) {
      renderSegmentMarketShareChart(company, "top4_8", chartContainer2);
    }
    const top4_8GainersLosersHtml = buildGainersLosersHtml(
      window.allCompanyData, company.companyId, "top4-8"
    );
    row2Cells[2].innerHTML = `
      <span style="font-weight:bold; font-size:14px; color:${company.top4_8TrendColor};">
        ${company.companyName}: ${company.top4_8}%  ${company.top4_8TrendArrow} ${company.top4_8TrendValue}%
      </span>
      ${top4_8GainersLosersHtml}
    `;
  }

  // ----- ROW 3: TOP 9-14 -----
  {
    const row3Cells = rows[3].querySelectorAll("td");
    row3Cells[1].innerHTML = `
      <div class="mini-market-chart" id="segmentChartTop9_14-${index}" style="width:500px; height:150px;"></div>
    `;
    const chartContainer3 = row3Cells[1].querySelector(`#segmentChartTop9_14-${index}`);
    if (chartContainer3) {
      renderSegmentMarketShareChart(company, "top9_14", chartContainer3);
    }
    const top9_14GainersLosersHtml = buildGainersLosersHtml(
      window.allCompanyData, company.companyId, "top9-14"
    );
    row3Cells[2].innerHTML = `
      <span style="font-weight:bold; font-size:14px; color:${company.top9_14TrendColor};">
        ${company.companyName}: ${company.top9_14}%  ${company.top9_14TrendArrow} ${company.top9_14TrendValue}%
      </span>
      ${top9_14GainersLosersHtml}
    `;
  }

  // ----- ROW 4: BELOW 14 -----
  {
    const row4Cells = rows[4].querySelectorAll("td");
    row4Cells[1].innerHTML = `
      <div class="mini-market-chart" id="segmentChartBelow14-${index}" style="width:500px; height:150px;"></div>
    `;
    const chartContainer4 = row4Cells[1].querySelector(`#segmentChartBelow14-${index}`);
    if (chartContainer4) {
      renderSegmentMarketShareChart(company, "below14", chartContainer4);
    }
    const below14GainersLosersHtml = buildGainersLosersHtml(
      window.allCompanyData, company.companyId, "below14"
    );
    row4Cells[2].innerHTML = `
      <span style="font-weight:bold; font-size:14px; color:${company.below14TrendColor};">
        ${company.companyName}: ${company.below14}%  ${company.below14TrendArrow} ${company.below14TrendValue}%
      </span>
      ${below14GainersLosersHtml}
    `;
  }
}

function populateRankData(insightsEl, companyCard) {
    const indexStr = companyCard.getAttribute("data-company-index");
    const index = parseInt(indexStr, 10);
    const company = window.allCompanyData[index];
    if (!company) return;
  
    // 1) Build dateColumns array
    let dateColumns = [];
    const selectedPeriod = window.filterState.period || "7d";
    const globalMaxDate = getGlobalMaxDate([company]);
    if (!globalMaxDate) return;
  
    if (selectedPeriod === "custom") {
      let dt = mainDateRange.end.clone();       // We'll start from end -> back
      while (dt.isSameOrAfter(mainDateRange.start, "day")) {
        dateColumns.push(dt.format("YYYY-MM-DD"));
        dt.subtract(1, "days");
      }
    } else {
      let days = 7;
      if (selectedPeriod === "3d") days = 3;
      if (selectedPeriod === "30d") days = 30;
      let end   = globalMaxDate.clone();
      let start = end.clone().subtract(days - 1, "days");
      // We'll go from end..start so that the latest date ends up first in the array
      let dt = end.clone();
      while (dt.isSameOrAfter(start, "day")) {
        dateColumns.push(dt.format("YYYY-MM-DD"));
        dt.subtract(1, "days");
      }
    }
    // Now dateColumns[0] is the latest date, dateColumns[dateColumns.length-1] is oldest
  
    // 2) Access the 3 tables in the DOM
    const table1 = insightsEl.querySelector("#rankTable_1 table");
    const table2 = insightsEl.querySelector("#rankTable_2 table");
    const table3 = insightsEl.querySelector("#rankTable_3 table");
  
    // Helper to append the reversed date columns as TH with vertical text
    function appendDateHeaders(table, dateCols) {
      const colgroup = table.querySelector("colgroup");
      const theadTr  = table.querySelector("thead tr");
      dateCols.forEach(dateStr => {
        // <col style="width:65px;">
        const c = document.createElement("col");
        c.style.width = "65px";
        colgroup.appendChild(c);
  
        // <th class="date-col"><div class="vertical-header">...</div></th>
        const th = document.createElement("th");
        th.classList.add("date-col");
        th.innerHTML = `<div class="vertical-header">${dateStr}</div>`;
        theadTr.appendChild(th);
      });
    }
    appendDateHeaders(table1, dateColumns);
    appendDateHeaders(table2, dateColumns);
    appendDateHeaders(table3, dateColumns);
  
    // Build a map of daily data for quick lookup
    const dailyMap = {};
    (company.historical_data || []).forEach(dayObj => {
      if (!dayObj.date || !dayObj.date.value) return;
      dailyMap[dayObj.date.value] = dayObj;
    });
  
    // We'll reuse your colorRange logic from the apple-table, e.g.:
    function colorRangeClass(rankValue) {
      // parse float
      const val = parseFloat(rankValue);
      if (isNaN(val)) return "";
      if (val <= 3) return "range-green";
      else if (val <= 8) return "range-yellow";
      else if (val <= 14) return "range-orange";
      return "range-red";
    }
  
    function getSegmentFields(segment) {
      switch (segment) {
        case "top40":   return { shareField: "market_share",      rankField: "rank" };
        case "top3":    return { shareField: "top3_market_share", rankField: "top3_rank" };
        case "top4-8":  return { shareField: "top4_8_market_share",  rankField: "top4_8_rank" };
        case "top9-14": return { shareField: "top9_14_market_share", rankField: "top9_14_rank" };
        case "below14": return { shareField: "below14_market_share", rankField: "below14_rank" };
        case "top8":    return { shareField: "top8_market_share",    rankField: "top8_rank" };
        case "below8":  return { shareField: "below8_market_share",  rankField: "below8_rank" };
      }
      return { shareField: "market_share", rankField: "rank" };
    }
  
    // Helper to compute the average share over all dateColumns
    function computeAverageShare(shareField) {
      let sum = 0, count = 0;
      dateColumns.forEach(dStr => {
        const rec = dailyMap[dStr];
        if (rec && rec[shareField] != null) {
          sum += parseFloat(rec[shareField]);
          count++;
        }
      });
      if (count === 0) return 0;
      return (sum / count) * 100; // convert fraction->percent
    }
  
    // Now fill each row in each table
    [table1, table2, table3].forEach(tableEl => {
      const rows = tableEl.querySelectorAll("tbody tr");
      rows.forEach(row => {
        const segment = row.getAttribute("data-segment");
        const { shareField, rankField } = getSegmentFields(segment);
  
        // 3) Instead of just text, use a “bar” for market share
        const msCell = row.querySelector(".ms-cell");
        if (msCell) {
          const avgPct = computeAverageShare(shareField).toFixed(1);
          msCell.innerHTML = `
            <div class="ms-bar-container" style="width:100px; height:20px; background:#eee; position:relative; border-radius:4px; overflow:hidden;">
              <div class="ms-bar-filled" style="
                    position:absolute; top:0; left:0; bottom:0;
                    width:${avgPct}%; 
                    background:#007aff;">
              </div>
              <div class="ms-bar-label" style="
                    position:absolute; left:8px; top:0; bottom:0;
                    display:flex; align-items:center;
                    font-size:13px; color:#000;">
                ${avgPct}%
              </div>
            </div>
          `;
        }
  
        // 4) For each date, build a <td>
        dateColumns.forEach(dateStr => {
          const rec = dailyMap[dateStr];
          let rankVal = "";
          let shareVal = "";
          if (rec) {
            if (rec[rankField] != null) rankVal = rec[rankField];
            if (rec[shareField] != null) {
              shareVal = (parseFloat(rec[shareField]) * 100).toFixed(1) + "%";
            }
          }
          const td = document.createElement("td");
          td.classList.add("date-col");
          if (rankVal) {
            // color the cell by range
            const cClass = colorRangeClass(rankVal);
            if (cClass) td.classList.add(cClass);
  
            td.innerHTML = `
              <div class="position-value">${rankVal}</div>
              <div class="visibility-value">${shareVal}</div>
            `;
          } else {
            td.innerHTML = `<div class="position-value">—</div>`;
          }
          row.appendChild(td);
        });
      });
    });
    updateInfoBlock();
    updateHistoryRows();
    hideFiltersOnProjectAndHome();
  } 

 function buildGainersLosersHtml(allCompanies, currentCompanyId, segmentName) {
    let trendValueField, trendArrowField;
    
    // Decide which fields to read
    switch (segmentName) {
      case "top3":
        trendValueField = "top3TrendValue";
        trendArrowField = "top3TrendArrow";
        break;
      case "top4-8":
        trendValueField = "top4_8TrendValue";
        trendArrowField = "top4_8TrendArrow";
        break;
      case "top9-14":
        trendValueField = "top9_14TrendValue";
        trendArrowField = "top9_14TrendArrow";
        break;
      case "below14":
        trendValueField = "below14TrendValue";
        trendArrowField = "below14TrendArrow";
        break;
      default:
        // e.g. top40 fallback
        trendValueField = "top40TrendValue";
        trendArrowField = "top40TrendArrow";
    }
    
    // Filter out the current company
    const others = allCompanies.filter(c => c.companyId !== currentCompanyId);
    
    // Convert each to an object with numeric trendValue
    // and the arrow (▲ or ▼).
    const parsed = others.map(c => {
      const arrow = c[trendArrowField] || "";
      const rawVal = c[trendValueField] || "0";
      // In case it's stored as a string with extra text:
      const numVal = parseFloat(rawVal) || 0;
      return {
        companyId:   c.companyId,
        displayName: c.companyName || c.companyId,
        trendValue:  numVal,
        trendArrow:  arrow
      };
    });
    
    // 1) Gainers => arrow === "▲"
    const gainers = parsed.filter(item => item.trendArrow.includes("▲"));
    // Sort descending by trendValue
    gainers.sort((a,b) => Math.abs(b.trendValue) - Math.abs(a.trendValue));
    // Take top 3
    const top3Gainers = gainers.slice(0,3);
  
    // 2) Losers => arrow === "▼"
    const losers = parsed.filter(item => item.trendArrow.includes("▼"));
    // Sort ascending by trendValue (lowest first => biggest negative)
    losers.sort((a, b) => Math.abs(b.trendValue) - Math.abs(a.trendValue));
    // Take top 3
    const top3Losers = losers.slice(0,3);
    
    // Build sub-HTML
    function groupHtml(list, color) {
      return list.map(item => {
        const valStr = item.trendValue.toFixed(1);
        // e.g. "RivalName: ▲ 3.2%"
        return `<div style="color:${color};">
                  ${item.displayName}: ${item.trendArrow} ${valStr}%
                </div>`;
      }).join("");
    }
  
    // Combine
    return `
      <div style="margin-top:6px; font-size:13px;">
        <div style="font-weight:bold;">Gainers:</div>
        ${groupHtml(top3Gainers, "green")}
        <div style="margin-top:4px; font-weight:bold;">Losers:</div>
        ${groupHtml(top3Losers, "red")}
      </div>
    `;
  }
