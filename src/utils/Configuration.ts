// @ts-ignore
import SecretsManager, { GetSecretValueRequest, GetSecretValueResponse } from "aws-sdk/clients/secretsmanager";
import * as AWSXray from "aws-xray-sdk";
import { safeLoad } from "js-yaml";
import * as yml from "node-yaml";
import { ERRORS } from "../assets/Enum";
import { IInvokeConfig, ISPConfig } from "../models";

class Configuration {
  private static instance: Configuration;
  private readonly config: any;
  private spConfig: ISPConfig | undefined;
  private secretsClient: SecretsManager;
  private readonly secretPath: string;

  private constructor(configPath: string, secretPath: string) {
    this.secretPath = secretPath;
    // @ts-ignore
    this.secretsClient = AWSXray.captureAWSClient(new SecretsManager({ region: "eu-west-1" }));
    this.config = yml.readSync(configPath);
    // Replace environment variable references
    let stringifiedConfig: string = JSON.stringify(this.config);
    const envRegex: RegExp = /\${(\w+\b):?(\w+\b)?}/g;
    const matches: RegExpMatchArray | null = stringifiedConfig.match(envRegex);

    if (matches) {
      matches.forEach((match: string) => {
        envRegex.lastIndex = 0;
        const captureGroups: RegExpExecArray = envRegex.exec(match) as RegExpExecArray;

        // Insert the environment variable if available. If not, insert placeholder. If no placeholder, leave it as is.
        stringifiedConfig = stringifiedConfig.replace(match, process.env[captureGroups[1]] || captureGroups[2] || captureGroups[1]);
      });
    }

    this.config = JSON.parse(stringifiedConfig);
  }

  /**
   * Retrieves the singleton instance of Configuration
   * @returns Configuration
   */
  public static getInstance(): Configuration {
    if (!this.instance) {
      this.instance = new Configuration("../config/config.yml", "../config/secrets.yml");
    }

    return Configuration.instance;
  }

  /**
   * Retrieves the entire config as an object
   * @returns any
   */
  public getConfig(): any {
    return this.config;
  }

  /**
   * Retrieves the DynamoDB config
   * @returns IDynamoDBConfig
   */
  public async getSharePointConfig(): Promise<ISPConfig> {
    if (!this.spConfig) {
      this.spConfig = await this.setSecrets();
    }
    return this.spConfig;
  }

  /**
   * Retrieves the Lambda Invoke config
   * @returns IInvokeConfig
   */
  public getInvokeConfig(): IInvokeConfig {
    if (!this.config.invoke) {
      throw new Error("Lambda Invoke config not defined in the config file.");
    }

    // Not defining BRANCH will default to local
    const env: string = !process.env.BRANCH || process.env.BRANCH === "local" ? "local" : "remote";

    return this.config.invoke[env];
  }

  /**
   * Reads the secret yaml file from SecretManager or local file.
   */
  private async setSecrets(): Promise<ISPConfig> {
    let secret: ISPConfig;
    if (process.env.SECRET_NAME) {
      const req: GetSecretValueRequest = {
        SecretId: process.env.SECRET_NAME,
      };
      const resp: GetSecretValueResponse = await this.secretsClient.getSecretValue(req).promise();
      try {
        secret = (await safeLoad(resp.SecretString as string)) as ISPConfig;
      } catch (e) {
        throw new Error("SecretString is empty.");
      }
    } else {
      console.warn(ERRORS.SecretEnvVarNotSet);
      try {
        secret = (await yml.read(this.secretPath)) as ISPConfig;
      } catch (e) {
        throw new Error(ERRORS.SecretFileNotExist);
      }
    }
    return secret;
  }
}

export { Configuration };
