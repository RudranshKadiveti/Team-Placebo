import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { pipeline } from '@xenova/transformers';
import { prisma } from '../config/database.js';

const KAGGLE_URL = 'https://www.kaggle.com/api/v1/datasets/download/mansiaggarwal88/ai-engineering-github-repositories';
const DATA_DIR = path.resolve(process.cwd(), 'src/scripts/kaggle_data');
const ZIP_PATH = path.join(DATA_DIR, 'dataset.zip');

function extractZip(zipPath: string, destDir: string): string {
  if (!fs.existsSync(zipPath)) {
    throw new Error(`Zip file does not exist at ${zipPath}`);
  }

  fs.mkdirSync(destDir, { recursive: true });

  if (process.platform === 'win32') {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`);
  } else {
    execSync(`unzip -o "${zipPath}" -d "${destDir}"`);
  }

  const files = fs.readdirSync(destDir);
  const csvFile = files.find((f) => f.endsWith('.csv'));

  if (!csvFile) {
    throw new Error('No CSV file found in dataset zip.');
  }

  return path.join(destDir, csvFile);
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

export async function runIngestionPipeline() {
  console.log('--- STARTING KAGGLE DATASET INGESTION & EMBEDDING PIPELINE (RESUME MODE) ---');

  const csvPath = extractZip(ZIP_PATH, DATA_DIR);
  console.log(`📄 Found CSV File: ${csvPath}`);

  console.log('🧹 Reading & Parsing CSV...');
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = fileContent.split(/\r?\n/).filter((l) => l.trim().length > 0);

  const headers = parseCsvLine(lines[0]).map((h) => h.trim().toLowerCase());
  const getIdx = (name: string) => headers.indexOf(name.toLowerCase());

  const fullNameIdx = getIdx('full_name');
  const repoNameIdx = getIdx('repo_name');
  const ownerIdx = getIdx('owner');
  const htmlUrlIdx = getIdx('html_url');
  const descIdx = getIdx('description');
  const langIdx = getIdx('language');
  const topicsIdx = getIdx('topics');
  const frameworkIdx = getIdx('framework_stack');
  const categoryIdx = getIdx('ai_category');
  const starsIdx = getIdx('stars');
  const forksIdx = getIdx('forks');
  const statusIdx = getIdx('maintenance_status');
  const tierIdx = getIdx('popularity_tier');

  const records: Array<{
    fullName: string;
    repoName: string;
    owner: string;
    htmlUrl: string;
    description: string;
    language: string;
    topics: string;
    frameworkStack: string;
    aiCategory: string;
    stars: number;
    forks: number;
    maintenanceStatus: string;
    popularityTier: string;
    embeddingText: string;
  }> = [];

  const seenFullNames = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const owner = (ownerIdx >= 0 ? cols[ownerIdx] : '') || '';
    const repoName = (repoNameIdx >= 0 ? cols[repoNameIdx] : '') || '';
    let fullName = (fullNameIdx >= 0 ? cols[fullNameIdx] : '') || `${owner}/${repoName}`;

    fullName = fullName.trim();
    if (!fullName || seenFullNames.has(fullName)) continue;
    seenFullNames.add(fullName);

    const description = (descIdx >= 0 ? cols[descIdx] : '').trim();
    const language = (langIdx >= 0 ? cols[langIdx] : '').trim();
    const topics = (topicsIdx >= 0 ? cols[topicsIdx] : '').trim();
    const frameworkStack = (frameworkIdx >= 0 ? cols[frameworkIdx] : '').trim();
    const aiCategory = (categoryIdx >= 0 ? cols[categoryIdx] : '').trim();
    const htmlUrl = (htmlUrlIdx >= 0 ? cols[htmlUrlIdx] : `https://github.com/${fullName}`).trim();
    const stars = parseInt(cols[starsIdx] || '0', 10) || 0;
    const forks = parseInt(cols[forksIdx] || '0', 10) || 0;
    const maintenanceStatus = (statusIdx >= 0 ? cols[statusIdx] : '').trim();
    const popularityTier = (tierIdx >= 0 ? cols[tierIdx] : '').trim();

    const embeddingText = `${fullName}: ${description}. Category: ${aiCategory}. Frameworks: ${frameworkStack}. Topics: ${topics}.`;

    records.push({
      fullName,
      repoName,
      owner,
      htmlUrl,
      description,
      language,
      topics,
      frameworkStack,
      aiCategory,
      stars,
      forks,
      maintenanceStatus,
      popularityTier,
      embeddingText,
    });
  }

  console.log(`✨ Total Cleaned Unique Repositories: ${records.length}`);

  // Fetch already existing repositories to skip re-embedding
  const existingRepos = await prisma.$queryRaw<Array<{ fullName: string }>>`
    SELECT "fullName" FROM ai_repository_embeddings WHERE embedding IS NOT NULL
  `;
  const existingSet = new Set(existingRepos.map((r) => r.fullName));
  console.log(`⚡ Existing Embedded Repositories in Database: ${existingSet.size}`);

  const pendingRecords = records.filter((r) => !existingSet.has(r.fullName));
  console.log(`🚀 Repositories Pending Embedding & Insertion: ${pendingRecords.length}`);

  if (pendingRecords.length === 0) {
    console.log('🎉 ALL REPOSITORIES ARE ALREADY EMBEDDED & STORED!');
    await createHnswIndex();
    await prisma.$disconnect();
    return;
  }

  console.log('🤖 Loading Xenova/all-MiniLM-L6-v2 Feature Extractor...');
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  console.log('✅ Embedding Model Pipeline Loaded.');

  const BATCH_SIZE = 50;
  const startTotalTime = Date.now();
  let completedCount = existingSet.size;

  for (let i = 0; i < pendingRecords.length; i += BATCH_SIZE) {
    const batch = pendingRecords.slice(i, i + BATCH_SIZE);

    for (const item of batch) {
      const output = await extractor(item.embeddingText, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      const vectorSqlString = `[${vector.join(',')}]`;

      await prisma.$executeRawUnsafe(
        `
        INSERT INTO ai_repository_embeddings (
          "id", "fullName", "repoName", "owner", "htmlUrl", "description",
          "primaryLanguage", "topics", "frameworkStack", "aiCategory",
          "stars", "forks", "maintenanceStatus", "popularityTier",
          "embedding", "embeddingModel", "embeddingDimension"
        ) VALUES (
          gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::vector, $15, $16
        )
        ON CONFLICT ("fullName") DO UPDATE SET
          "description" = EXCLUDED."description",
          "primaryLanguage" = EXCLUDED."primaryLanguage",
          "topics" = EXCLUDED."topics",
          "frameworkStack" = EXCLUDED."frameworkStack",
          "aiCategory" = EXCLUDED."aiCategory",
          "stars" = EXCLUDED."stars",
          "forks" = EXCLUDED."forks",
          "maintenanceStatus" = EXCLUDED."maintenanceStatus",
          "popularityTier" = EXCLUDED."popularityTier",
          "embedding" = EXCLUDED."embedding";
        `,
        item.fullName,
        item.repoName,
        item.owner,
        item.htmlUrl,
        item.description,
        item.language,
        item.topics,
        item.frameworkStack,
        item.aiCategory,
        item.stars,
        item.forks,
        item.maintenanceStatus,
        item.popularityTier,
        vectorSqlString,
        'Xenova/all-MiniLM-L6-v2',
        384
      );
    }

    completedCount += batch.length;
    const elapsedSec = (Date.now() - startTotalTime) / 1000;
    const rate = (i + batch.length) / elapsedSec;
    console.log(`⚡ Inserted & Embedded Total: ${completedCount}/${records.length} (${rate.toFixed(1)} pending repos/sec)`);
  }

  await createHnswIndex();

  console.log('🎉 INGESTION & EMBEDDING PIPELINE FINISHED SUCCESSFULLY!');
  await prisma.$disconnect();
}

async function createHnswIndex() {
  console.log('⚡ Creating HNSW Index on pgvector embedding column...');
  try {
    await prisma.$executeRawUnsafe(
      `CREATE INDEX IF NOT EXISTS idx_ai_repo_embeddings_hnsw ON ai_repository_embeddings USING hnsw (embedding vector_cosine_ops);`
    );
    console.log('✅ HNSW Vector Index created successfully.');
  } catch (err: any) {
    console.log('⚠️ Note on index creation:', err.message || err);
  }
}

runIngestionPipeline().catch(async (err) => {
  console.error('❌ Pipeline Error:', err);
  await prisma.$disconnect();
  process.exit(1);
});
