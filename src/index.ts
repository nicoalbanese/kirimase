#!/usr/bin/env node

import { Command } from 'commander';
import { intro, outro, text, select, confirm, isCancel, spinner } from '@clack/prompts';
import { setTimeout } from 'node:timers/promises';

const program = new Command();

async function init() {
  intro('Welcome to Kirimase CLI');

  const projectName = await text({
    message: 'What is your project name?',
    placeholder: 'my-app',
    validate(value) {
      if (!value) return 'Please enter a project name';
      if (value.length < 2) return 'Project name must be at least 2 characters';
    }
  });

  if (isCancel(projectName)) {
    outro('Operation cancelled');
    process.exit(0);
  }

  const framework = await select({
    message: 'Select a framework',
    options: [
      { value: 'next', label: 'Next.js', hint: 'Full-stack React framework' },
      { value: 'express', label: 'Express', hint: 'Node.js web framework' },
      { value: 'fastify', label: 'Fastify', hint: 'Fast Node.js framework' }
    ]
  });

  if (isCancel(framework)) {
    outro('Operation cancelled');
    process.exit(0);
  }

  const typescript = await confirm({
    message: 'Do you want to use TypeScript?',
    initialValue: true,
  });

  if (isCancel(typescript)) {
    outro('Operation cancelled');
    process.exit(0);
  }

  const s = spinner();
  s.start('Creating your project');

  await setTimeout(2000); // Simulate work

  s.stop('Project created successfully!');

  outro(`✨ Project ${projectName} is ready! Happy coding!`);
}

async function add(packageName: string) {
  const s = spinner();
  s.start(`Adding ${packageName} to your project`);

  await setTimeout(1000); // Simulate work

  s.stop(`Added ${packageName} successfully!`);
}

program
  .name('kirimase')
  .description('A Rails-like CLI for building full-stack Next.js apps faster')
  .version('0.0.60');

program
  .command('init')
  .description('Initialize a new project')
  .action(init);

program
  .command('add')
  .description('Add a package to your project')
  .argument('<package>', 'package to add')
  .action(add);

program.parse();