import type { ReactNode } from 'react';

export function Badge({ conforme, testoGrande }: { conforme: boolean; testoGrande?: boolean }) {
  return (
    <span className={`badge ${conforme ? 'badge-conforme' : 'badge-nonconforme'}${testoGrande ? ' badge-big' : ''}`}>
      {conforme ? 'CONFORME' : 'NON CONFORME'}
    </span>
  );
}

export function Card({ titolo, children, extra }: { titolo: string; children: ReactNode; extra?: ReactNode }) {
  return (
    <section className="card">
      <header className="card-head">
        <h3>{titolo}</h3>
        {extra}
      </header>
      {children}
    </section>
  );
}

export interface CampoNumeroProps {
  valore: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}

export function NumeroInput({ valore, onChange, step = 0.01, min, max }: CampoNumeroProps) {
  return (
    <input
      className="input-num"
      type="number"
      value={Number.isFinite(valore) ? valore : 0}
      step={step}
      min={min}
      max={max}
      onChange={(e) => {
        const v = e.target.value === '' ? 0 : Number(e.target.value);
        onChange(Number.isFinite(v) ? v : 0);
      }}
    />
  );
}

export function BooleanoInput({ valore, onChange, etichetta }: { valore: boolean; onChange: (v: boolean) => void; etichetta: string }) {
  return (
    <label className="check">
      <input type="checkbox" checked={valore} onChange={(e) => onChange(e.target.checked)} />
      <span>{etichetta}</span>
    </label>
  );
}

export function ProgressBar({ valore, max, inverso, sogliaMinima }: { valore: number; max: number; inverso?: boolean; sogliaMinima?: number }) {
  const riferimento = sogliaMinima !== undefined ? sogliaMinima : max;
  const pct = riferimento > 0 ? Math.max(0, Math.min(100, (valore / riferimento) * 100)) : 0;
  const ok = inverso
    ? sogliaMinima === undefined || valore >= sogliaMinima - 1e-9
    : sogliaMinima === undefined || valore <= riferimento + 1e-9;
  return (
    <div className="progress">
      <div className={`progress-fill ${ok ? 'ok' : 'ko'}`} style={{ width: `${pct}%` }} />
      <span className="progress-label">{pct.toFixed(1)}%</span>
    </div>
  );
}

export function RigaParametro({ etichetta, children }: { etichetta: string; children: ReactNode }) {
  return (
    <div className="riga-parametro">
      <span className="riga-etichetta">{etichetta}</span>
      {children}
    </div>
  );
}
