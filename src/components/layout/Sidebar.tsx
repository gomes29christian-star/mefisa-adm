import React from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck2,
  CalendarDays,
  FileSpreadsheet,
  ClockAlert,
  Stethoscope,
  AlertCircle,
  History,
  ShieldCheck,
  Settings,
  Sparkles,
  Lock,
} from 'lucide-react';
import { MefisaLogo } from '../common/MefisaLogo';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

export type NavItemKey =
  | 'dashboard'
  | 'central_dados'
  | 'pacientes'
  | 'autorizacoes'
  | 'sessoes'
  | 'guias'
  | 'analises'
  | 'prestadores'
  | 'pendencias'
  | 'auditoria'
  | 'usuarios'
  | 'configuracoes';

interface SidebarProps {
  activeKey: NavItemKey;
  onNavigate: (key: NavItemKey) => void;
  pendingCounts: {
    pendencias: number;
    analisesAtraso: number;
    guiasAguardando: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeKey,
  onNavigate,
  pendingCounts,
}) => {
  const { getThemeStrokeStyle, activePreset } = useTheme();
  const { isSystemUnlocked, setModalAberto, conquistas } = useSecretAchievements();

  const navItems: {
    key: NavItemKey;
    label: string;
    icon: React.ElementType;
    badgeCount?: number;
    badgeColor?: string;
  }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    {
      key: 'central_dados',
      label: 'Central de Dados & Guias',
      icon: FileSpreadsheet,
    },
    { key: 'pacientes', label: 'Pacientes', icon: Users },
    {
      key: 'autorizacoes',
      label: 'Autorizações',
      icon: FileCheck2,
    },
    { key: 'sessoes', label: 'Sessões', icon: CalendarDays },
    {
      key: 'guias',
      label: 'Digitação & Guias',
      icon: FileSpreadsheet,
      badgeCount: pendingCounts.guiasAguardando,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    {
      key: 'analises',
      label: 'Processos em Análise',
      icon: ClockAlert,
      badgeCount: pendingCounts.analisesAtraso,
      badgeColor: 'bg-red-100 text-red-800',
    },
    { key: 'prestadores', label: 'Prestadores & Doutoras', icon: Stethoscope },
    {
      key: 'pendencias',
      label: 'Painel de Pendências',
      icon: AlertCircle,
      badgeCount: pendingCounts.pendencias,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { key: 'auditoria', label: 'Histórico & Auditoria', icon: History },
    { key: 'usuarios', label: 'Gestão de Usuários', icon: ShieldCheck },
    { key: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/90 flex flex-col shrink-0 min-h-screen select-none">
      {/* Brand Header com Logotipo Oficial da Mefisa (Duplo clique é o gatilho secreto) */}
      <div className="p-4 border-b border-slate-100/90 flex items-center justify-between">
        <MefisaLogo variant="horizontal" />
      </div>

      {/* Navegação Principal */}
      <div className="p-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 font-['Quicksand']">
          Navegação Clínica
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <button
                key={item.key}
                onClick={() => onNavigate(item.key)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50/80 text-[#002172] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50/90'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? 'text-[#002172]' : 'text-slate-400'
                    }`}
                  />
                  <span
                    className={
                      isActive
                        ? `${getThemeStrokeStyle('text')} font-bold text-slate-900`
                        : ''
                    }
                  >
                    {item.label}
                  </span>
                </div>

                {item.badgeCount !== undefined && item.badgeCount > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      item.badgeColor || 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Seção Secreta (APENAS após duplo-clique na logo!) */}
      {isSystemUnlocked && (
        <div className="mx-3 mt-2 p-3 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl text-white shadow-sm border border-indigo-800/40">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Conquistas Secretas</span>
            </div>
            <span className="text-[10px] bg-amber-400/20 text-amber-200 px-1.5 py-0.2 rounded font-mono">
              Ativo
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-tight mb-2">
            Compartimento secreto revelado por duplo-clique.
          </p>
          <button
            onClick={() => setModalAberto(true)}
            className="w-full py-1 text-center bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 rounded-lg text-xs font-semibold transition-colors"
          >
            Abrir Cofre Secreto
          </button>
        </div>
      )}

      {/* Rodapé com Informações de Segurança LGPD */}
      <div className="mt-auto p-4 border-t border-slate-100 bg-slate-50/50 text-[11px] text-slate-500">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="font-semibold text-slate-700">Sistema Auditável v0.1</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-normal">
          Uso interno exclusivo Clínica Mefisa · Dados estritamente fictícios para fundação V0.
        </p>
      </div>
    </aside>
  );
};
