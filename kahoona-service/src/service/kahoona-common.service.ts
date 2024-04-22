import axios from 'axios';
import HttpClient from '/opt/nodejs/httpClient';
import { loggingAspectFunction } from '/opt/nodejs/loggingAspect';
import { CommonRestCallDto } from "src/dto/common-rest-call.dto";
import { httpMethodEnum } from 'src/enum/http-method.enum';
import { BaseResponse } from 'src/dto/oona.base.response.dto';
import { createLogger } from '/opt/nodejs/loggerUtil';

const logger = createLogger();

const getApiCall = async (endpointUrl: string): Promise<Response> => {
    // let response = new BaseResponse();
    const apiResponse: Response = await fetch(endpointUrl);
    // console.log(`apiResponse = ${JSON.stringify(apiResponse)}`)
    // if (apiResponse) {
    //     response.statusCode = 0;
    //     response.status = "success";
    //     response.message = await apiResponse.json();
    // }
    // console.log(`response = ${JSON.stringify(response)}`);
    // return response;

    return apiResponse;
}


const restApiCall = async (httpClient: HttpClient, commonRestCallDto: CommonRestCallDto): Promise<any> => {
    try {
        logger.info(`httpClient = ${httpClient}`)
        logger.info(`incoming request = ${JSON.stringify(commonRestCallDto)}`)
        if (commonRestCallDto) {
            const endpointUrl = commonRestCallDto.endpointUrl;
            const httpMethod = commonRestCallDto.method;
            const requestPayload = commonRestCallDto?.requestPayload;
            let response: any;
            if (httpMethod == httpMethodEnum.GET) {
                logger.info('into GET call')
                response = await httpClient.get<any>(`${endpointUrl}`);
            } else if (httpMethod == httpMethodEnum.POST) {
                logger.info('into POST call')
                response = await httpClient.post<any>(`${endpointUrl}`, requestPayload);
            }
            else if (httpMethod == httpMethodEnum.DELETE) {
                //TODO
            }
            else if (httpMethod == httpMethodEnum.PUT) {
                //TODO
            }
            return await apiResponseObjectFormat(response?.status, response?.data);
        }

    } catch (error) {
        return await handleError(error);
    }
    return null;
}

async function apiResponseObjectFormat(statusCode: number, data?: any | undefined) {
    const response = {} as BaseResponse;
    response.statusCode = statusCode;
    response.data = data;

    return response;
}

async function handleError(error: any) {
    if (axios.isAxiosError(error)) {
        if (error.response) {
            // The request was made, but the server responded with a non-2xx status code
            return await apiResponseObjectFormat(500, error?.response?.data);
        } else if (error.request) {
            // The request was made but no response was received
            return await apiResponseObjectFormat(500, error?.message);
        } else {
            return await apiResponseObjectFormat(500, error?.message);
        }
    } else {
        return await apiResponseObjectFormat(500, error);
    }
}

export const restApiCallFn = loggingAspectFunction(restApiCall, "restApiCall");
export const getApiCallFn = loggingAspectFunction(getApiCall, "getApiCall");

