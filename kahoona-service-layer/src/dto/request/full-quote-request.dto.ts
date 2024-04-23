import { QuoteDetailsOtherData } from "src/model/quote-details-other-data.model";
import { QuoteDetails } from "src/model/quote-details.model";
import { Quote } from "src/model/quote.model";

export class FullQuoteRequestDto implements Quote {
    sdRefId: string;
    type: string;
    quoteDetails: QuoteDetails;
    otherData: QuoteDetailsOtherData;
}