import { useState } from "react"
import "./App.css"
import Web3 from "web3"
import Loader from "./components/Loader"

function ConnectButton({ onClick }) {
  return <button onClick={onClick}>Connect Wallet</button>
}

const AccountDetails = ({ ethBalance, walletAddress, usdtBalance }) => {
  return (
    <>
      <div className='details'>
        {ethBalance.substring(0, 5)} ETH
        <div className='details_address'>{walletAddress.substring(0, 8)}</div>
      </div>
      <div className='details'>
        USDT
        <div className='details_address'>{usdtBalance}</div>
      </div>
    </>
  )
}
function App() {
  const [walletAddress, setWalletAddress] = useState("")
  const [ethBalance, setEthBalance] = useState("")
  const [usdtBalance, setUsdtBalance] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [provider, setProvider] = useState("")

  const projectId = import.meta.env.VITE_PROJECT_ID
  const infuraUrl = `${import.meta.env.VITE_INFURA_URL}${projectId}`

  const connectWallet = async (currentProvider) => {
    try {
      await window.ethereum.request({ method: "eth_requestAccounts" })
      const web3 = new Web3(currentProvider)
      const accounts = await web3.eth.getAccounts()

      if (accounts.length === 0) {
        setError("No accounts found, check connection!")
        return
      }
      const account = accounts[0]
      setWalletAddress(account)
      setIsConnected(true)

      // Get ETH balance
      const ethBalance = await web3.eth.getBalance(account)
      setEthBalance(
        parseFloat(web3.utils.fromWei(ethBalance, "ether")).toFixed(3)
      )

      // Get USDT balance (using USDT contract address)
      const usdtContract = new web3.eth.Contract(
        [
          {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "balance", type: "uint256" }],
            type: "function"
          }
        ],
        import.meta.env.VITE_USDT_WALLET_ADDRESS
      )

      const usdtBalance = await usdtContract.methods.balanceOf(account).call()
      setUsdtBalance(web3.utils.fromWei(usdtBalance, "mwei")) // USDT has 6 decimals
    } catch (error) {
      console.error(error)
    }
  }

  const detectCurrentProvider = () => {
    let provider
    if (window.ethereum) {
      provider = window.ethereum
    } else if (window.web3) {
      provider = window.web3.currentProvider
    } else {
      alert("MetaMask is not installed!")
    }
    return provider
  }

  const onConnect = async () => {
    try {
      //delay
      setIsLoading(true)
      setTimeout(() => {
        setIsLoading(false)
      }, 3000)

      let currentProvider = detectCurrentProvider()

      if (provider === "infura") {
        currentProvider = new Web3.providers.HttpProvider(infuraUrl)
      }
      if (currentProvider) {
        connectWallet(currentProvider)
      }
    } catch (error) {
      console.log(error)
    }
  }

  if (error) {
    return <div>{error}</div>
  }
  return (
    <>
      <div className='app_header'>
        <input
          type='radio'
          name='provider'
          onClick={() => setProvider("infura")}
        />
        <label htmlFor='provider'>Infura</label>
      </div>
      {!isConnected ? (
        <ConnectButton onClick={onConnect} />
      ) : isLoading ? (
        <Loader />
      ) : (
        <AccountDetails
          ethBalance={ethBalance}
          walletAddress={walletAddress}
          usdtBalance={usdtBalance}
        />
      )}
    </>
  )
}

export default App
