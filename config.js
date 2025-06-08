require('dotenv').config();

module.exports = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID,
  prefix: '!',
  colors: {
    primary: 0x0099FF,
    success: 0x00FF00,
    error: 0xFF0000,
    warning: 0xFFFF00
  },
  ticketCategory: 'TICKETS',
  maxTicketsPerUser: 3
};