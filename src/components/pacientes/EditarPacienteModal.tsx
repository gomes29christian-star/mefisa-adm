import React, { useState } from 'react';
import { UserCog, Check, X, Shield, AlertCircle } from 'lucide-react';
import { Paciente, StatusPaciente, PapelUsuario } from '../../types/clinic';
import { PacientesService } from '../../services/pacientesService';
import { MOCK_PRESTADORES } from '../../data/mockClinicData';

interface EditarPacienteModalProps {
  paciente: Paciente;
  usuarioAtual: { nome: string; papel: PapelUsuario };
  onFechar: () => void;
  onSalvo: (pacienteAtualizado: Paciente) => void;
}

export const EditarPacienteModal: React.FC<EditarPacienteModalProps> = ({
  paciente,
  usuarioAtual,
  onFechar,
  onSalvo,
}) => {
  const [nome, setNome] = useState(paciente.nome);
  const [status, setStatus] = useState<StatusPaciente>(paciente.status);
  const [procedimentoPrincipal, setProcedimentoPrincipal] = useState(paciente.procedimentoPrincipal);
  const [diaDaSemana, setDiaDaSemana] = useState(paciente.diaDaSemana || 'Segunda-feira');
  const [doutoresAtendentesIds, setDoutoresAtendentesIds] = useState<string[]>(
    paciente.doutoresAtendentesIds || [paciente.prestadorId || 'prest-1']
  );
  const [observacoes, setObservacoes] = useState(paciente.observacoes || '');
  const [motivoAlteracao, setMotivoAlteracao] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('O nome completo do paciente é obrigatório.');
      return;
    }

    const prestadoresSel = MOCK_PRESTADORES.filter(p => doutoresAtendentesIds.includes(p.id));
    const prestadorPrincipal = prestadoresSel[0];

    setSalvando(true);
    try {
      const { paciente: atualizado } = PacientesService.atualizarPaciente(
        paciente.id,
        {
          nome: nome.trim(),
          status,
          procedimentoPrincipal: procedimentoPrincipal.trim(),
          diaDaSemana,
          prestadorId: prestadorPrincipal ? prestadorPrincipal.id : paciente.prestadorId,
          prestadorNome: prestadorPrincipal ? prestadorPrincipal.nome : paciente.prestadorNome,
          doutoresAtendentesIds,
          doutoresAtendentesNomes: prestadoresSel.map(p => `${p.nome} (${p.orgaoClasse} ${p.crmOuCrp})`),
          observacoes: observacoes.trim(),
        },
        usuarioAtual,
        motivoAlteracao.trim() || 'Edição cadastral administrativa'
      );

      onSalvo(atualizado);
      onFechar();
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar dados do paciente.');
      setSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#002172] text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-900/60 rounded-xl">
              <UserCog className="w-5 h-5 text-[#91CA0C]" />
            </div>
            <div>
              <h3 className="font-bold text-base font-['Quicksand']">
                Editar Dados Cadastrais
              </h3>
              <p className="text-xs text-blue-100">
                Prontuário {paciente.codigoProntuario} • Registro auditável
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nome Completo */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nome Completo do Paciente *
              </label>
              <input
                type="text"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-[#002172]"
                required
              />
            </div>

            {/* Status do Paciente */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Status no Sistema
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as StatusPaciente)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:outline-[#002172]"
              >
                <option value="ATIVO">🟢 ATIVO</option>
                <option value="EM_ACOMPANHAMENTO">🟡 EM ACOMPANHAMENTO</option>
                <option value="INATIVO">⚪ INATIVO</option>
                <option value="ENCERRADO">🔴 ENCERRADO</option>
              </select>
            </div>

            {/* Dia da Semana */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Dia da Semana em que passa
              </label>
              <select
                value={diaDaSemana}
                onChange={(e) => setDiaDaSemana(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-[#002172]"
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

            {/* Doutores Atendentes (Checkboxes) */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Doutor(es) Atendente(s) Vinculado(s)
              </label>
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200 max-h-44 overflow-y-auto">
                {MOCK_PRESTADORES.map((pres) => {
                  const marcado = doutoresAtendentesIds.includes(pres.id);
                  return (
                    <label key={pres.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-white cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => {
                            if (marcado) {
                              setDoutoresAtendentesIds(doutoresAtendentesIds.filter(id => id !== pres.id));
                            } else {
                              setDoutoresAtendentesIds([...doutoresAtendentesIds, pres.id]);
                            }
                          }}
                          className="rounded text-[#002172] focus:ring-[#002172] w-4 h-4"
                        />
                        <div>
                          <span className="text-xs font-bold text-slate-800 block">{pres.nome}</span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {pres.orgaoClasse} {pres.crmOuCrp} {pres.cpf ? `• CPF: ${pres.cpf}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1 max-w-[180px] justify-end">
                        {pres.procedimentos?.map((p, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-50 text-blue-800">
                            {p}
                          </span>
                        ))}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Procedimento Principal */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Procedimento Terapêutico Principal
              </label>
              <input
                type="text"
                value={procedimentoPrincipal}
                onChange={(e) => setProcedimentoPrincipal(e.target.value)}
                placeholder="Ex: Psicoterapia ABA / TCC Individual"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-[#002172]"
              />
            </div>

            {/* Observações Administrativas */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observações Administrativas / Alertas
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={2}
                placeholder="Anotações internas sobre rotina de atendimento, restrições ou convênio..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-[#002172]"
              />
            </div>

            {/* Motivo da Alteração */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Justificativa da Alteração Cadastral (Trilha de Auditoria) *
              </label>
              <input
                type="text"
                value={motivoAlteracao}
                onChange={(e) => setMotivoAlteracao(e.target.value)}
                placeholder="Ex: Atualização solicitada pela família / Correção de dados"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-[#002172]"
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onFechar}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-5 py-2 text-xs font-bold bg-[#002172] hover:bg-[#001752] text-white rounded-xl shadow-xs"
            >
              {salvando ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
