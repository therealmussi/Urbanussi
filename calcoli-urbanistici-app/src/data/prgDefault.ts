import type { DatiProgetto, DestinazioneUso, ProfiloPRG } from '../types/urbanistica';

const dest = (
  ammessa: boolean,
  quotaMin_perc: number,
  quotaMax_perc: number,
  extra: Partial<{
    parametroAbitantiTeorici_mqSlpPerAb: number;
    standardMin_mqPerAb: number;
    standardMin_percSLP: number;
  }> = {},
) => ({
  ammessa,
  quotaMin_perc,
  quotaMax_perc,
  parametroAbitantiTeorici_mqSlpPerAb: extra.parametroAbitantiTeorici_mqSlpPerAb ?? 35,
  standardMin_mqPerAb: extra.standardMin_mqPerAb ?? 18,
  standardMin_percSLP: extra.standardMin_percSLP ?? 0,
  quotaParcheggiPubbliciSuStandard_perc: 50,
  quotaVerdeServiziSuStandard_perc: 50,
  monetizzazioneAmmessa: true,
  tariffaMonetizzazione_euroMq: 180,
});

export const profiloPRGDefault: ProfiloPRG = {
  id: 'prg-demo-b2',
  comune: 'Comune Demo',
  zona: 'Zona B2 - Tessuto Consolidato',
  descrizione:
    'Zona di completa edificazione a destinazione Essenzialmente Residenziale (artt. 2 e 4 L. 1150/42). Indici ai sensi delle NTA Comunali e Regolamento Edilizio Tipo.',
  parametriEdificatori: {
    indiceUtilizzazioneFondiaria_Uf: 2.5,
    indiceUtilizzazioneTerritoriale_Ut: null,
    indiceFabbricabilitaFondiaria_If: 2.5,
    indiceFabbricabilitaTerritoriale_It: null,
    altezzaVirtualeConversione_m: 3.0,
    rapportoCoperturaMax_perc: 40,
    indicePermeabilitaMin_perc: 30,
    altezzaMax_m: 16.5,
    distanzaMinConfini_m: 5.0,
    distanzaMinFabbricati_m: 10.0,
    distanzaMinStrade_m: 5.0,
  },
  regoleScomputoSLP: {
    scomputaMuraturePerimetrali: true,
    scomputaVaniScalaAscensore: true,
    scomputaInterrati: true,
    tettoMaxLoggePorticati_percSLP: 15,
  },
  destinazioni: {
    residenziale: dest(true, 0, 100),
    commerciale: dest(true, 0, 25),
    direzionale: dest(false, 0, 25),
    produttivo: dest(false, 0, 25),
    turistico: dest(true, 0, 25),
  },
  parcheggiPrivati: {
    rapportoLegge122_89_mqOgniMc: 0.1,
    dotazioneAggiuntivaCommerciale_percSLP: 0,
    maxSuperficieManovra_percTotale: 40,
  },
};

const slpEmpty: Record<DestinazioneUso, number> = {
  residenziale: 0,
  commerciale: 0,
  direzionale: 0,
  produttivo: 0,
  turistico: 0,
};

export const datiProgettoDefault: DatiProgetto = {
  nomeProgetto: 'Intervento Demo - Via Roma 1',
  tipoIntervento: 'nuova_costruzione',
  superficieTerritoriale_St: 5000,
  superficieFondiaria_Sf: 2500,
  superficieCoperta_Sc: 850,
  superficiPermeabili: [
    { descrizione: 'Giardino a prato', area_mq: 1100, coefficiente_0_1: 1.0 },
    { descrizione: 'Piazzale in grigliato', area_mq: 300, coefficiente_0_1: 0.5 },
    { descrizione: 'Parcheggio in bitume', area_mq: 250, coefficiente_0_1: 0.0 },
  ],
  piani: [
    {
      id: 'sott',
      nomePiano: 'Sottotetto',
      slpLorda: { ...slpEmpty, residenziale: 360 },
      scomputi: { murature_mq: 60, loggePorticati_mq: 30, vaniScala_mq: 0, interrati_mq: 0 },
    },
    {
      id: 'pt',
      nomePiano: 'Piano Terra',
      slpLorda: { ...slpEmpty, residenziale: 620, commerciale: 180 },
      scomputi: { murature_mq: 40, loggePorticati_mq: 120, vaniScala_mq: 40, interrati_mq: 0 },
    },
    {
      id: 'p1',
      nomePiano: 'Piano Primo',
      slpLorda: { ...slpEmpty, residenziale: 620, commerciale: 120 },
      scomputi: { murature_mq: 40, loggePorticati_mq: 0, vaniScala_mq: 40, interrati_mq: 0 },
    },
    {
      id: 'p2',
      nomePiano: 'Piano Secondo',
      slpLorda: { ...slpEmpty, residenziale: 620 },
      scomputi: { murature_mq: 40, loggePorticati_mq: 0, vaniScala_mq: 40, interrati_mq: 0 },
    },
  ],
  standardReperitiInCessione: {
    verde_mq: 680,
    servizi_mq: 120,
    parcheggiPubblici_mq: 620,
  },
  parcheggiPrivatiProgetto: {
    stalli_mq: 620,
    manovra_mq: 280,
  },
  sagomaEDistanze: {
    altezzaProgetto_m: 13.2,
    distanzaConfini_m: 6.5,
    distanzaFabbricati_m: 12.0,
    distanzaStrade_m: 6.0,
  },
};

export function creaDatiProgettoVuoto(nomeProgetto = 'Progetto da DXF'): DatiProgetto {
  return {
    nomeProgetto,
    tipoIntervento: 'nuova_costruzione',
    superficieTerritoriale_St: 0,
    superficieFondiaria_Sf: 0,
    superficieCoperta_Sc: 0,
    superficiPermeabili: [],
    piani: [],
    standardReperitiInCessione: { verde_mq: 0, servizi_mq: 0, parcheggiPubblici_mq: 0 },
    parcheggiPrivatiProgetto: { stalli_mq: 0, manovra_mq: 0 },
    sagomaEDistanze: { altezzaProgetto_m: 0, distanzaConfini_m: 0, distanzaFabbricati_m: 0, distanzaStrade_m: 0 },
  };
}
