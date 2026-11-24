import { Download, Printer } from 'lucide-react';
import type { DatiProgetto, ProfiloPRG, RisultatoCalcolo, StatoSemafori } from '../types/urbanistica';
import { esportaExcel } from '../utils/exportExcel';

interface Props {
  prg: ProfiloPRG;
  dati: DatiProgetto;
  esito: RisultatoCalcolo;
  stato: StatoSemafori;
}

function CampoRelazione({ etichetta, valore }: { etichetta: string; valore: string }) {
  return <p><strong>{etichetta}:</strong> {valore}</p>;
}

export function SchedaRelazioneExport({ prg, dati, esito, stato }: Props) {
  const percorso = (v: boolean) => (v ? 'CONFORME' : 'NON CONFORME');

  const esporta = () => {
    try {
      const nome = esportaExcel(prg, dati, esito);
      window.alert(`Report generato: ${nome}`);
    } catch (err) {
      window.alert(`Errore durante l'export Excel: ${(err as Error).message}`);
    }
  };

  return (
    <div className="scheda">
      <section className="card">
        <header className="card-head">
          <h3>Esportazione documenti</h3>
        </header>
        <p className="nota">
          Il report Excel contiene 4 fogli (Riepilogo Verifiche, Dettaglio Piani e SLP, Standard e Monetizzazione, Parametri PRG); la relazione
          stampabile è ottimizzata per l'allegato alle pratiche edilizie (CILA, SCIA, PdC) tramite Stampa / Salva PDF.
        </p>
        <div className="riga-bottoni">
          <button className="btn btn-primario" onClick={esporta}><Download size={16} /> Scarica Excel (.xlsx)</button>
          <button className="btn" onClick={() => window.print()}><Printer size={16} /> Stampa / Salva PDF Relazione Tecnica</button>
        </div>
      </section>

      <div id="stampa-relazione" className="relazione" aria-hidden>
        <div className="relazione-intestazione">
          <h2>Relazione Tecnica Urbanistica</h2>
          <p className="mono">{prg.comune} — {prg.zona}</p>
          <p className="mono">{dati.nomeProgetto} — {dati.tipoIntervento.replaceAll('_', ' ')}</p>
          <p className={esito.conformeGlobale ? 'esito-ok' : 'esito-ko'}>
            ESITO GLOBALE: {percorso(esito.conformeGlobale)}
          </p>
        </div>

        <h3>1. Quadro edificatorio</h3>
        <CampoRelazione etichetta="SLP lorda" valore={`${esito.slpLordaTot.toFixed(2)} mq`} />
        <CampoRelazione etichetta="Scomputi ammessi" valore={`murature ${esito.scompMuri.toFixed(2)} mq, vani scala ${esito.scompScale.toFixed(2)} mq, interrati ${esito.scompInterrati.toFixed(2)} mq, logge ammesse ${esito.scompLoggeAmmesso.toFixed(2)} mq (tetto ${prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP}% = ${esito.tettoLoggeMq.toFixed(2)} mq; eccedenza tassata ${esito.loggeEccedentiTassate.toFixed(2)} mq)`} />
        <CampoRelazione etichetta="SLP netta" valore={`${esito.slpNettaTot.toFixed(2)} mq — volume ${esito.volumeProgetto_mc.toFixed(2)} mc`} />
        {esito.capacitaEdificatoria.slpMax !== null && (
          <CampoRelazione etichetta="Capienza del lotto" valore={`SLP max ${esito.capacitaEdificatoria.slpMax.toFixed(2)} mq, residuo ${esito.capacitaEdificatoria.slpResidua?.toFixed(2)} mq — V max ${esito.capacitaEdificatoria.vMax?.toFixed(2)} mc, residuo ${esito.capacitaEdificatoria.volumeResiduo?.toFixed(2)} mc`} />
        )}
        <ul>
          {esito.righeDestinazioni.filter((r) => r.slpNetta > 0).map((r) => (
            <li key={r.destinazione}>{r.destinazione}: {r.slpNetta.toFixed(2)} mq netti ({r.quotaPerc.toFixed(2)}%) — {percorso(r.conformeMix)}</li>
          ))}
        </ul>

        <h3>2. Standard urbanistici D.M. 1444/68</h3>
        <CampoRelazione etichetta="Abitanti teorici" valore={esito.standard.abitantiTeoriciTot.toFixed(2)} />
        <CampoRelazione etichetta="Fabbisogno parcheggi pubblici" valore={`${esito.standard.fabbisognoParkPubbliciTot.toFixed(2)} mq — ceduti ${esito.standard.cedutoParkPubblici_mq.toFixed(2)} mq — deficit ${esito.standard.deficitParkPubblici.toFixed(2)} mq`} />
        <CampoRelazione etichetta="Fabbisogno verde/servizi" valore={`${esito.standard.fabbisognoVerdeServiziTot.toFixed(2)} mq — ceduti ${esito.standard.cedutoVerdeServizi_mq.toFixed(2)} mq — deficit ${esito.standard.deficitVerdeServizi.toFixed(2)} mq`} />
        <CampoRelazione etichetta="Monetizzazione" valore={`${esito.standard.importoMonetizzazioneTot.toFixed(2)} €`} />
        <CampoRelazione etichetta="Esito standard" valore={percorso(stato.standard)} />

        <h3>3. Parcheggi privati (L. 122/89)</h3>
        <CampoRelazione etichetta="Fabbisogno" valore={`${esito.parcheggi.fabbisognoTotalePrivati_mq.toFixed(2)} mq`} />
        <CampoRelazione etichetta="Realizzo" valore={`${esito.parcheggi.totaleProgettoPrivati_mq.toFixed(2)} mq — manovra ${esito.parcheggi.percManovraReale.toFixed(2)}%`} />
        <CampoRelazione etichetta="Esito" valore={percorso(stato.parcheggiL122)} />

        <h3>4. Copertura, permeabilità, altezze e distanze</h3>
        <CampoRelazione etichetta="Rapporto di copertura" valore={`${esito.sagoma.rapportoCopertura_perc.toFixed(2)}% (max ${prg.parametriEdificatori.rapportoCoperturaMax_perc}%)`} />
        <CampoRelazione etichetta="Permeabilità" valore={`${esito.sagoma.indicePermeabilita_perc.toFixed(2)}% (min ${prg.parametriEdificatori.indicePermeabilitaMin_perc}%)`} />
        <CampoRelazione etichetta="Esito suolo/distanze" valore={percorso(stato.suoloDistanze)} />
      </div>
    </div>
  );
}
