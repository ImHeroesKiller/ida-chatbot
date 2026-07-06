import { runDemoESLPipeline } from "../packages/esl/pipeline";
import { queryEngine } from "../packages/query/engine";

const result = runDemoESLPipeline();
const pln = queryEngine.organizationActivity({ organization: "PLN" });

console.log("=== ESL Pipeline Demo ===\n");

for (const step of result.pipeline) {
  console.log(
    `  • [${step.artifactType}] rep=${step.representationId.slice(0, 8)}… org=${step.organization ?? "-"}`,
  );
}

console.log(
  `\nGraph: ${result.overview.graph.stats.nodeCount} nodes, ${result.overview.graph.stats.edgeCount} edges`,
);
console.log(`PLN query: found=${pln.found} messages=${pln.signals?.totalMessages ?? 0}`);
console.log(`Attention items: ${result.overview.attentionItems.length}`);
console.log("ESL counts:", result.overview.esl.counts);
console.log("\n✅ ESL vertical slice OK");