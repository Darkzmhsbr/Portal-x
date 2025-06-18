import pg from 'pg'
import dotenv from 'dotenv'

dotenv.config()

const { Pool } = pg

// Pool otimizado para Railway PostgreSQL
class DatabasePool {
  constructor() {
    this.pool = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 1000
  }

  createPool() {
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Configuração otimizada para produção vs desenvolvimento
    const config = {
      connectionString: isProduction 
        ? process.env.DATABASE_URL 
        : process.env.DATABASE_PUBLIC_URL,
      ssl: isProduction ? { rejectUnauthorized: false } : false,
      
      // Pool settings otimizados
      max: isProduction ? 20 : 5,
      min: isProduction ? 5 : 0,
      idleTimeoutMillis: isProduction ? 30000 : 10000,
      connectionTimeoutMillis: 5000,
      
      // Query timeout
      statement_timeout: 30000,
      query_timeout: 30000,
      
      // Connection retry
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    }

    this.pool = new Pool(config)
    
    // Event handlers para monitoramento
    this.pool.on('error', this.handlePoolError.bind(this))
    this.pool.on('connect', () => {
      console.log('✅ Nova conexão estabelecida com PostgreSQL')
    })
    
    return this.pool
  }

  async handlePoolError(err) {
    console.error('❌ Erro no pool de conexões:', err)
    
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
      await this.reconnect()
    }
  }

  async reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Máximo de tentativas de reconexão excedido')
      process.exit(1)
    }

    this.reconnectAttempts++
    console.log(`🔄 Tentativa de reconexão ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
    
    await new Promise(resolve => setTimeout(resolve, this.reconnectDelay * this.reconnectAttempts))
    
    try {
      await this.connect()
      this.reconnectAttempts = 0
    } catch (error) {
      await this.reconnect()
    }
  }

  async connect() {
    try {
      if (!this.pool) {
        this.createPool()
      }
      
      // Testar conexão
      const client = await this.pool.connect()
      const result = await client.query('SELECT NOW()')
      client.release()
      
      this.isConnected = true
      console.log('✅ Conectado ao PostgreSQL:', result.rows[0].now)
      
      return true
    } catch (error) {
      console.error('❌ Erro ao conectar com PostgreSQL:', error.message)
      throw error
    }
  }

  async query(text, params, options = {}) {
    if (!this.isConnected) {
      throw new Error('Banco de dados não conectado')
    }

    const start = Date.now()
    
    try {
      const result = await this.pool.query(text, params)
      const duration = Date.now() - start
      
      // Log de queries lentas (> 1s)
      if (duration > 1000) {
        console.warn(`⚠️ Query lenta (${duration}ms):`, text.substring(0, 100))
      }
      
      return result
    } catch (error) {
      console.error('❌ Erro na query:', { text, params, error: error.message })
      throw error
    }
  }

  async transaction(callback) {
    const client = await this.pool.connect()
    
    try {
      await client.query('BEGIN')
      const result = await callback(client)
      await client.query('COMMIT')
      return result
    } catch (error) {
      await client.query('ROLLBACK')
      throw error
    } finally {
      client.release()
    }
  }

  async close() {
    if (this.pool) {
      await this.pool.end()
      this.isConnected = false
      console.log('✅ Pool de conexões fechado')
    }
  }
}

// Instância singleton
const db = new DatabasePool()

// Função de inicialização do banco
export const initializeDatabase = async () => {
  try {
    await db.connect()
    await createTables()
    await createIndexes()
    await insertDefaultData()
    return true
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error)
    throw error
  }
}

// Criação otimizada de tabelas
const createTables = async () => {
  const queries = [
    // Tabela de usuários
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(100) UNIQUE,
      avatar_url VARCHAR(500),
      status VARCHAR(50) DEFAULT 'pending',
      role VARCHAR(50) DEFAULT 'user',
      access_code_verified BOOLEAN DEFAULT FALSE,
      referral_code VARCHAR(20) UNIQUE,
      referral_points INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de canais
    `CREATE TABLE IF NOT EXISTS channels (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      link VARCHAR(500) NOT NULL,
      telegram_id VARCHAR(100),
      category VARCHAR(100) NOT NULL,
      state VARCHAR(100),
      description TEXT,
      image_url VARCHAR(500),
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      members INTEGER DEFAULT 0,
      views INTEGER DEFAULT 0,
      entries INTEGER DEFAULT 0,
      exits INTEGER DEFAULT 0,
      clicks INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'pending',
      is_premium BOOLEAN DEFAULT FALSE,
      bot_link VARCHAR(500),
      level VARCHAR(50),
      last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    // Tabela de visitas
    `CREATE TABLE IF NOT EXISTS visits (
      id SERIAL PRIMARY KEY,
      referral_code VARCHAR(20),
      visitor_ip VARCHAR(45),
      user_agent TEXT,
      referrer TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(referral_code, visitor_ip)
    )`,
    
    // Tabela de métricas
    `CREATE TABLE IF NOT EXISTS metrics (
      id SERIAL PRIMARY KEY,
      channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      members_gained INTEGER DEFAULT 0,
      members_lost INTEGER DEFAULT 0,
      total_views INTEGER DEFAULT 0,
      unique_views INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(channel_id, date)
    )`,
    
    // Trigger para updated_at
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = CURRENT_TIMESTAMP;
      RETURN NEW;
    END;
    $$ language 'plpgsql'`
  ]

  if (!db.isConnected) {
    await db.connect()
  }
  for (const query of queries) {
    await db.query(query)
  }

   // Aplicar triggers
  const triggers = [
    {
      name: 'update_users_updated_at',
      sql: `CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    },
    {
      name: 'update_channels_updated_at',
      sql: `CREATE TRIGGER update_channels_updated_at BEFORE UPDATE ON channels
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`
    }
  ]

  for (const trigger of triggers) {
    try {
      // CORREÇÃO: Verificar se trigger existe antes de criar
      const checkTrigger = await db.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_trigger 
          WHERE tgname = $1
        )
      `, [trigger.name])
      
      if (!checkTrigger.rows[0].exists) {
        await db.query(trigger.sql)
        console.log(`✅ Trigger ${trigger.name} criado`)
      }
    } catch (error) {
      // Se erro for diferente de "já existe", relançar
      if (!error.message.includes('already exists')) {
        console.error(`❌ Erro ao criar trigger ${trigger.name}:`, error.message)
      }
    }
  }

  console.log('✅ Tabelas criadas/verificadas com sucesso')
}

// Criação de índices para performance
const createIndexes = async () => {
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)',
    'CREATE INDEX IF NOT EXISTS idx_channels_user_id ON channels(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_channels_category ON channels(category)',
    'CREATE INDEX IF NOT EXISTS idx_channels_state ON channels(state)',
    'CREATE INDEX IF NOT EXISTS idx_channels_status ON channels(status)',
    'CREATE INDEX IF NOT EXISTS idx_channels_members ON channels(members DESC)',
    'CREATE INDEX IF NOT EXISTS idx_visits_referral_code ON visits(referral_code)'
  ];

  if (!db.isConnected) {
    await db.connect();
  }
  for (const index of indexes) {
    await db.query(index);
  }

  console.log('✅ Índices criados/verificados com sucesso');
}

// 🔧 CORREÇÃO DO ERRO BCRYPT - Função separada para hash de senha
const hashPassword = async (password) => {
  try {
    // CORREÇÃO: Import dinâmico específico para bcryptjs em ES Modules
    const bcryptjs = await import('bcryptjs')
    const bcrypt = bcryptjs.default || bcryptjs
    
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 10
    return await bcrypt.hash(password, saltRounds)
  } catch (error) {
    console.error('❌ Erro ao fazer hash da senha:', error)
    throw error
  }
}

// Inserção de dados padrão (admin)
const insertDefaultData = async () => {
  try {
    if (!db.isConnected) {
      await db.connect()
    }
    // Verificar se admin existe
    const adminCheck = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [process.env.ADMIN_EMAIL]
    )

    if (adminCheck.rows.length === 0) {
      console.log('🔧 Criando usuário admin...')
      
      // CORREÇÃO: Usar função separada para hash
      const hashedPassword = await hashPassword(process.env.ADMIN_PASSWORD)

      await db.query(
        `INSERT INTO users (name, email, password, status, role, access_code_verified)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Administrador', process.env.ADMIN_EMAIL, hashedPassword, 'active', 'admin', true]
      )

      console.log('✅ Usuário admin criado com sucesso')
    } else {
      console.log('✅ Usuário admin já existe')
    }
  } catch (error) {
    console.error('❌ Erro ao inserir dados padrão:', error)
    // NÃO fazer throw aqui para não quebrar a inicialização
    // throw error
  }
}

// Exportar instância e métodos
export default db
export const query = db.query.bind(db)
export const transaction = db.transaction.bind(db)

// Exportar função de hash para uso em outros arquivos
export { hashPassword }