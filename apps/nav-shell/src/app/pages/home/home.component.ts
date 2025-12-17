import { CommonModule } from '@angular/common'
import {
	Component,
	CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core'
import { RouterModule } from '@angular/router'

@Component({
	selector: 'app-home',
	standalone: true,
	imports: [CommonModule, RouterModule],
	schemas: [CUSTOM_ELEMENTS_SCHEMA],
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent {
	currentYear = new Date().getFullYear()
	skills = [
		{
			category: 'Frontend',
			items: [
				{
					name: 'angular',
					color: 'ruby'
				},
				// {
				// 	name: 'react',
				// 	color: 'sapphire'
				// },
				{
					name: 'stencil',
					color: 'amethyst'
				}
			]
		},
		{
			category: 'Backend',
			items: [
				{
					name: 'nodedotjs',
					color: 'emerald'
				},
				{
					name: 'express',
					color: 'onyx'
				}
			]
		},
		// {
		// 	category: 'Dababase',
		// 	items: [
		// 		{
		// 			name: 'postgresql',
		// 			color: 'topaz'
		// 		},
		// 		{
		// 			name: 'mongodb',
		// 			color: 'peridot'
		// 		}
		// 	]
		// },
		{
			category: 'Dev Tools',
			items: [
				{
					name: 'github',
					color: 'garnet'
				},
				{
					name: 'nx',
					color: 'amethyst'
				},
				{
					name: 'render',
					color: 'onyx'
				}
				// {
				// 	name: 'docker',
				// 	color: 'sapphire'
				// }
			]
		},
		{
			category: 'AI/ML',
			items: [
				{
					name: 'githubcopilot',
					color: 'sapphire'
				},
				{
					name: 'openai',
					color: 'amethyst'
				},
				{
					name: 'googlegemini',
					color: 'topaz'
				},
				{
					name: 'claude',
					color: 'amber'
				}
			]
		}
	]
	highlights = [
		{
			title: 'Built a cross-framework design system',
			description:
				'Created a reusable component library in Stencil, integrated with Angular, React, and more.'
		},
		{
			title: 'Automated CI/CD for monorepos',
			description:
				'Designed and deployed Nx-based pipelines with affected-only deploys and full test coverage.'
		},
		{
			title: 'AI-powered portfolio features',
			description:
				'Integrated OpenAI and LangChain to deliver smart, interactive user experiences.'
		}
	]
}
