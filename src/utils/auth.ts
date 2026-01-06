// Authentication utilities

export async function hashPassword(password: string): Promise<string> {
  // Simple hash for MVP - in production use bcrypt
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

export async function generateJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const token = `${encodedHeader}.${encodedPayload}`;
  
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const keyData = encoder.encode(secret);
  
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)));
  
  return `${token}.${encodedSignature}`;
}

export async function verifyJWT(token: string, secret: string): Promise<any> {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    
    const tokenToVerify = `${encodedHeader}.${encodedPayload}`;
    const encoder = new TextEncoder();
    const data = encoder.encode(tokenToVerify);
    const keyData = encoder.encode(secret);
    
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = new Uint8Array(
      atob(encodedSignature).split('').map(c => c.charCodeAt(0))
    );
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    
    if (!isValid) {
      throw new Error('Invalid signature');
    }
    
    const payload = JSON.parse(atob(encodedPayload));
    
    // Check expiration
    if (payload.exp && payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateTrackingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
