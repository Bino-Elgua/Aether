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

## Phase 2: Advanced Features & Ecosystem (Completed)
- [x] **Multi-target Compiler** - Support for Elixir (swarms), Go/Rust (performance), and Move (on-chain) [core/compiler/].
- [x] **Advanced Witness System** - Integrated staking and slashing simulation into reputation logic.
- [x] **Mature Swarm Coordination** - Hierarchical, Democratic, Competitive, and Pipeline strategies.
- [x] **3-tier Memory sharing** - Cross-agent sharing logic in Memory engine.

## Phase 3: Real Economy & Marketplace (Completed)
- [x] **AIO Job Loop** - Integrated EscrowEngine with Dopamine/Synapse metabolism system (Aether release -> Dopamine endowment).
- [x] **OpenClaw Coordination** - Standardized agent-to-agent coordination and public job postings.
- [x] **End-to-end Job Cycle** - Verified via `examples/stdlib-integration.aether` and full think workflows.

## Phase 4: On-Chain Production Readiness (In Progress)
- [x] **Sui Move Contracts** - Implemented basic escrow contract (`contracts/sui/escrow.move`) and Identity Registry (`contracts/sui/registry.move`).
- [ ] **On-Chain Identity** - Link `BIPỌ̀N39` identity to Sui on-chain addresses via registry.
- [ ] **Hardened Verification** - Implement cryptographic Merkle-receipt proof-generation within the runtime for chain submission.
- [ ] **Flagship Job Vertical** - Finalize `examples/research-report-job.aether` integration with live on-chain mock.
- [ ] **Think Engine Hardening** - Optimize NL workflow for complex, multi-step job cycles.
- [ ] **CLI Tool** - Create a dedicated `aether` CLI for easy execution and agent management.
- [ ] **Formal Verification** - Audit for security.

**Last Updated:** April 22, 2026
**Current Focus:** Sui Integration and On-Chain Verification
