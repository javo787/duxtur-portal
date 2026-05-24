import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'map-cache';
const STORE_NAME = 'previews';
const DB_VERSION = 1;

export interface CachedMap {
  blob: Blob;
  timestamp: number;
  url: string; // Object URL for the blob
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

export async function getCachedMap(key: string, ttlDays: number): Promise<string | null> {
  const db = await getDB();
  if (!db) return null;

  try {
    const cached = await db.get(STORE_NAME, key);
    if (cached && Date.now() - cached.timestamp < ttlDays * 24 * 60 * 60 * 1000) {
      return URL.createObjectURL(cached.blob);
    }
    // Clean up expired
    if (cached) {
      await db.delete(STORE_NAME, key);
    }
  } catch (error) {
    console.error('[IDB CACHE] Get error:', error);
  }
  return null;
}

export async function cacheMap(key: string, url: string): Promise<boolean> {
  const db = await getDB();
  if (!db) return false;

  try {
    // Check quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const { quota, usage } = await navigator.storage.estimate();
      if (quota && usage && (quota - usage) < 50 * 1024 * 1024) {
        console.warn('[IDB CACHE] Low storage quota, skipping cache');
        return false;
      }
    }

    const response = await fetch(url);
    if (!response.ok) return false;
    const blob = await response.blob();

    await db.put(STORE_NAME, { blob, timestamp: Date.now() }, key);
    return true;
  } catch (error) {
    console.error('[IDB CACHE] Put error:', error);
    return false;
  }
}
