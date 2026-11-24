import type {
  CapacitaEdificatoria,
  DestinazioneUso,
  DatiProgetto,
  ProfiloPRG,
  RisultatoCalcolo,
  RisultatoParcheggi,
  RisultatoSagoma,
  RisultatoStandard,
  RigaDestinazione,
  RigaStandard,
  Verifica,
} from '../types/urbanistica';
import { DESTINAZIONI, LABEL_DESTINAZIONI } from '../types/urbanistica';

export const EPSILON = 1e-9;

export function isValorizzato(v: number | null | undefined): boolean {
  return v !== null && v !== undefined && Number.isFinite(v);
}

export function round(v: number, decimals = 2): number {
  const f = Math.pow(10, decimals);
  return Math.round((v + Number.EPSILON) * f) / f;
}

function emptyRecord(): Record<DestinazioneUso, number> {
  return { residenziale: 0, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 };
}

/** Capacità edificatoria massima (SLP_max e V_max) con derivazione dell'indice mancante. */
export function calcolaCapacitaEdificatoria(
  prg: ProfiloPRG,
  dati: DatiProgetto,
  slpNettaTot: number,
): CapacitaEdificatoria {
  const p = prg.parametriEdificatori;
  const hVirtuale = p.altezzaVirtualeConversione_m > EPSILON ? p.altezzaVirtualeConversione_m : 3;

  let slpMax: number | null = null;
  let slpDerivataDa: 'Uf' | 'Ut' | null = null;
  if (isValorizzato(p.indiceUtilizzazioneFondiaria_Uf) && dati.superficieFondiaria_Sf > EPSILON) {
    slpMax = dati.superficieFondiaria_Sf * (p.indiceUtilizzazioneFondiaria_Uf as number);
    slpDerivataDa = 'Uf';
  } else if (isValorizzato(p.indiceUtilizzazioneTerritoriale_Ut) && dati.superficieTerritoriale_St > EPSILON) {
    slpMax = dati.superficieTerritoriale_St * (p.indiceUtilizzazioneTerritoriale_Ut as number);
    slpDerivataDa = 'Ut';
  }

  let vMax: number | null = null;
  let vDerivatoDa: 'If' | 'It' | 'SLP' | null = null;
  if (isValorizzato(p.indiceFabbricabilitaFondiaria_If) && dati.superficieFondiaria_Sf > EPSILON) {
    vMax = dati.superficieFondiaria_Sf * (p.indiceFabbricabilitaFondiaria_If as number);
    vDerivatoDa = 'If';
  } else if (isValorizzato(p.indiceFabbricabilitaTerritoriale_It) && dati.superficieTerritoriale_St > EPSILON) {
    vMax = dati.superficieTerritoriale_St * (p.indiceFabbricabilitaTerritoriale_It as number);
    vDerivatoDa = 'It';
  }

  if (slpMax === null && vMax !== null) {
    slpMax = vMax / hVirtuale;
  }
  if (vMax === null && slpMax !== null) {
    vMax = slpMax * hVirtuale;
    vDerivatoDa = 'SLP';
  }

  const slpResidua = slpMax === null ? null : slpMax - slpNettaTot;
  const volumeResiduo = vMax === null ? null : vMax - slpNettaTot * hVirtuale;

  return { slpMax, vMax, slpDerivataDa, vDerivatoDa, slpResidua, volumeResiduo };
}

export interface EsitoScomputiSLP {
  slpLordaTot: number;
  scompMuri: number;
  scompScale: number;
  scompInterrati: number;
  tettoLoggeMq: number;
  scompLoggeAmmesso: number;
  loggeEccedentiTassate: number;
  totaleScomputi: number;
  slpNettaTot: number;
}

export function calcolaScomputiSLP(prg: ProfiloPRG, dati: DatiProgetto): EsitoScomputiSLP {
  let slpLordaTot = 0;
  let sommaMurature = 0;
  let sommaLogge = 0;
  let sommaScale = 0;
  let sommaInterrati = 0;

  for (const piano of dati.piani) {
    for (const d of DESTINAZIONI) {
      slpLordaTot += piano.slpLorda[d] ?? 0;
    }
    sommaMurature += piano.scomputi.murature_mq ?? 0;
    sommaLogge += piano.scomputi.loggePorticati_mq ?? 0;
    sommaScale += piano.scomputi.vaniScala_mq ?? 0;
    sommaInterrati += piano.scomputi.interrati_mq ?? 0;
  }

  const regole = prg.regoleScomputoSLP;
  const scompMuri = regole.scomputaMuraturePerimetrali ? sommaMurature : 0;
  const scompScale = regole.scomputaVaniScalaAscensore ? sommaScale : 0;
  const scompInterrati = regole.scomputaInterrati ? sommaInterrati : 0;

  const tettoLoggeMq = slpLordaTot * (regole.tettoMaxLoggePorticati_percSLP / 100);
  const scompLoggeAmmesso = Math.min(sommaLogge, tettoLoggeMq);
  const loggeEccedentiTassate = Math.max(0, sommaLogge - tettoLoggeMq);

  const totaleScomputi = scompMuri + scompScale + scompInterrati + scompLoggeAmmesso;
  const slpNettaTot = Math.max(0, slpLordaTot - totaleScomputi);

  return {
    slpLordaTot,
    scompMuri,
    scompScale,
    scompInterrati,
    tettoLoggeMq,
    scompLoggeAmmesso,
    loggeEccedentiTassate,
    totaleScomputi,
    slpNettaTot,
  };
}

/** SLP Netta Differenziata per Destinazione: scomputi ripartiti proporzionalmente in base alla SLP lorda. */
export function calcolaRigheDestinazione(
  prg: ProfiloPRG,
  dati: DatiProgetto,
  esito: EsitoScomputiSLP,
): RigaDestinazione[] {
  const slpLordaPerDest = emptyRecord();
  for (const piano of dati.piani) {
    for (const d of DESTINAZIONI) {
      slpLordaPerDest[d] += piano.slpLorda[d] ?? 0;
    }
  }

  const scomputiRipartibili = esito.scompMuri + esito.scompScale + esito.scompInterrati + esito.scompLoggeAmmesso;

  return DESTINAZIONI.map((dest) => {
    const slpLorda = slpLordaPerDest[dest];
    const peso = esito.slpLordaTot > EPSILON ? slpLorda / esito.slpLordaTot : 0;
    const scomputiProporzionali = peso * scomputiRipartibili;
    const slpNetta = Math.max(0, slpLorda - scomputiProporzionali);
    const quotaPerc = esito.slpNettaTot > EPSILON ? (slpNetta / esito.slpNettaTot) * 100 : 0;
    const regola = prg.destinazioni[dest];
    const conforme = slpNetta <= EPSILON || (regola.ammessa && quotaPerc >= regola.quotaMin_perc - EPSILON && quotaPerc <= regola.quotaMax_perc + EPSILON);
    return {
      destinazione: dest,
      slpLorda: round(slpLorda),
      scomputiTotali: round(peso * esito.totaleScomputi),
      scomputiProporzionali: round(scomputiProporzionali),
      loggeEccedentiTassate: round(peso * esito.loggeEccedentiTassate),
      slpNetta: round(slpNetta),
      quotaPerc: round(quotaPerc),
      ammessa: regola.ammessa,
      conformeMix: conforme,
    };
  });
}

export function calcolaStandard(
  prg: ProfiloPRG,
  righe: RigaDestinazione[],
  dati: DatiProgetto,
): RisultatoStandard {
  const righeStandard: RigaStandard[] = [];
  let fabbisognoParkPubbliciTot = 0;
  let fabbisognoVerdeServiziTot = 0;
  let abitantiTeoriciTot = 0;
  let importoMonetizzazioneTot = 0;
  let monetizzazionePossibile = true;

  for (const riga of righe) {
    if (riga.slpNetta <= EPSILON) continue;
    const regola = prg.destinazioni[riga.destinazione];

    let fabbisognoTotale: number;
    let abitanti = 0;
    if (riga.destinazione === 'residenziale') {
      const mqPerAb = regola.parametroAbitantiTeorici_mqSlpPerAb > EPSILON
        ? regola.parametroAbitantiTeorici_mqSlpPerAb
        : 35;
      abitanti = riga.slpNetta / mqPerAb;
      abitantiTeoriciTot += abitanti;
      fabbisognoTotale = abitanti * regola.standardMin_mqPerAb;
    } else {
      fabbisognoTotale = riga.slpNetta * (regola.standardMin_percSLP / 100);
    }

    const fabbPark = fabbisognoTotale * (regola.quotaParcheggiPubbliciSuStandard_perc / 100);
    const fabbVerde = fabbisognoTotale * (regola.quotaVerdeServiziSuStandard_perc / 100);
    fabbisognoParkPubbliciTot += fabbPark;
    fabbisognoVerdeServiziTot += fabbVerde;

    if (!regola.monetizzazioneAmmessa) monetizzazionePossibile = false;

    righeStandard.push({
      destinazione: riga.destinazione,
      abitantiTeorici: round(abitanti),
      fabbisognoTotale_mq: round(fabbisognoTotale),
      fabbisognoParcheggiPubblici_mq: round(fabbPark),
      fabbisognoVerdeServizi_mq: round(fabbVerde),
      monetizzazioneAmmessa: regola.monetizzazioneAmmessa,
      tariffa_euroMq: regola.tariffaMonetizzazione_euroMq,
    });
  }

  const cedutoParkPubblici = dati.standardReperitiInCessione.parcheggiPubblici_mq ?? 0;
  const cedutoVerdeServizi = (dati.standardReperitiInCessione.verde_mq ?? 0) + (dati.standardReperitiInCessione.servizi_mq ?? 0);
  const deficitParkPubblici = Math.max(0, fabbisognoParkPubbliciTot - cedutoParkPubblici);
  const deficitVerdeServizi = Math.max(0, fabbisognoVerdeServiziTot - cedutoVerdeServizi);

  const dettagli: Verifica[] = [];
  const conformePark = deficitParkPubblici <= EPSILON;
  const conformeVerde = deficitVerdeServizi <= EPSILON;

  if (deficitParkPubblici > EPSILON || deficitVerdeServizi > EPSILON) {
    const tariffe = righeStandard.filter((r) => r.monetizzazioneAmmessa);
    const pesoTariffe = tariffe.reduce((acc, r) => acc + r.tariffa_euroMq, 0);
    const tariffaMedia = tariffe.length > 0 ? pesoTariffe / tariffe.length : 0;
    if (monetizzazionePossibile && tariffaMedia > EPSILON) {
      importoMonetizzazioneTot = (deficitParkPubblici + deficitVerdeServizi) * tariffaMedia;
    }
  }

  dettagli.push({
    etichetta: 'Parcheggi pubblici (standard D.M. 1444/68)',
    richiesto: round(fabbisognoParkPubbliciTot),
    previsto: round(cedutoParkPubblici),
    unitaMisura: 'mq',
    conforme: conformePark,
    dettaglio: conformePark
      ? 'Standard parcheggi pubblici soddisfatto dalle cessioni'
      : `Deficit di ${round(deficitParkPubblici)} mq`,
  });
  dettagli.push({
    etichetta: 'Verde e servizi (standard D.M. 1444/68)',
    richiesto: round(fabbisognoVerdeServiziTot),
    previsto: round(cedutoVerdeServizi),
    unitaMisura: 'mq',
    conforme: conformeVerde,
    dettaglio: conformeVerde
      ? 'Standard verde/servizi soddisfatto dalle cessioni'
      : `Deficit di ${round(deficitVerdeServizi)} mq`,
  });

  const conformeStandard = conformePark && conformeVerde;

  return {
    righe: righeStandard,
    abitantiTeoriciTot: round(abitantiTeoriciTot),
    fabbisognoParkPubbliciTot: round(fabbisognoParkPubbliciTot),
    fabbisognoVerdeServiziTot: round(fabbisognoVerdeServiziTot),
    cedutoParkPubblici_mq: round(cedutoParkPubblici),
    cedutoVerdeServizi_mq: round(cedutoVerdeServizi),
    deficitParkPubblici: round(deficitParkPubblici),
    deficitVerdeServizi: round(deficitVerdeServizi),
    importoMonetizzazioneTot: round(importoMonetizzazioneTot, 2),
    conformeStandard,
    dettagli,
  };
}

export function calcolaParcheggiPrivati(prg: ProfiloPRG, dati: DatiProgetto, volumeProgetto: number, slpNettaCommerciale: number): RisultatoParcheggi {
  const p = prg.parcheggiPrivati;
  const fabbisognoL122 = volumeProgetto * p.rapportoLegge122_89_mqOgniMc;
  const extraComm = slpNettaCommerciale * (p.dotazioneAggiuntivaCommerciale_percSLP / 100);
  const fabbisognoTotalePrivati = fabbisognoL122 + extraComm;

  const stalli = dati.parcheggiPrivatiProgetto.stalli_mq ?? 0;
  const manovra = dati.parcheggiPrivatiProgetto.manovra_mq ?? 0;
  const totaleProgettoPrivati = stalli + manovra;
  const percManovraReale = totaleProgettoPrivati > EPSILON ? (manovra / totaleProgettoPrivati) * 100 : 0;

  const conforme = totaleProgettoPrivati >= fabbisognoTotalePrivati - EPSILON
    && percManovraReale <= p.maxSuperficieManovra_percTotale + EPSILON;

  return {
    volumeProgetto_mc: round(volumeProgetto),
    fabbisognoL122_mq: round(fabbisognoL122),
    extraCommerciale_mq: round(extraComm),
    fabbisognoTotalePrivati_mq: round(fabbisognoTotalePrivati),
    stalliProgetto_mq: round(stalli),
    manovraProgetto_mq: round(manovra),
    totaleProgettoPrivati_mq: round(totaleProgettoPrivati),
    percManovraReale: round(percManovraReale),
    percManovraMax: p.maxSuperficieManovra_percTotale,
    conforme,
  };
}

export function calcolaSagomaEDistanze(prg: ProfiloPRG, dati: DatiProgetto): RisultatoSagoma {
  const p = prg.parametriEdificatori;
  const sf = dati.superficieFondiaria_Sf;
  const rapportoCopertura = sf > EPSILON ? (dati.superficieCoperta_Sc / sf) * 100 : 0;

  let superficiePonderata = 0;
  for (const sp of dati.superficiPermeabili) {
    superficiePonderata += sp.area_mq * sp.coefficiente_0_1;
  }
  const indicePermeabilita = sf > EPSILON ? (superficiePonderata / sf) * 100 : 0;

  const sag = dati.sagomaEDistanze;

  const verifiche: Verifica[] = [
    {
      etichetta: 'Rapporto di copertura (Rc)',
      richiesto: round(rapportoCopertura),
      previsto: p.rapportoCoperturaMax_perc,
      unitaMisura: '%',
      conforme: rapportoCopertura <= p.rapportoCoperturaMax_perc + EPSILON,
      dettaglio: `Rc = ${round(rapportoCopertura)}% (max ${p.rapportoCoperturaMax_perc}%)`,
    },
    {
      etichetta: 'Indice di permeabilità (Ip)',
      richiesto: p.indicePermeabilitaMin_perc,
      previsto: round(indicePermeabilita),
      unitaMisura: '%',
      conforme: indicePermeabilita >= p.indicePermeabilitaMin_perc - EPSILON,
      dettaglio: `IS ponderata = ${round(superficiePonderata)} mq su ${round(sf)} mq`,
    },
    {
      etichetta: 'Altezza massima',
      richiesto: p.altezzaMax_m,
      previsto: sag.altezzaProgetto_m,
      unitaMisura: 'm',
      conforme: sag.altezzaProgetto_m <= p.altezzaMax_m + EPSILON,
      dettaglio: `H progetto = ${sag.altezzaProgetto_m} m (max ${p.altezzaMax_m} m)`,
    },
    {
      etichetta: 'Distanza dai confini',
      richiesto: p.distanzaMinConfini_m,
      previsto: sag.distanzaConfini_m,
      unitaMisura: 'm',
      conforme: sag.distanzaConfini_m >= p.distanzaMinConfini_m - EPSILON,
      dettaglio: `Dc = ${sag.distanzaConfini_m} m (min ${p.distanzaMinConfini_m} m)`,
    },
    {
      etichetta: 'Distanza tra fabbricati',
      richiesto: p.distanzaMinFabbricati_m,
      previsto: sag.distanzaFabbricati_m,
      unitaMisura: 'm',
      conforme: sag.distanzaFabbricati_m >= p.distanzaMinFabbricati_m - EPSILON,
      dettaglio: `Df = ${sag.distanzaFabbricati_m} m (min ${p.distanzaMinFabbricati_m} m)`,
    },
    {
      etichetta: 'Distanza dalle strade',
      richiesto: p.distanzaMinStrade_m,
      previsto: sag.distanzaStrade_m,
      unitaMisura: 'm',
      conforme: sag.distanzaStrade_m >= p.distanzaMinStrade_m - EPSILON,
      dettaglio: `Ds = ${sag.distanzaStrade_m} m (min ${p.distanzaMinStrade_m} m)`,
    },
  ];

  return {
    rapportoCopertura_perc: round(rapportoCopertura),
    indicePermeabilita_perc: round(indicePermeabilita),
    superficiePonderataPermeabile_mq: round(superficiePonderata),
    verifiche,
    conforme: verifiche.every((v) => v.conforme),
  };
}

export function calcolaTutto(prg: ProfiloPRG, dati: DatiProgetto): RisultatoCalcolo {
  const esito = calcolaScomputiSLP(prg, dati);
  const righeDestinazioni = calcolaRigheDestinazione(prg, dati, esito);

  const capacitaEdificatoria = calcolaCapacitaEdificatoria(prg, dati, esito.slpNettaTot);
  const volumeProgetto = esito.slpNettaTot * prg.parametriEdificatori.altezzaVirtualeConversione_m;

  const dettagliEdificabilita: Verifica[] = [];
  let conformeEdificabilita = true;

  if (capacitaEdificatoria.slpMax !== null) {
    const conforme = esito.slpNettaTot <= capacitaEdificatoria.slpMax + EPSILON;
    dettagliEdificabilita.push({
      etichetta: 'SLP netta vs SLP massima',
      richiesto: round(capacitaEdificatoria.slpMax),
      previsto: round(esito.slpNettaTot),
      unitaMisura: 'mq',
      conforme,
      dettaglio: conforme
        ? `Residuo edificabile: ${round(capacitaEdificatoria.slpResidua ?? 0)} mq SLP`
        : `Eccedenza di ${round(esito.slpNettaTot - capacitaEdificatoria.slpMax)} mq SLP`,
    });
    conformeEdificabilita = conformeEdificabilita && conforme;
  }
  if (capacitaEdificatoria.vMax !== null) {
    const conforme = volumeProgetto <= capacitaEdificatoria.vMax + EPSILON;
    dettagliEdificabilita.push({
      etichetta: 'Volume progettuale vs Volume massimo',
      richiesto: round(capacitaEdificatoria.vMax),
      previsto: round(volumeProgetto),
      unitaMisura: 'mc',
      conforme,
      dettaglio: conforme
        ? `Residuo volumetrico: ${round(capacitaEdificatoria.volumeResiduo ?? 0)} mc`
        : `Eccedenza di ${round(volumeProgetto - capacitaEdificatoria.vMax)} mc`,
    });
    conformeEdificabilita = conformeEdificabilita && conforme;
  }
  if (dettagliEdificabilita.length === 0) {
    dettagliEdificabilita.push({
      etichetta: 'Capacità edificatoria',
      richiesto: 0,
      previsto: 0,
      unitaMisura: '',
      conforme: false,
      dettaglio: 'Nessun indice di utilizzazione/fabbricabilità valorizzato nel PRG: verifica non effettuabile',
    });
    conformeEdificabilita = false;
  }

  const dettagliMix: Verifica[] = righeDestinazioni
    .filter((r) => r.slpNetta > EPSILON)
    .map((r) => ({
      etichetta: `Mix funzionale - ${LABEL_DESTINAZIONI[r.destinazione]}`,
      richiesto: r.quotaMax_perc,
      previsto: r.quotaPerc,
      unitaMisura: '%',
      conforme: r.conformeMix,
      dettaglio: r.conformeMix
        ? `Quota ${round(r.quotaPerc)}% (consentita ${r.quotaMin_perc}–${r.quotaMax_perc}%)`
        : r.ammessa
          ? `Quota ${round(r.quotaPerc)}% fuori dal range ${r.quotaMin_perc}–${r.quotaMax_perc}%`
          : `Destinazione non ammessa in zona ${prg.zona}`,
    }));
  const mixFunzionaleConforme = dettagliMix.every((v) => v.conforme) || dettagliMix.length === 0;

  const standard = calcolaStandard(prg, righeDestinazioni, dati);
  const parcheggi = calcolaParcheggiPrivati(prg, dati, volumeProgetto, righeDestinazioni.find((r) => r.destinazione === 'commerciale')?.slpNetta ?? 0);
  const sagoma = calcolaSagomaEDistanze(prg, dati);

  return {
    capacitaEdificatoria,
    slpLordaTot: round(esito.slpLordaTot),
    slpNettaTot: round(esito.slpNettaTot),
    scompMuri: round(esito.scompMuri),
    scompScale: round(esito.scompScale),
    scompInterrati: round(esito.scompInterrati),
    tettoLoggeMq: round(esito.tettoLoggeMq),
    scompLoggeAmmesso: round(esito.scompLoggeAmmesso),
    loggeEccedentiTassate: round(esito.loggeEccedentiTassate),
    volumeProgetto_mc: round(volumeProgetto),
    righeDestinazioni,
    conformeEdificabilita,
    dettagliEdificabilita,
    mixFunzionaleConforme,
    dettagliMix,
    standard,
    parcheggi,
    sagoma,
    conformeGlobale:
      conformeEdificabilita
      && mixFunzionaleConforme
      && standard.conformeStandard
      && parcheggi.conforme
      && sagoma.conforme,
  };
}
