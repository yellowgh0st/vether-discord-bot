const Discord = require('discord.js')
const Web3 = require('web3')
const fetch = require('node-fetch')
const BigNumber = require('bignumber.js')

const Vether = require('./abi/Vether.json')
const VaderUtils = require('./abi/VaderUtils.json')
const UniswapPair = require('./abi/UniswapPair.json')

const client = new Discord.Client()
const botLoginKey = process.env.BOT_LOGIN_KEY
const infuraAPI = `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`

async function impliedValue() {
	try {
		const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI))
		const vether = new web3.eth.Contract(Vether.abi, '0x4ba6ddd7b89ed838fed25d208d4f644106e34279')
		const day = await vether.methods.currentDay().call()
		const era = await vether.methods.currentEra().call()
		const emission = Web3.utils.fromWei(await vether.methods.getDayEmission().call())
		const currentBurn = Web3.utils.fromWei(await vether.methods.mapEraDay_UnitsRemaining(era, day).call())
		return (currentBurn / emission)
	}
	catch (e) {
		console.log(e)
	}
}

async function vaderswapPrice() {
	try {
		const oneBN = String(new BigNumber(10 ** 18))
		const web3 = new Web3(new Web3.providers.HttpProvider(infuraAPI))
		const vaderUtils = new web3.eth.Contract(VaderUtils.abi, '0x0f216323076dfe029f01B3DeB3bC1682B1ea8A37')
		return await vaderUtils.methods.calcValueInToken('0x0000000000000000000000000000000000000000', oneBN).call()
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

async function sendPriceToChannel(message, exchange, pump) {
	try {
		const regExp = /e-(\d+)/
		let announceMessage

		let uniswapVethEth = await uniswapPrice('0x3696fa5ad6e5c74fdcbced9af74379d94c4b775a', true)
		uniswapVethEth = (uniswapVethEth) ? uniswapVethEth.toFixed(5) : '<:joint:716869960496054273> No data'
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
		uniswapVethDai = uniswapVethDai ? uniswapVethDai : '<:joint:716869960496054273> No data'
		console.log(uniswapVethDai)

		let uniswapVethUsdc = uniswapVethEth * uniswapEthUsdc
		uniswapVethUsdc = uniswapVethUsdc.toString()
		uniswapVethUsdc = uniswapVethUsdc.replace(regExp, '')
		uniswapVethUsdc = Number(uniswapVethUsdc).toFixed(2)
		uniswapVethUsdc = uniswapVethUsdc ? uniswapVethUsdc : '<:joint:716869960496054273> No data'
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

		let vetherImpliedValue = await impliedValue()
		vetherImpliedValue = (vetherImpliedValue) ? vetherImpliedValue.toFixed(5) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValue)

		let vetherImpliedValueUsdc = String(vetherImpliedValue * uniswapEthUsdc).replace(regExp, '')
		vetherImpliedValueUsdc = vetherImpliedValueUsdc ? Number(vetherImpliedValueUsdc).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValueUsdc)

		let vetherImpliedValueDai = String(vetherImpliedValue * uniswapEthDai).replace(regExp, '')
		vetherImpliedValueDai = vetherImpliedValueDai ? Number(vetherImpliedValueDai).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValueDai)

		let vaderswapVethEth
		if (pump) {
			vaderswapVethEth = pump
		}
		else {
			vaderswapVethEth = Web3.utils.fromWei(await vaderswapPrice())
		}
		vaderswapVethEth = (vaderswapVethEth) ? Number(vaderswapVethEth).toFixed(5) : '<:joint:716869960496054273> No data'
		console.log(vaderswapVethEth)

		let vaderswapVethUsdc = String(vaderswapVethEth * uniswapEthUsdc).replace(regExp, '')
		vaderswapVethUsdc = vaderswapVethUsdc ? Number(vaderswapVethUsdc).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vaderswapVethUsdc)

		let vaderswapVethDai = String(vaderswapVethEth * uniswapEthDai).replace(regExp, '')
		vaderswapVethDai = vaderswapVethDai ? Number(vaderswapVethDai).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vaderswapVethDai)

		switch (exchange) {
			case 'impliedval': announceMessage = `<:starexplosion:723661462072983724> Implied Value of **$VETH** is at *USDC* **${vetherImpliedValueUsdc}**, *DAI* **${vetherImpliedValueDai}**, *Ξ* **${vetherImpliedValue}**`; break
			case 'vetherpools': announceMessage = `<:vethergold:723655355179204658> Vether Pools V3 **$VETH** price is at *USDC* **${vaderswapVethUsdc}**, *DAI* **${vaderswapVethDai}**, *Ξ* **${vaderswapVethEth}**`; break
			case 'uniswap': announceMessage = `<:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${uniswapVethUsdc}**, *DAI* **${uniswapVethDai}**, *Ξ* **${uniswapVethEth}**`; break
			case 'resfinex': announceMessage = `<:resfinex:728785990675857428> Resfinex **$VETH** price is at *USDT* **${resfinexVethUsdt}**, *Ξ* **${resfinexVethEth}**`; break
			default: announceMessage = `<:starexplosion:723661462072983724> Implied Value of **$VETH** is at *USDC* **${vetherImpliedValueUsdc}**, *DAI* **${vetherImpliedValueDai}**, *Ξ* **${vetherImpliedValue}**
<:vethergold:723655355179204658> Vether Pools V3 **$VETH** price is at *USDC* **${vaderswapVethUsdc}**, *DAI* **${vaderswapVethDai}**, *Ξ* **${vaderswapVethEth}**
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

	if(message.content.startsWith('!pump')) {
		const args = message.content.slice('!pump'.length).trim().split(' ')
		const number = Number(args.shift())
		if (typeof number === 'number') {
			sendPriceToChannel(message, undefined, number)
		}
	}

	if (message.channel.name === 'trading') {
		switch (message.content) {
			case '.': sendPriceToChannel(message); break
			case '!price': sendPriceToChannel(message); break
			case '!impliedval': sendPriceToChannel(message, 'impliedval'); break
			case '!vetherpools': sendPriceToChannel(message, 'vetherpools'); break
			case '!uniswap': sendPriceToChannel(message, 'uniswap'); break
			case '!resfinex': sendPriceToChannel(message, 'resfinex')
		}
	}

})

client.login(botLoginKey)
