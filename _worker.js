const CACHE_TTL = 300;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Expose-Headers': 'Content-Length, Content-Type, X-Temporary-Cache'
  };
}

function json(message, status = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...corsHeaders() }
  });
}

function isBlockedHostname(hostname) {
  const host = hostname.toLowerCase().replace(/\.$/, '');
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) return true;
  if (/^(10|127|169\.254|192\.168)\./.test(host)) return true;
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return true;
  if (host === '::1' || host.startsWith('fc') || host.startsWith('fd') || host.startsWith('fe80:')) return true;
  return false;
}

function isAllowedRemoteUrl(value) {
  try {
    const url = new URL(value);
    return (url.protocol === 'https:' || url.protocol === 'http:') && !isBlockedHostname(url.hostname);
  } catch {
    return false;
  }
}

async function imageProxy(request, ctx) {
  if (request.method === 'OPTIONS') return new Response(null, { headers: corsHeaders() });
  if (request.method !== 'GET') return json('Only GET requests are supported.', 405);

  const requestUrl = new URL(request.url);
  const target = requestUrl.searchParams.get('url');
  if (!target || !isAllowedRemoteUrl(target)) return json('Please provide a valid public image URL.', 400);

  const cacheKey = new Request(`${requestUrl.origin}/api/image?url=${encodeURIComponent(target)}`);
  const cached = await caches.default.match(cacheKey);
  if (cached) return cached;

  let remote;
  try {
    const targetOrigin = new URL(target).origin;
    remote = await fetch(target, {
      redirect: 'follow',
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'User-Agent': 'Mozilla/5.0 (compatible; PlatkaImageConverter/1.0)',
        Referer: targetOrigin
      }
    });
  } catch {
    return json('The image source could not be reached.', 502);
  }
  if (!remote.ok) return json(`The image source returned HTTP ${remote.status}. It may block proxy requests.`, 502);
  const contentType = remote.headers.get('content-type') || '';
  const contentLength = Number(remote.headers.get('content-length') || 0);
  if (!contentType.toLowerCase().startsWith('image/')) return json('The URL does not point to an image.', 415);
  if (contentLength > MAX_IMAGE_BYTES) return json('The image is larger than the 25 MB limit.', 413);

  const headers = new Headers(remote.headers);
  headers.set('Cache-Control', `public, max-age=${CACHE_TTL}`);
  headers.set('X-Temporary-Cache', `${CACHE_TTL} seconds`);
  Object.entries(corsHeaders()).forEach(([key, value]) => headers.set(key, value));
  const response = new Response(remote.body, { status: 200, headers });
  ctx.waitUntil(caches.default.put(cacheKey, response.clone()));
  return response;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/image') return imageProxy(request, ctx);
    return env.ASSETS.fetch(request);
  }
};
