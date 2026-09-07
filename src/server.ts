import 'dotenv/config';

import app from "./app";

const PORT = Number(process.env.PORT) || 5001;
const HOST = process.env.HOST || '127.0.0.1';

const server = app.listen(PORT, HOST, () => {
  console.log(`Cultiva API running at http://${HOST}:${PORT}`);
});

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Change PORT in .env and restart.`);
  } else {
    console.error('Unable to start the Cultiva API:', error.message);
  }
  process.exit(1);
});