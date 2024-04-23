import { AdditionalBenefit } from "./additional-benefit.model";
import { Insured } from "./insured.model";
import { Workflow } from "./workflow.model";

export interface QuoteDetails {
    sumInsured: number;
    additionalBenefits: [AdditionalBenefit];
    additionalBenefitPremium: number;
    premium: number;
    planCode: string;
    planName: string;
    discountPercent: number;
    discountAmount: string;
    workflow: Workflow;
    duePremium: number;
    grossPremium: string;
    promoCode: string;
    citizenshipType: string;
    insured: Insured;
    printOption: number;
    addressForHardCopy: string;
    proposalNumber: string
}
