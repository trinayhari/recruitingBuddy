import { ReviewerBrief } from './types'
import { appendFile, readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// File-based store that works across Next.js boundaries
const STORE_DIR = join(process.cwd(), '.next', 'briefs')
const STORE_FILE = join(STORE_DIR, 'store.json')

// Ensure store directory exists
if (typeof window === 'undefined' && !existsSync(STORE_DIR)) {
  mkdir(STORE_DIR, { recursive: true }).catch(() => {})
}

// In-memory cache (backed by file system)
let briefsCache: Map<string, ReviewerBrief> | null = null

async function loadStore(): Promise<Map<string, ReviewerBrief>> {
  if (briefsCache) {
    return briefsCache
  }

  briefsCache = new Map<string, ReviewerBrief>()
  
  if (typeof window === 'undefined' && existsSync(STORE_FILE)) {
    try {
      const data = await readFile(STORE_FILE, 'utf-8')
      const stored = JSON.parse(data) as Record<string, any>
      
      for (const [id, brief] of Object.entries(stored)) {
        // Restore Date objects
        if (brief.metadata?.analyzedAt) {
          brief.metadata.analyzedAt = new Date(brief.metadata.analyzedAt)
        }
        if (brief.workStyle && (brief as any).commitAnalysis?.timeSpan) {
          const ts = (brief as any).commitAnalysis.timeSpan
          if (ts.start) ts.start = new Date(ts.start)
          if (ts.end) ts.end = new Date(ts.end)
        }
        briefsCache.set(id, brief as ReviewerBrief)
      }
    } catch (error) {
      console.error('Failed to load store:', error)
    }
  }

  return briefsCache
}

async function saveStore(): Promise<void> {
  if (typeof window !== 'undefined' || !briefsCache) return

  try {
    const data: Record<string, any> = {}
    for (const [id, brief] of briefsCache.entries()) {
      data[id] = brief
    }
    await writeFile(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8')
  } catch (error) {
    console.error('Failed to save store:', error)
  }
}

export const briefsStore = {
  async get(id: string): Promise<ReviewerBrief | undefined> {
    const store = await loadStore()
    return store.get(id)
  },
  
  async set(id: string, brief: ReviewerBrief): Promise<void> {
    const store = await loadStore()
    store.set(id, brief)
    await saveStore()
  },
  
  async has(id: string): Promise<boolean> {
    const store = await loadStore()
    return store.has(id)
  },
  
  async keys(): Promise<string[]> {
    const store = await loadStore()
    return Array.from(store.keys())
  },
  
  async size(): Promise<number> {
    const store = await loadStore()
    return store.size
  }
}

// #region agent log
if (typeof window === 'undefined') {
  loadStore().then(async store => {
    const logPath = join(process.cwd(), '.cursor', 'debug.log');
    const storeKeys = Array.from(store.keys());
    const logEntry = JSON.stringify({location:'store.ts:75',message:'Store module loaded (file-based)',data:{storeSize:store.size,storeKeys,storeFile:STORE_FILE},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})+'\n';
    appendFile(logPath, logEntry).catch(()=>{});
  });
}
// #endregion

