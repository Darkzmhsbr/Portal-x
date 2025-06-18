import React, { useState, useEffect } from 'react'
import { useChannels } from '../hooks/useChannels'
import Header from '../components/Header'
import ChannelCard from '../components/ChannelCard'
import LoadingScreen from '../components/LoadingScreen'
import { 
  Sparkles, 
  Calendar,
  TrendingUp,
  Clock,
  Bell
} from 'lucide-react'
import './Novidades.css'

/**
 * Novidades.jsx - Página de Canais Recentes! 🎆
 * 
 * Exibe:
 * 1. Canais adicionados recentemente
 * 2. Atualizações do sistema
 * 3. Filtros por período
 * 4. Notificações de novos conteúdos
 */

const Novidades = () => {
  const { channels, isLoading } = useChannels()
  const [filteredChannels, setFilteredChannels] = useState([])
  const [periodFilter, setPeriodFilter] = useState('week')
  const [showNotifications, setShowNotifications] = useState(true)
  
  // Notificações/avisos do sistema
  const [systemNotices] = useState([
    {
      id: 1,
      type: 'update',
      title: '🔥 Novo Sistema de Canais VIP!',
      description: 'Agora você pode adicionar canais premium com bot de pagamento integrado.',
      date: new Date().toLocaleDateString('pt-BR'),
      isNew: true
    },
    {
      id: 2,
      type: 'feature',
      title: '🎯 Sistema de Pontos por Indicação',
      description: 'Ganhe pontos compartilhando seu link personalizado!',
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      isNew: true
    },
    {
      id: 3,
      type: 'info',
      title: '📊 Ranking Atualizado',
      description: 'Confira os canais com mais membros da semana.',
      date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
      isNew: false
    }
  ])
  
  useEffect(() => {
    filterChannelsByPeriod()
  }, [channels, periodFilter])
  
  // Filtrar canais por período
  const filterChannelsByPeriod = () => {
    if (!channels || channels.length === 0) {
      setFilteredChannels([])
      return
    }
    
    const now = new Date()
    let filtered = [...channels]
    
    // Filtrar apenas canais aprovados
    filtered = filtered.filter(channel => channel.status === 'approved')
    
    // Filtrar por período
    switch (periodFilter) {
      case 'today':
        filtered = filtered.filter(channel => {
          const channelDate = new Date(channel.createdAt)
          return channelDate.toDateString() === now.toDateString()
        })
        break
        
      case 'week':
        filtered = filtered.filter(channel => {
          const channelDate = new Date(channel.createdAt)
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          return channelDate >= weekAgo
        })
        break
        
      case 'month':
        filtered = filtered.filter(channel => {
          const channelDate = new Date(channel.createdAt)
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          return channelDate >= monthAgo
        })
        break
        
      case 'all':
      default:
        // Sem filtro adicional
        break
    }
    
    // Ordenar por data de criação (mais recentes primeiro)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    
    setFilteredChannels(filtered)
  }
  
  // Calcular tempo desde a criação
  const getTimeAgo = (date) => {
    const now = new Date()
    const created = new Date(date)
    const diffInMs = now - created
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    const diffInDays = Math.floor(diffInHours / 24)
    
    if (diffInHours < 1) return 'Agora mesmo'
    if (diffInHours < 24) return `${diffInHours}h atrás`
    if (diffInDays === 1) return 'Ontem'
    if (diffInDays < 7) return `${diffInDays} dias atrás`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`
    return created.toLocaleDateString('pt-BR')
  }
  
  if (isLoading) {
    return <LoadingScreen message="Carregando novidades..." />
  }
  
  return (
    <div className="novidades-page">
      <Header />
      
      <div className="novidades-container">
        {/* Hero Section */}
        <div className="novidades-hero">
          <div className="hero-content">
            <h1>
              <Sparkles size={32} />
              Novidades do Portal X
            </h1>
            <p>Descubra os canais e grupos mais recentes adicionados à plataforma</p>
          </div>
          
          <div className="hero-stats">
            <div className="stat-item">
              <TrendingUp size={20} />
              <span className="stat-value">{filteredChannels.length}</span>
              <span className="stat-label">Novos canais</span>
            </div>
            <div className="stat-item">
              <Clock size={20} />
              <span className="stat-value">24h</span>
              <span className="stat-label">Atualizações</span>
            </div>
          </div>
        </div>
        
        {/* Notificações do Sistema */}
        {showNotifications && systemNotices.length > 0 && (
          <div className="system-notifications">
            <div className="notifications-header">
              <h3>
                <Bell size={20} />
                Avisos e Atualizações
              </h3>
              <button 
                className="close-notifications"
                onClick={() => setShowNotifications(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="notifications-list">
              {systemNotices.map(notice => (
                <div 
                  key={notice.id} 
                  className={`notification-item ${notice.type} ${notice.isNew ? 'new' : ''}`}
                >
                  {notice.isNew && <span className="new-badge">NOVO</span>}
                  <h4>{notice.title}</h4>
                  <p>{notice.description}</p>
                  <span className="notice-date">
                    <Calendar size={14} />
                    {notice.date}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Filtros de Período */}
        <div className="period-filters">
          <h3>Filtrar por período:</h3>
          <div className="filter-buttons">
            <button 
              className={periodFilter === 'today' ? 'active' : ''}
              onClick={() => setPeriodFilter('today')}
            >
              Hoje
            </button>
            <button 
              className={periodFilter === 'week' ? 'active' : ''}
              onClick={() => setPeriodFilter('week')}
            >
              Esta Semana
            </button>
            <button 
              className={periodFilter === 'month' ? 'active' : ''}
              onClick={() => setPeriodFilter('month')}
            >
              Este Mês
            </button>
            <button 
              className={periodFilter === 'all' ? 'active' : ''}
              onClick={() => setPeriodFilter('all')}
            >
              Todos
            </button>
          </div>
        </div>
        
        {/* Lista de Canais Novos */}
        <div className="novidades-content">
          <h2>
            <Clock size={24} />
            Canais Adicionados Recentemente
          </h2>
          
          {filteredChannels.length === 0 ? (
            <div className="empty-state">
              <Sparkles size={48} />
              <p>Nenhum canal novo neste período.</p>
              <p className="empty-subtitle">Volte em breve para conferir as novidades!</p>
            </div>
          ) : (
            <div className="channels-grid">
              {filteredChannels.map(channel => (
                <div key={channel.id} className="channel-wrapper">
                  <ChannelCard channel={channel} />
                  <span className="time-ago">
                    <Clock size={14} />
                    {getTimeAgo(channel.createdAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Novidades
