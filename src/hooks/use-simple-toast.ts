// Simple toast replacement to avoid TypeScript errors
export function useToast() {
  return {
    toast: (options: { title?: string; description?: string; variant?: string }) => {
      // TODO: Implement actual toast functionality
      // For now, silently handle toast calls
      void options;
    }
  };
}
