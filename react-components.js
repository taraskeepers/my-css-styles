/**********************************************
 * react-components.js
 * Load this with: <script type="text/babel" src="react-components.js"></script>
 * AFTER loading Babel, React, ReactDOM, Recharts, and Chart.js
 **********************************************/

// Make sure Chart.js is globally available
// and that chartjs-plugin-datalabels is loaded
Chart.register(window["ChartDataLabels"]);

/** 
 * A simple toggle switch used inside the DetailsPanel 
 * or anywhere you want a labeled checkbox.
 */
function ToggleSwitch({ id, checked, onChange, label }) {
  return (
    <div className="toggle-switch-container">
      <span className="toggle-label">{label}</span>
      <div className="toggle-switch">
        <input type="checkbox" id={id} checked={checked} onChange={onChange} />
        <label htmlFor={id} className="slider"></label>
      </div>
    </div>
  );
}

/**
 * The main "DetailsPanel" component that appears
 * when you open a product's detail view in your PLA.
 * Contains tabs, chart areas, toggles, etc.
 */
function DetailsPanel({ rowData, start, end, activeTab: initialActiveTab }) {
  // React basics
  const { useState, useEffect } = React;
  const [trendToggles, setTrendToggles] = useState({
    pos3:  false,
    pos7:  false,
    pos30: false,
    vis3:  false,
    vis7:  false,
    vis30: false
  });
  const [activeTab, setActiveTab] = useState(initialActiveTab || 1);

  // We'll store a local dateRange so the user can pick a sub-range
  const [dateRange, setDateRange] = useState({ start, end });

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    window.savedActiveTab = newTab;  // if you want to track the user’s last active tab globally
  };

  // Example: useEffect to set up a date range picker on #dateRangePicker2
  useEffect(() => {
    const pickerInput = document.getElementById("dateRangePicker2");
    if (!pickerInput) return;

    // Using jQuery daterangepicker, or your approach:
    $(pickerInput).daterangepicker(
      {
        startDate: dateRange.start,
        endDate:   dateRange.end,
        ranges: {
          "All Data":    [dateRange.start, dateRange.end],
          "Last 7 Days": [moment().subtract(6, "days"), moment()],
          "Last 30 Days":[moment().subtract(29, "days"), moment()]
        },
        locale: { format: "YYYY-MM-DD" },
        autoUpdateInput: true
      },
      (selectedStart, selectedEnd) => {
        setDateRange({ start: selectedStart, end: selectedEnd });
      }
    );
  }, [dateRange.start, dateRange.end]);

  if (!rowData) {
    return (
      <div className="pla-details-panel">
        <div className="pla-details-topbar">No data selected.</div>
      </div>
    );
  }

  return (
    <div className="pla-details-panel">
      <div className="pla-details-topbar">
        <div className="pla-details-title">Product Details</div>
        <div className="tab-buttons">
          <button 
            className={activeTab === 1 ? "active" : ""}
            onClick={() => handleTabChange(1)}
          >
            Position &amp; Visibility Trends
          </button>
          <button 
            className={activeTab === 2 ? "active" : ""}
            onClick={() => handleTabChange(2)}
          >
            Prices &amp; Reviews
          </button>
        </div>
        <div className="pla-details-date-picker" style={{ display: 'none' }}>
          <input type="text" id="dateRangePicker2" />
        </div>
                    {/* New close button */}
        <button 
          className="pla-details-close-btn" 
          onClick={onClose}
          style={{
            position: 'absolute',
            right: '10px',
            top: '10px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            fontWeight: 'bold',
            cursor: 'pointer',
            color: '#333',
            zIndex: 10
          }}
        >
          &times;
        </button>  
      </div>

      <div className="tabs-container">
      {activeTab === 1 && (
        <div className="tab-content" style={{ display:"flex", gap:"12px" }}>
          {/* LEFT column: the main position/visibility chart */}
          <div className="pla-details-column pla-details-left">
            <PLAChart
              rowData={rowData}
              trendToggles={trendToggles}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* MIDDLE column: secondary chart (like AppleBarChart) */}
          <div className="pla-details-column pla-details-middle">
            <AppleBarChart
              rowData={rowData}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* RIGHT column: main metrics */}
          <div className="pla-details-column pla-details-main-metrics">
            <MainMetrics
              rowData={rowData}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>

          {/* Settings toggles */}
          <div className="pla-details-column pla-details-settings">
            <h3>Settings</h3>
            <ToggleSwitch
              id="toggle-pos3"
              checked={trendToggles.pos3}
              onChange={() => setTrendToggles(prev => ({ ...prev, pos3: !prev.pos3 }))}
              label="3d pos trend"
            />
            <ToggleSwitch
              id="toggle-pos7"
              checked={trendToggles.pos7}
              onChange={() => setTrendToggles(prev => ({ ...prev, pos7: !prev.pos7 }))}
              label="7d pos trend"
            />
            <ToggleSwitch
              id="toggle-pos30"
              checked={trendToggles.pos30}
              onChange={() => setTrendToggles(prev => ({ ...prev, pos30: !prev.pos30 }))}
              label="30d pos trend"
            />
            <ToggleSwitch
              id="toggle-vis3"
              checked={trendToggles.vis3}
              onChange={() => setTrendToggles(prev => ({ ...prev, vis3: !prev.vis3 }))}
              label="3d visib trend"
            />
            <ToggleSwitch
              id="toggle-vis7"
              checked={trendToggles.vis7}
              onChange={() => setTrendToggles(prev => ({ ...prev, vis7: !prev.vis7 }))}
              label="7d visib trend"
            />
            <ToggleSwitch
              id="toggle-vis30"
              checked={trendToggles.vis30}
              onChange={() => setTrendToggles(prev => ({ ...prev, vis30: !prev.vis30 }))}
              label="30d visib trend"
            />
          </div>
        </div>
      )}

      {activeTab === 2 && (
        <div className="tab-content" style={{ display: "flex", gap: "20px" }}>
          {/* Column 1: Price Chart */}
          <div className="price-chart-container">
            <h3>Price Chart</h3>
            <PriceChart 
              rowData={rowData}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>
          {/* Column 2: Rating Chart */}
          <div className="rating-chart-container">
            <h3>Rating Chart</h3>
            <RatingChart
              rowData={rowData}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>
          {/* Column 3: rating metrics */}
          <div className="rating-metrics-container pla-details-main-metrics">
            <h3>Rating Metrics</h3>
            <RatingMetrics
              rowData={rowData}
              startDate={dateRange.start}
              endDate={dateRange.end}
            />
          </div>
          {/* Column 4: active extensions */}
          <div className="active-extensions-container pla-details-main-metrics">
            <h3>Active Extensions</h3>
            <ActiveExtensions rowData={rowData} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

/**
 * A line/area chart combining position & visibility for a single product
 */
function PLAChart({ rowData, trendToggles, startDate, endDate }) {
  const { useState, useEffect } = React;
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(prepareChartData(rowData, startDate, endDate));
  }, [rowData, startDate, endDate]);

  function prepareChartData(rowData, startDate, endDate) {
    if (!rowData) return [];
    const hist = rowData.historical_data || [];
    if (!hist.length) return [];

    // Build a map dateStr => row
    const dataMap = {};
    hist.forEach(item => {
      if (item.date && item.date.value) {
        dataMap[item.date.value] = item;
      }
    });

    // Fill every day from start..end
    const result = [];
    let dt = startDate.clone();
    while (dt.isSameOrBefore(endDate, "day")) {
      const dateStr = dt.format("YYYY-MM-DD");
      let position = 40;    // default => not ranked
      let visibility = 0;   // default => 0
      if (dataMap[dateStr]) {
        const rec = dataMap[dateStr];
        const p = parseFloat(rec.avg_position);
        if (!isNaN(p) && p !== 0) {
          position = p;
        }
        if (rec.visibility != null) {
          visibility = parseFloat(rec.visibility) * 100;
        }
      }
      result.push({ name: dateStr, position, visibility });
      dt.add(1, "days");
    }

    // Compute 3/7/30 day trend lines if needed
    // We'll define a helper:
    function computeTrendLine(dataArr, field, windowSize) {
      // gather the last <windowSize> points that have a numeric value
      const validData = dataArr.filter(d => d[field] != null);
      if (validData.length < 2) return Array(dataArr.length).fill(null);

      const windowData = validData.slice(-windowSize);
      if (windowData.length < 2) return Array(dataArr.length).fill(null);

      // Basic linear regression over that window
      const firstTime = new Date(windowData[0].name).getTime();
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      const n = windowData.length;
      for (let i=0; i<n; i++) {
        const t = new Date(windowData[i].name).getTime();
        const x = (t - firstTime) / (1000*3600*24);
        const y = parseFloat(windowData[i][field]) || 0;
        sumX += x; sumY += y;
        sumXY += (x*y);
        sumX2 += (x*x);
      }
      const denom = (n*sumX2 - sumX*sumX);
      if (denom === 0) return Array(dataArr.length).fill(null);
      const slope = (n*sumXY - sumX*sumY)/denom;
      const intercept = (sumY - slope*sumX)/n;
      const lastTime = new Date(windowData[n-1].name).getTime();

      // For each item in dataArr => compute or null
      return dataArr.map(d => {
        const curT = new Date(d.name).getTime();
        if (curT < firstTime || curT > lastTime) {
          return null; 
        }
        let pred = intercept + slope * ((curT - firstTime)/(1000*3600*24));
        // clamp rank to [0..40], clamp visibility to [0..100], etc. if needed
        if (field==="position") {
          if (pred < 0) pred = 0;
          if (pred > 40) pred = 40;
        } else if (field==="visibility") {
          if (pred < 0) pred = 0;
          if (pred > 100) pred = 100;
        }
        return pred;
      });
    }

    // Attach these lines
    const pos3  = computeTrendLine(result, "position", 3);
    const pos7  = computeTrendLine(result, "position", 7);
    const pos30 = computeTrendLine(result, "position", 30);
    const vis3  = computeTrendLine(result, "visibility", 3);
    const vis7  = computeTrendLine(result, "visibility", 7);
    const vis30 = computeTrendLine(result, "visibility", 30);

    for (let i=0; i<result.length; i++) {
      result[i].pos3  = pos3[i];
      result[i].pos7  = pos7[i];
      result[i].pos30 = pos30[i];
      result[i].vis3  = vis3[i];
      result[i].vis7  = vis7[i];
      result[i].vis30 = vis30[i];
    }

    return result;
  }

  // Pull out the Recharts from the global “window.Recharts”
  const {
    ResponsiveContainer,
    ComposedChart,
    Line,
    Area,
    Tooltip,
    XAxis,
    YAxis,
    ReferenceArea,
    LabelList,
    Legend,
    CartesianGrid
  } = window.Recharts;

  // A small function to format the tooltip display
  function tooltipFormatter(val, name) {
    if (name === "position" && val === 40) {
      return ["no rank", "position"];
    }
    if ((name.startsWith("vis") || name === "visibility") && val > 0) {
      return [`${val.toFixed(2)}%`, name];
    }
    return [val, name];
  }

  return (
    <div style={{ width:"600px", height:"300px" }}>
      <ResponsiveContainer>
        <ComposedChart 
          data={chartData} 
          margin={{ top:20, right:5, bottom:20, left:5 }} 
          isAnimationActive={false}
        >
          {chartData.length > 0 && (
            <ReferenceArea
              x1={chartData[0].name}
              x2={chartData[chartData.length - 1].name}
              yAxisId="position"
              y1={0} y2={8}
              fill="rgba(0,255,0,0.2)"
              stroke="none"
              label={{
                value: "TOP8",
                position:"insideTopLeft",
                fill:"#007AFF",
                fontSize:12,
                dy:20
              }}
            />
          )}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            scale="band" 
            tick={{ fontSize:10 }} 
            angle={-90} 
            textAnchor="end"
          />
          <YAxis 
            yAxisId="position" 
            reversed 
            domain={[0,40]}
            tick={{ fontSize:10 }}
          />
          <YAxis 
            yAxisId="visibility" 
            orientation="right" 
            domain={[0,100]}
            tickFormatter={val => val + "%"}
            tick={{ fontSize:10 }}
          />

          <Tooltip
            formatter={tooltipFormatter}
            contentStyle={{ borderRadius:8, fontSize:10 }}
          />
          
          {/* AREA for Visibility */}
          <Area 
            yAxisId="visibility"
            type="monotone"
            dataKey="visibility"
            fill="#A3D5FF"
            stroke="#A3D5FF"
            connectNulls
          />
          {/* LINE for Position */}
          <Line
            yAxisId="position"
            dataKey="position"
            type="monotone"
            stroke="#007AFF"
            strokeWidth={4}
            connectNulls
            dot={(props) => {
              const { value } = props;
              if (value === 40) return null; // hide dot if rank=40
              return (
                <circle 
                  cx={props.cx}
                  cy={props.cy}
                  r={3}
                  strokeWidth={4}
                  stroke="#007AFF"
                  fill="#007AFF"
                />
              );
            }}
          >
            <LabelList
              dataKey="position"
              position="top"
              content={(props) => {
                const { x, y, value } = props;
                if (value === 40) return null;
                return (
                  <text x={x} y={y - 4} fontSize={10} fill="#000" textAnchor="middle">
                    {value}
                  </text>
                );
              }}
            />
          </Line>

          {/* Optional lines for pos3, pos7, pos30, vis3, vis7, vis30 */}
          {trendToggles.pos3 && (
            <Line 
              yAxisId="position" 
              dataKey="pos3" 
              stroke="red" 
              dot={false} 
              strokeWidth={2}
            />
          )}
          {trendToggles.pos7 && (
            <Line 
              yAxisId="position" 
              dataKey="pos7" 
              stroke="orange" 
              dot={false} 
              strokeWidth={2}
            />
          )}
          {trendToggles.pos30 && (
            <Line 
              yAxisId="position" 
              dataKey="pos30" 
              stroke="purple" 
              dot={false} 
              strokeWidth={2}
            />
          )}
          {trendToggles.vis3 && (
            <Line 
              yAxisId="visibility" 
              dataKey="vis3" 
              stroke="green" 
              dot={false} 
              strokeWidth={2}
            />
          )}
          {trendToggles.vis7 && (
            <Line 
              yAxisId="visibility" 
              dataKey="vis7" 
              stroke="brown" 
              dot={false} 
              strokeWidth={2}
            />
          )}
          {trendToggles.vis30 && (
            <Line 
              yAxisId="visibility" 
              dataKey="vis30" 
              stroke="magenta" 
              dot={false} 
              strokeWidth={2}
            />
          )}

          <Legend 
            wrapperStyle={{ position:"absolute", bottom:"-40px", left:0, right:0 }}
            payload={[
              { value: 'Position',   type:'line', color:'#007AFF' },
              { value: 'Visibility', type:'area', color:'#A3D5FF' }
            ]}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A smaller horizontal bar or line chart showing “Top3, Top4-8, etc.”
 * (Your "AppleBarChart" from the conversation)
 */
function AppleBarChart({ rowData, startDate, endDate }) {
  const { useRef, useEffect, useState } = React;
  const chartRef = useRef(null);
  const [chartInstance, setChartInstance] = useState(null);

  useEffect(() => {
    if (!rowData || !startDate || !endDate) return;

    // We do some logic to compute “Top3, Top4-8, etc.” 
    const dayCount = endDate.diff(startDate,"days")+1;
    const prevEnd  = startDate.clone().subtract(1,"days");
    const prevStart= prevEnd.clone().subtract(dayCount-1,"days");

    const allData= rowData.historical_data || [];
    // Filter current window
    const currentFiltered = allData.filter(item=>{
      const d = moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(startDate, endDate, "day", "[]");
    });
    // Filter previous window
    const prevFiltered = allData.filter(item=>{
      const d = moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(prevStart, prevEnd, "day", "[]");
    });

    // Example aggregator: 
    function avg(arr, field){
      if (!arr.length) return 0;
      let sum=0, c=0;
      arr.forEach(x=>{
        if (x[field]!=null) {
          sum += parseFloat(x[field]);
          c++;
        }
      });
      return c>0? sum/c : 0;
    }

    // Suppose we want to chart top3_visibility, top8_visibility, top14_visibility, top40_visibility
    // as "current" vs "previous"
    const currTop3 = avg(currentFiltered, "top3_visibility") * 100;
    const currTop8 = avg(currentFiltered, "top8_visibility") * 100;
    const currTop14= avg(currentFiltered, "top14_visibility")* 100;
    const currTop40= avg(currentFiltered, "top40_visibility")* 100;
    const prevTop3 = avg(prevFiltered, "top3_visibility")*100;
    const prevTop8 = avg(prevFiltered, "top8_visibility")*100;
    const prevTop14= avg(prevFiltered, "top14_visibility")*100;
    const prevTop40= avg(prevFiltered, "top40_visibility")*100;

    const combined = [
      { label:"Top3",    current: currTop3,    previous: prevTop3 },
      { label:"Top4-8",  current: currTop8 - currTop3,  previous: prevTop8 - prevTop3 },
      { label:"Top9-14", current: currTop14- currTop8,  previous: prevTop14- prevTop8 },
      { label:"Below14", current: currTop40- currTop14, previous: prevTop40- prevTop14 },
    ];

    // Destroy old chart if present
    if (chartInstance) {
      chartInstance.destroy();
    }

    // Build a horizontal bar + line
    const ctx = chartRef.current.getContext("2d");
    const newChart = new Chart(ctx, {
      type:"bar",
      data:{
        labels: combined.map(d=> d.label),
        datasets:[
          {
            label: "Current",
            data: combined.map(d=> d.current),
            backgroundColor: "#007aff"
          },
          {
            label: "Previous",
            type: "line",
            data: combined.map(d=> d.previous),
            borderColor: "rgba(255,0,0,1)",
            backgroundColor: "rgba(255,0,0,0.2)",
            fill:true,
            tension: 0.3,
            borderWidth: 2
          }
        ]
      },
      options:{
        indexAxis:"y",
        responsive:true,
        maintainAspectRatio:false,
        scales:{
          x: { display:false, min:0, max:100 },
          y: { display:true, grid:{ display:false }, ticks:{ font:{ size:16 }} }
        },
        plugins:{
          legend:{ display:false },
          tooltip:{
            callbacks:{
              label: ctx =>{
                const val= ctx.parsed.x;
                return `${ctx.dataset.label}: ${val.toFixed(2)}%`;
              }
            }
          },
          datalabels:{
            display: ctx => ctx.datasetIndex===0,
            formatter:(value, context)=>{
              const row = combined[context.dataIndex];
              const mainLabel= `${row.current.toFixed(2)}%`;
              const diff= row.current - row.previous;
              const absDiff= Math.abs(diff).toFixed(2);
              const arrow= diff>0?"▲": diff<0?"▼":"±";
              return [ mainLabel, `${arrow}${absDiff}%` ];
            },
            color: ctx=>{
              const row= combined[ctx.dataIndex];
              const diff= row.current - row.previous;
              if (diff>0) return "green";
              if (diff<0) return "red";
              return "#444";
            },
            anchor:"end",
            align:"end",
            offset:10
          }
        }
      }
    });

    setChartInstance(newChart);
  }, [rowData, startDate, endDate]);

  return (
    <div style={{ width:"300px", height:"300px" }}>
      <canvas ref={chartRef} />
    </div>
  );
}

/**
 * A summary of (avg position, visibility gauge, ranking volatility)
 * displayed in the panel
 */
function MainMetrics({ rowData, startDate, endDate }) {
  const { useState, useEffect, useRef } = React;
  const [avgPosition, setAvgPosition] = useState(0);
  const [avgVisibility, setAvgVisibility] = useState(0);
  const [volatility, setVolatility] = useState(0);

  const [posComparison, setPosComparison] = useState({ arrow:"±", diff:0 });
  const [visComparison, setVisComparison] = useState({ arrow:"±", diff:0 });

  useEffect(() => {
    if (!rowData || !startDate || !endDate) return;
    const hist = rowData.historical_data || [];
    const dayCount = endDate.diff(startDate,"days") + 1;
    const prevEnd  = startDate.clone().subtract(1,"days");
    const prevStart= prevEnd.clone().subtract(dayCount-1,"days");

    // Filter for current / previous windows
    const currentFiltered = hist.filter(item => {
      const d = moment(item.date.value,"YYYY-MM-DD");
      return d.isBetween(startDate, endDate, "day", "[]");
    });
    const prevFiltered = hist.filter(item => {
      const d = moment(item.date.value,"YYYY-MM-DD");
      return d.isBetween(prevStart, prevEnd, "day", "[]");
    });

    function averageValue(arr, field, multiplier=1) {
      if (!arr.length) return 0;
      let sum=0, c=0;
      arr.forEach(x=>{
        if (x[field]!=null) {
          sum += parseFloat(x[field]) * multiplier;
          c++;
        }
      });
      return c>0? (sum/c) :0;
    }

    // current
    const currPos = averageValue(currentFiltered, "avg_position");
    const currVis = averageValue(currentFiltered, "visibility", 100);
    // previous
    const prevPos = averageValue(prevFiltered, "avg_position");
    const prevVis = averageValue(prevFiltered, "visibility", 100);

    // stdev for position in the current set => “volatility”
    const positionsArr = currentFiltered
      .map(it => parseFloat(it.avg_position))
      .filter(x => !isNaN(x));
    const stdev = standardDeviation(positionsArr);

    setAvgPosition(+currPos.toFixed(2));
    setAvgVisibility(+currVis.toFixed(2));
    setVolatility(+stdev.toFixed(2));

    // Compare
    const posDiff = currPos - prevPos;
    let posArrow= "±";
    if (posDiff>0) posArrow="▲";
    if (posDiff<0) posArrow="▼";
    setPosComparison({ arrow:posArrow, diff: Math.abs(posDiff).toFixed(2) });

    const visDiff = currVis - prevVis;
    let visArrow= "±";
    if (visDiff>0) visArrow="▲";
    if (visDiff<0) visArrow="▼";
    setVisComparison({ arrow:visArrow, diff: Math.abs(visDiff).toFixed(2) });

  }, [rowData, startDate, endDate]);

  function standardDeviation(vals) {
    if (!vals.length) return 0;
    const mean= vals.reduce((a,b)=>a+b,0)/vals.length;
    const sqDiffs= vals.map(v => (v-mean)*(v-mean));
    const avgSq= sqDiffs.reduce((a,b)=>a+b,0)/vals.length;
    return Math.sqrt(avgSq);
  }

  function getVolatilityColor(val) {
    if (val===0) return "#555";
    if (val<=2)  return "#2ecc71";
    if (val<=5)  return "#f1c40f";
    if (val<=8)  return "#ffa500";
    if (val<=12) return "#ff4500";
    return "#c0392b";
  }
  function getVolatilityStatus(val){
    if (val===0) return "Not enough data";
    if (val<=2)  return "Very Stable";
    if (val<=5)  return "Low Volatility";
    if (val<=8)  return "Moderate Volatility";
    if (val<=12) return "High Volatility";
    return "Extreme Volatility";
  }

  // A big radial gauge for Visibility
  function VisibilityGaugeLarge({ value }) {
    const gaugeRef = useRef(null);

    useEffect(() => {
      if (gaugeRef.current && gaugeRef.current._chartInstance) {
        gaugeRef.current._chartInstance.destroy();
      }
      const visValue = Math.round(value);
      const options = {
        series: [visValue],
        chart:{
          height:180,
          width:180,
          type:'radialBar',
          offsetY:-30,
          sparkline:{ enabled:false },
          toolbar:{ show:false }
        },
        plotOptions:{
          radialBar:{
            startAngle:-135,
            endAngle:135,
            hollow:{ size:'30%' },
            track:{ strokeDashArray:6, margin:2 },
            dataLabels:{
              name:{ show:false },
              value:{
                show:true,
                offsetY:5,
                fontSize:'20px',
                formatter: val => Math.round(val)+"%"
              }
            }
          }
        },
        fill:{
          type:'gradient',
          gradient:{
            shade:'dark',
            shadeIntensity:0.15,
            inverseColors:false,
            opacityFrom:1,
            opacityTo:1,
            stops:[0,50,65,91]
          }
        },
        stroke:{ lineCap:'butt', dashArray:4 },
        labels:[]
      };
      const chart = new ApexCharts(gaugeRef.current, options);
      chart.render();
      gaugeRef.current._chartInstance = chart;
    },[value]);

    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", margin:"4px", marginBottom:"-20px" }}>
        <div ref={gaugeRef} />
      </div>
    );
  }

  return (
    <>
      <div className="metric-row">
        <div className="metric-title">Average Position</div>
        <div className="metric-value">
          {avgPosition.toFixed(2)}{" "}
          <span style={{
            color: posComparison.arrow==="▼"?"red":
                   posComparison.arrow==="▲"?"green":"#444"
          }}>
            {posComparison.arrow} {posComparison.diff}
          </span>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-title">Average Visibility</div>
        <VisibilityGaugeLarge value={avgVisibility} />
        <div className="metric-value" style={{ marginTop:"0px" }}>
          {avgVisibility.toFixed(2)}%{" "}
          <span style={{
            color: visComparison.arrow==="▼"?"red":
                   visComparison.arrow==="▲"?"green":"#444"
          }}>
            {visComparison.arrow} {visComparison.diff}%
          </span>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-title">Ranking Volatility</div>
        <div className="metric-value" style={{ fontSize:"32px", color:getVolatilityColor(volatility) }}>
          {volatility.toFixed(2)}
        </div>
        <div className="volatility-status" style={{ fontSize:"16px", color:getVolatilityColor(volatility) }}>
          {getVolatilityStatus(volatility)}
        </div>
      </div>
    </>
  );
}

/**
 * A "PriceChart" line or step chart for the product’s price over time
 */
function PriceChart({ rowData, startDate, endDate }) {
  const { useEffect, useState } = React;
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(preparePriceChartData(rowData, startDate, endDate));
  }, [rowData, startDate, endDate]);

  function preparePriceChartData(rowData, startDate, endDate) {
    if (!rowData) return [];
    const hist= rowData.historical_data || [];
    if (!hist.length) return [];
    const dataMap= {};
    hist.forEach(item=>{
      if (item.date && item.date.value) {
        dataMap[item.date.value] = item;
      }
    });
    let dt = startDate.clone();
    const result = [];
    let lastPrice=null;
    while (dt.isSameOrBefore(endDate)) {
      const dStr= dt.format("YYYY-MM-DD");
      if (dataMap[dStr] && dataMap[dStr].price) {
        const p = parseFloat(dataMap[dStr].price.replace("$",""));
        lastPrice = p;
      }
      result.push({
        name: dStr,
        price: lastPrice
      });
      dt.add(1,"days");
    }
    return result;
  }

  const {
    ResponsiveContainer,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Line
  } = window.Recharts;

  return (
    <div style={{ width:"100%", height:"300px" }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top:20, right:20, bottom:20, left:20 }}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis 
            dataKey="name" 
            scale="band" 
            tick={{ fontSize:10 }} 
            angle={-90} 
            textAnchor="end"
          />
          <YAxis />
          <Tooltip />
          <Line 
            type="step"
            dataKey="price"
            stroke="#FF0000"
            strokeWidth={2}
            dot={{ r:1 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A "RatingChart" for average rating or daily rating 
 */
function RatingChart({ rowData, startDate, endDate }) {
  const { useEffect, useState } = React;
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    setChartData(prepareRatingChartData(rowData, startDate, endDate));
  }, [rowData, startDate, endDate]);

  function prepareRatingChartData(rowData, startDate, endDate) {
    if (!rowData) return [];
    const hist = rowData.historical_data || [];
    if (!hist.length) return [];
    const dataMap= {};
    hist.forEach(item=>{
      if (item.date && item.date.value) {
        dataMap[item.date.value] = item;
      }
    });
    let dt = startDate.clone();
    let lastRating= null;
    const result = [];
    while (dt.isSameOrBefore(endDate)) {
      const dStr= dt.format("YYYY-MM-DD");
      let ratingVal= null;
      if (dataMap[dStr] && dataMap[dStr].rating != null) {
        ratingVal= parseFloat(dataMap[dStr].rating);
        lastRating= ratingVal;
      } else {
        ratingVal= lastRating; 
      }
      result.push({ name: dStr, rating: ratingVal });
      dt.add(1,"days");
    }
    return result;
  }

  const {
    ResponsiveContainer,
    ComposedChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    Line
  } = window.Recharts;

  return (
    <div style={{ width:"100%", height:"300px" }}>
      <ResponsiveContainer>
        <ComposedChart data={chartData} margin={{ top:20, right:20, bottom:20, left:20 }}>
          <CartesianGrid strokeDasharray="3 3"/>
          <XAxis 
            dataKey="name" 
            scale="band" 
            tick={{ fontSize:10 }}
            angle={-90} 
            textAnchor="end"
          />
          <YAxis domain={[0,5]}/>
          <Tooltip />
          <Line
            type="monotone"
            dataKey="rating"
            stroke="#FFA500"
            strokeWidth={2}
            dot={{ r:1 }}
            connectNulls
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * A small metrics panel summarizing rating, 
 * plus a “priceTrend” if you want, etc.
 */
function RatingMetrics({ rowData, startDate, endDate }) {
  const { useState, useEffect } = React;
  const [avgRating, setAvgRating] = useState(0);
  const [ratingTrend, setRatingTrend] = useState("");
  const [currentPrice, setCurrentPrice] = useState(null);
  const [priceTrend, setPriceTrend] = useState("");

  useEffect(() => {
    if (!rowData || !startDate || !endDate) return;
    const hist= rowData.historical_data || [];
    // filter for rating data
    const filtered= hist.filter(item => {
      const d= moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(startDate, endDate, "day", "[]") && item.rating!=null;
    });
    let sum=0, c=0;
    filtered.forEach(f => {
      sum += parseFloat(f.rating);
      c++;
    });
    const avg= c>0? sum/c :0;
    setAvgRating(avg);

    // compute rating slope for the same range
    if (filtered.length>1) {
      const sorted= filtered.slice().sort((a,b)=> new Date(a.date.value) - new Date(b.date.value));
      const firstTime= new Date(sorted[0].date.value).getTime();
      let sumX=0, sumY=0, sumXY=0, sumX2=0;
      const n= sorted.length;
      for (let i=0; i<n; i++) {
        const t= new Date(sorted[i].date.value).getTime();
        const x= (t- firstTime)/(1000*3600*24);
        const y= parseFloat(sorted[i].rating);
        sumX+= x; sumY+= y; sumXY+= (x*y); sumX2+=(x*x);
      }
      const denom= (n*sumX2 - sumX*sumX);
      const slope= denom!==0? (n*sumXY - sumX*sumY)/denom :0;
      const arrow= slope>0? "▲": slope<0?"▼":"±";
      setRatingTrend(`${arrow} ${Math.abs(slope).toFixed(2)}`);
    } else {
      setRatingTrend("");
    }
  }, [rowData, startDate, endDate]);

  useEffect(() => {
    if (!rowData || !startDate || !endDate) return;
    const hist= rowData.historical_data || [];
    // filter for price
    const filteredPrice= hist.filter(item => {
      const d= moment(item.date.value, "YYYY-MM-DD");
      return d.isBetween(startDate, endDate, "day", "[]") && item.price && item.price.trim()!=="";
    });
    if (filteredPrice.length>0) {
      const sorted= filteredPrice.slice().sort((a,b)=> new Date(a.date.value)- new Date(b.date.value));
      const latestPrice= parseFloat(sorted[sorted.length-1].price.replace("$",""));
      setCurrentPrice(latestPrice);

      // slope
      const firstTime= new Date(sorted[0].date.value).getTime();
      let sumX=0, sumY=0, sumXY=0, sumX2=0;
      const n= sorted.length;
      for (let i=0; i<n; i++) {
        const t= new Date(sorted[i].date.value).getTime();
        const x= (t - firstTime)/(1000*3600*24);
        const y= parseFloat(sorted[i].price.replace("$",""));
        sumX+= x; sumY+= y; sumXY+=(x*y); sumX2+=(x*x);
      }
      const denom= (n*sumX2 - sumX*sumX);
      const slope= denom!==0? (n*sumXY - sumX*sumY)/denom :0;
      const arrow= slope>0?"▲": slope<0?"▼":"±";
      setPriceTrend(`${arrow} ${Math.abs(slope).toFixed(2)}`);
    } else {
      setCurrentPrice(null);
      setPriceTrend("");
    }
  }, [rowData, startDate, endDate]);

  // build star display
  const fullStars= Math.floor(avgRating);
  const halfStar = avgRating - fullStars >= 0.5;
  const stars=[];
  for (let i=0; i<fullStars; i++){
    stars.push("★");
  }
  if (halfStar) stars.push("☆");

  return (
    <div>
      <div className="metric-row">
        <div className="metric-title">Average Rating</div>
        <div className="metric-value">
          {avgRating.toFixed(2)}{" "}
          <span>{stars.join("")}</span>
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-title">Rating Trend</div>
        <div className="metric-value">
          {ratingTrend}
        </div>
      </div>

      <div className="metric-row">
        <div className="metric-title">Current Price</div>
        <div className="metric-value">
          {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : "N/A"}{" "}
          <span>{priceTrend}</span>
        </div>
      </div>
    </div>
  );
}

/**
 * If your rowData has an array of “extensions”,
 * display them. Otherwise show “No active extensions.”
 */
function ActiveExtensions({ rowData }) {
  if (!rowData || !rowData.extensions || !rowData.extensions.length) {
    return <div>No active extensions.</div>;
  }
  return (
    <div>
      {rowData.extensions.map((ext, i) => (
        <div key={i} className="active-extension-tag">
          {ext}
        </div>
      ))}
    </div>
  );
}


// Finally, expose them on window if your main embed logic calls them
window.ToggleSwitch       = ToggleSwitch;
window.DetailsPanel       = DetailsPanel;
window.PLAChart           = PLAChart;
window.AppleBarChart      = AppleBarChart;
window.MainMetrics        = MainMetrics;
window.PriceChart         = PriceChart;
window.RatingChart        = RatingChart;
window.RatingMetrics      = RatingMetrics;
window.ActiveExtensions   = ActiveExtensions;
