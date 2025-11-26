"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Puzzle, 
  Check, 
  Plus,
  Minus,
  ExternalLink, 
  TrendingUp, 
  PieChart, 
  Clock, 
  BarChart3, 
  Power, 
  Settings, 
  Sparkles, 
  Eye,
  Info,
  Loader2,
  LogIn,
  Building2,
  Users
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSession } from "@/lib/auth-client";

// Icon mapping for plugins
const iconMap: Record<string, React.ReactNode> = {
  "BarChart3": <BarChart3 className="w-5 h-5" />,
  "PieChart": <PieChart className="w-5 h-5" />,
  "TrendingUp": <TrendingUp className="w-5 h-5" />,
  "Clock": <Clock className="w-5 h-5" />,
  "Puzzle": <Puzzle className="w-5 h-5" />,
};

// Entity type icons
const entityTypeIcons: Record<string, React.ReactNode> = {
  "company": <Building2 className="w-3 h-3" />,
  "investor": <Users className="w-3 h-3" />,
  "global": <Sparkles className="w-3 h-3" />,
};

interface PluginData {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  icon?: string;
  entityTypes: string[];
  slots: { name: string; description: string }[];
  installed: boolean;
  enabled: boolean;
}

export default function PluginsPage() {
  const { data: session, isPending: sessionLoading } = useSession();
  const [plugins, setPlugins] = useState<PluginData[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlugins();
  }, [session]);

  const fetchPlugins = async () => {
    try {
      const response = await fetch("/api/plugins");
      const data = await response.json();
      setPlugins(data.plugins || []);
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const installPlugin = async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      const response = await fetch("/api/plugins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pluginId }),
      });
      
      if (response.ok) {
        await fetchPlugins();
      }
    } catch (error) {
      console.error("Failed to install plugin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const uninstallPlugin = async (pluginId: string) => {
    setActionLoading(pluginId);
    try {
      const response = await fetch(`/api/plugins?pluginId=${pluginId}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        await fetchPlugins();
      }
    } catch (error) {
      console.error("Failed to uninstall plugin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const togglePlugin = async (pluginId: string, currentEnabled: boolean) => {
    setActionLoading(pluginId);
    try {
      const response = await fetch("/api/plugins", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pluginId, enabled: !currentEnabled }),
      });
      
      if (response.ok) {
        await fetchPlugins();
      }
    } catch (error) {
      console.error("Failed to toggle plugin:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const installedPlugins = plugins.filter(p => p.installed);
  const availablePlugins = plugins.filter(p => !p.installed);

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Puzzle className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Plugins</h1>
              <p className="text-muted-foreground">
                Extend your experience with customizable visualizations
              </p>
            </div>
          </div>

          {/* Auth Notice */}
          {!session?.user && (
            <Card className="bg-amber-50 border-amber-200">
              <CardContent className="py-4">
                <div className="flex items-center gap-3">
                  <LogIn className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">Sign in to install plugins</p>
                    <p className="text-sm text-amber-700">
                      Your plugin preferences will be saved to your account
                    </p>
                  </div>
                  <Button asChild variant="outline" className="border-amber-300">
                    <Link href="/login">Sign In</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-primary">{plugins.length}</div>
              <div className="text-sm text-muted-foreground">Available Plugins</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-green-600">{installedPlugins.length}</div>
              <div className="text-sm text-muted-foreground">Installed</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <div className="text-2xl font-bold text-blue-600">
                {installedPlugins.filter(p => p.enabled).length}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="installed" className="space-y-6">
          <TabsList>
            <TabsTrigger value="installed" className="gap-2">
              <Check className="w-4 h-4" />
              Installed ({installedPlugins.length})
            </TabsTrigger>
            <TabsTrigger value="available" className="gap-2">
              <Puzzle className="w-4 h-4" />
              Available ({availablePlugins.length})
            </TabsTrigger>
            <TabsTrigger value="how-it-works" className="gap-2">
              <Info className="w-4 h-4" />
              How It Works
            </TabsTrigger>
          </TabsList>

          {/* Installed Plugins */}
          <TabsContent value="installed">
            {installedPlugins.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="py-12 text-center">
                  <Puzzle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No plugins installed</h3>
                  <p className="text-muted-foreground mb-4">
                    Install plugins to enhance your viewing experience
                  </p>
                  <Button variant="outline" onClick={() => {
                    const tab = document.querySelector('[data-value="available"]') as HTMLButtonElement;
                    tab?.click();
                  }}>
                    Browse Available Plugins
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {installedPlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isLoading={actionLoading === plugin.id}
                    onToggle={() => togglePlugin(plugin.id, plugin.enabled)}
                    onUninstall={() => uninstallPlugin(plugin.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Available Plugins */}
          <TabsContent value="available">
            {availablePlugins.length === 0 ? (
              <Card className="bg-muted/50">
                <CardContent className="py-12 text-center">
                  <Check className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <h3 className="text-lg font-medium mb-2">All plugins installed!</h3>
                  <p className="text-muted-foreground">
                    You have installed all available plugins
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {availablePlugins.map((plugin) => (
                  <PluginCard
                    key={plugin.id}
                    plugin={plugin}
                    isLoading={actionLoading === plugin.id}
                    onInstall={() => installPlugin(plugin.id)}
                    isAuthenticated={!!session?.user}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* How It Works */}
          <TabsContent value="how-it-works">
            <Card>
              <CardHeader>
                <CardTitle>How Plugins Work</CardTitle>
                <CardDescription>
                  Plugins extend the platform with additional visualizations and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">1</span>
                    </div>
                    <h3 className="font-medium">Install</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse available plugins and click "Install" to add them to your account
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">2</span>
                    </div>
                    <h3 className="font-medium">Enable/Disable</h3>
                    <p className="text-sm text-muted-foreground">
                      Toggle plugins on or off to control what visualizations you see
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">3</span>
                    </div>
                    <h3 className="font-medium">Customize</h3>
                    <p className="text-sm text-muted-foreground">
                      Use "Customize View" on company/investor pages for per-entity control
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t">
                  <h4 className="font-medium mb-3">Plugin Types</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Building2 className="w-3 h-3" />
                      Company Plugins
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />
                      Investor Plugins
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Global Plugins
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Plugin Card Component
function PluginCard({ 
  plugin, 
  isLoading,
  onInstall,
  onUninstall,
  onToggle,
  isAuthenticated = true
}: { 
  plugin: PluginData;
  isLoading: boolean;
  onInstall?: () => void;
  onUninstall?: () => void;
  onToggle?: () => void;
  isAuthenticated?: boolean;
}) {
  const isInstalled = plugin.installed;
  
  return (
    <Card className={`transition-all ${isInstalled && plugin.enabled ? "border-green-200 bg-green-50/30" : ""}`}>
      <CardContent className="py-6">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={`p-3 rounded-xl ${isInstalled && plugin.enabled ? "bg-green-100" : "bg-muted"}`}>
            {iconMap[plugin.icon || "Puzzle"] || <Puzzle className="w-5 h-5" />}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold">{plugin.name}</h3>
              <Badge variant="outline" className="text-xs">v{plugin.version}</Badge>
              {isInstalled && (
                <Badge variant={plugin.enabled ? "default" : "secondary"} className="text-xs">
                  {plugin.enabled ? "Active" : "Disabled"}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">{plugin.description}</p>
            
            {/* Entity Types */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs text-muted-foreground">Works with:</span>
              {plugin.entityTypes.map((type) => (
                <Badge key={type} variant="outline" className="text-xs gap-1">
                  {entityTypeIcons[type]}
                  {type}
                </Badge>
              ))}
            </div>

            {/* Slots */}
            <div className="flex flex-wrap gap-1">
              {plugin.slots.map((slot) => (
                <Badge key={slot.name} variant="secondary" className="text-xs">
                  {slot.description}
                </Badge>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {isInstalled ? (
              <>
                <Button
                  variant={plugin.enabled ? "outline" : "default"}
                  size="sm"
                  onClick={onToggle}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : plugin.enabled ? (
                    <>
                      <Power className="w-4 h-4 mr-1" />
                      Disable
                    </>
                  ) : (
                    <>
                      <Power className="w-4 h-4 mr-1" />
                      Enable
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onUninstall}
                  disabled={isLoading}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                onClick={onInstall}
                disabled={isLoading || !isAuthenticated}
                size="sm"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1" />
                ) : (
                  <Plus className="w-4 h-4 mr-1" />
                )}
                Install
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
