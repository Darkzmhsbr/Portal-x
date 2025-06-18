import React, { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useChannels } from '../hooks/useChannels'
import { useAuth } from '../hooks/useAuth'
import Header from '../components/Header'
import ChannelCard from '../components/ChannelCard'
import FilterSidebar from '../components/FilterSidebar'
import LoadingScreen from '../components/LoadingScreen'
import { toast } from 'react-hot-toast'
import { 
  MapPin,
  Grid,
  List,
  Search,
  Filter,
  Tag,
  TrendingUp,
  Users,
  ChevronRight,
  Home,
  Navigation
} from 'lucide-react'
import './State.css'

/**
 * State.jsx - Página Dinâmica por Estado! 🗺️
 * 
 * Página SEO otimizada focada em localização que:
 * 1. Mostra canais filtrados por estado específico
 * 2. URL otimizada: /state/SP, /state/RJ, /state/MG
 * 3. SEO local otimizado para cada estado
 * 4. Filtros por categoria dentro do estado
 * 5. Meta tags dinâmicas com foco geográfico
 * 6. Breadcrumb navigation localizada
 * 
 * Conectado ao backend REAL - dados verdadeiros! 💯
 */

const State = () => {
  const { stateCode } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { 
    getChannelsByState, 
    getStates,
    isLoading 
  } = useChannels()

  // Estados principais
  const [channels, setChannels] = useState([])
  const [stateInfo, setStateInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // grid, list
  
  // Filtros da URL
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    sortBy: searchParams.get('sort') || 'members', // members, recent, clicks, name
    order: searchParams.get('order') || 'desc', // asc, desc
    type: searchParams.get('type') || 'all', // all, vip, normal
    search: searchParams.get('search') || ''
  })

  // Carrega dados quando estado ou filtros mudarem
  useEffect(() => {
    loadStateData()
  }, [stateCode, filters])

  // Atualiza URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    setSearchParams(params)
  }, [filters, setSearchParams])

  // SEO dinâmico com foco local
  useEffect(() => {
    if (stateInfo) {
      document.title = `Canais do ${stateInfo.name} - Portal X Brasil`
      
      // Meta description com SEO local
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', 
          `Descubra os melhores canais do ${stateInfo.name} no Telegram. ` +
          `${channels.length} canais ativos com conteúdo exclusivo do ${stateInfo.name}.`
        )
      }

      // Meta keywords local
      const metaKeywords = document.querySelector('meta[name="keywords"]')
      if (metaKeywords) {
        metaKeywords.setAttribute('content', 
          `canais telegram ${stateInfo.name}, grupos ${stateInfo.name}, ` +
          `telegram ${stateCode}, canais ${stateCode}`
        )
      }
    }
  }, [stateInfo, channels.length, stateCode])

  // Carrega dados REAIS do estado
  const loadStateData = async () => {
    try {
      setLoading(true)
      
      // Busca canais do estado com filtros aplicados
      const channelsData = await getChannelsByState(stateCode, filters)
      setChannels(channelsData)
      
      // Busca informações do estado
      const states = await getStates()
      const state = states.find(st => st.code === stateCode.toUpperCase())
      setStateInfo(state)
      
    } catch (error) {
      console.error('Erro ao carregar estado:', error)
      toast.error('Erro ao carregar canais do estado')
    } finally {
      setLoading(false)
    }
  }

  // Atualiza filtro específico
  const updateFilter = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Limpa todos os filtros
  const clearFilters = () => {
    setFilters({
      category: '',
      sortBy: 'members',
      order: 'desc',
      type: 'all',
      search: ''
    })
  }

  // Obtém informações do estado brasileiro
  const getStateInfo = (code) => {
    const statesInfo = {
      'SP': { name: 'São Paulo', capital: 'São Paulo', region: 'Sudeste', emoji: '🏙️' },
      'RJ': { name: 'Rio de Janeiro', capital: 'Rio de Janeiro', region: 'Sudeste', emoji: '🏖️' },
      'MG': { name: 'Minas Gerais', capital: 'Belo Horizonte', region: 'Sudeste', emoji: '⛰️' },
      'SC': { name: 'Santa Catarina', capital: 'Florianópolis', region: 'Sul', emoji: '🏝️' },
      'PR': { name: 'Paraná', capital: 'Curitiba', region: 'Sul', emoji: '🌲' },
      'RS': { name: 'Rio Grande do Sul', capital: 'Porto Alegre', region: 'Sul', emoji: '🐎' },
      'BA': { name: 'Bahia', capital: 'Salvador', region: 'Nordeste', emoji: '🏖️' },
      'PE': { name: 'Pernambuco', capital: 'Recife', region: 'Nordeste', emoji: '🦀' },
      'CE': { name: 'Ceará', capital: 'Fortaleza', region: 'Nordeste', emoji: '🏄' },
      'GO': { name: 'Goiás', capital: 'Goiânia', region: 'Centro-Oeste', emoji: '🌾' },
      'DF': { name: 'Distrito Federal', capital: 'Brasília', region: 'Centro-Oeste', emoji: '🏛️' },
      'ES': { name: 'Espírito Santo', capital: 'Vitória', region: 'Sudeste', emoji: '🐚' }
    }
    return statesInfo[code?.toUpperCase()] || { 
      name: code, 
      capital: '', 
      region: '', 
      emoji: '📍' 
    }
  }

  if (loading || isLoading) {
    return <LoadingScreen message={`Carregando canais do ${stateCode}...`} />
  }

  if (!stateInfo && !loading) {
    return (
      <div className="state">
        <Header />
        <div className="state-container">
          <div className="state-error">
            <h1>Estado não encontrado</h1>
            <p>O estado "{stateCode}" não existe ou não há canais cadastrados.</p>
          </div>
        </div>
      </div>
    )
  }

  const currentStateInfo = getStateInfo(stateCode)

  return (
    <div className="state">
      <Header />
      
      <div className="state-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="/" className="breadcrumb-item">
            <Home className="icon" />
            Início
          </a>
          <ChevronRight className="breadcrumb-separator" />
          <span className="breadcrumb-item current">
            <MapPin className="icon" />
            {currentStateInfo.name}
          </span>
        </nav>

        {/* Header do Estado */}
        <div className="state-header">
          <div className="state-title">
            <div className="state-icon">
              {currentStateInfo.emoji}
            </div>
            <div>
              <h1>{currentStateInfo.name}</h1>
              <p className="state-description">
                Explore os melhores canais e grupos do {currentStateInfo.name} no Telegram
              </p>
              <div className="state-details">
                <span className="detail">
                  <Navigation className="icon" />
                  {currentStateInfo.region}
                </span>
                {currentStateInfo.capital && (
                  <span className="detail">
                    🏛️ Capital: {currentStateInfo.capital}
                  </span>
                )}
                <span className="detail">
                  📺 {stateCode.toUpperCase()}
                </span>
              </div>
              <div className="state-stats">
                <span className="stat">
                  <Users className="icon" />
                  {channels.length} canais
                </span>
                <span className="stat">
                  <TrendingUp className="icon" />
                  {channels.reduce((sum, ch) => sum + (ch.members || 0), 0).toLocaleString()} membros
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="state-content">
          {/* Sidebar de Filtros */}
          <FilterSidebar
            filters={filters}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
            showCategoryFilter={true}
            showTypeFilter={true}
            showSortFilter={true}
            showStateFilter={false} // Não mostra filtro de estado pois já estamos em um estado específico
          />

          {/* Conteúdo Principal */}
          <div className="main-content">
            {/* Barra de Ferramentas */}
            <div className="content-toolbar">
              <div className="toolbar-left">
                <div className="search-bar">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder={`Buscar canais do ${currentStateInfo.name}...`}
                    value={filters.search}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>
              </div>
              
              <div className="toolbar-right">
                <div className="view-toggle">
                  <button
                    className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => setViewMode('grid')}
                    title="Visualização em Grade"
                  >
                    <Grid className="icon" />
                  </button>
                  <button
                    className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => setViewMode('list')}
                    title="Visualização em Lista"
                  >
                    <List className="icon" />
                  </button>
                </div>
                
                <div className="results-count">
                  {channels.length} {channels.length === 1 ? 'canal' : 'canais'}
                </div>
              </div>
            </div>

            {/* Filtros Ativos */}
            {(filters.category || filters.type !== 'all' || filters.search) && (
              <div className="active-filters">
                <span className="filters-label">Filtros ativos:</span>
                <div className="filter-tags">
                  {filters.category && (
                    <span className="filter-tag">
                      <Tag className="icon" />
                      {filters.category}
                      <button onClick={() => updateFilter('category', '')}>×</button>
                    </span>
                  )}
                  {filters.type !== 'all' && (
                    <span className="filter-tag">
                      <Tag className="icon" />
                      {filters.type === 'vip' ? 'VIP' : 'Normal'}
                      <button onClick={() => updateFilter('type', 'all')}>×</button>
                    </span>
                  )}
                  {filters.search && (
                    <span className="filter-tag">
                      <Search className="icon" />
                      "{filters.search}"
                      <button onClick={() => updateFilter('search', '')}>×</button>
                    </span>
                  )}
                  <button className="clear-all" onClick={clearFilters}>
                    Limpar tudo
                  </button>
                </div>
              </div>
            )}

            {/* Grid/Lista de Canais */}
            {channels.length > 0 ? (
              <div className={`channels-grid ${viewMode}`}>
                {channels.map(channel => (
                  <ChannelCard
                    key={channel.id}
                    channel={channel}
                    viewMode={viewMode}
                    showState={false} // Não mostra estado pois todos são do mesmo estado
                    user={user}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  {currentStateInfo.emoji}
                </div>
                <h3>Nenhum canal encontrado</h3>
                <p>
                  {filters.search || filters.category || filters.type !== 'all'
                    ? `Tente ajustar os filtros para encontrar mais canais do ${currentStateInfo.name}.`
                    : `Ainda não há canais cadastrados do ${currentStateInfo.name}.`
                  }
                </p>
                {(filters.search || filters.category || filters.type !== 'all') && (
                  <button className="btn btn-primary" onClick={clearFilters}>
                    <Filter className="icon" />
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SEO Local Footer */}
        <div className="local-seo">
          <h2>🗺️ Canais do {currentStateInfo.name}</h2>
          <p>
            O Portal X Brasil é o maior diretório de canais e grupos do Telegram do {currentStateInfo.name}. 
            Aqui você encontra conteúdo exclusivo e de qualidade de {currentStateInfo.capital && `${currentStateInfo.capital} e `}
            todas as cidades do {currentStateInfo.name}. 
            Nossa plataforma conecta pessoas com os melhores grupos da região {currentStateInfo.region}.
          </p>
          
          <div className="seo-keywords">
            <h3>🔍 Busque por:</h3>
            <div className="keywords-grid">
              <span>Canais {currentStateInfo.name}</span>
              <span>Grupos {stateCode}</span>
              <span>Telegram {currentStateInfo.name}</span>
              {currentStateInfo.capital && <span>{currentStateInfo.capital} Telegram</span>}
              <span>Canais {currentStateInfo.region}</span>
              <span>Grupos {currentStateInfo.region}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default State
