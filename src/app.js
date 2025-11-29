import http from 'http';
import { createApp } from './routes.js';

function createServer() {
  const app = createApp();
  return http.createServer(app);
}

if (process.argv[1] && process.argv[1].includes('app.js')) {
  const server = createServer();
  const port = process.env.PORT || 3000;
  server.listen(port, () => console.log(`Server listening on port ${port}`));
}

export { createServer };
