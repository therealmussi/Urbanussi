import type { StatoSemafori } from '../types/urbanistica';
import type { UnitaDisegno } from '../parsers/dxfParser';
import { TAB, type IndiceTab } from '../tabs';

interface HeaderProps {
  prgComune: string;
  prgZona: string;
  nomeProgetto: string;
  unita: UnitaDisegno;
  onChangeUnita: (u: UnitaDisegno) => void;
  tab: IndiceTab;
  onChangeTab: (t: IndiceTab) => void;
  stato: StatoSemafori;
}

function Semaforo({ etichetta, conforme }: { etichetta: string; conforme: boolean }) {
  return (
    <div className={`semaforo ${conforme ? 'ok' : 'ko'}`} title={etichetta}>
      <span className={conforme ? 'bullet-ok' : 'bullet-ko'} />
      <span className="semaforo-testo">{etichetta}</span>
    </div>
  );
}

export function Header({ prgComune, prgZona, nomeProgetto, unita, onChangeUnita, tab, onChangeTab, stato }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-principale">
        <div className="header-titolo">
          <h1>Calcoli Urbanistici &amp; Planivolumetrici</h1>
          <p className="header-sottotitolo">
            {prgComune} — {prgZona} · <strong>{nomeProgetto}</strong> · Unità disegno: {unita}
          </p>
        </div>
        <label className="header-unita">
          Unità file DXF
          <select value={unita} onChange={(e) => onChangeUnita(e.target.value as UnitaDisegno)}>
            <option value="m">metri (m)</option>
            <option value="cm">centimetri (cm)</option>
            <option value="mm">millimetri (mm)</option>
          </select>
        </label>
        <div className="header-semafori" data-stampa>
          <Semaforo etichetta="Conformità Urbanistica" conforme={stato.conformitaUrbanistica} />
          <Semaforo etichetta="Standard D.M. 1444/68" conforme={stato.standard} />
          <Semaforo etichetta="Parcheggi L. 122/89" conforme={stato.parcheggiL122} />
          <Semaforo etichetta="Suolo / Distanze" conforme={stato.suoloDistanze} />
        </div>
      </div>
      <nav className="header-tabs" data-stampa>
        {TAB.map((nome, i) => (
          <button
            key={nome}
            className={`tab-btn ${tab === i ? 'attivo' : ''}`}
            onClick={() => onChangeTab(i as IndiceTab)}
          >
            {i + 1}. {nome}
          </button>
        ))}
      </nav>
    </header>
  );
}
