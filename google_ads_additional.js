/**
 * Google Ads Additional Functions
 * This file contains modularized chart and utility functions
 * Dependencies: Chart.js, moment.js
 */

(function(window) {
  'use strict';
  
  // Create namespace if it doesn't exist
  window.GoogleAdsModules = window.GoogleAdsModules || {};
  
  // Create Charts module
  window.GoogleAdsModules.Charts = window.GoogleAdsModules.Charts || {};
  
  /**
   * Renders average position chart for Google Ads products
   * @param {HTMLElement} container - The container element for the chart
   * @param {Array} products - Array of product objects with historical data
   */
  window.GoogleAdsModules.Charts.renderAvgPositionChart = function(container, products) {
    // Check dependencies
    if (typeof Chart === 'undefined') {
      console.error('[GoogleAdsModules.Charts] Chart.js is required but not loaded');
      return;
    }
    
    if (typeof moment === 'undefined') {
      console.error('[GoogleAdsModules.Charts] moment.js is required but not loaded');
      return;
    }
    
    if (!Chart.defaults.plugins.annotation) {
      console.warn('Chart.js annotation plugin not loaded. Top8 area will not be displayed.');
    }
    
    // Clear container
    container.innerHTML = '';
    container.style.padding = '20px';
    
    container.selectedProductIndex = null;
    container.chartInstance = null;
    
    // Create canvas element
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    container.appendChild(canvas);
    
    // Use today's date as the latest date, always show last 30 days
    const maxDate = moment().startOf('day');
    const minDate = maxDate.clone().subtract(29, 'days'); // 30 days total including today
    
    // Create array of exactly 30 dates
    const dateArray = [];
    let currentDate = minDate.clone();
    while (currentDate.isSameOrBefore(maxDate)) {
      dateArray.push(currentDate.format('YYYY-MM-DD'));
      currentDate.add(1, 'day');
    }
    
    const datasets = [];
    
    // Process each product
    products.forEach((product, index) => {
      const positionData = dateArray.map(dateStr => {
        const histItem = product.historical_data?.find(item => 
          item.date?.value === dateStr
        );
        return histItem?.avg_position ? 
          parseFloat(histItem.avg_position) : null;
      });
      
      const visibilityData = dateArray.map(dateStr => {
        const histItem = product.historical_data?.find(item => 
          item.date?.value === dateStr
        );
        return histItem?.top8_visibility ? 
          parseFloat(histItem.top8_visibility) * 100 : null;
      });
      
      const color = this.getProductColor ? 
        this.getProductColor(index) : 
        `hsl(${index * 30}, 70%, 50%)`;
      
      // Add position line dataset
      datasets.push({
        label: (product.title?.substring(0, 30) || 'Product') + 
               (product.title?.length > 30 ? '...' : ''),
        data: positionData,
        borderColor: color,
        backgroundColor: color + '20',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: true,
        yAxisID: 'y',
        type: 'line',
        productIndex: index,
        dataType: 'position',
        segment: {
          borderDash: (ctx) => {
            const p0 = ctx.p0;
            const p1 = ctx.p1;
            if (p0.skip || p1.skip) {
              return [5, 5];
            }
            return undefined;
          }
        }
      });
      
      // Add visibility area dataset (initially hidden)
      datasets.push({
        label: product.title?.substring(0, 30) + ' (Visibility)',
        data: visibilityData,
        borderColor: color,
        backgroundColor: color + '30',
        borderWidth: 2,
        fill: true,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.3,
        spanGaps: false,
        yAxisID: 'y1',
        type: 'line',
        hidden: true,
        productIndex: index,
        dataType: 'visibility'
      });
    });
    
    // Create the chart
    container.chartInstance = new Chart(canvas, {
      type: 'line',
      data: {
        labels: dateArray,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: false
          },
          annotation: {
            annotations: {
              top8Area: {
                type: 'box',
                yScaleID: 'y',
                yMin: 1,
                yMax: 8,
                backgroundColor: 'rgba(0, 255, 0, 0.05)',
                borderColor: 'rgba(0, 255, 0, 0.2)',
                borderWidth: 1,
                borderDash: [5, 5],
                label: {
                  content: 'Top 8',
                  enabled: true,
                  position: 'end',
                  font: {
                    size: 10,
                    style: 'italic'
                  },
                  color: 'rgba(0, 200, 0, 0.8)'
                }
              }
            }
          },
          tooltip: {
            mode: 'index',
            intersect: false,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                const value = context.parsed.y;
                
                if (context.dataset.dataType === 'position') {
                  if (value === null) {
                    return label + 'No data';
                  }
                  return label + 'Position ' + value.toFixed(1);
                } else if (context.dataset.dataType === 'visibility') {
                  if (value === null) {
                    return label + 'No data';
                  }
                  return label + value.toFixed(1) + '% visibility';
                }
                
                return label + value;
              }
            }
          }
        },
        scales: {
          x: {
            type: 'category',
            title: {
              display: true,
              text: 'Date',
              font: { size: 12 }
            },
            ticks: {
              maxRotation: 45,
              minRotation: 45,
              font: { size: 10 },
              autoSkip: true,
              maxTicksLimit: Math.max(5, Math.floor(container.offsetWidth / 50))
            },
            grid: {
              display: true,
              drawBorder: true,
              drawOnChartArea: true,
              drawTicks: true
            }
          },
          y: {
            type: 'linear',
            position: 'left',
            reverse: true,
            min: 1,
            max: 40,
            title: {
              display: true,
              text: 'Average Position',
              font: { size: 12 }
            },
            ticks: {
              font: { size: 10 },
              stepSize: 5
            }
          },
          y1: {
            type: 'linear',
            position: 'right',
            min: 0,
            max: 100,
            title: {
              display: true,
              text: 'Visibility (%)',
              font: { size: 12 }
            },
            ticks: {
              font: { size: 10 },
              stepSize: 20,
              callback: function(value) {
                return value + '%';
              }
            },
            grid: {
              drawOnChartArea: false
            }
          }
        }
      }
    });
    
    // Return the chart instance for external manipulation if needed
    return container.chartInstance;
  };
  
  /**
   * Helper function to get product color
   * @param {number} index - Product index
   * @returns {string} Color string
   */
  window.GoogleAdsModules.Charts.getProductColor = function(index) {
    const colors = [
      '#007aff', '#34c759', '#ff9500', '#ff3b30', '#5856d6',
      '#af52de', '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6482'
    ];
    return colors[index % colors.length];
  };
  
  // Add any other chart-related functions here...
  
})(window);
