import { Handler } from "aws-lambda";
import {
  TranscribeClient,
  StartTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";
import { v4 as uuidv4 } from "uuid";

const bucket = process.env.BUCKET_NAME as string;
const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION,
});

export const handler: Handler = async (event, context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  console.log(`Bucket: ${bucket}`);
  try {
    const jobName = uuidv4();
    const video = event?.video;

    // TODO: Add Transcribe API call here
    // TODO: Return the job name and video name
  } catch (err) {
    console.error(err);
    return err;
  }
};
