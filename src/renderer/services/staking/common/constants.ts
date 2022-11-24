const PARACHAINS_ENABLED = false;

export const IGNORED_COMMISSION_THRESHOLD = 1;

export const MINIMUM_INFLATION = 0.025;
export const INFLATION_IDEAL = PARACHAINS_ENABLED ? 0.2 : 0.1;
export const STAKED_PORTION_IDEAL = PARACHAINS_ENABLED ? 0.5 : 0.75;
export const INTEREST_IDEAL = INFLATION_IDEAL / STAKED_PORTION_IDEAL;

export const DECAY_RATE = 0.05;
export const DAYS_IN_YEAR = 365;
