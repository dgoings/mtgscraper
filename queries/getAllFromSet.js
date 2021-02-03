import { Root, CollectContent } from 'nodejs-web-scraper';
import cheerio from 'cheerio';
import { buildQuery, getSetMap } from '../utilities';
import { CKScraper } from '../scraper';

const getAllCardsFromSet = async (setID) => {
  const myCards=[];
  const getElementContent = (element) => {
    const $ = cheerio.load(element, null, false);
    const title = $('.productDetailTitle').text();
    const foil = $('.productDetailSet .foil').text();
    const dollarAmount = $('.creditSellPrice .sellDollarAmount').text();
    const centsAmount = $('.creditSellPrice .sellCentsAmount').text();
    const qty = $('ul.qtyList li').last().text();
    myCards.push({
      title,
      credit: `${dollarAmount}.${centsAmount}`,
      qty,
      foil: foil.length ? true : false
    });
  }

  const scraper = new CKScraper(buildQuery({category_id: setID}));

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

export const getCardsFromSets = async (sets) => {
  const setMap = getSetMap();
  const setNames = Object.keys(setMap);
  const filteredSets = sets.filter((set) => {
    return setNames.includes(set)
  });

  const buylist = {};

  await Promise.all(filteredSets.map(async (set) => {
    const cards = await getAllCardsFromSet(setMap[set]);
    buylist[set] = cards;
  }));

  return buylist;
}

