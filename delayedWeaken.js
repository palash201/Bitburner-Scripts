/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let finishTime = ns.args[1];
  let weakenTime = ns.args[2];
  let startTime = (finishTime - weakenTime);
  await ns.sleep(startTime - Date.now());
  let reduction = await ns.weaken(target);
  ns.tprint("Weakened " + target + " by " + reduction);
}
