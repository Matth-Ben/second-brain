import typography from '@tailwindcss/typography'

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                dark: {
                    bg: '#0a0a0a',
                    surface: '#141414',
                    border: '#262626',
                    hover: '#1a1a1a',
                }
            }
        },
    },
    plugins: [
        typography,
    ],
}
