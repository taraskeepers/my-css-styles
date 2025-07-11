// Replace your existing window.getProductRecordsForPopup function with this debug version:

window.getProductRecordsForPopup = function(productTitle, productUrl) {
  if (!window.allRows || !Array.isArray(window.allRows)) {
    console.error('[Ranking Map] window.allRows is not available or not an array');
    return [];
  }
  
  const normalizedUrl = productUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const normalizedTitle = productTitle?.toLowerCase().trim();
  
  console.log('[Ranking Map] Searching for product:', { normalizedTitle, normalizedUrl });
  console.log('[Ranking Map] Total rows in window.allRows:', window.allRows.length);
  
  // Debug: Let's check the structure of the first few rows
  if (window.allRows.length > 0) {
    console.log('[Ranking Map DEBUG] Sample row structure:', {
      hasTopResults: !!window.allRows[0].top_results,
      topResultsLength: window.allRows[0].top_results?.length,
      sampleTopResult: window.allRows[0].top_results?.[0],
      rowKeys: Object.keys(window.allRows[0])
    });
  }
  
  // Debug: Let's try different matching approaches
  const matchedRecords = window.allRows.filter(row => {
    // First, let's see if the product title exists directly in the row
    if (row.title && row.title.toLowerCase().includes(normalizedTitle)) {
      console.log('[Ranking Map DEBUG] Found match by row.title:', row.title);
      return true;
    }
    
    // Check if there's a product_title field
    if (row.product_title && row.product_title.toLowerCase().includes(normalizedTitle)) {
      console.log('[Ranking Map DEBUG] Found match by row.product_title:', row.product_title);
      return true;
    }
    
    // Original logic - match by URL in top_results
    if (normalizedUrl && row.top_results && Array.isArray(row.top_results)) {
      const hasUrlMatch = row.top_results.some(result => 
        result.link && result.link.replace(/^https?:\/\//, '').replace(/\/$/, '') === normalizedUrl
      );
      if (hasUrlMatch) {
        console.log('[Ranking Map DEBUG] Found match by URL in top_results');
        return true;
      }
    }
    
    // Original logic - match by title in top_results
    if (normalizedTitle && row.top_results && Array.isArray(row.top_results)) {
      const hasTitleMatch = row.top_results.some(result => {
        if (result.title && result.title.toLowerCase().includes(normalizedTitle)) {
          console.log('[Ranking Map DEBUG] Found match by title in top_results:', result.title);
          return true;
        }
        return false;
      });
      if (hasTitleMatch) return true;
    }
    
    // New approach: Check if this row's product matches our title
    // Sometimes the title might be in a different format
    if (normalizedTitle) {
      // Check for partial matches with key words
      const titleWords = normalizedTitle.split(' ').filter(word => word.length > 3);
      const significantWords = titleWords.slice(0, 5); // First 5 significant words
      
      // Check top_results for partial matches
      if (row.top_results && Array.isArray(row.top_results)) {
        for (const result of row.top_results) {
          if (result.title) {
            const resultTitleLower = result.title.toLowerCase();
            const matchCount = significantWords.filter(word => 
              resultTitleLower.includes(word)
            ).length;
            
            if (matchCount >= 3) { // At least 3 words match
              console.log('[Ranking Map DEBUG] Found partial match:', {
                searchTitle: normalizedTitle,
                foundTitle: result.title,
                matchedWords: matchCount
              });
              return true;
            }
          }
        }
      }
    }
    
    return false;
  });
  
  console.log('[Ranking Map] Matched records:', matchedRecords.length);
  
  // If still no matches, let's search more broadly
  if (matchedRecords.length === 0 && normalizedTitle) {
    console.log('[Ranking Map DEBUG] No exact matches found. Searching for Under Armour products...');
    
    // Look for any Under Armour products to understand the data structure
    const underArmourProducts = window.allRows.filter(row => {
      if (row.top_results && Array.isArray(row.top_results)) {
        return row.top_results.some(result => 
          result.title && result.title.toLowerCase().includes('under armour')
        );
      }
      return false;
    }).slice(0, 3); // Get first 3 for debugging
    
    if (underArmourProducts.length > 0) {
      console.log('[Ranking Map DEBUG] Found Under Armour products:', 
        underArmourProducts.map(row => ({
          device: row.device,
          firstResultTitle: row.top_results[0]?.title,
          historicalDataLength: row.historical_data?.length
        }))
      );
    }
  }
  
  return matchedRecords;
};

window.loadRankingTabContent = async function(popup, bucketData) {
  const container = popup.querySelector('[data-content="ranking"]');
  if (!container) return;
  
  try {
    // Get product info
    const productTitle = bucketData['Product Title'];
    const productUrl = bucketData['Product_Page'] || '';
    const currentDevice = (bucketData['Device'] || 'desktop').toLowerCase();
    
    console.log('[Ranking Map] Loading for:', { productTitle, currentDevice });
    
    // Use the globally defined function
    const productRecords = window.getProductRecordsForPopup(productTitle, productUrl);
    console.log('[Ranking Map] Found records:', productRecords.length);
    
    // Filter records by current device
    const deviceFilteredRecords = productRecords.filter(record => {
      if (!record.device) return false;
      const recordDevice = record.device.toLowerCase();
      return (currentDevice === 'desktop' && recordDevice === 'desktop') ||
             (currentDevice === 'mobile' && recordDevice === 'mobile');
    });
    
    console.log('[Ranking Map] Device filtered records:', deviceFilteredRecords.length);
    
    // Extract rankings by date for last 30 days
    const endDate = moment();
    const startDate = moment().subtract(30, 'days');
    const rankingsByDate = new Map();
    
    // Debug: Track position distribution
    const positionDistribution = {};
    
    deviceFilteredRecords.forEach(record => {
      if (record.historical_data && Array.isArray(record.historical_data)) {
        record.historical_data.forEach(item => {
          if (item.date?.value && item.avg_position != null) {
            const itemDate = moment(item.date.value, 'YYYY-MM-DD');
            if (itemDate.isBetween(startDate, endDate, 'day', '[]')) {
              const date = item.date.value;
              const ranking = parseFloat(item.avg_position);
              
              if (!rankingsByDate.has(date)) {
                rankingsByDate.set(date, []);
              }
              rankingsByDate.get(date).push(ranking);
              
              // Track position distribution
              const roundedPos = Math.round(ranking);
              positionDistribution[roundedPos] = (positionDistribution[roundedPos] || 0) + 1;
            }
          }
        });
      }
    });
    
    console.log('[Ranking Map] Rankings by date:', rankingsByDate.size);
    console.log('[Ranking Map] Position distribution:', positionDistribution);
    
    // Calculate average ranking per date
    const avgRankingByDate = new Map();
    rankingsByDate.forEach((rankings, date) => {
      const avgRanking = rankings.reduce((sum, r) => sum + r, 0) / rankings.length;
      avgRankingByDate.set(date, avgRanking);
    });
    
    // Debug: Log date ranges
    if (rankingsByDate.size > 0) {
      const rankingDates = Array.from(rankingsByDate.keys()).sort();
      console.log('[Ranking Map] Ranking date range:', rankingDates[0], 'to', rankingDates[rankingDates.length - 1]);
    }
    
    // Load product metrics data for the same period
    const result = await loadProductMetricsData(productTitle);
    
    if (!result || !result.productData) {
      container.innerHTML = `
        <div class="ranking-content">
          <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: #333;">
            Performance by Ranking Position
          </h3>
          <div style="text-align: center; padding: 40px 20px; color: #666;">
            No performance data available for ranking analysis
          </div>
        </div>
      `;
      return;
    }
    
    // Filter metrics by device and date range
    const metricsData = result.productData.filter(row => {
      const rowDevice = (row['Device'] || 'desktop').toLowerCase();
      const rowDate = moment(row['Date'], 'YYYY-MM-DD');
      return rowDevice === currentDevice && 
             rowDate.isBetween(startDate, endDate, 'day', '[]');
    });
    
    console.log('[Ranking Map] Filtered metrics data:', metricsData.length);
    
    // Helper function to parse currency values
    const parseCurrency = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove dollar sign and commas, then parse
        return parseFloat(value.replace(/[$,]/g, '')) || 0;
      }
      return 0;
    };
    
    // Debug: Log first row to see field names
    if (metricsData.length > 0) {
      console.log('[Ranking Map] Sample metrics row fields:', Object.keys(metricsData[0]));
      console.log('[Ranking Map] Sample metrics row data:', {
        Clicks: metricsData[0]['Clicks'],
        Cost: metricsData[0]['Cost'],
        Conversions: metricsData[0]['Conversions'],
        'Conv. value': metricsData[0]['Conv. value'],
        'Conversion Value': metricsData[0]['Conversion Value'],
        'ConvValue': metricsData[0]['ConvValue'],
        'Conv. Value': metricsData[0]['Conv. Value']
      });
    }
    
    // Group metrics by date
    const metricsByDate = new Map();
    metricsData.forEach(row => {
      const date = row['Date'];
      if (!date) return;
      
      if (!metricsByDate.has(date)) {
        metricsByDate.set(date, {
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0
        });
      }
      
      const dayData = metricsByDate.get(date);
      dayData.clicks += parseInt(row['Clicks']) || 0;
      dayData.cost += parseCurrency(row['Cost']);
      dayData.conversions += parseInt(row['Conversions']) || 0;
      
      // Try multiple possible field names for conversion value
      const convValue = parseCurrency(row['Conv. value']) ||  // This is likely the correct field
                       parseCurrency(row['Conversion Value']) || 
                       parseCurrency(row['ConvValue']) || 
                       parseCurrency(row['Conv. Value']) ||
                       parseCurrency(row['Conversion value']) || 0;
      
      dayData.conversionValue += convValue;
    });
    
    console.log('[Ranking Map] Metrics by date:', metricsByDate.size);
    
    // Debug: Check if we're getting conversion values
    let totalConvValue = 0;
    metricsByDate.forEach((dayData, date) => {
      totalConvValue += dayData.conversionValue;
    });
    console.log('[Ranking Map] Total conversion value across all dates:', totalConvValue);
    
    // Debug: Log metrics date range
    if (metricsByDate.size > 0) {
      const metricsDates = Array.from(metricsByDate.keys()).sort();
      console.log('[Ranking Map] Metrics date range:', metricsDates[0], 'to', metricsDates[metricsDates.length - 1]);
    }
    
    // Initialize position segments - ALWAYS show all 4
    const positionSegments = {
      'Top 3': { min: 1, max: 3, clicks: 0, cost: 0, conversions: 0, conversionValue: 0, days: 0 },
      'Top 4-8': { min: 4, max: 8, clicks: 0, cost: 0, conversions: 0, conversionValue: 0, days: 0 },
      'Top 9-14': { min: 9, max: 14, clicks: 0, cost: 0, conversions: 0, conversionValue: 0, days: 0 },
      'Below 14': { min: 15, max: 40, clicks: 0, cost: 0, conversions: 0, conversionValue: 0, days: 0 }
    };
    
    // Track unmatched dates for debugging
    const unmatchedMetricsDates = [];
    const unmatchedRankingDates = [];
    
    // Match metrics with rankings by date and aggregate into segments
    let matchedDays = 0;
    metricsByDate.forEach((dayData, date) => {
      const avgRanking = avgRankingByDate.get(date);
      if (!avgRanking) {
        unmatchedMetricsDates.push(date);
        return; // Skip if no ranking for this date
      }
      
      matchedDays++;
      const roundedRanking = Math.round(avgRanking);
      const position = Math.max(1, Math.min(40, roundedRanking));
      
      // Find which segment this position belongs to
      let segmentName = null;
      let segment = null;
      for (const [name, data] of Object.entries(positionSegments)) {
        if (position >= data.min && position <= data.max) {
          segmentName = name;
          segment = data;
          break;
        }
      }
      
      if (segment) {
        segment.clicks += dayData.clicks;
        segment.cost += dayData.cost;
        segment.conversions += dayData.conversions;
        segment.conversionValue += dayData.conversionValue;
        segment.days += 1;
      }
    });
    
    // Check for ranking dates without metrics
    avgRankingByDate.forEach((ranking, date) => {
      if (!metricsByDate.has(date)) {
        unmatchedRankingDates.push(date);
      }
    });
    
    console.log('[Ranking Map] Matched days with both ranking and metrics:', matchedDays);
    console.log('[Ranking Map] Dates with metrics but no ranking:', unmatchedMetricsDates.length, unmatchedMetricsDates.slice(0, 5));
    console.log('[Ranking Map] Dates with ranking but no metrics:', unmatchedRankingDates.length, unmatchedRankingDates.slice(0, 5));
    
    // Debug: Log segment totals
    console.log('[Ranking Map] Segment totals:', {
      'Top 3': positionSegments['Top 3'],
      'Top 4-8': positionSegments['Top 4-8'],
      'Top 9-14': positionSegments['Top 9-14'],
      'Below 14': positionSegments['Below 14']
    });
    
    // Build the ranking map table
    let tableHTML = `
      <div class="ranking-content">
        <h3 style="font-size: 14px; font-weight: 700; margin-bottom: 16px; color: #333;">
          Performance by Ranking Position
          <span style="font-size: 11px; font-weight: 400; color: #666; margin-left: 8px;">
            (Last 30 Days - ${currentDevice === 'mobile' ? 'Mobile' : 'Desktop'})
          </span>
        </h3>
        <table class="ranking-map-table">
          <thead>
            <tr>
              <th>Position</th>
              <th>Clicks</th>
              <th>Avg CPC</th>
              <th>Conv. Value</th>
              <th>ROAS</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Define segment colors
    const segmentClasses = {
      'Top 3': 'segment-top-3',
      'Top 4-8': 'segment-top-4-8',
      'Top 9-14': 'segment-top-9-14',
      'Below 14': 'segment-below-14'
    };
    
    // ALWAYS show all segments, even with zero data
    for (const [segmentName, segment] of Object.entries(positionSegments)) {
      const hasData = segment.days > 0;
      const avgCPC = segment.clicks > 0 ? (segment.cost / segment.clicks).toFixed(2) : '0.00';
      const roas = segment.cost > 0 ? (segment.conversionValue / segment.cost).toFixed(2) : '0.00';
      
      // Determine ROAS coloring
      let roasClass = '';
      let roasDisplay = '-';
      if (hasData) {
        if (segment.cost > 0) {
          const roasValue = parseFloat(roas);
          roasClass = roasValue >= 2.5 ? 'roas-good' : roasValue >= 1.5 ? 'roas-medium' : 'roas-poor';
          roasDisplay = roas + 'x';
        } else if (segment.cost === 0 && segment.conversionValue === 0) {
          roasDisplay = '0.00x';
          roasClass = 'roas-poor';
        }
      }
      
      tableHTML += `
        <tr class="${segmentClasses[segmentName]}">
          <td class="segment-name">${segmentName}</td>
          <td>${hasData ? segment.clicks.toLocaleString() : '-'}</td>
          <td>${hasData && segment.clicks > 0 ? '$' + avgCPC : hasData ? '$0.00' : '-'}</td>
          <td>${hasData ? '$' + segment.conversionValue.toFixed(2) : '-'}</td>
          <td class="${roasClass}" style="font-weight: 700;">${roasDisplay}</td>
        </tr>
      `;
    }
    
    tableHTML += `
          </tbody>
        </table>
        <div style="margin-top: 12px; font-size: 10px; color: #666; line-height: 1.4;">
          <strong>Note:</strong> This table shows how the product performs at different ranking positions. 
          Performance metrics are aggregated for all days when the product was in each position range.
          <br><br>
          <strong>Data Coverage:</strong> ${matchedDays} days with both ranking and performance data 
          (${avgRankingByDate.size} days with rankings, ${metricsByDate.size} days with metrics)
        </div>
      </div>
    `;
    
    container.innerHTML = tableHTML;
    
  } catch (error) {
    console.error('[Ranking Map] Error loading content:', error);
    container.innerHTML = `
      <div class="ranking-content">
        <div style="text-align: center; padding: 40px 20px; color: #666;">
          Error loading ranking data. Please try again.
        </div>
      </div>
    `;
  }
};

// Helper function to get the current project-specific table prefix
function getProjectTablePrefix() {
  const accountPrefix = window.currentAccount || 'acc1';
  const currentProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
  const prefix = `${accountPrefix}_pr${currentProjectNum}_`;
  console.log('[ProductMap] Using table prefix:', prefix);
  return prefix;
}

// Simple function to check if a table exists
async function checkTableExists(tableName) {
  return new Promise((resolve) => {
    const request = indexedDB.open('myAppDB');
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      
      // Check if projectData store exists
      if (!db.objectStoreNames.contains('projectData')) {
        db.close();
        resolve(false);
        return;
      }
      
      // Check if the table exists in projectData
      const transaction = db.transaction(['projectData'], 'readonly');
      const objectStore = transaction.objectStore('projectData');
      const getRequest = objectStore.get(tableName);
      
      getRequest.onsuccess = () => {
        const exists = getRequest.result !== undefined;
        db.close();
        resolve(exists);
      };
      
      getRequest.onerror = () => {
        db.close();
        resolve(false);
      };
    };
    
    request.onerror = () => {
      resolve(false);
    };
  });
}

// Function to normalize bucket value to CSS class
function normalizeBucketValue(bucketValue) {
  if (!bucketValue) return '';
  
  return bucketValue
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .trim();
}

// Function to get bucket badge HTML
function getBucketBadgeHTML(bucketData, bucketType = 'PROFITABILITY_BUCKET') {
  if (!bucketData) return { badgeHTML: '', containerClass: '' };
  
  let bucketValue = '';
  try {
    // Parse the JSON value
    const parsed = JSON.parse(bucketData[bucketType] || '{}');
    bucketValue = parsed.value || '';
  } catch (e) {
    // If not JSON, use raw value
    bucketValue = bucketData[bucketType] || '';
  }
  
  if (!bucketValue || bucketValue === '') return { badgeHTML: '', containerClass: '' };
  
  const normalizedClass = normalizeBucketValue(bucketValue);
  const displayText = bucketValue.substring(0, 20) + (bucketValue.length > 20 ? '...' : '');
  
  // For SELLERS bucket type and STANDARD value, don't show badge
  if (bucketType === 'SELLERS' && bucketValue.toLowerCase() === 'standard') {
    return { badgeHTML: '', containerClass: '' };
  }
  
  const badgeHTML = `<div class="bucket-badge ${normalizedClass}" title="${bucketValue}">${displayText}</div>`;
  
  // Generate container class for Sellers bucket
  let containerClass = '';
  if (bucketType === 'SELLERS') {
    containerClass = `sellers-${normalizedClass}`;
  }
  
  return { badgeHTML, containerClass };
}

// Function to get ROAS badge HTML
function getROASBadgeHTML(bucketData) {
  if (!bucketData || !bucketData['ROAS']) return '';
  
  const roasValue = parseFloat(bucketData['ROAS']) || 0;
  
  // Format ROAS value: round to 1 decimal, but remove .0
  let formattedROAS = roasValue.toFixed(1);
  if (formattedROAS.endsWith('.0')) {
    formattedROAS = formattedROAS.slice(0, -2);
  }
  
  // Determine color class based on ROAS value
  let roasClass = 'roas-unknown';
  if (roasValue >= 2.5) {
    roasClass = 'roas-good';
  } else if (roasValue >= 1.5) {
    roasClass = 'roas-medium';
  } else if (roasValue > 0) {
    roasClass = 'roas-poor';
  }
  
  return `<div class="roas-badge ${roasClass}">${formattedROAS}x</div>`;
}

// Function to get metrics panel HTML
function getMetricsPanelHTML(bucketData) {
  if (!bucketData) return '';
  
  // Check if we have any meaningful data
  const hasData = bucketData['Clicks'] > 0 || bucketData['Cost'] > 0 || bucketData['Conversions'] > 0 || bucketData['Impressions'] > 0;
  if (!hasData) return '';
  
  const formatNumber = (value, decimals = 0) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return { value: '—', class: 'zero-value' };
    
    // Ultra-compact formatting for 50px width
    if (num >= 1000000) {
      return { value: (num / 1000000).toFixed(1) + 'M', class: 'large-number' };
    } else if (num >= 10000) {
      return { value: Math.round(num / 1000) + 'k', class: 'large-number' };
    } else if (num >= 1000) {
      return { value: (num / 1000).toFixed(1) + 'k', class: '' };
    }
    return { value: decimals > 0 ? num.toFixed(decimals) : Math.round(num).toString(), class: '' };
  };
  
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num) || num === 0) return { value: '—', class: 'zero-value' };
    
    if (num >= 10000) {
      return { value: '$' + Math.round(num / 1000) + 'k', class: 'large-number' };
    } else if (num >= 1000) {
      return { value: '$' + (num / 1000).toFixed(1) + 'k', class: '' };
    } else if (num >= 100) {
      return { value: '$' + Math.round(num), class: '' };
    }
    return { value: '$' + num.toFixed(0), class: '' };
  };
  
  const getTrend = (current, previous) => {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    
    if (prev === 0 && curr === 0) return { arrow: '', class: 'trend-neutral', value: '' };
    if (prev === 0 && curr > 0) return { arrow: '↑', class: 'trend-up', value: '+' };
    if (curr === 0 && prev > 0) return { arrow: '↓', class: 'trend-down', value: '-100%' };
    
    const change = ((curr - prev) / prev) * 100;
    
    if (Math.abs(change) < 0.1) return { arrow: '', class: 'trend-neutral', value: '0%' };
    
    let formattedChange;
    if (Math.abs(change) >= 100) {
      formattedChange = Math.round(change) + '%';
    } else {
      formattedChange = Math.abs(change).toFixed(0) + '%';
    }
    
    return {
      arrow: change > 0 ? '↑' : '↓',
      class: change > 0 ? 'trend-up' : 'trend-down',
      value: formattedChange
    };
  };
  
  // Calculate metrics
  const ctr = bucketData['Impressions'] > 0 ? (bucketData['Clicks'] / bucketData['Impressions'] * 100) : 0;
  const prevCtr = bucketData['prev_Impressions'] > 0 ? (bucketData['prev_Clicks'] / bucketData['prev_Impressions'] * 100) : 0;
  
  const cpc = bucketData['Clicks'] > 0 ? (bucketData['Cost'] / bucketData['Clicks']) : 0;
  const prevCpc = bucketData['prev_Clicks'] > 0 ? (bucketData['prev_Cost'] / bucketData['prev_Clicks']) : 0;
  
  // Format current values
  const impr = formatNumber(bucketData['Impressions']);
  const clicks = formatNumber(bucketData['Clicks']);
  const ctrFormatted = formatNumber(ctr, 1);
  const cpcFormatted = formatCurrency(cpc);
  const cost = formatCurrency(bucketData['Cost']);
  const roas = formatNumber(bucketData['ROAS'], 1);
  
  // Get trends
  const imprTrend = getTrend(bucketData['Impressions'], bucketData['prev_Impressions']);
  const clicksTrend = getTrend(bucketData['Clicks'], bucketData['prev_Clicks']);
  const ctrTrend = getTrend(ctr, prevCtr);
  const cpcTrend = getTrend(cpc, prevCpc);
  const costTrend = getTrend(bucketData['Cost'], bucketData['prev_Cost']);
  const roasTrend = getTrend(bucketData['ROAS'], bucketData['prev_ROAS']);
  
  // Determine ROAS class
  let roasClass = '';
  if (bucketData['ROAS'] >= 2.5) roasClass = 'value-good';
  else if (bucketData['ROAS'] >= 1.5) roasClass = 'value-medium';
  else if (bucketData['ROAS'] > 0) roasClass = 'value-poor';
  
  return `
    <div class="metric-item-small">
      <div class="metric-label-small">Impr</div>
      <div class="metric-value-small ${impr.class}">${impr.value}</div>
      ${imprTrend.value ? `<div class="metric-trend-small ${imprTrend.class}">${imprTrend.arrow}${imprTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
    <div class="metric-item-small">
      <div class="metric-label-small">Clicks</div>
      <div class="metric-value-small ${clicks.class}">${clicks.value}</div>
      ${clicksTrend.value ? `<div class="metric-trend-small ${clicksTrend.class}">${clicksTrend.arrow}${clicksTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
    <div class="metric-item-small">
      <div class="metric-label-small">CTR</div>
      <div class="metric-value-small ${ctrFormatted.class}">${ctrFormatted.value}%</div>
      ${ctrTrend.value ? `<div class="metric-trend-small ${ctrTrend.class}">${ctrTrend.arrow}${ctrTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
    <div class="metric-item-small">
      <div class="metric-label-small">CPC</div>
      <div class="metric-value-small ${cpcFormatted.class}">${cpcFormatted.value}</div>
      ${cpcTrend.value ? `<div class="metric-trend-small ${cpcTrend.class}">${cpcTrend.arrow}${cpcTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
    <div class="metric-item-small">
      <div class="metric-label-small">Cost</div>
      <div class="metric-value-small ${cost.class}">${cost.value}</div>
      ${costTrend.value ? `<div class="metric-trend-small ${costTrend.class}">${costTrend.arrow}${costTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
    <div class="metric-item-small">
      <div class="metric-label-small">ROAS</div>
      <div class="metric-value-small ${roasClass} ${roas.class}">${roas.value}x</div>
      ${roasTrend.value ? `<div class="metric-trend-small ${roasTrend.class}">${roasTrend.arrow}${roasTrend.value}</div>` : '<div class="metric-trend-small"></div>'}
    </div>
  `;
}

// Function to create metrics popup
function createMetricsPopup(bucketData, bucketAveragesMap) {
  if (!bucketData) return null;
  
  const popup = document.createElement('div');
  popup.className = 'product-metrics-popup';
  
  // Store bucket data for tab switching
  popup.bucketData = bucketData;
  
  // Helper functions
  const formatNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '-';
    if (num === 0) return '0';
    if (decimals === 0) return num.toLocaleString();
    return num.toFixed(decimals);
  };
  
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '$0';
    return '$' + num.toLocaleString('en-US', { maximumFractionDigits: 0 });
  };
  
  const getTrend = (current, previous) => {
    const curr = parseFloat(current) || 0;
    const prev = parseFloat(previous) || 0;
    if (prev === 0) return { arrow: '', class: 'trend-neutral', value: '-' };
    
    const change = ((curr - prev) / prev) * 100;
    if (Math.abs(change) < 0.1) return { arrow: '±', class: 'trend-neutral', value: '0%' };
    
    return {
      arrow: change > 0 ? '▲' : '▼',
      class: change > 0 ? 'trend-up' : 'trend-down',
      value: Math.abs(change).toFixed(1) + '%'
    };
  };
  
  const getHealthScoreColor = (score) => {
    const s = parseInt(score) || 0;
    if (s >= 8) return '#28a745';
    if (s >= 6) return '#ffc107';
    if (s >= 4) return '#fd7e14';
    return '#dc3545';
  };
  
  const parseBucket = (bucketStr) => {
    try {
      return JSON.parse(bucketStr);
    } catch {
      return { value: bucketStr || 'N/A', explanation: '' };
    }
  };
  
  const parseSuggestions = (suggestionsStr) => {
    try {
      const parsed = JSON.parse(suggestionsStr);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  
  // Create trend HTML helper
  const createTrendHTML = (current, previous) => {
    const trend = getTrend(current, previous);
    if (trend.value === '-') return '';
    return `<div class="metric-trend ${trend.class}">${trend.arrow} ${trend.value}</div>`;
  };

  // Helper function to create comparison with averages
const createComparisonHTML = (currentValue, metricName, device) => {
  if (!bucketAveragesMap || bucketAveragesMap.size === 0) return '';
  
  // Get the average for this metric and device
  const deviceKey = device ? device.toUpperCase() : 'ALL';
  const avgKey = `${deviceKey}|${metricName}`;
  const avgValue = bucketAveragesMap.get(avgKey);
  
  if (avgValue === undefined || avgValue === null) return '';
  
  const current = parseFloat(currentValue) || 0;
  const average = parseFloat(avgValue) || 0;
  
  if (average === 0) return '';
  
  // Calculate percentage difference from average
  const diff = current - average;
  const percentDiff = ((current - average) / average) * 100;
  
  let comparisonClass = 'comparison-neutral';
  let arrow = '±';
  
  if (diff > 0.1) {
    comparisonClass = 'comparison-better';
    arrow = '▲';
  } else if (diff < -0.1) {
    comparisonClass = 'comparison-worse';
    arrow = '▼';
  }
  
  // Format the comparison text
  const comparisonText = `vs avg: ${average.toFixed(1)}% (${arrow}${Math.abs(percentDiff).toFixed(0)}%)`;
  
  return `<div class="funnel-comparison ${comparisonClass}">${comparisonText}</div>`;
};
  
  const profitability = parseBucket(bucketData['PROFITABILITY_BUCKET']);
  const funnelStage = parseBucket(bucketData['FUNNEL_STAGE_BUCKET']);
  const investment = parseBucket(bucketData['INVESTMENT_BUCKET']);
  const customTier = parseBucket(bucketData['CUSTOM_TIER_BUCKET']);
  const suggestions = parseSuggestions(bucketData['SUGGESTIONS_BUCKET']);

  console.log('[Popup] BucketData device:', bucketData['Device']);
  
  const fullTitle = bucketData['Product Title'] || 'Unknown Product';
  const sellers = bucketData['SELLERS'] || 'Standard';
  
  // Create header
  const headerHTML = `
    <div class="popup-header">
      <div class="header-title">${fullTitle}</div>
      ${sellers !== 'Standard' && sellers !== 'N/A' ? `<div class="sellers-badge sellers-${sellers.toLowerCase().replace(/\s+/g, '-')}">${sellers}</div>` : ''}
    </div>
  `;
  
  // Create tabs
  const tabsHTML = `
    <div class="popup-tabs">
      <button class="popup-tab active" data-tab="performance">PERFORMANCE</button>
      <button class="popup-tab" data-tab="campaigns">CAMPAIGNS</button>
      <button class="popup-tab" data-tab="ranking">RANKING MAP</button>
    </div>
  `;
  
  // Create performance content (current content)
  const performanceContent = `
    <div class="popup-tab-content active" data-content="performance">
      <!-- ROAS Hero Section -->
      <div class="roas-hero-section">
        <div class="roas-metrics">
          <div class="roas-main">
            <div class="roas-label">ROAS</div>
            <div class="roas-value ${bucketData['ROAS'] >= 2.5 ? 'roas-good' : bucketData['ROAS'] >= 1.5 ? 'roas-medium' : 'roas-poor'}">
              ${formatNumber(bucketData['ROAS'], 1)}x
            </div>
            ${createTrendHTML(bucketData['ROAS'], bucketData['prev_ROAS'])}
          </div>
          <div class="roas-supporting">
            <div class="supporting-metric">
              <div class="supporting-label">Revenue</div>
              <div class="supporting-value">${formatCurrency(bucketData['ConvValue'])}</div>
              ${createTrendHTML(bucketData['ConvValue'], bucketData['prev_ConvValue'])}
            </div>
            <div class="supporting-metric">
              <div class="supporting-label">Conversions</div>
              <div class="supporting-value">${formatNumber(bucketData['Conversions'], 0)}</div>
              ${createTrendHTML(bucketData['Conversions'], bucketData['prev_Conversions'])}
            </div>
          </div>
        </div>
        <div class="health-confidence-container">
          <div class="health-item">
            <div class="health-label">Health</div>
            <div class="health-value" style="color: ${getHealthScoreColor(bucketData['HEALTH_SCORE'])}">
              ${bucketData['HEALTH_SCORE'] || '-'}/10
            </div>
          </div>
          <div class="confidence-item">
            <div class="confidence-label">Confidence</div>
            <div class="confidence-value confidence-${(bucketData['Confidence_Level'] || 'Low').toLowerCase()}">
              ${bucketData['Confidence_Level'] || 'Low'}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Performance Metrics -->
      <div class="metric-section">
        <div class="section-title">Performance Metrics</div>
        <div class="metrics-grid four-col">
          <div class="metric-item">
            <span class="metric-label">Impressions</span>
            <div class="metric-value">${formatNumber(bucketData['Impressions'], 0)}</div>
            ${createTrendHTML(bucketData['Impressions'], bucketData['prev_Impressions'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">Clicks</span>
            <div class="metric-value">${formatNumber(bucketData['Clicks'], 0)}</div>
            ${createTrendHTML(bucketData['Clicks'], bucketData['prev_Clicks'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CTR</span>
            <div class="metric-value">${formatNumber(bucketData['CTR'], 2)}%</div>
            ${createTrendHTML(bucketData['CTR'], bucketData['prev_CTR'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CVR</span>
            <div class="metric-value">${formatNumber(bucketData['CVR'], 2)}%</div>
            ${createTrendHTML(bucketData['CVR'], bucketData['prev_CVR'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">Cost</span>
            <div class="metric-value">${formatCurrency(bucketData['Cost'])}</div>
            ${createTrendHTML(bucketData['Cost'], bucketData['prev_Cost'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CPC</span>
            <div class="metric-value">${formatCurrency(bucketData['Avg CPC'])}</div>
            ${createTrendHTML(bucketData['Avg CPC'], bucketData['prev_Avg CPC'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">CPA</span>
            <div class="metric-value">${formatCurrency(bucketData['CPA'])}</div>
            ${createTrendHTML(bucketData['CPA'], bucketData['prev_CPA'])}
          </div>
          <div class="metric-item">
            <span class="metric-label">AOV</span>
            <div class="metric-value">${formatCurrency(bucketData['AOV'])}</div>
            ${createTrendHTML(bucketData['AOV'], bucketData['prev_AOV'])}
          </div>
        </div>
      </div>
      
      <!-- Funnel & Classifications -->
      <div class="metric-section">
        <div class="section-title">Funnel & Classifications</div>
        <div class="funnel-classifications-container">
<div class="funnel-rates">
  <div class="funnel-item">
    <div class="funnel-icon">🛒</div>
    <div class="funnel-details">
      <div class="funnel-label">Cart</div>
      <div class="funnel-value">${formatNumber(bucketData['Cart Rate'], 1)}%</div>
      ${createComparisonHTML(bucketData['Cart Rate'], 'Cart Rate', bucketData['Device'])}
    </div>
  </div>
  <div class="funnel-arrow">→</div>
  <div class="funnel-item">
    <div class="funnel-icon">💳</div>
    <div class="funnel-details">
      <div class="funnel-label">Checkout</div>
      <div class="funnel-value">${formatNumber(bucketData['Checkout Rate'], 1)}%</div>
      ${createComparisonHTML(bucketData['Checkout Rate'], 'Checkout Rate', bucketData['Device'])}
    </div>
  </div>
  <div class="funnel-arrow">→</div>
  <div class="funnel-item">
    <div class="funnel-icon">✓</div>
    <div class="funnel-details">
      <div class="funnel-label">Purchase</div>
      <div class="funnel-value">${formatNumber(bucketData['Purchase Rate'], 1)}%</div>
      ${createComparisonHTML(bucketData['Purchase Rate'], 'Purchase Rate', bucketData['Device'])}
    </div>
  </div>
</div>
          
          <div class="classifications-grid">
            <div class="classification-item">
              <div class="classification-label">Profitability</div>
              <div class="classification-value">${profitability.value}</div>
              ${profitability.explanation ? `<div class="classification-explanation">${profitability.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Investment</div>
              <div class="classification-value">${investment.value}</div>
              ${investment.explanation ? `<div class="classification-explanation">${investment.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Funnel Stage</div>
              <div class="classification-value">${funnelStage.value}</div>
              ${funnelStage.explanation ? `<div class="classification-explanation">${funnelStage.explanation}</div>` : ''}
            </div>
            <div class="classification-item">
              <div class="classification-label">Custom Tier</div>
              <div class="classification-value">${customTier.value}</div>
              ${customTier.explanation ? `<div class="classification-explanation">${customTier.explanation}</div>` : ''}
            </div>
          </div>
        </div>
      </div>
      
      ${suggestions.length > 0 ? `
      <!-- AI Recommendations -->
      <div class="metric-section recommendations-section">
        <div class="section-title">AI Recommendations (${suggestions.length})</div>
        <div class="recommendations-list">
          ${suggestions.map(suggestion => `
            <div class="recommendation-item priority-${suggestion.priority?.toLowerCase()}">
              <div class="recommendation-header">
                <div class="recommendation-priority">${suggestion.priority || 'Medium'}</div>
                <div class="recommendation-action">${suggestion.suggestion}</div>
              </div>
              ${suggestion.context ? `<div class="recommendation-context">${suggestion.context}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}
    </div>
  `;
  
  // Create campaigns content placeholder
  const campaignsContent = `
    <div class="popup-tab-content" data-content="campaigns">
      <div class="campaigns-loading">Loading campaign data...</div>
    </div>
  `;
  
  // Create ranking content placeholder
  const rankingContent = `
    <div class="popup-tab-content" data-content="ranking">
      <div class="ranking-loading">Loading ranking map...</div>
    </div>
  `;
  
  // Assemble popup
  popup.innerHTML = headerHTML + tabsHTML + '<div class="popup-content">' + 
    performanceContent + campaignsContent + rankingContent + '</div>';
  
  // Add tab switching functionality
  setTimeout(() => {
    const tabs = popup.querySelectorAll('.popup-tab');
    const contents = popup.querySelectorAll('.popup-tab-content');
    
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        const targetTab = this.getAttribute('data-tab');
        
        // Update active states
        tabs.forEach(t => t.classList.remove('active'));
        contents.forEach(c => c.classList.remove('active'));
        
        this.classList.add('active');
        const targetContent = popup.querySelector(`[data-content="${targetTab}"]`);
        if (targetContent) {
          targetContent.classList.add('active');
          
          // Load content for campaigns and ranking tabs
          if (targetTab === 'campaigns' && !targetContent.hasAttribute('data-loaded')) {
            loadCampaignsTabContent(popup, bucketData);
            targetContent.setAttribute('data-loaded', 'true');
          } else if (targetTab === 'ranking' && !targetContent.hasAttribute('data-loaded')) {
            window.loadRankingTabContent(popup, bucketData);
            targetContent.setAttribute('data-loaded', 'true');
          }
        }
      });
    });
  }, 0);

    // Add hover handlers to the popup itself to keep it open
  popup.addEventListener('mouseenter', function() {
    // Keep popup visible
    this.classList.add('visible');
  });

  popup.addEventListener('mouseleave', function() {
    // Hide popup when mouse leaves
    const self = this;
    setTimeout(() => {
      if (!self.matches(':hover')) {
        self.classList.remove('visible');
        setTimeout(() => {
          // Clean up any charts before removing popup
          if (self.campaignCharts) {
            self.campaignCharts.forEach(chart => {
              try { chart.destroy(); } catch(e) {}
            });
            self.campaignCharts = [];
          }
          self.remove();
// Remove global reference if it exists
          if (window.currentMetricsPopup === self) {
            window.currentMetricsPopup = null;
          }
        }, 200);
      }
    }, 100);
  });
  
  return popup;
}

// Helper function to load product metrics data from IndexedDB
async function loadProductMetricsData(productTitle) {
  try {
    // Get project-specific table prefix
    const tablePrefix = getProjectTablePrefix();
    const tableName = `${tablePrefix}googleSheets_productPerformance`;
    
    // Try to access through the parent database first
    const myAppDb = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open myAppDB'));
    });
    
    // Check if projectData exists in myAppDB
    if (myAppDb.objectStoreNames.contains('projectData')) {
      try {
        const transaction = myAppDb.transaction(['projectData'], 'readonly');
        const objectStore = transaction.objectStore('projectData');
        
        // Try to get the specific key
        const getRequest = objectStore.get(tableName);
        
        const data = await new Promise((resolve, reject) => {
          getRequest.onsuccess = () => resolve(getRequest.result);
          getRequest.onerror = () => reject(getRequest.error);
        });
        
        if (data) {
          // Process the data
          let actualData;
          if (data.data && Array.isArray(data.data)) {
            actualData = data.data;
          } else if (Array.isArray(data)) {
            actualData = data;
          } else {
            myAppDb.close();
            return null;
          }
          
          // Filter for the product
          const productData = actualData.filter(row => 
            row['Product Title'] === productTitle
          );
          
          if (productData.length > 0) {
            const campaignNames = [...new Set(productData.map(row => row['Campaign Name']))].filter(Boolean);
            const channelTypes = [...new Set(productData.map(row => row['Channel Type']))].filter(Boolean);
            
            myAppDb.close();
            
            return {
              productData,
              campaignNames,
              channelTypes
            };
          }
        }
      } catch (e) {
        console.log('[loadProductMetricsData] Error accessing projectData:', e);
      }
    }
    
    myAppDb.close();
    return null;
    
  } catch (error) {
    console.error('[loadProductMetricsData] Error:', error);
    return null;
  }
}

// Function to load campaigns tab content
async function loadCampaignsTabContent(popup, bucketData) {
  const container = popup.querySelector('[data-content="campaigns"]');
  if (!container) return;
  
  try {
    // Get product title for data loading
    const productTitle = bucketData['Product Title'];
    
    // Load data using the helper function
    const result = await loadProductMetricsData(productTitle);
    
    if (!result || !result.productData || result.productData.length === 0) {
      container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No campaign data available</div>';
      return;
    }
    
    const productData = result.productData;
    
// Get date range - use the same approach as google_ads.js
    const daysToShow = 30; // Default to 30 days for now
    const endDate = moment().startOf('day');
    const startDate = endDate.clone().subtract(daysToShow - 1, 'days');
    
    console.log('[Tab] Using date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
    
// Get device from bucketData
    const deviceFilter = bucketData['Device'] || null;
    
    // Filter by date range AND device
    const filteredData = productData.filter(row => {
      if (!row.Date) return false;
      const rowDate = moment(row.Date, 'YYYY-MM-DD');
      const dateMatch = rowDate.isBetween(startDate, endDate, 'day', '[]');
      
      // Apply device filter if available
      if (deviceFilter && deviceFilter !== 'All') {
        return dateMatch && row.Device === deviceFilter;
      }
      
      return dateMatch;
    });

        // Debug logging
    console.log('[Campaigns Tab] Product:', productTitle);
    console.log('[Campaigns Tab] Device filter:', deviceFilter || 'All devices');
    console.log('[Campaigns Tab] Total product data:', productData.length);
    console.log('[Campaigns Tab] Filtered data:', filteredData.length);
    console.log('[Campaigns Tab] Date range:', startDate.format('YYYY-MM-DD'), 'to', endDate.format('YYYY-MM-DD'));
    
    if (filteredData.length === 0) {
      // Check if data exists outside the date range
      const allDates = productData.map(row => row.Date).filter(d => d);
      if (allDates.length > 0) {
        const minDate = moment.min(allDates.map(d => moment(d)));
        const maxDate = moment.max(allDates.map(d => moment(d)));
        console.log('[Campaigns Tab] Data date range in DB:', minDate.format('YYYY-MM-DD'), 'to', maxDate.format('YYYY-MM-DD'));
      }
    }
    
// Helper function to parse currency values
    const parseCurrency = (value) => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        // Remove dollar sign and commas, then parse
        return parseFloat(value.replace(/[$,]/g, '')) || 0;
      }
      return 0;
    };
    
    // Aggregate by campaign
    const campaignData = {};
    filteredData.forEach(row => {
      const campaign = row['Campaign Name'] || 'Unknown';
      if (!campaignData[campaign]) {
        campaignData[campaign] = {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0
        };
      }
      
      // Handle both numeric and string values
      campaignData[campaign].impressions += parseFloat(row.Impressions) || 0;
      campaignData[campaign].clicks += parseFloat(row.Clicks) || 0;
      campaignData[campaign].cost += parseCurrency(row.Cost);
      campaignData[campaign].conversions += parseFloat(row.Conversions) || 0;
      campaignData[campaign].conversionValue += parseCurrency(row['Conversion Value']); // Note: capital V
    });

        // Add debug logging here
    console.log('[Campaigns Tab] Campaign data:', campaignData);
    console.log('[Campaigns Tab] Number of campaigns:', Object.keys(campaignData).length);
    
    // Log the first few rows to see data structure
    if (filteredData.length > 0) {
      console.log('[Campaigns Tab] Sample data row:', filteredData[0]);
    }
    
    // Calculate totals
    const totals = {
      cost: 0,
      conversionValue: 0,
      roas: 0
    };
    
    Object.values(campaignData).forEach(data => {
      totals.cost += data.cost;
      totals.conversionValue += data.conversionValue;
    });
    
    totals.roas = totals.cost > 0 ? totals.conversionValue / totals.cost : 0;
    
    // Create HTML content
let html = `
      <div class="campaigns-content">
        ${deviceFilter && deviceFilter !== 'All' ? `<div style="text-align: center; margin-bottom: 10px; font-size: 11px; color: #666;">Showing data for: ${deviceFilter}</div>` : ''}
        <!-- Pie Charts Section -->
        <div class="campaigns-charts-section">
          <div class="campaigns-charts-grid">
            <div class="campaign-chart-item">
              <div id="popup-cost-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">Cost</div>
              <div class="campaign-chart-value">$${totals.cost.toFixed(2)}</div>
            </div>
            <div class="campaign-chart-item">
              <div id="popup-revenue-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">Conv. Value</div>
              <div class="campaign-chart-value">$${totals.conversionValue.toFixed(2)}</div>
            </div>
            <div class="campaign-chart-item">
              <div id="popup-roas-chart" class="campaign-chart-container"></div>
              <div class="campaign-chart-label">ROAS</div>
              <div class="campaign-chart-value">${totals.roas.toFixed(2)}x</div>
            </div>
          </div>
        </div>
        
        <!-- Table Section -->
        <div class="campaigns-table-section">
          <table class="campaigns-metrics-table">
            <thead>
              <tr>
                <th>Campaign</th>
                <th>Cost</th>
                <th>Conv. Value</th>
                <th>ROAS</th>
              </tr>
            </thead>
            <tbody>
    `;
    
    // Sort campaigns by cost (descending)
    const sortedCampaigns = Object.entries(campaignData)
      .sort((a, b) => b[1].cost - a[1].cost)
      .slice(0, 10); // Top 10 campaigns
    
    sortedCampaigns.forEach(([campaign, data]) => {
      const roas = data.cost > 0 ? data.conversionValue / data.cost : 0;
      html += `
        <tr>
          <td class="campaign-name">${campaign}</td>
          <td>$${data.cost.toFixed(2)}</td>
          <td>$${data.conversionValue.toFixed(2)}</td>
          <td class="${roas >= 2.5 ? 'roas-good' : roas >= 1.5 ? 'roas-medium' : 'roas-poor'}">${roas.toFixed(2)}x</td>
        </tr>
      `;
    });
    
    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;
    
    container.innerHTML = html;

    // Debug - verify HTML was set
    console.log('[Tab] Container HTML length:', container.innerHTML.length);
    console.log('[Tab] Container visible:', container.style.display !== 'none');
    
// Render pie charts
    setTimeout(() => {
      renderCampaignPieCharts(campaignData, popup);
    }, 100);
    
  } catch (error) {
    console.error('Error loading campaigns data:', error);
    container.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">Error loading campaign data</div>';
  }
}

// Function to render campaign pie charts
function renderCampaignPieCharts(campaignData, popupElement) {
  const metrics = [
    { id: 'popup-cost-chart', key: 'cost' },
    { id: 'popup-revenue-chart', key: 'conversionValue' },
    { id: 'popup-roas-chart', key: 'roas' }
  ];
  
  // Define colors for campaigns
  const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'];
  
  metrics.forEach(metric => {
    const container = document.getElementById(metric.id);
    if (!container) return;
    
    const series = [];
    const labels = [];
    
    // Sort campaigns and get top 5
    const sortedCampaigns = Object.entries(campaignData)
      .sort((a, b) => b[1][metric.key === 'roas' ? 'cost' : metric.key] - a[1][metric.key === 'roas' ? 'cost' : metric.key])
      .slice(0, 5);
    
    sortedCampaigns.forEach(([campaign, data]) => {
      if (metric.key === 'roas') {
        const roas = data.cost > 0 ? data.conversionValue / data.cost : 0;
        series.push(roas);
      } else {
        series.push(data[metric.key]);
      }
      labels.push(campaign.length > 20 ? campaign.substring(0, 20) + '...' : campaign);
    });
    
    // Create pie chart using ApexCharts
    const options = {
      series: series,
      chart: {
        type: 'pie',
        height: 120,
        width: 120
      },
      labels: labels,
      colors: colors,
      legend: {
        show: false
      },
      dataLabels: {
        enabled: true,
        formatter: function(val) {
          return val > 5 ? Math.round(val) + '%' : '';
        }
      },
      tooltip: {
        y: {
          formatter: function(value) {
            if (metric.key === 'roas') {
              return value.toFixed(2) + 'x';
            }
            return '$' + value.toFixed(2);
          }
        }
      }
    };
    
    const chart = new ApexCharts(container, options);
    chart.render();
    
    // Store reference for cleanup
    if (!popupElement.campaignCharts) {
      popupElement.campaignCharts = [];
    }
    popupElement.campaignCharts.push(chart);
  });
}

function createCompDetails(companyData, index) {
    console.log(`[createCompDetails] Company ${index}:`, {
    company: companyData.company,
    rank: companyData.rank,
    top40: companyData.top40,
    top40Trend: companyData.top40Trend,
    numProducts: companyData.numProducts,
    numOnSale: companyData.numOnSale,
    improvedCount: companyData.improvedCount,
    newCount: companyData.newCount,
    declinedCount: companyData.declinedCount,
    hasHistoricalData: !!companyData.historical_data
  });
  const container = document.createElement('div');
  container.className = 'comp-details';
  
  // Helper function for rank coloring
  const colorRank = (rank) => {
    const r = parseFloat(rank);
    if (isNaN(r) || r <= 0) return "";
    if (r === 1) return "range-green";
    if (r <= 3) return "range-yellow";
    if (r <= 5) return "range-orange";
    return "range-red";
  };

  // Rank badge (top-left)
  const rankBadge = document.createElement('div');
  rankBadge.className = `company-rank ${colorRank(companyData.rank)}`;
  rankBadge.textContent = `#${companyData.rank || '-'}`;
  container.appendChild(rankBadge);

  // Market share badge (top-right)
  const marketShareBadge = document.createElement('div');
  marketShareBadge.className = 'market-share-badge';
  const marketShare = (companyData.top40 || 0).toFixed(1);
  const trend = companyData.top40Trend || 0;
  const trendArrow = trend > 0 ? '▲' : trend < 0 ? '▼' : '±';
  const trendColor = trend > 0 ? '#4CAF50' : trend < 0 ? '#F44336' : '#999';
  marketShareBadge.innerHTML = `
    <span style="color: ${trendColor}">${marketShare}%</span>
    <span style="color: ${trendColor}; font-size: 10px;">${trendArrow}${Math.abs(trend).toFixed(1)}%</span>
  `;
  container.appendChild(marketShareBadge);

  // Company logo
  const logoDiv = document.createElement('div');
  logoDiv.className = 'company-logo';
  const logoImg = document.createElement('img');
  // Placeholder logo - replace with actual URLs later
  logoImg.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZTBlMGUwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgdGV4dC1hbmNob3I9Im1pZGRsZSI+TG9nbzwvdGV4dD48L3N2Zz4=';
  logoImg.alt = companyData.company || 'Company Logo';
  logoDiv.appendChild(logoImg);
  container.appendChild(logoDiv);

  // Company name
  const nameDiv = document.createElement('div');
  nameDiv.className = 'company-name';
  nameDiv.textContent = companyData.company || 'Unknown';
  container.appendChild(nameDiv);

  // Products stats
  const productsStats = document.createElement('div');
  productsStats.className = 'products-stats';
  const totalProducts = companyData.numProducts || 0;
  const onSalePercent = companyData.numOnSale || 0;
  productsStats.innerHTML = `
    <div><strong>${totalProducts}</strong> products</div>
    <div><strong>${onSalePercent}%</strong> on sale</div>
  `;
  container.appendChild(productsStats);

  // Trend stats (Improved/NEW/Declined)
  const trendStats = document.createElement('div');
  trendStats.className = 'trend-stats';
  trendStats.innerHTML = `
    <div class="trend-stat">
      <div class="count" style="color: #4CAF50">${companyData.improvedCount || 0}</div>
      <div>Improved</div>
    </div>
    <div class="trend-stat">
      <div class="count" style="color: #2196F3">${companyData.newCount || 0}</div>
      <div>NEW</div>
    </div>
    <div class="trend-stat">
      <div class="count" style="color: #F44336">${companyData.declinedCount || 0}</div>
      <div>Declined</div>
    </div>
  `;
  container.appendChild(trendStats);

  // Rank history (mini version)
  if (companyData.historical_data && companyData.historical_data.length > 0) {
    const rankHistory = document.createElement('div');
    rankHistory.className = 'rank-history-mini';
    
    // Get last 7 days of data, show max 8 boxes (2 rows of 4)
    const recentDays = companyData.historical_data.slice(-8);
    
    recentDays.forEach(day => {
      const rankBox = document.createElement('div');
      rankBox.className = `rank-box-mini ${colorRank(day.rank)}`;
      rankBox.textContent = day.rank || '-';
      rankHistory.appendChild(rankBox);
    });
    
    container.appendChild(rankHistory);
  }

  // Store hidden data for future use
  container.dataset.serpData = JSON.stringify(companyData.serpData || {});
  container.dataset.pricingData = JSON.stringify(companyData.pricingData || {});

  return container; // IMPORTANT: Return the container!
}

function prepareCompanySerpsStatsData() {
  console.log('[ProductMap] Preparing company SERP stats data...');
  
  // Use companyStatsData as the source (same as company-details)
  if (!window.companyStatsData || window.companyStatsData.length === 0) {
    console.warn('[ProductMap] No companyStatsData available');
    return [];
  }
  
  const companyStatsMap = new Map();
  
  // Process each company's data
  window.companyStatsData.forEach(item => {
    if (!item.source || !item.q || !item.location_requested || !item.device) return;
    
    const key = `${item.source}_${item.q}_${item.location_requested}_${item.device}`;
    
    if (!companyStatsMap.has(key)) {
      // Calculate metrics from historical_data
      let avgRank = 999;
      let avgMarketShare = 0;
      let marketShareTrend = 0;
      let avgProducts = 0;
      let avgOnSale = 0;
      
      if (item.historical_data && item.historical_data.length > 0) {
        // Get last 7 days for current metrics
        const last7Days = item.historical_data.slice(-7);
        
        // Calculate average rank from avg_position
        const positions = last7Days
          .filter(day => day.avg_position != null)
          .map(day => parseFloat(day.avg_position));
        
        if (positions.length > 0) {
          avgRank = Math.round(positions.reduce((a, b) => a + b) / positions.length);
        }
        
        // Calculate average market share (multiply by 100 for percentage)
        const marketShares = last7Days
          .filter(day => day.market_share != null)
          .map(day => parseFloat(day.market_share) * 100);
        
        if (marketShares.length > 0) {
          avgMarketShare = marketShares.reduce((a, b) => a + b) / marketShares.length;
        }
        
        // Calculate trend (last 7 days vs previous 7 days)
        if (item.historical_data.length >= 14) {
          const prev7Days = item.historical_data.slice(-14, -7);
          const prevShares = prev7Days
            .filter(day => day.market_share != null)
            .map(day => parseFloat(day.market_share) * 100);
          
          if (prevShares.length > 0) {
            const prevAvg = prevShares.reduce((a, b) => a + b) / prevShares.length;
            marketShareTrend = avgMarketShare - prevAvg;
          }
        }
        
        // Calculate product metrics
        const productCounts = last7Days
          .filter(day => day.unique_products != null)
          .map(day => parseFloat(day.unique_products));
        
        const onSaleCounts = last7Days
          .filter(day => day.un_products_on_sale != null)
          .map(day => parseFloat(day.un_products_on_sale));
        
        if (productCounts.length > 0) {
          avgProducts = productCounts.reduce((a, b) => a + b) / productCounts.length;
        }
        
        if (onSaleCounts.length > 0) {
          avgOnSale = onSaleCounts.reduce((a, b) => a + b) / onSaleCounts.length;
        }
      }
      
      companyStatsMap.set(key, {
        searchTerm: item.q,
        location: item.location_requested,
        device: item.device,
        rank: avgRank,
        company: item.source || 'Unknown',
        top40: parseFloat(avgMarketShare.toFixed(1)),
        top40Trend: parseFloat(marketShareTrend.toFixed(1)),
        numProducts: Math.round(avgProducts),
        numOnSale: avgProducts > 0 ? Math.round((avgOnSale / avgProducts) * 100) : 0,
        improvedCount: 0,
        newCount: 0,
        declinedCount: 0,
        historical_data: item.historical_data || []
      });
    }
  });
  
  window.company_serp_stats = Array.from(companyStatsMap.values());
  console.log(`[ProductMap] Prepared ${window.company_serp_stats.length} company stats`);
  
  // Debug log to verify data
  if (window.company_serp_stats.length > 0) {
    console.log('[ProductMap] Sample company stat:', {
      company: window.company_serp_stats[0].company,
      rank: window.company_serp_stats[0].rank,
      top40: window.company_serp_stats[0].top40,
      top40Trend: window.company_serp_stats[0].top40Trend
    });
  }
  
  return window.company_serp_stats;
}

async function renderProductMapTable() {
  console.log("[renderProductMapTable] Starting render");
  
  // Always refresh company data when rendering the table
  prepareCompanySerpsStatsData();
// Check current mode
const currentMode = document.querySelector('#modeSelector .mode-option.active')?.getAttribute('data-mode') || 'products';
document.body.classList.remove('mode-products', 'mode-companies');
document.body.classList.add(`mode-${currentMode}`);
  
   const useLatestRecordAsEndDate = false;
      let hoverTimeout = null;
    let currentPopup = null;
    console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
    console.log("[renderProductMapTable] Starting to build product map table");
    const container = document.getElementById("productMapPage");
    if (!container) return;
    
// Simple check for Google Ads integration
let googleAdsEnabled = false;
let accountNumber = null;

// Get the project-specific table prefix
const tablePrefix = getProjectTablePrefix();

// Check for config table with the new naming convention
const configExists = await checkTableExists(`${tablePrefix}googleSheets_config`);
if (configExists) {
  googleAdsEnabled = true;
  // Extract account number from prefix
  accountNumber = parseInt(tablePrefix.match(/acc(\d+)_/)?.[1]) || 1;
} else {
  // Fallback: check old naming convention
  for (let i = 1; i <= 10; i++) {
    const oldConfigExists = await checkTableExists(`acc${i}_googleSheets_config`);
    if (oldConfigExists) {
      googleAdsEnabled = true;
      accountNumber = i;
      break;
    }
  }
}

console.log('[ProductMap] Google Ads enabled:', googleAdsEnabled, 'Account:', accountNumber, 'Prefix:', tablePrefix);

// Load search terms statistics if enabled
let searchTermsStatsMap = new Map();
if (googleAdsEnabled) {
  searchTermsStatsMap = await loadSearchTermsStats(tablePrefix);
  console.log(`[ProductMap] Search terms stats loaded: ${searchTermsStatsMap.size} entries`);
}

// Load bucket averages if enabled
let bucketAveragesMap = new Map();
if (googleAdsEnabled) {
  bucketAveragesMap = await loadBucketAverages(tablePrefix);
  console.log(`[ProductMap] Bucket averages loaded: ${bucketAveragesMap.size} entries`);
}
    
// Load bucket data if enabled
let bucketDataMap = new Map();
if (googleAdsEnabled) {
  const bucketTableName = `${tablePrefix}googleSheets_productBuckets_30d`;
  const bucketTableExists = await checkTableExists(bucketTableName);
  
  if (bucketTableExists) {
    // Get the bucket data from projectData store
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    // Get data from projectData store
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(bucketTableName);
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data) {
          console.log(`[ProductMap] Bucket data structure:`, result.data[0]); // Log first item to see structure
          
          result.data.forEach(product => {
            if (product['Product Title'] && product['Campaign Name'] === 'All') {
              // Normalize device value to uppercase for consistency
              const deviceNormalized = (product['Device'] || '').toUpperCase();
              const key = `${product['Product Title'].toLowerCase()}|${deviceNormalized}`;
              bucketDataMap.set(key, product);
              
              // Debug log for first few entries
              if (bucketDataMap.size <= 3) {
                console.log(`[ProductMap] Bucket entry: ${key}`, {
                  profitability: product['PROFITABILITY_BUCKET'],
                  device: product['Device'],
                  campaign: product['Campaign Name']
                });
              }
            }
          });
        }
        console.log(`[ProductMap] Loaded ${bucketDataMap.size} product bucket entries (filtered for Campaign='All')`);
        resolve();
      };
      
      getRequest.onerror = () => {
        console.error('[ProductMap] Error getting bucket data');
        resolve();
      };
    });
    
    db.close();
  }
}

// Load company statistics data
const companyStats = await loadCompanyStatsData();
console.log(`[ProductMap] Company stats loaded: ${companyStats.length} entries`);
  
    // Setup container with fixed height and scrolling
container.innerHTML = `
  <div id="productMapContainer" style="width: 100%; height: calc(100vh - 150px); overflow-y: auto; position: relative;">
    <div class="view-switcher">
      <button id="viewProducts" class="active">Products</button>
      <button id="viewCharts">Charts</button>
    </div>
<div class="all-products-toggle-container">
      <label class="all-products-toggle-label">All Products</label>
      <label class="all-products-toggle">
        <input type="checkbox" id="allProductsToggle">
        <span class="all-products-slider"></span>
      </label>
    </div>
    <div class="metrics-toggle-container">
      <label class="metrics-toggle-label">Google Ads Metrics</label>
      <label class="metrics-toggle">
        <input type="checkbox" id="metricsToggle">
        <span class="metrics-slider"></span>
      </label>
    </div>
   <select id="bucketTypeSelector" class="bucket-type-selector">
      <option value="PROFITABILITY_BUCKET">Profitability</option>
      <option value="FUNNEL_STAGE_BUCKET">Funnel Stage</option>
      <option value="INVESTMENT_BUCKET">Investment</option>
      <option value="CUSTOM_TIER_BUCKET">Custom Tier</option>
      <option value="SELLERS" selected>Sellers</option>
    </select>
    <button id="fullscreenToggle" class="fullscreen-toggle">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
      </svg>
      Full Screen
    </button>
  </div>
`;
    
    // Create fullscreen overlay container (hidden initially)
    let fullscreenOverlay = document.getElementById('productMapFullscreenOverlay');
    if (!fullscreenOverlay) {
      fullscreenOverlay = document.createElement('div');
      fullscreenOverlay.id = 'productMapFullscreenOverlay';
      fullscreenOverlay.className = 'product-map-fullscreen-overlay';
      document.body.appendChild(fullscreenOverlay);
    }
    
    // Add fullscreen toggle functionality
    document.getElementById("fullscreenToggle").addEventListener("click", function() {
      // Get the current table
      const table = document.querySelector("#productMapContainer .product-map-table");
      if (!table) {
        console.warn("No product map table found to display in fullscreen");
        return;
      }
      
      // Clone the table
      const tableClone = table.cloneNode(true);
      
      // Add close button to the overlay
      fullscreenOverlay.innerHTML = '';
      const closeBtn = document.createElement("button");
      closeBtn.className = "fullscreen-close";
      closeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        Exit Full Screen
      `;
      fullscreenOverlay.appendChild(closeBtn);
      
      // Add the cloned table to the overlay
      fullscreenOverlay.appendChild(tableClone);
      
      // Show the overlay
      fullscreenOverlay.style.display = 'block';
      document.body.style.overflow = 'hidden'; // Prevent scrolling on the main page
      
      // Add close button event listener
      closeBtn.addEventListener("click", function() {
        fullscreenOverlay.style.display = 'none';
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Reposition any open details panel
        const detailsPanel = document.getElementById('product-map-details-panel');
        if (detailsPanel && detailsPanel.style.display !== 'none') {
          detailsPanel.style.position = 'fixed';
          detailsPanel.style.top = '40%';
          detailsPanel.style.left = 'auto';
          detailsPanel.style.right = '10px';
          detailsPanel.style.transform = 'translateY(-50%)';
        }
      });

      // Clone the view switcher and add it to the overlay
const originalSwitcher = document.querySelector('.view-switcher');
if (originalSwitcher) {
  const switcherClone = originalSwitcher.cloneNode(true);
  fullscreenOverlay.insertBefore(switcherClone, fullscreenOverlay.firstChild);
  
  // Re-attach event listeners to the cloned switcher
  const clonedProductsBtn = switcherClone.querySelector('#viewProducts');
  const clonedChartsBtn = switcherClone.querySelector('#viewCharts');
  
  clonedProductsBtn.addEventListener('click', function() {
    clonedProductsBtn.classList.add('active');
    clonedChartsBtn.classList.remove('active');
    
    fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
      container.style.display = 'block';
    });
    fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
      container.style.display = 'none';
    });
  });
  
clonedChartsBtn.addEventListener('click', function() {
  clonedChartsBtn.classList.add('active');
  clonedProductsBtn.classList.remove('active');
  
  fullscreenOverlay.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'none';
  });
  fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  
  // Render charts for each row in fullscreen
  fullscreenOverlay.querySelectorAll('.products-chart-container').forEach(container => {
    const chartAvgPosDiv = container.querySelector('.chart-avg-position');
    const chartProductsDiv = container.querySelector('.chart-products');
    
// Get all products for this chart - always filter by myCompany in Charts mode
const smallCards = chartProductsDiv.querySelectorAll('.small-ad-details');
let products = Array.from(smallCards).map(card => card.productData).filter(p => p);

// In Charts mode, always show only myCompany products
products = products.filter(p => p._isMyCompany);
    
    if (products.length > 0 && chartAvgPosDiv) {
      renderAvgPositionChart(chartAvgPosDiv, products);
      
      // Add click handlers to small cards for chart interaction
      smallCards.forEach((card, index) => {
        // Remove any existing click handler
        const oldHandler = card._chartClickHandler;
        if (oldHandler) {
          card.removeEventListener('click', oldHandler);
        }
        
        // Create new click handler
        const clickHandler = function() {
          // Toggle selection
          if (chartAvgPosDiv.selectedProductIndex === index) {
            // Deselect if clicking the same product
            chartAvgPosDiv.selectedProductIndex = null;
            card.classList.remove('active');
          } else {
            // Select this product
            chartAvgPosDiv.selectedProductIndex = index;
            // Remove active class from all cards
            smallCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
          }
          
          // Update chart visibility
          updateChartLineVisibility(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
        };
        
        // Store reference to handler for cleanup
        card._chartClickHandler = clickHandler;
        card.addEventListener('click', clickHandler);
      });
    }
  });
});
}
      
// Apply fullscreen styles to the cloned table cells
const productCells = fullscreenOverlay.querySelectorAll('.product-cell');
productCells.forEach(cell => {
  // Keep horizontal scrolling, don't wrap
  cell.style.flexWrap = "nowrap";
  cell.style.overflowX = "auto";
  cell.style.minWidth = "100%";
  
  // Adjust card widths to maintain consistent size
  const cards = cell.querySelectorAll('.ad-details');
  cards.forEach(card => {
    card.style.width = "150px";
    card.style.flexShrink = "0";
    card.style.margin = "0 6px 0 0"; // Keep original horizontal spacing
    
    // Reattach click handlers to the cloned cards
    card.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      const plaIndex = card.getAttribute('data-pla-index');
      const rowData = window.globalRows[plaIndex];
      if (!rowData) {
        console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
        return;
      }
      
      openProductMapDetailsPanel(card, rowData, true); // true indicates we're in fullscreen mode
    });
  });
});

// REPLACE your current segmentation chart recreation code with this final fix:

// Re-render segmentation charts in the cloned table
setTimeout(() => {
  console.log("[DEBUG-FULLSCREEN] Starting segmentation chart recreation...");
  
  // Get all chart containers in the fullscreen overlay
  const chartContainers = fullscreenOverlay.querySelectorAll('.segmentation-chart-container');
  console.log("[DEBUG-FULLSCREEN] Found chart containers:", chartContainers.length);
  
  // Build a map from the original table to get the correct data associations
  const originalTable = document.querySelector('.product-map-table');
  const originalRows = originalTable.querySelectorAll('tbody tr');
  
  // Create a mapping of chart container index to data
  const chartDataMap = {};
  let chartIndex = 0;
  
  originalRows.forEach(row => {
    const originalChartContainer = row.querySelector('.segmentation-chart-container');
    if (!originalChartContainer) return;
    
    // Extract data from the original table structure
    let term = '';
    let location = '';
    let device = '';
    
    // Find search term - it might be in this row or a previous row due to rowspan
    let currentRow = row;
    while (currentRow && !term) {
      const termElement = currentRow.querySelector('.search-term-tag');
      if (termElement) {
        term = termElement.textContent.trim();
      }
      currentRow = currentRow.previousElementSibling;
    }
    
    // Find location - similar logic for rowspan
    currentRow = row;
    while (currentRow && !location) {
      const locationElement = currentRow.querySelector('.city-line');
      if (locationElement) {
        location = locationElement.textContent.trim();
      }
      currentRow = currentRow.previousElementSibling;
    }
    
    // Device should be in the same row
    const deviceElement = row.querySelector('.device-icon');
    if (deviceElement) {
      device = deviceElement.alt || '';
    }
    
    // Store the mapping
    chartDataMap[chartIndex] = { term, location, device };
    chartIndex++;
  });
  
  // Helper function to match locations flexibly
  function locationMatches(mappedLocation, productLocation) {
    if (!mappedLocation || !productLocation) return false;
    
    // Direct match
    if (mappedLocation === productLocation) return true;
    
    // Check if the mapped location is the first part of the product location
    const productParts = productLocation.split(',');
    const firstPart = productParts[0] ? productParts[0].trim() : '';
    
    return mappedLocation.toLowerCase() === firstPart.toLowerCase();
  }
  
  // Now process the cloned chart containers using the mapped data
  chartContainers.forEach((container, index) => {
    console.log(`[DEBUG-FULLSCREEN] Processing container ${index}:`, container.id);
    
    // Get the mapped data
    const mappedData = chartDataMap[index];
    if (!mappedData) {
      console.log("[DEBUG-FULLSCREEN] No mapped data found for index", index);
      return;
    }
    
    const { term, location, device } = mappedData;
    console.log("[DEBUG-FULLSCREEN] Using mapped data - term:", term, "location:", location, "device:", device);
    
    if (!term || !location || !device) {
      console.log("[DEBUG-FULLSCREEN] Incomplete mapped data");
      return;
    }
    
    // Find matching products - EXACT term matching, no normalization
    const matchingProducts = window.allRows.filter(p => {
      const termMatch = p.q === term; // EXACT match only
      const locMatch = locationMatches(location, p.location_requested);
      const deviceMatch = p.device === device;
      const companyMatch = p.source && p.source.toLowerCase() === (companyToFilter || "").toLowerCase();
      
      return termMatch && locMatch && deviceMatch && companyMatch;
    });
    
    console.log("[DEBUG-FULLSCREEN] Found matching products:", matchingProducts.length);
    
    if (matchingProducts.length === 0) {
      console.log("[DEBUG-FULLSCREEN] No matching products found");
      return;
    }
    
    // Filter active and inactive products
    const activeProducts = matchingProducts.filter(product => 
      product.product_status === 'active' || !product.product_status
    );
    
    const inactiveProducts = matchingProducts.filter(product => 
      product.product_status === 'inactive'
    );
    
    console.log("[DEBUG-FULLSCREEN] Active products:", activeProducts.length, "Inactive:", inactiveProducts.length);
    
    // Calculate chart data
    const chartData = calculateAggregateSegmentData(matchingProducts);
    console.log("[DEBUG-FULLSCREEN] Chart data generated:", !!chartData, "length:", chartData?.length || 0);
    
    if (!chartData || chartData.length === 0) {
      console.log("[DEBUG-FULLSCREEN] No valid chart data generated");
      return;
    }
    
    // *** FIX THE REAL ISSUE: Render chart directly to the cloned container ***
    // Instead of calling createSegmentationChart which uses document.getElementById
    
    console.log("[DEBUG-FULLSCREEN] Rendering chart directly to cloned container");
    
    // Clear and setup the container
    container.innerHTML = '';
    container.style.height = '380px';
    container.style.maxHeight = '380px';
    container.style.overflowY = 'hidden';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    
    // Create canvas wrapper
    const canvasWrapper = document.createElement('div');
    canvasWrapper.style.width = '100%';
    canvasWrapper.style.height = '280px';
    canvasWrapper.style.maxHeight = '280px';
    canvasWrapper.style.position = 'relative';
    canvasWrapper.style.marginBottom = '10px';
    container.appendChild(canvasWrapper);
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvasWrapper.appendChild(canvas);
    
    // Create count container
    const countContainer = document.createElement('div');
    countContainer.style.width = '250px';
    countContainer.style.height = '80px';
    countContainer.style.maxHeight = '80px';
    countContainer.style.display = 'grid';
    countContainer.style.gridTemplateColumns = '1fr 1fr';
    countContainer.style.gridTemplateRows = 'auto auto';
    countContainer.style.gap = '4px';
    countContainer.style.padding = '8px';
    countContainer.style.backgroundColor = '#f9f9f9';
    countContainer.style.borderRadius = '8px';
    countContainer.style.fontSize = '14px';
    countContainer.style.boxSizing = 'border-box';
    
    countContainer.innerHTML = `
      <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
      <div style="font-weight: 700; color: #4CAF50;">${activeProducts.length}</div>
      <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
      <div style="font-weight: 700; color: #9e9e9e;">${inactiveProducts.length}</div>
    `;
    
    container.appendChild(countContainer);
    
    // Create the chart directly
    try {
      new Chart(canvas, {
        type: "bar",
        data: {
          labels: chartData.map(d => d.label),
          datasets: [
            {
              label: "Current",
              data: chartData.map(d => d.current),
              backgroundColor: "#007aff",
              borderRadius: 4
            },
            {
              label: "Previous",
              type: "line",
              data: chartData.map(d => d.previous),
              borderColor: "rgba(255,0,0,1)",
              backgroundColor: "rgba(255,0,0,0.2)",
              fill: true,
              tension: 0.3,
              borderWidth: 2
            }
          ]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const val = ctx.parsed.x;
                  return `${ctx.dataset.label}: ${val.toFixed(2)}%`;
                }
              }
            },
            datalabels: {
              display: ctx => ctx.datasetIndex === 0,
              formatter: (value, context) => {
                const row = chartData[context.dataIndex];
                const mainLabel = `${row.current.toFixed(1)}%`;
                const diff = row.current - row.previous;
                const absDiff = Math.abs(diff).toFixed(1);
                const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "±";
                return [ mainLabel, `${arrow}${absDiff}%` ];
              },
              color: ctx => {
                const row = chartData[ctx.dataIndex];
                const diff = row.current - row.previous;
                if (diff > 0) return "green";
                if (diff < 0) return "red";
                return "#444";
              },
              anchor: "end",
              align: "end",
              offset: 8,
              font: { size: 10 }
            }
          },
          scales: {
            x: { display: false, min: 0, max: 100 },
            y: { display: true, grid: { display: false }, ticks: { font: { size: 11 } } }
          },
          animation: false
        }
      });
      
      console.log("[DEBUG-FULLSCREEN] Chart rendered successfully to cloned container");
    } catch (error) {
      console.error("[DEBUG-FULLSCREEN] Error rendering chart:", error);
    }
  });
}, 500);
      
      // Initialize visibility badges in the cloned table
      setTimeout(() => {
        fullscreenOverlay.querySelectorAll('.vis-badge').forEach(function(el) {
          const parts = el.id.split('-');
          const index = parts[2];
          const row = window.globalRows[index];
          if (!row) return;
          
          let visValue = parseFloat(row.visibilityBarValue) || 0;
          if (visValue === 0) {
            visValue = 0.1;
          }
      
          var options = {
            series: [visValue],
            chart: {
              height: 80,
              width: 80,
              type: 'radialBar',
              sparkline: { enabled: false },
              offsetY: 0
            },
            plotOptions: {
              radialBar: {
                startAngle: -90,
                endAngle: 90,
                hollow: { size: '50%' },
                track: { strokeDashArray: 8, margin:2 },
                dataLabels: {
                  name: { show: false },
                  value: {
                    show: true,
                    offsetY: 0,
                    fontSize: '14px',
                    formatter: function(val){
                      return Math.round(val) + "%";
                    }
                  }
                }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'dark',
                shadeIntensity: 0.15,
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 1,
                stops: [0,50,100]
              }
            },
            stroke: { lineCap:'butt', dashArray:4 },
            labels: []
          };
          
          // Check if ApexCharts is available
          if (typeof ApexCharts !== 'undefined') {
            var chart = new ApexCharts(el, options);
            chart.render();
          }
        });
      }, 100);
    });

    // Add view switcher functionality
const viewProductsBtn = document.getElementById("viewProducts");
const viewChartsBtn = document.getElementById("viewCharts");

viewProductsBtn.addEventListener("click", function() {
  // Switch to Products view
  viewProductsBtn.classList.add("active");
  viewChartsBtn.classList.remove("active");
  
  // Show all product cells, hide all chart containers
  document.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'block';
  });
  document.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'none';
  });
});

viewChartsBtn.addEventListener("click", function() {
  // Switch to Charts view
  viewChartsBtn.classList.add("active");
  viewProductsBtn.classList.remove("active");
  
  // Hide all product cells, show all chart containers
  document.querySelectorAll('.product-cell-container').forEach(container => {
    container.style.display = 'none';
  });
  document.querySelectorAll('.products-chart-container').forEach(container => {
    container.style.display = 'flex';
  });
  
  // Render charts for each row
  document.querySelectorAll('.products-chart-container').forEach(container => {
    const chartAvgPosDiv = container.querySelector('.chart-avg-position');
    const chartProductsDiv = container.querySelector('.chart-products');
    
// Get all products for this chart - always filter by myCompany in Charts mode
const smallCards = chartProductsDiv.querySelectorAll('.small-ad-details');
let products = Array.from(smallCards).map(card => card.productData).filter(p => p);

// In Charts mode, always show only myCompany products
products = products.filter(p => p._isMyCompany);
    
    if (products.length > 0 && chartAvgPosDiv) {
      renderAvgPositionChart(chartAvgPosDiv, products);
      
      // Add click handlers to small cards for chart interaction
      smallCards.forEach((card, index) => {
        // Remove any existing click handler
        const oldHandler = card._chartClickHandler;
        if (oldHandler) {
          card.removeEventListener('click', oldHandler);
        }
        
        // Create new click handler
        const clickHandler = function() {
          // Toggle selection
          if (chartAvgPosDiv.selectedProductIndex === index) {
            // Deselect if clicking the same product
            chartAvgPosDiv.selectedProductIndex = null;
            card.classList.remove('active');
          } else {
            // Select this product
            chartAvgPosDiv.selectedProductIndex = index;
            // Remove active class from all cards
            smallCards.forEach(c => c.classList.remove('active'));
            // Add active class to clicked card
            card.classList.add('active');
          }
          
          // Update chart visibility
          updateChartLineVisibility(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
        };
        
        // Store reference to handler for cleanup
        card._chartClickHandler = clickHandler;
        card.addEventListener('click', clickHandler);
      });
    }
  });
});

// Listen for mode changes
document.querySelectorAll('#modeSelector .mode-option').forEach(option => {
  option.addEventListener('click', function() {
    const selectedMode = this.getAttribute('data-mode');
    
    // Update body class
    document.body.classList.remove('mode-products', 'mode-companies');
    document.body.classList.add(`mode-${selectedMode}`);
    
    // Update table headers
    const productsHeaders = document.querySelectorAll('.products-header');
    const companiesHeaders = document.querySelectorAll('.companies-header');
    
    if (selectedMode === 'companies') {
      productsHeaders.forEach(h => h.style.display = 'none');
      companiesHeaders.forEach(h => h.style.display = '');
    } else {
      productsHeaders.forEach(h => h.style.display = '');
      companiesHeaders.forEach(h => h.style.display = 'none');
    }
  });
});

// Add bucket type selector functionality
const bucketSelector = document.getElementById("bucketTypeSelector");
if (bucketSelector) {
  bucketSelector.addEventListener("change", function() {
    const selectedBucketType = this.value;
    console.log(`[ProductMap] Switching to bucket type: ${selectedBucketType}`);
    
    // Update all bucket badges
    document.querySelectorAll('.bucket-badge').forEach(badge => {
      const adCard = badge.parentElement;
      const plaIndex = adCard.getAttribute('data-pla-index');
      const product = window.globalRows[plaIndex];
      
      if (product && googleAdsEnabled && bucketDataMap.size > 0) {
        // Get device from the row, not from the product
        const row = adCard.closest('tr');
        const deviceCell = row.querySelector('.device-icon');
        const deviceValue = deviceCell ? (deviceCell.alt || '').toUpperCase() : 'DESKTOP';
        
        const plaIndex = adCard.getAttribute('data-pla-index');
const productData = window.globalRows[plaIndex];
if (!productData) return;
const lookupKey = `${productData.title.toLowerCase()}|${deviceValue}`;
        
        const productBucketData = bucketDataMap.get(lookupKey);
        
if (productBucketData) {
  const bucketResult = getBucketBadgeHTML(productBucketData, selectedBucketType);
  
  // Remove existing bucket badge
  const existingBadge = adCard.querySelector('.bucket-badge');
  if (existingBadge) {
    existingBadge.remove();
  }
  
  // Remove existing sellers container classes
  adCard.classList.remove('sellers-revenue-stars', 'sellers-best-sellers', 'sellers-volume-leaders', 'sellers-standard');
  
  // Add new badge if exists
  if (bucketResult.badgeHTML) {
    adCard.insertAdjacentHTML('afterbegin', bucketResult.badgeHTML);
    if (!adCard.classList.contains('has-bucket')) {
      adCard.classList.add('has-bucket');
    }
  } else {
    adCard.classList.remove('has-bucket');
  }
  
  // Add new container class for sellers bucket
  if (bucketResult.containerClass) {
    adCard.classList.add(bucketResult.containerClass);
  }
}
      }
    });
  });
}

// Add metrics toggle functionality
const metricsToggle = document.getElementById("metricsToggle");
if (metricsToggle) {
  // Restore toggle state
  metricsToggle.checked = window.metricsToggleState || false;
  
  metricsToggle.addEventListener("change", function() {
    const isChecked = this.checked;
    
    // Store the toggle state
    window.metricsToggleState = isChecked;
    console.log(`[ProductMap] Metrics toggle: ${isChecked ? 'ON' : 'OFF'}`);
    
    // Find all card wrappers and metrics panels
    const cardWrappers = document.querySelectorAll('.card-wrapper');
    const metricsPanels = document.querySelectorAll('.product-metrics-panel');
    
    cardWrappers.forEach(wrapper => {
      if (isChecked) {
        wrapper.classList.add('with-metrics');
      } else {
        wrapper.classList.remove('with-metrics');
      }
    });
    
metricsPanels.forEach(panel => {
  const wrapper = panel.closest('.card-wrapper');
  if (wrapper && wrapper.getAttribute('data-has-metrics') === 'true') {
    if (isChecked) {
      wrapper.classList.add('with-metrics');
      panel.classList.add('visible');
    } else {
      wrapper.classList.remove('with-metrics');
      panel.classList.remove('visible');
    }
  }
});
  });
}

// Add all products toggle functionality
const allProductsToggle = document.getElementById("allProductsToggle");
if (allProductsToggle) {
  // Restore toggle state
  allProductsToggle.checked = window.showAllProductsInMap || false;
  
  allProductsToggle.addEventListener("change", function() {
    const isChecked = this.checked;
    console.log(`[ProductMap] All Products toggle: ${isChecked ? 'ON' : 'OFF'}`);
    
    // Store the toggle state
    window.showAllProductsInMap = isChecked;
    if (mode === 'companies') {
  prepareCompanySerpsStatsData();
}
    // Re-render the entire table
    renderProductMapTable();
  });
}
  
    console.log("[renderProductMapTable] Using myCompany:", window.myCompany);
  // Get the correct company for the current project
let companyToFilter = window.myCompany; // Default fallback

// Extract current project number from dataPrefix
const currentProjectNum = window.dataPrefix ? 
  parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
const projectKey = `acc1_pr${currentProjectNum}`;

// Find the company for this specific project from myCompanyArray
if (window.myCompanyArray && window.myCompanyArray.length > 0) {
  const match = window.myCompanyArray.find(item => 
    item && item.startsWith(projectKey)
  );
  if (match) {
    companyToFilter = match.split(' - ')[1] || window.myCompany;
  }
}

console.log(`[renderProductMapTable] Using company for project ${currentProjectNum}: ${companyToFilter}`);

    if (!window.globalRows || typeof window.globalRows !== 'object') {
      window.globalRows = {};
      console.log("[DEBUG] Created new globalRows object");
    }
  
    if (!document.getElementById("product-map-table-style")) {
      const style = document.createElement("style");
      style.id = "product-map-table-style";
      style.textContent = `
        .product-map-table {
          width: calc(100% - 40px);
          min-width: 1400px;
          margin-left: 20px;
          border-collapse: collapse;
          background-color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          border-radius: 12px;
          overflow: hidden;
          table-layout: fixed;
        }
        .product-map-table th {
          height: 50px;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          font-size: 14px;
          border-bottom: 2px solid #ddd;
          background: linear-gradient(to bottom, #ffffff, #f9f9f9);
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .product-map-table td {
          padding: 8px;
          font-size: 14px;
          color: #333;
          vertical-align: middle;
          border-bottom: 1px solid #eee;
          height: 380px; /* Fixed height */
          max-height: 380px;
          box-sizing: border-box;
          overflow: hidden;
        }
        /* Fixed column widths - MODIFIED */
        .product-map-table th:nth-child(1), .product-map-table td:nth-child(1) { width: 190px; }
        .product-map-table th:nth-child(2), .product-map-table td:nth-child(2) { width: 120px; }
        .product-map-table th:nth-child(3), .product-map-table td:nth-child(3) { width: 100px; }
        .product-map-table th:nth-child(4), .product-map-table td:nth-child(4) { width: 240px; }
        .product-map-table th:nth-child(5), .product-map-table td:nth-child(5) { 
          width: auto; 
          min-width: 400px; /* Ensure Products column has a reasonable minimum width */
        }
.product-map-table th:nth-child(6), .product-map-table td:nth-child(6) { 
  width: auto; 
  min-width: 800px !important; /* Ensure Companies column has enough width */
  white-space: nowrap !important; /* Prevent wrapping */
}
        
/* Search term tag styling - NEW */
.search-term-tag {
  display: inline-block;
  background-color: #e8f0fe;
  color: #1a73e8;
  border-radius: 16px;
  padding: 6px 12px;
  font-weight: 500;
  font-size: 14px;
  border-left: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  max-width: 90%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  white-space: normal;
  line-height: 1.4;
  text-align: center;
}
        
        /* Different pastel backgrounds for locations */
        .location-bg-1 { background-color: #f0f8ff; } /* AliceBlue */
        .location-bg-2 { background-color: #f0fff0; } /* HoneyDew */
        .location-bg-3 { background-color: #fff0f5; } /* LavenderBlush */
        .location-bg-4 { background-color: #f5fffa; } /* MintCream */
        .location-bg-5 { background-color: #f8f8ff; } /* GhostWhite */
        .location-bg-6 { background-color: #f0ffff; } /* Azure */
        .location-bg-7 { background-color: #fffaf0; } /* FloralWhite */
        .location-bg-8 { background-color: #f5f5dc; } /* Beige */
        .location-bg-9 { background-color: #faf0e6; } /* Linen */
        .location-bg-10 { background-color: #fff5ee; } /* SeaShell */
        
        /* Device types */
        .device-desktop { background-color: #f5f5f5; }
        .device-mobile { background-color: #ffffff; }
        
        /* Location cell styling */
        .city-line { 
          font-weight: 600;
          font-size: 16px;
        }
        .state-line { 
          font-size: 13px; 
          color: #555;
          margin-top: 2px;
        }
        .country-line { 
          font-size: 12px; 
          color: #666;
          margin-top: 2px;
        }
        
        /* Device cell with three sections */
        .device-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          justify-content: space-between;
        }
        
        .device-type, .device-rank, .device-share {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          flex: 1;
          text-align: center;
          padding: 8px 0;
        }
        
        .device-type {
          font-weight: 500;
        }
        
        .section-header {
          font-size: 11px;
          color: #666;
          margin-bottom: 2px;
          text-transform: uppercase;
        }
        
        .device-rank-value {
          font-size: 24px;
          font-weight: bold;
        }
        
        .device-trend {
          font-size: 12px;
          font-weight: 500;
          margin-top: 2px;
        }
        
        /* Market share pie chart container - NEW */
        .pie-chart-container {
          width: 75px;
          height: 75px;
          margin: 0 auto;
          position: relative;
        }
        
        .trend-up {
          color: green;
        }
        
        .trend-down {
          color: red;
        }
        
        .trend-neutral {
          color: #444;
        }
        
        /* Product cell with horizontal scrolling */
        .product-cell {
          display: flex;
          flex-wrap: nowrap;
          gap: 6px;
          overflow-x: auto;
          width: 100%;
          min-width: 100%;
          min-height: 280px;
          scrollbar-width: thin;
        }
        
/* Segment count circles */
.segment-count-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  color: #333;
  margin: 2px auto;
}

.segment-count-top3 {
  background-color: #90EE90; /* Light green */
}

.segment-count-top4-8 {
  background-color: #FFFFE0; /* Light yellow */
}

.segment-count-top9-14 {
  background-color: #FFE4B5; /* Light orange */
}

.segment-count-below14 {
  background-color: #FFB6C1; /* Light red */
}
        
        .no-data-message {
          color: #999;
          font-style: italic;
          text-align: center;
        }
        
        /* Styling for ad cards to match main page */
.product-cell .ad-details {
  position: relative; /* Add this line */
  flex: 0 0 auto;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  background-color: white;
  transition: transform 0.2s, box-shadow 0.2s;
  overflow: hidden;
}       
        .product-cell .ad-details:hover {
          transform: translateY(-3px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.15);
        }
        
        .product-cell .ad-thumbnail-container {
          position: relative;
          width: 100%;
          text-align: center;
          margin-bottom: 8px;
        }
        
        .product-cell .ad-thumbnail {
          max-width: 100%;
          height: auto;
          max-height: 170px;
          object-fit: contain;
          border-radius: 4px;
        }
        
        .product-cell .ad-info {
          padding: 0 4px;
        }
        
        .product-cell .ad-title {
          font-size: 13px;
          line-height: 1.3;
          font-weight: 500;
          margin-bottom: 4px;
          max-height: 2.6em;
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .product-cell .ad-price {
          font-weight: 600;
          color: #111;
          font-size: 14px;
          margin-bottom: 2px;
        }
        
        .product-cell .ad-merchant {
          font-size: 12px;
          color: #666;
          margin-bottom: 4px;
        }
        
        .product-cell .ad-rating {
          display: flex;
          align-items: center;
          font-size: 12px;
          color: #666;
        }
        
        .product-cell .star-container {
          display: inline-flex;
          margin: 0 4px;
        }
        
        .product-cell .review-count {
          color: #777;
          font-size: 11px;
        }
        
        .product-cell .ad-extensions {
          margin-top: 4px;
          font-size: 11px;
          color: #666;
        }
        
        .product-cell .ad-extension {
          margin-bottom: 2px;
          line-height: 1.2;
        }
        
        .product-cell .trend-box {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          grid-template-rows: auto auto;
          gap: 2px;
          font-size: 11px;
          margin-top: 6px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        
        .product-cell .trend-header {
          text-align: center;
          font-weight: 500;
          color: #555;
        }
        
        .product-cell .trend-data {
          text-align: center;
        }
        
        .product-cell .trend-up {
          color: green;
        }
        
        .product-cell .trend-down {
          color: red;
        }
        
        .product-cell .sale-badge {
          position: absolute;
          top: 5px;
          left: 5px;
          background-color: #e53935;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        
        .product-cell .pos-badge {
          position: absolute;
          top: 5px;
          right: 5px;
          background-color: #4CAF50;
          color: white;
          padding: 2px 6px;
          font-size: 10px;
          border-radius: 3px;
          font-weight: bold;
        }
        
.product-cell .vis-badge {
  position: absolute;
  bottom: 5px;
  right: 5px;
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  max-width: 40px !important;
  max-height: 40px !important;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  color: #007aff !important;
  z-index: 12;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
  background: white;
  overflow: hidden;
  flex-shrink: 0;
}

.product-cell .vis-badge::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(0, 122, 255, 0.3);
  transition: height 0.3s ease;
  z-index: -1;
}

.product-cell .vis-badge-value {
  position: relative;
  z-index: 1;
  font-size: 13px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}
        
        .no-products {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          color: #999;
          font-style: italic;
        }

        .device-icon {
          max-height: 40px;
          max-width: 40px;
          object-fit: contain;
        }
.inactive-product {
  filter: grayscale(100%);
  opacity: 0.8;
}

.product-status-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  background-color: #555;
  color: white;
  padding: 2px 6px;
  font-size: 10px;
  border-radius: 3px;
  font-weight: bold;
  z-index: 10;
}

.product-status-active {
  background-color: #4CAF50;
}

.product-status-inactive {
  background-color: #9e9e9e;
}
.last-tracked-container {
  padding: 6px 0;
  text-align: center;
  border-top: 1px solid #eee;
  margin-top: 4px;
}

.last-tracked-label {
  font-size: 11px;
  color: #666;
  margin-bottom: 2px;
  text-transform: uppercase;
}

.last-tracked-value {
  font-size: 14px;
  font-weight: 500;
}

.recent-tracking {
  color: #4CAF50;
}

.moderate-tracking {
  color: #FFA000;
}

.old-tracking {
  color: #F44336;
}
/* Full-screen mode styles */
.product-map-fullscreen-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: white;
  z-index: 9999;
  overflow: auto;
  padding: 20px;
  box-sizing: border-box;
  display: none;
}

.product-map-fullscreen-overlay .product-map-table {
  width: 100%;
  margin-left: 0;
}

.product-map-fullscreen-overlay .product-map-table th:nth-child(5), 
.product-map-fullscreen-overlay .product-map-table td:nth-child(5) {
  width: auto;
  min-width: 600px;
}

.product-map-fullscreen-overlay .product-cell {
  width: 100%;
  flex-wrap: nowrap;
  overflow-x: auto;
  min-width: 100%;
}

.fullscreen-toggle {
  position: absolute;
  top: 10px;
  right: 20px;
  padding: 8px 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 100;
}

.fullscreen-toggle:hover {
  background-color: #0056b3;
}

.fullscreen-close {
  position: fixed;
  top: 20px;
  right: 20px;
  background-color: #ff3b30;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  z-index: 10000;
  display: flex;
  align-items: center;
  gap: 6px;
}

.fullscreen-close:hover {
  background-color: #d9342c;
}

.product-map-fullscreen-overlay .product-cell .ad-details {
  margin-bottom: 10px;
  margin-right: 10px;
}
/* View switcher styles */
.view-switcher {
  position: absolute;
  top: 10px;
  right: 140px; /* Positioned before the fullscreen button */
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  z-index: 100;
}

.view-switcher button {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 17px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.view-switcher button.active {
  background-color: #007aff;
  color: white;
}

.view-switcher button:hover:not(.active) {
  background-color: rgba(0, 122, 255, 0.1);
}

/* Products chart container styles */
.products-chart-container {
  display: none;
  width: 100%;
  height: 100%;
  min-height: 280px;
  overflow: hidden;
  flex-direction: row;
  gap: 10px;
}

.chart-products {
  width: 280px;
  height: 100%;
  max-height: 575px;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 5px;
  scrollbar-width: auto;
  scrollbar-color: #ccc #f9f9f9;
}

.chart-products::-webkit-scrollbar {
  width: 8px;  /* Increased from 6px */
}

.chart-products::-webkit-scrollbar-track {
  background: #e0e0e0;  /* Made darker than #f9f9f9 */
  border-radius: 4px;
}

.chart-products::-webkit-scrollbar-thumb {
  background: #888;  /* Made darker than #ccc */
  border-radius: 4px;
}

.chart-products::-webkit-scrollbar-thumb:hover {
  background: #666;  /* Made darker than #999 */
}

.chart-avg-position {
  flex: 1;
  min-width: 300px; /* Add minimum width */
  height: 100%;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
}

/* Small ad details for chart view */
.small-ad-details {
  width: 270px;
  height: 60px;
  margin-bottom: 5px;
  background-color: white;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  padding: 5px;
  cursor: pointer;
  transition: all 0.2s;
}
/* Position badge for small cards */
.small-ad-pos-badge {
  width: 50px;
  min-width: 50px;
  height: 50px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  margin-right: 8px;
  font-weight: bold;
}

.small-ad-pos-value {
  font-size: 18px;
  line-height: 1;
  color: white;
}

.small-ad-pos-trend {
  font-size: 11px;
  line-height: 1;
  margin-top: 2px;
  color: white;
}

.small-ad-details:hover {
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
  transform: translateY(-1px);
}

.small-ad-details.active {
  border: 2px solid #007aff;
  box-shadow: 0 2px 6px rgba(0,122,255,0.3);
}

.small-ad-image {
  width: 50px;
  height: 50px;
  object-fit: contain;
  margin-right: 8px;
  border-radius: 4px;
  background-color: #f5f5f5;
}

.small-ad-title {
  flex: 1;
  font-size: 12px;
  line-height: 1.3;
  color: #333;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}
.segmentation-chart-container.loading {
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
}

.segmentation-chart-container.loading::after {
  content: 'Loading chart...';
  font-size: 12px;
}
/* Add these styles to the existing style tag in renderProductMapTable function */

.bucket-badge {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 22px;
  background-color: #007aff; /* Default color, will be overridden by bucket type */
  color: white;
  font-size: 10px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  z-index: 10; /* Increased to be above image */
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* PROFITABILITY_BUCKET colors */
.bucket-badge.insufficient-data { background-color: #9E9E9E; }
.bucket-badge.profit-stars { background-color: #4CAF50; }
.bucket-badge.strong-performers { background-color: #8BC34A; }
.bucket-badge.steady-contributors { background-color: #2196F3; }
.bucket-badge.break-even-products { background-color: #FF9800; }
.bucket-badge.true-losses { background-color: #F44336; }

/* FUNNEL_STAGE_BUCKET colors */
.bucket-badge.full-funnel-excellence { background-color: #00BCD4; }
.bucket-badge.high-value-funnel-issues { background-color: #FFC107; }
.bucket-badge.critical-funnel-issues { background-color: #FF5722; }
.bucket-badge.ad-engagement-issue { background-color: #E91E63; }
.bucket-badge.product-page-dropoff { background-color: #9C27B0; }
.bucket-badge.cart-abandonment-problem { background-color: #673AB7; }
.bucket-badge.checkout-friction { background-color: #3F51B5; }
.bucket-badge.price-discovery-shock { background-color: #795548; }
.bucket-badge.cross-stage-issues { background-color: #607D8B; }
.bucket-badge.optimization-opportunities { background-color: #009688; }
.bucket-badge.normal-performance { background-color: #03A9F4; }

/* INVESTMENT_BUCKET colors */
.bucket-badge.pause-priority { background-color: #D32F2F; }
.bucket-badge.reduce-priority { background-color: #F57C00; }
.bucket-badge.maintain-priority { background-color: #FBC02D; }
.bucket-badge.growth-priority { background-color: #689F38; }
.bucket-badge.high-priority { background-color: #388E3C; }
.bucket-badge.maximum-priority { background-color: #1976D2; }

/* CUSTOM_TIER_BUCKET colors */
.bucket-badge.new-low-volume { background-color: #78909C; }
.bucket-badge.pause-candidates { background-color: #B71C1C; }
.bucket-badge.turnaround-required { background-color: #E65100; }
.bucket-badge.hero-products { background-color: #1B5E20; }
.bucket-badge.rising-stars { background-color: #00695C; }
.bucket-badge.steady-performers { background-color: #0277BD; }
.bucket-badge.mobile-champions { background-color: #4527A0; }
.bucket-badge.desktop-dependent { background-color: #6A1B9A; }
.bucket-badge.test-learn { background-color: #00838F; }
.bucket-badge.monitor-closely { background-color: #37474F; }

/* SELLERS colors - Enhanced */
.bucket-badge.revenue-stars { 
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
  color: #333; 
  box-shadow: 0 2px 6px rgba(255, 215, 0, 0.4);
  border: 1px solid #DAA520;
}

.bucket-badge.revenue-stars::before {
  content: "⭐";
  margin-right: 4px;
  font-size: 12px;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.bucket-badge.best-sellers { 
  background: linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 50%, #C0C0C0 100%);
  color: #333; 
  box-shadow: 0 2px 6px rgba(192, 192, 192, 0.4);
  border: 1px solid #A0A0A0;
}

.bucket-badge.volume-leaders { 
  background: linear-gradient(135deg, #CD7F32 0%, #B8860B 50%, #CD7F32 100%);
  color: white; 
  box-shadow: 0 2px 6px rgba(205, 127, 50, 0.4);
  border: 1px solid #A0522D;
}

/* Hide standard bucket badge completely when SELLERS is selected */
.bucket-badge.standard { 
  display: none !important;
}

/* Container contour styling for Sellers bucket */
.product-cell .ad-details.sellers-revenue-stars {
  border: 2px solid #FFD700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.3), 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
}

.product-cell .ad-details.sellers-revenue-stars::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #FFD700, #FFA500, #FFD700);
  border-radius: 10px;
  z-index: -1;
  opacity: 0.3;
}

.product-cell .ad-details.sellers-best-sellers {
  border: 2px solid #C0C0C0;
  box-shadow: 0 0 8px rgba(192, 192, 192, 0.3), 0 2px 4px rgba(0,0,0,0.1);
  position: relative;
}

.product-cell .ad-details.sellers-best-sellers::before {
  content: "";
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #C0C0C0, #A8A8A8, #C0C0C0);
  border-radius: 10px;
  z-index: -1;
  opacity: 0.3;
}

/* Adjust existing badges positioning when bucket-badge is present */
.product-cell .ad-details.has-bucket .pos-badge {
  top: 27px; /* 22px bucket height + 5px gap */
}

.product-cell .ad-details.has-bucket .sale-badge {
  top: 27px; /* 22px bucket height + 5px gap */
}

.product-cell .ad-details.has-bucket .product-status-indicator {
  top: 27px; /* 22px bucket height + 5px gap */
}

/* Remove the margin-top for thumbnail container so bucket overlays the image */
.product-cell .ad-details.has-bucket .ad-thumbnail-container {
  margin-top: 0; /* No space needed - bucket will overlay */
}

/* Ensure the ad-details container has relative positioning for absolute children */
.product-cell .ad-details {
  position: relative; /* Add this if not already present */
}
/* ROAS badge for bottom-left corner */
.roas-badge {
  position: absolute !important;
  bottom: 5px;
  left: 5px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 900;
  color: white !important;
  z-index: 12;
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
}

.metric-trend-small {
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  margin-top: 2px;
  color: #666;
}

.metric-trend-small.trend-up {
  color: #4CAF50;
}

.metric-trend-small.trend-down {
  color: #F44336;
}

.metric-trend-small.trend-neutral {
  color: #999;
}

.roas-good { background-color: #4CAF50; }
.roas-medium { background-color: #FF9800; }
.roas-poor { background-color: #F44336; }
.roas-unknown { background-color: #9E9E9E; }
/* Google Ads Metrics Toggle and Panel */
.metrics-toggle-container {
  position: absolute;
  top: 10px;
  right: 480px;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
}

.metrics-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.metrics-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.metrics-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.metrics-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .metrics-slider {
  background-color: #007aff;
}

input:checked + .metrics-slider:before {
  transform: translateX(20px);
}

.metrics-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

/* Update ad-details to support metrics panel */
.ad-details-with-metrics {
  display: flex;
  flex-direction: row;
  border-radius: 8px 0 0 8px;
}

.ad-details-with-metrics .ad-content {
  flex: 1;
  border-radius: 8px 0 0 8px;
}
.card-wrapper {
  display: flex;
  align-items: stretch;
  width: 150px;
  flex-shrink: 0;
  margin-right: 6px;
  position: relative;
}

.card-wrapper.with-metrics {
  width: 200px;
}

.product-metrics-panel {
  width: 0;
  height: 100%;
  overflow: hidden;
  background: linear-gradient(to bottom, #fafbfc 0%, #f5f6f7 100%);
  border: none;
  border-left: 1px solid #e1e4e8;
  border-radius: 0 6px 6px 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  transition: width 0.15s ease, opacity 0.15s ease;
  opacity: 0;
  position: relative;
}

.product-metrics-panel.visible {
  width: 50px;
  opacity: 1;
}

/* Create a subtle inner shadow for depth */
.product-metrics-panel::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: 0 6px 6px 0;
  box-shadow: inset 1px 0 3px rgba(0,0,0,0.06);
  pointer-events: none;
}

.metric-item-small {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 3px 2px;
  position: relative;
  transition: background-color 0.1s ease;
}

/* Hover effect for each metric */
.metric-item-small:hover {
  background-color: rgba(0, 122, 255, 0.04);
}

/* Separator lines - ultra thin */
.metric-item-small:not(:last-child)::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 15%;
  right: 15%;
  height: 1px;
  background: linear-gradient(to right, 
    transparent, 
    rgba(0,0,0,0.06) 20%, 
    rgba(0,0,0,0.06) 80%, 
    transparent
  );
}

.metric-label-small {
  font-size: 8px;
  color: #6a737d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1;
  opacity: 0.8;
}

.metric-value-small {
  font-size: 11px;
  font-weight: 700;
  color: #24292e;
  line-height: 1.1;
  margin-top: 2px;
  letter-spacing: -0.2px;
}

/* Special styling for key metrics */
.metric-item-small:nth-child(1) .metric-label-small { /* Impressions */
  color: #6f42c1;
}

.metric-item-small:nth-child(2) .metric-label-small { /* Clicks */
  color: #0366d6;
}

.metric-item-small:nth-child(2) .metric-value-small { /* Clicks value */
  color: #0366d6;
  font-size: 12px;
}

.metric-item-small:nth-child(6) { /* ROAS */
  background: linear-gradient(to bottom, rgba(255,255,255,0.5), rgba(255,255,255,0));
}

.metric-item-small:nth-child(6) .metric-label-small {
  color: #28a745;
  font-weight: 700;
}

.metric-item-small:nth-child(6) .metric-value-small {
  font-size: 13px;
  font-weight: 800;
  position: relative;
}

/* Color coding for ROAS values */
.value-good {
  color: #28a745 !important;
  text-shadow: 0 0 8px rgba(40, 167, 69, 0.2);
}

.value-medium {
  color: #ffa500 !important;
  text-shadow: 0 0 8px rgba(255, 165, 0, 0.2);
}

.value-poor {
  color: #dc3545 !important;
  text-shadow: 0 0 8px rgba(220, 53, 69, 0.2);
}

/* Micro indicators for performance */
.metric-value-small::before {
  content: '';
  position: absolute;
  left: -8px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 3px;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

/* Show indicator on hover */
.metric-item-small:hover .metric-value-small::before {
  opacity: 1;
}

.metric-item-small:nth-child(1) .metric-value-small::before { background: #6f42c1; }
.metric-item-small:nth-child(2) .metric-value-small::before { background: #0366d6; }
.metric-item-small:nth-child(3) .metric-value-small::before { background: #28a745; }
.metric-item-small:nth-child(4) .metric-value-small::before { background: #fb8500; }
.metric-item-small:nth-child(5) .metric-value-small::before { background: #e85d75; }

/* Add subtle animation when panel becomes visible */
.product-metrics-panel.visible .metric-item-small {
  animation: fadeInMetric 0.3s ease forwards;
}

.product-metrics-panel.visible .metric-item-small:nth-child(1) { animation-delay: 0.05s; }
.product-metrics-panel.visible .metric-item-small:nth-child(2) { animation-delay: 0.1s; }
.product-metrics-panel.visible .metric-item-small:nth-child(3) { animation-delay: 0.15s; }
.product-metrics-panel.visible .metric-item-small:nth-child(4) { animation-delay: 0.2s; }
.product-metrics-panel.visible .metric-item-small:nth-child(5) { animation-delay: 0.25s; }
.product-metrics-panel.visible .metric-item-small:nth-child(6) { animation-delay: 0.3s; }

@keyframes fadeInMetric {
  from {
    opacity: 0;
    transform: translateX(-5px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Compact number formatting for large values */
.metric-value-small.large-number {
  font-size: 10px;
  letter-spacing: -0.3px;
}

/* Special styling for zero or null values */
.metric-value-small.zero-value {
  opacity: 0.4;
  font-size: 10px;
}

/* Responsive height adjustment */
@media (max-height: 600px) {
  .metric-item-small {
    padding: 2px;
  }
  
  .metric-label-small {
    font-size: 7px;
  }
  
  .metric-value-small {
    font-size: 10px;
  }
}
/* Trend styling for metrics panel */
.metric-trend-small {
  font-size: 8px;
  font-weight: 600;
  line-height: 1;
  margin-top: 1px;
  height: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  letter-spacing: -0.2px;
}

.metric-trend-small.trend-up {
  color: #28a745;
}

.metric-trend-small.trend-down {
  color: #dc3545;
}

.metric-trend-small.trend-neutral {
  color: #999;
  font-size: 7px;
}

/* Adjust metric item padding to fit trends */
.metric-item-small {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 2px;
  position: relative;
  transition: background-color 0.1s ease;
  min-height: 40px;
}

/* Make the metric value slightly smaller to accommodate trend */
.metric-value-small {
  font-size: 11px;
  font-weight: 700;
  color: #24292e;
  line-height: 1;
  margin-top: 1px;
  letter-spacing: -0.2px;
}

/* Adjust label size */
.metric-label-small {
  font-size: 7px;
  color: #6a737d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  line-height: 1;
  opacity: 0.8;
}
/* Bucket Type Selector Styling */
.bucket-type-selector {
  position: absolute;
  top: 7px; /* Adjusted for better alignment */
  right: 320px;
  z-index: 100;
  padding: 8px 16px;
  border: 2px solid #007aff;
  border-radius: 8px;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
  font-size: 14px;
  font-weight: 600;
  color: #333;
  box-shadow: 0 2px 8px rgba(0, 122, 255, 0.15);
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-width: 140px;
  height: 40px; /* Fixed height for alignment */
  display: flex;
  align-items: center;
}

.bucket-type-selector:hover {
  border-color: #0056b3;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.25);
  transform: translateY(-1px);
}

.bucket-type-selector:focus {
  border-color: #0056b3;
  box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.1);
}
/* Search term stats styling */
.search-term-with-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
}

.search-term-tag {
  display: inline-block;
  background-color: #e8f0fe;
  color: #1a73e8;
  border-radius: 16px;
  padding: 6px 12px;
  font-weight: 500;
  font-size: 14px;
  border-left: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  max-width: 90%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  hyphens: auto;
  white-space: normal;
  line-height: 1.4;
  text-align: center;
  position: relative;
  z-index: 2;
  transition: all 0.3s ease;
}

.search-term-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 8px rgba(0,0,0,0.15);
}

.query-stats {
  margin-top: -8px; /* Overlap slightly with search term */
  padding-top: 20px; /* Space for the overlap */
  width: 95%;
  max-width: 180px;
  background: linear-gradient(to bottom, #fafbfc 0%, #f5f6f7 100%);
  border: 1px solid #e1e4e8;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
  animation: slideDown 0.4s ease-out;
  overflow: hidden;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.query-stats:hover {
  transform: translateY(2px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
}

/* Top Bucket Badge as Header */
.top-bucket-header {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 15px 10px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1;
}

/* Top Bucket color variations for header */
.top-bucket-header.top1 {
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #333;
  text-shadow: 0 1px 2px rgba(255,255,255,0.5);
}

.top-bucket-header.top1::after {
  content: ' 👑';
  font-size: 12px;
}

.top-bucket-header.top2 {
  background: linear-gradient(135deg, #E5E5E5 0%, #C0C0C0 100%);
  color: #333;
}

.top-bucket-header.top3 {
  background: linear-gradient(135deg, #DEB887 0%, #CD7F32 100%);
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
}

.top-bucket-header.top4 {
  background: linear-gradient(135deg, #6495ED 0%, #4169E1 100%);
  color: white;
}

.top-bucket-header.top5 {
  background: linear-gradient(135deg, #90EE90 0%, #32CD32 100%);
  color: white;
}

.top-bucket-header.top10 {
  background: linear-gradient(135deg, #DDA0DD 0%, #9370DB 100%);
  color: white;
}

/* Stats Grid */
.query-stats-content {
  padding: 32px 12px 12px; /* Extra top padding for header */
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.query-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  position: relative;
}

.query-stat-row:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: #e1e4e8;
  transform: translateX(2px);
}

.query-stat-row::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  border-radius: 0 2px 2px 0;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.query-stat-row:hover::before {
  opacity: 1;
}

.query-stat-row.sales::before {
  background: #ff6b6b;
}

.query-stat-row.revenue::before {
  background: #28a745;
}

.query-stat-row.cvr::before {
  background: #007bff;
}

.query-stat-label {
  font-size: 10px;
  color: #6a737d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  opacity: 0.8;
}

.query-stat-value {
  font-size: 14px;
  font-weight: 800;
  letter-spacing: -0.3px;
}

.query-stat-value.sales {
  color: #ff6b6b;
}

.query-stat-value.revenue {
  color: #28a745;
  text-shadow: 0 0 8px rgba(40, 167, 69, 0.15);
}

.query-stat-value.cvr {
  color: #007bff;
}

/* Subtle animation for values */
.query-stat-value {
  position: relative;
  display: inline-block;
}

.query-stat-value::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: currentColor;
  opacity: 0.3;
  transition: width 0.3s ease;
}

.query-stat-row:hover .query-stat-value::after {
  width: 100%;
}

/* Mini info icons */
.query-stat-row .info-icon {
  position: absolute;
  right: -6px;
  top: 4px;
  width: 12px;
  height: 12px;
  background: #6a737d;
  color: white;
  border-radius: 50%;
  font-size: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  cursor: help;
}

.query-stat-row:hover .info-icon {
  opacity: 0.4;
}

.info-icon:hover {
  opacity: 1 !important;
  transform: scale(1.2);
}

/* No stats available state */
.no-stats-message {
  padding: 16px;
  text-align: center;
  color: #6a737d;
  font-size: 11px;
  font-style: italic;
  opacity: 0.7;
}
.funnel-comparison {
  font-size: 10px;
  margin-top: 2px;
  opacity: 0.8;
}

.funnel-comparison.comparison-better {
  color: #28a745;
}

.funnel-comparison.comparison-worse {
  color: #dc3545;
}

.funnel-comparison.comparison-neutral {
  color: #6c757d;
}
/* Company details styling for product map */
.comp-details {
  width: 150px;
  min-width: 150px;
  max-width: 150px; /* Prevent growing */
  height: 360px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin: 5px;
  display: inline-block;
  vertical-align: top;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  float: left;
}

.comp-details .company-rank {
  position: absolute;
  top: 5px;
  left: 5px;
  font-size: 14px;
  font-weight: bold;
  z-index: 10;
  background: rgba(255,255,255,0.9);
  padding: 2px 6px;
  border-radius: 4px;
}

.comp-details .market-share-badge {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 12px;
  font-weight: bold;
  z-index: 10;
  background: rgba(255,255,255,0.9);
  padding: 2px 6px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.comp-details .company-logo {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-top: 20px;
}

.comp-details .company-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.comp-details .company-name {
  text-align: center;
  font-weight: bold;
  font-size: 12px;
  padding: 5px;
  min-height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.comp-details .products-stats {
  padding: 0 10px;
  font-size: 11px;
  text-align: center;
  background: #f8f9fa;
  margin: 5px 0;
  padding: 5px;
}

.comp-details .trend-stats {
  display: flex;
  justify-content: space-around;
  padding: 5px;
  font-size: 10px;
  background: #f0f0f0;
}

.comp-details .trend-stat {
  text-align: center;
}

.comp-details .trend-stat .count {
  font-weight: bold;
  font-size: 12px;
}

.comp-details .rank-history-mini {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  padding: 5px;
  gap: 2px;
}

.comp-details .rank-box-mini {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  border-radius: 3px;
  color: white;
}

/* Color classes for rank boxes */
.range-green { background-color: #4CAF50; }
.range-yellow { background-color: #FFC107; }
.range-orange { background-color: #FF9800; }
.range-red { background-color: #F44336; }

/* Company cell styling */
.company-cell-container {
  width: 100% !important;
  height: 100% !important;
  display: block !important; /* Ensure it's block when visible */
  min-width: 800px; /* Add minimum width */
}
// Force horizontal scrolling for company cells:
td:nth-child(6) {
  white-space: nowrap !important; /* Prevent wrapping */
}

// Clear any floats after company cells:
.company-cell::after {
  content: "";
  display: table;
  clear: both;
}

.company-cell {
  display: flex !important;
  flex-direction: row !important; /* ADD THIS */
  flex-wrap: nowrap !important;
  overflow-x: auto;
  overflow-y: hidden; /* ADD THIS */
  height: 100%;
  width: 100% !important; /* ADD THIS */
  min-width: 800px !important; /* ADD THIS */
  align-items: flex-start;
  min-height: 360px;
  white-space: nowrap !important; /* ADD THIS */
}

/* Products column visibility */
body.mode-products .products-column,
body.mode-products .products-header {
  display: table-cell !important;
}

body.mode-companies .products-column,
body.mode-companies .products-header {
  display: none !important;
}

/* Companies column visibility */
body.mode-companies .companies-column,
body.mode-companies .companies-header {
  display: table-cell !important;
}

body.mode-products .companies-column,
body.mode-products .companies-header {
  display: none !important;
}

/* Containers should always be visible within their cells */
.product-cell-container {
  width: 100%;
  height: 100%;
  display: block !important; /* Always block */
}

.company-cell-container {
  width: 100%;
  height: 100%;
  display: block !important; /* Always block */
}
      `;
      document.head.appendChild(style);
    }

// Add popup styles
const popupStyle = document.createElement("style");
popupStyle.id = "product-metrics-popup-style";
popupStyle.textContent = `
/* Replace the existing .product-metrics-popup styles with these: */
.product-metrics-popup {
  position: absolute;
  z-index: 10000;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  padding: 0;
  width: 580px;
  max-height: 85vh;
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: none;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.product-metrics-popup::-webkit-scrollbar {
  width: 8px;
}

.product-metrics-popup::-webkit-scrollbar-track {
  background: #f5f5f5;
}

.product-metrics-popup::-webkit-scrollbar-thumb {
  background: #ccc;
  border-radius: 4px;
}

.product-metrics-popup.visible {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.popup-header {
  background: linear-gradient(135deg, #0066cc, #004499);
  color: white;
  padding: 12px 16px;
  border-radius: 12px 12px 0 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-title {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.3;
  flex: 1;
  margin-right: 10px;
}

.sellers-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.sellers-revenue-stars { background: #FFD700; color: #333; }
.sellers-best-sellers { background: #C0C0C0; color: #333; }
.sellers-volume-leaders { background: #CD7F32; color: white; }

.popup-content {
  padding: 16px;
}

/* ROAS Hero Section */
.roas-hero-section {
  display: flex;
  gap: 20px;
  margin-bottom: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 10px;
  border: 1px solid #dee2e6;
}

.roas-metrics {
  flex: 1;
  display: flex;
  gap: 24px;
}

.roas-main {
  text-align: center;
}

.roas-label {
  font-size: 12px;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 4px;
}

.roas-value {
  font-size: 36px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 4px;
}

.roas-supporting {
  display: flex;
  gap: 20px;
  align-items: center;
}

.supporting-metric {
  text-align: center;
}

.supporting-label {
  font-size: 10px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.supporting-value {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 2px;
}

.health-confidence-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
  border: 1px solid #dee2e6;
  min-width: 120px;
}

.health-item, .confidence-item {
  text-align: center;
}

.health-label, .confidence-label {
  font-size: 10px;
  font-weight: 700;
  color: #6c757d;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}

.health-value {
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
}

.confidence-value {
  font-size: 14px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.confidence-high { background: #d4edda; color: #155724; }
.confidence-medium { background: #fff3cd; color: #856404; }
.confidence-low { background: #f8d7da; color: #721c24; }

/* Funnel & Classifications */
.funnel-classifications-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.funnel-rates {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
}

.funnel-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.funnel-icon {
  font-size: 24px;
}

.funnel-details {
  text-align: left;
}

.funnel-label {
  font-size: 10px;
  font-weight: 600;
  color: #6c757d;
  text-transform: uppercase;
}

.funnel-value {
  font-size: 16px;
  font-weight: 700;
  color: #212529;
}

.funnel-arrow {
  font-size: 20px;
  color: #6c757d;
}

.classifications-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.classification-item {
  padding: 10px;
  background: white;
  border-radius: 6px;
  border-left: 3px solid #0066cc;
  border-right: 1px solid #e9ecef;
  border-top: 1px solid #e9ecef;
  border-bottom: 1px solid #e9ecef;
}

.classification-label {
  font-size: 9px;
  font-weight: 700;
  color: #6c757d;
  margin-bottom: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.classification-value {
  font-size: 13px;
  font-weight: 700;
  color: #212529;
  line-height: 1.2;
  margin-bottom: 2px;
}

.classification-explanation {
  font-size: 10px;
  color: #6c757d;
  line-height: 1.3;
  font-style: italic;
  margin-top: 4px;
}

/* AI Recommendations */
.recommendations-section {
  background: #f0f8ff;
  border: 1px solid #b8daff;
}

.recommendations-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.recommendation-item {
  background: white;
  border-radius: 8px;
  padding: 12px;
  border-left: 4px solid;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.recommendation-item.priority-critical {
  border-left-color: #dc3545;
  background: #fff5f5;
}

.recommendation-item.priority-high {
  border-left-color: #fd7e14;
  background: #fff9f5;
}

.recommendation-item.priority-medium {
  border-left-color: #ffc107;
  background: #fffdf5;
}

.recommendation-item.priority-low {
  border-left-color: #6c757d;
  background: #f8f9fa;
}

.recommendation-header {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 6px;
}

.recommendation-priority {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
}

.priority-critical .recommendation-priority { background: #dc3545; color: white; }
.priority-high .recommendation-priority { background: #fd7e14; color: white; }
.priority-medium .recommendation-priority { background: #ffc107; color: #333; }
.priority-low .recommendation-priority { background: #6c757d; color: white; }

.recommendation-action {
  font-size: 14px;
  font-weight: 700;
  color: #212529;
  line-height: 1.3;
}

.recommendation-context {
  font-size: 12px;
  color: #495057;
  line-height: 1.4;
  padding-left: 4px;
  font-weight: 500;
}

/* Keep existing styles below */
.metric-section {
  margin-bottom: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  border: 1px solid #e9ecef;
}

.metric-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-title::before {
  content: '';
  width: 3px;
  height: 12px;
  background: #0066cc;
  border-radius: 2px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.metric-item {
  background: white;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  text-align: center;
}

.metric-label {
  font-size: 9px;
  color: #6c757d;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.2px;
  margin-bottom: 2px;
  display: block;
}

.metric-value {
  font-size: 15px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 2px;
}

.metric-trend {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  display: inline-block;
  padding: 2px 5px;
  border-radius: 3px;
  margin-top: 2px;
}

.trend-up { 
  color: #28a745; 
  background: rgba(40, 167, 69, 0.1);
}

.trend-down { 
  color: #dc3545; 
  background: rgba(220, 53, 69, 0.1);
}

.trend-neutral { 
  color: #6c757d; 
  background: rgba(108, 117, 125, 0.1);
}
/* Popup Tabs */
.popup-tabs {
  display: flex;
  background: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
  position: sticky;
  top: 48px; /* After header */
  z-index: 9;
}

.popup-tab {
  flex: 1;
  padding: 10px 16px;
  background: none;
  border: none;
  font-size: 12px;
  font-weight: 700;
  color: #666;
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
}

.popup-tab:hover {
  background: #ebebeb;
  color: #333;
}

.popup-tab.active {
  background: white;
  color: #0066cc;
  border-bottom: 2px solid #0066cc;
  margin-bottom: -2px;
}

.popup-tab-content {
  display: none;
  animation: fadeIn 0.3s ease;
}

.popup-tab-content.active {
  display: block;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Campaigns Tab Styles */
.campaigns-content {
  padding: 16px 0;
}

.campaigns-charts-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #e9ecef;
}

.campaigns-charts-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  align-items: center;
}

.campaign-chart-item {
  text-align: center;
}

.campaign-chart-container {
  width: 120px;
  height: 120px;
  margin: 0 auto;
}

.campaign-chart-label {
  font-size: 12px;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 8px;
}

.campaign-chart-value {
  font-size: 16px;
  font-weight: 700;
  color: #212529;
  margin-top: 4px;
}

.campaigns-table-section {
  padding: 0 16px;
}

.campaigns-metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.campaigns-metrics-table th {
  background: #f8f9fa;
  padding: 8px;
  text-align: left;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 10px;
  border-bottom: 2px solid #dee2e6;
}

.campaigns-metrics-table td {
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.campaigns-metrics-table tr:hover {
  background-color: #f8f9fa;
}

.campaign-name {
  font-weight: 600;
  color: #333;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Ranking Tab Styles */
.ranking-content {
  padding: 16px;
}

.ranking-map-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.ranking-map-table th {
  background: #f8f9fa;
  padding: 8px 6px;
  text-align: left;
  font-weight: 700;
  color: #495057;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-size: 9px;
  border-bottom: 2px solid #dee2e6;
  white-space: nowrap;
}

.ranking-map-table td {
  padding: 10px 6px;
  border-bottom: 1px solid #eee;
  white-space: nowrap;
}

.ranking-map-table tr:hover {
  background-color: #f8f9fa;
}

.segment-name {
  font-weight: 700;
  padding: 8px 12px !important;
  border-radius: 4px;
}

.segment-top-3 .segment-name {
  background-color: #d4f4d4;
  color: #2e7d32;
}

.segment-top-4-8 .segment-name {
  background-color: #ffffc2;
  color: #f57c00;
}

.segment-top-9-14 .segment-name {
  background-color: #ffe0bd;
  color: #ef6c00;
}

.segment-below-14 .segment-name {
  background-color: #ffcfcf;
  color: #c62828;
}

/* Loading states */
.campaigns-loading,
.ranking-loading {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 14px;
}
/* All Products Toggle */
.all-products-toggle-container {
  position: absolute;
  top: 10px;
  right: 700px; /* Positioned before metrics toggle */
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 8px;
}

.all-products-toggle {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.all-products-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.all-products-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 24px;
}

.all-products-slider:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: .4s;
  border-radius: 50%;
}

input:checked + .all-products-slider {
  background-color: #007aff;
}

input:checked + .all-products-slider:before {
  transform: translateX(20px);
}

.all-products-toggle-label {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

/* Style for myCompany products when showing all */
.product-cell .ad-details.my-company-highlight {
  border: 3px solid #28a745 !important;
  box-shadow: 0 0 8px rgba(40, 167, 69, 0.3);
}
.vis-badge-water {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #0056b3 0%, #007aff 50%, #5ac8fa 100%);
  transition: height 0.5s ease;
  z-index: 0;
  animation: wave 3s ease-in-out infinite;
  border-radius: 50%;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}
`;
document.head.appendChild(popupStyle);
  
    // Add this at the beginning of renderProductMapTable after checking for existing product-map-table-style
if (!document.getElementById("centered-panel-spinner-style")) {
  const spinnerStyle = document.createElement("style");
  spinnerStyle.id = "centered-panel-spinner-style";
  spinnerStyle.textContent = `
    .spinner {
      border: 4px solid rgba(0, 0, 0, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #007aff;
      display: inline-block;
      animation: spin 1s ease infinite;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(spinnerStyle);
}

    // Add these functions at the beginning of productMap.js (after the style definitions)

// Function to check if Google Ads integration is enabled
async function checkGoogleAdsIntegration() {
  try {
    const db = await window.dbPromise;
    const tableNames = await db.getAllObjectStoreNames();
    
    // Look for a table matching the pattern acc[number]_googleSheets_config
    const configTable = tableNames.find(name => /^acc\d+_googleSheets_config$/.test(name));
    
    if (configTable) {
      // Extract account number from table name
      const accountNumber = configTable.match(/acc(\d+)_/)[1];
      return { enabled: true, accountNumber };
    }
    
    return { enabled: false };
  } catch (error) {
    console.error('[ProductMap] Error checking Google Ads integration:', error);
    return { enabled: false };
  }
}

// Function to fetch product bucket data
async function fetchProductBucketData(accountNumber, productTitle) {
  try {
    const db = await window.dbPromise;
    const tableName = `acc${accountNumber}_googleSheets_productBuckets_30d`;
    
    // Check if table exists
    const tableNames = await db.getAllObjectStoreNames();
    if (!tableNames.includes(tableName)) {
      console.warn(`[ProductMap] Bucket table ${tableName} not found`);
      return null;
    }
    
    // Fetch all data from the table
    const tx = db.transaction(tableName, 'readonly');
    const store = tx.objectStore(tableName);
    const allData = await store.getAll();
    
    // Find matching product by title
    const bucketData = allData.find(item => {
      if (item.data && Array.isArray(item.data)) {
        return item.data.find(product => 
          product['Product Title'] && 
          product['Product Title'].toLowerCase() === productTitle.toLowerCase()
        );
      }
      return false;
    });
    
    if (bucketData && bucketData.data) {
      const productData = bucketData.data.find(product => 
        product['Product Title'] && 
        product['Product Title'].toLowerCase() === productTitle.toLowerCase()
      );
      return productData || null;
    }
    
    return null;
  } catch (error) {
    console.error('[ProductMap] Error fetching bucket data:', error);
    return null;
  }
}

// Function to load search terms statistics
async function loadSearchTermsStats(tablePrefix) {
  try {
    const tableName = `${tablePrefix}googleSheets_searchTerms_365d`;
    
    // Check if table exists
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      console.log(`[ProductMap] Search terms table ${tableName} not found`);
      return new Map();
    }
    
    // Open database and get data
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const searchTermsMap = new Map();
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data && Array.isArray(result.data)) {
          result.data.forEach(item => {
            if (item.Query) {
              // Normalize the query to lowercase for consistent matching
              const normalizedQuery = item.Query.toLowerCase().trim();
              searchTermsMap.set(normalizedQuery, {
                percentOfRevenue: (item['% of all revenue'] || 0) * 100, // Convert to percentage
                revenue: item.Value || 0,
                clicks: item.Clicks || 0,
                conversions: item.Conversions || 0,
                impressions: item.Impressions || 0,
                topBucket: item.Top_Bucket || null,
                cvr: item.Clicks > 0 ? ((item.Conversions || 0) / item.Clicks * 100) : 0
              });
            }
          });
          console.log(`[ProductMap] Loaded ${searchTermsMap.size} search term stats`);
        }
        resolve();
      };
      
      getRequest.onerror = () => {
        console.error('[ProductMap] Error loading search terms data');
        resolve();
      };
    });
    
    db.close();
    return searchTermsMap;
  } catch (error) {
    console.error('[ProductMap] Error in loadSearchTermsStats:', error);
    return new Map();
  }
}

// Function to load bucket averages data
async function loadBucketAverages(tablePrefix) {
  try {
    const tableName = `${tablePrefix}googleSheets_productBuckets_averages`;
    
    // Check if table exists
    const tableExists = await checkTableExists(tableName);
    if (!tableExists) {
      console.log(`[ProductMap] Bucket averages table ${tableName} not found`);
      return new Map();
    }
    
    // Open database and get data
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('myAppDB');
      request.onsuccess = (event) => resolve(event.target.result);
      request.onerror = () => reject(new Error('Failed to open database'));
    });
    
    const transaction = db.transaction(['projectData'], 'readonly');
    const objectStore = transaction.objectStore('projectData');
    const getRequest = objectStore.get(tableName);
    
    const averagesMap = new Map();
    
    await new Promise((resolve) => {
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result && result.data && Array.isArray(result.data)) {
          result.data.forEach(item => {
            if (item.device && item.metric && item.value) {
              // Create key as "DEVICE|METRIC"
              const key = `${item.device.toUpperCase()}|${item.metric}`;
              averagesMap.set(key, item.value);
            }
          });
          console.log(`[ProductMap] Loaded ${averagesMap.size} bucket averages`);
        }
        resolve();
      };
      
      getRequest.onerror = () => {
        console.error('[ProductMap] Error loading bucket averages data');
        resolve();
      };
    });
    
    db.close();
    return averagesMap;
  } catch (error) {
    console.error('[ProductMap] Error in loadBucketAverages:', error);
    return new Map();
  }
}

// Helper function to format revenue numbers
function formatRevenue(value) {
  if (!value || value === 0) return '$0';
  
  if (value >= 1000000) {
    return '$' + (value / 1000000).toFixed(1) + 'M';
  } else if (value >= 1000) {
    return '$' + (value / 1000).toFixed(1) + 'K';
  } else {
    return '$' + value.toFixed(0);
  }
}

  // Function to load company statistics data
async function loadCompanyStatsData() {
  // Check if company stats are already loaded
  if (window.company_serp_stats && window.company_serp_stats.length > 0) {
    return window.company_serp_stats;
  }
  
  // If projectTableData exists, we can derive company stats from it
  if (window.projectTableData && window.projectTableData.length > 0) {
    const companyStatsMap = new Map();
    
    window.projectTableData.forEach(item => {
      // Create a unique key for each company/term/location/device combination
      const key = `${item.company || 'Unknown'}|${item.searchTerm}|${item.location}|${item.device}`;
      
      if (!companyStatsMap.has(key)) {
        companyStatsMap.set(key, {
          searchTerm: item.searchTerm,
          location: item.location,
          device: item.device,
          rank: item.companyRank || 999,
          company: item.company || 'Unknown',
          top40: item.avgShare || 0,
          top40Trend: item.trendVal || 0,
          numProducts: 1, // Start with 1
          numOnSale: 0,
          improvedCount: 0,
          newCount: 0,
          declinedCount: 0,
          historical_data: []
        });
      } else {
        // Increment product count for this company
        const existingData = companyStatsMap.get(key);
        existingData.numProducts += 1;
      }
    });
    
    window.company_serp_stats = Array.from(companyStatsMap.values());
    return window.company_serp_stats;
  }
  
  // If no data available, return empty array
  console.warn('[ProductMap] No company statistics data available');
  return [];
}
  
    // Modified function to format location cell into three rows (city, state, country)
    function formatLocationCell(locationString) {
      if (!locationString) return locationString;
      const parts = locationString.split(",");
      const city = parts.shift() || locationString;
      
      // If we have more parts, separate state and country
      let state = "", country = "";
      if (parts.length === 1) {
        // Only one part left, assume it's the country
        country = parts[0].trim();
      } else if (parts.length >= 2) {
        // Multiple parts left, assume state and country
        state = parts.shift().trim();
        country = parts.join(",").trim();
      }
      
      return `
        <div class="city-line">${city}</div>
        ${state ? `<div class="state-line">${state}</div>` : ''}
        ${country ? `<div class="country-line">${country}</div>` : ''}
      `;
    }
  
    // Function to create market share pie chart
    function createMarketSharePieChart(containerId, shareValue) {
      const container = document.getElementById(containerId);
      if (!container) return;
      
      // Use ApexCharts to create a donut chart with improved styling
      const options = {
        series: [shareValue],
        chart: {
          height: 75,
          width: 75,
          type: 'radialBar',
          sparkline: {
            enabled: true
          }
        },
        plotOptions: {
          radialBar: {
            startAngle: -135,
            endAngle: 135,
            hollow: {
              size: '65%',
              background: '#fff'
            },
            track: {
              background: '#e7e7e7',
              strokeWidth: '97%',
              margin: 5
            },
            dataLabels: {
              name: {
                show: false
              },
              value: {
                fontSize: '16px',
                fontWeight: 600,
                show: true,
                offsetY: 5,
                formatter: function(val) {
                  // Round to one decimal place
                  return parseFloat(val).toFixed(1) + '%';
                }
              }
            }
          }
        },
        fill: {
          type: 'solid',
          colors: ['#007aff']
        },
        stroke: {
          lineCap: 'round'
        }
      };
      
      // Create chart instance
      const chart = new ApexCharts(container, options);
      chart.render();
    }
  
    // Function to calculate aggregate segment data for a set of products
    function calculateAggregateSegmentData(products) {
      if (!products || products.length === 0) return null;
      
      // Define date ranges
      const globalLastDate = moment().subtract(1, "days"); // Use yesterday as the reference point
      const endDate = globalLastDate.clone();
      const startDate = endDate.clone().subtract(6, "days"); // Last 7 days
      
      // For previous period
      const prevEnd = startDate.clone().subtract(1, "days");
      const prevStart = prevEnd.clone().subtract(6, "days");
      
      let currTop3Sum = 0, currTop8Sum = 0, currTop14Sum = 0, currTop40Sum = 0;
      let prevTop3Sum = 0, prevTop8Sum = 0, prevTop14Sum = 0, prevTop40Sum = 0;
      let countCurrent = 0, countPrevious = 0;
      
      // Helper function to calculate average
      function avg(arr, field, multiplier = 1) {
        if (!arr.length) return 0;
        let sum = 0, c = 0;
        arr.forEach(x => {
          if (x[field] != null) {
            sum += parseFloat(x[field]) * multiplier;
            c++;
          }
        });
        return c > 0 ? sum / c : 0;
      }
      
      // Process each product
      products.forEach(product => {
        const histData = product.historical_data || [];
        
        // Filter for current and previous periods
        const currentFiltered = histData.filter(item => {
          if (!item.date || !item.date.value) return false;
          const d = moment(item.date.value, "YYYY-MM-DD");
          return d.isBetween(startDate, endDate, "day", "[]");
        });
        
        const prevFiltered = histData.filter(item => {
          if (!item.date || !item.date.value) return false;
          const d = moment(item.date.value, "YYYY-MM-DD");
          return d.isBetween(prevStart, prevEnd, "day", "[]");
        });
        
        // Add to sums if data exists
        if (currentFiltered.length > 0) {
          currTop3Sum += avg(currentFiltered, "top3_visibility", 100);
          currTop8Sum += avg(currentFiltered, "top8_visibility", 100);
          currTop14Sum += avg(currentFiltered, "top14_visibility", 100);
          currTop40Sum += avg(currentFiltered, "top40_visibility", 100) || avg(currentFiltered, "market_share", 100);
          countCurrent++;
        }
        
        if (prevFiltered.length > 0) {
          prevTop3Sum += avg(prevFiltered, "top3_visibility", 100);
          prevTop8Sum += avg(prevFiltered, "top8_visibility", 100);
          prevTop14Sum += avg(prevFiltered, "top14_visibility", 100);
          prevTop40Sum += avg(prevFiltered, "top40_visibility", 100) || avg(prevFiltered, "market_share", 100);
          countPrevious++;
        }
      });
      
      // Calculate averages
      const currTop3 = countCurrent > 0 ? currTop3Sum / countCurrent : 0;
      const currTop8 = countCurrent > 0 ? currTop8Sum / countCurrent : 0;
      const currTop14 = countCurrent > 0 ? currTop14Sum / countCurrent : 0;
      const currTop40 = countCurrent > 0 ? currTop40Sum / countCurrent : 0;
      
      const prevTop3 = countPrevious > 0 ? prevTop3Sum / countPrevious : 0;
      const prevTop8 = countPrevious > 0 ? prevTop8Sum / countPrevious : 0;
      const prevTop14 = countPrevious > 0 ? prevTop14Sum / countPrevious : 0;
      const prevTop40 = countPrevious > 0 ? prevTop40Sum / countPrevious : 0;
      
      // Format data for chart
      return [
        { label: "Top3", current: currTop3, previous: prevTop3 },
        { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
        { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
        { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
      ];
    }
    
// Function to create segment chart
function createSegmentationChart(containerId, chartData, termParam, locParam, deviceParam, myCompanyParam, activeCount, inactiveCount, segmentCounts) {
  // Create a unique ID for the chart
  const chartContainer = document.getElementById(containerId);
  if (!chartContainer) return;
  chartContainer.classList.remove('loading');
  
  if (!chartData || chartData.length === 0) {
    chartContainer.innerHTML = '<div class="no-data-message">No segment data</div>';
    return;
  }
  
  // Clear the container and set FIXED dimensions
  chartContainer.innerHTML = '';
  chartContainer.style.height = '380px'; // Fixed total height
  chartContainer.style.maxHeight = '380px';
  chartContainer.style.overflowY = 'hidden';
  chartContainer.style.display = 'flex';
  chartContainer.style.flexDirection = 'column';
  chartContainer.style.alignItems = 'center';
  
  // Create a wrapper for chart and counts side by side
  const chartAndCountsWrapper = document.createElement('div');
  chartAndCountsWrapper.style.width = '100%';
  chartAndCountsWrapper.style.height = '280px';
  chartAndCountsWrapper.style.display = 'flex';
  chartAndCountsWrapper.style.alignItems = 'center';
  chartAndCountsWrapper.style.marginBottom = '10px';
  chartContainer.appendChild(chartAndCountsWrapper);
  
  // Create canvas wrapper div
  const canvasWrapper = document.createElement('div');
  canvasWrapper.style.flex = '1';
  canvasWrapper.style.height = '100%';
  canvasWrapper.style.position = 'relative';
  chartAndCountsWrapper.appendChild(canvasWrapper);
  
  // Create product counts column
  const countsColumn = document.createElement('div');
  countsColumn.style.width = '40px';
  countsColumn.style.height = '100%';
  countsColumn.style.display = 'flex';
  countsColumn.style.flexDirection = 'column';
  countsColumn.style.justifyContent = 'center';
  countsColumn.style.paddingLeft = '5px';
  chartAndCountsWrapper.appendChild(countsColumn);
  
// Add product count labels for each segment
  const segmentLabels = ['Top3', 'Top4-8', 'Top9-14', 'Below14'];
  const segmentClasses = ['segment-count-top3', 'segment-count-top4-8', 'segment-count-top9-14', 'segment-count-below14'];
  
  segmentLabels.forEach((label, index) => {
    const countDiv = document.createElement('div');
    countDiv.style.height = '25%';
    countDiv.style.display = 'flex';
    countDiv.style.alignItems = 'center';
    countDiv.style.justifyContent = 'center';
    
    const count = segmentCounts ? segmentCounts[index] : 0;
    if (count > 0) {
      const circle = document.createElement('div');
      circle.className = 'segment-count-circle ' + segmentClasses[index];
      circle.textContent = count;
      countDiv.appendChild(circle);
    }
    
    countsColumn.appendChild(countDiv);
  });
  
  // Create canvas element inside the wrapper
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvasWrapper.appendChild(canvas);
  
  // Create the product count container with fixed height
  const countContainer = document.createElement('div');
  countContainer.style.width = '250px';
  countContainer.style.height = '80px'; // Fixed height
  countContainer.style.maxHeight = '80px';
  countContainer.style.display = 'grid';
  countContainer.style.gridTemplateColumns = '1fr 1fr';
  countContainer.style.gridTemplateRows = 'auto auto';
  countContainer.style.gap = '4px';
  countContainer.style.padding = '8px';
  countContainer.style.backgroundColor = '#f9f9f9';
  countContainer.style.borderRadius = '8px';
  countContainer.style.fontSize = '14px';
  countContainer.style.boxSizing = 'border-box';

  console.log(`[DEBUG] Using provided counts - Active: ${activeCount}, Inactive: ${inactiveCount}`);
  
  countContainer.innerHTML = `
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Active:</div>
    <div style="font-weight: 700; color: #4CAF50;">${activeCount}</div>
    <div style="font-weight: 500; color: #555; font-size: 12px; text-align: right; padding-right: 8px;">Inactive:</div>
    <div style="font-weight: 700; color: #9e9e9e;">${inactiveCount}</div>
  `;
  
  // Add the count container to the chart container
  chartContainer.appendChild(countContainer);
  
  // Create chart with original settings (no modifications for product counts)
  new Chart(canvas, {
    type: "bar",
    data: {
      labels: chartData.map(d => d.label),
      datasets: [
        {
          label: "Current",
          data: chartData.map(d => d.current),
          backgroundColor: "#007aff",
          borderRadius: 4
        },
        {
          label: "Previous",
          type: "line",
          data: chartData.map(d => d.previous),
          borderColor: "rgba(255,0,0,1)",
          backgroundColor: "rgba(255,0,0,0.2)",
          fill: true,
          tension: 0.3,
          borderWidth: 2
        }
      ]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      onResize: null,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const val = ctx.parsed.x;
              const productCount = segmentCounts ? segmentCounts[ctx.dataIndex] : 0;
              const productInfo = productCount > 0 ? ` (${productCount} products)` : '';
              return `${ctx.dataset.label}: ${val.toFixed(2)}%${productInfo}`;
            }
          }
        },
        datalabels: {
          display: ctx => ctx.datasetIndex === 0,
          formatter: (value, context) => {
            const row = chartData[context.dataIndex];
            const mainLabel = `${row.current.toFixed(1)}%`;
            const diff = row.current - row.previous;
            const absDiff = Math.abs(diff).toFixed(1);
            const arrow = diff > 0 ? "▲" : diff < 0 ? "▼" : "±";
            return [ mainLabel, `${arrow}${absDiff}%` ];
          },
          color: ctx => {
            const row = chartData[ctx.dataIndex];
            const diff = row.current - row.previous;
            if (diff > 0) return "green";
            if (diff < 0) return "red";
            return "#444";
          },
          anchor: "end",
          align: "end",
          offset: 8,
          font: { size: 10 }
        }
      },
      scales: {
        x: { display: false, min: 0, max: 100 },
        y: { display: true, grid: { display: false }, ticks: { font: { size: 11 } } }
      },
      animation: false
    }
  });
}
  
    // Process the data into a hierarchical structure
    const nestedMap = {};
    window.projectTableData.forEach(item => {
      const term = item.searchTerm || "(no term)";
      const loc  = item.location   || "(no loc)";
      if (!nestedMap[term]) nestedMap[term] = {};
      if (!nestedMap[term][loc]) nestedMap[term][loc] = [];
      nestedMap[term][loc].push(item);
    });

  // Create the table element (ADD THESE LINES)
const table = document.createElement("table");
table.className = "product-map-table";
  
const thead = document.createElement("thead");
const isCompaniesMode = currentMode === 'companies';
thead.innerHTML = `
  <tr>
    <th>Search Term</th>
    <th>Location</th>
    <th>Device</th>
    <th>Top 40 Segmentation</th>
    <th class="products-header">Products</th>
    <th class="companies-header">Companies</th>
  </tr>
`;
table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    // Get the shopping ad template
    const adTemplate = document.getElementById("shopping-ad-template").innerHTML;
    const compiledTemplate = Handlebars.compile(adTemplate);
  
    console.log("[renderProductMapTable] Processing search terms");
    
    // Create a map of locations to color classes
    const locationColorMap = {};
    const allLocationsList = [];
    Object.values(nestedMap).forEach(locObj => {
      Object.keys(locObj).forEach(loc => {
        if (!allLocationsList.includes(loc)) {
          allLocationsList.push(loc);
        }
      });
    });
    
    // Assign color classes to locations
    allLocationsList.sort().forEach((loc, index) => {
      const colorIndex = (index % 10) + 1; // Use 10 different color classes
      locationColorMap[loc] = `location-bg-${colorIndex}`;
    });
    
    // Counter for unique chart IDs
    let chartCounter = 0;
    // Counter for unique pie chart IDs
    let pieChartCounter = 0;
    
    // Iterate through search terms
    const searchTerms = Object.keys(nestedMap).sort();
    searchTerms.forEach(term => {
      const locObj = nestedMap[term];
      const allLocs = Object.keys(locObj).sort();
  
      // Calculate total rows needed for this search term
      let totalRowsForTerm = 0;
      allLocs.forEach(loc => {
        totalRowsForTerm += locObj[loc].length;
      });
  
      let termCellUsed = false;
      
      // Iterate through locations for this search term
      allLocs.forEach(loc => {
        const deviceRows = locObj[loc];
        let locCellUsed = false;
        
        // Get the color class for this location
        const locationColorClass = locationColorMap[loc];
  
        // Iterate through devices for this location
        deviceRows.forEach(rowData => {
          const tr = document.createElement("tr");
  
// Add search term cell (with rowspan for all rows in this term) - MODIFIED as tag
if (!termCellUsed) {
  const tdTerm = document.createElement("td");
  tdTerm.rowSpan = totalRowsForTerm;
  tdTerm.style.verticalAlign = 'top'; // Align content to top
  tdTerm.style.paddingTop = '16px'; // Add top padding
  
  // Create container for search term and stats
  let searchTermHTML = '<div class="search-term-with-stats">';
  searchTermHTML += `<div class="search-term-tag">${term}</div>`;
  
  // Check if we have stats for this search term
  const normalizedTerm = term.toLowerCase().trim();
  const termStats = searchTermsStatsMap.get(normalizedTerm);
  
  if (termStats) {
    searchTermHTML += '<div class="query-stats">';
    
    // Add Top Bucket as header if available
    if (termStats.topBucket) {
      const bucketNumber = termStats.topBucket.toLowerCase().replace('top', '');
      searchTermHTML += `
        <div class="top-bucket-header top${bucketNumber}">
          ${termStats.topBucket}
        </div>
      `;
    }
    
    searchTermHTML += '<div class="query-stats-content">';
    
    // % of all sales with info icon
    searchTermHTML += `
      <div class="query-stat-row sales">
        <span class="query-stat-label">% of Sales</span>
        <span class="query-stat-value sales">${termStats.percentOfRevenue.toFixed(2)}%</span>
        <span class="info-icon" title="Percentage of total revenue">i</span>
      </div>
    `;
    
    // Revenue (1 year) with info icon
    searchTermHTML += `
      <div class="query-stat-row revenue">
        <span class="query-stat-label">Revenue</span>
        <span class="query-stat-value revenue">${formatRevenue(termStats.revenue)}</span>
        <span class="info-icon" title="Total revenue (1 year)">i</span>
      </div>
    `;
    
    // CVR with info icon
    searchTermHTML += `
      <div class="query-stat-row cvr">
        <span class="query-stat-label">CVR</span>
        <span class="query-stat-value cvr">${termStats.cvr.toFixed(1)}%</span>
        <span class="info-icon" title="Conversion Rate">i</span>
      </div>
    `;
    
    searchTermHTML += '</div>'; // Close query-stats-content
    searchTermHTML += '</div>'; // Close query-stats
  } else {
    // Show a subtle message when no stats are available
    searchTermHTML += `
      <div class="query-stats" style="padding: 16px; background: #f8f9fa;">
        <div class="no-stats-message">No performance data</div>
      </div>
    `;
  }
  
  searchTermHTML += '</div>'; // Close search-term-with-stats
  
  tdTerm.innerHTML = searchTermHTML;
  tr.appendChild(tdTerm);
  termCellUsed = true;
}
  
          // Add location cell (with rowspan for all device rows in this location)
          if (!locCellUsed) {
            const tdLoc = document.createElement("td");
            tdLoc.rowSpan = deviceRows.length;
            tdLoc.innerHTML = formatLocationCell(loc);
            tdLoc.classList.add(locationColorClass);
            tr.appendChild(tdLoc);
            locCellUsed = true;
          }
  
          // Add device cell with pie chart for market share
          const tdDev = document.createElement("td");
          
          // Find the corresponding data in projectTableData for this term, location, device
          const projectData = window.projectTableData.find(item => 
            item.searchTerm === term && 
            item.location === loc &&
            item.device === rowData.device
          );
          
          // Create device container with three sections
          let deviceHTML = `<div class="device-container">`;
          
          // 1. Device type
          deviceHTML += `<div class="device-type"><img src="${rowData.device.toLowerCase().includes('mobile') ? 'https://static.wixstatic.com/media/0eae2a_6764753e06f447db8d537d31ef5050db~mv2.png' : 'https://static.wixstatic.com/media/0eae2a_e3c9d599fa2b468c99191c4bdd31f326~mv2.png'}" alt="${rowData.device}" class="device-icon" /></div>`;
          
          // 2. Avg Rank with header
          if (projectData && projectData.avgRank !== undefined) {
            const rankVal = projectData.avgRank.toFixed(2);
            let rankArrow = "±", rankColor = "#444";
            
            if (projectData.rankChange !== undefined) {
              if (projectData.rankChange < 0) {
                rankArrow = "▲"; 
                rankColor = "green";
              } else if (projectData.rankChange > 0) {
                rankArrow = "▼"; 
                rankColor = "red";
              }
            }
            
            deviceHTML += `
              <div class="device-rank">
                <div class="section-header">Avg Rank</div>
                <div class="device-rank-value">${rankVal}</div>
                <div class="device-trend" style="color:${rankColor};">
                  ${rankArrow} ${Math.abs(projectData.rankChange || 0).toFixed(2)}
                </div>
              </div>
            `;
          } else {
            deviceHTML += `
              <div class="device-rank">
                <div class="section-header">Avg Rank</div>
                <div class="device-rank-value">-</div>
              </div>
            `;
          }
          
          // 3. Market Share with pie chart - MODIFIED
          const pieChartId = `market-share-pie-${pieChartCounter++}`;
          
          deviceHTML += `
            <div class="device-share">
              <div class="section-header">Market Share</div>
              <div id="${pieChartId}" class="pie-chart-container"></div>
          `;
          
          // Add trend below pie chart
          if (projectData && projectData.trendVal !== undefined) {
            let shareArrow = "±", shareColor = "#333";
            
            if (projectData.trendVal > 0) {
              shareArrow = "▲";
              shareColor = "green";
            } else if (projectData.trendVal < 0) {
              shareArrow = "▼";
              shareColor = "red";
            }
            
            deviceHTML += `
              <div class="device-trend" style="color:${shareColor};">
                ${shareArrow} ${Math.abs(projectData.trendVal || 0).toFixed(1)}%
              </div>
            `;
          }
          
          deviceHTML += `</div>`; // Close device-share
// Find the latest tracking date from all active products
let latestDate = null;

if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in all historical data
  const allProductsForDevice = window.allRows.filter(p => 
    p.q === term &&
    p.location_requested === loc &&
    p.device === rowData.device &&
    p.source && p.source.toLowerCase() === (companyToFilter || "").toLowerCase()
  );

  allProductsForDevice.forEach(product => {
    if (product.historical_data && Array.isArray(product.historical_data)) {
      product.historical_data.forEach(item => {
        if (item.date && item.date.value) {
          const itemDate = moment(item.date.value, 'YYYY-MM-DD');
          if (latestDate === null || itemDate.isAfter(latestDate)) {
            latestDate = itemDate.clone();
          }
        }
      });
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}

// Add last tracked container
deviceHTML += `<div class="last-tracked-container">
  <div class="last-tracked-label">Last time tracked:</div>`;

if (latestDate) {
  const today = moment().startOf('day');
  const yesterday = moment().subtract(1, 'days').startOf('day');
  const daysDiff = today.diff(latestDate, 'days');
  
  let lastTrackedText = '';
  let trackingClass = '';
  
  if (daysDiff === 0) {
    lastTrackedText = 'Today';
    trackingClass = 'recent-tracking';
  } else if (daysDiff === 1) {
    lastTrackedText = 'Yesterday';
    trackingClass = 'recent-tracking';
  } else if (daysDiff <= 7) {
    lastTrackedText = `${daysDiff} days ago`;
    trackingClass = 'moderate-tracking';
  } else {
    lastTrackedText = `${daysDiff} days ago`;
    trackingClass = 'old-tracking';
  }
  
  deviceHTML += `<div class="last-tracked-value ${trackingClass}">${lastTrackedText}</div>`;
} else {
  deviceHTML += `<div class="last-tracked-value">Not tracked</div>`;
}

deviceHTML += `</div>`; // Close last-tracked-container
          deviceHTML += `</div>`; // Close device-container
          
          tdDev.innerHTML = deviceHTML;
          
          // Apply background based on device type
          const deviceLower = rowData.device.toLowerCase();
          if (deviceLower.includes('desktop')) {
            tdDev.classList.add('device-desktop');
          } else if (deviceLower.includes('mobile')) {
            tdDev.classList.add('device-mobile');
          }
          
          tr.appendChild(tdDev);
          
          // Add Top 40 Segmentation cell
          const tdSegmentation = document.createElement("td");
          const chartContainerId = `segmentation-chart-${chartCounter++}`;
          tdSegmentation.innerHTML = `<div id="${chartContainerId}" class="segmentation-chart-container loading"></div>`;
          tr.appendChild(tdSegmentation);
  
// Add products cell
const tdProducts = document.createElement("td");
tdProducts.className = "products-column";
tdProducts.style.width = "100%";
tdProducts.style.minWidth = "400px";

// Create product cell container (for Products view)
const productCellContainer = document.createElement("div");
productCellContainer.classList.add("product-cell-container");
productCellContainer.style.width = "100%";
productCellContainer.style.height = "100%";

// Create product container
const productCellDiv = document.createElement("div");
productCellDiv.classList.add("product-cell");
productCellContainer.appendChild(productCellDiv);
tdProducts.appendChild(productCellContainer);

// Create products chart container (for Charts view)
const productsChartContainer = document.createElement("div");
productsChartContainer.classList.add("products-chart-container");

// Create chart-products container
const chartProductsDiv = document.createElement("div");
chartProductsDiv.classList.add("chart-products");

// Create chart-avg-position container
const chartAvgPositionDiv = document.createElement("div");
chartAvgPositionDiv.classList.add("chart-avg-position");
chartAvgPositionDiv.innerHTML = '<div>Average Position Chart (Coming Soon)</div>';

productsChartContainer.appendChild(chartProductsDiv);
productsChartContainer.appendChild(chartAvgPositionDiv);
tdProducts.appendChild(productsChartContainer);
  
          // Find and display matching products
          if (window.allRows && Array.isArray(window.allRows)) {
            console.log(`[renderProductMapTable] Finding products for ${term}, ${loc}, ${rowData.device}`);
            
// Check if we should show all products or just myCompany
            const showAllProducts = window.showAllProductsInMap || false;
            
            let matchingProducts;
            if (showAllProducts) {
              // Show all products that match term, location, and device
              matchingProducts = window.allRows.filter(p => 
                p.q === term &&
                p.location_requested === loc &&
                p.device === rowData.device
              );
            } else {
              // Show only myCompany products (default behavior)
              matchingProducts = window.allRows.filter(p => 
                p.q === term &&
                p.location_requested === loc &&
                p.device === rowData.device &&
                p.source && p.source.toLowerCase() === (companyToFilter || "").toLowerCase()
              );
            }
            
            // Mark which products are from myCompany for styling
            matchingProducts.forEach(product => {
              product._isMyCompany = product.source && 
                product.source.toLowerCase() === (companyToFilter || "").toLowerCase();
            });
  
            console.log(`[renderProductMapTable] Found ${matchingProducts.length} matching products for ${window.myCompany}`);
  
// Store the data we'll need later
// For chart data, ALWAYS use myCompany filtered products
const myCompanyProducts = window.allRows.filter(p => 
  p.q === term &&
  p.location_requested === loc &&
  p.device === rowData.device &&
  p.source && p.source.toLowerCase() === (companyToFilter || "").toLowerCase()
);

const chartData = calculateAggregateSegmentData(myCompanyProducts);

// Filter active and inactive products FROM myCompany products for stats
const activeProducts = myCompanyProducts.filter(product => 
  product.product_status === 'active' || !product.product_status
);

const inactiveProducts = myCompanyProducts.filter(product => 
  product.product_status === 'inactive'
);

// Store the data we'll need later
const chartInfo = {
  containerId: chartContainerId,
  data: chartData,
  term: term,
  location: loc,
  device: rowData.device,
  company: companyToFilter,
  activeCount: activeProducts.length,
  inactiveCount: inactiveProducts.length,
  pieChartId: pieChartId,
  projectData: projectData,
  productCellDiv: productCellDiv // Add reference to the product cell
};

// Add to pending charts array instead of creating immediately
if (!window.pendingSegmentationCharts) {
  window.pendingSegmentationCharts = [];
}
window.pendingSegmentationCharts.push(chartInfo);
  
            if (matchingProducts.length === 0) {
              productCellDiv.innerHTML = '<div class="no-products">–</div>';
            } else {
              // Debug: Log product cell width
              console.log(`[renderProductMapTable] Product cell width for ${term}/${loc}/${rowData.device}: ${productCellDiv.offsetWidth}px`);
              console.log("[DEBUG] Product cell HTML structure:", productCellDiv.innerHTML.substring(0, 200) + "...");
             console.log("[DEBUG] Product cell has", productCellDiv.querySelectorAll('*').length, "elements,", 
             productCellDiv.querySelectorAll('.ad-details').length, "with class 'ad-details'");
  
// Sort products by average position for the 7-day period (best/lowest position first)
matchingProducts.forEach(product => {
  // Calculate the 7-day average position for sorting
  if (product.historical_data && product.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
    
    if (latestDate) {
      // Define the 7-day window
      const endDate = latestDate.clone();
      const startDate = endDate.clone().subtract(6, 'days');
      
      // Filter for current 7-day period
      const currentPeriodData = product.historical_data.filter(item => {
        if (!item.date || !item.date.value || !item.avg_position) return false;
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        return itemDate.isBetween(startDate, endDate, 'day', '[]');
      });
      
      // Calculate average position
      let sum = 0;
      let count = 0;
      currentPeriodData.forEach(item => {
        const pos = parseFloat(item.avg_position);
        if (!isNaN(pos)) {
          sum += pos;
          count++;
        }
      });
      
      product._sortingAvgPos = count > 0 ? sum / count : 999999;
    } else {
      product._sortingAvgPos = 999999;
    }
  } else {
    product._sortingAvgPos = 999999;
  }
});

// Now sort by the calculated average position
matchingProducts.sort((a, b) => {
  return a._sortingAvgPos - b._sortingAvgPos; // Sort by ascending position (lowest/best first)
});
              
              // Create a floating card for each product
              // In the matchingProducts.forEach loop in renderProductMapTable:

              // First sort products by status (active first, then inactive)
              const activeProducts = matchingProducts.filter(product => 
                product.product_status === 'active' || !product.product_status
              );
              const inactiveProducts = matchingProducts.filter(product => 
                product.product_status === 'inactive'
              );
              
              console.log(`[DEBUG] Products sorted: ${activeProducts.length} active, ${inactiveProducts.length} inactive`);
              
              // Process active products first
              activeProducts.forEach((product, productIndex) => {
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
                  // 2. Make sure the stars array is properly formatted
                  enhancedProduct.stars = [];
                  const rating = parseFloat(enhancedProduct.rating) || 4.5;
                  for (let i = 0; i < 5; i++) {
                    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                    enhancedProduct.stars.push({ fill });
                  }
                  
                  // 3. PRESERVE ONLY REAL HISTORICAL DATA - NO SYNTHETIC DATA
                  if (!enhancedProduct.historical_data || !Array.isArray(enhancedProduct.historical_data)) {
                    enhancedProduct.historical_data = [];
                  } else {
                    // Fix any data parsing issues in the original historical data
                    enhancedProduct.historical_data = enhancedProduct.historical_data.map(entry => {
                      if (entry.avg_position) {
                        // Ensure avg_position is a valid number by parsing and formatting
                        const cleanPosition = parseFloat(entry.avg_position);
                        if (!isNaN(cleanPosition)) {
                          entry.avg_position = cleanPosition.toFixed(2);
                        }
                      }
                      return entry;
                    });
                  }
                  
                  // 4. Ensure other required fields are present
                  // Calculate real position and trend using historical data
                  if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
                  
                    // If no valid dates found, we can't calculate anything
                    if (!latestDate) {
                      enhancedProduct.finalPosition = "-";
                      enhancedProduct.finalSlope = "";
                      enhancedProduct.arrow = "";
                      enhancedProduct.posBadgeBackground = "gray";
                    } else {
                      // Define the 7-day time windows based on the latest available date
                      const endDate = latestDate.clone();
                      const startDate = endDate.clone().subtract(6, 'days'); // Last 7 days including end date
                      
                      // Previous period
                      const prevEndDate = startDate.clone().subtract(1, 'days');
                      const prevStartDate = prevEndDate.clone().subtract(6, 'days');
                      
                      // Filter for current 7-day period
                      const currentPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(startDate, endDate, 'day', '[]');
                      });
                      
                      // Filter for previous 7-day period
                      const prevPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
                      });
                      
                      // Calculate average position for current period
                      let currentAvgPos = 0;
                      if (currentPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        currentPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        currentAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate average position for previous period
                      let prevAvgPos = 0;
                      if (prevPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        prevPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        prevAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate trend (change in position)
                      let slope = 0;
                      if (currentAvgPos > 0 && prevAvgPos > 0) {
                        slope = currentAvgPos - prevAvgPos;
                      }
                      
                      // Set the badge values
                      if (currentAvgPos > 0) {
                        // Format to 1 decimal place, avoid .0 suffix
                        const formattedPos = currentAvgPos.toFixed(1).replace(/\.0$/, '');
                        enhancedProduct.finalPosition = formattedPos;
                        
                        if (slope !== 0) {
                          // For position, DOWN (▼) is GOOD, UP (▲) is BAD
                          if (slope > 0) {
                            enhancedProduct.arrow = "▼"; // Position got worse
                            enhancedProduct.posBadgeBackground = "red";
                          } else {
                            enhancedProduct.arrow = "▲"; // Position improved
                            enhancedProduct.posBadgeBackground = "green";
                          }
                          
                          // Format slope to 1 decimal place, remove negative sign for improved, add for worsened
                          const slopeAbs = Math.abs(slope).toFixed(1).replace(/\.0$/, '');
                          enhancedProduct.finalSlope = slope < 0 ? slopeAbs : `-${slopeAbs}`;
                        } else {
                          enhancedProduct.arrow = "";
                          enhancedProduct.finalSlope = "";
                          enhancedProduct.posBadgeBackground = "gray";
                        }
                      } else {
                        // No valid position data
                        enhancedProduct.finalPosition = "-";
                        enhancedProduct.finalSlope = "";
                        enhancedProduct.arrow = "";
                        enhancedProduct.posBadgeBackground = "gray";
                      }
                    }
                  } else {
                    // No historical data available
                    enhancedProduct.finalPosition = "-";
                    enhancedProduct.finalSlope = "";
                    enhancedProduct.arrow = "";
                    enhancedProduct.posBadgeBackground = "gray";
                  }
              
// Calculate visibility for the 7-day period
let visibilityBarValue = 0;
if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0 && latestDate) {
  // Use the same date range as position calculation
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const periodDays = 7;
  
  // Sum visibility for the period
  let sum = 0;
  enhancedProduct.historical_data.forEach((item) => {
    if (item.date && item.date.value) {
      const d = moment(item.date.value, "YYYY-MM-DD");
      if (d.isBetween(startDate, endDate, "day", "[]")) {
        if (item.visibility != null) {
          sum += parseFloat(item.visibility);
        }
      }
    }
  });
  
  // Average is sum divided by number of days (not number of records)
  let avgDailyVis = sum / periodDays;
  
  // Convert to 0-100 integer
  visibilityBarValue = Math.round(avgDailyVis * 100);
}
enhancedProduct.visibilityBarValue = visibilityBarValue || 0;
                  
// 5. Most importantly: Add this FULLY enhanced product to globalRows
window.globalRows[pmIndexKey] = enhancedProduct;

// ADD BUCKET LOGIC HERE:
// Get bucket data for this product
let bucketBadgeHTML = '';
let roasBadgeHTML = '';
let metricsPanelHTML = '';
let hasBucketClass = '';
let containerClass = '';
let productBucketData = null; // Declare it outside the if block

if (googleAdsEnabled && bucketDataMap.size > 0) {
  // Normalize device value from current row to uppercase
  const deviceValue = (rowData.device || '').toUpperCase();
  const lookupKey = `${enhancedProduct.title.toLowerCase()}|${deviceValue}`;
  
  console.log(`[ProductMap] Looking up bucket for: "${lookupKey}"`); // Debug log
  
  productBucketData = bucketDataMap.get(lookupKey); // Remove const, just assign
  
  if (productBucketData) {
    // Get SELLERS value by default (since it's now the default)
    const bucketResult = getBucketBadgeHTML(productBucketData, 'SELLERS');
    bucketBadgeHTML = bucketResult.badgeHTML;
    containerClass = bucketResult.containerClass;
    
    // Get ROAS badge
    roasBadgeHTML = getROASBadgeHTML(productBucketData);
    
    // Get metrics panel
    metricsPanelHTML = getMetricsPanelHTML(productBucketData);
    
    if (bucketBadgeHTML) {
      hasBucketClass = 'has-bucket';
      
      // Log for debugging
      console.log(`[ProductMap] Product "${enhancedProduct.title}" on ${deviceValue} has bucket:`, productBucketData['SELLERS']);
    }
  } else {
    // Debug: log why no match
    if (bucketDataMap.size > 0) {
      console.log(`[ProductMap] No bucket match for: "${lookupKey}"`);
      // Log first few keys to see format
      const sampleKeys = Array.from(bucketDataMap.keys()).slice(0, 3);
      console.log(`[ProductMap] Sample bucket keys:`, sampleKeys);
    }
    
    // Create empty metrics panel even without data
    metricsPanelHTML = getMetricsPanelHTML(null);
  }
}

// Add bucket info to enhancedProduct
enhancedProduct.bucketBadgeHTML = bucketBadgeHTML;
enhancedProduct.roasBadgeHTML = roasBadgeHTML;
enhancedProduct.metricsPanelHTML = metricsPanelHTML;
enhancedProduct.hasBucketClass = hasBucketClass;
enhancedProduct.containerClass = containerClass;
                  
// Now render the product with the same enhanced data
                  const html = compiledTemplate(enhancedProduct);
                  const tempDiv = document.createElement('div');
                  tempDiv.innerHTML = html;
                  
                  // Get just the first element (the ad-details div)
                  const adCard = tempDiv.firstElementChild;
                  adCard.classList.remove('my-company');
                  // Add highlight if showing all products and this is myCompany
                  if (window.showAllProductsInMap && enhancedProduct._isMyCompany) {
                    adCard.classList.add('my-company-highlight');
                  }

// Add has-bucket class if applicable
if (hasBucketClass) {
  adCard.classList.add(hasBucketClass);
}

// Add container class for sellers bucket styling
if (containerClass) {
  adCard.classList.add(containerClass);
}

// Insert bucket badge as the first child of ad-details
if (bucketBadgeHTML) {
  adCard.insertAdjacentHTML('afterbegin', bucketBadgeHTML);
}

// Insert ROAS badge over the image
if (roasBadgeHTML) {
  const thumbnailContainer = adCard.querySelector('.ad-thumbnail-container');
  if (thumbnailContainer) {
    thumbnailContainer.insertAdjacentHTML('beforeend', roasBadgeHTML);
  }
}

// Check if we have actual metrics data
const hasMetricsData = productBucketData && (
  (productBucketData['Clicks'] && productBucketData['Clicks'] > 0) ||
  (productBucketData['Cost'] && productBucketData['Cost'] > 0) ||
  (productBucketData['Conversions'] && productBucketData['Conversions'] > 0) ||
  (productBucketData['Impressions'] && productBucketData['Impressions'] > 0)
);

// Only create wrapper if we have metrics data
if (hasMetricsData && metricsPanelHTML) {
  // Create wrapper div that will contain both ad card and metrics panel
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'card-wrapper';
  cardWrapper.setAttribute('data-has-metrics', 'true');
  
  // Set explicit width for ad card
  adCard.style.width = "150px";
  adCard.style.flexShrink = "0";
  
  // Add the ad card to wrapper
  cardWrapper.appendChild(adCard);
  
  // Create and add metrics panel
  const metricsPanel = document.createElement('div');
  metricsPanel.className = 'product-metrics-panel';
  metricsPanel.innerHTML = metricsPanelHTML;
  cardWrapper.appendChild(metricsPanel);
  
  // Add wrapper to the products cell
  productCellDiv.appendChild(cardWrapper);
} else {
  // No metrics data, just add the card directly
  adCard.style.width = "150px";
  adCard.style.flexShrink = "0";
  productCellDiv.appendChild(adCard);
}
                } catch (error) {
                  console.error("[renderProductMapTable] Error rendering product:", error);
                  console.error("[renderProductMapTable] Problem product:", JSON.stringify(product));
                }
              });
              
              // Then process inactive products with the same detailed logic
              inactiveProducts.forEach((product, productIndex) => {
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_inactive_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
                  // 2. Make sure the stars array is properly formatted
                  enhancedProduct.stars = [];
                  const rating = parseFloat(enhancedProduct.rating) || 4.5;
                  for (let i = 0; i < 5; i++) {
                    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
                    enhancedProduct.stars.push({ fill });
                  }
                  
                  // 3. PRESERVE ONLY REAL HISTORICAL DATA - NO SYNTHETIC DATA
                  if (!enhancedProduct.historical_data || !Array.isArray(enhancedProduct.historical_data)) {
                    enhancedProduct.historical_data = [];
                  } else {
                    // Fix any data parsing issues in the original historical data
                    enhancedProduct.historical_data = enhancedProduct.historical_data.map(entry => {
                      if (entry.avg_position) {
                        // Ensure avg_position is a valid number by parsing and formatting
                        const cleanPosition = parseFloat(entry.avg_position);
                        if (!isNaN(cleanPosition)) {
                          entry.avg_position = cleanPosition.toFixed(2);
                        }
                      }
                      return entry;
                    });
                  }
                  
                  // Log the actual historical data count
                  console.log(`[DEBUG] Inactive product '${enhancedProduct.title}' has ${enhancedProduct.historical_data.length} actual historical records`);
                  
                  // 4. Ensure other required fields are present
                  // Calculate real position and trend using historical data
                  if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0) {
// Determine end date based on control variable
let latestDate = null;
if (useLatestRecordAsEndDate) {
  // Old logic: Find the latest date in the historical data
  enhancedProduct.historical_data.forEach(item => {
    if (item.date && item.date.value) {
      const itemDate = moment(item.date.value, 'YYYY-MM-DD');
      if (latestDate === null || itemDate.isAfter(latestDate)) {
        latestDate = itemDate.clone();
      }
    }
  });
} else {
  // New logic: Use today's date
  latestDate = moment();
}
                  
                    // If no valid dates found, we can't calculate anything
                    if (!latestDate) {
                      enhancedProduct.finalPosition = "-";
                      enhancedProduct.finalSlope = "";
                      enhancedProduct.arrow = "";
                      enhancedProduct.posBadgeBackground = "gray";
                    } else {
                      // Define the 7-day time windows based on the latest available date
                      const endDate = latestDate.clone();
                      const startDate = endDate.clone().subtract(6, 'days'); // Last 7 days including end date
                      
                      // Previous period
                      const prevEndDate = startDate.clone().subtract(1, 'days');
                      const prevStartDate = prevEndDate.clone().subtract(6, 'days');
                      
                      // Filter for current 7-day period
                      const currentPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(startDate, endDate, 'day', '[]');
                      });
                      
                      // Filter for previous 7-day period
                      const prevPeriodData = enhancedProduct.historical_data.filter(item => {
                        if (!item.date || !item.date.value || !item.avg_position) return false;
                        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
                        return itemDate.isBetween(prevStartDate, prevEndDate, 'day', '[]');
                      });
                      
                      // Calculate average position for current period
                      let currentAvgPos = 0;
                      if (currentPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        currentPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        currentAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate average position for previous period
                      let prevAvgPos = 0;
                      if (prevPeriodData.length > 0) {
                        let sum = 0;
                        let count = 0;
                        prevPeriodData.forEach(item => {
                          const pos = parseFloat(item.avg_position);
                          if (!isNaN(pos)) {
                            sum += pos;
                            count++;
                          }
                        });
                        prevAvgPos = count > 0 ? sum / count : 0;
                      }
                      
                      // Calculate trend (change in position)
                      let slope = 0;
                      if (currentAvgPos > 0 && prevAvgPos > 0) {
                        slope = currentAvgPos - prevAvgPos;
                      }
                      
                      // Set the badge values
                      if (currentAvgPos > 0) {
                        // Format to 1 decimal place, avoid .0 suffix
                        const formattedPos = currentAvgPos.toFixed(1).replace(/\.0$/, '');
                        enhancedProduct.finalPosition = formattedPos;
                        
                        if (slope !== 0) {
                          // For position, DOWN (▼) is GOOD, UP (▲) is BAD
                          if (slope > 0) {
                            enhancedProduct.arrow = "▼"; // Position got worse
                            enhancedProduct.posBadgeBackground = "red";
                          } else {
                            enhancedProduct.arrow = "▲"; // Position improved
                            enhancedProduct.posBadgeBackground = "green";
                          }
                          
                          // Format slope to 1 decimal place, remove negative sign for improved, add for worsened
                          const slopeAbs = Math.abs(slope).toFixed(1).replace(/\.0$/, '');
                          enhancedProduct.finalSlope = slope < 0 ? slopeAbs : `-${slopeAbs}`;
                        } else {
                          enhancedProduct.arrow = "";
                          enhancedProduct.finalSlope = "";
                          enhancedProduct.posBadgeBackground = "gray";
                        }
                      } else {
                        // No valid position data
                        enhancedProduct.finalPosition = "-";
                        enhancedProduct.finalSlope = "";
                        enhancedProduct.arrow = "";
                        enhancedProduct.posBadgeBackground = "gray";
                      }
                    }
                  } else {
                    // No historical data available
                    enhancedProduct.finalPosition = "-";
                    enhancedProduct.finalSlope = "";
                    enhancedProduct.arrow = "";
                    enhancedProduct.posBadgeBackground = "gray";
                  }
              
// Calculate visibility for the 7-day period
let visibilityBarValue = 0;
if (enhancedProduct.historical_data && enhancedProduct.historical_data.length > 0 && latestDate) {
  // Use the same date range as position calculation
  const endDate = latestDate.clone();
  const startDate = endDate.clone().subtract(6, 'days');
  const periodDays = 7;
  
  // Sum visibility for the period
  let sum = 0;
  enhancedProduct.historical_data.forEach((item) => {
    if (item.date && item.date.value) {
      const d = moment(item.date.value, "YYYY-MM-DD");
      if (d.isBetween(startDate, endDate, "day", "[]")) {
        if (item.visibility != null) {
          sum += parseFloat(item.visibility);
        }
      }
    }
  });
  
  // Average is sum divided by number of days (not number of records)
  let avgDailyVis = sum / periodDays;
  
  // Convert to 0-100 integer
  visibilityBarValue = Math.round(avgDailyVis * 100);
}
enhancedProduct.visibilityBarValue = visibilityBarValue || 0;
                  
                  // 5. Most importantly: Add this FULLY enhanced product to globalRows
                  window.globalRows[pmIndexKey] = enhancedProduct;
                  console.log(`[DEBUG] Added inactive product to globalRows[${pmIndexKey}] with ${enhancedProduct.historical_data.length} real historical records`);

// Get bucket data for this product
let bucketBadgeHTML = '';
let hasBucketClass = '';
let roasBadgeHTML = '';
let metricsPanelHTML = '';
let containerClass = '';
let productBucketData = null; // Declare outside

if (googleAdsEnabled && bucketDataMap.size > 0) {
  // Normalize device value from current row to uppercase
  const deviceValue = (rowData.device || '').toUpperCase();
  const lookupKey = `${enhancedProduct.title.toLowerCase()}|${deviceValue}`;
  productBucketData = bucketDataMap.get(lookupKey);
  
  if (productBucketData) {
    // Get SELLERS value by default (since it's now the default)
    const bucketResult = getBucketBadgeHTML(productBucketData, 'SELLERS');
    bucketBadgeHTML = bucketResult.badgeHTML;
    containerClass = bucketResult.containerClass;
    
    // Get ROAS badge
    roasBadgeHTML = getROASBadgeHTML(productBucketData);
    
    // Get metrics panel
    metricsPanelHTML = getMetricsPanelHTML(productBucketData);
    
    if (bucketBadgeHTML) {
      hasBucketClass = 'has-bucket';
    }
  }
}

// Add bucket info to enhancedProduct
enhancedProduct.bucketBadgeHTML = bucketBadgeHTML;
enhancedProduct.roasBadgeHTML = roasBadgeHTML;
enhancedProduct.metricsPanelHTML = metricsPanelHTML;
enhancedProduct.hasBucketClass = hasBucketClass;
enhancedProduct.containerClass = containerClass;
                  
// Now render the product with the same enhanced data
const html = compiledTemplate(enhancedProduct);
const tempDiv = document.createElement('div');
tempDiv.innerHTML = html;

// Get just the first element (the ad-details div)
const adCard = tempDiv.firstElementChild;
adCard.classList.remove('my-company');
// Add highlight if showing all products and this is myCompany
                  if (window.showAllProductsInMap && enhancedProduct._isMyCompany) {
                    adCard.classList.add('my-company-highlight');
                  }

// Add has-bucket class if applicable
if (hasBucketClass) {
  adCard.classList.add(hasBucketClass);
}

// Add container class for sellers bucket styling
if (containerClass) {
  adCard.classList.add(containerClass);
}

// Insert bucket badge as the first child of ad-details
if (bucketBadgeHTML) {
  adCard.insertAdjacentHTML('afterbegin', bucketBadgeHTML);
}

// Insert ROAS badge over the image
if (roasBadgeHTML) {
  const thumbnailContainer = adCard.querySelector('.ad-thumbnail-container');
  if (thumbnailContainer) {
    thumbnailContainer.insertAdjacentHTML('beforeend', roasBadgeHTML);
  }
}

// Add inactive class for styling
adCard.classList.add('inactive-product');

// Add status indicator
const statusIndicator = document.createElement('div');
statusIndicator.className = 'product-status-indicator product-status-inactive';
statusIndicator.textContent = 'Inactive';
adCard.appendChild(statusIndicator);

// Check if we have actual metrics data
const hasMetricsData = productBucketData && (
  (productBucketData['Clicks'] && productBucketData['Clicks'] > 0) ||
  (productBucketData['Cost'] && productBucketData['Cost'] > 0) ||
  (productBucketData['Conversions'] && productBucketData['Conversions'] > 0) ||
  (productBucketData['Impressions'] && productBucketData['Impressions'] > 0)
);

// Only create wrapper if we have metrics data
if (hasMetricsData && metricsPanelHTML) {
  // Create wrapper div that will contain both ad card and metrics panel
  const cardWrapper = document.createElement('div');
  cardWrapper.className = 'card-wrapper';
  cardWrapper.setAttribute('data-has-metrics', 'true');
  
  // Set explicit width for ad card
  adCard.style.width = "150px";
  adCard.style.flexShrink = "0";
  
  // Add the ad card to wrapper
  cardWrapper.appendChild(adCard);
  
  // Create and add metrics panel
  const metricsPanel = document.createElement('div');
  metricsPanel.className = 'product-metrics-panel';
  metricsPanel.innerHTML = metricsPanelHTML;
  cardWrapper.appendChild(metricsPanel);
  
  // Add wrapper to the products cell
  productCellDiv.appendChild(cardWrapper);
} else {
  // No metrics data, just add the card directly
  adCard.style.width = "150px";
  adCard.style.flexShrink = "0";
  productCellDiv.appendChild(adCard);
}
                } catch (error) {
                  console.error("[renderProductMapTable] Error rendering inactive product:", error);
                  console.error("[renderProductMapTable] Problem product:", JSON.stringify(product));
                }
              })

// In Charts mode, always filter by myCompany
const chartsActiveProducts = activeProducts.filter(p => p._isMyCompany);
const chartsInactiveProducts = inactiveProducts.filter(p => p._isMyCompany);

// Sort products by position value (best to worst)
const sortByPosition = (a, b) => {
  const posA = parseFloat(a.finalPosition) || 999;
  const posB = parseFloat(b.finalPosition) || 999;
  return posA - posB;
};

// Sort active and inactive products separately
const sortedActiveProducts = [...chartsActiveProducts].sort(sortByPosition);
const sortedInactiveProducts = [...chartsInactiveProducts].sort(sortByPosition);

// Clear the container first
chartProductsDiv.innerHTML = '';

// Add active products
sortedActiveProducts.forEach((product, index) => {
  // First, ensure this product has the enhanced data from globalRows
  let enhancedProduct = null;
  const globalRowsKeys = Object.keys(window.globalRows);
  for (const key of globalRowsKeys) {
    const globalProduct = window.globalRows[key];
    if (globalProduct && 
        globalProduct.title === product.title && 
        globalProduct.source === product.source &&
        globalProduct.q === product.q &&
        globalProduct.location_requested === product.location_requested &&
        globalProduct.device === product.device) {
      enhancedProduct = globalProduct;
      break;
    }
  }
  
  // Use enhanced product if found, otherwise use original
  const productToUse = enhancedProduct || product;
  
  const smallCard = document.createElement('div');
  smallCard.classList.add('small-ad-details');
  smallCard.setAttribute('data-product-index', index);
  
  // Get position and trend values from the enhanced product
  const posValue = productToUse.finalPosition || '-';
  const trendArrow = productToUse.arrow || '';
  const trendValue = productToUse.finalSlope || '';
  const badgeColor = productToUse.posBadgeBackground || 'gray';
  
  // Create the HTML for small card
  const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
  const title = productToUse.title || 'No title';
  
  smallCard.innerHTML = `
    <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
      <div class="small-ad-pos-value">${posValue}</div>
      <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
    </div>
    <img class="small-ad-image" 
         src="${imageUrl}" 
         alt="${title}"
         onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
    <div class="small-ad-title">${title}</div>
  `;
  
  // Store enhanced product reference for chart
  smallCard.productData = productToUse;
  smallCard.productArrayIndex = index; // Store the original index for chart reference
  
  chartProductsDiv.appendChild(smallCard);
});

// Add separator for inactive products if they exist
if (sortedInactiveProducts.length > 0) {
  const separator = document.createElement('div');
  separator.style.width = '100%';
  separator.style.padding = '8px';
  separator.style.textAlign = 'center';
  separator.style.fontSize = '12px';
  separator.style.color = '#666';
  separator.style.backgroundColor = '#f0f0f0';
  separator.style.borderTop = '1px solid #ddd';
  separator.style.borderBottom = '1px solid #ddd';
  separator.style.marginTop = '5px';
  separator.style.marginBottom = '5px';
  separator.innerHTML = '— Inactive Products —';
  chartProductsDiv.appendChild(separator);
  
  // Add inactive products
  sortedInactiveProducts.forEach((product, index) => {
    // Same enhanced product logic as above
    let enhancedProduct = null;
    const globalRowsKeys = Object.keys(window.globalRows);
    for (const key of globalRowsKeys) {
      const globalProduct = window.globalRows[key];
      if (globalProduct && 
          globalProduct.title === product.title && 
          globalProduct.source === product.source &&
          globalProduct.q === product.q &&
          globalProduct.location_requested === product.location_requested &&
          globalProduct.device === product.device) {
        enhancedProduct = globalProduct;
        break;
      }
    }
    
    const productToUse = enhancedProduct || product;
    
    const smallCard = document.createElement('div');
    smallCard.classList.add('small-ad-details');
    smallCard.classList.add('inactive');
    smallCard.setAttribute('data-product-index', sortedActiveProducts.length + index);
    
    const posValue = productToUse.finalPosition || '-';
    const trendArrow = productToUse.arrow || '';
    const trendValue = productToUse.finalSlope || '';
    const badgeColor = productToUse.posBadgeBackground || 'gray';
    
    const imageUrl = productToUse.thumbnail || 'https://via.placeholder.com/50?text=No+Image';
    const title = productToUse.title || 'No title';
    
    smallCard.innerHTML = `
      <div class="small-ad-pos-badge" style="background-color: ${badgeColor};">
        <div class="small-ad-pos-value">${posValue}</div>
        <div class="small-ad-pos-trend">${trendArrow}${trendValue}</div>
      </div>
      <img class="small-ad-image" 
           src="${imageUrl}" 
           alt="${title}"
           onerror="this.onerror=null; this.src='https://via.placeholder.com/50?text=No+Image';">
      <div class="small-ad-title">${title}</div>
    `;
    
    smallCard.productData = productToUse;
    smallCard.productArrayIndex = sortedActiveProducts.length + index;
    
    chartProductsDiv.appendChild(smallCard);
  });
}

// Now create the combined array for chart rendering
const allProductsForChart = [...sortedActiveProducts, ...sortedInactiveProducts];

              // Add direct click handlers to each product card
              productCellDiv.querySelectorAll('.ad-details').forEach(adCard => {
                const plaIndex = adCard.getAttribute('data-pla-index');
                
                adCard.addEventListener('click', function(e) {
                  // Prevent default and stop propagation
                  e.preventDefault();
                  e.stopPropagation();
                  e.stopImmediatePropagation();
                  
                  console.log(`[DEBUG] Card clicked with plaIndex: ${plaIndex}`);
                  console.log(`[DEBUG] globalRows has this key?`, plaIndex in window.globalRows);
                  
                  // Get the product data
                  const rowData = window.globalRows[plaIndex];
                  if (!rowData) {
                    console.error(`[DEBUG] No data found in globalRows for key: ${plaIndex}`);
                    return;
                  }
                  
                  console.log(`[DEBUG] Found data for product: ${rowData.title}`);
                  
                  // DEEP DEBUG OF HISTORICAL DATA
                  console.log(`[DEBUG] Historical data exists: ${Array.isArray(rowData.historical_data)}`);

                  console.log(`[DEBUG] Historical data length: ${rowData.historical_data?.length || 0}`);
                  
                  if (rowData.historical_data && rowData.historical_data.length > 0) {
                    // Log each historical entry in a structured way
                    console.log(`[DEBUG] === FULL HISTORICAL DATA (${rowData.historical_data.length} entries) ===`);
                    
                    // Sort by date first to ensure they're in chronological order
                    const sortedHistData = [...rowData.historical_data].sort((a, b) => {
                      if (!a.date || !a.date.value) return -1;
                      if (!b.date || !b.date.value) return 1;
                      return a.date.value.localeCompare(b.date.value);
                    });
                    
                    // Format the data as a table
                    console.table(sortedHistData.map(entry => ({
                      date: entry.date?.value || 'unknown',
                      avg_position: entry.avg_position,
                      visibility: entry.visibility,
                      top3: entry.top3_visibility,
                      top8: entry.top8_visibility,
                      top14: entry.top14_visibility,
                      top40: entry.top40_visibility
                    })));
                    
                    // Show date coverage
                    const dates = sortedHistData
                      .filter(entry => entry.date && entry.date.value)
                      .map(entry => entry.date.value);
                    
                    const uniqueDates = [...new Set(dates)];
                    console.log(`[DEBUG] Date coverage: ${uniqueDates.length} unique dates out of ${dates.length} entries`);
                    console.log(`[DEBUG] Date range: ${uniqueDates[0]} to ${uniqueDates[uniqueDates.length-1]}`);
                    
                    // Check for any data anomalies
                    const missingPosition = sortedHistData.filter(entry => !entry.avg_position).length;
                    const missingVisibility = sortedHistData.filter(entry => !entry.visibility).length;
                    
                    console.log(`[DEBUG] Data quality check:
                      - Entries missing position: ${missingPosition}
                      - Entries missing visibility: ${missingVisibility}
                    `);
                  }
                  
                  // Create or get the panel container
                  let detailsPanel = document.getElementById('product-map-details-panel');
                  if (!detailsPanel) {
                    detailsPanel = document.createElement('div');
                    detailsPanel.id = 'product-map-details-panel';
                    detailsPanel.style.position = 'fixed';
                    detailsPanel.style.top = '40%';
                    detailsPanel.style.left = 'auto';
                    detailsPanel.style.right = '10px';
                    detailsPanel.style.transform = 'translateY(-50%)';
                    detailsPanel.style.zIndex = '1000';
                    detailsPanel.style.width = '1255px';
                    detailsPanel.style.maxWidth = '1255px';
                    detailsPanel.style.maxHeight = '80vh';
                    detailsPanel.style.overflow = 'auto';
                    detailsPanel.style.borderRadius = '8px';
                    detailsPanel.style.backgroundColor = '#fff';
                    detailsPanel.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.25)';
                    const contentWrapper = document.createElement('div');
                    contentWrapper.id = 'panel-content-wrapper';
                    contentWrapper.style.position = 'relative';
                    contentWrapper.style.width = '100%';
                    contentWrapper.style.height = '100%';
                    detailsPanel.appendChild(contentWrapper);
                    document.body.appendChild(detailsPanel);
                  }

                  // Adjust panel positioning based on fullscreen state
const isFullscreen = document.getElementById("productMapContainer").classList.contains("product-map-fullscreen");
if (isFullscreen) {
  detailsPanel.style.position = 'absolute';
  detailsPanel.style.top = '50%';
  detailsPanel.style.left = '50%';
  detailsPanel.style.transform = 'translate(-50%, -50%)';
  detailsPanel.style.right = 'auto';
  detailsPanel.style.zIndex = '10001'; // Ensure it's above the fullscreen container
} else {
  detailsPanel.style.position = 'fixed';
  detailsPanel.style.top = '40%';
  detailsPanel.style.left = 'auto';
  detailsPanel.style.right = '10px';
  detailsPanel.style.transform = 'translateY(-50%)';
}
                  
                  // Get the content wrapper
                  let contentWrapper = document.getElementById('panel-content-wrapper');
                  if (!contentWrapper) {
                    contentWrapper = document.createElement('div');
                    contentWrapper.id = 'panel-content-wrapper';
                    contentWrapper.style.position = 'relative';
                    contentWrapper.style.width = '100%';
                    contentWrapper.style.height = '100%';
                    detailsPanel.appendChild(contentWrapper);
                  }
                  
                  // Show the loading overlay
                  let loadingOverlay = document.getElementById('panel-loading-overlay');
                  if (!loadingOverlay) {
                    loadingOverlay = document.createElement('div');
                    loadingOverlay.id = 'panel-loading-overlay';
                    loadingOverlay.style.position = 'absolute';
                    loadingOverlay.style.top = '0';
                    loadingOverlay.style.left = '0';
                    loadingOverlay.style.width = '100%';
                    loadingOverlay.style.height = '100%';
                    loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
                    loadingOverlay.style.display = 'flex';
                    loadingOverlay.style.justifyContent = 'center';
                    loadingOverlay.style.alignItems = 'center';
                    loadingOverlay.style.zIndex = '2000';
                    loadingOverlay.innerHTML = '<div class="spinner"></div>';
                    detailsPanel.appendChild(loadingOverlay);
                  } else {
                    loadingOverlay.style.display = 'flex';
                  }
                  
                  // Make sure panel is visible
                  detailsPanel.style.display = 'block';
                  
                  // Important debug approach - make a copy of the DetailsPanel component
                  const originalDetailsPanel = window.DetailsPanel;
                  
                  // Create a debug version that tells us what's happening
                  window.DetailsPanel = function(props) {
                    // Log incoming props
                    console.log("[DEBUG-INJECTION] DetailsPanel received props:", {
                      has_rowData: !!props.rowData,
                      rowData_title: props.rowData?.title,
                      rowData_historical_length: props.rowData?.historical_data?.length,
                      start_date: props.start?.format('YYYY-MM-DD'),
                      end_date: props.end?.format('YYYY-MM-DD')
                    });
                    
                    // Check if the PLAChart component is available to debug
                    const originalPLAChart = window.PLAChart;
                    if (originalPLAChart) {
                      // Override PLAChart to debug what happens with the historical data
                      window.PLAChart = function(plaProps) {
                        console.log("[DEBUG-CHART] PLAChart received historical_data length:", 
                          plaProps.rowData?.historical_data?.length || 0);
                        
                        // Check prepareChartData function which might be generating synthetic data
                        const original_prepareChartData = originalPLAChart.prototype.prepareChartData;
                        if (typeof original_prepareChartData === 'function') {
                          originalPLAChart.prototype.prepareChartData = function(rowData, startDate, endDate) {
                            console.log("[DEBUG-CHART] prepareChartData called with:", {
                              has_rowData: !!rowData,
                              historical_length: rowData?.historical_data?.length || 0,
                              startDate: startDate?.format('YYYY-MM-DD'),
                              endDate: endDate?.format('YYYY-MM-DD')
                            });
                            
                            // Call original and log result
                            const result = original_prepareChartData.call(this, rowData, startDate, endDate);
                            console.log("[DEBUG-CHART] prepareChartData returned:", result.length, "data points");
                            return result;
                          };
                        }
                        
                        // Return the original component with our debug version
                        return originalPLAChart(plaProps);
                      };
                      
                      // Restore the original after a delay
                      setTimeout(() => {
                        window.PLAChart = originalPLAChart;
                      }, 2000);
                    }
                    
                    // Call the original component function (vanilla JS)
                    const element = originalDetailsPanel(props);
                    
                    // Log that we're returning a DOM element
                    console.log("[DEBUG-INJECTION] Returning DOM element:", element.tagName);
                    
                    return element;
                  };
                  
// Render with our debug version
                setTimeout(() => {
                  try {
                      // Get date range
                      // Get the original date range first
let dateRange = getDataRange(rowData);

// Override with a 7-day range specifically for product map page
if (dateRange && dateRange.end) {
  // Keep the same end date but set start to 7 days before
  dateRange = {
    end: dateRange.end.clone(),
    start: dateRange.end.clone().subtract(6, "days") // 7 days including end date
  };
}
                      console.log(`[DEBUG] Date range: start=${dateRange.start.format('YYYY-MM-DD')}, end=${dateRange.end.format('YYYY-MM-DD')}`);
                      
                      // Create a copy of rowData to pass to the component
                      // This ensures we're passing exactly what we have in window.globalRows
                      const rowDataCopy = { ...rowData };
                      
                      // Get the content wrapper again to ensure it exists
                      const contentWrapper = document.getElementById('panel-content-wrapper');
                      
                      // Render into the content wrapper instead of detailsPanel
                      contentWrapper.innerHTML = '';
                      
                      // Create the details panel using vanilla JS
                      const detailsPanelElement = window.DetailsPanel({
                        rowData: rowDataCopy,
                        start: dateRange.start,
                        end: dateRange.end,
                        activeTab: window.savedActiveTab || 1,
                        onClose: () => {
                          detailsPanel.style.display = 'none';
                          document.body.style.overflow = 'auto';
                        }
                      });
                      
                      // Append the DOM element directly
                      contentWrapper.appendChild(detailsPanelElement);
                      
                      // Hide the loading overlay
                      const loadingOverlay = document.getElementById('panel-loading-overlay');
                      if (loadingOverlay) {
                        loadingOverlay.style.display = 'none';
                      }
                      
                      // Restore original component
                      window.DetailsPanel = originalDetailsPanel;
                    } catch (error) {
                      console.error("[DEBUG] Error rendering panel:", error);
                      detailsPanel.innerHTML = `
                        <div style="padding: 20px; text-align: center;">
                          <h3>Error displaying product details</h3>
                          <p>${error.message}</p>
                          <pre style="text-align:left; max-height:200px; overflow:auto;">${error.stack}</pre>
                          <button onclick="document.getElementById('product-map-details-panel').style.display='none';">
                            Close
                          </button>
                        </div>
                      `;
                      
// Restore original component
                    window.DetailsPanel = originalDetailsPanel;
                  }
                }, 100);
                  
                  return false;
                }, true);

// Replace the broken mouseenter handler (starting around line 2026) with this:

adCard.addEventListener('mouseenter', function(e) {
  // Get the product data first
  const plaIndex = adCard.getAttribute('data-pla-index');
  const productData = window.globalRows[plaIndex];
  
  if (!productData) return; // Exit if no product data
  
  // Clear any existing timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
  }
  
  // Add delay before showing popup
  hoverTimeout = setTimeout(() => {
    // Remove any existing popup
    if (currentPopup) {
      currentPopup.remove();
      currentPopup = null;
    }
    
    // Get bucket data for this product
    if (googleAdsEnabled && bucketDataMap.size > 0) {
      const row = adCard.closest('tr');
      const deviceCell = row.querySelector('.device-icon');
      const deviceValue = deviceCell ? (deviceCell.alt || '').toUpperCase() : 'DESKTOP';
      
      // NOW we can use productData.title safely
      const lookupKey = `${productData.title.toLowerCase()}|${deviceValue}`;
      const productBucketData = bucketDataMap.get(lookupKey);
      
      if (productBucketData) {
        currentPopup = createMetricsPopup(productBucketData, bucketAveragesMap);
        if (currentPopup) {
          document.body.appendChild(currentPopup);
          
// Position popup near the product card
const rect = adCard.getBoundingClientRect();
const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

// Popup dimensions
const popupWidth = 520;
const popupRect = currentPopup.getBoundingClientRect();
const popupHeight = popupRect.height || 600; // Fallback height

// Calculate center of the card
const cardCenterY = rect.top + (rect.height / 2);
const cardCenterX = rect.left + (rect.width / 2);

// Try to position popup to the right of the card, centered vertically
let left = rect.right + 10;
let top = cardCenterY + scrollTop - (popupHeight / 2);

// Check if popup would go off the right edge
if (left + popupWidth > window.innerWidth) {
  // Position to the left of the card instead
  left = rect.left - popupWidth - 10;
}

// Check if popup would go off the left edge
if (left < 10) {
  // Position above or below the card
  left = Math.max(10, cardCenterX + scrollLeft - (popupWidth / 2));
  if (cardCenterY < window.innerHeight / 2) {
    // Card is in top half, show popup below
    top = rect.bottom + scrollTop + 10;
  } else {
    // Card is in bottom half, show popup above
    top = rect.top + scrollTop - popupHeight - 10;
  }
}

// Ensure popup doesn't go off top or bottom
top = Math.max(10 + scrollTop, Math.min(top, window.innerHeight + scrollTop - popupHeight - 10));
          
          currentPopup.style.left = left + 'px';
          currentPopup.style.top = top + 'px';
          
          // Show popup with animation
          setTimeout(() => {
            currentPopup.classList.add('visible');
          }, 10);
        }
      }
    }
  }, 300); // 300ms delay
});

adCard.addEventListener('mouseleave', function(e) {
  // Clear timeout
  if (hoverTimeout) {
    clearTimeout(hoverTimeout);
    hoverTimeout = null;
  }
  
  // Hide popup after a short delay
  setTimeout(() => {
    if (currentPopup && !currentPopup.matches(':hover') && !adCard.matches(':hover')) {
      currentPopup.classList.remove('visible');
      setTimeout(() => {
        if (currentPopup) {
          // Clean up any charts before removing popup
          if (currentPopup.campaignCharts) {
            currentPopup.campaignCharts.forEach(chart => {
              try { chart.destroy(); } catch(e) {}
            });
            currentPopup.campaignCharts = [];
          }
          currentPopup.remove();
          currentPopup = null;
        }
      }, 200);
    }
  }, 100);
});             
              });

// Add this right after adding products to window.globalRows 
// (after the matchingProducts.forEach loop)
console.log("[DEBUG] Product Map - globalRows keys:", Object.keys(window.globalRows || {}));
console.log("[DEBUG] Product Map - First few globalRows entries:", 
  Object.keys(window.globalRows || {}).slice(0, 3).map(key => ({
    key,
    title: window.globalRows[key]?.title,
    hasHistoricalData: Array.isArray(window.globalRows[key]?.historical_data)
  }))
);
              
// After adding all products, add visibility badges
              setTimeout(() => {
                productCellDiv.querySelectorAll('.vis-badge').forEach(function(el) {
                  const parts = el.id.split('-');
                  const index = parts[2];
                  const row = window.globalRows[index];
                  if (!row) return;
                  
                  let visValue = parseFloat(row.visibilityBarValue) || 0;
                  
                  // Create water-filling effect
                  el.innerHTML = `
                    <div class="vis-badge-value">${Math.round(visValue)}%</div>
                    <div class="vis-badge-water" style="height: ${visValue}%;"></div>
                  `;
                });
              }, 100);
            }
          } else {
            productCellDiv.textContent = "No product data available";
            console.warn("[renderProductMapTable] allRows data not available");
          }
          
          const tdCompanies = document.createElement("td");
          tdCompanies.className = "companies-column";
          // Create company container
          const companyCellContainer = document.createElement("div");
          companyCellContainer.classList.add("company-cell-container");
          
          const companyCellDiv = document.createElement("div");
          companyCellDiv.classList.add("company-cell");
          companyCellContainer.appendChild(companyCellDiv);
          tdCompanies.appendChild(companyCellContainer);
          
// Populate companies for this search term/location/device combination
if (window.company_serp_stats && window.company_serp_stats.length > 0) {
  // Filter company data for this specific combination
  const companyData = window.company_serp_stats.filter(c => 
    c.searchTerm === term &&
    c.location === loc &&
    c.device === rowData.device
  );

    console.log(`[ProductMap] Filtering companies for:`, {
    term: term,
    location: loc,
    device: rowData.device,
    totalCompanyStats: window.company_serp_stats.length,
    matchingCompanies: companyData.length
  });

  if (companyData.length > 0) {
    // Sort by rank
    companyData.sort((a, b) => (a.rank || 999) - (b.rank || 999));

    // Take top companies (e.g., top 10)
    const topCompanies = companyData.slice(0, 10);

    topCompanies.forEach((company, index) => {
      const compDetails = createCompDetails(company, index);
      companyCellDiv.appendChild(compDetails);
    });
  } else {
    // No matching companies for this combination
    companyCellDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-style: italic;">No company data</div>';
  }
} else {
  // No company stats loaded at all
  companyCellDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Company data not available</div>';
}
          
// Keep this as is - append BOTH columns
tr.appendChild(tdProducts);
tr.appendChild(tdCompanies);      
          tbody.appendChild(tr);
        });
      });
    });
  
    container.querySelector("#productMapContainer").appendChild(table);
    console.log("[renderProductMapTable] Table rendering complete");
    
    // Add a resize observer to ensure product cells maintain proper width after DOM updates
    setTimeout(() => {
      const productCells = document.querySelectorAll('.product-cell');
      console.log(`[renderProductMapTable] Found ${productCells.length} product cells to observe`);
      
      if (window.ResizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
          for (let entry of entries) {
            const width = entry.contentRect.width;
            console.log(`[renderProductMapTable] Product cell resized to ${width}px`);
            
            // If width is too small, force a minimum width
            if (width < 400) {
              entry.target.style.minWidth = "400px";
            }
          }
        });
        
        productCells.forEach(cell => {
          resizeObserver.observe(cell);
        });
      }
      
      // Setup click handlers for product cards (similar to main page)
      console.log("[DEBUG] Using custom click handlers for product map items");
    }, 200);

    // Add observer for full-screen mode changes
const productMapContainer = document.getElementById("productMapContainer");
if (productMapContainer) {
  // Create a mutation observer to monitor when the container enters or exits full-screen mode
  const observer = new MutationObserver(function(mutations) {
    for (let mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isFullscreen = productMapContainer.classList.contains("product-map-fullscreen");
        
        // Adjust product cells in full-screen mode
        const productCells = document.querySelectorAll('.product-cell');
        productCells.forEach(cell => {
          if (isFullscreen) {
            // In full-screen mode, allow products to wrap and fill available space
            cell.style.flexWrap = "wrap";
            cell.style.justifyContent = "flex-start";
            
            // Adjust card widths to maintain consistent size
            const cards = cell.querySelectorAll('.ad-details');
            cards.forEach(card => {
              card.style.width = "150px";
              card.style.margin = "0 10px 10px 0";
            });
          } else {
            // In normal mode, revert to horizontal scrolling
            cell.style.flexWrap = "nowrap";
            cell.style.justifyContent = "";
            
            const cards = cell.querySelectorAll('.ad-details');
            cards.forEach(card => {
              card.style.width = "150px";
              card.style.margin = "";
            });
          }
        });
      }
    }
  });
  
  // Start observing the container for class changes
  observer.observe(productMapContainer, { attributes: true });
}
    // Add batch rendering function
    function renderPendingCharts() {
      const charts = window.pendingSegmentationCharts;
      if (!charts || charts.length === 0) return;
      
      console.log(`[ProductMap] Starting batch rendering of ${charts.length} charts`);
      
      let currentIndex = 0;
      const batchSize = 3; // Render 3 charts at a time
      
      function renderBatch() {
        const startTime = performance.now();
        const batch = charts.slice(currentIndex, currentIndex + batchSize);
        
        batch.forEach(chartInfo => {
          // Calculate segment counts from the rendered products
          const segmentCounts = [0, 0, 0, 0]; // [Top3, Top4-8, Top9-14, Below14]
          
          // Get the product elements that were rendered
          const productCards = chartInfo.productCellDiv.querySelectorAll('.ad-details');
          
          productCards.forEach(card => {
            // Skip inactive products
            if (card.classList.contains('inactive-product')) {
              return;
            }
            
            // Get the data-pla-index to look up the product data
            const plaIndex = card.getAttribute('data-pla-index');
            const product = window.globalRows[plaIndex];
            
            if (product) {
              const posValue = parseFloat(product.finalPosition);
              
              if (!isNaN(posValue) && posValue > 0) {
                if (posValue <= 3) {
                  segmentCounts[0]++; // Top3
                } else if (posValue <= 8) {
                  segmentCounts[1]++; // Top4-8
                } else if (posValue <= 14) {
                  segmentCounts[2]++; // Top9-14
                } else {
                  segmentCounts[3]++; // Below14
                }
              }
            }
          });
          
          // Create the segmentation chart
          requestAnimationFrame(() => {
            createSegmentationChart(
              chartInfo.containerId, 
              chartInfo.data, 
              chartInfo.term, 
              chartInfo.location, 
              chartInfo.device, 
              chartInfo.company, 
              chartInfo.activeCount, 
              chartInfo.inactiveCount, 
              segmentCounts
            );
            
            // Create pie chart for market share
            if (chartInfo.projectData && chartInfo.projectData.avgShare !== undefined) {
              createMarketSharePieChart(chartInfo.pieChartId, chartInfo.projectData.avgShare);
            }
          });
        });
        
        currentIndex += batchSize;
        console.log(`[ProductMap] Rendered batch ${Math.ceil(currentIndex/batchSize)} of ${Math.ceil(charts.length/batchSize)} in ${(performance.now() - startTime).toFixed(1)}ms`);
        
        // If more charts to render, continue after a short delay
        if (currentIndex < charts.length) {
          setTimeout(renderBatch, 50); // 50ms delay between batches
        } else {
          // Clear the pending charts array
          window.pendingSegmentationCharts = [];
          console.log(`[ProductMap] Finished rendering all charts`);
        }
      }
      
requestAnimationFrame(renderBatch);
    }

    // Call the batch renderer
    renderPendingCharts();
// Global cleanup for popups when scrolling or clicking elsewhere
document.addEventListener('scroll', function() {
  if (currentPopup) {
    currentPopup.classList.remove('visible');
    setTimeout(() => {
      if (currentPopup) {
        // Clean up any charts before removing popup
        if (currentPopup.campaignCharts) {
          currentPopup.campaignCharts.forEach(chart => {
            try { chart.destroy(); } catch(e) {}
          });
          currentPopup.campaignCharts = [];
        }
        currentPopup.remove();
        currentPopup = null;
      }
    }, 200);
  }
}, { passive: true });
  }

// Function to render average position chart using Chart.js instead of Recharts
function renderAvgPositionChart(container, products) {
  // Check if annotation plugin is available
  if (!Chart.defaults.plugins.annotation) {
    console.warn('Chart.js annotation plugin not loaded. Top8 area will not be displayed.');
  }
  
  // Clear previous content
  container.innerHTML = '';
  container.style.padding = '20px';
  
  // Store reference to track selected product
  container.selectedProductIndex = null;
  container.chartInstance = null;
  
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  container.appendChild(canvas);
  
  // Determine date range from all products
  let allDates = new Set();
  let minDate = null;
  let maxDate = null;
  
  products.forEach(product => {
    if (product.historical_data && product.historical_data.length > 0) {
      product.historical_data.forEach(item => {
        if (item.date && item.date.value && item.avg_position) {
          const dateStr = item.date.value;
          allDates.add(dateStr);
          const date = moment(dateStr, 'YYYY-MM-DD');
          if (!minDate || date.isBefore(minDate)) minDate = date.clone();
          if (!maxDate || date.isAfter(maxDate)) maxDate = date.clone();
        }
      });
    }
  });
  
  if (!minDate || !maxDate) {
    container.innerHTML = '<div style="text-align: center; color: #999;">No position data available</div>';
    return;
  }
  
  // Create array of all dates in range
  const dateArray = [];
  let currentDate = minDate.clone();
  while (currentDate.isSameOrBefore(maxDate)) {
    dateArray.push(currentDate.format('YYYY-MM-DD'));
    currentDate.add(1, 'day');
  }
  
  // Limit to last 30 days if range is too large
  if (dateArray.length > 30) {
    dateArray.splice(0, dateArray.length - 30);
  }
  
  // Create datasets for each product
  const datasets = [];
  
  products.forEach((product, index) => {
    // Position data
    const positionData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      return histItem?.avg_position ? parseFloat(histItem.avg_position) : null;
    });
    
    // Visibility data - use 0 for missing values instead of null
    const visibilityData = dateArray.map(dateStr => {
      const histItem = product.historical_data?.find(item => 
        item.date?.value === dateStr
      );
      // Return 0 if no visibility data exists, round to 1 decimal
      if (histItem?.visibility) {
        const visValue = parseFloat(histItem.visibility) * 100;
        return Math.round(visValue * 10) / 10; // Round to 1 decimal place
      }
      return 0;
    });
    
    // Generate a color for this product - grey for inactive
    let color;
    if (product.product_status === 'inactive') {
      color = '#999999'; // Grey for inactive products
    } else {
      const colors = [
        '#007aff', '#ff3b30', '#4cd964', '#ff9500', '#5856d6',
        '#ff2d55', '#5ac8fa', '#ffcc00', '#ff6482', '#af52de'
      ];
      color = colors[index % colors.length];
    }
    
    // Add position line dataset
    datasets.push({
      label: product.title?.substring(0, 30) + (product.title?.length > 30 ? '...' : ''),
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
      productIndex: index, // Store product index for reference
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
      spanGaps: false, // Don't span gaps for visibility
      yAxisID: 'y1',
      type: 'line',
      hidden: true, // Initially hidden
      productIndex: index, // Store product index for reference
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
              backgroundColor: 'rgba(144, 238, 144, 0.2)', // Light green with transparency
              borderColor: 'rgba(144, 238, 144, 0.4)',
              borderWidth: 1,
              borderDash: [5, 5],
              label: {
                content: 'TOP 8',
                enabled: true,
                position: 'start',
                color: '#4CAF50',
                font: {
                  size: 12,
                  weight: 'bold'
                }
              }
            }
          }
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: function(context) {
              if (context.parsed.y !== null) {
                if (context.dataset.dataType === 'visibility') {
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1) + '%';
                } else {
                  return context.dataset.label + ': ' + context.parsed.y.toFixed(1);
                }
              }
              return context.dataset.label + ': No data';
            },
            filter: function(tooltipItem) {
              // Only show visible datasets in tooltip
              return !tooltipItem.dataset.hidden;
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
            drawOnChartArea: false // Don't draw grid lines for right axis
          }
        }
      }
    }
  });
}

function closeDetailsPanel() {
  const panel = document.getElementById('product-map-details-panel');
  if (panel) {
    panel.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
  
  // Remove selected class from all elements
  document.querySelectorAll('.ad-details.selected').forEach(el => {
    el.classList.remove('selected');
  });
  
  // Reset global variables if they exist
  if (typeof currentlyOpenPanel !== 'undefined') {
    currentlyOpenPanel = null;
  }
  if (typeof currentlySelectedIndex !== 'undefined') {
    currentlySelectedIndex = null;
  }
}

// Function to update chart line visibility when product is selected/deselected
function updateChartLineVisibility(chartContainer, selectedIndex) {
  const chart = chartContainer.chartInstance;
  if (!chart) return;
  
  // Update dataset visibility
  chart.data.datasets.forEach((dataset) => {
    if (dataset.dataType === 'position') {
      // Handle position line datasets
      if (selectedIndex === null) {
        // Show all position lines with normal styling
        dataset.borderWidth = 2;
        dataset.hidden = false;
      } else if (dataset.productIndex === selectedIndex) {
        // Make selected line bold and visible
        dataset.borderWidth = 4;
        dataset.hidden = false;
      } else {
        // Hide other position lines
        dataset.hidden = true;
      }
    } else if (dataset.dataType === 'visibility') {
      // Handle visibility area datasets
      if (selectedIndex === null) {
        // Hide all visibility areas when nothing is selected
        dataset.hidden = true;
      } else if (dataset.productIndex === selectedIndex) {
        // Show visibility area for selected product
        dataset.hidden = false;
      } else {
        // Hide other visibility areas
        dataset.hidden = true;
      }
    }
  });
  
  // Update the chart
  chart.update('none'); // 'none' for no animation
}

if (typeof window !== 'undefined') {
  window.renderProductMapTable = renderProductMapTable;
}

// Debug function to verify company data
function debugCompanyData() {
  console.group('[ProductMap Debug] Company Data Check');
  console.log('companyStatsData available:', !!window.companyStatsData, 'count:', window.companyStatsData?.length || 0);
  console.log('company_serp_stats available:', !!window.company_serp_stats, 'count:', window.company_serp_stats?.length || 0);
  
  if (window.companyStatsData && window.companyStatsData[0]) {
    console.log('Sample companyStatsData:', {
      source: window.companyStatsData[0].source,
      historical_data_length: window.companyStatsData[0].historical_data?.length || 0,
      first_historical: window.companyStatsData[0].historical_data?.[0]
    });
  }
  
  if (window.company_serp_stats && window.company_serp_stats[0]) {
    console.log('Sample company_serp_stats:', window.company_serp_stats[0]);
  }
  console.groupEnd();
}

// Call this function in browser console to debug: debugCompanyData()
