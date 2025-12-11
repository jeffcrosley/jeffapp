import { Config } from '@stencil/core'
import { sass } from '@stencil/sass'

export const config: Config = {
	namespace: 'ui-components',
	taskQueue: 'async',
	devServer: {
		reloadStrategy: 'pageReload',
		port: 3334,
		openBrowser: false
	},
	outputTargets: [
		{
			type: 'dist',
			esmLoaderPath: '../loader'
		},
		{
			type: 'dist-custom-elements',
			customElementsExportBehavior:
				'auto-define-custom-elements',
			externalRuntime: false
		},
		{
			type: 'docs-readme'
		}
	],
	plugins: [sass()],
	sourceMap: true,
	testing: {
		browserHeadless: true
	}
}
