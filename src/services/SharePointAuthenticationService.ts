import * as request from "request-promise";
import {ISPConfig} from "../models";
import {Configuration} from "../utils/Configuration";
import {OptionsWithUri} from "request-promise";

class SharePointAuthenticationService {
    private readonly spConfig: ISPConfig = Configuration.getInstance().getSharePointConfig();
    private request: any;

    // expects request-promise, but due to the nature of the library, it seems nigh impossible to mock through
    // conventional means, so need to use DI.
    constructor(request: any) {
        this.request = request;
    }

    /**
     * Does a POST call to azure and gets a token for the sharepoint instance with client_id and client_secret defined in secrets.yml file
     */
    public async getToken() {
        const tokenParams: OptionsWithUri = {
            method: "POST",
            uri: "https://login.microsoftonline.com/6c448d90-4ca1-4caf-ab59-0a2aa67d7801/oauth2/token",
            form: {
                grant_type: "client_credentials",
                client_id: this.spConfig.azure_sharepoint_client_id,
                client_secret: this.spConfig.azure_sharepoint_client_secret,
                resource: "https://graph.microsoft.com/"
            }
        };
        console.log("IN GETTOKEN() FUNCTION");
        return this.request.get(tokenParams);
    }
}

export {SharePointAuthenticationService};
