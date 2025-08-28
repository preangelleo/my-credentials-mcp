## 🚨 CRITICAL: CONCURRENT EXECUTION & FILE MANAGEMENT

**ABSOLUTE RULES**:
1. ALL operations MUST be concurrent/parallel in a single message
2. **NEVER save working files, text/mds and tests to the root folder**
3. Use **/Users/lgg/coding/testing_folder** as your test folder or temp folder
4. ALWAYS organize files in appropriate subdirectories

** Aliens environment in this Mac **
``` zsh
 ~/.bash_aliases
```

# Global MCP servers configuration file path
/Users/lgg/.claude.json
Find "mcpServers" key at the root of the json file.

### 服务器架构
| 服务器 | 地址 | 用途 | 关键服务 |
|--------|------|------|----------|
| **Mac (本地)** | 开发环境 | 代码开发、测试 | Conda环境、Git |
| **AWS (云端)** | `api.sumatman.ai` | 生产环境 | Web应用、公共API | 
| **TensorBook** | `192.168.31.230` | GPU服务器 | 视频渲染、加密交易 |
| **Animagent (生产 - DO NOT EDIT OR RESTART THIS SERVER)** | `animagent.ai` | AWS Tokyo region |

### Animagent.ai AWS server Production environment and Ngnix configuration
About Docker, Ports, Ngnix, Database, SSL, etc, Read **/Users/lgg/coding/docs/animagent-server/animagent-production-mapping.md** for more information, especially before you do any operations. Update this document after you deploy any new code or changed anything.

### api.sumatman.ai AWS server Production environment and Ngnix configuration
About Docker, Ports, Ngnix, Database, SSL, etc, Read **/Users/lgg/coding/docs/sumatman-server/sumatman-production-mapping.md** for more information, especially before you do any operations. Update this document after you deploy any new code or changed anything.


## 🔐 MCP Credentials Database Server

### 🎯 When Claude Code Needs Credentials:
- **Auto-retrieve** from database during development (AWS, GitHub, Docker, etc.)
- **Generate new ones** if missing (API keys, passwords, tokens, UUIDs)
- **Store production credentials** automatically when ready

### Available Tools:
- `mcp__my-credentials__queryDatabase` - Get stored credentials
- `mcp__my-credentials__generatePassword/ApiKey/Token/etc` - Generate new ones
- `mcp__my-credentials__executeDatabase` - Store credentials (production ready)

### Current Inventory (48 credentials):
AWS, GitHub, Docker, Ghost Blogs, Supabase, Replicate, PyPI, etc.

### Usage:
Claude automatically calls these tools when needed. No hardcoded credentials in code.

## SSL Certificate
use admin@animagent.ai if you need a real email address

## SSH command into animagent api server at aws ubuntu
```bash
ssh -i "/Users/lgg/coding/vibe_coding/credentials/animagent.pem" ubuntu@animagent.ai
```

## SSH command into sumatman api server at aws ubuntu
```bash
ssh -i "/Users/lgg/coding/sumatman/rsa/sumatman.pem" ubuntu@api.sumatman.ai
```

## Restart sumatman api server at aws ubuntu
```bash
ssh -i "/Users/lgg/coding/sumatman/rsa/sumatman.pem" ubuntu@api.sumatman.ai "sudo systemctl restart sumatman.service"
```

## Tensor book ubuntu desktop environment
// if you need to build a Docker image, use this environment for wider compatibility. First, sync the source code to TensorBook /root/coding/project-name folder, then build the Docker image, then push the Docker image to Docker Hub. Export the docker credentials to TensorBook environment when building the Docker image. when publishing a Docker image, publish the README.md to docker hub as well. Or at least we need to put the GitHub Repo URL to the docker image description.
```bash
ssh root@192.168.31.230
```

### ⚡ GOLDEN RULE: "1 MESSAGE = ALL RELATED OPERATIONS"

**MANDATORY PATTERNS:**
- **TodoWrite**: ALWAYS batch ALL todos in ONE call (5-10+ todos minimum)
- **Task tool**: ALWAYS spawn ALL agents in ONE message with full instructions
- **File operations**: ALWAYS batch ALL reads/writes/edits in ONE message
- **Bash commands**: ALWAYS batch ALL terminal operations in ONE message
- **Memory operations**: ALWAYS batch ALL memory store/retrieve in ONE message
- **Code Edit**: Never edit code directly from the remote server. Always edit code locally in Mac first, after thorough testing, `git add .`, `git commit`, `git push` the code. Then go to the server and `git pull` the code, update the code.

### 📁 File Organization Rules

**NEVER save to root folder. Use these directories:**
- `/src` - Source code files
- `/tests` - Test files
- `/docs` - Documentation and markdown files
- `/config` - Configuration files
- `/scripts` - Utility scripts
- `/examples` - Example code

## Tips
For the folder or file you don't have permission to access, you can create a script to copy the code or folder into your temporary folder (testing_folder/). Then you have the permission to view or edit those files.

## Resource files for testing
**/Users/lgg/coding/vibe_coding/test_resource_files** (DO NOT DELETE, Plenty of images, audios, videos, text files, json files, srt files, etc.)

## Enhanced Open Source Project Creation Workflow (GitHub environment already installed)
My github username is "preangelleo"

### Phase 1: Project Planning & Design
1. **Project Architecture Design**
   - Define project structure and folder hierarchy
   - Choose appropriate technology stack
   - Plan module dependencies and interfaces
   - Create a project subfolder as working folder
   - Write a comprehensive PROJECT_DEVELOPMENT_PLAN.md for AI Code Assistant

2. **Environment & Configuration Setup**
   - Design .env variables with clear documentation
   - Create comprehensive .env.example with descriptions
   - Set up configuration validation and error handling

3. **Foundation Files**
   - Write a comprehensive README.md for target users (Maybe end users or developers)
   - Set up .gitignore for your tech stack
   - Add LICENSE file (consider MIT, Apache 2.0, etc.)
   - Create requirements.txt/package.json with version pinning

### Phase 2: Core Development
4. **Modular Development Approach**
   - Create core functionality modules one by one
   - Implement comprehensive error handling
   - Add logging and debugging capabilities
   - Test each module thoroughly before moving to next

5. **Environment Configuration**
   - Guide user through .env setup with validation
   - Provide clear instructions for obtaining API keys/credentials
   - Include fallback configurations where appropriate

6. **Testing Strategy**
   - Write unit tests for each function
   - Create integration tests for module interactions
   - Add performance benchmarks if relevant
   - If you assume the test takes some time, give the user the command and prompt user to do the test manually and wait for the result.
   - Create a temporary dictionary for all of the test outputs in case the terminal crashes and you can still find the test results from the folder. But you need to clean the folder before you do the git push.

### Phase 3: Documentation & Examples
7. **Comprehensive Documentation**
   - Create detailed EXAMPLE_USAGE.md with multiple scenarios
   - Create an example_usage.py (or in other language) for the most possible user case, and put all of the parameters and put a default value for each parameter. So the future user can copy the core function from example_usage.py and override the parameters with their preferred value and leave others with the default value.
   - Generate API documentation (Sphinx, JSDoc, etc.)
   - Add troubleshooting guide and FAQ
   - Removing all of the debug printing and logging from the source code before commit.

8. **User Experience Enhancement**
   - Create CLI interface if applicable
   - Add progress indicators and user feedback
   - Implement graceful error messages

### Phase 4: Quality Assurance & Security
9. **Code Quality & Security**
   - Run linting and formatting tools
   - Security audit for sensitive data handling
   - Code review checklist
   - Remove all test data and credentials

10. **Deployment Preparation**
    - Create Dockerfile and docker-compose.yml
    - Add deployment scripts and guides
    - Set up monitoring and health checks
    - Add GitHub Actions workflows for Docker build and download the image to Macl local for test and publish (push) to Docker Hub
    - DOCKER_USER_NAME=betashow (in .env and github (youtube-thumbnail-generator))
    - DOCKER_ACCESS_TOKEN=***************** (in .env and github (youtube-thumbnail-generator))

### Phase 5: Release & Community
11. **Repository Setup**
    - Create GitHub repo with matching folder name
    - Set up branch protection rules
    - Configure GitHub templates (Issue, PR, etc.)

12. **CI/CD Pipeline**
    - GitHub Actions for automated testing
    - Automated security scanning
    - Release automation with semantic versioning

13. **Community Building**
    - Add CONTRIBUTING.md guidelines
    - Create CODE_OF_CONDUCT.md
    - Set up issue and PR templates
    - Add changelog automation

14. **Final Steps**
    - Move test files to tests/ directory or code_backup/
    - Update all documentation links
    - Create initial release with proper tags
    - Git add, commit, and push with conventional commit messages

### Additional Enhancements:
- **Package Management**: Consider publishing to PyPI, npm, etc. （PYPI_API_TOKEN=************** # in .env）
- **Monitoring**: Add analytics and usage tracking (if appropriate)
- **Internationalization**: Support multiple languages if needed
- **Performance**: Add benchmarking and optimization guides
- **Community**: Set up discussions, wiki, or documentation site
- **Author**: leowang.net <me@leowang.net>

## Backup folder
/Users/lgg/coding/Code_backup # Remove unused or backed up code into this folder.


=============================================
// This text block is dynamically managed by Code Assistant and the user. You (the Code Assistant) can insert all of the important information during the process into the proper section, and the user will input their new prompt into the designated section. Together, we need to manage this text block dynamically during the whole task process for dynamic memory update and future project handover. This block is **extremely important** when sometimes the IDE terminal will crash during our task process.

# CURRENT WORKING TASK
// If nothing is inserted here, then wait for a user's prompt.



---------------------------------------------
## Important information or credentials generated during the task
// You need to insert any important information or credentials generated during the task into this block.


---------------------------------------------
## Planning created and managed by Code Assistant


---------------------------------------------
## To-do list created and managed by Code Assistant


---------------------------------------------
## Tough Challenges found during the task created and managed by Code Assistant
// If you encounter anything you cannot resolve in three times, mark the challenges here for memory.


---------------------------------------------
## User's new prompt
// During a loop or your autonomous process, the user cannot input their prompt from the input area. Then the user will put what they want to say here.



---------------------------------------------
## Completion status of the task managed by the user
// This block is managed by the user. If the user puts completion in capitalization in uppercase, then you can complete the task, stop the task. If the user hasn't put a completion of the task, that means the user has further prompts, commands, or instructions for this task.



---------------------------------------------

=============================================

# Most important thing: 
- **Do not hard code any credentials**
- **Do not hard code any API keys**
- **Do not hard code any API secrets**