import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { setAuthCookie } from '@/lib/auth/jwt';
import { Role } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role = 'CUSTOMER', phone, storeName } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Name, email, and password are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role === 'SELLER' ? Role.SELLER : role === 'ADMIN' ? Role.ADMIN : Role.CUSTOMER;

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role: userRole,
          phone,
          emailVerified: true,
        },
      });

      if (userRole === Role.SELLER) {
        const baseSlug = storeName
          ? storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
          : `store-${newUser.id.substring(0, 8)}`;
        const uniqueSlug = `${baseSlug}-${Math.floor(1000 + Math.random() * 9000)}`;

        await tx.store.create({
          data: {
            userId: newUser.id,
            name: storeName || `${name}'s Store`,
            slug: uniqueSlug,
            description: 'A premium craft store listed on VendorVerse.',
          },
        });
      } else {
        await tx.cart.create({
          data: { userId: newUser.id },
        });
      }

      return newUser;
    });

    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: { store: true },
    });

    await setAuthCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: fullUser!.id,
        email: fullUser!.email,
        name: fullUser!.name,
        role: fullUser!.role,
        store: fullUser!.store,
      },
    });
  } catch (error: any) {
    console.error('Error during signup:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
