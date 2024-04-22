import { QuoteDetails } from "src/model/quote-details.model";
import { QuoteDetailsOtherData } from "src/model/quote-details-other-data.model";

export interface Quote {
    // v1
    // sdRefId: string;
    // quoteDetails: {
    //     citizenshipType: string;
    //     insured: {
    //         type: string;
    //         value: string;
    //         name: string;
    //         dob: string;
    //         mobileNo: string;
    //         email: string
    //     };
    //     printOption: number;
    //     addressForHardCopy: string;
    //     proposalNumber: string;
    //     _id: string
    // };
    // otherData: {
    //     deepLinkStage: string
    // }
    sdRefId: string;
    type: string;
    quoteDetails: QuoteDetails;
    otherData: QuoteDetailsOtherData;
}