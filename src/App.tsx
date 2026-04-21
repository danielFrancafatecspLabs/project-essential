import { useMemo, useState } from 'react'

type Tone = 'neutral' | 'close' | 'any'
type YesLater = 'yes' | 'later'
type DashboardTab = 'menu' | 'caixinhas' | 'perfil'

type Question = {
  id: string
  prompt: string
  options: Array<{
    label: string
    value: number
  }>
}

type Villain =
  | 'uber'
  | 'ifood'
  | 'shopping'
  | 'fun'
  | 'card'
  | 'unsure'

type AppState = {
  stage: number
  expectationAccepted: boolean
  tone: Tone | null
  treatment: string
  diagnosisAnswers: number[]
  villain: Villain | null
  chosenAgreement: string
  reminderChoice: YesLater | null
  googleLinked: boolean
  googleName: string
  goalChecks: boolean[]
  dashboardTab: DashboardTab
}

type DiagnosticItem = {
  label: string
  score: number
}

type RiskBand = {
  label: string
  toneClass: 'low' | 'mid' | 'high'
  message: string
}

const STORAGE_KEY = 'deboa-mvp-v1'

const questions: Question[] = [
  {
    id: 'income',
    prompt: 'Sua renda costuma ser previsivel?',
    options: [
      { label: 'Sim, quase sempre igual', value: 0 },
      { label: 'As vezes varia bastante', value: 1 },
      { label: 'Nao, muda muito todo mes', value: 2 },
    ],
  },
  {
    id: 'month-end',
    prompt: 'O dinheiro acaba antes do fim do mes?',
    options: [
      { label: 'Raramente', value: 0 },
      { label: 'Acontece em alguns meses', value: 1 },
      { label: 'Acontece quase todo mes', value: 2 },
    ],
  },
  {
    id: 'debts',
    prompt: 'Hoje voce tem dividas ou muitas parcelas?',
    options: [
      { label: 'Nao ou quase nada', value: 0 },
      { label: 'Tenho algumas', value: 1 },
      { label: 'Tenho varias e pesa no mes', value: 2 },
    ],
  },
  {
    id: 'card',
    prompt: 'Como esta seu uso do cartao?',
    options: [
      { label: 'Uso com controle', value: 0 },
      { label: 'As vezes passo do ponto', value: 1 },
      { label: 'Sinto que perdi o controle', value: 2 },
    ],
  },
  {
    id: 'surprises',
    prompt: 'Se aparece um imprevisto, voce consegue lidar?',
    options: [
      { label: 'Consigo sem grandes dores', value: 0 },
      { label: 'Consigo, mas aperta', value: 1 },
      { label: 'Quase nao consigo', value: 2 },
    ],
  },
  {
    id: 'anxiety',
    prompt: 'Pensar em dinheiro te deixa ansioso(a)?',
    options: [
      { label: 'Pouco', value: 0 },
      { label: 'Em alguns momentos', value: 1 },
      { label: 'Quase sempre', value: 2 },
    ],
  },
]

const villainLabels: Record<Villain, string> = {
  uber: 'Uber / apps de mobilidade',
  ifood: 'iFood / delivery',
  shopping: 'Compras nao planejadas',
  fun: 'Role / lazer recorrente',
  card: 'Cartao / parcelas',
  unsure: 'Nem sei direito',
}

const villainPlans: Record<
  Villain,
  {
    reason: string
    agreements: string[]
  }
> = {
  uber: {
    reason:
      'Mobilidade por app parece pequena no dia, mas vira um bloco grande no fim do mes.',
    agreements: [
      'Usar app so em 2 dias fixos da semana',
      'Evitar corridas curtas e fazer trechos a pe quando der',
      'Comparar alternativa de transporte 1x por dia antes de pedir',
      'Definir um teto mental por semana para corridas',
    ],
  },
  ifood: {
    reason:
      'Delivery soma taxa, impulso e frequencia. Quando junta, pesa mais do que parece.',
    agreements: [
      'Escolher 2 dias fixos para pedir',
      'Olhar a geladeira antes de abrir o app',
      'Trocar 1 pedido da semana por algo simples em casa',
      'Esperar 15 minutos antes de confirmar o pedido',
    ],
  },
  shopping: {
    reason:
      'Compras pequenas e nao planejadas passam despercebidas e drenam sua margem.',
    agreements: [
      'Aplicar a regra dos 10 minutos antes de comprar',
      'Evitar comprar sem lista durante a semana',
      'Escolher um unico dia para compras extras',
      'Trocar 1 compra por usar algo que ja tem em casa',
    ],
  },
  fun: {
    reason:
      'Lazer recorrente sem combinado claro costuma estourar o ritmo do mes.',
    agreements: [
      'Fazer 1 role consciente por semana',
      'Sair com gasto mental definido antes de sair',
      'Beber ou comer algo leve antes de sair',
      'Intercalar role pago com role de baixo custo',
    ],
  },
  card: {
    reason:
      'Cartao mistura presente e futuro. Parcelas acumuladas tiram folego dos proximos meses.',
    agreements: [
      'Evitar novas parcelas pelos proximos 7 dias',
      'Usar cartao so para o que ja estava planejado',
      'Conferir fatura 1x por dia antes de qualquer compra',
      'Esperar 24h para compras acima de impulso',
    ],
  },
  unsure: {
    reason:
      'Quando o vilao nao esta claro, o impulso espalhado costuma ser o principal vazamento.',
    agreements: [
      'Anotar por 7 dias todo gasto por impulso em 1 frase',
      'Fazer uma pausa de 10 minutos antes de qualquer compra nao planejada',
      'Escolher 1 dia sem compras por app na semana',
      'Rever no fim da semana qual gasto mais se repetiu',
    ],
  },
}

const villainFocusCopy: Record<Villain, string> = {
  uber: 'Mobilidade consciente sem perder liberdade',
  ifood: 'Delivery com limite claro e sem culpa',
  shopping: 'Consumo intencional no lugar do impulso',
  fun: 'Lazer que cabe na semana real',
  card: 'Cartao no controle para recuperar folego',
  unsure: 'Mapear vazamentos para ganhar clareza',
}

const initialState: AppState = {
  stage: 0,
  expectationAccepted: false,
  tone: null,
  treatment: '',
  diagnosisAnswers: [],
  villain: null,
  chosenAgreement: '',
  reminderChoice: null,
  googleLinked: false,
  googleName: '',
  goalChecks: Array.from({ length: 7 }, () => false),
  dashboardTab: 'menu',
}

function loadState(): AppState {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    return initialState
  }

  try {
    return { ...initialState, ...JSON.parse(stored) }
  } catch {
    return initialState
  }
}

function voicePrefix(tone: Tone | null, treatment: string): string {
  const cleanTreatment = treatment.trim()
  if (tone === 'close' && cleanTreatment) {
    return `${cleanTreatment}, `
  }
  return ''
}

function voiceLabel(tone: Tone | null): 'neutral' | 'close' {
  return tone === 'close' ? 'close' : 'neutral'
}

function buildDiagnosticSummary(answers: number[]): DiagnosticItem[] {
  const labels = [
    'renda imprevisivel',
    'dinheiro acabando antes do mes',
    'comprometimento com dividas e parcelas',
    'uso de cartao pressionando o mes',
    'baixa margem para imprevistos',
    'ansiedade alta com dinheiro',
  ]

  return labels
    .map((label, index) => ({ label, score: answers[index] ?? 0 }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
}

function getRiskBand(score: number): RiskBand {
  if (score <= 3) {
    return {
      label: 'Pressao estrutural leve',
      toneClass: 'low',
      message: 'Seu momento pede constancia. Pequenos deslizes ainda sao reversiveis.',
    }
  }

  if (score <= 7) {
    return {
      label: 'Pressao estrutural moderada',
      toneClass: 'mid',
      message: 'Seu foco deve ser proteger a semana para nao acumular novas frentes de aperto.',
    }
  }

  return {
    label: 'Pressao estrutural alta',
    toneClass: 'high',
    message: 'Agora o principal e travar danos e repetir acordos simples com consistencia.',
  }
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [googleNameInput, setGoogleNameInput] = useState('')

  const diagnosticItems = useMemo(
    () => buildDiagnosticSummary(state.diagnosisAnswers),
    [state.diagnosisAnswers],
  )
  const completedDays = state.goalChecks.filter(Boolean).length
  const totalPressure = state.diagnosisAnswers.reduce(
    (total, value) => total + value,
    0,
  )
  const riskBand = getRiskBand(totalPressure)
  const topSignals = diagnosticItems.slice(0, 3)
  const progressPercent = Math.round((completedDays / 7) * 100)
  const pendingDayIndex = state.goalChecks.findIndex((checked) => !checked)
  const userDisplayName = state.googleName || 'voce'

  const selectedTone = voiceLabel(state.tone)
  const prefix = voicePrefix(state.tone, state.treatment)
  const currentQuestionIndex = Math.max(0, state.stage - 6)
  const currentQuestion = questions[currentQuestionIndex]
  const selectedVillain = state.villain ?? 'unsure'
  const selectedPlan = villainPlans[selectedVillain]

  const dashboardTabs: Array<{ id: DashboardTab; label: string; icon: string }> = [
    { id: 'perfil', label: 'Perfil', icon: '🙂' },
    { id: 'menu', label: 'Menu', icon: '▦' },
    { id: 'caixinhas', label: 'Caixinhas', icon: '◫' },
  ]

  function persist(next: AppState) {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function nextStage() {
    persist({ ...state, stage: state.stage + 1 })
  }

  function updateAnswer(value: number) {
    const nextAnswers = [...state.diagnosisAnswers]
    nextAnswers[currentQuestionIndex] = value
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    persist({
      ...state,
      diagnosisAnswers: nextAnswers,
      stage: isLastQuestion ? 12 : state.stage + 1,
    })
  }

  function selectTone(value: Tone) {
    if (value === 'neutral') {
      persist({
        ...state,
        tone: value,
        treatment: '',
        stage: 5,
      })
      return
    }

    persist({ ...state, tone: value, stage: 4 })
  }

  function saveTreatmentAndContinue() {
    persist({ ...state, stage: 5 })
  }

  function applyRestart() {
    localStorage.removeItem(STORAGE_KEY)
    setState(initialState)
  }

  function linkGoogleAndOpenDashboard() {
    const cleanName = googleNameInput.trim()
    if (!cleanName) {
      return
    }

    persist({
      ...state,
      googleLinked: true,
      googleName: cleanName,
      stage: 17,
    })
  }

  function toggleGoalCheck(index: number) {
    const nextChecks = [...state.goalChecks]
    nextChecks[index] = !nextChecks[index]
    persist({ ...state, goalChecks: nextChecks })
  }

  function markNextPendingDay() {
    if (pendingDayIndex < 0) {
      return
    }

    const nextChecks = [...state.goalChecks]
    nextChecks[pendingDayIndex] = true
    persist({ ...state, goalChecks: nextChecks })
  }

  return (
    <div className="app-shell">
      <div className="ambient-bg" aria-hidden="true" />
      <main className="phone-frame">
        {state.stage === 0 && (
          <section className="panel landing">
            <div className="deboa-logo" aria-hidden="true">
              <span className="logo-ring" />
              <span className="logo-core">D</span>
              <span className="logo-orbit" />
            </div>
            <p className="eyebrow">Assistente financeiro sem pressao</p>
            <h1>Fique DeBoa. Planeje sua vida financeira com calma.</h1>
            <p className="lead">
              Um assistente simples para te ajudar a nao piorar a vida financeira,
              com combinados reais e um passo de cada vez.
            </p>
            <button className="primary" onClick={nextStage}>
              Comecar agora
            </button>
          </section>
        )}

        {state.stage === 1 && (
          <section className="panel">
            <h2>Boas-vindas</h2>
            <p>
              Este espaco e para respirar e organizar sua vida financeira sem culpa,
              sem planilha e sem julgamento.
            </p>
            <button className="primary" onClick={nextStage}>
              Continuar
            </button>
          </section>
        )}

        {state.stage === 2 && (
          <section className="panel">
            <h2>Antes da gente seguir</h2>
            <p>
              O DeBoa nao e banco e nao faz milagre. A ideia aqui e te ajudar a
              evitar que a situacao piore.
            </p>
            <label className="check-row">
              <input
                type="checkbox"
                checked={state.expectationAccepted}
                onChange={(event) =>
                  persist({
                    ...state,
                    expectationAccepted: event.target.checked,
                  })
                }
              />
              Pode seguir
            </label>
            <button
              className="primary"
              disabled={!state.expectationAccepted}
              onClick={nextStage}
            >
              Continuar
            </button>
          </section>
        )}

        {state.stage === 3 && (
          <section className="panel">
            <h2>Como voce prefere que a gente converse por aqui?</h2>
            <div className="stacked-options">
              <button className="option" onClick={() => selectTone('neutral')}>
                De forma tranquila e neutra
              </button>
              <button className="option" onClick={() => selectTone('close')}>
                De forma proxima, como conversa
              </button>
              <button className="option" onClick={() => selectTone('any')}>
                Tanto faz
              </button>
            </div>
          </section>
        )}

        {state.stage === 4 && (
          <section className="panel">
            <h2>Se quiser, posso te chamar de um jeito especifico.</h2>
            <input
              className="text-input"
              placeholder="Ex: brother, parceira, amigo"
              value={state.treatment}
              onChange={(event) =>
                persist({ ...state, treatment: event.target.value })
              }
            />
            <p className="hint">Opcional. Se ficar vazio, seguimos normal.</p>
            <button className="primary" onClick={saveTreatmentAndContinue}>
              Continuar
            </button>
          </section>
        )}

        {state.stage === 5 && (
          <section className="panel">
            <h2>Diagnostico rapido</h2>
            <p>
              Nao existem respostas certas ou erradas. Sao 6 perguntas objetivas
              para entendermos o ponto de partida.
            </p>
            <button className="primary" onClick={nextStage}>
              Comecar diagnostico
            </button>
          </section>
        )}

        {state.stage >= 6 && state.stage <= 11 && currentQuestion && (
          <section className="panel">
            <p className="progress">
              Pergunta {currentQuestionIndex + 1} de {questions.length}
            </p>
            <h2>{currentQuestion.prompt}</h2>
            <div className="stacked-options">
              {currentQuestion.options.map((option) => (
                <button
                  key={option.label}
                  className="option"
                  onClick={() => updateAnswer(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {state.stage === 12 && (
          <section className="panel">
            <h2>
              {selectedTone === 'close'
                ? `${prefix}isso e mais comum do que parece.`
                : 'Isso e mais comum do que parece.'}
            </h2>
            <p>
              Seu diagnostico estrutural mostra {diagnosticItems.length > 0
                ? diagnosticItems
                    .slice(0, 3)
                    .map((item) => item.label)
                    .join(', ')
                : 'sinais leves de desorganizacao pontual'}.
            </p>
            <p>
              Organizacao sozinha nao resolve tudo agora. Tem fatores que apertam
              de verdade e isso nao e culpa sua.
            </p>
            <p className="highlight">
              Direcao clara: foco agora e parar de piorar, com um combinado simples
              e sustentavel.
            </p>
            <button className="primary" onClick={nextStage}>
              Escolher foco da semana
            </button>
          </section>
        )}

        {state.stage === 13 && (
          <section className="panel">
            <h2>O que mais aperta seu mes hoje?</h2>
            <div className="stacked-options">
              {(Object.keys(villainLabels) as Villain[]).map((villain) => (
                <button
                  key={villain}
                  className={`option ${state.villain === villain ? 'active' : ''}`}
                  onClick={() =>
                    persist({
                      ...state,
                      villain,
                      chosenAgreement: '',
                    })
                  }
                >
                  {villainLabels[villain]}
                </button>
              ))}
            </div>
            <button
              className="primary"
              disabled={!state.villain}
              onClick={nextStage}
            >
              Continuar
            </button>
          </section>
        )}

        {state.stage === 14 && (
          <section className="panel">
            <h2>Combinado da semana</h2>
            <p>{selectedPlan.reason}</p>
            <p className="highlight subtle">
              Nao e para cortar tudo. A ideia e reduzir o estrago sem sofrimento.
            </p>
            <div className="stacked-options">
              {selectedPlan.agreements.map((agreement) => (
                <button
                  key={agreement}
                  className={`option ${
                    state.chosenAgreement === agreement ? 'active' : ''
                  }`}
                  onClick={() => persist({ ...state, chosenAgreement: agreement })}
                >
                  {agreement}
                </button>
              ))}
            </div>
            <button
              className="primary"
              disabled={!state.chosenAgreement}
              onClick={nextStage}
            >
              Fechar combinado
            </button>
          </section>
        )}

        {state.stage === 15 && (
          <section className="panel">
            <h2>Fechamos esse combinado por 7 dias.</h2>
            <p className="lead">{state.chosenAgreement}</p>
            <p>Posso te lembrar depois?</p>
            <div className="split-actions">
              <button
                className={`option ${
                  state.reminderChoice === 'yes' ? 'active' : ''
                }`}
                onClick={() =>
                  persist({
                    ...state,
                    reminderChoice: 'yes',
                    stage: 16,
                  })
                }
              >
                Sim
              </button>
              <button
                className={`option ${
                  state.reminderChoice === 'later' ? 'active' : ''
                }`}
                onClick={() =>
                  persist({
                    ...state,
                    reminderChoice: 'later',
                    stage: 16,
                  })
                }
              >
                Depois
              </button>
            </div>
          </section>
        )}

        {state.stage === 16 && (
          <section className="panel">
            <h2>Agora vamos personalizar seu acompanhamento.</h2>
            <p>
              Depois de fechar o combinado, conecte seu Google para liberar seu
              dashboard de metas com acompanhamento da semana.
            </p>
            <input
              className="text-input"
              placeholder="Nome da conta Google"
              value={googleNameInput}
              onChange={(event) => setGoogleNameInput(event.target.value)}
            />
            <p className="hint">
              No MVP, este campo simula o vinculo Google no front-end.
            </p>
            <button
              className="primary"
              disabled={!googleNameInput.trim()}
              onClick={linkGoogleAndOpenDashboard}
            >
              Vincular com Google
            </button>
          </section>
        )}

        {state.stage === 17 && (
          <section className="panel dashboard-shell with-bottom-nav">
            <div className="brand-strip">
              <div className="deboa-logo mini" aria-hidden="true">
                <span className="logo-ring" />
                <span className="logo-core">D</span>
                <span className="logo-orbit" />
              </div>
              <p className="brand-text">DeBoa</p>
            </div>

            <div key={state.dashboardTab} className="tab-content-scene">
              {state.dashboardTab === 'menu' && (
                <>
                  <header className="dashboard-hero">
                    <div className="hero-head">
                      <span className="avatar-pill" aria-hidden="true">
                        {userDisplayName.charAt(0).toUpperCase()}
                      </span>
                      <div>
                        <p className="eyebrow">Painel DeBoa</p>
                        <h2>
                          {selectedTone === 'close'
                            ? `${prefix}seguimos juntos, ${userDisplayName}.`
                            : `Seguimos juntos, ${userDisplayName}.`}
                        </h2>
                      </div>
                    </div>
                    <div className="hero-chips">
                      <span className="status-chip">Ciclo de 7 dias ativo</span>
                      <span className={`status-chip risk ${riskBand.toneClass}`}>
                        {riskBand.label}
                      </span>
                    </div>
                    <p>{riskBand.message}</p>
                  </header>

                  <div className="dashboard-grid">
                    <article className="dashboard-card wide">
                      <p className="card-label">Combinado principal</p>
                      <p className="card-main">{state.chosenAgreement}</p>
                      <p className="card-sub">Foco: {villainFocusCopy[selectedVillain]}</p>
                    </article>

                    <article className="dashboard-card">
                      <p className="card-label">Progresso da meta</p>
                      <p className="card-main">{completedDays}/7 dias concluidos</p>
                      <div className="progress-track" aria-hidden="true">
                        <div
                          className="progress-fill"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="card-sub">{progressPercent}% da meta semanal cumprida</p>
                    </article>

                    <article className="dashboard-card">
                      <p className="card-label">Leitura personalizada</p>
                      {topSignals.length > 0 ? (
                        <ul className="signal-list">
                          {topSignals.map((item) => (
                            <li key={item.label}>{item.label}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="card-sub">Sem sinais criticos no momento.</p>
                      )}
                    </article>
                  </div>
                </>
              )}

              {state.dashboardTab === 'caixinhas' && (
                <>
                  <header className="dashboard-hero">
                    <p className="eyebrow">Caixinhas de protecao</p>
                    <h2>Reserve energia para o mes nao piorar.</h2>
                    <p>
                      Cada caixinha representa uma camada de defesa do seu combinado.
                    </p>
                  </header>
                  <div className="dashboard-grid">
                    <article className="dashboard-card">
                      <p className="card-label">Caixinha 1</p>
                      <p className="card-main">Semana sem compra por impulso</p>
                      <p className="card-sub">Meta ativa e conectada ao seu combinado atual.</p>
                    </article>
                    <article className="dashboard-card">
                      <p className="card-label">Caixinha 2</p>
                      <p className="card-main">Respirar antes de gastar</p>
                      <p className="card-sub">Pausa curta para quebrar o piloto automatico.</p>
                    </article>
                    <article className="dashboard-card wide">
                      <p className="card-label">Check-in diario sem compras fora do combinado</p>
                      <div className="day-grid">
                        {state.goalChecks.map((checked, index) => (
                          <label
                            key={index + 1}
                            className={`day-check ${checked ? 'done' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleGoalCheck(index)}
                            />
                            Dia {index + 1}
                          </label>
                        ))}
                      </div>
                      <div className="quick-actions">
                        <button
                          className="option"
                          disabled={pendingDayIndex < 0}
                          onClick={markNextPendingDay}
                        >
                          Marcar proximo dia concluido
                        </button>
                        <button
                          className="option"
                          onClick={() => persist({ ...state, stage: 14 })}
                        >
                          Ajustar combinado
                        </button>
                      </div>
                    </article>
                  </div>
                </>
              )}

              {state.dashboardTab === 'perfil' && (
                <>
                  <header className="dashboard-hero">
                    <p className="eyebrow">Seu perfil DeBoa</p>
                    <h2>{userDisplayName}</h2>
                    <p>Conta Google vinculada e painel personalizado ativo.</p>
                  </header>
                  <div className="dashboard-grid">
                    <article className="dashboard-card wide">
                      <p className="card-label">Seu jeito de conversa</p>
                      <p className="card-main">
                        {selectedTone === 'close' ? 'Tom proximo' : 'Tom neutro'}
                      </p>
                      <p className="card-sub">
                        Tratamento personalizado:{' '}
                        {state.treatment.trim() ? state.treatment : 'sem apelido'}
                      </p>
                    </article>
                    <article className="dashboard-card">
                      <p className="card-label">Diagnostico atual</p>
                      <p className="card-main">{riskBand.label}</p>
                      <p className="card-sub">{riskBand.message}</p>
                    </article>
                    <article className="dashboard-card">
                      <p className="card-label">Conquistas da semana</p>
                      <p className="card-main">{completedDays} dias marcados</p>
                      <p className="card-sub">Continue no ritmo para fechar os 7 dias.</p>
                    </article>
                    <article className="dashboard-card wide">
                      <button className="primary" onClick={applyRestart}>
                        Iniciar novo ciclo
                      </button>
                    </article>
                  </div>
                </>
              )}
            </div>

            <nav className="bottom-nav" aria-label="Navegacao principal do app">
              {dashboardTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-item ${state.dashboardTab === tab.id ? 'active' : ''}`}
                  onClick={() => persist({ ...state, dashboardTab: tab.id })}
                >
                  <span aria-hidden="true" className="nav-icon">
                    {tab.icon}
                  </span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </section>
        )}
      </main>
    </div>
  )
}

export default App
