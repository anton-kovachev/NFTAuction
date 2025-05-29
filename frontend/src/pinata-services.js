import { PinataSDK } from "pinata-web3";

const PUBLIC_PINATA_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJjZDBiYWQ1Mi00MWU4LTQ0ZTQtYWE4OC1mNzEwMDE1YzIwZjgiLCJlbWFpbCI6ImFrb3ZhY2hldjdAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6IjNhMzY4NGY4MGVlMGJjYWJlNTI1Iiwic2NvcGVkS2V5U2VjcmV0IjoiNGE2MzZjOWRkMWJmYzY0YThkYWNmMGJkMzE3NWExY2YxN2E0NDI1MGYxN2FkMTM4MGUwMTMwNmFmZDFhNzUwNCIsImV4cCI6MTc3MTg3OTEzMH0.jK5dpI7mjcGC2CfLi5PD_CsfgO8cx5M81UrA4INyv2w";
const PUBLIC_PINATA_GATEWAY = "lime-written-prawn-451.mypinata.cloud";

const pinata = new PinataSDK({
  pinataJwt: PUBLIC_PINATA_JWT,
  pinataGateway: PUBLIC_PINATA_GATEWAY,
});

export default async function pinJSONToIPFS(jsonData) {
  if (!jsonData.name || !jsonData.description) {
    return { status: false, error: "Missing pinata api key or secret" };
  }

  try {
    const response = await pinata.upload.file(jsonData.file, {
      metadata: {
        name: jsonData.name,
        keyValues: { name: jsonData.name, description: jsonData.description },
      },
    });

    return { success: true, pinataUrl: response.IpfsHash };
  } catch (error) {
    return { success: false, error: error.message };
  }
}


export async function fetchFileMetadataByPinHash(ipsPinHash) {
  return (await pinata.listFiles().cid(ipsPinHash).pageLimit(1)).at(0);
}

export function fetchPinataFileUrl(ipsPinHash) {
  return `https://${PUBLIC_PINATA_GATEWAY}/ipfs/${ipsPinHash}`;
}

