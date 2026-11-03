import { NextRequest, NextResponse } from 'next/server';
import { getOpenAIClient, getOpenAIModel } from '@/lib/openai';
import { ChannelContext } from '@/lib/types';
import { validateAccess } from '@/lib/auth';

/**
 * PIPELINE EM 2 ETAPAS (resolve a mistura de temas entre vídeos):
 *
 * ETAPA 1 — LEITURA (com imagem, prompt mínimo, SEM perfil do canal):
 *   Só transcreve o print: autor, texto, título do vídeo de CADA comentário, se é resposta de terceiro,
 *   se já foi respondido pelo canal. Não escreve respostas — assim o modelo foca 100% em ler certo.
 *
 * ETAPA 2 — RESPOSTA (só texto, sem imagem):
 *   Recebe os comentários AGRUPADOS POR VÍDEO, cada bloco com o seu título explícito,
 *   e escreve as respostas. Sem imagem, o modelo não "vaza" assunto de uma linha para outra.
 *
 * Custo: a imagem é paga uma vez só (etapa 1). A etapa 2 é texto puro com prefixo fixo
 * (elegível a prompt caching). Ver tokens reais no aviso após cada geração.
 */

const EXTRACT_PROMPT = `Você transcreve prints do YouTube Studio (aba Comentários). NÃO escreva respostas, apenas leia.

Para CADA comentário visível, de cima para baixo:
- nickname: o @ do autor.
- personName: primeiro nome provável (a partir do @ ou da assinatura do texto), ou vazio.
- commentText: texto exato.
- videoTitle: título do vídeo que aparece NA MESMA LINHA, à direita (coluna "Conteúdo", ao lado da miniatura). Cada comentário pode ser de um vídeo diferente — leia o título da linha DELE. Copie o texto como aparece (pode estar cortado com "...").
- kind:
  "principal" = comentário de nível superior (avatar alinhado à esquerda, sem recuo);
  "terceiro" = resposta recuada abaixo de um comentário, escrita por outra pessoa;
  "canal" = resposta recuada escrita pelo PRÓPRIO canal (nome com selo/destaque).
- parentNickname: para "terceiro" e "canal", o @ do comentário principal ao qual responde.
Ignore as sugestões automáticas de resposta do YouTube (caixas cinzas com textos prontos) e botões.

Retorne APENAS JSON:
{"items":[{"nickname":"@x","personName":"","commentText":"","videoTitle":"","kind":"principal|terceiro|canal","parentNickname":""}]}`;

const REPLY_RULES = `Você é o criador do canal no YouTube respondendo comentários com voz humana, específica e tecnicamente correta.

REGRA Nº 1 — UM VÍDEO POR COMENTÁRIO:
Os comentários chegam agrupados por vídeo. Responda cada comentário SOMENTE com base no título do vídeo do SEU bloco e no que a pessoa escreveu. É PROIBIDO trazer assunto de outro bloco/vídeo (ex: falar de troca de óleo num comentário de um vídeo sobre desligar o carro, só porque outro comentário falou de óleo). Se o comentário for curto (ex: "Logan 2020 com 313 mil km"), conecte o dado da pessoa ao tema do vídeo DELA.

COMO RESPONDER CADA TIPO:
- ELOGIO / AGRADECIMENTO: cite o detalhe CONCRETO que a pessoa mencionou e acrescente 1 informação útil ligada ao tema do vídeo. Nada de agradecimento vazio.
- RESULTADO PESSOAL / DADO DO CARRO: valide e explique em 1 frase a relação com o tema do vídeo.
- PERGUNTA: responda de forma direta e CORRETA para o caso exato (automático ≠ manual etc.). Se exigir mais que 2 frases, dê a dica principal e diga que vira vídeo.
- DADO TÉCNICO / COMPLEMENTO: converse de igual para igual.
- IRONIA OU ANALOGIA CONCORDANDO com o vídeo: NÃO rebata.
- DISCORDÂNCIA REAL: rebata com respeito e com o argumento do vídeo.
- Nunca invente fatos, números ou promessas.

PROIBIDO: "Fico muito feliz", "Fico feliz em saber", "Que notícia fantástica", "marca impressionante", "Muito obrigado pela inscrição", "Espero que tenha gostado", "ponto crucial", "ótima observação", "excelente ponto", "Fala [Nome]!", "Olá [Nome]!", "Continue assim!", "Continue acompanhando a gente!", "Vamos continuar debatendo".
Use o primeiro nome de forma natural.

FECHAMENTO — escolha 1 e VARIE entre os comentários:
A) Gancho para próximos vídeos LIGADO ao assunto + bordão oficial do canal (se existir nas diretrizes).
B) Pergunta curta e específica sobre o tema do vídeo daquele comentário.
C) Frase técnica de conclusão que crava a tese do vídeo daquele comentário.

TAMANHO: 2 a 3 frases.

PAUTA ("suggestedTopic"): só se o comentário trouxer pergunta, pedido, caso real, comparação ou crítica que renda um vídeo NOVO; fiel ao que a pessoa disse. Senão "".
Itens marcados "SOMENTE_PAUTA" (respostas de terceiros): NÃO escreva resposta ("reply": ""), apenas avalie a pauta.

Retorne APENAS JSON, um item para cada "ref" recebido, na mesma ordem:
{"results":[{"ref":1,"suggestedTopic":"","closingStyle":"A|B|C","reply":""}]}`;

function buildChannelProfile(context: ChannelContext): string {
  const desc = (context.channelDescription || '').slice(0, 6000);
  return `PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico e autêntico'}
- Público: ${context.publico || 'Entusiastas'} | Temas: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${desc ? `DIRETRIZES E BORDÕES OFICIAIS DO CANAL (respeite integralmente):\n"""\n${desc}\n"""` : ''}`;
}

type Extracted = {
  nickname: string;
  personName: string;
  commentText: string;
  videoTitle: string;
  kind: 'principal' | 'terceiro' | 'canal';
  parentNickname: string;
};

export async function POST(req: NextRequest) {
  try {
    const auth = validateAccess(req);
    if (!auth.authorized) {
      return NextResponse.json(
        { error: 'Acesso bloqueado: senha incorreta ou não fornecida.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      context,
      commentImageDataUrl,
      commentTextFallback,
      videoTitle,
      videoImageDataUrl,
      recentReplies,
      model: requestedModel,
    } = body as {
      context: ChannelContext;
      commentImageDataUrl?: string;
      commentTextFallback?: string;
      videoTitle?: string;
      videoImageDataUrl?: string;
      recentReplies?: string[];
      model?: string;
    };

    if (!context) {
      return NextResponse.json({ error: 'Contexto do canal não informado.' }, { status: 400 });
    }
    if (!commentImageDataUrl && !commentTextFallback?.trim()) {
      return NextResponse.json(
        { error: 'Envie um print do comentário ou preencha o texto de fallback.' },
        { status: 400 }
      );
    }

    const openai = getOpenAIClient();
    const model = getOpenAIModel(requestedModel);
    const manualTitle = videoTitle?.trim() || '';
    const typedText = commentTextFallback?.trim() || '';
    const hasImage = Boolean(commentImageDataUrl && commentImageDataUrl.startsWith('data:image'));

    let inputTokens = 0;
    let cachedTokens = 0;
    let outputTokens = 0;
    const addUsage = (u: any) => {
      inputTokens += u?.prompt_tokens ?? 0;
      cachedTokens += u?.prompt_tokens_details?.cached_tokens ?? 0;
      outputTokens += u?.completion_tokens ?? 0;
    };

    // ---------------- ETAPA 1: LEITURA DO PRINT ----------------
    let extracted: Extracted[] = [];

    if (hasImage) {
      const parts: any[] = [
        {
          type: 'text',
          text: typedText
            ? `O texto do comentário foi digitado pelo criador (use-o como commentText): """${typedText}"""\nDo print, leia apenas autor e título do vídeo.`
            : 'Transcreva o print.',
        },
        {
          type: 'image_url',
          image_url: { url: commentImageDataUrl, detail: typedText ? 'low' : 'high' },
        },
      ];
      if (!manualTitle && videoImageDataUrl && videoImageDataUrl.startsWith('data:image')) {
        parts.push({ type: 'image_url', image_url: { url: videoImageDataUrl, detail: 'low' } });
      }

      const extraction = await openai.chat.completions.create({
        model,
        temperature: 0,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: EXTRACT_PROMPT },
          { role: 'user', content: parts },
        ],
      });
      addUsage(extraction.usage);

      const raw = JSON.parse(extraction.choices[0]?.message?.content || '{}');
      extracted = (Array.isArray(raw.items) ? raw.items : [])
        .map((i: any) => ({
          nickname: i.nickname || 'Espectador',
          personName: i.personName || '',
          commentText: (i.commentText || '').trim(),
          videoTitle: (i.videoTitle || '').trim(),
          kind: ['principal', 'terceiro', 'canal'].includes(i.kind) ? i.kind : 'principal',
          parentNickname: i.parentNickname || '',
        }))
        .filter((i: Extracted) => i.commentText);
    } else {
      extracted = [
        {
          nickname: 'Espectador',
          personName: '',
          commentText: typedText,
          videoTitle: manualTitle,
          kind: 'principal',
          parentNickname: '',
        },
      ];
    }

    if (extracted.length === 0) {
      return NextResponse.json(
        { error: 'Não foi possível identificar o texto do print. Cole o texto abaixo e clique em Gerar.' },
        { status: 422 }
      );
    }

    // título: o do print prevalece; o campo manual só preenche quando o print não mostra
    extracted.forEach((i) => {
      if (!i.videoTitle) i.videoTitle = manualTitle;
    });

    // comentários principais já respondidos pelo canal
    const answeredParents = new Set(
      extracted.filter((i) => i.kind === 'canal').map((i) => i.parentNickname.toLowerCase())
    );
    const toReply = extracted.filter(
      (i) => i.kind === 'principal' && !answeredParents.has(i.nickname.toLowerCase())
    );
    const skippedAnswered = extracted.filter(
      (i) => i.kind === 'principal' && answeredParents.has(i.nickname.toLowerCase())
    ).length;
    const thirdParty = extracted.filter((i) => i.kind === 'terceiro');

    const work = [
      ...toReply.map((i) => ({ ...i, mode: 'RESPONDER' as const })),
      ...thirdParty.map((i) => ({ ...i, mode: 'SOMENTE_PAUTA' as const })),
    ];

    if (work.length === 0) {
      return NextResponse.json({
        detectedVideoTitle: '',
        comments: [],
        replyTopics: [],
        skippedAnswered,
        usage: { model, inputTokens, cachedTokens, outputTokens },
      });
    }

    // ---------------- ETAPA 2: RESPOSTAS (texto puro, agrupado por vídeo) ----------------
    const groups = new Map<string, { ref: number; item: (typeof work)[number] }[]>();
    work.forEach((item, idx) => {
      const key = item.videoTitle || '(título do vídeo não identificado)';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push({ ref: idx + 1, item });
    });

    let userText = '';
    groups.forEach((entries, title) => {
      userText += `\n=== VÍDEO: "${title}" ===\n`;
      entries.forEach(({ ref, item }) => {
        userText += `[ref ${ref}] ${item.mode} | ${item.nickname}${item.personName ? ` (${item.personName})` : ''}: "${item.commentText}"\n`;
      });
    });
    if (recentReplies && recentReplies.length > 0) {
      userText += `\nÚLTIMAS RESPOSTAS (não repita abertura nem fechamento):\n${recentReplies
        .slice(0, 2)
        .map((r) => `- "${r.slice(0, 140)}"`)
        .join('\n')}`;
    }

    const replyCompletion = await openai.chat.completions.create({
      model,
      temperature: 0.5,
      presence_penalty: 0.1,
      frequency_penalty: 0.2,
      max_tokens: 1800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${REPLY_RULES}\n\n${buildChannelProfile(context)}` },
        { role: 'user', content: userText.trim() },
      ],
    });
    addUsage(replyCompletion.usage);

    const rawReplies = JSON.parse(replyCompletion.choices[0]?.message?.content || '{}');
    const results: any[] = Array.isArray(rawReplies.results) ? rawReplies.results : [];
    const byRef = new Map<number, any>();
    results.forEach((r, idx) => byRef.set(Number(r.ref) || idx + 1, r));

    const comments: any[] = [];
    const replyTopics: any[] = [];
    work.forEach((item, idx) => {
      const r = byRef.get(idx + 1) || {};
      if (item.mode === 'RESPONDER') {
        comments.push({
          nickname: item.nickname,
          personName: item.personName,
          commentText: item.commentText,
          videoTitle: item.videoTitle,
          suggestedTopic: (r.suggestedTopic || '').trim(),
          reply: (r.reply || '').trim(),
        });
      } else if ((r.suggestedTopic || '').trim().length > 5) {
        replyTopics.push({
          nickname: item.nickname,
          commentText: item.commentText,
          videoTitle: item.videoTitle,
          suggestedTopic: r.suggestedTopic.trim(),
        });
      }
    });

    const distinctTitles = Array.from(new Set(extracted.map((i) => i.videoTitle).filter(Boolean)));

    return NextResponse.json({
      detectedVideoTitle: distinctTitles.length === 1 ? distinctTitles[0] : '',
      comments,
      replyTopics,
      skippedAnswered,
      usage: { model, inputTokens, cachedTokens, outputTokens },
    });
  } catch (error: any) {
    console.error('Erro em /api/generate-reply:', error);
    return NextResponse.json(
      { error: error?.message || 'Falha ao gerar resposta para o comentário.' },
      { status: 500 }
    );
  }
}
