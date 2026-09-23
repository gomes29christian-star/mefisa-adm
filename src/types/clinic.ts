/**
 * Tipos e Modelos Centrais da Clínica Mefisa
 * Base arquitetural para pacientes, prestadores, autorizações, guias e auditoria.
 */

export type PapelUsuario =
  | 'ADMINISTRADOR'
  | 'GESTOR'
  | 'FUNCIONARIO_ADMINISTRATIVO'
  | 'VISUALIZACAO';

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
  departamento: string;
  avatar: string;
  ativo: boolean;
  ultimoAcesso: string;
}

export interface Paciente {
  id: string;
  codigoProntuario: string;
  nome: string;
  dataNascimento: string;
  idade: number;
  responsavelNome: string;
  cpfMascarado: string;
  carteirinha: string;
  convenioId: string;
  convenioNome: string;
  procedimentoPrincipal: string;
  prestadorId: string;
  status: 'ATIVO' | 'EM_TRATAMENTO' | 'SUSPENSO' | 'ALTA';
  dataUltimaAtualizacao: string;
}

export interface Prestador {
  id: string;
  nome: string;
  titulo: string;
  cbo: string;
  crmOuCrp: string;
  orgaoClasse: 'CRM' | 'CRP' | 'CREFITO' | 'CRFa';
  uf: string;
  especialidade: string;
  pastaAtribuida: string;
  ativo: boolean;
}

export interface Procedimento {
  id: string;
  codigo: string;
  descricao: string;
  especialidade: string;
  sessoesPorSemanaPadrao: number;
  duracaoHoras: number;
}

export interface Convenio {
  id: string;
  nome: string;
  codigoAns: string;
  portalUrl: string;
  alertaAnaliseDiasPadrao: number;
}

export interface AjusteAutorizacao {
  id: string;
  autorizacaoId: string;
  quantidadeOriginal: number;
  novaQuantidade: number;
  motivo: string;
  usuarioNome: string;
  dataHora: string;
}

export interface Autorizacao {
  id: string;
  numeroSolicitacao: string;
  pacienteId: string;
  pacienteNome: string;
  prestadorId: string;
  prestadorNome: string;
  procedimentoId: string;
  procedimentoNome: string;
  convenioId: string;
  convenioNome: string;
  dataSolicitacao: string;
  dataAutorizacao?: string;
  dataValidadeInicio: string;
  dataValidadeFim: string;
  sessoesPorSemana: number;
  semanasCalculadas: number;
  quantidadeTotal: number;
  dataProximaAutorizacao: string;
  status:
    | 'AUTORIZADA'
    | 'EM_ANALISE'
    | 'PENDENTE_DOCUMENTO'
    | 'RENOVACAO_URGENTE'
    | 'EXPIRADA';
  diasEmAnalise?: number;
  emAtraso?: boolean;
  justificativaFormulario: string;
  tamanhoFormularioMb: number;
  ajustes: AjusteAutorizacao[];
}

export interface Sessao {
  id: string;
  autorizacaoId: string;
  pacienteId: string;
  pacienteNome: string;
  prestadorId: string;
  prestadorNome: string;
  dataHora: string;
  horarioFim: string;
  duracaoMinutos: number;
  sala: string;
  modalidade: 'PRESENCIAL' | 'TELECONSULTA';
  status: 'AGENDADA' | 'REALIZADA' | 'FALTA_JUSTIFICADA' | 'CANCELADA';
  guiaId?: string;
}

export interface GuiaDigitacao {
  id: string;
  numeroGuia: string;
  autorizacaoId: string;
  pacienteId: string;
  pacienteNome: string;
  prestadorId: string;
  prestadorNome: string;
  convenioNome: string;
  dataAutorizacao: string;
  dataColocacaoPasta: string;
  pastaDoutora: string;
  duracaoHoras: 1 | 2;
  responsavelColocacaoPasta: string;
  dataRetorno?: string;
  responsavelColherGuia?: string;
  dataDigitacao?: string;
  responsavelDigitacao?: string;
  status:
    | 'AGUARDANDO_RETORNO'
    | 'AGUARDANDO_DIGITACAO'
    | 'DIGITADA_FATURADA'
    | 'REVISAR_INCONSISTENCIA';
  duplicidadeDetectada: boolean;
  observacoes?: string;
}

export interface AnaliseConvenio {
  id: string;
  autorizacaoId: string;
  pacienteNome: string;
  convenioNome: string;
  dataEntrada: string;
  diasEmAnalise: number;
  limiteDias: number;
  emAtraso: boolean;
  situacao: 'EM_ANDAMENTO' | 'APROVADA' | 'RECUSADA' | 'EXIGE_JUSTIFICATIVA';
  justificativaConvenio?: string;
  dataResposta?: string;
  responsavelAcompanhamento: string;
}

export interface EventoAuditoria {
  id: string;
  dataHora: string;
  usuarioId: string;
  usuarioNome: string;
  papelUsuario: PapelUsuario;
  acao: string;
  entidade: 'AUTORIZACAO' | 'PACIENTE' | 'PRESTADOR' | 'GUIA' | 'ANALISE' | 'SESSAO';
  registroId: string;
  descricaoRegistro: string;
  campoAlterado: string;
  valorAnterior: string;
  valorNovo: string;
  motivo?: string;
}

export interface PendenciaOperacional {
  id: string;
  tipo:
    | 'PROXIMA_AUTORIZACAO_PROXIMA'
    | 'ANALISE_ATRASADA'
    | 'GUIA_AGUARDANDO_DIGITACAO'
    | 'GUIA_SEM_RETORNO'
    | 'DOCUMENTO_DESATUALIZADO';
  titulo: string;
  descricao: string;
  pacienteNome: string;
  prazoLimite: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  responsavelSugerido: string;
  resolvido: boolean;
  linkModulo: string;
}

export interface FiltrosUsuarioLocal {
  busca: string;
  convenio: string;
  especialidade: string;
  apenasPendencias: boolean;
  somenteMinhas: boolean;
  statusFiltro: string;
  modoDensidade: 'confortavel' | 'compacta';
}
