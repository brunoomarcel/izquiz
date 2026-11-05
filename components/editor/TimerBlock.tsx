import { TimerBlock as SharedTimerBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as TimerProperties } from "./SimpleElementProperties";
export function TimerBlock(props: React.ComponentProps<typeof SharedTimerBlock>) { return <SharedTimerBlock {...props} />; }
