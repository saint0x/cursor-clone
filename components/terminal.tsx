import dynamic from 'next/dynamic'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TerminalComponent = dynamic(
  () => import('@/components/TerminalComponentImpl').then(mod => mod.TerminalComponentImpl),
  { 
    ssr: false,
    loading: () => (
      <div className="h-72 border-t bg-background">
        <Tabs defaultValue="terminal" className="w-full">
          <TabsList className="bg-muted/50 p-0 h-10">
            <TabsTrigger value="problems" className="rounded-none px-4 h-10">PROBLEMS</TabsTrigger>
            <TabsTrigger value="terminal" className="rounded-none px-4 h-10">TERMINAL</TabsTrigger>
            <TabsTrigger value="output" className="rounded-none px-4 h-10">OUTPUT</TabsTrigger>
          </TabsList>
        </Tabs>
        <ScrollArea className="h-[calc(100%-40px)]">
          <div className="h-full w-full p-2">Loading terminal...</div>
        </ScrollArea>
      </div>
    )
  }
)

export default TerminalComponent
