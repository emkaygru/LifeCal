import { kv } from '@vercel/kv';
import { Redis } from '@upstash/redis';

// Initialize Redis client - try KV first, fallback to Redis URL
let redis;
try {
  redis = kv;
} catch (e) {
  // Fallback to Redis URL if KV not available
  if (process.env.REDIS_URL) {
    redis = Redis.fromEnv();
  }
}

const ALLOWED_ORIGINS = [
  'https://life-nqv4ymdmo-emilys-projects-9f8716f7.vercel.app',
  'https://life-ahkdmc4rg-emilys-projects-9f8716f7.vercel.app',
  'https://life-jwdmzfiqj-emilys-projects-9f8716f7.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

export default async function handler(request) {
  // CORS headers
  const origin = request.headers.get('origin');
  const corsHeaders = {
    'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const dataType = url.searchParams.get('type'); // todos, meals, parking, people

    if (request.method === 'GET') {
      // Get data from KV
      const data = await redis.get(`lifecal:${dataType}`) || [];
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (request.method === 'POST') {
      const body = await request.json();
      
      if (action === 'sync') {
        // Full sync - replace all data
        await redis.set(`lifecal:${dataType}`, body.data);
        
        // Also store timestamp for conflict resolution
        await redis.set(`lifecal:${dataType}:updated`, Date.now());
        
        return new Response(JSON.stringify({ success: true, timestamp: Date.now() }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'add') {
        // Add single item
        const existing = await redis.get(`lifecal:${dataType}`) || [];
        const updated = [...existing, body.item];
        await redis.set(`lifecal:${dataType}`, updated);
        await redis.set(`lifecal:${dataType}:updated`, Date.now());
        
        return new Response(JSON.stringify({ success: true, data: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'update') {
        // Update single item
        const existing = await redis.get(`lifecal:${dataType}`) || [];
        const updated = existing.map(item => 
          item.id === body.item.id ? { ...item, ...body.item } : item
        );
        await redis.set(`lifecal:${dataType}`, updated);
        await redis.set(`lifecal:${dataType}:updated`, Date.now());
        
        return new Response(JSON.stringify({ success: true, data: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (action === 'delete') {
        // Delete single item
        const existing = await redis.get(`lifecal:${dataType}`) || [];
        const updated = existing.filter(item => item.id !== body.id);
        await redis.set(`lifecal:${dataType}`, updated);
        await redis.set(`lifecal:${dataType}:updated`, Date.now());
        
        return new Response(JSON.stringify({ success: true, data: updated }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Sync API error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}