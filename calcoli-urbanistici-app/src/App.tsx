import { useMemo, useState } from 'react';
import { datiProgettoDefault, profiloPRGDefault } from './data/prgDefault';
import type { DatiProgetto, ProfiloPRG, StatoSemafori } from './types/urbanistica';
import type { UnitaDisegno } from './parsers/dxfParser';
import { calcolaTutto } from './engine/motoreUrbanistico';
import { Header, type IndiceTab } from './components/Header';
import { SchedaParametriPRG } from './components/SchedaParametriPRG';
import { SchedaDatiProgetto } from './components/SchedaDatiProgetto';
import { SchedaQuadroSinottico } from './components/SchedaQuadroSinottico';
import { SchedaRelazioneExport } from './components/SchedaRelazioneExport';
import './App.css';

export default function App() {
  const [prg, setPrg] = useState<ProfiloPRG>(profiloPRGDefault);
  const [dati, setDati] = useState<DatiProgetto>(datiProgettoDefault);
  const [unita, setUnita] = useState<UnitaDisegno>('m');
  const [tab, setTab] = useState<IndiceTab>(2);

  const esito = useMemo(() => calcolaTutto(prg, dati), [prg, dati]);

  const stato: StatoSemafori = {
    conformitaUrbanistica: esito.conformeEdificabilita && esito.mixFunzionaleConforme,
    standard: esito.standard.conformeStandard,
    parcheggiL122: esito.parcheggi.conforme,
    suoloDistanze: esito.sagoma.conforme,
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
      />
      <main className="contenuto">
        {tab === 0 && <SchedaParametriPRG prg={prg} onChange={setPrg} />}
        {tab === 1 && <SchedaDatiProgetto dati={dati} unita={unita} onChange={setDati} />}
        {tab === 2 && <SchedaQuadroSinottico prg={prg} dati={dati} esito={esito} />}
        {tab === 3 && <SchedaRelazioneExport prg={prg} dati={dati} esito={esito} stato={stato} />}
      </main>
      <footer className="app-footer" data-stampa>
        Calcoli secondo Regolamento Edilizio Tipo (RET) e NTA comunali — strumento di supporto preliminare agli adempimenti edilizi (CILA, SCIA, PdC); gli esiti non sostituiscono la verifica del professionista.
      </footer>
    </div>
  );
}
