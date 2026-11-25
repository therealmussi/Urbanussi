import type { DatiProgetto, ProfiloPRG, RisultatoCalcolo } from '../types/urbanistica';
import { LABEL_DESTINAZIONI } from '../types/urbanistica';
import { Badge, Card, ProgressBar } from './common';
import { fmtNumero } from '../utils/formattazione';
import { GraficoMix } from './GraficoMix';

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
          testoValore={`${fmtNumero(esito.slpNettaTot)} / ${cap.slpMax !== null ? fmtNumero(cap.slpMax) : '—'} mq`}
          valoreEvento={utlizzataSLP}
          sub={cap.slpResidua !== null ? `Residuo: ${fmtNumero(cap.slpResidua)} mq` : 'Indice non valorizzato'}
          conforme={cap.slpMax === null ? null : esito.slpNettaTot <= cap.slpMax + 1e-9}
        />
        <StatCard
          titolo="Volume vs Max"
          testoValore={`${fmtNumero(esito.volumeProgetto_mc)} / ${cap.vMax !== null ? fmtNumero(cap.vMax) : '—'} mc`}
          valoreEvento={utlizzatoVolume}
          sub={cap.volumeResiduo !== null ? `Residuo: ${fmtNumero(cap.volumeResiduo)} mc` : 'Indice non valorizzato'}
          conforme={cap.vMax === null ? null : esito.volumeProgetto_mc <= cap.vMax + 1e-9}
        />
        <StatCard
          titolo="Rapporto di Copertura"
          testoValore={`${fmtNumero(esito.sagoma.rapportoCopertura_perc)}% / max ${prg.parametriEdificatori.rapportoCoperturaMax_perc}%`}
          valoreEvento={esito.sagoma.rapportoCopertura_perc}
          sub={`Sc = ${fmtNumero(dati.superficieCoperta_Sc)} mq su Sf = ${fmtNumero(sf)} mq`}
          conforme={sf <= 0 ? null : esito.sagoma.verifiche[0].conforme}
        />
        <StatCard
          titolo="Permeabilità"
          testoValore={`${fmtNumero(esito.sagoma.indicePermeabilita_perc)}% / min ${prg.parametriEdificatori.indicePermeabilitaMin_perc}%`}
          valoreEvento={esito.sagoma.indicePermeabilita_perc}
          sub={`SP ponderata = ${fmtNumero(esito.sagoma.superficiePonderataPermeabile_mq)} mq`}
          conforme={sf <= 0 ? null : esito.sagoma.verifiche[1].conforme}
        />
      </div>

      {esito.avvisiCoerenza.length > 0 && (
        <div className="avvisi-coerenza">
          <strong>Controlli di coerenza sugli input</strong>
          <ul>
            {esito.avvisiCoerenza.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

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
        <GraficoMix righe={esito.righeDestinazioni} />
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
                  <td className="mono">{fmtNumero(r.slpLorda)}</td>
                  <td className="mono">{fmtNumero(r.scomputiProporzionali)}</td>
                  <td className="mono">{fmtNumero(r.loggeEccedentiTassate)}</td>
                  <td className="mono forte">{fmtNumero(r.slpNetta)}</td>
                  <td className="mono">{fmtNumero(r.quotaPerc)}</td>
                  <td>{r.ammessa ? 'Sì' : 'No'}</td>
                  <td>{r.slpNetta > 0 ? <Badge conforme={r.conformeMix} /> : '—'}</td>
                </tr>
              ))}
              <tr className="riga-totale">
                <td className="etichetta">TOTALE</td>
                <td className="mono">{fmtNumero(esito.slpLordaTot)}</td>
                <td className="mono">{fmtNumero((esito.scompMuri + esito.scompScale + esito.scompInterrati + esito.scompLoggeAmmesso))}</td>
                <td className="mono">{fmtNumero(esito.loggeEccedentiTassate)}</td>
                <td className="mono forte">{fmtNumero(esito.slpNettaTot)}</td>
                <td className="mono">100.00</td>
                <td />
                <td><Badge conforme={esito.mixFunzionaleConforme} /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="nota">
          Scomputi applicati: murature {fmtNumero(esito.scompMuri)} mq, vani scala {fmtNumero(esito.scompScale)} mq, interrati {fmtNumero(esito.scompInterrati)} mq,
          logge ammesse {fmtNumero(esito.scompLoggeAmmesso)} mq su tetto di {fmtNumero(esito.tettoLoggeMq)} mq ({prg.regoleScomputoSLP.tettoMaxLoggePorticati_percSLP}% della SLP lorda).
          Volume progetto = SLP netta × {fmtNumero(prg.parametriEdificatori.altezzaVirtualeConversione_m)} m = {fmtNumero(esito.volumeProgetto_mc)} mc.
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
                  <td className="mono">{fmtNumero(r.abitantiTeorici)}</td>
                  <td className="mono">{fmtNumero(r.fabbisognoTotale_mq)}</td>
                  <td className="mono">{fmtNumero(r.fabbisognoParcheggiPubblici_mq)}</td>
                  <td className="mono">{fmtNumero(r.fabbisognoVerdeServizi_mq)}</td>
                  <td>{r.monetizzazioneAmmessa ? 'Ammessa' : 'Non ammessa'}</td>
                  <td className="mono">{fmtNumero(r.tariffa_euroMq)}</td>
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
              Importo totale: <strong className="mono">{fmtNumero(esito.standard.importoMonetizzazioneTot)} €</strong>
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
                  <td className="mono">{fmtNumero(v.richiesto)} {v.unitaMisura}</td>
                  <td className="mono">{fmtNumero(v.previsto)} {v.unitaMisura}</td>
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
                <tr><td>Volume urbanistico di progetto</td><td className="mono">{fmtNumero(esito.parcheggi.volumeProgetto_mc)} mc</td></tr>
                <tr><td>Fabbisogno L. 122/89 ({prg.parcheggiPrivati.rapportoLegge122_89_mqOgniMc} mq/mc)</td><td className="mono">{fmtNumero(esito.parcheggi.fabbisognoL122_mq)} mq</td></tr>
                <tr><td>Dotazione aggiuntiva commerciale</td><td className="mono">{fmtNumero(esito.parcheggi.extraCommerciale_mq)} mq</td></tr>
                <tr className="riga-totale"><td>Fabbisogno totale</td><td className="mono">{fmtNumero(esito.parcheggi.fabbisognoTotalePrivati_mq)} mq</td></tr>
                <tr><td>Stalli previsti</td><td className="mono">{fmtNumero(esito.parcheggi.stalliProgetto_mq)} mq</td></tr>
                <tr><td>Corsie manovra</td><td className="mono">{fmtNumero(esito.parcheggi.manovraProgetto_mq)} mq</td></tr>
                <tr><td>% manovra (max {esito.parcheggi.percManovraMax}%)</td><td className="mono">{fmtNumero(esito.parcheggi.percManovraReale)}%</td></tr>
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
          <tr><td>Abitanti teorici totali</td><td className="mono">{fmtNumero(s.abitantiTeoriciTot)}</td></tr>
          <tr><td>Fabbisogno parcheggi pubblici</td><td className="mono">{fmtNumero(s.fabbisognoParkPubbliciTot)} mq</td></tr>
          <tr><td>Fabbisogno verde/servizi</td><td className="mono">{fmtNumero(s.fabbisognoVerdeServiziTot)} mq</td></tr>
          <tr><td>Ceduto parcheggi pubblici</td><td className="mono">{fmtNumero(s.cedutoParkPubblici_mq)} mq</td></tr>
          <tr><td>Ceduto verde + servizi</td><td className="mono">{fmtNumero(s.cedutoVerdeServizi_mq)} mq</td></tr>
          <tr><td>Deficit parcheggi pubblici</td><td className="mono">{fmtNumero(s.deficitParkPubblici)} mq</td></tr>
          <tr><td>Deficit verde/servizi</td><td className="mono">{fmtNumero(s.deficitVerdeServizi)} mq</td></tr>
        </tbody>
      </table>
    </div>
  );
}
