import { Configuration } from "../../src/utils/Configuration";

const mockConfig = () => {
  // @ts-ignore
  if (!Configuration.instance) {
    // @ts-ignore
    Configuration.instance = new Configuration("../../src/config/config.yml", "../../tests/resources/mockSecrets.yml");
  }
};

export default mockConfig;
