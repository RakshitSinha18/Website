# Using a Hostinger domain with this site

The site is a **static export hosted on GitHub Pages**. You don't need Node
hosting — you just point your Hostinger domain at GitHub Pages via DNS.

## Step 1 — Add the custom domain on GitHub

1. Go to the repo → **Settings → Pages**.
2. Under **Custom domain**, enter your domain (e.g. `rakshitsinha.com`) and save.
   GitHub writes a `CNAME` file into the published site automatically.

## Step 2 — Point the domain in Hostinger (hPanel → DNS)

In **Hostinger → hPanel → Domains → DNS / Nameservers**, add these records:

**For an apex/root domain (`rakshitsinha.com`)** — add four A records:

| Type | Name | Value |
| --- | --- | --- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**For `www`** — add a CNAME:

| Type | Name | Value |
| --- | --- | --- |
| CNAME | www | RakshitSinha18.github.io |

Save. DNS can take a few minutes up to 24 hours to propagate.

## Step 3 — Enable HTTPS

Back on GitHub → **Settings → Pages**, tick **Enforce HTTPS** once the
certificate is issued (usually within an hour of DNS resolving).

## Step 4 — Drop the base path

The GitHub Actions workflow sets `NEXT_PUBLIC_BASE_PATH=/Website` for the
`github.io/Website/` URL. With a custom domain the site lives at the root, so
edit `.github/workflows/deploy.yml` and **remove** this line:

```yaml
          NEXT_PUBLIC_BASE_PATH: /Website
```

Commit & push — the next deploy will serve assets from `/` instead of `/Website`.

---

### Prefer to host on Hostinger directly instead?

You can also upload the contents of the `out/` folder (produced by
`npm run build`) to Hostinger's File Manager / `public_html` — it's plain static
HTML/CSS/JS. In that case, build **without** a base path
(`npm run build` with `NEXT_PUBLIC_BASE_PATH` unset) and upload everything inside
`out/`. GitHub Pages is recommended, though, since deploys are automatic.
