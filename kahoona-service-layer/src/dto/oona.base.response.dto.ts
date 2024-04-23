export class BaseResponse {
    statusCode: number | undefined;
    status: string | undefined;
    message: any | undefined;
    body: any | undefined;
    requestId: string | undefined;
    uuid: string | undefined;
    data: any | undefined;
}
