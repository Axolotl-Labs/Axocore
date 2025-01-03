const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',
}

const axologger = {
  // can get lot of args all as messages
  log: function (...messages: string[]) {
    console.log('\n' + messages.join(' '))
  },
  error: function (...messages: string[]) {
    console.log('\n' + colors.red + messages.join(' ') + colors.reset)
  },
  success: function (...messages: string[]) {
    console.log('\n' + colors.green + messages.join(' ') + colors.reset)
  },
  info: function (...messages: string[]) {
    console.log('\n' + colors.cyan + messages.join(' ') + colors.reset)
  },
  warn: function (...messages: string[]) {
    console.log('\n' + colors.yellow + messages.join(' ') + colors.reset)
  },
}

export default axologger
