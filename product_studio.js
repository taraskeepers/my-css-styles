// product_studio.js - Product Studio Implementation

// Global variables for product studio
window.productStudioInitialized = false;
window.globalProductsSortState = { column: 'tscore', direction: 'desc' };

// Initialize Product Studio functionality
async function initializeProductStudio() {
  console.log('[initializeProductStudio] Starting Product Studio initialization...');
  
  if (window.productStudioInitialized) {
    console.log('[initializeProductStudio] Already initialized, skipping...');
    return;
  }
  
  // Add debugging
  console.log('[initializeProductStudio] Looking for Product Studio container...');
  const container = document.getElementById('productStudioContent');
  console.log('[initializeProductStudio] Container found:', !!container);
  
  // Add product studio specific styles
  addProductStudioStyles();
  
  // Load and render product studio panels
  await loadAndRenderProductStudioPanels();
  
  // Wait a moment for DOM to update
  setTimeout(() => {
    console.log('[initializeProductStudio] Initializing toggle functionality...');
    // Initialize toggle functionality
    initializeProductStudioToggle();
  }, 100);
  
  window.productStudioInitialized = true;
  console.log('[initializeProductStudio] Product Studio initialization complete');
}

// Add product studio specific styles (complete copy from titles analyzer)
function addProductStudioStyles() {
  if (!document.getElementById('product-studio-styles')) {
    const style = document.createElement('style');
    style.id = 'product-studio-styles';
    style.textContent = `
      /* Main product studio container */
      .product-studio-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        max-width: 1470px;
        padding-top: 50px;
        margin-left: 0; /* Changed from margin: 0 auto to align left */
      }
      
      /* Products panel for product studio */
      #titlesGlobalProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      /* Rank Map panel for product studio */
#titlesRankMapProductsPanel {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
      
      /* Header section */
      .product-studio-header {
        padding: 15px 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-bottom: 1px solid #dee2e6;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .product-studio-header-left {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .product-studio-header-title {
        font-size: 18px;
        font-weight: 700;
        color: white;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      
      .product-studio-version {
        background: rgba(255, 255, 255, 0.2);
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .product-studio-selected-info {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.9);
        margin-top: 4px;
      }
      
      /* TABLE STYLES */
      .product-studio-table-container {
        flex: 1;
        overflow: auto;
        background: #f5f7fa;
      }
      
      .product-studio-wrapper {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      .product-studio-table {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      /* Table header */
      .product-studio-table thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .product-studio-table thead tr {
        border-bottom: 2px solid #e9ecef;
      }
      
      .product-studio-table th {
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
      
      .product-studio-table th.sortable {
        cursor: pointer;
        padding-right: 20px;
      }
      
      .product-studio-table th.sortable:hover {
        background: rgba(102, 126, 234, 0.04);
        color: #495057;
      }
      
      .product-studio-table th.center {
        text-align: center;
      }
      
      .product-studio-table th.right {
        text-align: right;
      }
      
      /* Column widths - FIXED */
      .product-studio-table th:nth-child(1),
      .product-studio-table td:nth-child(1) { width: 50px; } /* POS */
      
      .product-studio-table th:nth-child(2),
      .product-studio-table td:nth-child(2) { width: 60px; } /* SHARE */
      
      .product-studio-table th:nth-child(3),
      .product-studio-table td:nth-child(3) { width: 55px; } /* ROAS */
      
      .product-studio-table th:nth-child(4),
      .product-studio-table td:nth-child(4) { width: 60px; } /* IMAGE */
      
      .product-studio-table th:nth-child(5),
      .product-studio-table td:nth-child(5) { 
        max-width: 300px; 
        width: 400px;
      } /* PRODUCT TITLE - FIXED CLOSING BRACE */
      
      .product-studio-table th:nth-child(6),
      .product-studio-table td:nth-child(6) { width: 60px; } /* T-SCORE */
      
      .product-studio-table th:nth-child(7),
      .product-studio-table td:nth-child(7) { width: 50px; } /* KOS */
      
      .product-studio-table th:nth-child(8),
      .product-studio-table td:nth-child(8) { width: 50px; } /* GOS */
      
      .product-studio-table th:nth-child(9),
      .product-studio-table td:nth-child(9) { width: 50px; } /* SUGG */
      
      /* Sort icon */
      .product-studio-sort-icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #adb5bd;
      }
      
      .product-studio-table th.sorted-asc .product-studio-sort-icon,
      .product-studio-table th.sorted-desc .product-studio-sort-icon {
        color: #667eea;
      }
      
      /* Table body */
      .product-studio-table tbody tr {
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.15s ease;
        height: 60px;
        cursor: pointer;
        user-select: none;
      }
      
      .product-studio-table tbody tr:hover {
        background: rgba(102, 126, 234, 0.02);
      }
      
      .product-studio-table tbody tr.expanded {
        background: rgba(102, 126, 234, 0.05);
      }
      
      .product-studio-table td {
        padding: 8px;
        font-size: 13px;
        color: #495057;
        vertical-align: middle;
      }
      
      .product-studio-table td.center {
        text-align: center;
      }
      
      .product-studio-table td.right {
        text-align: right;
      }
      
      /* Product image in table */
      .product-studio-img {
        width: 50px;
        height: 50px;
        object-fit: contain;
        border-radius: 8px;
        border: 1px solid #e9ecef;
        background: #f8f9fa;
      }
      
      /* Product title cell */
      .product-studio-title-cell {
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
.product-studio-title {
  font-weight: 600;
  color: #333;
  font-size: 13px;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
      
      /* Image zoom on hover */
      .product-studio-img-container {
        position: relative;
        display: inline-block;
      }
      
      .product-studio-img-zoom {
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
      
      .product-studio-img-container:hover .product-studio-img-zoom {
        opacity: 1;
      }
      
      /* Position indicator styles */
      .product-studio-position-indicator {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
      }
      
      .product-studio-position-indicator.top {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
      }
      
      .product-studio-position-indicator.mid {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .product-studio-position-indicator.low {
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        color: white;
      }
      
      .product-studio-position-indicator.bottom {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      /* Market share bar */
      .product-studio-share-bar {
        width: 60px;
        height: 32px;
        background: #e9ecef;
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        display: inline-block;
      }
      
      .product-studio-share-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
        transition: width 0.3s ease;
      }
      
      .product-studio-share-text {
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
      
      /* ROAS indicator - ADD THIS */
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
      
      /* Score fraction display */
      .product-studio-score-fraction {
        display: inline-flex;
        align-items: baseline;
        gap: 1px;
        padding: 4px 8px;
        border-radius: 8px;
        font-weight: 700;
        min-width: 55px;
        justify-content: center;
      }
      
      .product-studio-score-value {
        font-size: 13px;
      }
      
      .product-studio-score-max {
        font-size: 10px;
        opacity: 0.7;
      }
      
      /* T-Score color classes */
      .product-studio-tscore-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
      
      .product-studio-tscore-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
        color: #14532d;
      }
      
      .product-studio-tscore-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .product-studio-tscore-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      /* KOS color classes */
      .product-studio-kos-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
      
      .product-studio-kos-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
        color: #14532d;
      }
      
      .product-studio-kos-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .product-studio-kos-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      /* GOS color classes */
      .product-studio-gos-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
      }
      
      .product-studio-gos-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
        color: #14532d;
      }
      
      .product-studio-gos-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .product-studio-gos-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      /* Suggestions count */
      .product-studio-suggestions-count {
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
      
      .product-studio-suggestions-count.has-many {
        background: rgba(251, 191, 36, 0.15);
        color: #d97706;
        font-weight: 700;
      }
      
      .product-studio-suggestions-count.critical {
        background: rgba(239, 68, 68, 0.15);
        color: #dc2626;
        font-weight: 700;
      }
      
      /* Expanded details row */
      .product-studio-expanded-row {
        background: #f8f9fa;
      }
      
      .product-studio-expanded-row td {
        padding: 0 !important;
      }
      
      .product-studio-expanded-content {
        padding: 12px 16px;
        max-height: 480px;
        overflow: hidden;
        animation: slideDown 0.2s ease-out;
      }
      
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      /* Compact grid layout */
      .product-studio-compact-grid {
        display: flex;
        gap: 16px;
        align-items: flex-start;
      }
      
      /* Compact section styling */
      .product-studio-compact-section {
        background: white;
        border: 1px solid #e1e4e8;
        border-radius: 6px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      .product-studio-compact-header {
        background: linear-gradient(to right, #f6f8fa, #ffffff);
        padding: 6px 10px;
        border-bottom: 1px solid #e1e4e8;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }
      
      .product-studio-compact-title {
        font-size: 11px;
        font-weight: 600;
        color: #24292e;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        margin: 0;
      }
      
      .product-studio-compact-body {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      
      /* Score group styling */
      .product-studio-score-group {
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #e1e4e8;
      }
      
      .product-studio-score-group:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
      }
      
      .product-studio-score-group-title {
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
      
      .product-studio-score-group-title::before {
        content: '';
        width: 3px;
        height: 12px;
        background: linear-gradient(180deg, #667eea, #764ba2);
        border-radius: 2px;
      }
      
      /* Score item with bar visualization */
      .product-studio-score-item-with-bar {
        display: flex;
        align-items: center;
        padding: 5px 0;
        font-size: 11px;
        position: relative;
      }
      
      .product-studio-score-item-label {
        color: #24292e;
        min-width: 85px;
        font-size: 11px;
      }
      
      .product-studio-score-bar-container {
        flex: 1;
        height: 16px;
        background: #f0f2f5;
        border-radius: 3px;
        position: relative;
        margin: 0 8px;
        overflow: hidden;
      }
      
      .product-studio-score-bar-fill {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        border-radius: 3px;
        transition: width 0.3s ease;
      }
      
      .product-studio-score-bar-fill.high {
        background: linear-gradient(90deg, #22c55e, #16a34a);
      }
      
      .product-studio-score-bar-fill.medium {
        background: linear-gradient(90deg, #fbbf24, #f59e0b);
      }
      
      .product-studio-score-bar-fill.low {
        background: linear-gradient(90deg, #f87171, #ef4444);
      }
      
      .product-studio-score-value {
        font-weight: 700;
        color: #24292e;
        min-width: 45px;
        text-align: right;
        font-size: 12px;
      }
      
      /* Enhanced suggestions styling */
      .product-studio-suggestion-item {
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
      
      .product-studio-suggestion-item:hover {
        transform: translateX(2px);
        box-shadow: 0 2px 5px rgba(0,0,0,0.1);
      }
      
      .product-studio-suggestion-icon {
        color: #f59e0b;
        font-size: 14px;
        font-weight: 700;
        flex-shrink: 0;
        margin-top: 1px;
      }
      
      .product-studio-suggestions-list {
        display: flex;
        flex-direction: column;
        gap: 0;
        max-height: 320px;
        overflow-y: auto;
        padding-right: 4px;
      }
      
      /* Average scores styling */
      .product-studio-avg-scores {
        position: absolute;
        right: 20px;
        display: flex;
        gap: 20px;
        align-items: center;
      }
      
      .product-studio-avg-item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px 14px;
        border-radius: 10px;
        min-width: 85px;
        min-height: 50px;
      }
      
      .product-studio-avg-item.tscore-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      .product-studio-avg-item.tscore-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
      }
      
      .product-studio-avg-item.tscore-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      }
      
      .product-studio-avg-item.tscore-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      }
      
      .product-studio-avg-item.kos-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      .product-studio-avg-item.kos-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
      }
      
      .product-studio-avg-item.kos-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      }
      
      .product-studio-avg-item.kos-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      }
      
      .product-studio-avg-item.gos-excellent {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      }
      
      .product-studio-avg-item.gos-good {
        background: linear-gradient(135deg, #86efac 0%, #4ade80 100%);
      }
      
      .product-studio-avg-item.gos-fair {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
      }
      
      .product-studio-avg-item.gos-poor {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
      }
      
      .product-studio-avg-score-display {
        display: flex;
        align-items: baseline;
        gap: 2px;
        font-weight: 700;
      }
      
      .product-studio-avg-value {
        font-size: 18px;
        color: white;
      }
      
      .product-studio-avg-max {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.85);
      }
      
      /* Title filter styles */
      .product-studio-filter-section {
        display: flex;
        align-items: center;
        gap: 0;
        flex: 1;
        margin-left: 50px;
        position: relative;
      }
      
      .product-studio-title-filter {
        position: relative;
        width: 280px;
      }
      
      .product-studio-filter-input {
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
      
      .product-studio-filter-input::placeholder {
        color: #999;
      }
      
      .product-studio-filter-input:focus {
        background: white;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }
      
      /* Filter tags container */
      .product-studio-filter-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 8px;
        min-height: 28px;
      }
      
      .product-studio-filter-tag {
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
      
      .product-studio-filter-tag-text {
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .product-studio-filter-tag-remove {
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
      
      .product-studio-filter-tag-remove:hover {
        background: #667eea;
        color: white;
      }
      
      /* Keywords table */
      .product-studio-keywords-compact {
        width: 100%;
        font-size: 11px;
      }
      
      .product-studio-keywords-compact tr {
        height: 24px;
      }
      
      .product-studio-keywords-compact td {
        padding: 2px 4px;
        border-bottom: 1px solid #f0f2f5;
        color: #24292e;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .product-studio-keywords-compact td:first-child {
        width: 20px;
        text-align: center;
        font-weight: 600;
        color: #6a737d;
      }
      
      .product-studio-keywords-compact td:last-child {
        width: 35px;
        text-align: center;
      }
      
      .product-studio-kos-mini {
        display: inline-block;
        padding: 1px 5px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: 600;
      }
      
      .kos-h { background: #dcfce7; color: #15803d; }
      .kos-m { background: #fef3c7; color: #b45309; }
      .kos-l { background: #fee2e2; color: #991b1b; }

/* COMPANIES PANEL SPECIFIC STYLES */
      .companies-table {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      .companies-table thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .companies-table thead tr {
        border-bottom: 2px solid #e9ecef;
      }
      
      .companies-table th {
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
      
      .companies-table th.sortable {
        cursor: pointer;
        padding-right: 20px;
      }
      
      .companies-table th.sortable:hover {
        background: rgba(102, 126, 234, 0.04);
        color: #495057;
      }
      
      .companies-table tbody tr {
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.15s ease;
        height: 60px;
        cursor: pointer;
        user-select: none;
      }
      
      .companies-table tbody tr:hover {
        background: rgba(102, 126, 234, 0.02);
      }
      
      .companies-table tbody tr.expanded {
        background: rgba(102, 126, 234, 0.05);
      }
      
      .companies-table td {
        padding: 8px;
        font-size: 13px;
        color: #495057;
        vertical-align: middle;
      }
      
      .companies-sort-icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #adb5bd;
      }
      
      .companies-table th.sorted-asc .companies-sort-icon,
      .companies-table th.sorted-desc .companies-sort-icon {
        color: #667eea;
      }
      
      .company-rank-badge {
        width: 40px;
        height: 40px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
      }
      
      .company-rank-badge.gold {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .company-rank-badge.silver {
        background: linear-gradient(135deg, #e5e7eb 0%, #9ca3af 100%);
        color: white;
      }
      
      .company-rank-badge.bronze {
        background: linear-gradient(135deg, #fb923c 0%, #ea580c 100%);
        color: white;
      }
      
      .company-rank-badge.regular {
        background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
        color: #4b5563;
      }
      
      .companies-expanded-row {
        background: #f8f9fa;
      }
      
      .companies-expanded-row td {
        padding: 0 !important;
      }
      
      .companies-expanded-content {
        padding: 20px 30px;
        animation: slideDown 0.2s ease-out;
      }
      
      .companies-gos-breakdown {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        max-width: 800px;
      }
      
      .gos-breakdown-item {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 20px;
        text-align: center;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      .gos-breakdown-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
      }
      
      .gos-breakdown-label {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      
      .gos-breakdown-count {
        font-size: 32px;
        font-weight: 700;
        margin: 8px 0;
      }
      
      .gos-breakdown-item.excellent {
        border-color: #22c55e;
        background: linear-gradient(135deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.02));
      }
      
      .gos-breakdown-item.excellent .gos-breakdown-count {
        color: #16a34a;
      }
      
      .gos-breakdown-item.good {
        border-color: #4ade80;
        background: linear-gradient(135deg, rgba(74, 222, 128, 0.05), rgba(74, 222, 128, 0.02));
      }
      
      .gos-breakdown-item.good .gos-breakdown-count {
        color: #22c55e;
      }
      
      .gos-breakdown-item.poor {
        border-color: #fbbf24;
        background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(251, 191, 36, 0.02));
      }
      
      .gos-breakdown-item.poor .gos-breakdown-count {
        color: #f59e0b;
      }
      
      .gos-breakdown-item.bad {
        border-color: #f87171;
        background: linear-gradient(135deg, rgba(248, 113, 113, 0.05), rgba(248, 113, 113, 0.02));
      }
      
      .gos-breakdown-item.bad .gos-breakdown-count {
        color: #ef4444;
      }
      
      /* Companies panel for product studio */
#titlesCompaniesPanel {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* Ensure single panel takes full width */
.product-studio-main-container > div:only-child {
  width: 100%;
}

/* Make sure panels don't have minimum widths that prevent full width */
#titlesCompaniesPanel,
#titlesGlobalProductsPanel, 
#titlesRankMapProductsPanel {
  min-width: 0;
  width: 100%;
}

    `;
    document.head.appendChild(style);
  }
}

// Replace the loadProductTitlesEvaluated function with:

async function loadProductTitlesEvaluated(companyFilter = null) {
  return new Promise((resolve, reject) => {
    console.log('[loadProductTitlesEvaluated] Starting to load evaluated titles...');
    
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
    
    const tableName = `${tablePrefix}product_titles_evaluated`;
    
    console.log('[loadProductTitlesEvaluated] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadProductTitlesEvaluated] projectData object store not found');
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadProductTitlesEvaluated] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Filter by company source (use parameter or default to myCompany)
        const companyToFilter = companyFilter || window.myCompany || '';
        const filteredData = result.data.filter(item => 
          item.source && item.source.toLowerCase() === companyToFilter.toLowerCase()
        );
        
        console.log('[loadProductTitlesEvaluated] Filtered products for company:', companyToFilter, 'Count:', filteredData.length);
        
        // Aggregate by unique title
        const titleMap = new Map();
        
        filteredData.forEach(item => {
          const title = item.title || '';
          
          if (!titleMap.has(title)) {
            titleMap.set(title, {
              title: title,
              finalScores: [],
              kosValues: [],
              gosValues: [],
              queries: [],
              suggestions: item.improvement_suggestions || [],
              scoreBreakdown: item.score_breakdown ? JSON.parse(item.score_breakdown) : {},
              matchedTerms: item.matched_terms ? JSON.parse(item.matched_terms) : {},
              titleLength: parseInt(item.title_length || 0),
              wordCount: parseInt(item.word_count || 0),
              detectedBrand: item.detected_brand || '',
              detectedCategory: item.detected_category || ''
            });
          }
          
          const aggregated = titleMap.get(title);
          
          aggregated.finalScores.push(parseFloat(item.final_score || 0));
          aggregated.kosValues.push(parseFloat(item.kos || 0));
          aggregated.gosValues.push(parseFloat(item.gos || 0));
          
          if (item.q) {
            aggregated.queries.push({
              query: item.q,
              kos: parseFloat(item.kos || 0)
            });
          }
          
          if (item.improvement_suggestions && item.improvement_suggestions.length > aggregated.suggestions.length) {
            aggregated.suggestions = item.improvement_suggestions;
          }
        });
        
        const processedData = Array.from(titleMap.values()).map(item => ({
          title: item.title,
          finalScore: item.finalScores.reduce((a, b) => a + b, 0) / item.finalScores.length,
          kos: item.kosValues.reduce((a, b) => a + b, 0) / item.kosValues.length,
          gos: item.gosValues.reduce((a, b) => a + b, 0) / item.gosValues.length,
          queries: item.queries,
          suggestions: item.suggestions,
          scoreBreakdown: item.scoreBreakdown,
          matchedTerms: item.matchedTerms,
          titleLength: item.titleLength,
          wordCount: item.wordCount,
          detectedBrand: item.detectedBrand,
          detectedCategory: item.detectedCategory
        }));
        
        db.close();
        resolve(processedData);
      };
      
      getRequest.onerror = function() {
        console.error('[loadProductTitlesEvaluated] Error getting data:', getRequest.error);
        db.close();
        resolve([]);
      };
    };
    
    request.onerror = function() {
      console.error('[loadProductTitlesEvaluated] Failed to open database:', request.error);
      resolve([]);
    };
  });
}

// Load companies data from IDB
async function loadCompaniesData() {
  return new Promise((resolve, reject) => {
    console.log('[loadCompaniesData] Starting to load companies data...');
    
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
    
    const tableName = `${tablePrefix}product_titles_companies`;
    
    console.log('[loadCompaniesData] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadCompaniesData] projectData object store not found');
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadCompaniesData] No data found for table:', tableName);
          db.close();
          resolve([]);
          return;
        }
        
        // Process the companies data
        const companiesData = result.data.map(company => ({
          source: company.source || 'Unknown',
          avgFinalScore: parseFloat(company.avg_final_score || 0),
          avgGos: parseFloat(company.avg_gos || 0),
          avgKos: parseFloat(company.avg_kos || 0),
          avgTitleLength: parseFloat(company.avg_title_length || 0),
          avgWordCount: parseFloat(company.avg_word_count || 0),
          totalProducts: parseInt(company.total_products || 0),
          gosOverview: {
            excellent: parseInt(company.gos_overview?.excellent_60_80 || 0),
            good: parseInt(company.gos_overview?.good_40_60 || 0),
            poor: parseInt(company.gos_overview?.poor_20_40 || 0),
            bad: parseInt(company.gos_overview?.bad_below_20 || 0)
          }
        }));
        
        // Sort by average final score descending
        companiesData.sort((a, b) => b.avgFinalScore - a.avgFinalScore);
        
        console.log('[loadCompaniesData] Loaded companies:', companiesData.length);
        db.close();
        resolve(companiesData);
      };
      
      getRequest.onerror = function() {
        console.error('[loadCompaniesData] Error getting data:', getRequest.error);
        db.close();
        resolve([]);
      };
    };
    
    request.onerror = function() {
      console.error('[loadCompaniesData] Failed to open database:', request.error);
      resolve([]);
    };
  });
}

// Add this function after loadProductTitlesEvaluated:

// Load ROAS data from productPerformance table
async function loadProductPerformanceData() {
  return new Promise((resolve, reject) => {
    console.log('[loadProductPerformanceData] Starting to load performance data...');
    
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}googleSheets_productPerformance_all`;
    
    console.log('[loadProductPerformanceData] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[loadProductPerformanceData] projectData object store not found');
        db.close();
        resolve(new Map());
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[loadProductPerformanceData] No data found');
          db.close();
          resolve(new Map());
          return;
        }
        
        const allRecords = Array.isArray(result.data) ? result.data : [];
        const productMap = new Map();
        
        allRecords.forEach(record => {
          if (record['Campaign Name'] !== 'all') {
            return;
          }
          
          const key = record['Product Title'] || 'Unknown Product';
          
          if (!productMap.has(key)) {
            productMap.set(key, {
              title: key,
              cost: 0,
              convValue: 0
            });
          }
          
          const product = productMap.get(key);
          product.cost += parseFloat(record['Cost'] || 0);
          product.convValue += parseFloat(record['Conversion Value'] || 0);
        });
        
        // Calculate ROAS for each product
        const roasMap = new Map();
        for (const [title, data] of productMap) {
          const roas = data.cost > 0 ? (data.convValue / data.cost) : 0;
          roasMap.set(title, roas);
        }
        
        console.log('[loadProductPerformanceData] Loaded ROAS for products:', roasMap.size);
        db.close();
        resolve(roasMap);
      };
      
      getRequest.onerror = function() {
        console.error('[loadProductPerformanceData] Error getting data:', getRequest.error);
        db.close();
        resolve(new Map());
      };
    };
    
    request.onerror = function() {
      console.error('[loadProductPerformanceData] Failed to open database:', request.error);
      resolve(new Map());
    };
  });
}

// Add this function to extract all companies from the data:

async function getAllCompaniesFromData() {
  return new Promise((resolve, reject) => {
    let tablePrefix = '';
    if (typeof window.getProjectTablePrefix === 'function') {
      tablePrefix = window.getProjectTablePrefix();
    } else {
      const accountPrefix = window.currentAccount || 'acc1';
      const currentProjectNum = window.dataPrefix ? 
        parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
      tablePrefix = `${accountPrefix}_pr${currentProjectNum}_`;
    }
    
    const tableName = `${tablePrefix}product_titles_evaluated`;
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        db.close();
        resolve([]);
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          db.close();
          resolve([]);
          return;
        }
        
        // Get unique companies
        const companies = new Set();
        result.data.forEach(item => {
          if (item.source) {
            companies.add(item.source);
          }
        });
        
        const sortedCompanies = Array.from(companies).sort();
        console.log('[getAllCompaniesFromData] Found companies:', sortedCompanies);
        db.close();
        resolve(sortedCompanies);
      };
      
      getRequest.onerror = function() {
        db.close();
        resolve([]);
      };
    };
    
    request.onerror = function() {
      resolve([]);
    };
  });
}

// Replace the entire loadProcessedDataForProducts function:
async function loadProcessedDataForProducts(productTitles, companyFilter = null) {
  console.log('[loadProcessedDataForProducts] Loading processed data for titles:', productTitles.length);
  
  // Use passed company or fallback to window.myCompany
  const companyToUse = companyFilter || window.myCompany || '';
  console.log('[loadProcessedDataForProducts] Using company:', companyToUse);
  
  try {
    const tablePrefix = typeof window.getProjectTablePrefix === 'function' ? 
      window.getProjectTablePrefix() : (() => {
        const accountPrefix = window.currentAccount || 'acc1';
        const currentProjectNum = window.dataPrefix ? 
          parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
        return `${accountPrefix}_pr${currentProjectNum}_`;
      })();
    
    const processedTableName = `${tablePrefix}processed`;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(processedTableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadProcessedDataForProducts] No processed data found');
      return new Map();
    }
    
    const productMetrics = new Map();
    
    result.data.forEach(row => {
      // Use the passed company filter
      if (!row.source || row.source.toLowerCase() !== companyToUse.toLowerCase()) {
        return;
      }
      
      const title = row.title;
      const position = parseFloat(row.avg_week_position);
      const visibility = parseFloat(row.avg_visibility);
      const weekTrend = row.week_trend || null;
      
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
        processed.avgVisibility = avgVis * 100;
      }
      
      if (metrics.trends.length > 0) {
        processed.trend = calculateAverageTrendForProducts(metrics.trends);
      }
      
      processedMetrics.set(title, processed);
    }
    
    console.log('[loadProcessedDataForProducts] Processed metrics for products:', processedMetrics.size);
    return processedMetrics;
    
  } catch (error) {
    console.error('[loadProcessedDataForProducts] Error loading processed data:', error);
    return new Map();
  }
}

// Helper function for trend calculation
function calculateAverageTrendForProducts(trends) {
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

// Replace the entire matchProductsWithGlobalData function:
function matchProductsWithGlobalData(products, companyFilter = null) {
  const matchedProducts = new Map();
  
  // Use passed company or fallback to window.myCompany
  const companyToUse = companyFilter || window.myCompany || '';
  console.log('[matchProductsWithGlobalData] Using company:', companyToUse);
  
  if (window.allRows && Array.isArray(window.allRows)) {
    window.allRows.forEach(product => {
      if (product.source && product.source.toLowerCase() === companyToUse.toLowerCase()) {
        const productKey = product.title || '';
        matchedProducts.set(productKey, product);
      }
    });
  }
  
  console.log('[matchProductsWithGlobalData] Matched products:', matchedProducts.size);
  return matchedProducts;
}

// Load and render both panels
async function loadAndRenderProductStudioPanels() {
  const container = document.getElementById('productStudioContent');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'product-studio-main-container';
  
  // Create Companies Panel
  const companiesPanel = await createCompaniesPanel();
  mainContainer.appendChild(companiesPanel);
  
  // Create Products Panel  
  const productsPanel = await createProductsPanel();
  mainContainer.appendChild(productsPanel);
  
  // Create Rank Map Panel  
  const rankMapPanel = await createRankMapProductsPanel();
  mainContainer.appendChild(rankMapPanel);
  
  // Add main container to DOM
  container.appendChild(mainContainer);
  
  // NOW initialize the products panel data after it's in the DOM
  await initializeProductsPanelData();
  
  // Initially show companies panel, hide others
  showCompaniesPanel();
}

// Create Companies Panel
async function createCompaniesPanel() {
  const companiesPanel = document.createElement('div');
  companiesPanel.id = 'titlesCompaniesPanel';
  
// Create header with consistent structure
const header = document.createElement('div');
header.className = 'product-studio-header';
header.innerHTML = `
  <div class="product-studio-header-left">
    <h2 class="product-studio-header-title">
      Companies Analysis
      <span class="product-studio-version">v1.0.0 BETA</span>
    </h2>
    <div class="product-studio-selected-info">
      Analyzing company performance across all metrics
    </div>
  </div>
  <div class="product-studio-companies-stats" style="position: absolute; right: 20px; display: flex; gap: 20px; align-items: center;">
    <div class="companies-stat-item" style="display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
      <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Total Companies</span>
      <span id="totalCompaniesCount" style="font-size: 18px; font-weight: 700; color: white;">-</span>
    </div>
    <div class="companies-stat-item" style="display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
      <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Avg T-Score</span>
      <span id="avgCompanyTScore" style="font-size: 18px; font-weight: 700; color: white;">-</span>
    </div>
  </div>
`;
  companiesPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  tableContainer.id = 'companiesTableContainer';
  
  // Load and render companies data
  const companiesData = await loadCompaniesData();
  
  if (companiesData.length > 0) {
    renderCompaniesTable(tableContainer, companiesData);
  } else {
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        No companies data found
      </div>
    `;
  }
  
  companiesPanel.appendChild(tableContainer); 
  return companiesPanel;
}

// Render companies table
function renderCompaniesTable(container, companies) {
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'product-studio-table'; // Use same class as products table
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="rank" style="width: 70px;">
      Rank
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="sortable" data-sort="company" style="min-width: 300px;">
      Company Name
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="products" style="width: 80px;">
      Products
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="tscore" style="width: 100px;">
      Avg T-Score
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="kos" style="width: 80px;">
      Avg KOS
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="gos" style="width: 80px;">
      Avg GOS
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="length" style="width: 100px;">
      Avg Length
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="words" style="width: 100px;">
      Avg Words
      <span class="product-studio-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  companies.forEach((company, index) => {
    const row = document.createElement('tr');
    row.dataset.companyData = JSON.stringify(company);
    
    // Rank badge class
    let rankClass = 'regular';
    if (index === 0) rankClass = 'gold';
    else if (index === 1) rankClass = 'silver';
    else if (index === 2) rankClass = 'bronze';
    
    // Score classes
    const roundedScore = Math.round(company.avgFinalScore);
    let tscoreClass = 'product-studio-tscore-poor';
    if (roundedScore > 70) tscoreClass = 'product-studio-tscore-excellent';
    else if (roundedScore >= 55) tscoreClass = 'product-studio-tscore-good';
    else if (roundedScore >= 40) tscoreClass = 'product-studio-tscore-fair';
    
    let kosClass = 'product-studio-kos-poor';
    if (company.avgKos > 15) kosClass = 'product-studio-kos-excellent';
    else if (company.avgKos >= 10) kosClass = 'product-studio-kos-good';
    else if (company.avgKos > 5) kosClass = 'product-studio-kos-fair';
    
    let gosClass = 'product-studio-gos-poor';
    if (company.avgGos > 60) gosClass = 'product-studio-gos-excellent';
    else if (company.avgGos >= 40) gosClass = 'product-studio-gos-good';
    else if (company.avgGos >= 20) gosClass = 'product-studio-gos-fair';
    
    row.innerHTML = `
      <td class="center">
        <div class="company-rank-badge ${rankClass}" style="font-size: 14px; width: 36px; height: 36px;">${index + 1}</div>
      </td>
      <td>
        <div style="font-weight: 600; color: #333; font-size: 13px;">
          ${company.source}
        </div>
      </td>
      <td class="center">
        <span style="font-weight: 700; color: #667eea; font-size: 14px;">
          ${company.totalProducts}
        </span>
      </td>
      <td class="center">
        <span class="product-studio-score-fraction ${tscoreClass}" style="padding: 3px 6px;">
          <span class="product-studio-score-value" style="font-size: 12px;">${roundedScore}</span>
          <span class="product-studio-score-max" style="font-size: 9px;">/100</span>
        </span>
      </td>
      <td class="center">
        <span class="product-studio-score-fraction ${kosClass}" style="padding: 3px 6px;">
          <span class="product-studio-score-value" style="font-size: 12px;">${company.avgKos.toFixed(1)}</span>
          <span class="product-studio-score-max" style="font-size: 9px;">/20</span>
        </span>
      </td>
      <td class="center">
        <span class="product-studio-score-fraction ${gosClass}" style="padding: 3px 6px;">
          <span class="product-studio-score-value" style="font-size: 12px;">${Math.round(company.avgGos)}</span>
          <span class="product-studio-score-max" style="font-size: 9px;">/80</span>
        </span>
      </td>
      <td class="center">
        <span style="font-weight: 600; color: #495057;">
          ${Math.round(company.avgTitleLength)}
        </span>
      </td>
      <td class="center">
        <span style="font-weight: 600; color: #495057;">
          ${Math.round(company.avgWordCount)}
        </span>
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add click handlers for row expansion
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', function() {
      toggleCompanyRowExpansion(this);
    });
  });
  
  // Add sorting functionality
  addCompaniesSortingFunctionality(table, companies);
  
  // Store data globally for sorting
  window.companiesTableData = companies;

// Update header stats
setTimeout(() => {
  const totalCompaniesEl = document.getElementById('totalCompaniesCount');
  const avgTScoreEl = document.getElementById('avgCompanyTScore');
  
  if (totalCompaniesEl) {
    totalCompaniesEl.textContent = companies.length;
  }
  
  if (avgTScoreEl && companies.length > 0) {
    const avgTScore = companies.reduce((sum, c) => sum + c.avgFinalScore, 0) / companies.length;
    avgTScoreEl.textContent = Math.round(avgTScore);
  }
}, 50);
}

// Toggle expanded row for companies
function toggleCompanyRowExpansion(row) {
  const nextRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');
  
  if (isExpanded && nextRow && nextRow.classList.contains('product-studio-expanded-row')) {
    row.classList.remove('expanded');
    nextRow.remove();
    return;
  }
  
  const tbody = row.parentElement;
  tbody.querySelectorAll('.expanded').forEach(r => r.classList.remove('expanded'));
  tbody.querySelectorAll('.product-studio-expanded-row').forEach(r => r.remove());
  
  row.classList.add('expanded');
  
  const companyData = JSON.parse(row.dataset.companyData);
  
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'product-studio-expanded-row';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = row.cells.length;
  
  // Build expanded content with GOS breakdown
  expandedCell.innerHTML = `
    <div class="product-studio-expanded-content">
      <h3 style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
        T-Score Distribution for ${companyData.source}
      </h3>
      <div class="companies-gos-breakdown">
        <div class="gos-breakdown-item excellent">
          <div class="gos-breakdown-label">Excellent (60-80)</div>
          <div class="gos-breakdown-count">${companyData.gosOverview.excellent}</div>
          <div style="font-size: 12px; color: #6b7280;">products</div>
        </div>
        <div class="gos-breakdown-item good">
          <div class="gos-breakdown-label">Good (40-60)</div>
          <div class="gos-breakdown-count">${companyData.gosOverview.good}</div>
          <div style="font-size: 12px; color: #6b7280;">products</div>
        </div>
        <div class="gos-breakdown-item poor">
          <div class="gos-breakdown-label">Fair (20-40)</div>
          <div class="gos-breakdown-count">${companyData.gosOverview.poor}</div>
          <div style="font-size: 12px; color: #6b7280;">products</div>
        </div>
        <div class="gos-breakdown-item bad">
          <div class="gos-breakdown-label">Poor (&lt;20)</div>
          <div class="gos-breakdown-count">${companyData.gosOverview.bad}</div>
          <div style="font-size: 12px; color: #6b7280;">products</div>
        </div>
      </div>
    </div>
  `;
  
  expandedRow.appendChild(expandedCell);
  row.parentNode.insertBefore(expandedRow, row.nextSibling);
}

// Add sorting functionality for companies table
function addCompaniesSortingFunctionality(table, companies) {
  const headers = table.querySelectorAll('th.sortable');
  
  let sortState = { column: 'rank', direction: 'asc' };
  
  headers.forEach(header => {
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      
      if (sortState.column === sortKey) {
        sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        sortState.column = sortKey;
        sortState.direction = sortKey === 'rank' ? 'asc' : 'desc';
      }
      
// Remove all sort indicators
headers.forEach(h => {
  h.classList.remove('sorted-asc', 'sorted-desc');
});

// Add current sort indicator
this.classList.add(sortState.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
      // Sort companies
      const sortedCompanies = [...companies].sort((a, b) => {
        let aVal, bVal;
        
        switch(sortKey) {
          case 'rank':
            aVal = companies.indexOf(a);
            bVal = companies.indexOf(b);
            break;
          case 'company':
            aVal = a.source.toLowerCase();
            bVal = b.source.toLowerCase();
            break;
          case 'products':
            aVal = a.totalProducts;
            bVal = b.totalProducts;
            break;
          case 'tscore':
            aVal = a.avgFinalScore;
            bVal = b.avgFinalScore;
            break;
          case 'kos':
            aVal = a.avgKos;
            bVal = b.avgKos;
            break;
          case 'gos':
            aVal = a.avgGos;
            bVal = b.avgGos;
            break;
          case 'length':
            aVal = a.avgTitleLength;
            bVal = b.avgTitleLength;
            break;
          case 'words':
            aVal = a.avgWordCount;
            bVal = b.avgWordCount;
            break;
          default:
            aVal = 0;
            bVal = 0;
        }
        
        if (sortState.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      const container = table.closest('.product-studio-table-container');
      container.innerHTML = '';
      renderCompaniesTable(container, sortedCompanies);
    });
  });
}

// Create Products Panel with real data
async function createProductsPanel() {
  const productsPanel = document.createElement('div');
  productsPanel.id = 'titlesGlobalProductsPanel';
  
  // Get all companies for dropdown
  const allCompanies = await getAllCompaniesFromData();
  const currentCompany = window.myCompany || allCompanies[0] || '';
  
  // Create header with filter, company dropdown and averages
  const header = document.createElement('div');
  header.className = 'product-studio-header';
header.innerHTML = `
    <div class="product-studio-header-left">
      <h2 class="product-studio-header-title">
        Global Products Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        Analyzing product performance across all search terms
      </div>
    </div>
<div class="product-studio-filter-section" style="display: flex; align-items: flex-start; gap: 15px; margin-left: 30px;">
      <div class="product-studio-title-filter" style="position: relative;">
        <input type="text" 
               class="product-studio-filter-input" 
               id="productStudioFilterInput" 
               placeholder="🔍 Filter products by title... (Press Enter)" 
               autocomplete="off">
        <div class="product-studio-filter-tags" id="productStudioFilterTags" style="position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px;"></div>
      </div>
      <div class="product-studio-company-selector">
        <select id="productStudioCompanySelect" class="product-studio-filter-input" style="width: 200px;">
          ${allCompanies.map(company => 
            `<option value="${company}" ${company.toLowerCase() === currentCompany.toLowerCase() ? 'selected' : ''}>
              ${company}
            </option>`
          ).join('')}
        </select>
      </div>
    </div>
    <div class="product-studio-avg-scores">
        <div class="product-studio-avg-item" id="globalAvgTScoreContainer">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG T-SCORE</span>
            <div class="product-studio-avg-score-display">
              <span class="product-studio-avg-value" id="globalAvgTScore">-</span>
              <span class="product-studio-avg-max">/100</span>
            </div>
          </div>
        </div>
        <div class="product-studio-avg-item" id="globalAvgKOSContainer">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG KOS</span>
            <div class="product-studio-avg-score-display">
              <span class="product-studio-avg-value" id="globalAvgKOS">-</span>
              <span class="product-studio-avg-max">/20</span>
            </div>
          </div>
        </div>
        <div class="product-studio-avg-item" id="globalAvgGOSContainer">
          <div style="display: flex; flex-direction: column; align-items: center;">
            <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">AVG GOS</span>
            <div class="product-studio-avg-score-display">
              <span class="product-studio-avg-value" id="globalAvgGOS">-</span>
              <span class="product-studio-avg-max">/80</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  productsPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  tableContainer.id = 'globalProductsTableContainer';
  
  // IMPORTANT: Append table container to panel BEFORE trying to load data
  productsPanel.appendChild(tableContainer);
  
  // Return the panel so it can be added to DOM
  return productsPanel;
}

// Create Rank Map Products Panel
async function createRankMapProductsPanel() {
  const rankMapPanel = document.createElement('div');
  rankMapPanel.id = 'titlesRankMapProductsPanel';
  
  // Create header WITHOUT filter and company dropdown
  const header = document.createElement('div');
  header.className = 'product-studio-header';
  header.innerHTML = `
    <div class="product-studio-header-left">
      <h2 class="product-studio-header-title">
        Rank Map Analysis
        <span class="product-studio-version">v1.0.0 BETA</span>
      </h2>
      <div class="product-studio-selected-info">
        T-Score correlation with SERP positions across all companies
      </div>
    </div>
    <div class="product-studio-rank-map-stats" style="position: absolute; right: 20px; display: flex; gap: 20px; align-items: center;">
      <div class="rank-map-stat-item" style="display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Total Products</span>
        <span id="rankMapTotalProducts" style="font-size: 18px; font-weight: 700; color: white;">-</span>
      </div>
      <div class="rank-map-stat-item" style="display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Data Coverage</span>
        <span id="rankMapCoverage" style="font-size: 18px; font-weight: 700; color: white;">-</span>
      </div>
      <div class="rank-map-stat-item" style="display: flex; flex-direction: column; align-items: center; padding: 8px 16px; background: rgba(255,255,255,0.1); border-radius: 8px;">
        <span style="font-size: 10px; color: rgba(255,255,255,0.8); text-transform: uppercase; letter-spacing: 0.5px;">Last Updated</span>
        <span id="rankMapLastUpdated" style="font-size: 12px; font-weight: 600; color: white;">-</span>
      </div>
    </div>
  `;
  rankMapPanel.appendChild(header);
  
  // Create table container
  const tableContainer = document.createElement('div');
  tableContainer.className = 'product-studio-table-container';
  tableContainer.id = 'rankMapTableContainer';
  
  rankMapPanel.appendChild(tableContainer);
  
  return rankMapPanel;
}

// Load and process rank map data with caching
async function loadRankMapData(forceRefresh = false) {
  const CACHE_KEY = 'rankMapDataCache';
  const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
  
  // Check cache first
  if (!forceRefresh) {
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION) {
        console.log('[loadRankMapData] Using cached data');
        return data;
      }
    }
  }
  
  console.log('[loadRankMapData] Loading fresh data...');
  
  // Get ALL companies first
  const allCompanies = await getAllCompaniesFromData();
  
  // Initialize position map
  const positionMap = new Map();
  for (let pos = 1; pos <= 40; pos++) {
    positionMap.set(pos, {
      position: pos,
      tscores: [],
      products: [],
      companies: new Set()
    });
  }
  
  let totalProducts = 0;
  
  // Process each company
  for (const company of allCompanies) {
    // Load evaluated products for this company
    const evaluatedProducts = await loadProductTitlesEvaluated(company);
    
    if (evaluatedProducts.length > 0) {
      const productTitles = evaluatedProducts.map(p => p.title);
      
      // Load processed metrics for this company
      const processedMetrics = await loadProcessedDataForProducts(productTitles, company);
      
      // Map products to positions
      evaluatedProducts.forEach(product => {
        const metrics = processedMetrics.get(product.title);
        const position = metrics?.avgPosition;
        
        if (position && position >= 1 && position <= 40) {
          const roundedPos = Math.round(position);
          const posData = positionMap.get(roundedPos);
          
          if (posData) {
            posData.tscores.push(product.finalScore);
            posData.products.push({
              title: product.title,
              tscore: product.finalScore,
              company: company
            });
            posData.companies.add(company);
            totalProducts++;
          }
        }
      });
    }
  }
  
  // Calculate averages and prepare final data
  const rankMapData = [];
  let positionsWithData = 0;
  
  for (let pos = 1; pos <= 40; pos++) {
    const posData = positionMap.get(pos);
    const avgTScore = posData.tscores.length > 0 
      ? posData.tscores.reduce((a, b) => a + b, 0) / posData.tscores.length 
      : null;
    
    if (posData.tscores.length > 0) {
      positionsWithData++;
    }
    
    rankMapData.push({
      position: pos,
      avgTScore: avgTScore,
      productCount: posData.tscores.length,
      companyCount: posData.companies.size,
      products: posData.products.slice(0, 5) // Keep top 5 for tooltip
    });
  }
  
  const result = {
    data: rankMapData,
    totalProducts: totalProducts,
    coverage: Math.round((positionsWithData / 40) * 100),
    timestamp: Date.now()
  };
  
  // Cache the results
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data: result,
    timestamp: Date.now()
  }));
  
  return result;
}

// Render rank map table
function renderRankMapTable(container, rankMapResult) {
  const { data, totalProducts, coverage, timestamp } = rankMapResult;
  
  // Update stats
  document.getElementById('rankMapTotalProducts').textContent = totalProducts.toLocaleString();
  document.getElementById('rankMapCoverage').textContent = `${coverage}%`;
  document.getElementById('rankMapLastUpdated').textContent = new Date(timestamp).toLocaleTimeString();
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'product-studio-table';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center" style="width: 80px;">Position</th>
    <th class="center" style="width: 100px;">Avg T-Score</th>
    <th style="width: 250px;">T-Score Visualization</th>
    <th class="center" style="width: 100px;">Products</th>
    <th class="center" style="width: 100px;">Companies</th>
    <th>Insights</th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  // Find max T-Score for scaling
  const maxTScore = Math.max(...data.filter(d => d.avgTScore).map(d => d.avgTScore));
  
  data.forEach(row => {
    const tr = document.createElement('tr');
    
    // Position indicator with color coding
    let posClass = 'bottom';
    if (row.position <= 3) posClass = 'top';
    else if (row.position <= 8) posClass = 'mid';
    else if (row.position <= 14) posClass = 'low';
    
    // T-Score color
    let tscoreClass = '';
    let tscoreColor = '#999';
    if (row.avgTScore) {
      if (row.avgTScore > 70) {
        tscoreClass = 'product-studio-tscore-excellent';
        tscoreColor = '#22c55e';
      } else if (row.avgTScore >= 55) {
        tscoreClass = 'product-studio-tscore-good';
        tscoreColor = '#4ade80';
      } else if (row.avgTScore >= 40) {
        tscoreClass = 'product-studio-tscore-fair';
        tscoreColor = '#fbbf24';
      } else {
        tscoreClass = 'product-studio-tscore-poor';
        tscoreColor = '#ef4444';
      }
    }
    
    // Calculate bar width
    const barWidth = row.avgTScore ? (row.avgTScore / 100) * 100 : 0;
    
    // Insights based on position and T-Score
    let insight = '';
    if (row.avgTScore) {
      if (row.position <= 5 && row.avgTScore < 50) {
        insight = '⚠️ Low quality titles ranking high';
      } else if (row.position <= 5 && row.avgTScore > 70) {
        insight = '✅ High quality titles dominating';
      } else if (row.position > 20 && row.avgTScore > 60) {
        insight = '📈 Good titles underperforming';
      } else if (row.position > 20 && row.avgTScore < 40) {
        insight = '❌ Poor titles in poor positions';
      } else if (row.avgTScore >= 55 && row.avgTScore <= 70) {
        insight = '📊 Average performance';
      }
    }
    
    tr.innerHTML = `
      <td class="center">
        <div class="product-studio-position-indicator ${posClass}">${row.position}</div>
      </td>
      <td class="center">
        ${row.avgTScore ? 
          `<span class="product-studio-score-fraction ${tscoreClass}">
            <span class="product-studio-score-value">${Math.round(row.avgTScore)}</span>
            <span class="product-studio-score-max">/100</span>
          </span>` : 
          '<span style="color: #adb5bd;">No data</span>'}
      </td>
      <td>
        ${row.avgTScore ? 
          `<div style="width: 100%; height: 24px; background: #f0f2f5; border-radius: 12px; position: relative; overflow: hidden;">
            <div style="width: ${barWidth}%; height: 100%; background: linear-gradient(90deg, ${tscoreColor}dd, ${tscoreColor}); transition: width 0.3s ease;"></div>
            <div style="position: absolute; top: 0; left: 8px; right: 8px; height: 100%; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 11px; font-weight: 600; color: ${barWidth > 50 ? 'white' : '#333'};">${Math.round(row.avgTScore)}</span>
              ${row.productCount > 0 ? `<span style="font-size: 10px; color: ${barWidth > 50 ? 'rgba(255,255,255,0.8)' : '#666'};">${row.productCount} samples</span>` : ''}
            </div>
          </div>` : 
          '<div style="color: #adb5bd; font-size: 12px;">-</div>'}
      </td>
      <td class="center">
        ${row.productCount > 0 ? 
          `<span style="font-weight: 600; color: #333;">${row.productCount}</span>` : 
          '<span style="color: #adb5bd;">0</span>'}
      </td>
      <td class="center">
        ${row.companyCount > 0 ? 
          `<span style="font-weight: 600; color: #667eea;">${row.companyCount}</span>` : 
          '<span style="color: #adb5bd;">0</span>'}
      </td>
      <td>
        <span style="font-size: 12px; color: #666;">${insight}</span>
      </td>
    `;
    
    // Add hover tooltip for sample products
    if (row.products && row.products.length > 0) {
      tr.setAttribute('title', `Sample products: ${row.products.map(p => p.title).join(', ')}`);
    }
    
    tbody.appendChild(tr);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
}

// Initialize products panel data (call this after the panel is added to DOM)
async function initializeProductsPanelData() {
  const currentCompany = document.getElementById('productStudioCompanySelect')?.value || window.myCompany || '';
  
  // Load and render data with current company
  await loadProductDataForCompany(currentCompany);
  
  // Initialize filter
  initializeProductStudioFilter();
  
// In the initializeProductsPanelData function, update the company selector event listener:
const companySelect = document.getElementById('productStudioCompanySelect');
if (companySelect) {
  companySelect.addEventListener('change', async function() {
    const selectedCompany = this.value;
    console.log('[ProductStudio] Switching to company:', selectedCompany);
    
    // Reset sort state when switching companies (optional)
    window.globalProductsSortState = { column: 'tscore', direction: 'desc' };
    
    // Clear filters when switching companies
    const tagsContainer = document.getElementById('productStudioFilterTags');
    if (tagsContainer) {
      tagsContainer.innerHTML = '';
    }
    const filterInput = document.getElementById('productStudioFilterInput');
    if (filterInput) {
      filterInput.value = '';
    }
    
    await loadProductDataForCompany(selectedCompany);
  });
}
}

// Replace the entire loadProductDataForCompany function:
async function loadProductDataForCompany(company) {
  const tableContainer = document.getElementById('globalProductsTableContainer');
  if (!tableContainer) {
    console.error('[loadProductDataForCompany] Table container not found');
    return;
  }
  
  console.log('[loadProductDataForCompany] Loading data for company:', company);
  
  try {
    const evaluatedProducts = await loadProductTitlesEvaluated(company);
    console.log('[loadProductDataForCompany] Evaluated products loaded:', evaluatedProducts.length);
    
    if (evaluatedProducts.length > 0) {
      const productTitles = evaluatedProducts.map(p => p.title);
      console.log('[loadProductDataForCompany] Product titles:', productTitles.length);
      
      // Pass company to loadProcessedDataForProducts
      const processedMetrics = await loadProcessedDataForProducts(productTitles, company);
      console.log('[loadProductDataForCompany] Processed metrics loaded:', processedMetrics.size);
      
      const roasData = await loadProductPerformanceData();
      console.log('[loadProductDataForCompany] ROAS data loaded:', roasData.size);
      
      // Store data globally for filtering, including the company
      window.globalProductsData = { evaluatedProducts, processedMetrics, roasData, currentCompany: company };
      
      // Clear container before rendering
      tableContainer.innerHTML = '';
      
      // Pass company to renderGlobalProductsTable
      await renderGlobalProductsTable(tableContainer, evaluatedProducts, processedMetrics, roasData, company);
      
      // Update averages
      updateGlobalAverages(evaluatedProducts);
    } else {
      console.warn('[loadProductDataForCompany] No products found for company:', company);
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #999;">
          No product data found for ${company}
        </div>
      `;
    }
  } catch (error) {
    console.error('[loadProductDataForCompany] Error loading data:', error);
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #999;">
        Error loading product data: ${error.message}
      </div>
    `;
  }
}

// Initialize toggle functionality
function initializeProductStudioToggle() {
  const companiesBtn = document.getElementById('studioCompaniesMode');
  const productsBtn = document.getElementById('studioProductsMode');
  const rankMapBtn = document.getElementById('studioRankMapMode');
  
  console.log('[initializeProductStudioToggle] Found buttons:', {
    companiesBtn: !!companiesBtn,
    productsBtn: !!productsBtn,
    rankMapBtn: !!rankMapBtn
  });
  
  if (companiesBtn && productsBtn && rankMapBtn) {
    // Remove any existing event listeners by cloning elements
    companiesBtn.replaceWith(companiesBtn.cloneNode(true));
    productsBtn.replaceWith(productsBtn.cloneNode(true));
    rankMapBtn.replaceWith(rankMapBtn.cloneNode(true));
    
    // Get the new elements after cloning
    const newCompaniesBtn = document.getElementById('studioCompaniesMode');
    const newProductsBtn = document.getElementById('studioProductsMode');
    const newRankMapBtn = document.getElementById('studioRankMapMode');
    
    newCompaniesBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[ProductStudio] Companies button clicked');
      
      newCompaniesBtn.classList.add('active');
      newProductsBtn.classList.remove('active');
      newRankMapBtn.classList.remove('active');
      showCompaniesPanel();
      console.log('Companies mode selected in Product Studio');
    });
    
    newProductsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[ProductStudio] Products button clicked');
      
      newProductsBtn.classList.add('active');
      newCompaniesBtn.classList.remove('active');
      newRankMapBtn.classList.remove('active');
      showProductsPanel();
      console.log('Products mode selected in Product Studio');
    });
    
    newRankMapBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[ProductStudio] Rank Map button clicked');
      
      newRankMapBtn.classList.add('active');
      newCompaniesBtn.classList.remove('active');
      newProductsBtn.classList.remove('active');
      showRankMapPanel();
      console.log('Rank Map mode selected in Product Studio');
    });
    
    console.log('[initializeProductStudioToggle] Event listeners attached successfully');
  } else {
    console.error('[initializeProductStudioToggle] Could not find toggle buttons');
  }
}

// Show Companies Panel
function showCompaniesPanel() {
  const companiesPanel = document.getElementById('titlesCompaniesPanel');
  const productsPanel = document.getElementById('titlesGlobalProductsPanel');
  const rankMapPanel = document.getElementById('titlesRankMapProductsPanel');
  
  if (companiesPanel && productsPanel && rankMapPanel) {
    companiesPanel.style.display = 'flex';
    productsPanel.style.display = 'none';
    rankMapPanel.style.display = 'none';
  }
}

// Show Products Panel
async function showProductsPanel() {
  const companiesPanel = document.getElementById('titlesCompaniesPanel');
  const productsPanel = document.getElementById('titlesGlobalProductsPanel');
  const rankMapPanel = document.getElementById('titlesRankMapProductsPanel');
  
  if (companiesPanel && productsPanel && rankMapPanel) {
    companiesPanel.style.display = 'none';
    productsPanel.style.display = 'flex';
    rankMapPanel.style.display = 'none';
    
    // Check if table is empty and reload if needed
    const tableContainer = document.getElementById('globalProductsTableContainer');
    if (tableContainer && !tableContainer.hasChildNodes()) {
      const currentCompany = document.getElementById('productStudioCompanySelect')?.value || window.myCompany || '';
      await loadProductDataForCompany(currentCompany);
    }
  }
}

// Show Rank Map Panel
async function showRankMapPanel() {
  const companiesPanel = document.getElementById('titlesCompaniesPanel');
  const productsPanel = document.getElementById('titlesGlobalProductsPanel');
  const rankMapPanel = document.getElementById('titlesRankMapProductsPanel');
  
  if (companiesPanel && productsPanel && rankMapPanel) {
    companiesPanel.style.display = 'none';
    productsPanel.style.display = 'none';
    rankMapPanel.style.display = 'flex';
    
    const tableContainer = document.getElementById('rankMapTableContainer');
    if (tableContainer) {
      // Show loading state
      tableContainer.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 20px;">
          <div class="loading-spinner" style="width: 50px; height: 50px; border: 4px solid #f0f2f5; border-top: 4px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <div style="text-align: center;">
            <h3 style="color: #333; margin: 0;">Processing Rank Map Data</h3>
            <p style="color: #666; margin-top: 8px; font-size: 14px;">Analyzing T-Score correlation across all positions...</p>
            <p style="color: #999; margin-top: 4px; font-size: 12px;">This may take a few moments for the first load</p>
          </div>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `;
      
      // Load rank map data
      try {
        const rankMapResult = await loadRankMapData();
        
        // Clear loading state and render table
        tableContainer.innerHTML = '';
        renderRankMapTable(tableContainer, rankMapResult);
      } catch (error) {
        console.error('[showRankMapPanel] Error loading rank map data:', error);
        tableContainer.innerHTML = `
          <div style="text-align: center; padding: 40px; color: #999;">
            <h3>Error Loading Rank Map Data</h3>
            <p>${error.message}</p>
            <button onclick="window.showRankMapPanel()" style="margin-top: 20px; padding: 8px 16px; background: #667eea; color: white; border: none; border-radius: 6px; cursor: pointer;">Retry</button>
          </div>
        `;
      }
    }
  }
}

// Replace the entire renderGlobalProductsTable function:
async function renderGlobalProductsTable(container, products, processedMetrics, roasData = new Map(), companyFilter = null) {
  // Pass company to matchProductsWithGlobalData
  const matchedProducts = matchProductsWithGlobalData(products, companyFilter);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'product-studio-wrapper';
  
  const table = document.createElement('table');
  table.className = 'product-studio-table';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  headerRow.innerHTML = `
    <th class="center sortable" data-sort="position" style="width: 50px;">
      Pos
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="share" style="width: 60px;">
      Share
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 55px;">
      ROAS
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center" style="width: 60px;">Image</th>
    <th class="sortable" data-sort="title" style="min-width: 300px;">
      Product Title
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="tscore" style="width: 60px;">
      T-Score
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="kos" style="width: 50px;">
      KOS
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="gos" style="width: 50px;">
      GOS
      <span class="product-studio-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="suggestions" style="width: 50px;">
      Sugg
      <span class="product-studio-sort-icon">⇅</span>
    </th>
  `;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create tbody
  const tbody = document.createElement('tbody');
  
  products.forEach((product, index) => {
    const row = document.createElement('tr');
    row.dataset.productTitle = product.title;
    row.dataset.productData = JSON.stringify(product);
    
    // Get processed metrics
    const productProcessedMetrics = processedMetrics.get(product.title);
    const adPosition = productProcessedMetrics?.avgPosition || null;
    const marketShare = productProcessedMetrics?.avgVisibility || null;
    const trend = productProcessedMetrics?.trend || null;
    
    // Get ROAS
    const roas = roasData.get(product.title) || 0;
    row.dataset.roas = roas; // Store for sorting
    
    // Get matched product for image
    const matchedProduct = matchedProducts.get(product.title);
    const imageUrl = matchedProduct?.thumbnail || '';
    
    // Position badge class
    let posClass = 'bottom';
    if (adPosition) {
      if (adPosition <= 3) posClass = 'top';
      else if (adPosition <= 8) posClass = 'mid';
      else if (adPosition <= 14) posClass = 'low';
    }
    
    // ROAS class
    let roasClass = 'titles-roas-low';
    if (roas >= 3) roasClass = 'titles-roas-high';
    else if (roas >= 1.5) roasClass = 'titles-roas-medium';
    
    // Score classes
    const roundedScore = Math.round(product.finalScore);
    let tscoreClass = 'product-studio-tscore-poor';
    if (roundedScore > 70) tscoreClass = 'product-studio-tscore-excellent';
    else if (roundedScore >= 55) tscoreClass = 'product-studio-tscore-good';
    else if (roundedScore >= 40) tscoreClass = 'product-studio-tscore-fair';
    
    let kosClass = 'product-studio-kos-poor';
    if (product.kos > 15) kosClass = 'product-studio-kos-excellent';
    else if (product.kos >= 10) kosClass = 'product-studio-kos-good';
    else if (product.kos > 5) kosClass = 'product-studio-kos-fair';
    
    let gosClass = 'product-studio-gos-poor';
    if (product.gos > 60) gosClass = 'product-studio-gos-excellent';
    else if (product.gos >= 40) gosClass = 'product-studio-gos-good';
    else if (product.gos >= 20) gosClass = 'product-studio-gos-fair';
    
    const suggestionsCount = product.suggestions?.length || 0;
    let suggClass = '';
    if (suggestionsCount >= 7) suggClass = 'critical';
    else if (suggestionsCount >= 4) suggClass = 'has-many';
    
    row.innerHTML = `
      <td class="center">
        ${adPosition !== null ? 
          `<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
            <div class="product-studio-position-indicator ${posClass}">${adPosition}</div>
            ${trend ? 
              `<div style="font-size: 9px; color: ${trend.color}; font-weight: 600; background: ${trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 1px 4px; border-radius: 4px;">${trend.text}</div>` : 
              ''}
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${marketShare ? 
          `<div class="product-studio-share-bar" style="width: 55px; height: 28px;">
            <div class="product-studio-share-fill" style="width: ${Math.min(marketShare, 100)}%"></div>
            <div class="product-studio-share-text" style="font-size: 10px;">${marketShare.toFixed(1)}%</div>
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${roas > 0 ? 
          `<span class="titles-roas-indicator ${roasClass}" style="padding: 3px 6px; font-size: 11px;">
            ${roas.toFixed(2)}x
          </span>` :
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${imageUrl ? 
          `<div class="product-studio-img-container">
            <img class="product-studio-img" src="${imageUrl}" alt="${product.title}" style="width: 45px; height: 45px;" onerror="this.style.display='none'">
            <img class="product-studio-img-zoom" src="${imageUrl}" alt="${product.title}">
          </div>` : 
          '<div style="width: 45px; height: 45px; background: #f0f2f5; border-radius: 6px; margin: 0 auto;"></div>'}
      </td>
      <td>
        <div class="product-studio-title-cell">
<div class="product-studio-title" style="font-size: 12px;">
  ${product.title}
</div>
        </div>
      </td>
      <td class="center">
        ${product.finalScore > 0 ? 
          `<span class="product-studio-score-fraction ${tscoreClass}" style="padding: 3px 6px;">
            <span class="product-studio-score-value" style="font-size: 12px;">${roundedScore}</span>
            <span class="product-studio-score-max" style="font-size: 9px;">/100</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${product.kos > 0 ? 
          `<span class="product-studio-score-fraction ${kosClass}" style="padding: 3px 6px;">
            <span class="product-studio-score-value" style="font-size: 12px;">${product.kos.toFixed(1)}</span>
            <span class="product-studio-score-max" style="font-size: 9px;">/20</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${product.gos > 0 ? 
          `<span class="product-studio-score-fraction ${gosClass}" style="padding: 3px 6px;">
            <span class="product-studio-score-value" style="font-size: 12px;">${Math.round(product.gos)}</span>
            <span class="product-studio-score-max" style="font-size: 9px;">/80</span>
          </span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
      <td class="center">
        ${suggestionsCount > 0 ? 
          `<span class="product-studio-suggestions-count ${suggClass}" style="font-size: 11px; padding: 3px 6px; min-width: 25px;" title="${suggestionsCount} improvement suggestions">${suggestionsCount}</span>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
    `;
    
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  container.appendChild(wrapper);
  
  // Add click handlers for row expansion
  tbody.querySelectorAll('tr').forEach(row => {
    row.addEventListener('click', function(e) {
      if (e.target.closest('.product-studio-img-container')) return;
      window.toggleGlobalRowExpansion(this);
    });
  });
  
  // Add image hover positioning
  wrapper.querySelectorAll('.product-studio-img-container').forEach(container => {
    const img = container.querySelector('.product-studio-img');
    const zoomImg = container.querySelector('.product-studio-img-zoom');
    
    if (img && zoomImg) {
      container.addEventListener('mouseenter', function(e) {
        const rect = this.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        let left = rect.right + 10;
        let top = rect.top - 100;
        
        if (left + 300 > viewportWidth) {
          left = rect.left - 310;
        }
        
        if (top < 10) {
          top = 10;
        }
        
        if (top + 300 > viewportHeight - 10) {
          top = viewportHeight - 310;
        }
        
        zoomImg.style.left = `${left}px`;
        zoomImg.style.top = `${top}px`;
      });
    }
  });
  
  // Add sorting functionality - pass company filter
  addGlobalSortingFunctionality(table, products, processedMetrics, roasData, companyFilter);
}

// Toggle expanded row for global products - MAKE IT GLOBAL
window.toggleGlobalRowExpansion = function(row) {
  const nextRow = row.nextElementSibling;
  const isExpanded = row.classList.contains('expanded');
  
  if (isExpanded && nextRow && nextRow.classList.contains('product-studio-expanded-row')) {
    row.classList.remove('expanded');
    nextRow.remove();
    return;
  }
  
  const tbody = row.parentElement;
  tbody.querySelectorAll('.expanded').forEach(r => r.classList.remove('expanded'));
  tbody.querySelectorAll('.product-studio-expanded-row').forEach(r => r.remove());
  
  row.classList.add('expanded');
  
  const productData = JSON.parse(row.dataset.productData);
  
  if (!productData) {
    console.warn('No product data found');
    return;
  }
  
  const expandedRow = document.createElement('tr');
  expandedRow.className = 'product-studio-expanded-row';
  
  const expandedCell = document.createElement('td');
  expandedCell.colSpan = row.cells.length;
  
  // Build expanded content
  let expandedHTML = '<div class="product-studio-expanded-content">';
  expandedHTML += '<div class="product-studio-compact-grid">';
  
  // COLUMN 1: Keywords from all queries
  expandedHTML += `
    <div class="product-studio-compact-section" style="width: 240px; flex-shrink: 0;">
      <div class="product-studio-compact-header">
        <span style="font-size: 12px;">🎯</span>
        <h4 class="product-studio-compact-title">Top Keywords</h4>
      </div>
      <div class="product-studio-compact-body">`;
  
  // Display all queries with their KOS values
  if (productData.queries && productData.queries.length > 0) {
    expandedHTML += `
      <table class="product-studio-keywords-compact">
        <thead style="border-bottom: 1px solid #e1e4e8;">
          <tr style="height: 20px;">
            <th style="width: 20px; text-align: center; font-size: 9px; color: #6a737d; font-weight: 600;">#</th>
            <th style="text-align: left; font-size: 9px; color: #6a737d; font-weight: 600; padding-left: 4px;">KEYWORD</th>
            <th style="width: 35px; text-align: center; font-size: 9px; color: #6a737d; font-weight: 600;">KOS</th>
          </tr>
        </thead>
        <tbody>`;
    
    // Sort queries by KOS value (highest first) and limit to top 10
    const sortedQueries = [...productData.queries].sort((a, b) => b.kos - a.kos).slice(0, 10);
    
    sortedQueries.forEach((q, idx) => {
      const kos = q.kos || 0;
      const kosClass = kos >= 15 ? 'kos-h' : kos >= 10 ? 'kos-m' : 'kos-l';
      expandedHTML += `
        <tr>
          <td>${idx + 1}</td>
          <td title="${q.query}">${q.query || '-'}</td>
          <td><span class="product-studio-kos-mini ${kosClass}">${kos.toFixed(1)}</span></td>
        </tr>`;
    });
    
    expandedHTML += '</tbody></table>';
  } else {
    expandedHTML += '<div style="color: #6a737d; font-size: 11px; text-align: center; padding: 20px;">No keyword data available</div>';
  }
  
  expandedHTML += `
      </div>
    </div>`;
  
  // Rest of the columns remain the same, but use product-studio classes
  // COLUMN 2: Score Breakdown
  expandedHTML += `
    <div class="product-studio-compact-section" style="width: 320px; flex-shrink: 0;">
      <div class="product-studio-compact-header">
        <span style="font-size: 12px;">📊</span>
        <h4 class="product-studio-compact-title">Score Breakdown</h4>
      </div>
      <div class="product-studio-compact-body">`;
  
  if (productData.scoreBreakdown) {
    const b = productData.scoreBreakdown;
    
    const getBarClass = (value, max) => {
      const pct = (value / max) * 100;
      if (pct >= 70) return 'high';
      if (pct >= 40) return 'medium';
      return 'low';
    };
    
    // GOS BREAKDOWN
    expandedHTML += `
      <div class="product-studio-score-group">
        <div class="product-studio-score-group-title">GOS Breakdown</div>`;
    
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
        <div class="product-studio-score-item-with-bar">
          <span class="product-studio-score-item-label">${item.label}:</span>
          <div class="product-studio-score-bar-container">
            <div class="product-studio-score-bar-fill ${barClass}" style="width: ${pct}%"></div>
          </div>
          <span class="product-studio-score-value">${item.value}/${item.max}</span>
        </div>`;
    });
    
    expandedHTML += `
      </div>`;
  }
  
  expandedHTML += `
      </div>
    </div>`;
  
  // COLUMN 3: Title Metrics
  expandedHTML += `
    <div class="product-studio-compact-section" style="width: 200px; flex-shrink: 0;">
      <div class="product-studio-compact-header">
        <span style="font-size: 12px;">📏</span>
        <h4 class="product-studio-compact-title">Title Metrics</h4>
      </div>
      <div class="product-studio-compact-body">
        <div style="font-size: 11px; line-height: 1.6;">
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Length:</span>
            <strong>${productData.titleLength || 0} chars</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Words:</span>
            <strong>${productData.wordCount || 0}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">T-Score:</span>
            <strong style="color: ${productData.finalScore > 70 ? '#22c55e' : productData.finalScore > 40 ? '#f59e0b' : '#ef4444'}">
              ${Math.round(productData.finalScore)}/100
            </strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Avg KOS:</span>
            <strong>${productData.kos.toFixed(1)}/20</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">GOS:</span>
            <strong>${Math.round(productData.gos)}/80</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px solid #f0f2f5;">
            <span style="color: #6a737d;">Brand:</span>
            <strong>${productData.detectedBrand || 'N/A'}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; padding: 4px 0;">
            <span style="color: #6a737d;">Category:</span>
            <strong>${productData.detectedCategory || 'N/A'}</strong>
          </div>
        </div>
      </div>
    </div>`;
  
  // COLUMN 4: Improvements
  expandedHTML += `
    <div class="product-studio-compact-section" style="width: 380px; flex-shrink: 0;">
      <div class="product-studio-compact-header">
        <span style="font-size: 12px;">💡</span>
        <h4 class="product-studio-compact-title">Improvements (${productData.suggestions?.length || 0})</h4>
      </div>
      <div class="product-studio-compact-body" style="height: 340px; overflow-y: auto;">
        <div class="product-studio-suggestions-list">`;
  
  if (productData.suggestions && productData.suggestions.length > 0) {
    productData.suggestions.forEach((suggestion, index) => {
      expandedHTML += `
        <div class="product-studio-suggestion-item">
          <span class="product-studio-suggestion-icon">${index + 1}</span>
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

// Initialize filter functionality for product studio
function initializeProductStudioFilter() {
  const filterInput = document.getElementById('productStudioFilterInput');
  if (filterInput) {
    filterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const filterText = e.target.value.trim();
        if (filterText.length > 0) {
          addProductStudioFilterTag(filterText);
          applyProductStudioFilters();
          e.target.value = '';
        }
      }
    });
  }
}

// Add filter tag
function addProductStudioFilterTag(filterText) {
  const tagsContainer = document.getElementById('productStudioFilterTags');
  if (!tagsContainer) return;
  
  // Check if filter already exists
  const existingTags = Array.from(tagsContainer.querySelectorAll('.product-studio-filter-tag'));
  if (existingTags.some(tag => tag.dataset.filterText.toLowerCase() === filterText.toLowerCase())) {
    return;
  }
  
  const tag = document.createElement('div');
  tag.className = 'product-studio-filter-tag';
  tag.dataset.filterText = filterText;
  tag.innerHTML = `
    <span class="product-studio-filter-tag-text" title="${filterText}">${filterText}</span>
    <span class="product-studio-filter-tag-remove">✕</span>
  `;
  
  // Add remove handler
  tag.querySelector('.product-studio-filter-tag-remove').addEventListener('click', function() {
    tag.remove();
    applyProductStudioFilters();
  });
  
  tagsContainer.appendChild(tag);
}

// Replace the entire applyProductStudioFilters function:
function applyProductStudioFilters() {
  const tags = document.querySelectorAll('#productStudioFilterTags .product-studio-filter-tag');
  const filterTexts = Array.from(tags).map(tag => tag.dataset.filterText);
  
  if (!window.globalProductsData) return;
  
  const { evaluatedProducts, processedMetrics, roasData, currentCompany } = window.globalProductsData;
  
  let filteredProducts = evaluatedProducts;
  if (filterTexts.length > 0) {
    filteredProducts = evaluatedProducts.filter(p => {
      const title = p.title.toLowerCase();
      return filterTexts.every(filterText => 
        title.includes(filterText.toLowerCase())
      );
    });
  }
  
  // Clear and re-render table with company filter
  const container = document.getElementById('globalProductsTableContainer');
  if (container) {
    container.innerHTML = '';
    renderGlobalProductsTable(container, filteredProducts, processedMetrics, roasData, currentCompany);
  }
  
  // Update averages
  updateGlobalAverages(filteredProducts);
}

// Replace the entire addGlobalSortingFunctionality function:
function addGlobalSortingFunctionality(table, products, processedMetrics, roasData = new Map(), companyFilter = null) {
  const headers = table.querySelectorAll('th.sortable');
  
  // Use global sort state instead of local variable
  if (!window.globalProductsSortState) {
    window.globalProductsSortState = { column: 'tscore', direction: 'desc' };
  }
  
  headers.forEach(header => {
    // Add visual indicator for current sort
    const sortKey = header.getAttribute('data-sort');
    if (window.globalProductsSortState.column === sortKey) {
      header.classList.add(window.globalProductsSortState.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
    }
    
    header.addEventListener('click', function() {
      const sortKey = this.getAttribute('data-sort');
      
      if (window.globalProductsSortState.column === sortKey) {
        // Toggle direction if same column
        window.globalProductsSortState.direction = window.globalProductsSortState.direction === 'asc' ? 'desc' : 'asc';
      } else {
        // New column - set default direction
        window.globalProductsSortState.column = sortKey;
        window.globalProductsSortState.direction = sortKey === 'position' ? 'asc' : 'desc';
      }
      
      // Remove all sort indicators
      headers.forEach(h => {
        h.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Add current sort indicator
      this.classList.add(window.globalProductsSortState.direction === 'asc' ? 'sorted-asc' : 'sorted-desc');
      
      // Sort products
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
          case 'roas':
            aVal = roasData.get(a.title) || 0;
            bVal = roasData.get(b.title) || 0;
            break;
          case 'tscore':
            aVal = a.finalScore || 0;
            bVal = b.finalScore || 0;
            break;
          case 'kos':
            aVal = a.kos || 0;
            bVal = b.kos || 0;
            break;
          case 'gos':
            aVal = a.gos || 0;
            bVal = b.gos || 0;
            break;
          case 'suggestions':
            aVal = a.suggestions?.length || 0;
            bVal = b.suggestions?.length || 0;
            break;
          case 'title':
            aVal = a.title.toLowerCase();
            bVal = b.title.toLowerCase();
            break;
          default:
            aVal = 0;
            bVal = 0;
        }
        
        if (window.globalProductsSortState.direction === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
      
      const container = table.closest('.product-studio-table-container');
      container.innerHTML = '';
      // Pass company filter when re-rendering
      renderGlobalProductsTable(container, sortedProducts, processedMetrics, roasData, companyFilter);
    });
  });
}

// Update averages for global products
function updateGlobalAverages(products) {
  let totalTScore = 0;
  let totalKOS = 0;
  let totalGOS = 0;
  let count = 0;
  
  products.forEach(product => {
    if (product.finalScore > 0) {
      totalTScore += product.finalScore;
      totalKOS += product.kos;
      totalGOS += product.gos;
      count++;
    }
  });
  
  const avgTScoreValue = count > 0 ? Math.round(totalTScore / count) : 0;
  const avgKOSValue = count > 0 ? (totalKOS / count) : 0;
  const avgGOSValue = count > 0 ? Math.round(totalGOS / count) : 0;
  
  setTimeout(() => {
    const avgTScoreEl = document.getElementById('globalAvgTScore');
    const avgKOSEl = document.getElementById('globalAvgKOS');
    const avgGOSEl = document.getElementById('globalAvgGOS');
    
    if (avgTScoreEl) {
      avgTScoreEl.textContent = count > 0 ? avgTScoreValue : '-';
      const container = document.getElementById('globalAvgTScoreContainer');
      if (container && count > 0) {
        container.className = 'product-studio-avg-item';
        if (avgTScoreValue > 70) container.classList.add('tscore-excellent');
        else if (avgTScoreValue >= 55) container.classList.add('tscore-good');
        else if (avgTScoreValue >= 40) container.classList.add('tscore-fair');
        else container.classList.add('tscore-poor');
      }
    }
    
    if (avgKOSEl) {
      avgKOSEl.textContent = count > 0 ? avgKOSValue.toFixed(1) : '-';
      const container = document.getElementById('globalAvgKOSContainer');
      if (container && count > 0) {
        container.className = 'product-studio-avg-item';
        if (avgKOSValue > 15) container.classList.add('kos-excellent');
        else if (avgKOSValue >= 10) container.classList.add('kos-good');
        else if (avgKOSValue > 5) container.classList.add('kos-fair');
        else container.classList.add('kos-poor');
      }
    }
    
    if (avgGOSEl) {
      avgGOSEl.textContent = count > 0 ? avgGOSValue : '-';
      const container = document.getElementById('globalAvgGOSContainer');
      if (container && count > 0) {
        container.className = 'product-studio-avg-item';
        if (avgGOSValue > 60) container.classList.add('gos-excellent');
        else if (avgGOSValue >= 40) container.classList.add('gos-good');
        else if (avgGOSValue >= 20) container.classList.add('gos-fair');
        else container.classList.add('gos-poor');
      }
    }
  }, 50);
}

// Make functions globally available
window.initializeProductStudio = initializeProductStudio;
window.showCompaniesPanel = showCompaniesPanel;
window.showProductsPanel = showProductsPanel;
window.showRankMapPanel = showRankMapPanel;
