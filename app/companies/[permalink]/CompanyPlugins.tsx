"use client";

import { DynamicSlot } from "@/components/DynamicSlot";
import { PluginCustomizer } from "@/components/PluginCustomizer";

interface CompanyPluginsProps {
  company: {
    id: number;
    name: string;
    permalink: string;
    [key: string]: any;
  };
}

export function CompanyPluginSelector({ company }: CompanyPluginsProps) {
  return (
    <PluginCustomizer
      entityType="company"
      entityId={company.permalink}
      entityName={company.name}
    />
  );
}

export function CompanyHeaderSlot({ company }: CompanyPluginsProps) {
  return (
    <DynamicSlot
      slotName="CompanyProfile.Header"
      data={company}
      entityType="company"
      entityId={company.permalink}
    />
  );
}

export function CompanyDetailsSlot({ company }: CompanyPluginsProps) {
  return (
    <DynamicSlot
      slotName="CompanyProfile.Details"
      data={company}
      entityType="company"
      entityId={company.permalink}
    />
  );
}
