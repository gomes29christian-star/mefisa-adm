import React from 'react';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface MefisaLogoProps {
  variant?: 'horizontal' | 'compact' | 'stacked';
  className?: string;
  showSubtitle?: boolean;
}

export const MefisaLogo: React.FC<MefisaLogoProps> = ({
  variant = 'horizontal',
  className = '',
  showSubtitle = true,
}) => {
  const { unlockWithLogoDoubleClick } = useSecretAchievements();

  return (
    <div
      onDoubleClick={unlockWithLogoDoubleClick}
      className={`group select-none cursor-pointer flex items-center transition-transform active:scale-[0.98] ${className}`}
      title="Clínica Mefisa — Clínica de Especialidades"
    >
      {/* Família Silhueta Vetorial Fiel ao Logo Original */}
      <svg
        viewBox="0 0 160 120"
        className={variant === 'compact' ? 'w-9 h-8' : 'w-12 h-10 shrink-0'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Adulto Central/Pai (Azul Marinho #002172) */}
        <circle cx="72" cy="22" r="13" fill="#002172" />
        <path
          d="M50 48C50 38 60 36 72 36C84 36 94 38 94 48V90C94 92 88 94 72 94C56 94 50 92 50 90V48Z"
          fill="#002172"
        />

        {/* Mãe/Profissional com Cabelo (Verde Lima #91CA0C) */}
        <circle cx="106" cy="28" r="12" fill="#91CA0C" />
        {/* Silhueta Cabelo Mãe */}
        <path
          d="M94 26C94 18 100 14 107 14C114 14 120 18 120 26C120 32 118 36 122 40C118 40 115 36 113 36C110 40 102 40 99 36C97 38 94 36 94 26Z"
          fill="#91CA0C"
        />
        <path
          d="M86 52C86 42 96 40 108 40C120 40 134 44 140 58L126 86C124 90 116 90 106 88C96 86 90 76 86 64V52Z"
          fill="#91CA0C"
        />

        {/* Criança Menina com Marias-Chiquinhas (Verde Lima #91CA0C - Esquerda com braço estendido) */}
        <circle cx="28" cy="54" r="9" fill="#91CA0C" />
        {/* Pigtails */}
        <ellipse cx="18" cy="52" rx="4" ry="5" fill="#91CA0C" />
        <ellipse cx="38" cy="52" rx="4" ry="5" fill="#91CA0C" />
        <path
          d="M10 58C14 62 20 68 28 68C36 68 44 60 50 56C50 68 46 88 42 96C32 98 20 96 16 94C12 84 8 70 10 58Z"
          fill="#91CA0C"
        />

        {/* Criança Menino (Azul Marinho #002172 - Direita com braços abertos) */}
        <circle cx="126" cy="62" r="9" fill="#002172" />
        <path
          d="M106 62C112 68 118 72 126 72C134 72 142 66 148 60C144 72 140 88 136 96C126 98 116 96 112 92C108 82 104 72 106 62Z"
          fill="#002172"
        />
      </svg>

      {/* Tipografia MEFISA Oficial */}
      {variant !== 'compact' && (
        <div className="ml-2.5 flex flex-col justify-center">
          <div className="flex items-baseline tracking-tight font-bold text-xl leading-none">
            <span className="text-[#002172] tracking-wider font-['Quicksand'] font-extrabold text-[22px]">
              MEFISA
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-[#91CA0C] ml-0.5 inline-block"></div>
          </div>
          {showSubtitle && (
            <span className="text-[9.5px] font-semibold tracking-wider text-[#2A657E] uppercase mt-0.5 font-['Nunito_Sans']">
              Clínica de Especialidades
            </span>
          )}
        </div>
      )}
    </div>
  );
};
