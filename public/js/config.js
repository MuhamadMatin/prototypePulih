tailwind.config = {
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#13ec37",
                "primary-hover": "#0fb82b",
                "primary-dark": "#0fb82b",
                "primary-soft": "#e0fbe5",
                "background-light": "#f8fcf9",
                "background-dark": "#0a160c",
                "surface-light": "#ffffff",
                "surface-dark": "#162e1b",
                "border-light": "#e0ebe2",
                "border-dark": "#2a4d31",
                "text-main": "#1a2e1e",
                "text-muted": "#6b7c70",
                "accent-leaf": "#86efac",
            },
            fontFamily: {
                "display": ["Lexend", "sans-serif"],
                "body": ["Lexend", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.5rem", "lg": "1rem", "xl": "1.5rem", "2xl": "2rem", "3xl": "2.5rem", "full": "9999px" },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(19, 236, 55, 0.1)',
                'glow': '0 0 15px rgba(19, 236, 55, 0.3)',
                'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
            },
            animation: {
                'fade-in': 'fadeIn 1s ease-out forwards',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
                'slide-up': 'slideUp 0.8s ease-out forwards',
                'float': 'float 6s ease-in-out infinite',
                'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideUp: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                pulseSoft: {
                    '0%, 100%': { opacity: '0.6' },
                    '50%': { opacity: '0.8' },
                }
            },
            backgroundImage: {
                'pattern-leaf': "url('https://api.iconify.design/heroicons:sparkles-solid.svg?color=%2313ec37&opacity=0.1')",
                'soft-gradient': 'linear-gradient(135deg, #f0fdf4 0%, #fff 100%)',
            }
        },
    },
};

// Theme Logic
(function () {
    if (typeof window === 'undefined') return;

    const getSavedTheme = () => localStorage.getItem('theme');
    const saveTheme = (theme) => localStorage.setItem('theme', theme);

    const applyTheme = (isDark) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    // Initialize
    const savedTheme = getSavedTheme();
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
        applyTheme(true);
    } else {
        applyTheme(false);
    }

    // System Sync (only if no manual preference)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (!getSavedTheme()) {
            applyTheme(event.matches);
        }
    });

    // Global Toggle Function
    window.toggleTheme = () => {
        const isDark = document.documentElement.classList.contains('dark');
        const newTheme = !isDark ? 'dark' : 'light';
        applyTheme(!isDark);
        saveTheme(newTheme);
    };
})();
