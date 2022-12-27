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

function App() {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0.000')
  const [amount, setAmount] = useState('0.00000000')
  const [toAddress, setToAddress] = useState('')
  const [inputs, setInputs] = useState([])
  const [pioneer, setPioneer] = useState("")
  const [error, setError] = useState("")

  const { isOpen, onOpen, onClose } = useDisclosure()

  let onSend = async function(){
    try{
      // const configPioneer = {
      //   queryKey:'sdk:test-tutorial-medium',
      //   username:"dash-dapp",
      //   //spec:"https://pioneers.dev/spec/swagger.json"
      //   spec:"http://localhost:9001/spec/swagger.json"
      // }
      // let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      // pioneer = await pioneer.init()
      //
      // //
      // console.log("Sending Dash!")
      // console.log("inputs: ",inputs)
      // console.log("toAddress: ",toAddress)
      // console.log("amount: ",amount)
      //
      // //balance check
      // let amountOut = parseInt(amount * 100000000)
      // console.log("amountOut: ",amountOut)
      // let balanceSat = balance * 100000000
      // if(amountOut >  balanceSat) throw new Error("Insufficient funds!")
      //
      // //prepare coinselect
      // let utxos = []
      // for(let i = 0; i < inputs.length; i++){
      //   let input = inputs[i]
      //   let utxo = {
      //     txId:input.txid,
      //     vout:input.vout,
      //     value:parseInt(input.value),
      //     nonWitnessUtxo: Buffer.from(input.hex, 'hex'),
      //     hex: input.hex,
      //     tx: input.tx,
      //     path:input.path
      //   }
      //   utxos.push(utxo)
      // }
      // if (utxos.length === 0) throw Error("101 YOUR BROKE! no UTXO's found! ")
      //
      // let outputs = [
      //   {
      //     address:toAddress,
      //     value: amountOut
      //   }
      // ]
      //
      // // let feeRateInfo = await pioneer.GetFeeInfo({coin:"DASH"})
      // // feeRateInfo = feeRateInfo.data
      // // console.log("feeRateInfo: ",feeRateInfo)
      // let feeRateInfo = 10
      //
      // //coinselect
      // console.log("input coinSelect: ",{utxos, outputs, feeRateInfo})
      // let selectedResults = coinSelect(utxos, outputs, feeRateInfo)
      // console.log("result coinselect algo: ",selectedResults)
      //
      // //
      // let inputs = []
      // for(let i = 0; i < selectedResults.inputs.length; i++){
      //   //get input info
      //   let inputInfo = selectedResults.inputs[i]
      //   console.log("inputInfo: ",inputInfo)
      //   let input = {
      //     addressNList:bip32ToAddressNList(inputInfo.path),
      //     scriptType:core.BTCInputScriptType.SpendWitness,
      //     amount:String(inputInfo.value),
      //     vout:inputInfo.vout,
      //     txid:inputInfo.txId,
      //     segwit:false,
      //     hex:inputInfo.hex,
      //     tx:inputInfo.tx
      //   }
      //   inputs.push(input)
      // }
      //
      // const outputsFinal = []
      // console.log("selectedResults.outputs: ",selectedResults.outputs)
      // console.log("outputsFinal: ",outputsFinal)
      // for(let i = 0; i < selectedResults.outputs.length; i++){
      //   let outputInfo = selectedResults.outputs[i]
      //   console.log("outputInfo: ",outputInfo)
      //   if(outputInfo.address){
      //     //not change
      //     let output = {
      //       address:toAddress,
      //       addressType:"spend",
      //       scriptType:core.BTCInputScriptType.SpendWitness,
      //       amount:String(outputInfo.value),
      //       isChange: false,
      //     }
      //     if(output.address)outputsFinal.push(output)
      //   } else {
      //     //change
      //     let output = {
      //       address:changeAddress,
      //       addressType:"spend",
      //       scriptType:core.BTCInputScriptType.SpendWitness,
      //       amount:String(outputInfo.value),
      //       isChange: true,
      //     }
      //     if(output.address)outputsFinal.push(output)
      //   }
      //   console.log(i,"outputsFinal: ",outputsFinal)
      // }
      //
      // let hdwalletTxDescription = {
      //   coin: 'Bitcoin',
      //   inputs,
      //   outputs:outputsFinal,
      //   version: 1,
      //   locktime: 0,
      // }
      //
      // //signTx
      // console.log("**** hdwalletTxDescription: ",hdwalletTxDescription)
      // let signedTxTransfer = await window['wallet'].btcSignTx(hdwalletTxDescription)
      // console.log("signedTxTransfer: ",signedTxTransfer)
      //
      //
      // //broadcast TX
      // let broadcastBodyTransfer = {
      //   network:"BTC",
      //   serialized:signedTxTransfer.serializedTx,
      //   txid:"unknown",
      //   invocationId:"unknown"
      // }
      // let resultBroadcastTransfer = await pioneer.instance.Broadcast(null,broadcastBodyTransfer)
      // console.log("resultBroadcast: ",resultBroadcastTransfer)

    }catch(e){
      console.error(e)
      setError(e.message)
    }
  }

  let onStart = async function(){
    try{
      let spec = 'http://localhost:1646/spec/swagger.json'
      let apiKey = localStorage.getItem("apiKey");
      let config = {
        apiKey: apiKey || 'test-123',
        pairingInfo:{
          name: process.env['SERVICE_NAME'] || 'DASH',
          imageUrl: process.env['SERVICE_IMAGE_URL'] || 'https://assets.coincap.io/assets/icons/dash@2x.png',
          basePath:spec
        }
      }

      //init
      let sdk = await KeepKeySdk.create(config)
      localStorage.setItem("apiKey",config.apiKey);
      console.log("config: ",config.apiKey)

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

      const configPioneer = {
        queryKey:'sdk:test-tutorial-medium',
        username:"dash-dapp",
        //spec:"https://pioneers.dev/spec/swagger.json"
        spec:"http://localhost:9001/spec/swagger.json"
      }
      let pioneer = new pioneerApi(configPioneer.spec,configPioneer)
      pioneer = await pioneer.init()
      setPioneer(pioneer)

      //get balance DASH
      let data = await pioneer.ListUnspent({network:'DASH',xpub:responsePubkey.xpub})
      data = data.data
      setInputs(data)
      console.log("txData: ",data)

      let balance = 0
      for(let i = 0; i < data.length; i++){
        balance += parseInt(data[i].value)
      }
      console.log("balance: ",balance)
      let balanceNative = balance / 100000000
      setBalance(balanceNative)

      //get new address
      let newAddyIndex = await pioneer.GetChangeAddress({network:'DASH',xpub:responsePubkey.xpub})
      console.log("newAddyIndex: ",newAddyIndex)

      let addressInfo = {
        addressNList: [0x80000000 + 44, 0x80000000 + 5, 0x80000000 + 0, 0x80000000 + 0],
        coin: 'Dash',
        scriptType: 'p2pkh',
        showDisplay: false
      }

      let address = await sdk.address.uTXOGetAddress({
        address_n: addressInfo.addressNList,
        script_type:addressInfo.scriptType,
        coin:addressInfo.coin
      })
      console.log("address: ",address)
      setAddress(address.address)
    }catch(e){
      console.error(e)
    }
  }

  // onStart()
  useEffect(() => {
    onStart()
  }, [])

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
            <small>Donate DASH to developer: (' XwNbd46qdmbVWLdXievBhBMW7JYy8WiE7n ')</small>
          </ModalBody>

          <ModalFooter>
            <Button colorScheme='green' mr={3} onClick={onSend}>
              Send
            </Button>
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
            <Logo h="40vmin" pointerEvents="none" />
            <Text>
              address: {address}
            </Text>
            <Text>
              balance: {balance}
            </Text>
            <Button onClick={onOpen}>Send Dash</Button>
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
