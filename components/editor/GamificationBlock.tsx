import { GamificationBlock as SharedGamificationBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as GamificationProperties } from "./SimpleElementProperties";
export function GamificationBlock(props: React.ComponentProps<typeof SharedGamificationBlock>) { return <SharedGamificationBlock {...props} />; }
