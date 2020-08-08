const Discord = require('discord.js')
const Web3 = require('web3')
const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const UniswapPair = require('./abi/UniswapPair.json')
const VetherPools = require('./abi/VetherPools.json')

const client = new Discord.Client()
const botLoginKey = process.env.BOT_LOGIN_KEY

const infuraAPI = 'https://mainnet.infura.io/v3/'
	+ process.env.INFURA_API_KEY

async function vetherPoolsPrice() {
	try {
		const web3_ = new Web3(new Web3.providers.HttpProvider(infuraAPI))
		const contract = new web3_.eth.Contract(VetherPools.abi, '0x52DEcc80d5233d35d3E2dCdC0Ad2ba0373155c45')
		const price = await contract.methods.calcValueInAsset(new BigNumber(1 * 10 ** 18), '0x0000000000000000000000000000000000000000').call()
		return Number(Web3.utils.fromWei(price))
	}
	catch (e) {
		console.log(e)
	}
}

async function uniswapPrice(pair, swap) {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI))
		const contract = new web3.eth.Contract(UniswapPair.abi, pair)
		const data = await contract.methods.getReserves().call()
		if(swap) {
			return (data.reserve1 / data.reserve0)
		}
		else {
			return (data.reserve0 / data.reserve1)
		}
	}
	catch (e) {
		console.log(e)
	}
}

async function resfinexPrice(market) {
	try {
		const response = await fetch('https://api.resfinex.com/engine/history?pair=' + market)
		const resfinex = await response.json()
		const last = resfinex.data.pop()
		return last.price
	}
	catch (e) {
		console.log(e)
	}
}

async function sendPriceToChannel(message, exchange) {
	try {
		const regExp = /e-(\d+)/
		let announceMessage

		let uniswapVethEth = await uniswapPrice('0x3696fa5ad6e5c74fdcbced9af74379d94c4b775a', true)
		uniswapVethEth = (uniswapVethEth) ? uniswapVethEth.toFixed(6) : '<:joint:716869960496054273> No data'
		console.log(uniswapVethEth)

		let uniswapEthDai = await uniswapPrice('0xa478c2975ab1ea89e8196811f51a7b7ade33eb11')
		uniswapEthDai = (uniswapEthDai) ? uniswapEthDai.toFixed(2) : null
		console.log(uniswapEthDai)

		let uniswapEthUsdc = await uniswapPrice('0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc')
		uniswapEthUsdc = (uniswapEthUsdc) ? (uniswapEthUsdc * 1000000000000).toFixed(2) : null
		console.log(uniswapEthUsdc)

		let uniswapVethDai = uniswapVethEth * uniswapEthDai
		uniswapVethDai = uniswapVethDai.toString()
		uniswapVethDai = uniswapVethDai.replace(regExp, '')
		uniswapVethDai = Number(uniswapVethDai).toFixed(2)
		uniswapVethDai = (uniswapVethDai === null) ? '<:joint:716869960496054273> No data' : uniswapVethDai
		console.log(uniswapVethDai)

		let uniswapVethUsdc = uniswapVethEth * uniswapEthUsdc
		uniswapVethUsdc = uniswapVethUsdc.toString()
		uniswapVethUsdc = uniswapVethUsdc.replace(regExp, '')
		uniswapVethUsdc = Number(uniswapVethUsdc).toFixed(2)
		uniswapVethUsdc = (uniswapVethUsdc === null) ? '<:joint:716869960496054273> No data' : uniswapVethUsdc
		console.log(uniswapVethUsdc)

		let resfinexVethEth = await resfinexPrice('VETH_ETH')
		resfinexVethEth = (resfinexVethEth) ? resfinexVethEth.toFixed(5) : '<:joint:716869960496054273> No data'
		console.log(resfinexVethEth)

		let resfinexEthUsdt = await resfinexPrice('ETH_USDT')
		resfinexEthUsdt = (resfinexEthUsdt) ? resfinexEthUsdt.toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(resfinexEthUsdt)

		let resfinexVethUsdt = resfinexVethEth * resfinexEthUsdt
		resfinexVethUsdt = (resfinexVethUsdt) ? resfinexVethUsdt.toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(resfinexVethUsdt)

		let vetherPoolsVethEth = await vetherPoolsPrice()
		vetherPoolsVethEth = (vetherPoolsVethEth) ? vetherPoolsVethEth.toFixed(6) : '<:joint:716869960496054273> No data'
		console.log(vetherPoolsVethEth)

		let vetherPoolsVethUsdc = vetherPoolsVethEth * uniswapEthUsdc
		vetherPoolsVethUsdc = vetherPoolsVethUsdc.toString()
		vetherPoolsVethUsdc = vetherPoolsVethUsdc.replace(regExp, '')
		vetherPoolsVethUsdc = Number(vetherPoolsVethUsdc).toFixed(2)
		vetherPoolsVethUsdc = (vetherPoolsVethUsdc === null) ? '<:joint:716869960496054273> No data' : vetherPoolsVethUsdc
		console.log(vetherPoolsVethUsdc)

		let vetherPoolsVethDai = vetherPoolsVethEth * uniswapEthDai
		vetherPoolsVethDai = vetherPoolsVethDai.toString()
		vetherPoolsVethDai = vetherPoolsVethDai.replace(regExp, '')
		vetherPoolsVethDai = Number(vetherPoolsVethDai).toFixed(2)
		vetherPoolsVethDai = (vetherPoolsVethDai === null) ? '<:joint:716869960496054273> No data' : vetherPoolsVethDai
		console.log(vetherPoolsVethDai)

		switch (exchange) {
			case 'vetherpools': announceMessage = `<:vethergold:723655355179204658> Vether Pools V2 **$VETH** price is at *USDC* **${vetherPoolsVethUsdc}**, *DAI* **${vetherPoolsVethDai}**, *Ξ* **${vetherPoolsVethEth}**`; break
			case 'uniswap': announceMessage = `<:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${uniswapVethUsdc}**, *DAI* **${uniswapVethDai}**, *Ξ* **${uniswapVethEth}**`; break
			case 'resfinex': announceMessage = `<:resfinex:728785990675857428> Resfinex **$VETH** price is at *USDT* **${resfinexVethUsdt}**, *Ξ* **${resfinexVethEth}**`; break
			default: announceMessage = `<:vethergold:723655355179204658> Vether Pools V2 **$VETH** price is at *USDC* **${vetherPoolsVethUsdc}**, *DAI* **${vetherPoolsVethDai}**, *Ξ* **${vetherPoolsVethEth}**
<:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${uniswapVethUsdc}**, *DAI* **${uniswapVethDai}**, *Ξ* **${uniswapVethEth}**
<:resfinex:728785990675857428> Resfinex **$VETH** price is at *USDT* **${resfinexVethUsdt}**, *Ξ* **${resfinexVethEth}**`
		}

		if(announceMessage) {
			await message.channel.send(announceMessage)
		}

	}
	catch (e) {
		console.log(e)
	}
}

client.once('ready', () => {
	console.log('Hey, I\'m the new Price Bot and I\'m Ready!')
})

client.on('message', message => {

	if (message.channel.name === 'trading') {
		switch (message.content) {
			case '.': sendPriceToChannel(message); break
			case '!price': sendPriceToChannel(message); break
			case '!vetherpools': sendPriceToChannel(message, 'vetherpools'); break
			case '!uniswap': sendPriceToChannel(message, 'uniswap'); break
			case '!resfinex': sendPriceToChannel(message, 'resfinex')
		}
	}

})

client.login(botLoginKey)
