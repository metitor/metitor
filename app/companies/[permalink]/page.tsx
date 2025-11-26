import { notFound } from "next/navigation";
import { PrismaClient } from "@prisma/client";
import Link from "next/link";
import { Building2, Globe, ArrowLeft, ExternalLink, MapPin, TrendingUp, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyPluginSelector, CompanyHeaderSlot, CompanyDetailsSlot } from "./CompanyPlugins";

const prisma = new PrismaClient();

interface CompanyPageProps {
  params: Promise<{
    permalink: string;
  }>;
}

export default async function CompanyPage({ params }: CompanyPageProps) {
  const { permalink } = await params;

  // Fetch company data with related entities
  const company = await prisma.object.findUnique({
    where: {
      permalink,
      entityType: "Company",
    },
    include: {
      fundingRounds: {
        orderBy: {
          fundedAt: "desc",
        },
      },
      acquisitionsAcquired: {
        include: {
          acquiringObject: true,
        },
      },
      offices: true,
      milestones: {
        orderBy: {
          milestoneAt: "desc",
        },
      },
      ipos: true,
    },
  });

  // Return 404 if company not found
  if (!company) {
    notFound();
  }

  // Status badge color
  const statusColors: Record<string, string> = {
    operating: 'bg-green-100 text-green-700 border-green-200',
    acquired: 'bg-blue-100 text-blue-700 border-blue-200',
    ipo: 'bg-purple-100 text-purple-700 border-purple-200',
    closed: 'bg-red-100 text-red-700 border-red-200',
  };

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
          {/* Company Title and Meta */}
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{company.name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {company.status && (
                    <Badge variant="outline" className={statusColors[company.status] || ''}>
                      {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                    </Badge>
                  )}
                  {company.categoryCode && (
                    <Badge variant="secondary" className="capitalize">
                      {company.categoryCode.replace(/-/g, ' ')}
                    </Badge>
                  )}
                  {company.foundedAt && (
                    <Badge variant="outline">
                      Founded {new Date(company.foundedAt).getFullYear()}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            {company.homepageUrl && (
              <Button asChild variant="outline" className="flex-shrink-0">
                <a href={company.homepageUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Visit Website
                  <ExternalLink className="w-3 h-3" />
                </a>
              </Button>
            )}
            
            {/* Plugin Customization Button */}
            <CompanyPluginSelector company={JSON.parse(JSON.stringify(company))} />
          </div>

          {company.description && (
            <p className="text-lg text-muted-foreground leading-relaxed max-w-4xl">
              {company.description}
            </p>
          )}
          
          {/* Plugin Slot for Header */}
          <div className="mt-6">
            <CompanyHeaderSlot company={JSON.parse(JSON.stringify(company))} />
          </div>
        </div>

        {/* Details Section with Plugin Slot */}
        <div className="space-y-8">
          <CompanyDetailsSlot company={JSON.parse(JSON.stringify(company))} />

          {/* IPO Information */}
          {company.ipos && company.ipos.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <Award className="w-6 h-6 text-purple-500" />
                IPO Information
              </h2>
              {company.ipos.map((ipo) => (
                <Card key={ipo.id} className="bg-gradient-to-br from-purple-50 to-violet-50 border-purple-200">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {ipo.stockSymbol && (
                        <div>
                          <p className="text-sm text-muted-foreground">Stock Symbol</p>
                          <p className="text-2xl font-bold text-purple-700">{ipo.stockSymbol}</p>
                        </div>
                      )}
                      {ipo.publicAt && (
                        <div>
                          <p className="text-sm text-muted-foreground">IPO Date</p>
                          <p className="font-semibold">
                            {new Date(ipo.publicAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </p>
                        </div>
                      )}
                      {ipo.valuationAmount && (
                        <div>
                          <p className="text-sm text-muted-foreground">Valuation</p>
                          <p className="font-semibold">
                            ${Number(ipo.valuationAmount).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {ipo.raisedAmount && (
                        <div>
                          <p className="text-sm text-muted-foreground">Raised</p>
                          <p className="font-semibold">
                            ${Number(ipo.raisedAmount).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Funding Rounds Section */}
          {company.fundingRounds.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-green-500" />
                Funding Rounds
              </h2>
              <div className="space-y-3">
                {company.fundingRounds.map((round, index) => (
                  <Card 
                    key={round.id}
                    className={`transition-all hover:shadow-md ${index === 0 ? 'border-primary/30 bg-primary/5' : ''}`}
                  >
                    <CardContent className="py-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            index === 0 ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                          }`}>
                            <span className="text-sm font-bold">
                              {round.roundCode?.charAt(0).toUpperCase() || '#'}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold uppercase">
                              {round.roundCode || "Funding Round"}
                            </h3>
                            {round.fundedAt && (
                              <p className="text-sm text-muted-foreground">
                                {new Date(round.fundedAt).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                        {round.raisedAmount && (
                          <div className="text-right">
                            <p className="text-xl font-bold">
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
                ))}
              </div>
            </section>
          )}

          {/* Acquisition Information */}
          {company.acquisitionsAcquired.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4">Acquisition</h2>
              {company.acquisitionsAcquired.map((acquisition) => (
                <Card key={acquisition.id} className="bg-blue-50 border-blue-200">
                  <CardContent className="pt-6">
                    <p className="text-lg">
                      Acquired by{" "}
                      <span className="font-semibold text-blue-700">
                        {acquisition.acquiringObject.name}
                      </span>
                    </p>
                    {acquisition.acquiredAt && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(acquisition.acquiredAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    )}
                    {acquisition.priceAmount && (
                      <p className="text-2xl font-bold mt-3 text-blue-700">
                        ${Number(acquisition.priceAmount).toLocaleString()}
                      </p>
                    )}
                    {acquisition.termCode && (
                      <Badge variant="outline" className="mt-2 capitalize">
                        {acquisition.termCode}
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </section>
          )}

          {/* Office Locations */}
          {company.offices.length > 0 && (
            <section>
              <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-6 h-6 text-red-500" />
                Office Locations
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {company.offices.map((office, index) => (
                  <Card 
                    key={office.id}
                    className={`hover:shadow-md transition-all ${index === 0 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-red-500" />
                        {office.description || 'Office'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        {office.address1 && <p>{office.address1}</p>}
                        {office.address2 && <p>{office.address2}</p>}
                        <p className="font-medium text-foreground">
                          {[office.city, office.stateCode, office.zipCode]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        {office.countryCode && (
                          <Badge variant="outline" className="mt-2">
                            {office.countryCode}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
