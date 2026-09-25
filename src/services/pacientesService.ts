/**
 * Serviço de Gestão Mestre de Pacientes — Clínica Mefisa V1
 *
 * Responsável por:
 * 1. CRUD mestre com entidade central única.
 * 2. Gestão de múltiplos responsáveis legais e responsável principal.
 * 3. Histórico perpétuo de carteirinhas (sem sobrescrita destrutiva).
 * 4. Validação de formulários (.pdf / .jpeg) com cálculo de 180 dias de vencimento e alerta de urgência.
 * 5. Detecção de duplicidade por CPF, Carteirinha ou Nome + Nascimento (permitindo homônimos).
 * 6. Auditoria completa com carimbo de tempo, usuário e valores anterior/novo.
 * 7. Isolamento de filtros por sessão de usuário.
 */

import {
  Paciente,
  ResponsavelLegal,
  HistoricoCarteirinha,
  FormularioCadastroPaciente,
  ResultadoVerificacaoDuplicidadePaciente,
  FiltroPacientesUsuario,
  EventoAuditoria,
  PapelUsuario,
  StatusPaciente,
} from '../types/clinic';
import { parseIsoDateLocal, formatIsoDate } from './businessRules';

const STORAGE_PACIENTES_KEY = 'mefisa_pacientes_v2';
const STORAGE_AUDITORIA_KEY = 'mefisa_auditoria_pacientes_v1';
const STORAGE_FILTROS_PREFIX = 'mefisa_filtro_pacientes_';

/**
 * Mascara o CPF preservando apenas os 3 primeiros dígitos e os 2 últimos dígitos verificadores
 */
export function mascararCpf(cpf: string): string {
  if (!cpf) return '';
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return cpf;
  return `${limpo.slice(0, 3)}.***.***-${limpo.slice(9)}`;
}

/**
 * Mascara número de carteirinha de convênio
 */
export function mascararCarteirinha(carteirinha: string): string {
  if (!carteirinha) return '';
  const limpo = carteirinha.trim();
  if (limpo.length <= 6) return limpo;
  const inicio = limpo.slice(0, 4);
  const fim = limpo.slice(-3);
  return `${inicio}*****${fim}`;
}

/**
 * Normaliza strings para comparação fonética/textual
 */
function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * REGRA DO FORMULÁRIO (180 DIAS):
 * Calcula o vencimento a partir da data de emissão informada pelo usuário.
 * 6 meses = exatamente 180 dias corridos.
 */
export function calcularVencimentoFormulario(
  dataEmissaoIso: string,
  dataReferenciaAtualIso: string = '2026-10-24'
): {
  dataVencimento: string;
  diasRestantes: number;
  status: 'VALIDO' | 'ALERTA_PROXIMO_VENCIMENTO' | 'VENCIDO';
  alertaUrgenteEmpregados: boolean;
} {
  const dEmissao = parseIsoDateLocal(dataEmissaoIso);
  const dVencimento = new Date(dEmissao);
  dVencimento.setDate(dVencimento.getDate() + 180);

  const dRef = parseIsoDateLocal(dataReferenciaAtualIso);
  const diferencaMs = dVencimento.getTime() - dRef.getTime();
  const diasRestantes = Math.round(diferencaMs / (1000 * 60 * 60 * 24));

  let status: 'VALIDO' | 'ALERTA_PROXIMO_VENCIMENTO' | 'VENCIDO';
  let alertaUrgenteEmpregados = false;

  if (diasRestantes < 0) {
    status = 'VENCIDO';
    alertaUrgenteEmpregados = true;
  } else if (diasRestantes <= 30) {
    status = 'ALERTA_PROXIMO_VENCIMENTO';
    alertaUrgenteEmpregados = false;
  } else {
    status = 'VALIDO';
    alertaUrgenteEmpregados = false;
  }

  return {
    dataVencimento: formatIsoDate(dVencimento),
    diasRestantes,
    status,
    alertaUrgenteEmpregados,
  };
}

/**
 * BASE INICIAL DE 12 PACIENTES FICTÍCIOS
 * Cobre diferentes status, convênios, múltiplos responsáveis, histórico de carteirinhas e formulários.
 */
export const PACIENTES_TEST_FIXTURES: Paciente[] = [
  {
    id: 'pac-001',
    codigoProntuario: '#MEF-2024-001',
    nome: 'Lucas Gabriel Mendes',
    dataNascimento: '2016-04-12',
    idade: 10,
    cpf: '381.921.842-12',
    cpfMascarado: '381.***.***-12',
    carteirinha: '982019230198001',
    carteirinhaAtual: '982019230198001',
    carteirinhaAtualMascarada: '9820*****001',
    convenioId: 'conv-1',
    convenioNome: 'SulAmérica Saúde',
    convenioPrincipalId: 'conv-1',
    convenioPrincipalNome: 'SulAmérica Saúde',
    procedimentoPrincipal: 'Psicoterapia ABA / TCC Infantil',
    prestadorId: 'prest-1',
    prestadorNome: 'Dra. Beatriz Albuquerque',
    status: 'ATIVO',
    responsavelNome: 'Mariana Mendes',
    responsavelPrincipalNome: 'Mariana Mendes (Mãe)',
    responsaveis: [
      {
        id: 'resp-1',
        nome: 'Mariana Mendes',
        parentesco: 'Mãe',
        telefone: '(11) 98765-4321',
        email: 'mariana.mendes@email.com',
        principal: true,
      },
      {
        id: 'resp-2',
        nome: 'Carlos Eduardo Mendes',
        parentesco: 'Pai',
        telefone: '(11) 98111-2233',
        email: 'carlos.mendes@email.com',
        principal: false,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-1',
        convenioId: 'conv-3',
        convenioNome: 'Unimed Central',
        numeroCarteirinha: '00329104921001',
        dataInicio: '2025-01-10',
        dataFim: '2026-03-31',
        status: 'ENCERRADA',
        observacao: 'Troca de plano corporativo da mãe',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2025-01-10 09:30',
      },
      {
        id: 'cart-2',
        convenioId: 'conv-1',
        convenioNome: 'SulAmérica Saúde',
        numeroCarteirinha: '982019230198001',
        dataInicio: '2026-04-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-04-01 10:15',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_cadastro_lucas_mendes.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1420,
      dataEmissao: '2026-07-01',
      dataVencimento: '2026-12-28',
      statusVencimento: 'VALIDO',
      diasRestantes: 65,
    },
    ultimaAutorizacaoData: '2026-10-01',
    proximaAutorizacaoData: '2026-10-29',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-01-15',
    dataUltimaAtualizacao: '2026-10-24 14:10',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-002',
    codigoProntuario: '#MEF-2024-002',
    nome: 'Maurício Rezende Filho',
    dataNascimento: '1997-11-03',
    idade: 28,
    cpf: '512.984.102-01',
    cpfMascarado: '512.***.***-01',
    carteirinha: '772910394012001',
    carteirinhaAtual: '772910394012001',
    carteirinhaAtualMascarada: '7729*****001',
    convenioId: 'conv-1',
    convenioNome: 'SulAmérica Saúde',
    convenioPrincipalId: 'conv-1',
    convenioPrincipalNome: 'SulAmérica Saúde',
    procedimentoPrincipal: 'Psicoterapia ABA / TCC Adulto',
    prestadorId: 'prest-4',
    prestadorNome: 'Psic. Helena Tavares',
    status: 'ATIVO',
    responsavelNome: 'O próprio',
    responsavelPrincipalNome: 'O próprio',
    responsaveis: [
      {
        id: 'resp-3',
        nome: 'Maurício Rezende Filho',
        parentesco: 'O próprio',
        telefone: '(11) 97654-1234',
        email: 'mauricio.filho@email.com',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-3',
        convenioId: 'conv-1',
        convenioNome: 'SulAmérica Saúde',
        numeroCarteirinha: '772910394012001',
        dataInicio: '2026-01-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-01-01 08:00',
      },
    ],
    formulario: {
      nomeArquivo: 'termo_consentimento_mauricio.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 890,
      dataEmissao: '2026-03-15',
      dataVencimento: '2026-09-11',
      statusVencimento: 'VENCIDO',
      diasRestantes: -43,
    },
    ultimaAutorizacaoData: '2026-10-04',
    proximaAutorizacaoData: '2026-10-29',
    pendenciasQuantidade: 1, // Formulário vencido
    dataCriacao: '2024-03-20',
    dataUltimaAtualizacao: '2026-10-23 11:30',
    atualizadoPor: 'Ana Beatriz Silveira',
  },
  {
    id: 'pac-003',
    codigoProntuario: '#MEF-2024-003',
    nome: 'Alice de Oliveira',
    dataNascimento: '2021-06-20',
    idade: 5,
    cpf: '419.827.190-33',
    cpfMascarado: '419.***.***-33',
    carteirinha: '661099238102',
    carteirinhaAtual: '661099238102',
    carteirinhaAtualMascarada: '6610*****102',
    convenioId: 'conv-4',
    convenioNome: 'Amil Saúde',
    convenioPrincipalId: 'conv-4',
    convenioPrincipalNome: 'Amil Saúde',
    procedimentoPrincipal: 'Fonoaudiologia Integrada',
    prestadorId: 'prest-5',
    prestadorNome: 'Fga. Lorena Santos',
    diaDaSemana: 'Segunda-feira',
    status: 'ATIVO',
    responsavelNome: 'Juliana de Oliveira',
    responsavelPrincipalNome: 'Juliana de Oliveira (Mãe)',
    responsaveis: [
      {
        id: 'resp-4',
        nome: 'Juliana de Oliveira',
        parentesco: 'Mãe',
        telefone: '(11) 99887-7665',
        principal: true,
      },
      {
        id: 'resp-5',
        nome: 'Renato de Oliveira',
        parentesco: 'Pai',
        telefone: '(11) 98877-6655',
        principal: false,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-4',
        convenioId: 'conv-4',
        convenioNome: 'Amil Saúde',
        numeroCarteirinha: '661099238102',
        dataInicio: '2026-05-10',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-05-10 14:00',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_alice_oliveira.jpeg',
      tipoArquivo: 'jpeg',
      tamanhoKb: 2100,
      dataEmissao: '2026-05-10',
      dataVencimento: '2026-11-06',
      statusVencimento: 'ALERTA_PROXIMO_VENCIMENTO',
      diasRestantes: 13,
    },
    ultimaAutorizacaoData: '2026-10-05',
    proximaAutorizacaoData: '2026-10-26',
    pendenciasQuantidade: 1, // Formulário próximo do vencimento
    dataCriacao: '2024-05-12',
    dataUltimaAtualizacao: '2026-10-24 09:15',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-004',
    codigoProntuario: '#MEF-2024-004',
    nome: 'Eduardo Camargo Barros',
    dataNascimento: '2015-09-08',
    idade: 11,
    cpf: '320.912.839-55',
    cpfMascarado: '320.***.***-55',
    carteirinha: '448102948100',
    carteirinhaAtual: '448102948100',
    carteirinhaAtualMascarada: '4481*****100',
    convenioId: 'conv-5',
    convenioNome: 'Porto Seguro Saúde',
    convenioPrincipalId: 'conv-5',
    convenioPrincipalNome: 'Porto Seguro Saúde',
    procedimentoPrincipal: 'Terapia Ocupacional / Integração',
    prestadorId: 'prest-6',
    prestadorNome: 'T.O. Patrícia Lins',
    status: 'EM_ACOMPANHAMENTO',
    responsavelNome: 'Vanessa Barros',
    responsavelPrincipalNome: 'Vanessa Barros (Mãe)',
    responsaveis: [
      {
        id: 'resp-6',
        nome: 'Vanessa Barros',
        parentesco: 'Mãe',
        telefone: '(11) 97766-5544',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-5',
        convenioId: 'conv-5',
        convenioNome: 'Porto Seguro Saúde',
        numeroCarteirinha: '448102948100',
        dataInicio: '2026-02-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-02-01 10:00',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_eduardo_barros.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1650,
      dataEmissao: '2026-08-15',
      dataVencimento: '2027-02-11',
      statusVencimento: 'VALIDO',
      diasRestantes: 110,
    },
    ultimaAutorizacaoData: '2026-09-15',
    proximaAutorizacaoData: '2026-10-27',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-02-01',
    dataUltimaAtualizacao: '2026-10-20 16:45',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-005',
    codigoProntuario: '#MEF-2024-005',
    nome: 'Clara Silveira Peixoto',
    dataNascimento: '1992-02-14',
    idade: 34,
    cpf: '450.192.839-18',
    cpfMascarado: '450.***.***-18',
    carteirinha: '8910442910401',
    carteirinhaAtual: '8910442910401',
    carteirinhaAtualMascarada: '8910*****401',
    convenioId: 'conv-2',
    convenioNome: 'Bradesco Saúde',
    convenioPrincipalId: 'conv-2',
    convenioPrincipalNome: 'Bradesco Saúde',
    procedimentoPrincipal: 'Fisioterapia & Reabilitação Motora',
    prestadorId: 'prest-3',
    prestadorNome: 'Dr. Thiago Sampaio',
    status: 'ATIVO',
    responsavelNome: 'O próprio',
    responsavelPrincipalNome: 'O próprio',
    responsaveis: [
      {
        id: 'resp-7',
        nome: 'Clara Silveira Peixoto',
        parentesco: 'O próprio',
        telefone: '(11) 96543-2109',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-6',
        convenioId: 'conv-2',
        convenioNome: 'Bradesco Saúde',
        numeroCarteirinha: '8910442910401',
        dataInicio: '2026-03-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-03-01 11:20',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_clara_peixoto.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 980,
      dataEmissao: '2026-06-10',
      dataVencimento: '2026-12-07',
      statusVencimento: 'VALIDO',
      diasRestantes: 44,
    },
    ultimaAutorizacaoData: '2026-09-30',
    proximaAutorizacaoData: '2026-10-28',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-03-05',
    dataUltimaAtualizacao: '2026-10-18 10:10',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-006',
    codigoProntuario: '#MEF-2024-006',
    nome: 'Renato de Assis Carvalho',
    dataNascimento: '1984-08-19',
    idade: 42,
    cpf: '231.902.812-90',
    cpfMascarado: '231.***.***-90',
    carteirinha: 'PART-PIX-9941',
    carteirinhaAtual: 'PART-PIX-9941',
    carteirinhaAtualMascarada: 'PART*****941',
    convenioId: 'conv-particular',
    convenioNome: 'Particular',
    convenioPrincipalId: 'conv-particular',
    convenioPrincipalNome: 'Particular',
    procedimentoPrincipal: 'Avaliação Neuropsicológica',
    prestadorId: 'prest-2',
    prestadorNome: 'Dr. Fernando Vasconcelos',
    status: 'INATIVO',
    responsavelNome: 'O próprio',
    responsavelPrincipalNome: 'O próprio',
    responsaveis: [
      {
        id: 'resp-8',
        nome: 'Renato de Assis Carvalho',
        parentesco: 'O próprio',
        telefone: '(11) 95432-1098',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-7',
        convenioId: 'conv-particular',
        convenioNome: 'Particular',
        numeroCarteirinha: 'PART-PIX-9941',
        dataInicio: '2026-04-15',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-04-15 15:30',
      },
    ],
    ultimaAutorizacaoData: '2026-05-10',
    proximaAutorizacaoData: '-',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-04-15',
    dataUltimaAtualizacao: '2026-07-20 09:00',
    atualizadoPor: 'Dr. Roberto Mefisa',
  },
  {
    id: 'pac-007',
    codigoProntuario: '#MEF-2024-007',
    nome: 'Talita Negrão Siqueira',
    dataNascimento: '1988-03-29',
    idade: 38,
    cpf: '119.829.102-62',
    cpfMascarado: '119.***.***-62',
    carteirinha: '772910394099881',
    carteirinhaAtual: '772910394099881',
    carteirinhaAtualMascarada: '7729*****881',
    convenioId: 'conv-1',
    convenioNome: 'SulAmérica Saúde',
    convenioPrincipalId: 'conv-1',
    convenioPrincipalNome: 'SulAmérica Saúde',
    procedimentoPrincipal: 'TCC Adulto - Burnout',
    prestadorId: 'prest-1',
    prestadorNome: 'Dra. Beatriz Albuquerque',
    status: 'ATIVO',
    responsavelNome: 'O próprio',
    responsavelPrincipalNome: 'O próprio',
    responsaveis: [
      {
        id: 'resp-9',
        nome: 'Talita Negrão Siqueira',
        parentesco: 'O próprio',
        telefone: '(11) 94321-0987',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-8',
        convenioId: 'conv-1',
        convenioNome: 'SulAmérica Saúde',
        numeroCarteirinha: '772910394099881',
        dataInicio: '2026-02-15',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-02-15 08:30',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_talita_negrao.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1200,
      dataEmissao: '2026-07-15',
      dataVencimento: '2027-01-11',
      statusVencimento: 'VALIDO',
      diasRestantes: 79,
    },
    ultimaAutorizacaoData: '2026-10-02',
    proximaAutorizacaoData: '2026-10-30',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-02-15',
    dataUltimaAtualizacao: '2026-10-22 17:00',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-008',
    codigoProntuario: '#MEF-2024-008',
    nome: 'Guilherme Fontana Rios',
    dataNascimento: '2018-12-05',
    idade: 7,
    cpf: '402.192.831-77',
    cpfMascarado: '402.***.***-77',
    carteirinha: '00329104928841',
    carteirinhaAtual: '00329104928841',
    carteirinhaAtualMascarada: '0032*****841',
    convenioId: 'conv-3',
    convenioNome: 'Unimed Central',
    convenioPrincipalId: 'conv-3',
    convenioPrincipalNome: 'Unimed Central',
    procedimentoPrincipal: 'Psicoterapia ABA Infantil',
    prestadorId: 'prest-1',
    prestadorNome: 'Dra. Beatriz Albuquerque',
    status: 'ENCERRADO',
    responsavelNome: 'Fábio Rios',
    responsavelPrincipalNome: 'Fábio Rios (Pai)',
    responsaveis: [
      {
        id: 'resp-10',
        nome: 'Fábio Rios',
        parentesco: 'Pai',
        telefone: '(11) 93210-9876',
        principal: true,
      },
      {
        id: 'resp-11',
        nome: 'Cláudia Fontana Rios',
        parentesco: 'Mãe',
        telefone: '(11) 93210-9877',
        principal: false,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-9',
        convenioId: 'conv-3',
        convenioNome: 'Unimed Central',
        numeroCarteirinha: '00329104928841',
        dataInicio: '2025-06-01',
        dataFim: '2026-08-30',
        status: 'ENCERRADA',
        observacao: 'Tratamento concluído com alta médica',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2025-06-01 10:00',
      },
    ],
    ultimaAutorizacaoData: '2026-08-01',
    proximaAutorizacaoData: '-',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-06-01',
    dataUltimaAtualizacao: '2026-09-01 11:00',
    atualizadoPor: 'Dra. Camila Rocha',
  },
  {
    id: 'pac-009',
    codigoProntuario: '#MEF-2024-009',
    nome: 'Sophia Martins Viana',
    dataNascimento: '2020-01-22',
    idade: 6,
    cpf: '488.192.019-44',
    cpfMascarado: '488.***.***-44',
    carteirinha: '661099238992',
    carteirinhaAtual: '661099238992',
    carteirinhaAtualMascarada: '6610*****992',
    convenioId: 'conv-4',
    convenioNome: 'Amil Saúde',
    convenioPrincipalId: 'conv-4',
    convenioPrincipalNome: 'Amil Saúde',
    procedimentoPrincipal: 'Terapia Ocupacional Sensorial',
    prestadorId: 'prest-6',
    prestadorNome: 'T.O. Patrícia Lins',
    status: 'ATIVO',
    responsavelNome: 'Aline Viana',
    responsavelPrincipalNome: 'Aline Viana (Mãe)',
    responsaveis: [
      {
        id: 'resp-12',
        nome: 'Aline Viana',
        parentesco: 'Mãe',
        telefone: '(11) 92109-8765',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-10',
        convenioId: 'conv-4',
        convenioNome: 'Amil Saúde',
        numeroCarteirinha: '661099238992',
        dataInicio: '2026-01-10',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-01-10 09:00',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_sophia_viana.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1350,
      dataEmissao: '2026-02-20',
      dataVencimento: '2026-08-19',
      statusVencimento: 'VENCIDO',
      diasRestantes: -66,
    },
    ultimaAutorizacaoData: '2026-09-28',
    proximaAutorizacaoData: '2026-10-26',
    pendenciasQuantidade: 1, // Formulário vencido
    dataCriacao: '2024-01-10',
    dataUltimaAtualizacao: '2026-10-21 15:20',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-010',
    codigoProntuario: '#MEF-2024-010',
    nome: 'Matheus Henrique Dias',
    dataNascimento: '2019-07-14',
    idade: 7,
    cpf: '519.821.039-88',
    cpfMascarado: '519.***.***-88',
    carteirinha: '8910442918811',
    carteirinhaAtual: '8910442918811',
    carteirinhaAtualMascarada: '8910*****811',
    convenioId: 'conv-2',
    convenioNome: 'Bradesco Saúde',
    convenioPrincipalId: 'conv-2',
    convenioPrincipalNome: 'Bradesco Saúde',
    procedimentoPrincipal: 'Fonoaudiologia & Linguagem',
    prestadorId: 'prest-5',
    prestadorNome: 'Fga. Lorena Santos',
    status: 'EM_ACOMPANHAMENTO',
    responsavelNome: 'Sílvia Dias',
    responsavelPrincipalNome: 'Sílvia Dias (Mãe)',
    responsaveis: [
      {
        id: 'resp-13',
        nome: 'Sílvia Dias',
        parentesco: 'Mãe',
        telefone: '(11) 91098-7654',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-11',
        convenioId: 'conv-2',
        convenioNome: 'Bradesco Saúde',
        numeroCarteirinha: '8910442918811',
        dataInicio: '2026-03-10',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-03-10 13:40',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_matheus_dias.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1100,
      dataEmissao: '2026-09-01',
      dataVencimento: '2027-02-28',
      statusVencimento: 'VALIDO',
      diasRestantes: 127,
    },
    ultimaAutorizacaoData: '2026-09-18',
    proximaAutorizacaoData: '2026-10-23',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-03-10',
    dataUltimaAtualizacao: '2026-10-15 14:00',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-011',
    codigoProntuario: '#MEF-2024-011',
    nome: 'Yasmin Duarte Costa',
    dataNascimento: '2017-05-30',
    idade: 9,
    cpf: '372.901.839-21',
    cpfMascarado: '372.***.***-21',
    carteirinha: '772910394077651',
    carteirinhaAtual: '772910394077651',
    carteirinhaAtualMascarada: '7729*****651',
    convenioId: 'conv-1',
    convenioNome: 'SulAmérica Saúde',
    convenioPrincipalId: 'conv-1',
    convenioPrincipalNome: 'SulAmérica Saúde',
    procedimentoPrincipal: 'Psicoterapia ABA Individual',
    prestadorId: 'prest-4',
    prestadorNome: 'Psic. Helena Tavares',
    status: 'ATIVO',
    responsavelNome: 'Patrícia Duarte',
    responsavelPrincipalNome: 'Patrícia Duarte (Mãe)',
    responsaveis: [
      {
        id: 'resp-14',
        nome: 'Patrícia Duarte',
        parentesco: 'Mãe',
        telefone: '(11) 90987-6543',
        principal: true,
      },
      {
        id: 'resp-15',
        nome: 'Marcos Costa',
        parentesco: 'Pai',
        telefone: '(11) 90987-6544',
        principal: false,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-12',
        convenioId: 'conv-1',
        convenioNome: 'SulAmérica Saúde',
        numeroCarteirinha: '772910394077651',
        dataInicio: '2026-06-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-06-01 11:00',
      },
    ],
    formulario: {
      nomeArquivo: 'formulario_yasmin_duarte.pdf',
      tipoArquivo: 'pdf',
      tamanhoKb: 1540,
      dataEmissao: '2026-06-01',
      dataVencimento: '2026-11-28',
      statusVencimento: 'ALERTA_PROXIMO_VENCIMENTO',
      diasRestantes: 35,
    },
    ultimaAutorizacaoData: '2026-10-03',
    proximaAutorizacaoData: '2026-10-31',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-06-01',
    dataUltimaAtualizacao: '2026-10-24 16:30',
    atualizadoPor: 'Maria Clara Fonseca',
  },
  {
    id: 'pac-012',
    codigoProntuario: '#MEF-2024-012',
    nome: 'Enzo Gabriel Castro',
    dataNascimento: '2022-10-10',
    idade: 4,
    cpf: '439.812.930-10',
    cpfMascarado: '439.***.***-10',
    carteirinha: 'PART-AVULSO-0012',
    carteirinhaAtual: 'PART-AVULSO-0012',
    carteirinhaAtualMascarada: 'PART*****012',
    convenioId: 'conv-particular',
    convenioNome: 'Particular',
    convenioPrincipalId: 'conv-particular',
    convenioPrincipalNome: 'Particular',
    procedimentoPrincipal: 'Intervenção Precoce ABA',
    prestadorId: 'prest-1',
    prestadorNome: 'Dra. Beatriz Albuquerque',
    status: 'ATIVO',
    responsavelNome: 'Camila Castro',
    responsavelPrincipalNome: 'Camila Castro (Mãe)',
    responsaveis: [
      {
        id: 'resp-16',
        nome: 'Camila Castro',
        parentesco: 'Mãe',
        telefone: '(11) 99876-5432',
        principal: true,
      },
    ],
    carteirinhas: [
      {
        id: 'cart-13',
        convenioId: 'conv-particular',
        convenioNome: 'Particular',
        numeroCarteirinha: 'PART-AVULSO-0012',
        dataInicio: '2026-09-01',
        status: 'ATUAL',
        criadoPorUsuario: 'Maria Clara Fonseca',
        criadoEm: '2026-09-01 09:30',
      },
    ],
    ultimaAutorizacaoData: 'Sem autorização prévia',
    proximaAutorizacaoData: 'A definir',
    pendenciasQuantidade: 0,
    dataCriacao: '2024-09-01',
    dataUltimaAtualizacao: '2026-09-01 10:00',
    atualizadoPor: 'Maria Clara Fonseca',
  },
];

let memoriaPacientes: Paciente[] | null = null;
let memoriaAuditoria: EventoAuditoria[] = [];
let memoriaFiltrosPorUsuario: Record<string, FiltroPacientesUsuario> = {};

export class PacientesService {
  /**
   * Obtém a lista de pacientes do storage ou inicializa com os 12 fictícios
   */
  static obterPacientes(): Paciente[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        if (!memoriaPacientes) {
          memoriaPacientes = [];
        }
        return memoriaPacientes!;
      }
      const raw = localStorage.getItem(STORAGE_PACIENTES_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_PACIENTES_KEY, JSON.stringify(PACIENTES_TEST_FIXTURES));
        return PACIENTES_TEST_FIXTURES;
      }
      return JSON.parse(raw);
    } catch {
      if (!memoriaPacientes) {
        memoriaPacientes = [];
      }
      return memoriaPacientes!;
    }
  }

  /**
   * Salva a lista de pacientes
   */
  static persistirPacientes(pacientes: Paciente[]): void {
    memoriaPacientes = pacientes;
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(STORAGE_PACIENTES_KEY, JSON.stringify(pacientes));
    }
  }

  /**
   * Busca um paciente pelo ID
   */
  static obterPacientePorId(id: string): Paciente | null {
    const todos = this.obterPacientes();
    return todos.find((p) => p.id === id) || null;
  }

  /**
   * REGRA DE DETECÇÃO DE DUPLICIDADE:
   * Verifica se já existe um paciente com:
   * 1. CPF idêntico (se informado)
   * 2. Número de carteirinha idêntico
   * 3. Nome completo + data de nascimento idênticos
   *
   * IMPORTANTE: Não bloqueia homônimos (nomes iguais com nascimento/CPF diferentes).
   */
  static verificarDuplicidade(
    dados: {
      nome: string;
      dataNascimento?: string;
      cpf?: string;
      carteirinha?: string;
    },
    ignorarId?: string,
    basePacientes?: Paciente[]
  ): ResultadoVerificacaoDuplicidadePaciente {
    const lista = basePacientes || this.obterPacientes();

    const cpfLimpo = (dados.cpf || '').replace(/\D/g, '');
    const carteirinhaLimpa = (dados.carteirinha || '').trim().toLowerCase();
    const nomeNorm = normalizarTexto(dados.nome || '');
    const dataNasc = (dados.dataNascimento || '').trim();

    for (const pac of lista) {
      if (ignorarId && pac.id === ignorarId) continue;

      // 1. CPF Idêntico
      const pacCpfLimpo = (pac.cpf || '').replace(/\D/g, '');
      if (cpfLimpo && pacCpfLimpo && cpfLimpo === pacCpfLimpo) {
        return {
          possivelDuplicidade: true,
          motivoCorrespondencia: 'CPF_IDENTICO',
          pacienteExistente: pac,
          detalhes: `CPF ${mascararCpf(pac.cpf || '')} já cadastrado para o paciente ${pac.nome}.`,
        };
      }

      // 2. Carteirinha Idêntica
      const pacCarteirinha = (pac.carteirinhaAtual || pac.carteirinha || '').trim().toLowerCase();
      if (carteirinhaLimpa && pacCarteirinha && carteirinhaLimpa === pacCarteirinha) {
        return {
          possivelDuplicidade: true,
          motivoCorrespondencia: 'CARTEIRINHA_IDENTICA',
          pacienteExistente: pac,
          detalhes: `Carteirinha ${mascararCarteirinha(pacCarteirinha)} já associada ao paciente ${pac.nome}.`,
        };
      }

      // 3. Nome + Data de Nascimento Idênticos (apenas se data de nascimento foi preenchida)
      const pacNomeNorm = normalizarTexto(pac.nome || '');
      const pacDataNasc = (pac.dataNascimento || '').trim();
      if (nomeNorm && dataNasc && pacDataNasc && nomeNorm === pacNomeNorm && dataNasc === pacDataNasc) {
        return {
          possivelDuplicidade: true,
          motivoCorrespondencia: 'NOME_E_NASCIMENTO_IDENTICOS',
          pacienteExistente: pac,
          detalhes: `Paciente com mesmo nome completo e mesma data de nascimento (${dataNasc}) já cadastrado.`,
        };
      }
    }

    return {
      possivelDuplicidade: false,
      detalhes: 'Nenhuma duplicidade detectada.',
    };
  }

  /**
   * Cadastra um novo paciente com auditoria completa
   */
  static cadastrarPaciente(
    novoPaciente: Omit<Paciente, 'id' | 'codigoProntuario' | 'dataCriacao' | 'dataUltimaAtualizacao'> & {
      codigoProntuario?: string;
    },
    usuario: { nome: string; papel: PapelUsuario },
    justificativaDuplicidade?: string
  ): { paciente: Paciente; eventoAuditoria: EventoAuditoria } {
    const lista = this.obterPacientes();
    const novoId = `pac-${Date.now()}`;
    const codigoProntuario =
      novoPaciente.codigoProntuario || `#MEF-2026-${String(lista.length + 1).padStart(3, '0')}`;

    const agora = new Date();
    const agoraFormatado = `${formatIsoDate(agora)} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    // Carteirinha inicial vinculada
    const carteirinhaInicial: HistoricoCarteirinha = {
      id: `cart-${Date.now()}`,
      convenioId: novoPaciente.convenioPrincipalId || novoPaciente.convenioId || 'conv-1',
      convenioNome: novoPaciente.convenioPrincipalNome || novoPaciente.convenioNome || 'Convênio Padrão',
      numeroCarteirinha: novoPaciente.carteirinhaAtual || novoPaciente.carteirinha || '',
      dataInicio: formatIsoDate(agora),
      status: 'ATUAL',
      observacao: 'Cadastro inicial do paciente',
      criadoPorUsuario: usuario.nome,
      criadoEm: agoraFormatado,
    };

    const pacienteCriado: Paciente = {
      ...novoPaciente,
      id: novoId,
      codigoProntuario,
      carteirinhaAtual: novoPaciente.carteirinhaAtual || novoPaciente.carteirinha,
      carteirinhaAtualMascarada: mascararCarteirinha(novoPaciente.carteirinhaAtual || novoPaciente.carteirinha),
      cpfMascarado: mascararCpf(novoPaciente.cpf || ''),
      carteirinhas: novoPaciente.carteirinhas?.length ? novoPaciente.carteirinhas : [carteirinhaInicial],
      responsaveis: novoPaciente.responsaveis || [],
      responsavelPrincipalNome:
        novoPaciente.responsaveis?.find((r) => r.principal)?.nome ||
        novoPaciente.responsavelNome ||
        'Não informado',
      dataCriacao: formatIsoDate(agora),
      dataUltimaAtualizacao: agoraFormatado,
      atualizadoPor: usuario.nome,
    };

    lista.unshift(pacienteCriado);
    this.persistirPacientes(lista);

    // Registra evento de auditoria
    const evento: EventoAuditoria = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      dataHora: agoraFormatado,
      usuarioId: 'usr-sessao',
      usuarioNome: usuario.nome,
      papelUsuario: usuario.papel,
      acao: 'Criação de Paciente',
      entidade: 'PACIENTE',
      registroId: pacienteCriado.id,
      descricaoRegistro: `Paciente ${pacienteCriado.nome} (Prontuário ${pacienteCriado.codigoProntuario})`,
      campoAlterado: 'CADASTRO_COMPLETO',
      valorAnterior: 'NENHUM (NOVO REGISTRO)',
      valorNovo: `Criado com Convênio ${pacienteCriado.convenioNome}, Carteirinha ${mascararCarteirinha(pacienteCriado.carteirinhaAtual || '')}`,
      motivo: justificativaDuplicidade
        ? `Cadastro criado sob confirmação de duplicidade: ${justificativaDuplicidade}`
        : 'Inclusão cadastral no módulo mestre de pacientes V1',
    };

    this.gravarEventoAuditoria(evento);

    return { paciente: pacienteCriado, eventoAuditoria: evento };
  }

  /**
   * Atualiza dados cadastrais com trilha de auditoria para cada campo relevante modificado
   */
  static atualizarPaciente(
    id: string,
    camposAtualizados: Partial<Paciente>,
    usuario: { nome: string; papel: PapelUsuario },
    motivoGeral?: string
  ): { paciente: Paciente; eventosAuditoria: EventoAuditoria[] } {
    const lista = this.obterPacientes();
    const indice = lista.findIndex((p) => p.id === id);
    if (indice === -1) {
      throw new Error(`Paciente com ID ${id} não encontrado.`);
    }

    const pacienteAnterior = { ...lista[indice] };
    const agora = new Date();
    const agoraFormatado = `${formatIsoDate(agora)} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const pacienteAtualizado: Paciente = {
      ...pacienteAnterior,
      ...camposAtualizados,
      dataUltimaAtualizacao: agoraFormatado,
      atualizadoPor: usuario.nome,
    };

    if (camposAtualizados.cpf) {
      pacienteAtualizado.cpfMascarado = mascararCpf(camposAtualizados.cpf);
    }
    if (camposAtualizados.carteirinhaAtual) {
      pacienteAtualizado.carteirinha = camposAtualizados.carteirinhaAtual;
      pacienteAtualizado.carteirinhaAtualMascarada = mascararCarteirinha(camposAtualizados.carteirinhaAtual);
    }

    lista[indice] = pacienteAtualizado;
    this.persistirPacientes(lista);

    // Gera auditoria para cada campo relevante alterado
    const eventos: EventoAuditoria[] = [];

    const camposParaAuditar: (keyof Paciente)[] = [
      'nome',
      'status',
      'cpf',
      'dataNascimento',
      'convenioNome',
      'procedimentoPrincipal',
      'prestadorId',
    ];

    for (const campo of camposParaAuditar) {
      const vAnt = String((pacienteAnterior as any)[campo] || '');
      const vNov = String((camposAtualizados as any)[campo] || '');

      if (vNov !== '' && vNov !== undefined && vNov !== vAnt) {
        const ev: EventoAuditoria = {
          id: `aud-${Date.now()}-${campo}-${Math.random().toString(36).substring(2, 9)}`,
          dataHora: agoraFormatado,
          usuarioId: 'usr-sessao',
          usuarioNome: usuario.nome,
          papelUsuario: usuario.papel,
          acao: `Alteração de Campo (${campo})`,
          entidade: 'PACIENTE',
          registroId: pacienteAtualizado.id,
          descricaoRegistro: `Paciente ${pacienteAtualizado.nome} (${pacienteAtualizado.codigoProntuario})`,
          campoAlterado: campo,
          valorAnterior: campo === 'cpf' ? mascararCpf(vAnt) : vAnt,
          valorNovo: campo === 'cpf' ? mascararCpf(vNov) : vNov,
          motivo: motivoGeral || 'Atualização cadastral do paciente',
        };
        eventos.push(ev);
        this.gravarEventoAuditoria(ev);
      }
    }

    // Se nenhum campo individual gerou evento mas houve update (ex: observação)
    if (eventos.length === 0) {
      const ev: EventoAuditoria = {
        id: `aud-${Date.now()}-geral-${Math.random().toString(36).substring(2, 9)}`,
        dataHora: agoraFormatado,
        usuarioId: 'usr-sessao',
        usuarioNome: usuario.nome,
        papelUsuario: usuario.papel,
        acao: 'Atualização de Cadastro',
        entidade: 'PACIENTE',
        registroId: pacienteAtualizado.id,
        descricaoRegistro: `Paciente ${pacienteAtualizado.nome}`,
        campoAlterado: 'DADOS_GERAIS',
        valorAnterior: 'Cadastro prévio',
        valorNovo: 'Dados revisados',
        motivo: motivoGeral || 'Revisão cadastral',
      };
      eventos.push(ev);
      this.gravarEventoAuditoria(ev);
    }

    return { paciente: pacienteAtualizado, eventosAuditoria: eventos };
  }

  /**
   * REGRA DAS CARTEIRINHAS:
   * A carteirinha atual NÃO substitui a anterior; mantém histórico perpétuo.
   */
  static trocarCarteirinha(
    pacienteId: string,
    novaCarteirinhaDados: {
      convenioId: string;
      convenioNome: string;
      numeroCarteirinha: string;
      dataInicio: string;
      observacao?: string;
    },
    usuario: { nome: string; papel: PapelUsuario }
  ): { paciente: Paciente; eventoAuditoria: EventoAuditoria } {
    const lista = this.obterPacientes();
    const indice = lista.findIndex((p) => p.id === pacienteId);
    if (indice === -1) {
      throw new Error(`Paciente com ID ${pacienteId} não encontrado.`);
    }

    const paciente = lista[indice];
    const agora = new Date();
    const agoraFormatado = `${formatIsoDate(agora)} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const carteirinhaAnteriorNumero = paciente.carteirinhaAtual || paciente.carteirinha || '';

    // Encerra carteirinhas ativas anteriores
    const historicoAtualizado: HistoricoCarteirinha[] = (paciente.carteirinhas || []).map((c) => {
      if (c.status === 'ATUAL') {
        return {
          ...c,
          status: 'ENCERRADA' as const,
          dataFim: novaCarteirinhaDados.dataInicio || formatIsoDate(agora),
        };
      }
      return c;
    });

    // Cria a nova carteirinha
    const novaCart: HistoricoCarteirinha = {
      id: `cart-${Date.now()}`,
      convenioId: novaCarteirinhaDados.convenioId,
      convenioNome: novaCarteirinhaDados.convenioNome,
      numeroCarteirinha: novaCarteirinhaDados.numeroCarteirinha,
      dataInicio: novaCarteirinhaDados.dataInicio || formatIsoDate(agora),
      status: 'ATUAL',
      observacao: novaCarteirinhaDados.observacao || 'Atualização de carteirinha',
      criadoPorUsuario: usuario.nome,
      criadoEm: agoraFormatado,
    };

    historicoAtualizado.push(novaCart);

    paciente.carteirinhas = historicoAtualizado;
    paciente.carteirinha = novaCarteirinhaDados.numeroCarteirinha;
    paciente.carteirinhaAtual = novaCarteirinhaDados.numeroCarteirinha;
    paciente.carteirinhaAtualMascarada = mascararCarteirinha(novaCarteirinhaDados.numeroCarteirinha);
    paciente.convenioId = novaCarteirinhaDados.convenioId;
    paciente.convenioNome = novaCarteirinhaDados.convenioNome;
    paciente.convenioPrincipalId = novaCarteirinhaDados.convenioId;
    paciente.convenioPrincipalNome = novaCarteirinhaDados.convenioNome;
    paciente.dataUltimaAtualizacao = agoraFormatado;
    paciente.atualizadoPor = usuario.nome;

    lista[indice] = paciente;
    this.persistirPacientes(lista);

    const evento: EventoAuditoria = {
      id: `aud-${Date.now()}-cart-${Math.random().toString(36).substring(2, 9)}`,
      dataHora: agoraFormatado,
      usuarioId: 'usr-sessao',
      usuarioNome: usuario.nome,
      papelUsuario: usuario.papel,
      acao: 'Troca de Carteirinha / Convênio',
      entidade: 'PACIENTE',
      registroId: paciente.id,
      descricaoRegistro: `Paciente ${paciente.nome} (${paciente.codigoProntuario})`,
      campoAlterado: 'carteirinhaAtual',
      valorAnterior: `${mascararCarteirinha(carteirinhaAnteriorNumero)} (${paciente.convenioNome})`,
      valorNovo: `${mascararCarteirinha(novaCarteirinhaDados.numeroCarteirinha)} (${novaCarteirinhaDados.convenioNome})`,
      motivo: novaCarteirinhaDados.observacao || 'Substituição de carteirinha com preservação do histórico',
    };

    this.gravarEventoAuditoria(evento);

    return { paciente, eventoAuditoria: evento };
  }

  /**
   * REGRA DOS RESPONSÁVEIS LEGAIS:
   * Suporte a múltiplos responsáveis, alteração de responsável principal e auditoria.
   */
  static atualizarResponsaveis(
    pacienteId: string,
    novosResponsaveis: ResponsavelLegal[],
    usuario: { nome: string; papel: PapelUsuario },
    motivo?: string
  ): { paciente: Paciente; eventoAuditoria: EventoAuditoria } {
    const lista = this.obterPacientes();
    const indice = lista.findIndex((p) => p.id === pacienteId);
    if (indice === -1) {
      throw new Error(`Paciente com ID ${pacienteId} não encontrado.`);
    }

    const paciente = lista[indice];
    const agora = new Date();
    const agoraFormatado = `${formatIsoDate(agora)} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const principal = novosResponsaveis.find((r) => r.principal) || novosResponsaveis[0];

    const respAnterioresStr = (paciente.responsaveis || [])
      .map((r) => `${r.nome} (${r.parentesco}${r.principal ? ' - Principal' : ''})`)
      .join(', ');

    const respNovosStr = novosResponsaveis
      .map((r) => `${r.nome} (${r.parentesco}${r.principal ? ' - Principal' : ''})`)
      .join(', ');

    paciente.responsaveis = novosResponsaveis;
    paciente.responsavelPrincipalNome = principal
      ? `${principal.nome} (${principal.parentesco})`
      : 'Não informado';
    paciente.responsavelNome = principal ? principal.nome : 'Não informado';
    paciente.dataUltimaAtualizacao = agoraFormatado;
    paciente.atualizadoPor = usuario.nome;

    lista[indice] = paciente;
    this.persistirPacientes(lista);

    const evento: EventoAuditoria = {
      id: `aud-${Date.now()}-resp-${Math.random().toString(36).substring(2, 9)}`,
      dataHora: agoraFormatado,
      usuarioId: 'usr-sessao',
      usuarioNome: usuario.nome,
      papelUsuario: usuario.papel,
      acao: 'Atualização de Responsáveis Legais',
      entidade: 'PACIENTE',
      registroId: paciente.id,
      descricaoRegistro: `Paciente ${paciente.nome} (${paciente.codigoProntuario})`,
      campoAlterado: 'responsaveis',
      valorAnterior: respAnterioresStr || 'Nenhum',
      valorNovo: respNovosStr || 'Nenhum',
      motivo: motivo || 'Gestão de responsáveis legais do paciente',
    };

    this.gravarEventoAuditoria(evento);

    return { paciente, eventoAuditoria: evento };
  }

  /**
   * Vincula ou atualiza o formulário do paciente (.pdf ou .jpeg com 180 dias de validade)
   */
  static vincularFormulario(
    pacienteId: string,
    formularioDados: {
      nomeArquivo: string;
      tipoArquivo: 'pdf' | 'jpeg';
      tamanhoKb: number;
      dataEmissao: string;
    },
    usuario: { nome: string; papel: PapelUsuario }
  ): { paciente: Paciente; eventoAuditoria: EventoAuditoria } {
    const lista = this.obterPacientes();
    const indice = lista.findIndex((p) => p.id === pacienteId);
    if (indice === -1) {
      throw new Error(`Paciente com ID ${pacienteId} não encontrado.`);
    }

    const pacienteAlvo = lista[indice];
    const nomeAlvoNormalizado = normalizarTexto(pacienteAlvo.nome);
    const calculoVenc = calcularVencimentoFormulario(formularioDados.dataEmissao);

    const agora = new Date();
    const agoraFormatado = `${formatIsoDate(agora)} ${String(agora.getHours()).padStart(2, '0')}:${String(agora.getMinutes()).padStart(2, '0')}`;

    const formularioCompleto: FormularioCadastroPaciente = {
      nomeArquivo: formularioDados.nomeArquivo,
      tipoArquivo: formularioDados.tipoArquivo,
      tamanhoKb: formularioDados.tamanhoKb,
      dataEmissao: formularioDados.dataEmissao,
      dataVencimento: calculoVenc.dataVencimento,
      statusVencimento: calculoVenc.status,
      diasRestantes: calculoVenc.diasRestantes,
    };

    // Propagar o formulário para TODOS os pacientes na lista que possuem o mesmo nome
    lista.forEach((p, idx) => {
      if (normalizarTexto(p.nome) === nomeAlvoNormalizado) {
        lista[idx] = {
          ...p,
          formulario: formularioCompleto,
          dataUltimaAtualizacao: agoraFormatado,
          atualizadoPor: usuario.nome,
        };
      }
    });

    this.persistirPacientes(lista);

    const evento: EventoAuditoria = {
      id: `aud-${Date.now()}-form-${Math.random().toString(36).substring(2, 9)}`,
      dataHora: agoraFormatado,
      usuarioId: 'usr-sessao',
      usuarioNome: usuario.nome,
      papelUsuario: usuario.papel,
      acao: 'Vínculo de Formulário Cadastral (Propagado para homônimos)',
      entidade: 'PACIENTE',
      registroId: pacienteAlvo.id,
      descricaoRegistro: `Paciente ${pacienteAlvo.nome} (Sincronizado para todos com este nome)`,
      campoAlterado: 'formulario',
      valorAnterior: pacienteAlvo.formulario ? pacienteAlvo.formulario.nomeArquivo : 'Nenhum',
      valorNovo: `${formularioDados.nomeArquivo} (Emissão: ${formularioDados.dataEmissao}, Vencimento 180d: ${calculoVenc.dataVencimento})`,
      motivo: 'Registro de documento com validade de 6 meses (180 dias) propagado para homônimos',
    };

    this.gravarEventoAuditoria(evento);

    return { paciente: lista[indice], eventoAuditoria: evento };
  }

  /**
   * FILTRAGEM DETERMINÍSTICA LOCAL POR USUÁRIO:
   * Busca e filtros são executados na sessão local do usuário.
   */
  static filtrarPacientes(pacientes: Paciente[], filtros: FiltroPacientesUsuario): Paciente[] {
    const t = normalizarTexto(filtros.busca || '');

    return pacientes.filter((pac) => {
      // 1. Filtro de Status
      if (filtros.status && filtros.status !== 'TODOS' && pac.status !== filtros.status) {
        return false;
      }

      // 2. Filtro de Convênio
      if (filtros.convenioId && filtros.convenioId !== 'TODOS') {
        const cId = pac.convenioPrincipalId || pac.convenioId;
        const cNome = (pac.convenioPrincipalNome || pac.convenioNome || '').toLowerCase();
        if (cId !== filtros.convenioId && !cNome.includes(filtros.convenioId.toLowerCase())) {
          return false;
        }
      }

      // 3. Filtro de Pendências
      if (filtros.comPendenciasApenas && (!pac.pendenciasQuantidade || pac.pendenciasQuantidade <= 0)) {
        return false;
      }

      // 4. Filtro de Formulário Vencido
      if (filtros.formularioVencidoApenas && pac.formulario?.statusVencimento !== 'VENCIDO') {
        return false;
      }

      // 5. Busca rápida por: Nome, Carteirinha, CPF ou Responsável
      if (!t) return true;

      const nomeMatch = normalizarTexto(pac.nome || '').includes(t);
      const carteirinhaMatch = (pac.carteirinhaAtual || pac.carteirinha || '')
        .toLowerCase()
        .includes(t);
      const prontuarioMatch = (pac.codigoProntuario || '').toLowerCase().includes(t);
      const cpfMatch = (pac.cpf || '').replace(/\D/g, '').includes(t.replace(/\D/g, ''));

      const respMatch = (pac.responsaveis || []).some((r) =>
        normalizarTexto(r.nome).includes(t)
      ) || normalizarTexto(pac.responsavelNome || '').includes(t);

      return nomeMatch || carteirinhaMatch || prontuarioMatch || cpfMatch || respMatch;
    });
  }

  /**
   * ISOLAMENTO DE FILTROS POR USUÁRIO:
   * Garante que os filtros selecionados por uma funcionária (ex: Ana) NÃO afetem a tela de outra (ex: Maria Clara).
   */
  static obterFiltroUsuario(usuarioId: string): FiltroPacientesUsuario {
    const padrao: FiltroPacientesUsuario = {
      busca: '',
      status: 'TODOS',
      convenioId: 'TODOS',
      comPendenciasApenas: false,
      formularioVencidoApenas: false,
    };
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const raw = window.sessionStorage.getItem(`${STORAGE_FILTROS_PREFIX}${usuarioId}`);
        if (raw) return JSON.parse(raw);
      }
      if (memoriaFiltrosPorUsuario[usuarioId]) {
        return memoriaFiltrosPorUsuario[usuarioId];
      }
      return padrao;
    } catch {
      return memoriaFiltrosPorUsuario[usuarioId] || padrao;
    }
  }

  static salvarFiltroUsuario(usuarioId: string, filtro: FiltroPacientesUsuario): void {
    memoriaFiltrosPorUsuario[usuarioId] = filtro;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`${STORAGE_FILTROS_PREFIX}${usuarioId}`, JSON.stringify(filtro));
      }
    } catch {
      // Ignora erro de sessionStorage restrito
    }
  }

  /**
   * Persiste evento de auditoria no repositório de auditoria geral
   */
  private static gravarEventoAuditoria(evento: EventoAuditoria): void {
    // Garante que o evento tenha um ID único
    if (!evento.id || memoriaAuditoria.some((e) => e.id === evento.id)) {
      evento.id = `aud-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
    memoriaAuditoria.unshift(evento);
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      const raw = localStorage.getItem(STORAGE_AUDITORIA_KEY);
      const lista: EventoAuditoria[] = raw ? JSON.parse(raw) : [];
      const vistos = new Set<string>();
      const listaUnica: EventoAuditoria[] = [];
      [evento, ...lista].forEach((item) => {
        if (item && item.id && !vistos.has(item.id)) {
          vistos.add(item.id);
          listaUnica.push(item);
        }
      });
      localStorage.setItem(STORAGE_AUDITORIA_KEY, JSON.stringify(listaUnica.slice(0, 200)));
    } catch {
      // Ignora erro de storage
    }
  }

  static obterAuditoriaPacientes(): EventoAuditoria[] {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return memoriaAuditoria;
      const raw = localStorage.getItem(STORAGE_AUDITORIA_KEY);
      const lista: EventoAuditoria[] = raw ? JSON.parse(raw) : [];
      const vistos = new Set<string>();
      const listaDeduplicada: EventoAuditoria[] = [];
      lista.forEach((item, idx) => {
        if (!item.id || vistos.has(item.id)) {
          item.id = `${item.id || 'aud'}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
        }
        vistos.add(item.id);
        listaDeduplicada.push(item);
      });
      return listaDeduplicada;
    } catch {
      return memoriaAuditoria;
    }
  }
}
