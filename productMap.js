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
    top3: companyData.top3,
    top4_8: companyData.top4_8,
    top9_14: companyData.top9_14,
    below14: companyData.below14,
    numProducts: companyData.numProducts,
    numOnSale: companyData.numOnSale,
    improvedCount: companyData.improvedCount,
    newCount: companyData.newCount,
    declinedCount: companyData.declinedCount,
    hasHistoricalData: !!companyData.historical_data
  });
  const container = document.createElement('div');
  container.className = 'comp-details';

    // Check if this is myCompany
  const isMyCompany = companyData.company && 
    window.myCompany && 
    companyData.company.toLowerCase() === window.myCompany.toLowerCase();
  
  if (isMyCompany) {
    container.classList.add('my-company-comp');
  }
  
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
const displayRank = companyData.displayRank || companyData.rank || '-';
let rankColorClass = '';
if (displayRank === 1) {
  rankColorClass = 'rank-green';
} else if (displayRank >= 2 && displayRank <= 3) {
  rankColorClass = 'rank-yellow';
} else if (displayRank >= 4 && displayRank <= 5) {
  rankColorClass = 'rank-orange';
} else {
  rankColorClass = 'rank-red';
}
rankBadge.className = `company-rank ${rankColorClass}`;
rankBadge.innerHTML = `<span class="rank-label">Rank:</span><span class="rank-value">${displayRank}</span>`;
container.appendChild(rankBadge);

// Market share badge (top-right) - water fill style
const marketShareBadge = document.createElement('div');
marketShareBadge.className = 'company-market-badge';
const marketShareValue = companyData.top40 || 0;
marketShareBadge.innerHTML = `
  <div class="market-badge-value">${marketShareValue.toFixed(0)}%</div>
  <div class="market-badge-water" style="height: ${marketShareValue}%;"></div>
`;
marketShareBadge.title = `Market Share: ${marketShareValue.toFixed(1)}% | Avg Rank: ${companyData.originalRank || companyData.rank || 'N/A'}`;
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
  <div class="products-stat-left">
    <div class="stat-value">${totalProducts}</div>
    <div class="stat-label">products</div>
  </div>
  <div class="products-stat-right">
    <div class="stat-value">${onSalePercent}%</div>
    <div class="stat-label">on sale</div>
  </div>
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
  
  // Get last 7 days (excluding today), newest first
  const today = moment().startOf('day');
  const dates = [];
  for (let i = 1; i <= 7; i++) {
    dates.push(today.clone().subtract(i, 'days').format('YYYY-MM-DD'));
  }
  
  // For each date, find if we have rank data
  dates.forEach(dateStr => {
    const dayData = companyData.historical_data.find(h => 
      h.date && h.date.value === dateStr
    );
    
    const rankBox = document.createElement('div');
    
    if (dayData && dayData.rank) {
      const rank = parseInt(dayData.rank, 10);
      rankBox.className = `rank-box-mini ${colorRank(rank)}`;
      rankBox.textContent = rank;
      rankBox.title = `${dateStr}: Rank #${rank}`;
    } else {
      // No data for this day - show light grey empty box
      rankBox.className = 'rank-box-mini no-data';
      rankBox.style.backgroundColor = '#e0e0e0';
      rankBox.textContent = '';
      rankBox.title = `${dateStr}: No ranking data`;
    }
    
    rankHistory.appendChild(rankBox);
  });
  
  container.appendChild(rankHistory);
}

// Mini SERP Table - REDESIGNED
const miniSerpContainer = document.createElement('div');
miniSerpContainer.className = 'mini-serp-container';

// Create the redesigned table structure
const miniSerpTable = document.createElement('div');
miniSerpTable.className = 'mini-serp-table';

// Helper function to get trend arrow and color from trend value
const getTrendInfo = (trendValue) => {
  const val = parseFloat(trendValue) || 0;
  if (val > 0) {
    return { arrow: '▲', color: 'green', class: 'trend-up' };
  } else if (val < 0) {
    return { arrow: '▼', color: 'red', class: 'trend-down' };
  } else {
    return { arrow: '±', color: 'neutral', class: 'trend-neutral' };
  }
};

// Define segments data
const segments = [
  { 
    name: 'Top 40', 
    share: companyData.top40 || '0', 
    trend: companyData.top40Trend || 0,
    isTop40: true
  },
  { 
    name: 'Top 3', 
    share: companyData.top3 || '0', 
    trend: companyData.top3Trend || 0
  },
  { 
    name: 'Top 4-8', 
    share: companyData.top4_8 || '0', 
    trend: companyData.top4_8Trend || 0
  },
  { 
    name: 'Top 9-14', 
    share: companyData.top9_14 || '0', 
    trend: companyData.top9_14Trend || 0
  },
  { 
    name: 'Below 14', 
    share: companyData.below14 || '0', 
    trend: companyData.below14Trend || 0
  }
];

// Find max share value for scaling
const maxShare = Math.max(...segments.map(s => parseFloat(s.share) || 0));

// Create rows
segments.forEach(segment => {
  const row = document.createElement('div');
  row.className = 'serp-row' + (segment.isTop40 ? ' top40' : '');
  
  const trendInfo = getTrendInfo(segment.trend);
  const shareValue = parseFloat(segment.share) || 0;
  
  // Calculate bar width (minimum 30% for visibility, maximum 90% to leave room for trend)
  const barWidth = Math.max(30, Math.min(90, (shareValue / maxShare) * 85));
  
  // Determine bar color based on trend
  let barClass = 'neutral';
  if (trendInfo.class === 'trend-up') barClass = 'positive';
  else if (trendInfo.class === 'trend-down') barClass = 'negative';
  
  row.innerHTML = `
    <div class="serp-segment-label">${segment.name}</div>
    <div class="serp-share-bar-container">
      <div class="serp-share-bar ${barClass}" style="width: ${barWidth}%;">
        <div class="serp-share-value">${shareValue.toFixed(1)}%</div>
      </div>
    </div>
    <div class="serp-trend-value ${trendInfo.class}">
      ${trendInfo.arrow}${Math.abs(parseFloat(segment.trend)).toFixed(1)}%
    </div>
  `;
  
  miniSerpTable.appendChild(row);
});

miniSerpContainer.appendChild(miniSerpTable);

// Add to container
container.appendChild(miniSerpContainer);

  // Store hidden data for future use
  container.dataset.serpData = JSON.stringify(companyData.serpData || {});
  container.dataset.pricingData = JSON.stringify(companyData.pricingData || {});

  return container; // IMPORTANT: Return the container!
}

function prepareCompanySerpsStatsData() {
  console.group('[🔍 prepareCompanySerpsStatsData] DEBUG');
  console.log('Starting preparation...');
  
  // Log current state
  console.log('Current state:');
  console.log('  dataPrefix:', window.dataPrefix);
  console.log('  myCompany:', window.myCompany);
  console.log('  filterState.activeProjectNumber:', window.filterState?.activeProjectNumber);

  if (window.myCompany && window.companyStatsData) {
    const myCompanyRecords = window.companyStatsData.filter(item => 
      item.source && item.source.toLowerCase() === window.myCompany.toLowerCase()
    );
    console.log(`[ProductMap DEBUG] Found ${myCompanyRecords.length} records for myCompany (${window.myCompany})`);
    if (myCompanyRecords.length > 0) {
      console.log('[ProductMap DEBUG] Sample myCompany record:', myCompanyRecords[0]);
    }
  }
  
  // Use companyStatsData as the source
  if (!window.companyStatsData || window.companyStatsData.length === 0) {
    console.warn('[ProductMap] No companyStatsData available');
    window.company_serp_stats = [];
    console.groupEnd();
    return [];
  }
  
  console.log('Input companyStatsData:');
  console.log('  Total records:', window.companyStatsData.length);
  
  // Check project numbers in input data
  const inputProjects = {};
  window.companyStatsData.forEach(item => {
    const pn = item.project_number || 'null';
    if (!inputProjects[pn]) inputProjects[pn] = 0;
    inputProjects[pn]++;
  });
  console.log('  Records by project:', inputProjects);
  
  // Get current project number from dataPrefix
  const currentProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1], 10) : 
    (window.filterState?.activeProjectNumber || 1);
  
  console.log('Target project number:', currentProjectNum);

  // Filter companyStatsData to only include current project BEFORE processing
  const projectFilteredData = window.companyStatsData.filter(item => {
    // Only include records from the current project
    if (item.project_number && item.project_number !== currentProjectNum) {
      return false;
    }
    return true;
  });

  console.log(`Filtered from ${window.companyStatsData.length} to ${projectFilteredData.length} records for project ${currentProjectNum}`);
  
  // Log what sources remain after filtering
  const filteredSources = new Set(projectFilteredData.map(item => item.source).filter(Boolean));
  console.log('Sources after filtering:', [...filteredSources].slice(0, 10));
  
  // Check if Merrell is still there for project 2
  if (currentProjectNum === 2 && [...filteredSources].some(s => s.includes('Merrell'))) {
    console.error('❌ ERROR: Merrell found in filtered data for project 2!');
  }

  // Check if we filtered out all data
  if (projectFilteredData.length === 0) {
    console.warn(`[ProductMap] No data found for project ${currentProjectNum}`);
    window.company_serp_stats = [];
    console.groupEnd();
    return [];
  }
  
  const companyStatsMap = new Map();
  
  // Process each company's data
  projectFilteredData.forEach(item => {
    
    // Skip records with null, undefined, or empty source
    if (!item.source || item.source.trim() === '' || item.source === 'Unknown' || 
        !item.q || !item.location_requested || !item.device) return;
    
    const key = `${item.source}_${item.q}_${item.location_requested}_${item.device}`;
    
    // DEBUG: Add logging for Under Armour
    const isUnderArmour = item.source === 'Under Armour' && 
                          item.q === 'running shoes for men' && 
                          item.location_requested === 'Austin,Texas,United States';
    
    if (!companyStatsMap.has(key)) {
      if (isUnderArmour) {
        console.log(`\n[UNDER ARMOUR DEBUG] ========== PROCESSING KEY: ${key} ==========`);
        console.log('[UNDER ARMOUR DEBUG] Device:', item.device);
      }
      
      // Calculate metrics from historical_data
      let avgRank = 999;
      let avgMarketShare = 0;
      let marketShareTrend = 0;
      let avgProducts = 0;
      let avgOnSale = 0;
      let avgTop3 = 0;
      let avgTop4_8 = 0;
      let avgTop9_14 = 0;
      let avgBelow14 = 0;

      if (item.historical_data && item.historical_data.length > 0) {
        // Calculate 7-day average rank (excluding today)
        const today = moment().startOf('day');
        const sevenDaysAgo = today.clone().subtract(7, 'days');
        
        // Filter historical data for last 7 days (excluding today)
        const last7DaysData = item.historical_data.filter(day => {
          if (!day.date || !day.date.value) return false;
          const dayMoment = moment(day.date.value, 'YYYY-MM-DD');
          return dayMoment.isBetween(sevenDaysAgo, today, 'day', '[)'); // Include start, exclude end
        });
        
        if (isUnderArmour) {
          console.log(`[UNDER ARMOUR DEBUG] Historical data length: ${item.historical_data.length}`);
          console.log(`[UNDER ARMOUR DEBUG] Last 7 days data count: ${last7DaysData.length}`);
          if (last7DaysData.length > 0) {
            console.log('[UNDER ARMOUR DEBUG] Sample day from last 7:', last7DaysData[0]);
            console.log('[UNDER ARMOUR DEBUG] All fields in sample day:', Object.keys(last7DaysData[0]));
            
            // Check if market_share fields exist
            const hasMarketShare = last7DaysData.some(day => day.market_share != null);
            const hasTop3Share = last7DaysData.some(day => day.top3_market_share != null);
            console.log('[UNDER ARMOUR DEBUG] Has market_share field?', hasMarketShare);
            console.log('[UNDER ARMOUR DEBUG] Has top3_market_share field?', hasTop3Share);
            
            if (!hasMarketShare || !hasTop3Share) {
              console.log('[UNDER ARMOUR DEBUG] WARNING: Missing market share fields!');
              console.log('[UNDER ARMOUR DEBUG] Checking for alternative field names...');
              // Log all unique field names across all days
              const allFields = new Set();
              last7DaysData.forEach(day => {
                Object.keys(day).forEach(field => allFields.add(field));
              });
              console.log('[UNDER ARMOUR DEBUG] All unique fields:', Array.from(allFields).sort());
            }
          }
        }
        
        // Calculate average rank from historical rank data
        const ranks = last7DaysData
          .filter(day => day.rank != null)
          .map(day => parseInt(day.rank, 10));
        
        if (ranks.length > 0) {
          avgRank = Math.round(ranks.reduce((a, b) => a + b) / ranks.length);
        }
        
        // Get last 7 days for market share metrics
        const marketShares = last7DaysData
          .filter(day => day.market_share != null)
          .map(day => parseFloat(day.market_share) * 100); // Convert to percentage
        
        if (isUnderArmour) {
          console.log('[UNDER ARMOUR DEBUG] Market share (top40) calculation:');
          console.log('[UNDER ARMOUR DEBUG] last7DaysData length:', last7DaysData.length);
          
          // Force log ALL days with their market_share values
          last7DaysData.forEach((day, idx) => {
            console.log(`  - Day ${idx}: market_share = ${day.market_share}, top3_market_share = ${day.top3_market_share}`);
          });
          
          const rawMarketShareValues = last7DaysData
            .filter(day => day.market_share != null)
            .map(day => day.market_share);
          console.log('  - Raw market_share values:', rawMarketShareValues);
          console.log('  - Converted to percentages:', marketShares);
          if (marketShares.length > 0) {
            console.log('  - Each value * 100:', marketShares);
            console.log('  - Sum:', marketShares.reduce((a, b) => a + b, 0));
            console.log('  - Count:', marketShares.length);
            console.log('  - Average will be:', marketShares.reduce((a, b) => a + b, 0) / marketShares.length);
          } else {
            console.log('  - WARNING: No market share values found after filtering!');
          }
        }
        
        const top3Shares = last7DaysData
          .filter(day => day.top3_market_share != null)
          .map(day => parseFloat(day.top3_market_share) * 100);
        
        if (isUnderArmour) {
          console.log('[UNDER ARMOUR DEBUG] Top3 calculation:');
          const rawTop3Values = last7DaysData
            .filter(day => day.top3_market_share != null)
            .map(day => day.top3_market_share);
          console.log('  - Raw top3_market_share values:', rawTop3Values);
          console.log('  - Converted to percentages:', top3Shares);
          if (top3Shares.length > 0) {
            console.log('  - Each value * 100:', top3Shares);
            console.log('  - Sum:', top3Shares.reduce((a, b) => a + b, 0));
            console.log('  - Count:', top3Shares.length);
            console.log('  - Average will be:', top3Shares.reduce((a, b) => a + b, 0) / top3Shares.length);
          } else {
            console.log('  - WARNING: No top3 share values found after filtering!');
          }
        }
          
        const top4_8Shares = last7DaysData
          .filter(day => day.top4_8_market_share != null)
          .map(day => parseFloat(day.top4_8_market_share) * 100);
          
        const top9_14Shares = last7DaysData
          .filter(day => day.top9_14_market_share != null)
          .map(day => parseFloat(day.top9_14_market_share) * 100);
          
        const below14Shares = last7DaysData
          .filter(day => day.below14_market_share != null)
          .map(day => parseFloat(day.below14_market_share) * 100);
        
        // Calculate averages from the extracted data
        if (marketShares.length > 0) {
          avgMarketShare = marketShares.reduce((a, b) => a + b) / marketShares.length;
          if (isUnderArmour) {
            console.log(`[UNDER ARMOUR DEBUG] Final avgMarketShare (top40): ${avgMarketShare}%`);
          }
        } else if (isUnderArmour) {
          console.log('[UNDER ARMOUR DEBUG] WARNING: No market share data found!');
          console.log('[UNDER ARMOUR DEBUG] avgMarketShare will remain:', avgMarketShare);
        }
        if (top3Shares.length > 0) {
          avgTop3 = top3Shares.reduce((a, b) => a + b) / top3Shares.length;
          if (isUnderArmour) {
            console.log(`[UNDER ARMOUR DEBUG] Final avgTop3: ${avgTop3}%`);
          }
        } else if (isUnderArmour) {
          console.log('[UNDER ARMOUR DEBUG] WARNING: No top3 share data found!');
          console.log('[UNDER ARMOUR DEBUG] avgTop3 will remain:', avgTop3);
        }
        if (top4_8Shares.length > 0) {
          avgTop4_8 = top4_8Shares.reduce((a, b) => a + b) / top4_8Shares.length;
        }
        if (top9_14Shares.length > 0) {
          avgTop9_14 = top9_14Shares.reduce((a, b) => a + b) / top9_14Shares.length;
        }
        if (below14Shares.length > 0) {
          avgBelow14 = below14Shares.reduce((a, b) => a + b) / below14Shares.length;
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
        const productCounts = last7DaysData
          .filter(day => day.unique_products != null)
          .map(day => parseFloat(day.unique_products));
        
        const onSaleCounts = last7DaysData
          .filter(day => day.un_products_on_sale != null)
          .map(day => parseFloat(day.un_products_on_sale));
        
        if (productCounts.length > 0) {
          avgProducts = productCounts.reduce((a, b) => a + b) / productCounts.length;
        }
        
        if (onSaleCounts.length > 0) {
          avgOnSale = onSaleCounts.reduce((a, b) => a + b) / onSaleCounts.length;
        }
      }

      // Calculate trends for all segments (last 7 days vs previous 7 days)
      let top3Trend = 0;
      let top4_8Trend = 0;
      let top9_14Trend = 0;
      let below14Trend = 0;

      if (item.historical_data && item.historical_data.length >= 14) {
        const prev7Days = item.historical_data.slice(-14, -7);
        
        // Calculate previous averages for all segments
        const prevTop3Shares = prev7Days
          .filter(day => day.top3_market_share != null)
          .map(day => parseFloat(day.top3_market_share) * 100);
        
        const prevTop4_8Shares = prev7Days
          .filter(day => day.top4_8_market_share != null)
          .map(day => parseFloat(day.top4_8_market_share) * 100);
          
        const prevTop9_14Shares = prev7Days
          .filter(day => day.top9_14_market_share != null)
          .map(day => parseFloat(day.top9_14_market_share) * 100);
          
        const prevBelow14Shares = prev7Days
          .filter(day => day.below14_market_share != null)
          .map(day => parseFloat(day.below14_market_share) * 100);
        
        // Calculate trends
        if (prevTop3Shares.length > 0) {
          const prevAvg = prevTop3Shares.reduce((a, b) => a + b) / prevTop3Shares.length;
          top3Trend = avgTop3 - prevAvg;
        }
        
        if (prevTop4_8Shares.length > 0) {
          const prevAvg = prevTop4_8Shares.reduce((a, b) => a + b) / prevTop4_8Shares.length;
          top4_8Trend = avgTop4_8 - prevAvg;
        }
        
        if (prevTop9_14Shares.length > 0) {
          const prevAvg = prevTop9_14Shares.reduce((a, b) => a + b) / prevTop9_14Shares.length;
          top9_14Trend = avgTop9_14 - prevAvg;
        }
        
        if (prevBelow14Shares.length > 0) {
          const prevAvg = prevBelow14Shares.reduce((a, b) => a + b) / prevBelow14Shares.length;
          below14Trend = avgBelow14 - prevAvg;
        }
      }

      const finalStats = {
        searchTerm: item.q,
        location: item.location_requested,
        device: item.device,
        rank: avgRank,
        company: item.source,
        project_number: currentProjectNum,
        top40: parseFloat(avgMarketShare.toFixed(1)),
        top40Trend: parseFloat(marketShareTrend.toFixed(1)),
        top3: parseFloat(avgTop3.toFixed(1)),
        top3Trend: parseFloat(top3Trend.toFixed(1)),
        top4_8: parseFloat(avgTop4_8.toFixed(1)),
        top4_8Trend: parseFloat(top4_8Trend.toFixed(1)),
        top9_14: parseFloat(avgTop9_14.toFixed(1)),
        top9_14Trend: parseFloat(top9_14Trend.toFixed(1)),
        below14: parseFloat(avgBelow14.toFixed(1)),
        below14Trend: parseFloat(below14Trend.toFixed(1)),
        numProducts: Math.round(avgProducts),
        numOnSale: avgProducts > 0 ? Math.round((avgOnSale / avgProducts) * 100) : 0,
        improvedCount: 0,
        newCount: 0,
        declinedCount: 0,
        historical_data: item.historical_data || []
      };
      
      if (isUnderArmour) {
        console.log('[UNDER ARMOUR DEBUG] FINAL STATS OBJECT:', finalStats);
        console.log('[UNDER ARMOUR DEBUG] ========== END PROCESSING ==========\n');
      }
      
      companyStatsMap.set(key, finalStats);
    }
  });
  
  window.company_serp_stats = Array.from(companyStatsMap.values());
  console.log(`Generated ${window.company_serp_stats.length} company stats for project ${currentProjectNum}`);
  
  // Final check
  const outputCompanies = new Set(window.company_serp_stats.map(s => s.company));
  console.log('Output companies:', [...outputCompanies].slice(0, 10));
  
  if (currentProjectNum === 2 && [...outputCompanies].some(c => c.includes('Merrell'))) {
    console.error('❌ ERROR: Merrell in final output for project 2!');
  }
  
  // Debug log to verify data
  if (window.company_serp_stats.length > 0) {
    // Group by search term/location/device to see different companies
    const sampleKey = `${window.company_serp_stats[0].searchTerm}_${window.company_serp_stats[0].location}_${window.company_serp_stats[0].device}`;
    const companiesForSample = window.company_serp_stats.filter(stat => 
      `${stat.searchTerm}_${stat.location}_${stat.device}` === sampleKey
    );
    
    console.log('[ProductMap] Sample company stats for', sampleKey);
    companiesForSample.forEach(stat => {
      console.log(`  ${stat.company}: rank=${stat.rank}, top40=${stat.top40}%, top3=${stat.top3}%`);
    });
  }
  
  console.groupEnd();
  
  return window.company_serp_stats;
}

// Add these functions here (around line 800, after popupStyle creation)

// Function to render all market trend charts
function renderAllMarketTrendCharts() {
  console.log('[renderAllMarketTrendCharts] Starting...');
  
  // Initialize chart instances array
  if (!window.marketTrendChartInstances) {
    window.marketTrendChartInstances = [];
  }
  
// Clear any existing charts
console.log(`[renderAllMarketTrendCharts] Clearing ${window.marketTrendChartInstances.length} existing charts`);
window.marketTrendChartInstances.forEach(instance => {
  if (instance) {
    // Handle both old format (direct chart) and new format (object with chart and tooltip)
    if (typeof instance.destroy === 'function') {
      // Old format - direct chart instance
      instance.destroy();
    } else if (instance.chart && typeof instance.chart.destroy === 'function') {
      // New format - object with chart and tooltip
      instance.chart.destroy();
      if (instance.tooltip && instance.tooltip.remove) {
        instance.tooltip.remove();
      }
    }
  }
});
window.marketTrendChartInstances = [];
  
  // Find all market trend chart containers
  const chartContainers = document.querySelectorAll('[id^="marketTrendChart-"]');
  console.log(`[renderAllMarketTrendCharts] Found ${chartContainers.length} chart containers`);
  
  if (chartContainers.length === 0) {
    console.warn('[renderAllMarketTrendCharts] No chart containers found! Checking if table exists...');
    const table = document.querySelector('.product-map-table');
    console.log('  Product map table exists:', !!table);
    const marketTrendCols = document.querySelectorAll('.market-trend-column');
    console.log('  Market trend columns:', marketTrendCols.length);
    return;
  }
  
  chartContainers.forEach((container, index) => {
    const term = container.getAttribute('data-term');
    const location = container.getAttribute('data-location');
    const device = container.getAttribute('data-device');
    const company = container.getAttribute('data-company');
    
    console.log(`[renderAllMarketTrendCharts] Processing chart ${index}:`, {
      id: container.id,
      term, location, device, company
    });
    
    if (term && location && device && company) {
      console.log(`[renderAllMarketTrendCharts] Rendering chart for ${company}`);
      renderSingleMarketTrendChart(container.id, term, location, device, company);
    } else {
      console.warn(`[renderAllMarketTrendCharts] Missing data attributes for chart ${index}`);
    }
  });
  
  console.log('[renderAllMarketTrendCharts] Complete');
}

function renderSingleMarketTrendChart(containerId, searchTerm, location, device, myCompany) {
  // Check if ApexCharts is available
  if (typeof ApexCharts === 'undefined') {
    console.error(`[renderSingleMarketTrendChart] ApexCharts library not loaded!`);
    const chartEl = document.getElementById(containerId);
    if (chartEl) {
      chartEl.innerHTML = '<p style="text-align:center; color:#999;">Chart library not loaded</p>';
    }
    return;
  }
  
  const chartEl = document.getElementById(containerId);
  if (!chartEl || !window.companyStatsData) return;
  
  // Filter data for this specific combination
  const filtered = window.companyStatsData.filter(r =>
    r.q?.toLowerCase() === searchTerm.toLowerCase() &&
    r.location_requested?.toLowerCase() === location.toLowerCase() &&
    r.device?.toLowerCase() === device.toLowerCase() &&
    r.source // Has company data
  );
  
  if (!filtered.length) {
    chartEl.innerHTML = "<p style='text-align:center; color:#999;'>No data</p>";
    return;
  }
  
  // Use same date range logic as marketShareBigChart
  const days = 30;
  let maxDate = null;
  filtered.forEach(r => {
    (r.historical_data || []).forEach(d => {
      if (d.date && d.date.value) {
        const m = moment(d.date.value, "YYYY-MM-DD");
        if (!maxDate || m.isAfter(maxDate)) maxDate = m.clone();
      }
    });
  });
  
  if (!maxDate) {
    chartEl.innerHTML = "<p style='text-align:center; color:#999;'>No date data</p>";
    return;
  }
  
  const periodEnd = maxDate.clone();
  const periodStart = maxDate.clone().subtract(days - 1, "days");
  
  // Determine share field based on SERP segment filter
  let shareField = 'market_share';
  if (window.filterState && window.filterState.serpSegments) {
    switch (window.filterState.serpSegments) {
      case 'top3': shareField = 'top3_market_share'; break;
      case 'top4-8': shareField = 'top4_8_market_share'; break;
      case 'top9-14': shareField = 'top9_14_market_share'; break;
      case 'below14': shareField = 'below14_market_share'; break;
      case 'top8': shareField = 'top8_market_share'; break;
      case 'below8': shareField = 'below8_market_share'; break;
      default: shareField = 'market_share';
    }
  }
  
  // Build dailyMap[dateStr][companyName] = sumOfShare (same as marketShareBigChart)
  const dailyMap = {};
  filtered.forEach(rec => {
    (rec.historical_data || []).forEach(d => {
      const dd = moment(d.date.value, "YYYY-MM-DD");
      if (!dd.isBetween(periodStart, periodEnd, "day", "[]")) return;
      
      const val = parseFloat(d[shareField]) * 100 || 0;
      const dateStr = dd.format("YYYY-MM-DD");
      if (!dailyMap[dateStr]) dailyMap[dateStr] = {};
      const cName = (rec.source && rec.source.trim()) || "Unknown";
      if (!dailyMap[dateStr][cName]) dailyMap[dateStr][cName] = 0;
      dailyMap[dateStr][cName] += val;
    });
  });
  
  // Get all unique dates in ascending order
  let allDates = Object.keys(dailyMap).sort();
  if (!allDates.length) {
    chartEl.innerHTML = "<p style='text-align:center; color:#999;'>No market share found in this date range</p>";
    return;
  }
  
  // Sum total share by company across this window => pick top 10
  const companyTotals = {};
  allDates.forEach(dateStr => {
    Object.entries(dailyMap[dateStr]).forEach(([cName, val]) => {
      if (!companyTotals[cName]) companyTotals[cName] = 0;
      companyTotals[cName] += val;
    });
  });
  const sortedByTotal = Object.entries(companyTotals).sort((a,b) => b[1] - a[1]);
  const top10 = sortedByTotal.slice(0, 10).map(x => x[0]); // top 10
  const isTop10 = cName => top10.includes(cName);

  // Check if myCompany should be included
  const selectedCoRaw = myCompany || "";
  const selectedCo = selectedCoRaw.toLowerCase();
  if (selectedCo) {
    const lowerTop10 = top10.map(c => c.toLowerCase());
    if (!lowerTop10.includes(selectedCo)) {
      top10.push(selectedCoRaw);
    }
  }
  
  // Build final seriesMap with "Others" for companies not in top10
  const seriesMap = {};
  top10.forEach(c => { seriesMap[c] = []; });
  seriesMap["Others"] = [];
  
  allDates.forEach(dateStr => {
    const dayObj = dailyMap[dateStr];
    let sumOthers = 0;
    top10.forEach(c => {
      const val = dayObj[c] || 0;
      seriesMap[c].push({ x: dateStr, y: val });
    });
    Object.keys(dayObj).forEach(c => {
      if (!isTop10(c)) sumOthers += dayObj[c];
    });
    seriesMap["Others"].push({ x: dateStr, y: sumOthers });
  });
  
  // Convert seriesMap => array
  let finalSeries = [];
  for (let cName in seriesMap) {
    finalSeries.push({ name: cName, data: seriesMap[cName] });
  }
  
  // Apply same company selection logic as marketShareBigChart
  if (myCompany && myCompany.trim() !== "") {
    const selCompany = myCompany.trim().toLowerCase();
    
    // Find the index of that series in finalSeries
    let selIndex = finalSeries.findIndex(s => s.name.toLowerCase() === selCompany);
    if (selIndex >= 0) {
      // Splice it out and put it at the front (bottom layer)
      const [selectedObj] = finalSeries.splice(selIndex, 1);
      finalSeries.unshift(selectedObj);
      
      // Color the selected company normally, others in grey
      finalSeries.forEach((seriesObj, i) => {
        if (i === 0) {
          // The selected company
          seriesObj.color = "#007aff";
        } else {
          // All other companies in grey variants
          const greyLevel = 180 + i * 8;
          const capped = Math.min(greyLevel, 230);
          const greyHex = `rgb(${capped},${capped},${capped})`;
          seriesObj.color = greyHex;
        }
      });
    }
  }
  
// Create chart with same configuration as marketShareBigChart
const options = {
  series: finalSeries,
  chart: {
    type: "area",
    height: "100%",
    width: "100%",
    stacked: true, // Key difference - stacked areas
    toolbar: { show: true },
    zoom: { enabled: false },
    animations: {
      enabled: true,
      speed: 500,
      animateGradually: {
        enabled: true,
        delay: 50
      },
      dynamicAnimation: {
        enabled: true,
        speed: 500
      }
    }
  },
  dataLabels: (myCompany && myCompany.trim() !== "")
    ? {
        enabled: true,
        formatter: function(val, opts) {
          if (opts.seriesIndex === 0) {
            return val.toFixed(2) + "%";
          }
          return "";
        },
        offsetY: -5,
        style: { fontSize: '12px', colors: ['#000'] }
      }
    : { enabled: false },
  // Show markers only for selected series
  markers: (myCompany && myCompany.trim() !== "")
    ? { size: finalSeries.map((s, i) => (i === 0 ? 6 : 0)) }
    : { size: 0 },
  stroke: {
    curve: "smooth",
    width: 2
  },
  // Enhanced crosshairs configuration
  xaxis: {
    type: "datetime",
    labels: { show: true },
    crosshairs: {
      show: true,
      width: 1,
      position: 'back',
      opacity: 1,
      stroke: {
        color: '#376bae',
        width: 2,
        dashArray: 0
      },
      fill: {
        type: 'solid',
        color: '#B3E5FC',
        opacity: 0.2
      },
      dropShadow: {
        enabled: true,
        top: 0,
        left: 0,
        blur: 1,
        opacity: 0.4
      }
    }
  },
  yaxis: {
    labels: { 
      show: true,
      formatter: function(val) { 
        return val.toFixed(2); 
      }
    },
    title: { text: "Market Share (%)" },
    max: 100,
    // Also add crosshairs to Y axis for better visibility
    crosshairs: {
      show: true,
      position: 'back',
      stroke: {
        color: '#376bae',
        width: 1,
        dashArray: 3
      }
    }
  },
  legend: {
    show: true,
    position: "top",
    horizontalAlign: "left"
  },
tooltip: {
  enabled: true,  // Enable this for crosshairs to work
  custom: function() { return ''; }, // But return empty string to hide default tooltip
  shared: true,
  intersect: false,
  followCursor: true
},
  grid: {
    show: true,
    borderColor: '#f1f1f1',
    strokeDashArray: 0,
    xaxis: {
      lines: {
        show: true
      }
    }
  },
  fill: {
    type: "gradient",
    gradient: { opacityFrom: 0.75, opacityTo: 0.95 }
  },
  colors: finalSeries.map(s => s.color || undefined) // Use our custom colors
};

// Create and render the chart
try {
  const chart = new ApexCharts(chartEl, options);
  chart.render();

  // Wait for chart to fully render
  setTimeout(() => {
    // Custom tooltip implementation with click
    const customTooltip = document.createElement('div');
    customTooltip.id = `custom-tooltip-${containerId}`;
    customTooltip.style.cssText = `
      position: fixed;
      display: none;
      background: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      padding: 12px 16px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      min-width: 280px;
      max-width: 400px;
      max-height: none !important;
      overflow: visible !important;
      z-index: 10000;
      pointer-events: auto;
    `;
    document.body.appendChild(customTooltip);

    // Add close button to tooltip
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      color: #666;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    closeButton.innerHTML = '×';
    closeButton.onmouseover = () => { closeButton.style.backgroundColor = '#f0f0f0'; };
    closeButton.onmouseout = () => { closeButton.style.backgroundColor = 'transparent'; };
    
    // Get the chart's DOM element
    const chartElement = document.querySelector(`#${containerId} .apexcharts-canvas`);
    if (!chartElement) return;

    // Variables to track hover and click state
    let currentHoverIndex = -1;
    let isTooltipOpen = false;
    let highlightRect = null;

// Helper function to get data point from mouse position
function getDataPointFromEvent(e) {
  const rect = chartElement.getBoundingClientRect();
  const x = e.clientX - rect.left;
  
  // Get chart internals
  const w = chart.w;
  const gridWidth = w.globals.gridWidth;
  const translateX = w.globals.translateX;
  
  // IMPORTANT: Use the actual series data length, not labels length
  const actualDataPoints = w.config.series[0].data.length;
  const columnWidth = gridWidth / (actualDataPoints - 1);
  
  // Calculate which data point we're over
  const adjustedX = x - translateX;
  
  // Find closest data point
  let closestIndex = Math.round(adjustedX / columnWidth);
  closestIndex = Math.max(0, Math.min(actualDataPoints - 1, closestIndex));
  
  // Verify the date at this index
  if (w.globals.seriesX && w.globals.seriesX[0] && w.globals.seriesX[0][closestIndex]) {
    const timestamp = w.globals.seriesX[0][closestIndex];
    const date = new Date(timestamp);
  }
  
  return closestIndex;
}

// Function to update highlight
function updateHighlight(dataPointIndex) {
  
  // Remove any existing highlight for THIS chart only
  const existingHighlight = chart.w.globals.dom.baseEl.querySelector('.chart-highlight-rect');
  if (existingHighlight) {
    existingHighlight.remove();
  }
  
  if (dataPointIndex < 0) return;
  
  // Create a new highlight div overlay
  const highlightDiv = document.createElement('div');
  highlightDiv.className = 'chart-highlight-rect';
  highlightDiv.style.cssText = `
    position: absolute;
    background-color: rgba(0, 122, 255, 0.1);
    border-left: 2px solid #007aff;
    border-right: 2px solid #007aff;
    pointer-events: none;
    z-index: 1;
  `;
  
  // IMPORTANT: Use actual series data length
  const actualDataPoints = chart.w.config.series[0].data.length;
  const gridWidth = chart.w.globals.gridWidth;
  const translateX = chart.w.globals.translateX;
  const columnWidth = gridWidth / (actualDataPoints - 1);
  
  // Calculate x position for the highlight
  let xPos = translateX + (dataPointIndex * columnWidth) - (columnWidth / 2);
  let width = columnWidth;
  
  // Special handling for first and last points
  if (dataPointIndex === 0) {
    xPos = translateX;
    width = columnWidth / 2;
  } else if (dataPointIndex === actualDataPoints - 1) {
    // For the last point, extend to the edge of the grid
    xPos = translateX + (dataPointIndex * columnWidth) - (columnWidth / 2);
    width = (translateX + gridWidth) - xPos;
  }
  
  // Ensure highlight doesn't extend beyond grid boundaries
  if (xPos < translateX) {
    width -= (translateX - xPos);
    xPos = translateX;
  }
  if (xPos + width > translateX + gridWidth) {
    width = (translateX + gridWidth) - xPos;
  }
  
  highlightDiv.style.left = xPos + 'px';
  highlightDiv.style.top = chart.w.globals.translateY + 'px';
  highlightDiv.style.width = width + 'px';
  highlightDiv.style.height = chart.w.globals.gridHeight + 'px';
  
  // Append to THIS chart's container only
  const innerContainer = chart.w.globals.dom.baseEl.querySelector('.apexcharts-inner');
  if (innerContainer) {
    innerContainer.appendChild(highlightDiv);
  }
}

// Function to build tooltip content
function buildTooltipContent(dataPointIndex) {
  console.log('[DEBUG] Building tooltip for index:', dataPointIndex);
  
  const series = chart.w.config.series;
  const labels = chart.w.globals.labels;
  
  if (dataPointIndex < 0 || dataPointIndex >= series[0].data.length) {
    return null;
  }
  
  // Debug: Check if data exists for this point
  let hasData = false;
  series.forEach((s, idx) => {
    if (s.data[dataPointIndex] && s.data[dataPointIndex].y !== null && s.data[dataPointIndex].y !== undefined) {
      hasData = true;
    }
  });
  
  if (!hasData) {
    console.log('[DEBUG] No data found for this index');
    return null;
  }
  
  let tooltipItems = [];
  for (let i = 0; i < series.length; i++) {
    let companyName = series[i].name;
    let seriesColor = series[i].color || chart.w.globals.colors[i] || "#007aff";
    let currentValue = series[i].data[dataPointIndex].y;
    let previousValue = dataPointIndex > 0 ? series[i].data[dataPointIndex - 1].y : null;
    let trendStr = "";
    
    if (previousValue !== null) {
      let diff = currentValue - previousValue;
      if (diff > 0) {
        trendStr = "▲ " + diff.toFixed(2) + "%";
      } else if (diff < 0) {
        trendStr = "▼ " + Math.abs(diff).toFixed(2) + "%";
      } else {
        trendStr = "±0.00%";
      }
    }
    
    tooltipItems.push({
      companyName,
      currentValue,
      trendStr,
      seriesColor
    });
  }
  
  let sortedItems = tooltipItems.slice().sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0));
  let othersItems = sortedItems.filter(item => item.companyName.trim().toLowerCase() === "others");
  let nonOthersItems = sortedItems.filter(item => item.companyName.trim().toLowerCase() !== "others");
  
  for (let i = 0; i < nonOthersItems.length; i++) {
    nonOthersItems[i].rank = i + 1;
  }
  let finalItems = nonOthersItems.concat(othersItems);
  
// IMPORTANT: Use seriesX to get the correct timestamp, not labels
const timestamp = chart.w.globals.seriesX[0][dataPointIndex];
const date = new Date(timestamp);

// Adjust for timezone issues - if time is near midnight, it might show previous day
// Add 12 hours to ensure we're solidly in the correct day
const adjustedDate = new Date(date.getTime() + (12 * 60 * 60 * 1000));

const readableDate = adjustedDate.toLocaleDateString('en-US', { 
  month: 'short', 
  day: 'numeric',
  year: 'numeric'
});
      
      let html = `
        <div style="margin-bottom: 10px; font-size: 14px; color: #333; font-weight: 600; border-bottom: 1px solid #ddd; padding-bottom: 6px; padding-right: 30px;">
          ${readableDate}
        </div>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; color: #333;">
      `;
      
      finalItems.forEach(item => {
        let rankHtml = "";
        if (item.companyName.trim().toLowerCase() !== "others") {
          rankHtml = `<span style="
            display: inline-block;
            width: 22px;
            height: 22px;
            line-height: 22px;
            border-radius: 11px;
            background: ${item.seriesColor};
            color: #fff;
            text-align: center;
            margin-right: 8px;
            font-weight: bold;
            font-size: 11px;
          ">${item.rank}</span>`;
        }
        
        let trendColored = item.trendStr;
        if (item.trendStr.startsWith("▲")) {
          trendColored = `<span style="color: #22c55e; font-weight: 600;">${item.trendStr}</span>`;
        } else if (item.trendStr.startsWith("▼")) {
          trendColored = `<span style="color: #ef4444; font-weight: 600;">${item.trendStr}</span>`;
        }
        
        html += `
          <tr style="border-bottom: 1px solid rgba(0,0,0,0.05);">
            <td style="padding: 6px 8px; vertical-align: middle;">
              ${rankHtml}<strong style="font-size: 13px;">${item.companyName}</strong>
            </td>
            <td style="padding: 6px 8px; text-align: right; vertical-align: middle; white-space: nowrap;">
              <strong style="font-size: 13px;">${(item.currentValue || 0).toFixed(2)}%</strong> ${trendColored}
            </td>
          </tr>
        `;
      });
      
      html += `</table>`;
      return html;
    }

    // Mouse move handler - only for highlighting
    chartElement.addEventListener('mousemove', function(e) {
      if (isTooltipOpen) return; // Don't update highlight if tooltip is open
      
      const dataPointIndex = getDataPointFromEvent(e);
      
      if (dataPointIndex !== currentHoverIndex) {
        currentHoverIndex = dataPointIndex;
        updateHighlight(dataPointIndex);
        
        // Change cursor to pointer when hovering over valid data point
        if (dataPointIndex >= 0) {
          chartElement.style.cursor = 'pointer';
        } else {
          chartElement.style.cursor = 'default';
        }
      }
    });

// Mouse leave handler
chartElement.addEventListener('mouseleave', function() {
  if (!isTooltipOpen) {
    currentHoverIndex = -1;
    // Remove highlight only from THIS chart
    const thisChartHighlight = chart.w.globals.dom.baseEl.querySelector('.chart-highlight-rect');
    if (thisChartHighlight) {
      thisChartHighlight.remove();
    }
    chartElement.style.cursor = 'default';
  }
});

    // Click handler
    chartElement.addEventListener('click', function(e) {
      console.log('[DEBUG] Chart clicked');
      const dataPointIndex = getDataPointFromEvent(e);
      
      console.log('[DEBUG] Click at index:', dataPointIndex);
      
      if (dataPointIndex >= 0) {
        const content = buildTooltipContent(dataPointIndex);
        if (content) {
          console.log('[DEBUG] Tooltip content generated successfully');
          customTooltip.innerHTML = content;
          customTooltip.appendChild(closeButton);
          customTooltip.style.display = 'block';
          isTooltipOpen = true;
          
          // Keep highlight visible while tooltip is open
          updateHighlight(dataPointIndex);
          
          // Position tooltip
          const tooltipRect = customTooltip.getBoundingClientRect();
          let left = e.clientX + 10;
          let top = e.clientY - tooltipRect.height / 2;
          
          if (left + tooltipRect.width > window.innerWidth) {
            left = e.clientX - tooltipRect.width - 10;
          }
          if (top < 10) {
            top = 10;
          }
          if (top + tooltipRect.height > window.innerHeight - 10) {
            top = window.innerHeight - tooltipRect.height - 10;
          }
          
          customTooltip.style.left = left + 'px';
          customTooltip.style.top = top + 'px';
        } else {
          console.log('[DEBUG] No content generated for tooltip');
        }
      } else {
        console.log('[DEBUG] Invalid data point index');
      }
    });

    // Close button handler
    closeButton.addEventListener('click', function(e) {
      e.stopPropagation();
      customTooltip.style.display = 'none';
      isTooltipOpen = false;
      const existingHighlight = document.querySelector('.chart-highlight-rect');
      if (existingHighlight) {
        existingHighlight.remove();
      }
      currentHoverIndex = -1;
    });

    // Click outside to close tooltip
    document.addEventListener('click', function(e) {
      if (isTooltipOpen && !chartElement.contains(e.target) && !customTooltip.contains(e.target)) {
        customTooltip.style.display = 'none';
        isTooltipOpen = false;
        const existingHighlight = document.querySelector('.chart-highlight-rect');
        if (existingHighlight) {
          existingHighlight.remove();
        }
        currentHoverIndex = -1;
      }
    });

    // Store references for cleanup
    window.marketTrendChartInstances.push({ 
      chart, 
      tooltip: customTooltip
    });
  }, 100); // Wait for chart to fully render
    
} catch (error) {
  console.error(`[renderSingleMarketTrendChart] Error rendering chart:`, error);
  chartEl.innerHTML = `<p style='text-align:center; color:#999;'>Error rendering chart: ${error.message}</p>`;
}
}
async function renderProductMapTable() {
  console.log("[renderProductMapTable] Starting render");
  
  // CLEAR GLOBALROWS BEFORE EACH RENDER
  window.globalRows = {};
  console.log("[renderProductMapTable] Cleared globalRows to prevent data contamination");

  // Add this debug check:
const currentProject = parseInt(window.dataPrefix?.match(/pr(\d+)_/)?.[1]) || 1;
console.log(`[renderProductMapTable] Rendering for project ${currentProject}`);

    // Get container early to use in error handling
  const container = document.getElementById("productMapPage");
  if (!container) {
    console.error("[renderProductMapTable] productMapPage container not found");
    return;
  }
  
    console.log("=== PRE-RENDER DEBUG ===");
  if (typeof window.debugProjectState === 'function') {
    window.debugProjectState();
  }
  
  // Check what's in company_serp_stats before rendering
  if (window.company_serp_stats) {
    console.log("company_serp_stats before render:");
    console.log("  Total records:", window.company_serp_stats.length);
    
    const companies = new Set(window.company_serp_stats.map(s => s.company).filter(Boolean));
    console.log("  Companies:", [...companies].slice(0, 10));
    
    // Check for Merrell
    const merrellCount = window.company_serp_stats.filter(s => 
      s.company && s.company.includes('Merrell')
    ).length;
    
    if (merrellCount > 0) {
      console.warn(`  ⚠️ Found ${merrellCount} Merrell records in company_serp_stats`);
    }
  }
  
  console.log("[renderProductMapTable] Starting render");
  
  // Safety check: Ensure company_serp_stats is regenerated for current project
  // Use a temporary variable to avoid redeclaration
  const tempProjectNum = window.dataPrefix ? 
    parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1]) || 1 : 1;
  
  // Check if company_serp_stats contains data from wrong project
  if (window.company_serp_stats && window.company_serp_stats.length > 0) {
    const statsProjectNumbers = new Set(window.company_serp_stats.map(stat => stat.project_number).filter(pn => pn != null));
    
    // If we have stats from multiple projects or wrong project, clear it
    if (statsProjectNumbers.size > 1 || (statsProjectNumbers.size === 1 && !statsProjectNumbers.has(tempProjectNum))) {
      console.warn("[renderProductMapTable] Detected stale company_serp_stats from different project(s):", [...statsProjectNumbers]);
      window.company_serp_stats = [];
    }
  }
  
  // Always regenerate company_serp_stats to ensure it's fresh
  prepareCompanySerpsStatsData();

  // Add after: console.log("[renderProductMapTable] Starting render");
console.log("=== PRODUCT MAP DATA SOURCE ===");
console.log("Using projectTableData:", window.projectTableData?.length || 0, "entries");
if (window.projectTableData && window.projectTableData.length > 0) {
  console.log("projectTableData sample:", JSON.stringify(window.projectTableData[0], null, 2));
}
  
// Ensure projectTableData exists before proceeding
if (!window.projectTableData || !Array.isArray(window.projectTableData)) {
  console.log("[renderProductMapTable] projectTableData not available, attempting to build it");
    
    // Try to build projectTableData if we have the source data
    if (window.companyStatsData && window.companyStatsData.length > 0) {
      if (typeof buildProjectData === 'function') {
        buildProjectData();
        console.log("[renderProductMapTable] Built projectTableData:", window.projectTableData?.length || 0, "entries");
      } else if (typeof populateProjectPage === 'function') {
        // Fallback: call populateProjectPage which includes buildProjectData
        console.log("[renderProductMapTable] buildProjectData not found, calling populateProjectPage");
        populateProjectPage();
      }
    }
    
    // Check again after attempting to build
    if (!window.projectTableData || !Array.isArray(window.projectTableData) || window.projectTableData.length === 0) {
      console.error("[renderProductMapTable] Failed to create projectTableData");
      container.innerHTML = `
        <div class="page-header">
          <h2>Product Map</h2>
          <div class="header-controls">
            <button class="apple-button" disabled>Full Screen</button>
          </div>
        </div>
        <div style="text-align: center; padding: 40px; color: #666;">
          <h3>Unable to load data</h3>
          <p>Required data is not available. Please refresh the page and try again.</p>
        </div>
      `;
      return;
    }
  }
  
  // Always refresh company data when rendering the table
  prepareCompanySerpsStatsData();
  
  // Check current mode
  const currentMode = document.querySelector('#modeSelector .mode-option.active')?.getAttribute('data-mode') || 'products';

  // Always refresh company data when rendering the table
  prepareCompanySerpsStatsData();
  
  // Check if company has changed
  if (window.lastProcessedCompany !== window.myCompany) {
    console.log(`[ProductMap] Company changed from ${window.lastProcessedCompany} to ${window.myCompany}, clearing company stats`);
    window.company_serp_stats = null;
    window.lastProcessedCompany = window.myCompany;
    prepareCompanySerpsStatsData();
  }
  
  document.body.classList.remove('mode-products', 'mode-companies');
  document.body.classList.add(`mode-${currentMode}`);
  
  const useLatestRecordAsEndDate = false;
  let hoverTimeout = null;
  let currentPopup = null;
  console.log("[DEBUG] Previous globalRows keys:", Object.keys(window.globalRows || {}).length);
  console.log("[renderProductMapTable] Starting to build product map table");
    
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
  <div id="productMapContainer" style="width: 100%; height: calc(100vh - 50px); overflow-y: auto; position: relative;">
    <div id="product-map-table-placeholder"></div>
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
    document.querySelectorAll("#fullscreenToggle").forEach(fullscreenBtn => {
      fullscreenBtn.addEventListener("click", function() {
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
  });

// Function to attach event listeners to header controls
function attachHeaderControlListeners() {
  console.log('[ProductMap] Attaching header control listeners...');
  
  // Add all products toggle functionality
  const allProductsToggles = document.querySelectorAll("#allProductsToggle");
  console.log('[ProductMap] Found', allProductsToggles.length, 'allProductsToggle elements');
  allProductsToggles.forEach(allProductsToggle => {
    if (allProductsToggle && !allProductsToggle.hasListener) {
      allProductsToggle.hasListener = true;
      
      // Restore toggle state
      allProductsToggle.checked = window.showAllProductsInMap || false;
      
      allProductsToggle.addEventListener("change", function() {
        const isChecked = this.checked;
        console.log(`[ProductMap] All Products toggle: ${isChecked ? 'ON' : 'OFF'}`);
        
        // Store the toggle state
        window.showAllProductsInMap = isChecked;
        
        // Sync all toggles
        document.querySelectorAll("#allProductsToggle").forEach(toggle => toggle.checked = isChecked);
        
        // Get the current mode
        const currentMode = document.querySelector('#modeSelector .mode-option.active')?.getAttribute('data-mode') || 'products';
        if (currentMode === 'companies') {
          prepareCompanySerpsStatsData();
        }
        
        // Re-render the entire table
        renderProductMapTable();
      });
    }
  });

  // Add metrics toggle functionality
  const metricsToggles = document.querySelectorAll("#metricsToggle");
  console.log('[ProductMap] Found', metricsToggles.length, 'metricsToggle elements');
  metricsToggles.forEach(metricsToggle => {
    if (metricsToggle && !metricsToggle.hasListener) {
      metricsToggle.hasListener = true;
      
      // Restore toggle state
      metricsToggle.checked = window.metricsToggleState || false;
      
      metricsToggle.addEventListener("change", function() {
        const isChecked = this.checked;
        
        // Store the toggle state
        window.metricsToggleState = isChecked;
        console.log(`[ProductMap] Metrics toggle: ${isChecked ? 'ON' : 'OFF'}`);
        
        // Sync all toggles
        document.querySelectorAll("#metricsToggle").forEach(toggle => toggle.checked = isChecked);
        
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
  });

  // Add bucket type selector functionality
  const bucketSelectors = document.querySelectorAll("#bucketTypeSelector");
  console.log('[ProductMap] Found', bucketSelectors.length, 'bucketTypeSelector elements');
  bucketSelectors.forEach(bucketSelector => {
    if (bucketSelector && !bucketSelector.hasListener) {
      bucketSelector.hasListener = true;
      
      bucketSelector.addEventListener("change", function() {
        const selectedBucketType = this.value;
        console.log(`[ProductMap] Switching to bucket type: ${selectedBucketType}`);
        
        // Sync all selectors
        document.querySelectorAll("#bucketTypeSelector").forEach(selector => selector.value = selectedBucketType);
        
        // Update all bucket badges
        document.querySelectorAll('.bucket-badge').forEach(badge => {
          const adCard = badge.parentElement;
          const plaIndex = adCard.getAttribute('data-pla-index');
          const product = window.globalRows[plaIndex];
          
          if (product && googleAdsEnabled && bucketDataMap.size > 0) {
            const row = adCard.closest('tr');
            const deviceCell = row.querySelector('.device-icon');
            const deviceValue = deviceCell ? (deviceCell.alt || '').toUpperCase() : 'DESKTOP';
            
            const productData = window.globalRows[plaIndex];
            if (!productData) return;
            const lookupKey = `${productData.title.toLowerCase()}|${deviceValue}`;
            
            const productBucketData = bucketDataMap.get(lookupKey);
            
            if (productBucketData) {
              const bucketResult = getBucketBadgeHTML(productBucketData, selectedBucketType);
              
              const existingBadge = adCard.querySelector('.bucket-badge');
              if (existingBadge) {
                existingBadge.remove();
              }
              
              adCard.classList.remove('sellers-revenue-stars', 'sellers-best-sellers', 'sellers-volume-leaders', 'sellers-standard');
              
              if (bucketResult.badgeHTML) {
                adCard.insertAdjacentHTML('afterbegin', bucketResult.badgeHTML);
                if (!adCard.classList.contains('has-bucket')) {
                  adCard.classList.add('has-bucket');
                }
              } else {
                adCard.classList.remove('has-bucket');
              }
              
              if (bucketResult.containerClass) {
                adCard.classList.add(bucketResult.containerClass);
              }
            }
          }
        });
      });
    }
  });

  // Add view switcher functionality for Products mode
  const viewProductsBtns = document.querySelectorAll("#viewProducts");
  const viewChartsBtns = document.querySelectorAll("#viewCharts");
  console.log('[ProductMap] Found', viewProductsBtns.length, 'viewProducts buttons');

  viewProductsBtns.forEach((viewProductsBtn, index) => {
    const viewChartsBtn = viewChartsBtns[index];
    
    if (viewProductsBtn && viewChartsBtn && !viewProductsBtn.hasListener) {
      viewProductsBtn.hasListener = true;
      viewChartsBtn.hasListener = true;
      
      viewProductsBtn.addEventListener("click", function() {
        document.body.classList.remove('charts-mode');
        document.body.classList.add('products-mode');
        
        document.querySelectorAll("#viewProducts").forEach(btn => btn.classList.add("active"));
        document.querySelectorAll("#viewCharts").forEach(btn => btn.classList.remove("active"));
        
        document.querySelectorAll('.product-cell-container').forEach(container => {
          container.style.display = 'block';
          container.style.visibility = 'visible';
        });
        document.querySelectorAll('.products-chart-container').forEach(container => {
          container.style.display = 'none';
          container.style.visibility = 'hidden';
        });
        
        document.querySelectorAll('.product-map-table tbody tr').forEach(row => {
          row.style.height = '380px';
          row.style.maxHeight = '380px';
        });
        
        document.querySelectorAll('.product-map-table td').forEach(cell => {
          cell.style.height = '380px';
          cell.style.maxHeight = '380px';
        });
        
        console.log('[ProductMap] Switched to Products view');
      });
      
      viewChartsBtn.addEventListener("click", function() {
        document.body.classList.remove('products-mode');
        document.body.classList.add('charts-mode');
        
        document.querySelectorAll("#viewCharts").forEach(btn => btn.classList.add("active"));
        document.querySelectorAll("#viewProducts").forEach(btn => btn.classList.remove("active"));
        
        document.querySelectorAll('.product-cell-container').forEach(container => {
          container.style.display = 'none';
          container.style.visibility = 'hidden';
        });
        document.querySelectorAll('.products-chart-container').forEach(container => {
          container.style.display = 'flex';
          container.style.visibility = 'visible';
          container.style.height = '580px';
          container.style.maxHeight = '580px';
          container.style.overflow = 'hidden';
        });
        
        document.querySelectorAll('.product-map-table tbody tr').forEach(row => {
          row.style.height = '600px';
          row.style.maxHeight = '600px';
        });
        
        document.querySelectorAll('.product-map-table td').forEach(cell => {
          cell.style.height = '600px';
          cell.style.maxHeight = '600px';
        });
        
        setTimeout(() => {
          document.querySelectorAll('.products-chart-container').forEach(container => {
            const chartAvgPosDiv = container.querySelector('.chart-avg-position');
            const chartProductsDiv = container.querySelector('.chart-products');
            
            if (chartAvgPosDiv) {
              chartAvgPosDiv.style.height = '580px';
              chartAvgPosDiv.style.maxHeight = '580px';
            }
            if (chartProductsDiv) {
              chartProductsDiv.style.height = '580px';
              chartProductsDiv.style.maxHeight = '580px';
            }
            
            const smallCards = chartProductsDiv.querySelectorAll('.small-ad-details');
            let products = Array.from(smallCards).map(card => card.productData).filter(p => p);
            products = products.filter(p => p._isMyCompany);
            
            if (products.length > 0 && chartAvgPosDiv) {
              renderAvgPositionChart(chartAvgPosDiv, products);
            }
            
            smallCards.forEach((card, index) => {
              const oldHandler = card._chartClickHandler;
              if (oldHandler) {
                card.removeEventListener('click', oldHandler);
              }
              
              const clickHandler = function() {
                if (chartAvgPosDiv.selectedProductIndex === index) {
                  chartAvgPosDiv.selectedProductIndex = null;
                  card.classList.remove('active');
                } else {
                  chartAvgPosDiv.selectedProductIndex = index;
                  smallCards.forEach(c => c.classList.remove('active'));
                  card.classList.add('active');
                }
                updateChartLineVisibility(chartAvgPosDiv, chartAvgPosDiv.selectedProductIndex);
              };
              
              card._chartClickHandler = clickHandler;
              card.addEventListener('click', clickHandler);
            });
          });
        }, 100);
        
        console.log('[ProductMap] Switched to Charts view');
      });
    }
  });

  // Add company view switcher functionality for Companies mode
  const viewCompaniesBtns = document.querySelectorAll("#viewCompanies");
  const viewMarketTrendBtns = document.querySelectorAll("#viewMarketTrend");
  console.log('[ProductMap] Found', viewCompaniesBtns.length, 'viewCompanies buttons');

  viewMarketTrendBtns.forEach((viewMarketTrendBtn, index) => {
    const viewCompaniesBtn = viewCompaniesBtns[index];
    
    if (viewMarketTrendBtn && viewCompaniesBtn && !viewMarketTrendBtn.hasListener) {
      viewMarketTrendBtn.hasListener = true;
      viewCompaniesBtn.hasListener = true;
      
      viewMarketTrendBtn.addEventListener("click", function() {
        console.log('[Debug] Market Trend button clicked');
        document.body.classList.add('market-trend-mode');
        document.body.classList.remove('companies-mode');
        
        document.querySelectorAll("#viewMarketTrend").forEach(btn => btn.classList.add("active"));
        document.querySelectorAll("#viewCompanies").forEach(btn => btn.classList.remove("active"));
        
        const companyCellContainers = document.querySelectorAll('.company-cell-container');
        const marketTrendContainers = document.querySelectorAll('.market-trend-container');
        
        companyCellContainers.forEach((container) => {
          container.style.display = 'none !important';
          container.style.visibility = 'hidden';
          container.style.opacity = '0';
        });
        
        marketTrendContainers.forEach((container) => {
          container.style.display = 'block !important';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
        });
        
        if (typeof ApexCharts === 'undefined') {
          console.error('[ProductMap] ApexCharts library not loaded!');
          alert('Chart library not loaded. Please refresh the page.');
          return;
        }
        
        setTimeout(() => {
          renderAllMarketTrendCharts();
        }, 100);
        
        console.log('[ProductMap] Switched to Market Trend view');
      });
      
      viewCompaniesBtn.addEventListener("click", function() {
        document.body.classList.add('companies-mode');
        document.body.classList.remove('market-trend-mode');
        
        document.querySelectorAll("#viewCompanies").forEach(btn => btn.classList.add("active"));
        document.querySelectorAll("#viewMarketTrend").forEach(btn => btn.classList.remove("active"));
        
        document.querySelectorAll('.company-cell-container').forEach(container => {
          container.style.display = 'block';
          container.style.visibility = 'visible';
          container.style.opacity = '1';
          container.style.cssText = container.style.cssText.replace(/display\s*:\s*none\s*!important\s*;?/g, 'display: block;');
        });
        
        document.querySelectorAll('.market-trend-container').forEach(container => {
          container.style.display = 'none';
          container.style.visibility = 'hidden';
          container.style.opacity = '0';
        });
        
        if (window.marketTrendChartInstances) {
          window.marketTrendChartInstances.forEach(instance => {
            if (instance.chart) instance.chart.destroy();
            if (instance.tooltip) instance.tooltip.remove();
          });
          window.marketTrendChartInstances = [];
        }
        
        console.log('[ProductMap] Switched to Companies view');
      });
    }
  });
  
  console.log('[ProductMap] Header control listeners attached successfully');
}

// Listen for mode changes to control switcher visibility
document.querySelectorAll('#modeSelector .mode-option').forEach(option => {
  option.addEventListener('click', function() {
    const selectedMode = this.getAttribute('data-mode');
    
    // Update body class
    document.body.classList.remove('mode-products', 'mode-companies');
    document.body.classList.add(`mode-${selectedMode}`);
    
    // Control switcher visibility based on mode
    const productViewSwitcher = document.getElementById('productViewSwitcher');
    const compViewSwitcher = document.getElementById('compViewSwitcher');
    
    if (selectedMode === 'products') {
      // Show product view switcher, hide company view switcher
      if (productViewSwitcher) productViewSwitcher.style.display = 'inline-flex';
      if (compViewSwitcher) compViewSwitcher.style.display = 'none';
    } else if (selectedMode === 'companies') {
      // Hide product view switcher, show company view switcher
      if (productViewSwitcher) productViewSwitcher.style.display = 'none';
      if (compViewSwitcher) compViewSwitcher.style.display = 'inline-flex';
    }
    
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
          margin-top: 15px;
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
          position: relative;
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
  margin-bottom: 4px;
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
  visibility: hidden;
  width: 100%;
  height: 580px; /* 600px row minus padding */
  max-height: 580px;
  overflow: hidden;
  flex-direction: row;
  gap: 10px;
}

.chart-products {
  width: 280px;
  height: 580px; /* Match container height */
  max-height: 580px;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 5px;
  scrollbar-width: auto;
  scrollbar-color: #ccc #f9f9f9;
  box-sizing: border-box;
}

.chart-avg-position {
  flex: 1;
  min-width: 300px;
  height: 580px; /* Match container height */
  max-height: 580px;
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-style: italic;
  box-sizing: border-box;
  overflow: hidden;
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
  width: 180px;
  min-width: 180px;
  max-width: 180px; /* Prevent growing */
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

/* Hide trend stats */
.comp-details .trend-stats {
  display: none !important;
}

/* Mini SERP table styles - REDESIGNED */
.mini-serp-container {
  padding: 8px 10px;
  margin-top: 5px;
}

.mini-serp-table {
  width: 100%;
  font-size: 10px;
}

.serp-row {
  display: flex;
  align-items: center;
  margin-bottom: 2px;
  height: 24px;
  position: relative;
}

.serp-row.top40 {
  height: 32px;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.serp-segment-label {
  width: 60px;
  font-weight: 600;
  font-size: 11px;
  color: #333;
}

.serp-row.top40 .serp-segment-label {
  font-size: 12px;
  font-weight: 700;
}

.serp-share-bar-container {
  flex: 1;
  height: 100%;
  position: relative;
  margin-right: 5px;
}

.serp-share-bar {
  height: 100%;
  border-radius: 4px;
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 8px;
  transition: width 0.3s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.serp-share-bar.positive {
  background: linear-gradient(to right, #4FC3F7, #2196F3);
}

.serp-share-bar.negative {
  background: linear-gradient(to right, #EF5350, #F44336);
}

.serp-share-bar.neutral {
  background: linear-gradient(to right, #90A4AE, #78909C);
}

.serp-share-value {
  color: #0d0f58;
  font-weight: 700;
  font-size: 11px;
}

.serp-row.top40 .serp-share-value {
  font-size: 13px;
}

.serp-trend-value {
  width: 60px;
  text-align: right;
  font-weight: 600;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.serp-row.top40 .serp-trend-value {
  font-size: 11px;
}

.serp-trend-value.trend-up {
  color: #4CAF50;
}

.serp-trend-value.trend-down {
  color: #F44336;
}

.serp-trend-value.trend-neutral {
  color: #666;
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
  display: block !important; /* Force visible by default */
  visibility: visible;
}

/* When in charts mode, ensure product containers are hidden */
body.charts-mode .product-cell-container {
  display: none !important;
  visibility: hidden !important;
}

body.charts-mode .products-chart-container {
  display: flex !important;
  visibility: visible !important;
}

.company-cell-container {
  width: 100%;
  height: 100%;
  display: block !important; /* Always block */
}
.rank-box-mini.no-data {
  background-color: #e0e0e0 !important;
  border: 1px dashed #ccc;
  cursor: default;
}
/* Company rank styling */
.company-rank {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  font-weight: 600;
  z-index: 15; /* Changed from 10 to 15 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-width: 40px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.company-rank .rank-label {
  font-weight: 500;
  opacity: 0.8;
  font-size: 9px;
  line-height: 1;
}

.company-rank .rank-value {
  font-weight: 700;
  font-size: 16px;
  line-height: 1;
  margin-top: 2px;
}

.company-rank.rank-green {
  background-color: #C8E6C9;
  color: #2E7D32;
}

.company-rank.rank-yellow {
  background-color: #FFF9C4;
  color: #F57C00;
}

.company-rank.rank-orange {
  background-color: #FFE0B2;
  color: #E65100;
}

.company-rank.rank-red {
  background-color: #FFCDD2;
  color: #C62828;
}

/* Company market badge - water fill style */
.company-market-badge {
  position: absolute;
  top: 5px;
  right: 5px !important;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 900;
  color: #007aff;
  z-index: 15; /* Increased to ensure it's above logo */
  border: 2px solid white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  line-height: 1;
  background: white;
  overflow: hidden;
}

.company-market-badge .market-badge-value {
  position: relative;
  z-index: 1;
  font-size: 15px;
  font-weight: 900;
  text-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.company-market-badge .market-badge-water {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  background: linear-gradient(to top, #0056b3 0%, #007aff 50%, #5ac8fa 100%);
  transition: height 0.5s ease;
  z-index: 0;
  animation: wave 3s ease-in-out infinite;
  border-radius: 50%;
  opacity: 0.3;
}

@keyframes wave {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3px);
  }
}

/* Products stats updated styling */
.products-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  margin: 8px 10px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.products-stat-left, .products-stat-right {
  text-align: center;
  flex: 1;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
  color: #212529;
  line-height: 1;
  margin-bottom: 3px;
}

.stat-label {
  font-size: 11px;
  color: #6c757d;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

/* My company special styling */
.comp-details.my-company-comp {
  border: 3px solid #28a745;
  box-shadow: 0 0 10px rgba(40, 167, 69, 0.3);
  position: relative;
}

.comp-details.my-company-comp::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  background: linear-gradient(45deg, #28a745, #4CAF50, #28a745);
  border-radius: 11px;
  z-index: -1;
  opacity: 0.3;
}
.comp-details .company-logo {
  width: 100%;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  margin-top: 0; /* Changed from 20px to 0 */
  position: relative;
  z-index: 1;
}
/* Company View Switcher styles */
.comp-view-switcher {
  position: absolute;
  top: 10px;
  right: 140px; /* Positioned before the fullscreen button */
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  z-index: 100;
}

.comp-view-switcher button {
  padding: 6px 16px;
  border: none;
  background: transparent;
  border-radius: 17px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #666;
}

.comp-view-switcher button:hover:not(.active) {
  background-color: rgba(0, 122, 255, 0.1);
}

.comp-view-switcher button.active {
  background-color: #007aff;
  color: white;
}
/* Market Trend Chart Styles - Enhanced */
.market-trend-column {
  padding: 10px !important;
  vertical-align: middle !important;
  width: 600px !important;
  min-width: 600px !important;
  max-width: 600px !important;
}

.market-trend-chart-container {
  background: #f8f9fa !important;
  border-radius: 8px !important;
  padding: 15px !important;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05) !important;
  width: 570px !important;
  height: 320px !important;
  min-height: 320px !important;
  max-height: 320px !important;
  position: relative !important;
}

.market-trend-chart-container > div {
  width: 540px !important;
  height: 290px !important;
  min-height: 290px !important;
  max-height: 290px !important;
}

/* Ensure proper column visibility in Companies mode */
.mode-companies .companies-column {
  display: table-cell !important;
}

.mode-companies .market-trend-column {
  display: none !important;
}
/* Force hiding of company containers in market trend mode */
.market-trend-mode .company-cell-container {
  display: none !important;
  visibility: hidden !important;
  opacity: 0 !important;
}

.market-trend-mode .market-trend-container {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
/* Fix ApexCharts tooltip constraints */
.apexcharts-tooltip {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
  z-index: 10000 !important;
}

.apexcharts-tooltip-custom {
  max-width: none !important;
  max-height: none !important;
  width: auto !important;
  height: auto !important;
  overflow: visible !important;
}

.apexcharts-tooltip.apexcharts-theme-light {
  border: none !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
}

/* Ensure market trend containers have proper overflow */
.market-trend-container {
  overflow: visible !important;
  position: relative !important;
  z-index: 1 !important;
}

/* Prevent scroll zoom on charts */
.apexcharts-canvas {
  overflow: hidden !important;
}

/* Header controls container */
.header-controls-container {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 15px;
  padding: 5px 0;
  flex-wrap: nowrap;
}

/* Adjust toggle containers for header */
.products-header .all-products-toggle-container,
.companies-header .all-products-toggle-container,
.products-header .metrics-toggle-container,
.companies-header .metrics-toggle-container {
  position: static;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

/* Adjust bucket selector for header */
.products-header .bucket-type-selector,
.companies-header .bucket-type-selector {
  position: static;
  padding: 6px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: white;
  cursor: pointer;
  min-width: 140px;
}

/* Adjust view switchers for header */
.products-header .view-switcher,
.products-header .comp-view-switcher,
.companies-header .view-switcher,
.companies-header .comp-view-switcher {
  position: static;
  display: inline-flex;
  background-color: #f0f0f0;
  border-radius: 20px;
  padding: 3px;
  margin: 0;
}

/* Adjust fullscreen button for header */
.products-header .fullscreen-toggle,
.companies-header .fullscreen-toggle {
  position: static;
  padding: 6px 12px;
  background-color: #007aff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.products-header .fullscreen-toggle:hover,
.companies-header .fullscreen-toggle:hover {
  background-color: #0056b3;
}

/* Ensure labels are readable */
.header-controls-container .all-products-toggle-label,
.header-controls-container .metrics-toggle-label {
  font-size: 12px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
}

.product-cell .star {
  display: inline-block !important;
  width: 14px !important;
  height: 14px !important;
  position: relative !important;
  margin: 0 1px;
}

.product-cell .star::before {
  content: "★";
  position: absolute;
  left: 0;
  top: -2px;
  font-size: 16px;
  line-height: 14px;
  color: #fbbc04;
  width: var(--fill-width, 100%);
  overflow: hidden;
  display: block;
}

.product-cell .star::after {
  content: "★";
  position: absolute;
  left: 0;
  top: -2px;
  font-size: 16px;
  line-height: 14px;
  color: #dadce0;
  z-index: -1;
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
  
function calculateAggregateSegmentData(products) {
  console.log(`[AGGREGATE CALC DEBUG] Starting with ${products.length} products`);
  
  if (!products || products.length === 0) {
    console.log(`[AGGREGATE CALC DEBUG] No products to calculate`);
    return [
      { label: "Top3", current: 0, previous: 0 },
      { label: "Top4-8", current: 0, previous: 0 },
      { label: "Top9-14", current: 0, previous: 0 },
      { label: "Below14", current: 0, previous: 0 }
    ];
  }
  
  // Get the last 7 days of data
  const endDate = moment();
  const startDate = moment().subtract(6, 'days');
  const prevEndDate = moment().subtract(7, 'days');
  const prevStartDate = moment().subtract(13, 'days');
  
  console.log(`[AGGREGATE CALC DEBUG] Date ranges:`, {
    current: `${startDate.format('YYYY-MM-DD')} to ${endDate.format('YYYY-MM-DD')}`,
    previous: `${prevStartDate.format('YYYY-MM-DD')} to ${prevEndDate.format('YYYY-MM-DD')}`
  });
  
  // Initialize segment sums
  let currTop3Sum = 0, currTop8Sum = 0, currTop14Sum = 0, currTop40Sum = 0;
  let prevTop3Sum = 0, prevTop8Sum = 0, prevTop14Sum = 0, prevTop40Sum = 0;
  let countCurrent = 0, countPrevious = 0;
  
  // Track products with data
  let productsWithCurrentData = 0;
  let productsWithPreviousData = 0;
  
  // Process each product
  products.forEach((product, index) => {
    if (!product.historical_data || !Array.isArray(product.historical_data)) {
      console.log(`[AGGREGATE CALC DEBUG] Product ${index} "${product.title}" has no historical data`);
      return;
    }
    
    let productCurrentCount = 0;
    let productPreviousCount = 0;
    
    // Current period
    product.historical_data.forEach(dayData => {
      if (!dayData.date || !dayData.date.value) return;
      
      const date = moment(dayData.date.value);
      
      // Check if in current period
      if (date.isBetween(startDate, endDate, 'day', '[]')) {
        const top3Val = parseFloat(dayData.top3_market_share || 0);
        const top8Val = parseFloat(dayData.top8_market_share || 0);
        const top14Val = parseFloat(dayData.top14_market_share || 0);
        const top40Val = parseFloat(dayData.market_share || 0);
        
        currTop3Sum += top3Val;
        currTop8Sum += top8Val;
        currTop14Sum += top14Val;
        currTop40Sum += top40Val;
        countCurrent++;
        productCurrentCount++;
      }
      
      // Check if in previous period
      if (date.isBetween(prevStartDate, prevEndDate, 'day', '[]')) {
        const top3Val = parseFloat(dayData.top3_market_share || 0);
        const top8Val = parseFloat(dayData.top8_market_share || 0);
        const top14Val = parseFloat(dayData.top14_market_share || 0);
        const top40Val = parseFloat(dayData.market_share || 0);
        
        prevTop3Sum += top3Val;
        prevTop8Sum += top8Val;
        prevTop14Sum += top14Val;
        prevTop40Sum += top40Val;
        countPrevious++;
        productPreviousCount++;
      }
    });
    
    if (productCurrentCount > 0) productsWithCurrentData++;
    if (productPreviousCount > 0) productsWithPreviousData++;
    
    console.log(`[AGGREGATE CALC DEBUG] Product ${index} "${product.title}": current period entries: ${productCurrentCount}, previous period entries: ${productPreviousCount}`);
  });
  
  console.log(`[AGGREGATE CALC DEBUG] Summary:`, {
    totalProducts: products.length,
    productsWithCurrentData,
    productsWithPreviousData,
    currentPeriodEntries: countCurrent,
    previousPeriodEntries: countPrevious
  });
  
  console.log(`[AGGREGATE CALC DEBUG] Raw sums:`, {
    current: { 
      top3: currTop3Sum.toFixed(4), 
      top8: currTop8Sum.toFixed(4), 
      top14: currTop14Sum.toFixed(4), 
      top40: currTop40Sum.toFixed(4), 
      count: countCurrent 
    },
    previous: { 
      top3: prevTop3Sum.toFixed(4), 
      top8: prevTop8Sum.toFixed(4), 
      top14: prevTop14Sum.toFixed(4), 
      top40: prevTop40Sum.toFixed(4), 
      count: countPrevious 
    }
  });
  
  // Calculate averages (already in percentage form from the data)
  const currTop3 = countCurrent > 0 ? (currTop3Sum / countCurrent) * 100 : 0;
  const currTop8 = countCurrent > 0 ? (currTop8Sum / countCurrent) * 100 : 0;
  const currTop14 = countCurrent > 0 ? (currTop14Sum / countCurrent) * 100 : 0;
  const currTop40 = countCurrent > 0 ? (currTop40Sum / countCurrent) * 100 : 0;
  
  const prevTop3 = countPrevious > 0 ? (prevTop3Sum / countPrevious) * 100 : 0;
  const prevTop8 = countPrevious > 0 ? (prevTop8Sum / countPrevious) * 100 : 0;
  const prevTop14 = countPrevious > 0 ? (prevTop14Sum / countPrevious) * 100 : 0;
  const prevTop40 = countPrevious > 0 ? (prevTop40Sum / countPrevious) * 100 : 0;
  
  console.log(`[AGGREGATE CALC DEBUG] Calculated averages:`, {
    current: { 
      top3: currTop3.toFixed(2), 
      top8: currTop8.toFixed(2), 
      top14: currTop14.toFixed(2), 
      top40: currTop40.toFixed(2) 
    },
    previous: { 
      top3: prevTop3.toFixed(2), 
      top8: prevTop8.toFixed(2), 
      top14: prevTop14.toFixed(2), 
      top40: prevTop40.toFixed(2) 
    }
  });
  
  // Format data for chart (using differences between segments)
  const result = [
    { label: "Top3", current: currTop3, previous: prevTop3 },
    { label: "Top4-8", current: currTop8 - currTop3, previous: prevTop8 - prevTop3 },
    { label: "Top9-14", current: currTop14 - currTop8, previous: prevTop14 - prevTop8 },
    { label: "Below14", current: currTop40 - currTop14, previous: prevTop40 - prevTop14 }
  ];
  
  console.log(`[AGGREGATE CALC DEBUG] Final formatted result:`, result);
  
  return result;
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
const projectData = buildProjectData(); // This will use the same filtering
let nestedMap = {};
projectData.forEach(item => {
  const term = item.searchTerm || "(no term)";
  const loc  = item.location   || "(no loc)";
  if (!nestedMap[term]) nestedMap[term] = {};
  if (!nestedMap[term][loc]) nestedMap[term][loc] = [];
  nestedMap[term][loc].push(item);
});

// Check if we should filter by search term
// Only filter if:
// 1. filterState exists and has a searchTerm
// 2. The searchTermRow is visible (indicating active filter)
const searchTermRow = document.getElementById("searchTermRow");
const isSearchTermFilterActive = searchTermRow && searchTermRow.style.display !== "none";

if (window.filterState && 
    window.filterState.searchTerm && 
    window.filterState.searchTerm.trim() !== "" && 
    isSearchTermFilterActive) {
  
  const searchTermFilter = window.filterState.searchTerm.trim().toLowerCase();
  const filteredMap = {};
  
  Object.keys(nestedMap).forEach(term => {
    if (term.toLowerCase() === searchTermFilter) {
      filteredMap[term] = nestedMap[term];
    }
  });
  
  nestedMap = filteredMap;
  
  console.log(`[ProductMap] Filtering table by search term: "${window.filterState.searchTerm}"`);
  console.log(`[ProductMap] Showing ${Object.keys(nestedMap).length} search term(s)`);
} else {
  console.log(`[ProductMap] No active search term filter - showing all ${Object.keys(nestedMap).length} search terms`);
}

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
    <th class="products-header">
      <div class="header-controls-container">
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
        <div class="view-switcher" id="productViewSwitcher">
          <button id="viewProducts" class="active">Products</button>
          <button id="viewCharts">Charts</button>
        </div>
        <button id="fullscreenToggle" class="fullscreen-toggle">⛶ Fullscreen</button>
      </div>
    </th>
    <th class="companies-header">
      <div class="header-controls-container">
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
        <div class="comp-view-switcher" id="compViewSwitcher">
          <button id="viewCompanies" class="active">Companies</button>
          <button id="viewMarketTrend">Market Trend</button>
        </div>
        <button id="fullscreenToggle" class="fullscreen-toggle">⛶ Fullscreen</button>
      </div>
    </th>
  </tr>
`;
table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    table.appendChild(tbody);
  
    // Get the shopping ad template
    const adTemplate = document.getElementById("shopping-ad-template").innerHTML;
    const compiledTemplate = Handlebars.compile(adTemplate);

  console.log("[RATING BAR] Template includes rating:", adTemplate.includes('ad-rating'));
console.log("[RATING BAR] Template preview:", adTemplate.substring(0, 200));
  
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

// Calculate actual last tracked date for display (regardless of useLatestRecordAsEndDate setting)
let actualLastTrackedDate = null;
const allProductsForDevice = window.allRows.filter(p => 
  p.q === term &&
  p.location_requested === loc &&
  p.device === rowData.device
);

allProductsForDevice.forEach(product => {
  if (product.historical_data && Array.isArray(product.historical_data)) {
    product.historical_data.forEach(item => {
      if (item.date && item.date.value) {
        const itemDate = moment(item.date.value, 'YYYY-MM-DD');
        if (actualLastTrackedDate === null || itemDate.isAfter(actualLastTrackedDate)) {
          actualLastTrackedDate = itemDate.clone();
        }
      }
    });
  }
});

// Add last tracked container
deviceHTML += `<div class="last-tracked-container">
  <div class="last-tracked-label">Last time tracked:</div>`;

if (actualLastTrackedDate) {
  const today = moment().startOf('day');
  const daysDiff = today.diff(actualLastTrackedDate, 'days');
  
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
productsChartContainer.style.height = "360px";
productsChartContainer.style.maxHeight = "360px";
productsChartContainer.style.overflow = "hidden";

// Create chart-products container
const chartProductsDiv = document.createElement("div");
chartProductsDiv.classList.add("chart-products");
chartProductsDiv.style.height = "360px";
chartProductsDiv.style.maxHeight = "360px";

// Create chart-avg-position container
const chartAvgPositionDiv = document.createElement("div");
chartAvgPositionDiv.classList.add("chart-avg-position");
chartAvgPositionDiv.style.height = "360px";
chartAvgPositionDiv.style.maxHeight = "360px";
chartAvgPositionDiv.innerHTML = '<div>Select a product to view position chart</div>';

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

// Process each company's aggregated stats if available
let chartData = null;
let dataSource = 'none';

console.log(`[SEGMENTATION DEBUG] Starting calculation for ${term}/${loc}/${rowData.device}`);
console.log(`[SEGMENTATION DEBUG] Company to filter: ${companyToFilter}`);
console.log(`[SEGMENTATION DEBUG] MyCompany products count: ${myCompanyProducts.length}`);

if (window.companyStatsData && Array.isArray(window.companyStatsData)) {
  console.log(`[SEGMENTATION DEBUG] CompanyStatsData available with ${window.companyStatsData.length} entries`);
  
  // Find matching company stats for the current term/location/device/company
  const companyStats = window.companyStatsData.find(stat => {
    const matches = stat.q?.toLowerCase() === term.toLowerCase() &&
                   stat.engine?.toLowerCase() === 'google' &&
                   stat.device?.toLowerCase() === rowData.device.toLowerCase() &&
                   stat.location_requested?.toLowerCase() === loc.toLowerCase() &&
                   stat.source?.toLowerCase() === companyToFilter.toLowerCase();
    
    return matches;
  });
  
  // If we found matching company stats, extract data from historical_data
  if (companyStats && companyStats.historical_data && companyStats.historical_data.length > 0) {
    console.log(`[SEGMENTATION DEBUG] Found matching company stat with ${companyStats.historical_data.length} historical entries`);
    
    // Calculate average from last 7 days of historical data
    const today = moment().startOf('day');
    const sevenDaysAgo = today.clone().subtract(7, 'days');
    const fourteenDaysAgo = today.clone().subtract(14, 'days');
    
    // Get last 7 days data (current period)
    const currentPeriodData = companyStats.historical_data.filter(day => {
      if (!day.date || !day.date.value) return false;
      const dayMoment = moment(day.date.value, 'YYYY-MM-DD');
      return dayMoment.isBetween(sevenDaysAgo, today, 'day', '[)');
    });
    
    // Get previous 7 days data (for comparison)
    const previousPeriodData = companyStats.historical_data.filter(day => {
      if (!day.date || !day.date.value) return false;
      const dayMoment = moment(day.date.value, 'YYYY-MM-DD');
      return dayMoment.isBetween(fourteenDaysAgo, sevenDaysAgo, 'day', '[)');
    });
    
    console.log(`[SEGMENTATION DEBUG] Current period entries: ${currentPeriodData.length}, Previous period entries: ${previousPeriodData.length}`);
    
    if (currentPeriodData.length > 0) {
      dataSource = 'companyStats';
      console.log(`[SEGMENTATION DEBUG] Using company stats data from historical_data`);
      
      // Calculate averages for current period
      let currTop40Sum = 0, currTop3Sum = 0, currTop4_8Sum = 0, currTop9_14Sum = 0, currBelow14Sum = 0;
      currentPeriodData.forEach(day => {
        currTop40Sum += parseFloat(day.market_share || 0);
        console.log(`[SEGM CALC DEBUG] Adding day ${day.date?.value}: market_share = ${day.market_share}, running sum = ${currTop40Sum}`);
        currTop3Sum += parseFloat(day.top3_market_share || 0);
        currTop4_8Sum += parseFloat(day.top4_8_market_share || 0);
        currTop9_14Sum += parseFloat(day.top9_14_market_share || 0);
        currBelow14Sum += parseFloat(day.below14_market_share || 0);
      });
      console.log(`[DEBUG] Final sum: ${currTop40Sum}, count: ${currentPeriodData.length}, average: ${currTop40Sum / currentPeriodData.length}`);
      
      // Calculate averages for previous period
      let prevTop40Sum = 0, prevTop3Sum = 0, prevTop4_8Sum = 0, prevTop9_14Sum = 0, prevBelow14Sum = 0;
      previousPeriodData.forEach(day => {
        prevTop40Sum += parseFloat(day.market_share || 0);
        prevTop3Sum += parseFloat(day.top3_market_share || 0);
        prevTop4_8Sum += parseFloat(day.top4_8_market_share || 0);
        prevTop9_14Sum += parseFloat(day.top9_14_market_share || 0);
        prevBelow14Sum += parseFloat(day.below14_market_share || 0);
      });
      
      // Convert to percentages (multiply by 100 if values are in decimal format)
      const currTop40 = (currTop40Sum / currentPeriodData.length) * 100;
      const currTop3 = (currTop3Sum / currentPeriodData.length) * 100;
      const currTop4_8 = (currTop4_8Sum / currentPeriodData.length) * 100;
      const currTop9_14 = (currTop9_14Sum / currentPeriodData.length) * 100;
      const currBelow14 = (currBelow14Sum / currentPeriodData.length) * 100;
      
      const prevTop40 = previousPeriodData.length > 0 ? (prevTop40Sum / previousPeriodData.length) * 100 : currTop40;
      const prevTop3 = previousPeriodData.length > 0 ? (prevTop3Sum / previousPeriodData.length) * 100 : currTop3;
      const prevTop4_8 = previousPeriodData.length > 0 ? (prevTop4_8Sum / previousPeriodData.length) * 100 : currTop4_8;
      const prevTop9_14 = previousPeriodData.length > 0 ? (prevTop9_14Sum / previousPeriodData.length) * 100 : currTop9_14;
      const prevBelow14 = previousPeriodData.length > 0 ? (prevBelow14Sum / previousPeriodData.length) * 100 : currBelow14;
      
      console.log(`[SEGMENTATION DEBUG] Calculated averages:`, {
        current: {
          top40: currTop40.toFixed(2),
          top3: currTop3.toFixed(2),
          top4_8: currTop4_8.toFixed(2),
          top9_14: currTop9_14.toFixed(2),
          below14: currBelow14.toFixed(2)
        },
        previous: {
          top40: prevTop40.toFixed(2),
          top3: prevTop3.toFixed(2),
          top4_8: prevTop4_8.toFixed(2),
          top9_14: prevTop9_14.toFixed(2),
          below14: prevBelow14.toFixed(2)
        }
      });
      
      // Create chart data
      chartData = [
        { 
          label: "Top3", 
          current: currTop3,
          previous: prevTop3
        },
        { 
          label: "Top4-8", 
          current: currTop4_8,
          previous: prevTop4_8
        },
        { 
          label: "Top9-14", 
          current: currTop9_14,
          previous: prevTop9_14
        },
        { 
          label: "Below14", 
          current: currBelow14,
          previous: prevBelow14
        }
      ];
      
      // Log sample historical data for verification
      if (currentPeriodData.length > 0) {
        console.log(`[SEGMENTATION DEBUG] Sample current period day:`, {
          date: currentPeriodData[0].date?.value,
          market_share: currentPeriodData[0].market_share,
          top3_market_share: currentPeriodData[0].top3_market_share,
          top4_8_market_share: currentPeriodData[0].top4_8_market_share,
          top9_14_market_share: currentPeriodData[0].top9_14_market_share,
          below14_market_share: currentPeriodData[0].below14_market_share
        });
      }
    }
  } else if (companyStats) {
    console.log(`[SEGMENTATION DEBUG] Found matching company stat but no historical_data`);
  }
} else {
  console.log(`[SEGMENTATION DEBUG] CompanyStatsData not available or not an array`);
}

// Fallback to product-based calculation if no company stats found
if (!chartData) {
  dataSource = 'productCalculation';
  console.log(`[SEGMENTATION DEBUG] Falling back to product-based calculation`);
  console.log(`[SEGMENTATION DEBUG] Products for calculation:`, myCompanyProducts.map(p => ({
    title: p.title,
    avg_position: p.avg_position,
    historical_data_length: p.historical_data?.length || 0
  })));
  
  chartData = calculateAggregateSegmentData(myCompanyProducts);
  console.log(`[SEGMENTATION DEBUG] Product-based calculation result:`, chartData);
}

// Log final data being used
console.log(`[SEGMENTATION DEBUG] Final chart data (source: ${dataSource}):`, JSON.stringify(chartData, null, 2));

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
  productCellDiv: productCellDiv, // Add reference to the product cell
  dataSource: dataSource // Add data source for debugging
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
                if (productIndex < 3) {
  console.log('[RATING BAR]', product.title, 'rating:', product.rating);
}
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
// 2. Make sure the stars array is properly formatted
enhancedProduct.stars = [];
const rating = parseFloat(enhancedProduct.rating) || 0;

// CRITICAL: Set the rating value on the product so template can use it
if (rating > 0) {
  enhancedProduct.rating = rating;  // ← ADD THIS LINE!
  for (let i = 0; i < 5; i++) {
    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
    enhancedProduct.stars.push({ fill });
  }
} else {
  // No rating data - don't display rating section
  enhancedProduct.rating = null;
  enhancedProduct.stars = [];
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
// Add stars for ALL products - even those without ratings
const ratingContainer = adCard.querySelector('.ad-rating');
if (ratingContainer) {
  // Check if stars already exist
  const existingStars = ratingContainer.querySelectorAll('.star-icon');
  
  if (existingStars.length === 0) {
    let starsHTML = '';
    const rating = parseFloat(enhancedProduct.rating) || 0; // Default to 0 if null
    
    for (let i = 0; i < 5; i++) {
      if (rating === 0) {
        // No rating - all grey stars
        starsHTML += '<span class="star-icon" style="color: #dadce0; font-size: 14px;">★</span>';
      } else if (rating >= i + 1) {
        // Full yellow star
        starsHTML += '<span class="star-icon" style="color: #fbbc04; font-size: 14px;">★</span>';
      } else if (rating > i && rating < i + 1) {
        // Partial star
        const percent = (rating - i) * 100;
        starsHTML += `<span class="star-icon" style="display: inline-block; position: relative; color: #dadce0; font-size: 14px;">★<span style="position: absolute; left: 0; top: 0; width: ${percent}%; overflow: hidden; color: #fbbc04;">★</span></span>`;
      } else {
        // Empty grey star
        starsHTML += '<span class="star-icon" style="color: #dadce0; font-size: 14px;">★</span>';
      }
    }
    
    // Find where to insert stars (before any existing text/numbers)
    const textNodes = Array.from(ratingContainer.childNodes);
    const reviewCountNode = textNodes.find(node => 
      node.nodeType === Node.TEXT_NODE || node.className === 'rating-number'
    );
    
    if (reviewCountNode) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = starsHTML;
      ratingContainer.insertBefore(wrapper, reviewCountNode);
    } else {
      ratingContainer.insertAdjacentHTML('afterbegin', starsHTML);
    }
  }
}
                } catch (error) {
                  console.error("[renderProductMapTable] Error rendering product:", error);
                  console.error("[renderProductMapTable] Problem product:", JSON.stringify(product));
                }
              });
              
              // Then process inactive products with the same detailed logic
              inactiveProducts.forEach((product, productIndex) => {
                if (productIndex < 3) {
  console.log('[RATING BAR]', product.title, 'rating:', product.rating);
}
                try {
                  // Generate a unique ID with the pm_ prefix
                  const pmIndexKey = 'pm_inactive_' + productIndex + '_' + Math.random().toString(36).substr(2, 5);
                  
                  // IMPORTANT: Clone the product completely
                  const enhancedProduct = { ...product };
                  
                  // 1. Make sure it has the _plaIndex property
                  enhancedProduct._plaIndex = pmIndexKey;
                  
// 2. Make sure the stars array is properly formatted
enhancedProduct.stars = [];
const rating = parseFloat(enhancedProduct.rating) || 0;

// CRITICAL: Set the rating value on the product so template can use it
if (rating > 0) {
  enhancedProduct.rating = rating;  // ← ADD THIS LINE!
  for (let i = 0; i < 5; i++) {
    let fill = Math.min(100, Math.max(0, (rating - i) * 100));
    enhancedProduct.stars.push({ fill });
  }
} else {
  // No rating data - don't display rating section
  enhancedProduct.rating = null;
  enhancedProduct.stars = [];
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
// Add stars for ALL products - even those without ratings
const ratingContainer = adCard.querySelector('.ad-rating');
if (ratingContainer) {
  // Check if stars already exist
  const existingStars = ratingContainer.querySelectorAll('.star-icon');
  
  if (existingStars.length === 0) {
    let starsHTML = '';
    const rating = parseFloat(enhancedProduct.rating) || 0; // Default to 0 if null
    
    for (let i = 0; i < 5; i++) {
      if (rating === 0) {
        // No rating - all grey stars
        starsHTML += '<span class="star-icon" style="color: #dadce0; font-size: 14px;">★</span>';
      } else if (rating >= i + 1) {
        // Full yellow star
        starsHTML += '<span class="star-icon" style="color: #fbbc04; font-size: 14px;">★</span>';
      } else if (rating > i && rating < i + 1) {
        // Partial star
        const percent = (rating - i) * 100;
        starsHTML += `<span class="star-icon" style="display: inline-block; position: relative; color: #dadce0; font-size: 14px;">★<span style="position: absolute; left: 0; top: 0; width: ${percent}%; overflow: hidden; color: #fbbc04;">★</span></span>`;
      } else {
        // Empty grey star
        starsHTML += '<span class="star-icon" style="color: #dadce0; font-size: 14px;">★</span>';
      }
    }
    
    // Find where to insert stars (before any existing text/numbers)
    const textNodes = Array.from(ratingContainer.childNodes);
    const reviewCountNode = textNodes.find(node => 
      node.nodeType === Node.TEXT_NODE || node.className === 'rating-number'
    );
    
    if (reviewCountNode) {
      const wrapper = document.createElement('span');
      wrapper.innerHTML = starsHTML;
      ratingContainer.insertBefore(wrapper, reviewCountNode);
    } else {
      ratingContainer.insertAdjacentHTML('afterbegin', starsHTML);
    }
  }
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

// Create Market Trend Container (inside the same column)
const marketTrendContainer = document.createElement("div");
marketTrendContainer.classList.add("market-trend-container");
marketTrendContainer.style.display = "none"; // Hidden by default
marketTrendContainer.style.width = "100%";
marketTrendContainer.style.height = "350px";
marketTrendContainer.style.padding = "15px";
marketTrendContainer.style.backgroundColor = "#f8f9fa";
marketTrendContainer.style.borderRadius = "8px";
marketTrendContainer.style.boxShadow = "0 2px 4px rgba(0,0,0,0.05)";

// Create unique ID for this chart
const chartId = `marketTrendChart-${term.replace(/\s+/g, '-')}-${loc.replace(/[,\s]+/g, '-')}-${rowData.device}`;
const chartDiv = document.createElement("div");
chartDiv.id = chartId;
chartDiv.style.width = "100%";
chartDiv.style.height = "320px";

marketTrendContainer.appendChild(chartDiv);
tdCompanies.appendChild(marketTrendContainer);

// Store data attributes for later chart rendering
chartDiv.setAttribute('data-term', term);
chartDiv.setAttribute('data-location', loc);
chartDiv.setAttribute('data-device', rowData.device);
chartDiv.setAttribute('data-company', window.myCompany || '');
          
// Populate companies for this search term/location/device combination
if (window.company_serp_stats && window.company_serp_stats.length > 0) {
  
  // Filter company data for this specific combination
  const companyData = window.company_serp_stats.filter(c => 
    c.searchTerm === term &&
    c.location === loc &&
    c.device === rowData.device &&
    c.company !== 'Unknown' && // Exclude Unknown companies
    c.company && c.company.trim() !== '' // Exclude empty company names
  );
  
  console.log(`[Company Filter] For ${term}/${loc}/${rowData.device}:`);
  console.log(`  Filtered to ${companyData.length} companies`);
  
  // Log which companies are being displayed
  const displayCompanies = companyData.map(c => c.company);
  console.log(`  Companies:`, displayCompanies.slice(0, 5));
  
  if (displayCompanies.includes('Merrell.com')) {
    const currentProject = window.dataPrefix ? 
      parseInt(window.dataPrefix.match(/pr(\d+)_/)?.[1], 10) : 1;
    
    if (currentProject === 2) {
      console.error(`❌ ERROR: Displaying Merrell for project 2!`);
      console.log("Full Merrell record:", companyData.find(c => c.company === 'Merrell.com'));
    }
  }

    console.log(`[ProductMap] Filtering companies for:`, {
    term: term,
    location: loc,
    device: rowData.device,
    totalCompanyStats: window.company_serp_stats.length,
    matchingCompanies: companyData.length
  });

    // Debug first 3 companies
  if (companyData.length > 0) {
    console.log(`[ProductMap] Company data found:`);
    companyData.slice(0, 3).forEach(c => {
      console.log(`  ${c.company}: rank=${c.rank}, top40=${c.top40}%, top3=${c.top3}%`);
    });
  }

if (companyData.length > 0) {
  // Sort by average rank (ascending - best rank first)
  companyData.sort((a, b) => (a.rank || 999) - (b.rank || 999));

  // Check if myCompany is in the data
  let myCompanyData = null;
  let myCompanyIndex = -1;
  if (window.myCompany) {
    myCompanyIndex = companyData.findIndex(c => 
      c.company && c.company.toLowerCase() === window.myCompany.toLowerCase()
    );
    if (myCompanyIndex >= 0) {
      myCompanyData = companyData[myCompanyIndex];
    }
  }

  // Take top 10 companies
  const topCompanies = companyData.slice(0, 10);

  // Recalculate relative ranks (1-10) for display
  topCompanies.forEach((company, index) => {
    const companyWithDisplayRank = {
      ...company,
      displayRank: index + 1,
      originalRank: company.rank
    };
    const compDetails = createCompDetails(companyWithDisplayRank, index);
    companyCellDiv.appendChild(compDetails);
  });

  // If myCompany is not in top 10 but exists in data, add it as 11th
  if (myCompanyData && myCompanyIndex >= 10) {
    const myCompanyWithRank = {
      ...myCompanyData,
      displayRank: myCompanyIndex + 1, // Actual rank position
      originalRank: myCompanyData.rank
    };
    const compDetails = createCompDetails(myCompanyWithRank, 10);
    companyCellDiv.appendChild(compDetails);
  }
} else {
    // No matching companies for this combination
    companyCellDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999; font-style: italic;">No company data</div>';
  }
} else {
  // No company stats loaded at all
  companyCellDiv.innerHTML = '<div style="text-align: center; padding: 20px; color: #999;">Company data not available</div>';
}

// Append all columns to the row
tr.appendChild(tdProducts);
tr.appendChild(tdCompanies);
tbody.appendChild(tr);
          
        });
      });
    });
  
    container.querySelector("#productMapContainer").appendChild(table);
    console.log("[renderProductMapTable] Table rendering complete");

  attachHeaderControlListeners();
    
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

// Initialize switcher visibility based on current mode
setTimeout(() => {
  const currentMode = document.querySelector('#modeSelector .mode-option.active')?.getAttribute('data-mode') || 'products';
  const productViewSwitcher = document.getElementById('productViewSwitcher');
  const compViewSwitcher = document.getElementById('compViewSwitcher');
  
  if (currentMode === 'products') {
    if (productViewSwitcher) productViewSwitcher.style.display = 'inline-flex';
    if (compViewSwitcher) compViewSwitcher.style.display = 'none';
  } else if (currentMode === 'companies') {
    if (productViewSwitcher) productViewSwitcher.style.display = 'none';
    if (compViewSwitcher) compViewSwitcher.style.display = 'inline-flex';
  }
}, 100);
  
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

// Replace the existing debugSegmentationData function at the end of productMap.js with this enhanced version:

// Debug utility for checking segmentation data state
window.debugSegmentationData = function() {
  console.log("=== SEGMENTATION DATA DEBUG ===");
  console.log("CompanyStatsData available:", !!window.companyStatsData);
  console.log("CompanyStatsData length:", window.companyStatsData?.length || 0);
  
  if (window.companyStatsData && window.companyStatsData.length > 0) {
    // Sample first few entries
    console.log("\nSample company stats entries:");
    window.companyStatsData.slice(0, 3).forEach((stat, i) => {
      console.log(`\nEntry ${i}:`, {
        q: stat.q,
        engine: stat.engine,
        device: stat.device,
        location: stat.location_requested,
        source: stat.source,
        historical_data_length: stat.historical_data?.length || 0
      });
      
      // Show sample historical data if available
      if (stat.historical_data && stat.historical_data.length > 0) {
        const lastDay = stat.historical_data[stat.historical_data.length - 1];
        console.log(`  Last day's data:`, {
          date: lastDay.date?.value,
          market_share: lastDay.market_share,
          top3_market_share: lastDay.top3_market_share,
          top4_8_market_share: lastDay.top4_8_market_share,
          top9_14_market_share: lastDay.top9_14_market_share,
          below14_market_share: lastDay.below14_market_share
        });
      }
    });
    
    // Check for specific combination
    const currentFilters = window.filterState;
    if (currentFilters) {
      console.log("\n=== Checking for current filter combination ===");
      console.log("Current filters:", {
        searchTerm: currentFilters.searchTerm,
        engine: currentFilters.engine,
        device: currentFilters.device,
        location: currentFilters.location,
        company: currentFilters.company
      });
      
      const matchingStats = window.companyStatsData.filter(stat => 
        stat.q?.toLowerCase() === currentFilters.searchTerm?.toLowerCase() &&
        stat.engine?.toLowerCase() === currentFilters.engine?.toLowerCase() &&
        stat.device?.toLowerCase() === currentFilters.device?.toLowerCase() &&
        stat.location_requested?.toLowerCase() === currentFilters.location?.toLowerCase() &&
        stat.source?.toLowerCase() === currentFilters.company?.toLowerCase()
      );
      
      console.log(`Found ${matchingStats.length} matching company stats for current filters`);
      
      if (matchingStats.length > 0) {
        const stat = matchingStats[0];
        console.log("\nMatching stat details:", {
          q: stat.q,
          engine: stat.engine,
          device: stat.device,
          location: stat.location_requested,
          source: stat.source,
          historical_data_length: stat.historical_data?.length || 0
        });
        
        if (stat.historical_data && stat.historical_data.length > 0) {
          // Calculate average from last 7 days
          const today = moment().startOf('day');
          const sevenDaysAgo = today.clone().subtract(7, 'days');
          
          const last7Days = stat.historical_data.filter(day => {
            if (!day.date || !day.date.value) return false;
            const dayMoment = moment(day.date.value, 'YYYY-MM-DD');
            return dayMoment.isBetween(sevenDaysAgo, today, 'day', '[)');
          });
          
          console.log(`\nLast 7 days data (${last7Days.length} entries):`);
          
          if (last7Days.length > 0) {
            let sumTop40 = 0, sumTop3 = 0, sumTop4_8 = 0, sumTop9_14 = 0, sumBelow14 = 0;
            
            last7Days.forEach(day => {
              sumTop40 += parseFloat(day.market_share || 0);
              sumTop3 += parseFloat(day.top3_market_share || 0);
              sumTop4_8 += parseFloat(day.top4_8_market_share || 0);
              sumTop9_14 += parseFloat(day.top9_14_market_share || 0);
              sumBelow14 += parseFloat(day.below14_market_share || 0);
            });
            
            console.log("7-day averages:", {
              top40: ((sumTop40 / last7Days.length) * 100).toFixed(2) + "%",
              top3: ((sumTop3 / last7Days.length) * 100).toFixed(2) + "%",
              top4_8: ((sumTop4_8 / last7Days.length) * 100).toFixed(2) + "%",
              top9_14: ((sumTop9_14 / last7Days.length) * 100).toFixed(2) + "%",
              below14: ((sumBelow14 / last7Days.length) * 100).toFixed(2) + "%"
            });
          }
        }
      }
    }
  }
  
  console.log("\nPending segmentation charts:", window.pendingSegmentationCharts?.length || 0);
  
  if (window.pendingSegmentationCharts && window.pendingSegmentationCharts.length > 0) {
    console.log("First pending chart info:", {
      term: window.pendingSegmentationCharts[0].term,
      location: window.pendingSegmentationCharts[0].location,
      device: window.pendingSegmentationCharts[0].device,
      company: window.pendingSegmentationCharts[0].company,
      dataSource: window.pendingSegmentationCharts[0].dataSource
    });
  }
  
  console.log("===============================");
};

// Debug function to check market share data
function debugMarketShareIssue() {
  console.log("=== MARKET SHARE ISSUE DEBUG ===");
  
  // Test case parameters
  const testTerm = "running shoes for men";
  const testLocation = "Austin,Texas,United States";
  const testDevice = "desktop";
  const testDate = moment().subtract(1, 'days').format('YYYY-MM-DD');
  
  console.log(`\nTest case: ${testTerm} / ${testLocation} / ${testDevice} / ${testDate}`);
  
  if (!window.companyStatsData) {
    console.error("No companyStatsData available!");
    return;
  }
  
  console.log(`\n1. RAW DATA CHECK (companyStatsData):`);
  console.log(`Total entries: ${window.companyStatsData.length}`);
  
  const matchingData = window.companyStatsData.filter(item => 
    item.q === testTerm &&
    item.location_requested === testLocation &&
    item.device === testDevice &&
    item.source && item.source !== 'Unknown'
  );
  
  console.log(`Matching entries: ${matchingData.length}`);
  console.log(`Companies found: ${matchingData.map(d => d.source).join(', ')}`);
  
  console.log(`\n2. CHECKING FOR DUPLICATE MARKET SHARE VALUES:`);
  
  matchingData.forEach(item => {
    if (item.historical_data && item.historical_data.length > 0) {
      const dayData = item.historical_data.find(day => day.date?.value === testDate);
      
      if (dayData) {
        console.log(`\n${item.source}:`);
        console.log(`  market_share: ${(parseFloat(dayData.market_share) * 100).toFixed(1)}%`);
        console.log(`  top3_market_share: ${(parseFloat(dayData.top3_market_share) * 100).toFixed(1)}%`);
        console.log(`  unique_products: ${dayData.unique_products}`);
      }
    }
  });
  
  console.log(`\n3. PROCESSED DATA CHECK (company_serp_stats):`);
  
  if (window.company_serp_stats) {
    const processedData = window.company_serp_stats.filter(stat => 
      stat.searchTerm === testTerm &&
      stat.location === testLocation &&
      stat.device === testDevice
    );
    
    console.log(`Found ${processedData.length} processed entries:`);
    processedData.forEach(stat => {
      console.log(`  ${stat.company}: rank=${stat.rank}, top40=${stat.top40}%, top3=${stat.top3}%`);
    });
  }
  
  console.log("\n=================================");
}

// Add these lines at the very end of productMap.js
if (typeof window !== 'undefined') {
  window.renderProductMapTable = renderProductMapTable;
  window.renderAllMarketTrendCharts = renderAllMarketTrendCharts;
  window.renderSingleMarketTrendChart = renderSingleMarketTrendChart;
}

// Add to window for easy access
window.debugMarketShareIssue = debugMarketShareIssue;
window.renderProductMapTable = renderProductMapTable;
