import { McpServer } from "skybridge/server";
import { z } from "zod";
import { callTool } from "./mcp-client.js";

function ok<T extends Record<string, unknown>>(data: T) {
  return {
    content: [{ type: "text" as const, text: `Dane: ${Object.keys(data).join(", ")}` }],
    structuredContent: data,
    isError: false,
  };
}

const server = new McpServer(
  { name: "mcp-dashboard", version: "1.0.0" },
  { capabilities: {} },
)

// ── Dashboard Overview ────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_dashboard",
    description: "Pokaż główny panel ze statusem wszystkich serwisów: Proxmox, Home Assistant, email, finanse, backupy.",
    inputSchema: {},
    view: { component: "dashboard", description: "Dashboard Overview" },
  },
  async () => {
    const results = await Promise.allSettled([
      callTool("mcp_proxmox__getContainers"),
      callTool("mcp_proxmox__getNodeResources"),
      callTool("mcp_homeassistant__ha_status"),
      callTool("mcp_email__pollEmailsToday"),
      callTool("mcp_sure__getBalanceSheet"),
      callTool("mcp_rclone_backup__rclone_check_targets"),
      callTool("mcp_paperless__paperless_recent", { limit: 5 }),
      callTool("mcp_twenty__getTasks", { status: "TODO" }),
    ]);
    const [containers, resources, haStatus, emails, balance, backups, docs, tasks] = results.map(r =>
      r.status === "fulfilled" ? r.value : { error: (r as PromiseRejectedResult).reason?.message }
    );
    return ok({ containers, resources, haStatus, emails, balance, backups, docs, tasks });
  },
)

// ── Proxmox ──────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_proxmox",
    description: "Pokaż panel Proxmox: kontenery LXC, maszyny wirtualne, zasoby węzła i storage.",
    inputSchema: {},
    view: { component: "proxmox", description: "Proxmox Dashboard" },
  },
  async () => {
    const [containers, resources, storage, tasks] = await Promise.all([
      callTool("mcp_proxmox__getContainers"),
      callTool("mcp_proxmox__getNodeResources"),
      callTool("mcp_proxmox__getStorageInfo"),
      callTool("mcp_proxmox__listTasks", { limit: 10 }),
    ]);
    return ok({ containers, resources, storage, tasks });
  },
)

// ── Home Assistant ────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_home_assistant",
    description: "Pokaż panel smart home: urządzenia, światła, przełączniki i statusy Home Assistant.",
    inputSchema: {
      query: z.string().optional().describe("Filtruj encje (np. 'light', 'switch', 'sensor')"),
    },
    view: { component: "home-assistant", description: "Home Assistant" },
  },
  async ({ query }) => {
    const [status, entities] = await Promise.all([
      callTool("mcp_homeassistant__ha_status"),
      callTool("mcp_homeassistant__ha_search_states", { query: query ?? "light", limit: 60 }),
    ]);
    return ok({ status, entities });
  },
)

// ── Email ─────────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_emails",
    description: "Pokaż skrzynkę e-mail: dzisiejsze wiadomości i ostatnie e-maile z kilku dni.",
    inputSchema: {
      days: z.number().optional().describe("Liczba ostatnich dni (domyślnie 3)"),
    },
    view: { component: "emails", description: "E-mail" },
  },
  async ({ days }) => {
    const [today, recent] = await Promise.all([
      callTool("mcp_email__pollEmailsToday"),
      callTool("mcp_email__getEmailsLastDays", { days: days ?? 3 }),
    ]);
    return ok({ today, recent });
  },
)

// ── Finances ──────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_finances",
    description: "Pokaż finanse: konta, bilans, portfel inwestycyjny i ostatnie transakcje.",
    inputSchema: {},
    view: { component: "finances", description: "Finanse" },
  },
  async () => {
    const [accounts, balance, income, holdings, transactions] = await Promise.all([
      callTool("mcp_sure__getAccounts"),
      callTool("mcp_sure__getBalanceSheet"),
      callTool("mcp_sure__getIncomeStatement"),
      callTool("mcp_sure__getHoldings"),
      callTool("mcp_sure__getTransactions", { page: 1 }),
    ]);
    return ok({ accounts, balance, income, holdings, transactions });
  },
)

// ── CRM ───────────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_crm",
    description: "Pokaż CRM Twenty: kontakty, firmy, szanse sprzedażowe i zadania.",
    inputSchema: {
      search: z.string().optional().describe("Szukaj kontaktów lub firm"),
    },
    view: { component: "crm", description: "CRM Twenty" },
  },
  async ({ search }) => {
    const q = search ?? "";
    const [people, companies, opportunities, tasks] = await Promise.all([
      callTool("mcp_twenty__getPeople", { search: q }),
      callTool("mcp_twenty__getCompanies", { search: q }),
      callTool("mcp_twenty__getOpportunities"),
      callTool("mcp_twenty__getTasks", { status: "" }),
    ]);
    return ok({ people, companies, opportunities, tasks });
  },
)

// ── Immich Photos ─────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_photos",
    description: "Pokaż ostatnie zdjęcia i albumy z Immich (selfhosted galeria zdjęć).",
    inputSchema: {
      query: z.string().optional().describe("Szukaj zdjęć po opisie lub nazwie"),
    },
    view: { component: "photos", description: "Zdjęcia Immich" },
  },
  async ({ query }) => {
    const [albums, recent] = await Promise.all([
      callTool("mcp_immich__immich_albums"),
      query
        ? callTool("mcp_immich__immich_search", { query, limit: 20 })
        : callTool("mcp_immich__immich_recent", { limit: 20 }),
    ]);
    return ok({ albums, recent, query: query ?? null });
  },
)

// ── Paperless ─────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_documents",
    description: "Pokaż dokumenty z Paperless-ngx: ostatnio dodane i wyszukiwanie.",
    inputSchema: {
      query: z.string().optional().describe("Szukaj dokumentów"),
    },
    view: { component: "documents", description: "Dokumenty Paperless" },
  },
  async ({ query }) => {
    const [status, docs] = await Promise.all([
      callTool("mcp_paperless__paperless_status"),
      query
        ? callTool("mcp_paperless__paperless_search", { query, limit: 10 })
        : callTool("mcp_paperless__paperless_recent", { limit: 10 }),
    ]);
    return ok({ status, docs, query: query ?? null });
  },
)

// ── Backups ───────────────────────────────────────────────────────────────────
.registerTool(
  {
    name: "show_backups",
    description: "Pokaż status kopii zapasowych rclone: czy backupy są aktualne i ile miejsca zajmują.",
    inputSchema: {},
    view: { component: "backups", description: "Kopie zapasowe" },
  },
  async () => {
    const [status, remotes, targets] = await Promise.all([
      callTool("mcp_rclone_backup__rclone_check_targets"),
      callTool("mcp_rclone_backup__rclone_remotes"),
      callTool("mcp_rclone_backup__rclone_configured_targets"),
    ]);
    return ok({ status, remotes, targets });
  },
);

server.run();

export type AppType = typeof server;
