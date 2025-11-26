import { registerAvailablePlugin } from "./store";
import companyMetricsPlugin from "@/plugins/company-metrics/index";
import investorInsightsPlugin from "@/plugins/investor-insights/index";
import timelinePlugin from "@/plugins/timeline/index";

const plugins = [
  companyMetricsPlugin,
  investorInsightsPlugin,
  timelinePlugin,
];

let initialized = false;

export async function loadPlugins() {
  if (!initialized) {
    for (const plugin of plugins) {
      registerAvailablePlugin(plugin.manifest);
    }
    initialized = true;
  }
}

loadPlugins().catch((error) => {
  console.error("Failed to load plugins:", error);
});
