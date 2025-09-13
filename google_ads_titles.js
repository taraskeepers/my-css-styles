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
        height: 30px;
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

/* Expanded details row - ULTRA COMPACT REDESIGN */
.titles-expanded-row {
  background: #f8f9fa;
}

.titles-expanded-row td {
  padding: 0 !important;
}

.titles-expanded-content {
  padding: 12px 16px;
  max-height: 480px;
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Compact 4-column layout */
.titles-compact-grid {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

/* Compact section styling */
.titles-compact-section {
  background: white;
  border: 1px solid #e1e4e8;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.titles-compact-header {
  background: linear-gradient(to right, #f6f8fa, #ffffff);
  padding: 6px 10px;
  border-bottom: 1px solid #e1e4e8;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.titles-compact-title {
  font-size: 11px;
  font-weight: 600;
  color: #24292e;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin: 0;
}

.titles-compact-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

/* Score group styling */
.titles-score-group {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e1e4e8;
}

.titles-score-group:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.titles-score-group-title {
  font-size: 10px;
  font-weight: 700;
  color: #6a737d;
  text-transform: uppercase;
  margin-bottom: 6px;
  letter-spacing: 0.5px;
}

.titles-score-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
  font-size: 11px;
}

/* Score item with bar visualization */
.titles-score-item-with-bar {
  display: flex;
  align-items: center;
  padding: 5px 0;
  font-size: 11px;
  position: relative;
}

.titles-score-item-label {
  color: #24292e;
  min-width: 85px;
  font-size: 11px;
}

.titles-score-bar-container {
  flex: 1;
  height: 16px;
  background: #f0f2f5;
  border-radius: 3px;
  position: relative;
  margin: 0 8px;
  overflow: hidden;
}

.titles-score-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.titles-score-bar-fill.high {
  background: linear-gradient(90deg, #22c55e, #16a34a);
}

.titles-score-bar-fill.medium {
  background: linear-gradient(90deg, #fbbf24, #f59e0b);
}

.titles-score-bar-fill.low {
  background: linear-gradient(90deg, #f87171, #ef4444);
}

.titles-score-value {
  font-weight: 700;
  color: #24292e;
  min-width: 45px;
  text-align: right;
  font-size: 12px;
}

.titles-score-group {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e1e4e8;
}

.titles-score-group-title {
  font-size: 10px;
  font-weight: 700;
  color: #6a737d;
  text-transform: uppercase;
  margin-bottom: 8px;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.titles-score-group-title::before {
  content: '';
  width: 3px;
  height: 12px;
  background: linear-gradient(180deg, #667eea, #764ba2);
  border-radius: 2px;
}

/* Enhanced suggestions styling */
.titles-suggestion-item {
  padding: 10px 12px;
  background: linear-gradient(135deg, #fffbeb, #fef3c7);
  border-left: 4px solid #f59e0b;
  border-radius: 4px;
  font-size: 13px;
  color: #451a03;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-bottom: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.titles-suggestion-item:hover {
  transform: translateX(2px);
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}

.titles-suggestion-icon {
  color: #f59e0b;
  font-size: 14px;
  font-weight: 700;
  flex-shrink: 0;
  margin-top: 1px;
}

.titles-suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  max-height: 320px;
  overflow-y: auto;
  padding-right: 4px;
}

.titles-suggestions-list::-webkit-scrollbar {
  width: 4px;
}

.titles-suggestions-list::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 2px;
}

.titles-suggestions-list::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 2px;
}

.titles-score-item-label {
  color: #24292e;
  flex: 1;
}

.titles-score-item-value {
  font-weight: 600;
  color: #24292e;
  margin-left: auto;
  min-width: 40px;
  text-align: right;
}

.titles-score-item.total {
  font-weight: 700;
  padding-top: 4px;
  margin-top: 4px;
  border-top: 1px solid #f0f2f5;
}

/* Updated suggestions styling */
.titles-suggestion-mini {
  padding: 6px 8px;
  background: #fffbeb;
  border-left: 3px solid #f59e0b;
  border-radius: 3px;
  font-size: 12px;
  color: #78350f;
  line-height: 1.4;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

/* Ultra-compact keywords table */
.titles-keywords-compact {
  width: 100%;
  font-size: 11px;
}

.titles-keywords-compact tr {
  height: 24px;
}

.titles-keywords-compact td {
  padding: 2px 4px;
  border-bottom: 1px solid #f0f2f5;
  color: #24292e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titles-keywords-compact td:first-child {
  width: 20px;
  text-align: center;
  font-weight: 600;
  color: #6a737d;
}

.titles-keywords-compact td:last-child {
  width: 35px;
  text-align: center;
}

.titles-kos-mini {
  display: inline-block;
  padding: 1px 5px;
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
}

.kos-h { background: #dcfce7; color: #15803d; }
.kos-m { background: #fef3c7; color: #b45309; }
.kos-l { background: #fee2e2; color: #991b1b; }

/* Inline score display */
.titles-scores-inline {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
}

.titles-score-row {
  display: flex;
  align-items: center;
  height: 22px;
  font-size: 10px;
}

.titles-score-label {
  flex: 0 0 55px;
  color: #6a737d;
  font-weight: 500;
  padding-right: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.titles-score-visual {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 4px;
}

.titles-mini-bar {
  flex: 1;
  height: 12px;
  background: #f0f2f5;
  border-radius: 2px;
  position: relative;
  overflow: hidden;
}

.titles-mini-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 2px;
}

.fill-high { background: #22c55e; }
.fill-mid { background: #fbbf24; }
.fill-low { background: #ef4444; }

.titles-score-text {
  font-size: 10px;
  font-weight: 600;
  color: #24292e;
  min-width: 32px;
  text-align: right;
}

/* Compact penalties */
.titles-penalties-compact {
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 4px;
  padding: 6px;
  margin-top: 6px;
}

.titles-penalties-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 4px;
  font-size: 10px;
}

.titles-penalty-row {
  display: flex;
  justify-content: space-between;
  padding: 2px 4px;
  background: white;
  border-radius: 2px;
}

.titles-penalty-label {
  color: #7f1d1d;
}

.titles-penalty-val {
  color: #dc2626;
  font-weight: 600;
}

/* Ultra-compact suggestions */
.titles-suggestions-ultra {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.titles-suggestion-mini {
  padding: 4px 6px;
  background: #fffbeb;
  border-left: 2px solid #f59e0b;
  border-radius: 2px;
  font-size: 10px;
  color: #78350f;
  line-height: 1.3;
  display: flex;
  align-items: flex-start;
  gap: 4px;
}

.titles-suggestion-mini span:first-child {
  color: #f59e0b;
  flex-shrink: 0;
}

/* Custom compact scrollbar */
.titles-compact-body::-webkit-scrollbar {
  width: 3px;
}

.titles-compact-body::-webkit-scrollbar-track {
  background: #f0f2f5;
}

.titles-compact-body::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 1px;
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
// In the loadTitleAnalyzerResults function, update the analyzerMap.set portion:
analyzerMap.set(item.title, {
  finalScore: item.final_score || 0,
  kos: item.kos || 0,
  avgKos: item.avg_kos || 0,
  gos: item.gos || 0,
  kosDetails: item.kos_details || [],
  scoreBreakdown: {
    attribute_score: item.score_breakdown?.attribute_score || 0,
    brand_score: item.score_breakdown?.brand_score || 0,
    category_critical_count: item.score_breakdown?.category_critical_count || 0,
    category_pack_adjustment: item.score_breakdown?.category_pack_adjustment || 0,
    category_score: item.score_breakdown?.category_score || 0,
    character_score: item.score_breakdown?.character_score || 0,
    frontload_score: item.score_breakdown?.frontload_score || 0,
    hooks_score: item.score_breakdown?.hooks_score || 0,
    keyword_match_score: item.score_breakdown?.keyword_match_score || 0,
    readability_score: item.score_breakdown?.readability_score || 0,
    structure_score: item.score_breakdown?.structure_score || 0,
    penalties: item.penalties || {
      caps_penalty: 0,
      promo_penalty: 0,
      repetition_penalty: 0,
      symbol_penalty: 0,
      total: 0
    }
  },
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
    
// T-Score class (using rounded value for consistency)
    const roundedScore = Math.round(finalScore);
    let tscoreClass = 'titles-tscore-poor';
    if (roundedScore > 70) tscoreClass = 'titles-tscore-excellent';
    else if (roundedScore >= 55) tscoreClass = 'titles-tscore-good';
    else if (roundedScore >= 40) tscoreClass = 'titles-tscore-fair';
    
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
            <span class="titles-score-value">${Math.round(finalScore)}</span>
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

function toggleRowExpansion(row, analyzerResults) {
  const nextRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');
  
  if (isExpanded && nextRow && nextRow.classList.contains('titles-expanded-row')) {
    row.classList.remove('expanded');
    nextRow.remove();
    return;
  }
  
  const tbody = row.parentElement;
  tbody.querySelectorAll('.expanded').forEach(r => r.classList.remove('expanded'));
  tbody.querySelectorAll('.titles-expanded-row').forEach(r => r.remove());
  
  row.classList.add('expanded');
  
  const productTitle = row.dataset.productTitle;
  const analyzerData = analyzerResults.get(productTitle);
  
  if (!analyzerData) {
    console.warn('No analyzer data found for product:', productTitle);
    return;
  }
  
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'titles-expanded-row';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = row.cells.length;
  
  // Build ultra-compact content
  let expandedHTML = '<div class="titles-expanded-content">';
  expandedHTML += '<div class="titles-compact-grid">';
  
// COLUMN 1: Keywords (narrow)
  expandedHTML += `
    <div class="titles-compact-section" style="width: 240px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span style="font-size: 12px;">🎯</span>
        <h4 class="titles-compact-title">Top Keywords</h4>
      </div>
      <div class="titles-compact-body">
        <table class="titles-keywords-compact">
          <thead style="border-bottom: 1px solid #e1e4e8;">
            <tr style="height: 20px;">
              <th style="width: 20px; text-align: center; font-size: 9px; color: #6a737d; font-weight: 600;">#</th>
              <th style="text-align: left; font-size: 9px; color: #6a737d; font-weight: 600; padding-left: 4px;">KEYWORD</th>
              <th style="width: 35px; text-align: center; font-size: 9px; color: #6a737d; font-weight: 600;">KOS</th>
            </tr>
          </thead>
          <tbody>`;
  
  if (analyzerData.kosDetails && analyzerData.kosDetails.length > 0) {
    analyzerData.kosDetails.slice(0, 10).forEach((kw, idx) => {
      const kos = kw.kos || 0;
      const kosClass = kos >= 15 ? 'kos-h' : kos >= 10 ? 'kos-m' : 'kos-l';
      expandedHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td title="${kw.keyword}">${kw.keyword || '-'}</td>
          <td><span class="titles-kos-mini ${kosClass}">${kos}</span></td>
        </tr>`;
    });
  }
  
expandedHTML += `
          </tbody>
        </table>
      </div>
    </div>`;
  
// COLUMN 2: Score Breakdown
  expandedHTML += `
    <div class="titles-compact-section" style="width: 320px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span style="font-size: 12px;">📊</span>
        <h4 class="titles-compact-title">Score Breakdown</h4>
      </div>
      <div class="titles-compact-body">`;
  
  if (analyzerData.scoreBreakdown) {
    const b = analyzerData.scoreBreakdown;
    
    // Helper function to get bar class
    const getBarClass = (value, max) => {
      const pct = (value / max) * 100;
      if (pct >= 70) return 'high';
      if (pct >= 40) return 'medium';
      return 'low';
    };
    
    // GOS BREAKDOWN
    expandedHTML += `
      <div class="titles-score-group">
        <div class="titles-score-group-title">GOS Breakdown</div>`;
    
    const gosItems = [
      { label: 'Brand', value: b.brand_score || 0, max: 5 },
      { label: 'Category', value: b.category_score || 0, max: 10 },
      { label: 'Attributes', value: b.attribute_score || 0, max: 10 },
      { label: 'Hooks', value: b.hooks_score || 0, max: 5 },
      { label: 'Readability', value: b.readability_score || 0, max: 5 },
      { label: 'Structure', value: b.structure_score || 0, max: 15 },
      { label: 'Character', value: b.character_score || 0, max: 30 }
    ];
    
    gosItems.forEach(item => {
      const pct = (item.value / item.max) * 100;
      const barClass = getBarClass(item.value, item.max);
      expandedHTML += `
        <div class="titles-score-item-with-bar">
          <span class="titles-score-item-label">${item.label}:</span>
          <div class="titles-score-bar-container">
            <div class="titles-score-bar-fill ${barClass}" style="width: ${pct}%"></div>
          </div>
          <span class="titles-score-value">${item.value}/${item.max}</span>
        </div>`;
    });
    
    const totalGos = analyzerData.gos || 0;
    const gosPct = (totalGos / 80) * 100;
    expandedHTML += `
      <div class="titles-score-item-with-bar" style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #f0f2f5;">
        <span class="titles-score-item-label" style="font-weight: 700;">Total GOS:</span>
        <div class="titles-score-bar-container">
          <div class="titles-score-bar-fill ${getBarClass(totalGos, 80)}" style="width: ${gosPct}%"></div>
        </div>
        <span class="titles-score-value" style="font-weight: 700;">${totalGos}/80</span>
      </div>
    </div>`;
    
    // ADJUSTMENTS
    expandedHTML += `
      <div class="titles-score-group">
        <div class="titles-score-group-title">Adjustments</div>
        <div class="titles-score-item" style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span class="titles-score-item-label">Category Pack:</span>
          <span class="titles-score-value" style="color: ${(b.category_pack_adjustment || 0) < 0 ? '#dc2626' : (b.category_pack_adjustment || 0) > 0 ? '#22c55e' : '#6a737d'};">
            ${(b.category_pack_adjustment || 0) > 0 ? '+' : ''}${b.category_pack_adjustment || 0}
          </span>
        </div>
        <div class="titles-score-item" style="display: flex; justify-content: space-between; padding: 4px 0;">
          <span class="titles-score-item-label">Penalties:</span>
          <span class="titles-score-value" style="color: ${b.penalties?.total ? '#dc2626' : '#6a737d'};">
            ${b.penalties?.total ? '-' + b.penalties.total : '0'}
          </span>
        </div>
      </div>`;
    
    // FINAL SCORE
    const finalScorePct = (analyzerData.finalScore / 100) * 100;
    const roundedFinalScore = Math.round(analyzerData.finalScore);
    const finalScoreClass = roundedFinalScore > 70 ? 'high' : roundedFinalScore > 40 ? 'medium' : 'low';
    
    expandedHTML += `
      <div class="titles-score-group" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
        <div class="titles-score-item-with-bar" style="border-top: 2px solid #667eea; padding-top: 8px;">
          <span class="titles-score-item-label" style="font-size: 12px; font-weight: 700; color: #667eea;">FINAL SCORE:</span>
          <div class="titles-score-bar-container" style="height: 20px;">
            <div class="titles-score-bar-fill ${finalScoreClass}" style="width: ${finalScorePct}%"></div>
          </div>
          <span class="titles-score-value" style="font-size: 16px; font-weight: 700; color: ${roundedFinalScore > 70 ? '#22c55e' : roundedFinalScore > 40 ? '#f59e0b' : '#ef4444'};">
            ${Math.round(analyzerData.finalScore)}/100
          </span>
        </div>
      </div>`;
  }
  
  expandedHTML += `
      </div>
    </div>`;
  
  // COLUMN 3: Title Metrics
  expandedHTML += `
    <div class="titles-compact-section" style="width: 200px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span style="font-size: 12px;">📏</span>
        <h4 class="titles-compact-title">Title Metrics</h4>
      </div>
      <div class="titles-compact-body">
        <div style="font-size: 11px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Length:</span>
            <strong>${analyzerData.titleLength || 0} chars</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Words:</span>
            <strong>${analyzerData.wordCount || 0}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">T-Score:</span>
            <strong style="color: ${analyzerData.finalScore > 70 ? '#22c55e' : analyzerData.finalScore > 40 ? '#f59e0b' : '#ef4444'}">
              ${Math.round(analyzerData.finalScore)}/100
            </strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Avg KOS:</span>
            <strong>${(analyzerData.avgKos || 0).toFixed(1)}/20</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #6a737d;">GOS:</span>
            <strong>${analyzerData.gos || 0}/80</strong>
          </div>
        </div>
      </div>
    </div>`;
  
// COLUMN 4: Improvements
  expandedHTML += `
    <div class="titles-compact-section" style="width: 420px; flex-shrink: 0;">
      <div class="titles-compact-header">
        <span style="font-size: 12px;">💡</span>
        <h4 class="titles-compact-title">Improvements (${analyzerData.improvementSuggestions?.length || 0})</h4>
      </div>
      <div class="titles-compact-body" style="height: 340px; overflow-y: auto;">
        <div class="titles-suggestions-list">`;
  
  if (analyzerData.improvementSuggestions && analyzerData.improvementSuggestions.length > 0) {
    analyzerData.improvementSuggestions.forEach((suggestion, index) => {
      expandedHTML += `
        <div class="titles-suggestion-item">
          <span class="titles-suggestion-icon">${index + 1}</span>
          <span>${suggestion}</span>
        </div>`;
    });
  } else {
    expandedHTML += `
      <div style="color: #6a737d; font-size: 12px; text-align: center; padding: 40px;">
        <div style="font-size: 32px; margin-bottom: 10px;">✨</div>
        <div>No improvements needed!</div>
        <div style="font-size: 11px; margin-top: 4px;">This title is well optimized.</div>
      </div>`;
  }
  
  expandedHTML += `
        </div>
      </div>
    </div>`;
  
  expandedHTML += '</div></div>';
  
  expandedCell.innerHTML = expandedHTML;
  expandedRow.appendChild(expandedCell);
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
