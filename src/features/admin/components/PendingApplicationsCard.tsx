import { ClipboardList } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface PendingApplicationsCardProps {
  count: number;
  loading: boolean;
  error: Error | null;
  onReview: () => void;
}

export function PendingApplicationsCard({ count, loading, error, onReview }: PendingApplicationsCardProps) {
  return (
    <Card className="border-amber-200">
      <CardContent className="p-6 flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">Pending Applications</p>
          {loading ? <Skeleton className="h-8 w-12" /> : <p className="text-2xl font-bold">{count}</p>}
          <p className="text-xs text-gray-500">
            {error ? "Count unavailable" : count === 1 ? "1 application needs review" : `${count} applications need review`}
          </p>
          <Button variant="outline" size="sm" onClick={onReview}>
            Review applications
          </Button>
        </div>
        <ClipboardList className="h-8 w-8 text-amber-600" aria-hidden="true" />
      </CardContent>
    </Card>
  );
}
