/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Roboto"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Kobie brand palette
        ink: '#051C2C',       // Deep navy (primary bg)
        panel: '#092538',     // Slightly lighter navy
        panel2: '#0D2E45',    // Card bg
        line: '#1A3F5C',      // Borders
        mut: '#7EBEC5',       // Muted teal (matches Kobie teal)
        fg: '#FFFFFF',        // White text
        beacon: '#FD7F4F',    // Kobie coral/orange (primary CTA)
        crit: '#FF5C5C',      // Red for errors
        warn: '#FD7F4F',      // Orange for warnings (reuse coral)
        info: '#7EBEC5',      // Teal for info
        ok: '#15c586',        // Kobie green
        navy: '#304F7E',      // Secondary blue
      },
    },
  },
  plugins: [],
};
