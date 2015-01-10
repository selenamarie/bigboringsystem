# Contributing to Big Boring System

We love contributions. If you're unsure where to start, read on or feel free to ask the community!

### First, Some Basics

* **See if an issue already exists and if it's already in progress.** [If an issue already exists](https://github.com/bigboringsystem/bigboringsystem/issues) and has someone obviously working on it (use your judgement), don't take it over without asking for their approval.

* **Don't send pull requests for new features without starting a conversation about it first.** Not every feature will be accepted into the codebase for various design constraints. Please open an issue to start a discussion before doing work on it. Or fork the project and run it on your own server.

* **Please try your best to match the JavaScript formatting on the rest of the codebase.** If we apply whitespace between certain spots, try to do the same. If we use triple equals, also try to do the same. At worst, we will let you know on your pull request and you can rebase your changes. (See below for rebase instructions.)

* **Remember, the goal of this project is to maintain simplicity and understand how people can work together on a minimal system.** The goal is not to turn it into Facebook number two. Or Ello. Or whatever else.

### Submitting a Pull Request

To make changes to the code, whether you see a typo somewhere or you want to edit CSS or fix application code or any other fix/change, here are the steps:

1. You need a free GitHub account if you don't have one.
1. Fork this repository by clicking the "Fork" button in the top right corner, which will make a copy of the repo under your name with a reference back to this one.
1. Clone your fork locally, on the command line or using one of the GitHub GUI applications - [Mac](https://mac.github.com/) | [Windows](https://windows.github.com/)
1. Create a new branch for your changes with `$ git checkout -b <new-branch-name>`, call it something related to the changes you're making.
1. _At this point it's probably a good idea to put a comment on the issue saying, "I'm working on this" to prevent duplicate effort._
1. Make changes on your new branch. 
1. Test your changes, if you can. You can do this by running the server using `$ npm run dev` to start it locally in development mode. (To do this you'll need to [have node and npm installed](http://nodejs.org) and run `$ npm install` to install the dependencies.)
1. Commit your changes, push them to your fork: `$ git push origin <branch-name>`
1. Go to your fork's GitHub page and click the green "Compare & pull request" button to submit your changes for review.
1. A maintainer will review your changes and ask you to make any edits, updates, etc. if necessary
1. If your PR is accepted and merged, you can go ahead and delete that branch you created

### Rebasing and Squashing, Huh?

##### Rebasing

If you're working on a feature, sometimes other changes get merged into master before yours, which makes your branch out of date. Rather than just merging master into your branch and mixing up all those commits, it's cleaner for the history if you use `rebase`.

If we _just_ ask you to rebase, here's how:

* Make sure you have an upstream remote pointed at this repo, not your fork. If you don't have this, create it:

> ```
> $ git remote add upstream git@github.com:bigboringsystem/bigboringsystem.git
> ```

* Make sure you've committed all your changes on your branch (preferably you're not working on master, but a new branch created for your fixes).

* Rebase against upstream/master

> ```
> $ git fetch upstream
> $ git rebase upstream/master
> ```

You can read more about this here: http://robots.thoughtbot.com/keeping-a-github-fork-updated

##### Squashing

You can submit multi-commit pull requests if the commits do different things, but if you're iterating on something or making small changes with multiple commits, that makes the history messy. If you think of it while you're working, you can just keep amending your previous commit by doing `$ git add <file>` then `$ git commit --amend`, but often you might forget. If we see these kind of commits, we'll ask you to squash them.

This is a great explanation of how to do this with `git rebase -i`: http://gitready.com/advanced/2009/02/10/squashing-commits-with-rebase.html

##### Force Pushing

If you rebase or amend commits or squash commits on a PR you've already submitted, GitHub may not let you push your changes. If it complains when you push, use -f to force push the changes anyway.

`$ git push -f origin <change-branch>`
