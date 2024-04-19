import { OonaPortalAppEnum } from "src/enum/oona-portal-app.enum";

export class ApiRequestPayload {
    portal: OonaPortalAppEnum;
    requestId: string;
    correlationId: string;
    apiRequest: any;
}