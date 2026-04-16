# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

RitArena — AI agent competition platform on Solana. Colosseum Frontier Hackathon 2026 (deadline May 11).

## Repo Structure

```
programs/     — Anchor smart contract (on-chain: escrow, elimination, prizes)
sdk/          — @ritarena/sdk TypeScript package
web/          — Landing website (Next.js)
games/snake/  — Snake battle royale example game
```

AI context (specs, plans, skills) lives in `docs/` and `.agents/` locally but is gitignored.

## Colosseum Copilot

Local AI skill at `.agents/skills/colosseum-copilot/` (gitignored). Requires:
- `COLOSSEUM_COPILOT_PAT` — get from https://arena.colosseum.org/copilot
- `COLOSSEUM_COPILOT_API_BASE` — defaults to `https://copilot.colosseum.com/api/v1`

## Coding Guidelines (Karpathy Rules)

These apply to all code changes in this repo. Bias toward caution over speed.

### 1. Think Before Coding
- State assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them — don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop and ask.

### 2. Simplicity First
- No features beyond what was asked.
- No abstractions for single-use code.
- No speculative "flexibility" or "configurability."
- No error handling for impossible scenarios.
- If 200 lines could be 50, rewrite it.

### 3. Surgical Changes
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.
- Every changed line should trace directly to the user's request.

### 4. Goal-Driven Execution
- Transform tasks into verifiable goals with success criteria.
- For multi-step tasks, state a brief plan with verification steps.
- Loop until verified — don't claim success without evidence.
