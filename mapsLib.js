/***********************************************************
  mapsLib.js
  ----------------------------------------------------------
  A reusable library for:
    - Fetching and caching TopoJSON for US, Canada, UK, Australia
    - Drawing color-coded maps with city-level pies or dots
    - If multiple devices exist at the same location,
      each location shows multiple mini pies side by side.

  DEPENDS ON:
    1) <script src="https://d3js.org/d3.v7.min.js"></script>
    2) <script src="https://unpkg.com/topojson-client@3"></script>

  USAGE:
    1) Load D3 + TopoJSON
    2) <script src="mapsLib.js"></script>
    3) Then call, e.g.:
       mapHelpers.drawUsMapWithLocations(myProject, "#locMap");
***********************************************************/
(function() {
  // Make sure D3 + topojson are available
  const d3 = window.d3;
  const topojson = window.topojson;

  if (!d3 || !topojson) {
    console.error("[mapsLib] ERROR: d3 or topojson not found on window.");
    return;
  }

  // ---------- (A) Data / Caches / Constants ----------

  // URLs to your hosted TopoJSON
  const US_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_e242dae5156b4d5991a475cd815a9992.json";
  const CA_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_e7e42edc818f4c7ea8048f3feecaceae.json";
  const UK_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_f8ad7eac96194e7b9344ce17ec919256.json";
  const AU_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_570f8666e8c847c69004e83288f088fd.json";

  // Internal caches so we only fetch each TopoJSON once
  let usTopoCache = null;
  let canadaTopoCache = null;
  let ukTopoCache = null;
  let australiaTopoCache = null;

  // US: FIPS => state postal code
  const FIPS_TO_POSTAL = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
    "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
    "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
    "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY"
  };

  // Canada: object to map e.g. "CA08" => "ON"
  const PROVINCE_CODE_MAP = {
    "CA01": "AB",
    "CA02": "BC",
    "CA03": "MB",
    "CA04": "NB",
    "CA05": "NL",
    "CA06": "NT",
    "CA07": "NS",
    "CA08": "ON",
    "CA09": "PE",
    "CA10": "QC",
    "CA11": "SK",
    "CA12": "YT",
    "CA13": "NU"
  };
  function mapProvinceCode(code) {
    return PROVINCE_CODE_MAP[code] || code;
  }

  // Australia: region “ID” => name
  const AUSTATE_ID_TO_NAME = {
    0: "New South Wales",
    1: "Victoria",
    2: "Queensland",
    3: "South Australia",
    4: "Western Australia",
    5: "Tasmania",
    6: "Northern Territory",
    7: "Australian Capital Territory"
  };

  // ---------- (B) Helper fetchers for each country’s TopoJSON ----------
  async function getUSMapData() {
    if (usTopoCache) return usTopoCache;
    try {
      const resp = await fetch(US_JSON_URL);
      if (!resp.ok) throw new Error("Fetching US TopoJSON failed: " + resp.status);
      usTopoCache = await resp.json();
      return usTopoCache;
    } catch (err) {
      console.error("[mapsLib] US fetch error:", err);
      throw err;
    }
  }

  async function getCanadaMapData() {
    if (canadaTopoCache) return canadaTopoCache;
    try {
      const resp = await fetch(CA_JSON_URL);
      if (!resp.ok) throw new Error("Fetching Canada TopoJSON failed: " + resp.status);
      canadaTopoCache = await resp.json();
      return canadaTopoCache;
    } catch (err) {
      console.error("[mapsLib] Canada fetch error:", err);
      throw err;
    }
  }

  async function getUKMapData() {
    if (ukTopoCache) return ukTopoCache;
    try {
      const resp = await fetch(UK_JSON_URL);
      if (!resp.ok) throw new Error("Fetching UK TopoJSON failed: " + resp.status);
      ukTopoCache = await resp.json();
      return ukTopoCache;
    } catch (err) {
      console.error("[mapsLib] UK fetch error:", err);
      throw err;
    }
  }

  async function getAustraliaMapData() {
    if (australiaTopoCache) return australiaTopoCache;
    try {
      const resp = await fetch(AU_JSON_URL);
      if (!resp.ok) throw new Error("Fetching Australia TopoJSON failed: " + resp.status);
      australiaTopoCache = await resp.json();
      return australiaTopoCache;
    } catch (err) {
      console.error("[mapsLib] Australia fetch error:", err);
      throw err;
    }
  }

  // ---------- (C) A utility “colorForDevice” function ----------
  function colorForDevice(deviceName) {
    const d = (deviceName || "").toLowerCase();
    if (d.includes("desktop")) return "#007aff"; // blue
    if (d.includes("mobile"))  return "#f44336"; // red
    return "#888";
  }

  // ---------- (D) Build an array: each item => { locName, device, shareVal, avgRank, rankChange } ----------
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const arr = [];
    project.searches.forEach(s => {
      // We assume each search has { location, device, shareVal, avgRank, rankChange }
      if (!s.location || !s.device || s.shareVal == null) return;
      const row = {
        locName: s.location.trim().toLowerCase().replace(/,\s*/g, ','),
        device: s.device,
        shareVal: parseFloat(s.shareVal) || 0,
        avgRank: s.avgRank != null ? parseFloat(s.avgRank) : 0,
        rankChange: s.rankChange != null ? parseFloat(s.rankChange) : 0
      };
      // Debug logs for data:
      console.log("[mapsLib] buildLocationDeviceData row:", row);
      arr.push(row);
    });
    return arr;
  }

  // ---------- (E) Tools to build state-based share data ----------
  //    We'll average across all cities in a state. We keep separate sums & counts for Desktop and Mobile.
  //    Then we can compute the color based on toggles.
  function buildStateShareMap(dataRows) {
    // stateShareMap[postal] = { desktopSum, desktopCount, mobileSum, mobileCount }
    const stateShareMap = {};
    if (!window.cityLookup) {
      console.warn("[mapsLib] cityLookup is missing, state coloring won't be accurate.");
      return stateShareMap;
    }

    dataRows.forEach(row => {
      const cityObj = window.cityLookup.get(row.locName);
      if (!cityObj || !cityObj.state_id) return;
      const stPostal = cityObj.state_id;
      if (!stateShareMap[stPostal]) {
        stateShareMap[stPostal] = {
          desktopSum: 0, desktopCount: 0,
          mobileSum: 0,  mobileCount: 0
        };
      }
      const device = row.device.toLowerCase();
      if (device.includes("desktop")) {
        stateShareMap[stPostal].desktopSum += row.shareVal;
        stateShareMap[stPostal].desktopCount += 1;
      } else if (device.includes("mobile")) {
        stateShareMap[stPostal].mobileSum += row.shareVal;
        stateShareMap[stPostal].mobileCount += 1;
      }
    });

    return stateShareMap;
  }

  // Compute the relevant share based on toggle states
  //   If both desktop & mobile are toggled on => average them (only if there's data).
  //   If only one is toggled => that one. If none => 0.
  function computeStateShare(stData, desktopOn, mobileOn) {
    if (!stData) return 0;

    let valDesktop = 0, valMobile = 0;
    if (desktopOn && stData.desktopCount > 0) {
      valDesktop = stData.desktopSum / stData.desktopCount;
    }
    if (mobileOn && stData.mobileCount > 0) {
      valMobile = stData.mobileSum / stData.mobileCount;
    }

    // Count how many toggles are "on" with actual data
    const togglesActive = (desktopOn && stData.desktopCount > 0 ? 1 : 0)
                        + (mobileOn && stData.mobileCount > 0 ? 1 : 0);

    if (togglesActive === 0) {
      // If no toggles or no data => 0
      return 0;
    }
    // If both toggles, average them
    return (valDesktop + valMobile) / togglesActive;
  }

  // ---------- (F) Draw the US map with the new layout + right-side settings + coloring ----------
  async function drawUsMapWithLocations(project, containerSelector) {
    // 1) Clear old contents
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    // 2) Create a flexible wrapper for map + settings
    const mainWrapper = container.append("div")
      .style("display", "flex")
      .style("flex-direction", "row")
      .style("align-items", "flex-start");

    // Left side: the map
    const mapDiv = mainWrapper.append("div")
      .style("flex", "1 1 auto")
      .style("position", "relative");

    // Right side: the "Settings" box
    // (Use flex: 0 0 200px so it remains 200px wide)
    const settingsDiv = mainWrapper.append("div")
      .style("flex", "0 0 200px")
      .style("height", "600px")
      .style("background-color", "#f5f5f5")
      .style("border-radius", "8px")
      .style("box-shadow", "0 0 10px rgba(0,0,0,0.1)")
      .style("box-sizing", "border-box")
      .style("padding", "12px")
      .style("font-family", "Helvetica, Arial, sans-serif")
      .style("color", "#333")
      .style("margin-left", "10px"); // small gap from the map

    settingsDiv.append("h3")
      .style("margin-top", "0")
      .style("font-weight", "600")
      .text("Settings");

    // 2A) Toggles (Desktop group + Mobile group)
    const desktopGroup = settingsDiv.append("div")
      .style("margin-bottom", "20px");
    desktopGroup.append("h4")
      .style("margin", "10px 0 5px 0")
      .text("Desktop");

    const desktopShareToggle = desktopGroup.append("div")
      .append("label")
      .style("display", "flex")
      .style("align-items", "center");

    desktopShareToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "toggleDesktopShare")
      .property("checked", true)
      .style("margin-right", "6px");
    desktopShareToggle.append("span").text("Market Share");

    const desktopRankToggle = desktopGroup.append("div")
      .append("label")
      .style("display", "flex")
      .style("align-items", "center");

    desktopRankToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "toggleDesktopRank")
      .property("checked", true)
      .style("margin-right", "6px");
    desktopRankToggle.append("span").text("Avg Rank");

    const mobileGroup = settingsDiv.append("div")
      .style("margin-bottom", "20px");
    mobileGroup.append("h4")
      .style("margin", "10px 0 5px 0")
      .text("Mobile");

    const mobileShareToggle = mobileGroup.append("div")
      .append("label")
      .style("display", "flex")
      .style("align-items", "center");

    mobileShareToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "toggleMobileShare")
      .property("checked", true)
      .style("margin-right", "6px");
    mobileShareToggle.append("span").text("Market Share");

    const mobileRankToggle = mobileGroup.append("div")
      .append("label")
      .style("display", "flex")
      .style("align-items", "center");

    mobileRankToggle.append("input")
      .attr("type", "checkbox")
      .attr("id", "toggleMobileRank")
      .property("checked", true)
      .style("margin-right", "6px");
    mobileRankToggle.append("span").text("Avg Rank");

    // 3) Load US topo
    let usTopo;
    try {
      usTopo = await getUSMapData();
    } catch (err) {
      console.error("[mapsLib] drawUsMapWithLocations: US topo load error:", err);
      return;
    }

    // 4) Convert topo => GeoJSON
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 5) Build the location+device data
    const dataRows = buildLocationDeviceData(project);
    if (!dataRows.length) {
      console.warn("[mapsLib] No location/device data found; drawing plain US map.");
    }

    // 5B) Build a state-level share map
    const stateShareMap = buildStateShareMap(dataRows);

    // 6) Create an <svg> – increased width so the settings box has enough space
    const baseWidth = 975 + 200; // a bit wider
    const baseHeight = 610;
    const svg = mapDiv.append("svg")
      .attr("viewBox", `0 0 1175 610`) // just a bit more so it doesn't cramp
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", "1175px")  // bigger total width
      .style("max-height", "600px")
      .style("display", "block")
      .style("margin", "0 auto")
      .style("background-color", "transparent");

    const path = d3.geoPath();

    // We'll define the states selection up front so we can update coloring
    const statesSelection = svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("stroke", "#999");

    // 7) Create color scale for states
    // We'll pick a default domain [0..100].
    // We'll update it after toggles if needed.
    const colorScale = d3.scaleSequential()
      .domain([0, 100]) 
      .interpolator(d3.interpolateBlues);

    // 7B) A function to update the fill of each state
    function updateStateColors() {
      const desktopOn = d3.select("#toggleDesktopShare").property("checked");
      const mobileOn  = d3.select("#toggleMobileShare").property("checked");

      // First, let's find the new max share across all states
      let newMax = 0;
      Object.entries(stateShareMap).forEach(([st, stData]) => {
        const combined = computeStateShare(stData, desktopOn, mobileOn);
        if (combined > newMax) {
          newMax = combined;
        }
      });

      // If toggles are both off or no data, newMax might be 0 -> domain = [0,1]
      const maxDomain = newMax > 0 ? newMax : 1;
      colorScale.domain([0, maxDomain]);

      // Now set fill color for each state
      statesSelection
        .attr("fill", d => {
          const stPostal = FIPS_TO_POSTAL[d.id] || null;
          if (!stPostal) return "#FFFFFF";
          const stData = stateShareMap[stPostal];
          if (!stData) return "#FFFFFF";
          const combinedShare = computeStateShare(stData, desktopOn, mobileOn);
          // If there's no toggles or no data, color white
          if (combinedShare <= 0) {
            return "#FFFFFF";
          }
          return colorScale(combinedShare);
        });
    }

    // Initial coloring
    updateStateColors();

    // 8) Group dataRows by location => array of geometry
    const locMap = new Map();
    dataRows.forEach(row => {
      if (!locMap.has(row.locName)) {
        locMap.set(row.locName, []);
      }
      locMap.get(row.locName).push(row);
    });

    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    const locationData = [];
    if (window.cityLookup) {
      locMap.forEach((devicesArr, locKey) => {
        const cityObj = window.cityLookup.get(locKey);
        if (!cityObj) return;
        const coords = projection([cityObj.lng, cityObj.lat]);
        if (!coords) return;
        locationData.push({
          locName: locKey,
          x: coords[0],
          y: coords[1],
          devices: devicesArr
        });
      });
    }

    // 9) We'll have a separate layer for city dots and another for the pies
    const dotsLayer = svg.append("g").attr("class", "dots-layer");
    const groupsLayer = svg.append("g").attr("class", "group-layer");

    // 9A) Add the location “dot” in dots-layer
    dotsLayer.selectAll("circle.city-dot")
      .data(locationData)
      .enter()
      .append("circle")
      .attr("class", "city-dot")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 4)
      .attr("fill", "#cc0000")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // 9B) For each location, place pies further left/right so dot is visible
    // We'll offset by about 40 px from the dot horizontally, and -10 vertically
    const locationGroups = groupsLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter()
      .append("g")
      .attr("class", "loc-group")
      .attr("transform", d => {
        const offsetX = d.x < (baseWidth / 2) ? 40 : -40;
        return `translate(${d.x + offsetX}, ${d.y - 10})`;
      });

    // 10) Build two stacked pies (desktop + mobile), plus rank label
    locationGroups.each(function(d) {
      const parentG = d3.select(this);
      // Debug info:
      console.log("[mapsLib] locationGroups for location:", d.locName, "devices:", d.devices);

      const arcGen = d3.arc().outerRadius(25).innerRadius(0);
      const pieGen = d3.pie().sort(null).value(v => v);

      const desktop = d.devices.find(item => item.device.toLowerCase().includes("desktop"));
      const mobile  = d.devices.find(item => item.device.toLowerCase().includes("mobile"));

      // Identify device type for toggling classes
      function getDeviceType(str) {
        if (!str) return "";
        return str.toLowerCase().includes("desktop") ? "desktop" : "mobile";
      }

      // Helper to draw a single pie
      function drawPie(gSel, deviceData, yOffset) {
        if (!deviceData) return;

        console.log("[mapsLib] drawPie deviceData:", deviceData);

        const shareVal = parseFloat(deviceData.shareVal) || 0;
        const rankVal  = (deviceData.avgRank != null)
                          ? deviceData.avgRank.toFixed(1)
                          : "";
        console.log("[mapsLib] -> shareVal:", shareVal, "rankVal:", rankVal);

        const deviceType = getDeviceType(deviceData.device);

        // The pie slices for share => [shareVal, 100 - shareVal]
        const pieData  = [shareVal, 100 - shareVal];
        const arcs     = pieGen(pieData);

        // The group that holds the entire pie + rank
        const pieG = gSel.append("g")
          .attr("transform", `translate(0, ${yOffset})`);

        // Draw a rank box to the left
        const rankBoxWidth = 40;
        const rankBoxHeight = 20;
        const offsetBoxX = -(25 + 10 + rankBoxWidth); // left side of the pie
        const offsetBoxY = - (rankBoxHeight / 2);

        const rankBoxG = pieG.append("g")
          .attr("class", `rank-box rank-${deviceType}`)
          .attr("transform", `translate(${offsetBoxX}, ${offsetBoxY})`);

        rankBoxG.append("rect")
          .attr("width", rankBoxWidth)
          .attr("height", rankBoxHeight)
          .attr("rx", 5)
          .attr("ry", 5)
          .attr("fill", deviceType === "desktop" ? "#007aff" : "#f44336")
          .attr("stroke", "#fff")
          .attr("stroke-width", 1);

        rankBoxG.append("text")
          .attr("x", rankBoxWidth / 2)
          .attr("y", rankBoxHeight / 2 + 1)
          .attr("text-anchor", "middle")
          .style("fill", "#fff")
          .style("font-size", "12px")
          .style("font-weight", "bold")
          .style("font-family", "Helvetica, Arial, sans-serif")
          .text(rankVal);

        // Draw arcs for Market Share
        const arcPaths = pieG.selectAll("path.arc")
          .data(arcs)
          .enter()
          .append("path")
          .attr("class", `arc arc-${deviceType}`)
          .attr("d", arcGen)
          .attr("fill", (dd, i) => i === 0 ? colorForDevice(deviceData.device) : "#ccc")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);

        // Place share% text in center
        pieG.append("text")
          .attr("class", `share-text share-${deviceType}`)
          .attr("text-anchor", "middle")
          .attr("dy", "0.4em")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .style("font-family", "Helvetica, Arial, sans-serif")
          .text(shareVal.toFixed(1) + "%");
      }

      let currentY = 0;
      if (desktop) {
        drawPie(parentG, desktop, currentY);
        currentY += 60; // vertical space between pies
      }
      if (mobile) {
        drawPie(parentG, mobile, currentY);
      }
    });

    // 11) Hook up toggles to show/hide arcs, rank boxes, & also recolor states
    function updateToggles() {
      const dShareOn = d3.select("#toggleDesktopShare").property("checked");
      const dRankOn  = d3.select("#toggleDesktopRank").property("checked");
      const mShareOn = d3.select("#toggleMobileShare").property("checked");
      const mRankOn  = d3.select("#toggleMobileRank").property("checked");

      // Desktop share arcs
      d3.selectAll(".arc-desktop").style("display", dShareOn ? null : "none");
      // Desktop share text
      d3.selectAll(".share-desktop").style("display", dShareOn ? null : "none");
      // Desktop rank
      d3.selectAll(".rank-desktop").style("display", dRankOn ? null : "none");

      // Mobile share arcs
      d3.selectAll(".arc-mobile").style("display", mShareOn ? null : "none");
      // Mobile share text
      d3.selectAll(".share-mobile").style("display", mShareOn ? null : "none");
      // Mobile rank
      d3.selectAll(".rank-mobile").style("display", mRankOn ? null : "none");

      // Update states color based on share toggles (rank toggles do not affect color)
      updateStateColors();
    }

    // 12) Listen for changes
    ["toggleDesktopShare","toggleDesktopRank","toggleMobileShare","toggleMobileRank"]
      .forEach(id => {
        d3.select("#"+id).on("change", updateToggles);
      });

    // Initial apply
    updateToggles();
  }

  // ---------- (G) Canada, UK, Australia remain largely unchanged ----------

  function collectActiveCitiesForProject(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    if (typeof window.cityLookup !== "object") {
      console.warn("[mapsLib] cityLookup not found; city dots won't appear.");
      return [];
    }
    const out = [];
    project.searches.forEach((s) => {
      if ((s.status || "").toLowerCase() !== "active") return;
      const loc = s.location;
      if (!loc) return;
      const locArr = Array.isArray(loc) ? loc : [loc];
      locArr.forEach(locStr => {
        const canon = locStr.trim().toLowerCase();
        if (window.cityLookup.has(canon)) {
          out.push(window.cityLookup.get(canon));
        }
      });
    });
    return out;
  }

  async function drawCanadaMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    let canadaTopo;
    try {
      canadaTopo = await getCanadaMapData();
    } catch (err) {
      console.error("[mapsLib] Canada topo load error:", err);
      return;
    }

    const provincesGeo = topojson.feature(canadaTopo, canadaTopo.objects.provinces);

    const provinceCounts = {};
    (project.searches || []).forEach((search) => {
      if ((search.status || "").toLowerCase() !== "active") return;
      const locs = Array.isArray(search.location) ? search.location : search.location ? [search.location] : [];
      locs.forEach((locStr) => {
        const canon = locStr.trim().toLowerCase();
        if (window.cityLookup && window.cityLookup.has(canon)) {
          const cityObj = window.cityLookup.get(canon);
          const st_id = cityObj.state_id || "";
          if (!provinceCounts[st_id]) provinceCounts[st_id] = 0;
          provinceCounts[st_id]++;
        }
      });
    });

    let maxCount = 0;
    Object.values(provinceCounts).forEach((v) => { if (v > maxCount) maxCount = v; });
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount || 1])
      .interpolator(d3.interpolateBlues);

    const width = 600, height = 500;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const projection = d3.geoMercator().fitSize([width, height], provincesGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.province")
      .data(provincesGeo.features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d) => {
        const code = d.properties.CODE;
        const shortCode = mapProvinceCode(code);
        const c = provinceCounts[shortCode] || 0;
        return colorScale(c);
      })
      .attr("stroke", "#999");

    svg.selectAll("circle.province-bubble")
      .data(provincesGeo.features)
      .enter()
      .append("circle")
      .attr("class", "province-bubble")
      .attr("cx", (d) => path.centroid(d)[0])
      .attr("cy", (d) => path.centroid(d)[1])
      .attr("r", (d) => {
        const shortCode = mapProvinceCode(d.properties.CODE);
        const c = provinceCounts[shortCode] || 0;
        return c > 0 ? 20 : 0;
      })
      .attr("fill", "#2962FF")
      .attr("fill-opacity", 0.5);

    svg.selectAll("text.province-bubble-label")
      .data(provincesGeo.features)
      .enter()
      .append("text")
      .attr("class", "province-bubble-label")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1] + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "#fff")
      .text((d) => {
        const shortCode = mapProvinceCode(d.properties.CODE);
        const c = provinceCounts[shortCode] || 0;
        return c > 0 ? c : "";
      });

    const activeCityObjs = collectActiveCitiesForProject(project);
    activeCityObjs.forEach((city) => {
      const coords = projection([city.lng, city.lat]);
      if (!coords) return;
      const [x, y] = coords;
      svg.append("circle")
        .attr("class", "city-dot")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    });
  }

  async function drawUKMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    let ukTopo;
    try {
      ukTopo = await getUKMapData();
    } catch (err) {
      console.error("[mapsLib] UK topo load error:", err);
      return;
    }

    const ukGeo = topojson.feature(ukTopo, ukTopo.objects.eer);

    const regionCounts = {};
    (project.searches || []).forEach((search) => {
      if ((search.status || "").toLowerCase() !== "active") return;
      const locArr = Array.isArray(search.location) ? search.location : search.location ? [search.location] : [];
      locArr.forEach((locStr) => {
        const canon = locStr.trim().toLowerCase();
        if (window.cityLookup && window.cityLookup.has(canon)) {
          const cityObj = window.cityLookup.get(canon);
          const regionName = (cityObj.regionName || "").trim();
          if (!regionCounts[regionName]) regionCounts[regionName] = 0;
          regionCounts[regionName]++;
        }
      });
    });

    let maxCount = 0;
    Object.values(regionCounts).forEach((v) => { if (v > maxCount) maxCount = v; });
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount || 1])
      .interpolator(d3.interpolateBlues);

    const width = 600, height = 500;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const projection = d3.geoMercator().fitSize([width, height], ukGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.uk-region")
      .data(ukGeo.features)
      .enter()
      .append("path")
      .attr("class", "uk-region")
      .attr("d", path)
      .attr("stroke", "#999")
      .attr("fill", (d) => {
        const regionName = d.properties.EER13NM || "";
        const c = regionCounts[regionName] || 0;
        return colorScale(c);
      });

    const activeCityObjs = collectActiveCitiesForProject(project);
    activeCityObjs.forEach((city) => {
      const coords = projection([city.lng, city.lat]);
      if (!coords) return;
      const [x, y] = coords;
      svg.append("circle")
        .attr("class", "city-dot")
        .attr("cx", x)
        .attr("cy", y)
        .attr("r", 5)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    });
  }

  async function drawAustraliaMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    let auTopo;
    try {
      auTopo = await getAustraliaMapData();
    } catch (err) {
      console.error("[mapsLib] Australia fetch error:", err);
      return;
    }

    const australiaGeo = topojson.feature(auTopo, auTopo.objects.austates);

    const regionCounts = {};
    (project.searches || []).forEach((search) => {
      if ((search.status || "").toLowerCase() !== "active") return;
      const locArr = Array.isArray(search.location) ? search.location : search.location ? [search.location] : [];
      locArr.forEach((locStr) => {
        const canon = locStr.trim().toLowerCase();
        if (window.cityLookup && window.cityLookup.has(canon)) {
          const cityObj = window.cityLookup.get(canon);
          const rid = cityObj.regionId;
          if (typeof rid === "number" && rid >= 0) {
            if (!regionCounts[rid]) regionCounts[rid] = 0;
            regionCounts[rid]++;
          }
        }
      });
    });

    let maxCount = 0;
    Object.values(regionCounts).forEach((v) => { if (v > maxCount) maxCount = v; });
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount || 1])
      .interpolator(d3.interpolateBlues);

    const width = 700, height = 600;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const projection = d3.geoMercator().fitSize([width, height], australiaGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.au-state")
      .data(australiaGeo.features)
      .enter()
      .append("path")
      .attr("class", "au-state")
      .attr("d", path)
      .attr("stroke", "#999")
      .attr("fill", (d) => {
        const regionId = d.id;
        const c = regionCounts[regionId] || 0;
        return colorScale(c);
      });

    svg.selectAll("circle.au-bubble")
      .data(australiaGeo.features)
      .enter()
      .append("circle")
      .attr("class", "au-bubble")
      .attr("cx", (d) => path.centroid(d)[0])
      .attr("cy", (d) => path.centroid(d)[1])
      .attr("r", (d) => {
        const c = regionCounts[d.id] || 0;
        return c > 0 ? 20 : 0;
      })
      .attr("fill", "#2962FF")
      .attr("fill-opacity", 0.4);

    svg.selectAll("text.au-bubble-label")
      .data(australiaGeo.features)
      .enter()
      .append("text")
      .attr("class", "au-bubble-label")
      .attr("x", (d) => path.centroid(d)[0])
      .attr("y", (d) => path.centroid(d)[1] + 5)
      .attr("text-anchor", "middle")
      .attr("font-size", 14)
      .attr("fill", "#fff")
      .text((d) => {
        const c = regionCounts[d.id] || 0;
        return c > 0 ? c : "";
      });

    const activeCityObjs = collectActiveCitiesForProject(project);
    activeCityObjs.forEach((city) => {
      const coords = projection([city.lng, city.lat]);
      if (!coords) return;
      svg.append("circle")
        .attr("class", "city-dot")
        .attr("cx", coords[0])
        .attr("cy", coords[1])
        .attr("r", 5)
        .attr("fill", "red")
        .attr("stroke", "#fff")
        .attr("stroke-width", 1);
    });
  }

  // ----- (H) Expose the methods -----
  window.mapHelpers = {
    drawUsMapWithLocations,
    drawCanadaMapWithLocations,
    drawUKMapWithLocations,
    drawAustraliaMapWithLocations
  };

})(); // end IIFE
