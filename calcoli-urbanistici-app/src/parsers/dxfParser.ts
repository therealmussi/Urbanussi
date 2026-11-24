import DxfParser from 'dxf-parser';
import type { DatiProgetto, DestinazioneUso, Piano, SuperficiePermeabile } from '../types/urbanistica';
import { datiProgettoDefault } from '../data/prgDefault';

export type UnitaDisegno = 'm' | 'cm' | 'mm';

export const FATTORI_SCALA: Record<UnitaDisegno, number> = {
  m: 1,
  cm: 0.0001,
  mm: 0.000001,
};

interface Vertice {
  x: number;
  y: number;
}

interface EntitaPolilinea {
  type: string;
  layer?: string;
  shape?: boolean;
  closed?: boolean;
  vertices?: (Vertice & Record<string, unknown>)[];
}

export interface LayerLog {
  layer: string;
  area_mq: number;
  riconosciuto: boolean;
  descrizione: string;
}

export interface EsitoDxf {
  dati: DatiProgetto;
  logLayer: LayerLog[];
  layerRiconosciuti: string[];
  layerIgnorati: string[];
  totaleEntita: number;
  superficiCalcolate: number;
  errori: string[];
}

const MAPPA_DESTINAZIONI: Record<string, DestinazioneUso> = {
  RES: 'residenziale',
  COMM: 'commerciale',
  DIR: 'direzionale',
  PROD: 'produttivo',
  TUR: 'turistico',
};

const MAPPA_SCOMPUTI: Record<string, keyof Piano['scomputi']> = {
  MURI: 'murature_mq',
  LOGGE: 'loggePorticati_mq',
  SCALE: 'vaniScala_mq',
  INT: 'interrati_mq',
};

const MAPPA_PIANI: Record<string, string> = {
  SOTT: 'Sottotetto',
  PT: 'Piano Terra',
  P1: 'Piano Primo',
  P2: 'Piano Secondo',
  P3: 'Piano Terzo',
  S1: 'Seminterrato',
};

/** Formula di Gauss (shoelace) per l'area di un poligono. */
export function areaPoligono(vertici: Vertice[]): number {
  if (!vertici || vertici.length < 3) return 0;
  let somma = 0;
  for (let i = 0; i < vertici.length; i++) {
    const a = vertici[i];
    const b = vertici[(i + 1) % vertici.length];
    somma += a.x * b.y - b.x * a.y;
  }
  return Math.abs(somma / 2);
}

function isChiusa(e: EntitaPolilinea): boolean {
  if (e.shape === true || e.closed === true) return true;
  const v = e.vertices ?? [];
  if (v.length < 4) return false;
  const primo = v[0];
  const ultimo = v[v.length - 1];
  return Math.abs(primo.x - ultimo.x) < 1e-6 && Math.abs(primo.y - ultimo.y) < 1e-6;
}

function coordPolilinea(e: EntitaPolilinea): Vertice[] {
  return (e.vertices ?? [])
    .filter((v) => typeof v.x === 'number' && typeof v.y === 'number')
    .map((v) => ({ x: v.x, y: v.y }));
}

function gestionePiano(dati: DatiProgetto, codicePiano: string): Piano {
  let piano = dati.piani.find((p) => p.id === codicePiano);
  if (!piano) {
    piano = {
      id: codicePiano,
      nomePiano: MAPPA_PIANI[codicePiano.toUpperCase()] ?? `Piano ${codicePiano}`,
      slpLorda: { residenziale: 0, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 },
      scomputi: { murature_mq: 0, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
    };
    dati.piani.push(piano);
  }
  return piano;
}

const LAYER_ST = /^URB_?ST$/i;
const LAYER_SF = /^URB_?SF$/i;
const LAYER_SC = /^URB_?SC$/i;
const LAYER_SLP = /^URB_?SLP_([A-Z]+)_([A-Z0-9]+)$/i;
const LAYER_SCOMP = /^URB_?SCOMP_([A-Z]+)_([A-Z0-9]+)$/i;
const LAYER_SP = /^URB_?SP_(\d+)$/i;
const LAYER_PARK_STALLI = /^URB_?PARK_?STALLI$/i;
const LAYER_PARK_MANOVRA = /^URB_?PARK_?MANOVRA$/i;
const LAYER_STD_VERDE = /^URB_?STD_?VERDE$/i;
const LAYER_STD_SERVIZI = /^URB_?STD_?SERVIZI$/i;
const LAYER_STD_PARK = /^URB_?STD_?PARK$/i;

export function parseDxf(contenuto: string, unita: UnitaDisegno = 'm', datiBase?: DatiProgetto): EsitoDxf {
  const parser = new DxfParser();
  let dxf;
  try {
    dxf = parser.parseSync(contenuto);
  } catch (err) {
    throw new Error(`File DXF non valido o illeggibile: ${(err as Error).message}`);
  }
  if (!dxf) throw new Error('File DXF vuoto o non valido');

  const dati: DatiProgetto = datiBase
    ? (JSON.parse(JSON.stringify(datiBase)) as DatiProgetto)
    : (JSON.parse(JSON.stringify(datiProgettoDefault)) as DatiProgetto);

  const fattore = FATTORI_SCALA[unita];
  const logLayer: LayerLog[] = [];
  const layerRiconosciuti = new Set<string>();
  const layerIgnorati = new Set<string>();
  const errori: string[] = [];
  const accumuloPermeabili = new Map<string, SuperficiePermeabile>();
  let superficiCalcolate = 0;
  let totaleEntita = 0;

  const entita = (dxf.entities ?? []) as unknown as EntitaPolilinea[];
  for (const e of entita) {
    if (e.type !== 'LWPOLYLINE' && e.type !== 'POLYLINE') continue;
    totaleEntita++;
    const layer = (e.layer ?? '').trim();
    if (!layer) continue;
    if (!isChiusa(e)) continue;
    const areaCoord = areaPoligono(coordPolilinea(e));
    const areaMq = areaCoord * fattore;
    if (areaMq <= 0) continue;
    superficiCalcolate++;

    const upper = layer.toUpperCase().replace(/\s+/g, '_');

    if (LAYER_ST.test(upper)) {
      dati.superficieTerritoriale_St += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Superficie Territoriale (St)' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_SF.test(upper)) {
      dati.superficieFondiaria_Sf += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Superficie Fondiaria (Sf)' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_SC.test(upper)) {
      dati.superficieCoperta_Sc += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Superficie Coperta (Sc)' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_SLP.test(upper)) {
      const match = upper.match(LAYER_SLP)!;
      const dest = MAPPA_DESTINAZIONI[match[1]];
      const codicePiano = match[2];
      if (dest) {
        const piano = gestionePiano(dati, codicePiano);
        piano.slpLorda[dest] += areaMq;
        logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: `SLP ${dest} - piano ${codicePiano}` });
        layerRiconosciuti.add(layer);
      } else {
        layerIgnorati.add(layer);
        logLayer.push({ layer, area_mq: areaMq, riconosciuto: false, descrizione: `Destinazione "${match[1]}" non riconosciuta` });
      }
    } else if (LAYER_SCOMP.test(upper)) {
      const match = upper.match(LAYER_SCOMP)!;
      const campo = MAPPA_SCOMPUTI[match[1]];
      const codicePiano = match[2];
      if (campo) {
        const piano = gestionePiano(dati, codicePiano);
        piano.scomputi[campo] += areaMq;
        logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: `Scomputo ${match[1]} - piano ${codicePiano}` });
        layerRiconosciuti.add(layer);
      } else {
        layerIgnorati.add(layer);
        logLayer.push({ layer, area_mq: areaMq, riconosciuto: false, descrizione: `Tipo scomputo "${match[1]}" non riconosciuto` });
      }
    } else if (LAYER_SP.test(upper)) {
      const match = upper.match(LAYER_SP)!;
      const coeff = Math.min(100, Math.max(0, Number(match[1]))) / 100;
      const esistente = accumuloPermeabili.get(upper);
      if (esistente) esistente.area_mq += areaMq;
      else accumuloPermeabili.set(upper, { descrizione: `Area ${upper} (coeff ${coeff.toFixed(2)})`, area_mq: areaMq, coefficiente_0_1: coeff });
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: `Superficie drenante coefficiente ${coeff.toFixed(2)}` });
      layerRiconosciuti.add(layer);
    } else if (LAYER_PARK_STALLI.test(upper)) {
      dati.parcheggiPrivatiProgetto.stalli_mq += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Parcheggi privati - stalli (L. 122/89)' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_PARK_MANOVRA.test(upper)) {
      dati.parcheggiPrivatiProgetto.manovra_mq += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Parcheggi privati - manovra (L. 122/89)' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_STD_VERDE.test(upper)) {
      dati.standardReperitiInCessione.verde_mq += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Standard - verde pubblico in cessione' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_STD_SERVIZI.test(upper)) {
      dati.standardReperitiInCessione.servizi_mq += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Standard - servizi pubblici in cessione' });
      layerRiconosciuti.add(layer);
    } else if (LAYER_STD_PARK.test(upper)) {
      dati.standardReperitiInCessione.parcheggiPubblici_mq += areaMq;
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: true, descrizione: 'Standard - parcheggi pubblici in cessione' });
      layerRiconosciuti.add(layer);
    } else {
      layerIgnorati.add(layer);
      logLayer.push({ layer, area_mq: areaMq, riconosciuto: false, descrizione: 'Layer fuori convenzione URB_*' });
    }
  }

  dati.superficiPermeabili.push(...accumuloPermeabili.values());

  return {
    dati,
    logLayer,
    layerRiconosciuti: [...layerRiconosciuti],
    layerIgnorati: [...layerIgnorati],
    totaleEntita,
    superficiCalcolate,
    errori,
  };
}

export function leggiDxfDaFile(file: File, unita: UnitaDisegno, datiBase?: DatiProgetto): Promise<EsitoDxf> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        resolve(parseDxf(String(reader.result ?? ''), unita, datiBase));
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Impossibile leggere il file selezionato'));
    reader.readAsText(file);
  });
}
