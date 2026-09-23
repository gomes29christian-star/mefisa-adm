import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  FileCheck2,
  Calendar,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { MOCK_PACIENTES, MOCK_PRESTADORES } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface PacientesViewProps {
  onOpenAudit: () => void;
  onOpenCalculator: () => void;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  onOpenAudit,
  onOpenCalculator,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');

  // Ao acessar os dados mascarados e respeitar a privacidade LGPD
  triggerSecretAction('guardiao_lgpd');

  const pacientesFiltrados = MOCK_PACIENTES.filter((pac) => {
    if (statusFiltro !== 'TODOS' && pac.status !== statusFiltro) return false;
    if (!busca) return true;
    const t = busca.toLowerCase();
    return (
      pac.nome.toLowerCase().includes(t) ||
      pac.codigoProntuario.toLowerCase().includes(t) ||
      pac.convenioNome.toLowerCase().includes(t) ||
      pac.responsavelNome.toLowerCase().includes(t)
    );
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Prontuários & Pacientes
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              LGPD Blindada
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Entidade central de pacientes: evita duplicação de dados nas autorizações e guias.
          </p>
        </div>

        <button
          onClick={() => alert('Simulação V0: O módulo V1 adicionará o cadastro completo.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#91CA0C]" />
          <span>+ Novo Paciente</span>
        </button>
      </div>

      {/* Busca & Filtros Locais */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, prontuário, carteirinha ou responsável..."
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
          <option value="ATIVO">Ativo</option>
          <option value="EM_TRATAMENTO">Em Tratamento</option>
          <option value="SUSPENSO">Suspenso</option>
          <option value="ALTA">Alta Médica</option>
        </select>
      </div>

      {/* Grid de Pacientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {pacientesFiltrados.map((pac) => {
          const prestador = MOCK_PRESTADORES.find((p) => p.id === pac.prestadorId);

          return (
            <div
              key={pac.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono font-bold text-xs text-[#002172]">
                    {pac.codigoProntuario}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      pac.status === 'ATIVO'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {pac.status.replace('_', ' ')}
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm">{pac.nome}</h3>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {pac.idade} anos · Responsável: <strong>{pac.responsavelNome}</strong>
                </div>

                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Convênio:</span>
                    <span className="font-bold text-slate-800">{pac.convenioNome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Carteirinha:</span>
                    <span className="font-mono text-slate-700">{pac.carteirinha}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Terapeuta Responsável:</span>
                    <span className="font-medium text-[#2A657E]">
                      {prestador?.nome || 'Dra. Beatriz Albuquerque'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[10.5px] text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-emerald-600" />
                  CPF: {pac.cpfMascarado}
                </span>

                <button
                  onClick={onOpenCalculator}
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 text-[#002172] hover:bg-blue-100 transition-colors"
                >
                  Nova Autorização →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
