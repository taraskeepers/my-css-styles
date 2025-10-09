// price_monitoring_alerts.js - Price Monitoring Alerts Module
(function() {
  'use strict';
  
  console.log('[PMA] Alerts Module loading...');

  // Initialize the Alerts module
  window.pmAlertsModule = {
    initialize: async function() {
      console.log('[PMA] Initializing Alerts...');
      
      // Create the structure
      createAlertsStructure();
      
      // Load and display alerts data
      await loadAlertsData();
    }
  };

  // Load alerts data from IDB
  async function loadAlertsData() {
    const data = await loadCompanyPricingData();
    if (!data || !data.allData) {
      console.error('[PMA] No data available for alerts');
      return;
    }
    
    // Extract market alerts (source='all', q='all')
    const marketData = data.allData.find(row => 
      row.source === 'all' && row.q === 'all'
    );
    
    // Extract company alerts
    const companyName = window.myCompany || 'East Perry';
    const companyData = data.allData.find(row => 
      row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
    );
    
    const marketAlerts = marketData?.comments || [];
    const companyAlerts = companyData?.comments || [];
    
    // Combine all alerts
    const allAlerts = [
      ...marketAlerts.map(a => ({...a, type: 'market'})),
      ...companyAlerts.map(a => ({...a, type: 'company'}))
    ];
    
    // Populate the UI
    populateAlertsOverview(marketData, companyData);
    populateAlertsFeed(allAlerts);
    populateAlertsSummary(allAlerts);
    updateAlertMetrics(allAlerts);
  }

  // Load company pricing data (same as main module)
  async function loadCompanyPricingData() {
    return new Promise((resolve) => {
      console.log('[PMA] Loading alerts data...');
      
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
          console.error('[PMA] projectData object store not found');
          db.close();
          resolve(null);
          return;
        }
        
        const transaction = db.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        const getRequest = objectStore.get(tableName);
        
        getRequest.onsuccess = function() {
          const result = getRequest.result;
          db.close();
          resolve(result ? { allData: result.data } : null);
        };
        
        getRequest.onerror = function() {
          console.error('[PMA] Error getting data:', getRequest.error);
          db.close();
          resolve(null);
        };
      };
      
      request.onerror = function() {
        console.error('[PMA] Failed to open database:', request.error);
        resolve(null);
      };
    });
  }

  // Create main alerts structure
  function createAlertsStructure() {
    const container = document.getElementById('pmAlertsWrapperContainer');
    if (!container) return;
    
    container.innerHTML = `
      <!-- Alerts Overview Section -->
      <div class="pma-top-section">
        <!-- Market Temperature Card -->
        <div class="pma-temperature-card">
          <div class="pma-card-header">
            <h4>Market Temperature</h4>
            <div class="pma-temp-value-container">
              <span class="pma-temp-value" id="pmaTempValue">—</span>
              <span class="pma-temp-max">/100</span>
            </div>
          </div>
          <div class="pma-temp-gauge-container">
            <div class="pma-temp-gauge">
              <div class="pma-temp-fill" id="pmaTempFill"></div>
              <div class="pma-temp-marker" id="pmaTempMarker"></div>
            </div>
            <div class="pma-temp-labels">
              <span>Frozen</span>
              <span>Cool</span>
              <span>Stable</span>
              <span>Hot</span>
              <span>Flashpoint</span>
            </div>
          </div>
          <div class="pma-temp-status">
            <span class="pma-temp-category" id="pmaTempLabel">—</span>
            <span class="pma-temp-desc" id="pmaTempDescription">—</span>
          </div>
        </div>
        
        <!-- Volatility & Velocity Cards -->
        <div class="pma-metrics-duo">
          <!-- Volatility Card -->
          <div class="pma-metric-card">
            <h5>Price Volatility</h5>
            <div class="pma-metric-display">
              <span class="pma-metric-val" id="pmaVolatilityValue">—</span>
              <span class="pma-metric-status" id="pmaVolatilityLabel">—</span>
            </div>
            <div class="pma-metric-bar">
              <div class="pma-metric-fill" id="pmaVolatilityBar"></div>
            </div>
            <div class="pma-metric-context" id="pmaVolatilityContext">—</div>
          </div>

          <!-- Velocity Card -->
          <div class="pma-metric-card">
            <h5>Price Change Velocity</h5>
            <div class="pma-metric-display">
              <span class="pma-metric-val" id="pmaVelocityValue">—</span>
              <span class="pma-metric-status" id="pmaVelocityLabel">—</span>
            </div>
            <div class="pma-metric-bar">
              <div class="pma-metric-fill" id="pmaVelocityBar"></div>
            </div>
            <div class="pma-metric-context" id="pmaVelocityContext">—</div>
          </div>
        </div>

        <!-- Alert Stats -->
        <div class="pma-alert-stats">
          <div class="pma-stat-card critical">
            <div class="pma-stat-icon">🚨</div>
            <div class="pma-stat-content">
              <span class="pma-stat-number" id="pmaCriticalCount">0</span>
              <span class="pma-stat-label">Critical</span>
            </div>
          </div>
          <div class="pma-stat-card high">
            <div class="pma-stat-icon">⚠️</div>
            <div class="pma-stat-content">
              <span class="pma-stat-number" id="pmaHighCount">0</span>
              <span class="pma-stat-label">High Priority</span>
            </div>
          </div>
          <div class="pma-stat-card watch">
            <div class="pma-stat-icon">👁️</div>
            <div class="pma-stat-content">
              <span class="pma-stat-number" id="pmaWatchCount">0</span>
              <span class="pma-stat-label">Watch</span>
            </div>
          </div>
          <div class="pma-stat-card info">
            <div class="pma-stat-icon">ℹ️</div>
            <div class="pma-stat-content">
              <span class="pma-stat-number" id="pmaInfoCount">0</span>
              <span class="pma-stat-label">Info</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Alerts Grid -->
      <div class="pma-main-grid">
        <!-- Left Column - Alert Feed -->
        <div class="pma-left-column">
          <div class="pma-alerts-feed">
            <div class="pma-feed-header">
              <h4>Active Alerts</h4>
              <div class="pma-feed-controls">
                <button class="pma-filter-btn active" data-filter="all">All</button>
                <button class="pma-filter-btn" data-filter="critical">Critical</button>
                <button class="pma-filter-btn" data-filter="high">High</button>
                <button class="pma-filter-btn" data-filter="market">Market</button>
                <button class="pma-filter-btn" data-filter="company">Company</button>
              </div>
            </div>
            <div class="pma-feed-body" id="pmaAlertsFeed">
              <!-- Alerts will be populated here -->
            </div>
          </div>
        </div>

        <!-- Right Column - Category Summary -->
        <div class="pma-right-column">
          <!-- Alert Summary by Category -->
          <div class="pma-category-summary">
            <div class="pma-summary-header">
              <h4>Alert Summary by Category</h4>
              <span class="pma-summary-timestamp" id="pmaSummaryTime">—</span>
            </div>
            <div class="pma-summary-body">
              <!-- Market Categories -->
              <div class="pma-category-group">
                <h5 class="pma-group-title">Market Alerts</h5>
                <div id="pmaMarketCategories" class="pma-categories">
                  <!-- Categories will be populated here -->
                </div>
              </div>
              
              <!-- Company Categories -->
              <div class="pma-category-group">
                <h5 class="pma-group-title">Company Alerts</h5>
                <div id="pmaCompanyCategories" class="pma-categories">
                  <!-- Categories will be populated here -->
                </div>
              </div>
            </div>
          </div>

          <!-- Action Items -->
          <div class="pma-action-items">
            <h4>Recommended Actions</h4>
            <div id="pmaActionItems" class="pma-actions-list">
              <!-- Action items will be populated here -->
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Add styles
    addAlertsStyles();
    
    // Setup event listeners
    setupAlertsEventListeners();
  }

  // Populate overview section
  function populateAlertsOverview(marketData, companyData) {
    if (!marketData) return;
    
    // Temperature gauge
    const temp = parseFloat(marketData.avg_rating) || 0;
    const tempValue = document.getElementById('pmaTempValue');
    const tempFill = document.getElementById('pmaTempFill');
    const tempMarker = document.getElementById('pmaTempMarker');
    const tempLabel = document.getElementById('pmaTempLabel');
    const tempDesc = document.getElementById('pmaTempDescription');
    
    if (tempValue) tempValue.textContent = temp.toFixed(1);
    
    let tempCategory, tempDescription;
    if (temp <= 15) {
      tempCategory = 'Frozen';
      tempDescription = 'Minimal market activity';
    } else if (temp <= 30) {
      tempCategory = 'Cool';
      tempDescription = 'Low promotional activity';
    } else if (temp <= 45) {
      tempCategory = 'Stable';
      tempDescription = 'Balanced market conditions';
    } else if (temp <= 60) {
      tempCategory = 'Warm';
      tempDescription = 'Increased market activity';
    } else if (temp <= 75) {
      tempCategory = 'Hot';
      tempDescription = 'High promotional intensity';
    } else if (temp <= 90) {
      tempCategory = 'Boiling';
      tempDescription = 'Extreme market volatility';
    } else {
      tempCategory = 'Flashpoint';
      tempDescription = 'Critical market conditions';
    }
    
    if (tempFill) tempFill.style.width = `${temp}%`;
    if (tempMarker) tempMarker.style.left = `calc(${temp}% - 4px)`;
    if (tempLabel) tempLabel.textContent = tempCategory;
    if (tempDesc) tempDesc.textContent = tempDescription;
    
    // Volatility
    const volatility = parseFloat(marketData.volatility) || 0;
    const volValue = document.getElementById('pmaVolatilityValue');
    const volLabel = document.getElementById('pmaVolatilityLabel');
    const volBar = document.getElementById('pmaVolatilityBar');
    const volContext = document.getElementById('pmaVolatilityContext');
    
    if (volValue) volValue.textContent = volatility.toFixed(3);
    
    let volStatus, volMessage;
    if (volatility < 0.10) {
      volStatus = 'Very Tight';
      volMessage = 'Prices extremely stable';
    } else if (volatility < 0.25) {
      volStatus = 'Tight';
      volMessage = 'Minor price variations';
    } else if (volatility < 0.50) {
      volStatus = 'Moderate';
      volMessage = 'Normal price fluctuations';
    } else if (volatility < 1.00) {
      volStatus = 'High';
      volMessage = 'Significant price swings';
    } else {
      volStatus = 'Extreme';
      volMessage = 'Severe price instability';
    }
    
    if (volLabel) volLabel.textContent = volStatus;
    if (volContext) volContext.textContent = volMessage;
    if (volBar) {
      const position = Math.min(100, volatility * 100);
      volBar.style.width = `${position}%`;
    }
    
    // Velocity
    const velocity = parseFloat(marketData.price_change_velocity) || 0;
    const velValue = document.getElementById('pmaVelocityValue');
    const velLabel = document.getElementById('pmaVelocityLabel');
    const velBar = document.getElementById('pmaVelocityBar');
    const velContext = document.getElementById('pmaVelocityContext');
    
    if (velValue) velValue.textContent = velocity.toFixed(2);
    
    let velStatus, velMessage;
    if (velocity < 0.20) {
      velStatus = 'Static';
      velMessage = 'Minimal price changes';
    } else if (velocity < 0.50) {
      velStatus = 'Low Churn';
      velMessage = 'Occasional adjustments';
    } else if (velocity < 0.90) {
      velStatus = 'Moderate';
      velMessage = 'Regular price updates';
    } else if (velocity < 1.40) {
      velStatus = 'High';
      velMessage = 'Frequent price changes';
    } else if (velocity < 2.50) {
      velStatus = 'Very High';
      velMessage = 'Rapid price movements';
    } else {
      velStatus = 'Hyper-fluid';
      velMessage = 'Extreme price turbulence';
    }
    
    if (velLabel) velLabel.textContent = velStatus;
    if (velContext) velContext.textContent = velMessage;
    if (velBar) {
      const position = Math.min(100, (velocity / 3) * 100);
      velBar.style.width = `${position}%`;
    }
  }

  // Populate alerts feed
  function populateAlertsFeed(alerts) {
    const feedContainer = document.getElementById('pmaAlertsFeed');
    if (!feedContainer) return;
    
    // Sort alerts by severity priority
    const severityOrder = { 'Critical': 1, 'High': 2, 'Watch': 3, 'Info': 4 };
    alerts.sort((a, b) => {
      return (severityOrder[a.severity] || 5) - (severityOrder[b.severity] || 5);
    });
    
    // Generate alert cards
    const alertsHtml = alerts.map(alert => {
      const severityClass = alert.severity.toLowerCase();
      const typeIcon = alert.type === 'market' ? '🌍' : '🏢';
      const categoryParts = alert.category.split(':');
      const mainCategory = categoryParts[0];
      const subCategory = categoryParts[1] || '';
      
      return `
        <div class="pma-alert-card ${severityClass}" data-severity="${severityClass}" data-type="${alert.type}">
          <div class="pma-alert-header">
            <span class="pma-alert-type">${typeIcon}</span>
            <span class="pma-alert-severity ${severityClass}">${alert.severity}</span>
            <span class="pma-alert-category">${mainCategory}</span>
            ${subCategory ? `<span class="pma-alert-subcategory">${subCategory}</span>` : ''}
          </div>
          <div class="pma-alert-message">${alert.message}</div>
        </div>
      `;
    }).join('');
    
    feedContainer.innerHTML = alertsHtml || '<div class="pma-no-alerts">No active alerts</div>';
  }

  // Populate category summary
  function populateAlertsSummary(alerts) {
    // Group alerts by category
    const marketCategories = {};
    const companyCategories = {};
    
    alerts.forEach(alert => {
      const [mainCat, subCat] = alert.category.split(':');
      const categoryKey = subCat || mainCat;
      
      if (alert.type === 'market') {
        if (!marketCategories[categoryKey]) {
          marketCategories[categoryKey] = { 
            critical: 0, high: 0, watch: 0, info: 0, total: 0 
          };
        }
        marketCategories[categoryKey][alert.severity.toLowerCase()]++;
        marketCategories[categoryKey].total++;
      } else {
        if (!companyCategories[categoryKey]) {
          companyCategories[categoryKey] = { 
            critical: 0, high: 0, watch: 0, info: 0, total: 0 
          };
        }
        companyCategories[categoryKey][alert.severity.toLowerCase()]++;
        companyCategories[categoryKey].total++;
      }
    });
    
    // Render market categories
    const marketContainer = document.getElementById('pmaMarketCategories');
    if (marketContainer) {
      marketContainer.innerHTML = Object.entries(marketCategories).map(([cat, counts]) => `
        <div class="pma-category-item">
          <div class="pma-category-name">${cat}</div>
          <div class="pma-category-counts">
            ${counts.critical > 0 ? `<span class="pma-count critical">${counts.critical}</span>` : ''}
            ${counts.high > 0 ? `<span class="pma-count high">${counts.high}</span>` : ''}
            ${counts.watch > 0 ? `<span class="pma-count watch">${counts.watch}</span>` : ''}
            ${counts.info > 0 ? `<span class="pma-count info">${counts.info}</span>` : ''}
            <span class="pma-count-total">${counts.total}</span>
          </div>
        </div>
      `).join('');
    }
    
    // Render company categories
    const companyContainer = document.getElementById('pmaCompanyCategories');
    if (companyContainer) {
      companyContainer.innerHTML = Object.entries(companyCategories).map(([cat, counts]) => `
        <div class="pma-category-item">
          <div class="pma-category-name">${cat}</div>
          <div class="pma-category-counts">
            ${counts.critical > 0 ? `<span class="pma-count critical">${counts.critical}</span>` : ''}
            ${counts.high > 0 ? `<span class="pma-count high">${counts.high}</span>` : ''}
            ${counts.watch > 0 ? `<span class="pma-count watch">${counts.watch}</span>` : ''}
            ${counts.info > 0 ? `<span class="pma-count info">${counts.info}</span>` : ''}
            <span class="pma-count-total">${counts.total}</span>
          </div>
        </div>
      `).join('');
    }
    
    // Update timestamp
    const timestamp = document.getElementById('pmaSummaryTime');
    if (timestamp) {
      timestamp.textContent = new Date().toLocaleTimeString();
    }
    
    // Generate action items based on critical and high alerts
    generateActionItems(alerts);
  }

  // Update alert metrics
  function updateAlertMetrics(alerts) {
    const counts = {
      critical: 0,
      high: 0,
      watch: 0,
      info: 0
    };
    
    alerts.forEach(alert => {
      const severity = alert.severity.toLowerCase();
      if (counts.hasOwnProperty(severity)) {
        counts[severity]++;
      }
    });
    
    // Update counters
    document.getElementById('pmaCriticalCount').textContent = counts.critical;
    document.getElementById('pmaHighCount').textContent = counts.high;
    document.getElementById('pmaWatchCount').textContent = counts.watch;
    document.getElementById('pmaInfoCount').textContent = counts.info;
  }

  // Generate action items
  function generateActionItems(alerts) {
    const actionContainer = document.getElementById('pmaActionItems');
    if (!actionContainer) return;
    
    const actions = [];
    
    // Analyze critical and high priority alerts to suggest actions
    alerts.forEach(alert => {
      if (alert.severity === 'Critical' || alert.severity === 'High') {
        const action = getActionForAlert(alert);
        if (action) actions.push(action);
      }
    });
    
    // Limit to top 5 actions
    const topActions = actions.slice(0, 5);
    
    actionContainer.innerHTML = topActions.map((action, index) => `
      <div class="pma-action-item">
        <span class="pma-action-number">${index + 1}</span>
        <div class="pma-action-content">
          <div class="pma-action-title">${action.title}</div>
          <div class="pma-action-desc">${action.description}</div>
        </div>
      </div>
    `).join('') || '<div class="pma-no-actions">No immediate actions required</div>';
  }

  // Get action recommendation for alert
  function getActionForAlert(alert) {
    const [mainCat, subCat] = alert.category.split(':');
    
    // Map alert categories to actions
    const actionMap = {
      'Market:Volatility': {
        title: 'Review Pricing Strategy',
        description: 'Market volatility detected - audit current prices and adjust if needed'
      },
      'Market:Promo': {
        title: 'Competitive Response',
        description: 'Widespread promotions active - consider matching or strategic response'
      },
      'Company:Pricing': {
        title: 'Price Position Check',
        description: 'CPI shift detected - verify competitive positioning'
      },
      'Company:Promo': {
        title: 'Promo Effectiveness',
        description: 'Review promotional depth and coverage'
      },
      'Company:Competitive': {
        title: 'Competitive Analysis',
        description: 'Leadership position at risk - review key value items'
      },
      'Company:Assortment': {
        title: 'Range Optimization',
        description: 'Assortment gaps identified - consider range expansion'
      }
    };
    
    return actionMap[alert.category] || null;
  }

  // Setup event listeners
  function setupAlertsEventListeners() {
    // Filter buttons
    document.addEventListener('click', function(e) {
      if (e.target.classList.contains('pma-filter-btn')) {
        // Update active state
        document.querySelectorAll('.pma-filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');
        
        // Filter alerts
        const filter = e.target.getAttribute('data-filter');
        filterAlerts(filter);
      }
    });
  }

  // Filter alerts in feed
  function filterAlerts(filter) {
    const alertCards = document.querySelectorAll('.pma-alert-card');
    
    alertCards.forEach(card => {
      if (filter === 'all') {
        card.style.display = 'block';
      } else if (filter === 'critical' || filter === 'high') {
        card.style.display = card.getAttribute('data-severity') === filter ? 'block' : 'none';
      } else if (filter === 'market' || filter === 'company') {
        card.style.display = card.getAttribute('data-type') === filter ? 'block' : 'none';
      }
    });
  }

  // Add alerts-specific styles
  function addAlertsStyles() {
    if (document.getElementById('pmaStyles')) return;
    
    const styles = `
      <style id="pmaStyles">
        /* Alerts Section Specific Styles */
        
        /* Top Section */
        .pma-top-section {
          display: grid;
          grid-template-columns: 420px 320px 1fr;
          gap: 10px;
          margin-bottom: 10px;
        }
        
        /* Temperature Card (same as main but with pma- prefix) */
        .pma-temperature-card {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
        }
        
        .pma-temperature-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #0066cc, #ff0000);
        }
        
        .pma-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .pma-card-header h4 {
          margin: 0;
          font-size: 11px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .pma-temp-value-container {
          display: flex;
          align-items: baseline;
          gap: 2px;
        }
        
        .pma-temp-value {
          font-size: 32px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .pma-temp-max {
          font-size: 16px;
          color: #999;
        }
        
        .pma-temp-gauge-container {
          position: relative;
          margin: 20px 0;
        }
        
        .pma-temp-gauge {
          height: 32px;
          background: linear-gradient(90deg, 
            #0066cc 0%, #3399ff 20%, #66ccff 35%, 
            #ffcc00 50%, #ff9900 65%, #ff6600 80%, #ff0000 100%);
          border-radius: 16px;
          position: relative;
          overflow: visible;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .pma-temp-fill {
          position: absolute;
          top: 0;
          left: 0;
          height: 100%;
          background: rgba(0,0,0,0.15);
          border-radius: 16px;
        }
        
        .pma-temp-marker {
          position: absolute;
          top: -6px;
          width: 6px;
          height: 44px;
          background: white;
          border: 3px solid #333;
          border-radius: 6px;
          transition: left 0.5s ease;
          box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        }
        
        .pma-temp-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #888;
          margin-top: 4px;
        }
        
        .pma-temp-status {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 8px;
          border-top: 1px solid #f0f0f0;
        }
        
        .pma-temp-category {
          font-weight: 600;
          font-size: 13px;
          color: #1a1a1a;
        }
        
        .pma-temp-desc {
          font-size: 11px;
          color: #666;
        }
        
        /* Metrics Duo */
        .pma-metrics-duo {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .pma-metric-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          transition: transform 0.2s;
          flex: 1;
        }
        
        .pma-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .pma-metric-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
        }
        
        .pma-metric-card h5 {
          margin: 0 0 8px 0;
          font-size: 11px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .pma-metric-display {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin: 8px 0;
        }
        
        .pma-metric-val {
          font-size: 20px;
          font-weight: bold;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .pma-metric-status {
          font-size: 10px;
          padding: 3px 6px;
          background: #f0f0f0;
          border-radius: 4px;
          font-weight: 500;
        }
        
        .pma-metric-bar {
          height: 4px;
          background: #f0f0f0;
          border-radius: 2px;
          overflow: hidden;
          margin: 8px 0;
        }
        
        .pma-metric-fill {
          height: 100%;
          background: linear-gradient(90deg, #4CAF50, #FFC107, #FF5722);
          transition: width 0.5s ease;
        }
        
        .pma-metric-context {
          font-size: 10px;
          color: #888;
          text-align: center;
        }
        
        /* Alert Stats */
        .pma-alert-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          flex: 1;
        }
        
        .pma-stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          position: relative;
          overflow: hidden;
          transition: transform 0.2s;
        }
        
        .pma-stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        
        .pma-stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
        }
        
        .pma-stat-card.critical::before {
          background: #ff1744;
        }
        
        .pma-stat-card.high::before {
          background: #ff6b35;
        }
        
        .pma-stat-card.watch::before {
          background: #ffc107;
        }
        
        .pma-stat-card.info::before {
          background: #2196f3;
        }
        
        .pma-stat-icon {
          font-size: 24px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .pma-stat-content {
          flex: 1;
        }
        
        .pma-stat-number {
          font-size: 24px;
          font-weight: bold;
          display: block;
          line-height: 1;
        }
        
        .pma-stat-card.critical .pma-stat-number {
          color: #ff1744;
        }
        
        .pma-stat-card.high .pma-stat-number {
          color: #ff6b35;
        }
        
        .pma-stat-card.watch .pma-stat-number {
          color: #ffc107;
        }
        
        .pma-stat-card.info .pma-stat-number {
          color: #2196f3;
        }
        
        .pma-stat-label {
          font-size: 10px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 4px;
        }
        
        /* Main Grid */
        .pma-main-grid {
          display: grid;
          grid-template-columns: 1fr 500px;
          gap: 10px;
          height: calc(100vh - 400px);
          max-height: 600px;
        }
        
        /* Left Column - Alert Feed */
        .pma-left-column {
          display: flex;
          flex-direction: column;
        }
        
        .pma-alerts-feed {
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .pma-feed-header {
          padding: 16px 20px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .pma-feed-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .pma-feed-controls {
          display: flex;
          gap: 4px;
        }
        
        .pma-filter-btn {
          padding: 6px 12px;
          border: none;
          background: transparent;
          border-radius: 16px;
          font-size: 11px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          color: #666;
        }
        
        .pma-filter-btn:hover {
          background: #f0f0f0;
        }
        
        .pma-filter-btn.active {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
        }
        
        .pma-feed-body {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        /* Alert Cards */
        .pma-alert-card {
          background: white;
          border: 1px solid #e8e8e8;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.2s;
          position: relative;
          border-left-width: 4px;
        }
        
        .pma-alert-card:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          transform: translateX(2px);
        }
        
        .pma-alert-card.critical {
          border-left-color: #ff1744;
          background: #fff5f5;
        }
        
        .pma-alert-card.high {
          border-left-color: #ff6b35;
          background: #fff8f5;
        }
        
        .pma-alert-card.watch {
          border-left-color: #ffc107;
          background: #fffef5;
        }
        
        .pma-alert-card.info {
          border-left-color: #2196f3;
          background: #f5f9ff;
        }
        
        .pma-alert-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .pma-alert-type {
          font-size: 14px;
        }
        
        .pma-alert-severity {
          font-size: 10px;
          font-weight: 600;
          padding: 2px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        
        .pma-alert-severity.critical {
          background: #ff1744;
          color: white;
        }
        
        .pma-alert-severity.high {
          background: #ff6b35;
          color: white;
        }
        
        .pma-alert-severity.watch {
          background: #ffc107;
          color: #333;
        }
        
        .pma-alert-severity.info {
          background: #2196f3;
          color: white;
        }
        
        .pma-alert-category {
          font-size: 11px;
          font-weight: 600;
          color: #666;
        }
        
        .pma-alert-subcategory {
          font-size: 11px;
          color: #999;
        }
        
        .pma-alert-message {
          font-size: 12px;
          color: #333;
          line-height: 1.4;
        }
        
        .pma-no-alerts {
          text-align: center;
          padding: 40px;
          color: #999;
          font-size: 13px;
        }
        
        /* Right Column */
        .pma-right-column {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        /* Category Summary */
        .pma-category-summary {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        
        .pma-summary-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;
        }
        
        .pma-summary-header h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .pma-summary-timestamp {
          font-size: 11px;
          color: #999;
        }
        
        .pma-summary-body {
          flex: 1;
          overflow-y: auto;
        }
        
        .pma-category-group {
          margin-bottom: 20px;
        }
        
        .pma-group-title {
          font-size: 11px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 0 0 10px 0;
        }
        
        .pma-categories {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .pma-category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f9f9f9;
          border-radius: 6px;
          transition: background 0.2s;
        }
        
        .pma-category-item:hover {
          background: #f0f0f0;
        }
        
        .pma-category-name {
          font-size: 12px;
          font-weight: 500;
          color: #333;
        }
        
        .pma-category-counts {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        
        .pma-count {
          padding: 2px 6px;
          border-radius: 10px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .pma-count.critical {
          background: #ff1744;
          color: white;
        }
        
        .pma-count.high {
          background: #ff6b35;
          color: white;
        }
        
        .pma-count.watch {
          background: #ffc107;
          color: #333;
        }
        
        .pma-count.info {
          background: #2196f3;
          color: white;
        }
        
        .pma-count-total {
          font-size: 11px;
          font-weight: 600;
          color: #666;
        }
        
        /* Action Items */
        .pma-action-items {
          background: white;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .pma-action-items h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
        }
        
        .pma-actions-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .pma-action-item {
          display: flex;
          gap: 12px;
          padding: 10px;
          background: linear-gradient(135deg, #f5f5f5, #fafafa);
          border-radius: 8px;
          transition: all 0.2s;
        }
        
        .pma-action-item:hover {
          background: linear-gradient(135deg, #e8e8e8, #f5f5f5);
          transform: translateX(4px);
        }
        
        .pma-action-number {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          border-radius: 50%;
          font-size: 11px;
          font-weight: 600;
          flex-shrink: 0;
        }
        
        .pma-action-content {
          flex: 1;
        }
        
        .pma-action-title {
          font-size: 12px;
          font-weight: 600;
          color: #1a1a1a;
          margin-bottom: 2px;
        }
        
        .pma-action-desc {
          font-size: 11px;
          color: #666;
        }
        
        .pma-no-actions {
          text-align: center;
          padding: 20px;
          color: #999;
          font-size: 12px;
        }
        
        /* Scrollbar styling */
        .pma-feed-body::-webkit-scrollbar,
        .pma-summary-body::-webkit-scrollbar {
          width: 6px;
        }
        
        .pma-feed-body::-webkit-scrollbar-track,
        .pma-summary-body::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .pma-feed-body::-webkit-scrollbar-thumb,
        .pma-summary-body::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .pma-feed-body::-webkit-scrollbar-thumb:hover,
        .pma-summary-body::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Export module
  console.log('[PMA] Alerts Module loaded successfully');
})();
