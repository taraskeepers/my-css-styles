// google_ads_campaigns.js - Campaigns Section Implementation

// Global variables for campaigns section
window.selectedCampaign = null;
window.campaignsData = [];
window.campaignProducts = new Map();

// Initialize campaigns section
async function initializeCampaignsSection() {
  console.log('[initializeCampaignsSection] Starting campaigns initialization...');
  
  // Add campaigns-specific styles
  addCampaignsStyles();
  
  // Load and render campaigns
  await loadAndRenderCampaigns();
}

// Add campaigns-specific styles (REPLACE the entire addCampaignsStyles function)
function addCampaignsStyles() {
  if (!document.getElementById('campaigns-section-styles')) {
    const style = document.createElement('style');
    style.id = 'campaigns-section-styles';
    style.textContent = `
      /* Main campaigns container */
      .campaigns-main-container {
        display: flex;
        gap: 20px;
        height: calc(100vh - 200px);
        width: 100%;
        margin-top: 60px;
      }
      
      /* Left navigation panel */
      #campaignsNavPanel {
        width: 280px;
        min-width: 280px;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        transition: width 0.3s ease-in-out;
      }

      /* View switcher styles */
.campaigns-view-switcher {
  padding: 12px 15px;
  border-bottom: 1px solid #dee2e6;
  background: white;
  position: sticky;
  top: 0;
  z-index: 11;
}

.campaigns-view-tabs {
  display: flex;
  gap: 0;
  background: #f0f2f5;
  border-radius: 8px;
  padding: 3px;
}

.campaigns-view-tab {
  flex: 1;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.campaigns-view-tab:hover {
  background: rgba(0, 0, 0, 0.05);
}

.campaigns-view-tab.active {
  background: white;
  color: #007aff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Search terms panel - same style as products panel */
#campaignsSearchTermsPanel {
  flex: 1;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  display: none;
  flex-direction: column;
  overflow: hidden;
}

#campaignsSearchTermsPanel.active {
  display: flex;
}

#campaignsProductsPanel.hidden {
  display: none;
}

/* Search terms specific styles */
.campaigns-search-terms-header {
  padding: 15px 20px;
  border-bottom: 1px solid #dee2e6;
  background: linear-gradient(to bottom, #ffffff, #f9f9f9);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.campaigns-search-terms-table-container {
  flex: 1;
  overflow: auto;
  background: #f5f7fa;
}
      
      /* Campaign filter and list styles */
      .campaigns-filter-container {
        padding: 15px;
        border-bottom: 1px solid #dee2e6;
        background: linear-gradient(to bottom, #ffffff, #f9f9f9);
        position: sticky;
        top: 0;
        z-index: 10;
      }
      
      .campaigns-type-filter {
        display: flex;
        gap: 8px;
        justify-content: center;
      }
      
      .campaign-filter-btn {
        padding: 6px 16px;
        border: 1px solid #ddd;
        background: white;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        color: #666;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      
      .campaign-filter-btn.active {
        background-color: #007aff;
        color: white;
        border-color: #007aff;
        box-shadow: 0 2px 4px rgba(0, 122, 255, 0.2);
      }
      
      .campaigns-list-container {
        padding: 10px;
        overflow-y: auto;
        flex: 1;
      }
      
      .campaign-group-section {
        margin-bottom: 20px;
      }
      
      .campaign-group-header {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 10px;
        background: #f8f9fa;
        border-radius: 8px;
        margin-bottom: 10px;
      }
      
      .campaign-type-icon {
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .campaign-group-title {
        font-size: 13px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex: 1;
      }
      
      .campaign-group-count {
        background: #007aff;
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .campaign-nav-item {
        margin-bottom: 8px;
        cursor: pointer;
      }
      
      .campaign-card-details {
        background-color: white;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        display: flex;
        align-items: center;
        padding: 12px;
        transition: all 0.2s;
        gap: 12px;
        min-height: 70px;
      }
      
      .campaign-nav-item:hover .campaign-card-details {
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        transform: translateY(-1px);
      }
      
      .campaign-nav-item.selected .campaign-card-details {
        border: 2px solid #007aff;
        box-shadow: 0 2px 6px rgba(0,122,255,0.3);
      }
      
      .campaign-type-badge {
        width: 50px;
        height: 50px;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        font-size: 20px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      }
      
      .campaign-type-badge.pmax {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
      }
      
      .campaign-type-badge.shopping {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        color: white;
      }
      
      .campaign-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .campaign-name {
        font-size: 14px;
        font-weight: 600;
        color: #333;
        line-height: 1.3;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
      }
      
      .campaign-meta {
        display: flex;
        gap: 12px;
        font-size: 11px;
        color: #999;
      }
      
      .campaign-products-count {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      /* Right panel - Products container */
      #campaignsProductsPanel {
        flex: 1;
        background-color: white;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      
      /* Products panel header */
      .campaigns-products-header {
        padding: 15px 20px;
        border-bottom: 1px solid #dee2e6;
        background: linear-gradient(to bottom, #ffffff, #f9f9f9);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-shrink: 0;
      }
      
      .campaigns-products-title {
        font-size: 16px;
        font-weight: 600;
        color: #333;
        margin: 0;
      }
      
      .selected-campaign-info {
        font-size: 13px;
        color: #666;
        margin-top: 4px;
      }
      
      .column-selector-btn {
        padding: 6px 12px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 12px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        transition: all 0.2s;
        position: relative;
      }
      
      .column-selector-btn:hover {
        background: #f0f0f0;
        border-color: #007aff;
      }
      
      /* Column selector dropdown */
      .column-selector-dropdown {
        position: absolute;
        top: calc(100% + 5px);
        right: 0;
        width: 250px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1000;
        display: none;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .column-selector-dropdown.active {
        display: block;
      }
      
      .column-selector-header {
        padding: 10px 15px;
        border-bottom: 1px solid #eee;
        font-weight: 600;
        font-size: 13px;
        color: #333;
        background: #f8f9fa;
        border-radius: 8px 8px 0 0;
      }
      
      .column-selector-list {
        padding: 8px;
      }
      
      .column-selector-item {
        display: flex;
        align-items: center;
        padding: 8px 10px;
        border-radius: 6px;
        cursor: pointer;
        transition: background 0.2s;
      }
      
      .column-selector-item:hover {
        background: #f0f2f5;
      }
      
      .column-selector-checkbox {
        width: 16px;
        height: 16px;
        margin-right: 10px;
        cursor: pointer;
      }
      
      .column-selector-label {
        font-size: 13px;
        color: #495057;
        cursor: pointer;
        flex: 1;
      }
      
      /* TABLE STYLES */
      .campaigns-products-table-container {
        flex: 1;
        overflow: auto;
        background: #f5f7fa;
      }
      
      .camp-products-wrapper {
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      .camp-table-modern {
        width: 100%;
        background: white;
        border-collapse: collapse;
      }
      
      .camp-table-modern table {
        width: 100%;
        border-collapse: collapse;
        table-layout: fixed;
      }
      
      /* Table header */
      .camp-table-modern thead {
        position: sticky;
        top: 0;
        z-index: 10;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.04);
      }
      
      .camp-table-modern thead tr {
        border-bottom: 2px solid #e9ecef;
      }
      
      .camp-table-modern th {
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
      
      .camp-table-modern th.sortable {
        cursor: pointer;
        padding-right: 20px;
      }
      
      .camp-table-modern th.sortable:hover {
        background: rgba(0, 122, 255, 0.04);
        color: #495057;
      }
      
      .camp-table-modern th.center {
        text-align: center;
      }
      
      .camp-table-modern th.right {
        text-align: right;
      }
      
/* Column widths - POS, SHARE, ROAS, IMAGE, TITLE */
.camp-table-modern th:nth-child(1),
.camp-table-modern td:nth-child(1) { width: 60px; } /* Pos */

.camp-table-modern th:nth-child(2),
.camp-table-modern td:nth-child(2) { width: 90px; } /* Share */

.camp-table-modern th:nth-child(3),
.camp-table-modern td:nth-child(3) { width: 70px; } /* ROAS */

.camp-table-modern th:nth-child(4),
.camp-table-modern td:nth-child(4) { width: 80px; } /* Image */

.camp-table-modern th:nth-child(5),
.camp-table-modern td:nth-child(5) { width: 300px; } /* Product Title */
      
      /* All metric columns - max 90px */
      .camp-table-modern th.metric-col,
      .camp-table-modern td.metric-col { 
        width: 90px;
        max-width: 90px;
      }
      
      /* Sort icon */
      .camp-sort-icon {
        position: absolute;
        right: 4px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        color: #adb5bd;
      }
      
      .camp-table-modern th.sorted-asc .camp-sort-icon,
      .camp-table-modern th.sorted-desc .camp-sort-icon {
        color: #007aff;
      }
      
      /* Table body */
      .camp-table-modern tbody tr {
        border-bottom: 1px solid #f0f2f5;
        transition: background 0.15s ease;
        height: 70px;
      }
      
      .camp-table-modern tbody tr:hover {
        background: rgba(0, 122, 255, 0.02);
      }
      
      .camp-table-modern tbody tr.device-row {
        background: #fafbfc;
        display: none;
        height: 40px;
      }
      
      .camp-table-modern tbody tr.device-row.visible {
        display: table-row;
      }
      
      .camp-table-modern tbody tr.device-row:hover {
        background: #f5f7fa;
      }
      
      .camp-table-modern td {
        padding: 8px;
        font-size: 13px;
        color: #495057;
        vertical-align: middle;
        height: 70px;
      }
      
      .camp-table-modern tr.device-row td {
        height: 40px;
        padding: 6px 8px;
      }
      
      /* Expand arrow */
      .camp-expand-arrow {
        width: 20px;
        height: 20px;
        border-radius: 4px;
        background: #e9ecef;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 10px;
        color: #6c757d;
      }
      
      .camp-expand-arrow:hover {
        background: #dee2e6;
      }
      
      .camp-expand-arrow.expanded {
        transform: rotate(90deg);
        background: #007aff;
        color: white;
      }
      
      /* Position indicator */
      .camp-position-indicator {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 14px;
      }
      
      .camp-position-indicator.top {
        background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
        color: white;
      }
      
      .camp-position-indicator.mid {
        background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
        color: white;
      }
      
      .camp-position-indicator.low {
        background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
        color: white;
      }
      
      .camp-position-indicator.bottom {
        background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
        color: white;
      }
      
      /* Market share bar */
      .camp-share-bar {
        width: 60px;
        height: 32px;
        background: #e9ecef;
        border-radius: 16px;
        position: relative;
        overflow: hidden;
        display: inline-block;
      }
      
      .camp-share-fill {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        background: linear-gradient(90deg, #60a5fa 0%, #3b82f6 100%);
        transition: width 0.3s ease;
      }
      
      .camp-share-text {
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
      
      /* Product image */
      .camp-product-img {
        width: 48px;
        height: 48px;
        border-radius: 8px;
        object-fit: cover;
        border: 1px solid #e9ecef;
        background: white;
        display: block;
        margin: 0 auto;
      }
      
      /* Product title */
      .camp-product-title {
        font-size: 13px;
        font-weight: 500;
        color: #212529;
        line-height: 1.4;
        word-break: break-word;
        overflow-wrap: break-word;
        max-height: 56px;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
      }
      
      /* Device tag */
      .camp-device-tag {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 3px 10px;
        border-radius: 12px;
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      
      .camp-device-tag.mobile {
        background: rgba(134, 239, 172, 0.2);
        color: #15803d;
      }
      
      .camp-device-tag.tablet {
        background: rgba(147, 197, 253, 0.2);
        color: #1e40af;
      }
      
      .camp-device-tag.desktop {
        background: rgba(253, 230, 138, 0.2);
        color: #a16207;
      }
      
      /* Metrics styling */
      .camp-metric {
        text-align: right;
        font-variant-numeric: tabular-nums;
        font-size: 12px;
        font-weight: 500;
        color: #495057;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .camp-metric.large {
        font-size: 13px;
        font-weight: 600;
        color: #212529;
      }
      
      .camp-metric.positive {
        color: #22c55e;
      }
      
      .camp-metric.negative {
        color: #ef4444;
      }
      
      .camp-metric.highlight {
        display: inline-block;
        padding: 2px 6px;
        background: rgba(0, 122, 255, 0.08);
        border-radius: 4px;
        color: #007aff;
        font-weight: 600;
      }
      
      /* Empty state */
      .campaigns-empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 400px;
        color: #999;
        text-align: center;
        padding: 40px;
      }
      
      .campaigns-empty-icon {
        font-size: 48px;
        margin-bottom: 16px;
        opacity: 0.5;
      }
      
      .campaigns-empty-title {
        font-size: 18px;
        font-weight: 600;
        margin-bottom: 8px;
        color: #666;
      }
      
      .campaigns-empty-text {
        font-size: 14px;
        line-height: 1.5;
        color: #999;
      }
      
      /* Loading spinner */
      .campaigns-loading {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px;
        height: 400px;
      }
      
      .campaigns-spinner {
        border: 3px solid rgba(0, 0, 0, 0.1);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border-left-color: #007aff;
        animation: spin 1s ease infinite;
      }
      
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
/* Image zoom on hover */
.camp-product-img-container {
  position: relative;
  display: inline-block;
}

.camp-product-img-zoom {
  position: fixed;
  width: 300px;
  height: 300px;
  border-radius: 12px;
  object-fit: contain;
  background: white;
  box-shadow: 0 8px 32px rgba(0,0,0,0.25);
  border: 2px solid #007aff;
  z-index: 10000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease-in-out;
}

.camp-product-img-container:hover .camp-product-img-zoom {
  opacity: 1;
}

/* Summary row styling */
.camp-summary-row {
  background: linear-gradient(to bottom, #f8f9fa, #e9ecef);
  font-weight: 600;
  border-bottom: 2px solid #007aff;
}

.camp-summary-row td {
  padding: 12px 8px;
  font-size: 13px;
  color: #212529;
  border-bottom: 2px solid #007aff;
}

/* Improved metric bars */
.camp-metric-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 4px;
}

.camp-metric-value {
  font-size: 14px;
  font-weight: 600;
  color: #212529;
  text-align: center;
  width: 100%;
}

.camp-metric-bar-container {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
}

.camp-metric-bar {
  flex: 1;
  height: 8px;
  background: #e9ecef;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.camp-metric-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);
  transition: width 0.3s ease;
  border-radius: 4px;
}

.camp-metric-percent {
  font-size: 10px;
  color: #6c757d;
  font-weight: 500;
  min-width: 32px;
  text-align: right;
}

/* Alternating column backgrounds */
.camp-table-modern td:nth-child(6),  /* IMPR - 1st metric column */
.camp-table-modern th:nth-child(6) {
  background-color: #f8f9fa !important;
}

.camp-table-modern td:nth-child(8),  /* CTR - 3rd metric column */
.camp-table-modern th:nth-child(8) {
  background-color: #f8f9fa !important;
}

.camp-table-modern td:nth-child(10), /* COST - 5th metric column */
.camp-table-modern th:nth-child(10) {
  background-color: #f8f9fa !important;
}

.camp-table-modern td:nth-child(12), /* CPA - 7th metric column */
.camp-table-modern th:nth-child(12) {
  background-color: #f8f9fa !important;
}

.camp-table-modern td:nth-child(14), /* CVR - 9th metric column */
.camp-table-modern th:nth-child(14) {
  background-color: #f8f9fa !important;
}

/* Keep summary row background consistent */
.camp-summary-row td {
  background: linear-gradient(to bottom, #f0f2f5, #e9ecef) !important;
}

/* Toggle switch styles */
.toggle-switch {
  position: relative;
  width: 40px;
  height: 20px;
  margin-right: 10px;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .3s;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #007aff;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

/* ROAS light red for values < 1 */
.camp-roas-badge.poor {
  background: linear-gradient(135deg, #fca5a5 0%, #f87171 100%);
}

/* ROAS badge styling */
.camp-roas-badge {
  width: 60px;
  height: 36px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 13px;
  color: white;
}

.camp-roas-badge.excellent {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.camp-roas-badge.good {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.camp-roas-badge.fair {
  background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
}

/* Clickable row styling */
.camp-table-modern tbody tr.main-row {
  cursor: pointer;
}

.camp-table-modern tbody tr.main-row:hover {
  background: rgba(0, 122, 255, 0.04);
}
/* Special product status styling */
.camp-table-modern tbody tr.revenue-stars {
  background: linear-gradient(to right, rgba(255, 215, 0, 0.08), rgba(255, 215, 0, 0.02));
  border-left: 4px solid #FFD700;
}

.camp-table-modern tbody tr.revenue-stars:hover {
  background: linear-gradient(to right, rgba(255, 215, 0, 0.15), rgba(255, 215, 0, 0.05));
}

.camp-table-modern tbody tr.best-sellers {
  background: linear-gradient(to right, rgba(147, 51, 234, 0.06), rgba(147, 51, 234, 0.02));
  border-left: 4px solid #9333ea;
}

.camp-table-modern tbody tr.best-sellers:hover {
  background: linear-gradient(to right, rgba(147, 51, 234, 0.12), rgba(147, 51, 234, 0.04));
}

.camp-table-modern tbody tr.volume-leaders {
  background: linear-gradient(to right, rgba(34, 197, 94, 0.06), rgba(34, 197, 94, 0.02));
  border-left: 4px solid #22c55e;
}

.camp-table-modern tbody tr.volume-leaders:hover {
  background: linear-gradient(to right, rgba(34, 197, 94, 0.12), rgba(34, 197, 94, 0.04));
}

/* Product status badge */
.product-status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-left: 8px;
  display: inline-flex;
  align-items: center;
}

.product-status-badge.revenue-stars {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #6B4423;
}

.product-status-badge.best-sellers {
  background: linear-gradient(135deg, #9333ea, #a855f7);
  color: white;
}

.product-status-badge.volume-leaders {
  background: linear-gradient(135deg, #22c55e, #16a34a);
  color: white;
}
    `;
    document.head.appendChild(style);
  }
}

// Load and render campaigns
async function loadAndRenderCampaigns() {
  console.log('[loadAndRenderCampaigns] Loading campaigns data...');
  
  try {
    // Get the table prefix for the current project
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    console.log('[loadAndRenderCampaigns] Loading from table:', tableName);
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadAndRenderCampaigns] No bucket data found');
      renderEmptyCampaignsState();
      return;
    }
    
    // Extract unique campaigns from the data
    const campaignsMap = new Map();
    
    result.data.forEach(row => {
      const channelType = row['Channel Type'];
      const campaignName = row['Campaign Name'];
      const productTitle = row['Product Title'];
      
      // Skip rows without proper campaign data
      if (!channelType || !campaignName || channelType === 'All' || campaignName === 'All') {
        return;
      }
      
      const campaignKey = `${channelType}::${campaignName}`;
      
      if (!campaignsMap.has(campaignKey)) {
        campaignsMap.set(campaignKey, {
          channelType: channelType,
          campaignName: campaignName,
          products: new Set()
        });
      }
      
      // Add product to campaign
      if (productTitle) {
        campaignsMap.get(campaignKey).products.add(productTitle);
      }
    });
    
    // Convert map to array and sort
    window.campaignsData = Array.from(campaignsMap.values()).sort((a, b) => {
      // First sort by channel type
      if (a.channelType !== b.channelType) {
        return a.channelType.localeCompare(b.channelType);
      }
      // Then by campaign name
      return a.campaignName.localeCompare(b.campaignName);
    });
    
    console.log('[loadAndRenderCampaigns] Found campaigns:', window.campaignsData.length);
    
    // Store products mapping for quick access
    window.campaignProducts.clear();
    window.campaignsData.forEach(campaign => {
      const key = `${campaign.channelType}::${campaign.campaignName}`;
      window.campaignProducts.set(key, Array.from(campaign.products));
    });
    
    // Render campaigns in the navigation panel
    renderCampaignsNavPanel();
    
  } catch (error) {
    console.error('[loadAndRenderCampaigns] Error loading campaigns:', error);
    renderEmptyCampaignsState();
  }
}

// Render campaigns navigation panel
async function renderCampaignsNavPanel() {
  const container = document.getElementById('campaigns_overview_container');
  if (!container) return;
  
  // Clear existing content
  container.innerHTML = '';
  
  // Create main container
  const mainContainer = document.createElement('div');
  mainContainer.className = 'campaigns-main-container';
  
  // Create left navigation panel
  const navPanel = document.createElement('div');
  navPanel.id = 'campaignsNavPanel';
  
// Add view switcher
const viewSwitcher = document.createElement('div');
viewSwitcher.className = 'campaigns-view-switcher';
viewSwitcher.innerHTML = `
  <div class="campaigns-view-tabs">
    <button class="campaigns-view-tab active" data-view="products">
      <span>📦</span> Products
    </button>
    <button class="campaigns-view-tab" data-view="search-terms">
      <span>🔍</span> Search Terms
    </button>
  </div>
`;
navPanel.appendChild(viewSwitcher);

// Add filter container
const filterContainer = document.createElement('div');
filterContainer.className = 'campaigns-filter-container';
  filterContainer.innerHTML = `
    <div class="campaigns-type-filter">
      <button class="campaign-filter-btn active" data-filter="all">
        <span>📊</span> All
      </button>
      <button class="campaign-filter-btn" data-filter="PERFORMANCE_MAX">
        <span>🚀</span> PMax
      </button>
      <button class="campaign-filter-btn" data-filter="SHOPPING">
        <span>🛍️</span> Shopping
      </button>
    </div>
  `;
  navPanel.appendChild(filterContainer);
  
// Add campaigns list container
  const listContainer = document.createElement('div');
  listContainer.className = 'campaigns-list-container';
  navPanel.appendChild(listContainer);
  
  // Load ROAS for all campaigns first
  const campaignsWithROAS = await Promise.all(window.campaignsData.map(async (campaign) => {
    const roas = await calculateCampaignROAS(campaign.channelType, campaign.campaignName);
    return { ...campaign, roas };
  }));

  // Update global data with ROAS
  window.campaignsData = campaignsWithROAS;

  // Group campaigns by type with ROAS
  const pmaxCampaigns = campaignsWithROAS.filter(c => c.channelType === 'PERFORMANCE_MAX');
  const shoppingCampaigns = campaignsWithROAS.filter(c => c.channelType === 'SHOPPING');
  
  // Render campaign groups
  renderCampaignGroup(listContainer, 'PERFORMANCE_MAX', pmaxCampaigns, '🚀');
  renderCampaignGroup(listContainer, 'SHOPPING', shoppingCampaigns, '🛍️');
  
  // Add click handlers for filters
  filterContainer.querySelectorAll('.campaign-filter-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      // Update active state
      filterContainer.querySelectorAll('.campaign-filter-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      
      // Filter campaigns
      const filterType = this.getAttribute('data-filter');
      filterCampaigns(filterType);
    });
  });

  // Add view switcher event handlers <--- ADD THIS ENTIRE BLOCK
  viewSwitcher.querySelectorAll('.campaigns-view-tab').forEach(tab => {
    tab.addEventListener('click', function() {
      // Update active state
      viewSwitcher.querySelectorAll('.campaigns-view-tab').forEach(t => t.classList.remove('active'));
      this.classList.add('active');
      
      const view = this.getAttribute('data-view');
      
      if (view === 'products') {
        productsPanel.style.display = 'flex';
        searchTermsPanel.style.display = 'none';
      } else if (view === 'search-terms') {
        productsPanel.style.display = 'none';
        searchTermsPanel.style.display = 'flex';
        
        // Load search terms if campaign is selected
        if (window.selectedCampaign) {
          loadCampaignSearchTerms(
            window.selectedCampaign.channelType,
            window.selectedCampaign.campaignName
          );
        }
      }
    });
  });
  
// Create container for both panels
const panelsContainer = document.createElement('div');
panelsContainer.style.cssText = 'flex: 1; display: flex; position: relative;';

// Create products panel
const productsPanel = document.createElement('div');
productsPanel.id = 'campaignsProductsPanel';
productsPanel.style.cssText = 'flex: 1; display: flex;'; // Make it visible by default

// Calculate date range (30 days back from today)
const endDate = new Date();
const startDate = new Date();
startDate.setDate(startDate.getDate() - 30);
const dateRangeText = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

productsPanel.innerHTML = `
  <div class="campaigns-products-header">
    <div>
      <h3 class="campaigns-products-title">Campaign Products</h3>
      <div class="selected-campaign-info">Select a campaign to view its products</div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="padding: 6px 12px; background: #f0f2f5; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;">
        <span>📅</span>
        <span>${dateRangeText}</span>
      </div>
      <button class="column-selector-btn" onclick="toggleColumnSelector()">
        <span>⚙️</span> Columns
      </button>
    </div>
  </div>
  <div class="campaigns-products-table-container">
    <div class="campaigns-empty-state">
      <div class="campaigns-empty-icon">📦</div>
      <div class="campaigns-empty-title">No Campaign Selected</div>
      <div class="campaigns-empty-text">Select a campaign from the left panel to view its products</div>
    </div>
  </div>
`;

// Create search terms panel <--- ADD THIS AND EVERYTHING BELOW
const searchTermsPanel = document.createElement('div');
searchTermsPanel.id = 'campaignsSearchTermsPanel';
searchTermsPanel.innerHTML = `
  <div class="campaigns-search-terms-header">
    <div>
      <h3 class="campaigns-products-title">Campaign Search Terms</h3>
      <div class="selected-campaign-info">Select a campaign to view its search terms</div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <div style="padding: 6px 12px; background: #f0f2f5; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;">
        <span>📅</span>
        <span>${dateRangeText}</span>
      </div>
    </div>
  </div>
  <div class="campaigns-search-terms-table-container">
    <div class="campaigns-empty-state">
      <div class="campaigns-empty-icon">🔍</div>
      <div class="campaigns-empty-title">No Campaign Selected</div>
      <div class="campaigns-empty-text">Select a campaign from the left panel to view its search terms</div>
    </div>
  </div>
`;

// Add both panels to container <--- ALSO ADD THIS
panelsContainer.appendChild(productsPanel);
panelsContainer.appendChild(searchTermsPanel);
  
// Add panels to main container
mainContainer.appendChild(navPanel);
mainContainer.appendChild(panelsContainer);
  
  // Add main container to page
  container.appendChild(mainContainer);
  
  // Add click handlers for campaign items
  addCampaignClickHandlers();
}

// Render a campaign group
function renderCampaignGroup(container, type, campaigns, icon) {
  if (campaigns.length === 0) return;
  
  const groupSection = document.createElement('div');
  groupSection.className = 'campaign-group-section';
  groupSection.setAttribute('data-channel-type', type);
  
  // Add group header
  const groupHeader = document.createElement('div');
  groupHeader.className = 'campaign-group-header';
  groupHeader.innerHTML = `
    <div class="campaign-type-icon">${icon}</div>
    <div class="campaign-group-title">${type.replace('_', ' ')}</div>
    <div class="campaign-group-count">${campaigns.length}</div>
  `;
  groupSection.appendChild(groupHeader);
  
  // Add campaign items
  campaigns.forEach(campaign => {
    const campaignItem = createCampaignItem(campaign, icon);
    groupSection.appendChild(campaignItem);
  });
  
  container.appendChild(groupSection);
}

// Toggle column selector dropdown
function toggleColumnSelector() {
  const btn = document.querySelector('.column-selector-btn');
  let dropdown = document.querySelector('.column-selector-dropdown');
  
  if (!dropdown) {
    dropdown = createColumnSelectorDropdown();
    btn.appendChild(dropdown);
  }
  
  dropdown.classList.toggle('active');
  
  // Close on click outside
  if (dropdown.classList.contains('active')) {
    setTimeout(() => {
      document.addEventListener('click', function closeDropdown(e) {
        if (!btn.contains(e.target)) {
          dropdown.classList.remove('active');
          document.removeEventListener('click', closeDropdown);
        }
      });
    }, 100);
  }
}

// Create column selector dropdown
function createColumnSelectorDropdown() {
  const dropdown = document.createElement('div');
  dropdown.className = 'column-selector-dropdown';
  
  // Define all available columns (excluding ROAS which is fixed)
  const columns = [
    { id: 'impressions', label: 'Impressions', visible: true },
    { id: 'clicks', label: 'Clicks', visible: true },
    { id: 'ctr', label: 'CTR %', visible: true },
    { id: 'avgCpc', label: 'Avg CPC', visible: true },
    { id: 'cost', label: 'Cost', visible: true },
    { id: 'conversions', label: 'Conv', visible: true },
    { id: 'cpa', label: 'CPA', visible: true },
    { id: 'convValue', label: 'Revenue', visible: true },
    { id: 'cvr', label: 'CVR %', visible: true },
    { id: 'aov', label: 'AOV', visible: false },
    { id: 'cpm', label: 'CPM', visible: false },
    { id: 'cartRate', label: 'Cart Rate', visible: false },
    { id: 'checkoutRate', label: 'Checkout Rate', visible: false },
    { id: 'purchaseRate', label: 'Purchase Rate', visible: false }
  ];
  
  // Store columns config globally
  window.campaignTableColumns = columns;
  
  dropdown.innerHTML = `
    <div class="column-selector-header">Select Columns</div>
    <div class="column-selector-list">
      ${columns.map(col => `
        <div class="column-selector-item" data-column="${col.id}">
          <label class="toggle-switch">
            <input type="checkbox" ${col.visible ? 'checked' : ''} data-column="${col.id}">
            <span class="toggle-slider"></span>
          </label>
          <label class="column-selector-label">${col.label}</label>
        </div>
      `).join('')}
    </div>
  `;
  
  // Add event listeners
  dropdown.querySelectorAll('.column-selector-item').forEach(item => {
    const toggle = item.querySelector('input[type="checkbox"]');
    
    toggle.addEventListener('change', function() {
      // Update columns config
      const columnId = this.dataset.column;
      const column = window.campaignTableColumns.find(c => c.id === columnId);
      if (column) {
        column.visible = this.checked;
      }
      
      // Refresh table if campaign is selected
      if (window.selectedCampaign) {
        const campaignKey = window.selectedCampaign.key;
        const channelType = window.selectedCampaign.channelType;
        const campaignName = window.selectedCampaign.campaignName;
        loadCampaignProducts(campaignKey, channelType, campaignName);
      }
    });
  });
  
  return dropdown;
}

// Make toggleColumnSelector globally available
window.toggleColumnSelector = toggleColumnSelector;

// Create a campaign item
function createCampaignItem(campaign, icon) {
  const item = document.createElement('div');
  item.className = 'campaign-nav-item';
  item.setAttribute('data-campaign-key', `${campaign.channelType}::${campaign.campaignName}`);
  
const badgeClass = campaign.channelType === 'PERFORMANCE_MAX' ? 'pmax' : 'shopping';
const roas = campaign.roas || 0;

// Determine ROAS badge color
let roasColorClass = '';
let roasBackground = '';
if (roas >= 4) {
  roasBackground = 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)';
} else if (roas >= 2) {
  roasBackground = 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)';
} else if (roas >= 1) {
  roasBackground = 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)';
} else {
  roasBackground = 'linear-gradient(135deg, #fca5a5 0%, #f87171 100%)';
}

item.innerHTML = `
  <div class="campaign-card-details">
    <div class="campaign-type-badge ${badgeClass}" style="background: ${roasBackground}; font-size: 14px; font-weight: 700; line-height: 1;">
      ${roas > 0 ? roas.toFixed(1) + 'x' : '0x'}
    </div>
      <div class="campaign-info">
        <div class="campaign-name">${campaign.campaignName}</div>
        <div class="campaign-meta">
          <div class="campaign-products-count">
            <span>📦</span>
            <span>${campaign.products.size} products</span>
          </div>
        </div>
      </div>
    </div>
  `;
  
  return item;
}

// Filter campaigns by type
function filterCampaigns(filterType) {
  const groups = document.querySelectorAll('.campaign-group-section');
  
  groups.forEach(group => {
    const channelType = group.getAttribute('data-channel-type');
    
    if (filterType === 'all') {
      group.style.display = 'block';
    } else if (channelType === filterType) {
      group.style.display = 'block';
    } else {
      group.style.display = 'none';
    }
  });
}

// Add click handlers for campaign items
function addCampaignClickHandlers() {
  document.querySelectorAll('.campaign-nav-item').forEach(item => {
    item.addEventListener('click', async function() {
      // Update selection state
      document.querySelectorAll('.campaign-nav-item').forEach(i => i.classList.remove('selected'));
      this.classList.add('selected');
      
      // Get campaign data
      const campaignKey = this.getAttribute('data-campaign-key');
      const [channelType, ...campaignNameParts] = campaignKey.split('::');
      const campaignName = campaignNameParts.join('::'); // Handle campaign names with ::
      
      // Update selected campaign
      window.selectedCampaign = {
        channelType: channelType,
        campaignName: campaignName,
        key: campaignKey
      };
      
      // Update selected campaign
      window.selectedCampaign = {
        channelType: channelType,
        campaignName: campaignName,
        key: campaignKey
      };
      
      // Check current view and load appropriate data <--- ADD THIS
      const currentView = document.querySelector('.campaigns-view-tab.active')?.getAttribute('data-view');
      if (currentView === 'search-terms') {
        await loadCampaignSearchTerms(channelType, campaignName);
      } else {
        await loadCampaignProducts(campaignKey, channelType, campaignName);
      }
    });
  });
}

// Helper function to parse and average trend values
function calculateAverageTrend(trends) {
  if (!trends || trends.length === 0) return null;
  
  const validTrends = [];
  trends.forEach(trend => {
    if (trend && trend !== 'N/A') {
      // Parse trend like "⬇ +6.13" or "⬆ -3.5"
      const match = trend.match(/([⬆⬇])\s*([+-]?\d+\.?\d*)/);
      if (match) {
        const arrow = match[1];
        const value = parseFloat(match[2]);
        validTrends.push({ arrow, value });
      }
    }
  });
  
  if (validTrends.length === 0) return null;
  
  // Calculate average change
  const avgValue = validTrends.reduce((sum, t) => sum + Math.abs(t.value), 0) / validTrends.length;
  
  // Determine overall direction (majority wins)
  const upCount = validTrends.filter(t => t.arrow === '⬆').length;
  const downCount = validTrends.filter(t => t.arrow === '⬇').length;
  const arrow = upCount >= downCount ? '⬆' : '⬇';
  
  // Format the trend
  const formattedValue = avgValue.toFixed(2);
  const isPositive = arrow === '⬆';
  
  return {
    text: `${arrow} ${formattedValue}`,
    color: isPositive ? '#22c55e' : '#ef4444',
    isPositive
  };
}

// Load and process POS and SHARE data from processed table
async function loadProcessedProductData(productTitles) {
  console.log('[loadProcessedProductData] Loading processed data for products:', productTitles.length);
  
  try {
    // Get the processed table name
    const tablePrefix = getProjectTablePrefix();
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
      console.warn('[loadProcessedProductData] No processed data found');
      return new Map();
    }
    
    // Process data: aggregate by product title and device
    const productMetrics = new Map();
    
result.data.forEach(row => {
  // Filter by company source
  if (!row.source || row.source.toLowerCase() !== (window.myCompany || "").toLowerCase()) {
    return;
  }
  
  const title = row.title;
  const device = row.device || 'unknown';
  const position = parseFloat(row.avg_week_position);
  const visibility = parseFloat(row.avg_visibility);
  const weekTrend = row.week_trend || null;
  
  // Skip if title doesn't match any of our products
  if (!productTitles.includes(title)) {
    return;
  }
      
if (!productMetrics.has(title)) {
  productMetrics.set(title, {
    allDevices: { positions: [], visibilities: [], trends: [] },
    byDevice: new Map()
  });
}

const metrics = productMetrics.get(title);

// Add to all devices aggregation
if (!isNaN(position) && position > 0) {
  metrics.allDevices.positions.push(position);
}
if (!isNaN(visibility)) {
  metrics.allDevices.visibilities.push(visibility);
}
if (weekTrend && weekTrend !== 'N/A') {
  metrics.allDevices.trends.push(weekTrend);
}
      
// Add to device-specific aggregation
const deviceKey = device.toLowerCase();
if (!metrics.byDevice.has(deviceKey)) {
  metrics.byDevice.set(deviceKey, { positions: [], visibilities: [], trends: [] });
}

const deviceMetrics = metrics.byDevice.get(deviceKey);
if (!isNaN(position) && position > 0) {
  deviceMetrics.positions.push(position);
}
if (!isNaN(visibility)) {
  deviceMetrics.visibilities.push(visibility);
}
if (weekTrend && weekTrend !== 'N/A') {
  deviceMetrics.trends.push(weekTrend);
}
    });
    
    // Calculate averages
    const processedMetrics = new Map();
    
    for (const [title, metrics] of productMetrics) {
      const processed = {
        allDevices: {
          avgPosition: null,
          avgVisibility: null
        },
        byDevice: new Map()
      };
      
// Calculate all devices average
if (metrics.allDevices.positions.length > 0) {
  const avgPos = metrics.allDevices.positions.reduce((a, b) => a + b, 0) / metrics.allDevices.positions.length;
  processed.allDevices.avgPosition = Math.round(avgPos); // Round to 0 decimals
}

if (metrics.allDevices.visibilities.length > 0) {
  const avgVis = metrics.allDevices.visibilities.reduce((a, b) => a + b, 0) / metrics.allDevices.visibilities.length;
  processed.allDevices.avgVisibility = avgVis * 100; // Convert to percentage
}

// Calculate average trend
processed.allDevices.trend = calculateAverageTrend(metrics.allDevices.trends);
      
// Calculate device-specific averages
for (const [device, deviceMetrics] of metrics.byDevice) {
  const deviceProcessed = {
    avgPosition: null,
    avgVisibility: null,
    trend: null
  };
  
  if (deviceMetrics.positions.length > 0) {
    const avgPos = deviceMetrics.positions.reduce((a, b) => a + b, 0) / deviceMetrics.positions.length;
    deviceProcessed.avgPosition = Math.round(avgPos); // Round to 0 decimals
  }
  
  if (deviceMetrics.visibilities.length > 0) {
    const avgVis = deviceMetrics.visibilities.reduce((a, b) => a + b, 0) / deviceMetrics.visibilities.length;
    deviceProcessed.avgVisibility = avgVis * 100;
  }
  
// Calculate average trend for device
deviceProcessed.trend = calculateAverageTrend(deviceMetrics.trends);
  
  processed.byDevice.set(device, deviceProcessed);
}
      
      processedMetrics.set(title, processed);
    }
    
    console.log('[loadProcessedProductData] Processed metrics for products:', processedMetrics.size);
    return processedMetrics;
    
  } catch (error) {
    console.error('[loadProcessedProductData] Error loading processed data:', error);
    return new Map();
  }
}

// Load product seller status from 90d bucket table
async function loadProductSellerStatus(productTitles) {
  console.log('[loadProductSellerStatus] Loading seller status for products:', productTitles.length);
  
  try {
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_90d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadProductSellerStatus] No 90d bucket data found');
      return new Map();
    }
    
    // Process data: find seller status for each product
    const sellerStatusMap = new Map();
    
    result.data.forEach(row => {
      const title = row['Product Title'];
      const campaignName = row['Campaign Name'];
      const device = row['Device'];
      const sellerStatus = row['SELLERS'];
      
      // Check if this matches our criteria
      if (productTitles.includes(title) && 
          campaignName === 'All' && 
          device === 'All' && 
          sellerStatus) {
        sellerStatusMap.set(title, sellerStatus);
        console.log(`[loadProductSellerStatus] Found status for ${title}: ${sellerStatus}`);
      }
    });
    
    return sellerStatusMap;
    
  } catch (error) {
    console.error('[loadProductSellerStatus] Error loading seller status:', error);
    return new Map();
  }
}

// Calculate campaign ROAS from bucket data
async function calculateCampaignROAS(channelType, campaignName) {
  try {
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      return 0;
    }
    
    // Calculate total cost and revenue for this campaign
    let totalCost = 0;
    let totalRevenue = 0;
    
    result.data.forEach(row => {
      if (row['Campaign Name'] === campaignName && 
          row['Channel Type'] === channelType) {
        totalCost += parseFloat(row['Cost']) || 0;
        totalRevenue += parseFloat(row['ConvValue']) || 0;
      }
    });
    
    return totalCost > 0 ? (totalRevenue / totalCost) : 0;
    
  } catch (error) {
    console.error('[calculateCampaignROAS] Error:', error);
    return 0;
  }
}

// Load products for selected campaign
async function loadCampaignProducts(campaignKey, channelType, campaignName) {
  console.log('[loadCampaignProducts] Loading products for campaign:', campaignName);
  
  const productsPanel = document.getElementById('campaignsProductsPanel');
  const headerInfo = document.querySelector('.selected-campaign-info');
  
  if (!productsPanel) return;
  
  // Show loading state
  const tableContainer = productsPanel.querySelector('.campaigns-products-table-container') || 
                         document.createElement('div');
  tableContainer.className = 'campaigns-products-table-container';
  tableContainer.innerHTML = '<div class="campaigns-loading"><div class="campaigns-spinner"></div></div>';
  
  if (!productsPanel.querySelector('.campaigns-products-table-container')) {
    productsPanel.appendChild(tableContainer);
  }
  
  headerInfo.textContent = `Loading products for ${campaignName}...`;
  
  try {
    // Get product titles for this campaign from campaign mapping
    const productTitles = window.campaignProducts.get(campaignKey) || [];
    
    console.log('[loadCampaignProducts] Found products:', productTitles.length);
    
    if (productTitles.length === 0) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">📦</div>
          <div class="campaigns-empty-title">No Products Found</div>
          <div class="campaigns-empty-text">This campaign doesn't have any products</div>
        </div>
      `;
      headerInfo.textContent = `${campaignName} - No products`;
      return;
    }
    
    // Get bucket data for these products
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Get data from IndexedDB
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const result = await new Promise((resolve, reject) => {
      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    });
    
    db.close();
    
    if (!result || !result.data) {
      console.warn('[loadCampaignProducts] No bucket data found');
      return;
    }
    
    // Filter data for this campaign and organize by product and device
    const productsData = new Map();
    
    result.data.forEach(row => {
      if (row['Campaign Name'] === campaignName && 
          row['Channel Type'] === channelType &&
          productTitles.includes(row['Product Title'])) {
        
        const productTitle = row['Product Title'];
        const device = row['Device'] || 'Unknown';
        
        if (!productsData.has(productTitle)) {
          productsData.set(productTitle, {
            title: productTitle,
            devices: new Map(),
            aggregated: {}
          });
        }
        
        productsData.get(productTitle).devices.set(device, row);
      }
    });
    
    // Match with company products for additional data
    const matchedProducts = new Map();
    if (window.allRows && Array.isArray(window.allRows)) {
      window.allRows.forEach(product => {
        if (product.source && product.source.toLowerCase() === (window.myCompany || "").toLowerCase()) {
          const productKey = product.title || '';
          if (productsData.has(productKey)) {
            matchedProducts.set(productKey, product);
          }
        }
      });
    }
    
    console.log('[loadCampaignProducts] Matched products:', matchedProducts.size);
    
// Load processed data for POS and SHARE
const processedMetrics = await loadProcessedProductData(productTitles);

// Load seller status for products
const sellerStatusMap = await loadProductSellerStatus(productTitles);

// Calculate aggregated metrics for each product
const tableData = [];

for (const [productTitle, productData] of productsData) {
  const devices = Array.from(productData.devices.values());
  const matchedProduct = matchedProducts.get(productTitle);
  
  // Get processed metrics for this product
  const productProcessedMetrics = processedMetrics.get(productTitle);
  
  // Aggregate metrics across all devices
  const aggregated = {
    title: productTitle,
    image: matchedProduct?.thumbnail || '',
// Use processed data for POS and SHARE
adPosition: productProcessedMetrics?.allDevices?.avgPosition || null,
marketShare: productProcessedMetrics?.allDevices?.avgVisibility || null,
trend: productProcessedMetrics?.allDevices?.trend || null,
    devices: productData.devices,
    // Store device-specific metrics
    deviceMetrics: productProcessedMetrics?.byDevice || new Map(),
    // Aggregate numeric metrics
    impressions: devices.reduce((sum, d) => sum + (parseFloat(d.Impressions) || 0), 0),
    clicks: devices.reduce((sum, d) => sum + (parseFloat(d.Clicks) || 0), 0),
    cost: devices.reduce((sum, d) => sum + (parseFloat(d.Cost) || 0), 0),
    conversions: devices.reduce((sum, d) => sum + (parseFloat(d.Conversions) || 0), 0),
    convValue: devices.reduce((sum, d) => sum + (parseFloat(d.ConvValue) || 0), 0),
    cartCount: devices.reduce((sum, d) => sum + ((parseFloat(d['Cart Rate']) || 0) * (parseFloat(d.Clicks) || 0) / 100), 0),
    checkoutCount: devices.reduce((sum, d) => sum + ((parseFloat(d['Checkout Rate']) || 0) * (parseFloat(d.Clicks) || 0) / 100), 0),
};
  
  // Add seller status to aggregated data
  aggregated.sellerStatus = sellerStatusMap.get(productTitle) || 'Standard';
  
  // Calculate derived metrics
  aggregated.ctr = aggregated.impressions > 0 ? (aggregated.clicks / aggregated.impressions * 100) : 0;
  aggregated.avgCpc = aggregated.clicks > 0 ? (aggregated.cost / aggregated.clicks) : 0;
  aggregated.cpa = aggregated.conversions > 0 ? (aggregated.cost / aggregated.conversions) : 0;
  aggregated.cvr = aggregated.clicks > 0 ? (aggregated.conversions / aggregated.clicks * 100) : 0;
  aggregated.aov = aggregated.conversions > 0 ? (aggregated.convValue / aggregated.conversions) : 0;
  aggregated.cpm = aggregated.impressions > 0 ? (aggregated.cost / aggregated.impressions * 1000) : 0;
  aggregated.roas = aggregated.cost > 0 ? (aggregated.convValue / aggregated.cost) : 0;
  aggregated.cartRate = aggregated.clicks > 0 ? (aggregated.cartCount / aggregated.clicks * 100) : 0;
  aggregated.checkoutRate = aggregated.cartCount > 0 ? (aggregated.checkoutCount / aggregated.cartCount * 100) : 0;
  aggregated.purchaseRate = aggregated.checkoutCount > 0 ? (aggregated.conversions / aggregated.checkoutCount * 100) : 0;
  
  tableData.push(aggregated);
}
    
    // Sort by impressions by default
    tableData.sort((a, b) => b.impressions - a.impressions);
    
    // Render the table
    renderProductsTable(tableContainer, tableData, campaignName);
    
    // Update header info
    headerInfo.textContent = `${campaignName} - ${tableData.length} products`;
    
  } catch (error) {
    console.error('[loadCampaignProducts] Error loading products:', error);
    const tableContainer = productsPanel.querySelector('.campaigns-products-table-container');
    if (tableContainer) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">⚠️</div>
          <div class="campaigns-empty-title">Error Loading Products</div>
          <div class="campaigns-empty-text">Failed to load products for this campaign</div>
        </div>
      `;
    }
    headerInfo.textContent = `${campaignName} - Error loading products`;
  }
}

// Load search terms for selected campaign
async function loadCampaignSearchTerms(channelType, campaignName) {
  console.log('[loadCampaignSearchTerms] Loading search terms for campaign:', campaignName);
  
  const searchTermsPanel = document.getElementById('campaignsSearchTermsPanel');
  const headerInfo = searchTermsPanel?.querySelector('.selected-campaign-info');
  
  if (!searchTermsPanel) return;
  
  // Show loading state
  const tableContainer = searchTermsPanel.querySelector('.campaigns-search-terms-table-container');
  if (!tableContainer) return;
  
  tableContainer.innerHTML = '<div class="campaigns-loading"><div class="campaigns-spinner"></div></div>';
  headerInfo.textContent = `Loading search terms for ${campaignName}...`;
  
  try {
    // Get table prefix and load multiple tables
    const tablePrefix = getProjectTablePrefix();
    const searchTermsTableName = `${tablePrefix}googleSheets_searchTerms_30d`;
    const searchTerms365dTableName = `${tablePrefix}googleSheets_searchTerms_365d`;
    const searchTerms90dTableName = `${tablePrefix}googleSheets_searchTerms_90d`;
    
    // Load data from IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    
    // Get 30d search terms data
    const searchTermsRequest = objectStore.get(searchTermsTableName);
    const searchTermsResult = await new Promise((resolve, reject) => {
      searchTermsRequest.onsuccess = () => resolve(searchTermsRequest.result);
      searchTermsRequest.onerror = () => reject(searchTermsRequest.error);
    });
    
    // Get 365d data for Top_Bucket
    const searchTerms365dRequest = objectStore.get(searchTerms365dTableName);
    const searchTerms365dResult = await new Promise((resolve, reject) => {
      searchTerms365dRequest.onsuccess = () => resolve(searchTerms365dRequest.result);
      searchTerms365dRequest.onerror = () => reject(searchTerms365dRequest.error);
    });
    
    // Get 90d data for trends
    const searchTerms90dRequest = objectStore.get(searchTerms90dTableName);
    const searchTerms90dResult = await new Promise((resolve, reject) => {
      searchTerms90dRequest.onsuccess = () => resolve(searchTerms90dRequest.result);
      searchTerms90dRequest.onerror = () => reject(searchTerms90dRequest.error);
    });
    
    db.close();
    
    if (!searchTermsResult || !searchTermsResult.data) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">🔍</div>
          <div class="campaigns-empty-title">No Search Terms Data</div>
          <div class="campaigns-empty-text">Search terms data is not available</div>
        </div>
      `;
      headerInfo.textContent = `${campaignName} - No search terms data`;
      return;
    }
    
    // Create map of Top_Bucket values from 365d data
    const topBucketMap = {};
    if (searchTerms365dResult && searchTerms365dResult.data) {
      searchTerms365dResult.data.forEach(item => {
        if (item.Query && item.Top_Bucket && item.Campaign_Name === campaignName) {
          topBucketMap[item.Query.toLowerCase()] = item.Top_Bucket;
        }
      });
    }
    
    // Create map of 90d data for trends (monthly average)
    const trend90dMap = {};
    if (searchTerms90dResult && searchTerms90dResult.data) {
      searchTerms90dResult.data.forEach(item => {
        if (item.Query && item.Campaign_Name === campaignName) {
          trend90dMap[item.Query.toLowerCase()] = {
            Impressions: (item.Impressions || 0) / 3,
            Clicks: (item.Clicks || 0) / 3,
            Conversions: (item.Conversions || 0) / 3,
            Value: (item.Value || 0) / 3
          };
        }
      });
    }
    
    // Filter search terms for this specific campaign
    const filteredData = searchTermsResult.data.filter(item => 
      item.Campaign_Name === campaignName && 
      item.Query && 
      item.Query.toLowerCase() !== 'blank'
    ).map(item => {
      // Add Top_Bucket and trend data
      const queryLower = item.Query.toLowerCase();
      return {
        ...item,
        Top_Bucket: topBucketMap[queryLower] || '',
        Trend_Data: trend90dMap[queryLower] || null
      };
    });
    
    if (filteredData.length === 0) {
      tableContainer.innerHTML = `
        <div class="campaigns-empty-state">
          <div class="campaigns-empty-icon">🔍</div>
          <div class="campaigns-empty-title">No Search Terms Found</div>
          <div class="campaigns-empty-text">No search terms found for campaign: ${campaignName}</div>
        </div>
      `;
      headerInfo.textContent = `${campaignName} - No search terms`;
      return;
    }
    
    // Sort by clicks (highest first) by default
    filteredData.sort((a, b) => (b.Clicks || 0) - (a.Clicks || 0));
    
    // Render the search terms table
    renderCampaignSearchTermsTable(tableContainer, filteredData, campaignName);
    
    // Update header info
    headerInfo.textContent = `${campaignName} - ${filteredData.length} search terms`;
    
  } catch (error) {
    console.error('[loadCampaignSearchTerms] Error:', error);
    tableContainer.innerHTML = `
      <div class="campaigns-empty-state">
        <div class="campaigns-empty-icon">⚠️</div>
        <div class="campaigns-empty-title">Error Loading Search Terms</div>
        <div class="campaigns-empty-text">Failed to load search terms for this campaign</div>
      </div>
    `;
    headerInfo.textContent = `${campaignName} - Error loading search terms`;
  }
}

// Render search terms table for campaigns
function renderCampaignSearchTermsTable(container, searchTerms, campaignName) {
  // Calculate max values for scaling bars
  const maxImpressions = Math.max(...searchTerms.map(d => d.Impressions || 0));
  const maxClicks = Math.max(...searchTerms.map(d => d.Clicks || 0));
  const maxConversions = Math.max(...searchTerms.map(d => d.Conversions || 0));
  const maxValue = Math.max(...searchTerms.map(d => d.Value || 0));
  
  // Calculate totals
  const totals = {
    impressions: searchTerms.reduce((sum, d) => sum + (d.Impressions || 0), 0),
    clicks: searchTerms.reduce((sum, d) => sum + (d.Clicks || 0), 0),
    conversions: searchTerms.reduce((sum, d) => sum + (d.Conversions || 0), 0),
    value: searchTerms.reduce((sum, d) => sum + (d.Value || 0), 0),
    revenuePercent: searchTerms.reduce((sum, d) => sum + ((d['% of all revenue'] || 0) * 100), 0)
  };
  
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
  totals.cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks * 100) : 0;
  
  // Calculate trend totals
  const trendTotals = {
    impressions: 0,
    clicks: 0,
    conversions: 0,
    value: 0
  };
  
  searchTerms.forEach(term => {
    if (term.Trend_Data) {
      trendTotals.impressions += term.Trend_Data.Impressions || 0;
      trendTotals.clicks += term.Trend_Data.Clicks || 0;
      trendTotals.conversions += term.Trend_Data.Conversions || 0;
      trendTotals.value += term.Trend_Data.Value || 0;
    }
  });
  
  // Find top 10 by value for special highlighting
  const top10ByValue = [...searchTerms]
    .sort((a, b) => (b.Value || 0) - (a.Value || 0))
    .slice(0, 10)
    .map(item => item.Query);
  
  const wrapper = document.createElement('div');
  wrapper.className = 'camp-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'camp-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  thead.innerHTML = `
    <tr>
      <th style="width: 50px; text-align: center;">#</th>
      <th style="width: 300px;">Search Term</th>
      <th class="right sortable metric-col" data-sort="impressions">Impressions</th>
      <th class="right sortable metric-col" data-sort="clicks">Clicks</th>
      <th class="right sortable metric-col" data-sort="ctr">CTR %</th>
      <th class="right sortable metric-col" data-sort="conversions">Conv</th>
      <th class="right sortable metric-col" data-sort="cvr">CVR %</th>
      <th class="right sortable metric-col" data-sort="value">Revenue</th>
      <th class="right sortable metric-col" data-sort="revenuePercent">% of Revenue</th>
    </tr>
  `;
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
  // Add summary row
  tbody.innerHTML = `
    <tr class="camp-summary-row">
      <td style="text-align: center; font-weight: 600;">#</td>
      <td style="font-weight: 600;">Total (${searchTerms.length} terms)</td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="color: #007aff; font-weight: 700;">
            ${totals.impressions.toLocaleString()}
          </div>
          ${getCampaignMetricTrend(trendTotals.impressions, totals.impressions, 'impressions')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: 100%; background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);"></div>
            </div>
            <span class="camp-metric-percent" style="color: #007aff; font-weight: 600;">100%</span>
          </div>
        </div>
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="color: #007aff; font-weight: 700;">
            ${totals.clicks.toLocaleString()}
          </div>
          ${getCampaignMetricTrend(trendTotals.clicks, totals.clicks, 'clicks')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: 100%; background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);"></div>
            </div>
            <span class="camp-metric-percent" style="color: #007aff; font-weight: 600;">100%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right; font-weight: 700; color: #007aff;">
        ${totals.ctr.toFixed(2)}%
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="color: #007aff; font-weight: 700;">
            ${totals.conversions.toFixed(1)}
          </div>
          ${getCampaignMetricTrend(trendTotals.conversions, totals.conversions, 'conversions')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: 100%; background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);"></div>
            </div>
            <span class="camp-metric-percent" style="color: #007aff; font-weight: 600;">100%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right; font-weight: 700; color: #007aff;">
        ${totals.cvr.toFixed(2)}%
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="color: #007aff; font-weight: 700;">
            $${totals.value.toFixed(2)}
          </div>
          ${getCampaignMetricTrend(trendTotals.value, totals.value, 'value')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: 100%; background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);"></div>
            </div>
            <span class="camp-metric-percent" style="color: #007aff; font-weight: 600;">100%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right; font-weight: 700; color: #007aff;">
        ${totals.revenuePercent.toFixed(2)}%
      </td>
    </tr>
  `;
  
  // Add search term rows
  searchTerms.forEach((term, index) => {
    const ctr = term.Impressions > 0 ? (term.Clicks / term.Impressions * 100) : 0;
    const cvr = term.Clicks > 0 ? (term.Conversions / term.Clicks * 100) : 0;
    const revenuePercent = (term['% of all revenue'] || 0) * 100;
    
    // Calculate percentages for bars
    const impressionsPercent = totals.impressions > 0 ? (term.Impressions / totals.impressions * 100) : 0;
    const clicksPercent = totals.clicks > 0 ? (term.Clicks / totals.clicks * 100) : 0;
    const conversionsPercent = totals.conversions > 0 ? (term.Conversions / totals.conversions * 100) : 0;
    const valuePercent = totals.value > 0 ? (term.Value / totals.value * 100) : 0;
    
    // Determine row background based on Top_Bucket or performance
    let rowBg = index % 2 === 1 ? '#f9f9f9' : 'white';
    if (term.Clicks >= 50 && term.Conversions === 0) {
      rowBg = '#ffebee'; // Light red for potential negatives
    } else if (top10ByValue.includes(term.Query)) {
      rowBg = '#e8f5e9'; // Light green for top revenue
    } else if (term.Top_Bucket) {
      // Style based on Top_Bucket
      const bucketStyles = {
        'Top1': '#fff9e6',
        'Top2': '#f5f5f5',
        'Top3': '#fff5f0',
        'Top4': '#e8f5e9',
        'Top5': '#e3f2fd',
        'Top10': '#f3e5f5'
      };
      rowBg = bucketStyles[term.Top_Bucket] || rowBg;
    }
    
    const row = document.createElement('tr');
    row.style.backgroundColor = rowBg;
    
    row.innerHTML = `
      <td style="text-align: center;">
        ${getIndexWithTopBucket(index + 1, term.Top_Bucket)}
      </td>
      <td style="font-weight: 500;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span>${term.Query || '-'}</span>
          ${term.Top_Bucket ? getTopBucketBadge(term.Top_Bucket) : ''}
        </div>
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value">${(term.Impressions || 0).toLocaleString()}</div>
          ${getCampaignMetricTrend(term.Trend_Data?.Impressions, term.Impressions, 'impressions')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: ${impressionsPercent}%; background: linear-gradient(90deg, #4285f4 0%, #1a73e8 100%);"></div>
            </div>
            <span class="camp-metric-percent">${impressionsPercent.toFixed(1)}%</span>
          </div>
        </div>
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value">${(term.Clicks || 0).toLocaleString()}</div>
          ${getCampaignMetricTrend(term.Trend_Data?.Clicks, term.Clicks, 'clicks')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: ${clicksPercent}%; background: linear-gradient(90deg, #34a853 0%, #1e8e3e 100%);"></div>
            </div>
            <span class="camp-metric-percent">${clicksPercent.toFixed(1)}%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right;">
        <div style="font-weight: 600; color: ${ctr > 5 ? '#4CAF50' : ctr > 2 ? '#FF9800' : '#F44336'};">
          ${ctr.toFixed(2)}%
        </div>
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value">${(term.Conversions || 0).toFixed(1)}</div>
          ${getCampaignMetricTrend(term.Trend_Data?.Conversions, term.Conversions, 'conversions')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: ${conversionsPercent}%; background: linear-gradient(90deg, #fbbc04 0%, #ea8600 100%);"></div>
            </div>
            <span class="camp-metric-percent">${conversionsPercent.toFixed(1)}%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right;">
        <div style="font-weight: 600; color: ${cvr > 5 ? '#4CAF50' : cvr > 2 ? '#FF9800' : '#F44336'};">
          ${cvr.toFixed(2)}%
        </div>
      </td>
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="font-weight: 600;">
            $${(term.Value || 0).toFixed(2)}
          </div>
          ${getCampaignMetricTrend(term.Trend_Data?.Value, term.Value, 'value')}
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: ${valuePercent}%; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%);"></div>
            </div>
            <span class="camp-metric-percent">${valuePercent.toFixed(1)}%</span>
          </div>
        </div>
      </td>
      <td class="metric-col" style="text-align: right;">
        <div style="font-weight: 600; color: ${revenuePercent > 5 ? '#4CAF50' : '#666'};">
          ${revenuePercent.toFixed(2)}%
        </div>
      </td>
    </tr>
    `;
    tbody.appendChild(row);
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);
  
  // Clear and add table
  container.innerHTML = '';
  container.appendChild(wrapper);
}

// Helper function to format trend for campaign metrics
function getCampaignMetricTrend(previousValue, currentValue, type) {
  if (!previousValue || previousValue === 0) return '';
  
  const current = parseFloat(currentValue) || 0;
  const previous = parseFloat(previousValue) || 0;
  
  const change = current - previous;
  const changePercent = previous > 0 ? ((change / previous) * 100).toFixed(1) : 0;
  const isPositive = change >= 0;
  const arrow = isPositive ? '↑' : '↓';
  const color = isPositive ? '#4CAF50' : '#F44336';
  
  return `
    <div style="font-size: 11px; color: ${color}; margin-top: 2px;">
      ${arrow} ${Math.abs(changePercent)}%
    </div>
  `;
}

// Get index with Top Bucket styling
function getIndexWithTopBucket(index, topBucket) {
  const bucketStyles = {
    'Top1': { bg: '#FFD700', color: '#000' },
    'Top2': { bg: '#C0C0C0', color: '#000' },
    'Top3': { bg: '#CD7F32', color: '#fff' },
    'Top4': { bg: '#4CAF50', color: '#fff' },
    'Top5': { bg: '#2196F3', color: '#fff' },
    'Top10': { bg: '#9C27B0', color: '#fff' }
  };
  
  const style = bucketStyles[topBucket];
  
  if (style) {
    return `
      <div style="
        background: ${style.bg};
        color: ${style.color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 13px;
        margin: 0 auto;
      ">
        ${index}
      </div>
    `;
  }
  
  return `<div style="font-weight: 600; color: #666; font-size: 13px;">${index}</div>`;
}

// Get Top Bucket badge HTML
function getTopBucketBadge(topBucket) {
  if (!topBucket || topBucket === '') return '';
  
  const bucketConfig = {
    'Top1': { color: '#FFD700', bg: '#FFF9E6', label: 'Top 1' },
    'Top2': { color: '#C0C0C0', bg: '#F5F5F5', label: 'Top 2' },
    'Top3': { color: '#CD7F32', bg: '#FFF5F0', label: 'Top 3' },
    'Top4': { color: '#4CAF50', bg: '#E8F5E9', label: 'Top 4' },
    'Top5': { color: '#2196F3', bg: '#E3F2FD', label: 'Top 5' },
    'Top10': { color: '#9C27B0', bg: '#F3E5F5', label: 'Top 10' }
  };
  
  const config = bucketConfig[topBucket] || { color: '#666', bg: '#F5F5F5', label: topBucket };
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 12px;
      background: ${config.bg};
      color: ${config.color};
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      border: 1px solid ${config.color}40;
    ">
      ${config.label}
    </span>
  `;
}

// Render products table with improved design
function renderProductsTable(container, tableData, campaignName) {
  // Get visible columns (excluding ROAS which is now fixed)
  const visibleColumns = window.campaignTableColumns ? 
    window.campaignTableColumns.filter(c => c.visible && c.id !== 'roas') : 
    [
      { id: 'impressions', label: 'Impr' },
      { id: 'clicks', label: 'Clicks' },
      { id: 'ctr', label: 'CTR %' },
      { id: 'avgCpc', label: 'Avg CPC' },
      { id: 'cost', label: 'Cost' },
      { id: 'conversions', label: 'Conv' },
      { id: 'cpa', label: 'CPA' },
      { id: 'cvr', label: 'CVR %' },
      { id: 'convValue', label: 'Revenue' }
    ];
  
  // Calculate totals for summary row and percentages
  const totals = {
    impressions: tableData.reduce((sum, p) => sum + (p.impressions || 0), 0),
    clicks: tableData.reduce((sum, p) => sum + (p.clicks || 0), 0),
    cost: tableData.reduce((sum, p) => sum + (p.cost || 0), 0),
    conversions: tableData.reduce((sum, p) => sum + (p.conversions || 0), 0),
    convValue: tableData.reduce((sum, p) => sum + (p.convValue || 0), 0)
  };
  
  // Calculate derived totals
  totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions * 100) : 0;
  totals.avgCpc = totals.clicks > 0 ? (totals.cost / totals.clicks) : 0;
  totals.cpa = totals.conversions > 0 ? (totals.cost / totals.conversions) : 0;
  totals.cvr = totals.clicks > 0 ? (totals.conversions / totals.clicks * 100) : 0;
  totals.aov = totals.conversions > 0 ? (totals.convValue / totals.conversions) : 0;
  totals.cpm = totals.impressions > 0 ? (totals.cost / totals.impressions * 1000) : 0;
  totals.roas = totals.cost > 0 ? (totals.convValue / totals.cost) : 0;
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'camp-products-wrapper';
  
  // Create table
  const table = document.createElement('table');
  table.className = 'camp-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  
  // Fixed columns headers (POS, SHARE, ROAS, IMAGE, PRODUCT)
  let headerHTML = `
    <th class="center sortable" data-sort="adPosition" style="width: 60px;">
      Pos
      <span class="camp-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="marketShare" style="width: 90px;">
      Share
      <span class="camp-sort-icon">⇅</span>
    </th>
    <th class="center sortable" data-sort="roas" style="width: 70px;">
      ROAS
      <span class="camp-sort-icon">⇅</span>
    </th>
    <th class="center" style="width: 80px;">Image</th>
    <th class="sortable" data-sort="title" style="width: 300px;">
      Product
      <span class="camp-sort-icon">⇅</span>
    </th>
  `;
  
  // Dynamic metric columns headers
  visibleColumns.forEach(col => {
    const label = col.id === 'impressions' ? 'Impr' : 
                  col.id === 'conversions' ? 'Conv' : 
                  col.label;
    headerHTML += `
      <th class="right sortable metric-col" data-sort="${col.id}">
        ${label}
        <span class="camp-sort-icon">⇅</span>
      </th>
    `;
  });
  
  headerRow.innerHTML = headerHTML;
  thead.appendChild(headerRow);
  table.appendChild(thead);
  
  // Create body
  const tbody = document.createElement('tbody');
  
// Add summary row first
const summaryRow = document.createElement('tr');
summaryRow.className = 'camp-summary-row';

let summaryHTML = `
  <td colspan="4" style="text-align: center; font-weight: 600; background: linear-gradient(to bottom, #f0f2f5, #e9ecef);">
    Campaign Totals
  </td>
  <td style="font-weight: 600; background: linear-gradient(to bottom, #f0f2f5, #e9ecef);">
    ${tableData.length} Products
  </td>
`;

// Add summary metrics with bars for specific columns
visibleColumns.forEach(col => {
  const value = totals[col.id] || 0;
  const formattedValue = formatMetricValue(value, getMetricFormat(col.id));
  
  // Add progress bars for specific metrics in summary row
  if (['impressions', 'clicks', 'cost', 'conversions', 'convValue'].includes(col.id)) {
    summaryHTML += `
      <td class="metric-col">
        <div class="camp-metric-cell">
          <div class="camp-metric-value" style="color: #007aff; font-weight: 700;">${formattedValue}</div>
          <div class="camp-metric-bar-container">
            <div class="camp-metric-bar">
              <div class="camp-metric-bar-fill" style="width: 100%; background: linear-gradient(90deg, #007aff 0%, #0056b3 100%);"></div>
            </div>
            <span class="camp-metric-percent" style="color: #007aff; font-weight: 600;">100%</span>
          </div>
        </div>
      </td>`;
  } else {
    summaryHTML += `<td class="metric-col" style="text-align: right; font-weight: 700; color: #007aff;">${formattedValue}</td>`;
  }
});

summaryRow.innerHTML = summaryHTML;
tbody.appendChild(summaryRow);
  
  // Render product rows
  tableData.forEach((product, index) => {
// Main product row
const mainRow = document.createElement('tr');
let rowClasses = ['main-row'];

// Add seller status class
if (product.sellerStatus && product.sellerStatus !== 'Standard') {
  const statusClass = product.sellerStatus.toLowerCase().replace(/\s+/g, '-');
  rowClasses.push(statusClass);
}

mainRow.className = rowClasses.join(' ');
    mainRow.dataset.index = index;
    
    const hasDevices = product.devices && product.devices.size > 1;
    
    // Position badge class
    let posClass = 'bottom';
    if (product.adPosition) {
      if (product.adPosition <= 3) posClass = 'top';
      else if (product.adPosition <= 8) posClass = 'mid';
      else if (product.adPosition <= 14) posClass = 'low';
    }
    
    // ROAS badge class
    let roasClass = 'poor';
    if (product.roas >= 4) roasClass = 'excellent';
    else if (product.roas >= 2) roasClass = 'good';
    else if (product.roas >= 1) roasClass = 'fair';
    
    // Build row HTML (POS, SHARE, ROAS, IMAGE, PRODUCT)
    let rowHTML = `
<td style="text-align: center; width: 60px;">
  ${product.adPosition !== null && product.adPosition !== undefined ? 
    `<div style="display: flex; flex-direction: column; align-items: center; gap: 2px;">
      <div class="camp-position-indicator ${posClass}">${product.adPosition}</div>
      ${product.trend ? 
        `<div style="font-size: 9px; color: ${product.trend.color}; font-weight: 600; background: ${product.trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 1px 4px; border-radius: 4px;">${product.trend.text}</div>` : 
        ''}
    </div>` : 
    '<span style="color: #adb5bd;">-</span>'}
</td>
      <td style="text-align: center; width: 90px;">
        ${product.marketShare ? 
          `<div class="camp-share-bar">
            <div class="camp-share-fill" style="width: ${product.marketShare}%"></div>
            <div class="camp-share-text">${product.marketShare.toFixed(1)}%</div>
          </div>` : 
          '<span style="color: #adb5bd;">-</span>'}
      </td>
<td style="text-align: center; width: 70px;">
  ${product.roas !== null && product.roas !== undefined ? 
    (product.convValue > 0 ? 
      `<div class="camp-roas-badge ${roasClass}">${product.roas.toFixed(1)}x</div>` :
      `<div style="width: 60px; height: 36px; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); border: 1px solid #d0d0d0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: #9e9e9e;">
        <span style="display: flex; align-items: center; gap: 3px;">
          <span style="font-size: 14px;">💤</span>
          <span>No Sales</span>
        </span>
      </div>`)
    : '<span style="color: #adb5bd;">-</span>'}
</td>
      <td style="text-align: center; width: 80px;">
        ${product.image ? 
          `<div class="camp-product-img-container">
            <img class="camp-product-img" src="${product.image}" alt="${product.title}" onerror="this.style.display='none'">
            <img class="camp-product-img-zoom" src="${product.image}" alt="${product.title}">
          </div>` : 
          '<div style="width: 48px; height: 48px; background: #f0f2f5; border-radius: 8px; margin: 0 auto;"></div>'}
      </td>
<td style="width: 300px;">
  <div style="display: flex; align-items: center;">
    <div class="camp-product-title">${product.title}</div>
    ${product.sellerStatus && product.sellerStatus !== 'Standard' ? 
      `<span class="product-status-badge ${product.sellerStatus.toLowerCase().replace(/\s+/g, '-')}">${product.sellerStatus === 'Revenue Stars' ? '⭐' : product.sellerStatus === 'Best Sellers' ? '🏆' : '📈'} ${product.sellerStatus}</span>` : 
      ''}
  </div>
</td>
    `;
    
    // Add metric columns with improved progress bars
    visibleColumns.forEach(col => {
      const value = product[col.id] || 0;
      const formattedValue = formatMetricValue(value, getMetricFormat(col.id));
      
      // Add progress bars for specific metrics
      if (['impressions', 'clicks', 'cost', 'conversions', 'convValue'].includes(col.id)) {
        const percentage = totals[col.id] > 0 ? (value / totals[col.id] * 100) : 0;
        rowHTML += `
          <td class="metric-col">
            <div class="camp-metric-cell">
              <div class="camp-metric-value">${formattedValue}</div>
              <div class="camp-metric-bar-container">
                <div class="camp-metric-bar">
                  <div class="camp-metric-bar-fill" style="width: ${percentage}%"></div>
                </div>
                <span class="camp-metric-percent">${percentage.toFixed(1)}%</span>
              </div>
            </div>
          </td>`;
      } else {
        rowHTML += `<td class="metric-col" style="text-align: right;">
          <span class="camp-metric" style="font-size: 14px; font-weight: 500;">${formattedValue}</span>
        </td>`;
      }
    });
    
    mainRow.innerHTML = rowHTML;
    
    // Add click handler for row expansion
    if (hasDevices) {
      mainRow.addEventListener('click', function(e) {
        // Don't trigger on image elements
        if (e.target.classList.contains('camp-product-img') || 
            e.target.classList.contains('camp-product-img-zoom')) return;
        
        const deviceRows = tbody.querySelectorAll(`.device-row[data-parent-index="${index}"]`);
        deviceRows.forEach(row => {
          row.classList.toggle('visible');
        });
      });
    }
    
    tbody.appendChild(mainRow);
    
// Device rows (initially hidden)
if (hasDevices) {
  product.devices.forEach((deviceData, deviceType) => {
    const deviceRow = document.createElement('tr');
    deviceRow.className = 'device-row';
    deviceRow.dataset.parentIndex = index;
    
    const deviceClass = deviceType.toLowerCase();
    const deviceIcon = deviceType === 'MOBILE' ? '📱' : 
                      deviceType === 'TABLET' ? '📱' : '💻';
    
    // Get device-specific POS and Market Share from processed metrics
    const deviceKey = deviceType.toLowerCase();
    const deviceMetrics = product.deviceMetrics?.get(deviceKey);
    const devicePOS = deviceMetrics?.avgPosition || null;
    const deviceMarketShare = deviceMetrics?.avgVisibility || null;
    
    console.log(`Device: ${deviceType}, POS: ${devicePOS}, Share: ${deviceMarketShare}%`);
    
    // Position badge class for device
    let posClass = 'bottom';
    if (devicePOS) {
      if (devicePOS <= 3) posClass = 'top';
      else if (devicePOS <= 8) posClass = 'mid';
      else if (devicePOS <= 14) posClass = 'low';
    }
    
    // ROAS calculation for device
    const deviceROAS = deviceData.Cost > 0 ? (deviceData.ConvValue / deviceData.Cost) : 0;
    let roasClass = 'poor';
    if (deviceROAS >= 4) roasClass = 'excellent';
    else if (deviceROAS >= 2) roasClass = 'good';
    else if (deviceROAS >= 1) roasClass = 'fair';
    
    // Device row with POS, SHARE, and ROAS columns populated
    let deviceRowHTML = `
<td style="text-align: center;">
  ${devicePOS !== null && devicePOS !== undefined ? 
    `<div style="display: flex; flex-direction: column; align-items: center; gap: 1px;">
      <div class="camp-position-indicator ${posClass}" style="width: 28px; height: 28px; font-size: 11px;">${devicePOS}</div>
      ${deviceMetrics?.trend ? 
        `<div style="font-size: 8px; color: ${deviceMetrics.trend.color}; font-weight: 600; background: ${deviceMetrics.trend.isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'}; padding: 1px 3px; border-radius: 3px;">${deviceMetrics.trend.text}</div>` : 
        ''}
    </div>` : 
    '<span style="color: #adb5bd; font-size: 11px;">-</span>'}
</td>
      <td style="text-align: center;">
        ${deviceMarketShare !== null && deviceMarketShare !== undefined ? 
          `<div class="camp-share-bar" style="height: 24px; width: 50px;">
            <div class="camp-share-fill" style="width: ${Math.min(deviceMarketShare, 100)}%"></div>
            <div class="camp-share-text" style="font-size: 10px;">${deviceMarketShare.toFixed(1)}%</div>
          </div>` : 
          '<span style="color: #adb5bd; font-size: 11px;">-</span>'}
      </td>
<td style="text-align: center;">
  ${deviceData.ConvValue > 0 ? 
    `<div class="camp-roas-badge ${roasClass}" style="width: 50px; height: 28px; font-size: 11px;">${deviceROAS.toFixed(1)}x</div>` :
    `<div style="width: 50px; height: 28px; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); border: 1px solid #d0d0d0; border-radius: 6px; display: inline-flex; align-items: center; justify-content: center; font-size: 8px; font-weight: 600; color: #9e9e9e;">
      <span style="display: flex; align-items: center; gap: 2px;">
        <span style="font-size: 11px;">💤</span>
        <span>No Sales</span>
      </span>
    </div>`}
</td>
      <td></td>
      <td style="padding-left: 20px;">
        <div class="camp-device-tag ${deviceClass}">
          ${deviceIcon} ${deviceType}
        </div>
      </td>
    `;
    
    // Add device metric columns
    visibleColumns.forEach(col => {
      const value = getDeviceMetricValue(deviceData, col.id);
      deviceRowHTML += `<td class="metric-col" style="text-align: right;">
        <span class="camp-metric" style="font-size: 11px;">${formatMetricValue(value, getMetricFormat(col.id))}</span>
      </td>`;
    });
    
    deviceRow.innerHTML = deviceRowHTML;
    tbody.appendChild(deviceRow);
  });
}
  });
  
  table.appendChild(tbody);
  wrapper.appendChild(table);

  // Add event listeners for image hover positioning
wrapper.querySelectorAll('.camp-product-img-container').forEach(container => {
  const img = container.querySelector('.camp-product-img');
  const zoomImg = container.querySelector('.camp-product-img-zoom');
  
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
  
  // Clear container and add new table
  container.innerHTML = '';
  container.appendChild(wrapper);
  
  // Add event listeners for sorting
  addImprovedTableEventListeners(wrapper, tableData);
}

// Get metric format type
function getMetricFormat(metricId) {
  const formats = {
    impressions: 'number',
    clicks: 'number',
    ctr: 'percent',
    avgCpc: 'currency',
    cost: 'currency',
    conversions: 'number',
    cpa: 'currency',
    convValue: 'currency',
    cvr: 'percent',
    aov: 'currency',
    cpm: 'currency',
    roas: 'roas',
    cartRate: 'percent',
    checkoutRate: 'percent',
    purchaseRate: 'percent'
  };
  return formats[metricId] || 'number';
}

// Add improved event listeners for the table
function addImprovedTableEventListeners(wrapper, tableData) {
  // Store sort state
  if (!window.campaignSortState) {
    window.campaignSortState = {};
  }
  
  wrapper.querySelectorAll('th.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const column = this.dataset.sort;
      
      // Remove previous sort classes from all headers
      wrapper.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Toggle sort direction
      let direction = 'desc'; // Default first click is desc
      if (window.campaignSortState[column] === 'desc') {
        direction = 'asc';
      } else if (window.campaignSortState[column] === 'asc') {
        direction = 'desc';
      }
      
      // Update sort state
      window.campaignSortState = { [column]: direction };
      
      // Apply sort class
      this.classList.add(`sorted-${direction}`);
      
      // Update sort icon
      this.querySelector('.camp-sort-icon').textContent = direction === 'asc' ? '↑' : '↓';
      
      // Sort data
      const sortedData = [...tableData].sort((a, b) => {
        let aVal = column === 'title' ? a.title : a[column];
        let bVal = column === 'title' ? b.title : b[column];
        
        // Handle null/undefined values
        if (aVal == null) aVal = column === 'title' ? '' : 0;
        if (bVal == null) bVal = column === 'title' ? '' : 0;
        
        if (typeof aVal === 'string') {
          return direction === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
        } else {
          return direction === 'asc' ? 
            (aVal - bVal) : 
            (bVal - aVal);
        }
      });
      
      // Re-render table with sorted data
      const container = wrapper.parentElement;
      renderProductsTable(container, sortedData, window.selectedCampaign?.campaignName || '');
    });
  });
}

// Format metric value based on type
function formatMetricValue(value, format) {
  if (value === null || value === undefined || value === '') return '-';
  
  switch (format) {
    case 'number':
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    case 'currency':
      return '$' + value.toFixed(2);
    case 'percent':
      return value.toFixed(1) + '%';
    case 'roas':
      return value.toFixed(2) + 'x';
    default:
      return value;
  }
}

// Get device-specific metric value
function getDeviceMetricValue(deviceData, metric) {
  const metricMap = {
    impressions: 'Impressions',
    clicks: 'Clicks',
    ctr: 'CTR',
    avgCpc: 'Avg CPC',
    cost: 'Cost',
    conversions: 'Conversions',
    cpa: 'CPA',
    convValue: 'ConvValue',
    cvr: 'CVR',
    aov: 'AOV',
    cpm: 'CPM',
    roas: 'ROAS',
    cartRate: 'Cart Rate',
    checkoutRate: 'Checkout Rate',
    purchaseRate: 'Purchase Rate'
  };
  
  return parseFloat(deviceData[metricMap[metric]] || 0);
}

// Add table event listeners
function addTableEventListeners(container, tableData, columns, visibleColumns) {
  // Expand/collapse device rows
  container.querySelectorAll('.expand-toggle').forEach(toggle => {
    toggle.addEventListener('click', function(e) {
      e.stopPropagation();
      const row = this.closest('tr');
      const productIndex = row.getAttribute('data-product-index');
      const deviceRows = container.querySelectorAll(`tr.device-row[data-parent-index="${productIndex}"]`);
      
      this.classList.toggle('expanded');
      deviceRows.forEach(deviceRow => {
        deviceRow.classList.toggle('expanded');
      });
    });
  });
  
  // Sorting
  container.querySelectorAll('th.sortable').forEach(header => {
    header.addEventListener('click', function() {
      const column = this.getAttribute('data-column');
      const currentSort = this.classList.contains('sorted-asc') ? 'asc' : 
                         this.classList.contains('sorted-desc') ? 'desc' : null;
      
      // Clear all sort classes
      container.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Apply new sort
      let newSort = currentSort === 'asc' ? 'desc' : 'asc';
      this.classList.add(`sorted-${newSort}`);
      
      // Sort data
      const sortedData = [...tableData].sort((a, b) => {
        let aVal = column === 'product' ? a.title : a[column];
        let bVal = column === 'product' ? b.title : b[column];
        
        if (typeof aVal === 'string') {
          return newSort === 'asc' ? 
            aVal.localeCompare(bVal) : 
            bVal.localeCompare(aVal);
        } else {
          return newSort === 'asc' ? 
            (aVal || 0) - (bVal || 0) : 
            (bVal || 0) - (aVal || 0);
        }
      });
      
      // Re-render table
      renderProductsTable(container, sortedData, window.selectedCampaign?.campaignName || '');
    });
  });
}

// Create a campaign product item (similar to google-ads-small-ad-details)
async function createCampaignProductItem(product) {
  const productDiv = document.createElement('div');
  productDiv.className = 'campaign-product-item';
  
  // Calculate metrics (reuse existing function if available)
  const metrics = typeof calculateGoogleAdsProductMetrics === 'function' 
    ? calculateGoogleAdsProductMetrics(product) 
    : { avgRating: 0, avgVisibility: 0, activeLocations: 0, inactiveLocations: 0, rankTrend: {}, visibilityTrend: {} };
  
  const badgeColor = getGoogleAdsRatingBadgeColor(metrics.avgRating);
  const imageUrl = product.thumbnail || 'https://via.placeholder.com/60?text=No+Image';
  const title = product.title || 'No title';
  
  productDiv.innerHTML = `
    <!-- Position Badge -->
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor}; width: 60px; height: 60px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
      <div style="font-size: 22px; line-height: 1; color: white; font-weight: 700;">${metrics.avgRating}</div>
      ${metrics.rankTrend && metrics.rankTrend.arrow ? `
        <div style="position: absolute; bottom: 3px; left: 50%; transform: translateX(-50%);">
          <span style="background-color: ${metrics.rankTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600;">
            ${metrics.rankTrend.arrow} ${Math.abs(metrics.rankTrend.change)}
          </span>
        </div>
      ` : ''}
    </div>
    
    <!-- Visibility Status -->
    <div class="small-ad-vis-status" style="width: 60px; flex-shrink: 0;">
      <div style="width: 60px; height: 60px; background: #e3f2fd; border-radius: 8px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden;">
        <div style="position: absolute; bottom: 0; left: 0; right: 0; height: ${metrics.avgVisibility}%; background: linear-gradient(to top, #1e88e5, rgba(30, 136, 229, 0.3)); transition: height 0.3s;"></div>
        <span style="position: relative; z-index: 2; font-size: 11px; font-weight: bold; color: #1565c0;">${metrics.avgVisibility.toFixed(1)}%</span>
        ${metrics.visibilityTrend && metrics.visibilityTrend.arrow ? `
          <div style="position: absolute; bottom: 2px; left: 50%; transform: translateX(-50%);">
            <span style="background-color: ${metrics.visibilityTrend.color}; font-size: 9px; padding: 2px 6px; border-radius: 10px; color: white; display: flex; align-items: center; gap: 2px; font-weight: 600;">
              ${metrics.visibilityTrend.arrow} ${Math.abs(metrics.visibilityTrend.change).toFixed(0)}%
            </span>
          </div>
        ` : ''}
      </div>
    </div>
    
    <!-- ROAS Badge -->
    <div class="roas-badge" style="width: 60px; height: 60px; background-color: #fff; border: 2px solid #ddd; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; flex-shrink: 0;">
      <div style="font-size: 11px; color: #999;">-</div>
    </div>
    
    <!-- Product Image -->
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         style="width: 60px; height: 60px; object-fit: contain; border-radius: 4px; flex-shrink: 0;"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/60?text=No+Image';">
    
    <!-- Product Title -->
    <div class="small-ad-title" style="flex: 1; font-size: 14px; line-height: 1.4; word-wrap: break-word;">${title}</div>
    
    <!-- Metrics placeholder -->
    <div style="width: 200px; display: flex; gap: 15px; padding: 8px 15px; background: #f8f9fa; border-radius: 8px; align-items: center; justify-content: center;">
      <span style="font-size: 11px; color: #999;">Metrics loading...</span>
    </div>
  `;
  
  // Add click handler (no functionality for now)
  productDiv.addEventListener('click', function() {
    console.log('[Campaign Product] Clicked:', product.title);
    // Functionality to be added later
  });
  
  return productDiv;
}

// Helper function to get rating badge color
function getGoogleAdsRatingBadgeColor(rating) {
  if (rating >= 1 && rating <= 3) return '#4CAF50'; // Green
  if (rating >= 4 && rating <= 8) return '#FFC107'; // Yellow
  if (rating >= 9 && rating <= 14) return '#FF9800'; // Orange
  return '#F44336'; // Red
}

// Helper function to get project table prefix
function getProjectTablePrefix() {
  const accountPrefix = window.currentAccount || 'acc1';
  const currentProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
  return `${accountPrefix}_pr${currentProjectNum}_`;
}

// Render empty state
function renderEmptyCampaignsState() {
  const container = document.getElementById('campaigns_overview_container');
  if (!container) return;
  
  container.innerHTML = `
    <div class="campaigns-empty-state" style="height: 100%; display: flex; align-items: center; justify-content: center;">
      <div style="text-align: center;">
        <div class="campaigns-empty-icon" style="font-size: 64px; margin-bottom: 20px;">📊</div>
        <div class="campaigns-empty-title" style="font-size: 24px; font-weight: 600; margin-bottom: 10px;">No Campaigns Data Available</div>
        <div class="campaigns-empty-text" style="font-size: 16px; color: #666;">Campaign data will appear here once it's available in the system</div>
      </div>
    </div>
  `;
}

// Export initialization function
window.initializeCampaignsSection = initializeCampaignsSection;
