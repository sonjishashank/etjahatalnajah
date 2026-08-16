import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { query } from '../../../lib/db'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Check if user exists in database
        const existingUser = await query(
          'SELECT * FROM users WHERE email = ?',
          [user.email]
        );

        if (existingUser.length === 0) {
          // Create new user
          await query(
            'INSERT INTO users (email, name, role) VALUES (?, ?, ?)',
            [user.email, user.name, 'user']
          );
        }
        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        
        // If it's a connection error, try to reset the pool
        if (error.code === 'ER_TOO_MANY_USER_CONNECTIONS') {
          console.log('Too many connections detected, resetting connection pool...');
          try {
            const { closePool } = await import('../../../lib/db');
            await closePool();
            console.log('Connection pool reset successfully');
          } catch (resetError) {
            console.error('Error resetting connection pool:', resetError);
          }
        }
        return false;
      }
    },
    async session({ session, token }) {
      try {
        const userResult = await query(
          'SELECT id, role, designation FROM users WHERE email = ?',
          [session.user.email]
        );

        if (userResult.length > 0) {
          session.user.id = userResult[0].id;
          session.user.role = userResult[0].role;
          session.user.designation = userResult[0].designation;
        }
        return session;
      } catch (error) {
        console.error('Session error:', error);
        return session;
      }
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
}

export default NextAuth(authOptions)