import { useEffect } from "react";

/**
 * Updates the document title dynamically.
 * Appends " | מערכת בוגרים" to the title.
 * @param title The title to set for the current page
 */
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${title} | מערכת בוגרים`;

    return () => {
      document.title = prevTitle;
    };
  }, [title]);
}
