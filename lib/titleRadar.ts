/**
 * Radar de Títulos (Outliers) — tipos e constantes compartilhados entre servidor e navegador.
 */

export type RadarNiche =
  | 'business'
  | 'tech'
  | 'finance'
  | 'health'
  | 'productivity'
  | 'marketing'
  | 'lifestyle';

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

export const RADAR_NICHES: { key: RadarNiche; label: string }[] = [
  { key: 'business', label: 'Negócios & Renda' },
  { key: 'tech', label: 'Tech & IA' },
  { key: 'finance', label: 'Finanças' },
  { key: 'health', label: 'Saúde & Corpo' },
  { key: 'productivity', label: 'Produtividade & Mente' },
  { key: 'marketing', label: 'Marketing & Vendas' },
  { key: 'lifestyle', label: 'Carreira & Estudos' },
];

export const RADAR_NICHE_KEYS: RadarNiche[] = RADAR_NICHES.map((n) => n.key);

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
