-- Migration: add_performance_indexes
-- Thêm index cho các cột thường xuyên được dùng trong WHERE / ORDER BY / JOIN

-- ============================================================
-- courses table
-- ============================================================
CREATE INDEX IF NOT EXISTS "courses_deleted_at_idx"   ON "courses"("deleted_at");
CREATE INDEX IF NOT EXISTS "courses_category_id_idx"  ON "courses"("category_id");
CREATE INDEX IF NOT EXISTS "courses_is_private_idx"   ON "courses"("is_private");
CREATE INDEX IF NOT EXISTS "courses_is_mandatory_idx" ON "courses"("is_mandatory");
CREATE INDEX IF NOT EXISTS "courses_created_at_idx"   ON "courses"("created_at");
CREATE INDEX IF NOT EXISTS "courses_updated_at_idx"   ON "courses"("updated_at");
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS "courses_title_trgm_idx" ON "courses" USING gin ("title" gin_trgm_ops);

-- ============================================================
-- sections table
-- ============================================================
CREATE INDEX IF NOT EXISTS "sections_course_id_idx"   ON "sections"("course_id");

-- ============================================================
-- lessons table
-- ============================================================
CREATE INDEX IF NOT EXISTS "lessons_section_id_idx"   ON "lessons"("section_id");

-- ============================================================
-- enrollments table
-- ============================================================
CREATE INDEX IF NOT EXISTS "enrollments_course_id_idx" ON "enrollments"("course_id");

-- ============================================================
-- lesson_completed table
-- ============================================================
CREATE INDEX IF NOT EXISTS "lesson_completed_lesson_id_idx" ON "lesson_completed"("lesson_id");
