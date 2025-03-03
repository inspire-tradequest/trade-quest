
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
    const { userId, tag } = await req.json();

    // Build the query based on tag filter
    let query = `
      SELECT 
        fp.id,
        fp.user_id,
        fp.title,
        fp.content,
        fp.created_at,
        fp.updated_at,
        fp.tags,
        p.username,
        p.avatar_url,
        COALESCE(likes.count, 0) as likes_count,
        COALESCE(comments.count, 0) as comments_count,
        EXISTS (
          SELECT 1 FROM forum_post_likes fpl 
          WHERE fpl.post_id = fp.id AND fpl.user_id = '${userId}'
        ) as is_liked_by_user
      FROM forum_posts fp
      JOIN profiles p ON fp.user_id = p.id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as count
        FROM forum_post_likes
        GROUP BY post_id
      ) likes ON fp.id = likes.post_id
      LEFT JOIN (
        SELECT post_id, COUNT(*) as count
        FROM forum_comments
        GROUP BY post_id
      ) comments ON fp.id = comments.post_id
    `;
    
    // Add tag filter if provided
    if (tag) {
      query += ` WHERE '${tag}' = ANY(fp.tags)`;
    }
    
    // Add ordering
    query += ` ORDER BY fp.created_at DESC LIMIT 50`;

    // Execute query
    const { data, error } = await supabaseClient.rpc('execute_sql', { query_text: query });

    if (error) {
      throw error;
    }

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-forum-posts function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
