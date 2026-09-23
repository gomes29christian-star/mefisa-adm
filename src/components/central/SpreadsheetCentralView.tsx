import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  Download,
  Upload,
  Plus,
  History,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Clock,
  CloudCheck,
  ChevronRight,
  Shield,
  Layers,
  ArrowUpDown,
  ExternalLink,
  Laptop,
  Building,
} from 'lucide-react';
import {
  MOCK_PACIENTES,
  MOCK_PRESTADORES,
  MOCK_GUIAS,
  MOCK_AUTORIZACOES,
  MOCK_AUDITORIA,
} from '../../data/mockClinicData';
import { useTheme } from '../../context/ThemeContext';
import { useSecretAchievements } from '../../context/SecretAchievementsContext';

interface SpreadsheetCentralViewProps {
  onOpenAudit: () => void;
  onOpenCalculator: () => void;
  usuarioAtualNome: string;
}

export const SpreadsheetCentralView: React.FC<SpreadsheetCentralViewProps> = ({
  onOpenAudit,
  onOpenCalculator,
  usuarioAtualNome,
}) => {
  const { getThemeStrokeStyle } = useTheme();
  const { triggerSecretAction } = useSecretAchievements();

  // Filtros locais da sessão do usuário
  const [busca, setBusca] = useState('');
  const [convenioFiltro, setConvenioFiltro] = useState('todos');
  const [especialidadeFiltro, setEspecialidadeFiltro] = useState('todas');
  const [apenasPendencias, setApenasPendencias] = useState(false);
  const [modoDensidade, setModoDensidade] = useState<'confortavel' | 'compacta'>('confortavel');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [linhaEditandoId, setLinhaEditandoId] = useState<string | null>(null);

  // Combinação dos dados para a tabela demonstrativa
  const tabelaLinhas = useMemo(() => {
    return [
      {
        id: 'row-1',
        prontuario: '#PSI-2024-0891',
        pacienteNome: 'Lucas Gabriel Mendes',
        idade: '8 anos',
        responsavel: 'Mariana Mendes',
        especialidade: 'Psicologia Infantil (TCC)',
        terapeuta: 'Dra. Beatriz Albuquerque',
        registroClasse: 'CRP 06/12398',
        dataHora: '24/10/2026',
        horario: '09:00 - 09:50',
        modalidade: 'Presencial (Sala 02)',
        convenio: 'Unimed Fácil',
        faturamentoInfo: 'Faturado · Guia: #4912093-A',
        status: 'Validado' as const,
        categoriaEspecialidade: 'psicologia',
        temPendencia: false,
      },
      {
        id: 'row-2',
        prontuario: '#NEU-2024-0412',
        pacienteNome: 'Renato de Assis Carvalho',
        idade: '42 anos',
        responsavel: 'CPF: 231.***-90',
        especialidade: 'Avaliação Neuropsicológica',
        terapeuta: 'Dr. Marcos Vinicius Souza',
        registroClasse: 'CRP 06/77412',
        dataHora: '24/10/2026',
        horario: '10:00 - 11:30',
        modalidade: 'Presencial (Sala 05)',
        convenio: 'Particular',
        faturamentoInfo: 'Pago (Pix) · Recibo #RC-8921',
        status: 'Validado' as const,
        categoriaEspecialidade: 'neuro',
        temPendencia: false,
      },
      {
        id: 'row-3',
        prontuario: '#FIS-2024-1102',
        pacienteNome: 'Clara Silveira Peixoto',
        idade: '34 anos',
        responsavel: 'CPF: 450.***-18',
        especialidade: 'Fisioterapia & Reabilitação Motora',
        terapeuta: 'Dra. Juliana Brandão',
        registroClasse: 'CREFITO 3/99104',
        dataHora: '24/10/2026',
        horario: '11:00 - 11:50',
        modalidade: 'Box 03 (Reab)',
        convenio: 'Bradesco Saúde',
        faturamentoInfo: 'Pendente Guia · Anexar autorização',
        status: 'Revisar' as const,
        categoriaEspecialidade: 'fisio',
        temPendencia: true,
      },
      {
        id: 'row-4',
        prontuario: '#PSI-2024-0892',
        pacienteNome: 'Maurício Rezende Filho',
        idade: '29 anos',
        responsavel: 'CPF: 512.***-01',
        especialidade: 'Psicologia Clínica Adulto',
        terapeuta: 'Psic. Helena Tavares',
        registroClasse: 'CRP 06/44810',
        dataHora: '24/10/2026',
        horario: '13:30 - 14:20',
        modalidade: 'Teleconsulta (Link Gerado)',
        convenio: 'SulAmérica',
        faturamentoInfo: 'Faturado · Cod: #AUT-3912',
        status: 'Validado' as const,
        categoriaEspecialidade: 'psicologia',
        temPendencia: false,
      },
      {
        id: 'row-5',
        prontuario: '#FON-2024-0189',
        pacienteNome: 'Alice Pimentel Nogueira',
        idade: '5 anos',
        responsavel: 'TEA Nível 1 de Suporte',
        especialidade: 'Fonoaudiologia Integrada',
        terapeuta: 'Fga. Lorena Santos',
        registroClasse: 'CRFa 2/18920',
        dataHora: '24/10/2026',
        horario: '14:30 - 15:15',
        modalidade: 'Sala Sensorial 01',
        convenio: 'Amil Saúde',
        faturamentoInfo: 'Faturado · Lote: #AML-998',
        status: 'Validado' as const,
        categoriaEspecialidade: 'fono',
        temPendencia: false,
      },
      {
        id: 'row-6',
        prontuario: '#TO-2024-0319',
        pacienteNome: 'Eduardo Camargo Barros',
        idade: '11 anos',
        responsavel: 'Resp: Vanessa Barros',
        especialidade: 'Terapia Ocupacional',
        terapeuta: 'T.O. Patrícia Lins',
        registroClasse: 'CREFITO 3/10294',
        dataHora: '24/10/2026',
        horario: '15:30 - 16:20',
        modalidade: 'Ginásio T.O.',
        convenio: 'Porto Seguro',
        faturamentoInfo: 'Falta CID-11 · Campo em branco',
        status: 'Revisar' as const,
        categoriaEspecialidade: 'to',
        temPendencia: true,
      },
      {
        id: 'row-7',
        prontuario: '#PSI-2024-0893',
        pacienteNome: 'Talita Negrão Siqueira',
        idade: '38 anos',
        responsavel: 'CPF: 119.***-62',
        especialidade: 'TCC Adulto · Burnout',
        terapeuta: 'Dra. Beatriz Albuquerque',
        registroClasse: 'CRP 06/12398',
        dataHora: '24/10/2026',
        horario: '16:30 - 17:20',
        modalidade: 'Presencial (Sala 02)',
        convenio: 'Particular',
        faturamentoInfo: 'Cartão Autorizado · Terminal 01',
        status: 'Validado' as const,
        categoriaEspecialidade: 'psicologia',
        temPendencia: false,
      },
      {
        id: 'row-8',
        prontuario: '#FIS-2024-1103',
        pacienteNome: 'Guilherme Faria Ramos',
        idade: '6 anos',
        responsavel: 'Estimulação Precoce',
        especialidade: 'Fisioterapia Neurofuncional',
        terapeuta: 'Ft. Rodrigo Mattos',
        registroClasse: 'CREFITO 3/88341',
        dataHora: '24/10/2026',
        horario: '17:30 - 18:15',
        modalidade: 'Box 02 (Neuro)',
        convenio: 'Bradesco Saúde',
        faturamentoInfo: 'Faturado · Guia: #882901-B',
        status: 'Validado' as const,
        categoriaEspecialidade: 'fisio',
        temPendencia: false,
      },
    ];
  }, []);

  // Filtragem estritamente local (não afeta outros usuários)
  const linhasFiltradas = useMemo(() => {
    return tabelaLinhas.filter((row) => {
      if (apenasPendencias && !row.temPendencia) return false;

      if (convenioFiltro !== 'todos') {
        if (!row.convenio.toLowerCase().includes(convenioFiltro.toLowerCase())) {
          return false;
        }
      }

      if (especialidadeFiltro !== 'todas') {
        if (row.categoriaEspecialidade !== especialidadeFiltro) return false;
      }

      if (busca) {
        const termo = busca.toLowerCase();
        return (
          row.pacienteNome.toLowerCase().includes(termo) ||
          row.prontuario.toLowerCase().includes(termo) ||
          row.terapeuta.toLowerCase().includes(termo) ||
          row.convenio.toLowerCase().includes(termo)
        );
      }

      return true;
    });
  }, [tabelaLinhas, busca, convenioFiltro, especialidadeFiltro, apenasPendencias]);

  const toggleSelectAll = () => {
    if (selectedRows.length === linhasFiltradas.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(linhasFiltradas.map((r) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal com Tipografia Quicksand e Nunito Sans */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Módulo Unificado de Gestão Documental & Guias</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold font-['Quicksand'] text-slate-900 tracking-tight">
            Central de Dados & Planilhas Clínicas
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl font-['Nunito_Sans']">
            Organize, valide e migre os dados operacionais com ergonomia, segurança LGPD e
            rastreabilidade para a equipe da Clínica Mefisa.
          </p>
        </div>

        {/* Botões de Ação do Topo */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onOpenCalculator}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#002172] hover:bg-[#001752] text-white text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4 text-[#91CA0C]" />
            <span>+ Nova Linha / Registro</span>
          </button>

          <button
            onClick={() => alert('Simulação de Importação: Mapeador Inteligente ativado.')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/80 hover:bg-blue-100 text-[#002172] border border-blue-200/80 text-xs font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importar Planilha (XLSX / CSV)</span>
          </button>

          <button
            onClick={() => alert('Exportando relatório auditado em formato CSV...')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Exportar Relatório</span>
          </button>

          <button
            onClick={onOpenAudit}
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs transition-colors shadow-2xs"
            title="Abrir Histórico Completo de Auditoria"
          >
            <History className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Cards de Métricas e Indicadores Operacionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Linhas Processadas Hoje
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
              1.482 <span className="text-xs font-medium text-slate-500">registros</span>
            </div>
            <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
              <span>↗ +12% vs. ontem</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#002172] flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Planilhas Ativas Mapeadas
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono tabular-nums">
              8 <span className="text-xs font-medium text-slate-500">arquivos</span>
            </div>
            <div className="text-[10px] text-blue-700 font-medium mt-1 flex items-center gap-1">
              <span>Psico, Neuro, Fisio, Fat.</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#91CA0C] flex items-center justify-center">
            <Layers className="w-5 h-5 text-emerald-700" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Pendências de Validação
            </div>
            <div className="text-2xl font-extrabold text-amber-700 mt-1 font-mono tabular-nums">
              05 <span className="text-xs font-medium text-slate-500">inconsistências</span>
            </div>
            <div className="text-[10px] text-amber-800 font-bold mt-1 flex items-center gap-1">
              <span>⚠ Ação recomendada</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              Sincronização em Nuvem
            </div>
            <div className="text-lg font-bold text-slate-800 mt-1">
              Há 14 min
            </div>
            <div className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-600" />
              <span>100% íntegro & seguro</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-indigo-600" />
          </div>
        </div>
      </div>

      {/* Barra de Filtros e Busca Local por Usuário */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-3">
        {/* Linha 1 de Busca e Menus */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Campo de Busca Geral */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar por paciente, terapeuta, prontuário, CPF ou convênio..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-[#002172]"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro de Convênio */}
          <select
            value={convenioFiltro}
            onChange={(e) => setConvenioFiltro(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 font-medium focus:bg-white focus:outline-[#002172]"
          >
            <option value="todos">Convênio: Todos (Unimed, Bradesco, Particular, SulAmérica)</option>
            <option value="unimed">Unimed Fácil</option>
            <option value="bradesco">Bradesco Saúde</option>
            <option value="sulamerica">SulAmérica Saúde</option>
            <option value="amil">Amil Saúde</option>
            <option value="particular">Particular</option>
          </select>

          {/* Seletor de Período Mês */}
          <div className="px-3 py-2 text-xs bg-slate-50/80 border border-slate-200 rounded-xl text-slate-700 font-medium whitespace-nowrap">
            📅 Mês: Outubro / 2026
          </div>

          {/* Botão Apenas Pendências */}
          <button
            onClick={() => setApenasPendencias(!apenasPendencias)}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs rounded-xl font-bold transition-colors whitespace-nowrap ${
              apenasPendencias
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            <span>Apenas Pendências (5)</span>
          </button>
        </div>

        {/* Linha 2: Segmented Tabs de Especialidades e Densidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'todas', label: 'Todas as Especialidades (148)' },
              { id: 'psicologia', label: 'Psicologia Clínica' },
              { id: 'neuro', label: 'Neuropsicologia' },
              { id: 'fisio', label: 'Fisioterapia & Reabilitação' },
              { id: 'fono', label: 'Fonoaudiologia & T.O.' },
            ].map((tab) => {
              const active = especialidadeFiltro === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setEspecialidadeFiltro(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    active
                      ? 'bg-[#002172] text-white shadow-2xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span className={active ? getThemeStrokeStyle('text') : ''}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Alternador Confortável / Compacta */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setModoDensidade('confortavel')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                modoDensidade === 'confortavel'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Confortável
            </button>
            <button
              onClick={() => setModoDensidade('compacta')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                modoDensidade === 'compacta'
                  ? 'bg-white text-slate-800 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Compacta
            </button>
          </div>
        </div>
      </div>

      {/* Tabela de Dados & Planilhas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-bold tracking-wider uppercase text-[10px]">
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedRows.length === linhasFiltradas.length &&
                      linhasFiltradas.length > 0
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-[#002172] focus:ring-0"
                  />
                </th>
                <th className="p-3">Cód / Prontuário</th>
                <th className="p-3">Paciente</th>
                <th className="p-3">Especialidade & Terapeuta</th>
                <th className="p-3">Data / Horário</th>
                <th className="p-3">Modalidade</th>
                <th className="p-3">Convênio / Faturamento</th>
                <th className="p-3 text-center">Status Dados</th>
                <th className="p-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {linhasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400 text-xs">
                    Nenhum registro encontrado para os filtros selecionados na sua sessão.
                  </td>
                </tr>
              ) : (
                linhasFiltradas.map((row) => {
                  const isSelected = selectedRows.includes(row.id);
                  const isCompact = modoDensidade === 'compacta';

                  return (
                    <tr
                      key={row.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        isSelected ? 'bg-blue-50/60' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(row.id)}
                          className="rounded border-slate-300 text-[#002172] focus:ring-0"
                        />
                      </td>

                      {/* Prontuário */}
                      <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                        {row.prontuario}
                      </td>

                      {/* Paciente com Avatar de Iniciais */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#002172] font-bold text-[11px] flex items-center justify-center shrink-0">
                            {row.pacienteNome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">
                              {row.pacienteNome}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {row.idade} · {row.responsavel}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Especialidade & Terapeuta */}
                      <td className="p-3">
                        <div className="font-semibold text-slate-800 leading-tight">
                          {row.especialidade}
                        </div>
                        <div className="text-[10.5px] text-[#2A657E]">
                          {row.terapeuta}{' '}
                          <span className="text-slate-400 font-mono">
                            ({row.registroClasse})
                          </span>
                        </div>
                      </td>

                      {/* Data & Horário */}
                      <td className="p-3 whitespace-nowrap">
                        <div className="font-bold text-slate-800 font-mono">
                          {row.dataHora}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {row.horario}
                        </div>
                      </td>

                      {/* Modalidade */}
                      <td className="p-3 whitespace-nowrap text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          {row.modalidade.includes('Tele') ? (
                            <Laptop className="w-3.5 h-3.5 text-blue-600" />
                          ) : (
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          <span>{row.modalidade}</span>
                        </div>
                      </td>

                      {/* Convênio & Faturamento */}
                      <td className="p-3">
                        <div className="font-bold text-slate-800">
                          {row.convenio}
                        </div>
                        <div
                          className={`text-[10.5px] ${
                            row.temPendencia
                              ? 'text-amber-800 font-medium'
                              : 'text-slate-500 font-mono'
                          }`}
                        >
                          {row.faturamentoInfo}
                        </div>
                      </td>

                      {/* Status Dados */}
                      <td className="p-3 text-center whitespace-nowrap">
                        {row.status === 'Validado' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Validado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Revisar
                          </span>
                        )}
                      </td>

                      {/* Ação */}
                      <td className="p-3 text-right whitespace-nowrap">
                        <button
                          onClick={onOpenAudit}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors"
                        >
                          Histórico
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da Tabela com Paginação */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Mostrando <strong>1 a {linhasFiltradas.length}</strong> de <strong>148</strong> registros de atendimentos
            <span className="text-slate-400 ml-2">· Tempo de resposta: 18ms</span>
          </div>

          <div className="flex items-center gap-1 self-center">
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 disabled:opacity-50">
              ‹
            </button>
            <button className="px-3 py-1 rounded-lg bg-[#002172] text-white font-bold">
              1
            </button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              2
            </button>
            <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="px-3 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700">
              19
            </button>
            <button className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600">
              ›
            </button>
          </div>
        </div>
      </div>

      {/* Seção Inferior: Área de Transição & Importação Direta + Guia Rápido & Atalhos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dropzone de Transição de Planilhas Legadas */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">
                  Área de Transição & Importação Direta
                </h3>
                <p className="text-[11px] text-slate-400">
                  Arraste aqui suas planilhas legadas de Psicologia, Neuro, Fisio ou Faturamento
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
              Suporta .XLSX, .CSV, .ODS
            </span>
          </div>

          <div
            onClick={() => alert('Simulação: Clique para selecionar o arquivo .XLSX das planilhas legadas da SulAmérica/Tivita.')}
            className="border-2 border-dashed border-slate-200 hover:border-[#002172] rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white shadow-2xs border border-slate-200 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="text-xs font-semibold text-slate-800">
              Arraste e solte o arquivo aqui ou{' '}
              <span className="text-emerald-700 underline font-bold">clique para procurar</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 max-w-md mx-auto">
              O algoritmo de auto-associação da Clínica Mefisa mapeará nomes de terapeutas, CPFs de pacientes e valores de faturamento automaticamente.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mapeador inteligente de colunas ativado (taxa de acerto: 99,4%)</span>
            </div>
            <a href="#modelos" className="text-blue-700 hover:underline">
              Ver modelos de planilha recomendados →
            </a>
          </div>
        </div>

        {/* Guia Rápido & Atalhos Ergonomicos */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#002172] flex items-center justify-center">
                <Laptop className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">
                Guia Rápido & Atalhos
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mb-4 leading-normal">
              Projetado para eliminar a frustração de dezenas de arquivos espalhados. Use atalhos ergonômicos no teclado:
            </p>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Pesquisa Rápida Global</span>
                <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 shadow-2xs text-[10px] font-mono font-bold text-slate-700">
                  Ctrl + F
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Inserir Nova Linha</span>
                <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 shadow-2xs text-[10px] font-mono font-bold text-slate-700">
                  Alt + N
                </kbd>
              </div>

              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600">Salvar & Validar Linha</span>
                <kbd className="px-2 py-0.5 rounded bg-white border border-slate-300 shadow-2xs text-[10px] font-mono font-bold text-slate-700">
                  Ctrl + Enter
                </kbd>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[11px] text-slate-600 font-medium">Suporte Interno Disponível</span>
            </div>
            <button
              onClick={() => alert('Canal de suporte e treinamento administrativo da Clínica Mefisa.')}
              className="px-3 py-1.5 text-xs font-bold rounded-xl bg-[#002172] text-white hover:bg-[#001752] transition-colors"
            >
              Chamar Suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
