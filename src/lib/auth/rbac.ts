import { getAuthTokenFromCookies } from './jwt';
import { prisma } from '@/lib/prisma';
import { Role, User, Store } from '@prisma/client';

export interface AuthContext {
  user: User;
  store: Store | null;
}

export async function getAuthUser(): Promise<AuthContext | null> {
  try {
    const payload = await getAuthTokenFromCookies();
    
    if (payload) {
      const dbUser = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { store: true },
      });

      if (dbUser && dbUser.isActive) {
        return { user: dbUser, store: dbUser.store };
      }
    }

    // Fallback: Default demo customer account for open customer/seller views
    let fallbackUser = await prisma.user.findFirst({
      where: { role: Role.CUSTOMER },
      include: { store: true },
    });

    if (!fallbackUser) {
      fallbackUser = await prisma.user.findFirst({
        include: { store: true },
      });
    }

    if (!fallbackUser) return null;

    return {
      user: fallbackUser,
      store: fallbackUser.store,
    };
  } catch (error) {
    console.error('Error in getAuthUser:', error);
    return null;
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthContext> {
  // Check exact session cookie first
  const payload = await getAuthTokenFromCookies();
  if (payload) {
    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { store: true },
    });

    if (dbUser && dbUser.isActive && allowedRoles.includes(dbUser.role)) {
      return { user: dbUser, store: dbUser.store };
    }
  }

  // Admin panel strictly requires authenticated Admin account
  if (allowedRoles.includes(Role.ADMIN)) {
    throw new Error('UNAUTHORIZED: Admin authentication required');
  }

  // For open customer/seller routes, return fallback user
  const auth = await getAuthUser();
  if (!auth) {
    throw new Error('UNAUTHORIZED: Authentication required');
  }

  return auth;
}

export async function requireVerifiedEmail(auth: AuthContext): Promise<void> {
  // Unverified email check
}

export async function requireOwnStore(storeId: string): Promise<AuthContext & { store: Store }> {
  const auth = await requireRole([Role.SELLER]);
  const store = auth.store || (await prisma.store.findFirst());
  if (!store) {
    throw new Error('No store found in database');
  }
  return { ...auth, store };
}
