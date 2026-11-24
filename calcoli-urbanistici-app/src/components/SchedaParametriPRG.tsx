import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Sparkles, FileJson } from 'lucide-react';
import type { DestinazioneUso, ProfiloPRG } from '../types/urbanistica';
import { DESTINAZIONI, LABEL_DESTINAZIONI } from '../types/urbanistica';
import { leggiApiKey, salvaApiKey, estraiProfiloDaTesto } from '../parsers/prgAiParser';
import { Badge, BooleanoInput, NumeroInput, RigaParametro } from './common';

interface Props {
  prg: ProfiloPRG;
  onChange: (p: ProfiloPRG) => void;
}

type ChiaviParametri = keyof ProfiloPRG['parametriEdificatori'];
type ChiaviRegole = keyof ProfiloPRG['regoleScomputoSLP'];
type ChiaviDest = keyof ProfiloPRG['destinazioni'][DestinazioneUso];
type ChiaviParcheggi = keyof ProfiloPRG['parcheggiPrivati'];

export function SchedaParametriPRG({ prg, onChange }: Props) {
  const [testoNTA, setTestoNTA] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [messaggio, setMessaggio] = useState<{ ok: boolean; testo: string } | null>(null);
  const [caricamento, setCaricamento] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setApiKey(leggiApiKey());
  }, []);

  const aggiorna = <K extends ChiaviParametri>(chiave: K, valore: ProfiloPRG['parametriEdificatori'][K]) => {
    onChange({ ...prg, parametriEdificatori: { ...prg.parametriEdificatori, [chiave]: valore } });
  };

  const aggiornaRegola = (chiave: ChiaviRegole, valore: number | boolean) => {
    onChange({ ...prg, regoleScomputoSLP: { ...prg.regoleScomputoSLP, [chiave]: valore } as ProfiloPRG['regoleScomputoSLP'] });
  };

  const aggiornaDest = (dest: DestinazioneUso, chiave: ChiaviDest, valore: number | boolean) => {
    onChange({
      ...prg,
      destinazioni: {
        ...prg.destinazioni,
        [dest]: { ...prg.destinazioni[dest], [chiave]: valore } as ProfiloPRG['destinazioni'][DestinazioneUso],
      },
    });
  };

  const aggiornaParcheggi = (chiave: ChiaviParcheggi, valore: number) => {
    onChange({ ...prg, parcheggiPrivati: { ...prg.parcheggiPrivati, [chiave]: valore } });
  };

  const esportaJson = () => {
    const blob = new Blob([JSON.stringify(prg, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ProfiloPRG_${prg.comune.replace(/[^a-zA-Z0-9]+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importaJson = async (file: File) => {
    try {
      const parsed = JSON.parse(await file.text()) as ProfiloPRG;
      if (!parsed.parametriEdificatori || !parsed.destinazioni) throw new Error('struttura non riconosciuta');
      onChange(parsed);
      setMessaggio({ ok: true, testo: `Profilo "${parsed.comune}" importato correttamente` });
    } catch (err) {
      setMessaggio({ ok: false, testo: `Import fallito: ${(err as Error).message}` });
    }
  };

  const estraiConAI = async () => {
    setCaricamento(true);
    setMessaggio(null);
    salvaApiKey(apiKey);
    try {
      const risultato = await estraiProfiloDaTesto(testoNTA, apiKey.trim());
      onChange({ ...risultato.profilo });
      setMessaggio({ ok: true, testo: `Profilo generato: ${risultato.profilo.comune} — ${risultato.profilo.zona}. Ricontrollare i valori prima dell'uso professionale.` });
    } catch (err) {
      setMessaggio({ ok: false, testo: (err as Error).message });
    } finally {
      setCaricamento(false);
    }
  };

  return (
    <div className="scheda">
      <div className="due-colonne">
        <section className="card">
          <header className="card-head">
            <h3>Anagrafica strumento urbanistico</h3>
          </header>
          <RigaParametro etichetta="Comune">
            <input className="input-testo" value={prg.comune} onChange={(e) => onChange({ ...prg, comune: e.target.value })} />
          </RigaParametro>
          <RigaParametro etichetta="Zona">
            <input className="input-testo" value={prg.zona} onChange={(e) => onChange({ ...prg, zona: e.target.value })} />
          </RigaParametro>
          <RigaParametro etichetta="Descrizione">
            <textarea
              className="input-testo"
              rows={3}
              value={prg.descrizione}
              onChange={(e) => onChange({ ...prg, descrizione: e.target.value })}
            />
          </RigaParametro>

          <header className="card-head">
            <h3>Indici edificatori</h3>
          </header>
          <RigaParametro etichetta="Uf — Indice Utilizzazione Fondiaria (mq SLP/mq Sf)">
            {prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf === null ? (
              <button className="btn-ghost" onClick={() => aggiorna('indiceUtilizzazioneFondiaria_Uf', 2)}>+ Attiva Uf</button>
            ) : (
              <NumeroInput valore={prg.parametriEdificatori.indiceUtilizzazioneFondiaria_Uf} step={0.05} onChange={(v) => aggiorna('indiceUtilizzazioneFondiaria_Uf', v)} />
            )}
          </RigaParametro>
          <RigaParametro etichetta="Ut — Indice Utilizzazione Territoriale (mq SLP/mq St)">
            {prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut === null ? (
              <button className="btn-ghost" onClick={() => aggiorna('indiceUtilizzazioneTerritoriale_Ut', 1)}>+ Attiva Ut</button>
            ) : (
              <NumeroInput valore={prg.parametriEdificatori.indiceUtilizzazioneTerritoriale_Ut} step={0.05} onChange={(v) => aggiorna('indiceUtilizzazioneTerritoriale_Ut', v)} />
            )}
          </RigaParametro>
          <RigaParametro etichetta="If — Indice Fabbricabilità Fondiaria (mc/mq Sf)">
            {prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If === null ? (
              <button className="btn-ghost" onClick={() => aggiorna('indiceFabbricabilitaFondiaria_If', 2)}>+ Attiva If</button>
            ) : (
              <NumeroInput valore={prg.parametriEdificatori.indiceFabbricabilitaFondiaria_If} step={0.05} onChange={(v) => aggiorna('indiceFabbricabilitaFondiaria_If', v)} />
            )}
          </RigaParametro>
          <RigaParametro etichetta="It — Indice Fabbricabilità Territoriale (mc/mq St)">
            {prg.parametriEdificatori.indiceFabbricabilitaTerritoriale_It === null ? (
              <button className="btn-ghost" onClick={() => aggiorna('indiceFabbricabilitaTerritoriale_It', 1)}>+ Attiva It</button>
            ) : (
              <NumeroInput valore={prg.parametriEdificatori.indiceFabbricabilitaTerritoriale_It} step={0.05} onChange={(v) => aggiorna('indiceFabbricabilitaTerritoriale_It', v)} />
            )}
          </RigaParametro>
          <RigaParametro etichetta="Altezza virtuale di conversione Hv (m)">
            <NumeroInput valore={prg.parametriEdificatori.altezzaVirtualeConversione_m} onChange={(v) => aggiorna('altezzaVirtualeConversione_m', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Rapporto di copertura massimo (%)">
            <NumeroInput valore={prg.parametriEdificatori.rapportoCoperturaMax_perc} step={1} onChange={(v) => aggiorna('rapportoCoperturaMax_perc', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Indice di permeabilità minimo (%)">
            <NumeroInput valore={prg.parametriEdificatori.indicePermeabilitaMin_perc} step={1} onChange={(v) => aggiorna('indicePermeabilitaMin_perc', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Altezza massima (m)">
            <NumeroInput valore={prg.parametriEdificatori.altezzaMax_m} onChange={(v) => aggiorna('altezzaMax_m', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza minima dai confini (m)">
            <NumeroInput valore={prg.parametriEdificatori.distanzaMinConfini_m} onChange={(v) => aggiorna('distanzaMinConfini_m', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza minima tra fabbricati (m)">
            <NumeroInput valore={prg.parametriEdificatori.distanzaMinFabbricati_m} onChange={(v) => aggiorna('distanzaMinFabbricati_m', v)} />
          </RigaParametro>
          <RigaParametro etichetta="Distanza minima dalle strade (m)">
            <NumeroInput valore={prg.parametriEdificatori.distanzaMinStrade_m} onChange={(v) => aggiorna('distanzaMinStrade_m', v)} />
          </RigaParametro>
        </section>

        <div>
          <section className="card">
            <header className="card-head">
              <h3>Regole di scomputo SLP</h3>
            </header>
            <div className="colonna-check">
              <BooleanoInput etichetta="Scomputo murature perimetrali (D.Lgs. 102/2014, spessori > 30 cm)" valore={prg.regoleScomputoSLP.scomputaMuraturePerimetrali} onChange={(v) => aggiornaRegola('scomputaMuraturePerimetrali', v)} />
              <BooleanoInput etichetta="Scomputo vani scala e ascensore" valore={prg.regoleScomputoSLP.scomputaVaniScalaAscensore} onChange={(v) => aggiornaRegola('scomputaVaniScalaAscensore', v)} />
              <BooleanoInput etichetta="Scomputo locali interrati/accessori" valore={prg.regoleScomputoSLP.scomputaInterrati} onChange={(v) => aggiornaRegola('scomputaInterrati', v)} />
            </div>
            <RigaParametro etichetta="Tetto massimo logge/porticati (% SLP lorda)">
              <NumeroInput valore={prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP} step={1} onChange={(v) => aggiornaRegola('tettoMaxLoggePorticati_percSLP', v)} />
            </RigaParametro>
          </section>

          <section className="card">
            <header className="card-head">
              <h3>Parcheggi privati pertinenziali (L. 122/89)</h3>
            </header>
            <RigaParametro etichetta="Rapporto L. 122/89 (mq ogni mc)">
              <NumeroInput valore={prg.parcheggiPrivati.rapportoLegge122_89_mqOgniMc} step={0.01} onChange={(v) => aggiornaParcheggi('rapportoLegge122_89_mqOgniMc', v)} />
            </RigaParametro>
            <RigaParametro etichetta="Dotazione aggiuntiva commerciale (% SLP)">
              <NumeroInput valore={prg.parcheggiPrivati.dotazioneAggiuntivaCommerciale_percSLP} step={1} onChange={(v) => aggiornaParcheggi('dotazioneAggiuntivaCommerciale_percSLP', v)} />
            </RigaParametro>
            <RigaParametro etichetta="Max superficie manovra (% del totale)">
              <NumeroInput valore={prg.parcheggiPrivati.maxSuperficieManovra_percTotale} step={1} onChange={(v) => aggiornaParcheggi('maxSuperficieManovra_percTotale', v)} />
            </RigaParametro>
          </section>

          <section className="card">
            <header className="card-head">
              <h3>Azioni profilo</h3>
            </header>
            <div className="riga-bottoni">
              <button className="btn" onClick={esportaJson}><Download size={16} /> Esporta PRG (.json)</button>
              <button className="btn" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importa PRG (.json)</button>
              <input
                ref={fileRef}
                type="file"
                accept=".json"
                hidden
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void importaJson(f); }}
              />
            </div>
          </section>
        </div>
      </div>

      <section className="card">
        <header className="card-head">
          <h3><Sparkles size={16} /> Importa da Testo NTA con Mistral AI</h3>
        </header>
        <p className="nota">
          Incollare di seguito l'articolo del PRG/PGT/NTA (es. "Art. 5 - Zona B2"). L'AI estrae gli indici e le regole, fondendoli con il profilo corrente.
          I valori generati devono sempre essere verificati.
        </p>
        <label className="riga-parametro riga-verticale">
          <span className="riga-etichetta">API Key Mistral (salvata in questo browser)</span>
          <input
            className="input-testo"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            onBlur={() => salvaApiKey(apiKey.trim())}
          />
        </label>
        <textarea
          className="input-testo area-ai"
          rows={8}
          placeholder="Incollare qui il testo dell'articolo del PRG / NTA..."
          value={testoNTA}
          onChange={(e) => setTestoNTA(e.target.value)}
        />
        <div className="riga-bottoni">
          <button className="btn btn-primario" disabled={caricamento || !testoNTA.trim()} onClick={() => void estraiConAI()}>
            <FileJson size={16} /> {caricamento ? 'Analisi in corso...' : 'Estrai regole con Mistral AI'}
          </button>
          {messaggio && <Badge conforme={messaggio.ok} />}
        </div>
        {messaggio && <p className={`nota ${messaggio.ok ? 'nota-ok' : 'nota-ko'}`}>{messaggio.testo}</p>}
      </section>

      <section className="card">
        <header className="card-head">
          <h3>Destinazioni d'uso ammesse</h3>
        </header>
        <div className="tabella-scroll">
          <table className="tabella">
            <thead>
              <tr>
                <th>Destinazione</th>
                <th>Ammessa</th>
                <th>Quota min %</th>
                <th>Quota max %</th>
                <th>Parametro ab./SLP</th>
                <th>Standard mq/ab</th>
                <th>Standard % SLP</th>
                <th>Park pubbl. su standard %</th>
                <th>Verde/servizi su standard %</th>
                <th>Monetizzazione</th>
                <th>Tariffa €/mq</th>
              </tr>
            </thead>
            <tbody>
              {DESTINAZIONI.map((d) => {
                const regola = prg.destinazioni[d];
                return (
                  <tr key={d}>
                    <td className="etichetta">{LABEL_DESTINAZIONI[d]}</td>
                    <td><input type="checkbox" checked={regola.ammessa} onChange={(e) => aggiornaDest(d, 'ammessa', e.target.checked)} /></td>
                    <td><NumeroInput valore={regola.quotaMin_perc} step={5} onChange={(v) => aggiornaDest(d, 'quotaMin_perc', v)} /></td>
                    <td><NumeroInput valore={regola.quotaMax_perc} step={5} onChange={(v) => aggiornaDest(d, 'quotaMax_perc', v)} /></td>
                    <td><NumeroInput valore={regola.parametroAbitantiTeorici_mqSlpPerAb} step={1} onChange={(v) => aggiornaDest(d, 'parametroAbitantiTeorici_mqSlpPerAb', v)} /></td>
                    <td><NumeroInput valore={regola.standardMin_mqPerAb} step={1} onChange={(v) => aggiornaDest(d, 'standardMin_mqPerAb', v)} /></td>
                    <td><NumeroInput valore={regola.standardMin_percSLP} step={5} onChange={(v) => aggiornaDest(d, 'standardMin_percSLP', v)} /></td>
                    <td><NumeroInput valore={regola.quotaParcheggiPubbliciSuStandard_perc} step={5} onChange={(v) => aggiornaDest(d, 'quotaParcheggiPubbliciSuStandard_perc', v)} /></td>
                    <td><NumeroInput valore={regola.quotaVerdeServiziSuStandard_perc} step={5} onChange={(v) => aggiornaDest(d, 'quotaVerdeServiziSuStandard_perc', v)} /></td>
                    <td><input type="checkbox" checked={regola.monetizzazioneAmmessa} onChange={(e) => aggiornaDest(d, 'monetizzazioneAmmessa', e.target.checked)} /></td>
                    <td><NumeroInput valore={regola.tariffaMonetizzazione_euroMq} step={10} onChange={(v) => aggiornaDest(d, 'tariffaMonetizzazione_euroMq', v)} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
