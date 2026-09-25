import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (
                id.includes('react-markdown') ||
                id.includes('unist') ||
                id.includes('micromark') ||
                id.includes('mdast') ||
                id.includes('vfile') ||
                id.includes('remark')
              ) {
                return 'vendor-markdown';
              }
              return 'vendor-core';
            }
            if (
              id.includes('src/components/DocumentAnalyzer') ||
              id.includes('src/components/InteractiveDocumentViewer')
            ) {
              return 'feature-analyzer';
            }
            if (id.includes('src/components/VoiceLiveAssistant')) {
              return 'feature-voice';
            }
            if (id.includes('src/components/GeminiChatbot')) {
              return 'feature-chat';
            }
            if (
              id.includes('src/components/DocumentCompare') ||
              id.includes('src/components/CounterpartySimulator') ||
              id.includes('src/components/ActionPlaybook')
            ) {
              return 'feature-negotiation';
            }
          },
        },
      },
    },
  };
});
