/* ============================================================
   TREINO PRO — Seed de Exercícios
   59 exercícios reais distribuídos entre 10 grupos musculares.

   COMO USAR:
   1. Abra o console do navegador com o app carregado e logado
   2. Execute: seedExercicios()
   3. Aguarde a mensagem de conclusão

   ⚠️  Execute apenas UMA vez. O Firebase gerará IDs únicos.
   ============================================================ */

const EXERCICIOS_SEED = [
  /* ───────────── PEITO (8) ─────────────────────────────── */
  {
    nome: "Supino Reto com Barra",
    grupoMuscular: "peito",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Deite no banco, pegue a barra com pegada levemente mais larga que os ombros. Desça até o peito tocar levemente, expire e empurre até os cotovelos ficarem quase estendidos. Mantenha os pés no chão e os glúteos apoiados.",
  },
  {
    nome: "Supino Inclinado com Halteres",
    grupoMuscular: "peito",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Banco inclinado a 30-45°. Segure os halteres na altura do peito alto, cotovelos levemente curvados. Empurre para cima convergindo as mãos. Controla a descida em 2-3 segundos.",
  },
  {
    nome: "Supino Declinado com Barra",
    grupoMuscular: "peito",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Banco declinado. Pegada na barra um pouco mais larga que os ombros. Desça a barra até a parte baixa do peito e empurre explosivamente para cima. Foca a contração no peitoral inferior.",
  },
  {
    nome: "Crucifixo com Halteres",
    grupoMuscular: "peito",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Deitado no banco plano. Segure os halteres com palmas voltadas para dentro. Abra os braços em arco mantendo leve flexão nos cotovelos. Sinta o esticamento no peito e retorne comprimindo.",
  },
  {
    nome: "Crossover no Cabo",
    grupoMuscular: "peito",
    equipamento: "cabo",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Posicione as roldanas altas. Segure as alças, incline levemente o tronco à frente e traga as mãos em arco até se cruzarem à frente do abdômen. Mantenha cotovelos com leve flexão fixa.",
  },
  {
    nome: "Peck Deck (Voador na Máquina)",
    grupoMuscular: "peito",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Ajuste o assento para que os cotovelos fiquem na altura dos ombros. Feche os braços à frente contraindo o peito. Abra controlando a tensão. Excelente exercício de isolamento.",
  },
  {
    nome: "Flexão de Braços",
    grupoMuscular: "peito",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Posição de prancha com mãos levemente abertas. Desça até o peito quase tocar o chão, cotovelos apontados para trás (não para os lados). Empurre voltando à posição inicial. Corpo reto o tempo todo.",
  },
  {
    nome: "Pull Over com Haltere",
    grupoMuscular: "peito",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Deite transversalmente no banco, segure um haltere com ambas as mãos acima do peito. Desça o haltere atrás da cabeça com cotovelos levemente flexionados. Sinta o esticamento e retorne.",
  },

  /* ───────────── COSTAS (8) ─────────────────────────────── */
  {
    nome: "Puxada Frontal no Pulley",
    grupoMuscular: "costas",
    equipamento: "maquina",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Sente-se na máquina, segure a barra larga com pegada pronada. Incline levemente o tronco para trás e puxe a barra até a clavícula. Foca no latíssimo do dorso. Retorna controlado.",
  },
  {
    nome: "Remada Curvada com Barra",
    grupoMuscular: "costas",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Pés na largura dos ombros, joelhos levemente flexionados, tronco inclinado a ~45°. Puxe a barra até o abdômen baixo, cotovelos rentes ao corpo. Expanda o peito ao puxar.",
  },
  {
    nome: "Remada Sentada no Cabo",
    grupoMuscular: "costas",
    equipamento: "cabo",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Sente-se na máquina, pés apoiados. Puxe o triângulo/barra até o abdômen, retrocedendo os cotovelos ao máximo. Mantenha o tronco ereto e o peito aberto. Controla a volta.",
  },
  {
    nome: "Barra Fixa (Pull-up)",
    grupoMuscular: "costas",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "avancado",
    foco: "forca",
    instrucoes:
      "Pegada pronada (palmas para frente) levemente mais larga que os ombros. Puxe o corpo até o queixo passar a barra. Retorna de forma controlada. Não balance o corpo. Foca no latíssimo.",
  },
  {
    nome: "Remada Unilateral com Haltere",
    grupoMuscular: "costas",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Apoie o joelho e mão no banco. Puxe o haltere até o quadril, cotovelo paralelo ao corpo. Mantenha o tronco paralelo ao chão. Foca unilateralmente a lombar e o dorsal.",
  },
  {
    nome: "Levantamento Terra (Deadlift)",
    grupoMuscular: "costas",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "avancado",
    foco: "forca",
    instrucoes:
      "Pés na largura do quadril, barra sobre os pés. Agache pegando a barra, coluna neutra. Empurre o chão e estenda quadril e joelhos simultaneamente. Barra na linha das pernas. Não arredonde a lombar.",
  },
  {
    nome: "Pulldown com Triângulo",
    grupoMuscular: "costas",
    equipamento: "cabo",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Mesmo movimento da puxada frontal, mas com alça triangular (pegada neutra). Puxe até o peito, cotovelos apontando para baixo. Isola bem o latíssimo com menor ativação do bíceps.",
  },
  {
    nome: "Remada Máquina (Chest Supported)",
    grupoMuscular: "costas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Peito apoiado no suporte da máquina, handles em pegada neutra. Puxe cruzando os cotovelos para trás. O apoio elimina compensação lombar. Ótimo para iniciantes e lesioados.",
  },

  /* ───────────── PERNAS (9) ─────────────────────────────── */
  {
    nome: "Agachamento Livre",
    grupoMuscular: "pernas",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Barra na parte alta das trapézios. Pés na largura dos ombros ou levemente mais abertos. Desça controlando joelhos alinhados com pés. Desça até coxas paralelas ao chão. Empurre o chão para subir.",
  },
  {
    nome: "Leg Press 45°",
    grupoMuscular: "pernas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Deite na máquina, pés na plataforma na largura dos ombros. Desça flexionando joelhos até 90°. Empurre a plataforma sem travar os joelhos no topo. Controla a descida.",
  },
  {
    nome: "Extensão de Pernas",
    grupoMuscular: "pernas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Ajuste a máquina: encosto e roletes nas posições corretas. Estenda as pernas até quase o total, segure 1s no topo. Controla a volta. Isolamento do quadríceps.",
  },
  {
    nome: "Flexão de Pernas (Cadeira Flexora)",
    grupoMuscular: "pernas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Deitado na máquina, rolete no tendão calcâneo. Flexione os joelhos trazendo o calcanhar em direção ao glúteo. Segure 1s e retorne controlado. Isola os isquiotibiais.",
  },
  {
    nome: "Agachamento Sumô com Haltere",
    grupoMuscular: "pernas",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Pés bem abertos, pontas para fora. Segure um haltere entre as pernas. Agache mantendo joelhos alinhados com os pés. Ativa glúteos e adutores além do quadríceps.",
  },
  {
    nome: "Afundo (Lunges) com Halteres",
    grupoMuscular: "pernas",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Em pé com halteres. Avance um passo à frente e desça até o joelho traseiro quase tocar o chão. Joelho da frente não ultrapassa os dedos. Volte e repita com a outra perna.",
  },
  {
    nome: "Elevação de Panturrilha em Pé",
    grupoMuscular: "pernas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Posicione os ombros sob os suportes. Eleve os calcanhares o máximo possível contraindo o sóleo e gastrocnêmio. Segure 2s no topo. Desça abaixo do nível da plataforma para esticar.",
  },
  {
    nome: "Agachamento Búlgaro",
    grupoMuscular: "pernas",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "avancado",
    foco: "hipertrofia",
    instrucoes:
      "Pé traseiro apoiado num banco. Desça com a perna da frente até 90°. Mantenha o tronco ereto. Excelente para quadrícep, glúteo e equilíbrio. Segure halteres para sobrecarga.",
  },
  {
    nome: "Cadeira Abdutora",
    grupoMuscular: "pernas",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Sente-se na máquina, pernas posicionadas nas almofadas externas. Abra as pernas resistindo à máquina. Controle o retorno. Ativa glúteo médio e abdutor do quadril.",
  },

  /* ───────────── OMBROS (6) ─────────────────────────────── */
  {
    nome: "Desenvolvimento com Halteres",
    grupoMuscular: "ombros",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Sentado, halteres na altura dos ombros com palmas à frente. Empurre para cima até os cotovelos quase estenderem. Desça controlado. Trabalha o deltoide anterior e medial.",
  },
  {
    nome: "Desenvolvimento Militar com Barra",
    grupoMuscular: "ombros",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "forca",
    instrucoes:
      "Em pé ou sentado, barra na frente dos ombros. Empurre para cima alinhando com as orelhas. Retorna controlado. Versão standing exige mais core.",
  },
  {
    nome: "Elevação Lateral com Halteres",
    grupoMuscular: "ombros",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Em pé, halteres ao lado do corpo. Eleve os braços lateralmente até a altura dos ombros com cotovelos levemente flexionados. Evite balançar o tronco. Isola deltoide medial.",
  },
  {
    nome: "Elevação Frontal com Halteres",
    grupoMuscular: "ombros",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Halteres na frente das coxas. Eleve alternadamente (ou simultaneamente) para frente até a altura dos ombros. Cotovelos levemente flexionados. Isola deltoide anterior.",
  },
  {
    nome: "Crucifixo Invertido (Deltoide Posterior)",
    grupoMuscular: "ombros",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Incline o tronco a ~90° ou utilize o banco em 45°. Abra os braços lateralmente contraindo as escápulas. Cotovelos levemente flexionados. Foca o deltoide posterior e romboides.",
  },
  {
    nome: "Encolhimento de Ombros (Shrug)",
    grupoMuscular: "ombros",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Em pé com halteres ou barra. Eleve os ombros em direção às orelhas sem dobrar os cotovelos. Segure 1s no topo. Ativa trapezes superior. Evite rotação de ombros.",
  },

  /* ───────────── BÍCEPS (5) ─────────────────────────────── */
  {
    nome: "Rosca Direta com Barra",
    grupoMuscular: "biceps",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Em pé, barra com pegada supinada (palmas para cima). Flexione os cotovelos sem mover os ombros. Suba até 90°+, desça controlado. Cotovelos rentes ao corpo.",
  },
  {
    nome: "Rosca Alternada com Halteres",
    grupoMuscular: "biceps",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Em pé ou sentado. Flexione um braço por vez, supinando o punho ao subir. Controla descida. Trabalha bíceps e braquial com amplitude maior que o martelo.",
  },
  {
    nome: "Rosca Concentrada",
    grupoMuscular: "biceps",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Sentado, cotovelo apoiado na parte interna da coxa. Curle o haltere controlando a amplitude total. Excelente isolamento do bíceps com pico de contração.",
  },
  {
    nome: "Rosca Martelo",
    grupoMuscular: "biceps",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Pegada neutra (palmas voltadas uma para a outra). Flexione o cotovelo sem rotar o punho. Ativa braquial, braquiorradial e bíceps. Excelente para espessura do braço.",
  },
  {
    nome: "Rosca Scott (Barra EZ)",
    grupoMuscular: "biceps",
    equipamento: "barra",
    tipo: "maquina",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Braços apoiados na almofada do banco Scott. Curle a barra EZ controlando a amplitude total. Elimina compensação de ombros. Pico de contração do bíceps.",
  },

  /* ───────────── TRÍCEPS (5) ────────────────────────────── */
  {
    nome: "Tríceps Testa com Barra EZ",
    grupoMuscular: "triceps",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Deitado no banco, barra EZ acima do rosto. Flexione apenas os cotovelos abaixando em direção à testa. Empurre de volta. Não mova os ombros. Isola bem as 3 cabeças do tríceps.",
  },
  {
    nome: "Tríceps Pulley (Barra Reta)",
    grupoMuscular: "triceps",
    equipamento: "cabo",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Roldana alta. Segure a barra com pegada pronada, cotovelos rentes ao corpo. Estenda os braços empurrando para baixo. Segure 1s. Cotovelos fixos. Ativa cabeça lateral e longa.",
  },
  {
    nome: "Tríceps Mergulho no Banco (Dips)",
    grupoMuscular: "triceps",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Mãos apoiadas atrás no banco, pernas estendidas. Desça flexionando cotovelos até ~90° e empurre de volta. Mantém tronco ereto para focar no tríceps (e não no peito).",
  },
  {
    nome: "Kick-back com Haltere",
    grupoMuscular: "triceps",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Incline o tronco a ~90°, cotovelo paralelo ao corpo. Estenda o antebraço para trás até o braço ficar reto. Isola a cabeça lateral. Evite jogar o braço.",
  },
  {
    nome: "Tríceps Francês com Haltere",
    grupoMuscular: "triceps",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Sentado ou deitado. Segure um haltere com ambas as mãos acima da cabeça. Flexione cotovelos abaixando o haltere atrás da cabeça. Estenda. Foca na cabeça longa do tríceps.",
  },

  /* ───────────── ABDÔMEN (5) ────────────────────────────── */
  {
    nome: "Abdominal Crunch",
    grupoMuscular: "abdomen",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Deitado, joelhos flexionados. Eleve o tronco usando apenas o abdômen (não o pescoço). Controle a descida. Expire ao subir. Não force a cabeça com as mãos.",
  },
  {
    nome: "Prancha (Plank)",
    grupoMuscular: "abdomen",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Antebraços e pontas dos pés no chão. Corpo em linha reta. Contraindo abdômen, glúteo e nadega. Mantenha por 20-60 segundos. Não deixe o quadril cair ou subir.",
  },
  {
    nome: "Abdominal Oblíquo (Bicicleta)",
    grupoMuscular: "abdomen",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Deitado, mãos atrás da cabeça, pernas elevadas a 45°. Alterne trazendo cotovelo ao joelho oposto em movimento de pedalagem. Controla o ritmo sem puxar o pescoço.",
  },
  {
    nome: "Elevação de Pernas",
    grupoMuscular: "abdomen",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "resistencia",
    instrucoes:
      "Deitado de costas, braços ao lado. Eleve as pernas juntas até 90°. Desça lentamente sem tocar o chão. Lombares pressionadas no piso. Foca o reto abdominal inferior.",
  },
  {
    nome: "Russian Twist",
    grupoMuscular: "abdomen",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "intermediario",
    foco: "resistencia",
    instrucoes:
      "Sentado com tronco inclinado a ~45°, pés elevados. Gire o tronco de lado a lado. Pode segurar haltere ou medicine ball para aumentar a dificuldade. Ativa oblíquos.",
  },

  /* ───────────── GLÚTEOS (4) ────────────────────────────── */
  {
    nome: "Hip Thrust com Barra",
    grupoMuscular: "gluteos",
    equipamento: "barra",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Costas apoiadas no banco, barra no quadril (amortecimento). Pés no chão, joelhos a 90°. Eleve o quadril até o corpo ficar paralelo ao chão. Contraia glúteos máximos no topo. Desça controlado.",
  },
  {
    nome: "Glúteo 4 Apoios no Cabo",
    grupoMuscular: "gluteos",
    equipamento: "cabo",
    tipo: "cabo",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Roldana baixa com tornozeleira. 4 apoios (mãos e joelhos). Empurre a perna para trás e para cima contraindo o glúteo. Retorna controlado. Excelente isolamento do glúteo máximo.",
  },
  {
    nome: "Abdução de Quadril na Máquina",
    grupoMuscular: "gluteos",
    equipamento: "maquina",
    tipo: "maquina",
    nivel: "iniciante",
    foco: "hipertrofia",
    instrucoes:
      "Abdutora: pernas posicionadas nas almofadas internas. Abra as pernas empurrando para fora. Controle o retorno. Ativa glúteo médio — essencial para estabilidade pélvica.",
  },
  {
    nome: "Stiff com Halteres",
    grupoMuscular: "gluteos",
    equipamento: "haltere",
    tipo: "peso_livre",
    nivel: "intermediario",
    foco: "hipertrofia",
    instrucoes:
      "Em pé, halteres na frente das coxas. Incline o tronco mantendo as pernas quase estendidas. Sinta o esticamento nos isquiotibiais e glúteos. Retorne contraindo sem arredondar a lombar.",
  },

  /* ───────────── CARDIO (4) ─────────────────────────────── */
  {
    nome: "Esteira — Corrida Leve",
    grupoMuscular: "cardio",
    equipamento: "sem_equipamento",
    tipo: "cardio",
    nivel: "iniciante",
    foco: "emagrecimento",
    instrucoes:
      "Velocidade de 6-9 km/h por 20-40 minutos. Frequência cardíaca alvo: 65-75% da FC máxima. Ideal para queima de gordura em zona aeróbia. Mantenha postura ereta.",
  },
  {
    nome: "Bicicleta Ergométrica",
    grupoMuscular: "cardio",
    equipamento: "sem_equipamento",
    tipo: "cardio",
    nivel: "iniciante",
    foco: "emagrecimento",
    instrucoes:
      "Ajuste o banco: leve flexão do joelho na parte baixa. Pedale entre 70-90 RPM por 20-40 minutos. Resistência moderada. Menor impacto que a esteira.",
  },
  {
    nome: "HIIT — Tiros na Esteira",
    grupoMuscular: "cardio",
    equipamento: "sem_equipamento",
    tipo: "cardio",
    nivel: "intermediario",
    foco: "condicionamento",
    instrucoes:
      "Alterne 30-45s de sprint (12-16 km/h) com 60-90s de caminhada (4-5 km/h). Repita 8-12 ciclos. Aumenta o metabolismo por horas após o treino (EPOC).",
  },
  {
    nome: "Polichinelo (Jumping Jacks)",
    grupoMuscular: "cardio",
    equipamento: "sem_equipamento",
    tipo: "cardio",
    nivel: "iniciante",
    foco: "condicionamento",
    instrucoes:
      "Em pé, pule abrindo e fechando pernas e braços simultaneamente. Mantenha ritmo constante. Pode usar como aquecimento ou dentro de circuito HIIT.",
  },

  /* ───────────── MOBILIDADE (5) ─────────────────────────── */
  {
    nome: "Alongamento de Quadríceps",
    grupoMuscular: "mobilidade",
    equipamento: "sem_equipamento",
    tipo: "alongamento",
    nivel: "iniciante",
    foco: "mobilidade",
    instrucoes:
      "Em pé, dobre um joelho trazendo o calcanhar ao glúteo. Segure o tornozelo com a mão do mesmo lado. Mantenha 20-30s. Alterne as pernas. Use uma parede para apoio se necessário.",
  },
  {
    nome: "Mobilidade de Quadril (Hip Circle)",
    grupoMuscular: "mobilidade",
    equipamento: "sem_equipamento",
    tipo: "mobilidade",
    nivel: "iniciante",
    foco: "mobilidade",
    instrucoes:
      "Em pé, mãos na cintura. Faça círculos amplos com o quadril no sentido horário e anti-horário. 10 repetições para cada lado. Excelente para aquecimento antes de agachamentos.",
  },
  {
    nome: "Alongamento de Isquiotibiais",
    grupoMuscular: "mobilidade",
    equipamento: "sem_equipamento",
    tipo: "alongamento",
    nivel: "iniciante",
    foco: "mobilidade",
    instrucoes:
      "Deitado de costas, eleve uma perna estendida e segure com as mãos atrás da coxa. Mantenha 20-30s. Ou sentado, estenda à frente com tronco inclinado. Alivia tensão nos isquiotibiais.",
  },
  {
    nome: "Foam Roller — Liberação Miofascial",
    grupoMuscular: "mobilidade",
    equipamento: "sem_equipamento",
    tipo: "funcional",
    nivel: "iniciante",
    foco: "mobilidade",
    instrucoes:
      "Posicione o foam roller sob o músculo alvo. Use o peso do corpo para aplicar pressão e role lentamente. Pause 20-30s nos pontos de maior tensão. Execute antes ou após o treino.",
  },
  {
    nome: "Cat-Cow — Mobilidade de Coluna",
    grupoMuscular: "mobilidade",
    equipamento: "sem_equipamento",
    tipo: "mobilidade",
    nivel: "iniciante",
    foco: "mobilidade",
    instrucoes:
      "4 apoios (mãos e joelhos). Inspire arqueando a lombar para baixo (Cow). Expire contraindo e arqueando a coluna para cima (Cat). 10-15 repetições lentas. Lubrifica as articulações da coluna.",
  },
];

/* ============================================================
   Função de seed — popula o Firebase com os exercícios acima.
   Execute via console: seedExercicios()
   ============================================================ */

async function seedExercicios() {
  /* Verifica quantos exercícios já existem */
  const snap = await db.ref("exercicios").once("value");
  const existe = snap.exists();
  const total = existe ? Object.keys(snap.val()).length : 0;

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
      const ref = db.ref("exercicios").push();
      await ref.set({
        ...ex,
        ativo: true,
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
      console.error(`[Seed] Erro em "${ex.nome}":`, err);
      erros++;
    }
  }

  console.log(
    `[Seed] Concluído! ✅ ${ok} inseridos | ❌ ${erros} erros.\n` +
      "Recarregue o app para ver os exercícios disponíveis.",
  );
  alert(`Seed concluído!\n✅ ${ok} exercícios inseridos.\n❌ ${erros} erros.`);
}
