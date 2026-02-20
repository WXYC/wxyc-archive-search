import { serve } from '@hono/node-server';
import { app } from './app.js';

const port = parseInt(process.env.PORT || '3000', 10);

console.log(`Starting WXYC Archive Search service on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

export { app };
