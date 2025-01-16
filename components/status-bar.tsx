export function StatusBar() {
  return (
    <div className="h-6 border-t bg-muted/50 flex items-center px-4 text-xs text-muted-foreground">
      <div className="flex-1 flex items-center space-x-4">
        <span className="bg-muted px-2 py-0.5 rounded-full">Ln 1, Col 1</span>
        <span className="bg-muted px-2 py-0.5 rounded-full">Spaces: 2</span>
        <span className="bg-muted px-2 py-0.5 rounded-full">UTF-8</span>
        <span className="bg-muted px-2 py-0.5 rounded-full">TypeScript JSX</span>
      </div>
      <div className="flex items-center space-x-4">
        <span className="bg-muted px-2 py-0.5 rounded-full">Cursor Tab</span>
      </div>
    </div>
  )
}

