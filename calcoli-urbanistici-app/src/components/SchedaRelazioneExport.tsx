import { Download, Printer } from 'lucide-react';
import type { DatiProgetto, ProfiloPRG, RisultatoCalcolo, StatoSemafori } from '../types/urbanistica';
import { esportaExcel } from '../utils/exportExcel';
import { fmtNumero } from '../utils/formattazione';

interface Props {
  prg: ProfiloPRG;
  dati: DatiProgetto;
  esito: RisultatoCalcolo;
  stato: StatoSemafori;
  onMessaggio: (messaggio: string, tipo?: 'ok' | 'ko') => void;
}

function CampoRelazione({ etichetta, valore }: { etichetta: string; valore: string }) {
  return <p><strong>{etichetta}:</strong> {valore}</p>;
}

export function SchedaRelazioneExport({ prg, dati, esito, stato, onMessaggio }: Props) {
  const percorso = (v: boolean) => (v ? 'CONFORME' : 'NON CONFORME');

  const esporta = () => {
    try {
      const nome = esportaExcel(prg, dati, esito);
      onMessaggio(`Report generato: ${nome}`);
    } catch (err) {
      onMessaggio(`Errore durante l'export Excel: ${(err as Error).message}`, 'ko');
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
        <CampoRelazione etichetta="SLP lorda" valore={`${fmtNumero(esito.slpLordaTot)} mq`} />
        <CampoRelazione etichetta="Scomputi ammessi" valore={`murature ${fmtNumero(esito.scompMuri)} mq, vani scala ${fmtNumero(esito.scompScale)} mq, interrati ${fmtNumero(esito.scompInterrati)} mq, logge ammesse ${fmtNumero(esito.scompLoggeAmmesso)} mq (tetto ${prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP}% = ${fmtNumero(esito.tettoLoggeMq)} mq; eccedenza tassata ${fmtNumero(esito.loggeEccedentiTassate)} mq)`} />
        <CampoRelazione etichetta="SLP netta" valore={`${fmtNumero(esito.slpNettaTot)} mq — volume ${fmtNumero(esito.volumeProgetto_mc)} mc`} />
        {esito.capacitaEdificatoria.slpMax !== null && (
          <CampoRelazione etichetta="Capienza del lotto" valore={`SLP max ${fmtNumero(esito.capacitaEdificatoria.slpMax)} mq, residuo ${fmtNumero(esito.capacitaEdificatoria.slpResidua)} mq — V max ${fmtNumero(esito.capacitaEdificatoria.vMax)} mc, residuo ${fmtNumero(esito.capacitaEdificatoria.volumeResiduo)} mc`} />
        )}
        <ul>
          {esito.righeDestinazioni.filter((r) => r.slpNetta > 0).map((r) => (
            <li key={r.destinazione}>{r.destinazione}: {fmtNumero(r.slpNetta)} mq netti ({fmtNumero(r.quotaPerc)}%) — {percorso(r.conformeMix)}</li>
          ))}
        </ul>

        <h3>2. Standard urbanistici D.M. 1444/68</h3>
        <CampoRelazione etichetta="Abitanti teorici" valore={fmtNumero(esito.standard.abitantiTeoriciTot)} />
        <CampoRelazione etichetta="Fabbisogno parcheggi pubblici" valore={`${fmtNumero(esito.standard.fabbisognoParkPubbliciTot)} mq — ceduti ${fmtNumero(esito.standard.cedutoParkPubblici_mq)} mq — deficit ${fmtNumero(esito.standard.deficitParkPubblici)} mq`} />
        <CampoRelazione etichetta="Fabbisogno verde/servizi" valore={`${fmtNumero(esito.standard.fabbisognoVerdeServiziTot)} mq — ceduti ${fmtNumero(esito.standard.cedutoVerdeServizi_mq)} mq — deficit ${fmtNumero(esito.standard.deficitVerdeServizi)} mq`} />
        <CampoRelazione etichetta="Monetizzazione" valore={`${fmtNumero(esito.standard.importoMonetizzazioneTot)} €`} />
        <CampoRelazione etichetta="Esito standard" valore={percorso(stato.standard)} />

        <h3>3. Parcheggi privati (L. 122/89)</h3>
        <CampoRelazione etichetta="Fabbisogno" valore={`${fmtNumero(esito.parcheggi.fabbisognoTotalePrivati_mq)} mq`} />
        <CampoRelazione etichetta="Realizzo" valore={`${fmtNumero(esito.parcheggi.totaleProgettoPrivati_mq)} mq — manovra ${fmtNumero(esito.parcheggi.percManovraReale)}%`} />
        <CampoRelazione etichetta="Esito" valore={percorso(stato.parcheggiL122)} />

        <h3>4. Copertura, permeabilità, altezze e distanze</h3>
        <CampoRelazione etichetta="Rapporto di copertura" valore={`${fmtNumero(esito.sagoma.rapportoCopertura_perc)}% (max ${prg.parametriEdificatori.rapportoCoperturaMax_perc}%)`} />
        <CampoRelazione etichetta="Permeabilità" valore={`${fmtNumero(esito.sagoma.indicePermeabilita_perc)}% (min ${prg.parametriEdificatori.indicePermeabilitaMin_perc}%)`} />
        <CampoRelazione etichetta="Esito suolo/distanze" valore={percorso(stato.suoloDistanze)} />

        <p className="relazione-firma">Elaborati predisposti con applicativo sviluppato da Matteo Mussillon</p>
      </div>
    </div>
  );
}
