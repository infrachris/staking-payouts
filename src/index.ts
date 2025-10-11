#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/await-thenable */

import yargs from 'yargs';

import { collect, commission, ls, lsNominators } from './handlers';
import { log } from './logger';

async function main() {
	await yargs
		.options({
			ws: {
				alias: 'w',
				description:
					'The API endpoint to connect to, e.g. wss://kusama-rpc.polkadot.io',
				string: true,
				demandOption: true,
				global: true,
			},
			stashesFile: {
				alias: 'S',
				description:
					'Path to .json file containing an array of the stash addresses to call payouts for.',
				string: true,
				demandOption: false,
				global: true,
			},
			stashes: {
				alias: 's',
				description:
					'Array of stash addresses to call payouts for. Required if not using stashesFile.',
				array: true,
				demandOption: false,
				global: true,
			},
			eraDepth: {
				alias: 'e',
				description:
					'How many eras to check for uncollected payouts.',
				number: true,
				demandOption: false,
				default: 0,
				global: true,
			},
			eraStop: {
				alias: 'stop',
				description:
					'Skip the N newest eras (default: 1 to skip current era only).',
				number: true,
				demandOption: false,
				default: 1,
				global: true,
			},
			maxCalls: {
				alias: 'm',
				description:
					'Maximum payoutStakers calls per batch transaction (default: 3).',
				number: true,
				demandOption: false,
				default: 3,
				global: true,
			},
		})
		.command(
			['collect', '$0'],
			'Collect pending payouts',
			// @ts-ignore
			(yargs) => {
				return yargs.options({
					suriFile: {
						alias: 'u',
						description: 'Path to .txt file containing private key seed.',
						string: true,
						demandOption: true,
					},
				});
			},
			// @ts-ignore
			collect
		)
		// @ts-ignore
		.command('ls', 'List pending payouts', {}, ls)
		.command(
			'lsNominators',
			'List nominators backing the given stashes',
			{},
			// @ts-ignore-
			lsNominators
		)
		.command(
			'commission',
			'List validators with commission under and above the given value',
			// @ts-ignore
			(yargs) => {
				return yargs.options({
					percent: {
						alias: 'p',
						description: 'Commission, expressed as a percent i.e "10" for 10%',
						number: true,
						demandOption: true,
					},
				});
			},
			commission
		)
		.parse();
}

main()
	.then(() => {
		log.info('Exiting ...');
		process.exit(0);
	})
	.catch((err) => {
		log.error(err);
		process.exit(1);
	});
