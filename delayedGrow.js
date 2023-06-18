/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let finishTime = ns.args[1];
  let growTime = ns.args[2];
  let startTime = (finishTime - growTime);
  await ns.sleep(startTime - Date.now());
  let growth = await ns.grow(target);
  ns.tprint("Growed " + target + " by " + growth + "x");
}
