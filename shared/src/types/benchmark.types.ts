export interface BenchmarkMetrics {
  industry_avg_ctr: number;
  industry_avg_cpa: number;
  your_ctr: number;
  your_cpa: number;
  format_performance: Record<string, number>;
  device_trends: Record<string, number>;
}

export interface BenchmarkComparison {
  metric_name: string;
  your_value: number;
  industry_avg: number;
  difference: number;
  percentile: number;
}
