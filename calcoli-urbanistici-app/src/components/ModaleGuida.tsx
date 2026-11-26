import { useEffect, useRef, type ReactNode } from 'react';
import { BookOpen, X } from 'lucide-react';

function Termine({ simbolo, nome, definizione, formula, indica, inserimento }: {
  simbolo: string;
  nome: string;
  definizione: string;
  formula?: string;
  indica: string;
  inserimento: string;
}) {
  return (
    <div className="guida-termine">
      <p className="guida-termine-nome"><strong className="mono">{simbolo}</strong> — {nome}</p>
      <p>{definizione}</p>
      {formula && <p className="guida-formula mono">{formula}</p>}
      <p><strong>Cosa indica:</strong> {indica}</p>
      <p><strong>Come si inserisce:</strong> {inserimento}</p>
    </div>
  );
}

function SottoTitolo({ children }: { children: ReactNode }) {
  return <h4 className="guida-scheda">{children}</h4>;
}

const NAV: { id: string; label: string }[] = [
  { id: 'guida-cosa', label: 'Cos\u2019\u00e8 l\u2019app' },
  { id: 'guida-flusso', label: 'Flusso in 4 passi' },
  { id: 'guida-progetti', label: 'Progetti e salvataggio' },
  { id: 'guida-layer', label: 'Layer DXF' },
  { id: 'guida-istruzioni', label: 'Istruzioni d\u2019uso' },
  { id: 'guida-risultati', label: 'Leggere i risultati' },
  { id: 'guida-suggerimenti', label: 'Suggerimenti' },
];

const SEZIONI: { id: string; titolo: string; contenuto: ReactNode }[] = [
  {
    id: 'guida-cosa',
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
    id: 'guida-flusso',
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
    id: 'guida-progetti',
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
    id: 'guida-layer',
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
    id: 'guida-istruzioni',
    titolo: '5 · Istruzioni d\u2019uso — definizione di ogni indice',
    contenuto: (
      <>
        <p>
          Qui sotto trovi <strong>ogni indice calcolato dall&apos;app</strong> e ogni gruppo di dati: cosa significa, la formula con cui
          viene calcolato, che cosa indica ai fini della conformit&agrave; e dove/in che modo inserirlo nell&apos;interfaccia.
        </p>

        <SottoTitolo>Scheda 1 — Indici edificatori (Parametri PRG / NTA)</SottoTitolo>
        <Termine
          simbolo="Uf"
          nome="indice di utilizzazione fondiaria"
          definizione="Quanti metri quadri di Superficie Lorda di Pavimento (SLP) si possono realizzare per ogni metro quadro di superficie fondiaria del lotto."
          formula="SLP max = Sf × Uf"
          indica="La densit&agrave; edilizia in termini di superficie calpestabile ammessa sul lotto."
          inserimento="Scheda 1, sezione &laquo;Parametri edificatori&raquo;, campo mq SLP/mq Sf. Lascialo disattivato se il tuo PRG usa solo gli indici volumetrici."
        />
        <Termine
          simbolo="Ut"
          nome="indice di utilizzazione territoriale"
          definizione="Come l'Uf, ma rapportato alla superficie territoriale (St), cio&egrave; all'intero ambito compresi spazi pubblici e dotazioni."
          formula="SLP max = St × Ut"
          indica="La densit&agrave; edilizia rapportata all'intera zona/lotto territoriale."
          inserimento="Scheda 1, sezione &laquo;Parametri edificatori&raquo;. Viene usato solo se l'Uf non &egrave; valorizzato."
        />
        <Termine
          simbolo="If"
          nome="indice di fabbricabilit&agrave; fondiaria"
          definizione="Quanti metri cubi di volume edilizio si possono realizzare per ogni metro quadro di superficie fondiaria."
          formula="V max = Sf × If"
          indica="Il tetto di volume (edificabilit&agrave; volumetrica) ammesso sul lotto."
          inserimento="Scheda 1, sezione &laquo;Parametri edificatori&raquo;, campo mc/mq Sf."
        />
        <Termine
          simbolo="It"
          nome="indice di fabbricabilit&agrave; territoriale"
          definizione="Come l'If, ma rapportato alla superficie territoriale."
          formula="V max = St × It"
          indica="Il tetto di volume sull'intero ambito territoriale."
          inserimento="Scheda 1, sezione &laquo;Parametri edificatori&raquo;. Usato solo se l'If non &egrave; valorizzato."
        />
        <Termine
          simbolo="H virt."
          nome="altezza virtuale di conversione"
          definizione="Altezza convenzionale usata dall'app per convertire SLP in volume e viceversa, quando il PRG valorizza solo uno dei due limiti."
          formula="V = SLP × H virt.  (default 3,00 m)"
          indica="Se manca SLP max o V max, l'app lo ricava dall'altro con questa altezza."
          inserimento="Scheda 1, sezione &laquo;Parametri edificatori&raquo;: 3,00 m se le NTA non indicano diversamente."
        />
        <Termine
          simbolo="Rc"
          nome="rapporto di copertura massimo"
          definizione="Percentuale massima della superficie fondiaria coperta da edifici."
          formula="Rc = (Sc / Sf) × 100 ≤ Rc max"
          indica="Quanto suolo il progetto pu&ograve; occupare: un valore alto = lotto molto coperto."
          inserimento="Scheda 1 (limite in %) e Scheda 2 (campo Superficie coperta Sc). L'app confronta i due."
        />
        <Termine
          simbolo="Ip"
          nome="indice di permeabilit&agrave; minimo"
          definizione="Percentuale minima di suolo drenante: ogni area esterna pesa per il suo coefficiente di permeabilit&agrave; (1 = prato, 0,5 = grigliato, 0 = impermeabile)."
          formula="Ip = (Σ area_i × coeff_i / Sf) × 100 ≥ Ip min"
          indica="La capacit&agrave; del lotto di drenare l'acqua piovana; sotto la soglia &egrave; NON CONFORME."
          inserimento="Scheda 1 (limite in %). Scheda 2, tabella &laquo;Aree permeabili&raquo;: aggiungi una riga per ogni superficie con descrizione, area mq e coefficiente da 0 a 1."
        />
        <Termine
          simbolo="H max"
          nome="altezza massima dell'edificio"
          definizione="Altezza massima della sagoma dell'edificio ammessa dalle NTA."
          formula="H progetto ≤ H max"
          indica="Il limite volumetrico verticale fisico."
          inserimento="Scheda 1 (limite) e Scheda 2, sezione &laquo;Sagoma e distanze&raquo;, campo altezza progetto."
        />
        <Termine
          simbolo="D c / D f / D s"
          nome="distanze minime da confini, fabbricati e strade"
          definizione="Distacchi minimi richiesti dalle NTA rispettivamente dai confini del lotto, dagli altri fabbricati e dalle strade."
          formula="D ≥ D min (per ciascuna delle tre)"
          indica="Rispetto dei rapporti di vicinato e della sicurezza del progetto."
          inserimento="Scheda 1 (i tre limiti) e Scheda 2, sezione &laquo;Sagoma e distanze&raquo;: distanza confini, distanza fabbricati, distanza strade."
        />

        <SottoTitolo>Scheda 1 — Regole di scomputo SLP</SottoTitolo>
        <Termine
          simbolo="Scomputi"
          nome="superfici non conteggiate nella SLP netta"
          definizione="Parti della SLP lorda che le NTA escludono dal conteggio: murature perimetrali eccedenti, vani scala e ascensori, locali interrati e accessori, logge e porticati."
          formula="SLP netta = SLP lorda − (muri + scale + interrati + logge ammesse)"
          indica="Quanto spazio interno non &laquo;consuma&raquo; edificabilit&agrave;."
          inserimento="Scheda 1: attiva/disattiva le caselle per murature, vani scala e interrati secondo le tue NTA. Scheda 2, tabella &laquo;Piani&raquo;: inserisci per ogni piano le superfici di ciascun tipo."
        />
        <Termine
          simbolo="Tetto logge"
          nome="tetto massimo di logge e porticati"
          definizione="Percentuale della SLP lorda oltre la quale le logge vengono tassate, cio&egrave; tornano a contare nella SLP netta."
          formula="tetto mq = SLP lorda × 15% (esempio) — l'eccedenza &egrave; tassata"
          indica="Limita l'uso di logge e porticati come surface-liveller."
          inserimento="Scheda 1, campo &laquo;Tetto max logge/porticati (% SLP)&raquo;. Le superfici di logge si inseriscono in Scheda 2 per ogni piano."
        />

        <SottoTitolo>Scheda 1 — Destinazioni d'uso e standard</SottoTitolo>
        <Termine
          simbolo="Mix"
          nome="quote minime e massime per destinazione"
          definizione="Per ogni destinazione (residenziale, commerciale, direzionale, produttivo, turistico) il PRG pu&ograve; imporre una quota percentuale minima e massima della SLP netta."
          formula="quota% = SLP netta,dest / SLP netta,tot × 100"
          indica="Il mix funzionale ammesso nella zona: fuori dalle quote &egrave; NON CONFORME."
          inserimento="Scheda 1, tabella &laquo;Destinazioni&raquo;: spunta &laquo;ammessa&raquo;, imposta quota min e max in %. I dati reali arrivano dalla SLP inserita in Scheda 2."
        />
        <Termine
          simbolo="Ab teor."
          nome="abitanti teorici (solo residenziale)"
          definizione="Popolazione insediabile calcolata dalla SLP residenziale netta con il parametro mq SLP per abitante del PRG."
          formula="abitanti teorici = SLP netta,res / mq SLP per ab (es. 35)"
          indica="La dimensione demografica di riferimento per il dimensionamento degli standard."
          inserimento="Scheda 1, destinazione residenziale: campo &laquo;mq SLP per abitante&raquo; (tipico 35). Non si inserisce nulla in Scheda 2: l'app lo calcola."
        />
        <Termine
          simbolo="Std 1444"
          nome="standard urbanistici D.M. 1444/68"
          definizione="Aree per servizi di quartiere (istruzione, spazi pubblici, parcheggi, verde) da garantire: per la residenzia mq per abitante, per le altre destinazioni una percentuale della SLP."
          formula="res: ab teorici × mq/ab  ·  altre: SLP netta × %SLP"
          indica="Il fabbisogno minimo di aree pubbliche generato dal progetto."
          inserimento="Scheda 1, per ogni destinazione: &laquo;standard min mq/ab&raquo; (es. 18) o &laquo;% della SLP&raquo; (es. 80%). Le aree effettivamente cedute si inseriscono in Scheda 2, sezione &laquo;Standard ceduti&raquo;."
        />
        <Termine
          simbolo="Pubblici / Verde"
          nome="ripartizione degli standard"
          definizione="Percentuale del fabbisogno standard che deve essere coperta da parcheggi pubblici e da verde/servizi."
          formula="fabb. parcheggi = fabb. totale × %  ·  fabb. verde/servizi = fabb. totale × %"
          indica="Le due componenti separate del fabbisogno, verificate contro le cessioni."
          inserimento="Scheda 1, per ogni destinazione: campi &laquo;% parcheggi pubblici su standard&raquo; e &laquo;% verde/servizi su standard&raquo; (tipico 50%)."
        />
        <Termine
          simbolo="Monet."
          nome="monetizzazione degli standard"
          definizione="Meccanismo per cui il deficit di aree standard non cedute pu&ograve; essere pagato in denaro, se il PRG lo consente."
          formula="importo = deficit mq × tariffa €/mq (media ponderata per destinazione)"
          indica="Se il deficit &egrave; positivo e la monetizzazione non &egrave; ammessa, il progetto &egrave; NON CONFORME."
          inserimento="Scheda 1, per ogni destinazione: casella &laquo;monetizzazione ammessa&raquo; e campo &laquo;tariffa €/mq&raquo; (es. 180). L'importo appare in Scheda 3."
        />

        <SottoTitolo>Scheda 1 — Parcheggi privati (L. 122/89)</SottoTitolo>
        <Termine
          simbolo="L. 122/89"
          nome="parcheggio pertinenziale"
          definizione="Ogni nuovo mc di volume genera un obbligo di superficie parcheggio privata di pertinenza."
          formula="fabb. = V progetto × 0,10 mq/mc (1 mq ogni 10 mc)"
          indica="L'obbligo di stalli privati da realizzare nel lotto o tramite adempimento alternativo."
          inserimento="Scheda 1, campo &laquo;mq ogni mc&raquo; (default 0,10). Scheda 2, sezione &laquo;Parcheggi privati&raquo;: superficie stalli mq e corsie di manovra mq."
        />
        <Termine
          simbolo="Manovra %"
          nome="quota massima di corsie di manovra"
          definizione="Percentuale massima della superficie parcheggio privata che pu&ograve; essere corsie di manovra invece che stalli."
          formula="% manovra = manovra / (stalli + manovra) × 100 ≤ max (es. 40%)"
          indica="Impedisce di &laquo;gonfiare&raquo; il parcheggio con corsie che non sono stalli."
          inserimento="Scheda 1, campo &laquo;max % manovra&raquo; (tipico 40)."
        />
        <Termine
          simbolo="Extra comm."
          nome="dotazione aggiuntiva commerciale"
          definizione="Percentuale aggiuntiva di parcheggio privato dovuta per la SLP commerciale, se prevista."
          formula="extra = SLP netta,comm × %SLP"
          indica="I parcheggi extra per la spesa/commercio oltre il rapporto base."
          inserimento="Scheda 1, campo &laquo;dotazione aggiuntiva commerciale (% SLP)&raquo;; di solito 0 se le NTA non la prevedono."
        />

        <SottoTitolo>Scheda 2 — Dati geometrici del progetto</SottoTitolo>
        <Termine
          simbolo="St / Sf / Sc"
          nome="superficie territoriale, fondiaria e coperta"
          definizione="St &egrave; l'area dell'intero lotto/ambito; Sf &egrave; l'area fondata su cui si calcolano Uf e If; Sc &egrave; l'area coperta dagli edifici."
          formula="Rc = Sc/Sf × 100"
          indica="Sono i denominatori di quasi tutti gli indici: vanno inseriti con cura."
          inserimento="Scheda 2, sezione &laquo;Superfici del lotto&raquo;, oppure importati dai layer URB_ST, URB_SF e URB_SC del file DXF."
        />
        <Termine
          simbolo="Piani"
          nome="SLP lorda per piano e destinazione"
          definizione="Per ogni piano (SOTT, S1, PT, P1, P2…) la superficie lorda suddivisa per destinazione d'uso."
          formula="SLP lorda,tot = Σ piani × destinazioni"
          indica="&Egrave; il punto di partenza di tutti i calcoli: capacit&agrave;, mix, standard."
          inserimento="Scheda 2, tabella &laquo;Piani&raquo;: aggiungi/rimuovi piani con i pulsanti e compila le colonne per destinazione; gli scomputi vanno nelle colonne accanto."
        />
        <Termine
          simbolo="Standard ceduti"
          nome="aree in cessione o asservimento"
          definizione="Aree che il progetto mette a disposizione del Comune: verde pubblico, attrezzature/servizi, parcheggi pubblici."
          formula="confronto: ceduto ≥ fabbisogno calcolato"
          indica="Se cedi meno del fabbisogno nasce il deficit (e la possibile monetizzazione)."
          inserimento="Scheda 2, sezione &laquo;Standard in cessione&raquo;: verde mq, servizi mq, parcheggi pubblici mq. Oppure layer URB_STD_* nel DXF."
        />

        <SottoTitolo>Scheda 3 — Cosa calcola l'app (riepilogo)</SottoTitolo>
        <p>
          Non serve inserire nulla in Scheda 3: l&apos;app ricalcola tutto a ogni modifica. In particolare: SLP lorda &rarr; scomputi
          ammessi (con tetto logge) &rarr; <strong>SLP netta</strong> ripartita per destinazione &rarr; <strong>volume</strong> = SLP netta &times; H virt. &rarr;
          confronto con SLP max e V max &rarr; <strong>mix funzionale</strong> &rarr; <strong>abitanti teorici e standard</strong> &rarr; deficit e
          <strong> monetizzazione</strong> &rarr; <strong>parcheggi L. 122/89</strong> con % manovra &rarr; <strong>Rc, Ip, altezza e distanze</strong>.
        </p>
      </>
    ),
  },
  {
    id: 'guida-risultati',
    titolo: '6 · Come leggere i risultati',
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
    id: 'guida-suggerimenti',
    titolo: '7 · Suggerimenti pratici',
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
  const corpoRef = useRef<HTMLDivElement>(null);

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

  const vaiA = (id: string) => {
    corpoRef.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="guida-backdrop" onClick={onClose}>
      <div className="guida-modale" role="dialog" aria-modal aria-label="Guida all'applicazione" onClick={(e) => e.stopPropagation()}>
        <header className="guida-head">
          <h2><BookOpen size={18} /> Guida all&apos;applicazione</h2>
          <button ref={chiudiRef} className="btn-icone" title="Chiudi guida (Esc)" onClick={onClose}><X size={16} /></button>
        </header>
        <nav className="guida-nav" aria-label="Indice della guida">
          {NAV.map((n) => (
            <button key={n.id} className="guida-nav-btn" onClick={() => vaiA(n.id)}>{n.label}</button>
          ))}
        </nav>
        <div className="guida-corpo" ref={corpoRef}>
          {SEZIONI.map((s) => (
            <section key={s.id} id={s.id}>
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
