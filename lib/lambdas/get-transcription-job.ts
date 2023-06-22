import { Handler } from "aws-lambda";
import {
  TranscribeClient,
  GetTranscriptionJobCommand,
} from "@aws-sdk/client-transcribe";

const transcribeClient = new TranscribeClient({
  region: process.env.AWS_REGION,
});

export const handler: Handler = async (event, context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  try {
    // TODO: Add Transcribe API call here to get the status of the job
    // TODO: Return the job status and job name
  } catch (err) {
    console.error(err);
    return err;
  }
};
