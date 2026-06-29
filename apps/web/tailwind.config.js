/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui-components/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'gov-blue': '#1d70b8',
        'gov-dark-blue': '#003078',
        'gov-green': '#00703c',
        'gov-red': '#d4351c',
        'gov-yellow': '#ffdd00',
        'gov-black': '#0b0c0c',
        'gov-grey': '#505a5f',
        'gov-light-grey': '#f3f2f1',
      },
      fontFamily: {
        'gov': ['"GDS Transport"', 'arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
