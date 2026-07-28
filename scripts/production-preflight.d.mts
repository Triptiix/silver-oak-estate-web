export type ProductionPreflightTarget = "staging" | "production";

export type ProductionPreflightFinding = {
  field: string;
  message: string;
};

export type ProductionPreflightResult = {
  target: ProductionPreflightTarget;
  ready: boolean;
  blockers: ProductionPreflightFinding[];
  warnings: ProductionPreflightFinding[];
  checkedFields: number;
};

export function evaluateProductionReadiness(
  environment: Record<string, string | undefined>,
  options?: { target?: ProductionPreflightTarget },
): ProductionPreflightResult;

export function formatProductionReadinessReport(
  result: ProductionPreflightResult,
): string;
