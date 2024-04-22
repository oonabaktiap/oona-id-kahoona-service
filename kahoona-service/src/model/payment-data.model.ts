export interface PaymentData {
    transIDMerchant: string,
    sessionId: string,
    status: string,
    amount: number,
    paymentChannel: string,
    bank: string,
    paymentDateTime: string,
    payLaterDueDate: string
}