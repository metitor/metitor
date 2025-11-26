import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Users, Search, ArrowUpRight, MapPin, TrendingUp, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const prisma = new PrismaClient();

interface SearchParams {
  q?: string;
}

async function getInvestors(searchParams: SearchParams) {
  const where: Record<string, unknown> = { entityType: "FinancialOrg" };
  
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  try {
    return await prisma.object.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        investments: {
          include: {
            fundingRound: {
              select: {
                raisedAmount: true,
                object: {
                  select: { name: true, permalink: true },
                },
              },
            },
          },
        },
        offices: {
          select: { city: true, countryCode: true },
          take: 1,
        },
      },
    });
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [total, totalInvestments, totalFundingAmount] = await Promise.all([
      prisma.object.count({ where: { entityType: "FinancialOrg" } }),
      prisma.investment.count(),
      prisma.fundingRound.aggregate({
        _sum: { raisedAmount: true },
      }),
    ]);
    return { 
      total, 
      totalInvestments, 
      totalFundingAmount: totalFundingAmount._sum.raisedAmount 
    };
  } catch {
    return { total: 0, totalInvestments: 0, totalFundingAmount: null };
  }
}

function formatCurrency(amount: unknown): string {
  if (!amount) return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  if (num >= 1e12) return `$${(num / 1e12).toFixed(1)}T`;
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

export default async function InvestorsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [investors, stats] = await Promise.all([
    getInvestors(params),
    getStats(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Investors</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Explore {stats.total.toLocaleString()} investors and their portfolios
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Investors</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-blue-600">{stats.totalInvestments.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Investments</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-green-600">
                  {stats.totalFundingAmount ? formatCurrency(stats.totalFundingAmount) : "$0"}
                </div>
                <div className="text-sm text-muted-foreground">Total Funding Deployed</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <form action="/investors" method="get" className="max-w-xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                type="text"
                name="q"
                placeholder="Search investors..."
                defaultValue={params.q}
                className="pl-10"
              />
            </div>
          </form>
        </div>
      </section>

      {/* Investors List */}
      <section className="container mx-auto px-4 py-8 max-w-6xl">
        {investors.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium mb-2">No investors found</p>
              {params.q ? (
                <Button asChild variant="outline">
                  <Link href="/investors">Clear search</Link>
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Run <code className="px-2 py-1 bg-muted rounded">pnpm run seed</code> to get started
                </p>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {investors.map((investor) => {
              const location = investor.offices[0];
              const portfolioSize = investor.investments.length;
              const uniqueCompanies = new Set(
                investor.investments.map(inv => inv.fundingRound.object.permalink)
              ).size;
              
              // Calculate total invested
              let totalInvested = 0;
              investor.investments.forEach(inv => {
                if (inv.fundingRound.raisedAmount) {
                  totalInvested += Number(inv.fundingRound.raisedAmount);
                }
              });
              
              // Get sample portfolio companies
              const sampleCompanies = investor.investments
                .slice(0, 5)
                .map(inv => inv.fundingRound.object)
                .filter((company, index, self) => 
                  index === self.findIndex(c => c.permalink === company.permalink)
                );
              
              return (
                <Link key={investor.id} href={`/investors/${investor.permalink}`}>
                  <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                            {investor.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold truncate">{investor.name}</h3>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </div>
                              
                              {investor.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {investor.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground mb-3">
                                {location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {location.city}{location.countryCode && `, ${location.countryCode}`}
                                  </span>
                                )}
                                
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-3 h-3" />
                                  {uniqueCompanies} portfolio {uniqueCompanies === 1 ? "company" : "companies"}
                                </span>
                                
                                <span className="flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" />
                                  {portfolioSize} {portfolioSize === 1 ? "investment" : "investments"}
                                </span>
                              </div>
                              
                              {/* Sample Portfolio */}
                              {sampleCompanies.length > 0 && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs text-muted-foreground">Portfolio:</span>
                                  {sampleCompanies.map((company) => (
                                    <Badge key={company.permalink} variant="secondary" className="text-xs">
                                      {company.name}
                                    </Badge>
                                  ))}
                                  {uniqueCompanies > 5 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{uniqueCompanies - 5} more
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {totalInvested > 0 && (
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-green-600">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-bold">
                                    {formatCurrency(totalInvested)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  Total invested*
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}

        {investors.length >= 50 && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing first 50 results. Use search to find more specific investors.
            </p>
          </div>
        )}
        
        <p className="text-xs text-muted-foreground mt-4">
          * Total invested represents the sum of funding rounds this investor participated in
        </p>
      </section>
    </main>
  );
}
