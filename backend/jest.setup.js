process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'test-key';
process.env.EVENT_SEED_REWARD = process.env.EVENT_SEED_REWARD || '5';

jest.spyOn(console, 'error').mockImplementation(() => {});
