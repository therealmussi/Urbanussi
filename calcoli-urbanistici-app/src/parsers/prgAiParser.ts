import type { DestinazioneUso, ProfiloPRG } from '../types/urbanistica';
import { profiloPRGDefault } from '../data/prgDefault';

const ENDPOINT = 'https://api.mistral.ai/v1/chat/completions';
const MODELLO = 'mistral-large-latest';

export const CHIAVE_LOCALSTORAGE = 'mistralApiKey';

export function leggiApiKey(): string {
  try {
    return localStorage.getItem(CHIAVE_LOCALSTORAGE) ?? '';
  } catch {
    return '';
  }
}

export function salvaApiKey(chiave: string): void {
  try {
    if (chiave) localStorage.setItem(CHIAVE_LOCALSTORAGE, chiave);
    else localStorage.removeItem(CHIAVE_LOCALSTORAGE);
  } catch {
    window.alert('impossibile salvare l\'API key nel browser.');
  }
}

const SCHEMA_PROMPT = `Analizza il testo normativo urbanistico fornito (articolo di PRG, PGT, NTA o Regolamento Edilizio) e rispondi SOLO con un oggetto JSON valido conforme a questa struttura TypeScript:

interface ProfiloPRG {
  id: string;
  comune: string;
  zona: string;
  descrizione: string;
  parametriEdificatori: {
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
  };
  regoleScomputoSLP: {
    scomputaMuraturePerimetrali: boolean;
    scomputaVaniScalaAscensore: boolean;
    scomputaInterrati: boolean;
    tettoMaxLoggePorticati_percSLP: number;
  };
  destinazioni: Record<'residenziale' | 'commerciale' | 'direzionale' | 'produttivo' | 'turistico', {
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
  }>;
  parcheggiPrivati: {
    rapportoLegge122_89_mqOgniMc: number;
    dotazioneAggiuntivaCommerciale_percSLP: number;
    maxSuperficieManovra_percTotale: number;
  };
}

Regole di estrazione:
- Usa null per gli indici non presenti nel testo; usa valori di default ragionevoli (altezzaVirtualeConversione_m = 3, standard residenziale D.M. 1444/68: 18 mq/ab, abitanti teorici 35 mq SLP/ab, L. 122/89: 0.10 mq/mc) per i parametri assenti.
- Percentuali come numeri (es. 40 per il 40%). Se il metro quadrato e le altezze sono in metri, lasciali in metri.
- Non inventare norme: quando un dato non è deducibile usare i default sopra indicati.
- Le percentuali di standard per destinazioni non residenziali (standardMin_percSLP) sono tipicamente 100 per residenzialmente compatte, 80 per direzionale; usa il testo quando indicato.`;

function num(v: unknown, fallback: number): number {
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function numOrFallback(v: unknown, fallback: number | null): number | null {
  if (v === null || v === undefined || v === '') return fallback;
  const n = typeof v === 'string' ? Number(v.replace(',', '.')) : v;
  return typeof n === 'number' && Number.isFinite(n) ? n : fallback;
}

function bool(v: unknown, fallback: boolean): boolean {
  return typeof v === 'boolean' ? v : fallback;
}

const DEST_KEY: Record<string, DestinazioneUso> = {
  residenziale: 'residenziale',
  commerciale: 'commerciale',
  direzionale: 'direzionale',
  produttivo: 'produttivo',
  turistico: 'turistico',
};

/** Normalizza e valida l'oggetto originato dall'IA fondendolo con il profilo di default. */
export function normalizzaProfiloPRG(raw: unknown): ProfiloPRG {
  if (typeof raw !== 'object' || raw === null) {
    throw new Error('Risposta AI non valida: oggetto JSON atteso');
  }
  const o = raw as Record<string, unknown>;
  const p = (o.parametriEdificatori ?? {}) as Record<string, unknown>;
  const r = (o.regoleScomputoSLP ?? {}) as Record<string, unknown>;
  const d = (o.destinazioni ?? {}) as Record<string, unknown>;
  const pk = (o.parcheggiPrivati ?? {}) as Record<string, unknown>;

  const destinazioni = JSON.parse(JSON.stringify(profiloPRGDefault.destinazioni)) as ProfiloPRG['destinazioni'];
  for (const key of Object.keys(DEST_KEY)) {
    const dk = DEST_KEY[key];
    const dd = (d[key] ?? {}) as Record<string, unknown>;
    const base = destinazioni[dk];
    destinazioni[dk] = {
      ...base,
      ammessa: bool(dd.ammessa, base.ammessa),
      quotaMin_perc: num(dd.quotaMin_perc, base.quotaMin_perc),
      quotaMax_perc: num(dd.quotaMax_perc, base.quotaMax_perc),
      parametroAbitantiTeorici_mqSlpPerAb: num(dd.parametroAbitantiTeorici_mqSlpPerAb, base.parametroAbitantiTeorici_mqSlpPerAb),
      standardMin_mqPerAb: num(dd.standardMin_mqPerAb, base.standardMin_mqPerAb),
      standardMin_percSLP: num(dd.standardMin_percSLP, base.standardMin_percSLP),
      quotaParcheggiPubbliciSuStandard_perc: num(dd.quotaParcheggiPubbliciSuStandard_perc, base.quotaParcheggiPubbliciSuStandard_perc),
      quotaVerdeServiziSuStandard_perc: num(dd.quotaVerdeServiziSuStandard_perc, base.quotaVerdeServiziSuStandard_perc),
      monetizzazioneAmmessa: bool(dd.monetizzazioneAmmessa, base.monetizzazioneAmmessa),
      tariffaMonetizzazione_euroMq: num(dd.tariffaMonetizzazione_euroMq, base.tariffaMonetizzazione_euroMq),
    };
  }

  const base = profiloPRGDefault;
  return {
    id: typeof o.id === 'string' && o.id ? o.id : `prg-ai-${Date.now()}`,
    comune: typeof o.comune === 'string' && o.comune ? o.comune : 'Comune (da testo NTA)',
    zona: typeof o.zona === 'string' && o.zona ? o.zona : 'Zona estratta da NTA',
    descrizione: typeof o.descrizione === 'string' ? o.descrizione : 'Profilo estratto automaticamente da testo normativo con Mistral AI',
    parametriEdificatori: {
      indiceUtilizzazioneFondiaria_Uf: numOrFallback(p.indiceUtilizzazioneFondiaria_Uf, base.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf),
      indiceUtilizzazioneTerritoriale_Ut: numOrFallback(p.indiceUtilizzazioneTerritoriale_Ut, base.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut),
      indiceFabbricabilitaFondiaria_If: numOrFallback(p.indiceFabbricabilitaFondiaria_If, base.parametriEdificatori.indiceFabbricabilitaFondiaria_If),
      indiceFabbricabilitaTerritoriale_It: numOrFallback(p.indiceFabbricabilitaTerritoriale_It, base.parametriEdificatori.indiceFabbricabilitaTerritoriale_It),
      altezzaVirtualeConversione_m: num(p.altezzaVirtualeConversione_m, base.parametriEdificatori.altezzaVirtualeConversione_m),
      rapportoCoperturaMax_perc: num(p.rapportoCoperturaMax_perc, base.parametriEdificatori.rapportoCoperturaMax_perc),
      indicePermeabilitaMin_perc: num(p.indicePermeabilitaMin_perc, base.parametriEdificatori.indicePermeabilitaMin_perc),
      altezzaMax_m: num(p.altezzaMax_m, base.parametriEdificatori.altezzaMax_m),
      distanzaMinConfini_m: num(p.distanzaMinConfini_m, base.parametriEdificatori.distanzaMinConfini_m),
      distanzaMinFabbricati_m: num(p.distanzaMinFabbricati_m, base.parametriEdificatori.distanzaMinFabbricati_m),
      distanzaMinStrade_m: num(p.distanzaMinStrade_m, base.parametriEdificatori.distanzaMinStrade_m),
    },
    regoleScomputoSLP: {
      scomputaMuraturePerimetrali: bool(r.scomputaMuraturePerimetrali, base.regoleScomputoSLP.scomputaMuraturePerimetrali),
      scomputaVaniScalaAscensore: bool(r.scomputaVaniScalaAscensore, base.regoleScomputoSLP.scomputaVaniScalaAscensore),
      scomputaInterrati: bool(r.scomputaInterrati, base.regoleScomputoSLP.scomputaInterrati),
      tettoMaxLoggePorticati_percSLP: num(r.tettoMaxLoggePorticati_percSLP, base.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP),
    },
    destinazioni,
    parcheggiPrivati: {
      rapportoLegge122_89_mqOgniMc: num(pk.rapportoLegge122_89_mqOgniMc, base.parcheggiPrivati.rapportoLegge122_89_mqOgniMc),
      dotazioneAggiuntivaCommerciale_percSLP: num(pk.dotazioneAggiuntivaCommerciale_percSLP, base.parcheggiPrivati.dotazioneAggiuntivaCommerciale_percSLP),
      maxSuperficieManovra_percTotale: num(pk.maxSuperficieManovra_percTotale, base.parcheggiPrivati.maxSuperficieManovra_percTotale),
    },
  };
}

export interface EsitoPrgAi {
  profilo: ProfiloPRG;
  testoRisposta: string;
}

export async function estraiProfiloDaTesto(testo: string, apiKey: string): Promise<EsitoPrgAi> {
  if (!apiKey) throw new Error('API Key Mistral mancante: inseriscila nel campo dedicato');
  if (!testo.trim()) throw new Error('Incollare il testo dell\'articolo del PRG/NTA da analizzare');

  const risposta = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODELLO,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SCHEMA_PROMPT },
        { role: 'user', content: testo },
      ],
    }),
  });

  if (!risposta.ok) {
    let motivo = `HTTP ${risposta.status}`;
    if (risposta.status === 401) motivo = 'API Key non valida (401)';
    if (risposta.status === 429) motivo = 'Limite di richieste raggiunto (429)';
    throw new Error(`Chiamata API Mistral fallita: ${motivo}`);
  }

  const payload = (await risposta.json()) as { choices?: { message?: { content?: string } }[] };
  const contenuto = payload.choices?.[0]?.message?.content ?? '';
  if (!contenuto) throw new Error('Risposta API Mistral priva di contenuto');

  let raw: unknown;
  try {
    raw = JSON.parse(contenuto);
  } catch {
    throw new Error('La risposta dell\'AI non è un JSON valido');
  }

  return { profilo: normalizzaProfiloPRG(raw), testoRisposta: contenuto };
}
