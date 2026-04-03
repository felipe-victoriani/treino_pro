/* ============================================================
   TREINO PRO - IMC (Aluno)
   ============================================================ */

/* Estado do IMC */
let imcState = {
  peso: null,
  altura: null,
  imc: null,
};

/**
 * Abre o modal de IMC
 */
function openIMCModal() {
  const modal = document.getElementById("modal-imc");
  if (!modal) return;

  // Pré-preencher se já tem dados
  const data = window.currentUserData;
  if (data?.peso) document.getElementById("imc-peso").value = data.peso;
  if (data?.altura) document.getElementById("imc-altura").value = data.altura;

  showIMCForm();
  modal.classList.add("open");
}

/** Fecha o modal de IMC */
function closeIMCModal() {
  const modal = document.getElementById("modal-imc");
  if (modal) modal.classList.remove("open");
}

/** Mostra a view do formulário */
function showIMCForm() {
  toggleElement("imc-form-view", true);
  toggleElement("imc-result-view", false);
}

/** Mostra o resultado do IMC */
function showIMCResult(imc, peso, altura) {
  toggleElement("imc-form-view", false);
  toggleElement("imc-result-view", true);

  const { classe, cor, emoji } = classificarIMC(imc);

  document.getElementById("imc-result-value").textContent = formatIMC(imc);
  document.getElementById("imc-result-class").textContent =
    `${emoji} ${classe}`;
  document.getElementById("imc-result-class").style.color = cor;
  document.getElementById("imc-peso-display").textContent = `${peso} kg`;
  document.getElementById("imc-altura-display").textContent = `${altura} m`;

  // Barra de progresso (15 = mínimo, 45 = máximo para a barra)
  const min = 15,
    max = 45;
  const pct = Math.min(100, Math.max(0, ((imc - min) / (max - min)) * 100));
  document.getElementById("imc-bar").style.width = `${pct}%`;
  document.getElementById("imc-bar").style.background = cor;
}

/**
 * Calcula o IMC
 * @param {number} peso   - em kg
 * @param {number} altura - em metros
 * @returns {number}
 */
function calcularIMC(peso, altura) {
  if (!peso || !altura || altura <= 0) return null;
  return parseFloat((peso / (altura * altura)).toFixed(1));
}

/**
 * Classifica o IMC
 * @param {number} imc
 * @returns {{ classe: string, cor: string, emoji: string }}
 */
function classificarIMC(imc) {
  if (imc < 18.5)
    return { classe: "Abaixo do peso", cor: "#64B5F6", emoji: "⚠️" };
  if (imc < 25) return { classe: "Peso normal", cor: "#81C784", emoji: "✅" };
  if (imc < 30) return { classe: "Sobrepeso", cor: "#FFB74D", emoji: "⚠️" };
  if (imc < 35) return { classe: "Obesidade I", cor: "#FF8A65", emoji: "🔴" };
  if (imc < 40) return { classe: "Obesidade II", cor: "#FF5252", emoji: "🔴" };
  return { classe: "Obesidade III", cor: "#FF1744", emoji: "🔴" };
}

/**
 * Salva dados de IMC no Firebase
 */
async function salvarIMC() {
  if (!imcState.imc || !window.currentUser) {
    showToast("Calcule o IMC primeiro", "warning");
    return;
  }

  const uid = window.currentUser.uid;
  const btn = document.getElementById("imc-salvar");
  btn.disabled = true;
  btn.textContent = "Salvando...";

  try {
    const updates = {
      peso: imcState.peso,
      altura: imcState.altura,
      imc: imcState.imc,
      imcAtualizadoEm: Date.now(),
    };

    await Promise.all([
      db.ref(`users/${uid}`).update(updates),
      db.ref(`alunos/${uid}`).update(updates),
    ]);

    // Atualiza dados locais
    if (window.currentUserData) {
      window.currentUserData.peso = imcState.peso;
      window.currentUserData.altura = imcState.altura;
      window.currentUserData.imc = imcState.imc;
    }

    showToast("IMC salvo com sucesso!", "success");
    closeIMCModal();

    // Atualiza exibição no perfil
    renderIMCPerfil(imcState.imc, imcState.peso, imcState.altura);

    // Atualiza quick card
    const quickIMC = document.getElementById("quick-imc-info");
    if (quickIMC) quickIMC.textContent = `IMC ${formatIMC(imcState.imc)}`;
  } catch (error) {
    showToast("Erro ao salvar IMC. Tente novamente.", "error");
    console.error("[IMC] Erro ao salvar:", error);
  } finally {
    btn.disabled = false;
    btn.textContent = "Salvar dados";
  }
}

/**
 * Renderiza o IMC na seção de perfil
 */
function renderIMCPerfil(imc, peso, altura) {
  const container = document.getElementById("imc-display-perfil");
  if (!container) return;

  if (!imc) {
    container.innerHTML = `
      <div class="empty-state" style="padding:24px;">
        <div class="empty-state-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" style="color:var(--purple-500)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
        </div>
        <h3>IMC não calculado</h3>
        <p>Clique em "Atualizar" para calcular seu IMC</p>
      </div>`;
    return;
  }

  const { classe, cor, emoji } = classificarIMC(imc);
  const min = 15,
    max = 45;
  const pct = Math.min(100, Math.max(0, ((imc - min) / (max - min)) * 100));

  container.innerHTML = `
    <div style="text-align:center;padding:16px 0;">
      <div style="font-size:3rem;font-weight:900;background:var(--gradient-primary);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${formatIMC(imc)}</div>
      <div style="font-size:1rem;font-weight:700;color:${cor};margin-bottom:12px;">${emoji} ${classe}</div>
      <div class="imc-bar-container">
        <div class="imc-bar-fill" style="width:${pct}%;background:${cor}"></div>
      </div>
      <div class="imc-info-grid" style="margin-top:12px;">
        <div class="imc-info-card"><div class="label">Peso</div><div class="value">${peso} kg</div></div>
        <div class="imc-info-card"><div class="label">Altura</div><div class="value">${altura} m</div></div>
      </div>
    </div>`;
}

/* ---- Event listeners do modal ---- */
document.addEventListener("DOMContentLoaded", () => {
  // Fechar modal
  document
    .getElementById("close-imc")
    ?.addEventListener("click", closeIMCModal);
  document.getElementById("modal-imc")?.addEventListener("click", (e) => {
    if (e.target.id === "modal-imc") closeIMCModal();
  });

  // Calcular IMC
  document.getElementById("calcular-imc-btn")?.addEventListener("click", () => {
    // Normaliza vírgula para ponto e remove espaços
    const pesoRaw = document
      .getElementById("imc-peso")
      .value.trim()
      .replace(",", ".");
    const alturaRaw = document
      .getElementById("imc-altura")
      .value.trim()
      .replace(",", ".");

    const pesoVal = parseFloat(pesoRaw);
    let alturaVal = parseFloat(alturaRaw);

    if (!pesoVal || pesoVal < 20 || pesoVal > 300) {
      showToast("Informe um peso válido (20-300 kg)", "error");
      return;
    }

    // Aceita altura em centímetros (ex: 175) e converte para metros automaticamente
    if (alturaVal >= 100 && alturaVal <= 250) {
      alturaVal = alturaVal / 100;
      document.getElementById("imc-altura").value = alturaVal.toFixed(2);
    }

    if (!alturaVal || alturaVal < 1.0 || alturaVal > 2.5) {
      showToast("Informe uma altura válida (ex: 1.75 ou 175)", "error");
      return;
    }

    // Arredonda para 2 casas (evita 1.699999...)
    alturaVal = parseFloat(alturaVal.toFixed(2));
    const pesoFinal = parseFloat(pesoVal.toFixed(1));

    const imc = calcularIMC(pesoFinal, alturaVal);
    imcState = { peso: pesoFinal, altura: alturaVal, imc };
    showIMCResult(imc, pesoFinal, alturaVal);
  });

  // Recalcular
  document
    .getElementById("imc-recalcular")
    ?.addEventListener("click", showIMCForm);

  // Salvar
  document.getElementById("imc-salvar")?.addEventListener("click", salvarIMC);
});
