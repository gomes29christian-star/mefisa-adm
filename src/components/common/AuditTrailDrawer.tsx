import React, { useState } from 'react';
import {
  X,
  History,
  ShieldCheck,
  User,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { EventoAuditoria } from '../../types/clinic';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface AuditTrailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  logs: EventoAuditoria[];
  filtroEntidade?: string;
}

export const AuditTrailDrawer: React.FC<AuditTrailDrawerProps> = ({
  isOpen,
  onClose,
  logs,
  filtroEntidade,
}) => {
  const { triggerSecretAction } = useSecretAchievements();
  const [termoBusca, setTermoBusca] = useState('');

  if (!isOpen) return null;

  // Ao inspecionar os logs de auditoria detalhados, registra a conquista secreta se o cofre estiver ativo
  triggerSecretAction('rastreabilidade_plena');

  const logsFiltrados = logs.filter((log) => {
    if (filtroEntidade && log.entidade !== filtroEntidade) return false;
    if (!termoBusca) return true;
    const t = termoBusca.toLowerCase();
    return (
      log.usuarioNome.toLowerCase().includes(t) ||
      log.acao.toLowerCase().includes(t) ||
      log.descricaoRegistro.toLowerCase().includes(t) ||
      (log.motivo && log.motivo.toLowerCase().includes(t))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
      <div className="w-full max-w-xl h-full bg-white shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-[#002172] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <History className="w-5 h-5 text-[#91CA0C]" />
            </div>
            <div>
              <h3 className="font-['Quicksand'] font-bold text-base text-white">
                Trilha Central de Auditoria & Rastreabilidade
              </h3>
              <p className="text-xs text-blue-100/80">
                Histórico imutável de alterações, motivos e responsáveis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filtro do Log */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Buscar por usuário, ação, paciente ou motivo..."
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-[#002172]"
            />
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>
          <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">
            {logsFiltrados.length} eventos
          </span>
        </div>

        {/* Lista de Registros de Auditoria */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {logsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Nenhum registro de auditoria correspondente encontrado.
            </div>
          ) : (
            logsFiltrados.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200/90 bg-white hover:border-slate-300 shadow-2xs space-y-2 text-xs"
              >
                {/* Cabeçalho do Evento */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900">{log.acao}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">
                      {log.entidade}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                    <Clock className="w-3 h-3" />
                    <span>{log.dataHora}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-600 font-medium">
                  {log.descricaoRegistro}
                </div>

                {/* Diferencial Anterior vs Novo */}
                <div className="p-2 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between text-[11px]">
                  <div className="text-slate-500">
                    <span className="text-[9.5px] uppercase tracking-wider block text-slate-400">
                      Anterior:
                    </span>
                    <span className="line-through text-red-700 font-mono">
                      {log.valorAnterior}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mx-2" />
                  <div className="text-slate-900 font-bold text-right">
                    <span className="text-[9.5px] uppercase tracking-wider block text-slate-400">
                      Novo:
                    </span>
                    <span className="text-emerald-700 font-mono">
                      {log.valorNovo}
                    </span>
                  </div>
                </div>

                {/* Motivo Estruturado Obrigatório */}
                {log.motivo && (
                  <div className="flex items-start gap-1.5 text-[11px] bg-amber-50/60 p-2 rounded-lg border border-amber-200/60 text-amber-900">
                    <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold">Motivo do Ajuste: </span>
                      <span>{log.motivo}</span>
                    </div>
                  </div>
                )}

                {/* Usuário Responsável */}
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10.5px] text-slate-500">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>
                      Responsável: <strong>{log.usuarioNome}</strong> ({log.papelUsuario})
                    </span>
                  </div>
                  <span className="text-emerald-700 flex items-center gap-0.5 font-semibold">
                    <ShieldCheck className="w-3 h-3" />
                    Auditado
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
};
