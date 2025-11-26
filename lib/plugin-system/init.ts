import { registerAvailablePlugin } from "./store";
import { manifest as companyMetricsManifest } from "@/plugins/company-metrics";
import { manifest as investorInsightsManifest } from "@/plugins/investor-insights";

export function initializeAvailablePlugins() {
  console.log("Registering available plugins...");

  registerAvailablePlugin(companyMetricsManifest);
  registerAvailablePlugin(investorInsightsManifest);

  console.log("Plugin registration complete");
}

initializeAvailablePlugins();
