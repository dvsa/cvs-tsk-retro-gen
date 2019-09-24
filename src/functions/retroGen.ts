import {Callback, Context} from "aws-lambda";
import {Injector} from "../models/injector/Injector";
import {ManagedUpload} from "aws-sdk/clients/s3";
import {RetroGenerationService} from "../services/RetroGenerationService";
import { ERRORS } from "../models/enums";
import {SharePointAuthenticationService} from "../services/SharePointAuthenticationService";
import {SharePointService} from "../services/SharePointService";
import * as rp from "request-promise";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const retroGen = async (event: any, context?: Context, callback?: Callback): Promise<void | ManagedUpload.SendData[]> => {
    if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
        console.error("ERROR: event is not defined.");
        throw new Error(ERRORS.EventIsEmpty);
    }
    const retroService: RetroGenerationService = Injector.resolve<RetroGenerationService>(RetroGenerationService);
    const retroUploadPromises: Array<Promise<ManagedUpload.SendData>> = [];
    const sharepointAuthenticationService = new SharePointAuthenticationService(rp);
    const sharePointService = new SharePointService(rp);

    event.Records.forEach((record: any) => {
        const visit: any = JSON.parse(record.body);
        const retroUploadPromise = retroService.generateRetroReport(visit)
            .then(async (generationServiceResponse: { fileName: string, fileBuffer: Buffer }) => {
                const tokenResponse = await sharepointAuthenticationService.getToken();
                const accessToken = JSON.parse(tokenResponse).access_token;
                const sharePointResponse = await sharePointService.upload(generationServiceResponse.fileName, generationServiceResponse. fileBuffer, accessToken);
                console.log(`SharepointResponse: ${sharePointResponse}`);
                return sharePointResponse;
            });

        retroUploadPromises.push(retroUploadPromise);
    });

    return Promise.all(retroUploadPromises)
    .catch((error: any) => {
        console.error(error);
        throw error;
    });
};

export {retroGen};
