import { NeynarAPIClient, Configuration } from "@neynar/nodejs-sdk";

const neynarApiKey = process.env.NEYNAR_API_KEY as string;

// Only validate env vars at runtime, not build time
if (typeof window === 'undefined' && !neynarApiKey) {
  throw new Error("NEYNAR_API_KEY missing");
}

const config = new Configuration({
  apiKey: neynarApiKey
});

export const neynarClient = new NeynarAPIClient(config);
