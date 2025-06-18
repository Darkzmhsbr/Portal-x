// Sistema de níveis baseado em quantidade de membros
export const LEVELS = {
  INICIANTE: {
    name: 'Iniciante',
    emoji: '🔰',
    min: 100,
    max: 3000,
    color: '#6B7280',
    icon: 'beginner'
  },
  MEDIANO: {
    name: 'Mediano',
    emoji: '🔶',
    min: 3001,
    max: 7000,
    color: '#F59E0B',
    icon: 'intermediate'
  },
  VETERANO: {
    name: 'Veterano',
    emoji: '🚀',
    min: 7001,
    max: 20000,
    color: '#8B5CF6',
    icon: 'veteran'
  },
  MESTRE: {
    name: 'Mestre',
    emoji: '⚜️',
    min: 20001,
    max: 50000,
    color: '#EF4444',
    icon: 'master'
  },
  LEGENDARIO: {
    name: 'Legendário',
    emoji: '🔱',
    min: 50001,
    max: Infinity,
    color: '#FFD700',
    icon: 'legendary'
  }
}

// Calcular nível baseado em membros
export function calculateLevel(memberCount) {
  const count = parseInt(memberCount) || 0
  
  for (const [key, level] of Object.entries(LEVELS)) {
    if (count >= level.min && count <= level.max) {
      return {
        ...level,
        key,
        progress: calculateProgress(count, level)
      }
    }
  }
  
  // Retornar iniciante por padrão
  return {
    ...LEVELS.INICIANTE,
    key: 'INICIANTE',
    progress: 0
  }
}

// Calcular progresso dentro do nível
function calculateProgress(current, level) {
  if (level.max === Infinity) {
    return 100
  }
  
  const range = level.max - level.min
  const progress = ((current - level.min) / range) * 100
  
  return Math.min(Math.max(progress, 0), 100)
}

// Obter próximo nível
export function getNextLevel(currentLevel) {
  const levels = Object.keys(LEVELS)
  const currentIndex = levels.indexOf(currentLevel)
  
  if (currentIndex === -1 || currentIndex === levels.length - 1) {
    return null
  }
  
  return LEVELS[levels[currentIndex + 1]]
}

// Calcular membros necessários para próximo nível
export function getMembersToNextLevel(memberCount) {
  const currentLevel = calculateLevel(memberCount)
  const nextLevel = getNextLevel(currentLevel.key)
  
  if (!nextLevel) {
    return 0
  }
  
  return nextLevel.min - memberCount
}

// Ranking de usuários por nível
export function rankUsersByLevel(users) {
  // Ordenar por total de membros (descendente)
  return users.sort((a, b) => {
    const totalA = parseInt(a.total_members) || 0
    const totalB = parseInt(b.total_members) || 0
    return totalB - totalA
  }).map((user, index) => ({
    ...user,
    rank: index + 1,
    level: calculateLevel(user.total_members)
  }))
}

// Estatísticas de níveis
export function getLevelStats(channels) {
  const stats = {
    total: channels.length,
    byLevel: {}
  }
  
  // Inicializar contadores
  Object.keys(LEVELS).forEach(key => {
    stats.byLevel[key] = {
      count: 0,
      percentage: 0,
      ...LEVELS[key]
    }
  })
  
  // Contar canais por nível
  channels.forEach(channel => {
    const level = calculateLevel(channel.members)
    if (stats.byLevel[level.key]) {
      stats.byLevel[level.key].count++
    }
  })
  
  // Calcular porcentagens
  Object.keys(stats.byLevel).forEach(key => {
    if (stats.total > 0) {
      stats.byLevel[key].percentage = 
        (stats.byLevel[key].count / stats.total) * 100
    }
  })
  
  return stats
}

// Validar se usuário pode criar canal premium baseado no nível
export function canCreatePremiumChannel(totalMembers) {
  const level = calculateLevel(totalMembers)
  // Apenas usuários Mestre ou Legendário podem criar canais premium
  return ['MESTRE', 'LEGENDARIO'].includes(level.key)
}