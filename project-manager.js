/*******************************************************
  3) The “renderProjects()” function
     (Builds the leftColumn content: project list, sub-menus, etc.)
*******************************************************/
function synchronizeProjectData() {
  // Check current dataPrefix and ensure projectData matches
  const isDemo = window.dataPrefix?.startsWith("demo_") || false;
  
  console.log("[synchronizeProjectData] Current state:", {
    dataPrefix: window.dataPrefix,
    uiAccount: document.getElementById("selectedAccountText")?.textContent,
    projectDataSource: window.projectData === window.demoProjectData ? "DEMO" : 
                     (window.projectData === window.realProjectData ? "Account 1" : "UNKNOWN")
  });
  
  // Force projectData to match dataPrefix
  if (isDemo && window.demoProjectData) {
    window.projectData = window.demoProjectData;
    console.log("[synchronizeProjectData] Set projectData to demoProjectData");
  } else if (!isDemo && window.realProjectData) {
    window.projectData = window.realProjectData;
    console.log("[synchronizeProjectData] Set projectData to realProjectData");
  }
}

function renderProjects() {
  console.log("[renderProjects] START - projectData:", window.projectData);
  console.log("[renderProjects] START - dataPrefix:", window.dataPrefix);
  synchronizeProjectData();
  console.log("[renderProjects] After sync - projectData source:", 
              window.projectData === window.demoProjectData ? "DEMO" : 
              (window.projectData === window.realProjectData ? "Account 1" : "UNKNOWN"));

  console.group("[renderProjects DEBUG]");
  console.log("dataPrefix:", window.dataPrefix);
  console.log("projectData:", window.projectData);
  console.log("projectData source:", window.projectData === window.demoProjectData ? "DEMO" : 
               (window.projectData === window.realProjectData ? "Account 1" : "UNKNOWN"));
  console.log("demoProjectData length:", window.demoProjectData?.length);
  console.log("realProjectData length:", window.realProjectData?.length);
  console.groupEnd();

  const isDemo = window.dataPrefix?.startsWith("demo_") || false;
  if (isDemo && window.demoProjectData?.length > 0) {
    window.projectData = window.demoProjectData;
    console.log("[renderProjects] Using demoProjectData based on current prefix");
  } else if (!isDemo && window.realProjectData?.length > 0) {
    window.projectData = window.realProjectData;
    console.log("[renderProjects] Using realProjectData based on current prefix");
  }

  // 0) If there's no projectData array or it's empty, show a placeholder on both sides
  if (!Array.isArray(window.projectData) || window.projectData.length === 0) {
    console.warn("[renderProjects] ❌ No projectData available to render.");

    // --- Clear LEFT column dynamic parts ---
    const leftCol = document.getElementById("leftColumn");
    const oldProjectList = document.getElementById("project-list_container");
    const oldNav = document.getElementById("navigation-container");
    if (oldProjectList) {
      console.log("[renderProjects] Removing existing #project-list_container");
      oldProjectList.remove();
    }
    if (oldNav) {
      console.log("[renderProjects] Removing existing #navigation-container");
      oldNav.remove();
    }

    // Create a placeholder DIV for the left column
    const placeholderLeft = document.createElement("div");
    placeholderLeft.id = "project-list_container";
    placeholderLeft.className = "no-data-message";
    placeholderLeft.textContent = "⚠️ No projects available for this account.";
    leftCol.appendChild(placeholderLeft);
    console.log("[renderProjects] 🛑 Left column placeholder inserted.");

    // --- Clear RIGHT column dynamic parts ---
    const rightSide = document.getElementById("rightSide");
    // Hide all existing content
    Array.from(rightSide.children).forEach(child => (child.style.display = "none"));

    // Insert a single placeholder on the right side
    let placeholderRight = document.getElementById("account-no-data");
    if (!placeholderRight) {
      placeholderRight = document.createElement("div");
      placeholderRight.id = "account-no-data";
      placeholderRight.className = "no-data-message";
      placeholderRight.style.padding = "20px";
      placeholderRight.style.textAlign = "center";
      placeholderRight.textContent = "⚠️ This account has no data yet.";
      rightSide.appendChild(placeholderRight);
    }
    console.log("[renderProjects] 🛑 Right column placeholder inserted on the right side.");

    return; // no more work
  }

  // If we get here, projectData is not empty
  console.log("[renderProjects] ✅ projectData found, rendering normally.");

  // Clean up any existing “no data” placeholders
  const noDataLeft = document.querySelector("#leftColumn .no-data-message");
  if (noDataLeft) {
    console.log("[renderProjects] Removing leftover .no-data-message in leftColumn");
    noDataLeft.remove();
  }
  const noDataRight = document.getElementById("account-no-data");
  if (noDataRight) {
    console.log("[renderProjects] Removing leftover #account-no-data in rightSide");
    noDataRight.remove();

    // Restore rightSide children (un-hide them)
    const rightSide = document.getElementById("rightSide");
    Array.from(rightSide.children).forEach(child => (child.style.display = ""));
  }

  // 1) Defensive check & basic filtering (only keep objects with a numeric project_number)
  console.log("[renderProjects] Checking first project object:", window.projectData[0]);
  window.projectData = window.projectData.filter(p => typeof p.project_number === "number");
  console.log("[renderProjects] After filtering, projectData is now:", window.projectData);
  if (window.projectData.length === 0) {
    console.warn("[renderProjects] ❌ No valid projectData rows remain. Exiting.");
    return;
  }

  // 2) Remove old containers from the left column
  const leftCol = document.getElementById("leftColumn");
  const projectList = document.getElementById("project-list_container");
  const navContainer = document.getElementById("navigation-container");

  console.log("[renderProjects] Checking for existing containers to remove:", {
    projectListFound: !!projectList,
    navContainerFound: !!navContainer
  });

  // -- If #accountDropdown is inside #navigation-container, we may want to re-append it to <body> first:
  const dd = document.getElementById("accountDropdown");
  if (dd && navContainer && navContainer.contains(dd)) {
    console.log("[renderProjects] #accountDropdown found inside #navigation-container; re-appending to <body> first.");
    document.body.appendChild(dd);
  }

  if (projectList) {
    console.log("[renderProjects] Removing #project-list_container");
    projectList.remove();
  }
  if (navContainer) {
    console.log("[renderProjects] Removing #navigation-container");
    navContainer.remove();
  }

  // 3) Create a new project-list_container
  const projectListContainer = document.createElement("div");
  projectListContainer.id = "project-list_container";
  leftCol.appendChild(projectListContainer);
  console.log("[renderProjects] ➕ Created and appended new #project-list_container.");

  // 4) Insert a header
  const projectsHeader = document.createElement("div");
  projectsHeader.className = "projects-header";
  projectsHeader.textContent = "Projects";
  projectListContainer.appendChild(projectsHeader);
  console.log("[renderProjects] ➕ Appended .projects-header inside #project-list_container.");

  // 5) Build a new navigation-container for settings, etc.
  const navigationContainer = document.createElement("div");
  navigationContainer.id = "navigation-container";
  navigationContainer.innerHTML = `
    <div class="menu-item" id="openSettingsPopup">
      <img
        src="https://static.wixstatic.com/media/0eae2a_d18b425180f6464f879f2a58fe295df6~mv2.png"
        alt="Settings Icon"
        class="settings-icon"
      />
      <span>Settings</span>
    </div>
  `;
  leftCol.appendChild(navigationContainer);

  const openSettingsBtn = document.getElementById("openSettingsPopup");
  const overlay = document.getElementById("settingsOverlay");
  const closeBtn = document.getElementById("closeSettingsPopup");
  
  if (openSettingsBtn && overlay && closeBtn) {
    openSettingsBtn.addEventListener("click", () => {
      // ✅ Prevent opening the popup in DEMO mode
      const currentVal = (document.getElementById("selectedAccountText")?.textContent || "").trim();
      if (currentVal === "DEMO") {
        console.warn("[SettingsPopup] ❌ Skipping overlay open — DEMO mode.");
        return;
      }
  
      console.log("[renderProjects] Opening settings overlay.");
      overlay.style.display = "flex";
      
      // Update database usage bars when opening settings
      if (typeof updateDatabaseUsageBars === "function") {
        updateDatabaseUsageBars();
      }
    });
  
    closeBtn.addEventListener("click", () => {
      console.log("[renderProjects] Closing settings overlay.");
      overlay.style.display = "none";
    });
  } else {
    console.warn("[renderProjects] ❌ Could not wire up Settings popup (elements missing?).");
  }  
  console.log("[renderProjects] ➕ Appended new #navigation-container with settings link.");

  // 6) Sort the projects by project_number
  console.log("[renderProjects] Sorting projectData by project_number ascending.");
  window.projectData.sort((a, b) => a.project_number - b.project_number);

  // 7) Render each project + sub-menu
  window.projectData.forEach((project, idx) => {
    console.log(`[renderProjects] 🏗️ Building project item [${idx}] =>`, project);

    // Fallback if project.project is missing
    if (!project.project) {
      console.warn(`[renderProjects] Project #${project.project_number} has no 'project' name. Using "(untitled)".`);
      project.project = "(untitled)";
    }
    if (!project.country) {
      console.warn(`[renderProjects] Project #${project.project_number} has no 'country'. Using "us".`);
      project.country = "us";
    }

    const menuItem = document.createElement("div");
    menuItem.className = "project-menu-item";
    menuItem.setAttribute("project-number", project.project_number);

    // -- project-info container
    const projectInfo = document.createElement("div");
    projectInfo.className = "project-info";

    const numberSpan = document.createElement("span");
    numberSpan.className = "project-number";
    numberSpan.textContent = project.project_number;
    projectInfo.appendChild(numberSpan);

    const titleSpan = document.createElement("span");
    titleSpan.className = "project-title";
    titleSpan.textContent = project.project; // might be "(untitled)" now
    projectInfo.appendChild(titleSpan);

    const countrySpan = document.createElement("span");
    countrySpan.className = "project-country";
    const cc = (project.country || "us").toLowerCase();
    const flagImg = document.createElement("img");
    flagImg.src = `https://flagcdn.com/${cc}.svg`;
    flagImg.alt = project.country;
    countrySpan.appendChild(flagImg);
    const countryText = document.createElement("span");
    countryText.textContent = project.country;
    countrySpan.appendChild(countryText);

    projectInfo.appendChild(countrySpan);
    menuItem.appendChild(projectInfo);
    console.log(`[renderProjects]   ➕ Appended projectInfo for project #${project.project_number}`);

    // -- sub-menu container
    const subMenu = document.createElement("div");
    subMenu.className = "sub-menu";
    const activeSearches = project.searches || [];
    console.log(`[renderProjects]   Active searches for project #${project.project_number}:`, activeSearches);

    activeSearches.forEach((s, i) => {
      // Fallback if s.search is missing
      if (!s.search) {
        console.warn(`[renderProjects] search item #${i} in project #${project.project_number} has no 'search' field. Using "(untitled)".`);
        s.search = "(untitled)";
      }
      // createSearchCard is presumably defined globally
      const card = createSearchCard(s, project); 
      subMenu.appendChild(card);
    });

    projectListContainer.appendChild(menuItem);
    projectListContainer.appendChild(subMenu);
    console.log("[renderProjects]   ➕ Inserted project-menu-item & sub-menu into #project-list_container.");

    // -- click event on the project "menuItem"
    menuItem.addEventListener("click", (e) => {
      // CHANGE: Reset _ignoreProjectMenuClick at the beginning of handling
      const wasIgnoring = window._ignoreProjectMenuClick;
      window._ignoreProjectMenuClick = false;
      
      // If the previous call flagged to ignore, exit without doing anything else
      if (wasIgnoring) {
        console.log("[renderProjects] ⚠️ Ignoring project-menu-item click (search-card in progress)");
        return;
      }

      // If the user literally clicked on .search-card inside here, do nothing
      if (e.target.closest(".search-card")) {
        console.log("[renderProjects] 🛑 project-menu-item click ignored (inner .search-card was clicked)");
        return; 
      }

      console.log(`[renderProjects] 🖱️ Project clicked => #${project.project_number}`);
      document.querySelectorAll(".search-card.selected").forEach(card => {
        card.classList.remove("selected");
      });

      // 1) Mark which project_number is active
      if (!window.filterState) window.filterState = {};
      window.filterState.activeProjectNumber = project.project_number;
      console.log("[renderProjects]   Updated filterState.activeProjectNumber =>", project.project_number);

      // 2) Highlight the current item
      document.querySelectorAll(".project-menu-item.selected").forEach(item => {
        item.classList.remove("selected");
      });
      menuItem.classList.add("selected");

      // 3) Expand sub-menu for this project; collapse for all others
      document.querySelectorAll(".sub-menu").forEach(other => {
        if (other !== subMenu) {
          other.classList.remove("expanded");
        }
      });
      subMenu.classList.add("expanded");

      // 4) Switch UI to the Project Page
      const homePageEl = document.getElementById("homePage");
      const mainPageEl = document.getElementById("main");
      const projectPageEl = document.getElementById("projectPage");

      setTimeout(() => {
        homePageEl.style.display = "none";
        mainPageEl.style.display = "none";
        projectPageEl.style.display = "block";

      document.getElementById("homeButton").classList.remove("selected");
      document.getElementById("mainButton").classList.remove("selected");
      document.getElementById("projectButton").classList.add("selected");

// 5) Always reload data when switching projects to ensure correct data
const newPrefix = `acc1_pr${project.project_number}_`;

// Check if we're actually switching to a different project
const currentProjectNumber = window.filterState.activeProjectNumber;
const isActuallyDifferentProject = currentProjectNumber !== project.project_number;

if (window.dataPrefix !== newPrefix || isActuallyDifferentProject) {
  console.log(`[renderProjects] [🔁 Project switch] from ${window.dataPrefix} (project ${currentProjectNumber}) => ${newPrefix} (project ${project.project_number})`);
  switchAccountAndReload(newPrefix, project.project_number)
    .then(() => {
      console.log("[POPULATEPROJECTPAGE] Calling populateProjectPage after data reload at:", new Date().toISOString());
      populateProjectPage();
    })
    .catch(err => {
      console.error("[renderProjects] ❌ switchAccountAndReload error:", err);
    });
} else {
  // Only reuse cached data if we're truly on the same project
  console.log("[renderProjects] [✅ Same project] Verifying cached data for project:", project.project_number);
  
  // Double-check that our cached data is actually for this project
  const cachedProjectNumbers = new Set(window.companyStatsData?.map(r => r.project_number) || []);
  const hasCorrectData = cachedProjectNumbers.size === 1 && cachedProjectNumbers.has(project.project_number);
  
  if (hasCorrectData) {
    console.log("[renderProjects] [✅ Cache valid] Reusing cached data for project:", project.project_number);
    populateProjectPage();
  } else {
    console.warn("[renderProjects] [⚠️ Cache invalid] Cached data doesn't match project:", project.project_number);
    console.log("[renderProjects] [🔄 Forcing reload] Loading correct data...");
    switchAccountAndReload(newPrefix, project.project_number)
      .then(() => {
        console.log("[POPULATEPROJECTPAGE] Calling populateProjectPage after forced reload at:", new Date().toISOString());
        populateProjectPage();
      })
      .catch(err => {
        console.error("[renderProjects] ❌ switchAccountAndReload error:", err);
      });
  }
}
    }, 10);
    }); // end menuItem.addEventListener
  });

  // 8) Add a toggle button to collapse the entire left column
  const toggleButton = document.createElement("div");
  toggleButton.id = "toggleCollapseButton";
  toggleButton.textContent = "←→";
  leftCol.appendChild(toggleButton);
  console.log("[renderProjects] ➕ Appended #toggleCollapseButton to leftColumn.");

  let isCollapsed = false;
  toggleButton.addEventListener("click", () => {
    console.log("[renderProjects] 🖱️ toggleCollapseButton clicked; current isCollapsed:", isCollapsed);
    leftCol.classList.toggle("collapsed", !isCollapsed);
    isCollapsed = !isCollapsed;
  });

  // 9) Wrap up
  console.log("[renderProjects] ✅ Finished rendering projects successfully.");

  // 🌟 Optionally auto-highlight a default project (e.g. project_number=1)
  const defaultProjectNum = 1;
  const defaultProjectItem = document.querySelector(`.project-menu-item[project-number="${defaultProjectNum}"]`);
  if (defaultProjectItem) {
    defaultProjectItem.classList.add("selected");
    console.log("[renderProjects] 🌟 Highlighted default project-menu-item => project_number =", defaultProjectNum);
  } else {
    console.warn("[renderProjects] ⚠️ No matching project-menu-item found for default project_number =", defaultProjectNum);
  }
}

/*******************************************************
  4) Helper: Create a single “search-card” item
*******************************************************/
function createSearchCard(search, parentProject) {
  // 1) Create a wrapper for both the card and the hidden submenu
  const wrapper = document.createElement("div");
  wrapper.classList.add("search-card-wrapper");

  // 2) Build the main .search-card
  const card = document.createElement("div");
  card.className = "search-card";

  card.setAttribute("project-number", parentProject.project_number);
  card.setAttribute("dsearch-term", search.search);
  card.setAttribute("engine", search.engine);
  card.setAttribute("device", JSON.stringify(search.device || []));
  card.setAttribute("location", JSON.stringify(search.location || []));

  // (A) The search term text
  const term = document.createElement("span");
  term.className = "search-term";
  term.textContent = search.search || "(untitled)";
  card.appendChild(term);

  // (C) Location count
  const locCount = Array.isArray(search.location)
    ? search.location.length
    : (search.location ? 1 : 0);

  const locContainer = document.createElement("div");
  locContainer.style.display = "flex";
  locContainer.style.alignItems = "center";

  const locIcon = document.createElement("img");
  locIcon.className = "location-icon";
  locIcon.src = "https://static.wixstatic.com/media/0eae2a_4c3ed280229040dfbadcf0039936bc2d~mv2.png";
  locIcon.alt = "Locations";
  locContainer.appendChild(locIcon);

  const countSpan = document.createElement("span");
  countSpan.className = "loc-count";
  countSpan.textContent = locCount;
  locContainer.appendChild(document.createTextNode(" "));
  locContainer.appendChild(countSpan);

  card.appendChild(locContainer);

  // 3) Build the hidden submenu containing each location name
  const locationsSubmenu = document.createElement("div");
  locationsSubmenu.className = "locations-submenu";
  //locationsSubmenu.style.display = "none"; // hidden by default

  // For each location, create a clickable row
  let allLocations = [];
  if (Array.isArray(search.location)) {
    allLocations = search.location;
  } else if (search.location) {
    allLocations = [search.location];
  }

  allLocations.forEach(loc => {
    const locItem = document.createElement("div");
    locItem.className = "location-item";
    locItem.textContent = loc;
  
    // ➜ Make each location row clickable
    locItem.addEventListener("click", (e) => {
      console.log("[DEBUG] Location clicked:", loc);
      e.stopPropagation();   // prevent card's click event from firing
      // Show searchTerm and enable company selector
  document.getElementById("searchTerm").style.display = "";
  document.getElementById("companySelector").classList.remove("disabled");
  
      // 1) Clear existing “selected” location rows in this submenu
      locationsSubmenu.querySelectorAll(".location-item.selected")
                      .forEach(item => item.classList.remove("selected"));
  
      // 2) Make this loc row “selected”
      locItem.classList.add("selected");
  
      // 3) Also ensure the card is marked “selected”
      clearSelectedSearchCards(); 
      card.classList.add("selected");
  
      // 5) Update global filter state
      window.filterState.location = loc;
      console.log("[DEBUG] filterState.location set to:", window.filterState.location);
      console.log("[DEBUG] Full filterState:", JSON.stringify(window.filterState));
      
      // 6) Update the right column UI
      document.getElementById("locationHeader").dataset.locations = JSON.stringify([loc]);
      document.getElementById("locationText").textContent = formatLocation(loc);
      console.log("[DEBUG] locationText updated to:", document.getElementById("locationText").textContent);
      
      // 7) Trigger main page logic
      setTimeout(() => {
        console.log("[DEBUG] About to click mainButton, filterState.location is:", window.filterState.location);
        document.getElementById("mainButton").click();
      }, 0);
  
      // ✅ Do NOT call renderData() or populateHomePage() again — mainButton does it
    });
  
    locationsSubmenu.appendChild(locItem);
  });  

  // 4) Append card + submenu into wrapper
  wrapper.appendChild(card);
  wrapper.appendChild(locationsSubmenu);

  // 5) Card click => highlight + toggle the location submenu
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    console.log("[DEBUG] Search card clicked, toggling submenu");
    // Show searchTerm and enable company selector
  document.getElementById("searchTerm").style.display = "";
  document.getElementById("companySelector").classList.remove("disabled");

    // a) Clear other selections and highlight this card
    clearSelectedSearchCards();
    card.classList.add("selected");

    // b) Debug logging
    console.group("[🔍 Search Card Click]");
    console.log("project-number:", card.getAttribute("project-number"));
    console.log("dsearch-term:",  card.getAttribute("dsearch-term"));
    console.log("engine:",        card.getAttribute("engine"));
    console.log("device:",        JSON.parse(card.getAttribute("device") || "[]"));
    console.log("location:",      JSON.parse(card.getAttribute("location") || "[]"));
    console.groupEnd();

    // Check if dataPrefix exists - if not, set a default
    if (!window.dataPrefix) {
      console.warn("[⚠️ Missing dataPrefix] Defaulting to acc1_pr1_");
      window.dataPrefix = "acc1_pr1_";
    }
    
    // Get current prefix as source of truth
    const oldPrefix = window.dataPrefix;
    
    // c) Derive new prefix using current dataPrefix as source of truth
    const isDemo = oldPrefix.startsWith("demo_");
    const accountNormalized = isDemo ? "demo_acc1" : "acc1";
    const newPrefix = accountNormalized + "_pr" + parentProject.project_number + "_";
    
    console.log(`[🔍 Prefix Generation] Using ${accountNormalized} from dataPrefix=${oldPrefix}`);
    
    // Log any inconsistency between UI and dataPrefix (but don't change behavior based on UI)
    const accountDisplayText = document.getElementById("selectedAccountText").textContent.trim();
    const expectedDisplayText = isDemo ? "DEMO" : "Account 1";
    if (accountDisplayText !== expectedDisplayText) {
      console.warn(`[⚠️ UI/Data Mismatch] UI shows "${accountDisplayText}" but dataPrefix="${oldPrefix}" indicates "${expectedDisplayText}"`);
    }

    locationsSubmenu.classList.toggle("show");
    console.log("[DEBUG] Submenu classes:", locationsSubmenu.className);
    console.log("[DEBUG] Submenu display:", window.getComputedStyle(locationsSubmenu).display);

    if (newPrefix === oldPrefix) {
      // same project => just reapply filters
      updateFilterContainer(search);
      if (typeof renderData === "function") {
        console.log("[TRACE] renderData() called from if (newPrefix === oldPrefix)");
        console.trace();
        renderData();
      } else {
        console.warn("renderData() not yet defined — skipping this trace");
      }      

        setTimeout(() => {
        populateHomePage(true);
        
        // Show Home Page explicitly
        document.getElementById("homePage").style.display = "block";
        document.getElementById("main").style.display = "none";
        document.getElementById("projectPage").style.display = "none";
        document.getElementById("productMapPage").style.display = "none";
        hideFiltersOnProjectAndHome();
        
        // Highlight correct nav button
        document.getElementById("homeButton").classList.add("selected");
        document.getElementById("mainButton").classList.remove("selected");
        document.getElementById("projectButton").classList.remove("selected");
        
        // Set active project number globally
        const projNum = parseInt(card.getAttribute("project-number"), 10);
        window.filterState.activeProjectNumber = projNum;
        
        // Only set the flag right before we need it (immediately before selection)
        window._ignoreProjectMenuClick = true;
        
        // Highlight only the correct .project-menu-item
        document.querySelectorAll(".project-menu-item.selected").forEach(el => {
          el.classList.remove("selected");
        });
        
        const matchingItem = document.querySelector(`.project-menu-item[project-number="${projNum}"]`);
        if (matchingItem) {
          matchingItem.classList.add("selected");
          // Reset the flag after selection is done
          window._ignoreProjectMenuClick = false;
        }
      }, 10);
    } else {
      // new project => reload from IDB or server
      console.log(`[🔁 Switching project] ${oldPrefix} ➜ ${newPrefix}`);

    
      switchAccountAndReload(newPrefix, parentProject.project_number)
      .then(() => {
        updateFilterContainer(search);
        if (typeof renderData === "function") {
          console.log("[TRACE] renderData() called from switchAccountAndReload");
          console.trace();
          renderData();
        } else {
          console.warn("renderData() not yet defined — skipping this trace");
        }
        
                // CHANGE: Move UI updates into setTimeout
        setTimeout(() => {
          populateHomePage(true);
        
          // ✅ Force switch to homePage UI (show it, hide others)
          document.getElementById("homePage").style.display = "block";
          document.getElementById("main").style.display = "none";
          document.getElementById("projectPage").style.display = "none";
          document.getElementById("productMapPage").style.display = "none";
          hideFiltersOnProjectAndHome();
          document.getElementById("homeButton").classList.add("selected");
          document.getElementById("mainButton").classList.remove("selected");
          document.getElementById("projectButton").classList.remove("selected");
          
          // Set active project number globally
          const projNum = parseInt(card.getAttribute("project-number"), 10);
          window.filterState.activeProjectNumber = projNum;
          
          // Only set the flag right before we need it
          window._ignoreProjectMenuClick = true;
          
          // Highlight only the correct .project-menu-item
          document.querySelectorAll(".project-menu-item.selected").forEach(el => {
            el.classList.remove("selected");
          });
          
          const matchingItem = document.querySelector(`.project-menu-item[project-number="${projNum}"]`);
          if (matchingItem) {
            matchingItem.classList.add("selected");
            // Reset the flag after selection is done
            window._ignoreProjectMenuClick = false;
          }
        }, 10);
      })    
        .catch(err => {
          console.error("❌ Failed to switch project:", err);
          window._ignoreProjectMenuClick = false;
        });
    }
  });

  // 6) Return the wrapper (NOT just the card)
  return wrapper;
}

/*******************************************************
  5) Clear any previously selected search cards
*******************************************************/
function clearSelectedSearchCards() {
  document.querySelectorAll(".search-card.selected")
    .forEach(c => c.classList.remove("selected"));
}

/*******************************************************
  6) Update the rightColumn filter container 
     (searchTerm, engine, device, location)
*******************************************************/
function updateFilterContainer(search) {
  // A) The “searchTerm” box
  const searchTermValue = document.getElementById("searchTermValue");
  if (searchTermValue) {
    searchTermValue.innerHTML = "";
    if (search.search) {
      const termSpan = document.createElement("span");
      termSpan.textContent = search.search;
      searchTermValue.appendChild(termSpan);
    }
  }

  // ✅ Also update filterState.searchTerm
  window.filterState.searchTerm = (search.search || "").trim();

  // B) The “engineFilter” block
  const engineRow = document.getElementById("engineOptionsRow");
  if (engineRow) {
    engineRow.innerHTML = "";
    if (search.engine) {
      const arr = Array.isArray(search.engine) ? search.engine : [search.engine];
      arr.forEach(val => {
        const lowerVal = String(val).toLowerCase();
        let displayText = val;
        if (
          lowerVal === "search&shopping" ||
          lowerVal === "shopping" ||
          lowerVal === "shopping_only"
        ) {
          displayText = "Shopping";
        } else if (lowerVal === "search") {
          displayText = "Search";
        }
        const opt = document.createElement("div");
        opt.className = "apple-option apple-option-gradient";

        const engineImg = document.createElement("img");
        engineImg.className = "engine-icon";
        engineImg.style.width = "auto";
        engineImg.style.height = "16px";
        engineImg.style.marginRight = "4px";

        if (lowerVal === "shopping" || lowerVal === "search&shopping") {
          engineImg.src = "https://static.wixstatic.com/media/0eae2a_fc8b23188cdc4c58a94b0631985e7451~mv2.png";
        } else {
          engineImg.src = "https://static.wixstatic.com/media/0eae2a_03824709e7424398a0f83a0e8c0822d8~mv2.png";
        }
        opt.appendChild(engineImg);
        opt.appendChild(document.createTextNode(displayText));
        opt.onclick = () => console.log("Engine clicked:", val);

        engineRow.appendChild(opt);
      });
    }
  }

  // ✅ Update filterState.engine
  window.filterState.engine = Array.isArray(search.engine)
    ? search.engine[0]
    : search.engine;

  // C) The “deviceFilter” block
  const deviceRow = document.getElementById("deviceOptionsRow");
  if (deviceRow) {
    deviceRow.innerHTML = "";
    if (search.device) {
      const arr = Array.isArray(search.device) ? search.device : [search.device];
      window.filterState.device = arr;  // ✅ Save all selected devices
      arr.forEach(val => {
        const opt = document.createElement("div");
        opt.className = "apple-option apple-option-gradient";

        const deviceImg = document.createElement("img");
        deviceImg.className = "device-icon";
        deviceImg.style.width = "auto";
        deviceImg.style.height = "16px";
        deviceImg.style.marginRight = "4px";

        if (String(val).toLowerCase() === "mobile") {
          deviceImg.src = "https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png";
        } else {
          deviceImg.src = "https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png";
        }
        opt.appendChild(deviceImg);
        opt.appendChild(document.createTextNode(val));
        opt.onclick = () => console.log("Device clicked:", val);

        deviceRow.appendChild(opt);
      });
    }
  }

  // D) The “locationFilter” block
  const locationHeader = document.getElementById("locationHeader");
  const locationCount = document.getElementById("locationCount");
  const locationText = document.getElementById("locationText");
  if (locationHeader && locationCount && locationText) {
    if (search.location) {
      const locArr = Array.isArray(search.location)
        ? search.location
        : [search.location];
    
      locationHeader.dataset.locations = JSON.stringify(locArr);
      locationCount.textContent = locArr.length;
    
      // 🔧 Do NOT prefill label with locArr[0]
      locationText.textContent = "(select a location)";
    
      // 🔧 Do NOT pre-set the filter state location
      window.filterState.location = "";
      window.filterState.locationsArray = locArr;
    } else {
      locationHeader.dataset.locations = JSON.stringify([]);
      locationCount.textContent = 0;
      locationText.textContent = "";
      window.filterState.location = "";
      window.filterState.locationsArray = [];
    }    
  }
}

/*******************************************************
  7) Dynamically build each <li> for the location dropdown
*******************************************************/
function createLocationListItem(loc) {
  const li = document.createElement("li");
  li.className = "md-list-item";

  const leftDiv = document.createElement("div");
  leftDiv.className = "item-col-left";
  leftDiv.textContent = formatLocation(loc);

  // example: a center or right element
  const centerDiv = document.createElement("div");
  centerDiv.className = "item-col-center";
  const badge = document.createElement("div");
  badge.className = "pop-badge";
  badge.textContent = "N/A";
  centerDiv.appendChild(badge);

  li.appendChild(leftDiv);
  li.appendChild(centerDiv);

  return li;
}
