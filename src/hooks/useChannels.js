import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useState } from 'react'
import toast from 'react-hot-toast'
import channelsService from '../services/channels'

/**
 * Hook principal para trabalhar com canais
 * 
 * Imagine este hook como um "controle remoto" para canais.
 * Ele facilita buscar, criar, editar e deletar canais!
 * 
 * @param {Object} options - Opções do hook
 * @param {Object} options.filters - Filtros para buscar canais
 * @param {boolean} options.enabled - Ativar/desativar busca automática
 */
export function useChannels(options = {}) {
  const { filters = {}, enabled = true } = options
  const queryClient = useQueryClient()
  
  // Estado local para filtros dinâmicos
  const [localFilters, setLocalFilters] = useState(filters)
  
  // Buscar canais com React Query
  const query = useQuery(
    ['channels', localFilters], // Chave única para o cache
    () => channelsService.getChannels(localFilters),
    {
      enabled, // Só busca se enabled for true
      staleTime: 5 * 60 * 1000, // Cache por 5 minutos
      cacheTime: 10 * 60 * 1000, // Mantém no cache por 10 minutos
      onError: (error) => {
        console.error('Erro ao buscar canais:', error)
      }
    }
  )
  
  // Mutation para criar canal
  const createMutation = useMutation(
    (channelData) => channelsService.createChannel(channelData),
    {
      onSuccess: (data) => {
        // Invalida o cache para buscar a lista atualizada
        queryClient.invalidateQueries('channels')
        queryClient.invalidateQueries('my-channels')
        
        toast.success('Canal criado com sucesso! Aguarde aprovação.')
      },
      onError: (error) => {
        toast.error('Erro ao criar canal')
      }
    }
  )
  
  // Mutation para atualizar canal
  const updateMutation = useMutation(
    ({ id, data }) => channelsService.updateChannel(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('channels')
        queryClient.invalidateQueries('my-channels')
        
        toast.success('Canal atualizado!')
      },
      onError: () => {
        toast.error('Erro ao atualizar canal')
      }
    }
  )
  
  // Mutation para deletar canal
  const deleteMutation = useMutation(
    (channelId) => channelsService.deleteChannel(channelId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('channels')
        queryClient.invalidateQueries('my-channels')
        
        toast.success('Canal removido')
      },
      onError: () => {
        toast.error('Erro ao remover canal')
      }
    }
  )
  
  // Função para atualizar filtros
  const updateFilters = (newFilters) => {
    setLocalFilters(prev => ({ ...prev, ...newFilters }))
  }
  
  // Função para limpar filtros
  const clearFilters = () => {
    setLocalFilters({})
  }
  
  return {
    // Dados e estado da query
    channels: query.data?.channels || [],
    totalChannels: query.data?.total || 0,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    
    // Funções de filtro
    filters: localFilters,
    updateFilters,
    clearFilters,
    
    // Funções CRUD
    createChannel: createMutation.mutate,
    updateChannel: updateMutation.mutate,
    deleteChannel: deleteMutation.mutate,
    
    // Estados das mutations
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
    
    // Função para refazer a busca
    refetch: query.refetch,
  }
}

/**
 * Hook para buscar canais do usuário atual
 * Perfeito para a página de Dashboard!
 */
export function useMyChannels() {
  const query = useQuery(
    'my-channels',
    channelsService.getMyChannels,
    {
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  )
  
  return {
    channels: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  }
}

/**
 * Hook para buscar um canal específico
 * @param {number} channelId - ID do canal
 */
export function useChannel(channelId) {
  const query = useQuery(
    ['channel', channelId],
    () => channelsService.getChannelById(channelId),
    {
      enabled: !!channelId, // Só busca se tiver ID
      staleTime: 5 * 60 * 1000,
    }
  )
  
  return {
    channel: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
  }
}

/**
 * Hook para buscar ranking de canais
 * @param {string} period - Período (weekly, monthly, etc)
 */
export function useChannelRanking(period = 'all') {
  const query = useQuery(
    ['channel-ranking', period],
    () => channelsService.getRanking(period),
    {
      staleTime: 10 * 60 * 1000, // Cache por 10 minutos
    }
  )
  
  return {
    ranking: query.data || [],
    isLoading: query.isLoading,
    refetch: query.refetch,
  }
}

/**
 * Hook para rastrear cliques em canais
 * Incrementa o contador quando alguém clica
 */
export function useTrackChannelClick() {
  const mutation = useMutation(
    (channelId) => channelsService.trackClick(channelId),
    {
      onError: (error) => {
        console.error('Erro ao rastrear clique:', error)
      }
    }
  )
  
  return mutation.mutate
}

/**
 * Hook para buscar canais por tipo especial
 * @param {string} type - Tipo (new, popular, premium)
 */
export function useSpecialChannels(type) {
  const query = useQuery(
    ['channels', type],
    () => {
      switch (type) {
        case 'new':
          return channelsService.getNewChannels()
        case 'popular':
          return channelsService.getPopularChannels()
        case 'premium':
          return channelsService.getPremiumChannels()
        default:
          return []
      }
    },
    {
      staleTime: 5 * 60 * 1000,
    }
  )
  
  return {
    channels: query.data || [],
    isLoading: query.isLoading,
  }
}