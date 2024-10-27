//here we will write all the functions which will allow us to write the data in the smart contract
import { BigNumber, ethers } from "ethers";
import toast from "react-hot-toast";

import { toEth, DepositTokenContract, rewardTokenContract ,stakingContract,ERC20Contract, TOKEN_ICO_CONTRACT } from "./constants";

const STAKING_DAPP_ADDRESS = process.env.NEXT_PUBLIC_STAKING_DAPP;
const DEPOSIT_TOKEN = process.env.NEXT_PUBLIC_DEPOSIT_TOKEN;
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN;
const TOKEN_LOGO = process.env.NEXT_PUBLIC_TOKEN_LOGO;

//need toast here

function CONVERT_TIMESTAMP_TO_READABLE(timeStamp) {
    const date = new Date(timeStamp * 1000)
    const readableTime = date.toLocaleDateString("es-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
    })

    return readableTime
}

function parseErrorMsg(e) {
    const json = JSON.parse(JSON.stringify(e));
    return json?.reason || json?.error?.message;
}

export const SHORTEN_ADDRESS = (address) => `${address?.slice(0, 8)}...${address?.slice(address.length - 4)}`;