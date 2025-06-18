import React, { useState, useEffect } from 'react'
import { useChannels } from '../hooks/useChannels'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Header'
import LoadingScreen from '../components/LoadingScreen'
import { 
  Crown,
  Lock,
  Unlock,
  Star,
  Zap,
  Shield,
  Diamond,
  ExternalLink,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Premium.css'

/**
 * Premium.jsx - Página de Canais VIP! 👑
 * 
 * Funcionalidades:
 * 1. Exibição de canais VIP com cadeado
 * 2. Integração com bot de pagamento
 * 3. Benefícios exclusivos
 * 4. Sistema de desbloqueio
 */

const Premium = () => {
  const { channels, isLoading } = useChannels()
  const { user } = useAuth()
  const [vipChannels, setVipChannels] = useState([])
  const [selectedChannel, setSelectedChannel] = useState(null)
  const [showBenefits, setShowBenefits] = useState(true)
  
  // Benefícios VIP
  const vipBenefits = [
    {
      icon: <Shield size={24} />,
      title: 'Acesso Exclusivo',
      description: 'Conteúdo premium e grupos fechados'
    },
    {
      icon: <Zap size={24} />,
      title: 'Atualizações Diárias',
      description: 'Novos conteúdos todos os dias'
    },
    {
      icon: <Star size={24} />,
      title: 'Qualidade Premium',
      description: 'Apenas o melhor conteúdo selecionado'
    },
    {
      icon: <Diamond size={24} />,
      title: 'Suporte Prioritário',
      description: 'Atendimento VIP exclusivo'
    }
  ]
  
  useEffect(() => {
    // Filtrar apenas canais VIP aprovados
    if (channels && channels.length > 0) {
      const vip = channels.filter(channel => 
        channel.type === 'vip' && channel.status === 'approved'
      )
      setVipChannels(vip)
    }
  }, [channels])
  
  // Função para desbloquear canal
  const handleUnlockChannel = (channel) => {
    if (!user) {
      toast.error('Faça login para acessar conteúdo VIP')
      return
    }
    
    setSelectedChannel(channel)
    
    // Abrir bot de pagamento em nova aba
    if (channel.botLink) {
      window.open(channel.botLink, '_blank')
      
      toast.success(
        'Bot de pagamento aberto! Complete o pagamento para liberar o acesso.',
        { duration: 5000 }
      )
    } else {
      toast.error('Link de pagamento não disponível')
    }
  }
  
  // Função para ir direto ao canal (após pagamento)
  const handleAccessChannel = (channel) => {
    if (channel.link) {
      window.open(channel.link, '_blank')
    }
  }
  
  if (isLoading) {
    return <LoadingScreen message="Carregando conteúdo premium..." />
  }
  
  return (
    <div className="premium-page">
      <Header />
      
      <div className="premium-container">
        {/* Hero Section VIP */}
        <div className="premium-hero">
          <div className="hero-background">
            <div className="glow-effect"></div>
            <div className="glow-effect secondary"></div>
          </div>
          
          <div className="hero-content">
            <div className="vip-badge">
              <Crown size={48} />
            </div>
            
            <h1>Área VIP Premium</h1>
            <p>Acesso exclusivo aos melhores canais e grupos do Portal X</p>
            
            <div className="hero-stats">
              <div className="stat">
                <span className="stat-value">{vipChannels.length}</span>
                <span className="stat-label">Canais VIP</span>
              </div>
              <div className="stat">
                <span className="stat-value">24/7</span>
                <span className="stat-label">Suporte</span>
              </div>
              <div className="stat">
                <span className="stat-value">100%</span>
                <span className="stat-label">Exclusivo</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Benefícios VIP */}
        {showBenefits && (
          <div className="vip-benefits">
            <div className="benefits-header">
              <h2>
                <Star size={24} />
                Por que ser VIP?
              </h2>
              <button 
                className="close-benefits"
                onClick={() => setShowBenefits(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="benefits-grid">
              {vipBenefits.map((benefit, index) => (
                <div key={index} className="benefit-card">
                  <div className="benefit-icon">
                    {benefit.icon}
                  </div>
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Aviso Importante */}
        <div className="premium-notice">
          <AlertCircle size={20} />
          <p>
            <strong>Como funciona:</strong> Clique no canal desejado → 
            Complete o pagamento no bot → Receba o link de acesso exclusivo
          </p>
        </div>
        
        {/* Lista de Canais VIP */}
        <div className="vip-channels-section">
          <h2>
            <Crown size={24} />
            Canais Premium Disponíveis
          </h2>
          
          {vipChannels.length === 0 ? (
            <div className="empty-state">
              <Crown size={48} />
              <p>Nenhum canal VIP disponível no momento.</p>
              <p className="empty-subtitle">
                Em breve teremos conteúdo exclusivo para você!
              </p>
            </div>
          ) : (
            <div className="vip-channels-grid">
              {vipChannels.map(channel => (
                <div key={channel.id} className="vip-channel-card">
                  <div className="channel-image">
                    {channel.image ? (
                      <img src={channel.image} alt={channel.name} />
                    ) : (
                      <div className="image-placeholder">
                        <Crown size={40} />
                      </div>
                    )}
                    
                    {/* Overlay com cadeado */}
                    <div className="locked-overlay">
                      <Lock size={40} />
                    </div>
                    
                    {/* Badge VIP */}
                    <div className="vip-ribbon">
                      <Crown size={16} />
                      VIP
                    </div>
                  </div>
                  
                  <div className="channel-info">
                    <h3>{channel.name}</h3>
                    <p className="channel-category">{channel.category}</p>
                    
                    {channel.description && (
                      <p className="channel-description">
                        {channel.description}
                      </p>
                    )}
                    
                    <div className="channel-stats">
                      <div className="stat">
                        <Star size={16} />
                        <span>Conteúdo Exclusivo</span>
                      </div>
                      {channel.members && (
                        <div className="stat">
                          <Shield size={16} />
                          <span>{channel.members.toLocaleString()} membros</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="channel-actions">
                    <button 
                      className="unlock-button"
                      onClick={() => handleUnlockChannel(channel)}
                    >
                      <Unlock size={20} />
                      Desbloquear Agora
                    </button>
                    
                    {/* Botão secundário para quem já pagou */}
                    {selectedChannel?.id === channel.id && (
                      <button 
                        className="access-button"
                        onClick={() => handleAccessChannel(channel)}
                      >
                        <ExternalLink size={16} />
                        Já paguei, acessar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Call to Action */}
        {!user && (
          <div className="premium-cta">
            <h3>Pronto para acessar conteúdo exclusivo?</h3>
            <p>Faça login para desbloquear canais VIP</p>
            <a href="/login" className="cta-button">
              <Shield size={20} />
              Fazer Login
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default Premium
