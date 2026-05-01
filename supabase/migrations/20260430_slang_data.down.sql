-- Reverses 20260430_slang_data.sql.
--
-- Removes only rows owned by this seed batch — preserves any user-created
-- slang and any future seed batches that reuse the same scaffolding.
--
-- The `seed_source` column and its index are intentionally left in place:
-- they are reusable infrastructure for the data-migration pattern. To
-- fully reverse the schema additions, write a follow-up migration.

delete from public.slang where seed_source = 'gen_alpha_v1';
