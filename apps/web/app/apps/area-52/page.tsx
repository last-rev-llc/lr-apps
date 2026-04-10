import { getExperiments } from "./lib/queries";
import { Area52App } from "./components/area-52-app";

export const dynamic = "force-dynamic";

export default async function Area52Page() {
  const experiments = await getExperiments();
  return <Area52App initialExperiments={experiments} />;
}
