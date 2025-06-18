-- Portal X - Schema PostgreSQL Otimizado
-- Versão 1.0.0

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    username VARCHAR(100) UNIQUE,
    avatar_url VARCHAR(500),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'blocked')),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    access_code_verified BOOLEAN DEFAULT FALSE,
    referral_code VARCHAR(20) UNIQUE DEFAULT substr(md5(random()::text), 0, 9),
    referral_points INTEGER DEFAULT 0 CHECK (referral_points >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de canais/grupos
CREATE TABLE IF NOT EXISTS channels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    link VARCHAR(500) NOT NULL,
    telegram_id VARCHAR(100),
    category VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    description TEXT,
    image_url VARCHAR(500),
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    members INTEGER DEFAULT 0 CHECK (members >= 0),
    views INTEGER DEFAULT 0 CHECK (views >= 0),
    entries INTEGER DEFAULT 0 CHECK (entries >= 0),
    exits INTEGER DEFAULT 0 CHECK (exits >= 0),
    clicks INTEGER DEFAULT 0 CHECK (clicks >= 0),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
    is_premium BOOLEAN DEFAULT FALSE,
    bot_link VARCHAR(500),
    level VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de visitas para tracking de referral
CREATE TABLE IF NOT EXISTS visits (
    id SERIAL PRIMARY KEY,
    referral_code VARCHAR(20),
    visitor_ip VARCHAR(45) NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(referral_code, visitor_ip)
);

-- Tabela de métricas diárias
CREATE TABLE IF NOT EXISTS metrics (
    id SERIAL PRIMARY KEY,
    channel_id INTEGER REFERENCES channels(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    members_gained INTEGER DEFAULT 0,
    members_lost INTEGER DEFAULT 0,
    total_views INTEGER DEFAULT 0,
    unique_views INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(channel_id, date)
);

-- Tabela de sessões de acesso
CREATE TABLE IF NOT EXISTS access_sessions (
    id SERIAL PRIMARY KEY,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    access_type VARCHAR(50) NOT NULL CHECK (access_type IN ('user', 'admin', 'visitor')),
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    order_index INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para calcular nível baseado em membros
CREATE OR REPLACE FUNCTION calculate_channel_level(member_count INTEGER)
RETURNS VARCHAR(50) AS $$
BEGIN
    CASE
        WHEN member_count >= 50000 THEN RETURN 'legendary';
        WHEN member_count >= 20000 THEN RETURN 'master';
        WHEN member_count >= 7000 THEN RETURN 'veteran';
        WHEN member_count >= 3000 THEN RETURN 'medium';
        ELSE RETURN 'beginner';
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar nível automaticamente
CREATE OR REPLACE FUNCTION update_channel_level()
RETURNS TRIGGER AS $$
BEGIN
    NEW.level = calculate_channel_level(NEW.members);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_channel_level
BEFORE INSERT OR UPDATE OF members ON channels
FOR EACH ROW
EXECUTE FUNCTION update_channel_level();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_channels_updated_at
BEFORE UPDATE ON channels
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_channels_user_id ON channels(user_id);
CREATE INDEX idx_channels_category ON channels(category);
CREATE INDEX idx_channels_state ON channels(state);
CREATE INDEX idx_channels_status ON channels(status);
CREATE INDEX idx_channels_members ON channels(members DESC);
CREATE INDEX idx_channels_level ON channels(level);
CREATE INDEX idx_visits_referral_code ON visits(referral_code);
CREATE INDEX idx_visits_created_at ON visits(created_at);
CREATE INDEX idx_metrics_channel_date ON metrics(channel_id, date);
CREATE INDEX idx_access_sessions_token ON access_sessions(session_token);

-- Índice de texto completo para busca
CREATE INDEX idx_channels_search ON channels 
USING gin(to_tsvector('portuguese', name || ' ' || COALESCE(description, '')));

-- Dados iniciais
INSERT INTO categories (name, slug, icon, order_index) VALUES
('Universitárias', 'universitarias', '🎓', 1),
('Amadoras', 'amadoras', '🔥', 2),
('Famosas', 'famosas', '⭐', 3),
('Cornos', 'cornos', '🤘', 4),
('Vazadas', 'vazadas', '📸', 5),
('OnlyFans', 'onlyfans', '💎', 6),
('TikTokers', 'tiktokers', '🎵', 7),
('Modelos TV', 'modelos-tv', '📺', 8),
('Influencers', 'influencers', '✨', 9),
('Premium', 'premium', '👑', 10)
ON CONFLICT (slug) DO NOTHING;

-- Estatísticas e views úteis
CREATE OR REPLACE VIEW channel_rankings AS
SELECT 
    c.*,
    u.name as user_name,
    u.username,
    RANK() OVER (ORDER BY c.members DESC) as rank_global,
    RANK() OVER (PARTITION BY c.category ORDER BY c.members DESC) as rank_category
FROM channels c
JOIN users u ON c.user_id = u.id
WHERE c.status = 'active';

CREATE OR REPLACE VIEW user_statistics AS
SELECT 
    u.id,
    u.name,
    u.username,
    u.referral_points,
    COUNT(c.id) as total_channels,
    SUM(c.members) as total_members,
    SUM(c.views) as total_views,
    AV