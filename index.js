const { Client, Collection, ActivityType, IntentsBitField, Partials, GatewayIntentBits } = require('discord.js')
const path = require('path')
const fs = require('fs')
const fse = require('fs-extra')
const childproc = require('child_process')

const client = new Client({
  intents: [
    Object.values(IntentsBitField.Flags),
    Object.values(GatewayIntentBits)
  ],
  partials: [Object.values(Partials)]
})

client.login(process.env.TOKEN)

client.commands = new Collection()

let cache = path.join(__dirname, 'cache')
require('./corehandler.js')()
let cores = require('./cores.json')

client.on('ready', () => {
  require('./commandhandler.js')(client)

  console.log(client.user.tag + ' online!')

  client.user.setPresence({
    status: 'idle',
    activities: [{
      name: 'Hosting your code!',
      type: ActivityType.Custom
    }]
  })

  reloadProcesses()

  client.users.cache.forEach(async (user) => {
    if (!(await isExists(path.join(cache, user.id)))) return await fse.mkdir(path.join(cache, user.id))
  })
})

function rm(file, args) {
  return childproc.exec('rm ' + args + ' ' + file)
}

function isExists(file) {
  return new Promise(resolve => {
    fs.access(file, fs.constants.F_OK | fs.constants.R_OK | fs.constants.W_OK, (err) => {
      if (err) return resolve(false)

      return resolve(true)
    })
  })
}

function onlyAccess(filepath, gid, uid) {
  return new Promise(async (resolve) => {
    if (!(await isExists(filepath))) return resolve()

    fs.open(filepath, 'w', 0o0640, (err, fd) => {
      if (err) {
        console.error(`Failed to open file: ${err}`);
        return resolve();
      }

      fs.fchown(fd, uid, gid, (err) => {
        if (err) {
          console.error(`Failed to change owner/group of file: ${err}`);
        }

        fs.close(fd, (err) => {
          if (err) {
            console.error(`Failed to close file: ${err}`);
          }

          resolve()
        });
      });
    });
  })
}

function reloadProcesses() {
  fs.readdirSync(cache).forEach(userCache => {
    fs.readdirSync(path.join(cache, userCache)).forEach(async (processId) => {
      let info = path.join(cache, userCache, processId, 'info.json')

      let entryPoint = info.run ? path.join(cache, userCache, processId, info.run) : undefined || path.join(cache, userCache, processId, 'none')
      let core = info.core || 'nodejs'
      let coreinfo = cores[core]
      let cwd = path.join(cache, userCache, processId)
      /*let linux = info.linux*/

      if (!coreinfo) {
        let hoster = await client.users.fetch(userCache)

        hoster.send('for you process ' + processId + ': we cannot found a core named ' + core + '! we will remove this process from our database')

        rm(path.join(cache, userCache, processId), '-rf')
        return
      }

      let runthis = coreinfo.cmd.replaceAll('{FILE}', entryPoint).replaceAll('{ARGS}', info.args)

      let hosted = cmd(runthis, false, { cwd: cwd })

      hosted.stdout.on('data', async (chunk) => {
        let hoster = await client.users.fetch(userCache)
        let format = `${info.name}@${info.id}: ${chunk.toString()}`
        hoster.send(format)
      })
      hosted.stderr.on('data', async (chunk) => {
        let hoster = await client.users.fetch(userCache)
        let format = `${info.name}@${info.id}: err=> ${chunk.toString()}`
        hoster.send(format)
      })
      hosted.on('exit', async (chunk) => {
        let hoster = await client.users.fetch(userCache)
        let format = `${info.name}@${info.id}: process exited!`

        rm(path.join(cache, userCache, processId), '-rf')
        hoster.send(format)
      })
    })
  })
}

function cmd(_cmd, promise, opts) {
  let splitted = _cmd.split(' ')
  let cmd = splitted[0]
  let args = _cmd.replaceAll(`${cmd} `, '').split(' ')
  let proc = childproc.spawn(cmd, args, opts)

  return promise ? new Promise(resolve => {
    let opterr = []
    let optlog = []

    proc.stdout.on('data', (chunk) => {
      optlog.push(chunk.toString())
    })

    proc.stderr.on('data', (chunk) => {
      opterr.push(chunk.toString())
    })

    proc.on('exit', () => {
      resolve({ err: opterr, log: optlog })
    })
  }) : proc
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return

  if (!(await isExists(path.join(cache, interaction.user.id)))) return await fse.mkdir(path.join(cache, interaction.user.id))

  const command = client.commands.get(interaction.commandName)

  if (!command) {
    interaction.reply(`No command matching ${interaction.commandName} was found.`, { ephemeral: true });
    return
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
})

