import {Callback, Context, Handler} from "aws-lambda";
import {Injector} from "../models/injector/Injector";
import {ManagedUpload} from "aws-sdk/clients/s3";
import {RetroGenerationService} from "../services/RetroGenerationService";
import {AWSError} from "aws-sdk";
import {SharePointAuthenticationService} from "../services/SharePointAuthenticationService";
import {SharePointService} from "../services/SharePointService";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const retroGen: Handler = async (event: any, context?: Context, callback?: Callback): Promise<void | ManagedUpload.SendData[]> => {
    if (!event) {
        console.error("ERROR: event is not defined.");
        return;
    }
    const retroService: RetroGenerationService = Injector.resolve<RetroGenerationService>(RetroGenerationService);
    const retroUploadPromises: Array<Promise<ManagedUpload.SendData>> = [];
    const sharepointAuthenticationService = new SharePointAuthenticationService();
    const sharePointService = new SharePointService();

    event.Records.forEach((record: any) => {
        const visit: any = JSON.parse(record.body);
        const retroUploadPromise = retroService.generateRetroReport(visit)
        .then(async (generationServiceResponse: { fileName: string, fileBuffer: Buffer }) => {
            const tokenResponse = await sharepointAuthenticationService.getToken();
            const accessToken = JSON.parse(tokenResponse).access_token;
            const sharePointResponse = await sharePointService.upload(generationServiceResponse.fileName, generationServiceResponse. fileBuffer, accessToken);
            return sharePointResponse;
        })
        .catch((error: any) => {
            throw error;
        });

        retroUploadPromises.push(retroUploadPromise);
    });

    return Promise.all(retroUploadPromises)
    .catch((error: AWSError) => {
        console.error(error);
    });
};

export {retroGen};
