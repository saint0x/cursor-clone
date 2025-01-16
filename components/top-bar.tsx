import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Settings, MessageSquare, Package, Bug, LayoutPanelLeft, LayoutPanelTopIcon as LayoutPanelBottom, LayoutPanelLeftIcon as LayoutPanelRight } from 'lucide-react'

export function TopBar({ onToggleFileExplorer, onToggleTerminal, onToggleChat }: {
  onToggleFileExplorer: () => void;
  onToggleTerminal: () => void;
  onToggleChat: () => void;
}) {
  return (
    <div className="h-14 border-b flex items-center px-4 bg-background shadow-sm">
      <div className="flex items-center space-x-2">
        <div className="flex space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <div className="w-3 h-3 rounded-full bg-yellow-500" />
          <div className="w-3 h-3 rounded-full bg-green-500" />
        </div>
      </div>
      <div className="flex-1 flex items-center justify-between px-4">
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full">
            <Search className="h-4 w-4" />
          </Button>
          <Input
            className="w-[300px] h-8 bg-muted rounded-full text-sm"
            placeholder="babel-frontend"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleFileExplorer}>
            <LayoutPanelLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full" 
            onClick={onToggleTerminal}
            aria-label="Toggle Terminal"
          >
            <LayoutPanelBottom className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full" onClick={onToggleChat}>
            <LayoutPanelRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="rounded-full">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

