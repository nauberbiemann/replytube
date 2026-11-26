import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';

/**
 * Proxy seguro para o Google Apps Script (planilha do Banco de Temas).
 * A URL do webhook e o segredo ficam apenas no servidor (variáveis da Vercel).
 * Não consome nenhum token da OpenAI.
 */

const REQUEST_TIMEOUT_MS = 15000;
const RETRY_DELAYS_MS = [0, 1000, 2400];
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

type ScriptCallResult =
  | { ok: true; parsed: Record<string, any> }
  | { ok: false; authError: true; error: string }
  | { ok: false; transient: true; status?: number; error?: string };

function getConfig() {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_SECRET?.trim();
  return url && secret ? { url, secret } : null;
}

function isGoogleLoginUrl(targetUrl: string): boolean {
  return /accounts\.google\.com|ServiceLogin/i.test(targetUrl);
}

function isGoogleLoginHtml(text: string): boolean {
  return /accounts\.google\.com|ServiceLogin/i.test(text);
}

function htmlTitle(text: string): string {
  const m = text.match(/<title[^>]*>([^<]*)<\/title>/i);
  return (m ? m[1] : text.slice(0, 120)).replace(/\s+/g, ' ').trim();
}

/**
 * Uma tentativa. Qualquer resposta não-JSON é tratada como REPETÍVEL:
 * as páginas de erro temporário do Google também contêm links para accounts.google.com,
 * então "parecer login" numa única tentativa não prova problema de permissão.
 */
async function postToAppsScriptOnce(
  url: string,
  payload: string
): Promise<ScriptCallResult & { looksLikeLogin?: boolean }> {
  try {
    let currentUrl = url;
    let res = await fetch(currentUrl, {
      method: 'POST',
      // text/plain evita preflight e é o formato aceito pelo Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: payload,
      redirect: 'manual',
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    for (let hop = 0; hop < 5 && REDIRECT_STATUSES.has(res.status); hop++) {
      const location = res.headers.get('location');
      if (!location) break;
      const nextUrl = new URL(location, currentUrl).toString();
      if (isGoogleLoginUrl(nextUrl)) {
        console.error('[sheets-sync] redirect para login:', new URL(nextUrl).host);
        return { ok: false, transient: true, status: res.status, looksLikeLogin: true };
      }
      currentUrl = nextUrl;
      res = await fetch(currentUrl, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        redirect: 'manual',
        cache: 'no-store',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    }

    const text = await res.text();
    try {
      return { ok: true, parsed: JSON.parse(text) };
    } catch {
      const looksLikeLogin = res.status === 401 || res.status === 403 || isGoogleLoginHtml(text);
      console.error(
        `[sheets-sync] resposta não-JSON status=${res.status} host=${new URL(currentUrl).host} titulo="${htmlTitle(text)}"`
      );
      return { ok: false, transient: true, status: res.status, looksLikeLogin };
    }
  } catch (err: any) {
    console.error('[sheets-sync] falha de rede:', err?.message);
    return {
      ok: false,
      transient: true,
      error: err?.message || 'Oscilação de rede ao acessar o Google Apps Script.',
    };
  }
}

async function callAppsScriptWithRetry(
  url: string,
  payloadObj: Record<string, any>
): Promise<ScriptCallResult> {
  const payload = JSON.stringify(payloadObj);
  let allLookedLikeLogin = true;
  let lastStatus: number | undefined;

  for (let i = 0; i < RETRY_DELAYS_MS.length; i++) {
    const delay = RETRY_DELAYS_MS[i];
    if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

    const result = await postToAppsScriptOnce(url, payload);
    if (result.ok) return result;
    if (!result.looksLikeLogin) allLookedLikeLogin = false;
    if ('status' in result) lastStatus = result.status;
  }

  if (allLookedLikeLogin) {
    return {
      ok: false,
      authError: true,
      error:
        'O Google pediu login em todas as tentativas. Se persistir, confira a implantação (acesso: "Qualquer pessoa").',
    };
  }
  return {
    ok: false,
    transient: true,
    error: 'O Google Sheets demorou ou oscilou temporariamente.',
    ...(lastStatus ? { status: lastStatus } : {}),
  };
}

export async function GET(req: NextRequest) {
  const auth = validateAccess(req);
  if (!auth.authorized) {
    return NextResponse.json({ error: 'Acesso bloqueado.' }, { status: 401 });
  }
  return NextResponse.json({ configured: Boolean(getConfig()) });
}

export async function POST(req: NextRequest) {
  try {
    const auth = validateAccess(req);
    if (!auth.authorized) {
      return NextResponse.json({ error: 'Acesso bloqueado.' }, { status: 401 });
    }

    const config = getConfig();
    if (!config) {
      return NextResponse.json(
        { ok: false, configured: false, error: 'Planilha não configurada.' },
        { status: 200 }
      );
    }

    const body = await req.json();
    const { action } = body as { action: string };
    const ALLOWED_ACTIONS = [
      'upsert', 'delete', 'list', 'logMining',
      'radarUpsert', 'radarList', 'queueUpsert', 'queueDelete', 'queueList',
    ];
    if (!ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
    }

    const result = await callAppsScriptWithRetry(config.url, { ...body, secret: config.secret });
    if (!result.ok) {
      if ('authError' in result && result.authError) {
        return NextResponse.json(
          { ok: false, authError: true, error: result.error },
          { status: 502 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          transient: true,
          error: result.error || 'O Google Sheets demorou ou oscilou temporariamente.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ configured: true, ...result.parsed });
  } catch (error: any) {
    console.error('Erro em /api/topics/sync:', error);
    return NextResponse.json(
      { ok: false, transient: true, error: error?.message || 'Falha ao sincronizar com a planilha.' },
      { status: 500 }
    );
  }
}
