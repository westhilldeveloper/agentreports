import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import sql from './db';

export const authOptions = {
  providers: [
    // Admin Login
    CredentialsProvider({
      id: 'admin-credentials',
      name: 'Admin',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
  try {
    console.log('🔐 Admin login attempt:', credentials.email);

    const users = await sql`
      SELECT * FROM admin_users WHERE email = ${credentials.email}
    `;
    console.log('📦 Query result:', users);

    const user = users[0];
    if (!user) {
      console.log('❌ User not found');
      throw new Error('Admin not found');
    }

    console.log('👤 Found user:', user.email);
    console.log('🔑 Hash from DB:', user.password_hash);

    const isValid = await bcrypt.compare(credentials.password, user.password_hash);
    console.log('✅ Password valid?', isValid);

    if (!isValid) {
      console.log('❌ Invalid password');
      throw new Error('Invalid password');
    }

    console.log('🎉 Login successful');
    return { id: user.id, email: user.email, role: 'admin' };
  } catch (error) {
    console.error('🔥 Auth error:', error.message);
    throw new Error(error.message);
  }
},
    }),
    // Agent OTP Login
    CredentialsProvider({
      id: 'agent-otp',
      name: 'Agent OTP',
      credentials: {
        email: { label: 'Email', type: 'email' },
        otp: { label: 'OTP', type: 'text' },
      },
      async authorize(credentials) {
        try {
          const { email, otp } = credentials;
          // Find valid OTP
          const otps = await sql`
            SELECT * FROM agent_otps 
            WHERE email = ${email} 
            AND otp = ${otp} 
            AND used = FALSE 
            AND expires_at > NOW()
            ORDER BY created_at DESC 
            LIMIT 1
          `;
          if (otps.length === 0) throw new Error('Invalid or expired OTP');

          // Mark OTP as used
          await sql`UPDATE agent_otps SET used = TRUE WHERE id = ${otps[0].id}`;

          // Find or create agent
          let agents = await sql`SELECT * FROM agents WHERE email = ${email}`;
          let agent = agents[0];

          if (!agent) {
            // Auto-create if doesn't exist (fallback for signup)
            const code = `AG-${Date.now().toString().slice(-6)}`;
            const newAgents = await sql`
              INSERT INTO agents (agent_code, name, phone, email) 
              VALUES (${code}, ${email.split('@')[0]}, 'NA', ${email}) 
              RETURNING *
            `;
            agent = newAgents[0];
          }

          return { id: agent.id, email: agent.email, name: agent.name, role: 'agent' };
        } catch (error) {
          throw new Error(error.message);
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.email = token.email;
      session.user.name = token.name;
      return session;
    },
  },
  pages: {
    signIn: '/signin',
    signOut: '/',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);