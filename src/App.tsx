import React, { useState } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { SecretAchievementsProvider } from './context/SecretAchievementsContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavItemKey } from './components/layout/Sidebar';
import { SpreadsheetCentralView } from './components/central/SpreadsheetCentralView';
import { DashboardView } from './components/dashboard/DashboardView';
import { PacientesView } from './components/views/PacientesView';
import { AutorizacoesView } from './components/views/AutorizacoesView';
import { GuiasView } from './components/views/GuiasView';
import { AnalisesView } from './components/views/AnalisesView';
import { PrestadoresView } from './components/views/PrestadoresView';
import { PendenciasView } from './components/views/PendenciasView';
import { UsuariosConfigView } from './components/views/UsuariosConfigView';
import { CalculationPreviewModal } from './components/common/CalculationPreviewModal';
import { AuditTrailDrawer } from './components/common/AuditTrailDrawer';
import { ArchitectureDocModal } from './components/documentation/ArchitectureDocModal';
import { SecretAchievementsModal } from './components/common/SecretAchievementsModal';
import { MOCK_USUARIOS, MOCK_AUDITORIA, MOCK_PENDENCIAS } from './data/mockClinicData';
import { Usuario } from './types/clinic';

function MainApp() {
  const [activeTab, setActiveTab] = useState<NavItemKey>('central_dados');
  const [activeUsuario, setActiveUsuario] = useState<Usuario>(MOCK_USUARIOS[1]); // Maria Clara (Autorizações)
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isArchDocOpen, setIsArchDocOpen] = useState(false);

  const pendingCounts = {
    pendencias: MOCK_PENDENCIAS.length,
    analisesAtraso: 2,
    guiasAguardando: 17,
  };

  return (
    <div className="min-h-screen flex bg-slate-50 font-['Nunito_Sans'] text-slate-800 antialiased selection:bg-blue-100 selection:text-[#002172]">
      {/* Sidebar de Navegação */}
      <Sidebar
        activeKey={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        pendingCounts={pendingCounts}
      />

      {/* Conteúdo Principal */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          activeUsuario={activeUsuario}
          onSelectUsuario={(usr) => setActiveUsuario(usr)}
          onOpenCalculator={() => setIsCalculatorOpen(true)}
          onOpenArchitectureDocs={() => setIsArchDocOpen(true)}
        />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {activeTab === 'central_dados' && (
            <SpreadsheetCentralView
              onOpenAudit={() => setIsAuditOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              usuarioAtualNome={activeUsuario.nome}
            />
          )}

          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {activeTab === 'pacientes' && (
            <PacientesView
              onOpenAudit={() => setIsAuditOpen(true)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
            />
          )}

          {activeTab === 'autorizacoes' && (
            <AutorizacoesView
              onOpenCalculator={() => setIsCalculatorOpen(true)}
              onOpenAudit={() => setIsAuditOpen(true)}
            />
          )}

          {activeTab === 'guias' && (
            <GuiasView onOpenAudit={() => setIsAuditOpen(true)} />
          )}

          {activeTab === 'analises' && (
            <AnalisesView onOpenAudit={() => setIsAuditOpen(true)} />
          )}

          {activeTab === 'prestadores' && <PrestadoresView />}

          {activeTab === 'pendencias' && (
            <PendenciasView
              onNavigate={(tab) => setActiveTab(tab)}
              onOpenCalculator={() => setIsCalculatorOpen(true)}
            />
          )}

          {activeTab === 'auditoria' && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-['Quicksand'] text-slate-900">
                    Histórico Imutável & Trilha de Auditoria Geral
                  </h2>
                  <p className="text-xs text-slate-500">
                    Registro de todas as mutações no banco de dados com autor, carimbo e motivo.
                  </p>
                </div>
                <button
                  onClick={() => setIsAuditOpen(true)}
                  className="px-4 py-2 bg-[#002172] text-white rounded-xl text-xs font-bold"
                >
                  Abrir Gaveta Detalhada de Eventos
                </button>
              </div>
              <div className="space-y-2">
                {MOCK_AUDITORIA.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 border rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{log.acao}</span> ·{' '}
                      <span className="text-slate-600">{log.descricaoRegistro}</span>
                      {log.motivo && (
                        <div className="text-[11px] text-amber-900 font-medium">
                          Motivo: {log.motivo}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-700">{log.usuarioNome}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.dataHora}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'usuarios' && (
            <UsuariosConfigView
              activeUsuario={activeUsuario}
              onSelectUsuario={(usr) => setActiveUsuario(usr)}
            />
          )}

          {activeTab === 'configuracoes' && (
            <div className="space-y-6">
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <h2 className="text-xl font-bold font-['Quicksand'] text-slate-900">
                  Configurações Operacionais & Regras de Negócio
                </h2>
                <p className="text-xs text-slate-500">
                  Parâmetros centrais do sistema da Clínica Mefisa.
                </p>

                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-2 text-amber-950">
                  <div className="font-bold text-sm">
                    Regras a Confirmar pela Gestão Administrativa [REGRA A CONFIRMAR]:
                  </div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>
                      <strong>Corte de Semanas que cruzam meses:</strong> Definir se a semana iniciada no final do mês é computada no mês de origem ou no mês de destino.
                    </li>
                    <li>
                      <strong>Contagem de Dias de Análise:</strong> O gatilho de alerta de 7 dias considerará dias corridos ou dias úteis de atendimento das operadoras?
                    </li>
                    <li>
                      <strong>Alerta de Duplicidade de Guia:</strong> A verificação deve travar por Número da Guia ou pela combinação Paciente + Prestador + Data da Sessão?
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sessoes' && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold font-['Quicksand'] text-slate-900">
                    Cronograma de Sessões Autorizadas
                  </h2>
                  <p className="text-xs text-slate-500">
                    Garantia da regra Mefisa: existe exatamente 1 sessão antes da data de renovação da autorização.
                  </p>
                </div>
                <button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="px-4 py-2 bg-[#002172] text-white rounded-xl text-xs font-bold"
                >
                  Calcular Novo Cronograma Proporcional
                </button>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-2">
                <div className="font-bold">Regra de Proporcionalidade Aplicada:</div>
                <p>
                  Quando a última sessão de um ciclo for realizada, o sistema libera automaticamente o status da guia para "AGUARDANDO DIGITAÇÃO", alertando a funcionária para digitação no portal SulAmérica.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Modais e Gavetas Interativas */}
      <CalculationPreviewModal
        isOpen={isCalculatorOpen}
        onClose={() => setIsCalculatorOpen(false)}
      />

      <AuditTrailDrawer
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={MOCK_AUDITORIA}
      />

      <ArchitectureDocModal
        isOpen={isArchDocOpen}
        onClose={() => setIsArchDocOpen(false)}
      />

      <SecretAchievementsModal />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <SecretAchievementsProvider>
        <MainApp />
      </SecretAchievementsProvider>
    </ThemeProvider>
  );
}
