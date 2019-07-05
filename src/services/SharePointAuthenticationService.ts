import rp, {OptionsWithUri} from "request-promise";
import {ISPConfig} from "../models";
import {Configuration} from "../utils/Configuration";

class SharePointAuthenticationService {
    private readonly spConfig: ISPConfig = Configuration.getInstance().getSharePointConfig();

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

        return rp(tokenParams);
    }
}

export {SharePointAuthenticationService};
