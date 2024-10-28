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

export const copyAddress = (text) => {
    navigator.clipboard.writeText(text);
    notifySuccess("Copied Successfully");
}


export async function STAKING_CONTRACT_DATA(address) {
    try {
        const contractInstance = await stakingContract(); //returning the datas of the StakingDapp datas
        // const stakingTokenObj = await tokenContract();

        if (address) {
            const contractOwner = await contractInstance.owner();
            const contractAddress = await contractInstance.address;

            //notification

            const notification = await contractInstance.getNotifications();

            const _notificationsArray = await Promise.all(
                notification.map(async ({ poolID, amount, user, typeOf, timeStamp }) => {
                    return {
                        poolID: poolID.toNumber(),
                        amount: toEth(amount),
                        user: user,
                        typeOf: typeOf,
                        timeStamp: CONVERT_TIMESTAMP_TO_READABLE(timeStamp)
                    }
                })
            )

            let poolInfoArray = [];
            const poolLength = await contractInstance.poolCount();

            const length = poolLength.toNumber();

            for (let i = 0; i < length; i++) {
                const poolInfo = await contractInstance.poolInfo(i);
                const userInfo = await contractInstance.userInfo(i, address);

                const userReward = await contractInstance.pendingReward(i, address);
                const tokenPoolInfoA = await ERC20Contract(poolInfo.depositToken, address);
                const tokenPoolInfoB = await ERC20Contract(poolInfo.rewardToken, address);

                // console.log(poolInfo);

                const pool = {
                    depositTokenAddress: poolInfo.depositToken,
                    rewardTokenAddress: poolInfo.rewardToken,
                    depositToken: tokenPoolInfoA,
                    rewardToken: tokenPoolInfoB,

                    despositedAmount: toEth(poolInfo.depositedAmount.toString()),
                    apy: poolInfo.apy.toString(),
                    lockDays: poolInfo.lockDays.toString(),
                    amount: toEth(userInfo.amount.toString()),
                    userReward: toEth(userReward),
                    lockUntil: CONVERT_TIMESTAMP_TO_READABLE(userInfo.lockUntil.toNumber()),
                    lastRewardAt: toEth(userInfo.lastRewardAt.toString())

                }

                poolInfoArray.push(pool)
            }


            const totalDepositedAmount = poolInfoArray.reduce((total, pool) => {
                return total + parseFloat(pool.despositedAmount)
            }, 0)

            const rewardToken = await ERC20Contract(REWARD_TOKEN, address);
            const depositToken = await ERC20Contract(DEPOSIT_TOKEN, address);
            console.log(depositToken);

            const data = {
                contractOwner: contractOwner,
                contractAddress: contractAddress,
                notifications: _notificationsArray.reverse(),
                rewardToken: rewardToken,
                depositToken: depositToken,
                poolInfoArray: poolInfoArray,
                totalDepositedAmount: totalDepositedAmount,
                contractTokenBalance: rewardToken.contractTokenBalance - totalDepositedAmount,

            };

            return data;
        }
    } catch (error) {
        console.log(error);
        console.log(parseErrorMsg(error));
        return parseErrorMsg(error)

    }
}


export const deposit = (poolID,amount,address)=>{
    try {
        
    } catch (error) {
        
    }
}