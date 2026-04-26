import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log("CONSOLE", msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("Uncaught Exception: ", err.message));

  await page.goto("http://localhost:3000/");
  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
