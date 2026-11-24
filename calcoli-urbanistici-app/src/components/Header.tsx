import { useRef } from 'react';
import { FolderOpen, History, RotateCcw, Save } from 'lucide-react';
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
  salvatoIl: string;
  onSalva: () => void;
  onCarica: (file: File) => void;
  onReset: () => void;
}

function Semaforo({ etichetta, conforme }: { etichetta: string; conforme: boolean }) {
  return (
    <div className={`semaforo ${conforme ? 'ok' : 'ko'}`} title={etichetta}>
      <span className={conforme ? 'bullet-ok' : 'bullet-ko'} />
      <span className="semaforo-testo">{etichetta}</span>
    </div>
  );
}

export function Header({ prgComune, prgZona, nomeProgetto, unita, onChangeUnita, tab, onChangeTab, stato, salvatoIl, onSalva, onCarica, onReset }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="app-header">
      <div className="header-principale">
        <div className="header-titolo">
          <h1>Calcoli Urbanistici &amp; Planivolumetrici</h1>
          <p className="header-sottotitolo">
            {prgComune} — {prgZona} · <strong>{nomeProgetto}</strong> · Unità disegno: {unita}
          </p>
        </div>
        <div className="header-azioni">
          <label className="header-unita">
            Unità file DXF
            <select value={unita} onChange={(e) => onChangeUnita(e.target.value as UnitaDisegno)}>
              <option value="m">metri (m)</option>
              <option value="cm">centimetri (cm)</option>
              <option value="mm">millimetri (mm)</option>
            </select>
          </label>
          <button className="btn-icone" title="Esporta progetto completo (.json)" onClick={onSalva}>
            <Save size={15} />
          </button>
          <button className="btn-icone" title="Carica progetto salvato (.json)" onClick={() => fileRef.current?.click()}>
            <FolderOpen size={15} />
          </button>
          <button className="btn-icone" title="Ripristina profilo e progetto demo" onClick={onReset}>
            <RotateCcw size={15} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onCarica(f); e.target.value = ''; }}
          />
          {salvatoIl && (
            <span className="pill salvataggio" title="Salvataggio automatico nel browser">
              <History size={12} /> {new Date(salvatoIl).toLocaleTimeString('it-IT')}
            </span>
          )}
        </div>
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
