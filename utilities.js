const { Root, CollectContent } = require('nodejs-web-scraper');
const cheerio = require('cheerio');
const Scraper = require('./scraper');

// currently just an example search
const queryString = `?filter%5Bsort%5D=price_desc&filter%5Bsearch%5D=mtg_advanced&filter%5Bname%5D=&filter%5Bcategory_id%5D=2530&filter%5Bfoil%5D=1&filter%5Bnonfoil%5D=1&filter%5Bprice_op%5D=&filter%5Bprice%5D=`;

// Eventually this should dynamically build a query string based on input params
export const buildQuery = () => {
  return queryString;
}

export const getScraper = (query) => {
  // Default config
  const baseConfig = {
    baseSiteUrl: `https://cardkingdom.com`,
    filePath: './cards/',
    logPath: './logs/'
  }
  return new Scraper({
    ...baseConfig,
    startUrl: `https://cardkingdom.com/purchasing/mtg_singles${query}`,
  });
}

// Figure out total number of pages to scrape
const getPageCount = async (scraper) => {
  const pageRoot = new Root();
  const pageCount = new CollectContent('.mainListing .pagination li a', { name: 'page' });
  pageRoot.addOperation(pageCount);

  scraper.scrape(pageRoot);
  const pageNumbers = pageCount.getData().map((page) => {
    return Number.parseInt(page);
  }).filter((num) => {
    return Number.isInteger(num);
  }).sort((a, b) => {
    return a - b;
  });

  return pageNumbers[pageNumbers.length-1];
}

export const getPaginationConfig = async (scraper) => {
  return {
    queryString: 'page',
    begin: 1,
    end: await getPageCount(scraper)
  }
}
