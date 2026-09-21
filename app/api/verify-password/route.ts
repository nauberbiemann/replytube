import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const serverPassword = process.env.APP_PASSWORD;

    // Se o dono não configurou senha no servidor, o acesso é direto
    if (!serverPassword || serverPassword.trim() === '') {
      return NextResponse.json({
        valid: true,
        requiresPassword: false,
      });
    }

    const body = await req.json().catch(() => ({}));
    const clientPassword = body.password || req.headers.get('x-app-password') || '';

    const isValid = clientPassword.trim() === serverPassword.trim();

    return NextResponse.json({
      valid: isValid,
      requiresPassword: true,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Falha ao verificar senha.' },
      { status: 500 }
    );
  }
}
