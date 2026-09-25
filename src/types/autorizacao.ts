export type StatusAutorizacao = 'CONCLUIDO' | 'RECUSADO' | 'EM_ANALISE' | 'DIGITADA';

export interface HistoricoStatusAutorizacao {
  id: string;
  statusAnterior: StatusAutorizacao;
  novoStatus: StatusAutorizacao;
  usuarioNome: string;
  dataHora: string;
  justificativa?: string;
}

export interface AutorizacaoV2 {
  id: string;
  numeroAutorizacao?: string;
  pacienteId: string;
  pacienteNome: string;
  carteirinha: string;
  operadora: string;
  procedimento: string;
  prestador: string;
  cbo?: string;
  crm?: string;
  uf?: string;
  dataSolicitacao: string;
  dataAutorizacao?: string;
  quantidadeSolicitada: number;
  sessoesPorSemana?: number;
  competencia: string;
  proximaAutorizacao: string;
  status: StatusAutorizacao;
  responsavel: string;
  ultimaAtualizacao: string;
  diasEmAnalise: number;
  historico: HistoricoStatusAutorizacao[];
  observacoes?: string;
  senha?: string;
  dataValidadeSenha?: string;
}

export interface FiltrosAutorizacaoState {
  status: string;
  periodo: string;
  paciente: string;
  procedimento: string;
  prestador: string;
  responsavel: string;
  tempoAnalise: string;
  alerta: string;
  pesquisa: string;
}
