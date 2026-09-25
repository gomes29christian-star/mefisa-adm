import React, { useState } from 'react';
import { Lock, KeyRound, ShieldAlert, Check, Copy, ArrowRight } from 'lucide-react';
import { Usuario } from '../../types/clinic';

interface LoginLockScreenProps {
  usuarios: Usuario[];
  onUnlock: (usuario: Usuario) => void;
}

export const LoginLockScreen: React.FC<LoginLockScreenProps> = ({
  usuarios,
  onUnlock,
}) => {
  const [pastedPassword, setPastedPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmed = pastedPassword.trim();
    if (!trimmed) {
      setErrorMessage('Por favor, cole a senha extremamente longa do sistema.');
      return;
    }

    // Find user matching systemPassword
    const matchedUser = usuarios.find((u) => u.systemPassword === trimmed);
    if (matchedUser) {
      sessionStorage.setItem('mefisa_session_active', 'true');
      localStorage.setItem('mefisa_trusted_browser', 'true');
      onUnlock(matchedUser);
    } else {
      setErrorMessage('Senha incorreta ou não encontrada. Verifique a senha do sistema.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 font-['Quicksand'] select-none">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        <div className="p-8 text-center space-y-4 bg-gradient-to-b from-blue-50/80 to-transparent dark:from-blue-950/40">
          <div className="w-16 h-16 rounded-2xl bg-[#002172] text-white flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-8 h-8 text-[#91CA0C]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Sessão Bloqueada
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              O navegador foi fechado anteriormente. Cole sua senha extremamente longa do sistema para restaurar o acesso à clínica.
            </p>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="p-8 pt-0 space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Senha Extremamente Longa do Sistema
            </label>
            <textarea
              rows={3}
              required
              value={pastedPassword}
              onChange={(e) => setPastedPassword(e.target.value)}
              placeholder="Cole aqui a sua senha gerada pelo sistema (ex: mefisa_sys_sec_...)"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-[#002172] resize-none"
            />
          </div>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
          >
            <span>Desbloquear e Entrar</span>
            <ArrowRight className="w-4 h-4 text-[#91CA0C]" />
          </button>
        </form>
      </div>
    </div>
  );
};
