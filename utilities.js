import cheerio from 'cheerio';

// currently just an example search
const queryString = `?filter%5Bsort%5D=price_desc&filter%5Bsearch%5D=mtg_advanced&filter%5Bname%5D=&filter%5Bcategory_id%5D=2530&filter%5Bfoil%5D=1&filter%5Bnonfoil%5D=1&filter%5Bprice_op%5D=&filter%5Bprice%5D=`;

// Eventually this should dynamically build a query string based on input params
export const buildQuery = () => {
  return queryString;
}

export const getElementContentBuilder = (cardsArray) => {
  return (content) => {
    const $ = cheerio.load(content, null, false);
    const title = $('.productDetailTitle').text();
    const dollarAmount = $('.creditSellPrice .sellDollarAmount').text();
    const centsAmount = $('.creditSellPrice .sellCentsAmount').text();
    const qty = $('ul.qtyList li').last().text();
    cardsArray.push({
      title,
      credit: `${dollarAmount}.${centsAmount}`,
      qty
    });
  }
}
