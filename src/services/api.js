import axios from 'axios'
import toast from 'react-hot-toast'

// Criando uma instância do axios com configurações padrão
const api = axios.create({
  // URL base - em desenvolvimento usa proxy do Vite, em produção usa URL real
  baseURL: import.meta.env.PROD 
    ? '/api' 
    : 'http://localhost:8080/api',
  
  // Timeout de 30 segundos para requisições
  timeout: 30000,
  
  // Headers padrão
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptador de requisições (antes de enviar)
api.interceptors.request.use(
  (config) => {
    // Pega o token do localStorage se existir
    const token = localStorage.getItem('token')
    
    // Se tiver token, adiciona no header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('📤 Requisição:', config.method?.toUpperCase(), config.url)
    }
    
    return config
  },
  (error) => {
    // Se der erro antes de enviar
    console.error('❌ Erro na requisição:', error)
    return Promise.reject(error)
  }
)

// Interceptador de respostas (depois de receber)
api.interceptors.response.use(
  (response) => {
    // Log em desenvolvimento
    if (import.meta.env.DEV) {
      console.log('📥 Resposta:', response.config.url, response.status)
    }
    
    // Retorna apenas os dados (sem o envelope do axios)
    return response
  },
  (error) => {
    // Tratamento de erros global
    if (error.response) {
      // Servidor respondeu com erro
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Token inválido ou expirado
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          
          // Só mostra mensagem se não for na rota de login
          if (!window.location.pathname.includes('/login')) {
            toast.error('Sessão expirada. Faça login novamente.')
            window.location.href = '/login'
          }
          break
          
        case 403:
          // Sem permissão
          toast.error('Você não tem permissão para acessar este recurso')
          break
          
        case 404:
          // Não encontrado
          toast.error('Recurso não encontrado')
          break
          
        case 429:
          // Muitas requisições
          toast.error('Muitas tentativas. Aguarde um momento.')
          break
          
        case 500:
          // Erro no servidor
          toast.error('Erro no servidor. Tente novamente mais tarde.')
          break
          
        default:
          // Outros erros
          if (data?.message) {
            toast.error(data.message)
          }
      }
    } else if (error.request) {
      // Requisição enviada mas sem resposta
      toast.error('Sem conexão com o servidor')
    } else {
      // Erro ao configurar a requisição
      toast.error('Erro ao processar requisição')
    }
    
    return Promise.reject(error)
  }
)

// Exporta a instância configurada
export default api

// Funções auxiliares para facilitar o uso
export const apiHelpers = {
  // Upload de arquivo
  uploadFile: async (url, file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress(percentCompleted)
        }
      },
    })
  },
  
  // Download de arquivo
  downloadFile: async (url, filename) => {
    try {
      const response = await api.get(url, {
        responseType: 'blob',
      })
      
      // Criar link temporário para download
      const blob = new Blob([response.data])
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      link.download = filename
      link.click()
      
      // Limpar
      window.URL.revokeObjectURL(link.href)
    } catch (error) {
      toast.error('Erro ao baixar arquivo')
      throw error
    }
  },
}