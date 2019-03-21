import {retroGen} from "./functions/retroGen";
import {config as AWSConfig} from "aws-sdk";

const isOffline: boolean = (!process.env.BRANCH || process.env.BRANCH === "local");

if (isOffline) {
    AWSConfig.credentials = {
        accessKeyId: "accessKey1",
        secretAccessKey: "verySecretKey1"
    };
}

export {retroGen as handler};
