import React, { useState } from 'react';
import {
  ChevronDown,
} from 'lucide-react';
import { Usuario } from '../../types/clinic';
import { MOCK_USUARIOS } from '../../data/mockClinicData';
import { AccessibilityBar } from '../common/AccessibilityBar';

interface HeaderProps {
  activeUsuario: Usuario;
  onSelectUsuario: (usuario: Usuario) => void;
  onOpenCalculator?: () => void;
  onOpenArchitectureDocs?: () => void;
}

const getInitials = (name: string) => {
  if (!name) return 'US';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export const Header: React.FC<HeaderProps> = ({
  activeUsuario,
  onSelectUsuario,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200/90 dark:border-slate-800 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-colors">
      {/* Zone 1: Contextual Breadcrumb limpo */}
      <div className="hidden md:flex items-center gap-3">
        <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span>Unidade Central</span>
          <span className="mx-2 text-slate-300 dark:text-slate-600">/</span>
          <span className="text-slate-800 dark:text-white font-bold tracking-wide">
            Recepção & Gestão de Autorizações
          </span>
        </div>
      </div>

      {/* Zone 2: Área central livre para respiro visual */}
      <div className="flex-1 hidden md:block" />

      {/* Zone 3: Acessibilidade + Usuário */}
      <div className="flex items-center gap-1.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end">
        {/* Barra de Acessibilidade */}
        <AccessibilityBar />

        {/* Perfil do Usuário (Informativo, sem troca de conta no topo) */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80">
          <div className="w-8 h-8 rounded-lg bg-[#002172] text-white flex items-center justify-center font-bold text-xs shadow-sm overflow-hidden shrink-0">
            {activeUsuario.avatar && (activeUsuario.avatar.startsWith('http') || activeUsuario.avatar.startsWith('data:')) ? (
              <img src={activeUsuario.avatar} alt={activeUsuario.nome} className="w-full h-full object-cover" />
            ) : (
              getInitials(activeUsuario.nome)
            )}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
              {activeUsuario.nome ? activeUsuario.nome.split(' ')[0] : ''}
            </div>
            <div className="text-[10.5px] text-slate-500 dark:text-slate-400 leading-tight">
              {activeUsuario.departamento || activeUsuario.papel}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
