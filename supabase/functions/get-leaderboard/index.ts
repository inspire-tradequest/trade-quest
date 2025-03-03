
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
    const { userId, timeframe, category } = await req.json();

    // Determine time range based on timeframe
    let timeFilter = '';
    const now = new Date();
    if (timeframe === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      timeFilter = `AND created_at > '${weekAgo.toISOString()}'`;
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      timeFilter = `AND created_at > '${monthAgo.toISOString()}'`;
    } else {
      // 'alltime' - no time filter
      timeFilter = '';
    }

    // Determine query based on category
    let query = '';
    if (category === 'experience') {
      query = `
        SELECT 
          p.id,
          p.username,
          p.avatar_url,
          p.level,
          p.experience_points as performance_score,
          p.top_asset,
          COALESCE(t.trades_count, 0) as trades_count,
          COALESCE(t.win_rate, 0) as win_rate,
          (p.id = '${userId}') as is_current_user,
          ROW_NUMBER() OVER (ORDER BY p.experience_points DESC) as rank
        FROM profiles p
        LEFT JOIN (
          SELECT 
            user_id, 
            COUNT(*) as trades_count,
            AVG(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as win_rate
          FROM trading_history
          WHERE 1=1 ${timeFilter}
          GROUP BY user_id
        ) t ON p.id = t.user_id
        ORDER BY p.experience_points DESC
        LIMIT 20
      `;
    } else if (category === 'trades') {
      query = `
        SELECT 
          p.id,
          p.username,
          p.avatar_url,
          p.level,
          p.experience_points,
          p.top_asset,
          COALESCE(t.trades_count, 0) as performance_score,
          COALESCE(t.win_rate, 0) as win_rate,
          (p.id = '${userId}') as is_current_user,
          ROW_NUMBER() OVER (ORDER BY t.trades_count DESC) as rank
        FROM profiles p
        LEFT JOIN (
          SELECT 
            user_id, 
            COUNT(*) as trades_count,
            AVG(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as win_rate
          FROM trading_history
          WHERE 1=1 ${timeFilter}
          GROUP BY user_id
        ) t ON p.id = t.user_id
        WHERE t.trades_count > 0
        ORDER BY t.trades_count DESC
        LIMIT 20
      `;
    } else {
      // Default: performance
      query = `
        SELECT 
          p.id,
          p.username,
          p.avatar_url,
          p.level,
          p.experience_points,
          p.top_asset,
          COALESCE(t.trades_count, 0) as trades_count,
          COALESCE(t.win_rate, 0) as win_rate,
          COALESCE(ps.performance_score, 0) as performance_score,
          (p.id = '${userId}') as is_current_user,
          ROW_NUMBER() OVER (ORDER BY ps.performance_score DESC) as rank
        FROM profiles p
        LEFT JOIN (
          SELECT 
            user_id, 
            COUNT(*) as trades_count,
            AVG(CASE WHEN profit > 0 THEN 1 ELSE 0 END) as win_rate
          FROM trading_history
          WHERE 1=1 ${timeFilter}
          GROUP BY user_id
        ) t ON p.id = t.user_id
        LEFT JOIN (
          SELECT
            user_id,
            SUM(profit_percentage) as performance_score
          FROM trading_history
          WHERE 1=1 ${timeFilter}
          GROUP BY user_id
        ) ps ON p.id = ps.user_id
        WHERE ps.performance_score > 0
        ORDER BY ps.performance_score DESC
        LIMIT 20
      `;
    }

    // Execute query
    const { data, error } = await supabaseClient.rpc('execute_sql', { query_text: query });

    if (error) {
      throw error;
    }

    // Make sure current user is in the leaderboard if they have activity
    // This could be enhanced to add the current user's position if they're not in the top 20
    let userInLeaderboard = false;
    if (data) {
      for (const entry of data) {
        if (entry.id === userId) {
          userInLeaderboard = true;
          break;
        }
      }
    }

    return new Response(JSON.stringify(data || []), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in get-leaderboard function:', error);
    
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
