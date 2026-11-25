import type { DatiProgetto, ProfiloPRG } from '../types/urbanistica';

const CHIAVE = 'calcoli-urbanistici-biblioteca-v2';
const CHIAVE_LEGACY = 'calcoli-urbanistici-stato-v1';

export interface ProgettoSalvato {
  id: string;
  aggiornatoIl: string;
  prg: ProfiloPRG;
  dati: DatiProgetto;
}

export interface Biblioteca {
  versione: 2;
  attivoId: string | null;
  progetti: ProgettoSalvato[];
}

export interface Toast {
  messaggio: string;
  tipo: 'ok' | 'ko';
}

export function leggiBiblioteca(): Biblioteca {
  try {
    const raw = localStorage.getItem(CHIAVE);
    if (raw) {
      const b = JSON.parse(raw) as Biblioteca;
      if (b?.versione === 2 && Array.isArray(b.progetti)) {
        return { ...b, progetti: b.progetti.filter((p) => p?.prg?.parametriEdificatori && Array.isArray(p.dati?.piani)) };
      }
    }
  } catch {
    window.alert("Dati salvati nel browser illeggibili: verranno ricreati.");
  }
  try {
    const rawLegacy = localStorage.getItem(CHIAVE_LEGACY);
    if (rawLegacy) {
      const st = JSON.parse(rawLegacy) as { prg?: ProfiloPRG; dati?: DatiProgetto; salvatoIl?: string };
      if (st?.prg?.parametriEdificatori && Array.isArray(st.dati?.piani)) {
        const bib: Biblioteca = {
          versione: 2,
          attivoId: 'prj-legacy',
          progetti: [{ id: 'prj-legacy', aggiornatoIl: st.salvatoIl ?? new Date().toISOString(), prg: st.prg, dati: st.dati }],
        };
        localStorage.setItem(CHIAVE, JSON.stringify(bib));
        localStorage.removeItem(CHIAVE_LEGACY);
        return bib;
      }
    }
  } catch {
    return { versione: 2, attivoId: null, progetti: [] };
  }
  return { versione: 2, attivoId: null, progetti: [] };
}

export function salvaBiblioteca(b: Biblioteca): void {
  try {
    localStorage.setItem(CHIAVE, JSON.stringify(b));
  } catch {
    window.alert('Impossibile salvare nel browser (spazio esaurito o navigazione privata).');
  }
}

export function salvaProgetto(b: Biblioteca, id: string, prg: ProfiloPRG, dati: DatiProgetto): Biblioteca {
  const aggiornatoIl = new Date().toISOString();
  const esistente = b.progetti.some((p) => p.id === id);
  const progetti = esistente
    ? b.progetti.map((p) => (p.id === id ? { ...p, prg, dati, aggiornatoIl } : p))
    : [...b.progetti, { id, prg, dati, aggiornatoIl }];
  const nuova: Biblioteca = { versione: 2, attivoId: id, progetti };
  salvaBiblioteca(nuova);
  return nuova;
}

export function eliminaProgetto(b: Biblioteca, id: string): Biblioteca {
  const progetti = b.progetti.filter((p) => p.id !== id);
  const attivoId = b.attivoId === id ? null : b.attivoId;
  const nuova: Biblioteca = { versione: 2, attivoId, progetti };
  salvaBiblioteca(nuova);
  return nuova;
}

export function nuovoId(): string {
  return `prj-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
  const nome = `Progetto_Urbanistico_${dati.nomeProgetto.replace(/[^a-zA-Z0-9]+/gu, '_')}.json`;
  scaricaJson(nome, JSON.stringify({ versione: 1, salvatoIl: new Date().toISOString(), prg, dati }, null, 2));
  return nome;
}

export async function importaProgettoCompleto(file: File): Promise<{ prg: ProfiloPRG; dati: DatiProgetto }> {
  const st = JSON.parse(await file.text()) as { versione?: number; prg?: ProfiloPRG; dati?: DatiProgetto };
  if (!st?.prg?.parametriEdificatori || !st.prg.destinazioni || !Array.isArray(st.dati?.piani)) {
    throw new Error('File non riconosciuto: serve un JSON esportato dall\'app');
  }
  return { prg: st.prg, dati: st.dati };
}
