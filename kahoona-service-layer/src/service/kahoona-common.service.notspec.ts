// import axios from 'axios';
// import { commonService } from 'src/service/kahoona-common.service';
// import HttpClient from '/opt/nodejs/httpClient';
// import { CommonRestCallDto } from 'src/dto/common-rest-call.dto';
// import { httpMethodEnum } from 'src/enum/http-method.enum';
// import { OonaPortalAppEnum } from 'src/enum/oona-portal-app.enum';
// import { BaseResponse } from 'src/dto/oona.base.response.dto';

// jest.mock('axios');

// describe('restApiCall function', () => {
//     let mockHttpClient: HttpClient;
//     const mockCommonRestCallDto: CommonRestCallDto = {
//         endpointUrl: 'https://example.com/api',
//         method: httpMethodEnum.GET,
//         requestPayload: {
//             portal: OonaPortalAppEnum.KAHOONA,
//             requestId: "reqId",
//             correlationId: "correlationId",
//             apiRequest: {
//                 key: "value"
//             },
//         },
//     };

//     // beforeEach(() => {
//     //     mockHttpClient = {
//     //         axiosInstance: axios,
//     //         get: jest.fn(),
//     //         post: jest.fn(),
//     //         put: jest.fn(),
//     //         delete: jest.fn(),
//     //         handleError: jest.fn(),
//     //     };
//     // });

//     it('should make a GET request', async () => {
//         const mockResponseData = { message: 'Success' };
//         (mockHttpClient.get as jest.Mock).mockResolvedValue({ status: 200, data: mockResponseData });

//         const result = await commonService(mockHttpClient, mockCommonRestCallDto);

//         expect(mockHttpClient.get).toHaveBeenCalledWith('https://example.com/api');
//         expect(result.statusCode).toBe(200);
//         expect(result.data).toEqual(mockResponseData);
//     });

//     it('should make a POST request', async () => {
//         const mockResponseData = { message: 'Success' };
//         (mockHttpClient.post as jest.Mock).mockResolvedValue({ status: 201, data: mockResponseData });

//         mockCommonRestCallDto.method = httpMethodEnum.POST;
//         const result = await commonService(mockHttpClient, mockCommonRestCallDto);

//         expect(mockHttpClient.post).toHaveBeenCalledWith('https://example.com/api', { key: 'value' });
//         expect(result.statusCode).toBe(201);
//         expect(result.data).toEqual(mockResponseData);
//     });

//     it('should handle Axios errors', async () => {
//         const mockAxiosError = {
//             response: {
//                 status: 404,
//                 data: { error: 'Not found' },
//             },
//         };
//         (mockHttpClient.get as jest.Mock).mockRejectedValue(mockAxiosError);

//         const result = await commonService(mockHttpClient, mockCommonRestCallDto);

//         expect(result.statusCode).toBe(500);
//         expect(result.data).toEqual({ error: 'Not found' });
//     });
// });

// describe('apiResponseObjectFormat function', () => {
//     it('should format response object correctly', async () => {
//         const statusCode = 200;
//         const data = { message: 'Success' };

//         const result = await apiResponseObjectFormat(statusCode, data);

//         expect(result.statusCode).toBe(statusCode);
//         expect(result.data).toEqual(data);
//     });
// });

// describe('handleError function', () => {
//     it('should handle Axios error with response', async () => {
//         const mockAxiosError = {
//             response: {
//                 status: 404,
//                 data: { error: 'Not found' },
//             },
//         };

//         const result = await handleError(mockAxiosError);

//         expect(result.statusCode).toBe(500);
//         expect(result.data).toEqual({ error: 'Not found' });
//     });

//     it('should handle Axios error without response', async () => {
//         const mockAxiosError = {
//             request: 'some request',
//         };

//         const result = await handleError(mockAxiosError);

//         expect(result.statusCode).toBe(500);
//         expect(result.data).toBe('some request');
//     });

//     it('should handle general error', async () => {
//         const errorMessage = 'Some error occurred';

//         const result = await handleError(errorMessage);

//         expect(result.statusCode).toBe(500);
//         expect(result.data).toBe(errorMessage);
//     });
// });

// async function apiResponseObjectFormat(statusCode: number, data?: any | undefined) {
//     const response = {} as BaseResponse;
//     response.statusCode = statusCode;
//     response.data = data;

//     return response;
// }

// async function handleError(error: any) {
//     if (axios.isAxiosError(error)) {
//         if (error.response) {
//             // The request was made, but the server responded with a non-2xx status code
//             return await apiResponseObjectFormat(500, error?.response?.data);
//         } else if (error.request) {
//             // The request was made but no response was received
//             return await apiResponseObjectFormat(500, error?.message);
//         } else {
//             return await apiResponseObjectFormat(500, error?.message);
//         }
//     } else {
//         return await apiResponseObjectFormat(500, error);
//     }
// }

