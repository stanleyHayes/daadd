export enum AnomalyType {
  LOW_CTR = 'LOW_CTR',
  CTR_SPIKE = 'CTR_SPIKE',
  TRAFFIC_SPIKE = 'TRAFFIC_SPIKE',
  BOT_DETECTED = 'BOT_DETECTED',
}

export enum AnomalySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface Anomaly {
  id: string;
  campaign_id: string;
  type: AnomalyType;
  severity: AnomalySeverity;
  detected_at: Date;
  metric_value: number;
  threshold_value: number;
  description: string;
  auto_action_taken: boolean;
  resolved: boolean;
}

export interface AnomalyThresholds {
  min_ctr: number;
  max_ctr_spike: number;
  traffic_spike_pct: number;
}
