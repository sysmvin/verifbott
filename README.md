# Bot de Vérification Discord

Un bot Discord intelligent pour la vérification automatique des nouveaux membres avec système d'approbation par boutons.

## 🚀 Fonctionnalités

- **Vérification automatique** : Détection des nouveaux membres
- **Système d'approbation** : Boutons Accepter/Refuser avec permissions
- **Analyse des comptes** : Âge du compte, badges Discord, etc.
- **Gestion des rôles** : Attribution automatique des rôles vérifiés
- **Logs complets** : Suivi de toutes les actions
- **Messages de bienvenue** : Accueil personnalisé des membres acceptés
- **Serveur web intégré** : Endpoints de santé et monitoring

## 📋 Prérequis

- Node.js 18+ 
- Compte Discord avec permissions de bot
- Serveur Discord avec permissions appropriées

## 🔧 Installation

### 1. Cloner le repository
```bash
git clone <votre-repo-github>
cd bot-verification-discord
```

### 2. Installer les dépendances
```bash
npm install
```

### 3. Configuration des variables d'environnement
Créer un fichier `.env` à la racine du projet :

```env
DISCORD_TOKEN=votre_token_bot_discord
VERIFY_CHANNEL_ID=id_du_channel_verification
VERIFIED_ROLE_ID=id_du_role_verifie
VERIFY_ROLES=id_role1,id_role2,id_role3
WELCOME_CHANNEL_ID=id_du_channel_bienvenue
LOG_CHANNEL_ID=id_du_channel_logs
PORT=3000
```

### 4. Lancer le bot
```bash
npm start
```

## 🌐 Déploiement sur Render

### 1. Configuration Render
Le fichier `render.yaml` est déjà configuré avec :
- Type de service : Web
- Environnement : Node.js
- Variables d'environnement configurées
- Port : 10000

### 2. Variables d'environnement sur Render
Configurer ces variables dans votre dashboard Render :
- `DISCORD_TOKEN`
- `VERIFY_CHANNEL_ID`
- `VERIFIED_ROLE_ID`
- `VERIFY_ROLES`
- `WELCOME_CHANNEL_ID`
- `LOG_CHANNEL_ID`

### 3. Déploiement automatique
Connectez votre repository GitHub à Render pour un déploiement automatique.

## 📚 Utilisation

### Permissions requises
- **Bot** : `Guilds`, `GuildMembers`, `SendMessages`, `ManageRoles`
- **Utilisateurs** : Rôles spécifiés dans `VERIFY_ROLES` ou permission `KickMembers`

### Workflow de vérification
1. Nouveau membre rejoint le serveur
2. Bot envoie un embed de vérification avec boutons
3. Modérateurs cliquent sur Accepter/Refuser
4. Si accepté : rôle attribué + message de bienvenue
5. Si refusé : expulsion du serveur

## 🔒 Sécurité

- Vérification des permissions avant actions
- Logs de toutes les opérations
- Gestion des erreurs robuste
- Variables d'environnement sécurisées

## 📝 API Endpoints

- `GET /` : Statut du bot
- `GET /health` : Santé du service

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👨‍💻 Auteur

**6main** - [GitHub](https://github.com/votre-username)

---

⭐ N'oubliez pas de mettre une étoile si ce projet vous a aidé !

