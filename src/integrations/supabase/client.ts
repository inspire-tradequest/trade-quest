
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://qaddsyblirslplvkpnpv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhZGRzeWJsaXJzbHBsdmtwbnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA4NzE3MDYsImV4cCI6MjA1NjQ0NzcwNn0.sQCYSxL0CZG6h1Q1hsrv9EtRp4DuENdD4CMOTdpD0N8";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
