import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      || 'https://ygoxhjemowubyfzfbumf.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_NUyGPE4L8ZVmaQRCeR_Ufg_k2Dy-G8c';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
