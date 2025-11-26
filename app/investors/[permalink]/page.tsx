import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Users, Globe, ArrowLeft, ExternalLink, Building2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvestorPluginSelector, InvestorHeaderSlot, InvestorPortfolioSlot } from "./InvestorPlugins";

const prisma = new PrismaClient();

interface InvestorPageProps {
  params: Promise<{
    permalink: string;
  }>;
}

export default async function InvestorPage({ params }: InvestorPageProps) {
  const { permalink } = await params;

  // Fetch investor data with related entities
  const investor = await prisma.object.findUnique({
    where: {
      permalink,
      entityType: "FinancialOrg",
    },
    include: {
      investments: {
        include: {
          fundingRound: {
            include: {
              object: true,
            },
          },
        },
      },
    },
  });

  // Return 404 if investor not found
  if (!investor) {
    notFound();
  }

  // Aggregate investments by company
  const portfolioMap = new Map<string, {
    company: typeof investor.investments[0]['fundingRound']['object'];
    totalInvested: number;
    mostRecentDate: Date | null;
    investmentCount: number;
    rounds: string[];
  }>();

  investor.investments.forEach((investment) => {
    const company = investment.fundingRound.object;
    const companyId = company.id;
    const fundedAt = investment.fundingRound.fundedAt;
    
    if (!portfolioMap.has(companyId)) {
      portfolioMap.set(companyId, {
        company,
        totalInvested: 0,
        mostRecentDate: fundedAt,
        investmentCount: 0,
        rounds: [],
      });
    }
    
    const entry = portfolioMap.get(companyId)!;
    entry.investmentCount += 1;
    entry.totalInvested += Number(investment.fundingRound.raisedAmount) || 0;
    if (investment.fundingRound.roundCode) {
      entry.rounds.push(investment.fundingRound.roundCode);
    }
    
    // Update most recent date
    if (fundedAt && (!entry.mostRecentDate || fundedAt > entry.mostRecentDate)) {
      entry.mostRecentDate = fundedAt;
    }
  });

  // Convert to array and sort by most recent investment date
  const portfolio = Array.from(portfolioMap.values()).sort((a, b) => {
    if (!a.mostRecentDate && !b.mostRecentDate) return 0;
    if (!a.mostRecentDate) return 1;
    if (!b.mostRecentDate) return -1;
    return b.mostRecentDate.getTime() - a.mostRecentDate.getTime();
  });

  // Category styles
  const categoryStyles: Record<string, { bg: string; text: string }> = {
    'venture-capital': { bg: 'bg-purple-100', text: 'text-purple-700' },
    'hedge-fund': { bg: 'bg-blue-100', text: 'text-blue-700' },
    'private-equity': { bg: 'bg-green-100', text: 'text-green-700' },
  };

  const categoryStyle = categoryStyles[investor.categoryCode || ''] || { bg: 'bg-gray-100', text: 'text-gray-700' };

  return (
    <div className="min-h-screen bg-background">
      {/* Breadcrumb */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header Section */}
        <div className="mb-8">
          {/* Investor Title and Meta */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{investor.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {investor.categoryCode && (
                    <Badge className={`${categoryStyle.bg} ${categoryStyle.text} border-0 capitalize`}>
                      {investor.categoryCode.replace(/-/g, ' ')}
                    </Badge>
                  )}
                  {investor.foundedAt && (
                    <Badge variant="outline">
                      Est. {new Date(investor.foundedAt).getFullYear()}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {portfolio.length} Portfolio Companies
                  </Badge>
                </div>
              </div>
            </div>
            
            {investor.homepageUrl && (
              <Button asChild variant="outline" className="flex-shrink-0">
                <a href={investor.homepageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
            
            {/* Plugin Customization Button */}
            <InvestorPluginSelector investor={JSON.parse(JSON.stringify(investor))} />
          </div>

          {investor.description && (
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
              {investor.description}
            </p>
          )}
          
          {/* Plugin Slot for Header */}
          <div className="mt-6">
            <InvestorHeaderSlot investor={JSON.parse(JSON.stringify(investor))} />
          </div>
        </div>

        {/* Portfolio Section with Plugin Slot */}
        <div className="space-y-8">
          <InvestorPortfolioSlot investor={JSON.parse(JSON.stringify(investor))} />

          {/* Portfolio Companies */}
          {portfolio.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Building2 className="w-6 h-6 text-primary" />
                Portfolio Companies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {portfolio.map((entry) => {
                  const companyCategoryStyles: Record<string, { bg: string; text: string }> = {
                    'artificial-intelligence': { bg: 'bg-purple-100', text: 'text-purple-700' },
                    'fintech': { bg: 'bg-green-100', text: 'text-green-700' },
                    'design': { bg: 'bg-pink-100', text: 'text-pink-700' },
                    'productivity': { bg: 'bg-blue-100', text: 'text-blue-700' },
                    'social': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
                    'developer-tools': { bg: 'bg-orange-100', text: 'text-orange-700' },
                    'data-analytics': { bg: 'bg-cyan-100', text: 'text-cyan-700' },
                    'e-commerce': { bg: 'bg-yellow-100', text: 'text-yellow-700' },
                    'database': { bg: 'bg-red-100', text: 'text-red-700' },
                  };
                  const companyStyle = companyCategoryStyles[entry.company.categoryCode || ''] || { bg: 'bg-gray-100', text: 'text-gray-700' };
                  
                  return (
                    <Link key={entry.company.id} href={`/companies/${entry.company.permalink}`}>
                      <Card className="h-full hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer group">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <CardTitle className="text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                                {entry.company.name}
                                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                              </CardTitle>
                              {entry.company.categoryCode && (
                                <Badge className={`mt-2 text-xs ${companyStyle.bg} ${companyStyle.text} border-0 capitalize`}>
                                  {entry.company.categoryCode.replace(/-/g, ' ')}
                                </Badge>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0 ml-4">
                              <p className="font-semibold text-primary">
                                {entry.investmentCount} round{entry.investmentCount !== 1 ? 's' : ''}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${(entry.totalInvested / 1000000).toFixed(1)}M total
                              </p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {entry.company.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                              {entry.company.description}
                            </p>
                          )}
                          <div className="flex items-center justify-between">
                            <div className="flex flex-wrap gap-1">
                              {entry.rounds.slice(0, 3).map((round, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs uppercase">
                                  {round}
                                </Badge>
                              ))}
                              {entry.rounds.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{entry.rounds.length - 3}
                                </Badge>
                              )}
                            </div>
                            {entry.mostRecentDate && (
                              <span className="text-xs text-muted-foreground">
                                Latest: {new Date(entry.mostRecentDate).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                })}
                              </span>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
