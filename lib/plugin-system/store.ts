import type { PluginManifest, PluginModule, SlotProps } from "./types";
import type { ComponentType } from "react";

const availablePlugins = new Map<string, PluginManifest>();
const loadedModules = new Map<string, PluginModule>();
const componentCache = new Map<string, Map<string, ComponentType<SlotProps>>>();

export function registerAvailablePlugin(manifest: PluginManifest): void {
  if (availablePlugins.has(manifest.id)) {
    console.warn(`Plugin "${manifest.id}" is already registered`);
    return;
  }
  availablePlugins.set(manifest.id, manifest);
  console.log(`Plugin "${manifest.name}" registered as available`);
}

export function getAvailablePlugins(): PluginManifest[] {
  return Array.from(availablePlugins.values());
}

export function getPluginManifest(pluginId: string): PluginManifest | undefined {
  return availablePlugins.get(pluginId);
}

export function getPluginsForEntityType(
  entityType: "company" | "investor" | "global"
): PluginManifest[] {
  return Array.from(availablePlugins.values()).filter((p) =>
    p.entityTypes.includes(entityType)
  );
}

export async function loadPluginModule(pluginId: string): Promise<PluginModule | null> {
  if (loadedModules.has(pluginId)) {
    return loadedModules.get(pluginId)!;
  }

  try {
    let module: PluginModule;
    
    switch (pluginId) {
      case "company-metrics":
        module = (await import("@/plugins/company-metrics")).default;
        break;
      case "investor-insights":
        module = (await import("@/plugins/investor-insights")).default;
        break;
      default:
        console.warn(`Unknown plugin: ${pluginId}`);
        return null;
    }

    if (module.initialize) {
      await module.initialize();
    }

    loadedModules.set(pluginId, module);

    const slotComponents = new Map<string, ComponentType<SlotProps>>();
    for (const [slotName, component] of Object.entries(module.components)) {
      slotComponents.set(slotName, component);
    }
    componentCache.set(pluginId, slotComponents);

    return module;
  } catch (error) {
    console.error(`Failed to load plugin "${pluginId}":`, error);
    return null;
  }
}

export function getPluginComponent(
  pluginId: string,
  slotName: string
): ComponentType<SlotProps> | null {
  const pluginComponents = componentCache.get(pluginId);
  if (!pluginComponents) return null;
  return pluginComponents.get(slotName) || null;
}

export function unloadPluginModule(pluginId: string): void {
  const module = loadedModules.get(pluginId);
  if (module?.cleanup) {
    module.cleanup();
  }
  loadedModules.delete(pluginId);
  componentCache.delete(pluginId);
}

export function isPluginLoaded(pluginId: string): boolean {
  return loadedModules.has(pluginId);
}
