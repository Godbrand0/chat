import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const ChatModule = buildModule("chatModule", (m) => {
  const chat = m.contract("Chat");
  return { chat };
});



export default ChatModule;