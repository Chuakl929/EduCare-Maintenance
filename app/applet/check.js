const r = await fetch("http://localhost:3000/src/App.tsx"); console.log((await r.text()).slice(0, 500));
