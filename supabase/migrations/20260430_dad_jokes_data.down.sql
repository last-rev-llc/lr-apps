-- Reverses 20260430_dad_jokes_data.sql.
--
-- Removes only rows owned by this seed batch — preserves any user-created
-- jokes and any future seed batches that reuse the same scaffolding.
--
-- The `seed_source` column, the seed_source index, and the
-- (setup, punchline) unique constraint are intentionally left in place:
-- they are reusable infrastructure for the data-migration pattern. To
-- fully reverse the schema additions, write a follow-up migration.

delete from public.dad_jokes where seed_source = 'dad_jokes_v1';
