import type { ShipmentRecord } from "./types";

export function createManualShipment(): ShipmentRecord {
  return { provider: "MANUAL", status: "NOT_CREATED" };
}

export function calculateManualShipping(): number {
  return 0;
}
