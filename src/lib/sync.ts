// Real-time sync utility for LifeCal
class LifeCalSync {
  private syncInterval: number;
  private isOnline: boolean;

  constructor() {
    this.syncInterval = 5000; // 5 seconds
    this.isOnline = navigator.onLine;
    this.setupEventListeners();
    this.startSync();
  }

  setupEventListeners() {
    // Online/offline detection
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncAll();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Listen for local storage changes
    ['todos-updated', 'meals-updated', 'parking-updated', 'people-updated'].forEach(event => {
      window.addEventListener(event, (e) => {
        if (this.isOnline) {
          this.syncDataType(event.replace('-updated', ''));
        }
      });
    });
  }

  async syncDataType(type) {
    if (!this.isOnline) return;

    try {
      // Get local data
      const localKey = type === 'people' ? 'people' : type;
      const localData = JSON.parse(localStorage.getItem(localKey) || '[]');
      
      // Handle parking special case (single value)
      if (type === 'parking') {
        const parkingData = localStorage.getItem('parking') || '';
        await this.uploadData(type, parkingData);
        return;
      }

      // Upload to server
      await this.uploadData(type, localData);
      
      // Get latest from server (in case others updated)
      const serverData = await this.downloadData(type);
      
      // Update local storage if server has newer data
      if (serverData && JSON.stringify(localData) !== JSON.stringify(serverData)) {
        localStorage.setItem(localKey, JSON.stringify(serverData));
        window.dispatchEvent(new CustomEvent(`${type}-synced`, { detail: serverData }));
      }
    } catch (error) {
      console.error(`Sync error for ${type}:`, error);
    }
  }

  async uploadData(type, data) {
    const response = await fetch('/api/sync?action=sync&type=' + type, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async downloadData(type) {
    const response = await fetch('/api/sync?type=' + type);
    
    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async syncAll() {
    const types = ['todos', 'meals', 'parking', 'people'];
    
    for (const type of types) {
      await this.syncDataType(type);
    }
  }

  startSync() {
    // Initial sync
    if (this.isOnline) {
      setTimeout(() => this.syncAll(), 1000);
    }

    // Periodic sync
    setInterval(() => {
      if (this.isOnline) {
        this.syncAll();
      }
    }, this.syncInterval);
  }

  // Manual sync trigger
  async forcSync() {
    if (this.isOnline) {
      await this.syncAll();
      return true;
    }
    return false;
  }
}

// Initialize sync when module loads
let syncInstance = null;

export function initSync() {
  if (!syncInstance) {
    syncInstance = new LifeCalSync();
  }
  return syncInstance;
}

export function getSync() {
  return syncInstance;
}

// Auto-initialize if in browser
if (typeof window !== 'undefined') {
  initSync();
}