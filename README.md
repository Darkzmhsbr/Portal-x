# Portal-X Brasil

Portal de listagem de canais e grupos segmentados para o Brasil.

## 🚀 Como usar o modo de desenvolvimento

Para testar o frontend sem precisar do backend (banco de dados PostgreSQL), siga os passos:

1. Clone o repositório e instale as dependências:

```bash
npm install
```

2. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

3. Acesse a URL especial de desenvolvimento:

```
http://localhost:5173/dev
```

4. Na página de configuração, clique em um dos botões:
   - **Ativar Modo Usuário:** Para testar como usuário comum
   - **Ativar Modo Admin:** Para testar como administrador

5. Clique em "Ir para o Portal-X" para acessar a aplicação com o bypass ativado.

## 📝 Características

- Listagem de canais e grupos por categorias
- Sistema de filtros avançado
- Página de favoritos
- Sistema de ranking dos canais mais acessados
- Sistema de login/registro com nível de acesso
- Painel administrativo

## 💻 Tecnologias

- Frontend: React com Vite
- Backend: Node.js com Express
- Database: PostgreSQL
- Estilização: CSS Modules

## 🧑‍💻 Desenvolvimento

O projeto utiliza o padrão de módulos ES para JavaScript tanto no frontend quanto no backend.

### Estrutura de diretórios:

- `src/` - Código-fonte do frontend
- `server/` - Código-fonte do backend
- `public/` - Arquivos públicos

## 🚨 Problemas com o banco de dados

Se você encontrar erros relacionados ao PostgreSQL (ECONNREFUSED), significa que o servidor não conseguiu se conectar ao banco de dados. Use o modo de desenvolvimento conforme explicado acima para testar apenas o frontend.

Para configurar o banco de dados completo, você precisará:

1. Instalar PostgreSQL no seu computador
2. Criar um banco de dados para o projeto
3. Configurar as variáveis de ambiente para conexão

## ⚙️ Scripts disponíveis

- `npm run dev` - Inicia o frontend e o backend em modo de desenvolvimento
- `npm run dev:client` - Inicia apenas o frontend
- `npm run dev:server` - Inicia apenas o backend
- `npm run build` - Compila o projeto para produção 