import { Handler } from "aws-lambda";
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import {
  TranslateClient,
  TranslateTextCommand,
} from "@aws-sdk/client-translate";

const bucket = process.env.BUCKET_NAME as string;
const s3 = new S3Client({ region: process.env.AWS_REGION });
const translateClient = new TranslateClient({ region: process.env.AWS_REGION });

interface ITranscribeResults {
  jobName: string;
  accountId: string;
  results: {
    languageCode: string;
    transcripts: Array<{
      transcript: string;
    }>;
    language_identification: Array<{
      score: string;
      code: string;
    }>;
    items: Array<{
      start_time: string;
      end_time: string;
      type: string;
      speaker_label: string;
      alternatives: Array<{
        confidence: string;
        content: string;
      }>;
    }>;
  };
}

export const handler: Handler = async (event, context) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  try {
    // TODO: Add S3 API call here to get the transcribe output
    // 1. Parse the JSON file
    // 2. Translate the text using the Translate API
    // 3. Return the translated text
  } catch (err) {
    console.error(err);
    return err;
  }
};
