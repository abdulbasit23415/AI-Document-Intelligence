const http = require('http');

http.get('http://localhost:3000', (res) => {
  let html = '';
  res.on('data', chunk => html += chunk);
  res.on('end', () => {
    console.log('HTML status:', res.statusCode);
    const cssHrefs = [...html.matchAll(/href="([^"]+\.css[^"]*)"/g)].map(m => m[1]);
    console.log('CSS Hrefs:', cssHrefs);
    if (cssHrefs.length > 0) {
      http.get('http://localhost:3000' + cssHrefs[0], (cRes) => {
        let css = '';
        cRes.on('data', chunk => css += chunk);
        cRes.on('end', () => {
          console.log('CSS length:', css.length);
          // Check for .dark or var(--background)
          const hasDark = css.includes('.dark');
          console.log('Contains .dark:', hasDark);
          const bgMatches = css.match(/[^{}]*background[^{}]*\{[^{}]*\}/g) || [];
          console.log('Sample background rules:', bgMatches.slice(0, 5));
        });
      });
    }
  });
});
