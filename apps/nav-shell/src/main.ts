import { bootstrapApplication } from '@angular/platform-browser'
import '@jeffapp/ui-components'
import { defineCustomElements } from '@jeffapp/ui-components/loader'
import { App } from './app/app'
import { appConfig } from './app/app.config'

defineCustomElements()

bootstrapApplication(App, appConfig).catch(
	(err) => console.error(err)
)
