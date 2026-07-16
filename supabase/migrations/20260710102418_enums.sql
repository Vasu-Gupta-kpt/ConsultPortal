-- Enum types mirroring the unions in src/lib/types.ts
create type difficulty as enum ('Easy', 'Medium', 'Hard');

create type case_type as enum (
  'Guesstimate',
  'Profitability',
  'Market Entry',
  'M&A',
  'Operations',
  'Pricing',
  'Growth Strategy',
  'Cost Reduction'
);

create type industry as enum (
  'Consulting',
  'Healthcare',
  'Technology',
  'Finance',
  'Retail',
  'Manufacturing',
  'FMCG',
  'Education',
  'Energy',
  'Telecom'
);

create type material_category as enum ('Framework', 'Industry Note', 'Skill', 'Casebook');

create type file_type as enum ('PDF', 'Video', 'Article');

create type slot_location as enum ('NH', 'OH', 'Annexe', 'Library', 'LVH', 'Tagore');

create type weekday as enum (
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday'
);

create type booking_status as enum ('confirmed', 'cancelled');
