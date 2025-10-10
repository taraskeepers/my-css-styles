/**
 * Google Ads Additional Functions - ROAS Module
 * Version: 1.0.0
 * Dependencies: ApexCharts, moment.js
 * 
 * This module handles all ROAS (Return on Ad Spend) charts and visualizations
 * for the Performance Overview in Google Ads
 */

(function(window) {
  'use strict';
  
  // =================================================================
  // NAMESPACE SETUP
  // =================================================================
  window.GoogleAdsModules = window.GoogleAdsModules || {};
  window.GoogleAdsModules.ROAS = window.GoogleAdsModules.ROAS || {};
  
  // Store chart instances for cleanup
  window.roasApexCharts = window.roasApexCharts || [];
  
  // =================================================================
  // MAIN ROAS LOADING FUNCTION
  // =================================================================
  
  /**
   * Load and render ROAS buckets data
   * This is the main entry point for ROAS visualization
   */
  window.GoogleAdsModules.ROAS.loadAndRenderBuckets = async function() {
    console.log('[ROAS.loadAndRenderBuckets] Starting...');
    
    try {
      // Clean up any existing charts first
      this.cleanupCharts();
      
      // Get the containers
      const roasChartsContainer = document.getElementById('roas_charts');
      const roasChannelsContainer = document.getElementById('roas_channels');
      
      if (!roasChartsContainer) {
        console.error('[ROAS.loadAndRenderBuckets] roas_charts container not found');
        return;
      }
      
      // Load bucket data from IndexedDB
      const bucketData = await this.loadBucketData();
      if (!bucketData) {
        this.showNoDataMessage(roasChartsContainer);
        return;
      }
      
      // Render main ROAS chart
      await this.renderMainROASChart(roasChartsContainer, bucketData);
      
      // Render channels breakdown if container exists
      if (roasChannelsContainer) {
        await this.renderChannelsBreakdown(roasChannelsContainer, bucketData);
      }
      
    } catch (error) {
      console.error('[ROAS.loadAndRenderBuckets] Error:', error);
      this.showErrorMessage(document.getElementById('roas_charts'));
    }
  };
  
  // =================================================================
  // DATA LOADING FUNCTIONS
  // =================================================================
  
  /**
   * Load bucket data from IndexedDB
   */
  window.GoogleAdsModules.ROAS.loadBucketData = async function() {
    const tablePrefix = this.getProjectTablePrefix();
    const days = window.selectedBucketDateRangeDays || 30;
    const suffix = days === 60 ? '60d' : days === 90 ? '90d' : '30d';
    const tableName = `${tablePrefix}googleSheets_productBuckets_${suffix}`;
    
    console.log(`[ROAS.loadBucketData] Loading from table: ${tableName}`);
    
    try {
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
      
      if (!result || !result.data) {
        console.warn('[ROAS.loadBucketData] No data found');
        return null;
      }
      
      return result.data;
      
    } catch (error) {
      console.error('[ROAS.loadBucketData] Error:', error);
      return null;
    }
  };
  
  // =================================================================
  // CHART RENDERING FUNCTIONS
  // =================================================================
  
  /**
   * Render the main ROAS chart
   */
  window.GoogleAdsModules.ROAS.renderMainROASChart = function(container, data) {
    // Clear container
    container.innerHTML = '';
    
    // Create chart wrapper
    const chartWrapper = document.createElement('div');
    chartWrapper.id = 'roasMainChart';
    chartWrapper.style.cssText = 'width: 100%; height: 360px;';
    container.appendChild(chartWrapper);
    
    // Process data for the chart
    const chartData = this.processROASData(data);
    
    // Chart configuration
    const options = {
      series: chartData.series,
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: true,
          tools: {
            download: true,
            selection: true,
            zoom: true,
            zoomin: true,
            zoomout: true,
            pan: true,
            reset: true
          }
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          dataLabels: {
            position: 'center'
          }
        }
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val > 0 ? val.toFixed(1) : '';
        },
        style: {
          fontSize: '12px',
          colors: ['#fff']
        }
      },
      xaxis: {
        categories: chartData.categories,
        labels: {
          style: {
            fontSize: '12px'
          }
        }
      },
      yaxis: {
        title: {
          text: 'ROAS Value',
          style: {
            fontSize: '13px'
          }
        },
        labels: {
          formatter: function(val) {
            return val.toFixed(1);
          }
        }
      },
      colors: ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0'],
      legend: {
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '13px'
      },
      tooltip: {
        y: {
          formatter: function(val) {
            return 'ROAS: ' + val.toFixed(2);
          }
        }
      }
    };
    
    // Create and render chart
    const chart = new ApexCharts(chartWrapper, options);
    chart.render();
    
    // Store chart instance for cleanup
    window.roasApexCharts.push(chart);
  };
  
  /**
   * Render channels breakdown
   */
  window.GoogleAdsModules.ROAS.renderChannelsBreakdown = function(container, data) {
    // Clear container
    container.innerHTML = '';
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 15px;
      border-bottom: 1px solid #e0e0e0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    
    header.innerHTML = `
      <h3 style="margin: 0; font-size: 16px; font-weight: 600;">Channel Performance</h3>
      <div class="channel-filters">
        <select id="channelTypeFilter" style="padding: 6px 12px; border: 1px solid #ddd; border-radius: 4px; font-size: 13px;">
          <option value="all">All Channels</option>
          <option value="search">Search</option>
          <option value="shopping">Shopping</option>
          <option value="display">Display</option>
          <option value="video">Video</option>
        </select>
      </div>
    `;
    
    container.appendChild(header);
    
    // Create metrics grid
    const metricsGrid = document.createElement('div');
    metricsGrid.id = 'channelMetricsGrid';
    metricsGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      padding: 20px;
    `;
    
    container.appendChild(metricsGrid);
    
    // Process and display channel metrics
    this.displayChannelMetrics(metricsGrid, data);
    
    // Add event listener for filter
    document.getElementById('channelTypeFilter')?.addEventListener('change', (e) => {
      this.filterChannelMetrics(metricsGrid, data, e.target.value);
    });
  };
  
  // =================================================================
  // DATA PROCESSING FUNCTIONS
  // =================================================================
  
  /**
   * Process ROAS data for charts
   */
  window.GoogleAdsModules.ROAS.processROASData = function(data) {
    // Filter for current device filter
    const deviceFilter = window.selectedDeviceFilter || 'all';
    const filteredData = data.filter(row => 
      row['Campaign Name'] === 'All' && 
      (deviceFilter === 'all' ? 
        row['Device'] === 'All' : 
        row['Device'] === deviceFilter)
    );
    
    // Group by bucket types
    const bucketTypes = ['PROFITABILITY_BUCKET', 'FUNNEL_STAGE_BUCKET', 'INVESTMENT_BUCKET'];
    const categories = [];
    const seriesData = {};
    
    filteredData.forEach(row => {
      const productTitle = row['Product Title'];
      if (!categories.includes(productTitle)) {
        categories.push(productTitle);
      }
      
      bucketTypes.forEach(bucketType => {
        if (!seriesData[bucketType]) {
          seriesData[bucketType] = [];
        }
        
        const roasValue = parseFloat(row['ROAS']) || 0;
        const index = categories.indexOf(productTitle);
        seriesData[bucketType][index] = roasValue;
      });
    });
    
    // Convert to ApexCharts series format
    const series = Object.keys(seriesData).map(bucketType => ({
      name: bucketType.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
      data: seriesData[bucketType]
    }));
    
    return {
      categories: categories.slice(0, 10), // Limit to top 10 products
      series: series
    };
  };
  
  /**
   * Display channel metrics
   */
  window.GoogleAdsModules.ROAS.displayChannelMetrics = function(container, data, filter = 'all') {
    // Clear container
    container.innerHTML = '';
    
    // Filter and aggregate data by channel
    const channelData = this.aggregateByChannel(data, filter);
    
    // Create metric cards
    Object.entries(channelData).forEach(([channel, metrics]) => {
      const card = this.createChannelMetricCard(channel, metrics);
      container.appendChild(card);
    });
  };
  
  /**
   * Create channel metric card
   */
  window.GoogleAdsModules.ROAS.createChannelMetricCard = function(channel, metrics) {
    const card = document.createElement('div');
    card.style.cssText = `
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 15px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    `;
    
    const roasColor = metrics.roas >= 3 ? '#4CAF50' : 
                      metrics.roas >= 1.5 ? '#FFC107' : '#F44336';
    
    card.innerHTML = `
      <div style="font-size: 13px; color: #666; margin-bottom: 8px;">${channel}</div>
      <div style="font-size: 24px; font-weight: 700; color: ${roasColor}; margin-bottom: 10px;">
        ${metrics.roas.toFixed(2)}
      </div>
      <div style="display: flex; justify-content: space-between; font-size: 12px; color: #888;">
        <span>Cost: $${metrics.cost.toLocaleString()}</span>
        <span>Revenue: $${metrics.revenue.toLocaleString()}</span>
      </div>
    `;
    
    return card;
  };
  
  // =================================================================
  // UTILITY FUNCTIONS
  // =================================================================
  
  /**
   * Get project table prefix
   */
  window.GoogleAdsModules.ROAS.getProjectTablePrefix = function() {
    const accountPrefix = window.currentAccount || 'acc1';
    const currentProjectNum = window.dataPrefix ? 
      parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
    const prefix = `${accountPrefix}_pr${currentProjectNum}_`;
    return prefix;
  };
  
  /**
   * Clean up existing charts
   */
  window.GoogleAdsModules.ROAS.cleanupCharts = function() {
    if (window.roasApexCharts) {
      window.roasApexCharts.forEach(chart => {
        try {
          chart.destroy();
        } catch (e) {
          console.warn('Error destroying chart:', e);
        }
      });
      window.roasApexCharts = [];
    }
  };
  
  /**
   * Show no data message
   */
  window.GoogleAdsModules.ROAS.showNoDataMessage = function(container) {
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #666;">
        <div style="font-size: 48px; margin-bottom: 20px;">📊</div>
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">No ROAS Data Available</h3>
        <p style="margin: 0; font-size: 14px;">Please check your Google Sheets integration or select a different date range.</p>
      </div>
    `;
  };
  
  /**
   * Show error message
   */
  window.GoogleAdsModules.ROAS.showErrorMessage = function(container) {
    if (!container) return;
    
    container.innerHTML = `
      <div style="text-align: center; padding: 60px 20px; color: #f44336;">
        <div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
        <h3 style="margin: 0 0 10px 0; font-size: 18px;">Error Loading ROAS Data</h3>
        <p style="margin: 0; font-size: 14px;">Please try refreshing the page or contact support if the issue persists.</p>
      </div>
    `;
  };
  
  /**
   * Aggregate data by channel
   */
  window.GoogleAdsModules.ROAS.aggregateByChannel = function(data, filter = 'all') {
    const aggregated = {};
    
    data.forEach(row => {
      const channel = row['Channel Type'] || 'Unknown';
      
      if (filter !== 'all' && channel.toLowerCase() !== filter.toLowerCase()) {
        return;
      }
      
      if (!aggregated[channel]) {
        aggregated[channel] = {
          cost: 0,
          revenue: 0,
          conversions: 0,
          roas: 0
        };
      }
      
      aggregated[channel].cost += parseFloat(row['Cost']) || 0;
      aggregated[channel].revenue += parseFloat(row['ConvValue']) || 0;
      aggregated[channel].conversions += parseFloat(row['Conversions']) || 0;
    });
    
    // Calculate ROAS for each channel
    Object.values(aggregated).forEach(metrics => {
      metrics.roas = metrics.cost > 0 ? metrics.revenue / metrics.cost : 0;
    });
    
    return aggregated;
  };
  
  /**
   * Filter channel metrics
   */
  window.GoogleAdsModules.ROAS.filterChannelMetrics = function(container, data, filter) {
    this.displayChannelMetrics(container, data, filter);
  };
  
  // =================================================================
  // EXPORT BACKWARD COMPATIBILITY WRAPPER
  // =================================================================
  
  /**
   * Backward compatibility wrapper for existing code
   */
  window.loadAndRenderROASBuckets = function() {
    return window.GoogleAdsModules.ROAS.loadAndRenderBuckets();
  };
  
})(window);
