# RSS Feed Collection - GitHub Pages

This directory contains the GitHub Pages content for the RSS Feed Collection.

## What is this?

The `index.html` file in this directory is automatically generated and updated by the RSS Feed Collector GitHub Actions workflow. It displays:

- Latest articles from configured RSS feeds
- Statistics about feed collection
- Publication dates and links to articles
- Failed feeds (if any)

## Viewing the Page

Once GitHub Pages is enabled, the page will be available at:
```
https://<username>.github.io/<repository-name>/
```

For this repository:
```
https://mudman1986.github.io/Mudman1986/
```

## How to Enable GitHub Pages

Follow these steps to activate GitHub Pages for this repository:

### Step 1: Go to Repository Settings
1. Navigate to your repository on GitHub
2. Click on **Settings** (tab at the top)

### Step 2: Navigate to Pages Settings
1. In the left sidebar, scroll down to **Code and automation** section
2. Click on **Pages**

### Step 3: Configure Source
1. Under **Source**, select **Deploy from a branch**
2. Under **Branch**:
   - Select the branch: `main` (or your default branch)
   - Select the folder: `/docs`
3. Click **Save**

### Step 4: Wait for Deployment
1. GitHub will start building and deploying your site
2. This usually takes 1-2 minutes
3. You'll see a message: "Your site is ready to be published at https://..."

### Step 5: Verify
1. Click on the provided URL to view your GitHub Pages site
2. You should see the RSS Feed Collection page

## How It Updates

The page is automatically updated by the workflow:

1. **On Schedule**: The workflow runs Monday-Friday at 9:00 AM UTC
2. **On Push**: The workflow runs whenever code is pushed to the repository
3. **Manual**: You can trigger the workflow manually from the Actions tab

When the workflow runs:
- It collects RSS feeds from configured sources
- Generates a new `index.html` file with the latest articles
- Commits and pushes the updated file to the `docs/` directory
- GitHub Pages automatically deploys the updated content

## Customization

To customize the feeds being collected, edit:
```
.github/rss-feeds.json
```

The HTML styling can be customized by modifying the generation logic in:
```
.github/actions/collect-rss-feeds/generate_summary.py
```

## Troubleshooting

### Page not updating?
- Check the Actions tab to see if the workflow is running successfully
- Verify that the workflow has `contents: write` permission
- Check that the `docs/index.html` file is being committed

### Page not accessible?
- Ensure GitHub Pages is enabled in repository settings
- Verify the branch and folder settings are correct (`main` branch, `/docs` folder)
- Check if the repository is public (GitHub Pages on free tier requires public repos)

### 404 Error?
- Make sure the `docs/index.html` file exists in the repository
- Verify GitHub Pages is configured to use the `/docs` folder
- Wait a few minutes for GitHub to deploy the changes

## Security Note

The workflow uses `github-actions[bot]` to commit changes. This is secure and doesn't require any personal access tokens.
