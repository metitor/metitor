import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Search, TrendingUp, Users, Building2, ArrowRight, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const prisma = new PrismaClient();

async function getStats() {
  try {
    const [companiesCount, investorsCount, fundingRoundsCount] = await Promise.all([
      prisma.object.count({ where: { entityType: "Company" } }),
      prisma.object.count({ where: { entityType: "FinancialOrg" } }),
      prisma.fundingRound.count(),
    ]);
    return { companiesCount, investorsCount, fundingRoundsCount };
  } catch (error) {
    return { companiesCount: 0, investorsCount: 0, fundingRoundsCount: 0 };
  }
}

async function getFeaturedCompanies() {
  try {
    return await prisma.object.findMany({
      where: { entityType: "Company", status: "operating" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: {
        id: true,
        name: true,
        permalink: true,
        categoryCode: true,
        description: true,
        foundedAt: true,
      },
    });
  } catch (error) {
    return [];
  }
}

async function getRecentFundingRounds() {
  try {
    return await prisma.fundingRound.findMany({
      where: { fundedAt: { not: null } },
      orderBy: { fundedAt: "desc" },
      take: 5,
      include: {
        object: {
          select: { name: true, permalink: true, entityType: true },
        },
      },
    });
  } catch (error) {
    return [];
  }
}

export default async function Home() {
  const [stats, featuredCompanies, recentFundingRounds] = await Promise.all([
    getStats(),
    getFeaturedCompanies(),
    getRecentFundingRounds(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="border-b">
        <div className="container mx-auto px-4 pt-20 pb-16 max-w-6xl">
          <div className="text-center mb-12">
            <Badge variant="secondary" className="mb-6">
              <Sparkles className="w-3 h-3 mr-2" />
              Open Source Intelligence Platform
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover startup intelligence
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Explore companies, investors, and funding data with powerful analytics and insights
            </p>

            {/* Search Bar */}
            <form action="/search" method="get" className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
                <Input
                  type="text"
                  name="q"
                  placeholder="Search companies, investors..."
                  className="pl-12 h-14 text-lg"
                />
              </div>
            </form>

            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/companies">
                  Explore Companies
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/investors">
                  View Investors
                </Link>
              </Button>
            </div>
          </div>

          {/* Stats Section */}
          <Card className="mt-16">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stats.companiesCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground font-medium">Companies</div>
                </div>
                <div className="text-center md:border-x">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stats.investorsCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground font-medium">Investors</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl md:text-5xl font-bold mb-2">
                    {stats.fundingRoundsCount.toLocaleString()}
                  </div>
                  <div className="text-muted-foreground font-medium">Funding Rounds</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Featured Companies */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Featured Companies</h2>
          <Button asChild variant="ghost">
            <Link href="/companies">
              View all <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {featuredCompanies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No companies available yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Run <code className="px-2 py-1 bg-muted rounded">pnpm run seed</code> to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredCompanies.map((company) => (
              <Link key={company.id} href={`/companies/${company.permalink}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{company.name}</CardTitle>
                      {company.categoryCode && (
                        <Badge variant="secondary">{company.categoryCode}</Badge>
                      )}
                    </div>
                    {company.description && (
                      <CardDescription className="line-clamp-2">
                        {company.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  {company.foundedAt && (
                    <CardContent>
                      <p className="text-xs text-muted-foreground">
                        Founded {new Date(company.foundedAt).getFullYear()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent Funding Rounds */}
      <section className="bg-muted/50 border-y">
        <div className="container mx-auto px-4 py-16 max-w-6xl gap-2">
          <h2 className="text-3xl font-bold mb-8">Recent Funding Rounds</h2>

          {recentFundingRounds.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No funding rounds available yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {recentFundingRounds.map((round) => (
                <Link key={round.id} href={`/companies/${round.object.permalink}`}>
                  <Card className="hover:shadow-lg transition-shadow">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold mb-2">{round.object.name}</h3>
                          <div className="flex gap-3 items-center">
                            {round.roundCode && (
                              <Badge>{round.roundCode}</Badge>
                            )}
                            {round.fundedAt && (
                              <span className="text-sm text-muted-foreground">
                                {new Date(round.fundedAt).toLocaleDateString('en-US', { 
                                  month: 'short', 
                                  day: 'numeric', 
                                  year: 'numeric' 
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        {round.raisedAmount && (
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              ${Number(round.raisedAmount).toLocaleString()}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {round.raisedCurrencyCode || "USD"}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Building2 className="w-12 h-12 mb-4" />
              <CardTitle>Company Profiles</CardTitle>
              <CardDescription>
                Detailed company information with funding history and key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link href="/companies">
                  Explore <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 mb-4" />
              <CardTitle>Investor Network</CardTitle>
              <CardDescription>
                Discover investors, portfolios, and investment patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link href="/investors">
                  Discover <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="w-12 h-12 mb-4" />
              <CardTitle>Analytics Dashboard</CardTitle>
              <CardDescription>
                Visualize funding trends and market insights
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-between">
                <Link href="/analytics">
                  Analyze <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
