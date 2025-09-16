export interface User {
  address: string;
  username: string;
  profilePicHash: string;
}

export interface Message {
  from: string;
  to: string;
  ipfsHash: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: number;
  fromUser: User;
}