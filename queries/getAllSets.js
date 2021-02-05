const cheerio = require('cheerio');
const { Root, CollectContent } = require('nodejs-web-scraper');
import { buildQuery } from '../utilities';
import { CKScraper } from '../scraper';

export const getAllSets = async () => {
  const mySets={};
  const getSetInfo = (element) => {
    const $ = cheerio.load(element, null, false);
    $('a').each((i, elem) => {
      mySets[$(elem).text().trim()] = $(elem).attr("href").match(/catalog\/view\/(\d+)$/)[1];
    });
  }

  const scraper = new CKScraper(buildQuery('catalog/magic_the_gathering/by_az'));

  const sets = new CollectContent('.anchorList table td', {
    contentType: 'html',
    getElementContent: getSetInfo
  });

  const cardRoot = new Root();
  cardRoot.addOperation(sets);

  await scraper.scrape(cardRoot);

  return mySets;
}

