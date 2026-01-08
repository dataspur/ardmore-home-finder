import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Clock, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  totalRevenue: number;
  pendingRent: number;
  activeLeases: number;
}

interface MonthlyPayment {
  month: string;
  amount: number;
}

const formatCurrency = (cents: number) =>
  (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [chartData, setChartData] = useState<MonthlyPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch payments for total revenue
      const { data: payments } = await supabase
        .from("payments")
        .select("amount_cents, status, created_at");

      // Fetch leases for stats
      const { data: leases } = await supabase
        .from("leases")
        .select("rent_amount_cents, status");

      const paidPayments = payments?.filter((p) => p.status === "paid") || [];
      const totalRevenue = paidPayments.reduce((sum, p) => sum + p.amount_cents, 0);

      const activeLeases = leases?.filter((l) => l.status === "active") || [];
      const pendingRent = activeLeases.reduce((sum, l) => sum + l.rent_amount_cents, 0);

      setStats({
        totalRevenue,
        pendingRent,
        activeLeases: activeLeases.length,
      });

      // Group payments by month for chart
      const monthlyData: Record<string, number> = {};
      paidPayments.forEach((p) => {
        const date = new Date(p.created_at || "");
        const monthKey = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + p.amount_cents / 100;
      });

      const chartArray = Object.entries(monthlyData).map(([month, amount]) => ({
        month,
        amount,
      }));

      setChartData(chartArray);
      setIsLoading(false);
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-80" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard Overview</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(stats?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Rent
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              {formatCurrency(stats?.pendingRent || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Active leases</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Leases
            </CardTitle>
            <FileText className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeLeases || 0}</div>
            <p className="text-xs text-muted-foreground">Current tenants</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payments by Month</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis tickFormatter={(v) => `$${v}`} className="text-xs" />
                <Tooltip
                  formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  contentStyle={{ background: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              No payment data yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
