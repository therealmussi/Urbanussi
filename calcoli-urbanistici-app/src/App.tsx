import { useEffect, useMemo, useRef, useState } from 'react';
import { creaDatiProgettoVuoto, datiProgettoDefault, profiloPRGDefault } from './data/prgDefault';
import type { DatiProgetto, ProfiloPRG, StatoSemafori } from './types/urbanistica';
import type { UnitaDisegno } from './parsers/dxfParser';
import { calcolaTutto } from './engine/motoreUrbanistico';
import { Header } from './components/Header';
import { SchedaParametriPRG } from './components/SchedaParametriPRG';
import { SchedaDatiProgetto } from './components/SchedaDatiProgetto';
import { SchedaQuadroSinottico } from './components/SchedaQuadroSinottico';
import { SchedaRelazioneExport } from './components/SchedaRelazioneExport';
import {
  eliminaProgetto as rimuoviProgetto,
  esportaProgettoCompleto,
  importaProgettoCompleto,
  leggiBiblioteca,
  nuovoId,
  salvaProgetto,
} from './utils/persistenza';
import type { Biblioteca, ProgettoSalvato, Toast } from './utils/persistenza';
import type { IndiceTab } from './tabs';
import './App.css';

function copia<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export default function App() {
  const iniziale = useMemo(() => {
    const b = leggiBiblioteca();
    if (b.progetti.length > 0) return b;
    const id = nuovoId();
    return salvaProgetto(b, id, copia(profiloPRGDefault), creaDatiProgettoVuoto('Nuovo progetto'));
  }, []);
  const attivoIniziale = iniziale.progetti.find((p) => p.id === iniziale.attivoId) ?? iniziale.progetti[0] ?? null;

  const [biblioteca, setBiblioteca] = useState<Biblioteca>(iniziale);
  const [attivoId, setAttivoId] = useState<string | null>(attivoIniziale?.id ?? null);
  const [prg, setPrg] = useState<ProfiloPRG>(attivoIniziale?.prg ?? profiloPRGDefault);
  const [dati, setDati] = useState<DatiProgetto>(attivoIniziale?.dati ?? datiProgettoDefault);
  const [unita, setUnita] = useState<UnitaDisegno>('m');
  const [tab, setTab] = useState<IndiceTab>(2);
  const [salvatoIl, setSalvatoIl] = useState(attivoIniziale?.aggiornatoIl ?? '');
  const [toast, setToast] = useState<Toast | null>(null);

  const bibliotecaRef = useRef<Biblioteca>(iniziale);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 4000);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!attivoId) return;
    const aggiornata = salvaProgetto(bibliotecaRef.current, attivoId, prg, dati);
    bibliotecaRef.current = aggiornata;
    setBiblioteca(aggiornata);
    setSalvatoIl(aggiornata.progetti.find((p) => p.id === attivoId)?.aggiornatoIl ?? '');
  }, [prg, dati, attivoId]);

  const esito = useMemo(() => calcolaTutto(prg, dati), [prg, dati]);

  const stato: StatoSemafori = {
    conformitaUrbanistica: esito.conformeEdificabilita && esito.mixFunzionaleConforme,
    standard: esito.standard.conformeStandard,
    parcheggiL122: esito.parcheggi.conforme,
    suoloDistanze: esito.sagoma.conforme,
  };

  const mostraToast = (messaggio: string, tipo: 'ok' | 'ko' = 'ok') => setToast({ messaggio, tipo });

  const applicaProgetto = (p: ProgettoSalvato) => {
    setPrg(p.prg);
    setDati(p.dati);
    setAttivoId(p.id);
    setSalvatoIl(p.aggiornatoIl);
  };

  const selezionaProgetto = (id: string) => {
    if (id === attivoId) return;
    const trovato = biblioteca.progetti.find((p) => p.id === id);
    if (trovato) applicaProgetto(trovato);
  };

  const nuovoProgetto = () => {
    const id = nuovoId();
    setPrg(copia(profiloPRGDefault));
    setDati(creaDatiProgettoVuoto('Nuovo progetto'));
    setAttivoId(id);
    setSalvatoIl('');
    setTab(0);
    setToast({ messaggio: 'Nuovo progetto creato', tipo: 'ok' });
  };

  const duplicaProgetto = (id: string) => {
    const origine = biblioteca.progetti.find((p) => p.id === id);
    if (!origine) return;
    const copiaDati = { ...copia(origine.dati), nomeProgetto: `${origine.dati.nomeProgetto} (copia)` };
    const aggiornata = salvaProgetto(biblioteca, nuovoId(), copia(origine.prg), copiaDati);
    bibliotecaRef.current = aggiornata;
    setBiblioteca(aggiornata);
    applicaProgetto(aggiornata.progetti[aggiornata.progetti.length - 1]);
    setToast({ messaggio: `Progetto duplicato: ${copiaDati.nomeProgetto}`, tipo: 'ok' });
  };

  const eliminaProgetto = (id: string) => {
    const bersaglio = biblioteca.progetti.find((p) => p.id === id);
    const nome = bersaglio?.dati.nomeProgetto ?? 'questo progetto';
    const restanti = biblioteca.progetti.length - 1;
    const conferma = window.confirm(
      restanti === 0
        ? `Eliminare "${nome}"? È l'unico progetto: verrà ricreato uno nuovo vuoto.`
        : `Eliminare "${nome}"? L'operazione non è reversibile.`,
    );
    if (!conferma) return;
    const aggiornata = rimuoviProgetto(biblioteca, id);
    bibliotecaRef.current = aggiornata;
    setBiblioteca(aggiornata);
    if (id === attivoId) {
      const successivo = aggiornata.progetti[0] ?? null;
      if (successivo) {
        applicaProgetto(successivo);
      } else {
        const id = nuovoId();
        const nuovi = creaDatiProgettoVuoto('Nuovo progetto');
        const ripristinata = salvaProgetto(aggiornata, id, copia(profiloPRGDefault), nuovi);
        bibliotecaRef.current = ripristinata;
        setBiblioteca(ripristinata);
        setPrg(ripristinata.progetti[ripristinata.progetti.length - 1].prg);
        setDati(nuovi);
        setAttivoId(id);
        setSalvatoIl('');
      }
    }
    setToast({ messaggio: `Progetto eliminato: ${nome}`, tipo: 'ok' });
  };

  const caricaProgetto = (file: File) => {
    importaProgettoCompleto(file)
      .then(({ prg: prgImport, dati: datiImport }) => {
        const id = nuovoId();
        const aggiornata = salvaProgetto(bibliotecaRef.current, id, prgImport, datiImport);
        bibliotecaRef.current = aggiornata;
        setBiblioteca(aggiornata);
        applicaProgetto(aggiornata.progetti.find((p) => p.id === id)!);
        setTab(2);
        setToast({ messaggio: `Progetto importato: ${datiImport.nomeProgetto}`, tipo: 'ok' });
      })
      .catch((err: Error) => setToast({ messaggio: `Import progetto fallito: ${err.message}`, tipo: 'ko' }));
  };

  const esportaProgetto = () => {
    const nome = esportaProgettoCompleto(prg, dati);
    setToast({ messaggio: `Progetto esportato: ${nome}`, tipo: 'ok' });
  };

  const resetDemo = () => {
    if (dati.piani.length === 0 || window.confirm('Azzerare i dati correnti e ripristinare profilo PRG e progetto demo?')) {
      if (attivoId) {
        const aggiornata = salvaProgetto(bibliotecaRef.current, attivoId, copia(profiloPRGDefault), copia(datiProgettoDefault));
        bibliotecaRef.current = aggiornata;
        setBiblioteca(aggiornata);
        setSalvatoIl(aggiornata.progetti.find((p) => p.id === attivoId)?.aggiornatoIl ?? '');
      }
      setPrg(copia(profiloPRGDefault));
      setDati(copia(datiProgettoDefault));
      setTab(0);
      setToast({ messaggio: 'Profilo PRG e progetto demo ripristinati', tipo: 'ok' });
    }
  };

  return (
    <div className="app">
      <Header
        prgComune={prg.comune}
        prgZona={prg.zona}
        nomeProgetto={dati.nomeProgetto}
        unita={unita}
        onChangeUnita={setUnita}
        tab={tab}
        onChangeTab={setTab}
        stato={stato}
        salvatoIl={salvatoIl}
        onSalva={esportaProgetto}
        onCarica={caricaProgetto}
        onReset={resetDemo}
        progetti={biblioteca.progetti}
        attivoId={attivoId}
        onSelectProgetto={selezionaProgetto}
        onNuovoProgetto={nuovoProgetto}
        onDuplicaProgetto={attivoId ? () => duplicaProgetto(attivoId) : undefined}
        onEliminaProgetto={attivoId ? () => eliminaProgetto(attivoId) : undefined}
      />
      <main className="contenuto">
        {tab === 0 && <SchedaParametriPRG prg={prg} onChange={setPrg} />}
        {tab === 1 && <SchedaDatiProgetto dati={dati} unita={unita} onChange={setDati} />}
        {tab === 2 && <SchedaQuadroSinottico prg={prg} dati={dati} esito={esito} />}
        {tab === 3 && <SchedaRelazioneExport prg={prg} dati={dati} esito={esito} stato={stato} onMessaggio={mostraToast} />}
      </main>
      <footer className="app-footer" data-stampa>
        Calcoli secondo Regolamento Edilizio Tipo (RET) e NTA comunali — strumento di supporto preliminare agli adempimenti edilizi (CILA, SCIA, PdC); gli esiti non sostituiscono la verifica del professionista.
        <span className="firma">Sviluppato da Matteo Mussillon</span>
      </footer>
      {toast && (
        <div className={`toast toast-${toast.tipo}`} role="status">
          {toast.messaggio}
        </div>
      )}
    </div>
  );
}
