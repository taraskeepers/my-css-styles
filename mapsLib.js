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

  const FIPS_TO_POSTAL = {
    "01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
    "11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA",
    "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN",
    "28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM",
    "36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI",
    "45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA",
    "54":"WV","55":"WI","56":"WY"
  };

  const POSTAL_TO_STATE_NAME = {
    AL:"Alabama",AK:"Alaska",AZ:"Arizona",AR:"Arkansas",CA:"California",CO:"Colorado",
    CT:"Connecticut",DE:"Delaware",DC:"District of Columbia",FL:"Florida",GA:"Georgia",
    HI:"Hawaii",ID:"Idaho",IL:"Illinois",IN:"Indiana",IA:"Iowa",KS:"Kansas",KY:"Kentucky",
    LA:"Louisiana",ME:"Maine",MD:"Maryland",MA:"Massachusetts",MI:"Michigan",MN:"Minnesota",
    MS:"Mississippi",MO:"Missouri",MT:"Montana",NE:"Nebraska",NV:"Nevada",NH:"New Hampshire",
    NJ:"New Jersey",NM:"New Mexico",NY:"New York",NC:"North Carolina",ND:"North Dakota",
    OH:"Ohio",OK:"Oklahoma",OR:"Oregon",PA:"Pennsylvania",RI:"Rhode Island",SC:"South Carolina",
    SD:"South Dakota",TN:"Tennessee",TX:"Texas",UT:"Utah",VT:"Vermont",VA:"Virginia",
    WA:"Washington",WV:"West Virginia",WI:"Wisconsin",WY:"Wyoming"
  };

  const PROVINCE_CODE_MAP = {
    "CA01":"AB","CA02":"BC","CA03":"MB","CA04":"NB","CA05":"NL","CA06":"NT","CA07":"NS",
    "CA08":"ON","CA09":"PE","CA10":"QC","CA11":"SK","CA12":"YT","CA13":"NU"
  };
  function mapProvinceCode(code) {
    return PROVINCE_CODE_MAP[code] || code;
  }

  const AUSTATE_ID_TO_NAME = {
    0:"New South Wales",1:"Victoria",2:"Queensland",3:"South Australia",
    4:"Western Australia",5:"Tasmania",6:"Northern Territory",7:"Australian Capital Territory"
  };

  // ---------- (B) Fetch TopoJSON ----------
  async function getUSMapData() {
    if (usTopoCache) return usTopoCache;
    const resp = await fetch(US_JSON_URL);
    if (!resp.ok) throw new Error("US TopoJSON fetch failed: " + resp.status);
    return (usTopoCache = await resp.json());
  }
  async function getCanadaMapData() {
    if (canadaTopoCache) return canadaTopoCache;
    const resp = await fetch(CA_JSON_URL);
    if (!resp.ok) throw new Error("Canada TopoJSON fetch failed: " + resp.status);
    return (canadaTopoCache = await resp.json());
  }
  async function getUKMapData() {
    if (ukTopoCache) return ukTopoCache;
    const resp = await fetch(UK_JSON_URL);
    if (!resp.ok) throw new Error("UK TopoJSON fetch failed: " + resp.status);
    return (ukTopoCache = await resp.json());
  }
  async function getAustraliaMapData() {
    if (australiaTopoCache) return australiaTopoCache;
    const resp = await fetch(AU_JSON_URL);
    if (!resp.ok) throw new Error("Australia TopoJSON fetch failed: " + resp.status);
    return (australiaTopoCache = await resp.json());
  }

  // ---------- (C) Color utility ----------
  function colorForDevice(name) {
    name = (name||"").toLowerCase();
    if (name.includes("desktop")) return "#007aff";
    if (name.includes("mobile"))  return "#f44336";
    return "#888";
  }

  // ---------- (D) Build location/device data ----------
  function buildLocationDeviceData(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    const out = [];
    project.searches.forEach(s => {
      if (!s.location || !s.device) return;
      out.push({
        locName: s.location.trim().toLowerCase().replace(/,\s*/g, ','),
        device:  s.device,
        shareVal:s.shareVal!=null?parseFloat(s.shareVal):0,
        avgRank: s.computedAvgRank!=null?parseFloat(s.computedAvgRank):
                 (s.avgRank!=null?parseFloat(s.avgRank):0),
        hideRank: s.hideRank||false,
        hideShare:s.hideShare||false
      });
    });
    return out;
  }

  // ---------- (E) State share map ----------
  function buildStateShareMap(rows) {
    const map = {};
    if (!window.cityLookup) return map;
    rows.forEach(r => {
      const city = window.cityLookup.get(r.locName);
      if (!city || !city.state_id) return;
      const st = city.state_id;
      if (!map[st]) map[st] = { desktopSum:0,desktopCount:0,mobileSum:0,mobileCount:0 };
      const d = r.device.toLowerCase();
      if (d.includes("desktop")) {
        map[st].desktopSum += r.shareVal;
        map[st].desktopCount++;
      } else if (d.includes("mobile")) {
        map[st].mobileSum += r.shareVal;
        map[st].mobileCount++;
      }
    });
    return map;
  }
  function computeCombinedShare(d) {
    if (!d) return 0;
    let sum=0,c=0;
    if (d.desktopCount>0){sum+=d.desktopSum/d.desktopCount;c++;}
    if (d.mobileCount>0){sum+=d.mobileSum/d.mobileCount;c++;}
    return c?sum/c:0;
  }

  // ---------- (F) Draw US map + click/tag/filter ----------
  async function drawUsMapWithLocations(project, sel) {
    // 1) Clear old
    const container = d3.select(sel).html("");
    const mapDiv = container.append("div").style("position","relative");

    // 2) Tag container aligned left
    const tagContainer = container.append("div")
      .attr("id","stateFilterTag")
      .style("margin-top","10px")
      .style("text-align","left");

    // 3) Apply toggles
    const ds = document.getElementById("toggleDesktopShare")?.checked;
    const dr = document.getElementById("toggleDesktopRank")?.checked;
    const ms = document.getElementById("toggleMobileShare")?.checked;
    const mr = document.getElementById("toggleMobileRank")?.checked;
    project.searches.forEach(s=>{
      if (s.device.toLowerCase().includes("desktop")) {
        s.hideShare = !ds; s.hideRank = !dr;
      } else {
        s.hideShare = !ms; s.hideRank = !mr;
      }
    });

    // 4) Load TopoJSON
    let usTopo;
    try { usTopo = await getUSMapData(); }
    catch(e){ console.error(e); return; }
    const statesGeo = topojson.feature(usTopo, usTopo.objects.states);

    // 5) Build data
    const dataRows = buildLocationDeviceData(project);
    const stateShareMap = buildStateShareMap(dataRows);

    // 6) SVG
    const W=975,H=610;
    const svg = mapDiv.append("svg")
      .attr("viewBox",`0 0 ${W} ${H}`)
      .attr("preserveAspectRatio","xMidYMid meet")
      .attr("width",W+"px")
      .style("max-height","600px")
      .style("display","block")
      .style("margin","0 auto")
      .style("background-color","transparent");
    const pathGen = d3.geoPath();

    // 7) Color scale
    let maxS=0;
    Object.values(stateShareMap).forEach(d=>{
      const c = computeCombinedShare(d);
      if (c>maxS) maxS=c;
    });
    const colorScale = d3.scaleSequential()
      .domain([0,maxS||1])
      .interpolator(d3.interpolateBlues);

    // 8) Draw states
    const statesSel = svg.selectAll("path.state")
      .data(statesGeo.features)
      .enter().append("path")
      .attr("class","state")
      .attr("stroke","#999")
      .attr("fill",d=>{
        const p = FIPS_TO_POSTAL[d.id];
        if (!p||!stateShareMap[p]) return "#f5fcff";
        const c = computeCombinedShare(stateShareMap[p]);
        return c<=0?"#f5fcff":colorScale(c);
      })
      .attr("d",pathGen);

    // 9) ClipPaths & labels
    svg.selectAll("clipPath.state-clip")
      .data(statesGeo.features)
      .enter().append("clipPath")
      .attr("id",d=>"clip-"+d.id)
      .append("path").attr("d",pathGen);

    svg.selectAll("foreignObject.state-label")
      .data(statesGeo.features)
      .enter().append("foreignObject")
      .attr("class","state-label")
      .attr("clip-path",d=>"url(#clip-"+d.id+")")
      .attr("x",d=>pathGen.centroid(d)[0]-30)
      .attr("y",d=>pathGen.centroid(d)[1]-15)
      .attr("width","60px")
      .attr("height","30px")
      .html(d=>{
        const p = FIPS_TO_POSTAL[d.id];
        if (!p||!stateShareMap[p]) return "";
        const pct = computeCombinedShare(stateShareMap[p]).toFixed(1)+"%";
        const trend = window.locContainer?.[p]?.Trend==="up"?"&#x2191;":"&#x2193;";
        return `
          <div style="
            width:60px;height:30px;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;font-weight:bold;
            background:rgba(255,255,255,0.7);border-radius:4px;color:#333;
          ">
            ${pct}
            <span style="margin-left:4px;color:${trend==="&#x2191;"?"green":"red"}">
              ${trend}
            </span>
          </div>`;
      });

    // 10) Draw pies at city locations
    const locMap = new Map();
    dataRows.forEach(r=>{
      if (!locMap.has(r.locName)) locMap.set(r.locName,[]);
      locMap.get(r.locName).push(r);
    });
    const proj = d3.geoAlbersUsa().scale(1300).translate([W/2,H/2]);
    const locationData = [];
    if (window.cityLookup) {
      locMap.forEach((devices,loc)=>{
        const city = window.cityLookup.get(loc);
        if (!city) return;
        const c = proj([city.lng,city.lat]);
        if (!c) return;
        locationData.push({loc,x:c[0],y:c[1],devices});
      });
    }

    const dotsLayer = svg.append("g").attr("class","dots-layer");
    const piesLayer = svg.append("g").attr("class","pies-layer");

    dotsLayer.selectAll("circle.city-dot")
      .data(locationData)
      .enter().append("circle")
      .attr("class","city-dot")
      .attr("cx",d=>d.x)
      .attr("cy",d=>d.y)
      .attr("r",8)
      .attr("fill","#cc0000")
      .attr("stroke","#fff")
      .attr("stroke-width",1);

    const arcGen = d3.arc().outerRadius(25).innerRadius(0);
    const pieGen = d3.pie().sort(null).value(v=>v);
    function drawPie(g,deviceData,yOffset){
      if (!deviceData || (deviceData.hideRank&&deviceData.hideShare)) return;
      const shareVal = parseFloat(deviceData.shareVal)||0;
      const disp = deviceData.hideShare?0:shareVal;
      const rankRaw = parseFloat(deviceData.avgRank)||0;
      const rankVal = deviceData.hideRank?null:rankRaw.toFixed(1);
      const pieData = [disp,100-disp];
      const arcs = pieGen(pieData);
      const pg = g.append("g").attr("transform",`translate(0,${yOffset})`);
      if (rankVal!==null){
        let bg = "#dfffd6";
        if (rankRaw>=2&&rankRaw<4) bg="#fffac2";
        else if (rankRaw>=4&&rankRaw<6) bg="#ffe0bd";
        else if (rankRaw>=6) bg="#ffcfcf";
        pg.append("foreignObject")
          .attr("class","rank-box")
          .attr("x",-(25+10+38))
          .attr("y",-19)
          .attr("width",38)
          .attr("height",38)
          .html(`<div style="
            width:38px;height:38px;
            display:flex;align-items:center;justify-content:center;
            font-size:18px;font-weight:bold;
            background:${bg};border-radius:4px;color:#333;
          ">${rankVal}</div>`);
      }
      const sg = pg.append("g").attr("class","share-pie-group");
      if (!deviceData.hideShare){
        sg.selectAll("path.arc")
          .data(arcs)
          .enter().append("path")
          .attr("class","arc")
          .attr("d",arcGen)
          .attr("fill",(d,i)=>i===0?colorForDevice(deviceData.device):"#ccc")
          .attr("stroke","#fff")
          .attr("stroke-width",0.5);
        sg.append("text")
          .attr("text-anchor","middle")
          .attr("dy","0.4em")
          .style("font","bold 14px sans-serif")
          .text(disp.toFixed(1)+"%");
      }
    }

    const locGroups = piesLayer.selectAll("g.loc-group")
      .data(locationData)
      .enter().append("g")
      .attr("class","loc-group")
      .attr("transform",d=>{
        const offsetX = d.x< W/2 ? 40 : -40;
        let h=0;
        if (d.devices.some(dd=>dd.device.toLowerCase().includes("desktop"))) h+=60;
        if (d.devices.some(dd=>dd.device.toLowerCase().includes("mobile")))  h+=60;
        if (!h) h=60;
        let y0 = d.y - h/2;
        y0 = Math.max(0, Math.min(y0, H - h));
        return `translate(${d.x+offsetX},${y0})`;
      });

    locGroups.each(function(d){
      let yOff = 30;
      const desktop = d.devices.find(dd=>dd.device.toLowerCase().includes("desktop"));
      if (desktop) { drawPie(d3.select(this),desktop,yOff); yOff+=60; }
      const mobile = d.devices.find(dd=>dd.device.toLowerCase().includes("mobile"));
      if (mobile) drawPie(d3.select(this),mobile,yOff);
    });

    // 11) Tooltip
    const tooltip = container.append("div")
      .attr("class","state-tooltip")
      .style("position","absolute")
      .style("pointer-events","none")
      .style("background","rgba(0,0,0,0.7)")
      .style("color","#fff")
      .style("padding","8px")
      .style("border-radius","6px")
      .style("font-size","14px")
      .style("display","none");

    // 12) Click / highlight / tag / filter
    let previouslySelectedState = null;
    statesSel
      .on("mousemove",(ev)=> {
        const [x,y] = d3.pointer(ev, container.node());
        tooltip.style("left",(x+12)+"px").style("top",(y+12)+"px");
      })
      .on("mouseout",()=> tooltip.style("display","none"))
      .on("click", function(ev, d) {
        // single stPostal + stateName
        const stPostal = FIPS_TO_POSTAL[d.id];
        if (!stPostal) return;
        const stateName = POSTAL_TO_STATE_NAME[stPostal] || "";

        // unhighlight old
        if (previouslySelectedState) {
          previouslySelectedState.attr("stroke","#999").attr("stroke-width",1);
        }
        // highlight new
        const me = d3.select(this)
          .attr("stroke","#007aff").attr("stroke-width",4);
        previouslySelectedState = me;

        // update tag
        tagContainer.html(`
          <span style="
            display:inline-block;
            background:#007aff;color:#fff;
            padding:6px 12px;border-radius:20px;
            font-size:14px;font-weight:500;
          ">
            ${stateName}
            <span id="clearStateFilter" style="
              margin-left:8px;cursor:pointer;font-weight:bold;
            ">&times;</span>
          </span>
        `);

        document.getElementById("clearStateFilter").onclick = ()=>{
          tagContainer.html("");
          if (document.getElementById("homePage").style.display!=="none") {
            showAllHomeTableRows();
          } else {
            showAllProjectTableRows();
          }
          if (previouslySelectedState) {
            previouslySelectedState.attr("stroke","#999").attr("stroke-width",1);
            previouslySelectedState = null;
          }
        };

        // now filter
        if (document.getElementById("homePage").style.display!=="none") {
          filterHomeTableByState(stateName);
        } else {
          filterProjectTableByState(stateName);
        }
      })
      .on("mouseover", (ev,d)=>{
        // reuse stPostal, stateName
        const p = FIPS_TO_POSTAL[d.id];
        if (!p||!stateShareMap[p]) return;
        const desktopRows = dataRows.filter(r=>{
          const c = window.cityLookup.get(r.locName);
          return c&&c.state_id===p&&r.device.toLowerCase().includes("desktop");
        });
        const mobileRows = dataRows.filter(r=>{
          const c = window.cityLookup.get(r.locName);
          return c&&c.state_id===p&&r.device.toLowerCase().includes("mobile");
        });
        function avgRank(arr){
          if (!arr.length) return "N/A";
          const sum = arr.reduce((a,r)=>a+(parseFloat(r.avgRank)||0),0);
          return (sum/arr.length).toFixed(1);
        }
        const dr = avgRank(desktopRows);
        const mr = avgRank(mobileRows);
        const dsVal = desktopRows.length?
          computeCombinedShare({
            desktopSum:desktopRows.reduce((a,r)=>a+r.shareVal,0),
            desktopCount:desktopRows.length
          }).toFixed(1):0;
        const msVal = mobileRows.length?
          computeCombinedShare({
            mobileSum:mobileRows.reduce((a,r)=>a+r.shareVal,0),
            mobileCount:mobileRows.length
          }).toFixed(1):0;

        tooltip.html(`
          <div><strong>Desktop</strong>: Rank ${dr}, Share ${dsVal}%</div>
          <div><strong>Mobile</strong>: Rank ${mr}, Share ${msVal}%</div>
        `).style("display","block");
      });
  }

  // ---------- (G) Canada / UK / Australia (unchanged) ----------
  async function drawCanadaMapWithLocations(project, selector) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    let topo;
    try { topo = await getCanadaMapData(); }
    catch(e){ console.error(e); return; }
    const provincesGeo = topojson.feature(topo, topo.objects.provinces);
    const provinceCounts = {};
    (project.searches||[]).forEach(search=>{
      if ((search.status||"").toLowerCase()!=="active") return;
      const locs = Array.isArray(search.location)?search.location:[search.location];
      locs.forEach(locStr=>{
        if (!locStr) return;
        const canon = locStr.trim().toLowerCase();
        if (!window.cityLookup.has(canon)) return;
        const city = window.cityLookup.get(canon);
        const st = city.state_id;
        provinceCounts[st] = (provinceCounts[st]||0)+1;
      });
    });
    let maxCount=0;
    Object.values(provinceCounts).forEach(v=>maxCount=Math.max(maxCount,v));
    const colorScale = d3.scaleSequential()
      .domain([0,maxCount||1])
      .interpolator(d3.interpolateBlues);

    const WIDTH=600, HEIGHT=500;
    const svg = container.append("svg")
      .attr("viewBox",`0 0 ${WIDTH} ${HEIGHT}`)
      .style("width","100%").style("height","auto")
      .style("background-color","transparent");
    const projection = d3.geoMercator().fitSize([WIDTH,HEIGHT], provincesGeo);
    const path  = d3.geoPath().projection(projection);

    svg.selectAll("path.province")
      .data(provincesGeo.features)
      .enter().append("path")
      .attr("class","province")
      .attr("d",path)
      .attr("fill",d=>{
        const code = mapProvinceCode(d.properties.CODE);
        return colorScale(provinceCounts[code]||0);
      })
      .attr("stroke","#999");

    svg.selectAll("circle.province-bubble")
      .data(provincesGeo.features)
      .enter().append("circle")
      .attr("class","province-bubble")
      .attr("cx",d=>path.centroid(d)[0])
      .attr("cy",d=>path.centroid(d)[1])
      .attr("r",d=>(provinceCounts[mapProvinceCode(d.properties.CODE)]||0)>0?20:0)
      .attr("fill","#2962FF").attr("fill-opacity",0.5);

    svg.selectAll("text.province-bubble-label")
      .data(provincesGeo.features)
      .enter().append("text")
      .attr("class","province-bubble-label")
      .attr("x",d=>path.centroid(d)[0])
      .attr("y",d=>path.centroid(d)[1]+5)
      .attr("text-anchor","middle")
      .attr("font-size",14).attr("fill","#fff")
      .text(d=>(provinceCounts[mapProvinceCode(d.properties.CODE)]||""));

    // city dots
    const cities = collectActiveCitiesForProject(project);
    cities.forEach(city=>{
      const c = projection([city.lng,city.lat]);
      if (!c) return;
      svg.append("circle")
        .attr("class","city-dot")
        .attr("cx",c[0]).attr("cy",c[1]).attr("r",5)
        .attr("fill","red").attr("stroke","#fff").attr("stroke-width",1);
    });
  }

  async function drawUKMapWithLocations(project, selector) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    let topo;
    try { topo = await getUKMapData(); }
    catch(e){ console.error(e); return; }
    const ukGeo = topojson.feature(topo, topo.objects.eer);
    const regionCounts = {};
    (project.searches||[]).forEach(search=>{
      if ((search.status||"").toLowerCase()!=="active") return;
      const locs = Array.isArray(search.location)?search.location:[search.location];
      locs.forEach(locStr=>{
        if (!locStr) return;
        const canon = locStr.trim().toLowerCase();
        if (!window.cityLookup.has(canon)) return;
        const city = window.cityLookup.get(canon);
        const region = (city.regionName||"").trim();
        regionCounts[region] = (regionCounts[region]||0)+1;
      });
    });
    let maxCount=0;
    Object.values(regionCounts).forEach(v=>maxCount=Math.max(maxCount,v));
    const colorScale = d3.scaleSequential()
      .domain([0,maxCount||1])
      .interpolator(d3.interpolateBlues);

    const WIDTH=600, HEIGHT=500;
    const svg = container.append("svg")
      .attr("viewBox",`0 0 ${WIDTH} ${HEIGHT}`)
      .style("width","100%").style("height","auto")
      .style("background-color","transparent");
    const projection = d3.geoMercator().fitSize([WIDTH,HEIGHT], ukGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.uk-region")
      .data(ukGeo.features)
      .enter().append("path")
      .attr("class","uk-region")
      .attr("d",path)
      .attr("stroke","#999")
      .attr("fill",d=>{
        const nm = d.properties.EER13NM||"";
        return colorScale(regionCounts[nm]||0);
      });

    const cities = collectActiveCitiesForProject(project);
    cities.forEach(city=>{
      const c = projection([city.lng,city.lat]);
      if (!c) return;
      svg.append("circle")
        .attr("class","city-dot")
        .attr("cx",c[0]).attr("cy",c[1]).attr("r",5)
        .attr("fill","red").attr("stroke","#fff").attr("stroke-width",1);
    });
  }

  async function drawAustraliaMapWithLocations(project, selector) {
    const container = d3.select(selector);
    container.selectAll("*").remove();
    let topo;
    try { topo = await getAustraliaMapData(); }
    catch(e){ console.error(e); return; }
    const auGeo = topojson.feature(topo, topo.objects.austates);
    const regionCounts = {};
    (project.searches||[]).forEach(search=>{
      if ((search.status||"").toLowerCase()!=="active") return;
      const locs = Array.isArray(search.location)?search.location:[search.location];
      locs.forEach(locStr=>{
        if (!locStr) return;
        const canon = locStr.trim().toLowerCase();
        if (!window.cityLookup.has(canon)) return;
        const city = window.cityLookup.get(canon);
        const rid = city.regionId;
        if (typeof rid==="number"&&rid>=0) {
          regionCounts[rid] = (regionCounts[rid]||0)+1;
        }
      });
    });
    let maxCount=0;
    Object.values(regionCounts).forEach(v=>maxCount=Math.max(maxCount,v));
    const colorScale = d3.scaleSequential()
      .domain([0,maxCount||1])
      .interpolator(d3.interpolateBlues);

    const WIDTH=700, HEIGHT=600;
    const svg = container.append("svg")
      .attr("viewBox",`0 0 ${WIDTH} ${HEIGHT}`)
      .style("width","100%").style("height","auto")
      .style("background-color","transparent");
    const projection = d3.geoMercator().fitSize([WIDTH,HEIGHT], auGeo);
    const path = d3.geoPath().projection(projection);

    svg.selectAll("path.au-state")
      .data(auGeo.features)
      .enter().append("path")
      .attr("class","au-state")
      .attr("d",path)
      .attr("stroke","#999")
      .attr("fill",d=>colorScale(regionCounts[d.id]||0));

    svg.selectAll("circle.au-bubble")
      .data(auGeo.features)
      .enter().append("circle")
      .attr("class","au-bubble")
      .attr("cx",d=>path.centroid(d)[0])
      .attr("cy",d=>path.centroid(d)[1])
      .attr("r",d=>regionCounts[d.id]>0?20:0)
      .attr("fill","#2962FF").attr("fill-opacity",0.4);

    const cities = collectActiveCitiesForProject(project);
    cities.forEach(city=>{
      const c = projection([city.lng,city.lat]);
      if (!c) return;
      svg.append("circle")
        .attr("class","city-dot")
        .attr("cx",c[0]).attr("cy",c[1]).attr("r",5)
        .attr("fill","red").attr("stroke","#fff").attr("stroke-width",1);
    });
  }

  // ---------- (H) Expose mapHelpers ----------
  if (typeof window.mapHelpers !== "object") window.mapHelpers = {};
  window.mapHelpers.drawUsMapWithLocations       = drawUsMapWithLocations;
  window.mapHelpers.drawCanadaMapWithLocations   = drawCanadaMapWithLocations;
  window.mapHelpers.drawUKMapWithLocations       = drawUKMapWithLocations;
  window.mapHelpers.drawAustraliaMapWithLocations = drawAustraliaMapWithLocations;

  // ---------- (I) Helpers ----------

  // collect active city objects for Canada/UK/AU dots
  function collectActiveCitiesForProject(project) {
    if (!project || !Array.isArray(project.searches)) return [];
    if (typeof window.cityLookup!=="object") return [];
    const out = [];
    project.searches.forEach(s=>{
      if ((s.status||"").toLowerCase()!=="active") return;
      const locs = Array.isArray(s.location)?s.location:[s.location];
      locs.forEach(locStr=>{
        if (!locStr) return;
        const canon = locStr.trim().toLowerCase();
        if (window.cityLookup.has(canon)) {
          out.push(window.cityLookup.get(canon));
        }
      });
    });
    return out;
  }

  // Filter home table by state, respecting rowspan
  function filterHomeTableByState(stateName) {
    const table = document.querySelector("#homePage .home-table");
    if (!table) return;
    const needle = stateName.toLowerCase();
    let currentLoc="";
    table.querySelectorAll("tbody tr").forEach(row=>{
      const cell = row.cells[0];
      if (cell && cell.hasAttribute("rowspan")) {
        currentLoc = cell.textContent.trim().toLowerCase();
      }
      row.style.display = currentLoc.includes(needle) ? "" : "none";
    });
  }

  // Filter project table by state, respecting rowspan at column 1
  function filterProjectTableByState(stateName) {
    const table = document.querySelector("#projectPage .project-table");
    if (!table) return;
    const needle = stateName.toLowerCase();
    let currentLoc="";
    table.querySelectorAll("tbody tr").forEach(row=>{
      const cell = row.cells[1];
      if (cell && cell.hasAttribute("rowspan")) {
        currentLoc = cell.textContent.trim().toLowerCase();
      }
      row.style.display = currentLoc.includes(needle) ? "" : "none";
    });
  }

  function showAllHomeTableRows() {
    const table = document.querySelector("#homePage .home-table");
    if (!table) return;
    table.querySelectorAll("tbody tr").forEach(r=>r.style.display="");
  }
  function showAllProjectTableRows() {
    const table = document.querySelector("#projectPage .project-table");
    if (!table) return;
    table.querySelectorAll("tbody tr").forEach(r=>r.style.display="");
  }

})();
