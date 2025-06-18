#!/usr/bin/env node

/**
 * 🔍 FERRAMENTA DE DIAGNÓSTICO COMPLETA - PORTAL X BRASIL
 * 
 * PARTE 01 - PROBLEMAS IDENTIFICADOS:
 * ❌ Rotas não funcionando (/login, /register, /admin)
 * ❌ Verificação de idade repetindo entre páginas
 * ❌ Build OK mas páginas não exibindo
 * ❌ Navegação quebrada
 * 
 * Execute: node diagnose-portal.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cores para terminal
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  bg: {
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m'
  }
};

class PortalDiagnostic {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.criticalIssues = [];
    this.routeProblems = [];
    this.ageVerificationIssues = [];
    this.missingFiles = [];
    this.configProblems = [];
    this.buildProblems = [];
  }

  // ==================== UTILITÁRIOS ====================
  
  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(title) {
    console.log(`\n${colors.cyan}${colors.bright}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}🔍 ${title}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}${'='.repeat(60)}${colors.reset}\n`);
  }

  addIssue(category, severity, description, file, solution, code = null) {
    const issue = {
      category,
      severity,
      description,
      file,
      solution,
      code,
      timestamp: new Date().toISOString()
    };
    
    this.issues.push(issue);
    if (severity === 'CRÍTICO') {
      this.criticalIssues.push(issue);
    }

    if (category.includes('ROTA')) {
      this.routeProblems.push(issue);
    }
    if (category.includes('IDADE')) {
      this.ageVerificationIssues.push(issue);
    }
    if (category.includes('BUILD')) {
      this.buildProblems.push(issue);
    }
  }

  fileExists(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    return fs.existsSync(fullPath);
  }

  readFile(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      return fs.readFileSync(fullPath, 'utf8');
    } catch (error) {
      return null;
    }
  }

  // ==================== DIAGNÓSTICOS PRINCIPAIS ====================

  // 1. VERIFICAR ESTRUTURA DE ARQUIVOS
  async checkFileStructure() {
    this.logHeader('VERIFICANDO ESTRUTURA DE ARQUIVOS');

    const requiredFiles = [
      // Arquivos principais
      'src/App.jsx',
      'src/main.jsx', 
      'vite.config.js',
      'package.json',
      
      // Páginas obrigatórias (que não estão funcionando)
      'src/pages/Home.jsx',
      'src/pages/Login.jsx', 
      'src/pages/Register.jsx',
      'src/pages/Admin.jsx',
      'src/pages/Dashboard.jsx',
      'src/pages/Ranking.jsx',
      'src/pages/Category.jsx',
      'src/pages/State.jsx',
      'src/pages/Novidades.jsx',
      'src/pages/Populares.jsx', 
      'src/pages/Premium.jsx',
      
      // Componentes críticos
      'src/components/AgeVerification.jsx',
      'src/components/Header.jsx',
      'src/components/LoadingScreen.jsx',
      'src/components/AccessCode.jsx',
      
      // Context e hooks
      'src/context/AuthContext.jsx',
      'src/hooks/useAuth.js',
      
      // Services
      'src/services/api.js',
      'src/services/auth.js'
    ];

    let missingCount = 0;
    
    for (const file of requiredFiles) {
      if (!this.fileExists(file)) {
        missingCount++;
        this.missingFiles.push(file);
        this.addIssue(
          'ARQUIVO_FALTANDO',
          'CRÍTICO',
          `Arquivo obrigatório não encontrado: ${file}`,
          file,
          `Criar o arquivo ${file} - isso pode estar causando as rotas não funcionarem`
        );
        this.log(`❌ FALTANDO: ${file}`, 'red');
      } else {
        this.log(`✅ OK: ${file}`, 'green');
      }
    }

    if (missingCount === 0) {
      this.log('\n🎉 TODOS OS ARQUIVOS OBRIGATÓRIOS ENCONTRADOS!', 'green');
    } else {
      this.log(`\n⚠️  ${missingCount} ARQUIVOS FALTANDO - ISSO PODE ESTAR QUEBRANDO AS ROTAS!`, 'yellow');
    }
  }

  // 2. ANALISAR CONFIGURAÇÃO DE ROTAS
  async checkRouteConfiguration() {
    this.logHeader('ANALISANDO CONFIGURAÇÃO DE ROTAS NO APP.JSX');

    const appContent = this.readFile('src/App.jsx');
    if (!appContent) {
      this.addIssue(
        'ROTA_CRÍTICO',
        'CRÍTICO',
        'App.jsx não encontrado - Sistema de rotas não vai funcionar',
        'src/App.jsx',
        'Criar App.jsx com todas as rotas configuradas corretamente'
      );
      this.log('❌ App.jsx NÃO ENCONTRADO - ROTAS NÃO VÃO FUNCIONAR!', 'red');
      return;
    }

    // Verificar rotas específicas que não estão funcionando
    const routesToCheck = [
      { path: '/login', component: 'Login', protected: false },
      { path: '/register', component: 'Register', protected: false },
      { path: '/admin', component: 'Admin', protected: true },
      { path: '/dashboard', component: 'Dashboard', protected: true },
      { path: '/ranking', component: 'Ranking', protected: true },
      { path: '/novidades', component: 'Novidades', protected: false },
      { path: '/populares', component: 'Populares', protected: false },
      { path: '/premium', component: 'Premium', protected: false },
      { path: '/category/:categoryId', component: 'Category', protected: false },
      { path: '/state/:stateCode', component: 'State', protected: false }
    ];

    this.log('Verificando rotas definidas no App.jsx:\n');

    let routeProblemsFound = 0;
    
    for (const route of routesToCheck) {
      const routeExists = appContent.includes(`path="${route.path}"`) || 
                          appContent.includes(`path='${route.path}'`);
      const componentImported = appContent.includes(`import ${route.component}`) ||
                               appContent.includes(`const ${route.component} = lazy`);
      
      if (!routeExists) {
        routeProblemsFound++;
        this.addIssue(
          'ROTA_FALTANDO',
          'CRÍTICO',
          `Rota ${route.path} não definida no App.jsx`,
          'src/App.jsx',
          `Adicionar rota: <Route path="${route.path}" element={<${route.component} />} />`
        );
        this.log(`❌ ROTA FALTANDO: ${route.path} -> ${route.component}`, 'red');
      } else if (!componentImported) {
        routeProblemsFound++;
        this.addIssue(
          'ROTA_IMPORT_FALTANDO',
          'CRÍTICO',
          `Componente ${route.component} não importado no App.jsx`,
          'src/App.jsx',
          `Adicionar import: const ${route.component} = lazy(() => import('./pages/${route.component}'))`
        );
        this.log(`❌ IMPORT FALTANDO: ${route.component}`, 'red');
      } else {
        this.log(`✅ OK: ${route.path} -> ${route.component}`, 'green');
      }
    }

    if (routeProblemsFound === 0) {
      this.log('\n🎉 TODAS AS ROTAS ESTÃO CONFIGURADAS CORRETAMENTE!', 'green');
    } else {
      this.log(`\n⚠️  ${routeProblemsFound} PROBLEMAS DE ROTA ENCONTRADOS!`, 'yellow');
    }
  }

  // 3. VERIFICAR SISTEMA DE VERIFICAÇÃO DE IDADE
  async checkAgeVerification() {
    this.logHeader('ANALISANDO SISTEMA DE VERIFICAÇÃO DE IDADE');

    const ageVerificationFile = 'src/components/AgeVerification.jsx';
    const homeFile = 'src/pages/Home.jsx';
    
    // Verificar se componente existe
    if (!this.fileExists(ageVerificationFile)) {
      this.addIssue(
        'IDADE_VERIFICACAO_FALTANDO',
        'CRÍTICO',
        'Componente AgeVerification.jsx não encontrado',
        ageVerificationFile,
        'Criar componente AgeVerification.jsx para verificação de idade'
      );
      this.log('❌ AgeVerification.jsx NÃO ENCONTRADO!', 'red');
      return;
    }

    const ageContent = this.readFile(ageVerificationFile);
    const homeContent = this.readFile(homeFile);

    // Verificar problemas no sistema de verificação de idade
    let ageProblems = 0;

    // 1. Verificar se usa localStorage para persistir
    if (!ageContent.includes('localStorage') && !ageContent.includes('sessionStorage')) {
      ageProblems++;
      this.addIssue(
        'IDADE_PERSISTENCIA',
        'CRÍTICO',
        'Sistema de verificação de idade não persiste - pedirá verificação toda vez',
        ageVerificationFile,
        'Usar localStorage para salvar que usuário já verificou idade: localStorage.setItem("ageVerified", "true")'
      );
      this.log('❌ IDADE NÃO PERSISTE - VAI PEDIR TODA VEZ!', 'red');
    }

    // 2. Verificar se Home.jsx verifica idade corretamente
    if (homeContent && !homeContent.includes('ageVerified') && !homeContent.includes('localStorage')) {
      ageProblems++;
      this.addIssue(
        'IDADE_HOME_VERIFICACAO',
        'CRÍTICO',
        'Home.jsx não verifica se idade já foi confirmada',
        homeFile,
        'Verificar localStorage no Home.jsx antes de mostrar verificação de idade'
      );
      this.log('❌ HOME NÃO VERIFICA SE IDADE JÁ FOI CONFIRMADA!', 'red');
    }

    // 3. Verificar se outras páginas limpam verificação
    const otherPages = ['Premium.jsx', 'Novidades.jsx', 'Populares.jsx'];
    for (const page of otherPages) {
      const pageContent = this.readFile(`src/pages/${page}`);
      if (pageContent && pageContent.includes('localStorage.removeItem')) {
        ageProblems++;
        this.addIssue(
          'IDADE_REMOVENDO_INDEVIDO',
          'MÉDIO',
          `Página ${page} pode estar removendo verificação de idade`,
          `src/pages/${page}`,
          'Não remover localStorage da verificação de idade nas páginas internas'
        );
        this.log(`⚠️  ${page} pode estar removendo verificação de idade`, 'yellow');
      }
    }

    if (ageProblems === 0) {
      this.log('✅ Sistema de verificação de idade parece OK', 'green');
    } else {
      this.log(`\n⚠️  ${ageProblems} PROBLEMAS DE VERIFICAÇÃO DE IDADE ENCONTRADOS!`, 'yellow');
    }
  }

  // 4. VERIFICAR CONFIGURAÇÃO DO VITE
  async checkViteConfiguration() {
    this.logHeader('VERIFICANDO CONFIGURAÇÃO DO VITE');

    const viteConfigFile = 'vite.config.js';
    
    if (!this.fileExists(viteConfigFile)) {
      this.addIssue(
        'VITE_CONFIG_FALTANDO',
        'CRÍTICO',
        'vite.config.js não encontrado',
        viteConfigFile,
        'Criar vite.config.js com configurações de proxy e build'
      );
      this.log('❌ vite.config.js NÃO ENCONTRADO!', 'red');
      return;
    }

    const viteContent = this.readFile(viteConfigFile);
    let viteProblems = 0;

    // Verificar configurações importantes
    if (!viteContent.includes('react()')) {
      viteProblems++;
      this.addIssue(
        'VITE_REACT_PLUGIN',
        'CRÍTICO',
        'Plugin React não configurado no Vite',
        viteConfigFile,
        'Adicionar plugin: plugins: [react()]'
      );
      this.log('❌ Plugin React não configurado!', 'red');
    }

    if (!viteContent.includes('proxy')) {
      viteProblems++;
      this.addIssue(
        'VITE_PROXY',
        'MÉDIO',
        'Proxy para API não configurado',
        viteConfigFile,
        'Configurar proxy: proxy: { "/api": { target: "http://localhost:8080" } }'
      );
      this.log('⚠️  Proxy para API não configurado', 'yellow');
    }

    if (!viteContent.includes('build')) {
      viteProblems++;
      this.addIssue(
        'VITE_BUILD_CONFIG',
        'MÉDIO',
        'Configurações de build não otimizadas',
        viteConfigFile,
        'Adicionar configurações de build para produção'
      );
      this.log('⚠️  Configurações de build não otimizadas', 'yellow');
    }

    if (viteProblems === 0) {
      this.log('✅ Configuração do Vite parece OK', 'green');
    } else {
      this.log(`\n⚠️  ${viteProblems} PROBLEMAS DE CONFIGURAÇÃO DO VITE!`, 'yellow');
    }
  }

  // 5. VERIFICAR CONFIGURAÇÃO DO PACKAGE.JSON
  async checkPackageJson() {
    this.logHeader('VERIFICANDO PACKAGE.JSON');

    const packageFile = 'package.json';
    
    if (!this.fileExists(packageFile)) {
      this.addIssue(
        'PACKAGE_JSON_FALTANDO',
        'CRÍTICO',
        'package.json não encontrado',
        packageFile,
        'Criar package.json com todas as dependências necessárias'
      );
      this.log('❌ package.json NÃO ENCONTRADO!', 'red');
      return;
    }

    const packageContent = this.readFile(packageFile);
    const packageData = JSON.parse(packageContent);
    
    let packageProblems = 0;

    // Verificar type: module
    if (packageData.type !== 'module') {
      packageProblems++;
      this.addIssue(
        'PACKAGE_TYPE_MODULE',
        'CRÍTICO',
        'package.json não está configurado para ES Modules',
        packageFile,
        'Adicionar: "type": "module" no package.json'
      );
      this.log('❌ Não está configurado para ES Modules!', 'red');
    }

    // Verificar scripts importantes
    const requiredScripts = ['dev', 'build', 'start', 'preview'];
    for (const script of requiredScripts) {
      if (!packageData.scripts || !packageData.scripts[script]) {
        packageProblems++;
        this.addIssue(
          'PACKAGE_SCRIPT_FALTANDO',
          'MÉDIO',
          `Script "${script}" não encontrado no package.json`,
          packageFile,
          `Adicionar script "${script}" no package.json`
        );
        this.log(`⚠️  Script "${script}" não encontrado`, 'yellow');
      }
    }

    // Verificar dependências críticas
    const requiredDeps = [
      'react', 'react-dom', 'react-router-dom', 
      'vite', '@vitejs/plugin-react',
      'axios', 'framer-motion'
    ];
    
    for (const dep of requiredDeps) {
      const hasInDeps = packageData.dependencies && packageData.dependencies[dep];
      const hasInDevDeps = packageData.devDependencies && packageData.devDependencies[dep];
      
      if (!hasInDeps && !hasInDevDeps) {
        packageProblems++;
        this.addIssue(
          'PACKAGE_DEP_FALTANDO',
          'CRÍTICO',
          `Dependência "${dep}" não encontrada`,
          packageFile,
          `Instalar dependência: npm install ${dep}`
        );
        this.log(`❌ Dependência "${dep}" não encontrada!`, 'red');
      }
    }

    if (packageProblems === 0) {
      this.log('✅ package.json está configurado corretamente', 'green');
    } else {
      this.log(`\n⚠️  ${packageProblems} PROBLEMAS NO PACKAGE.JSON!`, 'yellow');
    }
  }

  // 6. VERIFICAR PROBLEMA DO BCRYPT (do log de erro)
  async checkBcryptError() {
    this.logHeader('VERIFICANDO PROBLEMA DO BCRYPT (Deploy Error)');

    const serverFiles = [
      'server/index.js',
      'server/database.js',
      'package.json'
    ];

    let bcryptProblems = 0;

    // Verificar se arquivos do servidor existem
    for (const file of serverFiles) {
      if (!this.fileExists(file)) {
        bcryptProblems++;
        this.addIssue(
          'SERVER_FILE_FALTANDO',
          'CRÍTICO',
          `Arquivo do servidor não encontrado: ${file}`,
          file,
          `Criar arquivo ${file} necessário para o backend funcionar`
        );
        this.log(`❌ Arquivo do servidor faltando: ${file}`, 'red');
      }
    }

    // Verificar problema específico do bcrypt
    const databaseContent = this.readFile('server/database.js');
    if (databaseContent) {
      if (databaseContent.includes('bcrypt.hash') && !databaseContent.includes('import bcrypt')) {
        bcryptProblems++;
        this.addIssue(
          'BCRYPT_IMPORT_ERROR',
          'CRÍTICO',
          'bcrypt não está sendo importado corretamente no ES Modules',
          'server/database.js',
          'Corrigir import: import bcrypt from "bcryptjs" (ao invés de bcrypt)'
        );
        this.log('❌ bcrypt não importado corretamente - causando erro no deploy!', 'red');
      }

      if (databaseContent.includes('require(')) {
        bcryptProblems++;
        this.addIssue(
          'COMMONJS_IN_MODULES',
          'CRÍTICO',
          'Usando require() em ES Modules',
          'server/database.js',
          'Trocar require() por import em todos os arquivos do servidor'
        );
        this.log('❌ Usando require() em ES Modules!', 'red');
      }
    }

    if (bcryptProblems === 0) {
      this.log('✅ Configuração do servidor parece OK', 'green');
    } else {
      this.log(`\n⚠️  ${bcryptProblems} PROBLEMAS DO SERVIDOR ENCONTRADOS!`, 'yellow');
    }
  }

  // ==================== RELATÓRIO FINAL ====================

  async generateReport() {
    this.logHeader('RELATÓRIO FINAL DE DIAGNÓSTICO - PARTE 01');

    // Resumo dos problemas
    console.log(`${colors.bg.red}${colors.white} PROBLEMAS CRÍTICOS ENCONTRADOS: ${this.criticalIssues.length} ${colors.reset}`);
    console.log(`${colors.bg.yellow}${colors.white} TOTAL DE PROBLEMAS: ${this.issues.length} ${colors.reset}\n`);

    // Categorizar problemas
    const categories = {
      'ROTAS': this.issues.filter(i => i.category.includes('ROTA')),
      'VERIFICAÇÃO DE IDADE': this.issues.filter(i => i.category.includes('IDADE')),
      'ARQUIVOS FALTANDO': this.issues.filter(i => i.category.includes('ARQUIVO')),
      'CONFIGURAÇÃO': this.issues.filter(i => i.category.includes('VITE') || i.category.includes('PACKAGE')),
      'SERVIDOR/BCRYPT': this.issues.filter(i => i.category.includes('SERVER') || i.category.includes('BCRYPT'))
    };

    // Exibir problemas por categoria
    for (const [category, problems] of Object.entries(categories)) {
      if (problems.length > 0) {
        console.log(`${colors.cyan}${colors.bright}📂 ${category} (${problems.length} problemas):${colors.reset}`);
        
        problems.forEach((problem, index) => {
          const severity = problem.severity === 'CRÍTICO' ? 
            `${colors.bg.red}${colors.white} CRÍTICO ${colors.reset}` :
            `${colors.bg.yellow}${colors.white} MÉDIO ${colors.reset}`;
          
          console.log(`\n${index + 1}. ${severity}`);
          console.log(`   📄 Arquivo: ${colors.yellow}${problem.file}${colors.reset}`);
          console.log(`   🐛 Problema: ${problem.description}`);
          console.log(`   💡 Solução: ${colors.green}${problem.solution}${colors.reset}`);
        });
        console.log('');
      }
    }

    // Prioridades de correção
    console.log(`${colors.magenta}${colors.bright}🎯 PRIORIDADES DE CORREÇÃO:${colors.reset}\n`);
    
    console.log(`${colors.red}1. CRÍTICO - Corrigir problemas de rotas${colors.reset}`);
    console.log(`   → Verificar App.jsx e imports das páginas`);
    console.log(`   → Corrigir configuração do Vite`);
    
    console.log(`\n${colors.yellow}2. IMPORTANTE - Sistema de verificação de idade${colors.reset}`);
    console.log(`   → Implementar localStorage para persistir verificação`);
    console.log(`   → Evitar verificação repetida entre páginas`);
    
    console.log(`\n${colors.blue}3. SERVIDOR - Corrigir erro do bcrypt${colors.reset}`);
    console.log(`   → Trocar require() por import`);
    console.log(`   → Usar bcryptjs ao invés de bcrypt`);

    // Arquivos para verificar/criar
    if (this.missingFiles.length > 0) {
      console.log(`\n${colors.cyan}${colors.bright}📋 ARQUIVOS PARA CRIAR/VERIFICAR:${colors.reset}`);
      this.missingFiles.forEach(file => {
        console.log(`   • ${file}`);
      });
    }

    console.log(`\n${colors.green}${colors.bright}✨ Após corrigir estes problemas, suas rotas deverão funcionar!${colors.reset}`);
  }

  // ==================== EXECUÇÃO PRINCIPAL ====================

  async run() {
    console.clear();
    console.log(`${colors.magenta}${colors.bright}
╔══════════════════════════════════════════════════════════════╗
║              🔍 DIAGNÓSTICO PORTAL X BRASIL                  ║
║                    PARTE 01 - ROTAS                         ║
╚══════════════════════════════════════════════════════════════╝
${colors.reset}`);

    try {
      await this.checkFileStructure();
      await this.checkRouteConfiguration();
      await this.checkAgeVerification();
      await this.checkViteConfiguration();
      await this.checkPackageJson();
      await this.checkBcryptError();
      await this.generateReport();
      
      console.log(`\n${colors.green}${colors.bright}🎉 DIAGNÓSTICO CONCLUÍDO!${colors.reset}`);
      console.log(`${colors.cyan}Agora você tem um mapa completo dos problemas para corrigir.${colors.reset}\n`);
      
    } catch (error) {
      console.error(`${colors.red}❌ Erro durante diagnóstico: ${error.message}${colors.reset}`);
    }
  }
}

// Executar diagnóstico
const diagnostic = new PortalDiagnostic();
diagnostic.run();