import { FastifyInstance } from 'fastify';
import { validateUriJson, generateFileId } from '@zerafile/shared';
import { putObject } from '../lib/s3';
import { config } from '../config';
import { rateLimiter, formatBytes, formatTimeUntilReset } from '../lib/rate-limiter';

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
  }, async (request, reply) => {
    const { contractId, json } = request.body as { contractId: string; json: unknown };

    try {
      // Validate JSON schema
      const validatedJson = validateUriJson(json);
      
      // Calculate JSON size
      const jsonSize = new Blob([JSON.stringify(validatedJson, null, 2)]).size;
      
      // Check file count rate limit
      const fileLimitCheck = rateLimiter.checkFileLimit(request);
      if (!fileLimitCheck.allowed) {
        return reply.code(429).send({
          error: 'Rate limit exceeded',
          message: `File upload limit exceeded. ${fileLimitCheck.remaining} files remaining. Reset in ${formatTimeUntilReset(fileLimitCheck.resetTime)}`,
          limitType: 'files',
          remaining: fileLimitCheck.remaining,
          resetTime: fileLimitCheck.resetTime
        });
      }
      
      // Check data volume rate limit
      const dataLimitCheck = rateLimiter.checkDataLimit(request, jsonSize);
      if (!dataLimitCheck.allowed) {
        return reply.code(429).send({
          error: 'Rate limit exceeded',
          message: `Data upload limit exceeded. ${formatBytes(dataLimitCheck.remaining)} remaining. Reset in ${formatTimeUntilReset(dataLimitCheck.resetTime)}`,
          limitType: 'data',
          remaining: dataLimitCheck.remaining,
          resetTime: dataLimitCheck.resetTime
        });
      }
      
      // Use contractId directly for storage and add random suffix
      const randomSuffix = generateFileId();
      const key = `token/${contractId}/uri-${randomSuffix}.json`;
      
      // Record the upload for rate limiting
      rateLimiter.recordUpload(request, jsonSize);
      await putObject(
        key,
        JSON.stringify(validatedJson, null, 2),
        'application/json; charset=utf-8',
        'public, max-age=31536000, immutable'
      );

      const cdnUrl = `${config.CDN_BASE_URL}/token/${contractId}/uri-${randomSuffix}.json`;

      return { url: cdnUrl };
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
