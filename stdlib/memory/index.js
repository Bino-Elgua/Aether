/**
 * Aether Memory Engine — 3-Tier Persistent Memory
 *
 * Ported from Swibe's memory-engine.js.
 *   - Three-tier memory: working → short-term → long-term
 *   - Auto-extraction of key facts from text
 *   - Context compression when working memory exceeds threshold
 *   - Cross-agent memory sharing
 *   - Persistent vault storage
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ────────────────────────────────────────────────────────────
// Memory Tiers
// ────────────────────────────────────────────────────────────

const MemoryTier = Object.freeze({
  WORKING:    'working',
  SHORT_TERM: 'short_term',
  LONG_TERM:  'long_term',
});

// ────────────────────────────────────────────────────────────
// Memory Entry
// ────────────────────────────────────────────────────────────

class MemoryEntry {
  constructor(key, data, tier = MemoryTier.WORKING, metadata = {}) {
    this.key = key;
    this.data = data;
    this.tier = tier;
    this.created_at = Date.now();
    this.accessed_at = Date.now();
    this.access_count = 0;
    this.importance = metadata.importance || 0.5;
    this.source = metadata.source || 'manual';
    this.tags = metadata.tags || [];
    this.hash = crypto.createHash('sha256')
      .update(typeof data === 'string' ? data : JSON.stringify(data))
      .digest('hex')
      .slice(0, 16);
  }

  touch() {
    this.accessed_at = Date.now();
    this.access_count++;
  }
}

// ────────────────────────────────────────────────────────────
// Memory Engine
// ────────────────────────────────────────────────────────────

class MemoryEngine {
  /**
   * @param {object} config
   * @param {number} [config.compress_after] — Compress working memory after N entries
   * @param {number} [config.short_term_max] — Max short-term entries before pruning
   * @param {boolean} [config.auto_extract] — Auto-extract key facts
   * @param {string} [config.vault_path] — Override vault storage path
   */
  constructor(config = {}) {
    this.config = {
      compress_after: config.compress_after || 50,
      short_term_max: config.short_term_max || 200,
      auto_extract: config.auto_extract !== false,
      vault_path: config.vault_path || path.join(os.homedir(), '.aether', 'memory'),
    };

    this.working = new Map();
    this.shortTerm = new Map();
    this.longTerm = new Map();

    this._ensureDir(this.config.vault_path);
    this._loadPersisted();
  }

  // ──────────────── Core Operations ────────────────

  store(key, data, tier = MemoryTier.WORKING, metadata = {}) {
    const entry = new MemoryEntry(key, data, tier, metadata);
    const store = this._storeForTier(tier);
    store.set(key, entry);

    if (tier === MemoryTier.WORKING && this.working.size > this.config.compress_after) {
      this.compress();
    }

    if (tier !== MemoryTier.WORKING) {
      this._persist(tier);
    }

    return entry;
  }

  recall(key) {
    for (const tier of [MemoryTier.WORKING, MemoryTier.SHORT_TERM, MemoryTier.LONG_TERM]) {
      const store = this._storeForTier(tier);
      if (store.has(key)) {
        const entry = store.get(key);
        entry.touch();
        return entry;
      }
    }
    return null;
  }

  search(query, maxResults = 10) {
    const results = [];
    const q = query.toLowerCase();

    for (const tier of [MemoryTier.WORKING, MemoryTier.SHORT_TERM, MemoryTier.LONG_TERM]) {
      const store = this._storeForTier(tier);
      for (const [key, entry] of store) {
        const dataStr = typeof entry.data === 'string' ? entry.data : JSON.stringify(entry.data);
        if (key.toLowerCase().includes(q) || dataStr.toLowerCase().includes(q)) {
          results.push(entry);
        }
        if (results.length >= maxResults) return results;
      }
    }

    return results.sort((a, b) => b.importance - a.importance);
  }

  forget(key) {
    for (const tier of [MemoryTier.WORKING, MemoryTier.SHORT_TERM, MemoryTier.LONG_TERM]) {
      const store = this._storeForTier(tier);
      if (store.has(key)) {
        store.delete(key);
        if (tier !== MemoryTier.WORKING) this._persist(tier);
        return true;
      }
    }
    return false;
  }

  // ──────────────── Auto-Extraction ────────────────

  extractFacts(text, source = 'think') {
    if (!this.config.auto_extract) return [];

    const facts = [];

    // Extract definitions: "X is Y"
    const defPattern = /(?:^|\n)\s*([A-Z][^.!?\n]{5,50})\s+(?:is|are|means|refers to)\s+([^.!?\n]{10,100})/g;
    let match;
    while ((match = defPattern.exec(text)) !== null) {
      const key = `fact:${match[1].trim().toLowerCase().replace(/\s+/g, '_')}`;
      facts.push(this.store(key, {
        subject: match[1].trim(),
        definition: match[2].trim(),
      }, MemoryTier.SHORT_TERM, {
        importance: 0.6,
        source,
        tags: ['auto-extracted', 'definition'],
      }));
    }

    // Extract action items: "should", "must", "need to", "TODO"
    const actionPattern = /(?:should|must|need to|TODO|FIXME)\s+([^.!?\n]{10,100})/gi;
    while ((match = actionPattern.exec(text)) !== null) {
      const key = `action:${crypto.createHash('md5').update(match[1]).digest('hex').slice(0, 8)}`;
      facts.push(this.store(key, {
        action: match[1].trim(),
      }, MemoryTier.SHORT_TERM, {
        importance: 0.8,
        source,
        tags: ['auto-extracted', 'action-item'],
      }));
    }

    // Extract named entities: capitalized multi-word sequences
    const entityPattern = /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
    const entities = new Set();
    while ((match = entityPattern.exec(text)) !== null) {
      entities.add(match[1]);
    }
    if (entities.size > 0) {
      this.store(`entities:${source}:${Date.now()}`, {
        entities: Array.from(entities),
      }, MemoryTier.WORKING, {
        importance: 0.4,
        source,
        tags: ['auto-extracted', 'entities'],
      });
    }

    return facts;
  }

  // ──────────────── Compression ────────────────

  compress() {
    const entries = Array.from(this.working.values());
    if (entries.length === 0) return;

    for (const entry of entries) {
      if (entry.access_count > 2 || entry.importance > 0.7) {
        entry.tier = MemoryTier.SHORT_TERM;
        this.shortTerm.set(entry.key, entry);
      }
    }

    const summary = {
      compressed_at: Date.now(),
      entry_count: entries.length,
      promoted: entries.filter(e => e.access_count > 2 || e.importance > 0.7).length,
      keys: entries.map(e => e.key),
    };

    this.store(
      `compressed:${Date.now()}`,
      summary,
      MemoryTier.SHORT_TERM,
      { importance: 0.3, source: 'compression', tags: ['system', 'compressed'] }
    );

    this.working.clear();
    this._persist(MemoryTier.SHORT_TERM);

    console.log(`[MEMORY] Compressed ${entries.length} working entries → ${summary.promoted} promoted`);

    if (this.shortTerm.size > this.config.short_term_max) {
      this._pruneShortTerm();
    }
  }

  _pruneShortTerm() {
    const entries = Array.from(this.shortTerm.values())
      .sort((a, b) => {
        const scoreA = a.importance * (1 / (Date.now() - a.accessed_at + 1)) * (a.access_count + 1);
        const scoreB = b.importance * (1 / (Date.now() - b.accessed_at + 1)) * (b.access_count + 1);
        return scoreB - scoreA;
      });

    const keep = entries.slice(0, this.config.short_term_max);
    this.shortTerm.clear();
    for (const entry of keep) {
      this.shortTerm.set(entry.key, entry);
    }
    this._persist(MemoryTier.SHORT_TERM);
  }

  // ──────────────── Cross-Agent Sharing ────────────────

  exportForSharing(tags = []) {
    const shared = [];
    for (const store of [this.shortTerm, this.longTerm]) {
      for (const [, entry] of store) {
        if (tags.length === 0 || tags.some(t => entry.tags.includes(t))) {
          shared.push({
            key: entry.key,
            data: entry.data,
            importance: entry.importance,
            tags: entry.tags,
          });
        }
      }
    }
    return shared;
  }

  importShared(memories, sourceName = 'swarm') {
    for (const mem of memories) {
      this.store(
        `shared:${sourceName}:${mem.key}`,
        mem.data,
        MemoryTier.SHORT_TERM,
        {
          importance: mem.importance * 0.8,
          source: `shared:${sourceName}`,
          tags: [...(mem.tags || []), 'imported', `from:${sourceName}`],
        }
      );
    }
  }

  // ──────────────── Persistence ────────────────

  _storeForTier(tier) {
    switch (tier) {
      case MemoryTier.WORKING: return this.working;
      case MemoryTier.SHORT_TERM: return this.shortTerm;
      case MemoryTier.LONG_TERM: return this.longTerm;
      default: return this.working;
    }
  }

  _ensureDir(dir) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  _persist(tier) {
    const store = this._storeForTier(tier);
    const data = {};
    for (const [key, entry] of store) {
      data[key] = {
        key: entry.key,
        data: entry.data,
        tier: entry.tier,
        created_at: entry.created_at,
        accessed_at: entry.accessed_at,
        access_count: entry.access_count,
        importance: entry.importance,
        source: entry.source,
        tags: entry.tags,
        hash: entry.hash,
      };
    }
    const filePath = path.join(this.config.vault_path, `${tier}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  _loadPersisted() {
    for (const tier of [MemoryTier.SHORT_TERM, MemoryTier.LONG_TERM]) {
      const filePath = path.join(this.config.vault_path, `${tier}.json`);
      if (!fs.existsSync(filePath)) continue;

      try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const store = this._storeForTier(tier);
        for (const [key, val] of Object.entries(raw)) {
          const entry = new MemoryEntry(val.key, val.data, val.tier, {
            importance: val.importance,
            source: val.source,
            tags: val.tags,
          });
          entry.created_at = val.created_at;
          entry.accessed_at = val.accessed_at;
          entry.access_count = val.access_count;
          store.set(key, entry);
        }
      } catch (e) {
        console.warn(`[MEMORY] Failed to load ${tier}: ${e.message}`);
      }
    }
  }

  // ──────────────── Stats ────────────────

  stats() {
    return {
      working: this.working.size,
      short_term: this.shortTerm.size,
      long_term: this.longTerm.size,
      compress_threshold: this.config.compress_after,
      auto_extract: this.config.auto_extract,
    };
  }
}

module.exports = { MemoryEngine, MemoryEntry, MemoryTier };
