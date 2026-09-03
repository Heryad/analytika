"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Settings,
  Code,
  Shield,
  Trash2,
  Copy,
  Check,
  Globe,
  Lock,
  RefreshCcw,
  Plus,
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  Terminal,
  ExternalLink,
  CheckCircle2,
  Server,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  Sparkles,
  Bell,
  Mail,
  Zap,
  User,
  MapPin,
  Pencil,
  Info,
  Star,
  Reply,
  Send,
  Inbox,
  Tag,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { websitesApi, Website, WebsiteSnippets, alertsApi, AlertItem, paymentsApi, PaymentIntegration } from "@/lib/api";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Custom Toggle Switch Component matching app aesthetics
function Switch({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onCheckedChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${checked ? "bg-[#800E13]" : "bg-white/[0.12]"
        }`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${checked ? "translate-x-4" : "translate-x-0"
          }`}
      />
    </button>
  );
}

interface CustomEventAlert {
  id: string;
  name: string;
  eventId: string;
  subject: string;
  body: string;
  enabled: boolean;
  createdAt: string;
  lastTriggered?: string;
  icon: string;
}

const ALERT_VARIABLE_GROUPS = [
  {
    category: "Alert & Event",
    icon: Zap,
    color: "text-amber-400 border-amber-500/20 bg-amber-500/10",
    items: [
      { tag: "{{alert_name}}", label: "alert_name", sample: "Payment Completed" },
      { tag: "{{event.name}}", label: "name", sample: "Payment Completed" },
      { tag: "{{event.timestamp}}", label: "timestamp", sample: "Sep 1, 2026 21:45 UTC" },
    ],
  },
  {
    category: "Location",
    icon: MapPin,
    color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    items: [
      { tag: "{{visitor.country}}", label: "country", sample: "United States" },
      { tag: "{{location.region}}", label: "region", sample: "California" },
      { tag: "{{location.city}}", label: "city", sample: "San Francisco" },
    ],
  },
  {
    category: "Visitor",
    icon: User,
    color: "text-blue-400 border-blue-500/20 bg-blue-500/10",
    items: [
      { tag: "{{visitor.name}}", label: "name", sample: "Alex Morgan" },
      { tag: "{{visitor.email}}", label: "email", sample: "alex.morgan@acme.com" },
    ],
  },
  {
    category: "Source",
    icon: Globe,
    color: "text-purple-400 border-purple-500/20 bg-purple-500/10",
    items: [
      { tag: "{{source.referrer}}", label: "referrer", sample: "https://news.ycombinator.com" },
      { tag: "{{source.ref}}", label: "ref", sample: "producthunt" },
      { tag: "{{source.source}}", label: "source", sample: "newsletter" },
      { tag: "{{source.via}}", label: "via", sample: "twitter_ad" },
      { tag: "{{source.utm_source}}", label: "utm_source", sample: "google" },
      { tag: "{{source.utm_medium}}", label: "utm_medium", sample: "cpc" },
      { tag: "{{source.utm_campaign}}", label: "utm_campaign", sample: "summer_launch_2026" },
      { tag: "{{source.utm_term}}", label: "utm_term", sample: "web_analytics" },
      { tag: "{{source.utm_content}}", label: "utm_content", sample: "hero_banner" },
    ],
  },
  {
    category: "System",
    icon: Server,
    color: "text-rose-400 border-rose-500/20 bg-rose-500/10",
    items: [
      { tag: "{{system.device}}", label: "device", sample: "MacBook Pro" },
      { tag: "{{system.os}}", label: "os", sample: "macOS Sequoia" },
      { tag: "{{system.browser}}", label: "browser", sample: "Chrome 128.0" },
    ],
  },
];

function interpolateAlertText(text: string, alertName: string) {
  const displayName = alertName.trim() || "Payment Completed";
  return text
    .replace(/\{\{alert_name\}\}/g, displayName)
    .replace(/\{\{event_id\}\}/g, displayName)
    .replace(/\{\{event\.name\}\}/g, displayName)
    .replace(/\{\{event\.timestamp\}\}/g, "Sep 1, 2026, 9:45 PM UTC")
    .replace(/\{\{visitor\.country\}\}/g, "United States")
    .replace(/\{\{location\.country\}\}/g, "United States")
    .replace(/\{\{location\.region\}\}/g, "California")
    .replace(/\{\{location\.city\}\}/g, "San Francisco")
    .replace(/\{\{visitor\.name\}\}/g, "Alex Morgan")
    .replace(/\{\{visitor\.email\}\}/g, "alex.morgan@acme.com")
    .replace(/\{\{source\.referrer\}\}/g, "https://news.ycombinator.com")
    .replace(/\{\{source\.ref\}\}/g, "producthunt")
    .replace(/\{\{source\.source\}\}/g, "newsletter")
    .replace(/\{\{source\.via\}\}/g, "twitter_ad")
    .replace(/\{\{source\.utm_source\}\}/g, "google")
    .replace(/\{\{source\.utm_medium\}\}/g, "cpc")
    .replace(/\{\{source\.utm_campaign\}\}/g, "summer_launch_2026")
    .replace(/\{\{source\.utm_term\}\}/g, "web_analytics")
    .replace(/\{\{source\.utm_content\}\}/g, "hero_banner")
    .replace(/\{\{system\.device\}\}/g, "Desktop (Mac)")
    .replace(/\{\{system\.os\}\}/g, "macOS Sequoia")
    .replace(/\{\{system\.browser\}\}/g, "Chrome 128.0");
}

function getAlertIconComponent(iconName: string) {
  switch (iconName) {
    case "dollar":
      return DollarSign;
    case "user":
      return User;
    case "bell":
      return Bell;
    case "sparkles":
      return Sparkles;
    case "globe":
      return Globe;
    case "zap":
    default:
      return Zap;
  }
}

interface WebsiteSettingsClientProps {
  websiteId: string;
  initialWebsite: Website | null;
  initialSnippets: WebsiteSnippets | null;
}

export function WebsiteSettingsClient({
  websiteId,
  initialWebsite,
  initialSnippets,
}: WebsiteSettingsClientProps) {
  const router = useRouter();

  const [site, setSite] = useState<Website | null>(initialWebsite);
  const [isLoadingSite, setIsLoadingSite] = useState(!initialWebsite);
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);
  const [isUpdatingPublic, setIsUpdatingPublic] = useState(false);
  const [isUpdatingLocalhost, setIsUpdatingLocalhost] = useState(false);

  // Top Tabs
  const [activeTab, setActiveTab] = useState<"general" | "tracking" | "proxy" | "revenue" | "alerts" | "filters" | "danger">("general");

  // General Tab State
  const [siteName, setSiteName] = useState(initialWebsite?.name || initialWebsite?.domain || "");
  const [initialSavedName, setInitialSavedName] = useState(initialWebsite?.name || initialWebsite?.domain || "");
  const [timezone, setTimezone] = useState(initialWebsite?.timezone || "UTC (GMT+00:00)");
  const [initialTimezone, setInitialTimezone] = useState(initialWebsite?.timezone || "UTC (GMT+00:00)");
  const [currency, setCurrency] = useState(initialWebsite?.currency || "USD ($)");
  const [initialCurrency, setInitialCurrency] = useState(initialWebsite?.currency || "USD ($)");
  const [revenueModel, setRevenueModel] = useState<string>(initialWebsite?.revenueModel || "revenue");
  const [initialRevenueModel, setInitialRevenueModel] = useState<string>(initialWebsite?.revenueModel || "revenue");
  const [isSaved, setIsSaved] = useState(false);

  // Public Sharing
  const [isPublic, setIsPublic] = useState(Boolean(initialWebsite?.isPublic));
  const [hasPassword, setHasPassword] = useState(false);
  const [sharePassword, setSharePassword] = useState("");

  // Tracking Snippet & Proxy State
  const [snippetTab, setSnippetTab] = useState<"html" | "next" | "npm" | "react">("html");
  const [pkgManager, setPkgManager] = useState<"npm" | "pnpm" | "bun" | "yarn">("npm");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);
  const [allowLocalhost, setAllowLocalhost] = useState(initialWebsite?.allowLocalhost !== false);
  const [customProxyDomain, setCustomProxyDomain] = useState(initialWebsite?.customProxyDomain || "");
  const [isVerifyingProxy, setIsVerifyingProxy] = useState(false);
  const [proxyVerified, setProxyVerified] = useState(Boolean(initialWebsite?.proxyVerified));

  useEffect(() => {
    if (site) return;
    let mounted = true;
    setIsLoadingSite(true);
    websitesApi
      .get(websiteId)
      .then((res) => {
        if (!mounted) return;
        if (res.success && res.website) {
          setSite(res.website);
          const name = res.website.name || res.website.domain || "";
          setSiteName(name);
          setInitialSavedName(name);
          if (res.website.timezone) {
            setTimezone(res.website.timezone);
            setInitialTimezone(res.website.timezone);
          }
          if (res.website.currency) {
            setCurrency(res.website.currency);
            setInitialCurrency(res.website.currency);
          }
          if (res.website.revenueModel) {
            setRevenueModel(res.website.revenueModel);
            setInitialRevenueModel(res.website.revenueModel);
          }
          setIsPublic(Boolean(res.website.isPublic));
          setHasPassword(Boolean(res.website.sharePasswordHash));
          if (res.website.sharePasswordHash) {
            setSharePassword("••••••");
          }
          setAllowLocalhost(res.website.allowLocalhost !== false);
          setCustomProxyDomain(res.website.customProxyDomain || (res.website.domain ? `stats.${res.website.domain}` : ""));
          setProxyVerified(Boolean(res.website.proxyVerified));
          if (res.website.ignoreMyVisits !== undefined) {
            setIgnoreMyVisits(Boolean(res.website.ignoreMyVisits));
          }
          if (Array.isArray(res.website.blockedIps)) {
            setBlockedIps(res.website.blockedIps);
          }
          if (Array.isArray(res.website.excludedPaths)) {
            setExcludedPaths(res.website.excludedPaths);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load website settings:", err);
      })
      .finally(() => {
        if (mounted) setIsLoadingSite(false);
      });
    return () => {
      mounted = false;
    };
  }, [websiteId, site]);

  const siteDomain = site?.domain || (initialWebsite?.domain || "");
  const initialDomain = siteDomain;

  // Filters State
  const [ignoreMyVisits, setIgnoreMyVisits] = useState(
    initialWebsite?.ignoreMyVisits !== undefined ? Boolean(initialWebsite.ignoreMyVisits) : true
  );
  const [blockedIps, setBlockedIps] = useState<string[]>(
    Array.isArray(initialWebsite?.blockedIps) ? initialWebsite.blockedIps : []
  );
  const [newIp, setNewIp] = useState("");
  const [excludedPaths, setExcludedPaths] = useState<string[]>(
    Array.isArray(initialWebsite?.excludedPaths) ? initialWebsite.excludedPaths : []
  );
  const [newPath, setNewPath] = useState("");

  // Check local exclusion cookie/storage on client mount
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const isIgnored =
          window.localStorage?.getItem("analytika_ignore") === "true" ||
          document.cookie?.includes("analytika_ignore=true");
        if (isIgnored) {
          setIgnoreMyVisits(true);
        }
      }
    } catch { }
  }, []);

  // Danger Zone State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetConfirmInput, setResetConfirmInput] = useState("");
  const [isResettingData, setIsResettingData] = useState(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState("");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [isDeletingWebsite, setIsDeletingWebsite] = useState(false);

  // Revenue Attribution / Payment Integrations State
  type PaymentPlatform = "stripe" | "polar" | "dodo" | "paddle" | "lemonsqueezy";
  const [paymentPlatform, setPaymentPlatform] = useState<PaymentPlatform>("stripe");
  const [autoAttribution, setAutoAttribution] = useState(true);
  const [platformError, setPlatformError] = useState<string | null>(null);

  // Platform Form Inputs (Direct API)
  const [stripeKey, setStripeKey] = useState("");
  const [polarToken, setPolarToken] = useState("");
  const [dodoApiKey, setDodoApiKey] = useState("");
  const [paddleApiKey, setPaddleApiKey] = useState("");
  const [lemonApiKey, setLemonApiKey] = useState("");
  const [lemonStoreId, setLemonStoreId] = useState("");

  // Visibility toggle for secret inputs
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const toggleSecret = (field: string) => {
    setShowSecrets((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // Connection status per platform
  const [connectionState, setConnectionState] = useState<
    Record<PaymentPlatform, { isConnected: boolean; isConnecting: boolean; connectedAt?: string; apiKeyMasked?: string }>
  >({
    stripe: { isConnected: false, isConnecting: false },
    polar: { isConnected: false, isConnecting: false },
    dodo: { isConnected: false, isConnecting: false },
    paddle: { isConnected: false, isConnecting: false },
    lemonsqueezy: { isConnected: false, isConnecting: false },
  });

  // Load Payment Integrations from Backend
  useEffect(() => {
    if (!websiteId) return;
    paymentsApi
      .list(websiteId)
      .then((res) => {
        if (res.success && Array.isArray(res.integrations)) {
          const nextState: Record<
            PaymentPlatform,
            { isConnected: boolean; isConnecting: boolean; connectedAt?: string; apiKeyMasked?: string }
          > = {
            stripe: { isConnected: false, isConnecting: false },
            polar: { isConnected: false, isConnecting: false },
            dodo: { isConnected: false, isConnecting: false },
            paddle: { isConnected: false, isConnecting: false },
            lemonsqueezy: { isConnected: false, isConnecting: false },
          };

          res.integrations.forEach((item) => {
            const plat = item.platform as PaymentPlatform;
            if (nextState[plat]) {
              nextState[plat] = {
                isConnected: item.isConnected,
                isConnecting: false,
                connectedAt: item.connectedAt
                  ? new Date(item.connectedAt).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                  : "Connected",
                apiKeyMasked: item.apiKeyMasked || undefined,
              };
              if (item.apiKeyMasked) {
                if (plat === "stripe") setStripeKey(item.apiKeyMasked);
                if (plat === "polar") setPolarToken(item.apiKeyMasked);
                if (plat === "dodo") setDodoApiKey(item.apiKeyMasked);
                if (plat === "paddle") setPaddleApiKey(item.apiKeyMasked);
                if (plat === "lemonsqueezy") setLemonApiKey(item.apiKeyMasked);
              }
              if (item.storeId && plat === "lemonsqueezy") {
                setLemonStoreId(item.storeId);
              }
              if (item.autoAttribution !== undefined) {
                setAutoAttribution(item.autoAttribution);
              }
            }
          });
          setConnectionState(nextState);
        }
      })
      .catch((err) => console.error("Failed to load payment integrations:", err));
  }, [websiteId]);

  const handleConnectPlatform = async (platform: PaymentPlatform) => {
    setPlatformError(null);
    let apiKey = "";
    let storeId: string | undefined = undefined;

    if (platform === "stripe") apiKey = stripeKey;
    else if (platform === "polar") apiKey = polarToken;
    else if (platform === "dodo") apiKey = dodoApiKey;
    else if (platform === "paddle") apiKey = paddleApiKey;
    else if (platform === "lemonsqueezy") {
      apiKey = lemonApiKey;
      storeId = lemonStoreId;
    }

    if (!apiKey || !apiKey.trim()) {
      setPlatformError("Please enter a valid API key or token.");
      return;
    }

    setConnectionState((prev) => ({
      ...prev,
      [platform]: { ...prev[platform], isConnecting: true },
    }));

    try {
      const res = await paymentsApi.connect(websiteId, {
        platform,
        apiKey: apiKey.trim(),
        storeId: storeId ? storeId.trim() : undefined,
        autoAttribution,
      });

      if (res.success && res.integration) {
        setConnectionState((prev) => ({
          ...prev,
          [platform]: {
            isConnected: true,
            isConnecting: false,
            connectedAt: "Just now",
            apiKeyMasked: res.integration.apiKeyMasked || undefined,
          },
        }));
        if (res.integration.apiKeyMasked) {
          if (platform === "stripe") setStripeKey(res.integration.apiKeyMasked);
          if (platform === "polar") setPolarToken(res.integration.apiKeyMasked);
          if (platform === "dodo") setDodoApiKey(res.integration.apiKeyMasked);
          if (platform === "paddle") setPaddleApiKey(res.integration.apiKeyMasked);
          if (platform === "lemonsqueezy") setLemonApiKey(res.integration.apiKeyMasked);
        }
      } else {
        setPlatformError(res.message || "Failed to verify credentials.");
        setConnectionState((prev) => ({
          ...prev,
          [platform]: { ...prev[platform], isConnecting: false },
        }));
      }
    } catch (err: any) {
      console.error("Failed to connect platform:", err);
      setPlatformError(err?.message || "Verification failed. Please check your credentials.");
      setConnectionState((prev) => ({
        ...prev,
        [platform]: { ...prev[platform], isConnecting: false },
      }));
    }
  };

  const handleDisconnectPlatform = async (platform: PaymentPlatform) => {
    setPlatformError(null);
    try {
      await paymentsApi.disconnect(websiteId, platform);
      setConnectionState((prev) => ({
        ...prev,
        [platform]: { isConnected: false, isConnecting: false },
      }));
      if (platform === "stripe") setStripeKey("");
      if (platform === "polar") setPolarToken("");
      if (platform === "dodo") setDodoApiKey("");
      if (platform === "paddle") setPaddleApiKey("");
      if (platform === "lemonsqueezy") {
        setLemonApiKey("");
        setLemonStoreId("");
      }
    } catch (err: any) {
      console.error("Failed to disconnect platform:", err);
    }
  };

  const handleToggleAutoAttribution = async (checked: boolean) => {
    setAutoAttribution(checked);
    try {
      await paymentsApi.updateAttribution(websiteId, paymentPlatform, checked);
    } catch (err) {
      console.error("Failed to update auto attribution:", err);
    }
  };

  // Alerts State (Loaded from Backend)
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [isLoadingAlerts, setIsLoadingAlerts] = useState(false);
  const [isSavingAlert, setIsSavingAlert] = useState(false);

  useEffect(() => {
    if (!websiteId) return;
    setIsLoadingAlerts(true);
    alertsApi
      .list(websiteId)
      .then((res) => {
        if (res.success && Array.isArray(res.alerts)) {
          setAlerts(res.alerts);
        }
      })
      .catch((err) => console.error("Failed to fetch alerts:", err))
      .finally(() => setIsLoadingAlerts(false));
  }, [websiteId]);

  // Alert Modal State
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [modalEventId, setModalEventId] = useState("");
  const [modalName, setModalName] = useState("");
  const [modalSubject, setModalSubject] = useState("New {{alert_name}} from {{visitor.country}}");
  const [modalBody, setModalBody] = useState(`Hi Team,\n\nA new {{alert_name}} occurred on ${initialDomain || "your website"}!\n\nVisitor: {{visitor.name}} ({{visitor.email}})\nLocation: {{location.city}}, {{location.country}}\nSource: {{source.utm_source}} / {{source.utm_campaign}}\nDevice: {{system.browser}} on {{system.os}}`);
  const [modalIcon, setModalIcon] = useState("zap");
  const [modalPreviewTab, setModalPreviewTab] = useState<"edit" | "preview">("edit");
  const [isVariablesDrawerOpen, setIsVariablesDrawerOpen] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testSentSuccess, setTestSentSuccess] = useState(false);

  // Delete Alert Confirmation Modal State
  const [alertToDelete, setAlertToDelete] = useState<AlertItem | null>(null);
  const [isDeletingAlert, setIsDeletingAlert] = useState(false);

  const handleOpenCreateAlert = () => {
    setEditingAlertId(null);
    setModalEventId("");
    setModalName("");
    setModalSubject("New {{alert_name}} from {{visitor.country}}");
    setModalBody(`Hi Team,\n\nA new {{alert_name}} occurred on ${initialDomain || "your website"}!\n\nVisitor: {{visitor.name}} ({{visitor.email}})\nLocation: {{location.city}}, {{location.country}}\nSource: {{source.utm_source}} / {{source.utm_campaign}}\nDevice: {{system.browser}} on {{system.os}}`);
    setModalIcon("zap");
    setModalPreviewTab("edit");
    setIsVariablesDrawerOpen(false);
    setTestSentSuccess(false);
    setIsAlertModalOpen(true);
  };

  const handleEditAlert = (alert: AlertItem) => {
    setEditingAlertId(alert.id);
    setModalEventId(alert.eventId);
    setModalName(alert.name);
    setModalSubject(alert.subject);
    setModalBody(alert.body);
    setModalIcon(alert.icon || "zap");
    setModalPreviewTab("edit");
    setIsVariablesDrawerOpen(false);
    setTestSentSuccess(false);
    setIsAlertModalOpen(true);
  };

  const handleSaveAlert = async () => {
    if (!modalEventId.trim() || !modalName.trim() || isSavingAlert) return;
    setIsSavingAlert(true);
    try {
      if (editingAlertId) {
        const res = await alertsApi.update(editingAlertId, {
          name: modalName.trim(),
          eventId: modalEventId.trim(),
          subject: modalSubject,
          body: modalBody,
          icon: modalIcon,
        });
        if (res.success && res.alert) {
          setAlerts((prev) =>
            prev.map((a) => (a.id === editingAlertId ? res.alert : a))
          );
        }
      } else {
        const res = await alertsApi.create(websiteId, {
          name: modalName.trim(),
          eventId: modalEventId.trim(),
          subject: modalSubject || "New {{alert_name}} from {{visitor.country}}",
          body: modalBody,
          icon: modalIcon,
          enabled: true,
        });
        if (res.success && res.alert) {
          setAlerts((prev) => [res.alert, ...prev]);
        }
      }
      setIsAlertModalOpen(false);
    } catch (err) {
      console.error("Failed to save alert:", err);
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleConfirmDeleteAlert = async () => {
    if (!alertToDelete) return;
    setIsDeletingAlert(true);
    try {
      await alertsApi.delete(alertToDelete.id);
      setAlerts((prev) => prev.filter((a) => a.id !== alertToDelete.id));
      setAlertToDelete(null);
    } catch (err) {
      console.error("Failed to delete alert:", err);
    } finally {
      setIsDeletingAlert(false);
    }
  };

  const handleToggleAlert = async (id: string) => {
    const alert = alerts.find((a) => a.id === id);
    if (!alert) return;
    const newEnabled = !alert.enabled;
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: newEnabled } : a))
    );
    try {
      await alertsApi.update(id, { enabled: newEnabled });
    } catch (err) {
      console.error("Failed to toggle alert:", err);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, enabled: !newEnabled } : a))
      );
    }
  };

  const handleInsertVariable = (tag: string) => {
    setModalBody((prev) => `${prev} ${tag}`);
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      await alertsApi.sendTest({
        name: modalName.trim() || "Test Alert",
        eventId: modalEventId.trim() || "custom_event",
        domain: initialDomain || "yourdomain.com",
        subject: interpolateAlertText(modalSubject, modalName),
        body: interpolateAlertText(modalBody, modalName),
      });
      setTestSentSuccess(true);
      setTimeout(() => setTestSentSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to send test alert:", err);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Check if General Form is dirty
  const isGeneralDirty =
    siteName.trim() !== initialSavedName.trim() ||
    timezone !== initialTimezone ||
    currency !== initialCurrency ||
    revenueModel !== initialRevenueModel;

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    try {
      const res = await websitesApi.update(websiteId, {
        name: siteName,
        timezone,
        currency,
        revenueModel,
      });
      if (res.success && res.website) {
        setSite(res.website);
      }
      setInitialSavedName(siteName);
      setInitialTimezone(timezone);
      setInitialCurrency(currency);
      setInitialRevenueModel(revenueModel);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error("Failed to update general settings:", err);
    } finally {
      setIsSavingGeneral(false);
    }
  };

  const handleToggleLocalhost = async (checked: boolean) => {
    setAllowLocalhost(checked);
    setIsUpdatingLocalhost(true);
    try {
      const res = await websitesApi.update(websiteId, {
        allowLocalhost: checked,
      });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to update localhost tracking:", err);
      setAllowLocalhost(!checked);
    } finally {
      setIsUpdatingLocalhost(false);
    }
  };

  const handleTogglePublic = async (checked: boolean) => {
    setIsPublic(checked);
    setIsUpdatingPublic(true);
    try {
      const res = await websitesApi.update(websiteId, {
        isPublic: checked,
      });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to update public sharing:", err);
      setIsPublic(!checked);
    } finally {
      setIsUpdatingPublic(false);
    }
  };

  const handleTogglePassword = async (checked: boolean) => {
    setHasPassword(checked);
    try {
      const res = await websitesApi.update(websiteId, {
        hasPassword: checked,
        sharePassword: checked ? (sharePassword === "••••••" ? undefined : sharePassword) : null,
      });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to update PIN code protection:", err);
      setHasPassword(!checked);
    }
  };

  const handleSavePassword = async () => {
    if (!hasPassword || !sharePassword || sharePassword === "••••••") return;
    try {
      const res = await websitesApi.update(websiteId, {
        hasPassword: true,
        sharePassword: sharePassword,
      });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to save PIN password:", err);
    }
  };

  // Filters & Privacy Handlers (Live DB Persistence & Browser Exclusions)
  const handleToggleIgnoreVisits = async (checked: boolean) => {
    setIgnoreMyVisits(checked);
    try {
      if (typeof window !== "undefined") {
        if (checked) {
          window.localStorage?.setItem("analytika_ignore", "true");
          document.cookie = "analytika_ignore=true; path=/; max-age=31536000; SameSite=Lax";
        } else {
          window.localStorage?.removeItem("analytika_ignore");
          document.cookie = "analytika_ignore=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        }
      }
      const res = await websitesApi.update(websiteId, { ignoreMyVisits: checked });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to update ignoreMyVisits:", err);
      setIgnoreMyVisits(!checked);
    }
  };

  const handleAddPath = async () => {
    let path = newPath.trim();
    if (!path) return;
    if (!path.startsWith("/")) path = "/" + path;
    if (excludedPaths.includes(path)) {
      setNewPath("");
      return;
    }
    const updated = [...excludedPaths, path];
    setExcludedPaths(updated);
    setNewPath("");
    try {
      const res = await websitesApi.update(websiteId, { excludedPaths: updated });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to add excluded path:", err);
    }
  };

  const handleRemovePath = async (pathToRemove: string) => {
    const updated = excludedPaths.filter((p) => p !== pathToRemove);
    setExcludedPaths(updated);
    try {
      const res = await websitesApi.update(websiteId, { excludedPaths: updated });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to remove excluded path:", err);
    }
  };

  const handleAddIp = async () => {
    const ip = newIp.trim();
    if (!ip) return;
    if (blockedIps.includes(ip)) {
      setNewIp("");
      return;
    }
    const updated = [...blockedIps, ip];
    setBlockedIps(updated);
    setNewIp("");
    try {
      const res = await websitesApi.update(websiteId, { blockedIps: updated });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to add blocked IP:", err);
    }
  };

  const handleRemoveIp = async (ipToRemove: string) => {
    const updated = blockedIps.filter((i) => i !== ipToRemove);
    setBlockedIps(updated);
    try {
      const res = await websitesApi.update(websiteId, { blockedIps: updated });
      if (res.success && res.website) {
        setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to remove blocked IP:", err);
    }
  };

  // Danger Zone Handlers
  const handleResetAnalyticsData = async () => {
    const input = resetConfirmInput.trim().toLowerCase();
    if (
      input !== siteDomain.toLowerCase() &&
      input !== siteName.toLowerCase() &&
      resetConfirmInput.trim() !== "RESET"
    ) {
      return;
    }

    setIsResettingData(true);
    try {
      const res = await websitesApi.resetData(websiteId);
      if (res.success) {
        setResetSuccessMessage(res.message || "All analytics data has been reset.");
        setTimeout(() => {
          setIsResetModalOpen(false);
          setResetConfirmInput("");
          setResetSuccessMessage("");
        }, 1600);
      }
    } catch (err: any) {
      console.error("Failed to reset analytics data:", err);
    } finally {
      setIsResettingData(false);
    }
  };

  const handleDeleteWebsite = async () => {
    const input = deleteConfirmInput.trim().toLowerCase();
    if (
      input !== siteDomain.toLowerCase() &&
      input !== siteName.toLowerCase()
    ) {
      return;
    }

    setIsDeletingWebsite(true);
    try {
      const res = await websitesApi.delete(websiteId);
      if (res.success) {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Failed to delete website:", err);
      setIsDeletingWebsite(false);
    }
  };

  const copyToClipboard = (text: string, type: "snippet" | "key" | "cname") => {
    navigator.clipboard.writeText(text);
    if (type === "snippet") {
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 2000);
    } else if (type === "key") {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    } else {
      setCopiedCname(true);
      setTimeout(() => setCopiedCname(false), 2000);
    }
  };


  const handleVerifyProxy = async () => {
    if (!customProxyDomain.trim()) return;
    setIsVerifyingProxy(true);
    try {
      if (customProxyDomain !== site?.customProxyDomain) {
        await websitesApi.update(websiteId, {
          customProxyDomain: customProxyDomain.trim(),
        });
      }
      const res = await websitesApi.verifyProxy(websiteId);
      if (res.success) {
        setProxyVerified(Boolean(res.verified));
        if (res.website) setSite(res.website);
      }
    } catch (err) {
      console.error("Failed to verify proxy DNS:", err);
    } finally {
      setIsVerifyingProxy(false);
    }
  };

  const trackerHost = proxyVerified && customProxyDomain ? `https://${customProxyDomain}` : "https://analytika.me";
  const snippetCode = `<script defer src="${trackerHost}/a.js" data-website-id="${websiteId}"></script>`;
  const apiKey = websiteId;

  return (
    <div className="space-y-6">
      {/* Top Header - Back Button & Site Title */}
      <div className="flex items-center gap-3.5">
        <Button
          asChild
          variant="outline"
          size="sm"
          className="h-9 w-9 p-0 bg-[#1F1F1F] border-white/[0.08] hover:bg-[#262626] hover:border-white/[0.15] text-zinc-400 hover:text-white rounded-xl cursor-pointer shrink-0"
          title="Back to Analytics"
        >
          <Link href={`/dashboard/${websiteId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white leading-tight">
            Project Settings
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5 font-mono">{initialDomain}</p>
        </div>
      </div>

      {/* Top Tabs Bar - Matching Account Settings Design */}
      <div className="flex items-center gap-1.5 border-b border-white/[0.08] pb-3 flex-wrap">
        {[
          { id: "general", label: "General", icon: Settings },
          { id: "tracking", label: "Tracking & SDK", icon: Code },
          { id: "proxy", label: "Custom Proxy", icon: Server },
          { id: "revenue", label: "Revenue & Payments", icon: DollarSign },
          { id: "alerts", label: "Alerts", icon: Bell },
          { id: "filters", label: "Filters & Privacy", icon: Shield },
          { id: "danger", label: "Danger Zone", icon: Trash2, danger: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${isActive
                  ? tab.danger
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-[#262626] text-white border border-white/[0.08]"
                  : tab.danger
                    ? "text-rose-400/80 hover:bg-rose-500/10 hover:text-rose-300"
                    : "text-zinc-400 hover:text-white hover:bg-[#262626]/50"
                }`}
            >
              <Icon className={`h-3.5 w-3.5 ${tab.danger ? "text-rose-400" : "text-zinc-400"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: GENERAL */}
      {activeTab === "general" && (
        <div className="max-w-2xl space-y-6">
          {/* Site Profile Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-white/[0.06]">
              <div className="w-14 h-14 rounded-2xl bg-[#1F1F1F] border border-white/[0.08] flex items-center justify-center p-2 shrink-0 relative group shadow-inner">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${initialDomain}&sz=128`}
                  alt={initialDomain}
                  className="w-8 h-8 object-contain rounded-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-white truncate">{siteName}</h2>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono mt-0.5">
                  <span>{initialDomain}</span>
                  <a
                    href={`https://${initialDomain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Site Name & Readonly Domain */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Site Name</label>
                <Input
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                  className="bg-[#1F1F1F] border-white/[0.08] text-white text-sm"
                  placeholder="My Website"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-300">Primary Domain</label>
                  <span className="text-[11px] text-zinc-500 flex items-center gap-1 font-mono">
                    <Lock className="w-3 h-3" /> Permanent identifier
                  </span>
                </div>
                <Input
                  readOnly
                  disabled
                  value={initialDomain}
                  className="bg-[#141414] border-white/[0.06] text-zinc-400 text-sm font-mono cursor-not-allowed select-none opacity-80"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Timezone</span>
                  </label>
                  <Select value={timezone} onValueChange={setTimezone}>
                    <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC (GMT+00:00)">UTC (GMT+00:00)</SelectItem>
                      <SelectItem value="America/New_York (EST)">America/New_York (EST)</SelectItem>
                      <SelectItem value="America/Los_Angeles (PST)">America/Los_Angeles (PST)</SelectItem>
                      <SelectItem value="Europe/London (GMT)">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Europe/Berlin (CET)">Europe/Berlin (CET)</SelectItem>
                      <SelectItem value="Asia/Dubai (GST)">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Tokyo (JST)">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Currency</span>
                  </label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD ($)">USD ($)</SelectItem>
                      <SelectItem value="EUR (€)">EUR (€)</SelectItem>
                      <SelectItem value="GBP (£)">GBP (£)</SelectItem>
                      <SelectItem value="CAD ($)">CAD ($)</SelectItem>
                      <SelectItem value="AUD ($)">AUD ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Primary KPI</span>
                  </label>
                  <Select value={revenueModel} onValueChange={setRevenueModel}>
                    <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                      <SelectValue placeholder="Select KPI metric">
                        {revenueModel === "mrr"
                          ? "Monthly Recurring (MRR)"
                          : revenueModel === "arr"
                            ? "Annual Recurring (ARR)"
                            : "Total Revenue"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">Total Revenue</SelectItem>
                      <SelectItem value="mrr">Monthly Recurring (MRR)</SelectItem>
                      <SelectItem value="arr">Annual Recurring (ARR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              {isSaved ? (
                <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Saved successfully
                </span>
              ) : (
                <span />
              )}
              <Button
                disabled={!isGeneralDirty || isSavingGeneral}
                onClick={handleSaveGeneral}
                className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1.5 cursor-pointer"
              >
                {isSavingGeneral && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>

          {/* Public Dashboard Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  <span>Public Dashboard Sharing</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Allow anyone with the link to view this site's stats.</p>
              </div>
              <Switch checked={isPublic} onCheckedChange={handleTogglePublic} />
            </div>

            {isPublic && (
              <div className="space-y-4 pt-3 border-t border-white/[0.06] animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Public URL</label>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      value={`https://analytika.me/share/${websiteId}`}
                      className="bg-[#1F1F1F] border-white/[0.08] text-zinc-300 text-xs font-mono select-all"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(`https://analytika.me/share/${websiteId}`, "snippet")}
                      className="border-white/[0.08] hover:bg-white/[0.04] text-white shrink-0 text-xs"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-medium text-zinc-300">PIN Code Protection</div>
                    <div className="text-[11px] text-zinc-500">Require visitors to enter a PIN to access stats.</div>
                  </div>
                  <Switch checked={hasPassword} onCheckedChange={handleTogglePassword} />
                </div>

                {hasPassword && (
                  <Input
                    type="password"
                    placeholder="Enter PIN code / password"
                    value={sharePassword}
                    onChange={(e) => setSharePassword(e.target.value)}
                    onBlur={handleSavePassword}
                    onKeyDown={(e) => e.key === "Enter" && handleSavePassword()}
                    className="bg-[#1F1F1F] border-white/[0.08] text-white text-sm max-w-xs"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TRACKING & SDK */}
      {activeTab === "tracking" && (
        <div className="max-w-2xl space-y-6">
          {/* Tracking Snippet & Framework Selector Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Code className="w-4 h-4 text-zinc-400" />
                <span>Tracking & SDK Setup</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Choose your framework or installation method to start collecting stats.
              </p>
            </div>

            {/* Framework Selector Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#1A1A1A] border border-white/[0.06] rounded-xl">
              {[
                { id: "html", label: "HTML Script" },
                { id: "next", label: "Next.js" },
                { id: "npm", label: "NPM Package" },
                { id: "react", label: "React / SPA" },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSnippetTab(f.id as any)}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium transition-all cursor-pointer text-center ${snippetTab === f.id
                      ? "bg-[#262626] text-white shadow-sm border border-white/[0.08]"
                      : "text-zinc-400 hover:text-zinc-200"
                    }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* NPM Package Manager Selector when NPM is active */}
            {snippetTab === "npm" && (
              <div className="space-y-2 pt-1 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>1. Install the SDK package:</span>
                  <div className="flex items-center gap-1 bg-[#141414] p-0.5 rounded-lg border border-white/[0.06]">
                    {(["npm", "pnpm", "bun", "yarn"] as const).map((pm) => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setPkgManager(pm)}
                        className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors cursor-pointer ${pkgManager === pm ? "bg-[#800E13] text-white" : "text-zinc-500 hover:text-zinc-300"
                          }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-[#141414] border border-white/[0.08] rounded-xl px-3.5 py-2.5 font-mono text-xs text-zinc-300">
                  <span>
                    <span className="text-zinc-500">$</span>{" "}
                    {pkgManager === "npm" && "npm install @analytika-me/tracker"}
                    {pkgManager === "pnpm" && "pnpm add @analytika-me/tracker"}
                    {pkgManager === "bun" && "bun add @analytika-me/tracker"}
                    {pkgManager === "yarn" && "yarn add @analytika-me/tracker"}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(
                        pkgManager === "npm"
                          ? "npm install @analytika-me/tracker"
                          : pkgManager === "pnpm"
                            ? "pnpm add @analytika-me/tracker"
                            : pkgManager === "bun"
                              ? "bun add @analytika-me/tracker"
                              : "yarn add @analytika-me/tracker",
                        "snippet"
                      )
                    }
                    className="h-6 text-[11px] text-zinc-400 hover:text-white px-2 -mr-1"
                  >
                    <Copy className="w-3 h-3 mr-1" /> Copy
                  </Button>
                </div>
                <div className="text-xs text-zinc-400 pt-1">2. Initialize in your code:</div>
              </div>
            )}

            {/* Terminal Window Code Block */}
            <div className="rounded-xl bg-[#141414] border border-white/[0.08] overflow-hidden shadow-inner">
              <div className="flex items-center justify-between px-3.5 py-2 bg-[#1A1A1A] border-b border-white/[0.06]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  <span className="text-[11px] font-mono text-zinc-400 ml-2">
                    {snippetTab === "html" && "index.html"}
                    {snippetTab === "next" && "app/layout.tsx"}
                    {snippetTab === "npm" && "src/analytics.ts"}
                    {snippetTab === "react" && "src/App.tsx"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    const codeToCopy =
                      snippetTab === "html"
                        ? `<script defer src="${trackerHost}/a.js" data-website-id="${websiteId}"></script>`
                        : snippetTab === "next"
                          ? `import Script from "next/script";\n\nexport default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <head>\n        <Script\n          defer\n          src="${trackerHost}/a.js"\n          data-website-id="${websiteId}"\n          strategy="afterInteractive"\n        />\n      </head>\n      <body>{children}</body>\n    </html>\n  );\n}`
                          : snippetTab === "npm"
                            ? `import { initAnalytics, trackEvent } from "@analytika-me/tracker";\n\n// 1. Initialize once in your app\ninitAnalytics({\n  websiteId: "${websiteId}",\n});\n\n// 2. Track custom events\ntrackEvent("Sign Up Clicked", { plan: "pro" });`
                            : `import { useEffect } from "react";\nimport { initAnalytics } from "@analytika-me/tracker";\n\nexport default function App() {\n  useEffect(() => {\n    initAnalytics({ websiteId: "${websiteId}" });\n  }, []);\n\n  return <div>My App</div>;\n}`;
                    copyToClipboard(codeToCopy, "snippet");
                  }}
                  className="h-7 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] px-2.5 cursor-pointer"
                >
                  {copiedSnippet ? (
                    <>
                      <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copy Code
                    </>
                  )}
                </Button>
              </div>

              {/* Code Content */}
              <div className="p-4 font-mono text-xs text-zinc-300 overflow-x-auto whitespace-pre leading-relaxed">
                {snippetTab === "html" && (
                  <>
                    <span className="text-zinc-500">&lt;!-- Analytika Web Tracker --&gt;</span>{"\n"}
                    <span className="text-rose-400">&lt;script</span>{" "}
                    <span className="text-zinc-400">defer</span>{" "}
                    <span className="text-amber-300">src</span>=
                    <span className="text-emerald-300">&quot;{trackerHost}/a.js&quot;</span>{" "}
                    <span className="text-amber-300">data-website-id</span>=
                    <span className="text-emerald-300">&quot;{websiteId}&quot;</span>
                    <span className="text-rose-400">&gt;&lt;/script&gt;</span>
                  </>
                )}

                {snippetTab === "next" && (
                  <>
                    <span className="text-rose-400">import</span> Script <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;next/script&quot;</span>;{"\n\n"}
                    <span className="text-rose-400">export default function</span> <span className="text-amber-300">RootLayout</span>({"{"} children {"}"}: {"{"} children: React.ReactNode {"}"}) {"{\n"}
                    {"  "}<span className="text-rose-400">return</span> ({"\n"}
                    {"    "}&lt;<span className="text-rose-400">html</span> <span className="text-amber-300">lang</span>=<span className="text-emerald-300">&quot;en&quot;</span>&gt;{"\n"}
                    {"      "}&lt;<span className="text-rose-400">head</span>&gt;{"\n"}
                    {"        "}&lt;<span className="text-amber-300">Script</span>{"\n"}
                    {"          "}<span className="text-zinc-400">defer</span>{"\n"}
                    {"          "}<span className="text-amber-300">src</span>=<span className="text-emerald-300">&quot;{trackerHost}/a.js&quot;</span>{"\n"}
                    {"          "}<span className="text-amber-300">data-website-id</span>=<span className="text-emerald-300">&quot;{websiteId}&quot;</span>{"\n"}
                    {"          "}<span className="text-amber-300">strategy</span>=<span className="text-emerald-300">&quot;afterInteractive&quot;</span>{"\n"}
                    {"        "}/&gt;{"\n"}
                    {"      "}&lt;/<span className="text-rose-400">head</span>&gt;{"\n"}
                    {"      "}&lt;<span className="text-rose-400">body</span>&gt;{"{"}children{"}"}&lt;/<span className="text-rose-400">body</span>&gt;{"\n"}
                    {"    "}&lt;/<span className="text-rose-400">html</span>&gt;{"\n"}
                    {"  "});{"\n"}
                    {"}"}
                  </>
                )}

                {snippetTab === "npm" && (
                  <>
                    <span className="text-rose-400">import</span> {"{ initAnalytics, trackEvent }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;@analytika-me/tracker&quot;</span>;{"\n\n"}
                    <span className="text-zinc-500">// 1. Initialize once in your app</span>{"\n"}
                    <span className="text-amber-300">initAnalytics</span>({"{\n"}
                    {"  "}websiteId: <span className="text-emerald-300">&quot;{websiteId}&quot;</span>,{"\n"}
                    {"});\n\n"}
                    <span className="text-zinc-500">// 2. Track custom events</span>{"\n"}
                    <span className="text-amber-300">trackEvent</span>(<span className="text-emerald-300">&quot;Sign Up Clicked&quot;</span>, {"{ "}plan: <span className="text-emerald-300">&quot;pro&quot;</span>{" }"});
                  </>
                )}

                {snippetTab === "react" && (
                  <>
                    <span className="text-rose-400">import</span> {"{ useEffect }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;react&quot;</span>;{"\n"}
                    <span className="text-rose-400">import</span> {"{ initAnalytics }"} <span className="text-rose-400">from</span> <span className="text-emerald-300">&quot;@analytika-me/tracker&quot;</span>;{"\n\n"}
                    <span className="text-rose-400">export default function</span> <span className="text-amber-300">App</span>() {"{\n"}
                    {"  "}<span className="text-amber-300">useEffect</span>(() =&gt; {"{\n"}
                    {"    "}<span className="text-amber-300">initAnalytics</span>({"{"} websiteId: <span className="text-emerald-300">&quot;{websiteId}&quot;</span> {"}"});{"\n"}
                    {"  }"}, []);{"\n\n"}
                    {"  "}<span className="text-rose-400">return</span> &lt;<span className="text-rose-400">div</span>&gt;My Application&lt;/<span className="text-rose-400">div</span>&gt;;{"\n"}
                    {"}"}
                  </>
                )}
              </div>
            </div>

            {/* Client API Key */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-medium text-zinc-300">Client API Key (NPM SDK)</label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={apiKey}
                  className="bg-[#141414] border-white/[0.08] text-zinc-300 text-xs font-mono select-all"
                />
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(apiKey, "key")}
                  className="border-white/[0.08] hover:bg-white/[0.04] text-white shrink-0 text-xs"
                >
                  {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>

            {/* Localhost Tracking */}
            <div className="flex items-center justify-between py-2 border-t border-white/[0.06]">
              <div>
                <div className="text-xs font-medium text-zinc-200">Track Localhost & Staging</div>
                <div className="text-[11px] text-zinc-500">Record pageviews when developing locally on localhost.</div>
              </div>
              <Switch checked={allowLocalhost} onCheckedChange={handleToggleLocalhost} />
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOM DOMAIN PROXY */}
      {activeTab === "proxy" && (
        <div className="max-w-2xl space-y-6">
          {/* Custom Domain / Reverse Proxy Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-zinc-400" />
              <div>
                <h2 className="text-base font-semibold text-white">Custom Domain Proxy (Ad-Block Bypass)</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Route analytics requests through your own domain to bypass ad-blockers.</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-[#1F1F1F] border border-white/[0.06] space-y-3">
              <div className="text-xs text-zinc-300">
                1. Add a <span className="font-mono text-white bg-white/[0.06] px-1 py-0.5 rounded">CNAME</span> record at your DNS provider:
              </div>

              <div className="grid grid-cols-3 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06]">
                  <div className="text-[10px] text-zinc-500 uppercase">Type</div>
                  <div className="text-white mt-0.5">CNAME</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06]">
                  <div className="text-[10px] text-zinc-500 uppercase">Host</div>
                  <div className="text-white mt-0.5">stats</div>
                </div>
                <div className="p-2.5 rounded-lg bg-[#141414] border border-white/[0.06] relative group">
                  <div className="text-[10px] text-zinc-500 uppercase">Target</div>
                  <div className="text-rose-300 mt-0.5 truncate">proxy.analytika.me</div>
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300">Your Proxy Domain</label>
                {proxyVerified && (
                  <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> DNS Verified & Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={customProxyDomain}
                  onChange={(e) => {
                    setCustomProxyDomain(e.target.value);
                    setProxyVerified(false);
                  }}
                  placeholder={`stats.${initialDomain || "yourdomain.com"}`}
                  className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
                />
                <Button
                  onClick={handleVerifyProxy}
                  variant="outline"
                  className={`border-white/[0.08] hover:bg-white/[0.04] text-xs shrink-0 ${proxyVerified ? "text-emerald-400 border-emerald-500/30" : "text-zinc-200"
                    }`}
                >
                  <RefreshCcw className={`w-3.5 h-3.5 mr-1.5 ${isVerifyingProxy ? "animate-spin text-rose-400" : ""}`} />
                  {isVerifyingProxy ? "Verifying..." : proxyVerified ? "Re-verify" : "Verify DNS"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVENUE & PAYMENTS */}
      {activeTab === "revenue" && (
        <div className="max-w-2xl space-y-6">
          {/* Revenue Attribution & Payment Gateways Card */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-5">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-zinc-400" />
                <span>Revenue Attribution & Payments</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Connect your billing provider to attribute revenue, conversion rates, and LTV directly to marketing channels.
              </p>
            </div>

            {/* Platform Selector Dropdown using Shadcn Select */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Payment Provider</label>
              <Select
                value={paymentPlatform}
                onValueChange={(val) => setPaymentPlatform(val as PaymentPlatform)}
              >
                <SelectTrigger className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs h-10">
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="stripe">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#635BFF]/20 text-[#9B95FF] text-[10px] font-bold font-mono">
                        STRIPE
                      </span>
                      <span>Stripe Payments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="polar">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#0062FF]/20 text-[#4D94FF] text-[10px] font-bold font-mono">
                        POLAR
                      </span>
                      <span>Polar (polar.sh)</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="dodo">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#FF6B00]/20 text-[#FFA05C] text-[10px] font-bold font-mono">
                        DODO
                      </span>
                      <span>Dodo Payments</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="paddle">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#00D09C]/20 text-[#5CFFD4] text-[10px] font-bold font-mono">
                        PADDLE
                      </span>
                      <span>Paddle Billing</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lemonsqueezy">
                    <div className="flex items-center gap-2 font-medium">
                      <span className="px-1.5 py-0.5 rounded bg-[#FFC233]/20 text-[#FFE082] text-[10px] font-bold font-mono">
                        LEMON
                      </span>
                      <span>Lemon Squeezy</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Platform Fields (Direct API) */}
            <div className="space-y-3.5 pt-1">
              {paymentPlatform === "stripe" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Restricted / Secret API Key
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">rk_live_...</span>
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showSecrets.stripeKey ? "text" : "password"}
                      value={stripeKey}
                      onChange={(e) => setStripeKey(e.target.value)}
                      placeholder="rk_live_... or sk_live_..."
                      className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("stripeKey")}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSecrets.stripeKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Analytika securely queries charges, checkout sessions, and invoices directly through the Stripe API.
                  </p>
                </div>
              )}

              {paymentPlatform === "polar" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Organization Access Token
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">polar_oat_...</span>
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showSecrets.polarToken ? "text" : "password"}
                      value={polarToken}
                      onChange={(e) => setPolarToken(e.target.value)}
                      placeholder="polar_oat_... or polar_at_..."
                      className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("polarToken")}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSecrets.polarToken ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Create a token with read permissions in Polar &rarr; Settings &rarr; Developers &rarr; Access Tokens.
                  </p>
                </div>
              )}

              {paymentPlatform === "dodo" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      Live API Key
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">dodo_live_...</span>
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showSecrets.dodoApiKey ? "text" : "password"}
                      value={dodoApiKey}
                      onChange={(e) => setDodoApiKey(e.target.value)}
                      placeholder="dodo_live_..."
                      className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("dodoApiKey")}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSecrets.dodoApiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Direct API integration for Dodo Payments charge syncing and MRR metrics.
                  </p>
                </div>
              )}

              {paymentPlatform === "paddle" && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">
                      API Secret Key
                    </label>
                    <span className="text-[11px] text-zinc-500 font-mono">pdl_live_apikey_...</span>
                  </div>
                  <div className="relative flex items-center">
                    <Input
                      type={showSecrets.paddleApiKey ? "text" : "password"}
                      value={paddleApiKey}
                      onChange={(e) => setPaddleApiKey(e.target.value)}
                      placeholder="pdl_live_apikey_..."
                      className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => toggleSecret("paddleApiKey")}
                      className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                    >
                      {showSecrets.paddleApiKey ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Generated from Paddle Billing &rarr; Developer Tools &rarr; Authentication.
                  </p>
                </div>
              )}

              {paymentPlatform === "lemonsqueezy" && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-zinc-300">
                        API Token
                      </label>
                      <span className="text-[11px] text-zinc-500 font-mono">eyJhbGciOi...</span>
                    </div>
                    <div className="relative flex items-center">
                      <Input
                        type={showSecrets.lemonApiKey ? "text" : "password"}
                        value={lemonApiKey}
                        onChange={(e) => setLemonApiKey(e.target.value)}
                        placeholder="eyJhbGciOi..."
                        className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => toggleSecret("lemonApiKey")}
                        className="absolute right-3 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                      >
                        {showSecrets.lemonApiKey ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-zinc-500">
                      Generate an API key in Lemon Squeezy &rarr; Settings &rarr; API.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-300">
                      Store ID
                    </label>
                    <Input
                      type="text"
                      value={lemonStoreId}
                      onChange={(e) => setLemonStoreId(e.target.value)}
                      placeholder="e.g. 12849"
                      className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
                    />
                    <p className="text-[11px] text-zinc-500">
                      Your Lemon Squeezy numeric Store ID.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Auto Attribution Toggle */}
            <div className="flex items-center justify-between py-2.5 border-t border-white/[0.06]">
              <div>
                <div className="text-xs font-medium text-zinc-200">Auto-Sync Revenue Attribution</div>
                <div className="text-[11px] text-zinc-500">
                  Automatically match incoming transactions and subscriptions to visitor sessions and UTM campaigns.
                </div>
              </div>
              <Switch checked={autoAttribution} onCheckedChange={handleToggleAutoAttribution} />
            </div>

            {platformError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{platformError}</span>
              </div>
            )}

            {/* Connection Actions Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
              {connectionState[paymentPlatform].isConnected ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-zinc-400 font-mono">
                    Verified {connectionState[paymentPlatform].connectedAt}
                  </span>
                </div>
              ) : (
                <span className="text-xs text-zinc-500">
                  Click connect to verify credentials with {paymentPlatform.toUpperCase()}
                </span>
              )}

              <div className="flex items-center gap-2">
                {connectionState[paymentPlatform].isConnected ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDisconnectPlatform(paymentPlatform)}
                      className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs h-8 cursor-pointer"
                    >
                      Disconnect
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleConnectPlatform(paymentPlatform)}
                      disabled={connectionState[paymentPlatform].isConnecting}
                      className="bg-[#1F1F1F] hover:bg-[#252525] border border-white/[0.1] text-zinc-200 text-xs h-8 cursor-pointer"
                    >
                      <RefreshCcw
                        className={`w-3.5 h-3.5 mr-1.5 ${connectionState[paymentPlatform].isConnecting ? "animate-spin text-rose-400" : ""
                          }`}
                      />
                      Re-verify
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleConnectPlatform(paymentPlatform)}
                    disabled={connectionState[paymentPlatform].isConnecting}
                    className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-8 px-4 cursor-pointer"
                  >
                    <RefreshCcw
                      className={`w-3.5 h-3.5 mr-1.5 ${connectionState[paymentPlatform].isConnecting ? "animate-spin" : ""
                        }`}
                    />
                    {connectionState[paymentPlatform].isConnecting
                      ? "Verifying API..."
                      : `Connect ${paymentPlatform === "stripe"
                        ? "Stripe"
                        : paymentPlatform === "polar"
                          ? "Polar"
                          : paymentPlatform === "dodo"
                            ? "Dodo"
                            : paymentPlatform === "paddle"
                              ? "Paddle"
                              : "Lemon Squeezy"
                      }`}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ALERTS & NOTIFICATIONS */}
      {activeTab === "alerts" && (
        <div className="max-w-3xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-zinc-400" />
                <span>Custom Event Alerts</span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Receive instant email alerts when visitors trigger custom events, conversions, or milestones.
              </p>
            </div>
            <Button
              onClick={handleOpenCreateAlert}
              className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-9 px-3.5 cursor-pointer shadow-sm shrink-0"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New Alert
            </Button>
          </div>

          {/* Alerts List */}
          {alerts.length === 0 ? (
            <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#1F1F1F] border border-white/[0.08] flex items-center justify-center mx-auto text-zinc-400">
                <Bell className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">No custom alerts configured</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Create alert rules to receive automated notifications when high-value events occur.
                </p>
              </div>
              <Button
                onClick={handleOpenCreateAlert}
                size="sm"
                className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-8 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Create Alert
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert) => {
                const IconComponent = getAlertIconComponent(alert.icon);
                return (
                  <div
                    key={alert.id}
                    className="rounded-2xl bg-[#262626] border border-white/[0.08] p-4 transition-all hover:border-white/[0.12] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#1F1F1F] border border-white/[0.08] flex items-center justify-center shrink-0 text-zinc-300">
                        <IconComponent className="w-4 h-4 text-zinc-300" />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-semibold text-white truncate">
                            {alert.name}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 text-[11px] font-mono border border-white/[0.04]">
                            event: {alert.eventId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-zinc-400 flex-wrap">
                          <span>Created: {alert.createdAt}</span>
                          {alert.lastTriggered && (
                            <>
                              <span>•</span>
                              <span className="text-zinc-500 font-mono">
                                Last triggered: {alert.lastTriggered}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Switch
                        checked={alert.enabled}
                        onCheckedChange={() => handleToggleAlert(alert.id)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAlert(alert)}
                        className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                        title="Edit Alert"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setAlertToDelete(alert)}
                        className="h-8 w-8 p-0 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                        title="Delete Alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* EXPANDED ALERT CREATION & EDIT MODAL */}
      <Dialog open={isAlertModalOpen} onOpenChange={setIsAlertModalOpen}>
        <DialogContent className="max-w-6xl w-[96vw] h-[94vh] max-h-[95vh] bg-[#1A1A1A] border-white/[0.1] text-white p-0 overflow-hidden shadow-2xl flex flex-col">
          <DialogHeader className="p-5 border-b border-white/[0.08] shrink-0">
            <DialogTitle className="text-base font-semibold text-white flex items-center gap-2">
              <Bell className="w-4 h-4 text-zinc-400" />
              <span>{editingAlertId ? "Edit Custom Event Alert" : "Create New Custom Event Alert"}</span>
            </DialogTitle>
          </DialogHeader>

          {/* 2-Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-white/[0.08] overflow-hidden">
            {/* Left Column: Event ID -> Alert Name -> Icons -> Code Guide */}
            <div className="lg:col-span-4 p-5 space-y-4 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                {/* 1. Event ID */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Event ID <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={modalEventId}
                    onChange={(e) => setModalEventId(e.target.value)}
                    placeholder="e.g. checkout_completed, demo_booked"
                    className="bg-[#141414] border-white/[0.08] text-white text-xs font-mono"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Backend identifier sent via <code className="text-zinc-400 font-mono">analytika.track(&apos;event_id&apos;)</code>.
                  </p>
                </div>

                {/* 2. Alert Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Alert Name <span className="text-rose-400">*</span>
                  </label>
                  <Input
                    value={modalName}
                    onChange={(e) => setModalName(e.target.value)}
                    placeholder="e.g. Payment Succeeded, Enterprise Demo"
                    className="bg-[#141414] border-white/[0.08] text-white text-xs"
                  />
                  <p className="text-[11px] text-zinc-500">
                    Display name used in notification subjects and bodies.
                  </p>
                </div>

                {/* 3. Icon Selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">Icon Badge</label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {[
                      { id: "zap", icon: Zap, label: "Event" },
                      { id: "dollar", icon: DollarSign, label: "Payment" },
                      { id: "user", icon: User, label: "User" },
                      { id: "bell", icon: Bell, label: "Alert" },
                      { id: "sparkles", icon: Sparkles, label: "Special" },
                      { id: "globe", icon: Globe, label: "Traffic" },
                    ].map((ic) => {
                      const Ic = ic.icon;
                      const isSelected = modalIcon === ic.id;
                      return (
                        <button
                          key={ic.id}
                          type="button"
                          onClick={() => setModalIcon(ic.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-xs ${isSelected
                              ? "bg-[#800E13]/20 border-[#800E13] text-white"
                              : "bg-[#141414] border-white/[0.06] text-zinc-400 hover:text-zinc-200"
                            }`}
                          title={ic.label}
                        >
                          <Ic className="w-3.5 h-3.5" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Learn About Events Box */}
              <div className="p-3.5 rounded-xl bg-[#141414] border border-white/[0.06] space-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Info className="w-3.5 h-3.5 text-zinc-400" />
                  <span>How to trigger custom events</span>
                </div>
                <div className="bg-[#1C1C1C] p-2.5 rounded-lg font-mono text-[11px] text-zinc-300 overflow-x-auto whitespace-pre">
                  <span className="text-purple-400">analytika</span>.<span className="text-amber-300">track</span>(
                  <span className="text-emerald-300">&quot;{modalEventId.trim() || "checkout_completed"}&quot;</span>, {"{\n"}
                  {"  "}name: <span className="text-emerald-300">&quot;Alex Morgan&quot;</span>,{"\n"}
                  {"  "}email: <span className="text-emerald-300">&quot;alex@acme.com&quot;</span>{"\n"}
                  {"}"});
                </div>
                <div className="text-[11px] text-zinc-500">
                  Properties passed to track payload dynamically populate template variables.
                </div>
              </div>
            </div>

            {/* Right Column: Template Builder & Gmail Preview (Fully Scrollable) */}
            <div className="lg:col-span-8 p-6 space-y-4 overflow-y-auto flex flex-col justify-between">
              <div className="space-y-4">
                {/* Subject Line */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-300">
                    Subject Line Template
                  </label>
                  <Input
                    value={modalSubject}
                    onChange={(e) => setModalSubject(e.target.value)}
                    placeholder="New {{alert_name}} from {{visitor.country}}"
                    className="bg-[#141414] border-white/[0.08] text-white text-xs font-mono"
                  />
                </div>

                {/* Collapsible Dynamic Variables Accordion / Drawer */}
                <div className="rounded-xl bg-[#141414] border border-white/[0.06] overflow-hidden transition-all">
                  <button
                    type="button"
                    onClick={() => setIsVariablesDrawerOpen(!isVariablesDrawerOpen)}
                    className="w-full px-3.5 py-2.5 flex items-center justify-between hover:bg-white/[0.02] cursor-pointer transition-colors text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Tag className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="text-xs font-medium text-zinc-200">Dynamic Variables</span>
                      <span className="text-[10px] text-zinc-500 bg-white/[0.06] px-1.5 py-0.5 rounded font-mono">
                        Click to insert
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <span className="text-[11px] text-zinc-500">
                        {isVariablesDrawerOpen ? "Hide variables" : "Show variables"}
                      </span>
                      {isVariablesDrawerOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </button>

                  {isVariablesDrawerOpen && (
                    <div className="p-3.5 pt-2 border-t border-white/[0.04] space-y-2.5 animate-in fade-in duration-150">
                      {ALERT_VARIABLE_GROUPS.map((grp) => (
                        <div key={grp.category} className="space-y-1">
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            {grp.category}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {grp.items.map((item) => (
                              <button
                                key={item.tag}
                                type="button"
                                onClick={() => handleInsertVariable(item.tag)}
                                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all cursor-pointer hover:scale-105 active:scale-95 ${grp.color}`}
                                title={`Sample value: ${item.sample}`}
                              >
                                {item.tag}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Tabs: Edit Body vs Gmail Live Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-zinc-300">Email Notification Body</label>
                    <div className="flex items-center gap-1 p-0.5 bg-[#141414] rounded-lg border border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => setModalPreviewTab("edit")}
                        className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${modalPreviewTab === "edit"
                            ? "bg-[#262626] text-white shadow-sm font-medium"
                            : "text-zinc-400 hover:text-zinc-200"
                          }`}
                      >
                        Template Body
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalPreviewTab("preview")}
                        className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer flex items-center gap-1 ${modalPreviewTab === "preview"
                            ? "bg-[#262626] text-white shadow-sm font-medium"
                            : "text-zinc-400 hover:text-zinc-200"
                          }`}
                      >
                        <Mail className="w-3 h-3 text-rose-400" />
                        Gmail Preview
                      </button>
                    </div>
                  </div>

                  {modalPreviewTab === "edit" ? (
                    <textarea
                      rows={10}
                      value={modalBody}
                      onChange={(e) => setModalBody(e.target.value)}
                      placeholder="Write your email notification body..."
                      className="w-full min-h-[280px] bg-[#141414] border border-white/[0.08] text-zinc-200 text-xs font-mono p-3.5 rounded-xl focus:outline-none focus:border-rose-500/50 resize-y leading-relaxed"
                    />
                  ) : (
                    /* Gmail-style Email Preview Box */
                    <div className="rounded-xl bg-[#141414] border border-white/[0.08] overflow-hidden text-xs flex flex-col">
                      {/* Gmail Header */}
                      <div className="bg-[#1C1C1C] px-4 py-2.5 border-b border-white/[0.06] flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px] font-mono">
                            M
                          </span>
                          <span className="text-zinc-300 font-medium text-[11px]">
                            Gmail Notification Simulation
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-500">
                          <Star className="w-3.5 h-3.5 hover:text-amber-400 cursor-pointer" />
                          <Reply className="w-3.5 h-3.5 hover:text-zinc-300 cursor-pointer" />
                        </div>
                      </div>

                      {/* Email Content Container */}
                      <div className="p-4 space-y-3.5 bg-[#111111]">
                        <div>
                          <div className="text-sm font-semibold text-white">
                            {interpolateAlertText(modalSubject || "New {{alert_name}} Alert", modalName)}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-1">
                            <span className="w-5 h-5 rounded-full bg-[#800E13] text-white flex items-center justify-center text-[10px] font-bold">
                              A
                            </span>
                            <span className="font-medium text-zinc-300">Analytika Alerts</span>
                            <span className="text-zinc-500">&lt;alerts@analytika.me&gt;</span>
                            <span className="text-zinc-600">to me</span>
                            <span className="text-zinc-500 ml-auto font-mono text-[10px]">Just now</span>
                          </div>
                        </div>

                        <div className="p-4 rounded-lg bg-[#1A1A1A] border border-white/[0.06] text-zinc-200 text-xs whitespace-pre-wrap font-sans leading-relaxed">
                          {interpolateAlertText(modalBody, modalName)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-white/[0.06] shrink-0 mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendTestEmail}
                  disabled={isSendingTest}
                  className="border-white/[0.08] hover:bg-white/[0.04] text-zinc-300 text-xs h-8 cursor-pointer"
                >
                  <Send className={`w-3 h-3 mr-1.5 ${isSendingTest ? "animate-spin" : ""}`} />
                  {isSendingTest
                    ? "Dispatching..."
                    : testSentSuccess
                      ? "✓ Test Email Sent!"
                      : "Send Test Email"}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAlertModalOpen(false)}
                    className="text-zinc-400 hover:text-white text-xs h-8 cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!modalEventId.trim() || !modalName.trim() || isSavingAlert}
                    onClick={handleSaveAlert}
                    className="bg-[#800E13] hover:bg-[#9e1218] text-white text-xs h-8 px-4 cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-sm"
                  >
                    {isSavingAlert && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {editingAlertId
                      ? isSavingAlert
                        ? "Updating Alert..."
                        : "Update Alert"
                      : isSavingAlert
                        ? "Saving Alert..."
                        : "Save Alert"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sweet Delete Confirmation Modal */}
      {alertToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#1E1E1E] border border-white/[0.1] rounded-2xl w-full max-w-sm shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Delete Custom Alert?</h3>
                <p className="text-xs text-zinc-400">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-300 bg-[#141414] p-3 rounded-lg border border-white/[0.06] font-mono leading-relaxed">
              Are you sure you want to remove <strong className="text-white font-semibold">&quot;{alertToDelete.name}&quot;</strong> (<span className="text-zinc-400">{alertToDelete.eventId}</span>)?
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                disabled={isDeletingAlert}
                onClick={() => setAlertToDelete(null)}
                className="text-xs font-mono text-zinc-400 hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isDeletingAlert}
                onClick={handleConfirmDeleteAlert}
                className="bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {isDeletingAlert && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isDeletingAlert ? "Deleting..." : "Delete Alert"}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: FILTERS & PRIVACY */}
      {activeTab === "filters" && (
        <div className="max-w-2xl space-y-6">
          {/* Exclude My Visits */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">Exclude My Own Visits</h2>
                <p className="text-xs text-zinc-400 mt-0.5">Sets a local exclusion cookie in this browser so your testing is never recorded.</p>
              </div>
              <Switch checked={ignoreMyVisits} onCheckedChange={handleToggleIgnoreVisits} />
            </div>
          </div>

          {/* Excluded Paths */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Excluded URL Paths</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Ignore internal routes or test pages (supports wildcards *).</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="/admin/* or /checkout/test"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPath()}
                className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
              />
              <Button onClick={handleAddPath} size="sm" className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Path
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {excludedPaths.map((p) => (
                <span key={p} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1F1F1F] border border-white/[0.08] text-xs font-mono text-zinc-300">
                  <span>{p}</span>
                  <button onClick={() => handleRemovePath(p)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Blocked IP Addresses */}
          <div className="rounded-2xl bg-[#262626] border border-white/[0.08] p-5 space-y-4">
            <div>
              <h2 className="text-base font-semibold text-white">Blocked IP Addresses & CIDR</h2>
              <p className="text-xs text-zinc-400 mt-0.5">Filter out internal office networks or bot IP addresses.</p>
            </div>

            <div className="flex items-center gap-2">
              <Input
                placeholder="192.168.1.1 or 10.0.0.0/24"
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddIp()}
                className="bg-[#1F1F1F] border-white/[0.08] text-white text-xs font-mono"
              />
              <Button onClick={handleAddIp} size="sm" className="bg-[#800E13] hover:bg-[#800E13]/90 text-white text-xs shrink-0">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add IP
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {blockedIps.map((ip) => (
                <span key={ip} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1F1F1F] border border-white/[0.08] text-xs font-mono text-zinc-300">
                  <span>{ip}</span>
                  <button onClick={() => handleRemoveIp(ip)} className="text-zinc-500 hover:text-white cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DANGER ZONE */}
      {activeTab === "danger" && (
        <div className="max-w-2xl space-y-6">
          {/* Reset Data */}
          <div className="rounded-2xl bg-[#262626] border border-rose-500/20 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Reset Analytics Data</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Wipes all collected pageviews, funnels, and events while keeping settings intact.</p>
              </div>

              <Button
                variant="outline"
                onClick={() => {
                  setResetConfirmInput("");
                  setResetSuccessMessage("");
                  setIsResetModalOpen(true);
                }}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 text-xs shrink-0 cursor-pointer"
              >
                Reset All Data
              </Button>
            </div>
          </div>

          {/* Delete Project */}
          <div className="rounded-2xl bg-[#262626] border border-rose-500/30 p-5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-rose-400 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Website</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">Permanently remove this project and all associated analytics.</p>
              </div>

              <Button
                onClick={() => {
                  setDeleteConfirmInput("");
                  setIsDeleteModalOpen(true);
                }}
                className="bg-rose-600 hover:bg-rose-700 text-white text-xs shrink-0 cursor-pointer"
              >
                Delete Website
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* RESET DATA CONFIRMATION MODAL */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent className="bg-[#1F1F1F] border-white/[0.08] text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Reset Analytics Data for {initialDomain}?</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-2 leading-relaxed">
              This will permanently wipe all collected pageviews, funnels, milestones, and visitor history for <strong className="text-white">&quot;{initialDomain}&quot;</strong>. Website settings and tracking script keys will remain active.
            </DialogDescription>
          </DialogHeader>

          {resetSuccessMessage ? (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2 font-medium my-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{resetSuccessMessage}</span>
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              <label className="text-xs text-zinc-300 block">
                Type <code className="text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono font-bold">{initialDomain}</code> to confirm:
              </label>
              <Input
                placeholder={`Type "${initialDomain}" to confirm`}
                value={resetConfirmInput}
                onChange={(e) => setResetConfirmInput(e.target.value)}
                className="bg-[#141414] border-white/[0.08] text-white text-xs font-mono"
                autoFocus
              />
            </div>
          )}

          <div className="flex justify-end gap-2.5 mt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isResettingData}
              onClick={() => setIsResetModalOpen(false)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                (resetConfirmInput.trim().toLowerCase() !== siteDomain.toLowerCase() &&
                  resetConfirmInput.trim().toLowerCase() !== siteName.toLowerCase() &&
                  resetConfirmInput.trim() !== "RESET") ||
                isResettingData ||
                Boolean(resetSuccessMessage)
              }
              onClick={handleResetAnalyticsData}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isResettingData && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isResettingData ? "Wiping Data..." : "Yes, Reset All Data"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* DELETE WEBSITE CONFIRMATION MODAL */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="bg-[#1F1F1F] border-white/[0.08] text-white max-w-md shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-rose-400 flex items-center gap-2 text-base font-semibold">
              <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
              <span>Permanently Delete {initialDomain}?</span>
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs mt-2 leading-relaxed">
              This will permanently remove <strong className="text-white">&quot;{initialDomain}&quot;</strong> along with all historical traffic, custom proxy domains, alerts, and payment attribution configurations. This action cannot be reversed.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-3">
            <label className="text-xs text-zinc-300 block">
              Type <code className="text-rose-300 bg-rose-500/10 px-1.5 py-0.5 rounded font-mono font-bold">{initialDomain}</code> to confirm:
            </label>
            <Input
              placeholder={`Type "${initialDomain}" to confirm`}
              value={deleteConfirmInput}
              onChange={(e) => setDeleteConfirmInput(e.target.value)}
              className="bg-[#141414] border-white/[0.08] text-white text-xs font-mono"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-2.5 mt-4">
            <Button
              type="button"
              variant="ghost"
              disabled={isDeletingWebsite}
              onClick={() => setIsDeleteModalOpen(false)}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={
                (deleteConfirmInput.trim().toLowerCase() !== siteDomain.toLowerCase() &&
                  deleteConfirmInput.trim().toLowerCase() !== siteName.toLowerCase()) ||
                isDeletingWebsite
              }
              onClick={handleDeleteWebsite}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
            >
              {isDeletingWebsite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isDeletingWebsite ? "Deleting Website..." : "I understand, delete this website"}</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
