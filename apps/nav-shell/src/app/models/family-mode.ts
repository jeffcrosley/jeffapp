export type FamilyMode = 'green' | 'yellow' | 'red' | 'black'

export const FAMILY_MODES: { mode: FamilyMode; label: string; emoji: string; description: string }[] = [
	{ mode: 'green',  emoji: '🟢', label: 'Green',  description: 'Standard operations' },
	{ mode: 'yellow', emoji: '🟡', label: 'Yellow', description: 'Take it easy' },
	{ mode: 'red',    emoji: '🔴', label: 'Red',    description: 'Take it very easy' },
	{ mode: 'black',  emoji: '⚫', label: 'Black',  description: 'Tapped out' },
]

export type Assignee = 'jeff' | 'sarah' | 'grandpa' | 'tbd' | 'none'

export const ASSIGNEES: { value: Assignee; label: string }[] = [
	{ value: 'jeff',    label: 'Jeff' },
	{ value: 'sarah',   label: 'Sarah' },
	{ value: 'grandpa', label: 'Grandpa' },
	{ value: 'tbd',     label: '???' },
	{ value: 'none',    label: 'Skip' },
]
