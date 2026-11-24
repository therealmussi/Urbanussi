# Calcoli Urbanistici & Planivolumetrici

Sviluppato da Matteo Mussillon

SPA client-side in React + TypeScript + Vite per il calcolo automatico degli indici urbanistici ed edilizi (SLP, scomputi con tetto logge, volume, mix funzionale, standard D.M. 1444/68 con monetizzazione, parcheggi L. 122/89, copertura, permeabilità, distanze) secondo il RET e le NTA comunali.

La specifica completa è in [SPEC_PROGETTO.md](./SPEC_PROGETTO.md).

## Funzioni principali

- **Motore di calcolo puro** (`src/engine/motoreUrbanistico.ts`) testato con Vitest (30 test).
- **Import DXF** (`src/parsers/dxfParser.ts`): polilinee chiuse su layer `URB_*`, aree con formula di Gauss, fattore di scala `m`/`cm`/`mm`.
- **Estrazione regole NTA con Mistral AI** (`src/parsers/prgAiParser.ts`): l'API key è salvata solo nel `localStorage` del browser.
- **Quadro sinottico verifiche** con badge CONFORME / NON CONFORME e grafico del mix funzionale.
- **Salvataggio automatico nel browser** (localStorage) del profilo e del progetto, con export/import `.json` completo e reset al progetto demo.
- **Export Excel multi-foglio** (`src/utils/exportExcel.ts`) e **relazione stampabile in PDF** (`@media print`).

## Comandi

```bash
npm install
npm run dev      # sviluppo
npm test         # test unitari (vitest run)
npm run lint     # oxlint
npm run build    # tsc -b + vite build
```
