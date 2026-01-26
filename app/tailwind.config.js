/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
        extend: {
            colors: {
                aura: {
                    black: '#050505',
                    cyan: '#00F0FF',
                    purple: '#7000FF',
                    green: '#00FF94',
                    gold: '#FFD600',
                    red: '#FF2E2E',
                    blue: '#2E8FFF',
                    orange: '#FF8C00',
                }
            }
        },
    },
    plugins: [],
}
