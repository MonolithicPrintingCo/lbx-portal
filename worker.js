/**
 * LBX Order Proxy — Cloudflare Worker
 * 
 * Routes:
 *   POST /           → forward order to Base44
 *   GET  /ss/products?styleID=N  → proxy S&S product/color data
 */

const BASE44_URL = 'https://base44.app/api/apps/69b379d07fc1c9e2a98e71ad/entities/Order';
const SS_BASE    = 'https://api.ssactivewear.com/v2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS });
    }

    // ── GET /ss/products?styleID=N ──────────────────────────────────────────
    if (request.method === 'GET' && url.pathname === '/ss/products') {
      const styleID = url.searchParams.get('styleID');
      if (!styleID) return new Response('Missing styleID', { status: 400, headers: CORS });

      const creds = btoa(`${env.SS_ACCOUNT_NUMBER}:${env.SS_API_KEY}`);
      const ssUrl = `${SS_BASE}/products/?styleID=${encodeURIComponent(styleID)}&fields=styleID,styleName,brandName,colorName,colorCode,colorFamilyID,colorFamily,color1,color2,colorSwatchImage,colorFrontImage,colorBackImage,colorDirectSideImage,colorOnModelFrontImage,sizeName,sizeOrder,piecePrice,customerPrice,qty`;

      const ssRes = await fetch(ssUrl, {
        headers: {
          'Authorization': `Basic ${creds}`,
          'Accept': 'application/json',
        },
      });

      const data = await ssRes.text();
      return new Response(data, {
        status: ssRes.status,
        headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
      });
    }

    // ── POST / → submit order to Base44 ────────────────────────────────────
    if (request.method === 'POST' && url.pathname === '/') {
      let body;
      try { body = await request.json(); } catch { return new Response('Invalid JSON', { status: 400, headers: CORS }); }

      if (!body.customer_email || !body.customer_first_name) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400, headers: { ...CORS, 'Content-Type': 'application/json' },
        });
      }

      const b44Res = await fetch(BASE44_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.BASE44_TOKEN}` },
        body: JSON.stringify(body),
      });

      const data = await b44Res.json();
      return new Response(JSON.stringify(data), {
        status: b44Res.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }

    return new Response('Not found', { status: 404, headers: CORS });
  },
};
