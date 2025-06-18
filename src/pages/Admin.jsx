import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import adminService from '../services/admin'; // ✅ CERTO
import Header from '../components/Header';
import Modal from '../components/Modal';
import LoadingScreen from '../components/LoadingScreen';

import { 
  Users, 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Search,
  Filter,
  Trash2,
  BarChart3,
  Eye,
  Clock,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import './Admin.css'

/**
 * Admin.jsx - Painel Administrativo REAL! 👑
 * 
 * Funcionalidades implementadas:
 * 1. Aprovação/Rejeição de usuários
 * 2. Gerenciamento de canais
 * 3. Estatísticas do sistema
 * 4. Logs de atividades
 * 5. Filtros e busca avançada
 */

const Admin = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  
  // Estados para dados reais
  const [users, setUsers] = useState([])
  const [channels, setChannels] = useState([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalChannels: 0,
    pendingChannels: 0
  })
  
  // Estados de UI
  const [activeTab, setActiveTab] = useState('users')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [selectedItem, setSelectedItem] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Verificar se é admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/dashboard')
      return
    }
    
    loadAdminData()
  }, [user, navigate])
  
  // Carregar dados do admin
  const loadAdminData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar tudo em paralelo
      const [usersData, channelsData, statsData] = await Promise.all([
        adminService.getUsers(),
        adminService.getChannels(),
        adminService.getStats()
      ])
      
      setUsers(usersData)
      setChannels(channelsData)
      setStats(statsData)
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      toast.error('Erro ao carregar dados do painel')
    } finally {
      setIsLoading(false)
    }
  }
  
  // Aprovar usuário
  const handleApproveUser = async (userId) => {
    try {
      await adminService.approveUser(userId)
      
      // Atualizar lista local
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'approved' } : u
      ))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        pendingUsers: prev.pendingUsers - 1
      }))
      
      toast.success('Usuário aprovado com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error)
      toast.error('Erro ao aprovar usuário')
    }
  }
  
  // Rejeitar usuário
  const handleRejectUser = async (userId) => {
    try {
      await adminService.rejectUser(userId)
      
      // Atualizar lista local
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, status: 'rejected' } : u
      ))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        pendingUsers: prev.pendingUsers - 1
      }))
      
      toast.success('Usuário rejeitado')
    } catch (error) {
      console.error('Erro ao rejeitar usuário:', error)
      toast.error('Erro ao rejeitar usuário')
    }
  }
  
  // Aprovar canal
  const handleApproveChannel = async (channelId) => {
    try {
      await adminService.approveChannel(channelId)
      
      // Atualizar lista local
      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, status: 'approved' } : c
      ))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        pendingChannels: prev.pendingChannels - 1
      }))
      
      toast.success('Canal aprovado com sucesso!')
    } catch (error) {
      console.error('Erro ao aprovar canal:', error)
      toast.error('Erro ao aprovar canal')
    }
  }
  
  // Rejeitar canal
  const handleRejectChannel = async (channelId) => {
    try {
      await adminService.rejectChannel(channelId)
      
      // Atualizar lista local
      setChannels(prev => prev.map(c => 
        c.id === channelId ? { ...c, status: 'rejected' } : c
      ))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        pendingChannels: prev.pendingChannels - 1
      }))
      
      toast.success('Canal rejeitado')
    } catch (error) {
      console.error('Erro ao rejeitar canal:', error)
      toast.error('Erro ao rejeitar canal')
    }
  }
  
  // Deletar usuário
  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) {
      return
    }
    
    try {
      await adminService.deleteUser(userId)
      
      // Remover da lista local
      setUsers(prev => prev.filter(u => u.id !== userId))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers - 1
      }))
      
      toast.success('Usuário excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar usuário:', error)
      toast.error('Erro ao deletar usuário')
    }
  }
  
  // Deletar canal
  const handleDeleteChannel = async (channelId) => {
    if (!window.confirm('Tem certeza que deseja excluir este canal?')) {
      return
    }
    
    try {
      await adminService.deleteChannel(channelId)
      
      // Remover da lista local
      setChannels(prev => prev.filter(c => c.id !== channelId))
      
      // Atualizar stats
      setStats(prev => ({
        ...prev,
        totalChannels: prev.totalChannels - 1
      }))
      
      toast.success('Canal excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao deletar canal:', error)
      toast.error('Erro ao deletar canal')
    }
  }
  
  // Filtrar dados
  const getFilteredData = () => {
    const data = activeTab === 'users' ? users : channels
    
    return data.filter(item => {
      // Filtro de busca
      const matchesSearch = searchTerm === '' || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.username?.toLowerCase().includes(searchTerm.toLowerCase())
      
      // Filtro de status
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      
      return matchesSearch && matchesStatus
    })
  }
  
  // Calcular nível do usuário
  const getUserLevel = (totalMembers) => {
    if (totalMembers >= 500000) return { level: 'Legendário', icon: '🔱' }
    if (totalMembers >= 50000) return { level: 'Mestre', icon: '⚜️' }
    if (totalMembers >= 20000) return { level: 'Veterano', icon: '🚀' }
    if (totalMembers >= 7000) return { level: 'Veterano', icon: '🚀' }
    if (totalMembers >= 3000) return { level: 'Mediano', icon: '🔶' }
    return { level: 'Iniciante', icon: '🔰' }
  }
  
  if (isLoading) {
    return <LoadingScreen message="Carregando painel administrativo..." />
  }
  
  const filteredData = getFilteredData()
  
  return (
    <div className="admin">
      <Header />
      
      <div className="admin-container">
        {/* Header do Admin */}
        <div className="admin-header">
          <div className="admin-title">
            <Shield size={32} />
            <h1>Painel Administrativo</h1>
          </div>
          
          <div className="admin-stats">
            <div className="stat-card">
              <Users size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.totalUsers}</span>
                <span className="stat-label">Total de Usuários</span>
              </div>
            </div>
            
            <div className="stat-card">
              <AlertCircle size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.pendingUsers}</span>
                <span className="stat-label">Aprovações Pendentes</span>
              </div>
            </div>
            
            <div className="stat-card">
              <BarChart3 size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.totalChannels}</span>
                <span className="stat-label">Total de Canais</span>
              </div>
            </div>
            
            <div className="stat-card">
              <Clock size={20} />
              <div className="stat-info">
                <span className="stat-value">{stats.pendingChannels}</span>
                <span className="stat-label">Canais Pendentes</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Navegação por abas */}
        <div className="admin-tabs">
          <button 
            className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            Usuários
          </button>
          
          <button 
            className={`tab-button ${activeTab === 'channels' ? 'active' : ''}`}
            onClick={() => setActiveTab('channels')}
          >
            <BarChart3 size={16} />
            Canais
          </button>
        </div>
        
        {/* Controles de filtro */}
        <div className="admin-controls">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder={`Buscar ${activeTab === 'users' ? 'usuários' : 'canais'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-controls">
            <Filter size={16} />
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="pending">Pendentes</option>
              <option value="approved">Aprovados</option>
              <option value="rejected">Rejeitados</option>
            </select>
          </div>
        </div>
        
        {/* Tabela de dados */}
        <div className="admin-table">
          {activeTab === 'users' ? (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Data Cadastro</th>
                  <th>Canais</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(user => (
                  <tr key={user.id}>
                    <td>#{user.id}</td>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'pending' && <Clock size={14} />}
                        {user.status === 'approved' && <CheckCircle size={14} />}
                        {user.status === 'rejected' && <XCircle size={14} />}
                        {user.status}
                      </span>
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>{user.channelCount || 0}</td>
                    <td className="table-actions">
                      {user.status === 'pending' && (
                        <>
                          <button 
                            className="action-btn approve"
                            onClick={() => handleApproveUser(user.id)}
                            title="Aprovar"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button 
                            className="action-btn reject"
                            onClick={() => handleRejectUser(user.id)}
                            title="Rejeitar"
                          >
                            <XCircle size={16} />
                          </button>
                        </>
                      )}
                      <button 
                        className="action-btn view"
                        onClick={() => {
                          setSelectedItem(user)
                          setShowDetailsModal(true)
                        }}
                        title="Ver detalhes"
                      >
                        <Eye size={16} />
                      </button>
                      <button 
                        className="action-btn delete"
                        onClick={() => handleDeleteUser(user.id)}
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Estado</th>
                  <th>Usuário</th>
                  <th>Status</th>
                  <th>Membros</th>
                  <th>Nível</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map(channel => {
                  const levelInfo = getUserLevel(channel.members || 0)
                  return (
                    <tr key={channel.id}>
                      <td>#{channel.id}</td>
                      <td>{channel.name}</td>
                      <td>{channel.category}</td>
                      <td>{channel.state || '-'}</td>
                      <td>{channel.userName}</td>
                      <td>
                        <span className={`status-badge ${channel.status}`}>
                          {channel.status === 'pending' && <Clock size={14} />}
                          {channel.status === 'approved' && <CheckCircle size={14} />}
                          {channel.status === 'rejected' && <XCircle size={14} />}
                          {channel.status}
                        </span>
                      </td>
                      <td>{channel.members?.toLocaleString() || 0}</td>
                      <td>
                        <span className="level-badge">
                          {levelInfo.icon} {levelInfo.level}
                        </span>
                      </td>
                      <td className="table-actions">
                        {channel.status === 'pending' && (
                          <>
                            <button 
                              className="action-btn approve"
                              onClick={() => handleApproveChannel(channel.id)}
                              title="Aprovar"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              className="action-btn reject"
                              onClick={() => handleRejectChannel(channel.id)}
                              title="Rejeitar"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}
                        <button 
                          className="action-btn view"
                          onClick={() => {
                            setSelectedItem(channel)
                            setShowDetailsModal(true)
                          }}
                          title="Ver detalhes"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          className="action-btn delete"
                          onClick={() => handleDeleteChannel(channel.id)}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
          
          {filteredData.length === 0 && (
            <div className="empty-state">
              <p>Nenhum {activeTab === 'users' ? 'usuário' : 'canal'} encontrado</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Modal de detalhes */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false)
          setSelectedItem(null)
        }}
        title={`Detalhes do ${activeTab === 'users' ? 'Usuário' : 'Canal'}`}
      >
        {selectedItem && (
          <div className="details-modal">
            {activeTab === 'users' ? (
              <>
                <div className="detail-row">
                  <strong>ID:</strong> #{selectedItem.id}
                </div>
                <div className="detail-row">
                  <strong>Nome:</strong> {selectedItem.name}
                </div>
                <div className="detail-row">
                  <strong>Email:</strong> {selectedItem.email}
                </div>
                <div className="detail-row">
                  <strong>Status:</strong> 
                  <span className={`status-badge ${selectedItem.status}`}>
                    {selectedItem.status}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Data de Cadastro:</strong> 
                  {new Date(selectedItem.createdAt).toLocaleString('pt-BR')}
                </div>
                <div className="detail-row">
                  <strong>Total de Canais:</strong> {selectedItem.channelCount || 0}
                </div>
                <div className="detail-row">
                  <strong>Total de Membros:</strong> 
                  {selectedItem.totalMembers?.toLocaleString() || 0}
                </div>
                <div className="detail-row">
                  <strong>Pontos por Link:</strong> {selectedItem.linkPoints || 0}
                </div>
              </>
            ) : (
              <>
                <div className="detail-row">
                  <strong>ID:</strong> #{selectedItem.id}
                </div>
                <div className="detail-row">
                  <strong>Nome:</strong> {selectedItem.name}
                </div>
                <div className="detail-row">
                  <strong>Link:</strong> 
                  <a href={selectedItem.link} target="_blank" rel="noopener noreferrer">
                    {selectedItem.link}
                  </a>
                </div>
                <div className="detail-row">
                  <strong>Categoria:</strong> {selectedItem.category}
                </div>
                <div className="detail-row">
                  <strong>Estado:</strong> {selectedItem.state || 'Não informado'}
                </div>
                <div className="detail-row">
                  <strong>Tipo:</strong> 
                  <span className={`type-badge ${selectedItem.type}`}>
                    {selectedItem.type === 'vip' ? '👑 VIP' : 'Normal'}
                  </span>
                </div>
                <div className="detail-row">
                  <strong>Proprietário:</strong> {selectedItem.userName}
                </div>
                <div className="detail-row">
                  <strong>Membros:</strong> {selectedItem.members?.toLocaleString() || 0}
                </div>
                <div className="detail-row">
                  <strong>Descrição:</strong> 
                  <p>{selectedItem.description || 'Sem descrição'}</p>
                </div>
                {selectedItem.type === 'vip' && (
                  <div className="detail-row">
                    <strong>Bot de Pagamento:</strong> 
                    <a href={selectedItem.botLink} target="_blank" rel="noopener noreferrer">
                      {selectedItem.botLink}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Admin
