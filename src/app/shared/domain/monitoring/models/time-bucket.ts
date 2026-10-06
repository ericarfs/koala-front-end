export const TIME_BUCKETS = [
  '30 seconds',
  '1 minute',
  '5 minutes',
  '15 minutes',
  '30 minutes',
  '1 hour',
  '2 hours',
] as const;

export type TimeBucket = (typeof TIME_BUCKETS)[number];

export const DEFAULT_TIME_BUCKET: TimeBucket = '5 minutes';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

export const TIME_BUCKET_MS: Record<TimeBucket, number> = {
  '30 seconds': 30 * SECOND,
  '1 minute': MINUTE,
  '5 minutes': 5 * MINUTE,
  '15 minutes': 15 * MINUTE,
  '30 minutes': 30 * MINUTE,
  '1 hour': HOUR,
  '2 hours': 2 * HOUR,
};

const TIME_BUCKET_LABELS: Record<TimeBucket, string> = {
  '30 seconds': '30s',
  '1 minute': '1min',
  '5 minutes': '5min',
  '15 minutes': '15min',
  '30 minutes': '30min',
  '1 hour': '1h',
  '2 hours': '2h',
};

export const TIME_BUCKET_OPTIONS = TIME_BUCKETS.map(id => ({ id, text: TIME_BUCKET_LABELS[id] }));
