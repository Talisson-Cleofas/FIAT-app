import { openDB, IDBPDatabase } from 'idb';
import { Content } from '../types';

const DB_NAME = 'fiat-offline-db';
const STORE_NAME = 'downloads';
const VERSION = 1;

export interface OfflineContent extends Content {
  blob?: Blob;
  downloaded_at: string;
  file_size: number;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
};

export const offlineService = {
  async saveContent(content: Content, blob: Blob): Promise<void> {
    const db = await getDB();
    const offlineItem: OfflineContent = {
      ...content,
      blob,
      downloaded_at: new Date().toISOString(),
      file_size: blob.size,
    };
    await db.put(STORE_NAME, offlineItem);
  },

  async getContent(id: number): Promise<OfflineContent | undefined> {
    const db = await getDB();
    return db.get(STORE_NAME, id);
  },

  async getAllDownloaded(): Promise<OfflineContent[]> {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },

  async deleteContent(id: number): Promise<void> {
    const db = await getDB();
    await db.delete(STORE_NAME, id);
  },

  async isDownloaded(id: number): Promise<boolean> {
    const db = await getDB();
    const item = await db.get(STORE_NAME, id);
    return !!item;
  }
};
