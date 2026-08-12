import React, { useState } from 'react';
import { useAtom } from 'jotai';
import { currentViewAtom, activeModalAtom, canvasThemeAtom } from '../store/atoms';
import {
  Workflow,
  Play,
  Share2,
  Code2,
  Kanban,
  Zap,
  ArrowRight,
  CheckCircle2,
  Activity,
  ShieldCheck,
  Layers,
  FileCode,
  Users,
  Compass,
  LayoutGrid,
  ChevronRight,
  FolderOpen,
  Terminal,
  BarChart3,
  GitBranch,
  Lock,
  Globe,
} from 'lucide-react';

export function HomeScreen() {
  const [, setCurrentView] = useAtom(currentViewAtom);
  const [, setActiveModal] = useAtom(activeModalAtom);
  const [theme] = useAtom(canvasThemeAtom);
  const [activeAudience, setActiveAudience] = useState<'pms' | 'devs'>('pms');

  const openCanvas = () => setCurrentView('canvas');

  const openSimulation = () => {
    setCurrentView('canvas');
    setActiveModal('simulation');
  };

  const openDiagrams = () => {
    setCurrentView('canvas');
    setActiveModal('diagrams');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-slate-950 py-16 lg:py-24 px-6 md:px-12">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 dark:bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto">
          {/* Top Hub Badge */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 text-xs font-semibold mb-6">
            <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
            <span>Plataforma de Processos & Hub de Ecossistemas</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Main Content */}
            <div className="lg:col-span-7 space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
                Alinhe Negócios e Engenharia com{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 dark:from-indigo-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
                  Processos Executáveis
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                O portal unificado para <strong>Gerentes de Projetos</strong> desenharem regras de negócio sem ambiguidades e <strong>Desenvolvedores</strong> gerarem especificações, JSONs e BPMN 2.0 para engines de workflow.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={openCanvas}
                  className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30 flex items-center space-x-2.5 group cursor-pointer"
                >
                  <Workflow className="w-5 h-5 text-indigo-100" />
                  <span>Abrir Criador de Fluxo (BPMN Studio)</span>
                  <ArrowRight className="w-4 h-4 text-indigo-200 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={openSimulation}
                  className="px-5 py-3.5 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold rounded-xl text-sm border border-emerald-200 dark:border-emerald-800 transition-all flex items-center space-x-2 cursor-pointer"
                >
                  <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400 fill-current" />
                  <span>Simular Processo</span>
                </button>
              </div>

              {/* Key Assurance Indicators */}
              <div className="pt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Padrão BPMN 2.0 XML</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Zero Lock-in Export</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Criptografia E2EE Sync</span>
                </div>
              </div>
            </div>

            {/* Hero Interactive Card / Preview Mockup */}
            <div className="lg:col-span-5">
              <div
                onClick={openCanvas}
                className="group relative bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl hover:border-indigo-500/50 dark:hover:border-indigo-500/50 transition-all duration-300 cursor-pointer overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-rose-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-emerald-400" />
                    <span className="text-xs font-mono text-slate-400 ml-2">order-processing.bpmn</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                    Modo Studio
                  </span>
                </div>

                {/* Canvas Diagram Preview Simulation Graphics */}
                <div className="space-y-3 bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 pb-1 border-b border-slate-200/50 dark:border-slate-800/50 text-[11px]">
                    <span className="flex items-center space-x-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Workflow className="w-3.5 h-3.5" />
                      <span>Studio Canvas Activo</span>
                    </span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">99.8% Eficiência</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 rounded-lg text-emerald-800 dark:text-emerald-200 font-semibold">
                      Start Event
                      <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-normal">Message In</div>
                    </div>
                    <div className="p-2.5 bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-lg text-blue-800 dark:text-blue-200 font-semibold">
                      Service Task
                      <div className="text-[9px] text-blue-600 dark:text-blue-400 font-normal">API Gateway</div>
                    </div>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 rounded-lg text-amber-800 dark:text-amber-200 font-semibold">
                      Gateway XOR
                      <div className="text-[9px] text-amber-600 dark:text-amber-400 font-normal">Decisão PM</div>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-900 text-slate-200 rounded-lg text-[10px] font-mono leading-relaxed overflow-hidden">
                    <span className="text-purple-400">&lt;bpmn:process</span> <span className="text-amber-300">id</span>=<span className="text-emerald-300">"OrderFlow_01"</span>&gt;<br />
                    &nbsp;&nbsp;<span className="text-purple-400">&lt;bpmn:startEvent</span> <span className="text-amber-300">id</span>=<span className="text-emerald-300">"Start_01"</span> /&gt;<br />
                    &nbsp;&nbsp;<span className="text-purple-400">&lt;bpmn:serviceTask</span> <span className="text-amber-300">topic</span>=<span className="text-emerald-300">"payment-api"</span> /&gt;
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Clique para abrir o editor de tela cheia</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Target Roles Toggle Section (PMs vs Devs) */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Projetado para as Necessidades de Toda a Equipe
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl mx-auto">
            Elimine ruídos de comunicação. Gerentes de Projeto estruturam requisitos claros e Desenvolvedores recebem arquivos técnicos imediatamente executáveis.
          </p>

          {/* Role Tabs */}
          <div className="inline-flex p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-xl text-xs font-semibold mt-4">
            <button
              onClick={() => setActiveAudience('pms')}
              className={`px-5 py-2 rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                activeAudience === 'pms'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Para Gerentes de Projetos (PMs)</span>
            </button>

            <button
              onClick={() => setActiveAudience('devs')}
              className={`px-5 py-2 rounded-lg transition-all flex items-center space-x-2 cursor-pointer ${
                activeAudience === 'devs'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Para Desenvolvedores (Devs)</span>
            </button>
          </div>
        </div>

        {/* Content based on Active Role */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeAudience === 'pms' ? (
            <>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Simulação de Gargalos & Latência</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Testes interativos executam token por token nos nós do processo. Identifique tempos mortos e custos antes de aprovar desenvolvimento.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Alinhamento Sem Ambiguidades</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Documente regras de negócio, atribuindo User Tasks, prazos e prioridades direto nos elementos visuais do diagrama.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Relatórios & Apresentações</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Exporte diagramas em SVG/PNG de alta resolução, arquivos de rascunho sketch ou relatórios em XML compatíveis com padrões corporativos.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                  <FileCode className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">BPMN 2.0 XML & JSON Schemas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Gere arquivos BPMN 2.0 limpos prontos para importação em Camunda, Zeebe, Temporal ou Flowable sem retrabalho manual.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Service Tasks & Topics API</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Especifique tópicos pub/sub, handlers de microserviços e payloads de webhooks diretamente nas propriedades avançadas do nó.
                </p>
              </div>

              <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Colaboração E2EE Segura</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Trabalhe em tempo real com colegas de equipe com criptografia de ponta a ponta na nuvem para manter a confidencialidade dos fluxos.
                </p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Hub Ecosystem Modules Grid */}
      <section className="py-16 px-6 md:px-12 bg-slate-100/60 dark:bg-slate-900/40 border-y border-slate-200/80 dark:border-slate-800/80">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="text-indigo-600 dark:text-indigo-400 font-semibold text-xs tracking-wider uppercase mb-1">
                Ecossistema Unificado
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Módulos do Hub do Projeto
              </h2>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs max-w-md">
              Acesse as ferramentas disponíveis no hub ou visualize as próximas integrações que enriquecerão a governança do seu projeto.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Module 1: Flow Creator (Core) */}
            <div
              onClick={openCanvas}
              className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-indigo-200 dark:border-indigo-900/60 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                    <Workflow className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                    Ativo
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Criador de Fluxo (BPMN)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modelador visual completo com suporte a tasks, gateways, eventos e piscinas/lanes.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                <span>Abrir Estúdio</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 2: Process Simulator */}
            <div
              onClick={openSimulation}
              className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-xl">
                    <Play className="w-5 h-5 fill-current" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                    Ativo
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Simulador de Regras
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Motor de execução passo-a-passo com tokens animados e caminhos condicionais.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <span>Simular Agora</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 4: Repositório & Modelos */}
            <div
              onClick={openDiagrams}
              className="group p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-indigo-500 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-xl">
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full">
                    Ativo
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Gerenciador de Modelos
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gerencie modelos salvos, rascunhos e controle de versões de diagramas.
                </p>
              </div>
              <div className="pt-4 flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
                <span>Explorar Projetos</span>
                <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Module 5: Analytics & KPIs (Coming soon) */}
            <div className="p-5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 opacity-80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                    Em Breve
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Dashboard de KPIs PM
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Métricas em tempo real de SLOs, tempo médio por tarefa e produtividade de squads.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-slate-400">Módulo em Integração</div>
            </div>

            {/* Module 6: Dev Webhooks & Integration (Coming soon) */}
            <div className="p-5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 opacity-80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                    <GitBranch className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                    Em Breve
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Portal de Integradores Dev
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Geração automática de SDKs, rotas API REST/gRPC e webhooks para acionar processos.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-slate-400">Módulo em Integração</div>
            </div>

            {/* Module 7: Compliance & Policy (Coming soon) */}
            <div className="p-5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 opacity-80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                    Em Breve
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Governança & Compliance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Audit trail de edições, conformidade com LGPD/ISO e aprovações formais de processos.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-slate-400">Módulo em Integração</div>
            </div>

            {/* Module 8: Multi-tenant Organizations (Coming soon) */}
            <div className="p-5 bg-white/60 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 opacity-80 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full">
                    Em Breve
                  </span>
                </div>
                <h3 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  Gestão Multitenant & Espaços
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Espaços isolados para diferentes tribos de produtos, unidades de negócios e parceiros.
                </p>
              </div>
              <div className="pt-4 text-xs font-medium text-slate-400">Módulo em Integração</div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Launch CTA Banner */}
      <section className="py-16 px-6 md:px-12 max-w-6xl mx-auto">
        <div className="p-8 sm:p-12 bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-900 text-white rounded-3xl relative overflow-hidden shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 border border-indigo-800/50">
          <div className="space-y-3 max-w-xl">
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pronto para desenhar e executar seu próximo processo?
            </h2>
            <p className="text-indigo-200 text-sm leading-relaxed">
              Inicie agora mesmo no Criador de Fluxo. Importe diagramas BPMN existentes, simule regras de negócio ou comece do zero com a paleta interativa.
            </p>
          </div>

          <button
            onClick={openCanvas}
            className="px-8 py-4 bg-white hover:bg-indigo-50 text-indigo-950 font-bold rounded-2xl text-sm transition-all shadow-xl hover:scale-[1.02] shrink-0 flex items-center space-x-2.5 cursor-pointer"
          >
            <Workflow className="w-5 h-5 text-indigo-600" />
            <span>Abrir Criador de Fluxo</span>
            <ArrowRight className="w-4 h-4 text-indigo-600" />
          </button>
        </div>
      </section>
    </div>
  );
}
