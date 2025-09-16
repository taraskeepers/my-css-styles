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
/* Header right section and switcher */
.titles-header-right {
  display: flex;
  align-items: center;
}

.titles-view-switcher {
  display: flex;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 3px;
  gap: 4px;
}

.titles-switch-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.titles-switch-btn span {
  font-size: 14px;
}

.titles-switch-btn:hover {
  color: rgba(255, 255, 255, 0.9);
}

.titles-switch-btn.active {
  background: white;
  color: #667eea;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Search terms table container */
.titles-search-terms-table-container {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
  display: none;
}

/* Search terms expanded rows */
.titles-search-terms-expanded {
  animation: slideDown 0.3s ease-out;
}

.titles-search-terms-products {
  background: #f8f9fa;
  padding: 8px 0;
}
/* Search terms table row height and styling */
.titles-search-terms-table-container .titles-table-modern tbody tr {
  height: 70px;
}

.titles-search-term-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

/* Modern KOS distribution chart */
.titles-kos-distribution {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  padding: 16px;
  margin: 12px;
  width: 260px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
  align-self: flex-start;
}

.titles-kos-distribution h4 {
  margin: 0 0 16px 0;
  font-size: 14px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
}

.titles-kos-bar-row {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 12px;
}

.titles-kos-bar-row:last-child {
  margin-bottom: 0;
}

.titles-kos-bar-label {
  min-width: 65px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  display: flex;
  align-items: center;
  gap: 6px;
}

.titles-kos-score-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 42px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
}

.titles-kos-bar-container {
  flex: 1;
  height: 24px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.titles-kos-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: 12px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}

.titles-kos-bar-count {
  font-size: 12px;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.3);
}

.titles-search-products-container {
  display: flex;
  gap: 16px;
  padding: 12px 16px 16px;
  background: #f8f9fa;
}

.titles-search-products-table {
  flex: 1;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.titles-search-products-header {
  background: linear-gradient(to bottom, #ffffff, #f9f9f9);
  border-bottom: 2px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 10;
}

.titles-search-products-header th {
  padding: 8px 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: #6c757d;
  text-align: left;
  white-space: nowrap;
}

.titles-expanded-product-row {
  height: 70px;
  border-bottom: 1px solid #f0f2f5;
  transition: background 0.2s ease;
}

.titles-expanded-product-row:hover {
  background: rgba(102, 126, 234, 0.02);
}

/* Image zoom for expanded rows */
.titles-expanded-img-container {
  position: relative;
  display: inline-block;
}

.titles-expanded-img-zoom {
  position: fixed;
  width: 250px;
  height: 250px;
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

.titles-expanded-img-container:hover .titles-expanded-img-zoom {
  opacity: 1;
}

/* Title filter and averages section */
.titles-filter-section {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
  margin-left: 50px; /* Fixed 50px from titles-header-left */
  position: relative;
}

.titles-title-filter {
  position: relative;
  width: 280px;
}

.titles-filter-input {
  width: 100%;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  outline: none;
  transition: all 0.3s ease;
}

.titles-filter-input::placeholder {
  color: #999;
}

.titles-filter-input:focus {
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* Filter tags container */
.titles-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  min-height: 28px;
}

.titles-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: white;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  font-size: 12px;
  color: #667eea;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.titles-filter-tag-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.titles-filter-tag-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 10px;
  color: #667eea;
}

.titles-filter-tag-remove:hover {
  background: #667eea;
  color: white;
}

.titles-avg-scores {
  position: absolute;
  right: 600px; /* Adjusted to align with score columns */
  display: flex;
  gap: 20px;
  align-items: center;
}

.titles-avg-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 10px;
  min-width: 85px;
  min-height: 50px;
}

/* T-Score average styling */
.titles-avg-item.tscore-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.titles-avg-item.tscore-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
}

.titles-avg-item.tscore-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.titles-avg-item.tscore-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

/* KOS average styling */
.titles-avg-item.kos-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.titles-avg-item.kos-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
}

.titles-avg-item.kos-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.titles-avg-item.kos-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

/* GOS average styling */
.titles-avg-item.gos-excellent {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.titles-avg-item.gos-good {
  background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
}

.titles-avg-item.gos-fair {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.titles-avg-item.gos-poor {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

.titles-avg-score-display {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 700;
}

.titles-avg-value {
  font-size: 18px;
  color: white;
}

.titles-avg-max {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.85);
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
  <div class="titles-filter-section">
    <div class="titles-title-filter">
      <input type="text" 
             class="titles-filter-input" 
             id="titleFilterInput" 
             placeholder="🔍 Filter products by title... (Press Enter)" 
             autocomplete="off">
      <div class="titles-filter-tags" id="titleFilterTags"></div>
    </div>
<div class="titles-avg-scores">
  <div class="titles-avg-item" id="avgTScoreContainer">
    <div style="display: flex; flex-direction: column; align-items: center;">
      <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG T-SCORE</span>
      <div class="titles-avg-score-display">
        <span class="titles-avg-value" id="avgTScore">-</span>
        <span class="titles-avg-max">/100</span>
      </div>
    </div>
  </div>
  <div class="titles-avg-item" id="avgKOSContainer">
    <div style="display: flex; flex-direction: column; align-items: center;">
      <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG KOS</span>
      <div class="titles-avg-score-display">
        <span class="titles-avg-value" id="avgKOS">-</span>
        <span class="titles-avg-max">/20</span>
      </div>
    </div>
  </div>
  <div class="titles-avg-item" id="avgGOSContainer">
    <div style="display: flex; flex-direction: column; align-items: center;">
      <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG GOS</span>
      <div class="titles-avg-score-display">
        <span class="titles-avg-value" id="avgGOS">-</span>
        <span class="titles-avg-max">/80</span>
      </div>
    </div>
  </div>
</div>
`;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'titles-products-table-container';
  productsPanel.appendChild(tableContainer);

  // Create search terms table container
const searchTermsContainer = document.createElement('div');
searchTermsContainer.className = 'titles-search-terms-table-container';
searchTermsContainer.style.display = 'none';
productsPanel.appendChild(searchTermsContainer);
  
// Load and render data
try {
  const [products, analyzerResults] = await Promise.all([
    loadTitlesProductData(),
    loadTitleAnalyzerResults()
  ]);
  
  // Get product titles for matching
  const productTitles = products.map(p => p.title);
  
  // Load processed data for POS and SHARE
  const processedMetrics = await loadProcessedDataForTitles(productTitles);
  
// Store data for switcher including processedMetrics BEFORE rendering
window.titlesAnalyzerData = { products, analyzerResults, processedMetrics };

// Render products table (default view)
await renderTitlesProductsTable(tableContainer, products, analyzerResults);

// Initialize averages after a delay to ensure DOM is ready
setTimeout(() => {
  updateTitlesAverages(products, analyzerResults, []);
  
  // Add filter event listener for Enter key
  const filterInput = document.getElementById('titleFilterInput');
  if (filterInput) {
    filterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const filterText = e.target.value.trim();
        if (filterText.length > 0) {
          console.log('[Filter] Adding filter tag:', filterText);
          addFilterTag(filterText);
          applyTitleFilters();
          e.target.value = ''; // Clear input after adding
        }
      }
    });
  }
}, 200);
  
// Add switcher event listeners
header.querySelectorAll('.titles-switch-btn').forEach(btn => {
  btn.addEventListener('click', async function() {
    // Update active state
    header.querySelectorAll('.titles-switch-btn').forEach(b => b.classList.remove('active'));
    this.classList.add('active');
    
    const view = this.dataset.view;
    
    if (view === 'products') {
      tableContainer.style.display = 'block';
      searchTermsContainer.style.display = 'none';
      
      // Clear filters when switching back
      const tagsContainer = document.getElementById('titleFilterTags');
      if (tagsContainer) {
        tagsContainer.innerHTML = '';
      }
      const filterInput = document.getElementById('titleFilterInput');
      if (filterInput) {
        filterInput.value = '';
      }
      
      // Re-render with all products
      const container = document.querySelector('.titles-products-table-container');
      if (container) {
        container.innerHTML = '';
        renderTitlesProductsTable(container, window.titlesAnalyzerData.products, window.titlesAnalyzerData.analyzerResults);
      }
      updateTitlesAverages(window.titlesAnalyzerData.products, window.titlesAnalyzerData.analyzerResults, []);
      
    } else if (view === 'search-terms') {
      tableContainer.style.display = 'none';
      searchTermsContainer.style.display = 'block';
      
      // Render search terms table if not already rendered
      if (!searchTermsContainer.hasChildNodes()) {
        await renderTitlesSearchTermsTable(
          searchTermsContainer, 
          window.titlesAnalyzerData.analyzerResults,
          window.titlesAnalyzerData.products
        );
      }
    }
  });
});
  
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

function updateTitlesAverages(products, analyzerResults, filterTexts = []) {
  console.log('[updateTitlesAverages] Called with products:', products?.length, 'analyzerResults:', analyzerResults?.size);
  
  // Ensure we have valid inputs
  if (!products || !analyzerResults) {
    console.warn('[updateTitlesAverages] Missing products or analyzerResults');
    return;
  }
  
  // Filter products if needed
  let filteredProducts = products;
  if (filterTexts && filterTexts.length > 0) {
    filteredProducts = products.filter(p => {
      const title = p.title.toLowerCase();
      return filterTexts.every(filterText => 
        title.includes(filterText.toLowerCase())
      );
    });
  }
  
  // Calculate averages
  let totalTScore = 0;
  let totalKOS = 0;
  let totalGOS = 0;
  let tScoreCount = 0;
  let kosCount = 0;
  let gosCount = 0;
  
  filteredProducts.forEach(product => {
    const analyzerData = analyzerResults.get(product.title);
    if (analyzerData) {
      if (analyzerData.finalScore !== undefined && analyzerData.finalScore > 0) {
        totalTScore += analyzerData.finalScore;
        tScoreCount++;
      }
      if (analyzerData.avgKos !== undefined && analyzerData.avgKos > 0) {
        totalKOS += analyzerData.avgKos;
        kosCount++;
      }
      if (analyzerData.gos !== undefined && analyzerData.gos > 0) {
        totalGOS += analyzerData.gos;
        gosCount++;
      }
    }
  });
  
  // Calculate averages
  const avgTScoreValue = tScoreCount > 0 ? Math.round(totalTScore / tScoreCount) : 0;
  const avgKOSValue = kosCount > 0 ? (totalKOS / kosCount) : 0;
  const avgGOSValue = gosCount > 0 ? Math.round(totalGOS / gosCount) : 0;
  
  console.log('[updateTitlesAverages] Calculated:', { avgTScoreValue, avgKOSValue, avgGOSValue });
  
  // Update display with timeout to ensure DOM is ready
  setTimeout(() => {
    const avgTScoreEl = document.getElementById('avgTScore');
    const avgKOSEl = document.getElementById('avgKOS');
    const avgGOSEl = document.getElementById('avgGOS');
    
    if (avgTScoreEl) {
      avgTScoreEl.textContent = tScoreCount > 0 ? avgTScoreValue : '-';
      // Update T-Score container class
      const container = document.getElementById('avgTScoreContainer');
      if (container && tScoreCount > 0) {
        container.className = 'titles-avg-item';
        if (avgTScoreValue > 70) container.classList.add('tscore-excellent');
        else if (avgTScoreValue >= 55) container.classList.add('tscore-good');
        else if (avgTScoreValue >= 40) container.classList.add('tscore-fair');
        else container.classList.add('tscore-poor');
      }
    }
    
    if (avgKOSEl) {
      avgKOSEl.textContent = kosCount > 0 ? avgKOSValue.toFixed(1) : '-';
      // Update KOS container class
      const container = document.getElementById('avgKOSContainer');
      if (container && kosCount > 0) {
        container.className = 'titles-avg-item';
        if (avgKOSValue > 15) container.classList.add('kos-excellent');
        else if (avgKOSValue >= 10) container.classList.add('kos-good');
        else if (avgKOSValue > 5) container.classList.add('kos-fair');
        else container.classList.add('kos-poor');
      }
    }
    
    if (avgGOSEl) {
      avgGOSEl.textContent = gosCount > 0 ? avgGOSValue : '-';
      // Update GOS container class
      const container = document.getElementById('avgGOSContainer');
      if (container && gosCount > 0) {
        container.className = 'titles-avg-item';
        if (avgGOSValue > 60) container.classList.add('gos-excellent');
        else if (avgGOSValue >= 40) container.classList.add('gos-good');
        else if (avgGOSValue >= 20) container.classList.add('gos-fair');
        else container.classList.add('gos-poor');
      }
    }
  }, 50);
}

function getActiveFilterTexts() {
  const tags = document.querySelectorAll('.titles-filter-tag');
  return Array.from(tags).map(tag => tag.dataset.filterText);
}

function addFilterTag(filterText) {
  const tagsContainer = document.getElementById('titleFilterTags');
  if (!tagsContainer) return;
  
  // Check if filter already exists
  const existingTags = Array.from(tagsContainer.querySelectorAll('.titles-filter-tag'));
  if (existingTags.some(tag => tag.dataset.filterText.toLowerCase() === filterText.toLowerCase())) {
    return;
  }
  
  const tag = document.createElement('div');
  tag.className = 'titles-filter-tag';
  tag.dataset.filterText = filterText;
  tag.innerHTML = `
    <span class="titles-filter-tag-text" title="${filterText}">${filterText}</span>
    <span class="titles-filter-tag-remove">✕</span>
  `;
  
  // Add remove handler
  tag.querySelector('.titles-filter-tag-remove').addEventListener('click', function() {
    tag.remove();
    applyTitleFilters();
  });
  
  tagsContainer.appendChild(tag);
}

function applyTitleFilters() {
  const filterTexts = getActiveFilterTexts();
  
  if (!window.titlesAnalyzerData) {
    console.error('[applyTitleFilters] No titles analyzer data available');
    return;
  }
  
  const { products, analyzerResults, processedMetrics } = window.titlesAnalyzerData;
  
  let filteredProducts = products;
  if (filterTexts.length > 0) {
    filteredProducts = products.filter(p => {
      const title = p.title.toLowerCase();
      return filterTexts.every(filterText => 
        title.includes(filterText.toLowerCase())
      );
    });
  }
  
  // Clear and re-render table
  const container = document.querySelector('.titles-products-table-container');
  if (container) {
    container.innerHTML = '';
    renderTitlesProductsTable(container, filteredProducts, analyzerResults);
  }
  
  // Update averages
  updateTitlesAverages(products, analyzerResults, filterTexts);
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

async function loadSearchTermsDataForTitles() {
  try {
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : (() => {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        return `${accountPrefix}_pr${currentProjectNum}_`;
      })();
    
    const days = window.selectedDateRangeDays || 30;
    const suffix = days === 365 ? '365d' : days === 90 ? '90d' : days === 60 ? '60d' : '30d';
    const tableName = `${tablePrefix}googleSheets_searchTerms_${suffix}`;
    
    console.log('[loadSearchTermsDataForTitles] Loading from table:', tableName);
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data || result.data.length === 0) {
      console.warn('[loadSearchTermsDataForTitles] No search terms data found');
      return new Map();
    }
    
    // Filter exactly like search_terms_tab.js does
    const filteredData = result.data.filter(item => 
      item.Query && 
      item.Query.toLowerCase() !== 'blank' &&
      item.Campaign_Name === 'all' &&
      item.Channel_Type === 'all'
    );
    
    console.log(`[loadSearchTermsDataForTitles] Filtered to ${filteredData.length} all/all records`);
    
    // Calculate total revenue for correct percentage
    const totalRevenue = filteredData.reduce((sum, item) => sum + (item.Value || 0), 0);
    
    // Create map with exact same data structure as search_terms_tab.js
    const searchTermsMap = new Map();
    filteredData.forEach(item => {
      // Recalculate percentage based on all/all total
      const revenuePercent = totalRevenue > 0 ? (item.Value / totalRevenue) : 0;
      
      searchTermsMap.set(item.Query.toLowerCase(), {
        Query: item.Query,
        Impressions: item.Impressions || 0,
        Clicks: item.Clicks || 0,
        Conversions: item.Conversions || 0,
        Value: item.Value || 0,
        '% of all revenue': revenuePercent
      });
    });
    
    console.log('[loadSearchTermsDataForTitles] Loaded search terms:', searchTermsMap.size);
    return searchTermsMap;
  } catch (error) {
    console.error('[loadSearchTermsDataForTitles] Error:', error);
    return new Map();
  }
}

// Extract top keywords from analyzer results
function extractTopKeywords(analyzerResults) {
  // Get first record to extract the keywords list
  for (const [, data] of analyzerResults) {
    if (data.kosDetails && data.kosDetails.length > 0) {
      return data.kosDetails.slice(0, 10).map(kd => kd.keyword);
    }
  }
  return [];
}

function calculateKeywordStats(keyword, analyzerResults) {
  let optimizedCount = 0;
  let rankedCount = 0;
  const rankedProducts = [];
  
  for (const [title, data] of analyzerResults) {
    if (data.kosDetails && Array.isArray(data.kosDetails)) {
      // Try to find exact match first
      let keywordData = data.kosDetails.find(kd => 
        kd.keyword && kd.keyword.toLowerCase() === keyword.toLowerCase()
      );
      
      // If no exact match, try to find partial match
      if (!keywordData) {
        keywordData = data.kosDetails.find(kd => 
          kd.keyword && (
            kd.keyword.toLowerCase().includes(keyword.toLowerCase()) ||
            keyword.toLowerCase().includes(kd.keyword.toLowerCase())
          )
        );
      }
      
      // If still no match but we have kosDetails, check if this keyword exists in top 10
      if (!keywordData && data.kosDetails.length > 0) {
        // Check if this is one of the top 10 keywords by position
        const keywordIndex = data.kosDetails.findIndex(kd => 
          kd.keyword && kd.keyword.toLowerCase() === keyword.toLowerCase()
        );
        
        // If it's in the top 10 positions, use the data
        if (keywordIndex >= 0 && keywordIndex < 10) {
          keywordData = data.kosDetails[keywordIndex];
        }
      }
      
      if (keywordData) {
        const kos = keywordData.kos || 0;
        if (kos === 20) optimizedCount++;
        if (kos > 0) {
          rankedCount++;
          rankedProducts.push({ 
            title, 
            kos,
            // Store the actual keyword data for debugging
            keywordFound: keywordData.keyword
          });
        }
      }
    }
  }
  
  // Debug logging
  console.log(`[calculateKeywordStats] Keyword: "${keyword}", Found products:`, rankedProducts.length);
  if (rankedProducts.length > 0) {
    console.log('[calculateKeywordStats] Sample KOS values:', rankedProducts.slice(0, 5).map(p => ({title: p.title.substring(0, 30), kos: p.kos})));
  }
  
  return { optimizedCount, rankedCount, rankedProducts };
}

async function renderTitlesSearchTermsTable(container, analyzerResults, products) {
  const topKeywords = extractTopKeywords(analyzerResults);
  const searchTermsData = await loadSearchTermsDataForTitles();
  
  if (topKeywords.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        No keyword data available for analysis
      </div>
    `;
    return;
  }
  
  // Pre-load all product ranking summaries for current keywords
  const productRankingSummaries = {};
  const summaryPromises = topKeywords.map(async (keyword) => {
    const summary = await getCompactProductRankingSummaryForTitles(keyword);
    productRankingSummaries[keyword] = summary;
  });
  await Promise.all(summaryPromises);
  
  // Find max values for metric bars
  const maxImpressions = Math.max(...Array.from(searchTermsData.values()).map(d => d.Impressions || 0));
  const maxClicks = Math.max(...Array.from(searchTermsData.values()).map(d => d.Clicks || 0));
  const maxConversions = Math.max(...Array.from(searchTermsData.values()).map(d => d.Conversions || 0));
  const maxRevenue = Math.max(...Array.from(searchTermsData.values()).map(d => d.Value || 0));
  
  const wrapper = document.createElement('div');
  wrapper.className = 'titles-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'titles-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center" style="width: 40px;">#</th>
    <th class="sortable" data-sort="term" style="width: 300px;">
      Search Term
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="optimized" style="width: 90px;">
      # Optimized
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="ranked" style="width: 90px;">
      # Ranked
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="impressions" style="width: 100px;">
      IMPR
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="clicks" style="width: 100px;">
      Clicks
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="ctr" style="width: 70px;">
      CTR %
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="conversions" style="width: 90px;">
      CONV
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="cvr" style="width: 70px;">
      CVR %
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="revenue" style="width: 100px;">
      Revenue
      <span class="titles-sort-icon">⇅</span>
    </th>
    <th class="right sortable" data-sort="revpercent" style="width: 90px;">
      % of Rev
      <span class="titles-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  // Process each keyword
  topKeywords.forEach((keyword, index) => {
    const stats = calculateKeywordStats(keyword, analyzerResults);
    const searchData = searchTermsData.get(keyword.toLowerCase()) || {};
    
    const ctr = searchData.Impressions > 0 ? 
      (searchData.Clicks / searchData.Impressions * 100) : 0;
    const cvr = searchData.Clicks > 0 ? 
      (searchData.Conversions / searchData.Clicks * 100) : 0;
    
    // Determine optimization level colors
    const optimizedColor = stats.optimizedCount > 5 ? '#22c55e' : 
                          stats.optimizedCount > 2 ? '#fbbf24' : '#ef4444';
    const rankedColor = stats.rankedCount > 10 ? '#22c55e' : 
                       stats.rankedCount > 5 ? '#fbbf24' : '#ef4444';
    
    const row = document.createElement('tr');
    row.className = 'titles-search-term-row';
    row.dataset.keyword = keyword;
    row.dataset.rankedProducts = JSON.stringify(stats.rankedProducts);
    row.style.cursor = 'pointer';
    row.style.height = '70px';
    
    row.innerHTML = `
      <td class="center">${index + 1}</td>
      <td>
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <div class="titles-search-term-name">
            ${keyword}
          </div>
          ${renderCompactProductRankingBadgeForTitles(productRankingSummaries[keyword])}
        </div>
      </td>
      <td class="center">
        <span style="padding: 4px 10px; background: ${optimizedColor}15; color: ${optimizedColor}; 
                     border-radius: 12px; font-weight: 700; font-size: 13px;">
          ${stats.optimizedCount}
        </span>
      </td>
      <td class="center">
        <span style="padding: 4px 10px; background: ${rankedColor}15; color: ${rankedColor}; 
                     border-radius: 12px; font-weight: 700; font-size: 13px;">
          ${stats.rankedCount}
        </span>
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          ${maxImpressions > 0 ? 
            `<div class="titles-metric-bar" style="width: ${(searchData.Impressions / maxImpressions * 100)}%;"></div>` : ''}
          <span class="titles-metric-value">${searchData.Impressions ? searchData.Impressions.toLocaleString() : '-'}</span>
        </div>
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          ${maxClicks > 0 ? 
            `<div class="titles-metric-bar" style="width: ${(searchData.Clicks / maxClicks * 100)}%;"></div>` : ''}
          <span class="titles-metric-value">${searchData.Clicks ? searchData.Clicks.toLocaleString() : '-'}</span>
        </div>
      </td>
      <td class="right" style="color: ${ctr > 5 ? '#22c55e' : ctr > 2 ? '#fbbf24' : '#ef4444'};">
        ${ctr.toFixed(2)}%
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          ${maxConversions > 0 ? 
            `<div class="titles-metric-bar" style="width: ${(searchData.Conversions / maxConversions * 100)}%;"></div>` : ''}
          <span class="titles-metric-value">${searchData.Conversions || '-'}</span>
        </div>
      </td>
      <td class="right" style="color: ${cvr > 5 ? '#22c55e' : cvr > 2 ? '#fbbf24' : '#ef4444'};">
        ${cvr.toFixed(2)}%
      </td>
      <td class="right">
        <div class="titles-metric-cell">
          ${maxRevenue > 0 ? 
            `<div class="titles-metric-bar" style="width: ${(searchData.Value / maxRevenue * 100)}%;"></div>` : ''}
          <span class="titles-metric-value">${searchData.Value ? '$' + searchData.Value.toFixed(2) : '-'}</span>
        </div>
      </td>
      <td class="right">
        ${searchData['% of all revenue'] ? (searchData['% of all revenue'] * 100).toFixed(2) + '%' : '-'}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
// Add click handlers for expansion
tbody.querySelectorAll('.titles-search-term-row').forEach(row => {
  row.addEventListener('click', async function() {
    // Get or load processedMetrics
    let processedMetrics = window.titlesAnalyzerData?.processedMetrics;
    if (!processedMetrics) {
      const productTitles = products.map(p => p.title);
      processedMetrics = await loadProcessedDataForTitles(productTitles);
      if (window.titlesAnalyzerData) {
        window.titlesAnalyzerData.processedMetrics = processedMetrics;
      }
    }
    toggleSearchTermExpansion(this, products, analyzerResults, processedMetrics);
  });
});
}

function toggleSearchTermExpansion(row, products, analyzerResults, processedMetrics) {
  const nextRow = row.nextElementSibling;
  const isExpanded = nextRow && nextRow.classList.contains('titles-search-terms-expanded');
  
  if (isExpanded) {
    nextRow.remove();
    return;
  }
  
  const keyword = row.dataset.keyword;
  const rankedProducts = JSON.parse(row.dataset.rankedProducts || '[]');
  
  if (rankedProducts.length === 0) return;
  
// Calculate KOS distribution - using ranges
const kosDistribution = { 
  perfect: 0,  // 20
  good: 0,     // 15-19
  fair: 0,     // 10-14
  poor: 0      // 5-9
};

rankedProducts.forEach(rp => {
  const kos = rp.kos || 0;
  if (kos === 20) kosDistribution.perfect++;
  else if (kos >= 15 && kos < 20) kosDistribution.good++;
  else if (kos >= 10 && kos < 15) kosDistribution.fair++;
  else if (kos >= 5 && kos < 10) kosDistribution.poor++;
});
  
  const maxCount = Math.max(
  kosDistribution.perfect,
  kosDistribution.good,
  kosDistribution.fair,
  kosDistribution.poor,
  1
);

  // Debug logging to understand the distribution
console.log(`[KOS Distribution] Keyword: "${keyword}"`);
console.log('[KOS Distribution] Products found:', rankedProducts.length);
console.log('[KOS Distribution] Distribution:', kosDistribution);
if (rankedProducts.length > 0) {
  console.log('[KOS Distribution] KOS values:', rankedProducts.map(rp => rp.kos));
}
  
  // Get matched products for images
  const matchedProducts = matchProductsWithCompanyData(products);
  
  // Calculate max values for metric bars
  const rankedProductData = rankedProducts.map(rp => {
    const product = products.find(p => p.title === rp.title);
    return product;
  }).filter(p => p);
  
  const maxImpr = Math.max(...rankedProductData.map(p => p.impressions || 0));
  const maxClicks = Math.max(...rankedProductData.map(p => p.clicks || 0));
  const maxCost = Math.max(...rankedProductData.map(p => p.cost || 0));
  const maxRevenue = Math.max(...rankedProductData.map(p => p.convValue || 0));
  
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'titles-search-terms-expanded';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = row.cells.length;
  expandedCell.style.padding = '0';
  
  let expandedHTML = '<div class="titles-search-products-container">';
  
  // Modern KOS Distribution Chart
  expandedHTML += `
    <div class="titles-kos-distribution">
      <h4>
        <span style="font-size: 16px;">📊</span>
        KOS Distribution Analysis
      </h4>`;
  
const kosConfigs = [
  { key: 'perfect', scoreRange: '20', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.2)', label: 'Perfect' },
  { key: 'good', scoreRange: '15-19', color: '#22d3ee', bgColor: 'rgba(34, 211, 238, 0.2)', label: 'Good' },
  { key: 'fair', scoreRange: '10-14', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.2)', label: 'Fair' },
  { key: 'poor', scoreRange: '5-9', color: '#f87171', bgColor: 'rgba(248, 113, 113, 0.2)', label: 'Poor' }
];

kosConfigs.forEach(config => {
  const count = kosDistribution[config.key];
  const percentage = rankedProducts.length > 0 ? (count / rankedProducts.length * 100) : 0;
  let width = maxCount > 0 ? (count / maxCount * 100) : 0;
  
  // Ensure minimum width for visibility if count > 0
  if (count > 0 && width < 15) {
    width = 15; // Minimum 15% width to show the bar and count
  }
  
  expandedHTML += `
    <div class="titles-kos-bar-row">
      <div class="titles-kos-bar-label">
        <span class="titles-kos-score-badge" style="background: ${config.bgColor}; color: ${config.color};">
          ${config.scoreRange}
        </span>
        <span style="font-size: 11px; opacity: 0.9;">${config.label}</span>
      </div>
      <div class="titles-kos-bar-container">
        <div class="titles-kos-bar-fill" style="width: ${width}%; background: ${config.color};">
          <span class="titles-kos-bar-count">${count}</span>
        </div>
      </div>
    </div>`;
});
  
  expandedHTML += `
      <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2);">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 12px; color: rgba(255,255,255,0.9);">Total Products:</span>
          <span style="font-size: 16px; font-weight: 700; color: white;">${rankedProducts.length}</span>
        </div>
      </div>
    </div>`;
  
  // Products table with headers
  expandedHTML += '<div class="titles-search-products-table">';
  expandedHTML += '<table class="titles-table-modern" style="margin: 0; width: 100%;">';
  
  // Add column headers
  expandedHTML += `
    <thead class="titles-search-products-header">
      <tr>
        <th class="center" style="width: 40px;">#</th>
        <th style="width: 50px;">POS</th>
        <th style="width: 60px;">SHARE</th>
        <th style="width: 60px;">ROAS</th>
        <th class="center" style="width: 50px;">IMG</th>
        <th style="width: 300px;">PRODUCT TITLE</th>
<th class="center" style="width: 50px;">KOS</th>
<th class="center" style="width: 60px;">T-SCORE</th>
        <th class="center" style="width: 50px;">GOS</th>
        <th class="center" style="width: 50px;">SUGG</th>
        <th class="right" style="width: 80px;">IMPR</th>
        <th class="right" style="width: 80px;">CLICKS</th>
        <th class="right" style="width: 60px;">CTR %</th>
        <th class="right" style="width: 80px;">COST</th>
        <th class="right" style="width: 80px;">REVENUE</th>
      </tr>
    </thead>
    <tbody>`;
  
  // Sort products by KOS value (highest first)
  rankedProducts.sort((a, b) => b.kos - a.kos);
  
  // Render each ranked product
  rankedProducts.forEach((productData, idx) => {
    const product = products.find(p => p.title === productData.title);
    if (!product) return;
    
    const analyzerData = analyzerResults.get(productData.title);
    const productProcessedMetrics = processedMetrics?.get(product.title) || {};
    const matchedProduct = matchedProducts.get(product.title);
    
    // Get metrics
    const adPosition = productProcessedMetrics.avgPosition || null;
    const marketShare = productProcessedMetrics.avgVisibility || null;
    const imageUrl = matchedProduct?.thumbnail || product.image || '';
    
    // Score classes
    const roundedScore = Math.round(analyzerData?.finalScore || 0);
    let tscoreClass = 'titles-tscore-poor';
    if (roundedScore > 70) tscoreClass = 'titles-tscore-excellent';
    else if (roundedScore >= 55) tscoreClass = 'titles-tscore-good';
    else if (roundedScore >= 40) tscoreClass = 'titles-tscore-fair';
    
    let kosClass = 'titles-kos-poor';
    if (productData.kos >= 15) kosClass = 'titles-kos-excellent';
    else if (productData.kos >= 10) kosClass = 'titles-kos-good';
    else if (productData.kos >= 5) kosClass = 'titles-kos-fair';
    
    let gosClass = 'titles-gos-poor';
    const gos = analyzerData?.gos || 0;
    if (gos > 60) gosClass = 'titles-gos-excellent';
    else if (gos >= 40) gosClass = 'titles-gos-good';
    else if (gos >= 20) gosClass = 'titles-gos-fair';
    
    const suggestionsCount = analyzerData?.improvementSuggestions?.length || 0;
    let suggClass = '';
    if (suggestionsCount >= 7) suggClass = 'critical';
    else if (suggestionsCount >= 4) suggClass = 'has-many';
    
    let roasClass = 'titles-roas-low';
    if (product.roas >= 3) roasClass = 'titles-roas-high';
    else if (product.roas >= 1.5) roasClass = 'titles-roas-medium';
    
    let posClass = 'bottom';
    if (adPosition) {
      if (adPosition <= 3) posClass = 'top';
      else if (adPosition <= 8) posClass = 'mid';
      else if (adPosition <= 14) posClass = 'low';
    }
    
    expandedHTML += `
      <tr class="titles-expanded-product-row" style="background: ${idx % 2 === 0 ? 'white' : '#f9f9f9'};">
        <td class="center" style="padding: 8px; color: #999; font-size: 12px;">${idx + 1}</td>
        <td class="center" style="padding: 8px;">
          ${adPosition !== null ? 
            `<div class="titles-position-indicator ${posClass}" style="width: 32px; height: 32px; font-size: 13px;">${adPosition}</div>` : 
            '<span style="color: #adb5bd; font-size: 12px;">-</span>'}
        </td>
        <td class="center" style="padding: 8px;">
          ${marketShare ? 
            `<div class="titles-share-bar" style="width: 50px; height: 26px;">
              <div class="titles-share-fill" style="width: ${Math.min(marketShare, 100)}%"></div>
              <div class="titles-share-text" style="font-size: 10px;">${marketShare.toFixed(1)}%</div>
            </div>` : 
            '<span style="color: #adb5bd; font-size: 12px;">-</span>'}
        </td>
        <td class="center" style="padding: 8px;">
          <span class="titles-roas-indicator ${roasClass}" style="font-size: 12px; padding: 3px 8px;">
            ${product.roas.toFixed(2)}x
          </span>
        </td>
        <td class="center" style="padding: 8px;">
          ${imageUrl ? 
            `<div class="titles-expanded-img-container">
              <img class="titles-product-img" src="${imageUrl}" alt="${product.title}" 
                   style="width: 40px; height: 40px;" onerror="this.style.display='none'">
              <img class="titles-expanded-img-zoom" src="${imageUrl}" alt="${product.title}">
            </div>` : 
            '<div style="width: 40px; height: 40px; background: #f0f2f5; border-radius: 6px; margin: 0 auto;"></div>'}
        </td>
        <td style="padding: 8px;">
          <div class="titles-product-title" style="font-size: 13px; font-weight: 600; line-height: 1.3;">
            ${product.title}
          </div>
          ${product.sku ? `<div style="font-size: 11px; color: #999; margin-top: 2px;">SKU: ${product.sku}</div>` : ''}
        </td>
<td class="center" style="padding: 8px;">
  <span class="titles-score-fraction ${kosClass}" style="padding: 3px 8px; font-size: 12px;">
    <span class="titles-score-value">${productData.kos}</span>
    <span class="titles-score-max" style="font-size: 10px;">/20</span>
  </span>
</td>
<td class="center" style="padding: 8px;">
  <span class="titles-score-fraction ${tscoreClass}" style="padding: 3px 8px; font-size: 12px;">
    <span class="titles-score-value">${roundedScore}</span>
    <span class="titles-score-max" style="font-size: 10px;">/100</span>
  </span>
</td>
        <td class="center" style="padding: 8px;">
          <span class="titles-score-fraction ${gosClass}" style="padding: 3px 8px; font-size: 12px;">
            <span class="titles-score-value">${gos}</span>
            <span class="titles-score-max" style="font-size: 10px;">/80</span>
          </span>
        </td>
        <td class="center" style="padding: 8px;">
          ${suggestionsCount > 0 ? 
            `<span class="titles-suggestions-count ${suggClass}" style="font-size: 12px; padding: 3px 8px; min-width: 28px;">${suggestionsCount}</span>` : 
            '<span style="color: #adb5bd; font-size: 12px;">-</span>'}
        </td>
        <td class="right" style="padding: 8px;">
          <div class="titles-metric-cell">
            ${maxImpr > 0 ? 
              `<div class="titles-metric-bar" style="width: ${(product.impressions / maxImpr * 100)}%;"></div>` : ''}
            <span class="titles-metric-value" style="font-size: 12px;">${product.impressions.toLocaleString()}</span>
          </div>
        </td>
        <td class="right" style="padding: 8px;">
          <div class="titles-metric-cell">
            ${maxClicks > 0 ? 
              `<div class="titles-metric-bar" style="width: ${(product.clicks / maxClicks * 100)}%;"></div>` : ''}
            <span class="titles-metric-value" style="font-size: 12px;">${product.clicks.toLocaleString()}</span>
          </div>
        </td>
        <td class="right" style="padding: 8px; font-size: 12px;">${product.ctr.toFixed(2)}%</td>
        <td class="right" style="padding: 8px;">
          <div class="titles-metric-cell">
            ${maxCost > 0 ? 
              `<div class="titles-metric-bar" style="width: ${(product.cost / maxCost * 100)}%;"></div>` : ''}
            <span class="titles-metric-value" style="font-size: 12px;">$${product.cost.toFixed(2)}</span>
          </div>
        </td>
        <td class="right" style="padding: 8px;">
          <div class="titles-metric-cell">
            ${maxRevenue > 0 ? 
              `<div class="titles-metric-bar" style="width: ${(product.convValue / maxRevenue * 100)}%;"></div>` : ''}
            <span class="titles-metric-value" style="font-size: 12px;">$${product.convValue.toFixed(2)}</span>
          </div>
        </td>
      </tr>
    `;
  });
  
  expandedHTML += '</tbody></table></div></div>';
  
  expandedCell.innerHTML = expandedHTML;
  expandedRow.appendChild(expandedCell);
  row.parentNode.insertBefore(expandedRow, row.nextSibling);
  
  // Add hover positioning for image zoom
  setTimeout(() => {
    expandedRow.querySelectorAll('.titles-expanded-img-container').forEach(container => {
      container.addEventListener('mouseenter', function(e) {
        const img = this.querySelector('.titles-expanded-img-zoom');
        if (!img) return;
        
        const rect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = rect.right + 10;
        let top = rect.top - 50;
        
        if (left + 250 > viewportWidth) {
          left = rect.left - 260;
        }
        
        if (top < 10) {
          top = 10;
        }
        
        if (top + 250 > viewportHeight - 10) {
          top = viewportHeight - 260;
        }
        
        img.style.left = `${left}px`;
        img.style.top = `${top}px`;
      });
    });
  }, 100);
}

// Get compact product ranking summary for a search term (from search_terms_tab.js)
async function getCompactProductRankingSummaryForTitles(searchTerm) {
  const metrics = await calculateProductRankingMetricsForTitles(searchTerm);
  
  if (!metrics || metrics.length === 0) {
    return null;
  }
  
  // Aggregate by device type
  const deviceSummary = {
    desktop: { active: 0, trend: 0 },
    mobile: { active: 0, trend: 0 }
  };
  
  metrics.forEach(metric => {
    if (metric.device.toLowerCase().includes('mobile')) {
      deviceSummary.mobile.active += metric.activeProducts;
      deviceSummary.mobile.trend += metric.productsTrend;
    } else {
      deviceSummary.desktop.active += metric.activeProducts;
      deviceSummary.desktop.trend += metric.productsTrend;
    }
  });
  
  return deviceSummary;
}

// Calculate product ranking metrics for titles view (from search_terms_tab.js logic)
async function calculateProductRankingMetricsForTitles(searchTerm) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    return [];
  }
  
  const normalizedTerm = searchTerm.toLowerCase().trim();
  
  // Get total products count
  const totalProducts = await getTotalProductsCountForTitles();
  
  // Get company to filter
  const companyToFilter = window.myCompany || '';
  
  const results = [];
  
  // Check if projectTableData exists and has data
  if (window.projectTableData && Array.isArray(window.projectTableData)) {
    // Group by location/device from projectTableData
    const projectDataMap = {};
    
    window.projectTableData.forEach(item => {
      if (item.searchTerm && item.searchTerm.toLowerCase().trim() === normalizedTerm) {
        const key = `${item.location}|${item.device}`;
        projectDataMap[key] = item;
      }
    });
    
    // For each location/device combination found in projectTableData
    for (const [key, projectData] of Object.entries(projectDataMap)) {
      const [location, device] = key.split('|');
      
      // Count active/inactive products from allRows
      let activeCount = 0;
      let inactiveCount = 0;
      let prevActiveCount = 0;
      
      // Get products for this location/device
      const products = window.allRows.filter(product => 
        product.q && product.q.toLowerCase().trim() === normalizedTerm &&
        product.source && product.source.toLowerCase() === companyToFilter.toLowerCase() &&
        product.location_requested === location &&
        product.device === device
      );
      
      // Count active/inactive
      products.forEach(product => {
        if (product.product_status === 'inactive') {
          inactiveCount++;
        } else {
          activeCount++;
        }
        
        // Track previous period active products
        if (product.product_status !== 'inactive') {
          // For previous period, check if product had data
          if (product.historical_data && Array.isArray(product.historical_data)) {
            const days = 7;
            const endDate = moment().subtract(1, 'days');
            const startDate = endDate.clone().subtract(days - 1, 'days');
            const prevEndDate = startDate.clone().subtract(1, 'days');
            const prevStartDate = prevEndDate.clone().subtract(days - 1, 'days');
            
            const hasPrevData = product.historical_data.some(item => {
              if (!item.date || !item.date.value) return false;
              const itemDate = moment(item.date.value, 'YYYY-MM-DD');
              return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
            });
            if (hasPrevData) {
              prevActiveCount++;
            }
          }
        }
      });
      
      const productsTrend = activeCount - prevActiveCount;
      
      results.push({
        location: location,
        device: device,
        avgRank: projectData.avgRank || 0,
        rankTrend: projectData.rankChange || 0,
        marketShare: projectData.avgShare || 0,
        shareTrend: projectData.trendVal || 0,
        activeProducts: activeCount,
        inactiveProducts: inactiveCount,
        prevActiveProducts: prevActiveCount,
        productsTrend: productsTrend,
        totalProducts: totalProducts
      });
    }
  }
  
  return results;
}

// Get total products count for titles
async function getTotalProductsCountForTitles() {
  try {
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : 'acc1_pr1_';
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const uniqueProducts = new Set();
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data) {
          result.data.forEach(item => {
            if (item['Product Title']) {
              uniqueProducts.add(item['Product Title']);
            }
          });
        }
        resolve();
      };
      getRequest.onerror = () => resolve();
    });
    
    db.close();
    return uniqueProducts.size;
  } catch (error) {
    console.error('[Titles] Error getting total products:', error);
    return 0;
  }
}

// Render compact product ranking badge (from search_terms_tab.js)
function renderCompactProductRankingBadgeForTitles(deviceSummary) {
  if (!deviceSummary) return '';
  
  const hasDesktop = deviceSummary.desktop.active > 0;
  const hasMobile = deviceSummary.mobile.active > 0;
  
  if (!hasDesktop && !hasMobile) return '';
  
  let badgeContent = '';
  
  // Desktop section
  if (hasDesktop) {
    const trendColor = deviceSummary.desktop.trend > 0 ? '#4CAF50' : 
                       deviceSummary.desktop.trend < 0 ? '#F44336' : '#999';
    const trendArrow = deviceSummary.desktop.trend > 0 ? '↑' : 
                      deviceSummary.desktop.trend < 0 ? '↓' : '';
    
    badgeContent += `
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 14px;">💻</span>
        <span style="font-weight: 600; color: #333; font-size: 13px;">${deviceSummary.desktop.active}</span>
        ${deviceSummary.desktop.trend !== 0 ? `
          <span style="color: ${trendColor}; font-size: 11px; font-weight: 500;">
            ${trendArrow}${Math.abs(deviceSummary.desktop.trend)}
          </span>
        ` : ''}
      </div>
    `;
  }
  
  // Add separator if both exist
  if (hasDesktop && hasMobile) {
    badgeContent += `
      <div style="width: 1px; height: 16px; background: #e0e0e0;"></div>
    `;
  }
  
  // Mobile section
  if (hasMobile) {
    const trendColor = deviceSummary.mobile.trend > 0 ? '#4CAF50' : 
                       deviceSummary.mobile.trend < 0 ? '#F44336' : '#999';
    const trendArrow = deviceSummary.mobile.trend > 0 ? '↑' : 
                      deviceSummary.mobile.trend < 0 ? '↓' : '';
    
    badgeContent += `
      <div style="display: flex; align-items: center; gap: 4px;">
        <span style="font-size: 14px;">📱</span>
        <span style="font-weight: 600; color: #333; font-size: 13px;">${deviceSummary.mobile.active}</span>
        ${deviceSummary.mobile.trend !== 0 ? `
          <span style="color: ${trendColor}; font-size: 11px; font-weight: 500;">
            ${trendArrow}${Math.abs(deviceSummary.mobile.trend)}
          </span>
        ` : ''}
      </div>
    `;
  }
  
  return `
    <div class="small-product-ranking" style="
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 10px;
      background: linear-gradient(135deg, #f0f4f8 0%, #e8ecf0 100%);
      border: 1px solid #d1d9e0;
      border-radius: 16px;
      margin-left: 8px;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    ">
      ${badgeContent}
    </div>
  `;
}

// Export initialization function
window.initializeTitlesAnalyzer = initializeTitlesAnalyzer;
