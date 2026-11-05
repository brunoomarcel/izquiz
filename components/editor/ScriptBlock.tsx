import { ScriptBlock as SharedScriptBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as ScriptProperties } from "./SimpleElementProperties";
export function ScriptBlock(props: React.ComponentProps<typeof SharedScriptBlock>) { return <SharedScriptBlock {...props} />; }
