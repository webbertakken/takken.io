---
title: 'Choosing the right stack'
date: '2021-04-28'
description: "A point of view on how to approach choosing a stack for a new application, with examples for each step along the way."
categories:
- 'Software development'
---

Choosing the right stack for an application may seem like a trivial task.

As a developer, for several years I have underestimated both the importance of choosing the right tools for the job, and how crucial the time spent evaluating them is. In my world, simply picking the most modern library or well supported package for each challenge was time well spent. And if I am honest this approach served me better than expected.

However, while picking modern well-supported tools and following best practices will most likely have you succeed to some extent, I’ve learned that you may be able to create working products much faster and with less effort by spending just enough time up-front; thinking about how best to achieve your goal, be it another feature or an entirely new stack.

## Thinking up front

Think about “What should we be building? For whom? Why do they need it?”

Once we start coding we may no longer think about important concepts like  development speed, maintainability and scalability of code. This may be a good reason to do research up-front.

Another important aspect is the level of familiarity with any preferred programming languages and frameworks within the team that will build the application.

In case of a new stack, we may take these thoughts and convert them into technical requirements.

[comment]: <> (<!-- placeholder for an image -->)

## Mindset

Requirements for an application may change at any time, sometimes very unexpectedly. Change usually doesn’t have to be a bad thing, as long as you’re prepared for it. This is why I believe it’s best to keep architectural decisions quite practical.

Thinking ahead and not skipping over important decisions can end up saving much time. It allows you to imagine the big picture, which in turn will help you choose your tools with more insight. Then, given any collection of tools, you should also be ready to adapt to changing needs and requirements.

It is likely a good idea to start building as soon as possible after some research, to verify whether choices about tools that you have made indeed satisfy the requirements, as you suspected they would.

Make the best decisions you can, based on your current knowledge and continue doing so while moving forward and building your application. These decisions can be  considered informed-enough.

Also, try to accept that some decisions you make now may be superseded by those of the future you. Once you accept that you have made the best decision at the time and that you can change your mind as you learn more, you can let go of negative feelings that could slow you down.

This mindset helps create forward momentum.

## Mental model

Perhaps keeping it practical is easier said than done. It does take a little experience to really keep things practical when there are so many nuances to explore and consider.

Having a mental model is a simple way to not get lost. Over the years I have developed a mental model that contains a few steps to consider when trying to systematically determine the most fitting stack for an application. You may use it as a starting point and remove steps or add your own as you see fit for your projects.

**1. Analysis**

- Requirements
    - Using modal verbs to describe must haves, nice to haves and clarify scope and limitations.

**2. Fundamental choices**

- Should I use code at all?
- Language and frameworks
    - Which languages does my team already know?
    - Which languages offer the most suitable frameworks?
    - Which framework will be at the core of my application?

**3. Technologies**

- User interface
- Data persistence
- Authentication
- Continuous Integration
- Deployment

I would recommend to timebox research for the combined steps. Probably no more than an hour for small projects, and up to a few days for projects that will likely be maintained for over two years.

Keep in mind that decisions don’t have to be written in stone and may be revised as we learn more. And that’s usually a good thing - we’re now spending less time trying to make “perfect” decisions up-front and we’re feeding a healthy mindset of acting on informed-enough decisions based on what we know now.

## Example

I will use Takken.io as a case example to demonstrate one way of interpreting these steps and also to illustrate each step in more detail.

### 1. Analysis

**Application:** Takken.io

**Goal:** A personal blog and a showcase for my hobby projects.

**Requirements:**

*   Easy to change and extend
*   Search engine friendly
*   May not take longer than a weekend or two to set up

**Nice to have:**

*   Categories for blog posts
*   Some design space for custom tools I might be creating
*   Easy to migrate

### 2. Fundamental choices

#### Should I use code at all?

Once requirements are clear, some may be eager to jump into the code editor to get started, where others may look forward to explore the options. I believe it is important to consider existing services that may already offer what you’re trying to achieve. There can be much value in the _work not done_.

In most scenarios you’ll find there are three categories of options:

*   no-code options like Tumblr and Medium,
*   ready-made blogging applications like Wordpress, and
*   building your own.

The technical knowledge that’s required grows with each category respectively.

For this blog I have chosen to build my own, so that it will be easier to create a custom experience, which is something I’m looking to do over time. Since coding is my hobby it’s also fine for me if that means doing a little more work than strictly necessary.

#### Language

Front-end applications usually require JavaScript and are nowadays made easy by libraries like React and Vue making them the de facto choices for highly productive teams. For my simple use-case there’s no reason not to choose from one of these.

Between JavaScript and TypeScript (a superset of the former) I went with TypeScript based on three major selling points:

*   Many errors show up earlier during the development process because of static typing
*   Editor better understands the code, which makes things like autocompletion work much better out of the box
*   Setting up transpilation and linting is a breeze compared to using Babeljs

The community seems to agree, as a [survey]([https://insights.stackoverflow.com/survey/2020#technology-most-loved-dreaded-and-wanted-languages-loved](https://insights.stackoverflow.com/survey/2020#technology-most-loved-dreaded-and-wanted-languages-loved)) by StackOverflow puts TypeScript among the most loved languages.

Python, although capable, was not a great option for the backend because of how useful reusing types between server, client and UI components can be.

#### Runtime

For JavaScript there’s a choice to make about which runtime to use. We’ll quickly look into that too.

Deno will likely take over from Node in a while. I would prefer to use Deno as soon as possible. At the time of writing it does not support some very powerful frameworks just yet, so I’ve gone with Node for now.

#### Framework

Frameworks help you get a lot done quickly at the expense of their learning curve and often some loss of performance.

Over time, I’ve grown in favour of writing code as high-level as possible, while maintaining enough flexibility to achieve my goals. High-level code allows producing features much faster than with low-level code. This is part of why choosing a fitting framework for your project is very important.

There is an excellent comparison of both [frontend frameworks](https://2020.stateofjs.com/en-US/technologies/front-end-frameworks/) and [backend frameworks](https://2020.stateofjs.com/en-US/technologies/back-end-frameworks/) on StateOfJS.com that I highly recommend checking out to get a feel for what is out there.

React was my UI framework of choice because its development team at Facebook has shown their expertise and motivation to continuously improve what they have started, which includes extensive care for the experience of the developers who use their library to build complex UIs.

For the backend Next.js was a great choice because of its server side rendering capability, which is great for Search Engine Optimisation (SEO) purposes.

The more opinionated Gatsby would be an excellent alternative as it is very capable and has GraphQL integrated out of the box. I’ll also keep an eye out for new and upcoming frameworks.

### 3. Technologies

#### User interface

For the blog it would be great to have a visually attractive page that can be found in search engines. Perhaps the posts should also be translatable.

For translations my visitors may just use google translate for now. For SEO I will keep in mind that the meta information about the pages should be properly populated and further optimisations can be checked later.

To create that attractive page, my aim is to be able to customise colors, spacing and typography while keeping a consistent look throughout the application. Picking a design system up-front would most likely save me time later.

##### Design System

A design system is a set of rules and principles that describe how a design should be implemented. Much like with choosing a framework for the core of the application, a design system implementation can help significantly speed up development by not reinventing the wheel through very time consuming tasks.

A great comparison of CSS frameworks can be found on [https://2020.stateofcss.com/en-US/report/](https://2020.stateofcss.com/en-US/report/).

Having tried most of the options listed in the comparison, I ended up with Ant design. Mostly because it offers a lot of functionality out of the box for React and it is relatively easy to customise; through CSS Modules and LESS variables as well as in line styles for quick fixes. It is quite good!

#### Data persistence

Whether it’s being done locally or in the cloud; storing and querying data is an essential part of most applications. Most storage services have significant performance capabilities, so there isn’t going to be the need to worry about it much in this initial phase.

Decide what level of control is needed over the structure of the data, whether other systems may need to use the same data, and who should have ownership. It may also be helpful to consider who will be interacting with the data and how to comply with data privacy laws.

For Takken.io the posts will be written by myself. Readers and reviewers should be able to comment or fix typographic mistakes directly. Feedback or comments should be possible in some kind of comment section, or at least a thumbs up or down with an input field.

The posts can be stored as markdown. As the code of Takken.io is publicly available, readers will be able to place comments and suggest changes to the blog posts directly on GitHub.

Metadata such as likes, dislikes and feedback still needs their own storage and custom implementation in the UI. For that any database or backend-as-a-service will do.

#### Authentication

To keep things simple it may be nice to have the authentication layer and the data layer from the same service, be it a CMS or a database.

Contentful CMS looks truly promising, but has a hard limit after which it would become quite expensive for personal projects and the prospect of hitting that limit feels somewhat discouraging.

Then there is the lightweight option of mongodb using a denormalised schema or one may find an elegant way to use sql databases using Next.js and some library. Vercel is a modern group that supports very big companies and their recommendations were also quite useful. [https://www.google.com/amp/s/vercel.com/docs/solutions/databases.amp](https://www.google.com/amp/s/vercel.com/docs/solutions/databases.amp)

After evaluating which databases would be easiest to use, my choice fell on Firebase firestore in conjunction with reactfire. Reason for choosing this is that it allows for running queries on the client and it gives control over which documents may be accessed based on the authenticated user, if any. Firebase authentication works extremely well and it's also easy to configure.

Firebase firestore works very similar to MongoDB, which can be used to migrate towards in the event that the scale of the application grows beyond optimisation limits. At that point it may be worth investing time in.

#### Continuous Integration

Continuous Integration is about making the process to merge code into the primary branch a lightweight activity. Let's keep our mind on building features instead of worrying about code styles, formatting, merge conflicts, too much; Instead it’s useful to set up a first iteration of a CI workflow before anything else.

Because I am using GitHub for all my projects, I will also use their CI system called GitHub Actions. For Takken.io, the compile step is done through Next.js. After compilation, the result needs to be verified.

Since Vercel has created a ready-to-use action for building and deploying Next.js applications it was the first thing to check. It turned out to be sufficient for a first iteration of the CI for this project as deployments can quickly be checked for correctness. Their plugin supports deployments both for pull requests (feature branches) and the main branch (production), so it also covers the deployment topic. Awesome!

### Outcome

For whoever may be interested; the result of the example case is a template repository called [Simple React App]([https://github.com/webbertakken/simple-react-app](https://github.com/webbertakken/simple-react-app)). The code of Takken.io is based on that and is also [publicly available]([https://github.com/webbertakken/takken.io](https://github.com/webbertakken/takken.io)).

## Conclusion

In order to be ready to adapt to changing requirements and in an effort to maximise the value created, it can often be useful to schedule a session to consider the right tools for the job.

By spending limited time researching up-front, we allow ourselves to make informed-enough decisions and to create forward momentum.

A mental model and timeboxing can help to stay on track, so that we do not end up spending much time on details that may not turn out to be proportionally relevant.

Decisions probably do not need to be written in stone, as many details only become clear during implementation and each iteration offers the opportunity to inspect and adapt.
