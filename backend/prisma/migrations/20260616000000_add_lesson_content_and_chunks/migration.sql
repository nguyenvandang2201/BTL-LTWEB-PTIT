-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "content" TEXT;

-- CreateTable
CREATE TABLE "lesson_chunks" (
    "lesson_chunk_id" SERIAL NOT NULL,
    "course_id" INTEGER NOT NULL,
    "lesson_id" INTEGER NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "embedding" JSONB NOT NULL,
    "token_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_chunks_pkey" PRIMARY KEY ("lesson_chunk_id")
);

-- CreateIndex
CREATE INDEX "lesson_chunks_course_id_idx" ON "lesson_chunks"("course_id");

-- CreateIndex
CREATE INDEX "lesson_chunks_lesson_id_idx" ON "lesson_chunks"("lesson_id");

-- AddForeignKey
ALTER TABLE "lesson_chunks" ADD CONSTRAINT "lesson_chunks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_chunks" ADD CONSTRAINT "lesson_chunks_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;
