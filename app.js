const Discord = require('discord.js')
const Web3 = require('web3')

const Vether = require('./abi/Vether.json')
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


async function sendPriceToChannel(message, exchange) {
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

		let vetherImpliedValue = await impliedValue()
		vetherImpliedValue = (vetherImpliedValue) ? vetherImpliedValue.toFixed(5) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValue)

		let vetherImpliedValueUsdc = String(vetherImpliedValue * uniswapEthUsdc).replace(regExp, '')
		vetherImpliedValueUsdc = vetherImpliedValueUsdc ? Number(vetherImpliedValueUsdc).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValueUsdc)

		let vetherImpliedValueDai = String(vetherImpliedValue * uniswapEthDai).replace(regExp, '')
		vetherImpliedValueDai = vetherImpliedValueDai ? Number(vetherImpliedValueDai).toFixed(2) : '<:joint:716869960496054273> No data'
		console.log(vetherImpliedValueDai)

		switch (exchange) {
			case 'implied': announceMessage = `<:starexplosion:723661462072983724> Implied Value of **$VETH** is at *USDC* **${vetherImpliedValueUsdc}**, *DAI* **${vetherImpliedValueDai}**, *Ξ* **${vetherImpliedValue}**`; break
			case 'uniswap': announceMessage = `<:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${uniswapVethUsdc}**, *DAI* **${uniswapVethDai}**, *Ξ* **${uniswapVethEth}**`; break
			default: announceMessage = `<:starexplosion:723661462072983724> Implied Value of **$VETH** is at *USDC* **${vetherImpliedValueUsdc}**, *DAI* **${vetherImpliedValueDai}**, *Ξ* **${vetherImpliedValue}**
<:uniswap:718587420274196553> Uniswap V2 **$VETH** price is at *USDC* **${uniswapVethUsdc}**, *DAI* **${uniswapVethDai}**, *Ξ* **${uniswapVethEth}**`
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
			case '!implied': sendPriceToChannel(message, 'implied'); break
			case '!uniswap': sendPriceToChannel(message, 'uniswap'); break
			case '!resfinex': sendPriceToChannel(message, 'resfinex')
		}
	}

})

client.login(botLoginKey)
