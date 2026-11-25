# Calcoli Urbanistici & Planivolumetrici

SPA client-side in React + TypeScript + Vite per il calcolo automatico degli indici urbanistici ed edilizi (SLP, scomputi con tetto logge, volume, mix funzionale, standard D.M. 1444/68 con monetizzazione, parcheggi L. 122/89, copertura, permeabilità, distanze) secondo il RET e le NTA comunali.

La specifica completa è in [SPEC_PROGETTO.md](./SPEC_PROGETTO.md).

## Funzioni principali

- **Motore di calcolo puro** (`src/engine/motoreUrbanistico.ts`) testato con Vitest (33 test).
- **Import DXF** (`src/parsers/dxfParser.ts`): polilinee chiuse su layer `URB_*`, aree con formula di Gauss, fattore di scala `m`/`cm`/`mm`.
- **Estrazione regole NTA con Mistral AI** (`src/parsers/prgAiParser.ts`): l'API key è salvata solo nel `localStorage` del browser.
- **Quadro sinottico verifiche** con badge CONFORME / NON CONFORME e grafico del mix funzionale.
- **Gestione multi-progetto**: biblioteca dei progetti salvata nel browser, con selettore, creazione, duplicazione ed eliminazione; ogni progetto mantiene profilo PRG e dati geometrie; export/import `.json` completo e reset al progetto demo.
- **Salvataggio automatico** a ogni modifica con indicazione dell'ora dell'ultimo salvataggio.
- **Toast di notifica** al posto degli alert bloccanti per export, import ed eliminazioni.
- **Controlli di coerenza sugli input** (piani vuoti, Sc > Sf, Sf > St, aree permeabili o parcheggi assenti, altezza/distanze non inserite) visualizzati nel quadro sinottico.
- **Numeri in formato italiano** (separatore migliaia e virgola decimale) in tutta l'interfaccia e nella relazione stampabile.
- **Export Excel multi-foglio** (`src/utils/exportExcel.ts`) e **relazione stampabile in PDF** (`@media print`).

## Comandi

```bash
npm install
npm run dev      # sviluppo
npm test         # test unitari (vitest run)
npm run lint     # oxlint
npm run build    # tsc -b + vite build
```
