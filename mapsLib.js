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
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
    "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
    "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
    "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
    "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
    "54":"WV","55":"WI","56":"WY"
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
    // fallback
    return "#888";
  }

  // ---------- (D) Build an array: each item => { locName, device, shareVal } ----------

  // By default, you might store these in project.searches, e.g.:
  // { location: "Chicago,IL,USA", device: "desktop", shareVal: 12.3, status: "active" }
  // If your structure differs, adapt here.
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const arr = [];
    project.searches.forEach(s => {
      if ((s.status || "").toLowerCase() !== "active") return;
      if (!s.location || !s.device || s.shareVal == null) return;
      const locKey = s.location.trim().toLowerCase().replace(/,\s*/g, ',');
      arr.push({
        locName: locKey,
        device:  s.device,
        shareVal: parseFloat(s.shareVal) || 0
      });
    });
    console.log("[DEBUG] buildLocationDeviceData - final dataRows:", arr);
    return arr;
  }

  // ---------- (E) The core US drawing function, with multi-pie logic ----------

  async function drawUsMapWithLocations(project, containerSelector) {
    // 1) Clear old contents
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    // 2) Load US topo
    let usTopo;
    try {
      usTopo = await getUSMapData();
    } catch (err) {
      console.error("[mapsLib] drawUsMapWithLocations: US topo load error:", err);
      return;
    }

    // 3) Convert topo => GeoJSON
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 4) Build the location+device data
    const dataRows = buildLocationDeviceData(project);
    if (!dataRows.length) {
      console.warn("[mapsLib] No location/device data found; drawing plain US map.");
    }

    // 4A) Which states are used:
    const usedStates = new Set();
    if (window.cityLookup) {
      dataRows.forEach(row => {
        const cityObj = window.cityLookup.get(row.locName);
        if (cityObj && cityObj.state_id) {
          usedStates.add(cityObj.state_id);
        }
      });
    }

    // 5) Create an <svg>
    const width = 975, height = 610;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const path = d3.geoPath();

    // 6) Draw each state: lightly fill if used
    svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("d", path)
      .attr("fill", (d) => {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (stPostal && usedStates.has(stPostal)) {
          return "#EAEAEA"; // slightly colored
        }
        return "#FFFFFF";   // or #fafafa for no-locations
      })
      .attr("stroke", "#999");

    // 7) Group dataRows by location => array of { locName, x, y, devices[] }
    const locMap = new Map();
    dataRows.forEach(row => {
      if (!locMap.has(row.locName)) {
        locMap.set(row.locName, []);
      }
      locMap.get(row.locName).push(row);
    });

    // Convert to an array of geometry
    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    const locationData = [];
    locMap.forEach((devicesArr, locKey) => {
      if (!window.cityLookup) return;
      const cityObj = window.cityLookup.get(locKey);
      if (!cityObj) return;
      const coords = projection([cityObj.lng, cityObj.lat]);
      if (!coords) return;
      locationData.push({
        locName: locKey,
        x: coords[0],
        y: coords[1],
        devices: devicesArr // array of { device, shareVal }
      });
    });

    // 8) Create a <g> for all location groups
    const locationLayer = svg.append("g").attr("class", "location-layer");

    const locationGroups = locationLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter()
      .append("g")
      .attr("class", "loc-group")
      .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // 8A) The main dot
    locationGroups.append("circle")
      .attr("r", 4)
      .attr("fill", "#cc0000")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1);

    // 8B) For each device, draw a mini pie => side-by-side
    locationGroups.each(function(d) {
      const parentG = d3.select(this);
      const devArr = d.devices;

      devArr.forEach((devObj, i) => {
        const offsetX = i * 25 - 12;
        const offsetY = -25;
        const pieData = [ devObj.shareVal, 100 - devObj.shareVal ];
        const arcGen = d3.arc().outerRadius(10).innerRadius(0);
        const pieGen = d3.pie().sort(null).value(v => v);
        const arcs = pieGen(pieData);

        const pieGroup = parentG.append("g")
          .attr("class", "mini-pie")
          .attr("transform", `translate(${offsetX}, ${offsetY})`);

        pieGroup.selectAll("path")
          .data(arcs)
          .enter()
          .append("path")
          .attr("d", arcGen)
          .attr("fill", (arcDatum, idx2) => {
            if (idx2 === 0) {
              return colorForDevice(devObj.device);
            }
            return "#ccc";
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5);

        // small label under pie
        pieGroup.append("text")
          .attr("x", 0)
          .attr("y", 18)
          .attr("text-anchor", "middle")
          .attr("font-size", 10)
          .attr("fill", "#333")
          .text(devObj.device);
      });
    });
  }

  // ---------- (F) Canada, UK, Australia (unchanged “bubble” logic) ----------

  // For the older approach, we gather active city objects:
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

    // Convert
    const provincesGeo = topojson.feature(canadaTopo, canadaTopo.objects.provinces);

    // Build provinceCounts
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

    // color scale
    let maxCount = 0;
    Object.values(provinceCounts).forEach((v) => { if (v > maxCount) maxCount = v; });
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount || 1])
      .interpolator(d3.interpolateBlues);

    // svg
    const width = 600, height = 500;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const projection = d3.geoMercator().fitSize([width, height], provincesGeo);
    const path = d3.geoPath().projection(projection);

    // draw provinces
    svg.selectAll("path.province")
      .data(provincesGeo.features)
      .enter()
      .append("path")
      .attr("class", "province")
      .attr("d", path)
      .attr("fill", (d) => {
        const code = d.properties.CODE; // e.g. "CA08"
        const shortCode = mapProvinceCode(code); // e.g. "ON"
        const c = provinceCounts[shortCode] || 0;
        return colorScale(c);
      })
      .attr("stroke", "#999");

    // big “bubble” per province
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

    // bubble label
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

    // city “dots”
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


  /****************************************************
   * drawUKMapWithLocations(project, containerSelector)
   ****************************************************/
  async function drawUKMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    // load
    let ukTopo;
    try {
      ukTopo = await getUKMapData();
    } catch (err) {
      console.error("[mapsLib] UK topo load error:", err);
      return;
    }

    // convert => geo
    // The user’s sample used `ukTopo.objects.eer` (regional partitions)
    const ukGeo = topojson.feature(ukTopo, ukTopo.objects.eer);

    // regionCounts => how many searches in each regionName
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

    // draw
    svg.selectAll("path.uk-region")
      .data(ukGeo.features)
      .enter()
      .append("path")
      .attr("class", "uk-region")
      .attr("d", path)
      .attr("stroke", "#999")
      .attr("fill", (d) => {
        // In the user’s example: d.properties.EER13NM is the region’s name
        const regionName = d.properties.EER13NM || "";
        const c = regionCounts[regionName] || 0;
        return colorScale(c);
      });

    // city “dots”
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


  /**********************************************************
   * drawAustraliaMapWithLocations(project, containerSelector)
   **********************************************************/
  async function drawAustraliaMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    let auTopo;
    try {
      auTopo = await getAustraliaMapData();
    } catch (err) {
      console.error("[mapsLib] Australia topo load error:", err);
      return;
    }

    const australiaGeo = topojson.feature(auTopo, auTopo.objects.austates);

    // regionCounts => how many in each “state id”
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

    // build svg
    const width = 700, height = 600;
    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width", "100%")
      .style("height", "auto")
      .style("background-color", "transparent");

    const projection = d3.geoMercator().fitSize([width, height], australiaGeo);
    const path = d3.geoPath().projection(projection);

    // fill
    svg.selectAll("path.au-state")
      .data(australiaGeo.features)
      .enter()
      .append("path")
      .attr("class", "au-state")
      .attr("d", path)
      .attr("stroke", "#999")
      .attr("fill", (d) => {
        const regionId = d.id; // e.g. 0..7
        const c = regionCounts[regionId] || 0;
        return colorScale(c);
      });

    // “bubbles” for each region
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

    // city “dots”
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

  // ----- (E) Expose the methods -----
  window.mapHelpers = {
    drawUsMapWithLocations,
    drawCanadaMapWithLocations,
    drawUKMapWithLocations,
    drawAustraliaMapWithLocations
  };

})(); // end IIFE
