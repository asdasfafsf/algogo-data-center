import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { S3Config } from '../config/S3Config';
import { PutObjectCommand, S3 } from '@aws-sdk/client-s3';

@Injectable()
export class S3Service implements OnModuleInit {
  private s3: S3;

  constructor(
    @Inject(S3Config.KEY)
    private s3Config: ConfigType<typeof S3Config>,
  ) {}

  onModuleInit() {
    this.s3 = new S3({
      endpoint: this.s3Config.endpoint,
      region: this.s3Config.region,
      forcePathStyle: true,
      credentials: {
        accessKeyId: this.s3Config.accessKey,
        secretAccessKey: this.s3Config.secretKey,
      },
    });
  }

  async uploadFile(file: Buffer, key: string, contentType?: string) {
    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.s3Config.bucketName,
        Key: key,
        Body: file,
        ContentType: contentType,
        ACL: 'public-read',
      }),
    );

    return {
      url: `${this.s3Config.endpoint}/${this.s3Config.bucketName}/${key}`,
    };
  }
}
