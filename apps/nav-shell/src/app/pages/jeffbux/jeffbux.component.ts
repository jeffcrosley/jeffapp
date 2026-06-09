import { Component } from '@angular/core'
import { CommonModule } from '@angular/common'

@Component({
	selector: 'app-jeffbux',
	standalone: true,
	imports: [CommonModule],
	template: `
		<section class="jb-shell">
			<header class="jb-header">
				<span class="jb-icon">💰</span>
				<div>
					<h1>JeffBux</h1>
					<p class="jb-subtitle">Personal financial management</p>
				</div>
			</header>

			<p class="jb-description">
				Track spending, budgets, and financial goals across all accounts.
				JeffBux gives you a unified view of your personal finances and surfaces
				insights to help you make smarter decisions.
			</p>

			<div class="jb-metrics">
				<div class="jb-metric-card">
					<span class="jb-metric-label">Net Worth</span>
					<span class="jb-metric-value">—</span>
					<span class="jb-metric-note">Coming soon</span>
				</div>
				<div class="jb-metric-card">
					<span class="jb-metric-label">Monthly Spending</span>
					<span class="jb-metric-value">—</span>
					<span class="jb-metric-note">Coming soon</span>
				</div>
				<div class="jb-metric-card">
					<span class="jb-metric-label">Budget Remaining</span>
					<span class="jb-metric-value">—</span>
					<span class="jb-metric-note">Coming soon</span>
				</div>
			</div>

			<div class="jb-section">
				<h2 class="jb-section-title">Recent Transactions</h2>
				<div class="jb-table-wrapper">
					<table class="jb-table">
						<thead>
							<tr>
								<th>Date</th>
								<th>Description</th>
								<th>Category</th>
								<th class="jb-th-amount">Amount</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td colspan="4" class="jb-empty-row">Transaction data coming soon</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</section>
	`,
	styles: [`
		.jb-shell {
			max-width: 640px;
			margin: 0 auto;
			padding: 1.5rem 1rem 3rem;
			display: flex;
			flex-direction: column;
			gap: 1.5rem;
		}

		.jb-header {
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

		.jb-icon {
			font-size: 2.5rem;
			line-height: 1;
		}

		.jb-subtitle {
			margin: 0;
			font-size: 0.85rem;
			color: var(--color-text-secondary);
		}

		.jb-description {
			margin: 0;
			font-size: 0.9rem;
			color: var(--color-text-secondary);
			line-height: 1.6;
		}

		.jb-metrics {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
			gap: 0.75rem;
		}

		.jb-metric-card {
			background: var(--color-surface);
			border: 1px solid var(--color-border);
			border-radius: 12px;
			padding: 1.1rem 1rem;
			display: flex;
			flex-direction: column;
			gap: 0.35rem;
		}

		.jb-metric-label {
			font-size: 0.75rem;
			font-weight: 600;
			color: var(--color-text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.04em;
		}

		.jb-metric-value {
			font-size: 1.75rem;
			font-weight: 700;
			color: var(--color-text-primary);
			line-height: 1;
		}

		.jb-metric-note {
			font-size: 0.72rem;
			color: var(--color-text-secondary);
			font-style: italic;
		}

		.jb-section {
			display: flex;
			flex-direction: column;
			gap: 0.75rem;
		}

		.jb-section-title {
			font-size: 1rem;
			font-weight: 600;
			margin: 0;
			color: var(--color-text-primary);
		}

		.jb-table-wrapper {
			border: 1px solid var(--color-border);
			border-radius: 12px;
			overflow: hidden;
		}

		.jb-table {
			width: 100%;
			border-collapse: collapse;
			font-size: 0.88rem;

			th {
				text-align: left;
				padding: 0.7rem 1rem;
				font-size: 0.75rem;
				font-weight: 600;
				color: var(--color-text-secondary);
				background: var(--color-surface);
				border-bottom: 1px solid var(--color-border);
				text-transform: uppercase;
				letter-spacing: 0.04em;
			}

			td {
				padding: 0.7rem 1rem;
				color: var(--color-text-primary);
				border-bottom: 1px solid var(--color-border);

				&:last-child {
					border-bottom: none;
				}
			}
		}

		.jb-th-amount {
			text-align: right !important;
		}

		.jb-empty-row {
			text-align: center !important;
			color: var(--color-text-secondary) !important;
			font-style: italic;
			padding: 2rem 1rem !important;
		}
	`],
})
export class JeffbuxComponent {}
