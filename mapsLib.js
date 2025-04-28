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
  // Make sure D3 + topojson exist
  const d3 = window.d3;
  const topojson = window.topojson;
  if (!d3 || !topojson) {
    console.error("[mapsLib] ERROR: d3 or topojson not found on window.");
    return;
  }

  // ---------- (A) Data / Caches / Constants ----------
  const US_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_e242dae5156b4d5991a475cd815a9992.json";
  const CA_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_e7e42edc818f4c7ea8048f3feec919256.json";
  const UK_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_f8ad7eac96194e7b9344ce17ec919256.json";
  const AU_JSON_URL = "https://0eae2a94-5aba-4e1e-a0bc-1175f0961b08.usrfiles.com/ugd/0eae2a_570f8666e8c847c69004e83288f088fd.json";

  let usTopoCache = null;
  let canadaTopoCache = null;
  let ukTopoCache = null;
  let australiaTopoCache = null;

  // US: FIPS => state postal
  const FIPS_TO_POSTAL = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE",
    "11": "DC", "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA",
    "20": "KS", "21": "KY", "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN",
    "28": "MS", "29": "MO", "30": "MT", "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM",
    "36": "NY", "37": "NC", "38": "ND", "39": "OH", "40": "OK", "41": "OR", "42": "PA", "44": "RI",
    "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT", "50": "VT", "51": "VA", "53": "WA",
    "54": "WV", "55": "WI", "56": "WY"
  };

  // Add this map from 2-letter postal => spelled-out state name
const POSTAL_TO_STATE_NAME = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  DC: "District of Columbia", FL: "Florida", GA: "Georgia", HI: "Hawaii",
  ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine",
  MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska",
  NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island",
  SC: "South Carolina", SD: "South Dakota", TN: "Tennessee", TX: "Texas",
  UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming"
};

  // Canada
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

  // Australia
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

  // ---------- (B) Fetch each country’s TopoJSON ----------
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

  // ---------- (C) Simple color utility for device slices ----------
  function colorForDevice(deviceName) {
    const d = (deviceName || "").toLowerCase();
    if (d.includes("desktop")) return "#007aff"; // blue
    if (d.includes("mobile"))  return "#f44336"; // red
    return "#888";
  }

  // ---------- (D) Build an array: each item => { locName, device, shareVal, avgRank, ... } ----------
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const arr = [];
    project.searches.forEach(s => {
      if (!s.location || !s.device) return;
      arr.push({
        locName: s.location.trim().toLowerCase().replace(/,\s*/g, ','),
        device: s.device,
        shareVal: s.shareVal != null ? parseFloat(s.shareVal) : 0,
        avgRank: s.computedAvgRank != null ? parseFloat(s.computedAvgRank) : (s.avgRank != null ? parseFloat(s.avgRank) : 0),
        rankChange: s.rankChange != null ? parseFloat(s.rankChange) : 0,
        hideRank: s.hideRank || false,
        hideShare: s.hideShare || false
      });
    });
    return arr;
  }

  // Helper: return a class for rank value matching the "rank-box" styling
  function getRankClass(rankVal) {
    const r = parseFloat(rankVal);
    if (isNaN(r) || r <= 0) return "";
    if (r === 1) return "range-green";
    if (r <= 3)  return "range-yellow";
    if (r <= 5)  return "range-orange";
    return "range-red";
  }

  // ---------- (E) Build state-based share data so we can color each state by combined share ----------
  function buildStateShareMap(dataRows) {
    const stateShareMap = {};
    if (!window.cityLookup) {
      console.warn("[mapsLib] cityLookup is missing, coloring won't be accurate.");
      return stateShareMap;
    }
    dataRows.forEach(row => {
      const cityObj = window.cityLookup.get(row.locName);
      if (!cityObj || !cityObj.state_id) return;
      const stPostal = cityObj.state_id;
      if (!stateShareMap[stPostal]) {
        stateShareMap[stPostal] = { desktopSum: 0, desktopCount: 0, mobileSum: 0, mobileCount: 0 };
      }
      const dev = row.device.toLowerCase();
      if (dev.includes("desktop")) {
        stateShareMap[stPostal].desktopSum += row.shareVal;
        stateShareMap[stPostal].desktopCount++;
      } else if (dev.includes("mobile")) {
        stateShareMap[stPostal].mobileSum += row.shareVal;
        stateShareMap[stPostal].mobileCount++;
      }
    });
    return stateShareMap;
  }

  // Compute average share for a state
  function computeCombinedShare(stData) {
    if (!stData) return 0;
    let sum = 0, count = 0;
    if (stData.desktopCount > 0) { sum += (stData.desktopSum / stData.desktopCount); count++; }
    if (stData.mobileCount > 0)  { sum += (stData.mobileSum / stData.mobileCount); count++; }
    return (count === 0) ? 0 : (sum / count);
  }

  // ---------- (F) Draw US map with location pies, state labels, and popup tooltip ----------
  async function drawUsMapWithLocations(project, containerSelector) {
    // 1) Clear old
    const container = d3.select(containerSelector).html("");

    // 2) Create a container div for the map
    const mapDiv = container.append("div")
      .style("position", "relative");

    // After creating mapDiv
const tagContainer = container.append("div")
  .attr("id", "stateFilterTag")
  .style("margin-top", "10px")
  .style("text-align", "left");

    // Apply toggle settings to project.searches
    const desktopShare = document.getElementById("toggleDesktopShare")?.checked;
    const desktopRank  = document.getElementById("toggleDesktopRank")?.checked;
    const mobileShare  = document.getElementById("toggleMobileShare")?.checked;
    const mobileRank   = document.getElementById("toggleMobileRank")?.checked;
    project.searches.forEach(s => {
      if (s.device && s.device.toLowerCase().includes("desktop")) {
        s.hideShare = !desktopShare;
        s.hideRank  = !desktopRank;
      } else if (s.device && s.device.toLowerCase().includes("mobile")) {
        s.hideShare = !mobileShare;
        s.hideRank  = !mobileRank;
      }
    });

    // 3) Load US TopoJSON
    let usTopo;
    try {
      usTopo = await getUSMapData();
    } catch (err) {
      console.error("[mapsLib] US topo load error:", err);
      return;
    }
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 4) Build location/device data
    const dataRows = buildLocationDeviceData(project);
    const stateShareMap = buildStateShareMap(dataRows);

    // 5) Create the SVG container
    const baseWidth = 975, baseHeight = 610;
    const svg = mapDiv.append("svg")
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", baseWidth + "px")
      .style("max-height", "600px")
      .style("display", "block")
      .style("margin", "0 auto")
      .style("background-color", "transparent");

    const path = d3.geoPath();

    // 5B) Build a color scale for states based on combined market share
    let maxShare = 0;
    Object.values(stateShareMap).forEach(stData => {
      const c = computeCombinedShare(stData);
      if (c > maxShare) maxShare = c;
    });
    const colorScale = d3.scaleSequential()
      .domain([0, maxShare || 1])
      .interpolator(d3.interpolateBlues);

    // 6) Draw state paths
    const statesSelection = svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("stroke", "#999")
      .attr("fill", d => {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (!stPostal || !stateShareMap[stPostal]) return "#f5fcff";
        const combinedShare = computeCombinedShare(stateShareMap[stPostal]);
        return (combinedShare <= 0) ? "#f5fcff" : colorScale(combinedShare);
      })
      .attr("d", path);

    // 6A) Create clip paths so state labels are confined within each state
    svg.selectAll("clipPath.state-clip")
      .data(statesGeo.features)
      .enter()
      .append("clipPath")
      .attr("id", d => "clip-" + d.id)
      .append("path")
      .attr("d", path);

    let previouslySelectedState = null;

    // 6B) Add white labels (average market share) inside each state
svg.selectAll("foreignObject.state-label")
  .data(statesGeo.features)
  .enter()
  .append("foreignObject")
  .attr("class", "state-label")
  .attr("clip-path", d => "url(#clip-" + d.id + ")")
  // Adjust x and y so the box is centered (you might need to tweak the offsets)
  .attr("x", d => path.centroid(d)[0] - 30) 
  .attr("y", d => path.centroid(d)[1] - 15)
  .attr("width", "60px")
  .attr("height", "30px")
  .html(d => {
    const stPostal = FIPS_TO_POSTAL[d.id] || null;
    if (!stPostal || !stateShareMap[stPostal]) return "";
    const combinedShare = computeCombinedShare(stateShareMap[stPostal]);
    const shareText = (combinedShare > 0) ? combinedShare.toFixed(1) + "%" : "";
    
    // Retrieve the trend data.
    // This example assumes that window.locContainer is an object keyed by state postal codes
    // and that each value has a Trend property with either "up" or "down".
    let trendArrow = "";
    if (window.locContainer && window.locContainer[stPostal]) {
      trendArrow = window.locContainer[stPostal].Trend === "up" ? "&#x2191;" : "&#x2193;";
    }
    
    // The inline style creates a box with a white background (70% opaque), dark grey text, and rounded corners.
    return `
      <div style="
        width: 60px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        font-weight: bold;
        font-family: Helvetica, Arial, sans-serif;
        background: rgba(255, 255, 255, 0.7);
        color: #333;
        border-radius: 4px;
      ">
        ${shareText}
        <span style="margin-left: 4px; color: ${trendArrow === "&#x2191;" ? 'green' : 'red'};">
          ${trendArrow}
        </span>
      </div>
    `;
  });

    // 7) Group location rows for device pies
    const locMap = new Map();
    dataRows.forEach(r => {
      if (!locMap.has(r.locName)) { locMap.set(r.locName, []); }
      locMap.get(r.locName).push(r);
    });

    // 8) Use AlbersUSA projection
    const projection = d3.geoAlbersUsa()
      .scale(1300)
      .translate([487.5, 305]);

    const locationData = [];
    if (window.cityLookup) {
      locMap.forEach((devicesArr, locKey) => {
        const cityObj = window.cityLookup.get(locKey);
        if (!cityObj) return;
        const coords = projection([cityObj.lng, cityObj.lat]);
        if (!coords) return;
        locationData.push({ locName: locKey, x: coords[0], y: coords[1], devices: devicesArr });
      });
    }

    // 9) Draw dots and pies layers
    const dotsLayer = svg.append("g").attr("class", "dots-layer");
    const piesLayer = svg.append("g").attr("class", "pies-layer");

    dotsLayer.selectAll("circle.city-dot")
      .data(locationData)
      .enter()
      .append("circle")
      .attr("class", "city-dot")
      .attr("cx", d => d.x)
      .attr("cy", d => d.y)
      .attr("r", 8)
      .attr("fill", "#cc0000")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    const locationGroups = piesLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter()
      .append("g")
      .attr("class", "loc-group")
      .attr("transform", d => {
        const offsetX = d.x < (baseWidth / 2) ? 40 : -40;
        let groupHeight = 0;
        if (d.devices.find(item => item.device.toLowerCase().includes("desktop"))) { groupHeight += 60; }
        if (d.devices.find(item => item.device.toLowerCase().includes("mobile"))) { groupHeight += 60; }
        if (groupHeight === 0) groupHeight = 60;
        let newY = d.y - groupHeight / 2;
        newY = Math.max(0, Math.min(newY, baseHeight - groupHeight));
        return `translate(${d.x + offsetX}, ${newY})`;
      });

    // Pie generator
    const arcGen = d3.arc().outerRadius(25).innerRadius(0);
    const pieGen = d3.pie().sort(null).value(v => v);

    // Draw a single device pie + rank box
    function drawPie(gSel, deviceData, yOffset) {
      if (deviceData.hideRank && deviceData.hideShare) { return; }
      if (!deviceData) return;
      const shareVal = parseFloat(deviceData.shareVal) || 0;
      const displayShareVal = deviceData.hideShare ? 0 : shareVal;
      const rawRank = deviceData.avgRank != null ? parseFloat(deviceData.avgRank) : 0;
      const rankVal = rawRank.toFixed(1);
      const pieData = [displayShareVal, Math.max(0, 100 - displayShareVal)];
      const arcs = pieGen(pieData);
      const pieG = gSel.append("g")
        .attr("data-device", deviceData.device.toLowerCase())
        .attr("transform", `translate(0, ${yOffset})`);
      if (!deviceData.hideRank) {
        const rankG = pieG.append("g").attr("class", "rank-box-group");
        let bgColor;
        if (rawRank < 2) { bgColor = "#dfffd6"; }
        else if (rawRank < 4) { bgColor = "#fffac2"; }
        else if (rawRank < 6) { bgColor = "#ffe0bd"; }
        else { bgColor = "#ffcfcf"; }
        rankG.append("foreignObject")
          .attr("class", "rank-box")
          .attr("data-device", deviceData.device.toLowerCase())
          .attr("x", -(25 + 10 + 38))
          .attr("y", -19)
          .attr("width", 38)
          .attr("height", 38)
          .html(`
            <div style="
              width: 38px;
              height: 38px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              font-weight: bold;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: ${bgColor};
              color: #333;
              border-radius: 4px;
            ">
              ${rankVal}
            </div>
          `);
      }
      const shareG = pieG.append("g").attr("class", "share-pie-group");
      if (!deviceData.hideShare) {
        shareG.selectAll("path.arc")
          .data(arcs)
          .enter()
          .append("path")
          .attr("class", "arc")
          .attr("d", arcGen)
          .attr("fill", (dd, i) => i === 0 ? colorForDevice(deviceData.device) : "#ccc")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);
        shareG.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "0.4em")
          .style("font-size", "14px")
          .style("font-weight", "bold")
          .style("fill", "#333")
          .style("font-family", "Helvetica, Arial, sans-serif")
          .text(displayShareVal.toFixed(1) + "%");
      }
    }

    locationGroups.each(function(d) {
      const parentG = d3.select(this);
      let yOff = 30;
      const desktop = d.devices.find(item => item.device.toLowerCase().includes("desktop"));
      if (desktop) { drawPie(parentG, desktop, yOff); yOff += 60; }
      const mobile = d.devices.find(item => item.device.toLowerCase().includes("mobile"));
      if (mobile) { drawPie(parentG, mobile, yOff); }
    });

    // ---------- (F.1) Add a tooltip popup for state hover ----------
    const tooltip = container.append("div")
      .attr("class", "state-tooltip")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background", "rgba(0, 0, 0, 0.7)")
      .style("color", "#fff")
      .style("padding", "8px")
      .style("border-radius", "6px")
      .style("font-size", "14px")
      .style("display", "none");

    // Attach mouse events to states for the popup
    statesSelection
      .on("mouseover", function(event, d) {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (!stPostal || !stateShareMap[stPostal]) return;
        // Filter dataRows for desktop and mobile devices in this state
        const desktopRows = dataRows.filter(r => {
          const city = window.cityLookup.get(r.locName);
          return city && city.state_id === stPostal && r.device.toLowerCase().includes("desktop");
        });
        const mobileRows = dataRows.filter(r => {
          const city = window.cityLookup.get(r.locName);
          return city && city.state_id === stPostal && r.device.toLowerCase().includes("mobile");
        });
        function avgRank(rows) {
          if (!rows.length) return "N/A";
          const sum = rows.reduce((acc, cur) => acc + (parseFloat(cur.avgRank)||0), 0);
          return (sum / rows.length).toFixed(1);
        }
        const desktopAvgRank = avgRank(desktopRows);
        const mobileAvgRank = avgRank(mobileRows);
        const desktopShare = desktopRows.length ? computeCombinedShare({
          desktopSum: desktopRows.reduce((acc, r) => acc + r.shareVal, 0),
          desktopCount: desktopRows.length
        }) : 0;
        const mobileShare = mobileRows.length ? computeCombinedShare({
          mobileSum: mobileRows.reduce((acc, r) => acc + r.shareVal, 0),
          mobileCount: mobileRows.length
        }) : 0;
        tooltip.html(`
          <div><strong>Desktop</strong>: Rank: ${desktopAvgRank}, Share: ${desktopShare.toFixed(1)}%</div>
          <div><strong>Mobile</strong>: Rank: ${mobileAvgRank}, Share: ${mobileShare.toFixed(1)}%</div>
        `);
        tooltip.style("display", "block");
      })
      .on("mousemove", function(event, d) {
        const [x, y] = d3.pointer(event, container.node());
        tooltip.style("left", (x + 12) + "px")
               .style("top", (y + 12) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("display", "none");
      })
  .on("click", function(event, d) {

    // 1) Revert the previously selected state's outline
    if (previouslySelectedState) {
      previouslySelectedState
        .attr("stroke-width", 1)
        .attr("stroke", "#999");
    }

    // 2) Highlight this newly clicked state
    d3.select(this)
      .attr("stroke-width", 4)
      .attr("stroke", "#007aff");

    // 3) Save this as the 'previouslySelectedState'
    previouslySelectedState = d3.select(this);

    // 4) Create or update the selected State tag
const tagDiv = document.getElementById("stateFilterTag");
if (tagDiv) {
  const stPostal = FIPS_TO_POSTAL[d.id] || null;
  if (!stPostal) return;
  const stateName = POSTAL_TO_STATE_NAME[stPostal] || "";

  tagDiv.innerHTML = `
    <span style="
      display: inline-block;
      background: #007aff;
      color: #fff;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 500;
      position: relative;
    ">
      ${stateName}
      <span id="clearStateFilter" style="
        margin-left: 8px;
        cursor: pointer;
        font-weight: bold;
      ">
        &times;
      </span>
    </span>
  `;

  // Attach click event to the × button
  document.getElementById("clearStateFilter").addEventListener("click", function() {
    // Clear the tag
    tagDiv.innerHTML = "";

    // Remove table filtering
    if (document.getElementById("homePage").style.display !== "none") {
      showAllHomeTableRows();
    } else if (document.getElementById("projectPage").style.display !== "none") {
      showAllProjectTableRows();
    }

    // Reset previously selected state's stroke
    if (previouslySelectedState) {
      previouslySelectedState
        .attr("stroke-width", 1)
        .attr("stroke", "#999");
      previouslySelectedState = null;
    }
  });
}

    // 4) Figure out the spelled-out name from the postal code
    const stPostal = FIPS_TO_POSTAL[d.id] || null;
    if (!stPostal) return;  // unknown or no data
    const stateName = POSTAL_TO_STATE_NAME[stPostal] || "";

    // 5) If we’re on the homePage, filter the “home-table”
    if (document.getElementById("homePage").style.display !== "none") {
      filterHomeTableByState(stateName);
    }
    // If we’re on the projectPage, filter the “project-table”
    else if (document.getElementById("projectPage").style.display !== "none") {
      rebuildProjectTableByState(stateName);
    }
  });
  }

  // ---------- (G) Canada, UK, Australia (same as old code) ----------
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

    // city dots
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

    // city dots
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
        const c = regionCounts[d.id] || 0;
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

    // city dots
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

  // ---------- (H) Expose as mapHelpers ----------
  if (typeof window.mapHelpers !== "object") {
    window.mapHelpers = {};
  }
  window.mapHelpers.drawUsMapWithLocations = drawUsMapWithLocations;
  window.mapHelpers.drawCanadaMapWithLocations = drawCanadaMapWithLocations;
  window.mapHelpers.drawUKMapWithLocations = drawUKMapWithLocations;
  window.mapHelpers.drawAustraliaMapWithLocations = drawAustraliaMapWithLocations;

  // Helper for collecting active city objects
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

  // Filter the home-table so that only rows whose LOCATION cell
// contains the specified stateName remain visible
function filterHomeTableByState(stateName) {
  const table = document.querySelector("#homePage .home-table");
  if (!table) return;

  const rows = table.querySelectorAll("tbody tr");
  let currentLocationName = "";
  const needle = stateName.toLowerCase();

  rows.forEach(row => {
    const firstCell = row.cells[0];
    // only update when this cell is the one that holds the Location (it has a rowspan)
    if (firstCell && firstCell.hasAttribute("rowspan")) {
      currentLocationName = firstCell.textContent.trim().toLowerCase();
    }

    // show/hide every row based on that last-seen location name
    if (currentLocationName.includes(needle)) {
      row.style.display = "";
    } else {
      row.style.display = "none";
    }
  });
}

/**
 * Removes the old table in #projectPage #locList,
 * creates a new filtered table for the specified stateName,
 * then appends it to #locList again.
 */
/**
 * rebuildProjectTableByState(stateName)
 * ------------------------------------
 * 1) Removes the entire old .project-table (wrapper and all).
 * 2) Calls buildProjectData() (which needs filterState.activeProjectNumber set).
 * 3) Filters that data to rows whose .location includes the specified stateName.
 * 4) Builds & populates a new .project-table.
 */

// Full, final version for copy-paste

/**
 * rebuildProjectTableByState(stateName)
 * -------------------------------------
 * Called whenever the user clicks a state on the US map AND
 * #projectPage is visible. We filter out only those rows whose
 * .location includes the clicked stateName, then rebuild the
 * same "project-table" structure from populateProjectPage().
 */
function rebuildProjectTableByState(stateName) {
  console.log("[rebuildProjectTableByState] => clicked state:", stateName);

  // 1) Remove any existing .project-table in #projectPage
  const oldTable = document.querySelector("#projectPage .project-table");
  if (oldTable) {
    oldTable.remove();
  }

  // 2) Basic checks
  if (!Array.isArray(window.companyStatsData) || !window.companyStatsData.length) {
    console.warn("[rebuildProjectTableByState] No companyStatsData found or empty.");
    return;
  }
  if (!window.filterState) window.filterState = {};
  
  // 3) Identify the active company + periodDays
  const st = window.filterState;
  const targetCompany = (st.company || window.myCompany || "Under Armour").toLowerCase();
  
  let periodDays = 7; // default
  if (st.period === "3d")  periodDays = 3;
  if (st.period === "30d") periodDays = 30;

  // 4) Filter raw rows => must match (company) AND location includes stateName
  const needle = (stateName || "").trim().toLowerCase();
  let baseRows = window.companyStatsData.filter(row => {
    const src = (row.source || "").toLowerCase();
    if (src !== targetCompany) return false;
    const loc = (row.location_requested || "").toLowerCase();
    if (!loc.includes(needle)) return false;
    return true;
  });
  
  if (!baseRows.length) {
    const locList = document.querySelector("#projectPage #locList");
    if (locList) {
      locList.innerHTML = `<p style="text-align:center; padding:20px;">
        No data for ${stateName}.
      </p>`;
    }
    return;
  }

  // 5) Inline aggregator => merges historical_data => compute avgRank, avgShare, etc.
  function findMaxDate(arr) {
    let maxM = null;
    arr.forEach(obj => {
      if (obj.date && obj.date.value) {
        const mm = moment(obj.date.value, "YYYY-MM-DD");
        if (!maxM || mm.isAfter(maxM)) {
          maxM = mm.clone();
        }
      }
    });
    return maxM;
  }

  // Group these filtered rows by (searchTerm, location, device)
  const groupingMap = {};
  baseRows.forEach(row => {
    const sTerm = row.q || row.search || "(no term)";
    const loc   = row.location_requested || "(unknown loc)";
    const dev   = row.device || "(unknown dev)";
    const key   = `${sTerm}||${loc}||${dev}`;

    if (!groupingMap[key]) {
      groupingMap[key] = [];
    }
    groupingMap[key].push(row);
  });

  const results = [];
  Object.keys(groupingMap).forEach(key => {
    const [theTerm, theLoc, theDev] = key.split("||");
    let mergedHist = [];
    groupingMap[key].forEach(r => {
      if (Array.isArray(r.historical_data)) {
        mergedHist = mergedHist.concat(r.historical_data);
      }
    });
    if (!mergedHist.length) return;

    // 5A) Find overall max date => define [start..end]
    const maxDate = findMaxDate(mergedHist);
    if (!maxDate) return;
    const end   = maxDate.clone();
    const start = end.clone().subtract(periodDays - 1, "days");

    // current window
    const currentArr = mergedHist.filter(d => {
      const dd = moment(d.date.value, "YYYY-MM-DD");
      return dd.isBetween(start, end, "day", "[]");
    });
    // previous window
    const prevEnd   = start.clone().subtract(1, "days");
    const prevStart = prevEnd.clone().subtract(periodDays - 1, "days");
    const prevArr   = mergedHist.filter(d => {
      const dd = moment(d.date.value, "YYYY-MM-DD");
      return dd.isBetween(prevStart, prevEnd, "day", "[]");
    });

    // avgRank
    let sumR=0, cR=0;
    currentArr.forEach(obj => {
      if (obj.rank != null) {
        sumR += parseFloat(obj.rank);
        cR++;
      }
    });
    const avgRank = cR>0 ? sumR/cR : 40;

    // avgShare
    let sumS=0, cS=0;
    currentArr.forEach(obj => {
      if (obj.market_share != null) {
        sumS += parseFloat(obj.market_share)*100;
        cS++;
      }
    });
    const avgShare = cS>0 ? sumS/cS : 0;

    // previous share => difference => trendVal
    let sumPrev=0, cPrev=0;
    prevArr.forEach(obj => {
      if (obj.market_share != null) {
        sumPrev += parseFloat(obj.market_share)*100;
        cPrev++;
      }
    });
    const prevShare = cPrev>0 ? sumPrev/cPrev : 0;
    const diff = avgShare - prevShare;

    // rankChange
    let sumPR=0, countPR=0;
    prevArr.forEach(obj => {
      if (obj.rank != null) {
        sumPR += parseFloat(obj.rank);
        countPR++;
      }
    });
    const prevRank = countPR>0 ? sumPR/countPR : 40;
    const rankDiff = avgRank - prevRank;

    // last30 arrays
    const dayMap = {};
    mergedHist.forEach(obj => {
      if (obj.date && obj.date.value) {
        const ds = obj.date.value;
        const rV = (obj.rank != null) ? parseFloat(obj.rank) : 40;
        const sV = (obj.market_share != null) ? parseFloat(obj.market_share)*100 : 0;
        dayMap[ds] = { r: rV, s: sV };
      }
    });
    const last30r = [];
    const last30s = [];
    const start30 = end.clone().subtract(29, "days");
    let run = start30.clone();
    while (run.isSameOrBefore(end, "day")) {
      const ds = run.format("YYYY-MM-DD");
      if (dayMap[ds]) {
        last30r.push(dayMap[ds].r);
        last30s.push(dayMap[ds].s);
      } else {
        last30r.push(40);
        last30s.push(0);
      }
      run.add(1,"days");
    }

    results.push({
      searchTerm: theTerm,
      location:   theLoc,
      device:     theDev,
      avgRank,
      rankChange: rankDiff,
      avgShare,
      trendVal: diff,
      last30ranks:  last30r,
      last30shares: last30s,
      endDate:     end.format("YYYY-MM-DD")
    });
  });

  if (!results.length) {
    const locList = document.querySelector("#projectPage #locList");
    if (locList) {
      locList.innerHTML = `<p style="text-align:center; padding:20px;">
        No aggregator results for ${stateName}
      </p>`;
    }
    return;
  }

  // 6) Build the “project-table” with the 6 columns & rowSpan approach
  const wrapper = document.createElement("div");
  wrapper.style.maxWidth        = "1250px";
  wrapper.style.margin          = "10px auto";
  wrapper.style.backgroundColor = "#fff";
  wrapper.style.borderRadius    = "8px";
  wrapper.style.boxShadow       = "0 4px 8px rgba(0,0,0,0.08)";
  wrapper.style.padding         = "10px";

  const table = document.createElement("table");
  table.classList.add("project-table");
  table.style.width          = "100%";
  table.style.borderCollapse = "collapse";

  // Include the “Rank & Market Share History” toggle in the <th>, identical to main table
  table.innerHTML = `
    <thead>
      <tr style="height:30px;">
        <th style="width:180px;">Search Term</th>
        <th style="width:220px;">Location</th>
        <th style="width:100px;">Device</th>
        <th style="width:120px;">Avg Rank</th>
        <th style="width:140px;">Market Share &amp; Trend</th>
        <th style="width:400px; position:relative;">
          Rank &amp; Market Share History
          <label style="position:absolute; right:8px; top:3px; font-size:12px; user-select:none; cursor:pointer;">
            <input type="checkbox" id="historyToggle" style="vertical-align:middle; margin-right:4px;" />
            <span>Share</span>
          </label>
        </th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  // Group results again => (searchTerm -> location -> deviceRows)
  const nestedMap = {};
  results.forEach(item => {
    const t = item.searchTerm;
    const l = item.location;
    if (!nestedMap[t]) nestedMap[t] = {};
    if (!nestedMap[t][l]) nestedMap[t][l] = [];
    nestedMap[t][l].push(item);
  });

  const sortedTerms = Object.keys(nestedMap).sort();
  sortedTerms.forEach(term => {
    const locObj   = nestedMap[term];
    const locKeys  = Object.keys(locObj).sort();

    let totalTermRows = 0;
    locKeys.forEach(loc => { totalTermRows += locObj[loc].length; });

    let termCellUsed = false;
    locKeys.forEach(loc => {
      const devRows = locObj[loc];
      // Sort so desktop first
      devRows.sort((a,b) => {
        const ad = (a.device || "").toLowerCase();
        const bd = (b.device || "").toLowerCase();
        if (ad === "desktop" && bd !== "desktop") return -1;
        if (bd === "desktop" && ad !== "desktop") return 1;
        return 0;
      });

      let locCellUsed = false;
      devRows.forEach(rowData => {
        const tr = document.createElement("tr");
        tr.style.height = "50px";

        // Light grey if device=mobile
        if ((rowData.device || "").toLowerCase() === "mobile") {
          tr.style.backgroundColor = "#f8f8f8";
        }

        // (1) SearchTerm => rowSpan
        if (!termCellUsed) {
          const tdTerm = document.createElement("td");
          tdTerm.style.fontWeight    = "bold";
          tdTerm.style.verticalAlign = "middle";
          tdTerm.rowSpan             = totalTermRows;
          tdTerm.textContent         = term;
          tr.appendChild(tdTerm);
          termCellUsed = true;
        }

        // (2) Location => rowSpan
        if (!locCellUsed) {
          const tdLoc = document.createElement("td");
          tdLoc.style.verticalAlign = "middle";
          tdLoc.rowSpan             = devRows.length;

          const parts = loc.split(",");
          const line1 = parts[0] || "";
          const line2 = parts.slice(1).join(", ");
          tdLoc.innerHTML = `
            <div style="font-size:20px; font-weight:bold;">${line1.trim()}</div>
            <div style="font-size:14px; color:#555;">${line2.trim()}</div>
          `;
          tr.appendChild(tdLoc);
          locCellUsed = true;
        }

        // (3) Device
        const tdDev = document.createElement("td");
        tdDev.textContent = rowData.device;
        tr.appendChild(tdDev);

        // (4) Avg Rank + arrow
        const tdRank = document.createElement("td");
        const rankVal = rowData.avgRank.toFixed(2);
        let arrowRank="", colorRank="#666";
        if (rowData.rankChange < 0) { arrowRank="▲"; colorRank="green"; }
        else if (rowData.rankChange > 0) { arrowRank="▼"; colorRank="red"; }

        tdRank.innerHTML = `
          <div style="font-size:18px; font-weight:bold;">${rankVal}</div>
          <div style="font-size:12px; color:${colorRank};">
            ${arrowRank} ${Math.abs(rowData.rankChange).toFixed(2)}
          </div>
        `;
        tr.appendChild(tdRank);

        // (5) Market Share + arrow
        const tdShare = document.createElement("td");
        const shareVal = rowData.avgShare.toFixed(1);
        let arrowShare="", colorShare="#666";
        if (rowData.trendVal > 0) { arrowShare="▲"; colorShare="green"; }
        else if (rowData.trendVal < 0) { arrowShare="▼"; colorShare="red"; }

        tdShare.innerHTML = `
          <div style="text-align:center;">
            <div class="ms-bar-container"
                 style="position:relative; width:100px; height:20px; background:#eee;
                        margin:0 auto; border-radius:4px;">
              <div class="ms-bar-filled"
                   style="position:absolute; left:0; top:0; bottom:0;
                          width:${shareVal}%; background:#007aff;">
              </div>
              <div class="ms-bar-label"
                   style="position:absolute; left:8px; top:0; bottom:0;
                          display:flex; align-items:center; font-size:13px;">
                ${shareVal}%
              </div>
            </div>
            <div style="margin-top:4px; font-size:12px; font-weight:bold; color:${colorShare};">
              ${arrowShare} ${Math.abs(rowData.trendVal).toFixed(2)}%
            </div>
          </div>
        `;
        tr.appendChild(tdShare);

        // (6) Rank & Share History => EXACT same mini-charts
        const tdHist = document.createElement("td");
        tdHist.style.width     = "400px";
        tdHist.style.textAlign = "center";

        // Create the container with rankRowDiv & shareRowDiv
        const histContainer = document.createElement("div");
        histContainer.style.width          = "380px";
        histContainer.style.overflowX      = "auto";
        histContainer.style.whiteSpace     = "nowrap";
        histContainer.style.display        = "flex";
        histContainer.style.flexDirection  = "column";
        histContainer.style.gap            = "4px";

        const rankRowDiv = document.createElement("div");
        rankRowDiv.style.display       = "inline-block";
        rankRowDiv.classList.add("rank-row-div");

        const shareRowDiv = document.createElement("div");
        shareRowDiv.style.display      = "none";
        shareRowDiv.classList.add("share-row-div");

        // Build an array of the last 30 days in descending order
        const endDateM = moment(rowData.endDate, "YYYY-MM-DD");
        const dateArray = [];
        for (let i=0; i<30; i++){
          dateArray.push(endDateM.clone().subtract(i,"days").format("YYYY-MM-DD"));
        }

        // Reversed iteration => rankRowDiv
        rowData.last30ranks.slice().reverse().forEach((rv, idx2) => {
          const box = document.createElement("div");
          box.style.display        = "inline-block";
          box.style.width          = "38px";
          box.style.height         = "38px";
          box.style.lineHeight     = "38px";
          box.style.textAlign      = "center";
          box.style.fontWeight     = "bold";
          box.style.marginRight    = "4px";
          box.style.borderRadius   = "4px";

          let bgColor = "#ffcfcf"; // higher ranks
          if (rv <= 1) {
            bgColor = "#dfffd6";
          } else if (rv <=3) {
            bgColor = "#fffac2";
          } else if (rv <=5) {
            bgColor = "#ffe0bd";
          }
          box.style.backgroundColor = bgColor;
          box.style.color           = "#000";
          box.textContent           = (rv===40) ? "" : rv;
          if (dateArray[idx2]) {
            box.title = dateArray[idx2];
          }
          rankRowDiv.appendChild(box);
        });

        // shareRowDiv
        rowData.last30shares.slice().reverse().forEach((sv, idx3) => {
          const fillPct = Math.min(100, Math.max(0, sv));
          const sBox = document.createElement("div");
          sBox.style.display     = "inline-block";
          sBox.style.position    = "relative";
          sBox.style.width       = "38px";
          sBox.style.height      = "38px";
          sBox.style.background  = "#ddd";
          sBox.style.borderRadius= "4px";
          sBox.style.marginRight = "4px";
          sBox.style.overflow    = "hidden";

          const fillDiv = document.createElement("div");
          fillDiv.style.position = "absolute";
          fillDiv.style.left     = "0";
          fillDiv.style.bottom   = "0";
          fillDiv.style.width    = "100%";
          fillDiv.style.height   = fillPct + "%";
          fillDiv.style.background = "#007aff";

          const labelSpan = document.createElement("span");
          labelSpan.style.position   = "relative";
          labelSpan.style.zIndex     = "2";
          labelSpan.style.display    = "inline-block";
          labelSpan.style.width      = "100%";
          labelSpan.style.textAlign  = "center";
          labelSpan.style.fontWeight = "bold";
          labelSpan.style.fontSize   = "12px";
          labelSpan.style.lineHeight = "38px";
          labelSpan.style.color      = "#333";
          labelSpan.textContent      = sv.toFixed(0) + "%";

          sBox.appendChild(fillDiv);
          sBox.appendChild(labelSpan);
          if (dateArray[idx3]) {
            sBox.title = dateArray[idx3];
          }
          shareRowDiv.appendChild(sBox);
        });

        histContainer.appendChild(rankRowDiv);
        histContainer.appendChild(shareRowDiv);
        tdHist.appendChild(histContainer);

        tr.appendChild(tdHist);
        tbody.appendChild(tr);
      });
    });
  });

  wrapper.appendChild(table);

  // 7) Insert into #locList
  const locListContainer = document.querySelector("#projectPage #locList");
  if (locListContainer) {
    locListContainer.innerHTML = "";
    locListContainer.appendChild(wrapper);
  }

  // 8) Add the toggle for rank/ share
  const historyToggle = table.querySelector("#historyToggle");
  if (historyToggle) {
    historyToggle.addEventListener("change", function() {
      const showShare = this.checked;
      const allRankRows  = table.querySelectorAll(".rank-row-div");
      const allShareRows = table.querySelectorAll(".share-row-div");
      if (showShare) {
        allRankRows.forEach(div => { div.style.display = "none"; });
        allShareRows.forEach(div => { div.style.display = "inline-block"; });
      } else {
        allRankRows.forEach(div => { div.style.display = "inline-block"; });
        allShareRows.forEach(div => { div.style.display = "none"; });
      }
    });
  }

  console.log(`[rebuildProjectTableByState] => built table with ${results.length} rows for "${stateName}".`);
}
  
  function showAllHomeTableRows() {
  const table = document.querySelector("#homePage .home-table");
  if (!table) return;
  table.querySelectorAll("tbody tr").forEach(row => {
    row.style.display = "";
  });
}

function showAllProjectTableRows() {
  const table = document.querySelector("#projectPage .project-table");
  if (!table) return;
  table.querySelectorAll("tbody tr").forEach(row => {
    row.style.display = "";
  });
}

})();
