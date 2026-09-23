import React from 'react';
import {
  Stethoscope,
  FolderCheck,
  Building,
  UserCheck,
  Plus,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import { MOCK_PRESTADORES } from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';

export const PrestadoresView: React.FC = () => {
  const { getThemeStrokeStyle } = useTheme();

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900">
              Prestadores, Doutoras & Especialistas
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Cadastro Único Centralizado
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Elimina a repetição manual de CRM, CBO e UF nas planilhas: altere uma vez, atualiza todo o sistema.
          </p>
        </div>

        <button
          onClick={() => alert('Simulação V0: Cadastro de novos prestadores será expandido em V1.')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4 text-[#91CA0C]" />
          <span>+ Novo Prestador</span>
        </button>
      </div>

      {/* Grid de Prestadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {MOCK_PRESTADORES.map((pres) => (
          <div
            key={pres.id}
            className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#002172] font-mono">
                  CBO {pres.cbo}
                </span>
                <span className="text-[10px] text-slate-400 font-mono font-bold">
                  UF: {pres.uf}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm">{pres.nome}</h3>
              <div className="text-xs text-[#2A657E] font-medium mt-0.5">
                {pres.especialidade}
              </div>

              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Conselho:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {pres.tipoRegistro} {pres.registro}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Pasta Associada:</span>
                  <span className="font-medium text-amber-800 flex items-center gap-1">
                    <FolderCheck className="w-3.5 h-3.5 text-amber-700" />
                    {pres.pastaAssociada}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Status: <strong className="text-emerald-700">Ativo</strong></span>
              <button
                onClick={() => alert(`Visualizando histórico completo de guias da profissional ${pres.nome}.`)}
                className="text-blue-700 hover:underline font-semibold"
              >
                Ver Guias →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
