import { PlansBlock as SharedPlansBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as PlansProperties } from "./SimpleElementProperties";
export function PlansBlock(props: React.ComponentProps<typeof SharedPlansBlock>) { return <SharedPlansBlock {...props} />; }
