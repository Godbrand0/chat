const PINATA_API_KEY = process.env.NEXT_PUBLIC_PINATA_API_KEY || "";
const PINATA_API_SECRET = process.env.NEXT_PUBLIC_PINATA_API_SECRET || "";

if (!PINATA_API_KEY || !PINATA_API_SECRET) {
  throw new Error("Pinata API Key/Secret not found in environment variables");
}

const PINATA_BASE_URL = "https://api.pinata.cloud/pinning";

// Upload a file
export const uploadToIPFS = async (file: File): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch(`${PINATA_BASE_URL}/pinFileToIPFS`, {
      method: "POST",
      headers: {
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
      body: formData,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const data = await res.json();
    return data.IpfsHash;
  } catch (error) {
    console.error("Error uploading file to IPFS:", error);
    throw error;
  }
};

// Fetch JSON from IPFS using Pinata gateway
export const fetchJSONFromIPFS = async <T = unknown>(hash: string): Promise<T> => {
  try {
    const res = await fetch(`https://gateway.pinata.cloud/ipfs/${hash}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch IPFS data: ${res.statusText}`);
    }
    const data: T = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching JSON from IPFS:", error);
    throw error;
  }
};


// Upload JSON
export const uploadJSONToIPFS = async (data: object): Promise<string> => {
  try {
    const res = await fetch(`${PINATA_BASE_URL}/pinJSONToIPFS`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        pinata_api_key: PINATA_API_KEY,
        pinata_secret_api_key: PINATA_API_SECRET,
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Upload failed: ${errText}`);
    }

    const result = await res.json();
    return result.IpfsHash;
  } catch (error) {
    console.error("Error uploading JSON to IPFS:", error);
    throw error;
  }
};

// Gateway
export const getIPFSUrl = (hash: string): string =>
  `https://gateway.pinata.cloud/ipfs/${hash}`;
