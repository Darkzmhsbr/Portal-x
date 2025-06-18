import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingScreen from './components/LoadingScreen'

/**
 * App.jsx - O Cérebro do Sistema! 🧠
 * 
 * Este arquivo é como um GPS que:
 * 1. Define todas as rotas (caminhos) do site
 * 2. Protege páginas que precisam de login
 * 3. Carrega as páginas só quando necessário (lazy loading)
 * 
 * É tipo o mapa do tesouro do nosso sistema!
 */

// Carregamento "preguiçoso" - só carrega a página quando precisar
// Isso deixa o site MUITO mais rápido! ⚡
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Admin = lazy(() => import('./pages/Admin'))
const Ranking = lazy(() => import('./pages/Ranking'))
const Category = lazy(() => import('./pages/Category'))
const State = lazy(() => import('./pages/State'))

// Páginas extras mencionadas no PDF
const Novidades = lazy(() => import('./pages/Novidades'))
const Populares = lazy(() => import('./pages/Populares'))
const Premium = lazy(() => import('./pages/Premium'))

/**
 * Componente que protege rotas privadas
 * 
 * É como um segurança na porta - só deixa passar
 * quem tem autorização (está logado) 🔒
 */
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isLoading } = useAuth()

  // Enquanto verifica se está logado
  if (isLoading) {
    return <LoadingScreen message="Verificando acesso..." />
  }

  // Se não está logado, manda pro login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Se precisa ser admin mas não é
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  // Se o usuário está pendente, mostra aviso
  if (user.status === 'pending' && !requireAdmin) {
    return (
      <div className="pending-approval">
        <div className="pending-content">
          <h2>Conta Pendente de Aprovação ⏳</h2>
          <p>
            Sua conta foi criada com sucesso e está aguardando aprovação 
            do administrador. Você receberá um email quando for liberada!
          </p>
          <button onClick={() => window.location.href = '/login'}>
            Voltar ao Login
          </button>
        </div>
      </div>
    )
  }

  // Tudo certo, pode passar!
  return children
}

/**
 * Componente principal do App
 * 
 * Define todas as rotas e regras de navegação
 * É o coração do sistema de navegação! ❤️
 */
function App() {
  const { user } = useAuth()

  return (
    <div className="app">
      {/* Suspense mostra loading enquanto carrega as páginas */}
      <Suspense fallback={<LoadingScreen message="Carregando página..." />}>
        <Routes>
          {/* === ROTAS PÚBLICAS === */}
          
          {/* Página inicial - com verificação de idade */}
          <Route path="/" element={<Home />} />
          
          {/* Login e Registro - com código de acesso */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Páginas de navegação do header */}
          <Route path="/novidades" element={<Novidades />} />
          <Route path="/populares" element={<Populares />} />
          
          {/* Páginas dinâmicas por categoria e estado */}
          <Route path="/category/:categoryId" element={<Category />} />
          <Route path="/state/:stateCode" element={<State />} />
          
          {/* === ROTAS PROTEGIDAS (PRECISA LOGIN) === */}
          
          {/* Dashboard do usuário */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          {/* Ranking - usuários logados podem ver */}
          <Route
            path="/ranking"
            element={
              <ProtectedRoute>
                <Ranking />
              </ProtectedRoute>
            }
          />
          
          {/* Premium - só para usuários logados */}
          <Route
            path="/premium"
            element={
              <ProtectedRoute>
                <Premium />
              </ProtectedRoute>
            }
          />
          
          {/* === ROTAS ADMINISTRATIVAS === */}
          
          {/* Painel do Admin - só admin pode acessar */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          
          {/* Rota coringa - qualquer URL não encontrada volta pra home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      
      {/* Estilos para página de aprovação pendente */}
      <style jsx>{`
        .pending-approval {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-background);
          padding: 2rem;
        }
        
        .pending-content {
          max-width: 500px;
          background: var(--color-surface);
          padding: 3rem;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .pending-content h2 {
          font-size: 2rem;
          color: var(--color-text-primary);
          margin-bottom: 1rem;
        }
        
        .pending-content p {
          color: var(--color-text-secondary);
          line-height: 1.6;
          margin-bottom: 2rem;
        }
        
        .pending-content button {
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 0.875rem 2rem;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        
        .pending-content button:hover {
          background: var(--color-primary-dark);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  )
}

export default App
