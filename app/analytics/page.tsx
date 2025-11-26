import { PrismaClient } from "@prisma/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, DollarSign, TrendingUp, Calendar, Globe } from "lucide-react";

const prisma = new PrismaClient();

export default async function AnalyticsPage() {
  const [companyCount, investorCount, fundingRounds] = await Promise.all([
    prisma.object.count({ where: { entityType: "Company" } }),
    prisma.object.count({ where: { entityType: "FinancialOrg" } }),
    prisma.fundingRound.findMany({
      select: { raisedAmount: true, fundedAt: true, roundCode: true },
    }),
  ]);

  const totalFunding = fundingRounds.reduce((sum, round) => {
    return sum + (Number(round.raisedAmount) || 0);
  }, 0);

  const fundingByYear: Record<string, number> = {};
  fundingRounds.forEach((round) => {
    if (round.fundedAt) {
      const year = new Date(round.fundedAt).getFullYear().toString();
      fundingByYear[year] = (fundingByYear[year] || 0) + (Number(round.raisedAmount) || 0);
    }
  });

  const years = Object.keys(fundingByYear).sort();
  const maxYearFunding = Math.max(...Object.values(fundingByYear));

  const fundingByRound: Record<string, { count: number; total: number }> = {};
  fundingRounds.forEach((round) => {
    const code = round.roundCode || "other";
    if (!fundingByRound[code]) {
      fundingByRound[code] = { count: 0, total: 0 };
    }
    fundingByRound[code].count += 1;
    fundingByRound[code].total += Number(round.raisedAmount) || 0;
  });

  const roundTypes = Object.entries(fundingByRound)
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Overview of funding data and market trends</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{companyCount}</p>
                  <p className="text-sm text-muted-foreground">Companies</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{investorCount}</p>
                  <p className="text-sm text-muted-foreground">Investors</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">${(totalFunding / 1_000_000_000).toFixed(1)}B</p>
                  <p className="text-sm text-muted-foreground">Total Funding</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{fundingRounds.length}</p>
                  <p className="text-sm text-muted-foreground">Funding Rounds</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Funding by Year
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {years.map((year) => {
                  const amount = fundingByYear[year];
                  const percentage = (amount / maxYearFunding) * 100;
                  return (
                    <div key={year}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{year}</span>
                        <span className="text-muted-foreground">${(amount / 1_000_000_000).toFixed(2)}B</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${percentage}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Funding by Round Type
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {roundTypes.map(([code, data]) => (
                  <div key={code} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div>
                      <p className="font-medium uppercase">{code}</p>
                      <p className="text-xs text-muted-foreground">{data.count} round{data.count !== 1 ? "s" : ""}</p>
                    </div>
                    <p className="font-semibold">${(data.total / 1_000_000).toFixed(0)}M</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
