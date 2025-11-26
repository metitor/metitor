"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface SearchResult {
  id: string;
  name: string;
  entityType: string;
  categoryCode: string | null;
  permalink: string;
  description: string | null;
}

interface SearchResponse {
  results: SearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Icons
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  );
}

function BuildingIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}

function BankIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function formatCategory(code: string | null): string {
  if (!code) return "";
  return code.split("-").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [pagination, setPagination] = useState<SearchResponse["pagination"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const q = searchParams.get("q");
    const page = searchParams.get("page") || "1";
    
    if (q) {
      setQuery(q);
      performSearch(q, parseInt(page));
    }
  }, [searchParams]);

  const performSearch = async (searchQuery: string, page: number = 1) => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query");
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&page=${page}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Search failed");
      }

      const data: SearchResponse = await response.json();
      setResults(data.results);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setResults([]);
      setPagination(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}&page=${newPage}`);
    }
  };

  const getEntityLink = (result: SearchResult) => {
    if (result.entityType === "Company") {
      return `/companies/${result.permalink}`;
    } else if (result.entityType === "FinancialOrg") {
      return `/investors/${result.permalink}`;
    }
    return "#";
  };

  const getEntityIcon = (entityType: string) => {
    if (entityType === "Company") {
      return <BuildingIcon className="h-5 w-5" />;
    }
    return <BankIcon className="h-5 w-5" />;
  };

  const getEntityLabel = (entityType: string) => {
    if (entityType === "Company") return "Company";
    if (entityType === "FinancialOrg") return "Investor";
    return entityType;
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Search Section */}
      <div className="bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3">
              Discover Companies & Investors
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search through our database of startups, tech companies, and venture capital firms
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for companies, investors..."
                  className="pl-10 h-12 text-base"
                />
              </div>
              <Button type="submit" disabled={loading} size="lg" className="h-12 px-8">
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Searching
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </form>

          {/* Quick suggestions */}
          {!hasSearched && (
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground mb-3">Try searching for:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {["OpenAI", "Stripe", "Sequoia", "Fintech", "AI"].map((term) => (
                  <button
                    key={term}
                    onClick={() => {
                      setQuery(term);
                      router.push(`/search?q=${encodeURIComponent(term)}`);
                    }}
                    className="px-3 py-1.5 text-sm bg-background border rounded-full hover:bg-accent transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results Section */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error Message */}
        {error && (
          <Card className="mb-6 border-destructive/50 bg-destructive/5">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <svg className="h-5 w-5 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-destructive">Search Error</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-3">
                      <Skeleton className="h-6 w-48" />
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-24 rounded-full" />
                      </div>
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && hasSearched && (
          <>
            {results.length === 0 ? (
              <div className="text-center py-16">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <SearchIcon className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No results found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn&apos;t find anything matching &quot;{query}&quot;. Try different keywords or check your spelling.
                </p>
                <Button variant="outline" className="mt-6" onClick={() => {
                  setQuery("");
                  setHasSearched(false);
                  router.push("/search");
                }}>
                  Clear search
                </Button>
              </div>
            ) : (
              <>
                {/* Results Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg font-semibold">
                      {pagination?.total} {pagination?.total === 1 ? "result" : "results"} for &quot;{query}&quot;
                    </h2>
                    {pagination && pagination.totalPages > 1 && (
                      <p className="text-sm text-muted-foreground">
                        Page {pagination.page} of {pagination.totalPages}
                      </p>
                    )}
                  </div>
                </div>

                {/* Results List */}
                <div className="space-y-4">
                  {results.map((result) => (
                    <Link key={result.id} href={getEntityLink(result)}>
                      <Card className="overflow-hidden hover:shadow-md hover:border-primary/20 transition-all duration-200 group cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Entity Icon */}
                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center shrink-0 ${
                              result.entityType === "Company" 
                                ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" 
                                : "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            }`}>
                              {getEntityIcon(result.entityType)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">
                                    {result.name}
                                  </h3>
                                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                    <Badge variant="secondary" className="font-normal">
                                      {getEntityLabel(result.entityType)}
                                    </Badge>
                                    {result.categoryCode && (
                                      <Badge variant="outline" className="font-normal">
                                        {formatCategory(result.categoryCode)}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                <ArrowRightIcon className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                              </div>
                              {result.description && (
                                <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                  {result.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={pagination.page === pageNum ? "default" : "ghost"}
                            size="sm"
                            className="w-9 h-9"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.totalPages}
                    >
                      Next
                      <svg className="h-4 w-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[calc(100vh-4rem)]">
        <div className="bg-gradient-to-b from-muted/50 to-background border-b">
          <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
            <div className="text-center mb-8">
              <Skeleton className="h-12 w-96 mx-auto mb-3" />
              <Skeleton className="h-6 w-64 mx-auto" />
            </div>
            <div className="max-w-2xl mx-auto">
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
