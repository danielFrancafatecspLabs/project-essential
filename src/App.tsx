import { useMemo, useState } from 'react'

type Tone = 'neutral' | 'close' | 'any'
type YesLater = 'yes' | 'later'
type DashboardTab = 'home' | 'contas' | 'combinados' | 'mes'
type AccountCategory = 'essential' | 'commitment' | 'variable'
type AccountStatus = 'ok' | 'attention' | 'risk'
type Recurrence = 'unica' | 'semanal' | 'mensal'
type Screen = 'landing' | 'onboarding' | 'journey'

type Question = {
  id: string
  prompt: string
  options: Array<{
    label: string
    value: number
  }>
}

type Villain = 'uber' | 'ifood' | 'shopping' | 'fun' | 'card' | 'unsure'

type AccountItem = {
  id: string
  name: string
  dueDate: string
  recurrence: Recurrence
  category: AccountCategory | 'pending'
  status: AccountStatus
  needsConfirmation: boolean
}

type CombinedItem = {
  id: string
  title: string
  reason: string
  impact: string
  stage: 1 | 2 | 3 | 4
  active: boolean
  done: boolean
}

type HistoryItem = {
  id: string
  text: string
  at: string
}

type AppState = {
  screen: Screen
  onboardingStep: number
  expectationAccepted: boolean
  tone: Tone | null
  treatment: string
  diagnosisAnswers: number[]
  villain: Villain | null
  chosenAgreement: string
  reminderChoice: YesLater | null
  googleLinked: boolean
  googleName: string
  dashboardTab: DashboardTab
  reserveMarks: boolean[]
  goalChecks: boolean[]
  accounts: AccountItem[]
  combineds: CombinedItem[]
  history: HistoryItem[]
  accountDraftName: string
  accountDraftDate: string
  accountDraftRecurrence: Recurrence
  accountDraftCategory: AccountCategory | ''
}

type DiagnosticItem = {
  label: string
  score: number
}

type JourneyStage = {
  id: 1 | 2 | 3 | 4
  title: string
  objective: string
  progress: number
  mission: string
  statusLabel: string
}

type StatusTone = 'tranquilo' | 'atencao' | 'risco'

const STORAGE_KEY = 'deboa-mvp-v2'

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

const statusLabels: Record<StatusTone, string> = {
  tranquilo: 'Esse mes esta sob controle',
  atencao: 'Esse mes pode apertar',
  risco: 'Se nada mudar, pode faltar dinheiro',
}

const categoryLabels: Record<AccountCategory, string> = {
  essential: 'Essencial',
  commitment: 'Compromisso',
  variable: 'Variavel',
}

const categoryColorClass: Record<AccountCategory, string> = {
  essential: 'blue',
  commitment: 'amber',
  variable: 'green',
}

const stageTitles: Record<1 | 2 | 3 | 4, string> = {
  1: 'Se libertar daquilo que mais te prejudica',
  2: 'Agora e hora de juntar',
  3: 'Agora e hora de quitar',
  4: 'Agora e hora de pensar na liberdade',
}

const stageObjectives: Record<1 | 2 | 3 | 4, string> = {
  1: 'Interromper vazamentos e ativar combinados simples.',
  2: 'Criar microprotecao com pequenos guardados frequentes.',
  3: 'Organizar pendencias e reduzir peso mental.',
  4: 'Dar visao de folga, autonomia e continuidade.',
}

const initialState: AppState = {
  screen: 'landing',
  onboardingStep: 0,
  expectationAccepted: false,
  tone: null,
  treatment: '',
  diagnosisAnswers: [],
  villain: null,
  chosenAgreement: '',
  reminderChoice: null,
  googleLinked: false,
  googleName: '',
  dashboardTab: 'home',
  reserveMarks: Array.from({ length: 7 }, () => false),
  goalChecks: Array.from({ length: 7 }, () => false),
  accounts: [],
  combineds: [],
  history: [],
  accountDraftName: '',
  accountDraftDate: '',
  accountDraftRecurrence: 'mensal',
  accountDraftCategory: '',
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
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

function classifyAccount(name: string): {
  category: AccountCategory | 'pending'
  needsConfirmation: boolean
} {
  const cleanName = name.toLowerCase()

  if (
    ['aluguel', 'agua', 'luz', 'internet', 'gas', 'condominio', 'escola'].some((word) =>
      cleanName.includes(word),
    )
  ) {
    return { category: 'essential', needsConfirmation: false }
  }

  if (
    ['cartao', 'parcela', 'parcelas', 'emprestimo', 'financiamento', 'boleto'].some((word) =>
      cleanName.includes(word),
    )
  ) {
    return { category: 'commitment', needsConfirmation: false }
  }

  if (
    ['streaming', 'delivery', 'ifood', 'uber', 'assinatura', 'shopping', 'mercado'].some((word) =>
      cleanName.includes(word),
    )
  ) {
    return { category: 'variable', needsConfirmation: false }
  }

  return { category: 'pending', needsConfirmation: true }
}

function deriveStatus(dueDate: string | null, category: AccountCategory | 'pending'): AccountStatus {
  if (!dueDate) {
    return category === 'commitment' ? 'attention' : 'ok'
  }

  const date = new Date(`${dueDate}T00:00:00`)
  const diffDays = Math.ceil((date.getTime() - Date.now()) / 86400000)

  if (diffDays < 0) {
    return 'risk'
  }

  if (diffDays <= 3 || category === 'commitment') {
    return 'attention'
  }

  return 'ok'
}

function buildStageSuggestions(villain: Villain, stage: 1 | 2 | 3 | 4): Array<Omit<CombinedItem, 'id' | 'active' | 'done'>> {
  const base: Record<1 | 2 | 3 | 4, Array<Omit<CombinedItem, 'id' | 'active' | 'done'>>> = {
    1: [
      {
        title: 'Sem delivery durante a semana',
        reason: 'Delivery soma taxa, impulso e frequencia. Cortar a repeticao reduz vazamento rapido.',
        impact: 'Menos saidas automáticas no mes.',
        stage: 1,
      },
      {
        title: 'Cancelar 1 assinatura esquecida',
        reason: 'Assinaturas pequenas vazam sem doer na hora, mas pesam no saldo final.',
        impact: 'Você recupera espaço sem esforço grande.',
        stage: 1,
      },
    ],
    2: [
      {
        title: 'Guardar R$10 hoje',
        reason: 'Micro-reserva repetida cria protecao e reduz ansiedade em semanas apertadas.',
        impact: 'Sua proteção começa mesmo com pouco.',
        stage: 2,
      },
      {
        title: 'Separar um valor pequeno antes de gastar',
        reason: 'Guardar primeiro simplifica a decisao e evita gastar a reserva por impulso.',
        impact: 'Você cria sequência, nao perfeicao.',
        stage: 2,
      },
    ],
    3: [
      {
        title: 'Pagar a conta mais urgente primeiro',
        reason: 'Quitação organizada tira ruído mental e devolve clareza para o restante.',
        impact: 'O peso mental começa a cair.',
        stage: 3,
      },
      {
        title: 'Revisar uma cobrança recorrente',
        reason: 'Uma revisão de cobrança pode evitar juros e repetição de erros.',
        impact: 'Você diminui o que aperta o mês.',
        stage: 3,
      },
    ],
    4: [
      {
        title: 'Planejar uma folga pequena',
        reason: 'Liberdade financeira começa quando você enxerga espaço para escolher com calma.',
        impact: 'Você volta a respirar antes de decidir.',
        stage: 4,
      },
      {
        title: 'Definir 1 meta leve do mês',
        reason: 'Metas pequenas mantêm continuidade sem criar pressão excessiva.',
        impact: 'O caminho fica sustentavel.',
        stage: 4,
      },
    ],
  }

  if (villain === 'uber') {
    base[1][0] = {
      title: 'Sem Uber nos dias comuns',
      reason: 'Mobilidade por app parece pequena no dia, mas vira um bloco grande no fim do mes.',
      impact: 'Você corta o vazamento mais rapido.',
      stage: 1,
    }
  }

  if (villain === 'ifood') {
    base[1][0] = {
      title: 'Sem delivery durante a semana',
      reason: 'Delivery soma taxa, impulso e frequencia. Quando junta, pesa mais do que parece.',
      impact: 'Você reduz saidas automáticas.',
      stage: 1,
    }
  }

  if (villain === 'shopping') {
    base[1][0] = {
      title: 'Pausa de 10 minutos antes de comprar',
      reason: 'Compras pequenas e nao planejadas passam despercebidas e drenam sua margem.',
      impact: 'Você interrompe o impulso antes do gasto.',
      stage: 1,
    }
  }

  if (villain === 'fun') {
    base[1][0] = {
      title: 'Um role consciente por semana',
      reason: 'Lazer recorrente sem combinado claro costuma estourar o ritmo do mes.',
      impact: 'Você mantém a vida acontecendo sem furar o limite.',
      stage: 1,
    }
  }

  if (villain === 'card') {
    base[3][0] = {
      title: 'Pagar primeiro a conta mais urgente',
      reason: 'Cartao e parcelas misturam presente e futuro; priorizar devolve ordem.',
      impact: 'Você alivia a pressao mais pesada.',
      stage: 3,
    }
  }

  return base[stage]
}

function getRiskTone(score: number): StatusTone {
  if (score < 35) return 'risco'
  if (score < 68) return 'atencao'
  return 'tranquilo'
}

function getJourneyScore(state: AppState): number {
  const accounts = state.accounts
  const essentialOk = accounts.filter((item) => item.category === 'essential' && item.status === 'ok').length
  const commitmentOk = accounts.filter((item) => item.category === 'commitment' && item.status !== 'risk').length
  const variableControlled = accounts.filter((item) => item.category === 'variable' && item.status !== 'risk').length
  const checkpoints = state.goalChecks.filter(Boolean).length
  const reserveProgress = state.reserveMarks.filter(Boolean).length
  const activeCombineds = state.combineds.filter((item) => item.active).length
  const completedCombineds = state.combineds.filter((item) => item.done).length

  const score =
    essentialOk * 7 +
    commitmentOk * 8 +
    variableControlled * 8 +
    checkpoints * 4 +
    reserveProgress * 5 +
    activeCombineds * 6 +
    completedCombineds * 12

  return Math.max(0, Math.min(100, score))
}

function getStageProgress(stage: 1 | 2 | 3 | 4, state: AppState): number {
  const accounts = state.accounts
  const checkpoints = state.goalChecks.filter(Boolean).length
  const reserves = state.reserveMarks.filter(Boolean).length
  const variableAccounts = accounts.filter((item) => item.category === 'variable')
  const commitments = accounts.filter((item) => item.category === 'commitment')
  const controlledVariable = variableAccounts.filter((item) => item.status !== 'risk').length
  const controlledCommitments = commitments.filter((item) => item.status !== 'risk').length

  if (stage === 1) {
    const leaksClosed = controlledVariable + state.combineds.filter((item) => item.stage === 1 && item.done).length
    return Math.min(100, leaksClosed * 25)
  }

  if (stage === 2) {
    return Math.round((reserves / 7) * 100)
  }

  if (stage === 3) {
    if (commitments.length === 0) {
      return 35
    }
    return Math.round((controlledCommitments / commitments.length) * 100)
  }

  const journeyScore = getJourneyScore(state)
  return Math.round(Math.max(journeyScore, checkpoints * 7))
}

function getStageMission(stage: 1 | 2 | 3 | 4, state: AppState): string {
  if (stage === 1) {
    return state.combineds.some((item) => item.stage === 1 && item.done)
      ? 'Você já cortou parte do vazamento. Continue simples.'
      : 'Ative 1 combinado pequeno para travar um vazamento.'
  }

  if (stage === 2) {
    return state.reserveMarks.some(Boolean)
      ? 'Sua proteção começou. Repetir aqui vale mais do que exagerar.'
      : 'Guarde uma quantia pequena hoje. O objetivo é criar ritmo.'
  }

  if (stage === 3) {
    return state.accounts.some((item) => item.category === 'commitment' && item.status !== 'risk')
      ? 'Uma pendência já ficou mais leve. Continue por partes.'
      : 'Escolha a conta mais urgente e tire um pouco de peso agora.'
  }

  return getJourneyScore(state) >= 70
    ? 'Agora faz sentido pensar no próximo passo.'
    : 'A liberdade começa quando o mês para de apertar tanto.'
}

function monthToneFromScore(score: number): StatusTone {
  return getRiskTone(score)
}

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [googleNameInput, setGoogleNameInput] = useState('')

  const selectedTone = voiceLabel(state.tone)
  const prefix = voicePrefix(state.tone, state.treatment)
  const currentQuestionIndex = Math.max(0, state.onboardingStep - 5)
  const currentQuestion = questions[currentQuestionIndex]
  const selectedVillain = state.villain ?? 'unsure'
  const diagnosticItems = useMemo(() => buildDiagnosticSummary(state.diagnosisAnswers), [state.diagnosisAnswers])
  const journeyScore = useMemo(() => getJourneyScore(state), [state])
  const monthTone = monthToneFromScore(journeyScore)
  const currentJourneyPhase = Math.min(4, Math.max(1, Math.ceil((journeyScore || 1) / 25))) as 1 | 2 | 3 | 4
  const suggestedCombineds = useMemo(() => buildStageSuggestions(selectedVillain, currentJourneyPhase), [selectedVillain, currentJourneyPhase])
  const activeCombineds = state.combineds.filter((item) => item.active)
  const latestHistory = [...state.history].slice(0, 3)
  const monthStatus = statusLabels[monthTone]
  const nextPrimaryCta =
    activeCombineds.length < 2 && suggestedCombineds.length > 0
      ? 'Ativar combinado do dia'
      : state.accounts.some((item) => item.needsConfirmation)
        ? 'Classificar 1 conta'
        : state.reserveMarks.some((value) => !value)
          ? 'Marcar micro-reserva'
          : 'Revisar sua jornada'

  const journeyStages: JourneyStage[] = [
    {
      id: 1,
      title: stageTitles[1],
      objective: stageObjectives[1],
      progress: getStageProgress(1, state),
      mission: getStageMission(1, state),
      statusLabel: getStageProgress(1, state) >= 75 ? 'Em avanço' : 'Começando',
    },
    {
      id: 2,
      title: stageTitles[2],
      objective: stageObjectives[2],
      progress: getStageProgress(2, state),
      mission: getStageMission(2, state),
      statusLabel: getStageProgress(2, state) >= 75 ? 'Em avanço' : 'Construindo',
    },
    {
      id: 3,
      title: stageTitles[3],
      objective: stageObjectives[3],
      progress: getStageProgress(3, state),
      mission: getStageMission(3, state),
      statusLabel: getStageProgress(3, state) >= 75 ? 'Em avanço' : 'Organizando',
    },
    {
      id: 4,
      title: stageTitles[4],
      objective: stageObjectives[4],
      progress: getStageProgress(4, state),
      mission: getStageMission(4, state),
      statusLabel: getStageProgress(4, state) >= 75 ? 'Em avanço' : 'Abrindo espaço',
    },
  ]

  function persist(next: AppState) {
    setState(next)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  }

  function addHistory(text: string, nextState?: AppState) {
    const targetState = nextState ?? state
    const snapshot: AppState = {
      ...targetState,
      history: [
        { id: newId('hist'), text, at: todayISO() },
        ...targetState.history,
      ].slice(0, 12),
    }
    persist(snapshot)
  }

  function nextOnboardingStep() {
    persist({ ...state, onboardingStep: state.onboardingStep + 1 })
  }

  function updateAnswer(value: number) {
    const nextAnswers = [...state.diagnosisAnswers]
    nextAnswers[currentQuestionIndex] = value
    const isLastQuestion = currentQuestionIndex === questions.length - 1
    persist({
      ...state,
      diagnosisAnswers: nextAnswers,
      onboardingStep: isLastQuestion ? 11 : state.onboardingStep + 1,
    })
  }

  function selectTone(value: Tone) {
    if (value === 'neutral') {
      persist({
        ...state,
        tone: value,
        treatment: '',
        onboardingStep: 4,
      })
      return
    }

    persist({ ...state, tone: value, onboardingStep: 3 })
  }

  function saveTreatmentAndContinue() {
    persist({ ...state, onboardingStep: 4 })
  }

  function startJourney(name: string) {
    persist({
      ...state,
      googleLinked: true,
      googleName: name,
      screen: 'journey',
      dashboardTab: 'home',
    })
  }

  function addAccount() {
    const name = state.accountDraftName.trim()
    const dueDate = state.accountDraftDate

    if (!name || !dueDate) {
      return
    }

    const classification = state.accountDraftCategory
      ? { category: state.accountDraftCategory, needsConfirmation: false }
      : classifyAccount(name)
    const category = classification.category === 'pending' ? 'variable' : classification.category
    const status = deriveStatus(dueDate, category)

    const nextAccount: AccountItem = {
      id: newId('acc'),
      name,
      dueDate,
      recurrence: state.accountDraftRecurrence,
      category: classification.category,
      status,
      needsConfirmation: classification.needsConfirmation,
    }

    const nextState: AppState = {
      ...state,
      accounts: [nextAccount, ...state.accounts],
      accountDraftName: '',
      accountDraftDate: '',
      accountDraftRecurrence: 'mensal',
      accountDraftCategory: '',
    }

    persist(nextState)
    addHistory(`Conta adicionada: ${name}`, nextState)
  }

  function confirmAccountCategory(accountId: string, category: AccountCategory) {
    const nextAccounts = state.accounts.map((account) => {
      if (account.id !== accountId) return account
      return {
        ...account,
        category,
        status: deriveStatus(account.dueDate, category),
        needsConfirmation: false,
      }
    })

    const nextState: AppState = {
      ...state,
      accounts: nextAccounts,
    }

    persist(nextState)
    addHistory(`Conta classificada como ${categoryLabels[category]}.`, nextState)
  }

  function acceptCombined(suggestion: Omit<CombinedItem, 'id' | 'active' | 'done'>) {
    if (state.combineds.filter((item) => item.active).length >= 2) {
      return
    }

    const nextCombined: CombinedItem = {
      id: newId('cmb'),
      ...suggestion,
      active: true,
      done: false,
    }

    const nextState: AppState = { ...state, combineds: [nextCombined, ...state.combineds] }
    persist(nextState)
    addHistory(`Combinado ativado: ${suggestion.title}`, nextState)
  }

  function toggleCombinedDone(combinedId: string) {
    const nextCombineds = state.combineds.map((item) =>
      item.id === combinedId ? { ...item, done: !item.done } : item,
    )
    const nextState: AppState = { ...state, combineds: nextCombineds }
    persist(nextState)
    const matched = nextCombineds.find((item) => item.id === combinedId)
    if (matched?.done) {
      addHistory('Hoje você evitou piorar. Isso conta.', nextState)
    }
  }

  function toggleReserve(index: number) {
    const nextReserve = [...state.reserveMarks]
    nextReserve[index] = !nextReserve[index]
    const nextState = { ...state, reserveMarks: nextReserve }
    persist(nextState)
    if (nextReserve[index]) {
      addHistory('Sua proteção começou.', nextState)
    }
  }

  function toggleGoalCheck(index: number) {
    const nextChecks = [...state.goalChecks]
    nextChecks[index] = !nextChecks[index]
    const nextState = { ...state, goalChecks: nextChecks }
    persist(nextState)
    if (nextChecks[index]) {
      addHistory('Você já cortou parte do vazamento.', nextState)
    }
  }

  function resetJourney() {
    localStorage.removeItem(STORAGE_KEY)
    setState(initialState)
  }

  function renderLanding() {
    return (
      <section className="panel landing">
        <div className="hero-layout">
          <div className="hero-copy">
            <p className="eyebrow">Assistente financeiro sem pressao</p>
            <h1>Fique DeBoa. Planeje sua vida financeira com calma.</h1>
            <p className="lead">
              Uma jornada que reduz vazamentos, cria protecao e devolve sensação de caminho.
            </p>
            <div className="hero-pills">
              <span>Sem planilha</span>
              <span>Sem julgamento</span>
              <span>Com progresso visível</span>
            </div>
            <button className="primary hero-cta" onClick={() => persist({ ...state, screen: 'onboarding' })}>
              Comecar agora
            </button>
          </div>
          <div className="hero-aside">
            <div className="deboa-logo" aria-hidden="true">
              <span className="logo-ring" />
              <span className="logo-core">D</span>
              <span className="logo-orbit" />
            </div>
            <div className="hero-card">
              <p className="card-label">Jornada para Ficar DeBoa</p>
              <p className="card-main">4 etapas simples para sair do aperto e ganhar estabilidade.</p>
            </div>
            <div className="hero-card muted">
              <p className="card-label">Tempo estimado</p>
              <p className="card-main">Cerca de 3 minutos para sair com um primeiro caminho.</p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  function renderOnboarding() {
    if (state.onboardingStep === 0) {
      return (
        <section className="panel flow-panel">
          <h2>Boas-vindas</h2>
          <div className="flow-grid">
            <div className="flow-card">
              <p>
                Este espaco e para respirar e organizar sua vida financeira sem culpa,
                sem planilha e sem julgamento.
              </p>
            </div>
            <div className="flow-card accent">
              <p className="card-label">Promessa do produto</p>
              <p className="card-main">Parar de piorar antes de tentar resolver tudo.</p>
            </div>
          </div>
          <button className="primary" onClick={nextOnboardingStep}>
            Continuar
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 1) {
      return (
        <section className="panel flow-panel">
          <h2>Antes da gente seguir</h2>
          <div className="flow-card">
            <p>
              O DeBoa nao e banco e nao faz milagre. A ideia aqui e te ajudar a evitar que a situacao piore.
            </p>
          </div>
          <label className="check-row consent-card">
            <input
              type="checkbox"
              checked={state.expectationAccepted}
              onChange={(event) => persist({ ...state, expectationAccepted: event.target.checked })}
            />
            <span>
              <strong>Pode seguir</strong>
              <small>Eu entendi que isso e um apoio, nao uma promessa magica.</small>
            </span>
          </label>
          <button className="primary" disabled={!state.expectationAccepted} onClick={nextOnboardingStep}>
            Continuar
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 2) {
      return (
        <section className="panel flow-panel">
          <h2>Como voce prefere que a gente converse por aqui?</h2>
          <p className="hint">Escolha um tom para deixar a conversa mais natural.</p>
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
      )
    }

    if (state.onboardingStep === 3) {
      return (
        <section className="panel flow-panel">
          <h2>Se quiser, posso te chamar de um jeito especifico.</h2>
          <input
            className="text-input"
            placeholder="Ex: brother, parceira, amigo"
            value={state.treatment}
            onChange={(event) => persist({ ...state, treatment: event.target.value })}
          />
          <p className="hint">Opcional. Se ficar vazio, seguimos normal.</p>
          <button className="primary" onClick={saveTreatmentAndContinue}>
            Continuar
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 4) {
      return (
        <section className="panel flow-panel">
          <h2>Diagnostico rapido</h2>
          <div className="flow-card">
            <p>
              Nao existem respostas certas ou erradas. Sao 6 perguntas objetivas para entendermos o ponto de partida.
            </p>
          </div>
          <button className="primary" onClick={nextOnboardingStep}>
            Comecar diagnostico
          </button>
        </section>
      )
    }

    if (state.onboardingStep >= 5 && state.onboardingStep <= 10 && currentQuestion) {
      return (
        <section className="panel flow-panel question-panel">
          <div className="question-topline">
            <p className="progress">Pergunta {currentQuestionIndex + 1} de {questions.length}</p>
            <div className="question-track" aria-hidden="true">
              <span style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
            </div>
          </div>
          <h2>{currentQuestion.prompt}</h2>
          <p className="hint">Toque em uma opcao para seguir sem enrolacao.</p>
          <div className="stacked-options">
            {currentQuestion.options.map((option) => (
              <button key={option.label} className="option" onClick={() => updateAnswer(option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        </section>
      )
    }

    if (state.onboardingStep === 11) {
      const topDiagnostics = diagnosticItems.slice(0, 3)

      return (
        <section className="panel flow-panel summary-panel">
          <h2>
            {selectedTone === 'close' ? `${prefix}isso e mais comum do que parece.` : 'Isso e mais comum do que parece.'}
          </h2>
          <div className="summary-grid">
            <div className="summary-card">
              <p className="card-label">Leitura estrutural</p>
              <p className="card-main">
                {topDiagnostics.length > 0
                  ? topDiagnostics.map((item) => item.label).join(', ')
                  : 'sinais leves de desorganizacao pontual'}
              </p>
            </div>
            <div className="summary-card muted">
              <p className="card-label">O que isso significa</p>
              <p className="card-main">
                Organizacao sozinha nao resolve tudo agora. Tem fatores que apertam de verdade e isso nao e culpa sua.
              </p>
            </div>
          </div>
          <p className="highlight">
            Direcao clara: foco agora e parar de piorar, com um combinado simples e sustentavel.
          </p>
          <button className="primary" onClick={nextOnboardingStep}>
            Escolher foco da semana
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 12) {
      return (
        <section className="panel flow-panel">
          <h2>O que mais aperta seu mes hoje?</h2>
          <p className="hint">Escolha o principal vilao agora. Depois a gente combina em cima disso.</p>
          <div className="stacked-options">
            {(Object.keys(villainLabels) as Villain[]).map((villain) => (
              <button
                key={villain}
                className={`option ${state.villain === villain ? 'active' : ''}`}
                onClick={() => persist({ ...state, villain })}
              >
                {villainLabels[villain]}
              </button>
            ))}
          </div>
          <button className="primary" disabled={!state.villain} onClick={nextOnboardingStep}>
            Continuar
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 13) {
      const villain = state.villain ?? 'unsure'
      const plan = buildStageSuggestions(villain, 1)

      return (
        <section className="panel flow-panel">
          <h2>Combinado da semana</h2>
          <div className="flow-card">
            <p>{plan[0].reason}</p>
          </div>
          <p className="highlight subtle">Nao e para cortar tudo. A ideia e reduzir o estrago sem sofrimento.</p>
          <div className="stacked-options">
            {plan.slice(0, 4).map((agreement) => (
              <button key={agreement.title} className="option" onClick={() => persist({ ...state, chosenAgreement: agreement.title })}>
                {agreement.title}
              </button>
            ))}
          </div>
          <button className="primary" disabled={!state.chosenAgreement} onClick={nextOnboardingStep}>
            Fechar combinado
          </button>
        </section>
      )
    }

    if (state.onboardingStep === 14) {
      return (
        <section className="panel flow-panel">
          <h2>Fechamos esse combinado por 7 dias.</h2>
          <div className="flow-card accent">
            <p className="lead">{state.chosenAgreement}</p>
          </div>
          <p>Posso te lembrar depois?</p>
          <div className="split-actions">
            <button
              className={`option ${state.reminderChoice === 'yes' ? 'active' : ''}`}
              onClick={() => persist({ ...state, reminderChoice: 'yes', onboardingStep: 15 })}
            >
              Sim
            </button>
            <button
              className={`option ${state.reminderChoice === 'later' ? 'active' : ''}`}
              onClick={() => persist({ ...state, reminderChoice: 'later', onboardingStep: 15 })}
            >
              Depois
            </button>
          </div>
        </section>
      )
    }

    if (state.onboardingStep === 15) {
      return (
        <section className="panel flow-panel">
          <h2>Agora vamos preparar sua jornada.</h2>
          <div className="flow-card">
            <p>
              Depois de fechar o combinado, conecte seu Google para liberar sua jornada guiada com progresso visível.
            </p>
          </div>
          <input
            className="text-input"
            placeholder="Nome da conta Google"
            value={googleNameInput}
            onChange={(event) => setGoogleNameInput(event.target.value)}
          />
          <p className="hint">No MVP, este campo simula o vinculo Google no front-end.</p>
          <button
            className="primary"
            disabled={!googleNameInput.trim()}
            onClick={() => startJourney(googleNameInput.trim())}
          >
            Vincular com Google e entrar na jornada
          </button>
        </section>
      )
    }

    return renderLanding()
  }

  function renderHomeTab() {
    const unresolvedLeaks = state.accounts.filter((item) => item.category === 'variable' && item.status !== 'ok')
    const currentStage = journeyStages.find((stage) => stage.id === currentJourneyPhase) ?? journeyStages[0]
    const nextStage =
      journeyStages.find((stage) => stage.id === ((currentJourneyPhase + 1) as 1 | 2 | 3 | 4)) ?? null
    const todayFocus =
      activeCombineds[0]?.title ??
      suggestedCombineds[0]?.title ??
      (state.accounts.some((item) => item.needsConfirmation)
        ? 'Classificar 1 conta com duvida'
        : 'Marcar 1 check-in rapido hoje')

    return (
      <div className="journey-tab">
        <header className="journey-hero">
          <div className="journey-hero-top">
            <div>
              <p className="eyebrow">Jornada para Ficar DeBoa</p>
              <h2>
                {selectedTone === 'close' ? `${prefix}voce esta no caminho.` : 'Voce esta no caminho.'}
              </h2>
            </div>
            <div className="score-pill">
              <span>{journeyScore}%</span>
              <small>progresso geral</small>
            </div>
          </div>
          <div className="journey-progress">
            <div style={{ width: `${journeyScore}%` }} />
          </div>
          <p>{monthStatus}</p>
        </header>

        <article className={`journey-card focus-card stage-${currentStage.id}`}>
          <div className="journey-card-head">
            <div>
              <p className="card-label">Você está aqui</p>
              <h3>Etapa {currentStage.id}: {currentStage.title}</h3>
            </div>
            <span className="stage-badge">{currentStage.statusLabel}</span>
          </div>
          <p className="card-sub">{currentStage.objective}</p>
          <div className="journey-track">
            <span style={{ width: `${currentStage.progress}%` }} />
          </div>
          <p className="card-main">{currentStage.mission}</p>
        </article>

        <div className="journey-grid compact">
          <article className="journey-card">
            <p className="card-label">Próximo passo de hoje</p>
            <p className="card-main">{todayFocus}</p>
            <p className="card-sub">Você não precisa resolver tudo hoje. Só manter o ritmo.</p>
            <button
              className="primary"
              onClick={() =>
                persist({
                  ...state,
                  dashboardTab: activeCombineds.length < 2 ? 'combinados' : 'contas',
                })
              }
            >
              {nextPrimaryCta}
            </button>
          </article>

          <article className="journey-card">
            <p className="card-label">Próximo destrave</p>
            {nextStage ? (
              <>
                <p className="card-main">Etapa {nextStage.id}: {nextStage.title}</p>
                <p className="card-sub">Quando essa etapa atual passar de 75%, a próxima fica natural.</p>
              </>
            ) : (
              <>
                <p className="card-main">Você chegou na etapa de liberdade.</p>
                <p className="card-sub">Agora é manter consistência e proteção no mês.</p>
              </>
            )}
          </article>
        </div>

        <div className="journey-grid compact">
          <article className="journey-card">
            <p className="card-label">Combinados agora</p>
            {activeCombineds.length > 0 ? (
              <div className="mini-stack">
                {activeCombineds.slice(0, 2).map((item) => (
                  <div key={item.id} className="mini-item">
                    <strong>{item.title}</strong>
                    <span>{item.impact}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-sub">Ative 1 combinado para começar a ver progresso visível.</p>
            )}
          </article>

          <article className="journey-card">
            <p className="card-label">Revisão de vazamentos</p>
            {unresolvedLeaks.length > 0 ? (
              <div className="mini-stack">
                {unresolvedLeaks.slice(0, 2).map((item) => (
                  <div key={item.id} className="mini-item warning">
                    <strong>{item.name}</strong>
                    <span>Tem chance de estar vazando mais do que deveria.</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="card-sub">Você já cortou parte do vazamento.</p>
            )}
          </article>
        </div>

        <article className="journey-card">
          <p className="card-label">Histórico de vitórias</p>
          {latestHistory.length > 0 ? (
            <div className="history-list">
              {latestHistory.map((item) => (
                <div key={item.id} className="history-item">
                  <span>{item.text}</span>
                  <small>{item.at}</small>
                </div>
              ))}
            </div>
          ) : (
            <p className="card-sub">Hoje você evitou piorar. Isso conta.</p>
          )}
        </article>
      </div>
    )
  }

  function renderAccountsTab() {
    const sortedAccounts = [...state.accounts].sort((a, b) => a.dueDate.localeCompare(b.dueDate))

    return (
      <div className="journey-tab">
        <header className="journey-hero soft">
          <p className="eyebrow">Contas do mês</p>
          <h2>Lista limpa, sem planilha e sem excesso de escolha.</h2>
          <p>Nome, data e status. O resto o app simplifica para voce.</p>
        </header>

        <article className="journey-card form-card">
          <div className="form-grid">
            <input
              className="text-input"
              placeholder="Conta, assinatura ou boleto"
              value={state.accountDraftName}
              onChange={(event) => persist({ ...state, accountDraftName: event.target.value })}
            />
            <input
              className="text-input"
              type="date"
              value={state.accountDraftDate}
              onChange={(event) => persist({ ...state, accountDraftDate: event.target.value })}
            />
            <select
              className="text-input"
              value={state.accountDraftRecurrence}
              onChange={(event) => persist({ ...state, accountDraftRecurrence: event.target.value as Recurrence })}
            >
              <option value="unica">Uma vez</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </div>
          <div className="quick-category-row">
            <button className={`chip ${state.accountDraftCategory === 'essential' ? 'active' : ''}`} onClick={() => persist({ ...state, accountDraftCategory: 'essential' })}>Essencial</button>
            <button className={`chip ${state.accountDraftCategory === 'commitment' ? 'active' : ''}`} onClick={() => persist({ ...state, accountDraftCategory: 'commitment' })}>Compromisso</button>
            <button className={`chip ${state.accountDraftCategory === 'variable' ? 'active' : ''}`} onClick={() => persist({ ...state, accountDraftCategory: 'variable' })}>Variavel</button>
          </div>
          <button className="primary" onClick={addAccount}>Adicionar conta</button>
        </article>

        <div className="journey-grid">
          {sortedAccounts.length > 0 ? sortedAccounts.map((account) => {
            const category = account.category === 'pending' ? 'variable' : account.category
            return (
              <article key={account.id} className={`journey-card account-card status-${account.status}`}>
                <div className="journey-card-head compact">
                  <div>
                    <p className="card-main">{account.name}</p>
                    <p className="card-sub">{account.dueDate} • {account.recurrence}</p>
                  </div>
                  <div className="badge-column">
                    <span className={`stage-badge color-${categoryColorClass[category]}`}>{account.category === 'pending' ? 'Precisando confirmar' : categoryLabels[category]}</span>
                    <span className={`stage-badge status-${account.status}`}>{account.status}</span>
                  </div>
                </div>

                {account.needsConfirmation && (
                  <div className="confirm-box">
                    <p>Isso parece ser o que?</p>
                    <div className="confirm-actions">
                      <button className="option" onClick={() => confirmAccountCategory(account.id, 'essential')}>Essencial</button>
                      <button className="option" onClick={() => confirmAccountCategory(account.id, 'commitment')}>Compromisso</button>
                      <button className="option" onClick={() => confirmAccountCategory(account.id, 'variable')}>Variavel</button>
                    </div>
                  </div>
                )}
              </article>
            )
          }) : (
            <article className="journey-card empty-card">
              <p className="card-main">Nenhuma conta adicionada ainda.</p>
              <p className="card-sub">Adicione sua primeira conta em poucos segundos para começar a organizar o mês.</p>
            </article>
          )}
        </div>
      </div>
    )
  }

  function renderCombinedsTab() {
    return (
      <div className="journey-tab">
        <header className="journey-hero soft">
          <p className="eyebrow">Combinados ativos</p>
          <h2>Máximo de 2 combinados por vez. Simples e acionável.</h2>
          <p>O combinado certo faz o mês andar sem sobrecarregar a cabeça.</p>
        </header>

        <div className="journey-grid">
          {activeCombineds.length > 0 ? activeCombineds.map((item) => (
            <article key={item.id} className="journey-card combined-card">
              <div className="journey-card-head compact">
                <div>
                  <p className="card-label">Etapa {item.stage}</p>
                  <p className="card-main">{item.title}</p>
                </div>
                <span className={`stage-badge ${item.done ? 'success' : 'neutral'}`}>{item.done ? 'Concluído' : 'Ativo'}</span>
              </div>
              <p className="card-sub">{item.reason}</p>
              <p className="impact-line">{item.impact}</p>
              <button className="primary" onClick={() => toggleCombinedDone(item.id)}>
                {item.done ? 'Desmarcar conclusão' : 'Marcar como concluído'}
              </button>
            </article>
          )) : (
            <article className="journey-card empty-card">
              <p className="card-main">Nenhum combinado ativo ainda.</p>
              <p className="card-sub">Ative até 2 combinados para gerar progresso visível.</p>
            </article>
          )}
        </div>

        <article className="journey-card">
          <p className="card-label">Sugestões prontas</p>
          <div className="suggestion-list">
            {suggestedCombineds.slice(0, 2).map((item) => (
              <div key={item.title} className="suggestion-card">
                <div>
                  <p className="card-main">{item.title}</p>
                  <p className="card-sub">{item.reason}</p>
                </div>
                <button
                  className="option"
                  onClick={() => acceptCombined(item)}
                  disabled={activeCombineds.length >= 2}
                >
                  {activeCombineds.length >= 2 ? 'Limite atingido' : 'Aceitar combinado'}
                </button>
              </div>
            ))}
          </div>
        </article>
      </div>
    )
  }

  function renderMonthTab() {
    return (
      <div className="journey-tab">
        <header className="journey-hero soft">
          <p className="eyebrow">Visão do mês</p>
          <h2>{monthStatus}</h2>
          <p>
            {monthTone === 'tranquilo'
              ? 'Você tem espaço para respirar e pensar no próximo passo.'
              : monthTone === 'atencao'
                ? 'Seu mês ainda pede atenção, mas já existe movimento de proteção.'
                : 'Se nada mudar, pode faltar dinheiro. O foco agora e travar danos.'}
          </p>
        </header>

        <div className="journey-grid compact">
          <article className="journey-card">
            <p className="card-label">Resumo prático</p>
            <p className="card-main">{journeyScore}% de progresso geral</p>
            <div className="journey-track">
              <span style={{ width: `${journeyScore}%` }} />
            </div>
          </article>
          <article className="journey-card">
            <p className="card-label">Status emocional</p>
            <p className="card-main">
              {monthTone === 'tranquilo' ? 'Mais estável' : monthTone === 'atencao' ? 'Atenção' : 'Risco'}
            </p>
            <p className="card-sub">Progressão contada por hábito, contas e combinados.</p>
          </article>
        </div>

        <div className="journey-grid compact">
          <article className="journey-card">
            <p className="card-label">Micro-reserva</p>
            <div className="reserve-grid">
              {state.reserveMarks.map((marked, index) => (
                <button key={index + 1} className={`reserve-dot ${marked ? 'active' : ''}`} onClick={() => toggleReserve(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <p className="card-sub">Sua proteção começou. Pequeno e frequente vale mais do que grande e raro.</p>
          </article>
          <article className="journey-card">
            <p className="card-label">Check-in leve</p>
            <div className="reserve-grid">
              {state.goalChecks.map((checked, index) => (
                <button key={index + 1} className={`reserve-dot ${checked ? 'active alt' : ''}`} onClick={() => toggleGoalCheck(index)}>
                  {index + 1}
                </button>
              ))}
            </div>
            <p className="card-sub">Hoje você evitou piorar. Isso conta.</p>
          </article>
        </div>

        <article className="journey-card">
          <p className="card-label">Próximo passo</p>
          <p className="card-main">{getStageMission(currentJourneyPhase, state)}</p>
          <button className="primary" onClick={() => persist({ ...state, dashboardTab: activeCombineds.length < 2 ? 'combinados' : 'contas' })}>
            {nextPrimaryCta}
          </button>
          <button className="option" onClick={resetJourney}>
            Recomeçar jornada
          </button>
        </article>
      </div>
    )
  }

  function renderJourneyShell() {
    return (
      <section className="panel journey-shell">
        <header className="site-bar journey-top">
          <div className="brand-strip">
            <div className="deboa-logo mini" aria-hidden="true">
              <span className="logo-ring" />
              <span className="logo-core">D</span>
              <span className="logo-orbit" />
            </div>
            <div>
              <p className="brand-text">DeBoa</p>
              <p className="site-subtitle">Jornada para Ficar DeBoa</p>
            </div>
          </div>
          <div className="site-bar-copy">
            <span>{monthStatus}</span>
            <span>{journeyScore}% progresso</span>
          </div>
        </header>

        <div className="tab-content-scene">
          {state.dashboardTab === 'home' && renderHomeTab()}
          {state.dashboardTab === 'contas' && renderAccountsTab()}
          {state.dashboardTab === 'combinados' && renderCombinedsTab()}
          {state.dashboardTab === 'mes' && renderMonthTab()}
        </div>

        <nav className="bottom-nav" aria-label="Navegacao principal do app">
          {[
            { id: 'home', label: 'Hoje', icon: '◜' },
            { id: 'contas', label: 'Contas', icon: '◫' },
            { id: 'combinados', label: 'Acordos', icon: '◌' },
            { id: 'mes', label: 'Mes', icon: '▦' },
          ].map((tab) => (
            <button
              key={tab.id}
              className={`nav-item ${state.dashboardTab === tab.id ? 'active' : ''}`}
              onClick={() => persist({ ...state, dashboardTab: tab.id as DashboardTab })}
            >
              <span aria-hidden="true" className="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </section>
    )
  }

  return (
    <div className="app-shell">
      <div className="ambient-bg" aria-hidden="true" />
      <main className="phone-frame">
        {state.screen === 'landing' && renderLanding()}
        {state.screen === 'onboarding' && renderOnboarding()}
        {state.screen === 'journey' && renderJourneyShell()}
      </main>
    </div>
  )
}

export default App
