"use client";

import { DynamicSlot } from "@/components/DynamicSlot";
import { PluginCustomizer } from "@/components/PluginCustomizer";

interface InvestorPluginsProps {
  investor: {
    id: number;
    name: string;
    permalink: string;
    [key: string]: any;
  };
}

export function InvestorPluginSelector({ investor }: InvestorPluginsProps) {
  return (
    <PluginCustomizer
      entityType="investor"
      entityId={investor.permalink}
      entityName={investor.name}
    />
  );
}

export function InvestorHeaderSlot({ investor }: InvestorPluginsProps) {
  return (
    <DynamicSlot
      slotName="InvestorProfile.Header"
      data={investor}
      entityType="investor"
      entityId={investor.permalink}
    />
  );
}

export function InvestorPortfolioSlot({ investor }: InvestorPluginsProps) {
  return (
    <DynamicSlot
      slotName="InvestorProfile.Portfolio"
      data={investor}
      entityType="investor"
      entityId={investor.permalink}
    />
  );
}
