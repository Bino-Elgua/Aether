# Aether

**The Sovereign Agent Language**

Aether is a clean, enterprise-ready language designed specifically for **sovereign digital citizens** — autonomous agents with permanent identity, economic power, and verifiable reputation.

## Core Vision
Agents are not tools; they are citizens. Aether provides the minimal primitive set required for autonomous operation within a real-world economy.

## The 5 Primitives

| Primitive   | Purpose |
|-------------|---------|
| `birth`     | Initializes agent identity, tier, and budget. |
| `think`     | The intelligent gateway. Handles natural language and structured reasoning. |
| `ethics`    | Defines the unbreakable moral and behavioral constraints of the agent. |
| `permission`| Controls resource access, spending limits, and external interactions. |
| `receipt`   | Generates cryptographic proof of actions and task completion. |

## Intelligent Gateway (`think`)
The `think` primitive serves as the entry point for both structured Aether code and natural language. The runtime automatically parses natural language prompts and translates them into executable Aether instructions, ensuring a seamless bridge between human intent and machine execution.

## Quick Start

### 1. Installation
```bash
git clone https://github.com/Bino-Elgua/Aether.git
cd Aether
npm install
```

### 2. Run an Example
```bash
node core/runtime/interpreter.js examples/research-agent.aether
```

### 3. Syntax Example
```aether
birth {
    name: "atlas-7"
    tier: "moderate"
    budget: 86000000
}

ethics { harm_none: true, accuracy: "max" }

think "Research Solana ecosystem trends"

receipt { type: "job_complete", proof: true }
```

## Architecture
- **Lexer**: Robust tokenizer for Aether's block-based syntax.
- **Parser**: Generates a strictly validated AST.
- **Gateway**: Translates natural language to Aether instructions.
- **Interpreter**: Sandboxed execution engine managing agent state.

## License
MIT
