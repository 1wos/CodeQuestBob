# CodeQuest Bob: Turning GitHub Repositories Into Developer Quests with IBM Bob

![CodeQuest Bob cover image](https://github.com/1wos/CodeQuestBob/raw/main/docs/submission-assets/CodeQuestBob_Cover_Image.png)
*CodeQuest Bob: Others explain code. CodeQuest Bob grows developers.*

**I treated this hackathon as a focused product sprint.**

In May 2026, I joined the **IBM Bob Hackathon** hosted on lablab.ai. The event ended with 1,679 teams and 502 AI applications. I joined solo, and because I had a research group meeting on Saturday, I had to make the scope small, sharp, and product-driven from the start.

Within that limited build time, I needed to ship a React application, connect IBM Cloud services, build a 3D interaction layer, prepare a demo video, create a pitch deck, deploy the app, and polish the README enough for judges and future portfolio readers.

This is the story of how I built **CodeQuest Bob**, and what I learned about using an AI development partner in a real product sprint.

## The prompt that shaped the hackathon

The hackathon tagline was simple:

> Your repo. Your rules. AI as your dev partner.

The goal was not just to build another AI app. The challenge was to use **IBM Bob** as a real development partner and create something that improves how software gets built.

The official theme was **"Turn idea into impact faster."** Participants were encouraged to solve everyday developer problems: getting up to speed on unfamiliar codebases, generating documentation or tests, reducing repetitive work, and helping builders move with more confidence.

One requirement stood out: every submission had to clearly show how IBM Bob was meaningfully used in the solution. If Bob was only mentioned as a label, the project could be disqualified. That constraint made the project much more interesting. The process mattered, not just the final demo.

## Why I decided to build solo

I had two reasons for joining.

First, I wanted to try IBM Bob and the broader IBM AI ecosystem for myself. I had not seen many Korean writeups about using IBM Bob, watsonx, or Watson APIs inside an actual product build, and I had been curious about that stack for a while.

Second, I wanted to build something that could live beyond the hackathon. I did not want a disposable MVP. I wanted a project that could later explain what problem I defined, what product decisions I made, what UX I designed, and how I used AI tools in a real workflow.

The platform supported team formation, but when I checked available participants by time zone, I could not easily find people aligned with KST. Given the deadline, solo execution felt more realistic than coordination across time zones. So I decided to move fast and finish it alone.

## The unusual submission rule: show the AI process

The provided **IBM Bob Hackathon Guide** made two things clear.

First, IBM Bob IDE had to be central to the project. We could use other tools and frameworks, but the submission needed to demonstrate real use of Bob inside the development workflow.

Second, we had to export the **IBM Bob task session report** and include it in the public GitHub repository. That was different from many hackathons, where the final code and demo are usually enough. Here, the AI-assisted development history became part of the deliverable.

I liked that. It made the project feel less like "AI wrote some code" and more like "AI participated in the engineering process."

The hackathon also gave access to several IBM Cloud resources. I explored or configured:

- IBM Bob
- watsonx.ai Studio and Watson Machine Learning
- Watson Natural Language Understanding
- Watson Text to Speech
- Watson Speech to Text
- watsonx.governance
- watsonx Orchestrate
- IBM Cloud Object Storage
- IBM Cloudant

It was not realistic to use every service deeply in a one-day build, so I prioritized the services that could become part of the actual user experience. Watson NLU powered learning signal extraction. Watson Text to Speech and Speech to Text supported the briefing loop. Cloudant was designed as a future persistence layer for saved learning resources. governance and Orchestrate stayed closer to the architecture layer for this version.

The service I most wish I had more time for was **watsonx Orchestrate**. My understanding is that it can connect AI agents and business applications into automated workflows. In a future version of CodeQuest Bob, it could help create GitHub issues after repository analysis, assign onboarding tasks to contributors, or generate team-level growth reports.

## What I built: CodeQuest Bob

The product idea became:

> Others explain code. CodeQuest Bob grows developers.

Many code analysis tools focus on explaining what code does. But for a new contributor, the hardest part is often not the explanation itself. The harder questions are:

- Where should I start?
- Which files should I read first?
- What would be a safe first contribution?
- Am I ready to open a pull request?

CodeQuest Bob turns an unfamiliar GitHub repository into a **gamified developer growth journey**.

A user enters a repository URL. The app analyzes the repo structure, turns the onboarding path into quests, recommends learning resources, and eventually generates a package that helps the user prepare a first pull request.

The user flow looks like this:

1. **Repository Intake**: enter a GitHub repository URL.
2. **Live GitHub Scan**: analyze repository metadata and structure through a server-side API route.
3. **Growth Quest Map**: move through Setup, Explore, Improve, and First PR quests.
4. **Quest Detail + Skill Boost Radar**: follow quest objectives and receive GitHub/Hugging Face learning recommendations.
5. **First PR Package**: collect target files, commands, PR copy, reviewer notes, and a checklist.
6. **Developer Growth Passport**: keep completed quests, saved Skill Boosts, Service Stamps, and AI analysis activity in one place.

## I wanted the repository to feel spatial

From the beginning, I wanted a 3D-feeling interface. I did not want another flat dashboard where the repository appears only as a file tree or metrics table. I wanted the user to feel like they were entering a codebase and moving through it.

![3D Repository Orbit Map](https://github.com/1wos/CodeQuestBob/raw/main/docs/screenshots/codequest-bob-repository-orbit.png)
*3D Repository Orbit Map: the repository becomes a growth path instead of just a file tree.*

That became the **3D Repository Orbit Map**.

The repository core sits at the center, while Setup Quest, Explore Quest, Improve Quest, and First PR Quest orbit around it. The point was not decoration. It was a UX metaphor for onboarding: helping a new contributor understand where they are, where they can go next, and how each step builds toward contribution readiness.

## How IBM services fit into the product

One personal goal for this hackathon was to actually touch the IBM ecosystem, not just put the logos in a slide.

In CodeQuest Bob, the services were mapped to product behavior:

- **IBM Bob**: repository reasoning, implementation planning, code structure review, UI/UX critique, and submission preparation.
- **watsonx.ai / IBM Granite**: recommendation reasoning and learning direction inside Skill Boost Radar.
- **Watson Natural Language Understanding**: keyword and learning-signal extraction from GitHub and Hugging Face resources.
- **Watson Text to Speech**: audio quest briefings.
- **Watson Speech to Text**: transcript verification for generated briefings.
- **IBM Cloudant**: designed as the persistence path for saved Skill Boosts.

IBM Bob offered several working modes, including Plan, Code, Advanced, Ask, and Orchestrator. I used Plan mode to shape the product direction and MVP scope, Code mode to build out the React/TypeScript structure, and Ask mode to check requirements and clarify implementation choices. At the end, I exported the Bob task history and included it in the GitHub repository.

![IBM Cloud architecture for CodeQuest Bob](https://github.com/1wos/CodeQuestBob/raw/main/docs/screenshots/codequest-bob-architecture.png)
*Architecture overview: React client, Vercel API proxy, IBM Cloud services, and GitHub repository context.*

The most important design choice was not "use many IBM services." It was making sure each service had a visible role in the user journey. So instead of hiding the integrations in a technical appendix, I connected them to actual features: Skill Boost Radar, Speech Briefing Loop, Developer Growth Passport, and the exported Bob session report.

## Not code explanation, but contribution readiness

The main differentiation I cared about was **contribution readiness**.

I did not want the app to stop at repository summary. CodeQuest Bob needed to help a beginner move from "I do not know where to start" to "I can prepare a small, reviewable contribution."

That led to five core features.

**Skill Boost Radar** recommends learning resources related to the current quest. Watson NLU extracts keywords and signals from resources, while watsonx.ai / Granite explains why a resource is relevant to the user's current step.

**First PR Package** prepares the practical pieces of a first contribution: target files, commands to run, PR title and description, reviewer notes, and a completion checklist.

**Developer Growth Passport** collects completed quests, saved learning resources, earned stamps, and AI analysis activity. I wanted it to feel like a growth record, not just a progress bar.

**Service Stamps** make IBM service usage feel like GitHub achievements. The user can unlock stamps such as Repo Scanner, Granite Coach, NLU Scout, Speech Loop, Skill Radar, First PR Ready, and Passport Keeper. I kept the visual style restrained so it stayed closer to IBM Carbon than a toy-like game UI.

**3D Orbit Map** turns repository onboarding into a spatial progression path. It is the screen I remember most from the project.

In short, CodeQuest Bob is not trying to be "a tool that explains this code." It is trying to be "a tool that helps you become someone who can contribute to this repository."

## The product constraints I kept repeating

During the build, I kept returning to three constraints:

It should not feel like a disposable demo. It should feel like the beginning of a real SaaS product. IBM Bob usage should be visible through the workflow, not only claimed in text. Developer onboarding should feel like growth, not homework.

That is why the interface uses quests, a passport, service stamps, and a 3D map instead of a standard admin dashboard.

At the same time, I did not want the product to become too cute. IBM has a strong enterprise design language, so I borrowed from IBM Carbon: white surfaces, thin lines, restrained use of IBM Blue, square geometry, and clear typography. On top of that, I added small GitHub-achievement-like moments to make the experience more memorable.

## What IBM Bob taught me about AI-assisted engineering

The best part of using IBM Bob was that it could work with project context. It was not just producing isolated code snippets. It could inspect the file structure, understand the current implementation direction, and suggest the next engineering step.

But it was not magic.

During UI polishing, I noticed some generic AI design patterns trying to sneak back in: unnecessary accent borders, decorative cards, too many status badges, or copy that sounded more like an internal implementation note than a real product. I had to keep tightening the design direction.

I also saw cases where a later task partially reverted a UI or copy decision that had already been refined. In the second half of the project, I became much more careful about reviewing diffs and explicitly stating which design decisions had to remain unchanged.

That was the biggest lesson for me:

AI development tools are powerful, but the quality of the result depends heavily on the quality of the constraints.

It is not enough to ask for a good output. You have to define what "good" means: the design system, the product tone, the user flow, the technical boundaries, and the things the AI should not do.

## Final submission

- **GitHub Repository**: [github.com/1wos/CodeQuestBob](https://github.com/1wos/CodeQuestBob)

The live demo, demo video, pitch deck, and exported IBM Bob task report are all linked or included from the repository README.

## Closing thoughts

This hackathon felt less like "build an AI app" and more like an experiment in what changes when AI becomes part of the product engineering process.

IBM Bob did not replace product judgment. If anything, it made product judgment more important. I still had to decide the problem, the UX direction, the visual constraints, the feature scope, and the final story.

But with the right constraints, it helped me move from an idea to a deployed product in a very short amount of time: repository analysis, IBM Cloud integration, 3D UI, demo video, pitch deck, public deployment, README polish, and exported AI development history.

CodeQuest Bob is still a prototype, but it is a prototype I want to keep growing. The next version could add GitHub issue generation, team onboarding reports, Orchestrate-based workflow automation, and Cloudant-backed persistence for saved learning resources.

The sentence I kept at the end of the project was this:

> A good AI development tool does not just write code for you.
> It helps you ask better questions, set better constraints, and make better product decisions.
