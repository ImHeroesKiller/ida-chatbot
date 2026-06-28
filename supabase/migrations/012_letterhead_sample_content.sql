-- Optional document structure sample for letterhead templates (Save as Template)

alter table ida_worksheet_letterhead_templates
  add column if not exists sample_content text;