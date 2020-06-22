const fetch = require('node-fetch');
const Discord = require('discord.js');
const client = new Discord.Client();
const key = process.env.BOT_LOGIN_KEY

const summary = 'https://api.uniswap.info/v1/summary';

async function getSummaryData(url = summary) {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  }
  catch (e) {
    console.log(e);
  }
}

async function sendPriceToChannel(message) {
  try {
    const data = await getSummaryData();
    let announceMessage;
    
    const usdcPool = data.ETH_0x97deC872013f6B5fB443861090ad931542878126;
    const vetherPool = data.ETH_0x506D07722744E4A390CD7506a2Ba1A8157E63745;
    const daiPool = data.ETH_0x2a1530C4C41db0B0b2bB646CB5Eb1A67b7158667;
    
    if(vetherPool !== undefined) {
        const eth = (1/Number(vetherPool.last_price)).toFixed(5);
        const usdc = (eth*Number(usdcPool.last_price)).toFixed(2);
        const dai = (eth*Number(daiPool.last_price)).toFixed(2);
        
        announceMessage = `
        <:uniswap:718587420274196553> Uniswap V1 **$VETH** price is at *USDC* **${usdc}**, *DAI* **${dai}**, *Ξ* **${eth}**
        `
    } else {
        announceMessage = `<:joint:716869960496054273> No data`
    }
    
    message.channel.send(announceMessage);
  }
  catch (e) {
    console.log(e);
  }
}

client.once('ready', () => {
    console.log('Hey, I\'m the new Price Bot and I\'m Ready!');
});

client.on('message', message => {
    if (message.content === '!price') {
        if(message.channel.name === 'trading') {
           sendPriceToChannel(message);
        }
    }
});

client.login(key);
