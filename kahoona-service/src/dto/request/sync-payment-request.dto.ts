import { PaymentData } from "src/model/payment-data.model";

export class SyncPaymentRequestDto {
    sdRefId: string;
    paymentData: PaymentData;
}