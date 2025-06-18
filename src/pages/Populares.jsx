import React, { useState, useEffect } from 'react'
import { useChannels } from '../hooks/useChannels'
import Header from '../components/Header'
import ChannelCard from '../components/ChannelCard'
import LoadingScreen from '../components/LoadingScreen'
import { 
  Flame,
  TrendingUp,
  Eye,
  Users,
  Award,
  BarChart3,
  Clock
} from 'lucide-react'
import './Populares.css'

/**
 * Populares.jsx - Página de Canais Mais Populares! 🔥
 * 
 * Funcionalidades:
 * 1. Ranking por visualizações
 * 2. Ranking por membros
 * 3. Filtros por período
 * 4. Métricas de crescimento
 */

const Populares = () => {
  const { channels, isLoading } = useChannels()
  const [sortedChannels, setSortedChannels] = useState([])
  const [sortBy, setSortBy] = useState('views') // views, members, growth
  const [periodFilter, setPeriodFilter] = useState('all')
  
  useEffect(() => {
    sortChannels()
  }, [channels, sortBy, periodFilter])
  
  // Ordenar canais por critério
  const sortChannels = () => {
    if (!channels || channels.length === 0) {
      setSortedChannels([])
      return
    }
    
    // Filtrar apenas canais aprovados
    let filtered = channels.filter(channel => channel.status === 'approved')
    
    // Filtrar por período se necessário
    if (periodFilter !== 'all') {
      const now = new Date()
      let cutoffDate
      
      switch (periodFilter) {
        case 'today':
          cutoffDate = new Date(now.setHours(0, 0, 0, 0))
          break
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
      }
      
      if (cutoffDate) {
        filtered = filtered.filter(channel => {
          const channelDate = new Date(channel.createdAt)
          return channelDate >= cutoffDate
        })
      }
    }
    
    // Ordenar por critério selecionado
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return (b.viewCount || 0) - (a.viewCount || 0)
          
        case 'members':
          return (b.members || 0) - (a.members || 0)
          
        case 'growth':
          // Calcular taxa de crescimento (membros por dia)
          const aDays = Math.max(1, Math.floor((Date.now() - new Date(a.createdAt)) / (1000 * 60 * 60 * 24)))
          const bDays = Math.max(1, Math.floor((Date.now() - new Date(b.createdAt)) / (1000 * 60 * 60 * 24)))
          const aGrowth = (a.members || 0) / aDays
          const bGrowth = (b.members || 0) / bDays
          return bGrowth - aGrowth
          
        default:
          return 0
      }
    })
    
    setSortedChannels(sorted)
  }
  
  // Calcular posição no ranking
  const getRankIcon = (position) => {
    switch (position) {
      case 0:
        return '🥇'
      case 1:
        return '🥈'
      case 2:
        return '🥉'
      default:
        return `#${position + 1}`
    }
  }
  
  // Calcular métrica de popularidade
  const getPopularityScore = (channel) => {
    const views = channel.viewCount || 0
    const members = channel.members || 0
    const age = Math.max(1, Math.floor((Date.now() - new Date(channel.createdAt)) / (1000 * 60 * 60 * 24)))
    
    // Fórmula: (views * 0.3 + members * 0.5 + (members/age) * 0.2)
    const score = (views * 0.3) + (members * 0.5) + ((members / age) * 0.2)
    return Math.round(score)
  }
  
  if (isLoading) {
    return <LoadingScreen message="Carregando canais populares..." />
  }
  
  // Top 3 canais para destaque
  const topChannels = sortedChannels.slice(0, 3)
  const otherChannels = sortedChannels.slice(3)
  
  return (
    <div className="populares-page">
      <Header />
      
      <div className="populares-container">
        {/* Hero Section */}
        <div className="populares-hero">
          <div className="hero-content">
            <h1>
              <Flame size={32} />
              Canais Mais Populares
            </h1>
            <p>Os grupos e canais que estão bombando no Portal X!</p>
          </div>
          
          <div className="hero-badge">
            <TrendingUp size={48} />
            <span>Em Alta</span>
          </div>
        </div>
        
        {/* Controles de Ordenação */}
        <div className="sort-controls">
          <div className="sort-buttons">
            <h3>Ordenar por:</h3>
            <button 
              className={sortBy === 'views' ? 'active' : ''}
              onClick={() => setSortBy('views')}
            >
              <Eye size={16} />
              Mais Visualizados
            </button>
            <button 
              className={sortBy === 'members' ? 'active' : ''}
              onClick={() => setSortBy('members')}
            >
              <Users size={16} />
              Mais Membros
            </button>
            <button 
              className={sortBy === 'growth' ? 'active' : ''}
              onClick={() => setSortBy('growth')}
            >
              <TrendingUp size={16} />
              Crescimento Rápido
            </button>
          </div>
          
          <div className="period-filter">
            <select 
              value={periodFilter}
              onChange={(e) => setPeriodFilter(e.target.value)}
            >
              <option value="all">Todo Período</option>
              <option value="today">Hoje</option>
              <option value="week">Esta Semana</option>
              <option value="month">Este Mês</option>
            </select>
          </div>
        </div>
        
        {/* Top 3 Destaques */}
        {topChannels.length > 0 && (
          <div className="top-channels">
            <h2>
              <Award size={24} />
              Top 3 Canais
            </h2>
            
            <div className="podium">
              {topChannels.map((channel, index) => (
                <div 
                  key={channel.id} 
                  className={`podium-item position-${index + 1}`}
                  style={{ '--delay': `${index * 0.2}s` }}
                >
                  <div className="rank-badge">
                    {getRankIcon(index)}
                  </div>
                  
                  <div className="podium-channel">
                    <ChannelCard channel={channel} />
                    
                    <div className="channel-stats">
                      <div className="stat">
                        <Eye size={16} />
                        <span>{channel.viewCount?.toLocaleString() || 0}</span>
                      </div>
                      <div className="stat">
                        <Users size={16} />
                        <span>{channel.members?.toLocaleString() || 0}</span>
                      </div>
                      <div className="stat score">
                        <BarChart3 size={16} />
                        <span>{getPopularityScore(channel)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Outros Canais Populares */}
        {otherChannels.length > 0 && (
          <div className="other-channels">
            <h2>
              <TrendingUp size={24} />
              Outros Canais em Alta
            </h2>
            
            <div className="channels-list">
              {otherChannels.map((channel, index) => (
                <div key={channel.id} className="channel-item">
                  <span className="rank-number">{getRankIcon(index + 3)}</span>
                  
                  <div className="channel-content">
                    <ChannelCard channel={channel} />
                  </div>
                  
                  <div className="channel-metrics">
                    <div className="metric">
                      <Eye size={14} />
                      <span>{channel.viewCount?.toLocaleString() || 0} views</span>
                    </div>
                    <div className="metric">
                      <Users size={14} />
                      <span>{channel.members?.toLocaleString() || 0} membros</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Estado Vazio */}
        {sortedChannels.length === 0 && (
          <div className="empty-state">
            <Flame size={48} />
            <p>Nenhum canal encontrado para este período.</p>
            <p className="empty-subtitle">Tente ajustar os filtros ou volte mais tarde!</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Populares
