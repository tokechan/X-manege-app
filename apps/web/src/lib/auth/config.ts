/**
 * NextAuth Configuration
 * Handles authentication setup with Google OAuth and email links
 */

import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import EmailProvider from "next-auth/providers/email"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { createClient } from "@libsql/client"
import { drizzle } from "drizzle-orm/libsql"
import { users, accounts, sessions, verificationTokens } from "./schema"

// Database client for authentication
const client = createClient({
  url: process.env.DATABASE_URL || "file:local.db",
  authToken: process.env.TURSO_AUTH_TOKEN,
})

const db = drizzle(client, {
  schema: { users, accounts, sessions, verificationTokens }
})

export const authOptions: NextAuthOptions = {
  adapter: DrizzleAdapter(db),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: Number(process.env.EMAIL_SERVER_PORT),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
    }),
  ],

  session: {
    strategy: "database",
    maxAge: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 24 hours
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
    verifyRequest: "/auth/verify-request",
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`)
      return true
    },

    async session({ session, user }) {
      if (session.user && user) {
        (session.user as any).id = user.id
        // Add custom user fields if needed
      }
      return session
    },

    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
  },

  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        console.log(`New user registered: ${user.email}`)
        // Could send welcome email, create default preferences, etc.
      }
    },
  },

  debug: process.env.NODE_ENV === "development",
}
