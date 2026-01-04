import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: 'var(--bg-primary)',
                    surface: 'var(--bg-surface)',
                    border: 'var(--border-color)',
                    hover: 'var(--bg-hover)',
                    text: 'var(--text-primary)',
                    subtext: 'var(--text-secondary)',
                }
            }
        },
    },
    plugins: [
        typography,
    ],
}
