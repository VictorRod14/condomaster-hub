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
    const { city } = await req.json();

    if (!city) {
      return new Response(
        JSON.stringify({ error: 'Cidade é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('OPENWEATHER_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Consulta a API do OpenWeather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric&lang=pt_br`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ error: 'Cidade não encontrada' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error('Erro ao consultar clima');
    }

    const data = await response.json();

    return new Response(
      JSON.stringify({
        city: data.name,
        country: data.sys.country,
        temperature: Math.round(data.main.temp),
        feels_like: Math.round(data.main.feels_like),
        temp_min: Math.round(data.main.temp_min),
        temp_max: Math.round(data.main.temp_max),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        wind_speed: data.wind.speed,
        clouds: data.clouds.all,
        sunrise: data.sys.sunrise,
        sunset: data.sys.sunset
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in get-weather function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
