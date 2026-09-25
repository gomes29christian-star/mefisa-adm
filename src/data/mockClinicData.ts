import {
  Paciente,
  Prestador,
  Procedimento,
  Convenio,
  Autorizacao,
  GuiaDigitacao,
  AnaliseConvenio,
  EventoAuditoria,
  PendenciaOperacional,
  Usuario,
} from '../types/clinic';

export const MOCK_USUARIOS: Usuario[] = [
  {
    id: 'usr-christian',
    nome: 'Christian Gomes',
    email: 'christian29gomes@gmail.com',
    papel: 'ADMINISTRADOR',
    departamento: 'Direção Geral & Tecnologia',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces',
    ativo: true,
    ultimoAcesso: 'Agora mesmo',
    permissoes: ['TODAS_PERMISSOES', 'EDITAR_PRESTADORES', 'GERENCIAR_USUARIOS', 'AUDITORIA_COMPLETA'],
  },
  {
    id: 'usr-ana',
    nome: 'Ana Beatriz',
    email: 'ana.beatriz@mefisa.com',
    papel: 'FUNCIONARIO_ADMINISTRATIVO',
    departamento: 'Recepção e Guias',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces',
    ativo: true,
    ultimoAcesso: 'Há 5 minutos',
  },
];

const STORAGE_KEY_PRESTADORES = 'clinica_mefisa_prestadores_v2';

const carregarPrestadoresIniciais = (): Prestador[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_PRESTADORES);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Erro ao carregar prestadores do localStorage', e);
  }

  // Prestadores iniciais padrão divididos entre Doutores Mefisa e Prestadores
  return [
    {
      id: 'prest-1',
      nome: 'Dra. Ana Beatriz Albuquerque',
      cpf: '123.456.789-01',
      titulo: 'CRP 06/12345 - Especialista Mefisa',
      cbo: '251510',
      crmOuCrp: '06/12345',
      orgaoClasse: 'CRP',
      uf: 'SP',
      especialidade: 'Psicologia ABA',
      procedimentos: ['Psicologia', 'Terapia ocupacional'],
      pastaAtribuida: 'Pasta Corpo Clínico — Mefisa',
      ativo: true,
      tipo: 'MEFISA',
    },
    {
      id: 'prest-2',
      nome: 'Dr. Carlos Eduardo Neves',
      cpf: '234.567.890-12',
      titulo: 'CRFa 2-4567 - Especialista Mefisa',
      cbo: '251510',
      crmOuCrp: '2-4567',
      orgaoClasse: 'CRFa',
      uf: 'SP',
      especialidade: 'Fonoaudiologia Clínica',
      procedimentos: ['Fonoaudiologia', 'Musicoterapia'],
      pastaAtribuida: 'Pasta Corpo Clínico — Mefisa',
      ativo: true,
      tipo: 'MEFISA',
    },
    {
      id: 'prest-3',
      nome: 'Dra. Mariana Souza',
      cpf: '345.678.901-23',
      titulo: 'CREFITO 15892 - Credenciado Externo',
      cbo: '251510',
      crmOuCrp: '15892',
      orgaoClasse: 'CREFITO',
      uf: 'SP',
      especialidade: 'Psicomotricidade',
      procedimentos: ['Psicomotricidade', 'Terapia ocupacional'],
      pastaAtribuida: 'Pasta Credenciados Externos',
      ativo: true,
      tipo: 'PRESTADOR',
    },
  ];
};

export const MOCK_PRESTADORES: Prestador[] = carregarPrestadoresIniciais();

export const salvarPrestadoresStorage = (prestadores: Prestador[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_PRESTADORES, JSON.stringify(prestadores));
  } catch (e) {
    console.error('Erro ao salvar prestadores no localStorage', e);
  }
};

export const MOCK_CONVENIOS: Convenio[] = [
  {
    id: 'conv-1',
    nome: 'SulAmérica Saúde',
    codigoAns: '006246',
    portalUrl: 'https://saude.sulamerica.com.br/prestador',
    alertaAnaliseDiasPadrao: 7,
  },
  {
    id: 'conv-2',
    nome: 'Bradesco Saúde',
    codigoAns: '005711',
    portalUrl: 'https://www.bradescoseguros.com.br',
    alertaAnaliseDiasPadrao: 7,
  },
  {
    id: 'conv-3',
    nome: 'Unimed Central',
    codigoAns: '305367',
    portalUrl: 'https://www.unimed.coop.br',
    alertaAnaliseDiasPadrao: 5,
  },
  {
    id: 'conv-4',
    nome: 'Amil Assistência Médica',
    codigoAns: '326305',
    portalUrl: 'https://www.amil.com.br/portal/web/servicos',
    alertaAnaliseDiasPadrao: 7,
  },
  {
    id: 'conv-5',
    nome: 'Porto Seguro Saúde',
    codigoAns: '000582',
    portalUrl: 'https://www.portoseguro.com.br',
    alertaAnaliseDiasPadrao: 7,
  },
];

export const MOCK_PACIENTES: Paciente[] = [];

export const MOCK_AUTORIZACOES: Autorizacao[] = [];

export const MOCK_GUIAS: GuiaDigitacao[] = [];

export const MOCK_ANALISES: AnaliseConvenio[] = [];

export const MOCK_AUDITORIA: EventoAuditoria[] = [];

export const MOCK_PENDENCIAS: PendenciaOperacional[] = [];
