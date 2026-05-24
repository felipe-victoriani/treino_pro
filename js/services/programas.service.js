/* ============================================================
   TREINO PRO — Programas Pré-Definidos
   Biblioteca profissional de programas de treino para iniciantes.

   Estrutura de cada programa:
   {
     id            : identificador único (slug)
     nome          : nome exibido ao usuário
     descricao     : breve descrição do programa
     objetivo      : "hipertrofia" | "emagrecimento" | "condicionamento"
     nivel         : "iniciante" | "intermediario"
     frequencia    : dias por semana
     duracao       : semanas recomendadas
     sexo          : "todos" | "masculino" | "feminino"
     destaque      : boolean — aparece em "mais populares"
     treinos: {
       A: { foco, icone, exercicios: [ { nome, series, reps, descanso, dica } ] }
       B: ...
     }
   }
   ============================================================ */

const PROGRAMAS_PREDEFINIDOS = [
  /* ══════════════════════════════════════════════════════════
     PROGRAMA 1 — INICIANTE ABC (3x / semana)
     O clássico push/pull/legs adaptado para quem está começando.
     Foco: ganho de massa muscular com técnica segura.
  ══════════════════════════════════════════════════════════ */
  {
    id: "iniciante-abc-3x",
    nome: "Iniciante ABC — Hipertrofia",
    descricao:
      "Programa clássico de 3 dias para quem está começando ou voltando à academia. Divide o corpo em Peito/Tríceps, Costas/Bíceps e Pernas/Ombros para máximo descanso e recuperação.",
    objetivo: "hipertrofia",
    nivel: "iniciante",
    frequencia: 3,
    duracao: 12,
    sexo: "todos",
    destaque: true,
    treinos: {
      A: {
        foco: "Peito e Tríceps",
        icone: "💪",
        orientacao:
          "Comece pelos exercícios compostos (supino) antes dos isoladores (tríceps). Descanse o tempo indicado entre as séries.",
        exercicios: [
          {
            nome: "Supino Reto com Barra",
            grupoMuscular: "peito",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Mantenha os pés firmes no chão e a lombar levemente arqueada. Não deixe a barra quicar no peito.",
          },
          {
            nome: "Supino Inclinado com Halteres",
            grupoMuscular: "peito",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Banco a 30-45°. Controla a descida em 2 segundos — a fase negativa é onde você mais cresce.",
          },
          {
            nome: "Crucifixo com Halteres",
            grupoMuscular: "peito",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Mantenha leve flexão nos cotovelos durante todo o movimento. Sinta o esticamento no peito.",
          },
          {
            nome: "Tríceps Pulley (Barra Reta)",
            grupoMuscular: "triceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Cotovelos colados ao corpo, apenas o antebraço se move. Contrai o tríceps no ponto mais baixo.",
          },
          {
            nome: "Tríceps Testa com Barra EZ",
            grupoMuscular: "triceps",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Não mova os ombros. Apenas os cotovelos dobram e estendem. Controla a descida.",
          },
          {
            nome: "Elevação Frontal com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Use um peso que permita controle total. Suba até a altura dos ombros, não além.",
          },
        ],
      },
      B: {
        foco: "Costas e Bíceps",
        icone: "🔙",
        orientacao:
          "Foque em sentir o dorsal trabalhando nas puxadas. Nos exercícios de bíceps, controle a descida — não solte o peso.",
        exercicios: [
          {
            nome: "Puxada Frontal no Pulley",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Incline levemente o tronco para trás. Puxe a barra até a clavícula, não até o pescoço.",
          },
          {
            nome: "Remada Sentada no Cabo",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Mantenha o tronco ereto. Puxe até o abdômen e sinta os cotovelos indo para trás.",
          },
          {
            nome: "Remada Unilateral com Haltere",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Apoie joelho e mão no banco. Puxe o haltere até o quadril, evite rotacionar o tronco.",
          },
          {
            nome: "Pulldown com Triângulo",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Pegada neutra. Puxe até o peito alto, abrindo o peito ao final do movimento.",
          },
          {
            nome: "Rosca Direta com Barra",
            grupoMuscular: "biceps",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Cotovelos fixos ao lado do corpo. Não balance o tronco para ajudar.",
          },
          {
            nome: "Rosca Martelo",
            grupoMuscular: "biceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Pegada neutra (polegar para cima). Excelente para espessura do braço.",
          },
        ],
      },
      C: {
        foco: "Pernas e Ombros",
        icone: "🦵",
        orientacao:
          "Treine pernas primeiro quando estiver mais disposto. Ombros no final, pois eles já foram solicitados nos treinos A e B.",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 3,
            reps: "10-12",
            descanso: "120s",
            dica: "Desça até as coxas ficarem paralelas ao chão. Joelhos alinhados com os dedos dos pés.",
          },
          {
            nome: "Leg Press 45°",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "90s",
            dica: "Não trave os joelhos no topo. Desça até 90° de flexão. Pés na largura dos ombros.",
          },
          {
            nome: "Extensão de Pernas",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Segure 1 segundo no topo contraindo o quadríceps. Controla a descida.",
          },
          {
            nome: "Flexão de Pernas (Cadeira Flexora)",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Não deixe o quadril levantar ao subir. Controla o retorno.",
          },
          {
            nome: "Elevação de Panturrilha em Pé",
            grupoMuscular: "pernas",
            series: 4,
            reps: "15-20",
            descanso: "45s",
            dica: "Suba o máximo possível. Desça abaixo da plataforma para o esticamento completo.",
          },
          {
            nome: "Desenvolvimento com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Sentado para estabilidade. Evite arquear a lombar ao empurrar.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Cotovelos levemente flexionados. Não balance o corpo. Isola o deltoide medial.",
          },
        ],
      },
    },
  },

  /* ══════════════════════════════════════════════════════════
     PROGRAMA 2 — FULL BODY INICIANTE (3x / semana)
     Para quem nunca treinou. Treinos completos a cada sessão.
     Desenvolve base motora e força geral.
  ══════════════════════════════════════════════════════════ */
  {
    id: "full-body-iniciante-3x",
    nome: "Full Body para Iniciantes",
    descricao:
      "Ideal para quem nunca pisou numa academia. Cada treino trabalha o corpo todo com movimentos fundamentais. Em 8 semanas você terá uma base sólida para qualquer objetivo.",
    objetivo: "condicionamento",
    nivel: "iniciante",
    frequencia: 3,
    duracao: 8,
    sexo: "todos",
    destaque: false,
    treinos: {
      A: {
        foco: "Full Body — Sessão 1",
        icone: "🏋️",
        orientacao:
          "Descanse 60 segundos entre as séries. O objetivo agora é aprender o movimento, não o peso.",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Aprenda o padrão antes de adicionar peso. Mantenha o peito alto e joelhos alinhados.",
          },
          {
            nome: "Supino Reto com Barra",
            grupoMuscular: "peito",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Comece com um peso que permita manter a técnica perfeita.",
          },
          {
            nome: "Remada Curvada com Barra",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Tronco inclinado a 45°. Puxe a barra até o abdômen.",
          },
          {
            nome: "Desenvolvimento Militar com Barra",
            grupoMuscular: "ombros",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Core contraído para proteger a lombar ao empurrar.",
          },
          {
            nome: "Rosca Direta com Barra",
            grupoMuscular: "biceps",
            series: 2,
            reps: "12-15",
            descanso: "60s",
            dica: "Movimento controlado, sem balançar.",
          },
          {
            nome: "Tríceps Pulley (Barra Reta)",
            grupoMuscular: "triceps",
            series: 2,
            reps: "12-15",
            descanso: "60s",
            dica: "Cotovelos fixos. Apenas o antebraço se move.",
          },
          {
            nome: "Elevação de Panturrilha em Pé",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Movimento completo, de cima a baixo.",
          },
        ],
      },
      B: {
        foco: "Full Body — Sessão 2",
        icone: "⚡",
        orientacao:
          "Sessão alternada da sessão A. Variação dos exercícios para estimular músculos de formas diferentes.",
        exercicios: [
          {
            nome: "Leg Press 45°",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Pés no centro da plataforma. Controla a descida.",
          },
          {
            nome: "Supino Inclinado com Halteres",
            grupoMuscular: "peito",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Banco a 30-45°. Halteres na altura do peito alto.",
          },
          {
            nome: "Puxada Frontal no Pulley",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Pegada pronada, levemente mais larga que os ombros.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Peso leve para manter a técnica.",
          },
          {
            nome: "Rosca Alternada com Halteres",
            grupoMuscular: "biceps",
            series: 2,
            reps: "12-15",
            descanso: "60s",
            dica: "Supine o punho ao subir para ativar melhor o bíceps.",
          },
          {
            nome: "Mergulho entre Bancos",
            grupoMuscular: "triceps",
            series: 2,
            reps: "10-15",
            descanso: "60s",
            dica: "Cotovelos apontados para trás. Desça até 90° de flexão.",
          },
          {
            nome: "Flexão de Pernas (Cadeira Flexora)",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "45s",
            dica: "Quadril apoiado na máquina durante todo o movimento.",
          },
        ],
      },
      C: {
        foco: "Full Body — Sessão 3",
        icone: "🔥",
        orientacao:
          "Terceira sessão da semana. Foque em sentir cada músculo trabalhando — mente-músculo faz diferença.",
        exercicios: [
          {
            nome: "Afundo (Lunges) com Halteres",
            grupoMuscular: "pernas",
            series: 3,
            reps: "10-12 por perna",
            descanso: "60s",
            dica: "Passo largo. Joelho dianteiro não ultrapassa os dedos.",
          },
          {
            nome: "Peck Deck (Voador na Máquina)",
            grupoMuscular: "peito",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Cotovelos na altura dos ombros. Sinta o peito trabalhar.",
          },
          {
            nome: "Remada Máquina (Chest Supported)",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Apoio no peito elimina compensação. Ótimo para iniciantes.",
          },
          {
            nome: "Crucifixo Invertido (Deltoide Posterior)",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Tronco inclinado. Abre os braços sentindo o deltoide posterior.",
          },
          {
            nome: "Rosca Concentrada",
            grupoMuscular: "biceps",
            series: 2,
            reps: "12-15",
            descanso: "60s",
            dica: "Cotovelo apoiado na coxa. Amplitude total do movimento.",
          },
          {
            nome: "Flexão de Braços",
            grupoMuscular: "triceps",
            series: 2,
            reps: "Máximo com boa forma",
            descanso: "60s",
            dica: "Corpo reto como uma prancha. Cotovelos para trás, não para os lados.",
          },
          {
            nome: "Cadeira Abdutora",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Controla a volta. Não bata as almofadas.",
          },
        ],
      },
    },
  },

  /* ══════════════════════════════════════════════════════════
     PROGRAMA 3 — EMAGRECIMENTO E CONDICIONAMENTO (3x / semana)
     Alta intensidade, séries com mais repetições, menos descanso.
     Ideal para quem quer perder gordura mantendo/ganhando massa.
  ══════════════════════════════════════════════════════════ */
  {
    id: "emagrecimento-3x",
    nome: "Emagrecimento e Definição",
    descricao:
      "Programa de alta intensidade com menos descanso entre as séries. Aumenta o gasto calórico durante e após o treino (efeito EPOC). Combina treino de força com circuitos.",
    objetivo: "emagrecimento",
    nivel: "iniciante",
    frequencia: 3,
    duracao: 10,
    sexo: "todos",
    destaque: true,
    treinos: {
      A: {
        foco: "Superior — Circuito Intenso",
        icone: "🔥",
        orientacao:
          "Execute os exercícios em pares (A1+A2, B1+B2, C1+C2) sem descanso entre eles. Descanse 60s depois do par.",
        exercicios: [
          {
            nome: "Supino Reto com Barra",
            grupoMuscular: "peito",
            series: 4,
            reps: "12-15",
            descanso: "45s",
            dica: "Peso moderado. O objetivo é ritmo e volume, não carga máxima.",
          },
          {
            nome: "Remada Curvada com Barra",
            grupoMuscular: "costas",
            series: 4,
            reps: "12-15",
            descanso: "45s",
            dica: "Superset com o supino — enquanto descansa um músculo, trabalha o oposto.",
          },
          {
            nome: "Desenvolvimento com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "45s",
            dica: "Explosivo na subida, controlado na descida.",
          },
          {
            nome: "Puxada Frontal no Pulley",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "45s",
            dica: "Mantenha o ritmo constante entre as repetições.",
          },
          {
            nome: "Crucifixo com Halteres",
            grupoMuscular: "peito",
            series: 3,
            reps: "15-20",
            descanso: "30s",
            dica: "Finalizador. Peso leve, foco no pump e na queima.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15-20",
            descanso: "30s",
            dica: "Finalizador de ombro. Mantenha a tensão constante.",
          },
        ],
      },
      B: {
        foco: "Inferior — Pernas e Glúteos",
        icone: "🦵",
        orientacao:
          "Pernas queimam muito mais calorias por serem o maior grupo muscular. Invista aqui!",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 4,
            reps: "15-20",
            descanso: "60s",
            dica: "Volume alto com peso moderado. Sinta os glúteos e quadríceps trabalhando.",
          },
          {
            nome: "Afundo (Lunges) com Halteres",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12 por perna",
            descanso: "60s",
            dica: "Excelente gasto calórico. Mantenha o ritmo constante.",
          },
          {
            nome: "Leg Press 45°",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Mais repetições com peso moderado. Controla a descida.",
          },
          {
            nome: "Flexão de Pernas (Cadeira Flexora)",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Isquiotibiais — foco no hamstring para o shape das pernas.",
          },
          {
            nome: "Agachamento Sumô com Haltere",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Ativa adutores e glúteos. Importante para modelar a parte interna da coxa.",
          },
          {
            nome: "Elevação de Panturrilha em Pé",
            grupoMuscular: "pernas",
            series: 4,
            reps: "20-25",
            descanso: "30s",
            dica: "Panturrilha é resistente — use volume alto para stimular.",
          },
        ],
      },
      C: {
        foco: "Full Body — Alta Intensidade",
        icone: "⚡",
        orientacao:
          "Sessão de finalização da semana. Circuito completo com todos os grupos musculares. Menos descanso!",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15",
            descanso: "30s",
            dica: "Início do circuito — maior grupo muscular primeiro.",
          },
          {
            nome: "Flexão de Braços",
            grupoMuscular: "peito",
            series: 3,
            reps: "Máximo",
            descanso: "30s",
            dica: "Sem equipamento. Excelente para manter o ritmo do circuito.",
          },
          {
            nome: "Remada Unilateral com Haltere",
            grupoMuscular: "costas",
            series: 3,
            reps: "12 por lado",
            descanso: "30s",
            dica: "Alterne os lados sem descanso entre eles.",
          },
          {
            nome: "Afundo (Lunges) com Halteres",
            grupoMuscular: "pernas",
            series: 3,
            reps: "10 por perna",
            descanso: "30s",
            dica: "Alterne as pernas em movimento contínuo.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15",
            descanso: "30s",
            dica: "Peso leve para manter o ritmo do circuito.",
          },
          {
            nome: "Tríceps Pulley (Barra Reta)",
            grupoMuscular: "triceps",
            series: 3,
            reps: "15",
            descanso: "30s",
            dica: "Ritmo constante. Foco na contração.",
          },
          {
            nome: "Rosca Alternada com Halteres",
            grupoMuscular: "biceps",
            series: 3,
            reps: "15",
            descanso: "30s",
            dica: "Finalizador do circuito.",
          },
        ],
      },
    },
  },

  /* ══════════════════════════════════════════════════════════
     PROGRAMA 4 — GLÚTEOS E PERNAS FEMININO (4x / semana)
     Programa direcionado para modelagem de glúteos e pernas.
     Alta demanda para o público feminino iniciante.
  ══════════════════════════════════════════════════════════ */
  {
    id: "gluteos-pernas-feminino-4x",
    nome: "Glúteos & Pernas — Feminino",
    descricao:
      "Programa específico para modelagem de glúteos, pernas e definição do core. 4 treinos semanais com foco total no shape feminino. Resultados visíveis a partir da 4ª semana.",
    objetivo: "hipertrofia",
    nivel: "iniciante",
    frequencia: 4,
    duracao: 12,
    sexo: "feminino",
    destaque: true,
    treinos: {
      A: {
        foco: "Glúteos e Isquiotibiais",
        icone: "🍑",
        orientacao:
          "Treino principal de glúteos. Ative bem o glúteo antes de começar (glute bridge no aquecimento). Sinta cada repetição.",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 4,
            reps: "12-15",
            descanso: "90s",
            dica: "Desça fundo e empurre os joelhos para fora. O agachamento profundo é o melhor exercício para glúteos.",
          },
          {
            nome: "Agachamento Sumô com Haltere",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "60s",
            dica: "Pés bem abertos ativam adutores e glúteo médio. Essencial para modelagem interna.",
          },
          {
            nome: "Afundo (Lunges) com Halteres",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12 por perna",
            descanso: "60s",
            dica: "Passo largo e desça fundo. Sinta o glúteo da perna da frente.",
          },
          {
            nome: "Flexão de Pernas (Cadeira Flexora)",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Isquiotibiais são essenciais para o shape das pernas.",
          },
          {
            nome: "Agachamento Búlgaro",
            grupoMuscular: "pernas",
            series: 3,
            reps: "10-12 por perna",
            descanso: "90s",
            dica: "Um dos melhores para glúteo e quadrícep. Pé traseiro no banco, desça fundo.",
          },
          {
            nome: "Cadeira Abdutora",
            grupoMuscular: "pernas",
            series: 4,
            reps: "20-25",
            descanso: "45s",
            dica: "Finalizador. Altas repetições para queimar o glúteo médio e abdutor.",
          },
        ],
      },
      B: {
        foco: "Superior — Peito, Costas e Ombros",
        icone: "💃",
        orientacao:
          "Treino superior para equilíbrio do corpo. Um físico harmonioso combina parte inferior desenvolvida com superior definida.",
        exercicios: [
          {
            nome: "Supino Inclinado com Halteres",
            grupoMuscular: "peito",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Banco inclinado para elevar e tonificar o peito.",
          },
          {
            nome: "Puxada Frontal no Pulley",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Excelente para modelar o dorsal e criar a ilusão de cintura.",
          },
          {
            nome: "Remada Sentada no Cabo",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Tronco ereto. Trabalha toda a musculatura do dorso.",
          },
          {
            nome: "Desenvolvimento com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Ombros definidos criam o efeito de ombros largos e cintura fina.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Peso leve e volume alto para queimar e definir.",
          },
          {
            nome: "Crucifixo Invertido (Deltoide Posterior)",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Postura + definição de ombro posterior.",
          },
        ],
      },
      C: {
        foco: "Quadríceps e Panturrilha",
        icone: "🦵",
        orientacao:
          "Foco nos quadríceps e panturrilha para definir a frente das pernas e o shape das panturrilhas.",
        exercicios: [
          {
            nome: "Leg Press 45°",
            grupoMuscular: "pernas",
            series: 4,
            reps: "15-20",
            descanso: "60s",
            dica: "Pés baixos na plataforma para maior ativação do quadríceps.",
          },
          {
            nome: "Extensão de Pernas",
            grupoMuscular: "pernas",
            series: 4,
            reps: "15-20",
            descanso: "45s",
            dica: "Isolamento puro do quadríceps. Segure 1s no topo.",
          },
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "60s",
            dica: "Volume alto nesta sessão para maior gasto calórico.",
          },
          {
            nome: "Afundo (Lunges) com Halteres",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12 por perna",
            descanso: "60s",
            dica: "Passo curto para focar mais no quadríceps.",
          },
          {
            nome: "Elevação de Panturrilha em Pé",
            grupoMuscular: "pernas",
            series: 5,
            reps: "20-25",
            descanso: "30s",
            dica: "Panturrilha tonificada é o detalhe final do shape das pernas.",
          },
          {
            nome: "Cadeira Abdutora",
            grupoMuscular: "pernas",
            series: 3,
            reps: "20-25",
            descanso: "30s",
            dica: "Finalizador para a região abdutor/glúteo médio.",
          },
        ],
      },
      D: {
        foco: "Bíceps, Tríceps e Core",
        icone: "💪",
        orientacao:
          "Treino de braços e abdominal para a semana completa. Braços tonificados e core forte completam o físico.",
        exercicios: [
          {
            nome: "Rosca Alternada com Halteres",
            grupoMuscular: "biceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Supine o punho ao subir para máxima ativação do bíceps.",
          },
          {
            nome: "Rosca Concentrada",
            grupoMuscular: "biceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Isolamento máximo. Sinta o pico de contração.",
          },
          {
            nome: "Tríceps Pulley (Barra Reta)",
            grupoMuscular: "triceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Tríceps representa 2/3 do volume do braço. Fundamental para braços bonitos.",
          },
          {
            nome: "Crossover no Cabo",
            grupoMuscular: "peito",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Finaliza o peito e os braços. Sinta a contração máxima.",
          },
          {
            nome: "Tríceps Testa com Barra EZ",
            grupoMuscular: "triceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Excelente para tonificar a parte de baixo do braço.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Finalizador — mantém os ombros definidos enquanto trabalha os braços.",
          },
        ],
      },
    },
  },

  /* ══════════════════════════════════════════════════════════
     PROGRAMA 5 — HIPERTROFIA ABCD (4x / semana)
     Para quem já completou o programa ABC e quer avançar.
     Mais volume por grupo muscular para maior crescimento.
  ══════════════════════════════════════════════════════════ */
  {
    id: "hipertrofia-abcd-4x",
    nome: "Hipertrofia ABCD — Avançado",
    descricao:
      "Programa de 4 dias com divisão Peito/Tríceps, Costas/Bíceps, Pernas, Ombros/Core. Mais volume por grupo muscular. Recomendado após completar o programa iniciante ABC.",
    objetivo: "hipertrofia",
    nivel: "intermediario",
    frequencia: 4,
    duracao: 12,
    sexo: "todos",
    destaque: false,
    treinos: {
      A: {
        foco: "Peito e Tríceps",
        icone: "💪",
        orientacao:
          "Sessão dedicada ao peito. Maior volume que o programa iniciante. Execute os compostos primeiro, finalize com isoladores.",
        exercicios: [
          {
            nome: "Supino Reto com Barra",
            grupoMuscular: "peito",
            series: 4,
            reps: "8-10",
            descanso: "120s",
            dica: "Carga mais pesada nesta fase. Mantém a técnica perfeita.",
          },
          {
            nome: "Supino Inclinado com Halteres",
            grupoMuscular: "peito",
            series: 4,
            reps: "10-12",
            descanso: "90s",
            dica: "Halteres permitem amplitude maior que a barra. Explore isso.",
          },
          {
            nome: "Supino Declinado com Barra",
            grupoMuscular: "peito",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Ativa o peitoral inferior para desenvolvimento completo.",
          },
          {
            nome: "Crossover no Cabo",
            grupoMuscular: "peito",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Isolamento. Cruzar as mãos ativa as fibras mediais do peito.",
          },
          {
            nome: "Pull Over com Haltere",
            grupoMuscular: "peito",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Trabalha peito e serrátil. Excelente para expansão torácica.",
          },
          {
            nome: "Tríceps Testa com Barra EZ",
            grupoMuscular: "triceps",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Começa tríceps com o mais pesado.",
          },
          {
            nome: "Tríceps Pulley (Barra Reta)",
            grupoMuscular: "triceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Volume alto de cabo para finalizar.",
          },
        ],
      },
      B: {
        foco: "Costas e Bíceps",
        icone: "🔙",
        orientacao:
          "Sessão de costas com volume alto. Foque na conexão mente-músculo — sinta o latíssimo em cada repetição.",
        exercicios: [
          {
            nome: "Levantamento Terra (Deadlift)",
            grupoMuscular: "costas",
            series: 4,
            reps: "6-8",
            descanso: "180s",
            dica: "Rei dos exercícios compostos. Técnica é tudo. Não arredonde a lombar.",
          },
          {
            nome: "Remada Curvada com Barra",
            grupoMuscular: "costas",
            series: 4,
            reps: "8-10",
            descanso: "120s",
            dica: "Puxe até o umbigo. Tronco paralelo ao chão para máximo trabalho do dorsal.",
          },
          {
            nome: "Puxada Frontal no Pulley",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Pegada larga, incline levemente o tronco para trás.",
          },
          {
            nome: "Pulldown com Triângulo",
            grupoMuscular: "costas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Pegada neutra. Trabalha o dorsal por um ângulo diferente.",
          },
          {
            nome: "Remada Unilateral com Haltere",
            grupoMuscular: "costas",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Amplitude total. Estique o dorsal na descida.",
          },
          {
            nome: "Rosca Scott (Barra EZ)",
            grupoMuscular: "biceps",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Apoio elimina compensação. Foco puro no bíceps.",
          },
          {
            nome: "Rosca Alternada com Halteres",
            grupoMuscular: "biceps",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Finalizador. Supine no topo para pico máximo.",
          },
        ],
      },
      C: {
        foco: "Pernas Completo",
        icone: "🦵",
        orientacao:
          "Sessão dedicada às pernas. Sessão mais difícil da semana. Não pule o dia de pernas!",
        exercicios: [
          {
            nome: "Agachamento Livre",
            grupoMuscular: "pernas",
            series: 5,
            reps: "8-10",
            descanso: "120s",
            dica: "Exercício principal. Carga progressiva a cada semana.",
          },
          {
            nome: "Leg Press 45°",
            grupoMuscular: "pernas",
            series: 4,
            reps: "10-12",
            descanso: "90s",
            dica: "Posições diferentes de pé ativam quadríceps ou glúteos.",
          },
          {
            nome: "Agachamento Búlgaro",
            grupoMuscular: "pernas",
            series: 3,
            reps: "10-12 por perna",
            descanso: "90s",
            dica: "Excelente para simetria e unilateral.",
          },
          {
            nome: "Extensão de Pernas",
            grupoMuscular: "pernas",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Isolamento do quadríceps após os compostos.",
          },
          {
            nome: "Flexão de Pernas (Cadeira Flexora)",
            grupoMuscular: "pernas",
            series: 4,
            reps: "10-12",
            descanso: "60s",
            dica: "Não negligencie os isquiotibiais. Equilíbrio previne lesões.",
          },
          {
            nome: "Cadeira Abdutora",
            grupoMuscular: "pernas",
            series: 3,
            reps: "15-20",
            descanso: "45s",
            dica: "Glúteo médio. Importante para estabilidade e estética.",
          },
          {
            nome: "Elevação de Panturrilha em Pé",
            grupoMuscular: "pernas",
            series: 5,
            reps: "15-20",
            descanso: "45s",
            dica: "Panturrilha precisa de volume alto. Cinco séries é o mínimo.",
          },
        ],
      },
      D: {
        foco: "Ombros",
        icone: "🏆",
        orientacao:
          "Sessão dedicada aos ombros — o músculo que mais muda a silhueta. Trabalha os três deltoides.",
        exercicios: [
          {
            nome: "Desenvolvimento Militar com Barra",
            grupoMuscular: "ombros",
            series: 4,
            reps: "8-10",
            descanso: "120s",
            dica: "Exercício composto principal de ombros. Carga progressiva.",
          },
          {
            nome: "Desenvolvimento com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "10-12",
            descanso: "90s",
            dica: "Halteres permitem rotação natural, mais natural para o ombro.",
          },
          {
            nome: "Elevação Lateral com Halteres",
            grupoMuscular: "ombros",
            series: 4,
            reps: "12-15",
            descanso: "60s",
            dica: "O mais importante para largura. Sinta o deltoide medial.",
          },
          {
            nome: "Elevação Frontal com Halteres",
            grupoMuscular: "ombros",
            series: 3,
            reps: "12-15",
            descanso: "60s",
            dica: "Deltoide anterior. Não eleve além dos ombros.",
          },
          {
            nome: "Crucifixo Invertido (Deltoide Posterior)",
            grupoMuscular: "ombros",
            series: 4,
            reps: "15-20",
            descanso: "45s",
            dica: "Deltoide posterior é o mais negligenciado. Essencial para postura e completude.",
          },
          {
            nome: "Encolhimento de Ombros (Shrug)",
            grupoMuscular: "ombros",
            series: 3,
            reps: "15-20",
            descanso: "60s",
            dica: "Trapézio superior. Não rotacione os ombros.",
          },
          {
            nome: "Rosca Direta com Barra",
            grupoMuscular: "biceps",
            series: 3,
            reps: "10-12",
            descanso: "60s",
            dica: "Bônus de bíceps no dia de ombros para alta frequência.",
          },
        ],
      },
    },
  },
];

/* ── Helpers de acesso ─────────────────────────────────────── */

/**
 * Retorna todos os programas disponíveis
 * @param {Object} filtros - { objetivo, nivel, sexo, frequencia }
 */
function getProgramas(filtros = {}) {
  return PROGRAMAS_PREDEFINIDOS.filter((p) => {
    if (filtros.objetivo && p.objetivo !== filtros.objetivo) return false;
    if (filtros.nivel && p.nivel !== filtros.nivel) return false;
    if (filtros.sexo && p.sexo !== "todos" && p.sexo !== filtros.sexo)
      return false;
    if (filtros.frequencia && p.frequencia !== filtros.frequencia) return false;
    return true;
  });
}

/**
 * Retorna um programa pelo id
 * @param {string} id
 */
function getProgramaById(id) {
  return PROGRAMAS_PREDEFINIDOS.find((p) => p.id === id) || null;
}

/**
 * Retorna os programas em destaque
 */
function getProgramasDestaque() {
  return PROGRAMAS_PREDEFINIDOS.filter((p) => p.destaque);
}

/**
 * Retorna as letras de treino de um programa
 * @param {string} programaId
 */
function getTreinosDoPrograma(programaId) {
  const programa = getProgramaById(programaId);
  if (!programa) return [];
  return Object.keys(programa.treinos);
}

/**
 * Retorna um treino específico de um programa
 * @param {string} programaId
 * @param {string} letra  — "A" | "B" | "C" | "D"
 */
function getTreinoDoPrograma(programaId, letra) {
  const programa = getProgramaById(programaId);
  if (!programa) return null;
  return programa.treinos[letra] || null;
}
