//here we will write all the functions which will allow us to write the data in the smart contract
import { BigNumber, ethers } from "ethers";
import { useToast } from "@/hooks/use-toast";
import { toEth, depositTokenContract, rewardTokenContract ,stakingContract,ERC20Contract, TOKEN_ICO_CONTRACT } from "./constants";
const { toast } = useToast()
const STAKING_DAPP_ADDRESS = process.env.NEXT_PUBLIC_STAKING_DAPP;
const DEPOSIT_TOKEN = process.env.NEXT_PUBLIC_DEPOSIT_TOKEN;
const REWARD_TOKEN = process.env.NEXT_PUBLIC_REWARD_TOKEN;
const TOKEN_LOGO = process.env.NEXT_PUBLIC_TOKEN_LOGO;

//need toast here

const notifySuccess = (msg)=>{
    toast({
        title: "Success",
        description: msg,
        variant: "success", // Use shadcn-ui's variants if available
        duration: 2000,
    });
}

const notifyError = (msg) => {
    toast({
        title: "Error",
        description: msg,
        variant: "error", // Use shadcn-ui's variants if available
        duration: 2000,
    });
};

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


export const deposit = async (poolID,amount,address)=>{
    try {
        notifySuccess("Calling contract...");
        const contractInstance = await stakingContract();
        const dptContractInstance = await depositTokenContract()
        const amountInWei = ethers.utils.parseUnits(amount.toString(), 18);
        const currentAllowance = await dptContractInstance.allowance(address, contractInstance.address);

        if(currentAllowance.lt(amountInWei)){
            notifySuccess("Approving token....")
            const approveTx = await dptContractInstance.approve(contractInstance.address,amountInWei)

            await approveTx.wait()
            console.log(`Approved ${amountInWei.toString()} tokens for staking`);
        }

        const gasEstimation = await contractInstance.estimateGas.deposit(Number(poolID),amountInWei)
        notifySuccess("Staking token call....")
        const stakeTx = await contractInstance.deposit(poolID,amountInWei,{gasLimit:gasEstimation})

        const receipt = await stakeTx.wait()
        notifySuccess("Token Staked Successfully...")
        return receipt
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error)
        
    }
}


export const transferToken = async(amount,transferAddress)=>{
    try {
        notifySuccess("calling contract token...")
        const rewardTokenInstance = await rewardTokenContract()
        const transferAmount = ethers.utils.parseEther(amount)

        const approveTx = await rewardTokenInstance.transfer(transferAddress,transferAmount)

        const receipt = await approveTx.wait()
        notifySuccess("Token transfered successfully")
        return receipt
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg);
    }
}


export const withDraw = async(poolID,amount)=>{
    try {
        notifySuccess("Calling Contract....")
        const amountInWei = ethers.utils.parseUnits(amount.toString(), 18)
        const contractInstance = await stakingContract();

        const gasEstimation = await contractInstance.estimateGas.withDraw(
            Number(poolID),amountInWei
        )

        const data = await contractInstance.withDraw(Number(poolID),amountInWei,{
            gasLimit:gasEstimation
        })

        const receipt = await data.wait()
        notifySuccess("transaction successfully completed")
        return receipt;
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg);
    }
}

export const claimReward = async(poolID)=>{
    try {
        notifySuccess("Calling contract...")
        const contractInstance = await stakingContract();
        const gasEstimation = await contractInstance.estimateGas.claimReward(
            Number(poolID)
        )

        const data = await contractInstance.claimReward(Number(poolID), {
            gasLimit: gasEstimation,
        })

        const receipt = await data.wait();
        notifySuccess("Reward Claim successfully completed")
        return receipt;
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg)
    }
}

export const createPool = async(pool)=>{
    try {
        const { _depositToken, _rewardToken, _apy, _lockDays } = pool;
        if (!_depositToken || !_rewardToken || !_apy || !_lockDays) return notifyError("Provide all the details");
        notifySuccess("Calling contract...")
        const contractInstance = await stakingContract();
        const gasEstimation = await contractInstance.estimateGas.addPool(
            _depositToken, _rewardToken, Number(_apy), Number(_lockDays)
        )

        const addPoolTx = await contractInstance.addPool(_depositToken, _rewardToken, Number(_apy), Number(_lockDays), {
            gasLimit: gasEstimation,
        })

        const receipt = await addPoolTx.wait();
        notifySuccess("Pool Creation successfully")
        return receipt;
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg)
    }
}

export const modifyPool = async(poolID,amount)=>{
    try {
        notifySuccess("Calling contract...")
        const contractInstance = await stakingContract();
        const gasEstimation = await contractInstance.estimateGas.modifyPool(
            Number(poolID), Number(amount)
        )

        const data = await contractInstance.modifyPool(Number(poolID), Number(amount), {
            gasLimit: gasEstimation,
        })

        const receipt = await data.wait();
        notifySuccess("Pool Modified successfully completed")
        return receipt;
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg)
    }
}

export const sweep = async(tokenData)=>{
    try {
        const { token, amount } = tokenData;
        if (!token || !amount) return notifyError("Data is missing")

        notifySuccess("Calling contract...");
        const contractInstance = await stakingContract();
        const transferAmount = ethers.utils.parseEther(amount);

        const gasEstimation = await contractInstance.estimateGas.sweep(
            token, transferAmount
        )

        const data = await contractInstance.sweep(token, transferAmount, { gasLimit: gasEstimation })

        const receipt = await data.wait()
        notifySuccess("transaction completed successfully")
        return receipt;
    } catch (error) {
        console.log(error);
        const errorMsg = parseErrorMsg(error);
        notifyError(errorMsg)
    }
}

export const addTokenMetaMask = async () => {
    if (window.ethereum) {
        const contractInstance = await depositTokenContract()
        const tokenDecimals = await contractInstance.decimals()
        const tokenAddress = contract.address;
        const tokenSymbol = await contractInstance.symbol()

        const tokenImage = TOKEN_LOGO;

        try {
            const wasAdded = await window.ethereum.request({
                method: "wallet_watchAsset",
                params: {
                    type: "ERC20",
                    options: {
                        address: tokenAddress,
                        symbol: tokenSymbol,
                        decimals: tokenDecimals,
                        image: tokenImage,
                    }
                }
            })

            if (wasAdded) {
                notifySuccess("Token Added");
            } else {
                notifyError("Failed to add Token")
            }
        } catch (error) {
            notifyError("Failed to add token");
        }
    } else {
        notifyError("MetaMask is not installed");
    }
}

export const BUY_TOKEN = async(amount)=>{
    try {
        notifySuccess("calling ico contract")
        const contract = await TOKEN_ICO_CONTRACT();
        const tokenDetails = await contract.getTokenDetails()

        const availableToken = ethers.utils.formatEther(
            tokenDetails.balance.toString()
        )

        if (availableToken > 1) {
            const price = ethers.utils.formatEther(tokenDetails.tokenPrice.toString()) * Number(amount)
            const payAmount = ethers.utils.parseUnits(price.toString(), "ether");

            const transaction = await contract.buyToken(Number(amount), {
                value: payAmount.toString(),
                gasLimit: ethers.utils.hexlify(8000000)
            })

            const receipt = await transaction.wait()
            notifySuccess("Transaction Successfully completed")
            return receipt
        } else {
            notifyError("Token Balance is lower than expected")
            return "receipt"
        }

    } catch (error) {
        
    }
}


