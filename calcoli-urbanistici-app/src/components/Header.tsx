import { useRef, useState } from 'react';
import { BarChart3, BookOpen, Copy, FileOutput, FolderOpen, History, Plus, RotateCcw, Save, SlidersHorizontal, Trash2, UploadCloud } from 'lucide-react';
import type { StatoSemafori } from '../types/urbanistica';
import type { UnitaDisegno } from '../parsers/dxfParser';
import type { ProgettoSalvato } from '../utils/persistenza';
import { ModaleGuida } from './ModaleGuida';
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
  progetti: ProgettoSalvato[];
  attivoId: string | null;
  onSelectProgetto: (id: string) => void;
  onNuovoProgetto: () => void;
  onDuplicaProgetto?: () => void;
  onEliminaProgetto?: () => void;
}

function Semaforo({ etichetta, conforme }: { etichetta: string; conforme: boolean }) {
  return (
    <div className={`semaforo ${conforme ? 'ok' : 'ko'}`} title={etichetta}>
      <span className={conforme ? 'bullet-ok' : 'bullet-ko'} />
      <span className="semaforo-testo">{etichetta}</span>
    </div>
  );
}

export function Header({ prgComune, prgZona, nomeProgetto, unita, onChangeUnita, tab, onChangeTab, stato, salvatoIl, onSalva, onCarica, onReset, progetti, attivoId, onSelectProgetto, onNuovoProgetto, onDuplicaProgetto, onEliminaProgetto }: HeaderProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [guidaAperta, setGuidaAperta] = useState(() => !localStorage.getItem('calcoli-urbanistici-guida-vista'));

  const chiudiGuida = () => {
    localStorage.setItem('calcoli-urbanistici-guida-vista', '1');
    setGuidaAperta(false);
  };

  const ICONE_TAB = [
    <SlidersHorizontal key="0" size={14} />,
    <UploadCloud key="1" size={14} />,
    <BarChart3 key="2" size={14} />,
    <FileOutput key="3" size={14} />,
  ];

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
          <div className="header-progetto">
            <select
              aria-label="Progetto attivo"
              className="header-progetto-select"
              value={attivoId ?? ''}
              onChange={(e) => onSelectProgetto(e.target.value)}
            >
              {progetti.length === 0 && <option value="">(non salvato)</option>}
              {progetti.map((p) => (
                <option key={p.id} value={p.id}>{p.dati.nomeProgetto}</option>
              ))}
            </select>
            <button className="btn-icone" title="Nuovo progetto" onClick={onNuovoProgetto}>
              <Plus size={15} />
            </button>
            {onDuplicaProgetto && (
              <button className="btn-icone" title="Duplica progetto attivo" onClick={onDuplicaProgetto}>
                <Copy size={15} />
              </button>
            )}
            {onEliminaProgetto && (
              <button className="btn-icone btn-pericolo" title="Elimina progetto attivo" onClick={onEliminaProgetto}>
                <Trash2 size={15} />
              </button>
            )}
          </div>
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
          <button className="btn-icone btn-guida" title="Guida e tutorial dell'app" onClick={() => setGuidaAperta(true)}>
            <BookOpen size={15} /> <span className="btn-guida-testo">Guida</span>
          </button>
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
            {ICONE_TAB[i]}
            {i + 1}. {nome}
          </button>
        ))}
      </nav>
      <ModaleGuida aperta={guidaAperta} onClose={chiudiGuida} />
    </header>
  );
}
