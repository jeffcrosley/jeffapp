// apps/api-gateway/src/main.ts

import express from 'express';

const app = express();
const port = process.env.PORT || 3333; // Render will set process.env.PORT

// --- Health Check / Core Route ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'API Gateway' });
});

// --- API Route Proxy (Initial Setup for First Sub-App) ---
// When the first sub-app (e.g., a Go To-Do service) is ready, we'll uncomment this.
/*
app.use(
  '/api/todo',
  createProxyMiddleware({
    // NOTE: This target will change to the URL of your actual deployed sub-service (e.g., https://my-todo-service.onrender.com)
    target: 'http://localhost:3001', // Local dummy target
    changeOrigin: true,
    pathRewrite: { '^/api/todo': '' }, // Removes the /api/todo prefix before forwarding
  })
);
*/

app.listen(port, () => {
  console.log(`\n🚀 API Gateway is running on port ${port}`);
  console.log(`Access the health check at http://localhost:${port}/health`);
});
