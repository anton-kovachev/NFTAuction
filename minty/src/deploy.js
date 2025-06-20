const fs = require('fs/promises')
const {F_OK} = require('fs')

const inquirer = require('inquirer')
const config = require('getconfig')

const MINTY_CONTRACT_NAME = "Minty"
const AUCTION_CONTRACT_NAME = "Auction"

async function deployContract(name, symbol) {
    const hardhat = require('hardhat')
    const network = hardhat.network.name

    console.log(`deploying contract for token ${name} (${symbol}) to network "${network}"...`)
    const Minty = await hardhat.ethers.getContractFactory(MINTY_CONTRACT_NAME)
    const minty = await Minty.deploy(name, symbol)
    await minty.deployed()

    const Auction = await hardhat.ethers.getContractFactory(AUCTION_CONTRACT_NAME)
    const auction = await Auction.deploy();
    await auction.deployed();

    console.log(`deployed contract for token ${name} (${symbol}) to ${minty.address} (network: ${network})`);

    const mintyDeploymentInfo = deploymentInfo(hardhat, MINTY_CONTRACT_NAME, minty);
    await saveDeploymentInfo(mintyDeploymentInfo, "./abi/minty.json")

    const auctionDeploymentInfo = deploymentInfo(hardhat, AUCTION_CONTRACT_NAME, auction);
    await saveDeploymentInfo(auctionDeploymentInfo, "./abi/auction.json")
}

function deploymentInfo(hardhat, contractName, contract) {
    return {
        network: hardhat.network.name,
        contract: {
            name: contractName,
            address: contract.address,
            signerAddress: contract.signer.address,
            abi: contract.interface.format(),
        },
    }
}

async function saveDeploymentInfo(info, filename = undefined) {
    if (!filename) {
        filename = config.deploymentConfigFile || 'minty-deployment.json'
    }
    const exists = await fileExists(filename)
    if (exists) {
        const overwrite = await confirmOverwrite(filename)
        if (!overwrite) {
            return false
        }
    }

    console.log(`Writing deployment info to ${filename}`)
    const content = JSON.stringify(info, null, 2)
    await fs.writeFile(filename, content, {encoding: 'utf-8'})
    return true
}

async function loadDeploymentInfo() {
    let {deploymentConfigFile} = config
    if (!deploymentConfigFile) {
        console.log('no deploymentConfigFile field found in minty config. attempting to read from default path "./minty-deployment.json"')
        deploymentConfigFile = 'minty-deployment.json'
    }
    const content = await fs.readFile(deploymentConfigFile, {encoding: 'utf8'})
    deployInfo = JSON.parse(content)
    try {
        validateDeploymentInfo(deployInfo)
    } catch (e) {
        throw new Error(`error reading deploy info from ${deploymentConfigFile}: ${e.message}`)
    } 
    return deployInfo
}

function validateDeploymentInfo(deployInfo) {
    const {contract} = deployInfo
    if (!contract) {
        throw new Error('required field "contract" not found')
    }
    const required = arg => {
        if (!deployInfo.contract.hasOwnProperty(arg)) {
            throw new Error(`required field "contract.${arg}" not found`)
        }
    }

    required('name')
    required('address')
    required('abi')
}

async function fileExists(path) {
    try {
        await fs.access(path, F_OK)
        return true
    } catch (e) {
        return false
    }
}

async function confirmOverwrite(filename) {
    const answers = await inquirer.prompt([
        {
            type: 'confirm',
            name: 'overwrite',
            message: `File ${filename} exists. Overwrite it?`,
            default: false,
        }
    ])
    return answers.overwrite
}

deployContract("TON", "TN").then(() => {
    console.log("Contracts deployed")
}).catch((err) => console.log(err))

module.exports = {
    deployContract,
    loadDeploymentInfo,
    saveDeploymentInfo,
}
