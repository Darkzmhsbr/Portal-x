import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useChannels } from '../hooks/useChannels'
import Header from '../components/Header'
import Modal from '../components/Modal'
import LoadingScreen from '../components/LoadingScreen'
import { 
  Plus, 
  BarChart3, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Star,
  Trash2,
  Edit,
  Link,
  Crown,
  Shield
} from 'lucide-react'
import './Dashboard.css'

/**
 * Dashboard.jsx - Painel de Controle do Usuário! 🎮
 * 
 * Aqui o usuário pode:
 * 1. Ver métricas dos seus canais
 * 2. Adicionar canais normais e VIP
 * 3. Gerenciar canais existentes
 * 4. Criar link personalizado para pontos
 * 5. Acompanhar estatísticas
 */

const Dashboard = () => {
  const { user } = useAuth()
  const { channels, addChannel, deleteChannel, updateChannel, isLoading } = useChannels()
  
  // Estados para modais e formulários
  const [showAddModal, setShowAddModal] = useState(false)
  const [showVipModal, setShowVipModal] = useState(false)
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [selectedChannel, setSelectedChannel] = useState(null)
  
  // Estados para formulários
  const [channelForm, setChannelForm] = useState({
    name: '',
    link: '',
    category: '',
    state: '',
    description: '',
    image: null
  })
  
  const [vipForm, setVipForm] = useState({
    name: '',
    link: '',
    category: '',
    description: '',
    image: null,
    botLink: ''
  })

  // Estados para métricas
  const [userStats, setUserStats] = useState({
    totalMembers: 0,
    level: 'Iniciante 🔰',
    entradas: 0,
    saidas: 0,
    pontosPorLink: 0
  })

  // Categorias disponíveis
  const categories = [
    'Universitárias', 'Amadoras', 'Famosas', 'Esposas', 
    'Cornos', 'Flagras', 'Vazadas', 'OnlyFans'
  ]

  // Estados do Brasil
  const states = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 
    'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 
    'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ]

  // Função para calcular métricas do usuário
  useEffect(() => {
    if (channels && channels.length > 0) {
      const userChannels = channels.filter(channel => channel.userId === user.id)
      const totalMembers = userChannels.reduce((sum, channel) => sum + (channel.members || 0), 0)
      
      // Calcular nível baseado no total de membros
      let level = 'Iniciante 🔰'
      if (totalMembers >= 500000) level = 'Legendário 🔱'
      else if (totalMembers >= 50000) level = 'Mestre ⚜️'
      else if (totalMembers >= 20000) level = 'Veterano 🚀'
      else if (totalMembers >= 7000) level = 'Veterano 🚀'
      else if (totalMembers >= 3000) level = 'Mediano 🔶'
      
      setUserStats({
        totalMembers,
        level,
        entradas: userChannels.reduce((sum, channel) => sum + (channel.entradas || 0), 0),
        saidas: userChannels.reduce((sum, channel) => sum + (channel.saidas || 0), 0),
        pontosPorLink: user.linkPoints || 0
      })
    }
  }, [channels, user])

  // Função para lidar com upload de imagem
  const handleImageUpload = (e, isVip = false) => {
    const file = e.target.files[0]
    if (file) {
      if (isVip) {
        setVipForm(prev => ({ ...prev, image: file }))
      } else {
        setChannelForm(prev => ({ ...prev, image: file }))
      }
    }
  }

  // Função para adicionar canal normal
  const handleAddChannel = async (e) => {
    e.preventDefault()
    try {
      await addChannel({ 
        ...channelForm, 
        userId: user.id,
        type: 'normal',
        status: 'pending'
      })
      setChannelForm({
        name: '',
        link: '',
        category: '',
        state: '',
        description: '',
        image: null
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Erro ao adicionar canal:', error)
    }
  }

  // Função para adicionar canal VIP
  const handleAddVipChannel = async (e) => {
    e.preventDefault()
    try {
      await addChannel({ 
        ...vipForm, 
        userId: user.id,
        type: 'vip',
        status: 'pending'
      })
      setVipForm({
        name: '',
        link: '',
        category: '',
        description: '',
        image: null,
        botLink: ''
      })
      setShowVipModal(false)
    } catch (error) {
      console.error('Erro ao adicionar canal VIP:', error)
    }
  }

  // Função para gerar link personalizado
  const generatePersonalLink = () => {
    const personalLink = `${window.location.origin}/?ref=${user.id}&utm_source=${user.username || user.id}`
    return personalLink
  }

  // Função para deletar canal
  const handleDeleteChannel = async (channelId) => {
    if (window.confirm('Tem certeza que deseja excluir este canal?')) {
      try {
        await deleteChannel(channelId)
      } catch (error) {
        console.error('Erro ao deletar canal:', error)
      }
    }
  }

  if (isLoading) {
    return <LoadingScreen message="Carregando dashboard..." />
  }

  const userChannels = channels?.filter(channel => channel.userId === user.id) || []

  return (
    <div className="dashboard">
      <Header />
      
      <div className="dashboard-container">
        {/* Header do Dashboard */}
        <div className="dashboard-header">
          <div className="user-info">
            <div className="user-avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="user-details">
              <h1>Meu Dashboard</h1>
              <p>Gerencie seus canais e grupos</p>
              <span className="user-level">{userStats.level}</span>
            </div>
          </div>
          
          <div className="dashboard-actions">
            <button 
              className="btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={20} />
              Cadastrar Canal/Grupo
            </button>
            
            <button 
              className="btn-vip"
              onClick={() => setShowVipModal(true)}
            >
              <Crown size={20} />
              Adicionar Canal VIP
            </button>
          </div>
        </div>

        {/* Métricas do Usuário */}
        <div className="user-metrics">
          <div className="metric-card">
            <div className="metric-icon">
              <Users size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{userStats.totalMembers.toLocaleString()}</span>
              <span className="metric-label">Total de Membros</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <TrendingUp size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{userStats.entradas}</span>
              <span className="metric-label">Entradas</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <TrendingDown size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{userStats.saidas}</span>
              <span className="metric-label">Saídas</span>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">
              <Link size={24} />
            </div>
            <div className="metric-info">
              <span className="metric-value">{userStats.pontosPorLink}</span>
              <span className="metric-label">Pontos por Link</span>
            </div>
          </div>
        </div>

        {/* Link Personalizado */}
        <div className="personal-link-section">
          <div className="section-header">
            <h3>
              <Link size={20} />
              Seu Link Personalizado
            </h3>
            <button 
              className="btn-secondary"
              onClick={() => setShowLinkModal(true)}
            >
              Ver Link
            </button>
          </div>
          <p>Compartilhe seu link e ganhe 1 ponto por visitante único!</p>
        </div>

        {/* Lista de Canais */}
        <div className="channels-section">
          <div className="section-header">
            <h3>
              <BarChart3 size={20} />
              Meus Canais e Grupos ({userChannels.length})
            </h3>
          </div>
          
          {userChannels.length === 0 ? (
            <div className="empty-state">
              <p>Você ainda não cadastrou nenhum canal ou grupo.</p>
              <button 
                className="btn-primary"
                onClick={() => setShowAddModal(true)}
              >
                Cadastrar Primeiro Canal
              </button>
            </div>
          ) : (
            <div className="channels-grid">
              {userChannels.map(channel => (
                <div key={channel.id} className="channel-card">
                  <div className="channel-image">
                    {channel.image ? (
                      <img src={channel.image} alt={channel.name} />
                    ) : (
                      <div className="image-placeholder">
                        {channel.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {channel.type === 'vip' && (
                      <div className="vip-badge">
                        <Crown size={16} />
                        VIP
                      </div>
                    )}
                  </div>
                  
                  <div className="channel-info">
                    <h4>{channel.name}</h4>
                    <p className="channel-category">{channel.category}</p>
                    <p className="channel-members">
                      {channel.members?.toLocaleString() || 0} membros
                    </p>
                    
                    <div className="channel-status">
                      <span className={`status-badge ${channel.status}`}>
                        {channel.status === 'approved' ? (
                          <>
                            <Shield size={14} />
                            Aprovado
                          </>
                        ) : (
                          <>
                            ⏳ Pendente
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  
                  <div className="channel-actions">
                    <button 
                      className="action-btn"
                      onClick={() => setSelectedChannel(channel)}
                      title="Ver métricas"
                    >
                      <BarChart3 size={16} />
                    </button>
                    
                    <button 
                      className="action-btn"
                      onClick={() => handleDeleteChannel(channel.id)}
                      title="Excluir canal"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal para Adicionar Canal Normal */}
      <Modal 
        isOpen={showAddModal} 
        onClose={() => setShowAddModal(false)}
        title="Cadastrar Canal/Grupo"
      >
        <form onSubmit={handleAddChannel} className="channel-form">
          <div className="form-group">
            <label>Nome do Canal/Grupo *</label>
            <input
              type="text"
              value={channelForm.name}
              onChange={(e) => setChannelForm(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ex: Universitárias Brasil"
            />
          </div>
          
          <div className="form-group">
            <label>Link do Telegram *</label>
            <input
              type="url"
              value={channelForm.link}
              onChange={(e) => setChannelForm(prev => ({ ...prev, link: e.target.value }))}
              required
              placeholder="https://t.me/..."
            />
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Categoria *</label>
              <select
                value={channelForm.category}
                onChange={(e) => setChannelForm(prev => ({ ...prev, category: e.target.value }))}
                required
              >
                <option value="">Selecione...</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Estado (Opcional)</label>
              <select
                value={channelForm.state}
                onChange={(e) => setChannelForm(prev => ({ ...prev, state: e.target.value }))}
              >
                <option value="">Selecione...</option>
                {states.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={channelForm.description}
              onChange={(e) => setChannelForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o canal ou grupo..."
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>Imagem (Opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, false)}
            />
            <small>Se não enviada, usaremos a imagem do Telegram automaticamente</small>
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowAddModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary">
              Cadastrar
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Adicionar Canal VIP */}
      <Modal 
        isOpen={showVipModal} 
        onClose={() => setShowVipModal(false)}
        title="Adicionar Canal/Grupo VIP"
      >
        <form onSubmit={handleAddVipChannel} className="channel-form">
          <div className="vip-notice">
            <Crown size={20} />
            <p>Canais VIP serão exibidos na seção Premium com acesso via pagamento</p>
          </div>
          
          <div className="form-group">
            <label>Nome do Canal/Grupo VIP *</label>
            <input
              type="text"
              value={vipForm.name}
              onChange={(e) => setVipForm(prev => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Ex: VIP Exclusivo Premium"
            />
          </div>
          
          <div className="form-group">
            <label>Link do Canal VIP *</label>
            <input
              type="url"
              value={vipForm.link}
              onChange={(e) => setVipForm(prev => ({ ...prev, link: e.target.value }))}
              required
              placeholder="https://t.me/..."
            />
          </div>
          
          <div className="form-group">
            <label>Link do Bot de Pagamento *</label>
            <input
              type="url"
              value={vipForm.botLink}
              onChange={(e) => setVipForm(prev => ({ ...prev, botLink: e.target.value }))}
              required
              placeholder="https://t.me/pagamento_bot"
            />
            <small>Bot que processará os pagamentos para liberar acesso</small>
          </div>
          
          <div className="form-group">
            <label>Categoria *</label>
            <select
              value={vipForm.category}
              onChange={(e) => setVipForm(prev => ({ ...prev, category: e.target.value }))}
              required
            >
              <option value="">Selecione...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label>Descrição</label>
            <textarea
              value={vipForm.description}
              onChange={(e) => setVipForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva o conteúdo VIP..."
              rows={3}
            />
          </div>
          
          <div className="form-group">
            <label>Imagem (Opcional)</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, true)}
            />
          </div>
          
          <div className="form-actions">
            <button type="button" onClick={() => setShowVipModal(false)}>
              Cancelar
            </button>
            <button type="submit" className="btn-vip">
              <Crown size={16} />
              Adicionar VIP
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal para Link Personalizado */}
      <Modal 
        isOpen={showLinkModal} 
        onClose={() => setShowLinkModal(false)}
        title="Seu Link Personalizado"
      >
        <div className="link-modal">
          <p>Compartilhe este link nas suas redes sociais para ganhar pontos:</p>
          
          <div className="link-display">
            <input 
              type="text" 
              value={generatePersonalLink()} 
              readOnly 
              className="link-input"
            />
            <button 
              onClick={() => navigator.clipboard.writeText(generatePersonalLink())}
              className="copy-btn"
            >
              Copiar
            </button>
          </div>
          
          <div className="link-info">
            <h4>Como funciona:</h4>
            <ul>
              <li>Cada visitante único = 1 ponto</li>
              <li>Múltiplas visitas da mesma pessoa = 1 ponto apenas</li>
              <li>Pontos aparecem no ranking</li>
              <li>Acompanhe seu progresso aqui no dashboard</li>
            </ul>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Dashboard
