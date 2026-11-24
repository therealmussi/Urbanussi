import { useRef, useState } from 'react';
import { FileUp, Plus, Trash2 } from 'lucide-react';
import type { DatiProgetto, DestinazioneUso, Piano, TipoIntervento } from '../types/urbanistica';
import { DESTINAZIONI, LABEL_DESTINAZIONI } from '../types/urbanistica';
import type { EsitoDxf, UnitaDisegno } from '../parsers/dxfParser';
import { leggiDxfDaFile } from '../parsers/dxfParser';
import { creaDatiProgettoVuoto } from '../data/prgDefault';
import { NumeroInput, RigaParametro } from './common';

interface Props {
  dati: DatiProgetto;
  unita: UnitaDisegno;
  onChange: (d: DatiProgetto) => void;
}

const LEGENDA_LAYER = [
  ['URB_ST', 'Superficie Territoriale (St)'],
  ['URB_SF', 'Superficie Fondiaria (Sf)'],
  ['URB_SC', 'Superficie Coperta (Sc)'],
  ['URB_SLP_RES_P1', 'SLP Residenziale, piano P1 (COMM/DIR/PROD/TUR)'],
  ['URB_SCOMP_MURI_P1', 'Scomputo murature (LOGGE/SCALE/INT)'],
  ['URB_SP_100', 'Area drenante coeff. 1.0 (0..100)'],
  ['URB_PARK_STALLI / URB_PARK_MANOVRA', 'Parcheggi privati L. 122/89'],
  ['URB_STD_VERDE / URB_STD_SERVIZI / URB_STD_PARK', 'Standard in cessione'],
];

export function SchedaDatiProgetto({ dati, unita, onChange }: Props) {
  const [dragAttivo, setDragAttivo] = useState(false);
  const [logDxf, setLogDxf] = useState<EsitoDxf | null>(null);
  const [erroreDxf, setErroreDxf] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const caricaDxf = async (file: File) => {
    setErroreDxf(null);
    setLogDxf(null);
    try {
      const esito = await leggiDxfDaFile(file, unita, creaDatiProgettoVuoto(file.name.replace(/\.dxf$/i, '')));
      onChange(esito.dati);
      setLogDxf(esito);
    } catch (err) {
      setErroreDxf((err as Error).message);
    }
  };

  const aggiornaPiano = (id: string, muta: (p: Piano) => void) => {
    onChange({
      ...dati,
      piani: dati.piani.map((p) => {
        if (p.id !== id) return p;
        const copia = JSON.parse(JSON.stringify(p)) as Piano;
        muta(copia);
        return copia;
      }),
    });
  };

  const aggiungiPiano = () => {
    const n = dati.piani.length + 1;
    onChange({
      ...dati,
      piani: [
        ...dati.piani,
        {
          id: `piano-${Date.now()}`,
          nomePiano: `Piano ${n}`,
          slpLorda: { residenziale: 0, commerciale: 0, direzionale: 0, produttivo: 0, turistico: 0 },
          scomputi: { murature_mq: 0, loggePorticati_mq: 0, vaniScala_mq: 0, interrati_mq: 0 },
        },
      ],
    });
  };

  return (
    <div className="scheda">
      <div className="due-colonne">
        <section className="card">
          <header className="card-head">
            <h3>Import disegno CAD (.dxf)</h3>
            <span className="pill">unità: {unita}</span>
          </header>
          <div
            className={`dropzone ${dragAttivo ? 'attiva' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragAttivo(true); }}
            onDragLeave={() => setDragAttivo(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragAttivo(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void caricaDxf(f);
            }}
            onClick={() => fileRef.current?.click()}
          >
            <FileUp size={28} />
            <strong>Trascinare qui il file .dxf</strong>
            <span>oppure cliccare per selezionarlo (LWPOLYLINE/POLYLINE chiuse, layer URB_*)</span>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".dxf"
            hidden
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void caricaDxf(f); }}
          />
          {erroreDxf && <p className="nota nota-ko">Errore DXF: {erroreDxf}</p>}
          <div className="tabella-scroll">
            <table className="tabella mini">
              <thead>
                <tr><th>Layer</th><th>Area (mq)</th><th>Esito</th><th>Nota</th></tr>
              </thead>
              <tbody>
                {logDxf ? (
                  logDxf.logLayer.length > 0 ? logDxf.logLayer.map((l, i) => (
                    <tr key={`${l.layer}-${i}`} className={l.riconosciuto ? '' : 'riga-ko'}>
                      <td className="etichetta mono">{l.layer}</td>
                      <td className="mono">{l.area_mq.toFixed(2)}</td>
                      <td>{l.riconosciuto ? '✅ riconosciuto' : '— ignorato'}</td>
                      <td>{l.descrizione}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4}>Nessuna polilinea chiusa trovata nel file.</td></tr>
                  )
                ) : (
                  <>
                    <tr><th colSpan={4}>Legenda layer riconosciuti</th></tr>
                    {LEGENDA_LAYER.map(([k, v]) => (
                      <tr key={k}><td className="etichetta mono">{k}</td><td colSpan={3}>{v}</td></tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>
          {logDxf && (
            <p className="nota">
              Polilinee chiuse analizzate: {logDxf.superficiCalcolate}/{logDxf.totaleEntita}. Layer ignorati: {logDxf.layerIgnorati.join(', ') || 'nessuno'}.
            </p>
          )}
        </section>

        <section className="card">
          <header className="card-head">
            <h3>Intervento e lotto</h3>
          </header>
          <RigaParametro etichetta="Nome progetto">
            <input className="input-testo" value={dati.nomeProgetto} onChange={(e) => onChange({ ...dati, nomeProgetto: e.target.value })} />
          </RigaParametro>
          <RigaParametro etichetta="Tipo intervento">
            <select
              value={dati.tipoIntervento}
              onChange={(e) => onChange({ ...dati, tipoIntervento: e.target.value as TipoIntervento })}
            >
              <option value="nuova_costruzione">Nuova costruzione</option>
              <option value="ristrutturazione_demolizione_ricostruzione">Ristrutturazione urbana / demo-ricostruzione</option>
              <option value="ampliamento">Ampliamento</option>
            </select>
          </RigaParametro>
          <RigaParametro etichetta="Superficie Territoriale St (mq)">
            <NumeroInput valore={dati.superficieTerritoriale_St} onChange={(v) => onChange({ ...dati, superficieTerritoriale_St: v })} />
          </RigaParametro>
          <RigaParametro etichetta="Superficie Fondiaria Sf (mq)">
            <NumeroInput valore={dati.superficieFondiaria_Sf} onChange={(v) => onChange({ ...dati, superficieFondiaria_Sf: v })} />
          </RigaParametro>
          <RigaParametro etichetta="Superficie Coperta Sc (mq)">
            <NumeroInput valore={dati.superficieCoperta_Sc} onChange={(v) => onChange({ ...dati, superficieCoperta_Sc: v })} />
          </RigaParametro>
        </section>
      </div>

      <section className="card">
        <header className="card-head">
          <h3>Piani — SLP lorda per destinazione e scomputi (mq)</h3>
          <button className="btn-ghost" onClick={aggiungiPiano}><Plus size={14} /> Aggiungi piano</button>
        </header>
        <div className="tabella-scroll">
          <table className="tabella">
            <thead>
              <tr>
                <th>Piano</th>
                {DESTINAZIONI.map((d) => <th key={d}>{LABEL_DESTINAZIONI[d]}</th>)}
                <th>Murature</th>
                <th>Logge</th>
                <th>Vani scala</th>
                <th>Interrati</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {dati.piani.map((p) => (
                <tr key={p.id}>
                  <td>
                    <input
                      className="input-testo"
                      value={p.nomePiano}
                      onChange={(e) => aggiornaPiano(p.id, (c) => { c.nomePiano = e.target.value; })}
                    />
                  </td>
                  {DESTINAZIONI.map((d) => (
                    <td key={d}>
                      <NumeroInput valore={p.slpLorda[d]} onChange={(v) => aggiornaPiano(p.id, (c) => { c.slpLorda[d as DestinazioneUso] = v; })} />
                    </td>
                  ))}
                  {(['murature_mq', 'loggePorticati_mq', 'vaniScala_mq', 'interrati_mq'] as const).map((k) => (
                    <td key={k}>
                      <NumeroInput valore={p.scomputi[k]} onChange={(v) => aggiornaPiano(p.id, (c) => { c.scomputi[k] = v; })} />
                    </td>
                  ))}
                  <td>
                    <button
                      className="btn-icone"
                      title="Rimuovi piano"
                      onClick={() => onChange({ ...dati, piani: dati.piani.filter((x) => x.id !== p.id) })}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {dati.piani.length === 0 && (
                <tr><td colSpan={11}>Nessun piano: aggiungerlo manualmente o importare un file DXF con layer URB_SLP_*.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="due-colonne">
        <section className="card">
          <header className="card-head">
            <h3>Aree permeabili</h3>
            <button
              className="btn-ghost"
              onClick={() => onChange({ ...dati, superficiPermeabili: [...dati.superficiPermeabili, { descrizione: 'Nuova area', area_mq: 0, coefficiente_0_1: 1 }] })}
            >
              <Plus size={14} /> Aggiungi area
            </button>
          </header>
          <div className="tabella-scroll">
            <table className="tabella mini">
              <thead><tr><th>Descrizione</th><th>Area (mq)</th><th>Coefficiente (0–1)</th><th /></tr></thead>
              <tbody>
                {dati.superficiPermeabili.map((sp, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        className="input-testo"
                        value={sp.descrizione}
                        onChange={(e) => onChange({
                          ...dati,
                          superficiPermeabili: dati.superficiPermeabili.map((x, j) => j === i ? { ...x, descrizione: e.target.value } : x),
                        })}
                      />
                    </td>
                    <td><NumeroInput valore={sp.area_mq} onChange={(v) => onChange({ ...dati, superficiPermeabili: dati.superficiPermeabili.map((x, j) => j === i ? { ...x, area_mq: v } : x) })} /></td>
                    <td><NumeroInput valore={sp.coefficiente_0_1} step={0.05} min={0} max={1} onChange={(v) => onChange({ ...dati, superficiPermeabili: dati.superficiPermeabili.map((x, j) => j === i ? { ...x, coefficiente_0_1: Math.min(1, Math.max(0, v)) } : x) })} /></td>
                    <td>
                      <button className="btn-icone" title="Rimuovi area" onClick={() => onChange({ ...dati, superficiPermeabili: dati.superficiPermeabili.filter((_, j) => j !== i) })}>
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
                {dati.superficiPermeabili.length === 0 && <tr><td colSpan={4}>Nessuna area permeabile inserita.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card">
          <header className="card-head"><h3>Parcheggi privati e standard ceduti</h3></header>
          <RigaParametro etichetta="Parcheggi privati — stalli (mq)">
            <NumeroInput valore={dati.parcheggiPrivatiProgetto.stalli_mq} onChange={(v) => onChange({ ...dati, parcheggiPrivatiProgetto: { ...dati.parcheggiPrivatiProgetto, stalli_mq: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Parcheggi privati — manovra (mq)">
            <NumeroInput valore={dati.parcheggiPrivatiProgetto.manovra_mq} onChange={(v) => onChange({ ...dati, parcheggiPrivatiProgetto: { ...dati.parcheggiPrivatiProgetto, manovra_mq: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Standard ceduti — verde (mq)">
            <NumeroInput valore={dati.standardReperitiInCessione.verde_mq} onChange={(v) => onChange({ ...dati, standardReperitiInCessione: { ...dati.standardReperitiInCessione, verde_mq: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Standard ceduti — servizi (mq)">
            <NumeroInput valore={dati.standardReperitiInCessione.servizi_mq} onChange={(v) => onChange({ ...dati, standardReperitiInCessione: { ...dati.standardReperitiInCessione, servizi_mq: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Standard ceduti — parcheggi pubblici (mq)">
            <NumeroInput valore={dati.standardReperitiInCessione.parcheggiPubblici_mq} onChange={(v) => onChange({ ...dati, standardReperitiInCessione: { ...dati.standardReperitiInCessione, parcheggiPubblici_mq: v } })} />
          </RigaParametro>
        </section>
      </div>

      <section className="card">
        <header className="card-head"><h3>Sagoma e distanze</h3></header>
        <div className="quattro-colonne">
          <RigaParametro etichetta="Altezza progetto H (m)">
            <NumeroInput valore={dati.sagomaEDistanze.altezzaProgetto_m} onChange={(v) => onChange({ ...dati, sagomaEDistanze: { ...dati.sagomaEDistanze, altezzaProgetto_m: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza dai confini Dc (m)">
            <NumeroInput valore={dati.sagomaEDistanze.distanzaConfini_m} onChange={(v) => onChange({ ...dati, sagomaEDistanze: { ...dati.sagomaEDistanze, distanzaConfini_m: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza tra fabbricati Df (m)">
            <NumeroInput valore={dati.sagomaEDistanze.distanzaFabbricati_m} onChange={(v) => onChange({ ...dati, sagomaEDistanze: { ...dati.sagomaEDistanze, distanzaFabbricati_m: v } })} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza dalle strade Ds (m)">
            <NumeroInput valore={dati.sagomaEDistanze.distanzaStrade_m} onChange={(v) => onChange({ ...dati, sagomaEDistanze: { ...dati.sagomaEDistanze, distanzaStrade_m: v } })} />
          </RigaParametro>
        </div>
      </section>
    </div>
  );
}
