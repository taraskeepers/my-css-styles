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
  // IMPORTANT: We do NOT skip rows if shareVal is null. We want to preserve rank data.
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const arr = [];
    project.searches.forEach(s => {
      if (!s.location || !s.device) return;  // skip only if these are missing
      arr.push({
        locName: s.location.trim().toLowerCase().replace(/,\s*/g, ','),
        device: s.device,
        shareVal: s.shareVal != null ? parseFloat(s.shareVal) : 0,
        // ***** FIX: Use computedAvgRank if available, otherwise fallback to avgRank *****
        avgRank: s.computedAvgRank != null ? parseFloat(s.computedAvgRank) : (s.avgRank != null ? parseFloat(s.avgRank) : 0),
        rankChange: s.rankChange != null ? parseFloat(s.rankChange) : 0
      });
    });
    return arr;
  }

  // Helper: return a class for rank value matching the "rank-box" styling in the embed element.
  function getRankClass(rankVal) {
    const r = parseFloat(rankVal);
    if (isNaN(r) || r <= 0) return "";
    if (r === 1) return "range-green";
    if (r <= 3)  return "range-yellow";
    if (r <= 5)  return "range-orange";
    return "range-red";
  }

  // ---------- (E) Build state-based share data so we can color each state by combined share ----------
  //   Just like the old code, except no toggle references.
  function buildStateShareMap(dataRows) {
    // stateShareMap[postal] = { desktopSum, desktopCount, mobileSum, mobileCount }
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
        stateShareMap[stPostal] = {
          desktopSum: 0, desktopCount: 0,
          mobileSum: 0,  mobileCount: 0
        };
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

  // Compute average share (both desktop & mobile) for color fill
  function computeCombinedShare(stData) {
    if (!stData) return 0;
    let sum = 0, count = 0;
    if (stData.desktopCount > 0) {
      sum += (stData.desktopSum / stData.desktopCount);
      count++;
    }
    if (stData.mobileCount > 0) {
      sum += (stData.mobileSum / stData.mobileCount);
      count++;
    }
    return (count === 0) ? 0 : (sum / count);
  }

  // ---------- (F) Draw US map with location pies, color states by share, show rank in boxes ----------
  async function drawUsMapWithLocations(project, containerSelector) {
    // 1) Clear old
    const container = d3.select(containerSelector).html("");

    // 2) <div> for the map
    const mapDiv = container.append("div")
      .style("position", "relative");

    // 3) Load US topo
    let usTopo;
    try {
      usTopo = await getUSMapData();
    } catch (err) {
      console.error("[mapsLib] US topo load error:", err);
      return;
    }
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 4) Build data
    const dataRows = buildLocationDeviceData(project);
    const stateShareMap = buildStateShareMap(dataRows);

    // 5) <svg>
    const baseWidth = 975;      // match old version's sizing
    const baseHeight = 610;
    const svg = mapDiv.append("svg")
      .attr("viewBox", `0 0 ${baseWidth} ${baseHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .attr("width", baseWidth + "px")
      .style("max-height", "600px")
      .style("display", "block")
      .style("margin", "0 auto")
      .style("background-color", "transparent");

    const path = d3.geoPath();

    // 5B) Color scale
    //    We'll find the max combined share across states
    let maxShare = 0;
    Object.values(stateShareMap).forEach(stData => {
      const c = computeCombinedShare(stData);
      if (c > maxShare) maxShare = c;
    });
    const colorScale = d3.scaleSequential()
      .domain([0, maxShare || 1])
      .interpolator(d3.interpolateBlues);

    // 6) Draw states
    const statesSelection = svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("stroke", "#999")
.attr("fill", d => {
  const stPostal = FIPS_TO_POSTAL[d.id] || null;
  // Use extra light blue (#f5fcff) for inactive states (twice lighter than before)
  if (!stPostal || !stateShareMap[stPostal]) return "#f5fcff";
  const combinedShare = computeCombinedShare(stateShareMap[stPostal]);
  if (combinedShare <= 0) return "#f5fcff";
  return colorScale(combinedShare);
})
      .attr("d", path);

    // 7) Group location rows so we can plot device pies
    const locMap = new Map();
    dataRows.forEach(r => {
      if (!locMap.has(r.locName)) {
        locMap.set(r.locName, []);
      }
      locMap.get(r.locName).push(r);
    });

    // 8) Use the same old AlbersUSA projection => dots align
    const projection = d3.geoAlbersUsa()
      .scale(1300)
      .translate([487.5, 305]); // match old code

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

    // 9) Dots + Pies
    const dotsLayer = svg.append("g").attr("class", "dots-layer");
    const piesLayer = svg.append("g").attr("class", "pies-layer");

    // Dot for each location
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

    // 9B) location groups
    const locationGroups = piesLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter()
      .append("g")
      .attr("class", "loc-group")
      .attr("transform", d => {
        // horizontally offset so dot is visible
        const offsetX = d.x < (baseWidth / 2) ? 40 : -40;
        return `translate(${d.x + offsetX}, ${d.y - 10})`;
      });

    // Pie generator
    const arcGen = d3.arc().outerRadius(25).innerRadius(0);
    const pieGen = d3.pie().sort(null).value(v => v);

    // Draw a single device pie + rank box
    function drawPie(gSel, deviceData, yOffset) {
      if (!deviceData) return;
      const shareVal = parseFloat(deviceData.shareVal) || 0;
      // Here we use the computed avgRank (as set in buildLocationDeviceData)
      const rawRank = deviceData.avgRank != null ? parseFloat(deviceData.avgRank) : 0;
      const rankVal = rawRank.toFixed(1);

      // slices => [ shareVal, 100 - shareVal ]
      const pieData = [shareVal, Math.max(0, 100 - shareVal)];
      const arcs = pieGen(pieData);

      const pieG = gSel.append("g")
        .attr("transform", `translate(0, ${yOffset})`);

// Replace your current rank box foreignObject block with this revised snippet:
pieG.append("foreignObject")
  .attr("x", -(25 + 10 + 38))  // adjust x-offset for a 38px box
  .attr("y", -19)             // vertical offset = half of 38px (rounded)
  .attr("width", 38)
  .attr("height", 38)
  .html(`
    <div style="
      width:38px;
      height:38px;
      font-size:12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background:#f0f0f0;
      color:#333;
      border-radius:4px;
      box-shadow:none;
      text-align:center;
      display:flex;
      align-items:center;
      justify-content:center;
      ">
      ${rankVal}
    </div>
  `);

      // 2) Pie arcs for share
      pieG.selectAll("path.arc")
        .data(arcs)
        .enter()
        .append("path")
        .attr("class", "arc")
        .attr("d", arcGen)
        .attr("fill", (dd, i) => i === 0 ? colorForDevice(deviceData.device) : "#ccc")
        .attr("stroke", "#fff")
        .attr("stroke-width", 0.5);

      // 3) Center text for shareVal
      pieG.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "0.4em")
        .style("font-size", "14px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("font-family", "Helvetica, Arial, sans-serif")
        .text(shareVal.toFixed(1) + "%");
    }

    locationGroups.each(function(d) {
      const parentG = d3.select(this);
      let yOff = 0;

      // If you only have Desktop + Mobile, we do them in vertical stack
      const desktop = d.devices.find(item => item.device.toLowerCase().includes("desktop"));
      if (desktop) {
        drawPie(parentG, desktop, yOff);
        yOff += 60;
      }
      const mobile = d.devices.find(item => item.device.toLowerCase().includes("mobile"));
      if (mobile) {
        drawPie(parentG, mobile, yOff);
      }
    });
  }

  // ---------- (G) Canada, UK, Australia (same as old code) ----------
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
  window.mapHelpers = {
    drawUsMapWithLocations,
    drawCanadaMapWithLocations,
    drawUKMapWithLocations,
    drawAustraliaMapWithLocations
  };
})();
