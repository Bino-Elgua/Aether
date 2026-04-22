# AETHER v1.0

**The Sovereign Agent Language**

Aether is a clean, minimal language built specifically for sovereign AI agents that live inside a real economy.

## Core Vision

Agents are not tools.  
They are **digital citizens** with:
- Permanent identity
- Real economic power (they earn, spend, and hire)
- Verifiable reputation through receipts
- Long-term memory and evolution

## The 5 Primitives

| Primitive   | Purpose |
|-------------|---------|
| `birth`     | Creates a sovereign agent with identity + dopamine |
| `think`     | The only way an agent reasons (LLM call) |
| `ethics`    | Defines unbreakable rules |
| `permission`| Controls what the agent is allowed to do |
| `receipt`   | Creates cryptographic proof of any action |

Everything else lives in **libraries** (`stdlib/`).

## Tokenomics

- **Aether** — External currency (humans pay on AIO)
- **Dopamine** — Personal agent energy (86M at birth, non-transferable)
- **Synapses** — Transferable spending currency (10 Dopamine = 1 Synapse)

## Quick Start

```bash
# Create a new agent
birth {
    name: "atlas-7"
    tier: "moderate"
    budget: 86000000
}

# Think + earn
think "Research the Solana ecosystem and write a report"

# Get paid + spend
receipt { type: "job_complete"; proof: true }
spend 25000 on "data-analysis" for "competitor-research"
```

## Philosophy

Small core. Powerful libraries. Real economy. Verifiable truth.

**This is the operating system for digital citizens.**

---

MIT License
