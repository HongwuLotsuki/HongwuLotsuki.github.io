/* INVENTORY — site content. Edited by admin.html; safe to edit by hand too.
   "text" overrides any i18n key (see admin → All texts). */
window.SITE_CONTENT = {
  "version": 2,
  "updated": "2026-11-14",
  "profile": {
    "name": "Yangshun Zhu",
    "email": "zhuzhuyangshun@126.com",
    "school": "University of Pittsburgh at Johnstown",
    "program": "Computer Science"
  },
  "channels": [
    {
      "name": "GitHub",
      "handle": "@HongwuLotsuki",
      "url": "https://github.com/HongwuLotsuki",
      "menu": true
    },
    {
      "name": "itch.io",
      "handle": "hongwulotsuki",
      "url": "https://itch.io/profile/hongwulotsuki",
      "menu": true
    },
    {
      "name": "LinkedIn",
      "handle": "",
      "url": "",
      "menu": false
    }
  ],
  "projects": [
    {
      "id": "project-one",
      "title": "Project One",
      "category": "Web app",
      "status": "Active",
      "year": "2026",
      "summary": "A one or two sentence summary of the project: what it does, who it is for and why you built it.",
      "features": [
        "A key feature or highlight",
        "Another thing worth mentioning",
        "A technical detail you are proud of"
      ],
      "stack": [
        "JavaScript",
        "Node.js"
      ],
      "repo": "https://github.com/",
      "demo": "",
      "private": false
    },
    {
      "id": "project-two",
      "title": "Project Two",
      "category": "Automation",
      "status": "Completed",
      "year": "2025",
      "summary": "Describe the problem this project solves and the result. Keep it short — the card has room for a summary, a few highlights and the stack.",
      "features": [
        "What makes it useful",
        "How it works under the hood",
        "What you learned building it"
      ],
      "stack": [
        "Python",
        "REST API"
      ],
      "repo": "",
      "demo": "",
      "private": true
    },
    {
      "id": "project-three",
      "title": "Project Three",
      "category": "Tool",
      "status": "In progress",
      "year": "2026",
      "summary": "A placeholder for a third project. Add, remove and reorder projects from the admin panel or directly in this file.",
      "features": [
        "Highlight one",
        "Highlight two"
      ],
      "stack": [
        "HTML",
        "CSS",
        "JavaScript"
      ],
      "repo": "",
      "demo": "https://example.com/",
      "private": false
    }
  ],
  "games": [
    {
      "id": "admissions-desk",
      "caseStudy": "case-admission-desk.html",
      "title": "Admission Desk",
      "cover": "shelf",
      "coverImage": "assets/media/admission-desk/cover.jpg",
      "coverAlt": "Admission Desk day 1 prototype: a paper application and a school lookup window on the desk",
      "coverCaption": "Day 1 prototype",
      "status": "Prototype",
      "genre": "Admissions desk simulation",
      "engine": "Unity 6 · C#",
      "role": "Game design · prototype programming",
      "desc": "Work in admissions at a fictional university: check an applicant's school rank and GPA, then decide which stamp to use, until a supervisor asks you to bend the rules.",
      "tags": [
        "Decision systems",
        "Branching outcomes",
        "Unity C#"
      ],
      "notes": [
        "Inspired by Papers, Please: compare a claim with a second source, stamp a decision, then face what happens when someone asks you to set the rules aside.",
        "One resume prefab is bound to ResumeData assets, so short and three-page applications share a single layout.",
        "The demo was narrowed from seven days to three: learn the rules, face a referral, then answer to the auditor, with endings that depend on earlier choices."
      ],
      "year": "Nov 2026",
      "github": "https://github.com/HongwuLotsuki/Admission-Desk"
    },
    {
      "id": "project-403",
      "caseStudy": "case-project-403.html",
      "title": "Project 403",
      "cover": "city",
      "coverImage": "assets/media/project-403/apartment.png",
      "coverAlt": "Pixel art apartment interior at night in Project 403: a kitchen, a lit table, a door and a sofa",
      "coverCaption": "Apartment environment art",
      "status": "Playable prologue",
      "genre": "Narrative adventure · light puzzles",
      "engine": "Unity 6",
      "desc": "Li Xi wakes for a night shift to find her keys missing, so she borrows her cat's perspective. A playable prologue that moves between side-scrolling exploration and a low 3D cat view.",
      "tags": [
        "Pixel art",
        "Perspective puzzles",
        "Level flow"
      ],
      "notes": [
        "The prologue runs from the apartment to the convenience store, the night market and a back alley, with a forced switch to the cat for the final chase.",
        "Two perspective puzzles teach the idea: look lower under the sofa for the keys, then use boxes to reach the kiosk and knock down the notice.",
        "The 3D cat view renders to a low-resolution target; room tests moved the lighting from continuous shading to banded tones so furniture reads at that resolution."
      ],
      "role": "Level & narrative design",
      "year": "Nov 2026",
      "github": "https://github.com/HongwuLotsuki/Project-403"
    },
    {
      "id": "roadtrip",
      "caseStudy": "case-roadtrip.html",
      "title": "RoadTrip",
      "cover": "fog",
      "status": "Prototype",
      "genre": "Driving · exploration · light survival",
      "role": "Game design · level design · Blueprint",
      "engine": "Unreal Engine 5.6",
      "year": "Sep 2026",
      "desc": "Drive an upgradeable RV between roadside stops, search for supplies, resolve random events with dice rolls and take on NPC requests. Inspired by Nomadland.",
      "tags": [
        "Level design",
        "Survival systems",
        "Blueprint"
      ],
      "notes": [
        "Core loop: drive to a stop, explore on foot, scavenge or take a quest, use supplies or return quest items, then continue the journey.",
        "Data-driven events store the dice range, event text, health and hunger changes and reward item; a reusable survival component handles decay and death.",
        "The project began as a racing prototype with roguelike upgrades and was refocused on resource pressure and exploration; NPC requests now give players reasons to revisit locations."
      ],
      "coverImage": "assets/media/roadtrip/cover.jpg",
      "coverAlt": "RoadTrip gameplay prototype: an RV driving along a mountain road with the survival status HUD",
      "coverCaption": "Gameplay prototype",
      "github": "https://github.com/HongwuLotsuki/Roadtrip"
    },
    {
      "id": "count-me-out",
      "caseStudy": "case-count-me-out.html",
      "title": "Count Me Out!",
      "cover": "tetris",
      "status": "Game jam · released",
      "genre": "Top-down time puzzle",
      "role": "Gameplay programming · level integration",
      "engine": "Unity 6",
      "year": "Jul 2026",
      "desc": "A Time Thief escapes a casino by rewinding time: preview two paths from one launch point, fire, then rewind past the launch to take a different route.",
      "tags": [
        "GMTK Game Jam 2026",
        "Time mechanics",
        "Gameplay programming"
      ],
      "notes": [
        "I built paused aiming and a dual trajectory preview on the team's rewind framework, then tuned collider filtering and bounce offsets to close the gap with live physics.",
        "I prototyped a guard that intercepts normal shots but can be passed in negative time and knocked down when forward play resumes.",
        "I also added collision audio and wired the menu, tutorial and win flow in a team of eight; browser and Windows builds are on itch.io."
      ],
      "link": "https://sebindarg.itch.io/count-me-out",
      "linkLabel": "Play on itch.io ▶",
      "coverImage": "assets/media/count-me-out/cover.jpg",
      "coverAlt": "Count Me Out title artwork with a suited Time Thief and a neon casino logo",
      "coverCaption": "Title artwork by the team",
      "github": "https://github.com/HongwuLotsuki/Count-Me-Out"
    },
    {
      "id": "drowned-in-yesterday",
      "caseStudy": "case-drowned-in-yesterday.html",
      "title": "Drowned in Yesterday",
      "cover": "fog",
      "coverImage": "assets/media/drowning-in-yesterday/shot-1.png",
      "coverAlt": "Title artwork for Drowned in Yesterday: a ship anchor and a line of hooded ghostly figures in blue ink wash",
      "coverCaption": "Title artwork by the team",
      "status": "Game jam · 2026 CiGA",
      "genre": "2D puzzle adventure",
      "role": "All gameplay programming",
      "engine": "Unity 6 · URP 2D",
      "year": "Jul 2026",
      "desc": "A ferryman enters a sinking ship to guide a restless spirit to the afterlife, climbing between decks and solving puzzles to collect five memory bubbles before the water rises.",
      "tags": [
        "Gameplay programming",
        "Puzzles",
        "Game jam"
      ],
      "notes": [
        "Rising water sets the pace: a 120-second parameter drives the level, and the same water lifts a treasure chest into reach so players have a reason to return.",
        "Two puzzle types share one interaction prompt: a bell sequence that awards a memory bubble and rotating rings that award a key for the trapdoor.",
        "I built all gameplay code in Unity and C# in a team of seven, including a drowning check matched to the shader's waterline. I used Claude Code in VS Code with DeepSeek as the backend model as an assistant; art, audio and story came from the team."
      ],
      "link": "https://gmhub.com/game/10134",
      "linkLabel": "View on GMHub ↗",
      "github": "https://github.com/HongwuLotsuki/Drowned-in-Yesterday"
    }
  ],
  "gameStats": [
    {
      "value": "5",
      "label": "design projects",
      "bar": 1
    }
  ],
  "loadout": [
    {
      "name": "Unity",
      "glyph": "Un",
      "role": "Game engine"
    },
    {
      "name": "C#",
      "glyph": "C#",
      "role": "Gameplay code"
    },
    {
      "name": "Unreal Engine 5",
      "glyph": "UE",
      "role": "Levels & Blueprint"
    },
    {
      "name": "Git",
      "glyph": "Git",
      "role": "Version control"
    },
    {
      "name": "VS Code",
      "glyph": "VS",
      "role": "Code editor + AI assist"
    },
    {
      "name": "itch.io",
      "glyph": "It",
      "role": "Publishing"
    }
  ],
  "timeline": [
    {
      "year": "2022",
      "title": "Starting university",
      "text": "Began studying computer science at the University of Pittsburgh at Johnstown."
    },
    {
      "year": "2025",
      "title": "CS Club",
      "text": "Joined the school's CS Club and tried making my first game."
    },
    {
      "year": "2026",
      "title": "Learning Godot",
      "text": "Learned Godot at the CS Club, alongside Unity."
    },
    {
      "year": "2026",
      "title": "First game jams",
      "text": "Joined CiGA Game Jam and GMTK Game Jam as a gameplay programmer."
    },
    {
      "year": "2026 — Today",
      "title": "Now",
      "text": "Building Admission Desk, Project 403 and RoadTrip, and learning more about scriptwriting and design."
    }
  ],
  "bars": [
    {
      "label": "Game design",
      "value": 70
    },
    {
      "label": "Programming",
      "value": 75
    },
    {
      "label": "Visual art",
      "value": 45
    }
  ],
  "skillLevels": {
    "unity": 3,
    "csharp": 3,
    "gameplay": 3,
    "physics": 2,
    "shader": 3,
    "db": 3,
    "apps": 2,
    "barcode": 2,
    "reports": 2,
    "git": 3,
    "problem": 4,
    "team": 4,
    "lang": 3
  },
  "equipped": [
    {
      "glyph": "cube",
      "rarity": "epic",
      "name": "Unity",
      "type": "Engine",
      "flavor": "Prototypes, jams and Project 403."
    },
    {
      "glyph": "code",
      "rarity": "epic",
      "name": "C#",
      "type": "Language",
      "flavor": "Gameplay code and tools."
    },
    {
      "glyph": "cube",
      "rarity": "rare",
      "name": "Unreal Engine 5",
      "type": "Engine",
      "flavor": "RoadTrip levels and Blueprint."
    },
    {
      "glyph": "window",
      "rarity": "common",
      "name": "Blueprint",
      "type": "Scripting",
      "flavor": "Interaction and survival systems in RoadTrip."
    },
    {
      "glyph": "cube",
      "rarity": "common",
      "name": "Godot",
      "type": "Engine",
      "flavor": "Learned at the CS Club in 2026."
    },
    {
      "glyph": "branch",
      "rarity": "common",
      "name": "Git",
      "type": "Tool",
      "flavor": "Version control on team projects."
    },
    {
      "glyph": "branch",
      "rarity": "rare",
      "name": "Unity Version Control",
      "type": "Tool",
      "flavor": "Team workflow on Count Me Out."
    },
    {
      "glyph": "code",
      "rarity": "common",
      "name": "VS Code",
      "type": "Tool",
      "flavor": "Editor, with Claude Code and DeepSeek as an assistant."
    },
    {
      "glyph": "code",
      "rarity": "common",
      "name": "Python · C++ · Java",
      "type": "Language",
      "flavor": "University coursework."
    },
    {
      "glyph": "window",
      "rarity": "common",
      "name": "Web design",
      "type": "Coursework",
      "flavor": "Web design and programming course."
    }
  ],
  "homeStats": [
    {
      "value": "5",
      "label": "game design projects",
      "fill": 1
    },
    {
      "value": "2",
      "label": "game jams",
      "fill": 0.4
    },
    {
      "value": "1",
      "label": "concept in design",
      "fill": 0.2
    },
    {
      "value": "2",
      "label": "engines: Unity & UE",
      "fill": 0.5
    }
  ],
  "marquee": [
    "Level Design",
    "Narrative Design",
    "Unity",
    "Unreal Engine",
    "Game Systems",
    "Design Docs"
  ],
  "text": {
    "games.hero.lead": "Five game projects, from a pixel art narrative and an RV road trip to two game jams and a concept about the pressures of an admissions desk.",
    "games.intro.title": "Design <em>and build.</em>",
    "games.intro.body": "I design levels, narrative and systems, and I write the gameplay code when a project needs it. These five projects cover perspective puzzles, survival loops and time mechanics, in Unity and Unreal.",
    "home.slots.title": "Three slots. <em>One designer.</em>",
    "about.hero.lead": "I'm a computer science student learning game design. I work with Unity and Unreal Engine, practise drawing, and make indie games on my own and in game jams. Right now I'm learning Godot, along with more about scriptwriting and design.",
    "about.stat.class.v": "Game Designer",
    "about.stat.subclass.v": "Game design · Level design · Narrative",
    "about.stat.origin.v": "Johnstown, PA · from Nanjing",
    "about.stat.special.v": "Mechanics and environmental storytelling",
    "about.story.c1.text": "I grew up with Flash games, mobile games and let's plays. Assassin's Creed, Overwatch and Destiny 2 made me wonder how worlds like that get built, and that curiosity never left.",
    "about.story.c2.text": "I studied computer science, joined my school's CS Club in 2025 and tried making my first game. This year I learned Godot there, and oil painting classes taught me about colour, light and composition.",
    "about.story.c3.text": "In 2026 I joined my first game jams, CiGA and GMTK. Now I'm building Project 403 and RoadTrip, drawn to liminal and dreamcore spaces where a familiar place feels strange.",
    "about.skills.branch.systems": "Design & Art",
    "about.skill.unity": "Unity",
    "about.skill.unity.f": "Prototypes, game jams and Project 403.",
    "about.skill.csharp": "C#",
    "about.skill.csharp.f": "Gameplay code: controls, interactions and puzzle systems.",
    "about.skill.gameplay": "Gameplay systems",
    "about.skill.gameplay.f": "Mechanics, controls and game feel.",
    "about.skill.physics": "Godot",
    "about.skill.physics.f": "Learned at the CS Club in 2026.",
    "about.skill.shader": "Game design",
    "about.skill.shader.f": "Mechanics, level flow and player experience.",
    "about.skill.db": "Level design",
    "about.skill.db.f": "Spaces, routes and pacing.",
    "about.skill.apps": "Narrative design",
    "about.skill.apps.f": "Environmental storytelling; still learning scriptwriting.",
    "about.skill.barcode": "Painting",
    "about.skill.barcode.f": "Colour, light and composition from oil painting classes.",
    "about.skill.reports": "Unreal Engine 5",
    "about.skill.reports.f": "Level layout and Blueprint in RoadTrip.",
    "about.skill.git": "Git & version control",
    "about.skill.git.f": "GitHub and Unity Version Control on team projects.",
    "about.skill.problem": "Problem solving",
    "about.skill.problem.f": "Breaking complex problems into small, measurable steps.",
    "about.skill.team": "Teamwork",
    "about.skill.team.f": "Game jam teams of seven and eight.",
    "about.skill.lang": "Languages",
    "about.skill.lang.f": "Chinese and English, with Spanish and French coursework."
  }
};
