import { FastifyInstance } from 'fastify';
import { generateFileId, isAllowedExt, safeMimeByExt } from '@zerafile/shared';
import { generatePresignedPutUrl } from '../lib/presign';
import { headObject, putObjectAcl } from '../lib/s3';
import { config } from '../config';

const initUploadSchema = {
  body: {
    type: 'object',
    required: ['ext'],
    properties: {
      pathHint: { type: 'string', default: 'governance' },
      ext: { type: 'string' },
    },
  },
};

const completeUploadSchema = {
  body: {
    type: 'object',
    required: ['key'],
    properties: {
      key: { type: 'string' },
    },
  },
};

export async function uploadRoutes(fastify: FastifyInstance) {
  // POST /v1/uploads/init
  fastify.post('/v1/uploads/init', {
    schema: initUploadSchema,
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { pathHint = 'governance', ext } = request.body as { pathHint?: string; ext: string };

    // Validate extension
    if (!isAllowedExt(ext)) {
      return reply.code(400).send({
        error: 'Invalid file extension',
        allowed: ['pdf', 'png', 'jpg', 'jpeg', 'gif', 'webp'],
      });
    }

    try {
      // Generate unique ID and key
      const id = generateFileId();
      const key = `${pathHint}/${id}.${ext}`;
      
      // Get MIME type
      const contentType = safeMimeByExt(ext);
      
      // Generate presigned URL
      const presignedUrl = await generatePresignedPutUrl(key, contentType);
      
      // Build URLs based on pathHint
      let prettyUrl: string;
      let cdnUrl: string;
      
      if (pathHint.startsWith('governance')) {
        prettyUrl = `${config.APP_PUBLIC_BASE}/governance/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/governance/${id}.${ext}`;
      } else if (pathHint.startsWith('tokens')) {
        // For tokens, extract contractId from pathHint
        const contractId = pathHint.split('/')[1];
        prettyUrl = `${config.APP_PUBLIC_BASE}/token/${contractId}/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/token/${contractId}/${id}.${ext}`;
      } else {
        // Fallback
        prettyUrl = `${config.APP_PUBLIC_BASE}/${pathHint}/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/${pathHint}/${id}.${ext}`;
      }

      return {
        key,
        presignedUrl,
        prettyUrl,
        cdnUrl,
        maxSizeBytes: 5_000_000,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to generate upload URL' });
    }
  });

  // POST /v1/uploads/complete
  fastify.post('/v1/uploads/complete', {
    schema: completeUploadSchema,
    config: {
      rateLimit: {
        max: 20,
        timeWindow: '1 minute',
      },
    },
  }, async (request, reply) => {
    const { key } = request.body as { key: string };

    try {
      // Verify the file was uploaded
      const headResult = await headObject(key);
      
      if (!headResult) {
        return reply.code(404).send({ error: 'File not found' });
      }

      // Check file size (5MB limit)
      const contentLength = headResult.ContentLength || 0;
      if (contentLength > 5_000_000) {
        return reply.code(413).send({ error: 'File too large' });
      }

      // Check MIME type
      const contentType = headResult.ContentType;
      const allowedMimeTypes = [
        'application/pdf', 
        'image/png', 
        'image/jpeg', 
        'image/gif', 
        'image/webp',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!contentType || !allowedMimeTypes.includes(contentType)) {
        return reply.code(400).send({ error: 'Invalid file type' });
      }

      // Ensure file is publicly accessible
      try {
        await putObjectAcl(key, 'public-read');
      } catch (aclError) {
        fastify.log.warn(`Failed to set ACL for ${key}:`, aclError);
        // Continue anyway - the presigned URL should have set the ACL
      }

      // Extract ID from key for URL generation
      const keyParts = key.split('/');
      const filename = keyParts[keyParts.length - 1];
      const [id, ext] = filename.split('.');
      const pathHint = keyParts[0];
      
      let prettyUrl: string;
      let cdnUrl: string;
      
      if (pathHint === 'governance') {
        prettyUrl = `${config.APP_PUBLIC_BASE}/governance/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/governance/${id}.${ext}`;
      } else if (pathHint === 'tokens') {
        // For tokens, extract contractId from key
        const contractId = keyParts[1];
        prettyUrl = `${config.APP_PUBLIC_BASE}/token/${contractId}/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/token/${contractId}/${id}.${ext}`;
      } else {
        // Fallback
        prettyUrl = `${config.APP_PUBLIC_BASE}/${pathHint}/${id}.${ext}`;
        cdnUrl = `${config.CDN_BASE_URL}/${pathHint}/${id}.${ext}`;
      }

      return {
        ok: true,
        url: prettyUrl,
        cdnUrl,
      };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Failed to complete upload' });
    }
  });
}
