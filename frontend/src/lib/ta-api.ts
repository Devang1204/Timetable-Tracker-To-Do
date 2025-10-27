// TA Availability API calls matching backend routes

import { get, post, del } from './api';
import { getAuthToken } from './auth';

// TA availability endpoints
const TA_ENDPOINTS = {
  AVAILABILITY: '/api/ta/availability',
  AVAILABILITY_SLOT: (id: number) => `/api/ta/availability/${id}`,
};

export interface AvailabilitySlot {
  id?: number;
  day_of_week: string; // e.g., "Monday", "Tuesday"
  start_time: string;
  end_time: string;
  reason?: string;
}

/**
 * Get TA unavailable times
 */
export async function getAvailability(): Promise<AvailabilitySlot[]> {
  const token = getAuthToken();
  return get<AvailabilitySlot[]>(TA_ENDPOINTS.AVAILABILITY, token || undefined);
}

/**
 * Add unavailable time slot
 */
export async function addAvailabilitySlot(slotData: {
  day_of_week: string;
  start_time: string;
  end_time: string;
  reason?: string;
}): Promise<AvailabilitySlot> {
  const token = getAuthToken();
  return post<AvailabilitySlot>(TA_ENDPOINTS.AVAILABILITY, slotData, token || undefined);
}

/**
 * Delete unavailable time slot
 */
export async function deleteAvailabilitySlot(id: number): Promise<void> {
  const token = getAuthToken();
  return del<void>(TA_ENDPOINTS.AVAILABILITY_SLOT(id), token || undefined);
}
