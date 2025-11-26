import type { PluginModule, PluginManifest, SlotProps } from "@/lib/plugin-system/types";
import type { ReactNode } from "react";
import { 
  Clock,
  Milestone,
  Calendar,
  Flag,
  Star,
  Zap,
  Award,
  TrendingUp,
  Building2,
  Globe,
  Rocket
} from "lucide-react";

// Helper to format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 1) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

// Icon mapping for milestone types
function getMilestoneIcon(code: string | null) {
  const lowerCode = (code || '').toLowerCase();
  if (lowerCode.includes('launch') || lowerCode.includes('release')) {
    return <Rocket className="w-4 h-4" />;
  }
  if (lowerCode.includes('ipo') || lowerCode.includes('public')) {
    return <TrendingUp className="w-4 h-4" />;
  }
  if (lowerCode.includes('acquisition') || lowerCode.includes('acquired')) {
    return <Building2 className="w-4 h-4" />;
  }
  if (lowerCode.includes('users') || lowerCode.includes('million')) {
    return <Star className="w-4 h-4" />;
  }
  if (lowerCode.includes('award') || lowerCode.includes('recognition')) {
    return <Award className="w-4 h-4" />;
  }
  return <Flag className="w-4 h-4" />;
}

// Color mapping for milestone types  
function getMilestoneStyle(code: string | null) {
  const lowerCode = (code || '').toLowerCase();
  if (lowerCode.includes('launch') || lowerCode.includes('release')) {
    return { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-700', dot: 'bg-purple-500' };
  }
  if (lowerCode.includes('ipo') || lowerCode.includes('public')) {
    return { bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700', dot: 'bg-green-500' };
  }
  if (lowerCode.includes('acquisition') || lowerCode.includes('acquired')) {
    return { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-700', dot: 'bg-blue-500' };
  }
  if (lowerCode.includes('users') || lowerCode.includes('million')) {
    return { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700', dot: 'bg-orange-500' };
  }
  return { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-700', dot: 'bg-gray-500' };
}

// Milestones Timeline Component
function MilestonesTimeline({ data }: SlotProps) {
  const company = data;
  const milestones = company?.milestones || [];

  if (milestones.length === 0) {
    return null;
  }

  // Sort milestones by date (most recent first)
  const sortedMilestones = [...milestones].sort((a: any, b: any) => {
    const dateA = a.milestoneAt ? new Date(a.milestoneAt).getTime() : 0;
    const dateB = b.milestoneAt ? new Date(b.milestoneAt).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Milestone className="w-5 h-5 text-primary" />
              Company Timeline
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Key milestones and achievements
            </p>
          </div>
          <span className="text-sm text-muted-foreground">
            {milestones.length} milestone{milestones.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-primary/50 to-transparent" />

          <div className="space-y-6">
            {sortedMilestones.map((milestone: any, index: number) => {
              const style = getMilestoneStyle(milestone.milestoneCode);
              const isFirst = index === 0;
              
              return (
                <div key={milestone.id} className="relative pl-10">
                  {/* Timeline dot */}
                  <div className={`absolute left-2 w-5 h-5 rounded-full ${style.dot} ring-4 ring-background flex items-center justify-center ${
                    isFirst ? 'animate-pulse' : ''
                  }`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>

                  {/* Content */}
                  <div className={`p-4 rounded-xl ${style.bg} border ${style.border}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={style.text}>
                            {getMilestoneIcon(milestone.milestoneCode)}
                          </span>
                          <h3 className={`font-semibold ${style.text}`}>
                            {milestone.milestoneCode || 'Milestone'}
                          </h3>
                          {isFirst && (
                            <span className="px-2 py-0.5 bg-primary text-primary-foreground text-xs rounded-full font-medium">
                              Latest
                            </span>
                          )}
                        </div>
                        {milestone.description && (
                          <p className="text-sm text-foreground/80">
                            {milestone.description}
                          </p>
                        )}
                      </div>
                      {milestone.milestoneAt && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-foreground">
                            {formatDate(new Date(milestone.milestoneAt))}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(new Date(milestone.milestoneAt))}
                          </p>
                        </div>
                      )}
                    </div>
                    {milestone.sourceUrl && (
                      <a 
                        href={milestone.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2"
                      >
                        <Globe className="w-3 h-3" />
                        View Source
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Powered by Timeline Plugin
          </p>
        </div>
      </div>
    </section>
  );
}

// Company Journey Summary Component
function CompanyJourneySummary({ data }: SlotProps) {
  const company = data;
  const milestones = company?.milestones || [];
  const fundingRounds = company?.fundingRounds || [];

  // Build a complete timeline with milestones and funding rounds
  const timelineEvents: Array<{
    type: 'milestone' | 'funding' | 'founded';
    date: Date;
    title: string;
    subtitle?: string;
  }> = [];

  // Add founding date
  if (company.foundedAt) {
    timelineEvents.push({
      type: 'founded',
      date: new Date(company.foundedAt),
      title: 'Company Founded',
      subtitle: `${company.name} was established`,
    });
  }

  // Add funding rounds
  fundingRounds.forEach((round: any) => {
    if (round.fundedAt) {
      timelineEvents.push({
        type: 'funding',
        date: new Date(round.fundedAt),
        title: round.roundCode?.toUpperCase() || 'Funding Round',
        subtitle: round.raisedAmount ? `Raised $${Number(round.raisedAmount).toLocaleString()}` : undefined,
      });
    }
  });

  // Add milestones
  milestones.forEach((milestone: any) => {
    if (milestone.milestoneAt) {
      timelineEvents.push({
        type: 'milestone',
        date: new Date(milestone.milestoneAt),
        title: milestone.milestoneCode || 'Milestone',
        subtitle: milestone.description,
      });
    }
  });

  if (timelineEvents.length < 3) {
    return null;
  }

  // Sort by date
  timelineEvents.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Group by year
  const yearGroups = new Map<number, typeof timelineEvents>();
  timelineEvents.forEach((event) => {
    const year = event.date.getFullYear();
    if (!yearGroups.has(year)) {
      yearGroups.set(year, []);
    }
    yearGroups.get(year)!.push(event);
  });

  const years = Array.from(yearGroups.keys()).sort((a, b) => b - a).slice(0, 6);

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Company Journey
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Key events by year
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {years.map((year) => {
            const events = yearGroups.get(year) || [];
            const fundingEvents = events.filter(e => e.type === 'funding').length;
            const milestoneEvents = events.filter(e => e.type === 'milestone').length;
            const foundingEvent = events.find(e => e.type === 'founded');
            
            return (
              <div 
                key={year}
                className="p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
              >
                <div className="text-2xl font-bold text-foreground mb-2">{year}</div>
                <div className="space-y-1 text-xs">
                  {foundingEvent && (
                    <div className="flex items-center gap-1 text-blue-600">
                      <Zap className="w-3 h-3" />
                      Founded
                    </div>
                  )}
                  {fundingEvents > 0 && (
                    <div className="flex items-center gap-1 text-green-600">
                      <TrendingUp className="w-3 h-3" />
                      {fundingEvents} funding round{fundingEvents !== 1 ? 's' : ''}
                    </div>
                  )}
                  {milestoneEvents > 0 && (
                    <div className="flex items-center gap-1 text-purple-600">
                      <Star className="w-3 h-3" />
                      {milestoneEvents} milestone{milestoneEvents !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Recent Activity Component (for quick glance)
function RecentActivity({ data }: SlotProps) {
  const company = data;
  const milestones = company?.milestones || [];
  const fundingRounds = company?.fundingRounds || [];

  // Combine and sort recent activities
  const activities: Array<{
    type: 'milestone' | 'funding';
    date: Date;
    title: string;
    icon: ReactNode;
    color: string;
  }> = [];

  // Add recent funding rounds
  fundingRounds.slice(0, 2).forEach((round: any) => {
    if (round.fundedAt) {
      activities.push({
        type: 'funding',
        date: new Date(round.fundedAt),
        title: `${round.roundCode?.toUpperCase() || 'Funding'} - $${Number(round.raisedAmount).toLocaleString()}`,
        icon: <TrendingUp className="w-3.5 h-3.5" />,
        color: 'text-green-600 bg-green-50',
      });
    }
  });

  // Add recent milestones
  milestones.slice(0, 2).forEach((milestone: any) => {
    if (milestone.milestoneAt) {
      activities.push({
        type: 'milestone',
        date: new Date(milestone.milestoneAt),
        title: milestone.milestoneCode || 'Milestone',
        icon: <Star className="w-3.5 h-3.5" />,
        color: 'text-purple-600 bg-purple-50',
      });
    }
  });

  if (activities.length === 0) {
    return null;
  }

  // Sort by date (most recent first)
  activities.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Clock className="w-4 h-4" />
          Recent:
        </span>
        {activities.slice(0, 3).map((activity, index) => (
          <span 
            key={index}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${activity.color}`}
          >
            {activity.icon}
            {activity.title}
            <span className="text-muted-foreground font-normal">
              ({formatRelativeTime(activity.date)})
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

// Plugin manifest
export const manifest: PluginManifest = {
  id: "timeline",
  name: "Timeline",
  description: "Displays milestones, key events, and company history in a beautiful timeline",
  version: "1.0.0",
  author: "Metior Team",
  icon: "Calendar",
  entityTypes: ["company"],
  slots: [
    {
      name: "CompanyProfile.Header",
      description: "Recent activity summary in company header",
    },
    {
      name: "CompanyProfile.Details",
      description: "Detailed timeline and journey summary",
    },
  ],
};

// Plugin module
const plugin: PluginModule = {
  manifest,
  components: {
    "CompanyProfile.Header": RecentActivity,
    "CompanyProfile.Details": MilestonesTimeline,
    "CompanyProfile.Summary": CompanyJourneySummary,
  },
};

export default plugin;
