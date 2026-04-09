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
