import OpenAI from "openai";
import { query } from "@/lib/db";
import { notifyTicketCreated } from "@/lib/notifications";

type ProcedureRow = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
};

type InventoryRow = {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type TicketRow = {
  id: string;
  number: number;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  requestedItems: unknown;
  createdAt: Date;
  updatedAt: Date;
};

type LoanRow = {
  id: string;
  ticketId: string;
  userId: string | null;
  borrowerName: string;
  items: unknown;
  status: string;
  borrowedAt: Date;
  returnedAt: Date | null;
  user: { id: string; email: string } | null;
};

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY || "sk-no-key",
  baseURL: "https://api.deepseek.com",
  fetch: (url, init) => fetch(url, init),
});

const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

export async function classifyOffTopic(text: string): Promise<boolean> {
  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: "system",
          content:
            "Eres un moderador del asistente del departamento de TI. Clasifica si el mensaje del usuario está DENTRO del tema de trabajo (soporte técnico, solicitudes de material de oficina, préstamos, reportes de fallas, procedimientos, correo, red, cuentas, inventario) o FUERA del tema (pedidos de cosas que TI no maneja: globos, dinosaurios, café, comida, juguetes, chistes sin relación, etc.). Responde SOLO con JSON válido: {\"off_topic\": true} o {\"off_topic\": false}.",
        },
        { role: "user", content: text },
      ],
    });
    const content = res.choices[0]?.message?.content || "";
    const match = content.match(/off_topic["']?\s*[:=]\s*(true|false)/i);
    if (!match) return false;
    return match[1].toLowerCase() === "true";
  } catch (e) {
    console.error("Off-topic classifier error:", e);
    return false;
  }
}

export type ChatUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type StoredMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

const categories = ["solicitud", "prestamo", "soporte", "reposicion"] as const;
const priorities = ["baja", "normal", "alta"] as const;

const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "search_procedures",
      description:
        "Busca procedimientos/documentos del departamento de TI por palabra clave. Úsala para responder preguntas como '¿cómo solicito papel?', '¿cómo reporto una falla?', '¿cómo pido acceso?'.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Términos a buscar" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_inventory",
      description:
        "Consulta la disponibilidad de papel, pilas y periféricos. Solo responde si el usuario pregunta por disponibilidad o existencias.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "create_ticket",
      description:
        "Crea una solicitud formal para el departamento de TI. Úsala SOLO después de confirmar con el usuario el resumen de lo que quiere. Nunca la uses sin confirmación explícita del usuario.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Título corto de la solicitud" },
          description: {
            type: "string",
            description: "Descripción detallada con lo que el usuario necesita",
          },
          category: {
            type: "string",
            enum: [...categories],
            description:
              "solicitud = pedido general; prestamo = pedir algo prestado (papel, pilas, periféricos) con devolución; soporte = falla o soporte técnico; reposicion = reponer material agotado del stock",
          },
          priority: {
            type: "string",
            enum: [...priorities],
            description: "baja, normal o alta. Normal por defecto.",
          },
          requestedItems: {
            type: "array",
            description: "Artículos solicitados (obligatorio para categoría prestamo/reposicion)",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                quantity: { type: "number" },
              },
              required: ["name", "quantity"],
            },
          },
        },
        required: ["title", "description", "category", "priority"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_my_tickets",
      description:
        "Consulta el estado de las solicitudes del usuario actual. Úsala cuando pregunten '¿cómo va mi solicitud?' o '¿qué solicitudes tengo?'.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "get_active_loans",
      description:
        "Lista los préstamos activos (no devueltos). SOLO para personal del departamento de TI.",
      parameters: { type: "object", properties: {} },
    },
  },
];

async function executeTool(
  name: string,
  args: Record<string, unknown>,
  user: ChatUser
): Promise<string> {
  switch (name) {
    case "search_procedures": {
      const q = String(args.query || "");
      const like = `%${q}%`;
      const procedures = await query<ProcedureRow>(
        `SELECT * FROM "Procedure" WHERE title ILIKE $1 OR content ILIKE $2 OR category ILIKE $3`,
        [like, like, like]
      );
      if (procedures.length === 0) return "No se encontraron procedimientos relacionados.";
      return procedures
        .map((p) => `TÍTULO: ${p.title}\nCONTENIDO:\n${p.content}`)
        .join("\n\n---\n\n");
    }

    case "get_inventory": {
      const items = await query<InventoryRow>(
        `SELECT * FROM "InventoryItem" ORDER BY name ASC`
      );
      if (items.length === 0) return "No hay artículos registrados en el inventario.";
      return items
        .map((i) => {
          const state = i.quantity <= 0 ? "SIN STOCK" : i.quantity <= i.minThreshold ? "STOCK BAJO" : "disponible";
          return `- ${i.name} (${i.category}): ${i.quantity} ${i.unit} [${state}]`;
        })
        .join("\n");
    }

    case "create_ticket": {
      const title = String(args.title || "Solicitud");
      const description = String(args.description || "");
      const category = categories.includes(args.category as never) ? (args.category as string) : "solicitud";
      const priority = priorities.includes(args.priority as never) ? (args.priority as string) : "normal";
      const requestedItems = Array.isArray(args.requestedItems) ? args.requestedItems : [];

      const ticketRows = await query<TicketRow>(
        `INSERT INTO "Ticket" ("userId", title, description, category, priority, "requestedItems")
         VALUES ($1, $2, $3, $4, $5, $6::jsonb) RETURNING *`,
        [
          user.id,
          title,
          description,
          category,
          priority,
          requestedItems.length ? JSON.stringify(requestedItems) : null,
        ]
      );
      const ticket = ticketRows[0];

      if (category === "prestamo") {
        await query(
          `INSERT INTO "Loan" ("ticketId", "userId", "borrowerName", items)
           VALUES ($1, $2, $3, $4::jsonb)`,
          [ticket.id, user.id, user.name, JSON.stringify(requestedItems)]
        );
      }

      const notify = await notifyTicketCreated({
        number: ticket.number,
        title: ticket.title,
        description: ticket.description,
        category: ticket.category,
        priority: ticket.priority,
        requesterName: user.name,
        requesterEmail: user.email,
      });

      const notifyMsg = [
        notify.telegram && "Aviso enviado por Telegram",
        notify.email && "Aviso enviado por correo",
      ]
        .filter(Boolean)
        .join(" y ");

      return JSON.stringify({
        ok: true,
        ticketNumber: ticket.number,
        title: ticket.title,
        status: "pendiente",
        notification: notifyMsg || "Sin aviso configurado",
      });
    }

    case "get_my_tickets": {
      const tickets = await query<TicketRow>(
        `SELECT * FROM "Ticket" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 10`,
        [user.id]
      );
      if (tickets.length === 0) return "No tienes solicitudes registradas.";
      return tickets
        .map(
          (t) =>
            `#${t.number} - ${t.title} [${t.category}] Estado: ${t.status} (${t.createdAt.toISOString()})`
        )
        .join("\n");
    }

    case "get_active_loans": {
      if (user.role !== "staff")
        return "Acceso denegado: esta información es solo para el departamento de TI.";
      const loans = await query<LoanRow>(
        `SELECT l.*, CASE WHEN u.id IS NULL THEN NULL ELSE json_build_object('id', u.id, 'email', u.email) END AS "user"
         FROM "Loan" l
         LEFT JOIN "User" u ON u.id = l."userId"
         WHERE l.status = 'prestado'
         ORDER BY l."borrowedAt" DESC`
      );
      if (loans.length === 0) return "No hay préstamos activos.";
      return loans
        .map(
          (l) =>
            `- ${l.borrowerName} (${l.user?.email || "sin correo"}) pidió: ${JSON.stringify(
              l.items
            )} desde ${l.borrowedAt.toISOString()}`
        )
        .join("\n");
    }

    default:
      return "Herramienta desconocida.";
  }
}

function buildSystemPrompt(user: ChatUser, procedures: { title: string; content: string }[]) {
  const isStaff = user.role === "staff";
  const procText =
    procedures.length === 0
      ? "No hay procedimientos registrados. Si el usuario pregunta algo que no sabes, dile que envíe su duda al departamento de TI."
      : procedures
          .map((p) => `TÍTULO: ${p.title}\n${p.content}`)
          .join("\n\n---\n\n");

  const base = `
Eres el asistente oficial del departamento de TI. Tu función es atender al personal de la organización.

PROCEDIMIENTOS OFICIALES (fuente de verdad para responder):
${procText}

REGLAS GENERALES:
- Responde siempre en español, de forma clara y breve.
- NO uses formato markdown: no uses asteriscos, negritas, ni símbolos tipo ** o *. Usa texto plano con saltos de línea.
- Usa search_procedures para responder preguntas sobre procedimientos. NO inventes pasos ni información que no esté en las fuentes.
- Para crear cualquier solicitud debes confirmar primero con el usuario: resume en 1-3 líneas qué entendiste (artículos/cantidades, o el problema) y pregunta "¿Confirmo la solicitud?". Solo cuando el usuario confirme explícitamente, llama a create_ticket.
- TRIAGE: cuando el usuario reporte un problema (falla, error, sin acceso, no imprime, no hay internet), NO crees el ticket de inmediato. Investiga primero: pregunta qué estaba haciendo exactamente y qué pasó, y guíalo por los puntos de verificación del procedimiento correspondiente (por ejemplo: ¿estás conectado a la red SCIO MEXICO? ¿la impresora está encendida y tiene hojas? ¿seleccionaste la impresora correcta? ¿tienes activada la VPN de Azure?). Haz máximo 3 preguntas. Solo si el problema persiste después de la verificación, levanta el ticket incluyendo el diagnóstico recabado en la descripción.
- Si el usuario dice que su computadora mostró un error que no entiende, pídele que lo describa con sus palabras y evalúa si parece un error real o una broma; ante la duda, trátalo como real.
- Si el usuario pide internet para visitas de un cliente, SOLO entrega la clave de la WiFi de visitas si indica los datos de la empresa que recibe al cliente y el nombre de la persona responsable.
- Si el usuario pide o pregunta algo ajeno al departamento de TI (objetos, comida, dinosaurios, globos, café, temas personales, etc.), responde de forma amable y breve que solo puedes ayudarlo con temas de TI y solicitudes de material. No entres en el tema ni te esfuerces por satisfacerlo.
- Después de crear la solicitud, informa al usuario el número de su solicitud y que el departamento la revisará.`;
  if (isStaff) {
    return `${base}

ERES PERSONAL DEL DEPARTAMENTO DE TI (rol staff). Tienes acceso total.
- Puedes usar get_active_loans y ver inventario completo con cantidades exactas.
- Ayudas a redactar correos electrónicos profesionales, resúmenes de tickets y mensajes internos cuando te los pidan.
- Puedes consultar y explicar detalles de infraestructura y procedimientos internos.`;
  }
  return `${base}

ERES USUARIO NORMAL (rol user).
- LIMITADO: no reveles cantidades exactas de inventario, costos, ni información interna. Solo di si hay disponibilidad general ("sí hay", "stock bajo", "sin stock").
- No consultes datos de otros empleados ni del departamento.
- Para conocer tus solicitudes usa get_my_tickets.`;
}

export async function runAssistant({
  user,
  history,
}: {
  user: ChatUser;
  history: StoredMessage[];
}) {
  const procedures = await query<ProcedureRow>(
    `SELECT * FROM "Procedure" ORDER BY "updatedAt" DESC LIMIT 30`
  );

  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(user, procedures) },
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.content })),
  ];

  for (let i = 0; i < 5; i++) {
    const res = await openai.chat.completions.create({
      model: MODEL,
      messages,
      tools,
      tool_choice: "auto",
      stream: false,
    });

    const msg = res.choices[0].message;
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      messages.push(msg as OpenAI.Chat.Completions.ChatCompletionMessageParam);
      for (const tc of msg.tool_calls) {
        let parsed: Record<string, unknown> = {};
        try {
          parsed = JSON.parse(tc.function.arguments || "{}");
        } catch {
          parsed = {};
        }
        const result = await executeTool(tc.function.name, parsed, user);
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: result,
        });
      }
      continue;
    }

    return { content: msg.content || "", messages };
  }

  return {
    content: "No pude procesar la solicitud. Intenta nuevamente.",
    messages,
  };
}

export async function streamFinalResponse({
  messages,
  onDelta,
}: {
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  onDelta: (delta: string) => void;
}): Promise<string> {
  const stream = await openai.chat.completions.create({
    model: MODEL,
    messages,
    stream: true,
  });

  let full = "";
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      full += delta;
      onDelta(delta);
    }
  }
  return full;
}
