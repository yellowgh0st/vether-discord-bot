const Discord = require('discord.js')
const Web3 = require('web3')
const UniswapPair = require('./abi/UniswapPair.json')

const client = new Discord.Client()
const botLoginKey = process.env.BOT_LOGIN_KEY

const infuraAPI = 'https://mainnet.infura.io/v3/'
    + process.env.INFURA_API_KEY

const poolVethEth = '0x03e008804c5bf70e20b5a0b7233cf2687ccd2a96'
const poolDaiEth = '0xa478c2975ab1ea89e8196811f51a7b7ade33eb11'
const poolUsdcEth = '0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc'

async function getPrice(pair, swap) {
  try {
      const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI))
      const contract = new web3.eth.Contract(UniswapPair.abi, pair)
      const data = await contract.methods.getReserves().call()
      if(swap) {
          return (data.reserve1/data.reserve0)
      } else {
          return (data.reserve0/data.reserve1)
      }
  }
  catch (e) {
      console.log(e);
  }
}

async function sendPriceToChannel(message) {
  try {
      const regExp = /e-(\d+)/;

      let priceVethEth = await getPrice(poolVethEth, true)
          priceVethEth = (priceVethEth) ? priceVethEth.toFixed(6) : null
      console.log(priceVethEth)

      let priceEthDai = await getPrice(poolDaiEth)
          priceEthDai = (priceEthDai) ? priceEthDai.toString() : null
      console.log(priceEthDai)

      let priceEthUsdc = await getPrice(poolUsdcEth)
          priceEthUsdc = (priceEthUsdc) ? priceEthUsdc.toString() : null
      console.log(priceEthUsdc)

      let priceVethDai = priceVethEth * priceEthDai
          priceVethDai = priceVethDai.toString()
          priceVethDai = priceVethDai.replace(regExp, '')
          priceVethDai = Number(priceVethDai).toFixed(2)
      console.log(priceVethDai)

      let priceVethUsdc = priceVethEth * priceEthUsdc
          priceVethUsdc = priceVethUsdc.toString()
          priceVethUsdc = priceVethUsdc.replace(regExp, '')
          priceVethUsdc = Number(priceVethUsdc).toFixed(2)
      console.log(priceVethUsdc)

      announceMessage = `
         <:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${priceVethUsdc}**, *DAI* **${priceVethDai}**, *Ξ* **${priceVethEth}**
       `

      //   announceMessage = `<:joint:716869960496054273> No data`

      await message.channel.send(announceMessage);
  }
  catch (e) {
      console.log(e);
  }
}

client.once('ready', () => {
    console.log('Hey, I\'m the new Price Bot and I\'m Ready!')
});

client.on('message', message => {
    if (message.content === '!price') {
        if(message.channel.name === 'trading') {
           sendPriceToChannel(message);
        }
    }
});

client.login(botLoginKey);
