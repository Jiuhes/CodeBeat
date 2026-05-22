import React, { useState, useEffect, useMemo } from "react";
import { Routes, Route, NavLink, useLocation, useNavigate, Navigate } from "react-router-dom";
import {
  Brain,
  RotateCcw,
  Search,
  ArrowLeftRight,
  Settings,
  Home as HomeIcon,
  Menu,
  X,
  Flame,
  LogOut,
  Code,
  Terminal,
  Cpu,
  Braces,
  Pencil,
} from "lucide-react";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";
import Spell from "./pages/Spell";
import Browse from "./pages/Browse";
import Compare from "./pages/Compare";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import Onboarding from "./pages/Onboarding";
import db from "./db";
import { Button } from "./components/ui/button";

const AVATAR_ICONS = {
  code: Code,
  terminal: Terminal,
  cpu: Cpu,
  braces: Braces,
  flame: Flame,
};

const SRS_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
  dueDate: new Date().toISOString(),
  lastReview: null,
  status: "new",
};

async function seedMissingCards(selectedLanguages = []) {
  let existing = await db.getAllCards();

  // Self-healing: delete corrupted cards containing SVG code
  const corrupted = existing.filter(
    (c) => (c.keyword && c.keyword.includes("<svg")) || (c.language && c.language.includes("<svg"))
  );
  if (corrupted.length > 0) {
    for (const c of corrupted) {
      await db.deleteCard(c.keyword, c.language);
    }
    existing = await db.getAllCards();
  }

  const allKeywords = await db.getSeedKeywords();
  // Only seed languages the user has selected
  const filtered = selectedLanguages.length > 0
    ? allKeywords.filter((k) => selectedLanguages.includes(k.language))
    : allKeywords;
  const existingKeys = new Set(existing.map((c) => c.keyword + "::" + c.language));
  const missing = filtered.filter((k) => !existingKeys.has(k.keyword + "::" + k.language));
  if (missing.length > 0) {
    const newCards = missing.map((k) => ({ ...k, ...SRS_DEFAULTS }));
    await db.putCards(newCards);
    existing = await db.getAllCards();
  }
  return existing;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-screen bg-background">
          <div className="text-center space-y-4 max-w-md px-4">
            <Flame className="h-12 w-12 text-rating-again mx-auto" />
            <h1 className="text-xl font-bold">出现了一些问题</h1>
            <p className="text-sm text-muted-foreground">
              {this.state.error?.message || "页面渲染出错"}
            </p>
            <button
              className="px-4 py-2 rounded-lg bg-brand hover:bg-brand/90 text-brand-foreground text-sm font-semibold cursor-pointer"
              onClick={() => window.location.reload()}
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const navItems = [
  { path: "/", label: "概览", icon: HomeIcon },
  { path: "/quiz", label: "练习", icon: Brain },
  { path: "/spell", label: "拼写", icon: Pencil },
  { path: "/browse", label: "词库", icon: Search },
  { path: "/compare", label: "对比", icon: ArrowLeftRight },
  { path: "/settings", label: "设置", icon: Settings },
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState({
    theme: "dark",
    dailyNewCards: 10,
    dailyReviewCards: 20,
    selectedLanguages: [],
  });
  const [cards, setCards] = useState([]);
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const applyTheme = (theme) => {
    if (theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      document.documentElement.className = prefersDark ? "dark" : "";
    } else if (theme === "light") {
      document.documentElement.className = "";
    } else if (theme === "dark") {
      document.documentElement.className = "dark";
    } else {
      // theme could be "dark-indigo" or "dark-moss"
      document.documentElement.className = `dark ${theme}`;
    }
  };

  useEffect(() => {
    if (settings.theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [settings.theme]);

  useEffect(() => {
    async function init() {
      const user = await db.getCurrentUser();
      if (!user) {
        setCurrentUser(null);
        setReady(true);
        return;
      }

      await db.initUserDB(user.id);
      setCurrentUser(user);

      const s = await db.getSettings();
      setSettings(s);
      applyTheme(s.theme);

      if (!s.selectedLanguages || s.selectedLanguages.length === 0) {
        setNeedsOnboarding(true);
        setReady(true);
        return;
      }

      const existing = await seedMissingCards(s.selectedLanguages);
      setCards(existing);
      setReady(true);
    }
    init();
  }, []);

  const handleAuthSuccess = async (user) => {
    setReady(false);
    setCurrentUser(user);

    await db.initUserDB(user.id);

    const s = await db.getSettings();
    setSettings(s);
    applyTheme(s.theme);

    if (!s.selectedLanguages || s.selectedLanguages.length === 0) {
      setNeedsOnboarding(true);
      setReady(true);
      return;
    }

    const existing = await seedMissingCards(s.selectedLanguages);
    setCards(existing);
    setReady(true);
  };

  const handleLogout = async () => {
    await db.logout();
    setCurrentUser(null);
    setCards([]);
    setNeedsOnboarding(false);
    applyTheme("dark");
    navigate("/");
  };

  const handleOnboardingComplete = async (langs) => {
    const newSettings = { ...settings, selectedLanguages: langs };
    setSettings(newSettings);
    await db.saveSettings(newSettings);
    setNeedsOnboarding(false);
    const existing = await seedMissingCards(langs);
    setCards(existing);
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    if (currentUser) refreshCards();
  }, [location]);

  const filteredCards = useMemo(() => {
    const langs = settings.selectedLanguages || []
    if (langs.length === 0) return cards
    return cards.filter(c => langs.includes(c.language))
  }, [cards, settings.selectedLanguages])

  const refreshCards = async () => {
    const c = await db.getAllCards();
    setCards(c);
  };

  const updateSettings = async (newSettings) => {
    const oldLangs = settings.selectedLanguages || []
    const newLangs = newSettings.selectedLanguages || []
    setSettings(newSettings);
    applyTheme(newSettings.theme);
    await db.saveSettings(newSettings);
    // Re-seed if languages changed
    if (JSON.stringify(oldLangs.sort()) !== JSON.stringify(newLangs.sort())) {
      const existing = await seedMissingCards(newLangs)
      setCards(existing)
    }
  };

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center animate-in">
          <div className="relative inline-flex">
            <Flame className="h-12 w-12 text-brand animate-pulse" />
            <div className="absolute inset-0 h-12 w-12 bg-brand/20 blur-xl animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm mt-4 font-medium">
            CodeBeat 加载中...
          </p>
        </div>
      </div>
    );
  }

  if (currentUser && needsOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-background text-foreground bg-cyber-grid flex flex-col justify-between">
        <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
          <div className="max-w-5xl mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <div 
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => navigate("/")}
              >
                <div className="relative">
                  <Flame className="h-5 w-5 text-brand" />
                  <div className="absolute inset-0 h-5 w-5 bg-brand/30 blur-md" />
                </div>
                <span className="font-bold text-base tracking-tight">
                  CodeBeat
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  className="text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 px-4 py-2 rounded-xl cursor-pointer"
                  onClick={() => navigate("/auth")}
                >
                  登录 / 注册
                </Button>
              </div>
            </div>
          </div>
        </nav>
        <main className="max-w-5xl mx-auto px-4 py-6 flex-grow w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/auth" element={<Auth onAuthSuccess={handleAuthSuccess} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-border/50 py-6 text-center">
          <p className="text-xs text-muted-foreground/60">
            CodeBeat — 编程关键词记忆节拍
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center h-14">
            {/* Logo */}
            <div 
              className="flex items-center gap-2.5 mr-8 cursor-pointer"
              onClick={() => navigate("/")}
            >
              <div className="relative">
                <Flame className="h-5 w-5 text-brand" />
                <div className="absolute inset-0 h-5 w-5 bg-brand/30 blur-md" />
              </div>
              <span className="font-bold text-base tracking-tight">
                CodeBeat
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`
                  }
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </NavLink>
              ))}
            </div>

            {/* Desktop User Info */}
            <div className="hidden md:flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 backdrop-blur-sm shadow-sm">
                {(() => {
                  const AvatarIcon = AVATAR_ICONS[currentUser.avatar] || Code;
                  return <AvatarIcon className="h-3.5 w-3.5 text-brand" />;
                })()}
                <span className="text-xs font-bold tracking-tight text-foreground">{currentUser.username}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-rating-again transition-colors cursor-pointer"
                onClick={handleLogout}
                title="退出登录"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden ml-auto h-8 w-8"
              aria-label={mobileMenuOpen ? "关闭菜单" : "打开菜单"}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-xl animate-in">
            <div className="px-4 py-2 space-y-0.5">
              {navItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === "/"}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}

              {/* Mobile User Info */}
              <div className="mt-4 pt-4 border-t border-border/50 px-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {(() => {
                    const AvatarIcon = AVATAR_ICONS[currentUser.avatar] || Code;
                    return <AvatarIcon className="h-4.5 w-4.5 text-brand" />;
                  })()}
                  <span className="text-sm font-semibold text-foreground">{currentUser.username}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-rating-again hover:bg-zinc-100 dark:hover:bg-zinc-900 px-3 py-1.5 rounded-lg cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-3.5 w-3.5" />
                  退出登录
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        <ErrorBoundary>
          <Routes>
            <Route
              path="/"
              element={<Dashboard cards={filteredCards} settings={settings} />}
            />
            <Route
              path="/quiz"
              element={<Quiz cards={filteredCards} settings={settings} />}
            />
            <Route
              path="/spell"
              element={<Spell cards={filteredCards} settings={settings} />}
            />
            <Route
              path="/browse"
              element={
                <Browse cards={filteredCards} settings={settings} onCardUpdate={refreshCards} />
              }
            />
            <Route
              path="/compare"
              element={<Compare cards={filteredCards} settings={settings} />}
            />
            <Route
              path="/settings"
              element={
                <SettingsPage settings={settings} onUpdate={updateSettings} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6 text-center">
        <p className="text-xs text-muted-foreground/60">
          CodeBeat — 编程关键词记忆节拍
        </p>
      </footer>
    </div>
  );
}
