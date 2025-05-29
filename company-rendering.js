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
