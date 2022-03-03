import * as core from '@actions/core';
import { Client } from '@notionhq/client';
import { getNotionIdsFromText } from './utils';
import github from '@actions/github';

async function run(): Promise<void> {
  try {
    const githubPrBody: string = core.getInput('pr_body');
    const notionPropToUpdate = 'PR';
    const notionSecret: string = core.getInput('notion_secret');
    const githubPrUrl = github?.context?.payload?.pull_request?.html_url;

    if (!githubPrUrl) {
      core.info('Unable to resolve GitHub Pull Request payload.');
      return;
    }

    core.debug(
      `Github event payload: ${JSON.stringify(
        github?.context?.payload?.pull_request
      )}`
    );

    const extractedPageIds = getNotionIdsFromText(githubPrBody);

    if (!extractedPageIds?.length) {
      core.info('No Notion tasks were found in your GitHub Pull Request.');
      return;
    }

    core.debug(
      `Extracted Notion page ids: ${JSON.stringify(extractedPageIds)}`
    );

    if (notionSecret === 'test') {
      core.info('This is a test. Skipping Notion API call.');
      return;
    }

    const notion = new Client({ auth: notionSecret });
    const updateNotionPageTasks = extractedPageIds.map(async pageId =>
      notion.pages.update({
        page_id: pageId,
        properties: {
          [notionPropToUpdate]: githubPrUrl
        }
      })
    );

    await Promise.all(updateNotionPageTasks);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    }
  }
}

run();
