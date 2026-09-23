import React, { useState } from 'react';
import {
  Bell,
  Search,
  SlidersHorizontal,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ChevronDown,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { useTheme, THEME_PRESETS } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';
import { Usuario } from '../../types/clinic';
import { MOCK_USUARIOS } from '../../data/mockClinicData';

interface HeaderProps {
  activeUsuario: Usuario;
  onSelectUsuario: (usuario: Usuario) => void;
  onOpenCalculator: () => void;
  onOpenArchitectureDocs: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeUsuario,
  onSelectUsuario,
  onOpenCalculator,
  onOpenArchitectureDocs,
}) => {
  const { activePreset, setThemePreset, getThemeStrokeStyle, enableStrokeEffect, setEnableStrokeEffect } =
    useTheme();
  const { isSystemUnlocked, setModalAberto, conquistas } = useSecretAchievements();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [themeDropdownOpen, setThemeDropdownOpen] = useState(false);

  const conquistasDesbloqueadas = conquistas.filter((c) => c.desbloqueada).length;

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-5 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      {/* Zone 1: Contextual Breadcrumb & Clinical Trust Badge */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200/60 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Unidade Central · Terapia Integrada</span>
          </div>
          <span className="text-slate-300">/</span>
          <span className="text-slate-700 font-semibold tracking-wide">
            Recepção & Gestão de Autorizações
          </span>
        </div>
      </div>

      {/* Zone 2: Informational Status & Action Affordances */}
      <div className="hidden lg:flex items-center gap-3">
        {/* Documentação Arquitetural do Sistema */}
        <button
          onClick={onOpenArchitectureDocs}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition-colors"
          title="Ver Arquitetura, Modelo de Dados e Regras de Negócio"
        >
          <Layers className="w-3.5 h-3.5 text-slate-500" />
          <span>V0 Arquitetura & Especificação</span>
        </button>

        {/* Simulador de Cálculo de Sessões (Exigência do usuário para cálculo transparente) */}
        <button
          onClick={onOpenCalculator}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50/80 hover:bg-blue-100 text-[#002172] border border-blue-200/60 transition-colors"
          title="Calcular quantidade de sessões do período com fórmula transparente"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-[#002172]" />
          <span className={getThemeStrokeStyle('text')}>Simulador de Cálculo Mefisa</span>
        </button>

        {/* Indicador de Segredo — SÓ APARECE SE DESBLOQUEADO VIA DUPLO-CLIQUE NA LOGO! */}
        {isSystemUnlocked && (
          <button
            onClick={() => setModalAberto(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg bg-amber-50 text-amber-900 border border-amber-300/80 hover:bg-amber-100 transition-all animate-pulse"
            title="Cofre de Conquistas Secretas da Mefisa"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Cofre Secreto ({conquistasDesbloqueadas}/{conquistas.length})</span>
          </button>
        )}
      </div>

      {/* Zone 3: Paleta de Cores com Stroke, Notificações e Troca de Usuário */}
      <div className="flex items-center gap-3">
        {/* Seletor de Tema & Efeito de Contorno (Stroke) */}
        <div className="relative">
          <button
            onClick={() => setThemeDropdownOpen(!themeDropdownOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            title="Ajustar Cor Tema e Efeito de Contorno"
          >
            <span
              className="w-3 h-3 rounded-full border border-black/10 inline-block"
              style={{ backgroundColor: activePreset.color }}
            />
            <span className="hidden sm:inline font-medium">Tema: {activePreset.name.split(' ')[0]}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {themeDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl shadow-lg border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                Cor Tema Clínica Mefisa
              </div>
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    setThemePreset(preset.id);
                    setThemeDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    activePreset.id === preset.id ? 'bg-slate-50 font-bold' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full border border-slate-300"
                      style={{ backgroundColor: preset.color }}
                    />
                    <span>{preset.name}</span>
                  </div>
                  {activePreset.id === preset.id && (
                    <span className="text-[10px] text-emerald-600 font-bold">Ativo</span>
                  )}
                </button>
              ))}

              <div className="border-t border-slate-100 my-1 pt-1 px-3">
                <label className="flex items-center justify-between py-1 cursor-pointer select-none">
                  <span className="text-slate-600">Efeito Stroke (Contorno):</span>
                  <input
                    type="checkbox"
                    checked={enableStrokeEffect}
                    onChange={(e) => setEnableStrokeEffect(e.target.checked)}
                    className="rounded border-slate-300 text-[#002172] focus:ring-0 w-3.5 h-3.5"
                  />
                </label>
                <div className="text-[10px] text-slate-400 leading-tight mt-0.5">
                  Aplica contorno estilizado em textos e ícones modificados pela cor tema.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notificações com Badge */}
        <div className="relative">
          <button
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 transition-colors relative"
            title="Pendências e Alertas Operacionais"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white font-bold text-[9px] flex items-center justify-center shadow-sm">
              3
            </span>
          </button>
        </div>

        {/* Perfil & Troca de Usuário (Demonstração de Filtros Locais por Sessão) */}
        <div className="relative">
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-lg bg-[#002172] text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {activeUsuario.avatar}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-tight">
                {activeUsuario.nome}
              </div>
              <div className="text-[10.5px] text-slate-500 leading-tight">
                {activeUsuario.departamento}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
          </button>

          {userDropdownOpen && (
            <div className="absolute right-0 mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 text-xs">
              <div className="px-3 py-1 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Alternar Operador (Sessão Independente)
              </div>
              <p className="px-3 pb-2 text-[11px] text-slate-500 border-b border-slate-100">
                Os filtros, buscas e ordenações são 100% locais a cada usuário.
              </p>
              {MOCK_USUARIOS.map((usr) => (
                <button
                  key={usr.id}
                  onClick={() => {
                    onSelectUsuario(usr);
                    setUserDropdownOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                    activeUsuario.id === usr.id ? 'bg-blue-50/70 font-semibold' : ''
                  }`}
                >
                  <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold">
                    {usr.avatar}
                  </div>
                  <div>
                    <div className="text-slate-800 text-xs">{usr.nome}</div>
                    <div className="text-[10px] text-slate-500">{usr.papel}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
