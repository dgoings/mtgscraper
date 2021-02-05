'use strict';

const fs = require('fs');
const path = require('path');

const defaultOptions = {
  sort: "price_desc",
  search: "mtg_advanced",
  category_id: "0"
};

const parseFilters = (filters) => {

  const parsedFilters = filters.reduce((acc, filter) => {
    const splitFilter = filter.split(':', 2);
    switch (splitFilter[0]) {
      case 'foil':
        if (splitFilter[1] === 'yes') {
          acc.foil = 1;
          break;
        }
        // Check for specific foil/nonfoil negations
        // e.g. foil:no with no nonfoil filter should result in an explicit { nonfoil: 1 } query option
        if (splitFilter[1] === 'no') {
          acc.nonfoil = 1;
        }
        break;
      case 'nonfoil':
        if (splitFilter[1] === 'yes') {
          acc.nonfoil = 1;
          break;
        }
        // nonfoil:no with no foil filter should result in an explicit { foil: 1 } query option
        if (splitFilter[1] === 'no') {
          acc.foil = 1;
        }
        break;
      case 'rarity':
        acc['rarity'] = [];
        const rarities = splitFilter[1].split(',');
        rarities.forEach((rarity) => {
          switch (rarity) {
            case 'mythic':
              acc['rarity'].push('M');
              break;
            case 'rare':
              acc['rarity'].push('R');
              break;
            case 'uncommon':
              acc['rarity'].push('U');
              break;
            case 'common':
              acc['rarity'].push('C');
              break;
            case 'basic':
              acc['rarity'].push('L');
              break;
            case 'special':
              acc['rarity'].push('S');
              break;
          }
        });
        break;
      case 'name':
        acc.name = splitFilter[1];
        break;
      case 'price':
        const match = splitFilter[1].match(/(<=|>=)\$?(\d+\.\d\d)/);
        if (match) {
          acc.price_op = match[1];
          acc.price = match[2];
        }
        break;
    }

    return acc;
  }, {});

  return parsedFilters;
};

// Eventually this should dynamically build a query string based on input params
const buildQuery = (queryOptions) => {
  const options = {
    ...defaultOptions,
    ...queryOptions
  };

  const queryString = Object.entries(options).reduce((acc, [key, value]) => {
    if (key === 'rarity') {
      const rarityFilters = value.reduce((acc, rarity, i) => {
        return acc.concat(`&filter[rarity][${i}]=${rarity}`)
      }, '');
      return acc.concat(rarityFilters);
    }
    return acc.concat(`&filter[${key}]=${value}`);
  }, '');

  return encodeURI(queryString.slice(1));
};

const getSetMap = () => {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './cards/sets.json')));
};

const getCardMap = (file) => {
  return JSON.parse(fs.readFileSync(path.resolve(process.cwd(), file)));
};

const exportCardsToCSV = (cards) => {
  const cardMap = (typeof cards === 'string') ? getCardMap(file) : cards;
  const header = `Card Name,Edition,Foil,Quantity,Cash,Credit\n`;

  let csv = '';
  csv += header;

  Object.entries(cardMap).forEach(([set, cards]) => {
    const setCode = getSetCode(set);
    cards.forEach((card) => {
      csv += `"${card.title}",${setCode},${card.foil},${card.qty},${card.cash},${card.credit}\n`;
    });
  });

  return csv;
};

const setCodeMap = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), './cards/SetList.json'))).data.reduce((acc, set, i) => {
  acc[set.name] = set.code;
  return acc;
}, {});

const getSetCode = (setName) => {
  return setCodeMap[setName];
};

const { Scraper, Root, CollectContent } = require('nodejs-web-scraper');

const baseConfig = {
  baseSiteUrl: `https://cardkingdom.com`,
  filePath: './cards/',
  logPath: './logs/'
};

class CKScraper {
  constructScraper(query) {
    return new Scraper({
      ...baseConfig,
      startUrl: `https://cardkingdom.com/purchasing/mtg_singles?${query}`,
    });
  }

  constructor(query) {
    this.scraper = this.constructScraper(query);
  }

  async scrape(root) {
    await this.scraper.scrape(root);
  }

  async getPageCount() {
    const pageRoot = new Root();
    const pageCount = new CollectContent('.mainListing .pagination li a', { name: 'page' });
    pageRoot.addOperation(pageCount);

    await this.scrape(pageRoot);
    const pageNumbers = pageCount.getData().map((page) => {
      return Number.parseInt(page);
    }).filter((num) => {
      return Number.isInteger(num);
    }).sort((a, b) => {
      return a - b;
    });

    return pageNumbers[pageNumbers.length-1];
  }

  async getPaginationConfig() {
    return {
      queryString: 'page',
      begin: 1,
      end: await this.getPageCount()
    }
  }
}

const { Root: Root$1, CollectContent: CollectContent$1 } = require('nodejs-web-scraper');
const cheerio = require('cheerio');

const getAllCardsFromSet = async (setID, filters = {}) => {
  const myCards=[];
  const getElementContent = (element) => {
    const $ = cheerio.load(element, null, false);
    const title = $('.productDetailTitle').text();
    const foil = $('.productDetailSet .foil').text();
    const cashDollarAmount = $('.usdSellPrice .sellDollarAmount').text();
    const cashCentsAmount = $('.usdSellPrice .sellCentsAmount').text();
    const creditDollarAmount = $('.creditSellPrice .sellDollarAmount').text();
    const creditCentsAmount = $('.creditSellPrice .sellCentsAmount').text();
    const qty = $('ul.qtyList li').last().text();
    myCards.push({
      title,
      qty,
      foil: foil.length ? true : false,
      cash: `${cashDollarAmount}.${cashCentsAmount}`,
      credit: `${creditDollarAmount}.${creditCentsAmount}`
    });
  };

  const scraper = new CKScraper(buildQuery({...filters, category_id: setID}));

  const cards = new CollectContent$1('ul.itemList.buyList li .itemContentWrapper', {
    contentType: 'html',
    getElementContent
  });

  const cardRoot = new Root$1({
    pagination: await scraper.getPaginationConfig()
  });
  cardRoot.addOperation(cards);

  await scraper.scrape(cardRoot);

  return myCards;
};

const getCardsFromSets = async (sets, filters) => {
  const setMap = getSetMap();
  const setNames = Object.keys(setMap);
  const filteredSets = sets.filter((set) => {
    return setNames.includes(set)
  });

  const parsedFilters = filters ? parseFilters(filters) : {};

  const buylist = {};

  await Promise.all(filteredSets.map(async (set) => {
    const cards = await getAllCardsFromSet(setMap[set], parsedFilters);
    buylist[set] = cards;
  }));

  return buylist;
};

const cheerio$1 = require('cheerio');
const { Root: Root$2, CollectContent: CollectContent$2 } = require('nodejs-web-scraper');

const getAllSets = async () => {
  const mySets={};
  const getSetInfo = (element) => {
    const $ = cheerio$1.load(element, null, false);
    $('option').each((i, elem) => {
      mySets[$(elem).text().trim()] = $(elem).attr("value");
    });
  };

  const scraper = new CKScraper(buildQuery());

  const sets = new CollectContent$2('#editionContainer select', {
    contentType: 'html',
    getElementContent: getSetInfo
  });

  const cardRoot = new Root$2();
  cardRoot.addOperation(sets);

  await scraper.scrape(cardRoot);

  return mySets;
};

const fs$1 = require('fs');
const path$1 = require('path');
const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');

async function main() {
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
        });
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
        });
      }
    })
    .command({
      command: 'code <setName>',
      describe: 'Get the set code for a set',
      handler: (argv) => {
        console.log(getSetCode(argv.setName));
      }
    })
    .example('$0 scrape --sets "Fallen Empires" "Chronicles"', 'Scrape the FEM and CHR sets')
    .example('$0 scrape --sets Kaldheim --filters foil:no -u', 'Scrape the KLD set excluding foils, after updating the set list')
    .example('$0 sc -s "Kaldheim" -f rarity:mythic', 'Scrape the KLD set for just mythics')
    .example('$0 csv', 'Convert all scraped cards to a .csv file')
    .help()
    .wrap(yargs.terminalWidth())
    .argv;

  // console.log(argv)

  if (argv.update) {
    console.log('updating set file');
    const sets = await getAllSets();
    fs$1.writeFileSync(path$1.join(process.cwd(), './cards/sets.json'), JSON.stringify(sets), () => { });
  }

  const cmd = argv._[0];

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

    fs$1.writeFileSync(path$1.resolve(process.cwd(), outputFile), output, () => { });
  }

  if (cmd === 'csv') {
    const csv = exportCardsToCSV(argv.inputFile || './cards/cards.json');
    fs$1.writeFileSync(path$1.resolve(process.cwd(), argv.outputFile || './cards/cards.csv'), csv, () => { });
  }
}

module.exports = main;
