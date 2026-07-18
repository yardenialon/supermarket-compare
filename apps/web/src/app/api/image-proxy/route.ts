import { NextRequest, NextResponse } from 'next/server';

const SECRET = process.env.IMG_PROXY_SECRET || 'savy-img-secret-2024';

function encodeUrl(url: string): string {

  return Buffer.from(url).toString('base64url');

}

function decodeUrl(encoded: string): string {

  return Buffer.from(encoded, 'base64url').toString('utf-8');

}

export async function GET(req: NextRequest) {

  const { searchParams } = new URL(req.url);

  const encoded = searchParams.get('u');

  if (!encoded) {

    return new NextResponse('Missing parameter', { status: 400 });

  }

  let originalUrl: string;

  try {

    originalUrl = decodeUrl(encoded);

  } catch {

    return new NextResponse('Invalid parameter', { status: 400 });

  }

  // רק דומיינים מורשים

  const allowedDomains = [

    'img.rami-levy.co.il',

    'res.cloudinary.com',

    'superpharmstorage.blob.core.windows.net',

    

    'd226b0iufwcjmj.cloudfront.net',

    'noyhasade.b-cdn.net',

    'imageproxy.wolt.com',

    'images.shufersal.co.il',

    'storage.googleapis.com',

  ];

  try {

    const urlObj = new URL(originalUrl);

    const allowed = allowedDomains.some(d => urlObj.hostname.includes(d));

    if (!allowed) {

      return new NextResponse('Domain not allowed', { status: 403 });

    }

  } catch {

    return new NextResponse('Invalid URL', { status: 400 });

  }

  try {

    const response = await fetch(originalUrl, {

      headers: {

        'User-Agent': 'Mozilla/5.0 (compatible; Savy/1.0)',

        'Referer': 'https://savy.co.il',

      },

      signal: AbortSignal.timeout(8000),

    });

    if (!response.ok) {

      return new NextResponse('Image not found', { status: 404 });

    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    const buffer = await response.arrayBuffer();

    return new NextResponse(buffer, {

      headers: {

        'Content-Type': contentType,

        'Cache-Control': 'public, max-age=86400',

        // הגנות

        'Content-Disposition': 'inline',

        'X-Content-Type-Options': 'nosniff',

        'X-Robots-Tag': 'noindex',

        // מונע hotlinking

        'Access-Control-Allow-Origin': 'https://savy.co.il',

      },

    });

  } catch (e) {

    return new NextResponse('Failed to fetch image', { status: 502 });

  }

}

