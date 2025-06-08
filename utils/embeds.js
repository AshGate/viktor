const { EmbedBuilder } = require('discord.js');
const config = require('../config');

class EmbedUtils {
  static createTicketEmbed() {
    return new EmbedBuilder()
      .setTitle('Contactez notre entreprise')
      .setDescription('Afin de prendre contact avec notre secrétariat, utilisez l\'onglet ci-dessous 📩')
      .setColor(config.colors.primary)
      .setTimestamp();
  }

  static createSuccessEmbed(title, description) {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(config.colors.success)
      .setTimestamp();
  }

  static createErrorEmbed(title, description) {
    return new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(config.colors.error)
      .setTimestamp();
  }

  static createTicketInfoEmbed(ticket, userData = null) {
    const embed = new EmbedBuilder()
      .setTitle(`Ticket #${ticket.id}`)
      .setColor(config.colors.primary)
      .addFields(
        { name: 'Statut', value: ticket.status === 'open' ? '🟢 Ouvert' : '🔴 Fermé', inline: true },
        { name: 'Créé le', value: ticket.createdAt.toLocaleString('fr-FR'), inline: true },
        { name: 'Participants', value: `${ticket.participants.length} personne(s)`, inline: true }
      )
      .setTimestamp();

    if (userData) {
      embed.addFields(
        { name: 'Nom', value: userData.nom || 'Non renseigné', inline: true },
        { name: 'Prénom', value: userData.prenom || 'Non renseigné', inline: true },
        { name: 'Permis bateau', value: userData.permis || 'Non renseigné', inline: true },
        { name: 'Demande', value: userData.demande || 'Non renseignée', inline: false }
      );
    }

    return embed;
  }
}

module.exports = EmbedUtils;