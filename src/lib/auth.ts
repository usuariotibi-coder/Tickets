import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { query, queryOne } from "@/lib/db";

type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string | null;
  role: string;
  department: string | null;
};

type AllowedEmailRow = {
  id: string;
  email: string;
  note: string | null;
  createdAt: Date;
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Correo", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email) return null;
        const email = credentials.email.toLowerCase().trim();

        // Acceso de staff: correo + contraseña
        if (credentials.password) {
          const user = await queryOne<UserRow>(
            'SELECT * FROM "User" WHERE email = $1',
            [email]
          );
          if (!user?.password) return null;
          const valid = await bcrypt.compare(credentials.password, user.password);
          if (!valid) return null;
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        // Acceso de usuarios: solo correo, debe estar en la lista blanca
        const allowed = await queryOne<AllowedEmailRow>(
          'SELECT * FROM "AllowedEmail" WHERE email = $1',
          [email]
        );
        if (!allowed) return null;

        const existing = await queryOne<UserRow>(
          'SELECT * FROM "User" WHERE email = $1',
          [email]
        );
        if (existing && existing.role === "staff") return null; // staff usa contraseña

        let user = existing;
        if (!user) {
          const rows = await query<UserRow>(
            `INSERT INTO "User" (email, name, role, password) VALUES ($1, $2, 'user', NULL) RETURNING *`,
            [email, email.split("@")[0]]
          );
          user = rows[0];
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id: string }).id = token.id as string;
        (session.user as { role: string }).role = token.role as string;
      }
      return session;
    },
  },
};