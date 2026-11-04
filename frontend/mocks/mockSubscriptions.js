// Dev-only mock subscriptions keyed by Firebase UID. Remove once real purchases exist.
const DAY_MS = 24 * 60 * 60 * 1000;
const daysFromNow = (days) => new Date(Date.now() + days * DAY_MS).toISOString();

export const MOCK_SUBSCRIPTIONS = {
  // Active annual subscription -> Home
  HwAVGLvidDfUXY3e8uqZjnQCoMV2: {
    plan: "annual",
    status: "active",
    expiryDate: () => daysFromNow(365),
  },
  // Expired monthly subscription -> TrialOffer
  aADGNAedeiSGNMaMz2J22Kq4Qdl2: {
    plan: "monthly",
    status: "expired",
    expiryDate: () => daysFromNow(-10),
  },
  // Never purchased -> TrialOffer
  RZGArdr3UuXA5025UPJomh1OgMe2: null,
};
