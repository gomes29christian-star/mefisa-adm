/**
 * Tipos e Interfaces para o Módulo de Importação e Migração Legada — Clínica Mefisa
 */

export type SeverityProblemaImportacao = 'INFO' | 'WARNING' | 'ERROR';

export interface ProblemaImportacao {
  linha: number;
  campo: string;
  tipo: SeverityProblemaImportacao;
  descricao: string;
}

export type StatusDuplicidadeImportacao = 'NOVO' | 'POSSIVEL_DUPLICIDADE' | 'EXISTENTE';

export interface LinhaPreviaImportacao {
  indiceLinha: number;
  dadosBrutos: Record<string, string>;
  dadosMapeados: {
    nome: string;
    carteirinha: string;
    prestador: string;
    cbo?: string;
    crm?: string;
    uf?: string;
    dataSolicitacao?: string;
    procedimento?: string;
    quantidadeSemana?: number;
    semanaDia?: string;
    proximaAutorizacao?: string;
    indicadorIrregularidade?: boolean;
  };
  problemas: ProblemaImportacao[];
  statusDuplicidade: StatusDuplicidadeImportacao;
  pacienteExistenteId?: string;
  pacienteExistenteNome?: string;
  validoParaImportar: boolean;
}

export interface ImportBatch {
  id: string;
  dataHora: string;
  usuarioResponsavel: string;
  nomeArquivo: string;
  tamanhoKb: number;
  tipoArquivo: string;
  totalLinhas: number;
  importadosCount: number;
  rejeitadosCount: number;
  warningCount: number;
  duplicidadesCount: number;
  status: 'INICIADO' | 'VALIDADO' | 'CONFIRMADO' | 'CONCLUIDO' | 'FALHOU';
  duracaoMs: number;
}

export interface RelatorioImportacao {
  lote: ImportBatch;
  linhas: LinhaPreviaImportacao[];
  resumo: {
    totalAnalisadas: number;
    pacientesCriados: number;
    pacientesAssociados: number;
    possiveisDuplicidades: number;
    warnings: number;
    erros: number;
    rejeitados: number;
  };
}
