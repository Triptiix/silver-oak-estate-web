export type ProductionPreflightProfile =
  | "core"
  | "booking-test"
  | "email"
  | "production-assisted"
  | "production-live";

export type ProductionPreflightTarget =
  | "staging"
  | "assisted-production"
  | "production";

export type ProductionPreflightFinding = {
  field: string;
  message: string;
};

export type ProductionPreflightResult = {
  profile: ProductionPreflightProfile;
  ready: boolean;
  blockers: ProductionPreflightFinding[];
  warnings: ProductionPreflightFinding[];
  checkedFields: number;
};

export function evaluateProductionReadiness(
  environment: Record<string, string | undefined>,
  options?: {
    profile?: ProductionPreflightProfile;
    target?: ProductionPreflightTarget;
  },
): ProductionPreflightResult;

export function formatProductionReadinessReport(
  result: ProductionPreflightResult,
): string;
