# RSS Processing Architecture

## Component Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         RSS FEED WORKFLOW                            │
└─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │   collect-rss-feeds ACTION (portable)      │
         │   ────────────────────────────────         │
         │   • Fetches RSS/Atom feeds                 │
         │   • Parses feed data                       │
         │   • Filters by date                        │
         │   • Outputs JSON                           │
         │   • Generates workflow summary             │
         └────────────────────────────────────────────┘
                                  │
                                  │ JSON data
                                  ▼
         ┌────────────────────────────────────────────┐
         │   WORKFLOW SCRIPTS (project-specific)      │
         │   ─────────────────────────────            │
         │                                            │
         │   ┌──────────────────────────────┐         │
         │   │  generate_summary.py         │         │
         │   │  • Reads JSON data           │         │
         │   │  • Generates HTML pages      │         │
         │   │  • Uses template.html        │         │
         │   │  • Creates multi-page site   │         │
         │   └──────────────────────────────┘         │
         │                                            │
         │   ┌──────────────────────────────┐         │
         │   │  generate_rss.py             │         │
         │   │  • Reads JSON data           │         │
         │   │  • Generates RSS 2.0 feeds   │         │
         │   │  • Creates master + individual│        │
         │   └──────────────────────────────┘         │
         │                                            │
         │   ┌──────────────────────────────┐         │
         │   │  utils.py                    │         │
         │   │  • Shared helper functions   │         │
         │   │  • Date parsing              │         │
         │   │  • Slug generation           │         │
         │   └──────────────────────────────┘         │
         └────────────────────────────────────────────┘
                                  │
                                  ▼
         ┌────────────────────────────────────────────┐
         │         GitHub Pages (docs/)               │
         │         ────────────────                   │
         │   • index.html (all feeds)                 │
         │   • feed-*.html (individual feeds)         │
         │   • summary.html (statistics)              │
         │   • feed.xml (master RSS)                  │
         │   • feed-*.xml (individual RSS)            │
         └────────────────────────────────────────────┘
```

## Data Flow

```
RSS Feeds → [Action] → JSON → [Workflow Scripts] → HTML + RSS → GitHub Pages
            ────────           ──────────────────
            Portable           Project-specific
```

## Why This Separation?

### Before (Problematic)
```
actions/collect-rss-feeds/
├── collect_feeds.py         ← Used by action
├── generate_summary.py      ← Used by action AND workflows
├── generate_rss.py          ← Used ONLY by workflows (!)
└── utils.py                 ← Used by all

Problem: Workflows called scripts inside action directory
         → Breaks when action is extracted
```

### After (Clean)
```
actions/collect-rss-feeds/             Workflows call these scripts
├── collect_feeds.py                              ↓
├── generate_markdown_summary.py       .github/workflows/scripts/rss-processing/
                                       ├── generate_summary.py
.github/workflows/scripts/             ├── generate_rss.py
└── rss-processing/                    └── utils.py
    ├── generate_summary.py
    ├── generate_rss.py                Action is now independent
    └── utils.py                       ↑
                                  No workflow dependencies!
```

## Component Responsibilities

### Action (Portable)
**Purpose**: Data collection  
**Input**: RSS feed URLs, time window  
**Output**: Structured JSON with articles  
**Dependencies**: feedparser  
**Use case**: Reusable across projects

### generate_summary.py (Workflow Script)
**Purpose**: HTML page generation  
**Input**: JSON from action  
**Output**: Multi-page HTML site  
**Dependencies**: Python stdlib, utils.py, template.html  
**Use case**: Specific to this project's GitHub Pages

### generate_rss.py (Workflow Script)
**Purpose**: RSS feed generation  
**Input**: JSON from action  
**Output**: RSS 2.0 XML feeds  
**Dependencies**: Python stdlib, utils.py  
**Use case**: Specific to this project's feed aggregation

### utils.py (Workflow Script)
**Purpose**: Shared utilities  
**Functions**: Date parsing, slug generation, sorting  
**Dependencies**: Python stdlib  
**Use case**: Shared by generate_summary.py and generate_rss.py

## Extraction Boundary

```
┌──────────────────────────────────────────────────────┐
│  EXTRACTABLE (goes to separate repo)                 │
│  ──────────────────────────────────                  │
│                                                       │
│  actions/collect-rss-feeds/                          │
│  ├── action.yml                                      │
│  ├── collect_feeds.py                                │
│  ├── generate_markdown_summary.py                    │
│  └── tests/                                          │
│                                                       │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│  STAYS IN THIS REPO (project-specific)               │
│  ─────────────────────────────────────               │
│                                                       │
│  .github/workflows/scripts/rss-processing/           │
│  ├── generate_summary.py                             │
│  ├── generate_rss.py                                 │
│  ├── utils.py                                        │
│  ├── template.html                                   │
│  └── tests/                                          │
│                                                       │
└──────────────────────────────────────────────────────┘
```

## Future State

After extraction:
```yaml
# Workflow will reference external action
- uses: username/rss-feed-collector-action@v1
  with:
    config-path: ".github/rss-feeds.json"
    output-path: "rss-feeds-output.json"

# Workflow scripts remain local
- run: python3 .github/workflows/scripts/rss-processing/generate_summary.py
- run: python3 .github/workflows/scripts/rss-processing/generate_rss.py
```

No changes to workflow scripts needed!

## Benefits

1. **Portability**: Action can be used by other projects
2. **Flexibility**: Each project can customize HTML/RSS generation
3. **Maintainability**: Clear boundaries, focused components
4. **Testability**: Separate test suites for each layer
5. **No Breaking Changes**: Workflows continue to work after extraction
