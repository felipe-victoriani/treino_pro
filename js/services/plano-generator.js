/* ============================================================
   TREINO PRO — Gerador de Planos Local
   Cria planos de treino personalizados sem depender de APIs externas.
   Mesmo formato de saída da Gemini API para compatibilidade total.
   ============================================================ */

/* ──────────────────────────────────────────────────────────────
   Banco de exercícios
   { n: nome, min: nível mínimo (1=Inic, 2=Inter, 3=Avanç), o: observação }
   ────────────────────────────────────────────────────────────── */
const EXERCISE_DB = {
  academia: {
    peito: [
      {
        n: "Supino Reto com Barra",
        min: 1,
        o: "Pés no chão, escápulas retraídas, cotovelos a 75°",
      },
      {
        n: "Supino Inclinado com Barra",
        min: 1,
        o: "Inclinação 30–45°, ênfase no peitoral superior",
      },
      {
        n: "Supino Reto com Halteres",
        min: 1,
        o: "Amplitude maior, rotação interna no topo",
      },
      {
        n: "Crucifixo com Halteres",
        min: 1,
        o: "Leve flexão nos cotovelos, controle na abertura",
      },
      {
        n: "Pec Deck (Voador)",
        min: 1,
        o: "Cotovelos não passam da linha dos ombros",
      },
      {
        n: "Chest Press na Máquina",
        min: 1,
        o: "Ajuste o assento para alinhamento dos cotovelos",
      },
      {
        n: "Supino Inclinado com Halteres",
        min: 2,
        o: "Banco 30–45°, rotação interna no topo",
      },
      {
        n: "Supino Declinado com Barra",
        min: 2,
        o: "Ativa peitoral inferior, cuidado com a pegada",
      },
      {
        n: "Crossover no Cabo (Cable Fly)",
        min: 2,
        o: "Controle a fase excêntrica por 2 segundos",
      },
      {
        n: "Crucifixo no Cabo Baixo",
        min: 3,
        o: "Tensão constante, cruze os punhos no topo",
      },
    ],
    costas: [
      {
        n: "Puxada Frontal (Lat Pulldown)",
        min: 1,
        o: "Puxe até o queixo, cotovelos apontando para baixo",
      },
      {
        n: "Remada Baixa no Cabo",
        min: 1,
        o: "Costas retas, puxe até o abdômen",
      },
      {
        n: "Remada na Máquina",
        min: 1,
        o: "Apoie o peito no suporte, puxe com as costas",
      },
      {
        n: "Puxada Fechada (Pegada Neutra)",
        min: 1,
        o: "Puxe até o peito, controle a descida",
      },
      {
        n: "Remada Unilateral (Serrote)",
        min: 1,
        o: "Cotovelo paralelo ao tronco, retração escapular",
      },
      {
        n: "Remada Curvada com Barra",
        min: 2,
        o: "Tronco a 45°, puxe até o umbigo",
      },
      {
        n: "Remada Alta com Barra",
        min: 2,
        o: "Cotovelos acima dos ombros, pegada larga",
      },
      {
        n: "Levantamento Terra Romeno",
        min: 2,
        o: "Barra próxima ao corpo, quadril recua primeiro",
      },
      {
        n: "Levantamento Terra",
        min: 3,
        o: "Coluna neutra, ative o core antes de puxar",
      },
      {
        n: "Pull-Down no Cabo (Straight Arm)",
        min: 3,
        o: "Braços estendidos, foca no latíssimo",
      },
    ],
    ombro: [
      {
        n: "Desenvolvimento com Halteres",
        min: 1,
        o: "Cotovelos a 90°, pressione sem travar",
      },
      {
        n: "Elevação Lateral com Halteres",
        min: 1,
        o: "Polegar levemente para baixo no topo",
      },
      {
        n: "Elevação Frontal com Halteres",
        min: 1,
        o: "Suba até a altura do ombro, controle a descida",
      },
      {
        n: "Desenvolvimento na Máquina",
        min: 1,
        o: "Ajuste para alinhamento dos cotovelos",
      },
      {
        n: "Desenvolvimento com Barra",
        min: 2,
        o: "Core ativado, empurre verticalmente",
      },
      {
        n: "Press Arnold",
        min: 2,
        o: "Rotação do pulso de dentro para fora ao subir",
      },
      {
        n: "Elevação Lateral no Cabo",
        min: 2,
        o: "Maior tensão constante que com haltere",
      },
      {
        n: "Face Pull no Cabo",
        min: 2,
        o: "Puxe até a testa, cotovelos altos",
      },
      {
        n: "Pássaro (Fly Invertido) c/ Halteres",
        min: 2,
        o: "Tronco paralelo ao chão, cotovelos flexionados",
      },
    ],
    biceps: [
      {
        n: "Rosca Direta com Barra",
        min: 1,
        o: "Cotovelos fixos ao tronco, supinação no topo",
      },
      {
        n: "Rosca Alternada com Halteres",
        min: 1,
        o: "Gire o pulso ao subir, cotovelos fixos",
      },
      {
        n: "Rosca Martelo com Halteres",
        min: 1,
        o: "Pegada neutra, trabalha braquial e braquiorradial",
      },
      {
        n: "Rosca na Máquina",
        min: 1,
        o: "Apoie os braços, amplitude completa",
      },
      {
        n: "Rosca Scott com Barra W",
        min: 2,
        o: "Sem balançar o corpo, amplitude total",
      },
      {
        n: "Rosca Concentrada",
        min: 2,
        o: "Cotovelo na coxa, contraia no topo por 1s",
      },
      {
        n: "Rosca no Cabo (Polia Baixa)",
        min: 2,
        o: "Tensão constante durante todo o movimento",
      },
      {
        n: "Rosca Inclinada com Halteres",
        min: 3,
        o: "Banco 45°, maior alongamento do bíceps",
      },
      {
        n: "Spider Curl no Banco Inclinado",
        min: 3,
        o: "Peito no banco, isolamento máximo",
      },
    ],
    triceps: [
      {
        n: "Tríceps Pulley (Corda)",
        min: 1,
        o: "Abra a corda no final para ativar a cabeça lateral",
      },
      {
        n: "Tríceps Pulley (Barra Reta)",
        min: 1,
        o: "Cotovelos fixos ao tronco, estenda completamente",
      },
      {
        n: "Tríceps na Máquina",
        min: 1,
        o: "Cotovelos apoiados, amplitude completa",
      },
      {
        n: "Mergulho entre Bancos (Bench Dip)",
        min: 1,
        o: "Cotovelos apontando para trás, desça até 90°",
      },
      {
        n: "Tríceps Testa com Barra",
        min: 2,
        o: "Baixe até a testa mantendo cotovelos fixos",
      },
      {
        n: "Mergulho nas Barras Paralelas",
        min: 2,
        o: "Tronco ereto para focar no tríceps",
      },
      {
        n: "Skullcrusher com Barra W",
        min: 2,
        o: "Baixe atrás da cabeça para maior amplitude",
      },
      {
        n: "Tríceps Coice (Kickback)",
        min: 2,
        o: "Tronco paralelo ao chão, estenda completamente",
      },
      {
        n: "Tríceps Pulley Invertido",
        min: 3,
        o: "Pegada supinada ativa mais a cabeça longa",
      },
    ],
    quadriceps: [
      {
        n: "Agachamento Livre com Barra",
        min: 1,
        o: "Pés alinhados com ombros, joelhos seguem a ponta do pé",
      },
      {
        n: "Leg Press 45°",
        min: 1,
        o: "Pés no meio da plataforma, não tranque os joelhos",
      },
      {
        n: "Extensora (Leg Extension)",
        min: 1,
        o: "Controle a descida por 2s, não tranque o joelho",
      },
      {
        n: "Agachamento no Smith",
        min: 1,
        o: "Pés levemente à frente do corpo",
      },
      {
        n: "Agachamento Hack",
        min: 2,
        o: "Tronco mais ereto, ênfase no quadríceps",
      },
      {
        n: "Afundo com Barra (Lunge)",
        min: 2,
        o: "Joelho traseiro quase toca o chão, tronco ereto",
      },
      {
        n: "Agachamento Sumô com Barra",
        min: 2,
        o: "Pés bem abertos, pontas dos pés para fora",
      },
      {
        n: "Step-Up com Halteres",
        min: 2,
        o: "Suba pelo calcanhar da perna da frente",
      },
      {
        n: "Leg Press Unilateral",
        min: 3,
        o: "Amplitude completa, excêntrico de 3s",
      },
    ],
    posterior: [
      {
        n: "Stiff com Barra (RDL)",
        min: 1,
        o: "Joelhos levemente flexionados, empurre o quadril para trás",
      },
      {
        n: "Cadeira Flexora (Leg Curl)",
        min: 1,
        o: "Pausa de 1s na contração máxima",
      },
      {
        n: "Mesa Flexora",
        min: 1,
        o: "Amplitude completa, controle a descida",
      },
      {
        n: "Hip Thrust com Barra",
        min: 1,
        o: "Pausa de 2s no topo, contração do glúteo",
      },
      {
        n: "Abdução de Quadril na Máquina",
        min: 1,
        o: "Movimento controlado, pausa na contração",
      },
      {
        n: "Levantamento Terra Romeno",
        min: 2,
        o: "Barra próxima às pernas, quadril recua",
      },
      {
        n: "Afundo Reverso com Barra",
        min: 2,
        o: "Passo para trás, joelho traseiro toca o chão",
      },
      {
        n: "Kickback no Cabo (Glúteo)",
        min: 2,
        o: "Quadril estável, contração no topo",
      },
      {
        n: "Agachamento Búlgaro (Split Squat)",
        min: 3,
        o: "Pé traseiro elevado, desça até 90° no quadril",
      },
    ],
    panturrilha: [
      {
        n: "Panturrilha em Pé na Máquina",
        min: 1,
        o: "Amplitude completa, pausa de 1s no topo",
      },
      {
        n: "Panturrilha Sentada (Sóleo)",
        min: 1,
        o: "Trabalha o sóleo, amplitude completa",
      },
      {
        n: "Panturrilha no Leg Press",
        min: 2,
        o: "Pressione com a ponta dos pés, amplitude total",
      },
      {
        n: "Panturrilha Unilateral c/ Haltere",
        min: 2,
        o: "Maior sobrecarga, pausa de 1s no topo",
      },
    ],
    abdomen: [
      {
        n: "Crunch Abdominal",
        min: 1,
        o: "Não force o pescoço, contraia o abdômen",
      },
      {
        n: "Prancha Frontal",
        min: 1,
        o: "Quadril neutro, respire normalmente",
      },
      {
        n: "Abdominal Oblíquo",
        min: 1,
        o: "Gire o ombro em direção ao joelho oposto",
      },
      {
        n: "Elevação de Pernas na Barra",
        min: 2,
        o: "Controle o movimento, evite balançar",
      },
      {
        n: "Abdominal na Polia",
        min: 2,
        o: "Flexione a coluna, não puxe com os braços",
      },
      {
        n: "Hollow Body Hold",
        min: 2,
        o: "Costas no chão, lombar pressionada",
      },
      {
        n: "Roda Abdominal (Abs Wheel)",
        min: 3,
        o: "Core ativado, coluna neutra durante o movimento",
      },
    ],
  },

  halteres: {
    peito: [
      {
        n: "Supino Reto com Halteres",
        min: 1,
        o: "Amplitude maior que com barra, cotovelos a 75°",
      },
      {
        n: "Supino Inclinado com Halteres",
        min: 1,
        o: "Banco 30–45°, rotação interna no topo",
      },
      {
        n: "Crucifixo com Halteres",
        min: 1,
        o: "Leve flexão nos cotovelos, amplitude controlada",
      },
      {
        n: "Supino Declinado com Halteres",
        min: 2,
        o: "Ativa peitoral inferior, atenção ao equilíbrio",
      },
      {
        n: "Pullover com Haltere",
        min: 2,
        o: "Expanda o tórax, cotovelos levemente flexionados",
      },
      {
        n: "Flexão com Halteres (Pushup Row)",
        min: 2,
        o: "Flexão + remada unilateral alternada, core ativo",
      },
    ],
    costas: [
      {
        n: "Remada Unilateral (Serrote)",
        min: 1,
        o: "Cotovelo paralelo ao tronco, retração escapular",
      },
      {
        n: "Remada Curvada com Halteres",
        min: 1,
        o: "Tronco a 45°, puxe até o umbigo",
      },
      {
        n: "Stiff com Halteres (RDL)",
        min: 1,
        o: "Empurre o quadril para trás, joelhos levemente dobrados",
      },
      {
        n: "Pullover com Haltere",
        min: 2,
        o: "Expanda bem o tórax, sinta o latíssimo",
      },
      {
        n: "Levantamento Terra com Halteres",
        min: 2,
        o: "Halteres nas laterais, coluna neutra",
      },
      {
        n: "Remada Alta com Halteres",
        min: 2,
        o: "Cotovelos sobem acima dos ombros",
      },
    ],
    ombro: [
      {
        n: "Desenvolvimento com Halteres",
        min: 1,
        o: "Cotovelos a 90°, pressione sem travar",
      },
      {
        n: "Elevação Lateral com Halteres",
        min: 1,
        o: "Polegar levemente para baixo no topo",
      },
      {
        n: "Elevação Frontal com Halteres",
        min: 1,
        o: "Suba alternado ou simultâneo até o ombro",
      },
      { n: "Press Arnold", min: 2, o: "Rotação progressiva do pulso ao subir" },
      {
        n: "Pássaro c/ Halteres (Fly Invertido)",
        min: 2,
        o: "Tronco paralelo ao chão, cotovelos flexionados",
      },
      {
        n: "Remada Alta com Halteres",
        min: 2,
        o: "Cotovelos acima dos ombros, pegada larga",
      },
    ],
    biceps: [
      {
        n: "Rosca Direta com Halteres",
        min: 1,
        o: "Cotovelos fixos ao tronco, supine no topo",
      },
      {
        n: "Rosca Alternada com Halteres",
        min: 1,
        o: "Alterne os braços, rotação ao subir",
      },
      {
        n: "Rosca Martelo com Halteres",
        min: 1,
        o: "Pegada neutra, trabalha braquial e braquiorradial",
      },
      {
        n: "Rosca Concentrada",
        min: 2,
        o: "Cotovelo na coxa, contração máxima no topo",
      },
      {
        n: "Rosca Inclinada com Halteres",
        min: 2,
        o: "Banco 45°, maior amplitude e alongamento",
      },
      {
        n: "Rosca 21 com Halteres",
        min: 3,
        o: "7 parciais baixas + 7 parciais altas + 7 completas",
      },
    ],
    triceps: [
      {
        n: "Tríceps Francês com Haltere",
        min: 1,
        o: "Baixe atrás da cabeça para maior amplitude",
      },
      {
        n: "Tríceps Coice (Kickback)",
        min: 1,
        o: "Tronco paralelo ao chão, estenda completamente",
      },
      {
        n: "Mergulho entre Cadeiras (Bench Dip)",
        min: 1,
        o: "Cotovelos apontando para trás, desça até 90°",
      },
      {
        n: "Extensão de Tríceps sobre a Cabeça",
        min: 2,
        o: "Segure o haltere com ambas as mãos",
      },
      {
        n: "Tríceps Francês Unilateral",
        min: 2,
        o: "Maior amplitude, trabalha a cabeça longa",
      },
      {
        n: "Tríceps Testa com Halteres",
        min: 2,
        o: "Baixe até a testa, cotovelos fixos",
      },
    ],
    quadriceps: [
      {
        n: "Agachamento Goblet com Haltere",
        min: 1,
        o: "Haltere na frente do peito, postura ereta",
      },
      {
        n: "Agachamento com Halteres",
        min: 1,
        o: "Halteres nas laterais, amplitude completa",
      },
      {
        n: "Afundo (Lunge) com Halteres",
        min: 1,
        o: "Passada longa, joelho traseiro quase no chão",
      },
      {
        n: "Agachamento Sumô com Haltere",
        min: 1,
        o: "Pés bem abertos, haltere entre as pernas",
      },
      {
        n: "Step-Up com Halteres",
        min: 2,
        o: "Suba pelo calcanhar da perna da frente",
      },
      {
        n: "Agachamento Búlgaro com Halteres",
        min: 2,
        o: "Pé traseiro elevado no banco, amplitude total",
      },
    ],
    posterior: [
      {
        n: "Stiff com Halteres (RDL)",
        min: 1,
        o: "Joelhos levemente flexionados, empurre o quadril",
      },
      {
        n: "Hip Thrust com Haltere",
        min: 1,
        o: "Ombros no banco, pausa de 2s no topo",
      },
      {
        n: "Afundo Reverso com Halteres",
        min: 1,
        o: "Passo para trás, joelho quase no chão",
      },
      {
        n: "Levantamento Terra com Halteres",
        min: 2,
        o: "Coluna neutra, ative o core",
      },
      {
        n: "Agachamento Búlgaro c/ Halteres (Glúteo)",
        min: 2,
        o: "Incline o tronco levemente para frente",
      },
    ],
    panturrilha: [
      {
        n: "Panturrilha em Pé com Halteres",
        min: 1,
        o: "Halteres nas laterais, amplitude completa",
      },
      {
        n: "Panturrilha Unilateral c/ Haltere",
        min: 1,
        o: "Mais intensidade, pausa de 1s no topo",
      },
    ],
    abdomen: [
      {
        n: "Crunch Abdominal",
        min: 1,
        o: "Contraia o abdômen, não force o pescoço",
      },
      {
        n: "Russian Twist com Haltere",
        min: 1,
        o: "Pés elevados, gire o tronco de lado a lado",
      },
      {
        n: "Prancha Frontal",
        min: 1,
        o: "Quadril neutro, respire normalmente",
      },
      {
        n: "Elevação de Pernas no Chão",
        min: 1,
        o: "Controle o movimento, costas no chão",
      },
      {
        n: "Dead Bug com Haltere",
        min: 2,
        o: "Braço e perna opostos, lombar pressionada",
      },
    ],
  },

  sem_equipamento: {
    peito: [
      {
        n: "Flexão de Braço",
        min: 1,
        o: "Mãos alinhadas com os ombros, peito ao chão",
      },
      {
        n: "Flexão Inclinada (Pés Elevados)",
        min: 1,
        o: "Pés em superfície elevada, foca peito superior",
      },
      {
        n: "Flexão Declinada (Mãos Elevadas)",
        min: 1,
        o: "Mãos em superfície elevada, foca peito inferior",
      },
      {
        n: "Flexão Diamante",
        min: 1,
        o: "Mãos formando triângulo, ativa tríceps e peito",
      },
      {
        n: "Flexão Archer",
        min: 2,
        o: "Um braço se estende lateralmente a cada repetição",
      },
      {
        n: "Flexão com Explosão",
        min: 3,
        o: "Explosão na subida, pousa suavemente",
      },
    ],
    costas: [
      {
        n: "Superman",
        min: 1,
        o: "Levante braços e pernas do chão, pausa de 2s",
      },
      {
        n: "Extensão de Costas no Chão",
        min: 1,
        o: "Mãos atrás da cabeça, eleve o tronco",
      },
      {
        n: "Remada Invertida (Australian Pull-Up)",
        min: 1,
        o: "Corpo reto, puxe o peito até a barra/mesa",
      },
      {
        n: "Barra Fixa (Pull-Up)",
        min: 2,
        o: "Puxe até o queixo acima da barra, controle a descida",
      },
      {
        n: "Chin-Up (Pegada Supinada)",
        min: 2,
        o: "Palmas voltadas para você, bíceps bem ativado",
      },
      {
        n: "Barra Fixa Pegada Neutra",
        min: 3,
        o: "Pegada em paralelas ou argolas, amplitude total",
      },
    ],
    ombro: [
      {
        n: "Flexão Pike",
        min: 1,
        o: "Quadril elevado formando um V invertido",
      },
      {
        n: "Pike Push-Up",
        min: 1,
        o: "Posição de V, cabeça quase no chão na descida",
      },
      {
        n: "Arm Circles (Círculos de Braço)",
        min: 1,
        o: "Círculos lentos e amplos nas duas direções",
      },
      {
        n: "Elevação Lateral com Garrafa",
        min: 1,
        o: "Use garrafas cheias como resistência",
      },
      {
        n: "Wall Handstand Push-Up",
        min: 3,
        o: "Pés na parede, desça a cabeça ao chão",
      },
    ],
    biceps: [
      {
        n: "Chin-Up (Pegada Supinada)",
        min: 2,
        o: "Pegada supinada ativa mais o bíceps",
      },
      {
        n: "Rosca Isométrica (contra resistência)",
        min: 1,
        o: "Pressione um braço contra o outro",
      },
      {
        n: "Flexão Supinada em Mesa",
        min: 1,
        o: "Pegada supinada por baixo de mesa firme",
      },
    ],
    triceps: [
      {
        n: "Flexão Diamante",
        min: 1,
        o: "Mãos próximas formando um triângulo",
      },
      {
        n: "Mergulho entre Cadeiras",
        min: 1,
        o: "Cotovelos apontando para trás, desça até 90°",
      },
      {
        n: "Extensão de Tríceps no Chão",
        min: 1,
        o: "Deite, cotovelos dobrados, empurre o corpo",
      },
      {
        n: "Dip na Cadeira (Bench Dip)",
        min: 2,
        o: "Pés elevados para maior dificuldade",
      },
    ],
    quadriceps: [
      {
        n: "Agachamento Bodyweight",
        min: 1,
        o: "Pés alinhados com ombros, desça até 90°",
      },
      {
        n: "Agachamento Sumô",
        min: 1,
        o: "Pés bem abertos, pontas dos pés para fora",
      },
      {
        n: "Afundo (Lunge)",
        min: 1,
        o: "Passada longa, joelho traseiro quase no chão",
      },
      {
        n: "Wall Sit (Isométrico)",
        min: 1,
        o: "Costas na parede, joelhos a 90°, 30–60s",
      },
      {
        n: "Agachamento Búlgaro",
        min: 2,
        o: "Pé traseiro elevado, desça até 90° no quadril",
      },
      {
        n: "Pistol Squat (Progressão)",
        min: 3,
        o: "Use apoio se necessário, amplitude completa",
      },
    ],
    posterior: [
      {
        n: "Ponte de Glúteo",
        min: 1,
        o: "Pausa de 2s no topo, contração do glúteo",
      },
      {
        n: "Donkey Kick",
        min: 1,
        o: "Quatro apoios, eleve o joelho dobrado para trás",
      },
      {
        n: "Good Morning sem Peso",
        min: 1,
        o: "Mãos atrás da cabeça, empurre o quadril para trás",
      },
      {
        n: "Afundo Reverso",
        min: 1,
        o: "Passo para trás, joelho traseiro quase no chão",
      },
      {
        n: "Hip Thrust com Peso Corporal",
        min: 1,
        o: "Ombros no banco, pausa de 2s no topo",
      },
      {
        n: "Agachamento Búlgaro (Glúteo)",
        min: 2,
        o: "Pé traseiro elevado, tronco levemente inclinado",
      },
    ],
    panturrilha: [
      {
        n: "Panturrilha em Pé (Sem Peso)",
        min: 1,
        o: "Use degrau para amplitude máxima",
      },
      {
        n: "Panturrilha Unilateral",
        min: 1,
        o: "Mais intensidade, pausa de 1s no topo",
      },
      {
        n: "Jump Squat",
        min: 2,
        o: "Explosivo, pousa suavemente em agachamento",
      },
    ],
    abdomen: [
      {
        n: "Crunch Abdominal",
        min: 1,
        o: "Contraia o abdômen, não force o pescoço",
      },
      {
        n: "Prancha Frontal",
        min: 1,
        o: "Quadril neutro, respire normalmente",
      },
      {
        n: "Elevação de Pernas no Chão",
        min: 1,
        o: "Controle o movimento, costas no chão",
      },
      {
        n: "Bicicleta Abdominal",
        min: 1,
        o: "Cotovelo ao joelho oposto, ritmo controlado",
      },
      {
        n: "Mountain Climber",
        min: 2,
        o: "Core ativado, puxe os joelhos ao peito",
      },
      { n: "V-Up", min: 2, o: "Braços e pernas sobem simultaneamente" },
    ],
  },
};

/* ──────────────────────────────────────────────────────────────
   Divisões de treino — [musculo, qtd_exercicios]
   ────────────────────────────────────────────────────────────── */
const SPLITS = {
  2: {
    INICIANTE: {
      div: "A/B",
      treinos: [
        {
          l: "A",
          nome: "Full Body A",
          grupos: [
            ["peito", 2],
            ["costas", 2],
            ["quadriceps", 2],
            ["abdomen", 1],
          ],
        },
        {
          l: "B",
          nome: "Full Body B",
          grupos: [
            ["ombro", 2],
            ["posterior", 2],
            ["biceps", 1],
            ["triceps", 1],
            ["panturrilha", 1],
          ],
        },
      ],
    },
    INTERMEDIARIO: {
      div: "A/B",
      treinos: [
        {
          l: "A",
          nome: "Upper Body",
          grupos: [
            ["peito", 3],
            ["costas", 3],
            ["ombro", 2],
          ],
        },
        {
          l: "B",
          nome: "Lower Body",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 3],
            ["panturrilha", 1],
            ["abdomen", 1],
          ],
        },
      ],
    },
    AVANCADO: {
      div: "A/B",
      treinos: [
        {
          l: "A",
          nome: "Upper Body",
          grupos: [
            ["peito", 3],
            ["costas", 3],
            ["ombro", 2],
            ["biceps", 1],
            ["triceps", 1],
          ],
        },
        {
          l: "B",
          nome: "Lower Body",
          grupos: [
            ["quadriceps", 4],
            ["posterior", 3],
            ["panturrilha", 2],
            ["abdomen", 1],
          ],
        },
      ],
    },
  },
  3: {
    INICIANTE: {
      div: "A/B/C",
      treinos: [
        {
          l: "A",
          nome: "Peito, Ombro e Tríceps",
          grupos: [
            ["peito", 3],
            ["ombro", 2],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 3],
            ["biceps", 2],
            ["abdomen", 1],
          ],
        },
        {
          l: "C",
          nome: "Perna Completa",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 2],
            ["panturrilha", 1],
          ],
        },
      ],
    },
    INTERMEDIARIO: {
      div: "A/B/C",
      treinos: [
        {
          l: "A",
          nome: "Peito, Ombro e Tríceps",
          grupos: [
            ["peito", 3],
            ["ombro", 2],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 4],
            ["biceps", 3],
            ["abdomen", 1],
          ],
        },
        {
          l: "C",
          nome: "Perna Completa",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 3],
            ["panturrilha", 2],
          ],
        },
      ],
    },
    AVANCADO: {
      div: "A/B/C",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 4],
            ["triceps", 3],
            ["abdomen", 1],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 4],
            ["biceps", 3],
          ],
        },
        {
          l: "C",
          nome: "Perna e Ombro",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 3],
            ["ombro", 2],
            ["panturrilha", 1],
          ],
        },
      ],
    },
  },
  4: {
    INICIANTE: {
      div: "A/B/C/D",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 3],
            ["triceps", 2],
            ["abdomen", 1],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 3],
            ["biceps", 2],
          ],
        },
        {
          l: "C",
          nome: "Pernas",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 2],
            ["panturrilha", 1],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Core",
          grupos: [
            ["ombro", 3],
            ["abdomen", 2],
          ],
        },
      ],
    },
    INTERMEDIARIO: {
      div: "A/B/C/D",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 4],
            ["triceps", 3],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 4],
            ["biceps", 3],
          ],
        },
        {
          l: "C",
          nome: "Perna Completa",
          grupos: [
            ["quadriceps", 4],
            ["posterior", 2],
            ["panturrilha", 2],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Core",
          grupos: [
            ["ombro", 4],
            ["abdomen", 2],
          ],
        },
      ],
    },
    AVANCADO: {
      div: "A/B/C/D",
      treinos: [
        {
          l: "A",
          nome: "Peito, Ombro e Tríceps",
          grupos: [
            ["peito", 4],
            ["ombro", 3],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 5],
            ["biceps", 3],
          ],
        },
        {
          l: "C",
          nome: "Quadríceps e Panturrilha",
          grupos: [
            ["quadriceps", 5],
            ["panturrilha", 2],
            ["abdomen", 1],
          ],
        },
        {
          l: "D",
          nome: "Posterior, Glúteo e Ombro",
          grupos: [
            ["posterior", 4],
            ["ombro", 2],
            ["abdomen", 1],
          ],
        },
      ],
    },
  },
  5: {
    INICIANTE: {
      div: "A/B/C/D/E",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 3],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 3],
            ["biceps", 2],
            ["abdomen", 1],
          ],
        },
        {
          l: "C",
          nome: "Pernas",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 2],
            ["panturrilha", 1],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Core",
          grupos: [
            ["ombro", 3],
            ["abdomen", 2],
          ],
        },
        {
          l: "E",
          nome: "Full Body Leve",
          grupos: [
            ["peito", 1],
            ["costas", 1],
            ["quadriceps", 1],
            ["abdomen", 2],
          ],
        },
      ],
    },
    INTERMEDIARIO: {
      div: "A/B/C/D/E",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 4],
            ["triceps", 3],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 4],
            ["biceps", 3],
          ],
        },
        {
          l: "C",
          nome: "Quadríceps e Panturrilha",
          grupos: [
            ["quadriceps", 4],
            ["panturrilha", 2],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Abdômen",
          grupos: [
            ["ombro", 4],
            ["abdomen", 2],
          ],
        },
        {
          l: "E",
          nome: "Posterior e Glúteo",
          grupos: [
            ["posterior", 4],
            ["abdomen", 2],
          ],
        },
      ],
    },
    AVANCADO: {
      div: "A/B/C/D/E",
      treinos: [
        {
          l: "A",
          nome: "Peito",
          grupos: [
            ["peito", 5],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas",
          grupos: [
            ["costas", 5],
            ["biceps", 2],
          ],
        },
        {
          l: "C",
          nome: "Perna Anterior",
          grupos: [
            ["quadriceps", 5],
            ["panturrilha", 2],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Trapézio",
          grupos: [
            ["ombro", 5],
            ["abdomen", 2],
          ],
        },
        {
          l: "E",
          nome: "Posterior e Glúteo",
          grupos: [
            ["posterior", 5],
            ["abdomen", 2],
          ],
        },
      ],
    },
  },
  6: {
    INICIANTE: {
      div: "A/B/C/D/E/F",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 3],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 3],
            ["biceps", 2],
          ],
        },
        {
          l: "C",
          nome: "Pernas",
          grupos: [
            ["quadriceps", 3],
            ["posterior", 2],
            ["panturrilha", 1],
          ],
        },
        {
          l: "D",
          nome: "Ombro e Core",
          grupos: [
            ["ombro", 3],
            ["abdomen", 2],
          ],
        },
        {
          l: "E",
          nome: "Braços e Abdômen",
          grupos: [
            ["biceps", 3],
            ["triceps", 3],
            ["abdomen", 1],
          ],
        },
        {
          l: "F",
          nome: "Full Body Leve",
          grupos: [
            ["peito", 1],
            ["costas", 1],
            ["quadriceps", 2],
            ["abdomen", 1],
          ],
        },
      ],
    },
    INTERMEDIARIO: {
      div: "A/B/C/D/E/F",
      treinos: [
        {
          l: "A",
          nome: "Peito e Tríceps",
          grupos: [
            ["peito", 4],
            ["triceps", 3],
          ],
        },
        {
          l: "B",
          nome: "Costas e Bíceps",
          grupos: [
            ["costas", 4],
            ["biceps", 3],
          ],
        },
        {
          l: "C",
          nome: "Perna Anterior",
          grupos: [
            ["quadriceps", 4],
            ["panturrilha", 2],
          ],
        },
        {
          l: "D",
          nome: "Ombro",
          grupos: [
            ["ombro", 4],
            ["abdomen", 2],
          ],
        },
        {
          l: "E",
          nome: "Posterior e Glúteo",
          grupos: [
            ["posterior", 4],
            ["abdomen", 1],
          ],
        },
        {
          l: "F",
          nome: "Braços e Core",
          grupos: [
            ["biceps", 3],
            ["triceps", 3],
            ["abdomen", 2],
          ],
        },
      ],
    },
    AVANCADO: {
      div: "A/B/C/D/E/F",
      treinos: [
        {
          l: "A",
          nome: "Peito",
          grupos: [
            ["peito", 5],
            ["triceps", 2],
          ],
        },
        {
          l: "B",
          nome: "Costas",
          grupos: [
            ["costas", 5],
            ["biceps", 2],
          ],
        },
        {
          l: "C",
          nome: "Quadríceps",
          grupos: [
            ["quadriceps", 5],
            ["panturrilha", 2],
          ],
        },
        { l: "D", nome: "Ombro e Trapézio", grupos: [["ombro", 5]] },
        {
          l: "E",
          nome: "Posterior e Glúteo",
          grupos: [
            ["posterior", 5],
            ["abdomen", 2],
          ],
        },
        {
          l: "F",
          nome: "Braços e Core",
          grupos: [
            ["biceps", 4],
            ["triceps", 4],
            ["abdomen", 2],
          ],
        },
      ],
    },
  },
};

/* ──────────────────────────────────────────────────────────────
   Parâmetros de treino por objetivo × nível
   ────────────────────────────────────────────────────────────── */
const TRAINING_PARAMS = {
  Hipertrofia: {
    INICIANTE: { series: 3, reps: "10–12", descanso: "60s" },
    INTERMEDIARIO: { series: 4, reps: "8–12", descanso: "60–90s" },
    AVANCADO: { series: 4, reps: "6–12", descanso: "90s" },
  },
  Emagrecimento: {
    INICIANTE: { series: 3, reps: "15–20", descanso: "30–45s" },
    INTERMEDIARIO: { series: 3, reps: "12–15", descanso: "30–45s" },
    AVANCADO: { series: 4, reps: "12–15", descanso: "30s" },
  },
  Força: {
    INICIANTE: { series: 3, reps: "8–10", descanso: "90s" },
    INTERMEDIARIO: { series: 4, reps: "5–8", descanso: "90–120s" },
    AVANCADO: { series: 5, reps: "3–6", descanso: "120–180s" },
  },
  Resistência: {
    INICIANTE: { series: 3, reps: "15–20", descanso: "30s" },
    INTERMEDIARIO: { series: 3, reps: "15–20", descanso: "30s" },
    AVANCADO: { series: 4, reps: "15–20", descanso: "30s" },
  },
};

/* ──────────────────────────────────────────────────────────────
   Função principal: gerarPlanoLocal
   ────────────────────────────────────────────────────────────── */
function gerarPlanoLocal(nivel, objetivo, dias, equipamentos) {
  const nivelNum = nivel === "AVANCADO" ? 3 : nivel === "INTERMEDIARIO" ? 2 : 1;

  const equipKey =
    equipamentos === "Sem equipamento"
      ? "sem_equipamento"
      : equipamentos === "Halteres"
        ? "halteres"
        : "academia";

  const splitConfig =
    SPLITS[dias]?.[nivel] ||
    SPLITS[Math.max(2, Math.min(6, dias))]?.INICIANTE ||
    SPLITS[3].INICIANTE;

  const params =
    TRAINING_PARAMS[objetivo]?.[nivel] || TRAINING_PARAMS.Hipertrofia.INICIANTE;

  const treinos = splitConfig.treinos.map((treino) => {
    const exercicios = [];

    treino.grupos.forEach(([musculo, qtd]) => {
      const primary = EXERCISE_DB[equipKey]?.[musculo] || [];
      const fallback = EXERCISE_DB.academia?.[musculo] || [];

      // Merge: primary first, then add fallback entries not already in primary
      const merged = [
        ...primary,
        ...fallback.filter((f) => !primary.find((p) => p.n === f.n)),
      ];

      const available = merged.filter((ex) => ex.min <= nivelNum);
      if (!available.length) return;

      const picked = _pickExercises(available, qtd);
      picked.forEach((ex) =>
        exercicios.push({
          nome: ex.n,
          series: params.series,
          repeticoes: params.reps,
          descanso: params.descanso,
          observacao: ex.o,
        }),
      );
    });

    return { treino: treino.l, nome: treino.nome, exercicios };
  });

  return {
    nivel,
    objetivo,
    divisao: splitConfig.div,
    dias_por_semana: dias,
    treinos,
  };
}

/* Seleção variada — usa hora atual como offset para variar sem ser aleatório */
function _pickExercises(arr, n) {
  if (arr.length <= n) return [...arr];
  const offset = Math.floor(Date.now() / 3_600_000) % arr.length;
  const result = [];
  for (let i = 0; i < n && i < arr.length; i++) {
    result.push(arr[(offset + i) % arr.length]);
  }
  return result;
}
