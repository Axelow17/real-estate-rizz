import { neynarClient } from "../lib/neynar";

async function getFid(username: string) {
  try {
    const user = await neynarClient.lookupUserByUsername(username);
    console.log(`FID for ${username}: ${user.result.user.fid}`);
    return user.result.user.fid;
  } catch (error) {
    console.error("Error:", error);
  }
}

getFid("alxelow.eth");