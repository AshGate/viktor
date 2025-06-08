// Système de base de données simple en mémoire pour les tickets
class TicketDatabase {
  constructor() {
    this.tickets = new Map();
    this.ticketCounter = 0;
    this.userTickets = new Map();
    this.channelToTicket = new Map(); // Nouvelle map pour associer salon -> ticket
  }

  createTicket(userId, guildId, channelId) {
    this.ticketCounter++;
    const ticketId = this.ticketCounter;
    
    const ticket = {
      id: ticketId,
      userId: userId,
      guildId: guildId,
      channelId: channelId,
      createdAt: new Date(),
      status: 'open',
      participants: [userId],
      data: {}
    };

    this.tickets.set(ticketId, ticket);
    
    // Ajouter à la liste des tickets de l'utilisateur
    if (!this.userTickets.has(userId)) {
      this.userTickets.set(userId, []);
    }
    this.userTickets.get(userId).push(ticketId);

    // Si channelId est fourni, créer l'association
    if (channelId) {
      this.channelToTicket.set(channelId, ticketId);
    }

    console.log(`✅ Ticket #${ticketId} créé pour l'utilisateur ${userId}`);
    return ticket;
  }

  // Mettre à jour l'ID du salon d'un ticket
  updateTicketChannel(ticketId, channelId) {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      // Supprimer l'ancienne association si elle existe
      if (ticket.channelId) {
        this.channelToTicket.delete(ticket.channelId);
      }
      
      // Mettre à jour le ticket
      ticket.channelId = channelId;
      
      // Créer la nouvelle association
      this.channelToTicket.set(channelId, ticketId);
      
      console.log(`✅ Salon ${channelId} associé au ticket #${ticketId}`);
    }
    return ticket;
  }

  getTicketByChannel(channelId) {
    // Méthode 1: Utiliser la map directe
    const ticketId = this.channelToTicket.get(channelId);
    if (ticketId) {
      const ticket = this.tickets.get(ticketId);
      if (ticket && ticket.status === 'open') {
        console.log(`✅ Ticket #${ticketId} trouvé pour le salon ${channelId}`);
        return ticket;
      }
    }

    // Méthode 2: Recherche dans tous les tickets (fallback)
    for (const ticket of this.tickets.values()) {
      if (ticket.channelId === channelId && ticket.status === 'open') {
        // Réparer l'association manquante
        this.channelToTicket.set(channelId, ticket.id);
        console.log(`✅ Ticket #${ticket.id} trouvé (fallback) pour le salon ${channelId}`);
        return ticket;
      }
    }
    
    console.log(`❌ Aucun ticket trouvé pour le salon ${channelId}`);
    console.log(`📊 Tickets actifs: ${Array.from(this.tickets.values()).filter(t => t.status === 'open').length}`);
    console.log(`📊 Associations salon->ticket: ${this.channelToTicket.size}`);
    return null;
  }

  getTicketById(ticketId) {
    return this.tickets.get(ticketId);
  }

  getUserTickets(userId) {
    const userTicketIds = this.userTickets.get(userId) || [];
    return userTicketIds
      .map(id => this.tickets.get(id))
      .filter(ticket => ticket && ticket.status === 'open');
  }

  closeTicket(ticketId) {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.status = 'closed';
      ticket.closedAt = new Date();
      
      // Supprimer l'association salon->ticket
      if (ticket.channelId) {
        this.channelToTicket.delete(ticket.channelId);
      }
      
      console.log(`✅ Ticket #${ticketId} fermé`);
    }
    return ticket;
  }

  addParticipant(ticketId, userId) {
    const ticket = this.tickets.get(ticketId);
    if (ticket && !ticket.participants.includes(userId)) {
      ticket.participants.push(userId);
      console.log(`✅ Utilisateur ${userId} ajouté au ticket #${ticketId}`);
    }
    return ticket;
  }

  updateTicketData(ticketId, data) {
    const ticket = this.tickets.get(ticketId);
    if (ticket) {
      ticket.data = { ...ticket.data, ...data };
      console.log(`✅ Données mises à jour pour le ticket #${ticketId}`);
    }
    return ticket;
  }

  // Méthode de debug pour afficher l'état de la base de données
  debugInfo() {
    console.log('=== DEBUG DATABASE ===');
    console.log(`Tickets totaux: ${this.tickets.size}`);
    console.log(`Tickets ouverts: ${Array.from(this.tickets.values()).filter(t => t.status === 'open').length}`);
    console.log(`Associations salon->ticket: ${this.channelToTicket.size}`);
    
    console.log('\nTickets ouverts:');
    for (const ticket of this.tickets.values()) {
      if (ticket.status === 'open') {
        console.log(`- Ticket #${ticket.id}: salon ${ticket.channelId}, utilisateur ${ticket.userId}`);
      }
    }
    
    console.log('\nAssociations salon->ticket:');
    for (const [channelId, ticketId] of this.channelToTicket.entries()) {
      console.log(`- Salon ${channelId} -> Ticket #${ticketId}`);
    }
    console.log('=====================');
  }
}

module.exports = new TicketDatabase();