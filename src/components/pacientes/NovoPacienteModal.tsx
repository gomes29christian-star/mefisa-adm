import React, { useState, useRef } from 'react';
import {
  UserPlus,
  FileText,
  Calendar,
  AlertTriangle,
  Upload,
  Printer,
  Download,
  Shield,
  Check,
  X,
  FileCheck,
  FileType,
  Image as ImageIcon,
} from 'lucide-react';
import { Paciente, PapelUsuario, ResultadoVerificacaoDuplicidadePaciente } from '../../types/clinic';
import {
  PacientesService,
  calcularVencimentoFormulario,
  mascararCpf,
} from '../../services/pacientesService';
import { MOCK_CONVENIOS, MOCK_PRESTADORES } from '../../data/mockClinicData';
import { DuplicidadeAlertaModal } from './DuplicidadeAlertaModal';

interface NovoPacienteModalProps {
  usuarioAtual: { nome: string; papel: PapelUsuario };
  onFechar: () => void;
  onPacienteCriado: (novoPaciente: Paciente) => void;
  onAbrirPacienteExistente: (paciente: Paciente) => void;
}

interface FormularioImportadoState {
  nomeArquivo: string;
  tipoArquivo: 'pdf' | 'jpeg';
  tamanhoKb: number;
  dataEmissao: string;
  arquivoUrl?: string;
}

export const NovoPacienteModal: React.FC<NovoPacienteModalProps> = ({
  usuarioAtual,
  onFechar,
  onPacienteCriado,
  onAbrirPacienteExistente,
}) => {
  // Dados do Paciente (Data de Nascimento RETIRADA)
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [convenioId, setConvenioId] = useState('conv-1');
  const [carteirinha, setCarteirinha] = useState('');
  const [procedimentoPrincipal, setProcedimentoPrincipal] = useState('Psicoterapia ABA / TCC Individual');
  const [prestadorId, setPrestadorId] = useState('prest-1');
  const [diaDaSemana, setDiaDaSemana] = useState('Segunda-feira');
  const [doutoresAtendentesIds, setDoutoresAtendentesIds] = useState<string[]>(['prest-1']);
  const [pesquisaPrestadorInput, setPesquisaPrestadorInput] = useState('');
  const [dropdownPrestadorAberto, setDropdownPrestadorAberto] = useState(false);

  // Responsável Legal (INFORMAÇÕES NÃO OBRIGATÓRIAS)
  const [respNome, setRespNome] = useState('');
  const [respParentesco, setRespParentesco] = useState('Mãe');
  const [respTelefone, setRespTelefone] = useState('');
  const [respEmail, setRespEmail] = useState('');

  // Formulário do Paciente (IMPORTAÇÃO OBRIGATÓRIA PARA BAIXAR/IMPRIMIR)
  // Formato é auto-identificado (sem opção de selecionar manualmente)
  const [formularioImportado, setFormularioImportado] = useState<FormularioImportadoState | null>(null);
  const [formDataEmissao, setFormDataEmissao] = useState(new Date().toISOString().slice(0, 10));

  // Validação e Duplicidade
  const [erro, setErro] = useState('');
  const [duplicidadeAlerta, setDuplicidadeAlerta] = useState<ResultadoVerificacaoDuplicidadePaciente | null>(null);
  const [salvando, setSalvando] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // REGRA DO FORMULÁRIO: cálculo automático em exatamente 180 dias
  const vencimentoFormularioInfo = calcularVencimentoFormulario(
    formDataEmissao || new Date().toISOString().slice(0, 10)
  );

  /**
   * Processa o arquivo selecionado ou arrastado
   * Identifica automaticamente o formato (.pdf ou .jpeg) sem exigir seleção manual
   */
  const processarArquivoImportado = (file: File) => {
    const nome = file.name;
    const extensao = nome.split('.').pop()?.toLowerCase();

    // Auto-identificação do formato
    let tipoIdentificado: 'pdf' | 'jpeg' = 'pdf';
    if (extensao === 'jpeg' || extensao === 'jpg' || file.type.includes('jpeg') || file.type.includes('jpg')) {
      tipoIdentificado = 'jpeg';
    } else {
      tipoIdentificado = 'pdf';
    }

    const tamanhoKb = Math.round(file.size / 1024) || 320;
    const url = URL.createObjectURL(file);

    setFormularioImportado({
      nomeArquivo: nome,
      tipoArquivo: tipoIdentificado,
      tamanhoKb,
      dataEmissao: formDataEmissao,
      arquivoUrl: url,
    });
    setErro('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processarArquivoImportado(e.target.files[0]);
    }
  };

  /**
   * Importação simulada para agilizar testes no ambiente web
   */
  const handleSimularImportacao = (tipo: 'pdf' | 'jpeg') => {
    const nomeArquivo =
      tipo === 'pdf'
        ? `formulario_paciente_${nome ? nome.toLowerCase().replace(/\s+/g, '_') : 'cadastro'}.pdf`
        : `formulario_paciente_${nome ? nome.toLowerCase().replace(/\s+/g, '_') : 'cadastro'}.jpeg`;

    const blob = new Blob(
      [tipo === 'pdf' ? '%PDF-1.4 Formulário Mefisa Oficial' : 'JPEG_RAW_DATA_SIMULATED'],
      { type: tipo === 'pdf' ? 'application/pdf' : 'image/jpeg' }
    );
    const url = URL.createObjectURL(blob);

    setFormularioImportado({
      nomeArquivo,
      tipoArquivo: tipo,
      tamanhoKb: tipo === 'pdf' ? 1420 : 890,
      dataEmissao: formDataEmissao,
      arquivoUrl: url,
    });
    setErro('');
  };

  /**
   * Ação de Download — Habilitada SÓ DEPOIS de importar
   */
  const handleBaixarFormulario = () => {
    if (!formularioImportado) return;

    if (formularioImportado.arquivoUrl) {
      const a = document.createElement('a');
      a.href = formularioImportado.arquivoUrl;
      a.download = formularioImportado.nomeArquivo;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      alert(`Download do arquivo importado "${formularioImportado.nomeArquivo}" iniciado com sucesso.`);
    }
  };

  /**
   * Ação de Impressão — Habilitada SÓ DEPOIS de importar
   */
  const handleImprimirFormulario = () => {
    if (!formularioImportado) return;
    window.print();
  };

  // Execução do Salvamento
  const executarCriacao = (justificativaDuplicidade?: string) => {
    setSalvando(true);
    try {
      const convObj = MOCK_CONVENIOS.find((c) => c.id === convenioId) || {
        id: convenioId,
        nome: 'SulAmérica Saúde',
      };
      const prestObj = MOCK_PRESTADORES.find((p) => p.id === prestadorId);

      const novoPacDados = {
        nome: nome.trim(),
        // Data de nascimento e idade não mais exigidos/solicitados
        dataNascimento: undefined,
        idade: undefined,
        cpf: cpf.trim() || undefined,
        cpfMascarado: mascararCpf(cpf.trim()),
        carteirinha: carteirinha.trim(),
        carteirinhaAtual: carteirinha.trim(),
        convenioId: convObj.id,
        convenioNome: convObj.nome,
        convenioPrincipalId: convObj.id,
        convenioPrincipalNome: convObj.nome,
        procedimentoPrincipal: procedimentoPrincipal.trim(),
        prestadorId,
        prestadorNome: prestObj ? prestObj.nome : 'Dra. Beatriz Albuquerque',
        doutoresAtendentesIds,
        doutoresAtendentesNomes: MOCK_PRESTADORES.filter(p => doutoresAtendentesIds.includes(p.id)).map(p => `${p.nome} (${p.orgaoClasse} ${p.crmOuCrp})`),
        status: 'ATIVO' as const,
        // Responsável não é mais obrigatório
        responsavelNome: respNome.trim() || 'Não informado',
        responsavelPrincipalNome: respNome.trim()
          ? `${respNome.trim()} (${respParentesco})`
          : 'Não informado',
        responsaveis: respNome.trim()
          ? [
              {
                id: `resp-${Date.now()}`,
                nome: respNome.trim(),
                parentesco: respParentesco,
                telefone: respTelefone.trim() || 'Não informado',
                email: respEmail.trim() || undefined,
                principal: true,
              },
            ]
          : [],
        formulario: formularioImportado
          ? {
              nomeArquivo: formularioImportado.nomeArquivo,
              tipoArquivo: formularioImportado.tipoArquivo,
              tamanhoKb: formularioImportado.tamanhoKb,
              dataEmissao: formDataEmissao,
              dataVencimento: vencimentoFormularioInfo.dataVencimento,
              statusVencimento: vencimentoFormularioInfo.status,
              diasRestantes: vencimentoFormularioInfo.diasRestantes,
              baixarUrl: formularioImportado.arquivoUrl,
            }
          : undefined,
        pendenciasQuantidade:
          formularioImportado && vencimentoFormularioInfo.status === 'VENCIDO' ? 1 : 0,
        diaDaSemana,
      };

      const { paciente: criado } = PacientesService.cadastrarPaciente(
        novoPacDados,
        usuarioAtual,
        justificativaDuplicidade
      );

      onPacienteCriado(criado);
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar novo paciente.');
      setSalvando(false);
    }
  };

  const handleValidarECadastrar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome completo do paciente é obrigatório.');
      return;
    }
    if (!carteirinha.trim()) {
      setErro('O número da carteirinha do convênio é obrigatório.');
      return;
    }

    // Verificação de duplicidade por CPF ou Carteirinha
    const resultadoDup = PacientesService.verificarDuplicidade({
      nome: nome.trim(),
      cpf: cpf.trim(),
      carteirinha: carteirinha.trim(),
    });

    if (resultadoDup.possivelDuplicidade) {
      setDuplicidadeAlerta(resultadoDup);
      return;
    }

    executarCriacao();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
          {/* Header */}
          <div className="bg-[#002172] text-white px-6 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-900/60 rounded-xl">
                <UserPlus className="w-5 h-5 text-[#91CA0C]" />
              </div>
              <div>
                <h3 className="font-bold text-base font-['Quicksand']">
                  Novo Cadastro de Paciente
                </h3>
                <p className="text-xs text-blue-100">
                  Entidade única central • Previne duplicidades e dispersão de registros
                </p>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="p-1 rounded-lg hover:bg-white/10 text-white/80 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form com Scroll */}
          <form onSubmit={handleValidarECadastrar} className="p-6 overflow-y-auto space-y-5 flex-1">
            {erro && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{erro}</span>
              </div>
            )}

            {/* SEÇÃO 1: DADOS DO PACIENTE (SEM DATA DE NASCIMENTO) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  1. Dados do Paciente
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Privacidade LGPD
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Paciente *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bernardo Silva Neves"
                    value={nome}
                    onChange={(e) => {
                      setNome(e.target.value);
                      setErro('');
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-[#002172]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Convênio Principal *
                  </label>
                  <select
                    value={convenioId}
                    onChange={(e) => setConvenioId(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-[#002172]"
                  >
                    {MOCK_CONVENIOS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nome}
                      </option>
                    ))}
                    <option value="conv-particular">Particular / Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Número da Carteirinha *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 982019230198001"
                    value={carteirinha}
                    onChange={(e) => {
                      const limpo = e.target.value.replace(/[^a-zA-Z0-9]/g, '');
                      setCarteirinha(limpo);
                      setErro('');
                    }}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-[#002172]"
                    required
                  />
                </div>

                <div className="sm:col-span-2 relative">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prestadores (Pesquise e selecione)
                  </label>
                  
                  {/* Selected badges */}
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {doutoresAtendentesIds.map((id) => {
                      const pres = MOCK_PRESTADORES.find(p => p.id === id);
                      if (!pres) return null;
                      return (
                        <span key={id} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-blue-50 text-blue-900 border border-blue-200 font-medium">
                          <span>{pres.nome}</span>
                          <button
                            type="button"
                            onClick={() => setDoutoresAtendentesIds(doutoresAtendentesIds.filter(i => i !== id))}
                            className="text-blue-400 hover:text-red-600 font-bold ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Search and Dropdown */}
                  <div className="relative">
                    <input
                      type="text"
                      value={pesquisaPrestadorInput}
                      onChange={(e) => {
                        setPesquisaPrestadorInput(e.target.value);
                        setDropdownPrestadorAberto(true);
                      }}
                      onFocus={() => setDropdownPrestadorAberto(true)}
                      placeholder="Digite para buscar Prestador..."
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-[#002172]"
                    />
                    {dropdownPrestadorAberto && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        {MOCK_PRESTADORES.filter(p =>
                          p.nome.toLowerCase().includes(pesquisaPrestadorInput.toLowerCase()) ||
                          (p.crmOuCrp && p.crmOuCrp.toLowerCase().includes(pesquisaPrestadorInput.toLowerCase()))
                        ).length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">Nenhum prestador encontrado</div>
                        ) : (
                          MOCK_PRESTADORES.filter(p =>
                            p.nome.toLowerCase().includes(pesquisaPrestadorInput.toLowerCase()) ||
                            (p.crmOuCrp && p.crmOuCrp.toLowerCase().includes(pesquisaPrestadorInput.toLowerCase()))
                          ).map((pres) => {
                            const jaVinculado = doutoresAtendentesIds.includes(pres.id);
                            return (
                              <div
                                key={pres.id}
                                onClick={() => {
                                  if (!jaVinculado) {
                                    setDoutoresAtendentesIds([...doutoresAtendentesIds, pres.id]);
                                  }
                                  setPesquisaPrestadorInput('');
                                  setDropdownPrestadorAberto(false);
                                }}
                                className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between font-medium ${
                                  jaVinculado ? 'bg-slate-100 text-slate-400' : 'hover:bg-slate-50 text-slate-800'
                                }`}
                              >
                                <span>{pres.nome} {jaVinculado ? '(Já vinculado)' : ''}</span>
                                <span className="text-[10px] text-slate-400 font-mono">{pres.orgaoClasse} {pres.crmOuCrp}</span>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Procedimento Terapêutico
                  </label>
                  <input
                    type="text"
                    value={procedimentoPrincipal}
                    onChange={(e) => setProcedimentoPrincipal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Dia da Semana em que passa
                  </label>
                  <select
                    value={diaDaSemana}
                    onChange={(e) => setDiaDaSemana(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-[#002172]"
                  >
                    <option value="Segunda-feira">Segunda-feira</option>
                    <option value="Terça-feira">Terça-feira</option>
                    <option value="Quarta-feira">Quarta-feira</option>
                    <option value="Quinta-feira">Quinta-feira</option>
                    <option value="Sexta-feira">Sexta-feira</option>
                    <option value="Sábado">Sábado</option>
                    <option value="Segunda e Quarta-feira">Segunda e Quarta-feira</option>
                    <option value="Terça e Quinta-feira">Terça e Quinta-feira</option>
                    <option value="Outro / Flexível">Outro / Flexível</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SEÇÃO 2: RESPONSÁVEL LEGAL (NÃO OBRIGATÓRIO) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    2. Informações do Responsável Legal
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                    Opcional
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  Pode ser informado posteriormente no prontuário
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nome Completo do Responsável (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Mariana Mendes"
                    value={respNome}
                    onChange={(e) => setRespNome(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Parentesco / Relação
                  </label>
                  <select
                    value={respParentesco}
                    onChange={(e) => setRespParentesco(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                  >
                    <option value="Mãe">Mãe</option>
                    <option value="Pai">Pai</option>
                    <option value="Tutor Legal">Tutor Legal</option>
                    <option value="Avó/Avô">Avó/Avô</option>
                    <option value="Cônjuge">Cônjuge</option>
                    <option value="O próprio">O próprio paciente</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Telefone / WhatsApp (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="(11) 98765-4321"
                    value={respTelefone}
                    onChange={(e) => setRespTelefone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    E-mail do Responsável (Opcional)
                  </label>
                  <input
                    type="email"
                    placeholder="contato.responsavel@email.com"
                    value={respEmail}
                    onChange={(e) => setRespEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-[#002172]"
                  />
                </div>
              </div>
            </div>

            {/* SEÇÃO 3: FORMULÁRIO DO PACIENTE (IMPORTAÇÃO + AUTO-IDENTIFICAÇÃO DE FORMATO + SÓ DEPOIS BAIXAR/IMPRIMIR) */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#002172]" />
                  <span className="text-xs font-bold text-slate-800">
                    3. Formulário do Paciente
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-[#002172]">
                    Importe primeiro para baixar/imprimir
                  </span>
                </div>

                {/* BOTÕES DE BAIXAR E IMPRIMIR — HABILITADOS SÓ DEPOIS DA IMPORTAÇÃO */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={!formularioImportado}
                    onClick={handleBaixarFormulario}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                      formularioImportado
                        ? 'text-[#002172] bg-white border border-slate-200 hover:bg-blue-50 cursor-pointer'
                        : 'text-slate-400 bg-slate-100 border border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                    title={
                      formularioImportado
                        ? `Baixar ${formularioImportado.nomeArquivo}`
                        : 'Importe o formulário do paciente primeiro para liberar o download'
                    }
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Arquivo</span>
                  </button>

                  <button
                    type="button"
                    disabled={!formularioImportado}
                    onClick={handleImprimirFormulario}
                    className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl transition-all shadow-2xs ${
                      formularioImportado
                        ? 'text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 cursor-pointer'
                        : 'text-slate-400 bg-slate-100 border border-slate-200 opacity-50 cursor-not-allowed'
                    }`}
                    title={
                      formularioImportado
                        ? 'Imprimir formulário importado'
                        : 'Importe o formulário do paciente primeiro para liberar a impressão'
                    }
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir</span>
                  </button>
                </div>
              </div>

              {/* ÁREA DE IMPORTAÇÃO */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpeg,.jpg,application/pdf,image/jpeg"
                onChange={handleFileChange}
                className="hidden"
              />

              {!formularioImportado ? (
                /* Estado: Formulário Ainda Não Importado */
                <div className="p-4 border-2 border-dashed border-slate-300 rounded-xl bg-white text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-50 flex items-center justify-center text-[#002172]">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">
                      Importar Formulário do Paciente
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Selecione o arquivo digitalizado (.pdf ou .jpeg). O sistema identificará automaticamente o formato.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-[#002172] text-white text-xs font-bold rounded-xl hover:bg-blue-900 transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#91CA0C]" />
                      <span>Selecionar Arquivo para Importar</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSimularImportacao('pdf')}
                      className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                      title="Simular arquivo em PDF para testes rápidos"
                    >
                      + Exemplo .pdf
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimularImportacao('jpeg')}
                      className="px-2.5 py-2 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
                      title="Simular arquivo em JPEG para testes rápidos"
                    >
                      + Exemplo .jpeg
                    </button>
                  </div>

                  <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2 font-medium">
                    ⚠️ Atenção: As opções de <strong>Baixar</strong> e <strong>Imprimir</strong> acima permanecerão bloqueadas até que o formulário seja importado.
                  </div>
                </div>
              ) : (
                /* Estado: Formulário Já Importado */
                <div className="p-3.5 bg-white border border-emerald-300 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 shrink-0">
                        {formularioImportado.tipoArquivo === 'pdf' ? (
                          <FileCheck className="w-5 h-5" />
                        ) : (
                          <ImageIcon className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            {formularioImportado.nomeArquivo}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            ({formularioImportado.tamanhoKb} KB)
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1.5">
                          <span>✓ Formulário importado com sucesso.</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600">Download e Impressão liberados!</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                      >
                        Substituir
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormularioImportado(null)}
                        className="p-1 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Remover formulário importado"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* IDENTIFICAÇÃO AUTOMÁTICA DO FORMATO (SEM DROPDOWN) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 mb-1">
                        Formato Identificado:
                      </span>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#002172] text-white text-xs font-bold">
                        <FileType className="w-3.5 h-3.5 text-[#91CA0C]" />
                        <span>
                          {formularioImportado.tipoArquivo === 'pdf'
                            ? 'DOCUMENTO PDF (.pdf)'
                            : 'IMAGEM DIGITALIZADA JPEG (.jpeg)'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Data de Emissão do Formulário
                      </label>
                      <input
                        type="date"
                        value={formDataEmissao}
                        onChange={(e) => setFormDataEmissao(e.target.value)}
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-[#002172]"
                      />
                    </div>

                    <div>
                      <span className="block text-[11px] font-bold text-slate-600 mb-1">
                        Vencimento (180 Dias)
                      </span>
                      <div className="px-2.5 py-1 text-xs bg-slate-100 border border-slate-200 rounded-lg font-mono font-bold text-slate-800">
                        {vencimentoFormularioInfo.dataVencimento}
                      </div>
                    </div>
                  </div>

                  {/* Status de Validade */}
                  <div
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                      vencimentoFormularioInfo.status === 'VENCIDO'
                        ? 'bg-red-50 border-red-200 text-red-800'
                        : vencimentoFormularioInfo.status === 'ALERTA_PROXIMO_VENCIMENTO'
                        ? 'bg-amber-50 border-amber-200 text-amber-800'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Validade da Importação:{' '}
                        <strong>
                          {vencimentoFormularioInfo.diasRestantes >= 0
                            ? `${vencimentoFormularioInfo.diasRestantes} dias restantes`
                            : `VENCIDO há ${Math.abs(vencimentoFormularioInfo.diasRestantes)} dias`}
                        </strong>
                      </span>
                    </div>

                    {vencimentoFormularioInfo.alertaUrgenteEmpregados && (
                      <span className="font-bold text-[10px] px-2 py-0.5 rounded-full bg-red-600 text-white animate-pulse">
                        ⚠️ URGÊNCIA: Avisar aos responsáveis para renovação!
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Trilha de Auditoria */}
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl flex items-center gap-2 text-xs text-blue-900">
              <Shield className="w-4 h-4 text-[#002172] shrink-0" />
              <span>
                Operação realizada por <strong>{usuarioAtual.nome}</strong>. O cadastro gerará evento imutável na trilha de auditoria.
              </span>
            </div>
          </form>

          {/* Footer com Ações */}
          <div className="bg-slate-50 dark:bg-slate-950 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-200 hover:text-slate-800 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border dark:border-slate-700 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={salvando}
              onClick={handleValidarECadastrar}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-[#002172] hover:bg-[#001752] text-white rounded-xl shadow-xs transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4 text-[#91CA0C]" />
              <span>{salvando ? 'Cadastrando...' : 'Cadastrar Paciente'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Alerta de Possível Duplicidade */}
      {duplicidadeAlerta && (
        <DuplicidadeAlertaModal
          resultado={duplicidadeAlerta}
          onFechar={() => setDuplicidadeAlerta(null)}
          onAbrirExistente={(pacExistente) => {
            setDuplicidadeAlerta(null);
            onFechar();
            onAbrirPacienteExistente(pacExistente);
          }}
          onContinuarMesmoAssim={(justificativa) => {
            setDuplicidadeAlerta(null);
            executarCriacao(justificativa);
          }}
        />
      )}
    </>
  );
};
