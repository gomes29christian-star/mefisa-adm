import React from 'react';
import {
  ClockAlert,
  AlertTriangle,
  CheckCircle2,
  FileText,
  History,
  Building,
  PhoneCall,
} from 'lucide-react';
import { MOCK_ANALISES } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface AnalisesViewProps {
  onOpenAudit: () => void;
}

export const AnalisesView: React.FC<AnalisesViewProps> = ({ onOpenAudit }) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Processos em Análise no Convênio
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
              Alerta de Atraso &gt; 7 Dias
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoramento de SLA das operadoras (SulAmérica, Unimed, Bradesco) e justificativas técnicas.
          </p>
        </div>

        <button
          onClick={() => {
            triggerSecretAction('sentinela_7_dias');
            alert('Cobrança em lote disparada aos canais de relacionamento das operadoras.');
          }}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs"
        >
          <PhoneCall className="w-4 h-4" />
          <span>Cobrar Convênios em Atraso</span>
        </button>
      </div>

      {/* Cards de Análises */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MOCK_ANALISES.map((proc) => {
          const isAtrasado = proc.alertaAtraso;

          return (
            <div
              key={proc.id}
              className={`p-5 rounded-2xl border transition-all space-y-3 ${
                isAtrasado
                  ? 'bg-red-50/40 border-red-300 shadow-xs'
                  : 'bg-white border-slate-200/80 shadow-2xs'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-600">
                    Protocolo: {proc.protocoloConvenio}
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold">
                    {proc.convenioNome}
                  </span>
                </div>

                <div
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                    isAtrasado
                      ? 'bg-red-100 text-red-800 animate-pulse'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {proc.diasEmAnalise} dias decorridos
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {proc.pacienteNome}
                </h3>
                <div className="text-xs text-slate-500">
                  Data de Envio: <strong>{proc.dataEnvio}</strong> · Última checagem:{' '}
                  {proc.ultimaChecagem}
                </div>
              </div>

              {/* Justificativa / Parecer do Convênio */}
              <div className="p-3 rounded-xl bg-white/80 border border-slate-200 text-xs space-y-1">
                <div className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Parecer Técnico do Convênio:</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-snug">
                  "{proc.justificativaConvenio}"
                </p>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Responsável: <strong>{proc.responsavelAcompanhamento}</strong>
                </span>

                <button
                  onClick={() => {
                    triggerSecretAction('sentinela_7_dias');
                    onOpenAudit();
                  }}
                  className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  Ver Histórico
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
