import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function Terminal() {
  return (
    <div className="h-72 border-t bg-background">
      <Tabs defaultValue="terminal" className="w-full">
        <TabsList className="bg-muted/50 p-0 h-10">
          <TabsTrigger value="problems" className="rounded-none px-4 h-10">PROBLEMS</TabsTrigger>
          <TabsTrigger value="terminal" className="rounded-none px-4 h-10">TERMINAL</TabsTrigger>
          <TabsTrigger value="output" className="rounded-none px-4 h-10">OUTPUT</TabsTrigger>
        </TabsList>
      </Tabs>
      <ScrollArea className="h-[calc(100%-40px)]">
        <div className="p-4 font-mono text-sm space-y-2">
          <div className="text-green-500">✓ GET /200 in 200ms</div>
          <div className="text-green-500">✓ GET /200 in 62ms</div>
          <div className="text-muted-foreground">Compiled in 818ms (1490 modules)</div>
          <div className="text-muted-foreground">Compiled in 718ms (1490 modules)</div>
          <div className="text-muted-foreground">Compiled in 801ms (1490 modules)</div>
          <div className="text-muted-foreground">Compiled in 1023ms (1490 modules)</div>
          <div className="text-muted-foreground">Compiled in 1056ms (1490 modules)</div>
        </div>
      </ScrollArea>
    </div>
  )
}

