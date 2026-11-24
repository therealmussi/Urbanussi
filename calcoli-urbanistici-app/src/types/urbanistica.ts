export type DestinazioneUso =
  | 'residenziale'
  | 'commerciale'
  | 'direzionale'
  | 'produttivo'
  | 'turistico';

export const DESTINAZIONI: DestinazioneUso[] = [
  'residenziale',
  'commerciale',
  'direzionale',
  'produttivo',
  'turistico',
];

export const LABEL_DESTINAZIONI: Record<DestinazioneUso, string> = {
  residenziale: 'Residenziale',
  commerciale: 'Commerciale',
  direzionale: 'Direzionale/Terziario',
  produttivo: 'Produttivo/Artigianale',
  turistico: 'Turistico-Ricettivo',
};

export type TipoIntervento =
  | 'nuova_costruzione'
  | 'ristrutturazione_demolizione_ricostruzione'
  | 'ampliamento';

export interface ParametriEdificatori {
  indiceUtilizzazioneFondiaria_Uf: number | null;
  indiceUtilizzazioneTerritoriale_Ut: number | null;
  indiceFabbricabilitaFondiaria_If: number | null;
  indiceFabbricabilitaTerritoriale_It: number | null;
  altezzaVirtualeConversione_m: number;
  rapportoCoperturaMax_perc: number;
  indicePermeabilitaMin_perc: number;
  altezzaMax_m: number;
  distanzaMinConfini_m: number;
  distanzaMinFabbricati_m: number;
  distanzaMinStrade_m: number;
}

export interface RegoleScomputoSLP {
  scomputaMuraturePerimetrali: boolean;
  scomputaVaniScalaAscensore: boolean;
  scomputaInterrati: boolean;
  tettoMaxLoggePorticati_percSLP: number;
}

export interface RegolaDestinazione {
  ammessa: boolean;
  quotaMin_perc: number;
  quotaMax_perc: number;
  parametroAbitantiTeorici_mqSlpPerAb: number;
  standardMin_mqPerAb: number;
  standardMin_percSLP: number;
  quotaParcheggiPubbliciSuStandard_perc: number;
  quotaVerdeServiziSuStandard_perc: number;
  monetizzazioneAmmessa: boolean;
  tariffaMonetizzazione_euroMq: number;
}

export interface ParcheggiPrivati {
  rapportoLegge122_89_mqOgniMc: number;
  dotazioneAggiuntivaCommerciale_percSLP: number;
  maxSuperficieManovra_percTotale: number;
}

export interface ProfiloPRG {
  id: string;
  comune: string;
  zona: string;
  descrizione: string;
  parametriEdificatori: ParametriEdificatori;
  regoleScomputoSLP: RegoleScomputoSLP;
  destinazioni: Record<DestinazioneUso, RegolaDestinazione>;
  parcheggiPrivati: ParcheggiPrivati;
}

export interface SuperficiePermeabile {
  descrizione: string;
  area_mq: number;
  coefficiente_0_1: number;
}

export interface ScomputiPiano {
  murature_mq: number;
  loggePorticati_mq: number;
  vaniScala_mq: number;
  interrati_mq: number;
}

export interface Piano {
  id: string;
  nomePiano: string;
  slpLorda: Record<DestinazioneUso, number>;
  scomputi: ScomputiPiano;
}

export interface DatiProgetto {
  nomeProgetto: string;
  tipoIntervento: TipoIntervento;
  superficieTerritoriale_St: number;
  superficieFondiaria_Sf: number;
  superficieCoperta_Sc: number;
  superficiPermeabili: SuperficiePermeabile[];
  piani: Piano[];
  standardReperitiInCessione: {
    verde_mq: number;
    servizi_mq: number;
    parcheggiPubblici_mq: number;
  };
  parcheggiPrivatiProgetto: {
    stalli_mq: number;
    manovra_mq: number;
  };
  sagomaEDistanze: {
    altezzaProgetto_m: number;
    distanzaConfini_m: number;
    distanzaFabbricati_m: number;
    distanzaStrade_m: number;
  };
}

export interface Verifica {
  etichetta: string;
  richiesto: number;
  previsto: number;
  unitaMisura: string;
  conforme: boolean;
  dettaglio: string;
}

export interface CapacitaEdificatoria {
  slpMax: number | null;
  vMax: number | null;
  slpDerivataDa: 'Uf' | 'Ut' | null;
  vDerivatoDa: 'If' | 'It' | 'SLP' | null;
  slpResidua: number | null;
  volumeResiduo: number | null;
}

export interface RigaDestinazione {
  destinazione: DestinazioneUso;
  slpLorda: number;
  scomputiTotali: number;
  scomputiProporzionali: number;
  loggeEccedentiTassate: number;
  slpNetta: number;
  quotaPerc: number;
  ammessa: boolean;
  conformeMix: boolean;
}

export interface RigaStandard {
  destinazione: DestinazioneUso;
  abitantiTeorici: number;
  fabbisognoTotale_mq: number;
  fabbisognoParcheggiPubblici_mq: number;
  fabbisognoVerdeServizi_mq: number;
  monetizzazioneAmmessa: boolean;
  tariffa_euroMq: number;
}

export interface RisultatoStandard {
  righe: RigaStandard[];
  abitantiTeoriciTot: number;
  fabbisognoParkPubbliciTot: number;
  fabbisognoVerdeServiziTot: number;
  cedutoParkPubblici_mq: number;
  cedutoVerdeServizi_mq: number;
  deficitParkPubblici: number;
  deficitVerdeServizi: number;
  importoMonetizzazioneTot: number;
  conformeStandard: boolean;
  dettagli: Verifica[];
}

export interface RisultatoParcheggi {
  volumeProgetto_mc: number;
  fabbisognoL122_mq: number;
  extraCommerciale_mq: number;
  fabbisognoTotalePrivati_mq: number;
  stalliProgetto_mq: number;
  manovraProgetto_mq: number;
  totaleProgettoPrivati_mq: number;
  percManovraReale: number;
  percManovraMax: number;
  conforme: boolean;
}

export interface RisultatoSagoma {
  rapportoCopertura_perc: number;
  indicePermeabilita_perc: number;
  superficiePonderataPermeabile_mq: number;
  verifiche: Verifica[];
  conforme: boolean;
}

export interface RisultatoCalcolo {
  capacitaEdificatoria: CapacitaEdificatoria;
  slpLordaTot: number;
  slpNettaTot: number;
  scompMuri: number;
  scompScale: number;
  scompInterrati: number;
  tettoLoggeMq: number;
  scompLoggeAmmesso: number;
  loggeEccedentiTassate: number;
  volumeProgetto_mc: number;
  righeDestinazioni: RigaDestinazione[];
  conformeEdificabilita: boolean;
  dettagliEdificabilita: Verifica[];
  mixFunzionaleConforme: boolean;
  dettagliMix: Verifica[];
  standard: RisultatoStandard;
  parcheggi: RisultatoParcheggi;
  sagoma: RisultatoSagoma;
  conformeGlobale: boolean;
}

export interface StatoSemafori {
  conformitaUrbanistica: boolean;
  standard: boolean;
  parcheggiL122: boolean;
  suoloDistanze: boolean;
}
