export type SavingsCategory =
  | 'driver_education'
  | 'good_student'
  | 'student_away'
  | 'low_mileage'
  | 'vehicle_assignment'
  | 'telematics'
  | 'multi_vehicle'
  | 'bundle'
  | 'deductible'
  | 'reshop';

export type SavingsStatus =
  | 'detected'
  | 'evidence_needed'
  | 'comparison_ready'
  | 'quoted'
  | 'accepted'
  | 'dismissed'
  | 'verified';

export type SavingsConfidence =
  | 'verified'
  | 'carrier_supported'
  | 'authoritative_rule'
  | 'estimated'
  | 'unknown';

export type SavingsSource = 'carrier' | 'regulator' | 'quote' | 'filed_rule' | 'household' | 'estimate';

export type SavingsEvidence = {
  id: string;
  kind: string;
  status: 'missing' | 'present' | 'verified';
  source?: string;
  verifiedAt?: string;
};

export type SavingsOpportunity = {
  id: string;
  householdId: string;
  category: SavingsCategory;
  status: SavingsStatus;
  reason: string;
  evidenceRequired: string[];
  evidencePresent: string[];
  nextAction: string;
  confidence: SavingsConfidence;
  source: SavingsSource;
  estimatedSavings?: {
    min?: number;
    max?: number;
    annualized: boolean;
    source: SavingsSource;
  };
  createdAt: string;
  updatedAt: string;
};

export type PolicyBaseline = {
  householdId: string;
  carrierName?: string;
  annualPremium?: number;
  renewalDate?: string;
  coverageFingerprint?: string;
  deductible?: number;
  drivers: number;
  vehicles: number;
  currentDiscounts: string[];
  source: 'document' | 'carrier' | 'manual';
  capturedAt: string;
};

export type SavingsFacts = {
  householdId: string;
  now: string;
  policy?: PolicyBaseline;
  driverEducationVerified: boolean;
  goodStudentEvidenceVerified: boolean;
  collegeAwayFromHome: boolean;
  annualMileage?: number;
  telematicsOptIn?: boolean;
  vehicleAssignmentKnown: boolean;
  householdVehicleCount: number;
  homePolicyKnown: boolean;
};

export type SavingsAction =
  | 'collect_policy_baseline'
  | 'collect_driver_education_evidence'
  | 'collect_good_student_evidence'
  | 'compare_vehicle_assignment'
  | 'compare_low_mileage_programs'
  | 'compare_telematics_programs'
  | 'compare_bundle_options'
  | 'compare_marketplace_quotes'
  | 'review_student_away_programs'
  | 'review_renewal';

export type SavingsDecision = {
  action: SavingsAction;
  reason: string;
  opportunityId?: string;
  requiresParent: boolean;
  requiresConsent: boolean;
  handoff?: 'COVER' | 'PERKS' | 'STACKS' | 'RYDES';
};
