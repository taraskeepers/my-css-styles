// price_monitoring_products.js
// Price Monitoring - Products View Module

// Global state for filtering
let selectedBucket = null;
let allProductsData = {
  myCompany: [],
  competitors: []
};

let currentSortMyCompany = 'high';
let currentSortCompetitors = 'high';
let showDiscountedOnly = false;
let competitorsPriceData = {
  cheapest: null,
  mostExpensive: null
};
let selectedCompany = null;
let selectedCompanyData = null;

function initializePriceMonitoringProducts() {
  console.log('[PM Products] Initializing products view module');
  
  // Only initialize if we're on the products view
  const productsWrapper = document.getElementById('pmProductsWrapperContainer');
  if (!productsWrapper) return;
  
  // Add products-specific styles
  addProductsViewStyles();
  
  // Initialize the products dashboard
  renderProductsDashboard();
}

function addProductsViewStyles() {
  if (document.getElementById('pmProductsStyles')) return;
  
  const styles = `
    <style id="pmProductsStyles">
      /* Products View - INDEPENDENT Styles */
.pm-products-wrapper-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: row;  /* Add this to ensure horizontal layout */
  gap: 15px;
  padding: 0;
  box-sizing: border-box;
}
      
      /* Left column with overview and buckets */
      .pmp-left-column {
        display: flex;
        flex-direction: column;
        gap: 15px;
        width: 420px;
        flex-shrink: 0;
      }
      
      /* Right column with product lists */
      .pmp-right-column {
        display: flex;
        gap: 15px;
        flex: 1;
        min-width: 0;
        height: 100%;
      }
      
      /* Products overview card - EXACT height of company overview card */
      .pmp-products-overview-card {
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
        flex-shrink: 0;
      }
      
      .pmp-products-overview-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 3px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      /* Products name styled EXACTLY like company name */
      .products-name-header {
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
      
      /* Products buckets card */
      .pmp-products-buckets-card {
        background: white;
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        position: relative;
        width: 420px;
        display: flex;
        flex-direction: column;
        flex: 1;
        min-height: 0;
      }
      
      .pmp-products-buckets-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #4CAF50, #9C27B0);
      }
      
      /* Products buckets table */
      .pmp-products-buckets-table {
        margin-top: 12px;
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
      }
      
      /* Updated products buckets styles */
.pmp-products-buckets-header {
  display: grid;
  grid-template-columns: 90px 1fr 1fr auto;  /* 4 columns now */
  padding: 12px 16px;
  font-size: 10px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #f0f0f0;
  background: #fafafa;
  border-radius: 8px 8px 0 0;
}
      
      .pmp-products-buckets-header .pmp-share-header {
        text-align: center;
        line-height: 1.2;
      }
      
      .pmp-products-bucket-row.is-dominant {
        background: linear-gradient(90deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
        border-left: 4px solid #667eea;
        font-weight: 600;
      }
      
      .pmp-products-bucket-row.is-dominant .pmp-bucket-name {
        color: #667eea;
        font-weight: 700;
      }
      
      /* Dual bar container */
      .pmp-dual-bars-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        flex: 1;
      }
      
      .pmp-bar-row {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pmp-bar-label {
        font-size: 9px;
        color: #888;
        min-width: 40px;
        text-transform: uppercase;
        font-weight: 500;
      }
      
      .pmp-tree-bar-container {
        flex: 1;
        height: 30px;
        position: relative;
        background: #f5f5f5;
        border-radius: 6px;
        overflow: hidden;
        max-width: 200px;
      }
      
      .pmp-tree-bar-container.small {
        height: 30px;
        max-width: 150px;
      }
      
      .pmp-bar-percent-outside {
        position: absolute;
        right: 8px;
        top: 50%;
        transform: translateY(-50%);
        font-size: 11px;
        font-weight: 600;
        color: #444;
        z-index: 2;
      }
      
      .pmp-bar-percent-outside.small {
        font-size: 10px;
      }
      
      .pmp-products-buckets-body {
        flex: 1;
        overflow-y: auto;
        min-height: 0;
      }
      
      /* Products buckets row */
.pmp-products-bucket-row {
  display: grid;
  grid-template-columns: 90px 1fr 1fr auto;  /* 4 columns now */
  min-height: 80px;
  align-items: center;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  transition: background 0.2s;
}
      
      .pmp-products-bucket-row:hover {
        background: #fafafa;
      }
      
      .pmp-bucket-label {
        padding: 8px 12px;
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      
      .pmp-bucket-name {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 500;
      }
      
      .pmp-bucket-indicator {
        width: 12px;
        height: 12px;
        border-radius: 3px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
      }
      
      .pmp-bucket-range {
        font-size: 10px;
        color: #888;
        font-family: 'Monaco', 'Menlo', monospace;
        padding-left: 20px;
      }
      
      .pmp-products-data {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 0 10px;
      }
      
      .pmp-tree-bar {
        height: 100%;
        position: relative;
        transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        opacity: 0.85;
      }
      
      .pmp-products-box {
        display: inline-flex;
        align-items: center;
        padding: 6px 10px;
        border-radius: 8px;
        border: 1px solid;
        font-size: 12px;
        font-weight: 600;
        gap: 3px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.08);
        transition: transform 0.2s;
      }
      
      .pmp-products-count {
        color: #2c2c2c;
        font-weight: 700;
      }
      
      .pmp-products-sep {
        color: #888;
        margin: 0 1px;
      }
      
      .pmp-discounted-count {
        color: #555;
        font-weight: 600;
      }
      
      .pmp-discount-badge {
        display: inline-block;
        padding: 4px 8px;
        background: #ff4444;
        color: white;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
      }
      
      .pmp-discount-badge-empty {
        display: inline-block;
        padding: 4px 8px;
        color: #ccc;
        font-size: 11px;
      }
      
      .pmp-tree-metrics {
        display: flex;
        align-items: center;
        gap: 5px;
      }
      
      /* Direct heading styles for products */
      .pmp-products-buckets-card h4 {
        margin: 0 0 12px 0;
        font-size: 11px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      
      /* Product list cards */
      .pmp-products-mycompany-card,
      .pmp-products-competitors-card {
        background: white;
        border-radius: 12px;
        padding: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        flex: 1;
        display: flex;
        flex-direction: column;
        position: relative;
        min-width: 0;
      }
      
      .pmp-products-mycompany-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #667eea, #764ba2);
      }
      
      .pmp-products-competitors-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 2px;
        background: linear-gradient(90deg, #ff6b6b, #ffd93d);
      }
      
.pmp-products-list-header {
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
      
/* Products list - Update overflow settings */
.pmp-products-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible; /* Allow horizontal overflow */
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
  position: relative;
  z-index: 1; /* Add z-index */
}

/* Individual product card - Ensure proper positioning */
.pm-ad-details {
  display: flex;
  background: #fafafa;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  height: 100px;
  overflow: visible; /* Change from hidden to visible */
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative; /* Ensure this is set */
  z-index: 1; /* Add base z-index */
}
      
      .pm-ad-details:hover {
        background: #fff;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }
      
.pm-ad-image {
  width: 100px;  /* Changed from 130px */
  height: 100px;  /* Changed from 130px */
  flex-shrink: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  background-color: #f5f5f5;
}

/* Add after .pm-ad-info styles */
.pm-ad-bucket-box {
  width: 30px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  flex-shrink: 0;
}

/* Bucket colors for price_bucket_box */
.pm-ad-bucket-ultra-cheap { background: #4CAF50; }
.pm-ad-bucket-budget { background: #66BB6A; }
.pm-ad-bucket-mid { background: #FF9800; }
.pm-ad-bucket-upper-mid { background: #FFC107; }
.pm-ad-bucket-premium { background: #7B1FA2; }
.pm-ad-bucket-ultra-premium { background: #9C27B0; }

/* Selected bucket styling */
.pmp-products-bucket-row.selected {
  background: rgba(102, 126, 234, 0.15);
  border-left: 4px solid #667eea;
}

.pmp-products-bucket-row {
  cursor: pointer;
  user-select: none;
}

/* Clear filter button */
.pmp-clear-filter {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #666;
  transition: all 0.2s ease;
  z-index: 10;
}

.pmp-clear-filter:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.pmp-clear-filter.active {
  display: flex;
}

/* Animation for products list */
.pmp-products-list {
  transition: opacity 0.3s ease;
}

.pmp-products-list.filtering {
  opacity: 0.3;
}
      
      .pm-ad-discount-badge {
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
      
      .pm-ad-info {
        flex: 1;
        padding: 12px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-width: 0;
      }
      
      .pm-ad-title {
        font-size: 13px;
        font-weight: 500;
        color: #333;
        line-height: 1.4;
        overflow: hidden;
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        text-overflow: ellipsis;
        margin-bottom: 8px;
      }
      
      .pm-ad-price-container {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .pm-ad-current-price {
        font-size: 18px;
        font-weight: 700;
        color: #333;
      }
      
      .pm-ad-old-price {
        font-size: 14px;
        color: #999;
        text-decoration: line-through;
      }
      
      .pm-ad-price-discounted {
        color: #ff4444;
      }
      
      /* Loading states */
      .pmp-loading {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        color: #999;
        font-size: 14px;
      }
      
      .pmp-no-products {
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 40px;
        color: #999;
        font-size: 14px;
        text-align: center;
      }
      
      /* Scrollbar styling */
      .pmp-products-buckets-body::-webkit-scrollbar,
      .pmp-products-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-track,
      .pmp-products-list::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 3px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-thumb,
      .pmp-products-list::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .pmp-products-buckets-body::-webkit-scrollbar-thumb:hover,
      .pmp-products-list::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }

      /* Butterfly bar containers */
.pmp-butterfly-bars {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 0 10px;
}

.pmp-butterfly-left,
.pmp-butterfly-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pmp-butterfly-left .pmp-tree-bar-container {
  direction: rtl;
}

.pmp-butterfly-left .pmp-tree-bar {
  float: right;
}

.pmp-butterfly-right .pmp-tree-bar-container {
  direction: ltr;
}

.pmp-butterfly-divider {
  width: 1px;
  height: 60px;
  background: #e0e0e0;
  margin: 0 4px;
}

/* Products data column adjustments */
.pmp-products-data-column {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
}

/* Header with buttons */
.pmp-products-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.pmp-sort-buttons {
  display: flex;
  gap: 4px;
}

.pmp-sort-btn,
.pmp-filter-btn {
  padding: 4px 8px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.pmp-sort-btn:hover,
.pmp-filter-btn:hover {
  background: #f5f5f5;
}

.pmp-sort-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.pmp-filter-btn.active {
  background: #ff6b6b;
  color: white;
  border-color: #ff6b6b;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

/* Company filter dropdown */
.pmp-company-filter-container {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
}

.pmp-company-select {
  padding: 4px 8px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 150px;
  max-width: 200px;
}

.pmp-company-select:hover {
  border-color: #667eea;
}

.pmp-company-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

.pmp-company-clear-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #f0f0f0;
  border: none;
  cursor: pointer;
  display: none;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  padding: 0;
  flex-shrink: 0;
}

.pmp-company-clear-btn:hover {
  background: #e0e0e0;
  transform: scale(1.1);
}

.pmp-company-clear-btn.active {
  display: flex;
}

/* Special badge boxes */
.pm-ad-special-box {
  width: 30px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  font-size: 7px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: white;
  flex-shrink: 0;
}

.pm-ad-special-cheapest { background: #4CAF50; }
.pm-ad-special-expensive { background: #E91E63; }
.pm-ad-special-promo { background: #FF9800; }

/* Source badge for competitors */
.pm-ad-source {
  font-size: 10px;
  color: #888;
  font-weight: 500;
  margin-left: 8px;
  padding: 2px 6px;
  background: #f5f5f5;
  border-radius: 3px;
}

/* Tree/Butterfly styles from main file */
.pm-tree-market {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 8px;
  gap: 8px;
}

.pm-tree-company {
  display: flex;
  align-items: center;
  padding: 0 8px;
  gap: 8px;
}

.pm-tree-center {
  width: 2px;
  height: 100%;
  background: linear-gradient(180deg, #e8e8e8, #f5f5f5, #e8e8e8);
  position: relative;
}

.pm-tree-bar-container.left {
  display: flex;
  justify-content: flex-end;
}

.pm-tree-bar-container.right {
  display: flex;
  justify-content: flex-start;
}

.pm-bar-percent-outside.left {
  left: 8px;
}

.pm-bar-percent-outside.right {
  right: 8px;
}
/* Expandable product details */
.pm-ad-details {
  position: relative; /* IMPORTANT: Add this */
  transition: all 0.3s ease;
  cursor: pointer; /* Add this to show it's clickable */
}

/* Selected/Expanded product styling - Subtle and professional */
.pm-ad-details.expanded {
  margin-bottom: 290px;
  background: #ffffff; /* Clean white background */
  border: 1px solid #d0d0d0; /* Subtle gray border */
  box-shadow: 0 2px 8px rgba(0,0,0,0.08); /* Subtle shadow */
}

/* Add a subtle left accent bar */
.pm-ad-details.expanded::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 3px;
  background: #667eea;
  border-radius: 8px 0 0 8px;
}

/* No image changes when expanded */
.pm-ad-details.expanded .pm-ad-image {
  /* Remove the filter */
}

/* Detailed container with smooth visibility transition */
.pm-ad-details-detailed {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  width: 100%;
  height: 0;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  opacity: 0;
  visibility: hidden;
  transition: height 0.3s ease, opacity 0.5s ease, visibility 0.5s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  z-index: 100;
}

.pm-ad-details.expanded .pm-ad-details-detailed {
  height: 280px; /* Increased height */
  opacity: 1;
  visibility: visible;
}

.pm-ad-details-detailed-content {
  padding: 15px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  opacity: 0;
  transition: opacity 0.3s ease 0.2s; /* Delayed fade-in for content */
}

.pm-ad-details.expanded .pm-ad-details-detailed-content {
  opacity: 1;
}

/* Ensure the products list doesn't clip the detailed view */
.pmp-products-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: visible;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-right: 4px;
  position: relative;
}

/* Price trend badge */
.pm-ad-price-trend {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 10px;
  background: #f0f0f0;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
}

.pm-ad-price-trend.positive {
  background: #ffebee;
  color: #d32f2f;
}

.pm-ad-price-trend.negative {
  background: #e8f5e9;
  color: #388e3c;
}

/* Chart container - adjusted for new height */
.pm-ad-chart-container {
  flex: 1;
  position: relative;
  margin-top: 35px;
  max-height: 220px; /* Limit chart height */
}

.pm-ad-chart-canvas {
  width: 100%;
  height: 100%;
}

.pm-ad-chart-title {
  position: absolute;
  top: -25px;
  left: 0;
  font-size: 11px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.pm-ad-no-history {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
  font-size: 13px;
}

/* Remove expanded style when collapsing */
.pm-ad-details.collapsing {
  transition: all 0.3s ease, margin-bottom 0.3s ease;
}
.pm-ad-price-trend.neutral {
  background: #f5f5f5;
  color: #666;
}
/* Price change badges */
.pm-ad-price-badges {
  display: flex;
  gap: 6px;
  margin-top: 6px;
  flex-wrap: wrap;
}

.pm-ad-price-change-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  color: white;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.pm-ad-price-change-up {
  background: #f44336; /* Red for price increase */
}

.pm-ad-price-change-down {
  background: #4CAF50; /* Green for price decrease */
}

.pm-ad-price-change-badge .arrow {
  font-size: 11px;
  font-weight: bold;
}

.pm-ad-price-change-badge .label {
  font-size: 8px;
  opacity: 0.9;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
/* Summary containers */
.pmp-products-summary {
  width: 100%;
  height: 170px;
  background: #fafafa;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  border: 1px solid #e0e0e0;
}

.pmp-summary-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-width: 140px;
}

.pmp-summary-count {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.pmp-summary-count-value {
  font-size: 36px;
  font-weight: 900;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1;
}

.pmp-summary-count-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
}

.pmp-summary-prices {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.pmp-summary-price-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.pmp-summary-price-value {
  font-size: 16px;
  font-weight: 700;
  color: #2c2c2c;
}

.pmp-summary-price-label {
  font-size: 9px;
  color: #888;
  text-transform: uppercase;
  font-weight: 500;
}

.pmp-price-comparison {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  margin-left: 6px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
}

.pmp-price-comparison.better {
  background: #e8f5e9;
  color: #2e7d32;
}

.pmp-price-comparison.worse {
  background: #ffebee;
  color: #c62828;
}

.pmp-price-comparison .arrow {
  font-size: 12px;
  font-weight: bold;
}

.pmp-price-comparison .diff {
  font-size: 10px;
}

.pmp-summary-charts {
  display: flex;
  gap: 15px;
  align-items: center;
  flex: 1;
  justify-content: flex-end;
}

.pmp-summary-chart-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.pmp-summary-chart {
  width: 130px;
  height: 130px;
}

.pmp-summary-chart-label {
  font-size: 9px;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-weight: 600;
  text-align: center;
}

/* Title filter styles for PM Products */
.pmp-filter-section {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
  position: relative;
}

.pmp-title-filter {
  position: relative;
  width: 280px;
}

.pmp-filter-input {
  width: 100%;
  padding: 6px 12px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 12px;
  color: #333;
  outline: none;
  transition: all 0.3s ease;
}

.pmp-filter-input::placeholder {
  color: #999;
}

.pmp-filter-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
}

/* Filter tags container */
.pmp-filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
  min-height: 28px;
}

.pmp-filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: white;
  border: 1px solid rgba(102, 126, 234, 0.3);
  border-radius: 16px;
  font-size: 11px;
  color: #667eea;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}

.pmp-filter-tag-text {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pmp-filter-tag-remove {
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

.pmp-filter-tag-remove:hover {
  background: #667eea;
  color: white;
}

/* Sync button for filters */
.pmp-filter-sync-btn {
  width: 28px;
  height: 28px;
  margin-left: 6px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #667eea;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.pmp-filter-sync-btn:hover {
  background: #667eea;
  color: white;
  border-color: #667eea;
  transform: scale(1.05);
}

.pmp-filter-sync-btn:active {
  transform: scale(0.95);
}
      
    </style>
  `;
  
  document.head.insertAdjacentHTML('beforeend', styles);
}

async function renderProductsDashboard() {
  const container = document.getElementById('pmProductsWrapperContainer');
  if (!container) {
    console.log('[PM Products] Container not found');
    return;
  }
  
  try {
    // Use the exported loadCompanyPricingData function
    const data = await window.pmUtils.loadCompanyPricingData();
    if (!data || !data.allData) {
      console.error('[PM Products] No data available');
      container.innerHTML = '<div class="pmp-error">No data available</div>';
      return;
    }
    
    // Find market data (source='all' and q='all')
    const marketData = data.allData.find(row => 
      row.source === 'all' && row.q === 'all'
    );
    
    // Find company data
    const companyName = window.myCompany || 'East Perry';
    const myCompanyData = data.allData.find(row => 
      row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
    );
    
    if (!marketData || !myCompanyData) {
      console.error('[PM Products] Market or company data not found');
      container.innerHTML = '<div class="pmp-error">Data not found</div>';
      return;
    }
    
// Clear container and add the wrapper class
container.innerHTML = '';
container.className = 'pm-products-wrapper-container';

let html = `
  <div class="pmp-left-column">
    <!-- Products Overview Card -->
    <div class="pmp-products-overview-card">
      <div class="products-name-header">${companyName}</div>
      <div class="pmp-rank-container">
        <div class="pmp-section-label">COMPANY RANK</div>
        <div class="pmp-big-rank-box">
          <span id="pmpProductsRankValue">—</span>
        </div>
      </div>
      <div class="pmp-market-container">
        <div class="pmp-section-label">MARKET SHARE</div>
        <div class="pmp-big-market-circle">
          <div class="pmp-market-water-fill" id="pmpProductsMarketFill"></div>
          <span class="pmp-market-value-text" id="pmpProductsMarketValue">—</span>
        </div>
      </div>
    </div>
    
<!-- Products Buckets Distribution -->
<div class="pmp-products-buckets-card">
  <button class="pmp-clear-filter" id="pmpClearFilter" title="Clear filter">×</button>
  <h4>Product Price Buckets</h4>
  <div class="pmp-products-buckets-table">
        <div class="pmp-products-buckets-header">
          <span>Bucket</span>
          <span class="pmp-share-header">Share /<br/>Exp Weighted Share</span>
        </div>
        <div id="pmpProductsBucketsBody" class="pmp-products-buckets-body">
          <!-- Buckets will be populated here -->
        </div>
      </div>
    </div>
  </div>
  
  <div class="pmp-right-column">
  
<!-- My Company Products -->
<div class="pmp-products-mycompany-card">
  <div class="pmp-products-list-header">My Products</div>
  
  <!-- NEW: Summary Container -->
  <div class="pmp-products-summary" id="pmpMyCompanySummary">
    <div class="pmp-summary-left">
      <div class="pmp-summary-count">
        <span class="pmp-summary-count-value" id="pmpMyCompanyCount">—</span>
        <span class="pmp-summary-count-label">Products</span>
      </div>
      
<div class="pmp-summary-prices">
  <div class="pmp-summary-price-item">
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
      <span class="pmp-summary-price-value" id="pmpMyCompanyCheapest">$—</span>
      <span class="pmp-price-comparison" id="pmpMyCompanyCheapestComparison" style="display: none;"></span>
    </div>
    <span class="pmp-summary-price-label">Cheapest</span>
  </div>
  <div class="pmp-summary-price-item">
    <div style="display: flex; flex-direction: column; align-items: flex-start; gap: 4px;">
      <span class="pmp-summary-price-value" id="pmpMyCompanyExpensive">$—</span>
      <span class="pmp-price-comparison" id="pmpMyCompanyExpensiveComparison" style="display: none;"></span>
    </div>
    <span class="pmp-summary-price-label">Most Exp.</span>
  </div>
</div>
      
    </div>
    <div class="pmp-summary-charts">
      <div class="pmp-summary-chart-wrapper">
        <div class="pmp-summary-chart" id="pmpMyCompanyBucketChart"></div>
        <span class="pmp-summary-chart-label">Bucket Share</span>
      </div>
      <div class="pmp-summary-chart-wrapper">
        <div class="pmp-summary-chart" id="pmpMyCompanyExpwChart"></div>
        <span class="pmp-summary-chart-label">Exp. Weighted Share</span>
      </div>
    </div>
  </div>
  
  <!-- MOVED: Sort buttons now below summary -->
<div class="pmp-products-header-row">
  <div class="pmp-sort-buttons">
    <button class="pmp-sort-btn active" data-sort="high" data-target="mycompany">$↓</button>
    <button class="pmp-sort-btn" data-sort="low" data-target="mycompany">$↑</button>
    <button class="pmp-filter-btn" data-target="mycompany">%</button>
  </div>
  <div class="pmp-filter-section">
    <div class="pmp-title-filter">
      <input type="text" 
             class="pmp-filter-input" 
             id="pmpMyCompanyFilterInput" 
             placeholder="🔍 Filter by title... (Press Enter)" 
             autocomplete="off">
      <div class="pmp-filter-tags" id="pmpMyCompanyFilterTags"></div>
    </div>
    <button class="pmp-filter-sync-btn" 
            id="pmpMyCompanySyncBtn" 
            title="Sync filters to Competitors">⇄</button>
  </div>
</div>
  
  <div id="pmpMyCompanyProductsList" class="pmp-products-list">
    <div class="pmp-loading">Loading products...</div>
  </div>
</div>

<!-- Competitors Products -->
<div class="pmp-products-competitors-card">
  <div class="pmp-products-list-header">
    <span>Competitor Products</span>
    <div class="pmp-company-filter-container">
      <select class="pmp-company-select" id="pmpCompanyFilter">
        <option value="">All Companies</option>
      </select>
      <button class="pmp-company-clear-btn" id="pmpCompanyClearBtn" title="Clear filter">×</button>
    </div>
  </div>
  
  <!-- NEW: Summary Container -->
  <div class="pmp-products-summary" id="pmpCompetitorsSummary">
    <div class="pmp-summary-left">
      <div class="pmp-summary-count">
        <span class="pmp-summary-count-value" id="pmpCompetitorsCount">—</span>
        <span class="pmp-summary-count-label">Products</span>
      </div>
      <div class="pmp-summary-prices">
        <div class="pmp-summary-price-item">
          <span class="pmp-summary-price-value" id="pmpCompetitorsCheapest">$—</span>
          <span class="pmp-summary-price-label">Cheapest</span>
        </div>
        <div class="pmp-summary-price-item">
          <span class="pmp-summary-price-value" id="pmpCompetitorsExpensive">$—</span>
          <span class="pmp-summary-price-label">Most Exp.</span>
        </div>
      </div>
    </div>
    <div class="pmp-summary-charts">
      <div class="pmp-summary-chart-wrapper">
        <div class="pmp-summary-chart" id="pmpCompetitorsMarketChart"></div>
        <span class="pmp-summary-chart-label">Market Bucket Share</span>
      </div>
      <div class="pmp-summary-chart-wrapper">
        <div class="pmp-summary-chart" id="pmpCompetitorsCompanyChart"></div>
        <span class="pmp-summary-chart-label">Top 10 Companies</span>
      </div>
    </div>
  </div>
  
  <!-- MOVED: Sort buttons now below summary -->
<div class="pmp-products-header-row">
  <div class="pmp-sort-buttons">
    <button class="pmp-sort-btn active" data-sort="high" data-target="competitors">$↓</button>
    <button class="pmp-sort-btn" data-sort="low" data-target="competitors">$↑</button>
    <button class="pmp-filter-btn" data-target="competitors">%</button>
  </div>
  <div class="pmp-filter-section">
    <div class="pmp-title-filter">
      <input type="text" 
             class="pmp-filter-input" 
             id="pmpCompetitorsFilterInput" 
             placeholder="🔍 Filter by title... (Press Enter)" 
             autocomplete="off">
      <div class="pmp-filter-tags" id="pmpCompetitorsFilterTags"></div>
    </div>
    <button class="pmp-filter-sync-btn" 
            id="pmpCompetitorsSyncBtn" 
            title="Sync filters to My Products">⇄</button>
  </div>
</div>
  
  <div id="pmpCompetitorsProductsList" class="pmp-products-list">
    <div class="pmp-loading">Loading competitor products...</div>
  </div>
</div>

  </div>
`;

container.innerHTML = html;
    
    // Populate the dashboard with data
    await populateProductsDashboard({
      myCompany: myCompanyData,
      market: marketData,
      allData: data.allData
    });

// Add sort and filter handlers
document.querySelectorAll('.pmp-sort-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target.dataset.target;
    const sort = e.target.dataset.sort;
    
    // Remove active from all buttons in this group
    document.querySelectorAll(`.pmp-sort-btn[data-target="${target}"]`).forEach(b => b.classList.remove('active'));
    
    // Add active to clicked button
    e.target.classList.add('active');
    
    // Update sort state
    if (target === 'mycompany') {
      currentSortMyCompany = sort;
    } else {
      currentSortCompetitors = sort;
    }
    
    // Re-render products
    filterProducts();
  });
});

document.querySelectorAll('.pmp-filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const target = e.target.dataset.target;
    e.target.classList.toggle('active');
    
    // Update filter state based on which button was clicked
    showDiscountedOnly = e.target.classList.contains('active');
    
    filterProducts();
  });
});

// Initialize title filter
setTimeout(() => {
  initializePMPFilter();
}, 100);
    
    // Load products for both containers
    await loadMyCompanyProducts(companyName);
    await loadCompetitorProducts(companyName);
    
  } catch (error) {
    console.error('[PM Products] Error rendering dashboard:', error);
    container.innerHTML = '<div class="pmp-error">Error loading products data</div>';
  }
}

async function populateProductsDashboard(data) {
  const myCompanyData = data.myCompany;
  const marketData = data.market;
  
  if (!myCompanyData) {
    console.error('[PM Products] No company data available');
    return;
  }
  
  // 1. Update Products Overview Card
  await updateProductsOverviewCard(myCompanyData);
  
  // 2. Update Products Buckets
  updateProductsBuckets(myCompanyData);
}

async function updateProductsOverviewCard(companyData) {
  // Get company rank from company_serp_stats
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
    
    const tableName = `${tablePrefix}company_serp_stats`;
    console.log('[PM Products] Looking for stats table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No stats data found');
          db.close();
          return;
        }
        
        // Find the company's overall rank (q=all, location_requested=all, device=all)
        const companyStats = result.data.find(row => 
          row.source === companyData.source &&
          row.q === 'all' &&
          row.location_requested === 'all' &&
          row.device === 'all'
        );
        
        if (companyStats) {
          // Update rank
          const rankValue = companyStats['7d_rank'];
          const rankElement = document.getElementById('pmpProductsRankValue');
          if (rankElement && rankValue) {
            rankElement.textContent = Math.round(parseFloat(rankValue));
          }
          
          // Update market share
          const marketShare = parseFloat(companyStats['7d_market_share']) * 100;
          const marketElement = document.getElementById('pmpProductsMarketValue');
          const marketFill = document.getElementById('pmpProductsMarketFill');
          
          if (marketElement) {
            marketElement.textContent = `${marketShare.toFixed(1)}%`;
          }
          
          if (marketFill) {
            marketFill.style.height = `${Math.min(100, Math.max(0, marketShare * 2))}%`;
          }
        }
        
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting stats data:', getRequest.error);
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
    };
  } catch (error) {
    console.error('[PM Products] Error fetching company stats:', error);
  }
}

async function updateProductsBuckets(companyData) {
  const bucketsBody = document.getElementById('pmpProductsBucketsBody');
  if (!bucketsBody) return;
  
  // Load comparison data (market or selected company)
  let comparisonData = null;
  try {
    const data = await window.pmUtils.loadCompanyPricingData();
    if (data && data.allData) {
      if (selectedCompanyData) {
        // Use selected company data
        comparisonData = data.allData.find(row => 
          row.source === selectedCompanyData.source && row.q === 'all'
        );
      } else {
        // Use market data
        comparisonData = data.allData.find(row => 
          row.source === 'all' && row.q === 'all'
        );
      }
    }
  } catch (error) {
    console.error('[PM Products] Error loading comparison data:', error);
  }
  
// Define buckets based on company data
  const buckets = [
    {
      name: 'Ultra Premium',
      key: 'ultra_premium',
      tier: 6,
      range: companyData.price_range?.[5],
      count: companyData.ultra_premium_bucket,
      share: companyData.ultra_premium_bucket_share,
      expw_share: companyData.expw_ultra_premium_bucket_share,
      discounted: companyData.disc_ultra_premium_bucket,
      discount_depth: companyData.disc_depth_ultra_premium_bucket,
      comparison_share: comparisonData?.ultra_premium_bucket_share,
      comparison_expw_share: comparisonData?.expw_ultra_premium_bucket_share,
      color: '#9C27B0'
    },
    {
      name: 'Premium',
      key: 'premium',
      tier: 5,
      range: companyData.price_range?.[4],
      count: companyData.premium_bucket,
      share: companyData.premium_bucket_share,
      expw_share: companyData.expw_premium_bucket_share,
      discounted: companyData.disc_premium_bucket,
      discount_depth: companyData.disc_depth_premium_bucket,
      comparison_share: comparisonData?.premium_bucket_share,
      comparison_expw_share: comparisonData?.expw_premium_bucket_share,
      color: '#7B1FA2'
    },
    {
      name: 'Upper Mid',
      key: 'upper_mid',
      tier: 4,
      range: companyData.price_range?.[3],
      count: companyData.upper_mid_bucket,
      share: companyData.upper_mid_bucket_share,
      expw_share: companyData.expw_upper_mid_bucket_share,
      discounted: companyData.disc_upper_mid_bucket,
      discount_depth: companyData.disc_depth_upper_mid_bucket,
      comparison_share: comparisonData?.upper_mid_bucket_share,
      comparison_expw_share: comparisonData?.expw_upper_mid_bucket_share,
      color: '#FFC107'
    },
    {
      name: 'Mid Range',
      key: 'mid',
      tier: 3,
      range: companyData.price_range?.[2],
      count: companyData.mid_bucket,
      share: companyData.mid_bucket_share,
      expw_share: companyData.expw_mid_bucket_share,
      discounted: companyData.disc_mid_bucket,
      discount_depth: companyData.disc_depth_mid_bucket,
      comparison_share: comparisonData?.mid_bucket_share,
      comparison_expw_share: comparisonData?.expw_mid_bucket_share,
      color: '#FF9800'
    },
    {
      name: 'Budget',
      key: 'budget',
      tier: 2,
      range: companyData.price_range?.[1],
      count: companyData.budget_bucket,
      share: companyData.budget_bucket_share,
      expw_share: companyData.expw_budget_bucket_share,
      discounted: companyData.disc_budget_bucket,
      discount_depth: companyData.disc_depth_budget_bucket,
      comparison_share: comparisonData?.budget_bucket_share,
      comparison_expw_share: comparisonData?.expw_budget_bucket_share,
      color: '#66BB6A'
    },
    {
      name: 'Ultra Cheap',
      key: 'ultra_cheap',
      tier: 1,
      range: companyData.price_range?.[0],
      count: companyData.ultra_cheap_bucket,
      share: companyData.ultra_cheap_bucket_share,
      expw_share: companyData.expw_ultra_cheap_bucket_share,
      discounted: companyData.disc_ultra_cheap_bucket,
      discount_depth: companyData.disc_depth_ultra_cheap_bucket,
      comparison_share: comparisonData?.ultra_cheap_bucket_share,
      comparison_expw_share: comparisonData?.expw_ultra_cheap_bucket_share,
      color: '#4CAF50'
    }
  ];
  
// Update header - dynamic based on selection
const comparisonLabel = selectedCompanyData ? selectedCompanyData.source : 'Market';
const headerHTML = `
  <span>Bucket</span>
  <span style="text-align: center;">${comparisonLabel}</span>
  <span style="text-align: center;">My Company Share</span>
  <span style="text-align: center;">Products</span>
`;
  const header = document.querySelector('.pmp-products-buckets-header');
  if (header) header.innerHTML = headerHTML;
  
  // Build buckets HTML with butterfly effect
  let bucketsHTML = '';
  buckets.forEach(bucket => {
    const count = parseInt(bucket.count) || 0;
    const share = parseFloat(bucket.share) || 0;
    const expwShare = parseFloat(bucket.expw_share) || 0;
    const marketShare = parseFloat(bucket.market_share) || 0;
    const marketExpwShare = parseFloat(bucket.market_expw_share) || 0;
    const discounted = parseInt(bucket.discounted) || 0;
    const discountDepth = parseFloat(bucket.discount_depth) || 0;
    
// Get the price range string directly from the data
let range = '—';
if (bucket.range && bucket.range.price_range) {
  const rangeStr = bucket.range.price_range;
  // Just display it as-is, removing only decimal places
  const matches = rangeStr.match(/([\d.]+)\s*-\s*([\d.]+)/);
  if (matches) {
    const min = Math.round(parseFloat(matches[1]));
    const max = Math.round(parseFloat(matches[2]));
    range = `$${min} - $${max}`;
  } else {
    range = rangeStr; // fallback to original string
  }
}
    
    const sharePercent = (share * 100).toFixed(1);
    const expwSharePercent = (expwShare * 100).toFixed(1);
    const marketSharePercent = (marketShare * 100).toFixed(1);
    const marketExpwSharePercent = (marketExpwShare * 100).toFixed(1);
    
const comparisonSharePercent = (parseFloat(bucket.comparison_share) * 100 || 0).toFixed(1);
    const comparisonExpwSharePercent = (parseFloat(bucket.comparison_expw_share) * 100 || 0).toFixed(1);
    
    // Determine if we show single bar (market) or double bars (selected company)
    const showDoubleBars = selectedCompanyData !== null;
    
    bucketsHTML += `
  <div class="pmp-products-bucket-row" data-bucket="${bucket.tier}">
    <!-- Column 1: Bucket Label -->
    <div class="pmp-bucket-label">
      <div class="pmp-bucket-name">
        <span class="pmp-bucket-indicator" style="background: ${bucket.color}"></span>
        <span>${bucket.name}</span>
      </div>
      <div class="pmp-bucket-range">${range}</div>
    </div>
    
    <!-- Column 2: Comparison bars (Market or Selected Company) -->
    <div class="pmp-butterfly-bars">
      ${showDoubleBars ? `
        <!-- Two bars for selected company -->
        <div class="pmp-butterfly-right">
          <div class="pmp-bar-row">
            <div class="pmp-tree-bar-container small">
              <div class="pmp-tree-bar" style="width: ${Math.max(1, comparisonSharePercent)}%; background: #888;"></div>
              <span class="pmp-bar-percent-outside small">${comparisonSharePercent}%</span>
            </div>
          </div>
          <div class="pmp-bar-row">
            <div class="pmp-tree-bar-container small">
              <div class="pmp-tree-bar" style="width: ${Math.max(1, comparisonExpwSharePercent)}%; background: linear-gradient(90deg, #888, #88888080);"></div>
              <span class="pmp-bar-percent-outside small">${comparisonExpwSharePercent}%</span>
            </div>
          </div>
        </div>
      ` : `
        <!-- Single bar for market -->
        <div class="pmp-butterfly-left">
          <div class="pmp-bar-row">
            <div class="pmp-tree-bar-container small">
              <div class="pmp-tree-bar" style="width: ${Math.max(1, comparisonSharePercent)}%; background: #888;"></div>
              <span class="pmp-bar-percent-outside small" style="left: 8px; right: auto;">${comparisonSharePercent}%</span>
            </div>
          </div>
        </div>
      `}
    </div>
    
    <!-- Column 3: My Company Share Bars -->
    <div class="pmp-butterfly-bars">
      <div class="pmp-butterfly-right">
        <div class="pmp-bar-row">
          <div class="pmp-tree-bar-container small">
            <div class="pmp-tree-bar" style="width: ${Math.max(1, sharePercent)}%; background: ${bucket.color};"></div>
            <span class="pmp-bar-percent-outside small">${sharePercent}%</span>
          </div>
        </div>
        <div class="pmp-bar-row">
          <div class="pmp-tree-bar-container small">
            <div class="pmp-tree-bar" style="width: ${Math.max(1, expwSharePercent)}%; background: linear-gradient(90deg, ${bucket.color}, ${bucket.color}80);"></div>
            <span class="pmp-bar-percent-outside small">${expwSharePercent}%</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Column 4: Products Box (on the right) -->
    <div class="pmp-products-data-column">
      <div class="pmp-products-box" style="border-color: ${bucket.color}; background: ${bucket.color}15;">
        <span class="pmp-products-count">${count}</span>
        ${discounted > 0 ? `
          <span class="pmp-products-sep">/</span>
          <span class="pmp-discounted-count">${discounted}</span>
        ` : ''}
      </div>
      ${discountDepth > 0 ? 
        `<span class="pmp-discount-badge">${discountDepth.toFixed(1)}%</span>` : 
        '<span class="pmp-discount-badge-empty">—</span>'}
    </div>
  </div>
`;
  });
  
  bucketsBody.innerHTML = bucketsHTML;

  // Add click handlers for bucket filtering
  const bucketRows = bucketsBody.querySelectorAll('.pmp-products-bucket-row');
  bucketRows.forEach((row) => {
    row.addEventListener('click', () => {
      bucketRows.forEach(r => r.classList.remove('selected'));
      row.classList.add('selected');
      selectedBucket = parseInt(row.dataset.bucket);
      const clearBtn = document.getElementById('pmpClearFilter');
      if (clearBtn) clearBtn.classList.add('active');
      filterProducts();
    });
  });

  // Add clear filter handler
  const clearBtn = document.getElementById('pmpClearFilter');
  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      selectedBucket = null;
      bucketRows.forEach(r => r.classList.remove('selected'));
      clearBtn.classList.remove('active');
      filterProducts();
    });
  }
}

function filterProducts() {
  const myCompanyList = document.getElementById('pmpMyCompanyProductsList');
  const competitorsList = document.getElementById('pmpCompetitorsProductsList');
  
  // Add filtering animation
  if (myCompanyList) myCompanyList.classList.add('filtering');
  if (competitorsList) competitorsList.classList.add('filtering');
  
  setTimeout(() => {
    // Apply filters for both lists independently
    applyPMPFilters('mycompany');
    applyPMPFilters('competitors');
    
    // Remove filtering animation
    setTimeout(() => {
      if (myCompanyList) myCompanyList.classList.remove('filtering');
      if (competitorsList) competitorsList.classList.remove('filtering');
    }, 100);
  }, 300);
}

// Initialize title filter functionality for PM Products (both filters)
function initializePMPFilter() {
  // Initialize My Company filter
  const myCompanyFilterInput = document.getElementById('pmpMyCompanyFilterInput');
  if (myCompanyFilterInput) {
    myCompanyFilterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const filterText = e.target.value.trim();
        if (filterText.length > 0) {
          addPMPFilterTag(filterText, 'mycompany');
          e.target.value = '';
        }
      }
    });
  }
  
  // Initialize Competitors filter
  const competitorsFilterInput = document.getElementById('pmpCompetitorsFilterInput');
  if (competitorsFilterInput) {
    competitorsFilterInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        const filterText = e.target.value.trim();
        if (filterText.length > 0) {
          addPMPFilterTag(filterText, 'competitors');
          e.target.value = '';
        }
      }
    });
  }
  
  // Initialize sync buttons
  const myCompanySyncBtn = document.getElementById('pmpMyCompanySyncBtn');
  if (myCompanySyncBtn) {
    myCompanySyncBtn.addEventListener('click', function() {
      syncPMPFilters('mycompany');
    });
  }
  
  const competitorsSyncBtn = document.getElementById('pmpCompetitorsSyncBtn');
  if (competitorsSyncBtn) {
    competitorsSyncBtn.addEventListener('click', function() {
      syncPMPFilters('competitors');
    });
  }
}

// Add filter tag for PM Products - now accepts type parameter
function addPMPFilterTag(filterText, type) {
  const tagsContainerId = type === 'mycompany' ? 'pmpMyCompanyFilterTags' : 'pmpCompetitorsFilterTags';
  const tagsContainer = document.getElementById(tagsContainerId);
  if (!tagsContainer) return;
  
  // Check if filter already exists
  const existingTags = Array.from(tagsContainer.querySelectorAll('.pmp-filter-tag'));
  if (existingTags.some(tag => tag.dataset.filterText.toLowerCase() === filterText.toLowerCase())) {
    return;
  }
  
  const tag = document.createElement('div');
  tag.className = 'pmp-filter-tag';
  tag.dataset.filterText = filterText;
  tag.innerHTML = `
    <span class="pmp-filter-tag-text" title="${filterText}">${filterText}</span>
    <span class="pmp-filter-tag-remove">✕</span>
  `;
  
  // Add remove handler
  tag.querySelector('.pmp-filter-tag-remove').addEventListener('click', function(e) {
    e.stopPropagation();
    tag.remove();
    applyPMPFilters(type);
  });
  
  tagsContainer.appendChild(tag);
  
  // Apply filters immediately after adding the tag
  applyPMPFilters(type);
}

// Sync filters from one list to another
function syncPMPFilters(fromType) {
  const fromContainerId = fromType === 'mycompany' ? 'pmpMyCompanyFilterTags' : 'pmpCompetitorsFilterTags';
  const toContainerId = fromType === 'mycompany' ? 'pmpCompetitorsFilterTags' : 'pmpMyCompanyFilterTags';
  const toType = fromType === 'mycompany' ? 'competitors' : 'mycompany';
  
  const fromContainer = document.getElementById(fromContainerId);
  const toContainer = document.getElementById(toContainerId);
  
  if (!fromContainer || !toContainer) return;
  
  // Get all filter texts from source
  const fromTags = Array.from(fromContainer.querySelectorAll('.pmp-filter-tag'));
  const filterTexts = fromTags.map(tag => tag.dataset.filterText);
  
  if (filterTexts.length === 0) {
    // If source has no filters, clear destination
    toContainer.innerHTML = '';
    applyPMPFilters(toType);
    return;
  }
  
  // Clear destination container
  toContainer.innerHTML = '';
  
  // Add all filters to destination
  filterTexts.forEach(filterText => {
    const tag = document.createElement('div');
    tag.className = 'pmp-filter-tag';
    tag.dataset.filterText = filterText;
    tag.innerHTML = `
      <span class="pmp-filter-tag-text" title="${filterText}">${filterText}</span>
      <span class="pmp-filter-tag-remove">✕</span>
    `;
    
    // Add remove handler
    tag.querySelector('.pmp-filter-tag-remove').addEventListener('click', function(e) {
      e.stopPropagation();
      tag.remove();
      applyPMPFilters(toType);
    });
    
    toContainer.appendChild(tag);
  });
  
  // Apply filters to destination
  applyPMPFilters(toType);
  
  // Visual feedback
  const syncBtn = document.getElementById(fromType === 'mycompany' ? 'pmpMyCompanySyncBtn' : 'pmpCompetitorsSyncBtn');
  if (syncBtn) {
    syncBtn.style.transform = 'rotate(180deg)';
    setTimeout(() => {
      syncBtn.style.transform = '';
    }, 300);
  }
}

// Apply PM Products title filters - now works independently per type
function applyPMPFilters(type) {
  const tagsContainerId = type === 'mycompany' ? 'pmpMyCompanyFilterTags' : 'pmpCompetitorsFilterTags';
  const listId = type === 'mycompany' ? 'pmpMyCompanyProductsList' : 'pmpCompetitorsProductsList';
  
  const container = document.getElementById(listId);
  
  // Check if container exists
  if (!container) {
    console.log('[PM Products] Container not found for type:', type);
    return;
  }
  
  // Check if data is loaded for this type
  if (!allProductsData[type] || allProductsData[type].length === 0) {
    console.log('[PM Products] No data loaded yet for type:', type);
    return;
  }
  
  const tags = document.querySelectorAll(`#${tagsContainerId} .pmp-filter-tag`);
  const filterTexts = Array.from(tags).map(tag => tag.dataset.filterText);
  
  // Add filtering animation
  container.classList.add('filtering');
  
  setTimeout(() => {
    // Get filtered products (with existing bucket/discount filters)
    let filteredProducts = getFilteredProducts(type);
    
    // Apply title filters
    if (filterTexts.length > 0) {
      filteredProducts = filteredProducts.filter(p => {
        const title = p.title.toLowerCase();
        return filterTexts.every(filterText => 
          title.includes(filterText.toLowerCase())
        );
      });
    }
    
    // Render filtered products
    renderPMProductsFilteredDirect(filteredProducts, container, type);
    
    // Update summary with filtered data
    if (type === 'mycompany') {
      updateMyCompanySummaryWithFiltered(filteredProducts);
    } else {
      updateCompetitorsSummaryWithFiltered(filteredProducts);
    }
    
    // Remove filtering animation
    setTimeout(() => {
      if (container) container.classList.remove('filtering');
    }, 100);
  }, 300);
}

// Helper function to render products directly from array
function renderPMProductsFilteredDirect(products, container, type) {
  if (!container) return;
  
  // Find special products
  let cheapestProduct = null;
  let mostExpensiveProduct = null;

  if (products.length > 0) {
    const sortedByPrice = [...products].sort((a, b) => {
      const priceA = typeof a.price === 'string' ? 
        parseFloat(a.price.replace(/[^0-9.-]/g, '')) : parseFloat(a.price) || 0;
      const priceB = typeof b.price === 'string' ? 
        parseFloat(b.price.replace(/[^0-9.-]/g, '')) : parseFloat(b.price) || 0;
      return priceA - priceB;
    });
    
    cheapestProduct = sortedByPrice[0];
    mostExpensiveProduct = sortedByPrice[sortedByPrice.length - 1];
  }
  
  if (products.length === 0) {
    container.innerHTML = `<div class="pmp-no-products">No products match the filters</div>`;
  } else {
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
      const discountPercent = (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue)) ? 
        Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
      
      // Get bucket info
      const bucketNum = product.price_bucket || 1;
      const bucketNames = ['', 'CHEAP', 'BUDGET', 'MID', 'UPPER', 'PREMIUM', 'ULTRA'];
      const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
      
      // Check for special badges
      let specialBadge = '';
      
      if (product === cheapestProduct) {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-cheapest">CHEAPEST</div>';
      } else if (product === mostExpensiveProduct) {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-expensive">MOST-EXP</div>';
      }
      
      const hasDiscount = oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue) && oldPriceValue > priceValue;
      if (hasDiscount && specialBadge === '') {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-promo">PROMO</div>';
      }
      
      // Create unique ID for each product element
      const productId = `product-${type}-${products.indexOf(product)}`;
      
      html += `
        <div class="pm-ad-details" id="${productId}">
          <div class="pm-ad-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
            ${discountPercent > 0 ? `<div class="pm-ad-discount-badge">-${discountPercent}%</div>` : ''}
          </div>
          <div class="pm-ad-info">
            <div class="pm-ad-title">${title}</div>
            <div class="pm-ad-price-container">
              <span class="pm-ad-current-price ${oldPrice ? 'pm-ad-price-discounted' : ''}">${price}</span>
              ${oldPrice ? `<span class="pm-ad-old-price">${oldPrice}</span>` : ''}
              ${type === 'competitors' && product.source ? `<span class="pm-ad-source">${product.source}</span>` : ''}
            </div>
            ${generatePriceChangeBadges(product)}
          </div>
          ${specialBadge}
          <div class="pm-ad-bucket-box pm-ad-bucket-${bucketClasses[bucketNum]}">
            ${bucketNames[bucketNum]}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add click handlers to each product after rendering
    products.forEach((product, index) => {
      const productId = `product-${type}-${index}`;
      const productElement = document.getElementById(productId);
      if (productElement) {
        productElement.addEventListener('click', (e) => handleProductClick(e, product, productElement));
      }
    });
  }
}

// Helper function to get filtered products
function getFilteredProducts(type) {
  if (!allProductsData[type]) return [];
  
  let products = [...allProductsData[type]];
  
  // Filter by selected company (only for competitors)
  if (type === 'competitors' && selectedCompany) {
    products = products.filter(p => p.source === selectedCompany);
  }
  
  // Filter by selected bucket if any
  if (selectedBucket !== null) {
    products = products.filter(p => {
      const bucketValue = parseInt(p.price_bucket) || 0;
      return bucketValue === selectedBucket;
    });
  }
  
  // Filter by discount if needed  
  if (showDiscountedOnly) {
    products = products.filter(p => {
      if (!p.old_price || p.old_price === '') return false;
      
      const oldPrice = parseFloat(String(p.old_price).replace(/[^0-9.-]/g, ''));
      const currentPrice = parseFloat(String(p.price).replace(/[^0-9.-]/g, ''));
      
      return !isNaN(oldPrice) && !isNaN(currentPrice) && oldPrice > currentPrice;
    });
  }
  
  // Sort products
  const currentSort = type === 'myCompany' ? currentSortMyCompany : currentSortCompetitors;
  products.sort((a, b) => {
    const priceA = typeof a.price === 'string' ? 
      parseFloat(a.price.replace(/[^0-9.-]/g, '')) : parseFloat(a.price) || 0;
    const priceB = typeof b.price === 'string' ? 
      parseFloat(b.price.replace(/[^0-9.-]/g, '')) : parseFloat(b.price) || 0;
    return currentSort === 'high' ? priceB - priceA : priceA - priceB;
  });
  
  return products;
}

// Update My Company summary with filtered data
function updateMyCompanySummaryWithFiltered(products) {
  if (!products || products.length === 0) {
    document.getElementById('pmpMyCompanyCount').textContent = '0';
    document.getElementById('pmpMyCompanyCheapest').textContent = '$—';
    document.getElementById('pmpMyCompanyExpensive').textContent = '$—';
    // Hide comparison indicators
    document.getElementById('pmpMyCompanyCheapestComparison').style.display = 'none';
    document.getElementById('pmpMyCompanyExpensiveComparison').style.display = 'none';
    return;
  }
  
  // Update count
  document.getElementById('pmpMyCompanyCount').textContent = products.length;
  
  // Find cheapest and most expensive
  const prices = products.map(p => {
    const priceValue = typeof p.price === 'string' ? 
      parseFloat(p.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(p.price);
    return isNaN(priceValue) ? 0 : priceValue;
  }).filter(p => p > 0);
  
  if (prices.length > 0) {
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    document.getElementById('pmpMyCompanyCheapest').textContent = `$${cheapest.toFixed(2)}`;
    document.getElementById('pmpMyCompanyExpensive').textContent = `$${expensive.toFixed(2)}`;
    
    // Update comparison indicators
    updatePriceComparisons(cheapest, expensive);
  } else {
    document.getElementById('pmpMyCompanyCheapest').textContent = '$—';
    document.getElementById('pmpMyCompanyExpensive').textContent = '$—';
    // Hide comparison indicators
    document.getElementById('pmpMyCompanyCheapestComparison').style.display = 'none';
    document.getElementById('pmpMyCompanyExpensiveComparison').style.display = 'none';
  }
}

// Function to update price comparison indicators
function updatePriceComparisons(myCheapest, myExpensive) {
  const compCheapest = competitorsPriceData.cheapest;
  const compExpensive = competitorsPriceData.mostExpensive;
  
  const cheapestCompEl = document.getElementById('pmpMyCompanyCheapestComparison');
  const expensiveCompEl = document.getElementById('pmpMyCompanyExpensiveComparison');
  
  // Compare cheapest
  if (compCheapest !== null && !isNaN(compCheapest)) {
    const diff = myCheapest - compCheapest;
    const percentDiff = ((diff / compCheapest) * 100).toFixed(1);
    
    if (Math.abs(diff) > 0.01) {
      const isBetter = diff < 0; // Lower is better
      const arrow = isBetter ? '↓' : '↑';
      const className = isBetter ? 'better' : 'worse';
      
      cheapestCompEl.className = `pmp-price-comparison ${className}`;
      cheapestCompEl.innerHTML = `
        <span class="arrow">${arrow}</span>
        <span class="diff">$${Math.abs(diff).toFixed(2)} (${Math.abs(percentDiff)}%)</span>
      `;
      cheapestCompEl.style.display = 'inline-flex';
    } else {
      cheapestCompEl.style.display = 'none';
    }
  } else {
    cheapestCompEl.style.display = 'none';
  }
  
  // Compare most expensive
  if (compExpensive !== null && !isNaN(compExpensive)) {
    const diff = myExpensive - compExpensive;
    const percentDiff = ((diff / compExpensive) * 100).toFixed(1);
    
    if (Math.abs(diff) > 0.01) {
      const isBetter = diff < 0; // Lower is better
      const arrow = isBetter ? '↓' : '↑';
      const className = isBetter ? 'better' : 'worse';
      
      expensiveCompEl.className = `pmp-price-comparison ${className}`;
      expensiveCompEl.innerHTML = `
        <span class="arrow">${arrow}</span>
        <span class="diff">$${Math.abs(diff).toFixed(2)} (${Math.abs(percentDiff)}%)</span>
      `;
      expensiveCompEl.style.display = 'inline-flex';
    } else {
      expensiveCompEl.style.display = 'none';
    }
  } else {
    expensiveCompEl.style.display = 'none';
  }
}

// Update Competitors summary with filtered data
function updateCompetitorsSummaryWithFiltered(products) {
  if (!products || products.length === 0) {
    document.getElementById('pmpCompetitorsCount').textContent = '0';
    document.getElementById('pmpCompetitorsCheapest').textContent = '$—';
    document.getElementById('pmpCompetitorsExpensive').textContent = '$—';
    // Reset stored prices
    competitorsPriceData.cheapest = null;
    competitorsPriceData.mostExpensive = null;
    return;
  }
  
  // Update count
  document.getElementById('pmpCompetitorsCount').textContent = products.length;
  
  // Find cheapest and most expensive
  const prices = products.map(p => {
    const priceValue = typeof p.price === 'string' ? 
      parseFloat(p.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(p.price);
    return isNaN(priceValue) ? 0 : priceValue;
  }).filter(p => p > 0);
  
  if (prices.length > 0) {
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    document.getElementById('pmpCompetitorsCheapest').textContent = `$${cheapest.toFixed(2)}`;
    document.getElementById('pmpCompetitorsExpensive').textContent = `$${expensive.toFixed(2)}`;
    
    // Store prices globally for comparison
    competitorsPriceData.cheapest = cheapest;
    competitorsPriceData.mostExpensive = expensive;
    
    // Trigger update of myCompany comparisons
    const myCompanyProducts = getFilteredProducts('myCompany');
    if (myCompanyProducts.length > 0) {
      const myPrices = myCompanyProducts.map(p => {
        const priceValue = typeof p.price === 'string' ? 
          parseFloat(p.price.replace(/[^0-9.-]/g, '')) : 
          parseFloat(p.price);
        return isNaN(priceValue) ? 0 : priceValue;
      }).filter(p => p > 0);
      
      if (myPrices.length > 0) {
        const myCheapest = Math.min(...myPrices);
        const myExpensive = Math.max(...myPrices);
        updatePriceComparisons(myCheapest, myExpensive);
      }
    }
  } else {
    document.getElementById('pmpCompetitorsCheapest').textContent = '$—';
    document.getElementById('pmpCompetitorsExpensive').textContent = '$—';
    // Reset stored prices
    competitorsPriceData.cheapest = null;
    competitorsPriceData.mostExpensive = null;
  }
  
  // Re-render company distribution chart with filtered data
  renderCompetitorsCompanyChart(products);
}

// Function to populate company filter dropdown
function populateCompanyFilter() {
  const select = document.getElementById('pmpCompanyFilter');
  if (!select || !allProductsData.competitors) return;
  
  // Get unique companies
  const companies = [...new Set(allProductsData.competitors.map(p => p.source))].filter(Boolean).sort();
  
  // Clear existing options (except "All Companies")
  select.innerHTML = '<option value="">All Companies</option>';
  
  // Add company options
  companies.forEach(company => {
    const option = document.createElement('option');
    option.value = company;
    option.textContent = company;
    select.appendChild(option);
  });
  
// Add event listener
  select.addEventListener('change', async (e) => {
    const selectedValue = e.target.value;
    selectedCompany = selectedValue || null;
    
    // Load data first (needed for both selected company and myCompany)
    const data = await window.pmUtils.loadCompanyPricingData();
    
    // Load selected company data if a company is selected
    if (selectedCompany && data && data.allData) {
      selectedCompanyData = data.allData.find(row => 
        row.source === selectedCompany && row.q === 'all'
      );
    } else {
      selectedCompanyData = null;
    }
    
    // Show/hide clear button
    const clearBtn = document.getElementById('pmpCompanyClearBtn');
    if (clearBtn) {
      if (selectedCompany) {
        clearBtn.classList.add('active');
      } else {
        clearBtn.classList.remove('active');
      }
    }
    
    // Rebuild buckets card with new comparison data
    if (data && data.allData) {
      const companyName = window.myCompany || 'East Perry';
      const myCompanyData = data.allData.find(row => 
        row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
      );
      if (myCompanyData) {
        await updateProductsBuckets(myCompanyData);
      }
    }
    
    // Re-filter products
    filterProducts();
  });
  
// Add clear button listener
  const clearBtn = document.getElementById('pmpCompanyClearBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      selectedCompany = null;
      selectedCompanyData = null;
      select.value = '';
      clearBtn.classList.remove('active');
      
      // Rebuild buckets card back to market mode
      const data = await window.pmUtils.loadCompanyPricingData();
      const companyName = window.myCompany || 'East Perry';
      const myCompanyData = data.allData.find(row => 
        row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
      );
      if (myCompanyData) {
        await updateProductsBuckets(myCompanyData);
      }
      
      filterProducts();
    });
  }
}

// Update just the company chart for competitors
async function renderCompetitorsCompanyChart(products) {
  const top10Companies = await getTop10Companies();
  
  // Count products per company
  const companyProductCounts = {};
  products.forEach(product => {
    const company = product.source;
    if (company) {
      companyProductCounts[company] = (companyProductCounts[company] || 0) + 1;
    }
  });
  
  // Separate top 10 and others
  const top10Data = [];
  const top10Colors = [
    '#667eea', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#fd79a8', '#fdcb6e', '#55efc4', '#a29bfe'
  ];
  
  let otherCount = 0;
  
  Object.keys(companyProductCounts).forEach(company => {
    if (top10Companies.includes(company)) {
      const index = top10Companies.indexOf(company);
      top10Data.push({
        company: company,
        count: companyProductCounts[company],
        color: top10Colors[index] || '#95a5a6'
      });
    } else {
      otherCount += companyProductCounts[company];
    }
  });
  
  // Sort top 10 by count
  top10Data.sort((a, b) => b.count - a.count);
  
  // Add "Others" if there are products from companies outside top 10
  if (otherCount > 0) {
    top10Data.push({
      company: 'Others',
      count: otherCount,
      color: '#95a5a6'
    });
  }
  
  const companyChartOptions = {
    series: top10Data.map(d => d.count),
    chart: {
      type: 'donut',
      height: 130,
      width: 130
    },
    labels: top10Data.map(d => d.company),
    colors: top10Data.map(d => d.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: false
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' products';
        }
      }
    }
  };
  
  // Destroy existing chart if any
  if (window.pmpCompetitorsCompanyChartInstance) {
    window.pmpCompetitorsCompanyChartInstance.destroy();
  }
  
  const companyChartEl = document.getElementById('pmpCompetitorsCompanyChart');
  if (companyChartEl) {
    window.pmpCompetitorsCompanyChartInstance = new ApexCharts(companyChartEl, companyChartOptions);
    window.pmpCompetitorsCompanyChartInstance.render();
  }
}

function renderPMProductsFiltered(type, container) {
  if (!container || !allProductsData[type]) return;
  
  // Use the helper function to get properly filtered products
  let products = getFilteredProducts(type);
  
  // Find special products (after filtering)
  let cheapestProduct = null;
  let mostExpensiveProduct = null;

  if (products.length > 0) {
    // Sort by price to find cheapest and most expensive
    const sortedByPrice = [...products].sort((a, b) => {
      const priceA = typeof a.price === 'string' ? 
        parseFloat(a.price.replace(/[^0-9.-]/g, '')) : parseFloat(a.price) || 0;
      const priceB = typeof b.price === 'string' ? 
        parseFloat(b.price.replace(/[^0-9.-]/g, '')) : parseFloat(b.price) || 0;
      return priceA - priceB;
    });
    
    cheapestProduct = sortedByPrice[0];
    mostExpensiveProduct = sortedByPrice[sortedByPrice.length - 1];
  }
  
  if (products.length === 0) {
    container.innerHTML = `<div class="pmp-no-products">No products ${showDiscountedOnly ? 'with discounts ' : ''}in this bucket</div>`;
  } else {
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
      const discountPercent = (oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue)) ? 
        Math.round((1 - priceValue / oldPriceValue) * 100) : 0;
      
      // Get bucket info
      const bucketNum = product.price_bucket || 1;
      const bucketNames = ['', 'CHEAP', 'BUDGET', 'MID', 'UPPER', 'PREMIUM', 'ULTRA'];
      const bucketClasses = ['', 'ultra-cheap', 'budget', 'mid', 'upper-mid', 'premium', 'ultra-premium'];
      
      // Check for special badges
      let specialBadge = '';
      
      if (product === cheapestProduct) {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-cheapest">CHEAPEST</div>';
      } else if (product === mostExpensiveProduct) {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-expensive">MOST-EXP</div>';
      }
      
      const hasDiscount = oldPriceValue && priceValue && !isNaN(priceValue) && !isNaN(oldPriceValue) && oldPriceValue > priceValue;
      if (hasDiscount && specialBadge === '') {
        specialBadge = '<div class="pm-ad-special-box pm-ad-special-promo">PROMO</div>';
      }
      
      // Create unique ID for each product element
      const productId = `product-${type}-${products.indexOf(product)}`;
      
      html += `
        <div class="pm-ad-details" id="${productId}">
          <div class="pm-ad-image" style="${thumbnail ? `background-image: url('${thumbnail}');` : ''}">
            ${discountPercent > 0 ? `<div class="pm-ad-discount-badge">-${discountPercent}%</div>` : ''}
          </div>
          <div class="pm-ad-info">
            <div class="pm-ad-title">${title}</div>
<div class="pm-ad-price-container">
  <span class="pm-ad-current-price ${oldPrice ? 'pm-ad-price-discounted' : ''}">${price}</span>
  ${oldPrice ? `<span class="pm-ad-old-price">${oldPrice}</span>` : ''}
  ${type === 'competitors' && product.source ? `<span class="pm-ad-source">${product.source}</span>` : ''}
</div>
${generatePriceChangeBadges(product)}
          </div>
          ${specialBadge}
          <div class="pm-ad-bucket-box pm-ad-bucket-${bucketClasses[bucketNum]}">
            ${bucketNames[bucketNum]}
          </div>
        </div>
      `;
    });

    container.innerHTML = html;

    // Add click handlers to each product after rendering
    products.forEach((product, index) => {
      const productId = `product-${type}-${index}`;
      const productElement = document.getElementById(productId);
      if (productElement) {
        productElement.addEventListener('click', (e) => handleProductClick(e, product, productElement));
      }
    });
  }
}

// Function to update My Company summary
function updateMyCompanySummary(products, companyData) {
  if (!products || products.length === 0) {
    document.getElementById('pmpMyCompanyCount').textContent = '0';
    document.getElementById('pmpMyCompanyCheapest').textContent = '$—';
    document.getElementById('pmpMyCompanyExpensive').textContent = '$—';
    return;
  }
  
  // Update count
  document.getElementById('pmpMyCompanyCount').textContent = products.length;
  
  // Find cheapest and most expensive
  const prices = products.map(p => {
    const priceValue = typeof p.price === 'string' ? 
      parseFloat(p.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(p.price);
    return isNaN(priceValue) ? 0 : priceValue;
  }).filter(p => p > 0);
  
  if (prices.length > 0) {
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    document.getElementById('pmpMyCompanyCheapest').textContent = `$${cheapest.toFixed(2)}`;
    document.getElementById('pmpMyCompanyExpensive').textContent = `$${expensive.toFixed(2)}`;
  } else {
    document.getElementById('pmpMyCompanyCheapest').textContent = '$—';
    document.getElementById('pmpMyCompanyExpensive').textContent = '$—';
  }
  
  // Render donut charts
  renderMyCompanyBucketCharts(companyData);
}

// Function to update Competitors summary
function updateCompetitorsSummary(products) {
  if (!products || products.length === 0) {
    document.getElementById('pmpCompetitorsCount').textContent = '0';
    document.getElementById('pmpCompetitorsCheapest').textContent = '$—';
    document.getElementById('pmpCompetitorsExpensive').textContent = '$—';
    return;
  }
  
  // Update count
  document.getElementById('pmpCompetitorsCount').textContent = products.length;
  
  // Find cheapest and most expensive
  const prices = products.map(p => {
    const priceValue = typeof p.price === 'string' ? 
      parseFloat(p.price.replace(/[^0-9.-]/g, '')) : 
      parseFloat(p.price);
    return isNaN(priceValue) ? 0 : priceValue;
  }).filter(p => p > 0);
  
  if (prices.length > 0) {
    const cheapest = Math.min(...prices);
    const expensive = Math.max(...prices);
    document.getElementById('pmpCompetitorsCheapest').textContent = `$${cheapest.toFixed(2)}`;
    document.getElementById('pmpCompetitorsExpensive').textContent = `$${expensive.toFixed(2)}`;
  } else {
    document.getElementById('pmpCompetitorsCheapest').textContent = '$—';
    document.getElementById('pmpCompetitorsExpensive').textContent = '$—';
  }
  
  // Render donut charts
  renderCompetitorsCharts(products);
}

// Function to render My Company bucket share charts
async function renderMyCompanyBucketCharts(companyData) {
  // Get bucket data from company pricing data
  const buckets = [
    { name: 'Ultra Premium', share: parseFloat(companyData.ultra_premium_bucket_share) || 0, expw: parseFloat(companyData.expw_ultra_premium_bucket_share) || 0, color: '#9C27B0' },
    { name: 'Premium', share: parseFloat(companyData.premium_bucket_share) || 0, expw: parseFloat(companyData.expw_premium_bucket_share) || 0, color: '#7B1FA2' },
    { name: 'Upper Mid', share: parseFloat(companyData.upper_mid_bucket_share) || 0, expw: parseFloat(companyData.expw_upper_mid_bucket_share) || 0, color: '#FFC107' },
    { name: 'Mid Range', share: parseFloat(companyData.mid_bucket_share) || 0, expw: parseFloat(companyData.expw_mid_bucket_share) || 0, color: '#FF9800' },
    { name: 'Budget', share: parseFloat(companyData.budget_bucket_share) || 0, expw: parseFloat(companyData.expw_budget_bucket_share) || 0, color: '#66BB6A' },
    { name: 'Ultra Cheap', share: parseFloat(companyData.ultra_cheap_bucket_share) || 0, expw: parseFloat(companyData.expw_ultra_cheap_bucket_share) || 0, color: '#4CAF50' }
  ];
  
  // Filter out buckets with 0 share
  const activeBuckets = buckets.filter(b => b.share > 0);
  
  // First chart - Bucket Share
  const bucketShareOptions = {
    series: activeBuckets.map(b => (b.share * 100)),
    chart: {
      type: 'donut',
      height: 130,
      width: 130
    },
    labels: activeBuckets.map(b => b.name),
    colors: activeBuckets.map(b => b.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: false
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(1) + '%';
        }
      }
    }
  };
  
  // Destroy existing chart if any
  if (window.pmpMyCompanyBucketChartInstance) {
    window.pmpMyCompanyBucketChartInstance.destroy();
  }
  
  const bucketChartEl = document.getElementById('pmpMyCompanyBucketChart');
  if (bucketChartEl) {
    window.pmpMyCompanyBucketChartInstance = new ApexCharts(bucketChartEl, bucketShareOptions);
    window.pmpMyCompanyBucketChartInstance.render();
  }
  
  // Second chart - Exposure Weighted Share
  const activeExpwBuckets = buckets.filter(b => b.expw > 0);
  
  const expwShareOptions = {
    series: activeExpwBuckets.map(b => (b.expw * 100)),
    chart: {
      type: 'donut',
      height: 130,
      width: 130
    },
    labels: activeExpwBuckets.map(b => b.name),
    colors: activeExpwBuckets.map(b => b.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: false
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val.toFixed(1) + '%';
        }
      }
    }
  };
  
  // Destroy existing chart if any
  if (window.pmpMyCompanyExpwChartInstance) {
    window.pmpMyCompanyExpwChartInstance.destroy();
  }
  
  const expwChartEl = document.getElementById('pmpMyCompanyExpwChart');
  if (expwChartEl) {
    window.pmpMyCompanyExpwChartInstance = new ApexCharts(expwChartEl, expwShareOptions);
    window.pmpMyCompanyExpwChartInstance.render();
  }
}

// Function to get top 10 companies from stats (copied logic from companies.js)
async function getTop10Companies() {
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
    
    const tableName = `${tablePrefix}company_serp_stats`;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      
      request.onsuccess = function(event) {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('projectData')) {
          console.error('[PM Products] projectData object store not found');
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
            console.warn('[PM Products] No stats data found');
            db.close();
            resolve([]);
            return;
          }
          
          // Find top 10 companies (q=all, location_requested=all, device=all, source != all)
          const companyRecords = result.data
            .filter(row => 
              row.q === 'all' && 
              row.location_requested === 'all' && 
              row.device === 'all' && 
              row.source !== 'all'
            )
            .sort((a, b) => {
              const rankA = parseFloat(a['7d_rank']) || 999;
              const rankB = parseFloat(b['7d_rank']) || 999;
              return rankA - rankB;
            })
            .slice(0, 10);
          
          const top10 = companyRecords.map(r => r.source);
          db.close();
          resolve(top10);
        };
        
        getRequest.onerror = function() {
          console.error('[PM Products] Error getting stats data:', getRequest.error);
          db.close();
          resolve([]);
        };
      };
      
      request.onerror = function() {
        console.error('[PM Products] Failed to open database:', request.error);
        resolve([]);
      };
    });
  } catch (error) {
    console.error('[PM Products] Error getting top 10 companies:', error);
    return [];
  }
}

// Function to render Competitors charts
async function renderCompetitorsCharts(products) {
  // First chart - Market Bucket Share
  const data = await window.pmUtils.loadCompanyPricingData();
  if (data && data.allData) {
    const marketData = data.allData.find(row => 
      row.source === 'all' && row.q === 'all'
    );
    
    if (marketData) {
      const buckets = [
        { name: 'Ultra Premium', share: parseFloat(marketData.ultra_premium_bucket_share) || 0, color: '#9C27B0' },
        { name: 'Premium', share: parseFloat(marketData.premium_bucket_share) || 0, color: '#7B1FA2' },
        { name: 'Upper Mid', share: parseFloat(marketData.upper_mid_bucket_share) || 0, color: '#FFC107' },
        { name: 'Mid Range', share: parseFloat(marketData.mid_bucket_share) || 0, color: '#FF9800' },
        { name: 'Budget', share: parseFloat(marketData.budget_bucket_share) || 0, color: '#66BB6A' },
        { name: 'Ultra Cheap', share: parseFloat(marketData.ultra_cheap_bucket_share) || 0, color: '#4CAF50' }
      ];
      
      const activeBuckets = buckets.filter(b => b.share > 0);
      
      const marketBucketOptions = {
        series: activeBuckets.map(b => (b.share * 100)),
        chart: {
          type: 'donut',
          height: 130,
          width: 130
        },
        labels: activeBuckets.map(b => b.name),
        colors: activeBuckets.map(b => b.color),
        legend: {
          show: false
        },
        dataLabels: {
          enabled: false
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%',
              labels: {
                show: false
              }
            }
          }
        },
        stroke: {
          width: 2,
          colors: ['#fff']
        },
        tooltip: {
          y: {
            formatter: function(val) {
              return val.toFixed(1) + '%';
            }
          }
        }
      };
      
      // Destroy existing chart if any
      if (window.pmpCompetitorsMarketChartInstance) {
        window.pmpCompetitorsMarketChartInstance.destroy();
      }
      
      const marketChartEl = document.getElementById('pmpCompetitorsMarketChart');
      if (marketChartEl) {
        window.pmpCompetitorsMarketChartInstance = new ApexCharts(marketChartEl, marketBucketOptions);
        window.pmpCompetitorsMarketChartInstance.render();
      }
    }
  }
  
  // Second chart - Top 10 Companies by product count
  const top10Companies = await getTop10Companies();
  
  // Count products per company
  const companyProductCounts = {};
  products.forEach(product => {
    const company = product.source;
    if (company) {
      companyProductCounts[company] = (companyProductCounts[company] || 0) + 1;
    }
  });
  
  // Separate top 10 and others
  const top10Data = [];
  const top10Colors = [
    '#667eea', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24',
    '#6c5ce7', '#fd79a8', '#fdcb6e', '#55efc4', '#a29bfe'
  ];
  
  let otherCount = 0;
  
  Object.keys(companyProductCounts).forEach(company => {
    if (top10Companies.includes(company)) {
      const index = top10Companies.indexOf(company);
      top10Data.push({
        company: company,
        count: companyProductCounts[company],
        color: top10Colors[index] || '#95a5a6'
      });
    } else {
      otherCount += companyProductCounts[company];
    }
  });
  
  // Sort top 10 by count
  top10Data.sort((a, b) => b.count - a.count);
  
  // Add "Others" if there are products from companies outside top 10
  if (otherCount > 0) {
    top10Data.push({
      company: 'Others',
      count: otherCount,
      color: '#95a5a6'
    });
  }
  
  const companyChartOptions = {
    series: top10Data.map(d => d.count),
    chart: {
      type: 'donut',
      height: 130,
      width: 130
    },
    labels: top10Data.map(d => d.company),
    colors: top10Data.map(d => d.color),
    legend: {
      show: false
    },
    dataLabels: {
      enabled: false
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: false
          }
        }
      }
    },
    stroke: {
      width: 2,
      colors: ['#fff']
    },
    tooltip: {
      y: {
        formatter: function(val) {
          return val + ' products';
        }
      }
    }
  };
  
  // Destroy existing chart if any
  if (window.pmpCompetitorsCompanyChartInstance) {
    window.pmpCompetitorsCompanyChartInstance.destroy();
  }
  
  const companyChartEl = document.getElementById('pmpCompetitorsCompanyChart');
  if (companyChartEl) {
    window.pmpCompetitorsCompanyChartInstance = new ApexCharts(companyChartEl, companyChartOptions);
    window.pmpCompetitorsCompanyChartInstance.render();
  }
}

function generatePriceChangeBadges(product) {
  const priceDirection = parseFloat(product.price_direction);
  const priceTrend = parseFloat(product.price_trend);
  
  let badges = '';
  
  // Only show badges if values exist and are not 0
  if (!isNaN(priceDirection) && priceDirection !== 0) {
    const isUp = priceDirection > 0;
    const arrow = isUp ? '▲' : '▼';
    const badgeClass = isUp ? 'pm-ad-price-change-up' : 'pm-ad-price-change-down';
    
    badges += `
      <div class="pm-ad-price-change-badge ${badgeClass}">
        <span class="arrow">${arrow}</span>
        <span class="label">24h</span>
        <span>${Math.abs(priceDirection).toFixed(1)}%</span>
      </div>
    `;
  }
  
  if (!isNaN(priceTrend) && priceTrend !== 0) {
    const isUp = priceTrend > 0;
    const arrow = isUp ? '▲' : '▼';
    const badgeClass = isUp ? 'pm-ad-price-change-up' : 'pm-ad-price-change-down';
    
    badges += `
      <div class="pm-ad-price-change-badge ${badgeClass}">
        <span class="arrow">${arrow}</span>
        <span class="label">30d</span>
        <span>${Math.abs(priceTrend).toFixed(1)}%</span>
      </div>
    `;
  }
  
  return badges ? `<div class="pm-ad-price-badges">${badges}</div>` : '';
}

function handleProductClick(event, product, productElement) {
  event.stopPropagation();
  
  console.log('[PM Products] Product clicked:', product.title);
  
  // Check if already expanded
  const isExpanded = productElement.classList.contains('expanded');
  
  // Get the parent container to determine which section we're in
  const parentList = productElement.closest('.pmp-products-list');
  const isMyCompany = parentList && parentList.id === 'pmpMyCompanyProductsList';
  const isCompetitors = parentList && parentList.id === 'pmpCompetitorsProductsList';
  
  // Only close other expanded products in the SAME section
  if (isMyCompany || isCompetitors) {
    const sectionSelector = isMyCompany ? '#pmpMyCompanyProductsList' : '#pmpCompetitorsProductsList';
    const sameSection = document.querySelector(sectionSelector);
    
    if (sameSection) {
      sameSection.querySelectorAll('.pm-ad-details.expanded').forEach(el => {
        if (el !== productElement) {
          collapseProductDetail(el);
        }
      });
    }
  }
  
  if (isExpanded) {
    // Collapse with animation
    collapseProductDetail(productElement);
  } else {
    // Expand and load detailed data
    expandProductDetail(productElement, product);
  }
}

// Helper function to collapse product detail
function collapseProductDetail(productElement) {
  productElement.classList.add('collapsing');
  productElement.classList.remove('expanded');
  
  const detailedEl = productElement.querySelector('.pm-ad-details-detailed');
  if (detailedEl) {
    // Fade out the content first
    const content = detailedEl.querySelector('.pm-ad-details-detailed-content');
    if (content) {
      content.style.opacity = '0';
    }
    
    // Then collapse and remove
    setTimeout(() => {
      detailedEl.style.opacity = '0';
      setTimeout(() => {
        detailedEl.remove();
        productElement.classList.remove('collapsing');
      }, 500); // Match the CSS transition time
    }, 200);
  }
}

// Helper function to expand product detail
function expandProductDetail(productElement, product) {
  productElement.classList.add('expanded');
  
  // Load the product details
  loadProductDetails(product, productElement);
}

async function loadProductDetails(product, productElement) {
  console.log('[PM Products] Loading details for:', product.title);
  
  // Check if detailed container already exists
  let detailedContainer = productElement.querySelector('.pm-ad-details-detailed');
  if (!detailedContainer) {
    detailedContainer = document.createElement('div');
    detailedContainer.className = 'pm-ad-details-detailed';
    productElement.appendChild(detailedContainer);
    console.log('[PM Products] Created detailed container');
    
    // Force reflow to ensure animation works
    detailedContainer.offsetHeight;
  }
  
  // Start with loading message
  detailedContainer.innerHTML = '<div class="pm-ad-details-detailed-content" style="opacity: 0;"><div class="pm-ad-no-history">Loading price history...</div></div>';
  
  // Fade in the loading message
  setTimeout(() => {
    const content = detailedContainer.querySelector('.pm-ad-details-detailed-content');
    if (content) {
      content.style.opacity = '1';
    }
  }, 100);
  
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
    console.log('[PM Products] Looking for table:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">Error loading data</div>');
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No data found in table');
          updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">No data found</div>');
          db.close();
          return;
        }
        
        // Find the exact product record
        const productRecord = result.data.find(row => 
          row.title === product.title && 
          row.source === product.source
        );
        
        console.log('[PM Products] Found product record:', productRecord);
        
        if (productRecord && productRecord.historical_data && productRecord.historical_data.length > 0) {
          console.log('[PM Products] Rendering price history with', productRecord.historical_data.length, 'data points');
          renderPriceHistory(productRecord, detailedContainer);
        } else {
          console.warn('[PM Products] No historical data available');
          updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">No price history available</div>');
        }
        
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting data:', getRequest.error);
        updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">Error loading price history</div>');
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
      updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">Error loading price history</div>');
    };
  } catch (error) {
    console.error('[PM Products] Error loading product details:', error);
    updateDetailedContent(detailedContainer, '<div class="pm-ad-no-history">Error loading price history</div>');
  }
}

// Helper function to update detailed content with fade effect
function updateDetailedContent(container, html) {
  const currentContent = container.querySelector('.pm-ad-details-detailed-content');
  if (currentContent) {
    currentContent.style.opacity = '0';
    setTimeout(() => {
      container.innerHTML = `<div class="pm-ad-details-detailed-content" style="opacity: 0;">${html}</div>`;
      setTimeout(() => {
        const newContent = container.querySelector('.pm-ad-details-detailed-content');
        if (newContent) {
          newContent.style.opacity = '1';
        }
      }, 100);
    }, 300);
  } else {
    container.innerHTML = `<div class="pm-ad-details-detailed-content">${html}</div>`;
  }
}

function renderPriceHistory(productRecord, container) {
  const historicalData = productRecord.historical_data;
  
  console.log('[PM Products] Raw historical data:', historicalData);
  console.log('[PM Products] First item structure:', JSON.stringify(historicalData[0], null, 2));
  
  // If historical_data is not an array, try to handle it
  if (!Array.isArray(historicalData)) {
    console.error('[PM Products] Historical data is not an array:', typeof historicalData);
    container.innerHTML = '<div class="pm-ad-details-detailed-content"><div class="pm-ad-no-history">No price history available</div></div>';
    return;
  }
  
  // Parse price data with better error handling
  const priceData = historicalData.map((item, index) => {
    console.log(`[PM Products] Processing item ${index}:`, item);
    
    // Parse price - handle various formats
    let price = 0;
    if (item.price) {
      if (typeof item.price === 'string') {
        // Remove currency symbols, commas, and other non-numeric characters
        const cleanPrice = item.price.replace(/[$,]/g, '');
        price = parseFloat(cleanPrice);
      } else if (typeof item.price === 'number') {
        price = item.price;
      }
    }
    
    // Parse date - handle the specific format in your data
    let date = null;
    if (item.date) {
      // Check for the {value: "YYYY-MM-DD"} format
      if (item.date.value) {
        date = new Date(item.date.value);
      }
      // Also check for MongoDB date format (keeping for compatibility)
      else if (item.date.$date) {
        if (item.date.$date.$numberLong) {
          date = new Date(parseInt(item.date.$date.$numberLong));
        } else if (typeof item.date.$date === 'string') {
          date = new Date(item.date.$date);
        } else if (typeof item.date.$date === 'number') {
          date = new Date(item.date.$date);
        }
      } 
      // Direct string date
      else if (typeof item.date === 'string') {
        date = new Date(item.date);
      } 
      // Direct timestamp
      else if (typeof item.date === 'number') {
        date = new Date(item.date);
      }
    }
    
    console.log(`[PM Products] Parsed - Price: ${price}, Date: ${date}`);
    
    return { date, price };
  }).filter(item => {
    // Filter out invalid entries
    const isValid = !isNaN(item.price) && item.price > 0 && 
                   item.date instanceof Date && !isNaN(item.date.getTime());
    if (!isValid) {
      console.log('[PM Products] Filtered out invalid item:', item);
    }
    return isValid;
  });
  
  console.log('[PM Products] Final parsed price data:', priceData);
  
  if (priceData.length === 0) {
    container.innerHTML = '<div class="pm-ad-details-detailed-content"><div class="pm-ad-no-history">Invalid price data</div></div>';
    return;
  }
  
  // Sort by date
  priceData.sort((a, b) => a.date - b.date);
  
  // Limit to last 30 days if we have more data
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentData = priceData.filter(item => item.date >= thirtyDaysAgo);
  const dataToUse = recentData.length > 0 ? recentData : priceData;
  
  console.log('[PM Products] Data to use for chart:', dataToUse);
  
// Get current price, max and min prices for trend calculation
const currentPrice = dataToUse[dataToUse.length - 1]?.price || 0;
const maxPrice = Math.max(...dataToUse.map(d => d.price));
const minPrice = Math.min(...dataToUse.map(d => d.price));

// Smart price trend calculation
let priceTrend = 0;
let trendClass = 'negative';
let trendSymbol = '↓';

// If current price is below the max (price went down), show % down from max
if (currentPrice < maxPrice) {
  priceTrend = ((currentPrice - maxPrice) / maxPrice * 100);
  trendClass = 'negative';
  trendSymbol = '↓';
}
// If current price is above the min (price went up), show % up from min
else if (currentPrice > minPrice) {
  priceTrend = ((currentPrice - minPrice) / minPrice * 100);
  trendClass = 'positive';
  trendSymbol = '↑';
}
// If price is stable (current = max = min), show 0%
else {
  priceTrend = 0;
  trendClass = 'neutral';
  trendSymbol = '—';
}

console.log(`[PM Products] Price trend: Current: $${currentPrice}, Min: $${minPrice}, Max: $${maxPrice}, Trend: ${priceTrend.toFixed(1)}%`);
  
  // Create container content
  const html = `
    <div class="pm-ad-details-detailed-content">
      <div class="pm-ad-price-trend ${trendClass}">
        <span>${trendSymbol}</span>
        <span>${Math.abs(priceTrend).toFixed(1)}%</span>
      </div>
      <div class="pm-ad-chart-container">
        <div class="pm-ad-chart-title">Price History (${dataToUse.length} data points)</div>
        <canvas class="pm-ad-chart-canvas" id="chart-${Date.now()}"></canvas>
      </div>
    </div>
  `;
  
  container.innerHTML = html;
  
  // Draw chart
  setTimeout(() => {
    const canvas = container.querySelector('.pm-ad-chart-canvas');
    if (canvas) {
      drawPriceChart(canvas, dataToUse, minPrice, maxPrice);
    }
  }, 50);
}

// Function to draw the price chart
function drawPriceChart(canvas, priceData, minPrice, maxPrice) {
  const ctx = canvas.getContext('2d');
  const rect = canvas.getBoundingClientRect();
  
  // Set canvas size
  canvas.width = rect.width;
  canvas.height = rect.height;
  
  const padding = { top: 10, right: 10, bottom: 30, left: 40 };
  const chartWidth = canvas.width - padding.left - padding.right;
  const chartHeight = canvas.height - padding.top - padding.bottom;
  
  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Calculate scales
  const priceRange = maxPrice - minPrice;
  const pricePadding = priceRange * 0.1 || 1;
  const yMin = minPrice - pricePadding;
  const yMax = maxPrice + pricePadding;
  
  // Draw grid lines and labels
  ctx.strokeStyle = '#f0f0f0';
  ctx.lineWidth = 1;
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#999';
  
  // Y-axis grid lines and labels
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (i * chartHeight / 4);
    const price = yMax - (i * (yMax - yMin) / 4);
    
    // Grid line
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(padding.left + chartWidth, y);
    ctx.stroke();
    
    // Label
    ctx.textAlign = 'right';
    ctx.fillText(`$${price.toFixed(0)}`, padding.left - 5, y + 3);
  }
  
  // Draw the price line
  ctx.strokeStyle = '#667eea';
  ctx.lineWidth = 2;
  ctx.beginPath();
  
  priceData.forEach((item, index) => {
    const x = padding.left + (index / (priceData.length - 1)) * chartWidth;
    const y = padding.top + ((yMax - item.price) / (yMax - yMin)) * chartHeight;
    
    if (index === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });
  
  ctx.stroke();
  
  // Draw data points
  ctx.fillStyle = '#667eea';
  priceData.forEach((item, index) => {
    const x = padding.left + (index / (priceData.length - 1)) * chartWidth;
    const y = padding.top + ((yMax - item.price) / (yMax - yMin)) * chartHeight;
    
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fill();
  });
  
  // Draw x-axis labels (dates)
  ctx.fillStyle = '#999';
  ctx.textAlign = 'center';
  
  if (priceData.length > 0) {
    // First date
    const firstDate = priceData[0].date;
    ctx.fillText(formatChartDate(firstDate), padding.left, canvas.height - 5);
    
    // Last date
    const lastDate = priceData[priceData.length - 1].date;
    ctx.fillText(formatChartDate(lastDate), padding.left + chartWidth, canvas.height - 5);
    
    // Middle date if we have enough data points
    if (priceData.length > 2) {
      const midIndex = Math.floor(priceData.length / 2);
      const midDate = priceData[midIndex].date;
      ctx.fillText(formatChartDate(midDate), padding.left + chartWidth / 2, canvas.height - 5);
    }
  }
}

// Helper function to format dates for chart
function formatChartDate(date) {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${month}/${day}`;
}

async function loadMyCompanyProducts(companyName) {
  const container = document.getElementById('pmpMyCompanyProductsList');
  if (!container) return;
  
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
    console.log('[PM Products] Loading products from:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        container.innerHTML = '<div class="pmp-no-products">No products found</div>';
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No processed data found');
          container.innerHTML = '<div class="pmp-no-products">No products found</div>';
          db.close();
          return;
        }
        
        // Get unique products for myCompany
        const productMap = new Map();
        
// Determine which 'q' value to filter by
const searchTermFilter = (window.filterState?.searchTerm && window.filterState.searchTerm.trim() !== '') 
  ? window.filterState.searchTerm 
  : null; // null means show all products

console.log('[PM Products] Filtering myCompany products by q =', searchTermFilter || 'all (no filter)');

result.data.forEach(row => {
  // Filter by company AND optionally by q field
  const matchesCompany = row.source && row.source.toLowerCase() === companyName.toLowerCase();
  const matchesSearch = !searchTermFilter || row.q === searchTermFilter;
  
  if (matchesCompany && matchesSearch) {
            const key = `${row.title}_${row.source}`;
            
            // Check if we already have this product
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
        });
        
// Convert map to array and sort by price
const products = Array.from(productMap.values()).sort((a, b) => {
  const priceA = parseFloat(a.price) || 0;
  const priceB = parseFloat(b.price) || 0;
  return priceB - priceA; // Sort high to low
});

// Store products data globally
allProductsData.myCompany = products;

if (products.length === 0) {
  container.innerHTML = '<div class="pmp-no-products">No products found</div>';
} else {
  // Get company data for charts (wrap in async function)
  (async () => {
    const data = await window.pmUtils.loadCompanyPricingData();
    const companyName = window.myCompany || 'East Perry';
    const myCompanyData = data.allData.find(row => 
      row.source.toLowerCase() === companyName.toLowerCase() && row.q === 'all'
    );
    
    // Update summary
    updateMyCompanySummary(products, myCompanyData);
    
// Filter only myCompany list
applyPMPFilters('mycompany');
  })();
}   
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting processed data:', getRequest.error);
        container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
      container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
    };
  } catch (error) {
    console.error('[PM Products] Error loading products:', error);
    container.innerHTML = '<div class="pmp-no-products">Error loading products</div>';
  }
}

async function loadCompetitorProducts(companyName) {
  const container = document.getElementById('pmpCompetitorsProductsList');
  if (!container) return;
  
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
    console.log('[PM Products] Loading competitor products from:', tableName);
    
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = function(event) {
      const db = event.target.result;
      
      if (!db.objectStoreNames.contains('projectData')) {
        console.error('[PM Products] projectData object store not found');
        container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
        db.close();
        return;
      }
      
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = function() {
        const result = getRequest.result;
        
        if (!result || !result.data) {
          console.warn('[PM Products] No processed data found');
          container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
          db.close();
          return;
        }
        
        // Get unique products for competitors (excluding myCompany)
        const productMap = new Map();
        
// Determine which 'q' value to filter by
const searchTermFilter = (window.filterState?.searchTerm && window.filterState.searchTerm.trim() !== '') 
  ? window.filterState.searchTerm 
  : null; // null means show all products

console.log('[PM Products] Filtering competitor products by q =', searchTermFilter || 'all (no filter)');

result.data.forEach(row => {
  // Filter by company AND optionally by q field
  const matchesCompany = row.source && 
                        row.source.toLowerCase() !== companyName.toLowerCase() && 
                        row.source !== 'all';
  const matchesSearch = !searchTermFilter || row.q === searchTermFilter;
  
  if (matchesCompany && matchesSearch) {
            const key = `${row.title}_${row.source}`;
            
            // Check if we already have this product
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
        });
        
// Convert map to array and sort by price (high to low), then limit to top 20
const products = Array.from(productMap.values())
  .sort((a, b) => {
    const priceA = parseFloat(a.price) || 0;
    const priceB = parseFloat(b.price) || 0;
    return priceB - priceA;
  })

// Store products data globally (keep all products, not just top 20, for filtering)
allProductsData.competitors = Array.from(productMap.values()).sort((a, b) => {
  const priceA = parseFloat(a.price) || 0;
  const priceB = parseFloat(b.price) || 0;
  return priceB - priceA;
});

if (allProductsData.competitors.length === 0) {
  container.innerHTML = '<div class="pmp-no-products">No competitor products found</div>';
} else {
  // Populate company filter dropdown
  populateCompanyFilter();
  
  // Update summary (wrap in async function since it needs async operations)
  (async () => {
    await updateCompetitorsSummary(allProductsData.competitors);
    
// Filter only competitors list
applyPMPFilters('competitors');
  })();
}
        db.close();
      };
      
      getRequest.onerror = function() {
        console.error('[PM Products] Error getting processed data:', getRequest.error);
        container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
        db.close();
      };
    };
    
    request.onerror = function() {
      console.error('[PM Products] Failed to open database:', request.error);
      container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
    };
  } catch (error) {
    console.error('[PM Products] Error loading competitor products:', error);
    container.innerHTML = '<div class="pmp-no-products">Error loading competitor products</div>';
  }
}

// Helper functions
function formatProductsNumber(value, decimals = 0) {
  const num = parseFloat(value) || 0;
  return num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Export functions for use in main price_monitoring.js
window.pmProductsModule = {
  initialize: initializePriceMonitoringProducts,
  renderDashboard: renderProductsDashboard,
  refresh: async function() {
    console.log('[PM Products] Refreshing with search term:', window.filterState?.searchTerm);
    const companyName = window.myCompany || 'East Perry';
    await loadMyCompanyProducts(companyName);
    await loadCompetitorProducts(companyName);
  }
};

// Auto-initialize when the script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializePriceMonitoringProducts);
} else {
  initializePriceMonitoringProducts();
}
