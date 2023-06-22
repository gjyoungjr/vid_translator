import { Construct } from "constructs";
import {
  Effect,
  PolicyStatement,
  Role,
  Policy,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";

export class PolicyStatements extends Construct {
  public readonly startTranscriptionJobPolicy: PolicyStatement;
  public readonly getTranscriptionJobPolicy: PolicyStatement;
  public readonly translateTextPolicy: PolicyStatement;
  public readonly executeStateMachinePolicy: PolicyStatement;
  public readonly pollySpeechSynthesisPolicy: PolicyStatement;
  public readonly mediaConvertPolicy: PolicyStatement;
  public readonly mediaConvertRole: Role;
  public readonly passRolePolicy: PolicyStatement;
  public readonly S3ReadWritePolicy: PolicyStatement;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    /**
     * Policy statements.
     */

    this.startTranscriptionJobPolicy = new PolicyStatement({
      actions: ["transcribe:StartTranscriptionJob"],
      effect: Effect.ALLOW,
      resources: ["*"],
    });
    this.getTranscriptionJobPolicy = new PolicyStatement({
      actions: ["transcribe:GetTranscriptionJob"],
      effect: Effect.ALLOW,
      resources: ["*"],
    });
    this.translateTextPolicy = new PolicyStatement({
      actions: ["translate:TranslateText"],
      effect: Effect.ALLOW,
      resources: ["*"],
    });
    this.executeStateMachinePolicy = new PolicyStatement({
      actions: ["states:StartExecution"],
      effect: Effect.ALLOW,
      resources: ["*"],
    });

    this.pollySpeechSynthesisPolicy = new PolicyStatement({
      actions: [
        "polly:StartSpeechSynthesisTask",
        "polly:GetSpeechSynthesisTask",
        "polly:ListSpeechSynthesisTasks",
      ],
      resources: ["*"],
    });

    this.S3ReadWritePolicy = new PolicyStatement({
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: ["*"],
    });
    this.mediaConvertPolicy = new PolicyStatement({
      actions: [
        "mediaconvert:DescribeEndpoints",
        "mediaconvert:CreateJob",
        "mediaconvert:GetJob",
      ],
      resources: ["*"],
    });

    this.mediaConvertRole = new Role(this, "MediaConvertRole", {
      assumedBy: new ServicePrincipal("mediaconvert.amazonaws.com"),
    });
    this.mediaConvertRole.attachInlinePolicy(
      new Policy(this, "MediaConvertInlinePolicy", {
        statements: [this.S3ReadWritePolicy],
      })
    );

    this.passRolePolicy = new PolicyStatement({
      actions: ["iam:PassRole"],
      resources: [this.mediaConvertRole.roleArn],
    });
  }
}
