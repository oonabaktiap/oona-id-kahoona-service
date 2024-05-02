import * as dotenv from "dotenv";

import { CommonRestCallDto } from "src/dto/common-rest-call.dto";
import { httpMethodEnum } from "src/enum/http-method.enum";
import { restApiCallFn } from "src/service/kahoona-common.service";
import HttpClient from "/opt/nodejs/httpClient";
import { createLogger } from "/opt/nodejs/loggerUtil";
import { BaseResponse } from "src/dto/oona.base.response.dto";
import { ApiRequestPayload } from "src/dto/common-api-request-payload.dto";
import { loggingAspectClass } from "/opt/nodejs/loggingAspect";
import {getListOfParameterStoreService} from '/opt/nodejs/parameter-store';
import { createEventFn } from "src/service/event-bridge-common.service";
import { QuickQuoteRequestDto } from "src/dto/request/quick-quote-request.dto";

dotenv.config();
const logger = createLogger();
interface KahoonaApiDetails {
    API_ROOT_URL: string | undefined,
    AUTH_USERNAME: string | undefined,
    AUTH_PASSWORD: string | undefined,
}

const KAHOONA_SSM_PARAMETER_PATH = process.env.KAHOONA_SSM_PARAMETER_PATH;

const URL_PATH_CONSTANTS = {
    KAHOONA_BASE_URL: process.env.KAHOONA_BASE_URL,

    DECRYPT_SVC_ENDPOINT: process.env.DECRYPT_SVC_ENDPOINT,
    QUICK_QUOTE_SVC_ENDPOINT: process.env.QUICK_QUOTE_SVC_ENDPOINT,
    FULL_QUOTE_SVC_ENDPOINT: process.env.FULL_QUOTE_SVC_ENDPOINT,
    SYNC_PAYMENT_SVC_ENDPOINT: process.env.SYNC_PAYMENT_SVC_ENDPOINT,
    SYNC_POLICY_SVC_ENDPOINT: process.env.SYNC_POLICY_SVC_ENDPOINT,

}
const STATUS_SUCCESS = "Success";
const STATUS_FAILURE = "Failure";

let kahoonaHttpClient: HttpClient;

let cachedKahoonaApiDetails: KahoonaApiDetails;

class KahoonaService {
    apiCallInitialization = async () => {
        try {
            // Make an API call during initialization
            if (!cachedKahoonaApiDetails) {
                // const parameterResult = await getListOfParameterStoreService(KAHOONA_SSM_PARAMETER_PATH);
                // logger.info(`cachedParameterValue --> `, { cachedParameterValue: parameterResult });
                cachedKahoonaApiDetails = {} as KahoonaApiDetails;
                cachedKahoonaApiDetails.API_ROOT_URL = URL_PATH_CONSTANTS.KAHOONA_BASE_URL || '';
                // cachedKahoonaApiDetails.AUTH_USERNAME = parameterResult?.AUTH_USERNAME || '';
                // cachedKahoonaApiDetails.AUTH_PASSWORD = parameterResult?.AUTH_PASSWORD || '';


                kahoonaHttpClient = new HttpClient(cachedKahoonaApiDetails?.API_ROOT_URL);
            }
        } catch (error) {
            logger.info(`Error during API call initialization: ${error}`);
            throw new Error('Internal Server Error SSM Store Fetching Failed');
        }
    };

    /**
     *
     * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
     * @param {Object} event - API Gateway Lambda Proxy Input Format
     *
     * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
     * @returns {Object} object - API Gateway Lambda Proxy Output Format
     *
     */
    @loggingAspectClass
    async decrypt(event: any): Promise<BaseResponse> {
        let apiCallResponse;
        try {
            logger.info("Request Event ", event);
            if (!cachedKahoonaApiDetails) {
                await this.apiCallInitialization();
            }
            const apiRequestPayload: ApiRequestPayload = new ApiRequestPayload();
            await this.assignAnyToObject(apiRequestPayload, event.body);
            logger.info(`apiRequestPayload : ${JSON.stringify(apiRequestPayload)}`)
            logger.info(`apiRequestPayload.requestId : ${apiRequestPayload.requestId}`)


            const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
            commonRestCallDto.requestPayload = apiRequestPayload;
            commonRestCallDto.method = httpMethodEnum.POST;
            const decryptEndpoint = URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
            commonRestCallDto.endpointUrl = decryptEndpoint;
            apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
            logger.info(`apiCallResponse : ${JSON.stringify(apiCallResponse)}`)
            return apiCallResponse;
        } catch (err) {
            logger.info(`Error ${err}`);
            const apiCallResponse = await this.responseBodyFormat(500, "Internal Server Error");
            return apiCallResponse;
        }
    }

    private async assignAnyToObject(destination: any, source: any) {
        try {
            Object.assign(destination, JSON.parse(source));
        } catch {
            Object.assign(destination, JSON.parse(JSON.stringify(source)));
        }
    }

    @loggingAspectClass
    async syncQuickQuote(event: any) {
        try {
            logger.info("Request Event ", event);
            if (!cachedKahoonaApiDetails) {
                await this.apiCallInitialization();
            }
            const apiRequestPayload: ApiRequestPayload = new ApiRequestPayload();
            await this.assignAnyToObject(apiRequestPayload, event.detail.body);
            const quickQuoteRequest: QuickQuoteRequestDto = new QuickQuoteRequestDto();
            await this.assignAnyToObject(quickQuoteRequest, apiRequestPayload.apiRequest);

            const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
            commonRestCallDto.requestPayload = apiRequestPayload;
            commonRestCallDto.method = httpMethodEnum.POST;
            const quickQuoteEndpoint = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT : "";
            commonRestCallDto.endpointUrl = quickQuoteEndpoint;

            const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
            logger.info(`apiCallResponse : ${JSON.stringify(apiCallResponse)}`)
            let eventBridgeResponse;
            if (apiCallResponse.statusCode && apiCallResponse.statusCode >= 200) {
                const eventBridgeBody = {
                    journeyId: quickQuoteRequest.sdRefId,
                }
                eventBridgeResponse = await createEventFn(eventBridgeBody)
            }
            logger.info(`eventBridgeResponse : ${JSON.stringify(eventBridgeResponse)}`)
            return eventBridgeResponse;
        } catch (err) {
            logger.info(`Error ${err}`);
            const response = await this.responseBodyFormat(500, "Internal Server Error");
            return response;
        }
    }

    @loggingAspectClass
    async syncFullQuote(event: any) {
        let apiCallResponse;
        try {
            logger.info("Request Event ", event);
            if (!cachedKahoonaApiDetails) {
                await this.apiCallInitialization();
            }
            const apiRequestPayload: ApiRequestPayload = new ApiRequestPayload();
            await this.assignAnyToObject(apiRequestPayload, event.detail.body);

            const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
            commonRestCallDto.requestPayload = apiRequestPayload;
            commonRestCallDto.method = httpMethodEnum.POST;
            const fullQuoteEndpoint = URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT : "";
            commonRestCallDto.endpointUrl = fullQuoteEndpoint;
            apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
            logger.info(`apiCallResponse : ${JSON.stringify(apiCallResponse)}`)
            return apiCallResponse;
        } catch (err) {
            logger.info(`Error ${err}`);
            const apiCallResponse = await this.responseBodyFormat(500, "Internal Server Error");
            return apiCallResponse;
        }
    }

    @loggingAspectClass
    async syncPayment(event: any) {

        let apiCallResponse;
        try {
            logger.info("Request Event ", event);
            if (!cachedKahoonaApiDetails) {
                await this.apiCallInitialization();
            }
            const apiRequestPayload: ApiRequestPayload = new ApiRequestPayload();
            await this.assignAnyToObject(apiRequestPayload, event.body);

            const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
            commonRestCallDto.requestPayload = apiRequestPayload;
            commonRestCallDto.method = httpMethodEnum.POST;
            const syncPaymentEndpoint = URL_PATH_CONSTANTS.SYNC_PAYMENT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.SYNC_PAYMENT_SVC_ENDPOINT : "";
            commonRestCallDto.endpointUrl = syncPaymentEndpoint;
            apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
            logger.info(`apiCallResponse : ${JSON.stringify(apiCallResponse)}`)
            return apiCallResponse;
        } catch (err) {
            logger.info(`Error ${err}`);
            const apiCallResponse = await this.responseBodyFormat(500, "Internal Server Error");
            return apiCallResponse;
        }
    }

    @loggingAspectClass
    async syncPolicy(event: any) {
        let apiCallResponse;
        try {
            logger.info("Request Event ", event);
            if (!cachedKahoonaApiDetails) {
                await this.apiCallInitialization();
            }
            const apiRequestPayload: ApiRequestPayload = new ApiRequestPayload();
            await this.assignAnyToObject(apiRequestPayload, event.detail.body);

            const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
            commonRestCallDto.requestPayload = apiRequestPayload;
            commonRestCallDto.method = httpMethodEnum.POST;
            const syncPolicyEndpoint = URL_PATH_CONSTANTS.SYNC_POLICY_SVC_ENDPOINT ? URL_PATH_CONSTANTS.SYNC_POLICY_SVC_ENDPOINT : "";
            commonRestCallDto.endpointUrl = syncPolicyEndpoint;
            apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
            logger.info(`apiCallResponse : ${JSON.stringify(apiCallResponse)}`)
            return apiCallResponse;
        } catch (err) {
            logger.info(`Error ${err}`);
            const apiCallResponse = await this.responseBodyFormat(500, "Internal Server Error");
            return apiCallResponse;
        }
    }

    private async responseBodyFormat(statusCode: number, result: any) {
        const responseBody = {} as BaseResponse;
        responseBody.statusCode = statusCode;
        responseBody.body = result;
        logger.info(`Function Response-- > `, { RESPONSE: responseBody });
        return responseBody;
    }

}
export default KahoonaService;