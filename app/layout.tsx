import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ReplyTube — Respostas inteligentes para comentários do YouTube',
  description:
    'Analise vídeos e gere respostas personalizadas para comentários do YouTube com IA (gpt-4o-mini) e OCR nativo.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
