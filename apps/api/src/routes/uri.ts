import { FastifyInstance } from 'fastify';
import { validateUriJson } from '@zerafile/shared';
import { putObject } from '../lib/s3';
import { config } from '../config';

const uriSchema = {
  body: {
    type: 'object',
    required: ['contractId', 'json'],
    properties: {
      contractId: { type: 'string' },
      json: { type: 'object' },
    },
  },
};

export async function uriRoutes(fastify: FastifyInstance) {
  // POST /v1/uri
  fastify.post('/v1/uri', {
    schema: uriSchema,
    config: {
      rateLimit: {
        max: 10,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { contractId, json } = request.body as { contractId: string; json: unknown };

    try {
      // Validate JSON schema
      const validatedJson = validateUriJson(json);
      
      // Encode contractId for safe storage
      const encodedContractId = encodeURIComponent(contractId);
      const key = `token/${encodedContractId}/uri.json`;
      
      // Store JSON with proper headers
      await putObject(
        key,
        JSON.stringify(validatedJson, null, 2),
        'application/json; charset=utf-8',
        'public, max-age=31536000, immutable'
      );

      const cdnUrl = `${config.CDN_BASE_URL}/token/${encodedContractId}/uri.json`;

      return { cdnUrl };
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return reply.code(400).send({ 
          error: 'Invalid JSON schema',
          details: error.message,
        });
      }
      
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to store URI JSON' });
    }
  });
}
