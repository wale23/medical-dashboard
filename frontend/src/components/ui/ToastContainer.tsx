import { useState, useEffect, useCallback } from 'react';
import Toast from './Toast';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error';
}

let toastId = 0;
const toastListeners: Array<(toasts: ToastMessage[]) => void> = [];
let toasts: ToastMessage[] = [];

const notify = (message: string, type: 'success' | 'error') => {
  const id = `toast-${toastId++}`;
  const newToast: ToastMessage = { id, message, type };
  toasts = [...toasts, newToast];
  toastListeners.forEach((listener) => listener(toasts));
};

const removeToast = (id: string) => {
  toasts = toasts.filter((toast) => toast.id !== id);
  toastListeners.forEach((listener) => listener(toasts));
};

export const showSuccessToast = (message: string) => {
  notify(message, 'success');
};

export const showErrorToast = (message: string) => {
  notify(message, 'error');
};

const ToastContainer = () => {
  const [toastList, setToastList] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleToastChange = (newToasts: ToastMessage[]) => {
      setToastList(newToasts);
    };

    toastListeners.push(handleToastChange);
    setToastList(toasts);

    return () => {
      const index = toastListeners.indexOf(handleToastChange);
      if (index > -1) {
        toastListeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toastList.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>
  );
};

export default ToastContainer;

