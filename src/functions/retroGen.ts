import { ManagedUpload } from "aws-sdk/clients/s3";
import { RetroGenerationService } from "../services/RetroGenerationService";
import { ERRORS } from "../assets/Enum";
import { SharePointAuthenticationService } from "../services/SharePointAuthenticationService";
import { SharePointService } from "../services/SharePointService";
import * as rp from "request-promise";
import { TestResultsService } from "../services/TestResultsService";
import { ActivitiesService } from "../services/ActivitiesService";
import { LambdaService } from "../services/LambdaService";
import { Lambda } from "aws-sdk";

/**
 * λ function to process a DynamoDB stream of test results into a queue for certificate generation.
 * @param event - DynamoDB Stream event
 * @param context - λ Context
 * @param callback - callback function
 */
const retroGen = async (event: any): Promise<void | ManagedUpload.SendData[]> => {
  if (!event || !event.Records || !Array.isArray(event.Records) || !event.Records.length) {
    console.error("ERROR: event is not defined.");
    throw new Error(ERRORS.EventIsEmpty);
  }
  const retroService: RetroGenerationService = new RetroGenerationService(new TestResultsService(new LambdaService(new Lambda())), new ActivitiesService(new LambdaService(new Lambda())));
  const retroUploadPromises: Array<Promise<ManagedUpload.SendData>> = [];
  const sharepointAuthenticationService = new SharePointAuthenticationService(rp);
  const sharePointService = new SharePointService(rp);

  event.Records.forEach((record: any) => {
    const visit: any = JSON.parse(record.body);
    const retroUploadPromise = retroService.generateRetroReport(visit).then(async (generationServiceResponse: { fileName: string; fileBuffer: Buffer }) => {
      const tokenResponse = await sharepointAuthenticationService.getToken();
      const accessToken = JSON.parse(tokenResponse).access_token;
      const sharePointResponse = await sharePointService.upload(generationServiceResponse.fileName, generationServiceResponse.fileBuffer, accessToken);
      return sharePointResponse;
    });

    retroUploadPromises.push(retroUploadPromise);
  });

  return Promise.all(retroUploadPromises).catch((error: any) => {
    console.error(error);
    throw error;
  });
};

export { retroGen };
