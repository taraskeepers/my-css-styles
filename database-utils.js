  // Database size calculation functions
  async function calculateDatabaseSizes() {
    try {
      const db = await window.embedIDB.open();
      if (!db) return null;

      const tx = db.transaction("projectData", "readonly");
      const store = tx.objectStore("projectData");
      const allRecords = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      let totalSize = 0;
      const tableSizes = {};

      allRecords.forEach(record => {
        const size = JSON.stringify(record).length;
        totalSize += size;
        tableSizes[record.tableName] = {
          size: size,
          rowCount: Array.isArray(record.data) ? record.data.length : 0
        };
      });

      return {
        totalSize,
        tableSizes,
        totalTables: Object.keys(tableSizes).length
      };
    } catch (error) {
      console.error("Error calculating database sizes:", error);
      return null;
    }
  }

  function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async function updateDatabaseUsageBars() {
    const container = document.getElementById("databaseUsageBars");
    if (!container) return;

    const sizes = await calculateDatabaseSizes();
    if (!sizes) {
      container.innerHTML = '<div style="color: #999; font-size: 12px;">Unable to calculate database size</div>';
      return;
    }

    const maxSize = Math.max(sizes.totalSize, ...Object.values(sizes.tableSizes).map(t => t.size));
    const estimatedQuota = 50 * 1024 * 1024; // Assume 50MB quota for visualization

    let html = '';

    // Overall database usage bar
    const totalPercent = Math.min((sizes.totalSize / estimatedQuota) * 100, 100);
    html += `
      <div class="db-usage-bar">
        <div class="db-bar-label">Total DB:</div>
        <div class="db-bar-container">
          <div class="db-bar-fill" style="width: ${totalPercent}%"></div>
        </div>
        <span style="font-size: 11px; color: #666;">${formatBytes(sizes.totalSize)}</span>
      </div>
    `;

    // Individual table bars
    const sortedTables = Object.entries(sizes.tableSizes)
      .sort(([,a], [,b]) => b.size - a.size)
      .slice(0, 6); // Show top 6 tables

    sortedTables.forEach(([tableName, info]) => {
      const tablePercent = (info.size / maxSize) * 100;
      const shortName = tableName.length > 12 ? tableName.substring(0, 12) + '...' : tableName;
      
      html += `
        <div class="db-usage-bar">
          <div class="db-table-label" title="${tableName}">${shortName}:</div>
          <div class="db-bar-container">
            <div class="db-bar-fill table-bar" style="width: ${tablePercent}%"></div>
          </div>
          <span style="font-size: 11px; color: #666;">${formatBytes(info.size)}</span>
        </div>
      `;
    });

    container.innerHTML = html;
  }
