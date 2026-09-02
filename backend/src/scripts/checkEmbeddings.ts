import { prisma } from '../config/database.js';

async function main() {
  const userCount = await prisma.user.count();
  const resumeCount = await prisma.resume.count();
  const chunkCount = await prisma.resumeChunk.count();
  
  // Count chunks that have non-null embedding metadata or pgvector embeddings
  const chunksWithEmbeddingMetadata = await prisma.resumeChunk.count({
    where: {
      embeddingModel: { not: '' }
    }
  });

  // Direct raw query to check pgvector embedding column in resume_chunks table
  const rawEmbeddingResult: any[] = await prisma.$queryRawUnsafe(
    `SELECT count(*) as total_embeddings FROM resume_chunks WHERE embedding IS NOT NULL;`
  );

  const totalPgVectorEmbeddings = Number(rawEmbeddingResult[0]?.total_embeddings || 0);

  console.log('--- DATABASE EMBEDDINGS CHECK REPORT ---');
  console.log(`Total Users: ${userCount}`);
  console.log(`Total Resumes: ${resumeCount}`);
  console.log(`Total Resume Chunks: ${chunkCount}`);
  console.log(`Total Chunks with pgvector Embeddings: ${totalPgVectorEmbeddings}`);

  if (chunkCount > 0) {
    const sampleChunks = await prisma.resumeChunk.findMany({ take: 3 });
    console.log('\nSample Chunks in DB:', JSON.stringify(sampleChunks, null, 2));
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error('Error checking database:', err);
  process.exit(1);
});
