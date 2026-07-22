import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';


// Set up the standard PostgreSQL connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Initialize the Prisma Postgres adapter
const adapter = new PrismaPg(pool);

// Pass the adapter to the Prisma Client
const prisma = new PrismaClient({ adapter });

export default prisma;
