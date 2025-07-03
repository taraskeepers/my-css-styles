/**
 * Check if all required datasets exist in IDB for a given project
 * @param {number} projectNumber - The project number to check
 * @returns {Promise<boolean>} - True if all datasets exist, false otherwise
 */
async function checkProjectDatasetsInIDB(projectNumber) {
  try {
    // Determine the prefix based on current account type
    const accountStr = document.getElementById("selectedAccountText")?.textContent?.trim()?.toLowerCase() || "";
    const isDemo = accountStr.includes("demo");
    const prefix = isDemo ? `demo_acc1_pr${projectNumber}_` : `acc1_pr${projectNumber}_`;
    
    console.log(`[checkProjectDatasetsInIDB] Checking datasets for prefix: ${prefix}`);
    
    // Check all three required tables
    const [processed, serpStats, marketTrends] = await Promise.all([
      window.embedIDB.getData(prefix + "processed"),
      window.embedIDB.getData(prefix + "company_serp_stats"),
      window.embedIDB.getData(prefix + "market_trends")
    ]);
    
    // Check if all tables have data
    const hasProcessed = processed?.data?.length > 0;
    const hasSerpStats = serpStats?.data?.length > 0;
    const hasMarketTrends = marketTrends?.data?.length > 0;
    
    console.log(`[checkProjectDatasetsInIDB] Results for ${prefix}:`, {
      hasProcessed,
      hasSerpStats,
      hasMarketTrends
    });
    
    return hasProcessed && hasSerpStats && hasMarketTrends;
  } catch (error) {
    console.error("[checkProjectDatasetsInIDB] Error checking datasets:", error);
    return false;
  }
}

/**
 * Show custom popup near the clicked element
 */
function showCustomDatasetPopup(event) {
  // Remove any existing popup
  const existingPopup = document.querySelector('.dataset-popup');
  if (existingPopup) {
    existingPopup.remove();
  }
  
  // Create new popup
  const popup = document.createElement('div');
  popup.className = 'dataset-popup';
  popup.innerHTML = `
    <h4>Data Collection in Progress</h4>
    <p>We are collecting the requested data. The data will be available within the next 24 hours.</p>
  `;
  
  // Position the popup
  document.body.appendChild(popup);
  
  const rect = event.currentTarget.getBoundingClientRect();
  const popupRect = popup.getBoundingClientRect();
  
  // Position below the clicked element
  popup.style.left = rect.left + (rect.width / 2) - (popupRect.width / 2) + 'px';
  popup.style.top = rect.bottom + 10 + 'px';
  
  // Remove popup after 3 seconds or on click anywhere
  setTimeout(() => popup.remove(), 3000);
  
  const removeOnClick = (e) => {
    if (!popup.contains(e.target)) {
      popup.remove();
      document.removeEventListener('click', removeOnClick);
    }
  };
  
  setTimeout(() => {
    document.addEventListener('click', removeOnClick);
  }, 100);
}

/**
 * Update project-info elements styling based on data availability
 */
async function updateProjectInfoStyling() {
  console.log("[updateProjectInfoStyling] Checking all projects for data availability");
  
  const projectMenuItems = document.querySelectorAll('.project-menu-item');
  
  for (const menuItem of projectMenuItems) {
    const projectNumber = parseInt(menuItem.getAttribute('project-number'));
    if (!projectNumber) continue;
    
    const hasData = await checkProjectDatasetsInIDB(projectNumber);
    
    if (!hasData) {
      menuItem.classList.add('no-data');
    } else {
      menuItem.classList.remove('no-data');
    }
  }
}

/*******************************************************
  2) Format Helper for Locations
*******************************************************/
function formatLocation(loc) {
  // Example: "New York, NY, US" => strip last element => "New York, NY"
  let parts = loc.split(',');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.map(part => part.trim()).join(', ');
}


/*******************************************************
  3) The “renderProjects()” function
     (Builds the leftColumn content: project list, sub-menus, etc.)
*******************************************************/
function renderProjects() {
  console.log("[renderProjects] START - projectData:", window.projectData);

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
menuItem.addEventListener("click", async (e) => {
  console.log(`[🆕 NEW CODE] Click handler started for project #${project.project_number} - checking data FIRST`);
  
  // VERY FIRST: Check if datasets exist before ANY other logic
  const datasetsAvailable = await checkProjectDatasetsInIDB(project.project_number);
  if (!datasetsAvailable) {
    console.log(`[renderProjects] ⚠️ Datasets not available for project #${project.project_number}`);
    e.preventDefault();
    e.stopPropagation();
    showCustomDatasetPopup(e);
    return; // Exit immediately
  }
console.log(`[🆕 NEW CODE] Data check passed - continuing with normal flow`);
  // Now continue with the rest of the logic...
  // If we previously set window._ignoreProjectMenuClick due to sub-click:
  if (window._ignoreProjectMenuClick) {
    console.log("[renderProjects] ⚠️ Ignoring project-menu-item click (search-card in progress)");
    window._ignoreProjectMenuClick = false;
    return;
  }

  // If the user literally clicked on .search-card inside here, do nothing
  if (e.target.closest(".search-card")) {
    console.log("[renderProjects] 🛑 project-menu-item click ignored (inner .search-card was clicked)");
    return; 
  }

  console.log(`[renderProjects] 🖱️ Project clicked => #${project.project_number}`);
  
  // Clear other selections
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
  document.querySelectorAll(".sub-menu.expanded").forEach(other => {
    if (other !== subMenu) other.classList.remove("expanded");
  });
  subMenu.classList.add("expanded");

  // 4) Switch UI to the Project Page
  const homePageEl = document.getElementById("homePage");
  const mainPageEl = document.getElementById("main");
  const projectPageEl = document.getElementById("projectPage");

  homePageEl.style.display = "none";
  mainPageEl.style.display = "none";
  projectPageEl.style.display = "block";

  document.getElementById("homeButton").classList.remove("selected");
  document.getElementById("mainButton").classList.remove("selected");
  document.getElementById("projectButton").classList.add("selected");

  // 5) Possibly switch dataPrefix if needed, then call populateProjectPage
  const newPrefix = `acc1_pr${project.project_number}_`;
  if (window.dataPrefix !== newPrefix) {
    console.log(`[renderProjects] [🔁 Project switch] from ${window.dataPrefix} => ${newPrefix}`);
    switchAccountAndReload(newPrefix, project.project_number)
      .then(() => {
        // Reset flags to allow re-population with new project data
        window._projectPageInitialized = false;
        window._projectPageInitializing = false;
        populateProjectPage();
      })
      .catch(err => {
        console.error("[renderProjects] ❌ switchAccountAndReload error:", err);
      });
  } else {
    console.log("[renderProjects] [✅ No prefix change] Reusing cached data for:", window.dataPrefix);
    // Reset flags to allow re-population when switching between projects
    window._projectPageInitialized = false;
    window._projectPageInitializing = false;
    populateProjectPage();
  }
}); // end menuItem.addEventListener

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
  locationsSubmenu.style.display = "none"; // hidden by default

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
  
locItem.addEventListener("click", async (e) => {
  e.stopPropagation();   // prevent card's click event from firing
  
  // FIRST: Check if datasets exist in IDB before ANY other logic
  const datasetsAvailable = await checkProjectDatasetsInIDB(parentProject.project_number);
  if (!datasetsAvailable) {
    console.log(`[location-item] ⚠️ Datasets not available for project #${parentProject.project_number}`);
    showCustomDatasetPopup(e);
    return; // Exit early, don't select this location
  }
  
  // 1) Hide all other location submenus
  document.querySelectorAll(".locations-submenu").forEach(sub => {
    if (sub !== locationsSubmenu) sub.style.display = "none";
  });

  // 2) Clear other selections and select this location item
  document.querySelectorAll(".location-item.selected").forEach(el => {
    el.classList.remove("selected");
  });
  locItem.classList.add("selected");

  // 3) Also ensure the card is marked "selected"
  clearSelectedSearchCards(); 
  card.classList.add("selected");

  // 4) If location hasn't changed, skip
  const prevLocation = window.filterState.location;
  if (prevLocation === loc) {
    console.log("[🛑] Same location clicked again — skipping");
    return;
  }

  // 5) Apply search filters
  updateFilterContainer(search);

  // 6) Derive and set the project prefix
  const accountStr = document
    .getElementById("selectedAccountText")
    .textContent
    .trim()
    .toLowerCase();

  let accountNormalized = "acc1";
  if (accountStr.includes("demo")) {
    accountNormalized = "demo_acc1";
  } else if (accountStr.includes("account 1")) {
    accountNormalized = "acc1";
  }

  const newPrefix = accountNormalized + "_pr" + parentProject.project_number + "_";
  window.dataPrefix = newPrefix;

  // 7) Update global filter state
  window.filterState.location = loc;

  // 8) Update the right column UI
  document.getElementById("locationHeader").dataset.locations = JSON.stringify([loc]);
  document.getElementById("locationText").textContent = formatLocation(loc);

  // 9) Trigger main page logic
  document.getElementById("mainButton").click();

  // ✅ Do NOT call renderData() or populateHomePage() again — mainButton does it
});
  
    locationsSubmenu.appendChild(locItem);
  });  

  // 4) Append card + submenu into wrapper
  wrapper.appendChild(card);
  wrapper.appendChild(locationsSubmenu);

// 5) Card click => highlight + toggle the location submenu
card.addEventListener("click", async (e) => {
  e.stopPropagation();
  
  // *** NEW: Check if datasets exist in IDB before proceeding ***
  const datasetsAvailable = await checkProjectDatasetsInIDB(parentProject.project_number);
  if (!datasetsAvailable) {
    console.log(`[createSearchCard] ⚠️ Datasets not available for project #${parentProject.project_number}`);
    showCustomDatasetPopup(e); 
    return; // Exit early, don't select this card
  }

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

  // c) Derive prefix from account + project
  const accountStr = document
    .getElementById("selectedAccountText")
    .textContent
    .trim()
    .toLowerCase();

  let accountNormalized = "acc1";
  if (accountStr.includes("demo")) {
    accountNormalized = "demo_acc1";
  } else if (accountStr.includes("account 1")) {
    accountNormalized = "acc1";
  }

  const newPrefix = accountNormalized + "_pr" + parentProject.project_number + "_";
  const oldPrefix = window.dataPrefix || "";

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
    populateHomePage(true);

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
        
        populateHomePage(true);
    
        // ✅ Force switch to homePage UI (show it, hide others)
        document.getElementById("homePage").style.display = "block";
        document.getElementById("main").style.display = "none";
        document.getElementById("projectPage").style.display = "none";
        hideFiltersOnProjectAndHome();
        document.getElementById("homeButton").classList.add("selected");
        document.getElementById("mainButton").classList.remove("selected");
        document.getElementById("projectButton").classList.remove("selected");
      })    
      .catch(err => {
        console.error("❌ Failed to switch project:", err);
      });
  }

  // d) Show/hide the location submenu under the card
  if (locationsSubmenu.style.display === "block") {
    locationsSubmenu.style.display = "none";
  } else {
    locationsSubmenu.style.display = "block";
  }
  
  // ✅ Show Home Page explicitly (instead of using homeButton.click())
  document.getElementById("homePage").style.display = "block";
  document.getElementById("main").style.display = "none";
  document.getElementById("projectPage").style.display = "none";
  hideFiltersOnProjectAndHome();

  // ✅ Highlight correct nav button
  document.getElementById("homeButton").classList.add("selected");
  document.getElementById("mainButton").classList.remove("selected");
  document.getElementById("projectButton").classList.remove("selected");

  // ✅ Set activeProjectNumber globally
  const projNum = parseInt(card.getAttribute("project-number"), 10);
  window.filterState.activeProjectNumber = projNum;

  // ✅ Highlight only the correct .project-menu-item
  // ✅ Prevent triggering the projectPage when setting .selected
  window._ignoreProjectMenuClick = true;

  document.querySelectorAll(".project-menu-item.selected").forEach(el => {
    el.classList.remove("selected");
  });
});

const matchingItem = document.querySelector(`.project-menu-item .project-number`);
if (matchingItem && parseInt(matchingItem.textContent.trim(), 10) === projNum) {
  const container = matchingItem.closest(".project-menu-item");
  if (container) container.classList.add("selected");
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
      locationText.textContent = locArr.length > 0
        ? formatLocation(locArr[0])
        : "(no location)";
      window.filterState.location = locArr[0];           // ✅ pick the first for filtering
      window.filterState.locationsArray = locArr;        // ✅ keep the whole array if needed elsewhere
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

function getAllCompaniesFromStats() {
  if (!window.companyStatsData || !Array.isArray(window.companyStatsData)) {
    return [];
  }
  // Extract unique company names from companyStatsData
  const names = new Set();
  window.companyStatsData.forEach(row => {
    if (row.source) {
      names.add(row.source.trim());
    }
  });
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

/*******************************************************
  8) Listen for "loadData" message from parent => fill #leftColumn
*******************************************************/
window.addEventListener("message", (event) => {
  let data;
  try {
    data = (typeof event.data === "string") ? JSON.parse(event.data) : event.data;
  } catch(e) {
    console.error("JSON parse error for event.data:", e);
    return;
  }

  if (data.command === "loadData") {
    // 1) Store separately
    window.realProjectData = data.userProjects || [];
    window.demoProjectData = data.demoProjects || [];

    // 2) Choose which one to show based on current selector text
    const currentVal = (document.getElementById("selectedAccountText")?.textContent || "").trim();

    // 3) If unknown selector value, default to DEMO
    if (currentVal === "Account 1") {
         if (window.realProjectData && window.realProjectData.length > 0) {
             // normal case: real data is present
             window.projectData = window.realProjectData;
           } else {
             console.log("[loadData] No real data found. Fallback to DEMO data.");
             window.projectData = window.demoProjectData;
           }
    } else {
      window.projectData = window.demoProjectData;
    }

    console.log("✅ Received loadData. Using projectData:", window.projectData);
    renderProjects();
  }
});

// 1) Grab the loader
const loader = document.getElementById("overlayLoader");

// 2) We do NOT set loader.style.display="none" here, 
//    because we want it showing by default on initial load.

// 3) Listen for message => if it’s the “deliverTables,” hide the loader
window.addEventListener("message", (e) => {
  let msg = e.data;
  try {
    msg = JSON.parse(e.data);
  } catch {}

  if (msg.command === "deliverTables") {
    console.log("[Embed] Received project data:", msg);
    const { projectNumber, processed, serpStats, marketTrends } = msg;

    // 1) Feed your global variables:
    onReceivedRows(processed);
    window.companyStatsData = (serpStats || []).map(row => ({
      ...row,
      project_number: projectNumber
    }));    
    window.marketTrendsData = marketTrends;

    // 3) **NEW**: transform “processed” into “projectData” & render left column
    if (!Array.isArray(window.projectData) || window.projectData.length === 0) {
  console.warn("[deliverTables] projectData missing. Running convertRowsToProjects() as fallback.");
  window.projectData = convertRowsToProjects(processed);
  renderProjects();
} else {
  console.log("[deliverTables] Skipping projectData overwrite — existing UI structure preserved.");
}

    // ✅ Wait for full readiness before clicking projectButton
(function waitForReadyThenClickProject() {
  let attempts = 0;
  const maxAttempts = 20;

  function isReady() {
    return (
      Array.isArray(window.projectData) &&
      window.projectData.length > 0 &&
      Array.isArray(window.companyStatsData) &&
      window.companyStatsData.length > 0 &&
      window._embedFullyInitialized === true
    );
  }

  function tryClick() {
    if (isReady()) {
      console.log("✅ All conditions met. Triggering projectButton.click()");
      document.getElementById("projectButton").click();
    } else if (attempts < maxAttempts) {
      attempts++;
      setTimeout(tryClick, 200);
    } else {
      console.warn("❌ Timeout: projectButton.click() skipped after waiting.");
    }
  }

  tryClick();
})();

    // Hide any overlay loader, etc...
    const workingOverlay = document.getElementById("workingOverlay");
    if (workingOverlay) {
      workingOverlay.style.display = "none";
    }
  }
});

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

    function setupPLAInteractions() {
      const adDetails = document.querySelectorAll(".ad-details");
      adDetails.forEach(adEl => {
        adEl.addEventListener("click", (e) => {
          //e.preventDefault();
          e.stopPropagation();
          const clickedIndex = Number(adEl.getAttribute("data-pla-index"));
          const rowData = window.globalRows[clickedIndex];

          // If a different panel is open, close it first
          //if (currentlyOpenPanel) {
          //  closeDetailsPanel();
          //}

          // Check if list mode is active
          const resultsEl = document.getElementById("filteredResults");
          let insertAfterEl;
          if (resultsEl.classList.contains("list-mode")) {
            // In list mode, insert panel immediately after the clicked product
            insertAfterEl = adEl;
          } else {
            // Grid mode: compute the end element of the current row
            const rowEndIndex = getRowEndIndex(clickedIndex);
            insertAfterEl = document.querySelector('.ad-details[data-pla-index="' + rowEndIndex + '"]');
          }

          openDetailsPanel(adEl, insertAfterEl, rowData);
        });
      });
    }   

    function getRowEndIndex(plaIndex) {
      // Example: each row is 8 wide
      const rowIndex = Math.floor(plaIndex / 8);
      return (rowIndex * 8) + 7;
    }

    Handlebars.registerHelper('last7Days', function(historicalData) {
        // Return an array of 7 objects in descending order, e.g.:
        // [ {date: '2025-03-18', rank: 2}, {date: '2025-03-17', rank: 1}, ... ]
        // The logic can be adapted from your existing “getRowEndIndex” or “applyAllFilters” code.
      
        if (!historicalData || !Array.isArray(historicalData)) return [];
      
        // Sort by date descending
        const sorted = historicalData.slice().sort((a,b)=> 
          new Date(b.date.value) - new Date(a.date.value)
        );
      
        // Take the first 7 entries
        const last7 = sorted.slice(0, 7).map(dayObj => {
          return {
            rank: dayObj.rank || 40,      // fallback
            date: dayObj.date.value || ''
          };
        });
        return last7;
      });      

    Handlebars.registerHelper('colorRank', function(rawRank) {
        const r = parseFloat(rawRank);
        if (isNaN(r) || r <= 0) {
          // if rank is missing or zero => no special class
          return "";
        }
        if (r === 1) return "range-green";
        if (r <= 3)  return "range-yellow";
        if (r <= 5)  return "range-orange";
        return "range-red";
      });      

      Handlebars.registerHelper('lookupRank', function(historicalData, dateString) {
        if (!historicalData || !historicalData.length) return '';
        const entry = historicalData.find(item => item.date.value === dateString);
        if (!entry) return '';
        // Choose the proper rank field based on the current serpSegments filter.
        let rankField = 'rank'; // default field
        if (window.filterState && window.filterState.serpSegments) {
          switch(window.filterState.serpSegments) {
            case 'top3':
              rankField = 'top3_rank';
              break;
            case 'top4-8':
              rankField = 'top4_8_rank';
              break;
            case 'top9-14':
              rankField = 'top9_14_rank';
              break;
            case 'below14':
              rankField = 'below14_rank';
              break;
            case 'top8':
              rankField = 'top8_rank';
              break;
            case 'below8':
              rankField = 'below8_rank';
              break;
            default:
              rankField = 'rank';
          }
        }
        return (entry[rankField] != null) ? entry[rankField] : '';
      });      
      
      Handlebars.registerHelper('lookupDayMarketShare', function(historicalData, dateString) {
        if (!historicalData || !historicalData.length) return '0';
        const entry = historicalData.find(item => item.date.value === dateString);
        if (!entry) return '0';

        // Choose the proper market_share column based on the selected SERP segment.
        let shareField = 'market_share'; // default field
        if (window.filterState && window.filterState.serpSegments) {
          switch(window.filterState.serpSegments) {
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
        if (entry[shareField] == null) return '0';
        const val = parseFloat(entry[shareField]) * 100;
        return val.toFixed(1);
      });                 

    Handlebars.registerHelper("marketShareColor", function(trendArrow) {
        if (trendArrow === "▲") {
          return "green";
        } else if (trendArrow === "▼") {
          return "red";
        } else {
          return "inherit"; // or a default color such as "#333"
        }
      });      

    Handlebars.registerHelper('barColorForArrow', function(arrow) {
        if (arrow === '▲') return '007aff';
        if (arrow === '▼') return 'red';
        return '#007aff'; // fallback
      });      

    Handlebars.registerHelper('formatNumber', function(value, decimals) {
        if (!value) return '0.00';
        return parseFloat(value).toFixed(decimals);
      });      

    Handlebars.registerHelper('startsWith', function(value, prefix) {
      if (typeof value !== 'string') return false;
      return value.indexOf(prefix) === 0;
    });

    Handlebars.registerHelper('stripArrow', function(value) {
      if (typeof value === 'string' && value.includes("NEW")) {
        return value.replace("⬆", "").trim();
      }
      return value;
    });

    // Color the numeric cells based on value
    Handlebars.registerHelper("colorRange", function(value) {
      if (!value) return "";
      let num = parseFloat(value);
      if (isNaN(num)) return "";
      
      if (num <= 3)       return "range-green";
      else if (num <= 8)  return "range-yellow";
      else if (num <=14)  return "range-orange";
      else                return "range-red";
    });

    // Color the trend text in the 1d/7d/30d columns
    Handlebars.registerHelper("trendColorClassText", function(value) {
      if (typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("⬆")) return "trend-up-text";
        if (trimmed.startsWith("⬇")) return "trend-down-text";
      }
      return "trend-neutral-text";
    });

    Handlebars.registerHelper('lookupHistoricalData', function(historicalData, dateString) {
      if (!historicalData || !historicalData.length) return '';
      // Look for an entry with date.value equal to dateString
      const entry = historicalData.find(item => item.date.value === dateString);
      if (!entry || entry.avg_position == null) return '';
      let val = parseFloat(entry.avg_position);
      if (isNaN(val)) return '';
      return val.toFixed(1);
    });

    Handlebars.registerHelper('lookupVisibility', function(historicalData, dateString) {
        if (!historicalData || !historicalData.length) return '';
        // Find the record for the given date
        const entry = historicalData.find(item => item.date.value === dateString);
        if (!entry || entry.visibility == null) return '';
        // Convert visibility to a percentage. (Adjust the multiplier if your data is already in percent.)
        let vis = parseFloat(entry.visibility);
        if (isNaN(vis)) return '';
        vis = vis * 100;
        return '(' + vis.toFixed(0) + '%)';
      });
      
      Handlebars.registerHelper('lookupVisibilityValue', function(historicalData, dateString) {
        if (!historicalData || !historicalData.length) return '';
        // Find the record for the given date
        const entry = historicalData.find(item => item.date.value === dateString);
        if (!entry || entry.visibility == null) return '';
        let vis = parseFloat(entry.visibility);
        if (isNaN(vis)) return '';
        // Multiply by 100 to convert to percentage (adjust if your data is different)
        vis = vis * 100;
        return vis.toFixed(0);
      });
      
      Handlebars.registerHelper('formatTrend', function(value) {
        return value === 'N/A' ? '' : value;
      });


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
  
  function computeMarketShareData(fullData, groupSmallCompanies = true) {
    // 1) Filter the top-level records by Q, engine, device, location from filterState
    const fs = window.filterState;
    const filteredRecords = fullData.filter(r =>
      r.q?.toLowerCase() === fs.searchTerm.toLowerCase() &&
      r.engine?.toLowerCase() === fs.engine.toLowerCase() &&
      r.device?.toLowerCase() === fs.device.toLowerCase() &&
      r.location_requested?.toLowerCase() === fs.location.toLowerCase()
    );
  
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
  
    // 7) If groupSmallCompanies => keep top 5, the rest is “Other”
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
      return {
        companies: finalCompanies,
        marketShares: finalShares,
        totalMarketShare: parseFloat(fullSum.toFixed(2))
      };
    } else {
      // Return all companies without grouping
      const companies = result.map(item => item.company);
      const marketShares = result.map(item => item.marketShare);
      const total = result.reduce((sum, item) => sum + item.marketShare, 0);
      return {
        companies,
        marketShares,
        totalMarketShare: parseFloat(total.toFixed(2))
      };
    }
  }
      
      // Helper to close all dropdowns in the filter container
function closeAllDropdowns() {
  const dropdowns = document.querySelectorAll("#searchTermDropdown, #engineDropdown, #locationDropdown, #companyDropdown");
  dropdowns.forEach(dd => {
    dd.style.display = "none";
  });
}

// Existing handler for the rank-button (shows ranking view)
document.addEventListener("click", function(e) {
    const btn = e.target.closest(".rank-button");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
  
    // Find the parent company card.
    const companyCard = btn.closest(".company-details");
    if (!companyCard) return;
    
    // Look for an existing insights panel right after the company card.
    let insightsContainer = companyCard.nextElementSibling;
    
    if (!insightsContainer || !insightsContainer.classList.contains("company-insights")) {
      insightsContainer = document.createElement("div");
      insightsContainer.classList.add("company-insights");
      insightsContainer.style.width = "0px";
      insightsContainer.style.opacity = "0";
      
      // Create only the ranking view container.
      const rankingDiv = document.createElement("div");
      rankingDiv.className = "company-insights-ranking";
      rankingDiv.style.display = "block";
      rankingDiv.innerHTML = "<p>Default Ranking Content</p>";
      
      insightsContainer.appendChild(rankingDiv);
      
      // Insert it immediately after the company card.
      companyCard.insertAdjacentElement("afterend", insightsContainer);
      
      // Animate it open.
      requestAnimationFrame(() => {
        insightsContainer.style.width = "1200px"; // adjust as needed
        insightsContainer.style.opacity = "1";
      });
    } else {
      // If it already exists, ensure only one ranking view is present.
      // Remove any duplicate ranking containers.
      const rankingDivs = insightsContainer.querySelectorAll(".company-insights-ranking");
      if (rankingDivs.length > 1) {
        rankingDivs.forEach((div, idx) => {
          if (idx > 0) div.remove();
        });
      }
      // Check if a ranking container exists; if not, create one.
      let rankingDiv = insightsContainer.querySelector(".company-insights-ranking");
      if (!rankingDiv) {
        rankingDiv = document.createElement("div");
        rankingDiv.className = "company-insights-ranking";
        rankingDiv.style.display = "block";
        rankingDiv.innerHTML = "<p>Default Ranking Content</p>";
        insightsContainer.appendChild(rankingDiv);
      }
      
      // If there's a table container, hide it.
      const tableDiv = insightsContainer.querySelector(".insights-table-container");
      if (tableDiv) tableDiv.style.display = "none";
      
      // Ensure the ranking view is visible.
      rankingDiv.style.display = "block";
    }
  });  

// Attach a document-wide click listener to close dropdowns when clicking outside the filterContainer.
document.addEventListener("click", function(e) {
  // If the click target is not inside the filterContainer, close all dropdowns.
  if (!e.target.closest("#filterContainer")) {
    closeAllDropdowns();
  }
});

    // Visible item count for lazy loading
    let visibleCount = 100;

    function onLoadMore() {
        // First, re-run filtering on cachedRows without re-rendering,
        // so you can know the total number of matching items.
        if (!cachedRows || !Array.isArray(cachedRows)) return;
        let filtered = cachedRows.slice();
      
        // (Apply the same filtering logic for range, qFilter, engine, etc.
        //  For brevity, assume you have a function called `applyAllFilters(rows)`
        //  that returns the filtered array.)
        filtered = applyAllFilters(filtered);
      
        if (visibleCount < filtered.length) {
          visibleCount += 20;
          if (typeof renderData === "function") {
            console.log("[TRACE] renderData() called from if (visibleCount");
            console.trace();
            renderData();
          } else {
            console.warn("renderData() not yet defined — skipping this trace");
          }
          
        }
        // Otherwise, do nothing (all items are already shown)
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

    function updateColumnFilterTags() {
        // For each column filter button, see if there's an active filter
        const allBtns = document.querySelectorAll(".apple-filter-button");
        allBtns.forEach(btn => {
          const col = btn.getAttribute("data-column");
          const filterContainer = btn.parentElement.querySelector(".filter-tag-container");
          if (!filterContainer) return;
      
          // Clear any existing tags
          filterContainer.innerHTML = "";
      
          // If we have a filter text for this col
          if (window.columnFilters && window.columnFilters[col]) {
            const filterText = window.columnFilters[col].trim();
            if (filterText) {
              // Build the "tag" HTML with text + 'x'
              const tag = document.createElement("div");
              tag.className = "filter-tag";
      
              const spanText = document.createElement("span");
              spanText.className = "tag-text";
              spanText.textContent = filterText; // e.g. "Apple"
      
              const spanClose = document.createElement("span");
              spanClose.className = "tag-close";
              spanClose.textContent = "×";
              spanClose.addEventListener("click", () => {
                clearFilterForColumn(col);
              });
      
              tag.appendChild(spanText);
              tag.appendChild(spanClose);
              filterContainer.appendChild(tag);
            }
          }
        });
      }
      
      function clearFilterForColumn(col) {
        if (!window.columnFilters) window.columnFilters = {};
        window.columnFilters[col] = ""; // remove the filter for that column
        if (typeof renderData === "function") {
          console.log("[TRACE] renderData() called from function clearFilterForColumn");
          console.trace();
          renderData();
        } else {
          console.warn("renderData() not yet defined — skipping this trace");
        }
              // re-render the data
        updateColumnFilterTags();       // update the header filter tags so that the other remains visible
      }                  

      function buildCompanyMiniChartData(historicalData) {
        // Determine the period in days (3, 7, or 30) based on your filterState
        let periodDays = 7;
        if (window.filterState.period === "3d") periodDays = 3;
        else if (window.filterState.period === "30d") periodDays = 30;
        
        // Get the overall max date from the companyStatsData
        const maxDate = findOverallMaxDate(window.companyStatsData);
        if (!maxDate) return [];
        
        const windowStart = maxDate.clone().subtract(periodDays - 1, "days");
        const windowEnd = maxDate.clone();
        
        // Filter the historical data to the date window
        const filtered = (historicalData || []).filter(item => {
          const d = moment(item.date.value, "YYYY-MM-DD");
          return d.isBetween(windowStart, windowEnd, "day", "[]");
        });
        
        // For each day in the period, compute average unique_products and on_sale values
        let results = [];
        let dt = windowStart.clone();
        while (dt.isSameOrBefore(windowEnd)) {
          const dStr = dt.format("YYYY-MM-DD");
          const records = filtered.filter(item =>
            moment(item.date.value, "YYYY-MM-DD").isSame(dt, "day")
          );
          let avgUnique = 0, avgOnSale = 0;
          if (records.length > 0) {
            avgUnique = records.reduce((sum, r) => sum + (parseFloat(r.unique_products) || 0), 0) / records.length;
            avgOnSale = records.reduce((sum, r) => sum + (parseFloat(r.un_products_on_sale) || 0), 0) / records.length;
          }
          results.push({ date: dStr, unp: avgUnique, sale: avgOnSale });
          dt.add(1, "days");
        }
        return results;
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
      
      // Helper just to find the overall max date in companyStatsData
      function findOverallMaxDate(companyStats) {
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
        return maxD; // can be null if none found
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
      
      function updateMarketShareCharts() {
        if (window.companyStatsData) {
          // Clear the market share container.
          const marketShareContainer = document.getElementById("marketShareChart");
          if (marketShareContainer) {
            marketShareContainer.innerHTML = "";
          }
          // Re-render both charts using the unified functions.
          //renderMarketSharePieChart(window.companyStatsData);
          renderMarketShareStackedArea(window.companyStatsData);
          renderCompaniesTable();
        }
      }
      
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
      
        // We define a helper that calls computeMarketShareData() for a custom date range
        // by temporarily forcing selectedPeriod = "custom" and setting mainDateRange:
        function computeMarketShareDataForCustomRange(marketData, start, end) {
          const savedPeriod = selectedPeriod;
          selectedPeriod = "custom";
          mainDateRange.start = start.clone();
          mainDateRange.end   = end.clone();
      
          const result = computeMarketShareData(marketData, false);
      
          // restore
          selectedPeriod = savedPeriod;
          return result;
        }
      
        // Now fetch the “previous” window data
        const prevUnified = computeMarketShareDataForCustomRange(marketData, prevStart, prevEnd) || null;
      
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
            <tr style="border-bottom:1px solid #ccc;">
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
      

    // Safely handle missing rowData or .historical_data
    function getDataRange(rowData) {
      if (!rowData) {
        return { start: moment(), end: moment() };
      }
      const items = rowData.historical_data || [];
      if (!items.length) {
        return { start: moment(), end: moment() };
      }
      let minDate = items[0].date.value;
      let maxDate = items[0].date.value;
      items.forEach(d => {
        const current = d.date.value;
        if (current < minDate) minDate=current;
        if (current > maxDate) maxDate=current;
      });
      return {
        start: moment(minDate,"YYYY-MM-DD"),
        end:   moment(maxDate,"YYYY-MM-DD"),
      };
    }

    function setupCompanyInsightsAnimation(panel) {
        // Prevent multiple setups on the same element.
        if (panel._hasAnimatedCloseSetup) return;
        panel._hasAnimatedCloseSetup = true;
        
        // Save a reference to the original remove() method.
        panel._originalRemove = panel.remove;
        
        // Override the remove() method.
        panel.remove = function() {
          // Add a "closing" class to trigger the CSS transition.
          panel.classList.add("closing");
          // Listen for the end of the width transition.
          panel.addEventListener("transitionend", function handler(e) {
            if (e.propertyName === "width") {
              panel.removeEventListener("transitionend", handler);
              // Once the transition is complete, call the original remove() method.
              panel._originalRemove.call(panel);
            }
          });
        };
      }          

      function closeDetailsPanel() {
        if (!currentlyOpenPanel) return;
        // Animate out:
        currentlyOpenPanel.style.opacity = "0";
        currentlyOpenPanel.style.transform = "translateY(-10px)";
        const panelToClose = currentlyOpenPanel; // store a local reference
        panelToClose.addEventListener("transitionend", function handler(e) {
          if (e.propertyName === "opacity") {
            panelToClose.removeEventListener("transitionend", handler);
            panelToClose.remove();
            currentlyOpenPanel = null;
            currentlyRowEndIndex = null;
            currentlySelectedIndex = null;
            panelAnimating = false;
            
            // *** NEW CODE: Remove "selected" classes from both buttons ***
            const companyCard = panelToClose.previousElementSibling;
            if (companyCard && companyCard.classList.contains("company-details")) {
               const moreBtn = companyCard.querySelector(".more-tab-button");
               const rankBtn = companyCard.querySelector(".rank-button");
               if (moreBtn) moreBtn.classList.remove("selected");
               if (rankBtn) rankBtn.classList.remove("selected");
            }
          }
        });
      }           
      
      function countUp(el, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
          if (!startTimestamp) startTimestamp = timestamp;
          const progress = Math.min((timestamp - startTimestamp) / duration, 1);
          el.textContent = Math.floor(progress * (end - start) + start);
          if (progress < 1) {
            window.requestAnimationFrame(step);
          }
        };
        window.requestAnimationFrame(step);
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

      function getLatestTrendDate() {
        const filtered = filterMarketTrends();
        let latest = null;
        filtered.forEach(record => {
          const d = moment(record.date.value, "YYYY-MM-DD");
          if (!latest || d.isAfter(latest)) {
            latest = d.clone();
          }
        });
        return latest;
      }

      function updateTrendTotals(latestDate) {
        const filtered = filterMarketTrends();
        latestDate = latestDate || getLatestTrendDate();
        if (!latestDate) return;
        
        const latestRecord = filtered.find(record => {
          return moment(record.date.value, "YYYY-MM-DD").isSame(latestDate, 'day');
        });
        
        if (latestRecord) {
            const totalCompaniesEl = document.getElementById("totalCompanies");
            const totalProductsEl = document.getElementById("totalProducts");
            countUp(totalCompaniesEl, 0, latestRecord.companies, 800);
            countUp(totalProductsEl, 0, latestRecord.un_products || 0, 800);
          }          
      }      

      function buildCompaniesTrendData(days = 14, latestDate) {
        latestDate = latestDate || getLatestTrendDate();
        if (!latestDate) return [];
        const filtered = filterMarketTrends();
        const trendData = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const day = latestDate.clone().subtract(i, 'days');
          const rec = filtered.find(record => moment(record.date.value, "YYYY-MM-DD").isSame(day, 'day'));
          trendData.push({
            date: day.format("YYYY-MM-DD"),
            count: rec ? rec.companies : 0
          });
        }
        return trendData;
      }
      
      function updateAdCards() {
        const toggleTrendBox = document.getElementById("toggleTrendBox");
        const togglePosBadge = document.getElementById("togglePosBadge");
        const toggleVisBadge = document.getElementById("toggleVisBadge");
      
        // If toggleTrendBox is null, we can safely default to false or just skip:
        const showTrendBox = toggleTrendBox ? toggleTrendBox.checked : false;
        const showPosBadge = togglePosBadge ? togglePosBadge.checked : false;
        const showVisBadge = toggleVisBadge ? toggleVisBadge.checked : false;
      
        document.querySelectorAll(".ad-details").forEach(ad => {
          // trend box
          ad.querySelectorAll(".trend-box").forEach(tb => {
            tb.style.setProperty("display", showTrendBox ? "" : "none", "important");
          });                   
          // position badge
          ad.querySelectorAll(".pos-badge").forEach(pb => {
            pb.style.display = showPosBadge ? "" : "none";
          });
          // visibility badge
          ad.querySelectorAll(".vis-badge").forEach(vb => {
            vb.style.display = showVisBadge ? "" : "none";
          });
        });
      }            
      
      function attachSettingsToggleListeners() {
        const toggleTrendBox = document.getElementById("toggleTrendBox");
        if (toggleTrendBox) {
          toggleTrendBox.addEventListener("change", function() {
            updateToggle("toggleTrendBox", this.checked);
            updateAdCards();                  // your existing function
          });
        }
        
        const togglePosBadge = document.getElementById("togglePosBadge");
        if (togglePosBadge) {
          togglePosBadge.addEventListener("change", function() {
            updateToggle("togglePosBadge", this.checked);
            updateAdCards();
          });
        }
        
        const toggleVisBadge = document.getElementById("toggleVisBadge");
        if (toggleVisBadge) {
          toggleVisBadge.addEventListener("change", function() {
            updateToggle("toggleVisBadge", this.checked);
            updateAdCards();
          });
        }

        const toggleCompanyStats = document.getElementById("toggleCompanyStats");
        if (toggleCompanyStats) {
            toggleCompanyStats.addEventListener("change", function() {
                updateToggle("toggleCompanyStats", this.checked);
              // existing code to show/hide stats:
              const statsContainer = document.getElementById("companyStats");
              if (statsContainer) {
                statsContainer.style.display = this.checked ? "flex" : "none";
              }
                
                if (toggleCompanyStats.checked) {
                  // When turning ON: first make the container visible with zero height and opacity
                  statsContainer.style.display = "flex";
                  statsContainer.style.height = "0px";
                  statsContainer.style.opacity = "0";
                  // Trigger a reflow so the transition can run
                  void statsContainer.offsetWidth;
                  // Animate to full height (e.g. 200px) and full opacity
                  statsContainer.style.height = "200px";
                  statsContainer.style.opacity = "1";
                } else {
                  // When turning OFF: animate the height to 0 and fade out
                  statsContainer.style.height = "0px";
                  statsContainer.style.opacity = "0";
                  // After transition ends, set display to none
                  statsContainer.addEventListener("transitionend", function handler(e) {
                    if (e.propertyName === "height") {
                      statsContainer.style.display = "none";
                      statsContainer.removeEventListener("transitionend", handler);
                    }
                  });                  
                }
              });              
        }
        // Refresh the ad cards immediately.
        updateAdCards();
      }            

      function buildProductsTrendData(days = 14, latestDate) {
        latestDate = latestDate || getLatestTrendDate();
        if (!latestDate) return { unProducts: [], unProductsOnSale: [], dates: [] };
        
        const filtered = filterMarketTrends();
        const unProducts = [];
        const unProductsOnSale = [];
        const dates = [];
        
        for (let i = days - 1; i >= 0; i--) {
          const day = latestDate.clone().subtract(i, 'days');
          dates.push(day.format("YYYY-MM-DD"));
          const rec = filtered.find(record => moment(record.date.value, "YYYY-MM-DD").isSame(day, 'day'));
          unProducts.push(rec ? rec.un_products : 0);
          unProductsOnSale.push(rec ? rec.un_products_on_sale : 0);
        }
        return { dates, unProducts, unProductsOnSale };
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

      function updateMarketTrendsUI() {
        const latestDate = getLatestTrendDate();
        if (!latestDate) return;
        updateTrendTotals(latestDate);
        renderCompaniesTrendChart(latestDate);
        renderProductsTrendChart(latestDate);
      }                 
