import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { loginSchema } from '@/lib/validation/auth';
import { checkLoginRateLimit } from '@/lib/rate-limit';

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: '/login' },
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      authorize: async (raw) => {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const { email, password } = parsed.data;

        if (!checkLoginRateLimit(email)) return null;

        const user = await db.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        return { id: user.id, email: user.email };
      },
    }),
  ],
  callbacks: {
    jwt: ({ token, user }) => {
      if (user) token.userId = (user as { id: string }).id;
      return token;
    },
    session: ({ session, token }) => {
      if (token.userId && session.user) (session.user as { id: string }).id = token.userId as string;
      return session;
    },
  },
});

declare module 'next-auth' {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null; image?: string | null };
  }
}
