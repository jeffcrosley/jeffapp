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
					name: 'Angular',
					icon: '/assets/icons/angular.svg',
					href: 'https://angular.io/'
				},
				{
					name: 'React',
					icon: '/assets/icons/react.svg',
					href: 'https://react.dev/'
				},
				{
					name: 'Stencil',
					icon: '/assets/icons/stencil.svg',
					href: 'https://stenciljs.com/'
				}
			]
		},
		{
			category: 'Backend',
			items: [
				{
					name: 'Node.js',
					icon: '/assets/icons/nodejs.svg',
					href: 'https://nodejs.org/'
				},
				{
					name: 'Express',
					icon: '/assets/icons/express.svg',
					href: 'https://expressjs.com/'
				}
			]
		},
		{
			category: 'Cloud',
			items: [
				{
					name: 'AWS',
					icon: '/assets/icons/aws.svg',
					href: 'https://aws.amazon.com/'
				},
				{
					name: 'Vercel',
					icon: '/assets/icons/vercel.svg',
					href: 'https://vercel.com/'
				}
			]
		},
		{
			category: 'Dev Tools',
			items: [
				{
					name: 'Nx',
					icon: '/assets/icons/nx.svg',
					href: 'https://nx.dev/'
				},
				{
					name: 'Jest',
					icon: '/assets/icons/jest.svg',
					href: 'https://jestjs.io/'
				}
			]
		},
		{
			category: 'AI/ML',
			items: [
				{
					name: 'OpenAI',
					icon: '/assets/icons/openai.svg',
					href: 'https://openai.com/'
				},
				{
					name: 'LangChain',
					icon: '/assets/icons/langchain.svg',
					href: 'https://langchain.com/'
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
