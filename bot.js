const { Client, GatewayIntentBits, Collection } = require('discord.js');
const config = require('./config');
const TicketCommands = require('./commands/ticket');
const InteractionHandler = require('./handlers/interactions');

// Créer le client Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Event: Bot prêt
client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  console.log(`📊 Connecté à ${client.guilds.cache.size} serveur(s)`);
  console.log(`🎫 Système de tickets opérationnel avec le préfixe "${config.prefix}"`);
  
  // Définir le statut du bot
  client.user.setActivity('les tickets | !ticket', { type: 'WATCHING' });
});

// Event: Messages
client.on('messageCreate', async (message) => {
  // Ignorer les messages des bots
  if (message.author.bot) return;

  // Vérifier si le message commence par le préfixe
  if (!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  try {
    switch (command) {
      case 'ticket':
        await TicketCommands.handleTicketCommand(message, args);
        break;
      
      case 'close':
        await TicketCommands.handleCloseCommand(message);
        break;
      
      case 'add':
        await TicketCommands.handleAddCommand(message, args);
        break;
      
      case 'help':
        const helpEmbed = require('./utils/embeds').createSuccessEmbed(
          '📋 Commandes disponibles',
          '**Commandes générales:**\n' +
          '• `!ticket #salon` - Envoie l\'embed de ticket dans un salon\n' +
          '• `!help` - Affiche cette aide\n\n' +
          '**Commandes dans les tickets:**\n' +
          '• `!close` - Ferme le ticket actuel\n' +
          '• `!add @utilisateur` - Ajoute un utilisateur au ticket\n' +
          '• `!add 123456789012345678` - Ajoute un utilisateur par son ID Discord'
        );
        await message.reply({ embeds: [helpEmbed] });
        break;
    }
  } catch (error) {
    console.error(`Erreur lors de l'exécution de la commande ${command}:`, error);
    try {
      await message.reply({
        embeds: [require('./utils/embeds').createErrorEmbed(
          '❌ Erreur interne',
          'Une erreur s\'est produite lors de l\'exécution de la commande.'
        )]
      });
    } catch (replyError) {
      console.error('Erreur lors de l\'envoi de la réponse d\'erreur:', replyError);
    }
  }
});

// Event: Interactions (boutons, modals, etc.)
client.on('interactionCreate', async (interaction) => {
  // Vérifier si l'interaction est valide
  if (!interaction.isRepliable()) {
    console.log('❌ Interaction non valide ou expirée');
    return;
  }

  console.log(`🔄 Traitement de l'interaction: ${interaction.customId} par ${interaction.user.tag}`);

  try {
    // Traiter l'interaction
    if (interaction.isButton()) {
      await InteractionHandler.handleButton(interaction);
    } else if (interaction.isModalSubmit()) {
      await InteractionHandler.handleModal(interaction);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la gestion de l\'interaction:', error);
    
    try {
      const errorResponse = {
        embeds: [require('./utils/embeds').createErrorEmbed(
          '❌ Erreur interne',
          'Une erreur s\'est produite lors du traitement de votre demande.'
        )],
        ephemeral: true
      };

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply(errorResponse);
      }
    } catch (responseError) {
      console.error('❌ Erreur lors de l\'envoi de la réponse d\'erreur:', responseError);
    }
  }
});

// Event: Gestion des erreurs
client.on('error', (error) => {
  console.error('❌ Erreur Discord.js:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Erreur non gérée:', error);
});

// Démarrer le bot
if (!config.token) {
  console.error('❌ Token Discord manquant! Veuillez configurer le fichier .env');
  process.exit(1);
}

client.login(config.token);