import type { RigaDestinazione } from '../types/urbanistica';
import { LABEL_DESTINAZIONI } from '../types/urbanistica';

const COLORI: Record<string, string> = {
  residenziale: '#3b82f6',
  commerciale: '#f59e0b',
  direzionale: '#a78bfa',
  produttivo: '#fb923c',
  turistico: '#2dd4bf',
};

export function GraficoMix({ righe }: { righe: RigaDestinazione[] }) {
  const attive = righe.filter((r) => r.slpNetta > 0);

  if (attive.length === 0) {
    return <p className="nota">Nessuna superficie da visualizzare: inserire almeno un piano con SLP.</p>;
  }

  return (
    <div className="grafico-mix">
      <div className="barra-mix">
        {attive.map((r) => (
          <div
            key={r.destinazione}
            className={`segmento-mix ${r.conformeMix ? '' : 'segmento-ko'}`}
            style={{ width: `${r.quotaPerc}%`, background: COLORI[r.destinazione] }}
            title={`${LABEL_DESTINAZIONI[r.destinazione]}: ${r.quotaPerc.toFixed(2)}% (${r.slpNetta.toFixed(2)} mq)`}
          >
            {r.quotaPerc >= 12 ? `${r.quotaPerc.toFixed(1)}%` : ''}
          </div>
        ))}
      </div>
      <div className="legenda-mix">
        {attive.map((r) => (
          <span key={r.destinazione} className="voce-legenda">
            <span className="pallino" style={{ background: COLORI[r.destinazione] }} />
            {LABEL_DESTINAZIONI[r.destinazione]}
            <span className="mono legenda-valore">{r.slpNetta.toFixed(0)} mq · {r.quotaPerc.toFixed(1)}%</span>
            {!r.conformeMix && <span className="legenda-ko">⚠ fuori range</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
