import { chromium } from "playwright";

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  page.on("console", (msg) => console.log(msg.type(), msg.text()));
  page.on("pageerror", (err) => console.log("Uncaught Exception: ", err.message));

  // Set localStorage first
  await page.goto("http://localhost:3000/");
  await page.evaluate(() => {
    localStorage.setItem('school-reports', JSON.stringify([
      {
        id: "1",
        location: "Hallway",
        damageType: "Other",
        date: "2026-04-26",
        description: "Test",
        photos: [],
        status: "completed",
        createdAt: Date.now()
      }
    ]));
  });
  
  // Reload
  await page.goto("http://localhost:3000/");
  await new Promise(r => setTimeout(r, 1000));
  
  // Switch to completed tab
  const tabs = await page.$$('button');
  for (const t of tabs) {
    if ((await t.innerText()).includes('Completed')) {
      await t.click();
    }
  }
  await new Promise(r => setTimeout(r, 500));
  
  // Click Export PDF
  const exportBtn = await page.$('button:has-text("Export PDF")');
  if (exportBtn) {
    console.log("Found export button, clicking!");
    await exportBtn.click();
  }

  await new Promise(r => setTimeout(r, 2000));
  await browser.close();
})();
