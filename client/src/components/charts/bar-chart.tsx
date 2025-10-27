import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface BarChartProps {
  data: Array<Record<string, any>>;
  dataKey: string;
  nameKey: string;
  color?: string;
}

export function SimpleBarChart({ data, dataKey, nameKey, color = "#3b82f6" }: BarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={nameKey} />
        <YAxis />
        <Tooltip />
        <Bar dataKey={dataKey} fill={color} />
      </BarChart>
    </ResponsiveContainer>
  );
}