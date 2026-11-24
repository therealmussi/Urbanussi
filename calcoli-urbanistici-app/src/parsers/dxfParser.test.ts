import { describe, expect, it } from 'vitest';
import { areaPoligono, parseDxf } from './dxfParser';

const DXF_MINIMO = `0
SECTION
2
ENTITIES
0
LWPOLYLINE
8
URB_SF
90
4
70
1
10
0.0
20
0.0
10
100.0
20
0.0
10
100.0
20
50.0
10
0.0
20
50.0
0
ENDSEC
0
EOF
`;

describe('dxfParser', () => {
  it('calcola l\'area con la formula di Gauss', () => {
    expect(areaPoligono([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 50 }, { x: 0, y: 50 }])).toBeCloseTo(5000, 6);
    expect(areaPoligono([])).toBe(0);
  });

  it('mappa il layer URB_SF sulla superficie fondiaria in metri', () => {
    const esito = parseDxf(DXF_MINIMO, 'm');
    expect(esito.layerRiconosciuti).toContain('URB_SF');
    expect(esito.dati.superficieFondiaria_Sf).toBeCloseTo(5000, 6);
  });

  it('applica il fattore di scala per cm e mm', () => {
    const cm = parseDxf(DXF_MINIMO, 'cm');
    expect(cm.dati.superficieFondiaria_Sf).toBeCloseTo(5000 * 0.0001, 8);
    const mm = parseDxf(DXF_MINIMO, 'mm');
    expect(mm.dati.superficieFondiaria_Sf).toBeCloseTo(5000 * 0.000001, 10);
  });

  it('restituisce log vuoto per un file senza entità URB_* e non lancia errori', () => {
    const vuoto = '0\nSECTION\n2\nENTITIES\n0\nENDSEC\n0\nEOF\n';
    const esito = parseDxf(vuoto, 'm');
    expect(esito.totaleEntita).toBe(0);
    expect(esito.layerIgnorati).toHaveLength(0);
  });

  it('lancia errore su contenuto non DXF', () => {
    expect(() => parseDxf('questo non è un dxf', 'm')).toThrow();
  });
});
