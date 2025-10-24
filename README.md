# Zerafile

A production-ready file hosting and URI metadata service built with Next.js, Fastify, and DigitalOcean Spaces.

## Features

- **File Upload**: Upload PDF documents, images (PNG, JPG, JPEG, GIF, WebP), and office files (XLSX, DOCX) up to 5MB
- **Governance Section**: Upload governance documents and proposals
- **Token Section**: Upload token assets and create URI metadata
- **Direct CDN Access**: Files served via DigitalOcean Spaces CDN for fast, reliable access
- **URI JSON Builder**: Create and publish metadata for contracts and tokens
- **Rate Limiting**: Built-in rate limiting for uploads and API calls
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
3. Configure CORS for your domains:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "PUT"],
    "AllowedOrigins": [
      "https://zerafile.io",
      "https://api.zerafile.io"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### 3. Environment Configuration

#### API Environment (`apps/api/.env`)

```bash
# DigitalOcean Spaces Configuration
SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
SPACES_REGION=us-east-1
SPACES_BUCKET=zerafile
SPACES_KEY=your_spaces_access_key
SPACES_SECRET=your_spaces_secret_key

# CDN and App URLs
CDN_BASE_URL=https://cdn.zerafile.io
APP_PUBLIC_BASE=https://zerafile.io

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
  "ext": "pdf"
}
```

**Response:**
```json
{
  "key": "governance/abc123.pdf",
  "presignedUrl": "https://nyc3.digitaloceanspaces.com/...",
  "prettyUrl": "https://zerafile.io/governance/abc123.pdf",
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
  "url": "https://zerafile.io/governance/abc123.pdf",
  "cdnUrl": "https://cdn.zerafile.io/governance/abc123.pdf"
}
```

### URI JSON

#### POST /v1/uri
Publish URI JSON metadata.

**Request:**
```json
{
  "contractId": "$CONTRACT123",
  "json": {
    "name": "My Contract",
    "description": "Contract description",
    "image": "https://example.com/image.png",
    "external_url": "https://example.com",
    "attributes": [
      {
        "trait_type": "Type",
        "value": "Governance"
      }
    ]
  }
}
```

**Response:**
```json
{
  "url": "https://zerafile.io/uri/%24CONTRACT123"
}
```

## File Access

### Direct CDN Access
Files are accessible via CDN URLs:
- `https://cdn.zerafile.io/governance/{id}.{ext}`
- `https://cdn.zerafile.io/token/{id}.{ext}`
- `https://cdn.zerafile.io/token/{contractId}/uri.json`
- `https://cdn.zerafile.io/token/{contractId}/icon.png` (and other files)

### Pretty URLs (Redirects)
App routes redirect to CDN:
- `https://zerafile.io/governance/{id}.{ext}` → CDN URL
- `https://zerafile.io/token/{id}.{ext}` → CDN URL
- `https://zerafile.io/token/{contractId}/uri.json` → CDN URL

## Rate Limits

- **File Uploads**: 20 requests/minute per IP
- **URI Publishing**: 10 requests/minute per IP  
- **File Access**: 2000 requests/minute per IP
- **URI Access**: 600 requests/minute per IP

## File Constraints

- **Size Limit**: 5MB maximum
- **Allowed Types**: PDF documents, images (PNG, JPG, JPEG, GIF, WebP), office files (XLSX, DOCX)
- **MIME Validation**: Server-side validation after upload
- **Cache Headers**: 1 year immutable cache for files and JSON
- **Download Required**: XLSX and DOCX files require download (no preview)

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
- `src/app/page.tsx` - Home page (redirects to /files)
- `src/app/files/page.tsx` - File upload interface
- `src/app/uri/page.tsx` - URI JSON builder
- `src/app/api/governance/[...path]/route.ts` - File redirects
- `src/app/api/uri/[contractId]/route.ts` - URI redirects
- `src/components/` - Reusable UI components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
