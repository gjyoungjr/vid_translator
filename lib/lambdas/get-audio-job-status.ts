import { Handler } from "aws-lambda";
import {
  PollyClient,
  GetSpeechSynthesisTaskCommand,
} from "@aws-sdk/client-polly";

const pollyClient = new PollyClient({ region: process.env.AWS_REGION });
const bucket = process.env.BUCKET_NAME as string;

export const handler: Handler = async (event, context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  try {
    // TODO: Add polly API to get the status of the task
    /// TODO: Return the task status and task ID
  } catch (err) {
    console.error(err);
    return err;
  }
};
