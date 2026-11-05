import { DataBlock as SharedDataBlock } from "./SimpleElementBlocks";
export { SimpleElementProperties as DataProperties } from "./SimpleElementProperties";
export function DataBlock(props: React.ComponentProps<typeof SharedDataBlock>) { return <SharedDataBlock {...props} />; }
