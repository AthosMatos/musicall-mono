import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    conditions: ["source"],
    // Force a single React copy so bundled workspace packages (e.g. @monorepo/ui)
    // don't resolve their own nested React (the mobile app pins React 18, web uses 19).
    dedupe: ["react", "react-dom"],
    alias: [
      {
        find: /^@constants\/(.*)$/,
        replacement: path.resolve(__dirname, '../../consts/$1'),
      },
    ],
  },
  plugins: [tailwindcss(), react(), babel({ presets: [reactCompilerPreset()] })],
})
