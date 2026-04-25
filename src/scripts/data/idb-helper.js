import { openDB } from 'idb';

const DB_NAME = 'map-story-db';
const DB_VERSION = 1;

const STORE_BOOKMARKS = 'bookmarks';
const STORE_CACHED_STORIES = 'cached-stories';
const STORE_OFFLINE_DRAFTS = 'offline-drafts';

async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_BOOKMARKS)) {
        db.createObjectStore(STORE_BOOKMARKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_CACHED_STORIES)) {
        db.createObjectStore(STORE_CACHED_STORIES, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_OFFLINE_DRAFTS)) {
        db.createObjectStore(STORE_OFFLINE_DRAFTS, { keyPath: 'draftId', autoIncrement: true });
      }
    },
  });
}

async function putBookmark(story) {
  const db = await getDb();
  return db.put(STORE_BOOKMARKS, {
    ...story,
    bookmarkedAt: new Date().toISOString(),
  });
}

async function getAllBookmarks() {
  const db = await getDb();
  return db.getAll(STORE_BOOKMARKS);
}

async function getBookmarkById(id) {
  const db = await getDb();
  return db.get(STORE_BOOKMARKS, id);
}

async function deleteBookmark(id) {
  const db = await getDb();
  return db.delete(STORE_BOOKMARKS, id);
}

async function putCachedStories(stories) {
  const db = await getDb();
  const tx = db.transaction(STORE_CACHED_STORIES, 'readwrite');
  await tx.store.clear();
  for (const story of stories) {
    await tx.store.put(story);
  }
  await tx.done;
}

async function getAllCachedStories() {
  const db = await getDb();
  return db.getAll(STORE_CACHED_STORIES);
}

async function putOfflineDraft(draftData) {
  const db = await getDb();
  return db.add(STORE_OFFLINE_DRAFTS, {
    ...draftData,
    createdAt: new Date().toISOString(),
  });
}

async function getAllOfflineDrafts() {
  const db = await getDb();
  return db.getAll(STORE_OFFLINE_DRAFTS);
}

async function deleteOfflineDraft(draftId) {
  const db = await getDb();
  return db.delete(STORE_OFFLINE_DRAFTS, draftId);
}

export {
  putBookmark,
  getAllBookmarks,
  getBookmarkById,
  deleteBookmark,
  putCachedStories,
  getAllCachedStories,
  putOfflineDraft,
  getAllOfflineDrafts,
  deleteOfflineDraft,
};
