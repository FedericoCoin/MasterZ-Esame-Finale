require('@nomicfoundation/hardhat-toolbox');
require("@nomicfoundation/hardhat-chai-matchers");
require('@openzeppelin/hardhat-upgrades');
require('dotenv').config();
require("hardhat-gas-reporter");


module.exports = {
    solidity: {
        version: '0.8.24',
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        hardhat: {},
        dashboard: {
            url: "http://localhost:24012/rpc"
        },
        amoy: {
            chainId: 80002,
            url: "https://rpc-amoy.polygon.technology"
        },
        sepolia: {
            url: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
            accounts: [process.env.PRIVATE_KEY],
            chainId: 11155111,
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
            sepolia: process.env.ETHERSCAN_KEY,
            goerli: process.env.ETHERSCAN_KEY,
            amoy: process.env.POLYGONSCAN_KEY
        }
    }
};