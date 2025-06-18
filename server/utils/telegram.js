import axios from 'axios'

// Validar link do Telegram
export function validateTelegramLink(link) {
  // Padrões aceitos:
  // https://t.me/username
  // https://t.me/+hashcode
  // https://telegram.me/username
  const patterns = [
    /^https?:\/\/t\.me\/[a-zA-Z0-9_]+$/,
    /^https?:\/\/t\.me\/\+[a-zA-Z0-9_-]+$/,
    /^https?:\/\/telegram\.me\/[a-zA-Z0-9_]+$/
  ]
  
  return patterns.some(pattern => pattern.test(link))
}

// Extrair username ou ID do link
export function extractTelegramId(link) {
  const match = link.match(/(?:t\.me|telegram\.me)\/(\+?[a-zA-Z0-9_-]+)/)
  return match ? match[1] : null
}

// Validar link de bot
export function validateBotLink(link) {
  // Bot links geralmente seguem o padrão: https://t.me/botname?start=parameter
  const pattern = /^https?:\/\/t\.me\/[a-zA-Z0-9_]+bot(\?start=.+)?$/
  return pattern.test(link)
}

// Gerar link da lista de canais
export function generateChannelListLink() {
  // Link fixo da pasta de canais conforme documentação
  return 'https://t.me/addlist/KKFj_fN7HyE2Y2Qx'
}

// Formatar número de membros
export function formatMemberCount(count) {
  const num = parseInt(count) || 0
  
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  
  return num.toString()
}

// Categorias disponíveis
export const CATEGORIES = [
  { id: 'universitarias', name: 'Universitárias', emoji: '🎓' },
  { id: 'amadoras', name: 'Amadoras', emoji: '📱' },
  { id: 'esposas', name: 'Esposas', emoji: '💍' },
  { id: 'cornos', name: 'Cornos', emoji: '🐂' },
  { id: 'famosas', name: 'Famosas', emoji: '⭐' },
  { id: 'vazadas', name: 'Vazadas', emoji: '📸' },
  { id: 'onlyfans', name: 'OnlyFans', emoji: '🔥' },
  { id: 'influencers', name: 'Influencers', emoji: '💎' },
  { id: 'modelos', name: 'Modelos', emoji: '👠' },
  { id: 'atrizes', name: 'Atrizes', emoji: '🎬' },
  { id: 'novinhas', name: 'Novinhas', emoji: '🌸' },
  { id: 'milfs', name: 'MILFs', emoji: '🍷' },
  { id: 'gostosas', name: 'Gostosas', emoji: '🔥' },
  { id: 'flagras', name: 'Flagras', emoji: '📹' },
  { id: 'premium', name: 'Premium', emoji: '👑' }
]

// Estados brasileiros
export const STATES = [
  { id: 'AC', name: 'Acre' },
  { id: 'AL', name: 'Alagoas' },
  { id: 'AP', name: 'Amapá' },
  { id: 'AM', name: 'Amazonas' },
  { id: 'BA', name: 'Bahia' },
  { id: 'CE', name: 'Ceará' },
  { id: 'DF', name: 'Distrito Federal' },
  { id: 'ES', name: 'Espírito Santo' },
  { id: 'GO', name: 'Goiás' },
  { id: 'MA', name: 'Maranhão' },
  { id: 'MT', name: 'Mato Grosso' },
  { id: 'MS', name: 'Mato Grosso do Sul' },
  { id: 'MG', name: 'Minas Gerais' },
  { id: 'PA', name: 'Pará' },
  { id: 'PB', name: 'Paraíba' },
  { id: 'PR', name: 'Paraná' },
  { id: 'PE', name: 'Pernambuco' },
  { id: 'PI', name: 'Piauí' },
  { id: 'RJ', name: 'Rio de Janeiro' },
  { id: 'RN', name: 'Rio Grande do Norte' },
  { id: 'RS', name: 'Rio Grande do Sul' },
  { id: 'RO', name: 'Rondônia' },
  { id: 'RR', name: 'Roraima' },
  { id: 'SC', name: 'Santa Catarina' },
  { id: 'SP', name: 'São Paulo' },
  { id: 'SE', name: 'Sergipe' },
  { id: 'TO', name: 'Tocantins' }
]

// Buscar categoria por ID
export function getCategoryById(id) {
  return CATEGORIES.find(cat => cat.id === id)
}

// Buscar estado por ID
export function getStateById(id) {
  return STATES.find(state => state.id === id)
}

// Gerar slug para URL
export function generateSlug(category, state = null) {
  let slug = category
  
  if (state) {
    slug += `-${state.toLowerCase()}`
  }
  
  return slug
}

// Parsear slug de URL
export function parseSlug(slug) {
  const parts = slug.split('-')
  const state = parts.length > 1 ? parts.pop().toUpperCase() : null
  const category = parts.join('-')
  
  return { category, state }
}

// Verificar se canal está ativo no Telegram (simulação)
export async function checkChannelActive(telegramId) {
  // Em produção, isso faria uma chamada real à API do Telegram
  // Por ora, retorna sempre true
  return true
}

// Obter informações do canal (simulação)
export async function getChannelInfo(telegramId) {
  // Em produção, isso buscaria informações reais do canal
  // Por ora, retorna dados mockados
  return {
    title: 'Canal Telegram',
    members: Math.floor(Math.random() * 10000) + 1000,
    description: 'Descrição do canal',
    photo_url: null
  }
}

// Mensagens provocativas para o sistema
export const PROVOCATIVE_MESSAGES = {
  age_verification: "Descobrimos os grupos mais insanos do Telegram em 2025. Mas só libera se você for +18...",
  loading: "Carregando os grupos secretos do seu perfil... 🔍",
  unlock_cta: "Quer acesso total? Desbloqueie mais 10 grupos agora mesmo",
  premium_locked: "Conteúdo exclusivo! Desbloqueie agora 🔥",
  new_channels: "Novos grupos quentíssimos acabaram de chegar!",
  popular_channels: "Os mais procurados da semana 🔥",
  level_up: "Parabéns! Você subiu de nível e desbloqueou novos recursos!"
}

// Gerar link de referência único
export function generateReferralLink(baseUrl, referralCode) {
  return `${baseUrl}?ref=${referralCode}`
}

// Validar código de referência
export function validateReferralCode(code) {
  // Código deve ter 8 caracteres alfanuméricos
  return /^[A-Z0-9]{8}$/.test(code)
}