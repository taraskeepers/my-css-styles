// price_monitoring_promos.js - Promotions Dashboard Module
(function() {
  'use strict';
  
  console.log('[PMPromos] Module loading...');

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
          <span class="pmp-waves-count" id="pmpWavesCount">0 Active</span>
        </div>
        <div class="pmp-waves-chart" id="pmpWavesChart">
          <!-- Chart will be rendered here -->
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

async function createPromosWavesChart(allData) {
  // Filter for active promo waves
  const promoWaves = allData.filter(row => 
    row.source !== 'all' && 
    row.q === 'all' && 
    (row.promo_wave === true || row.promo_wave === 'true')
  );

  console.log('[PMPromos] Active promo waves:', promoWaves.length);

  // Update count
  const countEl = document.getElementById('pmpWavesCount');
  if (countEl) {
    countEl.textContent = `${promoWaves.length} Active`;
  }

  const container = document.getElementById('pmpWavesChart');
  if (!container || promoWaves.length === 0) {
    if (container) {
      container.innerHTML = '<div class="pmp-no-waves">No active promo waves</div>';
    }
    return;
  }

  // Load company stats data
  const companyStats = await loadAllCompanyStats();

  // Prepare and sort data by discount depth (highest first)
  const waveData = promoWaves.map(wave => {
    const stats = companyStats[wave.source] || {};
    return {
      company: wave.source,
      rank: stats.rank || null,
      marketShare: stats.marketShare || null,
      waveLength: parseInt(wave.promo_wave_length) || 0,
      discountDepth: parseFloat(wave.promo_wave_discount_depth) || 0,
      discountedPercent: parseFloat(wave.promo_wave_pr_discounted_products) * 100 || 0
    };
  }).sort((a, b) => b.discountDepth - a.discountDepth);

  renderPromosWavesList(waveData);
}

function renderPromosWavesList(displayData) {
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
      <div class="pmp-column-header">Rank</div>
      <div class="pmp-column-header">Market<br/>Share</div>
      <div class="pmp-column-header">% of disc.<br/>products</div>
      <div class="pmp-column-header discount-bar">Discount Depth</div>
    </div>
    
    <div class="pmp-waves-xaxis-label">Discount Depth</div>
    ${xAxisHtml}
    <div class="pmp-waves-list">
`;

  displayData.forEach((wave) => {
    const barWidth = Math.max((wave.discountDepth / fixedMax) * 100, 1);
    
    // Calculate donut chart angle
    const donutAngle = (wave.discountedPercent / 100) * 360;

    html += `
      <div class="pmp-wave-item" data-company="${wave.company}">
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
          <div class="pmp-wave-bar-fill" style="width: ${barWidth}%">
            <div class="pmp-wave-metrics">
              <span class="pmp-wave-discount">${wave.discountDepth.toFixed(1)}%</span>
              <span class="pmp-wave-separator">|</span>
              <span class="pmp-wave-duration">${wave.waveLength}d</span>
            </div>
          </div>
        </div>
      </div>
    `;
  });

  html += '</div></div>'; // Close pmp-waves-list and pmp-waves-wrapper

  container.innerHTML = html;

  // Add click listeners to bars
  container.querySelectorAll('.pmp-wave-item').forEach(item => {
    item.addEventListener('click', function() {
      const company = this.getAttribute('data-company');
      console.log('[PMPromos] Wave clicked:', company);
      // TODO: Add functionality when clicked
    });
  });
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
  left: 430px;
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
        top: 20px;
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
  left: 430px;
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
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  console.log('[PMPromos] Module loaded successfully');
})();
