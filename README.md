# Zerafile

This project has a vibecoded base to support zerafile.io. It is a super quick few hour implementation based on community discussion for a simple, ZERA focused file upload service leveraging a simple interface and s3-compatible CDN.

Nothing in this service is security sensitive, and not a lot of care was taken into the security aspects simple because everything on this platform is intended to be entirely public.

## Features

- **File Upload**: Upload PDF documents, images (PNG, JPG, JPEG, GIF, WebP), office files (XLSX, DOCX), and JSON files up to 5MB
- **Governance Section**: Upload governance documents and proposals with random file IDs
- **Token Section**: Upload token assets and create URI metadata for contract IDs
- **Direct CDN Access**: Files served via DigitalOcean Spaces CDN for fast, reliable access
- **URI JSON Builder**: Create and publish metadata for token contracts
- **Custom Rate Limiting**: Server-side rate limiting (10 files/30min, 20MB/10min) with client-side enforcement
- **Dark Theme UI**: Modern dark theme inspired by zera.net design
- **Monorepo Architecture**: Shared utilities across web and API services

## Architecture

```
zerafile/
├── apps/
│   ├── web/            # Next.js 14 App Router frontend
│   └── api/            # Fastify API with DO Spaces integration
├── packages/
│   └── shared/         # Shared utilities (ids, mime, schema)
├── docker-compose.yml  # Local development orchestration
└── README.md
```

## Prerequisites

- Node.js 20+ 
- pnpm 8+
- Docker (optional, for containerized deployment)
- DigitalOcean Spaces account

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd zerafile
pnpm install
```

### 2. DigitalOcean Spaces Setup

1. Create a DigitalOcean Spaces bucket named `zerafile`
2. Generate API keys with read/write permissions
3. Configure CORS as needed.

### 3. Environment Configuration

#### API Environment (`apps/api/.env`)

```bash
# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=https://sfo3.digitaloceanspaces.com
SPACES_REGION=sfo-3
SPACES_BUCKET=zerafile
SPACES_KEY=your_spaces_access_key
SPACES_SECRET=your_spaces_secret_key

# CDN and App URLs
CDN_BASE_URL=https://cdn.zerafile.io

# Server Configuration
PORT=8080
NODE_ENV=development
```

#### Web Environment (`apps/web/.env.local`)

```bash
# API Configuration
NEXT_PUBLIC_API_BASE=https://api.zerafile.io
NEXT_PUBLIC_CDN_BASE=https://cdn.zerafile.io
```

### 4. Development

```bash
# Start all services in development mode
pnpm dev

# Or start individual services
pnpm --filter @zerafile/api dev
pnpm --filter @zerafile/web dev
```

- API: http://localhost:8080
- Web: http://localhost:3000

### 5. Production Build

```bash
# Build all packages
pnpm build

# Start production servers
pnpm start
```

## Docker Deployment

### Using Docker Compose

```bash
# Copy environment files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# Edit environment variables
# Then start services
docker-compose up -d
```

### Individual Docker Images

```bash
# Build API image
docker build -f apps/api/Dockerfile -t zerafile-api .

# Build Web image  
docker build -f apps/web/Dockerfile -t zerafile-web .

# Run containers
docker run -p 8080:8080 --env-file apps/api/.env zerafile-api
docker run -p 3000:3000 --env-file apps/web/.env.local zerafile-web
```

## API Endpoints

### File Upload

#### POST /v1/uploads/init
Initialize file upload and get presigned URL.

**Request:**
```json
{
  "pathHint": "governance",
  "ext": "pdf",
  "filename": "document.pdf"
}
```

**Response:**
```json
{
  "key": "governance/abc123.pdf",
  "presignedUrl": "https://nyc3.digitaloceanspaces.com/...",
  "cdnUrl": "https://cdn.zerafile.io/governance/abc123.pdf",
  "maxSizeBytes": 5000000
}
```

#### POST /v1/uploads/complete
Complete file upload after direct upload to presigned URL.

**Request:**
```json
{
  "key": "governance/abc123.pdf"
}
```

**Response:**
```json
{
  "ok": true,
  "cdnUrl": "https://cdn.zerafile.io/governance/abc123.pdf"
}
```

### URI JSON

#### POST /v1/uri
Publish URI JSON metadata.

**Request:**
```json
{
  "contractId": "$ZRA+0000",
  "json": {
    "image": "https://cdn.zerafile.io/token/$ZRA+0000/icon.png",
    "url": "https://example.com",
    "description": "Token description"
  }
}
```

**Response:**
```json
{
  "url": "https://cdn.zerafile.io/token/$ZRA+0000/uri-abc123.json"
}
```

#### GET /v1/uploads/rate-limit-status
Check current rate limit status for the requesting IP.

**Response:**
```json
{
  "files": {
    "used": 2,
    "limit": 10,
    "remaining": 8,
    "resetTime": 1640995200000,
    "resetIn": "25m 30s"
  },
  "data": {
    "used": 5242880,
    "limit": 20971520,
    "remaining": 15728640,
    "resetTime": 1640995200000,
    "resetIn": "8m 15s",
    "usedFormatted": "5.0 MB",
    "limitFormatted": "20.0 MB",
    "remainingFormatted": "15.0 MB"
  }
}
```

#### GET /health
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-01-24T10:30:00.000Z"
}
```

## File Access

### Direct CDN Access
Files are accessible via CDN URLs:
- `https://cdn.zerafile.io/governance/{randomId}.{ext}` - Governance files
- `https://cdn.zerafile.io/token/{contractId}/{filename}` - Token assets
- `https://cdn.zerafile.io/token/{contractId}/uri-{randomSuffix}.json` - URI metadata

### Token Uploads
For token assets, a valid contract ID is required:
- Contract ID format: `$ZRA+0000` or `$sol-SOL+000000`
- Files are stored under: `token/{contractId}/{filename}`
- Multiple files can be uploaded per contract
- All files are publicly accessible via CDN

## Rate Limits

- **File Count**: 10 files per 30 minutes per IP
- **Data Volume**: 20MB per 10 minutes per IP
- **Client-Side Enforcement**: Rate limits enforced both server-side and client-side
- **Status Endpoint**: `GET /v1/uploads/rate-limit-status` to check current limits

## File Constraints

- **Size Limit**: 5MB maximum per file
- **Allowed Types**: PDF documents, images (PNG, JPG, JPEG, GIF, WebP), office files (XLSX, DOCX), JSON files
- **MIME Validation**: Server-side validation after upload
- **Cache Headers**: 1 year immutable cache for files and JSON
- **Download Required**: XLSX and DOCX files require download (no preview)
- **Public Access**: All uploaded files are publicly accessible via CDN
- **Random Suffixes**: Governance files get random IDs, URI JSON gets random suffixes

## User Interface

### Governance Section
- Upload governance documents and proposals
- Random file ID generation for each upload
- Direct CDN access to uploaded files
- Support for PDF, images, and office documents

### Tokens Section
- Contract ID input with validation (`$ZRA+0000` or `$sol-SOL+000000` format)
- Multiple file uploads per contract
- URI JSON editor with import/export functionality
- Real-time upload progress and file size display
- Copy-to-clipboard functionality for CDN URLs

### Legal Pages
- Terms of Service and Privacy Policy
- Cross-referenced legal documents
- Swiss law and binding arbitration clauses

## Development Scripts

```bash
# Install dependencies
pnpm install

# Development
pnpm dev                 # Start all services
pnpm --filter @zerafile/api dev    # API only
pnpm --filter @zerafile/web dev    # Web only

# Building
pnpm build              # Build all packages
pnpm --filter @zerafile/api build  # API only
pnpm --filter @zerafile/web build  # Web only

# Production
pnpm start              # Start all services
pnpm --filter @zerafile/api start  # API only
pnpm --filter @zerafile/web start  # Web only

# Linting & Type Checking
pnpm lint               # Lint all packages
pnpm type-check         # Type check all packages
```

## Project Structure

### Shared Package (`packages/shared`)
- `src/ids.ts` - Base62 ID generation
- `src/mime.ts` - File extension and MIME type utilities
- `src/schema.ts` - Zod schemas for URI JSON validation

### API Service (`apps/api`)
- `src/index.ts` - Fastify server setup
- `src/config.ts` - Environment configuration
- `src/lib/s3.ts` - DigitalOcean Spaces client
- `src/lib/presign.ts` - Presigned URL generation
- `src/routes/uploads.ts` - File upload endpoints
- `src/routes/uri.ts` - URI JSON endpoints

### Web Application (`apps/web`)
- `src/app/page.tsx` - Home page (redirects to /governance)
- `src/app/governance/page.tsx` - Governance file upload interface
- `src/app/tokens/page.tsx` - Token assets and URI metadata interface
- `src/app/terms/page.tsx` - Terms of Service page
- `src/app/privacy/page.tsx` - Privacy Policy page
- `src/app/api/governance/[...path]/route.ts` - Governance file redirects
- `src/app/api/token/[...path]/route.ts` - Token file redirects
- `src/app/api/tokens/[...path]/route.ts` - Token assets redirects
- `src/app/api/uri/[contractId]/route.ts` - URI metadata redirects
- `src/components/` - Reusable UI components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
