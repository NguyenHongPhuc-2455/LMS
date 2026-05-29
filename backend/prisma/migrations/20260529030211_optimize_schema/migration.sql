/*
  Warnings:

  - The `status` column on the `quiz_attempts` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "QuizAttemptStatus" AS ENUM ('IN_PROGRESS', 'PASSED', 'FAILED');

-- AlterTable
ALTER TABLE "quiz_attempts" DROP COLUMN "status",
ADD COLUMN     "status" "QuizAttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS';

-- CreateIndex
CREATE INDEX "course_requests_user_id_idx" ON "course_requests"("user_id");

-- CreateIndex
CREATE INDEX "course_requests_course_id_idx" ON "course_requests"("course_id");

-- CreateIndex
CREATE INDEX "program_requests_user_id_idx" ON "program_requests"("user_id");

-- CreateIndex
CREATE INDEX "program_requests_program_id_idx" ON "program_requests"("program_id");

-- CreateIndex
CREATE INDEX "program_requests_status_idx" ON "program_requests"("status");

-- CreateIndex
CREATE INDEX "program_requests_created_at_idx" ON "program_requests"("created_at");

-- CreateIndex
CREATE INDEX "reviews_user_id_idx" ON "reviews"("user_id");

-- CreateIndex
CREATE INDEX "reviews_course_id_idx" ON "reviews"("course_id");

-- CreateIndex
CREATE INDEX "reviews_created_at_idx" ON "reviews"("created_at");
