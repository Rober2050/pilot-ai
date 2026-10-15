import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * Opens the Supabase connection (auth + API) before the JS bundle asks for it.
 * Injected only when VITE_SUPABASE_URL is set: a literal %VITE_...% placeholder
 * in index.html breaks the build wherever the variable is missing (CI, a fresh
 * clone). The value is trimmed because the deploy panel once stored it with a
 * trailing space.
 */
function supabasePreconnect(): Plugin {
    let origin = ''
    return {
        name: 'supabase-preconnect',
        configResolved(config) {
            const raw = String(config.env.VITE_SUPABASE_URL ?? '').trim().replace(/\/+$/, '')
            try { origin = raw ? new URL(raw).origin : '' } catch { origin = '' }
        },
        transformIndexHtml() {
            if (!origin) return []
            return [
                { tag: 'link', attrs: { rel: 'preconnect', href: origin, crossorigin: '' }, injectTo: 'head' },
                { tag: 'link', attrs: { rel: 'dns-prefetch', href: origin }, injectTo: 'head' },
            ]
        },
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'vendor-react':    ['react', 'react-dom', 'react-router-dom'],
                    'vendor-supabase': ['@supabase/supabase-js'],
                    'vendor-ui':       ['framer-motion', 'lucide-react'],
                    // recharts and the export libraries (docx, xlsx, jspdf, html-to-image)
                    // are deliberately NOT forced into named chunks: Rollup would also put
                    // the small helpers they share with the entry in there, and the landing
                    // page then preloaded ~2 MB it never uses. Left alone, they stay in the
                    // lazy dashboard / export chunks that need them.
                    'vendor-i18n':     ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
                },
            },
        },
    },
    plugins: [
        react(),
        supabasePreconnect(),
        {
            name: 'tour-saver-middleware',
            configureServer(server) {
                server.middlewares.use('/__api/save-tour', async (req, res, next) => {
                    if (req.method === 'POST') {
                        let body = '';
                        req.on('data', chunk => body += chunk);
                        req.on('end', async () => {
                            try {
                                const { filename, content, configName } = JSON.parse(body);
                                const fs = await import('fs');
                                const path = await import('path');
                                const toursDir = path.resolve(__dirname, 'src/data/tours');
                                const filePath = path.join(toursDir, filename);
                                const indexPath = path.join(toursDir, 'index.ts');

                                // 1. Save the tour file
                                fs.writeFileSync(filePath, content, 'utf-8');

                                // 2. Update index.ts if needed
                                let indexContent = fs.readFileSync(indexPath, 'utf-8');

                                // Regex to check if the export already exists (handling variable whitespace)
                                const exportRegex = new RegExp(`export\\s+\\{\\s*${configName}\\s*\\}`, 'g');

                                if (!exportRegex.test(indexContent)) {
                                    const exportStatement = `export { ${configName} } from './${filename.replace('.ts', '')}';`;

                                    // Append to the end, before the last comment or just at the end
                                    // Simple append for robustness
                                    indexContent = indexContent.trim() + `\n${exportStatement}\n`;
                                    fs.writeFileSync(indexPath, indexContent, 'utf-8');
                                }

                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: true, message: 'Tour saved and registered successfully' }));
                            } catch (error) {
                                console.error('Error saving tour:', error);
                                res.statusCode = 500;
                                res.setHeader('Content-Type', 'application/json');
                                res.end(JSON.stringify({ success: false, error: String(error) }));
                            }
                        });
                    } else {
                        next();
                    }
                });
            }
        }
    ],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
