
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_SERVICE_URL = "https://ai.inspirecreations.it.com";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the JWT token from the request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // Get the user from the JWT token
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Error getting user');
    }

    // Get the request body
    const requestData = await req.json();
    const { riskTolerance, investmentGoals, timeHorizon, currentPortfolio } = requestData;

    // Log the request in the database
    const { data: logData, error: logError } = await supabaseClient
      .from('ai_analysis_requests')
      .insert({
        user_id: user.id,
        request_type: 'investment_recommendations',
        request_data: requestData,
        status: 'processing'
      })
      .select()
      .single();

    if (logError) {
      console.error('Error logging request:', logError);
    }

    const requestId = logData?.id;

    // Make request to AI service
    const aiResponse = await fetch(`${AI_SERVICE_URL}/recommendations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: user.id,
        riskTolerance,
        investmentGoals,
        timeHorizon,
        currentPortfolio
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI service responded with ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Update the log with the response
    if (requestId) {
      await supabaseClient
        .from('ai_analysis_requests')
        .update({
          status: 'completed',
          response_data: aiData,
          completed_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    // Save the recommendation to the database
    const { error: saveError } = await supabaseClient
      .from('ai_recommendations')
      .insert({
        user_id: user.id,
        recommendation_type: 'investment',
        content: aiData
      });

    if (saveError) {
      console.error('Error saving recommendation:', saveError);
    }

    return new Response(JSON.stringify(aiData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in investment-recommendations function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
