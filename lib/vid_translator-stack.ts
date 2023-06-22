import * as cdk from "aws-cdk-lib";
import { Policy } from "aws-cdk-lib/aws-iam";
import { Runtime } from "aws-cdk-lib/aws-lambda";
import { S3EventSource } from "aws-cdk-lib/aws-lambda-event-sources";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import { Bucket, EventType } from "aws-cdk-lib/aws-s3";
import {
  Choice,
  Condition,
  StateMachine,
  Wait,
  WaitTime,
} from "aws-cdk-lib/aws-stepfunctions";
import { LambdaInvoke } from "aws-cdk-lib/aws-stepfunctions-tasks";
import { Construct } from "constructs";

import { PolicyStatements } from "./constructs/policies";

export class VidTranslatorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    /********************* POLICY STATEMENTS  *****************************/
    const policies = new PolicyStatements(this, "Policies");

    /********************* S3 BUCKET  ************************************/
    const bucket = new Bucket(this, "VideosBucket", {});
    const s3PutEventSource = new S3EventSource(bucket, {
      events: [EventType.OBJECT_CREATED],
      filters: [{ suffix: ".mp4" }],
    });

    /***************** LAMBDAS & STATE MACHINE STEPS  ***********************/
    const transcribeLamdbda = new NodejsFunction(this, "TranscribeVideo", {
      entry: "lib/lambdas/transcribe.ts",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantReadWrite(transcribeLamdbda);
    transcribeLamdbda.addToRolePolicy(policies.startTranscriptionJobPolicy);

    const getTranscriptionJob = new NodejsFunction(
      this,
      "GetTranscriptionJob",
      {
        entry: "lib/lambdas/get-transcription-job.ts",
        runtime: Runtime.NODEJS_18_X,
      }
    );
    getTranscriptionJob.addToRolePolicy(policies.getTranscriptionJobPolicy);

    const getTransciptionJobStep = new LambdaInvoke(
      this,
      "GetTranscriptionJobStep",
      {
        lambdaFunction: getTranscriptionJob,
      }
    );

    const waitTranscriptionJob = new Wait(
      this,
      "Transcribe Job Wait 5 Seconds",
      {
        time: WaitTime.duration(cdk.Duration.seconds(5)),
      }
    );

    const mediaConvert = new NodejsFunction(this, "MediaConvert", {
      entry: "lib/lambdas/media-convert.ts",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
        MEDIA_CONVERT_ROLE_ARN: policies.mediaConvertRole.roleArn,
      },
    });
    bucket.grantReadWrite(mediaConvert);
    mediaConvert.role?.attachInlinePolicy(
      new Policy(this, "MediaConvertPolicy", {
        statements: [policies.mediaConvertPolicy, policies.passRolePolicy],
      })
    );

    const mediaConvertStep = new LambdaInvoke(this, "MediaConvertStep", {
      lambdaFunction: mediaConvert,
    });

    const generateAudio = new NodejsFunction(this, "GenerateAudio", {
      entry: "lib/lambdas/generate-audio.ts",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantReadWrite(generateAudio);
    generateAudio.addToRolePolicy(policies.pollySpeechSynthesisPolicy);

    const generateAudioStep = new LambdaInvoke(this, "GenerateAudioStep", {
      lambdaFunction: generateAudio,
    });
    const getAudioJobStatus = new NodejsFunction(this, "GetAudioJobStatus", {
      entry: "lib/lambdas/get-audio-job-status.ts",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    bucket.grantReadWrite(getAudioJobStatus);
    getAudioJobStatus.addToRolePolicy(policies.pollySpeechSynthesisPolicy);

    const getAudioJobStatusStep = new LambdaInvoke(
      this,
      "GetAudioJobStatusStep",
      { lambdaFunction: getAudioJobStatus }
    );
    const waitAudioJob = new Wait(this, "Audio Job Wait 5 Seconds", {
      time: WaitTime.duration(cdk.Duration.seconds(5)),
    });

    const translateText = new NodejsFunction(this, "TranslateText", {
      entry: "lib/lambdas/translate.ts",
      runtime: Runtime.NODEJS_18_X,
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    const translateTextStep = new LambdaInvoke(this, "TranslateTextStep", {
      lambdaFunction: translateText,
    })
      .next(generateAudioStep)
      .next(waitAudioJob)
      .next(getAudioJobStatusStep)
      .next(
        new Choice(this, "IsAudioJobComplete?")
          .when(
            Condition.stringEquals("$.Payload.pollyTaskStatus", "completed"),
            mediaConvertStep
          )
          .otherwise(waitAudioJob)
      );

    translateText.addToRolePolicy(policies.translateTextPolicy);
    bucket.grantReadWrite(translateText);

    /********************* STATE MACHINE  ************************************/
    const stateMachine = new StateMachine(this, "VidTranslatorStateMachine", {
      definition: new LambdaInvoke(this, "TranscribeVideoStep", {
        lambdaFunction: transcribeLamdbda,
      }).next(
        waitTranscriptionJob
          .next(getTransciptionJobStep)
          .next(
            new Choice(this, "IsTranscriptionJobComplete?")
              .when(
                Condition.stringEquals(
                  "$.Payload.transcriptionJobStatus",
                  "COMPLETED"
                ),
                translateTextStep
              )
              .otherwise(waitTranscriptionJob)
          )
      ),
    });

    const executeStateMachine = new NodejsFunction(
      this,
      "ExecuteStateMachine",
      {
        entry: "lib/lambdas/execute-state-machine.ts",
        runtime: Runtime.NODEJS_18_X,
        environment: {
          STATE_MACHINE_ARN: stateMachine.stateMachineArn,
        },
      }
    );
    executeStateMachine.addToRolePolicy(policies.executeStateMachinePolicy);
    executeStateMachine.addEventSource(s3PutEventSource);
  }
}
