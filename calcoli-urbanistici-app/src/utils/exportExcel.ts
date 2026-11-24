import * as XLSX from 'xlsx';
import type { DatiProgetto, ProfiloPRG, RisultatoCalcolo } from '../types/urbanistica';
import { DESTINAZIONI, LABEL_DESTINAZIONI } from '../types/urbanistica';

function fogliaDaRighe(rows: (string | number | boolean | null)[][]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = (rows[0] ?? []).map(() => ({ wch: 28 }));
  return ws;
}

function fmtEuro(v: number): string {
  return `€ ${v.toFixed(2)}`;
}

export function generaWorkbook(prg: ProfiloPRG, dati: DatiProgetto, ris: RisultatoCalcolo): XLSX.WorkBook {
  const wb = XLSX.utils.book_new();

  const riepilogo: (string | number | boolean)[][] = [
    ['RELAZIONE TECNICA URBANISTICA - QUADRO SINOTTICO VERIFICHE'],
    ['Comune', prg.comune],
    ['Zona', prg.zona],
    ['Progetto', dati.nomeProgetto],
    ['Tipo intervento', dati.tipoIntervento],
    [],
    ['VERIFICA', 'VALORE DICHIARATO', 'LIMITE/REQUISITO', 'ESITO'],
    ...ris.dettagliEdificabilita.map((v) => [v.etichetta, v.previsto, v.richiesto, v.conforme ? 'CONFORME' : 'NON CONFORME']),
    ...ris.dettagliMix.map((v) => [v.etichetta, v.previsto, v.richiesto, v.conforme ? 'CONFORME' : 'NON CONFORME']),
    ...ris.standard.dettagli.map((v) => [v.etichetta, v.previsto, v.richiesto, v.conforme ? 'CONFORME' : 'NON CONFORME']),
    [
      'Parcheggi privati L. 122/89',
      ris.parcheggi.totaleProgettoPrivati_mq,
      ris.parcheggi.fabbisognoTotalePrivati_mq,
      ris.parcheggi.conforme ? 'CONFORME' : 'NON CONFORME',
    ],
    ...ris.sagoma.verifiche.map((v) => [v.etichetta, v.previsto, v.richiesto, v.conforme ? 'CONFORME' : 'NON CONFORME']),
    [],
    ['CONFORMITÀ GLOBALE', ris.conformeGlobale ? 'CONFORME' : 'NON CONFORME'],
    ['Monetizzazione totale', fmtEuro(ris.standard.importoMonetizzazioneTot)],
  ];

  const dettaglioPiani: (string | number | boolean)[][] = [
    ['DETTAGLIO PIANI E SUPERFICI NON COPERTE PER DESTINAZIONE (mq)'],
    ['Piano', ...DESTINAZIONI.map((d) => LABEL_DESTINAZIONI[d]), 'Murature (scomp.)', 'Logge/Porticati (scomp.)', 'Vani scala (scomp.)', 'Interrati (scomp.)'],
    ...dati.piani.map((p) => [
      p.nomePiano,
      ...DESTINAZIONI.map((d) => p.slpLorda[d]),
      p.scomputi.murature_mq,
      p.scomputi.loggePorticati_mq,
      p.scomputi.vaniScala_mq,
      p.scomputi.interrati_mq,
    ]),
    [],
    ['QUADRO SLP PER DESTINAZIONE'],
    ['Destinazione', 'SLP Lorda (mq)', 'Scomputi ripartiti (mq)', 'SLP Netta (mq)', 'Quota mix (%)', 'Conforme'],
    ...ris.righeDestinazioni.map((r) => [
      LABEL_DESTINAZIONI[r.destinazione],
      r.slpLorda,
      r.scomputiProporzionali,
      r.slpNetta,
      r.quotaPerc,
      r.conformeMix ? 'CONFORME' : 'NON CONFORME',
    ]),
    [],
    ['SLP Lorda totale', ris.slpLordaTot],
    ['Scomputo murature', ris.scompMuri],
    ['Scomputo vani scala', ris.scompScale],
    ['Scomputo interrati', ris.scompInterrati],
    ['Tetto logge ammesso', ris.tettoLoggeMq],
    ['Logge ammesse in scomputo', ris.scompLoggeAmmesso],
    ['Logge eccedenti tassate', ris.loggeEccedentiTassate],
    ['SLP Netta totale', ris.slpNettaTot],
    ['Volume progetto (mc)', ris.volumeProgetto_mc],
  ];

  const standardFoglio: (string | number | boolean)[][] = [
    ['CALCOLO STANDARD URBANISTICI (D.M. 1444/68) E MONETIZZAZIONE'],
    ['Destinazione', 'Abitanti teorici', 'Fabbisogno totale (mq)', 'Parcheggi pubblici (mq)', 'Verde/Servizi (mq)', 'Monetizzazione', 'Tariffa (€/mq)'],
    ...ris.standard.righe.map((r) => [
      LABEL_DESTINAZIONI[r.destinazione],
      r.abitantiTeorici,
      r.fabbisognoTotale_mq,
      r.fabbisognoParcheggiPubblici_mq,
      r.fabbisognoVerdeServizi_mq,
      r.monetizzazioneAmmessa ? 'Ammessa' : 'Non ammessa',
      r.tariffa_euroMq,
    ]),
    [],
    ['Abitanti teorici totali', ris.standard.abitantiTeoriciTot],
    ['Fabbisogno parcheggi pubblici totale (mq)', ris.standard.fabbisognoParkPubbliciTot],
    ['Fabbisogno verde/servizi totale (mq)', ris.standard.fabbisognoVerdeServiziTot],
    ['Ceduto parcheggi pubblici (mq)', ris.standard.cedutoParkPubblici_mq],
    ['Ceduto verde + servizi (mq)', ris.standard.cedutoVerdeServizi_mq],
    ['Deficit parcheggi pubblici (mq)', ris.standard.deficitParkPubblici],
    ['Deficit verde/servizi (mq)', ris.standard.deficitVerdeServizi],
    ['Importo monetizzazione totale', fmtEuro(ris.standard.importoMonetizzazioneTot)],
    ['Esito standard', ris.standard.conformeStandard ? 'CONFORME' : 'NON CONFORME'],
    [],
    ['PARCHEGGI PRIVATI (L. 122/89)'],
    ['Volume progetto (mc)', ris.parcheggi.volumeProgetto_mc],
    ['Fabbisogno L. 122/89 (mq)', ris.parcheggi.fabbisognoL122_mq],
    ['Dotazione aggiuntiva commerciale (mq)', ris.parcheggi.extraCommerciale_mq],
    ['Fabbisogno totale (mq)', ris.parcheggi.fabbisognoTotalePrivati_mq],
    ['Stalli realizzati (mq)', ris.parcheggi.stalliProgetto_mq],
    ['Manovra realizzata (mq)', ris.parcheggi.manovraProgetto_mq],
    ['Totale realizzati (mq)', ris.parcheggi.totaleProgettoPrivati_mq],
    ['Percentuale manovra (%)', ris.parcheggi.percManovraReale],
    ['Percentuale manovra max (%)', ris.parcheggi.percManovraMax],
    ['Esito parcheggi privati', ris.parcheggi.conforme ? 'CONFORME' : 'NON CONFORME'],
  ];

  const parametri: (string | number | boolean)[][] = [
    ['PARAMETRI PRG / NTA'],
    ['Comune', prg.comune],
    ['Zona', prg.zona],
    ['Descrizione', prg.descrizione],
    [],
    ['Parametro', 'Valore', 'Unità'],
    ['Indice Utilizzazione Fondiaria (Uf)', prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf ?? 'non valorizzato', 'mq SLP / mq Sf'],
    ['Indice Utilizzazione Territoriale (Ut)', prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut ?? 'non valorizzato', 'mq SLP / mq St'],
    ['Indice Fabbricabilità Fondiaria (If)', prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If ?? 'non valorizzato', 'mc / mq Sf'],
    ['Indice Fabbricabilità Territoriale (It)', prg.parametriEdificatori.indiceFabbricabilitaTerritoriale_It ?? 'non valorizzato', 'mc / mq St'],
    ['Altezza virtuale di conversione', prg.parametriEdificatori.altezzaVirtualeConversione_m, 'm'],
    ['Rapporto di copertura massimo', prg.parametriEdificatori.rapportoCoperturaMax_perc, '%'],
    ['Indice di permeabilità minimo', prg.parametriEdificatori.indicePermeabilitaMin_perc, '%'],
    ['Altezza massima', prg.parametriEdificatori.altezzaMax_m, 'm'],
    ['Distanza minima dai confini', prg.parametriEdificatori.distanzaMinConfini_m, 'm'],
    ['Distanza minima tra fabbricati', prg.parametriEdificatori.distanzaMinFabbricati_m, 'm'],
    ['Distanza minima dalle strade', prg.parametriEdificatori.distanzaMinStrade_m, 'm'],
    [],
    ['Scomputo murature perimetrali', prg.regoleScomputoSLP.scomputaMuraturePerimetrali ? 'Sì' : 'No'],
    ['Scomputo vani scala/ascensore', prg.regoleScomputoSLP.scomputaVaniScalaAscensore ? 'Sì' : 'No'],
    ['Scomputo interrati', prg.regoleScomputoSLP.scomputaInterrati ? 'Sì' : 'No'],
    ['Tetto logge/porticati (% SLP lorda)', prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP, '%'],
    [],
    ['Destinazione', 'Ammessa', 'Quota min (%)', 'Quota max (%)', 'Standard', 'Monetizzazione', 'Tariffa (€/mq)'],
    ...DESTINAZIONI.map((d) => {
      const regola = prg.destinazioni[d];
      return [
        LABEL_DESTINAZIONI[d],
        regola.ammessa ? 'Sì' : 'No',
        regola.quotaMin_perc,
        regola.quotaMax_perc,
        d === 'residenziale' ? `${regola.standardMin_mqPerAb} mq/ab` : `${regola.standardMin_percSLP}% SLP`,
        regola.monetizzazioneAmmessa ? 'Ammessa' : 'No',
        regola.tariffaMonetizzazione_euroMq,
      ];
    }),
    [],
    ['Rapporto L. 122/89 (mq/mc)', prg.parcheggiPrivati.rapportoLegge122_89_mqOgniMc],
    ['Dotazione aggiuntiva commerciale (% SLP)', prg.parcheggiPrivati.dotazioneAggiuntivaCommerciale_percSLP, '%'],
    ['Max superficie manovra (% totale)', prg.parcheggiPrivati.maxSuperficieManovra_percTotale, '%'],
  ];

  XLSX.utils.book_append_sheet(wb, fogliaDaRighe(riepilogo), 'Riepilogo Verifiche');
  XLSX.utils.book_append_sheet(wb, fogliaDaRighe(dettaglioPiani), 'Dettaglio Piani e SLP');
  XLSX.utils.book_append_sheet(wb, fogliaDaRighe(standardFoglio), 'Standard e Monetizzazione');
  XLSX.utils.book_append_sheet(wb, fogliaDaRighe(parametri), 'Parametri PRG');

  return wb;
}

export function esportaExcel(prg: ProfiloPRG, dati: DatiProgetto, ris: RisultatoCalcolo, nomeFile?: string): string {
  const wb = generaWorkbook(prg, dati, ris);
  const nome = nomeFile ?? `Relazione_Urbanistica_${dati.nomeProgetto.replace(/[^a-zA-Z0-9]+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, nome);
  return nome;
}
