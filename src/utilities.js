const fs = require('fs');
const path = require('path');

export const parseFilters = (filters) => {
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
          acc.nonfoil = 1
        }
        break;
      case 'nonfoil':
        if (splitFilter[1] === 'yes') {
          acc.nonfoil = 1;
          break;
        }
        // nonfoil:no with no foil filter should result in an explicit { foil: 1 } query option
        if (splitFilter[1] === 'no') {
          acc.foil = 1
        }
        break;
      case 'rarity':
        acc['rarity'] = [];
        const rarities = splitFilter[1].split(',');
        rarities.forEach((rarity) => {
          switch (rarity) {
            case 'mythic':
              acc['rarity'].push('M')
              break;
            case 'rare':
              acc['rarity'].push('R')
              break;
            case 'uncommon':
              acc['rarity'].push('U')
              break;
            case 'common':
              acc['rarity'].push('C')
              break;
            case 'basic':
              acc['rarity'].push('L')
              break;
            case 'special':
              acc['rarity'].push('S')
              break;
          }
        });
        break;
      case 'name':
        acc.name = splitFilter[1]
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
}

export const buildQuery = (baseUrl, queryOptions = {}) => {
  const queryString = Object.entries(queryOptions).reduce((acc, [key, value]) => {
    if (key === 'rarity') {
      const rarityFilters = value.reduce((acc, rarity, i) => {
        return acc.concat(`&filter[rarity][${i}]=${rarity}`)
      }, '');
      return acc.concat(rarityFilters);
    }
    return acc.concat(`filter[${key}]=${value}&`);
  }, '?');

  return encodeURI(`${baseUrl}${queryString.slice(0, -1)}`);
}

export const getSetMap = () => {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/sets.json')));
}

export const getCardMap = (file) => {
  return JSON.parse(fs.readFileSync(path.resolve(__dirname, file)));
}

export const isReserved = (cardName, cards) => {
  const card = cards.find((card) => {
    return card.name === cardName
  });
  if (card) {
    return card.isReserved || false;
  }
  return false
}

export const exportCardsToCSV = (cards, options = {}) => {
  const cardMap = (typeof cards === 'string') ? getCardMap(cards) : cards;
  const baseHeader = `Card Name,Edition,Foil,Quantity`;

  const priceHeader = (options.cashonly)
    ? `${baseHeader},Cash`
    : (options.creditonly)
      ? `${baseHeader},Credit`
      : `${baseHeader},Cash,Credit`;

  const header = (options.rl)
    ? `${priceHeader},RL`
    : `${priceHeader}`;

  let csv = `${header}\n`;

  const cardSetsMap = {};

  Object.entries(cardMap).forEach(([set, cards]) => {
    cards.forEach((card) => {
      const setCode = getSetCode(card.edition) || set;
      if (!cardSetsMap.setCode) {
        const cardFile = getCardMap(`../assets/allSets/${setCode}.json`)
        cardSetsMap[setCode] = cardFile;
      }

      csv += `"${card.title}",${setCode},${card.foil},${card.qty}`;
      if (options.cashonly) {
        csv += `,${card.cash}`
      } else if (options.creditonly) {
        csv += `,${card.credit}`
      } else {
        csv += `,${card.cash},${card.credit}`
      }
      if (options.rl && cardSetsMap[setCode] && cardSetsMap[setCode].data) {
        const isRL = isReserved(card.title, cardSetsMap[setCode].data.cards || []);
        csv += `,${isRL}\n`;
      } else {
        csv += `\n`;
      }
    });
  });

  return csv;
}

const setCodeMap = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../assets/SetList.json'))).data.reduce((acc, set, i) => {
  acc[set.name.toLowerCase()] = set.code;
  return acc;
}, {});

export const getSetCode = (setName) => {
  let mappedName = setName;
  if (setName.match(/Variants$/)) {
    mappedName = setName.match(/(.+) Variants$/)[1];
  }
  if (setName === 'Commander 2011') {
    mappedName = 'Commander';
  }
  if (setName.match(/Collectors/)) {
    if (setName.match(/Intl/)) {
      mappedName = 'Intl. Collectors’ Edition'
    } else {
      mappedName = 'Collectors’ Edition'
    }
  }

  return setCodeMap[mappedName.toLowerCase()];
}

export const findSets = (query) => {
  if (!query.length) return [];
  const sets = getSetMap();
  const re = new RegExp(query, 'i');
  return Object.keys(sets).filter((set) => {
    return set.match(re)
  })
}
