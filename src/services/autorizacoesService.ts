import { AutorizacaoV2, HistoricoStatusAutorizacao, StatusAutorizacao } from '../types/autorizacao';
import { MOCK_AUDITORIA } from '../data/mockClinicData';

const STORAGE_KEY_AUTORIZACOES = 'clinica_mefisa_autorizacoes_v2';

export const calcularDiasCorridos = (dataInicioStr: string): number => {
  if (!dataInicioStr) return 0;
  const inicio = new Date(dataInicioStr);
  const hoje = new Date();
  inicio.setHours(0, 0, 0, 0);
  hoje.setHours(0, 0, 0, 0);
  const diffTime = hoje.getTime() - inicio.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

export const carregarAutorizacoesIniciais = (): AutorizacaoV2[] => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = localStorage.getItem(STORAGE_KEY_AUTORIZACOES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((a: any) => ({
            ...a,
            diasEmAnalise: a.status === 'EM_ANALISE' ? calcularDiasCorridos(a.dataSolicitacao) : (a.diasEmAnalise || 0),
          }));
        }
      }
    }
  } catch (e) {
    console.error('Erro ao carregar autorizações do localStorage', e);
  }

  const dataAntiga = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 9 dias atrás (> 7 dias)
  const dataRecente = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 3 dias atrás

  return [
    {
      id: 'aut-v2-1',
      numeroAutorizacao: 'AUT-2026-9901',
      pacienteId: 'pac-1',
      pacienteNome: 'Lucas Gabriel da Silva',
      carteirinha: '00624689123',
      operadora: 'SulAmérica Saúde',
      procedimento: 'Psicologia ABA',
      prestador: 'Dra. Ana Beatriz Albuquerque',
      cbo: '251510',
      crm: 'CRP 06/12345',
      dataSolicitacao: dataAntiga,
      quantidadeSolicitada: 12,
      competencia: '2026-10',
      proximaAutorizacao: '2026-10-28',
      status: 'EM_ANALISE',
      responsavel: 'Ana Beatriz',
      ultimaAtualizacao: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      diasEmAnalise: 9,
      historico: [
        {
          id: 'hist-1',
          statusAnterior: 'EM_ANALISE',
          novoStatus: 'EM_ANALISE',
          usuarioNome: 'Ana Beatriz',
          dataHora: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          justificativa: 'Solicitação inicial enviada via portal da operadora.',
        },
      ],
      observacoes: 'Aguardando liberação de auditoria médica da operadora.',
    },
    {
      id: 'aut-v2-2',
      numeroAutorizacao: 'AUT-2026-9902',
      pacienteId: 'pac-2',
      pacienteNome: 'Beatriz Lima Souza',
      carteirinha: '00571123456',
      operadora: 'Bradesco Saúde',
      procedimento: 'Fonoaudiologia',
      prestador: 'Dr. Carlos Eduardo Neves',
      cbo: '223810',
      crm: 'CRFa 2-4567',
      dataSolicitacao: dataRecente,
      quantidadeSolicitada: 8,
      competencia: '2026-10',
      proximaAutorizacao: '2026-11-02',
      status: 'EM_ANALISE',
      responsavel: 'Christian Gomes',
      ultimaAtualizacao: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      diasEmAnalise: 3,
      historico: [
        {
          id: 'hist-2',
          statusAnterior: 'EM_ANALISE',
          novoStatus: 'EM_ANALISE',
          usuarioNome: 'Christian Gomes',
          dataHora: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleString('pt-BR'),
          justificativa: 'Em análise padrão.',
        },
      ],
      observacoes: 'Documentação entregue no prazo.',
    },
    {
      id: 'aut-v2-3',
      numeroAutorizacao: 'AUT-2026-9895',
      pacienteId: 'pac-3',
      pacienteNome: 'Matheus Henrique',
      carteirinha: '30536788990',
      operadora: 'Unimed Central',
      procedimento: 'Terapia Ocupacional',
      prestador: 'Dra. Mariana Souza',
      cbo: '251510',
      crm: 'CREFITO 15892',
      dataSolicitacao: '2026-09-10',
      dataAutorizacao: '2026-09-12',
      quantidadeSolicitada: 10,
      competencia: '2026-09',
      proximaAutorizacao: '2026-10-15',
      status: 'CONCLUIDO',
      responsavel: 'Ana Beatriz',
      ultimaAtualizacao: '2026-09-12T14:30:00.000Z',
      diasEmAnalise: 2,
      historico: [
        {
          id: 'hist-3-1',
          statusAnterior: 'EM_ANALISE',
          novoStatus: 'EM_ANALISE',
          usuarioNome: 'Ana Beatriz',
          dataHora: '2026-09-10 09:00',
          justificativa: 'Início da solicitação',
        },
        {
          id: 'hist-3-2',
          statusAnterior: 'EM_ANALISE',
          novoStatus: 'CONCLUIDO',
          usuarioNome: 'Ana Beatriz',
          dataHora: '2026-09-12 14:30',
          justificativa: 'Autorizado com sucesso pela operadora.',
        },
      ],
      observacoes: 'Guia emitida e validada.',
    },
    {
      id: 'aut-v2-4',
      numeroAutorizacao: 'AUT-2026-9880',
      pacienteId: 'pac-4',
      pacienteNome: 'Sophia Ribeiro',
      carteirinha: '32630511223',
      operadora: 'Amil Assistência',
      procedimento: 'Musicoterapia',
      prestador: 'Dr. Carlos Eduardo Neves',
      cbo: '223810',
      crm: 'CRFa 2-4567',
      dataSolicitacao: '2026-09-01',
      quantidadeSolicitada: 6,
      competencia: '2026-09',
      proximaAutorizacao: '2026-10-01',
      status: 'RECUSADO',
      responsavel: 'Christian Gomes',
      ultimaAtualizacao: '2026-09-05T11:00:00.000Z',
      diasEmAnalise: 4,
      historico: [
        {
          id: 'hist-4-1',
          statusAnterior: 'EM_ANALISE',
          novoStatus: 'RECUSADO',
          usuarioNome: 'Christian Gomes',
          dataHora: '2026-09-05 11:00',
          justificativa: 'Recusado pela operadora: CID divergente do formulário de encaminhamento médico.',
        },
      ],
      observacoes: 'Necessário reemitir laudo com CID correto.',
    },
  ];
};

export const salvarAutorizacoesStorage = (autorizacoes: AutorizacaoV2[]) => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_KEY_AUTORIZACOES, JSON.stringify(autorizacoes));
    }
  } catch (e) {
    console.error('Erro ao salvar autorizações no localStorage', e);
  }
};

export const registrarAuditoriaAutorizacao = (
  acao: string,
  descricao: string,
  usuarioNome: string,
  autorizacaoId: string,
  campoAlterado = 'status',
  valorAnterior = 'EM_ANALISE',
  valorNovo = 'ATUALIZADO',
  motivo = ''
) => {
  try {
    MOCK_AUDITORIA.unshift({
      id: `audit-aut-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      dataHora: new Date().toLocaleString('pt-BR'),
      usuarioId: 'usr-sistema',
      usuarioNome,
      papelUsuario: 'ADMINISTRADOR',
      acao,
      entidade: 'AUTORIZACAO',
      registroId: autorizacaoId,
      descricaoRegistro: descricao,
      campoAlterado,
      valorAnterior,
      valorNovo,
      motivo,
    });
  } catch (e) {
    console.error('Erro ao registrar auditoria', e);
  }
};
