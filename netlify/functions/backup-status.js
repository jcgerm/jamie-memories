// R2 backup is only available on Cloudflare Pages.
// This stub keeps the admin page happy on Netlify.
exports.handler = async () => ({
  statusCode: 200,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ available: false }),
})
