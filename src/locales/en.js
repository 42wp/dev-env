// English message catalog. Keys are referenced via t('key', params) in src/lib/i18n.js.
// Placeholders use ${name} and are filled from the params object.

export default {
  // generic
  'err.prefix': 'Error',
  'docker.notRunning': 'Docker is not running.',

  // global layer
  'global.starting': 'Starting the Global Layer...',
  'global.stopping': 'Stopping the Global Layer...',
  'global.waitingMysql': 'Waiting for MySQL to be ready...',
  'global.invalid': "Invalid global command. Use 'start' or 'stop'.",

  // start
  'start.needName': 'You must provide a project name. e.g.: 42wp start jovempan',
  'start.preparing': 'Preparing environment for ${domain}...',
  'start.creatingDb': 'Creating database: ${db}',
  'start.genConfig': 'Generating ephemeral wp-config.php...',
  'start.saltsFallback': 'Could not reach api.wordpress.org; generated salts locally.',
  'start.genDockerfile': 'Generating Dockerfile (${image})...',
  'start.genCompose': 'Generating project docker-compose...',
  'start.vipCloning': 'Cloning WordPress VIP mu-plugins (${repo})...',
  'start.vipUpdating': 'Updating WordPress VIP mu-plugins...',
  'start.upping': 'Starting project containers...',
  'start.waitingWp': 'Waiting for the WordPress container to respond...',
  'start.installing': 'Running silent WordPress install...',
  'start.enablingMultisite': 'Enabling multisite (network tables + wp-config constants)...',
  'start.permalinks': 'Configuring permalinks...',
  'start.success': 'Success! The project is online.',
  'start.url': 'URL:      ${url}',
  'start.admin': 'Admin:    ${url}/wp-admin',
  'start.user': 'User:     ${user}',
  'start.pass': 'Password: ${pass}',
  'start.multisite': 'Multisite: ${mode}. Network admin: ${url}/wp-admin/network/',

  // update
  'update.needName': 'Tell me which project to update. e.g.: 42wp update jovempan',
  'update.notFound': "Project '${name}' not found at ${dir}. Run 42wp start ${name} first.",
  'update.rebuilding': 'Rebuilding ${name} on ${image}...',
  'update.updatingDb': 'Updating database schema (wp core update-db)...',
  'update.done': 'Updated! ${name} is now on WordPress ${version}.',

  // rm
  'rm.needName': 'Tell me which project to remove. e.g.: 42wp rm jovempan',
  'rm.notFound': "Project '${name}' not found at ${dir}.",
  'rm.confirm':
    "Remove '${name}'? This deletes its container, image and database. Your repository is kept.",
  'rm.needYes': 'Refusing to remove without confirmation. Re-run with --yes.',
  'rm.cancelled': 'Cancelled. Nothing was removed.',
  'rm.removingContainers': 'Removing containers and image for ${name}...',
  'rm.droppingDb': 'Dropping database: ${db}',
  'rm.mysqlDown': 'Global MySQL is not running — skipped dropping database ${db}.',
  'rm.removingData': 'Removing project data: ${dir}',
  'rm.done': "Removed '${name}'. Your repository was left untouched.",

  // stop
  'stop.needName': 'Tell me which project to stop. e.g.: 42wp stop jovempan',
  'stop.stopping': 'Stopping the ${name} environment...',
  'stop.notFound': 'Environment for ${name} not found at ${dir}.',

  // wp proxy
  'wp.needArgs': 'Provide the project and command. e.g.: 42wp wp jovempan plugin list',
  'wp.notRunning': 'Container ${container} is not running.',

  // validation
  'name.invalid':
    "Invalid project name '${name}'. Use only letters, numbers, hyphens and underscores.",

  // usage
  'usage.line': 'Usage: 42wp <command> [project] [arguments]',
  'usage.commands': 'Commands:',
  'usage.start': '  start <project>    Start the environment using \'.localhost\'.',
  'usage.update': '  update <project>   Update an existing project to a newer WordPress image.',
  'usage.stop': '  stop <project>     Stop the project containers.',
  'usage.rm': '  rm <project>       Remove a site (container, image, database) — keeps your repo.',
  'usage.wp': '  wp <project> ...   Run a WP-CLI command inside the container.',
  'usage.globalStart': '  global start       Start the Traefik proxy and MySQL.',
  'usage.globalStop': '  global stop        Stop the global infrastructure.',

  // wait
  'wait.timeout': 'Timed out waiting for ${label} after ${seconds}s.',
};
