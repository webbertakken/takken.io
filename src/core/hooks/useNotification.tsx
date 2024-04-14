import toast from 'react-hot-toast'

/**
 * Requires <Toaster /> to be included in the root of the app.
 */
export function useNotification() {
  return {
    success: toast.success,
    error: toast.error,
    loading: toast.loading,
    promise: toast.promise,
  }
}
