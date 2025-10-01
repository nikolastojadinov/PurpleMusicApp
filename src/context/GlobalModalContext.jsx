import React, { createContext, useCallback, useContext, useState } from 'react';

// Simple global modal system to replace window.alert usages with a styled modal.
// Features:
//  - show(message, options)
//  - type: 'info' | 'error' | 'success' | 'warning'
//  - autoClose ms (optional)
//  - dismiss button

const GlobalModalContext = createContext(null);

export function GlobalModalProvider({ children }) {
  const [modal, setModal] = useState({ visible: false, message: '', type: 'info', autoClose: null, id: 0 });

  const hide = useCallback(() => setModal(m => ({ ...m, visible: false })), []);

  const show = useCallback((message, opts = {}) => {
    const { type = 'info', autoClose = null } = opts;
    const id = Date.now();
    setModal({ visible: true, message, type, autoClose, id });
    if (autoClose) {
      setTimeout(() => {
        setModal(m => (m.id === id ? { ...m, visible: false } : m));
      }, autoClose);
    }
  }, []);

  return (
    <GlobalModalContext.Provider value={{ show, hide }}>
      {children}
      {modal.visible && (
        <div className="global-modal-overlay">
          <div className={`global-modal global-modal-${modal.type}`} role="alertdialog" aria-modal="true">
            <div className="global-modal-body">{modal.message}</div>
            <button className="global-modal-close" onClick={hide}>×</button>
          </div>
        </div>
      )}
    </GlobalModalContext.Provider>
  );
}

export function useGlobalModal() {
  return useContext(GlobalModalContext);
}
