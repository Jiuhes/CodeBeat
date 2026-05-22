import initSqlJs from 'sql.js'

const DB_NAME = 'codebeat'

// Load logged-in user from localStorage on file load
const cachedUser = typeof window !== 'undefined' ? localStorage.getItem('codebeat_current_user') : null
let currentUserId = cachedUser ? JSON.parse(cachedUser).id : null

let dbInstance = null

// Base URL and Asset Path Helpers
const baseUrl = import.meta.env.BASE_URL || '/'
const wasmUrl = baseUrl.endsWith('/') ? baseUrl + 'sql-wasm.wasm' : baseUrl + '/sql-wasm.wasm'
const seedDbUrl = baseUrl.endsWith('/') ? baseUrl + 'seed.db' : baseUrl + '/seed.db'

// OPFS helpers
function isOPFSSupported() {
  return typeof navigator !== 'undefined' && 
         navigator.storage && 
         typeof navigator.storage.getDirectory === 'function';
}

async function getOPFSDir() {
  const root = await navigator.storage.getDirectory()
  return root.getDirectoryHandle('codebeat', { create: true })
}

async function readFromOPFS(filename) {
  try {
    const dir = await getOPFSDir()
    const fileHandle = await dir.getFileHandle(filename)
    const file = await fileHandle.getFile()
    return new Uint8Array(await file.arrayBuffer())
  } catch {
    return null
  }
}

async function writeToOPFS(filename, data) {
  const dir = await getOPFSDir()
  const fileHandle = await dir.getFileHandle(filename, { create: true })
  const writable = await fileHandle.createWritable()
  await writable.write(data)
  await writable.close()
}

// IndexedDB Fallback helper functions
function getFallbackDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('codebeat_fallback_db', 1)
    request.onupgradeneeded = (e) => {
      const db = e.target.result
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files')
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function readFromIndexedDBFallback(filename) {
  try {
    const db = await getFallbackDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readonly')
      const store = tx.objectStore('files')
      const request = store.get(filename)
      request.onsuccess = () => {
        const val = request.result
        if (val) {
          resolve(new Uint8Array(val))
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.error('IndexedDB fallback read error:', e)
    return null
  }
}

async function writeToIndexedDBFallback(filename, data) {
  try {
    const db = await getFallbackDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite')
      const store = tx.objectStore('files')
      const request = store.put(data, filename)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  } catch (e) {
    console.error('IndexedDB fallback write error:', e)
  }
}

async function readDBFile(filename) {
  if (isOPFSSupported()) {
    try {
      const data = await readFromOPFS(filename)
      if (data) return data
    } catch (e) {
      console.warn('OPFS read failed, trying IndexedDB fallback', e)
    }
  }
  return await readFromIndexedDBFallback(filename)
}

async function writeDBFile(filename, data) {
  if (isOPFSSupported()) {
    try {
      await writeToOPFS(filename, data)
      return
    } catch (e) {
      console.warn('OPFS write failed, falling back to IndexedDB', e)
    }
  }
  await writeToIndexedDBFallback(filename, data)
}

let persistTimeout = null
let persistPromise = null
let persistResolve = null

function persistDB() {
  if (!dbInstance || !currentUserId) return Promise.resolve()

  if (persistPromise) {
    if (persistTimeout) {
      clearTimeout(persistTimeout)
    }
  } else {
    persistPromise = new Promise((resolve) => {
      persistResolve = resolve
    })
  }

  persistTimeout = setTimeout(async () => {
    const currentResolve = persistResolve
    persistPromise = null
    persistResolve = null
    persistTimeout = null

    try {
      if (dbInstance && currentUserId) {
        await writeDBFile(`sqlite_${currentUserId}.db`, dbInstance.export())
      }
    } catch (err) {
      console.error('Error persisting SQLite DB:', err)
    } finally {
      if (currentResolve) currentResolve()
    }
  }, 50)

  return persistPromise
}

function idbOpen(name) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, 1)
    req.onupgradeneeded = () => {}
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGetAll(store) {
  return new Promise((resolve, reject) => {
    const tx = store.transaction
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(store, key) {
  return new Promise((resolve, reject) => {
    const req = store.get(key)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function migrateFromIndexedDB(sqliteDb) {
  let oldDB
  try {
    oldDB = await idbOpen(DB_NAME)
    if (!oldDB.objectStoreNames.contains('cards')) {
      oldDB.close()
      return
    }

    const tx = oldDB.transaction(['cards', 'activity', 'settings'], 'readonly')
    const oldCards = await idbGetAll(tx.objectStore('cards'))
    const oldActivity = await idbGetAll(tx.objectStore('activity'))

    let oldSettings = null
    if (oldDB.objectStoreNames.contains('settings')) {
      const stx = oldDB.transaction('settings', 'readonly')
      const theme = await idbGet(stx.objectStore('settings'), 'theme')
      const dailyNewCards = await idbGet(stx.objectStore('settings'), 'dailyNewCards')
      const dailyReviewCards = await idbGet(stx.objectStore('settings'), 'dailyReviewCards')
      if (theme || dailyNewCards || dailyReviewCards) {
        oldSettings = {
          theme: theme || 'dark',
          dailyNewCards: dailyNewCards || 10,
          dailyReviewCards: dailyReviewCards || 20,
        }
      }
    }

    if (oldCards.length > 0) {
      sqliteDb.run('BEGIN TRANSACTION')
      try {
        const stmt = sqliteDb.prepare(`
          INSERT OR REPLACE INTO cards (
            keyword, language, easeFactor, interval, repetitions, dueDate, lastReview, status,
            definition, code_example, usage_context, common_mistakes, category
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `)
        for (const c of oldCards) {
          if (!c) continue
          stmt.run([c.keyword, c.language, c.easeFactor, c.interval, c.repetitions, c.dueDate, c.lastReview, c.status, c.definition, c.code_example, JSON.stringify(c.usage_context || []), JSON.stringify(c.common_mistakes || []), c.category])
        }
        stmt.free()

        if (oldActivity && oldActivity.length > 0) {
          const actStmt = sqliteDb.prepare('INSERT INTO activity (type, keyword, language, quality, timestamp) VALUES (?, ?, ?, ?, ?)')
          for (const a of oldActivity) {
            if (!a) continue
            actStmt.run([a.type, a.keyword, a.language, a.quality, a.timestamp || new Date().toISOString()])
          }
          actStmt.free()
        }

        if (oldSettings) {
          const setStmt = sqliteDb.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
          for (const [k, v] of Object.entries(oldSettings)) {
            setStmt.run([k, String(v)])
          }
          setStmt.free()
        }

        sqliteDb.run('COMMIT')
      } catch (err) {
        sqliteDb.run('ROLLBACK')
      }

      oldDB.close()
      await new Promise(resolve => {
        const req = indexedDB.deleteDatabase(DB_NAME)
        req.onsuccess = () => resolve()
        req.onerror = () => resolve()
      })
    } else {
      oldDB.close()
    }
  } catch {
    if (oldDB) oldDB.close()
  }
}

async function seedIntoDB(sqliteDb) {
  const existing = sqliteDb.exec('SELECT COUNT(*) as cnt FROM seed_keywords')
  const count = existing[0] ? existing[0].values[0][0] : 0
  if (count >= 169) return
  const SQL = await initSqlJs({ locateFile: () => wasmUrl })
  const resp = await fetch(seedDbUrl)
  const buf = await resp.arrayBuffer()
  const seedDb = new SQL.Database(new Uint8Array(buf))
  const rows = seedDb.exec('SELECT * FROM seed_keywords')
  seedDb.close()
  if (!rows[0]) return
  sqliteDb.run('DELETE FROM seed_keywords')
  const stmt = sqliteDb.prepare('INSERT INTO seed_keywords (keyword, language, category, definition, code_example, usage_context, common_mistakes) VALUES (?, ?, ?, ?, ?, ?, ?)')
  for (const row of rows[0].values) {
    stmt.run(row)
  }
  stmt.free()
}

let initPromise = null
function getSQLiteDB() {
  if (!currentUserId) {
    // If no user is logged in, return a temporary dummy in-memory database to prevent crashes
    return initPromise || (initPromise = (async () => {
      const SQL = await initSqlJs({ locateFile: () => wasmUrl })
      dbInstance = new SQL.Database()
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS cards (
          keyword TEXT,
          language TEXT,
          easeFactor REAL,
          interval INTEGER,
          repetitions INTEGER,
          dueDate TEXT,
          lastReview TEXT,
          status TEXT,
          definition TEXT,
          code_example TEXT,
          usage_context TEXT,
          common_mistakes TEXT,
          category TEXT,
          PRIMARY KEY (language, keyword)
        )
      `)
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS activity (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          type TEXT,
          keyword TEXT,
          language TEXT,
          quality INTEGER,
          timestamp TEXT
        )
      `)
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `)
      dbInstance.run(`
        CREATE TABLE IF NOT EXISTS seed_keywords (
          keyword TEXT,
          language TEXT,
          category TEXT,
          definition TEXT,
          code_example TEXT,
          usage_context TEXT,
          common_mistakes TEXT,
          PRIMARY KEY (language, keyword)
        )
      `)
      await seedIntoDB(dbInstance)
      return dbInstance
    })())
  }

  if (!initPromise || initPromise === null) {
    initPromise = (async () => {
      const SQL = await initSqlJs({
        locateFile: () => wasmUrl
      })

      const binaryData = await readDBFile(`sqlite_${currentUserId}.db`)

      if (binaryData) {
        dbInstance = new SQL.Database(binaryData)
        dbInstance.run(`CREATE TABLE IF NOT EXISTS seed_keywords (
          keyword TEXT, language TEXT, category TEXT, definition TEXT,
          code_example TEXT, usage_context TEXT, common_mistakes TEXT,
          PRIMARY KEY (language, keyword)
        )`)
        await seedIntoDB(dbInstance)
      } else {
        dbInstance = new SQL.Database()
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS cards (
            keyword TEXT,
            language TEXT,
            easeFactor REAL,
            interval INTEGER,
            repetitions INTEGER,
            dueDate TEXT,
            lastReview TEXT,
            status TEXT,
            definition TEXT,
            code_example TEXT,
            usage_context TEXT,
            common_mistakes TEXT,
            category TEXT,
            PRIMARY KEY (language, keyword)
          )
        `)
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT,
            keyword TEXT,
            language TEXT,
            quality INTEGER,
            timestamp TEXT
          )
        `)
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
          )
        `)
        dbInstance.run(`
          CREATE TABLE IF NOT EXISTS seed_keywords (
            keyword TEXT,
            language TEXT,
            category TEXT,
            definition TEXT,
            code_example TEXT,
            usage_context TEXT,
            common_mistakes TEXT,
            PRIMARY KEY (language, keyword)
          )
        `)
        await seedIntoDB(dbInstance)

        // Run migration from legacy IndexedDB if needed
        await migrateFromIndexedDB(dbInstance)
        
        await persistDB()
      }
      return dbInstance
    })()
  }
  return initPromise
}

async function queryRows(sql, params = []) {
  const d = await getSQLiteDB()
  const stmt = d.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

async function runCmd(sql, params = []) {
  const d = await getSQLiteDB()
  d.run(sql, params)
  await persistDB()
}

function mapCardFromRow(row) {
  if (!row) return null
  return {
    ...row,
    usage_context: row.usage_context ? JSON.parse(row.usage_context) : [],
    common_mistakes: row.common_mistakes ? JSON.parse(row.common_mistakes) : [],
  }
}

async function hashPassword(password) {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

const db = {
  async register(username, password, avatar = 'code') {
    if (!username || !password) {
      throw new Error('用户名和密码不能为空')
    }
    const usersJson = localStorage.getItem('codebeat_users') || '[]'
    const users = JSON.parse(usersJson)
    
    const exists = users.some(u => u.username.toLowerCase() === username.toLowerCase())
    if (exists) {
      throw new Error('用户名已存在')
    }
    
    const passwordHash = await hashPassword(password)
    const newUser = {
      id: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
      username,
      passwordHash,
      avatar,
      createdAt: new Date().toISOString()
    }
    
    users.push(newUser)
    localStorage.setItem('codebeat_users', JSON.stringify(users))
    return newUser
  },
  
  async login(username, password) {
    if (!username || !password) {
      throw new Error('用户名和密码不能为空')
    }
    const usersJson = localStorage.getItem('codebeat_users') || '[]'
    const users = JSON.parse(usersJson)
    
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    if (!user) {
      throw new Error('用户名或密码错误')
    }
    
    const passwordHash = await hashPassword(password)
    if (user.passwordHash !== passwordHash) {
      throw new Error('用户名或密码错误')
    }
    
    localStorage.setItem('codebeat_current_user', JSON.stringify(user))
    currentUserId = user.id
    
    initPromise = null
    dbInstance = null
    await getSQLiteDB()
    
    return user
  },
  
  async logout() {
    localStorage.removeItem('codebeat_current_user')
    currentUserId = null
    initPromise = null
    dbInstance = null
  },
  
  async initUserDB(userId) {
    currentUserId = userId
    initPromise = null
    dbInstance = null
    await getSQLiteDB()
  },
  
  async getCurrentUser() {
    const cached = localStorage.getItem('codebeat_current_user')
    return cached ? JSON.parse(cached) : null
  },

  async getCard(keyword, language) {
    const rows = await queryRows(
      'SELECT * FROM cards WHERE keyword = ? AND language = ?',
      [keyword, language]
    )
    return mapCardFromRow(rows[0])
  },
  async putCard(card) {
    await runCmd(`
      INSERT OR REPLACE INTO cards (
        keyword, language, easeFactor, interval, repetitions, dueDate, lastReview, status,
        definition, code_example, usage_context, common_mistakes, category
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      card.keyword,
      card.language,
      card.easeFactor,
      card.interval,
      card.repetitions,
      card.dueDate,
      card.lastReview,
      card.status,
      card.definition,
      card.code_example,
      JSON.stringify(card.usage_context || []),
      JSON.stringify(card.common_mistakes || []),
      card.category
    ])
  },
  async putCards(cards) {
    const d = await getSQLiteDB()
    d.run('BEGIN TRANSACTION')
    try {
      const stmt = d.prepare(`
        INSERT OR REPLACE INTO cards (
          keyword, language, easeFactor, interval, repetitions, dueDate, lastReview, status,
          definition, code_example, usage_context, common_mistakes, category
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      for (const c of cards) {
        stmt.run([
          c.keyword,
          c.language,
          c.easeFactor,
          c.interval,
          c.repetitions,
          c.dueDate,
          c.lastReview,
          c.status,
          c.definition,
          c.code_example,
          JSON.stringify(c.usage_context || []),
          JSON.stringify(c.common_mistakes || []),
          c.category
        ])
      }
      stmt.free()
      d.run('COMMIT')
    } catch (e) {
      d.run('ROLLBACK')
      throw e
    }
    await persistDB()
  },
  async getAllCards() {
    const rows = await queryRows('SELECT * FROM cards')
    return rows.map(mapCardFromRow).filter(Boolean)
  },
  async getSeedKeywords() {
    const rows = await queryRows('SELECT * FROM seed_keywords')
    return rows.map(r => ({
      keyword: r.keyword,
      language: r.language,
      category: r.category,
      definition: r.definition,
      code_example: r.code_example,
      usage_context: r.usage_context ? JSON.parse(r.usage_context) : [],
      common_mistakes: r.common_mistakes ? JSON.parse(r.common_mistakes) : [],
    }))
  },
  async deleteCard(keyword, language) {
    await runCmd('DELETE FROM cards WHERE keyword = ? AND language = ?', [keyword, language])
  },
  async addActivity(entry) {
    await runCmd(`
      INSERT INTO activity (type, keyword, language, quality, timestamp)
      VALUES (?, ?, ?, ?, ?)
    `, [
      entry.type,
      entry.keyword,
      entry.language,
      entry.quality,
      entry.timestamp || new Date().toISOString()
    ])
  },
  async getAllActivity() {
    return queryRows('SELECT * FROM activity')
  },
  async getSetting(key) {
    const rows = await queryRows('SELECT value FROM settings WHERE key = ?', [key])
    return rows[0] ? rows[0].value : undefined
  },
  async setSetting(key, value) {
    await runCmd('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [
      key,
      String(value)
    ])
  },
  async getSettings() {
    const rows = await queryRows('SELECT * FROM settings')
    const settingsMap = {}
    for (const r of rows) {
      settingsMap[r.key] = r.value
    }
    return {
      theme: settingsMap.theme || 'dark',
      dailyNewCards: settingsMap.dailyNewCards ? parseInt(settingsMap.dailyNewCards) : 10,
      dailyReviewCards: settingsMap.dailyReviewCards ? parseInt(settingsMap.dailyReviewCards) : 20,
      selectedLanguages: settingsMap.selectedLanguages ? JSON.parse(settingsMap.selectedLanguages) : [],
    }
  },
  async saveSettings(newSettings) {
    const d = await getSQLiteDB()
    d.run('BEGIN TRANSACTION')
    try {
      const stmt = d.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)')
      for (const [k, v] of Object.entries(newSettings)) {
        stmt.run([k, Array.isArray(v) ? JSON.stringify(v) : String(v)])
      }
      stmt.free()
      d.run('COMMIT')
    } catch (e) {
      d.run('ROLLBACK')
      throw e
    }
    await persistDB()
  },
  async exportData() {
    const cards = await this.getAllCards()
    const activity = await this.getAllActivity()
    const settings = await this.getSettings()
    return JSON.stringify({ cards, activity, settings }, null, 2)
  },
  async importData(json) {
    const data = JSON.parse(json)
    if (data.cards) await this.putCards(data.cards)
    if (data.activity) {
      const d = await getSQLiteDB()
      d.run('BEGIN TRANSACTION')
      try {
        const stmt = d.prepare(`
          INSERT INTO activity (type, keyword, language, quality, timestamp)
          VALUES (?, ?, ?, ?, ?)
        `)
        for (const a of data.activity) {
          stmt.run([
            a.type,
            a.keyword,
            a.language,
            a.quality,
            a.timestamp || new Date().toISOString()
          ])
        }
        stmt.free()
        d.run('COMMIT')
      } catch (e) {
        d.run('ROLLBACK')
        throw e
      }
    }
    if (data.settings) {
      await this.saveSettings(data.settings)
    }
    await persistDB()
  },
  async clearAll() {
    await runCmd('DELETE FROM cards')
    await runCmd('DELETE FROM activity')
    await runCmd('DELETE FROM settings')
  },
}

export default db
