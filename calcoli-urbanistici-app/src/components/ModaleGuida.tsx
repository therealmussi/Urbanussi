import { useEffect, useRef, type ReactNode } from 'react';
import { BookOpen, X } from 'lucide-react';

const SEZIONI: { titolo: string; contenuto: ReactNode }[] = [
  {
    titolo: '1 · Cos\u2019\u00e8 questa applicazione',
    contenuto: (
      <>
        <p>
          Calcola in automatico gli indici urbanistici ed edilizi di un intervento (SLP, volume, copertura, permeabilit&agrave;,
          standard D.M. 1444/68, parcheggi L. 122/89, distanze) secondo il Regolamento Edilizio Tipo e le NTA comunali.
          Tutto avviene nel tuo browser: nessun dato viene inviato online (l&apos;unica eccezione &egrave; l&apos;estrazione AI delle NTA, che
          richiede la tua API key Mistral).
        </p>
        <p className="nota">
          &Egrave; uno strumento di supporto preliminare (CILA, SCIA, PdC): gli esiti non sostituiscono la verifica del professionista.
        </p>
      </>
    ),
  },
  {
    titolo: '2 · Il flusso di lavoro in 4 passi',
    contenuto: (
      <ol className="guida-passi">
        <li>
          <strong>Scheda 1 — Parametri PRG / NTA:</strong> inserisci le regole dello strumento urbanistico (indici Uf/Ut e If/It,
          tetto logge, distanze, destinazioni ammesse, tariffe di monetizzazione). Puoi compilarlo a mano, importare il file
          .json di un Comune o incollare il testo dell&apos;articolo NTA nel pannello Mistral AI.
        </li>
        <li>
          <strong>Scheda 2 — Dati Progetto &amp; Import DXF:</strong> trascina il file .dxf del rilievo (scegli l&apos;unit&agrave; di
          disegno m / cm / mm) oppure compila a mano le tabelle: lotto, piani con SLP per destinazione, scomputi, aree
          permeabili, parcheggi e standard ceduti.
        </li>
        <li>
          <strong>Scheda 3 — Quadro Sinottico:</strong> vedi tutti i risultati con badge CONFORME / NON CONFORME: capacit&agrave;
          edificatoria residua, mix funzionale, standard e monetizzazione in euro, parcheggi L. 122/89, sagoma e distanze.
        </li>
        <li>
          <strong>Scheda 4 — Relazione &amp; Export:</strong> scarica il report Excel a 4 fogli o stampa/salva in PDF la relazione
          tecnica pronta da allegare alla pratica.
        </li>
      </ol>
    ),
  },
  {
    titolo: '3 · Progetti multipli e salvataggio',
    contenuto: (
      <>
        <p>
          In alto a destra il selettore gestisce pi&ugrave; progetti: <strong>+</strong> crea un progetto nuovo, <strong>⧉</strong> duplica
          quello attivo, <strong>cestino</strong> lo elimina. Ogni progetto conserva profilo PRG e dati geometrie ed &egrave; salvato
          automaticamente nel browser a ogni modifica (vedi l&apos;ora nell&apos;indicatore &laquo;ultimo salvataggio&raquo;).
        </p>
        <p>
          Il pulsante dischetto esporta il progetto completo in un file .json (profilo + dati), riapribile in qualsiasi browser
          con il pulsante cartella: utile per archiviare la pratica o condividerla con un collega.
        </p>
      </>
    ),
  },
  {
    titolo: '4 · Layer CAD riconosciuti nel file DXF',
    contenuto: (
      <>
        <p>Le polilinee chiuse su questi layer vengono lette e calcolate automaticamente (formula di Gauss, scala m/cm/mm):</p>
        <table className="tabella">
          <thead><tr><th>Layer</th><th>Significato</th></tr></thead>
          <tbody>
            <tr><td className="mono">URB_ST</td><td>Superficie territoriale (St)</td></tr>
            <tr><td className="mono">URB_SF</td><td>Superficie fondiaria (Sf)</td></tr>
            <tr><td className="mono">URB_SC</td><td>Superficie coperta (Sc)</td></tr>
            <tr><td className="mono">URB_SLP_RES_P1</td><td>SLP lorda: destinazione (RES, COMM, DIR, PROD, TUR) + piano (SOTT, S1, PT, P1, P2…)</td></tr>
            <tr><td className="mono">URB_SCOMP_LOGGE_P1</td><td>Superfici da scomputare: MURI, LOGGE, SCALE, INT + piano</td></tr>
            <tr><td className="mono">URB_SP_50</td><td>Area drenante con coefficiente di permeabilit&agrave; 0,50</td></tr>
            <tr><td className="mono">URB_PARK_STALLI / URB_PARK_MANOVRA</td><td>Parcheggio privato: stalli / corsie di manovra (L. 122/89)</td></tr>
            <tr><td className="mono">URB_STD_VERDE / URB_STD_SERVIZI / URB_STD_PARK</td><td>Aree standard in cessione o asservimento</td></tr>
          </tbody>
        </table>
      </>
    ),
  },
  {
    titolo: '5 · Come leggere i risultati',
    contenuto: (
      <ul className="guida-elenco">
        <li><strong>SLP netta vs max / Volume vs max</strong> — quanto spazio edificabile hai usato e quanto resta (gli scomputi ammessi — murature, vani scala, interrati, logge entro il tetto — non consumano edificabilit&agrave;).</li>
        <li><strong>Mix funzionale</strong> — le percentuali di destinazione d&apos;uso rispettano le quote min/max del PRG.</li>
        <li><strong>Standard D.M. 1444/68</strong> — abitanti teorici &times; 18 mq/ab (residenziale) e percentuali sulla SLP per le altre destinazioni; il deficit non ceduto genera l&apos;importo di monetizzazione se ammessa dal PRG.</li>
        <li><strong>Parcheggi L. 122/89</strong> — 1 mq ogni 10 mc di volume (valore configurabile), con massimo 40% di corsie di manovra.</li>
        <li><strong>Rc e Ip</strong> — copertura massima del lotto e permeabilit&agrave; minima del suolo; seguono le verifiche di altezza e distanze dai confini, dai fabbricati e dalle strade.</li>
        <li><strong>Controlli di coerenza</strong> — avvisi ambra che segnalano input mancanti o contraddittori (es. Sc &gt; Sf, nessuna area permeabile) prima ancora dei meriti della conformit&agrave;.</li>
      </ul>
    ),
  },
  {
    titolo: '6 · Suggerimenti pratici',
    contenuto: (
      <ul className="guida-elenco">
        <li>Parti dal progetto demo: mostra gi&agrave; un caso completo (residenziale + commerciale) da cui copiare la struttura.</li>
        <li>Se un indice del PRG non esiste nella tua zona, lascialo disattivato: l&apos;app ricava il limite mancante dall&apos;altro usando l&apos;altezza virtuale di conversione.</li>
        <li>L&apos;API key Mistral per l&apos;estrazione NTA resta solo nel localStorage del tuo browser.</li>
        <li>Per il PDF usa &laquo;Stampa / Salva PDF&raquo; del browser: viene stampata solo la relazione, non l&apos;interfaccia.</li>
      </ul>
    ),
  },
];

export function ModaleGuida({ aperta, onClose }: { aperta: boolean; onClose: () => void }) {
  const chiudiRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!aperta) return;
    chiudiRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [aperta, onClose]);

  if (!aperta) return null;

  return (
    <div className="guida-backdrop" onClick={onClose}>
      <div className="guida-modale" role="dialog" aria-modal aria-label="Guida all'applicazione" onClick={(e) => e.stopPropagation()}>
        <header className="guida-head">
          <h2><BookOpen size={18} /> Guida all&apos;applicazione</h2>
          <button ref={chiudiRef} className="btn-icone" title="Chiudi guida (Esc)" onClick={onClose}><X size={16} /></button>
        </header>
        <div className="guida-corpo">
          {SEZIONI.map((s) => (
            <section key={s.titolo}>
              <h3>{s.titolo}</h3>
              {s.contenuto}
            </section>
          ))}
        </div>
        <footer className="guida-foot">
          <span className="firma">Sviluppato da Matteo Mussillon</span>
        </footer>
      </div>
    </div>
  );
}
