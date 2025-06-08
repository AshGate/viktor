const { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  PermissionFlagsBits,
  ChannelType
} = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const ticketDB = require('../utils/database');
const config = require('../config');

class TicketCommands {
  static async handleTicketCommand(message, args) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Permission refusée',
          'Vous n\'avez pas la permission d\'utiliser cette commande.'
        )]
      });
    }

    if (args.length === 0) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Utilisation incorrecte',
          'Utilisation: `!ticket #salon`'
        )]
      });
    }

    const channelMention = args[0];
    const channel = message.mentions.channels.first();
    
    if (!channel) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Salon invalide',
          'Veuillez mentionner un salon valide.'
        )]
      });
    }

    const embed = EmbedUtils.createTicketEmbed();
    const button = new ButtonBuilder()
      .setCustomId('create_ticket')
      .setLabel('Nous contacter 📩')
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(button);

    try {
      await channel.send({
        embeds: [embed],
        components: [row]
      });

      message.reply({
        embeds: [EmbedUtils.createSuccessEmbed(
          '✅ Embed envoyé',
          `L'embed de ticket a été envoyé dans ${channel}.`
        )]
      });
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'embed:', error);
      message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Erreur',
          'Impossible d\'envoyer l\'embed dans ce salon.'
        )]
      });
    }
  }

  static async handleCloseCommand(message) {
    console.log(`🔍 Commande !close utilisée dans le salon: ${message.channel.id} par ${message.author.tag}`);
    
    // Debug: Afficher l'état de la base de données
    ticketDB.debugInfo();
    
    const ticket = ticketDB.getTicketByChannel(message.channel.id);
    
    if (!ticket) {
      console.log(`❌ Aucun ticket trouvé pour le salon ${message.channel.id}`);
      console.log(`📊 Nom du salon: ${message.channel.name}`);
      console.log(`📊 Type du salon: ${message.channel.type}`);
      
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Pas un ticket',
          'Cette commande ne peut être utilisée que dans un salon de ticket.\n\n' +
          `**Debug Info:**\n` +
          `• Salon ID: ${message.channel.id}\n` +
          `• Nom du salon: ${message.channel.name}\n` +
          `• Type: ${message.channel.type}`
        )]
      });
    }

    console.log(`✅ Ticket #${ticket.id} trouvé pour le salon ${message.channel.id}`);

    if (ticket.userId !== message.author.id && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Permission refusée',
          'Seul le créateur du ticket ou un modérateur peut le fermer.'
        )]
      });
    }

    try {
      ticketDB.closeTicket(ticket.id);
      
      await message.channel.send({
        embeds: [EmbedUtils.createSuccessEmbed(
          '🔒 Ticket fermé',
          `Ticket #${ticket.id} fermé par ${message.author}. Ce salon sera supprimé dans 3 secondes.`
        )]
      });

      console.log(`✅ Ticket #${ticket.id} fermé par ${message.author.tag}`);

      setTimeout(async () => {
        try {
          console.log(`🗑️ Suppression du salon ${message.channel.id} pour le ticket #${ticket.id}`);
          await message.channel.delete();
          console.log(`✅ Salon supprimé avec succès`);
        } catch (error) {
          console.error('❌ Erreur lors de la suppression du salon:', error);
        }
      }, 3000); // 3 secondes au lieu de 10

    } catch (error) {
      console.error('Erreur lors de la fermeture du ticket:', error);
      message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Erreur',
          'Impossible de fermer le ticket.'
        )]
      });
    }
  }

  static async handleAddCommand(message, args) {
    const ticket = ticketDB.getTicketByChannel(message.channel.id);
    
    if (!ticket) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Pas un ticket',
          'Cette commande ne peut être utilisée que dans un salon de ticket.'
        )]
      });
    }

    if (ticket.userId !== message.author.id && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Permission refusée',
          'Seul le créateur du ticket ou un modérateur peut ajouter des personnes.'
        )]
      });
    }

    if (args.length === 0) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Utilisateur manquant',
          'Veuillez mentionner un utilisateur ou fournir son ID Discord.\nUtilisation: `!add @utilisateur` ou `!add 123456789012345678`'
        )]
      });
    }

    let user = message.mentions.users.first();
    
    // Si pas de mention, essayer de récupérer par ID
    if (!user) {
      const userId = args[0];
      
      // Vérifier si c'est un ID Discord valide (nombre de 17-19 chiffres)
      if (!/^\d{17,19}$/.test(userId)) {
        return message.reply({
          embeds: [EmbedUtils.createErrorEmbed(
            '❌ Format invalide',
            'Veuillez mentionner un utilisateur ou fournir un ID Discord valide.\nUtilisation: `!add @utilisateur` ou `!add 123456789012345678`'
          )]
        });
      }

      try {
        user = await message.client.users.fetch(userId);
      } catch (error) {
        return message.reply({
          embeds: [EmbedUtils.createErrorEmbed(
            '❌ Utilisateur introuvable',
            'Impossible de trouver un utilisateur avec cet ID Discord.'
          )]
        });
      }
    }

    if (ticket.participants.includes(user.id)) {
      return message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Déjà présent',
          'Cet utilisateur fait déjà partie du ticket.'
        )]
      });
    }

    try {
      await message.channel.permissionOverwrites.create(user, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      ticketDB.addParticipant(ticket.id, user.id);

      message.reply({
        embeds: [EmbedUtils.createSuccessEmbed(
          '✅ Utilisateur ajouté',
          `${user} a été ajouté au ticket #${ticket.id}.`
        )]
      });

    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      message.reply({
        embeds: [EmbedUtils.createErrorEmbed(
          '❌ Erreur',
          'Impossible d\'ajouter cet utilisateur au ticket.'
        )]
      });
    }
  }
}

module.exports = TicketCommands;