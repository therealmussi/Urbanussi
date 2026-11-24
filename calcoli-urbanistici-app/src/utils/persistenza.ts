import type { DatiProgetto, ProfiloPRG } from '../types/urbanistica';

const CHIAVE_STATO = 'calcoli-urbanistici-stato-v1';

export interface StatoSalvato {
  versione: 1;
  salvatoIl: string;
  prg: ProfiloPRG;
  dati: DatiProgetto;
}

export function leggiStato(): StatoSalvato | null {
  try {
    const raw = localStorage.getItem(CHIAVE_STATO);
    if (!raw) return null;
    const st = JSON.parse(raw) as StatoSalvato;
    if (st?.versione !== 1 || !st.prg?.parametriEdificatori || !Array.isArray(st.dati?.piani)) {
      return null;
    }
    return st;
  } catch {
    return null;
  }
}

export function salvaStato(prg: ProfiloPRG, dati: DatiProgetto): string {
  try {
    const st: StatoSalvato = { versione: 1, salvatoIl: new Date().toISOString(), prg, dati };
    localStorage.setItem(CHIAVE_STATO, JSON.stringify(st));
    return st.salvatoIl;
  } catch {
    return '';
  }
}

export function azzeraStato(): void {
  try {
    localStorage.removeItem(CHIAVE_STATO);
  } catch {
    window.alert('Impossibile cancellare i dati salvati nel browser.');
  }
}

function scaricaJson(nome: string, contenuto: string): void {
  const blob = new Blob([contenuto], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function esportaProgettoCompleto(prg: ProfiloPRG, dati: DatiProgetto): string {
  const nome = `Progetto_Urbanistico_${dati.nomeProgetto.replace(/[^a-zA-Z0-9]+/g, '_')}.json`;
  const st: StatoSalvato = { versione: 1, salvatoIl: new Date().toISOString(), prg, dati };
  scaricaJson(nome, JSON.stringify(st, null, 2));
  return nome;
}

export async function importaProgettoCompleto(file: File): Promise<StatoSalvato> {
  const st = JSON.parse(await file.text()) as StatoSalvato;
  if (st?.versione !== 1 || !st.prg?.parametriEdificatori || !st.prg.destinazioni || !Array.isArray(st.dati?.piani)) {
    throw new Error('File progetto non valido: serve un JSON esportato dall\'app');
  }
  salvaStato(st.prg, st.dati);
  return st;
}
