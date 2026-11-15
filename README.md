# Yangshun Zhu — Game Design Portfolio

Personal portfolio of Yangshun Zhu, a computer science student focused on game design: level design, narrative and gameplay systems.

## What's here

Five game projects, each with its own case-study page:

| Project | Engine | What it is |
|---|---|---|
| [Admission Desk](case-admission-desk.html) | Unity 6 | An admissions desk simulation inspired by *Papers, Please* |
| [Project 403](case-project-403.html) | Unity 6 | A narrative adventure told through a 2D and a 3D cat perspective |
| [RoadTrip](case-roadtrip.html) | Unreal Engine 5.6 | A driving and survival prototype with dice-based searching |
| [Count Me Out](case-count-me-out.html) | Unity 6 | GMTK Game Jam 2026 entry, gameplay programming in a team of eight |
| [Drowned in Yesterday](case-drowned-in-yesterday.html) | Unity 6 | CiGA Game Jam 2026 entry, all gameplay programming |

Pages: `index.html` (home), `games.html` (level-select gallery), `about.html`, `contact.html` and the five `case-*.html` pages.

## Run it locally

It is a plain static site with no build step. Either open `index.html` in a browser, or serve the folder:

```bash
node admin-server.js
```

Then open http://localhost:4173. The same command also serves a local-only admin panel at `/admin.html` for editing site content; it needs an `admin.config.json` file with a password and does not work on GitHub Pages.

## Credits

- Site framework: the open-source *Inventory* portfolio template (MIT licence, see `LICENSE`), customised with my own content and case-study pages.
- Game art, audio and writing on team projects belong to their respective teammates; I credit them on each page where known.
- Film and game imagery (*Nomadland*, *Papers, Please*, *Tokyo-Ga*) is used for reference and remains the property of its owners.
