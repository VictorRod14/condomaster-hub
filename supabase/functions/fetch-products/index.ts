import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const limit = url.searchParams.get('limit') || '30';
    const category = url.searchParams.get('category');
    const search = url.searchParams.get('search');

    let apiUrl = 'https://dummyjson.com/products';
    
    if (search) {
      apiUrl += `/search?q=${encodeURIComponent(search)}&limit=${limit}`;
    } else if (category && category !== 'all') {
      apiUrl += `/category/${encodeURIComponent(category)}?limit=${limit}`;
    } else {
      apiUrl += `?limit=${limit}`;
    }

    console.log('Fetching products from:', apiUrl);

    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      throw new Error(`DummyJSON API error: ${response.status}`);
    }

    const data = await response.json();

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
