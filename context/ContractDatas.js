import { ethers } from "ethers";
import StakingDappABI from "./StakingDapp.json";
import TokenICO from "./TokenICO.json";
import CustomTokenABI from "./ERC20.json";
import DepositTokenABI from "./DepositTokenABI.json";
import RewardTokenABI from "./RewardTokenABI.json"

const STAKING_DAPP_ADDRESS = process.env.NEXT_PUBLIC_STAKING_DAPP;
const TOKEN_ICO = process.env.NEXT_PUBLIC_TOKEN_ICO;
const DEPOSIT_TOKEN = process.env.NEXT_PUBLIC_DEPOSIT_TOKEN;
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN;


export function toEth(amount, decimals = 18) {
    const toEth = ethers.utils.formatUnits(amount, decimals);
    return toEth.toString();
}

export function toWei(amount) {
    const toWei = ethers.utils.parseUnits(amount.toSting());
    return toWei.toString();
}

export const DepositTokenContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    //checking whether the ethereum object exists in the browser
    if (ethereum) {
        const signer = provider.getSigner();
        //getting the contract object
        const contractReader = new ethers.Contract(
            DEPOSIT_TOKEN, DepositTokenABI.abi, signer
        )

        return contractReader;
    }
}

export const rewardTokenContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    //checking whether the ethereum object exists in the browser
    if (ethereum) {
        const signer = provider.getSigner();
        //getting the contract object
        const contractReader = new ethers.Contract(
            REWARD_TOKEN, RewardTokenABI.abi, signer
        )

        return contractReader;
    }
}

export const stakingContract = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    if (ethereum) {
        const signer = provider.getSigner();
        const contractReader = new ethers.Contract(
            STAKING_DAPP_ADDRESS, StakingDappABI.abi, signer
        )

        return contractReader;
    }
}

export const ERC20Contract = async (address, userAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    if (ethereum) {
        const signer = provider.getSigner();
        //getting the contract object
        const contractReader = new ethers.Contract(
            address, DepositTokenABI.abi, signer
        )

        const token = {
            name: await contractReader.name(),
            symbol: await contractReader.symbol(),
            address: contractReader.address,
            totalSupply: toEth(await contractReader.totalSupply()),
            balance: toEth(await contractReader.balanceOf(userAddress)),
            contractTokenBalance: toEth(await contractReader.balanceOf(STAKING_DAPP_ADDRESS))
        }

        return token;
    }

}


export const TOKEN_ICO_CONTRACT = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    //checking whether the ethereum object exists in the browser
    if (ethereum) {
        const signer = provider.getSigner();
        //getting the contract object
        const contractReader = new ethers.Contract(
            TOKEN_ICO, TokenICO.abi, signer
        )

        return contractReader;
    }
}

export const DEPOSIT_TOKEN_USER_INFO = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const { ethereum } = window;
    try {
        if (ethereum) {
            const signer = provider.getSigner();
            //getting the contract object
            const contractReader = new ethers.Contract(
                DEPOSIT_TOKEN, DepositTokenABI.abi, signer
            )

            const userAddress = await signer.getAddress();
            const walletBalance = await signer.getBalance();
            const balance = await contractReader.balanceOf(userAddress);

            const token = {
                address: await contractReader.address,
                name: await contractReader.name(),
                symbol: await contractReader.symbol(),
                decimals: await contractReader.decimals(),
                supply: toEth(await contractReader.totalSupply()),
                balance: toEth(balance),
                nativeBalance: toEth(walletBalance.toString())
            }

            return token;
        }

    } catch (error) {
        console.log(error);

    }

}




export const LOAD_TOKEN_ICO = async () => {
    try {
        const contract = await TOKEN_ICO_CONTRACT();
        const tokenAddress = await contract.tokenAddress();

        const ZERO_ADDRESS = 0x0000000000000000000000000000000000000000;
        if (tokenAddress != ZERO_ADDRESS) {
            const tokenDetails = await contract.getTokenDetails();
            const contractOwner = await contract.owner();
            const soldTokens = await contract.soldTokens();


            const ICO_TOKEN_USER_INFO = await DEPOSIT_TOKEN_USER_INFO();

            const token = {
                tokenBalance: ethers.utils.formatEther(tokenDetails.balance.toString()),
                name: tokenDetails.name,
                symbol: tokenDetails.symbol,
                supply: ethers.utils.formatEther(tokenDetails.supply.toString()),
                tokenPrice: ethers.utils.formatEther(tokenDetails.tokenPrice.toString()),
                tokenAddr: tokenDetails.tokenAddr,
                owner: contractOwner.toLowerCase(),
                soldTokens: soldTokens.toNumber(),
                token: ICO_TOKEN_USER_INFO
            }

            return token;
        }
    } catch (error) {
        console.log(error);

    }
}