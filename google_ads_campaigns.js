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
        flex-direction: column;
        padding: 10px;
        transition: all 0.2s;
        gap: 8px;
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
  width: 1250px;
  max-width: 1250px;
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
.camp-table-modern td:nth-child(5) { width: 220px; } /* Product Title */
      
/* All metric columns - max 70px */
.camp-table-modern th.metric-col,
.camp-table-modern td.metric-col { 
  width: 70px;
  max-width: 70px;
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
  height: 90px;
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
  height: 90px;
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
  font-size: 12px;
  font-weight: 500;
  color: #212529;
  line-height: 1.4;
  word-break: break-word;
  overflow-wrap: break-word;
  max-height: 52px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  margin-bottom: 4px;
}

/* Product status badge - smaller size */
.product-status-badge {
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 8px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  display: inline-flex;
  align-items: center;
  margin-top: 4px;
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
/* Campaign Analysis Container Styles */
.campaign-analysis-container {
  height: 350px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-bottom: 15px;
  padding: 15px;
  display: flex;
  gap: 12px;
}

.campaign-analysis-section {
  flex: 1;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.campaign-analysis-section-header {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

/* Searches section specific styles */
.campaign-searches-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  overflow-y: auto;
}

.campaign-search-bucket-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 6px;
  background: white;
  border-radius: 4px;
  min-height: 28px;
}

.campaign-search-bucket-count {
  width: 40px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: white;
  flex-shrink: 0;
}

.campaign-search-bucket-name {
  width: 80px;
  font-size: 11px;
  font-weight: 600;
  color: #333;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.campaign-search-bucket-bar {
  flex: 1;
  height: 18px;
  background: #e5e7eb;
  border-radius: 9px;
  position: relative;
  overflow: hidden;
}

.campaign-search-bucket-bar-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  transition: width 0.3s ease;
}

.campaign-search-bucket-bar-text {
  position: absolute;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  color: #374151;
  z-index: 1;
}
/* Ensure all metric bar fills have transitions */
.camp-metric-bar-fill,
.camp-share-fill,
.campaign-search-bucket-bar-fill,
.bucket-coverage-bar,
.clicks-bar-fill,
.revenue-bar-fill,
.value-bar-fill,
.cost-bar-fill,
.roas-bar-fill,
.analysis-bar-fill {
  transition: width 0.3s ease !important;
}

/* Smooth number transitions */
.bucket-count,
.bucket-coverage-text,
.clicks-bar-text,
.revenue-bar-text,
.value-bar-text,
.cost-bar-text,
.roas-bar-text,
.camp-metric-value,
.camp-metric-percent {
  transition: opacity 0.2s ease;
}
/* Analysis container bar transitions */
.campaign-search-bucket-bar-fill {
  transition: width 0.3s ease !important;
}

.campaign-search-bucket-count,
.campaign-search-bucket-bar-text,
.campaign-roas-value {
  transition: all 0.3s ease !important;
}

/* Prevent layout shifts during updates */
.campaign-search-bucket-row {
  min-height: 28px;
  transition: background-color 0.2s ease;
}

.campaign-search-bucket-row:hover {
  background: rgba(0, 122, 255, 0.05);
}

/* Efficiency metrics container */
.efficiency-metrics-grid {
  height: 100%;
  overflow-y: auto;
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
  
// Load ROAS, cost and efficiency metrics for all campaigns first
  const campaignsWithMetrics = await Promise.all(window.campaignsData.map(async (campaign) => {
    const basicMetrics = await calculateCampaignMetrics(campaign.channelType, campaign.campaignName);
    const efficiencyMetrics = await calculateCampaignEfficiencyMetrics(campaign.channelType, campaign.campaignName);
    return { 
      ...campaign, 
      roas: basicMetrics.roas, 
      cost: basicMetrics.cost,
      efficiency: efficiencyMetrics
    };
  }));

  // Calculate total cost for percentage calculation
  const totalCost = campaignsWithMetrics.reduce((sum, c) => sum + (c.cost || 0), 0);
  
  // Add cost percentage to each campaign
  campaignsWithMetrics.forEach(campaign => {
    campaign.costPercent = totalCost > 0 ? (campaign.cost / totalCost * 100) : 0;
  });

  // Update global data with metrics
  window.campaignsData = campaignsWithMetrics;

  // Group campaigns by type with ROAS
  const pmaxCampaigns = campaignsWithMetrics.filter(c => c.channelType === 'PERFORMANCE_MAX');
  const shoppingCampaigns = campaignsWithMetrics.filter(c => c.channelType === 'SHOPPING');
  
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

// Add view switcher event handlers
viewSwitcher.querySelectorAll('.campaigns-view-tab').forEach(tab => {
  tab.addEventListener('click', function() {
    // Update active state
    viewSwitcher.querySelectorAll('.campaigns-view-tab').forEach(t => t.classList.remove('active'));
    this.classList.add('active');
    
    const view = this.getAttribute('data-view');
    
    if (view === 'products') {
      productsPanel.style.display = 'flex';
      searchTermsPanel.style.display = 'none';
      const prodAnalysis = document.getElementById('campaignAnalysisContainer');
      if (prodAnalysis) prodAnalysis.style.display = 'flex';
      const searchAnalysis = document.getElementById('campaignAnalysisContainerSearchTerms');
      if (searchAnalysis) searchAnalysis.style.display = 'none';
      
      // Keep products analysis populated if data exists
      if (window.campaignProductsOriginalData) {
        const productBucketStats = calculateProductBucketStatistics(window.campaignProductsOriginalData);
        populateProductsAnalysis(productBucketStats);
      }
    } else if (view === 'search-terms') {
      productsPanel.style.display = 'none';
      searchTermsPanel.style.display = 'flex';
      const prodAnalysis = document.getElementById('campaignAnalysisContainer');
      if (prodAnalysis) prodAnalysis.style.display = 'none';
      const searchAnalysis = document.getElementById('campaignAnalysisContainerSearchTerms');
      if (searchAnalysis) searchAnalysis.style.display = 'flex';
      
      // Load search terms if campaign is selected
      if (window.selectedCampaign) {
        loadCampaignSearchTerms(
          window.selectedCampaign.channelType,
          window.selectedCampaign.campaignName
        );
      }
      
      // Keep products analysis populated consistently
      if (window.campaignProductsOriginalData) {
        const productBucketStats = calculateProductBucketStatistics(window.campaignProductsOriginalData);
        populateProductsAnalysis(productBucketStats);
      }
    }
  });
});

  // Initialize both analyses if campaign is already selected  <--- ADD THIS NEW CODE HERE
  if (window.selectedCampaign && window.campaignProductsOriginalData) {
    const productBucketStats = calculateProductBucketStatistics(window.campaignProductsOriginalData);
    populateProductsAnalysis(productBucketStats);
  }
  
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
<div class="campaign-analysis-container" id="campaignAnalysisContainer">
<div class="campaign-analysis-section" id="campaignAnalysisEfficiency">
      <div class="campaign-analysis-section-header">Efficiency</div>
      <div class="efficiency-metrics-grid" id="efficiencyMetricsContent">
        <!-- Will be populated dynamically -->
      </div>
    </div>
<div class="campaign-analysis-section" id="campaignAnalysisProducts">
      <div class="campaign-analysis-section-header" style="display: flex; align-items: center; justify-content: space-between;">
        <span>Products</span>
      </div>
      <div class="campaign-searches-content" id="campaignProductsContent">
        <!-- Will be populated dynamically -->
      </div>
    </div>
    <div class="campaign-analysis-section" id="campaignAnalysisSearches">
      <div class="campaign-analysis-section-header" style="display: flex; align-items: center; justify-content: space-between;">
  <span>Searches</span>
</div>
      <div class="campaign-searches-content" id="campaignSearchesContent">
        <!-- Will be populated dynamically -->
      </div>
    </div>
  </div>
  
  <div class="campaigns-products-header" style="padding: 15px 20px; flex-direction: column; gap: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
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
    
<div id="campaignProductBucketFilterContainer" style="display: none; width: 100%; padding: 15px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
        <!-- All Products -->
        <div class="product-bucket-card" data-bucket="all" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: #007aff; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">All</div>
                <div style="font-size: 13px; color: #333;">Products</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- Profit Stars -->
        <div class="product-bucket-card" data-bucket="Profit Stars" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: linear-gradient(135deg, #FFD700, #FFA500); color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Profit</div>
                <div style="font-size: 13px; color: #333;">Stars</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- Strong Performers -->
        <div class="product-bucket-card" data-bucket="Strong Performers" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: linear-gradient(135deg, #4CAF50, #45a049); color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Strong</div>
                <div style="font-size: 13px; color: #333;">Performers</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- Steady Contributors -->
        <div class="product-bucket-card" data-bucket="Steady Contributors" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: linear-gradient(135deg, #2196F3, #1976D2); color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Steady</div>
                <div style="font-size: 13px; color: #333;">Contributors</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- Break-Even Products -->
        <div class="product-bucket-card" data-bucket="Break-Even Products" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: linear-gradient(135deg, #FF9800, #F57C00); color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Break-Even</div>
                <div style="font-size: 13px; color: #333;">Products</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- True Losses -->
        <div class="product-bucket-card" data-bucket="True Losses" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: linear-gradient(135deg, #F44336, #D32F2F); color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">True</div>
                <div style="font-size: 13px; color: #333;">Losses</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
        <!-- Insufficient Data -->
        <div class="product-bucket-card" data-bucket="Insufficient Data" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
            <div style="background: #9E9E9E; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
              <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
              <div class="bucket-coverage-container" style="width: 100%;">
                <div style="width: 100%; height: 14px; background: rgba(255,255,255,0.3); border-radius: 7px; position: relative; overflow: hidden;">
                  <div class="bucket-coverage-bar" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: rgba(255,255,255,0.8); transition: width 0.3s ease;"></div>
                  <div class="bucket-coverage-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.3); z-index: 1;">0%</div>
                </div>
              </div>
            </div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Insufficient</div>
                <div style="font-size: 13px; color: #333;">Data</div>
              </div>
            </div>
          </div>
          <div class="bucket-metrics" style="margin-top: 8px; display: flex; flex-direction: column; gap: 4px; padding: 0 8px;">
            <!-- Metrics bars will be populated dynamically -->
          </div>
        </div>
      </div>
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
<div class="campaign-analysis-container" id="campaignAnalysisContainerSearchTerms" style="display: none;">
    <!-- Same analysis container structure as products panel -->
<div class="campaign-analysis-section" id="campaignAnalysisEfficiencySearchTerms">
      <div class="campaign-analysis-section-header">Efficiency</div>
      <div class="efficiency-metrics-grid" id="efficiencyMetricsContentSearchTerms">
        <!-- Will be populated dynamically -->
      </div>
    </div>
<div class="campaign-analysis-section" id="campaignAnalysisProductsSearchTerms">
<div class="campaign-analysis-section-header" style="display: flex; align-items: center; justify-content: space-between;">
  <span>Products</span>
  ${window.productsEfficiencyMetrics ? `
    <div style="display: flex; gap: 6px;">
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}22;
        border: 1px solid ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)};
      ">
        AA:${window.productsEfficiencyMetrics.aa.toFixed(2)}
      </div>
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}22;
        border: 1px solid ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)};
      ">
        WR:${(window.productsEfficiencyMetrics.wr * 100).toFixed(0)}%
      </div>
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}22;
        border: 1px solid ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)};
      ">
        TM:${(window.productsEfficiencyMetrics.tm * 100).toFixed(0)}%
      </div>
    </div>
  ` : ''}
</div>
      <div class="campaign-searches-content" id="campaignProductsContentSearchTerms">
        <!-- Will be populated dynamically -->
      </div>
    </div>
    <div class="campaign-analysis-section" id="campaignAnalysisSearchesSearchTerms">
      <div class="campaign-analysis-section-header" style="display: flex; align-items: center; justify-content: space-between;">
  <span>Searches</span>
  ${window.searchesEfficiencyMetrics ? `
    <div style="display: flex; gap: 6px;">
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}22;
        border: 1px solid ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)};
      ">
        AA:${window.searchesEfficiencyMetrics.aa.toFixed(2)}
      </div>
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}22;
        border: 1px solid ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)};
      ">
        WR:${(window.searchesEfficiencyMetrics.wr * 100).toFixed(0)}%
      </div>
      <div style="
        padding: 2px 6px;
        background: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}22;
        border: 1px solid ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}44;
        border-radius: 4px;
        font-size: 9px;
        font-weight: 600;
        color: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)};
      ">
        TM:${(window.searchesEfficiencyMetrics.tm * 100).toFixed(0)}%
      </div>
    </div>
  ` : ''}
</div>
      <div class="campaign-searches-content" id="campaignSearchesContentSearchTerms">
        <!-- Will be populated dynamically -->
      </div>
    </div>
  </div>
  <div class="campaigns-search-terms-header" style="padding: 15px 20px; flex-direction: column; gap: 12px;">
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <div>
        <h3 class="campaigns-products-title">Campaign Search Terms</h3>
        <div class="selected-campaign-info">Select a campaign to view its search terms</div>
      </div>
      <div style="padding: 6px 12px; background: #f0f2f5; border: 1px solid #ddd; border-radius: 6px; font-size: 12px; color: #666; display: flex; align-items: center; gap: 6px;">
        <span>📅</span>
        <span>${dateRangeText}</span>
      </div>
    </div>
    <div id="campaignBucketFilterContainer" style="display: none; width: 100%; padding: 15px 0;">
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 10px;">
        <!-- All Terms -->
        <div class="bucket-card" data-bucket="all" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #007aff; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">All Search</div>
                <div style="font-size: 13px; color: #333;">Terms</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- Top Search Terms -->
        <div class="bucket-card" data-bucket="Top Search Terms" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #FFC107; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Top Search</div>
                <div style="font-size: 13px; color: #333;">Terms</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- Zero Converting Terms -->
        <div class="bucket-card" data-bucket="Zero Converting Terms" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #F44336; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Zero Converting</div>
                <div style="font-size: 13px; color: #333;">Terms</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- High Revenue Terms -->
        <div class="bucket-card" data-bucket="High Revenue Terms" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #4CAF50; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">High Revenue</div>
                <div style="font-size: 13px; color: #333;">Terms</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- Hidden Gems -->
        <div class="bucket-card" data-bucket="Hidden Gems" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #2196F3; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Hidden</div>
                <div style="font-size: 13px; color: #333;">Gems</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- Low Performance -->
        <div class="bucket-card" data-bucket="Low Performance" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #9E9E9E; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Low</div>
                <div style="font-size: 13px; color: #333;">Performance</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
        <!-- Mid-Performance -->
        <div class="bucket-card" data-bucket="Mid-Performance" style="cursor: pointer;">
          <div class="bucket-box" style="display: flex; height: 60px; border-radius: 6px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border: 2px solid transparent;">
<div style="background: #FF9800; color: white; width: 60px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; flex-direction: column; padding: 8px 4px; gap: 4px;">
  <div class="bucket-count" style="font-size: 24px; font-weight: 700; line-height: 1;">0</div>
  <div class="bucket-coverage-container" style="width: 100%; display: none;">
    <div style="
      width: 100%;
      height: 14px;
      background: rgba(255,255,255,0.3);
      border-radius: 7px;
      position: relative;
      overflow: hidden;
    ">
      <div class="bucket-coverage-bar" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: rgba(255,255,255,0.8);
        transition: width 0.3s ease;
      "></div>
      <div class="bucket-coverage-text" style="
        position: absolute;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 9px;
        font-weight: 600;
        color: white;
        text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        z-index: 1;
      ">0%</div>
    </div>
  </div>
</div>
            <div style="background: white; flex: 1; display: flex; align-items: center; padding: 0 15px;">
              <div>
                <div style="font-size: 13px; font-weight: 600; color: #333;">Mid</div>
                <div style="font-size: 13px; color: #333;">Performance</div>
              </div>
            </div>
          </div>
<div class="bucket-metrics" style="
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0 8px;
">
  <!-- % of Clicks Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="clicks-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #1e40af;
        transition: width 0.3s ease;
      "></div>
      <div class="clicks-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="clicks-trend" style="width: 32px;"></div>
  </div>
  
  <!-- % of Revenue Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="revenue-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #059669;
        transition: width 0.3s ease;
      "></div>
      <div class="revenue-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">0%</div>
    </div>
    <div class="revenue-trend" style="width: 32px;"></div>
  </div>
  
  <!-- Value Bar -->
  <div style="display: flex; align-items: center; gap: 6px;">
    <div style="
      flex: 1;
      height: 16px;
      background: #e5e7eb;
      border-radius: 3px;
      position: relative;
      overflow: hidden;
    ">
      <div class="value-bar-fill" style="
        position: absolute;
        left: 0;
        top: 0;
        height: 100%;
        width: 0%;
        background: #f59e0b;
        transition: width 0.3s ease;
      "></div>
      <div class="value-bar-text" style="
        position: absolute;
        left: 6px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        z-index: 1;
      ">$0</div>
    </div>
    <div class="value-trend" style="width: 32px;"></div>
  </div>
</div>
        </div>
      </div>
    </div>
  </div>

<!-- REPLACE THE LEGEND SECTION WITH THIS -->
<div style="
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding: 8px 15px;
  background: #f9fafb;
  border-radius: 6px;
">
  <div style="
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  ">
    <div style="width: 8px; height: 8px; background: #1e40af; border-radius: 2px;"></div>
    % of Clicks
  </div>
  <div style="
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  ">
    <div style="width: 8px; height: 8px; background: #059669; border-radius: 2px;"></div>
    % of Revenue
  </div>
  <div style="
    font-size: 12px;
    font-weight: 600;
    color: #374151;
    display: flex;
    align-items: center;
    gap: 8px;
  ">
    <div style="width: 8px; height: 8px; background: #f59e0b; border-radius: 2px;"></div>
    Value
  </div>
</div>
<!-- END OF LEGEND SECTION -->
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
  { id: 'impressions', label: 'Impressions', visible: false },
  { id: 'clicks', label: 'Clicks', visible: true },
  { id: 'ctr', label: 'CTR %', visible: false },
  { id: 'avgCpc', label: 'Avg CPC', visible: false },
  { id: 'cost', label: 'Cost', visible: true },
  { id: 'conversions', label: 'Conv', visible: false },
  { id: 'cpa', label: 'CPA', visible: false },
  { id: 'convValue', label: 'Revenue', visible: true },
  { id: 'cvr', label: 'CVR %', visible: false },
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
  const costPercent = campaign.costPercent || 0;
  
  // Get efficiency metrics and score components
  const efficiency = campaign.efficiency || {};
  const effScore = efficiency.efficiencyScore || { 
    score: 0, 
    status: { text: 'N/A', color: '#999' },
    components: { roas: 0, allocation: 0, waste: 0 }
  };

  // Determine ROAS badge color
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
  
  // Get score components colors
  const roasScoreColor = effScore.components.roas >= 20 ? '#22c55e' : 
                         effScore.components.roas >= 10 ? '#eab308' : '#ef4444';
  const allocScoreColor = effScore.components.allocation >= 30 ? '#22c55e' : 
                          effScore.components.allocation >= 20 ? '#eab308' : '#ef4444';
  const wasteScoreColor = effScore.components.waste >= 15 ? '#22c55e' : 
                          effScore.components.waste >= 10 ? '#eab308' : '#ef4444';

item.innerHTML = `
    <div class="campaign-card-details">
      <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
        <div class="campaign-type-badge ${badgeClass}" style="background: ${roasBackground}; font-size: 14px; font-weight: 700; line-height: 1;">
          ${roas > 0 ? roas.toFixed(1) + 'x' : '0x'}
        </div>
        <div class="campaign-info" style="flex: 1;">
          <div class="campaign-name" style="font-size: 13px;">${campaign.campaignName}</div>
          <div class="campaign-meta">
            <div class="campaign-products-count">
              <span>📦</span>
              <span style="font-size: 11px;">${campaign.products.size} products</span>
            </div>
          </div>
        </div>
        
        <!-- Stack Score and Cost bar vertically with proper alignment -->
        <div style="display: flex; flex-direction: column; gap: 3px; align-items: center; width: 80px;">
          <!-- Overall Score Badge -->
          <div style="
            background: ${effScore.status.color}22;
            border: 1px solid ${effScore.status.color}44;
            border-radius: 6px;
            padding: 2px 10px;
            text-align: center;
            display: flex;
            align-items: center;
            gap: 4px;
            width: fit-content;
          ">
            <span style="font-size: 9px; color: #6b7280; font-weight: 500;">SCORE</span>
            <span style="font-size: 13px; font-weight: 700; color: ${effScore.status.color};">
              ${effScore.score}
            </span>
          </div>
          
          <!-- Cost container with label -->
          <div style="display: flex; align-items: center; gap: 4px; width: 100%;">
            <span style="font-size: 8px; color: #9ca3af; font-weight: 500; white-space: nowrap;">Cost</span>
            <div style="
              flex: 1;
              height: 10px;
              background: rgba(229, 231, 235, 0.8);
              border-radius: 5px;
              overflow: hidden;
              position: relative;
            ">
              <div style="
                position: absolute;
                left: 0;
                top: 0;
                height: 100%;
                width: ${Math.min(costPercent, 100)}%;
                background: linear-gradient(90deg, #dc2626 0%, #ef4444 100%);
                transition: width 0.3s ease;
              "></div>
              <div style="
                position: absolute;
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 7px;
                font-weight: 600;
                color: ${costPercent > 50 ? 'white' : '#374151'};
                text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                z-index: 1;
              ">
                ${costPercent.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Store efficiency metrics on the element for later use
  item.campaignEfficiency = campaign.efficiency;
  
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
      
      // Get stored efficiency metrics from the campaign item
      const storedEfficiency = this.campaignEfficiency;
      
      // Update selected campaign
      window.selectedCampaign = {
        channelType: channelType,
        campaignName: campaignName,
        key: campaignKey,
        efficiency: storedEfficiency // Store the pre-calculated efficiency
      };
      
      // Check current view and load appropriate data
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

// Load product profitability bucket from 30d bucket table
async function loadProductProfitabilityBuckets(productTitles) {
  console.log('[loadProductProfitabilityBuckets] Loading profitability buckets for products:', productTitles.length);
  
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
      console.warn('[loadProductProfitabilityBuckets] No bucket data found');
      return new Map();
    }
    
    // Process data: find profitability bucket for each product
    const profitabilityMap = new Map();
    
    result.data.forEach(row => {
      const title = row['Product Title'];
      const campaignName = row['Campaign Name'];
      const device = row['Device'];
      const profitabilityBucket = row['PROFITABILITY_BUCKET'];
      
      // Check if this matches our criteria (All+All records)
      if (productTitles.includes(title) && 
          campaignName === 'All' && 
          device === 'All' && 
          profitabilityBucket) {
        try {
          const bucketData = typeof profitabilityBucket === 'string' ? 
            JSON.parse(profitabilityBucket) : profitabilityBucket;
          profitabilityMap.set(title, bucketData);
          console.log(`[loadProductProfitabilityBuckets] Found bucket for ${title}: ${bucketData.value}`);
        } catch (e) {
          console.warn(`[loadProductProfitabilityBuckets] Failed to parse bucket for ${title}:`, e);
        }
      }
    });
    
    return profitabilityMap;
    
  } catch (error) {
    console.error('[loadProductProfitabilityBuckets] Error loading profitability buckets:', error);
    return new Map();
  }
}

// Calculate campaign metrics from bucket data
async function calculateCampaignMetrics(channelType, campaignName) {
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
      return { roas: 0, cost: 0 };
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
    
    return {
      roas: totalCost > 0 ? (totalRevenue / totalCost) : 0,
      cost: totalCost
    };
    
  } catch (error) {
    console.error('[calculateCampaignMetrics] Error:', error);
    return { roas: 0, cost: 0 };
  }
}

// Calculate efficiency metrics for a specific campaign
async function calculateCampaignEfficiencyMetrics(channelType, campaignName) {
  try {
    const tablePrefix = getProjectTablePrefix();
    const productBucketsTable = `${tablePrefix}googleSheets_productBuckets_30d`;
    const searchTermsTable = `${tablePrefix}googleSheets_searchTerms_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    
    // Get product buckets data
    const productBucketsRequest = objectStore.get(productBucketsTable);
    const productBucketsResult = await new Promise((resolve, reject) => {
      productBucketsRequest.onsuccess = () => resolve(productBucketsRequest.result);
      productBucketsRequest.onerror = () => reject(productBucketsRequest.error);
    });
    
    // Get search terms data
    const searchTermsRequest = objectStore.get(searchTermsTable);
    const searchTermsResult = await new Promise((resolve, reject) => {
      searchTermsRequest.onsuccess = () => resolve(searchTermsRequest.result);
      searchTermsRequest.onerror = () => reject(searchTermsRequest.error);
    });
    
    db.close();
    
    // Calculate product bucket statistics for this campaign
    const productStats = {
      'all': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'Profit Stars': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'Strong Performers': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'Steady Contributors': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'Break-Even Products': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'True Losses': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
      'Insufficient Data': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 }
    };
    
    if (productBucketsResult && productBucketsResult.data) {
      const uniqueProducts = new Set();
      
      productBucketsResult.data.forEach(row => {
        if (row['Campaign Name'] === campaignName && row['Channel Type'] === channelType) {
          const productKey = `${row['Product Title']}_${row['Campaign Name']}`;
          
          // Count unique products for buckets
          if (row['Device'] === 'All' && !uniqueProducts.has(productKey)) {
            uniqueProducts.add(productKey);
            
            let bucketValue = 'Insufficient Data';
            if (row['PROFITABILITY_BUCKET']) {
              try {
                const bucketData = typeof row['PROFITABILITY_BUCKET'] === 'string' ? 
                  JSON.parse(row['PROFITABILITY_BUCKET']) : row['PROFITABILITY_BUCKET'];
                bucketValue = bucketData.value || 'Insufficient Data';
              } catch (e) {
                // Silent fail
              }
            }
            
            if (productStats[bucketValue]) {
              productStats[bucketValue].count++;
            }
          }
          
          // Aggregate metrics
          const cost = parseFloat(row['Cost']) || 0;
          const revenue = parseFloat(row['ConvValue']) || 0;
          
          productStats['all'].cost += cost;
          productStats['all'].revenue += revenue;
          
          // Also add to specific bucket
          let bucketValue = 'Insufficient Data';
          if (row['PROFITABILITY_BUCKET']) {
            try {
              const bucketData = typeof row['PROFITABILITY_BUCKET'] === 'string' ? 
                JSON.parse(row['PROFITABILITY_BUCKET']) : row['PROFITABILITY_BUCKET'];
              bucketValue = bucketData.value || 'Insufficient Data';
            } catch (e) {
              // Silent fail
            }
          }
          
          if (productStats[bucketValue]) {
            productStats[bucketValue].cost += cost;
            productStats[bucketValue].revenue += revenue;
          }
        }
      });
      
      // Set count for 'all'
      productStats['all'].count = uniqueProducts.size;
    }
    
    // Calculate percentages
    for (let bucket in productStats) {
      const bucketData = productStats[bucket];
      bucketData.costPercent = productStats['all'].cost > 0 ? (bucketData.cost / productStats['all'].cost * 100) : 0;
      bucketData.revenuePercent = productStats['all'].revenue > 0 ? (bucketData.revenue / productStats['all'].revenue * 100) : 0;
      bucketData.roas = bucketData.cost > 0 ? (bucketData.revenue / bucketData.cost) : 0;
    }
    
    // Calculate search terms bucket statistics
    const searchStats = {
      'all': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'Top Search Terms': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'High Revenue Terms': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'Hidden Gems': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'Mid-Performance': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'Low Performance': { count: 0, clicks: 0, revenue: 0, value: 0 },
      'Zero Converting Terms': { count: 0, clicks: 0, revenue: 0, value: 0 }
    };
    
    if (searchTermsResult && searchTermsResult.data) {
      // Ensure performance buckets are loaded
      if (!window.searchTermPerformanceBuckets) {
        await ensureSearchTermPerformanceBuckets();
      }
      
      searchTermsResult.data.forEach(item => {
        if (item.Campaign_Name === campaignName && item.Query && item.Query.toLowerCase() !== 'blank') {
          const queryLower = item.Query.toLowerCase();
          const bucket = window.searchTermPerformanceBuckets ? 
            window.searchTermPerformanceBuckets[queryLower] || 'Mid-Performance' : 
            'Mid-Performance';
          
          const clicks = item.Clicks || 0;
          const value = item.Value || 0;
          
          searchStats['all'].count++;
          searchStats['all'].clicks += clicks;
          searchStats['all'].revenue += value;
          searchStats['all'].value += value;
          
          if (searchStats[bucket]) {
            searchStats[bucket].count++;
            searchStats[bucket].clicks += clicks;
            searchStats[bucket].revenue += value;
            searchStats[bucket].value += value;
          }
        }
      });
    }
    
    // Calculate percentages for search stats
    for (let bucket in searchStats) {
      const bucketData = searchStats[bucket];
      bucketData.clicksPercent = searchStats['all'].clicks > 0 ? (bucketData.clicks / searchStats['all'].clicks * 100) : 0;
      bucketData.revenuePercent = searchStats['all'].revenue > 0 ? (bucketData.revenue / searchStats['all'].revenue * 100) : 0;
    }
    
    // Calculate efficiency metrics
    const productsMetrics = calculateProductsEfficiencyMetrics(productStats);
    const searchesMetrics = calculateSearchesEfficiencyMetrics(searchStats);
    const efficiencyScore = calculateEfficiencyScore(productsMetrics, searchesMetrics);
    
    return {
      productsMetrics,
      searchesMetrics,
      efficiencyScore,
      totalROAS: productsMetrics.totalROAS,
      allocationIndex: (productsMetrics.aa + searchesMetrics.aa) / 2,
      wasteRate: (productsMetrics.wr + searchesMetrics.wr) / 2
    };
    
  } catch (error) {
    console.error('[calculateCampaignEfficiencyMetrics] Error:', error);
    return {
      efficiencyScore: { score: 0, status: { text: 'N/A', color: '#999' } },
      totalROAS: 0,
      allocationIndex: 0,
      wasteRate: 0
    };
  }
}

// Keep the old function for backward compatibility
async function calculateCampaignROAS(channelType, campaignName) {
  const metrics = await calculateCampaignMetrics(channelType, campaignName);
  return metrics.roas;
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

// Don't destroy the products analysis content - just update the header
const productsContainer = document.getElementById('campaignAnalysisProducts');
if (productsContainer) {
  const header = productsContainer.querySelector('.campaign-analysis-section-header');
  if (header) {
    // Only update the span text, not the entire header content
    const textSpan = header.querySelector('span');
    if (textSpan) {
      textSpan.textContent = 'Products';
    }
  }
  // Don't clear the content - keep existing structure for animation
}

  // Load search terms data in the background for analysis containers
  loadCampaignSearchTermsForAnalysis(channelType, campaignName);
  
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

// Load profitability bucket data for products
const profitabilityBucketMap = await loadProductProfitabilityBuckets(productTitles);

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

  // Add profitability bucket to aggregated data
  aggregated.profitabilityBucket = profitabilityBucketMap.get(productTitle) || { value: 'Insufficient Data' };
  
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

    // Store original data for filtering
    window.campaignProductsOriginalData = tableData;
    window.campaignProductsCurrentFilter = 'all';
    
// Calculate and display product bucket statistics
    const productBucketStats = calculateProductBucketStatistics(tableData);
    
    // Populate the products analysis section
    populateProductsAnalysis(productBucketStats);
    
    // Show and setup product bucket filter
    const productBucketFilterContainer = document.getElementById('campaignProductBucketFilterContainer');
    
    if (productBucketFilterContainer) {
      productBucketFilterContainer.style.display = 'block';
      
      // Update UI with statistics
      updateProductBucketUI(productBucketStats);
      
      // Get all bucket cards
      const bucketCards = productBucketFilterContainer.querySelectorAll('.product-bucket-card');
      
      // Add click handlers
      bucketCards.forEach(card => {
        card.addEventListener('click', function() {
          const selectedBucket = this.getAttribute('data-bucket');
          
          // Update visual state of cards
          bucketCards.forEach(c => {
            const box = c.querySelector('.bucket-box');
            if (c === this) {
              // Active state - add border
              box.style.borderColor = '#007aff';
              box.style.borderWidth = '2px';
              box.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            } else {
              // Inactive state
              box.style.borderColor = 'transparent';
              box.style.borderWidth = '2px';
              box.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          });
          
          if (selectedBucket === 'all') {
            // Reset to original data
            renderProductsTable(tableContainer, window.campaignProductsOriginalData, campaignName);
            headerInfo.textContent = `${campaignName} - ${window.campaignProductsOriginalData.length} products`;
} else {
            // Filter by profitability bucket
            const filtered = window.campaignProductsOriginalData.filter(product => {
              let bucketValue = 'Insufficient Data';
              if (product.profitabilityBucket) {
                try {
                  const bucketData = typeof product.profitabilityBucket === 'string' ? 
                    JSON.parse(product.profitabilityBucket) : product.profitabilityBucket;
                  bucketValue = bucketData.value || 'Insufficient Data';
                } catch (e) {
                  // Silent fail
                }
              }
              return bucketValue === selectedBucket;
            });
            renderProductsTable(tableContainer, filtered, campaignName);
            
            // Update header with filter info
            const bucketName = selectedBucket.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            headerInfo.textContent = `${campaignName} - ${filtered.length} products (${bucketName})`;
          }
          
          window.campaignProductsCurrentFilter = selectedBucket;
        });
      });
      
      // Click the "all" card by default to show selected state
      const allCard = productBucketFilterContainer.querySelector('[data-bucket="all"]');
      if (allCard) {
        allCard.click();
      }
    }
    
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
    
// Ensure performance buckets are loaded
await ensureSearchTermPerformanceBuckets();

// Filter search terms for this specific campaign
const filteredData = searchTermsResult.data.filter(item => 
  item.Campaign_Name === campaignName && 
  item.Query && 
  item.Query.toLowerCase() !== 'blank'
).map(item => {
  // Add Top_Bucket, performance bucket and trend data
  const queryLower = item.Query.toLowerCase();
  return {
    ...item,
    Top_Bucket: topBucketMap[queryLower] || '',
    Trend_Data: trend90dMap[queryLower] || null,
    Performance_Bucket: window.searchTermPerformanceBuckets ? 
      window.searchTermPerformanceBuckets[queryLower] || 'Mid-Performance' : 
      'Mid-Performance'
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

// Store original data for filtering
    window.campaignSearchTermsOriginalData = filteredData;
    window.campaignSearchTermsCurrentFilter = 'all';
    
    // Calculate and display bucket statistics
    const bucketStats = calculateBucketStatistics(filteredData);
    
    // Show and setup bucket filter
    const bucketFilterContainer = document.getElementById('campaignBucketFilterContainer');
    if (bucketFilterContainer) {
      bucketFilterContainer.style.display = 'block';
      
      // Update UI with statistics
      updateBucketUI(bucketStats);
      
      // Populate searches analysis section
populateSearchesAnalysis(bucketStats);
      
      // Get all bucket cards
      const bucketCards = bucketFilterContainer.querySelectorAll('.bucket-card');
      
      // Add click handlers
      bucketCards.forEach(card => {
        card.addEventListener('click', function() {
          const selectedBucket = this.getAttribute('data-bucket');
          
          // Update visual state of cards
          bucketCards.forEach(c => {
            const box = c.querySelector('.bucket-box');
            if (c === this) {
              // Active state - add border
              box.style.borderColor = box.style.backgroundColor;
              box.style.borderWidth = '2px';
              box.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            } else {
              // Inactive state
              box.style.borderColor = 'transparent';
              box.style.borderWidth = '2px';
              box.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }
          });
          
          if (selectedBucket === 'all') {
            // Reset to original data
            renderCampaignSearchTermsTable(tableContainer, window.campaignSearchTermsOriginalData, campaignName);
            headerInfo.textContent = `${campaignName} - ${window.campaignSearchTermsOriginalData.length} search terms`;
          } else {
            // Filter by Performance_Bucket
            const filtered = window.campaignSearchTermsOriginalData.filter(term => 
              term.Performance_Bucket === selectedBucket
            );
            renderCampaignSearchTermsTable(tableContainer, filtered, campaignName);
            headerInfo.textContent = `${campaignName} - ${filtered.length} search terms (${selectedBucket})`;
          }
          
          window.campaignSearchTermsCurrentFilter = selectedBucket;
        });
      });
      
      // Click the "all" card by default to show selected state
      const allCard = bucketFilterContainer.querySelector('[data-bucket="all"]');
      if (allCard) {
        allCard.click();
      }
    }
    
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

// Load search terms data just for analysis containers (background load)
async function loadCampaignSearchTermsForAnalysis(channelType, campaignName) {
  try {
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
    
    // Create map of 90d data for trends
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
    
    // Ensure performance buckets are loaded
    await ensureSearchTermPerformanceBuckets();
    
    // Filter search terms for this specific campaign
    const filteredData = searchTermsResult.data.filter(item => 
      item.Campaign_Name === campaignName && 
      item.Query && 
      item.Query.toLowerCase() !== 'blank'
    ).map(item => {
      const queryLower = item.Query.toLowerCase();
      return {
        ...item,
        Top_Bucket: topBucketMap[queryLower] || '',
        Trend_Data: trend90dMap[queryLower] || null,
        Performance_Bucket: window.searchTermPerformanceBuckets ? 
          window.searchTermPerformanceBuckets[queryLower] || 'Mid-Performance' : 
          'Mid-Performance'
      };
    });
    
    // Calculate bucket statistics
    const bucketStats = calculateBucketStatistics(filteredData);
    
    // Populate both searches analysis containers
    populateSearchesAnalysis(bucketStats);
    
  } catch (error) {
    console.error('[loadCampaignSearchTermsForAnalysis] Error:', error);
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
    revenuePercent: searchTerms.reduce((sum, d) => sum + (d['% of all revenue'] || 0), 0) // Already in decimal format
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
  
// Removed top 10 by value highlighting - only using Top_Bucket
  
  const wrapper = document.createElement('div');
  wrapper.className = 'camp-products-wrapper';
  
  const table = document.createElement('table');
  table.className = 'camp-table-modern';
  
  // Create header
  const thead = document.createElement('thead');
thead.innerHTML = `
    <tr>
      <th style="width: 50px; text-align: center;">#</th>
      <th class="sortable" style="width: 300px;" data-sort="query">
        Search Term
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="impressions">
        Impressions
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="clicks">
        Clicks
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="ctr">
        CTR %
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="conversions">
        Conv
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="cvr">
        CVR %
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="value">
        Revenue
        <span class="camp-sort-icon">⇅</span>
      </th>
      <th class="right sortable metric-col" data-sort="revenuePercent">
        % of Revenue
        <span class="camp-sort-icon">⇅</span>
      </th>
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
        ${(totals.revenuePercent * 100).toFixed(2)}%
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
    
const row = document.createElement('tr');
// Alternating row background
if (index % 2 === 1) {
  row.style.backgroundColor = '#fafafa';
}
    
    row.innerHTML = `
      <td style="text-align: center;">
        ${getIndexWithTopBucket(index + 1, term.Top_Bucket)}
      </td>
<td style="font-weight: 500;">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span>${term.Query || '-'}</span>
          ${term.Top_Bucket ? getTopBucketBadge(term.Top_Bucket) : ''}
          ${term.Performance_Bucket ? getPerformanceBucketBadge(term.Performance_Bucket) : ''}
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
  
  // Add sorting event listeners
  addSearchTermsTableEventListeners(wrapper, searchTerms, campaignName);
}

// Add event listeners for search terms table
function addSearchTermsTableEventListeners(wrapper, searchTerms, campaignName) {
  // Store sort state
  if (!window.campaignSearchTermsSortState) {
    window.campaignSearchTermsSortState = {};
  }
  
  wrapper.querySelectorAll('th.sortable').forEach(header => {
    header.style.cursor = 'pointer';
    
    // Add sort icons if not present
    if (!header.querySelector('.camp-sort-icon')) {
      const sortIcon = document.createElement('span');
      sortIcon.className = 'camp-sort-icon';
      sortIcon.textContent = '⇅';
      header.appendChild(sortIcon);
    }
    
    header.addEventListener('click', function() {
      const column = this.dataset.sort;
      
      // Remove previous sort classes from all headers
      wrapper.querySelectorAll('th').forEach(th => {
        th.classList.remove('sorted-asc', 'sorted-desc');
      });
      
      // Toggle sort direction
      let direction = 'desc'; // Default first click is desc
      if (window.campaignSearchTermsSortState[column] === 'desc') {
        direction = 'asc';
      } else if (window.campaignSearchTermsSortState[column] === 'asc') {
        direction = 'desc';
      }
      
      // Update sort state
      window.campaignSearchTermsSortState = { [column]: direction };
      
      // Apply sort class
      this.classList.add(`sorted-${direction}`);
      
      // Update sort icon
      this.querySelector('.camp-sort-icon').textContent = direction === 'asc' ? '↑' : '↓';
      
      // Sort data
      const sortedData = [...searchTerms].sort((a, b) => {
        let aVal, bVal;
        
        switch(column) {
          case 'query':
            aVal = a.Query || '';
            bVal = b.Query || '';
            break;
          case 'impressions':
            aVal = a.Impressions || 0;
            bVal = b.Impressions || 0;
            break;
          case 'clicks':
            aVal = a.Clicks || 0;
            bVal = b.Clicks || 0;
            break;
          case 'ctr':
            aVal = a.Impressions > 0 ? (a.Clicks / a.Impressions * 100) : 0;
            bVal = b.Impressions > 0 ? (b.Clicks / b.Impressions * 100) : 0;
            break;
          case 'conversions':
            aVal = a.Conversions || 0;
            bVal = b.Conversions || 0;
            break;
          case 'cvr':
            aVal = a.Clicks > 0 ? (a.Conversions / a.Clicks * 100) : 0;
            bVal = b.Clicks > 0 ? (b.Conversions / b.Clicks * 100) : 0;
            break;
          case 'value':
            aVal = a.Value || 0;
            bVal = b.Value || 0;
            break;
          case 'revenuePercent':
            aVal = a['% of all revenue'] || 0;
            bVal = b['% of all revenue'] || 0;
            break;
          default:
            aVal = 0;
            bVal = 0;
        }
        
        // Handle string vs number comparison
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
      renderCampaignSearchTermsTable(container, sortedData, campaignName);
    });
  });
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
    'Top1': { color: '#fff', bg: '#FFD700', label: '🥇 TOP 1' },
    'Top2': { color: '#fff', bg: '#C0C0C0', label: '🥈 TOP 2' },
    'Top3': { color: '#fff', bg: '#CD7F32', label: '🥉 TOP 3' },
    'Top4': { color: '#fff', bg: '#4CAF50', label: '🏆 TOP 4' },
    'Top5': { color: '#fff', bg: '#2196F3', label: '⭐ TOP 5' },
    'Top10': { color: '#fff', bg: '#9C27B0', label: '✨ TOP 10' }
  };
  
  const config = bucketConfig[topBucket] || { color: '#666', bg: '#F5F5F5', label: topBucket };
  
  return `
    <span style="
      display: inline-flex;
      align-items: center;
      padding: 4px 12px;
      border-radius: 14px;
      background: ${config.bg};
      color: ${config.color};
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
      border: 2px solid ${config.bg};
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
      letter-spacing: 0.5px;
    ">
      ${config.label}
    </span>
  `;
}

// Get performance bucket badge HTML
function getPerformanceBucketBadge(bucketType) {
  if (!bucketType) return '';
  
  const bucketConfig = {
    'Top Search Terms': { color: '#FFD700', bg: '#FFF9E6', icon: '⭐' },
    'Zero Converting Terms': { color: '#F44336', bg: '#FFEBEE', icon: '⚠️' },
    'High Revenue Terms': { color: '#4CAF50', bg: '#E8F5E9', icon: '💰' },
    'Hidden Gems': { color: '#2196F3', bg: '#E3F2FD', icon: '💎' },
    'Low Performance': { color: '#9E9E9E', bg: '#F5F5F5', icon: '📉' },
    'Mid-Performance': { color: '#FF9800', bg: '#FFF3E0', icon: '📊' }
  };
  
  const config = bucketConfig[bucketType];
  if (!config) return '';
  
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
      margin-left: 6px;
    ">
      ${config.icon} ${bucketType}
    </span>
  `;
}

// Get profitability bucket badge HTML
function getProfitabilityBucketBadge(bucketData) {
  if (!bucketData) return '';
  
  let bucketValue = 'Insufficient Data';
  try {
    const data = typeof bucketData === 'string' ? JSON.parse(bucketData) : bucketData;
    bucketValue = data.value || 'Insufficient Data';
  } catch (e) {
    return '';
  }
  
  const bucketConfig = {
    'Profit Stars': { color: '#FFD700', bg: '#FFFACD', icon: '' },
    'Strong Performers': { color: '#4CAF50', bg: '#E8F5E9', icon: '' },
    'Steady Contributors': { color: '#2196F3', bg: '#E3F2FD', icon: '' },
    'Break-Even Products': { color: '#FF9800', bg: '#FFF3E0', icon: '' },
    'True Losses': { color: '#F44336', bg: '#FFEBEE', icon: '' },
    'Insufficient Data': { color: '#9E9E9E', bg: '#F5F5F5', icon: '' }
  };
  
  const config = bucketConfig[bucketValue];
  if (!config) return '';
  
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
      margin-left: 6px;
    ">
      ${bucketValue}
    </span>
  `;
}

// Replace the ensureSearchTermPerformanceBuckets function with:
async function ensureSearchTermPerformanceBuckets() {
  // Check if the global function exists
  if (typeof window.calculateAndCacheSearchTermBuckets === 'function') {
    window.searchTermPerformanceBuckets = await window.calculateAndCacheSearchTermBuckets();
    return window.searchTermPerformanceBuckets;
  } else {
    console.warn('[Campaigns] calculateAndCacheSearchTermBuckets function not available');
    return {};
  }
}

// Calculate statistics for each bucket
function calculateBucketStatistics(data) {
  const stats = {
    'all': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'Top Search Terms': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'High Revenue Terms': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'Hidden Gems': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'Mid-Performance': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'Low Performance': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 },
    'Zero Converting Terms': { count: 0, clicks: 0, revenue: 0, value: 0, prevClicks: 0, prevValue: 0 }
  };
  
  let totalClicks = 0;
  let totalRevenue = 0;
  let totalValue = 0;
  let totalPrevClicks = 0;
  let totalPrevValue = 0;
  
  data.forEach(term => {
    const bucket = term.Performance_Bucket || 'Mid-Performance';
    
    // Current period values
    const clicks = term.Clicks || 0;
    const value = term.Value || 0;
    
    // Previous period values from Trend_Data (90d monthly average)
    const prevClicks = term.Trend_Data?.Clicks || 0;
    const prevValue = term.Trend_Data?.Value || 0;
    
    // Update bucket stats
    if (stats[bucket]) {
      stats[bucket].count++;
      stats[bucket].clicks += clicks;
      stats[bucket].revenue += value;
      stats[bucket].value += value;
      stats[bucket].prevClicks += prevClicks;
      stats[bucket].prevValue += prevValue;
    }
    
    // Update totals
    totalClicks += clicks;
    totalRevenue += value;
    totalValue += value;
    totalPrevClicks += prevClicks;
    totalPrevValue += prevValue;
  });
  
  // Set 'all' stats
  stats['all'].count = data.length;
  stats['all'].clicks = totalClicks;
  stats['all'].revenue = totalRevenue;
  stats['all'].value = totalValue;
  stats['all'].prevClicks = totalPrevClicks;
  stats['all'].prevValue = totalPrevValue;
  
  // Calculate percentages and trends for each bucket
  for (let bucket in stats) {
    const bucketStats = stats[bucket];
    
    // Calculate percentages
    bucketStats.clicksPercent = totalClicks > 0 ? (bucketStats.clicks / totalClicks * 100) : 0;
    bucketStats.revenuePercent = totalRevenue > 0 ? (bucketStats.revenue / totalRevenue * 100) : 0;
    bucketStats.valuePercent = totalValue > 0 ? (bucketStats.value / totalValue * 100) : 0;
    
    // Calculate trends (percentage change from previous period)
    bucketStats.clicksTrend = bucketStats.prevClicks > 0 ? 
      ((bucketStats.clicks - bucketStats.prevClicks) / bucketStats.prevClicks * 100) : 0;
    bucketStats.valueTrend = bucketStats.prevValue > 0 ? 
      ((bucketStats.value - bucketStats.prevValue) / bucketStats.prevValue * 100) : 0;
    
    // Calculate absolute changes
    bucketStats.clicksChange = bucketStats.clicks - bucketStats.prevClicks;
    bucketStats.valueChange = bucketStats.value - bucketStats.prevValue;
  }
  
  return stats;
}

// Calculate statistics for product buckets
function calculateProductBucketStatistics(data) {
  const stats = {
    'all': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'Profit Stars': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'Strong Performers': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'Steady Contributors': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'Break-Even Products': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'True Losses': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 },
    'Insufficient Data': { count: 0, impressions: 0, cost: 0, conversions: 0, revenue: 0 }
  };
  
  let totalImpressions = 0;
  let totalCost = 0;
  let totalConversions = 0;
  let totalRevenue = 0;
  
  data.forEach(product => {
    // Get profitability bucket from product data
    let bucketKey = 'Insufficient Data'; // Default
    if (product.profitabilityBucket) {
      try {
        // Parse JSON if it's a string
        const bucketData = typeof product.profitabilityBucket === 'string' ? 
          JSON.parse(product.profitabilityBucket) : product.profitabilityBucket;
        bucketKey = bucketData.value || 'Insufficient Data';
      } catch (e) {
        console.warn('Failed to parse profitability bucket:', e);
      }
    }
    
    const impressions = product.impressions || 0;
    const cost = product.cost || 0;
    const conversions = product.conversions || 0;
    const revenue = product.convValue || 0;
    
    // Update bucket stats
    if (stats[bucketKey]) {
      stats[bucketKey].count++;
      stats[bucketKey].impressions += impressions;
      stats[bucketKey].cost += cost;
      stats[bucketKey].conversions += conversions;
      stats[bucketKey].revenue += revenue;
    }
    
    // Update totals
    totalImpressions += impressions;
    totalCost += cost;
    totalConversions += conversions;
    totalRevenue += revenue;
  });
  
  // Set 'all' stats
  stats['all'].count = data.length;
  stats['all'].impressions = totalImpressions;
  stats['all'].cost = totalCost;
  stats['all'].conversions = totalConversions;
  stats['all'].revenue = totalRevenue;
  
  // Calculate percentages for each bucket
  for (let bucket in stats) {
    const bucketStats = stats[bucket];
    bucketStats.impressionsPercent = totalImpressions > 0 ? (bucketStats.impressions / totalImpressions * 100) : 0;
    bucketStats.costPercent = totalCost > 0 ? (bucketStats.cost / totalCost * 100) : 0;
    bucketStats.conversionsPercent = totalConversions > 0 ? (bucketStats.conversions / totalConversions * 100) : 0;
    bucketStats.revenuePercent = totalRevenue > 0 ? (bucketStats.revenue / totalRevenue * 100) : 0;
    bucketStats.roas = bucketStats.cost > 0 ? (bucketStats.revenue / bucketStats.cost) : 0;
  }
  
  return stats;
}

// ============= NEW EFFICIENCY FRAMEWORK IMPLEMENTATION =============

// Normalization helpers to avoid label mismatches ('Strong Perf' vs 'Strong Performers', etc.)
const normalizeBucketName = (s = '') => s.toLowerCase().replace(/\./g,'').replace(/\s+/g,' ').trim();

const BUCKET_INTENT_MAPPING = {
  products: {
    winners: new Set([
      'profit stars','profit star','profitable',
      'strong perf','strong performers','strong performer',
      'steady','steady contributors','steady contributor'
    ].map(normalizeBucketName)),
    underperformers: new Set([
      'underperf','underperform','underperforming',
      'losses','true losses',
      'break-even','break-even products','break even'
    ].map(normalizeBucketName)),
    test: new Set([
      'insufficient','insufficient data'
    ].map(normalizeBucketName))
  },
  searches: {
    winners: new Set([
      'high perf','top terms','top search terms',
      'high revenue','high revenue terms'
    ].map(normalizeBucketName)),
    underperformers: new Set([
      'mid perf','mid-performance','mid performance',
      'low perf','low performance',
      'zero conv','zero converting terms','zero converting'
    ].map(normalizeBucketName)),
    test: new Set([
      'hidden gems','hidden gem'
    ].map(normalizeBucketName))
  }
};

// ============= EFFICIENCY FRAMEWORK CONFIGURATION =============
const EFFICIENCY_CONFIG = {
  targetROAS: 3.0,

  // Winner Share target: adapt to revenue reality with guardrails
winnerShare: {
  baseTarget: 0.60,
  lowCap: 0.50,
  highCap: 0.70,        // base cap (used when WRS is not extreme)
  toleranceBand: 0.40,

  // --- Soft high-cap controls (enable + parameters) ---
  softHighCapEnabled: true,
  // Use this formula: highCap = 0.70 + 0.10 * clamp(WRS - 0.80, 0, 0.20)
  softHighCapStart: 0.80,   // WRS above this starts nudging the cap
  softHighCapSlope: 0.10,   // how much the cap rises per 1.00 of WRS above start
  softHighCapMaxRange: 0.20 // clamp(WRS - start, 0, this) → max extra 0.02 in this example
},

  // Allocation Alignment (AA) scoring & gating
  allocationAlignment: {
    minAA: 0.70,            // AA <= 0.7 → 0 score
    maxAA: 2.00,            // AA >= 2.0 → full score
    wssGate: 0.3           // full AA credit only if Winners' share ≥ 30%
  },

  // Waste points: compute from PRODUCTS only (no double counting)
  wasteRate: {
    maxAcceptable: 0.30,    // 30% excess above target ROAS → 0/20
    useProductsOnly: true,  // keep true while search has no spend data
    includeSearchProxy: true // compute a proxy (clicks-based) for display only
  },

  // Testing Mix thresholds (display-only)
  testingMix: { min: 0.1, max: 0.20 },

  // ROAS scoring: pick the curve you want (strict matches your screenshots)
  roasScoring: {
    curve: 'strict', // 'strict' or 'baseline'
    strict:   { minRatio: 0.50, fullRatio: 1.25, exponent: 1.00 }, // 0 @0.5×, full @1.25×
    baseline: { minRatio: 0.30, fullRatio: 1.00, exponent: 1.00 }  // 0 @0.3×, full @1.0×
  },

  // Overall weights (keep 40/40/20)
  scoreWeights: { roas: 40, allocation: 40, waste: 20 }
};

// ---------- Utilities ----------
const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
const safeDiv = (num, den, fallback = 0) => (den > 0 ? num / den : fallback);

function computeTargetWSS(baseTarget, wrs, lowCap, highCap, cfg) {
  const wrsSafe = wrs || 0;
  const baseTargeted = Math.max(wrsSafe, baseTarget);

  // Soft high cap:  highCap = baseHighCap + slope * clamp(WRS - start, 0, maxRange)
  let effectiveHighCap = highCap;
  if (cfg?.winnerShare?.softHighCapEnabled) {
    const start = cfg.winnerShare.softHighCapStart ?? 0.80;
    const slope = cfg.winnerShare.softHighCapSlope ?? 0.10;
    const range = cfg.winnerShare.softHighCapMaxRange ?? 0.20;
    const delta = clamp(wrsSafe - start, 0, range);   // e.g., at WRS=0.90, delta = 0.10
    effectiveHighCap = highCap + slope * delta;       // e.g., 0.70 + 0.10*0.10 = 0.71
  }

  return clamp(baseTargeted, lowCap, effectiveHighCap);
}

function wssScoreAdaptive(wShare, rShare, cfg) {
  const target = computeTargetWSS(cfg.winnerShare.baseTarget, rShare, cfg.winnerShare.lowCap, cfg.winnerShare.highCap);
  const dist = Math.min(Math.abs((wShare || 0) - target), cfg.winnerShare.toleranceBand);
  return 1 - dist / cfg.winnerShare.toleranceBand; // 1 good → 0 poor
}

function aaScoreGated(aa, wShare, cfg) {
  const raw = clamp((aa - cfg.allocationAlignment.minAA) /
                    (cfg.allocationAlignment.maxAA - cfg.allocationAlignment.minAA), 0, 1);
  const gate = clamp((wShare || 0) / cfg.allocationAlignment.wssGate, 0, 1);
  return raw * gate; // no full credit unless Winners have real funding
}

function sanityCheckShares(label, obj) {
  const w = obj.wss ?? obj.wcs ?? 0;
  const sum = (w || 0) + (obj.wr || 0) + (obj.tm || 0);
  if (Math.abs(sum - 1) > 0.05) {
    console.warn(`[${label}] winners+underperf+test = ${sum.toFixed(2)} (expected ~1.00). Check bucket mapping / inputs.`);
  }
}

// Calculate efficiency metrics for products
function calculateProductsEfficiencyMetrics(bucketStats) {
  if (!bucketStats || Object.keys(bucketStats).length === 0) {
    return {
      wss: 0, wrs: 0, aa: 0, wr: 0, tm: 0,
      winnersROAS: 0, underperformersROAS: 0, totalROAS: 0,
      winnersMetrics: { cost: 0, revenue: 0, count: 0 },
      underperformersMetrics: { cost: 0, revenue: 0, count: 0 },
      testMetrics: { cost: 0, revenue: 0, count: 0 },
      totalMetrics: { cost: 0, revenue: 0, count: 0, clicks: 0 }
    };
  }

  const map = BUCKET_INTENT_MAPPING.products;
  let winners = { cost: 0, revenue: 0, count: 0 };
  let under   = { cost: 0, revenue: 0, count: 0 };
  let test    = { cost: 0, revenue: 0, count: 0 };
  let total   = { cost: 0, revenue: 0, count: 0, clicks: 0 };

  Object.entries(bucketStats).forEach(([bucket, stats]) => {
    if (bucket === 'all') {
      total = {
        cost: stats.cost || 0,
        revenue: stats.revenue || 0,
        count: stats.count || 0,
        clicks: stats.clicks || 0
      };
      return;
    }
    const key = normalizeBucketName(bucket);
    if (map.winners.has(key)) {
      winners.cost  += stats.cost   || 0;
      winners.revenue += stats.revenue|| 0;
      winners.count += stats.count  || 0;
    } else if (map.underperformers.has(key)) {
      under.cost    += stats.cost   || 0;
      under.revenue += stats.revenue|| 0;
      under.count   += stats.count  || 0;
    } else if (map.test.has(key)) {
      test.cost     += stats.cost   || 0;
      test.revenue  += stats.revenue|| 0;
      test.count    += stats.count  || 0;
    }
  });

  const wss = safeDiv(winners.cost, total.cost, 0);
  const wrs = safeDiv(winners.revenue, total.revenue, 0);
  const aa  = wss > 0 ? wrs / wss : 0;
  const wr  = safeDiv(under.cost, total.cost, 0);
  const tm  = safeDiv(test.cost, total.cost, 0);

  const winnersROAS = safeDiv(winners.revenue, winners.cost, 0);
  const underROAS   = safeDiv(under.revenue, under.cost, 0);
  const totalROAS   = safeDiv(total.revenue, total.cost, 0);

  return {
    wss, wrs, aa, wr, tm,
    winnersROAS, underperformersROAS: underROAS, totalROAS,
    winnersMetrics: winners,
    underperformersMetrics: under,
    testMetrics: test,
    totalMetrics: total,
    bucketStats
  };
}

// Calculate efficiency metrics for searches (using clicks instead of cost)
function calculateSearchesEfficiencyMetrics(bucketStats) {
  if (!bucketStats || Object.keys(bucketStats).length === 0) {
    return {
      wcs: 0, wrs: 0, aa: 0, wr: 0, tm: 0,
      winnersRPC: 0, underperformersRPC: 0, totalRPC: 0,
      winnersMetrics: { clicks: 0, revenue: 0, count: 0 },
      underperformersMetrics: { clicks: 0, revenue: 0, count: 0 },
      testMetrics: { clicks: 0, revenue: 0, count: 0 },
      totalMetrics: { clicks: 0, revenue: 0, count: 0 }
    };
  }

  const map = BUCKET_INTENT_MAPPING.searches;
  let winners = { clicks: 0, revenue: 0, count: 0 };
  let under   = { clicks: 0, revenue: 0, count: 0 };
  let test    = { clicks: 0, revenue: 0, count: 0 };
  let total   = { clicks: 0, revenue: 0, count: 0 };

  Object.entries(bucketStats).forEach(([bucket, stats]) => {
    if (bucket === 'all') {
      total = {
        clicks: stats.clicks || 0,
        revenue: stats.revenue || 0,
        count: stats.count || 0
      };
      return;
    }
    const key = normalizeBucketName(bucket);
    if (map.winners.has(key)) {
      winners.clicks  += stats.clicks  || 0;
      winners.revenue += stats.revenue || 0;
      winners.count   += stats.count   || 0;
    } else if (map.underperformers.has(key)) {
      under.clicks    += stats.clicks  || 0;
      under.revenue   += stats.revenue || 0;
      under.count     += stats.count   || 0;
    } else if (map.test.has(key)) {
      test.clicks     += stats.clicks  || 0;
      test.revenue    += stats.revenue || 0;
      test.count      += stats.count   || 0;
    }
  });

  const wcs = safeDiv(winners.clicks, total.clicks, 0);  // winners' click share
  const wrs = safeDiv(winners.revenue, total.revenue, 0);
  const aa  = wcs > 0 ? wrs / wcs : 0;                  // efficiency of winner mix
  const wr  = safeDiv(under.clicks, total.clicks, 0);   // underperformer click share
  const tm  = safeDiv(test.clicks, total.clicks, 0);

  const winnersRPC = safeDiv(winners.revenue, winners.clicks, 0);
  const underRPC   = safeDiv(under.revenue, under.clicks, 0);
  const totalRPC   = safeDiv(total.revenue, total.clicks, 0);

  return {
    wcs, wrs, aa, wr, tm,
    winnersRPC, underperformersRPC: underRPC, totalRPC,
    winnersMetrics: winners,
    underperformersMetrics: under,
    testMetrics: test,
    totalMetrics: total
  };
}

// Calculate combined efficiency score (0-100)
function calculateEfficiencyScore(productsMetrics, searchesMetrics) {
  const config = EFFICIENCY_CONFIG;

  // ----- 0) Sanity checks (optional, logs only)
  sanityCheckShares('Products', productsMetrics);
  sanityCheckShares('Searches', searchesMetrics);

  // ===== 1) ROAS Component (0–40) =====
  const curve = config.roasScoring[config.roasScoring.curve]; // strict or baseline
  const roasRatio = safeDiv(productsMetrics.totalROAS, config.targetROAS, 0); // campaign ROAS vs target
  const roas01 = clamp((roasRatio - curve.minRatio) / (curve.fullRatio - curve.minRatio), 0, 1);
  const scoreROAS = Math.pow(roas01, curve.exponent) * config.scoreWeights.roas;

  // ===== 2) Allocation Component (0–40) =====
  // --- Products ---
  const wssP = productsMetrics.wss || 0;
  const wrsP = productsMetrics.wrs || 0;
  const aaP  = productsMetrics.aa  || 0;

const targetWSS_P = computeTargetWSS(
  config.winnerShare.baseTarget, wrsP,
  config.winnerShare.lowCap, config.winnerShare.highCap, config
);
  
  const wssScoreP = wssScoreAdaptive(wssP, wrsP, config);
  const aaScoreP  = aaScoreGated(aaP, wssP, config);
  const allocScoreP = 0.55 * wssScoreP + 0.45 * aaScoreP; // C) give AA more weight

  // --- Searches (click-based) ---
  const wssS = searchesMetrics.wcs || 0; // winners' click share
  const wrsS = searchesMetrics.wrs || 0;
  const aaS  = searchesMetrics.aa  || 0;

const targetWSS_S = computeTargetWSS(
  config.winnerShare.baseTarget, wrsS,
  config.winnerShare.lowCap, config.winnerShare.highCap, config
);
  
  const wssScoreS = wssScoreAdaptive(wssS, wrsS, config);
  const aaScoreS  = aaScoreGated(aaS, wssS, config);
  const allocScoreS = 0.55 * wssScoreS + 0.45 * aaScoreS; // C) give AA more weight

  // Final allocation points (simple average; spend-weighting is unsafe without search spend)
  const scoreAllocation = ((allocScoreP + allocScoreS) / 2) * config.scoreWeights.allocation;

  // ===== 3) Waste Component (0–20) =====
  // Products-only economic excess (no double counting)
  let wasteProducts$ = 0;
  if (productsMetrics.underperformersMetrics) {
    const uc = productsMetrics.underperformersMetrics.cost || 0;
    const ur = productsMetrics.underperformersMetrics.revenue || 0;
    wasteProducts$ = Math.max(0, uc - (ur / config.targetROAS));
  }

  const totalCost = productsMetrics.totalMetrics?.cost || 1;
  const wasteRateExcess = clamp(wasteProducts$ / totalCost, 0, 1);
  const scoreWaste = clamp(1 - wasteRateExcess / config.wasteRate.maxAcceptable, 0, 1) * config.scoreWeights.waste;

  // Optional: compute a search “waste proxy” for display (NOT used in points)
  let searchWasteProxyRate = 0;
  if (config.wasteRate.includeSearchProxy && searchesMetrics?.underperformersMetrics) {
    const totalSearchClicks = searchesMetrics.totalMetrics?.clicks || 0;
    if (totalSearchClicks > 0) {
      const avgCPC = totalCost / totalSearchClicks; // campaign CPC
      const uClicks = searchesMetrics.underperformersMetrics.clicks || 0;
      const uRev    = searchesMetrics.underperformersMetrics.revenue || 0;
      const proxy$  = Math.max(0, uClicks * avgCPC - (uRev / config.targetROAS));
      searchWasteProxyRate = clamp(proxy$ / totalCost, 0, 1);
    }
  }

  // ===== 4) Total & guardrails =====
  const totalScore = Math.round(scoreROAS + scoreAllocation + scoreWaste);
  const finalScore = wasteRateExcess >= 0.60 ? Math.min(totalScore, 40) : totalScore;

  return {
    score: finalScore,
    components: {
      roas: Math.round(scoreROAS),
      allocation: Math.round(scoreAllocation),
      waste: Math.round(scoreWaste)
    },
    status: getEfficiencyStatus(finalScore),
    roasRatio,
    wasteRateExcess,             // products-only excess (drives points)
    searchWasteProxyRate,        // display-only proxy based on clicks
    metrics: {
      // Products
      wssProducts: wssP, wrsProducts: wrsP, aaProducts: aaP,
      targetWSSProducts: targetWSS_P,
      wssScoreProducts: wssScoreP, aaScoreProducts: aaScoreP,
      // Searches
      wssSearches: wssS, wrsSearches: wrsS, aaSearches: aaS,
      targetWSSSearches: targetWSS_S,
      wssScoreSearches: wssScoreS, aaScoreSearches: aaScoreS
    },
    testingMix: {
      products: productsMetrics.tm || 0,
      searches: searchesMetrics.tm || 0
    }
  };
}

// Get efficiency status based on score
function getEfficiencyStatus(score) {
  if (score >= 80) return { text: 'Excellent', color: '#22c55e' };
  if (score >= 60) return { text: 'Good', color: '#eab308' };
  if (score >= 40) return { text: 'Needs Attention', color: '#f97316' };
  return { text: 'At Risk', color: '#ef4444' };
}

// Get status color for metrics
function getMetricStatusColor(metric, value) {
  const config = EFFICIENCY_CONFIG;
  
  switch(metric) {
    case 'aa':
      if (value >= 1.50) return '#22c55e';  // Excellent
      if (value >= 1.10) return '#eab308';  // Good
      return '#ef4444';  // Poor
      
    case 'wr':
      // Now based on economic excess
      if (value < 0.10) return '#22c55e';  // <10% excess
      if (value < 0.20) return '#eab308';  // <20% excess
      return '#ef4444';  // >20% excess
      
    case 'tm':
      if (value >= config.testingMix.min && value <= config.testingMix.max) return '#22c55e';
      if (value < config.testingMix.min) return '#3b82f6'; // Blue for under-testing
      return '#f97316'; // Orange for over-testing
      
    default:
      return '#6b7280';
  }
}

// Main function to render the efficiency container
function renderEfficiencyContainer() {
  const containers = [
    document.getElementById('efficiencyMetricsContent'),
    document.getElementById('efficiencyMetricsContentSearchTerms')
  ];
  
  containers.forEach(container => {
    if (!container) return;
    
    // Get current metrics if available, with proper defaults
    const productsMetrics = window.productsEfficiencyMetrics || 
      calculateProductsEfficiencyMetrics(window.productBucketStats || {}) ||
      {
        wss: 0, wrs: 0, aa: 0, wr: 0, tm: 0,
        winnersROAS: 0, underperformersROAS: 0, totalROAS: 0,
        winnersMetrics: { cost: 0, revenue: 0, count: 0 },
        underperformersMetrics: { cost: 0, revenue: 0, count: 0 },
        testMetrics: { cost: 0, revenue: 0, count: 0 },
        totalMetrics: { cost: 0, revenue: 0, count: 0 }
      };
    
    const searchesMetrics = window.searchesEfficiencyMetrics || 
      calculateSearchesEfficiencyMetrics(window.searchBucketStats || {}) ||
      {
        wcs: 0, wrs: 0, aa: 0, wr: 0, tm: 0,
        winnersRPC: 0, underperformersRPC: 0, totalRPC: 0,
        winnersMetrics: { clicks: 0, revenue: 0, count: 0 },
        underperformersMetrics: { clicks: 0, revenue: 0, count: 0 },
        testMetrics: { clicks: 0, revenue: 0, count: 0 },
        totalMetrics: { clicks: 0, revenue: 0, count: 0 }
      };
    
    // Check if we have valid metrics
    if (!productsMetrics || !searchesMetrics) {
      container.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #999; font-size: 11px;">
          Loading efficiency metrics...
        </div>
      `;
      return;
    }
    
    // Calculate overall efficiency score
    const efficiencyScore = calculateEfficiencyScore(productsMetrics, searchesMetrics);
    
    // Build the new UI - ONLY Overall Score and Actions
    container.innerHTML = `
      <div style="display: flex; flex-direction: column; height: 100%; gap: 10px; padding: 4px;">
        
<!-- Overall Score -->
<div style="
  background: linear-gradient(135deg, ${efficiencyScore.status.color}22, ${efficiencyScore.status.color}11);
  border: 2px solid ${efficiencyScore.status.color};
  border-radius: 8px;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
">
  <!-- Score on left -->
  <div style="display: flex; flex-direction: column; align-items: center; padding-right: 16px; border-right: 2px solid ${efficiencyScore.status.color}44;">
    <div style="font-size: 48px; font-weight: 800; color: ${efficiencyScore.status.color}; line-height: 1;">
      ${efficiencyScore.score}
    </div>
    <div style="font-size: 12px; font-weight: 600; color: ${efficiencyScore.status.color}; margin-top: 4px; white-space: nowrap;">
      ${efficiencyScore.status.text}
    </div>
  </div>
  
  <!-- Score Components in column on right -->
  <div style="display: flex; flex-direction: column; gap: 6px; flex: 1;">
    <div style="background: white; border-radius: 4px; padding: 4px 10px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #6b7280; font-weight: 600;">ROAS:</span>
      <span style="font-weight: 700; color: ${productsMetrics.totalROAS >= 3 ? '#22c55e' : productsMetrics.totalROAS >= 1.5 ? '#eab308' : '#ef4444'};">
        ${efficiencyScore.components.roas}/40
      </span>
    </div>
    <div style="background: white; border-radius: 4px; padding: 4px 10px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #6b7280; font-weight: 600;">Alloc:</span>
      <span style="font-weight: 700; color: ${efficiencyScore.components.allocation >= 30 ? '#22c55e' : efficiencyScore.components.allocation >= 20 ? '#eab308' : '#ef4444'};">
        ${efficiencyScore.components.allocation}/40
      </span>
    </div>
    <div style="background: white; border-radius: 4px; padding: 4px 10px; font-size: 11px; display: flex; justify-content: space-between; align-items: center;">
      <span style="color: #6b7280; font-weight: 600;">Waste:</span>
      <span style="font-weight: 700; color: ${efficiencyScore.components.waste >= 15 ? '#22c55e' : efficiencyScore.components.waste >= 10 ? '#eab308' : '#ef4444'};">
        ${efficiencyScore.components.waste}/20
      </span>
    </div>
  </div>
</div>
        
        <!-- Testing Mix Indicator -->
        ${renderTestingMixIndicator(efficiencyScore.testingMix)}
        
        <!-- Action Recommendations -->
        ${renderActionRecommendations(productsMetrics, searchesMetrics, efficiencyScore)}
        
      </div>
    `;
    
    // Store metrics globally
    window.productsEfficiencyMetrics = productsMetrics;
    window.searchesEfficiencyMetrics = searchesMetrics;
    window.currentEfficiencyScore = efficiencyScore;
  });
}

// Render Testing Mix indicator
function renderTestingMixIndicator(testingMix) {
  if (!testingMix) return '';
  
  const avgTM = (testingMix.products + testingMix.searches) / 2;
  const tmPercent = (avgTM * 100).toFixed(1);
  
  let status, color, message;
  if (avgTM < 0.05) {
    status = 'Under-Testing';
    color = '#3b82f6';
    message = 'Risk: Not exploring enough';
  } else if (avgTM > 0.15) {
    status = 'Over-Testing';
    color = '#f97316';
    message = 'Risk: Too much exploration';
  } else {
    status = 'Healthy';
    color = '#22c55e';
    message = 'Good exploration balance';
  }
  
  return `
    <div style="
      background: ${color}15;
      border: 1px solid ${color}40;
      border-radius: 6px;
      padding: 8px;
      margin-top: 8px;
    ">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
          <span style="font-size: 10px; font-weight: 700; color: ${color};">
            TESTING MIX: ${tmPercent}%
          </span>
          <span style="font-size: 9px; color: #6b7280; margin-left: 8px;">
            ${status}
          </span>
        </div>
        <div style="font-size: 9px; color: #6b7280;">
          ${message}
        </div>
      </div>
    </div>
  `;
}

// Function to update analysis headers with efficiency metrics
function updateAnalysisHeaders() {
  // Update Products header
  const productsHeader = document.querySelector('#campaignAnalysisProducts .campaign-analysis-section-header');
  const productsHeaderSearchTerms = document.querySelector('#campaignAnalysisProductsSearchTerms .campaign-analysis-section-header');
  
  if (productsHeader && window.productsEfficiencyMetrics) {
    productsHeader.innerHTML = `
      <span>Products</span>
      <div style="display: flex; gap: 6px;">
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}22;
          border: 1px solid ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)};
        ">
          AA:${window.productsEfficiencyMetrics.aa.toFixed(2)}
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}22;
          border: 1px solid ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)};
        ">
          WR:${(window.productsEfficiencyMetrics.wr * 100).toFixed(0)}%
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}22;
          border: 1px solid ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)};
        ">
          TM:${(window.productsEfficiencyMetrics.tm * 100).toFixed(0)}%
        </div>
      </div>
    `;
  }
  
  // Also update the search terms view products header
  if (productsHeaderSearchTerms && window.productsEfficiencyMetrics) {
    productsHeaderSearchTerms.innerHTML = `
      <span>Products</span>
      <div style="display: flex; gap: 6px;">
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}22;
          border: 1px solid ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('aa', window.productsEfficiencyMetrics.aa)};
        ">
          AA:${window.productsEfficiencyMetrics.aa.toFixed(2)}
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}22;
          border: 1px solid ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('wr', window.productsEfficiencyMetrics.wr)};
        ">
          WR:${(window.productsEfficiencyMetrics.wr * 100).toFixed(0)}%
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}22;
          border: 1px solid ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('tm', window.productsEfficiencyMetrics.tm)};
        ">
          TM:${(window.productsEfficiencyMetrics.tm * 100).toFixed(0)}%
        </div>
      </div>
    `;
  }
  
  // Update Searches header
  const searchesHeader = document.querySelector('#campaignAnalysisSearches .campaign-analysis-section-header');
  const searchesHeaderSearchTerms = document.querySelector('#campaignAnalysisSearchesSearchTerms .campaign-analysis-section-header');
  
  if (searchesHeader && window.searchesEfficiencyMetrics) {
    searchesHeader.innerHTML = `
      <span>Searches</span>
      <div style="display: flex; gap: 6px;">
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}22;
          border: 1px solid ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)};
        ">
          AA:${window.searchesEfficiencyMetrics.aa.toFixed(2)}
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}22;
          border: 1px solid ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)};
        ">
          WR:${(window.searchesEfficiencyMetrics.wr * 100).toFixed(0)}%
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}22;
          border: 1px solid ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)};
        ">
          TM:${(window.searchesEfficiencyMetrics.tm * 100).toFixed(0)}%
        </div>
      </div>
    `;
  }
  
  // Also update the search terms view searches header
  if (searchesHeaderSearchTerms && window.searchesEfficiencyMetrics) {
    searchesHeaderSearchTerms.innerHTML = `
      <span>Searches</span>
      <div style="display: flex; gap: 6px;">
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}22;
          border: 1px solid ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('aa', window.searchesEfficiencyMetrics.aa)};
        ">
          AA:${window.searchesEfficiencyMetrics.aa.toFixed(2)}
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}22;
          border: 1px solid ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('wr', window.searchesEfficiencyMetrics.wr)};
        ">
          WR:${(window.searchesEfficiencyMetrics.wr * 100).toFixed(0)}%
        </div>
        <div style="
          padding: 2px 6px;
          background: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}22;
          border: 1px solid ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)}44;
          border-radius: 4px;
          font-size: 9px;
          font-weight: 600;
          color: ${getMetricStatusColor('tm', window.searchesEfficiencyMetrics.tm)};
        ">
          TM:${(window.searchesEfficiencyMetrics.tm * 100).toFixed(0)}%
        </div>
      </div>
    `;
  }
}

// Helper function to render a metric pill
function renderMetricPill(label, value, metricType, displayValue) {
  const color = getMetricStatusColor(metricType, value);
  const bgOpacity = metricType === 'tm' && (value < 0.05 || value > 0.15) ? '44' : '22';
  
  return `
    <div style="
      flex: 1;
      background: ${color}${bgOpacity};
      border: 1px solid ${color}66;
      border-radius: 4px;
      padding: 6px;
      text-align: center;
    ">
      <div style="font-size: 9px; color: #6b7280; font-weight: 600;">${label}</div>
      <div style="font-size: 13px; color: ${color}; font-weight: 700;">
        ${displayValue}
      </div>
    </div>
  `;
}

// Helper function to render comparison bar
function renderComparisonBar(leftLabel, rightLabel, leftValue, rightValue) {
  const leftPercent = leftValue * 100;
  const rightPercent = rightValue * 100;
  
  return `
    <div style="margin-top: 4px;">
      <div style="display: flex; justify-content: space-between; font-size: 9px; color: #6b7280; margin-bottom: 2px;">
        <span>${leftLabel}: ${leftPercent.toFixed(0)}%</span>
        <span>${rightLabel}: ${rightPercent.toFixed(0)}%</span>
      </div>
      <div style="display: flex; height: 20px; border-radius: 4px; overflow: hidden; background: #f3f4f6;">
        <div style="
          width: ${leftPercent}%;
          background: #dc2626;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: white;
          transition: width 0.3s ease;
        ">
          ${leftPercent >= 20 ? leftPercent.toFixed(0) + '%' : ''}
        </div>
        <div style="
          width: ${rightPercent}%;
          background: #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
          color: white;
          transition: width 0.3s ease;
        ">
          ${rightPercent >= 20 ? rightPercent.toFixed(0) + '%' : ''}
        </div>
      </div>
    </div>
  `;
}

// Helper function to render action recommendations
function renderActionRecommendations(productsMetrics, searchesMetrics, efficiencyScore) {
  const recommendations = [];
  const config = EFFICIENCY_CONFIG;
  
  // Calculate budget to shift (Products) using adaptive target
  const targetWSSProducts = efficiencyScore.metrics.targetWSSProducts;   // from metrics
  const currentWSSProducts = efficiencyScore.metrics.wssProducts;
  const shiftShareProducts = Math.max(0, targetWSSProducts - currentWSSProducts);
  const shiftAmountProducts = shiftShareProducts * productsMetrics.totalMetrics.cost;
  
  if (shiftAmountProducts > 100) {
    recommendations.push({
      type: 'shift',
      value: `$${(shiftAmountProducts / 1000).toFixed(1)}k`,
      label: 'Shift to Winners'
    });
  }
  
  // Show economic waste
  const totalExcess = efficiencyScore.wasteRateExcess * 
    (productsMetrics.totalMetrics.cost + searchesMetrics.totalMetrics.clicks);
  
  if (totalExcess > 100) {
    recommendations.push({
      type: 'waste',
      value: `$${(totalExcess / 1000).toFixed(1)}k`,
      label: `Above ${config.targetROAS}x Target`
    });
  }
  
  // Testing mix warnings
  const avgTM = (efficiencyScore.testingMix.products + efficiencyScore.testingMix.searches) / 2;
  if (avgTM < 0.05) {
    recommendations.push({
      type: 'test',
      value: 'Low',
      label: 'Increase Testing'
    });
  } else if (avgTM > 0.15) {
    const excessTest = (avgTM - 0.15) * productsMetrics.totalMetrics.cost;
    recommendations.push({
      type: 'test',
      value: `$${(excessTest / 1000).toFixed(1)}k`,
      label: 'Reduce Testing'
    });
  }
  
  if (recommendations.length === 0) return '';
  
  return `
    <div style="
      background: #fef3c7;
      border: 1px solid #fcd34d;
      border-radius: 6px;
      padding: 8px;
      margin-top: 8px;
    ">
      <div style="font-size: 10px; font-weight: 700; color: #92400e; margin-bottom: 6px;">
        💡 ACTIONS NEEDED
      </div>
      <div style="display: flex; flex-wrap: wrap; gap: 6px;">
        ${recommendations.map(rec => `
          <div style="
            background: white;
            border: 1px solid #fbbf24;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 10px;
          ">
            <span style="font-weight: 700; color: #d97706;">${rec.value}</span>
            <span style="color: #92400e; margin-left: 4px;">${rec.label}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Calculate global product bucket totals from all campaigns
async function calculateGlobalProductBucketTotals() {
  try {
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productBuckets_30d`;
    
    // Open IndexedDB
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
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
      return {};
    }
    
    // Count products in each bucket (only All+All records)
    const bucketTotals = {
      'Profit Stars': 0,
      'Strong Performers': 0,
      'Steady Contributors': 0,
      'Break-Even Products': 0,
      'True Losses': 0,
      'Insufficient Data': 0
    };
    
    result.data.forEach(row => {
      // Only count All+All records
      if (row['Campaign Name'] === 'All' && row['Device'] === 'All') {
        try {
          const bucketData = typeof row['PROFITABILITY_BUCKET'] === 'string' ? 
            JSON.parse(row['PROFITABILITY_BUCKET']) : row['PROFITABILITY_BUCKET'];
          const bucketValue = bucketData?.value || 'Insufficient Data';
          
          if (bucketTotals.hasOwnProperty(bucketValue)) {
            bucketTotals[bucketValue]++;
          }
        } catch (e) {
          // Silent fail
        }
      }
    });
    
    return bucketTotals;
  } catch (error) {
    console.error('[Campaigns] Error calculating global product bucket totals:', error);
    return {};
  }
}

// Update product bucket UI with statistics
async function updateProductBucketUI(stats) {
  const bucketFilterContainer = document.getElementById('campaignProductBucketFilterContainer');
  if (!bucketFilterContainer) return;
  
  // Get global bucket totals
  const globalTotals = await calculateGlobalProductBucketTotals();
  
  const bucketCards = bucketFilterContainer.querySelectorAll('.product-bucket-card');
  
  bucketCards.forEach(card => {
    const bucketType = card.getAttribute('data-bucket');
    const countElement = card.querySelector('.bucket-count');
    const coverageBar = card.querySelector('.bucket-coverage-bar');
    const coverageText = card.querySelector('.bucket-coverage-text');
    const metricsContainer = card.querySelector('.bucket-metrics');
    
    const bucketKey = bucketType;
    
    if (stats[bucketKey]) {
      const bucketData = stats[bucketKey];
      
      // Update count
      if (countElement) {
        countElement.textContent = bucketData.count;
      }
      
      // Update coverage bar (percentage of global bucket total)
      if (bucketType !== 'all' && globalTotals[bucketType]) {
        const globalTotal = globalTotals[bucketType];
        const coveragePercent = globalTotal > 0 ? (bucketData.count / globalTotal * 100) : 0;
        
        if (coverageBar) {
          coverageBar.style.width = Math.min(coveragePercent, 100) + '%';
        }
        if (coverageText) {
          coverageText.textContent = coveragePercent.toFixed(0) + '%';
        }
      } else if (bucketType === 'all') {
        // For "all", show 100% coverage
        if (coverageBar) {
          coverageBar.style.width = '100%';
        }
        if (coverageText) {
          coverageText.textContent = '100%';
        }
      }
      
      // Update metrics bars - reuse existing elements for animation
      if (metricsContainer) {
        // Check if bars already exist
        let costBar = metricsContainer.querySelector('.cost-bar-fill');
        let costText = metricsContainer.querySelector('.cost-bar-text');
        let revenueBar = metricsContainer.querySelector('.revenue-bar-fill');
        let revenueText = metricsContainer.querySelector('.revenue-bar-text');
        let roasBar = metricsContainer.querySelector('.roas-bar-fill');
        let roasText = metricsContainer.querySelector('.roas-bar-text');
        
        // If bars don't exist, create them once
        if (!costBar) {
          metricsContainer.innerHTML = `
            <!-- Cost Bar -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="flex: 1; height: 16px; background: #e5e7eb; border-radius: 3px; position: relative; overflow: hidden;">
                <div class="cost-bar-fill" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: #dc2626; transition: width 0.3s ease;"></div>
                <div class="cost-bar-text" style="position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; font-weight: 600; color: #374151; z-index: 1;">
                  $0 (0%)
                </div>
              </div>
            </div>
            
            <!-- Revenue Bar -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="flex: 1; height: 16px; background: #e5e7eb; border-radius: 3px; position: relative; overflow: hidden;">
                <div class="revenue-bar-fill" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: #059669; transition: width 0.3s ease;"></div>
                <div class="revenue-bar-text" style="position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; font-weight: 600; color: #374151; z-index: 1;">
                  $0 (0%)
                </div>
              </div>
            </div>
            
            <!-- ROAS Bar -->
            <div style="display: flex; align-items: center; gap: 6px;">
              <div style="flex: 1; height: 16px; background: #e5e7eb; border-radius: 3px; position: relative; overflow: hidden;">
                <div class="roas-bar-fill" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: #f59e0b; transition: width 0.3s ease;"></div>
                <div class="roas-bar-text" style="position: absolute; left: 6px; top: 50%; transform: translateY(-50%); font-size: 10px; font-weight: 600; color: #374151; z-index: 1;">
                  ROAS: 0.00x
                </div>
              </div>
            </div>
          `;
          
          // Re-query the elements after creating
          costBar = metricsContainer.querySelector('.cost-bar-fill');
          costText = metricsContainer.querySelector('.cost-bar-text');
          revenueBar = metricsContainer.querySelector('.revenue-bar-fill');
          revenueText = metricsContainer.querySelector('.revenue-bar-text');
          roasBar = metricsContainer.querySelector('.roas-bar-fill');
          roasText = metricsContainer.querySelector('.roas-bar-text');
        }
        
        // Update the values - this will animate due to CSS transition
        if (costBar && costText) {
          costBar.style.width = Math.min(bucketData.costPercent, 100) + '%';
          costText.textContent = `$${bucketData.cost.toFixed(0)} (${bucketData.costPercent.toFixed(1)}%)`;
          costText.style.color = bucketData.costPercent > 15 ? 'white' : '#374151';
        }
        
        if (revenueBar && revenueText) {
          revenueBar.style.width = Math.min(bucketData.revenuePercent, 100) + '%';
          revenueText.textContent = `$${bucketData.revenue.toFixed(0)} (${bucketData.revenuePercent.toFixed(1)}%)`;
          revenueText.style.color = bucketData.revenuePercent > 15 ? 'white' : '#374151';
        }
        
        if (roasBar && roasText) {
          roasBar.style.width = Math.min((bucketData.roas / 5) * 100, 100) + '%';
          roasText.textContent = `ROAS: ${bucketData.roas.toFixed(2)}x`;
        }
      }
    }
  });
}

// Calculate global bucket totals from 365d data
async function calculateGlobalBucketTotals() {
  try {
    // Get cached bucket assignments
    const cachedBuckets = await window.calculateAndCacheSearchTermBuckets();
    
    // Count terms in each bucket
    const bucketTotals = {
      'Top Search Terms': 0,
      'Zero Converting Terms': 0,
      'High Revenue Terms': 0,
      'Hidden Gems': 0,
      'Low Performance': 0,
      'Mid-Performance': 0
    };
    
    Object.values(cachedBuckets).forEach(bucketName => {
      if (bucketTotals.hasOwnProperty(bucketName)) {
        bucketTotals[bucketName]++;
      }
    });
    
    return bucketTotals;
  } catch (error) {
    console.error('[Campaigns] Error calculating global bucket totals:', error);
    return {};
  }
}

// Update bucket UI with statistics
async function updateBucketUI(stats) {
  const bucketFilterContainer = document.getElementById('campaignBucketFilterContainer');
  if (!bucketFilterContainer) return;
  
  // Get global bucket totals
  const globalTotals = await calculateGlobalBucketTotals();
  
  // Calculate totals
  const totalClicks = stats['all'].clicks || 0;
  const totalRevenue = stats['all'].value || 0;
  
  const bucketCards = bucketFilterContainer.querySelectorAll('.bucket-card');
  
  bucketCards.forEach(card => {
    const bucketType = card.getAttribute('data-bucket');
    const countElement = card.querySelector('.bucket-count');
    const coverageContainer = card.querySelector('.bucket-coverage-container');
    const coverageBar = card.querySelector('.bucket-coverage-bar');
    const coverageText = card.querySelector('.bucket-coverage-text');
    
    // Get bar elements
    const clicksBarFill = card.querySelector('.clicks-bar-fill');
    const clicksBarText = card.querySelector('.clicks-bar-text');
    const clicksTrend = card.querySelector('.clicks-trend');
    
    const revenueBarFill = card.querySelector('.revenue-bar-fill');
    const revenueBarText = card.querySelector('.revenue-bar-text');
    const revenueTrend = card.querySelector('.revenue-trend');
    
    const valueBarFill = card.querySelector('.value-bar-fill');
    const valueBarText = card.querySelector('.value-bar-text');
    const valueTrend = card.querySelector('.value-trend');
    
    if (stats[bucketType]) {
      const bucketData = stats[bucketType];
      
      // Update count
      if (countElement) {
        countElement.textContent = bucketData.count;
      }
      
      // Update coverage bar (percentage of global bucket total)
      if (bucketType !== 'all' && coverageContainer && globalTotals[bucketType]) {
        const globalTotal = globalTotals[bucketType];
        const coveragePercent = globalTotal > 0 ? (bucketData.count / globalTotal * 100) : 0;
        
        coverageContainer.style.display = 'block';
        if (coverageBar) {
          coverageBar.style.width = Math.min(coveragePercent, 100) + '%';
        }
        if (coverageText) {
          coverageText.textContent = coveragePercent.toFixed(0) + '%';
        }
      } else if (bucketType === 'all') {
        // For "all", show 100% coverage
        if (coverageContainer) {
          coverageContainer.style.display = 'block';
          if (coverageBar) {
            coverageBar.style.width = '100%';
          }
          if (coverageText) {
            coverageText.textContent = '100%';
          }
        }
      }
      
      // Calculate percentages
      const clicksPct = bucketData.clicksPercent || 0;
      const revenuePct = bucketData.revenuePercent || 0;
      const valueAmt = bucketData.value || 0;
      
      // Update clicks bar
      if (clicksBarFill && clicksBarText) {
        clicksBarFill.style.width = Math.min(clicksPct, 100) + '%';
        clicksBarText.textContent = clicksPct.toFixed(1) + '%';
        clicksBarText.style.color = clicksPct > 10 ? 'white' : '#374151';
      }
      
      // Add clicks trend
      if (clicksTrend && Math.abs(bucketData.clicksTrend) >= 0.1) {
        clicksTrend.innerHTML = `
          <div style="
            background: ${bucketData.clicksTrend > 0 ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 32px;
            text-align: center;
          ">
            ${bucketData.clicksTrend > 0 ? '↑' : '↓'} ${Math.abs(bucketData.clicksTrend).toFixed(0)}%
          </div>
        `;
      }
      
      // Update revenue bar
      if (revenueBarFill && revenueBarText) {
        revenueBarFill.style.width = Math.min(revenuePct, 100) + '%';
        revenueBarText.textContent = revenuePct.toFixed(1) + '%';
        revenueBarText.style.color = revenuePct > 10 ? 'white' : '#374151';
      }
      
      // Add revenue trend
      if (revenueTrend && Math.abs(bucketData.valueTrend) >= 0.1) {
        revenueTrend.innerHTML = `
          <div style="
            background: ${bucketData.valueTrend > 0 ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 32px;
            text-align: center;
          ">
            ${bucketData.valueTrend > 0 ? '↑' : '↓'} ${Math.abs(bucketData.valueTrend).toFixed(0)}%
          </div>
        `;
      }
      
      // Update value bar with amount and percentage
      if (valueBarFill && valueBarText) {
        const valuePercent = totalRevenue > 0 ? (valueAmt / totalRevenue * 100) : 0;
        valueBarFill.style.width = Math.min(valuePercent, 100) + '%';
        
        // Format value text with both amount and percentage
        let valueTextContent = '';
        if (valueAmt >= 1000) {
          valueTextContent = `$${(valueAmt / 1000).toFixed(1)}k`;
        } else {
          valueTextContent = `$${valueAmt.toFixed(0)}`;
        }
        
        // Add percentage in parentheses
        valueTextContent += ` (${valuePercent.toFixed(1)}%)`;
        
        valueBarText.textContent = valueTextContent;
        valueBarText.style.color = valuePercent > 10 ? 'white' : '#374151';
        valueBarText.style.fontSize = '9px';
      }
      
      // Add value trend
      if (valueTrend && Math.abs(bucketData.valueChange) >= 1) {
        valueTrend.innerHTML = `
          <div style="
            background: ${bucketData.valueChange > 0 ? '#10b981' : '#ef4444'};
            color: white;
            padding: 1px 4px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: 500;
            white-space: nowrap;
            min-width: 32px;
            text-align: center;
          ">
            ${bucketData.valueChange > 0 ? '↑' : '↓'} $${Math.abs(bucketData.valueChange).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
          </div>
        `;
      }
    }
  });
}

// Populate the searches analysis section with grouped buckets
function populateSearchesAnalysis(bucketStats) {
  // If we have pre-calculated efficiency metrics from the selected campaign, use those
  if (window.selectedCampaign && window.selectedCampaign.efficiency && window.selectedCampaign.efficiency.searchesMetrics) {
    window.searchesEfficiencyMetrics = window.selectedCampaign.efficiency.searchesMetrics;
  } else {
    // Calculate new metrics if not available
    window.searchesEfficiencyMetrics = calculateSearchesEfficiencyMetrics(bucketStats);
  }
  
  // Render the new efficiency container
  renderEfficiencyContainer();
  
  // Rest of the original function continues here...
  // Define high-performing and low-performing groups
  const highPerformingGroup = {
    title: 'High Performing',
    buckets: [
      { key: 'Top Search Terms', color: '#FFC107', shortName: 'Top Terms' },
      { key: 'High Revenue Terms', color: '#4CAF50', shortName: 'High Revenue' },
      { key: 'Hidden Gems', color: '#2196F3', shortName: 'Hidden Gems' }
    ]
  };
  
  const lowPerformingGroup = {
    title: 'Low Performing',
    buckets: [
      { key: 'Mid-Performance', color: '#FF9800', shortName: 'Mid Perf' },
      { key: 'Low Performance', color: '#9E9E9E', shortName: 'Low Perf' },
      { key: 'Zero Converting Terms', color: '#F44336', shortName: 'Zero Conv' }
    ]
  };
  
  // Calculate group totals
  function calculateGroupTotals(group) {
    let totalCount = 0, totalClicks = 0, totalRevenue = 0;
    
    group.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key];
      if (stats) {
        totalCount += stats.count || 0;
        totalClicks += stats.clicks || 0;
        totalRevenue += stats.revenue || 0;
      }
    });
    
    const allTotalClicks = bucketStats['all']?.clicks || 1;
    const allTotalRevenue = bucketStats['all']?.revenue || 1;
    const clicksPercent = (totalClicks / allTotalClicks * 100);
    const revenuePercent = (totalRevenue / allTotalRevenue * 100);
    
    return { totalCount, totalClicks, totalRevenue, clicksPercent, revenuePercent };
  }
  
  const highPerfTotals = calculateGroupTotals(highPerformingGroup);
  const lowPerfTotals = calculateGroupTotals(lowPerformingGroup);
  
  // Get both containers
  const containers = [
    document.getElementById('campaignSearchesContent'),
    document.getElementById('campaignSearchesContentSearchTerms')
  ];
  
  containers.forEach(container => {
    if (!container) return;
    
    let html = '';
    
    // High Performing Group Summary
    html += `
      <div class="campaign-search-bucket-row" style="
        background: linear-gradient(to right, #dcfce7, #f0fdf4);
        border-left: 3px solid #22c55e;
        padding: 6px 8px;
        margin-bottom: 2px;
        font-weight: 600;
      ">
        <div style="
          width: 40px;
          height: 24px;
          background: #22c55e;
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        ">
          ${highPerfTotals.totalCount}
        </div>
        <div style="
          width: 80px;
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
        ">
          High Perf
        </div>
        <div class="campaign-search-bucket-bar" style="margin-right: 4px;">
          <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(highPerfTotals.clicksPercent, 100)}%; background: #1e40af; transition: width 0.3s ease;"></div>
          <div class="campaign-search-bucket-bar-text" style="${highPerfTotals.clicksPercent > 20 ? 'color: white;' : ''}">
            ${highPerfTotals.clicksPercent.toFixed(1)}%
          </div>
        </div>
        <div class="campaign-search-bucket-bar">
          <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(highPerfTotals.revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
          <div class="campaign-search-bucket-bar-text" style="${highPerfTotals.revenuePercent > 20 ? 'color: white;' : ''}">
            ${highPerfTotals.revenuePercent.toFixed(1)}%
          </div>
        </div>
      </div>
    `;
    
    // High performing bucket rows
    highPerformingGroup.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key];
      if (!stats) return;
      
      const clicksPercent = stats.clicksPercent || 0;
      const revenuePercent = stats.revenuePercent || 0;
      
      html += `
        <div class="campaign-search-bucket-row" style="padding-left: 20px; background: rgba(220, 252, 231, 0.1);">
          <div class="campaign-search-bucket-count" style="background: ${bucket.color};">
            ${stats.count}
          </div>
          <div class="campaign-search-bucket-name" title="${bucket.key}" style="width: 80px;">
            ${bucket.shortName}
          </div>
          <div class="campaign-search-bucket-bar" style="margin-right: 4px;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(clicksPercent, 100)}%; background: #1e40af; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${clicksPercent > 20 ? 'color: white;' : ''}">
              ${clicksPercent.toFixed(1)}%
            </div>
          </div>
          <div class="campaign-search-bucket-bar">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${revenuePercent > 20 ? 'color: white;' : ''}">
              ${revenuePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      `;
    });
    
    // Add spacing between groups
    html += '<div style="height: 8px;"></div>';
    
    // Low Performing Group Summary
    html += `
      <div class="campaign-search-bucket-row" style="
        background: linear-gradient(to right, #fee2e2, #fef2f2);
        border-left: 3px solid #ef4444;
        padding: 6px 8px;
        margin-bottom: 2px;
        font-weight: 600;
      ">
        <div style="
          width: 40px;
          height: 24px;
          background: #ef4444;
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        ">
          ${lowPerfTotals.totalCount}
        </div>
        <div style="
          width: 80px;
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
        ">
          Low Perf
        </div>
        <div class="campaign-search-bucket-bar" style="margin-right: 4px;">
          <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(lowPerfTotals.clicksPercent, 100)}%; background: #1e40af; transition: width 0.3s ease;"></div>
          <div class="campaign-search-bucket-bar-text" style="${lowPerfTotals.clicksPercent > 20 ? 'color: white;' : ''}">
            ${lowPerfTotals.clicksPercent.toFixed(1)}%
          </div>
        </div>
        <div class="campaign-search-bucket-bar">
          <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(lowPerfTotals.revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
          <div class="campaign-search-bucket-bar-text" style="${lowPerfTotals.revenuePercent > 20 ? 'color: white;' : ''}">
            ${lowPerfTotals.revenuePercent.toFixed(1)}%
          </div>
        </div>
      </div>
    `;
    
    // Low performing bucket rows
    lowPerformingGroup.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key];
      if (!stats) return;
      
      const clicksPercent = stats.clicksPercent || 0;
      const revenuePercent = stats.revenuePercent || 0;
      
      html += `
        <div class="campaign-search-bucket-row" style="padding-left: 20px; background: rgba(254, 226, 226, 0.1);">
          <div class="campaign-search-bucket-count" style="background: ${bucket.color};">
            ${stats.count}
          </div>
          <div class="campaign-search-bucket-name" title="${bucket.key}" style="width: 80px;">
            ${bucket.shortName}
          </div>
          <div class="campaign-search-bucket-bar" style="margin-right: 4px;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(clicksPercent, 100)}%; background: #1e40af; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${clicksPercent > 20 ? 'color: white;' : ''}">
              ${clicksPercent.toFixed(1)}%
            </div>
          </div>
          <div class="campaign-search-bucket-bar">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${revenuePercent > 20 ? 'color: white;' : ''}">
              ${revenuePercent.toFixed(1)}%
            </div>
          </div>
        </div>
      `;
    });
    
    container.innerHTML = html || '<div style="text-align: center; color: #999; font-size: 11px; padding: 10px;">No data available</div>';
  });

// Update analysis headers with metrics
  updateAnalysisHeaders();  
  
}

// Helper function to update analysis bars with animation
function updateAnalysisBarAnimated(container, value, maxValue, color, label) {
  let barFill = container.querySelector('.analysis-bar-fill');
  let barText = container.querySelector('.analysis-bar-text');
  
  if (!barFill) {
    // Create the bar structure if it doesn't exist
    container.innerHTML = `
      <div style="width: 100%; height: 18px; background: #e5e7eb; border-radius: 9px; position: relative; overflow: hidden;">
        <div class="analysis-bar-fill" style="position: absolute; left: 0; top: 0; height: 100%; width: 0%; background: ${color}; transition: width 0.3s ease;"></div>
        <div class="analysis-bar-text" style="position: absolute; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 600; color: #374151; z-index: 1;">${label}</div>
      </div>
    `;
    barFill = container.querySelector('.analysis-bar-fill');
    barText = container.querySelector('.analysis-bar-text');
  }
  
  // Update values - this will animate
  const percentage = maxValue > 0 ? (value / maxValue * 100) : 0;
  barFill.style.width = Math.min(percentage, 100) + '%';
  barFill.style.background = color;
  barText.textContent = label;
  barText.style.color = percentage > 50 ? 'white' : '#374151';
}

// Populate the products analysis section with grouped buckets
function populateProductsAnalysis(bucketStats) {
    // If we have pre-calculated efficiency metrics from the selected campaign, use those
  if (window.selectedCampaign && window.selectedCampaign.efficiency && window.selectedCampaign.efficiency.productsMetrics) {
    window.productsEfficiencyMetrics = window.selectedCampaign.efficiency.productsMetrics;
  } else {
    // Calculate new metrics if not available
    window.productsEfficiencyMetrics = calculateProductsEfficiencyMetrics(bucketStats);
  }
  
  // Render the new efficiency container
  renderEfficiencyContainer();
  
  // Rest of the original function continues here...
  // Define positive and negative groups
  const positiveGroup = {
    title: 'Profitable Products',
    buckets: [
      { key: 'Profit Stars', color: '#FFD700', shortName: 'Profit Stars' },
      { key: 'Strong Performers', color: '#4CAF50', shortName: 'Strong Perf' },
      { key: 'Steady Contributors', color: '#2196F3', shortName: 'Steady' }
    ]
  };
  
  const negativeGroup = {
    title: 'Underperforming Products',
    buckets: [
      { key: 'Break-Even Products', color: '#FF9800', shortName: 'Break-Even' },
      { key: 'True Losses', color: '#F44336', shortName: 'Losses' },
      { key: 'Insufficient Data', color: '#9E9E9E', shortName: 'Insufficient' }
    ]
  };
  
  // Calculate group totals
  function calculateGroupTotals(group) {
    let totalCount = 0, totalCost = 0, totalRevenue = 0;
    
    group.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key] || { count: 0, cost: 0, revenue: 0 };
      totalCount += stats.count;
      totalCost += stats.cost;
      totalRevenue += stats.revenue;
    });
    
    const roas = totalCost > 0 ? (totalRevenue / totalCost) : 0;
    const allTotalCost = bucketStats['all']?.cost || 1;
    const allTotalRevenue = bucketStats['all']?.revenue || 1;
    const costPercent = (totalCost / allTotalCost * 100);
    const revenuePercent = (totalRevenue / allTotalRevenue * 100);
    
    return { totalCount, totalCost, totalRevenue, roas, costPercent, revenuePercent };
  }
  
  const positiveTotals = calculateGroupTotals(positiveGroup);
  const negativeTotals = calculateGroupTotals(negativeGroup);
  
  // Get both containers
  const containers = [
    document.getElementById('campaignProductsContent'),
    document.getElementById('campaignProductsContentSearchTerms')
  ];
  
  containers.forEach(contentDiv => {
    if (!contentDiv) return;
    
    let html = '';
    
    // Positive Group
    html += `
      <!-- Positive Group Summary -->
      <div class="campaign-search-bucket-row" style="
        background: linear-gradient(to right, #dcfce7, #f0fdf4);
        border-left: 3px solid #22c55e;
        padding: 6px 8px;
        margin-bottom: 2px;
        font-weight: 600;
      ">
        <div style="
          width: 40px;
          height: 24px;
          background: #22c55e;
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        ">
          ${positiveTotals.totalCount}
        </div>
        <div style="
          width: 70px;
          font-size: 11px;
          font-weight: 700;
          color: #15803d;
        ">
          Profitable
        </div>
        <div style="
          flex: 0.8;
          height: 16px;
          background: rgba(220, 38, 38, 0.2);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
          margin-right: 4px;
        ">
          <div style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${Math.min(positiveTotals.costPercent, 100)}%;
            background: #dc2626;
            transition: width 0.3s ease;
          "></div>
          <div style="
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9px;
            font-weight: 600;
            color: ${positiveTotals.costPercent > 25 ? 'white' : '#374151'};
            z-index: 1;
          ">
            ${positiveTotals.costPercent.toFixed(0)}%
          </div>
        </div>
        <div style="
          flex: 0.8;
          height: 16px;
          background: rgba(5, 150, 105, 0.2);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${Math.min(positiveTotals.revenuePercent, 100)}%;
            background: #059669;
            transition: width 0.3s ease;
          "></div>
          <div style="
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9px;
            font-weight: 600;
            color: ${positiveTotals.revenuePercent > 25 ? 'white' : '#374151'};
            z-index: 1;
          ">
            ${positiveTotals.revenuePercent.toFixed(0)}%
          </div>
        </div>
        <div style="
          width: 45px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: #22c55e;
          background: rgba(34, 197, 94, 0.15);
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid rgba(34, 197, 94, 0.3);
        ">
          ${positiveTotals.roas.toFixed(1)}x
        </div>
      </div>
    `;
    
    // Positive bucket rows
    positiveGroup.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key] || { count: 0, costPercent: 0, revenuePercent: 0, roas: 0 };
      
      // Determine ROAS color
      let roasColor = '#F44336';
      if (stats.roas >= 4) roasColor = '#4CAF50';
      else if (stats.roas >= 2) roasColor = '#FFC107';
      else if (stats.roas >= 1) roasColor = '#FF9800';
      
      html += `
        <div class="campaign-search-bucket-row" style="padding-left: 20px; background: rgba(220, 252, 231, 0.1);">
          <div class="campaign-search-bucket-count" style="background: ${bucket.color};">
            ${stats.count}
          </div>
          <div class="campaign-search-bucket-name" title="${bucket.key}" style="width: 70px;">
            ${bucket.shortName}
          </div>
          <div class="campaign-search-bucket-bar" style="margin-right: 4px; flex: 0.8;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(stats.costPercent, 100)}%; background: #dc2626; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${stats.costPercent > 25 ? 'color: white;' : ''}; font-size: 9px;">
              ${stats.costPercent.toFixed(0)}%
            </div>
          </div>
          <div class="campaign-search-bucket-bar" style="flex: 0.8;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(stats.revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${stats.revenuePercent > 25 ? 'color: white;' : ''}; font-size: 9px;">
              ${stats.revenuePercent.toFixed(0)}%
            </div>
          </div>
          <div class="campaign-roas-value" style="
            width: 45px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: ${stats.count > 0 ? roasColor : '#9E9E9E'};
            background: ${stats.count > 0 ? roasColor + '15' : '#F5F5F5'};
            padding: 2px 4px;
            border-radius: 4px;
            border: 1px solid ${stats.count > 0 ? roasColor + '30' : '#E0E0E0'};
            transition: all 0.3s ease;
          ">
            ${stats.count > 0 ? stats.roas.toFixed(1) + 'x' : '-'}
          </div>
        </div>
      `;
    });
    
    // Add spacing between groups
    html += '<div style="height: 8px;"></div>';
    
    // Negative Group Summary
    html += `
      <!-- Negative Group Summary -->
      <div class="campaign-search-bucket-row" style="
        background: linear-gradient(to right, #fee2e2, #fef2f2);
        border-left: 3px solid #ef4444;
        padding: 6px 8px;
        margin-bottom: 2px;
        font-weight: 600;
      ">
        <div style="
          width: 40px;
          height: 24px;
          background: #ef4444;
          color: white;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
        ">
          ${negativeTotals.totalCount}
        </div>
        <div style="
          width: 70px;
          font-size: 11px;
          font-weight: 700;
          color: #dc2626;
        ">
          Underperf.
        </div>
        <div style="
          flex: 0.8;
          height: 16px;
          background: rgba(220, 38, 38, 0.2);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
          margin-right: 4px;
        ">
          <div style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${Math.min(negativeTotals.costPercent, 100)}%;
            background: #dc2626;
            transition: width 0.3s ease;
          "></div>
          <div style="
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9px;
            font-weight: 600;
            color: ${negativeTotals.costPercent > 25 ? 'white' : '#374151'};
            z-index: 1;
          ">
            ${negativeTotals.costPercent.toFixed(0)}%
          </div>
        </div>
        <div style="
          flex: 0.8;
          height: 16px;
          background: rgba(5, 150, 105, 0.2);
          border-radius: 3px;
          position: relative;
          overflow: hidden;
        ">
          <div style="
            position: absolute;
            left: 0;
            top: 0;
            height: 100%;
            width: ${Math.min(negativeTotals.revenuePercent, 100)}%;
            background: #059669;
            transition: width 0.3s ease;
          "></div>
          <div style="
            position: absolute;
            left: 6px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 9px;
            font-weight: 600;
            color: ${negativeTotals.revenuePercent > 25 ? 'white' : '#374151'};
            z-index: 1;
          ">
            ${negativeTotals.revenuePercent.toFixed(0)}%
          </div>
        </div>
        <div style="
          width: 45px;
          text-align: center;
          font-size: 11px;
          font-weight: 700;
          color: ${negativeTotals.roas >= 1 ? '#FF9800' : '#ef4444'};
          background: ${negativeTotals.roas >= 1 ? 'rgba(255, 152, 0, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
          padding: 2px 4px;
          border-radius: 4px;
          border: 1px solid ${negativeTotals.roas >= 1 ? 'rgba(255, 152, 0, 0.3)' : 'rgba(239, 68, 68, 0.3)'};
        ">
          ${negativeTotals.roas.toFixed(1)}x
        </div>
      </div>
    `;
    
    // Negative bucket rows
    negativeGroup.buckets.forEach(bucket => {
      const stats = bucketStats[bucket.key] || { count: 0, costPercent: 0, revenuePercent: 0, roas: 0 };
      
      // Determine ROAS color
      let roasColor = '#F44336';
      if (stats.roas >= 4) roasColor = '#4CAF50';
      else if (stats.roas >= 2) roasColor = '#FFC107';
      else if (stats.roas >= 1) roasColor = '#FF9800';
      
      html += `
        <div class="campaign-search-bucket-row" style="padding-left: 20px; background: rgba(254, 226, 226, 0.1);">
          <div class="campaign-search-bucket-count" style="background: ${bucket.color};">
            ${stats.count}
          </div>
          <div class="campaign-search-bucket-name" title="${bucket.key}" style="width: 70px;">
            ${bucket.shortName}
          </div>
          <div class="campaign-search-bucket-bar" style="margin-right: 4px; flex: 0.8;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(stats.costPercent, 100)}%; background: #dc2626; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${stats.costPercent > 25 ? 'color: white;' : ''}; font-size: 9px;">
              ${stats.costPercent.toFixed(0)}%
            </div>
          </div>
          <div class="campaign-search-bucket-bar" style="flex: 0.8;">
            <div class="campaign-search-bucket-bar-fill" style="width: ${Math.min(stats.revenuePercent, 100)}%; background: #059669; transition: width 0.3s ease;"></div>
            <div class="campaign-search-bucket-bar-text" style="${stats.revenuePercent > 25 ? 'color: white;' : ''}; font-size: 9px;">
              ${stats.revenuePercent.toFixed(0)}%
            </div>
          </div>
          <div class="campaign-roas-value" style="
            width: 45px;
            text-align: center;
            font-size: 11px;
            font-weight: 700;
            color: ${stats.count > 0 ? roasColor : '#9E9E9E'};
            background: ${stats.count > 0 ? roasColor + '15' : '#F5F5F5'};
            padding: 2px 4px;
            border-radius: 4px;
            border: 1px solid ${stats.count > 0 ? roasColor + '30' : '#E0E0E0'};
            transition: all 0.3s ease;
          ">
            ${stats.count > 0 ? stats.roas.toFixed(1) + 'x' : '-'}
          </div>
        </div>
      `;
    });
    
    contentDiv.innerHTML = html || '<div style="text-align: center; color: #999; font-size: 11px; padding: 10px;">No data available</div>';
  });

  // Update analysis headers with metrics
  updateAnalysisHeaders();

}

// Check if table structure can be reused for animation
function canReuseTableStructure(container, newDataLength) {
  const existingTable = container.querySelector('.camp-table-modern');
  if (!existingTable) return false;
  
  const existingRows = existingTable.querySelectorAll('tbody tr.main-row');
  // Only reuse if row count is similar (within 20% difference)
  const difference = Math.abs(existingRows.length - newDataLength);
  return difference <= Math.max(5, newDataLength * 0.2);
}

// Update existing table bars with animation
function updateTableBarsAnimated(container, tableData, totals) {
  const rows = container.querySelectorAll('tbody tr.main-row');
  
  rows.forEach((row, index) => {
    if (index >= tableData.length) return;
    
    const product = tableData[index];
    const barCells = row.querySelectorAll('.camp-metric-bar-fill');
    const percentTexts = row.querySelectorAll('.camp-metric-percent');
    
    // Update each metric bar
    ['impressions', 'clicks', 'cost', 'conversions', 'convValue'].forEach((metric, i) => {
      if (barCells[i] && percentTexts[i]) {
        const percentage = totals[metric] > 0 ? (product[metric] / totals[metric] * 100) : 0;
        barCells[i].style.width = percentage + '%';
        percentTexts[i].textContent = percentage.toFixed(1) + '%';
      }
    });
  });
}

// Render products table with improved design
function renderProductsTable(container, tableData, campaignName) {

  // Calculate totals first (needed for reuse check)
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

// Try to reuse existing table structure for animation
if (canReuseTableStructure(container, tableData.length)) {
  updateTableBarsAnimated(container, tableData, totals);
  // Still need to update other values, but bars will animate
}
  
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
`<div style="width: 60px; height: 36px; background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%); border: 1px solid #d0d0d0; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 600; color: #9e9e9e;">
  <span>No Sales</span>
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
<td style="width: 220px;">
  <div style="display: flex; flex-direction: column;">
    <div class="camp-product-title">${product.title}</div>
    <div style="display: flex; flex-wrap: wrap; gap: 4px;">
      ${product.sellerStatus && product.sellerStatus !== 'Standard' ? 
        `<span class="product-status-badge ${product.sellerStatus.toLowerCase().replace(/\s+/g, '-')}">${product.sellerStatus}</span>` : 
        ''}
      ${getProfitabilityBucketBadge(product.profitabilityBucket)}
    </div>
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
