# Bot Discord Ticket System

Un bot Discord complet avec système de tickets numérotés et formulaires interactifs.

## 🚀 Fonctionnalités

- **Système de tickets numérotés** : Chaque ticket est automatiquement numéroté (1, 2, 3, etc.)
- **Formulaire interactif** : Collecte nom, prénom, permis bateau et demande
- **Gestion multi-utilisateurs** : Plusieurs membres peuvent créer des tickets
- **Commandes de gestion** : Fermer tickets, ajouter des participants
- **Embed personnalisable** : Interface moderne avec boutons Discord
- **Sécurité intégrée** : Permissions et limitations par utilisateur

## 📋 Commandes

### Commandes générales
- `!ticket #salon` - Envoie l'embed de ticket dans le salon mentionné
- `!help` - Affiche la liste des commandes

### Commandes dans les tickets
- `!close` - Ferme le ticket actuel
- `!add @utilisateur` - Ajoute un utilisateur au ticket

## 🛠️ Installation

1. **Cloner et installer les dépendances**
   ```bash
   npm install
   ```

2. **Configurer le bot**
   - Copiez `.env.example` vers `.env`
   - Remplissez vos informations Discord :
     ```env
     DISCORD_TOKEN=votre_token_bot
     CLIENT_ID=votre_client_id
     GUILD_ID=votre_server_id
     ```

3. **Créer une application Discord**
   - Allez sur [Discord Developer Portal](https://discord.com/developers/applications)
   - Créez une nouvelle application
   - Dans "Bot", créez un bot et copiez le token
   - Dans "OAuth2 > URL Generator", sélectionnez :
     - **Scopes**: `bot`
     - **Permissions**: `Manage Channels`, `Send Messages`, `Embed Links`, `Read Message History`

4. **Démarrer le bot**
   ```bash
   npm start
   ```

## 📖 Utilisation

1. **Configurer l'embed de ticket**
   ```
   !ticket #general
   ```
   
2. **Les utilisateurs cliquent sur "Nous contacter 📩"**

3. **Remplissent le formulaire automatique** :
   - Nom
   - Prénom  
   - Permis bateau (Oui/Non)
   - Demande détaillée

4. **Un salon privé est créé** avec toutes les informations

5. **Gestion du ticket** :
   - `!add @membre` pour ajouter quelqu'un
   - `!close` pour fermer et supprimer

## 🔧 Configuration

Le fichier `config.js` permet de personnaliser :
- Préfixe des commandes (par défaut `!`)
- Couleurs des embeds
- Limite de tickets par utilisateur
- Nom de la catégorie des tickets

## 🔒 Sécurité

- Permissions automatiques pour chaque ticket
- Limite du nombre de tickets par utilisateur
- Vérifications des permissions pour les commandes
- Gestion d'erreurs complète

## 📝 Structure du projet

```
├── bot.js              # Fichier principal du bot
├── config.js           # Configuration
├── commands/
│   └── ticket.js       # Commandes de gestion des tickets
├── handlers/
│   └── interactions.js # Gestion des boutons et modals
└── utils/
    ├── database.js     # Base de données en mémoire
    └── embeds.js       # Utilitaires pour les embeds
```

Le bot est maintenant prêt à gérer vos tickets de manière professionnelle !