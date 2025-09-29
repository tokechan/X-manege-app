/**
 * NextAuth Client Configuration
 * Client-side authentication utilities
 */

import { signIn, signOut, getSession, useSession } from "next-auth/react"
import type { Session } from "next-auth"

// Re-export NextAuth functions
export { signIn, signOut, getSession, useSession }

// Type exports for client components
export type { Session }
