import React, { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import './Modal.css'

/**
 * Componente Modal - A Janela Mágica Universal
 * 
 * Pense no Modal como um "palco" que aparece sobre tudo:
 * - Pode mostrar qualquer coisa dentro
 * - Tem animações suaves de entrada/saída
 * - Fecha ao clicar fora ou no X
 * - Super flexível e reutilizável
 * 
 * É como um canivete suíço da interface! 🔧
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // small, medium, large, fullscreen
  variant = 'default', // default, success, error, warning, info
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  className = '',
  actions, // Array de botões para o rodapé
  icon,
  loading = false
}) => {
  const modalRef = useRef(null)

  // Fecha com ESC
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, closeOnEscape, onClose])

  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Ícones padrão para cada variante
  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle size={24} className="icon-success" />
      case 'error':
        return <AlertCircle size={24} className="icon-error" />
      case 'warning':
        return <AlertTriangle size={24} className="icon-warning" />
      case 'info':
        return <Info size={24} className="icon-info" />
      default:
        return null
    }
  }

  // Animações do modal
  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.95,
      y: 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.95,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  }

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="modal-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={closeOnOverlayClick ? onClose : undefined}
        >
          <motion.div 
            ref={modalRef}
            className={`modal modal--${size} modal--${variant} ${className}`}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal */}
            {(title || showCloseButton) && (
              <div className="modal__header">
                {(icon || getDefaultIcon()) && (
                  <div className="modal__icon">
                    {icon || getDefaultIcon()}
                  </div>
                )}
                
                {title && (
                  <h2 className="modal__title">{title}</h2>
                )}
                
                {showCloseButton && (
                  <button 
                    className="modal__close"
                    onClick={onClose}
                    aria-label="Fechar modal"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            )}

            {/* Conteúdo do Modal */}
            <div className="modal__content">
              {loading ? (
                <div className="modal__loading">
                  <div className="spinner" />
                  <p>Carregando...</p>
                </div>
              ) : (
                children
              )}
            </div>

            {/* Rodapé com ações */}
            {actions && actions.length > 0 && (
              <div className="modal__footer">
                {actions.map((action, index) => (
                  <motion.button
                    key={index}
                    className={`modal__action modal__action--${action.variant || 'default'}`}
                    onClick={action.onClick}
                    disabled={action.disabled || loading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {action.icon && <span className="action-icon">{action.icon}</span>}
                    {action.label}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Modal de confirmação rápida
export const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmar ação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      variant={variant}
      actions={[
        {
          label: cancelLabel,
          onClick: onClose,
          variant: 'secondary'
        },
        {
          label: confirmLabel,
          onClick: () => {
            onConfirm()
            onClose()
          },
          variant: variant === 'error' ? 'danger' : 'primary'
        }
      ]}
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  )
}

// Modal de alerta simples
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      variant={variant}
      actions={[
        {
          label: 'OK',
          onClick: onClose,
          variant: 'primary'
        }
      ]}
    >
      <p className="alert-message">{message}</p>
    </Modal>
  )
}

// Modal de formulário para cadastrar canal
export const ChannelFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  channel = null // Para edição
}) => {
  const [formData, setFormData] = React.useState({
    name: channel?.name || '',
    link: channel?.telegram_link || '',
    category: channel?.category || '',
    state: channel?.state || '',
    description: channel?.description || '',
    image: null
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={channel ? 'Editar Canal/Grupo' : '+ Cadastrar Canal/Grupo'}
      size="medium"
      actions={[
        {
          label: 'Cancelar',
          onClick: onClose,
          variant: 'secondary'
        },
        {
          label: channel ? 'Salvar' : 'Cadastrar',
          onClick: handleSubmit,
          variant: 'primary',
          icon: channel ? <CheckCircle size={18} /> : null
        }
      ]}
    >
      <form className="channel-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Nome do Canal/Grupo *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ex: Vazou Famosas BR"
            required
          />
        </div>

        <div className="form-group">
          <label>Link do Telegram *</label>
          <input
            type="url"
            value={formData.link}
            onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            placeholder="https://t.me/seucanal"
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Categoria *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Selecione</option>
              <option value="amadoras">Amadoras</option>
              <option value="famosas">Famosas</option>
              <option value="vazadas">Vazadas</option>
              <option value="cornos">Cornos</option>
              <option value="universitarias">Universitárias</option>
            </select>
          </div>

          <div className="form-group">
            <label>Estado (Opcional)</label>
            <select
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            >
              <option value="">Todos</option>
              <option value="SP">São Paulo</option>
              <option value="RJ">Rio de Janeiro</option>
              <option value="MG">Minas Gerais</option>
              {/* Adicione outros estados */}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Descrição</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descreva o canal ou grupo..."
            rows={3}
          />
        </div>

        <div className="form-group">
          <label>Imagem (Opcional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
          />
          <small>A imagem será exibida nos cards. Se não enviar, usaremos a do Telegram.</small>
        </div>
      </form>
    </Modal>
  )
}

export default Modal
