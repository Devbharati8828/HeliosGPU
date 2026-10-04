import sqlite3InitModule from '@sqlite.org/sqlite-wasm';

let db = null;

/**
 * Initializes the OPFS-backed SQLite database.
 */
export async function initCache() {
  if (db) return db;

  try {
    const sqlite3 = await sqlite3InitModule({
      print: console.log, // eslint-disable-line no-console -- required by sqlite3 wasm API
      printErr: console.error,
    });

    if (sqlite3.opfs) {
      // OPFS is supported, use it for persistent storage
      db = new sqlite3.oo1.OpfsDb('/helioscope_cache.sqlite3');
    } else {
      db = new sqlite3.oo1.DB('/helioscope_cache.sqlite3', 'ct');
    }

    // Create tiles table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tiles (
        id TEXT PRIMARY KEY,
        data BLOB NOT NULL,
        timestamp INTEGER NOT NULL
      )
    `);

    return db;
  } catch (err) {
    console.error('Failed to initialize SQLite WASM:', err);
    throw err;
  }
}

/**
 * Stores a tile blob in the cache.
 */
export async function cacheTile(x, y, z, blob) {
  if (!db) await initCache();
  
  const id = `${z}_${x}_${y}`;
  const arrayBuffer = await blob.arrayBuffer();
  const uint8Array = new Uint8Array(arrayBuffer);
  const timestamp = Date.now();

  try {
    db.exec({
      sql: 'INSERT OR REPLACE INTO tiles (id, data, timestamp) VALUES (?, ?, ?)',
      bind: [id, uint8Array, timestamp],
    });
  } catch (err) {
    console.error('Error caching tile:', err);
  }
}

/**
 * Retrieves a tile blob from the cache.
 */
export async function getCachedTile(x, y, z) {
  if (!db) await initCache();

  const id = `${z}_${x}_${y}`;
  let result = null;

  try {
    db.exec({
      sql: 'SELECT data FROM tiles WHERE id = ?',
      bind: [id],
      callback: (row) => {
        // row[0] is a Uint8Array when returning BLOB
        result = new Blob([row[0]], { type: 'image/png' });
      }
    });
  } catch (err) {
    console.error('Error reading cached tile:', err);
  }

  return result;
}
