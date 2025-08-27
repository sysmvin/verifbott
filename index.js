require('dotenv').config();

const {
	Client,
	GatewayIntentBits,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const express = require('express');
const http = require('http');

// Chargement des variables d'environnement
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID; // Channel où poster les embeds de vérif
const VERIFIED_ROLE_ID = process.env.VERIFIED_ROLE_ID; // Rôle à donner si accepté
const PERM_BOT = process.env.PERM_BOT; // Rôle qui donne accès aux boutons de vérification
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID; // Channel pour le message de bienvenue
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID; // Channel pour les logs

if (!DISCORD_TOKEN || !VERIFY_CHANNEL_ID || !VERIFIED_ROLE_ID) {
	console.error('[CONFIG] Merci de définir DISCORD_TOKEN, VERIFY_CHANNEL_ID et VERIFIED_ROLE_ID dans .env');
	process.exit(1);
}

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
	],
});

// Configuration du serveur web
const app = express();
const PORT = process.env.PORT || 3000;

// Routes du serveur web
app.get('/', (req, res) => {
	res.json({
		status: 'online',
		bot: client.user?.tag || 'Connecting...',
		uptime: client.uptime || 0,
		message: 'Bot de vérification Discord opérationnel'
	});
});

app.get('/health', (req, res) => {
	res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Démarrer le serveur web
const server = http.createServer(app);
server.listen(PORT, () => {
	console.log(`[WEB] Serveur web démarré sur le port ${PORT}`);
});

client.once('ready', async () => {
	console.log(`[BOT] Connecté en tant que ${client.user.tag}`);
	
	// Enregistrer les commandes slash
	try {
		const commands = [
			{
				name: 'verifperms',
				description: 'Vérifier vos permissions de vérification',
				type: 1 // CHAT_INPUT
			}
		];
		
		// Enregistrer les commandes globalement
		await client.application.commands.set(commands);
		console.log('[BOT] Commandes slash enregistrées avec succès');
	} catch (error) {
		console.error('[BOT] Erreur lors de l\'enregistrement des commandes:', error);
	}
});

/**
 * Vérifie si un utilisateur a la permission d'utiliser les boutons de vérification
 */
async function checkVerificationPermission(interaction) {
	try {
		// Vérifier si l'utilisateur est dans le serveur
		if (!interaction.member || !interaction.guild) {
			return false;
		}

		// Si PERM_BOT est défini, vérifier que l'utilisateur a ce rôle
		if (PERM_BOT) {
			const hasRequiredRole = interaction.member.roles.cache.has(PERM_BOT);
			return hasRequiredRole;
		}

		// Fallback : permissions Discord natives (si PERM_BOT n'est pas défini)
		const hasKickPermission = interaction.member.permissions?.has('KickMembers') || false;
		const hasManageRolesPermission = interaction.member.permissions?.has('ManageRoles') || false;
		
		return hasKickPermission || hasManageRolesPermission;
	} catch (error) {
		console.error('[PERMISSIONS] Erreur lors de la vérification des permissions:', error);
		return false;
	}
}

/**
 * Retourne le texte des rôles requis pour la vérification
 */
function getRequiredRolesText() {
	if (PERM_BOT) {
		return `<@&${PERM_BOT}>`;
	} else {
		return 'Permission `KickMembers` ou `ManageRoles`';
	}
}

/**
 * Commande slash pour vérifier les permissions de vérification
 */
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;
	
	if (interaction.commandName === 'verifperms') {
		const hasPermission = await checkVerificationPermission(interaction);
		const requiredRoles = getRequiredRolesText();
		
		const embed = new EmbedBuilder()
			.setTitle('🔐 Vérification des Permissions')
			.setDescription(`**Votre statut :** ${hasPermission ? '✅ Autorisé' : '❌ Non autorisé'}`)
			.addFields(
				{ name: 'Rôles requis', value: requiredRoles, inline: false },
				{ name: 'Vos rôles', value: interaction.member.roles.cache.map(role => `<@&${role.id}>`).join(', ') || 'Aucun rôle', inline: false }
			)
			.setColor(hasPermission ? 0x00ff00 : 0xff0000)
			.setTimestamp(new Date());
		
		await interaction.reply({ embeds: [embed], ephemeral: true });
	}
});

/**
 * Crée un embed de vérification avec boutons Accepter/Refuser
 */
function buildVerificationMessage(member) {
	const accountCreatedAt = Math.floor(member.user.createdTimestamp / 1000);
	const accountAge = Math.floor((Date.now() - member.user.createdTimestamp) / (1000 * 60 * 60 * 24)); // Âge en jours
	const isNewAccount = accountAge < 7; // Compte de moins de 7 jours
	
	// Récupérer les badges Discord
	const flags = member.user.flags?.toArray() || [];
	const badges = flags.map(flag => {
		const badgeNames = {
			'Staff': '👨‍💼',
			'Partner': '🤝',
			'Hypesquad': '💎',
			'BugHunterLevel1': '🐛',
			'BugHunterGold': '🐛',
			'HypeSquadOnlineHouse1': '🏠',
			'HypeSquadOnlineHouse2': '🏠',
			'HypeSquadOnlineHouse3': '🏠',
			'PremiumEarlySupporter': '👑',
			'TeamPseudoUser': '👥',
			'VerifiedBot': '🤖',
			'VerifiedDeveloper': '👨‍💻',
			'CertifiedModerator': '🛡️',
			'BotHTTPInteractions': '🔗',
			'ActiveDeveloper': '⚡'
		};
		return badgeNames[flag] || '❓';
	}).join(' ') || 'Aucun badge';
	
	const embed = new EmbedBuilder()
		.setTitle('🔍 Vérification d\'un nouveau membre')
		.setDescription(`**Membre:** <@${member.id}>\n**Tag:** ${member.user.tag}`)
		.addFields(
			{ name: 'ID Discord', value: `\`${member.id}\``, inline: true },
			{ name: 'Création du compte', value: `<t:${accountCreatedAt}:F>\n(<t:${accountCreatedAt}:R>)`, inline: true },
			{ name: 'Âge du compte', value: `${accountAge} jour${accountAge > 1 ? 's' : ''}`, inline: true },
			{ name: 'Badges Discord', value: badges, inline: false },
		)
		.setThumbnail(member.user.displayAvatarURL({ size: 512, dynamic: true }))
		.setColor(isNewAccount ? 0xff6b35 : 0x0099ff) // Orange si récent, bleu si établi
		.setFooter({ text: 'made by 6main' })
		.setTimestamp(new Date());

	// Ajouter une note sur les permissions
	if (PERM_BOT) {
		embed.addFields({
			name: '🔐 Permissions requises',
			value: `Seuls les membres avec le rôle <@&${PERM_BOT}> peuvent utiliser ces boutons.`,
			inline: false
		});
	} else {
		embed.addFields({
			name: '🔐 Permissions requises',
			value: 'Seuls les membres avec la permission `KickMembers` ou `ManageRoles` peuvent utiliser ces boutons.',
			inline: false
		});
	}

	const actionRow = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId(`verify_accept:${member.id}`)
			.setLabel('Accepter')
			.setStyle(ButtonStyle.Success),
		new ButtonBuilder()
			.setCustomId(`verify_reject:${member.id}`)
			.setLabel('Refuser')
			.setStyle(ButtonStyle.Danger),
	);

	return { embed, components: [actionRow] };
}

// Quand un utilisateur rejoint le serveur, envoyer l'embed de vérification
client.on('guildMemberAdd', async (member) => {
	try {
		const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
		if (!channel || !channel.isTextBased()) {
			return;
		}

		const { embed, components } = buildVerificationMessage(member);
		await channel.send({ embeds: [embed], components });
	} catch (error) {
		// Erreur silencieuse
	}
});

// Gestion des interactions des boutons
client.on('interactionCreate', async (interaction) => {
	try {
		if (!interaction.isButton()) return;

		const [action, targetId] = interaction.customId.split(':');
		if (!['verify_accept', 'verify_reject'].includes(action) || !targetId) return;

		// Vérification des permissions de vérification
		const hasPermission = await checkVerificationPermission(interaction);
		if (!hasPermission) {
			return interaction.reply({ 
				content: '❌ **Accès refusé** : Vous n\'avez pas la permission d\'utiliser les boutons de vérification.\n\n**Rôles requis :** ' + getRequiredRolesText(), 
				ephemeral: true 
			});
		}

		const guild = interaction.guild;
		if (!guild) return;

		const targetMember = await guild.members.fetch(targetId).catch(() => null);
		if (!targetMember) {
			if (!interaction.replied && !interaction.deferred) {
				return interaction.reply({ content: 'Le membre ciblé est introuvable (a peut-être quitté).', ephemeral: true });
			}
			return;
		}

		if (action === 'verify_accept') {
			// Donner le rôle vérifié
			const role = guild.roles.cache.get(VERIFIED_ROLE_ID) || await guild.roles.fetch(VERIFIED_ROLE_ID).catch(() => null);
			if (!role) {
				if (!interaction.replied && !interaction.deferred) {
					return interaction.reply({ content: 'Rôle de vérification introuvable. Vérifie VERIFIED_ROLE_ID.', ephemeral: true });
				}
				return;
			}
			
			try {
				await targetMember.roles.add(role);
			} catch (err) {
				if (!interaction.replied && !interaction.deferred) {
					return interaction.reply({ content: `Erreur lors de l'ajout du rôle: ${err.message}`, ephemeral: true });
				}
				return;
			}

			// Envoyer le message de bienvenue
			if (WELCOME_CHANNEL_ID) {
				try {
					const welcomeChannel = await client.channels.fetch(WELCOME_CHANNEL_ID);
					if (welcomeChannel && welcomeChannel.isTextBased()) {
						await welcomeChannel.send(`**Bienvenue** <@${targetMember.id}>!`);
					}
				} catch (e) {
					// Erreur silencieuse
				}
			}

			// Logger l'action
			if (LOG_CHANNEL_ID) {
				try {
					const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
					if (logChannel && logChannel.isTextBased()) {
						const logEmbed = new EmbedBuilder()
							.setTitle('Membre accepté')
							.setDescription(`**Membre:** <@${targetMember.id}> (${targetMember.user.tag})\n**Accepté par:** <@${interaction.user.id}> (${interaction.user.tag})\n**Rôle donné:** ${role.name}`)
							.setColor(0x00ff00)
							.setTimestamp(new Date());
						await logChannel.send({ embeds: [logEmbed] });
					}
				} catch (e) {
					// Erreur silencieuse
				}
			}

			await interaction.update({ components: [] });
			const confirmMsg = await interaction.followUp({ content: `**Accepté et a reçu le rôle.**`, ephemeral: false });
			// Supprimer le message de confirmation après 10 secondes
			setTimeout(async () => {
				try {
					await confirmMsg.delete();
				} catch (e) {
					// Ignorer si le message a déjà été supprimé
				}
			}, 10000);
			return;
		}

		if (action === 'verify_reject') {
			// Envoyer le DM ET le message dans le channel AVANT le kick
			let dmSent = false;
			
			// 1. Essayer d'envoyer le DM
			try {
				await targetMember.send('Tu as été refusé sur le serveur et tu vas être expulsé.');
				dmSent = true;
			} catch (dmError) {
				// DM impossible
			}
			
			// 2. Envoyer le message dans le channel
			try {
				const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
				if (channel && channel.isTextBased()) {
					await channel.send(`**REFUS:**.`);
				}
			} catch (e) {
				// Erreur silencieuse
			}
			
			// 3. Attendre 5 secondes pour que la personne puisse lire les messages
			await new Promise(resolve => setTimeout(resolve, 5000));
			
			// 4. Kick la personne
			try {
				await targetMember.kick('Refusé à la vérification');
			} catch (kickError) {
				if (!interaction.replied && !interaction.deferred) {
					return interaction.reply({ content: `Erreur lors de l'expulsion: ${kickError.message}`, ephemeral: true });
				}
				return;
			}

			// Logger l'action
			if (LOG_CHANNEL_ID) {
				try {
					const logChannel = await client.channels.fetch(LOG_CHANNEL_ID);
					if (logChannel && logChannel.isTextBased()) {
						const logEmbed = new EmbedBuilder()
							.setTitle('embre refusé')
							.setDescription(`**Membre:** <@${targetMember.id}> (${targetMember.user.tag})\n**Refusé par:** <@${interaction.user.id}> (${interaction.user.tag})\n**DM envoyé:** ${dmSent ? 'Oui' : 'Non'}`)
							.setColor(0xff0000)
							.setTimestamp(new Date());
						await logChannel.send({ embeds: [logEmbed] });
					}
				} catch (e) {
					// Erreur silencieuse
				}
			}

			await interaction.update({ components: [] });
			const dmStatus = dmSent ? ' (DM + message envoyés)' : ' (message dans le channel seulement)';
			const confirmMsg = await interaction.followUp({ content: `<@${targetMember.id}> a été refusé et expulsé.${dmStatus}`, ephemeral: false });
			// Supprimer le message de confirmation après 10 secondes
			setTimeout(async () => {
				try {
					await confirmMsg.delete();
				} catch (e) {
					// Ignorer si le message a déjà été supprimé
				}
			}, 10000);
			return;
		}
	} catch (error) {
		// Éviter de répondre plusieurs fois à la même interaction
		if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
			try {
				await interaction.reply({ content: `Erreur: ${error.message || 'inconnue'}`, ephemeral: true });
			} catch (_) {
				// ignorer
			}
		}
	}
});

client.login(DISCORD_TOKEN);



