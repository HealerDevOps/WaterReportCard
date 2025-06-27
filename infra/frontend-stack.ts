import {
  Stack,
  StackProps,
  aws_ec2 as ec2,
  aws_iam as iam,
  aws_s3_assets as s3assets,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { KeyPair } from 'aws-cdk-lib/aws-ec2';

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps & { vpc: ec2.IVpc }) {
    super(scope, id, props);

    const securityGroup = new ec2.SecurityGroup(this, 'FrontendSG', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(22), 'SSH');
    securityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(3000), 'Next.js App');

    const role = new iam.Role(this, 'FrontendRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    const ami = ec2.MachineImage.genericLinux({
        'us-west-2': 'ami-0f6d76bf212f00b86',
    });

    // const userDataScript = ec2.UserData.forLinux();
    // userDataScript.addCommands(
    //   'curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -',
    //   'sudo yum install -y nodejs git',
    //   'sudo npm install -g pm2',
    //   'mkdir -p /home/ec2-user/app',
    //   'cd /home/ec2-user/app',
    //   // You’ll deploy zip contents manually
    // );

    const key = KeyPair.fromKeyPairName(this, 'WaterFrontKeyPair', 'water-frontend-key-pair');

    const instance = new ec2.Instance(this, 'FrontendInstance', {
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
        machineImage: ami,
        vpc: props.vpc,
        role,
        securityGroup,
        vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
        associatePublicIpAddress: true,
        keyPair: key, // <--- replace with your actual EC2 Key Pair
        //   userData: userDataScript,
    });
  }
}
