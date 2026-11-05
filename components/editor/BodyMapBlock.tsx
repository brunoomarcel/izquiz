import { BodyMapBlock as SharedBodyMapBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as BodyMapProperties } from "./SimpleElementProperties";
export function BodyMapBlock(props: React.ComponentProps<typeof SharedBodyMapBlock>) { return <SharedBodyMapBlock {...props} />; }
