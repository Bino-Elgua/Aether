/**
 * Gateway v2 — Bridges natural language to the Think Engine.
 *
 * The gateway is no longer a simple pattern-matcher. It delegates
 * to the ThinkEngine for full intent analysis, plan building,
 * validation, self-correction, and execution.
 *
 * For backwards compatibility, `translate()` still works for simple
 * cases, but `process()` is the primary entry point.
 */

'use strict';

const { ThinkEngine } = require('../think/engine');

class Gateway {
  constructor(interpreterRef) {
    this.interpreter = interpreterRef;
    this.engine = null; // Lazy-init to avoid circular ref at construction
    this.context = [];
  }

  _ensureEngine() {
    if (!this.engine) {
      this.engine = new ThinkEngine(this.interpreter);
    }
  }

  /**
   * Primary entry: full think engine processing.
   * Returns the complete execution result.
   */
  async process(prompt) {
    this._ensureEngine();
    return this.engine.process(prompt);
  }

  /**
   * Legacy translate — returns Aether code string.
   * Used when the interpreter detects `think "..."` and needs
   * to decide whether to recurse with generated code.
   *
   * Returns null if the think engine should handle it directly
   * (which is now the default for all non-trivial prompts).
   */
  async translate(prompt) {
    // Short, trivial prompts that are just status messages — pass through
    if (prompt.length < 10 && !/\b(hire|research|build|find|check|show|convert)\b/i.test(prompt)) {
      return `think "${prompt}"`;
    }

    // Everything else goes through the think engine
    return null;
  }

  getHistory() {
    return this.engine ? this.engine.getHistory() : [];
  }
}

module.exports = Gateway;
