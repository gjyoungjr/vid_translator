import { Handler } from "aws-lambda";
import {
  PollyClient,
  StartSpeechSynthesisTaskCommand,
} from "@aws-sdk/client-polly";

const pollyClient = new PollyClient({ region: process.env.AWS_REGION });
const bucket = process.env.BUCKET_NAME as string;

export const handler: Handler = async (event, context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  try {
    // TODO: Add Polly API call here
    // TODO: Return the task ID
  } catch (err) {
    console.error(err);
    return err;
  }
};
