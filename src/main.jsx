import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { ReactQueryDevtools } from 'react-query/devtools'
import { Toaster } from 'react-hot-toast'

import App from './App'
import { AuthProvider } from './context/AuthContext'
import './styles/global.css'

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    },
  },
})

// Configuração do Toaster
const toasterConfig = {
  position: 'top-right',
  duration: 4000,
  style: {
    background: '#1F2937',
    color: '#F3F4F6',
    borderRadius: '8px',
    padding: '16px',
    fontSize: '14px',
  },
  success: {
    iconTheme: {
      primary: '#10B981',
      secondary: '#F3F4F6',
    },
  },
  error: {
    iconTheme: {
      primary: '#EF4444',
      secondary: '#F3F4F6',
    },
  },
}

// Renderização principal
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster {...toasterConfig} />
        </AuthProvider>
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools initialIsOpen={false} />
        )}
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
