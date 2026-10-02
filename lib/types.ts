export interface Channel {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface ChannelContext {
  nicho: string;
  tomDeVoz: string;
  publico: string;
  temasChave: string[];
  resumo: string;
  channelDescription?: string;
}

export interface CommentItem {
  id: string;
  imageDataUrl?: string;
  nickname: string;
  personName?: string;
  commentText: string;
  reply: string;
  createdAt?: string;
}

export interface VideoReferenceData {
  title: string;
  imageDataUrl: string;
}

export interface PainPoint {
  id: string;
  topic: string;
  description: string;
  intensity: 'alta' | 'media' | 'baixa';
  evidence: string[];
}

export interface Expectation {
  id: string;
  topic: string;
  description: string;
  frequency: 'alta' | 'media' | 'baixa';
  evidence: string[];
}

export interface ContentIdea {
  id: string;
  title: string;
  hook: string;
  premise: string;
  format: 'Shorts' | 'Vídeo Longo' | 'Live / Q&A' | 'Tutorial';
  targetPainOrExpectation: string;
  potential: 'viral' | 'alto' | 'nicho';
}

export interface SentimentBreakdown {
  positive: number;
  neutral: number;
  negative: number;
}

export interface ExecutiveSummary {
  profile: string;
  tone: string;
  overallSentiment: 'positivo' | 'neutro' | 'negativo' | 'misto';
  sentimentBreakdown: SentimentBreakdown;
  keyTakeaway: string;
}

export interface ViralVideoInfo {
  id: string;
  title: string;
  viewCount: number;
  commentCount: number;
  thumbnailUrl: string;
}

export interface InsightsAnalysisResult {
  videoTitle?: string;
  channelTitle?: string;
  channelAvatar?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  viralVideos?: ViralVideoInfo[];
  totalCommentsAnalyzed: number;
  summary: ExecutiveSummary;
  pains: PainPoint[];
  expectations: Expectation[];
  contentIdeas: ContentIdea[];
  analyzedAt: string;
}

export interface ScriptOutline {
  title: string;
  thumbnailIdea: string;
  hook: string;
  retentionPromise: string;
  mainPoints: Array<{
    title: string;
    content: string;
    keyQuoteOrExample?: string;
  }>;
  climax: string;
  cta: string;
}
