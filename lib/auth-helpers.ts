import { getServerSession } from 'next-auth';
import authOptions from '@/lib/auth';
import { UserRole } from '@prisma/client';

type AuthedSession = {
  user: {
    id: string;
    role: string;
    email?: string | null;
    name?: string | null;
  };
};

export async function requireAuth(): Promise<AuthedSession | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  return { user: { ...(session.user as AuthedSession['user']) } };
}

export async function requireRole(role: UserRole) {
  const session = await requireAuth();
  if (!session) return null;
  if (session.user.role !== role) return null;
  return session;
}
