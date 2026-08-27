// IndexedDB and Local Storage persistence for Vehicle Images and GIFs

const DB_NAME = 'HonDashStorage';
const DB_VERSION = 1;
const STORE_NAME = 'vehicleMedia';
const KEY_VEHICLE_IMG = 'customCarImage';
const LOCAL_STORAGE_BACKUP_KEY = 'hondash_custom_car_img';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      return reject(new Error('IndexedDB not supported'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveVehicleImage(imageDataUrl: string): Promise<boolean> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(imageDataUrl, KEY_VEHICLE_IMG);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    // Also try saving a lightweight copy or fallback if small enough
    try {
      if (imageDataUrl.length < 2 * 1024 * 1024) {
        localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, imageDataUrl);
      }
    } catch {
      // ignore localStorage quota error since IndexedDB has the full copy
    }
    return true;
  } catch (err) {
    console.warn('[HonDash Storage] IndexedDB error, falling back to localStorage:', err);
    try {
      localStorage.setItem(LOCAL_STORAGE_BACKUP_KEY, imageDataUrl);
      return true;
    } catch (e) {
      console.error('[HonDash Storage] Failed to save vehicle image in localStorage:', e);
      return false;
    }
  }
}

export async function getVehicleImage(): Promise<string | null> {
  try {
    const db = await openDB();
    const result = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_VEHICLE_IMG);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    if (result) return result;
  } catch (err) {
    console.warn('[HonDash Storage] IndexedDB read error:', err);
  }

  // Fallback to localStorage
  try {
    return localStorage.getItem(LOCAL_STORAGE_BACKUP_KEY);
  } catch {
    return null;
  }
}

export async function deleteVehicleImage(): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(KEY_VEHICLE_IMG);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(LOCAL_STORAGE_BACKUP_KEY);
  } catch {
    // ignore
  }
}

// Download image or GIF to device
export function downloadVehicleMedia(dataUrl: string, fileName = 'hondash_civic_vehicle.png'): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
