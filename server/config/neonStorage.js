const { S3Client } = require('@aws-sdk/client-s3');

const endpoint = process.env.AWS_ENDPOINT_URL_S3;
const region = process.env.AWS_REGION || 'ap-southeast-1';
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
        'Neon Object Storage is not configured. Set AWS_ENDPOINT_URL_S3, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.'
    );
}

const s3 = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
});

const BUCKET_NAMES = {
    profiles: 'profiles',
    issue_img: 'issue-images',
    proofs: 'proofs',
};

function publicObjectUrl(bucket, key) {
    const normalizedEndpoint = endpoint.endsWith('/') ? endpoint : `${endpoint}/`;
    const encodedKey = key.split('/').map(encodeURIComponent).join('/');
    return new URL(`${encodeURIComponent(bucket)}/${encodedKey}`, normalizedEndpoint).toString();
}

module.exports = { s3, BUCKET_NAMES, publicObjectUrl };
