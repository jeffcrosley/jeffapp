import { Component, OnInit, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { EnvironmentService } from '../../services/environment.service'

export type RequestStatus = 'submitted' | 'picked_up' | 'completed' | 'declined'

export interface FeatureRequest {
	id: string
	title: string
	body: string | null
	status: RequestStatus
	created_at: string
	updated_at: string
	requester_id?: string
	requester_name?: string
	project?: string
	priority?: number
}

interface LegacyRequest {
	id: string
	title: string
	description: string
	status: 'submitted' | 'picked_up' | 'completed'
	created_at: string
	updated_at: string
}

const STORAGE_KEY = 'sarah_feature_requests'

const STATUS_LABELS: Record<RequestStatus, string> = {
	submitted: 'Submitted',
	picked_up: 'Picked Up',
	completed: 'Completed',
	declined: 'Declined',
}

@Component({
	selector: 'app-feature-requests',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<section class="fr-shell">
			<header class="fr-header">
				<span class="fr-icon">✨</span>
				<div>
					<h1>Feature Requests</h1>
					<p class="fr-subtitle">Sarah's wishlist</p>
				</div>
			</header>

			@if (offline()) {
				<div class="fr-offline-banner">
					Offline — changes saved locally and will sync when reconnected.
				</div>
			}

			@if (error()) {
				<div class="fr-error-banner">{{ error() }}</div>
			}

			<!-- ── Request list ── -->
			@if (loading()) {
				<div class="fr-empty">Loading…</div>
			} @else if (requests().length === 0) {
				<div class="fr-empty">No requests yet — add one below</div>
			} @else {
				<div class="fr-list">
					@for (req of requests(); track req.id) {
						<div class="fr-card" [class.expanded]="expandedId() === req.id">
							<div
							class="fr-card-top"
							role="button"
							tabindex="0"
							(click)="toggleExpand(req.id)"
							(keydown.enter)="toggleExpand(req.id)"
							(keydown.space)="$event.preventDefault(); toggleExpand(req.id)"
						>
								<div class="fr-card-main">
									<span class="fr-title">{{ req.title }}</span>
									@if (req.body && expandedId() !== req.id) {
										<span class="fr-desc-preview">{{ req.body }}</span>
									}
								</div>
								<div class="fr-card-meta">
									<span class="fr-pill fr-pill-{{ req.status }}">{{ statusLabels[req.status] }}</span>
									<span class="fr-date">{{ formatDate(req.created_at) }}</span>
									<span class="fr-chevron">{{ expandedId() === req.id ? '▲' : '▼' }}</span>
								</div>
							</div>

							@if (expandedId() === req.id) {
								<div class="fr-card-body">
									@if (req.status === 'submitted') {
										<div class="fr-field">
											<label class="fr-label" [for]="'title-' + req.id">Title</label>
											<input
												[id]="'title-' + req.id"
												class="fr-input"
												type="text"
												[ngModel]="req.title"
												(ngModelChange)="localUpdate(req.id, 'title', $event)"
												(blur)="saveField(req.id, 'title', $event)"
											/>
										</div>
										<div class="fr-field">
											<label class="fr-label" [for]="'desc-' + req.id">Description</label>
											<textarea
												[id]="'desc-' + req.id"
												class="fr-textarea"
												rows="3"
												[ngModel]="req.body ?? ''"
												(ngModelChange)="localUpdate(req.id, 'body', $event)"
												(blur)="saveField(req.id, 'body', $event)"
											></textarea>
										</div>
									} @else {
										@if (req.body) {
											<div class="fr-field">
												<span class="fr-label">Description</span>
												<p class="fr-body-text">{{ req.body }}</p>
											</div>
										}
									}
									<div class="fr-card-meta-detail">
										<span class="fr-label">Submitted</span>
										<span class="fr-date">{{ formatDate(req.created_at) }}</span>
									</div>
								</div>
							}
						</div>
					}
				</div>
			}

			<!-- ── Add form ── -->
			<div class="fr-add-card">
				<h2 class="fr-add-title">Add a request</h2>
				<div class="fr-field">
					<label class="fr-label" for="new-title">Title <span class="fr-required">*</span></label>
					<input
						id="new-title"
						class="fr-input"
						type="text"
						placeholder="What would you like?"
						[ngModel]="newTitle()"
						(ngModelChange)="newTitle.set($event)"
						(keydown.enter)="submitNew()"
					/>
				</div>
				<div class="fr-field">
					<label class="fr-label" for="new-desc">Description</label>
					<textarea
						id="new-desc"
						class="fr-textarea"
						rows="2"
						placeholder="Optional details"
						[ngModel]="newBody()"
						(ngModelChange)="newBody.set($event)"
					></textarea>
				</div>
				<button class="fr-submit-btn" [disabled]="!newTitle().trim() || saving()" (click)="submitNew()">
					{{ saving() ? 'Submitting…' : 'Add Request' }}
				</button>
			</div>
		</section>
	`,
	styles: [`
		.fr-shell {
			max-width: 480px;
			margin: 0 auto;
			padding: 1.5rem 1rem 3rem;
			display: flex;
			flex-direction: column;
			gap: 1.25rem;
		}

		/* ── Header ── */
		.fr-header {
			display: flex;
			align-items: center;
			gap: 1rem;
			padding-bottom: 0.5rem;

			h1 {
				font-size: 1.6rem;
				margin: 0;
				line-height: 1.2;
			}
		}

		.fr-icon {
			font-size: 2.5rem;
			line-height: 1;
		}

		.fr-subtitle {
			margin: 0;
			font-size: 0.85rem;
			color: var(--color-text-secondary);
		}

		/* ── Banners ── */
		.fr-offline-banner {
			font-size: 0.82rem;
			padding: 0.5rem 0.75rem;
			border-radius: 8px;
			background: rgba(245, 158, 11, 0.1);
			border: 1px solid rgba(245, 158, 11, 0.35);
			color: #92400e;
		}

		.fr-error-banner {
			font-size: 0.82rem;
			padding: 0.5rem 0.75rem;
			border-radius: 8px;
			background: rgba(239, 68, 68, 0.1);
			border: 1px solid rgba(239, 68, 68, 0.35);
			color: var(--color-error, #e74c3c);
		}

		/* ── Empty state ── */
		.fr-empty {
			font-size: 0.9rem;
			color: var(--color-text-secondary);
			font-style: italic;
			text-align: center;
			padding: 2rem 1rem;
			border: 1px dashed var(--color-border);
			border-radius: 12px;
		}

		/* ── Card list ── */
		.fr-list {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.fr-card {
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 12px;
			overflow: hidden;
			transition: border-color 0.15s;

			&.expanded {
				border-color: var(--color-primary);
			}
		}

		.fr-card-top {
			display: flex;
			align-items: flex-start;
			justify-content: space-between;
			gap: 0.75rem;
			padding: 0.9rem 1rem;
			cursor: pointer;
			user-select: none;

			&:hover {
				background: var(--color-active);
			}
		}

		.fr-card-main {
			display: flex;
			flex-direction: column;
			gap: 0.2rem;
			min-width: 0;
			flex: 1;
		}

		.fr-title {
			font-size: 0.95rem;
			font-weight: 600;
			color: var(--color-text-primary);
		}

		.fr-desc-preview {
			font-size: 0.8rem;
			color: var(--color-text-secondary);
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}

		.fr-card-meta {
			display: flex;
			flex-direction: column;
			align-items: flex-end;
			gap: 0.3rem;
			flex-shrink: 0;
		}

		.fr-date {
			font-size: 0.72rem;
			color: var(--color-text-secondary);
		}

		.fr-chevron {
			font-size: 0.65rem;
			color: var(--color-text-secondary);
		}

		/* ── Status pills ── */
		.fr-pill {
			font-size: 0.7rem;
			font-weight: 600;
			padding: 0.15rem 0.5rem;
			border-radius: 20px;
			white-space: nowrap;

			&.fr-pill-submitted {
				background: var(--color-background);
				color: var(--color-text-secondary);
				border: 1px solid var(--color-border);
			}

			&.fr-pill-picked_up {
				background: rgba(59, 130, 246, 0.12);
				color: #1d4ed8;
				border: 1px solid rgba(59, 130, 246, 0.3);
			}

			&.fr-pill-completed {
				background: rgba(16, 185, 129, 0.12);
				color: #047857;
				border: 1px solid rgba(16, 185, 129, 0.3);
			}

			&.fr-pill-declined {
				background: rgba(239, 68, 68, 0.1);
				color: #991b1b;
				border: 1px solid rgba(239, 68, 68, 0.3);
			}
		}

		/* ── Expanded card body ── */
		.fr-card-body {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			padding: 0 1rem 1rem;
			border-top: 1px solid var(--color-border);
		}

		.fr-card-meta-detail {
			display: flex;
			align-items: center;
			gap: 0.5rem;
		}

		.fr-body-text {
			font-size: 0.88rem;
			color: var(--color-text-primary);
			margin: 0;
			line-height: 1.4;
		}

		.fr-field {
			display: flex;
			flex-direction: column;
			gap: 0.25rem;
		}

		.fr-label {
			font-size: 0.78rem;
			font-weight: 600;
			color: var(--color-text-secondary);
		}

		.fr-required {
			color: var(--color-error, #e74c3c);
		}

		.fr-input {
			font-size: 0.9rem;
			padding: 0.45rem 0.7rem;
			border: 1px solid var(--color-border);
			border-radius: 8px;
			background: var(--color-background);
			color: var(--color-text-primary);
			font-family: inherit;

			&:focus {
				outline: none;
				border-color: var(--color-primary);
			}
		}

		.fr-textarea {
			font-size: 0.88rem;
			padding: 0.45rem 0.7rem;
			border: 1px solid var(--color-border);
			border-radius: 8px;
			background: var(--color-background);
			color: var(--color-text-primary);
			font-family: inherit;
			resize: vertical;
			line-height: 1.4;

			&:focus {
				outline: none;
				border-color: var(--color-primary);
			}
		}

		/* ── Add form card ── */
		.fr-add-card {
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 12px;
			padding: 1.25rem;
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.fr-add-title {
			font-size: 1rem;
			font-weight: 600;
			margin: 0;
			color: var(--color-text-primary);
		}

		.fr-submit-btn {
			font-size: 0.88rem;
			font-weight: 600;
			padding: 0.55rem;
			border: none;
			border-radius: 8px;
			background: var(--color-primary);
			color: #fff;
			cursor: pointer;
			margin-top: 0.15rem;

			&:hover:not(:disabled) {
				filter: brightness(1.1);
			}

			&:disabled {
				opacity: 0.45;
				cursor: not-allowed;
			}
		}
	`],
})
export class FeatureRequestsComponent implements OnInit {
	private env = inject(EnvironmentService)

	protected requests = signal<FeatureRequest[]>([])
	protected loading = signal(true)
	protected offline = signal(false)
	protected saving = signal(false)
	protected error = signal<string | null>(null)
	protected expandedId = signal<string | null>(null)
	protected newTitle = signal('')
	protected newBody = signal('')

	readonly statusLabels = STATUS_LABELS

	async ngOnInit(): Promise<void> {
		await this.loadFromApi()
	}

	private apiBase(): string {
		return this.env.getApiGatewayUrl()
	}

	private async loadFromApi(): Promise<void> {
		this.loading.set(true)
		try {
			const res = await fetch(`${this.apiBase()}/api/feature-requests`, { credentials: 'include' })
			if (!res.ok) {
				this.fallbackToLocalStorage()
				return
			}
			const data = await res.json() as { items: FeatureRequest[]; total: number }

			if (data.items.length === 0) {
				const legacy = this.readLocalStorage()
				if (legacy.length > 0) {
					await this.migrateFromLocalStorage(legacy)
					return
				}
			}

			this.requests.set(data.items)
			this.offline.set(false)
		} catch {
			this.fallbackToLocalStorage()
		} finally {
			this.loading.set(false)
		}
	}

	private readLocalStorage(): LegacyRequest[] {
		try {
			const raw = localStorage.getItem(STORAGE_KEY)
			if (raw) return JSON.parse(raw) as LegacyRequest[]
		} catch {
			// ignore
		}
		return []
	}

	private fallbackToLocalStorage(): void {
		const legacy = this.readLocalStorage()
		this.requests.set(legacy.map(l => ({
			id: l.id,
			title: l.title,
			body: l.description || null,
			status: l.status,
			created_at: l.created_at,
			updated_at: l.updated_at,
		})))
		this.offline.set(true)
		this.loading.set(false)
	}

	private async migrateFromLocalStorage(legacy: LegacyRequest[]): Promise<void> {
		const migrated: FeatureRequest[] = []
		for (const item of legacy) {
			try {
				const res = await fetch(`${this.apiBase()}/api/feature-requests`, {
					method: 'POST',
					credentials: 'include',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ title: item.title, body: item.description || undefined }),
				})
				if (res.ok) migrated.push(await res.json() as FeatureRequest)
			} catch {
				// skip failed items
			}
		}
		localStorage.removeItem(STORAGE_KEY)
		this.requests.set(migrated)
		this.loading.set(false)
	}

	protected async submitNew(): Promise<void> {
		const title = this.newTitle().trim()
		if (!title || this.saving()) return

		this.saving.set(true)
		this.error.set(null)

		if (this.offline()) {
			const now = new Date().toISOString()
			this.requests.update(list => [{
				id: crypto.randomUUID(),
				title,
				body: this.newBody().trim() || null,
				status: 'submitted' as RequestStatus,
				created_at: now,
				updated_at: now,
			}, ...list])
			this.saveLocalStorage()
			this.newTitle.set('')
			this.newBody.set('')
			this.saving.set(false)
			return
		}

		try {
			const res = await fetch(`${this.apiBase()}/api/feature-requests`, {
				method: 'POST',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title, body: this.newBody().trim() || undefined }),
			})
			if (!res.ok) {
				const err = await res.json() as { error?: string }
				this.error.set(err.error ?? 'Failed to submit request')
				return
			}
			const created = await res.json() as FeatureRequest
			this.requests.update(list => [created, ...list])
			this.newTitle.set('')
			this.newBody.set('')
		} catch {
			this.error.set('Network error — request not saved')
		} finally {
			this.saving.set(false)
		}
	}

	protected localUpdate(id: string, field: 'title' | 'body', value: string): void {
		this.requests.update(list =>
			list.map(r => r.id === id ? { ...r, [field]: value } : r)
		)
	}

	protected async saveField(id: string, field: 'title' | 'body', event: FocusEvent): Promise<void> {
		const value = (event.target as HTMLInputElement | HTMLTextAreaElement).value

		if (this.offline()) {
			this.saveLocalStorage()
			return
		}

		try {
			const res = await fetch(`${this.apiBase()}/api/feature-requests/${id}`, {
				method: 'PATCH',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ [field]: value }),
			})
			if (res.ok) {
				const updated = await res.json() as FeatureRequest
				this.requests.update(list => list.map(r => r.id === id ? updated : r))
			}
		} catch {
			// local state already updated by localUpdate
		}
	}

	protected toggleExpand(id: string): void {
		this.expandedId.set(this.expandedId() === id ? null : id)
	}

	protected formatDate(iso: string): string {
		const d = new Date(iso)
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}

	private saveLocalStorage(): void {
		const data = this.requests().map(r => ({
			id: r.id,
			title: r.title,
			description: r.body ?? '',
			status: r.status,
			created_at: r.created_at,
			updated_at: r.updated_at,
		}))
		localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
	}
}
