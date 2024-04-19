import axios from 'axios';
import HttpClient from '/opt/nodejs/httpClient';
import { loggingAspectFunction } from '/opt/nodejs/loggingAspect';
import { CommonRestCallDto } from "src/dto/common-rest-call.dto";
import { httpMethodEnum } from 'src/enum/http-method.enum';
import { BaseResponse } from 'src/dto/oona.base.response.dto';

const restApiCall = async (httpClient: HttpClient, commonRestCallDto: CommonRestCallDto): Promise<any> => {
    try {
        if (commonRestCallDto) {
            const endpointUrl = commonRestCallDto.endpointUrl;
            const httpMethod = commonRestCallDto.method;
            const requestPayload = commonRestCallDto?.requestPayload;
            let response: any;
            if (httpMethod == httpMethodEnum.GET) {
                response = await httpClient.get<any>(`${endpointUrl}`);
            } else if (httpMethod == httpMethodEnum.POST) {
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

