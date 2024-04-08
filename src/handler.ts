import { retroGen } from "./functions/retroGen";

const isOffline: boolean = !process.env.BRANCH || process.env.BRANCH === "local";
let credentials = {};
if (isOffline) {
  credentials = {
    accessKeyId: "accessKey1",
    secretAccessKey: "verySecretKey1",
  };
}
export { credentials };
export { retroGen as handler };
