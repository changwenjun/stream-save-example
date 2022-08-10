import {defineConfig} from 'vite'
import vue from '@vitejs/plugin-vue'
// @ts-ignore
import html from '@rollup/plugin-html'
import copy from 'rollup-plugin-copy'
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [vue()],
    server: {
        cors: true,
        // https: true,
        proxy: {
            // 使用 proxy 实例
            '/api': {
                target: 'http://localhost:8000',
            }
        }
    },
    build:{
        rollupOptions:{
            plugins: [
                html(),
                copy({
                    targets: [
                        { src: 'public/sw.js', dest: 'dist' },
                    ]
                })
            ],
            input: {
                'index': './src/utils/index.ts'
            },
            output: {
                entryFileNames: '[name].js',
                manualChunks:{}
            }
        }
    }
})
