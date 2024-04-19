import { BlockType } from "aws-sdk/clients/comprehend";
import AWS from 'aws-sdk';
import { loggingAspectFunction } from "/opt/nodejs/loggingAspect";

const eventBridgeClient = new AWS.EventBridge();

const createEvent = async (event: { body: any, [key: string]: any }) => {
    try {
        console.log('Request:', JSON.stringify(event, undefined, 2));

        let requestBody = event["body"];
        if (!requestBody) {
            requestBody = '';
        }

        // Structure of EventBridge Event
        const eventbridgeEvent = {
            'Time': new Date(),
            'Source': 'com.mycompany.myapp',
            'Detail': requestBody,
            'DetailType': 'service_status'
        }

        console.log("EventBridge event: ", eventbridgeEvent);

        // Send event to EventBridge
        const response = await eventBridgeClient.putEvents({
            Entries: [
                eventbridgeEvent
            ]
        }).promise();

        console.log('EventBridge response:', response);
    } catch (error) {
        console.error("There was a problem: ", error);
    }

    return {
        statusCode: 200,
        headers: { "Content-Type": "text/plain" },
        body: `from Producer...`
    };
};


export const createEventFn = loggingAspectFunction(createEvent, "restApiCall");
