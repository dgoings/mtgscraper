const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
import { getCardsFromSets } from './queries/getAllFromSet';
import { getAllSets } from './queries/getAllSets';
import { exportCardsToCSV } from './utilities';

export default async function() {
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
          default: "All Editions",
          group: 'Sets:',
          describe: `List all set names to scrape
Must wrap multi-word names in quotes

Special set options:
All Editions - Don't filter by set (only use in conjunction with other filters)
Standard - Search standard legal sets
Modern - Search modern legal sets
Pioneer - Search pioneer legal sets`
        }).option('filters', {
          alias: ['f'],
          group: 'Filters:',
          describe: `Available filters:

nonfoil:yes|no - Show nonfoil cards (default yes)

foil:yes|no - Show foil cards (default yes).
Note that cards with no nonfoil printing (e.g. FTV cards) may still show up with foil:no

rarity:mythic|rare|uncommon|common|basic|special - Which rarities to show
Can use comma separated list for multiple rarities

"name:cardname" - Search for cardname in card titles (regex only on whole words)

"price:(<=|>=)XX.YY" - Specify price operator and value in XX dollars YY cents`,
          type: 'array'
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
    .wrap(yargs.terminalWidth())
    .argv

  // console.log(argv)

  if (argv.update) {
    console.log('updating set file');
    const sets = await getAllSets();
    fs.writeFileSync(path.join(__dirname, '../cards/sets.json'), JSON.stringify(sets), () => { });
  }

  const cmd = argv._[0];

  if (cmd === 'scrape' || cmd === 'sc') {
    const myCards = await getCardsFromSets(argv.sets, argv.filters);
    fs.writeFileSync(path.resolve(__dirname, '../cards/cards.json'), JSON.stringify(myCards), () => { });
  }

  if (cmd === 'csv') {
    const csv = exportCardsToCSV();
    fs.writeFileSync(path.resolve(__dirname, '../cards/cards.csv'), csv, () => { });
  }
};
