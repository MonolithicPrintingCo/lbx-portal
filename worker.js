/**
 * LBX Order Proxy — Cloudflare Worker
 * 
 * This worker acts as a secure middleman between the public order portal
 * and the Base44 backend. The BASE44_TOKEN secret never reaches the browser.
 * 
 * Free tier: 100,000 requests/day — more than enough for order submissions.
 */

const BASE44_URL = 'https://base44.app/api/apps/69b379d07fc1c9e2a98e71ad/entities/Order';

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return new Response('Invalid JSON', { status: 400 });
    }

    // Basic spam guard
    if (!body.customer_email || !body.customer_first_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // Forward to Base44 with the secret token
    const b44Res = await fetch(BASE44_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.BASE44_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const data = await b44Res.json();

    return new Response(JSON.stringify(data), {
      status: b44Res.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  },
};
