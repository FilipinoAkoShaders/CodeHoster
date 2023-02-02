const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs')
const path = require('path')
module.exports = {
  data: new SlashCommandBuilder()
    .setName('createProcess')
    .setDescription('host your code by our process manager!')
    .addStringOption(option => {
      option
        .setName('name')
        .setDescription('Process name')
        .setRequired(true)
    })
    .addStringOption(option => {
      option
        .setName('args')
        .setDescription('Process args')
        .setRequired(true)
    })
    .addStringOption(option => {
      option
        .setName('core')
        .setDescription('Process core (e.g NodeJs)')
        .setRequired(true)
    })
    .addStringOption(option => {
      option
        .setName('entrypoint')
        .setDescription('Process entry point file')
        .setRequired(true)
    }),
  async execute(interaction) {
    let name = interaction.options.getString('name')
    let core = interaction.options.getString('core')
    let args = interaction.options.getString('args')
    let run = interaction.options.getString('entrypoint')
    let id = String(Math.floor(Math.random()*(9999999999-1000000000+1)+1000000000))

    
  }
}