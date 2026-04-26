import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log(msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("Uncaught Exception: ", err.message));

  await page.goto("http://localhost:3000/");
  await new Promise(r => setTimeout(r, 1000));
  
  // Fill form
  await page.fill('input[type="text"]', 'Test Location');
  await page.selectOption('select', { index: 1 }); // damage type
  await page.fill('textarea', 'Test Description');
  
  // Submit
  const btn = await page.$('button[type="submit"]');
  if (btn) {
    console.log("Submitting form");
    await btn.click();
  }
  
  await new Promise(r => setTimeout(r, 1000));
  await browser.close();
})();
