// client/src/hooks/useDarkMode.js
// Custom hook for dark mode management with localStorage persistence and system preference detection.

import { useState, useEffect } from 'react';

/**
 * useDarkMode Hook
 * 
 * Manages the application's theme state (dark/light).
 * 
 * Features:
 * - Persists preference to localStorage ('darkMode' key).
 * - Detects system color scheme preference if no local preference is set.
 * - Updates the DOM by adding/removing the 'dark' class on the document element.
 * 
 * @returns {Object} { isDarkMode, toggleDarkMode }
 */
export function useDarkMode() {
    // Initialize state properly based on storage or system preference
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // 1. Check localStorage first for manual override
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // 2. Fall back to system preference if no manual override
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    // Effect to apply changes to DOM and LocalStorage whenever state changes
    useEffect(() => {
        // Persist current state
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

        // Update Tailwind 'dark' class on the HTML element
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Effect to listen for system preference changes (e.g., OS theme switch)
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Only auto-switch if user hasn't explicitly set a preference in this session's history
            // (Note: This logic relies on the fact that if 'darkMode' is in localstorage, the initial state used that. 
            // Here we check if it's NOT in localstorage to respect system changes only if user hasn't overridden it)
            const saved = localStorage.getItem('darkMode');
            if (saved === null) {
                setIsDarkMode(e.matches);
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    const toggleDarkMode = () => setIsDarkMode(prev => !prev);

    return { isDarkMode, toggleDarkMode };
}

export default useDarkMode;
