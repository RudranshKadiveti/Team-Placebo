import { prisma } from '../config/database.js';
import { pipeline } from '@xenova/transformers';

async function verify() {
  console.log('🔍 VERIFYING KAGGLE DATASET EMBEDDINGS IN POSTGRESQL...');

  // 1. Total row count check
  const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM ai_repository_embeddings WHERE embedding IS NOT NULL;
  `;
  const totalCount = Number(countResult[0].count);
  console.log(`✅ Total Repositories with Vector Embeddings: ${totalCount}`);

  // 2. Semantic Search Test
  const testQuery = 'LLM fine-tuning and retrieval augmented generation pipeline';
  console.log(`\n🔎 Running Semantic Vector Search Query: "${testQuery}"...`);

  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const output = await extractor(testQuery, { pooling: 'mean', normalize: true });
  const queryVector = Array.from(output.data);
  const vectorSql = `[${queryVector.join(',')}]`;

  const topResults = await prisma.$queryRaw<Array<{
    fullName: string;
    description: string;
    primaryLanguage: string;
    topics: string;
    aiCategory: string;
    stars: number;
    distance: number;
  }>>`
    SELECT 
      "full_name" as "fullName", 
      "description", 
      "primary_language" as "primaryLanguage", 
      "topics", 
      "ai_category" as "aiCategory", 
      "stars",
      (embedding <=> ${vectorSql}::vector) as distance
    FROM ai_repository_embeddings
    ORDER BY embedding <=> ${vectorSql}::vector
    LIMIT 5;
  `;

  console.log('\n🏆 TOP 5 SEMANTICALLY MATCHED AI REPOSITORIES:');
  topResults.forEach((repo, idx) => {
    console.log(`\n${idx + 1}. ${repo.fullName} (Similarity Distance: ${repo.distance.toFixed(4)}, Stars: ${repo.stars})`);
    console.log(`   Category: ${repo.aiCategory} | Lang: ${repo.primaryLanguage}`);
    console.log(`   Desc: ${repo.description}`);
  });

  await prisma.$disconnect();
}

verify().catch((err) => {
  console.error('❌ Verification Error:', err);
  prisma.$disconnect();
  process.exit(1);
});
