import {
  React,
  useEffect,
  useState,
} from 'react';
import {
  ChakraProvider,
  Box,
  Text,
  Link,
  VStack,
  Code,
  Grid,
  theme,
} from '@chakra-ui/react';
import { ColorModeSwitcher } from './ColorModeSwitcher';
import { Logo } from './Logo';
import { KeepKeySdk } from '@keepkey/keepkey-sdk'

function App() {
  const [address, setAddress] = useState('')
  const [balance, setBalance] = useState('0.000')

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

    }catch(e){
      console.error(e)
    }
  }

  // onStart()
  useEffect(() => {
    onStart()
  }, [])

  return (
    <ChakraProvider theme={theme}>
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
          </VStack>
        </Grid>
      </Box>
    </ChakraProvider>
  );
}

export default App;
