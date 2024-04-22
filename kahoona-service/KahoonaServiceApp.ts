import 'reflect-metadata';
import HttpClient from '/opt/nodejs/httpClient';
import { Handler } from 'aws-lambda';
import { BaseResponse } from 'src/dto/oona.base.response.dto';
import { createLogger } from '/opt/nodejs/loggerUtil';
import { getListOfParameterStoreService } from '/opt/nodejs/parameter-store';
import { httpMethodEnum } from 'src/enum/http-method.enum';
import { CommonRestCallDto } from 'src/dto/common-rest-call.dto';
import { DecryptRequestDto } from 'src/dto/request/decrypt-request.dto';
import { ApiRequestPayload } from 'src/dto/common-api-request-payload.dto';
import { QuickQuoteRequestDto } from 'src/dto/request/quick-quote-request.dto';
import { FullQuoteRequestDto } from 'src/dto/request/full-quote-request.dto';
import { SyncPaymentRequestDto } from 'src/dto/request/sync-payment-request.dto';
import { SyncPolicyRequestDto } from 'src/dto/request/sync-policy-request.dto';
import { createEventFn } from 'src/service/event-bridge-common.service';
import { getApiCallFn, restApiCallFn } from 'src/service/kahoona-common.service';
import { QuoteDetailsOtherData } from 'src/model/quote-details-other-data.model';
import { QuoteDetails } from 'src/model/quote-details.model';
import { Endpoint } from 'aws-sdk';


const logger = createLogger();

interface KahoonaApiDetails {
    API_ROOT_URL: string | undefined,
    AUTH_USERNAME: string | undefined,
    AUTH_PASSWORD: string | undefined,
}

const KAHOONA_SSM_PARAMETER_PATH = process.env.KAHOONA_SSM_PARAMETER_PATH;
const KAHOONA_BASE_URL = process.env.KAHOONA_BASE_URL;

const URL_PATH_CONSTANTS = {
    DECRYPT_SVC_CONTEXT_PATH: process.env.DECRYPT_SVC_CONTEXT_PATH,

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

const apiCallInitialization = async () => {
    try {
        // Make an API call during initialization
        if (!cachedKahoonaApiDetails) {
            const parameterResult = await getListOfParameterStoreService(KAHOONA_SSM_PARAMETER_PATH);
            logger.info(`cachedParameterValue --> `, { cachedParameterValue: parameterResult });
            cachedKahoonaApiDetails = {} as KahoonaApiDetails;
            cachedKahoonaApiDetails.API_ROOT_URL = parameterResult?.API_ROOT_URL || '';
            cachedKahoonaApiDetails.AUTH_USERNAME = parameterResult?.AUTH_USERNAME || '';
            cachedKahoonaApiDetails.AUTH_PASSWORD = parameterResult?.AUTH_PASSWORD || '';

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

export const postHandler: Handler = async (event) => {
    try {
        if (event.body) {
            const eventBody = JSON.parse(event.body);
            console.log('event.body json object : ', eventBody);
            const endpointUrl = eventBody.endpointUrl;
            console.log('into decryptHandler')
            const apiCallResponse = await getApiCallFn(endpointUrl);
            if (apiCallResponse) {
                return {
                    statusCode: 200,
                    body: await apiCallResponse.json(),
                };
            }
        }
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error',
            }),
        };
    } catch (err) {
        console.log(err);
        return {
            statusCode: 500,
            body: JSON.stringify({
                message: 'Internal Server Error',
            }),
        };
    }
}
export const getHandler: Handler = async (event) => {
    try {
        // logger.info("Request Event ", event);
        // if (!cachedKahoonaApiDetails) {
        //     await apiCallInitialization();
        // }
        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.method = httpMethodEnum.GET;
        commonRestCallDto.endpointUrl = 'https://catfact.ninja/fact';
        const apiCallResponse = await getApiCallFn(commonRestCallDto.endpointUrl);
        // logger.info(`response = ${apiCallResponse}`)
        // logger.info(`response = ${apiCallResponse.json()}`)

        const response = await responseBodyFormat(apiCallResponse.status, await apiCallResponse.json());
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }



}


export const decryptHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const decryptRequest = new DecryptRequestDto();
        decryptRequest.encryptedData = event.body?.encryptedData;

        const apiRequestPayload = await createApiRequestPayload(
            event.body?.request_id,
            event.body?.correlation_id,
            event.body?.portal,
            decryptRequest);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.requestPayload = apiRequestPayload;
        commonRestCallDto.method = httpMethodEnum.POST;
        const decryptEndpoint = URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.DECRYPT_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.DECRYPT_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = KAHOONA_BASE_URL + '/' + decryptEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
}

export const quickQuoteHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const quickQuoteRequest = new QuickQuoteRequestDto();
        // const otherData: QuoteDetailsOtherData = {
        //     deepLinkStage: "deepLinkStage",
        //     isInsuredSmoker: false,
        //     questionAnswers: [],

        // }
        // quickQuoteRequest.otherData = otherData;
        //fill in request payload here

        const apiRequestPayload = await createApiRequestPayload(
            event.body?.request_id,
            event.body?.correlation_id,
            event.body?.portal,
            quickQuoteRequest);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.requestPayload = apiRequestPayload;
        commonRestCallDto.method = httpMethodEnum.POST;
        const quickQuoteEndpoint = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = KAHOONA_BASE_URL + '/' + quickQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);

        const eventBridgeBody = {
            key: "value",
        }
        const eventBridgeResponse = await createEventFn(eventBridgeBody)

        //TODO check both response from rest API and eventbridge.
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
}

export const fullQuoteHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const fullQuoteRequestDto = new FullQuoteRequestDto();
        //fill in request payload here

        const apiRequestPayload = await createApiRequestPayload(
            event.body?.request_id,
            event.body?.correlation_id,
            event.body?.portal,
            fullQuoteRequestDto);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.method = httpMethodEnum.POST;
        const fullQuoteEndpoint = URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = KAHOONA_BASE_URL + '/' + fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
}

export const syncPaymentHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const syncPaymentRequestDto = new SyncPaymentRequestDto();
        //fill in request payload here

        const apiRequestPayload = await createApiRequestPayload(
            event.body?.request_id,
            event.body?.correlation_id,
            event.body?.portal,
            syncPaymentRequestDto);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.method = httpMethodEnum.POST;
        const fullQuoteEndpoint = URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = KAHOONA_BASE_URL + '/' + fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
}

export const syncPolicyHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const syncPolicyRequestDto = new SyncPolicyRequestDto();
        //fill in request payload here

        const apiRequestPayload = await createApiRequestPayload(
            event.body?.request_id,
            event.body?.correlation_id,
            event.body?.portal,
            syncPolicyRequestDto);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.method = httpMethodEnum.POST;
        const fullQuoteEndpoint = URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.FULL_QUOTE_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = KAHOONA_BASE_URL + '/' + fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
}

async function createApiRequestPayload(requestId: any, correlationId: any, portal: any, apiRequest: any) {
    const apiRequestPayload = new ApiRequestPayload();
    apiRequestPayload.requestId = requestId;
    apiRequestPayload.correlationId = correlationId;
    apiRequestPayload.portal = portal;
    apiRequestPayload.apiRequest = apiRequest;

    return apiRequestPayload;
}




// async function decryptFunc(event: APIGatewayProxyEvent) {
//     if (event.body) {
//         const requestPayload: DecryptRequestDto = JSON.parse(event.body);
//         console.log('event.body json object : ', requestPayload);
//         const response = await decrypt(requestPayload);

//         const baseResponse = new BaseResponse();
//         if (response) {
//             baseResponse.code = HttpStatusCode.Ok;
//             baseResponse.status = 'success';
//             baseResponse.data = JSON.stringify(baseResponse);
//             baseResponse.message = "decypt successful"
//         } else {
//             baseResponse.code = -1;
//             baseResponse.status = 'failed';
//             baseResponse.message = "failed calling kahoona decrypt"
//         }
//         return {
//             statusCode: 200,
//             body: JSON.stringify({
//                 baseResponse,
//             }),
//         };
//     }
//     return {
//         statusCode: 500,
//         body: JSON.stringify({
//             message: 'body not found',
//         }),
//     };
// }


async function responseBodyFormat(statusCode: number, result: any) {
    const responseBody = {} as BaseResponse;
    // if (200 === statusCode) {
    //     responseBody.status = STATUS_SUCCESS;
    // } else {
    //     responseBody.status = STATUS_FAILURE;
    // }
    responseBody.statusCode = statusCode;
    responseBody.body = result;

    logger.info(`Function Response --> `, { RESPONSE: responseBody });
    return responseBody;
}