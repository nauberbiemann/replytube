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
