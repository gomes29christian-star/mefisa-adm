import React from 'react';
import {
  ShieldCheck,
  UserCheck,
  Plus,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { MOCK_USUARIOS } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { Usuario } from '../../types/clinic';

interface UsuariosConfigViewProps {
  activeUsuario: Usuario;
  onSelectUsuario: (usr: Usuario) => void;
}

export const UsuariosConfigView: React.FC<UsuariosConfigViewProps> = ({
  activeUsuario,
  onSelectUsuario,
}) => {
  const { getThemeStrokeStyle } = useTheme();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Controle de Acesso RBAC & Usuários
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#002172]">
              Sessões & Filtros Isolados
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Separação formal entre coordenação clínica, recepção de autorizações e digitação de guias.
          </p>
        </div>

        <button
          onClick={() => alert('Simulação V0: O módulo V8 implementará o gerenciamento granular de credenciais.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#91CA0C]" />
          <span>+ Convidar Novo Usuário</span>
        </button>
      </div>

      {/* Grid de Usuários */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_USUARIOS.map((usr) => {
          const isActive = usr.id === activeUsuario.id;

          return (
            <div
              key={usr.id}
              className={`p-5 rounded-2xl border transition-all space-y-4 ${
                isActive
                  ? 'bg-blue-50/40 border-[#002172] shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-[#002172] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {usr.avatar}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{usr.nome}</h3>
                    <div className="text-xs text-slate-500">{usr.email}</div>
                    <div className="text-[11px] text-[#2A657E] font-medium mt-0.5">
                      {usr.departamento}
                    </div>
                  </div>
                </div>

                {isActive ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Sua Sessão Atual
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectUsuario(usr)}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Alternar p/ este
                  </button>
                )}
              </div>

              {/* Matriz de Permissões do Papel */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="font-bold text-slate-700 flex items-center justify-between">
                  <span>Papel no Sistema:</span>
                  <span className="text-[#002172] font-mono">{usr.papel}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {usr.permissoes.map((perm, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px] font-medium"
                    >
                      ✓ {perm}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>Último Acesso: {usr.ultimoAcesso}</span>
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  MFA Ativado
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
