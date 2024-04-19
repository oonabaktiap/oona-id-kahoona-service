import 'reflect-metadata';
import HttpClient from '/opt/nodejs/httpClient';
import { Handler } from 'aws-lambda';
import { BaseResponse } from 'src/dto/oona.base.response.dto';
import { createLogger } from '/opt/nodejs/loggerUtil';
import { getListOfParameterStoreService } from '/opt/nodejs/parameter-store';
import { commonService } from 'src/service/kahoona-common.service';
import { httpMethodEnum } from 'src/enum/http-method.enum';
import { CommonRestCallDto } from 'src/dto/common-rest-call.dto';
import { DecryptRequestDto } from 'src/dto/decrypt.request.dto';
import { ApiRequestPayload } from 'src/dto/common-api-request-payload.dto';


const logger = createLogger();

interface KahoonaApiDetails {
    API_ROOT_URL: string | undefined,
    AUTH_USERNAME: string | undefined,
    AUTH_PASSWORD: string | undefined,
}

const KAHOONA_SSM_PARAMETER_PATH = process.env.KAHOONA_SSM_PARAMETER_PATH;

const URL_PATH_CONSTANTS = {
    DECRYPT_SVC_CONTEXT_PATH: process.env.DECRYPT_SVC_CONTEXT_PATH,
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


export const decryptHandler: Handler = async (event) => {
    try {
        logger.info("Request Event ", event);
        if (!cachedKahoonaApiDetails) {
            await apiCallInitialization();
        }
        const decryptRequest = new DecryptRequestDto();
        decryptRequest.encryptedData = event.body?.encryptedData;

        const apiRequestPayload = new ApiRequestPayload();
        apiRequestPayload.requestId = event.body?.request_id;
        apiRequestPayload.correlationId = event.body?.correlation_id;
        apiRequestPayload.portal = event.body?.portal;
        apiRequestPayload.apiRequest = decryptRequest;

        const commonRestCallDto: CommonRestCallDto = new CommonRestCallDto();
        commonRestCallDto.requestPayload = apiRequestPayload;
        commonRestCallDto.method = httpMethodEnum.POST;
        commonRestCallDto.endpointUrl = URL_PATH_CONSTANTS.DECRYPT_SVC_CONTEXT_PATH ? URL_PATH_CONSTANTS.DECRYPT_SVC_CONTEXT_PATH : "";

        const apiCallResponse = await commonService(kahoonaHttpClient, commonRestCallDto);
        const response = await responseBodyFormat(apiCallResponse?.statusCode, apiCallResponse?.result);
        return response;
    } catch (err) {
        logger.info(`Error ${err}`);
        const response = await responseBodyFormat(500, "Internal Server Error");
        return response;
    }
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
    if (200 === statusCode) {
        responseBody.status = STATUS_SUCCESS;
    } else {
        responseBody.status = STATUS_FAILURE;
    }
    responseBody.statusCode = statusCode;
    responseBody.data = result;

    logger.info(`Function Response --> `, { RESPONSE: responseBody });
    return responseBody;
}