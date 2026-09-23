import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  FolderCheck,
  UserCheck,
  AlertTriangle,
  Send,
  Building,
} from 'lucide-react';
import { MOCK_GUIAS } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface GuiasViewProps {
  onOpenAudit: () => void;
}

export const GuiasView: React.FC<GuiasViewProps> = ({ onOpenAudit }) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  const guiasFiltradas = MOCK_GUIAS.filter((guia) => {
    if (statusFiltro !== 'TODOS' && guia.status !== statusFiltro) return false;
    if (!busca) return true;
    const t = busca.toLowerCase();
    return (
      guia.numeroGuia.toLowerCase().includes(t) ||
      guia.pacienteNome.toLowerCase().includes(t) ||
      guia.prestadorNome.toLowerCase().includes(t) ||
      (guia.quemDigitouNome && guia.quemDigitouNome.toLowerCase().includes(t))
    );
  });

  const handleSimularColocacaoPasta = (numeroGuia: string) => {
    // Dispara a conquista secreta da pasta da doutora se desbloqueado
    triggerSecretAction('pasta_da_doutora');
    alert(`Guia #${numeroGuia} registrada com sucesso na pasta física da profissional!`);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Digitação & Rastreabilidade de Guias
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900">
              Ciclo Completo de Pastas
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Rastreio físico da pasta da doutora, colheita de assinatura, duração (1h ou 2h) e digitação SulAmérica.
          </p>
        </div>

        <button
          onClick={() => alert('Simulação V0: O módulo V4 fornecerá a digitação em lote.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Send className="w-4 h-4 text-[#91CA0C]" />
          <span>+ Registrar Digitação</span>
        </button>
      </div>

      {/* Filtros */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por número da guia, paciente, prestador ou quem digitou..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-[#002172]"
          />
        </div>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium"
        >
          <option value="TODOS">Status: Todos</option>
          <option value="DIGITADA">Digitada</option>
          <option value="AGUARDANDO_DIGITACAO">Aguardando Digitação</option>
          <option value="COLHENDO_ASSINATURA">Colhendo Assinatura</option>
          <option value="NA_PASTA">Na Pasta da Doutora</option>
          <option value="PENDENTE_DOCUMENTO">Pendente Documento</option>
        </select>
      </div>

      {/* Tabela de Guias */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3">Nº da Guia</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Pasta Doutora & Duração</th>
                <th className="p-3">Data Colocada na Pasta</th>
                <th className="p-3">Colheita de Assinatura</th>
                <th className="p-3">Data & Quem Digitou</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guiasFiltradas.map((guia) => (
                <tr key={guia.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {guia.numeroGuia}
                  </td>

                  <td className="p-3 font-bold text-slate-900">
                    {guia.pacienteNome}
                  </td>

                  <td className="p-3">
                    <div className="font-semibold text-[#002172]">
                      {guia.prestadorNome}
                    </div>
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 font-bold">
                        {guia.pastaNome}
                      </span>
                      <span>·</span>
                      <span className="font-mono">{guia.duracaoHoras}h por sessão</span>
                    </div>
                  </td>

                  <td className="p-3 font-mono text-slate-700 whitespace-nowrap">
                    {guia.dataColocadaNaPasta}
                  </td>

                  <td className="p-3 text-slate-600">
                    {guia.quemPegouAssinaturaNome ? (
                      <div>
                        <div className="font-medium text-slate-800">
                          {guia.quemPegouAssinaturaNome}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Pego em: {guia.dataPegaParaAssinatura}
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">Pendente coleta</span>
                    )}
                  </td>

                  <td className="p-3 text-slate-600">
                    {guia.dataDigitada ? (
                      <div>
                        <div className="font-bold text-emerald-800 font-mono">
                          {guia.dataDigitada}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          Por: {guia.quemDigitouNome}
                        </div>
                      </div>
                    ) : (
                      <span className="text-amber-700 font-semibold text-[11px]">
                        Aguardando última sessão
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-center whitespace-nowrap">
                    {guia.status === 'DIGITADA' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Digitada
                      </span>
                    ) : guia.status === 'AGUARDANDO_DIGITACAO' ? (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-100 text-[#002172] inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Pronta p/ Digitar
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                        <FolderCheck className="w-3 h-3 text-amber-700" />
                        Na Pasta
                      </span>
                    )}
                  </td>

                  <td className="p-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => handleSimularColocacaoPasta(guia.numeroGuia)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      Pasta / Rastreio
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
