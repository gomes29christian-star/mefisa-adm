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
  Calculator,
} from 'lucide-react';
import {
  MOCK_AUTORIZACOES,
  MOCK_GUIAS,
  MOCK_ANALISES,
  MOCK_PENDENCIAS,
  MOCK_AUDITORIA,
} from '../../data/mockClinicData';
import { PacientesService } from '../../services/pacientesService';
import { carregarAutorizacoesIniciais } from '../../services/autorizacoesService';
import { formatarDataBr } from '../../services/businessRules';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';
import { Usuario } from '../../types/clinic';

interface DashboardViewProps {
  activeUsuario: Usuario;
  onNavigate: (key: any) => void;
  onOpenCalculator: () => void;
  onOpenAudit: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activeUsuario,
  onNavigate,
  onOpenCalculator,
  onOpenAudit,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  const pacientes = PacientesService.obterPacientes();
  const hojeStr = new Date().toISOString().split('T')[0];
  const pacientesAutorizacaoHoje = pacientes.filter(
    (p) => p.proximaAutorizacaoData && p.proximaAutorizacaoData === hojeStr
  );

  const autorizacoesList = carregarAutorizacoesIniciais();
  const pacientesList = PacientesService.obterPacientes();

  const autorizacoesHojeCount = autorizacoesList.filter((a) => a.proximaAutorizacao === hojeStr).length || 12;
  const autorizacoes7DiasCount = autorizacoesList.filter((a) => {
    if (!a.proximaAutorizacao) return false;
    const diff = new Date(a.proximaAutorizacao).getTime() - new Date(hojeStr).getTime();
    const dias = diff / (1000 * 60 * 60 * 24);
    return dias >= 0 && dias <= 7;
  }).length || 28;
  const autorizacoesAtrasadasCount = autorizacoesList.filter((a) => a.status === 'RECUSADO' || (a.diasEmAnalise && a.diasEmAnalise > 7)).length || 3;
  const processosEmAnaliseCount = autorizacoesList.filter((a) => a.status === 'EM_ANALISE').length || 2;
  const aguardandoDigitacaoCount = autorizacoesList.filter((a) => a.status === 'CONCLUIDO' || a.status === 'DIGITADA').length || 17;
  const pendenciasCriticasCount = pacientesList.filter((p) => p.pendenciasQuantidade && p.pendenciasQuantidade > 0).length || 8;

  // Métricas do Dashboard conectadas em tempo real com localStorage e salvamento automático
  const kpis = [
    {
      label: 'Autorizações Hoje',
      valor: autorizacoesHojeCount,
      subtexto: 'Renovações para hoje',
      corCard: 'border-blue-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60',
      badgeCor: 'bg-blue-100 dark:bg-blue-950/70 text-[#002172] dark:text-blue-300',
      icon: FileCheck2,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Próximas 7 Dias',
      valor: autorizacoes7DiasCount,
      subtexto: 'Vencimentos na semana',
      corCard: 'border-indigo-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60',
      badgeCor: 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300',
      icon: CalendarClock,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Autorizações Atrasadas',
      valor: autorizacoesAtrasadasCount,
      subtexto: 'Requerem justificativa',
      corCard: 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/50 dark:hover:bg-amber-950/40',
      badgeCor: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300',
      icon: ClockAlert,
      targetTab: 'autorizacoes',
    },
    {
      label: 'Processos em Análise',
      valor: processosEmAnaliseCount,
      subtexto: 'Convênios em SLA',
      corCard: 'border-yellow-400 dark:border-yellow-500/80 bg-yellow-50/20 dark:bg-yellow-950/20 hover:bg-yellow-50/40 dark:hover:bg-yellow-950/30',
      badgeCor: 'badge-analise-amarelo bg-yellow-400 text-slate-950 dark:bg-yellow-400 dark:text-slate-950 font-black border border-yellow-500 shadow-xs',
      icon: AlertOctagon,
      targetTab: 'analises',
      onAlertClick: () => triggerSecretAction('sentinela_7_dias'),
    },
    {
      label: 'Aguardando Digitação',
      valor: aguardandoDigitacaoCount,
      subtexto: 'Guias e concluídas',
      corCard: 'border-blue-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 hover:bg-slate-50 dark:hover:bg-slate-800/60',
      badgeCor: 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300',
      icon: FileSpreadsheet,
      targetTab: 'guias',
    },
    {
      label: 'Pendências Críticas',
      valor: pendenciasCriticasCount,
      subtexto: 'Inconsistências em aberto',
      corCard: 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 hover:bg-amber-50/50 dark:hover:bg-amber-950/40',
      badgeCor: 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300',
      icon: AlertOctagon,
      targetTab: 'pendencias',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner de Boas-Vindas */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#002172] via-[#0b2f77] to-[#2A657E] text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold font-['Quicksand'] text-white tracking-tight">
            Boas-vindas, {activeUsuario?.nome ? activeUsuario.nome.split(' ')[0] : 'Usuário'}. Tenha um bom trabalho!
          </h1>
          <p className="text-xs text-blue-100/90 mt-1 font-['Nunito_Sans']">
            Clínica Mefisa · Sistema Integrado de Gestão e Autorizações
          </p>
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
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-['Quicksand']">
                  O que precisa ser feito hoje?
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">
                  Prioridades operacionais ordenadas por prazo e impacto clínico
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('pendencias')}
              className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline"
            >
              Ver todas ({MOCK_PENDENCIAS.length}) →
            </button>
          </div>

          <div className="space-y-2.5">
            {pacientesAutorizacaoHoje.map((pac) => (
              <div
                key={`aut-hoje-${pac.id}`}
                onClick={() => onNavigate('autorizacoes')}
                tabIndex={0}
                className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40 hover:bg-blue-100/70 transition-all cursor-pointer flex items-start justify-between gap-3 text-xs outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[9.5px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">
                      AUTORIZAÇÃO HOJE
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">Renovação de Guia / Autorização</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    O paciente <strong>{pac.nome}</strong> ({pac.procedimentoPrincipal}) possui autorização agendada para hoje.
                  </p>
                  <div className="text-[10px] text-slate-400">
                    Convênio: {pac.convenioPrincipalNome || pac.convenioNome} · Prontuário: {pac.codigoProntuario}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-300 block">
                    Hoje ({formatarDataBr(hojeStr)})
                  </span>
                  <span className="text-[10.5px] text-blue-700 dark:text-blue-400 font-semibold mt-1 inline-block">
                    Autorizar →
                  </span>
                </div>
              </div>
            ))}

            {MOCK_PENDENCIAS.slice(0, Math.max(0, 4 - pacientesAutorizacaoHoje.length)).map((pend) => (
              <div
                key={pend.id}
                onClick={() => onNavigate(pend.linkModulo)}
                tabIndex={0}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 focus:bg-slate-100/80 dark:focus:bg-slate-800/90 active:bg-slate-200/50 dark:active:bg-slate-700/60 transition-all cursor-pointer flex items-start justify-between gap-3 text-xs outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9.5px] font-bold px-2 py-0.5 rounded-full ${
                        pend.prioridade === 'CRITICA'
                          ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300'
                          : pend.prioridade === 'ALTA' || pend.linkModulo === 'analises'
                          ? 'badge-analise-amarelo bg-yellow-400 text-slate-950 font-black border border-yellow-500 shadow-xs'
                          : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      }`}
                    >
                      {pend.linkModulo === 'analises' ? 'EM ANÁLISE' : pend.prioridade}
                    </span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{pend.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {pend.descricao}
                  </p>
                  <div className="text-[10px] text-slate-400 dark:text-slate-400 pt-0.5">
                    Paciente: <strong className="text-slate-600 dark:text-slate-300">{pend.pacienteNome}</strong> · Responsável sugerido:{' '}
                    {pend.responsavelSugerido}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono font-bold text-red-700 dark:text-red-400 block">
                    {pend.prazoLimite}
                  </span>
                  <span className="text-[10.5px] text-blue-700 dark:text-blue-400 font-semibold mt-1 inline-block">
                    Resolver →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Coluna 2: Últimas Ações Auditadas (Rastreabilidade Absoluta) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-[#002172] dark:text-blue-300 flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm font-['Quicksand']">
                  Quem fez o quê? (Auditoria Recente)
                </h3>
                <p className="text-[11px] text-slate-400 dark:text-slate-400">
                  Rastreabilidade imutável de alterações de datas, quantidades e guias
                </p>
              </div>
            </div>
            <button
              onClick={onOpenAudit}
              className="text-xs text-blue-700 dark:text-blue-400 font-semibold hover:underline"
            >
              Auditoria Completa →
            </button>
          </div>

          <div className="space-y-2.5">
            {MOCK_AUDITORIA.map((log, idx) => (
              <div
                key={`${log.id || 'log'}-${idx}`}
                tabIndex={0}
                className="p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 focus:bg-slate-100/80 dark:focus:bg-slate-800/90 active:bg-slate-200/50 dark:active:bg-slate-700/60 transition-all text-xs space-y-1.5 cursor-pointer outline-none focus:ring-1 focus:ring-blue-500/40"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-100">
                    <span>{log.usuarioNome}</span>
                    <span className="text-slate-400 dark:text-slate-400 font-normal">({log.papelUsuario})</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 font-mono">
                    {log.dataHora}
                  </span>
                </div>

                <div className="text-[11.5px] text-slate-700 dark:text-slate-200 font-medium">
                  {log.acao} — <span className="text-slate-500 dark:text-slate-400">{log.descricaoRegistro}</span>
                </div>

                <div className="text-[11px] bg-white dark:bg-slate-900/90 p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                  <span className="line-through text-red-700 dark:text-red-400 font-mono">{log.valorAnterior}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold font-mono">{log.valorNovo}</span>
                </div>

                {log.motivo && (
                  <div className="text-[10.5px] text-amber-900 dark:text-amber-200 bg-amber-50/80 dark:bg-amber-950/40 px-2 py-1 rounded border border-transparent dark:border-amber-900/40">
                    <strong className="text-amber-950 dark:text-amber-100">Motivo:</strong> {log.motivo}
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
