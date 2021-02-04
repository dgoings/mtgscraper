import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getCardsFromSets } from './queries/getAllFromSet';
import { getAllSets } from './queries/getAllSets';
import { exportCardsToCSV } from './utilities';

(async () => {
  const argv = yargs(hideBin(process.argv))
    .usage('$0 <cmd> [args]')
    .option('u', {
      alias: 'update',
      describe: 'Update setlist before scraping',
      type: 'boolean',
      default: false
    })
    .command({
      command: 'scrape [sets] [filters]',
      aliases: ['sc'],
      describe: 'Scrape all provided sets',
      builder: (yargs) => {
        yargs.option('sets', {
          alias: ['editions','s'],
          type: 'array',
          demandOption: true,
          describe: 'Set names to scrape; wrap multi-word names in quotes'
        }).option('filters', {
          alias: ['f'],
          type: 'array',
          describe: 'Additional filters for scraping'
        })
      }
    })
    .command({
      command: 'csv',
      describe: 'export cards to csv file',
      handler: (argv) => {
        console.log(`Converting cards.json file to csv`)
      }
    })
    .example('$0 scrape --sets "Fallen Empires" "Chronicles"', 'Scrape the FEM and CHR sets')
    .example('$0 scrape --sets Kaldheim --filters foil:no -u', 'Scrape the KLD set excluding foils, after updating the set list')
    .example('$0 sc -s "Kaldheim" -f rarity:mythic', 'Scrape the KLD set for just mythics')
    .example('$0 csv', 'Convert all scraped cards to a .csv file')
    .help()
    .wrap(120)
    .argv

  if (argv.update) {
    console.log('updating set file');
    const sets = await getAllSets();
    fs.writeFileSync('./cards/sets.json', JSON.stringify(sets), () => { });
  }

  const cmd = argv._[0];

  if (cmd === 'scrape' || cmd === 'sc') {
    const myCards = await getCardsFromSets(argv.sets);
    fs.writeFileSync('./cards/cards.json', JSON.stringify(myCards), () => { });
  }

  if (cmd === 'csv') {
    const csv = exportCardsToCSV();
    fs.writeFileSync('./cards/cards.csv', csv, () => { });
  }
})()
