import { NextRequest, NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { prisma } from '@/lib/prisma';
import { setAuthCookie } from '@/lib/auth/jwt';
import { Role } from '@prisma/client';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: NextRequest) {
  try {
    const { credential, role = 'CUSTOMER' } = await request.json();

    if (!credential) {
      return NextResponse.json({ error: 'Google credential token is required' }, { status: 400 });
    }

    // Verify Google ID token
    let googleUser;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      googleUser = ticket.getPayload();
    } catch {
      // Fallback: fetch user info directly from Google userinfo API
      const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
      if (googleRes.ok) {
        googleUser = await googleRes.json();
      }
    }

    if (!googleUser || !googleUser.email) {
      return NextResponse.json({ error: 'Failed to verify Google token' }, { status: 401 });
    }

    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || googleUser.given_name || 'Google User';
    const avatar = googleUser.picture || null;

    let user = await prisma.user.findUnique({
      where: { email },
      include: { store: true },
    });

    if (!user) {
      const userRole = role === 'SELLER' ? Role.SELLER : Role.CUSTOMER;

      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          avatar,
          role: userRole,
          emailVerified: true,
        },
      });

      if (userRole === Role.SELLER) {
        const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

        await prisma.store.create({
          data: {
            userId: newUser.id,
            name: `${name}'s Store`,
            slug: uniqueSlug,
            description: 'A premium craft store listed on VendorVerse.',
          },
        });
      } else {
        await prisma.cart.create({
          data: { userId: newUser.id },
        });
      }

      user = await prisma.user.findUnique({
        where: { id: newUser.id },
        include: { store: true },
      });
    }

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 });
    }

    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        store: user.store,
      },
    });
  } catch (error: any) {
    console.error('Error in Google OAuth route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
