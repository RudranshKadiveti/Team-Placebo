# CareerPilot AI Backend Service

Express + TypeScript + Prisma ORM backend service.

## Environment Variables

Check `.env.example` for required configuration variables:

- `PORT`: Server port (default: `5000`)
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGIN`: Allowed frontend origin for CORS
- `NODE_ENV`: Application environment (`development` | `production` | `test`)

## Available Scripts

- `npm run dev`: Run local development server with live reload (`tsx`)
- `npm run build`: Compile TypeScript into `./dist`
- `npm run start`: Run production compiled server
- `npm run lint`: Run ESLint check
- `npm run format`: Format code with Prettier
- `npm test`: Run Supertest / Jest test suite
