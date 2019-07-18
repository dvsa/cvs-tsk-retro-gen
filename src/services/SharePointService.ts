import {OptionsWithUri} from "request-promise";
import {ISPConfig} from "../models";
import {Configuration} from "../utils/Configuration";

class SharePointService {
    private readonly spConfig: ISPConfig = Configuration.getInstance().getSharePointConfig();
    private request: any;

    // expects request-promise, but due to the nature of the library, it seems nigh impossible to mock through
    // conventional means, so need to use DI.
    constructor(request: any) {
        this.request = request;
    }

    /**
     * Does a PUT call to sharepoint site identified by sharepoint_site_id defined in secrets.yml and uploads a file given as parameter to the drive and folder specified in secrets.yml.
     * @param fileName - the file name used to saved the file
     * @param fileBuffer - the actual file stored as binary buffer.
     * @param accessToken - the bearer token used to gain access to sharepoint
     */
    public async upload(fileName: string, fileBuffer: Buffer, accessToken: string) {
        const sharepointParams: OptionsWithUri = {
            method: "PUT",
            uri: `https://graph.microsoft.com/v1.0/sites/${this.spConfig.sharepoint_site_id}/drives/${this.spConfig.sharepoint_drive_id}/` +
                `items/${this.spConfig.sharepoint_parent_id}:/${fileName}:/content`,
            headers: {
                Authorization: "Bearer " + accessToken
            },
            body: fileBuffer
        };
        console.log("IN UPLOAD() FUNCTION");
        return this.request.put(sharepointParams);
    }
}

export {SharePointService};
