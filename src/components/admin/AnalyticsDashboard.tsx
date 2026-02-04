import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Eye, Globe, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import TotalVisitsCard from "./LiveVisitorCount";

interface DailyData {
  date: string;
  value: number;
}

interface AnalyticsData {
  totalVisitors: number;
  totalPageviews: number;
  avgSessionDuration: number;
  avgBounceRate: number;
  dailyVisitors: DailyData[];
  dailyPageviews: DailyData[];
  countries: { name: string; value: number }[];
  hasData: boolean;
}

const fetchAnalytics = async (): Promise<AnalyticsData> => {
  // Get date range for last 30 days
  const endDate = new Date().toISOString().split('T')[0];
  const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'e2686310-5bee-4b70-88da-f4159d914f51';
    const response = await fetch(
      `https://lovable.dev/api/projects/${projectId}/analytics?startdate=${startDate}&enddate=${endDate}&granularity=daily`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    );
    
    if (!response.ok) {
      throw new Error('Analytics not available');
    }
    
    const data = await response.json();
    
    // Parse the response data
    const visitors = data?.visitors || { total: 0, data: [] };
    const pageviews = data?.pageviews || { total: 0, data: [] };
    const sessionDuration = data?.sessionDuration || { total: 0, data: [] };
    const bounceRate = data?.bounceRate || { total: 0, data: [] };
    const breakdown = data?.breakdown || { country: [] };
    
    // Format daily data
    const dailyVisitors = (visitors.data || []).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value || 0,
    }));
    
    const dailyPageviews = (pageviews.data || []).map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: item.value || 0,
    }));
    
    // Format country data
    const countries = (breakdown.country || []).map((item: any) => ({
      name: item.name || 'Unknown',
      value: item.value || 0,
    })).slice(0, 5);
    
    const hasData = visitors.total > 0 || pageviews.total > 0;
    
    return {
      totalVisitors: visitors.total || 0,
      totalPageviews: pageviews.total || 0,
      avgSessionDuration: sessionDuration.total || 0,
      avgBounceRate: bounceRate.total || 0,
      dailyVisitors,
      dailyPageviews,
      countries,
      hasData,
    };
  } catch (error) {
    // Return empty data state
    return {
      totalVisitors: 0,
      totalPageviews: 0,
      avgSessionDuration: 0,
      avgBounceRate: 0,
      dailyVisitors: [],
      dailyPageviews: [],
      countries: [],
      hasData: false,
    };
  }
};

export default function AnalyticsDashboard() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: fetchAnalytics,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no data
  if (!analytics?.hasData) {
    return (
      <div className="space-y-6">
        {/* Stats Cards with zero values */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <TotalVisitsCard totalVisits={0} />

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Pageviews</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Bounce Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">0%</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Single page visits</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium">Avg. Duration</CardTitle>
              <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold">0s</div>
              <p className="text-xs text-muted-foreground hidden sm:block">Session time</p>
            </CardContent>
          </Card>
        </div>

        {/* Empty State Message */}
        <Card className="p-8">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold text-lg">No Analytics Data Yet</h3>
              <p className="text-muted-foreground mt-1">
                Analytics will appear here once your published website receives visitors.
                Make sure your website is published and share the link to start tracking.
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <TotalVisitsCard totalVisits={analytics?.totalVisitors || 0} />

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Pageviews</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{analytics?.totalPageviews?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground hidden sm:block">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Bounce Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {Math.round(analytics?.avgBounceRate || 0)}%
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Single page visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium">Avg. Duration</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground hidden sm:block" />
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">
              {Math.round(analytics?.avgSessionDuration || 0)}s
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">Session time</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pageviews Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Pageviews Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.dailyPageviews && analytics.dailyPageviews.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.dailyPageviews}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      className="text-xs"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="value" 
                      name="Pageviews"
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No pageview data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Countries Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Visitors by Country</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {analytics?.countries && analytics.countries.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.countries} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      width={80}
                      tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Visitors"
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  No country data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visitors Over Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Visitors Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px]">
            {analytics?.dailyVisitors && analytics.dailyVisitors.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.dailyVisitors}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    name="Visitors"
                    stroke="hsl(var(--accent-foreground))" 
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No visitor data available
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
