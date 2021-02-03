import fs from 'fs';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { getCardsFromSets } from './queries/getAllFromSet';
import { getAllSets } from './queries/getAllSets';

(async () => {
  const argv = yargs(hideBin(process.argv))
    .usage('$0 <cmd> [args]')
    .option('u', {
      alias: 'update',
      describe: 'Update setlist before scraping',
      type: 'boolean',
      default: false
    })
    .option('sets', {
      describe: 'Set names for what sets to scrape',
      type: 'array',
    })
    .example('$0 --sets "Fallen Empires" "Chronicles"', 'Scrape the FE and CHR sets')
    .example('$0 --sets "Kaldheim" -u', 'Scrape the Kaldheim set after updating the set list')
    .help()
    .argv

  if (argv.update) {
    console.log('updating set file');
    const sets = await getAllSets();
    fs.writeFileSync('./cards/sets.json', JSON.stringify(sets), () => { });
  }

  const myCards = await getCardsFromSets(argv.sets);
  fs.writeFileSync('./cards/cards.json', JSON.stringify(myCards), () => { });
})()
