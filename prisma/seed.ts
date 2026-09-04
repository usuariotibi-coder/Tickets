import "dotenv/config";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || "admin@ti.local";
  const adminPassword = process.env.ADMIN_PASSWORD || "admin1234";
  const adminName = process.env.ADMIN_NAME || "Administrador TI";

  const password = await bcrypt.hash(adminPassword, 10);
  await pool.query(
    `INSERT INTO "User" (id, email, name, password, role, department)
     VALUES ($1, $2, $3, $4, 'staff', 'TI')
     ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), adminEmail, adminName, password]
  );

  const testUserEmail = "test@ti.local";
  await pool.query(
    `INSERT INTO "User" (id, email, name, password, role, department)
     VALUES ($1, $2, $3, NULL, 'user', NULL)
     ON CONFLICT (email) DO NOTHING`,
    [randomUUID(), testUserEmail, "Usuario de Prueba"]
  );

  const allowedEmails = [
    { email: testUserEmail, name: "Usuario de Prueba", note: "Usuario de prueba (ingreso sin contraseña)" },
  ];
  for (const ae of allowedEmails) {
    await pool.query(
      `INSERT INTO "AllowedEmail" (id, email, name, note) VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING`,
      [randomUUID(), ae.email, ae.name, ae.note]
    );
  }

  const inventory = [
    { name: "Resma de papel A4", category: "papel", quantity: 50, minThreshold: 10, unit: "resma" },
    { name: "Pila AA", category: "pilas", quantity: 80, minThreshold: 20, unit: "unidad" },
    { name: "Pila AAA", category: "pilas", quantity: 60, minThreshold: 20, unit: "unidad" },
    { name: "Teclado USB", category: "periferico", quantity: 15, minThreshold: 5, unit: "unidad" },
    { name: "Mouse USB", category: "periferico", quantity: 20, minThreshold: 5, unit: "unidad" },
    { name: "Audífonos", category: "periferico", quantity: 10, minThreshold: 3, unit: "unidad" },
  ];
  for (const item of inventory) {
    await pool.query(
      `INSERT INTO "InventoryItem" (id, name, category, quantity, "minThreshold", unit, "createdAt", "updatedAt")
       SELECT $1, $2, $3, $4, $5, $6, now(), now()
       WHERE NOT EXISTS (SELECT 1 FROM "InventoryItem" WHERE name = $2)`,
      [randomUUID(), item.name, item.category, item.quantity, item.minThreshold, item.unit]
    );
  }

  const procedures = [
    {
      title: "Cómo solicitar material de oficina",
      content:
        "Material de consumo (papel, pilas): NO se devuelve.\n1. Pide en el chat qué necesitas (papel, pilas) y la cantidad.\n2. El asistente confirmará la solicitud.\n3. El departamento de TI prepara el material y avisa cuando esté listo.\n4. Si necesitas papel o pilas con urgencia, indícalo para priorizar.",
      category: "solicitudes",
    },
    {
      title: "Préstamo de equipo o periféricos",
      content:
        "Periféricos (teclado, mouse, audífonos): SE devuelven y están sujetos a disponibilidad en inventario.\n1. Pide en el chat el periférico y la cantidad.\n2. El asistente verifica disponibilidad en inventario.\n3. Si hay stock, se registra el préstamo a tu nombre.\n4. Debes devolverlo en la fecha acordada. TI te avisa cuando venza.",
      category: "prestamos",
    },
    {
      title: "Reporte de una computadora con falla",
      content:
        "Antes de reportar una falla, describe qué estabas haciendo y qué pasó.\n1. Indica qué pasaba: ¿problema con correo, Office, NAS, impresora, Encompix, internet o acceso?\n2. Sigue la guía del asistente para verificar puntos rápidos.\n3. Si el problema persiste después de la verificación, se levanta el ticket.\n4. Indica la ubicación del equipo si aplica.",
      category: "soporte",
    },
    {
      title: "Impresora no imprime",
      content:
        "Antes de levantar ticket, verifica:\n1. ¿Estás conectado a la red correcta SCIO MEXICO?\n2. ¿La impresora está encendida y conectada con el cable de red?\n3. ¿Tiene hojas?\n4. ¿Seleccionaste el nombre correcto de la impresora?\nSi ya verificaste todo esto y sigue sin imprimir, levanta el ticket indicando qué impresora es y qué verificaste.",
      category: "soporte",
    },
    {
      title: "No tengo acceso al NAS",
      content:
        "Antes de levantar ticket:\n1. Verifica que estás conectado a la red correcta SCIO MEXICO.\n2. Si sigues sin acceso a la carpeta compartida, levanta el ticket indicando qué carpeta no puedes abrir.",
      category: "soporte",
    },
    {
      title: "Problemas con Office",
      content:
        "Antes de levantar ticket:\n1. ¿Qué programa de Office es y qué error aparece?\n2. Intenta cerrar el programa y volver a abrirlo.\n3. Si el problema persiste, levanta el ticket con el nombre del programa y el error exacto.",
      category: "soporte",
    },
    {
      title: "Problemas con el correo",
      content:
        "Antes de levantar ticket:\n1. ¿Qué error te muestra el correo?\n2. Intenta cerrar sesión y volver a iniciar con tu contraseña.\n3. Si no puedes iniciar sesión o el correo no sincroniza, levanta el ticket indicando el error exacto.",
      category: "soporte",
    },
    {
      title: "Problemas con Encompix",
      content:
        "Dos casos clásicos:\nA) NO PUEDO ACCEDER A ENCOMPIX: tu usuario puede estar bloqueado. Se desbloquea con el procedimiento de desbloqueo de Encompix.\nB) NO PUEDO CONECTAR CON LA UNIDAD COMPARTIDA: verifica que tengas ACTIVADA la VPN de Azure.\nSi después de eso sigue sin funcionar, levanta el ticket indicando cuál de los dos casos es y el error exacto.",
      category: "soporte",
    },
    {
      title: "Desbloqueo de usuario de Encompix",
      content:
        "Si no puedes entrar a Encompix, tu usuario puede estar bloqueado.\n1. Informa al asistente que no puedes acceder a Encompix.\n2. El departamento de TI valida y desbloquea tu usuario.\n3. Intenta iniciar sesión de nuevo después del desbloqueo.",
      category: "soporte",
    },
    {
      title: "Error de computadora que no entiendo",
      content:
        "Si tu computadora muestra un error que no entiendes:\n1. Describe el error con tus palabras (qué dice la pantalla, en qué momento aparece).\n2. El asistente evalúa si el mensaje parece un error real o si es una broma; ante la duda se trata como real.\n3. Si el error es real y no tiene solución rápida, se levanta el ticket con la descripción.",
      category: "soporte",
    },
    {
      title: "No tengo internet o va lento",
      content:
        "Antes de levantar ticket, valida primero:\n1. Pregunta si la lentitud es en UNA aplicación específica (ej. Office, un sitio, el correo) o en TODA la navegación y el equipo. Si es solo una aplicación, el problema probablemente es de esa aplicación y no del internet.\n2. Si es en toda la navegación, explica posibles causas: actualizaciones en segundo plano del equipo, o varios usuarios realizando tareas de descarga al mismo tiempo.\nCasos:\n- INTERNET LENTO (no es un corte): de igual forma se levanta ticket para que TI verifique el estado del servicio.\n- SIN INTERNET O INTERMITENTE: levanta ticket para que TI vaya a revisar la conexión.\n- Indica si es en oficina, casa o con un cliente en sitio.",
      category: "soporte",
    },
    {
      title: "Solicitud de internet WiFi para visitas",
      content:
        "Para dar internet de visitas a un cliente:\n1. Pide los datos de la empresa que recibe al cliente.\n2. Pide el nombre de la persona responsable a quien se le dará el acceso.\n3. Solo con esos datos se entrega la clave de la WiFi de visitas.\n4. La clave de la WiFi de visitas es: RELLENAR-AQUI.",
      category: "solicitudes",
    },
    {
      title: "Solicitud de acceso a sistemas",
      content:
        "1. Indica en el chat el sistema al que necesitas acceso (Encompix, correo, unidad compartida, etc.).\n2. El departamento valida si cuentas con la autorización.\n3. Recibirás el aviso por correo cuando el acceso esté listo.",
      category: "soporte",
    },
  ];
  for (const p of procedures) {
    await pool.query(
      `INSERT INTO "Procedure" (id, title, content, category, "createdAt", "updatedAt")
       SELECT $1, $2, $3, $4, now(), now()
       WHERE NOT EXISTS (SELECT 1 FROM "Procedure" WHERE title = $2)`,
      [randomUUID(), p.title, p.content, p.category]
    );
  }

  const backfill = await pool.query(
    `INSERT INTO "Loan" ("ticketId", "userId", "borrowerName", items, "borrowedAt")
     SELECT t.id, t."userId", COALESCE(u.name, 'Usuario'), t."requestedItems", t."createdAt"
     FROM "Ticket" t
     LEFT JOIN "User" u ON u.id = t."userId"
     WHERE t."requestedItems" IS NOT NULL
       AND t."requestedItems" <> '[]'::jsonb
       AND NOT EXISTS (SELECT 1 FROM "Loan" l WHERE l."ticketId" = t.id)`
  );
  if (backfill.rowCount && backfill.rowCount > 0) {
    console.log(`Requisiciones respaldadas de solicitudes anteriores: ${backfill.rowCount}`);
  }

  console.log("Seed completado.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => pool.end());