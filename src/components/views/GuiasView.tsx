import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Search,
  CheckCircle2,
  Clock,
  FolderCheck,
  UserCheck,
  AlertTriangle,
  Plus,
  X,
  ShieldAlert,
  Tag,
  Lock,
  Copy,
  Check,
  Sparkles,
  Calendar,
  FileCheck2,
  Trash2,
} from 'lucide-react';
import { MOCK_GUIAS, MOCK_PRESTADORES } from '../../data/mockClinicData';
import {
  validarDuplicidadeGuia,
  gerarChaveDuplicidade,
  registrarDuplicidadeExcepcional,
  formatarDataBr,
  calcularDatasSessoesAlinhadas,
  formatarContagemRepeticoesSessoes,
  calcularSessoesSemanaisJanela,
  sanitizarCbo,
  DiaSemanaIndice,
} from '../../services/businessRules';
import { ValidacaoDuplicidadeGuiaSessao } from '../../types/clinic';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';
import { TopScrollTableWrapper } from '../common/TopScrollTableWrapper';
import {
  ProcedimentosService,
  ProcedimentoCompleto,
} from '../../services/procedimentosService';
import { PacientesService } from '../../services/pacientesService';
import { GerenciarProcedimentosModal } from '../procedimentos/GerenciarProcedimentosModal';
import { carregarAutorizacoesIniciais, salvarAutorizacoesStorage } from '../../services/autorizacoesService';
import { AutorizacaoV2 } from '../../types/autorizacao';
import { matchDateFilter, matchTextFilter } from '../../utils/filterUtils';

interface GuiasViewProps {
  onOpenAudit: () => void;
}

export const GuiasView: React.FC<GuiasViewProps> = ({ onOpenAudit }) => {
  const { triggerSecretAction } = useSecretAchievements();
  const { showMonthInitials } = useTheme();
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState('TODOS');
  const [filtroDataInicio, setFiltroDataInicio] = useState('');
  const [filtroDataFim, setFiltroDataFim] = useState('');

  // Filtros programáveis por coluna
  const [filtrosColunas, setFiltrosColunas] = useState({
    numeroGuia: '',
    paciente: '',
    pastaDoutora: '',
    dataPasta: '',
    dataDigitacao: '',
    status: '',
  });

  const temFiltrosAtivos = Boolean(busca.trim()) || statusFiltro !== 'TODOS' || Boolean(filtroDataInicio) || Boolean(filtroDataFim) || Object.values(filtrosColunas).some(v => Boolean(v && v.trim()));

  const limparFiltros = () => {
    setBusca('');
    setStatusFiltro('TODOS');
    setFiltroDataInicio('');
    setFiltroDataFim('');
    setFiltrosColunas({
      numeroGuia: '',
      paciente: '',
      pastaDoutora: '',
      dataPasta: '',
      dataDigitacao: '',
      status: '',
    });
  };

  // Estado das guias
  const [guias, setGuias] = useState(MOCK_GUIAS);
  const [idsGuiasSelecionadas, setIdsGuiasSelecionadas] = useState<string[]>([]);

  // Autorizações concluídas vindas do Centro de Controle com sincronização automática
  const [autorizacoesConcluidas, setAutorizacoesConcluidas] = useState<AutorizacaoV2[]>([]);

  useEffect(() => {
    const atualizarAutorizacoes = () => {
      const auts = carregarAutorizacoesIniciais();
      setAutorizacoesConcluidas(auts.filter((a) => a.status === 'CONCLUIDO' || a.status === 'DIGITADA'));
    };
    atualizarAutorizacoes();
    window.addEventListener('storage', atualizarAutorizacoes);
    return () => {
      window.removeEventListener('storage', atualizarAutorizacoes);
    };
  }, []);

  // Guia / Autorização Concluída selecionada para abrir a Aba Lateral (Drawer) com cópia em 1 clique
  const [guiaSelecionadaDrawer, setGuiaSelecionadaDrawer] = useState<AutorizacaoV2 | null>(null);
  const [guiaPrincipalGerada, setGuiaPrincipalGerada] = useState<string>('');
  const [copiadoChave, setCopiadoChave] = useState<string | null>(null);
  const [numeroContaInput, setNumeroContaInput] = useState<string>('');
  const [erroNumeroConta, setErroNumeroConta] = useState<string | null>(null);
  const [pastaDoutoraInput, setPastaDoutoraInput] = useState<string>(MOCK_PRESTADORES[0]?.nome || 'Dra. Ana Beatriz');

  // Modal de Procedimentos & Preços ABA
  const [modalProcedimentosAberto, setModalProcedimentosAberto] = useState(false);

  // Modal de Nova Guia / Digitação
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState('Lucas Gabriel Mendes');
  const [codigoProcedimentoSelecionado, setCodigoProcedimentoSelecionado] = useState('66600480');
  const [novoProcedimento, setNovoProcedimento] = useState('Psicologia ABA');
  const [novaDataSessao, setNovaDataSessao] = useState('2026-10-24');
  const [novoNumeroGuia, setNovoNumeroGuia] = useState('#SUL-998822-D');
  const [resultadoDuplicidade, setResultadoDuplicidade] = useState<ValidacaoDuplicidadeGuiaSessao | null>(null);
  const [justificativaDuplicidade, setJustificativaDuplicidade] = useState('');
  const [erroBloqueioProcedimento, setErroBloqueioProcedimento] = useState<string | null>(null);

  const todosProcedimentos = ProcedimentosService.obterTodos();
  const procedimentoAtual = todosProcedimentos.find((p) => p.codigo === codigoProcedimentoSelecionado);

  const handleAbrirDrawerGuiaConcluida = (aut: AutorizacaoV2) => {
    // Gera número da Guia Principal automaticamente: [hora][minuto][dia][mês][ano completo]
    const agora = new Date();
    const hh = String(agora.getHours()).padStart(2, '0');
    const mm = String(agora.getMinutes()).padStart(2, '0');
    const dd = String(agora.getDate()).padStart(2, '0');
    const MM = String(agora.getMonth() + 1).padStart(2, '0');
    const yyyy = agora.getFullYear();
    const numeroGerado = `${hh}${mm}${dd}${MM}${yyyy}`;

    setGuiaPrincipalGerada(numeroGerado);
    setGuiaSelecionadaDrawer(aut);
    setNumeroContaInput('');
    setPastaDoutoraInput(aut.prestador || MOCK_PRESTADORES[0]?.nome || 'Dra. Ana Beatriz');
    setErroNumeroConta(null);
  };

  const handleMarcarComoDigitada = () => {
    if (!guiaSelecionadaDrawer) return;
    if (!numeroContaInput.trim()) {
      setErroNumeroConta('Por favor, digite o Número da Conta para registrar e acompanhar.');
      return;
    }

    const novaGuia = {
      id: `guia-aut-${Date.now()}`,
      numeroGuia: guiaSelecionadaDrawer.numeroAutorizacao || `#GUIA-${Math.floor(1000 + Math.random() * 9000)}`,
      numeroConta: numeroContaInput.trim(),
      autorizacaoId: guiaSelecionadaDrawer.id,
      pacienteId: guiaSelecionadaDrawer.pacienteId,
      pacienteNome: guiaSelecionadaDrawer.pacienteNome,
      prestadorId: 'prest-1',
      prestadorNome: guiaSelecionadaDrawer.prestador,
      convenioNome: guiaSelecionadaDrawer.operadora,
      dataAutorizacao: guiaSelecionadaDrawer.dataAutorizacao || new Date().toISOString().split('T')[0],
      dataColocacaoPasta: new Date().toISOString().split('T')[0],
      pastaDoutora: pastaDoutoraInput,
      duracaoHoras: 1 as const,
      responsavelColocacaoPasta: guiaSelecionadaDrawer.responsavel,
      dataRetorno: new Date().toISOString().split('T')[0],
      responsavelColherGuia: guiaSelecionadaDrawer.responsavel,
      dataDigitacao: new Date().toISOString().split('T')[0],
      responsavelDigitacao: guiaSelecionadaDrawer.responsavel,
      status: 'DIGITADA_FATURADA' as const,
      duplicidadeDetectada: false,
      senha: guiaSelecionadaDrawer.senha,
      dataValidadeSenha: guiaSelecionadaDrawer.dataValidadeSenha,
    };

    setGuias([novaGuia, ...guias]);

    // Atualiza autorizações no localStorage para remover da lista de prontas para digitar
    const todasAuts = carregarAutorizacoesIniciais();
    const autsAtualizadas = todasAuts.map(a =>
      a.id === guiaSelecionadaDrawer.id ? { ...a, status: 'DIGITADA' as const } : a
    );
    salvarAutorizacoesStorage(autsAtualizadas);
    setAutorizacoesConcluidas(autsAtualizadas.filter(a => a.status === 'CONCLUIDO'));

    setGuiaSelecionadaDrawer(null);
    setNumeroContaInput('');
    setErroNumeroConta(null);
    alert(`Guia vinculada à Conta ${novaGuia.numeroConta} marcada como digitada e adicionada aos faturamentos com sucesso!`);
  };

  const handleCopiar1Clique = (texto: string, chave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoChave(chave);
    setTimeout(() => setCopiadoChave(null), 2000);
  };

  const parseDiaSemanaNomeParaIndice = (diaNome?: string): DiaSemanaIndice => {
    if (!diaNome) return 1;
    const norm = diaNome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (norm.includes('segunda') || norm.includes('seg')) return 1;
    if (norm.includes('terca') || norm.includes('ter')) return 2;
    if (norm.includes('quarta') || norm.includes('qua')) return 3;
    if (norm.includes('quinta') || norm.includes('qui')) return 4;
    if (norm.includes('sexta') || norm.includes('sex')) return 5;
    if (norm.includes('sabado') || norm.includes('sab')) return 6;
    if (norm.includes('domingo') || norm.includes('dom')) return 0;
    return 1;
  };

  const calcularDatasSessoes = (
    dataInicioStr: string,
    quantidade: number,
    pacienteNomeOuId?: string
  ): string[] => {
    if (!dataInicioStr) return [];

    let diaAlvo: DiaSemanaIndice = 1; // Padrão: Segunda-feira
    if (pacienteNomeOuId) {
      const termoNorm = pacienteNomeOuId.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const todosPacientes = PacientesService.obterPacientes();
      const pac = todosPacientes.find((p) => {
        const nomeNorm = p.nome.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        return (
          p.id === pacienteNomeOuId ||
          nomeNorm === termoNorm ||
          nomeNorm.includes(termoNorm) ||
          termoNorm.includes(nomeNorm)
        );
      });
      if (pac?.diaDaSemana) {
        diaAlvo = parseDiaSemanaNomeParaIndice(pac.diaDaSemana);
      }
    }

    return calcularDatasSessoesAlinhadas({
      dataInicioStr,
      quantidade,
      diaSemanaHabitual: diaAlvo,
      showMonthInitials,
    });
  };

  const guiasFiltradas = guias.filter((guia) => {
    if (statusFiltro !== 'TODOS' && guia.status !== statusFiltro) return false;

    // Filtro por Data Início / Fim (Período)
    if (filtroDataInicio && (guia.dataColocacaoPasta < filtroDataInicio && (guia.dataDigitacao || '') < filtroDataInicio)) {
      return false;
    }
    if (filtroDataFim && (guia.dataColocacaoPasta > filtroDataFim && (guia.dataDigitacao || '') > filtroDataFim)) {
      return false;
    }

    // Busca Global
    if (busca.trim()) {
      const matchNum = matchTextFilter(guia.numeroGuia, busca);
      const matchConta = matchTextFilter(guia.numeroConta, busca);
      const matchPac = matchTextFilter(guia.pacienteNome, busca);
      const matchPrest = matchTextFilter(guia.prestadorNome, busca);
      const matchPasta = matchTextFilter(guia.pastaDoutora, busca);
      const matchResp = matchTextFilter(guia.responsavelDigitacao, busca);
      const matchDataPasta = matchDateFilter(guia.dataColocacaoPasta, busca);
      const matchDataDig = matchDateFilter(guia.dataDigitacao, busca);

      if (!matchNum && !matchConta && !matchPac && !matchPrest && !matchPasta && !matchResp && !matchDataPasta && !matchDataDig) {
        return false;
      }
    }

    // Filtros de Coluna
    if (filtrosColunas.numeroGuia) {
      const matchNum = matchTextFilter(guia.numeroGuia, filtrosColunas.numeroGuia);
      const matchConta = matchTextFilter(guia.numeroConta, filtrosColunas.numeroGuia);
      if (!matchNum && !matchConta) return false;
    }

    if (filtrosColunas.paciente && !matchTextFilter(guia.pacienteNome, filtrosColunas.paciente)) {
      return false;
    }

    if (filtrosColunas.pastaDoutora) {
      const matchPasta = matchTextFilter(guia.pastaDoutora, filtrosColunas.pastaDoutora);
      const matchPrest = matchTextFilter(guia.prestadorNome, filtrosColunas.pastaDoutora);
      const matchDur = String(guia.duracaoHoras || '').includes(filtrosColunas.pastaDoutora.trim());
      if (!matchPasta && !matchPrest && !matchDur) return false;
    }

    if (filtrosColunas.dataPasta && !matchDateFilter(guia.dataColocacaoPasta, filtrosColunas.dataPasta)) {
      return false;
    }

    if (filtrosColunas.dataDigitacao) {
      const matchDataDig = matchDateFilter(guia.dataDigitacao, filtrosColunas.dataDigitacao);
      const matchResp = matchTextFilter(guia.responsavelDigitacao, filtrosColunas.dataDigitacao);
      if (!matchDataDig && !matchResp) return false;
    }

    if (filtrosColunas.status && guia.status !== filtrosColunas.status) {
      return false;
    }

    return true;
  });

  const autorizacoesConcluidasFiltradas = autorizacoesConcluidas.filter((aut) => {
    if (!busca) return true;
    const t = busca.toLowerCase();
    return (
      aut.pacienteNome.toLowerCase().includes(t) ||
      aut.procedimento.toLowerCase().includes(t) ||
      aut.prestador.toLowerCase().includes(t) ||
      aut.responsavel.toLowerCase().includes(t)
    );
  });

  const handleSelecionarProcedimento = (codigo: string) => {
    setCodigoProcedimentoSelecionado(codigo);
    const proc = todosProcedimentos.find((p) => p.codigo === codigo);
    if (proc) {
      setNovoProcedimento(proc.descricao);
      if (!proc.permiteDigitacao) {
        setErroBloqueioProcedimento(
          `REGRA CLÍNICA MEFISA: "${proc.descricao}" (cód. ${proc.codigo}) é uma Avaliação/Reavaliação e NÃO PODE ser colocada em Digitações operacionais.`
        );
      } else {
        setErroBloqueioProcedimento(null);
      }
    }
  };

  const handleValidarERegistrarGuia = () => {
    const validacaoProc = ProcedimentosService.validarInclusaoEmDigitacao(codigoProcedimentoSelecionado);
    if (!validacaoProc.permitido) {
      setErroBloqueioProcedimento(
        validacaoProc.motivoBloqueio || 'Este procedimento é exclusivo de Autorização prévia e está BLOQUEADO para digitação de guias.'
      );
      return;
    }

    const baseVerificacao = guias.map((g) => ({
      id: g.id,
      pacienteNome: g.pacienteNome,
      procedimentoNome: novoProcedimento,
      dataSessao: g.dataDigitacao || g.dataAutorizacao,
      numeroGuia: g.numeroGuia,
      status: g.status,
    }));

    const validacao = validarDuplicidadeGuia(
      {
        pacienteNome: novoPaciente,
        procedimentoNome: novoProcedimento,
        dataSessao: novaDataSessao,
        numeroGuia: novoNumeroGuia,
      },
      baseVerificacao
    );

    setResultadoDuplicidade(validacao);

    if (validacao.duplicada) {
      return;
    }

    concluirCadastroGuia();
  };

  const concluirCadastroGuia = () => {
    const novaGuia = {
      id: `guia-${Date.now()}`,
      numeroGuia: novoNumeroGuia,
      autorizacaoId: 'aut-novo',
      pacienteId: 'pac-novo',
      pacienteNome: novoPaciente,
      prestadorId: 'prest-1',
      prestadorNome: 'Dra. Camila Rocha',
      convenioNome: 'SulAmérica Saúde',
      dataAutorizacao: novaDataSessao,
      dataColocacaoPasta: novaDataSessao,
      pastaDoutora: 'Sala Virtual / Presencial 01',
      duracaoHoras: 1 as const,
      responsavelColocacaoPasta: 'Maria Clara Fonseca',
      dataRetorno: novaDataSessao,
      responsavelColherGuia: 'Ana Beatriz Silveira',
      dataDigitacao: novaDataSessao,
      responsavelDigitacao: 'Ana Beatriz Silveira',
      status: 'DIGITADA_FATURADA' as const,
      duplicidadeDetectada: false,
    };

    setGuias([novaGuia, ...guias]);
    setModalNovoAberto(false);
    setResultadoDuplicidade(null);
    setErroBloqueioProcedimento(null);
    alert(`Guia ${novoNumeroGuia} cadastrada com sucesso!`);
  };

  const handleDeletarGuiasSelecionadas = () => {
    if (idsGuiasSelecionadas.length === 0) return;
    const novasGuias = guias.filter(g => !idsGuiasSelecionadas.includes(g.id));
    setGuias(novasGuias);
    setIdsGuiasSelecionadas([]);
  };

  const handleDeletarGuiaUnica = (id: string, numero: string) => {
    const novas = guias.filter(g => g.id !== id);
    setGuias(novas);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold font-['Quicksand'] text-slate-900 dark:text-white">
              Faturamentos & Rastreabilidade
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800">
              Sincronizado com Autorizações Concluídas
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-300 mt-0.5">
            Autorizações concluídas aparecem automaticamente aqui com dados prontos para cópia em 1 clique.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setModalProcedimentosAberto(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors shadow-2xs"
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Procedimentos & Preços ABA</span>
          </button>

          <button
            onClick={() => {
              setModalNovoAberto(true);
              setErroBloqueioProcedimento(null);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#002172] hover:bg-[#001752] text-white rounded-xl font-bold text-xs shadow-md transition-colors"
          >
            <Plus className="w-4 h-4 text-[#91CA0C]" />
            <span>+ Nova Guia / Digitação</span>
          </button>

          {idsGuiasSelecionadas.length > 0 && (
            <button
              onClick={handleDeletarGuiasSelecionadas}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-xs animate-in fade-in"
            >
              <X className="w-4 h-4" />
              <span>Deletar Selecionadas ({idsGuiasSelecionadas.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* SEÇÃO 1: AUTORIZAÇÕES CONCLUÍDAS (PRONTAS PARA CÓPIA EM 1 CLIQUE) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-sm text-slate-900 dark:text-white font-['Quicksand']">
              Autorizações Concluídas Prontas para Digitação ({autorizacoesConcluidas.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-400">Clique em qualquer guia para abrir a aba lateral com cópia em 1 clique</span>
        </div>

        {autorizacoesConcluidasFiltradas.length === 0 ? (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
            Nenhuma autorização marcada como CONCLUÍDO no Centro de Controle até o momento.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {autorizacoesConcluidasFiltradas.map((aut) => (
              <div
                key={aut.id}
                onClick={() => handleAbrirDrawerGuiaConcluida(aut)}
                className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/80 hover:border-emerald-400 dark:hover:border-emerald-600 shadow-2xs cursor-pointer transition-all space-y-3 group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-bold rounded-bl-xl">
                  Pronto p/ Copiar
                </div>

                <div className="space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white text-base group-hover:text-[#002172] transition-colors">
                    {aut.pacienteNome}
                  </div>
                  <div className="text-xs text-[#002172] dark:text-blue-400 font-bold">
                    {aut.procedimento}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500">
                  <div>
                    <span>Autorizado em:</span>
                    <strong className="block text-slate-800 dark:text-slate-200 font-mono">{formatarDataBr(aut.dataAutorizacao || aut.dataSolicitacao, showMonthInitials)}</strong>
                  </div>
                  <div>
                    <span>Por quem:</span>
                    <strong className="block text-slate-800 dark:text-slate-200">{aut.responsavel}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SEÇÃO 2: TABELA PADRÃO DE DIGITAÇÃO DE GUIAS */}
      <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="font-bold text-sm text-slate-900 dark:text-white font-['Quicksand']">
            Histórico Operacional de Guias Digitadas & Faturamento ({guiasFiltradas.length})
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
              <input
                type="text"
                placeholder="Buscar guias..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
              />
            </div>

            <input
              type="date"
              value={filtroDataInicio}
              onChange={(e) => setFiltroDataInicio(e.target.value)}
              title="Data Início"
              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            />
            <span className="text-slate-400 text-xs">até</span>
            <input
              type="date"
              value={filtroDataFim}
              onChange={(e) => setFiltroDataFim(e.target.value)}
              title="Data Fim"
              className="px-2 py-1 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white"
            />

            {temFiltrosAtivos && (
              <button
                onClick={limparFiltros}
                className="px-2.5 py-1.5 text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        <TopScrollTableWrapper tableTitle="Lista de Guias & Digitações">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px]">
                <th className="p-3 w-10 align-top">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-[#002172] focus:ring-[#002172] cursor-pointer mt-1"
                    checked={guiasFiltradas.length > 0 && idsGuiasSelecionadas.length === guiasFiltradas.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setIdsGuiasSelecionadas(guiasFiltradas.map(g => g.id));
                      } else {
                        setIdsGuiasSelecionadas([]);
                      }
                    }}
                  />
                </th>
                <th className="p-3">
                  <div>Nº da Guia / Conta</div>
                  <input
                    type="text"
                    placeholder="Guia/conta..."
                    value={filtrosColunas.numeroGuia}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, numeroGuia: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  />
                </th>
                <th className="p-3">
                  <div>Paciente</div>
                  <input
                    type="text"
                    placeholder="Filtrar paciente..."
                    value={filtrosColunas.paciente}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, paciente: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  />
                </th>
                <th className="p-3">
                  <div>Pasta Doutora & Duração</div>
                  <input
                    type="text"
                    placeholder="Doutora/prestador..."
                    value={filtrosColunas.pastaDoutora}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, pastaDoutora: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-[11px] font-normal lowercase bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  />
                </th>
                <th className="p-3">
                  <div>Data Pasta</div>
                  <input
                    type="text"
                    placeholder="Data..."
                    value={filtrosColunas.dataPasta}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, dataPasta: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  />
                </th>
                <th className="p-3">
                  <div>Data & Quem Digitou</div>
                  <input
                    type="text"
                    placeholder="Data ou quem..."
                    value={filtrosColunas.dataDigitacao}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, dataDigitacao: e.target.value })}
                    className="mt-1 w-full px-2 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  />
                </th>
                <th className="p-3">
                  <div>Status</div>
                  <select
                    value={filtrosColunas.status}
                    onChange={(e) => setFiltrosColunas({ ...filtrosColunas, status: e.target.value })}
                    className="mt-1 w-full px-1 py-1 text-[11px] font-normal normal-case bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded text-slate-900 dark:text-white focus:outline-blue-600"
                  >
                    <option value="">Todos</option>
                    <option value="DIGITADA_FATURADA">Digitada & Faturada</option>
                    <option value="DIGITADA">Digitada</option>
                  </select>
                </th>
                <th className="p-3 text-right">
                  <div>Ações</div>
                  <div className="mt-1 flex justify-end items-center h-6">
                    {temFiltrosAtivos && (
                      <button
                        onClick={limparFiltros}
                        title="Limpar todos os filtros"
                        className="px-2 py-0.5 rounded bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 hover:bg-red-200 text-[10px] font-bold transition-colors cursor-pointer"
                      >
                        Limpar
                      </button>
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {guiasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    Nenhuma guia encontrada.
                  </td>
                </tr>
              ) : (
                guiasFiltradas.map((guia) => (
                  <tr key={guia.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 w-10">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-[#002172] focus:ring-[#002172] cursor-pointer"
                        checked={idsGuiasSelecionadas.includes(guia.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIdsGuiasSelecionadas([...idsGuiasSelecionadas, guia.id]);
                          } else {
                            setIdsGuiasSelecionadas(idsGuiasSelecionadas.filter(id => id !== guia.id));
                          }
                        }}
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-[#002172] dark:text-blue-400">
                      <div>{guia.numeroGuia}</div>
                      {guia.numeroConta && (
                        <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">Conta: {guia.numeroConta}</div>
                      )}
                    </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">{guia.pacienteNome}</td>
                  <td className="p-3">
                    <div>{guia.pastaDoutora}</div>
                    <div className="text-[10px] text-slate-400">{guia.duracaoHoras}h de sessão</div>
                  </td>
                  <td className="p-3 font-mono text-[11px]">{formatarDataBr(guia.dataColocacaoPasta)}</td>
                  <td className="p-3">
                    <div>{formatarDataBr(guia.dataDigitacao)}</div>
                    <div className="text-[10px] text-slate-400">{guia.responsavelDigitacao}</div>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      Digitada & Faturada
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => handleDeletarGuiaUnica(guia.id, guia.numeroGuia)}
                      title="Deletar Guia"
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-950/70 dark:text-red-300 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </TopScrollTableWrapper>
      </div>

      {/* ABA LATERAL (DRAWER) COM OS 12 ITENS E CÓPIA EM 1 CLIQUE */}
      {guiaSelecionadaDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
            {/* Header Drawer */}
            <div className="bg-[#002172] text-white p-5 flex items-center justify-between shrink-0">
              <div className="space-y-0.5">
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-900 text-blue-200 font-mono">
                  Guia Autorizada Concluída
                </span>
                <h3 className="font-bold text-lg font-['Quicksand']">{guiaSelecionadaDrawer.pacienteNome}</h3>
                <p className="text-xs text-blue-100">{guiaSelecionadaDrawer.procedimento} · Autorizado em {formatarDataBr(guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao, showMonthInitials)}</p>
              </div>
              <button
                onClick={() => setGuiaSelecionadaDrawer(null)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo com os 12 Itens e Cópia em 1 Clique */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl text-[11px] text-blue-900 dark:text-blue-200">
                ✨ Clique no botão <strong>Copiar</strong> ao lado de cada item para copiar instantaneamente para a área de transferência.
              </div>

              <div className="space-y-3">
                {/* 1. Carteirinha */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">1. Carteirinha do Paciente</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{guiaSelecionadaDrawer.carteirinha}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(guiaSelecionadaDrawer.carteirinha, 'cart')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'cart' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'cart' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 2. Número da Guia */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">2. Número da Guia</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{guiaSelecionadaDrawer.numeroAutorizacao || 'N/A'}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(guiaSelecionadaDrawer.numeroAutorizacao || 'N/A', 'numeroGuia')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'numeroGuia' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'numeroGuia' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 3. Senha */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">3. Senha da Autorização</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{guiaSelecionadaDrawer.senha || 'SENHA-EXEMPLO-99'}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(guiaSelecionadaDrawer.senha || 'SENHA-EXEMPLO-99', 'senha')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'senha' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'senha' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 4. Data da Autorização */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">4. Data da Autorização</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{formatarDataBr(guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao, showMonthInitials)}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(formatarDataBr(guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao, showMonthInitials), 'dataAut')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'dataAut' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'dataAut' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 5. Data da Validade da Senha */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">5. Data da Validade da Senha</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{formatarDataBr(guiaSelecionadaDrawer.dataValidadeSenha || '2026-11-28', showMonthInitials)}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(formatarDataBr(guiaSelecionadaDrawer.dataValidadeSenha || '2026-11-28', showMonthInitials), 'valSenha')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'valSenha' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'valSenha' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 6. Nome do Prestador */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">6. Nome do Prestador</span>
                    <div className="font-bold text-slate-900 dark:text-white text-sm">{guiaSelecionadaDrawer.prestador}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(guiaSelecionadaDrawer.prestador, 'prestador')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'prestador' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'prestador' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 7. UF do Prestador */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">7. UF do Prestador</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">SP</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique('SP', 'uf')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'uf' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'uf' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 8. CRM do Prestador */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">8. Número do CRM / Registro</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{guiaSelecionadaDrawer.crm || '06/12345'}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(guiaSelecionadaDrawer.crm || '06/12345', 'crm')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'crm' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'crm' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 9. CBO do Prestador */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">9. CBO do Prestador</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{sanitizarCbo(guiaSelecionadaDrawer.cbo) || '251510'}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(sanitizarCbo(guiaSelecionadaDrawer.cbo) || '251510', 'cbo')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'cbo' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'cbo' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 10. Data da Solicitação */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">10. Data da Solicitação</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">{formatarDataBr(guiaSelecionadaDrawer.dataSolicitacao, showMonthInitials)}</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique(formatarDataBr(guiaSelecionadaDrawer.dataSolicitacao, showMonthInitials), 'dataSol')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'dataSol' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'dataSol' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 11. Indicação Clínica */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">11. Indicação Clínica</span>
                    <div className="font-mono font-bold text-slate-900 dark:text-white text-sm">F84</div>
                  </div>
                  <button
                    onClick={() => handleCopiar1Clique('F84', 'indicacao')}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                  >
                    {copiadoChave === 'indicacao' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiadoChave === 'indicacao' ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>

                {/* 12. Datas das Sessões Calculadas */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">12. Datas das Sessões Calculadas ({guiaSelecionadaDrawer.quantidadeSolicitada} sessões)</span>
                    <button
                      onClick={() => handleCopiar1Clique(calcularDatasSessoes(guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao, guiaSelecionadaDrawer.quantidadeSolicitada, guiaSelecionadaDrawer.pacienteNome || guiaSelecionadaDrawer.pacienteId).join(', '), 'sessoes')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#002172] text-white font-bold text-[11px] hover:bg-[#001752] transition-colors shrink-0"
                    >
                      {copiadoChave === 'sessoes' ? <Check className="w-3.5 h-3.5 text-[#91CA0C]" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiadoChave === 'sessoes' ? 'Copiado!' : 'Copiar Todas'}</span>
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 font-mono text-xs">
                    {calcularDatasSessoes(guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao, guiaSelecionadaDrawer.quantidadeSolicitada, guiaSelecionadaDrawer.pacienteNome || guiaSelecionadaDrawer.pacienteId).map((dt, i) => (
                      <span key={i} className="px-2 py-0.5 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700 font-bold">
                        {dt}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bloco de Observações Obrigatórias do Rodapé */}
                {(() => {
                  const datasSessoesDrawer = calcularDatasSessoes(
                    guiaSelecionadaDrawer.dataAutorizacao || guiaSelecionadaDrawer.dataSolicitacao,
                    guiaSelecionadaDrawer.quantidadeSolicitada,
                    guiaSelecionadaDrawer.pacienteNome || guiaSelecionadaDrawer.pacienteId
                  );
                  const textoRepeticoes = formatarContagemRepeticoesSessoes(datasSessoesDrawer);
                  const temMesmoDia = !!textoRepeticoes;
                  const sessoesSemanaisCalc = calcularSessoesSemanaisJanela(datasSessoesDrawer);

                  const textoObs1 = `O paciente realizou, na mesma data em horarios diferentes, ${textoRepeticoes} sessoes pelo metodo ABA na clinica, conforme orientacao do formulario medico anexo a autorizacao.`;
                  const textoObs2 = `Observacao: Paciente realiza ${sessoesSemanaisCalc} sessoes semanais de acordo com avaliacao tecnica. Profissional: ${guiaSelecionadaDrawer.prestador} (${guiaSelecionadaDrawer.crm || 'CRP 06/12345'}).`;

                  return (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 rounded-xl space-y-3">
                      <span className="font-bold text-xs text-amber-900 dark:text-amber-200 uppercase block">Observações Recomendadas para Colagem:</span>
                      
                      {temMesmoDia && (
                        <div className="space-y-1 text-[11px]">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">Colar nas observações (Sessões no mesmo dia):</span>
                          <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                            <span>"{textoObs1}"</span>
                            <button
                              onClick={() => handleCopiar1Clique(textoObs1, 'obs1')}
                              className="p-1 rounded bg-[#002172] text-white shrink-0"
                            >
                              {copiadoChave === 'obs1' ? <Check className="w-3 h-3 text-[#91CA0C]" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1 text-[11px]">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Observação Profissional:</span>
                        <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-amber-200 dark:border-amber-800 font-medium text-slate-800 dark:text-slate-200 flex items-center justify-between gap-2">
                          <span>"{textoObs2}"</span>
                          <button
                            onClick={() => handleCopiar1Clique(textoObs2, 'obs2')}
                            className="p-1 rounded bg-[#002172] text-white shrink-0"
                          >
                            {copiadoChave === 'obs2' ? <Check className="w-3 h-3 text-[#91CA0C]" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex flex-col gap-3 shrink-0">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 rounded-xl space-y-3">
                <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-bold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Marcar como Digitada & Selecionar Pasta</span>
                </div>
                {erroNumeroConta && (
                  <div className="p-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg text-[11px] font-bold">
                    {erroNumeroConta}
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Doutora Atendente (Dona da Pasta) *
                  </label>
                  <select
                    value={pastaDoutoraInput}
                    onChange={(e) => setPastaDoutoraInput(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                  >
                    {MOCK_PRESTADORES.map((pres) => (
                      <option key={pres.id} value={pres.nome}>
                        {pres.nome} ({pres.orgaoClasse} {pres.crmOuCrp})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    Número da Conta *
                  </label>
                  <input
                    type="text"
                    placeholder="Digite o Número da Conta (Ex: CTA-9988)"
                    value={numeroContaInput}
                    onChange={(e) => {
                      setNumeroContaInput(e.target.value);
                      if (erroNumeroConta) setErroNumeroConta(null);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-white"
                  />
                </div>

                <button
                  onClick={handleMarcarComoDigitada}
                  className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Marcar como Digitada</span>
                </button>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setGuiaSelecionadaDrawer(null)}
                  className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs"
                >
                  Fechar Aba Lateral
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Nova Guia / Digitação */}
      {modalNovoAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="bg-[#002172] text-white px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base font-['Quicksand']">+ Nova Guia / Digitação</h3>
                <p className="text-xs text-blue-100">Validação estrita de Paciente + Procedimento + Data</p>
              </div>
              <button onClick={() => setModalNovoAberto(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[85vh] overflow-y-auto text-xs">
              {erroBloqueioProcedimento && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{erroBloqueioProcedimento}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Selecione o Procedimento (Apenas as 5 ABAS regulares)
                </label>
                <select
                  value={codigoProcedimentoSelecionado}
                  onChange={(e) => handleSelecionarProcedimento(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-medium text-slate-800 dark:text-white"
                >
                  {todosProcedimentos.map((p) => (
                    <option key={p.codigo} value={p.codigo}>
                      {p.codigo} - {p.descricao} ({p.categoria})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Paciente
                </label>
                <input
                  type="text"
                  value={novoPaciente}
                  onChange={(e) => setNovoPaciente(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-800 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Data da Sessão
                  </label>
                  <input
                    type="date"
                    value={novaDataSessao}
                    onChange={(e) => setNovaDataSessao(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Número da Guia
                  </label>
                  <input
                    type="text"
                    value={novoNumeroGuia}
                    onChange={(e) => setNovoNumeroGuia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl font-mono text-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {resultadoDuplicidade?.duplicada && (
                <div className="p-4 bg-amber-50 dark:bg-amber-950/60 border border-amber-300 rounded-xl space-y-2">
                  <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>POSSÍVEL DUPLICIDADE DETECTADA (REGRA 01 — OPÇÃO B)</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300">
                    Já existe uma guia para <strong>{novoPaciente}</strong> no procedimento <strong>{novoProcedimento}</strong> na data <strong>{novaDataSessao}</strong>.
                  </p>
                  <input
                    type="text"
                    value={justificativaDuplicidade}
                    onChange={(e) => setJustificativaDuplicidade(e.target.value)}
                    placeholder="Justificativa operacional obrigatória..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-amber-300 rounded-lg text-xs"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  onClick={() => setModalNovoAberto(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleValidarERegistrarGuia}
                  disabled={Boolean(procedimentoAtual && !procedimentoAtual.permiteDigitacao)}
                  className="px-5 py-2 bg-[#002172] hover:bg-[#001752] disabled:opacity-40 text-white rounded-xl font-bold text-xs"
                >
                  Validar e Salvar Guia
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Procedimentos & Preços ABA */}
      <GerenciarProcedimentosModal
        isOpen={modalProcedimentosAberto}
        onClose={() => setModalProcedimentosAberto(false)}
      />
    </div>
  );
};
