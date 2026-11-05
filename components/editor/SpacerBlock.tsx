import { SpacerBlock as SharedSpacerBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as SpacerProperties } from "./SimpleElementProperties";
export function SpacerBlock(props: React.ComponentProps<typeof SharedSpacerBlock>) { return <SharedSpacerBlock {...props} />; }
