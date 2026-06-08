import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ChecklistItem {
	id: string;
	label: string;
	checked: boolean;
}

interface ChecklistSection {
	id: string;
	title: string;
	emoji: string;
	items: ChecklistItem[];
	collapsed: boolean;
}

const STORAGE_KEY = 'go-bag-checklist';

const DEFAULT_SECTIONS: Omit<ChecklistSection, 'collapsed'>[] = [
	{
		id: 'medications',
		title: 'Medications & Prescriptions',
		emoji: '💊',
		items: [
			{ id: 'med-daily', label: 'All daily medications packed', checked: false },
			{ id: 'med-emergency', label: 'Emergency medications packed', checked: false },
			{ id: 'med-supply', label: 'Enough supply for trip + 5-day buffer', checked: false },
			{ id: 'med-rx-copies', label: 'Prescription copies / documentation', checked: false },
			{ id: 'med-doctor-contact', label: 'Doctor contact info saved', checked: false },
		],
	},
	{
		id: 'medical-supplies',
		title: 'Medical Supplies',
		emoji: '🩺',
		items: [
			{ id: 'sup-compression', label: 'Compression garments (POTS)', checked: false },
			{ id: 'sup-electrolytes', label: 'Electrolyte packets / LMNT supply', checked: false },
			{ id: 'sup-cooling', label: 'Cooling vest / cooling towel', checked: false },
			{ id: 'sup-mobility', label: 'Mobility aids (if needed)', checked: false },
			{ id: 'sup-alert', label: 'Medical alert info / bracelet', checked: false },
		],
	},
	{
		id: 'emergency-contacts',
		title: 'Emergency Contacts',
		emoji: '📞',
		items: [
			{ id: 'ec-beaufort', label: 'Beaufort Memorial Hospital: 843-522-5200 saved', checked: false },
			{ id: 'ec-urgent-care', label: 'Nearest urgent care near Fripp Island confirmed', checked: false },
			{ id: 'ec-jeff', label: "Jeff's numbers current", checked: false },
			{ id: 'ec-grandpa', label: "Grandpa's numbers current", checked: false },
			{ id: 'ec-doctors', label: "Sarah's doctor(s) contact info", checked: false },
			{ id: 'ec-insurance-cards', label: 'Insurance cards scanned / accessible', checked: false },
		],
	},
	{
		id: 'pots-protocols',
		title: 'Heat / POTS Protocols',
		emoji: '🌡️',
		items: [
			{ id: 'pots-hydration', label: 'Aggressive hydration plan confirmed (Fripp heat + humidity)', checked: false },
			{ id: 'pots-pacing', label: 'Activity pacing rules reviewed with Jeff', checked: false },
			{ id: 'pots-rest', label: 'Rest schedule built into trip plan', checked: false },
			{ id: 'pots-crisis-signs', label: 'POTS crisis signs reviewed', checked: false },
			{ id: 'pots-crisis-response', label: 'POTS crisis response plan confirmed', checked: false },
		],
	},
	{
		id: 'mcas-protocols',
		title: 'MCAS Protocols',
		emoji: '🛡️',
		items: [
			{ id: 'mcas-food', label: 'Safe food list for trip prepared', checked: false },
			{ id: 'mcas-antihistamines', label: 'Antihistamines packed', checked: false },
			{ id: 'mcas-epipen', label: 'EpiPen current / not expired', checked: false },
			{ id: 'mcas-triggers', label: 'Known local triggers considered', checked: false },
		],
	},
	{
		id: 'kids-logistics',
		title: 'Kids Logistics',
		emoji: '👧🏻👦🏻',
		items: [
			{ id: 'kids-violet', label: "Violet (9) — summer camp ends July 18 confirmed", checked: false },
			{ id: 'kids-leo', label: 'Leo (2.5) — Montessori substitutes planned for trip', checked: false },
			{ id: 'kids-emergency', label: "Both kids' emergency contacts current", checked: false },
			{ id: 'kids-pediatrician', label: 'Pediatrician contact saved', checked: false },
		],
	},
	{
		id: 'travel-docs',
		title: 'Travel Documents',
		emoji: '🪪',
		items: [
			{ id: 'doc-id', label: 'IDs / licenses packed', checked: false },
			{ id: 'doc-insurance', label: 'Insurance cards (originals or copies)', checked: false },
			{ id: 'doc-medical-docs', label: 'Necessary medical documentation', checked: false },
		],
	},
	{
		id: 'jeff-support',
		title: "Jeff's Support Role",
		emoji: '💙',
		items: [
			{ id: 'jeff-pacing', label: "Committed to pacing — not over-scheduling", checked: false },
			{ id: 'jeff-rest-days', label: 'Rest days built into the schedule', checked: false },
			{ id: 'jeff-heat', label: 'Heat awareness — check in during peak heat hours', checked: false },
			{ id: 'jeff-advocate', label: 'Advocate for Sarah in any medical situation', checked: false },
			{ id: 'jeff-no-guilt', label: "Sarah doesn't need to push through — Jeff has her back", checked: false },
		],
	},
];

@Component({
	selector: 'app-go-bag',
	standalone: true,
	imports: [CommonModule],
	templateUrl: './go-bag.page.html',
	styleUrls: ['./go-bag.page.scss'],
})
export class GoBagPage implements OnInit {
	sections = signal<ChecklistSection[]>([]);

	totalItems = computed(() =>
		this.sections().reduce((sum, s) => sum + s.items.length, 0)
	);

	checkedItems = computed(() =>
		this.sections().reduce(
			(sum, s) => sum + s.items.filter((i) => i.checked).length,
			0
		)
	);

	completionPct = computed(() => {
		const total = this.totalItems();
		return total === 0 ? 0 : Math.round((this.checkedItems() / total) * 100);
	});

	tripReady = computed(() => this.completionPct() === 100);

	ngOnInit(): void {
		this.loadFromStorage();
	}

	toggleItem(sectionId: string, itemId: string): void {
		this.sections.update((sections) =>
			sections.map((section) => {
				if (section.id !== sectionId) return section;
				return {
					...section,
					items: section.items.map((item) =>
						item.id === itemId ? { ...item, checked: !item.checked } : item
					),
				};
			})
		);
		this.saveToStorage();
	}

	toggleSection(sectionId: string): void {
		this.sections.update((sections) =>
			sections.map((s) =>
				s.id === sectionId ? { ...s, collapsed: !s.collapsed } : s
			)
		);
	}

	sectionChecked(section: ChecklistSection): number {
		return section.items.filter((i) => i.checked).length;
	}

	resetAll(): void {
		this.sections.update((sections) =>
			sections.map((s) => ({
				...s,
				items: s.items.map((i) => ({ ...i, checked: false })),
			}))
		);
		this.saveToStorage();
	}

	private loadFromStorage(): void {
		const raw = localStorage.getItem(STORAGE_KEY);
		const checkedIds: Set<string> = raw ? new Set(JSON.parse(raw)) : new Set();

		const loaded: ChecklistSection[] = DEFAULT_SECTIONS.map((s) => ({
			...s,
			collapsed: false,
			items: s.items.map((item) => ({
				...item,
				checked: checkedIds.has(item.id),
			})),
		}));
		this.sections.set(loaded);
	}

	private saveToStorage(): void {
		const checked: string[] = this.sections()
			.flatMap((s) => s.items)
			.filter((i) => i.checked)
			.map((i) => i.id);
		localStorage.setItem(STORAGE_KEY, JSON.stringify(checked));
	}
}
