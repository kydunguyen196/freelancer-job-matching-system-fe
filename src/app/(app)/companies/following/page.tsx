"use client";

import { useQuery } from "@tanstack/react-query";

import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { listFollowedCompanies } from "@/lib/api";
import { formatDateTime } from "@/lib/format";
import { ApiError } from "@/lib/http/api-error";

export default function FollowedCompaniesPage() {
  const followedCompaniesQuery = useQuery({
    queryKey: ["followed-companies"],
    queryFn: () => listFollowedCompanies({ page: 0, size: 50 }),
  });

  const companies = followedCompaniesQuery.data?.items ?? [];

  return (
    <RoleGuard allow={["FREELANCER"]}>
      <div className="space-y-4">
        <Card className="border-slate-200 bg-white/95">
          <h1 className="font-display text-2xl font-semibold tracking-tight">Followed Companies</h1>
          <p className="mt-1 text-sm text-slate-600">
            Keep track of companies you follow and monitor new openings from them.
          </p>
        </Card>

        {followedCompaniesQuery.isError ? (
          <ErrorState
            message={
              followedCompaniesQuery.error instanceof ApiError
                ? followedCompaniesQuery.error.message
                : "Could not load followed companies."
            }
            onRetry={() => void followedCompaniesQuery.refetch()}
          />
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {companies.map((company) => (
            <Card key={`${company.clientId}-${company.companyName}`} className="border-slate-200 bg-white/95 p-4">
              <h2 className="text-base font-semibold">{company.companyName || `Client #${company.clientId}`}</h2>
              <div className="mt-2 flex items-center gap-2">
                <Badge>Client #{company.clientId}</Badge>
              </div>
              <p className="mt-2 text-xs text-slate-500">Followed at {formatDateTime(company.followedAt)}</p>
            </Card>
          ))}
        </div>

        {!companies.length && !followedCompaniesQuery.isLoading ? (
          <EmptyState
            title="No followed companies yet"
            description="Follow a company from a job detail page to build your company watchlist."
          />
        ) : null}
      </div>
    </RoleGuard>
  );
}
