import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const neynarApiKey = process.env.NEYNAR_API_KEY as string;

if (!neynarApiKey) {
  throw new Error("NEYNAR_API_KEY missing");
}

const config = new Configuration({
  apiKey: neynarApiKey
});

export const neynarClient = new NeynarAPIClient(config);
