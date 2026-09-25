import React, { useState } from 'react';
import {
  X,
  Calculator,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Copy,
  Check,
  ArrowRight,
  Clock,
  ShieldAlert,
  Send,
  Building,
  RotateCcw,
  Lock,
} from 'lucide-react';
import {
  calcularSessoesPeriodo,
  calcularAlinhamentoProximaAutorizacao,
  gerarCronogramaComAuditoriaFeriados,
  validarRemarcacaoSessao,
  gerarNotificacaoAnomaliaGestao,
  identificarDiaSemana,
  formatarDiaSemanaPt,
  DIAS_SEMANA_NOMES,
  formatarDataBr,
} from '../../services/businessRules';
import { DiaSemanaIndice, ConflitoFeriadoSessao, ModoAbatimentoFaltas } from '../../types/clinic';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface CalculationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCalculation?: (resultado: any) => void;
  usuarioAtualNome?: string;
  usuarioAtualPapel?: string;
}

export const CalculationPreviewModal: React.FC<CalculationPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmCalculation,
  usuarioAtualNome = 'Maria Clara Fonseca',
  usuarioAtualPapel = 'FUNCIONARIO_ADMINISTRATIVO',
}) => {
  const { getThemeStrokeStyle, showMonthInitials } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  // Estados dos inputs para o cálculo de autorização
  const [pacienteNome, setPacienteNome] = useState<string>('Maurício Rezende Filho');
  const [procedimentoNome, setProcedimentoNome] = useState<string>('Psicoterapia ABA / TCC Adulto');
  const [diaSemanaHabitual, setDiaSemanaHabitual] = useState<DiaSemanaIndice>(4); // 4 = Quinta-feira (exemplo do prompt)
  const [sessoesSemana, setSessoesSemana] = useState<number>(3);
  const [dataInicio, setDataInicio] = useState<string>('2026-10-01');
  const [dataCorteReferencia, setDataCorteReferencia] = useState<string>('2026-10-30'); // 30/10/2026 = Sexta-feira
  const [opcaoSabado, setOpcaoSabado] = useState<'SEXTA_FEIRA_ANTERIOR' | 'SEGUNDA_FEIRA_SEGUINTE'>('SEXTA_FEIRA_ANTERIOR');
  const [tamanhoMb, setTamanhoMb] = useState<number>(2.4);
  const [overrideQuantidade, setOverrideQuantidade] = useState<number | null>(null);
  const [copiedJustificativa, setCopiedJustificativa] = useState<boolean>(false);

  // Estados para senha e validade (para ir para a aba lateral)
  const [senhaInput, setSenhaInput] = useState<string>('SENHA-' + Math.floor(1000 + Math.random() * 9000));
  const [validadeSenhaInput, setValidadeSenhaInput] = useState<string>('2026-11-28');

  // REGRA 02 CONFIRMADA: Decisão do Usuário sobre Faltas Justificadas no Ciclo
  const [temFaltasJustificadas, setTemFaltasJustificadas] = useState<boolean>(false);
  const [quantidadeFaltas, setQuantidadeFaltas] = useState<number>(1);
  const [modoFaltas, setModoFaltas] = useState<ModoAbatimentoFaltas>('DESCONTAR_PROXIMA_AUTORIZACAO');
  const [motivoFaltas, setMotivoFaltas] = useState<string>('Atestado médico da criança');

  // Remanejamento interativo de sessão em conflito ou teste de anomalia
  const [sessaoSendoRemarcada, setSessaoSendoRemarcada] = useState<{
    numero: number;
    dataOriginal: string;
    conflito?: ConflitoFeriadoSessao;
  } | null>(null);
  const [novaDataInput, setNovaDataInput] = useState<string>('');
  const [modalAnomaliaAberto, setModalAnomaliaAberto] = useState<boolean>(false);
  const [diasDiferencaAnomalia, setDiasDiferencaAnomalia] = useState<number>(0);
  const [justificativaAnomalia, setJustificativaAnomalia] = useState<string>('');
  const [notificacaoEnviadaSucesso, setNotificacaoEnviadaSucesso] = useState<string | null>(null);

  // Mapeamento de substituição manual de datas no cronograma
  const [datasCustomizadas, setDatasCustomizadas] = useState<Record<number, string>>({});

  if (!isOpen) return null;

  // Executa o motor central de alinhamento com a REGRA 1
  const alinhamento = calcularAlinhamentoProximaAutorizacao({
    diaSemanaHabitual,
    dataInicioCicloStr: dataInicio,
    sessoesPorSemana: sessoesSemana,
    dataReferenciaCorteStr: dataCorteReferencia,
    opcaoSabadoEscolhida: opcaoSabado,
  });

  const resultadoFormulario = calcularSessoesPeriodo(
    sessoesSemana,
    dataInicio,
    alinhamento.dataProximaAutorizacaoCalculada,
    tamanhoMb,
    temFaltasJustificadas
      ? {
          modoAbatimento: modoFaltas,
          quantidadeFaltasJustificadas: quantidadeFaltas,
          motivoFaltas,
        }
      : undefined
  );

  const quantidadeEfetiva =
    overrideQuantidade !== null
      ? overrideQuantidade
      : resultadoFormulario.quantidadeTotalSugerida;

  // Cronograma com auditoria de feriados em Ferraz de Vasconcelos
  const cronograma = gerarCronogramaComAuditoriaFeriados(
    dataInicio,
    Math.min(quantidadeEfetiva, 12),
    diaSemanaHabitual
  );

  const handleCopyJustificativa = () => {
    navigator.clipboard.writeText(resultadoFormulario.justificativaFormularioGerada);
    setCopiedJustificativa(true);
    setTimeout(() => setCopiedJustificativa(false), 2000);
  };

  const handleIniciarRemarcacao = (sessao: { numero: number; data: string; conflito?: ConflitoFeriadoSessao }) => {
    const dataAlvoSugerida = sessao.conflito?.novaDataSugerida || sessao.data;
    setSessaoSendoRemarcada({
      numero: sessao.numero,
      dataOriginal: sessao.data,
      conflito: sessao.conflito,
    });
    setNovaDataInput(dataAlvoSugerida);
  };

  const handleConfirmarNovaDataSessao = () => {
    if (!sessaoSendoRemarcada || !novaDataInput) return;

    // PROTEÇÃO CONTRA REMARCAÇÕES ANORMAIS
    const validacao = validarRemarcacaoSessao(
      sessaoSendoRemarcada.dataOriginal,
      novaDataInput,
      20 // limiar para acionar alerta (~30 dias)
    );

    if (validacao.ehAnomalia) {
      setDiasDiferencaAnomalia(validacao.diasDiferenca);
      setModalAnomaliaAberto(true);
      return;
    }

    // Remanejamento normal
    aplicarRemarcacaoFinal(sessaoSendoRemarcada.numero, novaDataInput, 'Remanejamento normal pelo operador');
  };

  const handleConfirmarAnomaliaComGestao = () => {
    if (!sessaoSendoRemarcada) return;
    if (!justificativaAnomalia.trim()) {
      alert('Por favor, informe a justificativa/razão da confirmação desta remarcação.');
      return;
    }

    // 1. Despacha notificação formal para ADM CHEFE e CEO
    const notif = gerarNotificacaoAnomaliaGestao({
      pacienteNome,
      procedimentoNome,
      dataOriginal: sessaoSendoRemarcada.dataOriginal,
      novaData: novaDataInput,
      diasDiferenca: diasDiferencaAnomalia,
      usuarioNome: usuarioAtualNome,
      usuarioPapel: usuarioAtualPapel,
      motivoConfirmado: justificativaAnomalia,
    });

    setNotificacaoEnviadaSucesso(
      `Notificação formal #${notif.id.substring(0, 12)} transmitida com sucesso ao ADM CHEFE (Dr. Roberto Mefisa) e à CEO (Dra. Camila Rocha).`
    );

    // 2. Aplica a nova data
    aplicarRemarcacaoFinal(sessaoSendoRemarcada.numero, novaDataInput, justificativaAnomalia);
    setModalAnomaliaAberto(false);
    setJustificativaAnomalia('');
  };

  const aplicarRemarcacaoFinal = (numeroSessao: number, novaData: string, motivo: string) => {
    setDatasCustomizadas((prev) => ({
      ...prev,
      [numeroSessao]: novaData,
    }));
    setSessaoSendoRemarcada(null);
  };

  const handleConfirm = () => {
    triggerSecretAction('mestre_semanas');

    if (onConfirmCalculation) {
      onConfirmCalculation({
        ...resultadoFormulario,
        quantidadeConfirmada: quantidadeEfetiva,
        pacienteNome,
        procedimentoNome,
        alinhamento,
        cronograma,
        datasCustomizadas,
        senha: senhaInput,
        dataValidadeSenha: validadeSenhaInput,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-[#002172] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#91CA0C]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-['Quicksand'] font-bold text-base text-white">
                  Motor de Regras de Negócio & Cálculo Transparente
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#91CA0C] text-[#002172]">
                  Regras 1, 2 e 3 Validadas
                </span>
              </div>
              <p className="text-xs text-blue-100/80">
                Alinhamento ao dia real de atendimento, exceção de sábado, feriados de Ferraz de Vasconcelos e proteção contra anomalias.
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

        {/* Notificação de Sucesso de Anomalia */}
        {notificacaoEnviadaSucesso && (
          <div className="bg-amber-100 border-b border-amber-200 px-5 py-2.5 flex items-center justify-between text-xs text-amber-950 font-medium">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{notificacaoEnviadaSucesso}</span>
            </div>
            <button
              onClick={() => setNotificacaoEnviadaSucesso(null)}
              className="text-amber-800 hover:text-black font-bold text-[10px] underline"
            >
              Fechar
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Seção Nova: Registro da Senha da Autorização e Validade (Para a Aba Lateral) */}
          <div className="bg-blue-50/80 p-4 rounded-2xl border border-blue-200/90 space-y-3">
            <div className="font-bold text-blue-950 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#002172]" />
                Registro da Senha da Autorização & Validade (Dados para a Aba Lateral)
              </span>
              <span className="text-[10px] text-blue-900 font-semibold bg-blue-200 px-2 py-0.5 rounded-md">
                Obrigatório para Aba Lateral
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Senha da Autorização:
                </label>
                <input
                  type="text"
                  value={senhaInput}
                  onChange={(e) => setSenhaInput(e.target.value)}
                  placeholder="Ex: SENHA-9921"
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-mono font-bold text-slate-800 focus:outline-[#002172]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Chave informada pelo convênio
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Validade da Senha:
                </label>
                <input
                  type="date"
                  value={validadeSenhaInput}
                  onChange={(e) => setValidadeSenhaInput(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl font-medium text-slate-800 focus:outline-[#002172]"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Data limite de validade no portal
                </span>
              </div>
            </div>
          </div>

          {/* Seção 1: Parâmetros do Paciente e Dia Habitual de Atendimento */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#002172]" />
                1. Alinhamento ao Dia Real de Atendimento (REGRA 1)
              </span>
              <span className="text-[10px] text-[#002172] font-semibold bg-blue-100 px-2 py-0.5 rounded-md">
                Competência: {alinhamento.mesCompetenciaReferencia}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Dia Habitual de Atendimento:
                </label>
                <select
                  value={diaSemanaHabitual}
                  onChange={(e) => setDiaSemanaHabitual(Number(e.target.value) as DiaSemanaIndice)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-[#002172] focus:outline-[#002172]"
                >
                  <option value={1}>Segunda-feira</option>
                  <option value={2}>Terça-feira</option>
                  <option value={3}>Quarta-feira</option>
                  <option value={4}>Quinta-feira (Padrão)</option>
                  <option value={5}>Sexta-feira</option>
                  <option value={6}>Sábado (Gera Exceção Administrativa)</option>
                </select>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dia em que o paciente comparece
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Início do Ciclo:
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-[#002172] font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dia da semana: {formatarDiaSemanaPt(identificarDiaSemana(dataInicio))}
                </span>
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Referência Inicial de Corte:
                </label>
                <input
                  type="date"
                  value={dataCorteReferencia}
                  onChange={(e) => setDataCorteReferencia(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-[#002172] font-medium"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Dia da semana: {formatarDiaSemanaPt(identificarDiaSemana(dataCorteReferencia))}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Sessões por Semana:
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={sessoesSemana}
                  onChange={(e) => {
                    setSessoesSemana(Number(e.target.value));
                    setOverrideQuantidade(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 focus:outline-[#002172]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Tamanho Formulário (Limite 10 MB):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.1"
                    value={tamanhoMb}
                    onChange={(e) => setTamanhoMb(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 font-mono"
                  />
                  <span className="text-xs font-bold text-slate-500">MB</span>
                  {resultadoFormulario.formularioTamanhoValido ? (
                    <span className="text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap">
                      ✓ OK &lt;10 MB
                    </span>
                  ) : (
                    <span className="text-red-700 bg-red-100 px-2.5 py-1 rounded-xl text-[10px] font-bold whitespace-nowrap">
                      ⚠️ Excede 10 MB
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* REGRA 02 CONFIRMADA: Decisão do Usuário sobre Faltas Justificadas no Ciclo */}
            <div className="mt-3 p-3.5 rounded-xl bg-purple-50/70 border border-purple-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 font-bold text-xs text-purple-950 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={temFaltasJustificadas}
                    onChange={(e) => setTemFaltasJustificadas(e.target.checked)}
                    className="w-4 h-4 rounded text-purple-700 focus:ring-purple-500"
                  />
                  <span>Considerar Faltas Justificadas no Ciclo Atual (REGRA 02: Decisão do Usuário)</span>
                </label>
                <span className="text-[10px] bg-purple-200/80 text-purple-900 font-bold px-2 py-0.5 rounded-md">
                  Opcional / Decisão do Usuário
                </span>
              </div>

              {temFaltasJustificadas && (
                <div className="space-y-3 pt-2 border-t border-purple-200/60 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        Quantidade de Faltas Justificadas:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={quantidadeFaltas}
                        onChange={(e) => setQuantidadeFaltas(Math.max(1, Number(e.target.value)))}
                        className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-950"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-purple-900 mb-1">
                        Motivo da(s) Falta(s):
                      </label>
                      <input
                        type="text"
                        value={motivoFaltas}
                        onChange={(e) => setMotivoFaltas(e.target.value)}
                        placeholder="Ex: Atestado médico de saúde da criança"
                        className="w-full px-3 py-1.5 bg-white border border-purple-300 rounded-xl text-xs text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-purple-900 mb-1.5">
                      Como o sistema deve processar estas faltas?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setModoFaltas('DESCONTAR_PROXIMA_AUTORIZACAO')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          modoFaltas === 'DESCONTAR_PROXIMA_AUTORIZACAO'
                            ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                            : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        <div className="font-bold text-[11px]">
                          1. Descontar da Próxima Autorização
                        </div>
                        <div className={`text-[10px] mt-0.5 ${modoFaltas === 'DESCONTAR_PROXIMA_AUTORIZACAO' ? 'text-purple-200' : 'text-slate-500'}`}>
                          Abate as {quantidadeFaltas} falta(s) da quantidade total solicitada no portal.
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setModoFaltas('MANTER_INTEGRAL_REPOSICAO_PRONTUARIO')}
                        className={`p-2.5 rounded-xl border text-left transition-all ${
                          modoFaltas === 'MANTER_INTEGRAL_REPOSICAO_PRONTUARIO'
                            ? 'bg-purple-900 text-white border-purple-900 shadow-xs'
                            : 'bg-white text-slate-700 border-purple-200 hover:bg-purple-50'
                        }`}
                      >
                        <div className="font-bold text-[11px]">
                          2. Manter Quantidade Integral
                        </div>
                        <div className={`text-[10px] mt-0.5 ${modoFaltas === 'MANTER_INTEGRAL_REPOSICAO_PRONTUARIO' ? 'text-purple-200' : 'text-slate-500'}`}>
                          Solicita quantidade integral do laudo. Reposição clínica controlada em prontuário.
                        </div>
                      </button>
                    </div>
                  </div>

                  {resultadoFormulario.observacaoFaltasAuditoria && (
                    <div className="p-2 rounded-lg bg-white border border-purple-200 text-[10px] text-purple-950 font-mono">
                      ✓ Auditoria: {resultadoFormulario.observacaoFaltasAuditoria}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resultado do Alinhamento da Próxima Autorização */}
          <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#002172] text-xs flex items-center gap-1.5 uppercase tracking-wide">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Cálculo de Alinhamento da Próxima Autorização
              </span>
              <span className="text-[10px] font-mono font-bold bg-[#002172] text-white px-2 py-0.5 rounded-full">
                {alinhamento.semanasCicloCalculadas} semanas no ciclo
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3.5 rounded-xl border border-blue-100">
              <div>
                <span className="text-[10px] text-slate-400 block">Data Inicial Encontrada:</span>
                <span className="font-bold text-slate-700 text-xs">
                  {formatarDiaSemanaPt(identificarDiaSemana(alinhamento.dataReferenciaInicialCorte))},{' '}
                  {formatarDataBr(alinhamento.dataReferenciaInicialCorte, showMonthInitials)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Data Ajustada Alinhada:</span>
                <span className="font-extrabold text-[#002172] text-sm">
                  {formatarDiaSemanaPt(identificarDiaSemana(alinhamento.dataProximaAutorizacaoCalculada))},{' '}
                  {formatarDataBr(alinhamento.dataProximaAutorizacaoCalculada, showMonthInitials)}
                </span>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block">Total de Sessões no Ciclo:</span>
                <span className="font-extrabold text-[#91CA0C] text-sm bg-slate-900 px-2 py-0.5 rounded-md inline-block">
                  {quantidadeEfetiva} sessões autorizadas
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-blue-100/60">
              <strong>Regra de Negócio:</strong> {alinhamento.regraDescritiva}
              {alinhamento.adicionouOcorrenciaSemanal && (
                <span className="text-emerald-800 font-bold block mt-1">
                  ✓ Considerada mais uma ocorrência semanal no ciclo para garantir a integridade do tratamento.
                </span>
              )}
            </p>
          </div>

          {/* ALERTA ESPECIAL — EXCEÇÃO DE SÁBADO */}
          {alinhamento.excecaoSabado.detectada && (
            <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 space-y-3 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                <h4 className="font-bold text-amber-950 text-xs">
                  REGRA ESPECIAL DE SÁBADO — Sem Expediente Administrativo
                </h4>
              </div>

              <p className="text-xs text-amber-900 leading-relaxed">
                Esta autorização caiu em um <strong>sábado ({formatarDataBr(alinhamento.excecaoSabado.dataSabadoOriginal, showMonthInitials)})</strong>, quando não há operação administrativa de digitação/autorização na Clínica Mefisa.
              </p>

              <div className="p-3 bg-white rounded-xl border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] text-slate-500">Nova data sugerida pelo sistema:</div>
                  <div className="font-bold text-sm text-slate-900">
                    Sexta-feira, {formatarDataBr(alinhamento.excecaoSabado.dataSugeridaDeslocamento, showMonthInitials)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOpcaoSabado('SEXTA_FEIRA_ANTERIOR')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      opcaoSabado === 'SEXTA_FEIRA_ANTERIOR'
                        ? 'bg-[#002172] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    [ACEITAR SEXTA-FEIRA]
                  </button>

                  <button
                    onClick={() => setOpcaoSabado('SEGUNDA_FEIRA_SEGUINTE')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      opcaoSabado === 'SEGUNDA_FEIRA_SEGUINTE'
                        ? 'bg-[#002172] text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    [ESCOLHER OUTRO DIA]
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Cronograma de Sessões com Auditoria de Feriados (Ferraz de Vasconcelos) */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-700" />
                  Cronograma de Sessões & Monitor de Feriados (Ferraz de Vasconcelos)
                </h4>
                <p className="text-[10px] text-slate-500">
                  Verificação contra o calendário oficial de feriados nacionais, estaduais e municipais de Ferraz de Vasconcelos.
                </p>
              </div>

              {cronograma.totalConflitos > 0 ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800 animate-pulse">
                  ⚠️ {cronograma.totalConflitos} Feriado(s) em Ferraz Detectado(s)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  ✓ Sem conflitos de feriados
                </span>
              )}
            </div>

            {/* Grid de Sessões */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {cronograma.sessoes.map((s) => {
                const dataEfetiva = datasCustomizadas[s.numero] || s.data;
                const foiRemarcada = !!datasCustomizadas[s.numero];

                return (
                  <div
                    key={s.numero}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                      s.temConflitoFeriado && !foiRemarcada
                        ? 'bg-red-50/60 border-red-300 text-red-950'
                        : foiRemarcada
                        ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] text-slate-500">
                          Sessão #{s.numero}
                        </span>
                        {s.temConflitoFeriado && !foiRemarcada && (
                          <span className="text-[9px] font-bold bg-red-200 text-red-900 px-1.5 py-0.2 rounded">
                            FERIADO
                          </span>
                        )}
                        {foiRemarcada && (
                          <span className="text-[9px] font-bold bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded">
                            REMANEJADA
                          </span>
                        )}
                      </div>

                      <div className="font-extrabold text-xs mt-1">
                        {formatarDataBr(dataEfetiva, showMonthInitials)} ({formatarDiaSemanaPt(identificarDiaSemana(dataEfetiva))})
                      </div>

                      {s.temConflitoFeriado && !foiRemarcada && s.conflito && (
                        <div className="mt-1 text-[10px] text-red-700 font-medium">
                          {s.conflito.feriado.nome} ({s.conflito.feriado.tipo})
                        </div>
                      )}
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                      <button
                        onClick={() => handleIniciarRemarcacao(s)}
                        className="text-[10px] font-bold text-blue-700 hover:text-blue-900 underline"
                      >
                        {s.temConflitoFeriado ? 'Remanejar Sessão' : 'Alterar / Testar Remarcação'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Painel de Remanejamento Ativo de Sessão */}
          {sessaoSendoRemarcada && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-950 text-xs flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-amber-700" />
                  Remanejamento da Sessão #{sessaoSendoRemarcada.numero} (Original: {sessaoSendoRemarcada.dataOriginal})
                </span>
                <button
                  onClick={() => setSessaoSendoRemarcada(null)}
                  className="text-amber-800 hover:text-black text-xs font-bold"
                >
                  ✕ Cancelar
                </button>
              </div>

              {sessaoSendoRemarcada.conflito && (
                <div className="text-[11px] text-amber-900 bg-white p-2.5 rounded-xl border border-amber-200 space-y-1">
                  <div className="font-bold text-red-700">
                    ⚠️ {sessaoSendoRemarcada.conflito.motivoConflito}
                  </div>
                  <div>
                    <strong>Impacto no Cronograma:</strong> {sessaoSendoRemarcada.conflito.impactoCronograma}
                  </div>
                  <div>
                    <strong>Impacto na Próxima Autorização:</strong> {sessaoSendoRemarcada.conflito.impactoProximaAutorizacao}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="flex-1 w-full">
                  <label className="block text-slate-600 font-medium text-[11px] mb-1">
                    Nova data para esta sessão:
                  </label>
                  <input
                    type="date"
                    value={novaDataInput}
                    onChange={(e) => setNovaDataInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                  />
                </div>

                <div className="flex items-end gap-2 pt-4 sm:pt-0 w-full sm:w-auto">
                  <button
                    onClick={handleConfirmarNovaDataSessao}
                    className="w-full sm:w-auto px-4 py-2 bg-[#002172] text-white rounded-xl font-bold hover:bg-[#001752] transition-colors"
                  >
                    Validar e Salvar Remanejamento
                  </button>

                  {/* Atalho para testar Proteção de Anomalia de 30 dias */}
                  <button
                    onClick={() => {
                      const d = new Date(sessaoSendoRemarcada.dataOriginal);
                      d.setDate(d.getDate() + 30);
                      const iso30 = d.toISOString().split('T')[0];
                      setNovaDataInput(iso30);
                    }}
                    className="text-[10px] text-amber-800 hover:underline px-2 py-1 bg-amber-100 rounded-lg whitespace-nowrap"
                    title="Simula erro de digitação colocando a sessão 30 dias depois"
                  >
                    Simular +30 dias (Anomalia)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Justificativa Automática para o Portal */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Justificativa Padrão Gerada para o Portal do Convênio
              </span>
              <button
                onClick={handleCopyJustificativa}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 text-[11px] font-semibold transition-colors"
              >
                {copiedJustificativa ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 text-amber-700" />
                    <span>Copiar Justificativa</span>
                  </>
                )}
              </button>
            </div>
            <p className="p-2.5 bg-white rounded-xl text-slate-800 font-medium italic border border-amber-100">
              "{resultadoFormulario.justificativaFormularioGerada}"
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border dark:border-slate-700 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#002172] hover:bg-[#001752] text-white flex items-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-[#91CA0C]" />
            <span>Confirmar e Registrar ({quantidadeEfetiva} sessões alinhadas)</span>
          </button>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE ANOMALIA (PROTEÇÃO CONTRA ERRO DE DIGITAÇÃO) */}
      {modalAnomaliaAberto && sessaoSendoRemarcada && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border-2 border-red-500 dark:border-red-900 max-w-lg w-full p-6 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-['Quicksand'] font-bold text-base text-red-950 dark:text-red-200">
                  ⚠️ REMARCAÇÃO FORA DO INTERVALO ESPERADO
                </h3>
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                  Possível anomalia ou erro de digitação detectado pelo sistema
                </p>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 rounded-2xl border border-red-200 dark:border-red-900/60 text-xs text-red-950 dark:text-red-200 space-y-2">
              <p>
                A nova data está aproximadamente <strong>{diasDiferencaAnomalia} dias</strong> após a data original ({formatarDataBr(sessaoSendoRemarcada.dataOriginal, showMonthInitials)} &rarr; {formatarDataBr(novaDataInput, showMonthInitials)}).
              </p>
              <p className="font-bold">
                Isso pode indicar um erro de digitação. Deseja realmente confirmar?
              </p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-slate-700 dark:text-slate-200 font-bold">
                Justificativa / Razão Obrigatória da Confirmação:
              </label>
              <textarea
                rows={3}
                placeholder="Informe o motivo para a liberação da remarcação anormal (ex: afastamento médico do paciente, viagem ao exterior com atestado)..."
                value={justificativaAnomalia}
                onChange={(e) => setJustificativaAnomalia(e.target.value)}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-xs focus:outline-[#002172]"
              />
            </div>

            <div className="p-3 bg-slate-100 dark:bg-slate-950 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 space-y-1 border border-slate-200 dark:border-slate-800">
              <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Send className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                Despacho Imediato de Notificação:
              </div>
              <p>
                A confirmação registrará o evento na auditoria e enviará notificação formal instantânea para o <strong>ADM CHEFE</strong> e para a <strong>CEO</strong> com os dados completos do paciente, datas, usuário e motivo.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setModalAnomaliaAberto(false)}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border dark:border-slate-700"
              >
                [CANCELAR]
              </button>

              <button
                onClick={handleConfirmarAnomaliaComGestao}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-xs"
              >
                [CONFIRMAR REMARCAÇÃO]
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
