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

  // ---------- (C) Color for device slices ----------
  function colorForDevice(deviceName) {
    const d = (deviceName || "").toLowerCase();
    if (d.includes("desktop")) return "#007aff"; // blue
    if (d.includes("mobile"))  return "#f44336"; // red
    return "#888";
  }

  // ---------- (D) Build location–device array ----------
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const arr = [];
    project.searches.forEach(s => {
      if (!s.location || !s.device) return;  // skip if missing
      arr.push({
        locName: s.location.trim().toLowerCase().replace(/,\s*/g, ','),
        device: s.device,
        shareVal: s.shareVal != null ? parseFloat(s.shareVal) : 0,
        avgRank: s.computedAvgRank != null
          ? parseFloat(s.computedAvgRank)
          : (s.avgRank != null ? parseFloat(s.avgRank) : 0),
        rankChange: s.rankChange != null ? parseFloat(s.rankChange) : 0,
        hideRank:  !!s.hideRank,
        hideShare: !!s.hideShare
      });
    });
    return arr;
  }

  // ---------- (E) Build aggregator with share + rank for each device ----------
  //   stateStats[stPostal] = {
  //     desktopShareSum, desktopShareCount, desktopRankSum, desktopRankCount,
  //     mobileShareSum,  mobileShareCount,  mobileRankSum,  mobileRankCount
  //   }
  // We’ll also store .combinedShare => average of desktop + mobile means
  function buildStateStats(dataRows) {
    const stateStats = {};
    if (!window.cityLookup) {
      console.warn("[mapsLib] cityLookup is missing, skipping stateStats aggregator.");
      return stateStats;
    }

    dataRows.forEach(row => {
      const cityObj = window.cityLookup.get(row.locName);
      if (!cityObj || !cityObj.state_id) return;
      const st = cityObj.state_id;
      if (!stateStats[st]) {
        stateStats[st] = {
          desktopShareSum: 0, desktopShareCount: 0, desktopRankSum: 0, desktopRankCount: 0,
          mobileShareSum:  0, mobileShareCount:  0, mobileRankSum:  0, mobileRankCount:  0
        };
      }
      const dev = row.device.toLowerCase();
      if (dev.includes("desktop")) {
        stateStats[st].desktopShareSum += row.shareVal;
        stateStats[st].desktopShareCount++;
        if (row.avgRank > 0) {
          stateStats[st].desktopRankSum += row.avgRank;
          stateStats[st].desktopRankCount++;
        }
      } else if (dev.includes("mobile")) {
        stateStats[st].mobileShareSum += row.shareVal;
        stateStats[st].mobileShareCount++;
        if (row.avgRank > 0) {
          stateStats[st].mobileRankSum += row.avgRank;
          stateStats[st].mobileRankCount++;
        }
      }
    });

    // Then store derived averages for convenience
    Object.keys(stateStats).forEach(st => {
      const obj = stateStats[st];
      const dShare = (obj.desktopShareCount > 0) ? (obj.desktopShareSum / obj.desktopShareCount) : 0;
      const mShare = (obj.mobileShareCount  > 0) ? (obj.mobileShareSum  / obj.mobileShareCount)  : 0;
      obj.desktopAvgShare = dShare;
      obj.mobileAvgShare  = mShare;

      const dRank = (obj.desktopRankCount>0) ? (obj.desktopRankSum / obj.desktopRankCount) : 0;
      const mRank = (obj.mobileRankCount >0) ? (obj.mobileRankSum / obj.mobileRankCount)   : 0;
      obj.desktopAvgRank = dRank;
      obj.mobileAvgRank  = mRank;

      // For coloring + center label => combine the average shares
      let sum=0, c=0;
      if (dShare>0) { sum += dShare; c++; }
      if (mShare>0) { sum += mShare; c++; }
      obj.combinedShare = (c>0) ? (sum/c) : 0;
    });

    return stateStats;
  }

  // ---------- (F) The main “draw US map” function ----------
  async function drawUsMapWithLocations(project, containerSelector) {
    // Clear old content
    const container = d3.select(containerSelector).html("");

    // A wrapper <div> for the map (position:relative)
    const mapDiv = container.append("div")
      .style("position", "relative");

    // 1) Read toggles from DOM => set hideRank/hideShare in project.searches
    const desktopShare = document.getElementById("toggleDesktopShare")?.checked;
    const desktopRank  = document.getElementById("toggleDesktopRank")?.checked;
    const mobileShare  = document.getElementById("toggleMobileShare")?.checked;
    const mobileRank   = document.getElementById("toggleMobileRank")?.checked;
    project.searches.forEach(s => {
      const dev = (s.device||"").toLowerCase();
      if (dev.includes("desktop")) {
        s.hideShare = !desktopShare;
        s.hideRank  = !desktopRank;
      } else if (dev.includes("mobile")) {
        s.hideShare = !mobileShare;
        s.hideRank  = !mobileRank;
      }
    });

    // 2) Fetch the US topo
    let usTopo;
    try {
      usTopo = await getUSMapData();
    } catch (err) {
      console.error("[mapsLib] US topo load error:", err);
      return;
    }
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 3) Build data arrays
    const dataRows = buildLocationDeviceData(project);
    const stStats  = buildStateStats(dataRows);

    // 4) Prepare the <svg>
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

    // 5) Color scale for combined share
    let maxShare = 0;
    Object.values(stStats).forEach(obj => {
      if (obj.combinedShare>maxShare) maxShare = obj.combinedShare;
    });
    const colorScale = d3.scaleSequential()
      .domain([0, maxShare||1])
      .interpolator(d3.interpolateBlues);

    // 6) Draw the states
    const statesSelection = svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter()
      .append("path")
      .attr("class", "state")
      .attr("stroke", "#999")
      .attr("fill", d => {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (!stPostal || !stStats[stPostal]) {
          // No data => a light color
          return "#f5fcff";
        }
        const val = stStats[stPostal].combinedShare;
        if (val <= 0) return "#f5fcff";
        return colorScale(val);
      })
      .attr("d", path);

    // 6B) Add a text label at each state centroid for combined share
    svg.selectAll("text.state-label")
      .data(statesGeo.features)
      .enter()
      .append("text")
      .attr("class", "state-label")
      .attr("x", d => path.centroid(d)[0])
      .attr("y", d => path.centroid(d)[1])
      .attr("text-anchor", "middle")
      .attr("fill", "#fff")
      .style("font-size","14px")
      .style("font-weight","600")
      .style("pointer-events","none") // text doesn’t block hover
      .text(d => {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (!stPostal || !stStats[stPostal]) return "";
        const val = stStats[stPostal].combinedShare;
        return (val>0) ? val.toFixed(1)+"%" : "";
      });

    // 7) Apple‑style tooltip for states on hover
    //    We'll attach a single <div> for the tooltip, show/hide it on mouseover/out
    const tooltip = container.append("div")
      .style("position","absolute")
      .style("padding","8px 10px")
      .style("border","1px solid #ddd")
      .style("border-radius","8px")
      .style("box-shadow","0 4px 8px rgba(0,0,0,0.15)")
      .style("background","#fff")
      .style("font-family","-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif")
      .style("font-size","13px")
      .style("color","#333")
      .style("display","none")
      .style("z-index","9999");

    statesSelection
      .on("mouseover", function(event, d) {
        const stPostal = FIPS_TO_POSTAL[d.id] || null;
        if (!stPostal || !stStats[stPostal]) {
          tooltip.style("display","none");
          return;
        }
        const obj = stStats[stPostal];

        // Build a small HTML snippet for desktop & mobile if present
        const deskShare = obj.desktopAvgShare>0 ? obj.desktopAvgShare.toFixed(1)+"%" : "N/A";
        const deskRank  = obj.desktopAvgRank>0  ? obj.desktopAvgRank.toFixed(1)      : "N/A";
        const mobShare  = obj.mobileAvgShare>0  ? obj.mobileAvgShare.toFixed(1)+"%"  : "N/A";
        const mobRank   = obj.mobileAvgRank>0   ? obj.mobileAvgRank.toFixed(1)       : "N/A";

        // We can do a small table or just lines:
        const html = `
          <div style="margin-bottom:4px; font-weight:bold; font-size:14px;">
            ${stPostal} – ${obj.combinedShare.toFixed(1)}%
          </div>
          <div style="margin-bottom:4px;">
            <strong>Desktop</strong><br>
            Rank: ${deskRank}<br>
            Share: ${deskShare}
          </div>
          <div>
            <strong>Mobile</strong><br>
            Rank: ${mobRank}<br>
            Share: ${mobShare}
          </div>
        `;

        tooltip.html(html)
          .style("display","block");
      })
      .on("mousemove", function(event) {
        // Position tooltip near mouse
        const offsetX = 12, offsetY = 12;
        tooltip
          .style("left", (event.pageX + offsetX)+"px")
          .style("top",  (event.pageY + offsetY)+"px");
      })
      .on("mouseout", function() {
        tooltip.style("display","none");
      });

    // 8) Build location device data => city pies
    const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
    const locMap = new Map();
    dataRows.forEach(r => {
      if (!locMap.has(r.locName)) locMap.set(r.locName, []);
      locMap.get(r.locName).push(r);
    });

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

    const dotsLayer = svg.append("g").attr("class", "dots-layer");
    const piesLayer = svg.append("g").attr("class", "pies-layer");

    // Dot for each city
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

    // Groups for pies
    const locationGroups = piesLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter()
      .append("g")
      .attr("class", "loc-group")
      .attr("transform", d => {
        const offsetX = d.x < (baseWidth / 2) ? 40 : -40;
        let groupHeight = 0;
        if (d.devices.some(it=>it.device.toLowerCase().includes("desktop"))) {
          groupHeight += 60;
        }
        if (d.devices.some(it=>it.device.toLowerCase().includes("mobile"))) {
          groupHeight += 60;
        }
        if (groupHeight===0) groupHeight=60;
        let newY = d.y - groupHeight/2;
        newY = Math.max(0, Math.min(newY, baseHeight-groupHeight));
        return `translate(${d.x + offsetX},${newY})`;
      });

    const arcGen = d3.arc().outerRadius(25).innerRadius(0);
    const pieGen = d3.pie().sort(null).value(v=>v);

    function drawPie(gSel, deviceData, yOffset) {
      // skip if both toggles are off
      if (deviceData.hideRank && deviceData.hideShare) {
        return;
      }
      if (!deviceData) return;

      const shareVal = parseFloat(deviceData.shareVal)||0;
      const displayShareVal = deviceData.hideShare? 0 : shareVal;
      const rawRank = deviceData.avgRank>0 ? deviceData.avgRank : 0;
      const rankVal = rawRank.toFixed(1);

      const pieData = [displayShareVal, Math.max(0,100-displayShareVal)];
      const arcs= pieGen(pieData);

      const pieG = gSel.append("g")
        .attr("data-device", deviceData.device.toLowerCase())
        .attr("transform",`translate(0,${yOffset})`);

      // rank box if toggle on
      if (!deviceData.hideRank) {
        const rankG = pieG.append("g").attr("class","rank-box-group");
        let bgColor="#ffcfcf";
        if (rawRank<2)      bgColor="#dfffd6";
        else if (rawRank<4) bgColor="#fffac2";
        else if (rawRank<6) bgColor="#ffe0bd";

        rankG.append("foreignObject")
          .attr("class","rank-box")
          .attr("width",38).attr("height",38)
          .attr("x",-(25+10+38)).attr("y",-19)
          .html(`
            <div style="
              width: 38px; height:38px;
              display:flex; align-items:center; justify-content:center;
              font-size:18px; font-weight:bold;
              font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background:${bgColor}; color:#333; border-radius:4px;">
              ${rankVal}
            </div>
          `);
      }

      if (!deviceData.hideShare) {
        const shareG= pieG.append("g").attr("class","share-pie-group");
        shareG.selectAll("path.arc")
          .data(arcs).enter()
          .append("path")
          .attr("class","arc")
          .attr("d",arcGen)
          .attr("fill",(dd,i)=> i===0? colorForDevice(deviceData.device):"#ccc")
          .attr("stroke","#fff")
          .attr("stroke-width",0.5);

        shareG.append("text")
          .attr("text-anchor","middle")
          .attr("dy","0.4em")
          .style("font-size","14px")
          .style("font-weight","bold")
          .style("fill","#333")
          .style("font-family","Helvetica, Arial, sans-serif")
          .text(displayShareVal.toFixed(1)+"%");
      }
    }

    locationGroups.each(function(d){
      const parentG = d3.select(this);
      let yOff=30;
      const desktop= d.devices.find(it=> it.device.toLowerCase().includes("desktop"));
      if(desktop){ drawPie(parentG, desktop, yOff); yOff+=60; }
      const mobile= d.devices.find(it=> it.device.toLowerCase().includes("mobile"));
      if(mobile){ drawPie(parentG, mobile, yOff); }
    });
  }

  // ---------- (G) Canada, UK, Australia: mostly unchanged ----------
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
    Object.values(provinceCounts).forEach((v) => { if (v>maxCount) maxCount=v; });
    const colorScale = d3.scaleSequential()
      .domain([0, maxCount||1])
      .interpolator(d3.interpolateBlues);

    const width=600, height=500;
    const svg = container.append("svg")
      .attr("viewBox",`0 0 ${width} ${height}`)
      .style("width","100%")
      .style("height","auto")
      .style("background","transparent");

    const projection = d3.geoMercator().fitSize([width,height], provincesGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.province")
      .data(provincesGeo.features)
      .enter()
      .append("path")
      .attr("class","province")
      .attr("d",path)
      .attr("fill", d=>{
        const code= d.properties.CODE;
        const shortCode= mapProvinceCode(code);
        const c= provinceCounts[shortCode]||0;
        return colorScale(c);
      })
      .attr("stroke","#999");

    const activeCityObjs= collectActiveCitiesForProject(project);
    activeCityObjs.forEach(city=>{
      const coords= projection([city.lng, city.lat]);
      if(!coords) return;
      svg.append("circle")
        .attr("cx",coords[0])
        .attr("cy",coords[1])
        .attr("r",5)
        .attr("fill","red")
        .attr("stroke","#fff")
        .attr("stroke-width",1);
    });
  }

  async function drawUKMapWithLocations(project, containerSelector) {
    const container = d3.select(containerSelector);
    container.selectAll("*").remove();

    let ukTopo;
    try {
      ukTopo= await getUKMapData();
    } catch(err) {
      console.error("[mapsLib] UK topo load error:",err);
      return;
    }

    const ukGeo= topojson.feature(ukTopo, ukTopo.objects.eer);
    const regionCounts={};
    (project.searches||[]).forEach(search=>{
      if((search.status||"").toLowerCase()!=="active") return;
      const locArr= Array.isArray(search.location)? search.location : search.location?[search.location]:[];
      locArr.forEach(locStr=>{
        const canon= locStr.trim().toLowerCase();
        if(window.cityLookup && window.cityLookup.has(canon)) {
          const cityObj= window.cityLookup.get(canon);
          const rn= (cityObj.regionName||"").trim();
          if(!regionCounts[rn]) regionCounts[rn]=0;
          regionCounts[rn]++;
        }
      });
    });

    let maxCount=0;
    Object.values(regionCounts).forEach(v=>{ if(v>maxCount) maxCount=v; });
    const colorScale= d3.scaleSequential()
      .domain([0, maxCount||1])
      .interpolator(d3.interpolateBlues);

    const width=600, height=500;
    const svg= container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("width","100%")
      .style("height","auto")
      .style("background","transparent");

    const projection= d3.geoMercator().fitSize([width,height], ukGeo);
    const path= d3.geoPath().projection(projection);

    svg.selectAll("path.uk-region")
      .data(ukGeo.features)
      .enter()
      .append("path")
      .attr("class","uk-region")
      .attr("d",path)
      .attr("stroke","#999")
      .attr("fill", d=>{
        const regionName= d.properties.EER13NM||"";
        const c= regionCounts[regionName]||0;
        return colorScale(c);
      });

    const activeCityObjs= collectActiveCitiesForProject(project);
    activeCityObjs.forEach(city=>{
      const coords= projection([city.lng, city.lat]);
      if(!coords) return;
      svg.append("circle")
        .attr("cx",coords[0])
        .attr("cy",coords[1])
        .attr("r",5)
        .attr("fill","red")
        .attr("stroke","#fff")
        .attr("stroke-width",1);
    });
  }

  async function drawAustraliaMapWithLocations(project, containerSelector) {
    const container= d3.select(containerSelector);
    container.selectAll("*").remove();

    let auTopo;
    try {
      auTopo= await getAustraliaMapData();
    } catch(err) {
      console.error("[mapsLib] Australia fetch error:",err);
      return;
    }

    const australiaGeo= topojson.feature(auTopo, auTopo.objects.austates);
    const regionCounts={};
    (project.searches||[]).forEach(search=>{
      if((search.status||"").toLowerCase()!=="active") return;
      const locArr= Array.isArray(search.location)? search.location: search.location?[search.location]:[];
      locArr.forEach(locStr=>{
        const canon= locStr.trim().toLowerCase();
        if(window.cityLookup && window.cityLookup.has(canon)) {
          const cityObj= window.cityLookup.get(canon);
          const rid= cityObj.regionId;
          if(typeof rid==="number" && rid>=0) {
            if(!regionCounts[rid]) regionCounts[rid]=0;
            regionCounts[rid]++;
          }
        }
      });
    });

    let maxCount=0;
    Object.values(regionCounts).forEach(v=>{ if(v>maxCount) maxCount=v; });
    const colorScale= d3.scaleSequential()
      .domain([0, maxCount||1])
      .interpolator(d3.interpolateBlues);

    const width=700, height=600;
    const svg= container.append("svg")
      .attr("viewBox",`0 0 ${width} ${height}`)
      .style("width","100%")
      .style("height","auto")
      .style("background","transparent");

    const projection= d3.geoMercator().fitSize([width,height], australiaGeo);
    const path= d3.geoPath().projection(projection);

    svg.selectAll("path.au-state")
      .data(australiaGeo.features)
      .enter()
      .append("path")
      .attr("class","au-state")
      .attr("d",path)
      .attr("stroke","#999")
      .attr("fill", d=>{
        const regionId=d.id;
        const c= regionCounts[regionId]||0;
        return colorScale(c);
      });

    const activeCityObjs= collectActiveCitiesForProject(project);
    activeCityObjs.forEach(city=>{
      const coords= projection([city.lng, city.lat]);
      if(!coords) return;
      svg.append("circle")
        .attr("cx",coords[0])
        .attr("cy",coords[1])
        .attr("r",5)
        .attr("fill","red")
        .attr("stroke","#fff")
        .attr("stroke-width",1);
    });
  }

  // Expose as mapHelpers
  window.mapHelpers = {
    drawUsMapWithLocations,
    drawCanadaMapWithLocations,
    drawUKMapWithLocations,
    drawAustraliaMapWithLocations
  };
})();
