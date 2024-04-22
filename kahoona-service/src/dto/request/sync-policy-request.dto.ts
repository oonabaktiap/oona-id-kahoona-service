import { PolicyData } from "src/model/policy-data.model"

export class SyncPolicyRequestDto {
    sdRefId: string;
    policyData: PolicyData;
    otherData: any;
}