import { useEffect } from 'react';

/**
 * Custom hook to set the page title dynamically
 * @param title - The page title (e.g., "Dashboard", "Stock")
 * @param baseTitle - Optional base title (defaults to "EXELK Inventory")
 */
export function usePageTitle(title: string, baseTitle: string = "EXELK Inventory") {
  // Set title immediately (synchronously) to prevent flash of default title
  if (typeof document !== 'undefined') {
    const fullTitle = title ? `${title} - ${baseTitle}` : baseTitle;
    document.title = fullTitle;
  }

  // Also set in useEffect to handle client-side navigation
  useEffect(() => {
    const fullTitle = title ? `${baseTitle} - ${title}` : baseTitle;
    document.title = fullTitle;

    // Cleanup: reset to default title when component unmounts
    return () => {
      document.title = baseTitle;
    };
  }, [title, baseTitle]);
}