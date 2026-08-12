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
    if (!payload) return null;

    const dbUser = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { store: true },
    });

    if (!dbUser || !dbUser.isActive) return null;

    return {
      user: dbUser,
      store: dbUser.store,
    };
  } catch (error) {
    console.error('Error in getAuthUser:', error);
    return null;
  }
}

export async function requireRole(allowedRoles: Role[]): Promise<AuthContext> {
  const auth = await getAuthUser();

  if (!auth) {
    throw new Error('UNAUTHORIZED: Authentication required to access this resource');
  }

  if (!auth.user.isActive) {
    throw new Error('FORBIDDEN: User account is inactive');
  }

  if (!allowedRoles.includes(auth.user.role)) {
    throw new Error(`FORBIDDEN: Requires one of these roles: ${allowedRoles.join(', ')}`);
  }

  return auth;
}

export async function requireVerifiedEmail(auth: AuthContext): Promise<void> {
  if (auth.user.role === Role.SELLER && !auth.user.emailVerified) {
    throw new Error('UNVERIFIED_EMAIL: Email verification is required before accessing seller store features');
  }
}

export async function requireOwnStore(storeId: string): Promise<AuthContext & { store: Store }> {
  const auth = await requireRole([Role.SELLER, Role.ADMIN]);

  if (!auth.store) {
    throw new Error('FORBIDDEN: Seller does not have an active store profile created yet');
  }

  if (auth.user.role !== Role.ADMIN && auth.store.id !== storeId) {
    throw new Error('FORBIDDEN: You do not own this store');
  }

  return auth as AuthContext & { store: Store };
}
