// src/supabaseClient.jsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

supabase.auth.onAuthStateChange((event, session) => {
  if (session) {
    localStorage.setItem('supabase.auth.token', session.access_token);
    localStorage.setItem('user', JSON.stringify(session.user));
  } else {
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('user');
  }
});
