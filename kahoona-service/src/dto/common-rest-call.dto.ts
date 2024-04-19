import { httpMethodEnum } from "../enum/http-method.enum";
import { ApiRequestPayload } from "./common-api-request-payload.dto";

export class CommonRestCallDto {
    method!: httpMethodEnum;
    endpointUrl: string;
    requestPayload!: ApiRequestPayload;

}
