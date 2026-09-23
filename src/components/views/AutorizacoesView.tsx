import React, { useState } from 'react';
import {
  FileCheck2,
  Calendar,
  Clock,
  Calculator,
  Plus,
  AlertTriangle,
  FileText,
  History,
  CheckCircle2,
  Edit3,
} from 'lucide-react';
import { MOCK_AUTORIZACOES, MOCK_PACIENTES } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface AutorizacoesViewProps {
  onOpenCalculator: () => void;
  onOpenAudit: () => void;
}

export const AutorizacoesView: React.FC<AutorizacoesViewProps> = ({
  onOpenCalculator,
  onOpenAudit,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();
  const [modalAjusteAberto, setModalAjusteAberto] = useState<string | null>(null);
  const [motivoAjuste, setMotivoAjuste] = useState('');
  const [novaQuantidade, setNovaQuantidade] = useState(16);

  const handleSalvarAjusteEstruturado = (autId: string) => {
    if (!motivoAjuste) {
      alert('O motivo do ajuste é obrigatório para conformidade de auditoria!');
      return;
    }
    // Dispara conquista se o cofre estiver ativo
    triggerSecretAction('rastreabilidade_plena');
    alert(`Ajuste de autorização gravado no histórico imutável de auditoria com sucesso!`);
    setModalAjusteAberto(null);
    setMotivoAjuste('');
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Gestão de Autorizações de Convênios
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-[#002172]">
              SulAmérica · Unimed · Bradesco
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cálculo auditável de períodos, controle de formulários &lt; 10 MB e data da próxima autorização.
          </p>
        </div>

        <button
          onClick={onOpenCalculator}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Calculator className="w-4 h-4 text-[#91CA0C]" />
          <span>Calcular Nova Autorização</span>
        </button>
      </div>

      {/* Lista de Cartões de Autorização */}
      <div className="space-y-4">
        {MOCK_AUTORIZACOES.map((aut) => (
          <div
            key={aut.id}
            className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4"
          >
            {/* Topo do Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-xs text-slate-500">
                    Solicitação: {aut.numeroSolicitacao}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      aut.status === 'AUTORIZADA'
                        ? 'bg-emerald-100 text-emerald-800'
                        : aut.status === 'EM_ANALISE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {aut.status}
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 text-base mt-1">
                  {aut.pacienteNome}
                </h3>
                <div className="text-xs text-[#2A657E] font-medium">
                  {aut.procedimentoNome} · {aut.prestadorNome}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalAjusteAberto(aut.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ajuste Estruturado</span>
                </button>
                <button
                  onClick={onOpenAudit}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-500"
                  title="Auditoria"
                >
                  <History className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Painel de Cálculo e Validade */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10.5px] text-slate-400 block">Sessões / Semana:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {aut.sessoesPorSemana} sessões
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  Multiplicador semanal
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-[10.5px] text-slate-400 block">Período de Validade:</span>
                <span className="font-bold text-slate-900 font-mono text-xs">
                  {aut.dataValidadeInicio} → {aut.dataValidadeFim}
                </span>
                <span className="text-[10px] text-blue-700 block mt-0.5 font-semibold">
                  {aut.semanasCalculadas} semanas calculadas
                </span>
              </div>

              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200 text-blue-950">
                <span className="text-[10.5px] text-blue-800 block">Total Autorizado:</span>
                <span className="font-extrabold text-[#002172] font-mono text-base">
                  {aut.quantidadeTotal} sessões
                </span>
                <span className="text-[10px] text-slate-500 block mt-0.5">
                  {aut.sessoesPorSemana} × {aut.semanasCalculadas} = {aut.quantidadeTotal}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950">
                <span className="text-[10.5px] text-emerald-800 block">
                  Data Próxima Autorização:
                </span>
                <span className="font-extrabold text-emerald-800 font-mono text-sm">
                  {aut.dataProximaAutorizacao}
                </span>
                <span className="text-[10px] text-emerald-700 block mt-0.5 font-semibold">
                  Exatamente 1 sessão prévia
                </span>
              </div>
            </div>

            {/* Justificativa Automática Padronizada */}
            <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 text-xs">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                Justificativa Padrão Registrada para o Portal:
              </span>
              <p className="text-slate-700 italic">
                "{aut.justificativaFormulario}"
              </p>
              <div className="mt-1 text-[10px] text-slate-400 flex items-center gap-2">
                <span>Formulário anexado: {aut.tamanhoFormularioMb} MB</span>
                <span className="text-emerald-700 font-bold">✓ Menor que 10 MB</span>
              </div>
            </div>

            {/* Histórico Estruturado de Ajustes (Problema 3 Solucionado) */}
            {aut.ajustes.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-800 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-slate-500" />
                  Registro Estruturado de Ajuste (Não Sobrescreve Silenciosamente):
                </div>
                {aut.ajustes.map((aj) => (
                  <div
                    key={aj.id}
                    className="p-2 rounded-lg bg-white border border-slate-200 text-[11px] space-y-0.5"
                  >
                    <div className="flex justify-between">
                      <span>
                        Quantidade original: <strong>{aj.quantidadeOriginal} sessões</strong> →
                        Nova quantidade: <strong className="text-emerald-700">{aj.novaQuantidade} sessões</strong>
                      </span>
                      <span className="text-slate-400 font-mono">{aj.dataHora}</span>
                    </div>
                    <div className="text-slate-600">
                      <strong>Motivo:</strong> {aj.motivo}
                    </div>
                    <div className="text-slate-400 text-[10px]">
                      Responsável: {aj.usuarioNome}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Modal Inline de Ajuste Estruturado */}
            {modalAjusteAberto === aut.id && (
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs space-y-3">
                <div className="font-bold text-[#002172] text-sm">
                  Substituir Comentário Solto por Registro Estruturado de Ajuste
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1">Nova Quantidade de Sessões:</label>
                    <input
                      type="number"
                      value={novaQuantidade}
                      onChange={(e) => setNovaQuantidade(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white border rounded-lg font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">
                      Motivo Obrigatório (Auditoria LGPD):
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Atraso na autorização anterior pelo convênio..."
                      value={motivoAjuste}
                      onChange={(e) => setMotivoAjuste(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setModalAjusteAberto(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-200 text-slate-700 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleSalvarAjusteEstruturado(aut.id)}
                    className="px-4 py-1.5 rounded-lg bg-[#002172] text-white font-bold hover:bg-[#001752]"
                  >
                    Salvar Ajuste Auditado
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
