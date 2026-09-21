'use client';

import React, { useState } from 'react';
import { Lock, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';

interface PasswordModalProps {
  isOpen: boolean;
  onSuccess: (password: string) => void;
}

export function PasswordModal({ isOpen, onSuccess }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim() || loading) return;

    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: password.trim() }),
      });

      const data = await res.json();
      if (data.valid) {
        onSuccess(password.trim());
      } else {
        setError('Senha de acesso incorreta. Tente novamente.');
      }
    } catch {
      setError('Erro de conexão ao verificar a senha.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-150">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-xs">
          <Lock className="h-6 w-6" />
        </div>

        <div>
          <h2 className="text-base font-bold tracking-tight text-foreground">
            Acesso Protegido
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Digite sua senha de proteção para usar a plataforma e consumir seus créditos com segurança.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Digite a senha de acesso..."
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 pr-10 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-red-500 shadow-2xs text-center"
              autoFocus
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
              title={showPassword ? 'Ocultar senha' : 'Ver senha'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs font-medium text-red-500 animate-in fade-in duration-150">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!password.trim() || loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verificando...
              </>
            ) : (
              <>
                <KeyRound className="h-4 w-4" />
                Desbloquear Acesso
              </>
            )}
          </button>
        </form>

        <p className="text-[10px] text-muted-foreground">
          Sua senha fica salva com segurança apenas no seu navegador.
        </p>
      </div>
    </div>
  );
}
