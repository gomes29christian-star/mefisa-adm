import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  Shield,
  FileCheck2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Filter,
  RefreshCw,
  Clock,
  CreditCard,
  UserCheck,
  CheckCircle2,
  ExternalLink,
  FileWarning,
  FileSpreadsheet,
} from 'lucide-react';
import { Paciente, Usuario, StatusPaciente, FiltroPacientesUsuario } from '../../types/clinic';
import {
  PacientesService,
  mascararCpf,
  mascararCarteirinha,
} from '../../services/pacientesService';
import { MOCK_CONVENIOS } from '../../data/mockClinicData';
import { NovoPacienteModal } from '../pacientes/NovoPacienteModal';
import { PacientePerfilDrawer } from '../pacientes/PacientePerfilDrawer';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';
import { TopScrollTableWrapper } from '../common/TopScrollTableWrapper';
import { formatarDataBr } from '../../services/businessRules';
import { matchDateFilter, matchTextFilter } from '../../utils/filterUtils';

const obterBadgeProcedimento = (proc: string) => {
  const p = (proc || '').toLowerCase();
  if (p.includes('psicoterapia') || p.includes('aba') || p.includes('tcc') || p.includes('psicologia')) {
    return 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800';
  }
  if (p.includes('fisioterapia') || p.includes('motora') || p.includes('reabilitação')) {
    return 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
  }
  if (p.includes('fonoaudiologia') || p.includes('linguagem') || p.includes('fono')) {
    return 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
  }
  if (p.includes('ocupacional') || p.includes('sensorial')) {
    return 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800';
  }
  if (p.includes('neuropsicológica') || p.includes('avaliação')) {
    return 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800';
  }
  return 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
};

interface PacientesViewProps {
  onOpenAudit: () => void;
  onOpenCalculator: () => void;
  onNavigate?: (key: any) => void;
  usuarioAtual?: Usuario;
}

export const PacientesView: React.FC<PacientesViewProps> = ({
  onOpenAudit,
  onOpenCalculator,
  onNavigate,
  usuarioAtual = {
    id: 'usr-2',
    nome: 'Maria Clara Fonseca',
    email: 'maria.fonseca@clinicamefisa.com.br',
    papel: 'FUNCIONARIO_ADMINISTRATIVO',
    departamento: 'Autorizações & Convênios',
    avatar: 'MF',
    ativo: true,
    ultimoAcesso: 'Hoje às 14:15',
  },
}) => {
  const { getThemeStrokeStyle, showMonthInitials } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  // LGPD Achievement
  triggerSecretAction('guardiao_lgpd');

  // Pacientes em memória/storage
  const [pacientes, setPacientes] = useState<Paciente[]>(() =>
    PacientesService.obterPacientes()
  );

  // Filtros locais da sessão do usuário corrente (ISOLADOS POR USUÁRIO)
  const [filtros, setFiltros] = useState<FiltroPacientesUsuario>(() =>
    PacientesService.obterFiltroUsuario(usuarioAtual.id)
  );

  // Filtros programáveis por coluna
  const [filtrosColunas, setFiltrosColunas] = useState({
    nome: '',
    procedimento: '',
    carteirinha: '',
    status: '',
    convenio: '',
    proximaAut: '',
    ultimaAut: '',
    pendencias: '',
    atualizacao: '',
  });

  // Estado selecionado para visualização no Drawer de Perfil
  const [pacienteSelecionado, setPacienteSelecionado] = useState<Paciente | null>(null);

  // Modal de novo cadastro
  const [isNovoModalAberto, setIsNovoModalAberto] = useState(false);

  // Feedback de ações
  const [notificacaoSucesso, setNotificacaoSucesso] = useState<string | null>(null);

  // Atualiza storage de filtros por usuário quando alterado na sessão
  const handleAtualizarFiltro = (novoFiltro: Partial<FiltroPacientesUsuario>) => {
    const atualizado: FiltroPacientesUsuario = { ...filtros, ...novoFiltro };
    setFiltros(atualizado);
    PacientesService.salvarFiltroUsuario(usuarioAtual.id, atualizado);
  };

  // Recarrega lista quando o usuário selecionado ou storage muda
  const recarregarPacientes = () => {
    setPacientes(PacientesService.obterPacientes());
  };

  // Filtra pacientes localmente
  const pacientesBase = PacientesService.filtrarPacientes(pacientes, filtros);
  const pacientesFiltrados = pacientesBase.filter(p => {
    if (filtrosColunas.nome) {
      const matchNome = matchTextFilter(p.nome, filtrosColunas.nome);
      const matchProntuario = matchTextFilter(p.codigoProntuario, filtrosColunas.nome);
      const matchResp = matchTextFilter(p.responsavelPrincipalNome || p.responsavelNome, filtrosColunas.nome);
      if (!matchNome && !matchProntuario && !matchResp) return false;
    }
    if (filtrosColunas.procedimento && !matchTextFilter(p.procedimentoPrincipal, filtrosColunas.procedimento)) {
      return false;
    }
    if (filtrosColunas.carteirinha && !matchTextFilter(p.carteirinhaAtual || p.carteirinha, filtrosColunas.carteirinha)) {
      return false;
    }
    if (filtrosColunas.status && p.status !== filtrosColunas.status) {
      return false;
    }
    if (filtrosColunas.convenio && !matchTextFilter(p.convenioPrincipalNome || p.convenioNome, filtrosColunas.convenio)) {
      return false;
    }
    if (filtrosColunas.proximaAut && !matchDateFilter(p.proximaAutorizacaoData || '2026-10-29', filtrosColunas.proximaAut)) {
      return false;
    }
    if (filtrosColunas.ultimaAut && !matchDateFilter(p.ultimaAutorizacaoData || '2026-10-01', filtrosColunas.ultimaAut)) {
      return false;
    }
    if (filtrosColunas.pendencias) {
      const termoPend = filtrosColunas.pendencias.trim().toLowerCase();
      const qtdPend = String(p.pendenciasQuantidade || 0);
      const formVencido = p.formulario?.statusVencimento === 'VENCIDO';
      if (termoPend === '0' || termoPend.includes('reg') || termoPend.includes('sem')) {
        if (p.pendenciasQuantidade && p.pendenciasQuantidade > 0) return false;
        if (formVencido) return false;
      } else if (termoPend.includes('venc') || termoPend.includes('form')) {
        if (!formVencido) return false;
      } else {
        if (!qtdPend.includes(termoPend)) return false;
      }
    }
    if (filtrosColunas.atualizacao && !matchDateFilter(p.dataUltimaAtualizacao || '2026-10-24', filtrosColunas.atualizacao)) {
      return false;
    }
    return true;
  });

  const temFiltroColunaAtivo = Object.values(filtrosColunas).some(v => Boolean(v && v.trim()));

  const limparFiltrosColunas = () => {
    setFiltrosColunas({
      nome: '',
      procedimento: '',
      carteirinha: '',
      status: '',
      convenio: '',
      proximaAut: '',
      ultimaAut: '',
      pendencias: '',
      atualizacao: '',
    });
  };

  // Verificação de formulários vencidos (Alerta de Urgência)
  const pacientesComFormularioVencido = pacientes.filter(
    (p) => p.formulario?.statusVencimento === 'VENCIDO'
  );

  const getStatusBadge = (status: StatusPaciente | string) => {
    switch (status) {
      case 'ATIVO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EM_ACOMPANHAMENTO':
      case 'EM_TRATAMENTO':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'INATIVO':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'ENCERRADO':
      case 'ALTA':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-150">
      {/* ALERTA DE URGÊNCIA: Formulários Vencidos (Requisito 4) */}
      {pacientesComFormularioVencido.length > 0 && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-red-600 text-white shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-red-900 uppercase tracking-wide">
                  ⚠️ ALERTA DE URGÊNCIA — Vencimento de Formulário (180 Dias)
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-red-200 text-red-900 text-[10px] font-bold">
                  {pacientesComFormularioVencido.length} paciente(s)
                </span>
              </div>
              <p className="text-xs text-red-700 mt-0.5">
                Existem cadastros com formulário vencido há mais de 6 meses.
                <strong> Orientação administrativa: avisar imediatamente aos responsáveis para assinatura de novo documento.</strong>
              </p>
            </div>
          </div>

          <button
            onClick={() => handleAtualizarFiltro({ formularioVencidoApenas: !filtros.formularioVencidoApenas })}
            className="shrink-0 px-3.5 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-2xs transition-colors"
          >
            {filtros.formularioVencidoApenas ? 'Mostrar Todos' : 'Ver Pacientes Afetados'}
          </button>
        </div>
      )}

      {/* Notificação Temporária de Sucesso */}
      {notificacaoSucesso && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-900 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{notificacaoSucesso}</span>
          </div>
          <button
            onClick={() => setNotificacaoSucesso(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900 dark:text-white">
              Pacientes & Prontuários
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#002172]/10 dark:bg-blue-950 text-[#002172] dark:text-blue-300 border border-[#002172]/20 dark:border-blue-800">
              Módulo Mestre V1
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
              LGPD Blindada
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Entidade mestre central única: autorizações, sessões e guias referenciam este cadastro sem duplicação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              handleAtualizarFiltro({
                busca: '',
                status: 'TODOS',
                convenioId: 'TODOS',
                comPendenciasApenas: false,
                formularioVencidoApenas: false,
              });
              recarregarPacientes();
            }}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
            title="Recarregar pacientes e resetar filtros"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate && onNavigate('importacao')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shadow-2xs"
            title="Importar planilha legada de pacientes"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Importar Planilha</span>
          </button>

          <button
            onClick={() => setIsNovoModalAberto(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#91CA0C]" />
            <span>+ Novo Paciente</span>
          </button>
        </div>
      </div>

      {/* Barra de Busca e Filtros Locais (ISOLADOS NA SESSÃO) */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Campo de Busca Rápida */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por nome, carteirinha, CPF ou responsável legal..."
              value={filtros.busca}
              onChange={(e) => handleAtualizarFiltro({ busca: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white placeholder-slate-400 focus:outline-[#002172] focus:bg-white dark:focus:bg-slate-900 transition-colors"
            />
          </div>

          {/* Filtro por Status */}
          <select
            value={filtros.status}
            onChange={(e) => handleAtualizarFiltro({ status: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white font-medium focus:outline-[#002172]"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="ATIVO">🟢 Ativo</option>
            <option value="EM_ACOMPANHAMENTO">🟡 Em Acompanhamento</option>
            <option value="INATIVO">⚪ Inativo</option>
            <option value="ENCERRADO">🔴 Encerrado / Alta</option>
          </select>

          {/* Filtro por Convênio */}
          <select
            value={filtros.convenioId}
            onChange={(e) => handleAtualizarFiltro({ convenioId: e.target.value })}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-white font-medium focus:outline-[#002172]"
          >
            <option value="TODOS">Convênios: Todos</option>
            {MOCK_CONVENIOS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nome}
              </option>
            ))}
            <option value="conv-particular">Particular / Outros</option>
          </select>
        </div>

        {/* Filtros Opcionais Adicionais */}
        <div className="flex flex-wrap items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.comPendenciasApenas}
                onChange={(e) => handleAtualizarFiltro({ comPendenciasApenas: e.target.checked })}
                className="rounded text-[#002172] focus:ring-[#002172]"
              />
              <span className="text-slate-700 dark:text-slate-300 font-medium">Apenas com pendências operacionais</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={filtros.formularioVencidoApenas}
                onChange={(e) => handleAtualizarFiltro({ formularioVencidoApenas: e.target.checked })}
                className="rounded text-red-600 focus:ring-red-600"
              />
              <span className={filtros.formularioVencidoApenas ? 'font-bold text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}>
                Apenas formulários vencidos (180 dias)
              </span>
            </label>
          </div>

          <div className="text-[11px] text-slate-400 dark:text-slate-400">
            Filtros salvos na sessão de <strong>{usuarioAtual.nome}</strong>
          </div>
        </div>
      </div>

      {/* TABELA ADMINISTRATIVA PROFISSIONAL COM ROLL SUPERIOR */}
      <TopScrollTableWrapper tableTitle="Lista Geral de Pacientes">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50/90 dark:bg-slate-950 text-slate-700 dark:text-slate-200 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              {/* 1. Nome */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Nome do Paciente</div>
                <input
                  type="text"
                  placeholder="Filtrar nome..."
                  value={filtrosColunas.nome}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, nome: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 2. Procedimento */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Procedimento</div>
                <input
                  type="text"
                  placeholder="Filtrar proc..."
                  value={filtrosColunas.procedimento}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, procedimento: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 3. Carteirinha Atual */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Carteirinha Atual</div>
                <input
                  type="text"
                  placeholder="Filtrar cart..."
                  value={filtrosColunas.carteirinha}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, carteirinha: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 4. Status */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white text-center">
                <div>Status</div>
                <select
                  value={filtrosColunas.status}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, status: e.target.value })}
                  className="mt-1 w-full px-1 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                >
                  <option value="">Todos</option>
                  <option value="ATIVO">Ativo</option>
                  <option value="ENCERRADO">Encerrado</option>
                </select>
              </th>
              {/* 5. Convênio principal */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Convênio Principal</div>
                <input
                  type="text"
                  placeholder="Filtrar conv..."
                  value={filtrosColunas.convenio}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, convenio: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 6. Próxima autorização */}
              <th className="py-3 px-4 font-bold text-[#002172] dark:text-blue-300">
                <div>Próxima Autorização</div>
                <input
                  type="text"
                  placeholder="Data..."
                  value={filtrosColunas.proximaAut}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, proximaAut: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 7. Última autorização */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Última Autorização</div>
                <input
                  type="text"
                  placeholder="Data..."
                  value={filtrosColunas.ultimaAut}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, ultimaAut: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 8. Pendências */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white text-center">
                <div>Pendências</div>
                <input
                  type="text"
                  placeholder="..."
                  value={filtrosColunas.pendencias}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, pendencias: e.target.value })}
                  className="mt-1 w-full px-1 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* 9. Última atualização */}
              <th className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                <div>Última Atualização</div>
                <input
                  type="text"
                  placeholder="Data..."
                  value={filtrosColunas.atualizacao}
                  onChange={(e) => setFiltrosColunas({ ...filtrosColunas, atualizacao: e.target.value })}
                  className="mt-1 w-full px-2 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                />
              </th>
              {/* Ação */}
              <th className="py-3 px-4 text-right">
                <div>Ação</div>
                <div className="mt-1 flex justify-end items-center h-6">
                  {temFiltroColunaAtivo && (
                    <button
                      onClick={limparFiltrosColunas}
                      title="Limpar todos os filtros de coluna"
                      className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 text-[10px] font-bold transition-colors cursor-pointer"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((pac, index) => {
                  const carteirinhaExibicao =
                    pac.carteirinhaAtualMascarada ||
                    mascararCarteirinha(pac.carteirinhaAtual || pac.carteirinha || '');

                  return (
                    <tr
                      key={`${pac.id}-${index}`}
                      onClick={() => setPacienteSelecionado(pac)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group"
                    >
                      {/* 1. Nome & Prontuário */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-xs group-hover:text-[#002172]">
                              {pac.nome}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {pac.codigoProntuario}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {pac.idade ? `${pac.idade} anos • ` : ''}Resp: {pac.responsavelPrincipalNome || pac.responsavelNome || 'Não informado'}
                          </div>
                        </div>
                      </td>

                      {/* 2. Procedimento */}
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold border shadow-2xs ${obterBadgeProcedimento(pac.procedimentoPrincipal)}`}>
                          {pac.procedimentoPrincipal || 'Fisioterapia Geral'}
                        </span>
                      </td>

                      {/* 3. Carteirinha Atual */}
                      <td className="py-3 px-4 font-mono text-slate-800 font-semibold">
                        {carteirinhaExibicao}
                      </td>

                      {/* 3. Status */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                            pac.status
                          )}`}
                        >
                          {pac.status}
                        </span>
                      </td>

                      {/* 4. Convênio principal */}
                      <td className="py-3 px-4">
                        <span className="font-semibold text-slate-800">
                          {pac.convenioPrincipalNome || pac.convenioNome}
                        </span>
                      </td>

                      {/* 5. Próxima autorização */}
                      <td className="py-3 px-4 font-bold text-[#002172]">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#91CA0C]" />
                          <span>{formatarDataBr(pac.proximaAutorizacaoData || '2026-10-29', showMonthInitials)}</span>
                        </span>
                      </td>

                      {/* 6. Última autorização */}
                      <td className="py-3 px-4 text-slate-600">
                        {formatarDataBr(pac.ultimaAutorizacaoData || '2026-10-01', showMonthInitials)}
                      </td>

                      {/* 7. Pendências */}
                      <td className="py-3 px-4 text-center">
                        {pac.formulario?.statusVencimento === 'VENCIDO' ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800"
                            title="Formulário vencido há mais de 180 dias!"
                          >
                            <AlertTriangle className="w-3 h-3 text-red-600" />
                            Form. Vencido
                          </span>
                        ) : pac.pendenciasQuantidade && pac.pendenciasQuantidade > 0 ? (
                          <span className="badge-analise-amarelo inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-yellow-400 text-slate-950 border border-yellow-500 shadow-xs">
                            <Clock className="w-3 h-3 text-slate-950" />
                            {pac.pendenciasQuantidade} pendência(s)
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700">
                            Regular
                          </span>
                        )}
                      </td>

                      {/* 8. Última atualização */}
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        <div>{formatarDataBr(pac.dataUltimaAtualizacao || '2026-10-24', showMonthInitials)}</div>
                        <div className="text-[10px] text-slate-400">
                          {pac.atualizadoPor || 'Maria Clara'}
                        </div>
                      </td>

                      {/* Ação */}
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPacienteSelecionado(pac);
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold text-[#002172] hover:bg-[#002172] hover:text-white rounded-lg transition-colors border border-[#002172]/30"
                        >
                          Abrir Prontuário →
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                /* Estado Vazio (Requisito 13) */
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="max-w-xs mx-auto space-y-2">
                      <div className="p-3 bg-slate-100 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
                        <Search className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-800">
                        Nenhum paciente encontrado
                      </h4>
                      <p className="text-xs text-slate-500">
                        Nenhum registro corresponde aos filtros selecionados. Tente alterar o termo da busca ou os filtros de convênio.
                      </p>
                      <button
                        onClick={() =>
                          handleAtualizarFiltro({
                            busca: '',
                            status: 'TODOS',
                            convenioId: 'TODOS',
                            comPendenciasApenas: false,
                            formularioVencidoApenas: false,
                          })
                        }
                        className="mt-2 px-3 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                      >
                        Limpar Filtros
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
      </TopScrollTableWrapper>

      {/* Rodapé da Tabela */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2 shadow-2xs">
        <span>
          Exibindo <strong className="text-slate-800 dark:text-white">{pacientesFiltrados.length}</strong> de <strong className="text-slate-800 dark:text-white">{pacientes.length}</strong> pacientes cadastrados
        </span>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Entidade Única: Chave Prontuário #MEF</span>
          <span>•</span>
          <button
            onClick={onOpenAudit}
            className="text-[#002172] dark:text-blue-400 hover:underline font-bold"
          >
            Ver Trilha Geral de Auditoria →
          </button>
        </div>
      </div>

      {/* Drawer de Perfil Completo do Paciente */}
      {pacienteSelecionado && (
        <PacientePerfilDrawer
          paciente={pacienteSelecionado}
          usuarioAtual={usuarioAtual}
          onFechar={() => setPacienteSelecionado(null)}
          onPacienteAtualizado={(pacAtualizado) => {
            setPacienteSelecionado(pacAtualizado);
            recarregarPacientes();
            setNotificacaoSucesso(
              `Prontuário de ${pacAtualizado.nome} atualizado com sucesso.`
            );
          }}
          onOpenAudit={onOpenAudit}
        />
      )}

      {/* Modal de Novo Paciente */}
      {isNovoModalAberto && (
        <NovoPacienteModal
          usuarioAtual={usuarioAtual}
          onFechar={() => setIsNovoModalAberto(false)}
          onPacienteCriado={(novoPac) => {
            recarregarPacientes();
            setNotificacaoSucesso(
              `✓ Paciente ${novoPac.nome} (${novoPac.codigoProntuario}) cadastrado com sucesso!`
            );
            setPacienteSelecionado(novoPac);
          }}
          onAbrirPacienteExistente={(pacExistente) => {
            setPacienteSelecionado(pacExistente);
          }}
        />
      )}
    </div>
  );
};
