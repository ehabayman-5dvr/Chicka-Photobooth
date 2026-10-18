import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Sync loaded environment variables to process.env for local serverless execution
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      {
        name: 'local-api-generate-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/generate' && req.method === 'POST') {
              let rawBody = '';
              req.on('data', (chunk) => {
                rawBody += chunk;
              });
              req.on('end', async () => {
                let parsedBody = {};
                try {
                  parsedBody = rawBody ? JSON.parse(rawBody) : {};
                } catch {
                  parsedBody = {};
                }

                (req as any).body = parsedBody;

                const resAdapter = {
                  setHeader: (key: string, val: string) => res.setHeader(key, val),
                  status: (code: number) => {
                    res.statusCode = code;
                    return {
                      json: (data: any) => {
                        res.setHeader('Content-Type', 'application/json');
                        res.end(JSON.stringify(data));
                      },
                      end: () => res.end(),
                    };
                  },
                };

                try {
                  const { default: handler } = await import('./api/generate.js');
                  await handler(req, resAdapter);
                } catch (err: any) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: err.message || 'Local API handler failure' }));
                }
              });
            } else {
              next();
            }
          });
        },
      },
    ],
    server: {
      port: 3000,
      host: true,
    },
    build: {
      target: 'es2020',
    },
  };
});

