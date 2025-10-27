import { useTranslation } from "@/lib/i18n";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface MessageChartProps {
  data: Array<{
    date: string;
    sent?: number;
    delivered?: number;
    read?: number;
    failed?: number;
  }>;
}

export function MessageChart({ data }: MessageChartProps) {
  const { t } = useTranslation();
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="sent"
          stroke="#3b82f6"
          strokeWidth={2}
          name={`${t("dashboard.sent")}`}
        />
        <Line
          type="monotone"
          dataKey="delivered"
          stroke="#10b981"
          strokeWidth={2}
          name={`${t("dashboard.delivered")}`}
        />
        <Line
          type="monotone"
          dataKey="read"
          stroke="#f59e0b"
          strokeWidth={2}
          name={`${t("dashboard.read")}`}
        />
        <Line
          type="monotone"
          dataKey="failed"
          stroke="#ef4444"
          strokeWidth={2}
          name={`${t("dashboard.failed")}`}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}