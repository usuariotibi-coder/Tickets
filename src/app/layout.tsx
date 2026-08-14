import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Centro de Asistencia TI",
  description: "Asistente del departamento de TI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="h-full">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
