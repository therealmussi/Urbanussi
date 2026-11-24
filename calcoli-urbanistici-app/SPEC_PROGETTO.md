# SPECIFICA TECNICA: APPLICAZIONE CALCOLI URBANISTICI E PLANIVOLUMETRICI

## 1. Obiettivo e Architettura
Sviluppare una Single Page Application (SPA) client-side in **React + TypeScript + Vite** per il calcolo automatico di tutti gli indici urbanistici ed edilizi secondo il Regolamento Edilizio Tipo (RET) e le Norme Tecniche di Attuazione (NTA) comunali.

Struttura obbligatoria delle cartelle in `src/`:
- `src/types/urbanistica.ts`: Tutte le interfacce TypeScript.
- `src/data/prgDefault.ts`: Un profilo PRG completo precaricato ("Comune Demo - Zona B2") e un progetto di esempio già compilato per test immediato.
- `src/engine/motoreUrbanistico.ts`: Funzioni pure di calcolo matematico e verifiche di conformità (nessuna dipendenza React/UI).
- `src/engine/motoreUrbanistico.test.ts`: Test unitari con Vitest.
- `src/parsers/dxfParser.ts`: Lettura file CAD `.dxf`, calcolo aree polilinee chiuse (formula di Gauss) e mappatura automatica sui layer urbanistici.
- `src/parsers/prgAiParser.ts`: Chiamata `fetch` all'API di Mistral (`https://api.mistral.ai/v1/chat/completions`, modello `mistral-large-latest`, `response_format: { type: "json_object" }`) per convertire il testo copiato da un PRG/PGT/NTA nel formato JSON `ProfiloPRG`.
- `src/utils/exportExcel.ts`: Esportazione report multi-foglio `.xlsx` tramite libreria `xlsx`.
- `src/components/`: Componenti UI modulari e puliti.

---

## 2. Convenzioni Layer CAD (Input da file `.dxf`)
Il parser DXF deve leggere entità `LWPOLYLINE` e `POLYLINE` chiuse (`shape === true` oppure primo vertice coincidente con l'ultimo), calcolarne l'area con la formula di Gauss e applicare il fattore di scala selezionato dall'utente nell'interfaccia (`m` = 1, `cm` = 0.0001, `mm` = 0.000001).

Nomi layer standardizzati riconosciuti dal parser (case-insensitive):
- `URB_ST`: Superficie Territoriale ($S_t$)
- `URB_SF`: Superficie Fondiaria ($S_f$)
- `URB_SC`: Superficie Coperta ($S_c$)
- `URB_SLP_<DEST>_<PIANO>`: SLP Lorda per destinazione e piano.
  - `<DEST>` ammessi: `RES` (Residenziale), `COMM` (Commerciale), `DIR` (Direzionale/Terziario), `PROD` (Produttivo/Artigianale), `TUR` (Turistico-Ricettivo).
  - `<PIANO>` esempio: `S1`, `PT`, `P1`, `P2`, `SOTT`.
- `URB_SCOMP_<TIPO>_<PIANO>`: Superfici da scomputare dalla SLP per piano.
  - `<TIPO>` ammessi: `MURI` (murature perimetrali eccedenti), `LOGGE` (logge/porticati/balconi), `SCALE` (vani scala/ascensore), `INT` (locali interrati/accessori).
- `URB_SP_<COEFF>`: Superficie drenante con coefficiente di permeabilità in percentuale (es. `URB_SP_100` = prato coeff 1.0; `URB_SP_50` = grigliato coeff 0.5; `URB_SP_0` = impermeabile coeff 0.0).
- `URB_PARK_STALLI`: Superficie netta stalli parcheggi privati (L. 122/89).
- `URB_PARK_MANOVRA`: Superficie corsie di manovra parcheggi privati.
- `URB_STD_VERDE`: Aree a verde pubblico in cessione/asservimento.
- `URB_STD_SERVIZI`: Aree per attrezzature/servizi pubblici in cessione/asservimento.
- `URB_STD_PARK`: Aree per parcheggi pubblici in cessione/asservimento.

---

## 3. Modello Dati (`src/types/urbanistica.ts`)

### A. `ProfiloPRG` (Regole dello strumento urbanistico)
- `id`: string
- `comune`: string
- `zona`: string (es. "Zona B2 - Tessuto Consolidato")
- `descrizione`: string
- `parametriEdificatori`:
  - `indiceUtilizzazioneFondiaria_Uf`: number | null (mq SLP / mq Sf)
  - `indiceUtilizzazioneTerritoriale_Ut`: number | null (mq SLP / mq St)
  - `indiceFabbricabilitaFondiaria_If`: number | null (mc / mq Sf)
  - `indiceFabbricabilitaTerritoriale_It`: number | null (mc / mq St)
  - `altezzaVirtualeConversione_m`: number (default 3.00 m, per convertire SLP in Volume e viceversa)
  - `rapportoCoperturaMax_perc`: number (es. 40)
  - `indicePermeabilitaMin_perc`: number (es. 30)
  - `altezzaMax_m`: number (es. 16.50)
  - `distanzaMinConfini_m`: number (es. 5.00)
  - `distanzaMinFabbricati_m`: number (es. 10.00)
  - `distanzaMinStrade_m`: number (es. 5.00)
- `regoleScomputoSLP`:
  - `scomputaMuraturePerimetrali`: boolean (es. D.Lgs. 102/2014 per spessori > 30 cm)
  - `scomputaVaniScalaAscensore`: boolean
  - `scomputaInterrati`: boolean
  - `tettoMaxLoggePorticati_percSLP`: number (es. 15 -> max 15% della SLP lorda; l'eventuale eccedenza viene conteggiata nella SLP netta)
- `destinazioni`: Record<DestinazioneUso, RegolaDestinazione> dove `DestinazioneUso` = `'residenziale' | 'commerciale' | 'direzionale' | 'produttivo' | 'turistico'` e `RegolaDestinazione` contiene:
  - `ammessa`: boolean
  - `quotaMin_perc`: number (es. 0)
  - `quotaMax_perc`: number (es. 100)
  - `parametroAbitantiTeorici_mqSlpPerAb`: number (solo per residenziale, es. 35 mq SLP = 1 abitante)
  - `standardMin_mqPerAb`: number (solo per residenziale, es. 18 mq/ab D.M. 1444/68)
  - `standardMin_percSLP`: number (per destinazioni non residenziali, es. 80% o 100% della SLP)
  - `quotaParcheggiPubbliciSuStandard_perc`: number (es. 50% degli standard deve essere a parcheggio pubblico)
  - `quotaVerdeServiziSuStandard_perc`: number (es. 50% degli standard deve essere a verde/servizi)
  - `monetizzazioneAmmessa`: boolean
  - `tariffaMonetizzazione_euroMq`: number (es. 180 €/mq)
- `parcheggiPrivati`:
  - `rapportoLegge122_89_mqOgniMc`: number (default 0.10, ovvero 1 mq ogni 10 mc)
  - `dotazioneAggiuntivaCommerciale_percSLP`: number (es. 0)
  - `maxSuperficieManovra_percTotale`: number (es. 40 -> max 40% del totale parcheggi può essere corsia di manovra)

### B. `DatiProgetto` (Input geometrici dell'intervento)
- `nomeProgetto`: string
- `tipoIntervento`: `'nuova_costruzione' | 'ristrutturazione_demolizione_ricostruzione' | 'ampliamento'`
- `superficieTerritoriale_St`: number
- `superficieFondiaria_Sf`: number
- `superficieCoperta_Sc`: number
- `superficiPermeabili`: Array<{ `descrizione`: string; `area_mq`: number; `coefficiente_0_1`: number }>
- `piani`: Array<{
    `id`: string;
    `nomePiano`: string;
    `slpLorda`: Record<DestinazioneUso, number>;
    `scomputi`: { `murature_mq`: number; `loggePorticati_mq`: number; `vaniScala_mq`: number; `interrati_mq`: number };
  }>
- `standardReperitiInCessione`: { `verde_mq`: number; `servizi_mq`: number; `parcheggiPubblici_mq`: number }
- `parcheggiPrivatiProgetto`: { `stalli_mq`: number; `manovra_mq`: number }
- `sagomaEDistanze`: { `altezzaProgetto_m`: number; `distanzaConfini_m`: number; `distanzaFabbricati_m`: number; `distanzaStrade_m`: number }

---

## 4. Logica di Calcolo Esatta (`src/engine/motoreUrbanistico.ts`)

1. **Capacità Edificatoria Massima**:
   - Se `Uf` è valorizzato: $SLP_{max} = S_f \times U_f$. Altrimenti se `Ut` è valorizzato: $SLP_{max} = S_t \times U_t$.
   - Se `If` è valorizzato: $V_{max} = S_f \times I_f$. Altrimenti se `It` è valorizzato: $V_{max} = S_t \times I_t$.
   - Se manca uno dei due massimi ($SLP_{max}$ o $V_{max}$), derivarlo dall'altro usando `altezzaVirtualeConversione_m` ($V = SLP \times H_{virtuale}$).

2. **SLP Lorda, Scomputi con Tetto Massimo e SLP Netta**:
   - Sommare `slpLorda` su tutti i piani per singola destinazione e in totale ($SLP_{lorda,tot}$).
   - Calcolare gli scomputi ammessi:
     - `scompMuri` = `regole.scomputaMuraturePerimetrali` ? somma `murature_mq` : 0
     - `scompScale` = `regole.scomputaVaniScalaAscensore` ? somma `vaniScala_mq` : 0
     - `scompInterrati` = `regole.scomputaInterrati` ? somma `interrati_mq` : 0
     - `tettoLoggeMq` = $SLP_{lorda,tot} \times (\text{tettoMaxLoggePorticati\_percSLP} / 100)$
     - `scompLoggeAmmesso` = $\min(\text{somma loggePorticati\_mq}, \text{tettoLoggeMq})$
     - `loggeEccedentiTassate` = $\max(0, \text{somma loggePorticati\_mq} - \text{tettoLoggeMq})$
   - $SLP_{netta,tot} = \max(0, SLP_{lorda,tot} - (scompMuri + scompScale + scompInterrati + scompLoggeAmmesso))$.
   - Ripartire gli scomputi proporzionalmente sulle singole destinazioni d'uso in base al peso della loro $SLP_{lorda}$ sul totale, ottenendo così la ***`SLP Netta Differenziata per Destinazione`*** ($SLP_{netta,dest}$).
   - Calcolare il Volume urbanistico di progetto: $V_{progetto} = SLP_{netta,tot} \times H_{virtuale}$.
   - Verificare: $SLP_{netta,tot} \le SLP_{max}$ e $V_{progetto} \le V_{max}$, calcolando il residuo edificabile.

3. **Verifica Mix Funzionale**:
   - Per ogni destinazione con $SLP_{netta,dest} > 0$:
     - Calcolare $\text{quota\_perc} = (SLP_{netta,dest} / SLP_{netta,tot}) \times 100$.
     - Verificare che `ammessa === true` e che $\text{quotaMin\_perc} \le \text{quota\_perc} \le \text{quotaMax\_perc}$.

4. **Standard Urbanistici Differenziati (D.M. 1444/68) e Monetizzazione**:
   - Per **Residenziale**:
     - `abitantiTeorici` = $SLP_{netta,res} / \text{parametroAbitantiTeorici\_mqSlpPerAb}$.
     - `fabbisognoTotaleRes` = `abitantiTeorici` $\times$ `standardMin_mqPerAb`.
   - Per **Altre Destinazioni (Comm, Dir, Prod, Tur)**:
     - `fabbisognoTotaleDest` = $SLP_{netta,dest} \times (\text{standardMin\_percSLP} / 100)$.
   - Per ogni destinazione, suddividere il fabbisogno in:
     - `fabbisognoParcheggiPubblici` = `fabbisognoTotale` $\times$ (`quotaParcheggiPubbliciSuStandard_perc` / 100)
     - `fabbisognoVerdeServizi` = `fabbisognoTotale` $\times$ (`quotaVerdeServiziSuStandard_perc` / 100)
   - Sommare i fabbisogni di tutte le destinazioni per ottenere `fabbisognoParkPubbliciTot` e `fabbisognoVerdeServiziTot`.
   - Confrontare con `standardReperitiInCessione`:
     - `deficitParkPubblici` = $\max(0, \text{fabbisognoParkPubbliciTot} - \text{parcheggiPubblici\_mq})$
     - `deficitVerdeServizi` = $\max(0, \text{fabbisognoVerdeServiziTot} - (\text{verde\_mq} + \text{servizi\_mq}))$
     - Calcolare l'importo totale di **Monetizzazione** moltiplicando i deficit per le tariffe della destinazione corrispondente (o media ponderata sulle destinazioni che generano standard). Se `monetizzazioneAmmessa === false` e il deficit è $> 0$, segnare stato `NON CONFORME`.

5. **Parcheggi Privati Pertinenziali (Legge 122/89)**:
   - `fabbisognoL122` = $V_{progetto} \times \text{rapportoLegge122\_89\_mqOgniMc}$.
   - `extraComm` = $SLP_{netta,comm} \times (\text{dotazioneAggiuntivaCommerciale\_percSLP} / 100)$.
   - `fabbisognoTotalePrivati` = `fabbisognoL122` + `extraComm`.
   - `totaleProgettoPrivati` = `stalli_mq` + `manovra_mq`.
   - `percManovraReale` = `totaleProgettoPrivati` > 0 ? (`manovra_mq` / `totaleProgettoPrivati`) $\times$ 100 : 0.
   - Verificare: `totaleProgettoPrivati >= fabbisognoTotalePrivati` E `percManovraReale <= maxSuperficieManovra_percTotale`.

6. **Rapporto di Copertura, Permeabilità, Altezze e Distanze**:
   - $R_c = (S_c / S_f) \times 100 \le \text{rapportoCoperturaMax\_perc}$.
   - $SP_{ponderata} = \sum (\text{area\_mq}_i \times \text{coefficiente\_0\_1}_i)$, $I_p = (SP_{ponderata} / S_f) \times 100 \ge \text{indicePermeabilitaMin\_perc}$.
   - Verifiche dirette: $H_{progetto} \le H_{max}$, $D_c \ge D_{c,min}$, $D_f \ge D_{f,min}$, $D_s \ge D_{s,min}$.

---

## 5. Requisiti Interfaccia Utente (UI)
Design tecnico professionale (stile studio di architettura/ingegneria, palette neutra slate/blue, font monospace per i numeri, badge verdi `CONFORME` e rossi `NON CONFORME` ben visibili).
Organizzare in 4 schede principali + barra superiore fissa con riepilogo semaforico:
1. **Scheda 1 - Parametri PRG / NTA**: Form completo per modificare ogni parametro del `ProfiloPRG`, pulsanti per Esportare/Importare il `.json` del Comune, e box **"Importa da Testo NTA con Mistral AI"** (dove incollare l'articolo del PRG + campo API Key Mistral salvata in `localStorage` per auto-compilare il profilo).
2. **Scheda 2 - Dati Progetto & Import DXF**:
   - Area Drag & Drop per caricare un file `.dxf` con selettore unità di disegno (`m`, `cm`, `mm`) e legenda dei layer riconosciuti.
   - Tabelle editabili manualmente per inserire/modificare superfici del lotto, piani (aggiungi/rimuovi piano), SLP per destinazione, scomputi, aree permeabili, parcheggi e standard ceduti.
3. **Scheda 3 - Quadro Sinottico Verifiche**:
   - Card riassuntive con barre di avanzamento (SLP usata vs max, Volume, Rc, Ip).
   - Tabella analitica **SLP Lorda -> Scomputi -> SLP Netta per Destinazione d'Uso e Mix Funzionale**.
   - Tabella **Standard Urbanistici D.M. 1444/68** (Abitanti teorici, Verde/Servizi, Parcheggi Pubblici, Cessioni e calcolo Euro Monetizzazione).
   - Tabella **Parcheggi Privati L. 122/89** e **Verifiche Sagoma/Distanze**.
4. **Scheda 4 - Relazione & Export**:
   - Pulsante **Scarica Excel (.xlsx)** con 4 fogli formattati (Riepilogo Verifiche, Dettaglio Piani e SLP, Calcolo Standard e Monetizzazione, Parametri PRG).
   - Pulsante **Stampa / Salva PDF Relazione Tecnica** con layout CSS `@media print` ottimizzato per essere allegato a pratiche edilizie (CILA, SCIA, PdC).
