const { Root, CollectContent } = require('nodejs-web-scraper');
const cheerio = require('cheerio');
import { buildQuery, getSetMap, parseFilters } from '../utilities';
import { CKScraper } from '../scraper';

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
  }

  const scraper = new CKScraper(buildQuery({...filters, category_id: setID}));

  const cards = new CollectContent('ul.itemList.buyList li .itemContentWrapper', {
    contentType: 'html',
    getElementContent
  });

  const cardRoot = new Root({
    pagination: await scraper.getPaginationConfig()
  });
  cardRoot.addOperation(cards);

  await scraper.scrape(cardRoot);

  return myCards;
}

export const getCardsFromSets = async (sets, filters) => {
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
}

