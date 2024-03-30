// row data
const pricesMap = {}
const volsMap = {}

// diffs from row data
const diffs = {} // prices
const volDiffs = {}

const tick = 15 // second
const timeIntervalInMins = [0.25, 1, 3, 5, 15, 60, 120, 240] // minute
const nameMap = {} // {ABC:10000ABCUSDT}
const timeIntervals = timeIntervalInMins.map(timeToPeriod) // period

// initializeDOM sadece soldaki gereksiz tabloyu olusturuyor.
// updataTable initializeDOM un olusturdugu tabloyu guncelliyor
//

main()

async function main() {
  await initializeMaps()
  setInterval(updateData, tick * 1000)
}

async function updateData(){
  const coins = await fetchData()
  updateDiffs()
  addToPrices(coins)
  addToVolumes(coins)
  printTopGainersAndLosers()
}

// // // HELPERS - IMPLEMENTATION DETAILS // // //
// calculate diff from array
function calculateDiff(prices) {
  const lastIndex = prices.length - 1

  const lastPrice = prices[lastIndex]
  const prevPrice = prices[lastIndex - 1]

  const percentageChange = ((lastPrice - prevPrice) / prevPrice) * 100
  return percentageChange.toFixed(2) // Yüzde değişimi iki ondalık basamakla döndür
}
function formatSymbol(symbol) {
  let newSymbolChars = []
  const endIndex = symbol.length - 4
  for (let i = 0; i < endIndex; i++) {
    if (symbol[i] === '0' || symbol[i] === '1') {
      continue
    }
    newSymbolChars.push(symbol[i])
  }
  const newSymbol = newSymbolChars.join('')
  nameMap[newSymbol] = symbol
  return newSymbol
}
function formatTime(time){
  // [1, 3, 5, 15, 60, 120, 240]
  if(time >= 60){
    return time / 60
  }
  // ...
  return time
}
function timeToPeriod(time){
  return (time * 60) / tick
}

// Fetch & Prepare Data
// clear fields
function transformCoins(coins) {
  const transformedCoins = coins.map(coin => {
    const {
      symbol,
      last_tick_direction,
      prev_price_24h,
      high_price_24h,
      low_price_24h,
      prev_price_1h,
      mark_price,
      open_interest,
      volume_24h,
      funding_rate
    } = coin

    const formattedSymbol = formatSymbol(symbol)

    return {
      symbol: formattedSymbol,
      last_tick_direction,
      prev_price_24h,
      high_price_24h,
      low_price_24h,
      prev_price_1h,
      mark_price,
      open_interest,
      volume_24h,
      funding_rate
    }
  })

  return transformedCoins
}
// fetch
async function fetchData() {
  const url = "https://api.bybit.com/v2/public/tickers"
  const response = await fetch(url)
  const data = await response.json()
  const filteredData = data.result.filter(el => el.symbol.endsWith("USDT"))
  const transformedData = transformCoins(filteredData)
  return transformedData
}
// initialize
async function initializeMaps() {
  const coins = await fetchData()

  coins.forEach(({ symbol, mark_price, volume_24h }) => {
    pricesMap[symbol] = [mark_price]
    volsMap[symbol] = [volume_24h]
  })

  for (const interval of timeIntervalInMins) {
    diffs[interval] = {}
    volDiffs[interval] = {}
    for (const currency in pricesMap) {
      diffs[interval][currency] = null
      volDiffs[interval][currency] = null
    }
  }
}

// Process Data
function addToPrices(coins) {
  coins.forEach(({ symbol, mark_price }) => {
    if (pricesMap.hasOwnProperty(symbol)) {
      pricesMap[symbol].push(mark_price)
    } else {
      console.log(`Symbol '${symbol}' not found in pricesMap.`)
    }
  })
}
function addToVolumes(coins) {
  coins.forEach(({ symbol, volume_24h }) => {
    if (volsMap.hasOwnProperty(symbol)) {
      volsMap[symbol].push(volume_24h);
    } else {
      console.log(`Symbol '${symbol}' not found in volsMap.`);
    }
  });
}
function calculateChange(prices, timeInterval) {
  if (prices.length <= timeInterval) {
    return null
  }
  const changeArray = prices.slice(-(timeInterval + 1))

  const startPrice = changeArray[changeArray.length - timeInterval - 1]
  const endPrice = changeArray[changeArray.length - 1]

  const percentageChange = ((endPrice - startPrice) / startPrice) * 100

  return percentageChange.toFixed(2)
}
function updateDiffs() {
  // update price diffs
  for (const currency in pricesMap) {
    for (let i = 0; i < timeIntervals.length; i++) {
      const priceChange = calculateChange(pricesMap[currency], timeIntervals[i]);
      if (priceChange !== null) {
        diffs[timeIntervalInMins[i]][currency] = priceChange;
      }
    }
  }

  // update vol diffs
  for (const currency in volsMap) {
    for (let i = 0; i < timeIntervals.length; i++) {
      const volChange = calculateChange(volsMap[currency], timeIntervals[i]); // Calculate vol change
      if (volChange !== null) {
        volDiffs[timeIntervalInMins[i]][currency] = volChange; // Assign vol change to volDiffs
      }
    }
  }
}

// // // // ???????????????? // // // //
function sortByVol24h(a, b) {
  const rateA = parseFloat(a.volume_24h);
  const rateB = parseFloat(b.volume_24h);
  return rateA - rateB;
}
function printMinMaxVol24h(coins) {
  const sortedByVol24h = coins.sort(sortByVol24h);

  console.log("En büyük 10 volume_24h:");
  for (let i = sortedByVol24h.length - 1; i >= sortedByVol24h.length - 10; i--) {
    console.log(sortedByVol24h[i].symbol + ": " + sortedByVol24h[i].volume_24h);
  }

  console.log("\nEn küçük 10 volume_24h:");
  for (let i = 0; i < 10; i++) {
    console.log(sortedByVol24h[i].symbol + ": " + sortedByVol24h[i].volume_24h);
  }
}



// // // // DOM Manipulation // // // //
function printTopGainersAndLosers() {
  const topGainers = document.getElementById('topGainersTable');
  const topLosers = document.getElementById('topLosersTable');
  // const topGainersVol = document.getElementById('topGainersVol');
  // const topLosersVol = document.getElementById('topLosersVol');

  topGainers.innerHTML = '';
  topLosers.innerHTML = '';
  // topGainersVol.innerHTML = '';
  // topLosersVol.innerHTML = '';

  for (const interval of timeIntervalInMins) {
    const currencies = Object.keys(diffs[interval]).sort((a, b) => {
      const diffA = diffs[interval][a];
      const diffB = diffs[interval][b];

      if (diffA === null && diffB === null) return 0;
      if (diffA === null) return 1;
      if (diffB === null) return -1;

      return diffB - diffA;
    });

    const topGainersList = document.createElement('ul');
    const topLosersList = document.createElement('ul');
    // const topGainersVolList = document.createElement('ul');
    // const topLosersVolList = document.createElement('ul');

    const headerGainers = document.createElement('h3');
    headerGainers.textContent = `${formatTime(interval)}`;
    topGainers.appendChild(headerGainers);

    const headerLosers = document.createElement('h3');
    headerLosers.textContent = `${formatTime(interval)}`;
    topLosers.appendChild(headerLosers);

    // const headerGainersVol = document.createElement('h3'); // Yeni header oluşturuldu
    // headerGainersVol.textContent = `${formatTime(interval)}`; // Volume değişiklikleri için başlık eklendi
    // topGainersVol.appendChild(headerGainersVol); // Başlık eklenir

    // const headerLosersVol = document.createElement('h3'); // Yeni header oluşturuldu
    // headerLosersVol.textContent = `${formatTime(interval)}`; // Volume değişiklikleri için başlık eklendi
    // topLosersVol.appendChild(headerLosersVol); // Başlık eklenir

    for (let i = 0; i < 10; i++) {
      if (diffs[interval][currencies[i]] !== null) {
        const listItemGainers = document.createElement('li');
        const gainerLink = document.createElement('a');
        gainerLink.rel = 'noopener noreferrer';
        gainerLink.target = '_blank';
        gainerLink.href = `https://www.bybit.com/trade/usdt/${nameMap[currencies[i]]}`;
        gainerLink.textContent = `${currencies[i]}\t${diffs[interval][currencies[i]]}`;
        listItemGainers.appendChild(gainerLink);
        topGainersList.appendChild(listItemGainers);
      }

      if (diffs[interval][currencies[currencies.length - 1 - i]] !== null) {
        const listItemLosers = document.createElement('li');
        listItemLosers.textContent = `${currencies[currencies.length - 1 - i]}\t${diffs[interval][currencies[currencies.length - 1 - i]]}`;
        topLosersList.appendChild(listItemLosers);
      }

      // // Volume için aynı işlemi yap
      // if (volDiffs[interval][currencies[i]] !== null) {
      //   const listItemGainersVol = document.createElement('li');
      //   listItemGainersVol.textContent = `${currencies[i]}\t${volDiffs[interval][currencies[i]]}`;
      //   topGainersVolList.appendChild(listItemGainersVol);
      // }

      // if (volDiffs[interval][currencies[currencies.length - 1 - i]] !== null) {
      //   const listItemLosersVol = document.createElement('li');
      //   listItemLosersVol.textContent = `${currencies[currencies.length - 1 - i]}\t${volDiffs[interval][currencies[currencies.length - 1 - i]]}`;
      //   topLosersVolList.appendChild(listItemLosersVol);
      // }
    }

    topGainers.appendChild(topGainersList);
    topLosers.appendChild(topLosersList);
    // topGainersVol.appendChild(topGainersVolList);
    // topLosersVol.appendChild(topLosersVolList);
  }
}



window.addEventListener('beforeunload', function (e) {
    e.preventDefault()
    e.returnValue = ''
    return ''
})

























