import 'reflect-metadata';
import HttpClient from '/opt/nodejs/httpClient';
import { Handler } from 'aws-lambda';
import { BaseResponse } from 'src/dto/oona.base.response.dto';
import { createLogger } from '/opt/nodejs/loggerUtil';

import { httpMethodEnum } from 'src/enum/http-method.enum';
import { CommonRestCallDto } from 'src/dto/common-rest-call.dto';
import { DecryptRequestDto } from 'src/dto/request/decrypt-request.dto';
import { ApiRequestPayload } from 'src/dto/common-api-request-payload.dto';
import { QuickQuoteRequestDto } from 'src/dto/request/quick-quote-request.dto';
import { FullQuoteRequestDto } from 'src/dto/request/full-quote-request.dto';
import { SyncPaymentRequestDto } from 'src/dto/request/sync-payment-request.dto';
import { SyncPolicyRequestDto } from 'src/dto/request/sync-policy-request.dto';
import { createEventFn } from 'src/service/event-bridge-common.service';
import { restApiCallFn, } from 'src/service/kahoona-common.service';
import * as dotenv from "dotenv";
dotenv.config();

const logger = createLogger();

interface KahoonaApiDetails {
    API_ROOT_URL: string | undefined,
    AUTH_USERNAME: string | undefined,
    AUTH_PASSWORD: string | undefined,
}

const KAHOONA_SSM_PARAMETER_PATH = process.env.KAHOONA_SSM_PARAMETER_PATH;
// const KAHOONA_BASE_URL = process.env.KAHOONA_BASE_URL;

const URL_PATH_CONSTANTS = {
    DECRYPT_SVC_CONTEXT_PATH: process.env.DECRYPT_SVC_CONTEXT_PATH,
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

const apiCallInitialization = async () => {
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

export const decryptHandler: Handler = async (event) => {
    let apiCallResponse;
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const decryptRequest = new DecryptRequestDto();
        decryptRequest.encryptedData = event.body?.apiReaquest?.encryptedData;

        const apiRequestPayload: ApiRequestPayload = event.body;
        // const apiRequestPayload = await createApiRequestPayload(
        //     event.body?.request_id,
        //     event.body?.correlation_id,
        //     event.body?.portal,
        //     decryptRequest);
        // logger.info(`request payload : ${apiRequestPayload}`);
        // console.log(`request payload : ${apiRequestPayload}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.requestPayload = apiRequestPayload;
        commonRestCallDto.method = httpMethodEnum.POST;
        const decryptEndpoint = URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = decryptEndpoint;
        apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        return apiCallResponse;
    } catch (err) {
        logger.info(`Error ${err}`);
        const apiCallResponse = await responseBodyFormat(500, "Internal Server Error");
        return apiCallResponse;
    }
}

export const quickQuoteHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const quickQuoteRequest: QuickQuoteRequestDto = JSON.parse(event.body);
        logger.info(`quickQuoteRequest : ${JSON.stringify(quickQuoteRequest)}`);
        // const otherData: QuoteDetailsOtherData = {
        //     deepLinkStage: "deepLinkStage",
        //     isInsuredSmoker: false,
        //     questionAnswers: [],

        // }
        // quickQuoteRequest.otherData = otherData;
        //fill in request payload here

        const apiRequestPayload = await createApiRequestPayload(
            event.body.request_id,
            event.body.correlation_id,
            event.body.portal,
            quickQuoteRequest);
        logger.info(`request payload : ${JSON.stringify(apiRequestPayload)}`);

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.requestPayload = apiRequestPayload;
        commonRestCallDto.method = httpMethodEnum.POST;
        const quickQuoteEndpoint = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_ENDPOINT : "";
        // const baseUrl = URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.QUICK_QUOTE_SVC_CONTEXT_PATH : "" + URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT ? URL_PATH_CONSTANTS.DECRYPT_SVC_ENDPOINT : "";
        commonRestCallDto.endpointUrl = quickQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        // return apiCallResponse;
        // const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        let eventBridgeResponse;
        if (apiCallResponse.statusCode == 201) {
            const eventBridgeBody = {
                journeyId: quickQuoteRequest.sdRefId,
            }
            eventBridgeResponse = await createEventFn(eventBridgeBody)
        }

        // //TODO check both response from rest API and eventbridge.
        // //TODO combine the response
        return eventBridgeResponse;
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
        commonRestCallDto.endpointUrl = fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        return apiCallResponse;
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
        commonRestCallDto.endpointUrl = fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        return apiCallResponse;
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
        commonRestCallDto.endpointUrl = fullQuoteEndpoint;

        const apiCallResponse = await restApiCallFn(kahoonaHttpClient, commonRestCallDto);
        return apiCallResponse;
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

async function responseBodyFormat(statusCode: number, result: any) {
    const responseBody = {} as BaseResponse;
    responseBody.statusCode = statusCode;
    responseBody.body = result;
    logger.info(`Function Response-- > `, { RESPONSE: responseBody });
    return responseBody;
}

