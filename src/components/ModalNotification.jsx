import React from 'react';

/**
 * ModalNotification - A premium custom modal dialog replacing native JavaScript alerts.
 * Supports: 'success', 'error', 'warning', 'confirm'.
 */
const ModalNotification = ({ 
  isOpen, 
  type = 'success', 
  title, 
  message, 
  onClose, 
  onConfirm, 
  confirmText = 'Ya, Lanjutkan', 
  cancelText = 'Batal' 
}) => {
  if (!isOpen) return null;

  // Icon mapping based on notification type
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return (
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100 animate-bounce">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case 'error':
        return (
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100 animate-pulse">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case 'warning':
      case 'confirm':
        return (
          <div className="w-16 h-16 bg-yellow-50 rounded-full flex items-center justify-center mb-4 border border-yellow-100">
            <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-[99999] p-4 transition-opacity duration-300">
      <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full mx-auto border border-gray-100 flex flex-col items-center text-center transform scale-100 transition-all duration-300 animate-scale-up">
        
        {renderIcon()}

        <h3 className="text-lg font-bold text-gray-900 leading-6 mb-2">
          {title || (type === 'success' ? 'Berhasil' : type === 'error' ? 'Gagal' : 'Konfirmasi')}
        </h3>

        <p className="text-sm text-gray-500 font-medium mb-6 px-2">
          {message}
        </p>

        <div className="flex w-full gap-3 justify-center">
          {type === 'confirm' ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl border border-gray-200 transition-all duration-200 cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onConfirm) onConfirm();
                  onClose();
                }}
                className="flex-1 px-4 py-2.5 bg-primary hover:opacity-90 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer"
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full max-w-[200px] px-6 py-2.5 bg-primary hover:opacity-90 text-white text-sm font-bold rounded-xl shadow-md transition-all duration-200 cursor-pointer"
            >
              Oke
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalNotification;
