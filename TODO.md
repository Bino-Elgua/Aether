# Aether TODO.md

## Phase 0: Foundation (Completed)
- 5 core primitives (birth, think, ethics, permission, receipt)
- Natural language gateway in `think`
- Lexer, parser, and interpreter
- Basic runtime and agent state management
- Updated README.md

## Phase 1: Port Core Concepts from Swibe (Completed)
- [x] **Metabolism System** - Dopamine (86M birth, hourly drip by tier, daily decay, 10:1 conversion to Synapse)
- [x] **Witness System** - Random witness selection (3/4/5 based on job difficulty), peer validation, reputation impact
- [x] **Agent Identity** - BIPỌ̀N39 Identity System (16x16 wordlist, vanity-cloakseed mnemonics, Ed25519 keypairs, aether:// addresses)
- [x] **stdlib/ Structure** - Proper library system (metabolism, witness, swarm, memory, evolve, hire)
- [x] **Execution Hardening** - Hardened `interpreter.js` with cryptographic signing and Merkle-ready receipt structure.
- [x] **Dynamic Step Linking** - Support for passing results between steps (e.g., `$previous.result.content`).

## Phase 2: Advanced Features & Ecosystem (Current Phase)
- [x] **Multi-target Compiler** - Support for Elixir (swarms), Go/Rust (performance), and Move (on-chain) [core/compiler/].
- [x] **Advanced Witness System** - Integrated staking and slashing simulation into reputation logic.
- [x] **Mature Swarm Coordination** - Hierarchical, Democratic, Competitive, and Pipeline strategies.
- [x] **3-tier Memory sharing** - Cross-agent sharing logic in Memory engine.
- [ ] **AIO Bridge** - Finalize the smart contract bridge in `contracts/aio-bridge.js`
- [ ] **CLI Tool** - Create a dedicated `aether` CLI for easy execution and agent management.

## Phase 3: Production Readiness
- [ ] **Sandbox Environment** - Secure execution for multi-agent swarms.
- [ ] **Public Examples** - Deploy real-world examples with paying jobs.
- [ ] **Formal Verification** - Audit the core primitives for security and ethics adherence.

**Last Updated:** April 22, 2026
**Current Focus:** AIO Bridge and CLI Tooling
