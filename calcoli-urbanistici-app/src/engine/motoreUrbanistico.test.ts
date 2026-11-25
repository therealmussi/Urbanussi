import { describe, expect, it } from 'vitest';
import { datiProgettoDefault, profiloPRGDefault } from '../data/prgDefault';
import type { DatiProgetto, ProfiloPRG } from '../types/urbanistica';
import {
  calcolaCapacitaEdificatoria,
  calcolaParcheggiPrivati,
  calcolaRigheDestinazione,
  calcolaScomputiSLP,
  calcolaSagomaEDistanze,
  calcolaStandard,
  calcolaTutto,
  controlliCoerenza,
  round,
} from './motoreUrbanistico';

const clone = (v: unknown) => JSON.parse(JSON.stringify(v)) as ProfiloPRG;
const cloneD = (v: unknown) => JSON.parse(JSON.stringify(v)) as DatiProgetto;

describe('calcolaScomputiSLP', () => {
  it('somma SLP lorda per tutti i piani e destinazioni', () => {
    const esito = calcolaScomputiSLP(profiloPRGDefault, datiProgettoDefault);
    expect(esito.slpLordaTot).toBe(2520);
  });

  it('applica il tetto del 15% alle logge e tassa l\'eccedenza', () => {
    const prg = clone(profiloPRGDefault);
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [
      {
        id: 'p1',
        nomePiano: 'P1',
        slpLorda: { residenziale: 1000, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 },
        scomputi: { murature_mq: 0, loggePorticati_mq: 300, vaniScala_mq: 0, interrati_mq: 0 },
      },
    ];
    const esito = calcolaScomputiSLP(prg, dati);
    expect(esito.tettoLoggeMq).toBeCloseTo(150, 2);
    expect(esito.scompLoggeAmmesso).toBeCloseTo(150, 2);
    expect(esito.loggeEccedentiTassate).toBeCloseTo(150, 2);
    expect(esito.slpNettaTot).toBeCloseTo(1000 - 150, 2);
  });

  it('ignora gli scomputi disattivati nelle regole del PRG', () => {
    const prg = clone(profiloPRGDefault);
    prg.regoleScomputoSLP.scomputaMuraturePerimetrali = false;
    prg.regoleScomputoSLP.scomputaVaniScalaAscensore = false;
    prg.regoleScomputoSLP.scomputaInterrati = false;
    const dati = cloneD(datiProgettoDefault);
    const esito = calcolaScomputiSLP(prg, dati);
    expect(esito.scompMuri).toBe(0);
    expect(esito.scompScale).toBe(0);
    expect(esito.scompInterrati).toBe(0);
    expect(esito.slpNettaTot).toBe(2520 - 150);
  });

  it('non produce SLP netta negativa se gli scomputi superano la SLP lorda', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani[0].scomputi.murature_mq = 9999;
    const esito = calcolaScomputiSLP(profiloPRGDefault, dati);
    expect(esito.slpNettaTot).toBe(0);
  });
});

describe('calcolaRigheDestinazione', () => {
  it('ripartisce gli scomputi proporzionalmente alla SLP lorda', () => {
    const prg = clone(profiloPRGDefault);
    prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP = 100;
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [
      {
        id: 'p1',
        nomePiano: 'P1',
        slpLorda: { residenziale: 800, commerciale: 200, direzionale: 0, produttivo: 0, turistico: 0 },
        scomputi: { murature_mq: 100, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
      },
    ];
    const esito = calcolaScomputiSLP(prg, dati);
    const righe = calcolaRigheDestinazione(prg, dati, esito);
    const res = righe.find((r) => r.destinazione === 'residenziale')!;
    const comm = righe.find((r) => r.destinazione === 'commerciale')!;
    expect(res.scomputiProporzionali).toBeCloseTo(80, 2);
    expect(comm.scomputiProporzionali).toBeCloseTo(20, 2);
    expect(res.slpNetta).toBeCloseTo(720, 2);
    expect(comm.slpNetta).toBeCloseTo(180, 2);
    expect(res.slpNetta + comm.slpNetta).toBeCloseTo(esito.slpNettaTot, 2);
  });

  it('calcola la quota percentuale del mix funzionale', () => {
    const prg = clone(profiloPRGDefault);
    prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP = 100;
    prg.regoleScomputoSLP.scomputaMuraturePerimetrali = false;
    prg.regoleScomputoSLP.scomputaVaniScalaAscensore = false;
    prg.regoleScomputoSLP.scomputaInterrati = false;
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [
      {
        id: 'p1',
        nomePiano: 'P1',
        slpLorda: { residenziale: 800, commerciale: 200, direzionale: 0, produttivo: 0, turistico: 0 },
        scomputi: { murature_mq: 0, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
      },
    ];
    const esito = calcolaScomputiSLP(prg, dati);
    const righe = calcolaRigheDestinazione(prg, dati, esito);
    const res = righe.find((r) => r.destinazione === 'residenziale')!;
    expect(res.quotaPerc).toBeCloseTo(80, 2);
  });

  it('gestisce SLP lorda totale zero senza divisioni per zero', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [];
    const esito = calcolaScomputiSLP(profiloPRGDefault, dati);
    const righe = calcolaRigheDestinazione(profiloPRGDefault, dati, esito);
    expect(esito.slpLordaTot).toBe(0);
    expect(righe.every((r) => r.quotaPerc === 0)).toBe(true);
  });
});

describe('calcolaCapacitaEdificatoria', () => {
  it('usa Uf per la SLP massima e deriva il volume con l\'altezza virtuale', () => {
    const prg = clone(profiloPRGDefault);
    prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If = null;
    const cap = calcolaCapacitaEdificatoria(prg, cloneD(datiProgettoDefault), 2000);
    expect(cap.slpMax).toBeCloseTo(2500 * 2.5, 6);
    expect(cap.vMax).toBeCloseTo(2500 * 2.5 * 3, 6);
    expect(cap.vDerivatoDa).toBe('SLP');
    expect(cap.slpResidua).toBeCloseTo(4250, 6);
  });

  it('deriva la SLP massima dal volume quando manca Uf/Ut', () => {
    const prg = clone(profiloPRGDefault);
    prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf = null;
    prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut = null;
    prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If = 2.5;
    const cap = calcolaCapacitaEdificatoria(prg, cloneD(datiProgettoDefault), 2000);
    expect(cap.vMax).toBeCloseTo(6250, 6);
    expect(cap.slpMax).toBeCloseTo(6250 / 3, 6);
    expect(cap.vDerivatoDa).toBe('If');
  });

  it('usa Ut quando Uf non è valorizzato', () => {
    const prg = clone(profiloPRGDefault);
    prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf = null;
    prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut = 1.0;
    const cap = calcolaCapacitaEdificatoria(prg, cloneD(datiProgettoDefault), 0);
    expect(cap.slpMax).toBeCloseTo(5000, 6);
    expect(cap.slpDerivataDa).toBe('Ut');
  });

  it('ritorna null quando nessun indice è valorizzato', () => {
    const prg = clone(profiloPRGDefault);
    prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf = null;
    prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut = null;
    prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If = null;
    prg.parametriEdificatori.indiceFabbricabilitaTerritoriale_It = null;
    const cap = calcolaCapacitaEdificatoria(prg, cloneD(datiProgettoDefault), 100);
    expect(cap.slpMax).toBeNull();
    expect(cap.vMax).toBeNull();
  });
});

describe('calcolaStandard', () => {
  it('calcola abitanti teorici e fabbisogno D.M. 1444/68 per il progetto demo', () => {
    const prg = clone(profiloPRGDefault);
    prg.regoleScomputoSLP.scomputaMuraturePerimetrali = false;
    prg.regoleScomputoSLP.scomputaVaniScalaAscensore = false;
    prg.regoleScomputoSLP.scomputaInterrati = false;
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [
      {
        id: 'p1',
        nomePiano: 'P1',
        slpLorda: { residenziale: 700, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 },
        scomputi: { murature_mq: 0, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
      },
    ];
    const esito = calcolaScomputiSLP(prg, dati);
    const righe = calcolaRigheDestinazione(prg, dati, esito);
    const standard = calcolaStandard(prg, righe, dati);
    expect(standard.abitantiTeoriciTot).toBeCloseTo(700 / 35, 2);
    expect(standard.fabbisognoVerdeServiziTot).toBeCloseTo(20 * 18 * 0.5, 2);
    expect(standard.fabbisognoParkPubbliciTot).toBeCloseTo(20 * 18 * 0.5, 2);
  });

  it('calcola il deficit e la monetizzazione quando le cessioni sono insufficienti', () => {
    const prg = clone(profiloPRGDefault);
    const dati = cloneD(datiProgettoDefault);
    dati.standardReperitiInCessione = { verde_mq: 0, servizi_mq: 0, parcheggiPubblici_mq: 0 };
    const esito = calcolaScomputiSLP(prg, dati);
    const righe = calcolaRigheDestinazione(prg, dati, esito);
    const standard = calcolaStandard(prg, righe, dati);
    expect(standard.conformeStandard).toBe(false);
    expect(standard.importoMonetizzazioneTot).toBeGreaterThan(0);
  });

  it('segnala NON CONFORME senza monetizzazione quando la destinazione non la ammette', () => {
    const prg = clone(profiloPRGDefault);
    prg.destinazioni.residenziale.monetizzazioneAmmessa = false;
    const dati = cloneD(datiProgettoDefault);
    dati.standardReperitiInCessione = { verde_mq: 0, servizi_mq: 0, parcheggiPubblici_mq: 0 };
    const esito = calcolaScomputiSLP(prg, dati);
    const righe = calcolaRigheDestinazione(prg, dati, esito);
    const standard = calcolaStandard(prg, righe, dati);
    expect(standard.importoMonetizzazioneTot).toBe(0);
    expect(standard.conformeStandard).toBe(false);
  });
});

describe('calcolaParcheggiPrivati', () => {
  it('applica L. 122/89 pari a 1 mq ogni 10 mc di volume', () => {
    const prg = clone(profiloPRGDefault);
    const dati = cloneD(datiProgettoDefault);
    const esito = calcolaParcheggiPrivati(prg, dati, 6210, 0);
    expect(esito.fabbisognoL122_mq).toBeCloseTo(621, 2);
    expect(esito.totaleProgettoPrivati_mq).toBe(900);
    expect(esito.conforme).toBe(true);
  });

  it('verifica la percentuale massima di manovra', () => {
    const prg = clone(profiloPRGDefault);
    const dati = cloneD(datiProgettoDefault);
    dati.parcheggiPrivatiProgetto = { stalli_mq: 300, manovra_mq: 700 };
    const esito = calcolaParcheggiPrivati(prg, dati, 6210, 0);
    expect(esito.percManovraReale).toBeCloseTo(70, 2);
    expect(esito.conforme).toBe(false);
  });

  it('ritorna percManovraReale 0 con parcheggi vuoti', () => {
    const prg = clone(profiloPRGDefault);
    const dati = cloneD(datiProgettoDefault);
    dati.parcheggiPrivatiProgetto = { stalli_mq: 0, manovra_mq: 0 };
    const esito = calcolaParcheggiPrivati(prg, dati, 6210, 0);
    expect(esito.percManovraReale).toBe(0);
    expect(esito.conforme).toBe(false);
  });
});

describe('calcolaSagomaEDistanze', () => {
  it('calcola Rc e permeabilità ponderata sul progetto demo', () => {
    const sagoma = calcolaSagomaEDistanze(profiloPRGDefault, cloneD(datiProgettoDefault));
    expect(sagoma.rapportoCopertura_perc).toBeCloseTo(34, 2);
    expect(sagoma.superficiePonderataPermeabile_mq).toBeCloseTo(1250, 2);
    expect(sagoma.indicePermeabilita_perc).toBeCloseTo(50, 2);
    expect(sagoma.conforme).toBe(true);
  });

  it('gestisce Sf = 0 senza divisioni per zero', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.superficieFondiaria_Sf = 0;
    const sagoma = calcolaSagomaEDistanze(profiloPRGDefault, dati);
    expect(sagoma.rapportoCopertura_perc).toBe(0);
    expect(sagoma.indicePermeabilita_perc).toBe(0);
    expect(sagoma.conforme).toBe(false);
  });
});

describe('calcolaTutto', () => {
  it('produce un quadro completo conforme per il progetto demo', () => {
    const esito = calcolaTutto(profiloPRGDefault, cloneD(datiProgettoDefault));
    expect(esito.slpLordaTot).toBe(2520);
    expect(esito.slpNettaTot).toBeCloseTo(2070, 0);
    expect(esito.volumeProgetto_mc).toBeCloseTo(6210, 0);
    expect(esito.conformeGlobale).toBe(true);
  });

  it('gestisce progetto vuoto senza errori', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [];
    dati.superficiPermeabili = [];
    dati.superficieFondiaria_Sf = 0;
    dati.superficieTerritoriale_St = 0;
    const esito = calcolaTutto(profiloPRGDefault, dati);
    expect(Number.isFinite(esito.slpNettaTot)).toBe(true);
    expect(Number.isFinite(esito.volumeProgetto_mc)).toBe(true);
    expect(esito.conformeGlobale).toBe(false);
  });

  it('segnala non conformità quando la SLP supera la capienza del lotto', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani.push({
      id: 'extra',
      nomePiano: 'P3',
      slpLorda: { residenziale: 5000, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 },
      scomputi: { murature_mq: 0, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
    });
    const esito = calcolaTutto(profiloPRGDefault, dati);
    expect(esito.conformeGlobale).toBe(false);
    expect(esito.dettagliEdificabilita.every((v) => v.conforme)).toBe(false);
  });
});

describe('controlliCoerenza', () => {
  it('non segnala nulla sul progetto demo completo', () => {
    expect(controlliCoerenza(cloneD(datiProgettoDefault))).toEqual([]);
  });

  it('segnala input incoerenti o mancanti', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [];
    dati.superficieCoperta_Sc = 3000;
    dati.sagomaEDistanze.altezzaProgetto_m = 0;
    const avvisi = controlliCoerenza(dati);
    expect(avvisi.some((a) => a.includes('coperta supera'))).toBe(true);
    expect(avvisi.some((a) => a.includes('Nessun piano'))).toBe(true);
    expect(avvisi.some((a) => a.includes('Altezza'))).toBe(true);
  });

  it('il risultato di calcolaTutto include gli avvisi', () => {
    const esito = calcolaTutto(profiloPRGDefault, cloneD(datiProgettoDefault));
    expect(esito.avvisiCoerenza).toMatchObject([]);
    const vuoto = cloneD(datiProgettoDefault);
    vuoto.piani = [];
    vuoto.parcheggiPrivatiProgetto = { stalli_mq: 0, manovra_mq: 0 };
    expect(calcolaTutto(profiloPRGDefault, vuoto).avvisiCoerenza.length).toBeGreaterThan(0);
  });
});

describe('round', () => {
  it('arrotonda correttamente', () => {
    expect(round(1.005, 2)).toBe(1.01);
    expect(round(0.1 + 0.2, 6)).toBe(0.3);
  });
});

describe('valori negativi e scomputi anomali', () => {
  it('ignora SLP negative e scomputi negativi', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani = [
      {
        id: 'p1',
        nomePiano: 'P1',
        slpLorda: { residenziale: -500, commerciale: 400, direzionale: 0, produttivo: 0, turistico: 0 },
        scomputi: { murature_mq: -100, loggePorticati_mq: -50, vaniScala_mq: 0, interrati_mq: 0 },
      },
    ];
    dati.superficiPermeabili = [{ descrizione: 'x', area_mq: -100, coefficiente_0_1: 0.5 }];
    dati.parcheggiPrivatiProgetto = { stalli_mq: -10, manovra_mq: -5 };
    const esito = calcolaTutto(profiloPRGDefault, dati);
    expect(esito.slpLordaTot).toBe(400);
    expect(esito.scompMuri).toBe(0);
    expect(esito.sagoma.superficiePonderataPermeabile_mq).toBeGreaterThanOrEqual(0);
    expect(esito.parcheggi.totaleProgettoPrivati_mq).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(esito.volumeProgetto_mc)).toBe(true);
  });

  it('gestisce scomputi molto maggiori della SLP lorda senza NaN', () => {
    const dati = cloneD(datiProgettoDefault);
    dati.piani.forEach((p) => { p.scomputi.murature_mq = 99999; });
    const esito = calcolaTutto(profiloPRGDefault, dati);
    expect(esito.slpNettaTot).toBe(0);
    expect(esito.volumeProgetto_mc).toBe(0);
    expect(Number.isFinite(esito.standard.abitantiTeoriciTot)).toBe(true);
  });
});
