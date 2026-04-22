# Aether Think Engine — The Intelligent Core

The Think Engine is the brain of the Aether language. It transforms natural language into intelligent, multi-step execution plans that orchestrate all 7 stdlib modules.

## How It Works

When you write:
```
think "hire 3 agents to research crypto trends and verify each other's work"
```

The engine executes a **7-phase pipeline**:

```
┌──────────────────────────────────────────────────────────────────┐
│ Phase 1: ANALYZE — Intent classification + entity extraction     │
│ Phase 2: MEMORY  — Consult memory for relevant context           │
│ Phase 3: LLM     — Deep reasoning (Ollama → Claude → OpenRouter) │
│ Phase 4: PLAN    — Build multi-step execution plan               │
│ Phase 5: VALIDATE — Check preconditions, ethics, permissions     │
│ Phase 6: EXECUTE — Run each step through stdlib modules          │
│ Phase 7: RECORD  — Store results in memory + seal receipt        │
└──────────────────────────────────────────────────────────────────┘
```

## Intent Recognition

The engine classifies 13 intent types from natural language:

| Intent | Trigger Words | Modules Used |
|--------|--------------|--------------|
| `hire` | hire, recruit, assign, deploy agent, launch agents | identity, metabolism, hire, swarm |
| `coordinate` | coordinate, swarm, team, parallel, pipeline, collaborate | swarm, witness |
| `research` | research, find, search, look up, investigate, explore | memory, llm, witness |
| `build` | build, create, generate, implement, write, code, develop | llm, metabolism |
| `analyze` | analyze, examine, review, audit, evaluate, debug | memory, llm |
| `remember` | remember, store, save, record, note, keep track | memory |
| `forget` | forget, delete, remove, clear, erase | memory |
| `check_status` | status, balance, how much, show my, report | metabolism, evolve, memory |
| `evolve` | evolve, level up, upgrade, promote, tier | evolve, metabolism |
| `witness` | witness, verify, validate, confirm, attest | witness |
| `convert` | convert, swap, exchange, dopamine to synapse, burn | metabolism |
| `trade` | pay, escrow, transfer, send, fund | hire |
| `general` | (fallback for unrecognized intents) | llm |

**Multi-intent detection**: A single prompt can trigger multiple intents. For example, "hire 3 agents to research crypto and verify each other's work" triggers `hire` + `coordinate` + `research` + `witness` simultaneously.

## Entity Extraction

The engine extracts structured data from natural language:

| Entity | Example | Extracted |
|--------|---------|-----------|
| `count` | "hire **3** agents" | `3` |
| `amount` | "convert **500000** dopamine" | `500000` |
| `difficulty` | "**hard** verification" | `hard` |
| `tier` | "**aggressive** tier" | `aggressive` |
| `strategy` | "**pipeline** coordination" | `pipeline` |
| `topic` | "research about **Solana DeFi**" | `Solana DeFi` |
| `memory_tier` | "store **permanently**" | `long_term` |

## LLM Provider Chain

The engine attempts LLM providers in order:

1. **Ollama** (local, free) — `OLLAMA_URL` env var
2. **Claude** — `ANTHROPIC_API_KEY` env var
3. **OpenRouter** — `OPENROUTER_API_KEY` env var
4. **Built-in Reasoner** — always available, no API needed

If no LLM is configured, the built-in reasoner handles all tasks with informative responses and correct stdlib orchestration.

## Self-Correction

If the plan validation detects issues, the engine automatically corrects:

- **No agent born?** → Auto-injects a `birth` step before any stdlib calls
- **Permission denied?** → Removes blocked steps, continues with remaining plan
- **Unknown module?** → Skips invalid steps, logs warning

## Plan Execution

Each step calls into the real stdlib modules at runtime:

```
[THINK] ═══════════════════════════════════════
[THINK] Processing: "convert 500000 dopamine to synapse"
[THINK] Trace: 238d43daca73b664
[THINK] Intents: convert
[THINK] Entities: {"amount":500000}
[THINK] Plan: 3 steps
[THINK]   → Convert 500000 Dopamine → Synapse (10:1)
[THINK]   → Save results to memory
[THINK]   → Seal execution with receipt
[THINK]   ✓ Converted: 500000 D → 50000 S
[THINK]   ✓ Stored in short_term memory
[THINK]   ✓ Receipt: 7fe16193fc77...
[THINK] ═══ Complete (7ms, 3/3 steps) ═══
```

## Examples

### Simple: Convert tokens
```
think "convert 500000 dopamine to synapse"
```
→ Burns 500,000 Dopamine, mints 50,000 Synapse

### Multi-module: Hire + coordinate + verify
```
think "hire 3 agents to research crypto trends and verify each other's work using democratic coordination"
```
→ Generates 3 identities → endows tokens → creates escrow → sets up democratic swarm → dispatches research → selects witnesses → validates

### Autonomous: Status check
```
think "check my status — show balances, evolution tier, and memory stats"
```
→ Reads Dopamine/Synapse balances → checks evolution tier → reports memory stats

### Memory: Permanent storage
```
think "remember that Solana TVL crossed 8 billion — store permanently"
```
→ Stores in long-term memory vault

## Architecture

```
core/think/engine.js          — ThinkEngine, PlanBuilder, LLMProvider, intent/entity systems
core/runtime/gateway.js       — Gateway v2, delegates to ThinkEngine
core/runtime/interpreter.js   — Routes `think "..."` through the gateway

stdlib/metabolism/  ←─┐
stdlib/witness/    ←──┤
stdlib/identity/   ←──┤
stdlib/memory/     ←──┼── ThinkEngine executes plans using these modules
stdlib/hire/       ←──┤
stdlib/swarm/      ←──┤
stdlib/evolve/     ←──┘
```

## Configuration

Pass config through the Interpreter constructor:

```javascript
const interpreter = new Interpreter({
  think: {
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'llama3',
    anthropicKey: 'sk-...',
    openrouterKey: 'sk-or-...',
  }
});
```

Or use environment variables:
- `OLLAMA_URL` — Ollama server URL
- `ANTHROPIC_API_KEY` — Claude API key
- `OPENROUTER_API_KEY` — OpenRouter API key
