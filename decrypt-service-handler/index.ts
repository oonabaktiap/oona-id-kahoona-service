import { Handler } from "aws-lambda";
import KahoonaService from '/opt/nodejs/kahoonaService';


let kahoonaService: KahoonaService = new KahoonaService();

export const handler: Handler = async (event) => {
    const apiCallResponse = await kahoonaService.decrypt(event);
    return apiCallResponse;
}