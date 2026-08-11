import { prisma } from '../config/database.js';
import { generateResumeEmbeddings } from '../services/resumeEmbedding.service.js';

async function processLatestResumeEmbeddings() {
  console.log('🔍 Checking latest uploaded resume in PostgreSQL database...');
  const resume = await prisma.resume.findFirst({
    orderBy: { uploadedAt: 'desc' },
  });

  if (!resume) {
    console.log('⚠️ No uploaded resumes found in PostgreSQL.');
    return;
  }

  console.log(`📄 Found uploaded resume ID: ${resume.id}`);
  console.log(`📁 File Name: ${resume.originalFileName}`);
  console.log(`⚙️ Generating L2-normalized embeddings via SentenceTransformers...`);

  const summary = await generateResumeEmbeddings(resume.id, resume.userId);
  console.log('✅ Embedding Summary Result:', JSON.stringify(summary, null, 2));

  // Query pgvector table
  const chunks = await prisma.$queryRawUnsafe<Array<{ id: string; sectionType: string; content: string; vectorSnippet: string }>>(
    `SELECT id, "sectionType", content, left(embedding::text, 65) as "vectorSnippet" FROM resume_chunks WHERE "resumeId" = $1 ORDER BY "chunkIndex" ASC`,
    resume.id
  );

  console.log('\n--- STORED RESUME CHUNKS & VECTOR EMBEDDINGS IN PGVECTOR ---');
  chunks.forEach((c, i) => {
    console.log(`\nChunk #${i + 1} [Section: ${c.sectionType}]`);
    console.log(`Content: "${c.content.substring(0, 100).replace(/\n/g, ' ')}..."`);
    console.log(`pgvector Embedding Vector: ${c.vectorSnippet}...`);
  });
}

processLatestResumeEmbeddings()
  .catch((err) => console.error('Error processing resume embeddings:', err))
  .finally(() => prisma.$disconnect());
