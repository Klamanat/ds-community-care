import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import https from 'https'
import http from 'http'

/**
 * Vite dev middleware that proxies /api → GAS, following redirects server-side.
 * Vite's built-in proxy passes 302 back to the browser which causes CORS issues.
 * This middleware uses Node's http/https to follow the GAS redirect chain directly.
 */
function gasProxyPlugin(gasUrl) {
  return {
    name: 'gas-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api', (req, res) => {
        const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
        const chunks = []
        req.on('data', c => chunks.push(c))
        req.on('end', () => {
          const body = chunks.length ? Buffer.concat(chunks) : null

          function forward(url, method, reqBody) {
            const u = new URL(url)
            const mod = u.protocol === 'https:' ? https : http
            const nodeReq = mod.request(
              { hostname: u.hostname, path: u.pathname + u.search, method,
                headers: reqBody ? { 'content-length': reqBody.length } : {} },
              (nodeRes) => {
                // Follow GAS redirect (302 → script.googleusercontent.com)
                if (nodeRes.statusCode >= 300 && nodeRes.statusCode < 400 && nodeRes.headers.location) {
                  nodeRes.resume()
                  forward(nodeRes.headers.location, 'GET', null)
                  return
                }
                const parts = []
                nodeRes.on('data', c => parts.push(c))
                nodeRes.on('end', () => {
                  const out = Buffer.concat(parts)
                  res.writeHead(nodeRes.statusCode, { 'content-type': 'application/json' })
                  res.end(out)
                })
              }
            )
            nodeReq.on('error', e => {
              res.writeHead(502)
              res.end(JSON.stringify({ ok: false, error: e.message }))
            })
            if (reqBody) nodeReq.write(reqBody)
            nodeReq.end()
          }

          forward(gasUrl + qs, req.method, body)
        })
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const gasUrl = env.VITE_GAS_URL || ''

  return {
    plugins: [vue(), ...(gasUrl ? [gasProxyPlugin(gasUrl)] : [])],
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') }
    },
  }
})
