/**
 * Radar de Títulos (Outliers) — tipos e constantes compartilhados entre servidor e navegador.
 */

export type GenericNiche =
  | 'business'
  | 'tech'
  | 'finance'
  | 'health'
  | 'productivity'
  | 'marketing'
  | 'lifestyle';

/** Nichos dos canais do usuário (buscas sob medida, vídeos médios E longos). */
export type MyNiche = 'cars' | 'aviation' | 'energy' | 'survival';

export type RadarNiche = GenericNiche | MyNiche;

export type OutputLang = 'pt-BR' | 'es' | 'fr' | 'pl' | 'en';

export const LANGS: { key: OutputLang; label: string; name: string }[] = [
  { key: 'pt-BR', label: '🇧🇷 PT-BR', name: 'PORTUGUÊS BRASILEIRO NATIVO' },
  { key: 'es', label: '🇪🇸 ES', name: 'ESPANHOL NATIVO (neutro, latino-americano)' },
  { key: 'fr', label: '🇫🇷 FR', name: 'FRANCÊS NATIVO' },
  { key: 'pl', label: '🇵🇱 PL', name: 'POLONÊS NATIVO' },
  { key: 'en', label: '🇺🇸 EN', name: 'INGLÊS AMERICANO NATIVO' },
];

export const MY_NICHES: { key: MyNiche; label: string; channels: string; defaultLang: OutputLang }[] = [
  { key: 'cars', label: '🔧 Carros & Mecânica', channels: 'Garage 2050', defaultLang: 'pt-BR' },
  {
    key: 'aviation',
    label: '✈️ Aviação',
    channels: 'Radar Explicado (PT) · Radar Aviación (ES) · Radar Explique (FR) · Radar Wyjaśnia (PL)',
    defaultLang: 'pt-BR',
  },
  { key: 'energy', label: '⚡ Energia & Solar', channels: 'Radar de Energia', defaultLang: 'pt-BR' },
  { key: 'survival', label: '🏚️ Sobrevivência Off-Grid', channels: 'Urbanalypse', defaultLang: 'en' },
];

export const MY_NICHE_KEYS: MyNiche[] = MY_NICHES.map((n) => n.key);

export type AdaptTone = 'natural' | 'curiosity' | 'polemic' | 'direct' | 'step_by_step';

export interface RadarVideo {
  id: string; // videoId do YouTube
  niche: RadarNiche;
  title: string; // título original em inglês
  skeleton: string; // fórmula PT-BR com [ASSUNTO]
  trigger: string; // gatilho psicológico (até 3 palavras)
  hook: string; // por que o título gera clique (1 frase)
  channelTitle: string;
  channelId: string;
  subscribers: number;
  views: number;
  viewsPerDay: number;
  outlier: number; // views ÷ max(inscritos, 1000)
  publishedAt: string;
  durationSec: number;
  thumbnailUrl: string;
  syncedAt: string;
}

export interface QueuedTitle {
  id: string;
  createdAt: string;
  title: string;
  status: 'Para Gravar' | 'Já Gravado';
  topic: string;
  tone: string;
  angle: string;
  originalTitle: string;
  videoId: string;
  channelTitle: string;
}

export const RADAR_NICHES: { key: GenericNiche; label: string }[] = [
  { key: 'business', label: 'Negócios & Renda' },
  { key: 'tech', label: 'Tech & IA' },
  { key: 'finance', label: 'Finanças' },
  { key: 'health', label: 'Saúde & Corpo' },
  { key: 'productivity', label: 'Produtividade & Mente' },
  { key: 'marketing', label: 'Marketing & Vendas' },
  { key: 'lifestyle', label: 'Carreira & Estudos' },
];

export const RADAR_NICHE_KEYS: GenericNiche[] = RADAR_NICHES.map((n) => n.key);
export const ALL_NICHE_KEYS: RadarNiche[] = [...MY_NICHE_KEYS, ...RADAR_NICHE_KEYS];
export const isMyNiche = (n: string): n is MyNiche => (MY_NICHE_KEYS as string[]).includes(n);

export const TONES: { key: AdaptTone; label: string; instruction: string }[] = [
  {
    key: 'natural',
    label: 'Equilibrado',
    instruction: 'Equilibrado e natural, com alto CTR nativo em PT-BR, sem exageros.',
  },
  {
    key: 'curiosity',
    label: 'Curiosidade Extrema',
    instruction: 'Abra uma lacuna de curiosidade forte: insinue o resultado ou o segredo sem entregá-lo.',
  },
  {
    key: 'polemic',
    label: 'Polêmico / Forte',
    instruction: 'Quebre uma crença comum com afirmação forte e contraintuitiva, sem ofender e sem mentir.',
  },
  {
    key: 'direct',
    label: 'Direto / Sério',
    instruction: 'Tom de autoridade, direto e sério, sem clickbait exagerado.',
  },
  {
    key: 'step_by_step',
    label: 'Passo a Passo',
    instruction: 'Prático e acionável, prometendo método, passos ou guia claro.',
  },
];

export const NICHE_QUERIES: Record<RadarNiche, string[]> = {
  cars: [
    '"mechanic" never do this car -shorts',
    '"stop doing this" car OR engine maintenance -shorts',
    '"why your car" engine OR transmission OR battery -shorts',
    '"dealers don\'t want you to know" OR "mechanics hate" car -shorts',
    '"I tested" car hack OR fuel saving -shorts',
    '"check engine light" OR "car problem" this is why -shorts',
  ],
  aviation: [
    '"why boeing" OR "why airbus" -shorts',
    '"the plane that" crash OR disaster documentary -shorts',
    '"what really happened" flight OR pilots -shorts',
    '"the truth about" airline OR aircraft engine -shorts',
    '"why pilots" never OR fear -shorts',
    '"fighter jet" OR "air force" why nobody -shorts',
  ],
  energy: [
    'solar "biggest mistake" OR "mistakes" off grid -shorts',
    '"don\'t buy" power station OR solar generator -shorts',
    '"the truth about" lifepo4 OR home battery OR solar panels -shorts',
    '"I tested" inverter OR solar panel OR power bank -shorts',
    '"electric bill" why OR cut -shorts',
    '"heat pump" OR "home battery" honest years later -shorts',
  ],
  survival: [
    '"when the grid goes down" OR "power outage" prepare -shorts',
    '"old timers" OR "grandparents" trick survival household -shorts',
    '"without electricity" heat OR cook OR water -shorts',
    '"preppers get wrong" OR "prepping mistakes" -shorts',
    '"lost skills" OR "forgotten" off grid engineering -shorts',
    '"blackout" survival hack apartment -shorts',
  ],
  business: [
    '"I tried" business OR side hustle -shorts',
    '"nobody talks about" business OR income -shorts',
    '"how I built" solo business OR agency -shorts',
    '"uncomfortable truth" entrepreneurship OR money -shorts',
  ],
  tech: [
    '"stop using" coding OR AI tools -shorts',
    '"I built" app OR SaaS in hours -shorts',
    '"everyone is using" AI OR programming wrong -shorts',
    '"the truth about" software engineering OR AI -shorts',
  ],
  finance: [
    '"brutally honest" investing OR dividends -shorts',
    '"if I started from 0" investing OR money -shorts',
    '"money habits" keeping you broke -shorts',
    '"silent" money mistakes OR wealth -shorts',
  ],
  health: [
    '"I quit" sugar OR processed food days -shorts',
    '"every morning" body OR posture OR energy -shorts',
    '"doctor explains why" habit OR longevity -shorts',
    '"what happens when you" workout OR sleep -shorts',
  ],
  productivity: [
    '"deleted" phone apps OR dopamine days -shorts',
    '"why smart people" procrastinate OR fail -shorts',
    '"night routine" OR "morning routine" changed my life -shorts',
    '"how to learn" twice as fast focus -shorts',
  ],
  marketing: [
    '"I analyzed" viral videos OR hooks -shorts',
    '"why nobody buys" content OR marketing -shorts',
    '"script" doubled sales OR clients -shorts',
    '"youtube algorithm" small channel blew up -shorts',
  ],
  lifestyle: [
    '"quiet habits" separate amateurs professionals -shorts',
    '"everything you know about" confidence OR career -shorts',
    '"things I quit" minimalist OR life lessons -shorts',
    '"harsh truths" in your 20s OR 30s -shorts',
  ],
};
