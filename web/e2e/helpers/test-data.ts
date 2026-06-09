/** Reads the seeded test data written by global-setup.ts */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface TestData {
  listingId: string;
  offerId: string;
  sellerToken: string;
  buyerToken: string;
}

let _cache: TestData | null = null;

export function getTestData(): TestData {
  if (_cache) return _cache;
  const path = join(__dirname, '..', '.test-data.json');
  const raw = readFileSync(path, 'utf8');
  _cache = JSON.parse(raw) as TestData;
  return _cache;
}
