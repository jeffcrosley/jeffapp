import { Component, signal, computed, inject, ElementRef } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { FamilyMode, FAMILY_MODES, Assignee, ASSIGNEES } from '../../models/family-mode'

interface DolTask {
	id: string
	name: string
	assignments: Record<FamilyMode, Assignee>
}

interface DolCategory {
	id: string
	name: string
	tasks: DolTask[]
}

interface DolState {
	categories: DolCategory[]
}

const STORAGE_KEY = 'jeffapp.divisionOfLabor'

const DEFAULT_ASSIGNMENTS: Record<FamilyMode, Assignee> = {
	green: 'tbd',
	yellow: 'tbd',
	red: 'tbd',
	black: 'tbd',
}

const INITIAL_CATALOG: { category: string; tasks: string[] }[] = [
	{
		category: 'Kids logistics',
		tasks: ['School pickup', 'School dropoff', 'After-school activities', 'Homework help', 'Bedtime routine', 'Morning routine (kids)'],
	},
	{
		category: 'Meals',
		tasks: ['Breakfast', 'Kids lunch prep', 'Dinner planning', 'Dinner execution', 'Groceries'],
	},
	{
		category: 'Household',
		tasks: ['Daily tidy', 'Deep clean', 'Laundry', 'Dishes'],
	},
	{
		category: 'Medical & health',
		tasks: ['Kids appointments', 'Kids medications'],
	},
	{
		category: 'Administrative',
		tasks: ['School communications', 'Activity scheduling', 'Bills & finances'],
	},
	{
		category: 'Social & family',
		tasks: ['Social calendar', 'Extended family coordination'],
	},
]

function buildDefaultState(): DolState {
	return {
		categories: INITIAL_CATALOG.map((cat) => ({
			id: crypto.randomUUID(),
			name: cat.category,
			tasks: cat.tasks.map((t) => ({
				id: crypto.randomUUID(),
				name: t,
				assignments: { ...DEFAULT_ASSIGNMENTS },
			})),
		})),
	}
}

function loadState(): DolState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch {
		// ignore
	}
	return buildDefaultState()
}

function saveState(state: DolState): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

@Component({
	selector: 'app-division-of-labor',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './division-of-labor.component.html',
	styleUrls: ['./division-of-labor.component.scss'],
})
export class DivisionOfLaborComponent {
	private el = inject(ElementRef)

	protected state = signal<DolState>(loadState())
	protected activeMode = signal<FamilyMode>('green')
	protected toastVisible = signal(false)
	protected addingToCategoryId = signal<string | null>(null)
	protected newTaskName = signal('')
	protected showAddCategory = signal(false)
	protected newCategoryName = signal('')

	protected activeModeInfo = computed(() => FAMILY_MODES.find((m) => m.mode === this.activeMode())!)

	readonly FAMILY_MODES = FAMILY_MODES
	readonly ASSIGNEES = ASSIGNEES

	protected setActiveMode(mode: FamilyMode): void {
		this.activeMode.set(mode)
	}

	protected setAssignment(catId: string, taskId: string, value: Assignee): void {
		const mode = this.activeMode()
		this.mutate((s) => ({
			...s,
			categories: s.categories.map((cat) =>
				cat.id !== catId
					? cat
					: {
							...cat,
							tasks: cat.tasks.map((task) =>
								task.id !== taskId
									? task
									: { ...task, assignments: { ...task.assignments, [mode]: value } }
							),
						}
			),
		}))
	}

	protected startAddTask(catId: string): void {
		this.addingToCategoryId.set(catId)
		this.newTaskName.set('')
		setTimeout(() => {
			(this.el.nativeElement.querySelector('.add-task-input') as HTMLInputElement | null)?.focus()
		}, 0)
	}

	protected openAddCategory(): void {
		this.showAddCategory.set(true)
		setTimeout(() => {
			(this.el.nativeElement.querySelector('.add-category-input') as HTMLInputElement | null)?.focus()
		}, 0)
	}

	protected confirmAddTask(catId: string): void {
		const name = this.newTaskName().trim()
		if (!name) {
			this.addingToCategoryId.set(null)
			return
		}
		const task: DolTask = {
			id: crypto.randomUUID(),
			name,
			assignments: { ...DEFAULT_ASSIGNMENTS },
		}
		this.mutate((s) => ({
			...s,
			categories: s.categories.map((cat) =>
				cat.id !== catId ? cat : { ...cat, tasks: [...cat.tasks, task] }
			),
		}))
		this.newTaskName.set('')
		this.addingToCategoryId.set(null)
	}

	protected removeTask(catId: string, taskId: string): void {
		this.mutate((s) => ({
			...s,
			categories: s.categories.map((cat) =>
				cat.id !== catId ? cat : { ...cat, tasks: cat.tasks.filter((t) => t.id !== taskId) }
			),
		}))
	}

	protected confirmAddCategory(): void {
		const name = this.newCategoryName().trim()
		if (!name) {
			this.showAddCategory.set(false)
			return
		}
		const cat: DolCategory = { id: crypto.randomUUID(), name, tasks: [] }
		this.mutate((s) => ({ ...s, categories: [...s.categories, cat] }))
		this.newCategoryName.set('')
		this.showAddCategory.set(false)
	}

	protected exportAndCopy(): void {
		const date = new Date().toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
		const lines: string[] = [`## Division of Labor — ${date}`, '']

		for (const modeInfo of FAMILY_MODES) {
			lines.push(`### ${modeInfo.label} ${modeInfo.emoji}`)
			lines.push('| Task | Assignee |')
			lines.push('|---|---|')
			for (const cat of this.state().categories) {
				for (const task of cat.tasks) {
					const assignee = task.assignments[modeInfo.mode]
					if (assignee === 'none') continue
					const label = ASSIGNEES.find((a) => a.value === assignee)?.label ?? assignee
					lines.push(`| ${task.name} | ${label} |`)
				}
			}
			lines.push('')
		}

		const markdown = lines.join('\n')
		navigator.clipboard.writeText(markdown).catch(() => undefined)
		this.toastVisible.set(true)
		setTimeout(() => this.toastVisible.set(false), 2000)
	}

	private mutate(fn: (s: DolState) => DolState): void {
		this.state.update((s) => {
			const next = fn(s)
			saveState(next)
			return next
		})
	}
}
