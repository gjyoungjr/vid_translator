import { S3Handler } from "aws-lambda";
import { SFNClient, StartExecutionCommand } from "@aws-sdk/client-sfn";

const stateMachineArn = process.env.STATE_MACHINE_ARN as string;
const sfnClient = new SFNClient({ region: process.env.AWS_REGION });

export const handler: S3Handler = async (event) => {
  console.log("EVENT: \n" + JSON.stringify(event, null, 2));
  try {
    // TODO: Extract the key from S3 event
    // 1. Start the state machine execution and pass the key as input
  } catch (err) {
    console.error(err);
  }
};
