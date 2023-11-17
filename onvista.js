const promClient = require('prom-client');
const { chromium } = require('playwright');
const http = require('http');
const process = require('process');

const username = process.env["ONVISTA_USERNAME"] || "guest";
const password = process.env["ONVISTA_PASSWORD"] || "guest";
const portfolios = (process.env["ONVISTA_PORTFOLIOS"] || "").split(',').filter(Boolean).map(element => element.trim());
const port = process.env["ONVISTA_EXPORTER_PROMETHEUS_PORT"]
  ? parseInt(process.env["ONVISTA_EXPORTER_PROMETHEUS_PORT"])
  : 10000;
let headless = process.env["ONVISTA_EXPORTER_PROMETHEUS_HEADLESS"]
  ? process.env["ONVISTA_EXPORTER_PROMETHEUS_HEADLESS"]
  : "true";
if (headless == "false") {
  headless = false;
} else {
  headless = true;
}
let terminateNow = false;
const wknRegex = /WKN ([A-Z0-9]+)/;
const isinRegex = /ISIN ([A-Z0-9]+)/;

process.on('SIGINT', () => {
  console.log("Aus is und goa is und frou hamma dass woa is");
  terminateNow = true;
});

// Create a Registry for Prometheus metrics
const register = new promClient.Registry();

const lastPriceAge = new promClient.Gauge({
  name: 'last_price_age',
  help: 'The duration since a price was settled last time',
  labelNames: ['wkn'],
  registers: [register], // Use the custom registry
});
const stockPrice = new promClient.Gauge({
  name: 'stock_price',
  help: 'The price of one share',
  labelNames: ['wkn', 'currency'],
  registers: [register], // Use the custom registry
});
const shareCount = new promClient.Gauge({
  name: 'share_count',
  help: 'Number of shares',
  labelNames: ['wkn', 'portfolio'],
  registers: [register], // Use the custom registry
});
const updateDuration = new promClient.Gauge({
  name: 'update_duration',
  help: 'The time it took to read all the positions in a portfolio',
  labelNames: ['portfolio'],
  registers: [register],
});

const server = http.createServer(async (req, res) => {
  if (req.url === '/metrics') {
    // Expose Prometheus metrics on the /metrics endpoint
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } else if (req.url === '/health') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Gsund samma' }));
  } else {
    // Everything else gets a default response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ message: 'Servus, wos schaustn so bled?' }));
  }
});

server.listen(port, () => {
  console.log(`Der Server lauscht auf dem Port ${port}`);
});

(async () => {
  const browser = await chromium.launch({
      slowMo: 1000,
      headless: headless, args: ['--single-process', '--disable-gpu']
  });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('https://www.onvista.de/');
  await page.frameLocator('iframe[title="SP Consent Message"]').getByLabel('Zustimmen', { exact: true }).click();
  if (await page.getByRole('button', { name: 'Anmelden' }).count() > 0) {
    console.log("Anmeldebutton entdeckt")
    await page.getByRole('button', { name: 'Anmelden' }).click();
    console.log("Anmelden angeklickt");
    await page.getByLabel('E-Mail oder Benutzername').click();
    await page.getByLabel('E-Mail oder Benutzername').fill(username);
    console.log(`Benutzername ${username} eingetippt`);
    await page.getByLabel('Passwort').click();
    await page.getByLabel('Passwort').fill(password);
    console.log(`Password fuer ${username} eingetippt`);
    await page.getByRole('button', { name: 'Login bei my onvista' }).click();
    console.log("Loginknopf gedrueckt");
  }
  await page.getByRole('link', { name: 'my onvista' }).first().click();
  await page.getByRole('link', { name: 'Musterdepot', exact: true }).click();
  const labelElement = await page.locator('label[for="select-portfolio"]');

  let newIntervalValue = 1000 * 60 * 5;
  let intervalValue = 0;
  let intervalTimer;

  function startUpdating() {
    if (terminateNow) {
      process.exit(0);
    }
    if (intervalValue != newIntervalValue) {
      if (intervalValue == 0) {
        // this is the first run, do not wait, start immediately with the update
        updateMetrics();
      } else if (intervalValue != 0) {
        clearInterval(intervalTimer);
      }
      intervalValue = newIntervalValue;
      console.log(`Auffrischung erfolgt alle ${newIntervalValue}ms`);
      intervalTimer = setInterval(updateMetrics, newIntervalValue);
    }
  }


  async function updateMetrics() {
    for (const portfolio of portfolios) {
      let currentPortfoilio = await labelElement.textContent();
      if (currentPortfoilio != portfolio) {
        console.log(`Umschalten von Portfolio ${currentPortfoilio} zu ${portfolio}`);
        await labelElement.click();
        await page.getByRole('button', { name: portfolio }).click();
      }
      const allRows = page.locator('table#openPositionList tbody tr');
      console.log("Tabelle mit den Positionen lokalisiert");
      const numRows = await allRows.count();
      console.log(`${numRows} gefunden`);
      const currentTime = new Date();
      for(let i=0; i<numRows; i++){
        let row = allRows.nth(i);
        let company = await row.locator('td:nth-child(2)');
        let company_name = (await company.locator('a').textContent()).trim();
        let wkn = (await company.locator('div div span').nth(1).textContent()).trim();
        let match = wkn.match(wknRegex);
        if (match) {
          wkn = match[1];
        } else {
          wkn = 'WKN-unknown';
        }
        let isin = (await company.locator('div div span').nth(2).textContent()).trim();
        match = isin.match(isinRegex);
        if (match) {
          isin = match[1];
        } else {
          isin = 'ISIN-unknown';
        }
        let count = (await row.locator('td:nth-child(4) data').getAttribute("value")).trim();
        count = parseFloat(count);
        let price = (await row.locator('td:nth-child(8) data').getAttribute("value")).trim();
        price = parseFloat(price);
        let timestampElement = await row.locator('td:nth-child(8) time').getAttribute('datetime');
        let parsedTimestamp = new Date(timestampElement);
        let ageInSeconds = (currentTime - parsedTimestamp) / 1000;
        let currency = (await row.locator('td:nth-child(8) data span').textContent()).trim();
        let value = (await row.locator('td:nth-child(11) data').first().getAttribute("value")).trim();
        console.log(`Im Portfolio ${portfolio} sind ${count} Stueck ${wkn} (${company_name}) und eins davon war vor ${ageInSeconds}s ${price}${currency} wert`);
        shareCount.labels({wkn: wkn, portfolio: portfolio.toLowerCase()}).set(count);
        //stockPrice.labels({wkn: wkn, currency: currency}).set(price);
        stockPrice.labels({wkn: wkn, currency: "EUR", name: company_name}).set(value / count); 
        lastPriceAge.labels({wkn: wkn}).set(ageInSeconds);
      }
      //await page.waitForSelector('button:has-text("Signale") span');
      //await page.waitForTimeout(1000);
      //await page.locator('button:has-text("Signale") span').click();
      // Wait for the appearance of the "Signal hinzufügen" button
      //await page.waitForSelector('.button--primary .button__inner:has-text("Signal hinzufügen")');
      let startTime = performance.now();
      await page.locator('button:has-text("Bestand") span').click();
      await page.waitForSelector('button:has-text("Signale") span');
      let endTime = performance.now();
      updateDuration.labels({portfolio: portfolio.toLowerCase()}).set((endTime - startTime) / 1000.0);
      console.log("refresh "+portfolio);
    }
    // change the newIntervalValue. if things change heavily, then we might reduce the interval to 1 min.
    // newIntervalValue = 1000 * 60 * 1;
    startUpdating();
  }

  startUpdating();
})();


