import { Component, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

export type RequestStatus = 'submitted' | 'picked_up' | 'completed'

export interface FeatureRequest {
	id: string
	title: string
	description: string
	status: RequestStatus
	created_at: string
	updated_at: string
}

const STORAGE_KEY = 'sarah_feature_requests'

function load(): FeatureRequest[] {
	try {
		const raw = localStorage.getItem(STORAGE_KEY)
		if (raw) return JSON.parse(raw)
	} catch {
		// ignore
	}
	return []
}

function save(requests: FeatureRequest[]): void {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(requests))
}

const STATUS_LABELS: Record<RequestStatus, string> = {
	submitted: 'Submitted',
	picked_up: 'Picked Up',
	completed: 'Completed',
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

			<!-- ── Request list ── -->
			@if (requests().length === 0) {
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
									@if (req.description && expandedId() !== req.id) {
										<span class="fr-desc-preview">{{ req.description }}</span>
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
									<div class="fr-field">
										<label class="fr-label" [for]="'title-' + req.id">Title</label>
										<input
											[id]="'title-' + req.id"
											class="fr-input"
											type="text"
											[ngModel]="req.title"
											(ngModelChange)="updateField(req.id, 'title', $event)"
										/>
									</div>
									<div class="fr-field">
										<label class="fr-label" [for]="'desc-' + req.id">Description</label>
										<textarea
											[id]="'desc-' + req.id"
											class="fr-textarea"
											rows="3"
											[ngModel]="req.description"
											(ngModelChange)="updateField(req.id, 'description', $event)"
										></textarea>
									</div>
									<div class="fr-status-row">
										<span class="fr-label">Status</span>
										<div class="fr-status-btns">
											@for (s of statusOptions; track s) {
												<button
													class="fr-status-btn fr-status-btn-{{ s }}"
													[class.active]="req.status === s"
													(click)="setStatus(req.id, s)"
												>{{ statusLabels[s] }}</button>
											}
										</div>
									</div>
									<div class="fr-card-actions">
										<button class="fr-delete-btn" (click)="confirmDelete(req.id)">Delete</button>
									</div>
									@if (deleteConfirmId() === req.id) {
										<div class="fr-confirm">
											<span>Delete this request?</span>
											<button class="fr-confirm-yes" (click)="deleteRequest(req.id)">Yes, delete</button>
											<button class="fr-confirm-no" (click)="deleteConfirmId.set(null)">Cancel</button>
										</div>
									}
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
						[ngModel]="newDescription()"
						(ngModelChange)="newDescription.set($event)"
					></textarea>
				</div>
				<button class="fr-submit-btn" [disabled]="!newTitle().trim()" (click)="submitNew()">
					Add Request
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
		}

		/* ── Expanded card body ── */
		.fr-card-body {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
			padding: 0 1rem 1rem;
			border-top: 1px solid var(--color-border);
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

		/* ── Status buttons ── */
		.fr-status-row {
			display: flex;
			flex-direction: column;
			gap: 0.4rem;
		}

		.fr-status-btns {
			display: flex;
			gap: 0.4rem;
			flex-wrap: wrap;
		}

		.fr-status-btn {
			font-size: 0.75rem;
			font-weight: 600;
			padding: 0.3rem 0.65rem;
			border-radius: 20px;
			cursor: pointer;
			transition: all 0.15s;
			border: 1px solid var(--color-border);
			background: var(--color-background);
			color: var(--color-text-secondary);

			&.fr-status-btn-submitted.active {
				background: var(--color-background);
				color: var(--color-text-primary);
				border-color: var(--color-text-secondary);
			}

			&.fr-status-btn-picked_up.active {
				background: rgba(59, 130, 246, 0.12);
				color: #1d4ed8;
				border-color: rgba(59, 130, 246, 0.5);
			}

			&.fr-status-btn-completed.active {
				background: rgba(16, 185, 129, 0.12);
				color: #047857;
				border-color: rgba(16, 185, 129, 0.5);
			}
		}

		/* ── Card actions ── */
		.fr-card-actions {
			display: flex;
			justify-content: flex-end;
		}

		.fr-delete-btn {
			font-size: 0.78rem;
			padding: 0.3rem 0.7rem;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			background: transparent;
			color: var(--color-text-secondary);
			cursor: pointer;

			&:hover {
				border-color: var(--color-error, #e74c3c);
				color: var(--color-error, #e74c3c);
			}
		}

		.fr-confirm {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			font-size: 0.82rem;
			color: var(--color-text-primary);
			background: var(--color-background);
			border: 1px solid var(--color-border);
			border-radius: 8px;
			padding: 0.5rem 0.75rem;
			flex-wrap: wrap;
		}

		.fr-confirm-yes {
			font-size: 0.78rem;
			font-weight: 600;
			padding: 0.25rem 0.6rem;
			border: none;
			border-radius: 6px;
			background: var(--color-error, #e74c3c);
			color: #fff;
			cursor: pointer;
		}

		.fr-confirm-no {
			font-size: 0.78rem;
			padding: 0.25rem 0.6rem;
			border: 1px solid var(--color-border);
			border-radius: 6px;
			background: transparent;
			color: var(--color-text-secondary);
			cursor: pointer;
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
export class FeatureRequestsComponent {
	protected requests = signal<FeatureRequest[]>(load())
	protected expandedId = signal<string | null>(null)
	protected deleteConfirmId = signal<string | null>(null)
	protected newTitle = signal('')
	protected newDescription = signal('')

	readonly statusLabels = STATUS_LABELS
	readonly statusOptions: RequestStatus[] = ['submitted', 'picked_up', 'completed']

	protected toggleExpand(id: string): void {
		if (this.expandedId() === id) {
			this.expandedId.set(null)
			this.deleteConfirmId.set(null)
		} else {
			this.expandedId.set(id)
			this.deleteConfirmId.set(null)
		}
	}

	protected updateField(id: string, field: 'title' | 'description', value: string): void {
		this.mutate((list) =>
			list.map((r) =>
				r.id === id ? { ...r, [field]: value, updated_at: new Date().toISOString() } : r
			)
		)
	}

	protected setStatus(id: string, status: RequestStatus): void {
		this.mutate((list) =>
			list.map((r) =>
				r.id === id ? { ...r, status, updated_at: new Date().toISOString() } : r
			)
		)
	}

	protected confirmDelete(id: string): void {
		this.deleteConfirmId.set(id)
	}

	protected deleteRequest(id: string): void {
		this.mutate((list) => list.filter((r) => r.id !== id))
		this.expandedId.set(null)
		this.deleteConfirmId.set(null)
	}

	protected submitNew(): void {
		const title = this.newTitle().trim()
		if (!title) return
		const now = new Date().toISOString()
		const req: FeatureRequest = {
			id: crypto.randomUUID(),
			title,
			description: this.newDescription().trim(),
			status: 'submitted',
			created_at: now,
			updated_at: now,
		}
		this.mutate((list) => [...list, req])
		this.newTitle.set('')
		this.newDescription.set('')
	}

	protected formatDate(iso: string): string {
		const d = new Date(iso)
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
	}

	private mutate(fn: (list: FeatureRequest[]) => FeatureRequest[]): void {
		this.requests.update((list) => {
			const next = fn(list)
			save(next)
			return next
		})
	}
}
