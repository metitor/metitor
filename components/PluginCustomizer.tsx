"use client";

import { useState, useEffect } from "react";
import { Settings, Check, X, ChevronDown, ChevronUp, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

interface PluginInfo {
  id: string;
  name: string;
  description: string;
  slots: { name: string; description: string }[];
  installed: boolean;
  enabled: boolean;
}

interface PluginCustomizerProps {
  entityType: "company" | "investor";
  entityId: string;
  entityName: string;
}

export function PluginCustomizer({ entityType, entityId, entityName }: PluginCustomizerProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [plugins, setPlugins] = useState<PluginInfo[]>([]);
  const [entityConfig, setEntityConfig] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const storageKey = `entity-plugins:${entityType}:${entityId}`;

  // Fetch plugins and load entity config
  useEffect(() => {
    fetchPlugins();
    loadEntityConfig();
  }, [session?.user?.id]);

  const fetchPlugins = async () => {
    try {
      const response = await fetch("/api/plugins");
      const data = await response.json();
      
      // Filter to plugins for this entity type that are installed
      const relevantPlugins = (data.plugins || []).filter((p: any) => 
        p.installed && 
        p.enabled &&
        p.entityTypes.includes(entityType)
      );
      
      setPlugins(relevantPlugins);
    } catch (error) {
      console.error("Failed to fetch plugins:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadEntityConfig = () => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setEntityConfig(JSON.parse(saved));
      } catch {
        // If no config, all installed plugins are enabled by default
        setEntityConfig([]);
      }
    }
  };

  const saveEntityConfig = (newConfig: string[]) => {
    localStorage.setItem(storageKey, JSON.stringify(newConfig));
    setEntityConfig(newConfig);
    
    // Dispatch event to notify slots to update
    window.dispatchEvent(new CustomEvent("plugin-config-changed", {
      detail: { entityType, entityId, enabledPlugins: newConfig }
    }));
    
    // Force a page refresh to reload plugins
    window.location.reload();
  };

  const isPluginEnabledForEntity = (pluginId: string) => {
    // If no entity config saved, all installed plugins are enabled
    if (entityConfig.length === 0 && !localStorage.getItem(storageKey)) {
      return true;
    }
    return entityConfig.includes(pluginId);
  };

  const togglePlugin = (pluginId: string) => {
    let newConfig: string[];
    
    if (entityConfig.length === 0 && !localStorage.getItem(storageKey)) {
      // First time - start with all plugins enabled except this one
      newConfig = plugins.filter(p => p.id !== pluginId).map(p => p.id);
    } else if (entityConfig.includes(pluginId)) {
      // Remove from enabled
      newConfig = entityConfig.filter(id => id !== pluginId);
    } else {
      // Add to enabled
      newConfig = [...entityConfig, pluginId];
    }
    
    saveEntityConfig(newConfig);
  };

  const enableAll = () => {
    const allIds = plugins.map(p => p.id);
    saveEntityConfig(allIds);
  };

  const disableAll = () => {
    saveEntityConfig([]);
  };

  // Don't show if user not logged in or no plugins available
  if (!session?.user) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/login" className="flex items-center gap-2">
          <LogIn className="w-4 h-4" />
          <span className="hidden sm:inline">Sign in to customize</span>
        </Link>
      </Button>
    );
  }

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Loader2 className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  if (plugins.length === 0) {
    return null;
  }

  const enabledCount = plugins.filter(p => isPluginEnabledForEntity(p.id)).length;

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Settings className="w-4 h-4" />
        <span className="hidden sm:inline">Customize View</span>
        {enabledCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {enabledCount}
          </Badge>
        )}
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-80 z-50 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Customize {entityName}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Toggle visualizations for this {entityType}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Quick actions */}
            <div className="flex gap-2 pb-3 border-b">
              <Button
                variant="outline"
                size="sm"
                onClick={enableAll}
                className="text-xs"
              >
                Enable All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={disableAll}
                className="text-xs"
              >
                Disable All
              </Button>
            </div>

            {/* Plugin list */}
            {plugins.map((plugin) => {
              const isEnabled = isPluginEnabledForEntity(plugin.id);
              return (
                <div
                  key={plugin.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isEnabled
                      ? "bg-primary/5 border-primary/20 hover:bg-primary/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100 opacity-60"
                  }`}
                  onClick={() => togglePlugin(plugin.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <span className="font-medium text-sm">
                        {plugin.name}
                      </span>
                      <p className="text-xs text-muted-foreground mt-1">
                        {plugin.description}
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ml-2 ${
                        isEnabled
                          ? "bg-primary text-white"
                          : "bg-gray-200"
                      }`}
                    >
                      {isEnabled && <Check className="w-3 h-3" />}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {plugin.slots.map((slot) => (
                      <Badge
                        key={slot.name}
                        variant="outline"
                        className="text-xs py-0"
                      >
                        {slot.description}
                      </Badge>
                    ))}
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-muted-foreground text-center pt-2">
              Page will refresh to apply changes
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
