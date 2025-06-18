/**
 * Script para ativar o modo de desenvolvimento
 * Este script configura o localStorage para simular autenticação
 * e permitir testes sem conexão com o backend.
 * 
 * Como usar:
 * 1. Abra o console do navegador (F12)
 * 2. Copie e cole todo este script
 * 3. Pressione Enter para executar
 */

(function() {
  console.log('=== ATIVANDO MODO DE DESENVOLVIMENTO ===');
  
  // Bypass de autenticação
  const userObject = {
    id: 'dev-123',
    name: 'Usuário Teste',
    email: 'teste@exemplo.com',
    status: 'active',
    role: 'user'
  };
  
  // Salvar no localStorage
  localStorage.setItem('dev_user', JSON.stringify(userObject));
  localStorage.setItem('dev_bypass_auth', 'true');
  localStorage.setItem('dev_user_role', 'user');
  
  // Bypass de código de acesso
  localStorage.setItem('dev_bypass_code', 'true');
  localStorage.setItem('dev_code_type', 'user');
  localStorage.setItem('userCodeVerified', 'true');
  localStorage.setItem('adminCodeVerified', 'true');
  
  console.log('✅ Modo de desenvolvimento ATIVADO!');
  console.log('✅ Você está simulando um usuário comum.');
  console.log('');
  console.log('Para mudar para admin, execute:');
  console.log('localStorage.setItem("dev_user_role", "admin")');
  console.log('');
  console.log('Para desativar o modo de desenvolvimento:');
  console.log('localStorage.removeItem("dev_bypass_auth")');
  console.log('localStorage.removeItem("dev_bypass_code")');
  
  // Verificar status
  console.log('');
  console.log('Status atual:');
  console.log('- dev_bypass_auth:', localStorage.getItem('dev_bypass_auth'));
  console.log('- dev_bypass_code:', localStorage.getItem('dev_bypass_code'));
  console.log('- dev_user_role:', localStorage.getItem('dev_user_role'));
  
  // Recarregar página para aplicar alterações
  if (confirm('Configuração concluída! Deseja recarregar a página para aplicar as alterações?')) {
    window.location.reload();
  }
})(); 