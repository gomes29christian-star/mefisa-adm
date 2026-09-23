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
} from 'lucide-react';
import { calcularSessoesPeriodo, calcularProximaAutorizacaoESessoes } from '../../services/businessRules';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface CalculationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmCalculation?: (resultado: any) => void;
}

export const CalculationPreviewModal: React.FC<CalculationPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirmCalculation,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  // Estados dos inputs para o cálculo de autorização
  const [sessoesSemana, setSessoesSemana] = useState<number>(3);
  const [dataInicio, setDataInicio] = useState<string>('2026-11-01');
  const [dataFim, setDataFim] = useState<string>('2026-11-30');
  const [tamanhoMb, setTamanhoMb] = useState<number>(2.4);
  const [overrideQuantidade, setOverrideQuantidade] = useState<number | null>(null);
  const [copiedJustificativa, setCopiedJustificativa] = useState<boolean>(false);

  if (!isOpen) return null;

  const resultadoCalculo = calcularSessoesPeriodo(sessoesSemana, dataInicio, dataFim, tamanhoMb);
  const quantidadeEfetiva = overrideQuantidade !== null ? overrideQuantidade : resultadoCalculo.quantidadeTotalSugerida;

  const cronogramaDatas = calcularProximaAutorizacaoESessoes(dataInicio, quantidadeEfetiva, 7);

  const handleCopyJustificativa = () => {
    navigator.clipboard.writeText(resultadoCalculo.justificativaFormularioGerada);
    setCopiedJustificativa(true);
    setTimeout(() => setCopiedJustificativa(false), 2000);
  };

  const handleConfirm = () => {
    // Dispara conquista secreta se o cofre estiver ativo
    triggerSecretAction('mestre_semanas');

    if (onConfirmCalculation) {
      onConfirmCalculation({
        ...resultadoCalculo,
        quantidadeConfirmada: quantidadeEfetiva,
        cronograma: cronogramaDatas,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#002172] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Calculator className="w-5 h-5 text-[#91CA0C]" />
            </div>
            <div>
              <h3 className="font-['Quicksand'] font-bold text-base text-white">
                Motor de Cálculo Transparente de Sessões
              </h3>
              <p className="text-xs text-blue-100/80">
                Auditoria de cálculo antes de submeter ao convênio (SulAmérica / Unimed / Bradesco)
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Parâmetros de Entrada */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="font-bold text-slate-800 text-xs flex items-center justify-between">
              <span>1. Parâmetros de Entrada do Formulário</span>
              <span className="text-[10px] text-slate-400 font-normal">Fórmula Auditável</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                  Data Início Período:
                </label>
                <input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => {
                    setDataInicio(e.target.value);
                    setOverrideQuantidade(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-[#002172]"
                />
              </div>

              <div>
                <label className="block text-slate-500 font-medium mb-1">
                  Data Fim Período:
                </label>
                <input
                  type="date"
                  value={dataFim}
                  onChange={(e) => {
                    setDataFim(e.target.value);
                    setOverrideQuantidade(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-800 focus:outline-[#002172]"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Tamanho do arquivo de formulário:</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={tamanhoMb}
                  onChange={(e) => setTamanhoMb(Number(e.target.value))}
                  className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-right font-mono"
                />
                <span className="font-semibold text-slate-600">MB</span>
                {resultadoCalculo.formularioTamanhoValido ? (
                  <span className="text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">
                    &lt; 10 MB (Válido)
                  </span>
                ) : (
                  <span className="text-red-700 bg-red-100 px-2 py-0.5 rounded text-[10px] font-bold">
                    Excede 10 MB!
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Demonstração Matemática do Cálculo */}
          <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/70 space-y-2">
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#002172]">
              2. Demonstração de Cálculo (Não Escondemos a Lógica)
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
              <div className="p-2.5 bg-white rounded-xl border border-blue-100">
                <div className="text-[10px] text-slate-400">Sessões / Semana</div>
                <div className="font-extrabold text-base text-slate-900 font-mono">
                  {sessoesSemana}
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100">
                <div className="text-[10px] text-slate-400">Semanas Calculadas</div>
                <div className="font-extrabold text-base text-slate-900 font-mono">
                  {resultadoCalculo.semanasConsideradas}
                </div>
              </div>
              <div className="p-2.5 bg-white rounded-xl border border-blue-100">
                <div className="text-[10px] text-slate-400">Fórmula Aplicada</div>
                <div className="font-bold text-xs text-[#002172] font-mono mt-1">
                  {sessoesSemana} × {resultadoCalculo.semanasConsideradas}
                </div>
              </div>
              <div className="p-2.5 bg-[#002172] text-white rounded-xl">
                <div className="text-[10px] text-blue-200">Total Sugerido</div>
                <div className="font-extrabold text-base text-[#91CA0C] font-mono">
                  {resultadoCalculo.quantidadeTotalSugerida} sessões
                </div>
              </div>
            </div>

            {/* Ajuste Manual Opcional */}
            <div className="pt-2 flex items-center justify-between text-xs">
              <span className="text-slate-600">Necessita ajuste manual justificado?</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Editar total"
                  value={overrideQuantidade ?? ''}
                  onChange={(e) =>
                    setOverrideQuantidade(e.target.value ? Number(e.target.value) : null)
                  }
                  className="w-24 px-2 py-1 bg-white border border-slate-300 rounded-lg text-center font-bold"
                />
                {overrideQuantidade !== null && (
                  <button
                    onClick={() => setOverrideQuantidade(null)}
                    className="text-[10px] text-blue-700 underline"
                  >
                    Restaurar fórmula
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Justificativa Automática para o Portal */}
          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Justificativa Padrão Gerada para o Portal
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
              "{resultadoCalculo.justificativaFormularioGerada}"
            </p>
          </div>

          {/* Regra Especial Mefisa da Próxima Autorização */}
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 space-y-2">
            <div className="font-bold text-emerald-950 text-xs flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-700" />
              Regra da Próxima Autorização Mefisa
            </div>
            <p className="text-[11px] text-slate-600 leading-normal">
              {cronogramaDatas.regraAplicada}
            </p>
            <div className="p-2.5 bg-white rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Data Próxima Autorização:</span>
                <span className="font-bold text-emerald-800 text-sm font-mono">
                  {cronogramaDatas.dataProximaAutorizacaoSugerida}
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-300" />
              <div>
                <span className="text-slate-400 block text-[10px]">Última Sessão Registrada:</span>
                <span className="font-bold text-slate-700 text-sm font-mono">
                  {cronogramaDatas.dataUltimaSessao}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-[#002172] hover:bg-[#001752] text-white flex items-center gap-2 shadow-sm transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-[#91CA0C]" />
            <span>Confirmar e Registrar ({quantidadeEfetiva} sessões)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
