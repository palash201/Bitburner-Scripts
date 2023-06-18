/** @param {NS} ns */
export async function main(ns) {
  let target = ns.args[0];
  let finishTime = ns.args[1];
  let hackTime = ns.args[2];
  let startTime = (finishTime - hackTime);
  await ns.sleep(startTime - Date.now());
  let moneyEarned = await ns.hack(target);
  ns.tprint("Hacked " + target + " for $" + moneyEarned);
}
