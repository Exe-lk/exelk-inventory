'use client';
import React from 'react';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  warningMessage?: string;
  confirmButtonText?: string;
  cancelButtonText?: string;
  loading?: boolean;
  itemName?: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Delete a Category",
  message = "Are you sure you want to delete that Category ?",
  warningMessage = "By Deleting this, automatically cancel the related fields.",
  confirmButtonText = "Yes, Delete",
  cancelButtonText = "No, Cancel",
  loading = false,
  itemName
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!loading) {
      onConfirm();
    }
  };

  const handleCancel = () => {
    if (!loading) {
      onClose();
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  // Handle ESC key
  React.useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, loading, onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-md transform transition-all">
          <div className="relative rounded-lg shadow-xl" style={{ backgroundColor: '#E2EEFF' }}>
            {/* Close button */}
            <button
              onClick={handleCancel}
              disabled={loading}
              className="absolute right-4 top-4 z-10 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Content */}
            <div className="p-8">
              {/* Title */}
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {title}
                </h3>
                <p className="text-lg text-gray-800 font-medium">
                  {itemName ? message.replace('that Category', `"${itemName}"`) : message}
                </p>
              </div>

              {/* Warning Section */}
              <div 
                className="rounded-lg p-4 mb-8"
                style={{ backgroundColor: '#FFF3EB' }}
              >
                <div className="flex items-start">
                  {/* Warning Triangle Icon */}
                  <div className="flex-shrink-0 mr-3">
                    <svg 
                      className="w-5 h-5 mt-0.5" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                      style={{ color: '#771505' }}
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </div>
                  
                  {/* Warning Content */}
                  <div className="flex-1">
                    <h4 
                      className="text-lg font-semibold mb-2"
                      style={{ color: '#771505' }}
                    >
                      Warning
                    </h4>
                    <p 
                      className="text-sm leading-relaxed"
                      style={{ color: '#BC4C2E' }}
                    >
                      {warningMessage}
                    </p>
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex justify-center space-x-4">
                {/* Cancel Button */}
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cancelButtonText}
                </button>

                {/* Delete Button */}
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading && (
                    <svg 
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24"
                    >
                      <circle 
                        className="opacity-25" 
                        cx="12" 
                        cy="12" 
                        r="10" 
                        stroke="currentColor" 
                        strokeWidth="4"
                      />
                      <path 
                        className="opacity-75" 
                        fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                  )}
                  {loading ? 'Deleting...' : confirmButtonText}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;