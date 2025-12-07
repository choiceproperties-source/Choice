import { neon } from "@neondatabase/serverless";

async function inspectDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL not set");
    process.exit(1);
  }

  const sql = neon(url);
  
  try {
    // Get all tables
    const tables = await sql`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log("=== EXISTING TABLES IN SUPABASE ===");
    for (const table of tables) {
      const tableName = (table as any).table_name;
      console.log(`\n📋 TABLE: ${tableName}`);
      
      // Get columns for this table
      const columns = await sql`
        SELECT 
          column_name,
          data_type,
          is_nullable,
          column_default,
          character_maximum_length,
          numeric_precision,
          numeric_scale
        FROM information_schema.columns 
        WHERE table_name = ${tableName} AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      for (const col of columns) {
        const c = col as any;
        let colInfo = `  ${c.column_name}: ${c.data_type}`;
        if (c.character_maximum_length) colInfo += `(${c.character_maximum_length})`;
        if (c.numeric_precision) colInfo += `(${c.numeric_precision},${c.numeric_scale})`;
        colInfo += ` | nullable: ${c.is_nullable}`;
        if (c.column_default) colInfo += ` | default: ${c.column_default}`;
        console.log(colInfo);
      }
    }
    
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

inspectDatabase();
