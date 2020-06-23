import { SharePointAuthenticationService } from "./SharePointAuthenticationService";
import { SharePointService } from "./SharePointService";
import { S3BucketService } from "./S3BucketService";
import S3 from "aws-sdk/clients/s3";

export class DataMigrationService {
    public static destinationFolder = new Map([
        [ `cvs-cfs-migration-csv-${process.env.BRANCH}`, "Dynamics_Migration_POC" ],
        [ `cvs-cfs-migration-documents-${process.env.BRANCH}`, "Dynamics_Migration_POC" ],
    ]);

    /**
     * Download the document contained in the record and upload it to Sharepoint
     * @param record AWS event record
     * @param sharepointAuthenticationService
     * @param sharePointService
     */
    public static async uploadDocumentToSharepoint(record: any, sharepointAuthenticationService: SharePointAuthenticationService, sharePointService: SharePointService) {
        const srcKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

        const result = await new S3BucketService(new S3()).download(record.s3.bucket.name, srcKey);
        console.log("Downloaded successfully from the S3 bucket");

        const tokenResponse = await sharepointAuthenticationService.getToken();
        const destFolder = DataMigrationService.destinationFolder.get(record.s3.bucket.name);
        if (!destFolder) { throw new Error("Cannot retrieve the correct destination folder for bucket " + record.s3.bucket.name); }
        return sharePointService.uploadLargeFile(srcKey, result.Body as Buffer, JSON.parse(tokenResponse).access_token, destFolder);
    }
}
