require("@nomiclabs/hardhat-waffle");

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
    solidity: "0.7.0",

    defaultNetwork: 'localhost',
    networks: {
        hardhat: {},
        localhost: {},
    }
};

