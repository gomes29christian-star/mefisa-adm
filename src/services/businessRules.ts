/**
 * Motor Central de Regras de Negócio — Clínica Mefisa
 * Centraliza os cálculos de sessões, prazos de autorizações, alertas de análise e auditoria.
 *
 * REGRAS IDENTIFICADAS PARA CONFIRMAÇÃO:
 * - [REGRA A CONFIRMAR: Regra de corte do primeiro dia da semana do próximo mês]:
 *   Se a semana cruza o mês (ex: 3 dias no mês atual e 4 no próximo), como é atribuída?
 * - [REGRA A CONFIRMAR: Prazo de dias de análise]:
 *   Se o alerta de > 7 dias considera dias corridos ou apenas dias úteis do convênio.
 * - [REGRA A CONFIRMAR: Regra de duplicidade de guia]:
 *   Duplicidade definida por número de guia único ou combinação de paciente + prestador + data da sessão.
 */

export interface CalculoSessoesResultado {
  sessoesPorSemana: number;
  dataInicio: string;
  dataFim: string;
  semanasConsideradas: number;
  quantidadeTotalSugerida: number;
  justificativaFormularioGerada: string;
  formulaExplicativa: string;
  formularioTamanhoValido: boolean;
  mensagemValidacaoFormulario: string;
}

export function calcularSessoesPeriodo(
  sessoesPorSemana: number,
  dataInicioStr: string,
  dataFimStr: string,
  tamanhoArquivoMb: number = 2.4
): CalculoSessoesResultado {
  const dInicio = new Date(dataInicioStr);
  const dFim = new Date(dataFimStr);

  const diffMs = Math.max(0, dFim.getTime() - dInicio.getTime());
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  // Semanas proporcionais arredondadas (padrão de 4 ou 5 semanas por ciclo mensal)
  const semanasCalculadas = Math.max(1, Math.round(diffDias / 7));
  const quantidadeTotal = sessoesPorSemana * semanasCalculadas;

  const justificativa = `Sabemos que a quantidade do formulário é ${sessoesPorSemana} por semana, porém foi solicitado ${quantidadeTotal}, que será para o mês inteiro.`;
  const formula = `${sessoesPorSemana} sessões/sem × ${semanasCalculadas} semanas = ${quantidadeTotal} sessões autorizadas`;

  const tamanhoValido = tamanhoArquivoMb < 10;
  const mensagemValidacao = tamanhoValido
    ? `Formulário compatível (${tamanhoArquivoMb.toFixed(1)} MB < limite de 10 MB)`
    : `Atenção: Arquivo com ${tamanhoArquivoMb.toFixed(1)} MB excede o limite estrito de 10 MB do portal do convênio!`;

  return {
    sessoesPorSemana,
    dataInicio: dataInicioStr,
    dataFim: dataFimStr,
    semanasConsideradas: semanasCalculadas,
    quantidadeTotalSugerida: quantidadeTotal,
    justificativaFormularioGerada: justificativa,
    formulaExplicativa: formula,
    formularioTamanhoValido: tamanhoValido,
    mensagemValidacaoFormulario: mensagemValidacao,
  };
}

/**
 * Regra: As datas de cada sessão são registradas proporcionalmente,
 * de forma que exista EXATAMENTE UMA SESSÃO ANTES da data da próxima autorização.
 */
export function calcularProximaAutorizacaoESessoes(
  dataPrimeiraSessaoStr: string,
  totalSessoes: number,
  diasEntreSessoes: number = 7
): {
  datasSessoes: string[];
  dataProximaAutorizacaoSugerida: string;
  dataUltimaSessao: string;
  regraAplicada: string;
} {
  const base = new Date(dataPrimeiraSessaoStr);
  const datas: string[] = [];

  for (let i = 0; i < totalSessoes; i++) {
    const sDate = new Date(base);
    sDate.setDate(sDate.getDate() + i * diasEntreSessoes);
    datas.push(sDate.toISOString().split('T')[0]);
  }

  const penultimaData = datas.length >= 2 ? datas[datas.length - 2] : datas[0];
  const ultimaData = datas[datas.length - 1];

  // A próxima autorização deve ser solicitada após a penúltima sessão e antes da última
  // garantindo exatamente uma sessão restante antes do corte
  const dataProximaAuth = new Date(penultimaData);
  dataProximaAuth.setDate(dataProximaAuth.getDate() + 1);

  return {
    datasSessoes: datas,
    dataProximaAutorizacaoSugerida: dataProximaAuth.toISOString().split('T')[0],
    dataUltimaSessao: ultimaData,
    regraAplicada:
      'Garantia operacional Mefisa: existe exatamente 1 sessão antes da data da próxima autorização, permitindo renovação contínua.',
  };
}

/**
 * Calcula dias em análise e sinaliza atraso crítico (> 7 dias)
 */
export function calcularStatusAnalise(
  dataEntradaStr: string,
  limiteDias: number = 7,
  dataReferencia: Date = new Date('2026-10-24') // Data de contexto operacional
): {
  diasEmAnalise: number;
  emAtraso: boolean;
  statusBadge: 'NORMAL' | 'ALERTA' | 'CRITICO';
} {
  const entrada = new Date(dataEntradaStr);
  const diffMs = dataReferencia.getTime() - entrada.getTime();
  const dias = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

  const emAtraso = dias > limiteDias;
  let statusBadge: 'NORMAL' | 'ALERTA' | 'CRITICO' = 'NORMAL';
  if (dias > limiteDias + 3) {
    statusBadge = 'CRITICO';
  } else if (emAtraso) {
    statusBadge = 'ALERTA';
  }

  return {
    diasEmAnalise: dias,
    emAtraso,
    statusBadge,
  };
}
