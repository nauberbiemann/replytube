export interface EvergreenTerm {
  pt: string;
  en: string;
  es: string;
}

export interface EvergreenNiche {
  id: string;
  title: string;
  terms: EvergreenTerm[];
}

export interface EvergreenCategory {
  id: string;
  title: string;
  icon: string;
  niches: EvergreenNiche[];
}

export const EVERGREEN_CATEGORIES: EvergreenCategory[] = [
  {
    id: 'saude-bem-estar',
    title: 'Saúde e bem-estar',
    icon: '🧘',
    niches: [
      {
        id: 'exercicios-casa',
        title: '01 Exercícios em casa sem equipamento',
        terms: [
          { pt: 'treino em casa', en: 'home workout', es: 'entrenamiento en casa' },
          { pt: 'treino com peso do corpo', en: 'bodyweight workout', es: 'entrenamiento con peso corporal' },
          { pt: 'flexão de braço', en: 'push ups workout', es: 'flexiones de pecho' },
          { pt: 'agachamento', en: 'squat exercise', es: 'sentadillas' },
          { pt: 'prancha abdominal', en: 'plank exercise', es: 'plancha abdominal' },
          { pt: 'burpee', en: 'burpees workout', es: 'burpees ejercicio' },
          { pt: 'polichinelo', en: 'jumping jacks', es: 'saltos de tijera' },
          { pt: 'barra fixa', en: 'pull ups', es: 'dominadas barra' },
          { pt: 'elástico de treino', en: 'resistance bands workout', es: 'bandas de resistencia' },
          { pt: 'treino hiit', en: 'hiit workout home', es: 'entrenamiento hiit en casa' },
          { pt: 'calistenia', en: 'calisthenics workout', es: 'calistenia para principiantes' },
          { pt: 'sem equipamento', en: 'no equipment workout', es: 'sin equipo ejercicio' },
          { pt: 'treino de corpo inteiro', en: 'full body workout', es: 'cuerpo completo entrenamiento' },
          { pt: 'treino para iniciante', en: 'workout for beginners', es: 'ejercicios para principiantes' },
          { pt: 'treino de 10 minutos', en: '10 minute workout', es: 'entrenamiento de 10 minutos' },
          { pt: 'rotina matinal', en: 'morning workout routine', es: 'rutina matutina de ejercicios' },
          { pt: 'abdômen trincado', en: 'six pack abs workout', es: 'abdomen plano y marcado' },
          { pt: 'treino de glúteo', en: 'glutes workout', es: 'ejercicios para glúteos' },
          { pt: 'queimação muscular', en: 'fat burn workout', es: 'quemar grasa en casa' },
          { pt: 'academia em casa', en: 'home gym setup', es: 'gimnasio en casa' },
        ],
      },
      {
        id: 'alongamento-mobilidade',
        title: '02 Alongamento e mobilidade',
        terms: [
          { pt: 'alongamento matinal', en: 'morning stretch routine', es: 'estiramientos matutinos' },
          { pt: 'alongamento antes de dormir', en: 'bedtime stretching', es: 'estiramientos antes de dormir' },
          { pt: 'mobilidade de quadril', en: 'hip mobility exercises', es: 'movilidad de cadera' },
          { pt: 'mobilidade articular', en: 'joint mobility', es: 'movilidad articular' },
          { pt: 'flexibilidade do corpo', en: 'full body flexibility', es: 'flexibilidad corporal' },
          { pt: 'abertura total pernas', en: 'splits stretching', es: 'abertura de piernas' },
          { pt: 'alongamento pescoço', en: 'neck pain stretch', es: 'estiramiento de cuello' },
          { pt: 'alongamento ombros', en: 'shoulder mobility stretch', es: 'estiramiento de hombros' },
          { pt: 'alongamento coluna', en: 'spine stretch exercises', es: 'estirar la columna' },
          { pt: 'alongamento para idosos', en: 'stretching for seniors', es: 'estiramientos para adultos mayores' },
        ],
      },
      {
        id: 'dor-costas-postura',
        title: '03 Dor nas costas e correção de postura',
        terms: [
          { pt: 'dor na lombar', en: 'lower back pain relief', es: 'aliviar dolor lumbar' },
          { pt: 'correção postural', en: 'posture correction exercises', es: 'corregir postura espalda' },
          { pt: 'dor no nervo ciático', en: 'sciatica pain relief exercises', es: 'aliviar nervio ciatico' },
          { pt: 'descompressão da coluna', en: 'spine decompression', es: 'descompresion espinal' },
          { pt: 'exercícios para postura', en: 'exercises for good posture', es: 'ejercicios buena postura' },
          { pt: 'corcunda nas costas', en: 'dowagers hump fix', es: 'quitar joroba espalda' },
          { pt: 'dor no trapézio', en: 'trapezius pain relief', es: 'dolor de trapecio' },
          { pt: 'fortalecer a lombar', en: 'strengthen lower back', es: 'fortalecer espalda baja' },
        ],
      },
      {
        id: 'sono-insonia',
        title: '04 Sono e insônia',
        terms: [
          { pt: 'como dormir rápido', en: 'how to fall asleep fast', es: 'como dormir rapido' },
          { pt: 'cura para insônia', en: 'insomnia remedies', es: 'remedios para el insomnio' },
          { pt: 'higiene do sono', en: 'sleep hygiene tips', es: 'higiene del sueño' },
          { pt: 'chá para dormir', en: 'tea for sleep', es: 'te para dormir profundamente' },
          { pt: 'som de chuva para dormir', en: 'rain sounds for sleeping', es: 'sonido de lluvia para dormir' },
          { pt: 'ruído branco sono', en: 'white noise deep sleep', es: 'ruido blanco para dormir' },
          { pt: 'meditação para dormir', en: 'sleep meditation guided', es: 'meditacion guiada para dormir' },
          { pt: 'sono profundo rem', en: 'deep sleep tips', es: 'sueño profundo reparador' },
        ],
      },
      {
        id: 'nutricao-alimentos',
        title: '05 Nutrição básica e alimentos funcionais',
        terms: [
          { pt: 'alimentos anti-inflamatórios', en: 'anti inflammatory foods', es: 'alimentos antiinflamatorios' },
          { pt: 'alimentos ricos em ferro', en: 'iron rich foods', es: 'alimentos ricos en hierro' },
          { pt: 'alimentos ricos em magnésio', en: 'magnesium rich foods', es: 'alimentos ricos en magnesio' },
          { pt: 'vitamina d benefícios', en: 'vitamin d benefits', es: 'beneficios de la vitamina d' },
          { pt: 'suco detox verde', en: 'green detox juice', es: 'jugo verde desintoxicante' },
          { pt: 'gorduras boas', en: 'healthy fats', es: 'grasas saludables' },
          { pt: 'alimentos ricos em colágeno', en: 'collagen rich foods', es: 'alimentos ricos en colageno' },
          { pt: 'saúde intestinal e probióticos', en: 'gut health probiotics', es: 'salud intestinal probioticos' },
        ],
      },
      {
        id: 'emagrecimento-sustentavel',
        title: '06 Emagrecimento sustentável',
        terms: [
          { pt: 'déficit calórico', en: 'calorie deficit for weight loss', es: 'deficit calorico para perder peso' },
          { pt: 'como perder barriga', en: 'how to lose belly fat', es: 'como bajar la panza' },
          { pt: 'perder peso sem passar fome', en: 'lose weight without starving', es: 'perder peso sin pasar hambre' },
          { pt: 'acelerar o metabolismo', en: 'boost metabolism naturally', es: 'acelerar el metabolismo' },
          { pt: 'dieta saudável cardápio', en: 'healthy meal plan weight loss', es: 'menu semanal saludable' },
          { pt: 'substituições saudáveis', en: 'healthy food swaps', es: 'sustitutos de comida saludables' },
          { pt: 'efeito sanfona como evitar', en: 'stop yo yo dieting', es: 'evitar efecto rebote' },
        ],
      },
      {
        id: 'jejum-hidratacao',
        title: '07 Jejum intermitente e hidratação',
        terms: [
          { pt: 'jejum intermitente iniciante', en: 'intermittent fasting for beginners', es: 'ayuno intermitente para principiantes' },
          { pt: 'protocolo jejum 16 8', en: '16 8 fasting protocol', es: 'ayuno 16 8 como hacerlo' },
          { pt: 'benefícios da autofagia', en: 'autophagy fasting benefits', es: 'beneficios de la autofagia' },
          { pt: 'o que quebra o jejum', en: 'what breaks a fast', es: 'que rompe el ayuno' },
          { pt: 'quanto de água beber por dia', en: 'how much water to drink daily', es: 'cuanta agua beber al dia' },
          { pt: 'água com limão benefícios', en: 'lemon water benefits', es: 'agua con limon en ayunas' },
        ],
      },
      {
        id: 'saude-masculina-40',
        title: '08 Saúde masculina depois dos 40',
        terms: [
          { pt: 'aumentar testosterona naturalmente', en: 'boost testosterone naturally', es: 'aumentar testosterona naturalmente' },
          { pt: 'saúde da próstata', en: 'prostate health tips', es: 'cuidado de la prostata' },
          { pt: 'perda de massa muscular idade', en: 'prevent muscle loss aging', es: 'perdida de masa muscular edad' },
          { pt: 'disposição e energia masculina', en: 'increase male energy stamina', es: 'aumentar energia y vitalidad hombre' },
          { pt: 'exames de rotina homem', en: 'men health checkup checklist', es: 'analisis de salud hombre 40 anos' },
          { pt: 'calvície e queda de cabelo', en: 'hair loss prevention men', es: 'como frenar caida del cabello' },
        ],
      },
      {
        id: 'saude-feminina-menopausa',
        title: '09 Saúde feminina, ciclo e menopausa',
        terms: [
          { pt: 'sintomas da menopausa alívio', en: 'menopause symptom relief', es: 'aliviar sintomas de menopausia' },
          { pt: 'fogachos ondas de calor', en: 'hot flashes natural remedy', es: 'sofocos menopausia remedios' },
          { pt: 'regulação hormonal feminina', en: 'balance hormones naturally female', es: 'equilibrar hormonas mujer' },
          { pt: 'saúde óssea osteoporose', en: 'osteoporosis prevention bone health', es: 'prevenir osteoporosis huesos fuertes' },
          { pt: 'cuidados com a pele madura', en: 'mature skin care routine', es: 'cuidado de piel madura' },
          { pt: 'alívio de cólica menstrual', en: 'menstrual cramps relief', es: 'aliviar colicos menstruales' },
        ],
      },
      {
        id: 'longevidade-envelhecimento',
        title: '10 Longevidade e envelhecimento saudável',
        terms: [
          { pt: 'longevidade', en: 'longevity', es: 'longevidad' },
          { pt: 'zonas azuis longevidade', en: 'blue zones longevity secrets', es: 'zonas azules secretos longevidad' },
          { pt: 'expectativa de vida saudável', en: 'healthy lifespan habits', es: 'vivir mas anos saludable' },
          { pt: 'idade biológica como reverter', en: 'reverse biological age', es: 'rejuvenecer edad biologica' },
          { pt: 'telômeros e envelhecimento', en: 'telomeres aging', es: 'telomeros y envejecimiento' },
          { pt: 'antioxidantes naturais', en: 'natural antioxidants', es: 'antioxidantes naturales potentes' },
          { pt: 'como viver mais de 100 anos', en: 'how to live past 100', es: 'como vivir 100 anos' },
          { pt: 'saúde do cérebro prevenir alzheimer', en: 'brain health prevent alzheimers', es: 'salud cerebral prevenir alzheimer' },
          { pt: 'dieta mediterrânea', en: 'mediterranean diet longevity', es: 'dieta mediterranea beneficios' },
          { pt: 'preservar memória na velhice', en: 'memory improvement seniors', es: 'mejorar memoria adultos mayores' },
        ],
      },
      {
        id: 'ansiedade-estresse',
        title: '11 Ansiedade e alívio de estresse',
        terms: [
          { pt: 'como controlar a ansiedade', en: 'how to manage anxiety', es: 'como controlar la ansiedad' },
          { pt: 'respiração diafragmática 4 7 8', en: '4 7 8 breathing technique', es: 'tecnica de respiracion 4 7 8' },
          { pt: 'reduzir cortisol estresse', en: 'lower cortisol levels naturally', es: 'bajar el cortisol naturalmente' },
          { pt: 'crise de pânico como sair', en: 'panic attack stop immediately', es: 'como parar un ataque de panico' },
          { pt: 'chá calmante natural', en: 'calming herbal tea for stress', es: 'te calmante para los nervios' },
          { pt: 'exercício de mindfulness', en: 'mindfulness exercise for stress', es: 'ejercicio de mindfulness para calmar' },
        ],
      },
      {
        id: 'primeiros-socorros-casa',
        title: '12 Primeiros socorros e segurança doméstica',
        terms: [
          { pt: 'manobra de heimlich engasgo', en: 'heimlich maneuver choking', es: 'maniobra de heimlich atragantamiento' },
          { pt: 'o que fazer em queimadura', en: 'burn first aid treatment', es: 'que hacer en caso de quemadura' },
          { pt: 'pressão alta o que fazer na hora', en: 'high blood pressure emergency what to do', es: 'presion alta que hacer urgente' },
          { pt: 'queda de pressão desmaio', en: 'fainting first aid low pressure', es: 'desmayo primeros auxilios' },
          { pt: 'como estancar sangramento', en: 'how to stop bleeding fast', es: 'como detener una hemorragia' },
        ],
      },
    ],
  },
  {
    id: 'dinheiro-negocios',
    title: 'Dinheiro e negócios',
    icon: '💰',
    niches: [
      {
        id: 'financas-pessoais-orcamento',
        title: '01 Finanças pessoais e orçamento doméstico',
        terms: [
          { pt: 'orçamento familiar planilha', en: 'family budget template', es: 'presupuesto familiar mensual' },
          { pt: 'como economizar dinheiro todo mês', en: 'how to save money every month', es: 'como ahorrar dinero cada mes' },
          { pt: 'regra 50 30 20', en: '50 30 20 budget rule', es: 'regla 50 30 20 finanzas' },
          { pt: 'cortar gastos supérfluos', en: 'cut unnecessary expenses', es: 'reducir gastos innecesarios' },
          { pt: 'reserva de emergência', en: 'emergency fund guide', es: 'fondo de emergencia como crearlo' },
          { pt: 'educação financeira para iniciantes', en: 'financial literacy for beginners', es: 'educacion financiera basica' },
          { pt: 'controle financeiro pessoal', en: 'personal finance tracker', es: 'control de finanzas personales' },
        ],
      },
      {
        id: 'como-sair-das-dividas',
        title: '02 Como sair das dívidas',
        terms: [
          { pt: 'como quitar dívidas rápido', en: 'how to get out of debt fast', es: 'como salir de deudas rapido' },
          { pt: 'negociar dívida com banco', en: 'negotiate credit card debt', es: 'negociar deudas bancarias' },
          { pt: 'método bola de neve dívidas', en: 'debt snowball method', es: 'metodo bola de nieve deudas' },
          { pt: 'limpar o nome score', en: 'improve credit score tips', es: 'subir puntaje crediticio' },
          { pt: 'juros abusivos cartão de crédito', en: 'credit card high interest trap', es: 'intereses tarjeta de credito' },
          { pt: 'viver sem dívidas', en: 'debt free living journey', es: 'vivir sin deudas' },
        ],
      },
      {
        id: 'renda-extra',
        title: '03 Renda extra e bicos lucrativos',
        terms: [
          { pt: 'como fazer renda extra', en: 'how to make extra money', es: 'como ganar dinero extra' },
          { pt: 'renda extra em casa', en: 'make money from home side hustle', es: 'trabajar desde casa ganar dinero' },
          { pt: 'o que vender para ganhar dinheiro', en: 'things to sell to make money', es: 'que vender para ganar dinero' },
          { pt: 'doces para vender lucro', en: 'easy desserts to sell for profit', es: 'postres faciles para vender' },
          { pt: 'vender pelo whatsapp', en: 'how to sell on whatsapp', es: 'como vender por whatsapp' },
          { pt: 'serviços para prestar fim de semana', en: 'weekend side gigs', es: 'trabajos de fin de semana dinero' },
        ],
      },
      {
        id: 'investimentos-iniciantes',
        title: '04 Investimentos para iniciantes',
        terms: [
          { pt: 'investir com pouco dinheiro', en: 'investing with little money', es: 'invertir con poco dinero' },
          { pt: 'tesouro direto como funciona', en: 'treasury bonds for beginners', es: 'bonos del estado para invertir' },
          { pt: 'fundos imobiliários dividendos', en: 'reits monthly dividend investing', es: 'fondos inmobiliarios dividendos' },
          { pt: 'juros compostos poder', en: 'compound interest power', es: 'interes compuesto como funciona' },
          { pt: 'onde investir reserva de emergência', en: 'where to keep emergency fund', es: 'donde invertir fondo de emergencia' },
          { pt: 'erros comuns do investidor', en: 'beginner investing mistakes', es: 'errores de principiante al invertir' },
          { pt: 'viver de renda passiva', en: 'passive income dividends', es: 'vivir de rentas pasivas' },
        ],
      },
      {
        id: 'economia-domestica',
        title: '05 Economia doméstica e compras inteligentes',
        terms: [
          { pt: 'como economizar no supermercado', en: 'how to save money on groceries', es: 'como ahorrar en el supermercado' },
          { pt: 'como gastar menos luz e energia', en: 'how to lower electric bill', es: 'como ahorrar luz en casa' },
          { pt: 'compras inteligentes no atacado', en: 'buying in bulk to save money', es: 'comprar al por mayor ahorro' },
          { pt: 'economizar na conta de gás', en: 'save cooking gas tips', es: 'ahorrar gas de cocina' },
          { pt: 'produtos de limpeza caseiros baratos', en: 'diy cleaning products save money', es: 'productos de limpieza caseros baratos' },
        ],
      },
      {
        id: 'negocios-locais',
        title: '06 Pequenos negócios locais e prestação de serviços',
        terms: [
          { pt: 'ideias de negócios com pouco investimento', en: 'low cost business ideas', es: 'negocios con poca inversion rentables' },
          { pt: 'como abrir MEI passo a passo', en: 'starting a micro business', es: 'como formalizar un pequeno negocio' },
          { pt: 'como atrair clientes para loja local', en: 'how to get local customers', es: 'como atraer clientes a mi negocio' },
          { pt: 'precificação de serviços como cobrar', en: 'how to price your services', es: 'como cobrar por mis servicios' },
          { pt: 'google meu negócio como cadastrar', en: 'google my business setup', es: 'google mi negocio como registrarse' },
        ],
      },
      {
        id: 'mentalidade-financeira',
        title: '07 Mentalidade e psicologia do dinheiro',
        terms: [
          { pt: 'mentalidade de riqueza e abundância', en: 'wealth mindset psychology of money', es: 'mentalidad de abundancia dinero' },
          { pt: 'hábitos dos ricos no dia a dia', en: 'daily habits of wealthy people', es: 'habitos diarios de personas exitosas' },
          { pt: 'crenças limitantes sobre dinheiro', en: 'limiting beliefs about money', es: 'creencias limitantes sobre el dinero' },
          { pt: 'consumismo compulsivo como parar', en: 'stop compulsive impulse buying', es: 'como dejar de gastar compulsivamente' },
        ],
      },
      {
        id: 'aposentadoria-futuro',
        title: '08 Planejamento de aposentadoria e patrimônio',
        terms: [
          { pt: 'quanto guardar para aposentadoria', en: 'how much to save for retirement', es: 'cuanto ahorrar para la jubilacion' },
          { pt: 'aposentadoria independente financeira', en: 'financial independence retire early fire', es: 'independencia financiera jubilacion' },
          { pt: 'previdência privada vale a pena', en: 'pension fund retirement plan', es: 'plan de pensiones privado' },
          { pt: 'patrimônio seguro para velhice', en: 'wealth preservation retirement', es: 'proteger patrimonio para la vejez' },
        ],
      },
      {
        id: 'imoveis-reforma',
        title: '09 Imóveis, aluguel e reformas para valorizar',
        terms: [
          { pt: 'vale a pena comprar ou alugar imóvel', en: 'buy vs rent house decision', es: 'comprar o alquilar vivienda que conviene' },
          { pt: 'reforma barata que valoriza imóvel', en: 'budget home improvements add value', es: 'reformas baratas revalorizar casa' },
          { pt: 'como escolher primeiro apartamento', en: 'first time home buyer tips', es: 'consejos para comprar primera casa' },
          { pt: 'financiamento imobiliário amortização', en: 'paying off mortgage early amortization', es: 'amortizar hipoteca trucos' },
        ],
      },
      {
        id: 'vendas-persuasao',
        title: '10 Vendas, negociação e persuasão',
        terms: [
          { pt: 'gatilhos mentais para vender mais', en: 'psychological sales triggers', es: 'gatillos mentales para vender mas' },
          { pt: 'como contornar objeções de clientes', en: 'how to overcome sales objections', es: 'como rebatir objeciones de ventas' },
          { pt: 'técnicas de negociação ganha ganha', en: 'win win negotiation tactics', es: 'tecnicas de negociacion efectivas' },
          { pt: 'fechamento de vendas frases prontas', en: 'closing sales phrases and techniques', es: 'frases de cierre de ventas poderosas' },
        ],
      },
      {
        id: 'freelancer-trabalho-remoto',
        title: '11 Freelancer e trabalho remoto',
        terms: [
          { pt: 'como ser freelancer iniciante', en: 'how to start freelancing', es: 'como empezar a ser freelancer' },
          { pt: 'sites para trabalhar home office', en: 'best remote job websites', es: 'paginas para trabajar desde casa' },
          { pt: 'como montar portfólio sem experiência', en: 'portfolio with no experience', es: 'como hacer portafolio sin experiencia' },
          { pt: 'gestão de tempo trabalhando em casa', en: 'work from home time management', es: 'gestion del tiempo trabajando en casa' },
        ],
      },
      {
        id: 'tributos-organizacao',
        title: '12 Tributos e organização financeira básica',
        terms: [
          { pt: 'declaração imposto de renda simples', en: 'tax return basics for beginners', es: 'declaracion de la renta para principiantes' },
          { pt: 'guia MEI emissão de nota fiscal', en: 'invoicing and tax compliance', es: 'como emitir facturas autonomo' },
          { pt: 'separar conta jurídica da física', en: 'separate business and personal bank accounts', es: 'separar finanzas personales del negocio' },
        ],
      },
    ],
  },
  {
    id: 'relacionamentos',
    title: 'Relacionamentos',
    icon: '❤️',
    niches: [
      {
        id: 'comunicacao-casamento',
        title: '01 Comunicação no casamento e convivência',
        terms: [
          { pt: 'como melhorar a comunicação no casal', en: 'how to communicate better in marriage', es: 'como mejorar la comunicacion en la pareja' },
          { pt: 'parar de brigar por bobagem no casamento', en: 'stop fighting over small things couple', es: 'como dejar de discutir por tonterias' },
          { pt: 'rotina no casamento como reacender a chama', en: 'bring back romance in marriage', es: 'recuperar la pasion en el matrimonio' },
          { pt: 'divisão de tarefas domésticas no casal', en: 'sharing household chores couple', es: 'reparto de tareas del hogar pareja' },
          { pt: 'respeito mútuo no relacionamento', en: 'mutual respect in relationship', es: 'respeto mutuo en la pareja' },
        ],
      },
      {
        id: 'conquista-namoro',
        title: '02 Namoro e conquista saudável',
        terms: [
          { pt: 'como puxar assunto sem ser chato', en: 'how to start conversation on dating apps', es: 'como iniciar una conversacion ligar' },
          { pt: 'sinais de que a pessoa gosta de você', en: 'signs someone has feelings for you', es: 'senales de que le gustas a alguien' },
          { pt: 'red flags no início do relacionamento', en: 'red flags in dating to look out for', es: 'banderas rojas en una relacion' },
          { pt: 'primeiro encontro dicas do que falar', en: 'first date tips conversation topics', es: 'primera cita de que hablar' },
        ],
      },
      {
        id: 'superacao-termino',
        title: '03 Superação de término e divórcio',
        terms: [
          { pt: 'como superar o fim de um relacionamento', en: 'how to heal after a breakup', es: 'como superar una ruptura amorosa' },
          { pt: 'regra do contato zero funciona', en: 'no contact rule after breakup', es: 'contacto cero despues de terminar' },
          { pt: 'como esquecer o ex', en: 'how to move on from your ex', es: 'como olvidar a tu ex pareja' },
          { pt: 'superar a dor da rejeição amorosa', en: 'overcoming romantic rejection', es: 'superar el rechazo amoroso' },
        ],
      },
      {
        id: 'criacao-filhos',
        title: '04 Criação de filhos e birras infantis',
        terms: [
          { pt: 'como lidar com birra infantil', en: 'how to handle toddler tantrums calmly', es: 'como calmar berrinches de ninos' },
          { pt: 'disciplina positiva na prática', en: 'positive discipline parenting tips', es: 'disciplina positiva en la crianza' },
          { pt: 'como fazer a criança dormir a noite toda', en: 'how to get toddler to sleep all night', es: 'como hacer dormir a un bebe toda la noche' },
          { pt: 'tempo de tela infantil como limitar', en: 'limit screen time for kids', es: 'limitar el uso de pantallas en ninos' },
          { pt: 'como ensinar autonomia para os filhos', en: 'raise independent and confident kids', es: 'ensenar independencia a los hijos' },
        ],
      },
      {
        id: 'convivencia-adolescentes',
        title: '05 Convivência e diálogo com adolescentes',
        terms: [
          { pt: 'como conversar com filho adolescente', en: 'how to talk to teenage daughter son', es: 'como hablar con hijos adolescentes' },
          { pt: 'isolamento e rebeldia na adolescência', en: 'dealing with rebellious teenager', es: 'hijos rebeldes como actuar' },
          { pt: 'ansiedade escolar em adolescentes', en: 'teen anxiety and stress support', es: 'ansiedad en adolescentes colegio' },
          { pt: 'estabelecer limites para adolescentes', en: 'setting boundaries for teenagers', es: 'poner limites a los adolescentes' },
        ],
      },
      {
        id: 'linguagens-do-amor',
        title: '06 As 5 linguagens do amor e empatia',
        terms: [
          { pt: 'as 5 linguagens do amor resumo', en: 'the 5 love languages explained', es: 'los 5 lenguajes del amor explicados' },
          { pt: 'palavras de afirmação no relacionamento', en: 'words of affirmation in relationship', es: 'palabras de afirmacion en la pareja' },
          { pt: 'tempo de qualidade casal ideias', en: 'quality time date ideas at home', es: 'tiempo de calidad en pareja' },
          { pt: 'atos de serviço como demonstrar amor', en: 'acts of service love language', es: 'actos de servicio demostrar amor' },
        ],
      },
      {
        id: 'amizade-vida-adulta',
        title: '07 Amizades e conexões sociais na vida adulta',
        terms: [
          { pt: 'como fazer amigos depois de adulto', en: 'how to make friends as an adult', es: 'como hacer amigos de adulto' },
          { pt: 'amizades tóxicas como identificar e afastar', en: 'toxic friends signs how to end', es: 'amigos toxicos como alejarse' },
          { pt: 'solidão na vida adulta como lidar', en: 'loneliness in adulthood how to cope', es: 'soledad en la vida adulta' },
        ],
      },
      {
        id: 'conflitos-familiares',
        title: '08 Conflitos familiares e limites com parentes',
        terms: [
          { pt: 'como colocar limites em parentes intrometidos', en: 'setting boundaries with family members', es: 'poner limites a la familia politica' },
          { pt: 'como lidar com sogra difícil', en: 'how to deal with difficult mother in law', es: 'como tratar con suegras dificiles' },
          { pt: 'conflitos entre irmãos adultos', en: 'sibling rivalry in adulthood', es: 'problemas entre hermanos adultos' },
        ],
      },
      {
        id: 'relacionamento-distancia',
        title: '09 Relacionamento a distância',
        terms: [
          { pt: 'como manter relacionamento a distância', en: 'how to make long distance relationship work', es: 'como llevar una relacion a distancia' },
          { pt: 'ciúmes no relacionamento a distância', en: 'jealousy in long distance relationship', es: 'celos en relacion a distancia' },
          { pt: 'atividades para fazer em casal a distância', en: 'virtual date night ideas long distance', es: 'citas virtuales para novios a distancia' },
        ],
      },
      {
        id: 'inteligencia-emocional-dois',
        title: '10 Inteligência emocional a dois',
        terms: [
          { pt: 'como controlar a raiva na discussão', en: 'how to stay calm in relationship argument', es: 'como controlar la ira en una discusion' },
          { pt: 'dependência emocional como se curar', en: 'emotional dependency overcome', es: 'como superar la dependencia emocional' },
          { pt: 'aprender a pedir desculpas de verdade', en: 'how to give a sincere apology', es: 'como disculparse sinceramente' },
        ],
      },
    ],
  },
  {
    id: 'psicologia-desenvolvimento',
    title: 'Psicologia e desenvolvimento pessoal',
    icon: '🧠',
    niches: [
      {
        id: 'produtividade-foco',
        title: '01 Produtividade, foco e gerenciamento de tempo',
        terms: [
          { pt: 'técnica pomodoro como usar', en: 'pomodoro technique study focus', es: 'metodo pomodoro como usarlo' },
          { pt: 'como ter foco absoluto nos estudos', en: 'how to focus and avoid distractions', es: 'como concentrarse mejor para estudiar' },
          { pt: 'planejamento semanal eficiente', en: 'weekly planning routine productive', es: 'planificacion semanal productiva' },
          { pt: 'rotina matinal de alta produtividade', en: 'high productivity morning routine', es: 'rutina matutina de productividad' },
          { pt: 'método time blocking', en: 'time blocking method calendar', es: 'bloques de tiempo para organizarse' },
        ],
      },
      {
        id: 'vencendo-procrastinacao',
        title: '02 Como vencer a procrastinação',
        terms: [
          { pt: 'como parar de procrastinar de vez', en: 'how to stop procrastinating immediately', es: 'como dejar de procrastinar de verdad' },
          { pt: 'regra dos 5 segundos mel robbins', en: '5 second rule mel robbins', es: 'regla de los 5 segundos' },
          { pt: 'preguiça ou procrastinação diferença', en: 'laziness vs procrastination psychological', es: 'pereza o procrastinacion diferencias' },
          { pt: 'dopamina e procrastinação celular', en: 'dopamine detox reset focus', es: 'desintoxicacion de dopamina' },
        ],
      },
      {
        id: 'habitos-atomicos',
        title: '03 Hábitos atômicos e construção de disciplina',
        terms: [
          { pt: 'hábitos atômicos resumo prático', en: 'atomic habits summary james clear', es: 'habitos atomicos resumen pratico' },
          { pt: 'como criar novos hábitos duradouros', en: 'how to build lasting daily habits', es: 'como crear nuevos habitos y mantenerlos' },
          { pt: 'disciplina vs motivação', en: 'discipline over motivation reality', es: 'disciplina vs motivacion' },
          { pt: 'rastreador de hábitos habit tracker', en: 'habit tracker template notebook', es: 'seguimiento de habitos plantilla' },
        ],
      },
      {
        id: 'autoestima-confianca',
        title: '04 Autoestima, autoconfiança e segurança',
        terms: [
          { pt: 'como melhorar a autoestima baixa', en: 'how to build self esteem confidence', es: 'como aumentar la autoestima' },
          { pt: 'síndrome do impostor como superar', en: 'imposter syndrome how to overcome', es: 'sindrome del impostor superarlo' },
          { pt: 'como parar de se comparar com os outros', en: 'how to stop comparing yourself to others', es: 'como dejar de compararse con los demas' },
          { pt: 'linguagem corporal de confiança', en: 'confident body language signs', es: 'lenguaje corporal de seguridad' },
        ],
      },
      {
        id: 'falar-em-publico',
        title: '05 Superação da timidez e oratória',
        terms: [
          { pt: 'como perder a timidez de falar em público', en: 'how to overcome fear of public speaking', es: 'perder el miedo a hablar en publico' },
          { pt: 'técnicas de oratória para iniciantes', en: 'public speaking tips beginners', es: 'tecnicas de oratoria para principiantes' },
          { pt: 'como controlar o nervosismo antes de apresentar', en: 'calm presentation nerves anxiety', es: 'controlar nervios antes de hablar' },
          { pt: 'oratória clara e sem gaguejar', en: 'speak clearly without stuttering', es: 'hablar con claridad y modulacion' },
        ],
      },
      {
        id: 'autoconhecimento-limites',
        title: '06 Aprender a dizer não e colocar limites',
        terms: [
          { pt: 'como aprender a dizer não sem culpa', en: 'how to say no without feeling guilty', es: 'como aprender a decir que no' },
          { pt: 'síndrome de agradar todo mundo', en: 'people pleasing habit stop', es: 'dejar de complacer a todo el mundo' },
          { pt: 'estabelecer limites pessoais saudáveis', en: 'setting personal boundaries assertiveness', es: 'establecer limites personales saludables' },
        ],
      },
      {
        id: 'resiliencia-luto',
        title: '07 Resiliência emocional e superação de crises',
        terms: [
          { pt: 'como desenvolver resiliência emocional', en: 'how to build emotional resilience', es: 'desarrollar resiliencia emocional' },
          { pt: 'fases do luto e aceitação', en: 'stages of grief healing process', es: 'etapas del duelo y superacion' },
          { pt: 'como recomeçar a vida do zero', en: 'starting over in life at any age', es: 'como empezar de cero en la vida' },
        ],
      },
      {
        id: 'inteligencia-emocional',
        title: '08 Inteligência emocional e autodomínio',
        terms: [
          { pt: 'como desenvolver inteligência emocional', en: 'how to develop emotional intelligence', es: 'desarrollar inteligencia emocional' },
          { pt: 'autocontrole sobre as emoções', en: 'emotional regulation techniques', es: 'controlar las emociones y reacciones' },
          { pt: 'comunicação não violenta na prática', en: 'nonviolent communication examples', es: 'comunicacion no violenta en la practica' },
        ],
      },
      {
        id: 'minimalismo-mental',
        title: '09 Minimalismo mental e desapego',
        terms: [
          { pt: 'minimalismo estilo de vida simples', en: 'minimalist lifestyle guide', es: 'estilo de vida minimalista sencillo' },
          { pt: 'destralhar a mente e clareza', en: 'declutter your mind mental clarity', es: 'limpiar la mente y ordenar pensamientos' },
          { pt: 'viver com menos coisas e mais paz', en: 'living with less stuff and more peace', es: 'vivir con menos posesiones y ser feliz' },
        ],
      },
      {
        id: 'tomada-decisoes',
        title: '10 Tomada de decisões difíceis',
        terms: [
          { pt: 'como tomar decisões difíceis na vida', en: 'how to make difficult life decisions', es: 'como tomar decisiones dificiles' },
          { pt: 'pesar prós e contras com clareza', en: 'pros and cons decision making framework', es: 'analisis de pros y contras decisiones' },
          { pt: 'medo de errar e paralisia de escolha', en: 'fear of making wrong choice paralysis', es: 'miedo a equivocarse al elegir' },
        ],
      },
    ],
  },
  {
    id: 'casa-vida-pratica',
    title: 'Casa e vida prática',
    icon: '🏠',
    niches: [
      {
        id: 'organizacao-descarte',
        title: '01 Organização de armários e descarte (KonMari)',
        terms: [
          { pt: 'como organizar guarda-roupa pequeno', en: 'small closet organization hacks', es: 'organizar armario pequeno facil' },
          { pt: 'método marie kondo descarte', en: 'marie kondo folding decluttering', es: 'metodo marie kondo doblar ropa' },
          { pt: 'organização de despensa pote hermético', en: 'pantry organization jars containers', es: 'organizar despensa de cocina' },
          { pt: 'como dobrar lençol de elástico', en: 'how to fold a fitted sheet easily', es: 'como doblar sabana bajera con elastico' },
          { pt: 'organizar gavetas com separadores', en: 'drawer organization dividers', es: 'organizar cajones de ropa' },
        ],
      },
      {
        id: 'limpeza-truques',
        title: '02 Limpeza pesada e truques caseiros',
        terms: [
          { pt: 'limpeza de fogão com bicarbonato e vinagre', en: 'clean stovetop baking soda vinegar', es: 'limpiar estufa con bicarbonato y vinagre' },
          { pt: 'como tirar mofo da parede', en: 'how to remove wall mold permanently', es: 'como quitar moho de la pared' },
          { pt: 'tirar mancha amarela de roupa branca', en: 'remove yellow stains white shirts', es: 'quitar manchas amarillas ropa blanca' },
          { pt: 'limpar box de banheiro engordurado', en: 'clean cloudy glass shower door', es: 'limpiar mampara de bano sarro' },
          { pt: 'como desentupir pia sem produto químico', en: 'unclog kitchen sink naturally', es: 'como desatascar fregadero facil' },
        ],
      },
      {
        id: 'pequenos-reparos-diy',
        title: '03 Pequenos reparos domésticos e DIY',
        terms: [
          { pt: 'como trocar resistência de chuveiro', en: 'shower head heating element repair', es: 'cambiar resistencia de ducha' },
          { pt: 'como tapar furo na parede massa corrida', en: 'patch hole in drywall spackle', es: 'tapar agujero en la pared' },
          { pt: 'consertar torneira pingando', en: 'fix leaky faucet dripping', es: 'reparar grifo que gotea' },
          { pt: 'trocar tomada antiga por nova', en: 'replace electrical outlet wall socket', es: 'cambiar enchufe de pared' },
          { pt: 'como pintar parede sozinho passo a passo', en: 'how to paint a room wall beginner', es: 'como pintar una pared paso a paso' },
        ],
      },
      {
        id: 'horta-plantas',
        title: '04 Jardinagem e cultivo de horta em vasos',
        terms: [
          { pt: 'como fazer horta em apartamento', en: 'growing vegetables in pots apartment', es: 'huerto urbano en macetas balcon' },
          { pt: 'como cuidar de suculentas sem matar', en: 'how to care for succulents indoors', es: 'como cuidar suculentas en casa' },
          { pt: 'adubo caseiro borra de café casca de banana', en: 'diy organic fertilizer coffee grounds', es: 'abono organico casero plantas' },
          { pt: 'como plantar tomate cereja em vaso', en: 'growing cherry tomatoes in containers', es: 'cultivar tomates cherry en maceta' },
          { pt: 'eliminar pulgões e pragas das plantas', en: 'get rid of aphids natural plant remedy', es: 'eliminar pulgon de las plantas' },
        ],
      },
      {
        id: 'cuidados-pets',
        title: '05 Cuidados e adestramento de cães e gatos',
        terms: [
          { pt: 'como ensinar o cachorro a fazer xixi no lugar certo', en: 'potty train puppy fast', es: 'ensenar a un perro a hacer sus necesidades' },
          { pt: 'como fazer o cachorro parar de latir', en: 'how to stop dog barking excessively', es: 'como evitar que el perro ladre mucho' },
          { pt: 'gato estressado e ansioso sinais', en: 'signs of cat anxiety how to calm', es: 'gato estresado sintomas y como calmarlo' },
          { pt: 'como cortar unha de cachorro em casa', en: 'how to trim dog nails safely', es: 'como cortar las unas a un perro' },
          { pt: 'alimentação natural para cães', en: 'homemade dog food healthy recipes', es: 'comida casera para perros saludable' },
        ],
      },
      {
        id: 'manutencao-carro',
        title: '06 Manutenção básica de carros e motos',
        terms: [
          { pt: 'como checar o óleo do motor do carro', en: 'how to check engine oil car', es: 'como revisar el nivel de aceite del motor' },
          { pt: 'como trocar pneu furado passo a passo', en: 'how to change a flat tire safely', es: 'como cambiar una rueda pinchada' },
          { pt: 'como fazer chupeta bateria do carro', en: 'how to jump start a dead car battery', es: 'hacer puente de bateria coche' },
          { pt: 'limpar farol amarelado com pasta de dente', en: 'clean yellow headlights toothpaste', es: 'pulir faros del coche con pasta de dientes' },
          { pt: 'calibragem correta dos pneus', en: 'correct tire pressure guide', es: 'presion correcta de los neumaticos' },
        ],
      },
      {
        id: 'decoracao-acessivel',
        title: '07 Decoração acessível e transformação de ambientes',
        terms: [
          { pt: 'decoração de sala gastando pouco', en: 'budget living room makeover ideas', es: 'decorar salon gastando poco dinero' },
          { pt: 'iluminação aconchegante luz amarela', en: 'cozy warm lighting ideas room', es: 'iluminacion calida y acogedora' },
          { pt: 'papel de parede adesivo como aplicar', en: 'peel and stick wallpaper install', es: 'como poner papel pintado autoadhesivo' },
          { pt: 'reforma de cozinha simples aluguel', en: 'rental friendly kitchen makeover', es: 'renovar cocina sin obras barata' },
        ],
      },
      {
        id: 'conservacao-despensa',
        title: '08 Conservação de alimentos e despensa inteligente',
        terms: [
          { pt: 'como conservar verduras frescas por semanas', en: 'keep vegetables fresh for weeks hack', es: 'como conservar verduras frescas mas tiempo' },
          { pt: 'congelar marmitas e carnes da semana', en: 'freezer meal prep guide', es: 'congelar comida para la semana' },
          { pt: 'como evitar caruncho no arroz e feijão', en: 'prevent pantry weevils bugs', es: 'evitar gorgojos en arroz y legumbres' },
        ],
      },
      {
        id: 'eletrodomesticos-cuidados',
        title: '09 Manutenção e limpeza de eletrodomésticos',
        terms: [
          { pt: 'como limpar máquina de lavar roupa por dentro', en: 'how to clean washing machine drum', es: 'como limpiar lavadora por dentro sarro' },
          { pt: 'limpeza de airfryer engordurada', en: 'how to clean greasy air fryer basket', es: 'como limpiar freidora de aire facil' },
          { pt: 'tirar cheiro ruim da geladeira', en: 'get rid of bad smell in refrigerator', es: 'quitar mal olor del refrigerador' },
          { pt: 'descalcificar cafeteira elétrica', en: 'descale coffee maker vinegar', es: 'descalcificar cafetera con vinagre' },
        ],
      },
      {
        id: 'seguranca-domestica',
        title: '10 Segurança e prevenção na residência',
        terms: [
          { pt: 'câmeras de segurança wi-fi para casa', en: 'best home security camera setup', es: 'camaras de seguridad wifi para el hogar' },
          { pt: 'evitar vazamento de gás de cozinha', en: 'prevent gas leak home safety', es: 'detectar fugas de gas en la cocina' },
          { pt: 'fechadura digital inteligente instalação', en: 'smart door lock install guide', es: 'instalar cerradura digital inteligente' },
        ],
      },
      {
        id: 'sustentabilidade-economia',
        title: '11 Sustentabilidade e reaproveitamento em casa',
        terms: [
          { pt: 'composteira doméstica em balde', en: 'diy apartment compost bin bucket', es: 'como hacer compost casero en cubos' },
          { pt: 'reaproveitar água da máquina de lavar', en: 'recycle washing machine water', es: 'reutilizar agua de la lavadora' },
          { pt: 'separação correta de lixo reciclável', en: 'recycling sorting guide home', es: 'como reciclar correctamente en casa' },
        ],
      },
      {
        id: 'manutencao-ar-condicionado',
        title: '12 Cuidados com clima e ventilação',
        terms: [
          { pt: 'como limpar filtro de ar condicionado split', en: 'how to clean split ac air filter', es: 'como limpiar filtro de aire acondicionado' },
          { pt: 'como refrescar a casa no calor sem ar', en: 'cool room down without air conditioning', es: 'como enfriar la casa en verano sin aire' },
          { pt: 'tirar umidade da casa antimofo', en: 'reduce humidity in home prevent damp', es: 'como quitar la humedad de la casa' },
        ],
      },
    ],
  },
  {
    id: 'comida-culinaria',
    title: 'Comida e culinária',
    icon: '🍳',
    niches: [
      {
        id: 'refeicoes-rapidas-semana',
        title: '01 Refeições rápidas e marmitas da semana',
        terms: [
          { pt: 'marmitas para a semana receitas', en: 'weekly meal prep recipes easy', es: 'meal prep semanal recetas faciles' },
          { pt: 'almoço rápido em 15 minutos', en: '15 minute lunch recipes', es: 'almuerzo rapido en 15 minutos' },
          { pt: 'jantar rápido com o que tem na geladeira', en: 'quick dinner with fridge leftovers', es: 'cena facil y rapida con lo que hay' },
          { pt: 'frango desfiado temperado para a semana', en: 'shredded chicken meal prep seasoning', es: 'pollo desmenuzado para la semana' },
          { pt: 'arroz soltinho perfeito para iniciantes', en: 'how to cook fluffy white rice', es: 'arroz blanco suelto y perfecto' },
        ],
      },
      {
        id: 'receitas-airfryer',
        title: '02 Receitas práticas na Airfryer',
        terms: [
          { pt: 'batata frita crocante na airfryer', en: 'crispy french fries in air fryer', es: 'papas fritas crujientes en freidora de aire' },
          { pt: 'frango assado suculento na airfryer', en: 'juicy chicken breast air fryer', es: 'pechuga de pollo jugosa en air fryer' },
          { pt: 'bolo de caneca na airfryer', en: 'mug cake in air fryer', es: 'bizcocho en freidora de aire' },
          { pt: 'pão de queijo na airfryer', en: 'cheese bread air fryer', es: 'pan de queso en freidora de aire' },
          { pt: 'legumes assados crocantes na airfryer', en: 'roasted vegetables in air fryer', es: 'verduras asadas en freidora de aire' },
        ],
      },
      {
        id: 'paes-artesanais',
        title: '03 Pães artesanais e fermentação natural',
        terms: [
          { pt: 'como fazer levain fermento natural do zero', en: 'sourdough starter from scratch', es: 'como hacer masa madre casera' },
          { pt: 'pão caseiro fofinho sem sovar', en: 'no knead bread recipe easy', es: 'pan casero facil sin amasar' },
          { pt: 'pão de forma caseiro macio', en: 'homemade sandwich bread soft', es: 'pan de molde casero esponjoso' },
          { pt: 'focaccia de alecrim fácil', en: 'easy rosemary focaccia bread', es: 'focaccia casera paso a paso' },
        ],
      },
      {
        id: 'sobremesas-bolos',
        title: '04 Sobremesas simples e bolos caseiros',
        terms: [
          { pt: 'bolo de cenoura com cobertura de chocolate', en: 'carrot cake with chocolate ganache', es: 'bizcocho de zanahoria con chocolate' },
          { pt: 'pudim de leite condensado sem furinhos', en: 'smooth creamy flan recipe', es: 'flan de leche condensada cremoso' },
          { pt: 'brigadeiro de panela ponto de colher', en: 'brigadeiro recipe brazilian fudge balls', es: 'trufas de chocolate caseras faciles' },
          { pt: 'mousse de maracujá com 3 ingredientes', en: '3 ingredient passion fruit mousse', es: 'mousse de maracuya facil 3 ingredientes' },
          { pt: 'bolo de fubá cremoso tradicional', en: 'creamy cornmeal cake', es: 'pastel de maiz cremoso' },
        ],
      },
      {
        id: 'comida-caseira-tradicional',
        title: '05 Comida caseira afetiva e tradicional',
        terms: [
          { pt: 'feijão caseiro grosso e saboroso', en: 'how to cook flavorful black beans', es: 'como preparar frijoles sazonados' },
          { pt: 'estrogonofe de carne simples', en: 'easy beef stroganoff recipe', es: 'stroganoff de carne facil' },
          { pt: 'lasanha à bolonhesa clássica', en: 'classic beef lasagna recipe', es: 'lasana boloñesa tradicional casera' },
          { pt: 'carne de panela macia desmanchando', en: 'tender pot roast melt in mouth', es: 'carne estofada tierna y jugosa' },
        ],
      },
      {
        id: 'molhos-temperos-caseiros',
        title: '06 Molhos, temperos e conservas caseiras',
        terms: [
          { pt: 'tempero caseiro de alho e sal completo', en: 'homemade garlic herb seasoning paste', es: 'pasta de ajo y especias casera' },
          { pt: 'molho de tomate caseiro com tomate maduro', en: 'homemade tomato sauce fresh tomatoes', es: 'salsa de tomate frito casera' },
          { pt: 'maionese caseira temperada sem errar', en: 'homemade garlic mayonnaise blender', es: 'mayonesa casera sin cortar' },
          { pt: 'conserva de pimenta caseira', en: 'pickled chili peppers jars', es: 'conserva de chiles picantes' },
        ],
      },
      {
        id: 'cozinha-economica-reaproveitamento',
        title: '07 Cozinha econômica e sem desperdício',
        terms: [
          { pt: 'o que fazer com sobras de arroz', en: 'recipes using leftover rice', es: 'recetas con arroz que sobro' },
          { pt: 'como reaproveitar cascas e talos de legumes', en: 'zero waste cooking vegetable scraps', es: 'recetas de aprovechamiento sobras' },
          { pt: 'receitas econômicas de fim de mês', en: 'cheap dinners on a tight budget', es: 'cenas muy baratas para fin de mes' },
        ],
      },
      {
        id: 'culinaria-saudavel-fit',
        title: '08 Culinária saudável e sem açúcar',
        terms: [
          { pt: 'bolo de banana fit sem açúcar e sem farinha', en: 'sugar free flourless banana cake', es: 'bizcocho de platano sin azucar y sin harina' },
          { pt: 'crepioca fit para o café da manhã', en: 'healthy breakfast egg crepe', es: 'crepes saludables desayuno fit' },
          { pt: 'lanche saudável rápido para o trabalho', en: 'healthy snacks to bring to work', es: 'meriendas saludables para llevar' },
        ],
      },
    ],
  },
  {
    id: 'espiritualidade-fe',
    title: 'Espiritualidade e fé',
    icon: '✨',
    niches: [
      {
        id: 'estudo-biblico',
        title: '01 Estudo e meditação bíblica',
        terms: [
          { pt: 'como começar a ler a bíblia plano', en: 'bible reading plan for beginners', es: 'plan de lectura biblica principiantes' },
          { pt: 'versículos bíblicos de esperança e conforto', en: 'bible verses for hope and healing', es: 'versiculos de esperanza y fortaleza' },
          { pt: 'estudo do livro de salmos explicado', en: 'psalms Bible study commentary', es: 'estudio del libro de salmos explicacion' },
          { pt: 'parábolas de jesus e seus significados', en: 'parables of jesus meanings explained', es: 'parabolas de jesus y su significado' },
        ],
      },
      {
        id: 'oracoes-diarias',
        title: '02 Orações diárias e gratidão',
        terms: [
          { pt: 'oração da manhã para abençoar o dia', en: 'morning prayer for guidance and blessings', es: 'oracion de la manana para empezar el dia' },
          { pt: 'oração da noite para dormir em paz', en: 'night prayer for peaceful sleep and protection', es: 'oracion de la noche para descansar' },
          { pt: 'salmo 91 proteção poderosa', en: 'psalm 91 prayer for protection', es: 'salmo 91 oracion poderosa de proteccion' },
          { pt: 'salmo 23 o senhor é meu pastor', en: 'psalm 23 the lord is my shepherd prayer', es: 'salmo 23 el senor es mi pastor oracion' },
          { pt: 'oração de gratidão pela vida e família', en: 'gratitude prayer for blessings and family', es: 'oracion de agradecimiento a dios' },
        ],
      },
      {
        id: 'sabedoria-estoica',
        title: '03 Sabedoria estóica e filosofia de vida',
        terms: [
          { pt: 'filosofia estóica como aplicar no dia a dia', en: 'stoicism practical daily life lessons', es: 'estoicismo filosofia practica diaria' },
          { pt: 'marco aurélio meditações lições', en: 'marcus aurelius meditations key lessons', es: 'marco aurelio meditaciones ensenanzas' },
          { pt: 'dicotomia do controle sêneca', en: 'dichotomy of control stoicism', es: 'dicotomia del control estoicismo' },
          { pt: 'como não se abalar com as opiniões alheias', en: 'stop caring what people think stoic', es: 'como dejar de preocuparse por los demas' },
        ],
      },
      {
        id: 'proposito-destino',
        title: '04 Reflexões sobre propósito de vida e alma',
        terms: [
          { pt: 'como descobrir o propósito da minha vida', en: 'how to find your true life purpose', es: 'como encontrar el proposito de mi vida' },
          { pt: 'como ouvir a voz de deus no silêncio', en: 'how to hear gods voice clearly', es: 'como escuchar la voz de dios' },
          { pt: 'confiar no tempo certo das coisas', en: 'trusting gods timing in hard seasons', es: 'confiar en el tiempo de dios' },
        ],
      },
      {
        id: 'historias-superacao-fe',
        title: '05 Histórias de fé e milagres',
        terms: [
          { pt: 'testemunhos reais de milagre e cura', en: 'real life miracle stories faith', es: 'testimonios reales de fe y milagros' },
          { pt: 'histórias bíblicas de superação', en: 'bible stories of faith and overcoming', es: 'historias biblicas de superacion' },
          { pt: 'como manter a fé na hora da tempestade', en: 'keeping faith during difficult times', es: 'mantener la fe en momentos dificiles' },
        ],
      },
      {
        id: 'perdao-libertacao',
        title: '06 Perdão, cura interior e libertação',
        terms: [
          { pt: 'como perdoar quem te magoou profundamente', en: 'how to forgive someone who hurt you', es: 'como perdonar a quien te lastimo' },
          { pt: 'libertação de culpas do passado', en: 'letting go of past guilt and regrets', es: 'liberarse de la culpa del pasado' },
          { pt: 'oração de cura interior e mágoas', en: 'inner healing prayer broken heart', es: 'oracion de sanacion interior del corazon' },
        ],
      },
      {
        id: 'paz-interior-meditacao',
        title: '07 Paz interior e silêncio',
        terms: [
          { pt: 'como encontrar paz de espírito em dias difíceis', en: 'find inner peace in troubled times', es: 'como encontrar paz interior en momentos duros' },
          { pt: 'música instrumental relaxante com versículos', en: 'soaking worship music prayer scriptures', es: 'musica cristiana instrumental para orar' },
          { pt: 'oração do pai nosso explicada verso a verso', en: 'the lords prayer line by line meaning', es: 'el padre nuestro explicacion detallada' },
        ],
      },
      {
        id: 'sabedoria-proverbios',
        title: '08 Provérbios e ensinamentos práticos',
        terms: [
          { pt: 'lições práticas do livro de provérbios', en: 'book of proverbs wisdom for life', es: 'libro de proverbios lecciones de sabiduria' },
          { pt: 'conselhos bíblicos para finanças e trabalho', en: 'biblical principles for money and work', es: 'principios biblicos para el trabajo y dinero' },
          { pt: 'o perigo das más companhias provérbios', en: 'choosing friends wisely bible proverbs', es: 'elegir buenas companias sabiduria' },
        ],
      },
    ],
  },
  {
    id: 'tecnologia-digital',
    title: 'Tecnologia e ferramentas digitais',
    icon: '💻',
    niches: [
      {
        id: 'inteligencia-artificial-iniciantes',
        title: '01 Inteligência Artificial e ChatGPT para iniciantes',
        terms: [
          { pt: 'chatgpt para iniciantes passo a passo', en: 'chatgpt for beginners full tutorial', es: 'chatgpt para principiantes tutorial' },
          { pt: 'melhores prompts para o chatgpt', en: 'best chatgpt prompts for productivity', es: 'mejores prompts para chatgpt ejemplos' },
          { pt: 'ferramentas de inteligência artificial gratuitas', en: 'best free ai tools you need to try', es: 'herramientas de inteligencia artificial gratis' },
          { pt: 'como criar imagens com IA', en: 'create ai images free tutorial', es: 'crear imagenes con inteligencia artificial' },
          { pt: 'como criar vídeos com IA para youtube', en: 'how to make faceless videos with ai', es: 'crear videos con inteligencia artificial' },
        ],
      },
      {
        id: 'seguranca-digital-golpes',
        title: '02 Segurança digital e proteção contra golpes',
        terms: [
          { pt: 'como saber se um site é confiável e seguro', en: 'how to check if a website is safe legit', es: 'como saber si una pagina web es segura' },
          { pt: 'como se proteger do golpe do pix', en: 'avoid banking scams online safety', es: 'estafas bancarias por internet como evitar' },
          { pt: 'como criar senhas fortes e seguras', en: 'how to create strong memorable passwords', es: 'como crear contrasenas seguras' },
          { pt: 'ativar verificação em duas etapas no whatsapp', en: 'two step verification whatsapp security', es: 'verificacion en dos pasos whatsapp' },
        ],
      },
      {
        id: 'truques-whatsapp-celular',
        title: '03 Truques e configurações do WhatsApp',
        terms: [
          { pt: 'funções secretas do whatsapp', en: 'hidden whatsapp features and tricks', es: 'trucos ocultos de whatsapp que no sabias' },
          { pt: 'como liberar espaço no celular memória cheia', en: 'how to clear phone storage memory full', es: 'liberar espacio en el celular memoria llena' },
          { pt: 'como transferir conversas do whatsapp', en: 'transfer whatsapp chats to new phone', es: 'pasar chats de whatsapp a otro celular' },
          { pt: 'esconder visto por último e online whatsapp', en: 'hide online status last seen whatsapp', es: 'ocultar en linea en whatsapp' },
        ],
      },
      {
        id: 'edicao-video-capcut',
        title: '04 Edição de vídeos pelo celular (CapCut)',
        terms: [
          { pt: 'como editar vídeo no capcut pelo celular', en: 'capcut mobile video editing tutorial', es: 'como editar videos en capcut celular' },
          { pt: 'como colocar legendas automáticas no capcut', en: 'auto captions in capcut easy', es: 'subtitulos automaticos en capcut' },
          { pt: 'como tirar fundo de vídeo no celular', en: 'remove video background in capcut', es: 'quitar fondo de video en celular' },
          { pt: 'efeitos de transição suaves capcut', en: 'smooth transition effects capcut tutorial', es: 'transiciones faciles en capcut' },
        ],
      },
      {
        id: 'excel-planilhas',
        title: '05 Excel e planilhas práticas para o dia a dia',
        terms: [
          { pt: 'fórmulas básicas do excel para iniciantes', en: 'basic excel formulas beginners guide', es: 'formulas basicas de excel para principiantes' },
          { pt: 'função PROCV e PROCX como usar', en: 'vlookup and xlookup tutorial excel', es: 'como usar buscarv y buscarx en excel' },
          { pt: 'como criar tabela dinâmica no excel', en: 'pivot table tutorial excel easy', es: 'como hacer tabla dinamica en excel' },
          { pt: 'google planilhas como usar gratuito', en: 'google sheets tutorial for beginners', es: 'google sheets como usar hojas de calculo' },
        ],
      },
      {
        id: 'apresentacoes-canva',
        title: '06 Canva e design gráfico rápido',
        terms: [
          { pt: 'como usar o canva do zero tutorial', en: 'canva tutorial for complete beginners', es: 'tutorial de canva desde cero principiantes' },
          { pt: 'como criar slides profissionais no canva', en: 'create professional presentation canva', es: 'hacer presentaciones profesionales canva' },
          { pt: 'como fazer posts bonitos para instagram no canva', en: 'design instagram posts in canva', es: 'disenar post para instagram en canva' },
          { pt: 'remover fundo de foto no canva grátis', en: 'remove background from image canva', es: 'quitar fondo de fotos en canva' },
        ],
      },
      {
        id: 'wifi-roteador-internet',
        title: '07 Otimização de Wi-Fi e internet lenta',
        terms: [
          { pt: 'como melhorar o sinal do wifi em casa', en: 'how to boost home wifi signal strength', es: 'como mejorar la senal de wifi en casa' },
          { pt: 'como mudar a senha do wifi pelo celular', en: 'how to change wifi password router', es: 'como cambiar la contrasena del wifi' },
          { pt: 'saber quem está usando meu wifi', en: 'see who is connected to my wifi router', es: 'como saber quien esta conectado a mi wifi' },
          { pt: 'diferença wifi 2.4 ghz e 5 ghz', en: '2.4 ghz vs 5 ghz wifi router difference', es: 'diferencia entre wifi 2.4 ghz y 5 ghz' },
        ],
      },
      {
        id: 'limpeza-computador-lento',
        title: '08 PC e notebook lento como acelerar',
        terms: [
          { pt: 'como deixar o windows 10 11 mais rápido', en: 'how to speed up windows 11 pc fast', es: 'como acelerar windows 10 11 al maximo' },
          { pt: 'limpar arquivos temporários do computador', en: 'clear temporary cache files pc windows', es: 'eliminar archivos temporales de la pc' },
          { pt: 'desativar programas na inicialização do windows', en: 'disable startup programs speed up pc', es: 'desactivar programas de inicio windows' },
          { pt: 'como saber se o computador tem vírus', en: 'how to scan check for malware virus pc', es: 'como saber si mi pc tiene virus' },
        ],
      },
      {
        id: 'backup-nuvem',
        title: '09 Armazenamento em nuvem e backup de fotos',
        terms: [
          { pt: 'como salvar fotos no google fotos', en: 'how to backup photos google photos', es: 'guardar fotos en google fotos seguro' },
          { pt: 'passar fotos do celular para o computador', en: 'transfer photos from phone to computer', es: 'pasar fotos del movil al ordenador' },
          { pt: 'melhores serviços de nuvem gratuitos', en: 'best free cloud storage services', es: 'mejores servicios de nube gratis' },
        ],
      },
      {
        id: 'ferramentas-gratuitas-uteis',
        title: '10 Ferramentas gratuitas que substituem pagas',
        terms: [
          { pt: 'programas gratuitos alternativos ao pacote office', en: 'free alternatives to microsoft office', es: 'alternativas gratis a microsoft office' },
          { pt: 'melhores editores de pdf gratuitos online', en: 'best free pdf editor tools online', es: 'editar pdf gratis sin pagar nada' },
          { pt: 'conversor de vídeo e áudio online grátis', en: 'free online audio video converter', es: 'convertidor de video y audio online gratis' },
        ],
      },
    ],
  },
  {
    id: 'carreira-educacao',
    title: 'Carreira e educação',
    icon: '🎓',
    niches: [
      {
        id: 'entrevistas-emprego',
        title: '01 Como se preparar para entrevistas de emprego',
        terms: [
          { pt: 'como responder fale sobre você na entrevista', en: 'tell me about yourself interview answer', es: 'cuentame sobre ti entrevista de trabajo' },
          { pt: 'quais são seus maiores defeitos resposta certa', en: 'what is your greatest weakness interview', es: 'cual es tu mayor defecto entrevista' },
          { pt: 'perguntas que o candidato deve fazer no final', en: 'smart questions to ask the interviewer', es: 'preguntas para hacer al entrevistador' },
          { pt: 'linguagem corporal e postura na entrevista', en: 'body language tips for job interview', es: 'lenguaje corporal entrevista de trabajo' },
        ],
      },
      {
        id: 'curriculo-linkedin',
        title: '02 Elaboração de currículo e perfil no LinkedIn',
        terms: [
          { pt: 'como fazer currículo atrativo pelo celular', en: 'how to write a resume on your phone', es: 'como hacer curriculum vitae facil' },
          { pt: 'como otimizar o perfil do linkedin para vagas', en: 'optimize linkedin profile for recruiters', es: 'optimizar perfil de linkedin para empleo' },
          { pt: 'erros graves no currículo que eliminam', en: 'biggest resume mistakes to avoid', es: 'errores graves en el curriculum vitae' },
          { pt: 'modelo de currículo para primeiro emprego', en: 'first job resume template no experience', es: 'curriculum primer empleo sin experiencia' },
        ],
      },
      {
        id: 'transicao-carreira',
        title: '03 Transição de carreira e novos começos',
        terms: [
          { pt: 'como mudar de carreira depois dos 30 ou 40', en: 'career change after 30 40 guide', es: 'cambiar de profesion a los 40 anos' },
          { pt: 'profissões em alta que não precisam de faculdade', en: 'high paying jobs without college degree', es: 'trabajos bien pagados sin universidad' },
          { pt: 'como planejar financeiramente uma transição de carreira', en: 'finance planning for career transition', es: 'planificar cambio de carrera con seguridad' },
        ],
      },
      {
        id: 'aprender-idiomas',
        title: '04 Aprendizado acelerado de inglês e idiomas',
        terms: [
          { pt: 'como aprender inglês sozinho do zero', en: 'learn english at home for beginners', es: 'aprender ingles solo desde cero' },
          { pt: 'como destravar a fala no inglês', en: 'how to speak english fluently practice', es: 'perder el miedo a hablar ingles' },
          { pt: 'método de repetição espaçada anki', en: 'anki spaced repetition language learning', es: 'metodo de repeticion espaciada anki' },
          { pt: 'ouvir podcasts para aprender inglês', en: 'learn english with podcasts listening', es: 'podcasts para aprender ingles facil' },
        ],
      },
      {
        id: 'memorizacao-estudo',
        title: '05 Técnicas de memorização e estudo eficiente',
        terms: [
          { pt: 'técnica feynman de estudo como funciona', en: 'feynman technique study method', es: 'tecnica feynman para estudiar y entender' },
          { pt: 'como lembrar de tudo que lê na prova', en: 'how to remember what you study for exams', es: 'como recordar todo lo que estudias' },
          { pt: 'como fazer mapa mental resumo bonito', en: 'how to make mind maps for studying', es: 'como hacer mapas mentales para estudiar' },
          { pt: 'rotina de estudos para concurso público', en: 'study routine for competitive exams', es: 'rutina de estudio oposiciones' },
        ],
      },
      {
        id: 'comunicacao-assertiva',
        title: '06 Comunicação assertiva no trabalho',
        terms: [
          { pt: 'como ser assertivo sem ser grosseiro', en: 'how to be assertive without being rude', es: 'como ser asertivo sin sonar agresivo' },
          { pt: 'como pedir aumento de salário com argumentos', en: 'how to ask for a raise script', es: 'como pedir un aumento de sueldo' },
          { pt: 'como dar feedback difícil para colega de equipe', en: 'how to give constructive feedback work', es: 'como dar retroalimentacion constructiva' },
        ],
      },
      {
        id: 'lideranca-gestao',
        title: '07 Liderança e gestão de pessoas',
        terms: [
          { pt: 'como ser um bom líder de equipe novato', en: 'first time manager leadership tips', es: 'consejos para liderar un equipo por primera vez' },
          { pt: 'como delegar tarefas sem microgerenciar', en: 'how to delegate tasks avoid micromanaging', es: 'como delegar tareas eficazmente' },
          { pt: 'como motivar uma equipe desanimada', en: 'how to motivate demotivated team', es: 'como motivar a un equipo de trabajo' },
        ],
      },
      {
        id: 'emails-escrita-profissional',
        title: '08 Escrita profissional e e-mails corporativos',
        terms: [
          { pt: 'como escrever e-mail formal profissional', en: 'how to write professional business email', es: 'como redactar un correo electronico formal' },
          { pt: 'regras de português mais erradas no trabalho', en: 'common grammar mistakes in business emails', es: 'errores gramaticales comunes en el trabajo' },
          { pt: 'como pedir desculpas por atraso profissionalmente', en: 'professional apology for delay email', es: 'disculpa profesional por demora en responder' },
        ],
      },
    ],
  },
  {
    id: 'hobbies-artesanato',
    title: 'Hobbies e artesanato',
    icon: '🎨',
    niches: [
      {
        id: 'croche-trico',
        title: '01 Crochê e tricô para iniciantes',
        terms: [
          { pt: 'crochê do zero ponto correntinha e alto', en: 'crochet for beginners step by step', es: 'crochet para principiantes paso a paso' },
          { pt: 'amigurumi bichinhos como começar', en: 'amigurumi crochet tutorial beginners', es: 'como tejer amigurumis paso a paso' },
          { pt: 'tapete de crochê fácil e rápido', en: 'easy crochet rug pattern', es: 'tapete de crochet facil y rapido' },
          { pt: 'tricô para iniciantes como colocar pontos na agulha', en: 'knitting cast on for beginners', es: 'tejer a dos agujas para principiantes' },
        ],
      },
      {
        id: 'violao-musica',
        title: '02 Violão e música do zero',
        terms: [
          { pt: 'primeira aula de violão iniciante', en: 'first acoustic guitar lesson beginner', es: 'primera clase de guitarra acustica' },
          { pt: 'acordes fáceis de violão sem pestana', en: 'easy guitar chords no barre chords', es: 'acordes faciles de guitarra sin cejilla' },
          { pt: 'como afinar o violão de ouvido e pelo celular', en: 'how to tune an acoustic guitar easy', es: 'como afinar la guitarra con el movil' },
          { pt: 'ritmo de violão batida básica para tocar tudo', en: 'easy guitar strumming pattern for all songs', es: 'ritmo basico de guitarra para tocar canciones' },
        ],
      },
      {
        id: 'desenho-aquarela',
        title: '03 Desenho e aquarela do zero',
        terms: [
          { pt: 'como aprender a desenhar do zero passo a passo', en: 'learn how to draw from scratch beginners', es: 'aprender a dibujar desde cero paso a paso' },
          { pt: 'exercícios de traço e proporção no desenho', en: 'drawing exercises line work and proportion', es: 'ejercicios de trazo para soltar la mano dibujo' },
          { pt: 'aquarela para iniciantes materiais básicos', en: 'watercolor painting tutorial beginners', es: 'acuarela para principiantes tecnicas basicas' },
          { pt: 'luz e sombra no desenho realista', en: 'shading techniques light and shadow drawing', es: 'sombras y volumen en el dibujo' },
        ],
      },
      {
        id: 'fotografia-celular',
        title: '04 Fotografia e enquadramento com celular',
        terms: [
          { pt: 'como tirar fotos incríveis com o celular', en: 'how to take aesthetic photos with phone', es: 'como tomar fotos profesionales con el celular' },
          { pt: 'regra dos terços na fotografia de celular', en: 'rule of thirds photography mobile', es: 'regla de los tercios en fotografia con movil' },
          { pt: 'iluminação natural para fotos de pessoas', en: 'natural lighting portrait photography', es: 'iluminacion natural para fotos retratos' },
          { pt: 'ângulos de fotos que emagrecem e valorizam', en: 'best flattering angles for photos', es: 'mejores angulos para posar en fotos' },
        ],
      },
      {
        id: 'marcenaria-diy',
        title: '05 Marcenaria hobby e trabalho com madeira',
        terms: [
          { pt: 'marcenaria hobby ferramentas para começar', en: 'woodworking for beginners tools checklist', es: 'carpinteria para principiantes herramientas' },
          { pt: 'como lixar e envernizar madeira', en: 'sanding and staining wood tutorial', es: 'como lijar y barnizar madera correctamente' },
          { pt: 'projetos fáceis de madeira para fazer no fim de semana', en: 'easy scrap wood projects weekend', es: 'proyectos de madera faciles de hacer en casa' },
        ],
      },
      {
        id: 'canto-voz',
        title: '06 Canto e afinação vocal',
        terms: [
          { pt: 'exercícios de aquecimento vocal para cantar', en: 'vocal warm up exercises for singing', es: 'calentamiento vocal para cantar ejercicios' },
          { pt: 'como cantar afinado sem forçar a garganta', en: 'how to sing in tune without strain', es: 'como cantar afinado sin cansar la voz' },
          { pt: 'respiração diafragmática para cantores', en: 'diaphragm breathing exercises for singers', es: 'respiracion diafragmatica para cantar' },
        ],
      },
      {
        id: 'costura-reparos',
        title: '07 Costura básica e conserto de roupas',
        terms: [
          { pt: 'como fazer bainha de calça à mão', en: 'how to hem pants by hand invisible stitch', es: 'hacer el dobladillo del pantalon a mano' },
          { pt: 'como pregar botão de camisa firme', en: 'how to sew on a button by hand', es: 'como coser un boton de camisa a mano' },
          { pt: 'como consertar rasgo em roupa invisível', en: 'invisible mending stitch torn clothes', es: 'arreglar un descosido a mano puntada invisible' },
        ],
      },
      {
        id: 'letras-lettering',
        title: '08 Lettering e caligrafia artística',
        terms: [
          { pt: 'lettering para iniciantes com caneta comum', en: 'hand lettering for beginners regular pen', es: 'lettering para principiantes con lapicera' },
          { pt: 'alfabeto lettering falso traços finos e grossos', en: 'faux calligraphy alphabet tutorial', es: 'falso lettering abecedario paso a paso' },
          { pt: 'títulos bonitos para caderno', en: 'aesthetic notebook titles header ideas', es: 'titulos bonitos para cuadernos faciles' },
        ],
      },
      {
        id: 'jardinagem-bonsai',
        title: '09 Bonsai e cultivo de orquídeas',
        terms: [
          { pt: 'como cuidar de orquídeas para florir sempre', en: 'how to make orchids bloom again', es: 'como cuidar orquideas para que florezcan' },
          { pt: 'bonsai para iniciantes como podar e regar', en: 'bonsai tree care for beginners', es: 'bonsai para principiantes cuidados basicos' },
          { pt: 'como fazer muda de orquídea keiki', en: 'orchid keiki propagation tutorial', es: 'como reproducir orquideas por keikis' },
        ],
      },
      {
        id: 'escrita-criativa',
        title: '10 Escrita criativa e contação de histórias',
        terms: [
          { pt: 'como começar a escrever um livro de ficção', en: 'how to start writing a novel beginner', es: 'como empezar a escribir un libro' },
          { pt: 'jornada do herói estrutura narrativa', en: 'heros journey story structure writing', es: 'el viaje del heroe estructura narrativa' },
          { pt: 'como criar personagens marcantes e reais', en: 'how to create memorable characters story', es: 'como crear personajes profundos y reales' },
        ],
      },
    ],
  },
  {
    id: 'transporte-veiculos',
    title: 'Meios de transporte e veículos',
    icon: '🚗',
    niches: [
      {
        id: 'carros-direcao-defensiva',
        title: '01 Carros e direção defensiva',
        terms: [
          { pt: 'descer serra engatado', en: 'engine braking mountain driving', es: 'bajar pendientes con motor engranado' },
          { pt: 'aquaplanagem o que fazer', en: 'hydroplaning recovery techniques', es: 'aquaplaning que hacer en lluvia' },
          { pt: 'freio motor como usar', en: 'how to use engine braking properly', es: 'como usar freno de motor correctamente' },
          { pt: 'ultrapassagem segura na estrada', en: 'safe highway overtaking tips', es: 'adelantamiento seguro en carretera' },
          { pt: 'como fazer baliza fácil passo a passo', en: 'parallel parking tips step by step', es: 'como aparcar en linea facil' },
          { pt: 'regular retrovisor eliminar ponto cego', en: 'adjust car mirrors eliminate blind spots', es: 'ajustar espejos retrovisores punto ciego' },
          { pt: 'como dirigir na chuva com segurança', en: 'safe driving in heavy rain and storms', es: 'conducir con lluvia intensa seguridad' },
          { pt: 'como arrancar em subida íngreme', en: 'hill start manual car without rolling back', es: 'arrancar en cuesta sin calar el auto' },
          { pt: 'condução econômica marcha correta', en: 'fuel efficient driving gear shifting', es: 'conduccion economica cambios de marcha' },
          { pt: 'parada de emergência no acostamento', en: 'highway shoulder emergency stop safety', es: 'parada de emergencia en arcen autopista' },
        ],
      },
      {
        id: 'mecanica-preventiva',
        title: '02 Manutenção mecânica preventiva',
        terms: [
          { pt: 'quando trocar pastilha de freio', en: 'when to replace brake pads symptoms', es: 'cuando cambiar pastillas de freno sintomas' },
          { pt: 'óleo sintético vs mineral para motor', en: 'synthetic vs conventional engine oil', es: 'aceite sintetico vs mineral diferencias' },
          { pt: 'barulho na suspensão rangido e estalo', en: 'car suspension clunking noise causes', es: 'ruido en la suspension del auto causas' },
          { pt: 'aditivo de radiador como colocar', en: 'how to add radiator coolant antifreeze', es: 'como poner refrigerante en el radiador' },
          { pt: 'bateria do carro descarregada sinais', en: 'dead car battery warning symptoms', es: 'sintomas de bateria desgastada en el auto' },
          { pt: 'quando trocar a correia dentada', en: 'timing belt replacement signs and interval', es: 'cuando cambiar correa de distribucion auto' },
          { pt: 'velas de ignição com falha sintomas', en: 'bad spark plugs symptoms engine misfire', es: 'fallas por bujias desgastadas sintomas' },
          { pt: 'alinhamento e balanceamento de rodas', en: 'wheel alignment and wheel balancing', es: 'alineacion y balanceo cuando hacerlo' },
        ],
      },
      {
        id: 'compra-carros-usados',
        title: '03 Compra e venda de carros usados',
        terms: [
          { pt: 'como avaliar carro usado antes de comprar', en: 'used car inspection checklist guide', es: 'como revisar auto usado antes de comprar' },
          { pt: 'golpes comuns na compra de veículos', en: 'used car buying scams how to avoid', es: 'estafas comunes al comprar carro usado' },
          { pt: 'consultar histórico de leilão e batida', en: 'check car vin vehicle accident history', es: 'revisar historial del vehiculo siniestro' },
          { pt: 'como negociar preço na tabela FIPE', en: 'negotiating used car price private seller', es: 'como negociar precio de auto usado' },
          { pt: 'melhores carros usados para iniciantes', en: 'best reliable first used cars budget', es: 'mejores autos usados para principiantes' },
          { pt: 'transferência de veículo documentos necessários', en: 'car title transfer requirements paperwork', es: 'documentos para transferir un auto' },
        ],
      },
      {
        id: 'economia-combustivel',
        title: '04 Economia de combustível e consumo',
        terms: [
          { pt: 'como economizar combustível de verdade', en: 'how to improve car gas mileage hacks', es: 'como ahorrar gasolina consejos reales' },
          { pt: 'gasolina ou etanol qual vale a pena', en: 'ethanol vs gasoline fuel calculator', es: 'gasolina o etanol que rinde mas' },
          { pt: 'calibragem de pneu economiza gasolina', en: 'proper tire pressure saves fuel', es: 'presion correcta de neumaticos ahorro gasolina' },
          { pt: 'ar-condicionado ligado gasta quanto de combustível', en: 'does car ac use gas consumption', es: 'cuanto combustible gasta el aire acondicionado' },
          { pt: 'como descarbonizar motor e reduzir consumo', en: 'engine carbon cleaning restore fuel efficiency', es: 'descarbonizar motor para reducir consumo' },
        ],
      },
      {
        id: 'motociclismo-pilotagem',
        title: '05 Motociclismo e pilotagem segura',
        terms: [
          { pt: 'pilotagem defensiva de moto no trânsito', en: 'defensive motorcycle riding in heavy traffic', es: 'conduccion defensiva en moto trafico' },
          { pt: 'como fazer curvas de moto contraesterço', en: 'countersteering motorcycle cornering tutorial', es: 'como hacer curvas en moto contramanillar' },
          { pt: 'frenagem de emergência moto freio dianteiro', en: 'motorcycle emergency braking front brake', es: 'frenada de emergencia en moto segura' },
          { pt: 'cuidados ao pilotar moto na chuva', en: 'riding motorcycle in wet rain conditions', es: 'consejos para manejar moto bajo la lluvia' },
          { pt: 'equipamentos de proteção motociclista capacete', en: 'essential motorcycle protective gear guide', es: 'equipo de proteccion para motoristas' },
          { pt: 'como lubrificar e regular corrente de moto', en: 'motorcycle chain clean lube tension adjust', es: 'limpiar y engrasar cadena de moto' },
          { pt: 'melhor primeira moto para iniciante', en: 'best beginner motorcycle small displacement', es: 'mejor primera moto para empezar' },
        ],
      },
      {
        id: 'caminhoes-transporte-pesado',
        title: '06 Caminhões, carretas e transporte pesado',
        terms: [
          { pt: 'como funciona o freio a ar de caminhão', en: 'semi truck air brake system explained', es: 'como funcionan los frenos de aire en camiones' },
          { pt: 'freio motor jacobs caminhão descendo serra', en: 'jake brake operation steep mountain grades', es: 'freno de motor jake brake bajando pendientes' },
          { pt: 'como manobrar carreta de ré', en: 'backing up a semi tractor trailer tutorial', es: 'como dar reversa a un trailer camion' },
          { pt: 'amarração de carga em caminhão com cinta catraca', en: 'flatbed cargo securement ratchet straps', es: 'sujecion de carga en camion eslingas' },
          { pt: 'rotina de caminhoneiro na estrada rotas', en: 'semi truck driver lifestyle day in life', es: 'rutina y vida de un trailero en carretera' },
          { pt: 'consumo de diesel em caminhões pesados', en: 'heavy duty truck diesel fuel economy', es: 'rendimiento de diesel en camiones de carga' },
        ],
      },
      {
        id: 'estetica-automotiva',
        title: '07 Estética automotiva e detalhamento',
        terms: [
          { pt: 'como lavar carro sem riscar método dois baldes', en: 'two bucket car wash method scratch free', es: 'lavar el auto sin rayas metodo dos cubos' },
          { pt: 'polimento automotivo manual passo a passo', en: 'hand polishing car paint swirl removal', es: 'como pulir el auto a mano paso a paso' },
          { pt: 'como limpar estofados de tecido do carro', en: 'deep clean car cloth upholstery seats', es: 'como limpiar asientos de tela del carro' },
          { pt: 'hidratar banco de couro do carro', en: 'leather car seats cleaning and conditioning', es: 'hidratar tapiceria de cuero auto' },
          { pt: 'vitrificação vs cera automotiva proteção', en: 'ceramic coating vs carnauba wax paint', es: 'sellador ceramico vs cera para auto' },
          { pt: 'como revitalizar para-choque de plástico cinza', en: 'restore faded black plastic trim car', es: 'restaurar plasticos negros quemados del coche' },
        ],
      },
      {
        id: 'ciclismo-mobilidade-ativa',
        title: '08 Ciclismo urbano e mobilidade ativa',
        terms: [
          { pt: 'como regular marchas de bicicleta em casa', en: 'adjust bicycle front rear derailleur', es: 'ajustar cambios de bicicleta en casa' },
          { pt: 'como remendar câmara de ar de bicicleta', en: 'how to patch a bicycle inner tube flat', es: 'como parchar camara de bicicleta facil' },
          { pt: 'dicas de segurança para pedalar na cidade', en: 'city cycling safety commute tips', es: 'consejos para andar en bicicleta en la ciudad' },
          { pt: 'bicicleta elétrica vale a pena para trabalhar', en: 'electric bike daily commuter review', es: 'bici electrica para ir al trabajo ventajas' },
          { pt: 'como ajustar altura do selim de bike', en: 'proper bike saddle height fit guide', es: 'como calcular la altura del sillin de bicicleta' },
        ],
      },
      {
        id: 'nautica-barcos',
        title: '09 Náutica, barcos e navegação',
        terms: [
          { pt: 'como tirar carteira de arrais amador barco', en: 'boat license test requirements guide', es: 'como sacar licencia de navegacion de barco' },
          { pt: 'manutenção básica de motor de popa 2t 4t', en: 'outboard boat motor basic oil change', es: 'mantenimiento basico motor fuera de borda' },
          { pt: 'como atracar lancha no píer com vento', en: 'how to dock a boat in wind current', es: 'como atracar un barco en el muelle facil' },
          { pt: 'nós de marinheiro essenciais nó de guia', en: 'essential nautical knots bowline cleat hitch', es: 'nudos marineros basicos indispensables' },
          { pt: 'itens obrigatórios de segurança embarcação', en: 'mandatory boat safety gear checklist', es: 'equipo de seguridad obligatorio en barco' },
        ],
      },
      {
        id: 'aviacao-curiosidades',
        title: '10 Aviação geral e curiosidades aeronáuticas',
        terms: [
          { pt: 'como funcionam os comandos de voo de um avião', en: 'how airplane flight controls work rudder aileron', es: 'como funcionan los mandos de un avion' },
          { pt: 'o que acontece se o motor do avião parar', en: 'what happens if airplane engines fail glide', es: 'que pasa si se apagan los motores del avion' },
          { pt: 'turbulência de avião riscos e como funciona', en: 'severe airplane turbulence causes danger', es: 'por que se produce la turbulencia en aviones' },
          { pt: 'como pilotos pousam com vento cruzado', en: 'crosswind landing technique cockpit view', es: 'aterrizaje con viento cruzado explicacion' },
          { pt: 'curso de piloto privado custos e horas', en: 'private pilot license cost flight hours', es: 'cuanto cuesta ser piloto privado de avion' },
        ],
      },
      {
        id: 'eletricos-hibridos',
        title: '11 Veículos elétricos e híbridos',
        terms: [
          { pt: 'como funciona o carregamento de carro elétrico', en: 'how electric car home charging works wallbox', es: 'como cargar un coche electrico en casa' },
          { pt: 'vida útil da bateria de carro elétrico', en: 'ev battery degradation lifespan years', es: 'cuanto dura la bateria de un auto electrico' },
          { pt: 'carro híbrido vs elétrico qual compensa', en: 'hybrid vs electric car which is better', es: 'coche hibrido o electrico cual conviene' },
          { pt: 'custo de manutenção de carro elétrico', en: 'electric vehicle maintenance cost comparison', es: 'mantenimiento de auto electrico vs gasolina' },
        ],
      },
      {
        id: 'legislacao-multas-transito',
        title: '12 Trânsito, multas e legislação',
        terms: [
          { pt: 'como recorrer de multa de trânsito sozinho', en: 'how to appeal contest a traffic ticket', es: 'como recurrir una multa de trafico' },
          { pt: 'limite de pontos na CNH e suspensão da carteira', en: 'drivers license points limit suspension', es: 'puntos del carnet de conducir perdida' },
          { pt: 'lei seca recusa do bafômetro direitos', en: 'dui checkpoint refusal breathalyzer rights', es: 'negarse al control de alcoholemia consecuencias' },
          { pt: 'regras de preferência na rotatória trânsito', en: 'roundabout right of way rules traffic', es: 'quien tiene prioridad en una rotonda' },
        ],
      },
    ],
  },
];
