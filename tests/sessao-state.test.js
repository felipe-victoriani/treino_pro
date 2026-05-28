/**
 * tests/sessao-state.test.js
 *
 * Testa o gerenciamento de estado local de sessão (_getSessaoLetra, _sessaoLocal).
 * Foca nos invariantes da estrutura de dados, sem DOM e sem Firebase.
 */

describe("_getSessaoLetra — estado de sessão por letra", () => {
  beforeEach(() => {
    // Garante estado limpo: zera as letras usadas nos testes
    ["A", "B", "C"].forEach((l) => {
      const s = global._getSessaoLetra(l);
      s.exerciciosCompletos = {};
      s.seriesCompletas = {};
    });
  });

  test("retorna objeto com chaves exerciciosCompletos e seriesCompletas para letra nova", () => {
    const s = global._getSessaoLetra("A");
    expect(s).toHaveProperty("exerciciosCompletos");
    expect(s).toHaveProperty("seriesCompletas");
    expect(typeof s.exerciciosCompletos).toBe("object");
    expect(typeof s.seriesCompletas).toBe("object");
  });

  test("retorna o MESMO objeto na segunda chamada para a mesma letra", () => {
    const s1 = global._getSessaoLetra("A");
    const s2 = global._getSessaoLetra("A");
    expect(s1).toBe(s2); // referência idêntica
  });

  test("letras diferentes retornam objetos INDEPENDENTES", () => {
    const sA = global._getSessaoLetra("A");
    const sB = global._getSessaoLetra("B");
    expect(sA).not.toBe(sB);
  });

  test("modificar estado da letra A NÃO afeta letra B", () => {
    const sA = global._getSessaoLetra("A");
    const sB = global._getSessaoLetra("B");

    sA.exerciciosCompletos["ex-1"] = true;
    sA.seriesCompletas["ex-1"] = { s0: true };

    expect(sB.exerciciosCompletos).not.toHaveProperty("ex-1");
    expect(sB.seriesCompletas).not.toHaveProperty("ex-1");
  });

  test("estado persiste dentro do mesmo teste após múltiplas chamadas", () => {
    const s = global._getSessaoLetra("C");
    s.exerciciosCompletos["ex-99"] = true;

    const s2 = global._getSessaoLetra("C");
    expect(s2.exerciciosCompletos["ex-99"]).toBe(true);
  });
});
