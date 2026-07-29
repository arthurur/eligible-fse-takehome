export function AppHeader() {
  return (
    <header className="border-b border-[#d9dde5] bg-white">
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <div className="grid size-9 place-items-center rounded-xl bg-[#1637d6] text-sm font-bold text-white shadow-[0_5px_14px_rgba(22,55,214,0.22)]">
            CV
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[-0.01em] text-[#172033]">Cohort Viewer</p>
            <p className="text-xs text-[#667085]">Customer experience operations</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-[#475467]">
          <span className="size-2 rounded-full bg-[#12a150] shadow-[0_0_0_3px_rgba(18,161,80,0.12)]" />
          Query service
        </div>
      </div>
    </header>
  )
}
