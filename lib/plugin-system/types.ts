import type { ComponentType } from "react";

/**
 * Plugin Manifest - describes a plugin's capabilities and metadata
 */
export interface PluginManifest {
  id: string;                    // Unique identifier (e.g., "company-metrics")
  name: string;                  // Display name
  description: string;           // What the plugin does
  version: string;               // Semantic version
  author?: string;               // Plugin author
  icon?: string;                 // Icon name from lucide-react
  
  // What entity types this plugin works with
  entityTypes: ("company" | "investor" | "global")[];
  
  // Slots this plugin provides components for
  slots: {
    name: string;                // Slot identifier (e.g., "CompanyProfile.Header")
    description: string;         // What this slot adds
  }[];
  
  // Optional: hooks this plugin listens to
  hooks?: string[];
  
  // Optional: routes this plugin adds
  routes?: {
    path: string;
    label: string;
  }[];
}

/**
 * Props passed to plugin slot components
 */
export interface SlotProps {
  data: any;                     // Entity data (company, investor, etc.)
  context?: Record<string, any>; // Additional context
  settings?: Record<string, any>; // User's plugin settings
}

/**
 * A plugin module - what plugins export
 */
export interface PluginModule {
  manifest: PluginManifest;
  
  // Components keyed by slot name
  components: Record<string, ComponentType<SlotProps>>;
  
  // Optional initialization
  initialize?: () => Promise<void>;
  
  // Optional cleanup
  cleanup?: () => Promise<void>;
}

/**
 * User's plugin installation record (stored in DB)
 */
export interface PluginInstallation {
  id: string;
  userId: string;
  pluginId: string;
  enabled: boolean;
  settings: Record<string, any>;
  installedAt: Date;
  updatedAt: Date;
}

/**
 * Plugin state for a specific entity
 */
export interface EntityPluginState {
  entityType: "company" | "investor";
  entityId: string;
  enabledPlugins: string[];      // Plugin IDs that are enabled for this entity
}
