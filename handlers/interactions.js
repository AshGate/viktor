const { 
  ActionRowBuilder, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');
const EmbedUtils = require('../utils/embeds');
const ticketDB = require('../utils/database');
const config = require('../config');

class InteractionHandler {
  static async handleButton(interaction) {
    console.log(`🔘 Bouton cliqué: ${interaction.customId} par ${interaction.user.tag}`);

    if (interaction.customId === 'create_ticket') {
      await this.handleCreateTicket(interaction);
    } else if (interaction.customId === 'close_ticket') {
      await this.handleCloseTicket(interaction);
    }
  }

  static async handleModal(interaction) {
    console.log(`📝 Modal soumis: ${interaction.customId} par ${interaction.user.tag}`);

    if (interaction.customId === 'ticket_form') {
      await this.handleTicketForm(interaction);
    }
  }

  static async handleCreateTicket(interaction) {
    try {
      console.log(`🎫 Création de ticket demandée par ${interaction.user.tag}`);

      // Vérifier si l'utilisateur a déjà trop de tickets ouverts
      const userTickets = ticketDB.getUserTickets(interaction.user.id);
      if (userTickets.length >= config.maxTicketsPerUser) {
        console.log(`❌ Limite de tickets atteinte pour ${interaction.user.tag}`);
        return await interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed(
            '❌ Limite atteinte',
            `Vous avez déjà ${config.maxTicketsPerUser} tickets ouverts. Veuillez en fermer un avant d'en créer un nouveau.`
          )],
          ephemeral: true
        });
      }

      const modal = new ModalBuilder()
        .setCustomId('ticket_form')
        .setTitle('Formulaire de contact');

      const nomInput = new TextInputBuilder()
        .setCustomId('nom')
        .setLabel('Nom')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

      const prenomInput = new TextInputBuilder()
        .setCustomId('prenom')
        .setLabel('Prénom')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(50);

      const permisInput = new TextInputBuilder()
        .setCustomId('permis')
        .setLabel('Avez-vous un permis bateau ? (Oui/Non)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true)
        .setMaxLength(10);

      const demandeInput = new TextInputBuilder()
        .setCustomId('demande')
        .setLabel('Votre demande')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1000);

      const rows = [
        new ActionRowBuilder().addComponents(nomInput),
        new ActionRowBuilder().addComponents(prenomInput),
        new ActionRowBuilder().addComponents(permisInput),
        new ActionRowBuilder().addComponents(demandeInput)
      ];

      modal.addComponents(...rows);

      await interaction.showModal(modal);
      console.log(`✅ Modal affiché pour ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Erreur lors de la création du modal:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            embeds: [EmbedUtils.createErrorEmbed(
              '❌ Erreur',
              'Impossible d\'ouvrir le formulaire. Veuillez réessayer.'
            )],
            ephemeral: true
          });
        } catch (replyError) {
          console.error('❌ Erreur lors de la réponse d\'erreur:', replyError);
        }
      }
    }
  }

  static async handleTicketForm(interaction) {
    try {
      console.log(`📋 Formulaire soumis par ${interaction.user.tag}`);

      const nom = interaction.fields.getTextInputValue('nom');
      const prenom = interaction.fields.getTextInputValue('prenom');
      const permis = interaction.fields.getTextInputValue('permis');
      const demande = interaction.fields.getTextInputValue('demande');

      const userData = { nom, prenom, permis, demande };

      // Créer ou trouver la catégorie des tickets
      let category = interaction.guild.channels.cache.find(
        c => c.name === config.ticketCategory && c.type === ChannelType.GuildCategory
      );

      if (!category) {
        console.log('📁 Création de la catégorie TICKETS');
        category = await interaction.guild.channels.create({
          name: config.ticketCategory,
          type: ChannelType.GuildCategory,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone,
              deny: [PermissionFlagsBits.ViewChannel]
            }
          ]
        });
      }

      // Créer le ticket dans la base de données
      const ticket = ticketDB.createTicket(interaction.user.id, interaction.guild.id, null);
      
      // Créer le salon de ticket
      console.log(`🏗️ Création du salon ticket-${ticket.id}`);
      const ticketChannel = await interaction.guild.channels.create({
        name: `ticket-${ticket.id}`,
        type: ChannelType.GuildText,
        parent: category,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionFlagsBits.ViewChannel]
          },
          {
            id: interaction.user.id,
            allow: [
              PermissionFlagsBits.ViewChannel,
              PermissionFlagsBits.SendMessages,
              PermissionFlagsBits.ReadMessageHistory
            ]
          }
        ]
      });

      // Mettre à jour le ticket avec l'ID du salon
      ticketDB.updateTicketChannel(ticket.id, ticketChannel.id);
      ticketDB.updateTicketData(ticket.id, userData);

      console.log(`✅ Ticket #${ticket.id} créé avec le salon ${ticketChannel.id}`);

      // Envoyer le message d'accueil dans le ticket
      const embed = EmbedUtils.createTicketInfoEmbed(ticket, userData);
      
      // Créer le bouton fermer
      const closeButton = new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Fermer le ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒');

      const row = new ActionRowBuilder().addComponents(closeButton);
      
      await ticketChannel.send({
        content: `Bonjour ${interaction.user}, votre ticket a été créé !`,
        embeds: [embed],
        components: [row]
      });

      // Répondre à l'utilisateur
      await interaction.reply({
        embeds: [EmbedUtils.createSuccessEmbed(
          '✅ Ticket créé',
          `Votre ticket #${ticket.id} a été créé ! Rendez-vous dans ${ticketChannel}.`
        )],
        ephemeral: true
      });

      console.log(`🎉 Ticket #${ticket.id} créé avec succès pour ${interaction.user.tag}`);

    } catch (error) {
      console.error('❌ Erreur lors de la création du ticket:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            embeds: [EmbedUtils.createErrorEmbed(
              '❌ Erreur',
              'Impossible de créer le ticket. Veuillez réessayer plus tard.'
            )],
            ephemeral: true
          });
        } catch (replyError) {
          console.error('❌ Erreur lors de la réponse d\'erreur:', replyError);
        }
      }
    }
  }

  static async handleCloseTicket(interaction) {
    try {
      console.log(`🔒 Tentative de fermeture du ticket dans le salon: ${interaction.channel.id} par ${interaction.user.tag}`);
      
      const ticket = ticketDB.getTicketByChannel(interaction.channel.id);
      
      if (!ticket) {
        console.log(`❌ Aucun ticket trouvé pour le salon ${interaction.channel.id}`);
        return await interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed(
            '❌ Pas un ticket',
            'Cette action ne peut être utilisée que dans un salon de ticket.'
          )],
          ephemeral: true
        });
      }

      console.log(`✅ Ticket #${ticket.id} trouvé pour le salon ${interaction.channel.id}`);

      // Vérifier les permissions
      if (ticket.userId !== interaction.user.id && !interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
        console.log(`❌ Permission refusée pour ${interaction.user.tag} sur le ticket #${ticket.id}`);
        return await interaction.reply({
          embeds: [EmbedUtils.createErrorEmbed(
            '❌ Permission refusée',
            'Seul le créateur du ticket ou un modérateur peut le fermer.'
          )],
          ephemeral: true
        });
      }

      // Fermer le ticket dans la base de données
      ticketDB.closeTicket(ticket.id);
      
      await interaction.reply({
        embeds: [EmbedUtils.createSuccessEmbed(
          '🔒 Ticket fermé',
          `Ticket #${ticket.id} fermé par ${interaction.user}. Ce salon sera supprimé dans 3 secondes.`
        )]
      });

      console.log(`✅ Ticket #${ticket.id} fermé par ${interaction.user.tag}`);

      // Supprimer le salon après 3 secondes
      setTimeout(async () => {
        try {
          console.log(`🗑️ Suppression du salon ${interaction.channel.id} pour le ticket #${ticket.id}`);
          await interaction.channel.delete();
          console.log(`✅ Salon supprimé avec succès`);
        } catch (error) {
          console.error('❌ Erreur lors de la suppression du salon:', error);
        }
      }, 3000);

    } catch (error) {
      console.error('❌ Erreur lors de la fermeture du ticket:', error);
      
      if (!interaction.replied && !interaction.deferred) {
        try {
          await interaction.reply({
            embeds: [EmbedUtils.createErrorEmbed(
              '❌ Erreur',
              'Impossible de fermer le ticket.'
            )],
            ephemeral: true
          });
        } catch (replyError) {
          console.error('❌ Erreur lors de la réponse d\'erreur:', replyError);
        }
      }
    }
  }
}

module.exports = InteractionHandler;