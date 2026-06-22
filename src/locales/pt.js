// Catálogo de mensagens em Português. As chaves são as mesmas de en.js.
// Mantém os textos originais do 42script.sh.

export default {
  // genérico
  'err.prefix': 'Erro',
  'docker.notRunning': 'Docker não está rodando.',

  // camada global
  'global.starting': 'Iniciando a Camada Global...',
  'global.stopping': 'Parando Camada Global...',
  'global.waitingMysql': 'Aguardando MySQL iniciar...',
  'global.invalid': "Comando global inválido. Use 'start' ou 'stop'.",

  // start
  'start.needName': 'Você precisa informar o nome do projeto. Ex: 42wp start jovempan',
  'start.preparing': 'Preparando ambiente para ${domain}...',
  'start.creatingDb': 'Criando banco de dados: ${db}',
  'start.genConfig': 'Gerando wp-config.php efêmero...',
  'start.saltsFallback': 'Não foi possível acessar api.wordpress.org; salts gerados localmente.',
  'start.genDockerfile': 'Gerando Dockerfile...',
  'start.genCompose': 'Gerando docker-compose do projeto...',
  'start.upping': 'Subindo containers do projeto...',
  'start.waitingWp': 'Aguardando o container WP responder...',
  'start.installing': 'Executando instalação silenciosa do WordPress...',
  'start.permalinks': 'Configurando Permalinks...',
  'start.success': 'Sucesso! O projeto está online.',
  'start.url': 'URL:      ${url}',
  'start.admin': 'Admin:    ${url}/wp-admin',
  'start.user': 'Usuário:  ${user}',
  'start.pass': 'Senha:    ${pass}',

  // stop
  'stop.needName': 'Informe o projeto para parar. Ex: 42wp stop jovempan',
  'stop.stopping': 'Parando o ambiente ${name}...',
  'stop.notFound': 'Ambiente para ${name} não encontrado em ${dir}.',

  // proxy wp
  'wp.needArgs': 'Informe o projeto e o comando. Ex: 42wp wp jovempan plugin list',
  'wp.notRunning': 'Container ${container} não está rodando.',

  // validação
  'name.invalid':
    "Nome de projeto inválido '${name}'. Use apenas letras, números, hífens e underscores.",

  // uso
  'usage.line': 'Uso: 42wp <comando> [projeto] [argumentos]',
  'usage.commands': 'Comandos:',
  'usage.start': "  start <projeto>    Inicia o ambiente usando '.localhost'.",
  'usage.stop': '  stop <projeto>     Para os containers do projeto.',
  'usage.wp': '  wp <projeto> ...   Executa um comando WP-CLI no container.',
  'usage.globalStart': '  global start       Inicia o proxy Traefik e o MySQL.',
  'usage.globalStop': '  global stop        Para a infraestrutura global.',

  // wait
  'wait.timeout': 'Tempo esgotado aguardando ${label} após ${seconds}s.',
};
