# ReplyTube — Respostas Inteligentes para Comentários do YouTube

Plataforma própria e independente para gestão e resposta inteligente a comentários do YouTube com inteligência artificial, OCR visual nativo de prints e calibração por canal.

Desenvolvido para rodar com **custo 100% gratuito** aproveitando o benefício de **2.5 milhões de tokens diários gratuitos da OpenAI** (*Data Sharing / Complimentary Daily Tokens*) no modelo `gpt-4o-mini`, e hospedagem gratuita na **Vercel**.

---

## 🚀 Funcionalidades

- **OCR Visual Nativo de Prints**: Envie ou cole prints de comentários do YouTube. O modelo `gpt-4o-mini` extrai o `@nickname` do autor, o texto exato do comentário e elabora a resposta recomendada.
- **Ctrl+V Global na Tela**: Copie o print do comentário no YouTube e pressione `Ctrl+V` em qualquer lugar da aplicação para disparar a leitura e geração automática.
- **Gestão Multicanal (LocalStorage)**: Cadastre quantos canais quiser com diretrizes e tom de voz próprios. A IA extrai e ativa o perfil editorial (*nicho, tom de voz, público-alvo, temas-chave e resumo*).
- **Vídeo de Referência**: Informe o tema/título do vídeo que recebeu o comentário (e print opcional) para contextualizar a resposta.
- **Thread da Sessão com Refinamento**: Histórico lado a lado (print/comentário original vs. resposta sugerida), botão de copiar em 1 clique e campo de refinamento via chat (`Ctrl+Enter`) para pedir ajustes na resposta.
- **Fallback de Texto**: Caso o print esteja muito borrado ou cortado, você pode digitar ou colar o texto diretamente.
- **Dark Mode Nativo**: Interface moderna, responsiva e agradável aos olhos.

---

## 📦 Como Rodar Localmente

### 1. Instalar dependências
No terminal, dentro da pasta do projeto:
```bash
npm install
```

### 2. Configurar a Chave da OpenAI
Abra o arquivo `.env.local` e insira sua chave da OpenAI:
```env
OPENAI_API_KEY=sk-proj-sua-chave-aqui
OPENAI_MODEL=gpt-4o-mini
```

> **Dica**: O modelo `gpt-4o-mini` já possui visão computacional para ler imagens e se enquadra na sua cota de **2,5 milhões de tokens diários grátis** concedida pelo programa de compartilhamento de dados da OpenAI.

### 3. Iniciar o servidor de desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: [http://localhost:3000](http://localhost:3000)

---

## 🌐 Como Fazer Deploy Gratuito na Vercel

### Opção 1: Via GitHub (Recomendada)
1. Crie um repositório no seu GitHub (pode ser privado ou público) com o nome `replytube`.
2. No terminal da pasta `replytube`, faça o push:
   ```bash
   git init
   git add .
   git commit -m "feat: ReplyTube próprio com OpenAI e Next.js"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/replytube.git
   git push -u origin main
   ```
3. Acesse [vercel.com](https://vercel.com) e clique em **Add New Project**.
4. Importe o repositório `replytube`.
5. Na seção **Environment Variables** (Variáveis de Ambiente), adicione:
   - `OPENAI_API_KEY`: sua chave da OpenAI
   - `OPENAI_MODEL`: `gpt-4o-mini`
6. Clique em **Deploy**. Em menos de 2 minutos seu app estará online em um link seguro `https://seu-replytube.vercel.app`!

### Opção 2: Via Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 🛠️ Tecnologias Utilizadas
- **Framework**: Next.js 14 (App Router)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide React
- **IA**: OpenAI API (`gpt-4o-mini` com suporte a Visão e JSON Mode)
- **Persistência de Canais**: LocalStorage do navegador
