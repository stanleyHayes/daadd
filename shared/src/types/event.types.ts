import { DeviceType } from './analytics.types';

export enum EventType {
  IMPRESSION = 'IMPRESSION',
  VIEWABLE_IMPRESSION = 'VIEWABLE_IMPRESSION',
  CLICK = 'CLICK',
  CONVERSION = 'CONVERSION',
  SHARE = 'SHARE',
  REWARD_CLAIM = 'REWARD_CLAIM',
  AD_VIEW = 'AD_VIEW',
  AD_DISMISS = 'AD_DISMISS',
}

export interface GeoLocation {
  lat: number;
  lng: number;
  city: string;
  country: string;
}

export interface AdEvent {
  id: string;
  event_type: EventType;
  campaign_id: string;
  ad_id: string;
  user_id: string;
  device_type: DeviceType;
  device_id: string;
  ip_address: string;
  geo: GeoLocation;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface CrossDeviceEvent extends AdEvent {
  unified_user_id: string;
  device_path: string[];
}
