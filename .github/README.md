# 🤖 GitHub Bots & Automation

This directory contains GitHub Actions workflows and configurations that automatically manage issues, pull requests, and repository interactions.

## 🚀 Available Bots

### 1. Auto-Assign Bot
- **File**: `.github/workflows/auto-assign-issues.yml`
- **Purpose**: Automatically assigns issues to their creators
- **Triggers**: When a new issue is opened
- **Features**:
  - Auto-assigns issues to the person who created them
  - Adds `auto-assigned` label
  - Skips issues with specific keywords (wontfix, duplicate, invalid)

### 2. Auto-Comment Bot
- **File**: `.github/workflows/auto-comment-issues.yml`
- **Purpose**: Automatically comments on new issues with helpful information
- **Triggers**: When a new issue is opened
- **Features**:
  - Welcomes issue creators
  - Provides issue guidelines
  - Links to helpful resources

### 3. PR Comment Bot
- **File**: `.github/workflows/auto-comment-prs.yml`
- **Purpose**: Automatically comments on new pull requests
- **Triggers**: When a new PR is opened
- **Features**:
  - Welcomes PR creators
  - Provides PR guidelines
  - Explains the review process

### 4. Auto-Label Bot
- **File**: `.github/workflows/auto-label.yml`
- **Purpose**: Automatically labels issues and PRs based on content
- **Triggers**: When issues/PRs are opened or edited
- **Features**:
  - Detects bug reports, feature requests, documentation needs
  - Adds priority labels based on keywords
  - Categorizes by frontend/backend/testing
  - Adds type-specific labels

### 5. Welcome Bot
- **File**: `.github/workflows/welcome-contributors.yml`
- **Purpose**: Welcomes first-time contributors
- **Triggers**: When a new PR is opened
- **Features**:
  - Detects first-time contributors
  - Sends personalized welcome messages
  - Adds special labels for new contributors

## 📋 Issue Templates

### Bug Report Template
- **File**: `.github/ISSUE_TEMPLATE/bug_report.md`
- **Purpose**: Structured bug reporting
- **Features**:
  - Pre-filled sections for bug description
  - Environment information
  - Steps to reproduce
  - Priority selection

### Feature Request Template
- **File**: `.github/ISSUE_TEMPLATE/feature_request.md`
- **Purpose**: Structured feature requests
- **Features**:
  - Problem statement section
  - Proposed solution
  - Use cases
  - Acceptance criteria

## 🔧 Configuration

### Auto-Assign Configuration
- **File**: `.github/auto_assign.yml`
- **Purpose**: Configures auto-assignment behavior
- **Features**:
  - Label-based assignments
  - Path-based assignments
  - Skip conditions
  - Assignee limits

## 🎯 How It Works

1. **Issue Creation**: When someone creates an issue:
   - Bot automatically assigns it to the creator
   - Bot adds appropriate labels
   - Bot leaves a helpful comment with guidelines

2. **PR Creation**: When someone creates a PR:
   - Bot welcomes the contributor
   - Bot adds relevant labels
   - Bot provides PR guidelines
   - Bot checks if it's a first-time contributor

3. **Content Analysis**: Bots analyze issue/PR content to:
   - Determine appropriate labels
   - Set priority levels
   - Categorize by type

## 🚀 Setup Instructions

1. **Push to GitHub**: These files are automatically detected when pushed to your repository
2. **Enable Actions**: Ensure GitHub Actions are enabled in your repository settings
3. **Permissions**: The workflows use `GITHUB_TOKEN` which is automatically available
4. **Customization**: Modify the YAML files to match your project's needs

## 🔒 Security & Permissions

- All workflows use the built-in `GITHUB_TOKEN`
- No external API keys required
- Workflows only have access to public repository data
- All actions are logged in the Actions tab

## 📊 Monitoring

- Check the **Actions** tab in your GitHub repository
- View workflow runs and their results
- Monitor bot activities in issue/PR comments
- Review auto-assigned labels and assignees

## 🛠️ Customization

### Adding New Labels
Edit `.github/workflows/auto-label.yml` and add new label mappings:

```yaml
'new-label': ['keyword1', 'keyword2', 'keyword3']
```

### Modifying Comments
Edit the comment templates in the workflow files to match your project's tone and requirements.

### Adding New Workflows
Create new `.yml` files in `.github/workflows/` following the same pattern.

## 🐛 Troubleshooting

### Bot Not Working?
1. Check the **Actions** tab for failed workflow runs
2. Ensure GitHub Actions are enabled
3. Verify the workflow files are in the correct location
4. Check repository permissions

### Wrong Labels?
1. Review the label mappings in `auto-label.yml`
2. Check for typos in keywords
3. Verify label names exist in your repository

### Comments Not Appearing?
1. Check workflow execution logs
2. Verify the trigger conditions
3. Ensure the bot has permission to comment

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [GitHub Script Action](https://github.com/actions/github-script)
- [Auto Assign Issue Action](https://github.com/pozil/auto-assign-issue)
- [GitHub REST API](https://docs.github.com/en/rest)

## 🤝 Contributing

To improve these bots:
1. Fork the repository
2. Make your changes
3. Test the workflows
4. Submit a pull request

---

**Note**: These bots are designed to improve the contributor experience and reduce manual maintenance. They can be disabled or modified as needed for your project.
