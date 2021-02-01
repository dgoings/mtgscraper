import fs from 'fs';
import { getAllCardsFromSet } from './queries/getAllFromSet';

(async () => {
  const myCards = await getAllCardsFromSet();
  fs.writeFile('./cards/cardTitles.json', JSON.stringify(myCards), () => { });
})()
