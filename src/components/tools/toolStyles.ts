// Tailwind class mappings for tools components
export const toolStyles = {
  container: 'flex flex-col flex-1',
  section: 'border border-white/75 rounded-lg max-w-[360px] p-4 mb-2',
  flexRow: 'flex flex-row flex-1 flex-grow-0 gap-4',
  grow: 'flex-grow',
  flexPanel: 'flex flex-col flex-1 overflow-x-auto',
  codePanel: 'flex-grow',
  formRow: 'flex flex-row flex-1 gap-2 flex-grow-0 items-center [&_input]:p-2',
  borderRed: 'border border-red-500',
} as const
