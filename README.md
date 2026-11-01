# AEDITS website

A portfolio site for AEDITS, built with plain HTML, CSS and JavaScript. There is no build step: open `index.html` in a browser and it works.

## What's in the folder

```
index.html          Homepage: hero, work grid with filters, services, about, contact form
project.html        Project page: details, cover, image gallery with full-screen viewer
admin.html          Dashboard for adding, editing, reordering and deleting projects
css/styles.css      Site styles (brand colours are at the top)
css/admin.css       Dashboard styles
js/config.js        Your settings: email, form key, social links, categories
js/main.js          Shared code (menu, links from config)
js/home.js          Work grid, filters and contact form
js/project.js       Project page and gallery viewer
js/admin.js         Dashboard
data/projects.js    All your projects (the dashboard writes this file)
images/projects/    Project images
```

## 1. Fill in your details

Open `js/config.js` and set:

- `email`: where enquiries go.
- `instagram`, `behance`, `whatsapp`: full links. Empty ones are hidden on the site.

In `index.html`, replace `[Designer name]` and the two bracketed About paragraphs. To add your portrait, put the photo in `images/` and swap the `Portrait photo` text for `<img src="images/portrait.jpg" alt="Portrait of …">`.

## 2. Make the contact form send to your email

1. Go to https://web3forms.com, enter your email address and request an access key. It's free and arrives by email.
2. Paste the key into `web3formsKey` in `js/config.js`.

Enquiries now arrive in your inbox, with the visitor's address set as the reply-to. Until a key is added, the form opens the visitor's own email app instead.

## 3. Put the site online

The simplest setup, which also makes the admin dashboard publish instantly, is GitHub plus Netlify (or Vercel or Cloudflare Pages):

1. Create a free GitHub account and a new repository, e.g. `aedits-site`.
2. Upload everything in this folder to the repository (Add file › Upload files, drag the whole folder contents in, Commit).
3. On https://app.netlify.com choose Add new site › Import an existing project › GitHub, pick the repository and deploy. No build settings are needed.
4. In Netlify, Domain management lets you connect a domain such as aedits.com.

Every time the repository changes, Netlify updates the live site within a minute or two.

GitHub Pages works too: in the repository, Settings › Pages › Deploy from branch › `main` / root.

## 4. Use the admin dashboard

Open `yoursite.com/admin.html`.

**One-time setup:** create a GitHub access token so the dashboard can save to your repository.

1. GitHub › Settings › Developer settings › Personal access tokens › Fine-grained tokens › Generate new token.
2. Repository access: Only select repositories › your site's repository.
3. Permissions › Repository permissions › Contents: Read and write.
4. Generate, copy the token, and paste it into Publishing settings in the dashboard with your GitHub username, repository name and branch (`main`). Press Save settings, then Test connection.

The token is stored only in that browser. Anyone who opens `admin.html` without it can look around but can't change your site. Don't share the token, and use "Remove settings from this browser" on shared computers.

**Day to day:**

- New project, fill in the details, add a cover image and gallery images (you can select several at once). Large photos are resized automatically.
- Use the arrows to reorder projects; the site shows them in the same order.
- Press **Publish to site**. Images and project details are saved to GitHub and the site updates shortly after.
- **Load latest from GitHub** pulls the newest saved version, useful if you edited from another device.

**Without GitHub:** press **Download update** to get a zip containing `data/projects.js` and any new images. Unzip it into this folder (replace the old file) and upload the site again.

## Editing by hand

`data/projects.js` is a plain list you can also edit in any text editor. Each project looks like:

```js
{
  "id": "acme-rebrand",              // page address: project.html?id=acme-rebrand
  "title": "Acme rebrand",
  "client": "Acme Foods",
  "category": "branding",            // branding, social, print or packaging (see js/config.js)
  "year": "2026",
  "summary": "Logo and brand guidelines",
  "description": "First paragraph.\n\nSecond paragraph.",
  "cover": "images/projects/acme/cover.jpg",
  "images": [
    { "src": "images/projects/acme/logo-sheet.jpg", "alt": "Logo variations on a white sheet" }
  ]
}
```

## Changing colours

Brand colours are at the top of `css/styles.css`: `--primary` (#420080), `--accent` (#ada701) and `--lavender` (#D9C7EE).
