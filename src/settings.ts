export default {
  tz: process.env['INPUT_TIMEZONE']!,
  folder: process.env['INPUT_FOLDERID']!,
  autoJoin: process.env['INPUT_AUTOJOIN'] == 'true',
  skipChannels: (process.env['INPUT_SKIPCHANNELS'] || '').split(' '),
  useLatestFile: process.env['INPUT_USELATESTFILE'] == 'true',
  backupWithDate: process.env['INPUT_BACKUPWITHDATE'] == 'true',
  lastDays: parseInt(process.env['INPUT_LASTDAYS'] || '30'),
  slack: {
    token: process.env['INPUT_SLACKTOKEN']!
  },
  google: {
    email: process.env['INPUT_GOOGLECLIENTEMAIL']!,
    key: process.env['INPUT_GOOGLEPRIVATEKEY']!
  }
};
