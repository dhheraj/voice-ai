import React, { useEffect, useRef } from 'react';
import { Icon } from './Icon';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  danger = false,
  onConfirm,
  onCancel,
}) {
  const confirmRef = useRef(null);

  useEffect(() => {
    if (open) {
      const onKey = (e) => {
        if (e.key === 'Escape') onCancel?.();
        else if (e.key === 'Enter') onConfirm?.();
      };
      document.addEventListener('keydown', onKey);
      setTimeout(() => confirmRef.current?.focus(), 50);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="confirm-scrim" onClick={onCancel}>
      <div className="confirm-dialog" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <div className={`confirm-icon ${danger ? 'confirm-icon-danger' : ''}`}>
          {danger ? <Icon name="trash" size={22} /> : <Icon name="logout" size={22} />}
        </div>
        <h3 className="confirm-title">{title}</h3>
        {message && <p className="confirm-message">{message}</p>}
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onCancel} type="button">
            {cancelText}
          </button>
          <button
            ref={confirmRef}
            className={danger ? 'btn-danger' : 'btn-primary'}
            onClick={onConfirm}
            type="button"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
