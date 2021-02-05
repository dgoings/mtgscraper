const fs = require('fs');
const path = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
import { getCardsFromSets } from './queries/getAllFromSet';
import { getAllSets } from './queries/getAllSets';
import { exportCardsToCSV, getSetCode } from './utilities';

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
      command: 'scrape [sets] [filters] [file]',
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
        }).option('file', {
          describe: 'Filepath for output file',
          type: 'string'
        }).option('csv', {
          describe: 'Convert results directly to CSV',
          type: 'boolean',
          default: false
        })
      }
    })
    .command({
      command: 'csv [input] [output]',
      describe: 'export cards to csv file',
      builder: (yargs) => {
        yargs.option('input', {
          alias: ['inputFile', 'in', 'read'],
          describe: 'Filepath to read input JSON file to be converted',
          type: 'string'
        }).option('output', {
          alias: ['outputFile', 'out', 'write'],
          describe: 'Filepath to write output CSV file to',
          type: 'string'
        })
      }
    })
    .command({
      command: 'code <setName>',
      describe: 'Get the set code for a set',
      handler: (argv) => {
        console.log(getSetCode(argv.setName))
      }
    })
    .command({
      command: 'update',
      alias: 'u',
      describe: 'Update the setlist mapping'
    })
    .example('$0 scrape --sets "Fallen Empires" "Chronicles"', 'Scrape the FEM and CHR sets')
    .example('$0 scrape --sets Kaldheim --filters foil:no -u', 'Scrape the KLD set excluding foils, after updating the set list')
    .example('$0 sc -s "Kaldheim" -f rarity:mythic', 'Scrape the KLD set for just mythics')
    .example('$0 csv', 'Convert all scraped cards to a .csv file')
    .help()
    .wrap(yargs.terminalWidth())
    .argv

  // console.log(argv)

  const cmd = argv._[0];

  if (argv.update || (cmd === 'update') || (cmd === 'u')) {
    console.log('updating set file');
    const sets = await getAllSets();
    fs.writeFileSync(path.join(process.cwd(), './cards/sets.json'), JSON.stringify(sets), () => { });
  }

  if (cmd === 'scrape' || cmd === 'sc') {
    const myCards = await getCardsFromSets(argv.sets, argv.filters);

    const output = (argv.csv)
      ? exportCardsToCSV(myCards)
      : JSON.stringify(myCards);

    const outputFile = (argv.file)
      ? argv.file
      : (argv.csv)
        ? './cards/cards.csv'
        : './cards/cards.json';

    fs.writeFileSync(path.resolve(process.cwd(), outputFile), output, () => { });
  }

  if (cmd === 'csv') {
    const csv = exportCardsToCSV(argv.inputFile || './cards/cards.json');
    fs.writeFileSync(path.resolve(process.cwd(), argv.outputFile || './cards/cards.csv'), csv, () => { });
  }
};
