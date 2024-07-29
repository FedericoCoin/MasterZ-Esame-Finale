require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

module.exports = {
    solidity: {
        version: '0.8.20',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {},
        amoy: {
            chainId: 80002,
            url: "https://rpc-amoy.polygon.technology"
        },
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY]
          },
        goerli: {
            chainId: 5,
            url: "https://ethereum-goerli.publicnode.com"
        }
    },
    docgen: {
        sourcesDir: 'contracts',
        outputDir: 'documentation',
        templates: 'templates',
        pages: 'files',
        clear: true,
        runOnCompile: true
    },
    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_KEY
        }
      }
};





