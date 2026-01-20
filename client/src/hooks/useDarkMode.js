// client/src/hooks/useDarkMode.js
// Custom hook for dark mode management with localStorage persistence
import { useState, useEffect } from 'react';

export function useDarkMode() {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        // Check localStorage first
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        // Fall back to system preference
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });

    useEffect(() => {
        // Update localStorage when dark mode changes
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));

        // Update the DOM
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    // Listen for system preference changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            // Only auto-switch if user hasn't explicitly set a preference
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
