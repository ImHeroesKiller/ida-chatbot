-- Return chunk metadata from vector search for richer RAG context

create or replace function match_ida_chunks(
  query_embedding vector(768),
  match_locale text,
  match_count int default 6,
  match_threshold float default 0.35
)
returns table (
  id uuid,
  content text,
  page_slug text,
  section text,
  source_type text,
  metadata jsonb,
  similarity float
)
language sql
stable
as $$
  select
    ida_document_chunks.id,
    ida_document_chunks.content,
    ida_document_chunks.page_slug,
    ida_document_chunks.section,
    ida_document_chunks.source_type,
    ida_document_chunks.metadata,
    1 - (ida_document_chunks.embedding <=> query_embedding) as similarity
  from ida_document_chunks
  where ida_document_chunks.locale = match_locale
    and 1 - (ida_document_chunks.embedding <=> query_embedding) > match_threshold
  order by ida_document_chunks.embedding <=> query_embedding
  limit match_count;
$$;