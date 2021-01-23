const { Scraper, Root, CollectContent } = require('nodejs-web-scraper');
const cheerio = require('cheerio');
const fs = require('fs');

(async () => {
    const queryString = `?filter%5Bsort%5D=price_desc&filter%5Bsearch%5D=mtg_advanced&filter%5Bname%5D=&filter%5Bcategory_id%5D=2530&filter%5Bfoil%5D=1&filter%5Bnonfoil%5D=1&filter%5Bprice_op%5D=&filter%5Bprice%5D=`;

    const config = {
        baseSiteUrl: `https://cardkingdom.com`,
        startUrl: `https://cardkingdom.com/purchasing/mtg_singles${queryString}`,
        filePath: './cards/',
        logPath: './logs/'
    }

    const scraper = new Scraper(config);

    // Figure out total number of pages to scrape
    const pageRoot = new Root();
    const pageCount = new CollectContent('.mainListing .pagination li a', { name: 'page' });
    pageRoot.addOperation(pageCount);

    await scraper.scrape(pageRoot);

    const pageNumbers = pageCount.getData().map((page) => {
      return Number.parseInt(page);
    }).filter((num) => {
      return Number.isInteger(num);
    }).sort((a, b) => {
      return a - b;
    });

    const cardRoot = new Root({
      pagination: {
        queryString: 'page',
        begin: 1,
        end: pageNumbers[pageNumbers.length-1]
      }
    });

    const myCards=[];

    const getElementContent = (content) => {
      const $ = cheerio.load(content, null, false);
      const title = $('.productDetailTitle').text();
      const dollarAmount = $('.creditSellPrice .sellDollarAmount').text();
      const centsAmount = $('.creditSellPrice .sellCentsAmount').text();
      const qty = $('ul.qtyList li').last().text();
      myCards.push({
        title,
        credit: `${dollarAmount}.${centsAmount}`,
        qty
      });
    }

    const cards = new CollectContent('ul.itemList.buyList li .itemContentWrapper', {
      contentType: 'html',
      getElementContent
    });
    // const cardTitles = new CollectContent('.itemContentWrapper .productDetailTitle');

    // const buyQuantity = new CollectContent('ul.itemList.buyList .itemContentWrapper .addToCartWrapper')

    cardRoot.addOperation(cards);

    await scraper.scrape(cardRoot);

    // console.log(myCards);
    fs.writeFile('./data/cardTitles.json', JSON.stringify(myCards), () => { });
})()
