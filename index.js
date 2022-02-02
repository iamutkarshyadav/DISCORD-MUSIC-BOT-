const Discord = require(`discord.js`);
const { Client, Collection, MessageEmbed, MessageAttachment } = require(`discord.js`);
const { readdirSync } = require(`fs`);
const { join } = require(`path`);
const db = require('quick.db');
const { keep_alive } = require("./keep_alive");
const { TOKEN, PREFIX, AVATARURL, BOTNAME, } = require(`./config.json`);
const figlet = require("figlet");
const client = new Client({
  disableMentions: ``,
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  restTimeOffset: 0

});
client.login(process.env.TOKEN);
client.commands = new Collection();
client.prefix = PREFIX;
client.queue = new Map();
const cooldowns = new Collection();
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, `\\$&`);
// dont touch it!
client.on(`ready`, () => {
  setInterval(() => {
    let member;
    client.guilds.cache.forEach(async guild => {
      await delay(15);
      member = await client.guilds.cache.get(guild.id).members.cache.get(client.user.id)
      if (!member.voice.channel)
        return;
      if (member.voice.channel.members.size === 1) { return member.voice.channel.leave(); }
    });
 client.user.setActivity(`${PREFIX} UTKARSH, {
      type: "Listening",
    });


  }, (5000));
  figlet.text(`${client.user.username} ready!`, function (err, data) {
    if (err) {
      console.log('Something went wrong');
      console.dir(err);
    }
    console.log(`═════════════════════════════════════════════════════════════════════════════`);
    console.log(data)
    console.log(`═════════════════════════════════════════════════════════════════════════════`);
  })

});
//DO NOT TOUCH
client.on(`warn`, (info) => console.log(info));
//DO NOT TOUCH
client.on(`error`, console.error);
//DO NOT TOUCH
commandFiles = readdirSync(join(__dirname, `Music`)).filter((file) => file.endsWith(`.js`));
for (const file of commandFiles) {
  const command = require(join(__dirname, `Music`, `${file}`));
  client.commands.set(command.name, command);
}
commandFiles = readdirSync(join(__dirname, `others`)).filter((file) => file.endsWith(`.js`));
for (const file of commandFiles) {
  const command = require(join(__dirname, `others`, `${file}`));
  client.commands.set(command.name, command);
}
//COMMANDS //DO NOT TOUCH
client.on(`message`, async (message) => {
  if (message.author.bot) return;
  let prefix = await db.get(`prefix_${message.guild.id}`)
  if (prefix === null) prefix = PREFIX;
  if (message.content.includes(client.user.id)) {
    message.reply(new Discord.MessageEmbed().setColor("#F0EAD6").setAuthor(`${message.author.username}, My Prefix is ${prefix}, to get started; type ${prefix}help`, message.author.displayAvatarURL({ dynamic: true })));
  }
  if (message.content.startsWith(`${prefix}embed`)) {
    const saymsg = message.content.slice(Number(prefix.length) + 5)
    const embed = new Discord.MessageEmbed()
      .setColor("#F0EAD6")
      .setDescription(saymsg)
      .setFooter(client.user.username, client.user.displayAvatarURL())
    message.delete({ timeout: 300 })
    message.channel.send(embed)
  }
  const prefixRegex = new RegExp(`^(<@!?${client.user.id}>|${escapeRegex(prefix)})\\s*`);
  if (!prefixRegex.test(message.content)) return;
  const [, matchedPrefix] = message.content.match(prefixRegex);
  const args = message.content.slice(matchedPrefix.length).trim().split(/ +/);
  const commandName = args.shift().toLowerCase();
  const command =
    client.commands.get(commandName) ||
    client.commands.find((cmd) => cmd.aliases && cmd.aliases.includes(commandName));
  if (!command) return;
  if (!cooldowns.has(command.name)) {
    cooldowns.set(command.name, new Collection());
  }
  const now = Date.now();
  const timestamps = cooldowns.get(command.name);
  const cooldownAmount = (command.cooldown || 1) * 1000;
  if (timestamps.has(message.author.id)) {
    const expirationTime = timestamps.get(message.author.id) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return message.reply(
        new MessageEmbed().setColor("#F0EAD6")
          .setTitle(`:x: Please wait \`${timeLeft.toFixed(1)} seconds\` before reusing the \`${prefix}${command.name}\`!`)
      );
    }
  }
  timestamps.set(message.author.id, now);
  setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);
  try {
    command.execute(message, args, client);
  } catch (error) {
    console.error(error);
    message.reply(new MessageEmbed().setColor("#F0EAD6")
      .setTitle(`:x: There was an error executing that command.`)).catch(console.error);
  }


});
function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}
