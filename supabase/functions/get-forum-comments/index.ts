
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      throw new Error('Error getting user');
    }

    // Get request parameters
    const { userId, postId } = await req.json();

    // Build the query
    const query = `
      SELECT 
        fc.id,
        fc.post_id,
        fc.user_id,
        fc.content,
        fc.created_at,
        p.username,
        p.avatar_url,
        COALESCE(likes.count, 0) as likes_count,
        EXISTS (
          SELECT 1 FROM forum_comment_likes fcl 
          WHERE fcl.comment_id = fc.id AND fcl.user_id = '${userId}'
        ) as is_liked_by_user
      FROM forum_comments fc
      JOIN profiles p ON fc.user_id = p.id
      LEFT JOIN (
        SELECT comment_id, COUNT(*) as count
        FROM forum_comment_likes
        GROUP BY comment_id
      ) likes ON fc.id = likes.comment_id
      WHERE fc.post_id = '${postId}'
      ORDER BY fc.created_at ASC
    `;

    // Execute query
    const { data, error } = await supabaseClient.rpc('execute_sql', { query_text: query });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-forum-comments function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
