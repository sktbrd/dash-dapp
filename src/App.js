import {
  React,
  useEffect,
  useState,

} from 'react';
import * as core from "@shapeshiftoss/hdwallet-core";
import {
  ChakraProvider,
  Box,
  Text,
  VStack,
  Grid,
  theme,
  Modal,
  Button,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Logo } from './Logo';
import { KeepKeySdk } from '@keepkey/keepkey-sdk'
let {
  bip32ToAddressNList
} = require('@pioneer-platform/pioneer-coins')
const pioneerApi = require("@pioneer-platform/pioneer-client")
const coinSelect = require('coinselect')

let spec = 'http://localhost:1646/spec/swagger.json'
let configKeepKey = {
  pairingInfo:{
    name: process.env['SERVICE_NAME'] || 'DASH',
    imageUrl: process.env['SERVICE_IMAGE_URL'] || 'https://assets.coincap.io/assets/icons/dash@2x.png',
    basePath:spec
  }
}

const configPioneer = {
  queryKey:'sdk:test-tutorial-medium',
  username:"dash-dapp",
  spec:"https://pioneers.dev/spec/swagger.json"
  // spec:"http://localhost:9001/spec/swagger.json"
}

function App() {
  const [address, setAddress] = useState('')
  const [xpub, setXpub] = useState('')
  const [balance, setBalance] = useState('0.000')
  const [amount, setAmount] = useState('0.00000000')
  const [toAddress, setToAddress] = useState('')
  const [txid, setTxid] = useState(null)
  const [signedTx, setSignedTx] = useState(null)
  const [keepkeyConnected, setKeepKeyConnected] = useState(false)
  const [keepkeyError, setKeepKeyError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  let onSend = async function(){
    try{

      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //init
      let sdk = await KeepKeySdk.create(configKeepKey)
      localStorage.setItem("apiKey",configKeepKey.apiKey);
      console.log("config: ",configKeepKey.apiKey)

      let inputs = await pioneer.ListUnspent({network:'DASH',xpub})
      inputs = inputs.data

      //balance check
      let amountOut = parseInt(amount * 100000000)
      console.log("amountOut: ",amountOut)
      let balanceSat = balance * 100000000
      if(amountOut >  balanceSat) throw new Error("Insufficient funds!")

      //prepare coinselect
      let utxos = []
      for(let i = 0; i < inputs.length; i++){
        let input = inputs[i]
        let utxo = {
          txId:input.txid,
          vout:input.vout,
          value:parseInt(input.value),
          nonWitnessUtxo: Buffer.from(input.hex, 'hex'),
          hex: input.hex,
          tx: input.tx,
          path:input.path
        }
        utxos.push(utxo)
      }
      if (utxos.length === 0) throw Error("101 YOUR BROKE! no UTXO's found! ")

      let outputs = [
        {
          address:toAddress,
          value: amountOut
        }
      ]

      //@TODO dont use flag fee
      // let feeRateInfo = await pioneer.GetFeeInfo({coin:"DASH"})
      // feeRateInfo = feeRateInfo.data
      // console.log("feeRateInfo: ",feeRateInfo)
      let feeRateInfo = 10

      //coinselect
      console.log("input coinSelect: ",{utxos, outputs, feeRateInfo})
      let selectedResults = coinSelect(utxos, outputs, feeRateInfo)
      console.log("result coinselect algo: ",selectedResults)

      //
      let inputsSelected = []
      for(let i = 0; i < selectedResults.inputs.length; i++){
        //get input info
        let inputInfo = selectedResults.inputs[i]
        console.log("inputInfo: ",inputInfo)
        let input = {
          addressNList:bip32ToAddressNList(inputInfo.path),
          scriptType:core.BTCInputScriptType.SpendAddress,
          amount:String(inputInfo.value),
          vout:inputInfo.vout,
          txid:inputInfo.txId,
          segwit:true,
          hex:inputInfo.hex
        }
        inputsSelected.push(input)
      }

      //get xpub for change addresses
      let path =
        {
          symbol: 'DASH',
          address_n: [0x80000000 + 44, 0x80000000 + 5, 0x80000000 + 0],
          coin: 'Bitcoin',
          script_type: 'p2pkh',
          showDisplay: false
        }

      let responsePubkeyChange = await sdk.system.info.getPublicKey(path)
      console.log("responsePubkeyChange: ", responsePubkeyChange)
      console.log("responsePubkeyChange: ", responsePubkeyChange.xpub)

      //get change address
      let changeAddyIndex = await pioneer.GetChangeAddress({network:'DASH',xpub:responsePubkeyChange.xpub})
      changeAddyIndex = changeAddyIndex.data.changeIndex
      console.log("changeAddyIndex: ",changeAddyIndex)

      let addressInfo = {
        addressNList: [0x80000000 + 44, 0x80000000 + 5, 0x80000000 + 0, 0, changeAddyIndex],
        coin: 'Dash',
        scriptType: 'p2pkh',
        showDisplay: false
      }

      let changeAddress = await sdk.address.utxoGetAddress({
        address_n: addressInfo.addressNList,
        script_type:addressInfo.scriptType,
        coin:addressInfo.coin
      })
      changeAddress = changeAddress.address
      console.log("changeAddress: ",changeAddress)

      const outputsFinal = []
      console.log("selectedResults.outputs: ",selectedResults.outputs)
      console.log("outputsFinal: ",outputsFinal)
      for(let i = 0; i < selectedResults.outputs.length; i++){
        let outputInfo = selectedResults.outputs[i]
        console.log("outputInfo: ",outputInfo)
        if(outputInfo.address){
          //not change
          let output = {
            address:toAddress,
            addressType:"spend",
            scriptType:core.BTCInputScriptType.SpendAddress,
            amount:String(outputInfo.value),
            isChange: false,
          }
          if(output.address)outputsFinal.push(output)
        } else {
          //change
          let output = {
            addressNList: addressInfo.addressNList,
            addressType:"spend",
            scriptType:core.BTCInputScriptType.SpendAddress,
            amount:String(outputInfo.value),
            isChange: true,
          }
          if(output.addressNList)outputsFinal.push(output)
        }
        console.log(i,"outputsFinal: ",outputsFinal)
      }


      let hdwalletTxDescription = {
        coin: 'Dash',
        inputs:inputsSelected,
        outputs:outputsFinal,
        version: 1,
        locktime: 0,
      }

      //signTx
      let signedTxTransfer = await sdk.utxo.utxoSignTransaction(hdwalletTxDescription)
      console.log("signedTxTransfer: ",signedTxTransfer)
      // signedTxTransfer = JSON.parse(signedTxTransfer)
      setSignedTx(signedTxTransfer.serializedTx)

    }catch(e){
      console.error("Error on send!",e)
    }
  }

  let onBroadcast = async function(){
    let tag = " | onBroadcast | "
    try{
      console.log("onBroadcast: ",onBroadcast)
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //broadcast TX
      let broadcastBodyTransfer = {
        network:"DASH",
        serialized:signedTx,
        txid:"unknown",
        invocationId:"unknown"
      }
      let resultBroadcastTransfer = await pioneer.Broadcast(null,broadcastBodyTransfer)
      resultBroadcastTransfer = resultBroadcastTransfer.data
      console.log("resultBroadcastTransfer: ",resultBroadcastTransfer)
      // resultBroadcastTransfer = resultBroadcastTransfer.data
      if(resultBroadcastTransfer.error){
        setError(resultBroadcastTransfer.error)
      }
      if(resultBroadcastTransfer.txid){
        setTxid(resultBroadcastTransfer.txid)
      }
    }catch(e){
      console.error(tag,e)
    }
  }

  let onStart = async function(){
    try{

      let apiKey = localStorage.getItem("apiKey");
      configKeepKey.apiKey = apiKey

      //init
      let sdk
      try{
        sdk = await KeepKeySdk.create(configKeepKey)
        localStorage.setItem("apiKey",configKeepKey.apiKey);
        console.log("config: ",configKeepKey.apiKey)
      }catch(e){
        setKeepKeyError('Bridge is offline!')
      }


      let path =
        {
          symbol: 'DASH',
          address_n: [0x80000000 + 44, 0x80000000 + 5, 0x80000000 + 0],
          coin: 'Bitcoin',
          script_type: 'p2pkh',
          showDisplay: false
        }

      let responsePubkey = await sdk.system.info.getPublicKey(path)
      console.log("responsePubkey: ", responsePubkey)
      console.log("responsePubkey: ", responsePubkey.xpub)
      setXpub(responsePubkey.xpub)

      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()

      //get balance DASH
      let balance = await pioneer.GetBalance({network:'DASH',xpub:responsePubkey.xpub})
      balance = balance.data
      setBalance(balance)

      //get new address
      let newAddyIndex = await pioneer.GetChangeAddress({network:'DASH',xpub:responsePubkey.xpub})
      newAddyIndex = newAddyIndex.data.changeIndex
      newAddyIndex = newAddyIndex + 1
      console.log("newAddyIndex: ",newAddyIndex)

      let addressInfo = {
        addressNList: [0x80000000 + 44, 0x80000000 + 5, 0x80000000 + 0, 0, newAddyIndex],
        coin: 'Dash',
        scriptType: 'p2pkh',
        showDisplay: false
      }

      let address = await sdk.address.utxoGetAddress({
        address_n: addressInfo.addressNList,
        script_type:addressInfo.scriptType,
        coin:addressInfo.coin
      })
      console.log("address: ",address)
      setAddress(address.address)
      setIsLoading(false)
    }catch(e){
      console.error(e)
    }
  }

  // onStart()
  useEffect(() => {
    onStart()
  }, []) //once on startup

  const handleInputChangeAmount = (e) => {
    const inputValue = e.target.value;
    setAmount(inputValue);
  };

  const handleInputChangeAddress = (e) => {
    const inputValue = e.target.value;
    setToAddress(inputValue);
  };

  return (
    <ChakraProvider theme={theme}>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Sending Dash</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <div>
              amount: <input type="text"
                              name="amount"
                              value={amount}
                              onChange={handleInputChangeAmount}/>
            </div>
            <br/>
            <div>
              address: <input type="text"
                              name="address"
                              value={toAddress}
                              placeholder="XwNbd46qdmbVWLdXievBhBMW7JYy8WiE7n"
                              onChange={handleInputChangeAddress}
            />
            </div>
            <br/>
            {error ? <div>error: {error}</div> : <div></div>}
            {txid ? <div>txid: <a href={'https://blockchair.com/dash/transaction/?'+txid}>{txid}</a></div> : <div></div>}
            {txid ? <div></div> : <div>
              {signedTx ? <div>signedTx: {signedTx}</div> : <div></div>}
            </div>}

          </ModalBody>
          
          <ModalFooter>
            {!signedTx ? <div>
              <Button colorScheme='green' mr={3} onClick={onSend}>
                Send
              </Button>
            </div> : <div></div>}
            {!txid ? <div>
              {signedTx ? <div>
                <Button colorScheme='green' mr={3} onClick={onBroadcast}>
                  broadcast
                </Button>
              </div> : <div></div>}
            </div> : <div></div>}
            <Button colorScheme='blue' mr={3} onClick={onClose}>
              exit
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Box textAlign="center" fontSize="xl">
        <Grid minH="100vh" p={3}>
          <ColorModeSwitcher justifySelf="flex-end" />
          <VStack spacing={8}>
            {keepkeyError ? <div>KeepKey not online! <a href='https://www.keepkey.com/'>Download KeepKey Desktop.</a></div> : <div></div>}
            {keepkeyConnected ? <div>loading KeepKey....</div> : <div></div>}
            {isLoading ? <div>loading...</div> : <div>
              <Logo h="40vmin" pointerEvents="none" />
              <Text>
                address: {address}
              </Text>
              <Text>
                balance: {balance}
              </Text>
              <Button onClick={onOpen}>Send Freaking Dash</Button>
            </div>}
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
