import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8'

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

Deno.serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create bucket if it doesn't exist
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) throw listError

    const bucketExists = buckets?.some(b => b.name === 'qr-images')
    
    if (!bucketExists) {
      const { data, error } = await supabase.storage.createBucket('qr-images', {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        fileSizeLimit: 5242880 // 5MB
      })
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({ message: 'Bucket created successfully', data }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    return new Response(
      JSON.stringify({ message: 'Bucket already exists' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
