import { Component, signal, computed, OnInit } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

export type AvailabilityStatus = 'green' | 'yellow' | 'red'
export type PickupStatus = 'confirmed' | 'covered' | 'needs-arrangement'
export type CoverageType = 'pickup' | 'care-shift' | 'errand'

export interface DaySchedule {
	day: string
	date: string
	pickupStatus: PickupStatus
}

export interface CoverageRequest {
	id: string
	date: string
	description: string
	requestedAt: string
}

export interface ActivityEntry {
	id: string
	date: string
	type: CoverageType
	duration: string
	notes: string
}

interface GrandpaState {
	availability: AvailabilityStatus
	lastContact: string | null
	notes: string
	blockedDates: string[]
	coverageRequests: CoverageRequest[]
	activityLog: ActivityEntry[]
	weekSchedule: DaySchedule[]
}

const STORAGE_KEY = 'grandpa_state'

const PICKUP_LABELS: Record<PickupStatus, string> = {
	confirmed: 'Confirmed',
	covered: 'Covered',
	'needs-arrangement': 'Needs Arrangement',
}

const COVERAGE_TYPE_LABELS: Record<CoverageType, string> = {
	pickup: 'Pickup',
	'care-shift': 'Care Shift',
	errand: 'Errand',
}

function buildWeekSchedule(): DaySchedule[] {
	const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
	const today = new Date()
	const dayOfWeek = today.getDay()
	const monday = new Date(today)
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
	monday.setDate(today.getDate() + daysToMonday)

	return days.map((day, i) => {
		const d = new Date(monday)
		d.setDate(monday.getDate() + i)
		return {
			day,
			date: d.toISOString().split('T')[0],
			pickupStatus: 'needs-arrangement',
		}
	})
}

function loadState(): GrandpaState {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch {
		// ignore
	}
	return {
		availability: 'green',
		lastContact: null,
		notes: '',
		blockedDates: [],
		coverageRequests: [],
		activityLog: [],
		weekSchedule: buildWeekSchedule(),
	}
}

function saveState(state: GrandpaState): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

@Component({
	selector: 'app-grandpa',
	standalone: true,
	imports: [CommonModule, FormsModule],
	templateUrl: './grandpa.component.html',
	styleUrls: ['./grandpa.component.scss'],
})
export class GrandpaComponent implements OnInit {
	protected state = signal<GrandpaState>(loadState())

	protected newLogEntry = signal<Omit<ActivityEntry, 'id'>>({
		date: new Date().toISOString().split('T')[0],
		type: 'pickup',
		duration: '',
		notes: '',
	})
	protected showLogForm = signal(false)
	protected requestNote = signal('')

	protected schedule = computed(() => this.state().weekSchedule)
	protected activityLog = computed(() => [...this.state().activityLog].reverse())
	protected coverageRequests = computed(() => this.state().coverageRequests)

	readonly pickupStatusLabels = PICKUP_LABELS
	readonly coverageTypeLabels = COVERAGE_TYPE_LABELS
	readonly availabilityOptions: { value: AvailabilityStatus; label: string; emoji: string }[] = [
		{ value: 'green', label: 'Available', emoji: '🟢' },
		{ value: 'yellow', label: 'Limited', emoji: '🟡' },
		{ value: 'red', label: 'Unavailable', emoji: '🔴' },
	]
	readonly coverageTypes: CoverageType[] = ['pickup', 'care-shift', 'errand']

	ngOnInit(): void {
		const state = this.state()
		const storedWeek = state.weekSchedule[0]?.date
		const expectedWeek = buildWeekSchedule()[0]?.date
		if (storedWeek !== expectedWeek) {
			this.mutate((s) => ({ ...s, weekSchedule: buildWeekSchedule() }))
		}
	}

	protected setAvailability(status: AvailabilityStatus): void {
		this.mutate((s) => ({
			...s,
			availability: status,
			lastContact: new Date().toISOString(),
		}))
	}

	protected saveNotes(notes: string): void {
		this.mutate((s) => ({ ...s, notes }))
	}

	protected setPickupStatus(date: string, status: PickupStatus): void {
		this.mutate((s) => ({
			...s,
			weekSchedule: s.weekSchedule.map((d) =>
				d.date === date ? { ...d, pickupStatus: status } : d
			),
		}))
	}

	protected requestCoverage(): void {
		const note = this.requestNote().trim()
		const entry: CoverageRequest = {
			id: crypto.randomUUID(),
			date: new Date().toISOString().split('T')[0],
			description: note || 'Coverage requested',
			requestedAt: new Date().toISOString(),
		}
		this.mutate((s) => ({
			...s,
			coverageRequests: [...s.coverageRequests, entry],
		}))
		this.requestNote.set('')
	}

	protected removeCoverageRequest(id: string): void {
		this.mutate((s) => ({
			...s,
			coverageRequests: s.coverageRequests.filter((r) => r.id !== id),
		}))
	}

	protected submitLogEntry(): void {
		const entry = this.newLogEntry()
		if (!entry.date || !entry.duration) return
		const full: ActivityEntry = { ...entry, id: crypto.randomUUID() }
		this.mutate((s) => ({
			...s,
			activityLog: [...s.activityLog, full],
		}))
		this.newLogEntry.set({
			date: new Date().toISOString().split('T')[0],
			type: 'pickup',
			duration: '',
			notes: '',
		})
		this.showLogForm.set(false)
	}

	protected updateNewEntry<K extends keyof Omit<ActivityEntry, 'id'>>(
		key: K,
		value: Omit<ActivityEntry, 'id'>[K]
	): void {
		this.newLogEntry.update((e) => ({ ...e, [key]: value }))
	}

	protected formatDate(iso: string): string {
		const d = new Date(iso + 'T12:00:00')
		return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
	}

	protected timeAgo(iso: string): string {
		const diff = Date.now() - new Date(iso).getTime()
		const mins = Math.floor(diff / 60_000)
		if (mins < 1) return 'just now'
		if (mins < 60) return `${mins}m ago`
		const hours = Math.floor(mins / 60)
		if (hours < 24) return `${hours}h ago`
		const days = Math.floor(hours / 24)
		return `${days}d ago`
	}

	protected isToday(date: string): boolean {
		return date === new Date().toISOString().split('T')[0]
	}

	private mutate(fn: (s: GrandpaState) => GrandpaState): void {
		this.state.update((s) => {
			const next = fn(s)
			saveState(next)
			return next
		})
	}
}
