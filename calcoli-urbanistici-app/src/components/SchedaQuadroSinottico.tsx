import type { DatiProgetto, ProfiloPRG, RisultatoCalcolo } from '../types/urbanistica';
import { LABEL_DESTINAZIONI } from '../types/urbanistica';
import { Badge, Card, ProgressBar } from './common';

interface Props {
  prg: ProfiloPRG;
  dati: DatiProgetto;
  esito: RisultatoCalcolo;
}

function StatCard({ titolo, valoreEvento, testoValore, sub, conforme }: {
  titolo: string;
  testoValore: string;
  valoreEvento: number;
  sub: string;
  conforme: boolean | null;
}) {
  return (
    <div className={`stat-card ${conforme === null ? '' : conforme ? 'ok' : 'ko'}`}>
      <span className="stat-titolo">{titolo}</span>
      <strong className="stat-valore mono">{testoValore}</strong>
      {valoreEvento > 0 && <ProgressBar valore={valoreEvento} max={100} inverso />}
      <span className="stat-sub">{sub}</span>
      {conforme !== null && <Badge conforme={conforme} />}
    </div>
  );
}

export function SchedaQuadroSinottico({ prg, dati, esito }: Props) {
  const cap = esito.capacitaEdificatoria;
  const sf = dati.superficieFondiaria_Sf;
  const utlizzataSLP = cap.slpMax && cap.slpMax > 0 ? (esito.slpNettaTot / cap.slpMax) * 100 : 0;
  const utlizzatoVolume = cap.vMax && cap.vMax > 0 ? (esito.volumeProgetto_mc / cap.vMax) * 100 : 0;

  return (
    <div className="scheda">
      <div className="quattro-colonne">
        <StatCard
          titolo="SLP Netta vs Max"
          testoValore={`${esito.slpNettaTot.toFixed(2)} / ${cap.slpMax !== null ? cap.slpMax.toFixed(2) : '—'} mq`}
          valoreEvento={utlizzataSLP}
          sub={cap.slpResidua !== null ? `Residuo: ${cap.slpResidua.toFixed(2)} mq` : 'Indice non valorizzato'}
          conforme={cap.slpMax === null ? null : esito.slpNettaTot <= cap.slpMax + 1e-9}
        />
        <StatCard
          titolo="Volume vs Max"
          testoValore={`${esito.volumeProgetto_mc.toFixed(2)} / ${cap.vMax !== null ? cap.vMax.toFixed(2) : '—'} mc`}
          valoreEvento={utlizzatoVolume}
          sub={cap.volumeResiduo !== null ? `Residuo: ${cap.volumeResiduo.toFixed(2)} mc` : 'Indice non valorizzato'}
          conforme={cap.vMax === null ? null : esito.volumeProgetto_mc <= cap.vMax + 1e-9}
        />
        <StatCard
          titolo="Rapporto di Copertura"
          testoValore={`${esito.sagoma.rapportoCopertura_perc.toFixed(2)}% / max ${prg.parametriEdificatori.rapportoCoperturaMax_perc}%`}
          valoreEvento={esito.sagoma.rapportoCopertura_perc}
          sub={`Sc = ${dati.superficieCoperta_Sc.toFixed(2)} mq su Sf = ${sf.toFixed(2)} mq`}
          conforme={sf <= 0 ? null : esito.sagoma.verifiche[0].conforme}
        />
        <StatCard
          titolo="Permeabilità"
          testoValore={`${esito.sagoma.indicePermeabilita_perc.toFixed(2)}% / min ${prg.parametriEdificatori.indicePermeabilitaMin_perc}%`}
          valoreEvento={esito.sagoma.indicePermeabilita_perc}
          sub={`SP ponderata = ${esito.sagoma.superficiePonderataPermeabile_mq.toFixed(2)} mq`}
          conforme={sf <= 0 ? null : esito.sagoma.verifiche[1].conforme}
        />
      </div>

      <Card titolo="Conformità urbanistica e planivolumetrica" extra={<Badge conforme={esito.conformeEdificabilita} />}>
        <div className="tabella-scroll">
          <table className="tabella mini">
            <thead><tr><th>Verifica</th><th>Dichiarato</th><th>Limite</th><th>Esito</th><th>Dettaglio</th></tr></thead>
            <tbody>
              {esito.dettagliEdificabilita.map((v, i) => (
                <tr key={i} className={v.conforme ? '' : 'riga-ko'}>
                  <td>{v.etichetta}</td>
                  <td className="mono">{v.previsto} {v.unitaMisura}</td>
                  <td className="mono">{v.richiesto} {v.unitaMisura}</td>
                  <td><Badge conforme={v.conforme} /></td>
                  <td>{v.dettaglio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card titolo="SLP Lorda → Scomputi → SLP Netta per destinazione e mix funzionale" extra={<Badge conforme={esito.mixFunzionaleConforme} />}>
        <div className="tabella-scroll">
          <table className="tabella">
            <thead>
              <tr>
                <th>Destinazione d'uso</th>
                <th>SLP Lorda (mq)</th>
                <th>Scomputi ripartiti (mq)</th>
                <th>Logge eccedenti tassate (mq)</th>
                <th>SLP Netta (mq)</th>
                <th>Quota mix (%)</th>
                <th>Ammessa</th>
                <th>Esito mix</th>
              </tr>
            </thead>
            <tbody>
              {esito.righeDestinazioni.map((r) => (
                <tr key={r.destinazione} className={r.slpNetta > 0 && !r.conformeMix ? 'riga-ko' : ''}>
                  <td className="etichetta">{LABEL_DESTINAZIONI[r.destinazione]}</td>
                  <td className="mono">{r.slpLorda.toFixed(2)}</td>
                  <td className="mono">{r.scomputiProporzionali.toFixed(2)}</td>
                  <td className="mono">{r.loggeEccedentiTassate.toFixed(2)}</td>
                  <td className="mono forte">{r.slpNetta.toFixed(2)}</td>
                  <td className="mono">{r.quotaPerc.toFixed(2)}</td>
                  <td>{r.ammessa ? 'Sì' : 'No'}</td>
                  <td>{r.slpNetta > 0 ? <Badge conforme={r.conformeMix} /> : '—'}</td>
                </tr>
              ))}
              <tr className="riga-totale">
                <td className="etichetta">TOTALE</td>
                <td className="mono">{esito.slpLordaTot.toFixed(2)}</td>
                <td className="mono">{(esito.scompMuri + esito.scompScale + esito.scompInterrati + esito.scompLoggeAmmesso).toFixed(2)}</td>
                <td className="mono">{esito.loggeEccedentiTassate.toFixed(2)}</td>
                <td className="mono forte">{esito.slpNettaTot.toFixed(2)}</td>
                <td className="mono">100.00</td>
                <td />
                <td><Badge conforme={esito.mixFunzionaleConforme} /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="nota">
          Scomputi applicati: murature {esito.scompMuri.toFixed(2)} mq, vani scala {esito.scompScale.toFixed(2)} mq, interrati {esito.scompInterrati.toFixed(2)} mq,
          logge ammesse {esito.scompLoggeAmmesso.toFixed(2)} mq su tetto di {esito.tettoLoggeMq.toFixed(2)} mq ({prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP}% della SLP lorda).
          Volume progetto = SLP netta × {prg.parametriEdificatori.altezzaVirtualeConversione_m.toFixed(2)} m = {esito.volumeProgetto_mc.toFixed(2)} mc.
        </p>
      </Card>

      <Card titolo="Standard Urbanistici D.M. 1444/68, cessioni e monetizzazione" extra={<Badge conforme={esito.standard.conformeStandard} />}>
        <div className="tabella-scroll">
          <table className="tabella">
            <thead>
              <tr>
                <th>Destinazione</th>
                <th>Abitanti teorici</th>
                <th>Fabbisogno totale (mq)</th>
                <th>→ Parcheggi pubblici (mq)</th>
                <th>→ Verde/Servizi (mq)</th>
                <th>Monetizzazione</th>
                <th>Tariffa (€/mq)</th>
              </tr>
            </thead>
            <tbody>
              {esito.standard.righe.map((r) => (
                <tr key={r.destinazione}>
                  <td className="etichetta">{LABEL_DESTINAZIONI[r.destinazione]}</td>
                  <td className="mono">{r.abitantiTeorici.toFixed(2)}</td>
                  <td className="mono">{r.fabbisognoTotale_mq.toFixed(2)}</td>
                  <td className="mono">{r.fabbisognoParcheggiPubblici_mq.toFixed(2)}</td>
                  <td className="mono">{r.fabbisognoVerdeServizi_mq.toFixed(2)}</td>
                  <td>{r.monetizzazioneAmmessa ? 'Ammessa' : 'Non ammessa'}</td>
                  <td className="mono">{r.tariffa_euroMq.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="due-colonne treuple">
          <div className="mini-quadro">
            <h4>Fabbisogno e cessioni</h4>
            <RigheStandard esito={esito} />
          </div>
          <div className="mini-quadro">
            <h4>Monetizzazione</h4>
            <p>
              Importo totale: <strong className="mono">{esito.standard.importoMonetizzazioneTot.toFixed(2)} €</strong>
            </p>
            <p className="nota">
              Calcolo sui deficit di parcheggi pubblici e verde/servizi con la tariffa della destinazione che genera lo standard
              (media ponderata se più destinazioni). Se la monetizzazione non è ammessa dalla zona e il deficit è positivo, l'esito è NON CONFORME.
            </p>
          </div>
        </div>
        <div className="tabella-scroll">
          <table className="tabella mini">
            <thead><tr><th>Verifica</th><th>Fabbisogno</th><th>Ceduto</th><th>Esito</th><th>Dettaglio</th></tr></thead>
            <tbody>
              {esito.standard.dettagli.map((v, i) => (
                <tr key={i} className={v.conforme ? '' : 'riga-ko'}>
                  <td>{v.etichetta}</td>
                  <td className="mono">{v.richiesto.toFixed(2)} {v.unitaMisura}</td>
                  <td className="mono">{v.previsto.toFixed(2)} {v.unitaMisura}</td>
                  <td><Badge conforme={v.conforme} /></td>
                  <td>{v.dettaglio}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="due-colonne">
        <Card titolo="Parcheggi privati pertinenziali — L. 122/89" extra={<Badge conforme={esito.parcheggi.conforme} />}>
          <div className="tabella-scroll">
            <table className="tabella mini">
              <tbody>
                <tr><td>Volume urbanistico di progetto</td><td className="mono">{esito.parcheggi.volumeProgetto_mc.toFixed(2)} mc</td></tr>
                <tr><td>Fabbisogno L. 122/89 ({prg.parcheggiPrivati.rapportoLegge122_89_mqOgniMc} mq/mc)</td><td className="mono">{esito.parcheggi.fabbisognoL122_mq.toFixed(2)} mq</td></tr>
                <tr><td>Dotazione aggiuntiva commerciale</td><td className="mono">{esito.parcheggi.extraCommerciale_mq.toFixed(2)} mq</td></tr>
                <tr className="riga-totale"><td>Fabbisogno totale</td><td className="mono">{esito.parcheggi.fabbisognoTotalePrivati_mq.toFixed(2)} mq</td></tr>
                <tr><td>Stalli previsti</td><td className="mono">{esito.parcheggi.stalliProgetto_mq.toFixed(2)} mq</td></tr>
                <tr><td>Corsie manovra</td><td className="mono">{esito.parcheggi.manovraProgetto_mq.toFixed(2)} mq</td></tr>
                <tr><td>% manovra (max {esito.parcheggi.percManovraMax}%)</td><td className="mono">{esito.parcheggi.percManovraReale.toFixed(2)}%</td></tr>
              </tbody>
            </table>
          </div>
        </Card>

        <Card titolo="Sagoma, copertura e distanze" extra={<Badge conforme={esito.sagoma.conforme} />}>
          <div className="tabella-scroll">
            <table className="tabella mini">
              <thead><tr><th>Verifica</th><th>Valore</th><th>Limite</th><th>Esito</th></tr></thead>
              <tbody>
                {esito.sagoma.verifiche.map((v, i) => (
                  <tr key={i} className={v.conforme ? '' : 'riga-ko'}>
                    <td>{v.etichetta}</td>
                    <td className="mono">{v.previsto} {v.unitaMisura}</td>
                    <td className="mono">{v.richiesto} {v.unitaMisura}</td>
                    <td><Badge conforme={v.conforme} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function RigheStandard({ esito }: { esito: RisultatoCalcolo }) {
  const s = esito.standard;
  return (
    <div className="tabella-scroll">
      <table className="tabella mini">
        <tbody>
          <tr><td>Abitanti teorici totali</td><td className="mono">{s.abitantiTeoriciTot.toFixed(2)}</td></tr>
          <tr><td>Fabbisogno parcheggi pubblici</td><td className="mono">{s.fabbisognoParkPubbliciTot.toFixed(2)} mq</td></tr>
          <tr><td>Fabbisogno verde/servizi</td><td className="mono">{s.fabbisognoVerdeServiziTot.toFixed(2)} mq</td></tr>
          <tr><td>Ceduto parcheggi pubblici</td><td className="mono">{s.cedutoParkPubblici_mq.toFixed(2)} mq</td></tr>
          <tr><td>Ceduto verde + servizi</td><td className="mono">{s.cedutoVerdeServizi_mq.toFixed(2)} mq</td></tr>
          <tr><td>Deficit parcheggi pubblici</td><td className="mono">{s.deficitParkPubblici.toFixed(2)} mq</td></tr>
          <tr><td>Deficit verde/servizi</td><td className="mono">{s.deficitVerdeServizi.toFixed(2)} mq</td></tr>
        </tbody>
      </table>
    </div>
  );
}
