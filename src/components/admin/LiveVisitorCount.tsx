import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

export default function LiveVisitorCount() {
  const [liveCount, setLiveCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Simulate live visitor count with random updates
    // In production, this would connect to a real analytics service
    const updateCount = () => {
      // Generate realistic visitor count (between 1-50 active users)
      const baseCount = Math.floor(Math.random() * 15) + 1;
      setLiveCount(baseCount);
      setIsConnected(true);
    };

    updateCount();
    const interval = setInterval(updateCount, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-2 right-2">
        <span className={`flex h-3 w-3 ${isConnected ? '' : 'opacity-50'}`}>
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
        </span>
      </div>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Live Visitors</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-primary">{liveCount}</div>
        <p className="text-xs text-muted-foreground">Currently on site</p>
      </CardContent>
    </Card>
  );
}
