import AWS from 'aws-sdk';
import { loggingAspectFunction } from "/opt/nodejs/loggingAspect";
import { EventBridgeParam } from "src/model/event-bridge-param.model";
import { createLogger } from '/opt/nodejs/loggerUtil';
import { BaseResponse } from 'src/dto/oona.base.response.dto';


const logger = createLogger();


const EVENTBUS_INFO = {
    EVENTBUS_SOURCE: process.env.EVENTBUS_SOURCE || '',
    EVENTBUS_DETAIL_TYPE: process.env.EVENTBUS_DETAIL_TYPE || '',
    EVENTBUS_NAME: process.env.EVENTBUS_NAME || ''
}

const eventBridgeClient = new AWS.EventBridge();

export const createEvent = async (requestPayload: any) => {
    try {
        console.log('Event bridge Request:', JSON.stringify(requestPayload, undefined, 2));

        // Structure of EventBridge Event
        const eventBridgeParam: EventBridgeParam = new EventBridgeParam();
        eventBridgeParam.Source = EVENTBUS_INFO.EVENTBUS_SOURCE;
        eventBridgeParam.DetailType = EVENTBUS_INFO.EVENTBUS_DETAIL_TYPE;
        eventBridgeParam.EventBusName = EVENTBUS_INFO.EVENTBUS_NAME;
        eventBridgeParam.Detail = JSON.stringify(requestPayload);
        eventBridgeParam.Time = new Date();
        console.log("EventBridge event: ", eventBridgeParam);

        // Send event to EventBridge
        const response = await eventBridgeClient.putEvents({
            Entries: [
                eventBridgeParam
            ]
        }).promise();

        // const response = await eventBridgeClient.putEvents({
        //     Entries: [
        //         {
        //             Source: EVENTBUS_INFO.EVENTBUS_SOURCE,
        //             DetailType: EVENTBUS_INFO.EVENTBUS_DETAIL_TYPE,
        //             EventBusName: EVENTBUS_INFO.EVENTBUS_NAME,
        //             Detail: requestPayload,
        //             Time: new Date(),
        //         }
        //     ]
        // }).promise();

        if (response.FailedEntryCount !== undefined && response.FailedEntryCount > 0) {
            logger.error('Some entries failed to be published. Check the FailedEntries array for details.', {
                failedEntries: response.FailedEntryCount,
            });
        }
        console.log('EventBridge response:', response);
    } catch (error) {
        console.error("There was a problem: ", error);
    }

    const response = await apiResponseObjectFormat(200, { message: `event sent to : ${EVENTBUS_INFO.EVENTBUS_NAME}` });
    logger.info(`Response --> ${JSON.stringify(response)}`);
    return response;
};

async function apiResponseObjectFormat(statusCode: number, data?: any) {
    const response = {} as BaseResponse;
    if (statusCode)
        response.statusCode = statusCode;
    if (data)
        response.body = data;

    return response;
}


export const createEventFn = loggingAspectFunction(createEvent, "restApiCall");
