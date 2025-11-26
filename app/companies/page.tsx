import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Building2, Search, ArrowUpRight, Calendar, MapPin, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const prisma = new PrismaClient();

interface SearchParams {
  q?: string;
  category?: string;
  status?: string;
}

async function getCompanies(searchParams: SearchParams) {
  const where: Record<string, unknown> = { entityType: "Company" };
  
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { description: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }
  
  if (searchParams.category) {
    where.categoryCode = searchParams.category;
  }
  
  if (searchParams.status) {
    where.status = searchParams.status;
  }

  try {
    return await prisma.object.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        fundingRounds: {
          select: {
            raisedAmount: true,
            roundCode: true,
            fundedAt: true,
          },
          orderBy: { fundedAt: "desc" },
          take: 1,
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

async function getCategories() {
  try {
    const categories = await prisma.object.groupBy({
      by: ["categoryCode"],
      where: { entityType: "Company", categoryCode: { not: null } },
      _count: { categoryCode: true },
      orderBy: { _count: { categoryCode: "desc" } },
      take: 10,
    });
    return categories.filter(c => c.categoryCode);
  } catch {
    return [];
  }
}

async function getStats() {
  try {
    const [total, operating, acquired, ipo] = await Promise.all([
      prisma.object.count({ where: { entityType: "Company" } }),
      prisma.object.count({ where: { entityType: "Company", status: "operating" } }),
      prisma.object.count({ where: { entityType: "Company", status: "acquired" } }),
      prisma.object.count({ where: { entityType: "Company", status: "ipo" } }),
    ]);
    return { total, operating, acquired, ipo };
  } catch {
    return { total: 0, operating: 0, acquired: 0, ipo: 0 };
  }
}

function formatCurrency(amount: unknown): string {
  if (!amount) return "";
  const num = Number(amount);
  if (isNaN(num)) return "";
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}K`;
  return `$${num.toLocaleString()}`;
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [companies, categories, stats] = await Promise.all([
    getCompanies(params),
    getCategories(),
    getStats(),
  ]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <section className="border-b">
        <div className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="flex items-center gap-3 mb-4">
            <Building2 className="w-8 h-8" />
            <h1 className="text-4xl font-bold">Companies</h1>
          </div>
          <p className="text-lg text-muted-foreground mb-8">
            Explore {stats.total.toLocaleString()} companies in our database
          </p>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Total Companies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-green-600">{stats.operating.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Operating</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-blue-600">{stats.acquired.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Acquired</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-2xl font-bold text-purple-600">{stats.ipo.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">IPO</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <form action="/companies" method="get" className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  type="text"
                  name="q"
                  placeholder="Search companies..."
                  defaultValue={params.q}
                  className="pl-10"
                />
              </div>
            </form>
            <div className="flex gap-2 flex-wrap">
              <Link href="/companies">
                <Button variant={!params.category && !params.status ? "secondary" : "outline"} size="sm">
                  All
                </Button>
              </Link>
              <Link href="/companies?status=operating">
                <Button variant={params.status === "operating" ? "secondary" : "outline"} size="sm">
                  Operating
                </Button>
              </Link>
              <Link href="/companies?status=acquired">
                <Button variant={params.status === "acquired" ? "secondary" : "outline"} size="sm">
                  Acquired
                </Button>
              </Link>
              <Link href="/companies?status=ipo">
                <Button variant={params.status === "ipo" ? "secondary" : "outline"} size="sm">
                  IPO
                </Button>
              </Link>
            </div>
          </div>

          {/* Category Pills */}
          {categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-4">
              <Filter className="w-4 h-4 text-muted-foreground mt-1" />
              {categories.map((cat) => (
                <Link key={cat.categoryCode} href={`/companies?category=${cat.categoryCode}`}>
                  <Badge 
                    variant={params.category === cat.categoryCode ? "default" : "outline"}
                    className="cursor-pointer"
                  >
                    {cat.categoryCode} ({cat._count.categoryCode})
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Companies List */}
      <section className="container mx-auto px-4 py-8 max-w-6xl">
        {companies.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Building2 className="w-16 h-16 text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium mb-2">No companies found</p>
              {params.q || params.category || params.status ? (
                <Button asChild variant="outline">
                  <Link href="/companies">Clear filters</Link>
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
            {companies.map((company) => {
              const lastRound = company.fundingRounds[0];
              const location = company.offices[0];
              
              return (
                <Link key={company.id} href={`/companies/${company.permalink}`}>
                  <Card className="hover:shadow-lg transition-all hover:border-primary/50">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                            {company.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold truncate">{company.name}</h3>
                                <ArrowUpRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              </div>
                              
                              {company.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                                  {company.description}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground">
                                {company.categoryCode && (
                                  <Badge variant="secondary" className="text-xs">
                                    {company.categoryCode}
                                  </Badge>
                                )}
                                
                                {company.status && (
                                  <Badge 
                                    variant={
                                      company.status === "operating" ? "default" :
                                      company.status === "ipo" ? "secondary" : "outline"
                                    }
                                    className="text-xs"
                                  >
                                    {company.status}
                                  </Badge>
                                )}
                                
                                {company.foundedAt && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    Founded {new Date(company.foundedAt).getFullYear()}
                                  </span>
                                )}
                                
                                {location && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3" />
                                    {location.city}{location.countryCode && `, ${location.countryCode}`}
                                  </span>
                                )}
                              </div>
                            </div>
                            
                            {lastRound && lastRound.raisedAmount && (
                              <div className="text-right flex-shrink-0">
                                <div className="flex items-center gap-1 text-green-600">
                                  <TrendingUp className="w-4 h-4" />
                                  <span className="font-bold">
                                    {formatCurrency(lastRound.raisedAmount)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {lastRound.roundCode || "Latest"} round
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

        {companies.length >= 50 && (
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Showing first 50 results. Use search to find more specific companies.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
