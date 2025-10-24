import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { uploadRoutes } from './routes/uploads';
import { uriRoutes } from './routes/uri';
import { config } from './config';

const fastify = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  },
});

// Start server
const start = async () => {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: [
        'https://zerafile.io',
        'https://api.zerafile.io',
        'http://localhost:3000', // For local development
      ],
      methods: ['GET', 'HEAD', 'POST', 'PUT'],
      exposedHeaders: ['ETag'],
    });

    // Register rate limiting
    await fastify.register(rateLimit, {
      global: false, // We'll configure per-route
    });

    // Register routes
    await fastify.register(uploadRoutes);
    await fastify.register(uriRoutes);

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    await fastify.listen({ 
      port: config.PORT, 
      host: '0.0.0.0' 
    });
    console.log(`🚀 API server running on port ${config.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
