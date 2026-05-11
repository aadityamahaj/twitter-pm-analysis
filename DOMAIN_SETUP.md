# Domain Setup for FlightScout

## Step 1: Buy a Domain

### Recommended Registrars
1. **Namecheap** (cheapest, easy to use)
   - Visit: namecheap.com
   - Search for `flightscout.app` or `flightscout.io`
   - Typical prices:
     - `.app` = $11.88/year (first year, then $11.88)
     - `.io` = $34.88/year
   - Add to cart, checkout
   - Use auto-renew to avoid expiration

2. **Google Domains** (integrated with Google Account)
   - Visit: domains.google.com
   - Similar pricing

3. **GoDaddy** (common but pricier)
   - Visit: godaddy.com

### Recommended Domain Names (in order of preference)
1. `flightscout.app` — Modern, clear, affordable
2. `flightscout.io` — Tech-forward, startup vibes
3. `flightscout.co` — Short, professional
4. `getflightscout.com` — More descriptive

**Note**: `.app` domains require HTTPS (free on Vercel), so they're perfect for us.

---

## Step 2: Connect Domain to Vercel

Once you own the domain, connect it to Vercel in 2 minutes:

### 2a. Add Domain to Vercel Project

1. Go to: https://vercel.com/aadityamahajs-projects/flightscout/settings/domains
2. Click **"Add Domain"**
3. Type your domain (e.g., `flightscout.app`)
4. Vercel will ask to verify ownership

### 2b. Update DNS Records

Vercel will show you the DNS records to add. You have two options:

**Option A: Change Nameservers (Easiest, Recommended)**
1. Go to your domain registrar (Namecheap, Google Domains, etc.)
2. Log in to your account
3. Find "Nameservers" or "DNS Settings"
4. Change the nameservers to:
   - `ns1.vercel.com`
   - `ns2.vercel.com`
   - `ns3.vercel.com`
5. Wait 24-48 hours for DNS to propagate (sometimes instant)
6. Vercel will automatically verify

**Option B: Add CNAME Records (More control)
1. Stay with your current registrar's nameservers
2. Add the CNAME records Vercel shows you
3. Also add an A record for the root domain pointing to Vercel
4. This is more manual but lets you keep control

### 2c: Verify and Test

1. Once DNS propagates, Vercel will automatically verify
2. You'll see "Valid Configuration" ✓
3. SSL certificate will auto-issue (takes ~30 seconds)
4. Visit your domain in browser - your app should load!

---

## DNS Propagation Timeline

- **Instant**: Registrar updates (you'll see change immediately)
- **5-30 minutes**: Your ISP's DNS servers update
- **Up to 48 hours**: Worldwide DNS propagation
- **Reality**: Usually works within 1-2 hours

You can check status at: https://www.whatsmydns.net/ (enter your domain)

---

## Testing Your Domain

Once live:
```bash
# Check if domain resolves
ping flightscout.app

# Check SSL certificate
curl -I https://flightscout.app
# Should show: HTTP/2 200 and "strict-transport-security"
```

---

## After Domain is Live

### Update Environment Variables

1. Go to https://vercel.com/aadityamahajs-projects/flightscout/settings/environment-variables
2. Make sure `NEXT_PUBLIC_APP_URL` is set to your domain
3. Optional: Add `NEXT_PUBLIC_ML_API_URL` with your Railway backend URL

### Update Social Media
- Twitter: Mention you have a website now
- LinkedIn: Update profile link
- ProductHunt: Use domain in description

---

## FAQ

**Q: How long does it take to work?**
A: Usually 5 minutes to 2 hours. Vercel is fast.

**Q: Can I change nameservers back if I want?**
A: Yes, anytime. You can switch back to previous DNS.

**Q: What if DNS doesn't work?**
A: Check:
1. Nameservers are correctly set at registrar
2. You didn't typo the domain
3. Wait 24 hours for full propagation
4. Check whatsmydns.net for status

**Q: Will the old flightscout-omega.vercel.app still work?**
A: Yes, but you should use the custom domain publicly.

**Q: Do I need www?**
A: Vercel handles both `example.com` and `www.example.com` automatically.

---

## Estimated Costs
- Domain (first year): $11.88 - $34.88
- Vercel hosting: FREE (for typical usage)
- Railway backend: FREE tier (up to 5 GB, adequate for launch)
- Duffel API: FREE (then commission on bookings)

**Total: ~$12/year for domain**

---

## Timeline

- **Now**: Buy domain (5-10 min)
- **Today**: Connect to Vercel (5 min)
- **Within 2 hours**: DNS propagates, go live
- **When Duffel responds**: Update production API key

You're on track for launch! 🚀
