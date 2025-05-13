
// Vercel API router entry point
import healthHandler from './health.js';

export default async function handler(req, res) {
  const url = new URL(req.url, `https://${req.headers.host}`);
  const pathname = url.pathname;
  
  // Route to appropriate handler based on path
  if (pathname === '/api/health') {
    return healthHandler(req, res);
  }
  
  // Default response for unknown API routes
  return res.status(404).json({
    error: "API route not found"
  });
}
