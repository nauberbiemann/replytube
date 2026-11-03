import { NextRequest, NextResponse } from 'next/server';
import { validateAccess } from '@/lib/auth';

/**
 * Proxy seguro para o Google Apps Script (planilha do Banco de Temas).
 * A URL do webhook e o segredo ficam apenas no servidor (variáveis da Vercel).
 * Não consome nenhum token da OpenAI.
 */

function getConfig() {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL?.trim();
  const secret = process.env.GOOGLE_SHEETS_SECRET?.trim();
  return url && secret ? { url, secret } : null;
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
    const { action } = body as { action: 'upsert' | 'delete' | 'list' | 'logMining' };
    if (!['upsert', 'delete', 'list', 'logMining'].includes(action)) {
      return NextResponse.json({ ok: false, error: 'Ação inválida.' }, { status: 400 });
    }

    const res = await fetch(config.url, {
      method: 'POST',
      // text/plain evita preflight e é o formato aceito pelo Apps Script
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, secret: config.secret }),
      redirect: 'follow',
      cache: 'no-store',
    });

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { ok: false, error: 'Resposta inválida do Google Apps Script. Verifique a implantação (acesso: Qualquer pessoa).' },
        { status: 502 }
      );
    }

    return NextResponse.json({ configured: true, ...data });
  } catch (error: any) {
    console.error('Erro em /api/topics/sync:', error);
    return NextResponse.json(
      { ok: false, error: error?.message || 'Falha ao sincronizar com a planilha.' },
      { status: 500 }
    );
  }
}
