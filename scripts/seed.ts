import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Missing Supabase credentials. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedProperties() {
  try {
    console.log('🌱 Starting data seeding...');

    // Read properties JSON
    const propertiesPath = path.join(__dirname, '../client/src/data/properties.json');
    const propertiesData = JSON.parse(fs.readFileSync(propertiesPath, 'utf-8'));

    // Transform properties for Supabase (remove owner object, keep owner_id)
    const transformedProperties = propertiesData.map((prop: any) => ({
      id: prop.id,
      owner_id: prop.owner_id,
      title: prop.title,
      price: prop.price,
      address: prop.address,
      city: prop.city,
      state: prop.state,
      zip: prop.zip,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      sqft: prop.sqft,
      year_built: prop.year_built,
      description: prop.description,
      features: prop.features,
      type: prop.type,
      location: prop.location,
      images: prop.images,
      featured: prop.featured,
      listing_type: prop.listing_type,
      application_fee: prop.application_fee || null,
      property_tax_annual: prop.property_tax_annual || null,
      hoa_fee_monthly: prop.hoa_fee_monthly || null,
      status: prop.status || 'available',
      pet_friendly: prop.pet_friendly || false,
      furnished: prop.furnished || false,
      amenities: prop.amenities || []
    }));

    // Insert properties
    const { data, error } = await supabase
      .from('properties')
      .insert(transformedProperties)
      .select();

    if (error) {
      console.error('❌ Error inserting properties:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully seeded ${data?.length || transformedProperties.length} properties!`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedProperties();
