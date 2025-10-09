// price_monitoring_promos.js - Promotions Dashboard Module
(function() {
  'use strict';
  
  console.log('[PMPromos] Module loading...');

  let showEndedWaves = false; // Global state for toggle
  let currentSortColumn = null; // Track which column is being sorted
let currentSortDirection = 'asc'; // Track sort direction: 'asc' or 'desc'

  // Initialize the Promos module
  window.pmPromosModule = {
    initialize: async function() {
      console.log('[PMPromos] Initializing...');
      await populatePromosView();
    }
  };

  async function populatePromosView() {
    const container = document.getElementById('pmPromosContainer');
    if (!container) {
      console.error('[PMPromos] Container not found');
      return;
    }

    // Load data
    const data = await window.pmUtils.loadCompanyPricingData();
    if (!data || !data.allData) {
      console.error('[PMPromos] No data available');
      return;
    }

    // Get market data
    const market = data.allData.find(row => row.source === 'all' && row.q === 'all');
    if (!market) {
      console.error('[PMPromos] No market data found');
      return;
    }

    // Create the layout
    createPromosLayout(container, market, data.allData);
  }

  function createPromosLayout(container, market, allData) {
container.innerHTML = `
  <!-- Promo Stats Section -->
  <div class="pmp-stats-section">
    <!-- Company Overview Card -->
    <div class="pmp-company-overview-card">
      <div class="pmp-company-name-header" id="pmpCompanyName">—</div>
      <div class="pmp-rank-container">
        <div class="pmp-section-label">COMPANY RANK</div>
        <div class="pmp-big-rank-box">
          <span id="pmpCompanyRankValue">—</span>
        </div>
      </div>
      <div class="pmp-market-container">
        <div class="pmp-section-label">MARKET SHARE</div>
        <div class="pmp-big-market-circle">
          <div class="pmp-market-water-fill" id="pmpCompanyMarketFill"></div>
          <span class="pmp-market-value-text" id="pmpCompanyMarketValue">—</span>
        </div>
      </div>
    </div>

    <div class="pmp-stat-item">
          <div class="pmp-stat-info">
            <div class="pmp-stat-grid">
              <div class="pmp-stat-cell">
                <span class="pmp-stat-val" id="pmpTotalProducts">—</span>
                <span class="pmp-stat-lbl">Products</span>
              </div>
              <div class="pmp-stat-cell">
                <span class="pmp-stat-val" id="pmpDiscountedProducts">—</span>
                <span class="pmp-stat-lbl">Discounted</span>
              </div>
              <div class="pmp-stat-cell">
                <span class="pmp-stat-val" id="pmpDiscountRate">—</span>
                <span class="pmp-stat-lbl">Discount Rate</span>
              </div>
              <div class="pmp-stat-cell">
                <span class="pmp-stat-val" id="pmpAvgDiscount">—</span>
                <span class="pmp-stat-lbl">Avg Discount</span>
              </div>
            </div>
          </div>
        </div>
        <div class="pmp-stat-item">
          <div class="pmp-stat-info">
            <div class="pmp-stat-main">
              <span class="pmp-stat-val" id="pmpActiveWaves">—</span>
              <span class="pmp-stat-lbl">Active Promo Waves</span>
            </div>
            <div class="pmp-stat-secondary">
              <span class="pmp-stat-subtitle" id="pmpWaveDiscount">—</span>
              <span class="pmp-stat-extra" id="pmpWaveCompanies">—</span>
            </div>
          </div>
        </div>
      </div>

<!-- Promo Waves Chart Section -->
<div class="pmp-waves-container">
<div class="pmp-waves-header">
  <h4>Active Promotional Waves</h4>
  <div style="display: flex; align-items: center; gap: 12px;">
    <div class="pmp-waves-mode-switcher">
      <button class="pmp-mode-btn active" data-mode="depth" id="pmpModeDepth">Discount Depth</button>
      <button class="pmp-mode-btn" data-mode="calendar" id="pmpModeCalendar">Calendar</button>
    </div>
    <div class="pmp-ended-waves-toggle">
      <span class="pmp-toggle-label">Display Ended Promo Waves</span>
      <label class="pmp-toggle-switch">
        <input type="checkbox" id="pmpEndedWavesToggle">
        <span class="pmp-toggle-slider"></span>
      </label>
    </div>
    <span class="pmp-waves-count" id="pmpWavesCount">0 Active</span>
  </div>
</div>
  <div class="pmp-waves-chart active" id="pmpWavesChart">
    <!-- Discount Depth chart will be rendered here -->
  </div>
  <div class="pmp-waves-calendar-chart" id="pmpWavesCalendarChart">
    <!-- Calendar chart will be rendered here -->
  </div>
</div>
    `;

    // Add styles
    addPromosStyles();

// Populate data
populateCompanyOverview(allData);
populatePromosStats(market, allData);
createPromosWavesChart(allData);
  }

  function populatePromosStats(market, allData) {
    // Products stats
    document.getElementById('pmpTotalProducts').textContent = window.pmUtils.formatNumber(market.unique_total_products);
    document.getElementById('pmpDiscountedProducts').textContent = window.pmUtils.formatNumber(market.unique_discounted_products);
    document.getElementById('pmpDiscountRate').textContent = window.pmUtils.formatPercent(market.unique_pr_discounted_products);
    document.getElementById('pmpAvgDiscount').textContent = window.pmUtils.formatPercent(market.unique_discount_depth);

    // Promo waves stats
    const activeWavesCount = parseInt(market.promo_wave_length) || 0;
    const avgWaveDiscount = parseFloat(market.promo_wave_discount_depth) || 0;

    document.getElementById('pmpActiveWaves').textContent = window.pmUtils.formatNumber(activeWavesCount);
    document.getElementById('pmpWaveDiscount').textContent = 
      avgWaveDiscount > 0 ? `Avg depth: ${avgWaveDiscount.toFixed(1)}%` : 'No active waves';

    // Count companies with active waves
    const companiesWithWaves = allData.filter(row => 
      row.source !== 'all' && 
      row.q === 'all' && 
      (row.promo_wave === true || row.promo_wave === 'true')
    ).length;

    document.getElementById('pmpWaveCompanies').textContent = 
      companiesWithWaves > 0 ? `${companiesWithWaves} companies active` : '';
  }

  async function populateCompanyOverview(allData) {
  // Get company name
  const companyName = window.myCompany || 'East Perry';
  document.getElementById('pmpCompanyName').textContent = companyName;

  // Try to get rank and market share from company_serp_stats
  try {
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}company_serp_stats`;
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.warn('[PMPromos] projectData object store not found');
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (result && result.data) {
          const myCompanyData = allData.find(row => 
            row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
          );
          
          if (myCompanyData) {
            const companyStats = result.data.find(row => 
              row.source === myCompanyData.source &&
              row.q === 'all' &&
              row.location_requested === 'all' &&
              row.device === 'all'
            );
            
            if (companyStats) {
              // Update rank
              const rankValue = companyStats['7d_rank'];
              const rankElement = document.getElementById('pmpCompanyRankValue');
              if (rankElement && rankValue) {
                rankElement.textContent = Math.round(parseFloat(rankValue));
              }
              
              // Update market share
              const marketShare = parseFloat(companyStats['7d_market_share']) * 100;
              const marketElement = document.getElementById('pmpCompanyMarketValue');
              const marketFill = document.getElementById('pmpCompanyMarketFill');
              
              if (marketElement) {
                marketElement.textContent = `${marketShare.toFixed(1)}%`;
              }
              
              if (marketFill) {
                marketFill.style.height = `${Math.min(100, Math.max(0, marketShare * 2))}%`;
              }
            }
          }
        }
        
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PMPromos] Error getting stats data:', getRequest.error);
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PMPromos] Failed to open database:', request.error);
    };
  } catch (error) {
    console.error('[PMPromos] Error fetching company overview data:', error);
  }
}

async function loadAllCompanyStats() {
  return new Promise((resolve) => {
    try {
      let tablePrefix = '';
      if (typeof window.getProjectTablePrefix === 'function') {
        tablePrefix = window.getProjectTablePrefix();
      } else {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
      }
      
      const tableName = `${tablePrefix}company_serp_stats`;
      const request = indexedDB.open('myAppDB');
      
      request.onsuccess = function(event) {
        const db = event.target.result;  // <-- NO PARENTHESES HERE
        
        if (!db.objectStoreNames.contains('projectData')) {
          console.warn('[PMPromos] projectData object store not found');
          db.close();
          resolve({});
          return;
        }
        
        const transaction = db.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        const getRequest = objectStore.get(tableName);
        
        getRequest.onsuccess = function() {
          const result = getRequest.result;
          db.close();
          
          if (!result || !result.data) {
            resolve({});
            return;
          }
          
          // Build a map of company -> stats
          const statsMap = {};
          result.data.forEach(row => {
            if (row.q === 'all' && 
                row.location_requested === 'all' && 
                row.device === 'all' &&
                row.source !== 'all') {
              statsMap[row.source] = {
                rank: row['7d_rank'] ? Math.round(parseFloat(row['7d_rank'])) : null,
                marketShare: row['7d_market_share'] ? parseFloat(row['7d_market_share']) * 100 : null
              };
            }
          });
          
          resolve(statsMap);
        };
        
        getRequest.onerror = function() {
          console.error('[PMPromos] Error getting stats data:', getRequest.error);
          db.close();
          resolve({});
        };
      };
      
      request.onerror = function() {
        console.error('[PMPromos] Failed to open database:', request.error);
        resolve({});
      };
    } catch (error) {
      console.error('[PMPromos] Error loading company stats:', error);
      resolve({});
    }
  });
}

// ==================== CALENDAR CHART FUNCTIONS ====================

async function loadHistoricalPricingData() {
  return new Promise((resolve) => {
    try {
      let tablePrefix = '';
      if (typeof window.getProjectTablePrefix === 'function') {
        tablePrefix = window.getProjectTablePrefix();
      } else {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
      }
      
      const tableName = `${tablePrefix}company_pricing`;
      const request = indexedDB.open('myAppDB');
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('projectData')) {
          console.warn('[PMPromos] projectData object store not found');
          db.close();
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        const getRequest = objectStore.get(tableName);
        
        getRequest.onsuccess = function() {
          const result = getRequest.result;
          db.close();
          
          if (!result || !result.data) {
            resolve([]);
            return;
          }
          
// Filter for companies with promo waves and q='all'
let companiesData;
if (showEndedWaves) {
  // Include both active and ended waves
  companiesData = result.data.filter(row => 
    row.q === 'all' && 
    row.source !== 'all' &&
    row.historical_data && 
    Array.isArray(row.historical_data) &&
    (
      (row.promo_wave === true || row.promo_wave === 'true') || // Active waves
      ((row.promo_wave === false || row.promo_wave === 'false') && parseFloat(row.promo_wave_length) > 0) // Ended waves
    )
  );
} else {
  // Only active waves
  companiesData = result.data.filter(row => 
    row.q === 'all' && 
    row.source !== 'all' &&
    (row.promo_wave === true || row.promo_wave === 'true') &&
    row.historical_data && 
    Array.isArray(row.historical_data)
  );
}
          
          resolve(companiesData);
        };
        
        getRequest.onerror = function() {
          console.error('[PMPromos] Error loading historical data:', getRequest.error);
          db.close();
          resolve([]);
        };
      };
      
      request.onerror = function() {
        console.error('[PMPromos] Failed to open database:', request.error);
        resolve([]);
      };
    } catch (error) {
      console.error('[PMPromos] Error in loadHistoricalPricingData:', error);
      resolve([]);
    }
  });
}

function detectPromoWaves(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return [];
  }
  
  // Sort by date ascending
  const sortedData = [...historicalData].sort((a, b) => {
    const dateA = new Date(a.date.value);
    const dateB = new Date(b.date.value);
    return dateA - dateB;
  });
  
  const waves = [];
  let currentWave = null;
  let consecutiveAboveThreshold = 0;
  let consecutiveBelowThreshold = 0;
  
  for (let i = 0; i < sortedData.length; i++) {
    const dayData = sortedData[i];
    const prDiscounted = parseFloat(dayData.pr_discounted_products) || 0;
    const isAboveThreshold = prDiscounted >= 0.1;
    
    if (isAboveThreshold) {
      consecutiveAboveThreshold++;
      consecutiveBelowThreshold = 0;
      
      // Start new wave if we hit 3 consecutive days
      if (consecutiveAboveThreshold >= 3 && !currentWave) {
        currentWave = {
          startDate: sortedData[i - 2].date.value,
          dailyData: []
        };
        // Add the 3 days that triggered the wave
        for (let j = i - 2; j <= i; j++) {
          currentWave.dailyData.push({
            date: sortedData[j].date.value,
            prDiscounted: parseFloat(sortedData[j].pr_discounted_products) || 0,
            discountDepth: parseFloat(sortedData[j].discount_depth) || 0,
            totalProducts: parseInt(sortedData[j].total_products) || 0,
            discountedProducts: parseInt(sortedData[j].discounted_products) || 0
          });
        }
      } else if (currentWave) {
        // Continue existing wave
        currentWave.dailyData.push({
          date: dayData.date.value,
          prDiscounted: prDiscounted,
          discountDepth: parseFloat(dayData.discount_depth) || 0,
          totalProducts: parseInt(dayData.total_products) || 0,
          discountedProducts: parseInt(dayData.discounted_products) || 0
        });
      }
    } else {
      consecutiveAboveThreshold = 0;
      consecutiveBelowThreshold++;
      
      if (currentWave) {
        // Add this day to current wave (it's part of potential gap)
        currentWave.dailyData.push({
          date: dayData.date.value,
          prDiscounted: prDiscounted,
          discountDepth: parseFloat(dayData.discount_depth) || 0,
          totalProducts: parseInt(dayData.total_products) || 0,
          discountedProducts: parseInt(dayData.discounted_products) || 0
        });
        
        // End wave if gap exceeds 3 days
        if (consecutiveBelowThreshold > 3) {
          // Remove the gap days from the wave
          currentWave.dailyData = currentWave.dailyData.slice(0, -(consecutiveBelowThreshold));
          currentWave.endDate = currentWave.dailyData[currentWave.dailyData.length - 1].date;
          currentWave.isOngoing = false;
          waves.push(currentWave);
          currentWave = null;
        }
      }
    }
  }
  
  // Close any ongoing wave
  if (currentWave) {
    // Remove trailing days below threshold (up to 3)
    while (currentWave.dailyData.length > 0 && 
           currentWave.dailyData[currentWave.dailyData.length - 1].prDiscounted < 0.1) {
      currentWave.dailyData.pop();
    }
    
    if (currentWave.dailyData.length > 0) {
      currentWave.endDate = currentWave.dailyData[currentWave.dailyData.length - 1].date;
      currentWave.isOngoing = true; // Ongoing if it extends to the last data point
      waves.push(currentWave);
    }
  }
  
  return waves;
}

function getLogarithmicHeight(prDiscounted) {
  // Logarithmic scaling: 0.1 = ~30%, 1.0 = 100%
  if (prDiscounted < 0.1) return 0;
  if (prDiscounted >= 1.0) return 100;
  
  // Use log scale: log(x + offset) to prevent negative values
  const minVal = 0.1;
  const maxVal = 1.0;
  const minHeight = 30;
  const maxHeight = 100;
  
  const logMin = Math.log(minVal + 1);
  const logMax = Math.log(maxVal + 1);
  const logVal = Math.log(prDiscounted + 1);
  
  const height = minHeight + ((logVal - logMin) / (logMax - logMin)) * (maxHeight - minHeight);
  return Math.max(minHeight, Math.min(maxHeight, height));
}

function getDiscountDepthColor(discountDepth) {
  // Gradient from light to dark based on discount depth
  // 0% = light blue, 100% = dark blue
  if (discountDepth <= 0) return 'rgba(102, 126, 234, 0.3)';
  if (discountDepth >= 100) return 'rgba(25, 40, 120, 1)';
  
  const lightness = 70 - (discountDepth * 0.5); // 70 to 20
  return `hsl(230, 70%, ${lightness}%)`;
}

function createSmoothWavePath(dailyData, dateToX, maxHeight, yOffset) {
  if (!dailyData || dailyData.length === 0) return '';
  
  const points = dailyData.map(day => {
    const x = dateToX[day.date];
    if (x === undefined) return null;
    const heightPercent = getLogarithmicHeight(day.prDiscounted);
    const y = yOffset + maxHeight - (maxHeight * heightPercent / 100);
    return { x, y, heightPercent };
  }).filter(p => p !== null);
  
  if (points.length === 0) return '';
  
  // Start path from bottom-left corner
  let path = `M ${points[0].x} ${yOffset + maxHeight}`;
  
  // Draw vertical line to first point
  path += ` L ${points[0].x} ${points[0].y}`;
  
  // Create smooth Catmull-Rom spline through points
  if (points.length === 1) {
    // Single point - just draw a small curve
    path += ` L ${points[0].x} ${points[0].y}`;
  } else if (points.length === 2) {
    // Two points - simple curve
    path += ` Q ${points[0].x} ${points[0].y}, ${(points[0].x + points[1].x) / 2} ${(points[0].y + points[1].y) / 2}`;
    path += ` T ${points[1].x} ${points[1].y}`;
  } else {
    // Multiple points - smooth spline
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      // Calculate control points for smooth curve
      const cp1x = current.x + (next.x - current.x) / 3;
      const cp1y = current.y;
      const cp2x = current.x + 2 * (next.x - current.x) / 3;
      const cp2y = next.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
  }
  
  // Close path at bottom-right corner
  const lastPoint = points[points.length - 1];
  path += ` L ${lastPoint.x} ${yOffset + maxHeight}`;
  path += ' Z';
  
  return path;
}

function createWaveOutlinePath(dailyData, dateToX, maxHeight, yOffset) {
  if (!dailyData || dailyData.length === 0) return '';
  
  const points = dailyData.map(day => {
    const x = dateToX[day.date];
    if (x === undefined) return null;
    const heightPercent = getLogarithmicHeight(day.prDiscounted);
    const y = yOffset + maxHeight - (maxHeight * heightPercent / 100);
    return { x, y };
  }).filter(p => p !== null);
  
  if (points.length === 0) return '';
  
  let path = `M ${points[0].x} ${points[0].y}`;
  
  if (points.length === 1) {
    return path;
  } else if (points.length === 2) {
    path += ` Q ${points[0].x} ${points[0].y}, ${(points[0].x + points[1].x) / 2} ${(points[0].y + points[1].y) / 2}`;
    path += ` T ${points[1].x} ${points[1].y}`;
  } else {
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      
      const cp1x = current.x + (next.x - current.x) / 3;
      const cp1y = current.y;
      const cp2x = current.x + 2 * (next.x - current.x) / 3;
      const cp2y = next.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
  }
  
  return path;
}

async function renderCalendarChart(dateRange = 30) {
  const container = document.getElementById('pmpWavesCalendarChart');
  if (!container) return;
  
  console.log('[PMPromos] Rendering calendar chart...');
  
  // Show loading state
  container.innerHTML = '<div class="pmp-wave-loading">Loading calendar data...</div>';
  
  // Load historical data
  const companiesData = await loadHistoricalPricingData();
  
  if (companiesData.length === 0) {
    container.innerHTML = '<div class="pmp-no-waves">No historical data available</div>';
    return;
  }
  
// Load company stats for rank and market share
const companyStats = await loadAllCompanyStats();

// Process waves for each company and enrich with stats (initial pass)
const companyWavesTemp = [];
for (const companyData of companiesData) {
  const waves = detectPromoWaves(companyData.historical_data);
  const isActive = companyData.promo_wave === true || companyData.promo_wave === 'true';
  
  if (waves.length > 0) {
    const stats = companyStats[companyData.source] || {};
    companyWavesTemp.push({
      company: companyData.source,
      waves: waves,
      rank: stats.rank || null,
      marketShare: stats.marketShare || null,
      isActive: isActive
    });
  }
}

// Find the most recent date in the data
let mostRecentDate = new Date();
mostRecentDate.setHours(0, 0, 0, 0);

for (const companyData of companiesData) {
  if (companyData.historical_data && companyData.historical_data.length > 0) {
    const companyDates = companyData.historical_data.map(d => new Date(d.date.value));
    const companyMaxDate = new Date(Math.max(...companyDates));
    if (companyMaxDate > mostRecentDate || mostRecentDate.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]) {
      mostRecentDate = companyMaxDate;
    }
  }
}

// Calculate start date based on the most recent date in the data
const endDate = new Date(mostRecentDate);
endDate.setHours(0, 0, 0, 0);
const startDate = new Date(endDate);
startDate.setDate(startDate.getDate() - (dateRange - 1));

console.log('[PMPromos] Date range:', startDate.toISOString().split('T')[0], 'to', endDate.toISOString().split('T')[0]);

// NOW filter waves by date range for ended waves
const companyWaves = companyWavesTemp.map(companyData => {
  let filteredWaves = companyData.waves;
  
  // For ended waves, only include waves that overlap with the selected date range
  if (!companyData.isActive && showEndedWaves) {
    filteredWaves = companyData.waves.filter(wave => {
      if (!wave.endDate) return false;
      const waveEndDate = new Date(wave.endDate);
      waveEndDate.setHours(0, 0, 0, 0);
      return waveEndDate >= startDate && waveEndDate <= endDate;
    });
  }
  
  return {
    ...companyData,
    waves: filteredWaves
  };
}).filter(companyData => companyData.waves.length > 0); // Remove companies with no waves in range

if (companyWaves.length === 0) {
  container.innerHTML = '<div class="pmp-no-waves">No promo waves detected in selected date range</div>';
  return;
}

// Get wave data for sorting
const waveData = createPromosWavesChart.__getWaveData?.() || [];

// Sort companies by selected column or default order
if (currentSortColumn && (currentSortColumn === 'rank' || currentSortColumn === 'marketShare')) {
  companyWaves.sort((a, b) => {
    let aVal = a[currentSortColumn];
    let bVal = b[currentSortColumn];
    
    // Handle null values
    if (aVal === null) return 1;
    if (bVal === null) return -1;
    
    return currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });
} else {
  // Default: sort by same order as discount depth chart
  const waveData = createPromosWavesChart.__getWaveData?.() || [];
  companyWaves.sort((a, b) => {
    const aWave = waveData.find(w => w.company === a.company);
    const bWave = waveData.find(w => w.company === b.company);
    if (!aWave || !bWave) return 0;
    return bWave.discountDepth - aWave.discountDepth;
  });
}
  
// Create calendar HTML
const html = createCalendarChartHTML(companyWaves, startDate, endDate, dateRange);
  container.innerHTML = html;
  
  // Initialize tooltips
  initializeCalendarTooltips();
  // Initialize date range selector
initializeDateRangeSelector();
  
  console.log('[PMPromos] Calendar chart rendered successfully');
}

function assignCompanyColors(companyWaves) {
  // Beautiful color palette - each company gets a unique vibrant color
  const colorPalette = [
    { main: '#FF6B6B', light: '#FF8E8E', dark: '#E85555' }, // Red
    { main: '#4ECDC4', light: '#6FD9D1', dark: '#3DB8AF' }, // Teal
    { main: '#FFD93D', light: '#FFE066', dark: '#E6C334' }, // Yellow
    { main: '#6C5CE7', light: '#8B7BED', dark: '#5849C9' }, // Purple
    { main: '#00D2FF', light: '#33DBFF', dark: '#00B8E6' }, // Cyan
    { main: '#FF85A2', light: '#FFA3B8', dark: '#E6738B' }, // Pink
    { main: '#A8E6CF', light: '#BFEDDA', dark: '#8FD4B8' }, // Mint
    { main: '#FFA07A', light: '#FFB599', dark: '#E68E6E' }, // Coral
    { main: '#98D8C8', light: '#AEDFD2', dark: '#82C2B3' }, // Seafoam
    { main: '#F7DC6F', light: '#F9E389', dark: '#DEC65D' }, // Gold
    { main: '#BB8FCE', light: '#CBA5DB', dark: '#A87BBD' }, // Lavender
    { main: '#85C1E2', light: '#9DCFE9', dark: '#6FADC9' }, // Sky Blue
    { main: '#F8B739', light: '#F9C55C', dark: '#DFA333' }, // Orange
    { main: '#52B788', light: '#6DC898', dark: '#48A379' }, // Green
    { main: '#E07A5F', light: '#E6957F', dark: '#C96D52' }  // Terracotta
  ];

    // Grey palette for ended waves
  const greyPalette = [
    { main: '#B0B0B0', light: '#C8C8C8', dark: '#909090' },
    { main: '#A0A0A0', light: '#B8B8B8', dark: '#808080' },
    { main: '#989898', light: '#B0B0B0', dark: '#787878' },
    { main: '#888888', light: '#A0A0A0', dark: '#686868' },
    { main: '#909090', light: '#A8A8A8', dark: '#707070' }
  ];
  
  const companyColorMap = {};
  companyWaves.forEach((companyData, index) => {
    // Use grey for ended waves, vibrant colors for active waves
    if (companyData.isActive === false) {
      companyColorMap[companyData.company] = greyPalette[index % greyPalette.length];
    } else {
      companyColorMap[companyData.company] = colorPalette[index % colorPalette.length];
    }
  });
  
  return companyColorMap;
}

function createCalendarChartHTML(companyWaves, startDate, endDate, dateRange) {
// Calculate responsive dimensions
const companyNameWidth = 180;
const rankWidth = 70;
const marketShareWidth = 90;
const labelWidth = companyNameWidth + rankWidth + marketShareWidth; // Total: 340px
const rowHeight = 70;
const rowPadding = 10;
const headerHeight = 80;

// Get container width - use parent width for accurate measurement
const calendarContainer = document.getElementById('pmpWavesCalendarChart');
const containerWidth = calendarContainer ? calendarContainer.offsetWidth : 1200;

// Calculate available width for chart (minus label width and padding)
const padding = 40; // Total horizontal padding
const availableWidth = Math.max(600, containerWidth - labelWidth - padding);

// Calculate day width to fill available space exactly
const dayWidth = availableWidth / dateRange;

const chartWidth = availableWidth; // Use all available width
  const chartHeight = (companyWaves.length * rowHeight);
  
  console.log('[PMPromos] Calendar dimensions:', {
    containerWidth,
    availableWidth,
    dateRange,
    dayWidth,
    chartWidth
  });
  
  // Assign unique colors to companies
  const companyColors = assignCompanyColors(companyWaves);
  
  // Build date to X position mapping
  const dateToX = {};
  const dateArray = [];
  for (let i = 0; i < dateRange; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split('T')[0];
    dateToX[dateStr] = i * dayWidth + dayWidth / 2;
    dateArray.push({ date: date, dateStr: dateStr, x: i * dayWidth });
  }
  
  const today = endDate.toISOString().split('T')[0];
  
  let html = `
    <div class="pmp-calendar-wrapper">
      <!-- Date Range Selector -->
      <div class="pmp-calendar-controls">
        <label>Date Range:</label>
        <select id="pmpCalendarRange" class="pmp-calendar-range-select">
          <option value="7" ${dateRange === 7 ? 'selected' : ''}>Last 7 days</option>
          <option value="14" ${dateRange === 14 ? 'selected' : ''}>Last 14 days</option>
          <option value="30" ${dateRange === 30 ? 'selected' : ''}>Last 30 days</option>
          <option value="60" ${dateRange === 60 ? 'selected' : ''}>Last 60 days</option>
          <option value="90" ${dateRange === 90 ? 'selected' : ''}>Last 90 days</option>
        </select>
      </div>
      
      <div class="pmp-calendar-chart-container-inner">
        <svg width="${chartWidth + labelWidth}" height="${chartHeight + headerHeight}" class="pmp-calendar-svg">
          <defs>
            <!-- Weekend pattern -->
            <pattern id="weekendPattern" patternUnits="userSpaceOnUse" width="${dayWidth}" height="${rowHeight}">
              <rect width="${dayWidth}" height="${rowHeight}" fill="rgba(0,0,0,0.02)"/>
            </pattern>
            
            <!-- Gradient definitions for each company -->
            ${companyWaves.map((companyData, index) => {
              const color = companyColors[companyData.company];
              return `
                <linearGradient id="gradient_${index}" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:${color.light};stop-opacity:0.9" />
                  <stop offset="100%" style="stop-color:${color.main};stop-opacity:0.95" />
                </linearGradient>
                <filter id="shadow_${index}" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                  <feOffset dx="0" dy="2" result="offsetblur"/>
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.3"/>
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              `;
            }).join('')}
          </defs>
          
          <!-- Calendar Grid Background -->
          <g class="pmp-calendar-grid" transform="translate(${labelWidth}, ${headerHeight})">
  `;
  
  // Draw calendar grid
  dateArray.forEach((dateObj, index) => {
    const isWeekend = dateObj.date.getDay() === 0 || dateObj.date.getDay() === 6;
    const isToday = dateObj.dateStr === today;
    const isMonthStart = dateObj.date.getDate() === 1;
    const isWeekStart = dateObj.date.getDay() === 1;
    
    // Weekend shading
    if (isWeekend) {
      html += `<rect x="${dateObj.x}" y="0" width="${dayWidth}" height="${chartHeight}" fill="url(#weekendPattern)"/>`;
    }
    
    // Day divider
    html += `<line x1="${dateObj.x}" y1="0" x2="${dateObj.x}" y2="${chartHeight}" stroke="rgba(0,0,0,0.04)" stroke-width="0.5"/>`;
    
    // Week separator (stronger)
    if (isWeekStart && index > 0) {
      html += `<line x1="${dateObj.x}" y1="0" x2="${dateObj.x}" y2="${chartHeight}" stroke="rgba(0,0,0,0.1)" stroke-width="1.5"/>`;
    }
    
    // Month boundary (strongest)
    if (isMonthStart) {
      html += `<line x1="${dateObj.x}" y1="0" x2="${dateObj.x}" y2="${chartHeight}" stroke="rgba(102,126,234,0.3)" stroke-width="2.5"/>`;
    }
    
    // Today marker
    if (isToday) {
      html += `
        <line x1="${dateObj.x + dayWidth/2}" y1="-10" x2="${dateObj.x + dayWidth/2}" y2="${chartHeight}" stroke="#FF4444" stroke-width="2" stroke-dasharray="5,5" opacity="0.7"/>
        <circle cx="${dateObj.x + dayWidth/2}" cy="-5" r="4" fill="#FF4444"/>
      `;
    }
  });
  
  html += `</g>`;
  
  // Draw X-axis labels - adjust frequency based on date range
  html += `<g class="pmp-calendar-xaxis" transform="translate(${labelWidth}, ${headerHeight - 35})">`;
  const labelFrequency = dateRange <= 14 ? 1 : (dateRange <= 30 ? 3 : 7);
  dateArray.forEach((dateObj, index) => {
    const isMonthStart = dateObj.date.getDate() === 1;
    const showLabel = index === 0 || isMonthStart || index % labelFrequency === 0;
    
    if (showLabel) {
      const label = dateObj.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fontSize = dateRange > 60 ? 9 : 10;
      html += `<text x="${dateObj.x + dayWidth/2}" y="0" text-anchor="middle" font-size="${fontSize}" font-weight="500" fill="#666">${label}</text>`;
    }
  });
  html += `</g>`;

// Column headers for company info
html += `<g class="pmp-calendar-column-headers" transform="translate(0, 20)">`;
html += `<text x="${companyNameWidth - 10}" y="0" text-anchor="end" font-size="10" font-weight="600" fill="#888" text-transform="uppercase">COMPANY</text>`;
html += `<text x="${companyNameWidth + rankWidth/2}" y="0" text-anchor="middle" font-size="10" font-weight="600" fill="#888" text-transform="uppercase">RANK</text>`;
html += `<text x="${companyNameWidth + rankWidth + marketShareWidth/2}" y="0" text-anchor="middle" font-size="10" font-weight="600" fill="#888" text-transform="uppercase">MARKET<tspan x="${companyNameWidth + rankWidth + marketShareWidth/2}" dy="12">SHARE</tspan></text>`;
html += `</g>`;

// Month labels at top
html += `<g class="pmp-calendar-months" transform="translate(${labelWidth}, 20)">`;
  let lastMonth = null;
  let monthStartX = 0;
  dateArray.forEach((dateObj, index) => {
    const monthYear = dateObj.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (monthYear !== lastMonth) {
      if (lastMonth !== null) {
        // Draw month label at the center of the month span
        const monthCenterX = monthStartX + (dateObj.x - monthStartX) / 2;
        html += `<text x="${monthCenterX}" y="0" font-size="13" font-weight="700" fill="#333" text-anchor="middle">${lastMonth}</text>`;
      }
      monthStartX = dateObj.x;
      lastMonth = monthYear;
    }
  });
  // Draw last month label
  if (lastMonth !== null) {
    const monthCenterX = monthStartX + (chartWidth - monthStartX) / 2;
    html += `<text x="${monthCenterX}" y="0" font-size="13" font-weight="700" fill="#333" text-anchor="middle">${lastMonth}</text>`;
  }
  html += `</g>`;
  
// Draw company rows and waves
companyWaves.forEach((companyData, rowIndex) => {
  const y = rowIndex * rowHeight + rowPadding;
  const effectiveRowHeight = rowHeight - (rowPadding * 2);
  const centerY = headerHeight + y + effectiveRowHeight/2;
  
  // Company label with color indicator
  const color = companyColors[companyData.company];
  html += `
    <g transform="translate(0, ${centerY})">
      <rect x="${companyNameWidth - 170}" y="-8" width="4" height="16" fill="${color.main}" rx="2"/>
      <text x="${companyNameWidth - 10}" y="0" text-anchor="end" alignment-baseline="middle" font-size="13" font-weight="600" fill="#333">${companyData.company}</text>
    </g>
  `;
  
  // Rank box
  const rankBoxSize = 50;
  const rankX = companyNameWidth + (rankWidth - rankBoxSize) / 2;
  const rankY = centerY - rankBoxSize / 2;
  
  html += `
    <defs>
      <linearGradient id="rankGradient_${rowIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
        <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
      </linearGradient>
    </defs>
    <g transform="translate(${rankX}, ${rankY})">
      <rect width="${rankBoxSize}" height="${rankBoxSize}" rx="8" fill="url(#rankGradient_${rowIndex})" filter="drop-shadow(0 2px 6px rgba(102, 126, 234, 0.3))"/>
      <text x="${rankBoxSize/2}" y="${rankBoxSize/2}" text-anchor="middle" alignment-baseline="central" font-size="20" font-weight="900" fill="white">${companyData.rank !== null ? companyData.rank : '—'}</text>
    </g>
  `;
  
  // Market share circle with water fill
  const circleSize = 55;
  const circleX = companyNameWidth + rankWidth + (marketShareWidth - circleSize) / 2;
  const circleY = centerY;
  const circleRadius = circleSize / 2;
  const marketSharePercent = companyData.marketShare !== null ? companyData.marketShare : 0;
  const fillHeight = circleRadius * 2 * Math.min(1, marketSharePercent / 50); // Scale for visibility
  
  html += `
    <g transform="translate(${circleX + circleRadius}, ${circleY})">
      <defs>
        <clipPath id="circleClip_${rowIndex}">
          <circle r="${circleRadius}" cx="0" cy="0"/>
        </clipPath>
        <linearGradient id="waterGradient_${rowIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" style="stop-color:#007aff;stop-opacity:0.5" />
          <stop offset="50%" style="stop-color:#0056b3;stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:#003d82;stop-opacity:0.5" />
        </linearGradient>
      </defs>
      
      <!-- Water fill -->
      <rect x="${-circleRadius}" y="${circleRadius - fillHeight}" width="${circleRadius * 2}" height="${fillHeight}" 
            fill="url(#waterGradient_${rowIndex})" clip-path="url(#circleClip_${rowIndex})"/>
      
      <!-- Circle border -->
      <circle r="${circleRadius}" cx="0" cy="0" fill="none" stroke="#007aff" stroke-width="2" filter="drop-shadow(0 2px 6px rgba(0, 122, 255, 0.2))"/>
      
      <!-- Market share text -->
      <text x="0" y="0" text-anchor="middle" alignment-baseline="central" font-size="13" font-weight="800" fill="#007aff">${companyData.marketShare !== null ? companyData.marketShare.toFixed(1) + '%' : '—'}</text>
    </g>
  `;
    
    // Row separator line
    html += `<line x1="${labelWidth}" y1="${headerHeight + rowIndex * rowHeight}" x2="${chartWidth + labelWidth}" y2="${headerHeight + rowIndex * rowHeight}" stroke="rgba(0,0,0,0.06)" stroke-width="1"/>`;
    
    // Draw waves for this company
    companyData.waves.forEach((wave, waveIndex) => {
      const waveGroup = createWaveSVGGroup(wave, dateToX, y, effectiveRowHeight, dayWidth, rowIndex, color);
      html += `<g class="pmp-wave-group" data-company="${companyData.company}" data-wave-index="${waveIndex}" transform="translate(${labelWidth}, ${headerHeight})">${waveGroup}</g>`;
    });
  });
  
  html += `
        </svg>
      </div>
      
      <!-- Tooltip -->
      <div id="pmpCalendarTooltip" class="pmp-calendar-tooltip"></div>
    </div>
  `;
  
  return html;
}

function createWaveSVGGroup(wave, dateToX, yOffset, maxHeight, dayWidth, companyIndex, color) {
  let svg = '';
  
  // Create smooth path with rounded corners
  const path = createSmoothWavePath(wave.dailyData, dateToX, maxHeight, yOffset);
  
  if (!path) return svg;
  
  // Draw shadow layer first
  svg += `
    <path 
      d="${path}" 
      fill="${color.main}"
      opacity="0.15"
      transform="translate(0, 4)"
      class="pmp-wave-shadow"
    />
  `;
  
  // Draw main gradient-filled wave with rounded appearance
  svg += `
    <path 
      d="${path}" 
      fill="url(#gradient_${companyIndex})"
      filter="url(#shadow_${companyIndex})"
      class="pmp-wave-main-path"
      data-company-index="${companyIndex}"
    />
  `;
  
// Draw individual day segments for hover interaction (invisible but interactive)
wave.dailyData.forEach((day, index) => {
  const x = dateToX[day.date];
  
  // Skip if date is outside the current date range
  if (x === undefined) return;
  
  const heightPercent = getLogarithmicHeight(day.prDiscounted);
  const height = maxHeight * heightPercent / 100;
  
  svg += `
    <rect 
      x="${x - dayWidth/2}" 
      y="${yOffset + maxHeight - height}" 
      width="${dayWidth}" 
      height="${height}" 
      fill="transparent"
      class="pmp-wave-day-segment"
      data-date="${day.date}"
      data-pr-discounted="${day.prDiscounted}"
      data-discount-depth="${day.discountDepth}"
      data-total-products="${day.totalProducts}"
      data-discounted-products="${day.discountedProducts}"
      style="cursor: pointer;"
    />
  `;
});
  
  // Draw smooth curve outline on top for polish
  svg += `
    <path 
      d="${createWaveOutlinePath(wave.dailyData, dateToX, maxHeight, yOffset)}" 
      fill="none" 
      stroke="${color.dark}" 
      stroke-width="2.5"
      stroke-linecap="round"
      stroke-linejoin="round"
      opacity="0.6"
      class="pmp-wave-outline"
    />
  `;
  
// Ongoing wave indicator with animation
if (wave.isOngoing) {
  const lastDay = wave.dailyData[wave.dailyData.length - 1];
  const lastX = dateToX[lastDay.date];
  
  // Only render if the last day is within the current date range
  if (lastX !== undefined) {
    const lastHeight = maxHeight * getLogarithmicHeight(lastDay.prDiscounted) / 100;
    
    svg += `
      <g class="pmp-wave-ongoing-indicator">
        <line 
          x1="${lastX + dayWidth/2}" 
          y1="${yOffset + maxHeight - lastHeight}" 
          x2="${lastX + dayWidth/2}" 
          y2="${yOffset + maxHeight}"
          stroke="#FF4444" 
          stroke-width="3"
          stroke-dasharray="6,4"
          opacity="0.8"
        />
        <circle 
          cx="${lastX + dayWidth/2}" 
          cy="${yOffset + maxHeight - lastHeight}" 
          r="5" 
          fill="#FF4444"
          opacity="0.9"
        >
          <animate attributeName="r" values="5;7;5" dur="1.5s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.5s" repeatCount="indefinite"/>
        </circle>
      </g>
    `;
  }
}
  
  return svg;
}

function initializeCalendarTooltips() {
  const tooltip = document.getElementById('pmpCalendarTooltip');
  if (!tooltip) return;
  
  const daySegments = document.querySelectorAll('.pmp-wave-day-segment');
  
  daySegments.forEach(segment => {
    segment.addEventListener('mouseenter', function(e) {
      const date = this.getAttribute('data-date');
      const prDiscounted = parseFloat(this.getAttribute('data-pr-discounted'));
      const discountDepth = parseFloat(this.getAttribute('data-discount-depth'));
      const totalProducts = parseInt(this.getAttribute('data-total-products'));
      const discountedProducts = parseInt(this.getAttribute('data-discounted-products'));
      
      const waveGroup = this.closest('.pmp-wave-group');
      const company = waveGroup.getAttribute('data-company');
      
      const dateObj = new Date(date);
      const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      tooltip.innerHTML = `
        <div class="pmp-tooltip-header">${company}</div>
        <div class="pmp-tooltip-date">${formattedDate}</div>
        <div class="pmp-tooltip-row">
          <span class="pmp-tooltip-label">Discount Depth:</span>
          <span class="pmp-tooltip-value">${discountDepth.toFixed(1)}%</span>
        </div>
        <div class="pmp-tooltip-row">
          <span class="pmp-tooltip-label">Products Discounted:</span>
          <span class="pmp-tooltip-value">${(prDiscounted * 100).toFixed(1)}%</span>
        </div>
        <div class="pmp-tooltip-row">
          <span class="pmp-tooltip-label">Discounted Products:</span>
          <span class="pmp-tooltip-value">${discountedProducts} / ${totalProducts}</span>
        </div>
      `;
      
      tooltip.style.display = 'block';
      positionTooltip(e, tooltip);
    });
    
    segment.addEventListener('mousemove', function(e) {
      positionTooltip(e, tooltip);
    });
    
    segment.addEventListener('mouseleave', function() {
      tooltip.style.display = 'none';
    });
  });
}

function positionTooltip(event, tooltip) {
  const tooltipWidth = tooltip.offsetWidth;
  const tooltipHeight = tooltip.offsetHeight;
  
  let left = event.pageX + 15;
  let top = event.pageY + 15;
  
  // Prevent tooltip from going off-screen
  if (left + tooltipWidth > window.innerWidth) {
    left = event.pageX - tooltipWidth - 15;
  }
  
  if (top + tooltipHeight > window.innerHeight) {
    top = event.pageY - tooltipHeight - 15;
  }
  
  tooltip.style.left = left + 'px';
  tooltip.style.top = top + 'px';
}

function initializeDateRangeSelector() {
  const selector = document.getElementById('pmpCalendarRange');
  if (!selector) {
    console.warn('[PMPromos] Date range selector not found');
    return;
  }
  
  // Remove any existing listeners
  const newSelector = selector.cloneNode(true);
  selector.parentNode.replaceChild(newSelector, selector);
  
  newSelector.addEventListener('change', async function() {
    const days = parseInt(this.value);
    console.log('[PMPromos] Date range changed to:', days, 'days');
    
    // Clear the container first
    const container = document.getElementById('pmpWavesCalendarChart');
    if (container) {
      container.innerHTML = '<div class="pmp-wave-loading">Loading calendar data...</div>';
    }
    
    // Re-render with new date range
    await renderCalendarChart(days);
    
    // Re-initialize the selector after render
    initializeDateRangeSelector();
  });
  
  console.log('[PMPromos] Date range selector initialized');
}

function calculatePromoWaveEndDate(historicalData) {
  if (!historicalData || historicalData.length === 0) {
    return null;
  }
  
  // Sort by date descending (most recent first)
  const sortedData = [...historicalData].sort((a, b) => {
    const dateA = new Date(a.date.value);
    const dateB = new Date(b.date.value);
    return dateB - dateA;
  });
  
  // Find the last period where pr_discounted_products >= 0.1 for at least 3 consecutive days
  let consecutiveDays = 0;
  let endDate = null;
  
  for (let i = sortedData.length - 1; i >= 0; i--) {
    const prDiscounted = parseFloat(sortedData[i].pr_discounted_products) || 0;
    
    if (prDiscounted >= 0.1) {
      consecutiveDays++;
      if (consecutiveDays >= 3) {
        // Update end date to the most recent date in this qualifying period
        endDate = sortedData[i].date.value;
      }
    } else {
      // Reset if we hit a day below threshold
      if (consecutiveDays >= 3) {
        // We found a valid period, keep the endDate
        break;
      }
      consecutiveDays = 0;
      endDate = null;
    }
  }
  
  return endDate;
}

function calculateDaysAgo(dateStr) {
  if (!dateStr) return null;
  
  const endDate = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = today - endDate;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

async function createPromosWavesChart(allData) {
  // Filter for active promo waves
  const activePromoWaves = allData.filter(row => 
    row.source !== 'all' && 
    row.q === 'all' && 
    (row.promo_wave === true || row.promo_wave === 'true')
  );

  // Filter for ended promo waves (only if toggle is ON)
  let endedPromoWaves = [];
  if (showEndedWaves) {
    endedPromoWaves = allData.filter(row => 
      row.source !== 'all' && 
      row.q === 'all' && 
      (row.promo_wave === false || row.promo_wave === 'false') &&
      parseFloat(row.promo_wave_length) > 0 // Has had a promo wave in the past
    );
  }

  console.log('[PMPromos] Active promo waves:', activePromoWaves.length);
  console.log('[PMPromos] Ended promo waves:', endedPromoWaves.length);

  // Update count
  const countEl = document.getElementById('pmpWavesCount');
  if (countEl) {
    const totalCount = activePromoWaves.length + endedPromoWaves.length;
    countEl.textContent = showEndedWaves ? 
      `${activePromoWaves.length} Active, ${endedPromoWaves.length} Ended` : 
      `${activePromoWaves.length} Active`;
  }

  const container = document.getElementById('pmpWavesChart');
  if (!container || (activePromoWaves.length === 0 && endedPromoWaves.length === 0)) {
    if (container) {
      container.innerHTML = '<div class="pmp-no-waves">No active promo waves</div>';
    }
    return;
  }

  // Load company stats data
  const companyStats = await loadAllCompanyStats();

// Prepare active waves data
  const activeWaveData = activePromoWaves.map(wave => {
    const stats = companyStats[wave.source] || {};
    return {
      company: wave.source,
      rank: stats.rank || null,
      marketShare: stats.marketShare || null,
      waveLength: parseInt(wave.promo_wave_length) || 0,
      discountDepth: parseFloat(wave.promo_wave_discount_depth) || 0,
      discountedPercent: parseFloat(wave.promo_wave_pr_discounted_products) * 100 || 0,
      isActive: true
    };
  });

  // Prepare ended waves data
  const endedWaveData = endedPromoWaves.map(wave => {
    const stats = companyStats[wave.source] || {};
    const endDate = calculatePromoWaveEndDate(wave.historical_data);
    const daysAgo = calculateDaysAgo(endDate);
    
    return {
      company: wave.source,
      rank: stats.rank || null,
      marketShare: stats.marketShare || null,
      waveLength: parseInt(wave.promo_wave_length) || 0,
      discountDepth: parseFloat(wave.promo_wave_discount_depth) || 0,
      discountedPercent: parseFloat(wave.promo_wave_pr_discounted_products) * 100 || 0,
      isActive: false,
      endDate: endDate,
      daysAgo: daysAgo
    };
  });

  // Apply sorting if a column is selected
  if (currentSortColumn) {
    const sortFn = (a, b) => {
      let aVal = a[currentSortColumn];
      let bVal = b[currentSortColumn];
      
      // Handle null values - push to end
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      // Sort numbers
      const diff = currentSortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      return diff;
    };
    
    activeWaveData.sort(sortFn);
    endedWaveData.sort(sortFn);
  } else {
    // Default sort by discount depth (descending)
    activeWaveData.sort((a, b) => b.discountDepth - a.discountDepth);
    endedWaveData.sort((a, b) => b.discountDepth - a.discountDepth);
  }

  // Combine data: active first, then ended
  const allWaveData = [...activeWaveData, ...endedWaveData];

  // Store for calendar chart access
  createPromosWavesChart.__getWaveData = () => allWaveData;

renderPromosWavesList(allWaveData, activeWaveData.length);
  
  // Initialize sorting handlers AFTER the list is rendered
  initializeSortingHandlers(allData);
  
  initializeWavesModeSwitch();
  initializeEndedWavesToggle(allData);
}

function initializeSortingHandlers(allData) {
  const sortableHeaders = document.querySelectorAll('.pmp-column-header.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const sortColumn = this.getAttribute('data-sort');
      
      // Toggle direction if clicking the same column, otherwise default to desc
      if (currentSortColumn === sortColumn) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        currentSortColumn = sortColumn;
        currentSortDirection = 'desc'; // Default to descending (best first)
      }
      
      // Update visual indicators
      sortableHeaders.forEach(h => h.classList.remove('active-sort'));
      this.classList.add('active-sort');
      
      // Update sort indicator
      const indicator = this.querySelector('.pmp-sort-indicator');
      sortableHeaders.forEach(h => {
        const ind = h.querySelector('.pmp-sort-indicator');
        ind.textContent = '';
      });
      indicator.textContent = currentSortDirection === 'asc' ? '▲' : '▼';
      
// Re-render with sorted data
      const depthChart = document.getElementById('pmpWavesChart');
      const calendarChart = document.getElementById('pmpWavesCalendarChart');
      
      if (depthChart && depthChart.classList.contains('active')) {
        // Re-render discount depth view with sorting
        createPromosWavesChart(allData);
        // Note: initializeSortingHandlers will be called again inside createPromosWavesChart
      }
      
      if (calendarChart && calendarChart.classList.contains('active')) {
        // Re-render calendar view with sorting
        const rangeSelect = document.getElementById('pmpCalendarRange');
        const dateRange = rangeSelect ? parseInt(rangeSelect.value) : 30;
        renderCalendarChart(dateRange);
      }
    });
  });
}

function initializeWavesModeSwitch() {
  const depthBtn = document.getElementById('pmpModeDepth');
  const calendarBtn = document.getElementById('pmpModeCalendar');
  const depthChart = document.getElementById('pmpWavesChart');
  const calendarChart = document.getElementById('pmpWavesCalendarChart');
  
  if (!depthBtn || !calendarBtn || !depthChart || !calendarChart) {
    console.warn('[PMPromos] Mode switcher elements not found');
    return;
  }
  
  // Depth mode button click
  depthBtn.addEventListener('click', function() {
    if (this.classList.contains('active')) return;
    
    // Switch active states
    depthBtn.classList.add('active');
    calendarBtn.classList.remove('active');
    
    // Show depth chart, hide calendar
    depthChart.classList.add('active');
    depthChart.classList.remove('hidden');
    calendarChart.classList.remove('active');
    
    console.log('[PMPromos] Switched to Discount Depth mode');
  });
  
  // Calendar mode button click
  calendarBtn.addEventListener('click', function() {
    if (this.classList.contains('active')) return;
    
    // Switch active states
    calendarBtn.classList.add('active');
    depthBtn.classList.remove('active');
    
    // Show calendar, hide depth chart
    calendarChart.classList.add('active');
    depthChart.classList.remove('active');
    depthChart.classList.add('hidden');
    
    console.log('[PMPromos] Switched to Calendar mode');
    
    // Render calendar chart if not already rendered
    renderCalendarChart();
  });
}

function initializeEndedWavesToggle(allData) {
  const toggle = document.getElementById('pmpEndedWavesToggle');
  if (!toggle) {
    console.warn('[PMPromos] Ended waves toggle not found');
    return;
  }

  // Set initial state
  toggle.checked = showEndedWaves;

  // Remove existing listeners
  const newToggle = toggle.cloneNode(true);
  toggle.parentNode.replaceChild(newToggle, toggle);

  newToggle.addEventListener('change', async function() {
    showEndedWaves = this.checked;
    console.log('[PMPromos] Ended waves toggle changed:', showEndedWaves);

    // Refresh the current view
    const depthChart = document.getElementById('pmpWavesChart');
    const calendarChart = document.getElementById('pmpWavesCalendarChart');
    
    if (depthChart && depthChart.classList.contains('active')) {
      // Refresh discount depth view
      await createPromosWavesChart(allData);
    }
    
    if (calendarChart && calendarChart.classList.contains('active')) {
      // Refresh calendar view
      const rangeSelect = document.getElementById('pmpCalendarRange');
      const dateRange = rangeSelect ? parseInt(rangeSelect.value) : 30;
      await renderCalendarChart(dateRange);
    }
  });

  console.log('[PMPromos] Ended waves toggle initialized');
}

function renderPromosWavesList(displayData, activeCount) {
  const container = document.getElementById('pmpWavesChart');
  if (!container) return;

  // Fixed x-axis at 100%
  const fixedMax = 100;
  const scaleSteps = [0, 25, 50, 75, 100];

  // X-axis
  let xAxisHtml = '<div class="pmp-waves-xaxis">';
  scaleSteps.forEach(step => {
    const position = (step / fixedMax) * 100;
    xAxisHtml += `<span class="pmp-xaxis-tick" style="left: ${position}%">${step}%</span>`;
  });
  xAxisHtml += '</div>';

  // Create the list with column headers and x-axis
  let html = `
    <div class="pmp-waves-wrapper">
<!-- Column Headers -->
      <div class="pmp-waves-column-headers">
        <div class="pmp-column-header company">Company</div>
        <div class="pmp-column-header sortable" data-sort="rank" id="pmpSortRank">
          Rank
          <span class="pmp-sort-indicator"></span>
        </div>
        <div class="pmp-column-header sortable" data-sort="marketShare" id="pmpSortMarketShare">
          Market<br/>Share
          <span class="pmp-sort-indicator"></span>
        </div>
        <div class="pmp-column-header sortable" data-sort="discountedPercent" id="pmpSortDiscountedPercent">
          % of disc.<br/>products
          <span class="pmp-sort-indicator"></span>
        </div>
        <div class="pmp-column-header discount-bar">Discount Depth</div>
      </div>
      
      <div class="pmp-waves-xaxis-label">Discount Depth</div>
      ${xAxisHtml}
      <div class="pmp-waves-list">
  `;

  displayData.forEach((wave, index) => {
    // Add separator between active and ended waves
    if (index === activeCount && activeCount > 0 && index < displayData.length) {
      html += `
        <div class="pmp-waves-separator">
          <span class="pmp-separator-line"></span>
          <span class="pmp-separator-text">Ended Promo Waves</span>
          <span class="pmp-separator-line"></span>
        </div>
      `;
    }

    const barWidth = Math.max((wave.discountDepth / fixedMax) * 100, 1);
    
    // Calculate donut chart angle
    const donutAngle = (wave.discountedPercent / 100) * 360;

    // Determine bar color based on active/ended status
    const barGradient = wave.isActive ? 
      'linear-gradient(90deg, rgba(102, 126, 234, 0.5), rgba(102, 126, 234, 0.7))' :
      'linear-gradient(90deg, rgba(255, 107, 107, 0.4), rgba(255, 107, 107, 0.6))';
    
    const barHoverGradient = wave.isActive ?
      'linear-gradient(90deg, rgba(102, 126, 234, 0.6), rgba(102, 126, 234, 0.8))' :
      'linear-gradient(90deg, rgba(255, 107, 107, 0.5), rgba(255, 107, 107, 0.7))';

    html += `
      <div class="pmp-wave-item ${wave.isActive ? '' : 'pmp-wave-ended'}" data-company="${wave.company}" data-is-active="${wave.isActive}">
        <div class="pmp-wave-company" title="${wave.company}">${wave.company}</div>
        
        <!-- Rank Column -->
        <div class="pmp-wave-rank">
          ${wave.rank !== null ? wave.rank : '—'}
        </div>
        
        <!-- Market Share Column -->
        <div class="pmp-wave-market">
          <div class="pmp-wave-market-fill" style="height: ${wave.marketShare !== null ? Math.min(100, Math.max(0, wave.marketShare * 2)) : 0}%"></div>
          <span class="pmp-wave-market-value">${wave.marketShare !== null ? wave.marketShare.toFixed(1) + '%' : '—'}</span>
        </div>
        
        <!-- Discounted % Column (Donut Chart) -->
        <div class="pmp-wave-donut-container">
          <div class="pmp-wave-donut" style="--percentage: ${donutAngle}deg;">
            <span class="pmp-wave-donut-value">${wave.discountedPercent.toFixed(1)}%</span>
          </div>
        </div>
        
        <!-- Discount Depth Bar -->
        <div class="pmp-wave-bar-container">
          <div class="pmp-wave-bar-fill" style="width: ${barWidth}%; background: ${barGradient};" data-hover-gradient="${barHoverGradient}">
            <div class="pmp-wave-metrics">
              <span class="pmp-wave-discount">${wave.discountDepth.toFixed(1)}%</span>
              <span class="pmp-wave-separator">|</span>
              <span class="pmp-wave-duration">${wave.waveLength}d</span>
              ${!wave.isActive && wave.daysAgo !== null ? `
                <span class="pmp-wave-separator">|</span>
                <span class="pmp-wave-ended-label">Ended ${wave.daysAgo}d ago</span>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div>'; // Close pmp-waves-list and pmp-waves-wrapper

  container.innerHTML = html;

// Add click listeners to rows for expansion
container.querySelectorAll('.pmp-wave-item').forEach(item => {
  item.addEventListener('click', function(e) {
    const company = this.getAttribute('data-company');
    console.log('[PMPromos] Wave clicked:', company);
    toggleWaveExpansion(this, company);
  });
  
  // Add hover effect for ended waves
  const isActive = item.getAttribute('data-is-active') === 'true';
  if (!isActive) {
    const barFill = item.querySelector('.pmp-wave-bar-fill');
    if (barFill) {
      const hoverGradient = barFill.getAttribute('data-hover-gradient');
      
      item.addEventListener('mouseenter', function() {
        barFill.style.background = hoverGradient;
      });
      
      item.addEventListener('mouseleave', function() {
        const originalGradient = 'linear-gradient(90deg, rgba(255, 107, 107, 0.4), rgba(255, 107, 107, 0.6))';
        barFill.style.background = originalGradient;
      });
    }
  }
});
}

// Global state for expanded rows
let expandedWaveCompany = null;

async function loadWaveCompanyProducts(companyName) {
  try {
    // Get table prefix
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}processed`;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('projectData')) {
          console.error('[PMPromos] projectData object store not found');
          db.close();
          resolve([]);
          return;
        }
        
        const transaction = db.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        const getRequest = objectStore.get(tableName);
        
        getRequest.onsuccess = function() {
          const result = getRequest.result;
          db.close();
          
          if (!result || !result.data) {
            console.warn('[PMPromos] No processed data found');
            resolve([]);
            return;
          }
          
          // Get unique products for this company with discounts only
          const productMap = new Map();
          
          result.data.forEach(row => {
            if (row.source && row.source === companyName) {
              // Check if product has a discount
              const oldPriceValue = row.old_price ? 
                (typeof row.old_price === 'string' ? 
                  parseFloat(row.old_price.replace(/[^0-9.-]/g, '')) : 
                  parseFloat(row.old_price)) : null;
              const priceValue = typeof row.price === 'string' ? 
                parseFloat(row.price.replace(/[^0-9.-]/g, '')) : 
                parseFloat(row.price);
              
              const hasDiscount = oldPriceValue && priceValue && 
                                 !isNaN(priceValue) && !isNaN(oldPriceValue) && 
                                 oldPriceValue > priceValue;
              
              if (hasDiscount) {
                const key = `${row.title}_${row.source}`;
                
                if (!productMap.has(key)) {
                  productMap.set(key, row);
                } else {
                  // Prioritize mobile over desktop
                  const existing = productMap.get(key);
                  if (row.device === 'mobile' && existing.device === 'desktop') {
                    productMap.set(key, row);
                  }
                }
              }
            }
          });
          
          // Convert to array and sort by discount depth
          const products = Array.from(productMap.values()).sort((a, b) => {
            const discountA = calculateProductDiscount(a);
            const discountB = calculateProductDiscount(b);
            return discountB - discountA;
          });
          
          resolve(products);
        };
        
        getRequest.onerror = function() {
          console.error('[PMPromos] Error getting processed data:', getRequest.error);
          db.close();
          resolve([]);
        };
      };
      
      request.onerror = function() {
        console.error('[PMPromos] Failed to open database:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('[PMPromos] Error loading company products:', error);
    return [];
  }
}

function calculateProductDiscount(product) {
  const oldPriceValue = product.old_price ? 
    (typeof product.old_price === 'string' ? 
      parseFloat(product.old_price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(product.old_price)) : null;
  const priceValue = typeof product.price === 'string' ? 
    parseFloat(product.price.replace(/[^0-9.-]/g, '')) : 
    parseFloat(product.price);
  
  if (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue) && oldPriceValue > priceValue) {
    return Math.round((1 - priceValue / oldPriceValue) * 100);
  }
  return 0;
}

function getBucketClassName(bucketNum) {
  const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
  return bucketClasses[bucketNum] || 'mid';
}

function getBucketName(bucketNum) {
  const bucketNames = ['', 'ULTRA CHEAP', 'BUDGET', 'MID RANGE', 'UPPER MID', 'PREMIUM', 'ULTRA PREMIUM'];
  return bucketNames[bucketNum] || 'MID RANGE';
}

function renderWaveProductsInExpanded(products, container) {
  if (!products || products.length === 0) {
    container.innerHTML = '<div class="pmp-wave-no-products">No discounted products found</div>';
    return;
  }
  
  let html = '';
  
  products.forEach(product => {
    const title = product.title || 'Untitled Product';
    const priceValue = typeof product.price === 'string' ? 
      parseFloat(product.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(product.price);
    const oldPriceValue = product.old_price ? 
      (typeof product.old_price === 'string' ? 
        parseFloat(product.old_price.replace(/[^0-9.-]/g, '')) : 
        parseFloat(product.old_price)) : null;
    
    const price = !isNaN(priceValue) ? `$${priceValue.toFixed(2)}` : '—';
    const oldPrice = oldPriceValue && !isNaN(oldPriceValue) ? `$${oldPriceValue.toFixed(2)}` : null;
    const thumbnail = product.thumbnail || '';
    const discountPercent = calculateProductDiscount(product);
    
    // Get bucket info
    const bucketNum = product.price_bucket || 3;
    const bucketClass = getBucketClassName(bucketNum);
    const bucketName = getBucketName(bucketNum);
    
    html += `
      <div class="pmp-wave-product-card">
        <div class="pmp-wave-product-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
          ${discountPercent > 0 ? `<div class="pmp-wave-product-discount-badge">-${discountPercent}%</div>` : ''}
        </div>
        <div class="pmp-wave-product-info">
          <div class="pmp-wave-product-title">${title}</div>
          <div class="pmp-wave-product-prices">
            <span class="pmp-wave-product-current-price">${price}</span>
            ${oldPrice ? `<span class="pmp-wave-product-old-price">${oldPrice}</span>` : ''}
          </div>
          <div class="pmp-wave-product-bucket ${bucketClass}">
            ${bucketName}
          </div>
        </div>
      </div>
    `;
  });
  
  container.innerHTML = html;
}

async function loadWaveCompanyBucketData(companyName, allData) {
  // Get company's overall data
  const companyData = allData.find(row => 
    row.source === companyName && row.q === 'all'
  );
  
  if (!companyData) {
    return null;
  }
  
  // Get total company products count
  const totalCompanyProducts = parseInt(companyData.unique_total_products) || 0;
  
  // Load discounted products to calculate discounted bucket distribution
  const discountedProducts = await loadWaveCompanyProducts(companyName);
  
  // Count discounted products by bucket
  const discountedBucketCounts = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
  };
  
  discountedProducts.forEach(product => {
    const bucket = parseInt(product.price_bucket) || 3;
    if (bucket >= 1 && bucket <= 6) {
      discountedBucketCounts[bucket]++;
    }
  });
  
  // Build buckets array with both discounted and overall data
  const buckets = [
    {
      name: 'Ultra Premium',
      tier: 6,
      range: companyData.price_range?.[5],
      totalCount: parseInt(companyData.ultra_premium_bucket) || 0,
      totalShare: parseFloat(companyData.ultra_premium_bucket_share) || 0,
      discountedCount: discountedBucketCounts[6],
      color: '#9C27B0'
    },
    {
      name: 'Premium',
      tier: 5,
      range: companyData.price_range?.[4],
      totalCount: parseInt(companyData.premium_bucket) || 0,
      totalShare: parseFloat(companyData.premium_bucket_share) || 0,
      discountedCount: discountedBucketCounts[5],
      color: '#7B1FA2'
    },
    {
      name: 'Upper Mid',
      tier: 4,
      range: companyData.price_range?.[3],
      totalCount: parseInt(companyData.upper_mid_bucket) || 0,
      totalShare: parseFloat(companyData.upper_mid_bucket_share) || 0,
      discountedCount: discountedBucketCounts[4],
      color: '#FFC107'
    },
    {
      name: 'Mid Range',
      tier: 3,
      range: companyData.price_range?.[2],
      totalCount: parseInt(companyData.mid_bucket) || 0,
      totalShare: parseFloat(companyData.mid_bucket_share) || 0,
      discountedCount: discountedBucketCounts[3],
      color: '#FF9800'
    },
    {
      name: 'Budget',
      tier: 2,
      range: companyData.price_range?.[1],
      totalCount: parseInt(companyData.budget_bucket) || 0,
      totalShare: parseFloat(companyData.budget_bucket_share) || 0,
      discountedCount: discountedBucketCounts[2],
      color: '#66BB6A'
    },
    {
      name: 'Ultra Cheap',
      tier: 1,
      range: companyData.price_range?.[0],
      totalCount: parseInt(companyData.ultra_cheap_bucket) || 0,
      totalShare: parseFloat(companyData.ultra_cheap_bucket_share) || 0,
      discountedCount: discountedBucketCounts[1],
      color: '#4CAF50'
    }
  ];
  
  // Calculate discounted percentage as: (discounted in bucket / ALL company products) × 100
  buckets.forEach(bucket => {
    bucket.discountedShare = totalCompanyProducts > 0 ? 
      (bucket.discountedCount / totalCompanyProducts) : 0;
  });
  
  return buckets;
}

function renderWaveBucketsDistribution(buckets, container) {
  if (!buckets) {
    container.innerHTML = '<div class="pmp-wave-no-products">No bucket data available</div>';
    return;
  }
  
  let html = '<div class="pmp-wave-buckets-body">';
  
  buckets.forEach(bucket => {
    const discountedPercent = (bucket.discountedShare * 100).toFixed(1);
    const totalPercent = (bucket.totalShare * 100).toFixed(1);
    
    html += `
      <div class="pmp-wave-bucket-row">
        <div class="pmp-wave-bucket-label">
          <div class="pmp-wave-bucket-name">
            <span class="pmp-wave-bucket-indicator" style="background: ${bucket.color}"></span>
            <span>${bucket.name}</span>
          </div>
          <div class="pmp-wave-bucket-count">
            ${bucket.discountedCount} / ${bucket.totalCount}
          </div>
        </div>
        
        <!-- Left Column: Discounted (Right to Left) -->
        <div class="pmp-wave-butterfly-left">
          <div class="pmp-wave-bar-row">
            <div class="pmp-wave-bar-container">
              <div class="pmp-wave-bar-fill" style="width: ${Math.max(1, discountedPercent)}%; background: ${bucket.color};"></div>
              <span class="pmp-wave-bar-percent">${discountedPercent}%</span>
            </div>
          </div>
        </div>
        
        <!-- Right Column: All Products (Left to Right) -->
        <div class="pmp-wave-butterfly-right">
          <div class="pmp-wave-bar-row">
            <div class="pmp-wave-bar-container">
              <div class="pmp-wave-bar-fill" style="width: ${Math.max(1, totalPercent)}%; background: linear-gradient(90deg, ${bucket.color}, ${bucket.color}80);"></div>
              <span class="pmp-wave-bar-percent">${totalPercent}%</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  
  container.innerHTML = html;
}

async function toggleWaveExpansion(waveItem, company) {
  const isCurrentlyExpanded = waveItem.classList.contains('expanded');
  
  // Close any other expanded rows
  document.querySelectorAll('.pmp-wave-item.expanded').forEach(item => {
    if (item !== waveItem) {
      item.classList.remove('expanded');
      const expandedContainer = item.querySelector('.pmp-wave-expanded-products');
      if (expandedContainer) {
        expandedContainer.remove();
      }
    }
  });
  
  if (isCurrentlyExpanded) {
    // Collapse this row
    waveItem.classList.remove('expanded');
    const expandedContainer = waveItem.querySelector('.pmp-wave-expanded-products');
    if (expandedContainer) {
      setTimeout(() => {
        expandedContainer.remove();
      }, 300);
    }
    expandedWaveCompany = null;
  } else {
    // Expand this row
    waveItem.classList.add('expanded');
    expandedWaveCompany = company;
    
    // Create expanded container with two sections
    const expandedContainer = document.createElement('div');
    expandedContainer.className = 'pmp-wave-expanded-products';
    expandedContainer.innerHTML = `
      <div class="pmp-wave-buckets-container">
        <div class="pmp-wave-loading">Loading bucket distribution...</div>
      </div>
      <div class="pmp-wave-expanded-content">
        <div class="pmp-wave-loading">Loading products...</div>
      </div>
    `;
    
    waveItem.appendChild(expandedContainer);
    
    // Load and render bucket distribution
    const data = await window.pmUtils.loadCompanyPricingData();
    if (data && data.allData) {
      const buckets = await loadWaveCompanyBucketData(company, data.allData);
      const bucketsContainer = expandedContainer.querySelector('.pmp-wave-buckets-container');
      renderWaveBucketsDistribution(buckets, bucketsContainer);
    }
    
    // Load and render products
    const products = await loadWaveCompanyProducts(company);
    const contentContainer = expandedContainer.querySelector('.pmp-wave-expanded-content');
    renderWaveProductsInExpanded(products, contentContainer);
  }
}

  function addPromosStyles() {
    if (document.getElementById('pmpStyles')) return;

    const styles = `
      <style id="pmpStyles">
      /* Promos Container */
      .pm-promos-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
        padding: 20px 0;
      }

/* Promo Stats Section */
.pmp-stats-section {
  display: flex;
  gap: 10px;
}

/* Company Overview Card */
.pmp-company-overview-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  position: relative;
  overflow: hidden;
  width: 420px;
  height: 200px;
  box-sizing: border-box;
}

.pmp-company-overview-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #667eea, #764ba2);
}

.pmp-company-name-header {
  height: 80px;
  width: 140px;
  font-size: 14px;
  font-weight: 800;
  color: #ffffff;
  text-align: center;
  padding: 0 10px;
  background: linear-gradient(135deg, #2c3e50 0%, #34495e 50%, #2c3e50 100%);
  border-radius: 12px;
  border: 1px solid #1a252f;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 
    0 4px 8px rgba(0,0,0,0.2),
    0 1px 3px rgba(0,0,0,0.3),
    inset 0 1px 0 rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.pmp-rank-container,
.pmp-market-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.pmp-section-label {
  font-size: 10px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pmp-big-rank-box {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.pmp-big-market-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 900;
  color: #007aff;
  background: white;
  border: 3px solid #007aff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
}

.pmp-market-water-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%);
  transition: height 0.5s ease;
  z-index: 0;
  border-radius: 50%;
  opacity: 0.5;
}

.pmp-market-value-text {
  position: relative;
  z-index: 1;
}

      .pmp-stat-item {
        background: white;
        border-radius: 12px;
        padding: 16px;
        flex: 1;
        display: flex;
        align-items: center;
        gap: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        overflow: hidden;
        transition: transform 0.2s;
        min-height: 120px;
      }

      .pmp-stat-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.12);
      }

      .pmp-stat-item::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }

      .pmp-stat-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .pmp-stat-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: auto auto;
        gap: 12px 20px;
      }

      .pmp-stat-cell {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .pmp-stat-cell .pmp-stat-val {
        font-size: 18px;
        font-weight: 700;
        color: #2c2c2c;
        line-height: 1;
      }

      .pmp-stat-cell .pmp-stat-lbl {
        font-size: 10px;
        color: #888;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        font-weight: 500;
      }

      .pmp-stat-main {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }

      .pmp-stat-main .pmp-stat-val {
        font-size: 32px;
        font-weight: bold;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        line-height: 1;
      }

      .pmp-stat-main .pmp-stat-lbl {
        font-size: 11px;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
      }

      .pmp-stat-secondary {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid #f0f0f0;
      }

      .pmp-stat-subtitle {
        font-size: 13px;
        color: #666;
        font-weight: 600;
      }

      .pmp-stat-extra {
        font-size: 11px;
        color: #999;
      }

      /* Promo Waves Container */
      .pmp-waves-container {
        background: white;
        border-radius: 12px;
        padding: 24px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        display: flex;
        flex-direction: column;
        min-height: 500px;
      }

      .pmp-waves-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }

      .pmp-waves-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 20px;
      }

      .pmp-waves-header h4 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #2c2c2c;
      }

      .pmp-waves-count {
        font-size: 12px;
        padding: 4px 12px;
        background: #e3f2fd;
        color: #1976d2;
        border-radius: 12px;
        font-weight: 600;
      }

      /* Mode Switcher */
.pmp-waves-mode-switcher {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  padding: 3px;
  gap: 3px;
}

.pmp-mode-btn {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pmp-mode-btn:hover {
  color: #333;
}

.pmp-mode-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

/* Calendar Chart Container */
.pmp-waves-calendar-chart {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  display: none;
}

.pmp-waves-calendar-chart.active {
  display: block;
}

.pmp-waves-chart.active {
  display: block;
}

.pmp-waves-chart.hidden {
  display: none;
}

      .pmp-waves-chart {
        flex: 1;
        overflow-y: auto;
        overflow-x: hidden;
      }

      .pmp-no-waves {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: #999;
        font-size: 14px;
        background: #fafafa;
        border-radius: 8px;
      }

      /* Waves Wrapper */
.pmp-waves-wrapper {
  position: relative;
  padding-top: 75px;
}

      /* X-Axis Label */
.pmp-waves-xaxis-label {
  position: absolute;
  top: 30px;
  left: 470px;
  right: 0;
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
  text-align: center;
  padding-bottom: 4px;
}

      /* Column Headers */
.pmp-waves-column-headers {
  position: absolute;
  top: 20px;
  left: 0;
  right: 0;
  display: grid;
  grid-template-columns: 180px 70px 90px 90px 1fr;
  gap: 10px;
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e0e0e0;
  background: white;
  z-index: 10;
}

.pmp-column-header {
  text-align: center;
  padding: 0 5px;
  line-height: 1.2;
}

.pmp-column-header.company {
  text-align: right;
  padding-right: 15px;
}

.pmp-column-header.discount-bar {
  padding-left: 430px;
  text-align: center;
}

      /* X-Axis Scale */
.pmp-waves-xaxis {
  position: absolute;
  top: 65px;
  left: 470px;
  right: 15px;
  height: 25px;
  border-bottom: 2px solid #e0e0e0;
}

      .pmp-xaxis-tick {
        position: absolute;
        font-size: 11px;
        color: #666;
        font-weight: 500;
        transform: translateX(-50%);
        padding-top: 4px;
      }

      .pmp-xaxis-tick::before {
        content: '';
        position: absolute;
        top: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 2px;
        height: 6px;
        background: #bdbdbd;
      }

      /* Waves List */
      .pmp-waves-list {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding-top: 20px;
      }

.pmp-wave-item {
  display: grid;
  grid-template-columns: 180px 70px 90px 90px 1fr;
  align-items: center;
  min-height: 50px;
  gap: 10px;
        font-size: 12px;
        position: relative;
        cursor: pointer;
        transition: background 0.2s;
        border-radius: 8px;
        padding: 4px 0;
      }

      .pmp-wave-item:hover {
        background: #f5f8fa;
      }

      /* Grid lines */
.pmp-wave-item::before {
  content: '';
  position: absolute;
  left: 470px;
  right: 0;
        height: 100%;
        background: repeating-linear-gradient(
          90deg,
          transparent,
          transparent calc(25% - 0.5px),
          rgba(0, 0, 0, 0.03) calc(25% - 0.5px),
          rgba(0, 0, 0, 0.03) calc(25% + 0.5px)
        );
        pointer-events: none;
      }

.pmp-wave-company {
  padding-right: 15px;
  color: #333;
  font-weight: 600;
  text-align: right;
  font-size: 12px;
  line-height: 1.3;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

/* Mini Rank Box */
.pmp-wave-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  font-size: 20px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 2px 6px rgba(102, 126, 234, 0.3);
  margin: 0 auto;
}

/* Mini Market Share Circle */
.pmp-wave-market {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55px;
  height: 55px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 800;
  color: #007aff;
  background: white;
  border: 2px solid #007aff;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 6px rgba(0, 122, 255, 0.2);
  margin: 0 auto;
}

.pmp-wave-market-fill {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #003d82 0%, #0056b3 50%, #007aff 100%);
  transition: height 0.5s ease;
  z-index: 0;
  border-radius: 50%;
  opacity: 0.5;
}

.pmp-wave-market-value {
  position: relative;
  z-index: 1;
}

/* Donut Chart for Discounted % */
.pmp-wave-donut-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  margin: 0 auto;
  position: relative;
}

.pmp-wave-donut {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: conic-gradient(
    #667eea 0deg,
    #667eea var(--percentage),
    #e0e0e0 var(--percentage),
    #e0e0e0 360deg
  );
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pmp-wave-donut::before {
  content: '';
  position: absolute;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: white;
  z-index: 1;
}

.pmp-wave-donut-value {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: 700;
  color: #667eea;
}

      .pmp-wave-bar-container {
        position: relative;
        height: 32px;
        background: #f5f8fa;
        border-radius: 6px;
        overflow: hidden;
      }

      .pmp-wave-bar-fill {
        height: 100%;
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.5), rgba(102, 126, 234, 0.7));
        border-radius: 6px;
        position: relative;
        display: flex;
        align-items: center;
        transition: all 0.3s ease;
        min-width: fit-content;
      }

      .pmp-wave-item:hover .pmp-wave-bar-fill {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.6), rgba(102, 126, 234, 0.8));
        transform: translateX(2px);
      }

      .pmp-wave-metrics {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 12px;
        white-space: nowrap;
        font-size: 11px;
        color: #1565c0;
        font-weight: 600;
      }

      .pmp-wave-discount {
        font-weight: 700;
        font-size: 13px;
        color: #0d47a1;
      }

      .pmp-wave-separator {
        color: rgba(13, 71, 161, 0.3);
        font-weight: 300;
      }

      .pmp-wave-duration {
        color: #1976d2;
        padding: 2px 6px;
        background: rgba(255, 255, 255, 0.7);
        border-radius: 4px;
        font-weight: 700;
        font-size: 11px;
      }

      /* Expanded Row Styles */
.pmp-wave-item {
  transition: margin-bottom 0.3s ease;
}

.pmp-wave-item.expanded {
  margin-bottom: 320px;
}

.pmp-wave-item.expanded .pmp-wave-bar-fill {
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.7), rgba(102, 126, 234, 0.9));
}

/* Expanded Products Container */
.pmp-wave-expanded-products {
  position: absolute;
  top: calc(100% + 10px);
  left: 0px;
  right: 0;
  height: 0;
  opacity: 0;
  visibility: hidden;
  display: flex;
  gap: 15px;
  transition: height 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;
  z-index: 50;
}

.pmp-wave-item.expanded .pmp-wave-expanded-products {
  height: 300px;
  opacity: 1;
  visibility: visible;
}

.pmp-wave-expanded-content {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  overflow-x: auto;
  overflow-y: hidden;
  padding: 16px;
  display: flex;
  gap: 12px;
}

.pmp-wave-expanded-content::-webkit-scrollbar {
  height: 8px;
}

.pmp-wave-expanded-content::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.pmp-wave-expanded-content::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.pmp-wave-expanded-content::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* Buckets Distribution Container */
.pmp-wave-buckets-container {
  width: 460px;
  flex-shrink: 0;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.pmp-wave-buckets-container::-webkit-scrollbar {
  width: 6px;
}

.pmp-wave-buckets-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.pmp-wave-buckets-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.pmp-wave-buckets-body {
  display: flex;
  flex-direction: column;
}

.pmp-wave-bucket-row {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  gap: 10px;
  align-items: center;
  padding: 6px 8px;
  border-radius: 6px;
  transition: background 0.2s;
}

.pmp-wave-bucket-row:hover {
  background: #fafafa;
}

.pmp-wave-bucket-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pmp-wave-bucket-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
}

.pmp-wave-bucket-indicator {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.pmp-wave-bucket-count {
  font-size: 9px;
  color: #888;
  padding-left: 16px;
}

/* Butterfly bar columns */
.pmp-wave-butterfly-bars {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 10px;
}

.pmp-wave-butterfly-left,
.pmp-wave-butterfly-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pmp-wave-butterfly-left .pmp-wave-bar-container {
  direction: rtl;
}

.pmp-wave-butterfly-left .pmp-wave-bar-fill {
  float: right;
}

.pmp-wave-butterfly-right .pmp-wave-bar-container {
  direction: ltr;
}

.pmp-wave-butterfly-divider {
  width: 1px;
  height: 40px;
  background: #e0e0e0;
  margin: 0 4px;
}

.pmp-wave-bar-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pmp-wave-bar-container {
  flex: 1;
  height: 20px;
  position: relative;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.pmp-wave-bar-fill {
  height: 100%;
  position: relative;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.85;
}

.pmp-wave-bar-percent {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 9px;
  font-weight: 600;
  color: #444;
  z-index: 2;
}

.pmp-wave-butterfly-left .pmp-wave-bar-percent {
  left: 6px;
  right: auto;
}

.pmp-wave-butterfly-right .pmp-wave-bar-percent {
  right: 6px;
  left: auto;
}

/* Product Card Styles for Expanded View */
.pmp-wave-product-card {
  width: 200px;
  flex-shrink: 0;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
  transition: all 0.2s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
}

.pmp-wave-product-card:hover {
  background: #fff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transform: translateY(-2px);
}

.pmp-wave-product-image {
  width: 200px;
  height: 150px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #f5f5f5;
  position: relative;
  flex-shrink: 0;
}

.pmp-wave-product-discount-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  background: #ff4444;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.pmp-wave-product-info {
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

.pmp-wave-product-title {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
  min-height: 32px;
}

.pmp-wave-product-prices {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pmp-wave-product-current-price {
  font-size: 16px;
  font-weight: 700;
  color: #ff4444;
}

.pmp-wave-product-old-price {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
}

.pmp-wave-product-bucket {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  margin-top: auto;
}

.pmp-wave-product-bucket.ultra-cheap { background: #4CAF50; }
.pmp-wave-product-bucket.budget { background: #66BB6A; }
.pmp-wave-product-bucket.mid { background: #FF9800; }
.pmp-wave-product-bucket.upper-mid { background: #FFC107; }
.pmp-wave-product-bucket.premium { background: #7B1FA2; }
.pmp-wave-product-bucket.ultra-premium { background: #9C27B0; }

.pmp-wave-no-products {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 14px;
}

/* Loading state */
.pmp-wave-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: #999;
  font-size: 14px;
}

      /* Scrollbar styling */
      .pmp-waves-chart::-webkit-scrollbar {
        width: 8px;
      }

      .pmp-waves-chart::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }

      .pmp-waves-chart::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }

      .pmp-waves-chart::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

/* ==================== CALENDAR CHART STYLES ==================== */

.pmp-calendar-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pmp-calendar-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px 8px 0 0;
  border-bottom: 1px solid #e0e0e0;
}

.pmp-calendar-controls label {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pmp-calendar-range-select {
  padding: 6px 12px;
  border: 1px solid #d0d0d0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  background: white;
  cursor: pointer;
  transition: all 0.2s;
}

.pmp-calendar-range-select:hover {
  border-color: #667eea;
}

.pmp-calendar-range-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.pmp-calendar-chart-container {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  background: white;
  padding: 20px;
}

.pmp-calendar-chart-container-inner {
  width: 100%;
  overflow: visible;
  min-width: 100%;
}

.pmp-calendar-chart-container::-webkit-scrollbar {
  width: 10px;
}

.pmp-calendar-chart-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.pmp-calendar-chart-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.pmp-calendar-chart-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.pmp-calendar-svg {
  display: block;
  width: 100%; /* Make SVG responsive */
  height: auto;
}

.pmp-wave-day-segment {
  cursor: pointer;
  transition: opacity 0.2s;
}

.pmp-wave-day-segment:hover {
  opacity: 1 !important;
  stroke: rgba(102, 126, 234, 1);
  stroke-width: 1;
}

.pmp-wave-outline {
  pointer-events: none;
}

.pmp-wave-ongoing {
  pointer-events: none;
}

/* Enhanced Wave Styling */
.pmp-wave-main-path {
  cursor: pointer;
  transition: opacity 0.2s ease, filter 0.2s ease;
}

.pmp-wave-main-path:hover {
  opacity: 0.85;
  filter: brightness(1.1) url(#shadow_0);
}

.pmp-wave-shadow {
  pointer-events: none;
}

.pmp-wave-outline {
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.pmp-wave-group:hover .pmp-wave-outline {
  opacity: 0.9;
}

.pmp-wave-ongoing-indicator {
  pointer-events: none;
}

/* Enhanced tooltip */
.pmp-calendar-tooltip {
  position: fixed;
  display: none;
  background: white;
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.1);
  padding: 14px 18px;
  z-index: 10000;
  min-width: 240px;
  pointer-events: none;
  border: 1px solid rgba(0,0,0,0.08);
}

.pmp-tooltip-header {
  font-size: 15px;
  font-weight: 700;
  color: #222;
  margin-bottom: 6px;
  padding-bottom: 10px;
  border-bottom: 2px solid #E0E0E0;
}

.pmp-tooltip-date {
  font-size: 12px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 600;
}

.pmp-tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.pmp-tooltip-label {
  color: #666;
  font-weight: 500;
}

.pmp-tooltip-value {
  color: #222;
  font-weight: 700;
  background: #F5F5F5;
  padding: 2px 8px;
  border-radius: 4px;
}

/* Toggle Switch Styles */
.pmp-ended-waves-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.pmp-toggle-label {
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pmp-toggle-switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  cursor: pointer;
}

.pmp-toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.pmp-toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  border-radius: 24px;
  transition: 0.3s;
}

.pmp-toggle-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  border-radius: 50%;
  transition: 0.3s;
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.pmp-toggle-switch input:checked + .pmp-toggle-slider {
  background-color: #667eea;
}

.pmp-toggle-switch input:checked + .pmp-toggle-slider:before {
  transform: translateX(20px);
}

.pmp-toggle-switch input:focus + .pmp-toggle-slider {
  box-shadow: 0 0 1px #667eea;
}

/* Separator Styles */
.pmp-waves-separator {
  display: flex;
  align-items: center;
  gap: 15px;
  margin: 20px 0;
  padding: 0 20px;
}

.pmp-separator-line {
  flex: 1;
  height: 2px;
  background: linear-gradient(90deg, transparent, #e0e0e0, transparent);
}

.pmp-separator-text {
  font-size: 12px;
  font-weight: 700;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 6px 16px;
  background: #f5f5f5;
  border-radius: 16px;
  white-space: nowrap;
}

/* Ended Wave Styles */
.pmp-wave-item.pmp-wave-ended .pmp-wave-company {
  color: #888;
}

.pmp-wave-item.pmp-wave-ended .pmp-wave-metrics {
  color: #c43a3a;
}

.pmp-wave-item.pmp-wave-ended .pmp-wave-discount {
  color: #c43a3a;
}

.pmp-wave-item.pmp-wave-ended .pmp-wave-duration {
  color: #c43a3a;
  background: rgba(255, 255, 255, 0.8);
}

.pmp-wave-ended-label {
  color: #c43a3a;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  font-weight: 700;
  font-size: 11px;
  font-style: italic;
}

.pmp-wave-item.pmp-wave-ended:hover {
  background: #fff5f5;
}

/* Sortable column headers */
.pmp-column-header.sortable {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  position: relative;
  padding-right: 18px;
}

.pmp-column-header.sortable:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  border-radius: 4px;
}

.pmp-column-header.sortable.active-sort {
  color: #667eea;
  font-weight: 700;
}

.pmp-sort-indicator {
  position: absolute;
  right: 4px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #667eea;
  opacity: 0.7;
}

.pmp-column-header.sortable:hover .pmp-sort-indicator {
  opacity: 1;
}
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  console.log('[PMPromos] Module loaded successfully');
})();
