import { NextRequest } from 'next/server';

export function validateAccess(req: NextRequest): { authorized: boolean; requiresPassword: boolean } {
  const serverPassword = process.env.APP_PASSWORD;

  // Se nenhuma senha foi definida no servidor, permite o acesso livremente
  if (!serverPassword || serverPassword.trim() === '') {
    return { authorized: true, requiresPassword: false };
  }

  const clientPassword = req.headers.get('x-app-password');
  const isMatch = clientPassword?.trim() === serverPassword.trim();

  return { authorized: isMatch, requiresPassword: true };
}
