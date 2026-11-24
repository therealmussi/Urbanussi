import { useEffect, useMemo, useState } from 'react';
import { datiProgettoDefault, profiloPRGDefault } from './data/prgDefault';
import type { DatiProgetto, ProfiloPRG, StatoSemafori } from './types/urbanistica';
import type { UnitaDisegno } from './parsers/dxfParser';
import { calcolaTutto } from './engine/motoreUrbanistico';
import { Header } from './components/Header';
import { SchedaParametriPRG } from './components/SchedaParametriPRG';
import { SchedaDatiProgetto } from './components/SchedaDatiProgetto';
import { SchedaQuadroSinottico } from './components/SchedaQuadroSinottico';
import { SchedaRelazioneExport } from './components/SchedaRelazioneExport';
import { azzeraStato, esportaProgettoCompleto, importaProgettoCompleto, leggiStato, salvaStato } from './utils/persistenza';
import type { IndiceTab } from './tabs';
import './App.css';

export default function App() {
  const iniziale = useMemo(() => leggiStato(), []);
  const [prg, setPrg] = useState<ProfiloPRG>(iniziale?.prg ?? profiloPRGDefault);
  const [dati, setDati] = useState<DatiProgetto>(iniziale?.dati ?? datiProgettoDefault);
  const [unita, setUnita] = useState<UnitaDisegno>('m');
  const [tab, setTab] = useState<IndiceTab>(2);
  const [salvatoIl, setSalvatoIl] = useState(iniziale?.salvatoIl ?? '');

  useEffect(() => {
    setSalvatoIl(salvaStato(prg, dati));
  }, [prg, dati]);

  const esito = useMemo(() => calcolaTutto(prg, dati), [prg, dati]);

  const stato: StatoSemafori = {
    conformitaUrbanistica: esito.conformeEdificabilita && esito.mixFunzionaleConforme,
    standard: esito.standard.conformeStandard,
    parcheggiL122: esito.parcheggi.conforme,
    suoloDistanze: esito.sagoma.conforme,
  };

  const caricaProgetto = (file: File) => {
    importaProgettoCompleto(file)
      .then((st) => {
        setPrg(st.prg);
        setDati(st.dati);
        setSalvatoIl(st.salvatoIl);
        setTab(2);
      })
      .catch((err: Error) => window.alert(`Import progetto fallito: ${err.message}`));
  };

  const resetDemo = () => {
    if (dati.piani.length === 0 || window.confirm('Azzerare i dati correnti e ripristinare profilo PRG e progetto demo?')) {
      azzeraStato();
      setSalvatoIl('');
      setPrg(profiloPRGDefault);
      setDati(datiProgettoDefault);
      setTab(0);
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
        onSalva={() => {
          const nome = esportaProgettoCompleto(prg, dati);
          window.alert(`Progetto esportato: ${nome}`);
        }}
        onCarica={caricaProgetto}
        onReset={resetDemo}
      />
      <main className="contenuto">
        {tab === 0 && <SchedaParametriPRG prg={prg} onChange={setPrg} />}
        {tab === 1 && <SchedaDatiProgetto dati={dati} unita={unita} onChange={setDati} />}
        {tab === 2 && <SchedaQuadroSinottico prg={prg} dati={dati} esito={esito} />}
        {tab === 3 && <SchedaRelazioneExport prg={prg} dati={dati} esito={esito} stato={stato} />}
      </main>
      <footer className="app-footer" data-stampa>
        Calcoli secondo Regolamento Edilizio Tipo (RET) e NTA comunali — strumento di supporto preliminare agli adempimenti edilizi (CILA, SCIA, PdC); gli esiti non sostituiscono la verifica del professionista.
        <span className="firma">Sviluppato da Matteo Mussillon</span>
      </footer>
    </div>
  );
}
