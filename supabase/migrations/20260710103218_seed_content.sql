-- Seed cases/materials/approaches translated 1:1 from src/lib/mock-data.ts so
-- the app isn't empty right after migrating. created_by/author_id are left
-- NULL (nullable FKs) -- these aren't tied to real students. Comments keep
-- their author_name/author_year as literals matching the old mock data
-- exactly, since there's no real profile to snapshot from.
--
-- Deliberately NOT seeded: case_solves, material_downloads. Those represent
-- real per-student activity and should start at zero, not carry over the
-- old mock's flavor "isSolved"/count data. Peer Practice seed data (students
-- + availability slots) is handled separately by scripts/seed-dev-data.ts,
-- since availability_slots.profile_id requires a real auth.users row that
-- a SQL migration cannot create.

insert into public.cases
  (title, difficulty, type, industry, company, framework, casebook, description, estimated_time, tags, created_at)
values
  (
    'Starbucks India Profitability Decline', 'Medium', 'Profitability', 'Retail', 'BCG',
    array['Profitability Tree', 'MECE'], 'BCG Casebook 2023',
    'Starbucks India has seen a 15% decline in profitability over the last two quarters. The CEO has hired you to identify the root cause and recommend solutions.',
    30, array['profitability', 'retail', 'FMCG', 'India'], '2024-01-15'
  ),
  (
    'Estimate the number of ATMs in India', 'Easy', 'Guesstimate', 'Finance', 'McKinsey',
    array['Segmentation', 'Market Sizing'], null,
    'Your client wants to enter the ATM management business in India. Estimate the total number of ATMs currently operating across the country.',
    20, array['guesstimate', 'India', 'finance', 'market sizing'], '2024-01-10'
  ),
  (
    'Pharma Company Entry into Generics Market', 'Hard', 'Market Entry', 'Healthcare', 'Bain',
    array['Porter''s 5 Forces', 'BCG Matrix', 'Market Entry Framework'], 'Bain Casebook 2024',
    'A leading branded pharmaceutical company is considering entering the generics market. Should they enter? If yes, how?',
    45, array['market entry', 'healthcare', 'pharma', 'strategy'], '2024-02-01'
  ),
  (
    'Steel Plant Cost Reduction', 'Hard', 'Cost Reduction', 'Manufacturing', 'McKinsey',
    array['Value Chain Analysis', 'Cost Structure'], 'McKinsey Practice Cases',
    'A major steel manufacturer is facing margin pressure due to rising raw material costs. Identify areas to reduce costs by 20% without impacting quality.',
    40, array['operations', 'manufacturing', 'cost reduction'], '2024-02-10'
  ),
  (
    'Telecom Company Pricing Strategy', 'Medium', 'Pricing', 'Telecom', 'Deloitte',
    array['Pricing Framework', 'Competitor Analysis'], null,
    'A mid-sized telecom company wants to revamp its pricing strategy for 5G plans. How should they price their offerings?',
    35, array['pricing', 'telecom', '5G', 'strategy'], '2024-02-15'
  ),
  (
    'EdTech Startup Growth Strategy', 'Medium', 'Growth Strategy', 'Education', 'Oliver Wyman',
    array['Growth Levers', 'Ansoff Matrix'], null,
    'An EdTech startup with strong presence in Tier 1 cities wants to expand. What growth strategy should they pursue for the next 3 years?',
    35, array['growth', 'edtech', 'startup', 'India'], '2024-03-01'
  ),
  (
    'Merger of Two Insurance Giants', 'Hard', 'M&A', 'Finance', 'Bain',
    array['Synergy Analysis', 'Due Diligence', 'Integration Planning'], 'Bain Casebook 2024',
    'Two of India''s largest insurance companies are considering a merger. Evaluate the strategic rationale and potential synergies.',
    50, array['M&A', 'insurance', 'finance', 'synergy'], '2024-03-05'
  ),
  (
    'Hospital Supply Chain Optimization', 'Easy', 'Operations', 'Healthcare', 'AT Kearney',
    array['Supply Chain Framework', 'Process Mapping'], null,
    'A chain of private hospitals is facing frequent stockouts of critical medicines. Optimize their supply chain to reduce stockouts by 80%.',
    25, array['operations', 'healthcare', 'supply chain'], '2024-03-10'
  );

insert into public.case_comments (case_id, author_name, author_year, approach_title, content, created_at)
select id, 'Arjun Sharma', 2, 'Top-down profitability tree',
  'I started by breaking down profitability into Revenue and Costs. On the revenue side, I found that Average Transaction Value had dropped 12% due to menu price sensitivity. On costs, raw material costs had risen 8% due to arabica bean prices.',
  '2024-03-12'
from public.cases where title = 'Starbucks India Profitability Decline';

insert into public.case_comments (case_id, author_name, author_year, approach_title, content, created_at)
select id, 'Priya Mehta', 1, 'Segmentation by store type',
  'I took a different angle -- I segmented by store format (standalone vs mall vs drive-through) and found that mall stores were the main drag due to high rentals and lower footfall post-COVID.',
  '2024-03-13'
from public.cases where title = 'Starbucks India Profitability Decline';

insert into public.materials
  (title, description, category, file_type, uploaded_by_label, tags, created_at)
values
  (
    'Profitability Framework - Complete Guide',
    'Comprehensive guide to breaking down profitability cases with practice examples and common pitfalls.',
    'Framework', 'PDF', 'Consulting Club', array['profitability', 'framework', 'beginner'], '2024-01-05'
  ),
  (
    'Indian Healthcare Industry Overview 2024',
    'Deep dive into India''s healthcare sector -- market size, key players, trends, and regulatory landscape.',
    'Industry Note', 'PDF', 'Consulting Club', array['healthcare', 'India', 'industry'], '2024-01-20'
  ),
  (
    'Case Interview Communication Skills',
    'How to structure your communication, handle curveballs, and present recommendations confidently.',
    'Skill', 'Video', 'Alumni Network', array['communication', 'soft skills', 'interview'], '2024-02-05'
  ),
  (
    'Market Entry Framework Masterclass',
    'End-to-end framework for approaching market entry cases with real examples from MBB interviews.',
    'Framework', 'PDF', 'Consulting Club', array['market entry', 'framework', 'advanced'], '2024-02-15'
  ),
  (
    'IIM Calcutta Consult Club Casebook 2024',
    'Official IIMC Consult Club casebook with 30+ cases across all difficulty levels and types.',
    'Casebook', 'PDF', 'Consulting Club', array['casebook', 'official', 'all types'], '2024-03-01'
  ),
  (
    'Guesstimate 50 -- Practice Problems',
    '50 guesstimate problems with detailed solutions and estimation techniques used by top consultants.',
    'Framework', 'PDF', 'Consulting Club', array['guesstimate', 'practice', 'market sizing'], '2024-03-10'
  );
