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
  Filter,
  Grid,
  List,
  Search,
  SlidersHorizontal,
  MapPin,
  Tag,
  TrendingUp,
  Users,
  Eye,
  ChevronRight,
  Home
} from 'lucide-react'
import './Category.css'

/**
 * Category.jsx - Página Dinâmica por Categoria! 📂
 * 
 * Página SEO otimizada que:
 * 1. Mostra canais filtrados por categoria específica
 * 2. URL otimizada: /category/famosas, /category/universitarias
 * 3. Filtros avançados (estado, ordenação, tipo)
 * 4. Meta tags dinâmicas para SEO
 * 5. Breadcrumb navigation
 * 6. Grid/Lista responsivos
 * 
 * Conectado ao backend REAL - zero simulações! 💯
 */

const Category = () => {
  const { categoryId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()
  const { 
    getChannelsByCategory, 
    getCategories,
    isLoading 
  } = useChannels()

  // Estados principais
  const [channels, setChannels] = useState([])
  const [categoryInfo, setCategoryInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // grid, list
  
  // Filtros da URL
  const [filters, setFilters] = useState({
    state: searchParams.get('state') || '',
    sortBy: searchParams.get('sort') || 'members', // members, recent, clicks, name
    order: searchParams.get('order') || 'desc', // asc, desc
    type: searchParams.get('type') || 'all', // all, vip, normal
    search: searchParams.get('search') || ''
  })

  // Carrega dados quando categoria ou filtros mudarem
  useEffect(() => {
    loadCategoryData()
  }, [categoryId, filters])

  // Atualiza URL quando filtros mudarem
  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    setSearchParams(params)
  }, [filters, setSearchParams])

  // SEO dinâmico
  useEffect(() => {
    if (categoryInfo) {
      document.title = `${categoryInfo.displayName} - Portal X Brasil`
      
      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]')
      if (metaDesc) {
        metaDesc.setAttribute('content', 
          `Descubra os melhores canais de ${categoryInfo.displayName.toLowerCase()} no Telegram. ` +
          `${channels.length} canais ativos com milhares de membros.`
        )
      }
    }
  }, [categoryInfo, channels.length])

  // Carrega dados REAIS da categoria
  const loadCategoryData = async () => {
    try {
      setLoading(true)
      
      // Busca canais da categoria com filtros aplicados
      const channelsData = await getChannelsByCategory(categoryId, filters)
      setChannels(channelsData)
      
      // Busca informações da categoria
      const categories = await getCategories()
      const category = categories.find(cat => cat.slug === categoryId)
      setCategoryInfo(category)
      
    } catch (error) {
      console.error('Erro ao carregar categoria:', error)
      toast.error('Erro ao carregar canais da categoria')
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
      state: '',
      sortBy: 'members',
      order: 'desc',
      type: 'all',
      search: ''
    })
  }

  // Obtém nome amigável da categoria
  const getCategoryDisplayName = (slug) => {
    const categoryNames = {
      'famosas': 'Famosas',
      'universitarias': 'Universitárias',
      'amadoras': 'Amadoras',
      'cornos': 'Cornos',
      'flagras': 'Flagras',
      'influencers': 'Influencers'
    }
    return categoryNames[slug] || slug.charAt(0).toUpperCase() + slug.slice(1)
  }

  // Obtém emoji da categoria
  const getCategoryEmoji = (slug) => {
    const categoryEmojis = {
      'famosas': '⭐',
      'universitarias': '🎓',
      'amadoras': '💕',
      'cornos': '🔥',
      'flagras': '📸',
      'influencers': '💎'
    }
    return categoryEmojis[slug] || '📺'
  }

  if (loading || isLoading) {
    return <LoadingScreen message="Carregando categoria..." />
  }

  if (!categoryInfo && !loading) {
    return (
      <div className="category">
        <Header />
        <div className="category-container">
          <div className="category-error">
            <h1>Categoria não encontrada</h1>
            <p>A categoria "{categoryId}" não existe ou foi removida.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="category">
      <Header />
      
      <div className="category-container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <a href="/" className="breadcrumb-item">
            <Home className="icon" />
            Início
          </a>
          <ChevronRight className="breadcrumb-separator" />
          <span className="breadcrumb-item current">
            {getCategoryEmoji(categoryId)} {getCategoryDisplayName(categoryId)}
          </span>
        </nav>

        {/* Header da Categoria */}
        <div className="category-header">
          <div className="category-title">
            <div className="category-icon">
              {getCategoryEmoji(categoryId)}
            </div>
            <div>
              <h1>{getCategoryDisplayName(categoryId)}</h1>
              <p className="category-description">
                {categoryInfo?.description || 
                 `Explore os melhores canais de ${getCategoryDisplayName(categoryId).toLowerCase()} no Telegram`}
              </p>
              <div className="category-stats">
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

        <div className="category-content">
          {/* Sidebar de Filtros */}
          <FilterSidebar
            filters={filters}
            onUpdateFilter={updateFilter}
            onClearFilters={clearFilters}
            showStateFilter={true}
            showTypeFilter={true}
            showSortFilter={true}
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
                    placeholder="Buscar canais..."
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
            {(filters.state || filters.type !== 'all' || filters.search) && (
              <div className="active-filters">
                <span className="filters-label">Filtros ativos:</span>
                <div className="filter-tags">
                  {filters.state && (
                    <span className="filter-tag">
                      <MapPin className="icon" />
                      {filters.state}
                      <button onClick={() => updateFilter('state', '')}>×</button>
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
                    showCategory={false}
                    user={user}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  {getCategoryEmoji(categoryId)}
                </div>
                <h3>Nenhum canal encontrado</h3>
                <p>
                  {filters.search || filters.state || filters.type !== 'all'
                    ? 'Tente ajustar os filtros para encontrar mais canais.'
                    : `Ainda não há canais na categoria ${getCategoryDisplayName(categoryId).toLowerCase()}.`
                  }
                </p>
                {(filters.search || filters.state || filters.type !== 'all') && (
                  <button className="btn btn-primary" onClick={clearFilters}>
                    <Filter className="icon" />
                    Limpar Filtros
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Category
