import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

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
          const user = await prisma.user.findUnique({ where: { email } });
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
        const allowed = await prisma.allowedEmail.findUnique({ where: { email } });
        if (!allowed) return null;

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.role === "staff") return null; // staff usa contraseña

        const user =
          existing ??
          (await prisma.user.create({
            data: {
              email,
              name: email.split("@")[0],
              role: "user",
              password: null,
            },
          }));

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
