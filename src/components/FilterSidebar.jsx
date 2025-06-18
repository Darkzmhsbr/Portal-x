import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp,
  MapPin,
  Tag,
  Users,
  TrendingUp,
  Crown,
  Calendar,
  RotateCcw
} from 'lucide-react'
import './FilterSidebar.css'

/**
 * Componente FilterSidebar - A Barra de Filtros
 * 
 * Imagine como um "menu de restaurante" onde você escolhe:
 * - Categorias (tipo de comida)
 * - Estados (localização)
 * - Níveis (preço)
 * - Ordenação (mais popular, mais novo)
 * 
 * Ajuda a encontrar exatamente o que procura! 🔍
 */
const FilterSidebar = ({ 
  filters = {}, 
  onFilterChange, 
  onReset,
  isOpen = true,
  onToggle,
  showMobileToggle = true,
  totalResults = 0
}) => {
  // Estados locais para controlar seções abertas/fechadas
  const [openSections, setOpenSections] = useState({
    category: true,
    state: true,
    level: true,
    members: true,
    sort: true
  })

  // Opções de filtros disponíveis
  const filterOptions = {
    categories: [
      { value: 'amadoras', label: 'Amadoras', icon: '🔥', count: 156 },
      { value: 'famosas', label: 'Famosas', icon: '⭐', count: 89 },
      { value: 'vazadas', label: 'Vazadas', icon: '💦', count: 234 },
      { value: 'cornos', label: 'Cornos', icon: '🤘', count: 78 },
      { value: 'universitarias', label: 'Universitárias', icon: '🎓', count: 145 },
      { value: 'influencers', label: 'Influencers', icon: '📱', count: 167 }
    ],
    states: [
      { value: 'SP', label: 'São Paulo', count: 324 },
      { value: 'RJ', label: 'Rio de Janeiro', count: 187 },
      { value: 'MG', label: 'Minas Gerais', count: 156 },
      { value: 'BA', label: 'Bahia', count: 98 },
      { value: 'PR', label: 'Paraná', count: 87 },
      { value: 'RS', label: 'Rio Grande do Sul', count: 76 },
      { value: 'PE', label: 'Pernambuco', count: 65 },
      { value: 'CE', label: 'Ceará', count: 54 }
    ],
    levels: [
      { value: 'iniciante', label: 'Iniciante', icon: '🔰', color: '#6B7280' },
      { value: 'mediano', label: 'Mediano', icon: '🔶', color: '#F59E0B' },
      { value: 'veterano', label: 'Veterano', icon: '🚀', color: '#3B82F6' },
      { value: 'mestre', label: 'Mestre', icon: '⚜️', color: '#8B5CF6' },
      { value: 'legendario', label: 'Legendário', icon: '🔱', color: '#DC2626' }
    ],
    memberRanges: [
      { value: '0-1000', label: 'Até 1K membros' },
      { value: '1000-5000', label: '1K - 5K membros' },
      { value: '5000-10000', label: '5K - 10K membros' },
      { value: '10000-50000', label: '10K - 50K membros' },
      { value: '50000+', label: 'Mais de 50K membros' }
    ],
    sortOptions: [
      { value: 'newest', label: 'Mais Recentes', icon: <Calendar size={16} /> },
      { value: 'popular', label: 'Mais Populares', icon: <TrendingUp size={16} /> },
      { value: 'members_desc', label: 'Mais Membros', icon: <Users size={16} /> },
      { value: 'members_asc', label: 'Menos Membros', icon: <Users size={16} /> },
      { value: 'premium', label: 'Premium Primeiro', icon: <Crown size={16} /> }
    ]
  }

  // Toggle de seção
  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Manipula mudança de filtro
  const handleFilterChange = (type, value) => {
    const currentValues = filters[type] || []
    let newValues

    if (type === 'sort') {
      // Sort é único, não múltiplo
      newValues = value
    } else {
      // Toggle para filtros múltiplos
      if (currentValues.includes(value)) {
        newValues = currentValues.filter(v => v !== value)
      } else {
        newValues = [...currentValues, value]
      }
    }

    onFilterChange(type, newValues)
  }

  // Conta filtros ativos
  const activeFiltersCount = Object.values(filters).reduce((count, filterArray) => {
    if (Array.isArray(filterArray)) {
      return count + filterArray.length
    }
    return filterArray ? count + 1 : count
  }, 0)

  // Componente de seção de filtro
  const FilterSection = ({ title, name, children, icon }) => (
    <div className="filter-section">
      <button
        className="filter-section__header"
        onClick={() => toggleSection(name)}
      >
        <div className="header-content">
          {icon}
          <span>{title}</span>
        </div>
        {openSections[name] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      
      <AnimatePresence>
        {openSections[name] && (
          <motion.div
            className="filter-section__content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )

  // Renderização mobile
  if (showMobileToggle && !isOpen) {
    return (
      <motion.button
        className="filter-toggle-mobile"
        onClick={onToggle}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Filter size={20} />
        Filtros
        {activeFiltersCount > 0 && (
          <span className="filter-count">{activeFiltersCount}</span>
        )}
      </motion.button>
    )
  }

  return (
    <motion.aside 
      className={`filter-sidebar ${isOpen ? 'open' : ''}`}
      initial={{ x: -300 }}
      animate={{ x: isOpen ? 0 : -300 }}
      transition={{ type: 'tween', duration: 0.3 }}
    >
      {/* Cabeçalho */}
      <div className="filter-sidebar__header">
        <h3>
          <Filter size={20} />
          Filtros
        </h3>
        
        <div className="header-actions">
          {activeFiltersCount > 0 && (
            <button 
              className="reset-button"
              onClick={onReset}
              title="Limpar filtros"
            >
              <RotateCcw size={16} />
              Limpar ({activeFiltersCount})
            </button>
          )}
          
          {showMobileToggle && (
            <button 
              className="close-button"
              onClick={onToggle}
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Resultados encontrados */}
      {totalResults > 0 && (
        <div className="filter-results">
          <span className="results-count">{totalResults}</span>
          <span className="results-text">resultados encontrados</span>
        </div>
      )}

      {/* Seções de filtros */}
      <div className="filter-sidebar__content">
        {/* Categorias */}
        <FilterSection 
          title="Categorias" 
          name="category"
          icon={<Tag size={18} />}
        >
          <div className="filter-options">
            {filterOptions.categories.map(category => (
              <label 
                key={category.value} 
                className="filter-option"
              >
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category.value) || false}
                  onChange={() => handleFilterChange('categories', category.value)}
                />
                <span className="option-content">
                  <span className="option-icon">{category.icon}</span>
                  <span className="option-label">{category.label}</span>
                  <span className="option-count">{category.count}</span>
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Estados */}
        <FilterSection 
          title="Estados" 
          name="state"
          icon={<MapPin size={18} />}
        >
          <div className="filter-options scrollable">
            {filterOptions.states.map(state => (
              <label 
                key={state.value} 
                className="filter-option"
              >
                <input
                  type="checkbox"
                  checked={filters.states?.includes(state.value) || false}
                  onChange={() => handleFilterChange('states', state.value)}
                />
                <span className="option-content">
                  <span className="option-label">{state.label}</span>
                  <span className="option-count">{state.count}</span>
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Níveis */}
        <FilterSection 
          title="Níveis" 
          name="level"
          icon={<TrendingUp size={18} />}
        >
          <div className="filter-options">
            {filterOptions.levels.map(level => (
              <label 
                key={level.value} 
                className="filter-option"
              >
                <input
                  type="checkbox"
                  checked={filters.levels?.includes(level.value) || false}
                  onChange={() => handleFilterChange('levels', level.value)}
                />
                <span className="option-content">
                  <span 
                    className="option-icon" 
                    style={{ color: level.color }}
                  >
                    {level.icon}
                  </span>
                  <span className="option-label">{level.label}</span>
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Quantidade de Membros */}
        <FilterSection 
          title="Membros" 
          name="members"
          icon={<Users size={18} />}
        >
          <div className="filter-options">
            {filterOptions.memberRanges.map(range => (
              <label 
                key={range.value} 
                className="filter-option"
              >
                <input
                  type="radio"
                  name="memberRange"
                  checked={filters.memberRange === range.value}
                  onChange={() => handleFilterChange('memberRange', range.value)}
                />
                <span className="option-content">
                  <span className="option-label">{range.label}</span>
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Ordenação */}
        <FilterSection 
          title="Ordenar por" 
          name="sort"
          icon={<TrendingUp size={18} />}
        >
          <div className="filter-options">
            {filterOptions.sortOptions.map(option => (
              <label 
                key={option.value} 
                className="filter-option sort-option"
              >
                <input
                  type="radio"
                  name="sort"
                  checked={filters.sort === option.value}
                  onChange={() => handleFilterChange('sort', option.value)}
                />
                <span className="option-content">
                  {option.icon}
                  <span className="option-label">{option.label}</span>
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      </div>

      {/* Rodapé com botão de aplicar (mobile) */}
      {showMobileToggle && (
        <div className="filter-sidebar__footer">
          <button 
            className="apply-button"
            onClick={onToggle}
          >
            Aplicar Filtros
          </button>
        </div>
      )}
    </motion.aside>
  )
}

// Hook para gerenciar filtros
export const useFilters = () => {
  const [filters, setFilters] = useState({
    categories: [],
    states: [],
    levels: [],
    memberRange: null,
    sort: 'newest'
  })

  const updateFilter = (type, value) => {
    setFilters(prev => ({
      ...prev,
      [type]: value
    }))
  }

  const resetFilters = () => {
    setFilters({
      categories: [],
      states: [],
      levels: [],
      memberRange: null,
      sort: 'newest'
    })
  }

  const getActiveCount = () => {
    return Object.values(filters).reduce((count, value) => {
      if (Array.isArray(value)) return count + value.length
      if (value && value !== 'newest') return count + 1
      return count
    }, 0)
  }

  return {
    filters,
    updateFilter,
    resetFilters,
    activeCount: getActiveCount()
  }
}

export default FilterSidebar
