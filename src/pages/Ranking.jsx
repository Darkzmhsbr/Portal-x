import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChannels } from '../hooks/useChannels'
import Header from '../components/Header'
import { toast } from 'react-hot-toast'
import { 
  Trophy,
  Users, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Medal,
  Crown,
  Star,
  Target,
  BarChart3,
  Award,
  Zap,
  Filter,
  Clock
} from 'lucide-react'
import './Ranking.css'

/**
 * Ranking.jsx - Sistema de Classificação Real! 🏆
 * 
 * Sistema REAL conectado ao backend que:
 * 1. Puxa dados reais do banco PostgreSQL
 * 2. Calcula rankings por períodos (semanal, mensal, etc.)
 * 3. Mostra classificação real de usuários e canais
 * 4. Sistema de níveis baseado em dados reais
 * 5. Filtros dinâmicos com dados do servidor
 * 
 * ZERO simulações - só dados verdadeiros! 💯
 */

const Ranking = () => {
  const { user } = useAuth()
  const { 
    getUserRanking, 
    getChannelRanking, 
    getRankingStats,
    isLoading 
  } = useChannels()
  
  // Estados principais
  const [activeTab, setActiveTab] = useState('users') // users, channels
  const [selectedPeriod, setSelectedPeriod] = useState('monthly') // weekly, monthly, quarterly, yearly, all
  const [loading, setLoading] = useState(true)
  
  // Dados dos rankings
  const [userRanking, setUserRanking] = useState([])
  const [channelRanking, setChannelRanking] = useState([])
  const [userPosition, setUserPosition] = useState(null)
  const [rankingStats, setRankingStats] = useState({})

  // Carrega dados reais ao montar e quando mudar período
  useEffect(() => {
    loadRankingData()
  }, [selectedPeriod])

  // Carrega dados REAIS dos rankings
  const loadRankingData = async () => {
    try {
      setLoading(true)
      
      // Chama APIs REAIS do backend
      const [usersData, channelsData, statsData] = await Promise.all([
        getUserRanking(selectedPeriod),
        getChannelRanking(selectedPeriod),
        getRankingStats(selectedPeriod)
      ])
      
      setUserRanking(usersData)
      setChannelRanking(channelsData)
      setRankingStats(statsData)
      
      // Encontra posição REAL do usuário atual
      const position = usersData.findIndex(u => u.id === user?.id) + 1
      setUserPosition(position > 0 ? position : null)
      
    } catch (error) {
      console.error('Erro ao carregar ranking:', error)
      toast.error('Erro ao carregar ranking')
    } finally {
      setLoading(false)
    }
  }

  // Calcula nível baseado no total de membros REAL
  const getUserLevel = (totalMembers) => {
    if (totalMembers < 3000) return { name: 'Iniciante', icon: '🔰', color: '#6B7280' }
    if (totalMembers < 7000) return { name: 'Mediano', icon: '🔶', color: '#F59E0B' }
    if (totalMembers < 20000) return { name: 'Veterano', icon: '🚀', color: '#EF4444' }
    if (totalMembers < 50000) return { name: 'Mestre', icon: '⚜️', color: '#8B5CF6' }
    return { name: 'Legendário', icon: '🔱', color: '#F59E0B' }
  }

  // Formata números para exibição
  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  // Obtém medalha por posição
  const getMedal = (position) => {
    switch(position) {
      case 1: return { icon: '🥇', color: '#FFD700', label: '1º Lugar' }
      case 2: return { icon: '🥈', color: '#C0C0C0', label: '2º Lugar' }
      case 3: return { icon: '🥉', color: '#CD7F32', label: '3º Lugar' }
      default: return { icon: `#${position}`, color: '#6B7280', label: `${position}º Lugar` }
    }
  }

  // Obtém cor do crescimento
  const getGrowthColor = (growth) => {
    if (growth > 0) return '#22C55E'
    if (growth < 0) return '#EF4444'
    return '#6B7280'
  }

  // Obtém label do período
  const getPeriodLabel = (period) => {
    switch(period) {
      case 'weekly': return 'Semanal'
      case 'monthly': return 'Mensal'
      case 'quarterly': return 'Trimestral'
      case 'yearly': return 'Anual'
      case 'all': return 'Todo Período'
      default: return 'Mensal'
    }
  }

  if (loading || isLoading) {
    return (
      <div className="ranking">
        <Header />
        <div className="ranking-loading">
          <div className="loading-trophy">
            <Trophy className="trophy-icon" />
          </div>
          <p>Carregando ranking...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="ranking">
      <Header />
      
      <div className="ranking-container">
        {/* Header do Ranking */}
        <div className="ranking-header">
          <div className="ranking-title">
            <Trophy className="ranking-icon" />
            <div>
              <h1>🏆 Ranking Portal X</h1>
              <p>Competição épica dos melhores canais e usuários</p>
            </div>
          </div>
          
          {userPosition && (
            <div className="user-position">
              <div className="position-card">
                <span className="position-medal">{getMedal(userPosition).icon}</span>
                <div>
                  <p className="position-label">Sua Posição</p>
                  <p className="position-number">#{userPosition}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Estatísticas do Ranking */}
        <div className="ranking-stats">
          <div className="stat-item">
            <Users className="stat-icon" />
            <div>
              <p className="stat-number">{rankingStats.totalUsers || 0}</p>
              <p className="stat-label">Competidores</p>
            </div>
          </div>
          
          <div className="stat-item">
            <BarChart3 className="stat-icon" />
            <div>
              <p className="stat-number">{rankingStats.totalChannels || 0}</p>
              <p className="stat-label">Canais</p>
            </div>
          </div>
          
          <div className="stat-item">
            <TrendingUp className="stat-icon" />
            <div>
              <p className="stat-number">{formatNumber(rankingStats.totalMembers || 0)}</p>
              <p className="stat-label">Membros</p>
            </div>
          </div>
          
          <div className="stat-item">
            <Clock className="stat-icon" />
            <div>
              <p className="stat-number">{getPeriodLabel(selectedPeriod)}</p>
              <p className="stat-label">Período</p>
            </div>
          </div>
        </div>

        {/* Filtro de Período */}
        <div className="period-filter">
          <div className="filter-label">
            <Calendar className="icon" />
            <span>Filtrar por Período:</span>
          </div>
          <div className="period-buttons">
            {[
              { key: 'weekly', label: 'Semanal' },
              { key: 'monthly', label: 'Mensal' },
              { key: 'quarterly', label: 'Trimestral' },
              { key: 'yearly', label: 'Anual' },
              { key: 'all', label: 'Todo Período' }
            ].map(period => (
              <button
                key={period.key}
                className={`period-btn ${selectedPeriod === period.key ? 'active' : ''}`}
                onClick={() => setSelectedPeriod(period.key)}
              >
                {period.label}
              </button>
            ))}
          </div>
        </div>

        {/* Navegação por Abas */}
        <div className="ranking-tabs">
          <button 
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users className="icon" />
            Ranking de Usuários
          </button>
          
          <button 
            className={`tab ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            <BarChart3 className="icon" />
            Ranking de Canais
          </button>
        </div>

        {/* Conteúdo do Ranking */}
        {activeTab === 'users' && (
          <div className="ranking-content">
            <div className="ranking-list">
              {userRanking.map((rankUser) => {
                const level = getUserLevel(rankUser.totalMembers)
                const medal = getMedal(rankUser.position)
                const isCurrentUser = rankUser.id === user?.id
                
                return (
                  <div 
                    key={rankUser.id} 
                    className={`ranking-item ${isCurrentUser ? 'current-user' : ''} ${rankUser.position <= 3 ? 'podium' : ''}`}
                  >
                    <div className="rank-position">
                      <span 
                        className="medal"
                        style={{ color: medal.color }}
                      >
                        {medal.icon}
                      </span>
                    </div>
                    
                    <div className="user-avatar">
                      {rankUser.avatar ? (
                        <img src={rankUser.avatar} alt={rankUser.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {rankUser.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isCurrentUser && (
                        <div className="current-user-badge">
                          <Star className="icon" />
                        </div>
                      )}
                    </div>
                    
                    <div className="user-info">
                      <h3 className="user-name">
                        {rankUser.name}
                        {isCurrentUser && <span className="you-badge">VOCÊ</span>}
                      </h3>
                      <div className="user-stats">
                        <span className="level" style={{ color: level.color }}>
                          {level.icon} {level.name}
                        </span>
                        <span className="channels">{rankUser.totalChannels} canais</span>
                      </div>
                    </div>
                    
                    <div className="ranking-metrics">
                      <div className="metric">
                        <Users className="metric-icon" />
                        <div>
                          <p className="metric-value">{formatNumber(rankUser.totalMembers)}</p>
                          <p className="metric-label">Membros</p>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <Target className="metric-icon" />
                        <div>
                          <p className="metric-value">{rankUser.referralPoints || 0}</p>
                          <p className="metric-label">Pontos</p>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <TrendingUp 
                          className="metric-icon"
                          style={{ color: getGrowthColor(rankUser.growth) }}
                        />
                        <div>
                          <p 
                            className="metric-value"
                            style={{ color: getGrowthColor(rankUser.growth) }}
                          >
                            {rankUser.growth > 0 ? '+' : ''}{rankUser.growth?.toFixed(1) || 0}%
                          </p>
                          <p className="metric-label">Crescimento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="ranking-content">
            <div className="ranking-list">
              {channelRanking.map((channel) => {
                const medal = getMedal(channel.position)
                
                return (
                  <div 
                    key={channel.id} 
                    className={`ranking-item ${channel.position <= 3 ? 'podium' : ''}`}
                  >
                    <div className="rank-position">
                      <span 
                        className="medal"
                        style={{ color: medal.color }}
                      >
                        {medal.icon}
                      </span>
                    </div>
                    
                    <div className="channel-image">
                      {channel.image ? (
                        <img src={channel.image} alt={channel.name} />
                      ) : (
                        <div className="image-placeholder">
                          {channel.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {channel.isVip && (
                        <div className="vip-badge">
                          <Crown className="icon" />
                        </div>
                      )}
                    </div>
                    
                    <div className="channel-info">
                      <h3 className="channel-name">{channel.name}</h3>
                      <div className="channel-details">
                        <span className="category">{channel.category}</span>
                        {channel.state && <span className="state">{channel.state}</span>}
                        <span className="owner">por {channel.owner}</span>
                      </div>
                    </div>
                    
                    <div className="ranking-metrics">
                      <div className="metric">
                        <Users className="metric-icon" />
                        <div>
                          <p className="metric-value">{formatNumber(channel.members)}</p>
                          <p className="metric-label">Membros</p>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <BarChart3 className="metric-icon" />
                        <div>
                          <p className="metric-value">{formatNumber(channel.clicks)}</p>
                          <p className="metric-label">Cliques</p>
                        </div>
                      </div>
                      
                      <div className="metric">
                        <TrendingUp 
                          className="metric-icon"
                          style={{ color: getGrowthColor(channel.growth) }}
                        />
                        <div>
                          <p 
                            className="metric-value"
                            style={{ color: getGrowthColor(channel.growth) }}
                          >
                            {channel.growth > 0 ? '+' : ''}{channel.growth?.toFixed(1) || 0}%
                          </p>
                          <p className="metric-label">Crescimento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Estado vazio */}
        {((activeTab === 'users' && userRanking.length === 0) || 
          (activeTab === 'channels' && channelRanking.length === 0)) && (
          <div className="empty-ranking">
            <Trophy className="empty-icon" />
            <h3>Nenhum dado encontrado</h3>
            <p>Ainda não há classificações para o período selecionado.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Ranking
