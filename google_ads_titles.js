// google_ads_titles.js - Title Analyzer Section Implementation

// Global variables for titles analyzer section
window.selectedTitleCampaign = null;
window.titlesData = [];
window.titleProducts = new Map();

// Initialize titles analyzer section
async function initializeTitlesAnalyzer() {
  console.log('[initializeTitlesAnalyzer] Starting titles analyzer initialization...');
  
  // Add titles-specific styles
  addTitlesAnalyzerStyles();
  
  // Load and render titles analyzer
  await loadAndRenderTitlesAnalyzer();
}

// Add titles-specific styles
function addTitlesAnalyzerStyles() {
  if (!document.getElementById('titles-analyzer-styles')) {
    const style = document.createElement('style');
    style.id = 'titles-analyzer-styles';
    style.textContent = `
      /* Main titles analyzer container */
      .titles-analyzer-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        padding-top: 50px;
      }
      
      /* Products panel for titles */
      #titlesProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Header section */
      .titles-products-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .titles-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .titles-header-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .titles-analyzer-version {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .titles-selected-info {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
      }
      
      /* TABLE STYLES - Renamed from campaigns */
      .titles-products-table-container {
        flex: 1;
        overflow: auto;
        background: #f5f7fa;
      }
      
      .titles-products-wrapper {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      .titles-table-modern {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      /* Table header */
      .titles-table-modern thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .titles-table-modern thead tr {
        border-bottom: 2px solid #e9ecef;
      }
      
      .titles-table-modern th {
        padding: 10px 8px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6c757d;
        text-align: left;
        background: white;
        position: relative;
        white-space: nowrap;
        user-select: none;
      }
      
      .titles-table-modern th.sortable {
        cursor: pointer;
        padding-right: 20px;
      }
      
      .titles-table-modern th.sortable:hover {
        background: rgba(102, 126, 234, 0.04);
        color: #495057;
      }
      
      .titles-table-modern th.center {
        text-align: center;
      }
      
      .titles-table-modern th.right {
        text-align: right;
      }
      
/* Column widths - updated */
.titles-table-modern th:nth-child(1),
.titles-table-modern td:nth-child(1) { width: 70px; } /* POS */

.titles-table-modern th:nth-child(2),
.titles-table-modern td:nth-child(2) { width: 80px; } /* SHARE */

.titles-table-modern th:nth-child(3),
.titles-table-modern td:nth-child(3) { width: 70px; } /* ROAS */

.titles-table-modern th:nth-child(4),
.titles-table-modern td:nth-child(4) { width: 70px; } /* IMAGE */

.titles-table-modern th:nth-child(5),
.titles-table-modern td:nth-child(5) { 
  max-width: 350px; 
  width: 350px;
} /* PRODUCT TITLE */

/* New analysis columns */
.titles-table-modern th:nth-child(6),
.titles-table-modern td:nth-child(6) { width: 65px; } /* SCORE */

.titles-table-modern th:nth-child(7),
.titles-table-modern td:nth-child(7) { width: 50px; } /* KOS */

.titles-table-modern th:nth-child(8),
.titles-table-modern td:nth-child(8) { width: 50px; } /* GOS */

.titles-table-modern th:nth-child(9),
.titles-table-modern td:nth-child(9) { width: 60px; } /* SUGG */

.titles-table-modern th.metric-col,
.titles-table-modern td.metric-col { 
  width: 80px;
  max-width: 80px;
}
      
      /* Sort icon */
      .titles-sort-icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #adb5bd;
      }
      
      .titles-table-modern th.sorted-asc .titles-sort-icon,
      .titles-table-modern th.sorted-desc .titles-sort-icon {
        color: #667eea;
      }
      
      /* Table body */
      .titles-table-modern tbody tr {
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.15s ease;
        height: 70px;
      }
      
      .titles-table-modern tbody tr:hover {
        background: rgba(102, 126, 234, 0.02);
      }
      
      .titles-table-modern td {
        padding: 8px;
        font-size: 13px;
        color: #495057;
        vertical-align: middle;
      }
      
      .titles-table-modern td.center {
        text-align: center;
      }
      
      .titles-table-modern td.right {
        text-align: right;
      }
      
      /* Product image in table */
      .titles-product-img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      /* Product title cell */
      .titles-product-title-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .titles-product-title {
        font-weight: 600;
        color: #333;
        font-size: 13px;
        line-height: 1.3;
        max-height: 2.6em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .titles-product-sku {
        font-size: 11px;
        color: #999;
      }
      
      /* Metric cells with bars */
      .titles-metric-cell {
        position: relative;
        padding: 4px 8px !important;
      }
      
      .titles-metric-bar {
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        height: 24px;
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.15), rgba(102, 126, 234, 0.05));
        border-radius: 4px;
        transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 0;
      }
      
      .titles-metric-value {
        position: relative;
        z-index: 1;
        font-weight: 600;
        font-size: 12px;
      }
      
      .titles-metric-percent {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #999;
        z-index: 1;
      }
      
      /* Special badges for top performers */
      .titles-performance-badge {
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 9px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin-left: 8px;
        display: inline-flex;
        align-items: center;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
      }
      
      /* ROAS indicator */
      .titles-roas-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 600;
      }
      
      .titles-roas-high {
        background: rgba(34, 197, 94, 0.1);
        color: #16a34a;
      }
      
      .titles-roas-medium {
        background: rgba(251, 191, 36, 0.1);
        color: #f59e0b;
      }
      
      .titles-roas-low {
        background: rgba(239, 68, 68, 0.1);
        color: #dc2626;
      }
      /* Image zoom on hover */
.titles-product-img-container {
  position: relative;
  display: inline-block;
}

.titles-product-img-zoom {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 12px;
  object-fit: contain;
  background: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  border: 2px solid #667eea;
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
}

.titles-product-img-container:hover .titles-product-img-zoom {
  opacity: 1;
}

/* Position indicator styles */
.titles-position-indicator {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
}

.titles-position-indicator.top {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
  color: white;
}

.titles-position-indicator.mid {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.titles-position-indicator.low {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
  color: white;
}

.titles-position-indicator.bottom {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* Market share bar */
.titles-share-bar {
  width: 60px;
  height: 32px;
  background: #e9ecef;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  display: inline-block;
}

.titles-share-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
  transition: width 0.3s ease;
}

.titles-share-text {
  position: relative;
  z-index: 2;
  font-size: 11px;
  font-weight: 600;
  color: #1e40af;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 0 0 2px rgba(255,255,255,0.8);
}
/* Score fraction display */
.titles-score-fraction {
  display: inline-flex;
  align-items: baseline;
  gap: 1px;
  padding: 4px 8px;
  border-radius: 8px;
  font-weight: 700;
  min-width: 55px;
  justify-content: center;
}

.titles-score-value {
  font-size: 13px;
}

.titles-score-max {
  font-size: 10px;
  opacity: 0.7;
}

/* T-Score color classes */
.titles-tscore-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.titles-tscore-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: #14532d;
}

.titles-tscore-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.titles-tscore-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* KOS color classes */
.titles-kos-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.titles-kos-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: #14532d;
}

.titles-kos-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.titles-kos-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* GOS color classes */
.titles-gos-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.titles-gos-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
  color: #14532d;
}

.titles-gos-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.titles-gos-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

.titles-kos-badge {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
  border: 1px solid rgba(239, 68, 68, 0.2);
}

.titles-gos-badge {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
  border: 1px solid rgba(34, 197, 94, 0.2);
}

/* Suggestions count */
.titles-suggestions-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 5px 10px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 700;
  background: rgba(107, 114, 128, 0.1);
  color: #4b5563;
  min-width: 32px;
  position: relative;
  cursor: help;
}

.titles-suggestions-count.has-many {
  background: rgba(251, 191, 36, 0.15);
  color: #d97706;
  font-weight: 700;
}

.titles-suggestions-count.critical {
  background: rgba(239, 68, 68, 0.15);
  color: #dc2626;
  font-weight: 700;
}
/* Clickable rows */
.titles-table-modern tbody tr {
  cursor: pointer;
  user-select: none;
}

.titles-table-modern tbody tr.expanded {
  background: rgba(102, 126, 234, 0.05);
}

/* Expanded details row */
.titles-expanded-row {
  background: linear-gradient(to bottom, #f8f9fa, #ffffff);
  border-bottom: 2px solid #dee2e6;
}

.titles-expanded-row td {
  padding: 0 !important;
}

.titles-expanded-content {
  padding: 20px;
  animation: slideDown 0.3s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
  }
  to {
    max-height: 800px;
    opacity: 1;
  }
}

.titles-expanded-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.titles-expanded-section {
  background: white;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.titles-expanded-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 700;
  color: #495057;
  border-bottom: 2px solid #667eea;
  padding-bottom: 8px;
}

/* KOS Details Table */
.titles-kos-table {
  width: 100%;
  font-size: 12px;
  border-collapse: collapse;
}

.titles-kos-table th {
  background: #f8f9fa;
  padding: 6px 8px;
  text-align: left;
  font-weight: 600;
  font-size: 11px;
  color: #6c757d;
  border-bottom: 1px solid #dee2e6;
}

.titles-kos-table td {
  padding: 6px 8px;
  border-bottom: 1px solid #f0f2f5;
}

.titles-kos-rank {
  font-weight: 700;
  color: #667eea;
}

.titles-kos-keyword {
  font-weight: 600;
}

.titles-kos-score {
  text-align: center;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.titles-kos-score.high {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.titles-kos-score.medium {
  background: rgba(251, 191, 36, 0.1);
  color: #f59e0b;
}

.titles-kos-score.low {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

/* Improvement Suggestions */
.titles-suggestions-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.titles-suggestion-item {
  padding: 8px 12px;
  margin-bottom: 8px;
  background: rgba(251, 191, 36, 0.05);
  border-left: 3px solid #f59e0b;
  border-radius: 4px;
  font-size: 12px;
  color: #495057;
  display: flex;
  align-items: center;
  gap: 8px;
}

.titles-suggestion-item::before {
  content: "💡";
  font-size: 14px;
}

/* Score Breakdown */
.titles-score-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.titles-score-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: #f8f9fa;
  border-radius: 6px;
  font-size: 12px;
}

.titles-score-label {
  color: #6c757d;
  font-weight: 500;
}

.titles-score-value {
  font-weight: 700;
  color: #495057;
}

/* Penalties Section */
.titles-penalties-box {
  background: rgba(239, 68, 68, 0.05);
  border: 1px solid rgba(239, 68, 68, 0.2);
  border-radius: 6px;
  padding: 10px;
  margin-top: 10px;
}

.titles-penalty-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 12px;
  color: #dc2626;
}

.titles-penalty-icon {
  font-size: 14px;
}

    `;
    document.head.appendChild(style);
  }
}

// Load data from googleSheets_productPerformance_all
async function loadTitlesProductData() {
  return new Promise((resolve, reject) => {
    console.log('[loadTitlesProductData] Starting to load data...');
    
    // Use the existing global getProjectTablePrefix function from google_ads_campaigns.js
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      // Fallback - try to determine the prefix manually
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}googleSheets_productPerformance_all`;
    
    console.log('[loadTitlesProductData] Looking for table:', tableName);
    
    // Rest of the function remains the same...
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      // Check if projectData object store exists
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadTitlesProductData] projectData object store not found');
        db.close();
        reject(new Error('projectData object store not found'));
        return;
      }
      
      // Create transaction and get the projectData object store
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      
      // Get the data using the table name as the key
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadTitlesProductData] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Extract the actual data array
        const allRecords = Array.isArray(result.data) ? result.data : [];
        console.log('[loadTitlesProductData] Found records:', allRecords.length);
        
        // Process and aggregate data by product
        const productMap = new Map();
        
        allRecords.forEach(record => {
          // Skip records that don't have "all" as campaign name
          if (record['Campaign Name'] !== 'all') {
            return;
          }
          
          const key = record['Product Title'] || 'Unknown Product';
          
          if (!productMap.has(key)) {
            productMap.set(key, {
              title: key,
              sku: record['Product ID'] || '',
              image: record['Product Image URL'] || '',
              impressions: 0,
              clicks: 0,
              cost: 0,
              conversions: 0,
              convValue: 0,
              weightedPositionSum: 0,
              positionImpressions: 0,
              records: []
            });
          }
          
          const product = productMap.get(key);
          
          // Parse and aggregate metrics
          const impressions = parseFloat(record['Impressions'] || 0);
          const clicks = parseFloat(record['Clicks'] || 0);
          const cost = parseFloat(record['Cost'] || 0);
          const conversions = parseFloat(record['Conversions'] || 0);
          const convValue = parseFloat(record['Conversion Value'] || 0);
          const avgPosition = parseFloat(record['Average Position'] || 0);
          
          product.impressions += impressions;
          product.clicks += clicks;
          product.cost += cost;
          product.conversions += conversions;
          product.convValue += convValue;
          
          // Calculate weighted average position
          if (avgPosition > 0 && impressions > 0) {
            product.weightedPositionSum += avgPosition * impressions;
            product.positionImpressions += impressions;
          }
          
          product.records.push(record);
        });
        
        // Convert map to array and calculate derived metrics
        const products = Array.from(productMap.values()).map(p => {
          // Calculate metrics
          p.ctr = p.impressions > 0 ? (p.clicks / p.impressions * 100) : 0;
          p.avgCpc = p.clicks > 0 ? (p.cost / p.clicks) : 0;
          p.cpa = p.conversions > 0 ? (p.cost / p.conversions) : 0;
          p.cvr = p.clicks > 0 ? (p.conversions / p.clicks * 100) : 0;
          p.aov = p.conversions > 0 ? (p.convValue / p.conversions) : 0;
          p.roas = p.cost > 0 ? (p.convValue / p.cost) : 0;
          p.avgPosition = p.positionImpressions > 0 ? 
            (p.weightedPositionSum / p.positionImpressions) : 0;
          
          // Clean up temporary calculation fields
          delete p.weightedPositionSum;
          delete p.positionImpressions;
          
          return p;
        });
        
        // Sort by impressions by default (highest first)
        products.sort((a, b) => b.impressions - a.impressions);
        
        console.log('[loadTitlesProductData] Processed products:', products.length);
        db.close();
        resolve(products);
      };
      
      getRequest.onerror = function() {
        console.error('[loadTitlesProductData] Error getting data:', getRequest.error);
        db.close();
        reject(new Error('Failed to load titles product data'));
      };
    };
    
    request.onerror = function() {
      console.error('[loadTitlesProductData] Failed to open database:', request.error);
      reject(new Error('Failed to open database'));
    };
  });
}

// Load title analyzer results data
async function loadTitleAnalyzerResults() {
  return new Promise((resolve, reject) => {
    console.log('[loadTitleAnalyzerResults] Starting to load analyzer results...');
    
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
    
    const tableName = `${tablePrefix}googleads_title_analyzer_results`;
    
    console.log('[loadTitleAnalyzerResults] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadTitleAnalyzerResults] projectData object store not found');
        db.close();
        resolve(new Map());
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data || !result.data.results) {
          console.warn('[loadTitleAnalyzerResults] No analyzer results found');
          db.close();
          resolve(new Map());
          return;
        }
        
        // Create a map of title -> analyzer data
        const analyzerMap = new Map();
        
        result.data.results.forEach(item => {
          if (item.title) {
            analyzerMap.set(item.title, {
              finalScore: item.final_score || 0,
              kos: item.kos || 0,
              avgKos: item.avg_kos || 0,  // Add avg_kos
              gos: item.gos || 0,
              kosDetails: item.kos_details || [],
              scoreBreakdown: item.score_breakdown || {},
              improvementSuggestions: item.improvement_suggestions || [],
              titleLength: item.title_length || 0,
              wordCount: item.word_count || 0
            });
          }
        });
        
        console.log('[loadTitleAnalyzerResults] Loaded analyzer results for titles:', analyzerMap.size);
        db.close();
        resolve(analyzerMap);
      };
      
      getRequest.onerror = function() {
        console.error('[loadTitleAnalyzerResults] Error getting data:', getRequest.error);
        db.close();
        resolve(new Map());
      };
    };
    
    request.onerror = function() {
      console.error('[loadTitleAnalyzerResults] Failed to open database:', request.error);
      resolve(new Map());
    };
  });
}

// Load processed data for POS and SHARE
async function loadProcessedDataForTitles(productTitles) {
  console.log('[loadProcessedDataForTitles] Loading processed data for titles:', productTitles.length);
  
  try {
    // Get the processed table name
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : 
      (() => {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        return `${accountPrefix}_pr${currentProjectNum}_`;
      })();
    
    const processedTableName = `${tablePrefix}processed`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(processedTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadProcessedDataForTitles] No processed data found');
      return new Map();
    }
    
    // Process data: aggregate by product title
    const productMetrics = new Map();
    
    result.data.forEach(row => {
      // Filter by company source
      if (!row.source || row.source.toLowerCase() !== (window.myCompany || "").toLowerCase()) {
        return;
      }
      
      const title = row.title;
      const position = parseFloat(row.avg_week_position);
      const visibility = parseFloat(row.avg_visibility);
      const weekTrend = row.week_trend || null;
      
      // Skip if title doesn't match any of our products
      if (!productTitles.includes(title)) {
        return;
      }
      
      if (!productMetrics.has(title)) {
        productMetrics.set(title, {
          positions: [],
          visibilities: [],
          trends: []
        });
      }
      
      const metrics = productMetrics.get(title);
      
      if (!isNaN(position) && position > 0) {
        metrics.positions.push(position);
      }
      if (!isNaN(visibility)) {
        metrics.visibilities.push(visibility);
      }
      if (weekTrend && weekTrend !== 'N/A') {
        metrics.trends.push(weekTrend);
      }
    });
    
    // Calculate averages
    const processedMetrics = new Map();
    
    for (const [title, metrics] of productMetrics) {
      const processed = {
        avgPosition: null,
        avgVisibility: null,
        trend: null
      };
      
      if (metrics.positions.length > 0) {
        const avgPos = metrics.positions.reduce((a, b) => a + b, 0) / metrics.positions.length;
        processed.avgPosition = Math.round(avgPos);
      }
      
      if (metrics.visibilities.length > 0) {
        const avgVis = metrics.visibilities.reduce((a, b) => a + b, 0) / metrics.visibilities.length;
        processed.avgVisibility = avgVis * 100; // Convert to percentage
      }
      
      // Calculate average trend
      if (metrics.trends.length > 0) {
        processed.trend = calculateAverageTrend(metrics.trends);
      }
      
      processedMetrics.set(title, processed);
    }
    
    console.log('[loadProcessedDataForTitles] Processed metrics for products:', processedMetrics.size);
    return processedMetrics;
    
  } catch (error) {
    console.error('[loadProcessedDataForTitles] Error loading processed data:', error);
    return new Map();
  }
}

// Helper function to calculate average trend
function calculateAverageTrend(trends) {
  if (!trends || trends.length === 0) return null;
  
  const validTrends = [];
  trends.forEach(trend => {
    if (trend && trend !== 'N/A') {
      const match = trend.match(/([⬆⬇])\s*([+-]?\d+\.?\d*)/);
      if (match) {
        const arrow = match[1];
        const value = parseFloat(match[2]);
        validTrends.push({ arrow, value });
      }
    }
  });
  
  if (validTrends.length === 0) return null;
  
  const avgValue = validTrends.reduce((sum, t) => sum + Math.abs(t.value), 0) / validTrends.length;
  const upCount = validTrends.filter(t => t.arrow === '⬆').length;
  const downCount = validTrends.filter(t => t.arrow === '⬇').length;
  const arrow = upCount >= downCount ? '⬆' : '⬇';
  const formattedValue = avgValue.toFixed(2);
  const isPositive = arrow === '⬆';
  
  return {
    text: `${arrow} ${formattedValue}`,
    color: isPositive ? '#22c55e' : '#ef4444',
    isPositive
  };
}

// Match products with company data for images
function matchProductsWithCompanyData(products) {
  const matchedProducts = new Map();
  
  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
        const productKey = product.title || '';
        matchedProducts.set(productKey, product);
      }
    });
  }
  
  return matchedProducts;
}

// Replace the loadAndRenderTitlesAnalyzer function:
async function loadAndRenderTitlesAnalyzer() {
  const container = document.getElementById('titles_analyzer_container');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'titles-analyzer-main-container';
  
  // Create products panel
  const productsPanel = document.createElement('div');
  productsPanel.id = 'titlesProductsPanel';
  
  // Create header
  const header = document.createElement('div');
  header.className = 'titles-products-header';
  header.innerHTML = `
    <div class="titles-header-left">
      <h2 class="titles-header-title">
        Title Performance Analyzer
        <span class="titles-analyzer-version">v2.3.0 BETA</span>
      </h2>
      <div class="titles-selected-info">
        Analyzing title effectiveness across all campaigns
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'titles-products-table-container';
  productsPanel.appendChild(tableContainer);
  
// Load and render products data
try {
  const [products, analyzerResults] = await Promise.all([
    loadTitlesProductData(),
    loadTitleAnalyzerResults()
  ]);
  await renderTitlesProductsTable(tableContainer, products, analyzerResults);
} catch (error) {
  console.error('[TitlesAnalyzer] Error loading data:', error);
  tableContainer.innerHTML = `
    <div style="text-align: center; padding: 40px; color: #999;">
      Error loading title performance data. Please refresh and try again.
    </div>
  `;
}
  
  mainContainer.appendChild(productsPanel);
  container.appendChild(mainContainer);
}

async function renderTitlesProductsTable(container, products, analyzerResults = new Map()) {
  // Get product titles for matching
  const productTitles = products.map(p => p.title);
  
  // Load processed data for POS and SHARE
  const processedMetrics = await loadProcessedDataForTitles(productTitles);
  
  // Match products with company data for images
  const matchedProducts = matchProductsWithCompanyData(products);
  
  // Calculate totals for percentage calculations
  const totals = {
    impressions: products.reduce((sum, p) => sum + p.impressions, 0),
    clicks: products.reduce((sum, p) => sum + p.clicks, 0),
    cost: products.reduce((sum, p) => sum + p.cost, 0),
    conversions: products.reduce((sum, p) => sum + p.conversions, 0),
    convValue: products.reduce((sum, p) => sum + p.convValue, 0)
  };
  
  const wrapper = document.createElement('div');
  wrapper.className = 'titles-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position" style="width: 70px;">
      Pos
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share" style="width: 80px;">
      Share
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 70px;">
      ROAS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center" style="width: 70px;">Image</th>
    <th class="sortable" data-sort="title" style="max-width: 350px; width: 350px;">
      Product Title
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="score" style="width: 75px;">
      T-Score
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="kos" style="width: 60px;">
      KOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="gos" style="width: 60px;">
      GOS
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="suggestions" style="width: 60px;">
      Sugg
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="impressions">
      Impr
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="clicks">
      Clicks
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="ctr">
      CTR %
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="cost">
      Cost
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable metric-col" data-sort="revenue">
      Revenue
      <span class="titles-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody with actual data
  const tbody = document.createElement('tbody');
  
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    row.dataset.productTitle = product.title;
    
    // Get processed metrics for this product
    const productProcessedMetrics = processedMetrics.get(product.title);
    const adPosition = productProcessedMetrics?.avgPosition || null;
    const marketShare = productProcessedMetrics?.avgVisibility || null;
    const trend = productProcessedMetrics?.trend || null;
    
    // Get analyzer results for this product
    const analyzerData = analyzerResults.get(product.title) || {};
    const finalScore = analyzerData.finalScore || 0;
    const avgKos = analyzerData.avgKos || 0;  // Use avg_kos
    const gos = analyzerData.gos || 0;
    const suggestionsCount = analyzerData.improvementSuggestions?.length || 0;
    
    // Get matched product for image
    const matchedProduct = matchedProducts.get(product.title);
    const imageUrl = matchedProduct?.thumbnail || product.image || '';
    
    // Position badge class
    let posClass = 'bottom';
    if (adPosition) {
      if (adPosition <= 3) posClass = 'top';
      else if (adPosition <= 8) posClass = 'mid';
      else if (adPosition <= 14) posClass = 'low';
    }
    
    // T-Score class
    let tscoreClass = 'titles-tscore-poor';
    if (finalScore > 70) tscoreClass = 'titles-tscore-excellent';
    else if (finalScore >= 55) tscoreClass = 'titles-tscore-good';
    else if (finalScore >= 40) tscoreClass = 'titles-tscore-fair';
    
    // KOS class (avg_kos)
    let kosClass = 'titles-kos-poor';
    if (avgKos > 15) kosClass = 'titles-kos-excellent';
    else if (avgKos >= 10) kosClass = 'titles-kos-good';
    else if (avgKos > 5) kosClass = 'titles-kos-fair';
    
    // GOS class
    let gosClass = 'titles-gos-poor';
    if (gos > 60) gosClass = 'titles-gos-excellent';
    else if (gos >= 40) gosClass = 'titles-gos-good';
    else if (gos >= 20) gosClass = 'titles-gos-fair';
    
    // Suggestions class
    let suggClass = '';
    if (suggestionsCount >= 7) suggClass = 'critical';
    else if (suggestionsCount >= 4) suggClass = 'has-many';
    
    // Determine ROAS class
    let roasClass = 'titles-roas-low';
    if (product.roas >= 3) roasClass = 'titles-roas-high';
    else if (product.roas >= 1.5) roasClass = 'titles-roas-medium';
    
    // Determine if this is a top performer
    const isTopPerformer = index < 5 && product.roas > 2;
    
    row.innerHTML = `
      <td class="center">
        ${adPosition !== null && adPosition !== undefined ? 
          `<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <div class="titles-position-indicator ${posClass}">${adPosition}</div>
            ${trend ? 
              `<div style="font-size: 9px; color: ${trend.color}; font-weight: 600; background: ${trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 1px 4px; border-radius: 4px;">${trend.text}</div>` : 
              ''}
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${marketShare ? 
          `<div class="titles-share-bar">
            <div class="titles-share-fill" style="width: ${Math.min(marketShare, 100)}%"></div>
            <div class="titles-share-text">${marketShare.toFixed(1)}%</div>
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        <span class="titles-roas-indicator ${roasClass}">
          ${product.roas.toFixed(2)}x
        </span>
      </td>
      <td class="center">
        ${imageUrl ? 
          `<div class="titles-product-img-container">
            <img class="titles-product-img" src="${imageUrl}" alt="${product.title}" onerror="this.style.display='none'">
            <img class="titles-product-img-zoom" src="${imageUrl}" alt="${product.title}">
          </div>` : 
          '<div style="width: 48px; height: 48px; background: #f0f2f5; border-radius: 8px; margin: 0 auto;"></div>'}
      </td>
      <td>
        <div class="titles-product-title-cell">
          <div class="titles-product-title">
            ${product.title}
            ${isTopPerformer ? '<span class="titles-performance-badge">TOP</span>' : ''}
          </div>
          ${product.sku ? `<div class="titles-product-sku">SKU: ${product.sku}</div>` : ''}
        </div>
      </td>
      <td class="center">
        ${finalScore > 0 ? 
          `<span class="titles-score-fraction ${tscoreClass}">
            <span class="titles-score-value">${finalScore}</span>
            <span class="titles-score-max">/100</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${avgKos > 0 ? 
          `<span class="titles-score-fraction ${kosClass}">
            <span class="titles-score-value">${avgKos.toFixed(1)}</span>
            <span class="titles-score-max">/20</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${gos > 0 ? 
          `<span class="titles-score-fraction ${gosClass}">
            <span class="titles-score-value">${gos}</span>
            <span class="titles-score-max">/80</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${suggestionsCount > 0 ? 
          `<span class="titles-suggestions-count ${suggClass}" title="${suggestionsCount} improvement suggestions">${suggestionsCount}</span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          <div class="titles-metric-bar" style="width: ${(product.impressions / Math.max(...products.map(p => p.impressions)) * 100)}%;"></div>
          <span class="titles-metric-value">${product.impressions.toLocaleString()}</span>
        </div>
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          <div class="titles-metric-bar" style="width: ${(product.clicks / Math.max(...products.map(p => p.clicks)) * 100)}%;"></div>
          <span class="titles-metric-value">${product.clicks.toLocaleString()}</span>
        </div>
      </td>
      <td class="right">${product.ctr.toFixed(2)}%</td>
      <td class="right">$${product.cost.toFixed(2)}</td>
      <td class="right">$${product.convValue.toFixed(2)}</td>
    `;
    
    // Store analyzer data on the row for expansion
    row.dataset.analyzerData = JSON.stringify(analyzerData);
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add click handlers for row expansion
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', function(e) {
      // Don't expand if clicking on image
      if (e.target.closest('.titles-product-img-container')) return;
      
      toggleRowExpansion(this, analyzerResults);
    });
  });
  
  // Add image hover positioning event listeners
  wrapper.querySelectorAll('.titles-product-img-container').forEach(container => {
    const img = container.querySelector('.titles-product-img');
    const zoomImg = container.querySelector('.titles-product-img-zoom');
    
    if (img && zoomImg) {
      container.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = rect.right + 10;
        let top = rect.top - 100;
        
        // Adjust if would go off right edge
        if (left + 300 > viewportWidth) {
          left = rect.left - 310;
        }
        
        // Adjust if would go off top
        if (top < 10) {
          top = 10;
        }
        
        // Adjust if would go off bottom
        if (top + 300 > viewportHeight - 10) {
          top = viewportHeight - 310;
        }
        
        zoomImg.style.left = `${left}px`;
        zoomImg.style.top = `${top}px`;
      });
    }
  });
  
  // Add sorting functionality with updated data
  addTitlesSortingFunctionality(table, products, processedMetrics, analyzerResults);
}

// Toggle row expansion to show details
function toggleRowExpansion(row, analyzerResults) {
  const nextRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');
  
  // If already expanded, collapse
  if (isExpanded && nextRow && nextRow.classList.contains('titles-expanded-row')) {
    row.classList.remove('expanded');
    nextRow.remove();
    return;
  }
  
  // Remove any other expanded rows
  const tbody = row.parentElement;
  tbody.querySelectorAll('.expanded').forEach(r => r.classList.remove('expanded'));
  tbody.querySelectorAll('.titles-expanded-row').forEach(r => r.remove());
  
  // Expand this row
  row.classList.add('expanded');
  
  // Get analyzer data
  const productTitle = row.dataset.productTitle;
  const analyzerData = analyzerResults.get(productTitle);
  
  if (!analyzerData) {
    console.warn('No analyzer data found for product:', productTitle);
    return;
  }
  
  // Create expanded row
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'titles-expanded-row';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = row.cells.length;
  
  // Build expanded content
  let expandedHTML = '<div class="titles-expanded-content">';
  
  // Grid layout for main sections
  expandedHTML += '<div class="titles-expanded-grid">';
  
  // KOS Details Section
  if (analyzerData.kosDetails && analyzerData.kosDetails.length > 0) {
    expandedHTML += `
      <div class="titles-expanded-section">
        <h4>🎯 Top 10 Keywords Analysis (KOS Details)</h4>
        <table class="titles-kos-table">
          <thead>
            <tr>
              <th style="width: 40px;">Rank</th>
              <th>Keyword</th>
              <th style="width: 60px;">Score</th>
              <th style="width: 80px;">Position</th>
              <th>Match</th>
            </tr>
          </thead>
          <tbody>`;
    
    analyzerData.kosDetails.slice(0, 10).forEach((kw, idx) => {
      const scoreClass = kw.score >= 15 ? 'high' : kw.score >= 10 ? 'medium' : 'low';
      const position = kw.position_in_title !== undefined ? 
        (kw.position_in_title === -1 ? 'Not found' : `Word ${kw.position_in_title + 1}`) : '-';
      const matchType = kw.exact_match ? '✅ Exact' : kw.partial_match ? '⚠️ Partial' : '❌ None';
      
      expandedHTML += `
        <tr>
          <td class="titles-kos-rank">#${idx + 1}</td>
          <td class="titles-kos-keyword">${kw.keyword || '-'}</td>
          <td><span class="titles-kos-score ${scoreClass}">${kw.score || 0}</span></td>
          <td>${position}</td>
          <td>${matchType}</td>
        </tr>`;
    });
    
    expandedHTML += `
          </tbody>
        </table>
      </div>`;
  }
  
  // Improvement Suggestions Section
  if (analyzerData.improvementSuggestions && analyzerData.improvementSuggestions.length > 0) {
    expandedHTML += `
      <div class="titles-expanded-section">
        <h4>💡 Improvement Suggestions</h4>
        <ul class="titles-suggestions-list">`;
    
    analyzerData.improvementSuggestions.forEach(suggestion => {
      expandedHTML += `<li class="titles-suggestion-item">${suggestion}</li>`;
    });
    
    expandedHTML += `
        </ul>
      </div>`;
  }
  
  expandedHTML += '</div>'; // Close grid
  
  // Score Breakdown Section (full width)
  if (analyzerData.scoreBreakdown && Object.keys(analyzerData.scoreBreakdown).length > 0) {
    const breakdown = analyzerData.scoreBreakdown;
    expandedHTML += `
      <div class="titles-expanded-section">
        <h4>📊 Score Breakdown</h4>
        <div class="titles-score-grid">`;
    
    // Display each score component
    const scoreComponents = [
      { label: 'Keyword Score (KOS)', value: breakdown.kos || 0, max: 20 },
      { label: 'Generic Score (GOS)', value: breakdown.gos || 0, max: 80 },
      { label: 'Frontload Bonus', value: breakdown.frontload_score || 0, max: 10 },
      { label: 'Keyword Match', value: breakdown.keyword_match_score || 0, max: 20 },
      { label: 'Brand Score', value: breakdown.brand_score || 0, max: 10 },
      { label: 'Category Score', value: breakdown.category_score || 0, max: 10 },
      { label: 'Length Score', value: breakdown.length_score || 0, max: 10 },
      { label: 'Attributes Score', value: breakdown.attributes_score || 0, max: 10 },
      { label: 'Quality Score', value: breakdown.quality_score || 0, max: 10 }
    ];
    
    scoreComponents.forEach(component => {
      if (component.value !== undefined) {
        expandedHTML += `
          <div class="titles-score-item">
            <span class="titles-score-label">${component.label}:</span>
            <span class="titles-score-value">${component.value}/${component.max}</span>
          </div>`;
      }
    });
    
    expandedHTML += '</div>';
    
    // Penalties section
    const penalties = [];
    if (breakdown.length_penalty) penalties.push({ reason: 'Title length not optimal', value: breakdown.length_penalty });
    if (breakdown.keyword_penalty) penalties.push({ reason: 'Missing important keywords', value: breakdown.keyword_penalty });
    if (breakdown.position_penalty) penalties.push({ reason: 'Keywords not frontloaded', value: breakdown.position_penalty });
    
    if (penalties.length > 0) {
      expandedHTML += `
        <div class="titles-penalties-box">
          <h5 style="margin: 0 0 8px 0; font-size: 13px; color: #dc2626;">⚠️ Penalties Applied</h5>`;
      
      penalties.forEach(penalty => {
        expandedHTML += `
          <div class="titles-penalty-item">
            <span class="titles-penalty-icon">▼</span>
            <span>${penalty.reason}: -${Math.abs(penalty.value)} points</span>
          </div>`;
      });
      
      expandedHTML += '</div>';
    }
    
    expandedHTML += '</div>'; // Close score breakdown section
  }
  
  expandedHTML += '</div>'; // Close expanded content
  
  expandedCell.innerHTML = expandedHTML;
  expandedRow.appendChild(expandedCell);
  
  // Insert after the clicked row
  row.parentNode.insertBefore(expandedRow, row.nextSibling);
}

function addTitlesSortingFunctionality(table, products, processedMetrics, analyzerResults) {
  const headers = table.querySelectorAll('th.sortable');
  let currentSort = { column: 'impressions', direction: 'desc' };
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      
      // Toggle direction if same column
      if (currentSort.column === sortKey) {
        currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
      } else {
        currentSort.column = sortKey;
        currentSort.direction = 'desc';
      }
      
      // Remove all sort indicators
      headers.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Add current sort indicator
      this.classList.add(currentSort.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
      // Sort products with enhanced data
      const sortedProducts = [...products].sort((a, b) => {
        let aVal, bVal;
        
        switch(sortKey) {
          case 'position':
            const aMetrics = processedMetrics.get(a.title);
            const bMetrics = processedMetrics.get(b.title);
            aVal = aMetrics?.avgPosition || 999;
            bVal = bMetrics?.avgPosition || 999;
            break;
          case 'share':
            const aShare = processedMetrics.get(a.title);
            const bShare = processedMetrics.get(b.title);
            aVal = aShare?.avgVisibility || 0;
            bVal = bShare?.avgVisibility || 0;
            break;
          case 'score':
            const aScore = analyzerResults.get(a.title);
            const bScore = analyzerResults.get(b.title);
            aVal = aScore?.finalScore || 0;
            bVal = bScore?.finalScore || 0;
            break;
          case 'kos':
            const aKos = analyzerResults.get(a.title);
            const bKos = analyzerResults.get(b.title);
            aVal = aKos?.avgKos || 0;  // Use avgKos
            bVal = bKos?.avgKos || 0;
            break;
          case 'gos':
            const aGos = analyzerResults.get(a.title);
            const bGos = analyzerResults.get(b.title);
            aVal = aGos?.gos || 0;
            bVal = bGos?.gos || 0;
            break;
          case 'suggestions':
            const aSugg = analyzerResults.get(a.title);
            const bSugg = analyzerResults.get(b.title);
            aVal = aSugg?.improvementSuggestions?.length || 0;
            bVal = bSugg?.improvementSuggestions?.length || 0;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          case 'revenue':
            aVal = a.convValue;
            bVal = b.convValue;
            break;
          default:
            aVal = a[sortKey] || 0;
            bVal = b[sortKey] || 0;
        }
        
        if (currentSort.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      // Re-render table with sorted data
      const container = table.closest('.titles-products-table-container');
      container.innerHTML = '';
      renderTitlesProductsTable(container, sortedProducts, analyzerResults);
    });
  });
}

// Export initialization function
window.initializeTitlesAnalyzer = initializeTitlesAnalyzer;
