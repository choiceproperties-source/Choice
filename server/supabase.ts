import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "https://mock.supabase.co";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "mock-key-will-use-localStorage";

const isMockMode = !process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY;

if (isMockMode) {
  console.log("📦 Running in mock mode - using localStorage fallback");
  console.log("   To enable real database, set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
export { isMockMode };
