// vite.config.js

import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
	base: '/password-generator-app/',
	build: {
		rollupOptions: {
			output: {
				assetFileNames: 'style.css',
				chunkFileNames: 'vendor/[name].js',
				entryFileNames: 'main.js',
				manualChunks: {
					zxcvbn: ['zxcvbn'],
				},
			},
		},
	},
})