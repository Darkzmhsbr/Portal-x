/**
 * Middleware centralizado para tratamento de erros
 * Implementa padrão de resposta consistente e logging detalhado
 */

class AppError extends Error {
  constructor(message, statusCode, code = null) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
    Error.captureStackTrace(this, this.constructor)
  }
}

// Mapeamento de erros comuns
const errorMap = {
  ValidationError: 400,
  UnauthorizedError: 401,
  ForbiddenError: 403,
  NotFoundError: 404,
  ConflictError: 409,
  RateLimitError: 429,
  InternalServerError: 500
}

// Factory para criação de erros específicos
export const createError = {
  badRequest: (message = 'Requisição inválida') => 
    new AppError(message, 400, 'BAD_REQUEST'),
  
  unauthorized: (message = 'Não autorizado') => 
    new AppError(message, 401, 'UNAUTHORIZED'),
  
  forbidden: (message = 'Acesso negado') => 
    new AppError(message, 403, 'FORBIDDEN'),
  
  notFound: (message = 'Recurso não encontrado') => 
    new AppError(message, 404, 'NOT_FOUND'),
  
  conflict: (message = 'Conflito de dados') => 
    new AppError(message, 409, 'CONFLICT'),
  
  tooManyRequests: (message = 'Muitas requisições') => 
    new AppError(message, 429, 'RATE_LIMIT'),
  
  internal: (message = 'Erro interno do servidor') => 
    new AppError(message, 500, 'INTERNAL_ERROR')
}

// Função para sanitizar erros em produção
const sanitizeError = (error, isDevelopment) => {
  if (isDevelopment) {
    return {
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details || {}
    }
  }
  
  // Em produção, ocultar detalhes sensíveis
  return {
    message: error.isOperational ? error.message : 'Erro interno do servidor',
    code: error.code || 'INTERNAL_ERROR'
  }
}

// Handler principal de erros
export const errorHandler = (err, req, res, next) => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Log detalhado do erro
  console.error('❌ Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: err.message,
    stack: isDevelopment ? err.stack : undefined
  })
  
  // Determinar status code
  let statusCode = err.statusCode || 500
  
  // Tratar erros específicos do PostgreSQL
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        statusCode = 409
        err.message = 'Registro já existe'
        break
      case '23503': // foreign_key_violation
        statusCode = 400
        err.message = 'Referência inválida'
        break
      case '22P02': // invalid_text_representation
        statusCode = 400
        err.message = 'Formato de dados inválido'
        break
      case 'ECONNREFUSED':
        statusCode = 503
        err.message = 'Serviço temporariamente indisponível'
        break
    }
  }
  
  // Tratar erros de validação
  if (err.name === 'ValidationError') {
    statusCode = 400
    err.message = 'Dados inválidos'
  }
  
  // Resposta estruturada
  res.status(statusCode).json({
    success: false,
    error: sanitizeError(err, isDevelopment),
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  })
}

// Wrapper para funções assíncronas
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Middleware para 404
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Rota não encontrada',
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl
  })
}

export { AppError }