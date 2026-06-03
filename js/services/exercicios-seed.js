/* ============================================================
   TREINO PRO — Seed de Exercícios (schema v2)
   Schema compatível com importar-exercicios.html e treino-ia.service.js.

   Campos obrigatórios:
     nome_original      — nome do exercício
     musculo_principal  — "Peitoral" | "Costas" | "Pernas" | "Ombros" |
                          "Bíceps" | "Tríceps" | "Abdômen" | "Glúteos"
     equipamento        — "Barra" | "Halteres" | "Cabo / Pulley" | "Máquina" |
                          "Peso Corporal" | "Barra W" | "Kettlebell" | "Sem Equipamento"
     nivel              — "Iniciante" | "Intermediário" | "Avançado"
     mecanica           — "Composto" | "Isolador"
     forca              — "Empurrar" | "Puxar" | "Estático"

   COMO USAR:
   1. Abra o console do navegador com o app carregado e logado
   2. Execute: seedExercicios()       → adiciona os exercícios do seed
      Execute: migrarExercicios()     → apaga TODOS os exercícios e refaz do zero
   ============================================================ */

const EXERCICIOS_SEED = [
  /* ───────────── PEITORAL (10) ──────────────────────────── */
  {
    nome_original: "Supino Reto com Barra",
    musculo_principal: "Peitoral",
    musculo_secundario: "Tríceps, Ombros",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Deite no banco, pegue a barra com pegada levemente mais larga que os ombros. Desça até o peito tocar levemente, expire e empurre até os cotovelos ficarem quase estendidos. Mantenha os pés no chão e os glúteos apoiados.",
  },
  {
    nome_original: "Supino Inclinado com Halteres",
    musculo_principal: "Peitoral",
    musculo_secundario: "Tríceps, Ombros",
    equipamento: "Halteres",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Banco inclinado a 30-45°. Segure os halteres na altura do peito alto, cotovelos levemente curvados. Empurre para cima convergindo as mãos. Controla a descida em 2-3 segundos.",
  },
  {
    nome_original: "Supino Declinado com Barra",
    musculo_principal: "Peitoral",
    musculo_secundario: "Tríceps",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Banco declinado. Pegada na barra um pouco mais larga que os ombros. Desça a barra até a parte baixa do peito e empurre explosivamente para cima. Foca a contração no peitoral inferior.",
  },
  {
    nome_original: "Crucifixo com Halteres",
    musculo_principal: "Peitoral",
    musculo_secundario: "Bíceps",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Deitado no banco plano. Segure os halteres com palmas voltadas para dentro. Abra os braços em arco mantendo leve flexão nos cotovelos. Sinta o esticamento no peito e retorne comprimindo.",
  },
  {
    nome_original: "Crossover no Cabo",
    musculo_principal: "Peitoral",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Posicione as roldanas altas. Segure as alças, incline levemente o tronco à frente e traga as mãos em arco até se cruzarem à frente do abdômen. Mantenha cotovelos com leve flexão fixa.",
  },
  {
    nome_original: "Peck Deck (Voador na Máquina)",
    musculo_principal: "Peitoral",
    musculo_secundario: null,
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Ajuste o assento para que os cotovelos fiquem na altura dos ombros. Feche os braços à frente contraindo o peito. Abra controlando a tensão. Excelente exercício de isolamento.",
  },
  {
    nome_original: "Flexão de Braços",
    musculo_principal: "Peitoral",
    musculo_secundario: "Tríceps, Ombros",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Posição de prancha com mãos levemente abertas. Desça até o peito quase tocar o chão, cotovelos apontados para trás. Empurre voltando à posição inicial. Corpo reto o tempo todo.",
  },
  {
    nome_original: "Pull Over com Haltere",
    musculo_principal: "Peitoral",
    musculo_secundario: "Costas",
    equipamento: "Halteres",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Deite transversalmente no banco, segure um haltere com ambas as mãos acima do peito. Desça o haltere atrás da cabeça com cotovelos levemente flexionados. Sinta o esticamento e retorne.",
  },
  {
    nome_original: "Supino Inclinado com Barra",
    musculo_principal: "Peitoral",
    musculo_secundario: "Tríceps, Ombros",
    equipamento: "Barra",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Banco inclinado a 30-45°. Barra na largura dos ombros. Desça controlando até o peito superior e empurre explosivamente. Excelente para o peitoral clavicular.",
  },
  {
    nome_original: "Crossover no Cabo (Baixo para Cima)",
    musculo_principal: "Peitoral",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Avançado",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Roldanas na posição baixa. Puxe as alças de baixo para cima convergindo as mãos na altura do peito. Isola o feixe superior do peitoral. Cotovelos levemente flexionados.",
  },

  /* ───────────── COSTAS (10) ─────────────────────────────── */
  {
    nome_original: "Puxada Frontal no Pulley",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps",
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Sente-se na máquina, segure a barra larga com pegada pronada. Incline levemente o tronco para trás e puxe a barra até a clavícula. Foca no latíssimo do dorso. Retorna controlado.",
  },
  {
    nome_original: "Remada Curvada com Barra",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps, Lombar",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Pés na largura dos ombros, joelhos levemente flexionados, tronco inclinado a ~45°. Puxe a barra até o abdômen baixo, cotovelos rentes ao corpo. Expanda o peito ao puxar.",
  },
  {
    nome_original: "Remada Sentada no Cabo",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps",
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Sente-se na máquina, pés apoiados. Puxe o triângulo/barra até o abdômen, retrocedendo os cotovelos ao máximo. Mantenha o tronco ereto e o peito aberto. Controla a volta.",
  },
  {
    nome_original: "Barra Fixa (Pull-up)",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps, Ombros",
    equipamento: "Peso Corporal",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Pegada pronada (palmas para frente) levemente mais larga que os ombros. Puxe o corpo até o queixo passar a barra. Retorna de forma controlada. Não balance o corpo. Foca no latíssimo.",
  },
  {
    nome_original: "Remada Unilateral com Haltere",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Apoie o joelho e mão no banco. Puxe o haltere até o quadril, cotovelo paralelo ao corpo. Mantenha o tronco paralelo ao chão. Foca unilateralmente a lombar e o dorsal.",
  },
  {
    nome_original: "Levantamento Terra (Deadlift)",
    musculo_principal: "Costas",
    musculo_secundario: "Glúteos, Pernas, Lombar",
    equipamento: "Barra",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Pés na largura do quadril, barra sobre os pés. Agache pegando a barra, coluna neutra. Empurre o chão e estenda quadril e joelhos simultaneamente. Barra na linha das pernas. Não arredonde a lombar.",
  },
  {
    nome_original: "Pulldown com Triângulo",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps",
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Mesmo movimento da puxada frontal, mas com alça triangular (pegada neutra). Puxe até o peito, cotovelos apontando para baixo. Isola bem o latíssimo com menor ativação do bíceps.",
  },
  {
    nome_original: "Remada Máquina (Chest Supported)",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps, Romboides",
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Peito apoiado no suporte da máquina, handles em pegada neutra. Puxe cruzando os cotovelos para trás. O apoio elimina compensação lombar. Ótimo para iniciantes e lesionados.",
  },
  {
    nome_original: "Remada com Haltere no Cabo",
    musculo_principal: "Costas",
    musculo_secundario: "Bíceps",
    equipamento: "Cabo / Pulley",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Roldana baixa. Em pé ou sentado, puxe a alça unilateralmente em direção ao quadril. Mantenha o cotovelo próximo ao corpo e gire levemente o tronco ao puxar. Isola o grande dorsal.",
  },
  {
    nome_original: "Hiperextensão Lombar",
    musculo_principal: "Costas",
    musculo_secundario: "Glúteos",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Posicione os quadris no suporte do banco romano. Desça o tronco à frente e suba contraindo a lombar. Não hiperextenda. Pode segurar um disco no peito para aumentar a dificuldade.",
  },

  /* ───────────── PERNAS (10) ─────────────────────────────── */
  {
    nome_original: "Agachamento Livre",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos, Lombar",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Barra na parte alta das trapézios. Pés na largura dos ombros ou levemente mais abertos. Desça controlando joelhos alinhados com pés. Desça até coxas paralelas ao chão. Empurre o chão para subir.",
  },
  {
    nome_original: "Leg Press 45°",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos",
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Deite na máquina, pés na plataforma na largura dos ombros. Desça flexionando joelhos até 90°. Empurre a plataforma sem travar os joelhos no topo. Controla a descida.",
  },
  {
    nome_original: "Extensão de Pernas",
    musculo_principal: "Pernas",
    musculo_secundario: null,
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Ajuste a máquina: encosto e roletes nas posições corretas. Estenda as pernas até quase o total, segure 1s no topo. Controla a volta. Isolamento do quadríceps.",
  },
  {
    nome_original: "Flexão de Pernas (Cadeira Flexora)",
    musculo_principal: "Pernas",
    musculo_secundario: null,
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Deitado na máquina, rolete no tendão calcâneo. Flexione os joelhos trazendo o calcanhar em direção ao glúteo. Segure 1s e retorne controlado. Isola os isquiotibiais.",
  },
  {
    nome_original: "Agachamento Sumô com Haltere",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos, Adutores",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Pés bem abertos, pontas para fora. Segure um haltere entre as pernas. Agache mantendo joelhos alinhados com os pés. Ativa glúteos e adutores além do quadríceps.",
  },
  {
    nome_original: "Afundo (Lunges) com Halteres",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Em pé com halteres. Avance um passo à frente e desça até o joelho traseiro quase tocar o chão. Joelho da frente não ultrapassa os dedos. Volte e repita com a outra perna.",
  },
  {
    nome_original: "Elevação de Panturrilha em Pé",
    musculo_principal: "Pernas",
    musculo_secundario: null,
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Posicione os ombros sob os suportes. Eleve os calcanhares o máximo possível contraindo o sóleo e gastrocnêmio. Segure 2s no topo. Desça abaixo do nível da plataforma para esticar.",
  },
  {
    nome_original: "Agachamento Búlgaro",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos",
    equipamento: "Halteres",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Pé traseiro apoiado num banco. Desça com a perna da frente até 90°. Mantenha o tronco ereto. Excelente para quadrícep, glúteo e equilíbrio. Segure halteres para sobrecarga.",
  },
  {
    nome_original: "Cadeira Abdutora",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos",
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Sente-se na máquina, pernas posicionadas nas almofadas externas. Abra as pernas resistindo à máquina. Controle o retorno. Ativa glúteo médio e abdutor do quadril.",
  },
  {
    nome_original: "Agachamento Hack (Máquina)",
    musculo_principal: "Pernas",
    musculo_secundario: "Glúteos",
    equipamento: "Máquina",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Costas apoiadas na máquina Hack Squat. Pés na plataforma na largura dos ombros. Desça controlando até 90° e empurre de volta. Excelente para quadríceps com menor stress lombar.",
  },

  /* ───────────── OMBROS (8) ──────────────────────────────── */
  {
    nome_original: "Desenvolvimento com Halteres",
    musculo_principal: "Ombros",
    musculo_secundario: "Tríceps",
    equipamento: "Halteres",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Sentado, halteres na altura dos ombros com palmas à frente. Empurre para cima até os cotovelos quase estenderem. Desça controlado. Trabalha o deltoide anterior e medial.",
  },
  {
    nome_original: "Desenvolvimento Militar com Barra",
    musculo_principal: "Ombros",
    musculo_secundario: "Tríceps, Trapézio",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Em pé ou sentado, barra na frente dos ombros. Empurre para cima alinhando com as orelhas. Retorna controlado. Versão standing exige mais core.",
  },
  {
    nome_original: "Elevação Lateral com Halteres",
    musculo_principal: "Ombros",
    musculo_secundario: null,
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Em pé, halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros com cotovelos levemente flexionados. Evite balançar o tronco. Isola deltoide medial.",
  },
  {
    nome_original: "Elevação Frontal com Halteres",
    musculo_principal: "Ombros",
    musculo_secundario: null,
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Halteres na frente das coxas. Eleve alternadamente (ou simultaneamente) para frente até a altura dos ombros. Cotovelos levemente flexionados. Isola deltoide anterior.",
  },
  {
    nome_original: "Crucifixo Invertido (Deltoide Posterior)",
    musculo_principal: "Ombros",
    musculo_secundario: "Costas, Romboides",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Incline o tronco a ~90° ou utilize o banco em 45°. Abra os braços lateralmente contraindo as escápulas. Cotovelos levemente flexionados. Foca o deltoide posterior e romboides.",
  },
  {
    nome_original: "Encolhimento de Ombros (Shrug)",
    musculo_principal: "Ombros",
    musculo_secundario: "Trapézio",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Em pé com halteres ou barra. Eleve os ombros em direção às orelhas sem dobrar os cotovelos. Segure 1s no topo. Ativa trapezes superior. Evite rotação de ombros.",
  },
  {
    nome_original: "Elevação Lateral no Cabo",
    musculo_principal: "Ombros",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Roldana baixa, cabo na mão oposta. Eleve o braço lateralmente até a altura do ombro. Tensão constante do cabo isola o deltoide medial de forma superior ao halter.",
  },
  {
    nome_original: "Desenvolvimento Arnold",
    musculo_principal: "Ombros",
    musculo_secundario: "Tríceps",
    equipamento: "Halteres",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Inicie com palmas para dentro, cotovelos à frente. Gire os punhos para fora ao empurrar para cima (palmas para frente no topo). Retorne invertendo o movimento. Ativa todos os feixes do deltoide.",
  },

  /* ───────────── BÍCEPS (7) ──────────────────────────────── */
  {
    nome_original: "Rosca Direta com Barra",
    musculo_principal: "Bíceps",
    musculo_secundario: "Antebraços",
    equipamento: "Barra",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Em pé, barra com pegada supinada (palmas para cima). Flexione os cotovelos sem mover os ombros. Suba até 90°+, desça controlado. Cotovelos rentes ao corpo.",
  },
  {
    nome_original: "Rosca Alternada com Halteres",
    musculo_principal: "Bíceps",
    musculo_secundario: "Braquial",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Em pé ou sentado. Flexione um braço por vez, supinando o punho ao subir. Controla descida. Trabalha bíceps e braquial com amplitude maior que o martelo.",
  },
  {
    nome_original: "Rosca Concentrada",
    musculo_principal: "Bíceps",
    musculo_secundario: null,
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Sentado, cotovelo apoiado na parte interna da coxa. Curle o haltere controlando a amplitude total. Excelente isolamento do bíceps com pico de contração.",
  },
  {
    nome_original: "Rosca Martelo",
    musculo_principal: "Bíceps",
    musculo_secundario: "Braquiorradial",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Pegada neutra (palmas voltadas uma para a outra). Flexione o cotovelo sem rotar o punho. Ativa braquial, braquiorradial e bíceps. Excelente para espessura do braço.",
  },
  {
    nome_original: "Rosca Scott (Barra W)",
    musculo_principal: "Bíceps",
    musculo_secundario: null,
    equipamento: "Barra W",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Braços apoiados na almofada do banco Scott. Curle a barra EZ controlando a amplitude total. Elimina compensação de ombros. Pico de contração do bíceps.",
  },
  {
    nome_original: "Rosca no Cabo (Barra Reta)",
    musculo_principal: "Bíceps",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "Roldana baixa. Em pé, segure a barra com pegada supinada e curle até a contração máxima. Tensão constante do cabo durante toda a amplitude. Desça controlado.",
  },
  {
    nome_original: "Rosca 21 com Barra",
    musculo_principal: "Bíceps",
    musculo_secundario: null,
    equipamento: "Barra",
    nivel: "Avançado",
    mecanica: "Isolador",
    forca: "Puxar",
    instrucoes:
      "7 reps de 0 a 90°, 7 reps de 90° ao topo, 7 reps amplitude completa. Técnica de alta intensidade que esgota as fibras musculares em diferentes comprimentos.",
  },

  /* ───────────── TRÍCEPS (7) ─────────────────────────────── */
  {
    nome_original: "Tríceps Testa com Barra W",
    musculo_principal: "Tríceps",
    musculo_secundario: null,
    equipamento: "Barra W",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Deitado no banco, barra EZ acima do rosto. Flexione apenas os cotovelos abaixando em direção à testa. Empurre de volta. Não mova os ombros. Isola bem as 3 cabeças do tríceps.",
  },
  {
    nome_original: "Tríceps Pulley (Barra Reta)",
    musculo_principal: "Tríceps",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Roldana alta. Segure a barra com pegada pronada, cotovelos rentes ao corpo. Estenda os braços empurrando para baixo. Segure 1s. Cotovelos fixos. Ativa cabeça lateral e longa.",
  },
  {
    nome_original: "Tríceps Mergulho no Banco (Dips)",
    musculo_principal: "Tríceps",
    musculo_secundario: "Peitoral, Ombros",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Mãos apoiadas atrás no banco, pernas estendidas. Desça flexionando cotovelos até ~90° e empurre de volta. Mantém tronco ereto para focar no tríceps (e não no peito).",
  },
  {
    nome_original: "Kick-back com Haltere",
    musculo_principal: "Tríceps",
    musculo_secundario: null,
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Incline o tronco a ~90°, cotovelo paralelo ao corpo. Estenda o antebraço para trás até o braço ficar reto. Isola a cabeça lateral. Evite jogar o braço.",
  },
  {
    nome_original: "Tríceps Francês com Haltere",
    musculo_principal: "Tríceps",
    musculo_secundario: null,
    equipamento: "Halteres",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Sentado ou deitado. Segure um haltere com ambas as mãos acima da cabeça. Flexione cotovelos abaixando o haltere atrás da cabeça. Estenda. Foca na cabeça longa do tríceps.",
  },
  {
    nome_original: "Tríceps Corda no Pulley",
    musculo_principal: "Tríceps",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Roldana alta com corda. Afaste os punhos ao final do movimento para maior ativação da cabeça lateral. Cotovelos rentes ao corpo. Retorne controlado.",
  },
  {
    nome_original: "Supino Fechado com Barra",
    musculo_principal: "Tríceps",
    musculo_secundario: "Peitoral, Ombros",
    equipamento: "Barra",
    nivel: "Avançado",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Pegada estreita (mãos na largura dos ombros). Desça a barra até o peito e empurre explosivamente. Cotovelos rentes ao corpo. Foca nas três cabeças do tríceps.",
  },

  /* ───────────── ABDÔMEN (6) ─────────────────────────────── */
  {
    nome_original: "Abdominal Crunch",
    musculo_principal: "Abdômen",
    musculo_secundario: null,
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Deitado, joelhos flexionados. Eleve o tronco usando apenas o abdômen (não o pescoço). Controle a descida. Expire ao subir. Não force a cabeça com as mãos.",
  },
  {
    nome_original: "Prancha (Plank)",
    musculo_principal: "Abdômen",
    musculo_secundario: "Lombar, Glúteos",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Estático",
    instrucoes:
      "Antebraços e pontas dos pés no chão. Corpo em linha reta. Contraindo abdômen, glúteo e nadega. Mantenha por 20-60 segundos. Não deixe o quadril cair ou subir.",
  },
  {
    nome_original: "Abdominal Oblíquo (Bicicleta)",
    musculo_principal: "Abdômen",
    musculo_secundario: "Oblíquos",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Deitado, mãos atrás da cabeça, pernas elevadas a 45°. Alterne trazendo cotovelo ao joelho oposto em movimento de pedalagem. Controla o ritmo sem puxar o pescoço.",
  },
  {
    nome_original: "Elevação de Pernas",
    musculo_principal: "Abdômen",
    musculo_secundario: "Flexores do Quadril",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Deitado de costas, braços ao lado. Eleve as pernas juntas até 90°. Desça lentamente sem tocar o chão. Lombares pressionadas no piso. Foca o reto abdominal inferior.",
  },
  {
    nome_original: "Russian Twist",
    musculo_principal: "Abdômen",
    musculo_secundario: "Oblíquos",
    equipamento: "Peso Corporal",
    nivel: "Intermediário",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Sentado com tronco inclinado a ~45°, pés elevados. Gire o tronco de lado a lado. Pode segurar haltere ou medicine ball para aumentar a dificuldade. Ativa oblíquos.",
  },
  {
    nome_original: "Abdominal na Máquina",
    musculo_principal: "Abdômen",
    musculo_secundario: null,
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Estático",
    instrucoes:
      "Ajuste o peso e o suporte. Contraia o abdômen trazendo os cotovelos em direção aos joelhos. Retorne controlado. Permite sobrecarga progressiva no core.",
  },

  /* ───────────── GLÚTEOS (6) ─────────────────────────────── */
  {
    nome_original: "Hip Thrust com Barra",
    musculo_principal: "Glúteos",
    musculo_secundario: "Isquiotibiais, Pernas",
    equipamento: "Barra",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Costas apoiadas no banco, barra no quadril (amortecimento). Pés no chão, joelhos a 90°. Eleve o quadril até o corpo ficar paralelo ao chão. Contraia glúteos máximos no topo. Desça controlado.",
  },
  {
    nome_original: "Glúteo 4 Apoios no Cabo",
    musculo_principal: "Glúteos",
    musculo_secundario: null,
    equipamento: "Cabo / Pulley",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Roldana baixa com tornozeleira. 4 apoios (mãos e joelhos). Empurre a perna para trás e para cima contraindo o glúteo. Retorna controlado. Excelente isolamento do glúteo máximo.",
  },
  {
    nome_original: "Abdução de Quadril na Máquina",
    musculo_principal: "Glúteos",
    musculo_secundario: "Abdutores",
    equipamento: "Máquina",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Abdutora: pernas posicionadas nas almofadas internas. Abra as pernas empurrando para fora. Controle o retorno. Ativa glúteo médio — essencial para estabilidade pélvica.",
  },
  {
    nome_original: "Stiff com Halteres",
    musculo_principal: "Glúteos",
    musculo_secundario: "Isquiotibiais, Lombar",
    equipamento: "Halteres",
    nivel: "Intermediário",
    mecanica: "Composto",
    forca: "Puxar",
    instrucoes:
      "Em pé, halteres na frente das coxas. Incline o tronco mantendo as pernas quase estendidas. Sinta o esticamento nos isquiotibiais e glúteos. Retorne contraindo sem arredondar a lombar.",
  },
  {
    nome_original: "Agachamento Sumô (Glúteo)",
    musculo_principal: "Glúteos",
    musculo_secundario: "Pernas, Adutores",
    equipamento: "Halteres",
    nivel: "Iniciante",
    mecanica: "Composto",
    forca: "Empurrar",
    instrucoes:
      "Pés bem abertos, pontas para fora. Segure haltere entre as pernas. Desça com o tronco ereto. Foco na abertura do quadril para máxima ativação glútea.",
  },
  {
    nome_original: "Elevação Pélvica (Glute Bridge)",
    musculo_principal: "Glúteos",
    musculo_secundario: "Isquiotibiais",
    equipamento: "Peso Corporal",
    nivel: "Iniciante",
    mecanica: "Isolador",
    forca: "Empurrar",
    instrucoes:
      "Deitado de costas, joelhos dobrados a 90°. Eleve o quadril contraindo os glúteos. Segure 2s no topo. Ótimo exercício de ativação antes do treino pesado ou para iniciantes.",
  },
];

/* ============================================================
   seedExercicios() — adiciona os exercícios acima ao Firebase.
   Execute via console: seedExercicios()
   ============================================================ */
async function seedExercicios() {
  const snap = await db.ref("exercicios").once("value");
  const total = snap.exists() ? Object.keys(snap.val()).length : 0;

  if (total > 0) {
    const ok = confirm(
      `Já existem ${total} exercícios no Firebase.\n\n` +
        "Deseja ADICIONAR os exercícios do seed mesmo assim? (duplicatas possíveis)\n\n" +
        "OK = adicionar | Cancelar = abortar",
    );
    if (!ok) {
      console.log("[Seed] Operação cancelada.");
      return;
    }
  }

  console.log(`[Seed] Inserindo ${EXERCICIOS_SEED.length} exercícios...`);
  let ok = 0;
  let erros = 0;

  for (const ex of EXERCICIOS_SEED) {
    try {
      await db.ref("exercicios").push({
        ...ex,
        customizado: false,
        criadoPor: null,
        videoUrl: "",
        gifUrl: "",
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
      ok++;
      if (ok % 10 === 0)
        console.log(`[Seed] ${ok}/${EXERCICIOS_SEED.length}...`);
    } catch (err) {
      console.error(`[Seed] Erro em "${ex.nome_original}":`, err);
      erros++;
    }
  }

  console.log(
    `[Seed] Concluído! ✅ ${ok} inseridos | ❌ ${erros} erros.\n` +
      "Recarregue o app para ver os exercícios disponíveis.",
  );
  alert(`Seed concluído!\n✅ ${ok} exercícios inseridos.\n❌ ${erros} erros.`);
}

/* ============================================================
   migrarExercicios() — APAGA todos os exercícios do Firebase
   e reinicia com o seed atualizado (schema v2).

   ⚠️  CUIDADO: remove todos os dados de /exercicios no DB.
   Execute via console: migrarExercicios()
   ============================================================ */
async function migrarExercicios() {
  const confirma = confirm(
    "⚠️ ATENÇÃO!\n\n" +
      "Esta operação vai APAGAR todos os exercícios existentes no Firebase\n" +
      "e recriar com o schema correto (v2).\n\n" +
      "Exercícios customizados de professores NÃO serão afetados\n" +
      "(eles ficam em /exerciciosCustom).\n\n" +
      "Deseja continuar?",
  );
  if (!confirma) {
    console.log("[Migração] Cancelada.");
    return;
  }

  console.log("[Migração] Apagando exercícios antigos...");
  await db.ref("exercicios").remove();
  console.log("[Migração] Exercícios antigos removidos. Reinserindo...");

  let ok = 0;
  let erros = 0;

  for (const ex of EXERCICIOS_SEED) {
    try {
      await db.ref("exercicios").push({
        ...ex,
        customizado: false,
        criadoPor: null,
        videoUrl: "",
        gifUrl: "",
        createdAt: firebase.database.ServerValue.TIMESTAMP,
      });
      ok++;
      if (ok % 10 === 0)
        console.log(`[Migração] ${ok}/${EXERCICIOS_SEED.length}...`);
    } catch (err) {
      console.error(`[Migração] Erro em "${ex.nome_original}":`, err);
      erros++;
    }
  }

  console.log(
    `[Migração] Concluída! ✅ ${ok} inseridos | ❌ ${erros} erros.\n` +
      "Recarregue o app para ver os exercícios atualizados.",
  );
  alert(
    `Migração concluída!\n✅ ${ok} exercícios inseridos com schema correto.\n❌ ${erros} erros.`,
  );
}
