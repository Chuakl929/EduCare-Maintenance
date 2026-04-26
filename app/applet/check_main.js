const r = await fetch("http://localhost:3000/"); console.log((await r.text()).slice(0, 1000));
