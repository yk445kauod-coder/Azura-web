import { useState, useEffect, useRef } from "react";
import { db, ref, get, onValue, off, set, remove } from "@/lib/firebase";
import { useLang } from "@/contexts/LanguageContext";
import { decryptKey, chatWithAI, isValidApiKey } from "@/lib/crypto";
import { 
  Bot, Send, Loader2, Users, 
  Package, DollarSign, RefreshCw,
  XCircle, BookOpen, ExternalLink, Maximize2, Minimize2, FileText, Trash2,
  Download, FileSpreadsheet, BarChart3, TrendingUp, Calendar, Zap, Play, CheckCircle2,
  Settings, Network, ShieldCheck, Activity, Cpu, LogOut, Terminal, Clock, Sparkles
} from "lucide-react";

interface AIMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
}

interface AnalyticsData {
  totalCustomers: number;
  returningCustomers: number;
  heavyUsers: number;
  activeToday: number;
  totalUsageTime: number;
  avgRating: number;
  totalMenuItems: number;
}

interface MenuItemData {
  id: string;
  name: string;
  nameAr: string;
  price: number;
  category: string;
  description?: string;
}

interface SubAgent {
  id: string;
  name: string;
  role: string;
  status: "idle" | "busy" | "offline";
  capabilities: string[];
  performance: number;
  color: string;
  colorClass: string;
}

interface Connector {
  id: string;
  name: string;
  category: "Cloud" | "Databases" | "MCP" | "CRMs" | "Productivity" | "AI Engines";
  status: "connected" | "disconnected";
  icon: string;
  keyName: string;
}

interface CronJob {
  id: string;
  title: string;
  schedule: string;
  agentId: string;
  enabled: boolean;
  lastRun?: string;
}

const CONNECT_CATEGORIES = ["Cloud", "Databases", "MCP", "CRMs", "Productivity", "AI Engines"] as const;

export default function AIAdminAssistant() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Tabs for right-hand pane: Connectors vs Automation scheduler vs Dispatch logs
  const [activeRightTab, setActiveRightTab] = useState<"connectors" | "automation" | "logs">("connectors");

  // Maestro Multi-Agent Swarm States
  const [subAgents, setSubAgents] = useState<SubAgent[]>([
    {
      id: "mcp-agent",
      name: "DevOps & MCP Engineer",
      role: "Model Context Protocol & Ports",
      status: "idle",
      capabilities: ["Write MCP Servers", "Inject APIs", "Simulate Browser", "OpenPorts"],
      performance: 99.4,
      color: "#3b82f6",
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/30"
    },
    {
      id: "analyst-agent",
      name: "BI Analyst Agent",
      role: "Spreadsheets, CSV & Financials",
      status: "idle",
      capabilities: ["Audit CRM Logs", "Generate CSVs", "Calculate LTV", "Budget Forecast"],
      performance: 98.7,
      color: "#10b981",
      colorClass: "text-emerald-500 bg-emerald-500/10 border-emerald-500/30"
    },
    {
      id: "writer-agent",
      name: "Document & PDF Creator",
      role: "Reports, Markdowns & Manuals",
      status: "idle",
      capabilities: ["Write Manuals", "Render PDFs", "Document API", "Draft Summaries"],
      performance: 97.5,
      color: "#a855f7",
      colorClass: "text-purple-500 bg-purple-500/10 border-purple-500/30"
    },
    {
      id: "scheduler-agent",
      name: "Cron & Standup Tasker",
      role: "Time Slots, Tasks & Reminders",
      status: "idle",
      capabilities: ["Trigger Crons", "Sync Calendar", "Send Standups", "Email Invites"],
      performance: 100.0,
      color: "#f59e0b",
      colorClass: "text-amber-500 bg-amber-500/10 border-amber-500/30"
    },
    {
      id: "media-agent",
      name: "Campaign & Social Ad Buyer",
      role: "Meta, Google Ads & SEO Analytics",
      status: "idle",
      capabilities: ["Meta Ads Budget", "Audit Google Analytics", "Social Scheduling", "Lead Gen"],
      performance: 96.2,
      color: "#f43f5e",
      colorClass: "text-rose-500 bg-rose-500/10 border-rose-500/30"
    }
  ]);

  // Dispatch Log Stream
  const [dispatchLogs, setDispatchLogs] = useState<string[]>([
    "[SYSTEM] Maestro Centralized Command boot complete.",
    "[SYSTEM] Swarm sync checks... 5 sub-agents connected, idling.",
    "[SYSTEM] 24/7 scheduler daemon active. Cron triggers armed."
  ]);

  // 30+ Connectors & MCP Grid Metadata
  const [connectors, setConnectors] = useState<Connector[]>([
    { id: "c1", name: "Cloudflare Workers", category: "Cloud", status: "connected", icon: "☁️", keyName: "CF_API_TOKEN" },
    { id: "c2", name: "Firebase RTDB", category: "Databases", status: "connected", icon: "🔥", keyName: "FIREBASE_DB" },
    { id: "c3", name: "Supabase DB", category: "Databases", status: "disconnected", icon: "⚡", keyName: "SUPABASE_URL" },
    { id: "c4", name: "PostgreSQL Engine", category: "Databases", status: "disconnected", icon: "🐘", keyName: "POSTGRES_CONN" },
    { id: "c5", name: "MCP Filesystem Server", category: "MCP", status: "connected", icon: "📁", keyName: "MCP_ROOT_FS" },
    { id: "c6", name: "MCP Puppeteer Browser", category: "MCP", status: "connected", icon: "🌐", keyName: "MCP_BROWSER_HEADLESS" },
    { id: "c7", name: "MCP Github API", category: "MCP", status: "connected", icon: "🐙", keyName: "MCP_GITHUB_PAT" },
    { id: "c8", name: "MCP Postgres API", category: "MCP", status: "disconnected", icon: "🔌", keyName: "MCP_PG_URI" },
    { id: "c9", name: "MCP Memory Cache Vector", category: "MCP", status: "connected", icon: "🧠", keyName: "MCP_VECTOR_STORE" },
    { id: "c10", name: "Salesforce CRM", category: "CRMs", status: "disconnected", icon: "☁️", keyName: "SALESFORCE_KEY" },
    { id: "c11", name: "HubSpot API", category: "CRMs", status: "disconnected", icon: "🧡", keyName: "HUBSPOT_CLIENT" },
    { id: "c12", name: "Zoho Desk Link", category: "CRMs", status: "disconnected", icon: "⚙️", keyName: "ZOHO_TOKEN" },
    { id: "c13", name: "Google Sheets Sync", category: "Productivity", status: "connected", icon: "📊", keyName: "GOOGLE_SHEETS_ID" },
    { id: "c14", name: "Google Calendar API", category: "Productivity", status: "connected", icon: "📅", keyName: "GOOGLE_CALENDAR_ID" },
    { id: "c15", name: "Slack Standup webhook", category: "Productivity", status: "connected", icon: "💬", keyName: "SLACK_WEBHOOK" },
    { id: "c16", name: "Discord Alert hook", category: "Productivity", status: "connected", icon: "👾", keyName: "DISCORD_WEBHOOK" },
    { id: "c17", name: "Twilio SMS", category: "Productivity", status: "disconnected", icon: "📱", keyName: "TWILIO_SID" },
    { id: "c18", name: "SendGrid SMTP", category: "Productivity", status: "disconnected", icon: "✉️", keyName: "SENDGRID_SMTP" },
    { id: "c19", name: "Zoom Meetings Connector", category: "Productivity", status: "connected", icon: "📹", keyName: "ZOOM_JWT" },
    { id: "c20", name: "Microsoft Teams Bot", category: "Productivity", status: "disconnected", icon: "👥", keyName: "TEAMS_CLIENT_ID" },
    { id: "c21", name: "Trello Board Updater", category: "Productivity", status: "disconnected", icon: "📋", keyName: "TRELLO_API" },
    { id: "c22", name: "Asana Workspace Sync", category: "Productivity", status: "disconnected", icon: "💮", keyName: "ASANA_PAT" },
    { id: "c23", name: "Groq Llama Inference", category: "AI Engines", status: "connected", icon: "🦉", keyName: "GROQ_API_KEY" },
    { id: "c24", name: "OpenAI GPT-4o Client", category: "AI Engines", status: "connected", icon: "❇️", keyName: "OPENAI_API_KEY" },
    { id: "c25", name: "Gemini Pro Connection", category: "AI Engines", status: "disconnected", icon: "✨", keyName: "GEMINI_API_KEY" },
    { id: "c26", name: "DeepSeek R1 Distill", category: "AI Engines", status: "connected", icon: "🇨🇳", keyName: "DEEPSEEK_KEY" },
    { id: "c27", name: "Anthropic Claude API", category: "AI Engines", status: "disconnected", icon: "🏛️", keyName: "ANTHROPIC_KEY" },
    { id: "c28", name: "Meta Lead-Ads Webhook", category: "CRMs", status: "connected", icon: "🔵", keyName: "META_GRAPH_TOKEN" },
    { id: "c29", name: "Mailchimp Audience", category: "Productivity", status: "disconnected", icon: "🐵", keyName: "MAILCHIMP_KEY" },
    { id: "c30", name: "Zapier webhook engine", category: "Cloud", status: "connected", icon: "🧡", keyName: "ZAPIER_WEBHOOK" },
    { id: "c31", name: "Stripe API billing", category: "Cloud", status: "disconnected", icon: "💳", keyName: "STRIPE_SECRET_KEY" }
  ]);

  // Scheduler Automation Cron Jobs
  const [cronJobs, setCronJobs] = useState<CronJob[]>([
    { id: "cron1", title: "Midnight Database Backup & Flush", schedule: "0 0 * * *", agentId: "mcp-agent", enabled: true, lastRun: "Today 00:00" },
    { id: "cron2", title: "Slack Standup Sync & Team Summary", schedule: "0 9 * * 1-5", agentId: "scheduler-agent", enabled: true, lastRun: "Today 09:00" },
    { id: "cron3", title: "Calculate Weekly Performance & CRM CSV Export", schedule: "0 18 * * 5", agentId: "analyst-agent", enabled: false, lastRun: "Friday 18:00" },
    { id: "cron4", title: "Daily Meta & Google Ad ROI Auditing Report", schedule: "30 23 * * *", agentId: "media-agent", enabled: true, lastRun: "Yesterday 23:30" },
    { id: "cron5", title: "Generate Platform Docs & Export PDF Handbook", schedule: "0 12 1 * *", agentId: "writer-agent", enabled: true, lastRun: "1st of Month 12:00" }
  ]);

  const [customCronTitle, setCustomCronTitle] = useState("");
  const [customCronSchedule, setCustomCronSchedule] = useState("0 * * * *");
  const [customCronAgent, setCustomCronAgent] = useState("mcp-agent");

  // Thread metrics
  const [threadMetrics, setThreadMetrics] = useState({
    cpuLoad: 24,
    ramUsed: 420,
    queueSize: 0,
    uptime: "2d 11h 45m"
  });

  const tr = (en: string, ar: string) => lang === "ar" ? ar : en;

  // Add automated logs periodic simulator
  useEffect(() => {
    const timer = setInterval(() => {
      // randomly adjust cpu/ram
      setThreadMetrics(prev => ({
        ...prev,
        cpuLoad: Math.min(100, Math.max(5, prev.cpuLoad + Math.floor(Math.random() * 11) - 5)),
        ramUsed: Math.min(1024, Math.max(128, prev.ramUsed + Math.floor(Math.random() * 9) - 4))
      }));

      // Random scheduler check log append
      const randomSeed = Math.random();
      if (randomSeed < 0.25) {
        const activeCrons = cronJobs.filter(c => c.enabled);
        if (activeCrons.length > 0) {
          const selectedCron = activeCrons[Math.floor(Math.random() * activeCrons.length)];
          const targetAgent = subAgents.find(sa => sa.id === selectedCron.agentId);

          setDispatchLogs(prev => [
            ...prev,
            `[SCHEDULER] Daemon match cron: ${selectedCron.title} (${selectedCron.schedule})`,
            `[DISPATCH] Maestro routing job to sub-agent: ${targetAgent?.name || "Cron Tasker"}`,
            `[${targetAgent?.id.toUpperCase()}] Executed daemon cron task successfully.`
          ].slice(-40));

          // Flicker sub-agent to busy and back
          setSubAgents(prev => prev.map(sa => sa.id === selectedCron.agentId ? { ...sa, status: "busy" } : sa));
          setTimeout(() => {
            setSubAgents(prev => prev.map(sa => sa.id === selectedCron.agentId ? { ...sa, status: "idle" } : sa));
          }, 2000);
        }
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [cronJobs, subAgents]);

  useEffect(() => {
    loadApiKey();
    loadAllData();
    loadChatHistory();
    // Real-time listeners for live data sync
    const unsubUsers = onValue(ref(db, "users"), (snap) => {
      updateAnalytics({ users: snap.exists() ? Object.values(snap.val()) : [] });
    });
    const unsubFeedback = onValue(ref(db, "feedback"), (snap) => {
      updateAnalytics({ feedback: snap.exists() ? Object.values(snap.val()) : [] });
    });
    const unsubMenu = onValue(ref(db, "menu"), (snap) => {
      loadMenuItems(snap);
    });
    return () => {
      unsubUsers();
      unsubFeedback();
      unsubMenu();
      off(ref(db, "conversations/admin/assistant"));
    };
  }, []);

  const loadApiKey = async () => {
    const snap = await get(ref(db, "api-settings"));
    if (snap.exists()) {
      const data = snap.val();
      const rawKey = data.groqKey || data.geminiKey;
      if (rawKey) {
        const decrypted = decryptKey(rawKey);
        if (isValidApiKey(decrypted)) setApiKey(decrypted);
      }
    }
  };

  const loadChatHistory = () => {
    onValue(ref(db, "conversations/admin/assistant"), (snap) => {
      if (snap.exists()) {
        const data = snap.val() as Record<string, AIMessage>;
        const sorted = Object.values(data).sort((a, b) => a.timestamp - b.timestamp);
        setMessages(sorted);
      }
    });
  };

  const saveMessage = async (msg: AIMessage) => {
    await set(ref(db, `conversations/admin/assistant/${msg.id}`), msg);
  };

  const clearHistory = async () => {
    await remove(ref(db, "conversations/admin/assistant"));
    setMessages([]);
  };

  const updateAnalytics = ({ users = undefined, feedback = undefined }: { users?: any[]; feedback?: any[] }) => {
    setAnalytics(prev => {
      const currentUsers = users ?? prev ? [prev] : [];
      const currentFeedback = feedback ?? [];
      const allUsers = Array.isArray(currentUsers) ? currentUsers.filter(Boolean) : [];
      const allFeedback = Array.isArray(currentFeedback) ? currentFeedback.filter(Boolean) : [];
      
      const today = new Date().setHours(0, 0, 0, 0);
      const activeToday = allUsers.filter((u: any) => (u.lastLoginAt || 0) >= today).length;
      const returning = allUsers.filter((u: any) => (u.loginCount || 0) > 1).length;
      const heavy = allUsers.filter((u: any) => (u.totalUsageSeconds || 0) > 1800).length;
      const totalUsage = allUsers.reduce((sum: number, u: any) => sum + (u.totalUsageSeconds || 0), 0);
      const avgRating = allFeedback.length > 0 
        ? (allFeedback.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / allFeedback.length).toFixed(1)
        : "0.0";

      return {
        totalCustomers: allUsers.length,
        returningCustomers: returning,
        heavyUsers: heavy,
        activeToday,
        totalUsageTime: totalUsage,
        avgRating: parseFloat(avgRating),
        totalMenuItems: prev?.totalMenuItems || 0,
      };
    });
  };

  const loadMenuItems = (snap?: any) => {
    try {
      const data = snap?.val ? snap.val() : snap;
      if (!data) return;
      const items: MenuItemData[] = [];
      
      Object.entries(data).forEach(([category, val]: [string, any]) => {
        if (val && typeof val === "object" && !Array.isArray(val)) {
          Object.entries(val).forEach(([id, item]: [string, any]) => {
            if (item && typeof item === "object" && (item.price !== undefined || item.name)) {
              items.push({
                id,
                name: item.name || item.nameEn || id,
                nameAr: item.nameAr || "",
                price: item.price || 0,
                category: item.category || category,
                description: item.description || item.desc || "",
              });
            }
          });
        }
      });
      
      setMenuItems(items);
      setAnalytics(prev => prev ? { ...prev, totalMenuItems: items.length } : null);
    } catch (error) {
      console.error("Error loading menu:", error);
    }
  };

  const loadAllData = async () => {
    const [usersSnap, feedbackSnap, menuSnap] = await Promise.all([
      get(ref(db, "users")),
      get(ref(db, "feedback")),
      get(ref(db, "menu"))
    ]);
    updateAnalytics({ 
      users: usersSnap.exists() ? Object.values(usersSnap.val()) : [], 
      feedback: feedbackSnap.exists() ? Object.values(feedbackSnap.val()) : [] 
    });
    loadMenuItems(menuSnap);
  };

  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMsg = lang === "ar"
        ? `🤖 أهلاً بك في منصة Maestro Swarm Control Center!

أنا المساعد العام المايسترو (Maestro Core General Agent). أتحكم في 5 عملاء ذكاء اصطناعي فرعيين لتنفيذ المهام ومراقبة أكثر من 30 موصلاً وأداة MCP ونظام أتمتة يعمل على مدار الساعة.

اسألني أي شيء أو وجه مهمة ليتم تفويضها تلقائياً!`
        : `🤖 Welcome to the Maestro Swarm Control Center!

I am the Maestro Core General Agent. I orchestrate 5 specialized AI sub-agents to execute business pipelines, automate tasks 24/7, write code, and query 30+ MCP connectors.

Ask me a question or assign a task to be delegated automatically!`;

      const welcome = {
        id: "welcome",
        role: "assistant" as const,
        content: welcomeMsg,
        timestamp: Date.now(),
      };
      setMessages([welcome]);
      saveMessage(welcome);
    }
  }, [lang, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addLog = (msg: string) => {
    setDispatchLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`].slice(-45));
  };

  // Orchestrate user request across the 5 Sub-Agents
  const orchestrateSwarm = async (userInput: string): Promise<string> => {
    const query = userInput.toLowerCase();
    
    // Identify target sub-agent
    let targetAgent: SubAgent = subAgents[0]; // default devops
    let routingReason = "DevOps Default Routing";

    if (query.includes("mcp") || query.includes("browser") || query.includes("port") || query.includes("api") || query.includes("connector") || query.includes("test")) {
      targetAgent = subAgents[0];
      routingReason = "DevOps/Integrations Match";
    } else if (query.includes("sheet") || query.includes("csv") || query.includes("analytics") || query.includes("users") || query.includes("ltv") || query.includes("data") || query.includes("تحليل") || query.includes("مستند")) {
      targetAgent = subAgents[1];
      routingReason = "BI/Data Analytics Match";
    } else if (query.includes("doc") || query.includes("pdf") || query.includes("markdown") || query.includes("write") || query.includes("manual") || query.includes("تقرير")) {
      targetAgent = subAgents[2];
      routingReason = "Technical Writing Match";
    } else if (query.includes("schedule") || query.includes("cron") || query.includes("meeting") || query.includes("task") || query.includes("standup") || query.includes("جدول")) {
      targetAgent = subAgents[3];
      routingReason = "Scheduler Daemon Match";
    } else if (query.includes("ad") || query.includes("meta") || query.includes("google") || query.includes("seo") || query.includes("marketing") || query.includes("social") || query.includes("تسويق")) {
      targetAgent = subAgents[4];
      routingReason = "Marketing Campaign Match";
    }

    addLog(`[MAESTRO] Core analyzed prompt. Determined delegate: ${targetAgent.name} (${routingReason})`);
    
    // Set target agent busy
    setSubAgents(prev => prev.map(sa => sa.id === targetAgent.id ? { ...sa, status: "busy" } : sa));
    setThreadMetrics(prev => ({ ...prev, queueSize: prev.queueSize + 1, cpuLoad: Math.min(95, prev.cpuLoad + 15) }));

    // Mock steps execution logging
    await new Promise(r => setTimeout(r, 800));
    addLog(`[${targetAgent.id.toUpperCase()}] Received task dispatch. Launching workspace sandbox.`);
    await new Promise(r => setTimeout(r, 1000));
    addLog(`[${targetAgent.id.toUpperCase()}] Running capability integration: "${targetAgent.capabilities[0]}".`);
    await new Promise(r => setTimeout(r, 1200));
    addLog(`[${targetAgent.id.toUpperCase()}] Success. Generating response artifact and summarizing output.`);

    // Restore agent states
    setSubAgents(prev => prev.map(sa => sa.id === targetAgent.id ? { ...sa, status: "idle" } : sa));
    setThreadMetrics(prev => ({ ...prev, queueSize: Math.max(0, prev.queueSize - 1) }));

    // Generate response content depending on the agent in play
    if (targetAgent.id === "mcp-agent") {
      return `### 🛠️ Swarm Delegate: DevOps & MCP Engineer Agent

I have intercepted your DevOps request. Based on the configured MCP filesystems and 30+ API Connectors:
1. **MCP Active Server Verified:** Google Calendar, Pupeteer browser, and Cloudflare Worker keys are locked.
2. **Dynamic Connector Trigger:** Test ping dispatched to Cloudflare Workers API - **Success (200 OK - Latency 42ms)**.
3. **Browser Automation:** Opened mock Chromium instance, scraped latest system logs. Everything is nominal.

*Would you like me to write a custom MCP Connector schema for your webhook? Type "Write MCP Schema"*`;
    }

    if (targetAgent.id === "analyst-agent") {
      const usersCount = analytics?.totalCustomers || 0;
      const returning = analytics?.returningCustomers || 0;
      const avgRating = analytics?.avgRating || "0.0";

      return `### 📊 Swarm Delegate: BI Analyst Agent

I have audited the Firebase realtime tracking nodes and catalog metrics. Here is your enterprise performance report:
- **Total Registered Client UUIDs:** ${usersCount}
- **Client Retention (LTV Returning Ratio):** ${((returning / (usersCount || 1)) * 100).toFixed(1)}%
- **System Service Quality Index:** ${avgRating} / 5.0 Stars

📥 **Dynamic Generated Artifact:**
I have generated a localized performance sheet. Click the download link below to save your CSV audit log:
[Download Generated Performance Audit Log (CSV)](##csv-download)

*Ask me: "Forecast next month budget" to simulate marketing ROI models.*`;
    }

    if (targetAgent.id === "writer-agent") {
      return `### 📄 Swarm Delegate: Document & PDF Creator Agent

I have compiled the latest platform variables and initialized the Technical Report writer.
1. **Report Draft:** Dynamic Platform Architecture Manual
2. **Formatting:** Unified Markdown specification ready for PDF export.

📥 **Generated Artifact Download:**
[Download Platform Architecture & Swarm Specification (MD)](##doc-download)

*If you need this document customized with specific guidelines, describe them here and I'll regenerate it instantly.*`;
    }

    if (targetAgent.id === "scheduler-agent") {
      return `### 📅 Swarm Delegate: Cron & Standup Tasker Agent

I have synced with your Google Calendar API and Twilio notification pipelines:
1. **Standup Sync:** Sent automated standup summaries to Slack webhook channels successfully.
2. **Active Cron Detections:** Verified 4 out of 5 armed recurring background triggers are actively running on Cloudflare Worker daemons.
3. **Action Completed:** Injected a reminder inside CRM table nodes for the next team review meeting.

*Would you like me to schedule a new recurring cron job? Configure it on the right hand automation tab or tell me: "Schedule standby task"*`;
    }

    if (targetAgent.id === "media-agent") {
      return `### 📈 Swarm Delegate: Campaign & Social Ad Buyer Agent

Meta Graph API & Google SEO modules triggered.
1. **Ad Account Audits:** Detected Meta conversion pixels firing at 100% capacity.
2. **SEO Rankings:** Main crawler logged zero broken deep-links inside your dynamic web screens.
3. **Budget Recommendation:** Based on current visitor peak activity, increase target spend on late-afternoon display signage banners by 12% to maximize click-throughs.

*Ask me to: "Draft Meta Campaign script" to generate localized high-converting copies.*`;
    }

    return `### 🤖 Swarm Delegate: General Maestro Agent
Your instruction has been processed. The general team has handled the background triggers successfully.`;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    
    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    saveMessage(userMessage);
    setInput("");
    setLoading(true);
    
    try {
      let response = "";
      // Orchestrate with sub-agents first
      response = await orchestrateSwarm(userMessage.content);

      const assistantMessage: AIMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, assistantMessage]);
      saveMessage(assistantMessage);
    } catch (error) {
      console.error("AI Swarm Error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 30+ Connectors Action Triggers
  const testConnector = (id: string, name: string) => {
    addLog(`[CONNECTOR] Initiating test probe to service: ${name}...`);
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: "connected" } : c));
    setTimeout(() => {
      addLog(`[CONNECTOR] Response received from ${name}. Verification code: SUCCESS_200`);
    }, 1200);
  };

  const toggleConnector = (id: string) => {
    setConnectors(prev => prev.map(c => c.id === id ? { ...c, status: c.status === "connected" ? "disconnected" : "connected" } : c));
    const target = connectors.find(c => c.id === id);
    addLog(`[CONNECTOR] ${target?.name} toggled to: ${target?.status === "connected" ? "OFFLINE" : "ONLINE"}`);
  };

  // Add custom automation schedule
  const handleAddCron = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCronTitle.trim()) return;
    const newJob: CronJob = {
      id: "cron_" + Date.now(),
      title: customCronTitle,
      schedule: customCronSchedule,
      agentId: customCronAgent,
      enabled: true,
      lastRun: "Never"
    };
    setCronJobs(prev => [...prev, newJob]);
    setCustomCronTitle("");
    addLog(`[SCHEDULER] Registered custom task cron daemon: "${newJob.title}" [${newJob.schedule}]`);
  };

  const toggleCron = (id: string) => {
    setCronJobs(prev => prev.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
    const target = cronJobs.find(c => c.id === id);
    addLog(`[SCHEDULER] Cron job "${target?.title}" ${target?.enabled ? "DISABLED" : "ENABLED"}`);
  };

  const deleteCron = (id: string) => {
    setCronJobs(prev => prev.filter(c => c.id !== id));
    addLog(`[SCHEDULER] Task cron successfully purged.`);
  };

  // Workspace download artifacts helpers
  const triggerCSVDownload = () => {
    const rows = [
      ["Metric", "Value", "Timestamp"],
      ["Registered Customers", analytics?.totalCustomers || 0, Date.now()],
      ["Active Clients Today", analytics?.activeToday || 0, Date.now()],
      ["Uptime Status", threadMetrics.uptime, Date.now()],
      ["Average Feedback rating", analytics?.avgRating || "0.0", Date.now()],
      ["Active Connectors Running", connectors.filter(c => c.status === "connected").length, Date.now()]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `swarm_performance_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("[WORKSPACE] Spreadsheet performance artifact downloaded.");
  };

  const triggerMarkdownDownload = () => {
    const mdContent = `# MAESTRO GENERAL SWARM CONTROL CENTER
## Enterprise Core Architecture Specification

This automated report summarizes the active agent swarm configurations, connection endpoints, and system parameters.

### 1. General System Metrics
- CPU load: ${threadMetrics.cpuLoad}%
- Memory allocated: ${threadMetrics.ramUsed} MB
- Connection state: SECURE
- Running swarm sub-agents: 5

### 2. Active AI Agent Roster
${subAgents.map(sa => `- **${sa.name}** [${sa.role}]: Success rate ${sa.performance}%`).join("\n")}

### 3. Enabled MCP & APIs Connection Points
- Connected plugins: ${connectors.filter(c => c.status === "connected").length} / ${connectors.length}

Generated dynamically by the Document & PDF Creator Swarm.
Timestamp: ${new Date().toUTCString()}
`;
    const blob = new Blob([mdContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `platform_architecture_swarm_specification.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog("[WORKSPACE] Markdown technical document artifact downloaded.");
  };

  // Intercepting chat flow download links
  const handleChatClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.tagName === "A" && target.getAttribute("href") === "##csv-download") {
      e.preventDefault();
      triggerCSVDownload();
    } else if (target.tagName === "A" && target.getAttribute("href") === "##doc-download") {
      e.preventDefault();
      triggerMarkdownDownload();
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[750px] bg-slate-950/70 border border-slate-800 rounded-3xl overflow-hidden p-3 text-slate-100">

      {/* 1. LEFT PANEL: Agent Swarm Monitor */}
      <div className="w-full lg:w-[28%] flex flex-col gap-3 bg-slate-900/60 rounded-2xl border border-slate-800 p-3 overflow-y-auto">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Activity size={18} className="text-primary animate-pulse" />
          <div>
            <h3 className="font-bold text-xs tracking-wider uppercase text-slate-300">{tr("Agent Swarm Monitor", "مراقب السرب الذكي")}</h3>
            <p className="text-[10px] text-muted-foreground">{tr("Real-time resource thread feeds", "تغذية حية ومؤشرات النشاط")}</p>
          </div>
        </div>

        {/* Live Swarm Threads Graphs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-[11px]">
          <div>
            <span className="text-muted-foreground block">{tr("SWARM CPU", "معالج السرب")}</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all duration-500" style={{ width: `${threadMetrics.cpuLoad}%` }} />
              </div>
              <span className="font-mono text-primary font-bold">{threadMetrics.cpuLoad}%</span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground block">{tr("HEAP MEMORY", "الذاكرة المخصصة")}</span>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(threadMetrics.ramUsed / 1024) * 100}%` }} />
              </div>
              <span className="font-mono text-emerald-400 font-bold">{threadMetrics.ramUsed}MB</span>
            </div>
          </div>
          <div className="col-span-2 pt-1 border-t border-slate-800/40 flex justify-between text-[10px] text-muted-foreground">
            <span>Uptime: <span className="font-mono text-slate-300">{threadMetrics.uptime}</span></span>
            <span>Task Queue: <span className="font-mono text-primary font-bold">{threadMetrics.queueSize} pending</span></span>
          </div>
        </div>

        {/* AI Agent Roster cards */}
        <div className="space-y-2.5 flex-1">
          {subAgents.map((sa) => (
            <div key={sa.id} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/40 hover:border-slate-700/60 transition-all duration-200">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${sa.status === "busy" ? "bg-amber-500 animate-ping" : sa.status === "offline" ? "bg-slate-600" : "bg-emerald-500 animate-pulse"}`} />
                  <h4 className="font-bold text-xs text-slate-200 leading-tight">{sa.name}</h4>
                </div>
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider ${
                  sa.status === "busy" ? "bg-amber-500/15 text-amber-400" : sa.status === "offline" ? "bg-slate-800 text-slate-400" : "bg-emerald-500/15 text-emerald-400"
                }`}>
                  {sa.status}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed mb-2 font-mono">{sa.role}</p>

              {/* Capabilities Tags */}
              <div className="flex flex-wrap gap-1">
                {sa.capabilities.map((cap, idx) => (
                  <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-900 border border-slate-800/50 text-slate-400 font-mono">
                    {cap}
                  </span>
                ))}
              </div>

              {/* Performance Indicator */}
              <div className="mt-2 pt-1.5 border-t border-slate-800/30 flex justify-between items-center text-[10px]">
                <span className="text-muted-foreground">Success LTV:</span>
                <span className="font-mono font-bold text-slate-300">{sa.performance}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. CENTER PANEL: Maestro Swarm Chat Core */}
      <div className="flex-1 flex flex-col bg-slate-900/40 rounded-2xl border border-slate-800 overflow-hidden h-full">
        {/* Swarm Core Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-gradient-to-r from-primary/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30">
              <Cpu size={18} className="text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <p className="font-bold text-sm tracking-wider uppercase text-slate-200">Maestro Command Center</p>
                <span className="bg-primary/25 text-primary text-[9px] px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-widest">ACTIVE</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Multi-Agent Swarm Orchestrator v4.2.1</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className={`p-2 rounded-xl transition-all border ${showPromptPreview ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'hover:bg-slate-800 border-slate-800 text-slate-400'}`}
              title={tr("Show Maestro Prompt", "عرض موجه المايسترو")}
            >
              <Bot size={15} />
            </button>
            <button
              onClick={clearHistory}
              className="p-2 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl border border-slate-800 hover:border-red-500/30 transition-colors"
              title={tr("Clear Session History", "مسح الجلسة")}
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Prompt Preview */}
        {showPromptPreview && (
          <div className="bg-purple-950/40 border-b border-purple-500/20 p-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Sparkles size={12}/> MAESTRO_SWARM_INSTRUCTIONS
              </h4>
              <button onClick={() => setShowPromptPreview(false)} className="text-purple-400 hover:text-purple-300"><XCircle size={14}/></button>
            </div>
            <pre className="text-[10px] font-mono bg-slate-950/60 p-3 rounded-lg border border-purple-500/20 whitespace-pre-wrap max-h-40 overflow-y-auto text-purple-300 leading-relaxed scrollbar-hide">
              {`You are the 'General Maestro Swarm Controller' — a centralized cognitive router orchestrating 5 enterprise sub-agents.

## DIRECTIVES:
1. Orchestrate queries by identifying keywords and triggering the appropriate sub-agent context automatically.
2. Maintain active logs in the terminal stream, reporting sandbox status and success indexes.
3. Write clean code, construct dynamically generated CSV and Markdown handbook artifacts, and support trigger requests.
4. Interact with the 30+ Model Context Protocol (MCP) servers and automated crons.`}
            </pre>
          </div>
        )}

        {/* Messages chat stream */}
        <div
          onClick={handleChatClick}
          className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-hide"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-lg border ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground border-primary/20 rounded-br-md"
                    : "bg-slate-900/90 text-slate-100 border-slate-800 rounded-bl-md"
                }`}
              >
                {/* Process links specifically */}
                {msg.content.includes("##csv-download") || msg.content.includes("##doc-download") ? (
                  <div>
                    {msg.content.split("\n").map((line, idx) => {
                      if (line.includes("##csv-download")) {
                        return (
                          <button
                            key={idx}
                            onClick={triggerCSVDownload}
                            className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-mono text-xs transition-all duration-150"
                          >
                            <FileSpreadsheet size={14} /> Download Performance Sheet (CSV)
                          </button>
                        );
                      }
                      if (line.includes("##doc-download")) {
                        return (
                          <button
                            key={idx}
                            onClick={triggerMarkdownDownload}
                            className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-400 font-mono text-xs transition-all duration-150"
                          >
                            <FileText size={14} /> Download Swarm Specifications (MD)
                          </button>
                        );
                      }
                      return <p key={idx} className="mb-1">{line}</p>;
                    })}
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900/60 border border-slate-800 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-mono">
                  <Loader2 size={13} className="animate-spin text-primary" />
                  <span>Maestro routing tasks to sub-agents...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Workspace Quick Actions */}
        <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/40 flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider block shrink-0">Quick Action:</span>
          <button
            onClick={() => { setInput("Test and audit all 30+ MCP connectors status"); }}
            className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full hover:bg-slate-800 hover:border-slate-700 font-mono text-slate-300"
          >
            Audit MCP Connectors
          </button>
          <button 
            onClick={() => { setInput("Generate weekly user analytics spreadsheet and download CSV"); }}
            className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full hover:bg-slate-800 hover:border-slate-700 font-mono text-slate-300"
          >
            Generate CRM CSV
          </button>
          <button 
            onClick={() => { setInput("Write full dynamic platform manual and export Markdown documentation"); }}
            className="text-[10px] bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-full hover:bg-slate-800 hover:border-slate-700 font-mono text-slate-300"
          >
            Create Architecture Doc
          </button>
        </div>

        {/* Input area */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder={tr("Command Maestro Swarm (e.g., 'mcp list', 'export sheet', 'audit ads')...", "أرسل أوامر المايسترو والسرب...")}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-sm focus:outline-none focus:border-primary placeholder-slate-500 font-mono"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="btn-primary px-4 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. RIGHT PANEL: Interactive Workspace Controls */}
      <div className="w-full lg:w-[32%] flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden h-full">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 border-b border-slate-800 bg-slate-950/60 text-xs font-mono">
          <button
            onClick={() => setActiveRightTab("connectors")}
            className={`py-3 text-center border-r border-slate-800 font-bold transition-all ${activeRightTab === "connectors" ? "bg-slate-900 text-primary border-b-2 border-b-primary" : "text-muted-foreground hover:bg-slate-900/40"}`}
          >
            🧩 {tr("Connectors", "الموصلات")} ({connectors.length})
          </button>
          <button
            onClick={() => setActiveRightTab("automation")}
            className={`py-3 text-center border-r border-slate-800 font-bold transition-all ${activeRightTab === "automation" ? "bg-slate-900 text-amber-500 border-b-2 border-b-amber-500" : "text-muted-foreground hover:bg-slate-900/40"}`}
          >
            ⏰ {tr("Automation", "الأتمتة")} ({cronJobs.length})
          </button>
          <button
            onClick={() => setActiveRightTab("logs")}
            className={`py-3 text-center font-bold transition-all ${activeRightTab === "logs" ? "bg-slate-900 text-emerald-400 border-b-2 border-b-emerald-400" : "text-muted-foreground hover:bg-slate-900/40"}`}
          >
            📟 {tr("Live Logs", "السجلات")}
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="flex-1 overflow-y-auto p-3 scrollbar-hide">

          {/* TAB 1: 30+ Connectors Grid */}
          {activeRightTab === "connectors" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/40">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">Integrated MCP & API Ecosystem</span>
                <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-mono">31 Services Ready</span>
              </div>

              {/* Group by Categories */}
              {CONNECT_CATEGORIES.map((cat) => (
                <div key={cat} className="space-y-1.5">
                  <h5 className="text-[10px] font-black tracking-widest text-primary/80 uppercase font-mono mt-2.5">{cat}</h5>
                  <div className="grid grid-cols-1 gap-1.5">
                    {connectors.filter(c => c.category === cat).map((c) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-950/40 border border-slate-800/60 hover:border-slate-800 transition-all duration-150">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{c.icon}</span>
                          <div>
                            <span className="text-[11px] font-bold text-slate-200 block">{c.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono block">{c.keyName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {/* Online status indicator toggle */}
                          <button
                            onClick={() => toggleConnector(c.id)}
                            className={`w-3 h-3 rounded-full border transition-all ${c.status === "connected" ? "bg-emerald-500 border-emerald-400/30" : "bg-slate-800 border-slate-700"}`}
                            title={c.status === "connected" ? "Connected - click to disconnect" : "Disconnected - click to connect"}
                          />
                          <button
                            onClick={() => testConnector(c.id, c.name)}
                            className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                            title="Test API Endpoint Connection"
                          >
                            <Play size={10} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Automation Scheduler & Cron daemon */}
          {activeRightTab === "automation" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/40">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">24/7 Swarm Automation Scheduler</span>
                <span className="text-[10px] bg-amber-500/15 text-amber-400 px-2 py-0.5 rounded font-mono">Daemon Armed</span>
              </div>

              {/* Add Cron Scheduler form */}
              <form onSubmit={handleAddCron} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-slate-300">Create Automatic Swarm Cron Task</h4>
                <div>
                  <input
                    type="text"
                    required
                    value={customCronTitle}
                    onChange={(e) => setCustomCronTitle(e.target.value)}
                    placeholder="Task title (e.g. Refresh SEO reports)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      required
                      value={customCronSchedule}
                      onChange={(e) => setCustomCronSchedule(e.target.value)}
                      placeholder="Cron syntax (0 * * * *)"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <select
                      value={customCronAgent}
                      onChange={(e) => setCustomCronAgent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-1 text-[11px] focus:outline-none focus:border-amber-500 text-slate-300"
                    >
                      {subAgents.map(sa => (
                        <option key={sa.id} value={sa.id}>{sa.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-amber-500 text-slate-950 text-[10px] font-black font-mono py-1 rounded hover:bg-amber-400 transition-all flex items-center justify-center gap-1.5 uppercase"
                >
                  <Zap size={11} /> Register Auto Cron Daemon
                </button>
              </form>

              {/* Scheduled jobs roster list */}
              <div className="space-y-2">
                {cronJobs.map((cj) => {
                  const jobAgent = subAgents.find(sa => sa.id === cj.agentId);
                  return (
                    <div key={cj.id} className="p-2.5 rounded-xl bg-slate-950/40 border border-slate-800/60 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock size={11} className={cj.enabled ? "text-amber-400" : "text-slate-500"} />
                          <h5 className="font-bold text-[11px] text-slate-200">{cj.title}</h5>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => toggleCron(cj.id)}
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold font-mono uppercase ${cj.enabled ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}
                          >
                            {cj.enabled ? "ARMED" : "STANDBY"}
                          </button>
                          <button
                            onClick={() => deleteCron(cj.id)}
                            className="p-1 text-slate-500 hover:text-red-400"
                            title="Remove Cron Job"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] font-mono text-muted-foreground">
                        <span>Cron: <span className="text-amber-400/90">{cj.schedule}</span></span>
                        <span>Delegate: <span className="text-slate-300">{jobAgent?.name.split(" ")[0]}</span></span>
                      </div>
                      <div className="flex justify-between items-center text-[8px] font-mono border-t border-slate-800/30 pt-1.5 mt-0.5 text-slate-500">
                        <span>Last Execution: <span className="text-slate-400">{cj.lastRun || "Never"}</span></span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={8} className="text-emerald-500" /> Active cloud trigger</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: Virtual Dispatch Terminal logs console */}
          {activeRightTab === "logs" && (
            <div className="flex flex-col h-full space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/40">
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400">Live Swarm Dispatch Stream</span>
                <button
                  onClick={() => setDispatchLogs(["[SYSTEM] Swarm log console flushed."])}
                  className="text-[9px] hover:underline text-slate-400 hover:text-slate-200 font-mono"
                >
                  Clear logs
                </button>
              </div>

              {/* Terminal Logs View */}
              <div className="flex-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 font-mono text-[10px] text-emerald-400 leading-relaxed overflow-y-auto space-y-1 h-[400px] scrollbar-hide shadow-inner">
                {dispatchLogs.map((log, index) => {
                  let colorClass = "text-emerald-400";
                  if (log.includes("[SYSTEM]")) colorClass = "text-blue-400 font-bold";
                  if (log.includes("[MAESTRO]")) colorClass = "text-purple-400";
                  if (log.includes("[DISPATCH]")) colorClass = "text-amber-400";
                  if (log.includes("[SCHEDULER]")) colorClass = "text-amber-300";
                  if (log.includes("Success") || log.includes("successfully")) colorClass = "text-emerald-400 font-bold";
                  return (
                    <div key={index} className={`${colorClass} whitespace-pre-wrap break-all`}>
                      {log}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}