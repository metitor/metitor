import type { PluginModule, PluginManifest, SlotProps } from "@/lib/plugin-system/types";
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  MapPin,
  Target,
  Sparkles,
  Banknote,
  ArrowUp,
  ArrowDown
} from "lucide-react";

export const manifest: PluginManifest = {
  id: "company-metrics",
  name: "Company Metrics",
  description: "Displays funding stats, health score, and growth charts for companies",
  version: "1.0.0",
  author: "Metior Team",
  icon: "BarChart3",
  entityTypes: ["company"],
  slots: [
    { name: "CompanyProfile.Header", description: "Quick stats cards showing funding totals" },
    { name: "CompanyProfile.Details", description: "Funding journey chart and health score" },
  ],
};

// Helper to format currency
function formatCurrency(amount: number, compact = false): string {
  if (compact) {
    if (amount >= 1_000_000_000) {
      return `$${(amount / 1_000_000_000).toFixed(1)}B`;
    }
    if (amount >= 1_000_000) {
      return `$${(amount / 1_000_000).toFixed(1)}M`;
    }
    if (amount >= 1_000) {
      return `$${(amount / 1_000).toFixed(0)}K`;
    }
  }
  return `$${amount.toLocaleString()}`;
}

// Helper to calculate days since date
function daysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to format relative time
function formatRelativeTime(date: Date): string {
  const days = daysSince(date);
  if (days < 30) return `${days} days ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

// Quick Stats Card Component
function QuickStatsCard({ data }: SlotProps) {
  const company = data;
  const fundingRounds = company?.fundingRounds || [];

  // Calculate metrics
  const totalFunding = fundingRounds.reduce((sum: number, round: any) => {
    return sum + (Number(round.raisedAmount) || 0);
  }, 0);

  const latestRound = fundingRounds[0];
  const firstRound = fundingRounds[fundingRounds.length - 1];

  const companyAge = company.foundedAt 
    ? Math.floor(daysSince(new Date(company.foundedAt)) / 365)
    : null;

  const avgRoundSize = fundingRounds.length > 0 
    ? totalFunding / fundingRounds.length 
    : 0;

  // Calculate funding velocity (funding per year)
  let fundingVelocity = 0;
  if (firstRound?.fundedAt && latestRound?.fundedAt) {
    const yearsBetween = daysSince(new Date(firstRound.fundedAt)) / 365;
    fundingVelocity = yearsBetween > 0 ? totalFunding / yearsBetween : totalFunding;
  }

  // Status badge color
  const statusColors: Record<string, { bg: string; text: string }> = {
    operating: { bg: 'bg-green-100', text: 'text-green-700' },
    acquired: { bg: 'bg-blue-100', text: 'text-blue-700' },
    ipo: { bg: 'bg-purple-100', text: 'text-purple-700' },
    closed: { bg: 'bg-red-100', text: 'text-red-700' },
  };
  const statusStyle = statusColors[company.status || 'operating'] || statusColors.operating;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Funding */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-green-700 font-medium">Total Raised</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {totalFunding > 0 ? formatCurrency(totalFunding, true) : '—'}
          </p>
          {fundingRounds.length > 0 && (
            <p className="text-xs text-green-600 mt-1">
              {fundingRounds.length} round{fundingRounds.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Latest Round */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Banknote className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-blue-700 font-medium">Latest Round</span>
          </div>
          {latestRound ? (
            <>
              <p className="text-2xl font-bold text-blue-900">
                {formatCurrency(Number(latestRound.raisedAmount), true)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {latestRound.roundCode?.toUpperCase()} • {latestRound.fundedAt && formatRelativeTime(new Date(latestRound.fundedAt))}
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-blue-900">—</p>
          )}
        </div>

        {/* Company Age */}
        <div className="p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-100 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-sm text-purple-700 font-medium">Company Age</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">
            {companyAge !== null ? `${companyAge} years` : '—'}
          </p>
          {company.foundedAt && (
            <p className="text-xs text-purple-600 mt-1">
              Founded {new Date(company.foundedAt).getFullYear()}
            </p>
          )}
        </div>

        {/* Status */}
        <div className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-gray-100 rounded-lg">
              <Target className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700 font-medium">Status</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-sm font-semibold capitalize ${statusStyle.bg} ${statusStyle.text}`}>
              {company.status || 'Unknown'}
            </span>
          </div>
          {company.categoryCode && (
            <p className="text-xs text-gray-500 mt-2">
              {company.categoryCode.replace(/-/g, ' ')}
            </p>
          )}
        </div>
      </div>

      {/* Additional Insights Row */}
      {(avgRoundSize > 0 || fundingVelocity > 0 || company.offices?.length > 0) && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          {avgRoundSize > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Avg Round Size</span>
                <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatCurrency(avgRoundSize, true)}
              </p>
            </div>
          )}
          
          {fundingVelocity > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Funding/Year</span>
                <Sparkles className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {formatCurrency(fundingVelocity, true)}
              </p>
            </div>
          )}

          {company.offices?.length > 0 && (
            <div className="p-3 bg-white rounded-lg border border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Office Locations</span>
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
              </div>
              <p className="text-lg font-semibold text-gray-900 mt-1">
                {company.offices.length} {company.offices.length === 1 ? 'location' : 'locations'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Funding Growth Chart Component
function FundingGrowthChart({ data }: SlotProps) {
  const company = data;
  const fundingRounds = company?.fundingRounds || [];

  if (fundingRounds.length < 2) {
    return null;
  }

  // Sort by date ascending
  const sortedRounds = [...fundingRounds].sort((a: any, b: any) => {
    return new Date(a.fundedAt).getTime() - new Date(b.fundedAt).getTime();
  });

  // Calculate cumulative funding
  let cumulative = 0;
  const chartData = sortedRounds.map((round: any) => {
    cumulative += Number(round.raisedAmount) || 0;
    return {
      round: round.roundCode?.toUpperCase() || 'Round',
      date: round.fundedAt ? new Date(round.fundedAt).getFullYear() : '—',
      amount: Number(round.raisedAmount) || 0,
      cumulative,
    };
  });

  const maxCumulative = Math.max(...chartData.map(d => d.cumulative));

  // Calculate growth rate between last two rounds
  let growthRate = 0;
  if (sortedRounds.length >= 2) {
    const lastAmount = Number(sortedRounds[sortedRounds.length - 1].raisedAmount) || 0;
    const prevAmount = Number(sortedRounds[sortedRounds.length - 2].raisedAmount) || 1;
    growthRate = ((lastAmount - prevAmount) / prevAmount) * 100;
  }

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Funding Journey
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Cumulative funding over time
            </p>
          </div>
          {growthRate !== 0 && (
            <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium ${
              growthRate > 0 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {growthRate > 0 ? (
                <ArrowUp className="w-4 h-4" />
              ) : (
                <ArrowDown className="w-4 h-4" />
              )}
              {Math.abs(growthRate).toFixed(0)}% last round
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="space-y-3">
          {chartData.map((item, index) => {
            const percentage = (item.cumulative / maxCumulative) * 100;
            const isLatest = index === chartData.length - 1;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center gap-4 mb-1">
                  <div className="w-20 flex-shrink-0">
                    <span className={`text-sm font-medium ${isLatest ? 'text-primary' : 'text-foreground'}`}>
                      {item.round}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.date}
                    </span>
                  </div>
                  <div className="flex-1 h-8 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isLatest ? 'bg-primary' : 'bg-primary/60'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-28 text-right flex-shrink-0">
                    <span className="text-sm font-semibold">
                      {formatCurrency(item.cumulative, true)}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      (+{formatCurrency(item.amount, true)})
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              💡 Powered by Company Metrics Plugin
            </span>
            <span className="text-muted-foreground">
              {chartData.length} funding rounds visualized
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

// Company Health Score Component
function CompanyHealthScore({ data }: SlotProps) {
  const company = data;
  const fundingRounds = company?.fundingRounds || [];

  // Calculate health metrics
  const totalFunding = fundingRounds.reduce((sum: number, round: any) => {
    return sum + (Number(round.raisedAmount) || 0);
  }, 0);

  const hasRecentFunding = fundingRounds.some((round: any) => {
    if (!round.fundedAt) return false;
    const days = daysSince(new Date(round.fundedAt));
    return days < 730; // Within 2 years
  });

  const hasMultipleRounds = fundingRounds.length >= 2;
  const hasSolidFunding = totalFunding >= 10000000; // $10M+
  const isOperating = company.status === 'operating' || company.status === 'ipo';
  const hasWebsite = !!company.homepageUrl;
  const hasDescription = !!company.description && company.description.length > 50;

  // Calculate score (0-100)
  const factors = [
    { name: 'Operating Status', passed: isOperating, weight: 25 },
    { name: 'Recent Funding', passed: hasRecentFunding, weight: 20 },
    { name: 'Funding Track Record', passed: hasMultipleRounds, weight: 15 },
    { name: 'Capital Raised', passed: hasSolidFunding, weight: 20 },
    { name: 'Web Presence', passed: hasWebsite, weight: 10 },
    { name: 'Profile Complete', passed: hasDescription, weight: 10 },
  ];

  const score = factors.reduce((total, factor) => {
    return total + (factor.passed ? factor.weight : 0);
  }, 0);

  // Score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500', text: 'text-green-700', label: 'Excellent' };
    if (score >= 60) return { bg: 'bg-blue-500', text: 'text-blue-700', label: 'Good' };
    if (score >= 40) return { bg: 'bg-yellow-500', text: 'text-yellow-700', label: 'Fair' };
    return { bg: 'bg-red-500', text: 'text-red-700', label: 'Needs Data' };
  };

  const scoreStyle = getScoreColor(score);

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          Company Health Score
        </h2>

        <div className="flex items-center gap-6 mb-6">
          {/* Score Circle */}
          <div className="relative w-24 h-24">
            <svg className="w-24 h-24 transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="8"
              />
              <circle
                cx="48"
                cy="48"
                r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 264} 264`}
                className={scoreStyle.text}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold">{score}</span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
          </div>

          <div className="flex-1">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${scoreStyle.bg} text-white mb-2`}>
              {scoreStyle.label}
            </div>
            <p className="text-sm text-muted-foreground">
              Based on funding history, company status, and profile completeness.
            </p>
          </div>
        </div>

        {/* Factors */}
        <div className="grid grid-cols-2 gap-3">
          {factors.map((factor, index) => (
            <div
              key={index}
              className={`flex items-center gap-2 p-2 rounded-lg ${
                factor.passed ? 'bg-green-50' : 'bg-gray-50'
              }`}
            >
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                factor.passed 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-300 text-gray-600'
              }`}>
                {factor.passed ? '✓' : '○'}
              </div>
              <span className={`text-sm ${factor.passed ? 'text-green-700' : 'text-gray-500'}`}>
                {factor.name}
              </span>
              <span className="text-xs text-muted-foreground ml-auto">
                +{factor.weight}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Export the plugin module with new architecture
const companyMetricsPlugin: PluginModule = {
  manifest,
  components: {
    "CompanyProfile.Header": QuickStatsCard,
    "CompanyProfile.Details": FundingGrowthChart,
    // Note: CompanyHealthScore is also for Details slot - we combine them
  },
};

// Also export a combined Details component that shows both charts
function CompanyDetailsSection(props: SlotProps) {
  return (
    <>
      <FundingGrowthChart {...props} />
      <CompanyHealthScore {...props} />
    </>
  );
}

// Update the export to use combined component
const plugin: PluginModule = {
  manifest,
  components: {
    "CompanyProfile.Header": QuickStatsCard,
    "CompanyProfile.Details": CompanyDetailsSection,
  },
};

export default plugin;
