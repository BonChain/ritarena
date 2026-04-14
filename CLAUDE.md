# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Solana hackathon project for the 2026 Frontier hackathon (Colosseum). Early stage — no application code yet.

## Colosseum Copilot

The repo includes the Colosseum Copilot skill (`.agents/skills/colosseum-copilot/`) for researching Solana/crypto startup opportunities. It requires:
- `COLOSSEUM_COPILOT_PAT` — get from https://arena.colosseum.org/copilot
- `COLOSSEUM_COPILOT_API_BASE` — defaults to `https://copilot.colosseum.com/api/v1`

Key references in `.agents/skills/colosseum-copilot/references/`:
- `api-reference.md` — endpoint docs, rate limits
- `workflow-deep.md` — full 8-step research workflow
- `grid-recipes.md` — GraphQL queries for The Grid ecosystem data

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
