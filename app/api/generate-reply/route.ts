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
- personName: primeiro nome tirado do @ ou da assinatura do texto. Tente SEMPRE. Exemplos: @gusttavosantos1333 -> "Gusttavo"; @marcioorlandi -> "Marcio"; @edsonsantos1998 -> "Edson"; @belmirobeccari4818 -> "Belmiro"; @JoséRocha-t9m -> "José". Só deixe vazio se o @ claramente não contiver um nome (ex: @aguilarxxi7206, @radar_br).
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

REGRA Nº 1 — O TEMA É O VÍDEO INFORMADO:
Você recebe UM comentário e o título do vídeo onde ele foi feito. A resposta deve se conectar ao assunto DESSE título (ex: vídeo "PARE de Acelerar Errado: O Hábito Que Faz Seu Carro Beber" -> fale de aceleração/consumo; vídeo "PARE de Desligar o Carro Assim" -> fale do jeito de desligar). Não traga assuntos de outros vídeos do canal. Se o comentário for curto (ex: "Meriva 1.8 2003"), conecte o carro da pessoa ao tema do vídeo.

REGRA Nº 2 — NOME: se o nome for informado, use-o na primeira frase, de forma natural (sem "Fala"/"Olá").

COMO RESPONDER CADA TIPO:
- ELOGIO / AGRADECIMENTO: cite o detalhe CONCRETO que a pessoa mencionou; acrescente informação útil SÓ se couber no tamanho. Nada de agradecimento vazio.
- COMENTÁRIO SIMPLES (carro, modelo, ano, quilometragem, elogio curto — ex: "Ônix 2020 516 mil km", "Meu carro é Bravado Buffalo 4x4"): tom de conversa leve entre amigos. Celebre, elogie ou demonstre simpatia pelo que a pessoa contou. PROIBIDO alertar, ensinar ou advertir: nada de "fique atento", "cuidado", "pode desgastar", "evite", "exige atenção", "é importante". Só cite o tema do vídeo se for de forma POSITIVA e natural (ex: "esse aí já deve ter sido desligado do jeito certo muitas vezes"); se não couber naturalmente, NÃO fale do tema — fique só na amenidade. Ex.: "Gusttavo, 516 mil km é coisa de quem cuida bem! Cuide do seu carro, cuide do seu bolso!"
- PERGUNTA: responda de forma direta e CORRETA para o caso exato (automático ≠ manual etc.). Se exigir mais que 2 frases, dê a dica principal e diga que vira vídeo.
- DADO TÉCNICO / COMPLEMENTO: converse de igual para igual.
- IRONIA OU ANALOGIA CONCORDANDO com o vídeo: NÃO rebata.
- DISCORDÂNCIA REAL: rebata com respeito e com o argumento do vídeo.
- Nunca invente fatos, números ou promessas.

PROIBIDO: "Fico muito feliz", "Fico feliz em saber", "Que notícia fantástica", "marca impressionante", "Muito obrigado pela inscrição", "Espero que tenha gostado", "ponto crucial", "ótima observação", "excelente ponto", "Fala [Nome]!", "Olá [Nome]!", "Continue assim!", "Continue acompanhando a gente!", "Vamos continuar debatendo".
Use o primeiro nome de forma natural.

FECHAMENTO — use o estilo indicado na mensagem:
A) Gancho para próximos vídeos LIGADO ao assunto + bordão oficial do canal (se existir nas diretrizes).
B) Pergunta curta e específica sobre o tema do vídeo.
C) Frase técnica de conclusão que crava a tese do vídeo.

TAMANHO: siga RIGOROSAMENTE o limite de palavras indicado na mensagem. Menos é mais: comentário curto e simples pede resposta curta, direta e sem floreios (nada de explicar o óbvio, listar cuidados ou dar aula). Sem adjetivos de enfeite. O bordão do canal só no fechamento A, e no máximo uma vez.

PAUTA ("suggestedTopic"): só se o comentário trouxer pergunta, pedido, caso real, comparação ou crítica que renda um vídeo NOVO; fiel ao que a pessoa disse. Senão "".
MODO SOMENTE_PAUTA (resposta de terceiro): "reply" deve ser "", apenas avalie a pauta.

Retorne APENAS JSON: {"suggestedTopic":"","reply":""}`;

function buildChannelProfile(context: ChannelContext): string {
  const desc = (context.channelDescription || '').slice(0, 6000);
  return `PERFIL DO CANAL:
- Nicho: ${context.nicho || 'Geral'} | Tom: ${context.tomDeVoz || 'Técnico e autêntico'}
- Público: ${context.publico || 'Entusiastas'} | Temas: ${(context.temasChave || []).join(', ')}
${context.resumo ? `- Resumo: ${context.resumo}` : ''}
${desc ? `DIRETRIZES E BORDÕES OFICIAIS DO CANAL (respeite integralmente):\n"""\n${desc}\n"""` : ''}`;
}

// Reserva (sem tokens): se a leitura não trouxe nome, tenta achar um nome comum no início do @
const COMMON_NAMES = 'adriana adriano alex alexandre aline ana anderson andre andrea antonio arthur augusto beatriz belmiro bruno caio camila carla carlos cesar ciro claudia claudio cristiano daniel daniela davi diego douglas edson eduardo elias emerson everson evandro fabio fabiano felipe fernanda fernando flavio francisco gabriel gilberto gilmar giovanni guilherme gustavo gusttavo helio henrique hugo igor ivan jair jefferson joao jorge jose josue julio juliana junior leandro leonardo lucas luciano luis luiz marcelo marcio marcos maria mario marta mateus mauricio mauro michel miguel milton moises murilo nelson nicolas osvaldo otavio patricia paulo pedro rafael raimundo reginaldo renato ricardo roberto rodrigo rogerio ronaldo rubens samuel sandro sergio silvio thiago tiago valter vanderlei victor vinicius vitor wagner walter washington wellington wilson'.split(' ');

function guessFirstName(nickname: string): string {
  const handle = (nickname || '')
    .replace(/^@/, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const match = COMMON_NAMES.filter((n) => handle.startsWith(n)).sort((a, b) => b.length - a.length)[0];
  return match ? match.charAt(0).toUpperCase() + match.slice(1) : '';
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
            : manualTitle
            ? 'Transcreva o print. Todos os comentários são do mesmo vídeo (já informado): deixe "videoTitle" vazio.'
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
      if (manualTitle) i.videoTitle = manualTitle; // campo preenchido = vale para TODOS os comentários
      if (!i.personName) i.personName = guessFirstName(i.nickname);
      if (i.personName.replace(/[^A-Za-zÀ-ÿ]/g, '').length < 3) i.personName = ''; // evita 'Ma', 'Jo'...
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

    // ---------------- ETAPA 2: UMA CHAMADA POR COMENTÁRIO (isolamento total) ----------------
    // Cada chamada só enxerga UM comentário e o SEU vídeo: não há como "vazar" assunto de outra linha.
    // O prefixo (regras + perfil do canal) é idêntico em todas -> elegível a prompt caching.
    const systemReply = `${REPLY_RULES}\n\n${buildChannelProfile(context)}`;
    const styles = ['A', 'B', 'C'];
    const offset = Math.floor(Math.random() * 3);
    const recent = (recentReplies || []).slice(0, 2).map((r) => `- "${r.slice(0, 140)}"`).join('\n');

    const answers = await Promise.all(
      work.map(async (item, idx) => {
        const firstName = (item.personName || guessFirstName(item.nickname)).trim();
        // Tamanho proporcional ao comentário (decidido pelo app, não pela IA)
        const len = item.commentText.length;
        const isQuestion = item.commentText.includes('?');
        const size =
          len <= 120 && !isQuestion
            ? { words: 25, tokens: 120, label: '1 ou 2 frases curtas, MÁXIMO 25 palavras' }
            : len <= 220
            ? { words: 40, tokens: 180, label: '2 frases, MÁXIMO 40 palavras' }
            : { words: 60, tokens: 260, label: 'até 3 frases, MÁXIMO 60 palavras' };
        const userText =
          item.mode === 'SOMENTE_PAUTA'
            ? `MODO: SOMENTE_PAUTA (resposta de terceiro; NÃO escreva reply)
VÍDEO: "${item.videoTitle || 'não identificado'}"
Comentário de ${item.nickname}: "${item.commentText}"`
            : `VÍDEO DESTE COMENTÁRIO (o único tema permitido): "${item.videoTitle || 'não identificado'}"
AUTOR: ${item.nickname}${firstName ? ` — chame-o de "${firstName}" na PRIMEIRA frase` : ' — sem nome identificável, não invente nome'}
COMENTÁRIO: "${item.commentText}"
TAMANHO: ${size.label}.${len <= 120 && !isQuestion ? '\nTIPO: COMENTÁRIO SIMPLES — só simpatia/amenidade, sem nenhum alerta ou ensinamento.' : ''}
FECHAMENTO A USAR: ${len <= 120 && !isQuestion ? 'A (bordão do canal)' : styles[(idx + offset) % 3]}${recent ? `\nNÃO repita a abertura/fechamento destas respostas recentes:\n${recent}` : ''}`;

        const completion = await openai.chat.completions.create({
          model,
          temperature: 0.5,
          presence_penalty: 0.1,
          frequency_penalty: 0.2,
          max_tokens: size.tokens + 80,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemReply },
            { role: 'user', content: userText },
          ],
        });
        addUsage(completion.usage);
        try {
          return JSON.parse(completion.choices[0]?.message?.content || '{}');
        } catch {
          return {};
        }
      })
    );

    const comments: any[] = [];
    const replyTopics: any[] = [];
    work.forEach((item, idx) => {
      const r = answers[idx] || {};
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
