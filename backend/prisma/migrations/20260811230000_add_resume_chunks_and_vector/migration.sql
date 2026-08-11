-- AlterTable
ALTER TABLE "resumes" ADD COLUMN "rawText" TEXT;

-- CreateTable
CREATE TABLE "resume_chunks" (
    "id" TEXT NOT NULL,
    "resumeId" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "sectionType" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "embedding" vector(384),
    "embeddingModel" TEXT NOT NULL,
    "embeddingVersion" TEXT NOT NULL,
    "embeddingDimension" INTEGER NOT NULL,
    "normalized" BOOLEAN NOT NULL DEFAULT true,
    "chunkingVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resume_chunks_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "resume_chunks" ADD CONSTRAINT "resume_chunks_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "resumes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
