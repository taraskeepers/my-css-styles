  // Function to handle the complete IDB refresh process
  window.refreshIDBData = async function() {
    try {
      console.log("[🔄 IDB Refresh] Starting complete database refresh...");
      
      // Show loading overlay
      const loader = document.getElementById("overlayLoader");
      if (loader) {
        loader.style.display = "flex";
        loader.style.opacity = "1";
      }
  
      // Step 1: Delete the existing database
      console.log("[🔄 IDB Refresh] Step 1: Deleting existing database...");
      await window.embedIDB.deleteDatabase();
      
      // Step 2: Clear only table data, preserve project structure temporarily
      const savedProjectData = window.projectData;
      const savedDemoProjectData = window.demoProjectData;
      const savedRealProjectData = window.realProjectData;
      
      window.allRows = [];
      window.companyStatsData = [];
      window.marketTrendsData = [];
      window.googleSheetsData = null;
      // Don't clear project data yet - we'll restore it after
      
      console.log("[🔄 IDB Refresh] Step 2: Cleared cached data");

      // Restore project data immediately
window.projectData = savedProjectData;
window.demoProjectData = savedDemoProjectData;
window.realProjectData = savedRealProjectData;
  
      // Step 3: Request fresh data from server
      console.log("[🔄 IDB Refresh] Step 3: Requesting fresh data from server...");
      
      // Set a flag to indicate we're doing a full refresh
      window._isRefreshingIDB = true;
      window._refreshRequestCount = 0;
      window._refreshExpectedCount = 2; // Expecting both demo and real account data
      
      // Request both demo and real account data
      window.parent.postMessage({
        command: "requestServerData", 
        projectNumber: 1,
        forceRefresh: true,
        requestBoth: true  // Signal to parent to send both demo and real data
      }, "*");

      // Also fetch fresh Google Sheets data if available
      const currentPrefix = window.dataPrefix ? window.dataPrefix.split('_pr')[0] + '_' : 'acc1_';
      window.googleSheetsManager.fetchAndStoreAll(currentPrefix)
        .then(({ productData, locationData }) => {
          window.googleSheetsData = {
            productPerformance: productData,
            locationRevenue: locationData
          };
          console.log("[IDB Refresh] Google Sheets data refreshed");
        })
        .catch(err => {
          console.log("[IDB Refresh] Google Sheets not available (user hasn't uploaded)");
          window.googleSheetsData = {
            productPerformance: [],
            locationRevenue: []
          };
        });
  
    } catch (error) {
      console.error("[🔄 IDB Refresh] Error during refresh:", error);
      
      // Hide loader on error
      const loader = document.getElementById("overlayLoader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => { loader.style.display = "none"; }, 500);
      }
      
      alert("Error refreshing database. Please try again or refresh the page.");
    }
  };

  // =====================================
  // 2. TABS FUNCTIONALITY 
  // =====================================
  (function initTabsSystem() {
    console.log("[INIT] Setting up tabs system");
    
    const tabs = document.querySelectorAll("#tabsContainer .my-tab");
  
    // Get references to your containers
    const productsContainer  = document.getElementById("productsContainer");
    const companiesContainer = document.getElementById("companiesContainer");
    const explorerContainer  = document.getElementById("explorerContainer");
    const serpContainer      = document.getElementById("serpContainer");
    const pricesContainer    = document.getElementById("pricesContainer");
  
    function showTab(tabName) {
      // 1) Hide all main content containers
      productsContainer.style.display  = "none";
      companiesContainer.style.display = "none";
      explorerContainer.style.display  = "none";
      serpContainer.style.display      = "none";
      pricesContainer.style.display    = "none";
    
      // 2) Hide layout toggle containers by default
      document.getElementById("layoutToggleContainer").style.display     = "none";
      document.getElementById("layoutCompToggleContainer").style.display = "none";
    
      // 3) Show/Hide top bar elements depending on tab
      if (tabName === "companies") {
        document.getElementById("filterSliders").style.display    = "none";
        document.getElementById("companySelector").style.display  = "none";
      } else if (tabName === "products") {
        document.getElementById("filterSliders").style.display    = "flex";
        document.getElementById("companySelector").style.display  = "block";
      } else if (tabName === "serp") {
        // For SERP Analysis, hide only the filter sliders but show the companySelector
        document.getElementById("filterSliders").style.display   = "none";
        document.getElementById("companySelector").style.display = "block";
      } else {
        // For explorer and prices, hide both elements
        document.getElementById("filterSliders").style.display   = "none";
        document.getElementById("companySelector").style.display = "none";
      }
    
      // 4) Show the chosen tab + the correct layout toggle (if any)
      if (tabName === "products") {
        productsContainer.style.display = "block";
        document.getElementById("layoutToggleContainer").style.display = "block";
      } else if (tabName === "companies") {
        companiesContainer.style.display = "block";
        renderCompaniesTab();  // your existing function to load company data
        document.getElementById("layoutCompToggleContainer").style.display = "block";
      } else if (tabName === "explorer") {
        explorerContainer.style.display = "block";
      } else if (tabName === "serp") {
        serpContainer.style.display = "block";
        renderSerpMarketShareBigChart(window.companyStatsData);
        if (window.companyStatsData) {
          renderSerpMarketShareBigChart(window.companyStatsData);
        } else {
          // or request the data: requestProjectData("company_serp_stats");
        }
      } else if (tabName === "prices") {
        pricesContainer.style.display = "block";
      }
    
      // 5) Reset/close the Settings panel
      settingsDropdown.classList.remove("show");
    
      // 6) Update the Settings panel's HTML + attach toggles
      if (tabName === "products") {
        // A) PRODUCTS TAB => set the products settings HTML
        settingsDropdown.innerHTML = window.productsSettingsHTML;
    
        // Then re-attach any event listeners for the product toggles
        const toggleTrendBox      = document.getElementById("toggleTrendBox");
        const togglePosBadge      = document.getElementById("togglePosBadge");
        const toggleVisBadge      = document.getElementById("toggleVisBadge");
        const toggleCompanyStats  = document.getElementById("toggleCompanyStats");
        
        // Example: if you have a function "updateAdCards()" that re-checks these toggles
        if (toggleTrendBox) {
          toggleTrendBox.addEventListener("change", updateAdCards);
        }
        if (togglePosBadge) {
          togglePosBadge.addEventListener("change", updateAdCards);
        }
        if (toggleVisBadge) {
          toggleVisBadge.addEventListener("change", updateAdCards);
        }
        if (toggleCompanyStats) {
          toggleCompanyStats.addEventListener("change", function() {
            updateToggle("toggleCompanyStats", this.checked);
            const statsEl = document.getElementById("companyStats");
            if (!statsEl) return;
            statsEl.style.display = this.checked ? "flex" : "none";
          });
        }
        applyLocalToggleStates();
      } else if (tabName === "companies") {
        // B) COMPANIES TAB => set the companies settings HTML
        settingsDropdown.innerHTML = window.companiesSettingsHTML;
    
        // ----- Company Settings Toggles (affecting .company-details) -----
        const toggleProdTrends   = document.getElementById("toggleProdTrends");
        const toggleProdChart    = document.getElementById("toggleProdChart");
        const toggleRanking      = document.getElementById("toggleRanking");
        const togglePricingTrends= document.getElementById("togglePricingTrends");
        const toggleExtensions   = document.getElementById("toggleExtensions");
        
        if (toggleProdTrends) {
          toggleProdTrends.addEventListener("change", function() {
            updateToggle("toggleProdTrends", this.checked);
            document.querySelectorAll(".company-details .trend-table-row").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
        if (toggleProdChart) {
          toggleProdChart.addEventListener("change", function() {
            updateToggle("toggleProdChart", this.checked);
            document.querySelectorAll(
              ".company-details .product-trend-row canvas[id^='mini-chart-']:not([id^='mini-chart-rank-'])"
            ).forEach(el => {
              el.style.display = this.checked ? "block" : "none";
            });
          });
        }
        if (toggleRanking) {
          toggleRanking.addEventListener("change", function() {
            updateToggle("toggleRanking", this.checked);
            document.querySelectorAll(".company-details .product-trend-row .rank-history").forEach(el => {
              el.style.display = this.checked ? "flex" : "none";
            });
          });
        }          
        if (togglePricingTrends) {
          togglePricingTrends.addEventListener("change", function() {
            updateToggle("togglePricingTrends", this.checked);
            document.querySelectorAll(".company-details .pricing-row").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
        if (toggleExtensions) {
          toggleExtensions.addEventListener("change", function() {
            updateToggle("toggleExtensions", this.checked);
            document.querySelectorAll(".company-details .extensions-content").forEach(el => {
              el.style.display = this.checked ? "" : "none";
            });
          });
        }
    
        // ----- Segment Settings Toggles (affecting .company-insights .mini-market-chart) -----
        const toggleMarketShare   = document.getElementById("toggleMarketShare");
        const toggleRank          = document.getElementById("toggleRank");
        const toggleAvgProducts   = document.getElementById("toggleAvgProducts");
    
        if (toggleMarketShare) {
          toggleMarketShare.addEventListener("change", function() {
            updateToggle("toggleMarketShare", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Market share");
              }
            });
          });
        }
        if (toggleRank) {
          toggleRank.addEventListener("change", function() {
            updateToggle("toggleRank", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Rank");
              }
            });
          });
        }
        if (toggleAvgProducts) {
          toggleAvgProducts.addEventListener("change", function() {
            updateToggle("toggleAvgProducts", this.checked);
            document.querySelectorAll(".company-insights .mini-market-chart").forEach(container => {
              if (container._chartInstance) {
                container._chartInstance.toggleSeries("Avg Products");
              }
            });
          });
        }
        applyLocalToggleStates();
      } else {
        // C) Other tabs (explorer, serp, prices): no toggles or empty out
        settingsDropdown.innerHTML = "";
      }
    }      
    
    // Attach click handlers on each .my-tab
    tabs.forEach(tab => {
      tab.addEventListener("click", () => {
        tabs.forEach(t => t.classList.remove("selected"));
        tab.classList.add("selected");
        showTab(tab.dataset.tab);
      });
    });
    
    // By default, show the PRODUCTS tab
    showTab("products");
  })();

// =====================================
  // 3. SETTINGS BUTTON
  // =====================================
  (function initSettingsButton() {
    console.log("[INIT] Setting up settings button");
    
    // 1) Basic references for your Settings popup
    const settingsButton  = document.getElementById("openSettingsPopup");
    const overlay         = document.getElementById("settingsOverlay");
    const closeBtn        = document.getElementById("closeSettingsPopup");
  
    // 2) Show/hide the popup
    if (settingsButton && overlay && closeBtn) {
      settingsButton.addEventListener("click", () => {
        // When opening the popup, fill #currentCompanyValue
        const companyValEl = document.getElementById("currentCompanyValue");
        if (companyValEl) {
          // 2A) Try window.myCompany
          let val = (window.myCompany && window.myCompany.trim())
                      ? window.myCompany.trim()
                      : "";
      
          // 2B) If still empty, fallback to #companyText (the label near "Companies:")
          if (!val) {
            const cTextEl = document.getElementById("companyText");
            if (cTextEl && cTextEl.textContent.trim()) {
              val = cTextEl.textContent.trim();
            }
          }
      
          // 2C) Final fallback
          if (!val) val = "(none)";
          companyValEl.textContent = val;
        }
      
        // Finally, show the overlay
        overlay.style.display = "flex";
        
        // Update database usage bars when opening settings
        if (typeof updateDatabaseUsageBars === "function") {
          updateDatabaseUsageBars();
        }
      });
  
      closeBtn.addEventListener("click", () => {
        overlay.style.display = "none";
      });
    } else {
      console.warn("⚠️ Settings popup elements not found");
    }
  
    // 3) The "Change" button => open the existing select-company popup
    const changeBtn = document.getElementById("changeCompanyButton");
    if (changeBtn) {
      changeBtn.addEventListener("click", function() {
        // We assume you have a function openSelectCompanyPopup() that shows the form
        if (typeof openSelectCompanyPopup === "function") {
          openSelectCompanyPopup();
        } else {
          console.warn("⚠️ openSelectCompanyPopup() not defined yet.");
        }
      });
    }

    console.log("refreshIDBData function exists:", typeof window.refreshIDBData);

    // Setup Refresh IDB button
const refreshIDBBtn = document.getElementById("refreshIDBButton");
if (refreshIDBBtn) {
  refreshIDBBtn.addEventListener("click", function() {
    const confirmRefresh = confirm(
      "This will delete all cached data and reload fresh data from the server. " +
      "The process may take a few moments. Continue?"
    );
    
    if (confirmRefresh) {
      // Close the settings overlay
      const overlay = document.getElementById("settingsOverlay");
      if (overlay) {
        overlay.style.display = "none";
      }
      
      // Start the refresh process
      window.refreshIDBData();
    }
  });
  
  // Add hover effect
  refreshIDBBtn.addEventListener("mouseenter", function() {
    this.style.backgroundColor = "#ff5252";
  });
  
  refreshIDBBtn.addEventListener("mouseleave", function() {
    this.style.backgroundColor = "#ff6b6b";
  });
} else {
  console.warn("⚠️ Refresh IDB button not found in DOM");
}
  })();

  // Google Sheets URL popup handlers
const provideFeedBtn = document.getElementById("provideFeedFileBtn");
const urlOverlay = document.getElementById("googleSheetsUrlOverlay");
const urlInput = document.getElementById("googleSheetsUrlInput");
const cancelBtn = document.getElementById("googleSheetsUrlCancel");
const uploadBtn = document.getElementById("googleSheetsUrlUpload");

if (provideFeedBtn && urlOverlay) {
  // Show popup when Provide Feed File is clicked
  provideFeedBtn.addEventListener("click", () => {
    urlOverlay.style.display = "flex";
    urlInput.value = ""; // Clear previous input
    urlInput.focus();
  });
  
  // Hide popup on cancel
  cancelBtn.addEventListener("click", () => {
    urlOverlay.style.display = "none";
  });
  
  // Process URL on upload
  uploadBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    
    if (!url) {
      alert("Please enter a Google Sheets URL");
      return;
    }
    
    if (!url.includes("docs.google.com/spreadsheets")) {
      alert("Please enter a valid Google Sheets URL");
      return;
    }
    
    // Hide the URL popup
    urlOverlay.style.display = "none";
    
    try {
      // Determine current account prefix
const currentPrefix = window.dataPrefix ? window.dataPrefix.split('_pr')[0] + '_' : 'acc1_';
await window.googleSheetsManager.fetchAndStoreFromUrl(url, currentPrefix);
      
      // Optionally close the settings overlay too
      const settingsOverlay = document.getElementById("settingsOverlay");
      if (settingsOverlay) {
        settingsOverlay.style.display = "none";
      }
    } catch (error) {
      alert(`Failed to process Google Sheets: ${error.message}`);
    }
  });
  
  // Allow Enter key to submit
  urlInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      uploadBtn.click();
    }
  });

    function updateToggle(toggleId, newValue) {
    window.localEmbedToggles[toggleId] = newValue;
  
    // 2) Post message to the parent page
    window.parent.postMessage({
      command: "saveUserSettings",
      token: window.embedToken,           // This was set earlier by the parent 
      data: JSON.stringify({ 
        toggleId, 
        isChecked: newValue 
      })
    }, "*");
  }
}

 function applyLocalToggleStates() {
    // 1) Toggle: Show Trend Box (Products tab)
    const toggleTrendBox = document.getElementById("toggleTrendBox");
    if (toggleTrendBox) {
      const val = window.localEmbedToggles["toggleTrendBox"];
      if (typeof val === "boolean") {
        toggleTrendBox.checked = val;
      }
      toggleTrendBox.addEventListener("change", function() {
        updateToggle("toggleTrendBox", this.checked);
        updateAdCards(); 
      });
    }
  
    // 2) Toggle: Show Pos Badge (Products tab)
    const togglePosBadge = document.getElementById("togglePosBadge");
    if (togglePosBadge) {
      const val = window.localEmbedToggles["togglePosBadge"];
      if (typeof val === "boolean") {
        togglePosBadge.checked = val;
      }
      togglePosBadge.addEventListener("change", function() {
        updateToggle("togglePosBadge", this.checked);
        updateAdCards();
      });
    }
  
    // 3) Toggle: Show Vis Badge (Products tab)
    const toggleVisBadge = document.getElementById("toggleVisBadge");
    if (toggleVisBadge) {
      const val = window.localEmbedToggles["toggleVisBadge"];
      if (typeof val === "boolean") {
        toggleVisBadge.checked = val;
      }
      toggleVisBadge.addEventListener("change", function() {
        updateToggle("toggleVisBadge", this.checked);
        updateAdCards();
      });
    }
  
    // 4) Toggle: Company Stats (Products tab)
    const toggleCompanyStats = document.getElementById("toggleCompanyStats");
    if (toggleCompanyStats) {
      if (typeof window.localEmbedToggles["toggleCompanyStats"] === "boolean") {
        toggleCompanyStats.checked = window.localEmbedToggles["toggleCompanyStats"];
      }
      toggleCompanyStats.addEventListener("change", function() {
        updateToggle("toggleCompanyStats", this.checked);
        // Show/hide your stats container:
        const statsEl = document.getElementById("companyStats");
        if (statsEl) {
          statsEl.style.display = this.checked ? "flex" : "none";
        }
      });
    }
  
    // 5) Toggle: Product Trends (Companies tab)
    const toggleProdTrends = document.getElementById("toggleProdTrends");
    if (toggleProdTrends) {
      const val = window.localEmbedToggles["toggleProdTrends"];
      if (typeof val === "boolean") {
        toggleProdTrends.checked = val;
      }
      // Then hide/show .trend-table-row or similar
      document.querySelectorAll(".company-details .trend-table-row").forEach(el => {
        el.style.display = toggleProdTrends.checked ? "" : "none";
      });
    }
  
    // 6) Toggle: Product Chart (Companies tab)
    const toggleProdChart = document.getElementById("toggleProdChart");
    if (toggleProdChart) {
      const val = window.localEmbedToggles["toggleProdChart"];
      if (typeof val === "boolean") {
        toggleProdChart.checked = val;
      }
      // Hide or show the mini-chart canvas in .product-trend-row
      document.querySelectorAll(".company-details .product-trend-row canvas")
        .forEach(el => {
          el.style.display = toggleProdChart.checked ? "block" : "none";
        });
    }
  
    // 7) Toggle: Ranking (Companies tab)
    const toggleRanking = document.getElementById("toggleRanking");
    if (toggleRanking) {
      const val = window.localEmbedToggles["toggleRanking"];
      if (typeof val === "boolean") {
        toggleRanking.checked = val;
      }
      // Hide/show the .rank-history or rank UI
      document.querySelectorAll(".company-details .rank-history").forEach(el => {
        el.style.display = toggleRanking.checked ? "flex" : "none";
      });
    }
  
    // 8) Toggle: Pricing Trends (Companies tab)
    const togglePricingTrends = document.getElementById("togglePricingTrends");
    if (togglePricingTrends) {
      const val = window.localEmbedToggles["togglePricingTrends"];
      if (typeof val === "boolean") {
        togglePricingTrends.checked = val;
      }
      // Show/hide .pricing-row
      document.querySelectorAll(".company-details .pricing-row").forEach(el => {
        el.style.display = togglePricingTrends.checked ? "" : "none";
      });
    }
  
    // 9) Toggle: Extensions (Companies tab)
    const toggleExtensions = document.getElementById("toggleExtensions");
    if (toggleExtensions) {
      const val = window.localEmbedToggles["toggleExtensions"];
      if (typeof val === "boolean") {
        toggleExtensions.checked = val;
      }
      // Show/hide .extensions-content
      document.querySelectorAll(".company-details .extensions-content").forEach(el => {
        el.style.display = toggleExtensions.checked ? "" : "none";
      });
    }
  
    // 10) Toggle: Market Share (Companies tab → insights)
    const toggleMarketShare = document.getElementById("toggleMarketShare");
    if (toggleMarketShare) {
      const val = window.localEmbedToggles["toggleMarketShare"];
      if (typeof val === "boolean") {
        toggleMarketShare.checked = val;
      }
      // Possibly toggle the "Market share" series in an ApexCharts
      // or show/hide an element in .company-insights
    }
  
    // 11) Toggle: Rank (Companies tab → insights)
    const toggleRank = document.getElementById("toggleRank");
    if (toggleRank) {
      const val = window.localEmbedToggles["toggleRank"];
      if (typeof val === "boolean") {
        toggleRank.checked = val;
      }
      // Toggle the "Rank" series in your insights chart
    }
  
    // 12) Toggle: Avg Products (Companies tab → insights)
    const toggleAvgProducts = document.getElementById("toggleAvgProducts");
    if (toggleAvgProducts) {
      const val = window.localEmbedToggles["toggleAvgProducts"];
      if (typeof val === "boolean") {
        toggleAvgProducts.checked = val;
      }
      // Toggle the "Avg Products" series
    }

    // ----------------------------
    // HOME PAGE toggles (7 new)
    // ----------------------------
  
    // 1) Toggle: Map
    const toggleMap = document.getElementById("toggleMap");
    if (toggleMap) {
      const val = window.localEmbedToggles["toggleMap"];
      if (typeof val === "boolean") {
        toggleMap.checked = val;
      }
      toggleMap.addEventListener("change", function() {
        updateToggle("toggleMap", this.checked);
        updateHomeMapMetrics(); // or hide/show #mapInfoWrapper
      });
    }
  
    // 2) Toggle: Desktop Market Share
    const toggleDesktopShare = document.getElementById("toggleDesktopShare");
    if (toggleDesktopShare) {
      const val = window.localEmbedToggles["toggleDesktopShare"];
      if (typeof val === "boolean") {
        toggleDesktopShare.checked = val;
      }
      toggleDesktopShare.addEventListener("change", function() {
        updateToggle("toggleDesktopShare", this.checked);
        updateHomeMapMetrics();
      });
    }
  
    // 3) Toggle: Desktop Avg Rank
    const toggleDesktopRank = document.getElementById("toggleDesktopRank");
    if (toggleDesktopRank) {
      const val = window.localEmbedToggles["toggleDesktopRank"];
      if (typeof val === "boolean") {
        toggleDesktopRank.checked = val;
      }
      toggleDesktopRank.addEventListener("change", function() {
        updateToggle("toggleDesktopRank", this.checked);
        updateHomeMapMetrics();
      });
    }
  
    // 4) Toggle: Mobile Market Share
    const toggleMobileShare = document.getElementById("toggleMobileShare");
    if (toggleMobileShare) {
      const val = window.localEmbedToggles["toggleMobileShare"];
      if (typeof val === "boolean") {
        toggleMobileShare.checked = val;
      }
      toggleMobileShare.addEventListener("change", function() {
        updateToggle("toggleMobileShare", this.checked);
        updateHomeMapMetrics();
      });
    }
  
    // 5) Toggle: Mobile Avg Rank
    const toggleMobileRank = document.getElementById("toggleMobileRank");
    if (toggleMobileRank) {
      const val = window.localEmbedToggles["toggleMobileRank"];
      if (typeof val === "boolean") {
        toggleMobileRank.checked = val;
      }
      toggleMobileRank.addEventListener("change", function() {
        updateToggle("toggleMobileRank", this.checked);
        updateHomeMapMetrics();
      });
    }
  
    // 6) Toggle: Rank History
    const toggleRankHistory = document.getElementById("toggleRankHistory");
    if (toggleRankHistory) {
      const val = window.localEmbedToggles["toggleRankHistory"];
      if (typeof val === "boolean") {
        toggleRankHistory.checked = val;
      }
      toggleRankHistory.addEventListener("change", function() {
        updateToggle("toggleRankHistory", this.checked);
        updateHistoryRows(); // a function that hides/shows .history-rank-row
      });
    }
  
    // 7) Toggle: Market Share History
    const toggleMarketShareHistory = document.getElementById("toggleMarketShareHistory");
    if (toggleMarketShareHistory) {
      const val = window.localEmbedToggles["toggleMarketShareHistory"];
      if (typeof val === "boolean") {
        toggleMarketShareHistory.checked = val;
      }
      toggleMarketShareHistory.addEventListener("change", function() {
        updateToggle("toggleMarketShareHistory", this.checked);
        updateHistoryRows(); // a function that hides/shows .history-share-row
      });
    }
  
    updateAdCards();
  }  

  function openMapSettingsPopup(clickedBtn) {
    const popup = document.getElementById("mapSettingsPopup");
    if (!popup || !clickedBtn) return;
  
    const rect = clickedBtn.getBoundingClientRect();
  
    // ⬆️ Position ABOVE and to the LEFT
    const popupWidth = 300;
    const popupHeight = 240; // match real height with padding
  
    const top  = rect.top - popupHeight - 10;
    const left = rect.right - popupWidth;
  
    popup.style.display = "block";
    popup.style.opacity = "0";
    popup.style.transform = "scale(0.9)";
    popup.style.top  = `${top}px`;
    popup.style.left = `${left}px`;
  
    setTimeout(() => {
      popup.style.opacity = "1";
      popup.style.transform = "scale(1)";
    }, 10);
  
    const toggles = [
      "toggleMap", "toggleDesktopShare", "toggleDesktopRank",
      "toggleMobileShare", "toggleMobileRank"
    ];
  
    toggles.forEach(id => {
      const checkbox = document.getElementById("mapToggle_" + id);
      if (!checkbox) return;
      checkbox.checked = !!window.localEmbedToggles?.[id];
      checkbox.onchange = () => {
        updateToggle(id, checkbox.checked);
        updateHomeMapMetrics();
      };
    });
  }
  
  function closeMapSettingsPopup() {
  const popup = document.getElementById("mapSettingsPopup");
  if (!popup) return;

  popup.style.opacity = "0";
  popup.style.transform = "scale(0.9)";
  setTimeout(() => {
    popup.style.display = "none";
    // Reset all small button styles
    document.querySelectorAll("#mapSmallButton").forEach(b => b.classList.remove("selected"));
  }, 200);
}
  
  // ✅ Attach click to *both* buttons (homePage + projectPage)
  document.querySelectorAll("#mapSmallButton").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();

    const popup = document.getElementById("mapSettingsPopup");

    // If popup is visible => close it and reset button style
    if (popup.style.display === "block") {
      closeMapSettingsPopup();
      btn.classList.remove("selected");
    } else {
      // Open popup and apply clicked style
      openMapSettingsPopup(btn);
      btn.classList.add("selected");
    }
  });
});
