import { create } from "kubo-rpc-client";

// Get JWT from env (should look like: "Bearer eyJhbGciOiJIUzI1...")
const JWT = process.env.NEXT_PUBLIC_IPFS_JWT || '';

if (!JWT) {
  throw new Error("JWT not found in environment variables");
}

export const ipfs = create({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
  headers: {
    authorization: `Bearer ${JWT}`,
  },
});

// Upload a file to IPFS
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const added = await ipfs.add(file);
    return added.cid.toString();
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

// Upload JSON to IPFS
export const uploadJSONToIPFS = async (data: object): Promise<string> => {
  try {
    const json = JSON.stringify(data);
    const added = await ipfs.add(json);
    return added.cid.toString();
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw error;
  }
};

// Build a gateway URL for a given hash
export const getIPFSUrl = (hash: string): string => {
  return `https://gateway.pinata.cloud/ipfs/${hash}`;
};

// Fetch file or JSON from IPFS
export const fetchFromIPFS = async (hash: string): Promise<string> => {
  try {
    const response = await fetch(getIPFSUrl(hash));
    const contentType = response.headers.get('content-type');
    
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    } else {
      return await response.text();
    }
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw error;
  }
};
