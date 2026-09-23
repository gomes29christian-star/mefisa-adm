import React from 'react';
import {
  CalendarClock,
  ClockAlert,
  FileCheck2,
  FileSpreadsheet,
  AlertOctagon,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  UserCheck,
  Building,
  FileText,
  Activity,
  Layers,
} from 'lucide-react';
import {
  MOCK_AUTORIZACOES,
  MOCK_GUIAS,
  MOCK_ANALISES,
  MOCK_PENDENCIAS,
  MOCK_AUDITORIA,
} from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface DashboardViewProps {
  onNavigate: (key: any) => void;
  onOpenCalculator: () => void;
  onOpenAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigate,
  onOpenCalculator,
  onOpenAudit,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  // Métricas do Dashboard conforme solicitado no prompt
  const kpis = [
    {
      label: 'Autorizações Hoje',
      valor: 12,
      subtexto: '3 renovações prioritárias',
      corCard: 'border-blue-200 bg-white',
      badgeCor: 'bg-blue-100 text-[#002172]',
      icon: FileCheck2,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Próximas 7 Dias',
      valor: 28,
      subtexto: 'Regra de 1 sessão restante',
      corCard: 'border-indigo-200 bg-white',
      badgeCor: 'bg-indigo-100 text-indigo-800',
      icon: CalendarClock,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Autorizações Atrasadas',
      valor: 3,
      subtexto: 'Requerem justificativa',
      corCard: 'border-amber-300 bg-amber-50/30',
      badgeCor: 'bg-amber-100 text-amber-800',
      icon: ClockAlert,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Análises > 7 Dias',
      valor: 2,
      subtexto: 'Atraso de convênio detectado',
      corCard: 'border-red-300 bg-red-50/30',
      badgeCor: 'bg-red-100 text-red-800',
      icon: AlertOctagon,
      targetTab: 'analises',
      onAlertClick: () => triggerSecretAction('sentinela_7_dias'),
    },
    {
      label: 'Aguardando Digitação',
      valor: 17,
      subtexto: 'Guias com assinaturas colhidas',
      corCard: 'border-blue-200 bg-white',
      badgeCor: 'bg-blue-100 text-blue-900',
      icon: FileSpreadsheet,
      targetTab: 'guias',
    },
    {
      label: 'Pendências Críticas',
      valor: 8,
      subtexto: 'Inconsistências em aberto',
      corCard: 'border-amber-300 bg-amber-50/30',
      badgeCor: 'bg-amber-100 text-amber-900',
      icon: AlertOctagon,
      targetTab: 'pendencias',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner de Boas-Vindas Operacionais */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#002172] via-[#0b2f77] to-[#2A657E] text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-semibold mb-2">
            <Activity className="w-3.5 h-3.5" />
            <span>Painel de Controle Central · Clínica Mefisa</span>
          </div>
          <h1 className="text-2xl font-bold font-['Quicksand'] text-white tracking-tight">
            Visão Geral Administrativa & Convênios
          </h1>
          <p className="text-xs text-blue-100/90 mt-1 max-w-xl font-['Nunito_Sans']">
            Acompanhe o que precisa ser feito hoje, autorizações a renovar, guias em análise demoradas e a trilha de auditoria em tempo real.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={onOpenCalculator}
            className="px-4 py-2.5 rounded-xl bg-[#91CA0C] hover:bg-[#82b50b] text-[#002172] font-bold text-xs shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span className={getThemeStrokeStyle('text')}>Simulador de Cálculo</span>
          </button>
          <button
            onClick={() => onNavigate('central_dados')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-colors flex items-center gap-1.5"
          >
            <span>Ver Planilhas Clínicas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Grid de 6 KPIs Centrais Exigidos na Seção 11 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              onClick={() => {
                if (kpi.onAlertClick) kpi.onAlertClick();
                onNavigate(kpi.targetTab);
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-md hover:scale-[1.01] flex flex-col justify-between ${kpi.corCard}`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10.5px] font-bold text-slate-500 uppercase tracking-tight">
                  {kpi.label}
                </span>
                <div className={`p-1.5 rounded-lg ${kpi.badgeCor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div>
                <div className="text-2xl font-extrabold text-slate-900 font-mono tabular-nums">
                  {kpi.valor}
                </div>
                <div className="text-[10px] text-slate-500 leading-tight mt-0.5">
                  {kpi.subtexto}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid de 2 Colunas: O Que Precisa Ser Feito Hoje + Trilha de Auditoria Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna 1: O Que Precisa Ser Feito Hoje? (Fila de Prioridades) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-['Quicksand']">
                  O que precisa ser feito hoje?
                </h3>
                <p className="text-[11px] text-slate-400">
                  Prioridades operacionais ordenadas por prazo e impacto clínico
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pendencias')}
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Ver todas ({MOCK_PENDENCIAS.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {MOCK_PENDENCIAS.slice(0, 4).map((pend) => (
              <div
                key={pend.id}
                onClick={() => onNavigate(pend.linkModulo)}
                className="p-3 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all cursor-pointer flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                        pend.prioridade === 'CRITICA'
                          ? 'bg-red-100 text-red-800'
                          : pend.prioridade === 'ALTA'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {pend.prioridade}
                    </span>
                    <span className="font-bold text-slate-800">{pend.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {pend.descricao}
                  </p>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    Paciente: <strong>{pend.pacienteNome}</strong> · Responsável sugerido:{' '}
                    {pend.responsavelSugerido}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-red-700 block">
                    {pend.prazoLimite}
                  </span>
                  <span className="text-[10.5px] text-blue-700 font-semibold mt-1 inline-block">
                    Resolver →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Últimas Ações Auditadas (Rastreabilidade Absoluta) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#002172] flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm font-['Quicksand']">
                  Quem fez o quê? (Auditoria Recente)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Rastreabilidade imutável de alterações de datas, quantidades e guias
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-xs text-blue-700 font-semibold hover:underline"
            >
              Auditoria Completa →
            </button>
          </div>

          <div className="space-y-2.5">
            {MOCK_AUDITORIA.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-white transition-all text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800">
                    <span>{log.usuarioNome}</span>
                    <span className="text-slate-400 font-normal">({log.papelUsuario})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {log.dataHora}
                  </span>
                </div>

                <div className="text-[11.5px] text-slate-700 font-medium">
                  {log.acao} — <span className="text-slate-500">{log.descricaoRegistro}</span>
                </div>

                <div className="text-[11px] bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between">
                  <span className="line-through text-red-700 font-mono">{log.valorAnterior}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span className="text-emerald-700 font-bold font-mono">{log.valorNovo}</span>
                </div>

                {log.motivo && (
                  <div className="text-[10.5px] text-amber-900 bg-amber-50/80 px-2 py-1 rounded">
                    <strong>Motivo:</strong> {log.motivo}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
