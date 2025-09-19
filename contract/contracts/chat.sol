// SPDX-License-Identifier: MIT
pragma solidity 0.8.30;


import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";
// /**
//  * @title GodbrandChat
//  * @dev A minimal chat dApp smart contract for classroom assignment
//  * Handles user registration with ENS-like usernames and IPFS profile images,
//  * global group chat, and private chat. Messages are stored on-chain as IPFS hashes.
//  */
contract Chat {

        AggregatorV3Interface internal dataFeed;
    constructor() {
        dataFeed = AggregatorV3Interface(
           0x5fb1616F78dA7aFC9FF79e0371741a747D2a7F22
        );
    }
    
    // State variables for user management
    mapping(string => address) private nameToAddress;
    mapping(address => string) private addressToName;
    mapping(address => string) private profilePic;
    int public btcEth;
    
    // Events for frontend to listen to
    event UserRegistered(address indexed user, string username, string profilePicHash);
    event MessageSent(address indexed from, address indexed to, string ipfsHash);
    event PriceFetched(int256 price, uint256 timestamp);
    
    // Modifiers
    modifier onlyRegistered() {
        require(bytes(addressToName[msg.sender]).length > 0, "User not registered");
        _;
    }
    
    modifier validUsername(string memory _name) {
        require(bytes(_name).length > 0, "Username cannot be empty");
        require(bytes(_name).length <= 20, "Username too long");
        _;
    }
    
    /**
     * @dev Register a new user with username and profile picture
     * @param _name The desired username (without .godbrand suffix)
     * @param _profilePicHash IPFS hash of the profile picture
     */


      
    function register(string memory _name, string memory _profilePicHash) 
        public  
        validUsername(_name) 
    {
        // Check if user is already registered
        require(bytes(addressToName[msg.sender]).length == 0, "User already registered");
        
        // Create full username with .godbrand suffix
        string memory fullUsername = string(abi.encodePacked(_name, ".godbrand"));
        
        // Check if username is already taken
        require(nameToAddress[fullUsername] == address(0), "Username already taken");
        
        // Validate profile picture hash
        require(bytes(_profilePicHash).length > 0, "Profile picture hash cannot be empty");
        
        // Register the user
        nameToAddress[fullUsername] = msg.sender;
        addressToName[msg.sender] = fullUsername;
        profilePic[msg.sender] = _profilePicHash;
        
        // Emit registration event
        emit UserRegistered(msg.sender, fullUsername, _profilePicHash);
    }
    
    /**
     * @dev Get the caller's profile information
     * @return username The user's full username with .godbrand suffix
     * @return profilePicHash The IPFS hash of the user's profile picture
     */
    function getMyProfile() public  view returns (string memory username, string memory profilePicHash) {
        require(bytes(addressToName[msg.sender]).length > 0, "User not registered");
        return (addressToName[msg.sender], profilePic[msg.sender]);
    }
    
    /**
     * @dev Send a message to the global chat
     * @param _ipfsHash IPFS hash of the message content
     */
    function sendGlobalMessage(string memory _ipfsHash) public  onlyRegistered {
        require(bytes(_ipfsHash).length > 0, "Message hash cannot be empty");
        
        // Emit message event with address(0) as recipient for global chat
        emit MessageSent(msg.sender, address(0), _ipfsHash);
    }
    
    /**
     * @dev Send a private message to another user
     * @param _to Address of the recipient
     * @param _ipfsHash IPFS hash of the message content
     */
    function sendPrivateMessage(address _to, string memory _ipfsHash) public onlyRegistered {
        require(_to != address(0), "Invalid recipient address");
        require(_to != msg.sender, "Cannot send message to yourself");
        require(bytes(addressToName[_to]).length > 0, "Recipient not registered");
        require(bytes(_ipfsHash).length > 0, "Message hash cannot be empty");
        
        // Emit message event with specific recipient address
        emit MessageSent(msg.sender, _to, _ipfsHash);
    }
    
    /**
     * @dev Get user's profile by address
     * @param _user Address of the user
     * @return username The user's full username with .godbrand suffix
     * @return profilePicHash The IPFS hash of the user's profile picture
     */
    function getUserProfile(address _user) 
        public 
        view 
        returns (string memory username, string memory profilePicHash) 
    {
        require(bytes(addressToName[_user]).length > 0, "User not registered");
        return (addressToName[_user], profilePic[_user]);
    }
    
    /**
     * @dev Check if a username is available
     * @param _name The username to check (without .godbrand suffix)
     * @return available True if username is available, false otherwise
     */
    function isUsernameAvailable(string memory _name) public view returns (bool available) {
        string memory fullUsername = string(abi.encodePacked(_name, ".godbrand"));
        return nameToAddress[fullUsername] == address(0);
    }
    
    /**
     * @dev Get address by username
     * @param _username Full username with .godbrand suffix
     * @return userAddress Address of the user, or address(0) if not found
     */
    function getAddressByUsername(string memory _username) public view returns (address userAddress) {
        return nameToAddress[_username];
    }
    
    /**
     * @dev Check if an address is registered
     * @param _user Address to check
     * @return registered True if user is registered, false otherwise
     */
    function isRegistered(address _user) public view returns (bool registered) {
        return bytes(addressToName[_user]).length > 0;
    }

    function getChainlinkDataFeedLatestAnswer() public returns (int) {
        // prettier-ignore
        (
            /* uint80 roundId */,
            int256 answer,
            /*uint256 startedAt*/,
            /*uint256 updatedAt*/,
            /*uint80 answeredInRound*/
        ) = dataFeed.latestRoundData();
          btcEth = answer;
        emit PriceFetched(answer, block.timestamp);
        
        return answer;
      
    }
}