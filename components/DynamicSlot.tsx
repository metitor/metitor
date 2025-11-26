"use client";

import { useState, useEffect, ComponentType, Suspense, Component, ReactNode } from "react";
import { useSession } from "@/lib/auth-client";
import type { SlotProps } from "@/lib/plugin-system/types";

// Plugin component cache (client-side)
const componentCache = new Map<string, Map<string, ComponentType<SlotProps>>>();

// Load a plugin module dynamically
async function loadPluginComponent(
  pluginId: string, 
  slotName: string
): Promise<ComponentType<SlotProps> | null> {
  // Check cache
  const cached = componentCache.get(pluginId)?.get(slotName);
  if (cached) return cached;

  try {
    let module: any;
    
    // Dynamic imports for each plugin
    switch (pluginId) {
      case "company-metrics":
        module = await import("@/plugins/company-metrics");
        break;
      case "investor-insights":
        module = await import("@/plugins/investor-insights");
        break;
      default:
        console.warn(`Unknown plugin: ${pluginId}`);
        return null;
    }

    const pluginModule = module.default;
    const component = pluginModule.components[slotName];
    
    if (component) {
      // Cache it
      if (!componentCache.has(pluginId)) {
        componentCache.set(pluginId, new Map());
      }
      componentCache.get(pluginId)!.set(slotName, component);
    }

    return component || null;
  } catch (error) {
    console.error(`Failed to load plugin ${pluginId}:`, error);
    return null;
  }
}

interface DynamicSlotProps {
  slotName: string;
  data: any;
  context?: Record<string, any>;
  entityType?: "company" | "investor";
  entityId?: string;
  fallback?: React.ReactNode;
}

export function DynamicSlot({ 
  slotName, 
  data, 
  context = {},
  entityType,
  entityId,
  fallback 
}: DynamicSlotProps) {
  const { data: session } = useSession();
  const [components, setComponents] = useState<ComponentType<SlotProps>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSlotComponents();
  }, [slotName, session?.user?.id, entityType, entityId]);

  const loadSlotComponents = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch user's installed plugins
      const response = await fetch("/api/plugins");
      const { plugins } = await response.json();

      // Filter to enabled plugins that provide this slot
      const enabledPlugins = plugins.filter((p: any) => 
        p.installed && 
        p.enabled && 
        p.slots.some((s: any) => s.name === slotName)
      );

      // Check entity-specific config if provided
      let activePluginIds = enabledPlugins.map((p: any) => p.id);
      
      if (entityType && entityId && session?.user?.id) {
        // Check localStorage for entity-specific overrides
        const storageKey = `entity-plugins:${entityType}:${entityId}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const entityConfig = JSON.parse(saved);
            // Filter to only plugins enabled for this entity
            activePluginIds = activePluginIds.filter((id: string) => 
              entityConfig.includes(id)
            );
          } catch {
            // Use default if parse fails
          }
        }
      }

      // Load components for each enabled plugin
      const loadedComponents: ComponentType<SlotProps>[] = [];
      
      for (const pluginId of activePluginIds) {
        const component = await loadPluginComponent(pluginId, slotName);
        if (component) {
          loadedComponents.push(component);
        }
      }

      setComponents(loadedComponents);
    } catch (err) {
      console.error("Failed to load slot components:", err);
      setError("Failed to load plugins");
    } finally {
      setLoading(false);
    }
  };

  // Don't render anything while loading (prevents flash)
  if (loading) {
    return null;
  }

  // Show error if any
  if (error) {
    return fallback ? <>{fallback}</> : null;
  }

  // No components for this slot
  if (components.length === 0) {
    return fallback ? <>{fallback}</> : null;
  }

  // Render all components
  return (
    <>
      {components.map((Component, index) => (
        <Suspense key={`${slotName}-${index}`} fallback={null}>
          <PluginErrorBoundary>
            <Component data={data} context={context} />
          </PluginErrorBoundary>
        </Suspense>
      ))}
    </>
  );
}

// Error boundary for plugin components
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class PluginErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Plugin component error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-red-700 text-sm">
          Plugin failed to render
        </div>
      );
    }

    return this.props.children;
  }
}
