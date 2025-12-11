import { bootstrapApplication } from '@angular/platform-browser'
import '@jeffapp/ui-components'
import { prefetchIcons } from '@jeffapp/ui-components'
import { defineCustomElements } from '@jeffapp/ui-components/loader'
import { App } from './app/app'
import { appConfig } from './app/app.config'

prefetchIcons([
	'angular',
	'react',
	'vuedotjs',
	'svelte',
	'typescript',
	'javascript'
])

defineCustomElements()

bootstrapApplication(App, appConfig).catch(
	(err) => console.error(err)
)
