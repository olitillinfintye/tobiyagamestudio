import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";

interface TotalVisitsCardProps {
  totalVisits: number;
  isLoading?: boolean;
}

export default function TotalVisitsCard({ totalVisits, isLoading }: TotalVisitsCardProps) {
  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 bg-muted rounded w-24"></div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded w-16"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
        <Eye className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{totalVisits.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </CardContent>
    </Card>
  );
}
