import type { PluginModule, PluginManifest, SlotProps } from "@/lib/plugin-system/types";
import { 
  PieChart,
  BarChart3,
  DollarSign,
  Briefcase,
  CalendarDays,
  Layers,
  Award,
  ArrowUpRight,
  Clock
} from "lucide-react";

export const manifest: PluginManifest = {
  id: "investor-insights",
  name: "Investor Insights",
  description: "Portfolio analytics, sector distribution, and investment timeline for investors",
  version: "1.0.0",
  author: "Metior Team",
  icon: "PieChart",
  entityTypes: ["investor"],
  slots: [
    { name: "InvestorProfile.Header", description: "Portfolio stats cards" },
    { name: "InvestorProfile.Portfolio", description: "Sector charts and investment timeline" },
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

// Category colors and icons
const categoryStyles: Record<string, { color: string; bg: string; icon: string }> = {
  'artificial-intelligence': { color: 'text-purple-700', bg: 'bg-purple-100', icon: '🤖' },
  'fintech': { color: 'text-green-700', bg: 'bg-green-100', icon: '💳' },
  'design': { color: 'text-pink-700', bg: 'bg-pink-100', icon: '🎨' },
  'productivity': { color: 'text-blue-700', bg: 'bg-blue-100', icon: '📋' },
  'social': { color: 'text-indigo-700', bg: 'bg-indigo-100', icon: '💬' },
  'developer-tools': { color: 'text-orange-700', bg: 'bg-orange-100', icon: '🛠️' },
  'data-analytics': { color: 'text-cyan-700', bg: 'bg-cyan-100', icon: '📊' },
  'e-commerce': { color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🛒' },
  'database': { color: 'text-red-700', bg: 'bg-red-100', icon: '🗄️' },
  'default': { color: 'text-gray-700', bg: 'bg-gray-100', icon: '🏢' },
};

// Investor Portfolio Stats Component
function PortfolioStats({ data }: SlotProps) {
  const investor = data;
  const investments = investor?.investments || [];

  // Aggregate portfolio data
  const portfolioCompanies = new Map<string, any>();
  let totalInvestments = 0;
  let totalParticipatedRounds = 0;

  investments.forEach((investment: any) => {
    const company = investment.fundingRound?.object;
    if (company) {
      if (!portfolioCompanies.has(company.id)) {
        portfolioCompanies.set(company.id, {
          company,
          rounds: [],
          totalRaised: 0,
        });
      }
      const entry = portfolioCompanies.get(company.id);
      entry.rounds.push(investment.fundingRound);
      entry.totalRaised += Number(investment.fundingRound.raisedAmount) || 0;
      totalParticipatedRounds++;
    }
  });

  totalInvestments = portfolioCompanies.size;

  // Calculate earliest and latest investment dates
  const investmentDates: Date[] = [];
  investments.forEach((investment: any) => {
    const fundedAt = investment.fundingRound?.fundedAt;
    if (fundedAt) {
      investmentDates.push(new Date(fundedAt));
    }
  });

  const earliestDate = investmentDates.length > 0 ? new Date(Math.min(...investmentDates.map(d => d.getTime()))) : null;
  const latestDate = investmentDates.length > 0 ? new Date(Math.max(...investmentDates.map(d => d.getTime()))) : null;

  // Calculate average deal size
  let totalDealsAmount = 0;
  investments.forEach((investment: any) => {
    totalDealsAmount += Number(investment.fundingRound?.raisedAmount) || 0;
  });
  const avgDealSize = totalParticipatedRounds > 0 ? totalDealsAmount / totalParticipatedRounds : 0;

  // Investing years active
  const yearsActive = earliestDate && latestDate 
    ? Math.ceil((latestDate.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24 * 365))
    : 0;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Portfolio Companies */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-indigo-100 rounded-lg">
              <Briefcase className="w-4 h-4 text-indigo-600" />
            </div>
            <span className="text-sm text-indigo-700 font-medium">Portfolio</span>
          </div>
          <p className="text-2xl font-bold text-indigo-900">
            {totalInvestments}
          </p>
          <p className="text-xs text-indigo-600 mt-1">
            {totalInvestments === 1 ? 'company' : 'companies'}
          </p>
        </div>

        {/* Total Rounds */}
        <div className="p-4 bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl border border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Layers className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-blue-700 font-medium">Investments</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            {totalParticipatedRounds}
          </p>
          <p className="text-xs text-blue-600 mt-1">
            funding rounds
          </p>
        </div>

        {/* Avg Deal Size */}
        <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-green-100 rounded-lg">
              <DollarSign className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-green-700 font-medium">Avg Deal Size</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            {avgDealSize > 0 ? formatCurrency(avgDealSize, true) : '—'}
          </p>
          <p className="text-xs text-green-600 mt-1">
            per round
          </p>
        </div>

        {/* Years Active */}
        <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-orange-100 rounded-lg">
              <CalendarDays className="w-4 h-4 text-orange-600" />
            </div>
            <span className="text-sm text-orange-700 font-medium">Active Since</span>
          </div>
          <p className="text-2xl font-bold text-orange-900">
            {earliestDate ? earliestDate.getFullYear() : '—'}
          </p>
          <p className="text-xs text-orange-600 mt-1">
            {yearsActive > 0 ? `${yearsActive}+ years` : ''}
          </p>
        </div>
      </div>
    </div>
  );
}

// Sector Distribution Component
function SectorDistribution({ data }: SlotProps) {
  const investor = data;
  const investments = investor?.investments || [];

  // Aggregate by sector
  const sectorStats = new Map<string, { count: number; companies: Set<string>; totalRaised: number }>();

  investments.forEach((investment: any) => {
    const company = investment.fundingRound?.object;
    if (company) {
      const sector = company.categoryCode || 'other';
      if (!sectorStats.has(sector)) {
        sectorStats.set(sector, { count: 0, companies: new Set(), totalRaised: 0 });
      }
      const entry = sectorStats.get(sector)!;
      entry.count++;
      entry.companies.add(company.id);
      entry.totalRaised += Number(investment.fundingRound.raisedAmount) || 0;
    }
  });

  if (sectorStats.size === 0) {
    return null;
  }

  // Convert to array and sort by company count
  const sectors = Array.from(sectorStats.entries())
    .map(([name, stats]) => ({
      name,
      companyCount: stats.companies.size,
      investmentCount: stats.count,
      totalRaised: stats.totalRaised,
    }))
    .sort((a, b) => b.companyCount - a.companyCount);

  const maxCompanies = Math.max(...sectors.map(s => s.companyCount));

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <PieChart className="w-5 h-5 text-primary" />
              Sector Focus
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Investment distribution across industries
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {sectors.length} sectors
          </div>
        </div>

        <div className="space-y-4">
          {sectors.map((sector, index) => {
            const percentage = (sector.companyCount / maxCompanies) * 100;
            const style = categoryStyles[sector.name] || categoryStyles.default;
            
            return (
              <div key={index}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-lg w-8`}>{style.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium capitalize">
                        {sector.name.replace(/-/g, ' ')}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {sector.companyCount} {sector.companyCount === 1 ? 'company' : 'companies'}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${style.bg.replace('bg-', 'bg-')}`}
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: style.bg.includes('purple') ? '#9333ea' :
                                         style.bg.includes('green') ? '#16a34a' :
                                         style.bg.includes('pink') ? '#db2777' :
                                         style.bg.includes('blue') ? '#2563eb' :
                                         style.bg.includes('indigo') ? '#4f46e5' :
                                         style.bg.includes('orange') ? '#ea580c' :
                                         style.bg.includes('cyan') ? '#0891b2' :
                                         style.bg.includes('yellow') ? '#ca8a04' :
                                         style.bg.includes('red') ? '#dc2626' :
                                         '#6b7280'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            💡 Powered by Investor Insights Plugin
          </p>
        </div>
      </div>
    </section>
  );
}

// Investment Timeline Component
function InvestmentTimeline({ data }: SlotProps) {
  const investor = data;
  const investments = investor?.investments || [];

  // Group investments by year
  const yearlyStats = new Map<number, { count: number; totalRaised: number; companies: string[] }>();

  investments.forEach((investment: any) => {
    const fundedAt = investment.fundingRound?.fundedAt;
    const company = investment.fundingRound?.object;
    if (fundedAt && company) {
      const year = new Date(fundedAt).getFullYear();
      if (!yearlyStats.has(year)) {
        yearlyStats.set(year, { count: 0, totalRaised: 0, companies: [] });
      }
      const entry = yearlyStats.get(year)!;
      entry.count++;
      entry.totalRaised += Number(investment.fundingRound.raisedAmount) || 0;
      if (!entry.companies.includes(company.name)) {
        entry.companies.push(company.name);
      }
    }
  });

  if (yearlyStats.size === 0) {
    return null;
  }

  // Convert to sorted array (descending by year)
  const timeline = Array.from(yearlyStats.entries())
    .map(([year, stats]) => ({ year, ...stats }))
    .sort((a, b) => b.year - a.year);

  const maxCount = Math.max(...timeline.map(t => t.count));

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Investment Activity
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Deals made over time
            </p>
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="flex items-end gap-2 h-40 mb-4">
          {timeline.slice(0, 10).reverse().map((item, index) => {
            const height = (item.count / maxCount) * 100;
            const isRecent = index === timeline.length - 1;
            
            return (
              <div key={item.year} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className={`w-full rounded-t-lg transition-all ${
                    isRecent ? 'bg-primary' : 'bg-primary/60'
                  }`}
                  style={{ height: `${Math.max(height, 8)}%` }}
                  title={`${item.count} investments in ${item.year}`}
                />
                <span className="text-xs text-muted-foreground">{item.year}</span>
              </div>
            );
          })}
        </div>

        {/* Recent Activity */}
        <div className="mt-6 pt-4 border-t border-border">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            Recent Investments
          </h3>
          <div className="space-y-2">
            {timeline.slice(0, 3).map((item) => (
              <div key={item.year} className="flex items-center justify-between text-sm">
                <span className="font-medium">{item.year}</span>
                <span className="text-muted-foreground">
                  {item.count} deal{item.count !== 1 ? 's' : ''} • {formatCurrency(item.totalRaised, true)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// Top Portfolio Companies Component
function TopPortfolioCompanies({ data }: SlotProps) {
  const investor = data;
  const investments = investor?.investments || [];

  // Aggregate by company
  const companyStats = new Map<string, {
    company: any;
    investmentCount: number;
    totalRaised: number;
    rounds: string[];
    latestDate: Date | null;
  }>();

  investments.forEach((investment: any) => {
    const company = investment.fundingRound?.object;
    if (company) {
      if (!companyStats.has(company.id)) {
        companyStats.set(company.id, {
          company,
          investmentCount: 0,
          totalRaised: 0,
          rounds: [],
          latestDate: null,
        });
      }
      const entry = companyStats.get(company.id)!;
      entry.investmentCount++;
      entry.totalRaised += Number(investment.fundingRound.raisedAmount) || 0;
      if (investment.fundingRound.roundCode) {
        entry.rounds.push(investment.fundingRound.roundCode);
      }
      const fundedAt = investment.fundingRound.fundedAt;
      if (fundedAt) {
        const date = new Date(fundedAt);
        if (!entry.latestDate || date > entry.latestDate) {
          entry.latestDate = date;
        }
      }
    }
  });

  // Sort by investment count (showing most invested companies)
  const topCompanies = Array.from(companyStats.values())
    .sort((a, b) => b.investmentCount - a.investmentCount)
    .slice(0, 5);

  if (topCompanies.length === 0) {
    return null;
  }

  return (
    <section className="mb-8">
      <div className="p-6 border border-border rounded-xl bg-card">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Key Portfolio Companies
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Companies with multiple investment rounds
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {topCompanies.map((item, index) => {
            const style = categoryStyles[item.company.categoryCode] || categoryStyles.default;
            
            return (
              <div 
                key={item.company.id}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-100 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {index + 1}
                </div>

                {/* Company Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold truncate">{item.company.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${style.bg} ${style.color}`}>
                      {item.company.categoryCode?.replace(/-/g, ' ') || 'Other'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {item.rounds.map(r => r.toUpperCase()).join(', ')}
                  </div>
                </div>

                {/* Stats */}
                <div className="text-right">
                  <div className="font-semibold text-primary">
                    {item.investmentCount} round{item.investmentCount !== 1 ? 's' : ''}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(item.totalRaised, true)} raised
                  </div>
                </div>

                {/* Link indicator */}
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// Combined Portfolio Section component
function InvestorPortfolioSection(props: SlotProps) {
  return (
    <>
      <SectorDistribution {...props} />
      <InvestmentTimeline {...props} />
      <TopPortfolioCompanies {...props} />
    </>
  );
}

// Export the plugin module with new architecture
const plugin: PluginModule = {
  manifest,
  components: {
    "InvestorProfile.Header": PortfolioStats,
    "InvestorProfile.Portfolio": InvestorPortfolioSection,
  },
};

export default plugin;
